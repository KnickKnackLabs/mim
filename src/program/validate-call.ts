import type { CallExpression, Expression } from "../language/expression-ast";
import { functionDefinition } from "./definitions";
import { diagnoseExpression } from "./expression-diagnostic";
import type { ExpressionValidationContext } from "./expression-context";
import type { CallPlan, ExpressionPlan } from "./types";

export function validateCall(
  expression: CallExpression,
  context: ExpressionValidationContext,
  validate: (expression: Expression, context: ExpressionValidationContext) => ExpressionPlan | null,
): CallPlan | null {
  const definition = functionDefinition(context.definitions, expression.callee);
  const arguments_ = expression.arguments.map((argument) => validate(argument, context));
  if (!definition) {
    diagnoseExpression(context, "unknown-function", `unknown function ${expression.callee}`, expression);
    return null;
  }
  if (arguments_.length !== definition.inputs.length) {
    diagnoseExpression(
      context,
      "wrong-arity",
      `${expression.callee} expects ${definition.inputs.length} arguments, got ${arguments_.length}`,
      expression,
    );
  }
  for (const [index, argument] of arguments_.entries()) {
    const expected = definition.inputs[index];
    if (!argument || !expected || argument.valueType === expected) continue;
    context.diagnostics.push({
      code: "type-mismatch",
      message: `argument ${index + 1} of ${expression.callee} must be ${expected}`,
      span: expression.arguments[index].span,
    });
  }
  if (arguments_.some((argument) => argument === null)) return null;
  return {
    arguments: arguments_ as ExpressionPlan[],
    functionName: definition.name,
    kind: "call",
    span: expression.span,
    valueType: definition.output,
  };
}
