import type { VariationPlan } from "../program";

export const MIN_TIMELINE_SPEED = 0.25;
export const MAX_TIMELINE_SPEED = 4;

export interface TimelineState {
  anchorElapsedSeconds: number;
  anchorTimestampMilliseconds: number;
  playing: boolean;
  speed: number;
}

export type TimelineCommand =
  | { type: "pause"; timestampMilliseconds: number }
  | { type: "play"; timestampMilliseconds: number }
  | { type: "restart"; timestampMilliseconds: number }
  | { type: "set-speed"; speed: number; timestampMilliseconds: number };

function requireTimestamp(timestampMilliseconds: number): void {
  if (!Number.isFinite(timestampMilliseconds) || timestampMilliseconds < 0) {
    throw new RangeError("timeline timestamp must be finite and nonnegative");
  }
}

function requireSpeed(speed: number): void {
  if (
    !Number.isFinite(speed)
    || speed < MIN_TIMELINE_SPEED
    || speed > MAX_TIMELINE_SPEED
  ) {
    throw new RangeError(
      `timeline speed must be between ${MIN_TIMELINE_SPEED} and ${MAX_TIMELINE_SPEED}`,
    );
  }
}

export function createTimelineState(timestampMilliseconds: number): TimelineState {
  requireTimestamp(timestampMilliseconds);
  return {
    anchorElapsedSeconds: 0,
    anchorTimestampMilliseconds: timestampMilliseconds,
    playing: true,
    speed: 1,
  };
}

export function timelineElapsedSeconds(
  state: TimelineState,
  timestampMilliseconds: number,
): number {
  requireTimestamp(timestampMilliseconds);
  if (timestampMilliseconds < state.anchorTimestampMilliseconds) {
    throw new RangeError("timeline timestamp cannot precede its anchor");
  }
  if (!state.playing) return state.anchorElapsedSeconds;
  const elapsed = state.anchorElapsedSeconds
    + (timestampMilliseconds - state.anchorTimestampMilliseconds) / 1000 * state.speed;
  if (!Number.isFinite(elapsed)) {
    throw new RangeError("timeline elapsed time exceeded the finite numeric range");
  }
  return elapsed;
}

export function reduceTimeline(
  state: TimelineState,
  command: TimelineCommand,
): TimelineState {
  const elapsed = timelineElapsedSeconds(state, command.timestampMilliseconds);

  if (command.type === "pause") {
    return state.playing
      ? {
          ...state,
          anchorElapsedSeconds: elapsed,
          anchorTimestampMilliseconds: command.timestampMilliseconds,
          playing: false,
        }
      : state;
  }

  if (command.type === "play") {
    return state.playing
      ? state
      : {
          ...state,
          anchorTimestampMilliseconds: command.timestampMilliseconds,
          playing: true,
        };
  }

  if (command.type === "restart") {
    return {
      ...state,
      anchorElapsedSeconds: 0,
      anchorTimestampMilliseconds: command.timestampMilliseconds,
      playing: true,
    };
  }

  requireSpeed(command.speed);
  return {
    ...state,
    anchorElapsedSeconds: elapsed,
    anchorTimestampMilliseconds: command.timestampMilliseconds,
    speed: command.speed,
  };
}

export function timelineHasFutureVariation(
  variations: readonly VariationPlan[],
  elapsedSeconds: number,
): boolean {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError("timeline elapsed time must be finite and nonnegative");
  }
  return variations.some(
    (variation) => variation.mode !== "once" || elapsedSeconds < variation.durationSeconds,
  );
}
