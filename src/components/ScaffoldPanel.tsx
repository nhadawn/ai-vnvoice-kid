import { Lightbulb, Sparkles, X, ArrowRight, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Card, ScaffoldLevel } from "@/lib/aac-types";
import { LEVEL_DESCRIPTIONS } from "@/lib/aac-types";

interface Props {
  level: ScaffoldLevel;
  progress: { current: number; target: number };
  text: string;
  rationale: string;
  candidates: Card[];
  ignoredCount: number;
  failThreshold: number;
  timeBucket: "morning" | "noon" | "evening" | "night";
  onPickCandidate: (card: Card) => void;
  onDismiss: () => void;
  onFeedback: (kind: "success" | "skip") => void;
}

const TIME_LABEL: Record<Props["timeBucket"], string> = {
  morning: "🌅 Sáng",
  noon: "☀️ Trưa",
  evening: "🌇 Chiều tối",
  night: "🌙 Đêm",
};

const LEVEL_NUM: Record<ScaffoldLevel, number> = {
  level_1: 1,
  level_2: 2,
  level_3: 3,
  level_4: 4,
};

export function ScaffoldPanel({
  level,
  progress,
  text,
  rationale,
  candidates,
  ignoredCount,
  failThreshold,
  timeBucket,
  onPickCandidate,
  onDismiss,
  onFeedback,
}: Props) {
  const pct = Math.min(100, Math.round((progress.current / Math.max(1, progress.target)) * 100));
  return (
    <div className="relative rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 sm:p-4 shadow-md animate-in fade-in slide-in-from-top-2">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        aria-label="Ẩn gợi ý"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header row: level badge, time chip, skip counter */}
      <div className="flex items-center gap-2 flex-wrap pr-8">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-bold">
          <Sparkles className="h-3 w-3" /> AI Giàn giáo · Mức {LEVEL_NUM[level]}
        </span>
        <span className="text-xs text-muted-foreground">{LEVEL_DESCRIPTIONS[level]}</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">
          <Clock className="h-3 w-3" />{TIME_LABEL[timeBucket]}
        </span>
      </div>

      {/* Level progress bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Tiến tới Mức {LEVEL_NUM[level] + 1 <= 4 ? LEVEL_NUM[level] + 1 : "tối đa"}</span>
          <span>{progress.current}/{progress.target}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Proposed sentence */}
      <div className="mt-3 flex items-start gap-2">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Thử nói</div>
          <div className="text-lg sm:text-xl font-bold text-primary leading-snug">"{text}"</div>
          <div className="text-xs text-muted-foreground mt-0.5">{rationale}</div>
        </div>
      </div>

      {/* Candidate buttons — tap to add */}
      {candidates.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" /> Chạm để thêm vào câu
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {candidates.slice(0, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => onPickCandidate(c)}
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-primary/40 bg-card p-2 hover:bg-primary/10 hover:border-primary hover:scale-[1.03] active:scale-95 transition-all"
              >
                <span className="text-2xl leading-none">{c.emoji ?? "✨"}</span>
                <span className="text-sm font-semibold text-center leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {ignoredCount > 0 && (
        <div className="mt-2 text-[11px] text-muted-foreground text-right">
          Bỏ qua {ignoredCount}/{failThreshold} · AI sẽ nghỉ nếu bé bỏ qua nhiều
        </div>
      )}
    </div>
  );
}
