// Client-side recording cleanup: trims leading/trailing silence, normalizes
// loudness and applies short fades so parent voice clips sound tight.

export interface TrimResult {
  blob: Blob;
  originalMs: number;
  trimmedMs: number;
}

function encodeWav(channel: Float32Array, sampleRate: number): Blob {
  const bytes = channel.length * 2;
  const buffer = new ArrayBuffer(44 + bytes);
  const view = new DataView(buffer);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, bytes, true);
  let off = 44;
  for (let i = 0; i < channel.length; i++) {
    const s = Math.max(-1, Math.min(1, channel[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Trim silence from both ends of a recording.
 * thresholdDb: level (relative to peak) considered silence.
 * padMs: keep a small amount of room tone so speech isn't clipped.
 */
export async function trimSilence(
  input: Blob,
  { thresholdDb = -38, padMs = 60 }: { thresholdDb?: number; padMs?: number } = {},
): Promise<TrimResult> {
  const arrayBuffer = await input.arrayBuffer();
  const AC: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    await ctx.close();
    return { blob: input, originalMs: 0, trimmedMs: 0 };
  }
  const sr = decoded.sampleRate;
  const originalMs = decoded.duration * 1000;

  // Mix down to mono
  const len = decoded.length;
  const mono = new Float32Array(len);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const data = decoded.getChannelData(ch);
    for (let i = 0; i < len; i++) mono[i] += data[i] / decoded.numberOfChannels;
  }
  await ctx.close();

  // RMS envelope over 10ms windows
  const win = Math.max(1, Math.floor(sr * 0.01));
  const frames = Math.ceil(len / win);
  const rms = new Float32Array(frames);
  let peak = 0;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const start = f * win;
    const end = Math.min(len, start + win);
    for (let i = start; i < end; i++) sum += mono[i] * mono[i];
    rms[f] = Math.sqrt(sum / Math.max(1, end - start));
    if (rms[f] > peak) peak = rms[f];
  }
  if (peak <= 0) return { blob: input, originalMs, trimmedMs: originalMs };

  const threshold = peak * Math.pow(10, thresholdDb / 20);
  let firstFrame = 0;
  while (firstFrame < frames && rms[firstFrame] < threshold) firstFrame++;
  let lastFrame = frames - 1;
  while (lastFrame > firstFrame && rms[lastFrame] < threshold) lastFrame--;
  if (firstFrame >= lastFrame) return { blob: input, originalMs, trimmedMs: originalMs };

  const pad = Math.floor((padMs / 1000) * sr);
  const start = Math.max(0, firstFrame * win - pad);
  const end = Math.min(len, (lastFrame + 1) * win + pad);
  const out = mono.slice(start, end);

  // Normalize to -1 dBFS
  let outPeak = 0;
  for (let i = 0; i < out.length; i++) outPeak = Math.max(outPeak, Math.abs(out[i]));
  if (outPeak > 0) {
    const gain = Math.min(4, 0.89 / outPeak);
    for (let i = 0; i < out.length; i++) out[i] *= gain;
  }

  // 15ms fade in/out to avoid clicks
  const fade = Math.min(Math.floor(sr * 0.015), Math.floor(out.length / 2));
  for (let i = 0; i < fade; i++) {
    out[i] *= i / fade;
    out[out.length - 1 - i] *= i / fade;
  }

  return {
    blob: encodeWav(out, sr),
    originalMs,
    trimmedMs: (out.length / sr) * 1000,
  };
}
