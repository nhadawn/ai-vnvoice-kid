import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Camera, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Category, PartOfSpeech } from "@/lib/aac-types";

interface Props {
  childId: string;
  categories: Category[];
  onCreated: () => void;
}

export function AddCardDialog({ childId, categories, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🆕");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [pos, setPos] = useState<PartOfSpeech>("noun");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setLabel(""); setEmoji("🆕"); setPos("noun");
    setFile(null); setPreview(null);
    setCategoryId(categories[0]?.id ?? "");
  };

  const handleFile = async (f: File) => {
    setProcessing(true);
    try {
      // Dynamic import: bg-removal is large and only loaded on demand.
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(f);
      const processedFile = new File([blob], f.name.replace(/\.\w+$/, ".png"), { type: "image/png" });
      setFile(processedFile);
      setPreview(URL.createObjectURL(blob));
      toast.success("Đã tách nền tự động");
    } catch (err) {
      console.error(err);
      toast.error("Không tách được nền, dùng ảnh gốc");
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    let imagePath: string | null = null;
    if (file) {
      const path = `${childId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const { error: upErr } = await supabase.storage.from("card-images").upload(path, file, {
        contentType: "image/png",
      });
      if (upErr) {
        toast.error("Tải ảnh thất bại: " + upErr.message);
        setSaving(false);
        return;
      }
      imagePath = path;
    }
    const { error } = await supabase.from("cards").insert({
      child_id: childId,
      category_id: categoryId || null,
      label: label.trim(),
      emoji,
      image_url: imagePath,
      part_of_speech: pos,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Đã thêm thẻ mới");
    reset();
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1.5" />Thêm thẻ</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Thêm thẻ mới</DialogTitle></DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Ảnh thật (tùy chọn)</Label>
            <div className="mt-2">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="" className="w-full max-h-48 object-contain rounded-xl border bg-checkered" style={{ background: "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50%/16px 16px" }} />
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { setFile(null); setPreview(null); }}>Chọn lại</Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                  <span className="text-sm mt-2">{processing ? "Đang tách nền..." : "Chụp / chọn ảnh"}</span>
                  <span className="text-xs mt-1">AI tự tách nền cho bạn</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label>Emoji</Label>
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="text-2xl text-center" />
            </div>
            <div className="col-span-2">
              <Label>Tên thẻ</Label>
              <Input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ví dụ: Gấu bông" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Loại từ</Label>
              <Select value={pos} onValueChange={(v) => setPos(v as PartOfSpeech)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="noun">Danh từ</SelectItem>
                  <SelectItem value="verb">Động từ</SelectItem>
                  <SelectItem value="adjective">Tính từ</SelectItem>
                  <SelectItem value="phrase">Cụm chức năng</SelectItem>
                  <SelectItem value="pronoun">Đại từ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Danh mục</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving || processing}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Lưu thẻ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
