import { describe, expect, test } from "bun:test";

import {
  decodeWatchUpdate,
  encodeWatchEvent,
  WATCH_EVENT_NAME,
} from "./protocol";

describe("watch transport protocol", () => {
  test("round-trips a source revision through an SSE event", () => {
    const update = { revision: 7, source: ":mim 1\n:field 42\n" };
    const event = encodeWatchEvent(update);
    const data = event.split("\n").find((line) => line.startsWith("data: "))?.slice(6);

    expect(event).toStartWith(`event: ${WATCH_EVENT_NAME}\n`);
    expect(data && decodeWatchUpdate(data)).toEqual(update);
  });

  test("rejects malformed or incomplete updates", () => {
    expect(decodeWatchUpdate("not json")).toBeNull();
    expect(decodeWatchUpdate('{"revision":0,"source":"x"}')).toBeNull();
    expect(decodeWatchUpdate('{"revision":1}')).toBeNull();
  });
});
