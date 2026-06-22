import { cn } from "@/lib/utils";
import type { Card, PartOfSpeech } from "@/lib/aac-types";

const POS_BG: Record<PartOfSpeech, string> = {
  noun: "bg-[color:var(--noun)]",
  verb: "bg-[color:var(--verb)]",
  adjective: "bg-[color:var(--adjective)]",
  phrase: "bg-[color:var(--phrase)]",
  pronoun: "bg-[color:var(--pronoun)]",
};

interface Props {
  card: Card;
  onTap: (card: Card) => void;
  highlight?: "suggested" | "dim" | "normal";
  signedImageUrl?: string;
}

export function AACCard({ card, onTap, highlight = "normal", signedImageUrl }: Props) {
  return (
    <button
      onClick={() => onTap(card)}
      className={cn(
        "group relative aspect-square rounded-2xl border-2 border-black/5 p-2 flex flex-col items-center justify-center text-center shadow-sm transition-all active:scale-95",
        POS_BG[card.part_of_speech],
        highlight === "suggested" && "aac-suggested aac-ghost-emphasized",
        highlight === "dim" && "aac-ghost-dim",
      )}
      style={{ color: "oklch(0.22 0.04 250)" }}
      aria-label={card.label}
    >
      <div className="flex-1 flex items-center justify-center w-full">
        {signedImageUrl ? (
          <img src={signedImageUrl} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
        ) : (
          <span className="text-5xl md:text-6xl leading-none">{card.emoji ?? "🔲"}</span>
        )}
      </div>
      <div className="text-xs md:text-sm font-bold mt-1 line-clamp-2 px-1">{card.label}</div>
    </button>
  );
}
