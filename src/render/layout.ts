export interface SquareGridLayout {
  cellSize: number;
  columns: number;
  left: number;
  rows: number;
  top: number;
}

export function squareGridAtScale(
  width: number,
  height: number,
  columns: number,
  rows: number,
  zoomDenominator: number,
): SquareGridLayout {
  if (width <= 0 || height <= 0 || columns < 1 || rows < 1 || zoomDenominator < 1) {
    throw new RangeError("scaled grid layout requires positive dimensions, bounds, and zoom");
  }

  return {
    cellSize: Math.min(width, height) / zoomDenominator,
    columns,
    left: 0,
    rows,
    top: 0,
  };
}

export function coverWithSquareCells(
  width: number,
  height: number,
  columns: number,
  rows: number,
): SquareGridLayout {
  if (width <= 0 || height <= 0 || columns < 1 || rows < 1) {
    throw new RangeError("grid layout requires positive dimensions and bounds");
  }

  return {
    cellSize: Math.max(width / columns, height / rows),
    columns,
    left: 0,
    rows,
    top: 0,
  };
}
