import type {
  BrowserProgram,
  BrowserProgramDiagnostic,
} from "./browser-program";
import { loadBrowserProgram } from "./load-browser-program";

export interface BrowserProgramUpdate {
  active: BrowserProgram;
  accepted: boolean;
  diagnostics: readonly BrowserProgramDiagnostic[];
}

export function updateBrowserProgram(
  active: BrowserProgram,
  source: string,
): BrowserProgramUpdate {
  const result = loadBrowserProgram(source);
  return result.ok
    ? { accepted: true, active: result.loaded, diagnostics: [] }
    : { accepted: false, active, diagnostics: result.diagnostics };
}
