import type { CSSProperties } from "react";
import type { CommentPin } from "../pins/pins";
import { pinAnchor } from "../pins/pins";

export function commentBoxStyle(
  element: Element,
  estimatedHeight: number,
  rightReserve = 0,
): CSSProperties {
  const rect = element.getBoundingClientRect();
  const width = 312;
  const gap = 12;
  let top = rect.bottom + gap;
  let left = rect.left;
  if (top + estimatedHeight > window.innerHeight - 8) {
    top = rect.top - estimatedHeight - gap;
  }
  if (top < 8) top = 8;
  const rightLimit = window.innerWidth - 8 - rightReserve;
  if (left + width > rightLimit) {
    left = rightLimit - width;
  }
  if (left < 8) left = 8;
  return {
    position: "fixed",
    top,
    left,
    width,
    zIndex: 2147483647,
  };
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || target.isContentEditable;
}

export function isCommentKey(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return false;
  }
  return event.key === "c" || event.key === "C";
}

export function isCritChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-crit-chrome]")) return true;
  if (target.closest("[data-crit-pin]")) return false;
  return target.closest("#crit-root") !== null;
}

export function pinBubbleStyle(
  pin: CommentPin,
  estimatedHeight: number,
): CSSProperties {
  const anchor = pinAnchor(pin);
  const width = 248;
  const gap = 10;
  let left = anchor.x + 16 + gap;
  let top = anchor.y - 36;
  if (left + width > window.innerWidth - 8) {
    left = anchor.x - width - gap;
  }
  if (left < 8) left = 8;
  if (top + estimatedHeight > window.innerHeight - 8) {
    top = window.innerHeight - estimatedHeight - 8;
  }
  if (top < 8) top = 8;
  return {
    position: "fixed",
    top,
    left,
    width,
    zIndex: 2147483647,
  };
}

export function applyBoxStyle(
  node: HTMLElement | null,
  style: CSSProperties | null,
): void {
  if (!node) return;
  if (!style) {
    node.style.display = "none";
    return;
  }
  node.style.display = "";
  node.style.position = "fixed";
  node.style.top = typeof style.top === "number" ? `${style.top}px` : `${style.top}`;
  node.style.left =
    typeof style.left === "number" ? `${style.left}px` : `${style.left}`;
  node.style.width =
    typeof style.width === "number" ? `${style.width}px` : `${style.width ?? ""}`;
  node.style.zIndex = style.zIndex === undefined ? "" : String(style.zIndex);
}
