import { fileURLToPath } from "node:url";
import "./no-managed-config.mjs";

const preloadUrl = new URL("./no-managed-config.mjs", import.meta.url);
const preload = process.platform === "win32" ? preloadUrl.href : fileURLToPath(preloadUrl);
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, `--import=${preload}`]
  .filter(Boolean)
  .join(" ");
