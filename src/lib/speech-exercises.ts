// Ngân hàng bài tập cho "Interactive Speech Studio".
// 4 dạng bài × nhiều chủ đề, dùng làm dữ liệu giả lập cho phiên luyện tập.

import cupImg from "@/assets/real-cup.jpg";
import catImg from "@/assets/real-cat.jpg";
import bananaImg from "@/assets/real-banana.jpg";

export type ExerciseKind = "echo" | "cloze" | "qa" | "naming";

export type Topic =
  | "needs"
  | "emotion"
  | "home"
  | "animal"
  | "color"
  | "toy"
  | "food";

export const TOPIC_META: Record<Topic, { label: string; icon: string }> = {
  needs: { label: "Nhu cầu", icon: "🙋" },
  food: { label: "Thức ăn", icon: "🍚" },
  emotion: { label: "Cảm xúc", icon: "😊" },
  home: { label: "Đồ vật", icon: "🏠" },
  animal: { label: "Động vật", icon: "🐶" },
  color: { label: "Màu sắc", icon: "🎨" },
  toy: { label: "Đồ chơi", icon: "🧸" },
};

export type Chip = { label: string; icon: string; hidden?: boolean; correct?: boolean };

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  topic: Topic;
  /** Câu AI đọc mẫu / câu hỏi của AI */
  prompt: string;
  /** Câu mục tiêu bé cần nói */
  target: string;
  /** Thẻ hình hiển thị (echo/cloze) */
  chips?: Chip[];
  /** Thẻ trả lời để bé chạm (cloze/qa) */
  options?: Chip[];
  /** Ảnh thật cho dạng gọi tên vật thể */
  image?: string;
  imageAlt?: string;
  /** Số sao thưởng tối đa */
  stars: 1 | 2 | 3;
}

