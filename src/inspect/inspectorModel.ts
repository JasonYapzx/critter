import { isColorProperty } from "./edits";

export type InspectorSectionId =
  | "layout"
  | "appearance"
  | "fill"
  | "text"
  | "space"
  | "child"
  | "more";

export type InspectorSection = {
  id: InspectorSectionId;
  title: string;
  properties: string[];
};

export type CssDimension = {
  number: number;
  unit: string;
};

export type BoxSides = {
  top: string;
  right: string;
  bottom: string;
  left: string;
};

export type ControlKind =
  | { kind: "color" }
  | { kind: "dimension"; fallbackUnit: string }
  | { kind: "box" }
  | { kind: "weight" }
  | { kind: "align-text" }
  | { kind: "direction" }
  | { kind: "justify" }
  | { kind: "align" }
  | { kind: "display" }
  | { kind: "wrap" }
  | { kind: "flow" }
  | { kind: "tracks" }
  | { kind: "text" };

type SectionDef = {
  id: InspectorSectionId;
  title: string;
  members: readonly string[];
};

const SECTION_DEFS: readonly SectionDef[] = [
  {
    id: "layout",
    title: "Layout",
    members: [
      "display",
      "flex-direction",
      "flex-wrap",
      "justify-content",
      "align-items",
      "align-content",
      "grid-template-columns",
      "grid-template-rows",
      "grid-auto-flow",
      "justify-items",
      "gap",
    ],
  },
  { id: "appearance", title: "Appearance", members: ["border-radius"] },
  { id: "fill", title: "Fill", members: ["background-color"] },
  {
    id: "text",
    title: "Text",
    members: [
      "color",
      "font-size",
      "font-weight",
      "line-height",
      "letter-spacing",
      "text-align",
    ],
  },
  {
    id: "space",
    title: "Spacing",
    members: ["padding", "margin"],
  },
  {
    id: "child",
    title: "Child",
    members: [
      "flex",
      "align-self",
      "order",
      "grid-column",
      "grid-row",
      "justify-self",
    ],
  },
];

const PROPERTY_LABELS: Record<string, string> = {
  "background-color": "Fill",
  color: "Color",
  "font-size": "Size",
  "font-weight": "Weight",
  "line-height": "Line",
  "letter-spacing": "Letter",
  "text-align": "Align",
  padding: "Padding",
  margin: "Margin",
  "border-radius": "Radius",
  gap: "Gap",
  display: "Mode",
  "flex-direction": "Direction",
  "flex-wrap": "Wrap",
  "justify-content": "Justify",
  "align-items": "Align",
  "align-content": "Align+",
  "grid-template-columns": "Columns",
  "grid-template-rows": "Rows",
  "grid-auto-flow": "Flow",
  "justify-items": "Justify",
  flex: "Flex",
  "align-self": "Self",
  order: "Order",
  "grid-column": "Column",
  "grid-row": "Row",
  "justify-self": "Self J",
};

export const FONT_WEIGHT_OPTIONS = [
  { value: "100", label: "Thin" },
  { value: "200", label: "Extra light" },
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
  { value: "900", label: "Black" },
] as const;

export function isDimensionUnit(value: string): boolean {
  return (
    value === "px" ||
    value === "rem" ||
    value === "em" ||
    value === "%" ||
    value === ""
  );
}

const DIMENSION_RE = /^([+-]?(?:\d*\.)?\d+)([a-z%]*)$/i;

const START_ALIASES = ["start", "flex-start", "self-start", "left"];
const END_ALIASES = ["end", "flex-end", "self-end", "right"];

export function propertyLabel(property: string): string {
  return PROPERTY_LABELS[property] ?? property;
}

export function groupInspectorProperties(
  properties: readonly string[],
): InspectorSection[] {
  const remaining = new Set(properties);
  const sections: InspectorSection[] = [];
  for (const def of SECTION_DEFS) {
    const found: string[] = [];
    for (const member of def.members) {
      if (!remaining.has(member)) continue;
      remaining.delete(member);
      found.push(member);
    }
    if (found.length > 0) {
      sections.push({ id: def.id, title: def.title, properties: found });
    }
  }
  if (remaining.size > 0) {
    sections.push({
      id: "more",
      title: "More",
      properties: properties.filter((property) => remaining.has(property)),
    });
  }
  return sections;
}

