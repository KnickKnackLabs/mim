import type { MimState } from "../core/state";
import { buildFrame } from "../instruments/gcd-lcm/frame";
import type { ValidatedProgram } from "../program";
import { renderFrame, type RenderSize } from "../render/canvas/render";
import type { VisibleGridExtent } from "../render/layout";
import { prepareFrame, type PreparedFrame } from "../runtime";
import { renderPreparedFrame } from "./canvas/render-prepared-frame";

export interface FrameDraw {
  cellCount: number;
  columns: number;
  paint: (canvas: HTMLCanvasElement, size: RenderSize) => void;
  preparedFrame: PreparedFrame | null;
  rows: number;
}

export function createFrameDraw(
  state: MimState,
  extent: VisibleGridExtent,
  program: ValidatedProgram | null,
): FrameDraw {
  if (!program) {
    const frame = buildFrame(state, extent);
    return {
      cellCount: frame.cells.length,
      columns: frame.columns,
      paint: (canvas, size) => renderFrame(canvas, frame, size),
      preparedFrame: null,
      rows: frame.rows,
    };
  }

  const preparation = prepareFrame(program, {
    bounds: extent,
    selected: state.cursor
      ? { column: state.cursor.x, row: state.cursor.y }
      : null,
  });
  if (preparation.kind !== "prepared") {
    throw new Error(preparation.diagnostics.map(({ message }) => message).join("\n"));
  }

  const frame = preparation.frame;
  return {
    cellCount: frame.cells.length,
    columns: frame.columns,
    paint: (canvas, size) => renderPreparedFrame(canvas, frame, size, {
      viewX: state.viewX,
      viewY: state.viewY,
      zoomDenominator: state.zoomDenominator,
    }),
    preparedFrame: frame,
    rows: frame.rows,
  };
}
