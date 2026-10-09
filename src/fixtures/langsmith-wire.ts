/**
 * Reading what the LangSmith SDK actually sent.
 *
 * One request can be a plain create, a plain update, a JSON batch, or a
 * multipart batch whose run fields arrive as parts of their own.
 */

export interface WireRun {
  action: "post" | "patch";
  run: Record<string, any>;
}

const asJson = (text: string): Record<string, any> | undefined => {
  try {
    return JSON.parse(text.trim()) as Record<string, any>;
  } catch {
    return undefined;
  }
};

function multipartRuns(body: string): WireRun[] {
  const merged = new Map<string, WireRun>();
  for (const chunk of body.split(/--[-0-9a-zA-Z]{10,}/)) {
    const named = /name="(post|patch)\.([0-9a-fA-F-]+)(?:\.([a-z_]+))?"/.exec(chunk);
    if (!named) continue;
    const opens = chunk.indexOf("{", named.index);
    const value = opens >= 0 ? asJson(chunk.slice(opens)) : undefined;
    if (!value) continue;
    const [, action, id, field] = named;
    const key = `${action}:${id}`;
    // The id lives in the part name, so a part that omits it is still attributed correctly.
    const entry = merged.get(key) ?? { action: action as WireRun["action"], run: { id } };
    // A field such as `extra` or `outputs` travels as its own part, named after it.
    if (field) entry.run[field] = value;
    else Object.assign(entry.run, value);
    merged.set(key, entry);
  }
  return [...merged.values()];
}

export function wireRuns(url: string, method: string, body: string): WireRun[] {
  if (url.includes("/multipart")) return multipartRuns(body);
  const payload = asJson(body);
  if (!payload) return [];
  if (Array.isArray(payload.post) || Array.isArray(payload.patch)) {
    return [
      ...(payload.post ?? []).map((run: Record<string, any>) => ({ action: "post" as const, run })),
      ...(payload.patch ?? []).map((run: Record<string, any>) => ({
        action: "patch" as const,
        run,
      })),
    ];
  }
  // An update names its run in the path rather than the body.
  const fromPath = /\/runs\/([0-9a-fA-F-]{36})/.exec(url)?.[1];
  return [
    {
      action: method === "PATCH" ? "patch" : "post",
      run: { ...payload, id: payload.id ?? fromPath },
    },
  ];
}
