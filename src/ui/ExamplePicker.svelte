<script lang="ts">
  import { onMount } from "svelte";

  import type { BrowserExample } from "../examples/example-library";

  export let close: () => void;
  export let examples: readonly BrowserExample[];
  export let select: (name: string) => void;
  export let selectedName: string | null = null;

  let rows: HTMLButtonElement[] = [];

  onMount(() => rows[0]?.focus());

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  }
</script>

<svelte:window on:keydown|capture={handleWindowKeydown} />

<div
  aria-labelledby="example-picker-title"
  aria-modal="true"
  class="example-picker"
  role="dialog"
>
  <header>
    <div>
      <strong id="example-picker-title">examples</strong>
      <span>load an annotated mim program</span>
    </div>
    <button type="button" on:click={close}>Close</button>
  </header>

  <div class="example-list">
    {#each examples as example, index}
      <button
        aria-current={example.name === selectedName ? "true" : undefined}
        bind:this={rows[index]}
        class="example-row"
        type="button"
        on:click={() => select(example.name)}
      >
        <span>
          <strong>{example.title}</strong>
          <small>{example.description}</small>
        </span>
        <em>{example.varying ? "animated" : "static"}</em>
      </button>
    {/each}
  </div>

  <footer>
    <code>:example &lt;name&gt;</code>
    <span><kbd>Esc</kbd> close</span>
  </footer>
</div>
