import { expect, test } from "bun:test";

import { commandForKey } from "./keyboard";

test("keyboard input maps to semantic commands", () => {
  expect(commandForKey("h")).toEqual({ type: "move-cursor", dx: -1, dy: 0 });
  expect(commandForKey("ArrowDown")).toEqual({ type: "move-cursor", dx: 0, dy: 1 });
  expect(commandForKey("g")).toEqual({ type: "set-operation", operation: "gcd" });
  expect(commandForKey("m")).toEqual({ type: "set-operation", operation: "lcm" });
  expect(commandForKey("Escape")).toBeNull();
});
