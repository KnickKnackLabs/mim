import { describe, expect, test } from "bun:test";

import type { VariationPlan } from "../program";
import { timelineFrameAt } from "./timeline-frame";
import { createTimelineState, reduceTimeline } from "./timeline-state";

const loop: VariationPlan = {
  durationSeconds: 8,
  from: 0,
  mode: "loop",
  parameter: "phase",
  span: {
    end: { column: 2, line: 1, offset: 1 },
    start: { column: 1, line: 1, offset: 0 },
  },
  to: 32,
};

const once: VariationPlan = { ...loop, mode: "once" };

describe("timeline frames", () => {
  test("maps a browser timestamp to deterministic parameter overrides", () => {
    const frame = timelineFrameAt([loop], createTimelineState(1_000), 3_000);
    expect(frame).toEqual({
      elapsedSeconds: 2,
      hasFutureVariation: true,
      overrides: { phase: 8 },
    });
  });

  test("keeps a paused frame stable and marks completed once variations", () => {
    const playing = createTimelineState(0);
    const paused = reduceTimeline(playing, {
      timestampMilliseconds: 9_000,
      type: "pause",
    });
    const frame = timelineFrameAt([once], paused, 20_000);
    expect(frame.elapsedSeconds).toBe(9);
    expect(frame.overrides).toEqual({ phase: 32 });
    expect(frame.hasFutureVariation).toBe(false);
  });

  test("keeps programs without variation static", () => {
    expect(timelineFrameAt([], createTimelineState(0), 5_000)).toEqual({
      elapsedSeconds: 0,
      hasFutureVariation: false,
      overrides: {},
    });
  });
});
