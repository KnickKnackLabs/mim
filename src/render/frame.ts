export type CellAccent = "prime" | null;

export interface DisplayCell {
  accent: CellAccent;
  column: number;
  equalValues: boolean;
  intensity: number;
  motionEnd: boolean;
  motionStart: boolean;
  selected: boolean;
  row: number;
  value: number;
  xValue: number;
  yValue: number;
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
