import { addCaption, captureViewport } from "../src/export/capture";
import { buildCritContext, buildPlainFlavor } from "../src/export/clipboard";
import { getComponentStack } from "../src/host/fiber";

export type CritPreview = {
  imageUrl: string;
  text: string;
};

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG encode failed"));
    }, "image/png");
  });
}

// The shipped pipeline captures the whole viewport, which on this page would
// show the playground containing itself. So run the real capture, then crop
// it to the demo window before the caption goes on. The crop scale comes from
// the returned bitmap, which stays correct even when capture downscales a
// large PNG.
async function framePng(input: {
  frame: HTMLElement;
  drawing: HTMLCanvasElement | null;
  comment: string;
  url: string;
}): Promise<string> {
  const shot = await captureViewport({
    includeDrawing: input.drawing !== null,
    drawingCanvas: input.drawing,
  });

  const bitmap = await createImageBitmap(shot);
  const scale = bitmap.width / window.innerWidth;
  const rect = input.frame.getBoundingClientRect();

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(rect.width * scale));
  out.height = Math.max(1, Math.round(rect.height * scale));
  const ctx = out.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("2d context unavailable");
  }
  ctx.drawImage(
    bitmap,
    rect.left * scale,
    rect.top * scale,
    rect.width * scale,
    rect.height * scale,
    0,
    0,
    out.width,
    out.height,
  );
  bitmap.close();

  const cropped = await toPngBlob(out);
  const comment = input.comment.trim();
  const captioned =
    comment.length > 0
      ? await addCaption(cropped, { lines: [comment], url: input.url })
      : cropped;
  return URL.createObjectURL(captioned);
}

export async function buildPreview(input: {
  frame: HTMLElement;
  target: Element;
  comment: string;
  drawing: HTMLCanvasElement | null;
}): Promise<CritPreview> {
  let components: string[] = [];
  try {
    components = getComponentStack(input.target);
  } catch {
    components = [];
  }
  const context = buildCritContext(input.target, components);
  const text = buildPlainFlavor({ comment: input.comment, context });
  const imageUrl = await framePng({
    frame: input.frame,
    drawing: input.drawing,
    comment: input.comment,
    url: context.url,
  });
  return { imageUrl, text };
}
