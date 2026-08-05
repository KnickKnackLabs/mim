<script lang="ts">
  import { onDestroy, tick } from "svelte";

  import type { BrowserProgramDiagnostic } from "../browser/browser-program";
  import type { BrowserProgramFormatResult } from "../browser/format-browser-program";
  import {
    programEditorInputAction,
    programEditorWindowAction,
  } from "./program-editor-keys";

  export let apply: (source: string) => readonly BrowserProgramDiagnostic[];
  export let format: (source: string) => BrowserProgramFormatResult;
  export let source: string;

  let diagnostics: readonly BrowserProgramDiagnostic[] = [];
  let draft = source;
  let lastSource = source;
  let pending: ReturnType<typeof setTimeout> | null = null;
  let stale = false;
  let textarea: HTMLTextAreaElement;
  let visible = false;

  $: if (source !== lastSource) {
    lastSource = source;
    if (!visible) draft = source;
    else stale = draft !== source;
  }

  onDestroy(() => {
    if (pending !== null) clearTimeout(pending);
  });

  function editableTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement;
  }

  export async function open(): Promise<void> {
    visible = true;
    await tick();
    textarea.focus();
  }

  function close(): void {
    visible = false;
  }

  function cancelPending(): void {
    if (pending !== null) clearTimeout(pending);
    pending = null;
  }

  function applyDraft(): void {
    cancelPending();
    diagnostics = apply(draft);
    stale = diagnostics.length > 0;
    if (!stale) lastSource = draft;
  }

  function scheduleApply(): void {
    stale = draft !== source;
    cancelPending();
    pending = setTimeout(applyDraft, 180);
  }

  function formatDraft(): void {
    const result = format(draft);
    if (!result.ok) {
      diagnostics = result.diagnostics;
      stale = true;
      return;
    }
    draft = result.source;
    applyDraft();
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    const action = programEditorWindowAction({
      defaultPrevented: event.defaultPrevented,
      editableTarget: editableTarget(event.target),
      key: event.key,
      visible,
    });
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (action === "close") close();
    else void open();
  }

  function handleEditorKeydown(event: KeyboardEvent): void {
    if (programEditorInputAction(event.key, event.metaKey, event.ctrlKey) !== "apply") return;
    event.preventDefault();
    applyDraft();
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if visible}
  <aside class="program-editor" aria-labelledby="program-editor-title">
    <header>
      <div>
        <strong id="program-editor-title">mim program</strong>
        <span class:stale>{stale ? "invalid draft · showing last valid picture" : "valid · live"}</span>
      </div>
      <div class="program-editor-actions">
        <button type="button" on:click={formatDraft}>Format</button>
        <button type="button" on:click={close}>Close</button>
      </div>
    </header>

    <textarea
      aria-invalid={diagnostics.length > 0 ? "true" : undefined}
      aria-label="Mim program source"
      bind:this={textarea}
      bind:value={draft}
      on:input={scheduleApply}
      on:keydown={handleEditorKeydown}
      spellcheck="false"
    ></textarea>

    {#if diagnostics.length > 0}
      <div class="program-editor-errors" role="alert">
        {#each diagnostics as diagnostic}
          <span>{diagnostic.span.start.line}:{diagnostic.span.start.column} {diagnostic.message}</span>
        {/each}
      </div>
    {/if}

    <footer>
      <span>valid edits apply automatically</span>
      <span><kbd>⌘/Ctrl Enter</kbd> apply now · <kbd>Esc</kbd> close</span>
    </footer>
  </aside>
{/if}
