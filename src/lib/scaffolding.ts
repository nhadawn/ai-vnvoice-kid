// Scaffolding AI — Progressive Language Suggestion.
// Given a just-tapped card and the child's current cards, propose pairings
// (verb+noun, adj+noun, function-phrase) according to the child's scaffold level.

import type { Card, ScaffoldLevel } from "./aac-types";

export interface ScaffoldSuggestion {
  cards: Card[];                       // ordered cards forming the proposed phrase
  text: string;                        // human-readable sentence
  level: ScaffoldLevel;
  rationale: string;                   // why this suggestion (for parent dashboard)
}

/**
 * Get the next-level suggestion for a tapped card.
 *  Level 1: just the noun (no expansion)
 *  Level 2: verb + noun  (e.g. "Uống Sữa")
 *  Level 3: noun + adjective (e.g. "Sữa Nóng")
 *  Level 4: function-phrase + verb + noun (e.g. "Con muốn Uống Sữa")
 */
export function suggestNext(
  tapped: Card,
  allCards: Card[],
  level: ScaffoldLevel,
): ScaffoldSuggestion | null {
  if (level === "level_1") return null;

  const verbs = allCards.filter((c) => c.part_of_speech === "verb");
  const adjs = allCards.filter((c) => c.part_of_speech === "adjective");
  const phrases = allCards.filter((c) => c.part_of_speech === "phrase");

  // Heuristic verb pairing
  const verbForNoun = (noun: Card): Card | undefined => {
    const lower = noun.label.toLowerCase();
    if (/sữa|nước|trà|cà phê/.test(lower)) return verbs.find((v) => v.label === "Uống");
    if (/cơm|bánh|táo|chuối|kẹo|phở/.test(lower)) return verbs.find((v) => v.label === "Ăn");
    if (/gấu|xe|bóng|đồ chơi/.test(lower)) return verbs.find((v) => v.label === "Chơi");
    return verbs.sort((a, b) => b.use_count - a.use_count)[0];
  };

  if (level === "level_2") {
    if (tapped.part_of_speech !== "noun") return null;
    const v = verbForNoun(tapped);
    if (!v) return null;
    return {
      cards: [v, tapped],
      text: `${v.label} ${tapped.label}`,
      level,
      rationale: `Khuyến khích cấu trúc Động từ + Danh từ`,
    };
  }

  if (level === "level_3") {
    if (tapped.part_of_speech !== "noun" || adjs.length === 0) return null;
    const adj = adjs.sort((a, b) => b.use_count - a.use_count)[0];
    return {
      cards: [tapped, adj],
      text: `${tapped.label} ${adj.label}`,
      level,
      rationale: `Khuyến khích cấu trúc Danh từ + Tính từ`,
    };
  }

  if (level === "level_4") {
    if (tapped.part_of_speech !== "noun") return null;
    const phrase = phrases.find((p) => p.label === "Con muốn") ?? phrases[0];
    const v = verbForNoun(tapped);
    if (!phrase || !v) return null;
    return {
      cards: [phrase, v, tapped],
      text: `${phrase.label} ${v.label} ${tapped.label}`,
      level,
      rationale: `Khuyến khích cụm chức năng đầy đủ`,
    };
  }

  return null;
}

/**
 * Decide whether to promote the child's overall scaffold level.
 * Promote when: (a) ≥ N utterances at current level, AND
 *               (b) average word_count meets target for next level.
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
    level_3: 2.0,
    level_4: 3.0,
  };
  if (avgLen >= targets[current]) return order[idx + 1];
  return null;
}

/**
 * Return up to N candidate next-word cards to display in the AI side panel.
 * Picks cards that are likely to follow the tapped card given the child's level.
 */
export function suggestCandidates(
  tapped: Card,
  allCards: Card[],
  level: ScaffoldLevel,
  bigrams: Record<string, Record<string, number>>,
  n = 4,
): Card[] {
  if (level === "level_1") return [];

  // Preferred POS for the "next" slot depending on level + tapped POS
  let preferredPos: Card["part_of_speech"][] = [];
  if (tapped.part_of_speech === "noun") {
    if (level === "level_2") preferredPos = ["verb"];
    else if (level === "level_3") preferredPos = ["adjective", "verb"];
    else preferredPos = ["verb", "adjective"];
  } else if (tapped.part_of_speech === "verb") {
    preferredPos = ["noun", "pronoun"];
  } else if (tapped.part_of_speech === "phrase" || tapped.part_of_speech === "pronoun") {
    preferredPos = ["verb", "noun"];
  } else if (tapped.part_of_speech === "adjective") {
    preferredPos = ["noun"];
  }

  const pool = allCards.filter(
    (c) => c.id !== tapped.id && preferredPos.includes(c.part_of_speech),
  );

  const after = bigrams[tapped.label] ?? {};
  const totalAfter = Object.values(after).reduce((a, b) => a + b, 0) || 1;

  const scored = pool.map((c) => {
    const bigramScore = (after[c.label] ?? 0) / totalAfter;
    const freq = c.use_count;
    return { card: c, score: bigramScore * 10 + freq * 0.5 + Math.random() * 0.01 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.card);
}
