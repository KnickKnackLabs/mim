import { expect } from "bun:test";
import { parseProgram } from "../language";
import { validateProgram, type ValidatedProgram } from "../program";

export const RUNTIME_PROGRAM = `:mim 1
:param p prime = 31
:axis x integers
:axis y primes
:field lcm(x, y)
:lens strip(value, p)
:color exact(lens)
:overlay equality off
`;

export function validatedProgram(source = RUNTIME_PROGRAM): ValidatedProgram {
  const parsed = parseProgram(source);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.diagnostics));
  const validated = validateProgram(parsed.ast);
  expect(validated.ok).toBe(true);
  if (!validated.ok) throw new Error(JSON.stringify(validated.diagnostics));
  return validated.program;
}

export function replaceRuntimeLine(prefix: string, replacement: string): string {
  return RUNTIME_PROGRAM
    .split("\n")
    .map((line) => line.startsWith(prefix) ? replacement : line)
    .join("\n");
}
