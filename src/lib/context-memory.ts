// Habit / time / place memory kept on the device.
// Every card tap is logged with the hour bucket and a coarse place label so
// the Smart Grid can surface "what this child usually says here, at this time".

export type TimeBucket = "morning" | "noon" | "evening" | "night";
export type PlaceLabel = string; // e.g. "home", "place-2", "unknown"

export interface UsageEvent {
  cardId: string;
  bucket: TimeBucket;
  place: PlaceLabel;
  t: number;
}

const MAX_EVENTS = 800;
const key = (childId: string) => `aac-usage-log:${childId}`;
const placeKey = "aac-places";

export function timeBucketOf(hour: number): TimeBucket {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "noon";
  if (hour >= 15 && hour < 20) return "evening";
  return "night";
}

export function readUsage(childId: string): UsageEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key(childId)) ?? "[]") as UsageEvent[];
  } catch {
    return [];
  }
}

export function logUsage(childId: string, cardId: string, place: PlaceLabel) {
  if (typeof localStorage === "undefined") return;
  const events = readUsage(childId);
  events.push({ cardId, bucket: timeBucketOf(new Date().getHours()), place, t: Date.now() });
  localStorage.setItem(key(childId), JSON.stringify(events.slice(-MAX_EVENTS)));
}

/** Per-card habit score in [0..1] for the current time bucket + place. */
export function habitScores(
  childId: string,
  bucket: TimeBucket,
  place: PlaceLabel,
): Map<string, number> {
  const events = readUsage(childId);
  const out = new Map<string, number>();
  if (events.length === 0) return out;
  const now = Date.now();
  let max = 0;
  for (const e of events) {
    // recency decay: half-life ~10 days
    const days = (now - e.t) / 86_400_000;
    const recency = Math.pow(0.5, days / 10);
    let w = 0.2 * recency;
    if (e.bucket === bucket) w += 0.6 * recency;
    if (place !== "unknown" && e.place === place) w += 0.6 * recency;
    const v = (out.get(e.cardId) ?? 0) + w;
    out.set(e.cardId, v);
    if (v > max) max = v;
  }
  if (max > 0) for (const [k, v] of out) out.set(k, v / max);
  return out;
}

// --- Saved places (parents manage them; everything stays on the device) ---

export type PlaceKind =
  | "home" | "school" | "market" | "hospital" | "park" | "restaurant" | "relative" | "other";

export const PLACE_KINDS: { kind: PlaceKind; label: string; icon: string }[] = [
  { kind: "home", label: "Nhà", icon: "🏠" },
  { kind: "school", label: "Trường học", icon: "🏫" },
  { kind: "market", label: "Chợ / Siêu thị", icon: "🛒" },
  { kind: "hospital", label: "Bệnh viện / Phòng khám", icon: "🏥" },
  { kind: "park", label: "Công viên / Sân chơi", icon: "🏞️" },
  { kind: "restaurant", label: "Nhà hàng / Quán ăn", icon: "🍽️" },
  { kind: "relative", label: "Nhà người thân", icon: "👨‍👩‍👧" },
  { kind: "other", label: "Nơi khác", icon: "📍" },
];

export const placeKindLabel = (kind: PlaceKind) =>
  PLACE_KINDS.find((k) => k.kind === kind)?.label ?? "Nơi khác";
export const placeKindIcon = (kind: PlaceKind) =>
  PLACE_KINDS.find((k) => k.kind === kind)?.icon ?? "📍";

export interface KnownPlace {
  id: string;
  label: string;
  kind: PlaceKind;
  /** optional written address, for the parent's reference */
  address?: string;
  lat?: number;
  lon?: number;
  radius?: number; // metres, default 150
}

const activeKey = "aac-place-active";
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();

export function readPlaces(): KnownPlace[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(placeKey) ?? "[]") as KnownPlace[];
    return raw.map((p) => ({ ...p, kind: p.kind ?? "other" }));
  } catch {
    return [];
  }
}

