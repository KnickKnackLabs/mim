import type { BinaryOperator } from "../language/expression-ast";
import type { SourceSpan } from "../language/source";

export type ProgramValueType = "color" | "number";
export type ProgramInputName = "lens" | "value" | "x" | "xi" | "y" | "yi";

interface ExpressionPlanBase {
  span: SourceSpan;
  valueType: ProgramValueType;
}

export interface LiteralPlan extends ExpressionPlanBase {
  kind: "literal";
  value: number;
  valueType: "number";
}

export interface InputPlan extends ExpressionPlanBase {
  input: ProgramInputName;
  kind: "input";
}

export interface ParameterReferencePlan extends ExpressionPlanBase {
  kind: "parameter-reference";
  name: string;
  valueType: "number";
}

export interface UnaryPlan extends ExpressionPlanBase {
  kind: "unary";
  operand: ExpressionPlan;
  operator: "+" | "-" | "!";
  valueType: "number";
}

export interface BinaryPlan extends ExpressionPlanBase {
  kind: "binary";
  left: ExpressionPlan;
  operator: BinaryOperator;
  right: ExpressionPlan;
  valueType: "number";
}

export interface CallPlan extends ExpressionPlanBase {
  arguments: ExpressionPlan[];
  functionName: string;
  kind: "call";
}

export type ExpressionPlan =
  | BinaryPlan
  | CallPlan
  | InputPlan
  | LiteralPlan
  | ParameterReferencePlan
  | UnaryPlan;

export interface ParameterPlan {
  initialValue: number;
  kind: "number" | "prime";
  name: string;
  span: SourceSpan;
}

export type VariationMode = "loop" | "once" | "pingpong";

export interface VariationPlan {
  durationSeconds: number;
  from: number;
  mode: VariationMode;
  parameter: string;
  span: SourceSpan;
  to: number;
}

export interface AxisPlan {
  definition: string;
  span: SourceSpan;
}

export interface ValidatedProgram {
  axes: { x: AxisPlan; y: AxisPlan };
  color: ExpressionPlan;
  variations: VariationPlan[];
  field: ExpressionPlan;
  kind: "validated-program";
  lens: ExpressionPlan;
  overlays: { equality: boolean };
  parameters: ParameterPlan[];
  span: SourceSpan;
  version: 1;
}
