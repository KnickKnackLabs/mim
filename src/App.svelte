<script lang="ts">
  import type { Command } from "./core/commands";
  import { reduceState } from "./core/reducer";
  import { createInitialState } from "./core/state";
  import { commandForKey } from "./input/keyboard";
  import { operate } from "./instruments/gcd-lcm/math";
  import { visibleGridExtent, type VisibleGridExtent } from "./render/layout";
  import Controls from "./ui/Controls.svelte";
  import HelpOverlay from "./ui/HelpOverlay.svelte";
  import LatticeCanvas from "./ui/LatticeCanvas.svelte";

  let state = createInitialState();
  let visibleExtent: VisibleGridExtent = visibleGridExtent(1, 1, 1);

  function dispatch(command: Command): void {
    const previousCursor = state.cursor;
    const next = reduceState(state, command);
    if (
      !next.cursor
      || (command.type !== "move-cursor" && command.type !== "repeat-motion")
      || visibleExtent.columns === 0
      || visibleExtent.rows === 0
    ) {
      state = next;
      return;
    }

    const dx = next.pinCursor && previousCursor
      ? next.cursor.x - previousCursor.x
      : next.cursor.x < visibleExtent.minX
        ? next.cursor.x - visibleExtent.minX
        : next.cursor.x > visibleExtent.maxX
          ? next.cursor.x - visibleExtent.maxX
          : 0;
    const dy = next.pinCursor && previousCursor
      ? next.cursor.y - previousCursor.y
      : next.cursor.y < visibleExtent.minY
        ? next.cursor.y - visibleExtent.minY
        : next.cursor.y > visibleExtent.maxY
          ? next.cursor.y - visibleExtent.maxY
          : 0;
    state = dx === 0 && dy === 0
      ? next
      : reduceState(next, { type: "pan-view", dx, dy });
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
  $: recordedMotion = state.motionStart && state.motionEnd
    ? {
        dx: state.motionEnd.x - state.motionStart.x,
        dy: state.motionEnd.y - state.motionStart.y,
        steps: state.recordedMotion.length,
      }
    : null;
</script>

<svelte:window on:keydown={handleGlobalHelpKeydown} />

<main>
  <Controls {state} {dispatch} {visibleExtent} />

  <div class="instrument">
    <LatticeCanvas {state} {dispatch} bind:visibleExtent />
  </div>

  <aside class="readout" aria-live="polite">
    {#if state.motionStart && !state.motionEnd}
      <span>recording from ({state.motionStart.x}, {state.motionStart.y})</span>
    {:else if recordedMotion}
      <span>{recordedMotion.steps} motions · Δ({recordedMotion.dx}, {recordedMotion.dy})</span>
    {/if}
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
