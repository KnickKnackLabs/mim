export type Operation = "gcd" | "lcm";

export interface Cursor {
  x: number;
  y: number;
}

export interface Motion {
  dx: number;
  dy: number;
}

export interface MimState {
  columns: number;
  cursor: Cursor | null;
  helpVisible: boolean;
  recordedMotion: Motion[];
  recordingMotion: Motion[];
  motionEnd: Cursor | null;
  motionStart: Cursor | null;
  operation: Operation;
  rows: number;
  showPrimeResults: boolean;
  viewX: number;
  viewY: number;
  zoomDenominator: number;
}

export const MIN_BOUND = 2;
export const MAX_BOUND = 160;
export const MIN_ZOOM_DENOMINATOR = 1;
export const MAX_ZOOM_DENOMINATOR = 96;
export const GOLDEN_ZOOM_STEP = Math.pow((1 + Math.sqrt(5)) / 2, 1 / 8);

export function createInitialState(): MimState {
  return {
    columns: 96,
    cursor: null,
    helpVisible: false,
    recordedMotion: [],
    recordingMotion: [],
    motionEnd: null,
    motionStart: null,
    operation: "lcm",
    rows: 96,
    showPrimeResults: true,
    viewX: 0,
    viewY: 0,
    zoomDenominator: 48,
  };
}
