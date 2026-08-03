import type { Operation } from "../../core/state";

function requirePositiveSafeInteger(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`expected a positive safe integer, got ${value}`);
  }
}

export function gcd(left: number, right: number): number {
  requirePositiveSafeInteger(left);
  requirePositiveSafeInteger(right);

  let a = left;
  let b = right;
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function lcm(left: number, right: number): number {
  const value = (left / gcd(left, right)) * right;
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`LCM exceeds safe integer range: ${left}, ${right}`);
  }
  return value;
}

export function operate(operation: Operation, left: number, right: number): number {
  return operation === "gcd" ? gcd(left, right) : lcm(left, right);
}

export function isPrime(value: number): boolean {
  if (!Number.isSafeInteger(value) || value < 2) return false;
  if (value === 2) return true;
  if (value % 2 === 0) return false;
  for (let divisor = 3; divisor * divisor <= value; divisor += 2) {
    if (value % divisor === 0) return false;
  }
  return true;
}
