import { describe, expect, test } from "bun:test";
import type { VariationMode, VariationPlan } from "../program";
import { variationOverridesAt, variationValueAt } from "./evaluate-variation";

const span = {
  end: { column: 1, line: 1, offset: 0 },
  start: { column: 1, line: 1, offset: 0 },
};

function linear(mode: VariationMode, from = 0, to = 8): VariationPlan {
  return {
    durationSeconds: 4,
    from,
    kind: "linear",
    mode,
    parameter: "phase",
    span,
    to,
  };
}

function discrete(mode: VariationMode): VariationPlan {
  return {
    everySeconds: 0.5,
    kind: "discrete",
    mode,
    parameter: "p",
    span,
    values: [2, 3, 5, 7],
  };
}

describe("timeline variation evaluation", () => {
  test("linear loop wraps after each one-way duration", () => {
    const variation = linear("loop");
    expect(variationValueAt(variation, 0)).toBe(0);
    expect(variationValueAt(variation, 2)).toBe(4);
    expect(variationValueAt(variation, 4)).toBe(0);
    expect(variationValueAt(variation, 6)).toBe(4);
  });

  test("linear pingpong reverses after each one-way duration", () => {
    const variation = linear("pingpong");
    expect(variationValueAt(variation, 0)).toBe(0);
    expect(variationValueAt(variation, 2)).toBe(4);
    expect(variationValueAt(variation, 4)).toBe(8);
    expect(variationValueAt(variation, 6)).toBe(4);
    expect(variationValueAt(variation, 8)).toBe(0);
  });

  test("linear once reaches the destination and holds it", () => {
    const variation = linear("once", 8, -4);
    expect(variationValueAt(variation, 0)).toBe(8);
    expect(variationValueAt(variation, 2)).toBe(2);
    expect(variationValueAt(variation, 4)).toBe(-4);
    expect(variationValueAt(variation, 40)).toBe(-4);
  });

  test("discrete loop advances one value per step and wraps", () => {
    const variation = discrete("loop");
    expect([0, 0.499, 0.5, 1, 1.5, 2].map(
      (elapsed) => variationValueAt(variation, elapsed),
    )).toEqual([2, 2, 3, 5, 7, 2]);
  });

  test("discrete pingpong reverses without duplicate endpoints", () => {
    const variation = discrete("pingpong");
    expect([0, 0.5, 1, 1.5, 2, 2.5, 3].map(
      (elapsed) => variationValueAt(variation, elapsed),
    )).toEqual([2, 3, 5, 7, 5, 3, 2]);
  });

  test("discrete once reaches the last value and holds it", () => {
    const variation = discrete("once");
    expect(variationValueAt(variation, 0)).toBe(2);
    expect(variationValueAt(variation, 0.5)).toBe(3);
    expect(variationValueAt(variation, 1.5)).toBe(7);
    expect(variationValueAt(variation, 40)).toBe(7);
  });

  test("produces overrides for every independent variation", () => {
    const variations = [
      linear("loop"),
      { ...discrete("pingpong"), parameter: "prime" },
    ];
    expect(variationOverridesAt(variations, 1)).toEqual({ phase: 2, prime: 5 });
    expect(variationOverridesAt([], 2)).toEqual({});
  });

  test("rejects invalid logical elapsed time", () => {
    expect(() => variationValueAt(linear("loop"), -1)).toThrow(RangeError);
    expect(() => variationOverridesAt([], Number.NaN)).toThrow(RangeError);
  });
});
