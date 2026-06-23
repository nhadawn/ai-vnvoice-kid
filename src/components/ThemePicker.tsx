import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";
import { THEMES, applyTheme, getStoredTheme } from "@/lib/theme";

export function ThemePicker() {
  const [current, setCurrent] = useState<string>("coral");

  useEffect(() => {
    const id = getStoredTheme();
    setCurrent(id);
    applyTheme(id);
  }, []);

  const pick = (id: string) => {
    setCurrent(id);
    applyTheme(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Đổi màu giao diện">
          <Palette className="h-4 w-4 mr-1.5" />Giao diện
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Chọn màu giao diện</div>
        <div className="grid grid-cols-1 gap-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted text-left transition-colors ${
                current === t.id ? "bg-muted" : ""
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              <div className="flex gap-1">
                {t.swatch.map((c, i) => (
                  <span key={i} className="h-5 w-5 rounded-full border border-black/10" style={{ background: c }} />
                ))}
              </div>
              <span className="flex-1 font-medium">{t.name}</span>
              {current === t.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
