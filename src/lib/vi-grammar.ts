// Vietnamese sentence rendering for AAC utterances.
// Turns a raw list of card labels into a natural sentence instead of a
// word-by-word concatenation.
//
//   ["Con muốn", "con", "ăn", "cơm"]  →  "Con muốn ăn cơm"
//   ["cơm", "ăn"]                     →  "Ăn cơm"
//   ["Con", "muốn", "uống", "sữa"]    →  "Con muốn uống sữa"

import type { Card, PartOfSpeech } from "./aac-types";

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();

/** Function phrases that already carry their own subject. */
export const SUBJECT_PHRASES = [
  "con muon", "con thich", "con khong muon", "con khong", "con can", "con da",
  "con dang", "con xin", "cho con", "con bi", "con thay",
];

/** Words that act as a subject on their own. */
export const SUBJECT_WORDS = ["con", "em", "minh", "to", "tui", "me", "bo", "ba", "ong", "anh", "chi"];

/** Modal verbs — they must sit directly before the main verb. */
export const MODALS = ["muon", "thich", "can", "phai", "duoc", "biet", "dinh"];

/** Vocative particles that belong at the very front. */
const VOCATIVES = ["me oi", "bo oi", "ba oi", "co oi", "oi"];

/** Canonical slot rank: [vocative][subject][modal][verb][noun][adjective][other] */
function rank(label: string, pos: PartOfSpeech | undefined): number {
  const n = norm(label);
  if (VOCATIVES.includes(n)) return 0;
  if (SUBJECT_PHRASES.includes(n)) return 1;
  if (pos === "pronoun" || SUBJECT_WORDS.includes(n)) return 2;
  if (MODALS.includes(n)) return 3;
  if (pos === "verb") return 4;
  if (pos === "noun") return 5;
  if (pos === "adjective") return 6;
  return 5;
}

export interface RenderToken {
  label: string;
  part_of_speech?: PartOfSpeech;
}

/**
 * Render tokens as a natural Vietnamese sentence:
 *  - reorders into canonical Vietnamese word order (stable within each slot)
 *  - removes a redundant subject when a function phrase already contains it
 *  - collapses duplicated adjacent words
 *  - capitalises the first letter
 */
export function renderSentence(tokens: RenderToken[]): string {
  if (tokens.length === 0) return "";

  // 1) Canonical ordering (stable sort so authored order wins inside a slot)
  const ordered = tokens
    .map((t, i) => ({ t, i, r: rank(t.label, t.part_of_speech) }))
    .sort((a, b) => (a.r === b.r ? a.i - b.i : a.r - b.r))
    .map((x) => x.t);

  // 2) Drop a bare subject when a subject-carrying phrase is present
  const hasSubjectPhrase = ordered.some((t) => SUBJECT_PHRASES.includes(norm(t.label)));
  let words: string[] = [];
  for (const t of ordered) {
    const n = norm(t.label);
    if (hasSubjectPhrase && SUBJECT_WORDS.includes(n) && !SUBJECT_PHRASES.includes(n)) {
      // "Con muốn" + "con" → skip the duplicate subject
      const phrase = ordered.find((x) => SUBJECT_PHRASES.includes(norm(x.label)));
      if (phrase && norm(phrase.label).startsWith(n)) continue;
    }
    words.push(t.label.trim());
  }

  // 3) Collapse duplicated adjacent words ("ăn ăn cơm")
  words = words.filter((w, i) => i === 0 || norm(w) !== norm(words[i - 1]));

  // 4) Remove a repeated word already contained in the previous phrase
  words = words.filter((w, i) => {
    if (i === 0) return true;
    return !norm(words[i - 1]).split(" ").includes(norm(w));
  });

  const sentence = words.join(" ").replace(/\s+/g, " ").trim();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** Convenience wrapper for Card lists. */
export function renderCards(cards: Card[]): string {
  return renderSentence(cards.map((c) => ({ label: c.label, part_of_speech: c.part_of_speech })));
}

/** True when the label is a function phrase carrying its own subject. */
export function isSubjectPhrase(label: string) {
  return SUBJECT_PHRASES.includes(norm(label));
}

/** True when the label is a bare subject word. */
export function isSubjectWord(label: string) {
  return SUBJECT_WORDS.includes(norm(label));
}

export function isModal(label: string) {
  return MODALS.includes(norm(label));
}
