const STORAGE_KEY = "crit-shortcut";
const IS_MAC = navigator.platform.startsWith("Mac");

export type ToggleShortcut = {
  code: string;
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
};

export function defaultToggleShortcut(): ToggleShortcut {
  return {
    code: "Period",
    key: ".",
    shiftKey: true,
    altKey: false,
    metaKey: IS_MAC,
    ctrlKey: !IS_MAC,
  };
}

function isToggleShortcut(value: unknown): value is ToggleShortcut {
  if (typeof value !== "object" || value === null) return false;
  if (!("code" in value) || !("key" in value)) return false;
  if (!("shiftKey" in value) || !("altKey" in value)) return false;
  if (!("metaKey" in value) || !("ctrlKey" in value)) return false;
  return (
    typeof value.code === "string" &&
    typeof value.key === "string" &&
    typeof value.shiftKey === "boolean" &&
    typeof value.altKey === "boolean" &&
    typeof value.metaKey === "boolean" &&
    typeof value.ctrlKey === "boolean"
  );
}

export function readToggleShortcut(): ToggleShortcut {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return defaultToggleShortcut();
    const parsed: unknown = JSON.parse(raw);
    if (!isToggleShortcut(parsed)) return defaultToggleShortcut();
    return parsed;
  } catch {
    return defaultToggleShortcut();
  }
}

export function writeToggleShortcut(shortcut: ToggleShortcut): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcut));
  } catch {
    // private mode / quota
  }
}

export function shortcutFromEvent(event: KeyboardEvent): ToggleShortcut {
  return {
    code: event.code,
    key: event.key,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
  };
}

export function isModifierOnly(event: KeyboardEvent): boolean {
  return (
    event.key === "Meta" ||
    event.key === "Control" ||
    event.key === "Alt" ||
    event.key === "Shift"
  );
}

export function canRecordShortcut(event: KeyboardEvent): boolean {
  if (isModifierOnly(event)) return false;
  return event.metaKey || event.ctrlKey || event.altKey;
}

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ToggleShortcut,
): boolean {
  return (
    event.code === shortcut.code &&
    event.shiftKey === shortcut.shiftKey &&
    event.altKey === shortcut.altKey &&
    event.metaKey === shortcut.metaKey &&
    event.ctrlKey === shortcut.ctrlKey
  );
}

function displayKey(shortcut: ToggleShortcut): string {
  if (shortcut.code === "Period") return ".";
  if (shortcut.code === "Comma") return ",";
  if (shortcut.code === "Slash") return "/";
  if (shortcut.code.startsWith("Key") && shortcut.code.length === 4) {
    return shortcut.code.slice(3);
  }
  if (shortcut.code.startsWith("Digit") && shortcut.code.length === 6) {
    return shortcut.code.slice(5);
  }
  if (shortcut.key.length === 1) return shortcut.key.toUpperCase();
  return shortcut.key;
}

export function formatShortcut(shortcut: ToggleShortcut): string {
  if (IS_MAC) {
    let out = "";
    if (shortcut.ctrlKey) out += "⌃";
    if (shortcut.altKey) out += "⌥";
    if (shortcut.shiftKey) out += "⇧";
    if (shortcut.metaKey) out += "⌘";
    return `${out}${displayKey(shortcut)}`;
  }
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.shiftKey) parts.push("Shift");
  if (shortcut.metaKey) parts.push("Meta");
  parts.push(displayKey(shortcut));
  return parts.join("+");
}
