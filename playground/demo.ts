import { TOGGLE_EVENT } from "../src/overlay/constants";

// The demo drives the real overlay: every hover, pin, stroke, and keystroke
// below is a DOM event that crit handles the same way it handles a person.
// Two things are faked on purpose. The pointer is a div, because synthetic
// events carry no visible cursor. And the copy step never calls the clipboard,
// because a clipboard write needs a real user gesture and would overwrite
// whatever you have copied. The preview panel builds its result from the same
// capture and text functions the copy buttons use.

const POINTER_ID = 9001;

export type DemoPhase = "point" | "pin" | "draw" | "write" | "copy";

export type Point = { x: number; y: number };

export type DemoCallbacks = {
  target: () => HTMLElement | null;
  onPhase: (phase: DemoPhase) => void;
  onResult: (comment: string, drawing: HTMLCanvasElement | null) => Promise<void>;
  onClear: () => void;
  onFlavor: (flavor: "image" | "text") => void;
};

const COMMENT = "Book is too quiet next to Details. Make it the loud one.";

class Cancelled extends Error {}

function onAbortOnce(signal: AbortSignal, run: () => void): () => void {
  signal.addEventListener("abort", run, { once: true });
  return () => signal.removeEventListener("abort", run);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Cancelled());
    let detach = () => {};
    const timer = window.setTimeout(() => {
      detach();
      resolve();
    }, ms);
    detach = onAbortOnce(signal, () => {
      window.clearTimeout(timer);
      reject(new Cancelled());
    });
  });
}

function nextFrame(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Cancelled());
    let detach = () => {};
    const id = window.requestAnimationFrame(() => {
      detach();
      resolve();
    });
    detach = onAbortOnce(signal, () => {
      window.cancelAnimationFrame(id);
      reject(new Cancelled());
    });
  });
}

async function waitFor<T>(
  get: () => T | null,
  ms: number,
  signal: AbortSignal,
): Promise<T | null> {
  const deadline = performance.now() + ms;
  for (;;) {
    const value = get();
    if (value) return value;
    if (performance.now() > deadline) return null;
    await nextFrame(signal);
  }
}

// A synthetic pointerId is not a live pointer, so setPointerCapture throws
// NotFoundError inside the overlay's canvas handler. Swallow it for our id
// only, and leave real pointers alone.
function installPointerCaptureShim(): () => void {
  const set = Element.prototype.setPointerCapture;
  const release = Element.prototype.releasePointerCapture;
  Element.prototype.setPointerCapture = function (id: number) {
    if (id === POINTER_ID) return;
    return set.call(this, id);
  };
  Element.prototype.releasePointerCapture = function (id: number) {
    if (id === POINTER_ID) return;
    return release.call(this, id);
  };
  return () => {
    Element.prototype.setPointerCapture = set;
    Element.prototype.releasePointerCapture = release;
  };
}

function pointerEvent(type: string, at: Point, buttons: number): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: at.x,
    clientY: at.y,
    screenX: at.x,
    screenY: at.y,
    pointerId: POINTER_ID,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons,
  });
}

function overlayCanvas(): HTMLCanvasElement | null {
  return document.querySelector("#crit-root canvas.crit-canvas");
}

function overlayPanel(): HTMLElement | null {
  return document.querySelector("#crit-root .crit-panel");
}

function overlayTextarea(): HTMLTextAreaElement | null {
  return document.querySelector("#crit-root .crit-panel textarea");
}

function overlayImageButton(): HTMLElement | null {
  return document.querySelector("#crit-root .crit-panel .crit-btn-primary");
}

function overlayHighlight(): HTMLElement | null {
  return document.querySelector("#crit-root .crit-highlight");
}

function overlayIdle(): boolean {
  return (
    overlayPanel() === null &&
    document.querySelector("#crit-root .crit-highlight") === null
  );
}

function pressEscape(): void {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
}

// React tracks the last value it wrote to the node, so assigning .value
// directly is ignored. Go through the prototype setter, then fire input.
function typeInto(node: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  setter?.call(node, value);
  node.dispatchEvent(new Event("input", { bubbles: true }));
}

function createCursor(): HTMLElement {
  const existing = document.getElementById("crit-demo-cursor");
  const node = existing ?? document.createElement("div");
  node.id = "crit-demo-cursor";
  // Not pickable, and hidden from captures the same way crit's own chrome is.
  node.setAttribute("data-crit-ignore", "");
  node.setAttribute("data-crit-chrome", "");
  node.setAttribute("aria-hidden", "true");
  // Appended last so it draws over the overlay's own panels.
  document.body.appendChild(node);
  return node;
}

function moveCursor(node: HTMLElement, at: Point): void {
  // crit's chrome already sits at the maximum z-index, so painting over it
  // comes down to document order. The overlay root can be appended after us
  // (first mount, or an HMR remount), which would bury the pointer.
  if (document.body.lastElementChild !== node) document.body.appendChild(node);
  node.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

async function glide(
  from: Point,
  to: Point,
  ms: number,
  onFrame: (at: Point) => void,
  signal: AbortSignal,
): Promise<Point> {
  const start = performance.now();
  for (;;) {
    const t = Math.min(1, (performance.now() - start) / ms);
    const e = smoothstep(t);
    const at = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
    onFrame(at);
    if (t >= 1) return at;
    await nextFrame(signal);
  }
}

// A hand-drawn looking loop around the element being criticised.
function circlePath(rect: DOMRect): Point[] {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rx = rect.width * 0.72 + 12;
  const ry = rect.height * 0.9 + 9;
  const steps = 46;
  const turns = 1.12;
  const from = -Math.PI * 0.55;
  const path: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = from + (i / steps) * Math.PI * 2 * turns;
    const wobble = 1 + Math.sin(angle * 3) * 0.035;
    path.push({
      x: cx + Math.cos(angle) * rx * wobble,
      y: cy + Math.sin(angle) * ry * wobble,
    });
  }
  return path;
}

