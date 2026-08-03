export type CellAccent = "prime" | null;

export interface DisplayCell {
  accent: CellAccent;
  diagonal: boolean;
  intensity: number;
  selected: boolean;
  value: number;
  x: number;
  y: number;
}

export interface DisplayFrame {
  cells: DisplayCell[];
  columns: number;
  maximumValue: number;
  rows: number;
  viewX: number;
  viewY: number;
  zoomDenominator: number;
}
