export const jsonBytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value) ?? "");
