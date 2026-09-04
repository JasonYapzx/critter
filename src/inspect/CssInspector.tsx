import type { ReactNode } from "react";
import { cssColorToHex } from "./edits";
import {
  controlKindFor,
  formatBoxSides,
  formatCssDimension,
  formatGridRepeat,
  groupInspectorProperties,
  isColumnDirection,
  normalizeFontWeight,
  parseBoxSides,
  parseCssDimension,
  parseGridTrackCount,
  propertyLabel,
  valuesMatch,
  FONT_WEIGHT_OPTIONS,
  isDimensionUnit,
  type BoxSides,
} from "./inspectorModel";

const ICON = {
  width: 12,
  height: 12,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconAlignLeft() {
  return (
    <svg {...ICON}>
      <path d="M2 3.5h12M2 8h8M2 12.5h10" />
    </svg>
  );
}
function IconAlignCenter() {
  return (
    <svg {...ICON}>
      <path d="M2 3.5h12M4 8h8M3 12.5h10" />
    </svg>
  );
}
function IconAlignRight() {
  return (
    <svg {...ICON}>
      <path d="M2 3.5h12M6 8h8M4 12.5h10" />
    </svg>
  );
}
function IconAlignJustify() {
  return (
    <svg {...ICON}>
      <path d="M2 3.5h12M2 8h12M2 12.5h12" />
    </svg>
  );
}
function IconDirRow() {
  return (
    <svg {...ICON}>
      <path d="M2 8h12M10 4.5 14 8l-4 3.5" />
    </svg>
  );
}
function IconDirCol() {
  return (
    <svg {...ICON}>
      <path d="M8 2v12M4.5 10 8 14l3.5-4" />
    </svg>
  );
}
function IconPackStart() {
  return (
    <svg {...ICON}>
      <path d="M2 3h12M3 7h3v6H3zM7 7h3v6H7z" />
    </svg>
  );
}
function IconPackCenter() {
  return (
    <svg {...ICON}>
      <path d="M3 5h3v6H3zM7 5h3v6H7z" />
    </svg>
  );
}
function IconPackEnd() {
  return (
    <svg {...ICON}>
      <path d="M2 13h12M3 3h3v6H3zM7 3h3v6H7z" />
    </svg>
  );
}
function IconSpaceBetween() {
  return (
    <svg {...ICON}>
      <path d="M2 3v10M14 3v10M4 5h3v6H4zM9 5h3v6H9z" />
    </svg>
  );
}
function IconPosLeft() {
  return (
    <svg {...ICON}>
      <path d="M3 2v12M7 5h6v2H7zM7 9h4v2H7z" />
    </svg>
  );
}
function IconPosHCenter() {
  return (
    <svg {...ICON}>
      <path d="M8 2v12M5 5h6v2H5zM6 9h4v2H6z" />
    </svg>
  );
}
function IconPosRight() {
  return (
    <svg {...ICON}>
      <path d="M13 2v12M3 5h6v2H3zM5 9h4v2H5z" />
    </svg>
  );
}
function IconPosTop() {
  return (
    <svg {...ICON}>
      <path d="M2 3h12M5 7h2v6H5zM9 7h2v4H9z" />
    </svg>
  );
}
function IconPosVCenter() {
  return (
    <svg {...ICON}>
      <path d="M2 8h12M5 4h2v8H5zM9 5h2v6H9z" />
    </svg>
  );
}
function IconPosBottom() {
  return (
    <svg {...ICON}>
      <path d="M2 13h12M5 3h2v6H5zM9 5h2v4H9z" />
    </svg>
  );
}

const UNIT_CYCLE = ["px", "rem", "em", "%", ""] as const;

function cycleUnit(unit: string): string {
  const index = UNIT_CYCLE.indexOf(unit as (typeof UNIT_CYCLE)[number]);
  const from = index === -1 ? 0 : index;
  return UNIT_CYCLE[(from + 1) % UNIT_CYCLE.length] ?? "px";
}

function unitLabel(unit: string): string {
  return unit.length > 0 ? unit : "—";
}

type Chip = {
  value: string;
  label: string;
  icon?: ReactNode;
};

function currentValue(draft: string, computed: string): string {
  return draft.trim().length > 0 ? draft : computed;
}

function displayAlignValue(property: string, value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized !== "normal") return value;
  if (property === "justify-content" || property === "justify-items") {
    return "start";
  }
  if (property === "align-items" || property === "align-content") {
    return "stretch";
  }
  return value;
}

