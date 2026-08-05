import { describe, expect, test } from "bun:test";
import { runtimeAxisValue } from "./axis-values";

describe("runtime axis values", () => {
  test("maps integer indices directly", () => {
    expect([-2, -1, 0, 1, 2].map((index) => runtimeAxisValue("integers", index)))
      .toEqual([-2, -1, 0, 1, 2]);
  });

  test("maps nonnegative indices to primes", () => {
    expect([-1, 0, 1, 2, 3, 4].map((index) => runtimeAxisValue("primes", index)))
      .toEqual([null, 2, 3, 5, 7, 11]);
  });

  test("rejects invalid indices and impossible validated definitions", () => {
    expect(runtimeAxisValue("integers", 0.5)).toBeNull();
    expect(() => runtimeAxisValue("missing", 0)).toThrow("unsupported validated axis");
  });
});
