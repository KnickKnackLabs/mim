import type { Command } from "./commands";
import {
  createInitialState,
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

function normalizeZoomDenominator(value: number): number {
  return clamp(
    Math.round(value),
    MIN_ZOOM_DENOMINATOR,
    MAX_ZOOM_DENOMINATOR,
  );
}

function stepZoom(current: number, direction: "in" | "out"): number {
  return normalizeZoomDenominator(current + (direction === "in" ? -1 : 1));
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

    case "escape":
      return state.helpVisible
        ? { ...state, helpVisible: false }
        : {
            ...state,
            recordedMotion: [],
            recordingMotion: [],
            motionEnd: null,
            motionStart: null,
          };

    case "reset-defaults":
      return createInitialState();

    case "toggle-help":
      return { ...state, helpVisible: !state.helpVisible };

    case "start-motion": {
      const cursor = state.cursor ?? { x: 1, y: 1 };
      return {
        ...state,
        cursor,
        recordingMotion: [],
        motionEnd: null,
        motionStart: { ...cursor },
      };
    }

    case "finish-motion": {
      if (!state.motionStart || !state.cursor) return state;
      return {
        ...state,
        recordedMotion: [...state.recordingMotion],
        motionEnd: { ...state.cursor },
      };
    }

    case "set-operation":
      return { ...state, operation: command.operation };

    case "toggle-prime-results":
      return { ...state, showPrimeResults: !state.showPrimeResults };

    case "set-zoom-denominator": {
      if (!Number.isFinite(command.value)) return state;
      const zoomDenominator = normalizeZoomDenominator(command.value);
      return zoomDenominator === state.zoomDenominator
        ? state
        : { ...state, zoomDenominator };
    }

    case "zoom-at": {
      if (
        !Number.isFinite(command.anchorX)
        || !Number.isFinite(command.anchorY)
        || !Number.isFinite(command.denominator)
      ) return state;
      const zoomDenominator = normalizeZoomDenominator(command.denominator);
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

    case "pan-view":
      return Number.isFinite(command.dx) && Number.isFinite(command.dy)
        ? { ...state, viewX: state.viewX + command.dx, viewY: state.viewY + command.dy }
        : state;

    case "move-cursor": {
      const cursor = state.cursor ?? { x: 1, y: 1 };
      return {
        ...state,
        cursor: clampCursor(
          { x: cursor.x + command.dx, y: cursor.y + command.dy },
          state,
        ),
        recordedMotion: state.motionStart && !state.motionEnd
          ? state.recordedMotion
          : [{ dx: command.dx, dy: command.dy }],
        recordingMotion: state.motionStart && !state.motionEnd
          ? [...state.recordingMotion, { dx: command.dx, dy: command.dy }]
          : state.recordingMotion,
      };
    }

    case "repeat-motion": {
      if (state.recordedMotion.length === 0) return state;
      const motions = command.reverse
        ? [...state.recordedMotion].reverse().map(({ dx, dy }) => ({ dx: -dx, dy: -dy }))
        : state.recordedMotion;
      let cursor = state.cursor ?? { x: 1, y: 1 };
      for (const motion of motions) {
        cursor = clampCursor(
          { x: cursor.x + motion.dx, y: cursor.y + motion.dy },
          state,
        );
      }
      return { ...state, cursor };
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
        motionEnd: next.motionEnd ? clampCursor(next.motionEnd, next) : null,
        motionStart: next.motionStart ? clampCursor(next.motionStart, next) : null,
      };
    }
  }
}
