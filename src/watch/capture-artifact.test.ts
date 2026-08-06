import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  parseBrowserCaptureMetadata,
  validatePng,
  writeCaptureArtifact,
} from "./capture-artifact";
import { onePixelPng } from "./capture-test-support";
import type { BrowserCaptureMetadata } from "./protocol";

const temporaryDirectories: string[] = [];

const browser: BrowserCaptureMetadata = {
  cssHeight: 1,
  cssWidth: 1,
  devicePixelRatio: 1,
  locale: "en-US",
  parameters: { p: 31, phase: 2.5 },
  pixelHeight: 1,
  pixelWidth: 1,
  revision: 4,
  timelineElapsedSeconds: 2.5,
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
    const image = onePixelPng();

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
    expect(metadata.schemaVersion).toBe(2);
    expect(metadata.browser.timelineElapsedSeconds).toBe(2.5);
    expect(metadata.browser.parameters).toEqual({ p: 31, phase: 2.5 });
    expect(metadata.source.sha256).toHaveLength(64);
    expect(JSON.parse(await readFile(`${output}.json`, "utf8"))).toEqual(metadata);
  });

  test("validates browser metadata, PNG bytes, and output boundaries", async () => {
    expect(parseBrowserCaptureMetadata(browser)).toEqual(browser);
    expect(parseBrowserCaptureMetadata({ ...browser, pixelWidth: 0 })).toBeNull();
    expect(parseBrowserCaptureMetadata({ ...browser, pixelWidth: 2 })).toBeNull();
    expect(parseBrowserCaptureMetadata({ ...browser, devicePixelRatio: 100 })).toBeNull();
    expect(parseBrowserCaptureMetadata({ ...browser, timelineElapsedSeconds: -1 })).toBeNull();
    expect(parseBrowserCaptureMetadata({ ...browser, parameters: { phase: Infinity } })).toBeNull();
    expect(validatePng(onePixelPng())).toEqual({ height: 1, width: 1 });
    expect(() => validatePng(new Uint8Array([1, 2, 3]))).toThrow("not a PNG");
    expect(() => validatePng(onePixelPng().slice(0, -1))).toThrow("truncated");
    const corrupt = onePixelPng();
    corrupt[40] ^= 1;
    expect(() => validatePng(corrupt)).toThrow("checksum");

    const directory = await mkdtemp(join(tmpdir(), "mim-capture-"));
    temporaryDirectories.push(directory);
    await expect(writeCaptureArtifact({
      browser,
      image: onePixelPng(),
      output: join(directory, "frame.jpg"),
      runtime: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
      source: { revision: 1, source: "source" },
    })).rejects.toThrow("must end in .png");
    await expect(writeCaptureArtifact({
      browser: { ...browser, cssWidth: 2, pixelWidth: 2 },
      image: onePixelPng(),
      output: join(directory, "frame.png"),
      runtime: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
      source: { revision: 1, source: "source" },
    })).rejects.toThrow("do not match browser metadata");
  });

  test("never replaces an existing artifact or leaves a new sidecar beside it", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mim-capture-"));
    temporaryDirectories.push(directory);
    const output = join(directory, "frame.png");
    await writeFile(output, "existing");

    await expect(writeCaptureArtifact({
      browser,
      image: onePixelPng(),
      output,
      runtime: { htmlSha256: "h", mimDirty: false, mimRevision: "r" },
      source: { revision: 1, source: "source" },
    })).rejects.toThrow("already exists");

    expect(await readFile(output, "utf8")).toBe("existing");
    await expect(readFile(`${output}.json`)).rejects.toThrow();
  });
});
