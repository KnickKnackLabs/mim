import type { Expression } from "./expression-ast";
import { SyntaxFailure } from "./diagnostics";
import { parseExpressionSource } from "./parse-expression";
import { type SourcePosition, type SourceSpan } from "./source";

export class LineReader {
  private index = 0;

  constructor(
    private readonly text: string,
    private readonly line: number,
    private readonly lineOffset: number,
  ) {}

  statementName(): string {
    this.skipSpace();
    this.expect(":");
    return this.identifier("statement name");
  }

  identifier(description: string): string {
    this.skipSpace();
    const value = this.text.slice(this.index).match(/^[A-Za-z_][A-Za-z0-9_-]*/)?.[0];
    if (!value) this.fail(`expected ${description}`);
    this.index += value.length;
    return value;
  }

  integer(description: string): number {
    this.skipSpace();
    const value = this.text.slice(this.index).match(/^\d+/)?.[0];
    if (!value) this.fail(`expected ${description}`);
    this.index += value.length;
    return Number(value);
  }

  number(description: string): number {
    this.skipSpace();
    const value = this.text.slice(this.index)
      .match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)/)?.[0];
    if (!value) this.fail(`expected ${description}`);
    this.index += value.length;
    return Number(value);
  }

  nextIsNumber(): boolean {
    this.skipSpace();
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)/.test(this.text.slice(this.index));
  }

  consume(value: string): boolean {
    this.skipSpace();
    if (!this.text.startsWith(value, this.index)) return false;
    this.index += value.length;
    return true;
  }

  durationSeconds(description: string): number {
    const amount = this.number(description);
    const unit = this.identifier("duration unit");
    if (unit === "s") return amount;
    if (unit === "ms") return amount / 1_000;
    this.fail(`expected duration unit "s" or "ms"`);
  }

  keyword(expected: string): void {
    const actual = this.identifier(JSON.stringify(expected));
    if (actual !== expected) this.fail(`expected ${JSON.stringify(expected)}`);
  }

  expect(value: string): void {
    this.skipSpace();
    if (!this.text.startsWith(value, this.index)) {
      this.fail(`expected ${JSON.stringify(value)}`);
    }
    this.index += value.length;
  }

  expression(): Expression {
    this.skipSpace();
    const end = this.text.trimEnd().length;
    if (this.index >= end) this.fail("expected expression");
    const source = this.text.slice(this.index, end);
    const expression = parseExpressionSource(source, this.position(this.index));
    this.index = end;
    return expression;
  }

  finish(): void {
    this.skipSpace();
    if (this.index !== this.text.length) {
      this.fail(`unexpected ${JSON.stringify(this.text[this.index])}`);
    }
  }

  lineSpan(): SourceSpan {
    return {
      end: this.position(this.text.length),
      start: this.position(0),
    };
  }

  private skipSpace(): void {
    while (/\s/.test(this.text[this.index] ?? "")) this.index += 1;
  }

  private position(index: number): SourcePosition {
    return {
      column: index + 1,
      line: this.line,
      offset: this.lineOffset + index,
    };
  }

  private fail(message: string): never {
    throw new SyntaxFailure(message, {
      end: this.position(Math.min(this.text.length, this.index + 1)),
      start: this.position(this.index),
    });
  }
}
