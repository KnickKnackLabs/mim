import type { Operation } from "./state";

export type Command =
  | { type: "close-help" }
  | { type: "move-cursor"; dx: number; dy: number }
  | { type: "set-bound"; axis: "x" | "y"; value: number }
  | { type: "set-cursor"; x: number; y: number }
  | { type: "set-operation"; operation: Operation }
  | { type: "set-zoom-denominator"; value: number }
  | { type: "toggle-help" }
  | { type: "toggle-prime-results" }
  | { type: "zoom-in" }
  | { type: "zoom-out" };

export type Dispatch = (command: Command) => void;
