// Smart Grid sorting: Time-of-day + frequency + recency + N-gram next-word.
// Preserves position (motor memory) — we DON'T reorder. We tag highlight/dim
// state so the UI can apply Ghost Button styling without moving anything.

import type { Card } from "./aac-types";

export type CardHighlight = "suggested" | "dim" | "normal";

export interface SmartGridContext {
  hour: number;                       // current hour 0-23
  recentLabels: string[];             // labels in current utterance, latest first
  bigramCounts: Record<string, Record<string, number>>; // prev -> next -> count
  unigramCounts: Record<string, number>;
}

function timeBucket(hour: number): "morning" | "noon" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "noon";
  if (hour >= 15 && hour < 20) return "evening";
  return "night";
}

function timeBoost(card: Card, hour: number): number {
  const bucket = timeBucket(hour);
  const tagMap: Record<string, string[]> = {
    morning: ["morning", "meal"],
    noon: ["meal"],
    evening: ["evening", "meal"],
    night: ["evening"],
  };
  const matches = tagMap[bucket] ?? [];
  return card.context_tags?.some((t) => matches.includes(t)) ? 1 : 0;
}

export function scoreCards(
  cards: Card[],
  ctx: SmartGridContext,
): Map<string, number> {
  const scores = new Map<string, number>();
  const prev = ctx.recentLabels[0];
  const totalUses = Math.max(1, cards.reduce((a, c) => a + c.use_count, 0));

  for (const card of cards) {
    let s = 0;
    // Frequency (normalized)
    s += (card.use_count / totalUses) * 3;
    // Recency
    if (card.last_used_at) {
      const ageMs = Date.now() - new Date(card.last_used_at).getTime();
      const days = ageMs / (1000 * 60 * 60 * 24);
      s += Math.max(0, 1.5 - days * 0.2);
    }
    // Time of day
    s += timeBoost(card, ctx.hour) * 1.5;
    // N-gram: P(card | prev)
    if (prev) {
      const next = ctx.bigramCounts[prev]?.[card.label] ?? 0;
      const totalAfterPrev = Object.values(ctx.bigramCounts[prev] ?? {}).reduce(
        (a, b) => a + b,
        0,
      );
      if (totalAfterPrev > 0) s += (next / totalAfterPrev) * 4;
    }
    scores.set(card.id, s);
  }
  return scores;
}

/**
 * Pick top K cards as "suggested" (highlighted) without reordering anything.
 * Optionally dim very weak/never-used cards to focus attention.
 */
export function classifyHighlights(
  cards: Card[],
  ctx: SmartGridContext,
  topK = 3,
): Map<string, CardHighlight> {
  const out = new Map<string, CardHighlight>();
  if (cards.length === 0) return out;
  const scores = scoreCards(cards, ctx);
  const sorted = [...cards].sort(
    (a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0),
  );
  const topIds = new Set(sorted.slice(0, topK).map((c) => c.id));
  // Threshold: only highlight if there's signal (score > 0.5)
  for (const c of cards) {
    const score = scores.get(c.id) ?? 0;
    if (topIds.has(c.id) && score > 0.6) out.set(c.id, "suggested");
    else if (score < 0.15 && c.use_count === 0) out.set(c.id, "dim");
    else out.set(c.id, "normal");
  }
  return out;
}

export function buildBigrams(
  utterances: { text: string }[],
): { bigrams: Record<string, Record<string, number>>; unigrams: Record<string, number> } {
  const bigrams: Record<string, Record<string, number>> = {};
  const unigrams: Record<string, number> = {};
  for (const u of utterances) {
    const tokens = u.text.split(/\s+/).filter(Boolean);
    for (let i = 0; i < tokens.length; i++) {
      unigrams[tokens[i]] = (unigrams[tokens[i]] ?? 0) + 1;
      if (i > 0) {
        const a = tokens[i - 1];
        const b = tokens[i];
        bigrams[a] = bigrams[a] ?? {};
        bigrams[a][b] = (bigrams[a][b] ?? 0) + 1;
      }
    }
  }
  return { bigrams, unigrams };
}
