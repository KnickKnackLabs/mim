import { describe, expect, test } from "bun:test";
import type { VariationMode, VariationPlan } from "../program";
import { variationOverridesAt, variationValueAt } from "./evaluate-variation";

const span = {
  end: { column: 1, line: 1, offset: 0 },
  start: { column: 1, line: 1, offset: 0 },
};

function plan(mode: VariationMode, from = 0, to = 8): VariationPlan {
  return {
    durationSeconds: 4,
    from,
    mode,
    parameter: "phase",
    span,
    to,
  };
}

describe("timeline variation evaluation", () => {
  test("loop wraps after each one-way duration", () => {
    const variation = plan("loop");
    expect(variationValueAt(variation, 0)).toBe(0);
    expect(variationValueAt(variation, 2)).toBe(4);
    expect(variationValueAt(variation, 4)).toBe(0);
    expect(variationValueAt(variation, 6)).toBe(4);
  });

  test("pingpong reverses after each one-way duration", () => {
    const variation = plan("pingpong");
    expect(variationValueAt(variation, 0)).toBe(0);
    expect(variationValueAt(variation, 2)).toBe(4);
    expect(variationValueAt(variation, 4)).toBe(8);
    expect(variationValueAt(variation, 6)).toBe(4);
    expect(variationValueAt(variation, 8)).toBe(0);
  });

  test("once reaches the destination and holds it", () => {
    const variation = plan("once", 8, -4);
    expect(variationValueAt(variation, 0)).toBe(8);
    expect(variationValueAt(variation, 2)).toBe(2);
    expect(variationValueAt(variation, 4)).toBe(-4);
    expect(variationValueAt(variation, 40)).toBe(-4);
  });

  test("produces overrides for every independent variation", () => {
    const variations = [
      plan("loop"),
      { ...plan("pingpong", 10, 20), parameter: "shift" },
    ];
    expect(variationOverridesAt(variations, 2)).toEqual({ phase: 4, shift: 15 });
    expect(variationOverridesAt([], 2)).toEqual({});
  });

  test("rejects invalid logical elapsed time", () => {
    expect(() => variationValueAt(plan("loop"), -1)).toThrow(RangeError);
    expect(() => variationOverridesAt([], Number.NaN)).toThrow(RangeError);
  });
});
