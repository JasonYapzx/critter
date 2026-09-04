export type Point = { x: number; y: number };
export type Stroke = Point[];
export type Size = { width: number; height: number };
export type DockSizes = { bar: Size | null; pill: Size | null };
export type DockEdge = "top" | "bottom" | "left" | "right";
export type DockDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  handle: HTMLElement;
};

export type Hovered = {
  element: Element;
  tagName: string;
  componentName: string | null;
};

export type OverlayState =
  | { kind: "idle" }
  | { kind: "picking" }
  | { kind: "commenting" }
  | {
      kind: "pinned";
      target: Hovered;
      comment: string;
      includeDrawing: boolean;
    }
  | {
      kind: "copying";
      target: Hovered;
      comment: string;
      includeDrawing: boolean;
    };
