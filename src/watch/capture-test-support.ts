import { Buffer } from "node:buffer";

const ONE_PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export function onePixelPng(): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(Buffer.from(ONE_PIXEL_PNG, "base64"));
}
