export interface SquareGridLayout {
  cellSize: number;
  columns: number;
  left: number;
  rows: number;
  top: number;
}

export interface VisibleGridExtent {
  columns: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  rows: number;
}

export function visibleGridExtent(
  width: number,
  height: number,
  zoomDenominator: number,
  viewX = 0,
  viewY = 0,
): VisibleGridExtent {
  const cellSize = Math.min(width, height) / zoomDenominator;
  const minX = Math.max(1, Math.floor(viewX) + 1);
  const minY = Math.max(1, Math.floor(viewY) + 1);
  const maxX = Math.ceil(viewX + width / cellSize);
  const maxY = Math.ceil(viewY + height / cellSize);
  return {
    columns: Math.max(0, maxX - minX + 1),
    maxX,
    maxY,
    minX,
    minY,
    rows: Math.max(0, maxY - minY + 1),
  };
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
