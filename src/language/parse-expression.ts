import type {
  BinaryOperator,
  Expression,
} from "./expression-ast";
import type { SourcePosition, SourceSpan } from "./source";
import { TokenReader } from "./token-reader";

const BINDING_POWER: Readonly<Record<BinaryOperator, number>> = {
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

function combinedSpan(left: SourceSpan, right: SourceSpan): SourceSpan {
  return { end: right.end, start: left.start };
}

function binaryOperator(value: string): BinaryOperator | null {
  return value in BINDING_POWER ? value as BinaryOperator : null;
}

function parseCall(reader: TokenReader, callee: string, start: SourcePosition): Expression {
  reader.expect("(");
  const arguments_: Expression[] = [];
  if (!reader.at(")")) {
    do {
      arguments_.push(parseExpression(reader));
      if (!reader.at(",")) break;
      reader.take();
    } while (true);
  }
  const close = reader.expect(")");
  return {
    arguments: arguments_,
    callee,
    kind: "call",
    span: { end: close.span.end, start },
  };
}

function parsePrefix(reader: TokenReader): Expression {
  const token = reader.current;
  if (token.kind === "number") {
    reader.take();
    return { kind: "number", span: token.span, value: Number(token.value) };
  }

  if (token.kind === "identifier") {
    reader.take();
    return reader.at("(")
      ? parseCall(reader, token.value, token.span.start)
      : { kind: "identifier", name: token.value, span: token.span };
  }

  if (["+", "-", "!"].includes(token.value)) {
    reader.take();
    const operand = parseExpression(reader, 4);
    return {
      kind: "unary",
      operand,
      operator: token.value as "+" | "-" | "!",
      span: combinedSpan(token.span, operand.span),
    };
  }

  if (reader.at("(")) {
    reader.take();
    const expression = parseExpression(reader);
    reader.expect(")");
    return expression;
  }

  reader.fail("expected a number, name, function call, or parenthesized expression");
}

function parseExpression(reader: TokenReader, minimumPower = 0): Expression {
  let left = parsePrefix(reader);
  while (true) {
    const operator = binaryOperator(reader.current.value);
    if (!operator) break;
    const power = BINDING_POWER[operator];
    if (power < minimumPower) break;
    reader.take();
    const right = parseExpression(reader, power + 1);
    left = {
      kind: "binary",
      left,
      operator,
      right,
      span: combinedSpan(left.span, right.span),
    };
  }
  return left;
}

export function parseExpressionSource(
  source: string,
  start: SourcePosition,
): Expression {
  const reader = new TokenReader(source, start);
  const expression = parseExpression(reader);
  reader.finish();
  return expression;
}
