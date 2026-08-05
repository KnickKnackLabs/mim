import type {
  AxisStatement,
  ColorStatement,
  FieldStatement,
  LensStatement,
  OverlayStatement,
  ParameterStatement,
  ProgramAst,
} from "../language/program-ast";

export interface StatementIndex {
  axes: AxisStatement[];
  colors: ColorStatement[];
  fields: FieldStatement[];
  lenses: LensStatement[];
  overlays: OverlayStatement[];
  parameters: ParameterStatement[];
}

export function indexStatements(ast: ProgramAst): StatementIndex {
  const axes: AxisStatement[] = [];
  const colors: ColorStatement[] = [];
  const fields: FieldStatement[] = [];
  const lenses: LensStatement[] = [];
  const overlays: OverlayStatement[] = [];
  const parameters: ParameterStatement[] = [];

  for (const statement of ast.statements) {
    if (statement.kind === "axis") axes.push(statement);
    if (statement.kind === "color") colors.push(statement);
    if (statement.kind === "field") fields.push(statement);
    if (statement.kind === "lens") lenses.push(statement);
    if (statement.kind === "overlay") overlays.push(statement);
    if (statement.kind === "parameter") parameters.push(statement);
  }

  return { axes, colors, fields, lenses, overlays, parameters };
}
