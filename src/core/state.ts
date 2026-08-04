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
  cursor: Cursor | null;
  helpVisible: boolean;
  recordedMotion: Motion[];
  recordingMotion: Motion[];
  motionEnd: Cursor | null;
  motionStart: Cursor | null;
  operation: Operation;
  pinCursor: boolean;
  showPrimeResults: boolean;
  viewX: number;
  viewY: number;
  zoomDenominator: number;
}

export const MIN_ZOOM_DENOMINATOR = 1;
export const MAX_ZOOM_DENOMINATOR = 256;

export function createInitialState(): MimState {
  return {
    cursor: null,
    helpVisible: false,
    recordedMotion: [],
    recordingMotion: [],
    motionEnd: null,
    motionStart: null,
    operation: "lcm",
    pinCursor: false,
    showPrimeResults: true,
    viewX: 0,
    viewY: 0,
    zoomDenominator: 48,
  };
}
