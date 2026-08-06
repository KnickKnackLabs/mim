import { describe, expect, test } from "bun:test";
import { DEFAULT_PROGRAM_DEFINITIONS, type ProgramDefinitions } from "./definitions";
import { parseAst, PROVING_PROGRAM, replaceLine } from "./test-support";
import { validateProgram } from "./validate-program";

describe("program definitions", () => {
  test("accepts programmatic axis and function definitions", () => {
    const definitions: ProgramDefinitions = {
      axes: [...DEFAULT_PROGRAM_DEFINITIONS.axes, "squares"],
      functions: [
        ...DEFAULT_PROGRAM_DEFINITIONS.functions,
        { inputs: ["number"], name: "double", output: "number" },
        { inputs: ["number"], name: "heat", output: "color" },
      ],
    };
    const source = replaceLine(
      replaceLine(
        replaceLine(PROVING_PROGRAM, ":axis x", ":axis x squares"),
        ":field",
        ":field double(x)",
      ),
      ":color",
      ":color heat(lens)",
    );

    const result = validateProgram(parseAst(source), definitions);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.axes.x.definition).toBe("squares");
    expect(result.program.field).toEqual(expect.objectContaining({ functionName: "double" }));
    expect(result.program.color).toEqual(expect.objectContaining({ functionName: "heat" }));
  });
});
