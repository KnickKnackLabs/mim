import { describe, expect, test } from "bun:test";

import { SyntaxFailure } from "./diagnostics";
import { ExpressionLexer } from "./lexer";
import type { SourcePosition } from "./source";

const START: SourcePosition = { column: 5, line: 3, offset: 20 };

function tokens(source: string) {
  const lexer = new ExpressionLexer(source, START);
  const result = [];
  while (true) {
    const token = lexer.next();
    result.push(token);
    if (token.kind === "eof") return result;
  }
}

describe("ExpressionLexer", () => {
  test("lexes names, numbers, punctuation, and operators", () => {
    expect(tokens(" alpha_2(31.5, x) <= y != 0 ").map((token) => [
      token.kind,
      token.value,
    ])).toEqual([
      ["identifier", "alpha_2"],
      ["operator", "("],
      ["number", "31.5"],
      ["operator", ","],
      ["identifier", "x"],
      ["operator", ")"],
      ["operator", "<="],
      ["identifier", "y"],
      ["operator", "!="],
      ["number", "0"],
      ["eof", ""],
    ]);
  });

  test("recognizes every expression operator", () => {
    const source = "+ - * / % == != < <= > >= !";
    expect(tokens(source).map((token) => token.value).slice(0, -1)).toEqual([
      "+", "-", "*", "/", "%", "==", "!=", "<", "<=", ">", ">=", "!",
    ]);
  });

  test("tracks absolute source spans through whitespace", () => {
    const [name, plus, value, eof] = tokens("  x + 12  ");
    expect(name.span).toEqual({
      start: { column: 7, line: 3, offset: 22 },
      end: { column: 8, line: 3, offset: 23 },
    });
    expect(plus.span.start.column).toBe(9);
    expect(value.span).toMatchObject({
      start: { column: 11, offset: 26 },
      end: { column: 13, offset: 28 },
    });
    expect(eof.span.start).toEqual({ column: 15, line: 3, offset: 30 });
  });

  test("reports the exact invalid character", () => {
    const lexer = new ExpressionLexer("x + @", START);
    lexer.next();
    lexer.next();
    try {
      lexer.next();
      throw new Error("expected a syntax failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SyntaxFailure);
      expect(error).toMatchObject({
        message: "unexpected \"@\"",
        span: {
          start: { column: 9, line: 3, offset: 24 },
          end: { column: 10, line: 3, offset: 25 },
        },
      });
    }
  });
});
