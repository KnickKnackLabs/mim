import { describe, expect, test } from "bun:test";

import { parseProgram } from "./parse-program";

const PROVING_PROGRAM = `
:mim 1
:param p prime = 31
:axis x integers
:axis y integers
:field lcm(x, y)
:lens strip(value, p)
:color exact(lens)
:overlay equality off
`;

describe("parseProgram", () => {
  test("parses the first proving program", () => {
    const result = parseProgram(PROVING_PROGRAM);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected program to parse");

    expect(result.ast.version).toBe(1);
    expect(result.ast.statements.map((statement) => statement.kind)).toEqual([
      "mim",
      "parameter",
      "axis",
      "axis",
      "field",
      "lens",
      "color",
      "overlay",
    ]);
    expect(result.ast.statements[1]).toMatchObject({
      kind: "parameter",
      name: "p",
      parameterType: "prime",
    });
    expect(result.ast.statements[4]).toMatchObject({
      expression: {
        arguments: [
          { kind: "identifier", name: "x" },
          { kind: "identifier", name: "y" },
        ],
        callee: "lcm",
        kind: "call",
      },
      kind: "field",
    });
  });

  test("ignores blank lines and comments", () => {
    const result = parseProgram(`# a mim program\n:mim 1\n\n:field x + y # sum\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected program to parse");
    expect(result.ast.statements).toHaveLength(2);
  });

  test("reports source-located statement and expression errors", () => {
    const result = parseProgram(`:mim 1\n:wat x\n:field gcd(x, @)\n`);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected diagnostics");

    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toMatchObject({
      code: "unknown-statement",
      span: { start: { column: 1, line: 2 } },
    });
    expect(result.diagnostics[1]).toMatchObject({
      code: "syntax",
      span: { start: { column: 15, line: 3 } },
    });
  });

  test("requires one leading version statement", () => {
    const missing = parseProgram(":field x\n");
    expect(missing.ok).toBe(false);
    if (missing.ok) throw new Error("expected missing version");
    expect(missing.diagnostics.map((item) => item.code)).toEqual(["missing-version"]);

    const duplicate = parseProgram(":mim 1\n:field x\n:mim 1\n");
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) throw new Error("expected duplicate version");
    expect(duplicate.diagnostics.map((item) => item.code)).toEqual(["duplicate-version"]);

    const late = parseProgram(":field x\n:mim 1\n");
    expect(late.ok).toBe(false);
    if (late.ok) throw new Error("expected version order error");
    expect(late.diagnostics.map((item) => item.code)).toEqual(["version-order"]);
  });
});
