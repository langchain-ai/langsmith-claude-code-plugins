import { WINDOWS_PROCESS_VARIABLES } from "./process-constants.js";

export function withWindowsProcessEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const required = Object.fromEntries(
    Object.entries(process.env).filter(([name]) =>
      WINDOWS_PROCESS_VARIABLES.has(name.toLowerCase()),
    ),
  );
  return { ...required, ...environment };
}
