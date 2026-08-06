import { isPrimeInteger } from "../math/prime";
import type { ValidatedProgram } from "../program";
import type { ParameterBinding, RuntimeDiagnostic } from "./types";

export function bindParameters(
  program: ValidatedProgram,
  overrides: Readonly<Record<string, number>> = {},
): ParameterBinding {
  const diagnostics: RuntimeDiagnostic[] = [];
  const known = new Set(program.parameters.map((parameter) => parameter.name));
  for (const name of Object.keys(overrides)) {
    if (known.has(name)) continue;
    diagnostics.push({
      code: "unknown-parameter",
      message: `unknown parameter ${name}`,
      parameter: name,
    });
  }

  const values: Record<string, number> = {};
  for (const parameter of program.parameters) {
    const value = overrides[parameter.name] ?? parameter.initialValue;
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      diagnostics.push({
        code: "invalid-parameter-value",
        message: `${parameter.name} must be within the safe numeric range`,
        parameter: parameter.name,
      });
    } else if (parameter.kind === "prime" && !isPrimeInteger(value)) {
      diagnostics.push({
        code: "invalid-prime-parameter",
        message: `${parameter.name} must be prime`,
        parameter: parameter.name,
      });
    } else {
      values[parameter.name] = Object.is(value, -0) ? 0 : value;
    }
  }

  return diagnostics.length === 0
    ? { diagnostics, kind: "bound", values }
    : { diagnostics, kind: "invalid", values: null };
}
