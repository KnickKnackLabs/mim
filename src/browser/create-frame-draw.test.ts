import { describe, expect, test } from "bun:test";

import { createInitialState } from "../core/state";
import { compilePreparedDemo } from "./prepared-demo";
import { createFrameDraw } from "./create-frame-draw";
import { loadBrowserProgram } from "./load-browser-program";

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

  test("passes timeline parameter overrides through frame preparation", () => {
    const loaded = loadBrowserProgram(`:mim 1
:param phase number = 0
:vary phase from 0 to 31 over 8s loop
:axis x integers
:axis y integers
:field x + phase
:lens value
:color exact(lens)
:overlay equality off
`);
    if (!loaded.ok) throw new Error("expected variation program to load");

    const draw = createFrameDraw(
      createInitialState(),
      oneCellExtent,
      loaded.loaded.program,
      { phase: 4 },
    );
    expect(draw.preparedFrame?.cells[0]?.evaluation.field).toEqual({
      kind: "number",
      value: 35,
    });
    expect(draw.preparedFrame?.parameters).toEqual({ phase: 4 });
  });

  test("keeps the legacy frame path available", () => {
    const draw = createFrameDraw(createInitialState(), oneCellExtent, null);
    expect(draw.preparedFrame).toBeNull();
    expect(draw.cellCount).toBe(1);
  });
});
