import { expect, test } from "bun:test";

import { coverWithSquareCells, squareGridAtScale } from "./layout";

test("square cells cover a wide viewport without stretching", () => {
  const layout = coverWithSquareCells(1440, 1000, 48, 48);
  expect(layout.cellSize).toBe(30);
  expect(layout.cellSize * layout.columns).toBeGreaterThanOrEqual(1440);
  expect(layout.cellSize * layout.rows).toBeGreaterThanOrEqual(1000);
});

test("square cells cover a tall viewport without stretching", () => {
  const layout = coverWithSquareCells(1000, 1440, 48, 48);
  expect(layout.cellSize).toBe(30);
  expect(layout.cellSize * layout.columns).toBeGreaterThanOrEqual(1000);
  expect(layout.cellSize * layout.rows).toBeGreaterThanOrEqual(1440);
});

test("fractional camera scale and view offsets share one layout", () => {
  const layout = squareGridAtScale(1440, 900, 96, 96, 45, 2.5, -1);
  expect(layout.cellSize).toBe(20);
  expect(layout.left).toBe(-50);
  expect(layout.top).toBe(20);
});
