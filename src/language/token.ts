import type { SourceSpan } from "./source";

export type TokenKind = "eof" | "identifier" | "number" | "operator";

export interface Token {
  kind: TokenKind;
  span: SourceSpan;
  value: string;
}
