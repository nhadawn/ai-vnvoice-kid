import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Camera, Loader2, Sparkles, ClipboardPaste, Upload, FolderInput } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fastRemoveBackground, downscaleImage, extractImage, preloadBackgroundRemoval } from "@/lib/image-bg";
import { IconPicker } from "@/components/IconPicker";
import { suggestCategory, suggestIcons } from "@/lib/icon-suggest";
import type { Category, PartOfSpeech } from "@/lib/aac-types";

interface Props {
  childId: string;
  categories: Category[];
  onCreated: () => void;
}

const CHECKER = "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50%/16px 16px";

export function AddCardDialog({ childId, categories, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🆕");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [pos, setPos] = useState<PartOfSpeech>("noun");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [autoCut, setAutoCut] = useState(true);
  const [cutDone, setCutDone] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rawRef = useRef<File | null>(null);
  const jobRef = useRef(0);
  const [catTouched, setCatTouched] = useState(false);
  const [iconTouched, setIconTouched] = useState(false);

  // AI: suggest folder + icon from the word the user types
  const folderHint = useMemo(() => suggestCategory(label, categories), [label, categories]);
  useEffect(() => {
    if (!catTouched && folderHint) setCategoryId(folderHint.categoryId);
  }, [folderHint, catTouched]);
  useEffect(() => {
    if (iconTouched) return;
    const [best] = suggestIcons(label, 1);
    if (best) setEmoji(best);
  }, [label, iconTouched]);

  const reset = () => {
    setLabel(""); setEmoji("🆕"); setPos("noun");
    setFile(null); setPreview(null); setCutDone(false); setProgress(0);
    rawRef.current = null;
    setCatTouched(false); setIconTouched(false);
    setCategoryId(categories[0]?.id ?? "");
  };


  const runCut = useCallback(async (raw: File, job: number) => {
    setProcessing(true);
    setProgress(0);
    const { blob, removed, ms } = await fastRemoveBackground(raw, (p) => {
      if (jobRef.current === job) setProgress(p);
    });
    if (jobRef.current !== job) return;
    setFile(new File([blob], "card.png", { type: "image/png" }));
    setPreview(URL.createObjectURL(blob));
    setProcessing(false);
    setCutDone(removed);
    if (removed) toast.success(`Đã tách nền (${(ms / 1000).toFixed(1)}s)`);
    else toast.message("Dùng ảnh gốc (không tách được nền)");
  }, []);

  const handleFile = useCallback(async (f: File) => {
    const job = ++jobRef.current;
    rawRef.current = f;
    setCutDone(false);
    // Instant preview first — user can keep typing while AI works.
    setPreview(URL.createObjectURL(f));
    const small = await downscaleImage(f);
    if (jobRef.current !== job) return;
    setFile(new File([small], "card.png", { type: "image/png" }));
    if (autoCut) void runCut(f, job);
  }, [autoCut, runCut]);

  // Paste anywhere while the dialog is open
  useEffect(() => {
    if (!open) return;
    preloadBackgroundRemoval();
    const onPaste = (e: ClipboardEvent) => {
      const img = extractImage(e.clipboardData);
      if (img) { e.preventDefault(); void handleFile(img); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, handleFile]);

  const toggleAutoCut = (v: boolean) => {
    setAutoCut(v);
    const raw = rawRef.current;
    if (!raw) return;
    const job = ++jobRef.current;
    if (v) void runCut(raw, job);
    else {
      setProcessing(false);
      setCutDone(false);
      void downscaleImage(raw).then((small) => {
        if (jobRef.current !== job) return;
        setFile(new File([small], "card.png", { type: "image/png" }));
        setPreview(URL.createObjectURL(small));
      });
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
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { jobRef.current++; reset(); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onMouseEnter={preloadBackgroundRemoval}><Plus className="h-4 w-4 mr-1.5" />Thêm thẻ</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Thêm thẻ mới</DialogTitle></DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label>Ảnh thật (tùy chọn)</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Tách nền AI
                <Switch checked={autoCut} onCheckedChange={toggleAutoCut} />
              </label>
            </div>
            <div className="mt-2">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  const img = extractImage(e.dataTransfer);
                  if (img) void handleFile(img);
                }}
              >
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="" className="w-full max-h-48 object-contain rounded-xl border" style={{ background: CHECKER }} />
                    {processing && (
                      <div className="absolute inset-0 rounded-xl bg-background/70 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs font-medium">Đang tách nền... {progress > 0 ? `${progress}%` : ""}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Chọn lại</Button>
                      {cutDone && <span className="text-xs text-muted-foreground">✨ Đã tách nền</span>}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center text-muted-foreground transition-colors ${dragOver ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="h-6 w-6" /><Upload className="h-6 w-6" /><ClipboardPaste className="h-6 w-6" />
                    </div>
                    <span className="text-sm mt-2 font-medium">Chụp ảnh · Kéo thả · Dán (Ctrl+V)</span>
                    <span className="text-xs mt-1">AI tự tách nền siêu nhanh</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label>Biểu tượng</Label>
              <IconPicker value={emoji} onChange={(v) => { setEmoji(v); setIconTouched(true); }} label={label} />
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
              <Label>Thư mục</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setCatTouched(true); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {folderHint && folderHint.categoryId !== categoryId && (
            <button
              type="button"
              onClick={() => { setCategoryId(folderHint.categoryId); setCatTouched(true); }}
              className="w-full text-left text-xs rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 hover:bg-primary/20 transition flex items-center gap-2"
            >
              <FolderInput className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>AI đề xuất thư mục <b>{folderHint.name}</b> ({Math.round(folderHint.confidence * 100)}%) — chạm để dùng</span>
            </button>
          )}


          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Lưu thẻ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
