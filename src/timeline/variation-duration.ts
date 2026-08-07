import type { VariationPlan } from "../program";

export function variationCompletionSeconds(plan: VariationPlan): number {
  return plan.kind === "linear"
    ? plan.durationSeconds
    : (plan.values.length - 1) * plan.everySeconds;
}
