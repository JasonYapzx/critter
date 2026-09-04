import { getComponentStack } from "../host/fiber";
import { SCOPE_ATTR } from "./constants";
import type { Hovered } from "./types";

function pickScope(): Element | null {
  return document.querySelector(`[${SCOPE_ATTR}]`);
}

export function hasPickScope(): boolean {
  return pickScope() !== null;
}

// With a data-crit-scope container on the page, only points inside that box
// are pickable; everywhere else the pointer is the page's again.
export function inPickScope(x: number, y: number): boolean {
  const scope = pickScope();
  if (!scope) return true;
  const rect = scope.getBoundingClientRect();
  return (
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  );
}

export function hitTest(x: number, y: number): Element | null {
  if (!inPickScope(x, y)) return null;
  const top = document.elementFromPoint(x, y);
  if (top?.closest("[data-crit-ignore]")) return null;

  const root = document.getElementById("crit-root");
  const previous = root?.style.pointerEvents;
  if (root) root.style.pointerEvents = "none";
  try {
    const el = document.elementFromPoint(x, y);
    if (!el || el.closest("[data-crit-ignore]")) return null;
    if (el === document.documentElement || el === document.body) return null;
    return el;
  } finally {
    if (root) root.style.pointerEvents = previous ?? "";
  }
}

export function describeElement(element: Element): Hovered {
  const names = getComponentStack(element);
  const first = names[0];
  return {
    element,
    tagName: element.tagName.toLowerCase(),
    componentName: first ?? null,
  };
}

export function targetLabel(target: Hovered): string {
  return target.componentName
    ? `${target.tagName} · ${target.componentName}`
    : target.tagName;
}

export function applyHighlightBox(
  box: HTMLElement | null,
  element: Element | null,
): void {
  if (!box) return;
  if (!element) {
    box.style.display = "none";
    return;
  }
  const rect = element.getBoundingClientRect();
  box.style.display = "block";
  box.style.top = `${rect.top}px`;
  box.style.left = `${rect.left}px`;
  box.style.width = `${rect.width}px`;
  box.style.height = `${rect.height}px`;
}
