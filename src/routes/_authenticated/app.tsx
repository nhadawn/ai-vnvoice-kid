import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Child } from "@/lib/aac-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Sparkles, LogOut, BarChart3, Grid3x3, Trash2 } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Hồ sơ trẻ — AI VNVoice Kid" }] }),
  component: ChildrenList,
});

const UNDO_SECONDS = 8;

function ChildrenList() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [voice, setVoice] = useState<"female" | "male">("female");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const nav = useNavigate();


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("children").select("*").order("created_at");
    if (error) toast.error(error.message);
    setChildren((data as Child[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("children").insert({
      parent_id: u.user.id,
      name,
      birth_year: year ? Number(year) : null,
      voice_preference: voice,
    });
    if (error) return toast.error(error.message);
    toast.success(`Đã tạo hồ sơ cho ${name}`);
    setName(""); setYear(""); setOpen(false);
    load();
  };

  // Hard delete, only run after the undo window expires.
  const performDelete = async (child: Child) => {
    for (const bucket of ["card-images", "card-audio"]) {
      const { data: files } = await supabase.storage.from(bucket).list(child.id);
      if (files?.length) {
        await supabase.storage.from(bucket).remove(files.map((f) => `${child.id}/${f.name}`));
      }
    }
    const { error } = await supabase.from("children").delete().eq("id", child.id);
    timers.current.delete(child.id);
    if (error) {
      setPending((p) => { const n = new Set(p); n.delete(child.id); return n; });
      return toast.error(error.message);
    }
    toast.success(`Đã xoá hồ sơ của ${child.name}`);
    load();
  };

  // Hide the profile immediately, then delete for real after UNDO_SECONDS
  // unless the parent taps "Hoàn tác".
  const scheduleDelete = (child: Child) => {
    setPending((p) => new Set(p).add(child.id));
    const timer = setTimeout(() => performDelete(child), UNDO_SECONDS * 1000);
    timers.current.set(child.id, timer);
    toast(`Đang xoá hồ sơ của ${child.name}...`, {
      description: `Bạn có ${UNDO_SECONDS} giây để hoàn tác.`,
      duration: UNDO_SECONDS * 1000,
      action: {
        label: "Hoàn tác",
        onClick: () => {
          const t = timers.current.get(child.id);
          if (t) clearTimeout(t);
          timers.current.delete(child.id);
          setPending((p) => { const n = new Set(p); n.delete(child.id); return n; });
          toast.success(`Đã giữ lại hồ sơ của ${child.name}`);
        },
      },
    });
  };


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };


  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold">AI VNVoice Kid</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" />Đăng xuất</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Hồ sơ trẻ</h1>
            <p className="text-muted-foreground mt-1">Chọn hồ sơ để mở bảng giao tiếp, hoặc thêm trẻ mới.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Thêm trẻ</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Thêm hồ sơ trẻ</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tên gọi</Label>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Bin" />
                </div>
                <div className="space-y-2">
                  <Label>Năm sinh (tùy chọn)</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2020" />
                </div>
                <div className="space-y-2">
                  <Label>Giọng đọc</Label>
                  <RadioGroup value={voice} onValueChange={(v) => setVoice(v as "female" | "male")}>
                    <div className="flex items-center gap-2"><RadioGroupItem id="f" value="female" /><Label htmlFor="f">Nữ (mẹ)</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem id="m" value="male" /><Label htmlFor="m">Nam (bố)</Label></div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full">Tạo hồ sơ</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : children.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed p-12 text-center">
            <p className="text-muted-foreground mb-4">Chưa có hồ sơ trẻ nào. Hãy thêm trẻ đầu tiên.</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Thêm trẻ</Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {children.map((c) => (
              <div key={c.id} className="rounded-3xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-3xl">
                  👶
                </div>
                <h3 className="mt-4 text-xl font-bold">{c.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {c.birth_year ? `${new Date().getFullYear() - c.birth_year} tuổi · ` : ""}
                  Mức {c.current_level.replace("level_", "")} · Giọng {c.voice_preference === "female" ? "nữ" : "nam"}
                </p>
                <div className="mt-5 flex gap-2">
                  <Link to="/board/$childId" params={{ childId: c.id }} className="flex-1">
                    <Button className="w-full" size="sm"><Grid3x3 className="h-4 w-4 mr-1.5" />Bảng AAC</Button>
                  </Link>
                  <Link to="/dashboard/$childId" params={{ childId: c.id }}>
                    <Button variant="outline" size="sm"><BarChart3 className="h-4 w-4" /></Button>
                  </Link>
                  <DeleteChildDialog child={c} onConfirm={() => scheduleDelete(c)} />

                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
