export type Copied =
  | { kind: "image"; url: string }
  | { kind: "text"; text: string };

// The paste panel is supposed to be a paste target, so it reads what crit
// actually wrote rather than rebuilding it. Every copy button goes through
// navigator.clipboard.write, so wrapping that one call catches all of them.
export function watchClipboard(onCopy: (copied: Copied) => void): () => void {
  const clipboard = navigator.clipboard;
  if (!clipboard || typeof clipboard.write !== "function") return () => {};

  const original = clipboard.write.bind(clipboard);
  const patched = (items: ClipboardItem[]): Promise<void> => {
    // Pass the write straight through: it has to start inside the click's
    // user activation or the browser rejects the copy. Only read the item
    // back once the write has actually succeeded.
    const done = original(items);
    void done.then(
      () => report(items, onCopy),
      () => {},
    );
    return done;
  };

  clipboard.write = patched;
  return () => {
    if (clipboard.write === patched) clipboard.write = original;
  };
}

async function report(
  items: ClipboardItem[],
  onCopy: (copied: Copied) => void,
): Promise<void> {
  for (const item of items) {
    if (item.types.includes("image/png")) {
      const blob = await item.getType("image/png");
      onCopy({ kind: "image", url: URL.createObjectURL(blob) });
      return;
    }
    if (item.types.includes("text/plain")) {
      const blob = await item.getType("text/plain");
      onCopy({ kind: "text", text: await blob.text() });
      return;
    }
  }
}
