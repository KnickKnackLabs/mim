import { describe, expect, test } from "bun:test";
import type { ProgramValidationCode } from "./diagnostics";
import { parseAst, PROVING_PROGRAM, replaceLine } from "./test-support";
import { validateProgram } from "./validate-program";

function codes(source: string): ProgramValidationCode[] {
  const result = validateProgram(parseAst(source));
  expect(result.ok).toBe(false);
  return result.ok ? [] : result.diagnostics.map((diagnostic) => diagnostic.code);
}

describe("program structure validation", () => {
  test("rejects unsupported versions", () => {
    expect(codes(replaceLine(PROVING_PROGRAM, ":mim", ":mim 2")))
      .toContain("unsupported-version");
  });

  test("requires both axes and each value channel", () => {
    const result = codes(`:mim 1\n`);
    expect(result.filter((code) => code === "missing-axis")).toHaveLength(2);
    expect(result.filter((code) => code === "missing-statement")).toHaveLength(3);
  });

  test("rejects duplicate axes and value channels", () => {
    const source = `${PROVING_PROGRAM}:axis x primes\n:field gcd(x, y)\n`;
    const result = codes(source);
    expect(result).toContain("duplicate-axis");
    expect(result).toContain("duplicate-statement");
  });

  test("rejects unknown axis names and definitions", () => {
    expect(codes(replaceLine(PROVING_PROGRAM, ":axis x", ":axis z integers")))
      .toContain("invalid-axis");
    expect(codes(replaceLine(PROVING_PROGRAM, ":axis x", ":axis x squares")))
      .toContain("invalid-axis");
  });

  test("rejects unknown overlays and states", () => {
    expect(codes(replaceLine(PROVING_PROGRAM, ":overlay", ":overlay diagonal off")))
      .toContain("invalid-overlay");
    expect(codes(replaceLine(PROVING_PROGRAM, ":overlay", ":overlay equality maybe")))
      .toContain("invalid-overlay");
  });

  test("rejects duplicate equality overlays", () => {
    expect(codes(`${PROVING_PROGRAM}:overlay equality on\n`))
      .toContain("duplicate-statement");
  });
});
