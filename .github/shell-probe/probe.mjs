// THROWAWAY TEST FILE. Not for merging.
// Builds fake plugin roots and tries every plausible hook invocation.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, chmodSync, copyFileSync } from 'node:fs';
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

  // the real extensionless sh script, verbatim
  copyFileSync(path.join(repo, 'hooks', 'langsmith-tracing'), path.join(root, 'hooks', 'langsmith-tracing'));
  chmodSync(path.join(root, 'hooks', 'langsmith-tracing'), 0o755);

  // stub node fallback
  writeFileSync(
    path.join(root, 'bundle', 'dispatch.js'),
    'console.log("HIT dispatch argv=" + process.argv.slice(2).join(","));\n',
  );

  // stub compiled mac binaries
  for (const target of ['darwin-arm64', 'darwin-x64']) {
    const p = path.join(root, 'binary', `langsmith-claude-code-tracing-${target}`);
    writeFileSync(p, `#!/bin/sh\necho "HIT binary-${target} argv=$*"\n`);
    chmodSync(p, 0o755);
  }

  // windows-shaped siblings
  writeFileSync(
    path.join(root, 'hooks', 'langsmith-tracing.cmd'),
    '@echo off\r\necho HIT cmdshim argv=%*\r\n',
  );
  writeFileSync(
    path.join(root, 'hooks', 'langsmith-tracing.bat'),
    '@echo off\r\necho HIT batshim argv=%*\r\n',
  );
  writeFileSync(
    path.join(root, 'hooks', 'langsmith-tracing.ps1'),
    'Write-Output "HIT ps1shim argv=$args"\r\n',
  );
  return root;
}

const roots = {
  plain: buildRoot('probe-plain'),
  spaced: buildRoot('probe root with space'),
};

const env = {};
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('LANGSMITH_') || k.startsWith('LANGCHAIN_') || k.includes('TOKEN') || k.includes('KEY')) continue;
  env[k] = v;
}

const stdin = Buffer.from(
  JSON.stringify({ session_id: 'probe', transcript_path: '', cwd: repo, hook_event_name: 'SessionEnd' }),
);

// candidate hook command strings, as a function of the expanded plugin root
const candidates = [
  ['01 baseline quoted', (p) => `"${p}/hooks/langsmith-tracing" SessionEnd`],
  ['02 unquoted fwd slash', (p) => `${p}/hooks/langsmith-tracing SessionEnd`],
  ['03 ampersand quoted', (p) => `& "${p}/hooks/langsmith-tracing" SessionEnd`],
  ['04 sh prefix', (p) => `sh "${p}/hooks/langsmith-tracing" SessionEnd`],
  ['05 control node', (p) => `node "${p}/bundle/dispatch.js" SessionEnd`],
  ['06 cmd shim quoted', (p) => `"${p}/hooks/langsmith-tracing.cmd" SessionEnd`],
  ['07 cmd shim unquoted', (p) => `${p}/hooks/langsmith-tracing.cmd SessionEnd`],
  ['08 dot source', (p) => `. "${p}/hooks/langsmith-tracing" SessionEnd`],
  ['09 abs bin sh', (p) => `/bin/sh "${p}/hooks/langsmith-tracing" SessionEnd`],
  ['10 env prefix', (p) => `env "${p}/hooks/langsmith-tracing" SessionEnd`],
  ['11 exec prefix', (p) => `exec "${p}/hooks/langsmith-tracing" SessionEnd`],
  ['12 command prefix', (p) => `command "${p}/hooks/langsmith-tracing" SessionEnd`],
  ['13 sh -c nested', (p) => `sh -c '"${p}/hooks/langsmith-tracing" SessionEnd'`],
  [
    '14 two line polyglot exec then node',
    (p) => `exec "${p}/hooks/langsmith-tracing" SessionEnd\nnode "${p}/bundle/dispatch.js" SessionEnd`,
  ],
  [
    '15 two line polyglot exec then amp shim',
    (p) => `exec "${p}/hooks/langsmith-tracing" SessionEnd\n& "${p}/hooks/langsmith-tracing.cmd" SessionEnd`,
  ],
  ['16 ampersand cmd shim', (p) => `& "${p}/hooks/langsmith-tracing.cmd" SessionEnd`],
];

function shells() {
  if (isWindows) {
    const gitBash = ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe'].find((c) =>
      existsSync(c),
    );
    return [
      ['powershell', (cmd) => spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { input: stdin, env, encoding: 'utf8' })],
      ['pwsh', (cmd) => spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', cmd], { input: stdin, env, encoding: 'utf8' })],
      ['cmd.exe', (cmd) => spawnSync('cmd.exe', ['/d', '/s', '/c', cmd], { input: stdin, env, encoding: 'utf8' })],
      ['gitbash', (cmd) => (gitBash ? spawnSync(gitBash, ['-c', cmd], { input: stdin, env, encoding: 'utf8' }) : { error: new Error('no git bash') })],
    ];
  }
  return [
    ['sh', (cmd) => spawnSync('/bin/sh', ['-c', cmd], { input: stdin, env, encoding: 'utf8' })],
    ['bash', (cmd) => spawnSync('/bin/bash', ['-c', cmd], { input: stdin, env, encoding: 'utf8' })],
    ['zsh', (cmd) => spawnSync('/bin/zsh', ['-c', cmd], { input: stdin, env, encoding: 'utf8' })],
  ];
}

function show(res) {
  if (res.error) return `ERROR ${res.error.message}`;
  const out = (res.stdout || '').trim().replace(/\s+/g, ' ').slice(0, 200);
  const err = (res.stderr || '').trim().replace(/\s+/g, ' ').slice(0, 200);
  return `exit=${res.status} out=[${out}] err=[${err}]`;
}

console.log(`### PLATFORM ${process.platform} ${process.arch}`);
console.log(`### roots plain=${roots.plain} spaced=${roots.spaced}`);

console.log('\n================ SHELL FORM ================');
for (const [rootLabel, root] of Object.entries(roots)) {
  const posix = root.split(path.sep).join('/');
  for (const [name, make] of candidates) {
    const cmd = make(posix);
    for (const [shellName, run] of shells()) {
      const res = run(cmd);
      console.log(`[${rootLabel}] [${shellName}] ${name} :: ${show(res)}`);
    }
  }
  console.log('');
}

console.log('\n================ EXEC FORM, direct spawn no shell ================');
for (const [rootLabel, root] of Object.entries(roots)) {
  const posix = root.split(path.sep).join('/');
  const native = path.join(root, 'hooks', 'langsmith-tracing');
  const targets = [
    ['extensionless posix slashes', `${posix}/hooks/langsmith-tracing`],
    ['extensionless native slashes', native],
    ['explicit .cmd posix slashes', `${posix}/hooks/langsmith-tracing.cmd`],
    ['explicit .cmd native slashes', native + '.cmd'],
  ];
  for (const [label, target] of targets) {
    const res = spawnSync(target, ['SessionEnd'], { input: stdin, env, encoding: 'utf8' });
    console.log(`[${rootLabel}] [spawn shell=false] ${label} :: ${show(res)}`);
  }
  // does PATHEXT resolution find a sibling .cmd for an extensionless request
  const res2 = spawnSync(`${posix}/hooks/langsmith-tracing`, ['SessionEnd'], { input: stdin, env, encoding: 'utf8', shell: false });
  console.log(`[${rootLabel}] [pathext check] extensionless -> sibling .cmd? :: ${show(res2)}`);
  console.log('');
}
