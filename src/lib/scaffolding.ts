// Scaffolding AI — Progressive Vietnamese sentence building.
// Suggests the next slot to fill given the WHOLE current utterance, the
// child's scaffold level, time of day, and n-gram history.
//
// Canonical Vietnamese order: [Chủ ngữ/Cụm] [Động từ] [Danh từ] [Tính từ]
//   e.g. "ăn"  →  "Con ăn"  →  "Con ăn cơm"  →  "Con muốn ăn cơm"

import type { Card, PartOfSpeech, ScaffoldLevel } from "./aac-types";

export interface ScaffoldSuggestion {
  cards: Card[];
  text: string;
  level: ScaffoldLevel;
  rationale: string;
}

export interface ScaffoldHint {
  candidates: Card[];       // ranked next-word options
  text: string;             // proposed full sentence using top candidate
  rationale: string;
  slot: "before" | "after"; // where the next word fits relative to the utterance
  neededPos: PartOfSpeech[];
}

const LEVEL_TARGET_LEN: Record<ScaffoldLevel, number> = {
  level_1: 1,
  level_2: 2,
  level_3: 3,
  level_4: 4,
};

function timeBucket(hour: number): "morning" | "noon" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "noon";
  if (hour >= 15 && hour < 20) return "evening";
  return "night";
}

const TIME_TAGS: Record<ReturnType<typeof timeBucket>, string[]> = {
  morning: ["morning", "meal"],
  noon: ["meal"],
  evening: ["evening", "meal"],
  night: ["evening"],
};

/**
 * Progressive sentence scaffolding driven by the WHOLE utterance.
 * Returns the next slot to fill plus ranked candidate cards.
 */
export function buildScaffold(
  utterance: Card[],
  allCards: Card[],
  level: ScaffoldLevel,
  hour: number,
  bigrams: Record<string, Record<string, number>>,
): ScaffoldHint | null {
  if (utterance.length === 0 || level === "level_1") return null;
  const target = LEVEL_TARGET_LEN[level];
  if (utterance.length >= target) return null; // already met target length

  const has = (pos: PartOfSpeech) => utterance.some((c) => c.part_of_speech === pos);
  const hasSubject = has("pronoun") || has("phrase");
  const hasVerb = has("verb");
  const hasNoun = has("noun");
  const hasAdj = has("adjective");
  const last = utterance[utterance.length - 1];

  let neededPos: PartOfSpeech[] = [];
  let slot: "before" | "after" = "after";
  let rationale = "";

  // Decide missing slot in canonical Vietnamese order
  if (hasNoun && !hasVerb) {
    // có danh từ, thiếu động từ → thêm động từ trước
    neededPos = ["verb"];
    slot = "before";
    rationale = "Thêm động từ trước danh từ (VD: ăn cơm)";
  } else if (hasVerb && !hasNoun) {
    // có động từ, thiếu danh từ → thêm danh từ sau
    neededPos = ["noun"];
    slot = "after";
    rationale = "Thêm danh từ làm tân ngữ (VD: ăn cơm)";
  } else if (level === "level_4" && !hasSubject && (hasVerb || hasNoun)) {
    // thiếu chủ ngữ → thêm Con/Mẹ/Con muốn ở đầu
    neededPos = ["pronoun", "phrase"];
    slot = "before";
    rationale = "Thêm chủ ngữ (Con, Mẹ...) để thành câu đầy đủ";
  } else if (level === "level_3" && hasNoun && !hasAdj) {
    neededPos = ["adjective"];
    slot = "after";
    rationale = "Thêm tính từ mô tả (VD: sữa nóng)";
  } else if (last.part_of_speech === "pronoun" || last.part_of_speech === "phrase") {
    neededPos = ["verb", "noun"];
    slot = "after";
    rationale = "Tiếp theo nên là động từ hoặc danh từ";
  } else if (last.part_of_speech === "verb") {
    neededPos = ["noun"];
    slot = "after";
    rationale = "Thêm danh từ làm tân ngữ";
  } else if (last.part_of_speech === "noun" && level === "level_3") {
    neededPos = ["adjective"];
    slot = "after";
    rationale = "Thêm tính từ mô tả";
  } else if (last.part_of_speech === "noun") {
    neededPos = ["verb", "adjective"];
    slot = "before";
    rationale = "Thêm động từ trước danh từ";
  } else {
    return null;
  }

  // Pool of candidate cards (exclude ones already in utterance)
  const usedIds = new Set(utterance.map((c) => c.id));
  let pool = allCards.filter(
    (c) => !usedIds.has(c.id) && neededPos.includes(c.part_of_speech),
  );
  if (pool.length === 0) {
    pool = allCards.filter((c) => !usedIds.has(c.id));
  }

  const after = bigrams[last.label] ?? {};
  const totalAfter = Object.values(after).reduce((a, b) => a + b, 0) || 1;
  const timeTags = TIME_TAGS[timeBucket(hour)];

  const scored = pool.map((c) => {
    const bigramScore = (after[c.label] ?? 0) / totalAfter;
    const freq = c.use_count;
    const timeBoost = c.context_tags?.some((t) => timeTags.includes(t)) ? 1 : 0;
    const sameCat = c.category_id === last.category_id ? 1 : 0;
    return {
      card: c,
      score:
        bigramScore * 10 +
        freq * 0.4 +
        timeBoost * 1.5 +
        sameCat * 0.6 +
        Math.random() * 0.01,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 4).map((s) => s.card);
  if (candidates.length === 0) return null;

  // Build the proposed sentence text using the top candidate
  const labels = utterance.map((c) => c.label);
  const top = candidates[0].label;
  const text = slot === "before" ? [top, ...labels].join(" ") : [...labels, top].join(" ");

  return { candidates, text, rationale, slot, neededPos };
}

/**
 * Decide whether to promote the child's overall scaffold level.
 */
export function shouldPromote(
  current: ScaffoldLevel,
  recentUtterances: { word_count: number; level: ScaffoldLevel }[],
): ScaffoldLevel | null {
  const atLevel = recentUtterances.filter((u) => u.level === current);
  if (atLevel.length < 8) return null;
  const avgLen = atLevel.reduce((a, u) => a + u.word_count, 0) / atLevel.length;
  const order: ScaffoldLevel[] = ["level_1", "level_2", "level_3", "level_4"];
  const idx = order.indexOf(current);
  if (idx >= order.length - 1) return null;
  const targets: Record<ScaffoldLevel, number> = {
    level_1: 1.3,
    level_2: 1.8,
    level_3: 2.4,
    level_4: 3.2,
  };
  if (avgLen >= targets[current]) return order[idx + 1];
  return null;
}

// --- Backward-compat shims (legacy single-card API still imported elsewhere) ---

export function suggestNext(
  tapped: Card,
  allCards: Card[],
  level: ScaffoldLevel,
): ScaffoldSuggestion | null {
  const hint = buildScaffold([tapped], allCards, level, new Date().getHours(), {});
  if (!hint) return null;
  const cards = hint.slot === "before" ? [hint.candidates[0], tapped] : [tapped, hint.candidates[0]];
  return { cards, text: hint.text, level, rationale: hint.rationale };
}

export function suggestCandidates(
  tapped: Card,
  allCards: Card[],
  level: ScaffoldLevel,
  bigrams: Record<string, Record<string, number>>,
  n = 4,
): Card[] {
  const hint = buildScaffold([tapped], allCards, level, new Date().getHours(), bigrams);
  return hint ? hint.candidates.slice(0, n) : [];
}
