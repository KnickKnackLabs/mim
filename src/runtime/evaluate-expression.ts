import type { ExpressionPlan } from "../program";
import { evaluateBinary } from "./evaluate-binary";
import { evaluateCall } from "./evaluate-call";
import { evaluationError, numberValue } from "./results";
import type { EvaluationContext, EvaluationResult } from "./types";

function requireNumber(
  result: EvaluationResult,
  plan: ExpressionPlan,
): EvaluationResult {
  return result.kind === "color"
    ? evaluationError("unexpected-color", "expected a number, got a color", plan.span)
    : result;
}

export function evaluateExpression(
  plan: ExpressionPlan,
  context: EvaluationContext,
): EvaluationResult {
  if (plan.kind === "literal") return numberValue(plan.value, plan.span);
  if (plan.kind === "input") {
    const value = context.inputs[plan.input];
    return value === undefined
      ? evaluationError("missing-input", `missing input ${plan.input}`, plan.span)
      : numberValue(value, plan.span);
  }
  if (plan.kind === "parameter-reference") {
    const value = context.parameters[plan.name];
    return value === undefined
      ? evaluationError("missing-parameter", `missing parameter ${plan.name}`, plan.span)
      : numberValue(value, plan.span);
  }
  if (plan.kind === "call") return evaluateCall(plan, context, evaluateExpression);
  if (plan.kind === "unary") {
    const operand = requireNumber(evaluateExpression(plan.operand, context), plan.operand);
    if (operand.kind !== "number") return operand;
    if (plan.operator === "+") return operand;
    if (plan.operator === "-") return numberValue(-operand.value, plan.span);
    return numberValue(operand.value === 0 ? 1 : 0, plan.span);
  }

  const left = requireNumber(evaluateExpression(plan.left, context), plan.left);
  if (left.kind !== "number") return left;
  const right = requireNumber(evaluateExpression(plan.right, context), plan.right);
  if (right.kind !== "number") return right;
  return evaluateBinary(plan, left, right);
}
