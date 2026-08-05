import type { EvaluatedCell, RuntimeDiagnostic } from "./types";

export interface GridBounds {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

export interface HslPaint {
  alpha: number;
  hue: number;
  kind: "hsl";
  lightness: number;
  saturation: number;
}

export interface InvalidPaint {
  kind: "error" | "undefined";
}

export type PreparedPaint = HslPaint | InvalidPaint;
export type PreparedEvaluation = Pick<EvaluatedCell, "color" | "field" | "lens">;

export interface PreparedCell {
  column: number;
  evaluation: PreparedEvaluation;
  overlays: { equality: boolean };
  paint: PreparedPaint;
  row: number;
  selected: boolean;
  x: number;
  y: number;
}

export interface PreparedFrame {
  bounds: GridBounds;
  cells: PreparedCell[];
  columns: number;
  maximumMagnitude: number;
  parameters: Readonly<Record<string, number>>;
  rows: number;
  selectedCell: PreparedCell | null;
}

export interface PrepareFrameOptions {
  bounds: GridBounds;
  parameters?: Readonly<Record<string, number>>;
  selected?: { column: number; row: number } | null;
}

export type FramePreparation =
  | { diagnostics: readonly RuntimeDiagnostic[]; frame: null; kind: "invalid-parameters" }
  | { diagnostics: readonly RuntimeDiagnostic[]; frame: PreparedFrame; kind: "prepared" };
