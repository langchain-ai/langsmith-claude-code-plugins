export function withoutEnvVariables<T>(names: readonly string[], run: () => T): T {
  const hidden = names.flatMap((name) => {
    const value = process.env[name];
    return value === undefined ? [] : [[name, value] as const];
  });
  for (const [name] of hidden) delete process.env[name];
  try {
    return run();
  } finally {
    for (const [name, value] of hidden) process.env[name] = value;
  }
}
