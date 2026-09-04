export const STROKE_COLOR = "#ff2d6a";
export const STROKE_WIDTH = 3;
export const TOAST_MS = 2500;
export const DRAWER_STORAGE_KEY = "crit-drawer";
export const DOCK_EDGE_STORAGE_KEY = "crit-dock-edge";
export const DOCK_DRAG_THRESHOLD = 5;
export const EDIT_SIDEBAR_ENABLED: boolean = false;
// window event that toggles idle <-> picking, same as the keyboard shortcut.
export const TOGGLE_EVENT = "crit:toggle";
// Host opt-in: put this on an element and the dock docks to that box instead
// of the viewport. Absent, which is the normal case, the dock uses the viewport.
export const BOUNDS_ATTR = "data-crit-bounds";
// Host opt-in: fences picking and pinning to one box. Outside it the pointer
// belongs to the page again. Absent, the whole document is fair game.
export const SCOPE_ATTR = "data-crit-scope";
