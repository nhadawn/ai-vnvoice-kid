// Emoji icon library + lightweight AI-ish suggestion engine.
// Suggests icons and the best folder (category) from the Vietnamese label
// the user types, using keyword matching on an unaccented normalized form.

export const ICON_GROUPS: { name: string; icons: string[] }[] = [
  {
    name: "Người & Cảm xúc",
    icons: ["👶","🧒","👦","👧","👩","👨","👵","👴","👨‍👩‍👧","👩‍🏫","👨‍🏫","👨‍⚕️","🧑‍🍳","😄","😊","😍","😢","😭","😠","😨","😪","🤕","🥵","🥶","🙋","🙅","🙏","👋","🤗","🤲","💬","❤️","💙"],
  },
  {
    name: "Đồ ăn & Uống",
    icons: ["🍚","🍜","🥖","🥣","🍖","🐟","🥚","🥬","🍎","🍌","🍊","🍇","🍉","🍓","🍬","🍦","🍰","🍪","🥛","💧","🧃","🍵","☕","🥤","🍲","🍳","🍞","🧀","🍕","🍟"],
  },
  {
    name: "Hành động",
    icons: ["🍽️","😴","🎮","🛁","🚶","🏃","🤸","🪑","🧍","🛌","📖","✍️","🎨","🎤","👂","👀","😘","😄","🧼","🪥","🧹","🧺","🗑️","🛒","💤","🙌"],
  },
  {
    name: "Động vật",
    icons: ["🐶","🐱","🐔","🦆","🐄","🐷","🐴","🐰","🐦","🐟","🐘","🐯","🦁","🐒","🐻","🦒","🐊","🐍","🐸","🦋","🐝","🐢","🐬","🦅"],
  },
  {
    name: "Đồ vật & Đồ chơi",
    icons: ["🧸","🪆","🚗","⚽","🧩","🧱","📕","✏️","📄","🖍️","🎈","🎹","🥁","🪁","🤖","⌚","🔑","👜","🎒","☂️","🪀","🎲"],
  },
  {
    name: "Nơi chốn & Thiên nhiên",
    icons: ["🏠","🏫","🏞️","🛝","🛒","🏪","🏥","💊","🍽️","🏖️","⛰️","🌊","🛫","🚉","🦁","📚","🌳","🌸","🍃","🌱","🌹","🌻","🌵","🌴","🍄","☀️","🌙","⭐","🌧️"],
  },
  {
    name: "Phương tiện",
    icons: ["🚗","🏍️","🚲","🚌","🚆","✈️","🚢","⛵","🚁","🚀","🚕","🚑","🚒","🚓","🚚","🚇","🛹","⛸️"],
  },
  {
    name: "Quần áo & Cơ thể",
    icons: ["👕","👔","🧥","👖","🩳","👗","🧢","👒","👟","🩴","🧦","🧤","🧣","👓","🧠","👁️","👃","👄","👂","✋","🦵","🦷","💇"],
  },
  {
    name: "Số & Thời gian",
    icons: ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","💯","➕","➖","🕐","⏰","⏳","📅","🗓️","🌅","🌇","🌆"],
  },
  {
    name: "Công nghệ & Khác",
    icons: ["📱","💻","📺","📷","🎧","🔊","🖱️","⌨️","🖥️","🖨️","📶","🔌","🔋","🎮","📲","🌐","📧","✅","❌","✔️","🚫","✨","🆕","🔲"],
  },
];

export const ALL_ICONS = Array.from(new Set(ICON_GROUPS.flatMap((g) => g.icons)));

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();

