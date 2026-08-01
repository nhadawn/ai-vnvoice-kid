import { useCallback, useEffect, useState } from "react";
import {
  getActivePlaceId,
  readPlaces,
  resolvePlace,
  setActivePlaceId,
  type KnownPlace,
  type PlaceKind,
} from "@/lib/context-memory";

export interface PlaceState {
  id: string;
  label: string;
  kind: PlaceKind | null;
  status: "idle" | "locating" | "ready" | "denied" | "manual";
  /** re-run detection / re-read the manual pin */
  refresh: () => void;
}

const UNKNOWN = { id: "unknown", label: "Không rõ vị trí", kind: null } as const;

/**
 * Resolves the current place: a manual pin chosen by the parent wins, otherwise
 * a coarse on-device match from geolocation against saved places.
 */
export function usePlace(enabled = true): PlaceState {
  const [state, setState] = useState<Omit<PlaceState, "refresh">>({ ...UNKNOWN, status: "idle" });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    // 1) Manual pin set by the parent
    const pinned = getActivePlaceId();
    if (pinned) {
      const p: KnownPlace | undefined = readPlaces().find((x) => x.id === pinned);
      if (p) {
        setState({ id: p.id, label: p.label, kind: p.kind, status: "manual" });
        return;
      }
      setActivePlaceId(null);
    }

    // 2) Geolocation (opt-in per browser)
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ ...UNKNOWN, status: "idle" });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const p = resolvePlace(pos.coords.latitude, pos.coords.longitude);
        setState({ id: p.id, label: p.label, kind: p.kind, status: "ready" });
      },
      () => {
        if (!cancelled) setState({ ...UNKNOWN, status: "denied" });
      },
      { maximumAge: 300_000, timeout: 8000, enableHighAccuracy: false },
    );
    return () => { cancelled = true; };
  }, [enabled, tick]);

  return { ...state, refresh };
}
