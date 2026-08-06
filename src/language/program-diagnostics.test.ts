import { describe, expect, test } from "bun:test";

import { parseProgram } from "./parse-program";

describe("program diagnostics and spans", () => {
  test("accumulates independent line errors in source order", () => {
    const result = parseProgram([
      ":mim 1",
      ":field x @ y",
      ":unknown thing",
      ":overlay equality",
      "",
    ].join("\n"));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected diagnostics");
    expect(result.diagnostics.map(({ code, span }) => ({
      code,
      column: span.start.column,
      line: span.start.line,
    }))).toEqual([
      { code: "syntax", column: 10, line: 2 },
      { code: "unknown-statement", column: 1, line: 3 },
      { code: "syntax", column: 18, line: 4 },
    ]);
  });

  test("reports malformed and missing versions together", () => {
    const result = parseProgram(":mim nope\n:field x\n");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected diagnostics");
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      "syntax",
      "missing-version",
    ]);
  });

  test("reports each duplicate version", () => {
    const result = parseProgram(":mim 1\n:mim 2\n:mim 3\n");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected diagnostics");
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      "duplicate-version",
      "duplicate-version",
    ]);
    expect(result.diagnostics.map((item) => item.span.start.line)).toEqual([2, 3]);
  });

  test("locates CRLF statements at their original offsets", () => {
    const result = parseProgram(":mim 1\r\n:field @\r\n");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected diagnostics");
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].span.start).toEqual({
      column: 8,
      line: 2,
      offset: 15,
    });
  });

  test("spans the complete successful source", () => {
    const source = ":mim 1\n:field x\n";
    const result = parseProgram(source);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected a program");
    expect(result.ast.span).toEqual({
      start: { column: 1, line: 1, offset: 0 },
      end: { column: 1, line: 3, offset: source.length },
    });
  });

  test.each(["", "# only a comment\n\n"])(
    "requires a version in empty program %p",
    (source) => {
      const result = parseProgram(source);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected diagnostics");
      expect(result.diagnostics).toMatchObject([{ code: "missing-version" }]);
    },
  );
});
