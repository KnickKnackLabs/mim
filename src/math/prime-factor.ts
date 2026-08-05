import { isPrimeInteger } from "./prime";

function requirePrime(prime: number): void {
  if (!isPrimeInteger(prime)) throw new RangeError(`expected a prime, got ${prime}`);
}

function requireSafeInteger(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`expected a safe integer, got ${value}`);
  }
}

export function primeValuation(value: number, prime: number): number | null {
  requireSafeInteger(value);
  requirePrime(prime);
  if (value === 0) return null;
  let remaining = Math.abs(value);
  let exponent = 0;
  while (remaining % prime === 0) {
    remaining /= prime;
    exponent += 1;
  }
  return exponent;
}

export function removePrimePowers(
  value: number,
  prime: number,
  maximumDepth = Number.POSITIVE_INFINITY,
): number | null {
  requireSafeInteger(value);
  requirePrime(prime);
  if (value === 0) return null;
  if (
    maximumDepth !== Number.POSITIVE_INFINITY
    && (!Number.isSafeInteger(maximumDepth) || maximumDepth < 0)
  ) {
    throw new RangeError(`expected a nonnegative removal depth, got ${maximumDepth}`);
  }

  let result = value;
  let removed = 0;
  while (result % prime === 0 && removed < maximumDepth) {
    result /= prime;
    removed += 1;
  }
  return result;
}
