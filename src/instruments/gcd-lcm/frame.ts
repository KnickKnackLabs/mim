import type { MimState } from "../../core/state";
import type { DisplayCell, DisplayFrame } from "../../render/frame";
import { isPrime, operate } from "./math";

export function buildFrame(state: MimState): DisplayFrame {
  const raw: Array<Omit<DisplayCell, "intensity">> = [];
  let maximumValue = 1;

  for (let y = 1; y <= state.rows; y += 1) {
    for (let x = 1; x <= state.columns; x += 1) {
      const value = operate(state.operation, x, y);
      maximumValue = Math.max(maximumValue, value);
      raw.push({
        accent: state.showPrimeResults && isPrime(value) ? "prime" : null,
        diagonal: x === y,
        selected: state.cursor?.x === x && state.cursor?.y === y,
        value,
        x,
        y,
      });
    }
  }

  const denominator = Math.log1p(maximumValue);
  return {
    cells: raw.map((cell) => ({
      ...cell,
      intensity: Math.log1p(cell.value) / denominator,
    })),
    columns: state.columns,
    maximumValue,
    rows: state.rows,
    zoomDenominator: state.zoomDenominator,
  };
}
