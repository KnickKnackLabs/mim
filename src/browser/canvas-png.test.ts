import { describe, expect, test } from "bun:test";

import { captureCanvasPng, type PngCanvas } from "./canvas-png";

describe("canvas PNG capture", () => {
  test("requests PNG bytes from the canvas", async () => {
    let requestedType = "";
    const image = new Blob(["png"], { type: "image/png" });
    const canvas: PngCanvas = {
      height: 1440,
      toBlob(callback, type): void {
        requestedType = type ?? "";
        callback(image);
      },
      width: 2560,
    };

    expect(await captureCanvasPng(canvas, 1280, 720, 2)).toEqual({
      cssHeight: 720,
      cssWidth: 1280,
      devicePixelRatio: 2,
      image,
      pixelHeight: 1440,
      pixelWidth: 2560,
    });
    expect(requestedType).toBe("image/png");
  });

  test("fails when the canvas cannot encode PNG", async () => {
    const canvas: PngCanvas = {
      height: 1,
      toBlob(callback): void {
        callback(null);
      },
      width: 1,
    };
    await expect(captureCanvasPng(canvas, 1, 1, 1)).rejects.toThrow("did not produce");
  });
});
