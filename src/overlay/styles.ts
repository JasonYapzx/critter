import { STROKE_COLOR } from "./constants";

export const OVERLAY_CSS = `
  #crit-root {
    --crit-accent: ${STROKE_COLOR};
    --crit-accent-soft: rgba(255, 45, 106, 0.16);
    --crit-bg: rgba(19, 17, 23, 0.88);
    --crit-bg-solid: #17151b;
    --crit-line: rgba(255, 255, 255, 0.09);
    --crit-line-strong: rgba(255, 255, 255, 0.17);
    --crit-text: #f4f1ee;
    --crit-muted: #8f8a95;
    --crit-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    --crit-mono: ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;
    /* Skeuomorphic depth. A light seam catches the top edge, a dark seam
       sits under the bottom edge, wells sink and keycaps rise. Kept to
       1-2px so it reads as material, not as a theme. */
    --crit-glint: rgba(255, 255, 255, 0.12);
    --crit-glint-strong: rgba(255, 255, 255, 0.2);
    --crit-seam: rgba(0, 0, 0, 0.5);
    --crit-raise:
      inset 0 1px 0 var(--crit-glint),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.35);
    --crit-raise-hover:
      inset 0 1px 0 var(--crit-glint-strong),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.4);
    --crit-recess:
      inset 0 2px 3px rgba(0, 0, 0, 0.45),
      inset 0 0 0 1px rgba(0, 0, 0, 0.18),
      0 1px 0 rgba(255, 255, 255, 0.05);
    --crit-well:
      inset 0 1.5px 3px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(0, 0, 0, 0.22),
      0 1px 0 rgba(255, 255, 255, 0.05);
    --crit-keycap: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.03)
    );
    --crit-keycap-hover: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.15),
      rgba(255, 255, 255, 0.06)
    );
    --crit-keycap-down: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.02),
      rgba(255, 255, 255, 0.06)
    );
    position: static;
    /* Modal libraries set pointer-events: none on body while open. */
    pointer-events: auto;
  }

  .crit-highlight {
    display: none;
    position: fixed;
    z-index: 2147483645;
    pointer-events: none;
    box-sizing: border-box;
    border: 1.5px solid var(--crit-accent);
    border-radius: 2px;
    background: rgba(255, 45, 106, 0.07);
    box-shadow: 0 0 0 3px var(--crit-accent-soft);
  }
  .crit-label {
    position: absolute;
    left: -2px;
    top: -28px;
    display: inline-block;
    max-width: min(70vw, 360px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: 5px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 55%),
      var(--crit-bg-solid);
    border: 1px solid rgba(255, 45, 106, 0.55);
    box-shadow:
      inset 0 1px 0 var(--crit-glint),
      0 2px 6px rgba(0, 0, 0, 0.4);
    color: var(--crit-text);
    font: 500 11px/1.3 var(--crit-mono);
    letter-spacing: 0.01em;
  }
  .crit-label:empty {
    display: none;
  }

  .crit-canvas {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    width: 100vw;
    height: 100vh;
    pointer-events: auto;
    touch-action: none;
    cursor: crosshair;
  }

  .crit-panel,
  .crit-dock-shell,
  .crit-toast,
  .crit-pin-pop,
  .crit-pin-callout {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) 38%),
      var(--crit-bg);
    -webkit-backdrop-filter: blur(14px) saturate(1.5);
    backdrop-filter: blur(14px) saturate(1.5);
    border: 1px solid var(--crit-line);
    box-shadow:
      inset 0 1px 0 var(--crit-glint),
      inset 0 -1px 0 rgba(0, 0, 0, 0.25),
      0 16px 40px rgba(0, 0, 0, 0.45),
      0 2px 8px rgba(0, 0, 0, 0.3);
    color: var(--crit-text);
    font: 13px/1.45 var(--crit-sans);
  }

  .crit-panel {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    animation: crit-pop 160ms cubic-bezier(0.32, 0.72, 0, 1);
  }
  .crit-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .crit-target {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--crit-muted);
    font: 500 11px/1.3 var(--crit-mono);
  }
  .crit-target-dot {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--crit-accent);
    box-shadow: 0 0 6px rgba(255, 45, 106, 0.8);
  }

  .crit-textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 84px;
    resize: vertical;
    padding: 9px 10px;
    border: 1px solid var(--crit-seam);
    border-radius: 9px;
    background: rgba(0, 0, 0, 0.3);
    box-shadow: var(--crit-well);
    color: var(--crit-text);
    font: inherit;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  .crit-textarea::placeholder {
    color: var(--crit-muted);
  }
  .crit-textarea:focus {
    outline: none;
    border-color: rgba(255, 45, 106, 0.7);
    box-shadow:
      var(--crit-well),
      0 0 0 3px var(--crit-accent-soft);
  }

  .crit-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--crit-muted);
    cursor: pointer;
    user-select: none;
  }
  .crit-toggle input {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: var(--crit-accent);
  }

  .crit-seg {
    display: flex;
    padding: 2px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid var(--crit-line);
  }
  .crit-seg-btn {
    appearance: none;
    flex: 1;
    margin: 0;
    padding: 5px 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--crit-muted);
    font: 600 11.5px/1 var(--crit-sans);
    cursor: pointer;
  }
  .crit-seg-btn[aria-selected="true"] {
    background: rgba(255, 255, 255, 0.1);
    color: var(--crit-text);
  }
  .crit-seg-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .crit-edit-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .crit-edit-bar .crit-btn-ghost {
    padding: 7px 12px;
  }
  .crit-edit-bar .crit-btn {
    padding: 5px 10px;
    font-size: 11.5px;
  }

  .crit-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483647;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 256px;
    padding: 12px 10px 56px;
    background: var(--crit-bg-solid);
    border-left: 1px solid var(--crit-line);
    box-shadow: -16px 0 40px rgba(0, 0, 0, 0.4);
    color: var(--crit-text);
    font: 12px/1.4 var(--crit-sans);
  }
  .crit-sidebar-head {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 2px 10px;
    margin-bottom: 2px;
    border-bottom: 1px solid var(--crit-line);
  }
  .crit-sidebar-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: 600 12px/1.3 var(--crit-sans);
  }
  .crit-sidebar .crit-css-list {
    flex: 1;
    max-height: none;
    min-height: 0;
  }
  .crit-sidebar .crit-insp-h {
    text-transform: none;
    letter-spacing: 0;
    font: 600 11px/1 var(--crit-sans);
  }

  .crit-align-row {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 6px 2px 10px;
    margin-bottom: 2px;
    border-bottom: 1px solid var(--crit-line);
  }
  .crit-align-row .crit-chips {
    flex: 1;
  }
  .crit-align-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 26px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--crit-muted);
    cursor: pointer;
  }
  .crit-align-btn:hover:not(:disabled):not(.crit-align-btn-on) {
    color: var(--crit-text);
    background: rgba(255, 255, 255, 0.06);
  }
  .crit-align-btn-on {
    background: rgba(255, 255, 255, 0.1);
    color: var(--crit-text);
  }
  .crit-align-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .crit-align-split {
    flex: none;
    width: 1px;
    height: 14px;
    margin: 0 4px;
    background: var(--crit-line-strong);
  }

  .crit-fig-field {
    display: flex;
    align-items: center;
    min-width: 0;
    height: 26px;
    padding: 0 6px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.32);
  }
  .crit-fig-field .crit-input {
    height: 26px;
    padding: 0 4px;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  .crit-fig-field .crit-input:focus {
    box-shadow: none;
  }
  .crit-fig-field-tight {
    flex: none;
    width: 76px;
  }
  .crit-fig-prefix {
    flex: none;
    width: 11px;
    color: var(--crit-muted);
    font: 600 10px/1 var(--crit-sans);
  }
  .crit-fig-unit {
    appearance: none;
    flex: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--crit-muted);
    font: 500 10px/1 var(--crit-sans);
    cursor: pointer;
  }
  button.crit-fig-unit:hover:not(:disabled) {
    color: var(--crit-text);
  }
  .crit-fig-unit:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .crit-fig-box {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .crit-fig-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .crit-fig-range {
    flex: 1;
    min-width: 0;
    height: 16px;
    margin: 0;
    accent-color: var(--crit-accent);
    cursor: pointer;
  }
  .crit-fig-range:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .crit-insp-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .crit-insp-stack + .crit-insp-stack,
  .crit-insp-row + .crit-insp-stack,
  .crit-insp-stack + .crit-insp-row {
    margin-top: 8px;
  }

  .crit-css-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 280px;
    overflow-y: auto;
    padding-right: 2px;
  }
  .crit-insp-sec + .crit-insp-sec {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--crit-line);
  }
  .crit-insp-h {
    margin: 0 0 6px;
    color: var(--crit-muted);
    font: 600 10px/1 var(--crit-sans);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  .crit-insp-row {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 6px;
    align-items: center;
    min-height: 26px;
  }
  .crit-insp-row + .crit-insp-row {
    margin-top: 6px;
  }
  .crit-insp-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--crit-muted);
    font: 500 11px/1.3 var(--crit-sans);
  }
  .crit-css-row {
    display: grid;
    grid-template-columns: 108px minmax(0, 1fr);
    gap: 6px;
    align-items: center;
  }
  .crit-css-row-add {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .crit-css-value {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .crit-step {
    display: flex;
    align-items: stretch;
    min-width: 0;
    border: 1px solid var(--crit-line);
    border-radius: 7px;
    background: rgba(0, 0, 0, 0.28);
    overflow: hidden;
  }
  .crit-step .crit-input {
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  .crit-step .crit-input:focus {
    box-shadow: none;
  }
  .crit-unit {
    appearance: none;
    flex: none;
    width: 42px;
    margin: 0;
    padding: 0 4px 0 0;
    border: 0;
    border-left: 1px solid var(--crit-line);
    background: transparent;
    color: var(--crit-muted);
    font: 500 10px/1 var(--crit-sans);
    cursor: pointer;
  }
  .crit-unit:focus {
    outline: none;
    color: var(--crit-text);
  }
  .crit-unit:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .crit-input-num {
    appearance: textfield;
    text-align: right;
  }
  .crit-input-num::-webkit-outer-spin-button,
  .crit-input-num::-webkit-inner-spin-button {
    appearance: none;
  }
  .crit-track-count {
    flex: none;
    width: 40px;
    text-align: center;
  }
  .crit-select {
    cursor: pointer;
  }
  .crit-chips {
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 2px;
    border: 1px solid var(--crit-line);
    border-radius: 7px;
    background: rgba(0, 0, 0, 0.28);
  }
  .crit-chip {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    height: 22px;
    margin: 0;
    padding: 0 5px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--crit-muted);
    font: 600 10px/1 var(--crit-sans);
    cursor: pointer;
  }
  .crit-chip:hover:not(:disabled):not(.crit-chip-on) {
    color: var(--crit-text);
  }
  .crit-chip-on {
    background: rgba(255, 255, 255, 0.1);
    color: var(--crit-text);
  }
  .crit-chip:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .crit-box4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 22px 22px 22px;
    gap: 3px;
    align-items: center;
    justify-items: center;
    width: 100%;
  }
  .crit-box4 .crit-input {
    width: 100%;
    padding: 3px 4px;
    font-size: 10.5px;
    text-align: center;
  }
  .crit-box4-t { grid-column: 2; grid-row: 1; }
  .crit-box4-l { grid-column: 1; grid-row: 2; }
  .crit-box4-r { grid-column: 3; grid-row: 2; }
  .crit-box4-b { grid-column: 2; grid-row: 3; }
  .crit-box4-mid {
    grid-column: 2;
    grid-row: 2;
    width: 10px;
    height: 10px;
    border: 1px solid var(--crit-line-strong);
    border-radius: 2px;
    opacity: 0.7;
  }
  .crit-align9 {
    display: grid;
    grid-template-columns: repeat(3, 18px);
    grid-template-rows: repeat(3, 18px);
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--crit-line);
    border-radius: 7px;
    background: rgba(0, 0, 0, 0.28);
    justify-self: start;
  }
  .crit-align9-cell {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
  }
  .crit-align9-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--crit-muted);
  }
  .crit-align9-cell:hover:not(:disabled):not(.crit-align9-on) {
    background: rgba(255, 255, 255, 0.08);
  }
  .crit-align9-on {
    background: var(--crit-accent-soft);
  }
  .crit-align9-on .crit-align9-dot {
    background: var(--crit-accent);
  }
  .crit-align9-cell:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .crit-color {
    appearance: none;
    -webkit-appearance: none;
    box-sizing: border-box;
    flex: none;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--crit-line-strong);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    overflow: hidden;
  }
  .crit-color::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  .crit-color::-webkit-color-swatch {
    border: none;
    border-radius: 5px;
  }
  .crit-color::-moz-color-swatch {
    border: none;
    border-radius: 5px;
  }
  .crit-color-swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
  }
  .crit-color-swatch::-webkit-color-swatch {
    border-radius: 50%;
  }
  .crit-color-swatch::-moz-color-swatch {
    border-radius: 50%;
  }
  .crit-color:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .crit-input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 5px 7px;
    border: 1px solid var(--crit-seam);
    border-radius: 7px;
    background: rgba(0, 0, 0, 0.3);
    box-shadow: var(--crit-well);
    color: var(--crit-text);
    font: 11.5px/1.3 var(--crit-mono);
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  .crit-input::placeholder {
    color: var(--crit-muted);
  }
  .crit-input:focus {
    outline: none;
    border-color: rgba(255, 45, 106, 0.7);
    box-shadow:
      var(--crit-well),
      0 0 0 3px var(--crit-accent-soft);
  }
  .crit-input:disabled {
    opacity: 0.45;
  }

  .crit-btn-ghost {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--crit-muted);
    font: 600 12px/1 var(--crit-sans);
    cursor: pointer;
    transition:
      background 120ms ease,
      border-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease,
      transform 60ms ease;
  }
  .crit-btn-ghost:hover:not(:disabled) {
    background: var(--crit-keycap);
    border-color: var(--crit-seam);
    box-shadow: var(--crit-raise);
    color: var(--crit-text);
  }
  .crit-btn-ghost:active:not(:disabled) {
    transform: translateY(1px);
    background: var(--crit-keycap-down);
    box-shadow: var(--crit-recess);
  }
  .crit-btn-ghost:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .crit-error {
    margin: 0;
    padding: 7px 9px;
    border-radius: 7px;
    border: 1px solid rgba(255, 143, 163, 0.3);
    background: rgba(255, 45, 106, 0.08);
    color: #ff8fa3;
    font-size: 12px;
  }

  .crit-actions {
    display: flex;
    gap: 6px;
  }

  .crit-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin: 0;
    padding: 7px 12px;
    border: 1px solid var(--crit-seam);
    border-radius: 8px;
    background: var(--crit-keycap);
    box-shadow: var(--crit-raise);
    color: var(--crit-text);
    font: 600 12.5px/1 var(--crit-sans);
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
    cursor: pointer;
    white-space: nowrap;
    transition:
      background 120ms ease,
      border-color 120ms ease,
      box-shadow 120ms ease,
      transform 60ms ease;
  }
  .crit-btn:hover:not(:disabled) {
    background: var(--crit-keycap-hover);
    box-shadow: var(--crit-raise-hover);
  }
  .crit-btn:active:not(:disabled) {
    transform: translateY(1px);
    background: var(--crit-keycap-down);
    box-shadow: var(--crit-recess);
  }
  .crit-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .crit-btn-grow {
    flex: 1;
  }
  .crit-btn-icon {
    padding: 7px 9px;
  }
  /* Primary: lacquered pink with a soft specular sweep across the top half,
     a dark seam under the lip, and a warm glow that tightens on press. */
  .crit-btn-primary {
    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.22) 0%,
        rgba(255, 255, 255, 0.06) 46%,
        rgba(255, 255, 255, 0) 52%
      ),
      linear-gradient(180deg, #ff4d80, #e5165a);
    border-color: rgba(120, 0, 40, 0.65);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.35),
      0 3px 10px rgba(255, 45, 106, 0.3);
    color: #fff;
    text-shadow: 0 1px 0 rgba(120, 0, 40, 0.45);
  }
  .crit-btn-primary:hover:not(:disabled) {
    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.28) 0%,
        rgba(255, 255, 255, 0.08) 46%,
        rgba(255, 255, 255, 0) 52%
      ),
      linear-gradient(180deg, #ff5e8c, #ee1f60);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.42),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.4),
      0 4px 14px rgba(255, 45, 106, 0.38);
  }
  .crit-btn-primary:active:not(:disabled) {
    background: linear-gradient(180deg, #d9124f, #f02a66);
    box-shadow:
      inset 0 2px 3px rgba(80, 0, 25, 0.5),
      inset 0 0 0 1px rgba(80, 0, 25, 0.25),
      0 1px 0 rgba(255, 255, 255, 0.05),
      0 2px 8px rgba(255, 45, 106, 0.25);
  }
  /* Pressed toggle: a lit key sitting in its socket. */
  .crit-btn-pressed {
    background: linear-gradient(180deg, rgba(255, 45, 106, 0.12), rgba(255, 45, 106, 0.22));
    border-color: rgba(255, 45, 106, 0.45);
    box-shadow:
      var(--crit-recess),
      inset 0 0 12px rgba(255, 45, 106, 0.18);
  }
  .crit-btn-pressed:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(255, 45, 106, 0.16), rgba(255, 45, 106, 0.26));
    border-color: rgba(255, 45, 106, 0.55);
    box-shadow:
      var(--crit-recess),
      inset 0 0 12px rgba(255, 45, 106, 0.22);
  }
  .crit-panel > .crit-btn {
    align-self: flex-start;
  }

  .crit-icon-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 26px;
    height: 26px;
    margin: 0;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--crit-muted);
    cursor: pointer;
    transition:
      background 120ms ease,
      border-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease,
      transform 60ms ease;
  }
  .crit-icon-btn:hover:not(:disabled) {
    background: var(--crit-keycap);
    border-color: var(--crit-seam);
    box-shadow: var(--crit-raise);
    color: var(--crit-text);
  }
  .crit-icon-btn:active:not(:disabled) {
    transform: translateY(1px);
    background: var(--crit-keycap-down);
    box-shadow: var(--crit-recess);
  }
  .crit-icon-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .crit-kbd {
    padding: 3px 7px;
    border: 1px solid var(--crit-seam);
    border-bottom-width: 2px;
    border-radius: 6px;
    background: var(--crit-keycap);
    box-shadow: inset 0 1px 0 var(--crit-glint);
    color: var(--crit-muted);
    font: 500 11px/1.3 var(--crit-mono);
    white-space: nowrap;
    user-select: none;
  }

  .crit-toast {
    position: fixed;
    left: 50%;
    bottom: 56px;
    transform: translateX(-50%);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px 9px 10px;
    border-radius: 999px;
    font-weight: 600;
    pointer-events: none;
    animation: crit-rise 200ms cubic-bezier(0.32, 0.72, 0, 1);
  }
  .crit-toast-check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 28%,
      rgba(255, 45, 106, 0.32),
      rgba(255, 45, 106, 0.14) 60%
    );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      inset 0 -1px 1px rgba(0, 0, 0, 0.3);
    color: var(--crit-accent);
  }

  /* The dock sits flush against one viewport edge, centred along it.
     Centring uses the translate property so transform stays free for the
     drag offset and the FLIP glide back to an edge. */
  .crit-dock {
    position: fixed;
    z-index: 2147483646;
    pointer-events: auto;
    transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
  }
  .crit-dock[data-edge="bottom"] {
    left: 50%;
    bottom: 0;
    translate: -50% 0;
  }
  .crit-dock[data-edge="top"] {
    left: 50%;
    top: 0;
    translate: -50% 0;
  }
  .crit-dock[data-edge="left"] {
    left: 0;
    top: 50%;
    translate: 0 -50%;
  }
  .crit-dock[data-edge="right"] {
    right: 0;
    top: 50%;
    translate: 0 -50%;
  }
  .crit-dock[data-dragging] {
    cursor: grabbing;
    z-index: 2147483647;
  }
  .crit-dock[data-dragging] .crit-dock-shell {
    scale: 1.04;
    box-shadow:
      inset 0 1px 0 var(--crit-glint-strong),
      0 18px 48px rgba(0, 0, 0, 0.55),
      0 4px 12px rgba(0, 0, 0, 0.35);
  }

  /* Snap preview: a hairline of accent light along the edge the dock will
     land on when released. */
  .crit-dock-snap {
    position: fixed;
    z-index: 2147483645;
    pointer-events: none;
    background: var(--crit-accent);
    box-shadow:
      0 0 12px rgba(255, 45, 106, 0.7),
      0 0 32px rgba(255, 45, 106, 0.35);
    border-radius: 999px;
    animation: crit-snap-in 160ms ease-out;
  }
  .crit-dock-snap[data-edge="bottom"],
  .crit-dock-snap[data-edge="top"] {
    left: 50%;
    translate: -50% 0;
    width: 200px;
    height: 3px;
  }
  .crit-dock-snap[data-edge="bottom"] { bottom: 0; }
  .crit-dock-snap[data-edge="top"] { top: 0; }
  .crit-dock-snap[data-edge="left"],
  .crit-dock-snap[data-edge="right"] {
    top: 50%;
    translate: 0 -50%;
    width: 3px;
    height: 200px;
  }
  .crit-dock-snap[data-edge="left"] { left: 0; }
  .crit-dock-snap[data-edge="right"] { right: 0; }

  /* Grip: six machined dots. Rotates with the bar on vertical edges. */
  .crit-dock-grip {
    flex: none;
    width: 10px;
    height: 16px;
    border-radius: 3px;
    background-image: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.28) 0.9px,
      rgba(255, 255, 255, 0) 1.1px
    );
    background-size: 5px 5px;
    background-position: 0 0.5px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
    cursor: grab;
    touch-action: none;
    transition: background-image 120ms ease;
  }
  .crit-dock-grip:hover {
    background-image: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.5) 0.9px,
      rgba(255, 255, 255, 0) 1.1px
    );
  }
  .crit-dock[data-dragging] .crit-dock-grip {
    cursor: grabbing;
  }
  .crit-dock[data-edge="left"] .crit-dock-grip,
  .crit-dock[data-edge="right"] .crit-dock-grip {
    width: 16px;
    height: 10px;
    background-position: 0.5px 0;
  }

  .crit-settings {
    position: absolute;
    right: 0;
    bottom: calc(100% + 8px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 168px;
    padding: 10px;
    border-radius: 12px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) 38%),
      var(--crit-bg);
    -webkit-backdrop-filter: blur(14px) saturate(1.5);
    backdrop-filter: blur(14px) saturate(1.5);
    border: 1px solid var(--crit-line);
    box-shadow:
      inset 0 1px 0 var(--crit-glint),
      inset 0 -1px 0 rgba(0, 0, 0, 0.25),
      0 16px 40px rgba(0, 0, 0, 0.45);
    color: var(--crit-text);
  }
  .crit-settings-h {
    margin: 0;
    color: var(--crit-muted);
    font: 600 11px/1 var(--crit-sans);
  }
  .crit-settings-key {
    appearance: none;
    margin: 0;
    padding: 7px 10px;
    border: 1px dashed var(--crit-line-strong);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    box-shadow: var(--crit-well);
    color: var(--crit-text);
    font: 600 12px/1.3 var(--crit-mono);
    text-align: center;
    cursor: pointer;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  .crit-settings-key-live {
    border-color: var(--crit-accent);
    color: var(--crit-accent);
    box-shadow:
      var(--crit-well),
      inset 0 0 10px rgba(255, 45, 106, 0.16);
  }
  /* One glass shell holds both dock layers. Its inline width/height are
     measured from the active layer, so opening and closing morphs the same
     surface instead of swapping two elements. */
  .crit-dock-shell {
    --crit-dock-r: 10px;
    --crit-dock-shadow: 0 -8px 28px rgba(0, 0, 0, 0.4);
    position: relative;
    box-sizing: content-box;
    overflow: hidden;
    box-shadow:
      inset 0 1px 0 var(--crit-glint-strong),
      var(--crit-dock-shadow);
    animation: crit-dock-rise 180ms cubic-bezier(0.32, 0.72, 0, 1);
    transition:
      width 260ms cubic-bezier(0.32, 0.72, 0, 1),
      height 260ms cubic-bezier(0.32, 0.72, 0, 1),
      border-radius 260ms cubic-bezier(0.32, 0.72, 0, 1),
      background 120ms ease,
      box-shadow 120ms ease,
      scale 160ms ease;
  }
  .crit-dock-shell[data-open] {
    --crit-dock-r: 12px;
  }
  /* The side touching the viewport edge is squared off and borderless so the
     shell reads as a tab growing out of the chrome. */
  .crit-dock[data-edge="bottom"] .crit-dock-shell {
    border-radius: var(--crit-dock-r) var(--crit-dock-r) 0 0;
    border-bottom: none;
  }
  .crit-dock[data-edge="top"] .crit-dock-shell {
    --crit-dock-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
    border-radius: 0 0 var(--crit-dock-r) var(--crit-dock-r);
    border-top: none;
  }
  .crit-dock[data-edge="left"] .crit-dock-shell {
    --crit-dock-shadow: 8px 0 28px rgba(0, 0, 0, 0.4);
    border-radius: 0 var(--crit-dock-r) var(--crit-dock-r) 0;
    border-left: none;
  }
  .crit-dock[data-edge="right"] .crit-dock-shell {
    --crit-dock-shadow: -8px 0 28px rgba(0, 0, 0, 0.4);
    border-radius: var(--crit-dock-r) 0 0 var(--crit-dock-r);
    border-right: none;
  }
  .crit-dock-shell:has(.crit-dock-pill[data-active]:hover) {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 60%),
      rgba(30, 27, 35, 0.92);
  }
  .crit-dock-shell:has(.crit-dock-pill[data-active]:active) {
    box-shadow:
      inset 0 2px 3px rgba(0, 0, 0, 0.4),
      var(--crit-dock-shadow);
  }

  /* Dock layers: centred in the shell so both grow from the same point
     whichever edge the dock is on. The inactive one fades and shrinks a
     touch, then becomes unfocusable via visibility once the fade finishes. */
  .crit-dock-bar,
  .crit-dock-pill {
    position: absolute;
    inset: 0;
    margin: auto;
    width: max-content;
    height: max-content;
    opacity: 0;
    visibility: hidden;
    transform: scale(0.96);
    transition:
      opacity 140ms ease,
      transform 200ms cubic-bezier(0.32, 0.72, 0, 1),
      visibility 0s linear 140ms;
  }
  .crit-dock-bar[data-active],
  .crit-dock-pill[data-active] {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
    transition:
      opacity 160ms ease 80ms,
      transform 220ms cubic-bezier(0.32, 0.72, 0, 1) 60ms,
      visibility 0s;
  }

  .crit-dock-pill {
    appearance: none;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px 8px;
    border: 0;
    background: transparent;
    color: var(--crit-text);
    font: 600 12px/1 var(--crit-sans);
    letter-spacing: 0.03em;
    cursor: pointer;
    touch-action: none;
  }
  .crit-dock-pill svg {
    color: var(--crit-accent);
  }
  .crit-dock-pill-chevron {
    display: inline-flex;
    color: var(--crit-muted);
    transition: rotate 200ms ease;
  }
  .crit-dock-pill-chevron svg {
    color: inherit;
  }
  .crit-dock-collapse svg {
    transition: rotate 200ms ease;
  }
  /* Chevrons follow the edge: the pill's points away from it (expand), the
     collapse button's points into it. */
  .crit-dock[data-edge="top"] .crit-dock-pill-chevron,
  .crit-dock[data-edge="top"] .crit-dock-collapse svg {
    rotate: 180deg;
  }
  .crit-dock[data-edge="left"] .crit-dock-pill-chevron,
  .crit-dock[data-edge="left"] .crit-dock-collapse svg {
    rotate: 90deg;
  }
  .crit-dock[data-edge="right"] .crit-dock-pill-chevron,
  .crit-dock[data-edge="right"] .crit-dock-collapse svg {
    rotate: -90deg;
  }
  .crit-dock-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 8px 9px;
  }
  /* On the side edges the bar stands upright. */
  .crit-dock[data-edge="left"] .crit-dock-bar,
  .crit-dock[data-edge="right"] .crit-dock-bar,
  .crit-dock[data-edge="left"] .crit-dock-pill,
  .crit-dock[data-edge="right"] .crit-dock-pill {
    flex-direction: column;
  }
  .crit-dock[data-edge="left"] .crit-dock-pill,
  .crit-dock[data-edge="right"] .crit-dock-pill {
    padding: 13px 8px;
  }
  .crit-dock[data-edge="top"] .crit-dock-pill {
    padding: 8px 13px 7px;
  }
  .crit-dock[data-edge="top"] .crit-dock-bar {
    padding: 9px 8px 8px;
  }
  .crit-dock[data-edge="left"] .crit-dock-bar {
    padding: 8px 9px 8px 8px;
  }
  .crit-dock[data-edge="right"] .crit-dock-bar {
    padding: 8px 8px 8px 9px;
  }
  .crit-dock-brand {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font: 700 12px/1 var(--crit-sans);
    letter-spacing: 0.04em;
    color: var(--crit-text);
    user-select: none;
  }
  .crit-dock-brand svg {
    color: var(--crit-accent);
  }
  /* Etched groove: a dark cut with light catching its right wall. */
  .crit-dock-sep {
    flex: none;
    width: 1px;
    height: 16px;
    background: var(--crit-seam);
    box-shadow: 1px 0 0 rgba(255, 255, 255, 0.09);
  }
  .crit-dock[data-edge="left"] .crit-dock-sep,
  .crit-dock[data-edge="right"] .crit-dock-sep {
    width: 16px;
    height: 1px;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.09);
  }
  .crit-dock-error {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8px);
    translate: -50% 0;
    width: max-content;
    max-width: 280px;
  }
  /* Popovers (settings, error) open away from the docked edge. */
  .crit-dock[data-edge="top"] .crit-settings,
  .crit-dock[data-edge="top"] .crit-dock-error {
    bottom: auto;
    top: calc(100% + 8px);
  }
  .crit-dock[data-edge="left"] .crit-settings,
  .crit-dock[data-edge="left"] .crit-dock-error {
    right: auto;
    bottom: 0;
    left: calc(100% + 8px);
    translate: 0 0;
  }
  .crit-dock[data-edge="right"] .crit-settings,
  .crit-dock[data-edge="right"] .crit-dock-error {
    left: auto;
    bottom: 0;
    right: calc(100% + 8px);
    translate: 0 0;
  }

  .crit-tool-wrap {
    position: relative;
    display: inline-flex;
  }
  .crit-tool-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    border-radius: 999px;
    background: radial-gradient(circle at 35% 28%, #ff7aa3, var(--crit-accent) 60%, #d8104b);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.5);
    color: #fff;
    font: 700 9px/14px var(--crit-mono);
    text-align: center;
    text-shadow: 0 1px 0 rgba(120, 0, 40, 0.5);
    pointer-events: none;
  }

  .crit-pin {
    appearance: none;
    position: fixed;
    z-index: 2147483646;
    width: 24px;
    height: 34px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    pointer-events: auto;
    cursor: pointer;
    transform: translate(-50%, -100%);
  }
  .crit-pin-mark {
    position: relative;
    display: block;
    width: 24px;
    height: 34px;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
    animation: crit-pin-in 180ms cubic-bezier(0.32, 0.72, 0, 1);
    transition: filter 120ms ease, transform 120ms ease;
  }
  .crit-pin-dot {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    margin: 0 auto;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 28%, #ff85ab, var(--crit-accent) 58%, #d3104a);
    color: #fff;
    font: 700 11px/1 var(--crit-sans);
    text-shadow: 0 1px 0 rgba(120, 0, 40, 0.5);
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.18),
      inset 0 1px 1px rgba(255, 255, 255, 0.4),
      inset 0 -2px 3px rgba(90, 0, 30, 0.35);
  }
  .crit-pin-tip {
    position: absolute;
    left: 50%;
    top: 16px;
    z-index: 0;
    width: 12px;
    height: 12px;
    margin: 0;
    background: linear-gradient(135deg, var(--crit-accent), #c60f45);
    transform: translateX(-50%) rotate(45deg);
    border-radius: 1px 1px 2px 1px;
  }
  .crit-pin:hover .crit-pin-mark {
    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.45));
    transform: translateY(-1px);
  }
  .crit-pin:active .crit-pin-mark {
    transform: translateY(0);
  }
  .crit-pin-ghost {
    display: none;
    position: fixed;
    z-index: 2147483646;
    width: 24px;
    height: 34px;
    pointer-events: none;
    transform: translate(-50%, -100%);
  }
  .crit-pin-ghost .crit-pin-mark {
    opacity: 0.45;
    filter: none;
    animation: none;
  }
  .crit-pin-composer .crit-textarea {
    min-height: 56px;
  }
  .crit-pin-pop {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    max-width: 260px;
    pointer-events: none;
  }
  .crit-pin-pop-text {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .crit-pin-callout {
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: max-content;
    max-width: 280px;
    padding: 10px 12px;
    border-radius: 10px;
    pointer-events: none;
  }
  .crit-pin-callout-n {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-top: 1px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 28%, #ff7aa3, var(--crit-accent) 60%, #d8104b);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 2px rgba(90, 0, 30, 0.35);
    color: #fff;
    font: 700 10px/1 var(--crit-sans);
    text-shadow: 0 1px 0 rgba(120, 0, 40, 0.5);
  }
  .crit-pin-callout-t {
    margin: 0;
    flex: 0 1 auto;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
    font: 13px/1.45 var(--crit-sans);
  }

  .crit-step:focus-within {
    border-color: var(--crit-accent);
    box-shadow: 0 0 0 3px var(--crit-accent-soft);
  }
  .crit-btn:focus-visible,
  .crit-icon-btn:focus-visible,
  .crit-seg-btn:focus-visible,
  .crit-btn-ghost:focus-visible,
  .crit-settings-key:focus-visible,
  .crit-align-btn:focus-visible,
  .crit-fig-unit:focus-visible,
  .crit-fig-range:focus-visible,
  .crit-color:focus-visible,
  .crit-chip:focus-visible,
  .crit-align9-cell:focus-visible,
  .crit-unit:focus-visible,
  .crit-pin:focus-visible,
  .crit-dock-shell:has(.crit-dock-pill:focus-visible) {
    outline: 2px solid var(--crit-accent);
    outline-offset: 2px;
  }
  .crit-dock-pill:focus-visible {
    outline: none;
  }

  @keyframes crit-rise {
    from {
      transform: translateX(-50%) translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  @keyframes crit-dock-rise {
    from {
      scale: 0.94;
      opacity: 0;
    }
    to {
      scale: 1;
      opacity: 1;
    }
  }
  @keyframes crit-snap-in {
    from {
      opacity: 0;
      scale: 0.6;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
  @keyframes crit-pop {
    from {
      transform: scale(0.98) translateY(3px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }
  @keyframes crit-pin-in {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .crit-panel,
    .crit-toast,
    .crit-dock-shell,
    .crit-dock-snap,
    .crit-pin-mark {
      animation: none;
    }
    .crit-btn,
    .crit-icon-btn,
    .crit-btn-ghost,
    .crit-textarea,
    .crit-input,
    .crit-dock,
    .crit-dock-shell,
    .crit-dock-bar,
    .crit-dock-pill-chevron,
    .crit-dock-collapse svg,
    .crit-dock-pill,
    .crit-dock-bar[data-active],
    .crit-dock-pill[data-active],
    .crit-chip,
    .crit-align9-cell,
    .crit-settings-key,
    .crit-pin-mark {
      transition: none;
    }
  }
`;
