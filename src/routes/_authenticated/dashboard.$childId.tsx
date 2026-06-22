import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Child, PartOfSpeech } from "@/lib/aac-types";
import { LEVEL_DESCRIPTIONS } from "@/lib/aac-types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Brain, Calendar, AlertCircle, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard/$childId")({
  head: () => ({ meta: [{ title: "Báo cáo phát triển — AI-AAC" }] }),
  component: Dashboard,
});

interface Interaction {
  id: number;
  label: string;
  part_of_speech: PartOfSpeech | null;
  hour_of_day: number;
  was_suggested: boolean;
  created_at: string;
}
interface Utterance { id: string; text: string; word_count: number; level: string; created_at: string; }

const POS_COLORS: Record<string, string> = {
  noun: "oklch(0.82 0.13 75)",
  verb: "oklch(0.78 0.16 145)",
  adjective: "oklch(0.8 0.13 60)",
  phrase: "oklch(0.78 0.11 290)",
  pronoun: "oklch(0.8 0.12 230)",
};
const POS_LABELS: Record<string, string> = {
  noun: "Danh từ", verb: "Động từ", adjective: "Tính từ", phrase: "Cụm chức năng", pronoun: "Đại từ",
};

function Dashboard() {
  const { childId } = Route.useParams();
  const [child, setChild] = useState<Child | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [utterances, setUtterances] = useState<Utterance[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: i }, { data: u }] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        supabase.from("interactions").select("*").eq("child_id", childId).order("created_at", { ascending: false }).limit(500),
        supabase.from("utterances").select("*").eq("child_id", childId).order("created_at"),
      ]);
      if (c) setChild(c as Child);
      if (i) setInteractions(i as Interaction[]);
      if (u) setUtterances(u as Utterance[]);
    })();
  }, [childId]);

  // MLU over time (per day, last 14 days)
  const mluSeries = useMemo(() => {
    const byDay = new Map<string, number[]>();
    utterances.forEach((u) => {
      const day = u.created_at.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(u.word_count);
    });
    return [...byDay.entries()]
      .map(([day, arr]) => ({ day: day.slice(5), mlu: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) }))
      .slice(-14);
  }, [utterances]);

  // Part-of-speech distribution
  const posData = useMemo(() => {
    const counts: Record<string, number> = {};
    interactions.forEach((i) => {
      if (!i.part_of_speech) return;
      counts[i.part_of_speech] = (counts[i.part_of_speech] ?? 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({ name: POS_LABELS[k] ?? k, value: v, key: k }));
  }, [interactions]);

  // Hour-of-day activity
  const hourly = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, taps: 0 }));
    interactions.forEach((i) => arr[i.hour_of_day].taps++);
    return arr;
  }, [interactions]);

  // Top labels (interest map)
  const topLabels = useMemo(() => {
    const m = new Map<string, number>();
    interactions.forEach((i) => m.set(i.label, (m.get(i.label) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [interactions]);

  // Pattern detection: stuck-on-nouns
  const insights = useMemo(() => {
    const out: string[] = [];
    const total = interactions.length;
    if (total < 10) return ["Cần thêm dữ liệu — hãy để bé sử dụng thêm để nhận phân tích."];
    const nounPct = (posData.find((p) => p.key === "noun")?.value ?? 0) / total;
    const verbPct = (posData.find((p) => p.key === "verb")?.value ?? 0) / total;
    if (nounPct > 0.7 && verbPct < 0.15) {
      out.push("⚠️ Bé chủ yếu dùng danh từ. Hãy khuyến khích thêm động từ — gợi ý: chơi trò 'làm gì' với bé.");
    }
    const avgMLU = utterances.length > 0
      ? utterances.reduce((a, u) => a + u.word_count, 0) / utterances.length
      : 0;
    if (avgMLU > 0 && avgMLU < 1.5) {
      out.push("📈 MLU trung bình còn thấp. AI sẽ tiếp tục gợi ý ghép từ trong các phiên tới.");
    } else if (avgMLU >= 2) {
      out.push(`🎉 MLU trung bình đạt ${avgMLU.toFixed(2)} — tiến triển tốt!`);
    }
    if (topLabels.length) {
      const top = topLabels[0];
      out.push(`💡 Bé đang dùng thẻ "${top[0]}" rất nhiều (${top[1]} lần) — hãy cho bé chạm vào "${top[0]}" thật và lặp lại từ này.`);
    }
    const suggestedTaps = interactions.filter((i) => i.was_suggested).length;
    if (total > 20) {
      const accept = (suggestedTaps / total * 100).toFixed(0);
      out.push(`🤖 Tỉ lệ chấp nhận gợi ý AI: ${accept}%.`);
    }
    return out;
  }, [interactions, utterances, posData, topLabels]);

  if (!child) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;

  const avgMLU = utterances.length > 0
    ? (utterances.reduce((a, u) => a + u.word_count, 0) / utterances.length).toFixed(2)
    : "—";

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/board/$childId" params={{ childId }}><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <div>
              <h1 className="font-bold leading-tight">Báo cáo — {child.name}</h1>
              <p className="text-xs text-muted-foreground">{LEVEL_DESCRIPTIONS[child.current_level]}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        {/* KPI cards */}
        <div className="grid gap-3 md:grid-cols-4">
          <KPI icon={<TrendingUp />} label="MLU trung bình" value={avgMLU} hint="Chiều dài câu trung bình" />
          <KPI icon={<Brain />} label="Tổng lần bấm" value={interactions.length.toString()} />
          <KPI icon={<Calendar />} label="Câu đã tạo" value={utterances.length.toString()} />
          <KPI icon={<Lightbulb />} label="Mức hiện tại" value={child.current_level.replace("level_", "")} hint={LEVEL_DESCRIPTIONS[child.current_level]} />
        </div>

        {/* Insights */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-bold flex items-center gap-2"><AlertCircle className="h-5 w-5 text-primary" />Phát hiện & gợi ý</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {insights.map((s, i) => <li key={i} className="rounded-xl bg-muted px-3 py-2">{s}</li>)}
          </ul>
        </section>

        {/* Charts grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="MLU theo ngày (14 ngày gần nhất)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mluSeries}>
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="mlu" stroke="oklch(0.72 0.16 35)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Phân bố loại từ">
            {posData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={posData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {posData.map((p) => <Cell key={p.key} fill={POS_COLORS[p.key]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Hoạt động theo giờ trong ngày">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourly}>
                <XAxis dataKey="hour" fontSize={10} interval={2} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="taps" fill="oklch(0.78 0.13 195)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top thẻ được dùng">
            {topLabels.length === 0 ? <Empty /> : (
              <ul className="space-y-2 mt-2">
                {topLabels.map(([label, count]) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="flex-1 font-medium">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(count / topLabels[0][1]) * 100}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm text-muted-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>
      </main>
    </div>
  );
}

function KPI({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
function Empty() { return <div className="text-sm text-muted-foreground py-8 text-center">Chưa có đủ dữ liệu</div>; }
