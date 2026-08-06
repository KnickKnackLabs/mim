import { describe, expect, test } from "bun:test";

import type { CaptureArtifactMetadata } from "./capture-artifact";
import {
  CaptureSession,
  type CaptureClient,
} from "./capture-session";
import type {
  BrowserCaptureMetadata,
  WatchCaptureRequest,
} from "./protocol";

const browser: BrowserCaptureMetadata = {
  cssHeight: 720,
  cssWidth: 1280,
  devicePixelRatio: 1,
  locale: "en-US",
  pixelHeight: 720,
  pixelWidth: 1280,
  revision: 3,
  userAgent: "test",
  viewX: 0,
  viewY: 0,
  zoomDenominator: 48,
};

function metadata(output: string): CaptureArtifactMetadata {
  return {
    browser,
    capturedAt: "2026-08-05T00:00:00.000Z",
    mim: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
    output,
    png: { bytes: 8, sha256: "p" },
    schemaVersion: 1,
    source: { revision: 3, sha256: "s" },
  };
}

function session(): CaptureSession {
  return new CaptureSession({
    runtime: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
    timeoutMs: 50,
    writeArtifact: async ({ output }) => metadata(output),
  });
}

describe("live browser capture session", () => {
  test("requires one browser and completes its exact revision", async () => {
    const captures = session();
    await expect(captures.request("/tmp/frame.png", null)).rejects.toThrow(
      "no watched revision",
    );
    await expect(captures.request("/tmp/frame.png", {
      revision: 3,
      source: ":mim 1\n",
    })).rejects.toThrow("found 0");

    const requests: WatchCaptureRequest[] = [];
    const disconnect = captures.connect({
      send: (next) => requests.push(next),
    });
    const result = captures.request("/tmp/frame.png", {
      revision: 3,
      source: ":mim 1\n",
    });

    const [request] = requests;
    if (!request) throw new Error("expected a capture request");
    expect(request.revision).toBe(3);
    await captures.complete(request.id, new Uint8Array([1]), browser);
    expect((await result).output).toBe("/tmp/frame.png");
    disconnect();
  });

  test("fails closed for ambiguous clients, source races, and disconnects", async () => {
    const captures = session();
    const client: CaptureClient = { send: () => undefined };
    const disconnectOne = captures.connect(client);
    const disconnectTwo = captures.connect({ send: () => undefined });
    await expect(captures.request("/tmp/frame.png", {
      revision: 3,
      source: "source",
    })).rejects.toThrow("found 2");
    disconnectTwo();

    const stale = captures.request("/tmp/frame.png", {
      revision: 3,
      source: "source",
    });
    captures.sourceAdvanced(4);
    await expect(stale).rejects.toThrow("source changed");

    const disconnected = captures.request("/tmp/frame.png", {
      revision: 5,
      source: "source",
    });
    disconnectOne();
    await expect(disconnected).rejects.toThrow("browser disconnected");
  });

  test("reports browser failures promptly", async () => {
    const captures = session();
    const requests: WatchCaptureRequest[] = [];
    captures.connect({ send: (request) => requests.push(request) });

    const failed = captures.request("/tmp/frame.png", {
      revision: 3,
      source: "source",
    });
    const failureRequest = requests.shift();
    if (!failureRequest) throw new Error("expected a capture request");
    captures.fail(failureRequest.id, 3, "canvas encoding failed");
    await expect(failed).rejects.toThrow("canvas encoding failed");
  });

  test("does not invalidate a received image while its artifact is written", async () => {
    let finishWrite: (value: CaptureArtifactMetadata) => void = () => {
      throw new Error("artifact writing did not start");
    };
    const artifact = new Promise<CaptureArtifactMetadata>((resolve) => {
      finishWrite = resolve;
    });
    const captures = new CaptureSession({
      runtime: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
      timeoutMs: 50,
      writeArtifact: () => artifact,
    });
    const requests: WatchCaptureRequest[] = [];
    captures.connect({ send: (next) => requests.push(next) });
    const result = captures.request("/tmp/frame.png", {
      revision: 3,
      source: "source",
    });
    const [request] = requests;
    if (!request) throw new Error("expected a capture request");
    const completing = captures.complete(request.id, new Uint8Array([1]), browser);
    await expect(captures.complete(
      request.id,
      new Uint8Array([1]),
      browser,
    )).rejects.toThrow("already received");
    captures.sourceAdvanced(4);
    finishWrite(metadata("/tmp/frame.png"));

    await expect(completing).resolves.toEqual(metadata("/tmp/frame.png"));
    await expect(result).resolves.toEqual(metadata("/tmp/frame.png"));
  });

  test("times out a browser that does not respond", async () => {
    const captures = session();
    captures.connect({ send: () => undefined });
    await expect(captures.request("/tmp/frame.png", {
      revision: 3,
      source: "source",
    })).rejects.toThrow("timed out");
  });
});
