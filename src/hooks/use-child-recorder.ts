import { useCallback, useEffect, useRef, useState } from "react";
import { trimSilence } from "@/lib/audio-trim";

export interface ChildClip {
  url: string;
  blob: Blob;
  seconds: number;
}

/**
 * Ghi âm giọng bé trong lúc "AI lắng nghe".
 * - Theo dõi mức âm để biết bé có bật âm hay không (voiced).
 * - Khi dừng: tự cắt quãng lặng + chuẩn hoá âm lượng rồi trả về clip nghe lại được.
 */
export function useChildRecorder() {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [voiced, setVoiced] = useState(false);
  const [supported, setSupported] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAt = useRef(0);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
    setLevel(0);
    setRecording(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      setVoiced(false);

      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(200);
      recRef.current = rec;
      startedAt.current = Date.now();
      setRecording(true);

      const AC: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 6));
        if (rms > 0.045) setVoiced(true);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch {
      setSupported(false);
      cleanup();
      return false;
    }
  }, [cleanup]);

  const stop = useCallback(async (): Promise<ChildClip | null> => {
    const rec = recRef.current;
    if (!rec) {
      cleanup();
      return null;
    }
    const blob = await new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }));
      try {
        rec.stop();
      } catch {
        resolve(new Blob(chunksRef.current));
      }
    });
    const rawSeconds = (Date.now() - startedAt.current) / 1000;
    cleanup();
    if (blob.size < 1200) return null;
    try {
      const trimmed = await trimSilence(blob, { thresholdDb: -36, padMs: 80 });
      return {
        blob: trimmed.blob,
        url: URL.createObjectURL(trimmed.blob),
        seconds: Math.max(0.5, Math.round((trimmed.trimmedMs || rawSeconds * 1000) / 100) / 10),
      };
    } catch {
      return { blob, url: URL.createObjectURL(blob), seconds: Math.round(rawSeconds * 10) / 10 };
    }
  }, [cleanup]);

  return { start, stop, recording, level, voiced, supported };
}
