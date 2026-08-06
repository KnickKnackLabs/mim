import { describe, expect, test } from "bun:test";

import {
  CAPTURE_EVENT_NAME,
  WATCH_EVENT_NAME,
  WATCH_EVENT_PATH,
  type WatchCaptureRequest,
  type WatchUpdate,
} from "../watch/protocol";
import {
  connectWatchClient,
  watchEndpoint,
  type WatchConnectionStatus,
} from "./watch-client";

class FakeEventSource {
  closed = false;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  readonly listeners = new Map<string, Set<(event: Event) => void>>();

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  emitUpdate(update: unknown): void {
    this.emit(WATCH_EVENT_NAME, new MessageEvent("message", {
      data: JSON.stringify(update),
    }));
  }

  emitCapture(request: unknown): void {
    this.emit(CAPTURE_EVENT_NAME, new MessageEvent("message", {
      data: JSON.stringify(request),
    }));
  }
}

describe("browser watch endpoint", () => {
  test("uses the page origin only in explicit watch mode", () => {
    expect(watchEndpoint("http://127.0.0.1:4312/")).toBeNull();
    expect(watchEndpoint("http://127.0.0.1:4312/?watch=1#legacy")).toBeNull();

    const endpoint = watchEndpoint("http://127.0.0.1:4312/?watch=1");
    expect(endpoint?.origin).toBe("http://127.0.0.1:4312");
    expect(endpoint?.pathname).toBe(WATCH_EVENT_PATH);
  });

  test("reports reconnects, delivers valid updates, and stops callbacks after close", () => {
    const fake = new FakeEventSource();
    const captures: WatchCaptureRequest[] = [];
    const statuses: WatchConnectionStatus[] = [];
    const updates: WatchUpdate[] = [];
    const close = connectWatchClient(
      new URL("http://127.0.0.1:4312/__mim/watch"),
      {
        onCapture: (request) => captures.push(request),
        onStatus: (status) => statuses.push(status),
        onUpdate: (update) => updates.push(update),
      },
      () => fake as unknown as EventSource,
    );

    expect(statuses).toEqual(["connecting"]);
    fake.onopen?.(new Event("open"));
    fake.onerror?.(new Event("error"));
    fake.onopen?.(new Event("open"));
    fake.emitUpdate({ revision: 3, source: ":mim 1\n" });
    fake.emitUpdate({ revision: "bad", source: 4 });
    fake.emitCapture({ id: "capture-1", revision: 3 });
    fake.emitCapture({ id: "", revision: 3 });

    expect(statuses).toEqual([
      "connecting",
      "connected",
      "disconnected",
      "connected",
    ]);
    expect(updates).toEqual([{ revision: 3, source: ":mim 1\n" }]);
    expect(captures).toEqual([{ id: "capture-1", revision: 3 }]);

    close();
    expect(fake.closed).toBe(true);
    fake.emitUpdate({ revision: 4, source: ":mim 1\n" });
    fake.emitCapture({ id: "capture-2", revision: 4 });
    fake.emit("open", new Event("open"));
    expect(updates).toHaveLength(1);
    expect(captures).toHaveLength(1);
    expect(statuses).toHaveLength(4);
  });
});
