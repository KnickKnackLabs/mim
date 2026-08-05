import type { BinaryPlan } from "../program";
import { numberValue, undefinedValue } from "./results";
import type { EvaluationResult, NumberValue } from "./types";

function truth(value: boolean): number {
  return value ? 1 : 0;
}

export function evaluateBinary(
  plan: BinaryPlan,
  left: NumberValue,
  right: NumberValue,
): EvaluationResult {
  const a = left.value;
  const b = right.value;
  if (plan.operator === "+") return numberValue(a + b, plan.span);
  if (plan.operator === "-") return numberValue(a - b, plan.span);
  if (plan.operator === "*") return numberValue(a * b, plan.span);
  if (plan.operator === "/") {
    return b === 0
      ? undefinedValue("division-by-zero", "division by zero is undefined", plan.span)
      : numberValue(a / b, plan.span);
  }
  if (plan.operator === "%") {
    return b === 0
      ? undefinedValue("modulo-by-zero", "modulo by zero is undefined", plan.span)
      : numberValue(((a % Math.abs(b)) + Math.abs(b)) % Math.abs(b), plan.span);
  }
  if (plan.operator === "==") return numberValue(truth(a === b), plan.span);
  if (plan.operator === "!=") return numberValue(truth(a !== b), plan.span);
  if (plan.operator === "<") return numberValue(truth(a < b), plan.span);
  if (plan.operator === "<=") return numberValue(truth(a <= b), plan.span);
  if (plan.operator === ">") return numberValue(truth(a > b), plan.span);
  return numberValue(truth(a >= b), plan.span);
}
