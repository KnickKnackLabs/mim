import type { ProgramStatement, VariationSequence } from "./program-ast";
import { SyntaxFailure } from "./diagnostics";
import { LineReader } from "./line-reader";

function parseVariationSequence(reader: LineReader): VariationSequence {
  if (reader.nextIsNumber()) {
    const values = [reader.number("variation value")];
    while (reader.consume(",")) values.push(reader.number("variation value"));
    return { kind: "explicit", values };
  }

  const generator = reader.identifier("variation generator");
  reader.expect("(");
  const from = reader.number("generator starting value");
  reader.expect(",");
  const to = reader.number("generator ending value");
  reader.expect(")");
  return { from, generator, kind: "generated", to };
}

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
    const form = reader.identifier("variation form");

    if (form === "from") {
      const from = reader.number("starting value");
      reader.keyword("to");
      const to = reader.number("ending value");
      reader.keyword("over");
      const durationSeconds = reader.durationSeconds("duration");
      const mode = reader.identifier("variation mode");
      reader.finish();
      return {
        durationSeconds,
        form: "linear",
        from,
        kind: "variation",
        mode,
        parameter,
        span,
        to,
      };
    }

    if (form === "through") {
      const sequence = parseVariationSequence(reader);
      const timingKind = reader.identifier("variation timing");
      if (timingKind !== "every" && timingKind !== "over") {
        throw new SyntaxFailure(
          `expected variation timing "every" or "over"`,
          span,
        );
      }
      const seconds = reader.durationSeconds(
        timingKind === "every" ? "step duration" : "total duration",
      );
      const mode = reader.identifier("variation mode");
      reader.finish();
      return {
        form: "discrete",
        kind: "variation",
        mode,
        parameter,
        sequence,
        span,
        timing: { kind: timingKind, seconds },
      };
    }

    throw new SyntaxFailure(
      `unknown variation form ${JSON.stringify(form)}`,
      span,
    );
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
