import { describe, expect, test } from "bun:test";
import { evaluateCell } from "./evaluate-cell";
import { replaceRuntimeLine, validatedProgram } from "./test-support";

function fieldResult(expression: string, x = 3, y = 4) {
  const program = validatedProgram(replaceRuntimeLine(":field", `:field ${expression}`));
  const result = evaluateCell(program, { x, xi: 2, y, yi: 5 });
  expect(result.kind).toBe("evaluated");
  if (result.kind !== "evaluated") throw new Error("parameters did not bind");
  return result.cell.field;
}

describe("runtime expression evaluation", () => {
  test("evaluates inputs, indices, unary operators, and arithmetic", () => {
    expect(fieldResult("-x + y * xi - yi")).toEqual({ kind: "number", value: 0 });
  });

  test("evaluates comparisons as numeric truth values", () => {
    expect(fieldResult("x < y")).toEqual({ kind: "number", value: 1 });
    expect(fieldResult("x == y")).toEqual({ kind: "number", value: 0 });
  });

  test("uses Euclidean modulo for negative values", () => {
    expect(fieldResult("-7 % 5")).toEqual({ kind: "number", value: 3 });
  });

  test("reports undefined division instead of converting it to zero", () => {
    expect(fieldResult("x / 0")).toMatchObject({
      code: "division-by-zero",
      kind: "undefined",
    });
  });

  test("evaluates only the selected if branch", () => {
    expect(fieldResult("if(x, y, 1 / 0)", 1, 9)).toEqual({ kind: "number", value: 9 });
    expect(fieldResult("if(x, y, 1 / 0)", 0, 9)).toMatchObject({
      code: "division-by-zero",
      kind: "undefined",
    });
  });

  test("reports unsafe integer results", () => {
    expect(fieldResult("9007199254740991 + 1")).toMatchObject({
      code: "unsafe-integer",
      kind: "error",
    });
  });
});
