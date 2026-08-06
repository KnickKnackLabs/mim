import type { Expression } from "./expression-ast";
import type { SourceSpan } from "./source";

interface StatementBase {
  span: SourceSpan;
}

export interface MimVersionStatement extends StatementBase {
  kind: "mim";
  version: number;
}

export interface ParameterStatement extends StatementBase {
  initial: Expression;
  kind: "parameter";
  name: string;
  parameterType: string;
}

export interface AxisStatement extends StatementBase {
  axis: string;
  definition: Expression;
  kind: "axis";
}

export interface LinearVariationStatement extends StatementBase {
  durationSeconds: number;
  form: "linear";
  from: number;
  kind: "variation";
  mode: string;
  parameter: string;
  to: number;
}

export interface ExplicitVariationSequence {
  kind: "explicit";
  values: number[];
}

export interface GeneratedVariationSequence {
  from: number;
  generator: string;
  kind: "generated";
  to: number;
}

export type VariationSequence = ExplicitVariationSequence | GeneratedVariationSequence;

export interface DiscreteVariationStatement extends StatementBase {
  everySeconds: number;
  form: "discrete";
  kind: "variation";
  mode: string;
  parameter: string;
  sequence: VariationSequence;
}

export type VariationStatement = DiscreteVariationStatement | LinearVariationStatement;

export interface FieldStatement extends StatementBase {
  expression: Expression;
  kind: "field";
}

export interface LensStatement extends StatementBase {
  expression: Expression;
  kind: "lens";
}

export interface ColorStatement extends StatementBase {
  expression: Expression;
  kind: "color";
}

export interface OverlayStatement extends StatementBase {
  kind: "overlay";
  name: string;
  state: string;
}

export type ProgramStatement =
  | AxisStatement
  | ColorStatement
  | VariationStatement
  | FieldStatement
  | LensStatement
  | MimVersionStatement
  | OverlayStatement
  | ParameterStatement;

export interface ProgramAst {
  kind: "program";
  span: SourceSpan;
  statements: ProgramStatement[];
  version: number;
}
