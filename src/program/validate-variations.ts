import type { VariationStatement } from "../language";
import type { ProgramValidationDiagnostic } from "./diagnostics";
import type { ParameterPlan, VariationMode, VariationPlan } from "./types";

const VARIATION_MODES = new Set<VariationMode>(["loop", "once", "pingpong"]);

function isSafeNumber(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
}

export function validateVariations(
  statements: readonly VariationStatement[],
  parameters: readonly ParameterPlan[],
  diagnostics: ProgramValidationDiagnostic[],
): VariationPlan[] {
  const parametersByName = new Map(parameters.map((parameter) => [parameter.name, parameter]));
  const varied = new Set<string>();
  const variations: VariationPlan[] = [];

  for (const statement of statements) {
    if (varied.has(statement.parameter)) {
      diagnostics.push({
        code: "duplicate-variation",
        message: `parameter ${statement.parameter} varies more than once`,
        span: statement.span,
      });
      continue;
    }
    varied.add(statement.parameter);

    const parameter = parametersByName.get(statement.parameter);
    if (!parameter) {
      diagnostics.push({
        code: "invalid-variation",
        message: `variation references unknown parameter ${statement.parameter}`,
        span: statement.span,
      });
      continue;
    }
    if (parameter.kind !== "number") {
      diagnostics.push({
        code: "invalid-variation",
        message: `only number parameters may vary; ${statement.parameter} is ${parameter.kind}`,
        span: statement.span,
      });
      continue;
    }
    if (!isSafeNumber(statement.from) || !isSafeNumber(statement.to)) {
      diagnostics.push({
        code: "invalid-variation",
        message: `variation endpoints for ${statement.parameter} must be within the safe numeric range`,
        span: statement.span,
      });
      continue;
    }
    if (statement.from !== parameter.initialValue) {
      diagnostics.push({
        code: "invalid-variation",
        message: `variation for ${statement.parameter} must start at its declared value ${parameter.initialValue}`,
        span: statement.span,
      });
      continue;
    }
    if (statement.from === statement.to) {
      diagnostics.push({
        code: "invalid-variation",
        message: `variation endpoints for ${statement.parameter} must differ`,
        span: statement.span,
      });
      continue;
    }
    if (
      !Number.isFinite(statement.durationSeconds)
      || statement.durationSeconds <= 0
      || statement.durationSeconds > Number.MAX_SAFE_INTEGER
    ) {
      diagnostics.push({
        code: "invalid-variation",
        message: `variation duration for ${statement.parameter} must be positive and finite`,
        span: statement.span,
      });
      continue;
    }
    if (!VARIATION_MODES.has(statement.mode as VariationMode)) {
      diagnostics.push({
        code: "invalid-variation",
        message: `unknown variation mode ${statement.mode}`,
        span: statement.span,
      });
      continue;
    }

    variations.push({
      durationSeconds: statement.durationSeconds,
      from: statement.from,
      mode: statement.mode as VariationMode,
      parameter: statement.parameter,
      span: statement.span,
      to: statement.to,
    });
  }

  return variations;
}
