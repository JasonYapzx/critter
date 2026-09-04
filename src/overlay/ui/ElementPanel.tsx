import type { CSSProperties } from "react";
import { IconDownload, IconImage, IconType, IconX } from "./icons";

export function ElementPanel({
  targetLabel,
  comment,
  includeDrawing,
  busy,
  error,
  style,
  onCommentChange,
  onIncludeDrawingChange,
  onCancel,
  onCopyImage,
  onCopyText,
  onDownload,
}: {
  targetLabel: string;
  comment: string;
  includeDrawing: boolean;
  busy: boolean;
  error: string | null;
  style: CSSProperties;
  onCommentChange: (value: string) => void;
  onIncludeDrawingChange: (value: boolean) => void;
  onCancel: () => void;
  onCopyImage: () => void;
  onCopyText: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="crit-panel" data-crit-chrome="" style={style}>
      <div className="crit-panel-head">
        <span className="crit-target">
          <span className="crit-target-dot" aria-hidden="true" />
          {targetLabel}
        </span>
        <button
          type="button"
          className="crit-icon-btn"
          aria-label="Cancel"
          title="Cancel (Esc)"
          disabled={busy}
          onClick={onCancel}
        >
          <IconX />
        </button>
      </div>
      <textarea
        className="crit-textarea"
        placeholder="What's wrong here?"
        value={comment}
        disabled={busy}
        onChange={(event) => onCommentChange(event.target.value)}
      />
      <label className="crit-toggle">
        <input
          type="checkbox"
          checked={includeDrawing}
          disabled={busy}
          onChange={(event) => onIncludeDrawingChange(event.target.checked)}
        />
        Include drawing
      </label>
      {error ? <p className="crit-error">{error}</p> : null}
      <div className="crit-actions">
        <button
          type="button"
          className="crit-btn crit-btn-primary crit-btn-grow"
          title="Copy screenshot"
          disabled={busy}
          onClick={onCopyImage}
        >
          <IconImage />
          {busy ? "Copying…" : "Image"}
        </button>
        <button
          type="button"
          className="crit-btn crit-btn-grow"
          title="Copy component text"
          disabled={busy}
          onClick={onCopyText}
        >
          <IconType />
          Text
        </button>
        <button
          type="button"
          className="crit-btn crit-btn-icon"
          aria-label="Download PNG"
          title="Download PNG"
          disabled={busy}
          onClick={onDownload}
        >
          <IconDownload />
        </button>
      </div>
    </div>
  );
}
