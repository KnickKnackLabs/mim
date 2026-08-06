import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";

import { copyPagesIndex } from "./build-pages";

describe("Pages artifact", () => {
  test("publishes the standalone HTML byte-for-byte as index.html", async () => {
    const dist = await mkdtemp(join(tmpdir(), "mim-pages-"));
    try {
      const source = "<!doctype html><title>mim</title>";
      await writeFile(join(dist, "mim.html"), source);
      const output = await copyPagesIndex(dist);
      expect(output).toBe(join(dist, "index.html"));
      expect(await readFile(output, "utf8")).toBe(source);
    } finally {
      await rm(dist, { force: true, recursive: true });
    }
  });
});
