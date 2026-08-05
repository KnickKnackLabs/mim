import { describe, expect, test } from "bun:test";

import { formatBrowserProgram } from "./format-browser-program";

const completeProgram = `:mim 1
:param p prime=31
:axis x integers
:axis y integers
:field lcm(x,y)
:lens strip(value,p)
:color exact(lens)
:overlay equality off
`;

describe("browser program formatting", () => {
  test("uses canonical language formatting", () => {
    const result = formatBrowserProgram(completeProgram);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected formatting to succeed");
    expect(result.source).toContain(":param p prime = 31");
    expect(result.source).toContain(":field lcm(x, y)");
    expect(result.source.endsWith("\n")).toBe(true);
  });

  test("returns syntax diagnostics without replacement source", () => {
    const result = formatBrowserProgram(":mim 1\n:field (\n");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected formatting to fail");
    expect(result.source).toBeNull();
    expect(result.diagnostics[0]).toEqual(expect.objectContaining({ code: "syntax" }));
  });
});
