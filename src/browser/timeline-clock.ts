export interface FrameScheduler {
  cancel(handle: number): void;
  request(callback: (timestampMilliseconds: number) => void): number;
}

export interface TimelineClock {
  close(): void;
  setRunning(running: boolean): void;
}

const browserFrameScheduler: FrameScheduler = {
  cancel: (handle) => cancelAnimationFrame(handle),
  request: (callback) => requestAnimationFrame(callback),
};

export function createTimelineClock(
  onFrame: (timestampMilliseconds: number) => void,
  scheduler: FrameScheduler = browserFrameScheduler,
): TimelineClock {
  let closed = false;
  let pending: number | null = null;
  let running = false;

  function schedule(): void {
    if (closed || !running || pending !== null) return;
    pending = scheduler.request((timestampMilliseconds) => {
      pending = null;
      if (closed || !running) return;
      onFrame(timestampMilliseconds);
      schedule();
    });
  }

  return {
    close() {
      closed = true;
      running = false;
      if (pending !== null) scheduler.cancel(pending);
      pending = null;
    },
    setRunning(next) {
      if (closed || next === running) return;
      running = next;
      if (!running && pending !== null) {
        scheduler.cancel(pending);
        pending = null;
      }
      schedule();
    },
  };
}
