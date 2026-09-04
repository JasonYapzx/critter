const MIN_USABLE_NAME_LENGTH = 3;

function isFiberLike(value: unknown): value is { type: unknown; return: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "return" in value
  );
}

function readOptionalString(obj: object, key: string): string | null {
  if (!(key in obj)) return null;
  const value: unknown = Reflect.get(obj, key);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isUsableName(name: string): boolean {
  return name.length >= MIN_USABLE_NAME_LENGTH;
}

function nameFromType(type: unknown, depth = 0): string | null {
  if (depth > 8 || type == null) return null;

  if (typeof type === "string") {
    return null;
  }

  if (typeof type === "function") {
    const displayName = readOptionalString(type, "displayName");
    const name = type.name;
    const label = displayName ?? (name.length > 0 ? name : null);
    if (label && isUsableName(label)) return label;
    return null;
  }

  if (typeof type === "object") {
    const displayName = readOptionalString(type, "displayName");
    if (displayName && isUsableName(displayName)) return displayName;
    if ("render" in type) {
      const fromRender = nameFromType(Reflect.get(type, "render"), depth + 1);
      if (fromRender) return fromRender;
    }
    if ("type" in type) {
      return nameFromType(Reflect.get(type, "type"), depth + 1);
    }
  }

  return null;
}

function getFiberFromNode(node: Element): unknown {
  const key = Reflect.ownKeys(node).find((candidate) => {
    return typeof candidate === "string" && candidate.startsWith("__reactFiber$");
  });
  if (typeof key !== "string") return null;
  return Reflect.get(node, key);
}

export function getComponentStack(node: Element): string[] {
  try {
    const fiber = getFiberFromNode(node);
    if (!isFiberLike(fiber)) return [];

    const names: string[] = [];
    let current: unknown = fiber;
    while (isFiberLike(current)) {
      const name = nameFromType(current.type);
      if (name) names.push(name);
      current = current.return;
    }
    return names;
  } catch {
    return [];
  }
}
