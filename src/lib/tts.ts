// Vietnamese Text-to-Speech using Web Speech API
// Supports male/female voice selection and emotion-based pitch/rate

export type VoicePref = "female" | "male";
export type Emotion = "neutral" | "happy" | "sad" | "pain";

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  if (cachedVoices && cachedVoices.length) return cachedVoices;
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

// Refresh voices when they load asynchronously (Chrome quirk)
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function listVietnameseVoices(): SpeechSynthesisVoice[] {
  return getVoices().filter((v) => v.lang.toLowerCase().startsWith("vi"));
}

function pickVoice(pref: VoicePref): SpeechSynthesisVoice | null {
  const viVoices = listVietnameseVoices();
  if (viVoices.length === 0) {
    // Fallback to any voice; flag the user later
    const all = getVoices();
    return all[0] ?? null;
  }
  // Heuristic: name contains 'female'/'male' or known names
  const femaleHints = ["female", "nữ", "linh", "thu", "hoai", "an"];
  const maleHints = ["male", "nam", "quang", "minh"];
  const hints = pref === "female" ? femaleHints : maleHints;
  const matched = viVoices.find((v) =>
    hints.some((h) => v.name.toLowerCase().includes(h)),
  );
  // If browser exposes only one VN voice, use it; otherwise default index
  if (matched) return matched;
  if (pref === "male" && viVoices.length > 1) return viVoices[1];
  return viVoices[0];
}

function emotionParams(emotion: Emotion): { pitch: number; rate: number } {
  switch (emotion) {
    case "happy": return { pitch: 1.25, rate: 1.05 };
    case "sad":   return { pitch: 0.85, rate: 0.85 };
    case "pain":  return { pitch: 0.8, rate: 0.8 };
    default:      return { pitch: 1.05, rate: 0.95 };
  }
}

export function speak(text: string, opts?: { voice?: VoicePref; emotion?: Emotion }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // interrupt any prior utterance
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "vi-VN";
  const voice = pickVoice(opts?.voice ?? "female");
  if (voice) u.voice = voice;
  const { pitch, rate } = emotionParams(opts?.emotion ?? "neutral");
  u.pitch = pitch;
  u.rate = rate;
  u.volume = 1;
  synth.speak(u);
}

export function hasVietnameseVoice(): boolean {
  return listVietnameseVoices().length > 0;
}
