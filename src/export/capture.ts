import { snapdom } from "@zumer/snapdom";

const MAX_PNG_BYTES = 2 * 1024 * 1024;
const MIN_DOWNSCALE_EDGE = 320;
const DOWNSCALE_FACTOR = 0.85;

const CAPTION_BG = "#151318";
const CAPTION_TEXT = "#f4f1ee";
const CAPTION_MUTED = "#8f8a95";
const CAPTION_ACCENT = "#ff2d6a";
const CAPTION_FONT = '-apple-system, "Segoe UI", system-ui, sans-serif';
const CAPTION_MAX_LINES = 12;

export type CaptureOptions = {
  includeDrawing: boolean;
  drawingCanvas: HTMLCanvasElement | null;
};

export type Caption = {
  lines: string[];
  url: string;
};

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG encode failed"));
    }, "image/png");
  });
}

export async function downscaleIfNeeded(
  blob: Blob,
  maxBytes = MAX_PNG_BYTES,
): Promise<Blob> {
  let current = blob;
  while (current.size > maxBytes) {
    const bitmap = await createImageBitmap(current);
    if (bitmap.width <= MIN_DOWNSCALE_EDGE || bitmap.height <= MIN_DOWNSCALE_EDGE) {
      bitmap.close();
      break;
    }
    const width = Math.max(1, Math.round(bitmap.width * DOWNSCALE_FACTOR));
    const height = Math.max(1, Math.round(bitmap.height * DOWNSCALE_FACTOR));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      break;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    current = await canvasToPngBlob(canvas);
  }
  return current;
}

function compositeDrawing(
  page: HTMLCanvasElement,
  drawing: HTMLCanvasElement,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = page.width;
  out.height = page.height;
  const ctx = out.getContext("2d");
  if (!ctx) return page;
  ctx.drawImage(page, 0, 0);
  // Same viewport coordinates: both canvases cover the visual viewport.
  ctx.drawImage(drawing, 0, 0, page.width, page.height);
  return out;
}

export async function captureViewport(options: CaptureOptions): Promise<Blob> {
  if (document.fonts) {
    await document.fonts.ready;
  }

  const page = await snapdom.toCanvas(document.body, {
    embedFonts: true,
    clip: "viewport",
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
    exclude: ["[data-crit-chrome]"],
    excludeMode: "hide",
    backgroundColor: "#ffffff",
  });

  const composed =
    options.includeDrawing && options.drawingCanvas
      ? compositeDrawing(page, options.drawingCanvas)
      : page;

  const blob = await canvasToPngBlob(composed);
  return downscaleIfNeeded(blob);
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let current = text;
  while (current.length > 1 && ctx.measureText(`${current}…`).width > maxWidth) {
    current = current.slice(0, -1);
  }
  return `${current}…`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) continue;
    let line = "";
    for (const word of words) {
      const candidate = line.length > 0 ? `${line} ${word}` : word;
      if (line.length === 0 || ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  const kept = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    const last = kept[maxLines - 1] ?? "";
    kept[maxLines - 1] = `${last} …`;
  }
  return kept.map((line) => truncateToWidth(ctx, line, maxWidth));
}

// Bakes caption lines (and the page URL) into a bar under the screenshot,
// so image-only pastes and downloads still carry the crit's text.
export async function addCaption(blob: Blob, caption: Caption): Promise<Blob> {
  const source = caption.lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (source.length === 0) return blob;

  const bitmap = await createImageBitmap(blob);
  const width = bitmap.width;
  const out = document.createElement("canvas");
  const ctx = out.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return blob;
  }

  // Type scales with capture resolution so the caption reads the same at
  // any dpr / downscale level.
  const pad = Math.round(width * 0.028);
  const commentSize = Math.min(34, Math.max(14, Math.round(width * 0.015)));
  const metaSize = Math.max(11, Math.round(commentSize * 0.78));
  const commentLineHeight = Math.round(commentSize * 1.45);
  const metaLineHeight = Math.round(metaSize * 1.4);
  const accentHeight = Math.max(2, Math.round(width * 0.0025));
  const gap = Math.round(metaLineHeight * 0.55);
  const maxTextWidth = width - pad * 2;

  ctx.font = `500 ${commentSize}px ${CAPTION_FONT}`;
  const lines = wrapText(ctx, source.join("\n"), maxTextWidth, CAPTION_MAX_LINES);
  ctx.font = `400 ${metaSize}px ${CAPTION_FONT}`;
  const meta = truncateToWidth(ctx, caption.url, maxTextWidth);

  const barHeight =
    accentHeight + pad + lines.length * commentLineHeight + gap + metaLineHeight + pad;

  // Resizing the canvas resets 2d state; fonts are re-set before each draw.
  out.width = width;
  out.height = bitmap.height + barHeight;

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const barTop = out.height - barHeight;
  ctx.fillStyle = CAPTION_BG;
  ctx.fillRect(0, barTop, width, barHeight);
  ctx.fillStyle = CAPTION_ACCENT;
  ctx.fillRect(0, barTop, width, accentHeight);

  ctx.textBaseline = "top";
  ctx.fillStyle = CAPTION_TEXT;
  ctx.font = `500 ${commentSize}px ${CAPTION_FONT}`;
  let y = barTop + accentHeight + pad;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += commentLineHeight;
  }
  ctx.fillStyle = CAPTION_MUTED;
  ctx.font = `400 ${metaSize}px ${CAPTION_FONT}`;
  ctx.fillText(meta, pad, y + gap);

  return canvasToPngBlob(out);
}

export function downloadPng(blob: Blob, filename?: string): void {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `crit-${stamp}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}
