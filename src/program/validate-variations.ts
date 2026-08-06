import type { VariationStatement } from "../language";
import { isPrimeInteger } from "../math/prime";
import type { ProgramValidationDiagnostic } from "./diagnostics";
import type { ParameterPlan, VariationMode, VariationPlan } from "./types";
import { expandVariationSequence } from "./variation-sequence";

const VARIATION_MODES = new Set<VariationMode>(["loop", "once", "pingpong"]);

function isSafeNumber(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
}

function isValidDuration(seconds: number): boolean {
  return Number.isFinite(seconds) && seconds > 0 && seconds <= Number.MAX_SAFE_INTEGER;
}

function pushInvalid(
  diagnostics: ProgramValidationDiagnostic[],
  statement: VariationStatement,
  message: string,
): void {
  diagnostics.push({ code: "invalid-variation", message, span: statement.span });
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
      pushInvalid(
        diagnostics,
        statement,
        `variation references unknown parameter ${statement.parameter}`,
      );
      continue;
    }
    if (!VARIATION_MODES.has(statement.mode as VariationMode)) {
      pushInvalid(diagnostics, statement, `unknown variation mode ${statement.mode}`);
      continue;
    }
    const mode = statement.mode as VariationMode;

    if (statement.form === "linear") {
      if (parameter.kind !== "number") {
        pushInvalid(
          diagnostics,
          statement,
          `only number parameters may vary continuously; ${statement.parameter} is ${parameter.kind}`,
        );
        continue;
      }
      if (!isSafeNumber(statement.from) || !isSafeNumber(statement.to)) {
        pushInvalid(
          diagnostics,
          statement,
          `variation endpoints for ${statement.parameter} must be within the safe numeric range`,
        );
        continue;
      }
      if (statement.from !== parameter.initialValue) {
        pushInvalid(
          diagnostics,
          statement,
          `variation for ${statement.parameter} must start at its declared value ${parameter.initialValue}`,
        );
        continue;
      }
      if (statement.from === statement.to) {
        pushInvalid(
          diagnostics,
          statement,
          `variation endpoints for ${statement.parameter} must differ`,
        );
        continue;
      }
      if (!isValidDuration(statement.durationSeconds)) {
        pushInvalid(
          diagnostics,
          statement,
          `variation duration for ${statement.parameter} must be positive and finite`,
        );
        continue;
      }

      variations.push({
        durationSeconds: statement.durationSeconds,
        from: statement.from,
        kind: "linear",
        mode,
        parameter: statement.parameter,
        span: statement.span,
        to: statement.to,
      });
      continue;
    }

    if (!isValidDuration(statement.everySeconds)) {
      pushInvalid(
        diagnostics,
        statement,
        `variation step duration for ${statement.parameter} must be positive and finite`,
      );
      continue;
    }
    const expanded = expandVariationSequence(statement.sequence);
    if (!expanded.ok) {
      pushInvalid(diagnostics, statement, expanded.message);
      continue;
    }
    const values = expanded.values.map((value) => Object.is(value, -0) ? 0 : value);
    const completionSeconds = (values.length - 1) * statement.everySeconds;
    if (!isSafeNumber(completionSeconds)) {
      pushInvalid(
        diagnostics,
        statement,
        `variation timeline for ${statement.parameter} exceeds the safe duration`,
      );
      continue;
    }
    if (values.some((value) => !isSafeNumber(value))) {
      pushInvalid(
        diagnostics,
        statement,
        `variation values for ${statement.parameter} must be within the safe numeric range`,
      );
      continue;
    }
    if (parameter.kind === "prime" && values.some((value) => !isPrimeInteger(value))) {
      pushInvalid(
        diagnostics,
        statement,
        `every variation value for prime parameter ${statement.parameter} must be prime`,
      );
      continue;
    }
    if (values[0] !== parameter.initialValue) {
      pushInvalid(
        diagnostics,
        statement,
        `variation for ${statement.parameter} must start at its declared value ${parameter.initialValue}`,
      );
      continue;
    }
    if (values.length < 2 || new Set(values).size < 2) {
      pushInvalid(
        diagnostics,
        statement,
        `variation sequence for ${statement.parameter} must contain at least two distinct values`,
      );
      continue;
    }

    variations.push({
      everySeconds: statement.everySeconds,
      kind: "discrete",
      mode,
      parameter: statement.parameter,
      span: statement.span,
      values,
    });
  }

  return variations;
}
