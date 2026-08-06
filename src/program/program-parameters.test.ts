import { describe, expect, test } from "bun:test";
import type { ProgramValidationCode } from "./diagnostics";
import { parseAst, PROVING_PROGRAM, replaceLine } from "./test-support";
import { validateProgram } from "./validate-program";

function codes(source: string): ProgramValidationCode[] {
  const result = validateProgram(parseAst(source));
  return result.ok ? [] : result.diagnostics.map((diagnostic) => diagnostic.code);
}

describe("program parameter validation", () => {
  test("rejects duplicate parameters", () => {
    expect(codes(`${PROVING_PROGRAM}:param p prime = 37\n`))
      .toContain("duplicate-parameter");
  });

  test("rejects reserved parameter names", () => {
    const source = replaceLine(PROVING_PROGRAM, ":param", ":param x prime = 31");
    expect(codes(source)).toContain("reserved-name");
  });

  test("rejects unknown parameter types", () => {
    const source = replaceLine(PROVING_PROGRAM, ":param", ":param p integer = 31");
    expect(codes(source)).toContain("unknown-parameter-type");
  });

  test("rejects composite prime initial values without unknown-name cascades", () => {
    const source = replaceLine(PROVING_PROGRAM, ":param", ":param p prime = 21");
    expect(codes(source)).toEqual(["invalid-parameter"]);
  });

  test("rejects expression-valued prime initial values", () => {
    const source = replaceLine(PROVING_PROGRAM, ":param", ":param p prime = 29 + 2");
    expect(codes(source)).toContain("invalid-parameter");
  });

  test("makes valid parameters available to lens expressions", () => {
    const result = validateProgram(parseAst(PROVING_PROGRAM));
    expect(result.ok).toBe(true);
    if (!result.ok || result.program.lens.kind !== "call") return;
    expect(result.program.lens.arguments[1]).toEqual(expect.objectContaining({
      kind: "parameter-reference",
      name: "p",
    }));
  });
});
