import { describe, expect, test } from "bun:test";
import { prepareFrame } from "./prepare-frame";
import { validatedProgram } from "./test-support";

describe("frame preparation boundaries", () => {
  test("skips indices outside an axis domain", () => {
    const result = prepareFrame(validatedProgram(), {
      bounds: { maxX: 1, maxY: 0, minX: 0, minY: -1 },
    });
    expect(result.kind).toBe("prepared");
    if (result.kind !== "prepared") return;
    expect(result.frame.rows).toBe(2);
    expect(result.frame.cells.map((cell) => [cell.column, cell.row, cell.y]))
      .toEqual([[0, 0, 2], [1, 0, 2]]);
  });

  test("returns invalid parameter diagnostics before cell work", () => {
    expect(prepareFrame(validatedProgram(), {
      bounds: { maxX: 0, maxY: 0, minX: 0, minY: 0 },
      parameters: { p: 4 },
    })).toMatchObject({
      diagnostics: [{ code: "invalid-prime-parameter", parameter: "p" }],
      frame: null,
      kind: "invalid-parameters",
    });
  });

  test("rejects invalid bounds", () => {
    const program = validatedProgram();
    expect(() => prepareFrame(program, {
      bounds: { maxX: -1, maxY: 0, minX: 0, minY: 0 },
    })).toThrow("must not be inverted");
    expect(() => prepareFrame(program, {
      bounds: { maxX: 0.5, maxY: 0, minX: 0, minY: 0 },
    })).toThrow("must be safe integers");
  });
});
