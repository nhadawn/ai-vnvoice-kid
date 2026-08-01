import { EMOJI, GROUP_VI, GROUP_ORDER, type EmojiEntry } from "./emoji-data";
import { expandQuery, norm } from "./emoji-vi";

export { EMOJI, GROUP_VI, GROUP_ORDER };
export type { EmojiEntry };

/** All emoji grouped by Unicode group, in a stable, kid-friendly order. */
export const EMOJI_BY_GROUP: { group: string; label: string; items: EmojiEntry[] }[] =
  GROUP_ORDER.map((g) => ({
    group: g,
    label: GROUP_VI[g] ?? g,
    items: EMOJI.filter((e) => e.g === g),
  })).filter((g) => g.items.length > 0);

/**
 * Search the whole emoji catalogue with a Vietnamese (or English) query.
 * Vietnamese words are expanded to English terms via the VI→EN lexicon.
 */
export function searchEmoji(query: string, limit = 400): EmojiEntry[] {
  const terms = expandQuery(query);
  if (terms.length === 0) return [];
  const scored: { e: EmojiEntry; score: number }[] = [];
  for (const entry of EMOJI) {
    const name = norm(entry.n);
    const sub = norm(entry.s);
    let best = 0;
    for (const t of terms) {
      if (!t) continue;
      let s = 0;
      if (name === t) s = 100;
      else if (name.startsWith(t)) s = 80;
      else if (name.includes(t)) s = 60;
      else if (sub.includes(t)) s = 30;
      if (s > best) best = s;
    }
    if (best > 0) scored.push({ e: entry, score: best - entry.n.length * 0.02 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.e);
}
