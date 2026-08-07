export type ProgramEditorWindowAction = "close" | "open" | null;
export type ProgramEditorInputAction = "apply" | "close" | null;

export interface WindowKeyState {
  defaultPrevented: boolean;
  editableTarget: boolean;
  key: string;
  visible: boolean;
}

export function hasUnappliedProgramDraft(
  draft: string,
  source: string,
  readOnly: boolean,
): boolean {
  return !readOnly && draft !== source;
}

export function programEditorWindowAction(state: WindowKeyState): ProgramEditorWindowAction {
  if (state.defaultPrevented) return null;
  if (state.visible) return state.key === "Escape" ? "close" : null;
  return state.key === ":" && !state.editableTarget ? "open" : null;
}

export function programEditorInputAction(
  key: string,
  metaKey: boolean,
  ctrlKey: boolean,
): ProgramEditorInputAction {
  if (key === "Escape") return "close";
  return key === "Enter" && (metaKey || ctrlKey) ? "apply" : null;
}
