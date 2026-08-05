import { parseProgram } from "../language";
import { validateProgram } from "../program";
import type { BrowserProgramLoadResult } from "./browser-program";

export function loadBrowserProgram(source: string): BrowserProgramLoadResult {
  const parsed = parseProgram(source);
  if (!parsed.ok) {
    return { diagnostics: parsed.diagnostics, loaded: null, ok: false };
  }

  const validated = validateProgram(parsed.ast);
  if (!validated.ok) {
    return { diagnostics: validated.diagnostics, loaded: null, ok: false };
  }

  return {
    diagnostics: [],
    loaded: { ast: parsed.ast, program: validated.program, source },
    ok: true,
  };
}
