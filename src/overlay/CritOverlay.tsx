import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { addCaption, captureViewport, downloadPng } from "../export/capture";
import {
  buildCritContext,
  copyBoardText,
  copyImageOnly,
  copyText,
  cssSelectorPath,
} from "../export/clipboard";
import { pinsIncludedInExport } from "../export/scope";
import { EditSidebar } from "../inspect/EditSidebar";
import {
  applyCssOverride,
  beginEditSession,
  collectEdits,
  CURATED_CSS_PROPERTIES,
  disableTextEditing,
  enableTextEditing,
  endEditSession,
  revertEdits,
  type EditSession,
} from "../inspect/edits";
import { getComponentStack } from "../host/fiber";
import {
  applyPinPosition,
  createPin,
  imageCaptionLines,
  mountCaptureCallouts,
  toBoardPins,
  unmountCaptureCallouts,
  type CommentPin,
} from "../pins/pins";
import {
  canRecordShortcut,
  defaultToggleShortcut,
  matchesShortcut,
  readToggleShortcut,
  shortcutFromEvent,
  writeToggleShortcut,
} from "../host/shortcut";
import {
  applyBoxStyle,
  commentBoxStyle,
  isCommentKey,
  isCritChromeTarget,
  isTypingTarget,
  pinBubbleStyle,
} from "./chrome";
import { DOCK_DRAG_THRESHOLD, EDIT_SIDEBAR_ENABLED, TOAST_MS, TOGGLE_EVENT } from "./constants";
import { Dock } from "./dock/Dock";
import { readBounds, sameBounds, type Bounds } from "./dock/bounds";
import { hasStoredDockEdge, nearestDockEdge, readDockEdge, readDrawerOpen, sameSize, writeDockEdge, writeDrawerOpen } from "./dock/persist";
import { paintStrokes, sizeCanvasToViewport } from "./drawing";
import {
  applyHighlightBox,
  describeElement,
  hasPickScope,
  hitTest,
  inPickScope,
  targetLabel,
} from "./picking";
import { PinBoard } from "../pins/PinBoard";
import { OVERLAY_CSS } from "./styles";
import { ElementPanel } from "./ui/ElementPanel";
import { HighlightCanvas } from "./ui/HighlightCanvas";
import { Toast } from "./ui/Toast";
import type { DockDrag, DockEdge, DockSizes, OverlayState, Stroke } from "./types";

type CritOverlayProps = {
  // Called once the window listeners (shortcut, crit:toggle) are attached.
  onReady?: () => void;
};

