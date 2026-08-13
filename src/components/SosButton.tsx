import { useEffect, useRef, useState } from "react";
import { Siren } from "lucide-react";
import { playSOS } from "@/lib/tts";

const HOLD_MS = 1800;

/**
 * Big, always-visible SOS button.
 * Must be held ~1.8s (with a circular fill showing progress) so a stray tap
 * never fires an alarm. After firing it shows a clear confirmation state.
 */
export function SosButton() {
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    start.current = null;
    setProgress(0);
  };

  useEffect(() => () => stop(), []);

  const fire = () => {
    stop();
    setSent(true);
    playSOS();
    setTimeout(() => setSent(false), 5000);
  };

  const begin = () => {
    if (sent) return;
    start.current = performance.now();
    const tick = () => {
      if (start.current == null) return;
      const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) return fire();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const deg = Math.round(progress * 360);

  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2">
      {(progress > 0 || sent) && (
        <div
          role="status"
          className={
            "rounded-full px-3 py-1.5 text-sm font-bold shadow-lg " +
            (sent ? "bg-destructive text-destructive-foreground" : "bg-card text-foreground border")
          }
        >
          {sent ? "🚨 Đang gửi tín hiệu SOS..." : "Giữ để gọi SOS..."}
        </div>
      )}
      <button
        type="button"
        aria-label="SOS — giữ 2 giây để gọi giúp đỡ"
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        className="relative h-24 w-24 rounded-full shadow-xl outline-none select-none touch-none active:scale-95 transition-transform"
        style={{
          background: `conic-gradient(hsl(var(--destructive)) ${deg}deg, hsl(var(--destructive) / 0.35) ${deg}deg)`,
        }}
      >
        <span className="absolute inset-[6px] rounded-full bg-destructive text-destructive-foreground flex flex-col items-center justify-center gap-0.5">
          <Siren className={"h-7 w-7 " + (sent ? "animate-pulse" : "")} />
          <span className="text-base font-extrabold leading-none">SOS</span>
        </span>
      </button>
    </div>
  );
}
