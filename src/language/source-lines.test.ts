import { describe, expect, test } from "bun:test";

import { sourceLines } from "./source-lines";

describe("sourceLines", () => {
  test("removes comments while preserving line numbers and offsets", () => {
    expect(sourceLines("one # comment\n\nthree")).toEqual([
      { line: 1, offset: 0, text: "one " },
      { line: 2, offset: 14, text: "" },
      { line: 3, offset: 15, text: "three" },
    ]);
  });

  test("normalizes CRLF text without changing absolute offsets", () => {
    expect(sourceLines(":mim 1\r\n:field x\r\n")).toEqual([
      { line: 1, offset: 0, text: ":mim 1" },
      { line: 2, offset: 8, text: ":field x" },
      { line: 3, offset: 18, text: "" },
    ]);
  });

  test("returns one empty source line for an empty program", () => {
    expect(sourceLines("")).toEqual([{ line: 1, offset: 0, text: "" }]);
  });

  test("keeps a hash only as the start of a comment", () => {
    expect(sourceLines(":field x#ignored")).toEqual([
      { line: 1, offset: 0, text: ":field x" },
    ]);
  });
});
