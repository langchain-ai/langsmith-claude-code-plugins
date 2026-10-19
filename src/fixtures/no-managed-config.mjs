import { mkdtempSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { syncBuiltinESMExports } from "node:module";

process.env.LS_TEST_ACCOUNT_HOME ??= mkdtempSync(join(os.tmpdir(), "ls-account-home-"));
const userInfo = os.userInfo;
os.userInfo = (...args) => ({ ...userInfo(...args), homedir: process.env.LS_TEST_ACCOUNT_HOME });
syncBuiltinESMExports();
