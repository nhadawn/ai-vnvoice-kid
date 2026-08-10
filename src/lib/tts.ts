// Vietnamese Text-to-Speech using Web Speech API
// Strict vi-VN selection so pronunciation matches Vietnamese phonology.

export type VoicePref = "female" | "male";
export type Emotion = "neutral" | "happy" | "sad" | "pain";

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let warnedNoViVoice = false;

function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  if (cachedVoices && cachedVoices.length) return cachedVoices;
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function listVietnameseVoices(): SpeechSynthesisVoice[] {
  return getVoices().filter((v) => v.lang.toLowerCase().startsWith("vi"));
}

// Prefer higher-fidelity engines (neural/online voices articulate tones better).
function voiceQuality(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (n.includes("natural") || n.includes("neural")) s += 4;
  if (n.includes("google")) s += 3;
  if (n.includes("microsoft")) s += 2;
  if (n.includes("premium") || n.includes("enhanced")) s += 2;
  if (!v.localService) s += 1; // cloud voices are usually clearer
  if (n.includes("compact") || n.includes("espeak")) s -= 3;
  return s;
}

function pickVoice(pref: VoicePref): SpeechSynthesisVoice | null {
  const viVoices = [...listVietnameseVoices()].sort((a, b) => voiceQuality(b) - voiceQuality(a));
  if (viVoices.length === 0) return null; // strict: never use non-VN voice
  const femaleHints = ["female", "nữ", "linh", "thu", "hoai", "an", "hoa", "mai", "hoaimy", "namminh"];
  const maleHints = ["male", "nam", "quang", "minh", "tuan", "duc", "nammminh"];
  const hints = pref === "female" ? femaleHints : maleHints;
  const matched = viVoices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  if (matched) return matched;
  if (pref === "male" && viVoices.length > 1) return viVoices[1];
  return viVoices[0];
}

function emotionParams(emotion: Emotion): { pitch: number; rate: number } {
  // Slower than 1.0 so each Vietnamese syllable & tone is fully articulated,
  // pitch kept near 1.0 to avoid distorting tones ("tròn vành rõ chữ").
  switch (emotion) {
    case "happy": return { pitch: 1.05, rate: 0.86 };
    case "sad":   return { pitch: 0.96, rate: 0.8 };
    case "pain":  return { pitch: 0.94, rate: 0.8 };
    default:      return { pitch: 1.0, rate: 0.84 };
  }
}

/**
 * Make articulation clearer: normalize whitespace and insert light pauses
 * between words so syllables are not slurred together.
 */
function clarify(text: string): string {
  const words = text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (words.length <= 1) return words.join(" ");
  return words.join(", ") + ".";
}


export function speak(text: string, opts?: { voice?: VoicePref; emotion?: Emotion }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = pickVoice(opts?.voice ?? "female");
  if (!voice) {
    if (!warnedNoViVoice) {
      warnedNoViVoice = true;
      console.warn("[TTS] Không tìm thấy giọng tiếng Việt trên trình duyệt này. Hãy cài thêm giọng vi-VN.");
      try {
        import("sonner").then(({ toast }) => {
          toast.warning("Trình duyệt chưa có giọng tiếng Việt. Vui lòng cài đặt giọng vi-VN trong hệ điều hành.");
        });
      } catch { /* noop */ }
    }
    return; // strict: do not speak with a non-Vietnamese voice
  }
  const u = new SpeechSynthesisUtterance(clarify(text));
  u.lang = "vi-VN";
  u.voice = voice;
  const { pitch, rate } = emotionParams(opts?.emotion ?? "neutral");
  u.pitch = pitch;
  u.rate = rate;
  u.volume = 1;
  if (synth.paused) synth.resume();
  synth.speak(u);

}

// Play a recorded parent-voice audio URL. Returns a promise that resolves when it ends.
export function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    try {
      window.speechSynthesis?.cancel();
    } catch { /* noop */ }
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("audio error"));
    audio.play().catch(reject);
  });
}

// Speak a sequence: if a card has a recorded audio, play it; otherwise TTS its label.
export async function speakSequence(
  items: { label: string; audioUrl?: string | null }[],
  opts?: { voice?: VoicePref; emotion?: Emotion; joinText?: string },
) {
  const hasAnyRecording = items.some((i) => i.audioUrl);
  if (!hasAnyRecording) {
    speak(opts?.joinText ?? items.map((i) => i.label).join(" "), opts);
    return;
  }
  for (const it of items) {
    if (it.audioUrl) {
      try { await playAudioUrl(it.audioUrl); continue; } catch { /* fallback to TTS */ }
    }
    await new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
      const voice = pickVoice(opts?.voice ?? "female");
      if (!voice) { speak(it.label, opts); return resolve(); }
      const u = new SpeechSynthesisUtterance(it.label);
      u.lang = "vi-VN";
      u.voice = voice;
      const { pitch, rate } = emotionParams(opts?.emotion ?? "neutral");
      u.pitch = pitch; u.rate = rate; u.volume = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  }
}

export function hasVietnameseVoice(): boolean {
  return listVietnameseVoices().length > 0;
}

// SOS alarm — synthesized via WebAudio so no asset is required.
let sosCtx: AudioContext | null = null;
export function playSOS(durationMs = 2500) {
  if (typeof window === "undefined") return;
  try {
    sosCtx = sosCtx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const ctx = sosCtx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);
    // Two-tone siren (alternating 880Hz / 660Hz)
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.connect(gain);
    const period = 0.35;
    let t = now;
    const end = now + durationMs / 1000;
    while (t < end) {
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(660, t + period / 2);
      t += period;
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    gain.gain.setValueAtTime(0.35, end - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.start(now);
    osc.stop(end + 0.05);
  } catch (e) {
    console.warn("[SOS] Không phát được âm cảnh báo", e);
  }
  // Also speak the alert in Vietnamese if voice available
  speak("Cứu con với! Con cần giúp đỡ!", { voice: "female", emotion: "pain" });
}
