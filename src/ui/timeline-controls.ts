import {
  MAX_TIMELINE_SPEED,
  MIN_TIMELINE_SPEED,
} from "../timeline";

export const TIMELINE_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export type TimelineControlIntent =
  | { type: "pause" | "play" | "restart" }
  | { speed: number; type: "set-speed" };

export function nextTimelineSpeed(speed: number): number {
  const index = TIMELINE_SPEEDS.indexOf(speed as typeof TIMELINE_SPEEDS[number]);
  const next = TIMELINE_SPEEDS[(index + 1) % TIMELINE_SPEEDS.length];
  if (next < MIN_TIMELINE_SPEED || next > MAX_TIMELINE_SPEED) {
    throw new RangeError("timeline control speed is outside runtime bounds");
  }
  return next;
}
