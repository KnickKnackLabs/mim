import type { VariationPlan } from "../program";
import {
  createTimelineState,
  reduceTimeline,
  timelineFrameAt,
  type TimelineState,
} from "../timeline";

export interface CaptureTimelinePause {
  elapsedSeconds: number;
  resume: boolean;
  state: TimelineState;
}

export function timelineAfterProgramUpdate(
  state: TimelineState,
  accepted: boolean,
  timestampMilliseconds: number,
): TimelineState {
  return accepted ? createTimelineState(timestampMilliseconds) : state;
}

export function pauseTimelineForCapture(
  variations: readonly VariationPlan[],
  state: TimelineState,
  timestampMilliseconds: number,
): CaptureTimelinePause {
  const frame = timelineFrameAt(variations, state, timestampMilliseconds);
  const resume = state.playing && frame.hasFutureVariation;
  return {
    elapsedSeconds: frame.elapsedSeconds,
    resume,
    state: resume
      ? reduceTimeline(state, { timestampMilliseconds, type: "pause" })
      : state,
  };
}

export function resumeTimelineAfterCapture(
  state: TimelineState,
  resume: boolean,
  timestampMilliseconds: number,
): TimelineState {
  return resume
    ? reduceTimeline(state, { timestampMilliseconds, type: "play" })
    : state;
}
