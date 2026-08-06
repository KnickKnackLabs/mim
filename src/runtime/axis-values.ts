import { isPrimeInteger } from "../math/prime";

const primes = [2];

function extendPrimesThrough(index: number): void {
  let candidate = primes[primes.length - 1] + 1;
  while (primes.length <= index) {
    if (isPrimeInteger(candidate)) primes.push(candidate);
    candidate += 1;
  }
}

export function runtimeAxisValue(definition: string, index: number): number | null {
  if (!Number.isSafeInteger(index)) return null;
  if (definition === "integers") return index;
  if (definition === "primes") {
    if (index < 0) return null;
    extendPrimesThrough(index);
    return primes[index];
  }
  throw new RangeError(`unsupported validated axis definition: ${definition}`);
}
