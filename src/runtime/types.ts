import type { SourceSpan } from "../language";
import type { ProgramInputName } from "../program";

export interface EvaluationContext {
  inputs: Partial<Record<ProgramInputName, number>>;
  parameters: Readonly<Record<string, number>>;
}

export interface NumberValue {
  kind: "number";
  value: number;
}

export interface ColorValue {
  kind: "color";
  mode: "exact" | "magnitude";
  value: number;
}

export interface UndefinedValue {
  code: string;
  kind: "undefined";
  message: string;
  span: SourceSpan;
}

export interface EvaluationError {
  code: string;
  kind: "error";
  message: string;
  span: SourceSpan;
}

export type EvaluationResult =
  | ColorValue
  | EvaluationError
  | NumberValue
  | UndefinedValue;

export interface RuntimeDiagnostic {
  code: string;
  message: string;
  parameter: string;
}

export type ParameterBinding =
  | { diagnostics: readonly RuntimeDiagnostic[]; kind: "bound"; values: Readonly<Record<string, number>> }
  | { diagnostics: readonly RuntimeDiagnostic[]; kind: "invalid"; values: null };

export interface CellInputs {
  x: number;
  xi: number;
  y: number;
  yi: number;
}

export interface EvaluatedCell {
  color: EvaluationResult | null;
  field: EvaluationResult;
  lens: EvaluationResult | null;
  parameters: Readonly<Record<string, number>>;
}

export type CellEvaluation =
  | { cell: EvaluatedCell; diagnostics: readonly RuntimeDiagnostic[]; kind: "evaluated" }
  | { cell: null; diagnostics: readonly RuntimeDiagnostic[]; kind: "invalid-parameters" };
