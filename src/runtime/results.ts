import type { SourceSpan } from "../language";
import type { EvaluationError, EvaluationResult, NumberValue, UndefinedValue } from "./types";

export function numberValue(value: number, span: SourceSpan): EvaluationResult {
  if (!Number.isFinite(value)) {
    return evaluationError("non-finite-result", `result is not finite: ${value}`, span);
  }
  if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
    return evaluationError("unsafe-integer", `result exceeds the safe integer range: ${value}`, span);
  }
  return { kind: "number", value: Object.is(value, -0) ? 0 : value } satisfies NumberValue;
}

export function undefinedValue(
  code: string,
  message: string,
  span: SourceSpan,
): UndefinedValue {
  return { code, kind: "undefined", message, span };
}

export function evaluationError(
  code: string,
  message: string,
  span: SourceSpan,
): EvaluationError {
  return { code, kind: "error", message, span };
}
