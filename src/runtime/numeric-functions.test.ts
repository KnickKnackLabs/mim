import { describe, expect, test } from "bun:test";
import { evaluateCell } from "./evaluate-cell";
import { replaceRuntimeLine, validatedProgram } from "./test-support";

function evaluate(expression: string) {
  const program = validatedProgram(replaceRuntimeLine(":field", `:field ${expression}`));
  const result = evaluateCell(program, { x: 1, xi: 1, y: 1, yi: 1 });
  expect(result.kind).toBe("evaluated");
  if (result.kind !== "evaluated") throw new Error("parameters did not bind");
  return result.cell.field;
}

describe("numeric runtime functions", () => {
  test.each([
    ["abs(-9)", 9],
    ["min(8, 3)", 3],
    ["max(8, 3)", 8],
    ["gcd(-14, 21)", 7],
    ["lcm(-14, 21)", 42],
    ["coprime(14, 25)", 1],
    ["divides(7, 21)", 1],
    ["divisors(36)", 9],
    ["mod(-7, 5)", 3],
    ["prime(31)", 1],
    ["xor(10, 12)", 6],
  ])("evaluates %s", (expression, expected) => {
    expect(evaluate(expression)).toEqual({ kind: "number", value: expected });
  });

  test("reports domains with no value", () => {
    expect(evaluate("divisors(0)")).toMatchObject({
      code: "divisors-at-zero",
      kind: "undefined",
    });
    expect(evaluate("mod(3, 0)")).toMatchObject({
      code: "modulo-by-zero",
      kind: "undefined",
    });
  });

  test.each(["gcd(1 / 2, 4)", "divides(1 / 2, 4)"])(
    "reports the invalid integer domain for %s",
    (expression) => {
      expect(evaluate(expression)).toMatchObject({
        code: "invalid-function-domain",
        kind: "error",
      });
    },
  );
});
