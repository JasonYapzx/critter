import type { Ref } from "react";
import { pinBubbleStyle } from "../overlay/chrome";
import { IconTrash } from "../overlay/ui/icons";
import { applyPinPosition, type CommentPin } from "./pins";

export function PinBoard({
  pins,
  commenting,
  ghostRef,
  composerPin,
  composerDraft,
  hoverPin,
  composerBoxRef,
  popoverBoxRef,
  pinNodeRefs,
  pinTargetLabel,
  onPinEnter,
  onPinLeave,
  onPinClick,
  onDeletePin,
  onComposerDraftChange,
  onComposerSubmit,
}: {
  pins: CommentPin[];
  commenting: boolean;
  ghostRef: Ref<HTMLDivElement>;
  composerPin: CommentPin | null;
  composerDraft: string;
  hoverPin: CommentPin | null;
  composerBoxRef: Ref<HTMLDivElement>;
  popoverBoxRef: Ref<HTMLDivElement>;
  pinNodeRefs: Map<number, HTMLElement>;
  pinTargetLabel: (pin: CommentPin) => string;
  onPinEnter: (id: number) => void;
  onPinLeave: (id: number) => void;
  onPinClick: (pin: CommentPin) => void;
  onDeletePin: (id: number) => void;
  onComposerDraftChange: (value: string) => void;
  onComposerSubmit: () => void;
}) {
  return (
    <>
      {commenting ? (
        <div
          ref={ghostRef}
          className="crit-pin-ghost"
          data-crit-chrome=""
          aria-hidden="true"
        >
          <span className="crit-pin-mark">
            <span className="crit-pin-dot" />
            <span className="crit-pin-tip" />
          </span>
        </div>
      ) : null}

      {pins.map((pin) => (
        <button
          key={pin.id}
          type="button"
          className="crit-pin"
          data-crit-ignore=""
          data-crit-pin=""
          aria-label={`Comment ${pin.id}`}
          ref={(node) => {
            if (node) {
              pinNodeRefs.set(pin.id, node);
              applyPinPosition(node, pin);
            } else {
              pinNodeRefs.delete(pin.id);
            }
          }}
          onPointerEnter={() => onPinEnter(pin.id)}
          onPointerLeave={() => onPinLeave(pin.id)}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onPinClick(pin);
          }}
        >
          <span className="crit-pin-mark">
            <span className="crit-pin-dot">{pin.id}</span>
            <span className="crit-pin-tip" aria-hidden="true" />
          </span>
        </button>
      ))}

      {composerPin ? (
        <div
          key={composerPin.id}
          ref={composerBoxRef}
          className="crit-panel crit-pin-composer"
          data-crit-chrome=""
          style={pinBubbleStyle(composerPin, 160)}
        >
          <div className="crit-panel-head">
            <span className="crit-target">
              <span className="crit-target-dot" aria-hidden="true" />
              {pinTargetLabel(composerPin)}
            </span>
            <button
              type="button"
              className="crit-icon-btn"
              aria-label="Delete pin"
              title="Delete pin"
              onClick={() => onDeletePin(composerPin.id)}
            >
              <IconTrash />
            </button>
          </div>
          <textarea
            className="crit-textarea"
            placeholder="Add a comment"
            value={composerDraft}
            autoFocus
            onChange={(event) => onComposerDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                onComposerSubmit();
              }
            }}
          />
        </div>
      ) : null}

      {hoverPin && hoverPin.comment.trim().length > 0 ? (
        <div
          ref={popoverBoxRef}
          className="crit-pin-pop"
          data-crit-chrome=""
          style={pinBubbleStyle(hoverPin, 96)}
        >
          <p className="crit-pin-pop-text">{hoverPin.comment}</p>
          <span className="crit-target">{pinTargetLabel(hoverPin)}</span>
        </div>
      ) : null}
    </>
  );
}
