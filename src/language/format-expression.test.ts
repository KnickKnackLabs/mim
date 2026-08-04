import { describe, expect, test } from "bun:test";

import { formatExpression } from "./format-expression";
import { parseExpressionSource } from "./parse-expression";

function canonical(source: string): string {
  return formatExpression(parseExpressionSource(source, {
    column: 1,
    line: 1,
    offset: 0,
  }));
}

describe("formatExpression", () => {
  test.each([
    ["x+y*2", "x + y * 2"],
    ["(x+y)*2", "(x + y) * 2"],
    ["x-(y-z)", "x - (y - z)"],
    ["-(x+y)", "-(x + y)"],
    ["!!x", "!!x"],
    ["gcd(x,y+1)", "gcd(x, y + 1)"],
    ["x<y==prime(y)", "x < y == prime(y)"],
    ["01.50", "1.5"],
  ])("canonicalizes %p", (source, expected) => {
    expect(canonical(source)).toBe(expected);
  });

  test("is stable after reparsing", () => {
    const once = canonical("if(x>=y,remove(x,2,3),-y%4)");
    expect(canonical(once)).toBe(once);
  });
});
