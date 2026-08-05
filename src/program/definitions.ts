import type { ProgramValueType } from "./types";

export interface FunctionDefinition {
  inputs: readonly ProgramValueType[];
  name: string;
  output: ProgramValueType;
}

export interface ProgramDefinitions {
  axes: readonly string[];
  functions: readonly FunctionDefinition[];
}

function numeric(name: string, arity: number): FunctionDefinition {
  return {
    inputs: Array.from({ length: arity }, () => "number" as const),
    name,
    output: "number",
  };
}

export const DEFAULT_PROGRAM_DEFINITIONS: ProgramDefinitions = {
  axes: ["integers", "primes"],
  functions: [
    numeric("abs", 1),
    numeric("coprime", 2),
    numeric("divides", 2),
    numeric("divisors", 1),
    numeric("gcd", 2),
    numeric("if", 3),
    numeric("lcm", 2),
    numeric("max", 2),
    numeric("min", 2),
    numeric("mod", 2),
    numeric("prime", 1),
    numeric("remove", 3),
    numeric("strip", 2),
    numeric("valuation", 2),
    numeric("xor", 2),
    { inputs: ["number"], name: "exact", output: "color" },
    { inputs: ["number"], name: "magnitude", output: "color" },
  ],
};

export function functionDefinition(
  definitions: ProgramDefinitions,
  name: string,
): FunctionDefinition | null {
  return definitions.functions.find((definition) => definition.name === name) ?? null;
}
