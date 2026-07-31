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

// --- Coarse place clustering from geolocation (never leaves the device) ---

interface KnownPlace { id: string; lat: number; lon: number; label: string }

function readPlaces(): KnownPlace[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(placeKey) ?? "[]") as KnownPlace[];
  } catch {
    return [];
  }
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

/** Resolve current coordinates to a stable place id, creating one if new. */
export function resolvePlace(lat: number, lon: number): { id: string; label: string } {
  const places = readPlaces();
  const hit = places.find((p) => distanceM(p, { lat, lon }) < 150);
  if (hit) return { id: hit.id, label: hit.label };
  const id = places.length === 0 ? "home" : `place-${places.length + 1}`;
  const label = places.length === 0 ? "Ở nhà" : `Địa điểm ${places.length + 1}`;
  const next = [...places, { id, lat, lon, label }];
  localStorage.setItem(placeKey, JSON.stringify(next));
  return { id, label };
}

export function renamePlace(id: string, label: string) {
  const places = readPlaces().map((p) => (p.id === id ? { ...p, label } : p));
  localStorage.setItem(placeKey, JSON.stringify(places));
}
