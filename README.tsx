/** @jsxImportSource jsx-md */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { EXAMPLE_FILES } from "./src/examples/example-manifest";
import { parseExampleMetadata } from "./src/examples/example-metadata";

import {
  Badge,
  Badges,
  Bold,
  Cell,
  Center,
  Code,
  CodeBlock,
  Heading,
  LineBreak,
  Paragraph,
  Section,
  Sub,
  Table,
  TableHead,
  TableRow,
} from "readme";

const repoRoot = resolve(import.meta.dirname);
const taskRoot = join(repoRoot, ".mise/tasks");

interface ExampleInfo {
  description: string;
  path: string;
  title: string;
}

interface TaskInfo {
  description: string;
  name: string;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function examples(): ExampleInfo[] {
  const exampleRoot = join(repoRoot, "examples");
  const discovered = readdirSync(exampleRoot)
    .filter((name) => name.endsWith(".mim"))
    .sort();
  if (discovered.join("\n") !== [...EXAMPLE_FILES].sort().join("\n")) {
    throw new Error("curated example manifest does not match examples/*.mim");
  }
  return EXAMPLE_FILES.map((file) => {
    const metadata = parseExampleMetadata(file, readFileSync(join(exampleRoot, file), "utf8"));
    return { ...metadata, path: `examples/${file}` };
  });
}

function tasks(): TaskInfo[] {
  return walk(taskRoot).flatMap((path) => {
    const source = readFileSync(path, "utf8");
    const description = source.match(/^#MISE description="(.+)"$/m)?.[1];
    if (!description) return [];
    const relative = path.slice(taskRoot.length + 1).replace(/\/_default$/, "");
    return [{ name: relative.replaceAll("/", ":"), description }];
  }).sort((left, right) => left.name.localeCompare(right.name));
}

const unitTests = ["src", "scripts", "examples"]
  .flatMap((dir) => walk(join(repoRoot, dir)))
  .filter((path) => path.endsWith(".test.ts")).length;
const annotatedExamples = examples();
const publicTasks = tasks();

const readme = (
  <>
    <Center>
      <Heading level={1}>mim</Heading>
      <Paragraph><Bold>A keyboard-driven visual mathematics instrument.</Bold></Paragraph>
      <Paragraph>Modular source. One portable HTML artifact.</Paragraph>
      <Badges>
        <Badge label="UI" value="Svelte" color="ff3e00" />
        <Badge label="core" value="TypeScript" color="3178c6" />
        <Badge label="renderer" value="Canvas 2D" color="175e7a" />
        <Badge label="unit suites" value={`${unitTests}`} color="brightgreen" />
        <Badge label="License" value="MIT" color="blue" href="LICENSE" />
      </Badges>
    </Center>

    <LineBreak />

    <Section title="What this is">
      <Paragraph>
        <Code>mim</Code>{" is an interactive square-grid instrument for exploring mathematical structure. The first instrument evaluates exact GCD and LCM values, highlights prime results, and supports pointer or keyboard movement."}
      </Paragraph>
      <Paragraph>
        {"Svelte owns the interface shell. Plain TypeScript owns state, commands, mathematics, deterministic variation timelines, the display pipeline, and Canvas rendering. Vite compiles the maintained source into one direct-open "}<Code>dist/mim.html</Code>{" file."}
      </Paragraph>
    </Section>

    <Section title="Start">
      <CodeBlock lang="bash">{`mise trust
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
mise run mim`}</CodeBlock>
    </Section>

    <Section title="Annotated examples">
      <Paragraph>
        {"Each program introduces one visual idea and keeps its explanation beside the statements it clarifies. The standalone browser bundles the complete library: use "}<Code>Examples</Code>{" or "}<Code>:example &lt;name&gt;</Code>{" to load full annotated source, or open a file through "}<Code>mim:watch</Code>{" with an ordinary text editor. Programs with "}<Code>:vary</Code>{" expose play, restart, and bounded-speed controls."}
      </Paragraph>
      <Table>
        <TableHead><Cell>Program</Cell><Cell>What it shows</Cell></TableHead>
        {annotatedExamples.map((example) => (
          <TableRow>
            <Cell><Code>{example.path}</Code></Cell>
            <Cell><Bold>{example.title}</Bold>{`. ${example.description}`}</Cell>
          </TableRow>
        ))}
      </Table>
    </Section>

    <Section title="Static site">
      <Paragraph>
        {"The standalone artifact includes the editor, annotated example library, and native variation playback without a server. Build the GitHub Pages entry point with "}<Code>mise run mim:pages:build</Code>{"; it publishes the validated standalone bytes as "}<Code>dist/index.html</Code>{". File watching and server-assisted capture remain local development tools."}
      </Paragraph>
    </Section>

    <Section title="Architecture">
      <Table>
        <TableHead><Cell>Owner</Cell><Cell>Responsibility</Cell></TableHead>
        <TableRow><Cell><Code>src/core</Code></Cell><Cell>Interaction state, semantic commands, reducer</Cell></TableRow>
        <TableRow><Cell><Code>src/examples</Code></Cell><Cell>Curated manifest, source-owned metadata, and browser library</Cell></TableRow>
        <TableRow><Cell><Code>src/language</Code></Cell><Cell>Parsing, source spans, diagnostics, and formatting</Cell></TableRow>
        <TableRow><Cell><Code>src/program</Code></Cell><Cell>Program structure, names, types, and validation</Cell></TableRow>
        <TableRow><Cell><Code>src/runtime</Code></Cell><Cell>Expression evaluation and prepared frames</Cell></TableRow>
        <TableRow><Cell><Code>src/timeline</Code></Cell><Cell>Pure logical time, variation evaluation, and playback state</Cell></TableRow>
        <TableRow><Cell><Code>src/browser</Code></Cell><Cell>Browser program, editor, watch, clock, and capture adapters</Cell></TableRow>
        <TableRow><Cell><Code>src/browser/canvas</Code></Cell><Cell>Program-driven Canvas painting</Cell></TableRow>
        <TableRow><Cell><Code>src/instruments</Code></Cell><Cell>Legacy instrument mathematics and display classifications</Cell></TableRow>
        <TableRow><Cell><Code>src/input</Code></Cell><Cell>Keyboard and pointer input translated into commands</Cell></TableRow>
        <TableRow><Cell><Code>src/render</Code></Cell><Cell>Shared layout and legacy rendering boundaries</Cell></TableRow>
        <TableRow><Cell><Code>src/ui</Code></Cell><Cell>Svelte controls and Canvas host</Cell></TableRow>
        <TableRow><Cell><Code>src/watch</Code></Cell><Cell>File observation, live capture, and loopback transport</Cell></TableRow>
        <TableRow><Cell><Code>examples</Code></Cell><Cell>Curated annotated programs and their owner-level validation</Cell></TableRow>
        <TableRow><Cell><Code>scripts</Code></Cell><Cell>CLI lifecycle, standalone build, capture requests, and aggregate validation</Cell></TableRow>
      </Table>
    </Section>

    <Section title="Tasks">
      <Table>
        <TableHead><Cell>Task</Cell><Cell>Description</Cell></TableHead>
        {publicTasks.map((task) => (
          <TableRow><Cell><Code>{`mise run ${task.name}`}</Code></Cell><Cell>{task.description}</Cell></TableRow>
        ))}
      </Table>
    </Section>

    <Section title="Validation">
      <CodeBlock lang="bash">{`mise run test
codebase lint "$PWD"
readme build --check
git diff --check`}</CodeBlock>
      <Paragraph>
        {"The aggregate path runs Bun unit tests, Svelte checks, the real standalone build, artifact inspection, and narrow BATS task-boundary tests."}
      </Paragraph>
    </Section>

    <Center>
      <Sub>Built as one file, operated as an instrument.</Sub>
    </Center>
  </>
);

console.log(readme);
