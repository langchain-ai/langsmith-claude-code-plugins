// THROWAWAY TEST FILE. Not for merging.
// Round four. Variable expansion done BY THE SHELL, braced vs unbraced, which is the
// workaround suggested on anthropics/claude-code#70150.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, chmodSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const tmp = process.env.RUNNER_TEMP || process.env.TMPDIR || '/tmp';
const repo = process.cwd();

function buildRoot(label) {
  const root = path.join(tmp, label, 'plugin');
  mkdirSync(path.join(root, 'hooks'), { recursive: true });
  mkdirSync(path.join(root, 'bundle'), { recursive: true });
  copyFileSync(path.join(repo, 'hooks', 'langsmith-tracing'), path.join(root, 'hooks', 'langsmith-tracing'));
  chmodSync(path.join(root, 'hooks', 'langsmith-tracing'), 0o755);
  writeFileSync(
    path.join(root, 'bundle', 'dispatch.js'),
    'console.log("HIT dispatch argv=" + process.argv.slice(2).join(","));\n',
  );
  return root;
}

const root = buildRoot('r4 root with space');
const baseEnv = {};
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('LANGSMITH_') || k.startsWith('LANGCHAIN_') || k.includes('TOKEN') || k.includes('KEY')) continue;
  baseEnv[k] = v;
}
// the harness exports the root as a real environment variable, native separators
const env = { ...baseEnv, CLAUDE_PLUGIN_ROOT: root, PLUGIN_ROOT: root, CURSOR_PLUGIN_ROOT: root };
const stdin = Buffer.from(JSON.stringify({ hook_event_name: 'SessionEnd' }));

function show(res) {
  if (res.error) return `ERROR ${res.error.message}`;
  const out = (res.stdout || '').trim().replace(/\s+/g, ' ').slice(0, 130);
  const err = (res.stderr || '').trim().replace(/\s+/g, ' ').slice(0, 130);
  return `exit=${res.status} out=[${out}] err=[${err}]`;
}

function shells() {
  if (isWindows) {
    const gitBash = ['C:\\Program Files\\Git\\bin\\bash.exe'].find((c) => existsSync(c));
    return [
      ['powershell', (c) => spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', c], { input: stdin, env, encoding: 'utf8' })],
      ['gitbash', (c) => (gitBash ? spawnSync(gitBash, ['-c', c], { input: stdin, env, encoding: 'utf8' }) : { error: new Error('none') })],
    ];
  }
  return [['sh', (c) => spawnSync('/bin/sh', ['-c', c], { input: stdin, env, encoding: 'utf8' })]];
}

// the shell itself expands the variable here, nothing is pre-substituted
const cases = [
  ['unbraced, single line', 'exec "$CLAUDE_PLUGIN_ROOT/hooks/langsmith-tracing" SessionEnd'],
  [
    'unbraced, polyglot',
    'exec "$CLAUDE_PLUGIN_ROOT/hooks/langsmith-tracing" SessionEnd\nnode "$CLAUDE_PLUGIN_ROOT/bundle/dispatch.js" SessionEnd',
  ],
  [
    'powershell native env, polyglot',
    'exec "$CLAUDE_PLUGIN_ROOT/hooks/langsmith-tracing" SessionEnd\nnode "$env:CLAUDE_PLUGIN_ROOT/bundle/dispatch.js" SessionEnd',
  ],
  ['baseline quoted, unbraced', '"$CLAUDE_PLUGIN_ROOT/hooks/langsmith-tracing" SessionEnd'],
];

console.log(`### PLATFORM ${process.platform}  root=${root}`);
for (const [name, cmd] of cases) {
  for (const [sname, run] of shells()) {
    console.log(`[${sname}] ${name} :: ${show(run(cmd))}`);
  }
}
