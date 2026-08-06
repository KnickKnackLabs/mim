import { describe, expect, test } from "bun:test";
import type { ProgramValidationCode } from "./diagnostics";
import { parseAst, PROVING_PROGRAM, replaceLine } from "./test-support";
import { validateProgram } from "./validate-program";

function codes(source: string): ProgramValidationCode[] {
  const result = validateProgram(parseAst(source));
  return result.ok ? [] : result.diagnostics.map((diagnostic) => diagnostic.code);
}

describe("program expression validation", () => {
  test("resolves field inputs and parameters", () => {
    const source = replaceLine(PROVING_PROGRAM, ":field", ":field x + yi + p");
    expect(validateProgram(parseAst(source)).ok).toBe(true);
  });

  test("limits names to each channel context", () => {
    expect(codes(replaceLine(PROVING_PROGRAM, ":lens", ":lens x")))
      .toContain("unknown-name");
    expect(codes(replaceLine(PROVING_PROGRAM, ":color", ":color exact(x)")))
      .toContain("unknown-name");
  });

  test("rejects unknown names and functions", () => {
    expect(codes(replaceLine(PROVING_PROGRAM, ":field", ":field mystery")))
      .toContain("unknown-name");
    expect(codes(replaceLine(PROVING_PROGRAM, ":field", ":field mystery(x)")))
      .toContain("unknown-function");
  });

  test("checks function arity", () => {
    expect(codes(replaceLine(PROVING_PROGRAM, ":field", ":field gcd(x)")))
      .toContain("wrong-arity");
    expect(codes(replaceLine(PROVING_PROGRAM, ":lens", ":lens remove(value, p)")))
      .toContain("wrong-arity");
  });

  test("checks channel result types", () => {
    expect(codes(replaceLine(PROVING_PROGRAM, ":field", ":field exact(x)")))
      .toContain("type-mismatch");
    expect(codes(replaceLine(PROVING_PROGRAM, ":color", ":color lens")))
      .toContain("type-mismatch");
  });

  test("checks argument types", () => {
    const source = replaceLine(PROVING_PROGRAM, ":color", ":color exact(exact(lens))");
    expect(codes(source)).toContain("type-mismatch");
  });
});
