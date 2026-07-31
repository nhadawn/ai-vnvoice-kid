import { useEffect, useState } from "react";
import { resolvePlace } from "@/lib/context-memory";

export interface PlaceState {
  id: string;
  label: string;
  status: "idle" | "locating" | "ready" | "denied";
}

/** Resolves a coarse, on-device place id from geolocation (opt-in per browser). */
export function usePlace(enabled = true): PlaceState {
  const [state, setState] = useState<PlaceState>({ id: "unknown", label: "Không rõ vị trí", status: "idle" });

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    setState((s) => ({ ...s, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const { id, label } = resolvePlace(pos.coords.latitude, pos.coords.longitude);
        setState({ id, label, status: "ready" });
      },
      () => {
        if (!cancelled) setState({ id: "unknown", label: "Không rõ vị trí", status: "denied" });
      },
      { maximumAge: 300_000, timeout: 8000, enableHighAccuracy: false },
    );
    return () => { cancelled = true; };
  }, [enabled]);

  return state;
}
