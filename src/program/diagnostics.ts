import type { SourceSpan } from "../language/source";
import type { ValidatedProgram } from "./types";

export type ProgramValidationCode =
  | "duplicate-axis"
  | "duplicate-parameter"
  | "duplicate-statement"
  | "invalid-axis"
  | "invalid-overlay"
  | "invalid-parameter"
  | "missing-axis"
  | "missing-statement"
  | "reserved-name"
  | "type-mismatch"
  | "unknown-function"
  | "unknown-name"
  | "unknown-parameter-type"
  | "unsupported-version"
  | "wrong-arity";

export interface ProgramValidationDiagnostic {
  code: ProgramValidationCode;
  message: string;
  span: SourceSpan;
}

export interface ProgramValidationSuccess {
  diagnostics: [];
  ok: true;
  program: ValidatedProgram;
}

export interface ProgramValidationFailure {
  diagnostics: ProgramValidationDiagnostic[];
  ok: false;
}

export type ProgramValidationResult =
  | ProgramValidationFailure
  | ProgramValidationSuccess;
