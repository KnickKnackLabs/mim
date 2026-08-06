import { describe, expect, test } from "bun:test";

import type { BrowserCaptureMetadata } from "../watch/protocol";
import {
  captureResultEndpoint,
  uploadWatchCapture,
  uploadWatchCaptureFailure,
} from "./watch-capture";

const metadata: BrowserCaptureMetadata = {
  cssHeight: 720,
  cssWidth: 1280,
  devicePixelRatio: 1,
  locale: "en-US",
  pixelHeight: 720,
  pixelWidth: 1280,
  revision: 7,
  userAgent: "test browser",
  viewX: 2,
  viewY: -3,
  zoomDenominator: 48,
};

describe("browser watch capture", () => {
  test("uploads PNG bytes and current view metadata to the request ID", async () => {
    const sent: Request[] = [];
    await uploadWatchCapture(
      "http://127.0.0.1:4312/?watch=1",
      { id: "capture 7", revision: 7 },
      new Blob(["png"], { type: "image/png" }),
      metadata,
      async (input, init) => {
        sent.push(new Request(input, init));
        return new Response(null, { status: 204 });
      },
    );

    const [request] = sent;
    if (!request) throw new Error("expected a capture upload");
    expect(new URL(request.url).pathname).toBe("/__mim/capture/capture%207");
    const form = await request.formData();
    expect(await (form?.get("image") as Blob).text()).toBe("png");
    expect(JSON.parse(String(form?.get("metadata")))).toEqual(metadata);
  });

  test("reports canvas failures to the exact request", async () => {
    const sent: Request[] = [];
    await uploadWatchCaptureFailure(
      "http://127.0.0.1:4312/?watch=1",
      { id: "capture 8", revision: 8 },
      new Error("encoding failed"),
      async (input, init) => {
        sent.push(new Request(input, init));
        return new Response(null, { status: 204 });
      },
    );

    const [request] = sent;
    if (!request) throw new Error("expected a capture failure");
    expect(new URL(request.url).pathname).toBe("/__mim/capture/capture%208");
    expect(await request.json()).toEqual({
      error: "encoding failed",
      revision: 8,
    });
  });

  test("rejects stale captures and keeps result URLs on the page origin", async () => {
    expect(captureResultEndpoint(
      "http://127.0.0.1:4312/?watch=1",
      "id",
    ).origin).toBe("http://127.0.0.1:4312");
    await expect(uploadWatchCapture(
      "http://127.0.0.1:4312/?watch=1",
      { id: "id", revision: 6 },
      new Blob(),
      metadata,
    )).rejects.toThrow("stale");
  });
});
