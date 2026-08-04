import type { Command } from "../core/commands";

const movements: Record<string, readonly [number, number]> = {
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  h: [-1, 0],
  j: [0, 1],
  k: [0, -1],
  l: [1, 0],
};

export interface KeySequenceState {
  count: string;
}

export interface KeySequenceResult {
  command: Command | null;
  handled: boolean;
  state: KeySequenceState;
}

export function createKeySequenceState(): KeySequenceState {
  return { count: "" };
}

export function commandForKey(key: string, count = 1, shiftKey = false): Command | null {
  const movement = movements[key];
  if (movement) {
    return { type: "move-cursor", dx: movement[0] * count, dy: movement[1] * count };
  }

  if (key === " ") return { type: "repeat-motion", reverse: shiftKey };
  if (key === "?") return { type: "toggle-help" };
  if (key === "Escape") return { type: "escape" };
  if (key === "+" || key === "=") return { type: "zoom-in" };
  if (key === "-" || key === "_") return { type: "zoom-out" };
  if (key === "e") return { type: "finish-motion" };
  if (key === "g") return { type: "set-operation", operation: "gcd" };
  if (key === "m") return { type: "set-operation", operation: "lcm" };
  if (key === "s") return { type: "start-motion" };
  if (key === "p") return { type: "toggle-prime-results" };
  return null;
}

export function interpretKey(
  state: KeySequenceState,
  key: string,
  shiftKey = false,
): KeySequenceResult {
  if (/^[0-9]$/.test(key) && (key !== "0" || state.count !== "")) {
    return {
      command: null,
      handled: true,
      state: { count: `${state.count}${key}`.slice(0, 6) },
    };
  }

  const count = state.count === "" ? 1 : Number(state.count);
  const command = commandForKey(key, count, shiftKey);
  return {
    command,
    handled: command !== null || state.count !== "",
    state: createKeySequenceState(),
  };
}
