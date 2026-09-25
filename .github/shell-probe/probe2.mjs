// THROWAWAY TEST FILE. Not for merging.
// Round two. Does exec form find a sibling .exe, and is candidate 14 solid.
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
  mkdirSync(path.join(root, 'binary'), { recursive: true });
  copyFileSync(path.join(repo, 'hooks', 'langsmith-tracing'), path.join(root, 'hooks', 'langsmith-tracing'));
  chmodSync(path.join(root, 'hooks', 'langsmith-tracing'), 0o755);
  writeFileSync(
    path.join(root, 'bundle', 'dispatch.js'),
    'console.log("HIT dispatch argv=" + process.argv.slice(2).join(","));\n',
  );
  for (const target of ['darwin-arm64', 'darwin-x64']) {
    const p = path.join(root, 'binary', `langsmith-claude-code-tracing-${target}`);
    writeFileSync(p, `#!/bin/sh\necho "HIT binary-${target} argv=$*"\n`);
    chmodSync(p, 0o755);
  }
  writeFileSync(path.join(root, 'hooks', 'langsmith-tracing.cmd'), '@echo off\r\necho HIT cmdshim argv=%*\r\n');
  // a REAL windows executable sitting next to the extensionless script
  if (isWindows) {
    const nodeExe = process.execPath;
    copyFileSync(nodeExe, path.join(root, 'hooks', 'langsmith-tracing.exe'));
  }
  return root;
}

const roots = { plain: buildRoot('r2-plain'), spaced: buildRoot('r2 root with space') };
const env = {};
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('LANGSMITH_') || k.startsWith('LANGCHAIN_') || k.includes('TOKEN') || k.includes('KEY')) continue;
  env[k] = v;
}
const stdin = Buffer.from(JSON.stringify({ hook_event_name: 'SessionEnd' }));

function show(res) {
  if (res.error) return `ERROR ${res.error.message}`;
  const out = (res.stdout || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  const err = (res.stderr || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  return `exit=${res.status} out=[${out}] err=[${err}]`;
}

console.log(`### PLATFORM ${process.platform} ${process.arch}`);

console.log('\n=== EXEC FORM: does a bare extensionless command resolve to a sibling .exe ===');
for (const [label, root] of Object.entries(roots)) {
  const posix = root.split(path.sep).join('/');
  const targets = [
    ['extensionless, posix slashes', `${posix}/hooks/langsmith-tracing`],
    ['extensionless, native slashes', path.join(root, 'hooks', 'langsmith-tracing')],
  ];
  for (const [name, target] of targets) {
    // -e so the copied node.exe proves it was the thing that ran
    const args = isWindows ? ['-e', 'console.log("HIT exe argv=" + process.argv.slice(1).join(","))', 'SessionEnd'] : ['SessionEnd'];
    const res = spawnSync(target, args, { input: stdin, env, encoding: 'utf8' });
    console.log(`[${label}] ${name} :: ${show(res)}`);
  }
  if (isWindows) {
    const explicit = path.join(root, 'hooks', 'langsmith-tracing.exe');
    const res = spawnSync(explicit, ['-e', 'console.log("HIT exe explicit")'], { input: stdin, env, encoding: 'utf8' });
    console.log(`[${label}] explicit .exe :: ${show(res)}`);
  }
}

console.log('\n=== CANDIDATE 14, the two line polyglot, full matrix ===');
const c14 = (p) => `exec "${p}/hooks/langsmith-tracing" SessionEnd\nnode "${p}/bundle/dispatch.js" SessionEnd`;
const c01 = (p) => `"${p}/hooks/langsmith-tracing" SessionEnd`;

function shells() {
  if (isWindows) {
    const gitBash = ['C:\\Program Files\\Git\\bin\\bash.exe'].find((c) => existsSync(c));
    return [
      ['powershell', (c) => spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', c], { input: stdin, env, encoding: 'utf8' })],
      ['pwsh', (c) => spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', c], { input: stdin, env, encoding: 'utf8' })],
      ['gitbash', (c) => (gitBash ? spawnSync(gitBash, ['-c', c], { input: stdin, env, encoding: 'utf8' }) : { error: new Error('none') })],
    ];
  }
  return [
    ['sh', (c) => spawnSync('/bin/sh', ['-c', c], { input: stdin, env, encoding: 'utf8' })],
    ['bash', (c) => spawnSync('/bin/bash', ['-c', c], { input: stdin, env, encoding: 'utf8' })],
    ['zsh', (c) => spawnSync('/bin/zsh', ['-c', c], { input: stdin, env, encoding: 'utf8' })],
  ];
}

for (const [label, root] of Object.entries(roots)) {
  const posix = root.split(path.sep).join('/');
  for (const [cname, make] of [['c01 baseline', c01], ['c14 polyglot', c14]]) {
    for (const [sname, run] of shells()) {
      console.log(`[${label}] [${sname}] ${cname} :: ${show(run(make(posix)))}`);
    }
  }
}

console.log('\n=== CANDIDATE 14 when the script is missing, does it double run ===');
for (const [label, root] of Object.entries(roots)) {
  const posix = root.split(path.sep).join('/');
  const broken = `exec "${posix}/hooks/does-not-exist" SessionEnd\nnode "${posix}/bundle/dispatch.js" SessionEnd`;
  for (const [sname, run] of shells()) {
    console.log(`[${label}] [${sname}] broken first line :: ${show(run(broken))}`);
  }
}
