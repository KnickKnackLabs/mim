import type { SourceSpan } from "./source";

export interface NumberExpression {
  kind: "number";
  span: SourceSpan;
  value: number;
}

export interface IdentifierExpression {
  kind: "identifier";
  name: string;
  span: SourceSpan;
}

export interface UnaryExpression {
  kind: "unary";
  operand: Expression;
  operator: "+" | "-" | "!";
  span: SourceSpan;
}

export type BinaryOperator =
  | "+" | "-" | "*" | "/" | "%"
  | "==" | "!=" | "<" | "<=" | ">" | ">=";

export interface BinaryExpression {
  kind: "binary";
  left: Expression;
  operator: BinaryOperator;
  right: Expression;
  span: SourceSpan;
}

export interface CallExpression {
  arguments: Expression[];
  callee: string;
  kind: "call";
  span: SourceSpan;
}

export type Expression =
  | BinaryExpression
  | CallExpression
  | IdentifierExpression
  | NumberExpression
  | UnaryExpression;
