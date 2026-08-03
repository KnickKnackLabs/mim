<script lang="ts">
  import { onMount } from "svelte";

  import type { Dispatch } from "../core/commands";
  import type { MimState } from "../core/state";
  import { commandForKey } from "../input/keyboard";
  import { cellForPoint } from "../input/pointer";
  import { buildFrame } from "../instruments/gcd-lcm/frame";
  import { renderFrame } from "../render/canvas/render";
  import { squareGridAtScale } from "../render/layout";

  export let state: MimState;
  export let dispatch: Dispatch;

  let canvas: HTMLCanvasElement;
  let cssHeight = 1;
  let cssWidth = 1;
  let cursorAnchoredZoom = false;
  let lastWheelZoomAt = -Infinity;
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
    if (event.key.toLowerCase() === "c") {
      event.preventDefault();
      cursorAnchoredZoom = true;
      return;
    }

    const command = commandForKey(event.key);
    if (!command) return;
    event.preventDefault();
    dispatch(command);
  }

  function handleKeyup(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === "c") cursorAnchoredZoom = false;
  }

  function handlePointer(event: PointerEvent): void {
    const bounds = canvas.getBoundingClientRect();
    const layout = squareGridAtScale(
      bounds.width,
      bounds.height,
      state.columns,
      state.rows,
      state.zoomDenominator,
      state.viewX,
      state.viewY,
    );
    const cursor = cellForPoint(event.clientX, event.clientY, bounds, layout);
    dispatch({ type: "set-cursor", ...cursor });
  }

  function handleWheel(event: WheelEvent): void {
    event.preventDefault();
    if (Math.abs(event.deltaY) < 0.5) return;

    const now = performance.now();
    if (now - lastWheelZoomAt < 75) return;
    lastWheelZoomAt = now;

    const bounds = canvas.getBoundingClientRect();
    const cellSize = Math.min(bounds.width, bounds.height) / state.zoomDenominator;
    const pixelX = cursorAnchoredZoom ? event.clientX - bounds.left : bounds.width / 2;
    const pixelY = cursorAnchoredZoom ? event.clientY - bounds.top : bounds.height / 2;
    dispatch({
      type: "zoom-at",
      anchorX: pixelX / cellSize,
      anchorY: pixelY / cellSize,
      direction: event.deltaY < 0 ? "in" : "out",
    });
  }
</script>

<canvas
  bind:this={canvas}
  aria-label="Interactive GCD and LCM lattice"
  on:blur={() => cursorAnchoredZoom = false}
  on:keydown={handleKeydown}
  on:keyup={handleKeyup}
  on:pointerdown={(event) => {
    handlePointer(event);
    canvas.focus();
  }}
  on:pointermove={handlePointer}
  on:wheel|nonpassive={handleWheel}
  tabindex="0"
></canvas>
