import { expect, test } from "bun:test";

import { cellForPoint } from "./pointer";

const bounds = { height: 100, left: 10, top: 20, width: 200 };

test("pointer positions map to bounded lattice cells", () => {
  expect(cellForPoint(10, 20, bounds, 4, 2)).toEqual({ x: 1, y: 1 });
  expect(cellForPoint(209, 119, bounds, 4, 2)).toEqual({ x: 4, y: 2 });
  expect(cellForPoint(999, -50, bounds, 4, 2)).toEqual({ x: 4, y: 1 });
});
