import type { ParameterStatement } from "../language/program-ast";
import { isPrimeInteger } from "../math/prime";
import type { ProgramValidationDiagnostic } from "./diagnostics";
import type { NameDefinition } from "./expression-context";
import type { ParameterPlan } from "./types";

export interface ParameterValidation {
  names: Record<string, NameDefinition>;
  parameters: ParameterPlan[];
}

const RESERVED_NAMES = new Set(["lens", "value", "x", "xi", "y", "yi"]);

function signedLiteralValue(statement: ParameterStatement): number | null {
  if (statement.initial.kind === "number") return statement.initial.value;
  if (
    statement.initial.kind === "unary"
    && (statement.initial.operator === "+" || statement.initial.operator === "-")
    && statement.initial.operand.kind === "number"
  ) {
    return statement.initial.operator === "-"
      ? -statement.initial.operand.value
      : statement.initial.operand.value;
  }
  return null;
}

export function validateParameters(
  statements: readonly ParameterStatement[],
  diagnostics: ProgramValidationDiagnostic[],
): ParameterValidation {
  const declared = new Set<string>();
  const names: Record<string, NameDefinition> = {};
  const parameters: ParameterPlan[] = [];

  for (const statement of statements) {
    if (declared.has(statement.name)) {
      diagnostics.push({
        code: "duplicate-parameter",
        message: `parameter ${statement.name} is declared more than once`,
        span: statement.span,
      });
      continue;
    }
    declared.add(statement.name);
    if (RESERVED_NAMES.has(statement.name)) {
      diagnostics.push({
        code: "reserved-name",
        message: `parameter name ${statement.name} is reserved`,
        span: statement.span,
      });
      continue;
    }
    if (statement.parameterType !== "number" && statement.parameterType !== "prime") {
      diagnostics.push({
        code: "unknown-parameter-type",
        message: `unknown parameter type ${statement.parameterType}`,
        span: statement.span,
      });
      continue;
    }
    names[statement.name] = { kind: "parameter", name: statement.name, valueType: "number" };
    const literalValue = signedLiteralValue(statement);
    if (literalValue === null) {
      diagnostics.push({
        code: "invalid-parameter",
        message: `${statement.parameterType} parameter ${statement.name} must start at a number literal`,
        span: statement.initial.span,
      });
      continue;
    }
    const initialValue = Object.is(literalValue, -0) ? 0 : literalValue;
    if (!Number.isFinite(initialValue) || Math.abs(initialValue) > Number.MAX_SAFE_INTEGER) {
      diagnostics.push({
        code: "invalid-parameter",
        message: `${statement.parameterType} parameter ${statement.name} must start within the safe numeric range`,
        span: statement.initial.span,
      });
      continue;
    }
    if (statement.parameterType === "prime" && !isPrimeInteger(initialValue)) {
      diagnostics.push({
        code: "invalid-parameter",
        message: `prime parameter ${statement.name} must start at a prime integer`,
        span: statement.initial.span,
      });
      continue;
    }

    parameters.push({
      initialValue,
      kind: statement.parameterType,
      name: statement.name,
      span: statement.span,
    });
  }

  return { names, parameters };
}
