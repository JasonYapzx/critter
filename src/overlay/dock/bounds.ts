import type { CSSProperties } from "react";
import { BOUNDS_ATTR } from "../constants";
import type { DockEdge } from "../types";

// The box the dock docks to. Null means the viewport, which is what every
// host gets unless it marks a container with data-crit-bounds. The attribute
// value optionally names the edge to start on, e.g. data-crit-bounds="top",
// which only applies until someone drags the dock somewhere else.
export type Bounds = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  edge: DockEdge | null;
};

function parseEdge(value: string | null): DockEdge | null {
  return value === "top" || value === "bottom" || value === "left" || value === "right"
    ? value
    : null;
}

export function readBounds(): Bounds | null {
  const element = document.querySelector(`[${BOUNDS_ATTR}]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    edge: parseEdge(element.getAttribute(BOUNDS_ATTR)),
  };
}

export function sameBounds(a: Bounds | null, b: Bounds | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.right === b.right &&
    a.bottom === b.bottom &&
    a.edge === b.edge
  );
}

export function boundsOrViewport(bounds: Bounds | null): Bounds {
  if (bounds) return bounds;
  const width = window.innerWidth;
  const height = window.innerHeight;
  return { top: 0, left: 0, right: width, bottom: height, width, height, edge: null };
}

// The dock is position: fixed, so an inset measured from the far side of the
// viewport is what pins it to a bound edge. Every side is set explicitly,
// including the ones turned off, so these override the per-edge stylesheet
// rules rather than mixing with them.
export function dockStyle(
  edge: DockEdge,
  bounds: Bounds | null,
): CSSProperties | undefined {
  if (!bounds) return undefined;
  const fromRight = window.innerWidth - bounds.right;
  const fromBottom = window.innerHeight - bounds.bottom;
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  switch (edge) {
    case "top":
      return {
        top: bounds.top,
        right: "auto",
        bottom: "auto",
        left: centerX,
        translate: "-50% 0",
      };
    case "left":
      return {
        top: centerY,
        right: "auto",
        bottom: "auto",
        left: bounds.left,
        translate: "0 -50%",
      };
    case "right":
      return {
        top: centerY,
        right: fromRight,
        bottom: "auto",
        left: "auto",
        translate: "0 -50%",
      };
    case "bottom":
      return {
        top: "auto",
        right: "auto",
        bottom: fromBottom,
        left: centerX,
        translate: "-50% 0",
      };
  }
}

export function dockSnapStyle(
  edge: DockEdge,
  bounds: Bounds | null,
): CSSProperties | undefined {
  const base = dockStyle(edge, bounds);
  if (!base || !bounds) return undefined;
  const horizontal = edge === "top" || edge === "bottom";
  const length = Math.min(200, horizontal ? bounds.width : bounds.height);
  return horizontal
    ? { ...base, width: length }
    : { ...base, height: length };
}
