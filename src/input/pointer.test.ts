import { expect, test } from "bun:test";

import { coverWithSquareCells } from "../render/layout";
import { cellForPoint } from "./pointer";

const bounds = { left: 10, top: 20 };
const layout = coverWithSquareCells(200, 100, 4, 2);

test("pointer positions map through the square-cell layout", () => {
  expect(cellForPoint(10, 20, bounds, layout)).toEqual({ x: 1, y: 1 });
  expect(cellForPoint(209, 119, bounds, layout)).toEqual({ x: 4, y: 2 });
  expect(cellForPoint(999, -50, bounds, layout)).toEqual({ x: 20, y: 1 });
});
