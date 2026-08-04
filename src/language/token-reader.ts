import { SyntaxFailure } from "./diagnostics";
import { ExpressionLexer } from "./lexer";
import type { SourcePosition } from "./source";
import type { Token, TokenKind } from "./token";

export class TokenReader {
  current: Token;

  private readonly lexer: ExpressionLexer;

  constructor(source: string, start: SourcePosition) {
    this.lexer = new ExpressionLexer(source, start);
    this.current = this.lexer.next();
  }

  at(value: string): boolean {
    return this.current.value === value;
  }

  atKind(kind: TokenKind): boolean {
    return this.current.kind === kind;
  }

  take(): Token {
    const token = this.current;
    this.current = this.lexer.next();
    return token;
  }

  expect(value: string): Token {
    if (!this.at(value)) this.fail(`expected ${JSON.stringify(value)}`);
    return this.take();
  }

  finish(): void {
    if (!this.atKind("eof")) {
      this.fail(`unexpected ${JSON.stringify(this.current.value)}`);
    }
  }

  fail(message: string): never {
    throw new SyntaxFailure(message, this.current.span);
  }
}
