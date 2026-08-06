import { describe, expect, test } from "bun:test";

import { createInitialState } from "../core/state";
import { compilePreparedDemo } from "./prepared-demo";
import { createFrameDraw } from "./create-frame-draw";

const oneCellExtent = {
  columns: 1,
  maxX: 31,
  maxY: 62,
  minX: 31,
  minY: 62,
  rows: 1,
};

describe("browser frame draw selection", () => {
  test("adapts a validated program to a prepared draw", () => {
    const draw = createFrameDraw(
      { ...createInitialState(), cursor: { x: 31, y: 62 } },
      oneCellExtent,
      compilePreparedDemo(),
    );

    expect(draw.preparedFrame?.selectedCell?.evaluation.lens).toEqual({
      kind: "number",
      value: 2,
    });
    expect({ cells: draw.cellCount, columns: draw.columns, rows: draw.rows })
      .toEqual({ cells: 1, columns: 1, rows: 1 });
  });

  test("keeps the legacy frame path available", () => {
    const draw = createFrameDraw(createInitialState(), oneCellExtent, null);
    expect(draw.preparedFrame).toBeNull();
    expect(draw.cellCount).toBe(1);
  });
});
