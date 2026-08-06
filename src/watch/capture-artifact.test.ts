import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  parseBrowserCaptureMetadata,
  validatePng,
  writeCaptureArtifact,
} from "./capture-artifact";
import type { BrowserCaptureMetadata } from "./protocol";

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

const browser: BrowserCaptureMetadata = {
  cssHeight: 720,
  cssWidth: 1280,
  devicePixelRatio: 2,
  locale: "en-US",
  pixelHeight: 1440,
  pixelWidth: 2560,
  revision: 4,
  userAgent: "mim test browser",
  viewX: 3,
  viewY: -2,
  zoomDenominator: 48,
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, {
    force: true,
    recursive: true,
  })));
});

describe("capture artifacts", () => {
  test("writes a PNG and reproducibility sidecar atomically", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mim-capture-"));
    temporaryDirectories.push(directory);
    const output = join(directory, "frame.png");
    const image = png(browser.pixelWidth, browser.pixelHeight);

    const metadata = await writeCaptureArtifact({
      browser,
      image,
      output,
      runtime: {
        htmlSha256: "html-hash",
        mimDirty: true,
        mimRevision: "abc123",
      },
      source: { revision: 4, source: ":mim 1\n" },
    });

    expect(Array.from(await readFile(output))).toEqual(Array.from(image));
    expect(metadata.browser).toEqual(browser);
    expect(metadata.png.bytes).toBe(image.byteLength);
    expect(metadata.png.sha256).toHaveLength(64);
    expect(metadata.source.sha256).toHaveLength(64);
    expect(JSON.parse(await readFile(`${output}.json`, "utf8"))).toEqual(metadata);
  });

  test("validates browser metadata, PNG bytes, and output boundaries", async () => {
    expect(parseBrowserCaptureMetadata(browser)).toEqual(browser);
    expect(parseBrowserCaptureMetadata({ ...browser, pixelWidth: 0 })).toBeNull();
    expect(parseBrowserCaptureMetadata({ ...browser, devicePixelRatio: 100 })).toBeNull();
    expect(validatePng(png(2560, 1440))).toEqual({ height: 1440, width: 2560 });
    expect(() => validatePng(new Uint8Array([1, 2, 3]))).toThrow("not a PNG");

    const directory = await mkdtemp(join(tmpdir(), "mim-capture-"));
    temporaryDirectories.push(directory);
    await expect(writeCaptureArtifact({
      browser,
      image: png(2560, 1440),
      output: join(directory, "frame.jpg"),
      runtime: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
      source: { revision: 1, source: "source" },
    })).rejects.toThrow("must end in .png");
    await expect(writeCaptureArtifact({
      browser,
      image: png(800, 600),
      output: join(directory, "frame.png"),
      runtime: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
      source: { revision: 1, source: "source" },
    })).rejects.toThrow("do not match browser metadata");
  });
});
