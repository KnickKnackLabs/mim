import { formatExpression } from "./format-expression";
import type { ProgramAst, ProgramStatement } from "./program-ast";

function formatStatement(statement: ProgramStatement): string {
  if (statement.kind === "mim") return `:mim ${statement.version}`;
  if (statement.kind === "parameter") {
    return `:param ${statement.name} ${statement.parameterType} = ${formatExpression(statement.initial)}`;
  }
  if (statement.kind === "variation") {
    return `:vary ${statement.parameter} from ${statement.from} to ${statement.to} over ${statement.durationSeconds}s ${statement.mode}`;
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

function lineComment(line: string): string | null {
  const start = line.indexOf("#");
  return start === -1 ? null : line.slice(start).trimEnd();
}

function trimOuterBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start] === "") start += 1;
  while (end > start && lines[end - 1] === "") end -= 1;
  return lines.slice(start, end);
}

export function formatProgramSource(source: string, program: ProgramAst): string {
  const statementsByLine = new Map(
    program.statements.map((statement) => [statement.span.start.line, statement]),
  );
  const lines = source.split("\n").map((rawLine, index) => {
    const line = rawLine.replace(/\r$/, "");
    const statement = statementsByLine.get(index + 1);
    const comment = lineComment(line);
    if (statement) {
      const formatted = formatStatement(statement);
      return comment ? `${formatted} ${comment}` : formatted;
    }
    if (comment) return comment;
    return "";
  });

  return `${trimOuterBlankLines(lines).join("\n")}\n`;
}