export function controlKindFor(property: string): ControlKind {
  if (isColorProperty(property)) return { kind: "color" };
  switch (property) {
    case "font-size":
    case "border-radius":
    case "gap":
      return { kind: "dimension", fallbackUnit: "px" };
    case "line-height":
      return { kind: "dimension", fallbackUnit: "" };
    case "letter-spacing":
      return { kind: "dimension", fallbackUnit: "px" };
    case "order":
      return { kind: "dimension", fallbackUnit: "" };
    case "padding":
    case "margin":
      return { kind: "box" };
    case "font-weight":
      return { kind: "weight" };
    case "text-align":
      return { kind: "align-text" };
    case "flex-direction":
      return { kind: "direction" };
    case "justify-content":
      return { kind: "justify" };
    case "align-items":
    case "align-content":
    case "align-self":
    case "justify-items":
    case "justify-self":
      return { kind: "align" };
    case "display":
      return { kind: "display" };
    case "flex-wrap":
      return { kind: "wrap" };
    case "grid-auto-flow":
      return { kind: "flow" };
    case "grid-template-columns":
    case "grid-template-rows":
      return { kind: "tracks" };
    default:
      return { kind: "text" };
  }
}

export function parseCssDimension(value: string): CssDimension | null {
  const raw = value.trim();
  if (raw.length === 0) return null;
  const lower = raw.toLowerCase();
  if (
    lower === "normal" ||
    lower === "auto" ||
    lower === "none" ||
    lower === "inherit"
  ) {
    return null;
  }
  const match = DIMENSION_RE.exec(raw);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  return { number, unit: match[2] ?? "" };
}

export function formatCssDimension(dimension: CssDimension): string {
  return `${stringifyNumber(dimension.number)}${dimension.unit}`;
}

export function parseBoxSides(value: string): BoxSides | null {
  const parts = value.trim().split(/\s+/).filter((part) => part.length > 0);
  const top = parts[0];
  if (!top || parts.length > 4) return null;
  if (parts.length === 1) {
    return { top, right: top, bottom: top, left: top };
  }
  const right = parts[1];
  if (!right) return null;
  if (parts.length === 2) {
    return { top, right, bottom: top, left: right };
  }
  const bottom = parts[2];
  if (!bottom) return null;
  if (parts.length === 3) {
    return { top, right, bottom, left: right };
  }
  const left = parts[3];
  if (!left) return null;
  return { top, right, bottom, left };
}

export function formatBoxSides(sides: BoxSides): string {
  const { top, right, bottom, left } = sides;
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && left === right) return `${top} ${right}`;
  if (left === right) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
}

function splitGridTracks(value: string): string[] {
  const tracks: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (/\s/.test(char) && depth === 0) {
      const piece = current.trim();
      if (piece.length > 0) tracks.push(piece);
      current = "";
      continue;
    }
    current += char;
  }
  const piece = current.trim();
  if (piece.length > 0) tracks.push(piece);
  return tracks;
}

export function parseGridTrackCount(value: string): number | null {
  const raw = value.trim();
  if (raw.length === 0 || raw === "none") return null;
  const repeat = raw.match(/^repeat\(\s*(\d+)\s*,/i);
  if (repeat) {
    const count = Number(repeat[1]);
    return Number.isFinite(count) && count > 0 ? count : null;
  }
  const tracks = splitGridTracks(raw);
  return tracks.length > 0 ? tracks.length : null;
}

export function formatGridRepeat(count: number): string {
  return `repeat(${Math.max(1, Math.round(count))}, 1fr)`;
}

export function normalizeFontWeight(value: string): string {
  const raw = value.trim().toLowerCase();
  if (raw === "normal") return "400";
  if (raw === "bold") return "700";
  return raw;
}

export function valuesMatch(current: string, canonical: string): boolean {
  const value = current.trim().toLowerCase();
  if (value === canonical) return true;
  if (canonical === "start") return START_ALIASES.includes(value);
  if (canonical === "end") return END_ALIASES.includes(value);
  if (canonical === "stretch") return value === "stretch" || value === "normal";
  if (canonical === "nowrap") return value === "nowrap" || value === "normal";
  if (canonical === "row") return value === "row" || value === "normal";
  if (canonical === "flex") {
    return value === "flex" || value === "inline-flex";
  }
  if (canonical === "grid") {
    return value === "grid" || value === "inline-grid";
  }
  return false;
}

export function isColumnDirection(value: string): boolean {
  return value.trim().toLowerCase().includes("column");
}

function stringifyNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1000) / 1000);
}
