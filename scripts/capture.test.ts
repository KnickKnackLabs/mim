import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import {
  parseCaptureArguments,
  requestLiveCapture,
} from "./capture";

describe("live capture command", () => {
  test("accepts one loopback watch URL and PNG output", () => {
    const parsed = parseCaptureArguments([
      "capture",
      "http://127.0.0.1:4312/?watch=1",
      "frame.png",
    ]);
    expect(parsed.session.origin).toBe("http://127.0.0.1:4312");
    expect(parsed.output).toBe(resolve("frame.png"));
  });

  test("rejects remote sessions and non-PNG output", () => {
    expect(() => parseCaptureArguments([
      "capture",
      "https://example.com/?watch=1",
      "frame.png",
    ])).toThrow("loopback HTTP");
    expect(() => parseCaptureArguments([
      "capture",
      "http://127.0.0.1:4312/?watch=1",
      "frame.jpg",
    ])).toThrow("must end in .png");
  });

  test("sends the output only to the loopback control endpoint", async () => {
    const requested: Request[] = [];
    const metadata = {
      output: resolve("frame.png"),
      schemaVersion: 2,
    };
    const result = await requestLiveCapture(
      parseCaptureArguments([
        "http://127.0.0.1:4312/?watch=1",
        "frame.png",
      ]),
      async (input, init) => {
        requested.push(new Request(input, init));
        return Response.json(metadata);
      },
    );

    const [request] = requested;
    if (!request) throw new Error("expected a capture request");
    expect(new URL(request.url).pathname).toBe("/__mim/capture");
    expect(await request.json()).toEqual({ output: resolve("frame.png") });
    expect(result.output).toBe(resolve("frame.png"));
  });

  test("rejects mismatched capture metadata", async () => {
    const args = parseCaptureArguments([
      "http://127.0.0.1:4312/?watch=1",
      "frame.png",
    ]);
    await expect(requestLiveCapture(
      args,
      async () => Response.json({
        output: resolve("other.png"),
        schemaVersion: 2,
      }),
    )).rejects.toThrow("invalid capture metadata");
  });
});
