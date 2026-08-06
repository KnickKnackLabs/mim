import { describe, expect, test } from "bun:test";

import { PREPARED_DEMO_SOURCE } from "./prepared-demo";
import { loadBrowserProgram } from "./load-browser-program";
import { updateBrowserProgram } from "./update-browser-program";

function activeProgram() {
  const result = loadBrowserProgram(PREPARED_DEMO_SOURCE);
  if (!result.ok) throw new Error("proving program must load");
  return result.loaded;
}

describe("atomic browser program updates", () => {
  test("accepts a valid replacement", () => {
    const active = activeProgram();
    const source = active.source.replace("prime = 31", "prime = 37");
    const update = updateBrowserProgram(active, source);

    expect(update.accepted).toBe(true);
    expect(update.diagnostics).toEqual([]);
    expect(update.active.source).toContain("prime = 37");
    expect(update.active.program.parameters[0].initialValue).toBe(37);
  });

  test("preserves the active picture after semantic failure", () => {
    const active = activeProgram();
    const source = active.source.replace("prime = 31", "prime = 32");
    const update = updateBrowserProgram(active, source);

    expect(update.accepted).toBe(false);
    expect(update.active).toBe(active);
    expect(update.active.source).toContain("prime = 31");
    expect(update.diagnostics).toEqual([
      expect.objectContaining({ code: "invalid-parameter" }),
    ]);
  });

  test("preserves the active picture after syntax failure", () => {
    const active = activeProgram();
    const update = updateBrowserProgram(active, ":mim 1\n:field (\n");

    expect(update.accepted).toBe(false);
    expect(update.active).toBe(active);
    expect(update.diagnostics[0]).toEqual(expect.objectContaining({ code: "syntax" }));
  });
});
