# Mim as an agent-driven evolving instrument

Status: agent-driven foundation implemented; native evolution is the next design lane

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
and future animation should all operate on the same validated model.

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
1. `src/runtime` evaluates a `ValidatedProgram` and prepares a `PreparedFrame`.
1. `src/browser` adapts the prepared frame to browser state.
1. `src/browser/canvas` paints it without owning language or validation rules.

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
`LatticeCanvas` returns the PNG from the canvas it actually painted.
The browser uploads the image and camera/viewport metadata to the loopback server.
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

- the GCD lattice;
- prime-stripped LCM;
- XOR interference;
- dyadic LCM depth; and
- radial residues modulo 31.

Each example is valid executable `.mim` source.
Its comments explain both the mathematical idea and the purpose of nearby statements.

## Stable invariants

- Parsing, validation, evaluation, frame preparation, and painting remain separate owners.
- Invalid input never replaces the last valid picture.
- Source locations survive through diagnostics.
- Browser/UI state does not leak into the mathematical core.
- The static standalone/default path remains available.
- `#legacy` remains a rollback path while the program-driven path earns parity.
- Watch mode has one source writer: the watched file.
- Capture readiness belongs to the canvas that painted the requested revision.
- Generated `dist/mim.html` is ignored and never edited or committed.
- Public tasks express intent while lifecycle and transport mechanics stay behind typed owners.

## Implemented and future boundaries

Implemented now:

- `.mim` parsing, formatting, diagnostics, and validation;
- generic axes, parameters, expressions, fields, lenses, color intent, and overlays;
- pure execution and prepared frames;
- Canvas painting with a legacy rollback;
- browser editing with last-valid preservation;
- loopback file watching;
- listening-browser PNG capture with reproducibility metadata; and
- an annotated example library.

Future design, not current syntax or behavior:

- native parameter stepping and continuous evolution;
- deterministic timelines and replayable animation;
- frame sequences, contact sheets, and video;
- broader parameter types, view declarations, and color encodings;
- chained lens pipelines;
- a general interactive command shell;
- cold/headless capture for CI; and
- removal of the legacy path after accepted parity.

## Next design lane: native evolution

The file-rewrite experiment proved that watch mode is good for human- and agent-paced edits,
not smooth animation.
Animation should evolve validated runtime state inside mim.

The next design must decide:

- which parameters may evolve;
- whether evolution is step-based, time-based, or both;
- how pause, speed, reset, and deterministic replay work;
- how the browser and an agent issue the same semantic evolution commands;
- how a timeline records exact inputs rather than browser timing accidents; and
- how capture identifies a precise frame.

That lane should preserve deterministic programs,
last-valid behavior,
and the current dependency direction.
