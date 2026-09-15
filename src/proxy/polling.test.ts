import { afterEach, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import { loadConfig, type ProxyConfig } from "./config.js";
import { createProxy } from "./server.js";

vi.mock("./config.js", async (original) => ({
  ...(await original<typeof import("./config.js")>()),
  loadConfig: vi.fn(),
}));
vi.mock("./server.js", async (original) => ({
  ...(await original<typeof import("./server.js")>()),
  createProxy: vi.fn(),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

it.each(["apiUrl", "gatewayUrl", "useClaudeSubscription", "disabled", "invalid"])(
  "daemon polling drains on %s changes without any network or CLI",
  async (change) => {
    const config: ProxyConfig = {
      enabled: true,
      useClaudeSubscription: true,
      cli: "/fake/cli",
      profile: "preview",
      port: 52507,
      secret: "a".repeat(64),
      apiUrl: "https://api.preview.test",
      gatewayUrl: "https://gateway.preview.test",
    };
    const drain = vi.fn();
    const server = Object.assign(new EventEmitter(), { listen: vi.fn() });
    vi.mocked(createProxy).mockReturnValue({ server, drain } as unknown as ReturnType<
      typeof createProxy
    >);
    vi.mocked(loadConfig).mockReturnValue(config);
    const argv = process.argv;
    vi.spyOn(process, "on").mockReturnValue(process);
    vi.useFakeTimers();
    try {
      process.argv = [process.execPath, "/fake/gateway.js", "daemon"];
      await import("../hooks/gateway.js");
      expect(server.listen).toHaveBeenCalledExactlyOnceWith({
        host: "127.0.0.1",
        port: config.port,
        exclusive: true,
      });
      // Equivalent normalized endpoint spelling must not invalidate the daemon.
      vi.mocked(loadConfig).mockReturnValue({ ...config, apiUrl: "https://API.preview.test:443/" });
      await vi.advanceTimersByTimeAsync(5000);
      expect(drain).not.toHaveBeenCalled();
      if (change === "disabled") vi.mocked(loadConfig).mockReturnValue(undefined);
      else if (change === "invalid")
        vi.mocked(loadConfig).mockImplementation(() => {
          throw new Error("Invalid proxy configuration");
        });
      else
        vi.mocked(loadConfig).mockReturnValue({
          ...config,
          [change]: change === "useClaudeSubscription" ? false : "https://other.preview.test",
        });
      await vi.advanceTimersByTimeAsync(5000);
      expect(drain).toHaveBeenCalledTimes(1);
      server.emit("close");
      await vi.advanceTimersByTimeAsync(5000);
      expect(drain).toHaveBeenCalledTimes(1);
    } finally {
      process.argv = argv;
      server.emit("close");
    }
  },
);
