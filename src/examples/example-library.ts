import { loadBrowserProgram } from "../browser/load-browser-program";
import {
  EXAMPLE_FILES,
  exampleSlug,
  type ExampleFile,
} from "./example-manifest";
import { parseExampleMetadata } from "./example-metadata";

const rawExamples = import.meta.glob("../../examples/*.mim", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

export interface BrowserExample {
  description: string;
  file: ExampleFile;
  name: string;
  source: string;
  title: string;
  varying: boolean;
}

export const EXAMPLES: readonly BrowserExample[] = EXAMPLE_FILES.map((file) => {
  const source = rawExamples[`../../examples/${file}`];
  if (typeof source !== "string") throw new Error(`missing bundled example ${file}`);
  const loaded = loadBrowserProgram(source);
  if (!loaded.ok) {
    throw new Error(`${file}: ${loaded.diagnostics.map(({ message }) => message).join("; ")}`);
  }
  return {
    ...parseExampleMetadata(file, source),
    file,
    name: exampleSlug(file),
    source,
    varying: loaded.loaded.program.variations.length > 0,
  };
});

export function findExample(name: string): BrowserExample | null {
  return EXAMPLES.find((example) => example.name === name) ?? null;
}
