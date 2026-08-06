import { createHash, randomUUID } from "node:crypto";
import { rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";

import type { BrowserCaptureMetadata, WatchUpdate } from "./protocol";

const MAX_CAPTURE_BYTES = 16 * 1024 * 1024;
const MAX_CAPTURE_DIMENSION = 32_768;
const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_IHDR = Uint8Array.from([73, 72, 68, 82]);

export interface CaptureRuntimeMetadata {
  htmlSha256: string;
  mimDirty: boolean;
  mimRevision: string;
}

export interface CaptureArtifactMetadata {
  browser: BrowserCaptureMetadata;
  capturedAt: string;
  mim: CaptureRuntimeMetadata;
  output: string;
  png: {
    bytes: number;
    sha256: string;
  };
  schemaVersion: 1;
  source: {
    revision: number;
    sha256: string;
  };
}

export interface CaptureArtifactInput {
  browser: BrowserCaptureMetadata;
  image: Uint8Array;
  output: string;
  runtime: CaptureRuntimeMetadata;
  source: WatchUpdate;
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function captureDimension(value: unknown): value is number {
  return Number.isSafeInteger(value)
    && (value as number) > 0
    && (value as number) <= MAX_CAPTURE_DIMENSION;
}

export function parseBrowserCaptureMetadata(
  value: unknown,
): BrowserCaptureMetadata | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const cssDimensions = [candidate.cssHeight, candidate.cssWidth];
  if (
    cssDimensions.some(
      (entry) => !finiteNumber(entry) || entry <= 0 || entry > MAX_CAPTURE_DIMENSION,
    )
    || !captureDimension(candidate.pixelHeight)
    || !captureDimension(candidate.pixelWidth)
    || !finiteNumber(candidate.devicePixelRatio)
    || candidate.devicePixelRatio <= 0
    || candidate.devicePixelRatio > 8
    || !Number.isSafeInteger(candidate.zoomDenominator)
    || (candidate.zoomDenominator as number) <= 0
    || !finiteNumber(candidate.viewX)
    || Math.abs(candidate.viewX) > 1_000_000_000
    || !finiteNumber(candidate.viewY)
    || Math.abs(candidate.viewY) > 1_000_000_000
    || !Number.isSafeInteger(candidate.revision)
    || (candidate.revision as number) < 1
    || typeof candidate.locale !== "string"
    || candidate.locale.length > 128
    || typeof candidate.userAgent !== "string"
    || candidate.userAgent.length > 1_024
  ) {
    return null;
  }
  return candidate as unknown as BrowserCaptureMetadata;
}

export function validatePng(
  image: Uint8Array,
): { height: number; width: number } {
  if (image.byteLength > MAX_CAPTURE_BYTES) {
    throw new Error(`capture exceeds ${MAX_CAPTURE_BYTES} bytes`);
  }
  if (
    image.byteLength < 24
    || PNG_SIGNATURE.some((byte, index) => image[index] !== byte)
    || PNG_IHDR.some((byte, index) => image[index + 12] !== byte)
  ) {
    throw new Error("capture is not a PNG image with an IHDR header");
  }
  const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
  const chunkLength = view.getUint32(8);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (
    chunkLength !== 13
    || !captureDimension(width)
    || !captureDimension(height)
  ) {
    throw new Error("capture PNG dimensions are invalid");
  }
  return { height, width };
}

export async function writeCaptureArtifact(
  input: CaptureArtifactInput,
): Promise<CaptureArtifactMetadata> {
  if (extname(input.output).toLowerCase() !== ".png") {
    throw new Error("capture output must end in .png");
  }
  const pngDimensions = validatePng(input.image);
  if (
    pngDimensions.width !== input.browser.pixelWidth
    || pngDimensions.height !== input.browser.pixelHeight
  ) {
    throw new Error("capture PNG dimensions do not match browser metadata");
  }
  const parent = dirname(input.output);
  const parentState = await stat(parent);
  if (!parentState.isDirectory()) throw new Error(`${parent}: not a directory`);

  const metadata: CaptureArtifactMetadata = {
    browser: input.browser,
    capturedAt: new Date().toISOString(),
    mim: input.runtime,
    output: input.output,
    png: {
      bytes: input.image.byteLength,
      sha256: sha256(input.image),
    },
    schemaVersion: 1,
    source: {
      revision: input.source.revision,
      sha256: sha256(input.source.source),
    },
  };

  const suffix = `.mim-capture-${randomUUID()}.tmp`;
  const imageTemporary = `${input.output}${suffix}`;
  const metadataOutput = `${input.output}.json`;
  const metadataTemporary = `${metadataOutput}${suffix}`;
  try {
    await writeFile(imageTemporary, input.image, { flag: "wx" });
    await writeFile(
      metadataTemporary,
      `${JSON.stringify(metadata, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    );
    await rename(imageTemporary, input.output);
    await rename(metadataTemporary, metadataOutput);
  } finally {
    await Promise.allSettled([
      unlink(imageTemporary),
      unlink(metadataTemporary),
    ]);
  }
  return metadata;
}
