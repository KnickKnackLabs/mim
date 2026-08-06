import { describe, expect, test } from "bun:test";

import { prepareFrame } from "../runtime";
import {
  compilePreparedDemo,
  preparedDemoEnabled,
  PREPARED_DEMO_SOURCE,
} from "./prepared-demo";

describe("prepared frame demo", () => {
  test("uses the new path unless legacy is explicit", () => {
    expect(preparedDemoEnabled("")).toBe(true);
    expect(preparedDemoEnabled("#prepared")).toBe(true);
    expect(preparedDemoEnabled("#legacy")).toBe(false);
  });

  test("compiles the embedded proving program", () => {
    const program = compilePreparedDemo();
    expect(PREPARED_DEMO_SOURCE).toContain(":lens strip(value, p)");
    expect(program.axes).toEqual({
      x: expect.objectContaining({ definition: "integers" }),
      y: expect.objectContaining({ definition: "integers" }),
    });
    expect(program.parameters).toEqual([
      expect.objectContaining({ initialValue: 31, kind: "prime", name: "p" }),
    ]);
  });

  test("prepares selected field and lensed values", () => {
    const preparation = prepareFrame(compilePreparedDemo(), {
      bounds: { maxX: 31, maxY: 62, minX: 31, minY: 62 },
      selected: { column: 31, row: 62 },
    });
    expect(preparation.kind).toBe("prepared");
    if (preparation.kind !== "prepared") throw new Error("expected a frame");

    expect(preparation.frame.selectedCell?.evaluation.field).toEqual({
      kind: "number",
      value: 62,
    });
    expect(preparation.frame.selectedCell?.evaluation.lens).toEqual({
      kind: "number",
      value: 2,
    });
    expect(preparation.frame.selectedCell?.paint.kind).toBe("hsl");
  });
});
