import type { AxisStatement } from "../language/program-ast";
import type { ProgramValidationDiagnostic } from "./diagnostics";
import type { ProgramDefinitions } from "./definitions";
import type { AxisPlan } from "./types";

export function validateAxes(
  statements: readonly AxisStatement[],
  definitions: ProgramDefinitions,
  diagnostics: ProgramValidationDiagnostic[],
): Partial<Record<"x" | "y", AxisPlan>> {
  const axes: Partial<Record<"x" | "y", AxisPlan>> = {};

  for (const statement of statements) {
    if (statement.axis !== "x" && statement.axis !== "y") {
      diagnostics.push({
        code: "invalid-axis",
        message: `axis name must be x or y, got ${statement.axis}`,
        span: statement.span,
      });
      continue;
    }
    if (axes[statement.axis]) {
      diagnostics.push({
        code: "duplicate-axis",
        message: `axis ${statement.axis} is declared more than once`,
        span: statement.span,
      });
      continue;
    }
    if (
      statement.definition.kind !== "identifier"
      || !definitions.axes.includes(statement.definition.name)
    ) {
      diagnostics.push({
        code: "invalid-axis",
        message: `unknown axis definition`,
        span: statement.definition.span,
      });
      continue;
    }
    axes[statement.axis] = {
      definition: statement.definition.name,
      span: statement.span,
    };
  }

  for (const axis of ["x", "y"] as const) {
    if (axes[axis]) continue;
    diagnostics.push({
      code: "missing-axis",
      message: `program must declare axis ${axis}`,
      span: statements[0]?.span ?? { end: { column: 1, line: 1, offset: 0 }, start: { column: 1, line: 1, offset: 0 } },
    });
  }

  return axes;
}
