export interface SourcePosition {
  column: number;
  line: number;
  offset: number;
}

export interface SourceSpan {
  end: SourcePosition;
  start: SourcePosition;
}

export function advancePosition(
  start: SourcePosition,
  offset: number,
): SourcePosition {
  return {
    column: start.column + offset,
    line: start.line,
    offset: start.offset + offset,
  };
}

export function spanFrom(
  start: SourcePosition,
  relativeStart: number,
  length: number,
): SourceSpan {
  return {
    end: advancePosition(start, relativeStart + length),
    start: advancePosition(start, relativeStart),
  };
}
