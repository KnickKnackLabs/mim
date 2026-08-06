import { SyntaxFailure } from "./diagnostics";
import { spanFrom, type SourcePosition } from "./source";
import type { Token, TokenKind } from "./token";

const DOUBLE_OPERATORS = ["==", "!=", "<=", ">="];
const SINGLE_OPERATORS = "()+-*/%,<>!";

function token(
  kind: TokenKind,
  value: string,
  start: SourcePosition,
  offset: number,
): Token {
  return { kind, span: spanFrom(start, offset, value.length), value };
}

export class ExpressionLexer {
  private offset = 0;

  constructor(
    private readonly source: string,
    private readonly start: SourcePosition,
  ) {}

  next(): Token {
    while (/\s/.test(this.source[this.offset] ?? "")) this.offset += 1;
    if (this.offset >= this.source.length) {
      return token("eof", "", this.start, this.offset);
    }

    const start = this.offset;
    const remaining = this.source.slice(start);
    const number = remaining.match(/^\d+(?:\.\d+)?/)?.[0];
    if (number) return this.consume("number", number, start);

    const identifier = remaining.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0];
    if (identifier) return this.consume("identifier", identifier, start);

    const pair = remaining.slice(0, 2);
    if (DOUBLE_OPERATORS.includes(pair)) return this.consume("operator", pair, start);

    const character = this.source[start];
    if (SINGLE_OPERATORS.includes(character)) {
      return this.consume("operator", character, start);
    }

    throw new SyntaxFailure(
      `unexpected ${JSON.stringify(character)}`,
      spanFrom(this.start, start, 1),
    );
  }

  private consume(kind: TokenKind, value: string, start: number): Token {
    this.offset += value.length;
    return token(kind, value, this.start, start);
  }
}
