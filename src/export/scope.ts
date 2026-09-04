import type { CommentPin } from "../pins/pins";

export type ExportScope = { kind: "element" } | { kind: "board" };

export function pinsIncludedInExport(
  scope: ExportScope,
  pins: CommentPin[],
): CommentPin[] {
  return scope.kind === "board" ? pins : [];
}
