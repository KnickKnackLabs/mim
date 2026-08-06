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

function variation(statement: string, parameter?: string) {
  const result = validateProgram(parseAst(withVariation(statement, parameter)));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected valid variation");
  return result.program.variations[0];
}

describe("program variation validation", () => {
  test.each(["loop", "once", "pingpong"])("accepts %s linear variation", (mode) => {
    expect(variation(`:vary phase from 0 to 31 over 8s ${mode}`)).toEqual(
      expect.objectContaining({
        durationSeconds: 8,
        from: 0,
        kind: "linear",
        mode,
        parameter: "phase",
        to: 31,
      }),
    );
  });

  test("accepts explicit prime variation", () => {
    expect(variation(
      ":vary q through 2, 3, 5, 7 every 500ms pingpong",
      ":param q prime = 2",
    )).toEqual(expect.objectContaining({
      everySeconds: 0.5,
      kind: "discrete",
      mode: "pingpong",
      parameter: "q",
      values: [2, 3, 5, 7],
    }));
  });

  test.each([
    ["integers(-2, 2)", ":param phase number = -2", [-2, -1, 0, 1, 2]],
    ["integers(2, -2)", ":param phase number = 2", [2, 1, 0, -1, -2]],
    ["evens(2, 8)", ":param phase number = 2", [2, 4, 6, 8]],
    ["evens(8, 2)", ":param phase number = 8", [8, 6, 4, 2]],
    ["primes(2, 11)", ":param phase prime = 2", [2, 3, 5, 7, 11]],
    ["primes(11, 2)", ":param phase prime = 11", [11, 7, 5, 3, 2]],
  ])("expands %s inclusively", (sequence, parameter, values) => {
    expect(variation(
      `:vary phase through ${sequence} every 1s loop`,
      parameter as string,
    )).toEqual(expect.objectContaining({ values }));
  });

  test("requires every variation to start at the declared value", () => {
    expect(codes(withVariation(":vary phase from 1 to 31 over 8s loop")))
      .toContain("invalid-variation");
    expect(codes(withVariation(":vary phase through 1, 2 every 1s loop")))
      .toContain("invalid-variation");
  });

  test("keeps continuous variation limited to number parameters", () => {
    expect(codes(withVariation(":vary missing from 0 to 1 over 1s once")))
      .toContain("invalid-variation");
    expect(codes(withVariation(
      ":vary q from 31 to 37 over 1s once",
      ":param q prime = 31",
    ))).toContain("invalid-variation");
  });

  test("checks every discrete value against the parameter type", () => {
    expect(codes(withVariation(
      ":vary q through 2, 3, 4, 5 every 1s loop",
      ":param q prime = 2",
    ))).toContain("invalid-variation");
  });

  test.each([
    ":vary phase through unknown(0, 2) every 1s loop",
    ":vary phase through evens(0, 3) every 1s loop",
    ":vary phase through integers(0, 100001) every 1s loop",
    ":vary phase through integers(0, 4096) every 1s loop",
    ":vary phase through 0 every 1s loop",
    ":vary phase through 0, 1, 2 every 9007199254740991s once",
    ":vary phase through 0, 0 every 1s loop",
  ])("rejects invalid sequence %s", (statement) => {
    expect(codes(withVariation(statement))).toContain("invalid-variation");
  });

  test("rejects duplicate, stationary, nonpositive, and unknown variations", () => {
    const duplicate = withVariation(
      ":vary phase from 0 to 1 over 1s loop\n:vary phase through 0, 1 every 1s loop",
    );
    expect(codes(duplicate)).toContain("duplicate-variation");
    expect(codes(withVariation(":vary phase from 0 to 0 over 1s loop")))
      .toContain("invalid-variation");
    expect(codes(withVariation(":vary phase through 0, 1 every 0ms loop")))
      .toContain("invalid-variation");
    expect(codes(withVariation(":vary phase from 0 to 1 over 1s random")))
      .toContain("invalid-variation");
  });
});
