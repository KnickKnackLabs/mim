import type { Command } from "./commands";
import {
  GOLDEN_ZOOM_STEP,
  MAX_BOUND,
  MAX_ZOOM_DENOMINATOR,
  MIN_BOUND,
  MIN_ZOOM_DENOMINATOR,
  type Cursor,
  type MimState,
} from "./state";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function stepZoom(current: number, direction: "in" | "out"): number {
  const factor = direction === "in" ? 1 / GOLDEN_ZOOM_STEP : GOLDEN_ZOOM_STEP;
  return clamp(
    current * factor,
    MIN_ZOOM_DENOMINATOR,
    MAX_ZOOM_DENOMINATOR,
  );
}

function clampCursor(cursor: Cursor, state: MimState): Cursor {
  return {
    x: clamp(Math.round(cursor.x), 1, state.columns),
    y: clamp(Math.round(cursor.y), 1, state.rows),
  };
}

export function reduceState(state: MimState, command: Command): MimState {
  switch (command.type) {
    case "close-help":
      return state.helpVisible ? { ...state, helpVisible: false } : state;

    case "toggle-help":
      return { ...state, helpVisible: !state.helpVisible };

    case "set-operation":
      return { ...state, operation: command.operation };

    case "toggle-prime-results":
      return { ...state, showPrimeResults: !state.showPrimeResults };

    case "set-zoom-denominator": {
      if (!Number.isFinite(command.value)) return state;
      const zoomDenominator = clamp(
        command.value,
        MIN_ZOOM_DENOMINATOR,
        MAX_ZOOM_DENOMINATOR,
      );
      return zoomDenominator === state.zoomDenominator
        ? state
        : { ...state, zoomDenominator };
    }

    case "zoom-at": {
      if (
        !Number.isFinite(command.anchorX)
        || !Number.isFinite(command.anchorY)
        || !Number.isFinite(command.factor)
        || command.factor <= 0
      ) return state;
      const zoomDenominator = clamp(
        state.zoomDenominator * command.factor,
        MIN_ZOOM_DENOMINATOR,
        MAX_ZOOM_DENOMINATOR,
      );
      if (zoomDenominator === state.zoomDenominator) return state;
      const scale = zoomDenominator / state.zoomDenominator;
      return {
        ...state,
        viewX: state.viewX + command.anchorX - command.anchorX * scale,
        viewY: state.viewY + command.anchorY - command.anchorY * scale,
        zoomDenominator,
      };
    }

    case "zoom-in": {
      const zoomDenominator = stepZoom(state.zoomDenominator, "in");
      return zoomDenominator === state.zoomDenominator
        ? state
        : { ...state, zoomDenominator };
    }

    case "zoom-out": {
      const zoomDenominator = stepZoom(state.zoomDenominator, "out");
      return zoomDenominator === state.zoomDenominator
        ? state
        : { ...state, zoomDenominator };
    }

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
