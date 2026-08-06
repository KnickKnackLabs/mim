import type { CallPlan, ExpressionPlan } from "../program";
import { evaluateBasicCall } from "./evaluate-basic-call";
import { evaluatePrimeCall } from "./evaluate-prime-call";
import { evaluationError } from "./results";
import type { ColorValue, EvaluationContext, EvaluationResult, NumberValue } from "./types";

export type ExpressionEvaluator = (
  plan: ExpressionPlan,
  context: EvaluationContext,
) => EvaluationResult;

function numericArguments(
  plan: CallPlan,
  context: EvaluationContext,
  evaluate: ExpressionEvaluator,
): EvaluationResult[] | NumberValue[] {
  return plan.arguments.map((argument) => evaluate(argument, context));
}

export function evaluateCall(
  plan: CallPlan,
  context: EvaluationContext,
  evaluate: ExpressionEvaluator,
): EvaluationResult {
  if (plan.functionName === "if") {
    const condition = evaluate(plan.arguments[0], context);
    if (condition.kind !== "number") return condition;
    return evaluate(condition.value === 0 ? plan.arguments[2] : plan.arguments[1], context);
  }

  const arguments_ = numericArguments(plan, context, evaluate);
  const failure = arguments_.find((argument) => argument.kind !== "number");
  if (failure) return failure;
  const numbers = arguments_ as NumberValue[];

  if (plan.functionName === "exact" || plan.functionName === "magnitude") {
    return {
      kind: "color",
      mode: plan.functionName,
      value: numbers[0].value,
    } satisfies ColorValue;
  }

  const values = numbers.map((argument) => argument.value);
  if (["remove", "strip", "valuation"].includes(plan.functionName)) {
    return evaluatePrimeCall(plan, values);
  }
  if (plan.valueType !== "number") {
    return evaluationError(
      "unsupported-runtime-type",
      `cannot execute ${plan.functionName} as ${plan.valueType}`,
      plan.span,
    );
  }
  return evaluateBasicCall(plan, values);
}
