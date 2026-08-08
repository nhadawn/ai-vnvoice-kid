import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Volume2, Play, Sparkles, Baby, X, Lightbulb, Ear } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";

type Phase = "idle" | "speaking" | "listening" | "celebrating" | "softFail";

export type CoachWord = { label: string; icon: string };

type Attempt = { id: string; text: string; at: Date; seconds: number };

const PHONETICS = [
  { sound: "Âm 'S'", example: "Sữa", clarity: 80 },
  { sound: "Âm 'U'", example: "Uống", clarity: 65 },
  { sound: "Âm 'M'", example: "Muốn", clarity: 92 },
  { sound: "Âm 'C'", example: "Con", clarity: 74 },
];

const MASCOT_STATE: Record<Phase, { face: string; caption: string }> = {
  idle: { face: "🐻", caption: "Chạm nút micro để tập nói cùng Gấu nhé!" },
  speaking: { face: "🐻", caption: "Gấu đọc mẫu cho bé nghe..." },
  listening: { face: "🐻", caption: "Gấu đang lắng nghe bé nói đấy!" },
  celebrating: { face: "🐻", caption: "Bé giỏi lắm! Cùng nghe lại giọng bé nhé!" },
  softFail: { face: "🐻", caption: "Bé bấm thẻ giỏi lắm rồi!" },
};

