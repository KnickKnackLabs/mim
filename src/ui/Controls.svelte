<script lang="ts">
  import type { Dispatch } from "../core/commands";
  import {
    MAX_BOUND,
    MAX_ZOOM_DENOMINATOR,
    MIN_BOUND,
    MIN_ZOOM_DENOMINATOR,
    type MimState,
    type Operation,
  } from "../core/state";

  export let state: MimState;
  export let dispatch: Dispatch;

  let proximity = 0;

  function trackPointer(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    const position = event.clientY / window.innerHeight;
    const progress = Math.min(1, Math.max(0, (0.5 - position) / (0.5 - 1 / 3)));
    proximity = progress * progress * (3 - 2 * progress);
  }

  function numberValue(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement).value);
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

  <div class="zoom-control" aria-label="Camera zoom">
    <button
      aria-label="Zoom out"
      title="Zoom out (-)"
      type="button"
      on:click={() => dispatch({ type: "zoom-out" })}
    >−</button>
    <label class="zoom-value">
      <span>Zoom</span>
      <div class="fraction">
        <span>1/</span>
        <input
          aria-label="Zoom denominator"
          max={MAX_ZOOM_DENOMINATOR}
          min={MIN_ZOOM_DENOMINATOR}
          step="any"
          type="number"
          value={Number(state.zoomDenominator.toFixed(2))}
          on:change={(event) => dispatch({ type: "set-zoom-denominator", value: numberValue(event) })}
        />
      </div>
    </label>
    <button
      aria-label="Zoom in"
      title="Zoom in (+)"
      type="button"
      on:click={() => dispatch({ type: "zoom-in" })}
    >+</button>
  </div>

  <label>
    <span>X</span>
    <input
      aria-label="X bound"
      max={MAX_BOUND}
      min={MIN_BOUND}
      type="number"
      value={state.columns}
      on:change={(event) => dispatch({ type: "set-bound", axis: "x", value: numberValue(event) })}
    />
  </label>

  <label>
    <span>Y</span>
    <input
      aria-label="Y bound"
      max={MAX_BOUND}
      min={MIN_BOUND}
      type="number"
      value={state.rows}
      on:change={(event) => dispatch({ type: "set-bound", axis: "y", value: numberValue(event) })}
    />
  </label>

  <label class="check">
    <input
      checked={state.showPrimeResults}
      type="checkbox"
      on:change={() => dispatch({ type: "toggle-prime-results" })}
    />
    <span>prime results</span>
  </label>

  <div class="keys" aria-label="Keyboard shortcuts">
    <span><kbd>g</kbd> gcd</span>
    <span><kbd>m</kbd> lcm</span>
    <span><kbd>p</kbd> primes</span>
    <span><kbd>wheel</kbd> zoom</span>
    <span><kbd>c</kbd> cursor zoom</span>
    <span><kbd>hjkl</kbd> move</span>
    <span><kbd>?</kbd> help</span>
  </div>
</section>
