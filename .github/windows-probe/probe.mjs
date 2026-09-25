import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const scriptPosix = `${root}/hooks/langsmith-tracing`;
const scriptNative = path.join(root, 'hooks', 'langsmith-tracing');
const bundlePosix = `${root}/bundle/dispatch.js`;

const hookCommand = `"${scriptPosix}" SessionEnd`;
const legacyCommand = `node "${bundlePosix}" SessionEnd`;

const stdinJson = JSON.stringify({
  session_id: 'windows-probe',
  transcript_path: '',
  cwd: root,
  hook_event_name: 'SessionEnd',
  reason: 'other',
});
const stdin = Buffer.from(stdinJson);

const childEnv = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('LANGSMITH_') || key.startsWith('LANGCHAIN_')) continue;
  childEnv[key] = value;
}
childEnv.CLAUDE_PLUGIN_ROOT = root;

const gitBash = [
  'C:\\Program Files\\Git\\bin\\bash.exe',
  'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
].find((candidate) => existsSync(candidate));

const cases = [
  {
    name: 'node spawn shell:true (cmd.exe /d /s /c, what most harnesses do)',
    run: () => spawnSync(hookCommand, { shell: true, input: stdin, env: childEnv }),
  },
  {
    name: 'cmd.exe /d /s /c "<command>"',
    run: () =>
      spawnSync('cmd.exe', ['/d', '/s', '/c', hookCommand], {
        input: stdin,
        env: childEnv,
        windowsVerbatimArguments: true,
      }),
  },
  {
    name: 'PowerShell, the exact command string the harness passes (no & operator)',
    run: () =>
      spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', hookCommand], {
        input: stdin,
        env: childEnv,
      }),
  },
  {
    name: 'PowerShell, friendlier & \'<path>\' form, for comparison only',
    run: () =>
      spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `& '${scriptPosix}' SessionEnd`], {
        input: stdin,
        env: childEnv,
      }),
  },
  {
    name: 'pwsh (PowerShell 7), the exact command string the harness passes',
    run: () =>
      spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', hookCommand], {
        input: stdin,
        env: childEnv,
      }),
  },
  {
    name: 'node spawn shell:false, extensionless file as the executable',
    run: () => spawnSync(scriptNative, ['SessionEnd'], { input: stdin, env: childEnv }),
  },
  {
    name: 'sh -c "<command>" (a POSIX sh found on PATH, if any)',
    run: () => spawnSync('sh', ['-c', hookCommand], { input: stdin, env: childEnv }),
  },
  {
    name: gitBash
      ? `Git Bash -c "<command>" (${gitBash})`
      : 'Git Bash -c "<command>" (no Git Bash found)',
    run: () =>
      gitBash
        ? spawnSync(gitBash, ['-c', hookCommand], { input: stdin, env: childEnv })
        : { error: new Error('no Git Bash on this machine') },
  },
  {
    name: 'CONTROL: the pre-change command, node "<root>/bundle/dispatch.js" SessionEnd, via shell:true',
    run: () => spawnSync(legacyCommand, { shell: true, input: stdin, env: childEnv }),
  },
  {
    name: 'NEGATIVE CONTROL: Git Bash with a bogus root, so a real handover to node must surface a node error',
    run: () =>
      gitBash
        ? spawnSync(gitBash, ['-c', hookCommand], {
            input: stdin,
            env: { ...childEnv, CLAUDE_PLUGIN_ROOT: `${root}/no-such-dir` },
          })
        : { error: new Error('no Git Bash on this machine') },
  },
  {
    name: 'TRACE: Git Bash running the script under sh -x, to show which branch it takes',
    run: () =>
      gitBash
        ? spawnSync(gitBash, ['-c', `sh -x "${scriptPosix}" SessionEnd`], { input: stdin, env: childEnv })
        : { error: new Error('no Git Bash on this machine') },
  },
];

const show = (buffer) => {
  if (!buffer || buffer.length === 0) return '(empty)';
  return buffer.toString('utf8').replace(/\r/g, '<CR>').trimEnd();
};

console.log('==================== ENVIRONMENT ====================');
console.log(`platform        : ${process.platform} ${process.arch}`);
console.log(`node            : ${process.version}`);
console.log(`cwd             : ${root}`);
console.log(`ComSpec         : ${process.env.ComSpec ?? '(unset)'}`);
console.log(`/bin/sh exists  : ${existsSync('/bin/sh')}`);
console.log(`C:\\bin\\sh.exe   : ${existsSync('C:\\bin\\sh.exe')}`);
console.log(`git bash found  : ${gitBash ?? 'none'}`);
console.log(`hook script     : ${scriptNative} (exists: ${existsSync(scriptNative)})`);
console.log(`bundle          : ${bundlePosix} (exists: ${existsSync(bundlePosix)})`);

console.log('');
console.log('==================== LINE ENDINGS AFTER A NORMAL CLONE ====================');
const bytes = readFileSync(scriptNative);
const crlf = bytes.includes(Buffer.from('\r\n'));
console.log(`bytes           : ${bytes.length}`);
console.log(`contains CRLF   : ${crlf}`);
console.log(`first 40 bytes  : ${JSON.stringify(bytes.subarray(0, 40).toString('utf8'))}`);

console.log('');
console.log('==================== INVOCATIONS ====================');
const summary = [];
for (const testCase of cases) {
  let result;
  try {
    result = testCase.run();
  } catch (thrown) {
    result = { error: thrown };
  }
  console.log('');
  console.log(`---------- ${testCase.name} ----------`);
  if (result.error) {
    console.log(`spawn error : ${result.error.code ?? ''} ${result.error.message}`);
    summary.push([testCase.name, `spawn error: ${result.error.code ?? result.error.message}`]);
    continue;
  }
  console.log(`exit code   : ${result.status}`);
  console.log(`signal      : ${result.signal ?? 'none'}`);
  console.log(`stdout      : ${show(result.stdout)}`);
  console.log(`stderr      : ${show(result.stderr)}`);
  summary.push([testCase.name, `exit ${result.status}`]);
}

console.log('');
console.log('==================== SUMMARY ====================');
for (const [name, outcome] of summary) console.log(`${outcome.padEnd(28)} ${name}`);
