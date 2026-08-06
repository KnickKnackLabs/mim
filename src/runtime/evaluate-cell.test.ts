import { describe, expect, test } from "bun:test";
import { bindParameters } from "./bind-parameters";
import { evaluateCell } from "./evaluate-cell";
import { replaceRuntimeLine, validatedProgram } from "./test-support";

describe("validated program cell evaluation", () => {
  test("binds the initial prime parameter", () => {
    expect(bindParameters(validatedProgram())).toEqual({
      diagnostics: [],
      kind: "bound",
      values: { p: 31 },
    });
  });

  test("rejects invalid and unknown parameter overrides", () => {
    expect(bindParameters(validatedProgram(), { p: 32, q: 5 })).toMatchObject({
      diagnostics: [
        { code: "unknown-parameter", parameter: "q" },
        { code: "invalid-prime-parameter", parameter: "p" },
      ],
      kind: "invalid",
      values: null,
    });
  });

  test("evaluates field, lens, and color in order", () => {
    const result = evaluateCell(validatedProgram(), { x: 62, xi: 4, y: 31, yi: 11 });
    expect(result).toMatchObject({
      cell: {
        color: { kind: "color", mode: "exact", value: 2 },
        field: { kind: "number", value: 62 },
        lens: { kind: "number", value: 2 },
        parameters: { p: 31 },
      },
      diagnostics: [],
      kind: "evaluated",
    });
  });

  test("evaluates magnitude color intent without resolving browser paint", () => {
    const program = validatedProgram(replaceRuntimeLine(":color", ":color magnitude(lens)"));
    const result = evaluateCell(program, { x: 62, xi: 4, y: 31, yi: 11 });
    expect(result.kind === "evaluated" ? result.cell.color : null).toEqual({
      kind: "color",
      mode: "magnitude",
      value: 2,
    });
  });

  test("uses validated prime and number parameter overrides", () => {
    const source = replaceRuntimeLine(
      ":param",
      ":param p prime = 31\n:param phase number = 0",
    )
      .replace(":field lcm(x, y)", ":field x + phase")
      .replace(":lens strip(value, p)", ":lens value");
    const result = evaluateCell(
      validatedProgram(source),
      { x: 62, xi: 4, y: 31, yi: 11 },
      { p: 2, phase: 0.5 },
    );
    expect(result.kind === "evaluated" ? result.cell : null).toMatchObject({
      field: { kind: "number", value: 62.5 },
      lens: { kind: "number", value: 62.5 },
      parameters: { p: 2, phase: 0.5 },
    });
  });

  test("stops downstream channels after a field failure", () => {
    const program = validatedProgram(replaceRuntimeLine(":field", ":field x / 0"));
    const result = evaluateCell(program, { x: 2, xi: 1, y: 3, yi: 1 });
    expect(result.kind === "evaluated" ? result.cell : null).toMatchObject({
      color: null,
      field: { code: "division-by-zero", kind: "undefined" },
      lens: null,
    });
  });

  test("stops color after a lens failure", () => {
    const program = validatedProgram(replaceRuntimeLine(":field", ":field 0"));
    const result = evaluateCell(program, { x: 2, xi: 1, y: 3, yi: 1 });
    expect(result.kind === "evaluated" ? result.cell : null).toMatchObject({
      color: null,
      field: { kind: "number", value: 0 },
      lens: { code: "strip-at-zero", kind: "undefined" },
    });
  });
});
