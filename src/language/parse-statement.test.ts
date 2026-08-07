import { describe, expect, test } from "bun:test";

import { SyntaxFailure } from "./diagnostics";
import { parseStatement } from "./parse-statement";

function parse(source: string) {
  return parseStatement(source, 7, 40);
}

describe("parseStatement", () => {
  test.each([
    [":mim 1", { kind: "mim", version: 1 }],
    [":param p prime = 31", {
      initial: { kind: "number", value: 31 },
      kind: "parameter",
      name: "p",
      parameterType: "prime",
    }],
    [":axis x primes(offset)", {
      axis: "x",
      definition: { callee: "primes", kind: "call" },
      kind: "axis",
    }],
    [":vary phase from -0.5 to 31 over 8.25s pingpong", {
      durationSeconds: 8.25,
      form: "linear",
      from: -0.5,
      kind: "variation",
      mode: "pingpong",
      parameter: "phase",
      to: 31,
    }],
    [":vary p through 2, 3, 5, 7 every 500ms pingpong", {
      form: "discrete",
      kind: "variation",
      mode: "pingpong",
      parameter: "p",
      sequence: { kind: "explicit", values: [2, 3, 5, 7] },
      timing: { kind: "every", seconds: 0.5 },
    }],
    [":vary n through integers(-2, 2) over 10s loop", {
      form: "discrete",
      kind: "variation",
      mode: "loop",
      parameter: "n",
      sequence: { from: -2, generator: "integers", kind: "generated", to: 2 },
      timing: { kind: "over", seconds: 10 },
    }],
    [":field lcm(x, y)", { expression: { callee: "lcm" }, kind: "field" }],
    [":lens strip(value, p)", { expression: { callee: "strip" }, kind: "lens" }],
    [":color exact(lens)", { expression: { callee: "exact" }, kind: "color" }],
    [":overlay equality off", { kind: "overlay", name: "equality", state: "off" }],
  ])("parses %p", (source, expected) => {
    expect(parse(source)).toMatchObject(expected);
  });

  test("allows flexible spacing and hyphenated statement identifiers", () => {
    expect(parse(" : param removal-depth integer=2 ")).toMatchObject({
      kind: "parameter",
      name: "removal-depth",
      parameterType: "integer",
    });
  });

  test("leaves semantic names for the future compiler", () => {
    expect(parse(":axis diagonal unknown_axis(thing)")).toMatchObject({
      axis: "diagonal",
      definition: { callee: "unknown_axis" },
      kind: "axis",
    });
  });

  test("covers the complete source line with its statement span", () => {
    expect(parse(":field x + y").span).toEqual({
      start: { column: 1, line: 7, offset: 40 },
      end: { column: 13, line: 7, offset: 52 },
    });
  });

  test.each([
    ["field x", 1],
    [":mim", 5],
    [":mim 1 extra", 8],
    [":param p prime 31", 16],
    [":param p prime =", 17],
    [":axis x", 8],
    [":vary phase from 0 to 31 over loop", 31],
    [":field", 7],
    [":overlay equality", 18],
  ])("rejects malformed statement %p", (source, column) => {
    try {
      parse(source);
      throw new Error("expected a syntax failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SyntaxFailure);
      expect(error).toMatchObject({ span: { start: { column, line: 7 } } });
    }
  });

  test("gives unknown statements their own diagnostic code", () => {
    try {
      parse(":animate p");
      throw new Error("expected a syntax failure");
    } catch (error) {
      expect(error).toMatchObject({ code: "unknown-statement" });
    }
  });
});
