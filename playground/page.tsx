import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { watchClipboard } from "./clipboard";
import { releaseOverlay, runDemo, type DemoPhase } from "./demo";
import { buildPreview } from "./preview";

// The demo builds both flavors so you can compare them. A real copy only ever
// puts one on the clipboard, so the other side is empty.
type Preview = { imageUrl: string | null; text: string | null };

const PHASE_LABEL: Record<DemoPhase, string> = {
  point: "Hover to find the element",
  pin: "Click to pin it",
  draw: "Drag to draw on it",
  write: "Say what is wrong",
  copy: "Copy it out",
};

function GitHubMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
      />
    </svg>
  );
}
GitHubMark.displayName = "GitHubMark";

function Keys({ combo }: { combo: string[] }) {
  return (
    <span className="keys">
      {combo.map((key) => (
        <kbd key={key}>{key}</kbd>
      ))}
    </span>
  );
}
Keys.displayName = "Keys";

function WindowChrome({ title }: { title: string }) {
  return (
    <div className="chrome" data-crit-ignore="">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
      <span className="chrome-title">{title}</span>
    </div>
  );
}
WindowChrome.displayName = "WindowChrome";

function CardMeta() {
  return (
    <div className="meta">
      <span>06:30 – 21:30</span>
      <span aria-hidden="true">·</span>
      <span>12 lanes open</span>
    </div>
  );
}
CardMeta.displayName = "CardMeta";

function FacilityCard() {
  return (
    <article className="card" id="lap-pool">
      <img src="/facility.svg" alt="Lap pool from above" width={640} height={400} />
      <div className="card-body">
        <p className="kind">Swimming</p>
        <h2>East Coast lap pool</h2>
        <CardMeta />
        <div className="card-actions">
          <button type="button" className="book">
            Book
          </button>
          <button type="button" className="ghost">
            Details
          </button>
        </div>
      </div>
    </article>
  );
}
FacilityCard.displayName = "FacilityCard";

function PastePanel({
  preview,
  flavor,
  onFlavor,
}: {
  preview: Preview | null;
  flavor: "image" | "text";
  onFlavor: (next: "image" | "text") => void;
}) {
  const shown = flavor === "image" ? preview?.imageUrl : preview?.text;
  return (
    <div className="paste" data-crit-ignore="">
      <div className="tabs" data-demo-controls="">
        <button
          type="button"
          className={flavor === "image" ? "tab on" : "tab"}
          onClick={() => onFlavor("image")}
        >
          Image
        </button>
        <button
          type="button"
          className={flavor === "text" ? "tab on" : "tab"}
          onClick={() => onFlavor("text")}
        >
          Text
        </button>
      </div>
      <div className="paste-body">
        {!shown ? (
          <p className="empty">
            {preview === null
              ? "Nothing copied yet."
              : `No ${flavor} on the clipboard.`}
          </p>
        ) : flavor === "image" ? (
          <img className="shot" src={shown} alt="Copied crit" />
        ) : (
          <pre className="crit-text">{shown}</pre>
        )}
      </div>
      <p className="paste-foot">
        {flavor === "image"
          ? "image/png, comment and url baked into the caption bar"
          : "text/html and text/plain, no image"}
      </p>
    </div>
  );
}
PastePanel.displayName = "PastePanel";