export function CritOverlay({ onReady }: CritOverlayProps) {
  const [state, setState] = useState<OverlayState>({ kind: "idle" });
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(readDrawerOpen);
  const [shortcut, setShortcut] = useState(readToggleShortcut);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recordingHotkey, setRecordingHotkey] = useState(false);
  const [textEditing, setTextEditing] = useState(false);
  const [cssDrafts, setCssDrafts] = useState<Record<string, string>>({});
  const [extraProp, setExtraProp] = useState("");
  const [extraVal, setExtraVal] = useState("");
  const [pins, setPins] = useState<CommentPin[]>([]);
  const [composerId, setComposerId] = useState<number | null>(null);
  const [composerDraft, setComposerDraft] = useState("");
  const [hoveredPinId, setHoveredPinId] = useState<number | null>(null);
  const [boardBusy, setBoardBusy] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const highlightRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const hoveredRef = useRef<Element | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const inProgressRef = useRef<Stroke | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const editSessionRef = useRef<EditSession | null>(null);
  const extraPropRef = useRef("");
  const settingsRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const composerBoxRef = useRef<HTMLDivElement>(null);
  const popoverBoxRef = useRef<HTMLDivElement>(null);
  const pinNodeRefs = useRef(new Map<number, HTMLElement>());
  const dockRef = useRef<HTMLDivElement>(null);
  const dockBarRef = useRef<HTMLDivElement>(null);
  const dockPillRef = useRef<HTMLButtonElement>(null);
  const [dockSizes, setDockSizes] = useState<DockSizes>({ bar: null, pill: null });
  const [dockEdge, setDockEdge] = useState<DockEdge>(readDockEdge);
  const [dockBounds, setDockBounds] = useState<Bounds | null>(readBounds);
  const [dockDragging, setDockDragging] = useState(false);
  const [dockSnapTarget, setDockSnapTarget] = useState<DockEdge | null>(null);
  const dockDragRef = useRef<DockDrag | null>(null);
  // Screen position of the dock when a drag ended; consumed by the FLIP
  // effect so the dock glides from where you let go to its new edge.
  const dockFlipFromRef = useRef<{ x: number; y: number } | null>(null);
  const dockBodyCursorRef = useRef<string | null>(null);
  const suppressPillClickRef = useRef(false);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const composerIdRef = useRef(composerId);
  composerIdRef.current = composerId;
  const composerDraftRef = useRef(composerDraft);
  composerDraftRef.current = composerDraft;
  const nextPinNumberRef = useRef(1);

  const resetEditUi = () => {
    setTextEditing(false);
    setCssDrafts({});
    setExtraProp("");
    setExtraVal("");
    extraPropRef.current = "";
  };

  const resetToIdle = useCallback((options?: { keepEdits?: boolean }) => {
    const session = editSessionRef.current;
    if (session) endEditSession(session, options?.keepEdits === true);
    editSessionRef.current = null;
    resetEditUi();
    strokesRef.current = [];
    inProgressRef.current = null;
    hoveredRef.current = null;
    applyHighlightBox(highlightRef.current, null);
    setComposerId(null);
    setHoveredPinId(null);
    setError(null);
    setState({ kind: "idle" });
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, TOAST_MS);
  }, []);

  const enterPicking = useCallback(() => {
    const session = editSessionRef.current;
    if (session) endEditSession(session, false);
    editSessionRef.current = null;
    resetEditUi();
    strokesRef.current = [];
    inProgressRef.current = null;
    hoveredRef.current = null;
    setComposerId(null);
    setHoveredPinId(null);
    setError(null);
    setState({ kind: "picking" });
  }, []);

  const enterCommenting = useCallback(() => {
    const session = editSessionRef.current;
    if (session) endEditSession(session, false);
    editSessionRef.current = null;
    resetEditUi();
    strokesRef.current = [];
    inProgressRef.current = null;
    hoveredRef.current = null;
    applyHighlightBox(highlightRef.current, null);
    setHoveredPinId(null);
    setError(null);
    setState({ kind: "commenting" });
  }, []);

  const discardComposer = useCallback(() => {
    const id = composerIdRef.current;
    if (id === null) return;
    setPins((prev) =>
      prev.filter((pin) => pin.id !== id || pin.comment.trim().length > 0),
    );
    setComposerId(null);
  }, []);

  const clearAllPins = useCallback(() => {
    setPins([]);
    setComposerId(null);
    setHoveredPinId(null);
    nextPinNumberRef.current = 1;
  }, []);

  const setDrawerOpenAndPersist = useCallback((open: boolean) => {
    setDrawerOpen(open);
    writeDrawerOpen(open);
  }, []);

  const applyShortcut = useCallback((next: typeof shortcut) => {
    setShortcut(next);
    writeToggleShortcut(next);
    setRecordingHotkey(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (recordingHotkey) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "Escape") {
          setRecordingHotkey(false);
          return;
        }
        if (!canRecordShortcut(event)) return;
        applyShortcut(shortcutFromEvent(event));
        return;
      }

      if (event.key === "Escape" && settingsOpen) {
        event.preventDefault();
        setSettingsOpen(false);
        setRecordingHotkey(false);
        return;
      }

      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        const current = stateRef.current;
        if (current.kind === "idle") enterPicking();
        else resetToIdle();
        return;
      }

      const current = stateRef.current;

      if (event.key === "Escape") {
        if (composerIdRef.current !== null) {
          event.preventDefault();
          discardComposer();
          return;
        }
        if (current.kind === "commenting" || current.kind === "picking") {
          event.preventDefault();
          resetToIdle();
        } else if (current.kind === "pinned") {
          event.preventDefault();
          enterPicking();
        }
        return;
      }

      if (isCommentKey(event) && !isTypingTarget(event.target)) {
        event.preventDefault();
        if (current.kind === "commenting") return;
        enterCommenting();
        return;
      }

      if (
        event.key === "Backspace" &&
        current.kind === "pinned" &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        strokesRef.current = strokesRef.current.slice(0, -1);
        const canvas = canvasRef.current;
        if (canvas) paintStrokes(canvas, strokesRef.current, null);
      }
    };

    // Same as the shortcut, but fired programmatically (browser extension
    // toolbar button, host dev tooling) via window.Crit.toggle().
    const onToggle = () => {
      if (recordingHotkey) return;
      const current = stateRef.current;
      if (current.kind === "idle") enterPicking();
      else resetToIdle();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener(TOGGLE_EVENT, onToggle);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener(TOGGLE_EVENT, onToggle);
    };
  }, [
    applyShortcut,
    discardComposer,
    enterCommenting,
    enterPicking,
    recordingHotkey,
    resetToIdle,
    settingsOpen,
    shortcut,
  ]);

  // Declared right after the listener effect on purpose: effects in one
  // component run in declaration order, so the listeners exist by the time
  // onReady fires and a buffered toggle() from main.tsx is not dropped.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useEffect(() => {
    onReadyRef.current?.();
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = settingsRef.current;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (root?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-crit-settings]")) {
        return;
      }
      setSettingsOpen(false);
      setRecordingHotkey(false);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [settingsOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // The dock shell morphs between the pill and the bar. Both layers stay
  // mounted (hidden with visibility) so each always has a box to measure;
  // the shell's inline width/height follow whichever layer is active.
  useLayoutEffect(() => {
    const bar = dockBarRef.current;
    const pill = dockPillRef.current;
    if (!bar || !pill) return;

    const measure = () => {
      const next: DockSizes = {
        bar: { width: bar.offsetWidth, height: bar.offsetHeight },
        pill: { width: pill.offsetWidth, height: pill.offsetHeight },
      };
      setDockSizes((prev) =>
        sameSize(prev.bar, next.bar) && sameSize(prev.pill, next.pill)
          ? prev
          : next,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    observer.observe(pill);
    return () => observer.disconnect();
  }, []);

  // A host can scope the dock to one container with data-crit-bounds. The
  // element may mount after the overlay does, so re-read on the next frame as
  // well as whenever the page resizes or scrolls under us.
  useEffect(() => {
    const update = () => {
      const next = readBounds();
      setDockBounds((prev) => (sameBounds(prev, next) ? prev : next));
      if (next?.edge && !hasStoredDockEdge()) setDockEdge(next.edge);
    };

    update();
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer.disconnect();
    };
  }, []);

  // FLIP: after a drag ends the dock has re-rendered at its resting spot on
  // the (possibly new) edge. Offset it back to where the pointer released,
  // then let the CSS transition carry it home.
  useLayoutEffect(() => {
    const from = dockFlipFromRef.current;
    const dock = dockRef.current;
    if (!from || !dock) return;
    dockFlipFromRef.current = null;

    dock.style.transition = "none";
    dock.style.transform = "";
    const rest = dock.getBoundingClientRect();
    const dx = from.x - rest.left;
    const dy = from.y - rest.top;
    dock.style.transform = `translate(${dx}px, ${dy}px)`;
    // Flush the offset before handing control back to the stylesheet.
    dock.getBoundingClientRect();
    window.requestAnimationFrame(() => {
      dock.style.transition = "";
      dock.style.transform = "";
    });
  }, [dockEdge, dockDragging]);

  const beginDockDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (dockDragRef.current) return;
    dockDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      handle: event.currentTarget,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDockDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dockDragRef.current;
    const dock = dockRef.current;
    if (!drag || !dock || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DOCK_DRAG_THRESHOLD) return;
      drag.moved = true;
      dockBodyCursorRef.current = document.body.style.cursor;
      document.body.style.cursor = "grabbing";
      setSettingsOpen(false);
      setRecordingHotkey(false);
      setDockDragging(true);
    }
    dock.style.transition = "none";
    dock.style.transform = `translate(${dx}px, ${dy}px)`;
    setDockSnapTarget(nearestDockEdge(event.clientX, event.clientY, dockBounds));
  };

  const endDockDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dockDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dockDragRef.current = null;
    if (drag.handle.hasPointerCapture(event.pointerId)) {
      drag.handle.releasePointerCapture(event.pointerId);
    }
    if (!drag.moved) return;

    if (dockBodyCursorRef.current !== null) {
      document.body.style.cursor = dockBodyCursorRef.current;
      dockBodyCursorRef.current = null;
    }
    // The pill is also the "open" button; a drag must not open the drawer.
    if (drag.handle === dockPillRef.current) suppressPillClickRef.current = true;

    const dock = dockRef.current;
    if (dock) {
      const rect = dock.getBoundingClientRect();
      dockFlipFromRef.current = { x: rect.left, y: rect.top };
    }
    const edge =
      event.type === "pointercancel"
        ? dockEdge
        : nearestDockEdge(event.clientX, event.clientY, dockBounds);
    setDockSnapTarget(null);
    setDockDragging(false);
    if (edge !== dockEdge) {
      setDockEdge(edge);
      writeDockEdge(edge);
    }
  };

  useEffect(() => {
    if (state.kind !== "picking") return;

    const previousCursor = document.body.style.cursor;
    // Scoped hosts start on the page's own cursor: the first move decides
    // whether the pointer is over the pickable box or not.
    document.body.style.cursor = hasPickScope() ? previousCursor : "crosshair";

    const onPointerMove = (event: PointerEvent) => {
      // Outside the scope the pointer is not ours. Leave the highlight where
      // it is rather than clearing it, so passing over the page does not undo
      // whatever is being hovered inside the box.
      if (!inPickScope(event.clientX, event.clientY)) {
        document.body.style.cursor = previousCursor;
        return;
      }
      document.body.style.cursor = "crosshair";
      const el = hitTest(event.clientX, event.clientY);
      const changed = el !== hoveredRef.current;
      hoveredRef.current = el;
      applyHighlightBox(highlightRef.current, el);
      const label = labelRef.current;
      if (!label || !changed) return;
      if (!el) {
        label.textContent = "";
        return;
      }
      label.textContent = targetLabel(describeElement(el));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (
        event.target instanceof Element &&
        event.target.closest("[data-crit-pin]")
      ) {
        return;
      }
      const el = hitTest(event.clientX, event.clientY);
      if (!el) return;
      event.preventDefault();
      event.stopPropagation();
      hoveredRef.current = el;
      applyHighlightBox(highlightRef.current, el);
      editSessionRef.current = EDIT_SIDEBAR_ENABLED
        ? beginEditSession(el)
        : null;
      setTextEditing(false);
      setCssDrafts({});
      setExtraProp("");
      setExtraVal("");
      extraPropRef.current = "";
      setState({
        kind: "pinned",
        target: describeElement(el),
        comment: "",
        includeDrawing: true,
      });
    };

    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Node) {
        const root = document.getElementById("crit-root");
        if (root?.contains(event.target)) return;
      }
      // The highlight can still be sitting on the last element inside the
      // scope, so check the click itself rather than trusting the hover.
      if (!inPickScope(event.clientX, event.clientY)) return;
      if (hoveredRef.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onScrollOrResize = () => {
      applyHighlightBox(highlightRef.current, hoveredRef.current);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.body.style.cursor = previousCursor;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [state.kind]);

  useEffect(() => {
    if (state.kind !== "commenting") {
      const ghost = ghostRef.current;
      if (ghost) ghost.style.display = "none";
      return;
    }

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = hasPickScope() ? previousCursor : "crosshair";

    const onPointerMove = (event: PointerEvent) => {
      const ghost = ghostRef.current;
      if (!ghost) return;
      if (!inPickScope(event.clientX, event.clientY)) {
        document.body.style.cursor = previousCursor;
        ghost.style.display = "none";
        return;
      }
      document.body.style.cursor = "crosshair";
      ghost.style.display = "block";
      ghost.style.left = `${event.clientX}px`;
      ghost.style.top = `${event.clientY}px`;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (isCritChromeTarget(event.target)) return;
      if (!inPickScope(event.clientX, event.clientY)) return;
      if (
        event.target instanceof Element &&
        event.target.closest("[data-crit-pin]")
      ) {
        return;
      }
      if (composerIdRef.current !== null) return;
      event.preventDefault();
      event.stopPropagation();

      const root = document.getElementById("crit-root");
      const previous = root?.style.pointerEvents;
      if (root) root.style.pointerEvents = "none";
      let element: Element | null = null;
      try {
        const el = document.elementFromPoint(event.clientX, event.clientY);
        if (el && !el.closest("[data-crit-chrome]") && !el.closest("[data-crit-pin]")) {
          element = el;
        }
      } finally {
        if (root) root.style.pointerEvents = previous ?? "";
      }

      const id = nextPinNumberRef.current;
      nextPinNumberRef.current += 1;
      let tagName = "page";
      let componentName: string | null = null;
      let selector = "";
      if (element && element !== document.documentElement && element !== document.body) {
        const desc = describeElement(element);
        tagName = desc.tagName;
        componentName = desc.componentName;
        selector = cssSelectorPath(element);
      } else if (element) {
        tagName = element.tagName.toLowerCase();
      }
      const pin = createPin({
        id,
        clientX: event.clientX,
        clientY: event.clientY,
        element,
        tagName,
        componentName,
        selector,
      });
      setPins((prev) => [...prev, pin]);
      setComposerDraft("");
      setComposerId(id);
      setHoveredPinId(null);
    };

    const onClick = (event: MouseEvent) => {
      if (isCritChromeTarget(event.target)) return;
      if (
        event.target instanceof Element &&
        event.target.closest("[data-crit-pin]")
      ) {
        return;
      }
      if (!inPickScope(event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("click", onClick, true);
    return () => {
      document.body.style.cursor = previousCursor;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("click", onClick, true);
    };
  }, [state.kind]);

  const pinnedTarget =
    state.kind === "pinned" || state.kind === "copying" ? state.target : null;

  useEffect(() => {
    if (!pinnedTarget) return;
    const element = pinnedTarget.element;
    applyHighlightBox(highlightRef.current, element);
    const label = labelRef.current;
    if (label) label.textContent = targetLabel(pinnedTarget);

    const onScrollOrResize = () => {
      applyHighlightBox(highlightRef.current, element);
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [pinnedTarget]);

  useEffect(() => {
    if (pins.length === 0) return;

    const relocate = () => {
      for (const pin of pinsRef.current) {
        applyPinPosition(pinNodeRefs.current.get(pin.id) ?? null, pin);
      }
      const composerPin = pinsRef.current.find(
        (pin) => pin.id === composerIdRef.current,
      );
      applyBoxStyle(
        composerBoxRef.current,
        composerPin ? pinBubbleStyle(composerPin, 160) : null,
      );
      const hoverId = hoveredPinId;
      const hoverPin =
        hoverId !== null && hoverId !== composerIdRef.current
          ? pinsRef.current.find((pin) => pin.id === hoverId)
          : undefined;
      applyBoxStyle(
        popoverBoxRef.current,
        hoverPin ? pinBubbleStyle(hoverPin, 96) : null,
      );
    };

    relocate();
    window.addEventListener("scroll", relocate, true);
    window.addEventListener("resize", relocate);
    return () => {
      window.removeEventListener("scroll", relocate, true);
      window.removeEventListener("resize", relocate);
    };
  }, [composerId, hoveredPinId, pins]);

  useEffect(() => {
    if (state.kind !== "pinned" && state.kind !== "copying") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onResize = () => sizeCanvasToViewport(canvas, strokesRef.current);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [state.kind]);

  useEffect(() => {
    if (!textEditing) return;
    const element = editSessionRef.current?.element;
    if (!element) return;
    const onInput = () => {
      applyHighlightBox(highlightRef.current, element);
    };
    element.addEventListener("input", onInput);
    return () => element.removeEventListener("input", onInput);
  }, [textEditing]);

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (state.kind !== "pinned") return;
    if (textEditing) return;
    if (event.button !== 0) return;
    const canvas = event.currentTarget;
    canvas.setPointerCapture(event.pointerId);
    inProgressRef.current = [{ x: event.clientX, y: event.clientY }];
    paintStrokes(canvas, strokesRef.current, inProgressRef.current);
  };

  const onCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!inProgressRef.current) return;
    inProgressRef.current = [
      ...inProgressRef.current,
      { x: event.clientX, y: event.clientY },
    ];
    paintStrokes(event.currentTarget, strokesRef.current, inProgressRef.current);
  };

  const onCanvasPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!inProgressRef.current) return;
    if (inProgressRef.current.length >= 2) {
      strokesRef.current = [...strokesRef.current, inProgressRef.current];
    }
    inProgressRef.current = null;
    paintStrokes(event.currentTarget, strokesRef.current, null);
  };

  const pinsForExport = (): CommentPin[] => {
    const draftId = composerIdRef.current;
    const draft = composerDraftRef.current;
    return pinsRef.current.map((pin) =>
      pin.id === draftId ? { ...pin, comment: draft } : pin,
    );
  };

  const runCapture = async (mode: "image" | "download") => {
    if (state.kind !== "pinned") return;
    const { target, comment, includeDrawing } = state;
    setError(null);
    setState({ kind: "copying", target, comment, includeDrawing });

    let components: string[] = [];
    try {
      components = getComponentStack(target.element);
    } catch {
      components = [];
    }
    const context = buildCritContext(target.element, components);
    const session = editSessionRef.current;
    if (session) {
      const edits = collectEdits(session);
      if (edits) context.edits = edits;
    }
    const trimmed = comment.trim();
    const exportPins = pinsIncludedInExport(
      { kind: "element" },
      pinsForExport(),
    );
    const lines = imageCaptionLines({ comment: trimmed, pins: exportPins });

    // Not awaited before the clipboard call: copyImageOnly hands this
    // promise to ClipboardItem synchronously so the click's user activation
    // is still alive when the write starts.
    const png = captureViewport({
      includeDrawing,
      drawingCanvas: canvasRef.current,
    }).then((blob) =>
      lines.length > 0
        ? addCaption(blob, { lines, url: context.url })
        : blob,
    );

    try {
      if (mode === "download") {
        downloadPng(await png);
        setState({ kind: "pinned", target, comment, includeDrawing });
        return;
      }

      await copyImageOnly(png);
      setState({ kind: "pinned", target, comment, includeDrawing });
      showToast("Image copied");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Copy failed";
      setError(message);
      setState({ kind: "pinned", target, comment, includeDrawing });
    }
  };

  const runCopyText = async () => {
    if (state.kind !== "pinned") return;
    const { target, comment } = state;
    setError(null);

    let components: string[] = [];
    try {
      components = getComponentStack(target.element);
    } catch {
      components = [];
    }
    const context = buildCritContext(target.element, components);
    const session = editSessionRef.current;
    if (session) {
      const edits = collectEdits(session);
      if (edits) context.edits = edits;
    }

    try {
      await copyText({
        comment: comment.trim(),
        context,
      });
      showToast("Text copied");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Copy failed";
      setError(message);
    }
  };

  const runBoardCapture = (mode: "image" | "download") => {
    if (pinsRef.current.length === 0) return;
    setError(null);
    const exportPins = pinsIncludedInExport({ kind: "board" }, pinsForExport());
    const lines = imageCaptionLines({ comment: "", pins: exportPins });
    const url = window.location.href;
    const callouts = mountCaptureCallouts(exportPins);
    const png = captureViewport({
      includeDrawing: false,
      drawingCanvas: null,
    })
      .finally(() => unmountCaptureCallouts(callouts))
      .then((blob) =>
        lines.length > 0 ? addCaption(blob, { lines, url }) : blob,
      );

    if (mode === "download") {
      setBoardBusy(true);
      void png
        .then((blob) => {
          downloadPng(blob);
          setBoardBusy(false);
        })
        .catch((caught: unknown) => {
          const message =
            caught instanceof Error ? caught.message : "Copy failed";
          setError(message);
          setBoardBusy(false);
        });
      return;
    }

    // write starts inside the click; do not await capture first
    const write = copyImageOnly(png);
    setBoardBusy(true);
    void write
      .then(() => {
        setBoardBusy(false);
        showToast("Image copied");
      })
      .catch((caught: unknown) => {
        const message =
          caught instanceof Error ? caught.message : "Copy failed";
        setError(message);
        setBoardBusy(false);
      });
  };

  const runBoardText = () => {
    if (pinsRef.current.length === 0) return;
    setError(null);
    void copyBoardText({
      pins: toBoardPins(pinsForExport()),
      url: window.location.href,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    })
      .then(() => {
        showToast("Text copied");
      })
      .catch((caught: unknown) => {
        const message =
          caught instanceof Error ? caught.message : "Copy failed";
        setError(message);
      });
  };

  const active =
    state.kind === "picking" ||
    state.kind === "commenting" ||
    state.kind === "pinned" ||
    state.kind === "copying";
  const drawing =
    state.kind === "pinned" || state.kind === "copying";
  const pinnedElement =
    state.kind === "pinned" || state.kind === "copying"
      ? state.target.element
      : null;
  const busy = state.kind === "copying";
  const toolsBusy = busy || boardBusy;
  const canvasInteractive = drawing && !busy && !textEditing;
  const hasPins = pins.length > 0;
  const composerPin = pins.find((pin) => pin.id === composerId) ?? null;
  const hoverPin =
    hoveredPinId !== null && hoveredPinId !== composerId
      ? (pins.find((pin) => pin.id === hoveredPinId) ?? null)
      : null;
  const pinComputed = editSessionRef.current?.computed;
  const dockShellSize = drawerOpen ? dockSizes.bar : dockSizes.pill;

  const refreshPinnedHighlight = () => {
    const element = editSessionRef.current?.element;
    if (element) applyHighlightBox(highlightRef.current, element);
  };

  const onToggleTextEditing = () => {
    const session = editSessionRef.current;
    if (!session) return;
    if (textEditing) {
      disableTextEditing(session);
      setTextEditing(false);
      return;
    }
    enableTextEditing(session);
    setTextEditing(true);
  };

  const onCuratedCssChange = (property: string, value: string) => {
    const session = editSessionRef.current;
    if (!session) return;
    applyCssOverride(session, property, value);
    setCssDrafts((prev) => ({ ...prev, [property]: value }));
    refreshPinnedHighlight();
  };

  const onExtraPropChange = (next: string) => {
    const session = editSessionRef.current;
    const prev = extraPropRef.current;
    if (session && prev.trim().length > 0 && prev.trim() !== next.trim()) {
      applyCssOverride(session, prev, "");
    }
    extraPropRef.current = next;
    setExtraProp(next);
    if (session && next.trim().length > 0 && extraVal.trim().length > 0) {
      applyCssOverride(session, next, extraVal);
    }
    refreshPinnedHighlight();
  };

  const onExtraValChange = (next: string) => {
    setExtraVal(next);
    const session = editSessionRef.current;
    const prop = extraPropRef.current;
    if (!session || prop.trim().length === 0) return;
    applyCssOverride(session, prop, next);
    refreshPinnedHighlight();
  };

  const onRevertEdits = () => {
    const session = editSessionRef.current;
    if (!session) return;
    revertEdits(session);
    setTextEditing(false);
    setCssDrafts({});
    setExtraProp("");
    setExtraVal("");
    extraPropRef.current = "";
    refreshPinnedHighlight();
  };

  const openComposer = (pin: CommentPin) => {
    const current = composerIdRef.current;
    if (current !== null && current !== pin.id) {
      setPins((prev) =>
        prev.filter((item) => item.id !== current || item.comment.trim().length > 0),
      );
    }
    setComposerDraft(pin.comment);
    setComposerId(pin.id);
    setHoveredPinId(null);
  };

  const postComposer = () => {
    const id = composerIdRef.current;
    if (id === null) return;
    const trimmed = composerDraft.trim();
    if (trimmed.length === 0) {
      setPins((prev) => prev.filter((pin) => pin.id !== id));
      setComposerId(null);
      return;
    }
    setPins((prev) =>
      prev.map((pin) => (pin.id === id ? { ...pin, comment: trimmed } : pin)),
    );
    setComposerId(null);
  };

  const deletePin = (id: number) => {
    setPins((prev) => prev.filter((pin) => pin.id !== id));
    if (composerIdRef.current === id) setComposerId(null);
    setHoveredPinId((current) => (current === id ? null : current));
  };

  const pinTargetLabel = (pin: CommentPin) =>
    targetLabel({
      element: pin.element ?? document.documentElement,
      tagName: pin.tagName,
      componentName: pin.componentName,
    });

  return (
    <>
      <style>{OVERLAY_CSS}</style>
      <HighlightCanvas
        showHighlight={state.kind === "picking" || drawing}
        drawing={drawing}
        canvasInteractive={canvasInteractive}
        highlightRef={highlightRef}
        labelRef={labelRef}
        canvasRef={canvasRef}
        onCanvasPointerDown={onCanvasPointerDown}
        onCanvasPointerMove={onCanvasPointerMove}
        onCanvasPointerUp={onCanvasPointerUp}
      />
      <PinBoard
        pins={pins}
        commenting={state.kind === "commenting"}
        ghostRef={ghostRef}
        composerPin={composerPin}
        composerDraft={composerDraft}
        hoverPin={hoverPin}
        composerBoxRef={composerBoxRef}
        popoverBoxRef={popoverBoxRef}
        pinNodeRefs={pinNodeRefs.current}
        pinTargetLabel={pinTargetLabel}
        onPinEnter={(id) => {
          if (composerIdRef.current === id) return;
          setHoveredPinId(id);
        }}
        onPinLeave={(id) => {
          setHoveredPinId((current) => (current === id ? null : current));
        }}
        onPinClick={openComposer}
        onDeletePin={deletePin}
        onComposerDraftChange={setComposerDraft}
        onComposerSubmit={postComposer}
      />
      {state.kind === "pinned" || state.kind === "copying" ? (
        <ElementPanel
          targetLabel={targetLabel(state.target)}
          comment={state.comment}
          includeDrawing={state.includeDrawing}
          busy={busy}
          error={error}
          style={commentBoxStyle(
            pinnedElement ?? state.target.element,
            280,
            EDIT_SIDEBAR_ENABLED ? 256 : 0,
          )}
          onCommentChange={(value) => {
            if (state.kind !== "pinned") return;
            setState({ ...state, comment: value });
          }}
          onIncludeDrawingChange={(value) => {
            if (state.kind !== "pinned") return;
            setState({ ...state, includeDrawing: value });
          }}
          onCancel={() => resetToIdle()}
          onCopyImage={() => {
            void runCapture("image");
          }}
          onCopyText={() => {
            void runCopyText();
          }}
          onDownload={() => {
            void runCapture("download");
          }}
        />
      ) : null}
      {EDIT_SIDEBAR_ENABLED &&
      (state.kind === "pinned" || state.kind === "copying") ? (
        <EditSidebar
          title={targetLabel(state.target)}
          textEditing={textEditing}
          busy={busy}
          properties={
            editSessionRef.current?.properties ?? CURATED_CSS_PROPERTIES
          }
          drafts={cssDrafts}
          computed={pinComputed ?? {}}
          extraProp={extraProp}
          extraVal={extraVal}
          onToggleTextEditing={onToggleTextEditing}
          onRevertEdits={onRevertEdits}
          onCuratedCssChange={onCuratedCssChange}
          onExtraPropChange={onExtraPropChange}
          onExtraValChange={onExtraValChange}
        />
      ) : null}
      {toast ? <Toast message={toast} /> : null}
      <Dock
        dockRef={dockRef}
        dockBarRef={dockBarRef}
        dockPillRef={dockPillRef}
        settingsRef={settingsRef}
        edge={dockEdge}
        bounds={dockBounds}
        dragging={dockDragging}
        snapTarget={dockSnapTarget}
        drawerOpen={drawerOpen}
        shellSize={dockShellSize}
        picking={state.kind === "picking"}
        commenting={state.kind === "commenting"}
        active={active}
        toolsBusy={toolsBusy}
        hasPins={hasPins}
        pinCount={pins.length}
        error={
          error && state.kind !== "pinned" && state.kind !== "copying"
            ? error
            : null
        }
        settingsOpen={settingsOpen}
        recordingHotkey={recordingHotkey}
        shortcut={shortcut}
        onBeginDrag={beginDockDrag}
        onMoveDrag={moveDockDrag}
        onEndDrag={endDockDrag}
        onPick={enterPicking}
        onComment={enterCommenting}
        onClearPins={clearAllPins}
        onCopyImage={() => runBoardCapture("image")}
        onCopyText={runBoardText}
        onDownload={() => runBoardCapture("download")}
        onExit={() => resetToIdle()}
        onToggleSettings={() => {
          setSettingsOpen((open) => !open);
          setRecordingHotkey(false);
        }}
        onCollapse={() => {
          setSettingsOpen(false);
          setRecordingHotkey(false);
          setDrawerOpenAndPersist(false);
        }}
        onOpenDrawer={() => {
          if (suppressPillClickRef.current) {
            suppressPillClickRef.current = false;
            return;
          }
          setDrawerOpenAndPersist(true);
        }}
        onStartRecordHotkey={() => setRecordingHotkey(true)}
        onResetShortcut={() => applyShortcut(defaultToggleShortcut())}
      />
    </>
  );
}
