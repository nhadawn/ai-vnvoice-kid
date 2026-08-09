import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Mic, Volume2, Play, Sparkles, Baby, X, Lightbulb, Ear,
  ChevronLeft, ChevronRight, Star, Gift, Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { useChildRecorder } from "@/hooks/use-child-recorder";
import {
  EXERCISES, KIND_META, TOPIC_META, filterByTopic,
  type Exercise, type Chip, type Topic,
} from "@/lib/speech-exercises";

type Phase = "idle" | "asking" | "listening" | "celebrating" | "softFail";

export type CoachWord = { label: string; icon: string };

type Attempt = {
  id: string;
  text: string;
  at: Date;
  seconds: number;
  audioUrl?: string;
  selfVoiced: boolean;
  exerciseId: string;
};

const PHONETICS = [
  { sound: "Âm 'S'", example: "Sữa", clarity: 80 },
  { sound: "Âm 'U'", example: "Uống", clarity: 65 },
  { sound: "Âm 'M'", example: "Muốn", clarity: 92 },
  { sound: "Âm 'C'", example: "Cốc", clarity: 74 },
  { sound: "Âm 'T'", example: "Táo", clarity: 58 },
];

const MASCOT: Record<Phase, { face: string; caption: string }> = {
  idle: { face: "🐻", caption: "Chạm nút micro để bắt đầu bài tập nhé!" },
  asking: { face: "🐻", caption: "Gấu đang nói, bé nghe nha..." },
  listening: { face: "🐻", caption: "Gấu đang lắng nghe bé nói đấy!" },
  celebrating: { face: "🐻", caption: "Bé giỏi lắm! Sang bài tiếp nhé!" },
  softFail: { face: "🐻", caption: "Bé cố gắng rất tốt rồi! Mình học tiếp nha." },
};

const GIFTS = ["🎈", "🍭", "🧸", "🚗", "🏅", "👑"];

