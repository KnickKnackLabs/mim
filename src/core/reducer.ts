import type { Command } from "./commands";
import {
  createInitialState,
  MAX_ZOOM_DENOMINATOR,
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

function normalizeCursor(cursor: Cursor): Cursor {
  return {
    x: Math.round(cursor.x),
    y: Math.round(cursor.y),
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

    case "toggle-pin-cursor":
      return { ...state, pinCursor: !state.pinCursor };

    case "start-motion": {
      const cursor = state.cursor ?? { x: 0, y: 0 };
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
      return { ...state, cursor: normalizeCursor(command) };

    case "pan-view":
      return Number.isFinite(command.dx) && Number.isFinite(command.dy)
        ? { ...state, viewX: state.viewX + command.dx, viewY: state.viewY + command.dy }
        : state;

    case "move-cursor": {
      const cursor = state.cursor ?? { x: 0, y: 0 };
      return {
        ...state,
        cursor: normalizeCursor(
          { x: cursor.x + command.dx, y: cursor.y + command.dy },
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
      let cursor = state.cursor ?? { x: 0, y: 0 };
      for (const motion of motions) {
        cursor = normalizeCursor(
          { x: cursor.x + motion.dx, y: cursor.y + motion.dy },
        );
      }
      return { ...state, cursor };
    }
  }
}
