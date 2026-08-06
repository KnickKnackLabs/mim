import { describe, expect, test } from "bun:test";

import { formatProgram, formatProgramSource } from "./format-program";
import { parseProgram } from "./parse-program";

function parsed(source: string) {
  const result = parseProgram(source);
  if (!result.ok) throw new Error(result.diagnostics.map((item) => item.message).join("\n"));
  return result.ast;
}

describe("formatProgram", () => {
  test("writes canonical source that reparses stably", () => {
    const source = `
      # comments do not survive canonical output
      :mim    1
      :param p prime=31
      :param phase number=0
      :vary phase from 0 to 31 over 8s loop
      :axis x integers
      :field lcm(x,y)
      :lens strip(value,p)
      :color exact(lens)
      :overlay equality off
    `;
    const canonical = [
      ":mim 1",
      ":param p prime = 31",
      ":param phase number = 0",
      ":vary phase from 0 to 31 over 8s loop",
      ":axis x integers",
      ":field lcm(x, y)",
      ":lens strip(value, p)",
      ":color exact(lens)",
      ":overlay equality off",
      "",
    ].join("\n");

    expect(formatProgram(parsed(source))).toBe(canonical);
    expect(formatProgram(parsed(canonical))).toBe(canonical);
  });

  test("preserves whole-line and inline comments while canonicalizing source", () => {
    const source = `
      # Radial residues.
      :mim    1

      # Squared distance folded into a finite field.
      :field mod(x*x+y*y,31) # Prime modulus.
    `;
    const canonical = [
      "# Radial residues.",
      ":mim 1",
      "",
      "# Squared distance folded into a finite field.",
      ":field mod(x * x + y * y, 31) # Prime modulus.",
      "",
    ].join("\n");

    const formatted = formatProgramSource(source, parsed(source));
    expect(formatted).toBe(canonical);
    expect(formatProgramSource(formatted, parsed(formatted))).toBe(canonical);
  });

  test("preserves expression precedence", () => {
    const source = ":mim 1\n:field (x + y) * abs(x - y)\n";
    expect(formatProgram(parsed(source))).toBe(source);
  });
});
