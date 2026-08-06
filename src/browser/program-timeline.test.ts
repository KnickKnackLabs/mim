import { describe, expect, test } from "bun:test";

import type { VariationPlan } from "../program";
import {
  createTimelineState,
  timelineElapsedSeconds,
  timelineFrameAt,
} from "../timeline";
import {
  pauseTimelineForCapture,
  resumeTimelineAfterCapture,
  timelineAfterProgramUpdate,
} from "./program-timeline";

const variation: VariationPlan = {
  durationSeconds: 8,
  from: 0,
  kind: "linear",
  mode: "loop",
  parameter: "phase",
  span: {
    end: { column: 2, line: 1, offset: 1 },
    start: { column: 1, line: 1, offset: 0 },
  },
  to: 32,
};

describe("browser program timeline", () => {
  test("resets only after an accepted program replacement", () => {
    const state = createTimelineState(1_000);
    expect(timelineAfterProgramUpdate(state, false, 5_000)).toBe(state);
    expect(timelineAfterProgramUpdate(state, true, 5_000)).toEqual(
      createTimelineState(5_000),
    );
  });

  test("freezes the exact capture frame and resumes without advancing during encoding", () => {
    const initial = createTimelineState(1_000);
    const paused = pauseTimelineForCapture([variation], initial, 3_000);
    expect(paused.elapsedSeconds).toBe(2);
    expect(paused.resume).toBe(true);
    expect(timelineElapsedSeconds(paused.state, 8_000)).toBe(2);

    const resumed = resumeTimelineAfterCapture(paused.state, paused.resume, 8_000);
    expect(timelineElapsedSeconds(resumed, 9_000)).toBe(3);
  });

  test("freezes the exact discrete value for capture metadata", () => {
    const discrete: VariationPlan = {
      everySeconds: 0.5,
      kind: "discrete",
      mode: "loop",
      parameter: "p",
      span: variation.span,
      values: [2, 3, 5, 7],
    };
    const paused = pauseTimelineForCapture(
      [discrete],
      createTimelineState(1_000),
      2_250,
    );
    expect(paused.elapsedSeconds).toBe(1.25);
    expect(timelineFrameAt([discrete], paused.state, 8_000).overrides).toEqual({ p: 5 });
  });

  test("does not invent playback for a static program", () => {
    const state = createTimelineState(1_000);
    const paused = pauseTimelineForCapture([], state, 3_000);
    expect(paused).toEqual({ elapsedSeconds: 0, resume: false, state });
    expect(resumeTimelineAfterCapture(state, false, 5_000)).toBe(state);
  });
});
