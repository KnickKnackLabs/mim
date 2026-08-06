import { describe, expect, test } from "bun:test";

import { nextTimelineSpeed, TIMELINE_SPEEDS } from "./timeline-controls";

describe("timeline controls", () => {
  test("cycles through every supported bounded speed", () => {
    expect(TIMELINE_SPEEDS.map(nextTimelineSpeed)).toEqual([0.5, 1, 2, 4, 0.25]);
  });

  test("recovers an unknown display speed to the first supported speed", () => {
    expect(nextTimelineSpeed(3)).toBe(0.25);
  });
});
