import type { CSSProperties, PointerEvent as ReactPointerEvent, Ref } from "react";
import type { ToggleShortcut } from "../../host/shortcut";
import { formatShortcut } from "../../host/shortcut";
import {
  IconChevronDown,
  IconChevronUp,
  IconCursor,
  IconDownload,
  IconImage,
  IconMessage,
  IconSettings,
  IconTrash,
  IconType,
  IconX,
} from "../ui/icons";
import type { DockEdge } from "../types";
import { dockSnapStyle, dockStyle, type Bounds } from "./bounds";

export function Dock({
  dockRef,
  dockBarRef,
  dockPillRef,
  settingsRef,
  edge,
  bounds,
  dragging,
  snapTarget,
  drawerOpen,
  shellSize,
  picking,
  commenting,
  active,
  toolsBusy,
  hasPins,
  pinCount,
  error,
  settingsOpen,
  recordingHotkey,
  shortcut,
  onBeginDrag,
  onMoveDrag,
  onEndDrag,
  onPick,
  onComment,
  onClearPins,
  onCopyImage,
  onCopyText,
  onDownload,
  onExit,
  onToggleSettings,
  onCollapse,
  onOpenDrawer,
  onStartRecordHotkey,
  onResetShortcut,
}: {
  dockRef: Ref<HTMLDivElement>;
  dockBarRef: Ref<HTMLDivElement>;
  dockPillRef: Ref<HTMLButtonElement>;
  settingsRef: Ref<HTMLDivElement>;
  edge: DockEdge;
  bounds: Bounds | null;
  dragging: boolean;
  snapTarget: DockEdge | null;
  drawerOpen: boolean;
  shellSize: { width: number; height: number } | null;
  picking: boolean;
  commenting: boolean;
  active: boolean;
  toolsBusy: boolean;
  hasPins: boolean;
  pinCount: number;
  error: string | null;
  settingsOpen: boolean;
  recordingHotkey: boolean;
  shortcut: ToggleShortcut;
  onBeginDrag: (event: ReactPointerEvent<HTMLElement>) => void;
  onMoveDrag: (event: ReactPointerEvent<HTMLElement>) => void;
  onEndDrag: (event: ReactPointerEvent<HTMLElement>) => void;
  onPick: () => void;
  onComment: () => void;
  onClearPins: () => void;
  onCopyImage: () => void;
  onCopyText: () => void;
  onDownload: () => void;
  onExit: () => void;
  onToggleSettings: () => void;
  onCollapse: () => void;
  onOpenDrawer: () => void;
  onStartRecordHotkey: () => void;
  onResetShortcut: () => void;
}) {
  const shellStyle: CSSProperties | undefined = shellSize
    ? { width: shellSize.width, height: shellSize.height }
    : undefined;

  return (
    <>
      {snapTarget ? (
        <div
          className="crit-dock-snap"
          data-edge={snapTarget}
          data-crit-chrome=""
          aria-hidden="true"
          style={dockSnapStyle(snapTarget, bounds)}
        />
      ) : null}
      <div
        ref={dockRef}
        className="crit-dock"
        data-crit-chrome=""
        data-edge={edge}
        data-dragging={dragging ? "" : undefined}
        style={dockStyle(edge, bounds)}
      >
        <div
          className="crit-dock-shell"
          data-open={drawerOpen ? "" : undefined}
          style={shellStyle}
        >
          <div
            ref={dockBarRef}
            className="crit-dock-bar"
            data-active={drawerOpen ? "" : undefined}
          >
            <div
              className="crit-dock-grip"
              title="Drag to move"
              onPointerDown={onBeginDrag}
              onPointerMove={onMoveDrag}
              onPointerUp={onEndDrag}
              onPointerCancel={onEndDrag}
            />
            {!picking ? (
              <button
                type="button"
                className="crit-btn crit-btn-primary crit-btn-icon"
                aria-label="Pick element"
                title="Pick element"
                disabled={toolsBusy}
                onClick={onPick}
              >
                <IconCursor />
              </button>
            ) : null}
            <span className="crit-tool-wrap">
              <button
                type="button"
                className={
                  commenting
                    ? "crit-btn crit-btn-primary crit-btn-icon"
                    : "crit-btn crit-btn-icon"
                }
                aria-label="Comment"
                aria-pressed={commenting}
                title="Comment (C)"
                disabled={toolsBusy}
                onClick={onComment}
              >
                <IconMessage />
              </button>
              {hasPins ? (
                <span className="crit-tool-badge">{pinCount}</span>
              ) : null}
            </span>
            <button
              type="button"
              className="crit-icon-btn"
              aria-label="Clear all pins"
              title="Clear all pins"
              disabled={toolsBusy || !hasPins}
              onClick={onClearPins}
            >
              <IconTrash />
            </button>
            <span className="crit-dock-sep" aria-hidden="true" />
            <button
              type="button"
              className="crit-btn crit-btn-icon"
              aria-label="Copy image"
              title="Copy image"
              disabled={toolsBusy || !hasPins}
              onClick={onCopyImage}
            >
              <IconImage />
            </button>
            <button
              type="button"
              className="crit-btn crit-btn-icon"
              aria-label="Copy text"
              title="Copy text"
              disabled={toolsBusy || !hasPins}
              onClick={onCopyText}
            >
              <IconType />
            </button>
            <button
              type="button"
              className="crit-btn crit-btn-icon"
              aria-label="Download PNG"
              title="Download PNG"
              disabled={toolsBusy || !hasPins}
              onClick={onDownload}
            >
              <IconDownload />
            </button>
            {active ? (
              <button
                type="button"
                className="crit-icon-btn"
                aria-label="Exit"
                title="Exit"
                disabled={toolsBusy}
                onClick={onExit}
              >
                <IconX />
              </button>
            ) : null}
            <button
              type="button"
              className="crit-icon-btn"
              data-crit-settings=""
              aria-label="Hotkey settings"
              aria-expanded={settingsOpen}
              title={`Hotkey ${formatShortcut(shortcut)}`}
              onClick={onToggleSettings}
            >
              <IconSettings />
            </button>
            <button
              type="button"
              className="crit-icon-btn crit-dock-collapse"
              aria-label="Collapse toolbar"
              onClick={onCollapse}
            >
              <IconChevronDown />
            </button>
          </div>
          <button
            ref={dockPillRef}
            type="button"
            className="crit-dock-pill"
            data-active={drawerOpen ? undefined : ""}
            aria-expanded="false"
            aria-label="Open toolbar"
            title="Open toolbar. Drag to move"
            onPointerDown={onBeginDrag}
            onPointerMove={onMoveDrag}
            onPointerUp={onEndDrag}
            onPointerCancel={onEndDrag}
            onClick={onOpenDrawer}
          >
            <IconCursor />
            <span className="crit-dock-pill-chevron" aria-hidden="true">
              <IconChevronUp />
            </span>
          </button>
        </div>
        {error ? <p className="crit-error crit-dock-error">{error}</p> : null}
        {settingsOpen ? (
          <div
            ref={settingsRef}
            className="crit-settings"
            data-crit-chrome=""
            data-crit-settings=""
          >
            <p className="crit-settings-h">Hotkey</p>
            <button
              type="button"
              className={
                recordingHotkey
                  ? "crit-settings-key crit-settings-key-live"
                  : "crit-settings-key"
              }
              onClick={onStartRecordHotkey}
            >
              {recordingHotkey ? "Press keys…" : formatShortcut(shortcut)}
            </button>
            <button
              type="button"
              className="crit-btn-ghost"
              onClick={onResetShortcut}
            >
              Reset
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
