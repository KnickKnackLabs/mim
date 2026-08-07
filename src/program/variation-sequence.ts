import type { VariationSequence } from "../language";
import { isPrimeInteger } from "../math/prime";

export const MAX_VARIATION_SEQUENCE_VALUES = 4_096;
const MAX_GENERATOR_SPAN = 100_000;

export type VariationSequenceExpansion =
  | { ok: true; values: number[] }
  | { message: string; ok: false };

function isSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value);
}

function generatorEndpointIsValid(generator: string, value: number): boolean {
  if (generator === "integers") return isSafeInteger(value);
  if (generator === "evens") return isSafeInteger(value) && value % 2 === 0;
  if (generator === "primes") return isPrimeInteger(value);
  return false;
}

export function expandVariationSequence(
  sequence: VariationSequence,
): VariationSequenceExpansion {
  if (sequence.kind === "explicit") {
    if (sequence.values.length > MAX_VARIATION_SEQUENCE_VALUES) {
      return {
        message: `variation sequence exceeds ${MAX_VARIATION_SEQUENCE_VALUES} values`,
        ok: false,
      };
    }
    return { ok: true, values: [...sequence.values] };
  }

  const { from, generator, to } = sequence;
  if (!new Set(["evens", "integers", "primes"]).has(generator)) {
    return { message: `unknown variation generator ${generator}`, ok: false };
  }
  if (
    !generatorEndpointIsValid(generator, from)
    || !generatorEndpointIsValid(generator, to)
  ) {
    return {
      message: `${generator} variation endpoints must both belong to that sequence`,
      ok: false,
    };
  }
  if (Math.abs(to - from) > MAX_GENERATOR_SPAN) {
    return {
      message: `variation generator span exceeds ${MAX_GENERATOR_SPAN}`,
      ok: false,
    };
  }

  const direction = Math.sign(to - from) || 1;
  const step = generator === "evens" ? 2 * direction : direction;
  const values: number[] = [];
  for (
    let value = from;
    direction > 0 ? value <= to : value >= to;
    value += step
  ) {
    if (generator !== "primes" || isPrimeInteger(value)) values.push(value);
    if (values.length > MAX_VARIATION_SEQUENCE_VALUES) {
      return {
        message: `variation sequence exceeds ${MAX_VARIATION_SEQUENCE_VALUES} values`,
        ok: false,
      };
    }
  }

  return { ok: true, values };
}
