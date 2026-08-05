import { describe, expect, test } from "bun:test";
import { isPrimeInteger } from "./prime";

describe("isPrimeInteger", () => {
  test("recognizes prime integers", () => {
    expect([2, 3, 31, 97].map(isPrimeInteger)).toEqual([true, true, true, true]);
  });

  test("rejects non-prime domains", () => {
    expect([-3, 0, 1, 4, 21, 2.5, Number.MAX_VALUE].map(isPrimeInteger))
      .toEqual([false, false, false, false, false, false, false]);
  });
});
