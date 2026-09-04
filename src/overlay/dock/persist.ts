import { DOCK_EDGE_STORAGE_KEY, DRAWER_STORAGE_KEY } from "../constants";
import type { DockEdge, Size } from "../types";
import { boundsOrViewport, type Bounds } from "./bounds";

const DOCK_EDGES: readonly DockEdge[] = ["top", "bottom", "left", "right"];

export function isDockEdge(value: unknown): value is DockEdge {
  return typeof value === "string" && (DOCK_EDGES as readonly string[]).includes(value);
}

export function nearestDockEdge(
  x: number,
  y: number,
  bounds: Bounds | null = null,
): DockEdge {
  const box = boundsOrViewport(bounds);
  const distances: Record<DockEdge, number> = {
    left: x - box.left,
    right: box.right - x,
    top: y - box.top,
    bottom: box.bottom - y,
  };
  let best: DockEdge = "bottom";
  for (const edge of DOCK_EDGES) {
    if (distances[edge] < distances[best]) best = edge;
  }
  return best;
}

export function sameSize(a: Size | null, b: Size | null): boolean {
  if (a === null || b === null) return a === b;
  return a.width === b.width && a.height === b.height;
}

export function readDrawerOpen(): boolean {
  try {
    return window.localStorage.getItem(DRAWER_STORAGE_KEY) === "open";
  } catch {
    return false;
  }
}

export function writeDrawerOpen(open: boolean): void {
  try {
    window.localStorage.setItem(DRAWER_STORAGE_KEY, open ? "open" : "closed");
  } catch {
    // private mode / quota
  }
}

export function readDockEdge(): DockEdge {
  try {
    const raw = window.localStorage.getItem(DOCK_EDGE_STORAGE_KEY);
    return isDockEdge(raw) ? raw : "bottom";
  } catch {
    return "bottom";
  }
}

// True once the dock has been dragged, which is what makes a host's preferred
// starting edge stop applying.
export function hasStoredDockEdge(): boolean {
  try {
    return isDockEdge(window.localStorage.getItem(DOCK_EDGE_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function writeDockEdge(edge: DockEdge): void {
  try {
    window.localStorage.setItem(DOCK_EDGE_STORAGE_KEY, edge);
  } catch {
    // private mode / quota
  }
}
