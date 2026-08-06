import {
  greatestCommonDivisor,
  integerDivisorCount,
  leastCommonMultiple,
} from "../math/integer";
import { isPrimeInteger } from "../math/prime";
import type { CallPlan } from "../program";
import { evaluationError, numberValue, undefinedValue } from "./results";
import type { EvaluationResult } from "./types";

function truth(value: boolean): number {
  return value ? 1 : 0;
}

function bitwiseXor(left: number, right: number): number {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) {
    throw new RangeError("xor requires safe integers");
  }
  const result = BigInt(left) ^ BigInt(right);
  const numeric = Number(result);
  if (!Number.isSafeInteger(numeric)) throw new RangeError("xor exceeds the safe integer range");
  return numeric;
}

export function evaluateBasicCall(plan: CallPlan, values: number[]): EvaluationResult {
  const [a, b] = values;
  try {
    if (plan.functionName === "abs") return numberValue(Math.abs(a), plan.span);
    if (plan.functionName === "min") return numberValue(Math.min(a, b), plan.span);
    if (plan.functionName === "max") return numberValue(Math.max(a, b), plan.span);
    if (plan.functionName === "gcd") {
      return numberValue(greatestCommonDivisor(a, b), plan.span);
    }
    if (plan.functionName === "lcm") {
      return numberValue(leastCommonMultiple(a, b), plan.span);
    }
    if (plan.functionName === "coprime") {
      return numberValue(truth(greatestCommonDivisor(a, b) === 1), plan.span);
    }
    if (plan.functionName === "divides") {
      if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
        throw new RangeError("divides requires safe integers");
      }
      return numberValue(truth(a !== 0 && b % a === 0), plan.span);
    }
    if (plan.functionName === "divisors") {
      const count = integerDivisorCount(a);
      return count === null
        ? undefinedValue("divisors-at-zero", "zero has infinitely many integer divisors", plan.span)
        : numberValue(count, plan.span);
    }
    if (plan.functionName === "mod") {
      return b === 0
        ? undefinedValue("modulo-by-zero", "modulo by zero is undefined", plan.span)
        : numberValue(((a % Math.abs(b)) + Math.abs(b)) % Math.abs(b), plan.span);
    }
    if (plan.functionName === "prime") {
      return numberValue(truth(isPrimeInteger(a)), plan.span);
    }
    if (plan.functionName === "xor") return numberValue(bitwiseXor(a, b), plan.span);
    return evaluationError(
      "missing-runtime-function",
      `no runtime implementation for ${plan.functionName}`,
      plan.span,
    );
  } catch (error) {
    return evaluationError(
      "invalid-function-domain",
      error instanceof Error ? error.message : String(error),
      plan.span,
    );
  }
}
