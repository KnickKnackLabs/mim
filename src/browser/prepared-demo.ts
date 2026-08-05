import { parseProgram } from "../language";
import { validateProgram, type ValidatedProgram } from "../program";

export const PREPARED_DEMO_SOURCE = `:mim 1
:param p prime = 31
:axis x integers
:axis y integers
:field lcm(x, y)
:lens strip(value, p)
:color exact(lens)
:overlay equality off
`;

function diagnosticText(
  diagnostics: readonly { message: string; span: { start: { column: number; line: number } } }[],
): string {
  return diagnostics
    .map(({ message, span }) => `${span.start.line}:${span.start.column} ${message}`)
    .join("\n");
}

export function preparedDemoEnabled(hash: string): boolean {
  return hash !== "#legacy";
}

export function compilePreparedDemo(): ValidatedProgram {
  const parsed = parseProgram(PREPARED_DEMO_SOURCE);
  if (!parsed.ok) {
    throw new Error(`prepared demo does not parse:\n${diagnosticText(parsed.diagnostics)}`);
  }

  const validated = validateProgram(parsed.ast);
  if (!validated.ok) {
    throw new Error(`prepared demo does not validate:\n${diagnosticText(validated.diagnostics)}`);
  }
  return validated.program;
}
