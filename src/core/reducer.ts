import type { Command } from "./commands";
import { MAX_BOUND, MIN_BOUND, type Cursor, type MimState } from "./state";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampCursor(cursor: Cursor, state: MimState): Cursor {
  return {
    x: clamp(Math.round(cursor.x), 1, state.columns),
    y: clamp(Math.round(cursor.y), 1, state.rows),
  };
}

export function reduceState(state: MimState, command: Command): MimState {
  switch (command.type) {
    case "set-operation":
      return { ...state, operation: command.operation };

    case "toggle-prime-results":
      return { ...state, showPrimeResults: !state.showPrimeResults };

    case "set-cursor":
      return { ...state, cursor: clampCursor(command, state) };

    case "move-cursor": {
      const cursor = state.cursor ?? { x: 1, y: 1 };
      return {
        ...state,
        cursor: clampCursor(
          { x: cursor.x + command.dx, y: cursor.y + command.dy },
          state,
        ),
      };
    }

    case "set-bound": {
      if (!Number.isFinite(command.value)) return state;
      const value = clamp(Math.round(command.value), MIN_BOUND, MAX_BOUND);
      const next = command.axis === "x"
        ? { ...state, columns: value }
        : { ...state, rows: value };
      return {
        ...next,
        cursor: next.cursor ? clampCursor(next.cursor, next) : null,
      };
    }
  }
}
