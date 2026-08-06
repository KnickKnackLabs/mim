<script lang="ts">
  import { onMount } from "svelte";

  import type {
    BrowserProgram,
    BrowserProgramDiagnostic,
  } from "./browser/browser-program";
  import {
    uploadWatchCapture,
    uploadWatchCaptureFailure,
  } from "./browser/watch-capture";
  import { formatBrowserProgram } from "./browser/format-browser-program";
  import { loadBrowserProgram } from "./browser/load-browser-program";
  import { updateBrowserProgram } from "./browser/update-browser-program";
  import {
    connectWatchClient,
    watchEndpoint,
    type WatchConnectionStatus,
  } from "./browser/watch-client";
  import {
    applyBrowserWatchUpdate,
    createBrowserWatchState,
  } from "./browser/watch-mode";
  import {
    createTimelineClock,
    type TimelineClock,
  } from "./browser/timeline-clock";
  import {
    preparedDemoEnabled,
    PREPARED_DEMO_SOURCE,
  } from "./browser/prepared-demo";
  import {
    pauseTimelineForCapture,
    resumeTimelineAfterCapture,
    timelineAfterProgramUpdate,
  } from "./browser/program-timeline";
  import { axisValueAt } from "./core/axis";
  import type { Command } from "./core/commands";
  import { reduceState } from "./core/reducer";
  import { createInitialState } from "./core/state";
  import { commandForKey } from "./input/keyboard";
  import { operate } from "./instruments/gcd-lcm/math";
  import { visibleGridExtent, type VisibleGridExtent } from "./render/layout";
  import type { EvaluationResult, PreparedFrame } from "./runtime";
  import {
    createTimelineState,
    reduceTimeline,
    timelineFrameAt,
    type TimelineState,
  } from "./timeline";
  import type { WatchCaptureRequest } from "./watch/protocol";
  import Controls from "./ui/Controls.svelte";
  import HelpOverlay from "./ui/HelpOverlay.svelte";
  import LatticeCanvas from "./ui/LatticeCanvas.svelte";
  import PerformanceOverlay from "./ui/PerformanceOverlay.svelte";
  import ProgramEditor from "./ui/ProgramEditor.svelte";
  import TimelineControls from "./ui/TimelineControls.svelte";
  import type { TimelineControlIntent } from "./ui/timeline-controls";

  const watchedEndpoint = watchEndpoint(window.location.href);
  const watchMode = watchedEndpoint !== null;
  const preparedDemo = !watchMode && preparedDemoEnabled(window.location.hash);
  const programMode = preparedDemo || watchMode;
  const initialProgram = preparedDemo ? loadBrowserProgram(PREPARED_DEMO_SOURCE) : null;
  if (initialProgram && !initialProgram.ok) {
    throw new Error(initialProgram.diagnostics.map(({ message }) => message).join("\n"));
  }
  let browserProgram: BrowserProgram | null = initialProgram?.loaded ?? null;
  let browserWatch = createBrowserWatchState();
  let captureInFlight = false;
  let captureResumeTimeline = false;
  let captureTimelineElapsedSeconds: number | null = null;
  let latticeCanvas: LatticeCanvas;
  let paintedRevision = 0;
  let paintedTimelineElapsedSeconds = 0;
  let pendingCapture: WatchCaptureRequest | null = null;
  let preparedFrame: PreparedFrame | null = null;
  let programEditor: ProgramEditor;
  let watchStatus: WatchConnectionStatus = "connecting";
  let state = createInitialState();
  let timelineClock: TimelineClock | null = null;
  let timelineState: TimelineState = createTimelineState(performance.now());
  let timelineTimestampMilliseconds = timelineState.anchorTimestampMilliseconds;
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

  function evaluationText(result: EvaluationResult | null): string {
    if (!result) return "not evaluated";
    if (result.kind === "number" || result.kind === "color") return `${result.value}`;
    return `${result.kind}: ${result.message}`;
  }

  function resetTimeline(timestampMilliseconds = performance.now()): void {
    timelineState = timelineAfterProgramUpdate(
      timelineState,
      true,
      timestampMilliseconds,
    );
    timelineTimestampMilliseconds = timestampMilliseconds;
    captureResumeTimeline = false;
    captureTimelineElapsedSeconds = null;
    pendingCapture = null;
  }

  function dispatchTimeline(intent: TimelineControlIntent): void {
    const timestampMilliseconds = performance.now();
    timelineState = intent.type === "set-speed"
      ? reduceTimeline(timelineState, {
          speed: intent.speed,
          timestampMilliseconds,
          type: "set-speed",
        })
      : reduceTimeline(timelineState, {
          timestampMilliseconds,
          type: intent.type,
        });
    timelineTimestampMilliseconds = timestampMilliseconds;
  }

  function beginCapture(request: WatchCaptureRequest): void {
    const timestampMilliseconds = performance.now();
    const paused = pauseTimelineForCapture(
      browserProgram?.program.variations ?? [],
      timelineState,
      timestampMilliseconds,
    );
    captureResumeTimeline = paused.resume;
    timelineState = paused.state;
    timelineTimestampMilliseconds = timestampMilliseconds;
    captureTimelineElapsedSeconds = paused.elapsedSeconds;
    pendingCapture = request;
  }

  function finishCapture(request: WatchCaptureRequest): void {
    if (pendingCapture?.id !== request.id) return;
    const resume = captureResumeTimeline;
    captureResumeTimeline = false;
    captureTimelineElapsedSeconds = null;
    pendingCapture = null;
    if (!resume) return;
    const timestampMilliseconds = performance.now();
    timelineState = resumeTimelineAfterCapture(
      timelineState,
      true,
      timestampMilliseconds,
    );
    timelineTimestampMilliseconds = timestampMilliseconds;
  }

  function cancelPendingCapture(): void {
    if (!pendingCapture) return;
    finishCapture(pendingCapture);
  }

  function applyPreparedSource(source: string): readonly BrowserProgramDiagnostic[] {
    if (!browserProgram) return [];
    const update = updateBrowserProgram(browserProgram, source);
    browserProgram = update.active;
    if (update.accepted) resetTimeline();
    return update.diagnostics;
  }

  onMount(() => {
    timelineClock = createTimelineClock((timestampMilliseconds) => {
      timelineTimestampMilliseconds = timestampMilliseconds;
    });
    const disconnect = watchedEndpoint
      ? connectWatchClient(watchedEndpoint, {
          onCapture: beginCapture,
          onStatus: (status) => watchStatus = status,
          onUpdate: (update) => {
            const previous = browserWatch;
            browserWatch = applyBrowserWatchUpdate(browserWatch, update);
            browserProgram = browserWatch.active;
            if (
              browserWatch !== previous
              && browserWatch.revision > previous.revision
              && browserWatch.accepted
            ) {
              resetTimeline();
            }
          },
        })
      : null;
    return () => {
      disconnect?.();
      timelineClock?.close();
      timelineClock = null;
    };
  });

  $: preparedProgram = browserProgram?.program ?? null;
  $: timelineFrame = timelineFrameAt(
    preparedProgram?.variations ?? [],
    timelineState,
    timelineTimestampMilliseconds,
  );
  $: timelineComplete = Boolean(
    preparedProgram?.variations.length
    && !timelineFrame.hasFutureVariation,
  );
  $: timelineClock?.setRunning(Boolean(
    preparedProgram?.variations.length
    && timelineState.playing
    && timelineFrame.hasFutureVariation
    && !pendingCapture,
  ));

  async function completeCapture(request: WatchCaptureRequest): Promise<void> {
    captureInFlight = true;
    try {
      const capture = await (async () => {
        try {
          const next = await latticeCanvas.capturePng();
          if (next.revision !== request.revision) {
            throw new Error("canvas changed before capture encoding began");
          }
          if (next.timelineElapsedSeconds !== captureTimelineElapsedSeconds) {
            throw new Error("timeline changed before capture encoding began");
          }
          return next;
        } catch (error) {
          await uploadWatchCaptureFailure(
            window.location.href,
            request,
            error,
          );
          return null;
        }
      })();
      if (!capture) return;

      await uploadWatchCapture(
        window.location.href,
        request,
        capture.image,
        {
          cssHeight: capture.cssHeight,
          cssWidth: capture.cssWidth,
          devicePixelRatio: capture.devicePixelRatio,
          locale: navigator.language,
          parameters: capture.parameters,
          pixelHeight: capture.pixelHeight,
          pixelWidth: capture.pixelWidth,
          revision: capture.revision,
          timelineElapsedSeconds: capture.timelineElapsedSeconds,
          userAgent: navigator.userAgent,
          viewX: capture.viewX,
          viewY: capture.viewY,
          zoomDenominator: capture.zoomDenominator,
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      captureInFlight = false;
      finishCapture(request);
    }
  }

  $: if (
    watchMode
    && latticeCanvas
    && pendingCapture
    && !captureInFlight
    && browserWatch.accepted
    && browserWatch.revision === pendingCapture.revision
    && paintedRevision === pendingCapture.revision
    && paintedTimelineElapsedSeconds === captureTimelineElapsedSeconds
  ) {
    void completeCapture(pendingCapture);
  }

  $: if (
    pendingCapture
    && browserWatch.revision > pendingCapture.revision
  ) {
    cancelPendingCapture();
  }

  function handleGlobalHelpKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || (event.key !== "?" && event.key !== "Escape")) return;
    const command = commandForKey(event.key);
    if (!command) return;
    event.preventDefault();
    dispatch(command);
  }

  $: selectedX = state.cursor ? axisValueAt(state.xAxis, state.cursor.x) : null;
  $: selectedY = state.cursor ? axisValueAt(state.yAxis, state.cursor.y) : null;
  $: selectedValue = selectedX === null || selectedY === null
    ? null
    : operate(state.operation, selectedX, selectedY);
  $: preparedCell = preparedFrame?.selectedCell ?? null;
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
  {#if programMode}
    <aside class="prepared-demo" aria-label={watchMode ? "Watched mim program" : "Prepared frame demo"}>
      <div class="prepared-demo-heading">
        <strong>{watchMode ? "watched mim program" : "prepared frame demo"}</strong>
        <button
          disabled={watchMode && browserWatch.revision === 0}
          type="button"
          on:click={() => programEditor.open()}
        >{watchMode ? "View program" : "Edit program"}</button>
      </div>
      {#if watchMode}
        <span
          class:watch-error={watchStatus === "disconnected"}
          role="status"
        >{watchStatus} · revision {browserWatch.revision}</span>
        <code>{browserWatch.source.trim().replaceAll("\n", " · ") || "waiting for source"}</code>
        {#if browserWatch.revision === 0}
          <span>waiting for the watched file</span>
        {:else if browserWatch.accepted}
          <span>
            valid · {watchStatus === "connected" ? "live" : "showing last received picture"}
            · press <kbd>:</kbd> to view
          </span>
        {:else}
          <span class="watch-error" role="alert">invalid file · showing last valid picture</span>
          {#each browserWatch.diagnostics as diagnostic}
            <span class="watch-error">
              {diagnostic.span.start.line}:{diagnostic.span.start.column} {diagnostic.message}
            </span>
          {/each}
        {/if}
      {:else}
        <span>LCM → strip prime 31 → exact color</span>
        <code>{browserProgram?.source.trim().replaceAll("\n", " · ")}</code>
        <span>press <kbd>:</kbd> to edit · append <code>#legacy</code> for the merged renderer</span>
      {/if}
    </aside>
  {:else}
    <Controls {state} {dispatch} />
  {/if}

  {#if preparedProgram?.variations.length}
    <TimelineControls
      complete={timelineComplete}
      dispatch={dispatchTimeline}
      elapsedSeconds={timelineFrame.elapsedSeconds}
      state={timelineState}
    />
  {/if}

  <div class="instrument">
    <LatticeCanvas
      {state}
      {dispatch}
      frameRevision={watchMode ? browserWatch.revision : 0}
      parameterOverrides={timelineFrame.overrides}
      program={preparedProgram}
      timelineElapsedSeconds={timelineFrame.elapsedSeconds}
      bind:paintedRevision
      bind:paintedTimelineElapsedSeconds
      bind:preparedFrame
      bind:this={latticeCanvas}
      bind:visibleExtent
    />
  </div>

  <PerformanceOverlay
    visible={state.performanceVisible}
    windowSeconds={state.performanceWindowSeconds}
  />

  {#if programMode && (browserProgram || (watchMode && browserWatch.revision > 0))}
    <ProgramEditor
      apply={applyPreparedSource}
      bind:this={programEditor}
      format={formatBrowserProgram}
      readOnly={watchMode}
      reportedDiagnostics={watchMode ? browserWatch.diagnostics : []}
      source={watchMode ? browserWatch.source : browserProgram?.source ?? ""}
      watchConnected={watchStatus === "connected"}
    />
  {/if}

  <aside class="camera-readout" aria-label="Camera status">
    <span>zoom <strong>1/{state.zoomDenominator}</strong></span>
    <span>M <strong>{visibleExtent.columns}</strong></span>
    <span>N <strong>{visibleExtent.rows}</strong></span>
  </aside>

  <aside class="readout" aria-live="polite">
    {#if state.motionStart && !state.motionEnd}
      <span>recording from ({state.motionStart.x}, {state.motionStart.y})</span>
    {:else if recordedMotion}
      <span>{recordedMotion.steps} motions · Δ({recordedMotion.dx}, {recordedMotion.dy})</span>
    {/if}
    {#if programMode && preparedCell}
      <strong>({preparedCell.x}, {preparedCell.y})</strong>
      <span>field {evaluationText(preparedCell.evaluation.field)}</span>
      <span>lens {evaluationText(preparedCell.evaluation.lens)}</span>
    {:else if !programMode && state.cursor && selectedX !== null && selectedY !== null && selectedValue !== null}
      <strong>{state.operation}({selectedX}, {selectedY})</strong>
      <span>= {selectedValue}</span>
    {:else}
      <span>point at the lattice</span>
    {/if}
  </aside>

  {#if state.helpVisible}
    <HelpOverlay {dispatch} />
  {/if}
</main>
