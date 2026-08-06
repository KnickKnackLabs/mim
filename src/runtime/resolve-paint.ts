import type {
  HslPaint,
  PreparedEvaluation,
  PreparedPaint,
} from "./prepared-frame";

function stableHue(value: number): number {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

function neutral(): HslPaint {
  return { alpha: 1, hue: 204, kind: "hsl", lightness: 15, saturation: 32 };
}

function invalidKind(cell: PreparedEvaluation): "error" | "undefined" | null {
  for (const result of [cell.color, cell.lens, cell.field]) {
    if (result?.kind === "error" || result?.kind === "undefined") return result.kind;
  }
  return null;
}

export function resolveCellPaint(
  cell: PreparedEvaluation,
  maximumMagnitude: number,
): PreparedPaint {
  const invalid = invalidKind(cell);
  if (invalid) return { kind: invalid };
  if (cell.color?.kind !== "color") return { kind: "error" };

  const value = cell.color.value;
  if (value === 0) return neutral();
  if (cell.color.mode === "exact") {
    return {
      alpha: 0.72,
      hue: stableHue(value),
      kind: "hsl",
      lightness: 62,
      saturation: 62,
    };
  }

  const denominator = Math.log1p(Math.max(1, maximumMagnitude));
  const intensity = Math.log1p(Math.abs(value)) / denominator;
  return {
    alpha: 1,
    hue: value < 0 ? 326 : 204,
    kind: "hsl",
    lightness: 15 + intensity * 43,
    saturation: 48 + intensity * 32,
  };
}
