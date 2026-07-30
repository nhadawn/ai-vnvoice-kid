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
    const raw = await removeBackground(small, {
      model: "isnet_quint8", // quantized = fastest
      output: { format: "image/png", quality: 0.8 },
      progress: (_key: string, current: number, total: number) => {
        if (onProgress && total) onProgress(Math.round((current / total) * 100));
      },
    });
    const blob = await refineCutout(raw);
    return { blob, removed: true, ms: performance.now() - t0 };
  } catch {
    return { blob: small, removed: false, ms: performance.now() - t0 };
  }
}

// ---------- Edge refinement ----------

function boxBlurAlpha(a: Float32Array, w: number, h: number, r: number) {
  if (r <= 0) return a;
  const tmp = new Float32Array(a.length);
  // horizontal
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += a[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / (2 * r + 1);
      const out = a[row + Math.min(w - 1, Math.max(0, x - r))];
      const inc = a[row + Math.min(w - 1, Math.max(0, x + r + 1))];
      sum += inc - out;
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      a[y * w + x] = sum / (2 * r + 1);
      const out = tmp[Math.min(h - 1, Math.max(0, y - r)) * w + x];
      const inc = tmp[Math.min(h - 1, Math.max(0, y + r + 1)) * w + x];
      sum += inc - out;
    }
  }
  return a;
}

/** Max-filter (dilate) used to grow the mask into a halo. */
function dilateAlpha(a: Float32Array, w: number, h: number, r: number) {
  const out = new Float32Array(a.length);
  const tmp = new Float32Array(a.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = -r; k <= r; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        const v = a[y * w + xx];
        if (v > m) m = v;
      }
      tmp[y * w + x] = m;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let m = 0;
      for (let k = -r; k <= r; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        const v = tmp[yy * w + x];
        if (v > m) m = v;
      }
      out[y * w + x] = m;
    }
  }
  return out;
}

export interface RefineOptions {
  /** Feather radius in px for alpha smoothing. */
  feather?: number;
  /** Halo (contour) thickness in px; 0 disables it. */
  halo?: number;
  /** Halo colour, default soft white. */
  haloColor?: string;
}

/**
 * Smooth the alpha matte (removes jagged/aliased edges + colour fringe) and
 * draw a soft contour "halo" behind the subject so it reads clearly on any
 * card background.
 */
export async function refineCutout(cutout: Blob, opts: RefineOptions = {}): Promise<Blob> {
  const { feather = 1, halo = 3, haloColor = "#ffffff" } = opts;
  const bitmap = await createImageBitmap(cutout);
  const pad = halo + feather + 2;
  const w = bitmap.width + pad * 2;
  const h = bitmap.height + pad * 2;

  const src = document.createElement("canvas");
  src.width = w; src.height = h;
  const sctx = src.getContext("2d", { willReadFrequently: true })!;
  sctx.drawImage(bitmap, pad, pad);
  bitmap.close?.();

  const img = sctx.getImageData(0, 0, w, h);
  const d = img.data;
  const n = w * h;

  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) alpha[i] = d[i * 4 + 3] / 255;

  // 1) Feather + re-contrast: kills stair-stepping and semi-transparent fringe.
  const smooth = boxBlurAlpha(Float32Array.from(alpha), w, h, feather);
  for (let i = 0; i < n; i++) {
    const v = (smooth[i] - 0.35) / 0.35; // remap 0.35..0.70 -> 0..1
    smooth[i] = v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v); // smoothstep
  }

  // 2) Un-premultiply dark fringe: pull edge colour from the nearest solid pixel.
  for (let i = 0; i < n; i++) {
    const a = smooth[i];
    if (a > 0 && d[i * 4 + 3] < 250 && a > alpha[i]) {
      const x = i % w, y = (i / w) | 0;
      let br = 0, bg = 0, bb = 0, best = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const yy = Math.min(h - 1, Math.max(0, y + dy));
          const j = (yy * w + xx) * 4;
          if (d[j + 3] > best) { best = d[j + 3]; br = d[j]; bg = d[j + 1]; bb = d[j + 2]; }
        }
      }
      if (best > d[i * 4 + 3]) { d[i * 4] = br; d[i * 4 + 1] = bg; d[i * 4 + 2] = bb; }
    }
    d[i * 4 + 3] = Math.round(a * 255);
  }
  sctx.putImageData(img, 0, 0);

  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const octx = out.getContext("2d")!;

  // 3) Halo: dilate + blur the mask, paint it behind the subject.
  if (halo > 0) {
    const grown = boxBlurAlpha(dilateAlpha(smooth, w, h, halo), w, h, Math.max(1, Math.round(halo / 2)));
    const hc = document.createElement("canvas");
    hc.width = w; hc.height = h;
    const hctx = hc.getContext("2d")!;
    const hImg = hctx.createImageData(w, h);
    const hd = hImg.data;
    for (let i = 0; i < n; i++) hd[i * 4 + 3] = Math.round(Math.min(1, grown[i] * 1.15) * 235);
    hctx.putImageData(hImg, 0, 0);
    hctx.globalCompositeOperation = "source-in";
    hctx.fillStyle = haloColor;
    hctx.fillRect(0, 0, w, h);
    octx.drawImage(hc, 0, 0);
  }

  octx.drawImage(src, 0, 0);
  return await new Promise<Blob>((resolve) =>
    out.toBlob((b) => resolve(b ?? cutout), "image/png"),
  );
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