function PlaygroundPage() {
  const [phase, setPhase] = useState<DemoPhase | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [flavor, setFlavor] = useState<"image" | "text">("image");
  const [running, setRunning] = useState(false);

  const appRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }, []);

  // One owner for the shown preview, so the previous object URL is always
  // revoked no matter whether the demo or a real copy replaced it.
  const showPreview = useCallback(
    (next: Preview) => {
      releasePreview();
      previewUrlRef.current = next.imageUrl;
      setPreview(next);
    },
    [releasePreview],
  );

  const stop = useCallback((release = true) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
    setPhase(null);
    if (release) void releaseOverlay();
  }, []);

  const start = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);

    void runDemo(
      {
        target: () => appRef.current?.querySelector<HTMLElement>(".book") ?? null,
        onPhase: setPhase,
        onClear: () => {
          releasePreview();
          setPreview(null);
          setFlavor("image");
        },
        onFlavor: setFlavor,
        onResult: async (comment, drawing) => {
          const frame = appRef.current;
          const subject = frame?.querySelector(".book");
          if (!frame || !subject) return;
          const next = await buildPreview({ frame, target: subject, comment, drawing });
          if (controller.signal.aborted) {
            URL.revokeObjectURL(next.imageUrl);
            return;
          }
          showPreview(next);
        },
      },
      controller.signal,
    ).finally(() => {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setRunning(false);
        setPhase(null);
      }
    });
  }, [releasePreview, showPreview]);

  // Copying for real fills the same panel, straight off the clipboard.
  useEffect(
    () =>
      watchClipboard((copied) => {
        if (copied.kind === "image") {
          showPreview({ imageUrl: copied.url, text: null });
          setFlavor("image");
        } else {
          showPreview({ imageUrl: null, text: copied.text });
          setFlavor("text");
        }
      }),
    [showPreview],
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) start();
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      releasePreview();
    };
  }, [releasePreview, start]);

  // The demo owns the overlay while it runs. The moment you touch anything,
  // hand it back rather than fight you for the pointer.
  useEffect(() => {
    if (!running) return;
    const yield_ = (event: Event) => {
      if (!event.isTrusted) return;
      if (
        event.target instanceof Element &&
        event.target.closest("[data-demo-controls]")
      ) {
        return;
      }
      // A keypress is probably crit's own shortcut, so leave the overlay in
      // whatever state that keypress is about to put it in.
      stop(event.type !== "keydown");
    };
    window.addEventListener("pointerdown", yield_, true);
    window.addEventListener("keydown", yield_, true);
    window.addEventListener("wheel", yield_, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", yield_, true);
      window.removeEventListener("keydown", yield_, true);
      window.removeEventListener("wheel", yield_, true);
    };
  }, [running, stop]);

  return (
    <div className="page">
      <style>{PAGE_CSS}</style>

      <header data-crit-ignore="">
        <h1>critter</h1>
        <p className="lede">
          Point at any element on your page, draw on it, and say what is wrong. Copy leaves you a PNG or a text crit that already carries the component name, selector, and URL.
        </p>
        <ul className="lede-list">
          <li>
            <Keys combo={["⌘", "⇧", "."]} /> starts picking
          </li>
          <li>
            <Keys combo={["Ctrl", "Shift", "."]} /> on Windows and Linux
          </li>
          <li>Here, only the window below is pickable</li>
        </ul>
      </header>

      <main>
        <div className="stage">
          <section className="window">
            <WindowChrome title="localhost:3000" />
            <div className="app" ref={appRef} data-crit-bounds="top" data-crit-scope="">
              <FacilityCard />
            </div>
          </section>

          <section className="window" data-crit-ignore="">
            <WindowChrome title="Paste" />
            <PastePanel preview={preview} flavor={flavor} onFlavor={setFlavor} />
          </section>
        </div>

        <div className="status" data-crit-ignore="" data-demo-controls="">
          <span className="step">
            {running && phase ? PHASE_LABEL[phase] : "Your turn. Pick something."}
          </span>
          <button
            type="button"
            className="replay"
            onClick={() => (running ? stop() : start())}
          >
            {running ? "Stop demo" : "Play demo"}
          </button>
        </div>
      </main>

      <footer data-crit-ignore="">
        <a
          href="https://github.com/jasonyapzx/critter"
          rel="noreferrer"
          aria-label="critter on GitHub"
        >
          <GitHubMark />
        </a>
      </footer>
    </div>
  );
}
PlaygroundPage.displayName = "PlaygroundPage";

