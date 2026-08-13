import { useEffect, useRef, useState } from "react";
import { Siren, Check } from "lucide-react";
import { playSOS } from "@/lib/tts";

const HOLD_MS = 1800;

/**
 * Fixed, always-visible SOS button (kid mode included).
 * Requires a ~1.8s press-and-hold with a circular fill animation
 * so a stray tap never triggers the alarm.
 */
export function SOSButton() {
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef<number>(0);

  const stop = () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  };

  useEffect(() => stop, []);

  const fire = () => {
    stop();
    setSent(true);
    playSOS();
    window.setTimeout(() => setSent(false), 6000);
  };

  const begin = () => {
    if (sent || raf.current != null) return;
    start.current = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) return fire();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const pct = Math.round(progress * 100);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="Giữ để gửi tín hiệu SOS"
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        className="relative h-24 w-24 select-none touch-none rounded-full bg-destructive text-destructive-foreground shadow-xl ring-4 ring-destructive/25 transition-transform active:scale-95"
        style={{
          background: `conic-gradient(color-mix(in oklab, var(--destructive) 55%, white) ${pct}%, var(--destructive) ${pct}%)`,
        }}
      >
        <span className="absolute inset-2 rounded-full bg-destructive flex flex-col items-center justify-center">
          {sent ? <Check className="h-8 w-8" /> : <Siren className="h-8 w-8" />}
          <span className="text-sm font-extrabold tracking-wide">SOS</span>
        </span>
      </button>
      <span className="rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold shadow border text-center max-w-28 leading-tight">
        {sent ? "Đang gửi tín hiệu SOS..." : progress > 0 ? "Giữ tiếp..." : "Giữ 2 giây"}
      </span>
    </div>
  );
}
