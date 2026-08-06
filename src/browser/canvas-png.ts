export interface CanvasPngCapture {
  cssHeight: number;
  cssWidth: number;
  devicePixelRatio: number;
  image: Blob;
  pixelHeight: number;
  pixelWidth: number;
}

export interface PngCanvas {
  height: number;
  toBlob(callback: BlobCallback, type?: string): void;
  width: number;
}

export function captureCanvasPng(
  canvas: PngCanvas,
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): Promise<CanvasPngCapture> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((image) => {
      if (!image || image.type !== "image/png") {
        reject(new Error("canvas did not produce a PNG image"));
        return;
      }
      resolve({
        cssHeight,
        cssWidth,
        devicePixelRatio,
        image,
        pixelHeight: canvas.height,
        pixelWidth: canvas.width,
      });
    }, "image/png");
  });
}
