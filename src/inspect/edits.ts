import type { CritEdits } from "../export/clipboard";

export const CURATED_CSS_PROPERTIES = [
  "color",
  "background-color",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "padding",
  "margin",
  "border-radius",
  "gap",
] as const;

const FLEX_DISPLAY = new Set(["flex", "inline-flex"]);
const GRID_DISPLAY = new Set(["grid", "inline-grid"]);

const FLEX_CONTAINER_PROPERTIES = [
  "display",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "align-content",
] as const;

const GRID_CONTAINER_PROPERTIES = [
  "display",
  "grid-template-columns",
  "grid-template-rows",
  "grid-auto-flow",
  "justify-content",
  "align-items",
  "justify-items",
] as const;

const FLEX_CHILD_PROPERTIES = ["flex", "align-self", "order"] as const;
const GRID_CHILD_PROPERTIES = [
  "grid-column",
  "grid-row",
  "justify-self",
  "align-self",
] as const;

const NAMED_COLOR_PROPERTIES = new Set([
  "color",
  "fill",
  "stroke",
  "stop-color",
  "flood-color",
  "lighting-color",
]);

export type CssOverride = {
  property: string;
  from: string;
  to: string;
};

export type EditSession = {
  element: HTMLElement;
  originalStyleAttr: string | null;
  // null until the designer first enables text editing
  originalInnerHTML: string | null;
  originalInnerText: string | null;
  properties: string[];
  computed: Record<string, string>;
  overrides: Map<string, CssOverride>;
};

export function isColorProperty(property: string): boolean {
  const prop = property.trim().toLowerCase();
  return NAMED_COLOR_PROPERTIES.has(prop) || prop.endsWith("-color");
}

function channelToHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

function hexFromRgbFunction(value: string): string | null {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)\s*[,/\s]\s*([\d.]+)\s*[,/\s]\s*([\d.]+)/i,
  );
  if (!match) return null;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return null;
  }
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

export function cssColorToHex(value: string): string | null {
  const raw = value.trim();
  if (raw.length === 0) return null;

  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{8}$/i.test(raw)) return `#${raw.slice(1, 7).toLowerCase()}`;
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    if (!r || !g || !b) return null;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^#[0-9a-f]{4}$/i.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    if (!r || !g || !b) return null;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const fromRgb = hexFromRgbFunction(raw);
  if (fromRgb) return fromRgb;

  const probe = document.createElement("span");
  probe.style.color = raw;
  if (probe.style.color === "") return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return hexFromRgbFunction(probe.style.color);
  ctx.fillStyle = raw;
  const parsed = String(ctx.fillStyle);
  if (/^#[0-9a-f]{6}$/i.test(parsed)) return parsed.toLowerCase();
  return hexFromRgbFunction(parsed);
}

function appendUnique(target: string[], seen: Set<string>, extras: readonly string[]): void {
  for (const property of extras) {
    if (seen.has(property)) continue;
    seen.add(property);
    target.push(property);
  }
}

export function propertiesForElement(element: HTMLElement): string[] {
  const properties: string[] = [...CURATED_CSS_PROPERTIES];
  const seen = new Set<string>(properties);
  const style = getComputedStyle(element);
  const display = style.display.trim();
  const gapAt = properties.indexOf("gap");
  const insertAt = gapAt === -1 ? properties.length : gapAt;

  const container: string[] = [];
  if (FLEX_DISPLAY.has(display)) {
    appendUnique(container, seen, FLEX_CONTAINER_PROPERTIES);
  } else if (GRID_DISPLAY.has(display)) {
    appendUnique(container, seen, GRID_CONTAINER_PROPERTIES);
  }
  if (container.length > 0) {
    properties.splice(insertAt, 0, ...container);
  }

  const parent = element.parentElement;
  if (parent) {
    const parentDisplay = getComputedStyle(parent).display.trim();
    if (FLEX_DISPLAY.has(parentDisplay)) {
      appendUnique(properties, seen, FLEX_CHILD_PROPERTIES);
    } else if (GRID_DISPLAY.has(parentDisplay)) {
      appendUnique(properties, seen, GRID_CHILD_PROPERTIES);
    }
  }

  return properties;
}

export function beginEditSession(element: Element): EditSession | null {
  if (!(element instanceof HTMLElement)) return null;
  const properties = propertiesForElement(element);
  const computedStyle = getComputedStyle(element);
  const computed: Record<string, string> = {};
  for (const property of properties) {
    computed[property] = computedStyle.getPropertyValue(property).trim();
  }
  return {
    element,
    originalStyleAttr: element.getAttribute("style"),
    originalInnerHTML: null,
    originalInnerText: null,
    properties,
    computed,
    overrides: new Map(),
  };
}

function setPlaintextEditable(element: HTMLElement, on: boolean): void {
  if (!on) {
    element.removeAttribute("contenteditable");
    return;
  }
  element.setAttribute("contenteditable", "plaintext-only");
  if (element.contentEditable !== "plaintext-only") {
    element.setAttribute("contenteditable", "true");
  }
}

export function enableTextEditing(session: EditSession): void {
  if (session.originalInnerHTML === null) {
    session.originalInnerHTML = session.element.innerHTML;
    session.originalInnerText = session.element.innerText;
  }
  setPlaintextEditable(session.element, true);
  session.element.focus();
}

export function disableTextEditing(session: EditSession): void {
  setPlaintextEditable(session.element, false);
}

function restoreStyleAttribute(session: EditSession): void {
  if (session.originalStyleAttr === null) {
    session.element.removeAttribute("style");
  } else {
    session.element.setAttribute("style", session.originalStyleAttr);
  }
}

export function applyCssOverride(
  session: EditSession,
  property: string,
  value: string,
): void {
  const prop = property.trim();
  if (prop.length === 0) return;
  const to = value.trim();
  if (to.length === 0) {
    clearCssOverride(session, prop);
    return;
  }
  const existing = session.overrides.get(prop);
  const from =
    existing?.from ??
    session.computed[prop] ??
    getComputedStyle(session.element).getPropertyValue(prop).trim();
  session.element.style.setProperty(prop, to);
  session.overrides.set(prop, { property: prop, from, to });
}

export function clearCssOverride(session: EditSession, property: string): void {
  const prop = property.trim();
  if (prop.length === 0) return;
  session.overrides.delete(prop);
  restoreStyleAttribute(session);
  for (const override of session.overrides.values()) {
    session.element.style.setProperty(override.property, override.to);
  }
}

export function revertEdits(session: EditSession): void {
  disableTextEditing(session);
  for (const override of session.overrides.values()) {
    session.element.style.removeProperty(override.property);
  }
  session.overrides.clear();
  restoreStyleAttribute(session);
  if (session.originalInnerHTML !== null) {
    session.element.innerHTML = session.originalInnerHTML;
  }
}

export function endEditSession(session: EditSession, keepEdits: boolean): void {
  if (keepEdits) disableTextEditing(session);
  else revertEdits(session);
}

export function collectEdits(session: EditSession): CritEdits | undefined {
  let text: CritEdits["text"] = null;
  if (session.originalInnerText !== null) {
    const current = session.element.innerText;
    if (current !== session.originalInnerText) {
      text = { from: session.originalInnerText, to: current };
    }
  }
  const css = [...session.overrides.values()].map((override) => ({
    property: override.property,
    from: override.from,
    to: override.to,
  }));
  if (text === null && css.length === 0) return undefined;
  return { text, css };
}
