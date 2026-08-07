import { describe, expect, test } from "bun:test";

import { programDirectivePreview } from "./program-preview";

describe("compact program preview", () => {
  test("keeps only comment-free directives with natural colon boundaries", () => {
    const source = `
# Cubic residue waves
:mim 1

:param   target number = 0 # the moving residue
:vary target from 0 to 31 over 12s loop

This malformed prose belongs only in the full source.
:field mod(x * x * x + y * y, 31)
`;

    expect(programDirectivePreview(source)).toBe(
      ":mim 1 :param target number = 0 :vary target from 0 to 31 over 12s loop :field mod(x * x * x + y * y, 31)",
    );
  });

  test("returns an empty preview when source has no directives", () => {
    expect(programDirectivePreview("# annotation only\n\n")).toBe("");
  });
});
