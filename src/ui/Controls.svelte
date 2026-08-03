<script lang="ts">
  import type { Dispatch } from "../core/commands";
  import { MAX_BOUND, MIN_BOUND, type MimState, type Operation } from "../core/state";

  export let state: MimState;
  export let dispatch: Dispatch;

  function numberValue(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement).value);
  }

  function setOperation(operation: Operation): void {
    dispatch({ type: "set-operation", operation });
  }
</script>

<section class="controls" aria-label="Instrument controls">
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
    <span><kbd>hjkl</kbd> move</span>
    <span><kbd>?</kbd> help</span>
  </div>
</section>
