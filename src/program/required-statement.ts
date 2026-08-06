import type { SourceSpan } from "../language/source";
import type { ProgramValidationDiagnostic } from "./diagnostics";

interface Spanned {
  span: SourceSpan;
}

export function requireOneStatement<T extends Spanned>(
  name: string,
  statements: readonly T[],
  fallbackSpan: SourceSpan,
  diagnostics: ProgramValidationDiagnostic[],
): T | null {
  if (statements.length === 0) {
    diagnostics.push({
      code: "missing-statement",
      message: `program must declare :${name}`,
      span: fallbackSpan,
    });
    return null;
  }
  for (const duplicate of statements.slice(1)) {
    diagnostics.push({
      code: "duplicate-statement",
      message: `program may declare :${name} only once`,
      span: duplicate.span,
    });
  }
  return statements[0];
}
