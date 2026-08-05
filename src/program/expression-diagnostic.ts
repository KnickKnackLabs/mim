import type { Expression } from "../language/expression-ast";
import type { ProgramValidationCode } from "./diagnostics";
import type { ExpressionValidationContext } from "./expression-context";

export function diagnoseExpression(
  context: ExpressionValidationContext,
  code: ProgramValidationCode,
  message: string,
  expression: Expression,
): void {
  context.diagnostics.push({ code, message, span: expression.span });
}
