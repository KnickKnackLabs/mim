import { describe, expect, test } from "bun:test";
import {
  greatestCommonDivisor,
  integerDivisorCount,
  leastCommonMultiple,
} from "./integer";

describe("integer arithmetic", () => {
  test("computes signed GCD and LCM inputs exactly", () => {
    expect(greatestCommonDivisor(-14, 21)).toBe(7);
    expect(leastCommonMultiple(-14, 21)).toBe(42);
    expect(leastCommonMultiple(0, 21)).toBe(0);
  });

  test("counts positive divisors and leaves zero undefined", () => {
    expect(integerDivisorCount(-36)).toBe(9);
    expect(integerDivisorCount(0)).toBeNull();
  });

  test("rejects unsafe integer domains and results", () => {
    expect(() => greatestCommonDivisor(0.5, 2)).toThrow(RangeError);
    expect(() => leastCommonMultiple(Number.MAX_SAFE_INTEGER, 2)).toThrow(RangeError);
  });
});
