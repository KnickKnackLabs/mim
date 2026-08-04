import type {
  BinaryOperator,
  Expression,
} from "./expression-ast";

const PRECEDENCE: Readonly<Record<BinaryOperator, number>> = {
  "!=": 1,
  "%": 3,
  "*": 3,
  "+": 2,
  "-": 2,
  "/": 3,
  "<": 1,
  "<=": 1,
  "==": 1,
  ">": 1,
  ">=": 1,
};

function format(expression: Expression, parentPrecedence: number): string {
  if (expression.kind === "number") return String(expression.value);
  if (expression.kind === "identifier") return expression.name;
  if (expression.kind === "call") {
    const arguments_ = expression.arguments.map((argument) => format(argument, 0));
    return `${expression.callee}(${arguments_.join(", ")})`;
  }
  if (expression.kind === "unary") {
    const value = `${expression.operator}${format(expression.operand, 4)}`;
    return parentPrecedence > 4 ? `(${value})` : value;
  }

  const precedence = PRECEDENCE[expression.operator];
  const left = format(expression.left, precedence);
  const right = format(expression.right, precedence + 1);
  const value = `${left} ${expression.operator} ${right}`;
  return precedence < parentPrecedence ? `(${value})` : value;
}

export function formatExpression(expression: Expression): string {
  return format(expression, 0);
}