const PAGE_CSS = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body {
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #0c0b0e;
    color: #f4f1ee;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  #crit-demo-cursor {
    position: fixed;
    top: 0;
    left: 0;
    width: 14px;
    height: 14px;
    margin: -7px 0 0 -7px;
    border-radius: 999px;
    background: #ff2d6a;
    box-shadow: 0 0 0 4px rgba(255, 45, 106, 0.22), 0 2px 8px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    opacity: 0;
    z-index: 2147483647;
    transition: width 120ms ease, height 120ms ease, opacity 200ms ease;
  }
  #crit-demo-cursor[data-state="press"] { width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; }
  #crit-demo-cursor[data-state="text"] { width: 3px; height: 17px; border-radius: 2px; margin: -8px 0 0 -1.5px; }

  .page {
    height: 100dvh;
    max-width: 900px;
    margin: 0 auto;
    padding: 28px 24px 20px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 18px;
  }
  h1 {
    margin: 0 0 10px;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .lede {
    margin: 0 0 10px;
    max-width: 92ch;
    font-size: 13.5px;
    line-height: 1.6;
    color: #a9a4b0;
  }
  .lede-list {
    margin: 0;
    padding: 0 0 0 1.15em;
    font-size: 12.5px;
    line-height: 1.7;
    color: #6f6a77;
  }
  .lede-list li + li { margin-top: 2px; }
  .keys { display: inline-flex; gap: 3px; }
  kbd {
    font: 600 10.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #d9d4de;
    background: #1a181e;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    padding: 3px 5px;
  }

  main {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 12px;
    min-height: 0;
  }
  /* Fixed basis so the windows do not resize when the paste panel swaps
     between a screenshot and a wall of text. */
  .stage {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    flex: 0 1 380px;
    min-height: 0;
  }
  .window {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: #111015;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 20px 44px rgba(0, 0, 0, 0.5);
  }
  .chrome {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    height: 32px;
    flex: none;
    background: #17161c;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
  }
  .chrome-title {
    flex: 1;
    text-align: center;
    font: 500 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #6f6a77;
    padding-right: 30px;
  }
  /* The dock docks to the top of this box, so the card starts below it. */
  .app {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 62px 18px 18px;
    min-height: 0;
  }

  .card {
    width: 230px;
    background: #17161c;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 9px;
    overflow: hidden;
  }
  .card img { display: block; width: 100%; height: 74px; object-fit: cover; }
  .card-body { padding: 11px 12px 13px; }
  .kind {
    margin: 0 0 5px;
    font: 700 9.5px/1 Inter, sans-serif;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ff2d6a;
  }
  .card h2 { margin: 0 0 6px; font-size: 14px; letter-spacing: -0.01em; }
  .meta {
    display: flex;
    gap: 5px;
    margin: 0 0 11px;
    font-size: 11px;
    color: #8f8a95;
  }
  .card-actions { display: flex; gap: 7px; }
  .book, .ghost {
    appearance: none;
    font: 600 11.5px/1 Inter, ui-sans-serif, system-ui, sans-serif;
    border-radius: 6px;
    padding: 8px 12px;
    cursor: pointer;
  }
  .book { border: 0; background: #ff2d6a; color: #fff; }
  .ghost {
    background: transparent;
    color: #d9d4de;
    border: 1px solid rgba(255, 255, 255, 0.16);
  }

  .paste {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .tabs {
    display: flex;
    gap: 4px;
    padding: 10px 12px 0;
    flex: none;
  }
  .tab {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    color: #6f6a77;
    font: 600 11px/1 Inter, sans-serif;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
  }
  .tab.on {
    color: #f4f1ee;
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .paste-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    min-height: 0;
  }
  .empty { margin: 0; font-size: 12px; color: #56525c; }
  .shot {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .crit-text {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    font: 400 10.5px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #a9a4b0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .paste-foot {
    margin: 0;
    flex: none;
    padding: 8px 12px 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    font: 400 10.5px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #56525c;
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: none;
    font-size: 12px;
    color: #6f6a77;
  }
  .replay {
    appearance: none;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.16);
    color: #d9d4de;
    font: 600 11px/1 Inter, sans-serif;
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
  }
  .replay:hover { border-color: rgba(255, 255, 255, 0.32); }

  footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.09);
  }
  footer a {
    display: inline-flex;
    color: #6f6a77;
  }
  footer a:hover { color: #d9d4de; }
  footer a:focus-visible {
    outline: 2px solid #ff2d6a;
    outline-offset: 3px;
  }

  @media (max-height: 640px), (max-width: 760px) {
    html, body { overflow: auto; }
    .page { height: auto; min-height: 100dvh; }
    .stage { grid-template-columns: 1fr; }
  }
`;

const mount = document.getElementById("playground");
if (mount) {
  createRoot(mount).render(<PlaygroundPage />);
}
