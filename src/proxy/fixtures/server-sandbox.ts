import { afterEach } from "vitest";
import type http from "node:http";
import { once } from "node:events";

export const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const f of cleanup.splice(0).reverse()) f();
});
export async function listen(server: http.Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  cleanup.push(() => {
    server.closeAllConnections();
    server.close();
  });
  return (server.address() as { port: number }).port;
}
