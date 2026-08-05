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
  export let readOnly = false;
  export let reportedDiagnostics: readonly BrowserProgramDiagnostic[] = [];
  export let source: string;
  export let watchConnected = true;

  let draftDiagnostics: readonly BrowserProgramDiagnostic[] = [];
  let diagnostics: readonly BrowserProgramDiagnostic[] = [];
  let draft = source;
  let lastSource = source;
  let pending: ReturnType<typeof setTimeout> | null = null;
  let stale = false;
  let textarea: HTMLTextAreaElement;
  let visible = false;

  $: if (source !== lastSource) {
    lastSource = source;
    if (readOnly || !visible) draft = source;
    else stale = draft !== source;
  }
  $: diagnostics = readOnly ? reportedDiagnostics : draftDiagnostics;
  $: if (readOnly) stale = diagnostics.length > 0;

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
    if (readOnly) return;
    cancelPending();
    draftDiagnostics = apply(draft);
    stale = draftDiagnostics.length > 0;
    if (!stale) lastSource = draft;
  }

  function scheduleApply(): void {
    if (readOnly) return;
    stale = draft !== source;
    cancelPending();
    pending = setTimeout(applyDraft, 180);
  }

  function formatDraft(): void {
    if (readOnly) return;
    const result = format(draft);
    if (!result.ok) {
      draftDiagnostics = result.diagnostics;
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
        <strong id="program-editor-title">{readOnly ? "watched mim program" : "mim program"}</strong>
        <span class:stale={stale || (readOnly && !watchConnected)}>{readOnly
          ? stale
            ? "invalid file · showing last valid picture"
            : watchConnected
              ? "watched file · live"
              : "watch disconnected · showing last received picture"
          : stale
            ? "invalid draft · showing last valid picture"
            : "valid · live"}</span>
      </div>
      <div class="program-editor-actions">
        {#if !readOnly}<button type="button" on:click={formatDraft}>Format</button>{/if}
        <button type="button" on:click={close}>Close</button>
      </div>
    </header>

    <textarea
      aria-invalid={diagnostics.length > 0 ? "true" : undefined}
      aria-label="Mim program source"
      aria-readonly={readOnly ? "true" : undefined}
      bind:this={textarea}
      bind:value={draft}
      on:input={scheduleApply}
      on:keydown={handleEditorKeydown}
      readonly={readOnly}
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
      {#if readOnly}
        <span>the watched file is authoritative</span>
        <span>read only · <kbd>Esc</kbd> close</span>
      {:else}
        <span>valid edits apply automatically</span>
        <span><kbd>⌘/Ctrl Enter</kbd> apply now · <kbd>Esc</kbd> close</span>
      {/if}
    </footer>
  </aside>
{/if}
