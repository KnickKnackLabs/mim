import type { DisplayCell, DisplayFrame } from "../frame";

export interface RenderSize {
  cssHeight: number;
  cssWidth: number;
  pixelRatio: number;
}

function fillFor(cell: DisplayCell): string {
  if (cell.accent === "prime") return "#f59e42";
  const lightness = 15 + cell.intensity * 43;
  const saturation = 48 + cell.intensity * 32;
  return `hsl(204 ${saturation}% ${lightness}%)`;
}

export function renderFrame(
  canvas: HTMLCanvasElement,
  frame: DisplayFrame,
  size: RenderSize,
): void {
  const width = Math.max(1, Math.floor(size.cssWidth));
  const height = Math.max(1, Math.floor(size.cssHeight));
  const ratio = Math.max(1, size.pixelRatio);
  const pixelWidth = Math.floor(width * ratio);
  const pixelHeight = Math.floor(height * ratio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = "#071827";
  context.fillRect(0, 0, width, height);

  const cellWidth = width / frame.columns;
  const cellHeight = height / frame.rows;
  const gap = Math.min(1, Math.max(0.15, Math.min(cellWidth, cellHeight) * 0.04));

  for (const cell of frame.cells) {
    const left = (cell.x - 1) * cellWidth;
    const top = (cell.y - 1) * cellHeight;
    context.fillStyle = fillFor(cell);
    context.fillRect(
      left + gap,
      top + gap,
      Math.max(0, cellWidth - gap * 2),
      Math.max(0, cellHeight - gap * 2),
    );

    if (cell.diagonal && cell.accent === null) {
      context.fillStyle = "rgba(224, 242, 254, 0.28)";
      context.fillRect(left + gap, top + gap, cellWidth - gap * 2, cellHeight - gap * 2);
    }

    if (cell.selected) {
      context.strokeStyle = "#ffffff";
      context.lineWidth = Math.max(1, Math.min(cellWidth, cellHeight) * 0.12);
      context.strokeRect(
        left + context.lineWidth / 2,
        top + context.lineWidth / 2,
        Math.max(0, cellWidth - context.lineWidth),
        Math.max(0, cellHeight - context.lineWidth),
      );
    }
  }
}
