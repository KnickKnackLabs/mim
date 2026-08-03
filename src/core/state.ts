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
}

export const MIN_BOUND = 2;
export const MAX_BOUND = 160;

export function createInitialState(): MimState {
  return {
    columns: 48,
    cursor: null,
    helpVisible: false,
    operation: "lcm",
    rows: 48,
    showPrimeResults: true,
  };
}
