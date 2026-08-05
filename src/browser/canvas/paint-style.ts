import type { PreparedPaint } from "../../runtime";

export function preparedPaintStyle(paint: PreparedPaint): string {
  if (paint.kind === "error") return "rgba(244, 63, 94, 0.82)";
  if (paint.kind === "undefined") return "rgba(148, 163, 184, 0.34)";
  if (paint.kind === "hsl") {
    return `hsla(${paint.hue}, ${paint.saturation}%, ${paint.lightness}%, ${paint.alpha})`;
  }
  throw new Error(`unknown prepared paint: ${JSON.stringify(paint)}`);
}
