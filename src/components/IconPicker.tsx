import { useDeferredValue, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Search } from "lucide-react";
import { suggestIcons } from "@/lib/icon-suggest";
import { EMOJI_BY_GROUP, searchEmoji } from "@/lib/emoji-search";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (icon: string) => void;
  label: string; // the word being typed — drives AI suggestions
}

export function IconPicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);
  const ai = useMemo(() => suggestIcons(label, 8), [label]);
  const results = useMemo(() => (dq.trim() ? searchEmoji(dq, 300) : null), [dq]);

  const pick = (icon: string) => { onChange(icon); setOpen(false); };

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-11 rounded-md border bg-background text-2xl flex items-center justify-center hover:bg-muted transition"
            aria-label="Chọn biểu tượng"
          >
            {value || "🔲"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[22rem] p-3" align="start">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm bằng tiếng Việt: sữa, chó, xe, mẹ..."
              className="pl-8 h-9"
            />
          </div>
          <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
            {ai.length > 0 && !q && (
              <div>
                <div className="text-xs font-semibold text-primary flex items-center gap-1 mb-1">
                  <Sparkles className="h-3.5 w-3.5" />AI đề xuất cho "{label}"
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {ai.map((i) => (
                    <button key={"ai" + i} type="button" onClick={() => pick(i)}
                      className="text-xl h-8 rounded hover:bg-primary/15 ring-1 ring-primary/30">{i}</button>
                  ))}
                </div>
              </div>
            )}

            {results ? (
              results.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  Không tìm thấy biểu tượng nào cho "{q}".
                </p>
              ) : (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    {results.length} kết quả cho "{q}"
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {results.map((e, idx) => (
                      <button key={e.e + idx} type="button" onClick={() => pick(e.e)} title={e.n}
                        className={cn("text-xl h-8 rounded hover:bg-muted", e.e === value && "ring-2 ring-primary")}>{e.e}</button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              EMOJI_BY_GROUP.map((g) => (
                <div key={g.group}>
                  <div className="text-xs font-semibold text-muted-foreground mb-1 sticky top-0 bg-popover py-0.5">
                    {g.label} <span className="font-normal">({g.items.length})</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {g.items.map((e, idx) => (
                      <button key={e.e + idx} type="button" onClick={() => pick(e.e)} title={e.n}
                        className={cn("text-xl h-8 rounded hover:bg-muted", e.e === value && "ring-2 ring-primary")}>{e.e}</button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {ai.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Sparkles className="h-3 w-3 text-primary" />
          {ai.slice(0, 5).map((i) => (
            <button key={"q" + i} type="button" onClick={() => onChange(i)}
              className={cn("text-lg leading-none px-1 rounded hover:bg-primary/15", i === value && "ring-2 ring-primary")}>{i}</button>
          ))}
        </div>
      )}
    </div>
  );
}
