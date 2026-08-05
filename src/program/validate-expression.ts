import type { Expression } from "../language/expression-ast";
import { diagnoseExpression } from "./expression-diagnostic";
import type { ExpressionValidationContext } from "./expression-context";
import type {
  BinaryPlan,
  ExpressionPlan,
  ProgramValueType,
  UnaryPlan,
} from "./types";
import { validateCall } from "./validate-call";

export function validateExpression(
  expression: Expression,
  context: ExpressionValidationContext,
): ExpressionPlan | null {
  if (expression.kind === "number") {
    return { kind: "literal", span: expression.span, value: expression.value, valueType: "number" };
  }
  if (expression.kind === "identifier") {
    const definition = context.names[expression.name];
    if (!definition) {
      diagnoseExpression(context, "unknown-name", `unknown name ${expression.name}`, expression);
      return null;
    }
    return definition.kind === "input"
      ? { input: definition.input, kind: "input", span: expression.span, valueType: definition.valueType }
      : { kind: "parameter-reference", name: definition.name, span: expression.span, valueType: "number" };
  }
  if (expression.kind === "call") return validateCall(expression, context, validateExpression);

  if (expression.kind === "unary") {
    const operand = validateExpression(expression.operand, context);
    if (!operand) return null;
    if (operand.valueType !== "number") {
      diagnoseExpression(context, "type-mismatch", `unary ${expression.operator} requires a number`, expression);
    }
    return {
      kind: "unary",
      operand,
      operator: expression.operator,
      span: expression.span,
      valueType: "number",
    } satisfies UnaryPlan;
  }

  const left = validateExpression(expression.left, context);
  const right = validateExpression(expression.right, context);
  if (!left || !right) return null;
  if (left.valueType !== "number" || right.valueType !== "number") {
    diagnoseExpression(context, "type-mismatch", `operator ${expression.operator} requires numbers`, expression);
  }
  return {
    kind: "binary",
    left,
    operator: expression.operator,
    right,
    span: expression.span,
    valueType: "number",
  } satisfies BinaryPlan;
}

export function requireExpressionType(
  plan: ExpressionPlan | null,
  expected: ProgramValueType,
  label: string,
  expression: Expression,
  context: ExpressionValidationContext,
): ExpressionPlan | null {
  if (!plan || plan.valueType === expected) return plan;
  diagnoseExpression(context, "type-mismatch", `${label} must produce ${expected}`, expression);
  return plan;
}
