import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

function png(width: number, height: number): Uint8Array<ArrayBuffer> {
  const image = new Uint8Array(new ArrayBuffer(24));
  image.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(image.buffer);
  view.setUint32(8, 13);
  image.set([73, 72, 68, 82], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return image;
}

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
        cssHeight: 600,
        cssWidth: 800,
        devicePixelRatio: 1,
        locale: "en-US",
        pixelHeight: 600,
        pixelWidth: 800,
        revision: 2,
        userAgent: "test browser",
        viewX: 0,
        viewY: 0,
        zoomDenominator: 48,
      };
      const form = new FormData();
      form.append("image", new Blob([
        png(browser.pixelWidth, browser.pixelHeight),
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
});
