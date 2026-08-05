import type {
  ProgramAst,
  ProgramDiagnostic,
} from "../language";
import type {
  ProgramValidationDiagnostic,
  ValidatedProgram,
} from "../program";

export type BrowserProgramDiagnostic = ProgramDiagnostic | ProgramValidationDiagnostic;

export interface BrowserProgram {
  ast: ProgramAst;
  program: ValidatedProgram;
  source: string;
}

export type BrowserProgramLoadResult =
  | { diagnostics: []; loaded: BrowserProgram; ok: true }
  | { diagnostics: BrowserProgramDiagnostic[]; loaded: null; ok: false };