function centerOf(rect: DOMRect): Point {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

async function returnToIdle(signal: AbortSignal): Promise<void> {
  for (let i = 0; i < 3 && !overlayIdle(); i++) {
    pressEscape();
    await sleep(90, signal);
  }
}

// The toggle event is fire and forget: dispatch it before CritOverlay has
// attached its window listeners and it lands nowhere. Confirm the overlay
// actually reacted instead of driving a pass that can never pin.
async function enterPicking(signal: AbortSignal): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (overlayHighlight()) return true;
    window.dispatchEvent(new Event(TOGGLE_EVENT));
    if (await waitFor(overlayHighlight, 400, signal)) return true;
  }
  return false;
}

async function onePass(
  cb: DemoCallbacks,
  cursor: HTMLElement,
  signal: AbortSignal,
): Promise<void> {
  const subject = cb.target();
  if (!subject) return;

  cb.onPhase("point");
  await returnToIdle(signal);

  const rect = subject.getBoundingClientRect();
  const entry = { x: rect.left - 110, y: rect.bottom + 90 };
  const overSubject = centerOf(rect);

  cursor.dataset.state = "move";
  moveCursor(cursor, entry);
  cursor.style.opacity = "1";

  if (!(await enterPicking(signal))) return;
  await sleep(320, signal);

  let at = await glide(
    entry,
    overSubject,
    780,
    (p) => {
      moveCursor(cursor, p);
      window.dispatchEvent(pointerEvent("pointermove", p, 0));
    },
    signal,
  );
  await sleep(420, signal);

  cb.onPhase("pin");
  cursor.dataset.state = "press";
  window.dispatchEvent(pointerEvent("pointerdown", at, 1));
  window.dispatchEvent(pointerEvent("pointerup", at, 0));
  await sleep(180, signal);
  cursor.dataset.state = "move";
  if (!(await waitFor(overlayPanel, 800, signal))) return;
  await sleep(420, signal);

  const canvas = await waitFor(overlayCanvas, 1200, signal);
  if (canvas) {
    cb.onPhase("draw");
    const path = circlePath(subject.getBoundingClientRect());
    const first = path[0];
    if (first) {
      at = await glide(at, first, 320, (p) => moveCursor(cursor, p), signal);
      cursor.dataset.state = "press";
      canvas.dispatchEvent(pointerEvent("pointerdown", first, 1));
      for (const point of path) {
        moveCursor(cursor, point);
        canvas.dispatchEvent(pointerEvent("pointermove", point, 1));
        at = point;
        await nextFrame(signal);
      }
      canvas.dispatchEvent(pointerEvent("pointerup", at, 0));
      cursor.dataset.state = "move";
    }
  }
  await sleep(400, signal);

  const textarea = await waitFor(overlayTextarea, 1200, signal);
  if (textarea) {
    cb.onPhase("write");
    const box = textarea.getBoundingClientRect();
    at = await glide(
      at,
      { x: box.left + 46, y: box.top + 20 },
      420,
      (p) => moveCursor(cursor, p),
      signal,
    );
    cursor.dataset.state = "text";
    for (let i = 1; i <= COMMENT.length; i++) {
      typeInto(textarea, COMMENT.slice(0, i));
      await sleep(16, signal);
    }
    cursor.dataset.state = "move";
  }
  await sleep(500, signal);

  cb.onPhase("copy");
  const image = overlayImageButton();
  if (image) {
    at = await glide(
      at,
      centerOf(image.getBoundingClientRect()),
      420,
      (p) => moveCursor(cursor, p),
      signal,
    );
    cursor.dataset.state = "press";
    await sleep(160, signal);
    cursor.dataset.state = "move";
  }

  cb.onFlavor("image");
  await cb.onResult(COMMENT, overlayCanvas());
  if (signal.aborted) throw new Cancelled();
  await sleep(2100, signal);
  cb.onFlavor("text");
  await sleep(2400, signal);
  cursor.style.opacity = "0";
}

// Steps the overlay back to idle, clearing whatever the demo pinned or drew.
export function releaseOverlay(): Promise<void> {
  return returnToIdle(new AbortController().signal).catch(() => {});
}

export function runDemo(cb: DemoCallbacks, signal: AbortSignal): Promise<void> {
  const restore = installPointerCaptureShim();
  const cursor = createCursor();

  const loop = async () => {
    try {
      await waitFor(() => document.getElementById("crit-root"), 5000, signal);
      while (!signal.aborted) {
        await onePass(cb, cursor, signal);
        cb.onClear();
        await sleep(700, signal);
      }
    } catch (caught) {
      if (!(caught instanceof Cancelled)) throw caught;
    } finally {
      restore();
      cursor.remove();
      // The last result stays on screen so stopping mid-run leaves something
      // to read, and the overlay is left alone. Whoever stopped the demo
      // decides whether to hand the page back, because a stop triggered by
      // the crit shortcut must not undo the picking it just started.
    }
  };

  return loop();
}
