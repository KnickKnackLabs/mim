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

export function commandForKey(key: string): Command | null {
  const movement = movements[key];
  if (movement) {
    return { type: "move-cursor", dx: movement[0], dy: movement[1] };
  }

  if (key === "?") return { type: "toggle-help" };
  if (key === "Escape") return { type: "close-help" };
  if (key === "+" || key === "=") return { type: "zoom-in" };
  if (key === "-" || key === "_") return { type: "zoom-out" };
  if (key === "g") return { type: "set-operation", operation: "gcd" };
  if (key === "m") return { type: "set-operation", operation: "lcm" };
  if (key === "p") return { type: "toggle-prime-results" };
  return null;
}
