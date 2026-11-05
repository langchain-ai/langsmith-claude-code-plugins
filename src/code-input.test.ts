import { describe, expect, it } from "vitest";
import { detectShellCode } from "./code-input.js";

describe("detectShellCode", () => {
  it.each([
    ["python -c 'print(1)'", "python", "print(1)"],
    ["bash -c 'echo hello'", "shell", "echo hello"],
    ["/usr/bin/python3.14 -I -c 'print(\"hi\")' -- arg", "python", 'print("hi")'],
    ["FOO=bar env -- python3 -u -c 'print(1)'", "python", "print(1)"],
    ["uv run -- python -c 'print(1)'", "python", "print(1)"],
    ["node -e 'console.log(1)' -- arg", "javascript", "console.log(1)"],
    ["node --eval='console.log(1)'", "javascript", "console.log(1)"],
    ["node --input-type module -p '1 + 2'", "javascript", "1 + 2"],
    ["node -e'console.log(1)'", "javascript", "console.log(1)"],
    ["bash -lc \"python -c 'print(1)'\"", "python", "print(1)"],
    ["bash -c -- \"node --eval 'console.log(1)'\"", "javascript", "console.log(1)"],
    ["python -c 'print(1)\nprint(2)'", "python", "print(1)\nprint(2)"],
    ['node -e "console.log(\\\"hi\\\")"', "javascript", 'console.log("hi")'],
    ['python -c "print(\\\"\\\\n\\\")"', "python", 'print("\\n")'],
  ])("extracts inline code from %s", (command, language, code) => {
    expect(detectShellCode(command)).toEqual({ language, code });
  });

  it.each([
    "ls -la",
    "python script.py",
    "python -- -c 'not code'",
    "node -- -e 'not code'",
    "python -m module -c 'not code'",
    "node --require module -e 'console.log(1)'",
    "echo node -e 'not code'",
    "node -e 'console.log(1)' && echo done",
    "node -e 'console.log(1)' ; echo done",
    "python -c 'print(1)' | cat",
    "python -c 'print(1)' > output.txt",
    'node -e "$CODE"',
    "node -e $(cat file)",
    "python <<'PY'\nprint(1)\nPY",
    "python -c 'unfinished",
    "python -c",
    "bash -c 'python -c \"print(1)\"' extra",
    "python -c 'print(1)'\n echo done",
  ])("keeps ambiguous or non-inline commands as shell: %s", (command) => {
    expect(detectShellCode(command)).toEqual({ language: "shell", code: command });
  });
});
