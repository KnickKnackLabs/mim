import { describe, expect, test } from "bun:test";

import {
  CAPTURE_EVENT_NAME,
  captureResultPath,
  decodeCaptureRequest,
  decodeWatchUpdate,
  encodeCaptureEvent,
  encodeWatchEvent,
  parseBrowserCaptureFailure,
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

  test("round-trips capture requests and result paths", () => {
    const request = { id: "capture 7", revision: 9 };
    const event = encodeCaptureEvent(request);
    const data = event.split("\n").find((line) => line.startsWith("data: "))?.slice(6);

    expect(event).toStartWith(`event: ${CAPTURE_EVENT_NAME}\n`);
    expect(data && decodeCaptureRequest(data)).toEqual(request);
    expect(captureResultPath(request.id)).toBe("/__mim/capture/capture%207");
  });

  test("rejects malformed or incomplete messages", () => {
    expect(decodeWatchUpdate("not json")).toBeNull();
    expect(decodeWatchUpdate('{"revision":0,"source":"x"}')).toBeNull();
    expect(decodeWatchUpdate('{"revision":1}')).toBeNull();
    expect(decodeCaptureRequest('{"id":"","revision":1}')).toBeNull();
    expect(decodeCaptureRequest('{"id":"x","revision":0}')).toBeNull();
    expect(parseBrowserCaptureFailure({ error: "encoding failed", revision: 2 })).toEqual({
      error: "encoding failed",
      revision: 2,
    });
    expect(parseBrowserCaptureFailure({ error: "", revision: 2 })).toBeNull();
  });
});
