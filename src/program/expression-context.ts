import type { ProgramValidationDiagnostic } from "./diagnostics";
import type { ProgramDefinitions } from "./definitions";
import type { ProgramInputName, ProgramValueType } from "./types";

export type NameDefinition =
  | { input: ProgramInputName; kind: "input"; valueType: ProgramValueType }
  | { kind: "parameter"; name: string; valueType: "number" };

export interface ExpressionValidationContext {
  definitions: ProgramDefinitions;
  diagnostics: ProgramValidationDiagnostic[];
  names: Readonly<Record<string, NameDefinition>>;
}

export function inputNames(
  inputs: readonly ProgramInputName[],
): Record<string, NameDefinition> {
  return Object.fromEntries(inputs.map((input) => [
    input,
    { input, kind: "input", valueType: "number" },
  ]));
}
