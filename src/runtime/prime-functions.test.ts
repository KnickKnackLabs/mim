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

describe("prime-factor runtime functions", () => {
  test("reports prime valuation", () => {
    expect(evaluate("valuation(360, 2)")).toEqual({ kind: "number", value: 3 });
  });

  test("strips every power while preserving sign", () => {
    expect(evaluate("strip(360, 2)")).toEqual({ kind: "number", value: 45 });
    expect(evaluate("strip(-360, 3)")).toEqual({ kind: "number", value: -40 });
  });

  test("removes at most the requested depth", () => {
    expect(evaluate("remove(360, 2, 0)")).toEqual({ kind: "number", value: 360 });
    expect(evaluate("remove(360, 2, 1)")).toEqual({ kind: "number", value: 180 });
    expect(evaluate("remove(360, 2, 10)")).toEqual({ kind: "number", value: 45 });
  });

  test.each(["valuation(0, 2)", "strip(0, 2)", "remove(0, 2, 1)"])(
    "keeps zero-domain behavior explicit for %s",
    (expression) => expect(evaluate(expression).kind).toBe("undefined"),
  );

  test("reports invalid primes and depths", () => {
    expect(evaluate("strip(12, 4)")).toMatchObject({
      code: "invalid-prime-function-domain",
      kind: "error",
    });
    expect(evaluate("remove(12, 2, -1)")).toMatchObject({
      code: "invalid-prime-function-domain",
      kind: "error",
    });
  });
});
