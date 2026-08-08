import { useCallback, useEffect, useRef, useState } from "react";
import {
  getActivePlaceId,
  matchPlace,
  readPlaces,
  setActivePlaceId,
  type KnownPlace,
  type PlaceKind,
} from "@/lib/context-memory";

export interface PlaceState {
  id: string;
  label: string;
  kind: PlaceKind | null;
  /**
   * idle — geolocation off/unsupported
   * locating — waiting for the first fix
   * auto — inside a saved geofence, detected automatically
   * away — we have a fix but no saved place matches
   * denied — permission refused or position unavailable
   * manual — parent pinned a place, overrides GPS
   */
  status: "idle" | "locating" | "auto" | "away" | "denied" | "manual";
  /** metres from the matched place centre, when known */
  distance: number | null;
  /** re-read the manual pin / restart detection */
  refresh: () => void;
}

const UNKNOWN = { id: "unknown", label: "Không rõ vị trí", kind: null } as const;

/**
 * Resolves the current place continuously: a manual pin chosen by the parent
 * wins, otherwise we watch GPS and geofence-match against saved places, so the
 * AAC board context updates by itself when the child moves.
 */
export function usePlace(enabled = true): PlaceState {
  const [state, setState] = useState<Omit<PlaceState, "refresh">>({
    ...UNKNOWN,
    status: "idle",
    distance: null,
  });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    // 1) Manual pin set by the parent always wins
    const pinned = getActivePlaceId();
    if (pinned) {
      const p: KnownPlace | undefined = readPlaces().find((x) => x.id === pinned);
      if (p) {
        lastId.current = p.id;
        setState({ id: p.id, label: p.label, kind: p.kind, status: "manual", distance: null });
        return;
      }
      setActivePlaceId(null);
    }

    // 2) Continuous geolocation + geofence matching
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ ...UNKNOWN, status: "idle", distance: null });
      return;
    }

    setState((s) => ({ ...s, status: s.status === "idle" ? "locating" : s.status }));

    const apply = (lat: number, lon: number) => {
      const hit = matchPlace(lat, lon);
      if (hit) {
        lastId.current = hit.place.id;
        setState({
          id: hit.place.id,
          label: hit.place.label,
          kind: hit.place.kind,
          status: "auto",
          distance: Math.round(hit.distance),
        });
      } else {
        lastId.current = null;
        setState({ ...UNKNOWN, label: "Đang ở nơi khác", status: "away", distance: null });
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => apply(pos.coords.latitude, pos.coords.longitude),
      () => setState({ ...UNKNOWN, status: "denied", distance: null }),
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, tick]);

  return { ...state, refresh };
}
