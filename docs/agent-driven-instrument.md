# Mim as an agent-driven evolving instrument

Status: agent-driven foundation and native variation implemented

## Main intent

Mim is a programmable mathematical instrument.
A human or agent should be able to define a visualization,
render it,
look at the result,
change it,
and explain what it found.

The browser remains useful for direct exploration.
The program is the durable source of truth.
UI controls, file watching, capture,
and native variation all operate on the same validated model.

## Current program model

A `.mim` file declares the instrument:

```text
# Radial residues modulo 31.

:mim 1

# Keep the origin centered on a signed lattice.
:axis x integers
:axis y integers

# Fold squared distance into repeating radial bands.
:field mod(x * x + y * y, 31)

:lens value
:color magnitude(lens)
:overlay equality off
```

Comments can explain the program beside the statements they clarify.
Formatting canonicalizes statements while preserving whole-line comments,
inline comments,
and interior blank grouping.

The implemented source path is explicit:

1. `src/language` parses source into `ProgramAst` with source spans.
1. `src/program` validates structure, names, types, and supported definitions.
1. `src/timeline` maps pure logical elapsed time to variation parameter values.
1. `src/runtime` evaluates a `ValidatedProgram` and prepares a `PreparedFrame`.
1. `src/browser` adapts the prepared frame and browser clock to the pure owners.
1. `src/browser/canvas` paints it without owning language, timeline, or validation rules.

The mathematical core does not depend on Svelte,
the browser,
or Canvas.
A validated program is serializable and contains no executable functions.

## Current ways to drive mim

### Browser editor

Press `:` or choose **Edit program**.
Valid source replaces the active program.
Invalid source shows located diagnostics while preserving the last valid picture.
Formatting and native undo remain available.

### Watched file

```bash
mise run mim:watch examples/radial-residues-31.mim --open
```

The watched file is authoritative.
Atomic saves and rapid edits are coalesced.
Valid saves update the existing page without losing camera or UI state.
Invalid saves report diagnostics in the terminal and browser while preserving the last valid picture.
The browser source view is read-only in watch mode.

### Live-browser capture

While one watched browser page is connected:

```bash
mise run mim:capture <watch-url> /tmp/radial.png
```

The server requests the exact accepted revision from the listening page.
For a varying program, capture pauses on one exact logical elapsed time and bound parameter set.
`LatticeCanvas` returns the PNG from the canvas it actually painted.
The browser uploads the image, camera/viewport state, timeline time, and bound parameters to the loopback server.
Schema 2 sidecars preserve that exact variation frame.
The server validates PNG structure and checksums,
then publishes the PNG and JSON sidecar without replacing an existing artifact.
The browser never chooses the filesystem destination.

Capture fails closed for invalid or stale source,
zero or multiple connected pages,
wrong or oversized uploads,
metadata or PNG dimension mismatches,
timeout,
and server shutdown.

### Annotated examples

`examples/` contains small teaching instruments for:

- animated radial residues modulo 31;
- the GCD lattice;
- prime-stripped LCM;
- XOR interference;
- dyadic LCM depth; and
- static radial residues modulo 31.

Each example is valid executable `.mim` source.
Its comments explain both the mathematical idea and the purpose of nearby statements.

## Stable invariants

- Parsing, validation, evaluation, frame preparation, and painting remain separate owners.
- Invalid input never replaces the last valid picture.
- Source locations survive through diagnostics.
- Browser/UI state does not leak into the mathematical core.
- Browser frame callbacks adapt a clock; pure timeline state owns logical time.
- Dropped frames jump to the correct logical time instead of accumulating deltas.
- The static standalone/default path remains available.
- `#legacy` remains a rollback path while the program-driven path earns parity.
- Watch mode has one source writer: the watched file.
- Capture readiness belongs to the canvas that painted the requested revision.
- Generated `dist/mim.html` is ignored and never edited or committed.
- Public tasks express intent while lifecycle and transport mechanics stay behind typed owners.

## Implemented and future boundaries

Implemented now:

- `.mim` parsing, formatting, diagnostics, and validation;
- generic axes, number/prime parameters, expressions, fields, lenses, color intent, and overlays;
- explicit `:vary` statements with deterministic `loop`, `pingpong`, and `once` modes;
- pure logical-time evaluation, pause, restart, and bounded playback speed;
- pure execution and prepared frames;
- Canvas painting with a legacy rollback;
- browser editing with last-valid preservation;
- loopback file watching;
- listening-browser PNG capture with reproducibility metadata; and
- an annotated example library.

Future design, not current syntax or behavior:

- discrete `through … every …` variation;
- serializable event timelines and replayable animation artifacts;
- frame sequences, contact sheets, and video;
- broader parameter types, view declarations, and color encodings;
- chained lens pipelines;
- a general interactive command shell;
- cold/headless capture for CI; and
- removal of the legacy path after accepted parity.

## Native variation boundary

A number parameter can vary continuously from its declared initial value:

```text
:param phase number = 0
:vary phase from 0 to 31 over 8s loop
```

The explicit `from` value must equal the parameter declaration.
`loop` wraps after one forward duration,
`pingpong` takes one duration in each direction,
and `once` holds at the endpoint and stops scheduling when every variation is complete.

Logical time derives from a monotonic anchor rather than accumulated frame deltas.
Valid editor or watch source replacement restarts at zero;
invalid source preserves the active program and timeline.
Programs without `:vary` and the `#legacy` path schedule no animation.

The next lane is a serializable event timeline and derived animation artifacts.
Discrete variation,
frame sequences,
contact sheets,
and video remain outside the current syntax.
