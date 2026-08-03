import { describe, expect, test } from "bun:test";

import { gcd, isPrime, lcm, operate } from "./math";

describe("GCD/LCM instrument math", () => {
  test("computes exact operations", () => {
    expect(gcd(18, 24)).toBe(6);
    expect(lcm(18, 24)).toBe(72);
    expect(operate("gcd", 14, 21)).toBe(7);
    expect(operate("lcm", 14, 21)).toBe(42);
  });

  test("classifies prime results", () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(47)).toBe(true);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(49)).toBe(false);
  });

  test("rejects invalid integer inputs", () => {
    expect(() => gcd(0, 2)).toThrow(RangeError);
    expect(() => lcm(2.5, 4)).toThrow(RangeError);
  });
});
