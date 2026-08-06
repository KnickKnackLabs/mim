# Agent-driven mim implementation record and remaining plan

This note records what the agent-driven branch actually built
and the remaining architectural sequence.
It is not merge, release, deployment,
or cleanup authority.

The work began from merged baseline
`f270e57e9e1f669185e431ecd347b7f501ca10f1`.

## Enduring invariants

- Keep language, validation, runtime, frame preparation, rendering, and UI as honest owners.
- Keep Svelte and browser APIs out of mathematical code.
- Parse and validate before execution.
- Preserve source spans and useful diagnostics.
- Keep validated programs serializable.
- Adapt one `PreparedFrame` at the rendering boundary.
- Preserve the last valid picture when new source fails.
- Keep the static standalone path and `#legacy` rollback until parity is accepted.
- Keep generated artifacts reproducible and out of source control unless deliberately published.
- Require explicit authority for push, PR, merge, release, deployment, and cleanup.

## Implemented foundation

### Language and validation

`src/language` owns `.mim` lexical structure,
parsing,
source spans,
diagnostics,
and canonical formatting.
Source-aware formatting preserves comments and blank grouping.

`src/program` owns semantic validation and produces `ValidatedProgram`.
The implemented vocabulary covers the current version,
prime and number parameters,
continuous `:vary` statements,
axes,
field and lens expressions,
color intent,
and overlays.
Speculative view,
discrete variation,
serializable event-timeline,
and command-shell syntax was not added.

### Runtime and frame preparation

`src/timeline` maps immutable logical playback state to deterministic variation overrides.
It owns play/pause/restart,
bounded speed,
and `loop`, `pingpong`, and `once` evaluation.

`src/runtime` evaluates validated expressions and program channels.
It binds static or varied runtime parameters,
reports invalid domains,
and prepares one serializable `PreparedFrame`.

Canvas-specific paint resolution remains outside the runtime.
The existing instrument remains reachable through `#legacy`.

### Browser and editing

The browser path paints prepared programs through the Canvas adapter.
The editor opens from `:` or **Edit program**.
It supports diagnostics,
formatting,
native undo,
explicit apply,
and Escape.
Invalid drafts retain the last valid picture.

### File watching

`mise run mim:watch <file.mim> [--open]` owns a loopback-only live session.
The outer CLI owns build/open/shutdown.
Dedicated watch owners handle file observation,
validation,
protocol,
and transport.
The browser remains on one page and receives accepted source revisions.
The watched file is the only writer.

### Live-browser capture

`mise run mim:capture <watch-url> <output.png>` asks the single connected watch page for the exact painted revision.
The canvas owns PNG extraction and painted-state metadata.
The browser uploads to its same-origin loopback server.
The server validates PNG structure and checksums, then publishes the PNG and JSON sidecar without replacing an existing artifact.

Schema 2 metadata records the source and PNG hashes,
source revision,
mim revision and dirty state,
standalone artifact hash,
browser/runtime identity,
camera,
viewport,
device scale,
dimensions,
exact logical timeline time,
bound parameter values,
and timestamp.
Repeated unchanged captures produced byte-identical PNGs in the accepted local trial.

### Annotated examples

`examples/` contains six executable teaching programs,
including one native animated radial-residues instrument.
An owner-level test discovers and validates every `.mim` file through the real browser-program loader.
README content is derived from title and description comments in the examples.
No generated screenshots are committed.

## Actual ownership map

```text
examples/                         curated executable programs
src/language/                     parsing, spans, diagnostics, formatting
src/program/                      semantic validation
src/runtime/                      evaluation and PreparedFrame
src/timeline/                     pure variation evaluation and playback state
src/browser/                      browser program, watch, clock, and capture adapters
src/browser/canvas/               Canvas painting
src/watch/                        observation, protocol, loopback, capture lifecycle/artifacts
src/ui/                           human-facing controls and editor
scripts/                          typed command orchestration and aggregate tests
.mise/tasks/mim/                  thin public task adapters
```

## Current evidence

The completed foundation has been exercised through:

- focused parser, validator, timeline, runtime, prepared-frame, editor, watch, and capture tests;
- aggregate unit discovery including examples and command scripts;
- Svelte diagnostics;
- standalone single-file builds;
- BATS task-boundary tests;
- codebase lint and generated README checks;
- a real file-watch valid/invalid/recovery trial;
- an isolated native-variation trial covering smooth playback, pause, restart,
  bounded speed, valid-source reset, static and fresh-load `#legacy` refusal,
  and clean process shutdown;
- repeated paused-frame captures with byte-identical PNG output,
  exact logical elapsed time, and exact bound parameters; and
- human review of captured mathematical examples.

Exact gate counts belong in the PR or completion receipt,
not as a number that this plan must keep current.

## Implemented native variation

Number parameters can vary through explicit continuous statements:

```text
:param phase number = 0
:vary phase from 0 to 31 over 8s loop
```

The initial values must agree.
Pure logical time supports independent `loop`, `pingpong`, and `once` plans,
deterministic pause/restart,
and bounded 0.25×–4× speed.
The browser frame callback is only a clock adapter.
Valid source replacement restarts at zero;
invalid replacement preserves the active program and timeline.
Capture pauses and identifies one exact successfully painted logical frame.
Static programs and `#legacy` schedule no animation.

## Remaining sequence

### 1. Deterministic timelines and animation artifacts

Add a serializable timeline of semantic inputs and frame identities.
Then consider discrete `through … every …` variation,
frame sequences,
contact sheets,
and video as derived artifacts.

This phase must not depend on wall-clock accidents or repeated source-file writes.

### 2. Migration and legacy cleanup

Only after the program path has accepted behavioral and visual parity:

- choose the durable default instrument;
- remove superseded instrument-specific paths;
- retire `#legacy` deliberately;
- update examples and documentation; and
- preserve rollback evidence through the migration.

## Completion boundary

The current foundation completes agent-driven edit,
watch,
native continuous variation,
exact live-frame capture,
inspection,
and explanation.
It does not complete serializable event timelines,
discrete variation,
derived animation artifacts,
headless CI capture,
or final legacy migration.
