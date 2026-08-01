import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Crosshair, Trash2, Pin, PinOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PLACE_KINDS, deletePlace, getActivePlaceId, placeKindIcon, readPlaces, savePlace,
  setActivePlaceId, type KnownPlace, type PlaceKind,
} from "@/lib/context-memory";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** called whenever places or the active pin change */
  onChanged?: () => void;
}

export function PlacesDialog({ open, onOpenChange, onChanged }: Props) {
  const [places, setPlaces] = useState<KnownPlace[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<PlaceKind>("home");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const reload = () => {
    setPlaces(readPlaces());
    setActive(getActivePlaceId());
    onChanged?.();
  };

  useEffect(() => { if (open) reload(); }, [open]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Thiết bị không hỗ trợ định vị"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
        toast.success("Đã lấy vị trí hiện tại");
      },
      () => { setLocating(false); toast.error("Không lấy được vị trí. Hãy cho phép truy cập vị trí."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const add = () => {
    const name = label.trim();
    if (!name) { toast.error("Nhập tên địa điểm"); return; }
    savePlace({ label: name.slice(0, 60), kind, address: address.trim().slice(0, 160) || undefined, lat: coords?.lat, lon: coords?.lon, radius: 150 });
    setLabel(""); setAddress(""); setCoords(null);
    reload();
    toast.success(`Đã lưu "${name}"`);
  };

  const togglePin = (id: string) => {
    setActivePlaceId(active === id ? null : id);
    reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />Địa điểm của bé
          </DialogTitle>
          <DialogDescription>
            Lưu nhà, trường và những nơi bé thường đến. AI sẽ ưu tiên gợi ý từ vựng phù hợp với từng nơi.
            Dữ liệu vị trí chỉ lưu trên thiết bị này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 space-y-3">
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <Plus className="h-4 w-4" />Thêm địa điểm
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Tên</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nhà của bé" maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Loại nơi</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as PlaceKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACE_KINDS.map((k) => (
                      <SelectItem key={k.kind} value={k.kind}>{k.icon} {k.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Địa chỉ (không bắt buộc)</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Lê Lợi, Quận 1..." maxLength={160} />
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={locating}>
                {locating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Crosshair className="h-4 w-4 mr-1.5" />}
                Dùng vị trí hiện tại
              </Button>
              {coords && (
                <span className="text-xs text-primary font-medium">
                  ✓ {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
                </span>
              )}
            </div>
            <Button onClick={add} className="w-full">Lưu địa điểm</Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Đã lưu ({places.length})</div>
            {places.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có địa điểm nào.</p>
            )}
            {places.map((p) => (
              <div key={p.id} className={cn("flex items-center gap-2 rounded-lg border p-2.5", active === p.id && "border-primary bg-primary/5")}>
                <span className="text-xl">{placeKindIcon(p.kind)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {PLACE_KINDS.find((k) => k.kind === p.kind)?.label}
                    {p.address ? ` · ${p.address}` : ""}
                    {p.lat != null ? " · 📍 có GPS" : ""}
                  </div>
                </div>
                <Button variant={active === p.id ? "default" : "ghost"} size="sm" onClick={() => togglePin(p.id)}
                  title={active === p.id ? "Bỏ ghim" : "Ghim: bé đang ở đây"}>
                  {active === p.id ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive"
                  onClick={() => { deletePlace(p.id); reload(); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {active && (
              <p className="text-xs text-muted-foreground">
                Đang ghim một địa điểm — AI dùng nơi này thay cho định vị GPS.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
