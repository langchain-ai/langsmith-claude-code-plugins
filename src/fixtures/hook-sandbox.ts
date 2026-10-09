import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { wireRuns, type WireRun } from "./langsmith-wire.js";
import type { FakeLangSmithRules } from "../types.js";

const bundle = fileURLToPath(new URL("../../bundle/dispatch.js", import.meta.url));

const INFO = {
  version: "0.0.0",
  instance_flags: {},
  batch_ingest_config: { use_multipart_endpoint: true, size_limit: 100 },
};

export function fakeLangSmith(rules: FakeLangSmithRules = {}) {
  let server: Server | undefined;
  const seen: WireRun[] = [];
  const service = {
    fail: false,
    delayMs: 0,
    /** Refuse only the requests whose body mentions this, so one run can fail on its own. */
    refuse: "",
    endpoint: "",
    get created() {
      return seen.filter((wire) => wire.action === "post").map((wire) => wire.run);
    },
    get updated() {
      return seen.filter((wire) => wire.action === "patch").map((wire) => wire.run);
    },
    reset() {
      seen.length = 0;
      service.fail = false;
      service.delayMs = 0;
      service.refuse = "";
    },
    async listen() {
      server = createServer((request, response) => {
        const chunks: Buffer[] = [];
        request.on("data", (chunk) => chunks.push(chunk as Buffer));
        request.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const answer = () => {
            response.setHeader("content-type", "application/json");
            if (request.url?.includes("/info")) return response.end(JSON.stringify(INFO));
            // 400, not 500: the SDK retries a 5xx with backoff and slows the test down.
            if (service.fail || (service.refuse && body.includes(service.refuse))) {
              response.writeHead(400);
              return response.end("{}");
            }
            if (rules.rejects?.(body)) {
              response.writeHead(400);
              return response.end("{}");
            }
            for (const wire of wireRuns(request.url ?? "", request.method ?? "POST", body)) {
              const verdict = rules.rejectsRun?.(wire);
              if (verdict === "ignore") continue;
              if (verdict) {
                response.writeHead(verdict.status);
                return response.end(verdict.body ?? "{}");
              }
              seen.push(wire);
            }
            response.writeHead(202);
            response.end("{}");
          };
          if (service.delayMs > 0) setTimeout(answer, service.delayMs);
          else answer();
        });
      });
      await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
      const address = server?.address();
      service.endpoint = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
    },
    close: () => new Promise<void>((resolve) => server?.close(() => resolve())),
  };
  return service;
}

// spawnSync would block this process's event loop, and the fake server lives in it.
export function spawnHook(options: {
  event: string;
  payload: Record<string, unknown>;
  cwd: string;
  env: Record<string, string>;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bundle, options.event], {
      cwd: options.cwd,
      env: options.env,
    });
    let stderr = "";
    child.stderr.setEncoding("utf-8");
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${options.event} exited ${code}: ${stderr}`));
    });
    child.stdin.end(JSON.stringify(options.payload));
  });
}

export function readLog(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

export function turnLines(options: {
  turn: number;
  model: string;
  prompt: string;
  reply: string;
}): string {
  const now = new Date().toISOString();
  const { turn, model, prompt, reply } = options;
  return (
    [
      { type: "user", message: { role: "user", content: prompt } },
      {
        type: "assistant",
        message: {
          id: `m${turn}`,
          role: "assistant",
          model,
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
          content: [{ type: "text", text: reply }],
        },
      },
    ]
      .map((line) => JSON.stringify({ ...line, promptId: `p${turn}`, timestamp: now }))
      .join("\n") + "\n"
  );
}

export { waitFor } from "./wait-for.js";
