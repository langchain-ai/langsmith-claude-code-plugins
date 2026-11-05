import { basename } from "node:path";

type CodeInput = { language: "shell" | "python" | "javascript"; code: string };

function shellWords(command: string): string[] | undefined {
  const words: string[] = [];
  let word = "";
  let quote = "";
  let started = false;
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    if (char === "\\" && quote !== "'") {
      const next = command[++i];
      if (next === undefined) return;
      if (next === "\n") continue;
      word += quote === '"' && !'$`"\\'.includes(next) ? `\\${next}` : next;
      started = true;
    } else if (quote) {
      if (char === quote) quote = "";
      else {
        if (quote === '"' && "$`".includes(char)) return;
        word += char;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (char === "\n" && (started || words.length > 0)) return;
      if (started) words.push(word);
      word = "";
      started = false;
    } else {
      if (";&|<>()$`#*?[]{}~".includes(char)) return;
      word += char;
      started = true;
    }
  }
  if (quote) return;
  if (started) words.push(word);
  return words;
}

function inlineCode(words: string[], depth: number): CodeInput | undefined {
  if (depth > 4) return;
  while (/^[A-Za-z_][A-Za-z_0-9]*=/.test(words[0] ?? "")) words = words.slice(1);
  const executable = basename(words[0] ?? "");
  if (executable === "env" || executable === "command") {
    const offset = words[1] === "--" ? 2 : 1;
    return inlineCode(words.slice(offset), depth + 1);
  }
  if (executable === "uv" && words[1] === "run") {
    return inlineCode(words.slice(words[2] === "--" ? 3 : 2), depth + 1);
  }
  const python = /^python(?:\d+(?:\.\d+)*)?$/.test(executable);
  const node = /^(?:node|nodejs)$/.test(executable);
  const shell = /^(?:bash|sh|zsh|dash)$/.test(executable);
  if (!python && !node && !shell) return;
  for (let i = 1; i < words.length; i++) {
    const flag = words[i];
    if (flag === "--" || !flag.startsWith("-")) return;
    if (python && flag === "-c") {
      return words[i + 1] === undefined ? undefined : { language: "python", code: words[i + 1] };
    }
    if (node && (flag === "-e" || flag === "--eval" || flag === "-p" || flag === "--print")) {
      return words[i + 1] === undefined
        ? undefined
        : { language: "javascript", code: words[i + 1] };
    }
    if (node && /^(?:--eval|--print)=/.test(flag)) {
      return { language: "javascript", code: flag.slice(flag.indexOf("=") + 1) };
    }
    if (node && /^-[ep].+/.test(flag)) return { language: "javascript", code: flag.slice(2) };
    if (shell && /^-[a-z]*c[a-z]*$/.test(flag)) {
      const commandIndex = words[i + 1] === "--" ? i + 2 : i + 1;
      const command = words[commandIndex];
      if (command === undefined || words.length !== commandIndex + 1) return;
      return detectShellCode(command, depth + 1);
    }
    if (python && /^-[BIuOqEsSvb]+$/.test(flag)) continue;
    if (node && (flag.startsWith("--input-type=") || flag === "--no-warnings")) continue;
    if (node && flag === "--input-type") {
      i++;
      continue;
    }
    if (shell && /^-[lxeu]+$/.test(flag)) continue;
    return;
  }
}

export function detectShellCode(command: string, depth = 0): CodeInput {
  const words = shellWords(command);
  return (words && inlineCode(words, depth)) ?? { language: "shell", code: command };
}
