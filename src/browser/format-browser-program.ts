import { formatProgramSource, parseProgram } from "../language";
import type { BrowserProgramDiagnostic } from "./browser-program";

export type BrowserProgramFormatResult =
  | { diagnostics: []; ok: true; source: string }
  | { diagnostics: BrowserProgramDiagnostic[]; ok: false; source: null };

export function formatBrowserProgram(source: string): BrowserProgramFormatResult {
  const parsed = parseProgram(source);
  if (!parsed.ok) {
    return { diagnostics: parsed.diagnostics, ok: false, source: null };
  }
  return {
    diagnostics: [],
    ok: true,
    source: formatProgramSource(source, parsed.ast),
  };
}
