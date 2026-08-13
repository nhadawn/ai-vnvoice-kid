import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Card, Category, Child, ScaffoldLevel } from "@/lib/aac-types";
import { AACCard } from "@/components/AACCard";
import { UtteranceBar } from "@/components/UtteranceBar";
import { AddCardDialog } from "@/components/AddCardDialog";
import { ThemePicker } from "@/components/ThemePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BarChart3, X, Lock, LockOpen, Search, Trash2, MapPin, Clock, Mic } from "lucide-react";
import { speak, playAudioUrl, speakSequence, type Emotion } from "@/lib/tts";
import { ModeSwitch } from "@/components/ModeSwitch";
import { SosButton } from "@/components/SosButton";
import { VoiceRecorderDialog } from "@/components/VoiceRecorderDialog";
import { EditCardDialog } from "@/components/EditCardDialog";
import { ScaffoldPanel } from "@/components/ScaffoldPanel";
import { buildBigrams, classifyHighlights, type SmartGridContext } from "@/lib/smart-grid";
import { buildScaffold, shouldPromote } from "@/lib/scaffolding";
import { usePlace } from "@/hooks/use-place";
import { habitScores, logUsage, timeBucketOf, placeVocabScores, placeKindIcon } from "@/lib/context-memory";
import { PlacesDialog } from "@/components/PlacesDialog";
import { toast } from "sonner";

function timeBucket(hour: number): "morning" | "noon" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "noon";
  if (hour >= 15 && hour < 20) return "evening";
  return "night";
}

const LEVEL_PROMO_TARGET = 8;

export const Route = createFileRoute("/_authenticated/board/$childId")({
  head: () => ({ meta: [{ title: "Bảng giao tiếp — AI VNVoice Kid" }] }),
  component: BoardPage,
});

const FAIL_THRESHOLD = 3;

