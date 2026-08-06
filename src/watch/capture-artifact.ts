import { createHash, randomUUID } from "node:crypto";
import { link, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute } from "node:path";

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
  schemaVersion: 2;
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

function captureParameters(
  value: unknown,
): value is Readonly<Record<string, number>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.length <= 256 && entries.every(
    ([name, parameter]) => name.length >= 1
      && name.length <= 128
      && finiteNumber(parameter)
      && Math.abs(parameter) <= Number.MAX_SAFE_INTEGER,
  );
}

function crc32(value: Uint8Array): number {
  let crc = 0xffff_ffff;
  for (const byte of value) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb8_8320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffff_ffff) >>> 0;
}

function chunkType(image: Uint8Array, offset: number): string {
  return String.fromCharCode(...image.subarray(offset + 4, offset + 8));
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
    || !captureParameters(candidate.parameters)
    || !finiteNumber(candidate.devicePixelRatio)
    || candidate.devicePixelRatio < 1
    || candidate.devicePixelRatio > 8
    || candidate.pixelWidth !== Math.floor(
      Math.max(1, Math.floor(candidate.cssWidth as number))
        * candidate.devicePixelRatio,
    )
    || candidate.pixelHeight !== Math.floor(
      Math.max(1, Math.floor(candidate.cssHeight as number))
        * candidate.devicePixelRatio,
    )
    || !Number.isSafeInteger(candidate.zoomDenominator)
    || (candidate.zoomDenominator as number) <= 0
    || !finiteNumber(candidate.viewX)
    || Math.abs(candidate.viewX) > 1_000_000_000
    || !finiteNumber(candidate.viewY)
    || Math.abs(candidate.viewY) > 1_000_000_000
    || !Number.isSafeInteger(candidate.revision)
    || (candidate.revision as number) < 1
    || !finiteNumber(candidate.timelineElapsedSeconds)
    || (candidate.timelineElapsedSeconds as number) < 0
    || (candidate.timelineElapsedSeconds as number) > Number.MAX_SAFE_INTEGER
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
    image.byteLength < 8
    || PNG_SIGNATURE.some((byte, index) => image[index] !== byte)
  ) {
    throw new Error("capture is not a PNG image");
  }

  const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
  let height = 0;
  let offset = PNG_SIGNATURE.length;
  let sawData = false;
  let sawHeader = false;
  let sawTrailer = false;
  let width = 0;

  while (offset < image.byteLength) {
    if (offset + 12 > image.byteLength) {
      throw new Error("capture PNG has a truncated chunk");
    }
    const length = view.getUint32(offset);
    const checksumOffset = offset + 8 + length;
    const nextOffset = checksumOffset + 4;
    if (checksumOffset < offset || nextOffset > image.byteLength) {
      throw new Error("capture PNG has an invalid chunk length");
    }
    const type = chunkType(image, offset);
    if (
      view.getUint32(checksumOffset)
      !== crc32(image.subarray(offset + 4, checksumOffset))
    ) {
      throw new Error(`capture PNG ${type || "unknown"} checksum is invalid`);
    }

    if (!sawHeader) {
      if (
        type !== String.fromCharCode(...PNG_IHDR)
        || length !== 13
      ) {
        throw new Error("capture PNG must begin with an IHDR chunk");
      }
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      if (!captureDimension(width) || !captureDimension(height)) {
        throw new Error("capture PNG dimensions are invalid");
      }
      sawHeader = true;
    } else if (type === "IHDR") {
      throw new Error("capture PNG has more than one IHDR chunk");
    }

    if (type === "IDAT") sawData = true;
    if (type === "IEND") {
      if (length !== 0 || nextOffset !== image.byteLength) {
        throw new Error("capture PNG has an invalid IEND chunk");
      }
      sawTrailer = true;
    }
    offset = nextOffset;
  }

  if (!sawHeader || !sawData || !sawTrailer) {
    throw new Error("capture PNG is missing required chunks");
  }
  return { height, width };
}

export async function writeCaptureArtifact(
  input: CaptureArtifactInput,
): Promise<CaptureArtifactMetadata> {
  if (!isAbsolute(input.output)) {
    throw new Error("capture output must be an absolute path");
  }
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
    schemaVersion: 2,
    source: {
      revision: input.source.revision,
      sha256: sha256(input.source.source),
    },
  };

  const suffix = `.mim-capture-${randomUUID()}.tmp`;
  const imageTemporary = `${input.output}${suffix}`;
  const metadataOutput = `${input.output}.json`;
  const metadataTemporary = `${metadataOutput}${suffix}`;
  let imagePublished = false;
  let metadataPublished = false;
  try {
    await writeFile(imageTemporary, input.image, { flag: "wx" });
    await writeFile(
      metadataTemporary,
      `${JSON.stringify(metadata, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    );
    await link(metadataTemporary, metadataOutput);
    metadataPublished = true;
    await link(imageTemporary, input.output);
    imagePublished = true;
  } catch (error) {
    await Promise.allSettled([
      imagePublished ? unlink(input.output) : Promise.resolve(),
      metadataPublished ? unlink(metadataOutput) : Promise.resolve(),
    ]);
    if (
      error
      && typeof error === "object"
      && "code" in error
      && error.code === "EEXIST"
    ) {
      throw new Error("capture output or metadata already exists");
    }
    throw error;
  } finally {
    await Promise.allSettled([
      unlink(imageTemporary),
      unlink(metadataTemporary),
    ]);
  }
  return metadata;
}
