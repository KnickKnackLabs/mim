import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

import { loadBrowserProgram } from "../src/browser/load-browser-program";
import { EXAMPLE_FILES } from "../src/examples/example-manifest";
import { parseExampleMetadata } from "../src/examples/example-metadata";

const exampleNames = readdirSync(import.meta.dir)
  .filter((name) => name.endsWith(".mim"))
  .sort();

describe("annotated example programs", () => {
  test("keeps the curated teaching library visible", () => {
    expect(exampleNames).toEqual(EXAMPLE_FILES);
  });

  for (const name of exampleNames) {
    test(`loads ${name}`, () => {
      const source = readFileSync(join(import.meta.dir, name), "utf8");
      const loaded = loadBrowserProgram(source);
      const metadata = parseExampleMetadata(name, source);
      const lines = source.split("\n");
      const firstStatement = lines.findIndex((line) => line.startsWith(":"));

      expect(loaded.diagnostics).toEqual([]);
      expect(loaded.ok).toBe(true);
      expect(metadata.title.length).toBeGreaterThan(0);
      expect(metadata.description.length).toBeGreaterThan(0);
      expect(lines.filter((line) => line.startsWith("# ")).length).toBeGreaterThanOrEqual(4);
      expect(lines.slice(firstStatement + 1).some((line) => line.startsWith("# "))).toBe(true);
    });
  }
});
