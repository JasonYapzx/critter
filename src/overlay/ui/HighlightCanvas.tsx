import type { PointerEvent as ReactPointerEvent, Ref } from "react";

export function HighlightCanvas({
  showHighlight,
  drawing,
  canvasInteractive,
  highlightRef,
  labelRef,
  canvasRef,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
}: {
  showHighlight: boolean;
  drawing: boolean;
  canvasInteractive: boolean;
  highlightRef: Ref<HTMLDivElement>;
  labelRef: Ref<HTMLSpanElement>;
  canvasRef: Ref<HTMLCanvasElement>;
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onCanvasPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onCanvasPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
}) {
  return (
    <>
      {showHighlight ? (
        <div ref={highlightRef} className="crit-highlight" aria-hidden="true">
          <span ref={labelRef} className="crit-label" />
        </div>
      ) : null}
      {drawing ? (
        <canvas
          ref={canvasRef}
          className="crit-canvas"
          data-crit-chrome=""
          style={{ pointerEvents: canvasInteractive ? "auto" : "none" }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerCancel={onCanvasPointerUp}
        />
      ) : null}
    </>
  );
}
