export type PartOfSpeech = "noun" | "verb" | "adjective" | "phrase" | "pronoun";
export type ScaffoldLevel = "level_1" | "level_2" | "level_3" | "level_4";

export interface Category {
  id: string;
  child_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

export interface Card {
  id: string;
  child_id: string;
  category_id: string | null;
  label: string;
  image_url: string | null;
  emoji: string | null;
  part_of_speech: PartOfSpeech;
  context_tags: string[];
  use_count: number;
  last_used_at: string | null;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  birth_year: number | null;
  current_level: ScaffoldLevel;
  voice_preference: "female" | "male";
}

export interface ScaffoldStateRow {
  id: string;
  child_id: string;
  card_id: string;
  level: ScaffoldLevel;
  uses_at_current_level: number;
  failed_suggestions: number;
}

export const LEVEL_DESCRIPTIONS: Record<ScaffoldLevel, string> = {
  level_1: "Từ đơn",
  level_2: "Động từ + Danh từ",
  level_3: "Tính từ + Danh từ",
  level_4: "Cụm chức năng",
};

export const LEVEL_THRESHOLD = 5; // n uses at current level before promoting
export const FAIL_BACKOFF = 3;    // after this many ignored suggestions, fall back