export function SpeechCoach({ words }: { words: CoachWord[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [attempts, setAttempts] = useState<Attempt[]>([
    { id: "seed-1", text: "Con muốn uống sữa", at: new Date(Date.now() - 36e5), seconds: 3 },
    { id: "seed-2", text: "Mẹ ơi", at: new Date(Date.now() - 72e5), seconds: 2 },
  ]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sentence = words.map((w) => w.label).join(" ");

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const start = useCallback(() => {
    if (phase !== "idle" && phase !== "celebrating" && phase !== "softFail") return;
    clearTimers();
    // Bước 1 — phát âm mẫu
    setPhase("speaking");
    if (sentence) speak(sentence, { emotion: "happy" });

    const modelMs = Math.max(1800, sentence.length * 130);
    after(modelMs, () => {
      // Bước 2 — lắng nghe
      setPhase("listening");
      // Fail-soft: 5 giây không có tiếng → về trạng thái tĩnh, nhẹ nhàng
      const heard = Math.random() > 0.15;
      if (heard) {
        after(3500, () => {
          // Bước 3 — khen ngợi + game hoá
          setPhase("celebrating");
          setAttempts((a) => [
            { id: crypto.randomUUID(), text: sentence || "…", at: new Date(), seconds: 3 },
            ...a,
          ]);
          speak("Bé giỏi lắm!", { emotion: "happy" });
          after(6000, () => setPhase("idle"));
        });
      } else {
        after(5000, () => {
          setPhase("softFail");
          speak("Bé bấm thẻ giỏi lắm rồi!", { emotion: "happy" });
          after(4000, () => setPhase("idle"));
        });
      }
    });
  }, [phase, sentence]);

  const busy = phase === "speaking" || phase === "listening";

  return (
    <div className="relative flex flex-col gap-6">
      {/* Parent drawer toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
          <Sparkles className="h-4 w-4" /> Luyện nói cùng AI
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              <Baby className="mr-1.5 h-4 w-4" /> Dành cho Ba Mẹ
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Bảng theo dõi luyện nói</SheetTitle>
              <SheetDescription>Dữ liệu tổng hợp từ các lượt bé cất giọng.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Lịch sử thu âm
                </h3>
                <ul className="space-y-2">
                  {attempts.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-2xl border bg-card p-3"
                    >
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-10 w-10 shrink-0 rounded-full"
                        aria-label={`Nghe lại: ${a.text}`}
                        onClick={() => speak(a.text)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{a.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.at.toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })}{" "}
                          • {a.seconds}s
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Bản đồ nhiệt âm tiết
                </h3>
                <div className="space-y-3">
                  {PHONETICS.map((p) => (
                    <div key={p.sound} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">
                          {p.sound} <span className="text-muted-foreground">({p.example})</span>
                        </span>
                        <span className="font-bold">{p.clarity}% rõ</span>
                      </div>
                      <Progress value={p.clarity} className="h-3 rounded-full" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-4">
                <h3 className="mb-1.5 flex items-center gap-2 font-bold">
                  <Lightbulb className="h-4 w-4" /> Thẻ gợi ý AI
                </h3>
                <p className="text-sm leading-relaxed">
                  <strong>Gợi ý cho Mẹ:</strong> Bé đã bật âm <strong>'S'</strong> rất tốt. Hãy thử
                  khen và nhắc lại từ <strong>“Sữa”</strong> khi cho bé uống nước thực tế nhé!
                </p>
              </section>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Phần trên — thanh câu lệnh AAC */}
      <div className="rounded-3xl border-2 border-dashed bg-card/70 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {words.length === 0 && (
            <p className="text-muted-foreground">Chưa có thẻ nào được chọn.</p>
          )}
          {words.map((w, i) => (
            <div
              key={`${w.label}-${i}`}
              className="flex min-w-24 flex-col items-center gap-1 rounded-2xl bg-secondary px-4 py-3 shadow-sm"
              style={{ animation: "scale-in 0.25s ease-out both", animationDelay: `${i * 70}ms` }}
            >
              <span className="text-4xl" aria-hidden>
                {w.icon}
              </span>
              <span className="text-base font-bold text-secondary-foreground">{w.label}</span>
            </div>
          ))}
          {words.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto rounded-full"
              aria-label="Đọc lại câu"
              onClick={() => speak(sentence)}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Phần giữa — linh vật */}
      <div className="relative flex flex-col items-center justify-center gap-4 py-6">
        {/* sóng âm */}
        {busy && (
          <>
            <span
              className={cn(
                "pointer-events-none absolute size-52 rounded-full border-4",
                phase === "speaking" ? "border-primary/40" : "border-accent/50",
              )}
              style={{ animation: "coach-ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
            />
            <span
              className={cn(
                "pointer-events-none absolute size-52 rounded-full border-4",
                phase === "speaking" ? "border-primary/30" : "border-accent/40",
              )}
              style={{ animation: "coach-ping 1.6s cubic-bezier(0,0,0.2,1) 0.55s infinite" }}
            />
          </>
        )}

        {/* pháo hoa / ngôi sao bay */}
        {phase === "celebrating" &&
          Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute text-2xl"
              style={{
                left: `${8 + i * 7}%`,
                animation: `coach-star 1.9s ease-out ${i * 0.12}s infinite`,
              }}
            >
              {i % 3 === 0 ? "⭐" : i % 3 === 1 ? "✨" : "🎉"}
            </span>
          ))}

        <div
          className="relative flex size-40 items-center justify-center rounded-full bg-secondary/70 text-7xl shadow-inner"
          style={{
            animation:
              phase === "celebrating"
                ? "coach-bounce 0.6s ease-in-out infinite"
                : phase === "speaking"
                  ? "coach-talk 0.5s ease-in-out infinite"
                  : phase === "listening"
                    ? "coach-breathe 2s ease-in-out infinite"
                    : undefined,
          }}
          role="img"
          aria-label="Trợ lý AI hình gấu"
        >
          {MASCOT_STATE[phase].face}
          {phase === "celebrating" && (
            <span className="absolute -bottom-1 -right-1 text-3xl" aria-hidden>
              👏
            </span>
          )}
          {phase === "listening" && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-accent p-2 text-accent-foreground">
              <Ear className="h-5 w-5" />
            </span>
          )}
        </div>

        <div
          key={phase}
          className={cn(
            "max-w-sm rounded-3xl px-5 py-3 text-center text-lg font-bold",
            phase === "celebrating"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
          style={{ animation: "fade-in 0.3s ease-out both" }}
          aria-live="polite"
        >
          {MASCOT_STATE[phase].caption}
        </div>

        {phase === "celebrating" && (
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => speak(attempts[0]?.text ?? sentence)}
          >
            <Play className="mr-1.5 h-4 w-4" /> Nghe lại giọng bé
          </Button>
        )}
      </div>

      {/* Phần dưới — nút micro */}
      <div className="flex flex-col items-center gap-3 pb-4">
        <button
          type="button"
          onClick={start}
          disabled={busy || words.length === 0}
          aria-label="Tập nói cùng AI"
          className={cn(
            "flex items-center gap-3 rounded-full px-10 py-6 text-2xl font-extrabold transition-transform",
            "bg-primary text-primary-foreground shadow-lg hover:scale-[1.03] active:scale-95",
            "disabled:opacity-70 disabled:hover:scale-100",
          )}
          style={{
            boxShadow: busy
              ? "0 0 0 10px color-mix(in oklab, var(--primary) 18%, transparent)"
              : undefined,
            animation: !busy && words.length > 0 ? "coach-glow 2.2s ease-in-out infinite" : undefined,
          }}
        >
          <span className="grid size-14 place-items-center rounded-full bg-primary-foreground/20">
            {phase === "listening" ? <Ear className="size-8" /> : <Mic className="size-8" />}
          </span>
          {phase === "listening" ? "Nói đi bé ơi!" : phase === "speaking" ? "Nghe Gấu đọc..." : "Tập nói cùng AI"}
        </button>
        {busy && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={() => {
              clearTimers();
              window.speechSynthesis?.cancel();
              setPhase("idle");
            }}
          >
            <X className="mr-1 h-4 w-4" /> Tạm dừng
          </Button>
        )}
      </div>
    </div>
  );
}
