import { describe, expect, test } from "bun:test";

import { reduceState } from "./reducer";
import { createInitialState, MAX_BOUND, MIN_BOUND } from "./state";

describe("reduceState", () => {
  test("applies semantic operation commands", () => {
    const state = reduceState(createInitialState(), {
      type: "set-operation",
      operation: "gcd",
    });
    expect(state.operation).toBe("gcd");
  });

  test("toggles and closes help", () => {
    const initial = createInitialState();
    const visible = reduceState(initial, { type: "toggle-help" });
    expect(visible.helpVisible).toBe(true);
    expect(reduceState(visible, { type: "toggle-help" }).helpVisible).toBe(false);
    expect(reduceState(visible, { type: "close-help" }).helpVisible).toBe(false);
    expect(reduceState(initial, { type: "close-help" })).toBe(initial);
  });

  test("moves and clamps the cursor", () => {
    let state = reduceState(createInitialState(), { type: "move-cursor", dx: -2, dy: 4 });
    expect(state.cursor).toEqual({ x: 1, y: 5 });
    state = reduceState(state, { type: "move-cursor", dx: 500, dy: 500 });
    expect(state.cursor).toEqual({ x: state.columns, y: state.rows });
  });

  test("clamps bounds and an existing cursor", () => {
    let state = reduceState(createInitialState(), { type: "set-cursor", x: 40, y: 40 });
    state = reduceState(state, { type: "set-bound", axis: "x", value: 3 });
    state = reduceState(state, { type: "set-bound", axis: "y", value: 1 });
    expect(state.columns).toBe(3);
    expect(state.rows).toBe(MIN_BOUND);
    expect(state.cursor).toEqual({ x: 3, y: MIN_BOUND });

    state = reduceState(state, { type: "set-bound", axis: "x", value: 999 });
    expect(state.columns).toBe(MAX_BOUND);
  });
});
