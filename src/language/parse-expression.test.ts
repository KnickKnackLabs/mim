import { describe, expect, test } from "bun:test";

import { SyntaxFailure } from "./diagnostics";
import { parseExpressionSource } from "./parse-expression";
import type { SourcePosition } from "./source";

const START: SourcePosition = { column: 1, line: 1, offset: 0 };

function parse(source: string) {
  return parseExpressionSource(source, START);
}

describe("parseExpressionSource", () => {
  test("applies multiplication before addition", () => {
    expect(parse("x + y * 2")).toMatchObject({
      kind: "binary",
      left: { kind: "identifier", name: "x" },
      operator: "+",
      right: {
        kind: "binary",
        left: { kind: "identifier", name: "y" },
        operator: "*",
        right: { kind: "number", value: 2 },
      },
    });
  });

  test("uses parentheses to change precedence", () => {
    expect(parse("(x + y) * 2")).toMatchObject({
      kind: "binary",
      left: { kind: "binary", operator: "+" },
      operator: "*",
      right: { kind: "number", value: 2 },
    });
  });

  test("makes binary operators left associative", () => {
    expect(parse("x - y - 1")).toMatchObject({
      kind: "binary",
      left: { kind: "binary", operator: "-" },
      operator: "-",
      right: { kind: "number", value: 1 },
    });
  });

  test("parses nested unary operators and calls", () => {
    expect(parse("!prime(-abs(x))")).toMatchObject({
      kind: "unary",
      operator: "!",
      operand: {
        callee: "prime",
        kind: "call",
        arguments: [{
          kind: "unary",
          operator: "-",
          operand: { callee: "abs", kind: "call" },
        }],
      },
    });
  });

  test("parses empty and multiple call arguments", () => {
    expect(parse("zero()")).toMatchObject({ arguments: [], callee: "zero" });
    expect(parse("remove(value, 2, depth)")).toMatchObject({
      arguments: [
        { kind: "identifier", name: "value" },
        { kind: "number", value: 2 },
        { kind: "identifier", name: "depth" },
      ],
      callee: "remove",
    });
  });

  test("tracks an expression at its absolute source position", () => {
    const start = { column: 8, line: 4, offset: 27 };
    expect(parseExpressionSource("gcd(x, y)", start).span).toEqual({
      start,
      end: { column: 17, line: 4, offset: 36 },
    });
  });

  test.each([
    ["", 1],
    ["x @ y", 3],
    ["x y", 3],
    ["gcd(x,)", 7],
    ["gcd(x", 6],
    ["(x + y", 7],
  ])("reports malformed expression %p at column %i", (source, column) => {
    try {
      parse(source);
      throw new Error("expected a syntax failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SyntaxFailure);
      expect(error).toMatchObject({ span: { start: { column, line: 1 } } });
    }
  });
});
