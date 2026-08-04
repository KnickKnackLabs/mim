<script lang="ts">
  import { onMount } from "svelte";

  import type { Dispatch } from "../core/commands";
  import {
    MAX_ZOOM_DENOMINATOR,
    MIN_ZOOM_DENOMINATOR,
    type MimState,
    type Operation,
  } from "../core/state";
  import type { VisibleGridExtent } from "../render/layout";

  export let state: MimState;
  export let dispatch: Dispatch;
  export let visibleExtent: VisibleGridExtent;

  let fullscreenActive = false;
  let fullscreenAvailable = false;
  let proximity = 0;

  onMount(() => {
    const syncFullscreen = () => fullscreenActive = document.fullscreenElement !== null;
    fullscreenAvailable = document.fullscreenEnabled;
    document.addEventListener("fullscreenchange", syncFullscreen);
    syncFullscreen();
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  });

  async function toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

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
          step="1"
          type="number"
          value={state.zoomDenominator}
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

  <div class="extent-value" aria-label="Visible horizontal cells">
    <span>M</span>
    <strong>{visibleExtent.columns}</strong>
  </div>

  <div class="extent-value" aria-label="Visible vertical cells">
    <span>N</span>
    <strong>{visibleExtent.rows}</strong>
  </div>

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

  <button
    aria-label={fullscreenActive ? "Exit full screen" : "Enter full screen"}
    disabled={!fullscreenAvailable}
    type="button"
    on:click={toggleFullscreen}
  >{fullscreenActive ? "Exit full screen" : "Full screen"}</button>

  <button
    class="reset-button"
    type="button"
    on:click={() => dispatch({ type: "reset-defaults" })}
  >Reset</button>

  <div class="keys" aria-label="Keyboard shortcuts">
    <span><kbd>g</kbd> gcd</span>
    <span><kbd>m</kbd> lcm</span>
    <span><kbd>p</kbd> primes</span>
    <span><kbd>drag</kbd> pan</span>
    <span><kbd>wheel</kbd> cursor zoom</span>
    <span><kbd>s…e</kbd> record</span>
    <span><kbd>Space</kbd> repeat</span>
    <span><kbd>Esc</kbd> clear</span>
    <span><kbd>?</kbd> help</span>
  </div>
</section>
