import { axisValueAt } from "../../core/axis";
import type { MimState } from "../../core/state";
import type { DisplayCell, DisplayFrame } from "../../render/frame";
import type { VisibleGridExtent } from "../../render/layout";
import { isPrime, operate } from "./math";

export function buildFrame(state: MimState, extent: VisibleGridExtent): DisplayFrame {
  const raw: Array<Omit<DisplayCell, "intensity">> = [];
  let maximumValue = 1;

  for (let row = extent.minY; row <= extent.maxY; row += 1) {
    const yValue = axisValueAt(state.yAxis, row);
    if (yValue === null) continue;

    for (let column = extent.minX; column <= extent.maxX; column += 1) {
      const xValue = axisValueAt(state.xAxis, column);
      if (xValue === null) continue;

      const value = operate(state.operation, xValue, yValue);
      maximumValue = Math.max(maximumValue, value);
      raw.push({
        accent: state.showPrimeResults && isPrime(value) ? "prime" : null,
        column,
        equalValues: xValue === yValue,
        motionEnd: state.motionEnd?.x === column && state.motionEnd?.y === row,
        motionStart: state.motionStart?.x === column && state.motionStart?.y === row,
        row,
        selected: state.cursor?.x === column && state.cursor?.y === row,
        value,
        xValue,
        yValue,
      });
    }
  }

  const denominator = Math.log1p(maximumValue);
  return {
    cells: raw.map((cell) => ({
      ...cell,
      intensity: Math.log1p(cell.value) / denominator,
    })),
    columns: Math.max(1, extent.columns),
    maximumValue,
    rows: Math.max(1, extent.rows),
    viewX: state.viewX,
    viewY: state.viewY,
    zoomDenominator: state.zoomDenominator,
  };
}
