export function noManagedConfigEnv(): Record<string, string> {
  return {
    NODE_OPTIONS: process.env.NODE_OPTIONS ?? "",
    LS_TEST_ACCOUNT_HOME: process.env.LS_TEST_ACCOUNT_HOME ?? "",
  };
}
