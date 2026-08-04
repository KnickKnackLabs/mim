<script lang="ts">
  import { onMount } from "svelte";

  import type { Dispatch } from "../core/commands";
  import { GOLDEN_ZOOM_STEP, type MimState } from "../core/state";
  import { createKeySequenceState, interpretKey } from "../input/keyboard";
  import { cellForPoint } from "../input/pointer";
  import { buildFrame } from "../instruments/gcd-lcm/frame";
  import { renderFrame } from "../render/canvas/render";
  import { squareGridAtScale } from "../render/layout";

  export let state: MimState;
  export let dispatch: Dispatch;

  let canvas: HTMLCanvasElement;
  let cssHeight = 1;
  let cssWidth = 1;
  let keySequence = createKeySequenceState();
  let pendingWheelDelta = 0;
  let pendingWheelX = 0;
  let pendingWheelY = 0;
  let pixelRatio = 1;
  let wheelFrame: number | null = null;

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
    return () => {
      observer.disconnect();
      if (wheelFrame !== null) cancelAnimationFrame(wheelFrame);
    };
  });

  function handleKeydown(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const result = interpretKey(keySequence, event.key, event.shiftKey);
    keySequence = result.state;
    if (!result.handled) return;
    event.preventDefault();
    if (result.command) dispatch(result.command);
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

  function applyWheelZoom(): void {
    wheelFrame = null;
    const bounds = canvas.getBoundingClientRect();
    const cellSize = Math.min(bounds.width, bounds.height) / state.zoomDenominator;
    const factor = Math.pow(GOLDEN_ZOOM_STEP, pendingWheelDelta / 100);
    pendingWheelDelta = 0;
    dispatch({
      type: "zoom-at",
      anchorX: pendingWheelX / cellSize,
      anchorY: pendingWheelY / cellSize,
      factor,
    });
  }

  function handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    const normalizedDelta = event.deltaMode === 1
      ? event.deltaY * 16
      : event.deltaMode === 2
        ? event.deltaY * bounds.height
        : event.deltaY;
    if (Math.abs(normalizedDelta) < 0.01) return;

    pendingWheelDelta += normalizedDelta;
    pendingWheelX = event.clientX - bounds.left;
    pendingWheelY = event.clientY - bounds.top;
    if (wheelFrame === null) wheelFrame = requestAnimationFrame(applyWheelZoom);
  }
</script>

<canvas
  bind:this={canvas}
  aria-label="Interactive GCD and LCM lattice"
  on:blur={() => keySequence = createKeySequenceState()}
  on:keydown={handleKeydown}
  on:pointerdown={(event) => {
    handlePointer(event);
    canvas.focus();
  }}
  on:pointermove={handlePointer}
  on:wheel|nonpassive={handleWheel}
  tabindex="0"
></canvas>
