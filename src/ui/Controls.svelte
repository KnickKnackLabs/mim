<script lang="ts">
  import { AXIS_OPTIONS, type AxisKind } from "../core/axis";
  import type { Dispatch } from "../core/commands";
  import type { MimState, Operation } from "../core/state";

  export let state: MimState;
  export let dispatch: Dispatch;

  let proximity = 0;

  function trackPointer(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    const position = event.clientY / window.innerHeight;
    const progress = Math.min(1, Math.max(0, (0.5 - position) / (0.5 - 1 / 3)));
    proximity = progress * progress * (3 - 2 * progress);
  }

  function axisKindValue(event: Event): AxisKind {
    return (event.currentTarget as HTMLSelectElement).value as AxisKind;
  }

  function setOperation(operation: Operation): void {
    dispatch({ type: "set-operation", operation });
  }
</script>

<svelte:window
  on:pointerleave={() => proximity = 0}
  on:pointermove={trackPointer}
/>

<section
  class="controls"
  aria-label="Instrument controls"
  style={`--controls-proximity: ${proximity}`}
>
  <div class="brand">
    <strong>mim</strong>
    <span>math instrument</span>
  </div>

  <div class="control-group operation" aria-label="Operation">
    <button
      class:active={state.operation === "gcd"}
      type="button"
      on:click={() => setOperation("gcd")}
    >GCD</button>
    <button
      class:active={state.operation === "lcm"}
      type="button"
      on:click={() => setOperation("lcm")}
    >LCM</button>
  </div>

  <label class="axis-control">
    <span>X axis</span>
    <select
      aria-label="X axis generator"
      value={state.xAxis}
      on:change={(event) => dispatch({ type: "set-axis", axis: "x", kind: axisKindValue(event) })}
    >
      {#each AXIS_OPTIONS as option}
        <option value={option.kind}>{option.label}</option>
      {/each}
    </select>
  </label>

  <label class="axis-control">
    <span>Y axis</span>
    <select
      aria-label="Y axis generator"
      value={state.yAxis}
      on:change={(event) => dispatch({ type: "set-axis", axis: "y", kind: axisKindValue(event) })}
    >
      {#each AXIS_OPTIONS as option}
        <option value={option.kind}>{option.label}</option>
      {/each}
    </select>
  </label>

  <label class="check">
    <input
      checked={state.showPrimeResults}
      type="checkbox"
      on:change={() => dispatch({ type: "toggle-prime-results" })}
    />
    <span>prime results</span>
  </label>

  <label class="check">
    <input
      checked={state.pinCursor}
      type="checkbox"
      on:change={() => dispatch({ type: "toggle-pin-cursor" })}
    />
    <span>pin cursor</span>
  </label>
</section>