export function SpeechCoach({ words }: { words: CoachWord[] }) {
  // ── Danh sách bài tập của phiên ────────────────────────────
  const [topic, setTopic] = useState<Topic | "all">("all");
  const custom: Exercise | null = useMemo(() => {
    if (words.length === 0) return null;
    return {
      id: "custom-board",
      kind: "echo",
      topic: "needs",
      prompt: words.map((w) => w.label).join(" "),
      target: words.map((w) => w.label).join(" "),
      chips: words.map((w) => ({ label: w.label, icon: w.icon })),
      stars: 3,
    };
  }, [words]);

  const session = useMemo(() => {
    const list = filterByTopic(topic);
    return topic === "all" && custom ? [custom, ...list] : list;
  }, [topic, custom]);

  const [index, setIndex] = useState(0);
  const ex = session[Math.min(index, session.length - 1)] ?? EXERCISES[0];

  // ── Trạng thái luyện tập ──────────────────────────────────
  const [phase, setPhase] = useState<Phase>("idle");
  const [stars, setStars] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rec = useChildRecorder();

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => clearTimers(), []);

  const stopAll = useCallback(() => {
    clearTimers();
    window.speechSynthesis?.cancel();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      stopAll();
      setPhase("idle");
      setPicked(null);
      setIndex(((next % session.length) + session.length) % session.length);
    },
    [session.length, stopAll],
  );

  // ── Kết thúc 1 bài: ăn mừng 2s rồi tự chuyển bài ──────────
  const finish = useCallback(
    (opts: { selfVoiced: boolean; audioUrl?: string; seconds?: number; earned: number }) => {
      setPhase("celebrating");
      setStars((s) => s + opts.earned);
      setAttempts((a) => [
        {
          id: crypto.randomUUID(),
          text: ex.target,
          at: new Date(),
          seconds: opts.seconds ?? 2,
          audioUrl: opts.audioUrl,
          selfVoiced: opts.selfVoiced,
          exerciseId: ex.id,
        },
        ...a,
      ]);
      speak(opts.selfVoiced ? "Bé giỏi lắm!" : "Đúng rồi, bé giỏi lắm!", { emotion: "happy" });
      after(2000, () => {
        if (index + 1 >= session.length) {
          setPhase("idle");
          setIndex(0);
        } else {
          setIndex((i) => i + 1);
          setPicked(null);
          setPhase("idle");
          if (autoRun) after(400, () => startRef.current?.());
        }
      });
    },
    [ex, index, session.length, autoRun],
  );

  // ── Fail-soft: 5s yên lặng → đọc đáp án, khen, sang bài ───
  const softFail = useCallback(async () => {
    await rec.stop();
    setPhase("softFail");
    speak(`Đáp án là ${ex.target}. Bé cố gắng rất tốt rồi!`, { emotion: "happy" });
    after(2600, () => {
      setPhase("idle");
      setPicked(null);
      setIndex((i) => (i + 1 >= session.length ? 0 : i + 1));
      if (autoRun) after(500, () => startRef.current?.());
    });
  }, [ex.target, rec, session.length, autoRun]);

  // ── Bắt đầu 1 lượt: AI đọc mẫu/hỏi → ghi âm bé ───────────
  const start = useCallback(async () => {
    if (phase === "asking" || phase === "listening") return;
    clearTimers();
    setPicked(null);
    setPhase("asking");
    speak(ex.prompt, { emotion: "happy" });
    const modelMs = Math.max(1600, ex.prompt.length * 130);
    after(modelMs, async () => {
      setPhase("listening");
      const ok = await rec.start();
      if (!ok) {
        // Không có micro: chờ bé chạm thẻ, vẫn fail-soft sau 6s
        after(6000, () => softFail());
        return;
      }
      after(5000, async () => {
        if (rec.voicedRef.current) {
          const clip = await rec.stop();
          finish({
            selfVoiced: true,
            audioUrl: clip?.url,
            seconds: clip?.seconds,
            earned: ex.stars,
          });
        } else {
          softFail();
        }
      });
    });
  }, [ex, phase, rec, finish, softFail]);

  const startRef = useRef<() => void>(() => {});
  startRef.current = start;

  // Dừng ghi sớm khi phụ huynh bấm "Xong"
  const stopEarly = useCallback(async () => {
    clearTimers();
    const clip = await rec.stop();
    finish({ selfVoiced: !!clip, audioUrl: clip?.url, seconds: clip?.seconds, earned: ex.stars });
  }, [rec, finish, ex.stars]);

  // Bé chạm thẻ trả lời
  const pick = useCallback(
    async (c: Chip) => {
      if (phase === "celebrating") return;
      setPicked(c.label);
      speak(c.label);
      if (rec.recording) await rec.stop();
      clearTimers();
      if (c.correct === false || (!c.correct && ex.options?.some((o) => o.correct))) {
        after(700, () => {
          speak("Gần rồi, bé thử thẻ khác nha!", { emotion: "happy" });
          setPicked(null);
        });
        return;
      }
      after(500, () => finish({ selfVoiced: false, earned: Math.max(1, ex.stars - 1) as number }));
    },
    [phase, rec, ex, finish],
  );

  const busy = phase === "asking" || phase === "listening";
  const chips = ex.chips ?? [];
  const completed = attempts.length;
  const selfRate = completed
    ? Math.round((attempts.filter((a) => a.selfVoiced).length / completed) * 100)
    : 0;
  const gift = GIFTS[Math.min(GIFTS.length - 1, Math.floor(stars / 4))];

  return (
    <div className="relative flex flex-col gap-5">
      {/* Header: nhãn + sao + drawer ba mẹ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
          <Sparkles className="h-4 w-4" /> Interactive Speech Studio
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold">
            <Star className="h-4 w-4 fill-current text-amber-500" /> {stars}
            <span className="ml-1 text-lg" aria-label="Quà ảo">{gift}</span>
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
                <SheetDescription>Thống kê phiên luyện tập của bé.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "Câu hoàn thành", v: String(completed) },
                    { k: "Tỷ lệ tự bật âm", v: `${selfRate}%` },
                    { k: "Sao tích luỹ", v: String(stars) },
                  ].map((s) => (
                    <div key={s.k} className="rounded-2xl border bg-card p-3 text-center">
                      <p className="text-2xl font-extrabold">{s.v}</p>
                      <p className="text-[11px] leading-tight text-muted-foreground">{s.k}</p>
                    </div>
                  ))}
                </div>

                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Lịch sử thu âm giọng bé
                  </h3>
                  {attempts.length === 0 && (
                    <p className="text-sm text-muted-foreground">Chưa có lượt nào trong phiên này.</p>
                  )}
                  <ul className="space-y-2">
                    {attempts.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-10 w-10 shrink-0 rounded-full"
                          aria-label={`Nghe lại: ${a.text}`}
                          onClick={() => {
                            if (a.audioUrl) new Audio(a.audioUrl).play().catch(() => speak(a.text));
                            else speak(a.text);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{a.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.at.toLocaleString("vi-VN", {
                              hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit",
                            })}{" "}
                            • {a.seconds}s • {a.audioUrl ? "giọng bé" : "chạm thẻ"}
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
                    <strong>Gợi ý cho Mẹ:</strong> Bé đã bật âm <strong>'S'</strong> rất tốt. Hãy khen và
                    nhắc lại từ <strong>“Sữa”</strong> khi cho bé uống nước thực tế nhé!
                  </p>
                </section>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bộ lọc chủ đề */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {(["all", ...(Object.keys(TOPIC_META) as Topic[])] as (Topic | "all")[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTopic(t); setIndex(0); setPhase("idle"); stopAll(); }}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition",
              topic === t ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {t === "all" ? "✨ Tất cả" : `${TOPIC_META[t].icon} ${TOPIC_META[t].label}`}
          </button>
        ))}
      </div>

      {/* Tiến trình bài học */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>
            {KIND_META[ex.kind].icon} {KIND_META[ex.kind].label}
          </span>
          <span className="text-muted-foreground">
            Bài {Math.min(index + 1, session.length)} / {session.length}
          </span>
        </div>
        <Progress value={((index + 1) / session.length) * 100} className="h-2.5 rounded-full" />
      </div>

      {/* Khung bài tập */}
      <div className="rounded-3xl border-2 border-dashed bg-card/70 p-4">
        <p className="mb-3 text-center text-lg font-extrabold">
          {ex.kind === "echo" ? `“${ex.prompt}”` : ex.prompt}
        </p>
        <p className="mb-4 text-center text-sm text-muted-foreground">{KIND_META[ex.kind].hint}</p>

        {ex.image && (
          <img
            src={ex.image}
            alt={ex.imageAlt ?? ex.target}
            loading="lazy"
            width={768}
            height={768}
            className="mx-auto mb-4 h-48 w-48 rounded-3xl border object-cover shadow-sm"
          />
        )}

        {chips.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
            {chips.map((c, i) => {
              const revealed = !c.hidden || picked === c.label || phase === "celebrating";
              return (
                <div
                  key={`${c.label}-${i}`}
                  className={cn(
                    "flex min-w-24 flex-col items-center gap-1 rounded-2xl px-4 py-3 shadow-sm",
                    revealed ? "bg-secondary" : "border-2 border-dashed border-primary/50 bg-muted",
                  )}
                  style={{ animation: "scale-in 0.25s ease-out both", animationDelay: `${i * 70}ms` }}
                >
                  <span className="text-4xl" aria-hidden>{revealed ? c.icon : "❔"}</span>
                  <span className="text-base font-bold text-secondary-foreground">
                    {revealed ? c.label : "???"}
                  </span>
                </div>
              );
            })}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Đọc lại câu"
              onClick={() => speak(ex.prompt)}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        )}

        {ex.options && ex.options.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {ex.options.map((o, i) => (
              <button
                key={`${o.label}-${i}`}
                type="button"
                onClick={() => pick(o)}
                className={cn(
                  "flex min-w-28 flex-col items-center gap-1 rounded-2xl border-2 bg-card px-4 py-3 font-bold shadow-sm transition active:scale-95",
                  picked === o.label ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted",
                )}
              >
                <span className="text-4xl" aria-hidden>{o.icon}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Linh vật */}
      <div className="relative flex flex-col items-center justify-center gap-4 py-4">
        {busy && (
          <>
            <span
              className={cn("pointer-events-none absolute size-52 rounded-full border-4",
                phase === "asking" ? "border-primary/40" : "border-accent/50")}
              style={{ animation: "coach-ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
            />
            <span
              className={cn("pointer-events-none absolute size-52 rounded-full border-4",
                phase === "asking" ? "border-primary/30" : "border-accent/40")}
              style={{ animation: "coach-ping 1.6s cubic-bezier(0,0,0.2,1) 0.55s infinite" }}
            />
          </>
        )}

        {phase === "celebrating" &&
          Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute text-2xl"
              style={{ left: `${8 + i * 7}%`, animation: `coach-star 1.9s ease-out ${i * 0.12}s infinite` }}
            >
              {i % 3 === 0 ? "⭐" : i % 3 === 1 ? "✨" : "🎉"}
            </span>
          ))}

        <div
          className="relative flex size-36 items-center justify-center rounded-full bg-secondary/70 text-7xl shadow-inner"
          style={{
            animation:
              phase === "celebrating" ? "coach-bounce 0.6s ease-in-out infinite"
              : phase === "asking" ? "coach-talk 0.5s ease-in-out infinite"
              : phase === "listening" ? "coach-breathe 2s ease-in-out infinite"
              : undefined,
            transform: phase === "listening" ? `scale(${1 + rec.level * 0.12})` : undefined,
          }}
          role="img"
          aria-label="Trợ lý AI hình gấu"
        >
          {MASCOT[phase].face}
          {phase === "celebrating" && (
            <span className="absolute -bottom-1 -right-1 text-3xl" aria-hidden>👏</span>
          )}
          {phase === "listening" && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-accent p-2 text-accent-foreground">
              <Ear className="h-5 w-5" />
            </span>
          )}
        </div>

        <div
          key={phase}
          className={cn("max-w-sm rounded-3xl px-5 py-3 text-center text-lg font-bold",
            phase === "celebrating" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}
          style={{ animation: "fade-in 0.3s ease-out both" }}
          aria-live="polite"
        >
          {MASCOT[phase].caption}
        </div>

        {phase === "listening" && (
          <div className="flex h-8 items-end gap-1" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="w-2 rounded-full bg-accent"
                style={{ height: `${8 + Math.min(30, rec.level * 90 * (1 - Math.abs(i - 4) / 6))}px` }}
              />
            ))}
          </div>
        )}

        {phase === "celebrating" && attempts[0]?.audioUrl && (
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => new Audio(attempts[0].audioUrl!).play().catch(() => {})}
          >
            <Play className="mr-1.5 h-4 w-4" /> Nghe lại giọng bé
          </Button>
        )}
        {phase === "celebrating" && (
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: ex.stars }).map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-current"
                style={{ animation: `scale-in 0.3s ease-out ${i * 0.12}s both` }} />
            ))}
          </div>
        )}
      </div>

      {/* Nút micro + điều hướng */}
      <div className="flex flex-col items-center gap-3 pb-4">
        <button
          type="button"
          onClick={() => (phase === "listening" ? stopEarly() : start())}
          aria-label="Tập nói cùng AI"
          className={cn(
            "flex items-center gap-3 rounded-full px-8 py-5 text-xl font-extrabold transition-transform",
            "bg-primary text-primary-foreground shadow-lg hover:scale-[1.03] active:scale-95",
          )}
          style={{
            boxShadow: busy ? "0 0 0 10px color-mix(in oklab, var(--primary) 18%, transparent)" : undefined,
            animation: !busy ? "coach-glow 2.2s ease-in-out infinite" : undefined,
          }}
        >
          <span className="grid size-12 place-items-center rounded-full bg-primary-foreground/20">
            {phase === "listening" ? <Square className="size-6" /> : <Mic className="size-7" />}
          </span>
          {phase === "listening" ? "Bé nói xong — Lưu lại" : phase === "asking" ? "Nghe Gấu nói..." : "Tập nói cùng AI"}
        </button>

        {!rec.supported && (
          <p className="text-xs text-muted-foreground">
            Chưa bật micro — bé vẫn có thể chạm thẻ để trả lời.
          </p>
        )}

        <div className="flex w-full max-w-md items-center justify-between gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => goTo(index - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Bài trước
          </Button>
          <Button
            variant={autoRun ? "default" : "ghost"}
            size="sm"
            className="rounded-full"
            onClick={() => setAutoRun((v) => !v)}
          >
            <Sparkles className="mr-1 h-4 w-4" /> Tự động {autoRun ? "bật" : "tắt"}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => goTo(index + 1)}>
            Bỏ qua <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {busy && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={async () => { stopAll(); await rec.stop(); setPhase("idle"); }}
          >
            <X className="mr-1 h-4 w-4" /> Tạm dừng
          </Button>
        )}

        {stars >= 8 && (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold">
            <Gift className="h-4 w-4" /> Bé đã đổi được quà {gift} — hoan hô!
          </div>
        )}
      </div>
    </div>
  );
}
