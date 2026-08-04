import type { MimState } from "../../core/state";
import type { DisplayCell, DisplayFrame } from "../../render/frame";
import type { VisibleGridExtent } from "../../render/layout";
import { isPrime, operate } from "./math";

export function buildFrame(state: MimState, extent: VisibleGridExtent): DisplayFrame {
  const raw: Array<Omit<DisplayCell, "intensity">> = [];
  let maximumValue = 1;

  for (let y = extent.minY; y <= extent.maxY; y += 1) {
    for (let x = extent.minX; x <= extent.maxX; x += 1) {
      const value = operate(state.operation, x, y);
      maximumValue = Math.max(maximumValue, value);
      raw.push({
        accent: state.showPrimeResults && isPrime(value) ? "prime" : null,
        diagonal: x === y,
        motionEnd: state.motionEnd?.x === x && state.motionEnd?.y === y,
        motionStart: state.motionStart?.x === x && state.motionStart?.y === y,
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
    columns: Math.max(1, extent.columns),
    maximumValue,
    rows: Math.max(1, extent.rows),
    viewX: state.viewX,
    viewY: state.viewY,
    zoomDenominator: state.zoomDenominator,
  };
}
