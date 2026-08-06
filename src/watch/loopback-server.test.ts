import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { onePixelPng } from "./capture-test-support";
import { startLoopbackWatchServer } from "./loopback-server";
import {
  CAPTURE_CONTROL_PATH,
  CAPTURE_EVENT_NAME,
  captureResultPath,
  WATCH_EVENT_PATH,
  type BrowserCaptureMetadata,
} from "./protocol";

const runtime = { htmlSha256: "html", mimDirty: false, mimRevision: "revision" };
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, {
    force: true,
    recursive: true,
  })));
});

async function readEvent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  eventName: string,
): Promise<string> {
  let source = "";
  while (!source.includes(`event: ${eventName}\n`)) {
    const next = await reader.read();
    if (next.done) throw new Error(`stream closed before ${eventName}`);
    source += new TextDecoder().decode(next.value);
  }
  return source;
}

async function drainClosedStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<void> {
  try {
    while (!(await reader.read()).done) {
      // EventSource consumes continuously while the server is alive.
    }
  } catch {
    // Forced server shutdown may reset the HTTP stream.
  }
}

describe("loopback watch server", () => {
  test("serves only loopback content, streams revisions, and closes clients", async () => {
    const server = startLoopbackWatchServer({
      html: "<main>mim</main>",
      runtime,
    });
    expect(server.url.hostname).toBe("127.0.0.1");

    const page = await fetch(server.url);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("<main>mim</main>");

    server.publish({ revision: 1, source: ":mim 1\n:field 1\n" });
    const response = await fetch(new URL(WATCH_EVENT_PATH, server.url));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("watch response must have a body");
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('"revision":1');

    await server.close();
    let clientClosed = false;
    try {
      clientClosed = (await reader.read()).done;
    } catch {
      clientClosed = true;
    }
    expect(clientClosed).toBe(true);
  });

  test("keeps quiet event streams alive", async () => {
    const server = startLoopbackWatchServer({
      html: "<main>mim</main>",
      idleTimeoutSeconds: 1,
      runtime,
    });

    try {
      server.publish({ revision: 1, source: ":mim 1\n:field 1\n" });
      const response = await fetch(new URL(WATCH_EVENT_PATH, server.url));
      const reader = response.body?.getReader();
      if (!reader) throw new Error("watch response must have a body");

      const first = await reader.read();
      expect(new TextDecoder().decode(first.value)).toContain('"revision":1');

      await Bun.sleep(1_100);
      server.publish({ revision: 2, source: ":mim 1\n:field 2\n" });
      const second = await reader.read();
      expect(new TextDecoder().decode(second.value)).toContain('"revision":2');
    } finally {
      await server.close();
    }
  });

  test("requests a PNG from the sole browser and returns its artifact metadata", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mim-live-capture-"));
    temporaryDirectories.push(directory);
    const output = join(directory, "capture.png");
    const server = startLoopbackWatchServer({
      captureTimeoutMs: 500,
      html: "<main>mim</main>",
      runtime,
    });

    try {
      server.publish({ revision: 2, source: ":mim 1\n" });
      const events = await fetch(new URL(WATCH_EVENT_PATH, server.url));
      const reader = events.body?.getReader();
      if (!reader) throw new Error("watch response must have a body");
      await readEvent(reader, "mim-source");

      const control = fetch(new URL(CAPTURE_CONTROL_PATH, server.url), {
        body: JSON.stringify({ output }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const captureEvent = await readEvent(reader, CAPTURE_EVENT_NAME);
      const captureData = captureEvent
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice(6);
      const capture = JSON.parse(captureData ?? "null") as { id: string; revision: number };
      expect(capture.revision).toBe(2);

      const browser: BrowserCaptureMetadata = {
        cssHeight: 1,
        cssWidth: 1,
        devicePixelRatio: 1,
        locale: "en-US",
        parameters: { phase: 8 },
        pixelHeight: 1,
        pixelWidth: 1,
        revision: 2,
        timelineElapsedSeconds: 2,
        userAgent: "test browser",
        viewX: 0,
        viewY: 0,
        zoomDenominator: 48,
      };
      const form = new FormData();
      form.append("image", new Blob([
        onePixelPng(),
      ], { type: "image/png" }), "capture.png");
      form.append("metadata", JSON.stringify(browser));
      const upload = await fetch(new URL(captureResultPath(capture.id), server.url), {
        body: form,
        method: "POST",
      });
      expect(upload.status).toBe(204);

      const response = await control;
      expect(response.status).toBe(200);
      const metadata = await response.json();
      expect(metadata.output).toBe(output);
      expect(metadata.browser).toEqual(browser);
      expect(new Uint8Array(await readFile(output)).slice(0, 8)).toEqual(
        Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      expect(JSON.parse(await readFile(`${output}.json`, "utf8"))).toEqual(metadata);

      server.publish({ revision: 3, source: ":mim 1\n:field (\n" }, false);
      await readEvent(reader, "mim-source");
      const invalid = await fetch(new URL(CAPTURE_CONTROL_PATH, server.url), {
        body: JSON.stringify({ output }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(invalid.status).toBe(409);
      expect(await invalid.json()).toEqual({ error: "watched source is invalid" });

      server.publish({ revision: 4, source: ":mim 1\n" }, true);
      await readEvent(reader, "mim-source");
      const failedControl = fetch(new URL(CAPTURE_CONTROL_PATH, server.url), {
        body: JSON.stringify({ output }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const failedEvent = await readEvent(reader, CAPTURE_EVENT_NAME);
      const failedData = failedEvent
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice(6);
      const failedRequest = JSON.parse(failedData ?? "null") as {
        id: string;
        revision: number;
      };
      const failedUpload = await fetch(
        new URL(captureResultPath(failedRequest.id), server.url),
        {
          body: JSON.stringify({ error: "canvas failed", revision: 4 }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      expect(failedUpload.status).toBe(204);
      const failedResponse = await failedControl;
      expect(failedResponse.status).toBe(422);
      expect(await failedResponse.json()).toEqual({
        error: "browser capture failed: canvas failed",
      });
    } finally {
      await server.close();
    }
  });

  test("fails closed for foreign origins, oversized controls, and ambiguous browsers", async () => {
    const server = startLoopbackWatchServer({
      html: "<main>mim</main>",
      runtime,
    });
    const readers: Array<ReadableStreamDefaultReader<Uint8Array>> = [];

    try {
      server.publish({ revision: 1, source: ":mim 1\n" });
      const foreign = await fetch(server.url, {
        headers: { Origin: "https://example.com" },
      });
      expect(foreign.status).toBe(403);

      const oversized = await fetch(new URL(CAPTURE_CONTROL_PATH, server.url), {
        body: JSON.stringify({ output: `/tmp/${"x".repeat(9_000)}.png` }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(oversized.status).toBe(413);

      const relative = await fetch(new URL(CAPTURE_CONTROL_PATH, server.url), {
        body: JSON.stringify({ output: "frame.png" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(relative.status).toBe(400);

      const absent = await fetch(new URL(CAPTURE_CONTROL_PATH, server.url), {
        body: JSON.stringify({ output: "/tmp/frame.png" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(absent.status).toBe(409);
      expect(await absent.json()).toEqual({
        error: "capture requires exactly one connected browser; found 0",
      });

      const [first, second] = await Promise.all([
        fetch(new URL(WATCH_EVENT_PATH, server.url)),
        fetch(new URL(WATCH_EVENT_PATH, server.url)),
      ]);
      const firstReader = first.body?.getReader();
      const secondReader = second.body?.getReader();
      if (!firstReader || !secondReader) throw new Error("watch clients need bodies");
      readers.push(firstReader, secondReader);
      await Promise.all([
        readEvent(firstReader, "mim-source"),
        readEvent(secondReader, "mim-source"),
      ]);

      const ambiguous = await fetch(new URL(CAPTURE_CONTROL_PATH, server.url), {
        body: JSON.stringify({ output: "/tmp/frame.png" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(ambiguous.status).toBe(409);
      expect(await ambiguous.json()).toEqual({
        error: "capture requires exactly one connected browser; found 2",
      });
    } finally {
      const drains = readers.map((reader) => drainClosedStream(reader));
      await server.close();
      await Promise.all(drains);
    }
  });
});
