import type { Cursor } from "../core/state";

export interface PointerBounds {
  height: number;
  left: number;
  top: number;
  width: number;
}

function clamp(value: number, maximum: number): number {
  return Math.min(maximum, Math.max(1, value));
}

export function cellForPoint(
  clientX: number,
  clientY: number,
  bounds: PointerBounds,
  columns: number,
  rows: number,
): Cursor {
  const x = Math.floor(((clientX - bounds.left) / bounds.width) * columns) + 1;
  const y = Math.floor(((clientY - bounds.top) / bounds.height) * rows) + 1;
  return { x: clamp(x, columns), y: clamp(y, rows) };
}
