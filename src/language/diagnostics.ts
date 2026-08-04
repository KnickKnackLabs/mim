import type { ProgramAst } from "./program-ast";
import type { SourceSpan } from "./source";

export type DiagnosticCode =
  | "duplicate-version"
  | "missing-version"
  | "syntax"
  | "unknown-statement"
  | "version-order";

export interface ProgramDiagnostic {
  code: DiagnosticCode;
  message: string;
  span: SourceSpan;
}

export class SyntaxFailure extends Error {
  constructor(
    message: string,
    readonly span: SourceSpan,
    readonly code: DiagnosticCode = "syntax",
  ) {
    super(message);
    this.name = "SyntaxFailure";
  }
}

export interface ProgramParseSuccess {
  ast: ProgramAst;
  diagnostics: [];
  ok: true;
}

export interface ProgramParseFailure {
  diagnostics: ProgramDiagnostic[];
  ok: false;
}

export type ProgramParseResult = ProgramParseFailure | ProgramParseSuccess;
