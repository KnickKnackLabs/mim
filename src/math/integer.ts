function requireSafeInteger(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`expected a safe integer, got ${value}`);
  }
}

export function greatestCommonDivisor(left: number, right: number): number {
  requireSafeInteger(left);
  requireSafeInteger(right);
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

export function leastCommonMultiple(left: number, right: number): number {
  requireSafeInteger(left);
  requireSafeInteger(right);
  if (left === 0 || right === 0) return 0;
  const result = Math.abs(left) / greatestCommonDivisor(left, right) * Math.abs(right);
  requireSafeInteger(result);
  return result;
}

export function integerDivisorCount(value: number): number | null {
  requireSafeInteger(value);
  const target = Math.abs(value);
  if (target === 0) return null;
  let count = 0;
  for (let divisor = 1; divisor * divisor <= target; divisor += 1) {
    if (target % divisor !== 0) continue;
    count += divisor * divisor === target ? 1 : 2;
  }
  return count;
}
