import type { ValidatedProgram } from "../program";
import { runtimeAxisValue } from "./axis-values";
import { bindParameters } from "./bind-parameters";
import { evaluateBoundCell } from "./evaluate-cell";
import type {
  FramePreparation,
  GridBounds,
  PreparedCell,
  PreparedFrame,
  PrepareFrameOptions,
} from "./prepared-frame";
import { resolveCellPaint } from "./resolve-paint";

function validateBounds(bounds: GridBounds): void {
  for (const value of [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY]) {
    if (!Number.isSafeInteger(value)) throw new RangeError("frame bounds must be safe integers");
  }
  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
    throw new RangeError("frame bounds must not be inverted");
  }
}

export function prepareFrame(
  program: ValidatedProgram,
  options: PrepareFrameOptions,
): FramePreparation {
  validateBounds(options.bounds);
  const binding = bindParameters(program, options.parameters);
  if (binding.kind === "invalid") {
    return { diagnostics: binding.diagnostics, frame: null, kind: "invalid-parameters" };
  }

  const pending: Array<Omit<PreparedCell, "paint">> = [];
  let maximumMagnitude = 0;
  for (let row = options.bounds.minY; row <= options.bounds.maxY; row += 1) {
    const y = runtimeAxisValue(program.axes.y.definition, row);
    if (y === null) continue;
    for (let column = options.bounds.minX; column <= options.bounds.maxX; column += 1) {
      const x = runtimeAxisValue(program.axes.x.definition, column);
      if (x === null) continue;
      const evaluated = evaluateBoundCell(
        program,
        { x, xi: column, y, yi: row },
        binding.values,
      );
      const evaluation = {
        color: evaluated.color,
        field: evaluated.field,
        lens: evaluated.lens,
      };
      if (evaluation.color?.kind === "color") {
        maximumMagnitude = Math.max(maximumMagnitude, Math.abs(evaluation.color.value));
      }
      pending.push({
        column,
        evaluation,
        overlays: { equality: program.overlays.equality && x === y },
        row,
        selected: options.selected?.column === column && options.selected?.row === row,
        x,
        y,
      });
    }
  }

  const cells: PreparedCell[] = pending.map((cell) => ({
    ...cell,
    paint: resolveCellPaint(cell.evaluation, maximumMagnitude),
  }));
  const frame: PreparedFrame = {
    bounds: options.bounds,
    cells,
    columns: options.bounds.maxX - options.bounds.minX + 1,
    maximumMagnitude,
    parameters: binding.values,
    rows: options.bounds.maxY - options.bounds.minY + 1,
    selectedCell: cells.find((cell) => cell.selected) ?? null,
  };
  return { diagnostics: [], frame, kind: "prepared" };
}