function FieldLabel({
  property,
  children,
}: {
  property: string;
  children: ReactNode;
}) {
  if (property === "border-radius" || property === "background-color") {
    return <div className="crit-insp-stack">{children}</div>;
  }
  const kind = controlKindFor(property).kind;
  if (kind === "box") {
    return (
      <div className="crit-insp-stack">
        <span className="crit-insp-label" title={property}>
          {propertyLabel(property)}
        </span>
        {children}
      </div>
    );
  }
  return (
    <div className="crit-insp-row">
      <span className="crit-insp-label" title={property}>
        {propertyLabel(property)}
      </span>
      {children}
    </div>
  );
}

function ColorField({
  property,
  draft,
  computed,
  disabled,
  onChange,
}: {
  property: string;
  draft: string;
  computed: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const live = currentValue(draft, computed);
  const hex = cssColorToHex(live) ?? "#000000";
  const shown = draft.trim().length > 0 ? draft : (cssColorToHex(computed) ?? "");
  return (
    <span className="crit-css-value">
      <input
        type="color"
        className="crit-color crit-color-swatch"
        value={hex}
        disabled={disabled}
        aria-label={`${propertyLabel(property)} color`}
        onChange={(event) => onChange(event.target.value)}
      />
      <input
        className="crit-input"
        value={shown}
        placeholder={cssColorToHex(computed) ?? computed}
        disabled={disabled}
        spellCheck={false}
        aria-label={property}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

function TextField({
  property,
  draft,
  computed,
  disabled,
  onChange,
}: {
  property: string;
  draft: string;
  computed: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="crit-input"
      value={draft}
      placeholder={computed}
      disabled={disabled}
      spellCheck={false}
      aria-label={property.length > 0 ? property : "CSS value"}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function DimensionField({
  property,
  draft,
  computed,
  fallbackUnit,
  disabled,
  onChange,
}: {
  property: string;
  draft: string;
  computed: string;
  fallbackUnit: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const live = currentValue(draft, computed);
  const parsed = parseCssDimension(live);
  if (!parsed && live.length > 0 && draft.trim().length === 0) {
    return (
      <TextField
        property={property}
        draft={draft}
        computed={computed}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }
  const number = parsed?.number;
  const unit = parsed?.unit ?? fallbackUnit;
  const safeUnit = isDimensionUnit(unit) ? unit : fallbackUnit;
  return (
    <span className="crit-fig-field">
      <input
        className="crit-input crit-input-num"
        type="number"
        step={safeUnit === "px" || safeUnit === "%" ? 1 : 0.1}
        value={number ?? ""}
        placeholder={parsed ? undefined : computed}
        disabled={disabled}
        aria-label={property}
        onChange={(event) => {
          const next = event.target.value;
          if (next.trim().length === 0) {
            onChange("");
            return;
          }
          const nextNumber = Number(next);
          if (!Number.isFinite(nextNumber)) return;
          onChange(formatCssDimension({ number: nextNumber, unit: safeUnit }));
        }}
      />
      <button
        type="button"
        className="crit-fig-unit"
        disabled={disabled}
        aria-label={`${property} unit`}
        title="Cycle unit"
        onClick={() => {
          onChange(
            formatCssDimension({
              number: number ?? 0,
              unit: cycleUnit(safeUnit),
            }),
          );
        }}
      >
        {unitLabel(safeUnit)}
      </button>
    </span>
  );
}

function RadiusField({
  property,
  draft,
  computed,
  disabled,
  onChange,
}: {
  property: string;
  draft: string;
  computed: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const live = currentValue(draft, computed);
  const parsed = parseCssDimension(live);
  const number = parsed?.number ?? 0;
  const unit = parsed?.unit || "px";
  const sliderMax = 64;
  return (
    <div className="crit-fig-slider-row">
      <span className="crit-fig-field crit-fig-field-tight">
        <input
          className="crit-input crit-input-num"
          type="number"
          min={0}
          step={1}
          value={parsed ? number : ""}
          placeholder={computed}
          disabled={disabled}
          aria-label={property}
          onChange={(event) => {
            const next = event.target.value;
            if (next.trim().length === 0) {
              onChange("");
              return;
            }
            const nextNumber = Number(next);
            if (!Number.isFinite(nextNumber)) return;
            onChange(formatCssDimension({ number: nextNumber, unit }));
          }}
        />
        <span className="crit-fig-unit" aria-hidden="true">
          {unitLabel(unit)}
        </span>
      </span>
      <input
        type="range"
        className="crit-fig-range"
        min={0}
        max={sliderMax}
        step={1}
        value={Math.min(sliderMax, Math.max(0, number))}
        disabled={disabled}
        aria-label={`${property} slider`}
        onChange={(event) => {
          onChange(
            formatCssDimension({
              number: Number(event.target.value),
              unit,
            }),
          );
        }}
      />
    </div>
  );
}

function BoxField({
  property,
  draft,
  computed,
  disabled,
  onChange,
}: {
  property: string;
  draft: string;
  computed: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const live = currentValue(draft, computed);
  const sides = parseBoxSides(live);
  if (!sides) {
    return (
      <TextField
        property={property}
        draft={draft}
        computed={computed}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }
  const writeSide = (side: keyof BoxSides, next: string) => {
    const updated = { ...sides, [side]: next.trim().length > 0 ? next.trim() : "0px" };
    onChange(formatBoxSides(updated));
  };
  const cells: { side: keyof BoxSides; prefix: string }[] = [
    { side: "top", prefix: "T" },
    { side: "right", prefix: "R" },
    { side: "bottom", prefix: "B" },
    { side: "left", prefix: "L" },
  ];
  return (
    <div className="crit-fig-box" role="group" aria-label={property}>
      {cells.map((cell) => {
        const raw = sides[cell.side];
        const parsed = parseCssDimension(raw);
        return (
          <label key={cell.side} className="crit-fig-field">
            <span className="crit-fig-prefix">{cell.prefix}</span>
            <input
              className="crit-input crit-input-num"
              type={parsed ? "number" : "text"}
              step={1}
              value={parsed ? parsed.number : raw}
              disabled={disabled}
              aria-label={`${property} ${cell.side}`}
              onChange={(event) => {
                const next = event.target.value;
                if (!parsed) {
                  writeSide(cell.side, next);
                  return;
                }
                if (next.trim().length === 0) {
                  writeSide(cell.side, `0${parsed.unit || "px"}`);
                  return;
                }
                const nextNumber = Number(next);
                if (!Number.isFinite(nextNumber)) return;
                writeSide(
                  cell.side,
                  formatCssDimension({
                    number: nextNumber,
                    unit: parsed.unit || "px",
                  }),
                );
              }}
            />
          </label>
        );
      })}
    </div>
  );
}

function ChipGroup({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Chip[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="crit-chips" role="group" aria-label={label}>
      {options.map((option) => {
        const pressed = valuesMatch(value, option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={pressed ? "crit-chip crit-chip-on" : "crit-chip"}
            aria-pressed={pressed}
            title={option.label}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.icon ?? option.label}
          </button>
        );
      })}
    </div>
  );
}

function TracksField({
  property,
  draft,
  computed,
  disabled,
  onChange,
}: {
  property: string;
  draft: string;
  computed: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const live = currentValue(draft, computed);
  const count = parseGridTrackCount(live);
  return (
    <span className="crit-css-value">
      <input
        className="crit-input crit-input-num crit-track-count"
        type="number"
        min={1}
        step={1}
        value={count ?? ""}
        disabled={disabled}
        aria-label={`${property} count`}
        onChange={(event) => {
          const next = event.target.value;
          if (next.trim().length === 0) {
            onChange("");
            return;
          }
          const parsed = Number(next);
          if (!Number.isFinite(parsed) || parsed < 1) return;
          onChange(formatGridRepeat(parsed));
        }}
      />
      <input
        className="crit-input"
        value={draft}
        placeholder={computed}
        disabled={disabled}
        spellCheck={false}
        aria-label={property}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

function ControlFor({
  property,
  draft,
  computed,
  disabled,
  onChange,
}: {
  property: string;
  draft: string;
  computed: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  if (property === "border-radius") {
    return (
      <RadiusField
        property={property}
        draft={draft}
        computed={computed}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }
  const control = controlKindFor(property);
  const live = currentValue(draft, computed);
  switch (control.kind) {
    case "color":
      return (
        <ColorField
          property={property}
          draft={draft}
          computed={computed}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "dimension":
      return (
        <DimensionField
          property={property}
          draft={draft}
          computed={computed}
          fallbackUnit={control.fallbackUnit}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "box":
      return (
        <BoxField
          property={property}
          draft={draft}
          computed={computed}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "weight": {
      const current = normalizeFontWeight(live);
      const known = FONT_WEIGHT_OPTIONS.some((option) => option.value === current);
      return (
        <select
          className="crit-input crit-select"
          value={known ? current : ""}
          disabled={disabled}
          aria-label={property}
          onChange={(event) => onChange(event.target.value)}
        >
          {known ? null : <option value="">Weight</option>}
          {FONT_WEIGHT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    case "align-text":
      return (
        <ChipGroup
          label={property}
          value={live}
          disabled={disabled}
          onChange={onChange}
          options={[
            { value: "left", label: "Left", icon: <IconAlignLeft /> },
            { value: "center", label: "Center", icon: <IconAlignCenter /> },
            { value: "right", label: "Right", icon: <IconAlignRight /> },
            { value: "justify", label: "Justify", icon: <IconAlignJustify /> },
          ]}
        />
      );
    case "direction":
      return (
        <ChipGroup
          label={property}
          value={live}
          disabled={disabled}
          onChange={onChange}
          options={[
            { value: "row", label: "Horizontal", icon: <IconDirRow /> },
            { value: "column", label: "Vertical", icon: <IconDirCol /> },
          ]}
        />
      );
    case "justify":
      return (
        <ChipGroup
          label={property}
          value={displayAlignValue(property, live)}
          disabled={disabled}
          onChange={onChange}
          options={[
            { value: "start", label: "Start", icon: <IconPackStart /> },
            { value: "center", label: "Center", icon: <IconPackCenter /> },
            { value: "end", label: "End", icon: <IconPackEnd /> },
            { value: "space-between", label: "Space between", icon: <IconSpaceBetween /> },
          ]}
        />
      );
    case "align":
      return (
        <ChipGroup
          label={property}
          value={displayAlignValue(property, live)}
          disabled={disabled}
          onChange={onChange}
          options={[
            { value: "start", label: "Start" },
            { value: "center", label: "Center" },
            { value: "end", label: "End" },
            { value: "stretch", label: "Stretch" },
          ]}
        />
      );
    case "display":
      return (
        <ChipGroup
          label={property}
          value={live}
          disabled={disabled}
          onChange={onChange}
          options={[
            { value: "flex", label: "Flex" },
            { value: "grid", label: "Grid" },
          ]}
        />
      );
    case "wrap":
      return (
        <ChipGroup
          label={property}
          value={live}
          disabled={disabled}
          onChange={onChange}
          options={[
            { value: "nowrap", label: "None" },
            { value: "wrap", label: "Wrap" },
          ]}
        />
      );
    case "flow":
      return (
        <ChipGroup
          label={property}
          value={live}
          disabled={disabled}
          onChange={onChange}
          options={[
            { value: "row", label: "Row" },
            { value: "column", label: "Column" },
          ]}
        />
      );
    case "tracks":
      return (
        <TracksField
          property={property}
          draft={draft}
          computed={computed}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "text":
      return (
        <TextField
          property={property}
          draft={draft}
          computed={computed}
          disabled={disabled}
          onChange={onChange}
        />
      );
    default: {
      const _exhaustive: never = control;
      return _exhaustive;
    }
  }
}

export function CssInspector({
  properties,
  drafts,
  computed,
  extraProp,
  extraVal,
  disabled,
  onChange,
  onExtraPropChange,
  onExtraValChange,
}: {
  properties: readonly string[];
  drafts: Record<string, string>;
  computed: Record<string, string>;
  extraProp: string;
  extraVal: string;
  disabled: boolean;
  onChange: (property: string, value: string) => void;
  onExtraPropChange: (value: string) => void;
  onExtraValChange: (value: string) => void;
}) {
  const sections = groupInspectorProperties(properties);
  const hasTextAlign = properties.includes("text-align");
  const hasJustify = properties.includes("justify-content");
  const hasAlignItems = properties.includes("align-items");
  const direction = currentValue(
    drafts["flex-direction"] ?? "",
    computed["flex-direction"] ?? "",
  );
  const column = isColumnDirection(direction);
  const xProp = column ? "align-items" : "justify-content";
  const yProp = column ? "justify-content" : "align-items";
  const hide = new Set<string>();
  if (hasTextAlign) hide.add("text-align");
  if (hasJustify && hasAlignItems) {
    hide.add("justify-content");
    hide.add("align-items");
  }

  return (
    <div className="crit-css-list">
      {hasJustify && hasAlignItems ? (
        <div className="crit-align-row" role="group" aria-label="Alignment">
          {(
            [
              { axis: "x", value: "start", label: "Left", icon: <IconPosLeft /> },
              { axis: "x", value: "center", label: "Center", icon: <IconPosHCenter /> },
              { axis: "x", value: "end", label: "Right", icon: <IconPosRight /> },
              { axis: "y", value: "start", label: "Top", icon: <IconPosTop /> },
              { axis: "y", value: "center", label: "Middle", icon: <IconPosVCenter /> },
              { axis: "y", value: "end", label: "Bottom", icon: <IconPosBottom /> },
            ] as const
          ).flatMap((option, index) => {
            const prop = option.axis === "x" ? xProp : yProp;
            const current = displayAlignValue(
              prop,
              currentValue(drafts[prop] ?? "", computed[prop] ?? ""),
            );
            const pressed = valuesMatch(current, option.value);
            const button = (
              <button
                key={`${option.axis}-${option.value}`}
                type="button"
                className={pressed ? "crit-align-btn crit-align-btn-on" : "crit-align-btn"}
                aria-pressed={pressed}
                aria-label={option.label}
                title={option.label}
                disabled={disabled}
                onClick={() => onChange(prop, option.value)}
              >
                {option.icon}
              </button>
            );
            if (index === 2) {
              return [
                button,
                <span key="align-split" className="crit-align-split" aria-hidden="true" />,
              ];
            }
            return [button];
          })}
        </div>
      ) : hasTextAlign ? (
        <div className="crit-align-row" role="group" aria-label="Text align">
          <ChipGroup
            label="text-align"
            value={currentValue(drafts["text-align"] ?? "", computed["text-align"] ?? "")}
            disabled={disabled}
            onChange={(value) => onChange("text-align", value)}
            options={[
              { value: "left", label: "Left", icon: <IconAlignLeft /> },
              { value: "center", label: "Center", icon: <IconAlignCenter /> },
              { value: "right", label: "Right", icon: <IconAlignRight /> },
              { value: "justify", label: "Justify", icon: <IconAlignJustify /> },
            ]}
          />
        </div>
      ) : null}
      {sections.map((section) => {
        const visible = section.properties.filter((property) => !hide.has(property));
        if (visible.length === 0) return null;
        return (
          <section key={section.id} className="crit-insp-sec">
            <h3 className="crit-insp-h">{section.title}</h3>
            {visible.map((property) => (
              <FieldLabel key={property} property={property}>
                <ControlFor
                  property={property}
                  draft={drafts[property] ?? ""}
                  computed={computed[property] ?? ""}
                  disabled={disabled}
                  onChange={(value) => onChange(property, value)}
                />
              </FieldLabel>
            ))}
          </section>
        );
      })}
      <section className="crit-insp-sec">
        <h3 className="crit-insp-h">Custom</h3>
        <div className="crit-css-row crit-css-row-add">
          <input
            className="crit-input"
            value={extraProp}
            placeholder="property"
            disabled={disabled}
            spellCheck={false}
            aria-label="CSS property"
            onChange={(event) => onExtraPropChange(event.target.value)}
          />
          {controlKindFor(extraProp).kind === "color" ? (
            <ColorField
              property={extraProp}
              draft={extraVal}
              computed=""
              disabled={disabled}
              onChange={onExtraValChange}
            />
          ) : (
            <TextField
              property={extraProp}
              draft={extraVal}
              computed=""
              disabled={disabled}
              onChange={onExtraValChange}
            />
          )}
        </div>
      </section>
    </div>
  );
}
