import type { Operation } from "./state";

export type Command =
  | { type: "close-help" }
  | { type: "escape" }
  | { type: "finish-motion" }
  | { type: "move-cursor"; dx: number; dy: number }
  | { type: "pan-view"; dx: number; dy: number }
  | { type: "repeat-motion"; reverse: boolean }
  | { type: "reset-defaults" }
  | { type: "start-motion" }
  | { type: "set-cursor"; x: number; y: number }
  | { type: "set-operation"; operation: Operation }
  | { type: "set-zoom-denominator"; value: number }
  | { type: "toggle-help" }
  | { type: "toggle-pin-cursor" }
  | { type: "toggle-prime-results" }
  | { type: "zoom-at"; anchorX: number; anchorY: number; denominator: number }
  | { type: "zoom-in" }
  | { type: "zoom-out" };

export type Dispatch = (command: Command) => void;
