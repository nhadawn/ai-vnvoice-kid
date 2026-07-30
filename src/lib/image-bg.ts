// Fast client-side background removal helpers.
// Strategy: shrink the image first (huge speed win), keep the wasm model warm
// in a module-level cache so the 2nd..nth card is near-instant.

const MAX_SIDE = 640; // plenty for a card thumbnail, ~10x faster than 4000px photos

type RemoveBg = (input: Blob, cfg?: Record<string, unknown>) => Promise<Blob>;
let removeBgPromise: Promise<RemoveBg> | null = null;
let warmed = false;

function loadRemover(): Promise<RemoveBg> {
  if (!removeBgPromise) {
    removeBgPromise = import("@imgly/background-removal").then(
      (m) => m.removeBackground as unknown as RemoveBg,
    );
  }
  return removeBgPromise;
}

/** Start downloading the model in the background (call when dialog opens). */
export function preloadBackgroundRemoval() {
  if (warmed) return;
  warmed = true;
  loadRemover().catch(() => {
    warmed = false;
  });
}

/** Downscale + re-encode to a small PNG/JPEG blob before heavy processing. */
export async function downscaleImage(file: Blob, maxSide = MAX_SIDE): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? (file as Blob)), "image/png"),
  );
}

export interface RemoveBgResult {
  blob: Blob;
  removed: boolean;
  ms: number;
}

/** Remove background quickly; falls back to the (downscaled) original on error. */
export async function fastRemoveBackground(
  file: Blob,
  onProgress?: (pct: number) => void,
): Promise<RemoveBgResult> {
  const t0 = performance.now();
  const small = await downscaleImage(file);
  try {
    const removeBackground = await loadRemover();
    const blob = await removeBackground(small, {
      model: "isnet_quint8", // quantized = fastest
      output: { format: "image/png", quality: 0.8 },
      progress: (_key: string, current: number, total: number) => {
        if (onProgress && total) onProgress(Math.round((current / total) * 100));
      },
    });
    return { blob, removed: true, ms: performance.now() - t0 };
  } catch {
    return { blob: small, removed: false, ms: performance.now() - t0 };
  }
}

/** Pull the first image out of a paste/drop event. */
export function extractImage(
  data: DataTransfer | ClipboardEvent["clipboardData"] | null,
): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  for (const f of Array.from(data.files ?? [])) {
    if (f.type.startsWith("image/")) return f;
  }
  return null;
}
