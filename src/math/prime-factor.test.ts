import { describe, expect, test } from "bun:test";
import { primeValuation, removePrimePowers } from "./prime-factor";

describe("prime-factor arithmetic", () => {
  test("counts and removes powers", () => {
    expect(primeValuation(360, 2)).toBe(3);
    expect(removePrimePowers(360, 2)).toBe(45);
    expect(removePrimePowers(360, 2, 2)).toBe(90);
  });

  test("preserves signs and saturates removal depth", () => {
    expect(removePrimePowers(-360, 3)).toBe(-40);
    expect(removePrimePowers(12, 2, 20)).toBe(3);
  });

  test("keeps zero undefined", () => {
    expect(primeValuation(0, 2)).toBeNull();
    expect(removePrimePowers(0, 2)).toBeNull();
  });

  test("rejects invalid primes and depths", () => {
    expect(() => primeValuation(12, 4)).toThrow(RangeError);
    expect(() => removePrimePowers(12, 2, -1)).toThrow(RangeError);
  });
});
