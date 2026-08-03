<script lang="ts">
  import { onMount } from "svelte";

  import type { Dispatch } from "../core/commands";
  import type { MimState } from "../core/state";
  import { commandForKey } from "../input/keyboard";
  import { cellForPoint } from "../input/pointer";
  import { buildFrame } from "../instruments/gcd-lcm/frame";
  import { renderFrame } from "../render/canvas/render";
  import { coverWithSquareCells } from "../render/layout";

  export let state: MimState;
  export let dispatch: Dispatch;

  let canvas: HTMLCanvasElement;
  let cssHeight = 1;
  let cssWidth = 1;
  let pixelRatio = 1;

  $: frame = buildFrame(state);
  $: if (canvas && cssWidth > 1 && cssHeight > 1) {
    renderFrame(canvas, frame, { cssHeight, cssWidth, pixelRatio });
  }

  onMount(() => {
    const observer = new ResizeObserver(([entry]) => {
      cssWidth = entry.contentRect.width;
      cssHeight = entry.contentRect.height;
      pixelRatio = window.devicePixelRatio || 1;
    });
    observer.observe(canvas);
    canvas.focus();
    return () => observer.disconnect();
  });

  function handleKeydown(event: KeyboardEvent): void {
    const command = commandForKey(event.key);
    if (!command) return;
    event.preventDefault();
    dispatch(command);
  }

  function handlePointer(event: PointerEvent): void {
    const bounds = canvas.getBoundingClientRect();
    const layout = coverWithSquareCells(
      bounds.width,
      bounds.height,
      state.columns,
      state.rows,
    );
    const cursor = cellForPoint(event.clientX, event.clientY, bounds, layout);
    dispatch({ type: "set-cursor", ...cursor });
  }
</script>

<canvas
  bind:this={canvas}
  aria-label="Interactive GCD and LCM lattice"
  on:keydown={handleKeydown}
  on:pointerdown={(event) => {
    handlePointer(event);
    canvas.focus();
  }}
  on:pointermove={handlePointer}
  tabindex="0"
></canvas>