export const EXERCISES: Exercise[] = [
  // ── Dạng 1: Nhắc lại cùng AI ─────────────────────────────
  {
    id: "echo-milk",
    kind: "echo",
    topic: "needs",
    prompt: "Con muốn uống sữa",
    target: "Con muốn uống sữa",
    chips: [
      { label: "Con muốn", icon: "🙋" },
      { label: "Uống", icon: "🥤" },
      { label: "Sữa", icon: "🥛" },
    ],
    stars: 3,
  },
  {
    id: "echo-car",
    kind: "echo",
    topic: "toy",
    prompt: "Cho con mở ô tô",
    target: "Cho con mở ô tô",
    chips: [
      { label: "Cho con", icon: "🤲" },
      { label: "Mở", icon: "🔓" },
      { label: "Ô tô", icon: "🚗" },
    ],
    stars: 3,
  },
  {
    id: "echo-bath",
    kind: "echo",
    topic: "needs",
    prompt: "Con muốn đi tắm",
    target: "Con muốn đi tắm",
    chips: [
      { label: "Con muốn", icon: "🙋" },
      { label: "Đi", icon: "🚶" },
      { label: "Tắm", icon: "🛁" },
    ],
    stars: 2,
  },

  // ── Dạng 2: Điền từ còn thiếu ────────────────────────────
  {
    id: "cloze-drink",
    kind: "cloze",
    topic: "needs",
    prompt: "Con muốn … sữa",
    target: "Uống",
    chips: [
      { label: "Con muốn", icon: "🙋" },
      { label: "Uống", icon: "🥤", hidden: true },
      { label: "Sữa", icon: "🥛" },
    ],
    options: [
      { label: "Uống", icon: "🥤", correct: true },
      { label: "Ngủ", icon: "😴" },
      { label: "Chạy", icon: "🏃" },
    ],
    stars: 3,
  },
  {
    id: "cloze-apple",
    kind: "cloze",
    topic: "food",
    prompt: "Con muốn ăn …",
    target: "Táo",
    chips: [
      { label: "Con muốn", icon: "🙋" },
      { label: "Ăn", icon: "🍽️" },
      { label: "Táo", icon: "🍎", hidden: true },
    ],
    options: [
      { label: "Táo", icon: "🍎", correct: true },
      { label: "Bóng", icon: "⚽" },
      { label: "Ghế", icon: "🪑" },
    ],
    stars: 2,
  },
  {
    id: "cloze-happy",
    kind: "cloze",
    topic: "emotion",
    prompt: "Con thấy …",
    target: "Vui",
    chips: [
      { label: "Con thấy", icon: "👀" },
      { label: "Vui", icon: "😄", hidden: true },
    ],
    options: [
      { label: "Vui", icon: "😄", correct: true },
      { label: "Buồn", icon: "😢" },
      { label: "Mệt", icon: "😪" },
    ],
    stars: 2,
  },

  // ── Dạng 3: Hỏi – Đáp ngắn ───────────────────────────────
  {
    id: "qa-dog",
    kind: "qa",
    topic: "animal",
    prompt: "Con chó kêu thế nào nhỉ?",
    target: "Gâu gâu",
    options: [{ label: "Gâu gâu", icon: "🐶", correct: true }, { label: "Meo meo", icon: "🐱" }],
    stars: 2,
  },
  {
    id: "qa-mood",
    kind: "qa",
    topic: "emotion",
    prompt: "Bé đang thấy mệt hay vui?",
    target: "Vui",
    options: [
      { label: "Vui", icon: "😄", correct: true },
      { label: "Mệt", icon: "😪", correct: true },
    ],
    stars: 3,
  },
  {
    id: "qa-apple-color",
    kind: "qa",
    topic: "color",
    prompt: "Quả táo có màu gì con?",
    target: "Màu đỏ",
    options: [
      { label: "Màu đỏ", icon: "🔴", correct: true },
      { label: "Màu xanh", icon: "🟢" },
      { label: "Màu vàng", icon: "🟡" },
    ],
    stars: 2,
  },

  // ── Dạng 4: Gọi tên vật thể thực ─────────────────────────
  {
    id: "name-cup",
    kind: "naming",
    topic: "home",
    prompt: "Đây là cái gì?",
    target: "Cốc",
    image: cupImg,
    imageAlt: "Ảnh thật một chiếc cốc trắng trên mặt bàn gỗ",
    options: [{ label: "Cốc", icon: "🥛", correct: true }, { label: "Ghế", icon: "🪑" }],
    stars: 2,
  },
  {
    id: "name-cat",
    kind: "naming",
    topic: "animal",
    prompt: "Mèo đâu nhỉ?",
    target: "Mèo",
    image: catImg,
    imageAlt: "Ảnh thật một con mèo con màu vàng đang ngồi",
    options: [{ label: "Mèo", icon: "🐱", correct: true }, { label: "Chó", icon: "🐶" }],
    stars: 2,
  },
  {
    id: "name-banana",
    kind: "naming",
    topic: "food",
    prompt: "Trái gì đây bé?",
    target: "Chuối",
    image: bananaImg,
    imageAlt: "Ảnh thật một quả chuối chín màu vàng",
    options: [{ label: "Chuối", icon: "🍌", correct: true }, { label: "Táo", icon: "🍎" }],
    stars: 3,
  },
];

export const KIND_META: Record<ExerciseKind, { label: string; hint: string; icon: string }> = {
  echo: { label: "Nhắc lại cùng AI", hint: "Nghe Gấu đọc rồi bé nói lại nhé!", icon: "🗣️" },
  cloze: { label: "Điền từ còn thiếu", hint: "Từ nào còn thiếu trong câu nhỉ?", icon: "🧩" },
  qa: { label: "Hỏi – Đáp ngắn", hint: "Bé trả lời câu hỏi của Gấu nha!", icon: "❓" },
  naming: { label: "Gọi tên vật thể", hint: "Bé gọi tên vật trong ảnh nhé!", icon: "📷" },
};

export function filterByTopic(topic: Topic | "all"): Exercise[] {
  return topic === "all" ? EXERCISES : EXERCISES.filter((e) => e.topic === topic);
}
