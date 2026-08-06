import { describe, expect, test } from "bun:test";

import { preparedPaintStyle } from "./paint-style";

describe("prepared Canvas paint styles", () => {
  test("formats resolved HSL paint", () => {
    expect(preparedPaintStyle({
      alpha: 0.72,
      hue: 137,
      kind: "hsl",
      lightness: 62,
      saturation: 62,
    })).toBe("hsla(137, 62%, 62%, 0.72)");
  });

  test("makes undefined and error cells visibly distinct", () => {
    expect(preparedPaintStyle({ kind: "undefined" }))
      .toBe("rgba(148, 163, 184, 0.34)");
    expect(preparedPaintStyle({ kind: "error" }))
      .toBe("rgba(244, 63, 94, 0.82)");
  });
});
