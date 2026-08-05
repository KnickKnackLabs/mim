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
    if (statement.parameterType !== "prime") {
      diagnostics.push({
        code: "unknown-parameter-type",
        message: `unknown parameter type ${statement.parameterType}`,
        span: statement.span,
      });
      continue;
    }
    if (statement.initial.kind !== "number" || !isPrimeInteger(statement.initial.value)) {
      diagnostics.push({
        code: "invalid-parameter",
        message: `prime parameter ${statement.name} must start at a prime integer`,
        span: statement.initial.span,
      });
      continue;
    }

    names[statement.name] = { kind: "parameter", name: statement.name, valueType: "number" };
    parameters.push({
      initialValue: statement.initial.value,
      kind: "prime",
      name: statement.name,
      span: statement.span,
    });
  }

  return { names, parameters };
}
