import { describe, it, expect } from "vitest";
import { classifyToolCall } from "./tool-metadata.js";

describe("classifyToolCall", () => {
  it("marks explicit Skill calls as skill loads with the skill name", () => {
    expect(classifyToolCall("Skill", { skill: "code-review" })).toEqual({
      ls_event_kind: "skill_load",
      ls_resource_kind: "skill",
      ls_skill_detection: "explicit",
      ls_skill_name: "code-review",
    });
  });

  it("handles Skill calls with no skill name", () => {
    expect(classifyToolCall("Skill", {})).toEqual({
      ls_event_kind: "skill_load",
      ls_resource_kind: "skill",
      ls_skill_detection: "explicit",
    });
  });

  it("marks Read of a SKILL.md as an inferred skill load", () => {
    expect(
      classifyToolCall("Read", { file_path: "/home/u/.claude/skills/verify/SKILL.md" }),
    ).toEqual({
      ls_event_kind: "skill_load",
      ls_resource_kind: "skill",
      ls_file_operation: "read",
      ls_skill_name: "verify",
      ls_skill_detection: "inferred",
    });
  });

  it("marks Read of other files under a skill dir as skill file access", () => {
    expect(
      classifyToolCall("Read", { file_path: "/home/u/skills/verify/scripts/run.sh" }),
    ).toEqual({
      ls_event_kind: "skill_file_access",
      ls_resource_kind: "skill_file",
      ls_file_operation: "read",
      ls_skill_name: "verify",
    });
  });

  it("marks Write under a skill dir as skill file mutation", () => {
    expect(
      classifyToolCall("Write", { file_path: "/home/u/skills/verify/SKILL.md" }),
    ).toEqual({
      ls_event_kind: "skill_file_mutation",
      ls_resource_kind: "skill_file",
      ls_file_operation: "write",
      ls_skill_name: "verify",
    });
  });

  it("marks Edit under a skill dir as skill file mutation", () => {
    expect(
      classifyToolCall("Edit", { file_path: "/home/u/skills/verify/notes.md" }),
    ).toEqual({
      ls_event_kind: "skill_file_mutation",
      ls_resource_kind: "skill_file",
      ls_file_operation: "edit",
      ls_skill_name: "verify",
    });
  });

  it("gives general file operations plain file metadata", () => {
    expect(classifyToolCall("Read", { file_path: "/src/index.ts" })).toEqual({
      ls_resource_kind: "file",
      ls_file_operation: "read",
    });
    expect(classifyToolCall("Write", { file_path: "/src/index.ts" })).toEqual({
      ls_resource_kind: "file",
      ls_file_operation: "write",
    });
    expect(classifyToolCall("Edit", { file_path: "/src/index.ts" })).toEqual({
      ls_resource_kind: "file",
      ls_file_operation: "edit",
    });
  });

  it("uses segment matching, not substring matching", () => {
    // "skills" appears as a substring but not as a path segment.
    expect(
      classifyToolCall("Read", { file_path: "/src/my-skills-helper/index.ts" }),
    ).toEqual({
      ls_resource_kind: "file",
      ls_file_operation: "read",
    });
  });

  it("ignores a trailing skills directory with no skill under it", () => {
    expect(classifyToolCall("Read", { file_path: "/home/u/skills" })).toEqual({
      ls_resource_kind: "file",
      ls_file_operation: "read",
    });
  });

  it("returns no semantic metadata for unrelated tools", () => {
    expect(classifyToolCall("Bash", { command: "ls" })).toEqual({});
    expect(classifyToolCall("Read", {})).toEqual({});
  });
});
