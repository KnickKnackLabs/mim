import { describe, expect, test } from "bun:test";

import { PREPARED_DEMO_SOURCE } from "./prepared-demo";
import {
  applyBrowserWatchUpdate,
  createBrowserWatchState,
} from "./watch-mode";

describe("browser watch mode", () => {
  test("keeps the last valid picture through failure and recovery", () => {
    const valid = applyBrowserWatchUpdate(createBrowserWatchState(), {
      revision: 1,
      source: PREPARED_DEMO_SOURCE,
    });
    expect(valid.accepted).toBe(true);
    expect(valid.active?.source).toBe(PREPARED_DEMO_SOURCE);

    const invalidSource = PREPARED_DEMO_SOURCE.replace("prime = 31", "prime = 32");
    const invalid = applyBrowserWatchUpdate(valid, {
      revision: 2,
      source: invalidSource,
    });
    expect(invalid.accepted).toBe(false);
    expect(invalid.active).toBe(valid.active);
    expect(invalid.source).toBe(invalidSource);
    expect(invalid.diagnostics[0]).toEqual(expect.objectContaining({ code: "invalid-parameter" }));

    const recoveredSource = PREPARED_DEMO_SOURCE.replace("prime = 31", "prime = 37");
    const recovered = applyBrowserWatchUpdate(invalid, {
      revision: 3,
      source: recoveredSource,
    });
    expect(recovered.accepted).toBe(true);
    expect(recovered.active?.source).toBe(recoveredSource);
    expect(recovered.diagnostics).toEqual([]);
  });

  test("ignores stale revisions", () => {
    const current = applyBrowserWatchUpdate(createBrowserWatchState(), {
      revision: 2,
      source: PREPARED_DEMO_SOURCE,
    });
    expect(applyBrowserWatchUpdate(current, {
      revision: 1,
      source: ":mim 1\n:field (\n",
    })).toBe(current);
  });
});