// keyword (unaccented) -> icons, best first
const KEYWORD_ICONS: [string, string[]][] = [
  ["sua", ["🥛"]], ["nuoc", ["💧", "🧃"]], ["com", ["🍚"]], ["pho", ["🍜"]],
  ["banh", ["🍰", "🥖", "🍪"]], ["keo", ["🍬"]], ["kem", ["🍦"]], ["thit", ["🍖"]],
  ["ca", ["🐟"]], ["trung", ["🥚"]], ["rau", ["🥬"]], ["tao", ["🍎"]], ["chuoi", ["🍌"]],
  ["cam", ["🍊"]], ["nho", ["🍇"]], ["tra", ["🍵"]], ["ca phe", ["☕"]],
  ["an", ["🍽️"]], ["uong", ["🥤"]], ["ngu", ["😴"]], ["choi", ["🎮"]], ["tam", ["🛁"]],
  ["di", ["🚶"]], ["chay", ["🏃"]], ["nhay", ["🤸"]], ["ngoi", ["🪑"]], ["dung", ["🧍"]],
  ["doc", ["📖"]], ["viet", ["✍️"]], ["ve", ["🎨"]], ["hat", ["🎤"]], ["nghe", ["👂"]],
  ["nhin", ["👀"]], ["om", ["🤗"]], ["cuoi", ["😄"]], ["khoc", ["😭"]],
  ["me", ["👩"]], ["bo", ["👨"]], ["ba", ["👵"]], ["ong", ["👴"]], ["anh", ["👦"]],
  ["chi", ["👧"]], ["em", ["🧒"]], ["co giao", ["👩‍🏫"]], ["thay", ["👨‍🏫"]],
  ["bac si", ["👨‍⚕️"]], ["gia dinh", ["👨‍👩‍👧"]], ["ban", ["👫"]],
  ["vui", ["😄"]], ["buon", ["😢"]], ["gian", ["😠"]], ["so", ["😨"]], ["met", ["😪"]],
  ["dau", ["🤕"]], ["doi", ["🍽️"]], ["khat", ["💧"]], ["nong", ["🥵"]], ["lanh", ["🥶"]],
  ["cho", ["🐶"]], ["meo", ["🐱"]], ["ga", ["🐔"]], ["vit", ["🦆"]], ["bo", ["🐄"]],
  ["lon", ["🐷"]], ["ngua", ["🐴"]], ["tho", ["🐰"]], ["chim", ["🐦"]], ["voi", ["🐘"]],
  ["ho", ["🐯"]], ["su tu", ["🦁"]], ["khi", ["🐒"]], ["gau", ["🐻", "🧸"]],
  ["xe", ["🚗"]], ["oto", ["🚗"]], ["o to", ["🚗"]], ["xe may", ["🏍️"]], ["xe dap", ["🚲"]],
  ["may bay", ["✈️"]], ["tau", ["🚆", "🚢"]], ["thuyen", ["⛵"]], ["xe buyt", ["🚌"]],
  ["nha", ["🏠"]], ["truong", ["🏫"]], ["lop", ["🪑"]], ["cong vien", ["🏞️"]],
  ["sieu thi", ["🛒"]], ["cho", ["🏪"]], ["benh vien", ["🏥"]], ["bien", ["🏖️"]],
  ["nui", ["⛰️"]], ["thu vien", ["📚"]], ["so thu", ["🦁"]],
  ["cay", ["🌳"]], ["hoa", ["🌸"]], ["la", ["🍃"]], ["co", ["🌱"]], ["nam", ["🍄"]],
  ["ao", ["👕"]], ["quan", ["👖"]], ["vay", ["👗"]], ["mu", ["🧢"]], ["giay", ["👟"]],
  ["dep", ["🩴"]], ["tat", ["🧦"]], ["kinh", ["👓"]], ["ba lo", ["🎒"]],
  ["dien thoai", ["📱"]], ["may tinh", ["💻"]], ["tivi", ["📺"]], ["tai nghe", ["🎧"]],
  ["robot", ["🤖"]], ["sach", ["📕"]], ["but", ["✏️"]], ["bong", ["⚽"]],
  ["rua tay", ["🧼"]], ["danh rang", ["🪥"]], ["ve sinh", ["🚽"]], ["khan", ["🧻"]],
  ["giuong", ["🛏️"]], ["ghe", ["🪑"]], ["ban", ["🪑"]], ["den", ["💡"]], ["cua", ["🚪"]],
  ["sang", ["🌅"]], ["trua", ["☀️"]], ["chieu", ["🌇"]], ["toi", ["🌆"]], ["dem", ["🌙"]],
  ["xin chao", ["👋"]], ["tam biet", ["👋"]], ["cam on", ["🙏"]], ["xin loi", ["😔"]],
  ["muon", ["🙋"]], ["khong", ["❌"]], ["co", ["✅"]], ["giup", ["🆘"]], ["yeu", ["❤️"]],
];

/** Ranked icon suggestions for a label. */
export function suggestIcons(label: string, limit = 8): string[] {
  const q = norm(label);
  if (!q) return [];
  const scored: { icon: string; score: number }[] = [];
  for (const [kw, icons] of KEYWORD_ICONS) {
    let score = 0;
    if (q === kw) score = 100;
    else if (q.startsWith(kw + " ") || q.endsWith(" " + kw)) score = 70;
    else if (q.includes(kw)) score = 40 + kw.length;
    else if (kw.includes(q) && q.length >= 3) score = 20;
    if (score > 0) icons.forEach((icon, i) => scored.push({ icon, score: score - i }));
  }
  const best = new Map<string, number>();
  for (const s of scored) best.set(s.icon, Math.max(best.get(s.icon) ?? 0, s.score));
  return [...best.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([i]) => i);
}

