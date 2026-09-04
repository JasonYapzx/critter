export type CommentPin = {
  id: number;
  element: Element | null;
  offsetX: number;
  offsetY: number;
  pageX: number;
  pageY: number;
  comment: string;
  selector: string;
  tagName: string;
  componentName: string | null;
};

export type BoardPin = {
  number: number;
  comment: string;
  selector: string;
  componentName: string | null;
  offScreen: boolean;
};

export const LEGEND_MAX_ENTRIES = 12;

export function pinAnchor(pin: CommentPin): { x: number; y: number } {
  const el = pin.element;
  if (el !== null && el.isConnected) {
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    return {
      x: rect.left + (width === 0 ? 0 : (pin.offsetX / 100) * width),
      y: rect.top + (height === 0 ? 0 : (pin.offsetY / 100) * height),
    };
  }
  return {
    x: pin.pageX - window.scrollX,
    y: pin.pageY - window.scrollY,
  };
}

export function isPinOffScreen(pin: CommentPin): boolean {
  const { x, y } = pinAnchor(pin);
  return x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight;
}

export function applyPinPosition(
  node: HTMLElement | null,
  pin: CommentPin,
): void {
  if (!node) return;
  const { x, y } = pinAnchor(pin);
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
}

export function createPin(input: {
  id: number;
  clientX: number;
  clientY: number;
  element: Element | null;
  tagName: string;
  componentName: string | null;
  selector: string;
}): CommentPin {
  let offsetX = 0;
  let offsetY = 0;
  if (input.element) {
    const rect = input.element.getBoundingClientRect();
    offsetX =
      rect.width === 0
        ? 0
        : ((input.clientX - rect.left) / rect.width) * 100;
    offsetY =
      rect.height === 0
        ? 0
        : ((input.clientY - rect.top) / rect.height) * 100;
  }
  return {
    id: input.id,
    element: input.element,
    offsetX,
    offsetY,
    pageX: input.clientX + window.scrollX,
    pageY: input.clientY + window.scrollY,
    comment: "",
    selector: input.selector,
    tagName: input.tagName,
    componentName: input.componentName,
  };
}

export function pinLegendLines(pins: CommentPin[]): string[] {
  const lines = pins.map((pin) => {
    const off = isPinOffScreen(pin) ? " (off-screen)" : "";
    return `${pin.id}. ${pin.comment}${off}`;
  });
  if (lines.length <= LEGEND_MAX_ENTRIES) return lines;
  return [...lines.slice(0, LEGEND_MAX_ENTRIES), "…"];
}

export function toBoardPins(pins: CommentPin[]): BoardPin[] {
  return pins.map((pin) => ({
    number: pin.id,
    comment: pin.comment,
    selector: pin.selector,
    componentName: pin.componentName,
    offScreen: isPinOffScreen(pin),
  }));
}

export function imageCaptionLines(input: {
  comment: string;
  pins: CommentPin[];
}): string[] {
  const lines: string[] = [];
  const trimmed = input.comment.trim();
  if (trimmed.length > 0) lines.push(trimmed);
  if (input.pins.length > 0) lines.push(...pinLegendLines(input.pins));
  return lines;
}

type Rect = { left: number; top: number; width: number; height: number };

const CALLOUT_GAP = 10;
const VIEW_MARGIN = 8;

function rectsOverlap(a: Rect, b: Rect, gap: number): boolean {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  );
}

function createCalloutElement(id: number, comment: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "crit-pin-callout";
  el.setAttribute("data-crit-ignore", "");

  const num = document.createElement("span");
  num.className = "crit-pin-callout-n";
  num.textContent = String(id);

  const text = document.createElement("p");
  text.className = "crit-pin-callout-t";
  text.textContent = comment;

  el.append(num, text);
  return el;
}

function measureCallout(id: number, comment: string): { width: number; height: number } {
  const el = createCalloutElement(id, comment);
  el.style.position = "fixed";
  el.style.left = "-4000px";
  el.style.top = "0";
  el.style.visibility = "hidden";
  const host = document.getElementById("crit-root") ?? document.body;
  host.appendChild(el);
  const rect = el.getBoundingClientRect();
  el.remove();
  return {
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
  };
}

