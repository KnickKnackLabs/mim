import type { Operation } from "./state";

export type Command =
  | { type: "move-cursor"; dx: number; dy: number }
  | { type: "set-bound"; axis: "x" | "y"; value: number }
  | { type: "set-cursor"; x: number; y: number }
  | { type: "set-operation"; operation: Operation }
  | { type: "toggle-prime-results" };

export type Dispatch = (command: Command) => void;
