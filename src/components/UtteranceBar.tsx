import { Button } from "@/components/ui/button";
import { X, Volume2, Trash2 } from "lucide-react";
import type { Card } from "@/lib/aac-types";

interface Props {
  items: Card[];
  onSpeak: () => void;
  onClear: () => void;
  onRemoveLast: () => void;
}

export function UtteranceBar({ items, onSpeak, onClear, onRemoveLast }: Props) {
  return (
    <div className="rounded-2xl border-2 bg-card p-3 shadow-sm flex items-center gap-2 min-h-[88px]">
      <div className="flex-1 flex gap-2 overflow-x-auto">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground italic px-3 self-center">
            Chạm vào thẻ để tạo câu...
          </div>
        ) : (
          items.map((c, i) => (
            <div key={`${c.id}-${i}`} className="flex flex-col items-center justify-center min-w-[64px] rounded-xl bg-muted px-3 py-2">
              <span className="text-2xl leading-none">{c.emoji ?? "🔲"}</span>
              <span className="text-xs font-semibold mt-1">{c.label}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-1.5">
        <Button size="icon" variant="outline" onClick={onRemoveLast} disabled={items.length === 0} aria-label="Xóa thẻ cuối">
          <X className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={onClear} disabled={items.length === 0} aria-label="Xóa hết">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={onSpeak} disabled={items.length === 0} aria-label="Đọc câu" className="h-10 w-10">
          <Volume2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
