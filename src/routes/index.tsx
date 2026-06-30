import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Camera, MessageCircle, BarChart3, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI VNVoice Kid — Giàn giáo ngôn ngữ cho trẻ" },
      { name: "description", content: "Hệ thống giao tiếp thay thế tích hợp AI: gợi ý ngữ pháp tăng dần, số hóa vật thật, dashboard cho phụ huynh." },
    ],
  }),
  component: Landing,
});

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">AI VNVoice Kid</span>
          </div>
          <Link to="/auth"><Button>Bắt đầu</Button></Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-accent/30 px-4 py-1.5 text-xs font-semibold text-accent-foreground">
            <Heart className="h-3.5 w-3.5" /> Hỗ trợ trẻ khiếm khuyết ngôn ngữ
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
            Giao tiếp hôm nay,<br />
            <span className="text-primary">phát triển ngôn ngữ ngày mai.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Hệ thống AAC thích nghi tích hợp trí tuệ nhân tạo — không chỉ là công cụ thay thế,
            mà còn là "giàn giáo" giúp trẻ mở rộng vốn từ và cấu trúc câu qua thuật toán gợi ý tăng dần.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="text-base">Tạo tài khoản</Button></Link>
            <Link to="/auth"><Button variant="outline" size="lg" className="text-base">Đăng nhập</Button></Link>
          </div>
        </section>

        <section className="mt-24 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Feature icon={Sparkles} title="Smart Grid"
            desc="N-gram + Time-series: tự động làm nổi bật thẻ phù hợp ngữ cảnh mà không di chuyển vị trí (bảo tồn trí nhớ cơ bắp)." />
          <Feature icon={MessageCircle} title="Scaffolding AI"
            desc="Gợi ý ngôn ngữ tăng dần 4 mức: từ đơn → động+danh → tính+danh → cụm chức năng." />
          <Feature icon={Camera} title="Số hóa vật thật"
            desc="Chụp ảnh vật thể bằng camera, AI tự tách nền — giảm cách biệt giữa biểu tượng và vật thật." />
          <Feature icon={BarChart3} title="Dashboard cho cha mẹ"
            desc="Theo dõi MLU (chiều dài câu nói trung bình), phát hiện mẫu phát triển, gợi ý tương tác ngoại tuyến." />
        </section>

        <section className="mt-24 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/20 p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold">4 mức giàn giáo ngôn ngữ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { n: 1, t: "Từ đơn", e: "Sữa" },
              { n: 2, t: "Động từ + Danh từ", e: "Uống sữa" },
              { n: 3, t: "Danh từ + Tính từ", e: "Sữa nóng" },
              { n: 4, t: "Cụm chức năng", e: "Con muốn uống sữa" },
            ].map((m) => (
              <div key={m.n} className="rounded-2xl bg-card p-5 shadow-sm">
                <div className="text-xs font-semibold text-primary">MỨC {m.n}</div>
                <div className="mt-1 font-semibold">{m.t}</div>
                <div className="mt-2 text-2xl font-bold text-foreground">"{m.e}"</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t pt-8 text-center text-sm text-muted-foreground">
          AI là trợ lý — không thay thế trị liệu viên và sự tương tác giữa người với người.
        </footer>
      </main>
    </div>
  );
}
