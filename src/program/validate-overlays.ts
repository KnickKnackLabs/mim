import type { OverlayStatement } from "../language/program-ast";
import type { ProgramValidationDiagnostic } from "./diagnostics";

export function validateOverlays(
  statements: readonly OverlayStatement[],
  diagnostics: ProgramValidationDiagnostic[],
): { equality: boolean } {
  let equality = true;
  let equalitySeen = false;

  for (const statement of statements) {
    if (statement.name !== "equality") {
      diagnostics.push({
        code: "invalid-overlay",
        message: `unknown overlay ${statement.name}`,
        span: statement.span,
      });
      continue;
    }
    if (equalitySeen) {
      diagnostics.push({
        code: "duplicate-statement",
        message: `overlay equality is declared more than once`,
        span: statement.span,
      });
      continue;
    }
    equalitySeen = true;
    if (statement.state !== "on" && statement.state !== "off") {
      diagnostics.push({
        code: "invalid-overlay",
        message: `overlay equality must be on or off`,
        span: statement.span,
      });
      continue;
    }
    equality = statement.state === "on";
  }

  return { equality };
}
