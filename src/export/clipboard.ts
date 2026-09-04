import type { BoardPin } from "../pins/pins";

const OUTER_HTML_LIMIT = 1500;
const EDIT_TEXT_LIMIT = 200;

export type CritTextEdit = { from: string; to: string };
export type CritCssEdit = { property: string; from: string; to: string };
export type CritEdits = {
  text: CritTextEdit | null;
  css: CritCssEdit[];
};

export type CritContext = {
  url: string;
  viewport: string;
  selector: string;
  components: string[];
  outerHtml: string;
  edits?: CritEdits;
};

function childIndex(element: Element): number {
  const parent = element.parentElement;
  if (!parent) return 1;
  const children = parent.children;
  for (let i = 0; i < children.length; i++) {
    if (children[i] === element) return i + 1;
  }
  return 1;
}

export function cssSelectorPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }
    const tag = current.tagName.toLowerCase();
    parts.unshift(`${tag}:nth-child(${childIndex(current)})`);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

export function buildCritContext(element: Element, components: string[]): CritContext {
  const rawOuter = element.outerHTML;
  const outerHtml =
    rawOuter.length > OUTER_HTML_LIMIT
      ? `${rawOuter.slice(0, OUTER_HTML_LIMIT)}…`
      : rawOuter;

  return {
    url: window.location.href,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    selector: cssSelectorPath(element),
    components,
    outerHtml,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateEditText(value: string, limit = EDIT_TEXT_LIMIT): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
}

function hasEdits(edits: CritEdits | undefined): edits is CritEdits {
  return edits != null && (edits.text !== null || edits.css.length > 0);
}

function suggestedChangesPlain(edits: CritEdits): string[] {
  const lines: string[] = [];
  if (edits.text) {
    const from = truncateEditText(edits.text.from);
    const to = truncateEditText(edits.text.to);
    lines.push(`- suggested text: "${from}" -> "${to}"`);
  }
  if (edits.css.length > 0) {
    const css = edits.css
      .map((change) => `${change.property}: ${change.from} -> ${change.to}`)
      .join("; ");
    lines.push(`- suggested css: ${css}`);
  }
  return lines;
}

function suggestedChangesHtml(edits: CritEdits): string {
  const parts: string[] = ["<p>suggested changes</p>"];
  if (edits.text) {
    const from = truncateEditText(edits.text.from);
    const to = truncateEditText(edits.text.to);
    parts.push(`<p><s>${escapeHtml(from)}</s> ${escapeHtml(to)}</p>`);
  }
  if (edits.css.length > 0) {
    const css = edits.css
      .map((change) => `${change.property}: ${change.from} -> ${change.to}`)
      .join("\n");
    parts.push(`<pre>${escapeHtml(css)}</pre>`);
  }
  return `${parts.join("\n")}\n`;
}

function componentLine(components: string[]): string {
  if (components.length === 0) return "(none)";
  return components.join(" < ");
}

export function buildPlainFlavor(input: {
  comment: string;
  context: CritContext;
  pinLines?: string[];
}): string {
  const lines: string[] = [];
  const trimmed = input.comment.trim();
  if (trimmed.length > 0) {
    for (const line of trimmed.split("\n")) {
      lines.push(`> ${line}`);
    }
    lines.push("");
  }
  lines.push(`- url: ${input.context.url}`);
  lines.push(`- selector: ${input.context.selector}`);
  lines.push(`- components: ${componentLine(input.context.components)}`);
  if (hasEdits(input.context.edits)) {
    lines.push(...suggestedChangesPlain(input.context.edits));
  }
  if (input.pinLines && input.pinLines.length > 0) {
    lines.push("");
    lines.push(...input.pinLines);
  }
  return lines.join("\n");
}

export function buildHtmlFlavor(input: {
  pngDataUrl?: string;
  comment: string;
  context: CritContext;
  pinLines?: string[];
}): string {
  const trimmed = input.comment.trim();
  const commentBlock =
    trimmed.length > 0 ? `<p>${escapeHtml(trimmed)}</p>\n` : "";
  const contextText = [
    `url: ${input.context.url}`,
    `viewport: ${input.context.viewport}`,
    `selector: ${input.context.selector}`,
    `components: ${componentLine(input.context.components)}`,
    `outerHTML: ${input.context.outerHtml}`,
  ].join("\n");

  const editsBlock = hasEdits(input.context.edits)
    ? suggestedChangesHtml(input.context.edits)
    : "";
  const imgLine =
    input.pngDataUrl !== undefined
      ? `<img src="${input.pngDataUrl}" />\n`
      : "";
  const pinBlock =
    input.pinLines && input.pinLines.length > 0
      ? `\n${input.pinLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n")}`
      : "";
  return `${imgLine}${commentBlock}${editsBlock}<pre>${escapeHtml(contextText)}</pre>${pinBlock}`;
}

function requireClipboard(): Clipboard {
  if (!navigator.clipboard || typeof navigator.clipboard.write !== "function") {
    throw new Error("Clipboard API unavailable (needs a secure context)");
  }
  return navigator.clipboard;
}

// copyImageOnly takes the capture as a *promise* and calls clipboard.write
// synchronously with a promise-valued ClipboardItem entry. The write must
// start inside the click's user activation; awaiting the capture first is
// what makes image copies fail intermittently.
export function copyText(input: {
  comment: string;
  context: CritContext;
  pinLines?: string[];
}): Promise<void> {
  const clipboard = requireClipboard();
  const html = new Blob(
    [
      buildHtmlFlavor({
        comment: input.comment,
        context: input.context,
        pinLines: input.pinLines,
      }),
    ],
    { type: "text/html" },
  );
  const plain = new Blob(
    [
      buildPlainFlavor({
        comment: input.comment,
        context: input.context,
        pinLines: input.pinLines,
      }),
    ],
    { type: "text/plain" },
  );
  return clipboard.write([
    new ClipboardItem({
      "text/html": html,
      "text/plain": plain,
    }),
  ]);
}

export function copyImageOnly(png: Promise<Blob>): Promise<void> {
  const clipboard = requireClipboard();
  return clipboard.write([new ClipboardItem({ "image/png": png })]);
}

export function buildBoardPlain(input: {
  pins: BoardPin[];
  url: string;
  viewport: string;
}): string {
  const blocks = input.pins.map((pin) => {
    const off = pin.offScreen ? " (off-screen)" : "";
    const component = pin.componentName ?? "(none)";
    return `${pin.number}. ${pin.comment}${off}\n   ${pin.selector}\n   ${component}`;
  });
  return `${blocks.join("\n\n")}\n\nurl: ${input.url}\nviewport: ${input.viewport}`;
}

export function buildBoardHtml(input: {
  pins: BoardPin[];
  url: string;
  viewport: string;
}): string {
  const items = input.pins
    .map((pin) => {
      const off = pin.offScreen ? " (off-screen)" : "";
      const component = pin.componentName ?? "(none)";
      return `<p>${escapeHtml(`${pin.number}. ${pin.comment}${off}`)}</p>\n<p>${escapeHtml(pin.selector)}</p>\n<p>${escapeHtml(component)}</p>`;
    })
    .join("\n");
  const meta = `url: ${input.url}\nviewport: ${input.viewport}`;
  return `${items}\n<pre>${escapeHtml(meta)}</pre>`;
}

export function copyBoardText(input: {
  pins: BoardPin[];
  url: string;
  viewport: string;
}): Promise<void> {
  const clipboard = requireClipboard();
  const html = new Blob([buildBoardHtml(input)], { type: "text/html" });
  const plain = new Blob([buildBoardPlain(input)], { type: "text/plain" });
  return clipboard.write([
    new ClipboardItem({
      "text/html": html,
      "text/plain": plain,
    }),
  ]);
}
