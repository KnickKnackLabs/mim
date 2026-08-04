import { formatExpression } from "./format-expression";
import type { ProgramAst, ProgramStatement } from "./program-ast";

function formatStatement(statement: ProgramStatement): string {
  if (statement.kind === "mim") return `:mim ${statement.version}`;
  if (statement.kind === "parameter") {
    return `:param ${statement.name} ${statement.parameterType} = ${formatExpression(statement.initial)}`;
  }
  if (statement.kind === "axis") {
    return `:axis ${statement.axis} ${formatExpression(statement.definition)}`;
  }
  if (statement.kind === "field") {
    return `:field ${formatExpression(statement.expression)}`;
  }
  if (statement.kind === "lens") {
    return `:lens ${formatExpression(statement.expression)}`;
  }
  if (statement.kind === "color") {
    return `:color ${formatExpression(statement.expression)}`;
  }
  if (statement.kind === "overlay") {
    return `:overlay ${statement.name} ${statement.state}`;
  }
  const unreachable: never = statement;
  return unreachable;
}

export function formatProgram(program: ProgramAst): string {
  return `${program.statements.map(formatStatement).join("\n")}\n`;
}
