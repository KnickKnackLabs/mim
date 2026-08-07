import type { DiscreteVariationPlan, LinearVariationPlan, VariationPlan } from "../program";

function requireElapsedSeconds(elapsedSeconds: number): void {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError("timeline elapsed time must be finite and nonnegative");
  }
}

function linearProgressAt(plan: LinearVariationPlan, elapsedSeconds: number): number {
  if (plan.mode === "once") {
    return Math.min(elapsedSeconds / plan.durationSeconds, 1);
  }
  if (plan.mode === "loop") {
    return (elapsedSeconds % plan.durationSeconds) / plan.durationSeconds;
  }

  const phase = (elapsedSeconds / plan.durationSeconds) % 2;
  return phase <= 1 ? phase : 2 - phase;
}

function elapsedStep(plan: DiscreteVariationPlan, elapsedSeconds: number): number {
  const quotient = elapsedSeconds / plan.everySeconds;
  const nearest = Math.round(quotient);
  return Math.abs(quotient - nearest) < 1e-9 ? nearest : Math.floor(quotient);
}

function discreteValueAt(plan: DiscreteVariationPlan, elapsedSeconds: number): number {
  const step = elapsedStep(plan, elapsedSeconds);
  if (plan.mode === "once") {
    return plan.values[Math.min(step, plan.values.length - 1)]!;
  }
  if (plan.mode === "loop") {
    return plan.values[step % plan.values.length]!;
  }

  const cycleLength = plan.values.length * 2 - 2;
  const phase = step % cycleLength;
  const index = phase < plan.values.length ? phase : cycleLength - phase;
  return plan.values[index]!;
}

export function variationValueAt(plan: VariationPlan, elapsedSeconds: number): number {
  requireElapsedSeconds(elapsedSeconds);
  if (plan.kind === "discrete") return discreteValueAt(plan, elapsedSeconds);

  const progress = linearProgressAt(plan, elapsedSeconds);
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
