import { describe, expect, test } from "bun:test";

import { parseExampleMetadata } from "./example-metadata";

describe("example metadata", () => {
  test("uses the first two source comments as public metadata", () => {
    expect(parseExampleMetadata("demo.mim", "# Demo title\n# One sentence.\n:mim 1\n"))
      .toEqual({ description: "One sentence.", title: "Demo title" });
  });

  test("rejects examples without source-owned metadata", () => {
    expect(() => parseExampleMetadata("demo.mim", ":mim 1\n"))
      .toThrow("demo.mim must begin with title and description comments");
  });
});