function clampBox(box: Rect): Rect {
  const maxLeft = Math.max(VIEW_MARGIN, window.innerWidth - box.width - VIEW_MARGIN);
  const maxTop = Math.max(VIEW_MARGIN, window.innerHeight - box.height - VIEW_MARGIN);
  return {
    ...box,
    left: Math.min(Math.max(box.left, VIEW_MARGIN), maxLeft),
    top: Math.min(Math.max(box.top, VIEW_MARGIN), maxTop),
  };
}

export type CalloutBox = Rect & { id: number };

export function layoutPinCallouts(pins: CommentPin[]): CalloutBox[] {
  const reserved: Rect[] = [];
  for (const pin of pins) {
    if (isPinOffScreen(pin)) continue;
    const anchor = pinAnchor(pin);
    reserved.push({
      left: anchor.x - 12,
      top: anchor.y - 34,
      width: 24,
      height: 34,
    });
  }

  const placed: CalloutBox[] = [];
  for (const pin of pins) {
    const comment = pin.comment.trim();
    if (comment.length === 0 || isPinOffScreen(pin)) continue;

    const anchor = pinAnchor(pin);
    const { width, height } = measureCallout(pin.id, comment);
    const candidates = [
      { left: anchor.x + 18, top: anchor.y - 36 },
      { left: anchor.x - width - 18, top: anchor.y - 36 },
      { left: anchor.x + 18, top: anchor.y + 8 },
      { left: anchor.x - width - 18, top: anchor.y + 8 },
    ];

    let chosen: CalloutBox | null = null;
    for (const candidate of candidates) {
      const box = { id: pin.id, ...clampBox({ ...candidate, width, height }) };
      if (
        reserved.every((rect) => !rectsOverlap(box, rect, CALLOUT_GAP)) &&
        placed.every((rect) => !rectsOverlap(box, rect, CALLOUT_GAP))
      ) {
        chosen = box;
        break;
      }
    }

    if (!chosen) {
      const box: CalloutBox = {
        id: pin.id,
        ...clampBox({
          left: anchor.x + 18,
          top: anchor.y - 36,
          width,
          height,
        }),
      };
      for (let step = 0; step < 20; step++) {
        if (
          reserved.every((rect) => !rectsOverlap(box, rect, CALLOUT_GAP)) &&
          placed.every((rect) => !rectsOverlap(box, rect, CALLOUT_GAP))
        ) {
          break;
        }
        box.top = Math.min(
          box.top + height + CALLOUT_GAP,
          window.innerHeight - height - VIEW_MARGIN,
        );
      }
      chosen = { id: pin.id, ...clampBox(box) };
    }

    placed.push(chosen);
  }
  return placed;
}

export function mountCaptureCallouts(pins: CommentPin[]): HTMLElement[] {
  const root = document.getElementById("crit-root");
  if (!root) return [];

  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  const nodes: HTMLElement[] = [];

  for (const box of layoutPinCallouts(pins)) {
    const pin = byId.get(box.id);
    if (!pin) continue;

    const el = createCalloutElement(pin.id, pin.comment.trim());
    el.style.position = "fixed";
    el.style.left = `${box.left}px`;
    el.style.top = `${box.top}px`;
    el.style.zIndex = "2147483645";
    root.appendChild(el);
    nodes.push(el);
  }

  for (let i = 0; i < nodes.length; i++) {
    const current = nodes[i];
    if (!current) continue;
    for (let j = 0; j < i; j++) {
      const other = nodes[j];
      if (!other) continue;
      let guard = 0;
      let a = current.getBoundingClientRect();
      const b = other.getBoundingClientRect();
      while (rectsOverlap(a, b, CALLOUT_GAP) && guard < 24) {
        const nextTop = Math.min(
          a.top + b.height + CALLOUT_GAP,
          window.innerHeight - a.height - VIEW_MARGIN,
        );
        current.style.top = `${Math.max(VIEW_MARGIN, nextTop)}px`;
        a = current.getBoundingClientRect();
        guard += 1;
      }
    }
  }

  return nodes;
}

export function unmountCaptureCallouts(nodes: HTMLElement[]): void {
  for (const node of nodes) node.remove();
}
