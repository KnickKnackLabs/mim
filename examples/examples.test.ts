import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

import { loadBrowserProgram } from "../src/browser/load-browser-program";

const exampleNames = readdirSync(import.meta.dir)
  .filter((name) => name.endsWith(".mim"))
  .sort();

describe("annotated example programs", () => {
  test("keeps the curated teaching library visible", () => {
    expect(exampleNames).toEqual([
      "animated-prime-stripped-lcm.mim",
      "animated-radial-residues-31.mim",
      "dyadic-lcm-depth.mim",
      "gcd-lattice.mim",
      "prime-stripped-lcm.mim",
      "radial-residues-31.mim",
      "xor-interference.mim",
    ]);
  });

  for (const name of exampleNames) {
    test(`loads ${name}`, () => {
      const source = readFileSync(join(import.meta.dir, name), "utf8");
      const loaded = loadBrowserProgram(source);
      const lines = source.split("\n");
      const firstStatement = lines.findIndex((line) => line.startsWith(":"));

      expect(loaded.diagnostics).toEqual([]);
      expect(loaded.ok).toBe(true);
      expect(lines.filter((line) => line.startsWith("# ")).length).toBeGreaterThanOrEqual(4);
      expect(lines.slice(firstStatement + 1).some((line) => line.startsWith("# "))).toBe(true);
    });
  }
});
