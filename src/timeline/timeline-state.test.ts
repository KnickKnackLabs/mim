import { describe, expect, test } from "bun:test";
import type { VariationPlan } from "../program";
import {
  createTimelineState,
  reduceTimeline,
  timelineElapsedSeconds,
  timelineHasFutureVariation,
} from "./timeline-state";

const span = {
  end: { column: 1, line: 1, offset: 0 },
  start: { column: 1, line: 1, offset: 0 },
};

function once(durationSeconds: number): VariationPlan {
  return {
    durationSeconds,
    from: 0,
    mode: "once",
    parameter: "phase",
    span,
    to: 1,
  };
}

describe("deterministic timeline state", () => {
  test("derives elapsed time from an anchor instead of accumulating frame deltas", () => {
    const state = createTimelineState(1_000);
    expect(timelineElapsedSeconds(state, 1_000)).toBe(0);
    expect(timelineElapsedSeconds(state, 1_250)).toBe(0.25);
    expect(timelineElapsedSeconds(state, 5_000)).toBe(4);
  });

  test("pauses, resumes, and restarts without losing logical time", () => {
    let state = createTimelineState(1_000);
    state = reduceTimeline(state, { type: "pause", timestampMilliseconds: 3_000 });
    expect(timelineElapsedSeconds(state, 9_000)).toBe(2);

    state = reduceTimeline(state, { type: "play", timestampMilliseconds: 9_000 });
    expect(timelineElapsedSeconds(state, 10_500)).toBe(3.5);

    state = reduceTimeline(state, { type: "pause", timestampMilliseconds: 11_000 });
    state = reduceTimeline(state, { type: "restart", timestampMilliseconds: 12_000 });
    expect(state.playing).toBe(true);
    expect(timelineElapsedSeconds(state, 12_250)).toBe(0.25);
  });

  test("changes speed without introducing an elapsed-time discontinuity", () => {
    let state = createTimelineState(0);
    state = reduceTimeline(state, {
      speed: 2,
      timestampMilliseconds: 2_000,
      type: "set-speed",
    });
    expect(timelineElapsedSeconds(state, 2_000)).toBe(2);
    expect(timelineElapsedSeconds(state, 3_000)).toBe(4);

    state = reduceTimeline(state, {
      speed: 0.5,
      timestampMilliseconds: 4_000,
      type: "set-speed",
    });
    expect(timelineElapsedSeconds(state, 6_000)).toBe(7);
  });

  test("bounds speed and rejects invalid or backward clocks", () => {
    const state = createTimelineState(1_000);
    expect(() => reduceTimeline(state, {
      speed: 0,
      timestampMilliseconds: 1_000,
      type: "set-speed",
    })).toThrow(RangeError);
    expect(() => reduceTimeline(state, {
      speed: 5,
      timestampMilliseconds: 1_000,
      type: "set-speed",
    })).toThrow(RangeError);
    expect(() => timelineElapsedSeconds(state, 999)).toThrow(RangeError);
  });

  test("stops requesting frames after every once variation finishes", () => {
    expect(timelineHasFutureVariation([], 0)).toBe(false);
    expect(timelineHasFutureVariation([once(2), once(4)], 3)).toBe(true);
    expect(timelineHasFutureVariation([once(2), once(4)], 4)).toBe(false);
    expect(timelineHasFutureVariation([
      once(2),
      { ...once(2), mode: "loop", parameter: "looping" },
    ], 100)).toBe(true);
  });
});