// Folder (category) suggestion: keyword sets per category name.
const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Giao tiếp Cơ bản", ["chao", "tam biet", "cam on", "xin loi", "co", "khong", "muon", "giup", "lam on", "xong", "them", "dung lai", "doi", "day", "kia", "gi"]],
  ["Người thân", ["me", "bo", "ba", "ong", "anh", "chi", "em", "co", "chu", "di", "cau", "bac", "ban", "thay", "giao", "bac si", "gia dinh", "hang xom", "nguoi"]],
  ["Hành động", ["an", "uong", "ngu", "choi", "tam", "di", "chay", "nhay", "ngoi", "dung", "nam", "doc", "viet", "ve", "hat", "nghe", "nhin", "om", "hon", "cuoi", "lam"]],
  ["Đồ ăn & Thức uống", ["com", "pho", "banh", "chao", "thit", "ca", "trung", "rau", "tao", "chuoi", "cam", "nho", "keo", "kem", "sua", "nuoc", "tra", "ca phe", "sinh to", "an"]],
  ["Đồ vật & Đồ chơi", ["gau bong", "bup be", "bong", "xep hinh", "lego", "sach", "but", "giay", "mau", "bong bay", "dan", "trong", "dieu", "robot", "dong ho", "chia khoa", "tui", "cap", "o"]],
  ["Cảm xúc & Cơ thể", ["vui", "buon", "gian", "so", "met", "dau", "doi", "khat", "nong", "lanh", "dau", "mat", "mui", "mieng", "tai", "tay", "chan", "bung", "rang", "toc"]],
  ["Thời gian", ["sang", "trua", "chieu", "toi", "dem", "hom nay", "hom qua", "ngay mai", "bay gio", "lat nua", "thu", "tuan", "thang", "nam", "gio"]],
  ["Số", ["mot", "hai", "ba", "bon", "nam", "sau", "bay", "tam", "chin", "muoi", "tram", "khong", "nhieu", "it", "het", "nua", "so"]],
  ["Động vật", ["cho", "meo", "ga", "vit", "bo", "lon", "ngua", "tho", "chim", "ca", "voi", "ho", "su tu", "khi", "gau", "huou", "ca sau", "ran", "ech", "buom", "con vat"]],
  ["Thể thao", ["da bong", "bong ro", "bong chuyen", "cau long", "tennis", "boi", "chay bo", "dap xe", "yoga", "vo", "patin", "bong ban", "bowling", "golf", "leo nui", "truot", "co vua", "huy chuong", "cup"]],
  ["Cây cối", ["cay", "hoa", "la", "co", "hong", "huong duong", "cuc", "sen", "xuong rong", "dua", "thong", "lua", "nam", "hat", "qua", "re", "canh", "vuon", "rung"]],
  ["Nội thất", ["giuong", "ghe", "ban", "sofa", "tu", "ke", "den", "guong", "tham", "rem", "quat", "dieu hoa", "tu lanh", "bep", "lo", "may giat", "tivi", "chan", "goi", "cua"]],
  ["Công nghệ", ["dien thoai", "may tinh", "bang", "tivi", "camera", "tai nghe", "loa", "chuot", "ban phim", "man hinh", "may in", "wifi", "sac", "pin", "robot", "game", "ung dung", "mang", "email"]],
  ["Phương tiện", ["oto", "o to", "xe", "may bay", "tau", "thuyen", "truc thang", "ten lua", "taxi", "cuu thuong", "cuu hoa", "canh sat", "tai", "tau dien", "cap treo", "xich lo", "van truot", "patin"]],
  ["Quần áo", ["ao", "quan", "vay", "dam", "mu", "non", "giay", "dep", "tat", "gang tay", "khan", "kinh", "dong ho", "that lung", "ba lo", "ao mua"]],
  ["Vệ sinh", ["rua", "danh rang", "tam", "goi dau", "lau", "xa phong", "dau goi", "kem danh rang", "khan", "bon cau", "ve sinh", "ta", "cat mong", "cat toc", "chai toc", "giat", "vut rac", "quet"]],
  ["Nơi chốn", ["nha", "truong", "lop", "cong vien", "san choi", "sieu thi", "cho", "benh vien", "nha thuoc", "nha hang", "quan", "bai bien", "nui", "song", "ho", "san bay", "ben xe", "ga", "so thu", "thu vien"]],
  ["Cụm chức năng", ["con muon", "con khong", "con doi", "con khat", "con met", "con dau", "con yeu", "me oi", "bo oi", "cho con", "con thich", "di choi", "ve nha", "di hoc", "chuc ngu ngon"]],
];

export interface CategorySuggestion {
  categoryId: string;
  name: string;
  confidence: number; // 0..1
}

/** Suggest the best folder for a label among the child's categories. */
export function suggestCategory<T extends { id: string; name: string }>(
  label: string,
  categories: T[],
): CategorySuggestion | null {
  const q = norm(label);
  if (!q || categories.length === 0) return null;
  let best: { cat: T; score: number } | null = null;
  for (const cat of categories) {
    const entry = CATEGORY_KEYWORDS.find(([n]) => norm(n) === norm(cat.name));
    const kws = entry?.[1] ?? [norm(cat.name)];
    let score = 0;
    for (const kw of kws) {
      if (!kw) continue;
      if (q === kw) score = Math.max(score, 100);
      else if (q.startsWith(kw + " ") || q.endsWith(" " + kw)) score = Math.max(score, 65);
      else if (q.includes(kw)) score = Math.max(score, 35 + Math.min(kw.length, 12));
    }
    if (score > 0 && (!best || score > best.score)) best = { cat, score };
  }
  if (!best) return null;
  return {
    categoryId: best.cat.id,
    name: best.cat.name,
    confidence: Math.min(1, best.score / 100),
  };
}
