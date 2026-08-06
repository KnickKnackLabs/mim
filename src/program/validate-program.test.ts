import { describe, expect, test } from "bun:test";
import { validateProgram } from "./validate-program";
import { parseAst, PROVING_PROGRAM } from "./test-support";

describe("validateProgram", () => {
  test("validates the first proving program", () => {
    const result = validateProgram(parseAst(PROVING_PROGRAM));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.kind).toBe("validated-program");
    expect(result.program.version).toBe(1);
    expect(result.program.axes.x.definition).toBe("integers");
    expect(result.program.axes.y.definition).toBe("primes");
    expect(result.program.parameters).toEqual([
      expect.objectContaining({ initialValue: 31, kind: "prime", name: "p" }),
    ]);
    expect(result.program.overlays).toEqual({ equality: false });
    expect(result.program.field).toEqual(expect.objectContaining({
      functionName: "lcm",
      kind: "call",
      valueType: "number",
    }));
    expect(result.program.lens).toEqual(expect.objectContaining({
      functionName: "strip",
      kind: "call",
      valueType: "number",
    }));
    expect(result.program.color).toEqual(expect.objectContaining({
      functionName: "exact",
      kind: "call",
      valueType: "color",
    }));
  });

  test("produces a serializable program with no functions", () => {
    const result = validateProgram(parseAst(PROVING_PROGRAM));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const json = JSON.stringify(result.program);
    expect(JSON.parse(json)).toEqual(result.program);
    expect(json).not.toContain("evaluate");
  });

  test("defaults the equality overlay on", () => {
    const source = PROVING_PROGRAM.replace(":overlay equality off\n", "");
    const result = validateProgram(parseAst(source));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.program.overlays.equality).toBe(true);
  });
});
