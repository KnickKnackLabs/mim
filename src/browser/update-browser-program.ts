import type {
  BrowserProgram,
  BrowserProgramDiagnostic,
} from "./browser-program";
import { loadBrowserProgram } from "./load-browser-program";

export interface BrowserProgramUpdate<Active extends BrowserProgram | null> {
  active: Active;
  accepted: boolean;
  diagnostics: readonly BrowserProgramDiagnostic[];
}

export function updateBrowserProgram(
  active: BrowserProgram,
  source: string,
): BrowserProgramUpdate<BrowserProgram>;
export function updateBrowserProgram(
  active: BrowserProgram | null,
  source: string,
): BrowserProgramUpdate<BrowserProgram | null>;
export function updateBrowserProgram(
  active: BrowserProgram | null,
  source: string,
): BrowserProgramUpdate<BrowserProgram | null> {
  const result = loadBrowserProgram(source);
  return result.ok
    ? { accepted: true, active: result.loaded, diagnostics: [] }
    : { accepted: false, active, diagnostics: result.diagnostics };
}
