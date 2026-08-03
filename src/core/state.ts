export type Operation = "gcd" | "lcm";

export interface Cursor {
  x: number;
  y: number;
}

export interface MimState {
  columns: number;
  cursor: Cursor | null;
  helpVisible: boolean;
  operation: Operation;
  rows: number;
  showPrimeResults: boolean;
  zoomDenominator: number;
}

export const MIN_BOUND = 2;
export const MAX_BOUND = 160;
export const MIN_ZOOM_DENOMINATOR = 1;
export const MAX_ZOOM_DENOMINATOR = 96;
export const ZOOM_DENOMINATORS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96] as const;

export function createInitialState(): MimState {
  return {
    columns: 96,
    cursor: null,
    helpVisible: false,
    operation: "lcm",
    rows: 96,
    showPrimeResults: true,
    zoomDenominator: 48,
  };
}
