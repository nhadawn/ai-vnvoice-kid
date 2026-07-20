import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Card } from "@/lib/aac-types";

interface Props {
  card: Card | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

export function VoiceRecorderDialog({ card, open, onOpenChange, onSaved }: Props) {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!open || !card) return;
    setBlob(null); setPreviewUrl(null); setExistingUrl(null);
    if (card.audio_url) {
      supabase.storage.from("card-audio").createSignedUrl(card.audio_url, 3600).then(({ data }) => {
        if (data?.signedUrl) setExistingUrl(data.signedUrl);
      });
    }
  }, [open, card]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) {
      toast.error("Không truy cập được micro: " + (e as Error).message);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const save = async () => {
    if (!card || !blob) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const path = `${user.id}/${card.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("card-audio").upload(path, blob, { contentType: blob.type });
      if (upErr) throw upErr;
      if (card.audio_url) {
        await supabase.storage.from("card-audio").remove([card.audio_url]);
      }
      const { error: dbErr } = await supabase.from("cards").update({ audio_url: path }).eq("id", card.id);
      if (dbErr) throw dbErr;
      toast.success(`Đã lưu giọng cho "${card.label}"`);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error("Lỗi khi lưu: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const removeExisting = async () => {
    if (!card?.audio_url) return;
    if (!confirm("Xoá giọng ghi âm hiện tại?")) return;
    await supabase.storage.from("card-audio").remove([card.audio_url]);
    await supabase.from("cards").update({ audio_url: null }).eq("id", card.id);
    toast.success("Đã xoá giọng ghi âm");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ghi âm giọng cho "{card?.label}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Ghi âm giọng của bố/mẹ để thay thế giọng máy. Trẻ sẽ nghe giọng của bạn khi chọn thẻ này.
          </p>
          {existingUrl && !previewUrl && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-medium">Giọng đã ghi:</div>
              <audio controls src={existingUrl} className="w-full" />
              <Button variant="ghost" size="sm" onClick={removeExisting} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1.5" />Xoá giọng này
              </Button>
            </div>
          )}
          <div className="flex justify-center">
            {!recording ? (
              <Button size="lg" onClick={startRecording} className="rounded-full h-20 w-20 p-0">
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <Button size="lg" variant="destructive" onClick={stopRecording} className="rounded-full h-20 w-20 p-0 animate-pulse">
                <Square className="h-8 w-8" />
              </Button>
            )}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {recording ? "Đang ghi âm... Nhấn để dừng" : previewUrl ? "Bản ghi mới" : "Nhấn để bắt đầu"}
          </div>
          {previewUrl && (
            <div className="rounded-lg border p-3 space-y-2">
              <audio controls src={previewUrl} className="w-full" />
              <Button variant="ghost" size="sm" onClick={() => { setBlob(null); setPreviewUrl(null); }}>
                <Play className="h-4 w-4 mr-1.5" />Ghi lại
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={save} disabled={!blob || saving}>
            <Save className="h-4 w-4 mr-1.5" />{saving ? "Đang lưu..." : "Lưu giọng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
