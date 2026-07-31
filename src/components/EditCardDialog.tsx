import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Camera, Upload, ClipboardPaste, Trash2, FolderInput } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IconPicker } from "@/components/IconPicker";
import { suggestCategory } from "@/lib/icon-suggest";
import { fastRemoveBackground, downscaleImage, extractImage } from "@/lib/image-bg";
import type { Card, Category, PartOfSpeech } from "@/lib/aac-types";

interface Props {
  card: Card | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  signedImageUrl?: string;
}

const CHECKER = "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50%/16px 16px";

export function EditCardDialog({ card, categories, open, onOpenChange, onSaved, signedImageUrl }: Props) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🔲");
  const [categoryId, setCategoryId] = useState<string>("");
  const [pos, setPos] = useState<PartOfSpeech>("noun");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [autoCut, setAutoCut] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !card) return;
    setLabel(card.label);
    setEmoji(card.emoji ?? "🔲");
    setCategoryId(card.category_id ?? "");
    setPos(card.part_of_speech);
    setFile(null); setPreview(null); setRemoveImage(false); setProgress(0);
  }, [open, card]);

  const folderHint = useMemo(() => suggestCategory(label, categories), [label, categories]);
  const hintIsDifferent = folderHint && folderHint.categoryId !== categoryId;

  const handleFile = async (f: File) => {
    setRemoveImage(false);
    setPreview(URL.createObjectURL(f));
    const small = await downscaleImage(f);
    setFile(new File([small], "card.png", { type: "image/png" }));
    if (!autoCut) return;
    setProcessing(true); setProgress(0);
    const { blob, removed } = await fastRemoveBackground(f, setProgress);
    setFile(new File([blob], "card.png", { type: "image/png" }));
    setPreview(URL.createObjectURL(blob));
    setProcessing(false);
    if (removed) toast.success("Đã tách nền");
  };

  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const img = extractImage(e.clipboardData);
      if (img) { e.preventDefault(); void handleFile(img); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoCut]);

  const save = async () => {
    if (!card || !label.trim()) return;
    setSaving(true);
    try {
      let imagePath: string | null | undefined;
      if (removeImage && card.image_url) {
        await supabase.storage.from("card-images").remove([card.image_url]);
        imagePath = null;
      } else if (file) {
        const path = `${card.child_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const { error: upErr } = await supabase.storage.from("card-images").upload(path, file, { contentType: "image/png" });
        if (upErr) throw upErr;
        if (card.image_url) await supabase.storage.from("card-images").remove([card.image_url]);
        imagePath = path;
      }
      const { error } = await supabase.from("cards").update({
        label: label.trim(),
        emoji,
        category_id: categoryId || null,
        part_of_speech: pos,
        ...(imagePath !== undefined ? { image_url: imagePath } : {}),
      }).eq("id", card.id);
      if (error) throw error;
      toast.success("Đã cập nhật thẻ");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error("Lỗi khi lưu: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const shownImage = removeImage ? null : (preview ?? signedImageUrl ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />Chỉnh sửa thẻ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <div className="flex items-center justify-between">
              <Label>Ảnh thẻ</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Tách nền AI<Switch checked={autoCut} onCheckedChange={setAutoCut} />
              </label>
            </div>
            <div className="mt-2">
              {shownImage ? (
                <div className="relative">
                  <img src={shownImage} alt="" className="w-full max-h-40 object-contain rounded-xl border" style={{ background: CHECKER }} />
                  {processing && (
                    <div className="absolute inset-0 rounded-xl bg-background/70 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-medium">Đang tách nền... {progress > 0 ? `${progress}%` : ""}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Đổi ảnh</Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive"
                      onClick={() => { setRemoveImage(true); setFile(null); setPreview(null); }}>
                      <Trash2 className="h-4 w-4 mr-1.5" />Dùng biểu tượng
                    </Button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const img = extractImage(e.dataTransfer); if (img) void handleFile(img); }}
                  className="w-full rounded-xl border-2 border-dashed py-6 flex flex-col items-center text-muted-foreground hover:bg-muted transition">
                  <div className="flex items-center gap-3"><Camera className="h-5 w-5" /><Upload className="h-5 w-5" /><ClipboardPaste className="h-5 w-5" /></div>
                  <span className="text-xs mt-2 font-medium">Chụp · Kéo thả · Dán (Ctrl+V)</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
            </div>
          </div>

          <div>
            <Label>Tên thẻ</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ví dụ: Gấu bông" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Biểu tượng</Label>
              <IconPicker value={emoji} onChange={setEmoji} label={label} />
            </div>
            <div className="col-span-2">
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
          </div>

          <div>
            <Label>Thư mục (danh mục)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Chọn thư mục" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {hintIsDifferent && (
              <button type="button" onClick={() => setCategoryId(folderHint.categoryId)}
                className="mt-2 w-full text-left text-xs rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 hover:bg-primary/20 transition flex items-center gap-2">
                <FolderInput className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>AI đề xuất chuyển sang <b>{folderHint.name}</b> ({Math.round(folderHint.confidence * 100)}%)</span>
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={save} disabled={saving || !label.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
