import { describe, expect, test } from "bun:test";

import {
  programEditorInputAction,
  programEditorWindowAction,
} from "./program-editor-keys";

describe("program editor keyboard actions", () => {
  test("opens from colon outside editable controls", () => {
    expect(programEditorWindowAction({
      defaultPrevented: false,
      editableTarget: false,
      key: ":",
      visible: false,
    })).toBe("open");
  });

  test("does not steal colon from an editable control", () => {
    expect(programEditorWindowAction({
      defaultPrevented: false,
      editableTarget: true,
      key: ":",
      visible: false,
    })).toBeNull();
  });

  test("closes a visible editor with Escape", () => {
    expect(programEditorWindowAction({
      defaultPrevented: false,
      editableTarget: true,
      key: "Escape",
      visible: true,
    })).toBe("close");
  });

  test("closes a focused editor input with Escape", () => {
    expect(programEditorInputAction("Escape", false, false)).toBe("close");
  });

  test("applies with platform command Enter", () => {
    expect(programEditorInputAction("Enter", true, false)).toBe("apply");
    expect(programEditorInputAction("Enter", false, true)).toBe("apply");
    expect(programEditorInputAction("Enter", false, false)).toBeNull();
  });
});
