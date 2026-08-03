<script lang="ts">
  import { onMount } from "svelte";

  import type { Dispatch } from "../core/commands";

  export let dispatch: Dispatch;

  let closeButton: HTMLButtonElement;

  onMount(() => {
    const previousFocus = document.activeElement;
    closeButton.focus();

    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  });
</script>

<div class="help-overlay" aria-labelledby="help-title" role="dialog">
  <div class="help-panel">
    <header>
      <div>
        <span class="eyebrow">mim controls</span>
        <h1 id="help-title">Help</h1>
      </div>
      <button
        bind:this={closeButton}
        class="help-close"
        type="button"
        on:click={() => dispatch({ type: "close-help" })}
      >Close</button>
    </header>

    <dl>
      <div><dt><kbd>?</kbd></dt><dd>toggle this help</dd></div>
      <div><dt><kbd>Esc</kbd></dt><dd>close help</dd></div>
      <div><dt><kbd>h j k l</kbd></dt><dd>move the selected cell</dd></div>
      <div><dt><kbd>arrows</kbd></dt><dd>move the selected cell</dd></div>
      <div><dt><kbd>g</kbd></dt><dd>show greatest common divisors</dd></div>
      <div><dt><kbd>m</kbd></dt><dd>show least common multiples</dd></div>
      <div><dt><kbd>+ −</kbd></dt><dd>zoom in and out</dd></div>
      <div><dt><kbd>p</kbd></dt><dd>toggle prime results</dd></div>
      <div><dt>pointer</dt><dd>select a cell</dd></div>
      <div><dt>X / Y</dt><dd>set the lattice bounds</dd></div>
    </dl>
  </div>
</div>
