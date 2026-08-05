import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { parseWatchArguments } from "./watch";

describe("watch command arguments", () => {
  test("accepts the public watch form and open flag", () => {
    expect(parseWatchArguments(["watch", "experiment.mim", "--open"])).toEqual({
      file: resolve("experiment.mim"),
      open: true,
    });
  });

  test("rejects missing files and unknown flags", () => {
    expect(() => parseWatchArguments(["watch"])).toThrow("Usage: mim watch");
    expect(() => parseWatchArguments(["watch", "experiment.mim", "--write"])).toThrow("Usage: mim watch");
  });
});
