import type { ValidatedProgram } from "../program";
import { bindParameters } from "./bind-parameters";
import { evaluateExpression } from "./evaluate-expression";
import type { CellEvaluation, CellInputs, EvaluationContext } from "./types";

export function evaluateCell(
  program: ValidatedProgram,
  inputs: CellInputs,
  overrides: Readonly<Record<string, number>> = {},
): CellEvaluation {
  const binding = bindParameters(program, overrides);
  if (binding.kind === "invalid") {
    return { cell: null, diagnostics: binding.diagnostics, kind: "invalid-parameters" };
  }

  const baseContext: EvaluationContext = {
    inputs: { x: inputs.x, xi: inputs.xi, y: inputs.y, yi: inputs.yi },
    parameters: binding.values,
  };
  const field = evaluateExpression(program.field, baseContext);
  if (field.kind !== "number") {
    return {
      cell: { color: null, field, lens: null, parameters: binding.values },
      diagnostics: [],
      kind: "evaluated",
    };
  }

  const lens = evaluateExpression(program.lens, {
    ...baseContext,
    inputs: { ...baseContext.inputs, value: field.value },
  });
  if (lens.kind !== "number") {
    return {
      cell: { color: null, field, lens, parameters: binding.values },
      diagnostics: [],
      kind: "evaluated",
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
  return {
    cell: { color, field, lens, parameters: binding.values },
    diagnostics: [],
    kind: "evaluated",
  };
}
