// THROWAWAY TEST FILE. Not for merging.
// Round three. Backslash paths, which is what Claude Code actually substitutes on Windows.
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
  writeFileSync(path.join(root, 'hooks', 'langsmith-tracing.cmd'), '@echo off\r\necho HIT cmdshim argv=%*\r\n');
  return root;
}

const roots = { plain: buildRoot('r3-plain'), spaced: buildRoot('r3 root with space') };
const env = {};
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('LANGSMITH_') || k.startsWith('LANGCHAIN_') || k.includes('TOKEN') || k.includes('KEY')) continue;
  env[k] = v;
}
const stdin = Buffer.from(JSON.stringify({ hook_event_name: 'SessionEnd' }));

function show(res) {
  if (res.error) return `ERROR ${res.error.message}`;
  const out = (res.stdout || '').trim().replace(/\s+/g, ' ').slice(0, 150);
  const err = (res.stderr || '').trim().replace(/\s+/g, ' ').slice(0, 150);
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

const variants = [
  ['c01 quoted', (p) => `"${p}/hooks/langsmith-tracing" SessionEnd`],
  ['c14 polyglot', (p) => `exec "${p}/hooks/langsmith-tracing" SessionEnd\nnode "${p}/bundle/dispatch.js" SessionEnd`],
  ['c05 node control', (p) => `node "${p}/bundle/dispatch.js" SessionEnd`],
  ['unquoted, the mangling case', (p) => `${p}/hooks/langsmith-tracing SessionEnd`],
];

for (const [label, root] of Object.entries(roots)) {
  // NATIVE separators. On Windows this is the backslash path Claude Code substitutes.
  const native = root;
  const fwd = root.split(path.sep).join('/');
  for (const [slashLabel, p] of [['BACKSLASH', native], ['forwardslash', fwd]]) {
    for (const [vname, make] of variants) {
      const cmd = make(p).split('/').join(path.sep === '\\' && slashLabel === 'BACKSLASH' ? '\\' : '/');
      for (const [sname, run] of shells()) {
        console.log(`[${label}] [${slashLabel}] [${sname}] ${vname} :: ${show(run(cmd))}`);
      }
    }
  }
}
