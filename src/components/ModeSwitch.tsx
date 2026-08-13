import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const HOLD_MS = 3000;
const PIN_KEY = "vnvoice.caregiver.pin";

export function getCaregiverPin(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(PIN_KEY);
  return v && /^\d{4}$/.test(v) ? v : null;
}

export function setCaregiverPin(pin: string | null) {
  if (typeof window === "undefined") return;
  if (pin) window.localStorage.setItem(PIN_KEY, pin);
  else window.localStorage.removeItem(PIN_KEY);
}

/**
 * Small, low-salience corner control that switches between Child Mode and
 * Caregiver Mode. Never a single tap: requires a 3s hold, plus a 4-digit PIN
 * when the parent has set one.
 */
export function ModeSwitch({
  caregiver,
  onChange,
}: {
  caregiver: boolean;
  onChange: (v: boolean) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    start.current = null;
    setProgress(0);
  };
  useEffect(() => () => stop(), []);

  const unlock = () => {
    stop();
    if (getCaregiverPin()) { setPin(""); setPinOpen(true); return; }
    onChange(true);
    toast.success("Đã vào Chế độ chăm sóc");
  };

  const begin = () => {
    if (caregiver) return;
    start.current = performance.now();
    const tick = () => {
      if (start.current == null) return;
      const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) return unlock();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  if (caregiver) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Đặt mã PIN" onClick={() => { setNewPin(""); setSetupOpen(true); }}>
          <KeyRound className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { onChange(false); toast.info("Đã về Chế độ trẻ"); }}
        >
          <ShieldCheck className="h-4 w-4 mr-1.5" />Chế độ chăm sóc
        </Button>

        <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>Mã PIN chế độ chăm sóc</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label>Nhập 4 số (để trống để tắt PIN)</Label>
              <Input
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
              />
              <Button
                className="w-full"
                onClick={() => {
                  if (newPin === "") { setCaregiverPin(null); toast.success("Đã tắt PIN"); setSetupOpen(false); return; }
                  if (newPin.length !== 4) return toast.error("PIN phải có 4 số");
                  setCaregiverPin(newPin);
                  toast.success("Đã lưu PIN");
                  setSetupOpen(false);
                }}
              >Lưu</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const deg = Math.round(progress * 360);
  return (
    <>
      <button
        type="button"
        aria-label="Giữ 3 giây để vào Chế độ chăm sóc"
        title="Giữ 3 giây để vào Chế độ chăm sóc"
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        className="relative h-8 w-8 rounded-full opacity-50 hover:opacity-90 select-none touch-none"
        style={{ background: `conic-gradient(hsl(var(--primary)) ${deg}deg, transparent ${deg}deg)` }}
      >
        <span className="absolute inset-[3px] rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </button>

      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Nhập mã PIN phụ huynh</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em]"
            />
            <Button
              className="w-full"
              onClick={() => {
                if (pin === getCaregiverPin()) {
                  setPinOpen(false);
                  onChange(true);
                  toast.success("Đã vào Chế độ chăm sóc");
                } else {
                  toast.error("PIN không đúng");
                  setPin("");
                }
              }}
            >Xác nhận</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
