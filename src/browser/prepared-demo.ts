import type { ValidatedProgram } from "../program";
import { loadBrowserProgram } from "./load-browser-program";

export const PREPARED_DEMO_SOURCE = `:mim 1
:param p prime = 31
:axis x integers
:axis y integers
:field lcm(x, y)
:lens strip(value, p)
:color exact(lens)
:overlay equality off
`;

export function preparedDemoEnabled(hash: string): boolean {
  return hash !== "#legacy";
}

export function compilePreparedDemo(): ValidatedProgram {
  const result = loadBrowserProgram(PREPARED_DEMO_SOURCE);
  if (!result.ok) {
    throw new Error(result.diagnostics.map(({ message }) => message).join("\n"));
  }
  return result.loaded.program;
}