function writePlaces(places: KnownPlace[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(placeKey, JSON.stringify(places));
}

export function savePlace(place: Omit<KnownPlace, "id"> & { id?: string }): KnownPlace {
  const places = readPlaces();
  if (place.id) {
    const next = places.map((p) => (p.id === place.id ? { ...p, ...place } as KnownPlace : p));
    writePlaces(next);
    return next.find((p) => p.id === place.id)!;
  }
  const created: KnownPlace = { ...place, id: `place-${Date.now().toString(36)}` };
  writePlaces([...places, created]);
  return created;
}

export function deletePlace(id: string) {
  writePlaces(readPlaces().filter((p) => p.id !== id));
  if (getActivePlaceId() === id) setActivePlaceId(null);
}

export function renamePlace(id: string, label: string) {
  writePlaces(readPlaces().map((p) => (p.id === id ? { ...p, label } : p)));
}

/** Manual override: parent pins the current place instead of using GPS. */
export function getActivePlaceId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(activeKey);
}
export function setActivePlaceId(id: string | null) {
  if (typeof localStorage === "undefined") return;
  if (id) localStorage.setItem(activeKey, id);
  else localStorage.removeItem(activeKey);
}

function distanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Resolve current coordinates to a saved place, creating a new one if unknown. */
export function resolvePlace(lat: number, lon: number): KnownPlace {
  const places = readPlaces();
  const hit = places
    .filter((p) => p.lat != null && p.lon != null)
    .find((p) => distanceM({ lat: p.lat!, lon: p.lon! }, { lat, lon }) < (p.radius ?? 150));
  if (hit) return hit;
  const isFirst = places.length === 0;
  return savePlace({
    label: isFirst ? "Nhà" : `Địa điểm ${places.length + 1}`,
    kind: isFirst ? "home" : "other",
    lat,
    lon,
    radius: 150,
  });
}

// --- Vocabulary boosting per place kind -------------------------------------

/** Vietnamese keywords typical of each place, used to surface relevant cards. */
const PLACE_KEYWORDS: Record<PlaceKind, string[]> = {
  home: ["me", "bo", "ba", "ong", "an", "com", "uong", "sua", "nuoc", "ngu", "tam", "choi", "tivi", "giuong", "nha", "ve nha", "danh rang", "rua tay", "do choi", "gau bong"],
  school: ["co giao", "thay", "ban", "hoc", "sach", "but", "giay", "mau", "cap sach", "ba lo", "lop", "truong", "doc", "viet", "ve", "hat", "choi", "di hoc", "ghe", "ban"],
  market: ["mua", "cho", "sieu thi", "tien", "gio", "rau", "thit", "ca", "trung", "sua", "banh", "keo", "trai cay", "tao", "chuoi", "cam", "nuoc", "kem", "con muon", "them"],
  hospital: ["bac si", "benh vien", "dau", "met", "so", "thuoc", "kim tiem", "kham", "me", "bo", "giup con", "con dau", "khong muon", "cho con", "nuoc", "ngoi", "doi"],
  park: ["choi", "chay", "nhay", "bong", "xe dap", "cay", "hoa", "la", "chim", "cho", "meo", "nuoc", "kem", "ban", "cong vien", "san choi", "vui", "them", "ve nha", "met"],
  restaurant: ["an", "uong", "com", "pho", "mi", "nuoc", "sua", "kem", "banh", "thit", "ca", "rau", "bat", "thia", "ngon", "con muon", "them", "het", "cam on", "no"],
  relative: ["ba", "ong", "co", "chu", "di", "cau", "bac", "anh", "chi", "em", "choi", "an", "uong", "keo", "banh", "chao", "cam on", "tam biet", "ve nha", "vui"],
  other: [],
};

/**
 * Per-card score in [0..1] for the current place kind, based on label keywords.
 * Cards whose label matches the place's typical vocabulary float to the top.
 */
export function placeVocabScores<T extends { id: string; label: string }>(
  cards: T[],
  kind: PlaceKind | null,
): Map<string, number> {
  const out = new Map<string, number>();
  if (!kind) return out;
  const kws = PLACE_KEYWORDS[kind] ?? [];
  if (kws.length === 0) return out;
  for (const c of cards) {
    const q = norm(c.label);
    let best = 0;
    for (const kw of kws) {
      if (q === kw) best = Math.max(best, 1);
      else if (q.includes(kw) || kw.includes(q)) best = Math.max(best, 0.6);
    }
    if (best > 0) out.set(c.id, best);
  }
  return out;
}

