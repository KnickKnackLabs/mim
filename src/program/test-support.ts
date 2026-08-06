import { expect } from "bun:test";
import { parseProgram, type ProgramAst } from "../language";

export const PROVING_PROGRAM = `:mim 1
:param p prime = 31
:axis x integers
:axis y primes
:field lcm(x, y)
:lens strip(value, p)
:color exact(lens)
:overlay equality off
`;

export function parseAst(source: string): ProgramAst {
  const result = parseProgram(source);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.ast;
}

export function replaceLine(source: string, prefix: string, replacement: string): string {
  return source
    .split("\n")
    .map((line) => line.startsWith(prefix) ? replacement : line)
    .join("\n");
}
