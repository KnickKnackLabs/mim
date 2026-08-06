<div align="center">

# mim

**A keyboard-driven visual mathematics instrument.**

Modular source. One portable HTML artifact.

![UI: Svelte](https://img.shields.io/badge/UI-Svelte-ff3e00?style=flat)
![core: TypeScript](https://img.shields.io/badge/core-TypeScript-3178c6?style=flat)
![renderer: Canvas 2D](https://img.shields.io/badge/renderer-Canvas%202D-175e7a?style=flat)
![unit suites: 63](https://img.shields.io/badge/unit%20suites-63-brightgreen?style=flat)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

</div>

<br />

## What this is

`mim` is an interactive square-grid instrument for exploring mathematical structure. The first instrument evaluates exact GCD and LCM values, highlights prime results, and supports pointer or keyboard movement.

Svelte owns the interface shell. Plain TypeScript owns state, commands, mathematics, deterministic variation timelines, the display pipeline, and Canvas rendering. Vite compiles the maintained source into one direct-open `dist/mim.html` file.

## Start

```bash
mise trust
mise install
bun install --frozen-lockfile
mise run mim:dev

# Watch one program in a persistent browser.
mise run mim:watch experiment.mim --open

# Explore a native animated variation.
mise run mim:watch examples/animated-radial-residues-31.mim --open

# Explore a static curated program.
mise run mim:watch examples/radial-residues-31.mim --open

# Capture the exact current variation frame from that live browser.
# The PNG and its .json sidecar must not already exist.
mise run mim:capture http://127.0.0.1:4312/?watch=1 /tmp/mim.png

# Build and open the portable artifact.
mise run mim
```

## Annotated examples

Each program introduces one visual idea and keeps its explanation beside the statements it clarifies. The standalone browser bundles the complete library: use `Examples` or `:example <name>` to load full annotated source, or open a file through `mim:watch` with an ordinary text editor. Programs with `:vary` expose play, restart, and bounded-speed controls.

| Program                                          | What it shows                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `examples/animated-cubic-quadratic-residues.mim` | **Cubic and quadratic residue waves**. A moving target reveals finite-field level sets hidden inside x³ + y².      |
| `examples/animated-radial-residues-31.mim`       | **Radial residue drift modulo 31**. A native variation moves the radial field through one seamless modular period. |
| `examples/animated-two-axis-orbit.mim`           | **Two-axis orbit**. Two independent clocks move a radial field along a changing path.                              |
| `examples/animated-hyperbolic-residues.mim`      | **Hyperbolic residues**. Difference-of-squares contours flow through a modular period.                             |
| `examples/animated-modular-multiplication.mim`   | **Modular multiplication**. A moving multiplication table wraps every value around the prime 31.                   |
| `examples/radial-residues-31.mim`                | **Radial residues modulo 31**. Squared distance folded by a prime forms repeating targets and curved bands.        |
| `examples/gcd-lattice.mim`                       | **GCD lattice**. Common divisors form symmetric bands across the signed integer grid.                              |
| `examples/dyadic-lcm-depth.mim`                  | **Dyadic LCM depth**. Powers of two become a nested plaid of divisibility bands.                                   |
| `examples/prime-stripped-lcm.mim`                | **Prime-stripped LCM**. Remove one chosen prime's complete contribution from an LCM field.                         |
| `examples/xor-interference.mim`                  | **XOR interference**. Binary differences produce nested diamonds, bands, and checker textures.                     |

## Static site

The standalone artifact includes the editor, annotated example library, and native variation playback without a server. Build the GitHub Pages entry point with `mise run mim:pages:build`; it publishes the validated standalone bytes as `dist/index.html`. File watching and server-assisted capture remain local development tools.

## Architecture

| Owner                | Responsibility                                                              |
| -------------------- | --------------------------------------------------------------------------- |
| `src/core`           | Interaction state, semantic commands, reducer                               |
| `src/examples`       | Curated manifest, source-owned metadata, and browser library                |
| `src/language`       | Parsing, source spans, diagnostics, and formatting                          |
| `src/program`        | Program structure, names, types, and validation                             |
| `src/runtime`        | Expression evaluation and prepared frames                                   |
| `src/timeline`       | Pure logical time, variation evaluation, and playback state                 |
| `src/browser`        | Browser program, editor, watch, clock, and capture adapters                 |
| `src/browser/canvas` | Program-driven Canvas painting                                              |
| `src/instruments`    | Legacy instrument mathematics and display classifications                   |
| `src/input`          | Keyboard and pointer input translated into commands                         |
| `src/render`         | Shared layout and legacy rendering boundaries                               |
| `src/ui`             | Svelte controls and Canvas host                                             |
| `src/watch`          | File observation, live capture, and loopback transport                      |
| `examples`           | Curated annotated programs and their owner-level validation                 |
| `scripts`            | CLI lifecycle, standalone build, capture requests, and aggregate validation |

## Tasks

| Task                       | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `mise run bats`            | Run BATS task-boundary tests                               |
| `mise run doctor`          | Check local development setup                              |
| `mise run mim`             | Build and open the standalone mim instrument               |
| `mise run mim:build`       | Build the standalone mim HTML artifact                     |
| `mise run mim:capture`     | Capture the current canvas from one live mim watch session |
| `mise run mim:dev`         | Run the mim development server                             |
| `mise run mim:pages:build` | Build the static GitHub Pages artifact                     |
| `mise run mim:watch`       | Watch one .mim program in a persistent browser             |
| `mise run test`            | Run the complete mim validation path                       |

## Validation

```bash
mise run test
codebase lint "$PWD"
readme build --check
git diff --check
```

The aggregate path runs Bun unit tests, Svelte checks, the real standalone build, artifact inspection, and narrow BATS task-boundary tests.

<div align="center">

<sub>
Built as one file, operated as an instrument.
</sub></div>
