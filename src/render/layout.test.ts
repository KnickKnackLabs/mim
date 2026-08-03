import { expect, test } from "bun:test";

import { coverWithSquareCells } from "./layout";

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
