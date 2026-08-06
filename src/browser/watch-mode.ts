import type {
  BrowserProgram,
  BrowserProgramDiagnostic,
} from "./browser-program";
import { updateBrowserProgram } from "./update-browser-program";
import type { WatchUpdate } from "../watch/protocol";

export interface BrowserWatchState {
  active: BrowserProgram | null;
  accepted: boolean;
  diagnostics: readonly BrowserProgramDiagnostic[];
  revision: number;
  source: string;
}

export function createBrowserWatchState(): BrowserWatchState {
  return {
    active: null,
    accepted: false,
    diagnostics: [],
    revision: 0,
    source: "",
  };
}

export function applyBrowserWatchUpdate(
  state: BrowserWatchState,
  update: WatchUpdate,
): BrowserWatchState {
  if (update.revision <= state.revision) return state;
  const result = updateBrowserProgram(state.active, update.source);
  return {
    active: result.active,
    accepted: result.accepted,
    diagnostics: result.diagnostics,
    revision: update.revision,
    source: update.source,
  };
}
