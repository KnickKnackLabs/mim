import { describe, expect, test } from "bun:test";

import {
  createTimelineClock,
  type FrameScheduler,
} from "./timeline-clock";

class FakeFrameScheduler implements FrameScheduler {
  cancelled: number[] = [];
  callbacks = new Map<number, (timestampMilliseconds: number) => void>();
  nextHandle = 1;

  cancel(handle: number): void {
    this.cancelled.push(handle);
    this.callbacks.delete(handle);
  }

  request(callback: (timestampMilliseconds: number) => void): number {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    return handle;
  }

  fire(timestampMilliseconds: number): void {
    const entry = this.callbacks.entries().next().value;
    if (!entry) throw new Error("no pending animation frame");
    const [handle, callback] = entry;
    this.callbacks.delete(handle);
    callback(timestampMilliseconds);
  }
}

describe("browser timeline clock", () => {
  test("ticks only while running and keeps one frame pending", () => {
    const scheduler = new FakeFrameScheduler();
    const frames: number[] = [];
    const clock = createTimelineClock((timestamp) => frames.push(timestamp), scheduler);

    clock.setRunning(true);
    clock.setRunning(true);
    expect(scheduler.callbacks.size).toBe(1);

    scheduler.fire(125);
    expect(frames).toEqual([125]);
    expect(scheduler.callbacks.size).toBe(1);

    clock.setRunning(false);
    expect(scheduler.callbacks.size).toBe(0);
    expect(scheduler.cancelled).toHaveLength(1);
  });

  test("cancels pending work and stays silent after close", () => {
    const scheduler = new FakeFrameScheduler();
    const frames: number[] = [];
    const clock = createTimelineClock((timestamp) => frames.push(timestamp), scheduler);

    clock.setRunning(true);
    clock.close();
    clock.setRunning(true);

    expect(scheduler.callbacks.size).toBe(0);
    expect(scheduler.cancelled).toEqual([1]);
    expect(frames).toEqual([]);
  });
});
