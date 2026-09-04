import { createRoot } from "react-dom/client";
import { TOGGLE_EVENT } from "./overlay/constants";
import { CritOverlay } from "./overlay/CritOverlay";

const ROOT_ID = "crit-root";

function createRootEl(): HTMLElement {
  const el = document.createElement("div");
  el.id = ROOT_ID;
  el.setAttribute("data-crit-ignore", "");
  // Host modals trap focus and yank it back when it lands outside the
  // dialog, which makes the comment box untypeable. react-focus-lock
  // (Chakra) honours this attribute; for traps that watch focusin on
  // document (Radix, Headless UI, MUI) we stop the event at our root.
  el.setAttribute("data-no-focus-lock", "");
  el.addEventListener("focusin", (event) => {
    event.stopPropagation();
  });
  document.body.appendChild(el);
  return el;
}

// The IIFE is built with name "Crit", so the exports here land on
// window.Crit. The browser extension injects crit.js on every toolbar click
// and then calls window.Crit.toggle(). The root element in the DOM, not
// module state, is the "already mounted" signal, because a second injection
// gets a fresh copy of this module.
//
// The overlay attaches its window listeners in an effect, so a toggle()
// requested before onReady fires is buffered and replayed.
let mountedHere = false;
let overlayReady = false;
let toggleRequested = false;

function dispatchToggle(): void {
  window.dispatchEvent(new Event(TOGGLE_EVENT));
}

function onOverlayReady(): void {
  overlayReady = true;
  if (toggleRequested) {
    toggleRequested = false;
    dispatchToggle();
  }
}

function mount(): void {
  if (document.getElementById(ROOT_ID)) return;

  mountedHere = true;
  const el = createRootEl();
  const root = createRoot(el);
  root.render(<CritOverlay onReady={onOverlayReady} />);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      root.unmount();
      el.remove();
      mountedHere = false;
      overlayReady = false;
    });
  }
}

// Same as pressing the keyboard shortcut: idle -> picking, anything else -> idle.
export function toggle(): void {
  if (mountedHere && !overlayReady) {
    // Our overlay is rendering; replay once its listeners are attached.
    toggleRequested = true;
    return;
  }
  if (!mountedHere && !document.getElementById(ROOT_ID)) {
    toggleRequested = true;
    mount();
    return;
  }
  // Either our overlay is ready or an earlier injection owns the root.
  dispatchToggle();
}

if (document.body) {
  mount();
} else {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
}
