import { primeValuation, removePrimePowers } from "../math/prime-factor";
import type { CallPlan } from "../program";
import { evaluationError, numberValue, undefinedValue } from "./results";
import type { EvaluationResult } from "./types";

export function evaluatePrimeCall(plan: CallPlan, values: number[]): EvaluationResult {
  const [value, prime, depth] = values;
  try {
    if (plan.functionName === "valuation") {
      const exponent = primeValuation(value, prime);
      return exponent === null
        ? undefinedValue("valuation-at-zero", "prime valuation at zero is undefined", plan.span)
        : numberValue(exponent, plan.span);
    }
    if (plan.functionName === "strip") {
      const result = removePrimePowers(value, prime);
      return result === null
        ? undefinedValue("strip-at-zero", "prime removal at zero is undefined", plan.span)
        : numberValue(result, plan.span);
    }
    const result = removePrimePowers(value, prime, depth);
    return result === null
      ? undefinedValue("remove-at-zero", "prime removal at zero is undefined", plan.span)
      : numberValue(result, plan.span);
  } catch (error) {
    return evaluationError(
      "invalid-prime-function-domain",
      error instanceof Error ? error.message : String(error),
      plan.span,
    );
  }
}
