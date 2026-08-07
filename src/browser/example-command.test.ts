import { describe, expect, test } from "bun:test";

import {
  exampleCommandDraft,
  exampleNameFromUrl,
  parseExampleCommand,
  urlForExample,
} from "./example-command";

describe("browser example commands", () => {
  test("parses picker and named commands only as complete input", () => {
    expect(parseExampleCommand(" :example \n")).toEqual({ type: "open-example-picker" });
    expect(parseExampleCommand(":example radial-residues-31")).toEqual({
      name: "radial-residues-31",
      type: "load-example",
    });
    expect(parseExampleCommand(":example nope! ")).toEqual({
      message: "expected :example <name>",
      type: "invalid-example-command",
    });
    expect(parseExampleCommand(":mim 1\n:field 1")).toBeNull();
  });

  test("keeps command drafts out of automatic program application", () => {
    expect(exampleCommandDraft(":example radial")).toBe(true);
    expect(exampleCommandDraft(":mim 1")).toBe(false);
  });

  test("reads and writes shareable example URLs", () => {
    expect(exampleNameFromUrl("https://mim.test/?example=gcd-lattice")).toBe("gcd-lattice");
    expect(urlForExample("https://mim.test/?watch=1#prepared", "gcd-lattice"))
      .toBe("https://mim.test/?example=gcd-lattice#prepared");
  });
});
