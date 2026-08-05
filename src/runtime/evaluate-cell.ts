import type { ValidatedProgram } from "../program";
import { bindParameters } from "./bind-parameters";
import { evaluateExpression } from "./evaluate-expression";
import type {
  CellEvaluation,
  CellInputs,
  EvaluatedCell,
  EvaluationContext,
} from "./types";

export function evaluateBoundCell(
  program: ValidatedProgram,
  inputs: CellInputs,
  parameters: Readonly<Record<string, number>>,
): EvaluatedCell {
  const baseContext: EvaluationContext = {
    inputs: { x: inputs.x, xi: inputs.xi, y: inputs.y, yi: inputs.yi },
    parameters,
  };
  const field = evaluateExpression(program.field, baseContext);
  if (field.kind !== "number") {
    return {
      color: null,
      field,
      lens: null,
      parameters,
    };
  }

  const lens = evaluateExpression(program.lens, {
    ...baseContext,
    inputs: { ...baseContext.inputs, value: field.value },
  });
  if (lens.kind !== "number") {
    return {
      color: null,
      field,
      lens,
      parameters,
    };
  }

  const color = evaluateExpression(program.color, {
    ...baseContext,
    inputs: {
      ...baseContext.inputs,
      lens: lens.value,
      value: field.value,
    },
  });
  return { color, field, lens, parameters };
}

export function evaluateCell(
  program: ValidatedProgram,
  inputs: CellInputs,
  overrides: Readonly<Record<string, number>> = {},
): CellEvaluation {
  const binding = bindParameters(program, overrides);
  if (binding.kind === "invalid") {
    return { cell: null, diagnostics: binding.diagnostics, kind: "invalid-parameters" };
  }
  return {
    cell: evaluateBoundCell(program, inputs, binding.values),
    diagnostics: [],
    kind: "evaluated",
  };
}
