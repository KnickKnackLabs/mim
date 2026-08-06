import type { VariationPlan } from "../program";
import { variationOverridesAt } from "./evaluate-variation";
import {
  timelineElapsedSeconds,
  timelineHasFutureVariation,
  type TimelineState,
} from "./timeline-state";

export interface TimelineFrame {
  elapsedSeconds: number;
  hasFutureVariation: boolean;
  overrides: Readonly<Record<string, number>>;
}

export function timelineFrameAt(
  variations: readonly VariationPlan[],
  state: TimelineState,
  timestampMilliseconds: number,
): TimelineFrame {
  if (variations.length === 0) {
    return {
      elapsedSeconds: 0,
      hasFutureVariation: false,
      overrides: {},
    };
  }
  const elapsedSeconds = timelineElapsedSeconds(state, timestampMilliseconds);
  return {
    elapsedSeconds,
    hasFutureVariation: timelineHasFutureVariation(variations, elapsedSeconds),
    overrides: variationOverridesAt(variations, elapsedSeconds),
  };
}
