<script lang="ts">
  import type { TimelineState } from "../timeline";
  import {
    nextTimelineSpeed,
    type TimelineControlIntent,
  } from "./timeline-controls";

  export let complete: boolean;
  export let dispatch: (intent: TimelineControlIntent) => void;
  export let elapsedSeconds: number;
  export let state: TimelineState;
</script>

<aside class="timeline-controls" aria-label="Variation timeline">
  <button
    disabled={complete}
    type="button"
    on:click={() => dispatch({ type: state.playing ? "pause" : "play" })}
  >{state.playing ? "Pause" : "Play"}</button>
  <button type="button" on:click={() => dispatch({ type: "restart" })}>Restart</button>
  <button
    aria-label="Change timeline speed"
    type="button"
    on:click={() => dispatch({ type: "set-speed", speed: nextTimelineSpeed(state.speed) })}
  >{state.speed}×</button>
  <span>{complete ? "complete" : state.playing ? "playing" : "paused"}</span>
  <code>{elapsedSeconds.toFixed(2)}s</code>
</aside>
