import { describe, expect, test } from "bun:test";
import type { EvaluatedCell, EvaluationResult } from "./types";
import { resolveCellPaint } from "./resolve-paint";

const span = {
  end: { column: 2, line: 1, offset: 1 },
  start: { column: 1, line: 1, offset: 0 },
};

function cell(color: EvaluationResult | null): EvaluatedCell {
  return {
    color,
    field: { kind: "number", value: 1 },
    lens: { kind: "number", value: 1 },
    parameters: {},
  };
}

describe("prepared cell paint", () => {
  test("gives exact values stable distinct hues", () => {
    const first = resolveCellPaint(cell({ kind: "color", mode: "exact", value: 7 }), 10);
    expect(resolveCellPaint(cell({ kind: "color", mode: "exact", value: 7 }), 100)).toEqual(first);
    expect(resolveCellPaint(cell({ kind: "color", mode: "exact", value: 11 }), 10)).not.toEqual(first);
  });

  test("normalizes magnitude against the visible maximum", () => {
    expect(resolveCellPaint(cell({ kind: "color", mode: "magnitude", value: 100 }), 100))
      .toMatchObject({ hue: 204, kind: "hsl", lightness: 58, saturation: 80 });
    expect(resolveCellPaint(cell({ kind: "color", mode: "magnitude", value: -100 }), 100))
      .toMatchObject({ hue: 326, kind: "hsl", lightness: 58, saturation: 80 });
  });

  test("distinguishes zero and invalid evaluation", () => {
    expect(resolveCellPaint(cell({ kind: "color", mode: "magnitude", value: 0 }), 0))
      .toMatchObject({ kind: "hsl", lightness: 15 });
    const invalid = cell(null);
    invalid.lens = { code: "domain", kind: "undefined", message: "undefined", span };
    expect(resolveCellPaint(invalid, 1)).toEqual({ kind: "undefined" });
  });
});
