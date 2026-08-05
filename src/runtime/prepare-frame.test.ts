import { describe, expect, test } from "bun:test";
import { prepareFrame } from "./prepare-frame";
import { replaceRuntimeLine, validatedProgram } from "./test-support";

const bounds = { maxX: 2, maxY: 1, minX: 1, minY: 0 };

describe("validated program frame preparation", () => {
  test("evaluates every valid axis pair once", () => {
    const result = prepareFrame(validatedProgram(), { bounds, selected: { column: 2, row: 1 } });
    expect(result.kind).toBe("prepared");
    if (result.kind !== "prepared") return;
    expect(result.frame.cells.map((cell) => [
      cell.column,
      cell.row,
      cell.x,
      cell.y,
      cell.evaluation.field,
      cell.evaluation.lens,
    ])).toEqual([
      [1, 0, 1, 2, { kind: "number", value: 2 }, { kind: "number", value: 2 }],
      [2, 0, 2, 2, { kind: "number", value: 2 }, { kind: "number", value: 2 }],
      [1, 1, 1, 3, { kind: "number", value: 3 }, { kind: "number", value: 3 }],
      [2, 1, 2, 3, { kind: "number", value: 6 }, { kind: "number", value: 6 }],
    ]);
    expect(result.frame.selectedCell).toBe(result.frame.cells[3]);
    expect("parameters" in result.frame.cells[0].evaluation).toBe(false);
  });

  test("applies parameters and overlays consistently", () => {
    const source = replaceRuntimeLine(":overlay", ":overlay equality on");
    const result = prepareFrame(validatedProgram(source), { bounds, parameters: { p: 2 } });
    expect(result.kind).toBe("prepared");
    if (result.kind !== "prepared") return;
    expect(result.frame.parameters).toEqual({ p: 2 });
    expect(result.frame.cells.map((cell) => cell.evaluation.lens)).toEqual([
      { kind: "number", value: 1 },
      { kind: "number", value: 1 },
      { kind: "number", value: 3 },
      { kind: "number", value: 3 },
    ]);
    expect(result.frame.cells.filter((cell) => cell.overlays.equality).map((cell) => [cell.column, cell.row]))
      .toEqual([[2, 0]]);
  });

  test("uses one viewport maximum for magnitude paint", () => {
    const source = replaceRuntimeLine(":color", ":color magnitude(lens)");
    const result = prepareFrame(validatedProgram(source), { bounds });
    expect(result.kind).toBe("prepared");
    if (result.kind !== "prepared") return;
    expect(result.frame.maximumMagnitude).toBe(6);
    expect(result.frame.cells[3].paint).toMatchObject({ lightness: 58, saturation: 80 });
  });
});
