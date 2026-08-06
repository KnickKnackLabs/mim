import type { ProgramAst, ProgramStatement } from "./program-ast";
import {
  SyntaxFailure,
  type ProgramDiagnostic,
  type ProgramParseResult,
} from "./diagnostics";
import { parseStatement } from "./parse-statement";
import { sourceLines } from "./source-lines";
import type { SourcePosition, SourceSpan } from "./source";

function startSpan(): SourceSpan {
  const start = { column: 1, line: 1, offset: 0 };
  return { end: start, start };
}

function sourceEnd(source: string): SourcePosition {
  const lines = source.split("\n");
  return {
    column: (lines.at(-1)?.replace(/\r$/, "").length ?? 0) + 1,
    line: lines.length,
    offset: source.length,
  };
}

function diagnostic(error: SyntaxFailure): ProgramDiagnostic {
  return { code: error.code, message: error.message, span: error.span };
}

export function parseProgram(source: string): ProgramParseResult {
  const diagnostics: ProgramDiagnostic[] = [];
  const statements: ProgramStatement[] = [];

  for (const line of sourceLines(source)) {
    if (!line.text.trim()) continue;
    try {
      statements.push(parseStatement(line.text, line.line, line.offset));
    } catch (error) {
      if (!(error instanceof SyntaxFailure)) throw error;
      diagnostics.push(diagnostic(error));
    }
  }

  const versions = statements.filter((statement) => statement.kind === "mim");
  if (versions.length === 0) {
    diagnostics.push({
      code: "missing-version",
      message: "program must declare :mim version",
      span: startSpan(),
    });
  }
  for (const duplicate of versions.slice(1)) {
    diagnostics.push({
      code: "duplicate-version",
      message: "program may declare :mim only once",
      span: duplicate.span,
    });
  }
  if (versions.length > 0 && statements[0]?.kind !== "mim") {
    diagnostics.push({
      code: "version-order",
      message: ":mim must be the first statement",
      span: versions[0].span,
    });
  }
  if (diagnostics.length > 0) return { diagnostics, ok: false };

  const ast: ProgramAst = {
    kind: "program",
    span: { end: sourceEnd(source), start: startSpan().start },
    statements,
    version: versions[0].version,
  };
  return { ast, diagnostics: [], ok: true };
}
