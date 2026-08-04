import { expect, test } from "bun:test";

import { createInitialState } from "../../core/state";
import { buildFrame } from "./frame";

test("buildFrame prepares renderer-facing classifications", () => {
  const frame = buildFrame(
    { ...createInitialState(), cursor: { x: 2, y: 2 } },
    { columns: 3, maxX: 3, maxY: 3, minX: 1, minY: 1, rows: 3 },
  );

  expect(frame.cells).toHaveLength(9);
  expect(frame.maximumValue).toBe(6);
  expect(frame.cells.find((cell) => cell.x === 2 && cell.y === 2)).toMatchObject({
    accent: "prime",
    diagonal: true,
    selected: true,
    value: 2,
  });
});
