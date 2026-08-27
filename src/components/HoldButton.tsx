import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onComplete: () => void;
  durationMs?: number;
  label: string;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Press-and-hold button with a fill progress bar. Used so a child cannot
 * accidentally leave Kid Mode with a single tap.
 */
export function HoldButton({
  onComplete,
  durationMs = 2000,
  label,
  hint,
  className = "",
  children,
}: Props) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    start.current = null;
    setProgress(0);
  }, []);

  useEffect(() => stop, [stop]);

  const tick = useCallback(
    (t: number) => {
      if (start.current == null) start.current = t;
      const pct = Math.min(1, (t - start.current) / durationMs);
      setProgress(pct);
      if (pct >= 1) {
        if (!done.current) {
          done.current = true;
          onComplete();
          setTimeout(() => { done.current = false; }, 400);
        }
        stop();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    },
    [durationMs, onComplete, stop],
  );

  const begin = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={hint ?? label}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className={`relative overflow-hidden select-none touch-none rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/50 ${className}`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-primary/25 transition-none"
        style={{ width: `${progress * 100}%` }}
        aria-hidden
      />
      <span className="relative flex items-center gap-1.5">{children ?? label}</span>
    </button>
  );
}
