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
  viewX = 0,
  viewY = 0,
): SquareGridLayout {
  if (width <= 0 || height <= 0 || columns < 1 || rows < 1 || zoomDenominator < 1) {
    throw new RangeError("scaled grid layout requires positive dimensions, bounds, and zoom");
  }

  const cellSize = Math.min(width, height) / zoomDenominator;
  return {
    cellSize,
    columns,
    left: -viewX * cellSize,
    rows,
    top: -viewY * cellSize,
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
