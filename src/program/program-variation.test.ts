import { describe, expect, test } from "bun:test";
import type { ProgramValidationCode } from "./diagnostics";
import { parseAst, PROVING_PROGRAM } from "./test-support";
import { validateProgram } from "./validate-program";

function withVariation(statement: string, parameter = ":param phase number = 0"): string {
  return PROVING_PROGRAM.replace(
    ":axis x integers",
    `${parameter}\n${statement}\n:axis x integers`,
  );
}

function codes(source: string): ProgramValidationCode[] {
  const result = validateProgram(parseAst(source));
  return result.ok ? [] : result.diagnostics.map((diagnostic) => diagnostic.code);
}

describe("program variation validation", () => {
  test.each(["loop", "once", "pingpong"])("accepts %s variation", (mode) => {
    const result = validateProgram(parseAst(
      withVariation(`:vary phase from 0 to 31 over 8s ${mode}`),
    ));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.variations).toEqual([expect.objectContaining({
      durationSeconds: 8,
      from: 0,
      mode,
      parameter: "phase",
      to: 31,
    })]);
  });

  test("requires the explicit start to match the declared value", () => {
    expect(codes(withVariation(":vary phase from 1 to 31 over 8s loop")))
      .toContain("invalid-variation");
  });

  test("allows only declared number parameters to vary", () => {
    expect(codes(withVariation(":vary missing from 0 to 1 over 1s once")))
      .toContain("invalid-variation");
    expect(codes(withVariation(
      ":vary p from 31 to 37 over 1s once",
      ":param p prime = 31",
    ))).toContain("invalid-variation");
  });

  test("rejects duplicate, stationary, nonpositive, and unknown variations", () => {
    const duplicate = withVariation(
      ":vary phase from 0 to 1 over 1s loop\n:vary phase from 0 to 2 over 1s loop",
    );
    expect(codes(duplicate)).toContain("duplicate-variation");
    expect(codes(withVariation(":vary phase from 0 to 0 over 1s loop")))
      .toContain("invalid-variation");
    expect(codes(withVariation(":vary phase from 0 to 1 over 0s loop")))
      .toContain("invalid-variation");
    expect(codes(withVariation(":vary phase from 0 to 1 over 1s random")))
      .toContain("invalid-variation");
  });
});
