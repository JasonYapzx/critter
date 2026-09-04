import { STROKE_COLOR, STROKE_WIDTH } from "./constants";
import type { Stroke } from "./types";

export function paintStrokes(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  inProgress: Stroke | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const all = inProgress ? [...strokes, inProgress] : strokes;
  for (const stroke of all) {
    const first = stroke[0];
    if (!first) continue;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < stroke.length; i++) {
      const point = stroke[i];
      if (!point) continue;
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

export function sizeCanvasToViewport(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  paintStrokes(canvas, strokes, null);
}