function BoardPage() {
  const { childId } = Route.useParams();
  const nav = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [utterance, setUtterance] = useState<Card[]>([]);
  const [bigrams, setBigrams] = useState<Record<string, Record<string, number>>>({});
  const [unigrams, setUnigrams] = useState<Record<string, number>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [suggestion, setSuggestion] = useState<{ tappedId: string; candidates: Card[]; text: string; rationale: string; slot: "before" | "after" } | null>(null);
  const [recentUtts, setRecentUtts] = useState<{ word_count: number; level: ScaffoldLevel }[]>([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [scaffoldingPaused, setScaffoldingPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [signedAudioUrls, setSignedAudioUrls] = useState<Record<string, string>>({});
  const [recorderCard, setRecorderCard] = useState<Card | null>(null);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const place = usePlace(true);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [habitTick, setHabitTick] = useState(0);

  // Auto geofence: announce whenever the detected place changes so the parent
  // sees the AAC context has switched by itself.
  const lastAutoPlace = useState<{ id: string | null }>(() => ({ id: null }))[0];
  useEffect(() => {
    if (place.status !== "auto") {
      if (place.status === "away") lastAutoPlace.id = null;
      return;
    }
    if (lastAutoPlace.id === place.id) return;
    lastAutoPlace.id = place.id;
    toast.success(`Đã nhận diện: ${place.label}`, {
      description: "AI tự cập nhật gợi ý từ vựng theo nơi bé đang ở.",
    });
  }, [place.status, place.id, place.label, lastAutoPlace]);



  const refresh = useCallback(async () => {
    const [{ data: childData }, { data: catData }, { data: cardData }, { data: uttData }] = await Promise.all([
      supabase.from("children").select("*").eq("id", childId).single(),
      supabase.from("categories").select("*").eq("child_id", childId).order("sort_order"),
      supabase.from("cards").select("*").eq("child_id", childId),
      supabase.from("utterances").select("text, word_count, level").eq("child_id", childId).order("created_at", { ascending: false }).limit(50),
    ]);
    if (childData) setChild(childData as Child);
    if (catData) {
      setCategories(catData as Category[]);
      if (!activeCat && catData[0]) setActiveCat((catData[0] as Category).id);
    }
    if (cardData) setCards(cardData as Card[]);
    if (uttData) {
      const { bigrams: bg, unigrams: ug } = buildBigrams(uttData as { text: string }[]);
      setBigrams(bg);
      setUnigrams(ug);
      setRecentUtts(uttData as { word_count: number; level: ScaffoldLevel }[]);
    }
  }, [childId, activeCat]);

  useEffect(() => { refresh(); }, [refresh]);

  // Sign image URLs (1h expiry, batched)
  useEffect(() => {
    const toSign = cards.filter((c) => c.image_url && !signedUrls[c.image_url]).map((c) => c.image_url!) as string[];
    if (toSign.length === 0) return;
    supabase.storage.from("card-images").createSignedUrls(toSign, 3600).then(({ data }) => {
      if (!data) return;
      setSignedUrls((prev) => {
        const next = { ...prev };
        data.forEach((d) => { if (d.path && d.signedUrl) next[d.path] = d.signedUrl; });
        return next;
      });
    });
  }, [cards, signedUrls]);

  // Sign parent-voice audio URLs
  useEffect(() => {
    const toSign = cards.filter((c) => c.audio_url && !signedAudioUrls[c.audio_url]).map((c) => c.audio_url!) as string[];
    if (toSign.length === 0) return;
    supabase.storage.from("card-audio").createSignedUrls(toSign, 3600).then(({ data }) => {
      if (!data) return;
      setSignedAudioUrls((prev) => {
        const next = { ...prev };
        data.forEach((d) => { if (d.path && d.signedUrl) next[d.path] = d.signedUrl; });
        return next;
      });
    });
  }, [cards, signedAudioUrls]);


  // Habit memory: what this child usually taps at this time & this place
  const habit = useMemo(
    () => habitScores(childId, timeBucketOf(new Date().getHours()), place.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childId, place.id, habitTick],
  );

  // Place vocabulary: words typical of where the child is (home / school / ...)
  const placeVocab = useMemo(
    () => placeVocabScores(cards, place.kind),
    [cards, place.kind],
  );

  const ctx: SmartGridContext = useMemo(() => ({
    hour: new Date().getHours(),
    recentLabels: utterance.map((c) => c.label).reverse(),
    bigramCounts: bigrams,
    unigramCounts: unigrams,
    habit,
    placeVocab,
  }), [utterance, bigrams, unigrams, habit, placeVocab]);


  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const visibleCards = useMemo(() => {
    const q = normalize(search.trim());
    const filtered = cards.filter((c) => {
      if (q) return normalize(c.label).includes(q);
      return !activeCat || c.category_id === activeCat;
    });
    // Reorder so suggested cards appear first (unless grid is locked or searching)
    if (locked || q || !suggestion) return filtered;
    const suggestedSet = new Set(suggestion.candidates.map((c) => c.id));
    const suggested = filtered.filter((c) => suggestedSet.has(c.id));
    const rest = filtered.filter((c) => !suggestedSet.has(c.id));
    return [...suggested, ...rest];
  }, [cards, activeCat, search, suggestion, locked]);

  // Time-of-day + frequency highlights for the visible grid (used when no
  // active scaffolding suggestion). Drives morning/evening pattern surfacing.
  const ambientHighlights = useMemo(
    () => classifyHighlights(visibleCards, ctx, 4),
    [visibleCards, ctx],
  );

  const emotionForCard = (c: Card): Emotion => {
    const l = c.label.toLowerCase();
    if (/vui|cười/.test(l)) return "happy";
    if (/đau|khóc/.test(l)) return "pain";
    if (/buồn|sợ/.test(l)) return "sad";
    return "neutral";
  };

  const logInteraction = async (card: Card, wasSuggested: boolean) => {
    // On-device habit memory (time bucket + coarse place)
    logUsage(childId, card.id, place.id);
    setHabitTick((t) => t + 1);
    await supabase.from("interactions").insert({
      child_id: childId,
      card_id: card.id,
      label: card.label,
      part_of_speech: card.part_of_speech,
      hour_of_day: new Date().getHours(),
      was_suggested: wasSuggested,
      position_in_utterance: utterance.length,
    });
    // Update use_count + last_used_at
    await supabase.from("cards").update({
      use_count: card.use_count + 1,
      last_used_at: new Date().toISOString(),
    }).eq("id", card.id);
  };

  const handleTap = async (card: Card) => {
    const audio = card.audio_url ? signedAudioUrls[card.audio_url] : null;
    if (audio) {
      playAudioUrl(audio).catch(() => speak(card.label, { voice: child?.voice_preference, emotion: emotionForCard(card) }));
    } else {
      speak(card.label, { voice: child?.voice_preference, emotion: emotionForCard(card) });
    }
    const wasSuggested = !!suggestion?.candidates.some((c) => c.id === card.id);
    if (suggestion && !wasSuggested) {
      // Child ignored the suggestion
      const next = ignoredCount + 1;
      setIgnoredCount(next);
      if (next >= FAIL_THRESHOLD) {
        setScaffoldingPaused(true);
        toast.info("AI tạm ngừng gợi ý để bé chủ động hơn.");
        setTimeout(() => { setScaffoldingPaused(false); setIgnoredCount(0); }, 60_000);
      }
    } else if (wasSuggested) {
      setIgnoredCount(0);
    }
    setSuggestion(null);

    const newUtt = [...utterance, card];
    setUtterance(newUtt);
    await logInteraction(card, wasSuggested);

    // Build progressive sentence scaffolding from the WHOLE utterance.
    // e.g. ăn → "Con ăn" → "Con ăn cơm"
    if (child && !scaffoldingPaused) {
      const hint = buildScaffold(newUtt, cards, child.current_level, new Date().getHours(), bigrams);
      if (hint && hint.candidates.length > 0) {
        setSuggestion({
          tappedId: card.id,
          candidates: hint.candidates,
          text: hint.text,
          rationale: hint.rationale,
          slot: hint.slot,
        });
      }
    }
  };

  // Parent taps a candidate in the AI panel — insert it at the correct slot
  // (before/after) to build a canonical Vietnamese sentence.
  const handlePickCandidate = async (card: Card) => {
    if (!suggestion || !child) return;
    const audio = card.audio_url ? signedAudioUrls[card.audio_url] : null;
    if (audio) {
      playAudioUrl(audio).catch(() => speak(card.label, { voice: child.voice_preference, emotion: emotionForCard(card) }));
    } else {
      speak(card.label, { voice: child.voice_preference, emotion: emotionForCard(card) });
    }
    const newUtt = suggestion.slot === "before" ? [card, ...utterance] : [...utterance, card];
    setUtterance(newUtt);
    setIgnoredCount(0);
    await logInteraction(card, true);
    // Chain the next scaffolding step
    const hint = buildScaffold(newUtt, cards, child.current_level, new Date().getHours(), bigrams);
    if (hint && hint.candidates.length > 0) {
      setSuggestion({
        tappedId: card.id,
        candidates: hint.candidates,
        text: hint.text,
        rationale: hint.rationale,
        slot: hint.slot,
      });
    } else {
      setSuggestion(null);
    }
  };

  const handleSpeak = async () => {
    if (utterance.length === 0) return;
    const text = utterance.map((c) => c.label).join(" ");
    speakSequence(
      utterance.map((c) => ({ label: c.label, audioUrl: c.audio_url ? signedAudioUrls[c.audio_url] : null })),
      { voice: child?.voice_preference, joinText: text },
    );

    // Save as utterance to compute MLU
    if (child) {
      const levelOrder: ScaffoldLevel[] = ["level_1", "level_2", "level_3", "level_4"];
      const inferred: ScaffoldLevel =
        utterance.length >= 3 ? "level_4" :
        utterance.length === 2 && utterance.some((c) => c.part_of_speech === "adjective") ? "level_3" :
        utterance.length === 2 ? "level_2" : "level_1";
      await supabase.from("utterances").insert({
        child_id: childId,
        text,
        word_count: utterance.length,
        level: inferred,
      });

      // Check promotion
      const { data: recent } = await supabase
        .from("utterances")
        .select("word_count, level")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (recent) {
        const promoted = shouldPromote(child.current_level, recent as { word_count: number; level: ScaffoldLevel }[]);
        if (promoted) {
          await supabase.from("children").update({ current_level: promoted }).eq("id", childId);
          toast.success(`🎉 Bé ${child.name} đã tiến lên ${promoted.replace("level_", "Mức ")}!`);
          refresh();
        }
      }
    }
    setSuggestion(null);
  };

  const handleDeleteCard = async (card: Card) => {
    if (!confirm(`Xoá thẻ "${card.label}"?`)) return;
    if (card.image_url) {
      await supabase.storage.from("card-images").remove([card.image_url]);
    }
    const { error } = await supabase.from("cards").delete().eq("id", card.id);
    if (error) return toast.error("Không xoá được: " + error.message);
    toast.success(`Đã xoá "${card.label}"`);
    setCards((cs) => cs.filter((c) => c.id !== card.id));
    setUtterance((u) => u.filter((c) => c.id !== card.id));
  };

  if (!child) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {caregiver && (
              <Link to="/app"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            )}
            <div>
              <h1 className="font-bold leading-tight">{child.name}</h1>
              <p className="text-xs text-muted-foreground">Mức {child.current_level.replace("level_", "")}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end items-center">
            {caregiver && (
              <>
                <Button variant="outline" size="sm" onClick={() => setPlacesOpen(true)}>
                  <MapPin className="h-4 w-4 mr-1.5" />Địa điểm
                </Button>
                <Button
                  variant={locked ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setLocked((v) => !v);
                    if (!locked) setSuggestion(null);
                    toast.info(locked ? "Đã mở khoá lưới — AI tiếp tục gợi ý" : "Đã khoá lưới — giữ nguyên vị trí thẻ");
                  }}
                  aria-label={locked ? "Mở khoá lưới" : "Khoá lưới"}
                >
                  {locked ? <Lock className="h-4 w-4 mr-1.5" /> : <LockOpen className="h-4 w-4 mr-1.5" />}
                  {locked ? "Đã khoá" : "Khoá lưới"}
                </Button>
                <ThemePicker />
                <AddCardDialog childId={childId} categories={categories} onCreated={refresh} />
                <Button
                  variant={editMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEditMode((v) => !v);
                    setSuggestion(null);
                    toast.info(editMode ? "Đã tắt chế độ chỉnh sửa" : "Chạm thẻ để ghi âm • ✏️ để sửa ảnh/biểu tượng/thư mục • ✕ để xoá");
                  }}
                  aria-label={editMode ? "Xong" : "Xoá thẻ"}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />{editMode ? "Xong" : "Sửa / Ghi âm"}
                </Button>
                <Link
                  to="/coach/$childId"
                  params={{ childId }}
                  search={{ w: utterance.map((c) => c.label).join("|") || undefined }}
                >
                  <Button variant="secondary" size="sm"><Mic className="h-4 w-4 mr-1.5" />Tập nói cùng AI</Button>
                </Link>
                <Link to="/dashboard/$childId" params={{ childId }}>
                  <Button variant="outline" size="sm"><BarChart3 className="h-4 w-4 mr-1.5" />Báo cáo</Button>
                </Link>
              </>
            )}
            <ModeSwitch
              caregiver={caregiver}
              onChange={(v) => { setCaregiver(v); if (!v) setEditMode(false); }}
            />
          </div>
        </div>
      </header>

      <SosButton />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-4 space-y-3">
        <UtteranceBar
          items={utterance}
          onSpeak={handleSpeak}
          onClear={() => { setUtterance([]); setSuggestion(null); }}
          onRemoveLast={() => setUtterance((u) => u.slice(0, -1))}
        />

        {/* Context chips — AI surfaces cards by habit + time + place */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {({ morning: "Buổi sáng", noon: "Buổi trưa", evening: "Buổi chiều", night: "Buổi tối" } as const)[timeBucket(new Date().getHours())]}
          </span>
          <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium " + (place.status === "auto" ? "bg-primary/10 text-primary" : "bg-secondary")}>
            <MapPin className="h-3.5 w-3.5" />
            {place.kind ? `${placeKindIcon(place.kind)} ` : ""}
            {place.status === "locating"
              ? "Đang tự nhận diện vị trí..."
              : place.status === "auto"
                ? `${place.label} · tự nhận diện${place.distance != null ? ` (~${place.distance}m)` : ""}`
                : place.status === "manual"
                  ? `${place.label} (đã ghim)`
                  : place.status === "away"
                    ? "Đang ở nơi khác"
                    : place.status === "denied"
                      ? "Chưa bật định vị"
                      : "Chưa có địa điểm"}
          </span>

          <button
            type="button"
            onClick={() => setPlacesOpen(true)}
            className="rounded-full border border-dashed px-2.5 py-1 font-medium hover:bg-muted"
          >
            + Quản lý địa điểm
          </button>
          <span className="text-muted-foreground">AI gợi ý theo thói quen · thời gian · vị trí</span>
        </div>



        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tìm từ nhanh (vd: sữa, ăn, vui...)"
            className="pl-9 h-11 rounded-xl bg-card text-base"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category tabs (hidden during search) */}
        {!search && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all ${
                  activeCat === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <span className="mr-1.5">{c.icon}</span>{c.name}
              </button>
            ))}
          </div>
        )}

        {/* AI Scaffolding panel — progressive sentence + tappable candidates */}
        {suggestion && (
          <ScaffoldPanel
            level={child.current_level}
            progress={{
              current: recentUtts.filter((u) => u.level === child.current_level).length,
              target: LEVEL_PROMO_TARGET,
            }}
            text={suggestion.text}
            rationale={suggestion.rationale}
            candidates={suggestion.candidates}
            ignoredCount={ignoredCount}
            failThreshold={FAIL_THRESHOLD}
            timeBucket={timeBucket(new Date().getHours())}
            onPickCandidate={handlePickCandidate}
            onDismiss={() => setSuggestion(null)}
            onFeedback={async (kind) => {
              if (!suggestion) return;
              const hour = new Date().getHours();
              // Log every candidate as a suggestion outcome so AI can learn ranking
              await supabase.from("interactions").insert(
                suggestion.candidates.map((c) => ({
                  child_id: childId,
                  card_id: c.id,
                  label: c.label,
                  part_of_speech: c.part_of_speech,
                  hour_of_day: hour,
                  was_suggested: true,
                  suggestion_accepted: kind === "success",
                  position_in_utterance: utterance.length,
                })),
              );
              if (kind === "success") {
                // Boost local bigram from last utterance word → top candidate,
                // so next scoring prefers this ordering.
                const last = utterance[utterance.length - 1];
                const top = suggestion.candidates[0];
                if (last && top) {
                  setBigrams((prev) => {
                    const next = { ...prev };
                    const row = { ...(next[last.label] ?? {}) };
                    row[top.label] = (row[top.label] ?? 0) + 3;
                    next[last.label] = row;
                    return next;
                  });
                }
                setIgnoredCount(0);
                toast.success("Cảm ơn — AI sẽ ưu tiên gợi ý tương tự.");
              } else {
                const next = ignoredCount + 1;
                setIgnoredCount(next);
                if (next >= FAIL_THRESHOLD) {
                  setScaffoldingPaused(true);
                  toast.info("AI tạm ngừng gợi ý để bé chủ động hơn.");
                  setTimeout(() => { setScaffoldingPaused(false); setIgnoredCount(0); }, 60_000);
                } else {
                  toast.info("Đã ghi nhận — AI sẽ giảm ưu tiên gợi ý này.");
                }
              }
              setSuggestion(null);
            }}
          />
        )}

        {/* Grid — suggested cards are highlighted (ghost) and float to the top */}
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-3">
            {visibleCards.map((card) => {
              const isSuggested = suggestion?.candidates.some((c) => c.id === card.id);
              const isTapped = suggestion?.tappedId === card.id;
              let highlight: "suggested" | "dim" | "normal";
              if (suggestion) {
                highlight = isSuggested ? "suggested" : isTapped ? "normal" : "dim";
              } else {
                highlight = ambientHighlights.get(card.id) ?? "normal";
              }
              return (
                <AACCard
                  key={card.id}
                  card={card}
                  onTap={handleTap}
                  highlight={highlight}
                  signedImageUrl={card.image_url ? signedUrls[card.image_url] : undefined}
                  editMode={editMode}
                  onDelete={handleDeleteCard}
                  onRecord={(c) => setRecorderCard(c)}
                  onEdit={(c) => setEditCard(c)}
                />

              );
            })}
          </div>

          {visibleCards.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Danh mục này chưa có thẻ. Nhấn "Thêm thẻ" ở trên.
            </div>
          )}
        </div>
      </main>
      <VoiceRecorderDialog
        card={recorderCard}
        open={!!recorderCard}
        onOpenChange={(v) => { if (!v) setRecorderCard(null); }}
        onSaved={() => { setSignedAudioUrls({}); refresh(); }}
      />
      <PlacesDialog open={placesOpen} onOpenChange={setPlacesOpen} onChanged={() => place.refresh()} />

      <EditCardDialog
        card={editCard}
        categories={categories}
        open={!!editCard}
        onOpenChange={(v) => { if (!v) setEditCard(null); }}
        signedImageUrl={editCard?.image_url ? signedUrls[editCard.image_url] : undefined}
        onSaved={() => { setSignedUrls({}); refresh(); }}
      />
    </div>
  );
}

