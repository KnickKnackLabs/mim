import { describe, expect, test } from "bun:test";

import { PREPARED_DEMO_SOURCE } from "../browser/prepared-demo";
import type { WatchUpdate } from "./protocol";
import { WatchSession } from "./watch-session";

describe("watched program session", () => {
  test("reports valid, invalid, and recovered revisions", () => {
    const diagnostics: string[] = [];
    const reports: string[] = [];
    const accepted: boolean[] = [];
    const updates: WatchUpdate[] = [];
    const session = new WatchSession({
      file: "/tmp/experiment.mim",
      publish: (update, valid) => {
        updates.push(update);
        accepted.push(valid);
      },
      reportDiagnostic: (line) => diagnostics.push(line),
      reportUpdate: (line) => reports.push(line),
    });

    expect(session.accept(PREPARED_DEMO_SOURCE).valid).toBe(true);
    expect(session.accept(":mim 1\n:field (\n").valid).toBe(false);
    expect(session.accept(PREPARED_DEMO_SOURCE.replace("prime = 31", "prime = 37")).valid).toBe(true);

    expect(updates.map(({ revision }) => revision)).toEqual([1, 2, 3]);
    expect(accepted).toEqual([true, false, true]);
    expect(reports[0]).toContain("updated (revision 1)");
    expect(diagnostics.some((line) => line.startsWith("/tmp/experiment.mim:2:"))).toBe(true);
    expect(reports.at(-1)).toContain("updated (revision 3)");
  });
});
