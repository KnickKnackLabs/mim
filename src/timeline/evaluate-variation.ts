import type { VariationPlan } from "../program";

function requireElapsedSeconds(elapsedSeconds: number): void {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError("timeline elapsed time must be finite and nonnegative");
  }
}

function progressAt(plan: VariationPlan, elapsedSeconds: number): number {
  if (plan.mode === "once") {
    return Math.min(elapsedSeconds / plan.durationSeconds, 1);
  }
  if (plan.mode === "loop") {
    return (elapsedSeconds % plan.durationSeconds) / plan.durationSeconds;
  }

  const phase = (elapsedSeconds / plan.durationSeconds) % 2;
  return phase <= 1 ? phase : 2 - phase;
}

export function variationValueAt(plan: VariationPlan, elapsedSeconds: number): number {
  requireElapsedSeconds(elapsedSeconds);
  const progress = progressAt(plan, elapsedSeconds);
  const value = plan.from + (plan.to - plan.from) * progress;
  return Object.is(value, -0) ? 0 : value;
}

export function variationOverridesAt(
  plans: readonly VariationPlan[],
  elapsedSeconds: number,
): Readonly<Record<string, number>> {
  requireElapsedSeconds(elapsedSeconds);
  return Object.fromEntries(
    plans.map((plan) => [plan.parameter, variationValueAt(plan, elapsedSeconds)]),
  );
}
