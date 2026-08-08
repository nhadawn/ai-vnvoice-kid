import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SpeechCoach, type CoachWord } from "@/components/SpeechCoach";
import { suggestIcons } from "@/lib/icon-suggest";

const searchSchema = z.object({ w: z.string().optional() });

export const Route = createFileRoute("/_authenticated/coach/$childId")({
  validateSearch: (s) => searchSchema.parse(s),
  component: CoachPage,
  head: () => ({
    meta: [
      { title: "Tập nói cùng AI — AI VNVoice Kid" },
      {
        name: "description",
        content:
          "Trợ lý AI phát âm mẫu, lắng nghe và khen ngợi bé sau mỗi lượt luyện nói, kèm bảng theo dõi âm tiết cho ba mẹ.",
      },
      { property: "og:title", content: "Tập nói cùng AI — AI VNVoice Kid" },
      {
        property: "og:description",
        content: "Luyện nói thích nghi cho trẻ chậm nói: phát âm mẫu, lắng nghe, khen ngợi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DEFAULT_WORDS: CoachWord[] = [
  { label: "Con muốn", icon: "🙋" },
  { label: "Uống", icon: "🥤" },
  { label: "Sữa", icon: "🥛" },
];

function CoachPage() {
  const { childId } = Route.useParams();
  const { w } = Route.useSearch();

  const words: CoachWord[] = w
    ? w
        .split("|")
        .filter(Boolean)
        .map((label: string) => ({ label, icon: guessIcon(label) }))
    : DEFAULT_WORDS;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/board/$childId" params={{ childId }}>
            <Button variant="ghost" size="icon" aria-label="Về bảng giao tiếp">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold">Tập nói cùng AI</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <SpeechCoach words={words} />
      </main>
    </div>
  );
}

function guessIcon(label: string): string {
  return suggestIcons(label, 1)[0] ?? "🗣️";
}
