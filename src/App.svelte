<script lang="ts">
  import type { Command } from "./core/commands";
  import { reduceState } from "./core/reducer";
  import { createInitialState } from "./core/state";
  import { commandForKey } from "./input/keyboard";
  import { operate } from "./instruments/gcd-lcm/math";
  import Controls from "./ui/Controls.svelte";
  import HelpOverlay from "./ui/HelpOverlay.svelte";
  import LatticeCanvas from "./ui/LatticeCanvas.svelte";

  let state = createInitialState();

  function dispatch(command: Command): void {
    state = reduceState(state, command);
  }

  function handleGlobalHelpKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || (event.key !== "?" && event.key !== "Escape")) return;
    const command = commandForKey(event.key);
    if (!command) return;
    event.preventDefault();
    dispatch(command);
  }

  $: selectedValue = state.cursor
    ? operate(state.operation, state.cursor.x, state.cursor.y)
    : null;
</script>

<svelte:window on:keydown={handleGlobalHelpKeydown} />

<main>
  <Controls {state} {dispatch} />

  <div class="instrument">
    <LatticeCanvas {state} {dispatch} />
  </div>

  <aside class="readout" aria-live="polite">
    {#if state.cursor && selectedValue !== null}
      <strong>{state.operation}({state.cursor.x}, {state.cursor.y})</strong>
      <span>= {selectedValue}</span>
    {:else}
      <span>point at the lattice</span>
    {/if}
  </aside>

  {#if state.helpVisible}
    <HelpOverlay {dispatch} />
  {/if}
</main>
