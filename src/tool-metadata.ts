/**
 * Derives normalized, queryable metadata for a tool run from its name and
 * structured inputs. These keys are additive — raw inputs are left untouched
 * for debugging and backwards compatibility.
 */

export interface ToolSemanticMetadata {
  ls_event_kind?: "skill_load" | "skill_file_access" | "skill_file_mutation";
  ls_resource_kind?: "skill" | "skill_file" | "file";
  ls_file_operation?: "read" | "write" | "edit";
  ls_skill_name?: string;
  ls_skill_detection?: "explicit" | "inferred";
}

const FILE_OPERATION: Record<string, "read" | "write" | "edit"> = {
  Read: "read",
  Write: "write",
  Edit: "edit",
  NotebookEdit: "edit",
};

function getFilePath(input: Record<string, unknown>): string | undefined {
  for (const key of ["file_path", "notebook_path"]) {
    const value = input[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

interface SkillPathMatch {
  skillName: string;
  relativeSegments: string[];
}

// Match `.../skills/<skill>/...` by path segments, so arbitrary paths merely
// containing the word "skill" are not misclassified.
function matchSkillPath(path: string): SkillPathMatch | undefined {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  const idx = segments.indexOf("skills");
  if (idx === -1) return undefined;

  const skillName = segments[idx + 1];
  const relativeSegments = segments.slice(idx + 2);
  if (!skillName || relativeSegments.length === 0) return undefined;

  return { skillName, relativeSegments };
}

export function classifyToolCall(
  toolName: string,
  input: Record<string, unknown> | undefined,
): ToolSemanticMetadata {
  const safeInput = input ?? {};

  if (toolName === "Skill") {
    const skill = safeInput.skill;
    return {
      ls_event_kind: "skill_load",
      ls_resource_kind: "skill",
      ls_skill_detection: "explicit",
      ...(typeof skill === "string" && skill.length > 0 ? { ls_skill_name: skill } : {}),
    };
  }

  const fileOperation = FILE_OPERATION[toolName];
  if (!fileOperation) return {};

  const path = getFilePath(safeInput);
  if (!path) return {};

  const skillPath = matchSkillPath(path);
  if (!skillPath) {
    return { ls_resource_kind: "file", ls_file_operation: fileOperation };
  }

  const { skillName, relativeSegments } = skillPath;

  if (fileOperation === "read") {
    const isManifest = relativeSegments.length === 1 && relativeSegments[0] === "SKILL.md";
    if (isManifest) {
      return {
        ls_event_kind: "skill_load",
        ls_resource_kind: "skill",
        ls_file_operation: "read",
        ls_skill_name: skillName,
        ls_skill_detection: "inferred",
      };
    }
    return {
      ls_event_kind: "skill_file_access",
      ls_resource_kind: "skill_file",
      ls_file_operation: "read",
      ls_skill_name: skillName,
    };
  }

  return {
    ls_event_kind: "skill_file_mutation",
    ls_resource_kind: "skill_file",
    ls_file_operation: fileOperation,
    ls_skill_name: skillName,
  };
}
