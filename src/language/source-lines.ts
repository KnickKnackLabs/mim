export interface SourceLine {
  line: number;
  offset: number;
  text: string;
}

export function sourceLines(source: string): SourceLine[] {
  const lines: SourceLine[] = [];
  let line = 1;
  let offset = 0;

  while (offset <= source.length) {
    const newline = source.indexOf("\n", offset);
    const end = newline === -1 ? source.length : newline;
    const raw = source.slice(offset, end).replace(/\r$/, "");
    const comment = raw.indexOf("#");
    lines.push({
      line,
      offset,
      text: comment === -1 ? raw : raw.slice(0, comment),
    });
    if (newline === -1) break;
    offset = newline + 1;
    line += 1;
  }

  return lines;
}
