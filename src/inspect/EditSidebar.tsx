import { CssInspector } from "./CssInspector";

export function EditSidebar({
  title,
  textEditing,
  busy,
  properties,
  drafts,
  computed,
  extraProp,
  extraVal,
  onToggleTextEditing,
  onRevertEdits,
  onCuratedCssChange,
  onExtraPropChange,
  onExtraValChange,
}: {
  title: string;
  textEditing: boolean;
  busy: boolean;
  properties: readonly string[];
  drafts: Record<string, string>;
  computed: Record<string, string>;
  extraProp: string;
  extraVal: string;
  onToggleTextEditing: () => void;
  onRevertEdits: () => void;
  onCuratedCssChange: (property: string, value: string) => void;
  onExtraPropChange: (next: string) => void;
  onExtraValChange: (next: string) => void;
}) {
  return (
    <aside
      className="crit-sidebar"
      data-crit-chrome=""
      aria-label="Edit element"
    >
      <div className="crit-sidebar-head">
        <span className="crit-sidebar-title">{title}</span>
        <div className="crit-edit-bar">
          <button
            type="button"
            className={textEditing ? "crit-btn crit-btn-pressed" : "crit-btn"}
            aria-pressed={textEditing}
            disabled={busy}
            onClick={onToggleTextEditing}
          >
            Edit text
          </button>
          <button
            type="button"
            className="crit-btn-ghost"
            disabled={busy}
            onClick={onRevertEdits}
          >
            Revert
          </button>
        </div>
      </div>
      <CssInspector
        properties={properties}
        drafts={drafts}
        computed={computed}
        extraProp={extraProp}
        extraVal={extraVal}
        disabled={busy}
        onChange={onCuratedCssChange}
        onExtraPropChange={onExtraPropChange}
        onExtraValChange={onExtraValChange}
      />
    </aside>
  );
}
