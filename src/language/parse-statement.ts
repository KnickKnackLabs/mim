import type { ProgramStatement } from "./program-ast";
import { SyntaxFailure } from "./diagnostics";
import { LineReader } from "./line-reader";

export function parseStatement(
  text: string,
  line: number,
  lineOffset: number,
): ProgramStatement {
  const reader = new LineReader(text, line, lineOffset);
  const name = reader.statementName();
  const span = reader.lineSpan();

  if (name === "mim") {
    const version = reader.integer("program version");
    reader.finish();
    return { kind: "mim", span, version };
  }

  if (name === "param") {
    const parameterName = reader.identifier("parameter name");
    const parameterType = reader.identifier("parameter type");
    reader.expect("=");
    const initial = reader.expression();
    reader.finish();
    return {
      initial,
      kind: "parameter",
      name: parameterName,
      parameterType,
      span,
    };
  }

  if (name === "axis") {
    const axis = reader.identifier("axis name");
    const definition = reader.expression();
    reader.finish();
    return { axis, definition, kind: "axis", span };
  }

  if (name === "vary") {
    const parameter = reader.identifier("parameter name");
    reader.keyword("from");
    const from = reader.number("starting value");
    reader.keyword("to");
    const to = reader.number("ending value");
    reader.keyword("over");
    const durationSeconds = reader.number("duration");
    reader.expect("s");
    const mode = reader.identifier("variation mode");
    reader.finish();
    return { durationSeconds, from, kind: "variation", mode, parameter, span, to };
  }

  if (name === "field" || name === "lens" || name === "color") {
    const expression = reader.expression();
    reader.finish();
    return { expression, kind: name, span };
  }

  if (name === "overlay") {
    const overlayName = reader.identifier("overlay name");
    const state = reader.identifier("overlay state");
    reader.finish();
    return { kind: "overlay", name: overlayName, span, state };
  }

  throw new SyntaxFailure(
    `unknown statement ${JSON.stringify(name)}`,
    span,
    "unknown-statement",
  );
}
