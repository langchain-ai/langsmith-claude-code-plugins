#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/address.mjs
function ensureAddress(value) {
  if (value == null)
    return void 0;
  if (typeof value !== "object") {
    throw new Error("address must be an AgentAddress, ExperimentAddress or EvaluatorAddress object.");
  }
  const { kind, id, environment } = value;
  if (kind === "EVALUATOR")
    return { kind };
  if (kind === "EXPERIMENT") {
    if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
      throw new Error(`Experiment id must be a UUID, got ${JSON.stringify(id)}.`);
    }
    return { kind, id: id.toLowerCase() };
  }
  if (kind !== "AGENT") {
    throw new Error("address must be an AgentAddress, ExperimentAddress or EvaluatorAddress object.");
  }
  if (typeof id !== "string" || !AGENT_ID_PATTERN.test(id)) {
    throw new Error(`Address agent id must be 1 to 63 lowercase ASCII letters, digits, or hyphens, start with a letter, and end with a letter or digit, got ${JSON.stringify(id)}. Use an id such as "support-agent".`);
  }
  const normalized = typeof environment === "string" ? environment.toLowerCase() : void 0;
  if (normalized === void 0 || !ENVIRONMENTS.includes(normalized)) {
    throw new Error(`Address environment must be one of ${ENVIRONMENTS.join(", ")}, got ${JSON.stringify(environment)}.`);
  }
  return {
    kind,
    id,
    environment: normalized.toUpperCase()
  };
}
function ensureAgent(value) {
  const address = ensureAddress(value);
  if (address && address.kind !== "AGENT") {
    throw new Error(`Only an AgentAddress can receive traces, got ${address.kind}.`);
  }
  return address;
}
function addressToLrn(address) {
  return `lrn:agents/${address.id}/environments/${address.environment.toLowerCase()}`;
}
function addressFromLrn(value) {
  const match = typeof value === "string" ? LRN_PATTERN.exec(value) : null;
  if (!match)
    throw new Error("Not an agent address.");
  return ensureAgent({ kind: "AGENT", id: match[1], environment: match[2] });
}
function addressFromEnv() {
  const values = ENV_NAMES.map((name) => getEnvironmentVariable(name));
  if (!values.some(Boolean))
    return void 0;
  try {
    const missing = ENV_NAMES.filter((_, i) => !values[i]);
    if (missing.length)
      throw new Error(`An address needs ${missing.join(" and ")} as well.`);
    return ensureAgent({
      kind: "AGENT",
      id: values[0],
      environment: values[1]
    });
  } catch (e) {
    throw new EnvAddressError(`The LANGSMITH_AGENT_* env vars can't address a run: ${e.message}`);
  }
}
function envNames() {
  return ENV_NAMES;
}
var UUID_PATTERN, AGENT_ID_PATTERN, ENVIRONMENTS, LRN_PATTERN, ENV_NAMES, EnvAddressError;
var init_address = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/address.mjs"() {
    init_env3();
    UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    AGENT_ID_PATTERN = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;
    ENVIRONMENTS = ["local", "development", "staging", "production"];
    LRN_PATTERN = /^lrn:agents\/([^/]+)\/environments\/([^/]+)$/;
    ENV_NAMES = ["LANGSMITH_AGENT_ID", "LANGSMITH_AGENT_ENVIRONMENT"];
    EnvAddressError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "EnvAddressError";
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/max.mjs
var init_max = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/max.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/nil.mjs
var init_nil = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/nil.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/regex.mjs
var regex_default;
var init_regex = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/regex.mjs"() {
    regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/validate.mjs
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default;
var init_validate = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/validate.mjs"() {
    init_regex();
    validate_default = validate;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/parse.mjs
function parse(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  let v;
  return Uint8Array.of(
    (v = parseInt(uuid.slice(0, 8), 16)) >>> 24,
    v >>> 16 & 255,
    v >>> 8 & 255,
    v & 255,
    // Parse ........-####-....-....-............
    (v = parseInt(uuid.slice(9, 13), 16)) >>> 8,
    v & 255,
    // Parse ........-....-####-....-............
    (v = parseInt(uuid.slice(14, 18), 16)) >>> 8,
    v & 255,
    // Parse ........-....-....-####-............
    (v = parseInt(uuid.slice(19, 23), 16)) >>> 8,
    v & 255,
    // Parse ........-....-....-....-############
    // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
    (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255,
    v / 4294967296 & 255,
    v >>> 24 & 255,
    v >>> 16 & 255,
    v >>> 8 & 255,
    v & 255
  );
}
var parse_default;
var init_parse = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/parse.mjs"() {
    init_validate();
    parse_default = parse;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/stringify.mjs
function unsafeStringify(arr2, offset = 0) {
  return (byteToHex[arr2[offset + 0]] + byteToHex[arr2[offset + 1]] + byteToHex[arr2[offset + 2]] + byteToHex[arr2[offset + 3]] + "-" + byteToHex[arr2[offset + 4]] + byteToHex[arr2[offset + 5]] + "-" + byteToHex[arr2[offset + 6]] + byteToHex[arr2[offset + 7]] + "-" + byteToHex[arr2[offset + 8]] + byteToHex[arr2[offset + 9]] + "-" + byteToHex[arr2[offset + 10]] + byteToHex[arr2[offset + 11]] + byteToHex[arr2[offset + 12]] + byteToHex[arr2[offset + 13]] + byteToHex[arr2[offset + 14]] + byteToHex[arr2[offset + 15]]).toLowerCase();
}
var byteToHex;
var init_stringify = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/stringify.mjs"() {
    init_validate();
    byteToHex = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 256).toString(16).slice(1));
    }
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/rng.mjs
function rng() {
  return crypto.getRandomValues(rnds8);
}
var rnds8;
var init_rng = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/rng.mjs"() {
    rnds8 = new Uint8Array(16);
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v4.mjs
function v4(options, buf, offset) {
  if (!buf && !options && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return _v4(options, buf, offset);
}
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default;
var init_v4 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v4.mjs"() {
    init_rng();
    init_stringify();
    v4_default = v4;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/sha1.mjs
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;
    case 1:
      return x ^ y ^ z;
    case 2:
      return x & y ^ x & z ^ y & z;
    case 3:
      return x ^ y ^ z;
  }
}
function ROTL(x, n2) {
  return x << n2 | x >>> 32 - n2;
}
function sha1(bytes) {
  const K = [1518500249, 1859775393, 2400959708, 3395469782];
  const H = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
  const newBytes = new Uint8Array(bytes.length + 1);
  newBytes.set(bytes);
  newBytes[bytes.length] = 128;
  bytes = newBytes;
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);
  for (let i = 0; i < N; ++i) {
    const arr2 = new Uint32Array(16);
    for (let j = 0; j < 16; ++j) {
      arr2[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }
    M[i] = arr2;
  }
  M[N - 1][14] = (bytes.length - 1) * 8 / 2 ** 32;
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 4294967295;
  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);
    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }
    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }
    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }
  return Uint8Array.of(H[0] >> 24, H[0] >> 16, H[0] >> 8, H[0], H[1] >> 24, H[1] >> 16, H[1] >> 8, H[1], H[2] >> 24, H[2] >> 16, H[2] >> 8, H[2], H[3] >> 24, H[3] >> 16, H[3] >> 8, H[3], H[4] >> 24, H[4] >> 16, H[4] >> 8, H[4]);
}
var sha1_default;
var init_sha1 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/sha1.mjs"() {
    sha1_default = sha1;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v35.mjs
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
function v35(version, hash, value, namespace, buf, offset) {
  const valueBytes = typeof value === "string" ? stringToBytes(value) : value;
  const namespaceBytes = typeof namespace === "string" ? parse_default(namespace) : namespace;
  if (typeof namespace === "string") {
    namespace = parse_default(namespace);
  }
  if (namespace?.length !== 16) {
    throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
  }
  let bytes = new Uint8Array(16 + valueBytes.length);
  bytes.set(namespaceBytes);
  bytes.set(valueBytes, namespaceBytes.length);
  bytes = hash(bytes);
  bytes[6] = bytes[6] & 15 | version;
  bytes[8] = bytes[8] & 63 | 128;
  if (buf) {
    offset ?? (offset = 0);
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = bytes[i];
    }
    return buf;
  }
  return unsafeStringify(bytes);
}
var DNS, URL2;
var init_v35 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v35.mjs"() {
    init_parse();
    init_stringify();
    DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v5.mjs
function v5(value, namespace, buf, offset) {
  return v35(80, sha1_default, value, namespace, buf, offset);
}
var v5_default;
var init_v5 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v5.mjs"() {
    init_sha1();
    init_v35();
    init_v35();
    v5.DNS = DNS;
    v5.URL = URL2;
    v5_default = v5;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v7.mjs
function v7(options, buf, offset) {
  let bytes;
  if (options) {
    bytes = v7Bytes(options.random ?? options.rng?.() ?? rng(), options.msecs, options.seq, buf, offset);
  } else {
    const now = Date.now();
    const rnds = rng();
    updateV7State(_state, now, rnds);
    bytes = v7Bytes(rnds, _state.msecs, _state.seq, buf, offset);
  }
  return buf ?? unsafeStringify(bytes);
}
function updateV7State(state, now, rnds) {
  state.msecs ?? (state.msecs = -Infinity);
  state.seq ?? (state.seq = 0);
  if (now > state.msecs) {
    state.seq = rnds[6] << 23 | rnds[7] << 16 | rnds[8] << 8 | rnds[9];
    state.msecs = now;
  } else {
    state.seq = state.seq + 1 | 0;
    if (state.seq === 0) {
      state.msecs++;
    }
  }
  return state;
}
function v7Bytes(rnds, msecs, seq, buf, offset = 0) {
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  if (!buf) {
    buf = new Uint8Array(16);
    offset = 0;
  } else {
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
  }
  msecs ?? (msecs = Date.now());
  seq ?? (seq = rnds[6] * 127 << 24 | rnds[7] << 16 | rnds[8] << 8 | rnds[9]);
  buf[offset++] = msecs / 1099511627776 & 255;
  buf[offset++] = msecs / 4294967296 & 255;
  buf[offset++] = msecs / 16777216 & 255;
  buf[offset++] = msecs / 65536 & 255;
  buf[offset++] = msecs / 256 & 255;
  buf[offset++] = msecs & 255;
  buf[offset++] = 112 | seq >>> 28 & 15;
  buf[offset++] = seq >>> 20 & 255;
  buf[offset++] = 128 | seq >>> 14 & 63;
  buf[offset++] = seq >>> 6 & 255;
  buf[offset++] = seq << 2 & 255 | rnds[10] & 3;
  buf[offset++] = rnds[11];
  buf[offset++] = rnds[12];
  buf[offset++] = rnds[13];
  buf[offset++] = rnds[14];
  buf[offset++] = rnds[15];
  return buf;
}
var _state, v7_default;
var init_v7 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/v7.mjs"() {
    init_rng();
    init_stringify();
    _state = {};
    v7_default = v7;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/version.mjs
var init_version = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/version.mjs"() {
    init_validate();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/index.mjs
var init_src = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/uuid/src/index.mjs"() {
    init_max();
    init_nil();
    init_parse();
    init_stringify();
    init_v4();
    init_v5();
    init_v7();
    init_validate();
    init_version();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/api_url.mjs
function getOpenAPIBaseUrl(apiUrl) {
  const url = apiUrl.replace(/\/$/, "");
  for (const suffix of ["/api/v1", "/api"]) {
    if (url.endsWith(suffix))
      return url.slice(0, -suffix.length);
  }
  return url;
}
var init_api_url = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/api_url.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/experimental/otel/constants.mjs
var GEN_AI_OPERATION_NAME, GEN_AI_SYSTEM, GEN_AI_REQUEST_MODEL, GEN_AI_RESPONSE_MODEL, GEN_AI_USAGE_INPUT_TOKENS, GEN_AI_USAGE_OUTPUT_TOKENS, GEN_AI_USAGE_TOTAL_TOKENS, GEN_AI_REQUEST_MAX_TOKENS, GEN_AI_REQUEST_TEMPERATURE, GEN_AI_REQUEST_TOP_P, GEN_AI_REQUEST_FREQUENCY_PENALTY, GEN_AI_REQUEST_PRESENCE_PENALTY, GEN_AI_RESPONSE_FINISH_REASONS, GENAI_PROMPT, GENAI_COMPLETION, GEN_AI_REQUEST_EXTRA_QUERY, GEN_AI_REQUEST_EXTRA_BODY, GEN_AI_SERIALIZED_NAME, GEN_AI_SERIALIZED_SIGNATURE, GEN_AI_SERIALIZED_DOC, GEN_AI_RESPONSE_ID, GEN_AI_TOOL_NAME, GEN_AI_TOOL_CALL_ID, GEN_AI_TOOL_DEFINITIONS, GEN_AI_RESPONSE_SERVICE_TIER, GEN_AI_RESPONSE_SYSTEM_FINGERPRINT, GEN_AI_USAGE_INPUT_TOKEN_DETAILS, GEN_AI_USAGE_OUTPUT_TOKEN_DETAILS, LANGSMITH_SESSION_ID, LANGSMITH_SESSION_NAME, LANGSMITH_RUN_TYPE, LANGSMITH_NAME, LANGSMITH_METADATA, LANGSMITH_TAGS, LANGSMITH_REQUEST_STREAMING, LANGSMITH_REQUEST_HEADERS, LANGSMITH_USAGE_METADATA;
var init_constants = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/experimental/otel/constants.mjs"() {
    GEN_AI_OPERATION_NAME = "gen_ai.operation.name";
    GEN_AI_SYSTEM = "gen_ai.system";
    GEN_AI_REQUEST_MODEL = "gen_ai.request.model";
    GEN_AI_RESPONSE_MODEL = "gen_ai.response.model";
    GEN_AI_USAGE_INPUT_TOKENS = "gen_ai.usage.input_tokens";
    GEN_AI_USAGE_OUTPUT_TOKENS = "gen_ai.usage.output_tokens";
    GEN_AI_USAGE_TOTAL_TOKENS = "gen_ai.usage.total_tokens";
    GEN_AI_REQUEST_MAX_TOKENS = "gen_ai.request.max_tokens";
    GEN_AI_REQUEST_TEMPERATURE = "gen_ai.request.temperature";
    GEN_AI_REQUEST_TOP_P = "gen_ai.request.top_p";
    GEN_AI_REQUEST_FREQUENCY_PENALTY = "gen_ai.request.frequency_penalty";
    GEN_AI_REQUEST_PRESENCE_PENALTY = "gen_ai.request.presence_penalty";
    GEN_AI_RESPONSE_FINISH_REASONS = "gen_ai.response.finish_reasons";
    GENAI_PROMPT = "gen_ai.prompt";
    GENAI_COMPLETION = "gen_ai.completion";
    GEN_AI_REQUEST_EXTRA_QUERY = "gen_ai.request.extra_query";
    GEN_AI_REQUEST_EXTRA_BODY = "gen_ai.request.extra_body";
    GEN_AI_SERIALIZED_NAME = "gen_ai.serialized.name";
    GEN_AI_SERIALIZED_SIGNATURE = "gen_ai.serialized.signature";
    GEN_AI_SERIALIZED_DOC = "gen_ai.serialized.doc";
    GEN_AI_RESPONSE_ID = "gen_ai.response.id";
    GEN_AI_TOOL_NAME = "gen_ai.tool.name";
    GEN_AI_TOOL_CALL_ID = "gen_ai.tool.call.id";
    GEN_AI_TOOL_DEFINITIONS = "gen_ai.tool.definitions";
    GEN_AI_RESPONSE_SERVICE_TIER = "gen_ai.response.service_tier";
    GEN_AI_RESPONSE_SYSTEM_FINGERPRINT = "gen_ai.response.system_fingerprint";
    GEN_AI_USAGE_INPUT_TOKEN_DETAILS = "gen_ai.usage.input_token_details";
    GEN_AI_USAGE_OUTPUT_TOKEN_DETAILS = "gen_ai.usage.output_token_details";
    LANGSMITH_SESSION_ID = "langsmith.trace.session_id";
    LANGSMITH_SESSION_NAME = "langsmith.trace.session_name";
    LANGSMITH_RUN_TYPE = "langsmith.span.kind";
    LANGSMITH_NAME = "langsmith.trace.name";
    LANGSMITH_METADATA = "langsmith.metadata";
    LANGSMITH_TAGS = "langsmith.span.tags";
    LANGSMITH_REQUEST_STREAMING = "langsmith.request.streaming";
    LANGSMITH_REQUEST_HEADERS = "langsmith.request.headers";
    LANGSMITH_USAGE_METADATA = "langsmith.usage_metadata";
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/otel.mjs
function getOTELTrace() {
  return OTELProviderSingleton.getTraceInstance();
}
function getOTELContext() {
  return OTELProviderSingleton.getContextInstance();
}
function getDefaultOTLPTracerComponents() {
  return OTELProviderSingleton.getDefaultOTLPTracerComponents();
}
var MockTracer, MockOTELTrace, MockOTELContext, OTEL_TRACE_KEY, OTEL_CONTEXT_KEY, OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY, mockOTELTrace, mockOTELContext, OTELProvider, OTELProviderSingleton;
var init_otel = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/otel.mjs"() {
    init_env3();
    MockTracer = class {
      constructor() {
        Object.defineProperty(this, "hasWarned", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: false
        });
      }
      startActiveSpan(_name, ...args) {
        if (!this.hasWarned && resolveTracingMode() === "otel") {
          console.warn('OTel tracing mode is active (via LANGSMITH_TRACING_MODE, OTEL_ENABLED, or LANGSMITH_OTEL_ENABLED), but the required OTEL instances have not been initialized. Please add:\n```\nimport { initializeOTEL } from "langsmith/experimental/otel/setup";\ninitializeOTEL();\n```\nat the beginning of your code.');
          this.hasWarned = true;
        }
        let fn;
        if (args.length === 1 && typeof args[0] === "function") {
          fn = args[0];
        } else if (args.length === 2 && typeof args[1] === "function") {
          fn = args[1];
        } else if (args.length === 3 && typeof args[2] === "function") {
          fn = args[2];
        }
        if (typeof fn === "function") {
          return fn();
        }
        return void 0;
      }
    };
    MockOTELTrace = class {
      constructor() {
        Object.defineProperty(this, "mockTracer", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new MockTracer()
        });
      }
      getTracer(_name, _version) {
        return this.mockTracer;
      }
      getActiveSpan() {
        return void 0;
      }
      setSpan(context, _span) {
        return context;
      }
      getSpan(_context) {
        return void 0;
      }
      setSpanContext(context, _spanContext) {
        return context;
      }
      getTracerProvider() {
        return void 0;
      }
      setGlobalTracerProvider(_tracerProvider) {
        return false;
      }
    };
    MockOTELContext = class {
      active() {
        return {};
      }
      with(_context, fn) {
        return fn();
      }
    };
    OTEL_TRACE_KEY = /* @__PURE__ */ Symbol.for("ls:otel_trace");
    OTEL_CONTEXT_KEY = /* @__PURE__ */ Symbol.for("ls:otel_context");
    OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY = /* @__PURE__ */ Symbol.for("ls:otel_get_default_otlp_tracer_provider");
    mockOTELTrace = new MockOTELTrace();
    mockOTELContext = new MockOTELContext();
    OTELProvider = class {
      getTraceInstance() {
        return globalThis[OTEL_TRACE_KEY] ?? mockOTELTrace;
      }
      getContextInstance() {
        return globalThis[OTEL_CONTEXT_KEY] ?? mockOTELContext;
      }
      initializeGlobalInstances(otel) {
        if (globalThis[OTEL_TRACE_KEY] === void 0) {
          globalThis[OTEL_TRACE_KEY] = otel.trace;
        }
        if (globalThis[OTEL_CONTEXT_KEY] === void 0) {
          globalThis[OTEL_CONTEXT_KEY] = otel.context;
        }
      }
      setDefaultOTLPTracerComponents(components) {
        globalThis[OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY] = components;
      }
      getDefaultOTLPTracerComponents() {
        return globalThis[OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY] ?? void 0;
      }
    };
    OTELProviderSingleton = new OTELProvider();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/experimental/otel/translator.mjs
function getOperationName(runType) {
  return WELL_KNOWN_OPERATION_NAMES[runType] || runType;
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
var WELL_KNOWN_OPERATION_NAMES, LangSmithToOTELTranslator;
var init_translator = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/experimental/otel/translator.mjs"() {
    init_constants();
    init_otel();
    WELL_KNOWN_OPERATION_NAMES = {
      llm: "chat",
      tool: "execute_tool",
      retriever: "embeddings",
      embedding: "embeddings",
      prompt: "chat"
    };
    LangSmithToOTELTranslator = class {
      constructor() {
        Object.defineProperty(this, "spans", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: /* @__PURE__ */ new Map()
        });
      }
      exportBatch(operations, otelContextMap) {
        for (const op of operations) {
          try {
            if (!op.run) {
              continue;
            }
            if (op.operation === "post") {
              const span = this.createSpanForRun(op, op.run, otelContextMap.get(op.id));
              if (span && !op.run.end_time) {
                this.spans.set(op.id, span);
              }
            } else {
              this.updateSpanForRun(op, op.run);
            }
          } catch (e) {
            console.error(`Error processing operation ${op.id}:`, e);
          }
        }
      }
      createSpanForRun(op, runInfo, otelContext) {
        const activeSpan = otelContext && getOTELTrace().getSpan(otelContext);
        if (!activeSpan) {
          return;
        }
        try {
          return this.finishSpanSetup(activeSpan, runInfo, op);
        } catch (e) {
          console.error(`Failed to create span for run ${op.id}:`, e);
          return void 0;
        }
      }
      finishSpanSetup(span, runInfo, op) {
        this.setSpanAttributes(span, runInfo, op);
        if (runInfo.error) {
          span.setStatus({ code: 2 });
          span.recordException(new Error(runInfo.error));
        } else {
          span.setStatus({ code: 1 });
        }
        if (runInfo.end_time) {
          span.end(new Date(runInfo.end_time));
        }
        return span;
      }
      updateSpanForRun(op, runInfo) {
        try {
          const span = this.spans.get(op.id);
          if (!span) {
            console.debug(`No span found for run ${op.id} during update`);
            return;
          }
          this.setSpanAttributes(span, runInfo, op);
          if (runInfo.error) {
            span.setStatus({ code: 2 });
            span.recordException(new Error(runInfo.error));
          } else {
            span.setStatus({ code: 1 });
          }
          const endTime = runInfo.end_time;
          if (endTime) {
            span.end(new Date(endTime));
            this.spans.delete(op.id);
          }
        } catch (e) {
          console.error(`Failed to update span for run ${op.id}:`, e);
        }
      }
      extractModelName(runInfo) {
        if (runInfo.extra?.metadata) {
          const metadata = runInfo.extra.metadata;
          if (metadata.ls_model_name) {
            return metadata.ls_model_name;
          }
          if (metadata.invocation_params) {
            const invocationParams = metadata.invocation_params;
            if (invocationParams.model) {
              return invocationParams.model;
            } else if (invocationParams.model_name) {
              return invocationParams.model_name;
            }
          }
        }
        return;
      }
      setSpanAttributes(span, runInfo, op) {
        if ("run_type" in runInfo && runInfo.run_type) {
          span.setAttribute(LANGSMITH_RUN_TYPE, runInfo.run_type);
          const operationName = getOperationName(runInfo.run_type || "chain");
          span.setAttribute(GEN_AI_OPERATION_NAME, operationName);
        }
        if ("name" in runInfo && runInfo.name) {
          span.setAttribute(LANGSMITH_NAME, runInfo.name);
        }
        if ("session_id" in runInfo && runInfo.session_id) {
          span.setAttribute(LANGSMITH_SESSION_ID, runInfo.session_id);
        }
        if ("session_name" in runInfo && runInfo.session_name) {
          span.setAttribute(LANGSMITH_SESSION_NAME, runInfo.session_name);
        }
        this.setGenAiSystem(span, runInfo);
        const modelName = this.extractModelName(runInfo);
        if (modelName) {
          span.setAttribute(GEN_AI_REQUEST_MODEL, modelName);
        }
        if (runInfo.extra?.metadata?.usage_metadata && typeof runInfo.extra.metadata.usage_metadata === "object") {
          span.setAttribute(LANGSMITH_USAGE_METADATA, JSON.stringify(runInfo.extra.metadata.usage_metadata));
        }
        if ("prompt_tokens" in runInfo && typeof runInfo.prompt_tokens === "number") {
          span.setAttribute(GEN_AI_USAGE_INPUT_TOKENS, runInfo.prompt_tokens);
        }
        if ("completion_tokens" in runInfo && typeof runInfo.completion_tokens === "number") {
          span.setAttribute(GEN_AI_USAGE_OUTPUT_TOKENS, runInfo.completion_tokens);
        }
        if ("total_tokens" in runInfo && typeof runInfo.total_tokens === "number") {
          span.setAttribute(GEN_AI_USAGE_TOTAL_TOKENS, runInfo.total_tokens);
        }
        this.setInvocationParameters(span, runInfo);
        if ("run_type" in runInfo && runInfo.run_type === "tool") {
          if ("name" in runInfo && runInfo.name) {
            span.setAttribute(GEN_AI_TOOL_NAME, runInfo.name);
          }
          const toolCallId = runInfo.extra?.tool_call_id || runInfo.extra?.metadata?.tool_call_id;
          if (toolCallId != null) {
            span.setAttribute(GEN_AI_TOOL_CALL_ID, String(toolCallId));
          }
        }
        const metadata = runInfo.extra?.metadata || {};
        for (const [key, value] of Object.entries(metadata)) {
          if (value !== null && value !== void 0) {
            span.setAttribute(`${LANGSMITH_METADATA}.${key}`, isPrimitive(value) ? String(value) : JSON.stringify(value));
          }
        }
        const tags = runInfo.tags;
        if (tags && Array.isArray(tags)) {
          span.setAttribute(LANGSMITH_TAGS, tags.join(", "));
        } else if (tags) {
          span.setAttribute(LANGSMITH_TAGS, String(tags));
        }
        if ("serialized" in runInfo && typeof runInfo.serialized === "object") {
          const serialized = runInfo.serialized;
          if (serialized.name) {
            span.setAttribute(GEN_AI_SERIALIZED_NAME, String(serialized.name));
          }
          if (serialized.signature) {
            span.setAttribute(GEN_AI_SERIALIZED_SIGNATURE, String(serialized.signature));
          }
          if (serialized.doc) {
            span.setAttribute(GEN_AI_SERIALIZED_DOC, String(serialized.doc));
          }
        }
        this.setIOAttributes(span, op);
      }
      setGenAiSystem(span, runInfo) {
        let system = "langchain";
        const modelName = this.extractModelName(runInfo);
        if (modelName) {
          const modelLower = modelName.toLowerCase();
          if (modelLower.includes("anthropic") || modelLower.startsWith("claude")) {
            system = "anthropic";
          } else if (modelLower.includes("bedrock")) {
            system = "aws.bedrock";
          } else if (modelLower.includes("azure") && modelLower.includes("openai")) {
            system = "az.ai.openai";
          } else if (modelLower.includes("azure") && modelLower.includes("inference")) {
            system = "az.ai.inference";
          } else if (modelLower.includes("cohere")) {
            system = "cohere";
          } else if (modelLower.includes("deepseek")) {
            system = "deepseek";
          } else if (modelLower.includes("gemini")) {
            system = "gemini";
          } else if (modelLower.includes("groq")) {
            system = "groq";
          } else if (modelLower.includes("watson") || modelLower.includes("ibm")) {
            system = "ibm.watsonx.ai";
          } else if (modelLower.includes("mistral")) {
            system = "mistral_ai";
          } else if (modelLower.includes("gpt") || modelLower.includes("openai")) {
            system = "openai";
          } else if (modelLower.includes("perplexity") || modelLower.includes("sonar")) {
            system = "perplexity";
          } else if (modelLower.includes("vertex")) {
            system = "vertex_ai";
          } else if (modelLower.includes("xai") || modelLower.includes("grok")) {
            system = "xai";
          }
        }
        span.setAttribute(GEN_AI_SYSTEM, system);
      }
      setInvocationParameters(span, runInfo) {
        const tools = runInfo.extra?.invocation_params?.tools;
        if (Array.isArray(tools) && tools.length > 0) {
          span.setAttribute(GEN_AI_TOOL_DEFINITIONS, JSON.stringify(tools));
        }
        if (!runInfo.extra?.metadata?.invocation_params) {
          return;
        }
        const invocationParams = runInfo.extra.metadata.invocation_params;
        if (invocationParams.max_tokens !== void 0) {
          span.setAttribute(GEN_AI_REQUEST_MAX_TOKENS, invocationParams.max_tokens);
        }
        if (invocationParams.temperature !== void 0) {
          span.setAttribute(GEN_AI_REQUEST_TEMPERATURE, invocationParams.temperature);
        }
        if (invocationParams.top_p !== void 0) {
          span.setAttribute(GEN_AI_REQUEST_TOP_P, invocationParams.top_p);
        }
        if (invocationParams.frequency_penalty !== void 0) {
          span.setAttribute(GEN_AI_REQUEST_FREQUENCY_PENALTY, invocationParams.frequency_penalty);
        }
        if (invocationParams.presence_penalty !== void 0) {
          span.setAttribute(GEN_AI_REQUEST_PRESENCE_PENALTY, invocationParams.presence_penalty);
        }
      }
      setIOAttributes(span, op) {
        if (op.run.inputs) {
          try {
            const inputs = op.run.inputs;
            if (typeof inputs === "object" && inputs !== null) {
              if (inputs.model && Array.isArray(inputs.messages)) {
                span.setAttribute(GEN_AI_REQUEST_MODEL, inputs.model);
              }
              if (inputs.stream !== void 0) {
                span.setAttribute(LANGSMITH_REQUEST_STREAMING, inputs.stream);
              }
              if (inputs.extra_headers) {
                span.setAttribute(LANGSMITH_REQUEST_HEADERS, JSON.stringify(inputs.extra_headers));
              }
              if (inputs.extra_query) {
                span.setAttribute(GEN_AI_REQUEST_EXTRA_QUERY, JSON.stringify(inputs.extra_query));
              }
              if (inputs.extra_body) {
                span.setAttribute(GEN_AI_REQUEST_EXTRA_BODY, JSON.stringify(inputs.extra_body));
              }
            }
            span.setAttribute(GENAI_PROMPT, JSON.stringify(inputs));
          } catch (e) {
            console.debug(`Failed to process inputs for run ${op.id}`, e);
          }
        }
        if (op.run.outputs) {
          try {
            const outputs = op.run.outputs;
            const tokenUsage = this.getUnifiedRunTokens(outputs);
            if (tokenUsage) {
              span.setAttribute(GEN_AI_USAGE_INPUT_TOKENS, tokenUsage[0]);
              span.setAttribute(GEN_AI_USAGE_OUTPUT_TOKENS, tokenUsage[1]);
              span.setAttribute(GEN_AI_USAGE_TOTAL_TOKENS, tokenUsage[0] + tokenUsage[1]);
            }
            if (outputs && typeof outputs === "object") {
              if (outputs.model) {
                span.setAttribute(GEN_AI_RESPONSE_MODEL, String(outputs.model));
              }
              if (outputs.id) {
                span.setAttribute(GEN_AI_RESPONSE_ID, outputs.id);
              }
              if (outputs.choices && Array.isArray(outputs.choices)) {
                const finishReasons = outputs.choices.map((choice) => choice.finish_reason).filter((reason) => reason).map(String);
                if (finishReasons.length > 0) {
                  span.setAttribute(GEN_AI_RESPONSE_FINISH_REASONS, finishReasons.join(", "));
                }
              }
              if (outputs.service_tier) {
                span.setAttribute(GEN_AI_RESPONSE_SERVICE_TIER, outputs.service_tier);
              }
              if (outputs.system_fingerprint) {
                span.setAttribute(GEN_AI_RESPONSE_SYSTEM_FINGERPRINT, outputs.system_fingerprint);
              }
              if (outputs.usage_metadata && typeof outputs.usage_metadata === "object") {
                const usageMetadata = outputs.usage_metadata;
                span.setAttribute(LANGSMITH_USAGE_METADATA, JSON.stringify(usageMetadata));
                if (usageMetadata.input_token_details) {
                  span.setAttribute(GEN_AI_USAGE_INPUT_TOKEN_DETAILS, JSON.stringify(usageMetadata.input_token_details));
                }
                if (usageMetadata.output_token_details) {
                  span.setAttribute(GEN_AI_USAGE_OUTPUT_TOKEN_DETAILS, JSON.stringify(usageMetadata.output_token_details));
                }
              }
            }
            span.setAttribute(GENAI_COMPLETION, JSON.stringify(outputs));
          } catch (e) {
            console.debug(`Failed to process outputs for run ${op.id}`, e);
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getUnifiedRunTokens(outputs) {
        if (!outputs) {
          return null;
        }
        let tokenUsage = this.extractUnifiedRunTokens(outputs.usage_metadata);
        if (tokenUsage) {
          return tokenUsage;
        }
        const keys = Object.keys(outputs);
        for (const key of keys) {
          const haystack = outputs[key];
          if (!haystack || typeof haystack !== "object") {
            continue;
          }
          tokenUsage = this.extractUnifiedRunTokens(haystack.usage_metadata);
          if (tokenUsage) {
            return tokenUsage;
          }
          if (haystack.lc === 1 && haystack.kwargs && typeof haystack.kwargs === "object") {
            tokenUsage = this.extractUnifiedRunTokens(haystack.kwargs.usage_metadata);
            if (tokenUsage) {
              return tokenUsage;
            }
          }
        }
        const generations = outputs.generations || [];
        if (!Array.isArray(generations)) {
          return null;
        }
        const flatGenerations = Array.isArray(generations[0]) ? generations.flat() : generations;
        for (const generation of flatGenerations) {
          if (typeof generation === "object" && generation.message && typeof generation.message === "object" && generation.message.kwargs && typeof generation.message.kwargs === "object") {
            tokenUsage = this.extractUnifiedRunTokens(generation.message.kwargs.usage_metadata);
            if (tokenUsage) {
              return tokenUsage;
            }
          }
        }
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extractUnifiedRunTokens(outputs) {
        if (!outputs || typeof outputs !== "object") {
          return null;
        }
        if (typeof outputs.input_tokens !== "number" || typeof outputs.output_tokens !== "number") {
          return null;
        }
        return [outputs.input_tokens, outputs.output_tokens];
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/is-network-error/index.mjs
function isNetworkError(error) {
  const isValid = error && isError(error) && error.name === "TypeError" && typeof error.message === "string";
  if (!isValid) {
    return false;
  }
  const { message, stack } = error;
  if (message === "Load failed") {
    return stack === void 0 || // Sentry adds its own stack trace to the fetch error, so also check for that
    "__sentry_captured__" in error;
  }
  if (message.startsWith("error sending request for url")) {
    return true;
  }
  return errorMessages.has(message);
}
var objectToString, isError, errorMessages;
var init_is_network_error = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/is-network-error/index.mjs"() {
    objectToString = Object.prototype.toString;
    isError = (value) => objectToString.call(value) === "[object Error]";
    errorMessages = /* @__PURE__ */ new Set([
      "network error",
      // Chrome
      "Failed to fetch",
      // Chrome
      "NetworkError when attempting to fetch resource.",
      // Firefox
      "The Internet connection appears to be offline.",
      // Safari 16
      "Network request failed",
      // `cross-fetch`
      "fetch failed",
      // Undici (Node.js)
      "terminated",
      // Undici (Node.js)
      " A network error occurred.",
      // Bun (WebKit)
      "Network connection lost"
      // Cloudflare Workers (fetch)
    ]);
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/p-retry/index.mjs
function validateRetries(retries) {
  if (typeof retries === "number") {
    if (retries < 0) {
      throw new TypeError("Expected `retries` to be a non-negative number.");
    }
    if (Number.isNaN(retries)) {
      throw new TypeError("Expected `retries` to be a valid number or Infinity, got NaN.");
    }
  } else if (retries !== void 0) {
    throw new TypeError("Expected `retries` to be a number or Infinity.");
  }
}
function validateNumberOption(name, value, { min = 0, allowInfinity = false } = {}) {
  if (value === void 0) {
    return;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError(`Expected \`${name}\` to be a number${allowInfinity ? " or Infinity" : ""}.`);
  }
  if (!allowInfinity && !Number.isFinite(value)) {
    throw new TypeError(`Expected \`${name}\` to be a finite number.`);
  }
  if (value < min) {
    throw new TypeError(`Expected \`${name}\` to be \u2265 ${min}.`);
  }
}
function calculateDelay(retriesConsumed, options) {
  const attempt = Math.max(1, retriesConsumed + 1);
  const random = options.randomize ? Math.random() + 1 : 1;
  let timeout = Math.round(random * options.minTimeout * options.factor ** (attempt - 1));
  timeout = Math.min(timeout, options.maxTimeout);
  return timeout;
}
function calculateRemainingTime(start, max) {
  if (!Number.isFinite(max)) {
    return max;
  }
  return max - (performance.now() - start);
}
async function onAttemptFailure({ error, attemptNumber, retriesConsumed, startTime, options }) {
  const normalizedError = error instanceof Error ? error : new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`);
  if (normalizedError instanceof AbortError) {
    throw normalizedError.originalError;
  }
  const retriesLeft = Number.isFinite(options.retries) ? Math.max(0, options.retries - retriesConsumed) : options.retries;
  const maxRetryTime = options.maxRetryTime ?? Number.POSITIVE_INFINITY;
  const context = Object.freeze({
    error: normalizedError,
    attemptNumber,
    retriesLeft,
    retriesConsumed
  });
  await options.onFailedAttempt(context);
  if (calculateRemainingTime(startTime, maxRetryTime) <= 0) {
    throw normalizedError;
  }
  const consumeRetry = await options.shouldConsumeRetry(context);
  const remainingTime = calculateRemainingTime(startTime, maxRetryTime);
  if (remainingTime <= 0 || retriesLeft <= 0) {
    throw normalizedError;
  }
  if (normalizedError instanceof TypeError && !isNetworkError(normalizedError)) {
    if (consumeRetry) {
      throw normalizedError;
    }
    options.signal?.throwIfAborted();
    return false;
  }
  if (!await options.shouldRetry(context)) {
    throw normalizedError;
  }
  if (!consumeRetry) {
    options.signal?.throwIfAborted();
    return false;
  }
  const delayTime = calculateDelay(retriesConsumed, options);
  const finalDelay = Math.min(delayTime, remainingTime);
  if (finalDelay > 0) {
    await new Promise((resolve2, reject) => {
      const onAbort = () => {
        clearTimeout(timeoutToken);
        options.signal?.removeEventListener("abort", onAbort);
        reject(options.signal.reason);
      };
      const timeoutToken = setTimeout(() => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve2();
      }, finalDelay);
      if (options.unref) {
        timeoutToken.unref?.();
      }
      options.signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
  options.signal?.throwIfAborted();
  return true;
}
async function pRetry(input, options = {}) {
  options = { ...options };
  validateRetries(options.retries);
  if (Object.hasOwn(options, "forever")) {
    throw new Error("The `forever` option is no longer supported. For many use-cases, you can set `retries: Infinity` instead.");
  }
  options.retries ?? (options.retries = 10);
  options.factor ?? (options.factor = 2);
  options.minTimeout ?? (options.minTimeout = 1e3);
  options.maxTimeout ?? (options.maxTimeout = Number.POSITIVE_INFINITY);
  options.maxRetryTime ?? (options.maxRetryTime = Number.POSITIVE_INFINITY);
  options.randomize ?? (options.randomize = false);
  options.onFailedAttempt ?? (options.onFailedAttempt = () => {
  });
  options.shouldRetry ?? (options.shouldRetry = () => true);
  options.shouldConsumeRetry ?? (options.shouldConsumeRetry = () => true);
  validateNumberOption("factor", options.factor, {
    min: 0,
    allowInfinity: false
  });
  validateNumberOption("minTimeout", options.minTimeout, {
    min: 0,
    allowInfinity: false
  });
  validateNumberOption("maxTimeout", options.maxTimeout, {
    min: 0,
    allowInfinity: true
  });
  validateNumberOption("maxRetryTime", options.maxRetryTime, {
    min: 0,
    allowInfinity: true
  });
  if (!(options.factor > 0)) {
    options.factor = 1;
  }
  options.signal?.throwIfAborted();
  let attemptNumber = 0;
  let retriesConsumed = 0;
  const startTime = performance.now();
  while (Number.isFinite(options.retries) ? retriesConsumed <= options.retries : true) {
    attemptNumber++;
    try {
      options.signal?.throwIfAborted();
      const result = await input(attemptNumber);
      options.signal?.throwIfAborted();
      return result;
    } catch (error) {
      if (await onAttemptFailure({
        error,
        attemptNumber,
        retriesConsumed,
        startTime,
        options
      })) {
        retriesConsumed++;
      }
    }
  }
  throw new Error("Retry attempts exhausted without throwing an error.");
}
var AbortError;
var init_p_retry = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/p-retry/index.mjs"() {
    init_is_network_error();
    AbortError = class extends Error {
      constructor(message) {
        super();
        if (message instanceof Error) {
          this.originalError = message;
          ({ message } = message);
        } else {
          this.originalError = new Error(message);
          this.originalError.stack = this.stack;
        }
        this.name = "AbortError";
        this.message = message;
      }
    };
  }
});

// node_modules/.pnpm/eventemitter3@4.0.7/node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/.pnpm/eventemitter3@4.0.7/node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has2 = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has2.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prefixed = prefix;
    EventEmitter.EventEmitter = EventEmitter;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter;
    }
  }
});

// node_modules/.pnpm/p-finally@1.0.0/node_modules/p-finally/index.js
var require_p_finally = __commonJS({
  "node_modules/.pnpm/p-finally@1.0.0/node_modules/p-finally/index.js"(exports, module) {
    "use strict";
    module.exports = (promise, onFinally) => {
      onFinally = onFinally || (() => {
      });
      return promise.then(
        (val) => new Promise((resolve2) => {
          resolve2(onFinally());
        }).then(() => val),
        (err) => new Promise((resolve2) => {
          resolve2(onFinally());
        }).then(() => {
          throw err;
        })
      );
    };
  }
});

// node_modules/.pnpm/p-timeout@3.2.0/node_modules/p-timeout/index.js
var require_p_timeout = __commonJS({
  "node_modules/.pnpm/p-timeout@3.2.0/node_modules/p-timeout/index.js"(exports, module) {
    "use strict";
    var pFinally = require_p_finally();
    var TimeoutError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "TimeoutError";
      }
    };
    var pTimeout = (promise, milliseconds, fallback) => new Promise((resolve2, reject) => {
      if (typeof milliseconds !== "number" || milliseconds < 0) {
        throw new TypeError("Expected `milliseconds` to be a positive number");
      }
      if (milliseconds === Infinity) {
        resolve2(promise);
        return;
      }
      const timer = setTimeout(() => {
        if (typeof fallback === "function") {
          try {
            resolve2(fallback());
          } catch (error) {
            reject(error);
          }
          return;
        }
        const message = typeof fallback === "string" ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
        const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);
        if (typeof promise.cancel === "function") {
          promise.cancel();
        }
        reject(timeoutError);
      }, milliseconds);
      pFinally(
        // eslint-disable-next-line promise/prefer-await-to-then
        promise.then(resolve2, reject),
        () => {
          clearTimeout(timer);
        }
      );
    });
    module.exports = pTimeout;
    module.exports.default = pTimeout;
    module.exports.TimeoutError = TimeoutError;
  }
});

// node_modules/.pnpm/p-queue@6.6.2/node_modules/p-queue/dist/lower-bound.js
var require_lower_bound = __commonJS({
  "node_modules/.pnpm/p-queue@6.6.2/node_modules/p-queue/dist/lower-bound.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function lowerBound(array, value, comparator) {
      let first = 0;
      let count = array.length;
      while (count > 0) {
        const step = count / 2 | 0;
        let it = first + step;
        if (comparator(array[it], value) <= 0) {
          first = ++it;
          count -= step + 1;
        } else {
          count = step;
        }
      }
      return first;
    }
    exports.default = lowerBound;
  }
});

// node_modules/.pnpm/p-queue@6.6.2/node_modules/p-queue/dist/priority-queue.js
var require_priority_queue = __commonJS({
  "node_modules/.pnpm/p-queue@6.6.2/node_modules/p-queue/dist/priority-queue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lower_bound_1 = require_lower_bound();
    var PriorityQueue = class {
      constructor() {
        this._queue = [];
      }
      enqueue(run, options) {
        options = Object.assign({ priority: 0 }, options);
        const element = {
          priority: options.priority,
          run
        };
        if (this.size && this._queue[this.size - 1].priority >= options.priority) {
          this._queue.push(element);
          return;
        }
        const index = lower_bound_1.default(this._queue, element, (a, b) => b.priority - a.priority);
        this._queue.splice(index, 0, element);
      }
      dequeue() {
        const item = this._queue.shift();
        return item === null || item === void 0 ? void 0 : item.run;
      }
      filter(options) {
        return this._queue.filter((element) => element.priority === options.priority).map((element) => element.run);
      }
      get size() {
        return this._queue.length;
      }
    };
    exports.default = PriorityQueue;
  }
});

// node_modules/.pnpm/p-queue@6.6.2/node_modules/p-queue/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/p-queue@6.6.2/node_modules/p-queue/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventEmitter = require_eventemitter3();
    var p_timeout_1 = require_p_timeout();
    var priority_queue_1 = require_priority_queue();
    var empty = () => {
    };
    var timeoutError = new p_timeout_1.TimeoutError();
    var PQueue2 = class extends EventEmitter {
      constructor(options) {
        var _a2, _b, _c, _d;
        super();
        this._intervalCount = 0;
        this._intervalEnd = 0;
        this._pendingCount = 0;
        this._resolveEmpty = empty;
        this._resolveIdle = empty;
        options = Object.assign({ carryoverConcurrencyCount: false, intervalCap: Infinity, interval: 0, concurrency: Infinity, autoStart: true, queueClass: priority_queue_1.default }, options);
        if (!(typeof options.intervalCap === "number" && options.intervalCap >= 1)) {
          throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a2 = options.intervalCap) === null || _a2 === void 0 ? void 0 : _a2.toString()) !== null && _b !== void 0 ? _b : ""}\` (${typeof options.intervalCap})`);
        }
        if (options.interval === void 0 || !(Number.isFinite(options.interval) && options.interval >= 0)) {
          throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""}\` (${typeof options.interval})`);
        }
        this._carryoverConcurrencyCount = options.carryoverConcurrencyCount;
        this._isIntervalIgnored = options.intervalCap === Infinity || options.interval === 0;
        this._intervalCap = options.intervalCap;
        this._interval = options.interval;
        this._queue = new options.queueClass();
        this._queueClass = options.queueClass;
        this.concurrency = options.concurrency;
        this._timeout = options.timeout;
        this._throwOnTimeout = options.throwOnTimeout === true;
        this._isPaused = options.autoStart === false;
      }
      get _doesIntervalAllowAnother() {
        return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
      }
      get _doesConcurrentAllowAnother() {
        return this._pendingCount < this._concurrency;
      }
      _next() {
        this._pendingCount--;
        this._tryToStartAnother();
        this.emit("next");
      }
      _resolvePromises() {
        this._resolveEmpty();
        this._resolveEmpty = empty;
        if (this._pendingCount === 0) {
          this._resolveIdle();
          this._resolveIdle = empty;
          this.emit("idle");
        }
      }
      _onResumeInterval() {
        this._onInterval();
        this._initializeIntervalIfNeeded();
        this._timeoutId = void 0;
      }
      _isIntervalPaused() {
        const now = Date.now();
        if (this._intervalId === void 0) {
          const delay = this._intervalEnd - now;
          if (delay < 0) {
            this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
          } else {
            if (this._timeoutId === void 0) {
              this._timeoutId = setTimeout(() => {
                this._onResumeInterval();
              }, delay);
            }
            return true;
          }
        }
        return false;
      }
      _tryToStartAnother() {
        if (this._queue.size === 0) {
          if (this._intervalId) {
            clearInterval(this._intervalId);
          }
          this._intervalId = void 0;
          this._resolvePromises();
          return false;
        }
        if (!this._isPaused) {
          const canInitializeInterval = !this._isIntervalPaused();
          if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
            const job = this._queue.dequeue();
            if (!job) {
              return false;
            }
            this.emit("active");
            job();
            if (canInitializeInterval) {
              this._initializeIntervalIfNeeded();
            }
            return true;
          }
        }
        return false;
      }
      _initializeIntervalIfNeeded() {
        if (this._isIntervalIgnored || this._intervalId !== void 0) {
          return;
        }
        this._intervalId = setInterval(() => {
          this._onInterval();
        }, this._interval);
        this._intervalEnd = Date.now() + this._interval;
      }
      _onInterval() {
        if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
          clearInterval(this._intervalId);
          this._intervalId = void 0;
        }
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
        this._processQueue();
      }
      /**
      Executes all queued functions until it reaches the limit.
      */
      _processQueue() {
        while (this._tryToStartAnother()) {
        }
      }
      get concurrency() {
        return this._concurrency;
      }
      set concurrency(newConcurrency) {
        if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
          throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
        }
        this._concurrency = newConcurrency;
        this._processQueue();
      }
      /**
      Adds a sync or async task to the queue. Always returns a promise.
      */
      async add(fn, options = {}) {
        return new Promise((resolve2, reject) => {
          const run = async () => {
            this._pendingCount++;
            this._intervalCount++;
            try {
              const operation = this._timeout === void 0 && options.timeout === void 0 ? fn() : p_timeout_1.default(Promise.resolve(fn()), options.timeout === void 0 ? this._timeout : options.timeout, () => {
                if (options.throwOnTimeout === void 0 ? this._throwOnTimeout : options.throwOnTimeout) {
                  reject(timeoutError);
                }
                return void 0;
              });
              resolve2(await operation);
            } catch (error) {
              reject(error);
            }
            this._next();
          };
          this._queue.enqueue(run, options);
          this._tryToStartAnother();
          this.emit("add");
        });
      }
      /**
          Same as `.add()`, but accepts an array of sync or async functions.
      
          @returns A promise that resolves when all functions are resolved.
          */
      async addAll(functions, options) {
        return Promise.all(functions.map(async (function_) => this.add(function_, options)));
      }
      /**
      Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
      */
      start() {
        if (!this._isPaused) {
          return this;
        }
        this._isPaused = false;
        this._processQueue();
        return this;
      }
      /**
      Put queue execution on hold.
      */
      pause() {
        this._isPaused = true;
      }
      /**
      Clear the queue.
      */
      clear() {
        this._queue = new this._queueClass();
      }
      /**
          Can be called multiple times. Useful if you for example add additional items at a later time.
      
          @returns A promise that settles when the queue becomes empty.
          */
      async onEmpty() {
        if (this._queue.size === 0) {
          return;
        }
        return new Promise((resolve2) => {
          const existingResolve = this._resolveEmpty;
          this._resolveEmpty = () => {
            existingResolve();
            resolve2();
          };
        });
      }
      /**
          The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
      
          @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
          */
      async onIdle() {
        if (this._pendingCount === 0 && this._queue.size === 0) {
          return;
        }
        return new Promise((resolve2) => {
          const existingResolve = this._resolveIdle;
          this._resolveIdle = () => {
            existingResolve();
            resolve2();
          };
        });
      }
      /**
      Size of the queue.
      */
      get size() {
        return this._queue.size;
      }
      /**
          Size of the queue, filtered by the given options.
      
          For example, this can be used to find the number of items remaining in the queue with a specific priority level.
          */
      sizeBy(options) {
        return this._queue.filter(options).length;
      }
      /**
      Number of pending promises.
      */
      get pending() {
        return this._pendingCount;
      }
      /**
      Whether the queue is currently paused.
      */
      get isPaused() {
        return this._isPaused;
      }
      get timeout() {
        return this._timeout;
      }
      /**
      Set the timeout for future operations.
      */
      set timeout(milliseconds) {
        this._timeout = milliseconds;
      }
    };
    exports.default = PQueue2;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/p-queue.mjs
var import_p_queue, PQueue;
var init_p_queue = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/p-queue.mjs"() {
    import_p_queue = __toESM(require_dist(), 1);
    PQueue = "default" in import_p_queue.default ? import_p_queue.default.default : import_p_queue.default;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/async_caller.mjs
var STATUS_RETRYABLE, AsyncCaller;
var init_async_caller = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/async_caller.mjs"() {
    init_p_retry();
    init_p_queue();
    STATUS_RETRYABLE = [
      408,
      // Request Timeout
      425,
      // Too Early
      429,
      // Too Many Requests
      500,
      // Internal Server Error
      502,
      // Bad Gateway
      503,
      // Service Unavailable
      504
      // Gateway Timeout
    ];
    AsyncCaller = class {
      constructor(params) {
        Object.defineProperty(this, "maxConcurrency", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "maxRetries", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "maxQueueSizeBytes", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "queue", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "onFailedResponseHook", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "queueSizeBytes", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: 0
        });
        this.maxConcurrency = params.maxConcurrency ?? Infinity;
        this.maxRetries = params.maxRetries ?? 6;
        this.maxQueueSizeBytes = params.maxQueueSizeBytes;
        this.queue = new PQueue({ concurrency: this.maxConcurrency });
        this.onFailedResponseHook = params?.onFailedResponseHook;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call(callable, ...args) {
        return this.callWithOptions({}, callable, ...args);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callWithOptions(options, callable, ...args) {
        const sizeBytes = options.sizeBytes ?? 0;
        if (this.maxQueueSizeBytes !== void 0 && sizeBytes > 0 && this.queueSizeBytes + sizeBytes > this.maxQueueSizeBytes) {
          return Promise.reject(new Error(`Queue size limit (${this.maxQueueSizeBytes} bytes) exceeded. Current queue size: ${this.queueSizeBytes} bytes, attempted addition: ${sizeBytes} bytes.`));
        }
        if (sizeBytes > 0) {
          this.queueSizeBytes += sizeBytes;
        }
        const onFailedResponseHook = this.onFailedResponseHook;
        let promise = this.queue.add(() => pRetry(() => callable(...args).catch((error) => {
          if (error instanceof Error) {
            throw error;
          } else {
            throw new Error(error);
          }
        }), {
          async onFailedAttempt({ error }) {
            if (typeof error !== "object" || error == null)
              throw error;
            const errorMessage = "message" in error && typeof error.message === "string" ? error.message : void 0;
            if (errorMessage?.startsWith("Cancel") || errorMessage?.startsWith("TimeoutError") || errorMessage?.startsWith("AbortError")) {
              throw error;
            }
            if ("name" in error && error.name === "TimeoutError") {
              throw error;
            }
            if ("code" in error && error.code === "ECONNABORTED") {
              throw error;
            }
            const response = "response" in error ? error.response : void 0;
            if (onFailedResponseHook) {
              const handled = await onFailedResponseHook(response);
              if (handled)
                return;
            }
            const status = response?.status ?? ("status" in error ? error.status : void 0);
            if (status != null && (typeof status === "number" || typeof status === "string") && !STATUS_RETRYABLE.includes(+status)) {
              throw error;
            }
          },
          retries: this.maxRetries,
          randomize: true
        }), { throwOnTimeout: true });
        if (sizeBytes > 0) {
          promise = promise.finally(() => {
            this.queueSizeBytes -= sizeBytes;
          });
        }
        if (options.signal) {
          return Promise.race([
            promise,
            new Promise((_, reject) => {
              options.signal?.addEventListener("abort", () => {
                reject(new Error("AbortError"));
              });
            })
          ]);
        }
        return promise;
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/messages.mjs
function isLangChainMessage(message) {
  return typeof message?._getType === "function";
}
function convertLangChainMessageToExample(message) {
  const converted = {
    type: message._getType(),
    data: { content: message.content }
  };
  if (message?.additional_kwargs && Object.keys(message.additional_kwargs).length > 0) {
    converted.data.additional_kwargs = { ...message.additional_kwargs };
  }
  return converted;
}
var init_messages = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/messages.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/tslib.mjs
function __classPrivateFieldSet(receiver, state, value, kind, f2) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f2)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f2.call(receiver, value) : f2 ? f2.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldGet(receiver, state, kind, f2) {
  if (kind === "a" && !f2)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f2 : kind === "a" ? f2.call(receiver) : f2 ? f2.value : state.get(receiver);
}
var init_tslib = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/tslib.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/uuid.mjs
var uuid4;
var init_uuid = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/uuid.mjs"() {
    uuid4 = function() {
      const { crypto: crypto2 } = globalThis;
      if (crypto2?.randomUUID) {
        uuid4 = crypto2.randomUUID.bind(crypto2);
        return crypto2.randomUUID();
      }
      const u8 = new Uint8Array(1);
      const randomByte = crypto2 ? () => crypto2.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/errors.mjs
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError;
var init_errors = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/errors.mjs"() {
    castToError = (err) => {
      if (err instanceof Error)
        return err;
      if (typeof err === "object" && err !== null) {
        try {
          if (Object.prototype.toString.call(err) === "[object Error]") {
            const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
            if (err.stack)
              error.stack = err.stack;
            if (err.cause && !error.cause)
              error.cause = err.cause;
            if (err.name)
              error.name = err.name;
            return error;
          }
        } catch {
        }
        try {
          return new Error(JSON.stringify(err));
        } catch {
        }
      }
      return new Error(err);
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/error.mjs
var LangsmithError, APIError, APIUserAbortError, APIConnectionError, APIConnectionTimeoutError, BadRequestError, AuthenticationError, PermissionDeniedError, NotFoundError, ConflictError, UnprocessableEntityError, RateLimitError, InternalServerError;
var init_error = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/error.mjs"() {
    init_errors();
    LangsmithError = class extends Error {
    };
    APIError = class _APIError extends LangsmithError {
      constructor(status, error, message, headers) {
        super(`${_APIError.makeMessage(status, error, message)}`);
        Object.defineProperty(this, "status", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "headers", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "error", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.status = status;
        this.headers = headers;
        this.error = error;
      }
      static makeMessage(status, error, message) {
        const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
        if (status && msg) {
          return `${status} ${msg}`;
        }
        if (status) {
          return `${status} status code (no body)`;
        }
        if (msg) {
          return msg;
        }
        return "(no status code or body)";
      }
      static generate(status, errorResponse, message, headers) {
        if (!status || !headers) {
          return new APIConnectionError({ message, cause: castToError(errorResponse) });
        }
        const error = errorResponse;
        if (status === 400) {
          return new BadRequestError(status, error, message, headers);
        }
        if (status === 401) {
          return new AuthenticationError(status, error, message, headers);
        }
        if (status === 403) {
          return new PermissionDeniedError(status, error, message, headers);
        }
        if (status === 404) {
          return new NotFoundError(status, error, message, headers);
        }
        if (status === 409) {
          return new ConflictError(status, error, message, headers);
        }
        if (status === 422) {
          return new UnprocessableEntityError(status, error, message, headers);
        }
        if (status === 429) {
          return new RateLimitError(status, error, message, headers);
        }
        if (status >= 500) {
          return new InternalServerError(status, error, message, headers);
        }
        return new _APIError(status, error, message, headers);
      }
    };
    APIUserAbortError = class extends APIError {
      constructor({ message } = {}) {
        super(void 0, void 0, message || "Request was aborted.", void 0);
      }
    };
    APIConnectionError = class extends APIError {
      constructor({ message, cause }) {
        super(void 0, void 0, message || "Connection error.", void 0);
        if (cause)
          this.cause = cause;
      }
    };
    APIConnectionTimeoutError = class extends APIConnectionError {
      constructor({ message } = {}) {
        super({ message: message ?? "Request timed out." });
      }
    };
    BadRequestError = class extends APIError {
    };
    AuthenticationError = class extends APIError {
    };
    PermissionDeniedError = class extends APIError {
    };
    NotFoundError = class extends APIError {
    };
    ConflictError = class extends APIError {
    };
    UnprocessableEntityError = class extends APIError {
    };
    RateLimitError = class extends APIError {
    };
    InternalServerError = class extends APIError {
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/values.mjs
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
var startsWithSchemeRegexp, isAbsoluteURL, isArray, isReadonlyArray, validatePositiveInteger, safeJSON;
var init_values = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/values.mjs"() {
    init_error();
    startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
    isAbsoluteURL = (url) => {
      return startsWithSchemeRegexp.test(url);
    };
    isArray = (val) => (isArray = Array.isArray, isArray(val));
    isReadonlyArray = isArray;
    validatePositiveInteger = (name, n2) => {
      if (typeof n2 !== "number" || !Number.isInteger(n2)) {
        throw new LangsmithError(`${name} must be an integer`);
      }
      if (n2 < 0) {
        throw new LangsmithError(`${name} must be a positive integer`);
      }
      return n2;
    };
    safeJSON = (text2) => {
      try {
        return JSON.parse(text2);
      } catch (err) {
        return void 0;
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/sleep.mjs
var sleep;
var init_sleep = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/sleep.mjs"() {
    sleep = (ms) => new Promise((resolve2) => setTimeout(resolve2, ms));
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/version.mjs
var VERSION;
var init_version2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/version.mjs"() {
    VERSION = "0.11.4";
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/detect-platform.mjs
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
var getPlatformProperties, normalizeArch, normalizePlatform, _platformHeaders, getPlatformHeaders;
var init_detect_platform = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/detect-platform.mjs"() {
    init_version2();
    getPlatformProperties = () => {
      const detectedPlatform = getDetectedPlatform();
      if (detectedPlatform === "deno") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": normalizePlatform(Deno.build.os),
          "X-Stainless-Arch": normalizeArch(Deno.build.arch),
          "X-Stainless-Runtime": "deno",
          "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
        };
      }
      if (typeof EdgeRuntime !== "undefined") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": `other:${EdgeRuntime}`,
          "X-Stainless-Runtime": "edge",
          "X-Stainless-Runtime-Version": globalThis.process.version
        };
      }
      if (detectedPlatform === "node") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
          "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
          "X-Stainless-Runtime": "node",
          "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
        };
      }
      const browserInfo = getBrowserInfo();
      if (browserInfo) {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": "unknown",
          "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
          "X-Stainless-Runtime-Version": browserInfo.version
        };
      }
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": VERSION,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": "unknown",
        "X-Stainless-Runtime": "unknown",
        "X-Stainless-Runtime-Version": "unknown"
      };
    };
    normalizeArch = (arch) => {
      if (arch === "x32")
        return "x32";
      if (arch === "x86_64" || arch === "x64")
        return "x64";
      if (arch === "arm")
        return "arm";
      if (arch === "aarch64" || arch === "arm64")
        return "arm64";
      if (arch)
        return `other:${arch}`;
      return "unknown";
    };
    normalizePlatform = (platform) => {
      platform = platform.toLowerCase();
      if (platform.includes("ios"))
        return "iOS";
      if (platform === "android")
        return "Android";
      if (platform === "darwin")
        return "MacOS";
      if (platform === "win32")
        return "Windows";
      if (platform === "freebsd")
        return "FreeBSD";
      if (platform === "openbsd")
        return "OpenBSD";
      if (platform === "linux")
        return "Linux";
      if (platform)
        return `Other:${platform}`;
      return "Unknown";
    };
    getPlatformHeaders = () => {
      return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/shims.mjs
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new Langsmith({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function makeReadableStream(...args) {
  const ReadableStream2 = globalThis.ReadableStream;
  if (typeof ReadableStream2 === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream2(...args);
}
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {
    },
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
function ReadableStreamToAsyncIterable(stream) {
  if (stream[Symbol.asyncIterator])
    return stream;
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function CancelReadableStream(stream) {
  if (stream === null || typeof stream !== "object")
    return;
  if (stream[Symbol.asyncIterator]) {
    await stream[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}
var init_shims = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/shims.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/request-options.mjs
var FallbackEncoder;
var init_request_options = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/request-options.mjs"() {
    FallbackEncoder = ({ headers, body }) => {
      return {
        bodyHeaders: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      };
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/qs/formats.mjs
var default_format, default_formatter, formatters, RFC1738;
var init_formats = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/qs/formats.mjs"() {
    default_format = "RFC3986";
    default_formatter = (v) => String(v);
    formatters = {
      RFC1738: (v) => String(v).replace(/%20/g, "+"),
      RFC3986: default_formatter
    };
    RFC1738 = "RFC1738";
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/qs/utils.mjs
function is_buffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
}
function maybe_map(val, fn) {
  if (isArray(val)) {
    const mapped = [];
    for (let i = 0; i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
}
var has, hex_table, limit, encode;
var init_utils = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/qs/utils.mjs"() {
    init_formats();
    init_values();
    has = (obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key));
    hex_table = /* @__PURE__ */ (() => {
      const array = [];
      for (let i = 0; i < 256; ++i) {
        array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
      }
      return array;
    })();
    limit = 1024;
    encode = (str, _defaultEncoder, charset, _kind, format) => {
      if (str.length === 0) {
        return str;
      }
      let string = str;
      if (typeof str === "symbol") {
        string = Symbol.prototype.toString.call(str);
      } else if (typeof str !== "string") {
        string = String(str);
      }
      if (charset === "iso-8859-1") {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
          return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
        });
      }
      let out = "";
      for (let j = 0; j < string.length; j += limit) {
        const segment = string.length >= limit ? string.slice(j, j + limit) : string;
        const arr2 = [];
        for (let i = 0; i < segment.length; ++i) {
          let c = segment.charCodeAt(i);
          if (c === 45 || // -
          c === 46 || // .
          c === 95 || // _
          c === 126 || // ~
          c >= 48 && c <= 57 || // 0-9
          c >= 65 && c <= 90 || // a-z
          c >= 97 && c <= 122 || // A-Z
          format === RFC1738 && (c === 40 || c === 41)) {
            arr2[arr2.length] = segment.charAt(i);
            continue;
          }
          if (c < 128) {
            arr2[arr2.length] = hex_table[c];
            continue;
          }
          if (c < 2048) {
            arr2[arr2.length] = hex_table[192 | c >> 6] + hex_table[128 | c & 63];
            continue;
          }
          if (c < 55296 || c >= 57344) {
            arr2[arr2.length] = hex_table[224 | c >> 12] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
            continue;
          }
          i += 1;
          c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
          arr2[arr2.length] = hex_table[240 | c >> 18] + hex_table[128 | c >> 12 & 63] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
        }
        out += arr2.join("");
      }
      return out;
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/qs/stringify.mjs
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
function inner_stringify(object2, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder3, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object2;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== void 0 && !find_flag) {
    const pos = tmp_sc.get(object2);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        find_flag = true;
      }
    }
    if (typeof tmp_sc.get(sentinel) === "undefined") {
      step = 0;
    }
  }
  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate?.(obj);
  } else if (generateArrayPrefix === "comma" && isArray(obj)) {
    obj = maybe_map(obj, function(value) {
      if (value instanceof Date) {
        return serializeDate?.(value);
      }
      return value;
    });
  }
  if (obj === null) {
    if (strictNullHandling) {
      return encoder3 && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder3(prefix, defaults.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder3) {
      const key_value = encodeValuesOnly ? prefix : encoder3(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder3(obj, defaults.encoder, charset, "value", format))
      ];
    }
    return [formatter?.(prefix) + "=" + formatter?.(String(obj))];
  }
  const values = [];
  if (typeof obj === "undefined") {
    return values;
  }
  let obj_keys;
  if (generateArrayPrefix === "comma" && isArray(obj)) {
    if (encodeValuesOnly && encoder3) {
      obj = maybe_map(obj, encoder3);
    }
    obj_keys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
  } else if (isArray(filter)) {
    obj_keys = filter;
  } else {
    const keys = Object.keys(obj);
    obj_keys = sort ? keys.sort(sort) : keys;
  }
  const encoded_prefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
  const adjusted_prefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encoded_prefix + "[]" : encoded_prefix;
  if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
    return adjusted_prefix + "[]";
  }
  for (let j = 0; j < obj_keys.length; ++j) {
    const key = obj_keys[j];
    const value = (
      // @ts-ignore
      typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key]
    );
    if (skipNulls && value === null) {
      continue;
    }
    const encoded_key = allowDots && encodeDotInKeys ? key.replace(/\./g, "%2E") : key;
    const key_prefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjusted_prefix, encoded_key) : adjusted_prefix : adjusted_prefix + (allowDots ? "." + encoded_key : "[" + encoded_key + "]");
    sideChannel.set(object2, step);
    const valueSideChannel = /* @__PURE__ */ new WeakMap();
    valueSideChannel.set(sentinel, sideChannel);
    push_to_array(values, inner_stringify(
      value,
      key_prefix,
      generateArrayPrefix,
      commaRoundTrip,
      allowEmptyArrays,
      strictNullHandling,
      skipNulls,
      encodeDotInKeys,
      // @ts-ignore
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder3,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      valueSideChannel
    ));
  }
  return values;
}
function normalize_stringify_options(opts = defaults) {
  if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  }
  if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  }
  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }
  const charset = opts.charset || defaults.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  let format = default_format;
  if (typeof opts.format !== "undefined") {
    if (!has(formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  const formatter = formatters[format];
  let filter = defaults.filter;
  if (typeof opts.filter === "function" || isArray(opts.filter)) {
    filter = opts.filter;
  }
  let arrayFormat;
  if (opts.arrayFormat && opts.arrayFormat in array_prefix_generators) {
    arrayFormat = opts.arrayFormat;
  } else if ("indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = defaults.arrayFormat;
  }
  if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  const allowDots = typeof opts.allowDots === "undefined" ? !!opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
    // @ts-ignore
    allowDots,
    allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
    arrayFormat,
    charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
    commaRoundTrip: !!opts.commaRoundTrip,
    delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
    encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
    filter,
    format,
    formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
    // @ts-ignore
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
  };
}
function stringify(object2, opts = {}) {
  let obj = object2;
  const options = normalize_stringify_options(opts);
  let obj_keys;
  let filter;
  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray(options.filter)) {
    filter = options.filter;
    obj_keys = filter;
  }
  const keys = [];
  if (typeof obj !== "object" || obj === null) {
    return "";
  }
  const generateArrayPrefix = array_prefix_generators[options.arrayFormat];
  const commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
  if (!obj_keys) {
    obj_keys = Object.keys(obj);
  }
  if (options.sort) {
    obj_keys.sort(options.sort);
  }
  const sideChannel = /* @__PURE__ */ new WeakMap();
  for (let i = 0; i < obj_keys.length; ++i) {
    const key = obj_keys[i];
    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    push_to_array(keys, inner_stringify(
      obj[key],
      key,
      // @ts-expect-error
      generateArrayPrefix,
      commaRoundTrip,
      options.allowEmptyArrays,
      options.strictNullHandling,
      options.skipNulls,
      options.encodeDotInKeys,
      options.encode ? options.encoder : null,
      options.filter,
      options.sort,
      options.allowDots,
      options.serializeDate,
      options.format,
      options.formatter,
      options.encodeValuesOnly,
      options.charset,
      sideChannel
    ));
  }
  const joined = keys.join(options.delimiter);
  let prefix = options.addQueryPrefix === true ? "?" : "";
  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      prefix += "utf8=%26%2310003%3B&";
    } else {
      prefix += "utf8=%E2%9C%93&";
    }
  }
  return joined.length > 0 ? prefix + joined : "";
}
var array_prefix_generators, push_to_array, toISOString, defaults, sentinel;
var init_stringify2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/qs/stringify.mjs"() {
    init_utils();
    init_formats();
    init_values();
    array_prefix_generators = {
      brackets(prefix) {
        return String(prefix) + "[]";
      },
      comma: "comma",
      indices(prefix, key) {
        return String(prefix) + "[" + key + "]";
      },
      repeat(prefix) {
        return String(prefix);
      }
    };
    push_to_array = function(arr2, value_or_array) {
      Array.prototype.push.apply(arr2, isArray(value_or_array) ? value_or_array : [value_or_array]);
    };
    defaults = {
      addQueryPrefix: false,
      allowDots: false,
      allowEmptyArrays: false,
      arrayFormat: "indices",
      charset: "utf-8",
      charsetSentinel: false,
      delimiter: "&",
      encode: true,
      encodeDotInKeys: false,
      encoder: encode,
      encodeValuesOnly: false,
      format: default_format,
      formatter: default_formatter,
      /** @deprecated */
      indices: false,
      serializeDate(date) {
        return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date);
      },
      skipNulls: false,
      strictNullHandling: false
    };
    sentinel = {};
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/query.mjs
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "repeat" });
}
var init_query = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/query.mjs"() {
    init_stringify2();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/bytes.mjs
function concatBytes(buffers) {
  let length = 0;
  for (const buffer of buffers) {
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers) {
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
function encodeUTF8(str) {
  let encoder3;
  return (encodeUTF8_ ?? (encoder3 = new globalThis.TextEncoder(), encodeUTF8_ = encoder3.encode.bind(encoder3)))(str);
}
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}
var encodeUTF8_, decodeUTF8_;
var init_bytes = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/bytes.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/decoders/line.mjs
function findNewlineIndex(buffer, startIndex) {
  const newline = 10;
  const carriage = 13;
  for (let i = startIndex ?? 0; i < buffer.length; i++) {
    if (buffer[i] === newline) {
      return { preceding: i, index: i + 1, carriage: false };
    }
    if (buffer[i] === carriage) {
      return { preceding: i, index: i + 1, carriage: true };
    }
  }
  return null;
}
function findDoubleNewlineIndex(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
}
var _LineDecoder_buffer, _LineDecoder_carriageReturnIndex, LineDecoder;
var init_line = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/decoders/line.mjs"() {
    init_tslib();
    init_bytes();
    LineDecoder = class {
      constructor() {
        _LineDecoder_buffer.set(this, void 0);
        _LineDecoder_carriageReturnIndex.set(this, void 0);
        __classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array(), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
      }
      decode(chunk) {
        if (chunk == null) {
          return [];
        }
        const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
        __classPrivateFieldSet(this, _LineDecoder_buffer, concatBytes([__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
        const lines2 = [];
        let patternIndex;
        while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
          if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
            __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
            continue;
          }
          if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
            lines2.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
            __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
            __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
            continue;
          }
          const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
          const line = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
          lines2.push(line);
          __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
          __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        }
        return lines2;
      }
      flush() {
        if (!__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
          return [];
        }
        return this.decode("\n");
      }
    };
    _LineDecoder_buffer = /* @__PURE__ */ new WeakMap(), _LineDecoder_carriageReturnIndex = /* @__PURE__ */ new WeakMap();
    Object.defineProperty(LineDecoder, "NEWLINE_CHARS", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set(["\n", "\r"])
    });
    Object.defineProperty(LineDecoder, "NEWLINE_REGEXP", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /\r\n|[\n\r]/g
    });
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/log.mjs
function noop() {
}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
var levelNumbers, parseLogLevel, noopLogger, cachedLoggers, formatRequestDetails;
var init_log = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/log.mjs"() {
    init_values();
    levelNumbers = {
      off: 0,
      error: 200,
      warn: 300,
      info: 400,
      debug: 500
    };
    parseLogLevel = (maybeLevel, sourceName, client) => {
      if (!maybeLevel) {
        return void 0;
      }
      if (hasOwn(levelNumbers, maybeLevel)) {
        return maybeLevel;
      }
      loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
      return void 0;
    };
    noopLogger = {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop
    };
    cachedLoggers = /* @__PURE__ */ new WeakMap();
    formatRequestDetails = (details) => {
      if (details.options) {
        details.options = { ...details.options };
        delete details.options["headers"];
      }
      if (details.headers) {
        details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
          name,
          name.toLowerCase() === "authorization" || name.toLowerCase() === "api-key" || name.toLowerCase() === "x-api-key" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" || name.toLowerCase() === "x-tenant-id" ? "***" : value
        ]));
      }
      if ("retryOfRequestLogID" in details) {
        if (details.retryOfRequestLogID) {
          details.retryOf = details.retryOfRequestLogID;
        }
        delete details.retryOfRequestLogID;
      }
      return details;
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/streaming.mjs
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
      throw new LangsmithError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
    }
    throw new LangsmithError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();
  const iter = ReadableStreamToAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array();
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}
function partition(str, delimiter) {
  const index = str.indexOf(delimiter);
  if (index !== -1) {
    return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
  }
  return [str, "", ""];
}
var _Stream_client, Stream, SSEDecoder;
var init_streaming = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/streaming.mjs"() {
    init_tslib();
    init_error();
    init_shims();
    init_line();
    init_shims();
    init_errors();
    init_values();
    init_bytes();
    init_log();
    init_error();
    Stream = class _Stream {
      constructor(iterator, controller, client) {
        Object.defineProperty(this, "iterator", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: iterator
        });
        Object.defineProperty(this, "controller", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        _Stream_client.set(this, void 0);
        this.controller = controller;
        __classPrivateFieldSet(this, _Stream_client, client, "f");
      }
      static fromSSEResponse(response, controller, client) {
        let consumed = false;
        const logger = client ? loggerFor(client) : console;
        async function* iterator() {
          if (consumed) {
            throw new LangsmithError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const sse of _iterSSEMessages(response, controller)) {
              if (sse.event === "end") {
                break;
              }
              if (sse.event === "error") {
                throw new APIError(void 0, safeJSON(sse.data) ?? sse.data, void 0, response.headers);
              }
              if (sse.event === "data") {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              } else {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              }
            }
            done = true;
          } catch (e) {
            if (isAbortError(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
          }
        }
        return new _Stream(iterator, controller, client);
      }
      /**
       * Generates a Stream from a newline-separated ReadableStream
       * where each item is a JSON value.
       */
      static fromReadableStream(readableStream, controller, client) {
        let consumed = false;
        async function* iterLines() {
          const lineDecoder = new LineDecoder();
          const iter = ReadableStreamToAsyncIterable(readableStream);
          for await (const chunk of iter) {
            for (const line of lineDecoder.decode(chunk)) {
              yield line;
            }
          }
          for (const line of lineDecoder.flush()) {
            yield line;
          }
        }
        async function* iterator() {
          if (consumed) {
            throw new LangsmithError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const line of iterLines()) {
              if (done)
                continue;
              if (line)
                yield JSON.parse(line);
            }
            done = true;
          } catch (e) {
            if (isAbortError(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
          }
        }
        return new _Stream(iterator, controller, client);
      }
      [(_Stream_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        return this.iterator();
      }
      /**
       * Splits the stream into two streams which can be
       * independently read from at different speeds.
       */
      tee() {
        const left = [];
        const right = [];
        const iterator = this.iterator();
        const teeIterator = (queue) => {
          return {
            next: () => {
              if (queue.length === 0) {
                const result = iterator.next();
                left.push(result);
                right.push(result);
              }
              return queue.shift();
            }
          };
        };
        return [
          new _Stream(() => teeIterator(left), this.controller, __classPrivateFieldGet(this, _Stream_client, "f")),
          new _Stream(() => teeIterator(right), this.controller, __classPrivateFieldGet(this, _Stream_client, "f"))
        ];
      }
      /**
       * Converts this stream to a newline-separated ReadableStream of
       * JSON stringified values in the stream
       * which can be turned back into a Stream with `Stream.fromReadableStream()`.
       */
      toReadableStream() {
        const self = this;
        let iter;
        return makeReadableStream({
          async start() {
            iter = self[Symbol.asyncIterator]();
          },
          async pull(ctrl) {
            try {
              const { value, done } = await iter.next();
              if (done)
                return ctrl.close();
              const bytes = encodeUTF8(JSON.stringify(value) + "\n");
              ctrl.enqueue(bytes);
            } catch (err) {
              ctrl.error(err);
            }
          },
          async cancel() {
            await iter.return?.();
          }
        });
      }
    };
    SSEDecoder = class {
      constructor() {
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "event", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "chunks", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.event = null;
        this.data = [];
        this.chunks = [];
      }
      decode(line) {
        if (line.endsWith("\r")) {
          line = line.substring(0, line.length - 1);
        }
        if (!line) {
          if (!this.event && !this.data.length)
            return null;
          const sse = {
            event: this.event,
            data: this.data.join("\n"),
            raw: this.chunks
          };
          this.event = null;
          this.data = [];
          this.chunks = [];
          return sse;
        }
        this.chunks.push(line);
        if (line.startsWith(":")) {
          return null;
        }
        let [fieldname, _, value] = partition(line, ":");
        if (value.startsWith(" ")) {
          value = value.substring(1);
        }
        if (fieldname === "event") {
          this.event = value;
        } else if (fieldname === "data") {
          this.data.push(value);
        }
        return null;
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/parse.mjs
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
    if (props.options.stream) {
      loggerFor(client).debug("response", response.status, response.url, response.headers, response.body);
      if (props.options.__streamClass) {
        return props.options.__streamClass.fromSSEResponse(response, props.controller, client);
      }
      return Stream.fromSSEResponse(response, props.controller, client);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0") {
        return void 0;
      }
      const json = await response.json();
      return json;
    }
    const text2 = await response.text();
    return text2;
  })();
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}
var init_parse2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/parse.mjs"() {
    init_streaming();
    init_log();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/api-promise.mjs
var _APIPromise_client, APIPromise;
var init_api_promise = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/api-promise.mjs"() {
    init_tslib();
    init_parse2();
    APIPromise = class _APIPromise extends Promise {
      constructor(client, responsePromise, parseResponse = defaultParseResponse) {
        super((resolve2) => {
          resolve2(null);
        });
        Object.defineProperty(this, "responsePromise", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: responsePromise
        });
        Object.defineProperty(this, "parseResponse", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: parseResponse
        });
        Object.defineProperty(this, "parsedPromise", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        _APIPromise_client.set(this, void 0);
        __classPrivateFieldSet(this, _APIPromise_client, client, "f");
      }
      _thenUnwrap(transform) {
        return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => transform(await this.parseResponse(client, props), props));
      }
      /**
       * Gets the raw `Response` instance instead of parsing the response
       * data.
       *
       * If you want to parse the response body but still get the `Response`
       * instance, you can use {@link withResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      asResponse() {
        return this.responsePromise.then((p) => p.response);
      }
      /**
       * Gets the parsed response data and the raw `Response` instance.
       *
       * If you just want to get the raw `Response` instance without parsing it,
       * you can use {@link asResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      async withResponse() {
        const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
        return { data, response };
      }
      parse() {
        if (!this.parsedPromise) {
          this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
        }
        return this.parsedPromise;
      }
      then(onfulfilled, onrejected) {
        return this.parse().then(onfulfilled, onrejected);
      }
      catch(onrejected) {
        return this.parse().catch(onrejected);
      }
      finally(onfinally) {
        return this.parse().finally(onfinally);
      }
    };
    _APIPromise_client = /* @__PURE__ */ new WeakMap();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/pagination.mjs
var _AbstractPage_client, AbstractPage, PagePromise, OffsetPaginationTopLevelArray, OffsetPaginationIssues, OffsetPaginationOnlineEvaluators, ItemsCursorPostPagination, ItemsCursorGetPagination;
var init_pagination = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/pagination.mjs"() {
    init_tslib();
    init_error();
    init_parse2();
    init_api_promise();
    init_values();
    AbstractPage = class {
      constructor(client, response, body, options) {
        _AbstractPage_client.set(this, void 0);
        Object.defineProperty(this, "options", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "response", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "body", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
        this.options = options;
        this.response = response;
        this.body = body;
      }
      hasNextPage() {
        const items = this.getPaginatedItems();
        if (!items.length)
          return false;
        return this.nextPageRequestOptions() != null;
      }
      async getNextPage() {
        const nextOptions = this.nextPageRequestOptions();
        if (!nextOptions) {
          throw new LangsmithError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
        }
        return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
      }
      async *iterPages() {
        let page = this;
        yield page;
        while (page.hasNextPage()) {
          page = await page.getNextPage();
          yield page;
        }
      }
      async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        for await (const page of this.iterPages()) {
          for (const item of page.getPaginatedItems()) {
            yield item;
          }
        }
      }
    };
    PagePromise = class extends APIPromise {
      constructor(client, request, Page) {
        super(client, request, async (client2, props) => new Page(client2, props.response, await defaultParseResponse(client2, props), props.options));
      }
      /**
       * Allow auto-paginating iteration on an unawaited list call, eg:
       *
       *    for await (const item of client.items.list()) {
       *      console.log(item)
       *    }
       */
      async *[Symbol.asyncIterator]() {
        const page = await this;
        for await (const item of page) {
          yield item;
        }
      }
    };
    OffsetPaginationTopLevelArray = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        Object.defineProperty(this, "items", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.items = body || [];
      }
      getPaginatedItems() {
        return this.items ?? [];
      }
      nextPageRequestOptions() {
        const offset = this.options.query.offset ?? 0;
        const length = this.getPaginatedItems().length;
        const currentCount = offset + length;
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            offset: currentCount
          }
        };
      }
    };
    OffsetPaginationIssues = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        Object.defineProperty(this, "items", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.items = body || [];
      }
      getPaginatedItems() {
        return this.items ?? [];
      }
      nextPageRequestOptions() {
        const offset = this.options.query.offset ?? 0;
        const length = this.getPaginatedItems().length;
        const currentCount = offset + length;
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            offset: currentCount
          }
        };
      }
    };
    OffsetPaginationOnlineEvaluators = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        Object.defineProperty(this, "evaluators", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "total", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.evaluators = body.evaluators || [];
        this.total = body.total || 0;
      }
      getPaginatedItems() {
        return this.evaluators ?? [];
      }
      nextPageRequestOptions() {
        const offset = this.options.query.offset ?? 0;
        const length = this.getPaginatedItems().length;
        const currentCount = offset + length;
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            offset: currentCount
          }
        };
      }
    };
    ItemsCursorPostPagination = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        Object.defineProperty(this, "items", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "next_cursor", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.items = body.items || [];
        this.next_cursor = body.next_cursor || "";
      }
      getPaginatedItems() {
        return this.items ?? [];
      }
      nextPageRequestOptions() {
        const cursor = this.next_cursor;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          body: {
            ...maybeObj(this.options.body),
            cursor
          }
        };
      }
    };
    ItemsCursorGetPagination = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        Object.defineProperty(this, "items", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "next_cursor", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.items = body.items || [];
        this.next_cursor = body.next_cursor || "";
      }
      getPaginatedItems() {
        return this.items ?? [];
      }
      nextPageRequestOptions() {
        const cursor = this.next_cursor;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            cursor
          }
        };
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/uploads.mjs
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value) {
  return (typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "").split(/[\\/]/).pop() || void 0;
}
var checkFileSupport, isAsyncIterable;
var init_uploads = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/uploads.mjs"() {
    init_shims();
    checkFileSupport = () => {
      if (typeof File === "undefined") {
        const { process: process2 } = globalThis;
        const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
        throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
      }
    };
    isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/to-file.mjs
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  if (isFileLike(value)) {
    if (value instanceof File) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], value.name);
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  name || (name = getName(value));
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
  value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}
var isBlobLike, isFileLike, isResponseLike;
var init_to_file = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/to-file.mjs"() {
    init_uploads();
    init_uploads();
    isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
    isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
    isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/uploads.mjs
var init_uploads2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/uploads.mjs"() {
    init_to_file();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/shared.mjs
var init_shared = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/shared.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/resource.mjs
var APIResource;
var init_resource = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/resource.mjs"() {
    APIResource = class {
      constructor(client) {
        Object.defineProperty(this, "_client", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this._client = client;
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/headers.mjs
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === void 0)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, null];
      }
      yield [name, value];
    }
  }
}
var brand_privateNullableHeaders, buildHeaders;
var init_headers = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/headers.mjs"() {
    init_values();
    brand_privateNullableHeaders = /* @__PURE__ */ Symbol("brand.privateNullableHeaders");
    buildHeaders = (newHeaders) => {
      const targetHeaders = new Headers();
      const nullHeaders = /* @__PURE__ */ new Set();
      for (const headers of newHeaders) {
        const seenHeaders = /* @__PURE__ */ new Set();
        for (const [name, value] of iterateHeaders(headers)) {
          const lowerName = name.toLowerCase();
          if (!seenHeaders.has(lowerName)) {
            targetHeaders.delete(name);
            seenHeaders.add(lowerName);
          }
          if (value === null) {
            targetHeaders.delete(name);
            nullHeaders.add(lowerName);
          } else {
            targetHeaders.append(name, value);
            nullHeaders.delete(lowerName);
          }
        }
      }
      return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/path.mjs
function encodeURIPath(str) {
  return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY, createPathTagFunction, path2;
var init_path = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/path.mjs"() {
    init_error();
    EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
    createPathTagFunction = (pathEncoder = encodeURIPath) => function path4(statics, ...params) {
      if (statics.length === 1)
        return statics[0];
      let postPath = false;
      const invalidSegments = [];
      const path5 = statics.reduce((previousValue, currentValue, index) => {
        if (/[?#]/.test(currentValue)) {
          postPath = true;
        }
        const value = params[index];
        let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
        if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
        value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
          encoded = value + "";
          invalidSegments.push({
            start: previousValue.length + currentValue.length,
            length: encoded.length,
            error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
          });
        }
        return previousValue + currentValue + (index === params.length ? "" : encoded);
      }, "");
      const pathOnly = path5.split(/[?#]/, 1)[0];
      const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
      let match;
      while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
        invalidSegments.push({
          start: match.index,
          length: match[0].length,
          error: `Value "${match[0]}" can't be safely passed as a path parameter`
        });
      }
      invalidSegments.sort((a, b) => a.start - b.start);
      if (invalidSegments.length > 0) {
        let lastEnd = 0;
        const underline = invalidSegments.reduce((acc, segment) => {
          const spaces = " ".repeat(segment.start - lastEnd);
          const arrows = "^".repeat(segment.length);
          lastEnd = segment.start + segment.length;
          return acc + spaces + arrows;
        }, "");
        throw new LangsmithError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path5}
${underline}`);
      }
      return path5;
    };
    path2 = /* @__PURE__ */ createPathTagFunction(encodeURIPath);
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/agents.mjs
var Agents;
var init_agents = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/agents.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Agents = class extends APIResource {
      /**
       * Creates an Agent with a caller-assigned ID. Returns 409 if the ID already
       * exists. Creates all four environments unless production_only is set for a FLEET
       * agent. source_type defaults to EXTERNAL in this SDK. agent_type defaults to
       * CUSTOM. The authenticated user becomes the owner
       * when available. Requires permission to create projects. The response does not
       * include runtime bindings.
       */
      create(body, options) {
        return this._client.post("/api/v1/agents", {
          body: { ...body, source_type: body.source_type === void 0 ? "EXTERNAL" : body.source_type },
          ...options
        });
      }
      /**
       * Returns an Agent with the environments visible to the caller. The path value is
       * the user-assigned Agent ID. Pass include=runtime_bindings to embed each
       * environment's runtime bindings.
       */
      retrieve(agentID, query = {}, options) {
        return this._client.get(path2`/api/v1/agents/${agentID}`, { query, ...options });
      }
      /**
       * Updates an Agent's name, source_type, agent_type, or owner_id. Omitted fields
       * keep their values. Changing or clearing owner_id additionally requires
       * workspaces:manage; assigning an owner also requires workspaces:read and active
       * workspace membership. Fleet ownership cannot be changed through this endpoint.
       * Changing agent_type requires workspaces:manage in addition to project update
       * access; repeating the current type is a no-op. Source type can change only for
       * an EXTERNAL Agent without runtime bindings. The id is immutable and is rejected
       * when present. Requires update permission on every environment project.
       */
      update(agentID, body, options) {
        return this._client.patch(path2`/api/v1/agents/${agentID}`, { body, ...options });
      }
      /**
       * Returns Agents visible to the caller. Each item is the same Agent shape as GET
       * /api/v1/agents/{agent_id}, including the environments the caller may read. The
       * list never embeds runtime bindings. An unknown query parameter, including limit,
       * returns 400; use page_size to set the page size.
       */
      list(query = {}, options) {
        return this._client.getAPIList("/api/v1/agents", ItemsCursorGetPagination, { query, ...options });
      }
      /**
       * Permanently deletes an Agent, along with its environments, runtime bindings,
       * runtimes, and tracing projects. This cannot be undone. Deleting an Agent that
       * does not exist returns 204.
       */
      delete(agentID, options) {
        return this._client.delete(path2`/api/v1/agents/${agentID}`, {
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/annotation-queues/items.mjs
var Items;
var init_items = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/annotation-queues/items.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    Items = class extends APIResource {
      /**
       * Add RUN or THREAD items to a single annotation queue. RUN items require run_id
       * unless they are created from a suggested example. THREAD items require thread_id
       * and project_id.
       */
      create(queueID, params, options) {
        const { extend_trace_retention, ...body } = params;
        return this._client.post(path2`/api/v1/platform/annotation-queues/${queueID}/items`, {
          query: { extend_trace_retention },
          body,
          ...options
        });
      }
      /**
       * Partially update mutable timestamps (added_at, last_reviewed_time) for a RUN or
       * THREAD annotation queue item. Omit a field, or pass JSON null, to leave it
       * unchanged.
       */
      update(itemID, params, options) {
        const { queue_id, ...body } = params;
        return this._client.patch(path2`/api/v1/platform/annotation-queues/${queue_id}/items/${itemID}`, {
          body,
          ...options
        });
      }
      /**
       * List RUN and THREAD items in a single annotation queue for one review status
       * section, with opaque cursor pagination. Optional item_type=RUN|THREAD filters
       * the page. Optional min_start_time/max_start_time bound the item's trace start
       * time; items with no start time are excluded when either bound is set.
       * direction=backward returns items before the supplied cursor. The response
       * contains item metadata only, not expanded run or thread payloads.
       * status=archived returns items whose queue review requirements have been
       * satisfied, not merely items the caller personally marked completed.
       */
      list(queueID, query, options) {
        return this._client.getAPIList(path2`/api/v1/platform/annotation-queues/${queueID}/items`, ItemsCursorGetPagination, { query, ...options });
      }
      /**
       * Log the caller's reviewer status for a RUN or THREAD annotation queue item. A
       * null status re-shows the item for this reviewer.
       */
      createStatus(queueItemID, body, options) {
        return this._client.post(path2`/api/v1/platform/annotation-queues/items/${queueItemID}/status`, {
          body,
          ...options
        });
      }
      /**
       * Remove RUN or THREAD items from a single annotation queue by item ID. Both
       * active and completed items can be removed.
       */
      deleteAll(queueID, body, options) {
        return this._client.post(path2`/api/v1/platform/annotation-queues/${queueID}/items/delete`, {
          body,
          ...options
        });
      }
      /**
       * Returns the number of annotation queue items in one status bucket. The two time
       * windows are independent: start_time/end_time bound when an item was archived,
       * min_start_time/max_start_time bound when its trace ran. Items with no trace
       * start time are excluded when either of the latter is set.
       */
      retrieveCount(queueID, query, options) {
        return this._client.get(path2`/api/v1/platform/annotation-queues/${queueID}/items/count`, {
          query,
          ...options
        });
      }
      /**
       * Resolve a RUN or THREAD item to its current review section and zero-based
       * position for deep linking. The returned cursor counts RUN and THREAD items
       * together, so it is only valid for a list request with no item_type or start-time
       * filter.
       */
      retrievePlacement(itemID, params, options) {
        const { queue_id } = params;
        return this._client.get(path2`/api/v1/platform/annotation-queues/${queue_id}/items/${itemID}/placement`, options);
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/annotation-queues/runs.mjs
var Runs;
var init_runs = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/annotation-queues/runs.mjs"() {
    init_resource();
    init_path();
    Runs = class extends APIResource {
      /**
       * Add Runs To Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items create endpoint (POST /api/v1/platform/annotation-queues/{queue_id}/items) instead. Will be removed after Jan 31, 2027.
       */
      create(queueID, params, options) {
        const { body, extend_trace_retention } = params;
        return this._client.post(path2`/api/v1/annotation-queues/${queueID}/runs`, {
          query: { extend_trace_retention },
          body,
          ...options
        });
      }
      /**
       * Update Run In Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items update method (PATCH /api/v1/platform/annotation-queues/{queue_id}/items/{item_id}) instead. Will be removed after Jan 31, 2027.
       */
      update(queueRunID, params, options) {
        const { queue_id, ...body } = params;
        return this._client.patch(path2`/api/v1/annotation-queues/${queue_id}/runs/${queueRunID}`, {
          body,
          ...options
        });
      }
      /**
       * Get Runs From Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items list method (GET /api/v1/platform/annotation-queues/{queue_id}/items) instead. Will be removed after Jan 31, 2027.
       */
      list(queueID, query = {}, options) {
        return this._client.get(path2`/api/v1/annotation-queues/${queueID}/runs`, { query, ...options });
      }
      /**
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @deprecated Deprecated: use the annotation queue items create endpoint (POST /api/v1/platform/annotation-queues/{queue_id}/items) instead. Will be removed after Jan 31, 2027.
       */
      createByKey(queueID, params, options) {
        const { body, extend_trace_retention } = params;
        return this._client.post(path2`/api/v1/annotation-queues/${queueID}/runs/by-key`, {
          query: { extend_trace_retention },
          body,
          ...options
        });
      }
      /**
       * Delete Runs From Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items delete_all method (POST /api/v1/platform/annotation-queues/{queue_id}/items/delete) instead. Will be removed after Jan 31, 2027.
       */
      deleteAll(queueID, body, options) {
        return this._client.post(path2`/api/v1/annotation-queues/${queueID}/runs/delete`, { body, ...options });
      }
      /**
       * Delete Run From Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items delete_all method (POST /api/v1/platform/annotation-queues/{queue_id}/items/delete) with the item ID instead. Will be removed after Jan 31, 2027.
       */
      deleteQueue(queueRunID, params, options) {
        const { queue_id } = params;
        return this._client.delete(path2`/api/v1/annotation-queues/${queue_id}/runs/${queueRunID}`, options);
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/annotation-queues/annotation-queues.mjs
var AnnotationQueues;
var init_annotation_queues = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/annotation-queues/annotation-queues.mjs"() {
    init_resource();
    init_items();
    init_items();
    init_runs();
    init_runs();
    init_pagination();
    init_path();
    AnnotationQueues = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "runs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Runs(this._client)
        });
        Object.defineProperty(this, "items", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Items(this._client)
        });
      }
      /**
       * Get Annotation Queue
       */
      retrieve(queueID, options) {
        return this._client.get(path2`/api/v1/annotation-queues/${queueID}`, options);
      }
      /**
       * Update Annotation Queue
       */
      update(queueID, body, options) {
        return this._client.patch(path2`/api/v1/annotation-queues/${queueID}`, { body, ...options });
      }
      /**
       * Delete Annotation Queue
       */
      delete(queueID, options) {
        return this._client.delete(path2`/api/v1/annotation-queues/${queueID}`, options);
      }
      /**
       * Create Annotation Queue
       */
      annotationQueues(body, options) {
        return this._client.post("/api/v1/annotation-queues", { body, ...options });
      }
      /**
       * Create Identity Annotation Queue Run Status
       *
       * @deprecated Deprecated: use the annotation queue items create_status method (POST /api/v1/platform/annotation-queues/items/{queue_item_id}/status) instead. Will be removed after Jan 31, 2027.
       */
      createRunStatus(annotationQueueRunID, body, options) {
        return this._client.post(path2`/api/v1/annotation-queues/status/${annotationQueueRunID}`, {
          body,
          ...options
        });
      }
      /**
       * Export Annotation Queue Archived Runs
       */
      export(queueID, body, options) {
        return this._client.post(path2`/api/v1/annotation-queues/${queueID}/export`, { body, ...options });
      }
      /**
       * Populate annotation queue with runs from an experiment.
       */
      populate(body, options) {
        return this._client.post("/api/v1/annotation-queues/populate", { body, ...options });
      }
      /**
       * Get Annotation Queues
       */
      retrieveAnnotationQueues(query = {}, options) {
        return this._client.getAPIList("/api/v1/annotation-queues", OffsetPaginationTopLevelArray, { query, ...options });
      }
      /**
       * Get Annotation Queues For Run
       */
      retrieveQueues(runID, options) {
        return this._client.get(path2`/api/v1/annotation-queues/${runID}/queues`, options);
      }
      /**
       * Get a run from an annotation queue
       *
       * @deprecated Deprecated: use the annotation queue items list and retrieve_placement methods instead, which call GET /api/v1/platform/annotation-queues/{queue_id}/items and GET /api/v1/platform/annotation-queues/{queue_id}/items/{item_id}/placement. Will be removed after Jan 31, 2027.
       */
      retrieveRun(index, params, options) {
        const { queue_id, ...query } = params;
        return this._client.get(path2`/api/v1/annotation-queues/${queue_id}/run/${index}`, { query, ...options });
      }
      /**
       * Get Size From Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items retrieve_count method (GET /api/v1/platform/annotation-queues/{queue_id}/items/count) with the desired status instead. Will be removed after Jan 31, 2027.
       */
      retrieveSize(queueID, query = {}, options) {
        return this._client.get(path2`/api/v1/annotation-queues/${queueID}/size`, { query, ...options });
      }
      /**
       * Get Total Archived From Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items retrieve_count method (GET /api/v1/platform/annotation-queues/{queue_id}/items/count?status=archived) instead. Will be removed after Jan 31, 2027.
       */
      retrieveTotalArchived(queueID, query = {}, options) {
        return this._client.get(path2`/api/v1/annotation-queues/${queueID}/total_archived`, { query, ...options });
      }
      /**
       * Get Total Size From Annotation Queue
       *
       * @deprecated Deprecated: use the annotation queue items retrieve_count method (GET /api/v1/platform/annotation-queues/{queue_id}/items/count?status=all) instead. Will be removed after Jan 31, 2027.
       */
      retrieveTotalSize(queueID, options) {
        return this._client.get(path2`/api/v1/annotation-queues/${queueID}/total_size`, options);
      }
    };
    AnnotationQueues.Runs = Runs;
    AnnotationQueues.Items = Items;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/datasets/examples.mjs
var Examples;
var init_examples = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/datasets/examples.mjs"() {
    init_resource();
    init_headers();
    init_path();
    Examples = class extends APIResource {
      /**
       * Soft-delete an example, preserving prior versions and their attachments. If the
       * latest version is already deleted, the request succeeds without creating another
       * version. Deletion is recorded at the current time or just after the latest
       * version, whichever is later. For future-dated versions, latest reads reflect
       * deletion immediately; timestamp reads reflect deletion only at or after the
       * recorded deletion timestamp.
       */
      delete(exampleID, params, options) {
        const { dataset_id } = params;
        return this._client.delete(path2`/api/v1/platform/datasets/${dataset_id}/examples/${exampleID}`, {
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/datasets/experiment-runs.mjs
var ExperimentRuns;
var init_experiment_runs = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/datasets/experiment-runs.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    ExperimentRuns = class extends APIResource {
      /**
       * Returns a paginated page of dataset examples with runs from the requested
       * experiments. Response uses the canonical `{items, next_cursor}` envelope.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       */
      query(datasetID, body, options) {
        return this._client.getAPIList(path2`/api/v2/datasets/${datasetID}/experiment-runs`, ItemsCursorPostPagination, { body, method: "post", ...options });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/datasets/datasets.mjs
var Datasets;
var init_datasets = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/datasets/datasets.mjs"() {
    init_resource();
    init_examples();
    init_examples();
    init_experiment_runs();
    init_experiment_runs();
    Datasets = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "examples", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Examples(this._client)
        });
        Object.defineProperty(this, "experimentRuns", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new ExperimentRuns(this._client)
        });
      }
    };
    Datasets.Examples = Examples;
    Datasets.ExperimentRuns = ExperimentRuns;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/fleet/threads.mjs
var Threads;
var init_threads = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/fleet/threads.mjs"() {
    init_resource();
    init_path();
    Threads = class extends APIResource {
      /**
       * Starts or resumes the sandbox referenced by the thread and returns when it is
       * ready. The operation is idempotent. The thread must include
       * sandbox.sandbox_slug.
       */
      activateSandbox(threadID, options) {
        return this._client.post(path2`/v1/fleet/threads/${threadID}/sandbox-activation`, options);
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/fleet/fleet.mjs
var Fleet;
var init_fleet = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/fleet/fleet.mjs"() {
    init_resource();
    init_threads();
    init_threads();
    Fleet = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "threads", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Threads(this._client)
        });
      }
    };
    Fleet.Threads = Threads;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/info.mjs
var Info;
var init_info = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/info.mjs"() {
    init_resource();
    Info = class extends APIResource {
      /**
       * Returns information about the current LangSmith deployment: version, instance
       * feature flags, batch-ingest limits, and max SDK versions. Unauthenticated by
       * default; set FF_INFO_ENDPOINT_AUTH_REQUIRED=true to require auth.
       */
      list(options) {
        return this._client.get("/api/v1/info", options);
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/issues.mjs
var Issues;
var init_issues = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/issues.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    Issues = class extends APIResource {
      /**
       * **Beta:** This endpoint is in active development and may change without notice.
       *
       * Returns one issue for the authenticated tenant.
       */
      retrieve(id, query = {}, options) {
        return this._client.get(path2`/api/v1/platform/issues/${id}`, { query, ...options });
      }
      /**
       * **Beta:** This endpoint is in active development and may change without notice.
       *
       * Returns issues for the authenticated tenant, optionally filtered by session,
       * status, severity, tag, linked trace, or last modified time.
       */
      list(query = {}, options) {
        return this._client.getAPIList("/api/v1/platform/issues", OffsetPaginationIssues, {
          query,
          ...options
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/online-evaluators.mjs
var OnlineEvaluators;
var init_online_evaluators = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/online-evaluators.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    OnlineEvaluators = class extends APIResource {
      /**
       * Create a new LLM or code evaluator for the current workspace.
       */
      create(body, options) {
        return this._client.post("/api/v1/platform/evaluators", { body, ...options });
      }
      /**
       * Retrieve a single evaluator by its ID.
       */
      retrieve(evaluatorID, options) {
        return this._client.get(path2`/api/v1/platform/evaluators/${evaluatorID}`, options);
      }
      /**
       * Update an existing evaluator's name, LLM configuration, or code configuration.
       * Returns 409 when a code evaluator build is ENQUEUED or BUILDING.
       */
      update(evaluatorID, body, options) {
        return this._client.patch(path2`/api/v1/platform/evaluators/${evaluatorID}`, { body, ...options });
      }
      /**
       * List evaluators for the current workspace, with optional filtering by type,
       * name, tag, feedback key, or resource ID.
       */
      list(query = {}, options) {
        return this._client.getAPIList("/api/v1/platform/evaluators", OffsetPaginationOnlineEvaluators, { query, ...options });
      }
      /**
       * Delete an evaluator. Returns 409 when a code evaluator build is ENQUEUED or
       * BUILDING, or when run rules still reference the evaluator and delete_run_rules
       * is false. When delete_run_rules is true, all run rules referencing this
       * evaluator are deleted first (same tenant) if the build is not in flight.
       * Associated llm_evaluators and code_evaluators rows are removed by foreign-key
       * cascade when the evaluator row is deleted.
       */
      delete(evaluatorID, params = {}, options) {
        const { delete_run_rules } = params ?? {};
        return this._client.delete(path2`/api/v1/platform/evaluators/${evaluatorID}`, {
          query: { delete_run_rules },
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
      /**
       * Delete multiple evaluators by their IDs. Returns per-item success/failure.
       */
      bulkDelete(params, options) {
        const { evaluator_ids, delete_run_rules } = params;
        return this._client.delete("/api/v1/platform/evaluators", {
          query: { evaluator_ids, delete_run_rules },
          ...options
        });
      }
      /**
       * Returns per-day LLM evaluator spend for the requested 7-day period, grouped by
       * evaluator, resource, or run rule. Exactly one of group_by, evaluator_id,
       * session_id, or dataset_id is required. resource_id, type, feedback_key,
       * tag_value_id, and agent_id may be supplied with group_by to narrow listing
       * aggregations.
       */
      spend(query, options) {
        return this._client.get("/api/v1/platform/evaluators/spend", { query, ...options });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/product-feedback.mjs
var ProductFeedback;
var init_product_feedback = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/product-feedback.mjs"() {
    init_resource();
    init_headers();
    init_path();
    ProductFeedback = class extends APIResource {
      /**
       * **Alpha:** This endpoint is in active development and may change without notice.
       *
       * Submits concise product feedback with optional non-sensitive client details.
       */
      create(params, options) {
        const { "Idempotency-Key": idempotencyKey, ...body } = params;
        return this._client.post("/api/v1/platform/product-feedbacks", {
          body,
          ...options,
          headers: buildHeaders([
            { ...idempotencyKey != null ? { "Idempotency-Key": idempotencyKey } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Alpha:** This endpoint is in active development and may change without notice.
       */
      retrieve(id, options) {
        return this._client.get(path2`/api/v1/platform/product-feedbacks/${id}`, options);
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/prompt-webhooks.mjs
var PromptWebhooks;
var init_prompt_webhooks = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/prompt-webhooks.mjs"() {
    init_resource();
    init_headers();
    init_path();
    PromptWebhooks = class extends APIResource {
      /**
       * Create a new prompt webhook.
       *
       * LangSmith sends a POST request to the webhook URL for each event listed in
       * triggers on the prompts it matches. A workspace can have one prompt webhook
       * unless its limit was raised; creating one past the limit returns 400.
       */
      create(body, options) {
        return this._client.post("/api/v1/prompt-webhooks", { body, ...options });
      }
      /**
       * Get a specific prompt webhook.
       */
      retrieve(webhookID, options) {
        return this._client.get(path2`/api/v1/prompt-webhooks/${webhookID}`, options);
      }
      /**
       * Update a specific prompt webhook.
       *
       * Omitted fields keep their current values; list fields and headers that are set
       * replace the stored values.
       */
      update(webhookID, body, options) {
        return this._client.patch(path2`/api/v1/prompt-webhooks/${webhookID}`, { body, ...options });
      }
      /**
       * List all prompt webhooks for the current tenant.
       */
      list(options) {
        return this._client.get("/api/v1/prompt-webhooks", options);
      }
      /**
       * Delete a specific prompt webhook.
       */
      delete(webhookID, options) {
        return this._client.delete(path2`/api/v1/prompt-webhooks/${webhookID}`, {
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
      /**
       * Test a specific prompt webhook.
       *
       * Sends the sample payload to the webhook configuration in the request body
       * without saving it, but only if the webhook's triggers include the payload's
       * event and its prompt filters match the payload's prompt. Otherwise nothing is
       * sent. Fails if the destination does not accept the payload.
       */
      test(body, options) {
        return this._client.post("/api/v1/prompt-webhooks/test", { body, ...options });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/public/runs.mjs
var Runs2;
var init_runs2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/public/runs.mjs"() {
    init_resource();
    init_headers();
    init_path();
    Runs2 = class extends APIResource {
      /**
       * Returns one run within the trace identified by the share token. The request
       * supplies only the run ID and that run's exact start_time coordinate.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const run = await client.public.runs.retrieve(
       *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *   {
       *     share_token: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *     selects: ['string'],
       *     start_time: '2019-12-27T18:11:19.117Z',
       *   },
       * );
       * ```
       */
      retrieve(runID, params, options) {
        const { share_token, Accept, ...query } = params;
        return this._client.get(path2`/api/v2/public/${share_token}/run/${runID}`, {
          query,
          ...options,
          headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
        });
      }
      /**
       * Returns all runs within the trace identified by the share token. The share token
       * supplies the tenant, project, and trace scope.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const response = await client.public.runs.query(
       *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       * );
       * ```
       */
      query(shareToken, params, options) {
        const { Accept, ...body } = params;
        return this._client.post(path2`/api/v2/public/${shareToken}/runs/query`, {
          body,
          ...options,
          headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/public/public.mjs
var Public;
var init_public = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/public/public.mjs"() {
    init_resource();
    init_runs2();
    init_runs2();
    Public = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "runs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Runs2(this._client)
        });
      }
    };
    Public.Runs = Runs2;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/runs/share.mjs
var Share;
var init_share = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/runs/share.mjs"() {
    init_resource();
    init_headers();
    init_path();
    Share = class extends APIResource {
      /**
       * Creates or returns a share token for a run. Child runs share their trace root.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const share = await client.runs.share.create(
       *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *   {
       *     session_id: '018e4c7e-a9fb-7ef0-a5b6-6ea3a82e9327',
       *     trace_id: '018e4c7e-a9fb-7ef0-a5b6-6ea3a82e9327',
       *   },
       * );
       * ```
       */
      create(runID, body, options) {
        return this._client.post(path2`/api/v2/runs/${runID}/share`, { body, ...options });
      }
      /**
       * Deletes the share token for the trace identified by trace_id and session_id.
       * Idempotent: returns 204 whether or not a share token existed.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * await client.runs.share.delete(
       *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *   { session_id: '018e4c7e-a9fb-7ef0-a5b6-6ea3a82e9327' },
       * );
       * ```
       */
      delete(traceID, body, options) {
        return this._client.delete(path2`/api/v2/runs/${traceID}/share`, {
          body,
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/query-streaming.mjs
async function* iterQueryStream(fetch2, paths) {
  const itemPath = new RegExp(`^${escapeRegExp(paths.items)}/(-|\\d+)$`);
  let cursor;
  do {
    let next = null;
    const doc = [];
    let yielded = 0;
    let buffered = false;
    for await (const event of await fetch2(cursor)) {
      for (const op of event) {
        if (op.path === "") {
          const root = op.value;
          next = getPointer(root, paths.nextCursor) ?? null;
          const items = getPointer(root, paths.items) ?? [];
          doc.splice(yielded, doc.length - yielded, ...items.slice(yielded));
        } else if (op.path === paths.nextCursor) {
          next = op.value ?? null;
        } else {
          const match = itemPath.exec(op.path);
          if (!match)
            continue;
          const index = match[1] === "-" ? doc.length : Number(match[1]);
          if (match[1] !== "-")
            buffered = true;
          if (op.op === "remove") {
            if (index >= yielded && index < doc.length)
              doc.splice(index, 1);
          } else if (op.op === "replace") {
            if (index >= yielded && index < doc.length)
              doc[index] = op.value;
          } else {
            doc.splice(Math.min(index, doc.length), 0, op.value);
          }
        }
        while (!buffered && yielded < doc.length)
          yield doc[yielded++];
      }
    }
    while (yielded < doc.length)
      yield doc[yielded++];
    cursor = next || void 0;
  } while (cursor);
}
function getPointer(doc, pointer) {
  let value = doc;
  for (const segment of pointer.split("/").slice(1)) {
    if (value == null || typeof value !== "object")
      return void 0;
    value = value[segment.replace(/~1/g, "/").replace(/~0/g, "~")];
  }
  return value;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var init_query_streaming = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/core/query-streaming.mjs"() {
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/runs/streaming.mjs
var Streaming;
var init_streaming2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/runs/streaming.mjs"() {
    init_resource();
    init_query_streaming();
    init_headers();
    Streaming = class extends APIResource {
      /**
       * Returns a paginated list of runs for the given projects within min/max
       * start_time. Supports filters, cursor pagination, and `selects` to select fields
       * to return.
       *
       * When `ai_search` is set, `Accept: text/event-stream` is required; requests
       * without it return 406. AI search is unavailable on deployments that route
       * queries to the v1 backend and returns 501 there.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const response = await client.runs.streaming.queryV2();
       * ```
       */
      queryV2(params, options) {
        const { Accept, ...body } = params;
        return this._client.post("/api/v2/runs/query", {
          body,
          ...options,
          headers: buildHeaders([{ Accept: Accept != null ? Accept : "text/event-stream" }, options?.headers]),
          stream: true
        });
      }
      /**
       * Yields the items of `queryV2` one at a time across pages, following the next page cursor.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const run of client.runs.streaming.queryV2Items(
       *   {},
       * )) {
       *   // ...
       * }
       * ```
       */
      queryV2Items(params, options) {
        return iterQueryStream((cursor) => this.queryV2(cursor ? { ...params, cursor } : params, options), { items: "/items", nextCursor: "/next_cursor" });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/runs/runs.mjs
var Runs3;
var init_runs3 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/runs/runs.mjs"() {
    init_resource();
    init_share();
    init_share();
    init_streaming2();
    init_streaming2();
    init_pagination();
    init_headers();
    init_path();
    Runs3 = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "streaming", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Streaming(this._client)
        });
        Object.defineProperty(this, "share", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Share(this._client)
        });
        Object.defineProperty(this, "retrieve", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: this.retrieveV2
        });
        Object.defineProperty(this, "query", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: this.queryV2
        });
      }
      /**
       * Returns the URL to view a specific run in the LangSmith UI. The caller must
       * supply the run's project_id and trace_id as query parameters; start_time is
       * optional.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const response = await client.runs.getURL(
       *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *   { project_id: 'project_id', trace_id: 'trace_id' },
       * );
       * ```
       */
      getURL(runID, query, options) {
        return this._client.get(path2`/api/v2/runs/${runID}/url`, { query, ...options });
      }
      /**
       * Returns a paginated list of runs for the given projects within min/max
       * start_time. Supports filters, cursor pagination, and `selects` to select fields
       * to return.
       *
       * When `ai_search` is set, `Accept: text/event-stream` is required; requests
       * without it return 406. AI search is unavailable on deployments that route
       * queries to the v1 backend and returns 501 there.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const run of client.runs.queryV2()) {
       *   // ...
       * }
       * ```
       */
      queryV2(params, options) {
        const { Accept, ...body } = params;
        return this._client.getAPIList("/api/v2/runs/query", ItemsCursorPostPagination, {
          body,
          method: "post",
          ...options,
          headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
        });
      }
      /**
       * Returns one run by ID for the given session. Use the `selects` query parameter
       * (repeatable) to select fields to return.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const run = await client.runs.retrieveV2(
       *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *   { project_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e' },
       * );
       * ```
       */
      retrieveV2(runID, params, options) {
        const { Accept, ...query } = params;
        return this._client.get(path2`/api/v2/runs/${runID}`, {
          query,
          ...options,
          headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
        });
      }
    };
    Runs3.Streaming = Streaming;
    Runs3.Share = Share;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/boxes.mjs
var Boxes;
var init_boxes = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/boxes.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Boxes = class extends APIResource {
      /**
       * Create a new sandbox from a snapshot. Provide at most one of `snapshot_id` or
       * `snapshot_name`; if neither is provided, the server uses the default snapshot.
       * `snapshot_name` accepts a Docker-style `name` or `name:tag` reference (a bare
       * name resolves to `name:latest`).
       */
      create(body, options) {
        return this._client.post("/api/v2/sandboxes/boxes", { body, ...options });
      }
      /**
       * Retrieve a sandbox by name. Stale provisioning sandboxes are auto-failed.
       */
      retrieve(name, options) {
        return this._client.get(path2`/api/v2/sandboxes/boxes/${name}`, options);
      }
      /**
       * Update a sandbox's display name, retention, resources, tags, or proxy
       * configuration. The name must be unique within the tenant. Proxy configuration
       * sent to a sandbox that is not running is stored and applied when it next starts.
       */
      update(name, body, options) {
        return this._client.patch(path2`/api/v2/sandboxes/boxes/${name}`, { body, ...options });
      }
      /**
       * List sandboxes for the authenticated tenant, with optional filtering, sorting,
       * and pagination. Page with page_size and cursor: replay the response's
       * next_cursor until it comes back null, which is the only signal that no pages
       * remain. Cursors are opaque and only valid on this endpoint; do not parse or
       * construct one.
       */
      list(query = {}, options) {
        return this._client.getAPIList("/api/v2/sandboxes/boxes", ItemsCursorGetPagination, { query, ...options });
      }
      /**
       * Delete a sandbox by name or UUID. Tears down the sandbox runtime and removes the
       * DB record.
       */
      delete(name, options) {
        return this._client.delete(path2`/api/v2/sandboxes/boxes/${name}`, {
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
      /**
       * Create a snapshot by capturing the current state of a sandbox or promoting an
       * existing checkpoint.
       */
      createSnapshot(name, body, options) {
        return this._client.post(path2`/api/v2/sandboxes/boxes/${name}/snapshot`, { body, ...options });
      }
      /**
       * Removes the sharing grant for one port, or for every port when port is omitted.
       * A LangSmith login URL stops working immediately. A previously minted service
       * token is not revoked and stays valid until it expires, but no new one can be
       * issued from the removed grant.
       */
      deleteServiceURL(name, params = {}, options) {
        const { port } = params ?? {};
        return this._client.delete(path2`/api/v2/sandboxes/boxes/${name}/service-urls`, {
          query: { port },
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
      /**
       * Generate a tokenized link that downloads a single file from a sandbox with no
       * further authentication. This mints a token rather than creating an addressable
       * resource, so it returns 200 with no Location header. The token pins the sandbox,
       * the file path, the response content type and disposition, and the sandbox flags,
       * so a link cannot be repointed at another file or served under a weaker policy.
       * The file is always served with a Content-Security-Policy: a sandbox directive,
       * plus a default-src holding every fetch to the file's own download host and a set
       * of pre-approved third-party origins. csp_sandbox_flags may loosen the sandbox
       * with allow-downloads, allow-forms, allow-modals, allow-orientation-lock,
       * allow-pointer-lock, allow-popups, allow-presentation, allow-same-origin,
       * allow-scripts, or allow-top-navigation-by-user-activation. Every file is served
       * from its own host, derived from the sandbox and the path, so allow-same-origin
       * gives a page localStorage and IndexedDB that no other file can read, and
       * re-minting a link for the same file keeps them. csp_sandbox set to false drops
       * the sandbox directive altogether, and csp_sandbox_flags must then be omitted.
       * csp_source_bundles selects the third-party origins: cdnjs, google-fonts,
       * jsdelivr, and unpkg are all allowed when the field is omitted, 'none' holds the
       * file to its own host, and 'any' sends no default-src at all. Links never expire
       * unless expires_in_seconds is set. The link is served from the sandbox service
       * domain, not the API host.
       */
      generateDownloadURL(name, body, options) {
        return this._client.post(path2`/api/v2/sandboxes/boxes/${name}/download-url`, { body, ...options });
      }
      /**
       * Create a short-lived JWT for accessing an HTTP service running on a specific
       * port inside a sandbox. Returns a browser_url (sets auth cookie via redirect), an
       * embed_url (for an iframe; carries the token in the URL fragment, so no server or
       * Referer sees it), a service_url (for use with the
       * X-Langsmith-Sandbox-Service-Token header), the raw token, and its expiry. Set
       * access=restricted|workspace to instead enable durable LangSmith login (no token;
       * users authenticate with their normal LangSmith session), or access=off to
       * disable it. embed_origins names the pages that may show the URL in an iframe. In
       * token mode they are bound into the minted token; with LangSmith login they are
       * stored on the grant and a viewer signs in from inside the frame through a
       * LangSmith popup. LangSmith login and token access are mutually exclusive per
       * service URL.
       */
      generateServiceURL(name, body, options) {
        return this._client.post(path2`/api/v2/sandboxes/boxes/${name}/service-url`, { body, ...options });
      }
      /**
       * Retrieve the lightweight status of a sandbox for polling.
       */
      getStatus(name, options) {
        return this._client.get(path2`/api/v2/sandboxes/boxes/${name}/status`, options);
      }
      /**
       * Returns one entry per port the sandbox is currently reachable on, so a caller
       * can see what is shared before turning it off. Expired token grants are omitted.
       * Cursors are opaque and only valid on this endpoint; do not parse or construct
       * one.
       */
      listServiceURLs(name, query = {}, options) {
        return this._client.getAPIList(path2`/api/v2/sandboxes/boxes/${name}/service-urls`, ItemsCursorGetPagination, { query, ...options });
      }
      /**
       * Start a stopped or failed sandbox. This endpoint is not idempotent.
       */
      start(name, options) {
        return this._client.post(path2`/api/v2/sandboxes/boxes/${name}/start`, options);
      }
      /**
       * Stop a ready sandbox. This endpoint is not idempotent; the filesystem is
       * preserved for later restart.
       */
      stop(name, options) {
        return this._client.post(path2`/api/v2/sandboxes/boxes/${name}/stop`, {
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/registries.mjs
var Registries;
var init_registries = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/registries.mjs"() {
    init_resource();
    init_headers();
    init_path();
    Registries = class extends APIResource {
      /**
       * Create a sandbox registry for pulling private images.
       */
      create(body, options) {
        return this._client.post("/api/v2/sandboxes/registries", { body, ...options });
      }
      /**
       * Get a sandbox registry by name.
       */
      retrieve(name, options) {
        return this._client.get(path2`/api/v2/sandboxes/registries/${name}`, options);
      }
      /**
       * Update a sandbox registry's name and/or credentials.
       */
      update(name, body, options) {
        return this._client.patch(path2`/api/v2/sandboxes/registries/${name}`, { body, ...options });
      }
      /**
       * List sandbox registries for pulling private images. Page with page_size and
       * cursor, replaying next_cursor until it is null. Results are ordered newest
       * first, with stable ordering for equal creation times. Keep filters unchanged
       * between pages. Requests without page_size or cursor retain the legacy default of
       * 50 results. Cursor requests default to 20 results, with a maximum of 100.
       */
      list(query = {}, options) {
        return this._client.get("/api/v2/sandboxes/registries", { query, ...options });
      }
      /**
       * Delete a sandbox registry by name.
       */
      delete(name, options) {
        return this._client.delete(path2`/api/v2/sandboxes/registries/${name}`, {
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/snapshots.mjs
var Snapshots;
var init_snapshots = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/snapshots.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Snapshots = class extends APIResource {
      /**
       * Create a snapshot from a Docker image (async build). Names use lowercase
       * registry-style components separated by slashes, up to 255 characters. The
       * system/ namespace is read-only.
       */
      create(body, options) {
        return this._client.post("/api/v2/sandboxes/snapshots", { body, ...options });
      }
      /**
       * Get a sandbox snapshot by ID or a registry-style reference, including
       * system/default:latest. URL-encode references containing slashes. A bare name
       * means name:latest, falling back to the newest ready untagged snapshot of that
       * name. To list the tags under a name, use
       * /api/v2/sandboxes/snapshots-by-name/{name}.
       */
      retrieve(snapshotID, options) {
        return this._client.get(path2`/api/v2/sandboxes/snapshots/${snapshotID}`, options);
      }
      /**
       * List workspace and published system snapshots, with optional filtering, sorting,
       * and pagination. Page with page_size and cursor: replay the response's
       * next_cursor until it comes back null, which is the only signal that no pages
       * remain. Cursors are opaque and only valid on this endpoint; do not parse or
       * construct one.
       */
      list(query = {}, options) {
        return this._client.getAPIList("/api/v2/sandboxes/snapshots", ItemsCursorGetPagination, { query, ...options });
      }
      /**
       * Delete a snapshot by ID or by a Docker-style name[:tag] reference. The
       * underlying storage is reclaimed asynchronously.
       */
      delete(snapshotID, options) {
        return this._client.delete(path2`/api/v2/sandboxes/snapshots/${snapshotID}`, {
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
      /**
       * Get a snapshot name and every tag under it, with the snapshot each tag resolves
       * to. To fetch one snapshot, use /api/v2/sandboxes/snapshots/{snapshot_id}.
       */
      retrieveByName(name, options) {
        return this._client.get(path2`/api/v2/sandboxes/snapshots-by-name/${name}`, options);
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/sandboxes.mjs
var Sandboxes;
var init_sandboxes = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sandboxes/sandboxes.mjs"() {
    init_resource();
    init_boxes();
    init_boxes();
    init_registries();
    init_registries();
    init_snapshots();
    init_snapshots();
    init_pagination();
    Sandboxes = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "boxes", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Boxes(this._client)
        });
        Object.defineProperty(this, "registries", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Registries(this._client)
        });
        Object.defineProperty(this, "snapshots", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Snapshots(this._client)
        });
      }
      /**
       * Returns priced usage per sandbox or snapshot and UTC hour in the half-open
       * requested interval. LCU uses the recorded compute amount for sandboxes;
       * snapshots have zero LCU. LSU allocates the recorded workspace storage amount
       * proportionally to attributed bytes, including checkpoints on their sandbox and
       * snapshots as separate resources. Resource filters preserve each resource's
       * share. Rate changes do not reprice recorded amounts. An access-filtered page can
       * have no items and a non-null next_cursor; continue until next_cursor is null.
       */
      listUsageCosts(query, options) {
        return this._client.getAPIList("/api/v2/sandboxes/usage/costs", ItemsCursorGetPagination, { query, ...options });
      }
    };
    Sandboxes.Boxes = Boxes;
    Sandboxes.Registries = Registries;
    Sandboxes.Snapshots = Snapshots;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sessions.mjs
var Sessions;
var init_sessions = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/sessions.mjs"() {
    init_resource();
    Sessions = class extends APIResource {
      /**
       * Returns the tracing project (session) an address names. An address is an AGENT
       * (`id` and `environment`), an EXPERIMENT (`id`), or an EVALUATOR (no `id`:
       * evaluator traces share one project per workspace). Send `kind` and `environment`
       * in upper case, as listed; they are matched case-insensitively, while the Agent
       * `id` is case-sensitive. An address that does not exist, or whose project you
       * cannot read, is a 404. Pass the returned `session_id` to any endpoint that takes
       * a project (session) ID. This is not supported on a BYOC data plane yet, and is a
       * 501 there. Self-hosted deployments need LangSmith v0.18 or later.
       */
      resolve(query, options) {
        return this._client.get("/api/v1/sessions/resolutions", { query, ...options });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/threads/share.mjs
var Share2;
var init_share2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/threads/share.mjs"() {
    init_resource();
    init_headers();
    init_path();
    Share2 = class extends APIResource {
      /**
       * Mints a public share token for a thread. Idempotent: sharing an already-shared
       * thread returns the existing token.
       *
       * @example
       * ```ts
       * const share = await client.threads.share.create(
       *   'thread_id',
       *   { project_id: '018e4c7e-a9fb-7ef0-a5b6-6ea3a82e9327' },
       * );
       * ```
       */
      create(threadID, body, options) {
        return this._client.post(path2`/api/v2/threads/${threadID}/share`, { body, ...options });
      }
      /**
       * Returns the share token for a thread. The token is omitted when the thread is
       * not shared. Gated on runs:share so the control's state matches the control's
       * permission.
       *
       * @example
       * ```ts
       * const share = await client.threads.share.retrieve(
       *   'thread_id',
       *   { project_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e' },
       * );
       * ```
       */
      retrieve(threadID, query, options) {
        return this._client.get(path2`/api/v2/threads/${threadID}/share`, { query, ...options });
      }
      /**
       * Deletes the share token for a thread. Idempotent: returns 204 whether or not a
       * share token existed. Deliberately does not verify the thread still exists.
       *
       * @example
       * ```ts
       * await client.threads.share.delete('thread_id', {
       *   project_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       * });
       * ```
       */
      delete(threadID, params, options) {
        const { project_id } = params;
        return this._client.delete(path2`/api/v2/threads/${threadID}/share`, {
          query: { project_id },
          ...options,
          headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
        });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/threads/streaming.mjs
var Streaming2;
var init_streaming3 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/threads/streaming.mjs"() {
    init_resource();
    init_query_streaming();
    init_headers();
    Streaming2 = class extends APIResource {
      /**
       * GET with body payload — no resources created. Returns the threads in a tracing
       * project matching the query passed as the request payload. Results are filtered
       * by the given time range and optional filters, with cursor-based pagination.
       *
       * When `ai_search` is set, `Accept: text/event-stream` is required; requests
       * without it return 406. AI search is unavailable on deployments that route
       * queries to the v1 backend and returns 501 there.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const response = await client.threads.streaming.query();
       * ```
       */
      query(params, options) {
        const { Accept, ...body } = params;
        return this._client.post("/api/v2/threads/query", {
          body,
          ...options,
          headers: buildHeaders([{ Accept: Accept != null ? Accept : "text/event-stream" }, options?.headers]),
          stream: true
        });
      }
      /**
       * Yields the items of `query` one at a time across pages, following the next page cursor.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const thread of client.threads.streaming.queryItems(
       *   {},
       * )) {
       *   // ...
       * }
       * ```
       */
      queryItems(params, options) {
        return iterQueryStream((cursor) => this.query(cursor ? { ...params, cursor } : params, options), { items: "/items", nextCursor: "/next_cursor" });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/threads/threads.mjs
var Threads2;
var init_threads2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/threads/threads.mjs"() {
    init_resource();
    init_share2();
    init_share2();
    init_streaming3();
    init_streaming3();
    init_pagination();
    init_headers();
    init_path();
    Threads2 = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "streaming", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Streaming2(this._client)
        });
        Object.defineProperty(this, "share", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Share2(this._client)
        });
      }
      /**
       * GET with body payload — no resources created. Returns aggregate statistics for
       * threads in a tracing project. The response includes the thread counts, run
       * counts, latency percentiles, rates, token totals, and cost totals requested in
       * `select`.
       *
       * Self-hosted deployments require LangSmith `v0.17` or later.
       *
       * @example
       * ```ts
       * const response = await client.threads.aggregateStats({
       *   project_id: '0190a1b2-c3d4-7ef0-a5b6-6ea3a82e9328',
       *   select: [
       *     'THREAD_COUNT',
       *     'TRACE_COUNT',
       *     'TOTAL_TOKENS',
       *     'TOTAL_COST',
       *   ],
       * });
       * ```
       */
      aggregateStats(body, options) {
        return this._client.post("/api/v2/threads/stats", { body, ...options });
      }
      /**
       * Retrieve all traces belonging to a specific thread within a project.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const threadTrace of client.threads.listTraces(
       *   'thread_id',
       *   { project_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e' },
       * )) {
       *   // ...
       * }
       * ```
       */
      listTraces(threadID, query, options) {
        return this._client.getAPIList(path2`/api/v2/threads/${threadID}/traces`, ItemsCursorGetPagination, { query, ...options });
      }
      /**
       * GET with body payload — no resources created. Returns the threads in a tracing
       * project matching the query passed as the request payload. Results are filtered
       * by the given time range and optional filters, with cursor-based pagination.
       *
       * When `ai_search` is set, `Accept: text/event-stream` is required; requests
       * without it return 406. AI search is unavailable on deployments that route
       * queries to the v1 backend and returns 501 there.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const thread of client.threads.query()) {
       *   // ...
       * }
       * ```
       */
      query(params, options) {
        const { Accept, ...body } = params;
        return this._client.getAPIList("/api/v2/threads/query", ItemsCursorPostPagination, {
          body,
          method: "post",
          ...options,
          headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
        });
      }
      /**
       * Compute aggregate stats for a single thread (turn count, latency percentiles,
       * token/cost sums, and detail breakdowns) within a project.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const threadStats = await client.threads.stats(
       *   'thread_id',
       *   {
       *     selects: ['TURNS'],
       *     session_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *   },
       * );
       * ```
       */
      stats(threadID, query, options) {
        return this._client.get(path2`/api/v2/threads/${threadID}/stats`, { query, ...options });
      }
    };
    Threads2.Streaming = Streaming2;
    Threads2.Share = Share2;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/traces/streaming.mjs
var Streaming3;
var init_streaming4 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/traces/streaming.mjs"() {
    init_resource();
    init_query_streaming();
    init_headers();
    Streaming3 = class extends APIResource {
      /**
       * Returns a paginated list of traces (root runs) for a single tracing project.
       * Each item carries the trace's root run plus optional trace-wide aggregates
       * (`total_tokens`, `total_cost`, `first_token_time`) under `trace_aggregates`, so
       * clients never have to merge by `trace_id`.
       *
       * Traces are scanned within a `start_time` window: `min_start_time` defaults to 24
       * hours before the request, `max_start_time` defaults to the request time. Set
       * either explicitly to widen or narrow the window.
       *
       * Supports filters (`trace_filter`, `tree_filter`), cursor pagination (`cursor`),
       * and field projection (`selects`).
       *
       * When `ai_search` is set, `Accept: text/event-stream` is required; requests
       * without it return 406. AI search is unavailable on deployments that route
       * queries to the v1 backend and returns 501 there.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const response = await client.traces.streaming.query();
       * ```
       */
      query(params, options) {
        const { Accept, ...body } = params;
        return this._client.post("/api/v2/traces/query", {
          body,
          ...options,
          headers: buildHeaders([{ Accept: Accept != null ? Accept : "text/event-stream" }, options?.headers]),
          stream: true
        });
      }
      /**
       * Yields the items of `query` one at a time across pages, following the next page cursor.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const trace of client.traces.streaming.queryItems(
       *   {},
       * )) {
       *   // ...
       * }
       * ```
       */
      queryItems(params, options) {
        return iterQueryStream((cursor) => this.query(cursor ? { ...params, cursor } : params, options), { items: "/items", nextCursor: "/next_cursor" });
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/traces/traces.mjs
var Traces;
var init_traces = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/traces/traces.mjs"() {
    init_resource();
    init_streaming4();
    init_streaming4();
    init_pagination();
    init_headers();
    init_path();
    Traces = class extends APIResource {
      constructor() {
        super(...arguments);
        Object.defineProperty(this, "streaming", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Streaming3(this._client)
        });
      }
      /**
       * Returns runs for a trace ID within min/max start time. Optional `filter`;
       * repeatable `selects` to select fields to return.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * const response = await client.traces.listRuns(
       *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
       *   { project_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e' },
       * );
       * ```
       */
      listRuns(traceID, params, options) {
        const { Accept, ...query } = params;
        return this._client.get(path2`/api/v2/traces/${traceID}/runs`, {
          query,
          ...options,
          headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
        });
      }
      /**
       * Returns a paginated list of traces (root runs) for a single tracing project.
       * Each item carries the trace's root run plus optional trace-wide aggregates
       * (`total_tokens`, `total_cost`, `first_token_time`) under `trace_aggregates`, so
       * clients never have to merge by `trace_id`.
       *
       * Traces are scanned within a `start_time` window: `min_start_time` defaults to 24
       * hours before the request, `max_start_time` defaults to the request time. Set
       * either explicitly to widen or narrow the window.
       *
       * Supports filters (`trace_filter`, `tree_filter`), cursor pagination (`cursor`),
       * and field projection (`selects`).
       *
       * When `ai_search` is set, `Accept: text/event-stream` is required; requests
       * without it return 406. AI search is unavailable on deployments that route
       * queries to the v1 backend and returns 501 there.
       *
       * Self-hosted deployments require LangSmith `v0.16` or later.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const trace of client.traces.query()) {
       *   // ...
       * }
       * ```
       */
      query(params, options) {
        const { Accept, ...body } = params;
        return this._client.getAPIList("/api/v2/traces/query", ItemsCursorPostPagination, {
          body,
          method: "post",
          ...options,
          headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
        });
      }
    };
    Traces.Streaming = Streaming3;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/index.mjs
var init_resources = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/resources/index.mjs"() {
    init_shared();
    init_agents();
    init_annotation_queues();
    init_datasets();
    init_fleet();
    init_info();
    init_issues();
    init_online_evaluators();
    init_product_feedback();
    init_prompt_webhooks();
    init_public();
    init_runs3();
    init_sandboxes();
    init_sessions();
    init_threads2();
    init_traces();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/env.mjs
var readEnv;
var init_env = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/internal/utils/env.mjs"() {
    readEnv = (env) => {
      if (typeof globalThis.process !== "undefined") {
        return globalThis.process.env?.[env]?.trim() || void 0;
      }
      if (typeof globalThis.Deno !== "undefined") {
        return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
      }
      return void 0;
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/client.mjs
var _Langsmith_instances, _a, _Langsmith_encoder, _Langsmith_baseURLOverridden, Langsmith;
var init_client = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/client.mjs"() {
    init_tslib();
    init_uuid();
    init_values();
    init_sleep();
    init_errors();
    init_detect_platform();
    init_shims();
    init_request_options();
    init_query();
    init_version2();
    init_error();
    init_pagination();
    init_uploads2();
    init_resources();
    init_api_promise();
    init_agents();
    init_info();
    init_issues();
    init_online_evaluators();
    init_product_feedback();
    init_prompt_webhooks();
    init_sessions();
    init_annotation_queues();
    init_datasets();
    init_fleet();
    init_public();
    init_runs3();
    init_sandboxes();
    init_threads2();
    init_traces();
    init_headers();
    init_env();
    init_log();
    init_values();
    Langsmith = class {
      /**
       * API Client for interfacing with the LangChain API.
       *
       * @param {string | null | undefined} [opts.apiKey=process.env['LANGSMITH_API_KEY'] ?? null]
       * @param {string | null | undefined} [opts.tenantID=process.env['LANGSMITH_TENANT_ID'] ?? null]
       * @param {string} [opts.baseURL=process.env['LANGCHAIN_BASE_URL'] ?? https://api.smith.langchain.com/] - Override the default base URL for the API.
       * @param {number} [opts.timeout=1.5 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
       * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
       * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
       * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
       * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
       * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
       */
      constructor({ baseURL = readEnv("LANGCHAIN_BASE_URL"), apiKey = readEnv("LANGSMITH_API_KEY") ?? null, tenantID = readEnv("LANGSMITH_TENANT_ID") ?? null, ...opts } = {}) {
        _Langsmith_instances.add(this);
        Object.defineProperty(this, "apiKey", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "tenantID", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "baseURL", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "maxRetries", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "timeout", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "logger", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "logLevel", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "fetchOptions", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "fetch", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        _Langsmith_encoder.set(this, void 0);
        Object.defineProperty(this, "idempotencyHeader", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_options", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "productFeedback", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new ProductFeedback(this)
        });
        Object.defineProperty(this, "agents", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Agents(this)
        });
        Object.defineProperty(this, "fleet", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Fleet(this)
        });
        Object.defineProperty(this, "sessions", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Sessions(this)
        });
        Object.defineProperty(this, "datasets", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Datasets(this)
        });
        Object.defineProperty(this, "runs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Runs3(this)
        });
        Object.defineProperty(this, "threads", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Threads2(this)
        });
        Object.defineProperty(this, "traces", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Traces(this)
        });
        Object.defineProperty(this, "onlineEvaluators", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new OnlineEvaluators(this)
        });
        Object.defineProperty(this, "public", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Public(this)
        });
        Object.defineProperty(this, "annotationQueues", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new AnnotationQueues(this)
        });
        Object.defineProperty(this, "promptWebhooks", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new PromptWebhooks(this)
        });
        Object.defineProperty(this, "info", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Info(this)
        });
        Object.defineProperty(this, "issues", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Issues(this)
        });
        Object.defineProperty(this, "sandboxes", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: new Sandboxes(this)
        });
        const options = {
          apiKey,
          tenantID,
          ...opts,
          baseURL: baseURL || `https://api.smith.langchain.com/`
        };
        this.baseURL = options.baseURL;
        this.timeout = options.timeout ?? _a.DEFAULT_TIMEOUT;
        this.logger = options.logger ?? console;
        const defaultLogLevel = "warn";
        this.logLevel = defaultLogLevel;
        this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", this) ?? parseLogLevel(readEnv("LANGCHAIN_LOG"), "process.env['LANGCHAIN_LOG']", this) ?? defaultLogLevel;
        this.fetchOptions = options.fetchOptions;
        this.maxRetries = options.maxRetries ?? 2;
        this.fetch = options.fetch ?? getDefaultFetch();
        __classPrivateFieldSet(this, _Langsmith_encoder, FallbackEncoder, "f");
        const customHeadersEnv = readEnv("LANGCHAIN_CUSTOM_HEADERS");
        if (customHeadersEnv) {
          const parsed = {};
          for (const line of customHeadersEnv.split("\n")) {
            const colon = line.indexOf(":");
            if (colon >= 0) {
              parsed[line.substring(0, colon).trim()] = line.substring(colon + 1).trim();
            }
          }
          options.defaultHeaders = { ...parsed, ...options.defaultHeaders };
        }
        this._options = options;
        this.apiKey = apiKey;
        this.tenantID = tenantID;
      }
      /**
       * Create a new client instance re-using the same options given to the current client with optional overriding.
       */
      withOptions(options) {
        const client = new this.constructor({
          ...this._options,
          baseURL: this.baseURL,
          maxRetries: this.maxRetries,
          timeout: this.timeout,
          logger: this.logger,
          logLevel: this.logLevel,
          fetch: this.fetch,
          fetchOptions: this.fetchOptions,
          apiKey: this.apiKey,
          tenantID: this.tenantID,
          ...options
        });
        return client;
      }
      defaultQuery() {
        return this._options.defaultQuery;
      }
      validateHeaders({ values, nulls }) {
        if (this.apiKey && values.get("x-api-key")) {
          return;
        }
        if (nulls.has("x-api-key")) {
          return;
        }
        if (this.tenantID && values.get("x-tenant-id")) {
          return;
        }
        if (nulls.has("x-tenant-id")) {
          return;
        }
        throw new Error('Could not resolve authentication method. Expected either apiKey or tenantID to be set. Or for one of the "X-API-Key" or "X-Tenant-Id" headers to be explicitly omitted');
      }
      async authHeaders(opts) {
        return buildHeaders([await this.apiKeyAuth(opts), await this.tenantIDAuth(opts)]);
      }
      async apiKeyAuth(opts) {
        if (this.apiKey == null) {
          return void 0;
        }
        return buildHeaders([{ "X-API-Key": this.apiKey }]);
      }
      async tenantIDAuth(opts) {
        if (this.tenantID == null) {
          return void 0;
        }
        return buildHeaders([{ "X-Tenant-Id": this.tenantID }]);
      }
      stringifyQuery(query) {
        return stringifyQuery(query);
      }
      getUserAgent() {
        return `${this.constructor.name}/JS ${VERSION}`;
      }
      defaultIdempotencyKey() {
        return `stainless-node-retry-${uuid4()}`;
      }
      makeStatusError(status, error, message, headers) {
        return APIError.generate(status, error, message, headers);
      }
      buildURL(path4, query, defaultBaseURL) {
        const baseURL = !__classPrivateFieldGet(this, _Langsmith_instances, "m", _Langsmith_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
        const url = isAbsoluteURL(path4) ? new URL(path4) : new URL(baseURL + (baseURL.endsWith("/") && path4.startsWith("/") ? path4.slice(1) : path4));
        const defaultQuery = this.defaultQuery();
        const pathQuery = Object.fromEntries(url.searchParams);
        if (!isEmptyObj(defaultQuery) || !isEmptyObj(pathQuery)) {
          query = { ...pathQuery, ...defaultQuery, ...query };
        }
        if (typeof query === "object" && query && !Array.isArray(query)) {
          url.search = this.stringifyQuery(query);
        }
        return url.toString();
      }
      /**
       * Used as a callback for mutating the given `FinalRequestOptions` object.
       */
      async prepareOptions(options) {
      }
      /**
       * Used as a callback for mutating the given `RequestInit` object.
       *
       * This is useful for cases where you want to add certain headers based off of
       * the request properties, e.g. `method` or `url`.
       */
      async prepareRequest(request, { url, options }) {
      }
      get(path4, opts) {
        return this.methodRequest("get", path4, opts);
      }
      post(path4, opts) {
        return this.methodRequest("post", path4, opts);
      }
      patch(path4, opts) {
        return this.methodRequest("patch", path4, opts);
      }
      put(path4, opts) {
        return this.methodRequest("put", path4, opts);
      }
      delete(path4, opts) {
        return this.methodRequest("delete", path4, opts);
      }
      methodRequest(method, path4, opts) {
        return this.request(Promise.resolve(opts).then((opts2) => {
          return { method, path: path4, ...opts2 };
        }));
      }
      request(options, remainingRetries = null) {
        return new APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
      }
      async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
        const options = await optionsInput;
        const maxRetries = options.maxRetries ?? this.maxRetries;
        if (retriesRemaining == null) {
          retriesRemaining = maxRetries;
        }
        await this.prepareOptions(options);
        const { req, url, timeout } = await this.buildRequest(options, {
          retryCount: maxRetries - retriesRemaining
        });
        await this.prepareRequest(req, { url, options });
        const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
        const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
        const startTime = Date.now();
        loggerFor(this).debug(`[${requestLogID}] sending request`, formatRequestDetails({
          retryOfRequestLogID,
          method: options.method,
          url,
          options,
          headers: req.headers
        }));
        if (options.signal?.aborted) {
          throw new APIUserAbortError();
        }
        const controller = new AbortController();
        const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
        const headersTime = Date.now();
        if (response instanceof globalThis.Error) {
          const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
          if (options.signal?.aborted) {
            throw new APIUserAbortError();
          }
          const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
          if (retriesRemaining) {
            loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
            loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
              retryOfRequestLogID,
              url,
              durationMs: headersTime - startTime,
              message: response.message
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
          }
          loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
          loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
            retryOfRequestLogID,
            url,
            durationMs: headersTime - startTime,
            message: response.message
          }));
          if (isTimeout) {
            throw new APIConnectionTimeoutError();
          }
          throw new APIConnectionError({ cause: response });
        }
        const responseInfo = `[${requestLogID}${retryLogStr}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
        if (!response.ok) {
          const shouldRetry = await this.shouldRetry(response);
          if (retriesRemaining && shouldRetry) {
            const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
            await CancelReadableStream(response.body);
            loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
            loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
              retryOfRequestLogID,
              url: response.url,
              status: response.status,
              headers: response.headers,
              durationMs: headersTime - startTime
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
          }
          const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
          loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
          const errText = await response.text().catch((err2) => castToError(err2).message);
          const errJSON = safeJSON(errText);
          const errMessage = errJSON ? void 0 : errText;
          loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
            retryOfRequestLogID,
            url: response.url,
            status: response.status,
            headers: response.headers,
            message: errMessage,
            durationMs: Date.now() - startTime
          }));
          const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
          throw err;
        }
        loggerFor(this).info(responseInfo);
        loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
      }
      getAPIList(path4, Page, opts) {
        return this.requestAPIList(Page, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path: path4, ...opts2 })) : { method: "get", path: path4, ...opts });
      }
      requestAPIList(Page, options) {
        const request = this.makeRequest(options, null, void 0);
        return new PagePromise(this, request, Page);
      }
      async fetchWithTimeout(url, init, ms, controller) {
        const { signal, method, ...options } = init || {};
        const abort = this._makeAbort(controller);
        if (signal)
          signal.addEventListener("abort", abort, { once: true });
        const timeout = setTimeout(abort, ms);
        const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
        const fetchOptions = {
          signal: controller.signal,
          ...isReadableBody ? { duplex: "half" } : {},
          method: "GET",
          ...options
        };
        if (method) {
          fetchOptions.method = method.toUpperCase();
        }
        try {
          return await this.fetch.call(void 0, url, fetchOptions);
        } finally {
          clearTimeout(timeout);
        }
      }
      async shouldRetry(response) {
        const shouldRetryHeader = response.headers.get("x-should-retry");
        if (shouldRetryHeader === "true")
          return true;
        if (shouldRetryHeader === "false")
          return false;
        if (response.status === 408)
          return true;
        if (response.status === 409)
          return true;
        if (response.status === 429)
          return true;
        if (response.status >= 500)
          return true;
        return false;
      }
      async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
        let timeoutMillis;
        const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
        if (retryAfterMillisHeader) {
          const timeoutMs = parseFloat(retryAfterMillisHeader);
          if (!Number.isNaN(timeoutMs)) {
            timeoutMillis = timeoutMs;
          }
        }
        const retryAfterHeader = responseHeaders?.get("retry-after");
        if (retryAfterHeader && !timeoutMillis) {
          const timeoutSeconds = parseFloat(retryAfterHeader);
          if (!Number.isNaN(timeoutSeconds)) {
            timeoutMillis = timeoutSeconds * 1e3;
          } else {
            timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
          }
        }
        if (timeoutMillis === void 0) {
          const maxRetries = options.maxRetries ?? this.maxRetries;
          timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
        }
        await sleep(timeoutMillis);
        return this.makeRequest(options, retriesRemaining - 1, requestLogID);
      }
      calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
        const initialRetryDelay = 0.5;
        const maxRetryDelay = 16;
        const numRetries = maxRetries - retriesRemaining;
        const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
        const jitter = 1 - Math.random() * 0.25;
        return sleepSeconds * jitter * 1e3;
      }
      async buildRequest(inputOptions, { retryCount = 0 } = {}) {
        const options = { ...inputOptions };
        const { method, path: path4, query, defaultBaseURL } = options;
        const url = this.buildURL(path4, query, defaultBaseURL);
        if ("timeout" in options)
          validatePositiveInteger("timeout", options.timeout);
        options.timeout = options.timeout ?? this.timeout;
        const { bodyHeaders, body } = this.buildBody({ options });
        const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
        const req = {
          method,
          headers: reqHeaders,
          ...options.signal && { signal: options.signal },
          ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
          ...body && { body },
          ...this.fetchOptions ?? {},
          ...options.fetchOptions ?? {}
        };
        return { req, url, timeout: options.timeout };
      }
      async buildHeaders({ options, method, bodyHeaders, retryCount }) {
        let idempotencyHeaders = {};
        if (this.idempotencyHeader && method !== "get") {
          if (!options.idempotencyKey)
            options.idempotencyKey = this.defaultIdempotencyKey();
          idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
        }
        const headers = buildHeaders([
          idempotencyHeaders,
          {
            Accept: "application/json",
            "User-Agent": this.getUserAgent(),
            "X-Stainless-Retry-Count": String(retryCount),
            ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
            ...getPlatformHeaders()
          },
          await this.authHeaders(options),
          this._options.defaultHeaders,
          bodyHeaders,
          options.headers
        ]);
        this.validateHeaders(headers);
        return headers.values;
      }
      _makeAbort(controller) {
        return () => controller.abort();
      }
      buildBody({ options: { body, headers: rawHeaders } }) {
        if (!body) {
          return { bodyHeaders: void 0, body: void 0 };
        }
        const headers = buildHeaders([rawHeaders]);
        if (
          // Pass raw type verbatim
          ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && // Preserve legacy string encoding behavior for now
          headers.values.has("content-type") || // `Blob` is superset of `File`
          globalThis.Blob && body instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
          body instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
          body instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
          globalThis.ReadableStream && body instanceof globalThis.ReadableStream
        ) {
          return { bodyHeaders: void 0, body };
        } else if (typeof body === "object" && (Symbol.asyncIterator in body || Symbol.iterator in body && "next" in body && typeof body.next === "function")) {
          return { bodyHeaders: void 0, body: ReadableStreamFrom(body) };
        } else if (typeof body === "object" && headers.values.get("content-type") === "application/x-www-form-urlencoded") {
          return {
            bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
            body: this.stringifyQuery(body)
          };
        } else {
          return __classPrivateFieldGet(this, _Langsmith_encoder, "f").call(this, { body, headers });
        }
      }
    };
    _a = Langsmith, _Langsmith_encoder = /* @__PURE__ */ new WeakMap(), _Langsmith_instances = /* @__PURE__ */ new WeakSet(), _Langsmith_baseURLOverridden = function _Langsmith_baseURLOverridden2() {
      return this.baseURL !== "https://api.smith.langchain.com/";
    };
    Object.defineProperty(Langsmith, "Langsmith", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: _a
    });
    Object.defineProperty(Langsmith, "DEFAULT_TIMEOUT", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 9e4
    });
    Object.defineProperty(Langsmith, "LangsmithError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: LangsmithError
    });
    Object.defineProperty(Langsmith, "APIError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: APIError
    });
    Object.defineProperty(Langsmith, "APIConnectionError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: APIConnectionError
    });
    Object.defineProperty(Langsmith, "APIConnectionTimeoutError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: APIConnectionTimeoutError
    });
    Object.defineProperty(Langsmith, "APIUserAbortError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: APIUserAbortError
    });
    Object.defineProperty(Langsmith, "NotFoundError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: NotFoundError
    });
    Object.defineProperty(Langsmith, "ConflictError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ConflictError
    });
    Object.defineProperty(Langsmith, "RateLimitError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: RateLimitError
    });
    Object.defineProperty(Langsmith, "BadRequestError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: BadRequestError
    });
    Object.defineProperty(Langsmith, "AuthenticationError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: AuthenticationError
    });
    Object.defineProperty(Langsmith, "InternalServerError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: InternalServerError
    });
    Object.defineProperty(Langsmith, "PermissionDeniedError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: PermissionDeniedError
    });
    Object.defineProperty(Langsmith, "UnprocessableEntityError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: UnprocessableEntityError
    });
    Object.defineProperty(Langsmith, "toFile", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: toFile
    });
    Langsmith.ProductFeedback = ProductFeedback;
    Langsmith.Agents = Agents;
    Langsmith.Fleet = Fleet;
    Langsmith.Sessions = Sessions;
    Langsmith.Datasets = Datasets;
    Langsmith.Runs = Runs3;
    Langsmith.Threads = Threads2;
    Langsmith.Traces = Traces;
    Langsmith.OnlineEvaluators = OnlineEvaluators;
    Langsmith.Public = Public;
    Langsmith.AnnotationQueues = AnnotationQueues;
    Langsmith.PromptWebhooks = PromptWebhooks;
    Langsmith.Info = Info;
    Langsmith.Issues = Issues;
    Langsmith.Sandboxes = Sandboxes;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/warn.mjs
function warnOnce(message, options) {
  const key = options?.code ?? message;
  if (!warnedMessages[key]) {
    warnedMessages[key] = true;
    if (options?.type && typeof process !== "undefined" && typeof process.emitWarning === "function") {
      process.emitWarning(message, { type: options.type, code: options.code });
    } else if (options?.type && options?.code) {
      console.warn(`${options.type} [${options.code}]: ${message}`);
    } else {
      console.warn(message);
    }
  }
}
var warnedMessages;
var init_warn = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/warn.mjs"() {
    warnedMessages = {};
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/xxhash/xxhash.mjs
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
function getView(buf, offset = 0) {
  return new Uint8Array(buf.buffer, buf.byteOffset + offset, buf.length - offset);
}
function readBigUInt64LE(buf, offset = 0) {
  const view = new DataView(buf.buffer, buf.byteOffset + offset);
  return view.getBigUint64(0, true);
}
function readUInt32LE(buf, offset = 0) {
  const view = new DataView(buf.buffer, buf.byteOffset + offset);
  return view.getUint32(0, true);
}
function readUInt8(buf, offset = 0) {
  return buf[offset];
}
function rotl32(a, b) {
  return (a << b | a >> n(32) - b) & mask32;
}
function XXH3_accumulate_512(acc, data, key) {
  for (let i = 0; i < ACC_NB; i++) {
    const data_val = readBigUInt64LE(data, i * 8);
    const data_key = data_val ^ readBigUInt64LE(key, i * 8);
    acc[i ^ 1] += data_val;
    acc[i] += XXH_mult32to64(data_key, data_key >> n(32));
  }
  return acc;
}
function XXH3_accumulate(acc, data, key, nbStripes) {
  for (let n2 = 0; n2 < nbStripes; n2++) {
    XXH3_accumulate_512(acc, getView(data, n2 * STRIPE_LEN), getView(key, n2 * 8));
  }
  return acc;
}
function XXH3_scrambleAcc(acc, key) {
  for (let i = 0; i < ACC_NB; i++) {
    const key64 = readBigUInt64LE(key, i * 8);
    let acc64 = acc[i];
    acc64 = xorshift64(acc64, n(47));
    acc64 ^= key64;
    acc64 *= PRIME32_1;
    acc[i] = acc64 & mask64;
  }
  return acc;
}
function XXH3_mix2Accs(acc, key) {
  return XXH3_mul128_fold64(acc[0] ^ readBigUInt64LE(key, 0), acc[1] ^ readBigUInt64LE(key, _U64));
}
function XXH3_mergeAccs(acc, key, start) {
  let result64 = start;
  result64 += XXH3_mix2Accs(acc.slice(0), getView(key, 0 * _U32));
  result64 += XXH3_mix2Accs(acc.slice(2), getView(key, 4 * _U32));
  result64 += XXH3_mix2Accs(acc.slice(4), getView(key, 8 * _U32));
  result64 += XXH3_mix2Accs(acc.slice(6), getView(key, 12 * _U32));
  return XXH3_avalanche(result64 & mask64);
}
function XXH3_hashLong(acc, data, secret, f_acc, f_scramble) {
  const nbStripesPerBlock = Math.floor((secret.byteLength - STRIPE_LEN) / 8);
  const block_len = STRIPE_LEN * nbStripesPerBlock;
  const nb_blocks = Math.floor((data.byteLength - 1) / block_len);
  for (let n2 = 0; n2 < nb_blocks; n2++) {
    acc = XXH3_accumulate(acc, getView(data, n2 * block_len), secret, nbStripesPerBlock);
    acc = f_scramble(acc, getView(secret, secret.byteLength - STRIPE_LEN));
  }
  {
    const nbStripes = Math.floor((data.byteLength - 1 - block_len * nb_blocks) / STRIPE_LEN);
    acc = XXH3_accumulate(acc, getView(data, nb_blocks * block_len), secret, nbStripes);
    acc = f_acc(acc, getView(data, data.byteLength - STRIPE_LEN), getView(secret, secret.byteLength - STRIPE_LEN - 7));
  }
  return acc;
}
function XXH3_hashLong_128b(data, secret, seed) {
  let acc = new BigUint64Array([
    PRIME32_3,
    PRIME64_1,
    PRIME64_2,
    PRIME64_3,
    PRIME64_4,
    PRIME32_2,
    PRIME64_5,
    PRIME32_1
  ]);
  assert(data.length > 128);
  acc = XXH3_hashLong(acc, data, secret, XXH3_accumulate_512, XXH3_scrambleAcc);
  assert(acc.length * 8 == 64);
  {
    const low64 = XXH3_mergeAccs(acc, getView(secret, 11), n(data.byteLength) * PRIME64_1 & mask64);
    const high64 = XXH3_mergeAccs(acc, getView(secret, secret.byteLength - STRIPE_LEN - 11), ~(n(data.byteLength) * PRIME64_2) & mask64);
    return high64 << n(64) | low64;
  }
}
function XXH3_mul128_fold64(a, b) {
  const lll = a * b & mask128;
  return lll & mask64 ^ lll >> n(64);
}
function XXH3_mix16B(data, key, seed) {
  return XXH3_mul128_fold64((readBigUInt64LE(data, 0) ^ readBigUInt64LE(key, 0) + seed) & mask64, (readBigUInt64LE(data, 8) ^ readBigUInt64LE(key, 8) - seed) & mask64);
}
function XXH3_mix32B(acc, data1, data2, key, seed) {
  let accl = acc & mask64;
  let acch = acc >> n(64) & mask64;
  accl += XXH3_mix16B(data1, key, seed);
  accl ^= readBigUInt64LE(data2, 0) + readBigUInt64LE(data2, 8);
  accl &= mask64;
  acch += XXH3_mix16B(data2, getView(key, 16), seed);
  acch ^= readBigUInt64LE(data1, 0) + readBigUInt64LE(data1, 8);
  acch &= mask64;
  return acch << n(64) | accl;
}
function XXH3_avalanche(h64) {
  h64 ^= h64 >> n(37);
  h64 *= PRIME_MX1;
  h64 &= mask64;
  h64 ^= h64 >> n(32);
  return h64;
}
function XXH3_avalanche64(h64) {
  h64 ^= h64 >> n(33);
  h64 *= PRIME64_2;
  h64 &= mask64;
  h64 ^= h64 >> n(29);
  h64 *= PRIME64_3;
  h64 &= mask64;
  h64 ^= h64 >> n(32);
  return h64;
}
function XXH3_len_1to3_128b(data, key32, seed) {
  const len = data.byteLength;
  assert(len > 0 && len <= 3);
  const combined = n(readUInt8(data, len - 1)) | n(len << 8) | n(readUInt8(data, 0) << 16) | n(readUInt8(data, len >> 1) << 24);
  const blow = (n(readUInt32LE(key32, 0)) ^ n(readUInt32LE(key32, 4))) + seed;
  const low = (combined ^ blow) & mask64;
  const bhigh = (n(readUInt32LE(key32, 8)) ^ n(readUInt32LE(key32, 12))) - seed;
  const high = (rotl32(bswap32(combined), n(13)) ^ bhigh) & mask64;
  return (XXH3_avalanche64(high) & mask64) << n(64) | XXH3_avalanche64(low);
}
function xorshift64(b, shift) {
  return b ^ b >> shift;
}
function XXH3_len_4to8_128b(data, key32, seed) {
  const len = data.byteLength;
  assert(len >= 4 && len <= 8);
  {
    const l1 = readUInt32LE(data, 0);
    const l2 = readUInt32LE(data, len - 4);
    const l64 = n(l1) | n(l2) << n(32);
    const bitflip = (readBigUInt64LE(key32, 16) ^ readBigUInt64LE(key32, 24)) + seed & mask64;
    const keyed = l64 ^ bitflip;
    let m128 = keyed * (PRIME64_1 + (n(len) << n(2))) & mask128;
    m128 += (m128 & mask64) << n(65);
    m128 &= mask128;
    m128 ^= m128 >> n(67);
    return xorshift64(xorshift64(m128 & mask64, n(35)) * PRIME_MX2 & mask64, n(28)) | XXH3_avalanche(m128 >> n(64)) << n(64);
  }
}
function XXH3_len_9to16_128b(data, key64, seed) {
  const len = data.byteLength;
  assert(len >= 9 && len <= 16);
  {
    const bitflipl = (readBigUInt64LE(key64, 32) ^ readBigUInt64LE(key64, 40)) + seed & mask64;
    const bitfliph = (readBigUInt64LE(key64, 48) ^ readBigUInt64LE(key64, 56)) - seed & mask64;
    const ll1 = readBigUInt64LE(data);
    let ll2 = readBigUInt64LE(data, len - 8);
    let m128 = (ll1 ^ ll2 ^ bitflipl) * PRIME64_1;
    const m128_l = (m128 & mask64) + (n(len - 1) << n(54));
    m128 = m128 & (mask128 ^ mask64) | m128_l;
    ll2 ^= bitfliph;
    m128 += ll2 + (ll2 & mask32) * (PRIME32_2 - n(1)) << n(64);
    m128 &= mask128;
    m128 ^= bswap64(m128 >> n(64));
    let h128 = (m128 & mask64) * PRIME64_2;
    h128 += (m128 >> n(64)) * PRIME64_2 << n(64);
    h128 &= mask128;
    return XXH3_avalanche(h128 & mask64) | XXH3_avalanche(h128 >> n(64)) << n(64);
  }
}
function XXH3_len_0to16_128b(data, seed) {
  const len = data.byteLength;
  assert(len <= 16);
  if (len > 8)
    return XXH3_len_9to16_128b(data, kkey, seed);
  if (len >= 4)
    return XXH3_len_4to8_128b(data, kkey, seed);
  if (len > 0)
    return XXH3_len_1to3_128b(data, kkey, seed);
  return XXH3_avalanche64(seed ^ readBigUInt64LE(kkey, 64) ^ readBigUInt64LE(kkey, 72)) | XXH3_avalanche64(seed ^ readBigUInt64LE(kkey, 80) ^ readBigUInt64LE(kkey, 88)) << n(64);
}
function inv64(x) {
  return ~x + n(1) & mask64;
}
function XXH3_len_17to128_128b(data, secret, seed) {
  let acc = n(data.byteLength) * PRIME64_1 & mask64;
  let i = n(data.byteLength - 1) / n(32);
  while (i >= 0) {
    const ni = Number(i);
    acc = XXH3_mix32B(acc, getView(data, 16 * ni), getView(data, data.byteLength - 16 * (ni + 1)), getView(secret, 32 * ni), seed);
    i--;
  }
  let h128l = acc + (acc >> n(64)) & mask64;
  h128l = XXH3_avalanche(h128l);
  let h128h = (acc & mask64) * PRIME64_1 + (acc >> n(64)) * PRIME64_4 + (n(data.byteLength) - seed & mask64) * PRIME64_2;
  h128h &= mask64;
  h128h = inv64(XXH3_avalanche(h128h));
  return h128l | h128h << n(64);
}
function XXH3_len_129to240_128b(data, secret, seed) {
  let acc = n(data.byteLength) * PRIME64_1 & mask64;
  for (let i = 32; i < 160; i += 32) {
    acc = XXH3_mix32B(acc, getView(data, i - 32), getView(data, i - 16), getView(secret, i - 32), seed);
  }
  acc = XXH3_avalanche(acc & mask64) | XXH3_avalanche(acc >> n(64)) << n(64);
  for (let i = 160; i <= data.byteLength; i += 32) {
    acc = XXH3_mix32B(acc, getView(data, i - 32), getView(data, i - 16), getView(secret, 3 + i - 160), seed);
  }
  acc = XXH3_mix32B(acc, getView(data, data.byteLength - 16), getView(data, data.byteLength - 32), getView(secret, 136 - 17 - 16), inv64(seed));
  let h128l = acc + (acc >> n(64)) & mask64;
  h128l = XXH3_avalanche(h128l);
  let h128h = (acc & mask64) * PRIME64_1 + (acc >> n(64)) * PRIME64_4 + (n(data.byteLength) - seed & mask64) * PRIME64_2;
  h128h &= mask64;
  h128h = inv64(XXH3_avalanche(h128h));
  return h128l | h128h << n(64);
}
function XXH3_128(data, seed = n(0)) {
  const len = data.byteLength;
  if (len <= 16)
    return XXH3_len_0to16_128b(data, seed);
  if (len <= 128)
    return XXH3_len_17to128_128b(data, kkey, seed);
  if (len <= 240)
    return XXH3_len_129to240_128b(data, kkey, seed);
  return XXH3_hashLong_128b(data, kkey, seed);
}
function xxh128ToBytes(hash128) {
  const result = new Uint8Array(16);
  const view = new DataView(result.buffer);
  const low64 = hash128 & mask64;
  const high64 = hash128 >> n(64);
  view.setBigUint64(0, high64, false);
  view.setBigUint64(8, low64, false);
  return result;
}
var n, PRIME32_1, PRIME32_2, PRIME32_3, PRIME64_1, PRIME64_2, PRIME64_3, PRIME64_4, PRIME64_5, PRIME_MX1, PRIME_MX2, kkey, mask128, mask64, mask32, STRIPE_LEN, ACC_NB, _U64, _U32, bswap64, bswap32, XXH_mult32to64, assert;
var init_xxhash = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/xxhash/xxhash.mjs"() {
    n = (n2) => BigInt(n2);
    PRIME32_1 = n("0x9E3779B1");
    PRIME32_2 = n("0x85EBCA77");
    PRIME32_3 = n("0xC2B2AE3D");
    PRIME64_1 = n("0x9E3779B185EBCA87");
    PRIME64_2 = n("0xC2B2AE3D27D4EB4F");
    PRIME64_3 = n("0x165667B19E3779F9");
    PRIME64_4 = n("0x85EBCA77C2B2AE63");
    PRIME64_5 = n("0x27D4EB2F165667C5");
    PRIME_MX1 = n("0x165667919E3779F9");
    PRIME_MX2 = n("0x9FB21C651E98DF25");
    kkey = hexToBytes("b8fe6c3923a44bbe7c01812cf721ad1cded46de9839097db7240a4a4b7b3671fcb79e64eccc0e578825ad07dccff7221b8084674f743248ee03590e6813a264c3c2852bb91c300cb88d0658b1b532ea371644897a20df94e3819ef46a9deacd8a8fa763fe39c343ff9dcbbc7c70b4f1d8a51e04bcdb45931c89f7ec9d9787364eac5ac8334d3ebc3c581a0fffa1363eb170ddd51b7f0da49d316552629d4689e2b16be587d47a1fc8ff8b8d17ad031ce45cb3a8f95160428afd7fbcabb4b407e");
    mask128 = (n(1) << n(128)) - n(1);
    mask64 = (n(1) << n(64)) - n(1);
    mask32 = (n(1) << n(32)) - n(1);
    STRIPE_LEN = 64;
    ACC_NB = STRIPE_LEN / 8;
    _U64 = 8;
    _U32 = 4;
    bswap64 = (a) => {
      return (a & n(255)) << n(56) | (a & n(65280)) << n(40) | (a & n(16711680)) << n(24) | (a & n(4278190080)) << n(8) | (a & n(1095216660480)) >> n(8) | (a & n(280375465082880)) >> n(24) | (a & n(71776119061217280)) >> n(40) | (a & n(18374686479671624e3)) >> n(56);
    };
    bswap32 = (a) => {
      a = (a & n(65535)) << n(16) | (a & n(4294901760)) >> n(16);
      a = (a & n(16711935)) << n(8) | (a & n(4278255360)) >> n(8);
      return a;
    };
    XXH_mult32to64 = (a, b) => (a & mask32) * (b & mask32) & mask64;
    assert = (a) => {
      if (!a)
        throw new Error("Assert failed");
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/_uuid.mjs
function assertUuid(str, which) {
  if (!UUID_REGEX.test(str)) {
    const msg = which !== void 0 ? `Invalid UUID for ${which}: ${str}` : `Invalid UUID: ${str}`;
    throw new Error(msg);
  }
  return str;
}
function uuid7FromTime(timestamp) {
  const msecs = typeof timestamp === "string" ? Date.parse(timestamp) : timestamp;
  return v7_default({ msecs, seq: 0 });
}
function getUuidVersion(uuidStr) {
  if (!UUID_REGEX.test(uuidStr)) {
    return null;
  }
  const versionChar = uuidStr[14];
  return parseInt(versionChar, 16);
}
function uuidToBytes(uuidStr) {
  const hex = uuidStr.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
function bytesToUuid(bytes) {
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function _fastHash128(str) {
  const data = _textEncoder.encode(str);
  const hash128 = XXH3_128(data);
  return xxh128ToBytes(hash128);
}
function nonCryptographicUuid7Deterministic(originalId, key) {
  const hashInput = `${originalId}:${key}`;
  const h = _fastHash128(hashInput);
  const b = new Uint8Array(16);
  const version = getUuidVersion(originalId);
  if (version === 7) {
    const originalBytes = uuidToBytes(originalId);
    b.set(originalBytes.slice(0, 6), 0);
  } else {
    b.set(h.slice(10, 16), 0);
  }
  b[6] = 112 | h[0] & 15;
  b[7] = h[1];
  b[8] = 128 | h[2] & 63;
  b.set(h.slice(3, 10), 9);
  return bytesToUuid(b);
}
var UUID_REGEX, _textEncoder;
var init_uuid2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/_uuid.mjs"() {
    init_src();
    init_warn();
    init_xxhash();
    UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    _textEncoder = new TextEncoder();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/sampling.mjs
var SAMPLING_HASH_MODULUS, encoder, isSampledById;
var init_sampling = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/sampling.mjs"() {
    init_xxhash();
    SAMPLING_HASH_MODULUS = 1000000n;
    encoder = new TextEncoder();
    isSampledById = (identifier, samplingRate) => {
      if (samplingRate === void 0 || samplingRate >= 1) {
        return true;
      }
      if (samplingRate <= 0) {
        return false;
      }
      if (identifier == null) {
        return true;
      }
      const bucket = XXH3_128(encoder.encode(identifier.toLowerCase())) % SAMPLING_HASH_MODULUS;
      return Number(bucket) / Number(SAMPLING_HASH_MODULUS) < samplingRate;
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/addressing.mjs
function rejectConflicting(project, address) {
  if (project && address) {
    throw new Error(`A run is sent to a project (${JSON.stringify(project)}) or to an address, not both.`);
  }
}
function getEnvProject() {
  return getLangSmithEnvironmentVariable("PROJECT") || getEnvironmentVariable("LANGCHAIN_SESSION") || void 0;
}
function resolveFromEnv() {
  const project = getEnvProject();
  const address = addressFromEnv();
  if (project && address) {
    throw new EnvAddressError("LANGSMITH_AGENT_* and a project are both set in the environment.");
  }
  return address ? [void 0, address] : [project ?? "default", void 0];
}
function logUntraced(error) {
  warnOnce(`LangSmith is not tracing this call: ${error.message}`);
}
function warnOnEnv() {
  if (!envNames().some((name) => getEnvironmentVariable(name))) {
    return;
  }
  try {
    resolveFromEnv();
  } catch (e) {
    warnOnce(`${e.message} Runs that name no destination in code are not traced.`);
  }
}
function applyToPayload(run, { update = false } = {}) {
  const payload = run;
  let address;
  if (typeof payload.address === "string") {
    try {
      address = addressFromLrn(payload.address);
    } catch {
      throw new Error("The run's `address` is not a valid agent address.");
    }
  } else {
    address = ensureAgent(payload.address);
  }
  delete payload.address;
  const namedProject = payload.session_id != null || payload.session_name != null;
  if (!address && !update && !namedProject) {
    address = addressFromEnv();
  }
  if (!address) {
    return;
  }
  payload.address = addressToLrn(address);
  if (!namedProject) {
    delete payload.session_name;
    delete payload.session_id;
  }
}
var init_addressing = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/addressing.mjs"() {
    init_address();
    init_env3();
    init_warn();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/v2_migration.mjs
function getQueryBackend(instanceFlags) {
  const flags = instanceFlags ?? {};
  const chEnabled = Boolean(flags.ch_query_enabled ?? true);
  const sdbEnabled = Boolean(flags.sdb_query_enabled ?? false);
  if (!chEnabled && sdbEnabled)
    return QueryBackend.SMITHDB_ONLY;
  if (chEnabled && sdbEnabled)
    return QueryBackend.DUAL;
  return QueryBackend.CLICKHOUSE_ONLY;
}
var QueryBackend;
var init_v2_migration = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/v2_migration.mjs"() {
    QueryBackend = {
      CLICKHOUSE_ONLY: "clickhouse_only",
      SMITHDB_ONLY: "smithdb_only",
      DUAL: "dual"
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/error.mjs
function getInvalidPromptIdentifierMsg(identifier) {
  return `Invalid prompt identifier format: "${identifier}". Expected one of:
  - "prompt-name" (for private prompts)
  - "owner/prompt-name" (for prompts with explicit owner)
  - "prompt-name:commit-hash" (with commit reference)
  - "owner/prompt-name:commit-hash" (with owner and commit)`;
}
function isLangSmithNotFoundError(error) {
  return error != null && typeof error === "object" && "name" in error && error?.name === "LangSmithNotFoundError";
}
function isLangSmithConflictError(error) {
  return error != null && typeof error === "object" && "name" in error && error?.name === "LangSmithConflictError";
}
async function raiseForStatus(response, context, consumeOnSuccess) {
  let errorBody;
  if (response.ok) {
    if (consumeOnSuccess) {
      errorBody = await response.text();
    }
    return;
  }
  try {
    errorBody = await response.text();
  } catch (_e) {
    errorBody = "";
  }
  if (response.status === 403) {
    let errorData;
    try {
      errorData = JSON.parse(errorBody);
    } catch {
    }
    if (errorData?.error === "org_scoped_key_requires_workspace") {
      errorBody = "This API key is org-scoped and requires workspace specification. Please provide 'workspaceId' parameter, or set LANGSMITH_WORKSPACE_ID environment variable.";
    }
  }
  const fullMessage = `Failed to ${context}. Received status [${response.status}]: ${response.statusText}. Message: ${errorBody}`;
  if (response.status === 404) {
    throw new LangSmithNotFoundError(fullMessage);
  }
  if (response.status === 409) {
    throw new LangSmithConflictError(fullMessage);
  }
  const err = new Error(fullMessage);
  err.status = response.status;
  throw err;
}
function isConflictingEndpointsError(err) {
  return typeof err === "object" && err !== null && err.code === ERR_CONFLICTING_ENDPOINTS;
}
var LangSmithConflictError, LangSmithNotFoundError, ERR_CONFLICTING_ENDPOINTS, ConflictingEndpointsError;
var init_error2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/error.mjs"() {
    LangSmithConflictError = class extends Error {
      constructor(message) {
        super(message);
        Object.defineProperty(this, "status", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.name = "LangSmithConflictError";
        this.status = 409;
      }
    };
    LangSmithNotFoundError = class extends Error {
      constructor(message) {
        super(message);
        Object.defineProperty(this, "status", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.name = "LangSmithNotFoundError";
        this.status = 404;
      }
    };
    ERR_CONFLICTING_ENDPOINTS = "ERR_CONFLICTING_ENDPOINTS";
    ConflictingEndpointsError = class extends Error {
      constructor() {
        super("You cannot provide both LANGSMITH_ENDPOINT / LANGCHAIN_ENDPOINT and LANGSMITH_RUNS_ENDPOINTS.");
        Object.defineProperty(this, "code", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: ERR_CONFLICTING_ENDPOINTS
        });
        this.name = "ConflictingEndpointsError";
      }
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/prompts.mjs
function parseHubIdentifier(identifier) {
  if (!identifier || identifier.split("/").length > 2 || identifier.startsWith("/") || identifier.endsWith("/") || identifier.split(":").length > 2) {
    throw new Error(getInvalidPromptIdentifierMsg(identifier));
  }
  const [ownerNamePart, commitPart] = identifier.split(":");
  const commit = commitPart || "latest";
  if (ownerNamePart.includes("/")) {
    const [owner, name] = ownerNamePart.split("/", 2);
    if (!owner || !name) {
      throw new Error(getInvalidPromptIdentifierMsg(identifier));
    }
    return [owner, name, commit];
  } else {
    if (!ownerNamePart) {
      throw new Error(getInvalidPromptIdentifierMsg(identifier));
    }
    return ["-", ownerNamePart, commit];
  }
}
var init_prompts = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/prompts.mjs"() {
    init_error2();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/fs.mjs
import * as nodeFs from "node:fs";
import * as nodeFsPromises from "node:fs/promises";
import * as nodePath from "node:path";
async function mkdir2(dir) {
  await nodeFsPromises.mkdir(dir, { recursive: true });
}
async function writeFileAtomic(filePath, content) {
  const tempPath = `${filePath}.tmp`;
  await nodeFsPromises.writeFile(tempPath, content, {
    encoding: "utf8",
    mode: 384
  });
  await nodeFsPromises.rename(tempPath, filePath);
}
async function readdir2(dir) {
  return nodeFsPromises.readdir(dir);
}
async function stat2(filePath) {
  return nodeFsPromises.stat(filePath);
}
function existsSync2(p) {
  return nodeFs.existsSync(p);
}
function mkdirSync3(dir) {
  nodeFs.mkdirSync(dir, { recursive: true });
}
function writeFileSync3(filePath, content) {
  nodeFs.writeFileSync(filePath, content);
}
function renameSync4(oldPath, newPath) {
  nodeFs.renameSync(oldPath, newPath);
}
function unlinkSync3(filePath) {
  nodeFs.unlinkSync(filePath);
}
function readFileSync3(filePath) {
  return nodeFs.readFileSync(filePath, "utf-8");
}
async function mkdirExclusive(dir) {
  await nodeFsPromises.mkdir(dir, { mode: 448 });
}
function statMtimeMs(filePath) {
  try {
    return nodeFs.statSync(filePath).mtimeMs;
  } catch {
    return void 0;
  }
}
async function rmRecursive(filePath) {
  await nodeFsPromises.rm(filePath, { recursive: true, force: true });
}
var path3;
var init_fs = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/fs.mjs"() {
    path3 = nodePath;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/prompt_cache/index.mjs
function isStale(entry2, ttlSeconds) {
  if (ttlSeconds === null) {
    return false;
  }
  const ageMs = Date.now() - entry2.createdAt;
  return ageMs > ttlSeconds * 1e3;
}
var PromptCache, promptCacheSingleton;
var init_prompt_cache = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/prompt_cache/index.mjs"() {
    init_fs();
    PromptCache = class {
      constructor(config = {}) {
        Object.defineProperty(this, "cache", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: /* @__PURE__ */ new Map()
        });
        Object.defineProperty(this, "maxSize", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "ttlSeconds", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "refreshIntervalSeconds", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "refreshTimer", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_metrics", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: {
            hits: 0,
            misses: 0,
            refreshes: 0,
            refreshErrors: 0
          }
        });
        this.configure(config);
      }
      /**
       * Get cache performance metrics.
       */
      get metrics() {
        return { ...this._metrics };
      }
      /**
       * Get total cache requests (hits + misses).
       */
      get totalRequests() {
        return this._metrics.hits + this._metrics.misses;
      }
      /**
       * Get cache hit rate (0.0 to 1.0).
       */
      get hitRate() {
        const total = this.totalRequests;
        return total > 0 ? this._metrics.hits / total : 0;
      }
      /**
       * Reset all metrics to zero.
       */
      resetMetrics() {
        this._metrics = {
          hits: 0,
          misses: 0,
          refreshes: 0,
          refreshErrors: 0
        };
      }
      /**
       * Get a value from cache.
       *
       * Returns the cached value or undefined if not found.
       * Stale entries are still returned (background refresh handles updates).
       */
      get(key, refreshFunc) {
        if (this.maxSize === 0) {
          return void 0;
        }
        const entry2 = this.cache.get(key);
        if (!entry2) {
          this._metrics.misses += 1;
          return void 0;
        }
        this.cache.delete(key);
        this.cache.set(key, { ...entry2, refreshFunc });
        this._metrics.hits += 1;
        return entry2.value;
      }
      /**
       * Set a value in the cache.
       */
      set(key, value, refreshFunc) {
        if (this.maxSize === 0) {
          return;
        }
        if (this.refreshTimer === void 0) {
          this.startRefreshLoop();
        }
        if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
          const oldestKey = this.cache.keys().next().value;
          if (oldestKey !== void 0) {
            this.cache.delete(oldestKey);
          }
        }
        const entry2 = {
          value,
          createdAt: Date.now(),
          refreshFunc
        };
        this.cache.delete(key);
        this.cache.set(key, entry2);
      }
      /**
       * Remove a specific entry from cache.
       */
      invalidate(key) {
        this.cache.delete(key);
      }
      /**
       * Clear all cache entries.
       */
      clear() {
        this.cache.clear();
      }
      /**
       * Get the number of entries in the cache.
       */
      get size() {
        return this.cache.size;
      }
      /**
       * Stop background refresh.
       * Should be called when the client is being cleaned up.
       */
      stop() {
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer);
          this.refreshTimer = void 0;
        }
      }
      /**
       * Dump cache contents to a JSON file for offline use.
       */
      dump(filePath) {
        const entries = {};
        for (const [key, entry2] of this.cache.entries()) {
          entries[key] = entry2.value;
        }
        const dir = path3.dirname(filePath);
        if (!existsSync2(dir)) {
          mkdirSync3(dir);
        }
        const tempPath = `${filePath}.tmp`;
        try {
          writeFileSync3(tempPath, JSON.stringify({ entries }, null, 2));
          renameSync4(tempPath, filePath);
        } catch (e) {
          if (existsSync2(tempPath)) {
            unlinkSync3(tempPath);
          }
          throw e;
        }
      }
      /**
       * Load cache contents from a JSON file.
       *
       * Loaded entries get a fresh TTL starting from load time.
       *
       * @returns Number of entries loaded.
       */
      load(filePath) {
        if (!existsSync2(filePath)) {
          return 0;
        }
        let entries;
        try {
          const content = readFileSync3(filePath);
          const data = JSON.parse(content);
          entries = data.entries ?? null;
        } catch {
          return 0;
        }
        if (!entries) {
          return 0;
        }
        let loaded = 0;
        const now = Date.now();
        for (const [key, value] of Object.entries(entries)) {
          if (this.cache.size >= this.maxSize) {
            break;
          }
          const entry2 = {
            value,
            createdAt: now
            // Fresh TTL from load time
          };
          this.cache.set(key, entry2);
          loaded += 1;
        }
        return loaded;
      }
      /**
       * Start the background refresh loop.
       */
      startRefreshLoop() {
        this.stop();
        if (this.ttlSeconds !== null) {
          this.refreshTimer = setInterval(() => {
            this.refreshStaleEntries().catch((e) => {
              console.warn("Unexpected error in cache refresh loop:", e);
            });
          }, this.refreshIntervalSeconds * 1e3);
          if (this.refreshTimer.unref) {
            this.refreshTimer.unref();
          }
        }
      }
      /**
       * Get list of stale cache keys.
       */
      getStaleEntries() {
        const staleEntries = [];
        for (const [key, value] of this.cache.entries()) {
          if (isStale(value, this.ttlSeconds)) {
            staleEntries.push([key, value]);
          }
        }
        return staleEntries;
      }
      /**
       * Check for stale entries and refresh them.
       */
      async refreshStaleEntries() {
        const staleEntries = this.getStaleEntries();
        if (staleEntries.length === 0) {
          return;
        }
        for (const [key, value] of staleEntries) {
          if (value.refreshFunc !== void 0) {
            try {
              const newValue = await value.refreshFunc();
              this.set(key, newValue, value.refreshFunc);
              this._metrics.refreshes += 1;
            } catch (e) {
              this._metrics.refreshErrors += 1;
              console.warn(`Failed to refresh cache entry ${key}:`, e);
            }
          }
        }
      }
      configure(config) {
        this.stop();
        this.refreshIntervalSeconds = config.refreshIntervalSeconds ?? 60;
        this.maxSize = config.maxSize ?? 100;
        this.ttlSeconds = config.ttlSeconds ?? 5 * 60;
      }
    };
    promptCacheSingleton = new PromptCache();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/fetch.mjs
var DEFAULT_FETCH_IMPLEMENTATION, globalFetchSupportsWebStreaming, LANGSMITH_FETCH_IMPLEMENTATION_KEY, _shouldStreamForGlobalFetchImplementation, _getFetchImplementation;
var init_fetch = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/fetch.mjs"() {
    init_env3();
    DEFAULT_FETCH_IMPLEMENTATION = (...args) => fetch(...args);
    globalFetchSupportsWebStreaming = void 0;
    LANGSMITH_FETCH_IMPLEMENTATION_KEY = /* @__PURE__ */ Symbol.for("ls:fetch_implementation");
    _shouldStreamForGlobalFetchImplementation = () => {
      const overriddenFetchImpl = globalThis[LANGSMITH_FETCH_IMPLEMENTATION_KEY];
      if (overriddenFetchImpl === void 0) {
        return true;
      }
      return globalFetchSupportsWebStreaming ?? false;
    };
    _getFetchImplementation = (debug) => {
      return async (...args) => {
        if (debug || getLangSmithEnvironmentVariable("DEBUG") === "true") {
          const [url, options] = args;
          console.log(`\u2192 ${options?.method || "GET"} ${url}`);
        }
        const res = await (globalThis[LANGSMITH_FETCH_IMPLEMENTATION_KEY] ?? DEFAULT_FETCH_IMPLEMENTATION)(...args);
        if (debug || getLangSmithEnvironmentVariable("DEBUG") === "true") {
          console.log(`\u2190 ${res.status} ${res.statusText} ${res.url}`);
        }
        return res;
      };
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/fast-safe-stringify/index.mjs
function defaultOptions() {
  return {
    depthLimit: Number.MAX_SAFE_INTEGER,
    edgesLimit: Number.MAX_SAFE_INTEGER
  };
}
function encodeString(str) {
  return encoder2.encode(str);
}
function serializeWellKnownTypes(val) {
  if (val && typeof val === "object" && val !== null) {
    if (val instanceof Map) {
      return Object.fromEntries(val);
    } else if (val instanceof Set) {
      return Array.from(val);
    } else if (val instanceof Date) {
      return val.toISOString();
    } else if (val instanceof RegExp) {
      return val.toString();
    } else if (val instanceof Error) {
      return {
        name: val.name,
        message: val.message
      };
    }
  } else if (typeof val === "bigint") {
    return val.toString();
  }
  return val;
}
function createDefaultReplacer(userReplacer) {
  return function(key, val) {
    if (userReplacer) {
      const userResult = userReplacer.call(this, key, val);
      if (userResult !== void 0) {
        return userResult;
      }
    }
    return serializeWellKnownTypes(val);
  };
}
function estimateSerializedSize(value) {
  try {
    let estimateString = function(s) {
      const n2 = byteLen(s);
      if (n2 > maxStringLen)
        maxStringLen = n2;
      return n2 + 2;
    }, estimateByteArrayJson = function(byteLength) {
      if (byteLength === 0)
        return 2;
      return 2 + byteLength * 4;
    }, isDropped = function(v) {
      return v === void 0 || typeof v === "function" || typeof v === "symbol";
    }, estimateInArray = function(v) {
      if (v === void 0 || typeof v === "function" || typeof v === "symbol") {
        return 4;
      }
      return estimate(v);
    }, estimate = function(val) {
      if (val === null)
        return 4;
      if (val === void 0)
        return 0;
      const t = typeof val;
      if (t === "boolean")
        return 5;
      if (t === "number") {
        if (!Number.isFinite(val))
          return 4;
        return val.toString().length;
      }
      if (t === "bigint") {
        return val.toString().length + 2;
      }
      if (t === "string")
        return estimateString(val);
      if (t === "function" || t === "symbol")
        return 0;
      const obj = val;
      if (obj instanceof Date)
        return 26;
      if (obj instanceof RegExp)
        return byteLen(obj.toString()) + 2;
      if (obj instanceof Error) {
        const name = obj.name ?? "";
        const message = obj.message ?? "";
        return 22 + byteLen(name) + byteLen(message);
      }
      if (typeof Buffer !== "undefined" && obj instanceof Buffer) {
        return 28 + estimateByteArrayJson(obj.byteLength);
      }
      if (ArrayBuffer.isView(obj)) {
        if (obj instanceof DataView) {
          return 2;
        }
        const len = obj.length ?? 0;
        const isFloat = obj instanceof Float32Array || obj instanceof Float64Array;
        const perElement = isFloat ? 30 : 12;
        return 2 + len * perElement;
      }
      if (obj instanceof ArrayBuffer) {
        return 2;
      }
      if (ancestors.has(obj)) {
        return 24;
      }
      if (typeof obj.toJSON === "function") {
        let projected;
        try {
          projected = obj.toJSON("");
        } catch {
          return 16;
        }
        ancestors.add(obj);
        const size3 = estimate(projected);
        ancestors.delete(obj);
        return size3;
      }
      ancestors.add(obj);
      let size2;
      if (Array.isArray(obj)) {
        size2 = 2;
        const len = obj.length;
        for (let i = 0; i < len; i++) {
          size2 += estimateInArray(obj[i]);
          if (i < len - 1)
            size2 += 1;
        }
      } else if (obj instanceof Map) {
        size2 = 2;
        let emitted = 0;
        for (const [k, v] of obj) {
          if (isDropped(v))
            continue;
          if (emitted > 0)
            size2 += 1;
          const keyStr = typeof k === "string" ? k : String(k);
          size2 += byteLen(keyStr) + 3;
          size2 += estimate(v);
          emitted++;
        }
      } else if (obj instanceof Set) {
        size2 = 2;
        let emitted = 0;
        for (const v of obj) {
          if (emitted > 0)
            size2 += 1;
          size2 += estimateInArray(v);
          emitted++;
        }
      } else {
        size2 = 2;
        let emitted = 0;
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const v = obj[key];
          if (isDropped(v))
            continue;
          if (emitted > 0)
            size2 += 1;
          size2 += byteLen(key) + 3;
          size2 += estimate(v);
          emitted++;
        }
      }
      ancestors.delete(obj);
      return size2;
    };
    const ancestors = /* @__PURE__ */ new Set();
    let maxStringLen = 0;
    const byteLen = typeof Buffer !== "undefined" && typeof Buffer.byteLength === "function" ? (s) => Buffer.byteLength(s, "utf8") : (s) => s.length;
    const size = estimate(value);
    return { size, maxStringLen };
  } catch {
    return { size: serialize(value).length, maxStringLen: 0 };
  }
}
function serialize(obj, errorContext, replacer, spacer, options) {
  try {
    const str = JSON.stringify(obj, createDefaultReplacer(replacer), spacer);
    return encodeString(str);
  } catch (e) {
    if (!e.message?.includes("Converting circular structure to JSON")) {
      console.warn(`[WARNING]: LangSmith received unserializable value.${errorContext ? `
Context: ${errorContext}` : ""}`);
      return encodeString("[Unserializable]");
    }
    getLangSmithEnvironmentVariable("SUPPRESS_CIRCULAR_JSON_WARNINGS") !== "true" && console.warn(`[WARNING]: LangSmith received circular JSON. This will decrease tracer performance. ${errorContext ? `
Context: ${errorContext}` : ""}`);
    if (typeof options === "undefined") {
      options = defaultOptions();
    }
    decirc(obj, "", 0, [], void 0, 0, options);
    let res;
    try {
      if (replacerStack.length === 0) {
        res = JSON.stringify(obj, replacer, spacer);
      } else {
        res = JSON.stringify(obj, replaceGetterValues(replacer), spacer);
      }
    } catch (_) {
      return encodeString("[unable to serialize, circular reference is too complex to analyze]");
    } finally {
      while (arr.length !== 0) {
        const part = arr.pop();
        if (part.length === 4) {
          Object.defineProperty(part[0], part[1], part[3]);
        } else {
          part[0][part[1]] = part[2];
        }
      }
    }
    return encodeString(res);
  }
}
function setReplace(replace, val, k, parent) {
  var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k);
  if (propertyDescriptor.get !== void 0) {
    if (propertyDescriptor.configurable) {
      Object.defineProperty(parent, k, { value: replace });
      arr.push([parent, k, val, propertyDescriptor]);
    } else {
      replacerStack.push([val, k, replace]);
    }
  } else {
    parent[k] = replace;
    arr.push([parent, k, val]);
  }
}
function decirc(val, k, edgeIndex, stack, parent, depth, options) {
  depth += 1;
  var i;
  if (typeof val === "object" && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent);
        return;
      }
    }
    if (typeof options.depthLimit !== "undefined" && depth > options.depthLimit) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
      return;
    }
    if (typeof options.edgesLimit !== "undefined" && edgeIndex + 1 > options.edgesLimit) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
      return;
    }
    stack.push(val);
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        decirc(val[i], i, i, stack, val, depth, options);
      }
    } else {
      val = serializeWellKnownTypes(val);
      var keys = Object.keys(val);
      for (i = 0; i < keys.length; i++) {
        var key = keys[i];
        decirc(val[key], key, i, stack, val, depth, options);
      }
    }
    stack.pop();
  }
}
function replaceGetterValues(replacer) {
  replacer = typeof replacer !== "undefined" ? replacer : function(k, v) {
    return v;
  };
  return function(key, val) {
    if (replacerStack.length > 0) {
      for (var i = 0; i < replacerStack.length; i++) {
        var part = replacerStack[i];
        if (part[1] === key && part[0] === val) {
          val = part[2];
          replacerStack.splice(i, 1);
          break;
        }
      }
    }
    return replacer.call(this, key, val);
  };
}
var LIMIT_REPLACE_NODE, CIRCULAR_REPLACE_NODE, arr, replacerStack, encoder2;
var init_fast_safe_stringify = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/fast-safe-stringify/index.mjs"() {
    init_env3();
    LIMIT_REPLACE_NODE = "[...]";
    CIRCULAR_REPLACE_NODE = { result: "[Circular]" };
    arr = [];
    replacerStack = [];
    encoder2 = new TextEncoder();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/worker_threads.mjs
import { Worker as NodeWorker } from "node:worker_threads";
var Worker, WORKER_THREADS_AVAILABLE;
var init_worker_threads = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/worker_threads.mjs"() {
    Worker = NodeWorker;
    WORKER_THREADS_AVAILABLE = true;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/serialize_worker.mjs
function getSharedSerializeWorker() {
  if (sharedWorker === null)
    sharedWorker = new SerializeWorker();
  return sharedWorker;
}
function hasLargeString(value, threshold = LARGE_STRING_THRESHOLD, nodeBudget = NODE_BUDGET) {
  if (value === null || typeof value !== "object") {
    return typeof value === "string" && value.length >= threshold;
  }
  const stack = [value];
  const seen = /* @__PURE__ */ new Set();
  let visited = 0;
  while (stack.length > 0) {
    if (visited++ >= nodeBudget)
      return false;
    const cur = stack.pop();
    if (cur === null || cur === void 0)
      continue;
    const t = typeof cur;
    if (t === "string") {
      if (cur.length >= threshold)
        return true;
      continue;
    }
    if (t !== "object")
      continue;
    const obj = cur;
    if (seen.has(obj))
      continue;
    seen.add(obj);
    if (obj instanceof Date || obj instanceof RegExp || obj instanceof Error || obj instanceof ArrayBuffer || ArrayBuffer.isView(obj)) {
      continue;
    }
    if (Array.isArray(obj)) {
      for (let i = obj.length - 1; i >= 0; i--)
        stack.push(obj[i]);
      continue;
    }
    if (obj instanceof Map) {
      for (const [, v] of obj)
        stack.push(v);
      continue;
    }
    if (obj instanceof Set) {
      for (const v of obj)
        stack.push(v);
      continue;
    }
    const keys = Object.keys(obj);
    for (let i = keys.length - 1; i >= 0; i--) {
      stack.push(obj[keys[i]]);
    }
  }
  return false;
}
var WORKER_SOURCE, SerializeWorker, sharedWorker, LARGE_STRING_THRESHOLD, NODE_BUDGET;
var init_serialize_worker = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/serialize_worker.mjs"() {
    init_worker_threads();
    WORKER_SOURCE = /* js */
    `
const { parentPort } = require("worker_threads");

const CIRCULAR_REPLACE_NODE = { result: "[Circular]" };

function serializeWellKnownTypes(val) {
  if (val && typeof val === "object") {
    if (val instanceof Map) return Object.fromEntries(val);
    if (val instanceof Set) return Array.from(val);
    if (val instanceof Date) return val.toISOString();
    if (val instanceof RegExp) return val.toString();
    if (val instanceof Error) return { name: val.name, message: val.message };
  } else if (typeof val === "bigint") {
    return val.toString();
  }
  return val;
}

function defaultReplacer(_key, val) {
  return serializeWellKnownTypes(val);
}

// Decirculate in-place: replace circular refs with { result: "[Circular]" }
// then restore after stringify. Mirrors fast-safe-stringify's decirc().
const restoreStack = [];
function decirc(val, k, stack, parent) {
  if (typeof val === "object" && val !== null) {
    for (let i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        const orig = parent[k];
        parent[k] = CIRCULAR_REPLACE_NODE;
        restoreStack.push([parent, k, orig]);
        return;
      }
    }
    stack.push(val);
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) decirc(val[i], i, stack, val);
    } else {
      const normalized = serializeWellKnownTypes(val);
      // Only recurse into normalized if it's still an object (arrays/objects),
      // else it was replaced with a primitive (e.g. Date -> string).
      if (normalized === val) {
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) decirc(val[keys[i]], keys[i], stack, val);
      }
    }
    stack.pop();
  }
}

function serialize(obj) {
  try {
    return JSON.stringify(obj, defaultReplacer);
  } catch (e) {
    if (!String(e && e.message).includes("Converting circular structure to JSON")) {
      return "[Unserializable]";
    }
    decirc(obj, "", [], { "": obj });
    try {
      return JSON.stringify(obj, defaultReplacer);
    } catch (_) {
      return "[unable to serialize, circular reference is too complex to analyze]";
    } finally {
      while (restoreStack.length) {
        const [p, k, v] = restoreStack.pop();
        p[k] = v;
      }
    }
  }
}

parentPort.on("message", (msg) => {
  const { id, op, payload } = msg;
  try {
    if (op === "serialize") {
      const str = serialize(payload);
      const buf = Buffer.from(str, "utf8");
      // Slice into its own ArrayBuffer so we can transfer without dragging
      // unrelated bytes from any shared pool buffer.
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      parentPort.postMessage({ id, bytes: ab, length: buf.byteLength }, [ab]);
    } else if (op === "ping") {
      parentPort.postMessage({ id });
    } else {
      parentPort.postMessage({ id, error: "unknown op: " + op });
    }
  } catch (e) {
    parentPort.postMessage({ id, error: String((e && e.message) || e) });
  }
});
`;
    SerializeWorker = class {
      constructor() {
        Object.defineProperty(this, "worker", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: null
        });
        Object.defineProperty(this, "nextId", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: 1
        });
        Object.defineProperty(this, "pending", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: /* @__PURE__ */ new Map()
        });
        Object.defineProperty(this, "disabled", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: false
        });
        Object.defineProperty(this, "startPromise", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: null
        });
      }
      /**
       * Try to construct the worker. Returns false if the runtime can't support
       * it -- in that case callers must fall back to synchronous serialization.
       * Kept async so callers don't have to branch on runtime -- the promise
       * resolves synchronously on the microtask queue when the worker module
       * is available, which is the common Node CJS/ESM path.
       */
      async ensureStarted() {
        if (this.disabled)
          return false;
        if (this.worker !== null)
          return true;
        if (this.startPromise !== null)
          return this.startPromise;
        this.startPromise = this._start();
        try {
          return await this.startPromise;
        } finally {
          this.startPromise = null;
        }
      }
      async _start() {
        if (!WORKER_THREADS_AVAILABLE || Worker === null) {
          this.disabled = true;
          return false;
        }
        try {
          const worker = new Worker(WORKER_SOURCE, { eval: true });
          worker.on("message", (msg) => {
            const p = this.pending.get(msg.id);
            if (!p)
              return;
            this.pending.delete(msg.id);
            if (msg.error) {
              p.reject(new Error(msg.error));
            } else if (msg.bytes && typeof msg.length === "number") {
              p.resolve(new Uint8Array(msg.bytes, 0, msg.length));
            } else {
              p.reject(new Error("worker returned malformed message"));
            }
          });
          worker.on("error", (err) => {
            for (const [, p] of this.pending)
              p.reject(err);
            this.pending.clear();
            this.disabled = true;
            this.worker = null;
          });
          worker.on("exit", (code) => {
            for (const [, p] of this.pending) {
              p.reject(new Error(`worker exited with code ${code}`));
            }
            this.pending.clear();
            this.worker = null;
          });
          worker.unref();
          this.worker = worker;
          return true;
        } catch {
          this.disabled = true;
          return false;
        }
      }
      /**
       * Serialize a payload off-thread. Rejects with DataCloneError (or similar)
       * if the payload contains non-cloneable values -- callers must catch and
       * fall back to synchronous serialize().
       *
       * Resolves with null if the worker subsystem is unavailable entirely,
       * so the caller can fall back without paying try/catch overhead.
       */
      async serialize(payload) {
        const ok = await this.ensureStarted();
        if (!ok)
          return null;
        const id = this.nextId++;
        return new Promise((resolve2, reject) => {
          this.pending.set(id, { resolve: resolve2, reject });
          try {
            this.worker.postMessage({ id, op: "serialize", payload });
          } catch (e) {
            this.pending.delete(id);
            reject(e);
          }
        });
      }
      async terminate() {
        if (this.worker) {
          await this.worker.terminate();
          this.worker = null;
        }
        for (const [, p] of this.pending) {
          p.reject(new Error("worker terminated"));
        }
        this.pending.clear();
      }
    };
    sharedWorker = null;
    LARGE_STRING_THRESHOLD = 64 * 1024;
    NODE_BUDGET = 2048;
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/client.mjs
function assertPullPublicPromptAllowed(promptIdentifier, dangerouslyPullPublicPrompt) {
  const [owner] = parseHubIdentifier(promptIdentifier);
  if (owner !== "-" && !dangerouslyPullPublicPrompt) {
    throw new Error("Pulling a public prompt by owner/name is disabled by default because prompts may contain untrusted serialized LangChain objects. If you trust this prompt, set `dangerouslyPullPublicPrompt: true` to acknowledge the risk.");
  }
}
function _ensureUTCTimestamp(ts) {
  if (typeof ts === "string" && ts.length > 0 && !ts.includes("Z") && !ts.includes("+") && !ts.includes("-", 10)) {
    return ts + "Z";
  }
  return ts;
}
function _normalizeRunTimestamps(run) {
  return {
    ...run,
    start_time: _ensureUTCTimestamp(run.start_time),
    end_time: _ensureUTCTimestamp(run.end_time)
  };
}
function indexRunCreatesById(creates) {
  const byId = {};
  for (const run of creates) {
    if (!run.id) {
      continue;
    }
    const previous = byId[run.id];
    if (previous !== void 0 && previous.session_name !== run.session_name) {
      console.warn(`LangSmith run ${run.id} was queued for two projects with the same id (${JSON.stringify(previous.session_name)} and ${JSON.stringify(run.session_name)}); only one of the projects will keep the run. This usually means two write replicas both keep the original run ids, for example a replica marked \`primary\` plus one for the run's own project.`);
    }
    byId[run.id] = run;
  }
  return byId;
}
function mergeRuntimeEnvIntoRun(run, cachedEnvVars, omitTracedRuntimeInfo, tracingSampleRate) {
  if (omitTracedRuntimeInfo) {
    return run;
  }
  const runtimeEnv = getRuntimeEnvironment();
  const envVars = cachedEnvVars ?? getLangSmithEnvVarsMetadata();
  const extra = run.extra ?? {};
  const metadata = extra.metadata;
  run.extra = {
    ...extra,
    runtime: {
      ...runtimeEnv,
      ...extra?.runtime
    },
    metadata: {
      ...envVars,
      ...envVars.revision_id || "revision_id" in run && run.revision_id ? {
        revision_id: ("revision_id" in run ? run.revision_id : void 0) ?? envVars.revision_id
      } : {},
      ...metadata,
      ...tracingSampleRate !== void 0 ? { ls_tracing_sample_rate: tracingSampleRate } : {}
    }
  };
  return run;
}
async function toArray(iterable) {
  const result = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}
function trimQuotes(str) {
  if (str === void 0) {
    return void 0;
  }
  return str.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}
function _formatFeedbackScore(score) {
  if (typeof score === "number") {
    return Number(score.toFixed(4));
  }
  return score;
}
function _checkBackendVersion(backendVersion, minVersion) {
  if (!backendVersion) {
    return;
  }
  const parse2 = (v) => v.split(".").map((s) => parseInt(s, 10));
  const [maj, min, pat] = parse2(backendVersion);
  const [rMaj, rMin, rPat] = parse2(minVersion);
  if (isNaN(maj) || isNaN(min) || isNaN(pat) || isNaN(rMaj) || isNaN(rMin) || isNaN(rPat)) {
    console.warn(`[LANGSMITH]: Could not parse backend version ${JSON.stringify(backendVersion)} for compatibility check.`);
    return;
  }
  if (maj < rMaj || maj === rMaj && min < rMin || maj === rMaj && min === rMin && pat < rPat) {
    console.warn(`[LANGSMITH]: Backend version ${JSON.stringify(backendVersion)} is older than the minimum version required by this SDK (${JSON.stringify(minVersion)}). Some features may not work as expected. See https://docs.langchain.com/langsmith/smithdb-sdk-migration`);
  }
}
function assertValidHeader(name, value) {
  new Headers({ [name]: value });
}
function assertValidHeaders(headers) {
  for (const [name, value] of Object.entries(headers ?? {})) {
    assertValidHeader(name, value);
  }
}
function normalizeHeaders(headers) {
  if (!headers)
    return {};
  const entries = headers instanceof Headers ? [...headers.entries()] : Array.isArray(headers) ? headers.map(([name, value]) => [name, value]) : Object.entries(headers);
  const normalized = {};
  const nameByLower = /* @__PURE__ */ new Map();
  for (const [name, value] of entries) {
    assertValidHeader(name, value);
    const lowerName = name.toLowerCase();
    const existingName = nameByLower.get(lowerName);
    if (existingName === void 0) {
      nameByLower.set(lowerName, name);
      normalized[name] = value;
    } else {
      normalized[existingName] = value;
    }
  }
  return normalized;
}
function mergeCallerHeaders(base, overrides, reserved) {
  const merged = { ...base };
  const nameByLower = new Map(Object.keys(merged).map((name) => [name.toLowerCase(), name]));
  for (const [name, value] of Object.entries(overrides)) {
    const lowerName = name.toLowerCase();
    merged[nameByLower.get(lowerName) ?? name] = value;
  }
  for (const name of Object.keys(merged)) {
    if (reserved.has(name.toLowerCase())) {
      delete merged[name];
    }
  }
  return merged;
}
function isExampleCreate(input) {
  return "dataset_id" in input || "dataset_name" in input;
}
function getExampleReferenceOutputs(example) {
  if (example.reference_outputs !== void 0 && example.outputs !== void 0) {
    throw new Error("Cannot specify both reference_outputs and outputs");
  }
  return example.reference_outputs ?? example.outputs;
}
var getTracingSamplingRate, isLocalhost, handle429, DEFAULT_UNCOMPRESSED_BATCH_SIZE_LIMIT_BYTES, DEFAULT_MAX_SIZE_BYTES, SERVER_INFO_REQUEST_TIMEOUT_MS, DEFAULT_BATCH_SIZE_LIMIT, AutoBatchQueue, Client;
var init_client2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/client.mjs"() {
    init_address();
    init_src();
    init_api_url();
    init_translator();
    init_otel();
    init_async_caller();
    init_messages();
    init_env3();
    init_lib();
    init_client();
    init_uuid2();
    init_sampling();
    init_warn();
    init_address();
    init_addressing();
    init_v2_migration();
    init_prompts();
    init_error2();
    init_prompt_cache();
    init_fs();
    init_fetch();
    init_profiles();
    init_fast_safe_stringify();
    init_serialize_worker();
    getTracingSamplingRate = (configRate) => {
      const samplingRateStr = configRate?.toString() ?? getLangSmithEnvironmentVariable("TRACING_SAMPLING_RATE");
      if (samplingRateStr === void 0) {
        return void 0;
      }
      const samplingRate = parseFloat(samplingRateStr);
      if (samplingRate < 0 || samplingRate > 1) {
        throw new Error(`LANGSMITH_TRACING_SAMPLING_RATE must be between 0 and 1 if set. Got: ${samplingRate}`);
      }
      return samplingRate;
    };
    isLocalhost = (url) => {
      const strippedUrl = url.replace("http://", "").replace("https://", "");
      const hostname = strippedUrl.split("/")[0].split(":")[0];
      return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    };
    handle429 = async (response) => {
      if (response?.status === 429) {
        const retryAfter = parseInt(response.headers.get("retry-after") ?? "10", 10) * 1e3;
        if (retryAfter > 0) {
          await new Promise((resolve2) => setTimeout(resolve2, retryAfter));
          return true;
        }
      }
      return false;
    };
    DEFAULT_UNCOMPRESSED_BATCH_SIZE_LIMIT_BYTES = 24 * 1024 * 1024;
    DEFAULT_MAX_SIZE_BYTES = 1024 * 1024 * 1024;
    SERVER_INFO_REQUEST_TIMEOUT_MS = 1e4;
    DEFAULT_BATCH_SIZE_LIMIT = 100;
    AutoBatchQueue = class {
      constructor(maxSizeBytes) {
        Object.defineProperty(this, "items", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: []
        });
        Object.defineProperty(this, "sizeBytes", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: 0
        });
        Object.defineProperty(this, "maxSizeBytes", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.maxSizeBytes = maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
      }
      peek() {
        return this.items[0];
      }
      push(item) {
        let itemPromiseResolve;
        const itemPromise = new Promise((resolve2) => {
          itemPromiseResolve = resolve2;
        });
        const size = estimateSerializedSize(item.item).size;
        if (this.sizeBytes + size > this.maxSizeBytes && this.items.length > 0) {
          console.warn(`AutoBatchQueue size limit (${this.maxSizeBytes} bytes) exceeded. Dropping run with id: ${item.item.id}. Current queue size: ${this.sizeBytes} bytes, attempted addition: ${size} bytes.`);
          itemPromiseResolve();
          return itemPromise;
        }
        this.items.push({
          action: item.action,
          payload: item.item,
          otelContext: item.otelContext,
          apiKey: item.apiKey,
          apiUrl: item.apiUrl,
          workspaceId: item.workspaceId,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          itemPromiseResolve,
          itemPromise,
          size
        });
        this.sizeBytes += size;
        return itemPromise;
      }
      pop({ upToSizeBytes, upToSize }) {
        if (upToSizeBytes < 1) {
          throw new Error("Number of bytes to pop off may not be less than 1.");
        }
        const popped = [];
        let poppedSizeBytes = 0;
        while (poppedSizeBytes + (this.peek()?.size ?? 0) < upToSizeBytes && this.items.length > 0 && popped.length < upToSize) {
          const item = this.items.shift();
          if (item) {
            popped.push(item);
            poppedSizeBytes += item.size;
            this.sizeBytes -= item.size;
          }
        }
        if (popped.length === 0 && this.items.length > 0) {
          const item = this.items.shift();
          popped.push(item);
          poppedSizeBytes += item.size;
          this.sizeBytes -= item.size;
        }
        return [
          popped.map((it) => ({
            action: it.action,
            item: it.payload,
            otelContext: it.otelContext,
            apiKey: it.apiKey,
            apiUrl: it.apiUrl,
            workspaceId: it.workspaceId,
            size: it.size
          })),
          () => popped.forEach((it) => it.itemPromiseResolve())
        ];
      }
    };
    Client = class _Client {
      get tracingMode() {
        return this._tracingMode;
      }
      get _fetch() {
        const fetchImplementation = this.fetchImplementation || _getFetchImplementation(this.debug);
        return (async (input, init) => {
          let authHeader;
          const profileManagedAuthorization = this.getProfileManagedAuthorizationHeader(init);
          if (this.apiKey !== void 0) {
            authHeader = { name: "x-api-key", value: `${this.apiKey}` };
          } else if (!this.hasExplicitAuthHeader(init, profileManagedAuthorization)) {
            authHeader = await this.profileAuth?.getAuthHeader(fetchImplementation, init?.signal);
          }
          return fetchImplementation(input, this.applyCurrentAuthHeaders(init, authHeader, profileManagedAuthorization));
        });
      }
      getProfileManagedAuthorizationHeader(init) {
        if (!init?.headers || !this.profileAuth) {
          return void 0;
        }
        const authorization = new Headers(init.headers).get("Authorization");
        if (!hasValue(authorization)) {
          return void 0;
        }
        return this.profileAuth.isProfileAuthorizationHeader(authorization ?? "") ? authorization ?? void 0 : void 0;
      }
      isProfileManagedAuthorizationHeader(value, profileManagedAuthorization) {
        return value === profileManagedAuthorization || this.profileAuth?.isProfileAuthorizationHeader(value) === true;
      }
      hasExplicitAuthHeader(init, profileManagedAuthorization) {
        if (!init?.headers) {
          return false;
        }
        const headers = new Headers(init.headers);
        if (hasValue(headers.get("x-api-key"))) {
          return true;
        }
        const authorization = headers.get("Authorization");
        if (!hasValue(authorization)) {
          return false;
        }
        return !this.isProfileManagedAuthorizationHeader(authorization ?? "", profileManagedAuthorization);
      }
      applyCurrentAuthHeaders(init, authHeader, profileManagedAuthorization) {
        if (!authHeader) {
          return init;
        }
        const applyAuth = (headers2) => {
          if (this.apiKey !== void 0 && authHeader.name === "x-api-key") {
            headers2.delete("Authorization");
            if (!headers2.has("x-api-key")) {
              headers2.set("x-api-key", authHeader.value);
            }
            return headers2;
          }
          if (authHeader.name === "Authorization") {
            if (hasValue(headers2.get("x-api-key"))) {
              return headers2;
            }
            const authorization3 = headers2.get("Authorization");
            if (hasValue(authorization3) && !this.isProfileManagedAuthorizationHeader(authorization3 ?? "", profileManagedAuthorization)) {
              return headers2;
            }
            headers2.set("Authorization", authHeader.value);
            return headers2;
          }
          const authorization2 = headers2.get("Authorization");
          if (hasValue(authorization2) && !this.isProfileManagedAuthorizationHeader(authorization2 ?? "", profileManagedAuthorization)) {
            return headers2;
          }
          if (hasValue(authorization2)) {
            headers2.delete("Authorization");
          }
          if (!headers2.has("x-api-key")) {
            headers2.set("x-api-key", authHeader.value);
          }
          return headers2;
        };
        if (!init) {
          return {
            headers: { [authHeader.name]: authHeader.value }
          };
        }
        if (init.headers instanceof Headers) {
          return { ...init, headers: applyAuth(new Headers(init.headers)) };
        }
        if (Array.isArray(init.headers)) {
          return { ...init, headers: applyAuth(new Headers(init.headers)) };
        }
        const headers = {
          ...init.headers ?? {}
        };
        const getHeaderKey = (name) => Object.keys(headers).find((key) => key.toLowerCase() === name);
        const getHeader = (name) => {
          const key = getHeaderKey(name);
          return key ? headers[key] : void 0;
        };
        const hasApiKey = hasValue(getHeader("x-api-key"));
        const authorization = getHeader("authorization");
        const hasExplicitAuthorization = hasValue(authorization) && !this.isProfileManagedAuthorizationHeader(authorization ?? "", profileManagedAuthorization);
        if (this.apiKey !== void 0 && authHeader.name === "x-api-key") {
          const authorizationKey = getHeaderKey("authorization");
          if (authorizationKey) {
            delete headers[authorizationKey];
          }
          if (!hasApiKey) {
            headers["x-api-key"] = authHeader.value;
          }
          return { ...init, headers };
        }
        if (authHeader.name === "Authorization") {
          if (!hasApiKey && !hasExplicitAuthorization) {
            const authorizationKey = getHeaderKey("authorization");
            if (authorizationKey && authorizationKey !== "Authorization") {
              delete headers[authorizationKey];
            }
            headers.Authorization = authHeader.value;
          }
          return { ...init, headers };
        }
        if (!hasExplicitAuthorization) {
          const authorizationKey = getHeaderKey("authorization");
          if (authorizationKey) {
            delete headers[authorizationKey];
          }
          if (!hasApiKey) {
            headers["x-api-key"] = authHeader.value;
          }
        }
        return { ...init, headers };
      }
      /**
       * Serialize a payload for tracing, optionally offloading the work to a
       * Node worker thread when the runtime supports worker_threads.
       *
       * Falls back to synchronous serialization when:
       *  - manualFlushMode is enabled (serverless: worker boot cost > benefit)
       *  - worker_threads is unavailable (non-Node runtimes)
       *  - the payload contains values that can't be structured-cloned across
       *    threads (functions, non-cloneable class instances, streams, etc.)
       *  - the worker throws for any other reason
       *
       * In all fallback cases the returned bytes are identical to the sync path.
       */
      _trackDrain(promise) {
        this._pendingDrains.add(promise);
        promise.finally(() => {
          this._pendingDrains.delete(promise);
        });
      }
      async _serializeBody(payload, errorContext) {
        if (this.manualFlushMode) {
          return serialize(payload, errorContext);
        }
        if (!hasLargeString(payload)) {
          return serialize(payload, errorContext);
        }
        if (this._serializeWorker === void 0) {
          this._serializeWorker = getSharedSerializeWorker();
        }
        if (this._serializeWorker === null) {
          return serialize(payload, errorContext);
        }
        try {
          const bytes = await this._serializeWorker.serialize(payload);
          if (bytes === null) {
            this._serializeWorker = null;
            return serialize(payload, errorContext);
          }
          return bytes;
        } catch {
          return serialize(payload, errorContext);
        }
      }
      constructor(config = {}) {
        Object.defineProperty(this, "apiKey", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "apiUrl", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "webUrl", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "workspaceId", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "caller", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "batchIngestCaller", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "timeout_ms", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_tenantId", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: null
        });
        Object.defineProperty(this, "hideInputs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "hideOutputs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "hideMetadata", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "anonymizer", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "omitTracedRuntimeInfo", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "tracingSampleRate", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "autoBatchTracing", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: true
        });
        Object.defineProperty(this, "autoBatchQueue", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "autoBatchTimeout", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "autoBatchAggregationDelayMs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: 250
        });
        Object.defineProperty(this, "batchSizeBytesLimit", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "batchSizeLimit", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "fetchOptions", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_fetchOptionsHeaders", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: {}
        });
        Object.defineProperty(this, "_openAPIClient", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_openAPIClientSignature", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "settings", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "blockOnRootRunFinalization", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: getEnvironmentVariable("LANGSMITH_TRACING_BACKGROUND") === "false"
        });
        Object.defineProperty(this, "traceBatchConcurrency", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: 5
        });
        Object.defineProperty(this, "_serverInfo", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_getServerInfoPromise", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_stainlessVersionsChecked", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: /* @__PURE__ */ new Set()
        });
        Object.defineProperty(this, "manualFlushMode", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: false
        });
        Object.defineProperty(this, "_serializeWorker", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_pendingDrains", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: /* @__PURE__ */ new Set()
        });
        Object.defineProperty(this, "langSmithToOTELTranslator", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_tracingMode", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "langsmith"
        });
        Object.defineProperty(this, "fetchImplementation", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "cachedLSEnvVarsForMetadata", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_promptCache", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "profileAuth", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "multipartStreamingDisabled", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: getLangSmithEnvironmentVariable("DISABLE_MULTIPART_STREAMING") === "true"
        });
        Object.defineProperty(this, "_multipartDisabled", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: false
        });
        Object.defineProperty(this, "_runCompressionDisabled", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: getLangSmithEnvironmentVariable("DISABLE_RUN_COMPRESSION") === "true"
        });
        Object.defineProperty(this, "failedTracesDir", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "failedTracesMaxBytes", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: 100 * 1024 * 1024
        });
        Object.defineProperty(this, "_customHeaders", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: {}
        });
        Object.defineProperty(this, "debug", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: getEnvironmentVariable("LANGSMITH_DEBUG") === "true"
        });
        const defaultConfig = _Client.getDefaultClientConfig({
          profile: config.profile,
          apiKey: config.apiKey,
          profileConfigPath: config.profileConfigPath,
          preferProfileAuth: config.preferProfileAuth
        });
        this.tracingSampleRate = getTracingSamplingRate(config.tracingSamplingRate);
        this.apiUrl = trimQuotes(config.apiUrl ?? defaultConfig.apiUrl) ?? "";
        if (this.apiUrl.endsWith("/")) {
          this.apiUrl = this.apiUrl.slice(0, -1);
        }
        const configuredApiKey = trimQuotes(config.apiKey ?? defaultConfig.apiKey);
        this.apiKey = hasValue(configuredApiKey) ? configuredApiKey : void 0;
        this.profileAuth = this.apiKey !== void 0 ? void 0 : defaultConfig.profileAuth;
        this.webUrl = trimQuotes(config.webUrl ?? defaultConfig.webUrl);
        if (this.webUrl?.endsWith("/")) {
          this.webUrl = this.webUrl.slice(0, -1);
        }
        this.workspaceId = trimQuotes(config.workspaceId ?? defaultConfig.workspaceId);
        this.timeout_ms = config.timeout_ms ?? 9e4;
        this.caller = new AsyncCaller({
          ...config.callerOptions ?? {},
          maxRetries: 4,
          debug: config.debug ?? this.debug
        });
        this.traceBatchConcurrency = config.traceBatchConcurrency ?? this.traceBatchConcurrency;
        if (this.traceBatchConcurrency < 1) {
          throw new Error("Trace batch concurrency must be positive.");
        }
        this.debug = config.debug ?? this.debug;
        if (this.debug) {
          const source = config.apiUrl != null ? "apiUrl option" : defaultConfig.apiUrlSource;
          console.log(`LangSmith API URL ${this.apiUrl} resolved from ${source}`);
        }
        this.fetchImplementation = config.fetchImplementation;
        this.failedTracesDir = getLangSmithEnvironmentVariable("FAILED_TRACES_DIR") || void 0;
        const failedTracesMb = getLangSmithEnvironmentVariable("FAILED_TRACES_MAX_MB");
        if (failedTracesMb) {
          const n2 = parseInt(failedTracesMb, 10);
          if (Number.isFinite(n2) && n2 > 0) {
            this.failedTracesMaxBytes = n2 * 1024 * 1024;
          }
        }
        const maxMemory = config.maxIngestMemoryBytes ?? DEFAULT_MAX_SIZE_BYTES;
        this.batchIngestCaller = new AsyncCaller({
          maxRetries: 4,
          maxConcurrency: this.traceBatchConcurrency,
          maxQueueSizeBytes: maxMemory,
          ...config.callerOptions ?? {},
          onFailedResponseHook: handle429,
          debug: config.debug ?? this.debug
        });
        this.hideInputs = config.hideInputs ?? config.anonymizer ?? defaultConfig.hideInputs;
        this.hideOutputs = config.hideOutputs ?? config.anonymizer ?? defaultConfig.hideOutputs;
        this.hideMetadata = config.hideMetadata ?? config.anonymizer ?? defaultConfig.hideMetadata;
        this.anonymizer = config.anonymizer;
        this.omitTracedRuntimeInfo = config.omitTracedRuntimeInfo ?? false;
        this.autoBatchTracing = config.autoBatchTracing ?? this.autoBatchTracing;
        this.autoBatchQueue = new AutoBatchQueue(maxMemory);
        this.blockOnRootRunFinalization = config.blockOnRootRunFinalization ?? this.blockOnRootRunFinalization;
        this.batchSizeBytesLimit = config.batchSizeBytesLimit;
        this.batchSizeLimit = config.batchSizeLimit;
        const { headers: fetchOptionsHeaders, ...fetchOptions } = config.fetchOptions || {};
        this.fetchOptions = fetchOptions;
        this._fetchOptionsHeaders = normalizeHeaders(fetchOptionsHeaders);
        assertValidHeaders(config.headers);
        this._customHeaders = config.headers ?? {};
        this.manualFlushMode = config.manualFlushMode ?? this.manualFlushMode;
        this._tracingMode = resolveTracingMode(config.tracingMode);
        if (this._tracingMode === "otel") {
          this.langSmithToOTELTranslator = new LangSmithToOTELTranslator();
        }
        this.cachedLSEnvVarsForMetadata = getLangSmithEnvVarsMetadata();
        warnOnEnv();
        if (config.cache !== void 0 && config.disablePromptCache) {
          warnOnce("Both 'cache' and 'disablePromptCache' were provided. The 'cache' parameter is deprecated and will be removed in a future version. Using 'cache' parameter value.");
        }
        if (config.cache !== void 0) {
          warnOnce("The 'cache' parameter is deprecated and will be removed in a future version. Use 'configureGlobalPromptCache()' to configure the global cache, or 'disablePromptCache: true' to disable caching for this client.");
          if (config.cache === false) {
            this._promptCache = void 0;
          } else if (config.cache === true) {
            this._promptCache = promptCacheSingleton;
          } else {
            this._promptCache = config.cache;
          }
        } else if (!config.disablePromptCache) {
          this._promptCache = promptCacheSingleton;
        }
      }
      static getDefaultClientConfig(options = {}) {
        const profileConfig = loadProfileClientConfig({
          profile: options.profile,
          configPath: options.profileConfigPath
        });
        const useProfile = options.preferProfileAuth === true && !hasValue(trimQuotes(options.apiKey)) && profileConfig.profileAuth !== void 0;
        const envApiKey = useProfile ? void 0 : getLangSmithEnvironmentVariable("API_KEY");
        const envApiUrl = useProfile ? void 0 : getLangSmithEnvironmentVariable("ENDPOINT");
        const envWorkspaceId = useProfile && profileConfig.workspaceId != null ? void 0 : getLangSmithEnvironmentVariable("WORKSPACE_ID");
        const envAuthSet = hasValue(envApiKey);
        const apiUrl = envApiUrl ?? profileConfig.apiUrl ?? DEFAULT_API_URL;
        const apiUrlSource = envApiUrl != null ? "LANGSMITH_ENDPOINT / LANGCHAIN_ENDPOINT environment variable" : profileConfig.apiUrl != null ? "profile config" : "built-in default";
        const workspaceId = envWorkspaceId ?? profileConfig.workspaceId;
        const hideInputs = getLangSmithEnvironmentVariable("HIDE_INPUTS") === "true";
        const hideOutputs = getLangSmithEnvironmentVariable("HIDE_OUTPUTS") === "true";
        const hideMetadata = getLangSmithEnvironmentVariable("HIDE_METADATA") === "true";
        return {
          apiUrl,
          apiUrlSource,
          apiKey: envApiKey,
          webUrl: void 0,
          hideInputs,
          hideOutputs,
          hideMetadata,
          workspaceId,
          oauthAccessToken: !envAuthSet ? profileConfig.oauthAccessToken : void 0,
          oauthRefreshToken: !envAuthSet ? profileConfig.oauthRefreshToken : void 0,
          profileAuth: !envAuthSet ? profileConfig.profileAuth : void 0
        };
      }
      getHostUrl() {
        if (this.webUrl) {
          return this.webUrl;
        } else if (isLocalhost(this.apiUrl)) {
          this.webUrl = "http://localhost:3000";
          return this.webUrl;
        } else if (this.apiUrl.endsWith("/api/v1")) {
          this.webUrl = this.apiUrl.replace("/api/v1", "");
          return this.webUrl;
        } else if (this.apiUrl.includes("/api") && !this.apiUrl.split(".", 1)[0].endsWith("api")) {
          this.webUrl = this.apiUrl.replace("/api", "");
          return this.webUrl;
        } else if (this.apiUrl.split(".", 1)[0].includes("dev")) {
          this.webUrl = "https://dev.smith.langchain.com";
          return this.webUrl;
        } else if (this.apiUrl.split(".", 1)[0].includes("eu")) {
          this.webUrl = "https://eu.smith.langchain.com";
          return this.webUrl;
        } else if (this.apiUrl.split(".", 1)[0].includes("aws")) {
          this.webUrl = "https://aws.smith.langchain.com";
          return this.webUrl;
        } else if (this.apiUrl.split(".", 1)[0].includes("apac")) {
          this.webUrl = "https://apac.smith.langchain.com";
          return this.webUrl;
        } else if (this.apiUrl.split(".", 1)[0].includes("beta")) {
          this.webUrl = "https://beta.smith.langchain.com";
          return this.webUrl;
        } else {
          this.webUrl = "https://smith.langchain.com";
          return this.webUrl;
        }
      }
      /**
       * The headers this client sets from its own config, which a caller-supplied
       * header must not replace.
       *
       * Only what the client *actually* supplies: passing an explicit `Authorization`
       * or `x-api-key` header with no configured credential is a supported way to
       * authenticate (see `hasExplicitAuthHeader`), so those must survive.
       */
      get _sdkControlledHeaders() {
        const names = /* @__PURE__ */ new Set();
        if (this.apiKey !== void 0) {
          names.add("x-api-key");
        } else {
          const profileAuthHeader = this.profileAuth?.currentAuthHeader();
          if (profileAuthHeader) {
            names.add(profileAuthHeader.name.toLowerCase());
          }
        }
        if (this.workspaceId) {
          names.add("x-tenant-id");
        }
        return names;
      }
      /**
       * Headers supplied by the caller, through either `config.headers` or
       * `config.fetchOptions.headers`, with the ones this SDK sets removed.
       *
       * `_customHeaders` is normalized here rather than at assignment because it is
       * public and mutable: `get headers` hands back the caller's own object, so its
       * contents can change (and can become malformed) at any point.
       */
      get _callerHeaders() {
        return mergeCallerHeaders(normalizeHeaders(this._customHeaders), this._fetchOptionsHeaders, this._sdkControlledHeaders);
      }
      get _mergedHeaders() {
        const headers = {
          "User-Agent": `langsmith-js/${VERSION}`,
          ...this._callerHeaders
        };
        if (this.apiKey !== void 0) {
          headers["x-api-key"] = `${this.apiKey}`;
        } else {
          const profileAuthHeader = this.profileAuth?.currentAuthHeader();
          if (profileAuthHeader) {
            headers[profileAuthHeader.name] = profileAuthHeader.value;
          }
        }
        if (this.workspaceId) {
          headers["x-tenant-id"] = this.workspaceId;
        }
        return headers;
      }
      /**
       * The options to build the generated client with: its auth, and the headers
       * it should send on every request.
       *
       * The generated client applies `defaultHeaders` *after* its own auth headers,
       * so the ones this SDK sets are already dropped from `_callerHeaders` to keep
       * the precedence of `_mergedHeaders`, where required headers win.
       */
      get _openAPIClientOptions() {
        const headers = { ...this._callerHeaders };
        if (!Object.keys(headers).some((name) => name.toLowerCase() === "user-agent")) {
          headers["User-Agent"] = `langsmith-js/${VERSION}`;
        }
        const callerApiKeyName = Object.keys(headers).find((name) => name.toLowerCase() === "x-api-key");
        let apiKey = this.apiKey;
        if (apiKey === void 0 && callerApiKeyName !== void 0) {
          apiKey = headers[callerApiKeyName] ?? void 0;
          delete headers[callerApiKeyName];
        }
        if (apiKey === void 0 && this.workspaceId === void 0) {
          headers["X-API-Key"] = null;
        }
        return {
          apiKey,
          defaultHeaders: Object.keys(headers).length > 0 ? headers : void 0
        };
      }
      /**
       * Get or set custom headers for the client.
       * Custom headers are merged with default headers (User-Agent, x-api-key, x-tenant-id).
       * Custom headers will not override the default required headers.
       */
      get headers() {
        return this._customHeaders;
      }
      set headers(value) {
        assertValidHeaders(value);
        this._customHeaders = value ?? {};
      }
      _getOpenAPIBaseUrl() {
        return getOpenAPIBaseUrl(this.apiUrl);
      }
      /**
       * The generated OpenAPI client, rebuilt whenever its auth or headers change.
       *
       * The generated client captures `defaultHeaders` and `apiKey` when it is
       * built, while the handwritten paths recompute `_mergedHeaders` per request.
       * Rebuilding on change keeps the two halves from diverging when the inputs
       * move underneath us — a caller mutating the object returned by
       * `get headers`, or a profile whose auth header only becomes available after
       * its token is refreshed.
       */
      get openAPIClient() {
        const options = this._openAPIClientOptions;
        const signature = JSON.stringify([options.apiKey, options.defaultHeaders]);
        if (this._openAPIClient === void 0 || this._openAPIClientSignature !== signature) {
          this._openAPIClientSignature = signature;
          this._openAPIClient = this._newOpenAPIClient(options);
        }
        return this._openAPIClient;
      }
      _newOpenAPIClient(options = this._openAPIClientOptions) {
        const { method: _method, body: _body, signal: _signal, ...openAPIFetchOptions } = this.fetchOptions;
        return new Langsmith({
          apiKey: options.apiKey,
          tenantID: this.workspaceId,
          baseURL: this._getOpenAPIBaseUrl(),
          timeout: this.timeout_ms,
          fetch: this._fetch,
          fetchOptions: openAPIFetchOptions,
          defaultHeaders: options.defaultHeaders
        });
      }
      _getPlatformEndpointPath(path4) {
        const needsV1Prefix = this.apiUrl.slice(-3) !== "/v1" && this.apiUrl.slice(-4) !== "/v1/";
        return needsV1Prefix ? `/v1/platform/${path4}` : `/platform/${path4}`;
      }
      get evaluators() {
        this._checkStainlessVersion("0.16.0");
        return this.openAPIClient.onlineEvaluators;
      }
      get runs() {
        this._checkStainlessVersion("0.16.0");
        return this.openAPIClient.runs;
      }
      /** Access the v2 sandboxes resource (registries, snapshots, boxes). */
      get sandboxes() {
        this._checkStainlessVersion("0.16.0");
        return this.openAPIClient.sandboxes;
      }
      /** Access the v2 datasets resource (experimentRuns, etc.). */
      get datasets() {
        this._checkStainlessVersion("0.16.0");
        return this.openAPIClient.datasets;
      }
      /** Access the annotation queues resource (runs, items). */
      get annotationQueues() {
        this._checkStainlessVersion("0.16.14");
        return this.openAPIClient.annotationQueues;
      }
      /** Access the threads resource (query, stats, listTraces). */
      get threads() {
        this._checkStainlessVersion("0.16.0");
        return this.openAPIClient.threads;
      }
      /** Access the traces resource (query, listRuns). */
      get traces() {
        this._checkStainlessVersion("0.16.0");
        return this.openAPIClient.traces;
      }
      /**
       * Access the sessions resource, which resolves an address to the
       * project its traces go to: `client.sessions.resolve(address)`.
       */
      get sessions() {
        this._checkStainlessVersion("0.18.0");
        return this.openAPIClient.sessions;
      }
      /** Manage workspace registry agents and their tracing destinations. */
      get agents() {
        return this.openAPIClient.agents;
      }
      /** Access the public shared-run resource. */
      get public() {
        this._checkStainlessVersion("0.16.0");
        return this.openAPIClient.public;
      }
      async processInputs(inputs) {
        if (this.hideInputs === false) {
          return inputs;
        }
        if (this.hideInputs === true) {
          return {};
        }
        if (typeof this.hideInputs === "function") {
          return this.hideInputs(inputs);
        }
        return inputs;
      }
      async processOutputs(outputs) {
        if (this.hideOutputs === false) {
          return outputs;
        }
        if (this.hideOutputs === true) {
          return {};
        }
        if (typeof this.hideOutputs === "function") {
          return this.hideOutputs(outputs);
        }
        return outputs;
      }
      async processMetadata(metadata) {
        if (this.hideMetadata === false) {
          return metadata;
        }
        if (this.hideMetadata === true) {
          return {};
        }
        if (typeof this.hideMetadata === "function") {
          return this.hideMetadata(metadata);
        }
        return metadata;
      }
      /**
       * Apply the configured anonymizer to a run's error string.
       *
       * Unlike inputs/outputs, `error` is a plain string (an exception message or
       * traceback) that can carry credentials the user never explicitly logged --
       * e.g. an HTTP-client error whose message embeds an `Authorization` header.
       * The anonymizer is typed `(KVMap) => KVMap`, so the string is wrapped as
       * `{ error }`, scrubbed, and unwrapped. Mirrors the Python SDK's
       * `Client._hide_run_error`.
       *
       * TODO: Update anonymizer to always nest inputs/outputs/error for consistency
       */
      async processError(error) {
        if (this.anonymizer == null) {
          return error;
        }
        const result = await this.anonymizer({ error });
        return typeof result?.error === "string" ? result.error : error;
      }
      /**
       * Filter content from new_token events to prevent streaming LLM output
       * from being uploaded via events.
       */
      _filterNewTokenEvents(events) {
        if (!events || events.length === 0) {
          return events;
        }
        return events.map((event) => {
          if (event.name === "new_token") {
            const { kwargs: _, ...rest } = event;
            return rest;
          }
          return event;
        });
      }
      async prepareRunCreateOrUpdateInputs(run, options) {
        const runParams = { ...run };
        applyToPayload(runParams, { update: options?.update ?? false });
        if (runParams.inputs !== void 0) {
          runParams.inputs = await this.processInputs(runParams.inputs);
        }
        if (runParams.outputs !== void 0) {
          runParams.outputs = await this.processOutputs(runParams.outputs);
        }
        if (runParams.error !== void 0) {
          runParams.error = await this.processError(runParams.error);
        }
        if (runParams.extra != null && "metadata" in runParams.extra) {
          runParams.extra = {
            ...runParams.extra,
            metadata: await this.processMetadata(runParams.extra.metadata)
          };
        }
        if (runParams.events !== void 0) {
          runParams.events = this._filterNewTokenEvents(runParams.events);
        }
        return runParams;
      }
      async _getResponse(path4, queryParams) {
        const paramsString = queryParams?.toString() ?? "";
        const url = `${this.apiUrl}${path4}?${paramsString}`;
        const response = await this.caller.call(async () => {
          const res = await this._fetch(url, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, `fetch ${path4}`);
          return res;
        });
        return response;
      }
      async _get(path4, queryParams) {
        const response = await this._getResponse(path4, queryParams);
        return response.json();
      }
      async *_getPaginated(path4, queryParams = new URLSearchParams(), transform) {
        let offset = Number(queryParams.get("offset")) || 0;
        const limit2 = Number(queryParams.get("limit")) || 100;
        while (true) {
          queryParams.set("offset", String(offset));
          queryParams.set("limit", String(limit2));
          const url = `${this.apiUrl}${path4}?${queryParams}`;
          const response = await this.caller.call(async () => {
            const res = await this._fetch(url, {
              method: "GET",
              headers: this._mergedHeaders,
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions
            });
            await raiseForStatus(res, `fetch ${path4}`);
            return res;
          });
          const items = transform ? transform(await response.json()) : await response.json();
          if (items.length === 0) {
            break;
          }
          yield items;
          if (items.length < limit2) {
            break;
          }
          offset += items.length;
        }
      }
      async *_getCursorPaginatedList(path4, body = null, requestMethod = "POST", dataKey = "runs") {
        const bodyParams = body ? { ...body } : {};
        while (true) {
          const body2 = JSON.stringify(bodyParams);
          const response = await this.caller.call(async () => {
            const res = await this._fetch(`${this.apiUrl}${path4}`, {
              method: requestMethod,
              headers: {
                ...this._mergedHeaders,
                "Content-Type": "application/json"
              },
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions,
              body: body2
            });
            await raiseForStatus(res, `fetch ${path4}`);
            return res;
          });
          const responseBody = await response.json();
          if (!responseBody) {
            break;
          }
          if (!responseBody[dataKey]) {
            break;
          }
          yield responseBody[dataKey];
          const cursors = responseBody.cursors;
          if (!cursors) {
            break;
          }
          if (!cursors.next) {
            break;
          }
          bodyParams.cursor = cursors.next;
        }
      }
      // Allows mocking for tests
      _shouldSample(identifier) {
        return isSampledById(identifier, this.tracingSampleRate);
      }
      _filterForSampling(runs) {
        return runs.filter((run) => this._shouldSample(run.trace_id ?? run.dotted_order?.split(".", 1)[0].split("Z")[1] ?? run.id));
      }
      async _getBatchSizeLimitBytes() {
        const serverInfo = await this._ensureServerInfo();
        return this.batchSizeBytesLimit ?? serverInfo?.batch_ingest_config?.size_limit_bytes ?? DEFAULT_UNCOMPRESSED_BATCH_SIZE_LIMIT_BYTES;
      }
      /**
       * Get the maximum number of operations to batch in a single request.
       */
      async _getBatchSizeLimit() {
        const serverInfo = await this._ensureServerInfo();
        return this.batchSizeLimit ?? serverInfo?.batch_ingest_config?.size_limit ?? DEFAULT_BATCH_SIZE_LIMIT;
      }
      async _getDatasetExamplesMultiPartSupport() {
        const serverInfo = await this._ensureServerInfo();
        return serverInfo.instance_flags?.dataset_examples_multipart_enabled ?? false;
      }
      drainAutoBatchQueue({ batchSizeLimitBytes, batchSizeLimit }) {
        const promises = [];
        while (this.autoBatchQueue.items.length > 0) {
          const [batch, done] = this.autoBatchQueue.pop({
            upToSizeBytes: batchSizeLimitBytes,
            upToSize: batchSizeLimit
          });
          if (!batch.length) {
            done();
            break;
          }
          const batchesByDestination = batch.reduce((acc, item) => {
            const apiUrl = item.apiUrl ?? this.apiUrl;
            const apiKey = item.apiKey ?? this.apiKey;
            const workspaceId = item.workspaceId ?? this.workspaceId;
            const isDefault = item.apiKey === this.apiKey && item.apiUrl === this.apiUrl && item.workspaceId === this.workspaceId;
            const batchKey = isDefault ? "default" : `${apiUrl}|${apiKey}|${workspaceId ?? ""}`;
            if (!acc[batchKey]) {
              acc[batchKey] = [];
            }
            acc[batchKey].push(item);
            return acc;
          }, {});
          const batchPromises = [];
          for (const [batchKey, batch2] of Object.entries(batchesByDestination)) {
            const isDefault = batchKey === "default";
            const parts = isDefault ? [] : batchKey.split("|");
            const workspaceIdPart = parts[2];
            const batchPromise = this._processBatch(batch2, {
              apiUrl: isDefault ? void 0 : parts[0],
              apiKey: isDefault ? void 0 : parts[1],
              workspaceId: isDefault || !workspaceIdPart ? void 0 : workspaceIdPart
            });
            batchPromises.push(batchPromise);
          }
          const allBatchesPromise = Promise.all(batchPromises).finally(done);
          promises.push(allBatchesPromise);
        }
        return Promise.all(promises);
      }
      /**
       * Persist a failed trace payload to a local fallback directory.
       *
       * Saves a self-contained JSON file containing the endpoint path, the HTTP
       * headers required for replay, and the base64-encoded request body.
       * Can be replayed later with a simple POST:
       *
       *   POST /<endpoint>
       *   Content-Type: <value from saved headers>
       *   [Content-Encoding: <value from saved headers>]
       *   <decoded body>
       */
      static async _writeTraceToFallbackDir(directory2, body, replayHeaders, endpoint, maxBytes) {
        try {
          const bodyBuffer = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
          const envelope = JSON.stringify({
            version: 1,
            endpoint,
            headers: replayHeaders,
            body_base64: bodyBuffer.toString("base64")
          });
          const filename = `trace_${Date.now()}_${v4_default().slice(0, 8)}.json`;
          const filepath = path3.join(directory2, filename);
          if (!_Client._fallbackDirsCreated.has(directory2)) {
            await mkdir2(directory2);
            _Client._fallbackDirsCreated.add(directory2);
          }
          if (maxBytes !== void 0 && maxBytes > 0) {
            try {
              const entries = await readdir2(directory2);
              const traceFiles = entries.filter((f2) => f2.startsWith("trace_") && f2.endsWith(".json"));
              let total = 0;
              for (const name of traceFiles) {
                const { size } = await stat2(path3.join(directory2, name));
                total += size;
              }
              if (total >= maxBytes) {
                console.warn(`Could not write trace to fallback dir ${directory2} as it's already over size limit (${total} bytes >= ${maxBytes} bytes). Increase LANGSMITH_FAILED_TRACES_MAX_MB if possible.`);
                return;
              }
            } catch {
            }
          }
          await writeFileAtomic(filepath, envelope);
          console.warn(`LangSmith trace upload failed; data saved to ${filepath} for later replay.`);
        } catch (writeErr) {
          console.error(`LangSmith tracing error: could not write trace to fallback dir ${directory2}:`, writeErr);
        }
      }
      async _processBatch(batch, options) {
        if (!batch.length) {
          return;
        }
        const batchSizeBytes = batch.reduce((sum, item) => sum + (item.size ?? 0), 0);
        const feedbacks = batch.filter((item) => item.action === "feedback").map((item) => item.item);
        const runItems = batch.filter((item) => item.action !== "feedback");
        try {
          if (this.langSmithToOTELTranslator !== void 0) {
            for (const item of runItems) {
              item.item = await this._maskRunMetadata(item.item);
            }
            this._sendBatchToOTELTranslator(runItems);
            await this._postFeedbacks(feedbacks, options);
          } else {
            const ingestParams = {
              runCreates: batch.filter((item) => item.action === "create").map((item) => item.item),
              runUpdates: batch.filter((item) => item.action === "update").map((item) => item.item)
            };
            const serverInfo = await this._ensureServerInfo();
            const useMultipart = !this._multipartDisabled && (serverInfo?.batch_ingest_config?.use_multipart_endpoint ?? true);
            if (useMultipart) {
              const useGzip = !this._runCompressionDisabled && serverInfo?.instance_flags?.gzip_body_enabled;
              try {
                await this.multipartIngestRuns({ ...ingestParams, feedbacks }, {
                  ...options,
                  useGzip,
                  sizeBytes: batchSizeBytes
                });
              } catch (e) {
                if (isLangSmithNotFoundError(e)) {
                  this._multipartDisabled = true;
                  await this.batchIngestRuns(ingestParams, {
                    ...options,
                    sizeBytes: batchSizeBytes
                  });
                  await this._postFeedbacks(feedbacks, options);
                } else {
                  throw e;
                }
              }
            } else {
              await this.batchIngestRuns(ingestParams, {
                ...options,
                sizeBytes: batchSizeBytes
              });
              await this._postFeedbacks(feedbacks, options);
            }
          }
        } catch (e) {
          console.error("Error exporting batch:", e);
        }
      }
      _sendBatchToOTELTranslator(batch) {
        if (this.langSmithToOTELTranslator !== void 0) {
          const otelContextMap = /* @__PURE__ */ new Map();
          const operations = [];
          for (const item of batch) {
            if (item.item.id && item.otelContext) {
              otelContextMap.set(item.item.id, item.otelContext);
              if (item.action === "create") {
                operations.push({
                  operation: "post",
                  id: item.item.id,
                  trace_id: item.item.trace_id ?? item.item.id,
                  run: item.item
                });
              } else {
                operations.push({
                  operation: "patch",
                  id: item.item.id,
                  trace_id: item.item.trace_id ?? item.item.id,
                  run: item.item
                });
              }
            }
          }
          this.langSmithToOTELTranslator.exportBatch(operations, otelContextMap);
        }
      }
      async _maskRunMetadata(run) {
        if (run.extra?.metadata == null) {
          return run;
        }
        return {
          ...run,
          extra: {
            ...run.extra,
            metadata: await this.processMetadata(run.extra.metadata)
          }
        };
      }
      async _mergeRuntimeEnvAndMaskMetadata(run) {
        const merged = mergeRuntimeEnvIntoRun(run, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo, this.tracingSampleRate);
        if (this.omitTracedRuntimeInfo) {
          return merged;
        }
        return this._maskRunMetadata(merged);
      }
      async processRunOperation(item) {
        clearTimeout(this.autoBatchTimeout);
        this.autoBatchTimeout = void 0;
        if (item.action !== "feedback") {
          item.item = mergeRuntimeEnvIntoRun(item.item, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo, this.tracingSampleRate);
        }
        const itemPromise = this.autoBatchQueue.push(item);
        if (this.manualFlushMode) {
          return itemPromise;
        }
        const sizeLimitBytes = await this._getBatchSizeLimitBytes();
        const sizeLimit = await this._getBatchSizeLimit();
        if (this.autoBatchQueue.sizeBytes > sizeLimitBytes || this.autoBatchQueue.items.length > sizeLimit) {
          this._trackDrain(this.drainAutoBatchQueue({
            batchSizeLimitBytes: sizeLimitBytes,
            batchSizeLimit: sizeLimit
          }));
        }
        if (this.autoBatchQueue.items.length > 0) {
          this.autoBatchTimeout = setTimeout(() => {
            this.autoBatchTimeout = void 0;
            this._trackDrain(this.drainAutoBatchQueue({
              batchSizeLimitBytes: sizeLimitBytes,
              batchSizeLimit: sizeLimit
            }));
          }, this.autoBatchAggregationDelayMs);
        }
        return itemPromise;
      }
      async _getServerInfo() {
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/info`, {
            method: "GET",
            headers: { ...this._mergedHeaders, Accept: "application/json" },
            signal: AbortSignal.timeout(SERVER_INFO_REQUEST_TIMEOUT_MS),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "get server info");
          return res;
        });
        const json = await response.json();
        if (this.debug) {
          console.log("\n=== LangSmith Server Configuration ===\n" + JSON.stringify(json, null, 2) + "\n");
        }
        return json;
      }
      _checkStainlessVersion(minVersion) {
        if (this._stainlessVersionsChecked.has(minVersion))
          return;
        this._stainlessVersionsChecked.add(minVersion);
        this._ensureServerInfo().then((serverInfo) => {
          _checkBackendVersion(serverInfo?.version, minVersion);
        }).catch(() => {
        });
      }
      async _ensureServerInfo() {
        if (this._getServerInfoPromise === void 0) {
          this._getServerInfoPromise = (async () => {
            if (this._serverInfo === void 0) {
              try {
                this._serverInfo = await this._getServerInfo();
              } catch (e) {
                console.warn(`[LANGSMITH]: Failed to fetch info on supported operations. Falling back to batch operations and default limits. Info: ${e.status ?? "Unspecified status code"} ${e.message}`);
              }
            }
            return this._serverInfo ?? {};
          })();
        }
        return this._getServerInfoPromise.then((serverInfo) => {
          if (this._serverInfo === void 0) {
            this._getServerInfoPromise = void 0;
          }
          return serverInfo;
        });
      }
      async _supportsSDBQuery() {
        const serverInfo = await this._ensureServerInfo();
        return serverInfo.instance_flags?.sdb_query_enabled === true;
      }
      /**
       * Throw on SmithDB-only deployments, warn elsewhere. Call only when run-level
       * feedback has no sessionId.
       */
      async _checkFeedbackSessionId() {
        const docs = "https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#feedback-create";
        const serverInfo = await this._ensureServerInfo();
        if (getQueryBackend(serverInfo.instance_flags) === QueryBackend.SMITHDB_ONLY) {
          throw new Error(`sessionId must be provided when creating feedback for a run: this deployment cannot locate the run without it. See ${docs}`);
        }
        warnOnce(`Creating feedback for a run without sessionId is deprecated and will stop working in a future release. See ${docs}`);
      }
      async _getSettings() {
        if (!this.settings) {
          this.settings = this._get("/settings");
        }
        return await this.settings;
      }
      /**
       * Flushes current queued traces.
       */
      async flush() {
        const sizeLimitBytes = await this._getBatchSizeLimitBytes();
        const sizeLimit = await this._getBatchSizeLimit();
        await this.drainAutoBatchQueue({
          batchSizeLimitBytes: sizeLimitBytes,
          batchSizeLimit: sizeLimit
        });
      }
      _cloneCurrentOTELContext() {
        const otel_trace = getOTELTrace();
        const otel_context = getOTELContext();
        if (this.langSmithToOTELTranslator !== void 0) {
          const currentSpan = otel_trace.getActiveSpan();
          if (currentSpan) {
            return otel_trace.setSpan(otel_context.active(), currentSpan);
          }
        }
        return void 0;
      }
      async createRun(run, options) {
        if (!this._filterForSampling([run]).length) {
          return;
        }
        const headers = {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        };
        const address = ensureAgent(run.address);
        const bodySessionName = run.session_name;
        rejectConflicting(run.project_name ?? bodySessionName, address);
        const session_name = run.project_name;
        delete run.project_name;
        if (!session_name && bodySessionName == null && !address) {
          try {
            run.address = resolveFromEnv()[1];
          } catch (e) {
            if (!(e instanceof EnvAddressError)) {
              throw e;
            }
            logUntraced(e);
            return;
          }
        }
        const runCreate = await this.prepareRunCreateOrUpdateInputs({
          session_name,
          ...run,
          start_time: run.start_time ?? Date.now()
        });
        if (this.autoBatchTracing && runCreate.trace_id !== void 0 && runCreate.dotted_order !== void 0) {
          const otelContext = this._cloneCurrentOTELContext();
          void this.processRunOperation({
            action: "create",
            item: runCreate,
            otelContext,
            apiKey: options?.apiKey,
            apiUrl: options?.apiUrl,
            workspaceId: options?.workspaceId
          }).catch(console.error);
          return;
        }
        const mergedRunCreateParam = await this._mergeRuntimeEnvAndMaskMetadata(runCreate);
        if (options?.apiKey !== void 0) {
          headers["x-api-key"] = options.apiKey;
        }
        if (options?.workspaceId !== void 0) {
          headers["x-tenant-id"] = options.workspaceId;
        }
        const body = serialize(mergedRunCreateParam, `Creating run with id: ${mergedRunCreateParam.id}`);
        await this.caller.call(async () => {
          const res = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs`, {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "create run", true);
          return res;
        });
      }
      /**
       * Batch ingest/upsert multiple runs in the Langsmith system.
       * @param runs
       */
      async batchIngestRuns({ runCreates, runUpdates }, options) {
        if (runCreates === void 0 && runUpdates === void 0) {
          return;
        }
        let preparedCreateParams = await Promise.all(runCreates?.map((create) => this.prepareRunCreateOrUpdateInputs(create)) ?? []);
        let preparedUpdateParams = await Promise.all(runUpdates?.map((update) => this.prepareRunCreateOrUpdateInputs(update, { update: true })) ?? []);
        const createById = indexRunCreatesById(preparedCreateParams);
        if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
          const standaloneUpdates = [];
          for (const updateParam of preparedUpdateParams) {
            if (updateParam.id !== void 0 && createById[updateParam.id]) {
              createById[updateParam.id] = {
                ...createById[updateParam.id],
                ...updateParam
              };
            } else {
              standaloneUpdates.push(updateParam);
            }
          }
          preparedCreateParams = Object.values(createById);
          preparedUpdateParams = standaloneUpdates;
        }
        const rawBatch = {
          post: preparedCreateParams,
          patch: preparedUpdateParams
        };
        if (!rawBatch.post.length && !rawBatch.patch.length) {
          return;
        }
        const batchChunks = {
          post: [],
          patch: []
        };
        for (const k of ["post", "patch"]) {
          const key = k;
          const batchItems = rawBatch[key].reverse();
          let batchItem = batchItems.pop();
          while (batchItem !== void 0) {
            batchChunks[key].push(batchItem);
            batchItem = batchItems.pop();
          }
        }
        if (batchChunks.post.length > 0 || batchChunks.patch.length > 0) {
          const runIds = batchChunks.post.map((item) => item.id).concat(batchChunks.patch.map((item) => item.id)).join(",");
          await this._postBatchIngestRuns(await this._serializeBody(batchChunks, `Ingesting runs with ids: ${runIds}`), options);
        }
      }
      async _postBatchIngestRuns(body, options) {
        const headers = {
          ...this._mergedHeaders,
          "Content-Type": "application/json",
          Accept: "application/json"
        };
        if (options?.apiKey !== void 0) {
          headers["x-api-key"] = options.apiKey;
        }
        if (options?.workspaceId !== void 0) {
          headers["x-tenant-id"] = options.workspaceId;
        }
        await this.batchIngestCaller.callWithOptions({ sizeBytes: options?.sizeBytes }, async () => {
          const res = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs/batch`, {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "batch create run", true);
          return res;
        });
      }
      /**
       * Batch ingest/upsert multiple runs in the Langsmith system.
       * @param runs
       */
      async multipartIngestRuns({ runCreates, runUpdates, feedbacks }, options) {
        if (runCreates === void 0 && runUpdates === void 0 && !feedbacks?.length) {
          return;
        }
        const allAttachments = {};
        let preparedCreateParams = [];
        for (const create of runCreates ?? []) {
          const preparedCreate = await this.prepareRunCreateOrUpdateInputs(create);
          if (preparedCreate.id !== void 0 && preparedCreate.attachments !== void 0) {
            allAttachments[preparedCreate.id] = preparedCreate.attachments;
          }
          delete preparedCreate.attachments;
          preparedCreateParams.push(preparedCreate);
        }
        let preparedUpdateParams = [];
        for (const update of runUpdates ?? []) {
          preparedUpdateParams.push(await this.prepareRunCreateOrUpdateInputs(update, { update: true }));
        }
        const invalidRunCreate = preparedCreateParams.find((runCreate) => {
          return runCreate.trace_id === void 0 || runCreate.dotted_order === void 0;
        });
        if (invalidRunCreate !== void 0) {
          throw new Error(`Multipart ingest requires "trace_id" and "dotted_order" to be set when creating a run`);
        }
        const invalidRunUpdate = preparedUpdateParams.find((runUpdate) => {
          return runUpdate.trace_id === void 0 || runUpdate.dotted_order === void 0;
        });
        if (invalidRunUpdate !== void 0) {
          throw new Error(`Multipart ingest requires "trace_id" and "dotted_order" to be set when updating a run`);
        }
        const createById = indexRunCreatesById(preparedCreateParams);
        if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
          const standaloneUpdates = [];
          for (const updateParam of preparedUpdateParams) {
            if (updateParam.id !== void 0 && createById[updateParam.id]) {
              createById[updateParam.id] = {
                ...createById[updateParam.id],
                ...updateParam
              };
            } else {
              standaloneUpdates.push(updateParam);
            }
          }
          preparedCreateParams = Object.values(createById);
          preparedUpdateParams = standaloneUpdates;
        }
        if (preparedCreateParams.length === 0 && preparedUpdateParams.length === 0 && !feedbacks?.length) {
          return;
        }
        const accumulatedContext = [];
        const accumulatedParts = [];
        for (const [method, payloads] of [
          ["post", preparedCreateParams],
          ["patch", preparedUpdateParams]
        ]) {
          for (const originalPayload of payloads) {
            const { inputs, outputs, events, extra, error, serialized, attachments, ...payload } = originalPayload;
            const fields = { inputs, outputs, events, extra, error, serialized };
            const stringifiedPayload = await this._serializeBody(payload, `Serializing for multipart ingestion of run with id: ${payload.id}`);
            accumulatedParts.push({
              name: `${method}.${payload.id}`,
              payload: new Blob([stringifiedPayload], {
                type: `application/json; length=${stringifiedPayload.length}`
                // encoding=gzip
              })
            });
            for (const [key, value] of Object.entries(fields)) {
              if (value === void 0) {
                continue;
              }
              const stringifiedValue = await this._serializeBody(value, `Serializing ${key} for multipart ingestion of run with id: ${payload.id}`);
              accumulatedParts.push({
                name: `${method}.${payload.id}.${key}`,
                payload: new Blob([stringifiedValue], {
                  type: `application/json; length=${stringifiedValue.length}`
                })
              });
            }
            if (payload.id !== void 0) {
              const attachments2 = allAttachments[payload.id];
              if (attachments2) {
                delete allAttachments[payload.id];
                for (const [name, attachment] of Object.entries(attachments2)) {
                  let contentType;
                  let content;
                  if (Array.isArray(attachment)) {
                    [contentType, content] = attachment;
                  } else {
                    contentType = attachment.mimeType;
                    content = attachment.data;
                  }
                  if (name.includes(".")) {
                    console.warn(`Skipping attachment '${name}' for run ${payload.id}: Invalid attachment name. Attachment names must not contain periods ('.'). Please rename the attachment and try again.`);
                    continue;
                  }
                  accumulatedParts.push({
                    name: `attachment.${payload.id}.${name}`,
                    payload: new Blob([content], {
                      type: `${contentType}; length=${content.byteLength}`
                    })
                  });
                }
              }
            }
            accumulatedContext.push(`trace=${payload.trace_id},id=${payload.id}`);
          }
        }
        for (const feedback of feedbacks ?? []) {
          const stringifiedFeedback = await this._serializeBody(feedback, `Serializing for multipart ingestion of feedback with id: ${feedback.id}`);
          accumulatedParts.push({
            name: `feedback.${feedback.id}`,
            payload: new Blob([stringifiedFeedback], {
              type: `application/json; length=${stringifiedFeedback.length}`
            })
          });
          accumulatedContext.push(`trace=${feedback.trace_id},id=${feedback.id}`);
        }
        await this._sendMultipartRequest(accumulatedParts, accumulatedContext.join("; "), options);
      }
      async _createNodeFetchBody(parts, boundary) {
        const chunks = [];
        for (const part of parts) {
          chunks.push(new Blob([`--${boundary}\r
`]));
          chunks.push(new Blob([
            `Content-Disposition: form-data; name="${part.name}"\r
`,
            `Content-Type: ${part.payload.type}\r
\r
`
          ]));
          chunks.push(part.payload);
          chunks.push(new Blob(["\r\n"]));
        }
        chunks.push(new Blob([`--${boundary}--\r
`]));
        const body = new Blob(chunks);
        const arrayBuffer = await body.arrayBuffer();
        return arrayBuffer;
      }
      async _createMultipartStream(parts, boundary) {
        const encoder3 = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const writeChunk = async (chunk) => {
              if (typeof chunk === "string") {
                controller.enqueue(encoder3.encode(chunk));
              } else {
                controller.enqueue(chunk);
              }
            };
            for (const part of parts) {
              await writeChunk(`--${boundary}\r
`);
              await writeChunk(`Content-Disposition: form-data; name="${part.name}"\r
`);
              await writeChunk(`Content-Type: ${part.payload.type}\r
\r
`);
              const payloadStream = part.payload.stream();
              const reader = payloadStream.getReader();
              try {
                let result;
                while (!(result = await reader.read()).done) {
                  controller.enqueue(result.value);
                }
              } finally {
                reader.releaseLock();
              }
              await writeChunk("\r\n");
            }
            await writeChunk(`--${boundary}--\r
`);
            controller.close();
          }
        });
        return stream;
      }
      async _sendMultipartRequest(parts, context, options) {
        const boundary = "----LangSmithFormBoundary" + Math.random().toString(36).slice(2);
        const buildBuffered = () => this._createNodeFetchBody(parts, boundary);
        const buildStream = () => this._createMultipartStream(parts, boundary);
        const sendWithRetry = async (bodyFactory) => {
          return this.batchIngestCaller.callWithOptions({ sizeBytes: options?.sizeBytes }, async () => {
            const body = await bodyFactory();
            const headers = {
              ...this._mergedHeaders,
              "Content-Type": `multipart/form-data; boundary=${boundary}`
            };
            if (options?.apiKey !== void 0) {
              headers["x-api-key"] = options.apiKey;
            }
            if (options?.workspaceId !== void 0) {
              headers["x-tenant-id"] = options.workspaceId;
            }
            let transformedBody = body;
            if (options?.useGzip && typeof body === "object" && "pipeThrough" in body) {
              transformedBody = body.pipeThrough(new CompressionStream("gzip"));
              headers["Content-Encoding"] = "gzip";
            }
            const response = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs/multipart`, {
              method: "POST",
              headers,
              body: transformedBody,
              duplex: "half",
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions
            });
            await raiseForStatus(response, `Failed to send multipart request`, true);
            return response;
          });
        };
        try {
          let res;
          let streamedAttempt = false;
          const shouldStream = _shouldStreamForGlobalFetchImplementation();
          if (shouldStream && !this.multipartStreamingDisabled && getEnv() !== "bun") {
            streamedAttempt = true;
            res = await sendWithRetry(buildStream);
          } else {
            res = await sendWithRetry(buildBuffered);
          }
          if ((!this.multipartStreamingDisabled || streamedAttempt) && res.status === 422 && (options?.apiUrl ?? this.apiUrl) !== DEFAULT_API_URL) {
            console.warn(`Streaming multipart upload to ${options?.apiUrl ?? this.apiUrl}/runs/multipart failed. This usually means the host does not support chunked uploads. Retrying with a buffered upload for operation "${context}".`);
            this.multipartStreamingDisabled = true;
            res = await sendWithRetry(buildBuffered);
          }
        } catch (e) {
          if (isLangSmithNotFoundError(e)) {
            throw e;
          }
          console.warn(`${e.message.trim()}

Context: ${context}`);
          if (this.failedTracesDir) {
            const bodyBuffer = await this._createNodeFetchBody(parts, boundary).catch(() => null);
            if (bodyBuffer) {
              await _Client._writeTraceToFallbackDir(this.failedTracesDir, bodyBuffer, { "Content-Type": `multipart/form-data; boundary=${boundary}` }, "runs/multipart", this.failedTracesMaxBytes);
            }
          }
        }
      }
      async updateRun(runId, run, options) {
        assertUuid(runId);
        if (run.inputs) {
          run.inputs = await this.processInputs(run.inputs);
        }
        if (run.outputs) {
          run.outputs = await this.processOutputs(run.outputs);
        }
        if (run.error) {
          run.error = await this.processError(run.error);
        }
        if (run.extra != null && "metadata" in run.extra) {
          run.extra = {
            ...run.extra,
            metadata: await this.processMetadata(run.extra.metadata)
          };
        }
        if (run.events) {
          run.events = this._filterNewTokenEvents(run.events);
        }
        ensureAgent(run.address);
        const data = { ...run, id: runId };
        if (!this._filterForSampling([data]).length) {
          return;
        }
        if (this.autoBatchTracing && data.trace_id !== void 0 && data.dotted_order !== void 0) {
          const otelContext = this._cloneCurrentOTELContext();
          if (run.end_time !== void 0 && data.parent_run_id === void 0 && this.blockOnRootRunFinalization && !this.manualFlushMode) {
            await this.processRunOperation({
              action: "update",
              item: data,
              otelContext,
              apiKey: options?.apiKey,
              apiUrl: options?.apiUrl,
              workspaceId: options?.workspaceId
            }).catch(console.error);
            return;
          } else {
            void this.processRunOperation({
              action: "update",
              item: data,
              otelContext,
              apiKey: options?.apiKey,
              apiUrl: options?.apiUrl,
              workspaceId: options?.workspaceId
            }).catch(console.error);
          }
          return;
        }
        const headers = {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        };
        if (options?.apiKey !== void 0) {
          headers["x-api-key"] = options.apiKey;
        }
        if (options?.workspaceId !== void 0) {
          headers["x-tenant-id"] = options.workspaceId;
        }
        const wireRun = { ...run };
        applyToPayload(wireRun, { update: true });
        const body = serialize(wireRun.extra ? mergeRuntimeEnvIntoRun(wireRun, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo, this.tracingSampleRate) : wireRun, `Serializing payload to update run with id: ${runId}`);
        await this.caller.call(async () => {
          const res = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs/${runId}`, {
            method: "PATCH",
            headers,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update run", true);
          return res;
        });
      }
      /** @deprecated Use `client.runs.retrieve()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-runs#runs-retrieve for the migration guide. Will be removed after Jan 31, 2027. */
      async readRun(runId, { loadChildRuns } = { loadChildRuns: false }) {
        warnOnce("readRun() is deprecated and will be removed after Jan 31, 2027. Use client.runs.retrieve() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-runs#runs-retrieve for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_READ_RUN" });
        return this._readRun(runId, { loadChildRuns });
      }
      /**
       * Fetch a run without emitting the `readRun()` deprecation warning.
       *
       * Internal callers use this so that a supported method doesn't warn about a
       * deprecated one the caller never invoked.
       *
       * @internal
       */
      async _readRun(runId, { loadChildRuns } = { loadChildRuns: false }) {
        assertUuid(runId);
        let run = _normalizeRunTimestamps(await this._get(`/runs/${runId}`));
        if (loadChildRuns) {
          run = await this._loadChildRuns(run);
        }
        return run;
      }
      /** @deprecated Use `client.runs.getURL()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-runs#runs-get-url for the migration guide. Will be removed after Jan 31, 2027. */
      async getRunUrl({ runId, run, projectOpts, address: rawAddress }) {
        warnOnce("getRunUrl() is deprecated and will be removed after Jan 31, 2027. Use client.runs.getURL() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-runs#runs-get-url for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_GET_RUN_URL" });
        if (run !== void 0) {
          const argumentAddress = ensureAddress(rawAddress);
          rejectConflicting(projectOpts?.projectName ?? projectOpts?.projectId, argumentAddress);
          const address = argumentAddress ?? ensureAgent(run.address);
          let sessionId;
          if (run.session_id) {
            sessionId = run.session_id;
          } else if (projectOpts?.projectName) {
            sessionId = (await this.readProject({ projectName: projectOpts?.projectName })).id;
          } else if (projectOpts?.projectId) {
            sessionId = projectOpts?.projectId;
          } else if (address) {
            sessionId = await this._resolveAddress(address);
          } else {
            const project = await this.readProject({
              projectName: getLangSmithEnvironmentVariable("PROJECT") || "default"
            });
            sessionId = project.id;
          }
          const tenantId = await this._getTenantId();
          return `${this.getHostUrl()}/o/${tenantId}/projects/p/${sessionId}/r/${run.id}?poll=true`;
        } else if (runId !== void 0) {
          const run_ = await this._readRun(runId);
          if (!run_.app_path) {
            throw new Error(`Run ${runId} has no app_path`);
          }
          const baseUrl = this.getHostUrl();
          return `${baseUrl}${run_.app_path}`;
        } else {
          throw new Error("Must provide either runId or run");
        }
      }
      /** The ID of the project an address names, with one request. */
      async _resolveAddress(address) {
        const { session_id: sessionId } = await this.sessions.resolve(address);
        assertUuid(sessionId);
        return sessionId;
      }
      async _loadChildRuns(run) {
        const childRuns = await toArray(this._listRuns({
          isRoot: false,
          projectId: run.session_id,
          traceId: run.trace_id
        }));
        const treemap = {};
        const runs = {};
        childRuns.sort((a, b) => (a?.dotted_order ?? "").localeCompare(b?.dotted_order ?? ""));
        for (const childRun of childRuns) {
          if (childRun.parent_run_id === null || childRun.parent_run_id === void 0) {
            throw new Error(`Child run ${childRun.id} has no parent`);
          }
          if (childRun.dotted_order?.startsWith(run.dotted_order ?? "") && childRun.id !== run.id) {
            if (!(childRun.parent_run_id in treemap)) {
              treemap[childRun.parent_run_id] = [];
            }
            treemap[childRun.parent_run_id].push(childRun);
            runs[childRun.id] = childRun;
          }
        }
        run.child_runs = treemap[run.id] || [];
        for (const runId in treemap) {
          if (runId !== run.id) {
            runs[runId].child_runs = treemap[runId];
          }
        }
        return run;
      }
      /**
       * List runs from the LangSmith server.
       * @deprecated Use `client.runs.query()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-query-runs#runs-query for the migration guide. Will be removed after Jan 31, 2027.
       * @param projectId - The ID of the project to filter by.
       * @param projectName - The name of the project to filter by.
       * @param parentRunId - The ID of the parent run to filter by.
       * @param traceId - The ID of the trace to filter by.
       * @param referenceExampleId - The ID of the reference example to filter by.
       * @param startTime - The start time to filter by.
       * @param isRoot - Indicates whether to only return root runs.
       * @param runType - The run type to filter by.
       * @param error - Indicates whether to filter by error runs.
       * @param id - The ID of the run to filter by.
       * @param query - The query string to filter by.
       * @param filter - The filter string to apply to the run spans.
       * @param traceFilter - The filter string to apply on the root run of the trace.
       * @param treeFilter - The filter string to apply on other runs in the trace.
       * @param limit - The maximum number of runs to retrieve.
       * @returns {AsyncIterable<Run>} - The runs.
       *
       * @example
       * // List all runs in a project
       * const projectRuns = client.listRuns({ projectName: "<your_project>" });
       *
       * @example
       * // List LLM and Chat runs in the last 24 hours
       * const todaysLLMRuns = client.listRuns({
       *   projectName: "<your_project>",
       *   start_time: new Date(Date.now() - 24 * 60 * 60 * 1000),
       *   run_type: "llm",
       * });
       *
       * @example
       * // List traces in a project
       * const rootRuns = client.listRuns({
       *   projectName: "<your_project>",
       *   execution_order: 1,
       * });
       *
       * @example
       * // List runs without errors
       * const correctRuns = client.listRuns({
       *   projectName: "<your_project>",
       *   error: false,
       * });
       *
       * @example
       * // List runs by run ID
       * const runIds = [
       *   "a36092d2-4ad5-4fb4-9c0d-0dba9a2ed836",
       *   "9398e6be-964f-4aa4-8ae9-ad78cd4b7074",
       * ];
       * const selectedRuns = client.listRuns({ run_ids: runIds });
       *
       * @example
       * // List all "chain" type runs that took more than 10 seconds and had `total_tokens` greater than 5000
       * const chainRuns = client.listRuns({
       *   projectName: "<your_project>",
       *   filter: 'and(eq(run_type, "chain"), gt(latency, 10), gt(total_tokens, 5000))',
       * });
       *
       * @example
       * // List all runs called "extractor" whose root of the trace was assigned feedback "user_score" score of 1
       * const goodExtractorRuns = client.listRuns({
       *   projectName: "<your_project>",
       *   filter: 'eq(name, "extractor")',
       *   traceFilter: 'and(eq(feedback_key, "user_score"), eq(feedback_score, 1))',
       * });
       *
       * @example
       * // List all runs that started after a specific timestamp and either have "error" not equal to null or a "Correctness" feedback score equal to 0
       * const complexRuns = client.listRuns({
       *   projectName: "<your_project>",
       *   filter: 'and(gt(start_time, "2023-07-15T12:34:56Z"), or(neq(error, null), and(eq(feedback_key, "Correctness"), eq(feedback_score, 0.0))))',
       * });
       *
       * @example
       * // List all runs where `tags` include "experimental" or "beta" and `latency` is greater than 2 seconds
       * const taggedRuns = client.listRuns({
       *   projectName: "<your_project>",
       *   filter: 'and(or(has(tags, "experimental"), has(tags, "beta")), gt(latency, 2))',
       * });
       */
      async *listRuns(props) {
        warnOnce("listRuns() is deprecated and will be removed after Jan 31, 2027. Use client.runs.query() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-query-runs#runs-query for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_LIST_RUNS" });
        yield* this._listRuns(props);
      }
      /**
       * List runs without emitting the `listRuns()` deprecation warning.
       *
       * Internal callers use this so that a supported method doesn't warn about a
       * deprecated one the caller never invoked.
       *
       * @internal
       */
      async *_listRuns(props) {
        const { projectId, projectName, parentRunId, traceId, referenceExampleId, startTime, executionOrder, isRoot, runType, error, id, query, filter, traceFilter, treeFilter, limit: limit2, select, order } = props;
        let projectIds = [];
        if (projectId) {
          projectIds = Array.isArray(projectId) ? projectId : [projectId];
        }
        if (projectName) {
          const projectNames = Array.isArray(projectName) ? projectName : [projectName];
          const projectIds_ = await Promise.all(projectNames.map((name) => this.readProject({ projectName: name }).then((project) => project.id)));
          projectIds.push(...projectIds_);
        }
        const default_select = [
          "app_path",
          "completion_cost",
          "completion_tokens",
          "dotted_order",
          "end_time",
          "error",
          "events",
          "extra",
          "feedback_stats",
          "first_token_time",
          "id",
          "inputs",
          "name",
          "outputs",
          "parent_run_id",
          "parent_run_ids",
          "prompt_cost",
          "prompt_tokens",
          "reference_example_id",
          "run_type",
          "session_id",
          "start_time",
          "status",
          "tags",
          "total_cost",
          "total_tokens",
          "trace_id"
        ];
        const body = {
          session: projectIds.length ? projectIds : null,
          run_type: runType,
          reference_example: referenceExampleId,
          query,
          filter,
          trace_filter: traceFilter,
          tree_filter: treeFilter,
          execution_order: executionOrder,
          parent_run: parentRunId,
          start_time: startTime ? startTime.toISOString() : null,
          error,
          id,
          limit: limit2,
          trace: traceId,
          select: select ? select : default_select,
          is_root: isRoot,
          order
        };
        if (body.select.includes("child_run_ids")) {
          warnOnce("Deprecated: 'child_run_ids' in the listRuns select parameter is deprecated and will be removed in a future version.");
        }
        let runsYielded = 0;
        for await (const runs of this._getCursorPaginatedList("/runs/query", body)) {
          const normalized = runs.map(_normalizeRunTimestamps);
          if (limit2) {
            if (runsYielded >= limit2) {
              break;
            }
            if (normalized.length + runsYielded > limit2) {
              const newRuns = normalized.slice(0, limit2 - runsYielded);
              yield* newRuns;
              break;
            }
            runsYielded += normalized.length;
            yield* normalized;
          } else {
            yield* normalized;
          }
        }
      }
      async *listGroupRuns(props) {
        const { projectId, projectName, groupBy, filter, startTime, endTime, limit: limit2, offset } = props;
        const sessionId = projectId || (await this.readProject({ projectName })).id;
        const baseBody = {
          session_id: sessionId,
          group_by: groupBy,
          filter,
          start_time: startTime ? startTime.toISOString() : null,
          end_time: endTime ? endTime.toISOString() : null,
          limit: Number(limit2) || 100
        };
        let currentOffset = Number(offset) || 0;
        const path4 = "/runs/group";
        const url = `${this.apiUrl}${path4}`;
        while (true) {
          const currentBody = {
            ...baseBody,
            offset: currentOffset
          };
          const filteredPayload = Object.fromEntries(Object.entries(currentBody).filter(([_, value]) => value !== void 0));
          const body = JSON.stringify(filteredPayload);
          const response = await this.caller.call(async () => {
            const res = await this._fetch(url, {
              method: "POST",
              headers: {
                ...this._mergedHeaders,
                "Content-Type": "application/json"
              },
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions,
              body
            });
            await raiseForStatus(res, `Failed to fetch ${path4}`);
            return res;
          });
          const items = await response.json();
          const { groups, total } = items;
          if (groups.length === 0) {
            break;
          }
          for (const thread of groups) {
            yield thread;
          }
          currentOffset += groups.length;
          if (currentOffset >= total) {
            break;
          }
        }
      }
      /** @deprecated Use `client.threads.listTraces()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-threads#threads-list-traces for the migration guide. Will be removed after Jan 31, 2027. */
      async *readThread(props) {
        warnOnce("readThread() is deprecated and will be removed after Jan 31, 2027. Use client.threads.listTraces() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-threads#threads-list-traces for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_READ_THREAD" });
        const { threadId, projectId, projectName, isRoot = true, limit: limit2, filter: userFilter, order = "asc" } = props;
        if (!projectId && !projectName) {
          throw new Error("threadId requires projectId or projectName");
        }
        const threadFilter = `eq(thread_id, ${JSON.stringify(threadId)})`;
        const combinedFilter = userFilter ? `and(${threadFilter}, ${userFilter})` : threadFilter;
        yield* this._listRuns({
          projectId: projectId ?? void 0,
          projectName: projectName ?? void 0,
          isRoot,
          limit: limit2,
          filter: combinedFilter,
          order
        });
      }
      /** @deprecated Use `client.threads.query()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-threads#threads-query for the migration guide. Will be removed after Jan 31, 2027. */
      async listThreads(props) {
        warnOnce("listThreads() is deprecated and will be removed after Jan 31, 2027. Use client.threads.query() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-threads#threads-query for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_LIST_THREADS" });
        const { projectId, projectName, limit: limit2, offset = 0, filter, startTime, isRoot = true } = props;
        if (!projectId && !projectName) {
          throw new Error("Either projectId or projectName must be provided");
        }
        if (projectId && projectName) {
          throw new Error("Provide exactly one of projectId or projectName");
        }
        const sessionId = projectId ?? (await this.readProject({ projectName })).id;
        const startTimeResolved = startTime ?? new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3);
        const runSelect = [
          "id",
          "name",
          "status",
          "start_time",
          "end_time",
          "thread_id",
          "trace_id",
          "run_type",
          "error",
          "tags",
          "session_id",
          "parent_run_id",
          "total_tokens",
          "total_cost",
          "dotted_order",
          "reference_example_id",
          "feedback_stats",
          "app_path",
          "completion_cost",
          "completion_tokens",
          "prompt_cost",
          "prompt_tokens",
          "first_token_time"
        ];
        const bodyQuery = {
          session: [sessionId],
          is_root: isRoot,
          limit: 100,
          order: "desc",
          select: runSelect,
          start_time: startTimeResolved.toISOString()
        };
        if (filter != null) {
          bodyQuery.filter = filter;
        }
        const threadsMap = /* @__PURE__ */ new Map();
        for await (const runs of this._getCursorPaginatedList("/runs/query", bodyQuery)) {
          for (const raw of runs) {
            const run = _normalizeRunTimestamps(raw);
            const tid = run.thread_id;
            if (tid) {
              const list = threadsMap.get(tid) ?? [];
              list.push(run);
              threadsMap.set(tid, list);
            }
          }
        }
        const result = [];
        for (const [threadId, runs] of threadsMap.entries()) {
          runs.sort((a, b) => {
            const aRun = a;
            const bRun = b;
            const aStart = aRun.start_time ?? "";
            const bStart = bRun.start_time ?? "";
            if (aStart !== bStart)
              return aStart.localeCompare(bStart);
            const aOrder = aRun.dotted_order ?? "";
            const bOrder = bRun.dotted_order ?? "";
            return aOrder.localeCompare(bOrder);
          });
          const startTimes = runs.map((r) => r.start_time).filter(Boolean);
          const sortedTimes = [...startTimes].sort();
          const minStart = sortedTimes.length ? sortedTimes[0] : "";
          const maxStart = sortedTimes.length ? sortedTimes[sortedTimes.length - 1] : "";
          result.push({
            thread_id: threadId,
            runs,
            count: runs.length,
            filter: "",
            total_tokens: 0,
            total_cost: null,
            min_start_time: minStart,
            max_start_time: maxStart,
            latency_p50: 0,
            latency_p99: 0,
            feedback_stats: null,
            first_inputs: "",
            last_outputs: "",
            last_error: null
          });
        }
        result.sort((a, b) => {
          const aMax = a.max_start_time ?? "";
          const bMax = b.max_start_time ?? "";
          return bMax.localeCompare(aMax);
        });
        const withOffset = offset > 0 ? result.slice(offset) : result;
        const withLimit = limit2 !== void 0 ? withOffset.slice(0, limit2) : withOffset;
        return withLimit;
      }
      async getRunStats({ id, trace, parentRun, runType, projectNames, projectIds, referenceExampleIds, startTime, endTime, error, query, filter, traceFilter, treeFilter, isRoot, dataSourceType }) {
        let projectIds_ = projectIds || [];
        if (projectNames) {
          projectIds_ = [
            ...projectIds || [],
            ...await Promise.all(projectNames.map((name) => this.readProject({ projectName: name }).then((project) => project.id)))
          ];
        }
        if (projectIds_.length === 0) {
          throw new Error("At least one of projectNames or projectIds must be provided.");
        }
        const payload = {
          id,
          trace,
          parent_run: parentRun,
          run_type: runType,
          session: projectIds_,
          reference_example: referenceExampleIds,
          start_time: startTime,
          end_time: endTime,
          error,
          query,
          filter,
          trace_filter: traceFilter,
          tree_filter: treeFilter,
          is_root: isRoot,
          data_source_type: dataSourceType
        };
        const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== void 0));
        const body = JSON.stringify(filteredPayload);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/runs/stats`, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "get run stats");
          return res;
        });
        const result = await response.json();
        return result;
      }
      /** @deprecated Use `client.runs.share.create()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide. Will be removed after Jan 31, 2027. */
      async shareRun(runId, { shareId } = {}) {
        warnOnce("shareRun() is deprecated and will be removed after Jan 31, 2027. Use client.runs.share.create() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_SHARE_RUN" });
        const data = {
          run_id: runId,
          share_token: shareId || v4_default()
        };
        assertUuid(runId);
        const body = JSON.stringify(data);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/runs/${runId}/share`, {
            method: "PUT",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "share run");
          return res;
        });
        const result = await response.json();
        if (result === null || !("share_token" in result)) {
          throw new Error("Invalid response from server");
        }
        return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
      }
      /** @deprecated Use `client.runs.share.delete()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide. Will be removed after Jan 31, 2027. */
      async unshareRun(runId) {
        warnOnce("unshareRun() is deprecated and will be removed after Jan 31, 2027. Use client.runs.share.delete() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_UNSHARE_RUN" });
        assertUuid(runId);
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/runs/${runId}/share`, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "unshare run", true);
          return res;
        });
      }
      /** @deprecated Use `client.runs.retrieve({ selects: ["SHARE_URL"] })` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide. Will be removed after Jan 31, 2027. */
      async readRunSharedLink(runId) {
        warnOnce('readRunSharedLink() is deprecated and will be removed after Jan 31, 2027. Use client.runs.retrieve({ selects: ["SHARE_URL"] }) instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide.', {
          type: "DeprecationWarning",
          code: "LANGSMITH_DEPRECATED_READ_RUN_SHARED_LINK"
        });
        assertUuid(runId);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/runs/${runId}/share`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "read run shared link");
          return res;
        });
        const result = await response.json();
        if (result === null || !("share_token" in result)) {
          return void 0;
        }
        return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
      }
      /** @deprecated Use `client.public.runs.query()` instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide. Will be removed after Jan 31, 2027. */
      async listSharedRuns(shareToken, { runIds } = {}) {
        warnOnce("listSharedRuns() is deprecated and will be removed after Jan 31, 2027. Use client.public.runs.query() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#share-and-read-public-runs for the migration guide.", {
          type: "DeprecationWarning",
          code: "LANGSMITH_DEPRECATED_LIST_SHARED_RUNS"
        });
        const queryParams = new URLSearchParams({
          share_token: shareToken
        });
        if (runIds !== void 0) {
          for (const runId of runIds) {
            queryParams.append("id", runId);
          }
        }
        assertUuid(shareToken);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/public/${shareToken}/runs${queryParams}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "list shared runs");
          return res;
        });
        const runs = await response.json();
        return runs.map(_normalizeRunTimestamps);
      }
      async readDatasetSharedSchema(datasetId, datasetName) {
        if (!datasetId && !datasetName) {
          throw new Error("Either datasetId or datasetName must be given");
        }
        if (!datasetId) {
          const dataset = await this.readDataset({ datasetName });
          datasetId = dataset.id;
        }
        assertUuid(datasetId);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId}/share`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "read dataset shared schema");
          return res;
        });
        const shareSchema = await response.json();
        shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
        return shareSchema;
      }
      async shareDataset(datasetId, datasetName) {
        if (!datasetId && !datasetName) {
          throw new Error("Either datasetId or datasetName must be given");
        }
        if (!datasetId) {
          const dataset = await this.readDataset({ datasetName });
          datasetId = dataset.id;
        }
        const data = {
          dataset_id: datasetId
        };
        assertUuid(datasetId);
        const body = JSON.stringify(data);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId}/share`, {
            method: "PUT",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "share dataset");
          return res;
        });
        const shareSchema = await response.json();
        shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
        return shareSchema;
      }
      async unshareDataset(datasetId) {
        assertUuid(datasetId);
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId}/share`, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "unshare dataset", true);
          return res;
        });
      }
      async readSharedDataset(shareToken) {
        assertUuid(shareToken);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/public/${shareToken}/datasets`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "read shared dataset");
          return res;
        });
        const dataset = await response.json();
        return dataset;
      }
      /**
       * Get shared examples.
       *
       * @param {string} shareToken The share token to get examples for. A share token is the UUID (or LangSmith URL, including UUID) generated when explicitly marking an example as public.
       * @param {Object} [options] Additional options for listing the examples.
       * @param {string[] | undefined} [options.exampleIds] A list of example IDs to filter by.
       * @returns {Promise<Example[]>} The shared examples.
       */
      async listSharedExamples(shareToken, options) {
        const params = {};
        if (options?.exampleIds) {
          params.id = options.exampleIds;
        }
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => urlParams.append(key, v));
          } else {
            urlParams.append(key, value);
          }
        });
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/public/${shareToken}/examples?${urlParams.toString()}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "list shared examples");
          return res;
        });
        const result = await response.json();
        if (!response.ok) {
          if ("detail" in result) {
            throw new Error(`Failed to list shared examples.
Status: ${response.status}
Message: ${Array.isArray(result.detail) ? result.detail.join("\n") : "Unspecified error"}`);
          }
          throw new Error(`Failed to list shared examples: ${response.status} ${response.statusText}`);
        }
        return result.map((example) => ({
          ...example,
          _hostUrl: this.getHostUrl()
        }));
      }
      async createProject({ projectName, description = null, metadata = null, upsert = false, projectExtra = null, referenceDatasetId = null, numExamples = null, numRepetitions = null, evaluatorKeys = null, tagValueIds = null }) {
        const upsert_ = upsert ? `?upsert=true` : "";
        const endpoint = `${this.apiUrl}/sessions${upsert_}`;
        const extra = projectExtra || {};
        if (metadata) {
          extra["metadata"] = metadata;
        }
        const body = {
          name: projectName,
          extra,
          description
        };
        if (referenceDatasetId !== null) {
          body["reference_dataset_id"] = referenceDatasetId;
        }
        if (numExamples != null) {
          body["num_examples"] = numExamples;
        }
        if (numRepetitions != null) {
          body["num_repetitions"] = numRepetitions;
        }
        if (evaluatorKeys != null && evaluatorKeys.length > 0) {
          body["evaluator_keys"] = evaluatorKeys;
        }
        if (tagValueIds !== null) {
          body["tag_value_ids"] = tagValueIds;
        }
        const serializedBody = JSON.stringify(body);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(endpoint, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: serializedBody
          });
          await raiseForStatus(res, "create project");
          return res;
        });
        const result = await response.json();
        return result;
      }
      async updateProject(projectId, { name = null, description = null, metadata = null, projectExtra = null, endTime = null }) {
        const endpoint = `${this.apiUrl}/sessions/${projectId}`;
        let extra = projectExtra;
        if (metadata) {
          extra = { ...extra || {}, metadata };
        }
        const body = JSON.stringify({
          name,
          extra,
          description,
          end_time: endTime ? new Date(endTime).toISOString() : null
        });
        const response = await this.caller.call(async () => {
          const res = await this._fetch(endpoint, {
            method: "PATCH",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update project");
          return res;
        });
        const result = await response.json();
        return result;
      }
      async hasProject({ projectId, projectName }) {
        let path4 = "/sessions";
        const params = new URLSearchParams();
        if (projectId !== void 0 && projectName !== void 0) {
          throw new Error("Must provide either projectName or projectId, not both");
        } else if (projectId !== void 0) {
          assertUuid(projectId);
          path4 += `/${projectId}`;
        } else if (projectName !== void 0) {
          params.append("name", projectName);
        } else {
          throw new Error("Must provide projectName or projectId");
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}${path4}?${params}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "has project");
          return res;
        });
        try {
          const result = await response.json();
          if (!response.ok) {
            return false;
          }
          if (Array.isArray(result)) {
            return result.length > 0;
          }
          return true;
        } catch (_e) {
          return false;
        }
      }
      async readProject({ projectId, projectName, includeStats }) {
        let path4 = "/sessions";
        const params = new URLSearchParams();
        if (projectId !== void 0 && projectName !== void 0) {
          throw new Error("Must provide either projectName or projectId, not both");
        } else if (projectId !== void 0) {
          assertUuid(projectId);
          path4 += `/${projectId}`;
        } else if (projectName !== void 0) {
          params.append("name", projectName);
        } else {
          throw new Error("Must provide projectName or projectId");
        }
        if (includeStats !== void 0) {
          params.append("include_stats", includeStats.toString());
        }
        const response = await this._get(path4, params);
        let result;
        if (Array.isArray(response)) {
          if (response.length === 0) {
            throw new Error(`Project[id=${projectId}, name=${projectName}] not found`);
          }
          result = response[0];
        } else {
          result = response;
        }
        return result;
      }
      async getProjectUrl({ projectId, projectName }) {
        if (projectId === void 0 && projectName === void 0) {
          throw new Error("Must provide either projectName or projectId");
        }
        const project = await this.readProject({ projectId, projectName });
        const tenantId = await this._getTenantId();
        return `${this.getHostUrl()}/o/${tenantId}/projects/p/${project.id}`;
      }
      async getDatasetUrl({ datasetId, datasetName }) {
        if (datasetId === void 0 && datasetName === void 0) {
          throw new Error("Must provide either datasetName or datasetId");
        }
        const dataset = await this.readDataset({ datasetId, datasetName });
        const tenantId = await this._getTenantId();
        return `${this.getHostUrl()}/o/${tenantId}/datasets/${dataset.id}`;
      }
      async _getTenantId() {
        if (this._tenantId !== null) {
          return this._tenantId;
        }
        const queryParams = new URLSearchParams({ limit: "1" });
        for await (const projects of this._getPaginated("/sessions", queryParams)) {
          this._tenantId = projects[0].tenant_id;
          return projects[0].tenant_id;
        }
        throw new Error("No projects found to resolve tenant.");
      }
      async *listProjects({ projectIds, name, nameContains, referenceDatasetId, referenceDatasetName, includeStats, datasetVersion, referenceFree, metadata } = {}) {
        const params = new URLSearchParams();
        if (projectIds !== void 0) {
          for (const projectId of projectIds) {
            params.append("id", projectId);
          }
        }
        if (name !== void 0) {
          params.append("name", name);
        }
        if (nameContains !== void 0) {
          params.append("name_contains", nameContains);
        }
        if (referenceDatasetId !== void 0) {
          params.append("reference_dataset", referenceDatasetId);
        } else if (referenceDatasetName !== void 0) {
          const dataset = await this.readDataset({
            datasetName: referenceDatasetName
          });
          params.append("reference_dataset", dataset.id);
        }
        if (includeStats !== void 0) {
          params.append("include_stats", includeStats.toString());
        }
        if (datasetVersion !== void 0) {
          params.append("dataset_version", datasetVersion);
        }
        if (referenceFree !== void 0) {
          params.append("reference_free", referenceFree.toString());
        }
        if (metadata !== void 0) {
          params.append("metadata", JSON.stringify(metadata));
        }
        for await (const projects of this._getPaginated("/sessions", params)) {
          yield* projects;
        }
      }
      async deleteProject({ projectId, projectName }) {
        let projectId_;
        if (projectId === void 0 && projectName === void 0) {
          throw new Error("Must provide projectName or projectId");
        } else if (projectId !== void 0 && projectName !== void 0) {
          throw new Error("Must provide either projectName or projectId, not both");
        } else if (projectId === void 0) {
          projectId_ = (await this.readProject({ projectName })).id;
        } else {
          projectId_ = projectId;
        }
        assertUuid(projectId_);
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/sessions/${projectId_}`, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, `delete session ${projectId_} (${projectName})`, true);
          return res;
        });
      }
      async uploadCsv({ csvFile, fileName, inputKeys, outputKeys, description, dataType, name }) {
        const url = `${this.apiUrl}/datasets/upload`;
        const formData = new FormData();
        const csvBlob = new Blob([csvFile], { type: "text/csv" });
        formData.append("file", csvBlob, fileName);
        inputKeys.forEach((key) => {
          formData.append("input_keys", key);
        });
        outputKeys.forEach((key) => {
          formData.append("output_keys", key);
        });
        if (description) {
          formData.append("description", description);
        }
        if (dataType) {
          formData.append("data_type", dataType);
        }
        if (name) {
          formData.append("name", name);
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(url, {
            method: "POST",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: formData
          });
          await raiseForStatus(res, "upload CSV");
          return res;
        });
        const result = await response.json();
        return result;
      }
      async createDataset(name, { description, dataType, inputsSchema, outputsSchema, metadata, tagValueIds } = {}) {
        const body = {
          name,
          description,
          extra: { source: "sdk", ...metadata ? { metadata } : {} }
        };
        if (dataType) {
          body.data_type = dataType;
        }
        if (inputsSchema) {
          body.inputs_schema_definition = inputsSchema;
        }
        if (outputsSchema) {
          body.outputs_schema_definition = outputsSchema;
        }
        if (tagValueIds !== void 0) {
          body.tag_value_ids = tagValueIds;
        }
        const serializedBody = JSON.stringify(body);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets`, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: serializedBody
          });
          await raiseForStatus(res, "create dataset");
          return res;
        });
        const result = await response.json();
        return result;
      }
      async readDataset({ datasetId, datasetName }) {
        let path4 = "/datasets";
        const params = new URLSearchParams({ limit: "1" });
        if (datasetId && datasetName) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetId) {
          assertUuid(datasetId);
          path4 += `/${datasetId}`;
        } else if (datasetName) {
          params.append("name", datasetName);
        } else {
          throw new Error("Must provide datasetName or datasetId");
        }
        const response = await this._get(path4, params);
        let result;
        if (Array.isArray(response)) {
          if (response.length === 0) {
            throw new Error(`Dataset[id=${datasetId}, name=${datasetName}] not found`);
          }
          result = response[0];
        } else {
          result = response;
        }
        return result;
      }
      async hasDataset({ datasetId, datasetName }) {
        try {
          await this.readDataset({ datasetId, datasetName });
          return true;
        } catch (e) {
          if (e instanceof Error && e.message.toLocaleLowerCase().includes("not found")) {
            return false;
          }
          throw e;
        }
      }
      async diffDatasetVersions({ datasetId, datasetName, fromVersion, toVersion }) {
        let datasetId_ = datasetId;
        if (datasetId_ === void 0 && datasetName === void 0) {
          throw new Error("Must provide either datasetName or datasetId");
        } else if (datasetId_ !== void 0 && datasetName !== void 0) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetId_ === void 0) {
          const dataset = await this.readDataset({ datasetName });
          datasetId_ = dataset.id;
        }
        const urlParams = new URLSearchParams({
          from_version: typeof fromVersion === "string" ? fromVersion : fromVersion.toISOString(),
          to_version: typeof toVersion === "string" ? toVersion : toVersion.toISOString()
        });
        const response = await this._get(`/datasets/${datasetId_}/versions/diff`, urlParams);
        return response;
      }
      async readDatasetOpenaiFinetuning({ datasetId, datasetName }) {
        const path4 = "/datasets";
        if (datasetId !== void 0) {
        } else if (datasetName !== void 0) {
          datasetId = (await this.readDataset({ datasetName })).id;
        } else {
          throw new Error("Must provide either datasetName or datasetId");
        }
        const response = await this._getResponse(`${path4}/${datasetId}/openai_ft`);
        const datasetText = await response.text();
        const dataset = datasetText.trim().split("\n").map((line) => JSON.parse(line));
        return dataset;
      }
      async *listDatasets({ limit: limit2 = 100, offset = 0, datasetIds, datasetName, datasetNameContains, metadata } = {}) {
        const path4 = "/datasets";
        const params = new URLSearchParams({
          limit: limit2.toString(),
          offset: offset.toString()
        });
        if (datasetIds !== void 0) {
          for (const id_ of datasetIds) {
            params.append("id", id_);
          }
        }
        if (datasetName !== void 0) {
          params.append("name", datasetName);
        }
        if (datasetNameContains !== void 0) {
          params.append("name_contains", datasetNameContains);
        }
        if (metadata !== void 0) {
          params.append("metadata", JSON.stringify(metadata));
        }
        for await (const datasets of this._getPaginated(path4, params)) {
          yield* datasets;
        }
      }
      /**
       * Update a dataset
       * @param props The dataset details to update
       * @returns The updated dataset
       */
      async updateDataset(props) {
        const { datasetId, datasetName, ...update } = props;
        if (!datasetId && !datasetName) {
          throw new Error("Must provide either datasetName or datasetId");
        }
        const _datasetId = datasetId ?? (await this.readDataset({ datasetName })).id;
        assertUuid(_datasetId);
        const body = JSON.stringify(update);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/${_datasetId}`, {
            method: "PATCH",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update dataset");
          return res;
        });
        return await response.json();
      }
      /**
       * Updates a tag on a dataset.
       *
       * If the tag is already assigned to a different version of this dataset,
       * the tag will be moved to the new version. The as_of parameter is used to
       * determine which version of the dataset to apply the new tags to.
       *
       * It must be an exact version of the dataset to succeed. You can
       * use the "readDatasetVersion" method to find the exact version
       * to apply the tags to.
       * @param params.datasetId The ID of the dataset to update. Must be provided if "datasetName" is not provided.
       * @param params.datasetName The name of the dataset to update. Must be provided if "datasetId" is not provided.
       * @param params.asOf The timestamp of the dataset to apply the new tags to.
       * @param params.tag The new tag to apply to the dataset.
       */
      async updateDatasetTag(props) {
        const { datasetId, datasetName, asOf, tag } = props;
        if (!datasetId && !datasetName) {
          throw new Error("Must provide either datasetName or datasetId");
        }
        const _datasetId = datasetId ?? (await this.readDataset({ datasetName })).id;
        assertUuid(_datasetId);
        const body = JSON.stringify({
          as_of: typeof asOf === "string" ? asOf : asOf.toISOString(),
          tag
        });
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/${_datasetId}/tags`, {
            method: "PUT",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update dataset tags", true);
          return res;
        });
      }
      async deleteDataset({ datasetId, datasetName }) {
        let path4 = "/datasets";
        let datasetId_ = datasetId;
        if (datasetId !== void 0 && datasetName !== void 0) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetName !== void 0) {
          const dataset = await this.readDataset({ datasetName });
          datasetId_ = dataset.id;
        }
        if (datasetId_ !== void 0) {
          assertUuid(datasetId_);
          path4 += `/${datasetId_}`;
        } else {
          throw new Error("Must provide datasetName or datasetId");
        }
        await this.caller.call(async () => {
          const res = await this._fetch(this.apiUrl + path4, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, `delete ${path4}`, true);
          return res;
        });
      }
      async createExample(inputsOrUpdate, referenceOutputs, options) {
        if (isExampleCreate(inputsOrUpdate)) {
          if (referenceOutputs !== void 0 || options !== void 0) {
            throw new Error("Cannot provide referenceOutputs or options when using ExampleCreate object");
          }
        }
        let datasetId_ = referenceOutputs ? options?.datasetId : inputsOrUpdate.dataset_id;
        const datasetName_ = referenceOutputs ? options?.datasetName : inputsOrUpdate.dataset_name;
        if (datasetId_ === void 0 && datasetName_ === void 0) {
          throw new Error("Must provide either datasetName or datasetId");
        } else if (datasetId_ !== void 0 && datasetName_ !== void 0) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetId_ === void 0) {
          const dataset = await this.readDataset({ datasetName: datasetName_ });
          datasetId_ = dataset.id;
        }
        const createdAt_ = (referenceOutputs ? options?.createdAt : inputsOrUpdate.created_at) || /* @__PURE__ */ new Date();
        let data;
        if (!isExampleCreate(inputsOrUpdate)) {
          data = {
            inputs: inputsOrUpdate,
            reference_outputs: referenceOutputs,
            created_at: createdAt_?.toISOString(),
            id: options?.exampleId,
            metadata: options?.metadata,
            split: options?.split,
            source_run_id: options?.sourceRunId,
            use_source_run_io: options?.useSourceRunIO,
            use_source_run_attachments: options?.useSourceRunAttachments,
            attachments: options?.attachments
          };
        } else {
          data = inputsOrUpdate;
        }
        const response = await this._uploadExamplesMultipart(datasetId_, [data]);
        const example = await this.readExample(response.example_ids?.[0] ?? v4_default());
        return example;
      }
      async createExamples(propsOrUploads) {
        if (Array.isArray(propsOrUploads)) {
          if (propsOrUploads.length === 0) {
            return [];
          }
          const uploads = propsOrUploads;
          let datasetId_2 = uploads[0].dataset_id;
          const datasetName_2 = uploads[0].dataset_name;
          if (datasetId_2 === void 0 && datasetName_2 === void 0) {
            throw new Error("Must provide either datasetName or datasetId");
          } else if (datasetId_2 !== void 0 && datasetName_2 !== void 0) {
            throw new Error("Must provide either datasetName or datasetId, not both");
          } else if (datasetId_2 === void 0) {
            const dataset = await this.readDataset({ datasetName: datasetName_2 });
            datasetId_2 = dataset.id;
          }
          const response2 = await this._uploadExamplesMultipart(datasetId_2, uploads);
          const examples2 = await Promise.all(response2.example_ids.map((id) => this.readExample(id)));
          return examples2;
        }
        const { inputs, referenceOutputs, outputs, metadata, splits, sourceRunIds, useSourceRunIOs, useSourceRunAttachments, attachments, exampleIds, datasetId, datasetName } = propsOrUploads;
        if (referenceOutputs !== void 0 && outputs !== void 0) {
          throw new Error("Cannot specify both referenceOutputs and outputs");
        }
        if (inputs === void 0) {
          throw new Error("Must provide inputs when using legacy parameters");
        }
        let datasetId_ = datasetId;
        const datasetName_ = datasetName;
        if (datasetId_ === void 0 && datasetName_ === void 0) {
          throw new Error("Must provide either datasetName or datasetId");
        } else if (datasetId_ !== void 0 && datasetName_ !== void 0) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetId_ === void 0) {
          const dataset = await this.readDataset({ datasetName: datasetName_ });
          datasetId_ = dataset.id;
        }
        const formattedExamples = inputs.map((input, idx) => {
          return {
            dataset_id: datasetId_,
            inputs: input,
            reference_outputs: (referenceOutputs ?? outputs)?.[idx],
            metadata: metadata?.[idx],
            split: splits?.[idx],
            id: exampleIds?.[idx],
            attachments: attachments?.[idx],
            source_run_id: sourceRunIds?.[idx],
            use_source_run_io: useSourceRunIOs?.[idx],
            use_source_run_attachments: useSourceRunAttachments?.[idx]
          };
        });
        const response = await this._uploadExamplesMultipart(datasetId_, formattedExamples);
        const examples = await Promise.all(response.example_ids.map((id) => this.readExample(id)));
        return examples;
      }
      async createLLMExample(input, generation, options) {
        return this.createExample({ input }, { output: generation }, options);
      }
      async createChatExample(input, generations, options) {
        const finalInput = input.map((message) => {
          if (isLangChainMessage(message)) {
            return convertLangChainMessageToExample(message);
          }
          return message;
        });
        const finalOutput = isLangChainMessage(generations) ? convertLangChainMessageToExample(generations) : generations;
        return this.createExample({ input: finalInput }, { output: finalOutput }, options);
      }
      async readExample(exampleId) {
        assertUuid(exampleId);
        const path4 = `/examples/${exampleId}`;
        const rawExample = await this._get(path4);
        const { attachment_urls, ...rest } = rawExample;
        const example = rest;
        if (attachment_urls) {
          example.attachments = Object.entries(attachment_urls).reduce((acc, [key, value]) => {
            acc[key.slice("attachment.".length)] = {
              presigned_url: new URL(value.presigned_url, this.apiUrl).href,
              mime_type: value.mime_type
            };
            return acc;
          }, {});
        }
        return example;
      }
      async *listExamples({ datasetId, datasetName, exampleIds, asOf, splits, inlineS3Urls, metadata, limit: limit2, offset, filter, includeAttachments, select, excludeDefaultFields } = {}) {
        let datasetId_;
        if (datasetId !== void 0 && datasetName !== void 0) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetId !== void 0) {
          datasetId_ = datasetId;
        } else if (datasetName !== void 0) {
          const dataset = await this.readDataset({ datasetName });
          datasetId_ = dataset.id;
        } else {
          throw new Error("Must provide a datasetName or datasetId");
        }
        const params = new URLSearchParams({ dataset: datasetId_ });
        const dataset_version = asOf ? typeof asOf === "string" ? asOf : asOf?.toISOString() : void 0;
        if (dataset_version) {
          params.append("as_of", dataset_version);
        }
        const inlineS3Urls_ = inlineS3Urls ?? true;
        params.append("inline_s3_urls", inlineS3Urls_.toString());
        if (exampleIds !== void 0) {
          for (const id_ of exampleIds) {
            params.append("id", id_);
          }
        }
        if (splits !== void 0) {
          for (const split of splits) {
            params.append("splits", split);
          }
        }
        if (metadata !== void 0) {
          const serializedMetadata = JSON.stringify(metadata);
          params.append("metadata", serializedMetadata);
        }
        if (limit2 !== void 0) {
          params.append("limit", limit2.toString());
        }
        if (offset !== void 0) {
          params.append("offset", offset.toString());
        }
        if (filter !== void 0) {
          params.append("filter", filter);
        }
        const selectFields = new Set(select ?? []);
        if (includeAttachments === true) {
          for (const field of ["attachment_urls", "outputs", "metadata"]) {
            selectFields.add(field);
          }
        }
        for (const field of selectFields) {
          params.append("select", field);
        }
        if (excludeDefaultFields === true) {
          params.append("exclude_default_fields", "true");
        }
        let i = 0;
        for await (const rawExamples of this._getPaginated("/examples", params)) {
          for (const rawExample of rawExamples) {
            const { attachment_urls, ...rest } = rawExample;
            const example = rest;
            if (attachment_urls) {
              example.attachments = Object.entries(attachment_urls).reduce((acc, [key, value]) => {
                acc[key.slice("attachment.".length)] = {
                  presigned_url: new URL(value.presigned_url, this.apiUrl).href,
                  mime_type: value.mime_type || void 0
                };
                return acc;
              }, {});
            }
            yield example;
            i++;
          }
          if (limit2 !== void 0 && i >= limit2) {
            break;
          }
        }
      }
      async deleteExample(exampleId) {
        assertUuid(exampleId);
        const path4 = `/examples/${exampleId}`;
        await this.caller.call(async () => {
          const res = await this._fetch(this.apiUrl + path4, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, `delete ${path4}`, true);
          return res;
        });
      }
      /**
       * Delete multiple examples by ID.
       * @param exampleIds - The IDs of the examples to delete
       * @param options - Optional settings for deletion
       * @param options.hardDelete - If true, permanently delete examples. If false (default), soft delete them.
       */
      async deleteExamples(exampleIds, options) {
        exampleIds.forEach((id) => assertUuid(id));
        if (options?.hardDelete) {
          const path4 = this._getPlatformEndpointPath("datasets/examples/delete");
          await this.caller.call(async () => {
            const res = await this._fetch(`${this.apiUrl}${path4}`, {
              method: "POST",
              headers: {
                ...this._mergedHeaders,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                example_ids: exampleIds,
                hard_delete: true
              }),
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions
            });
            await raiseForStatus(res, "hard delete examples", true);
            return res;
          });
        } else {
          const params = new URLSearchParams();
          exampleIds.forEach((id) => params.append("example_ids", id));
          await this.caller.call(async () => {
            const res = await this._fetch(`${this.apiUrl}/examples?${params.toString()}`, {
              method: "DELETE",
              headers: this._mergedHeaders,
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions
            });
            await raiseForStatus(res, "delete examples", true);
            return res;
          });
        }
      }
      async updateExample(exampleIdOrUpdate, update) {
        let exampleId;
        if (update) {
          exampleId = exampleIdOrUpdate;
        } else {
          exampleId = exampleIdOrUpdate.id;
        }
        assertUuid(exampleId);
        let updateToUse;
        if (update) {
          updateToUse = { id: exampleId, ...update };
        } else {
          updateToUse = exampleIdOrUpdate;
        }
        let datasetId;
        if (updateToUse.dataset_id !== void 0) {
          datasetId = updateToUse.dataset_id;
        } else {
          const example = await this.readExample(exampleId);
          datasetId = example.dataset_id;
        }
        return this._updateExamplesMultipart(datasetId, [updateToUse]);
      }
      async updateExamples(update) {
        let datasetId;
        if (update[0].dataset_id === void 0) {
          const example = await this.readExample(update[0].id);
          datasetId = example.dataset_id;
        } else {
          datasetId = update[0].dataset_id;
        }
        return this._updateExamplesMultipart(datasetId, update);
      }
      /**
       * Get dataset version by closest date or exact tag.
       *
       * Use this to resolve the nearest version to a given timestamp or for a given tag.
       *
       * @param options The options for getting the dataset version
       * @param options.datasetId The ID of the dataset
       * @param options.datasetName The name of the dataset
       * @param options.asOf The timestamp of the dataset to retrieve
       * @param options.tag The tag of the dataset to retrieve
       * @returns The dataset version
       */
      async readDatasetVersion({ datasetId, datasetName, asOf, tag }) {
        let resolvedDatasetId;
        if (!datasetId) {
          const dataset = await this.readDataset({ datasetName });
          resolvedDatasetId = dataset.id;
        } else {
          resolvedDatasetId = datasetId;
        }
        assertUuid(resolvedDatasetId);
        if (asOf && tag || !asOf && !tag) {
          throw new Error("Exactly one of asOf and tag must be specified.");
        }
        const params = new URLSearchParams();
        if (asOf !== void 0) {
          params.append("as_of", typeof asOf === "string" ? asOf : asOf.toISOString());
        }
        if (tag !== void 0) {
          params.append("tag", tag);
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/${resolvedDatasetId}/version?${params.toString()}`, {
            method: "GET",
            headers: { ...this._mergedHeaders },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "read dataset version");
          return res;
        });
        return await response.json();
      }
      async listDatasetSplits({ datasetId, datasetName, asOf }) {
        let datasetId_;
        if (datasetId === void 0 && datasetName === void 0) {
          throw new Error("Must provide dataset name or ID");
        } else if (datasetId !== void 0 && datasetName !== void 0) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetId === void 0) {
          const dataset = await this.readDataset({ datasetName });
          datasetId_ = dataset.id;
        } else {
          datasetId_ = datasetId;
        }
        assertUuid(datasetId_);
        const params = new URLSearchParams();
        const dataset_version = asOf ? typeof asOf === "string" ? asOf : asOf?.toISOString() : void 0;
        if (dataset_version) {
          params.append("as_of", dataset_version);
        }
        const response = await this._get(`/datasets/${datasetId_}/splits`, params);
        return response;
      }
      async updateDatasetSplits({ datasetId, datasetName, splitName, exampleIds, remove = false }) {
        let datasetId_;
        if (datasetId === void 0 && datasetName === void 0) {
          throw new Error("Must provide dataset name or ID");
        } else if (datasetId !== void 0 && datasetName !== void 0) {
          throw new Error("Must provide either datasetName or datasetId, not both");
        } else if (datasetId === void 0) {
          const dataset = await this.readDataset({ datasetName });
          datasetId_ = dataset.id;
        } else {
          datasetId_ = datasetId;
        }
        assertUuid(datasetId_);
        const data = {
          split_name: splitName,
          examples: exampleIds.map((id) => {
            assertUuid(id);
            return id;
          }),
          remove
        };
        const body = JSON.stringify(data);
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId_}/splits`, {
            method: "PUT",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update dataset splits", true);
          return res;
        });
      }
      async createFeedback(runIdOrParams, keyArg, optionsArg) {
        const { runId = null, key, score, value, correction, comment, sourceInfo, feedbackSourceType = "api", sourceRunId, feedbackId, feedbackConfig, projectId, traceId, comparativeExperimentId, sessionId, startTime, extendTraceRetention, address: rawAddress } = typeof runIdOrParams === "object" && runIdOrParams !== null ? runIdOrParams : { runId: runIdOrParams, key: keyArg, ...optionsArg };
        const address = ensureAgent(rawAddress);
        rejectConflicting(sessionId ?? projectId, address);
        if (!runId && !projectId) {
          throw new Error("One of runId or projectId must be provided");
        }
        if (runId && projectId) {
          throw new Error("Only one of runId or projectId can be provided");
        }
        if (runId && sessionId === void 0 && !address) {
          await this._checkFeedbackSessionId();
        }
        const feedback_source = {
          type: feedbackSourceType ?? "api",
          metadata: sourceInfo ?? {}
        };
        if (sourceRunId !== void 0 && feedback_source?.metadata !== void 0 && !feedback_source.metadata["__run"]) {
          feedback_source.metadata["__run"] = { run_id: sourceRunId };
        }
        if (feedback_source?.metadata !== void 0 && feedback_source.metadata["__run"]?.run_id !== void 0) {
          assertUuid(feedback_source.metadata["__run"].run_id);
        }
        const feedback = {
          id: feedbackId ?? v7_default(),
          run_id: runId,
          trace_id: traceId,
          key,
          score: _formatFeedbackScore(score),
          value,
          correction,
          comment,
          feedback_source,
          comparative_experiment_id: comparativeExperimentId,
          feedbackConfig,
          session_id: sessionId ?? projectId,
          start_time: startTime,
          extend_trace_retention: extendTraceRetention
        };
        const samplingId = traceId ?? runId;
        if (samplingId != null && !this._shouldSample(samplingId)) {
          return feedback;
        }
        const payload = address ? { ...feedback, address: addressToLrn(address) } : feedback;
        if (runId && traceId && extendTraceRetention !== false && await this._canBatchFeedback()) {
          void this.processRunOperation({
            action: "feedback",
            item: {
              ...payload,
              // Multipart parses start_time as a timestamp string only.
              start_time: typeof startTime === "number" ? new Date(startTime).toISOString() : startTime
            }
          }).catch(console.error);
          return feedback;
        }
        await this._postFeedback(payload);
        return feedback;
      }
      async _canBatchFeedback() {
        if (!this.autoBatchTracing || this.langSmithToOTELTranslator !== void 0 || this._multipartDisabled) {
          return false;
        }
        const serverInfo = await this._ensureServerInfo();
        return serverInfo?.batch_ingest_config?.use_multipart_endpoint ?? true;
      }
      async _postFeedback(feedback, options) {
        const headers = {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        };
        if (options?.apiKey !== void 0) {
          headers["x-api-key"] = options.apiKey;
        }
        if (options?.workspaceId !== void 0) {
          headers["x-tenant-id"] = options.workspaceId;
        }
        const body = JSON.stringify(feedback);
        await this.caller.call(async () => {
          const res = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/feedback`, {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "create feedback", true);
          return res;
        });
      }
      /** Sends batched feedback one request at a time when multipart is unavailable. */
      async _postFeedbacks(feedbacks, options) {
        await Promise.all(feedbacks.map((feedback) => this._postFeedback(feedback, options)));
      }
      async updateFeedback(feedbackId, { score, value, correction, comment }) {
        const feedbackUpdate = {};
        if (score !== void 0 && score !== null) {
          feedbackUpdate["score"] = _formatFeedbackScore(score);
        }
        if (value !== void 0 && value !== null) {
          feedbackUpdate["value"] = value;
        }
        if (correction !== void 0 && correction !== null) {
          feedbackUpdate["correction"] = correction;
        }
        if (comment !== void 0 && comment !== null) {
          feedbackUpdate["comment"] = comment;
        }
        assertUuid(feedbackId);
        const body = JSON.stringify(feedbackUpdate);
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/feedback/${feedbackId}`, {
            method: "PATCH",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update feedback", true);
          return res;
        });
      }
      async readFeedback(feedbackId) {
        assertUuid(feedbackId);
        const path4 = `/feedback/${feedbackId}`;
        const response = await this._get(path4);
        return response;
      }
      async deleteFeedback(feedbackId) {
        assertUuid(feedbackId);
        const path4 = `/feedback/${feedbackId}`;
        await this.caller.call(async () => {
          const res = await this._fetch(this.apiUrl + path4, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, `delete ${path4}`, true);
          return res;
        });
      }
      async *listFeedback({ runIds, feedbackKeys, feedbackSourceTypes } = {}) {
        const queryParams = new URLSearchParams();
        if (runIds) {
          for (const runId of runIds) {
            assertUuid(runId);
            queryParams.append("run", runId);
          }
        }
        if (feedbackKeys) {
          for (const key of feedbackKeys) {
            queryParams.append("key", key);
          }
        }
        if (feedbackSourceTypes) {
          for (const type of feedbackSourceTypes) {
            queryParams.append("source", type);
          }
        }
        for await (const feedbacks of this._getPaginated("/feedback", queryParams)) {
          yield* feedbacks;
        }
      }
      /**
       * Creates a presigned feedback token and URL.
       *
       * The token can be used to authorize feedback metrics without
       * needing an API key. This is useful for giving browser-based
       * applications the ability to submit feedback without needing
       * to expose an API key.
       *
       * @param runId The ID of the run.
       * @param feedbackKey The feedback key.
       * @param options Additional options for the token.
       * @param options.expiration The expiration time for the token.
       *
       * @returns A promise that resolves to a FeedbackIngestToken.
       */
      async createPresignedFeedbackToken(runId, feedbackKey, { expiration, feedbackConfig } = {}) {
        const body = {
          run_id: runId,
          feedback_key: feedbackKey,
          feedback_config: feedbackConfig
        };
        if (expiration) {
          if (typeof expiration === "string") {
            body["expires_at"] = expiration;
          } else if (expiration?.hours || expiration?.minutes || expiration?.days) {
            body["expires_in"] = expiration;
          }
        } else {
          body["expires_in"] = {
            hours: 3
          };
        }
        const serializedBody = JSON.stringify(body);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/feedback/tokens`, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: serializedBody
          });
          await raiseForStatus(res, "create presigned feedback token");
          return res;
        });
        return await response.json();
      }
      async createComparativeExperiment({ name, experimentIds, referenceDatasetId, createdAt, description, metadata, id }) {
        if (experimentIds.length === 0) {
          throw new Error("At least one experiment is required");
        }
        if (!referenceDatasetId) {
          referenceDatasetId = (await this.readProject({
            projectId: experimentIds[0]
          })).reference_dataset_id;
        }
        if (!referenceDatasetId == null) {
          throw new Error("A reference dataset is required");
        }
        const body = {
          id,
          name,
          experiment_ids: experimentIds,
          reference_dataset_id: referenceDatasetId,
          description,
          created_at: (createdAt ?? /* @__PURE__ */ new Date())?.toISOString(),
          extra: {}
        };
        if (metadata)
          body.extra["metadata"] = metadata;
        const serializedBody = JSON.stringify(body);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/datasets/comparative`, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: serializedBody
          });
          await raiseForStatus(res, "create comparative experiment");
          return res;
        });
        return response.json();
      }
      /**
       * Retrieves a list of presigned feedback tokens for a given run ID.
       * @param runId The ID of the run.
       * @returns An async iterable of FeedbackIngestToken objects.
       */
      async *listPresignedFeedbackTokens(runId) {
        assertUuid(runId);
        const params = new URLSearchParams({ run_id: runId });
        for await (const tokens of this._getPaginated("/feedback/tokens", params)) {
          yield* tokens;
        }
      }
      _selectEvalResults(results) {
        let results_;
        if ("results" in results) {
          results_ = results.results;
        } else if (Array.isArray(results)) {
          results_ = results;
        } else {
          results_ = [results];
        }
        return results_;
      }
      async _logEvaluationFeedback(evaluatorResponse, run, sourceInfo, sessionId) {
        const evalResults = this._selectEvalResults(evaluatorResponse);
        const feedbacks = [];
        for (const res of evalResults) {
          let sourceInfo_ = sourceInfo || {};
          if (res.evaluatorInfo) {
            sourceInfo_ = { ...res.evaluatorInfo, ...sourceInfo_ };
          }
          let runId_ = null;
          if (res.targetRunId) {
            runId_ = res.targetRunId;
          } else if (run) {
            runId_ = run.id;
          }
          feedbacks.push(await this.createFeedback(runId_, res.key, {
            score: res.score,
            value: res.value,
            comment: res.comment,
            correction: res.correction,
            sourceInfo: sourceInfo_,
            sourceRunId: res.sourceRunId,
            feedbackConfig: res.feedbackConfig,
            feedbackSourceType: "model",
            sessionId: run?.session_id ?? sessionId,
            startTime: run?.start_time,
            // If an evaluator result targets a different run, we can't
            // guarantee to know its trace ID.
            traceId: runId_ === run?.id ? run?.trace_id : void 0
          }));
        }
        return [evalResults, feedbacks];
      }
      async logEvaluationFeedback(evaluatorResponseOrParams, run, sourceInfo, sessionId) {
        if (evaluatorResponseOrParams != null && typeof evaluatorResponseOrParams === "object" && "evaluatorResponse" in evaluatorResponseOrParams) {
          const [results2] = await this._logEvaluationFeedback(evaluatorResponseOrParams.evaluatorResponse, evaluatorResponseOrParams.run, evaluatorResponseOrParams.sourceInfo, evaluatorResponseOrParams.projectId);
          return results2;
        }
        const [results] = await this._logEvaluationFeedback(evaluatorResponseOrParams, run, sourceInfo, sessionId);
        return results;
      }
      /**
       * API for managing feedback configs
       */
      /**
       * Create a feedback configuration on the LangSmith API.
       *
       * This upserts: if an identical config already exists, it returns it.
       * If a conflicting config exists for the same key, a 400 error is raised.
       *
       * @param options - The options for creating a feedback config
       * @param options.feedbackKey - The unique key for this feedback config
       * @param options.feedbackConfig - The config specifying type, bounds, and categories
       * @param options.isLowerScoreBetter - Whether a lower score is better. When
       *   omitted, a key that already has configs keeps its direction, and a new
       *   key defaults to higher is better.
       * @param options.isEnforced - Create the key's enforced config, which sets
       *   the rules for the whole workspace. Requires the
       *   feedback-configs:manage-enforced permission, which workspace admins
       *   have. Fails if the key already has an enforced config.
       * @returns The created FeedbackConfigSchema object
       */
      async createFeedbackConfig(options) {
        const { feedbackKey, feedbackConfig, isLowerScoreBetter, isEnforced = false } = options;
        const body = {
          feedback_key: feedbackKey,
          feedback_config: feedbackConfig,
          is_enforced: isEnforced
        };
        if (isLowerScoreBetter !== void 0) {
          body.is_lower_score_better = isLowerScoreBetter;
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/feedback-configs`, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: JSON.stringify(body)
          });
          await raiseForStatus(res, "create feedback config");
          return res;
        });
        return response.json();
      }
      /**
       * List feedback configurations on the LangSmith API.
       * @param options - The options for listing feedback configs
       * @param options.feedbackKeys - Filter by specific feedback keys
       * @param options.nameContains - Filter by name substring
       * @param options.limit - The maximum number of configs to return
       * @returns An async iterator of FeedbackConfigSchema objects
       */
      async *listFeedbackConfigs(options = {}) {
        const { feedbackKeys, nameContains, limit: limit2 } = options;
        const params = new URLSearchParams();
        if (feedbackKeys) {
          feedbackKeys.forEach((key) => {
            params.append("key", key);
          });
        }
        if (nameContains)
          params.append("name_contains", nameContains);
        params.append("limit", (limit2 !== void 0 ? Math.min(limit2, 100) : 100).toString());
        let count = 0;
        for await (const configs of this._getPaginated("/feedback-configs", params)) {
          yield* configs;
          count += configs.length;
          if (limit2 !== void 0 && count >= limit2)
            break;
        }
      }
      /**
       * Update a feedback configuration on the LangSmith API.
       * @param feedbackKey - The key of the feedback config to update
       * @param options - The options for updating the feedback config
       * @param options.feedbackConfig - The new feedback config
       * @param options.isLowerScoreBetter - Whether a lower score is better
       * @returns The updated FeedbackConfigSchema object
       */
      async updateFeedbackConfig(feedbackKey, options = {}) {
        const { feedbackConfig, isLowerScoreBetter } = options;
        const body = { feedback_key: feedbackKey };
        if (feedbackConfig !== void 0) {
          body.feedback_config = feedbackConfig;
        }
        if (isLowerScoreBetter !== void 0) {
          body.is_lower_score_better = isLowerScoreBetter;
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/feedback-configs`, {
            method: "PATCH",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: JSON.stringify(body)
          });
          await raiseForStatus(res, "update feedback config");
          return res;
        });
        return response.json();
      }
      /**
       * Delete a feedback configuration on the LangSmith API.
       * @param feedbackKey - The key of the feedback config to delete
       */
      async deleteFeedbackConfig(feedbackKey) {
        const params = new URLSearchParams({ feedback_key: feedbackKey });
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/feedback-configs?${params}`, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "delete feedback config", true);
          return res;
        });
      }
      /**
       * API for managing annotation queues
       */
      /**
       * List the annotation queues on the LangSmith API.
       * @param options - The options for listing annotation queues
       * @param options.queueIds - The IDs of the queues to filter by
       * @param options.name - The name of the queue to filter by
       * @param options.nameContains - The substring that the queue name should contain
       * @param options.limit - The maximum number of queues to return
       * @returns An iterator of AnnotationQueue objects
       */
      async *listAnnotationQueues(options = {}) {
        const { queueIds, name, nameContains, limit: limit2 } = options;
        const params = new URLSearchParams();
        if (queueIds) {
          queueIds.forEach((id, i) => {
            assertUuid(id, `queueIds[${i}]`);
            params.append("ids", id);
          });
        }
        if (name)
          params.append("name", name);
        if (nameContains)
          params.append("name_contains", nameContains);
        params.append("limit", (limit2 !== void 0 ? Math.min(limit2, 100) : 100).toString());
        let count = 0;
        for await (const queues of this._getPaginated("/annotation-queues", params)) {
          yield* queues;
          count++;
          if (limit2 !== void 0 && count >= limit2)
            break;
        }
      }
      /**
       * Create an annotation queue on the LangSmith API.
       * @param options - The options for creating an annotation queue
       * @param options.name - The name of the annotation queue
       * @param options.description - The description of the annotation queue
       * @param options.queueId - The ID of the annotation queue
       * @returns The created AnnotationQueue object
       */
      async createAnnotationQueue(options) {
        const { name, description, queueId, rubricInstructions, rubricItems } = options;
        const body = {
          name,
          description,
          id: queueId || v4_default(),
          rubric_instructions: rubricInstructions,
          rubric_items: rubricItems
        };
        const serializedBody = JSON.stringify(Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== void 0)));
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/annotation-queues`, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: serializedBody
          });
          await raiseForStatus(res, "create annotation queue");
          return res;
        });
        return response.json();
      }
      /**
       * Read an annotation queue with the specified queue ID.
       * @param queueId - The ID of the annotation queue to read
       * @returns The AnnotationQueueWithDetails object
       */
      async readAnnotationQueue(queueId) {
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "read annotation queue");
          return res;
        });
        return response.json();
      }
      /**
       * Update an annotation queue with the specified queue ID.
       * @param queueId - The ID of the annotation queue to update
       * @param options - The options for updating the annotation queue
       * @param options.name - The new name for the annotation queue
       * @param options.description - The new description for the annotation queue
       */
      async updateAnnotationQueue(queueId, options) {
        const { name, description, rubricInstructions, rubricItems } = options;
        const bodyObj = {};
        if (name !== void 0)
          bodyObj.name = name;
        if (description !== void 0)
          bodyObj.description = description;
        if (rubricInstructions !== void 0)
          bodyObj.rubric_instructions = rubricInstructions;
        if (rubricItems !== void 0)
          bodyObj.rubric_items = rubricItems;
        const body = JSON.stringify(bodyObj);
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}`, {
            method: "PATCH",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update annotation queue", true);
          return res;
        });
      }
      /**
       * Delete an annotation queue with the specified queue ID.
       * @param queueId - The ID of the annotation queue to delete
       */
      async deleteAnnotationQueue(queueId) {
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}`, {
            method: "DELETE",
            headers: { ...this._mergedHeaders, Accept: "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "delete annotation queue", true);
          return res;
        });
      }
      /**
       * Add runs to an annotation queue with the specified queue ID.
       *
       * The second argument is either:
       * - `RunKey[]` (preferred): each entry carries the run's full lookup key, so
       *   it can be located directly without a scan. Required for workspaces served
       *   by SmithDB; routes to `POST /runs/by-key`.
       * - `string[]`: a plain list of run IDs. **Deprecated**: this path will be
       *   removed after Jan 31, 2027; prefer the key form. Routes to `POST /runs`.
       *   See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#annotation-queues-add-runs.
       *
       * If every element is a string (or the list is empty) it is treated as run
       * IDs; otherwise the list is treated as `RunKey` objects.
       *
       * @param queueId - The ID of the annotation queue
       * @param runs - Either a list of run IDs (deprecated) or a list of run keys.
       */
      async addRunsToAnnotationQueue(queueId, runs) {
        const base = `${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}/runs`;
        const allStrings = runs.every((r) => typeof r === "string");
        let url;
        let body;
        if (!allStrings) {
          url = `${base}/by-key`;
          body = JSON.stringify(runs.map((run, i) => {
            const serialized = {
              run_id: assertUuid(run.runId, `runs[${i}].runId`).toString(),
              session_id: assertUuid(run.sessionId, `runs[${i}].sessionId`).toString(),
              start_time: typeof run.startTime === "string" ? run.startTime : new Date(run.startTime).toISOString()
            };
            if (run.sourceProposedExampleId != null) {
              serialized.source_proposed_example_id = assertUuid(run.sourceProposedExampleId, `runs[${i}].sourceProposedExampleId`).toString();
            }
            return serialized;
          }));
        } else {
          warnOnce("Passing run IDs as strings to addRunsToAnnotationQueue() is deprecated and will be removed after Jan 31, 2027. Use RunKey[] instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-feedback#annotation-queues-add-runs for the migration guide.", {
            type: "DeprecationWarning",
            code: "LANGSMITH_DEPRECATED_ADD_RUNS_STRING_IDS"
          });
          url = base;
          body = JSON.stringify(runs.map((id, i) => assertUuid(id, `runs[${i}]`).toString()));
        }
        await this.caller.call(async () => {
          const res = await this._fetch(url, {
            method: "POST",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "add runs to annotation queue", true);
          return res;
        });
      }
      /**
       * Get a run from an annotation queue at the specified index.
       * @param queueId - The ID of the annotation queue
       * @param index - The index of the run to retrieve
       * @returns A Promise that resolves to a RunWithAnnotationQueueInfo object
       * @throws {Error} If the run is not found at the given index or for other API-related errors
       */
      async getRunFromAnnotationQueue(queueId, index) {
        const baseUrl = `/annotation-queues/${assertUuid(queueId, "queueId")}/run`;
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}${baseUrl}/${index}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "get run from annotation queue");
          return res;
        });
        const run = await response.json();
        return _normalizeRunTimestamps(run);
      }
      /**
       * List the runs in an annotation queue.
       * @param queueId - The ID of the annotation queue
       * @param options - The options for listing runs in the annotation queue
       * @param options.status - Filter runs by review status. If omitted, returns
       * runs across all review states.
       * @param options.limit - The maximum number of runs to return
       * @returns An iterator of RunWithAnnotationQueueInfo objects
       */
      async *listRunsFromAnnotationQueue(queueId, options = {}) {
        const { status, limit: userLimit } = options;
        const params = new URLSearchParams();
        const limit2 = userLimit !== void 0 && Number.isFinite(userLimit) ? Math.min(userLimit, 100) : 100;
        if (status)
          params.append("status", status);
        params.append("limit", limit2.toString());
        let count = 0;
        const path4 = `/annotation-queues/${assertUuid(queueId, "queueId")}/runs`;
        for await (const runs of this._getPaginated(path4, params)) {
          for (const run of runs) {
            yield _normalizeRunTimestamps(run);
            count++;
            if (count >= limit2)
              return;
          }
        }
      }
      /**
       * Delete a run from an an annotation queue.
       * @param queueId - The ID of the annotation queue to delete the run from
       * @param queueRunId - The ID of the run to delete from the annotation queue
       */
      async deleteRunFromAnnotationQueue(queueId, queueRunId) {
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}/runs/${assertUuid(queueRunId, "queueRunId")}`, {
            method: "DELETE",
            headers: { ...this._mergedHeaders, Accept: "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "delete run from annotation queue", true);
          return res;
        });
      }
      /**
       * Get the size of an annotation queue.
       * @param queueId - The ID of the annotation queue
       */
      async getSizeFromAnnotationQueue(queueId) {
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}/size`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "get size from annotation queue");
          return res;
        });
        return response.json();
      }
      async _currentTenantIsOwner(owner) {
        const settings2 = await this._getSettings();
        return owner == "-" || settings2.tenant_handle === owner;
      }
      async _ownerConflictError(action, owner) {
        const settings2 = await this._getSettings();
        return new Error(`Cannot ${action} for another tenant.

      Current tenant: ${settings2.tenant_handle}

      Requested tenant: ${owner}`);
      }
      async _getLatestCommitHash(promptOwnerAndName) {
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/commits/${promptOwnerAndName}/?limit=${1}&offset=${0}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "get latest commit hash");
          return res;
        });
        const json = await response.json();
        if (json.commits.length === 0) {
          return void 0;
        }
        return json.commits[0].commit_hash;
      }
      async _createCommitTags(promptOwnerAndName, commitId, tags) {
        const tagList = typeof tags === "string" ? [tags] : tags;
        await Promise.all(tagList.map(async (tag) => this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/repos/${promptOwnerAndName}/tags`, {
            method: "POST",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: JSON.stringify({ tag_name: tag, commit_id: commitId })
          });
          await raiseForStatus(res, "create commit tag");
          return res;
        })));
      }
      async _likeOrUnlikePrompt(promptIdentifier, like) {
        const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
        const body = JSON.stringify({ like });
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/likes/${owner}/${promptName}`, {
            method: "POST",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, `${like ? "like" : "unlike"} prompt`);
          return res;
        });
        return response.json();
      }
      async _getPromptUrl(promptIdentifier) {
        const [owner, promptName, commitHash] = parseHubIdentifier(promptIdentifier);
        if (!await this._currentTenantIsOwner(owner)) {
          if (commitHash !== "latest") {
            return `${this.getHostUrl()}/hub/${owner}/${promptName}/${commitHash.substring(0, 8)}`;
          } else {
            return `${this.getHostUrl()}/hub/${owner}/${promptName}`;
          }
        } else {
          const settings2 = await this._getSettings();
          if (commitHash !== "latest") {
            return `${this.getHostUrl()}/prompts/${promptName}/${commitHash.substring(0, 8)}?organizationId=${settings2.id}`;
          } else {
            return `${this.getHostUrl()}/prompts/${promptName}?organizationId=${settings2.id}`;
          }
        }
      }
      /**
       * Check if a prompt exists.
       * @param promptIdentifier - The identifier of the prompt. Can be in the format:
       *   - "promptName" (for private prompts, owner defaults to "-")
       *   - "owner/promptName" (for prompts with explicit owner)
       * @returns A Promise that resolves to true if the prompt exists, false otherwise
       * @example
       * ```typescript
       * // Check if a prompt exists before creating a commit
       * if (await client.promptExists("my-prompt")) {
       *   await client.createCommit("my-prompt", template);
       * } else {
       *   await client.createPrompt("my-prompt");
       * }
       * ```
       */
      async promptExists(promptIdentifier) {
        const prompt = await this.getPrompt(promptIdentifier);
        return !!prompt;
      }
      /**
       * Like a prompt.
       * @param promptIdentifier - The identifier of the prompt. Can be in the format:
       *   - "promptName" (for private prompts, owner defaults to "-")
       *   - "owner/promptName" (for prompts with explicit owner)
       * @returns A Promise that resolves to the like response containing the updated like count
       * @example
       * ```typescript
       * // Like a prompt
       * const response = await client.likePrompt("owner/useful-prompt");
       * console.log(`Prompt now has ${response.likes} likes`);
       * ```
       */
      async likePrompt(promptIdentifier) {
        return this._likeOrUnlikePrompt(promptIdentifier, true);
      }
      /**
       * Unlike a prompt (remove a previously added like).
       * @param promptIdentifier - The identifier of the prompt. Can be in the format:
       *   - "promptName" (for private prompts, owner defaults to "-")
       *   - "owner/promptName" (for prompts with explicit owner)
       * @returns A Promise that resolves to the like response containing the updated like count
       * @example
       * ```typescript
       * // Unlike a prompt
       * const response = await client.unlikePrompt("owner/useful-prompt");
       * console.log(`Prompt now has ${response.likes} likes`);
       * ```
       */
      async unlikePrompt(promptIdentifier) {
        return this._likeOrUnlikePrompt(promptIdentifier, false);
      }
      /**
       * List all commits for a prompt.
       * @param promptIdentifier - The identifier of the prompt. Can be in the format:
       *   - "promptName" (for private prompts, owner defaults to "-")
       *   - "owner/promptName" (for prompts with explicit owner)
       *   - "promptName:commitHash" (commit hash is ignored, all commits are returned)
       * @returns An async iterable iterator of PromptCommit objects
       * @example
       * ```typescript
       * // List commits for a private prompt
       * for await (const commit of client.listCommits("my-prompt")) {
       *   console.log(commit);
       * }
       *
       * // List commits for a prompt with explicit owner
       * for await (const commit of client.listCommits("owner/my-prompt")) {
       *   console.log(commit);
       * }
       * ```
       */
      async *listCommits(promptIdentifier) {
        const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
        for await (const commits of this._getPaginated(`/commits/${owner}/${promptName}/`, new URLSearchParams(), (res) => res.commits)) {
          yield* commits;
        }
      }
      /**
       * List prompts by filter.
       * @param options - Optional filters for listing prompts
       * @param options.isPublic - Filter by public/private prompts. If undefined, returns all prompts.
       * @param options.isArchived - Filter by archived status. Defaults to false (non-archived prompts only).
       * @param options.sortField - Field to sort by. Defaults to "updated_at".
       * @param options.query - Search query to filter prompts by name or description.
       * @returns An async iterable iterator of Prompt objects
       * @example
       * ```typescript
       * // List all prompts
       * for await (const prompt of client.listPrompts()) {
       *   console.log(prompt);
       * }
       *
       * // List only public prompts
       * for await (const prompt of client.listPrompts({ isPublic: true })) {
       *   console.log(prompt);
       * }
       *
       * // Search for prompts
       * for await (const prompt of client.listPrompts({ query: "translation" })) {
       *   console.log(prompt);
       * }
       * ```
       */
      async *listPrompts(options) {
        const params = new URLSearchParams();
        params.append("sort_field", options?.sortField ?? "updated_at");
        params.append("sort_direction", "desc");
        params.append("is_archived", (!!options?.isArchived).toString());
        if (options?.isPublic !== void 0) {
          params.append("is_public", options.isPublic.toString());
        }
        if (options?.query) {
          params.append("query", options.query);
        }
        for await (const prompts of this._getPaginated("/repos", params, (res) => res.repos)) {
          yield* prompts;
        }
      }
      /**
       * Get a prompt by its identifier.
       * @param promptIdentifier - The identifier of the prompt. Can be in the format:
       *   - "promptName" (for private prompts, owner defaults to "-")
       *   - "owner/promptName" (for prompts with explicit owner)
       *   - "promptName:commitHash" (commit hash is ignored, latest version is returned)
       * @returns A Promise that resolves to the Prompt object, or null if not found
       * @example
       * ```typescript
       * // Get a private prompt
       * const prompt = await client.getPrompt("my-prompt");
       *
       * // Get a public prompt
       * const publicPrompt = await client.getPrompt("owner/public-prompt");
       * ```
       */
      async getPrompt(promptIdentifier) {
        const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${promptName}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          if (res?.status === 404) {
            return null;
          }
          await raiseForStatus(res, "get prompt");
          return res;
        });
        const result = await response?.json();
        if (result?.repo) {
          return result.repo;
        } else {
          return null;
        }
      }
      /**
       * Create a new prompt.
       * @param promptIdentifier - The identifier for the new prompt. Can be in the format:
       *   - "promptName" (creates a private prompt)
       *   - "owner/promptName" (creates a prompt under a specific owner, must match your tenant)
       * @param options - Optional configuration for the prompt
       * @param options.description - A description of the prompt
       * @param options.readme - Markdown content for the prompt's README
       * @param options.tags - Array of tags to categorize the prompt
       * @param options.isPublic - Whether the prompt should be public. Requires a LangChain Hub handle.
       * @returns A Promise that resolves to the created Prompt object
       * @throws {Error} If creating a public prompt without a LangChain Hub handle, or if owner doesn't match current tenant
       * @example
       * ```typescript
       * // Create a private prompt
       * const prompt = await client.createPrompt("my-new-prompt", {
       *   description: "A prompt for translations",
       *   tags: ["translation", "language"]
       * });
       *
       * // Create a public prompt
       * const publicPrompt = await client.createPrompt("my-public-prompt", {
       *   description: "A public translation prompt",
       *   isPublic: true
       * });
       * ```
       */
      async createPrompt(promptIdentifier, options) {
        const settings2 = await this._getSettings();
        if (options?.isPublic && !settings2.tenant_handle) {
          throw new Error(`Cannot create a public prompt without first

        creating a LangChain Hub handle.
        You can add a handle by creating a public prompt at:

        https://smith.langchain.com/prompts`);
        }
        const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
        if (!await this._currentTenantIsOwner(owner)) {
          throw await this._ownerConflictError("create a prompt", owner);
        }
        const data = {
          repo_handle: promptName,
          ...options?.description && { description: options.description },
          ...options?.readme && { readme: options.readme },
          ...options?.tags && { tags: options.tags },
          is_public: !!options?.isPublic
        };
        const body = JSON.stringify(data);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/repos/`, {
            method: "POST",
            headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "create prompt");
          return res;
        });
        const { repo } = await response.json();
        return repo;
      }
      /**
       * Create a new commit for an existing prompt.
       * @param promptIdentifier - The identifier of the prompt. Can be in the format:
       *   - "promptName" (for private prompts, owner defaults to "-")
       *   - "owner/promptName" (for prompts with explicit owner)
       * @param object - The prompt object/manifest to commit (e.g., ChatPromptTemplate, messages array, etc.)
       * @param options - Optional configuration for the commit
       * @param options.parentCommitHash - The parent commit hash. Defaults to "latest" (the most recent commit).
       * @param options.tags - A tag or list of tags to apply to the commit.
       * @param options.description - A description for the commit.
       * @returns A Promise that resolves to the URL of the newly created commit
       * @throws {Error} If the prompt does not exist
       * @example
       * ```typescript
       * import { ChatPromptTemplate } from "@langchain/core/prompts";
       *
       * // Create a commit with a new version of the prompt
       * const template = ChatPromptTemplate.fromMessages([
       *   ["system", "You are a helpful assistant."],
       *   ["human", "{input}"]
       * ]);
       *
       * const commitUrl = await client.createCommit("my-prompt", template);
       * console.log(`Commit created: ${commitUrl}`);
       *
       * // Create a commit with tags
       * const commitUrl2 = await client.createCommit("my-prompt", template, {
       *   tags: ["production", "v1"]
       * });
       * ```
       */
      async createCommit(promptIdentifier, object2, options) {
        if (!await this.promptExists(promptIdentifier)) {
          throw new Error("Prompt does not exist, you must create it first.");
        }
        const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
        const resolvedParentCommitHash = options?.parentCommitHash === "latest" || !options?.parentCommitHash ? await this._getLatestCommitHash(`${owner}/${promptName}`) : options?.parentCommitHash;
        const payload = {
          manifest: JSON.parse(JSON.stringify(object2)),
          parent_commit: resolvedParentCommitHash,
          ...options?.description !== void 0 && {
            description: options.description
          }
        };
        const body = JSON.stringify(payload);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/commits/${owner}/${promptName}`, {
            method: "POST",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "create commit");
          return res;
        });
        const result = await response.json();
        const commit = result.commit ?? result;
        if (options?.tags) {
          await this._createCommitTags(`${owner}/${promptName}`, commit.id, options.tags);
        }
        return this._getPromptUrl(`${owner}/${promptName}${commit.commit_hash ? `:${commit.commit_hash}` : ""}`);
      }
      /**
       * Update examples with attachments using multipart form data.
       * @param updates List of ExampleUpdateWithAttachments objects to upsert
       * @returns Promise with the update response
       */
      async updateExamplesMultipart(datasetId, updates = []) {
        return this._updateExamplesMultipart(datasetId, updates);
      }
      async _updateExamplesMultipart(datasetId, updates = []) {
        if (!await this._getDatasetExamplesMultiPartSupport()) {
          throw new Error("Your LangSmith deployment does not allow using the multipart examples endpoint, please upgrade your deployment to the latest version.");
        }
        const formData = new FormData();
        for (const example of updates) {
          const exampleId = example.id;
          const exampleBody = {
            ...example.metadata && { metadata: example.metadata },
            ...example.split && { split: example.split }
          };
          const stringifiedExample = serialize(exampleBody, `Serializing body for example with id: ${exampleId}`);
          const exampleBlob = new Blob([stringifiedExample], {
            type: "application/json"
          });
          formData.append(exampleId, exampleBlob);
          if (example.inputs) {
            const stringifiedInputs = serialize(example.inputs, `Serializing inputs for example with id: ${exampleId}`);
            const inputsBlob = new Blob([stringifiedInputs], {
              type: "application/json"
            });
            formData.append(`${exampleId}.inputs`, inputsBlob);
          }
          if (example.outputs) {
            const stringifiedOutputs = serialize(example.outputs, `Serializing outputs whle updating example with id: ${exampleId}`);
            const outputsBlob = new Blob([stringifiedOutputs], {
              type: "application/json"
            });
            formData.append(`${exampleId}.outputs`, outputsBlob);
          }
          if (example.attachments) {
            for (const [name, attachment] of Object.entries(example.attachments)) {
              let mimeType;
              let data;
              if (Array.isArray(attachment)) {
                [mimeType, data] = attachment;
              } else {
                mimeType = attachment.mimeType;
                data = attachment.data;
              }
              const attachmentBlob = new Blob([data], {
                type: `${mimeType}; length=${data.byteLength}`
              });
              formData.append(`${exampleId}.attachment.${name}`, attachmentBlob);
            }
          }
          if (example.attachments_operations) {
            const stringifiedAttachmentsOperations = serialize(example.attachments_operations, `Serializing attachments while updating example with id: ${exampleId}`);
            const attachmentsOperationsBlob = new Blob([stringifiedAttachmentsOperations], {
              type: "application/json"
            });
            formData.append(`${exampleId}.attachments_operations`, attachmentsOperationsBlob);
          }
        }
        const datasetIdToUse = datasetId ?? updates[0]?.dataset_id;
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}${this._getPlatformEndpointPath(`datasets/${datasetIdToUse}/examples`)}`, {
            method: "PATCH",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: formData
          });
          await raiseForStatus(res, "update examples");
          return res;
        });
        return response.json();
      }
      /**
       * Upload examples with attachments using multipart form data.
       * @param uploads List of ExampleUploadWithAttachments objects to upload
       * @returns Promise with the upload response
       * @deprecated This method is deprecated and will be removed in future LangSmith versions, please use `createExamples` instead
       */
      async uploadExamplesMultipart(datasetId, uploads = []) {
        return this._uploadExamplesMultipart(datasetId, uploads);
      }
      async _uploadExamplesMultipart(datasetId, uploads = []) {
        for (const example of uploads) {
          getExampleReferenceOutputs(example);
        }
        if (!await this._getDatasetExamplesMultiPartSupport()) {
          throw new Error("Your LangSmith deployment does not allow using the multipart examples endpoint, please upgrade your deployment to the latest version.");
        }
        const formData = new FormData();
        for (const example of uploads) {
          const exampleId = (example.id ?? v4_default()).toString();
          const exampleBody = {
            created_at: example.created_at,
            ...example.metadata && { metadata: example.metadata },
            ...example.split && { split: example.split },
            ...example.source_run_id && { source_run_id: example.source_run_id },
            ...example.use_source_run_io && {
              use_source_run_io: example.use_source_run_io
            },
            ...example.use_source_run_attachments && {
              use_source_run_attachments: example.use_source_run_attachments
            }
          };
          const stringifiedExample = serialize(exampleBody, `Serializing body for uploaded example with id: ${exampleId}`);
          const exampleBlob = new Blob([stringifiedExample], {
            type: "application/json"
          });
          formData.append(exampleId, exampleBlob);
          if (example.inputs) {
            const stringifiedInputs = serialize(example.inputs, `Serializing inputs for uploaded example with id: ${exampleId}`);
            const inputsBlob = new Blob([stringifiedInputs], {
              type: "application/json"
            });
            formData.append(`${exampleId}.inputs`, inputsBlob);
          }
          const referenceOutputs = getExampleReferenceOutputs(example);
          if (referenceOutputs !== void 0) {
            const stringifiedOutputs = serialize(referenceOutputs, `Serializing outputs for uploaded example with id: ${exampleId}`);
            const outputsBlob = new Blob([stringifiedOutputs], {
              type: "application/json"
            });
            formData.append(`${exampleId}.outputs`, outputsBlob);
          }
          if (example.attachments) {
            for (const [name, attachment] of Object.entries(example.attachments)) {
              let mimeType;
              let data;
              if (Array.isArray(attachment)) {
                [mimeType, data] = attachment;
              } else {
                mimeType = attachment.mimeType;
                data = attachment.data;
              }
              const attachmentBlob = new Blob([data], {
                type: `${mimeType}; length=${data.byteLength}`
              });
              formData.append(`${exampleId}.attachment.${name}`, attachmentBlob);
            }
          }
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}${this._getPlatformEndpointPath(`datasets/${datasetId}/examples`)}`, {
            method: "POST",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: formData
          });
          await raiseForStatus(res, "upload examples");
          return res;
        });
        return response.json();
      }
      async updatePrompt(promptIdentifier, options) {
        if (!await this.promptExists(promptIdentifier)) {
          throw new Error("Prompt does not exist, you must create it first.");
        }
        const [owner, promptName] = parseHubIdentifier(promptIdentifier);
        if (!await this._currentTenantIsOwner(owner)) {
          throw await this._ownerConflictError("update a prompt", owner);
        }
        const payload = {};
        if (options?.description !== void 0)
          payload.description = options.description;
        if (options?.readme !== void 0)
          payload.readme = options.readme;
        if (options?.tags !== void 0)
          payload.tags = options.tags;
        if (options?.isPublic !== void 0)
          payload.is_public = options.isPublic;
        if (options?.isArchived !== void 0)
          payload.is_archived = options.isArchived;
        if (Object.keys(payload).length === 0) {
          throw new Error("No valid update options provided");
        }
        const body = JSON.stringify(payload);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${promptName}`, {
            method: "PATCH",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body
          });
          await raiseForStatus(res, "update prompt");
          return res;
        });
        return response.json();
      }
      async deletePrompt(promptIdentifier) {
        if (!await this.promptExists(promptIdentifier)) {
          throw new Error("Prompt does not exist, you must create it first.");
        }
        const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
        if (!await this._currentTenantIsOwner(owner)) {
          throw await this._ownerConflictError("delete a prompt", owner);
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${promptName}`, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "delete prompt");
          return res;
        });
        return response.json();
      }
      /**
       * Generate a cache key for a prompt.
       * Format: "{identifier}" or "{identifier}:with_model"
       */
      _getPromptCacheKey(promptIdentifier, includeModel) {
        const suffix = includeModel ? ":with_model" : "";
        return `${promptIdentifier}${suffix}`;
      }
      /**
       * Fetch a prompt commit directly from the API (bypassing cache).
       */
      async _fetchPromptFromApi(promptIdentifier, options) {
        const [owner, promptName, commitHash] = parseHubIdentifier(promptIdentifier);
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/commits/${owner}/${promptName}/${commitHash}${options?.includeModel ? "?include_model=true" : ""}`, {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "pull prompt commit");
          return res;
        });
        const result = await response.json();
        return {
          owner,
          repo: promptName,
          commit_hash: result.commit_hash,
          manifest: result.manifest,
          examples: result.examples,
          hub_model_config: result.model_config,
          hub_model_provider: result.model_provider
        };
      }
      /**
       * Pull a prompt commit from the LangSmith API.
       *
       * Public prompts referenced by owner/name cross a trust boundary because the
       * prompt manifest may contain serialized LangChain objects and configuration
       * that affect runtime behavior. For example, a prompt can intentionally
       * configure a model with a custom base URL, headers, model name, or other
       * constructor arguments. These are supported features, but they also mean the
       * prompt contents should be treated as executable configuration rather than
       * plain text.
       *
       * Set `dangerouslyPullPublicPrompt: true` only after reviewing and trusting
       * the prompt contents, not merely the publishing account. Prompts from your
       * own or your organization's account can still be unsafe if that account or
       * prompt was compromised.
       *
       * When pulling a trusted external prompt, prefer pinning to a specific commit
       * rather than following a mutable latest version. Using `includeModel: true`
       * increases risk and should be avoided for public prompts or prompts outside
       * your own organization.
       */
      async pullPromptCommit(promptIdentifier, options) {
        assertPullPublicPromptAllowed(promptIdentifier, options?.dangerouslyPullPublicPrompt);
        const refreshFunc = this._fetchPromptFromApi.bind(this, promptIdentifier, options);
        if (!options?.skipCache && this._promptCache) {
          const cacheKey = this._getPromptCacheKey(promptIdentifier, options?.includeModel);
          const cached = this._promptCache.get(cacheKey, refreshFunc);
          if (cached) {
            return cached;
          }
          const result = await refreshFunc();
          this._promptCache.set(cacheKey, result, refreshFunc);
          return result;
        }
        return this._fetchPromptFromApi(promptIdentifier, options);
      }
      /**
       * This method should not be used directly, use `import { pull } from "langchain/hub"` instead.
       * Using this method directly returns the JSON string of the prompt rather than a LangChain object.
       *
       * Public prompts referenced by owner/name cross a trust boundary because the
       * prompt manifest may contain serialized LangChain objects and configuration
       * that affect runtime behavior. For example, a prompt can intentionally
       * configure a model with a custom base URL, headers, model name, or other
       * constructor arguments. These are supported features, but they also mean the
       * prompt contents should be treated as executable configuration rather than
       * plain text.
       *
       * Set `dangerouslyPullPublicPrompt: true` only after reviewing and trusting
       * the prompt contents, not merely the publishing account. Prompts from your
       * own or your organization's account can still be unsafe if that account or
       * prompt was compromised.
       *
       * When pulling a trusted external prompt, prefer pinning to a specific commit
       * rather than following a mutable latest version. Using `includeModel: true`
       * increases risk and should be avoided for public prompts or prompts outside
       * your own organization.
       * @private
       */
      async _pullPrompt(promptIdentifier, options) {
        const promptObject = await this.pullPromptCommit(promptIdentifier, {
          includeModel: options?.includeModel,
          skipCache: options?.skipCache,
          dangerouslyPullPublicPrompt: options?.dangerouslyPullPublicPrompt
        });
        const prompt = JSON.stringify(promptObject.manifest);
        return prompt;
      }
      async pushPrompt(promptIdentifier, options) {
        if (await this.promptExists(promptIdentifier)) {
          if (options && ["description", "readme", "tags", "isPublic"].some((key) => options[key] !== void 0)) {
            await this.updatePrompt(promptIdentifier, {
              description: options?.description,
              readme: options?.readme,
              tags: options?.tags,
              isPublic: options?.isPublic
            });
          }
        } else {
          await this.createPrompt(promptIdentifier, {
            description: options?.description,
            readme: options?.readme,
            tags: options?.tags,
            isPublic: options?.isPublic
          });
        }
        if (!options?.object) {
          return await this._getPromptUrl(promptIdentifier);
        }
        const url = await this.createCommit(promptIdentifier, options?.object, {
          parentCommitHash: options?.parentCommitHash,
          tags: options?.commitTags,
          description: options?.commitDescription
        });
        return url;
      }
      /**
       * Check if an agent repo exists.
       */
      async agentExists(identifier) {
        const [owner, name] = parseHubIdentifier(identifier);
        return this._repoExists(owner, name);
      }
      /**
       * Check if a skill repo exists.
       */
      async skillExists(identifier) {
        const [owner, name] = parseHubIdentifier(identifier);
        return this._repoExists(owner, name);
      }
      /**
       * Pull an agent directory from Hub.
       * @param identifier The identifier (owner/name[:version]).
       * @param options.version Commit hash or tag; overrides identifier's version.
       */
      async pullAgent(identifier, options) {
        return await this._pullDirectory(identifier, "agent", options?.version);
      }
      /**
       * Pull a skill directory from Hub.
       */
      async pullSkill(identifier, options) {
        return await this._pullDirectory(identifier, "skill", options?.version);
      }
      /**
       * Push an agent to Hub. Creates the repo if missing, patches metadata if
       * provided, then commits the given files.
       * @returns The URL of the resulting commit.
       */
      async pushAgent(identifier, options) {
        return this._pushDirectory(identifier, "agent", options);
      }
      /**
       * Push a skill to Hub.
       */
      async pushSkill(identifier, options) {
        return this._pushDirectory(identifier, "skill", options);
      }
      /**
       * Delete an agent and all its owned child file repos.
       */
      async deleteAgent(identifier) {
        return this._deleteDirectory(identifier);
      }
      /**
       * Delete a skill and all its owned child file repos.
       */
      async deleteSkill(identifier) {
        return this._deleteDirectory(identifier);
      }
      /**
       * List agent repos. Yields one at a time, auto-paginating.
       */
      async *listAgents(options) {
        yield* this._listReposByType("agent", options);
      }
      /**
       * List skill repos. Yields one at a time, auto-paginating.
       */
      async *listSkills(options) {
        yield* this._listReposByType("skill", options);
      }
      async *_listReposByType(repoType, options) {
        const params = new URLSearchParams();
        params.append("repo_type", repoType);
        params.append("is_archived", (!!options?.isArchived).toString());
        if (options?.isPublic !== void 0) {
          params.append("is_public", options.isPublic.toString());
        }
        if (options?.query) {
          params.append("query", options.query);
        }
        for await (const repos of this._getPaginated("/repos", params, (res) => res.repos)) {
          yield* repos;
        }
      }
      async _pullDirectory(identifier, repoType, version) {
        const [owner, name, parsedVersion] = parseHubIdentifier(identifier);
        const resolvedVersion = version ?? (parsedVersion !== "latest" ? parsedVersion : void 0);
        const url = new URL(`${this.apiUrl}${this._getPlatformEndpointPath(`hub/repos/${owner}/${name}/directories`)}`);
        url.searchParams.set("repo_type", repoType);
        if (resolvedVersion) {
          url.searchParams.set("commit", resolvedVersion);
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(url.toString(), {
            method: "GET",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "pull directory");
          return res;
        });
        return await response.json();
      }
      async _pushDirectory(identifier, repoType, options) {
        if (options.parentCommit !== void 0 && (options.parentCommit.length < 8 || options.parentCommit.length > 64)) {
          throw new Error("parent_commit must be 8-64 characters");
        }
        const [owner, name] = parseHubIdentifier(identifier);
        if (!await this._currentTenantIsOwner(owner)) {
          throw await this._ownerConflictError(`push ${repoType}`, owner);
        }
        if (await this._repoExists(owner, name)) {
          if (options.description !== void 0 || options.readme !== void 0 || options.tags !== void 0 || options.isPublic !== void 0) {
            await this._updateRepoMetadata(owner, name, options);
          }
        } else {
          const REPO_HANDLE_PATTERN = /^[a-z][a-z0-9-_]*$/;
          if (!REPO_HANDLE_PATTERN.test(name)) {
            throw new Error(`Invalid repo_handle ${JSON.stringify(name)}: must match ${REPO_HANDLE_PATTERN}`);
          }
          await this._createRepo(name, repoType, options);
        }
        const body = { files: options.files };
        if (options.parentCommit) {
          body.parent_commit = options.parentCommit;
        }
        const response = await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}${this._getPlatformEndpointPath(`hub/repos/${owner}/${name}/directories/commits`)}`, {
            method: "POST",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: JSON.stringify(body)
          });
          await raiseForStatus(res, `push ${repoType}`);
          return res;
        });
        const data = await response.json();
        const commitHash = data.commit.commit_hash;
        const settings2 = await this._getSettings();
        const query = new URLSearchParams({ organizationId: settings2.id });
        return `${this.getHostUrl()}/context/${name}/${commitHash.slice(0, 8)}?${query.toString()}`;
      }
      async _deleteDirectory(identifier) {
        const [owner, name] = parseHubIdentifier(identifier);
        if (!await this._currentTenantIsOwner(owner)) {
          throw await this._ownerConflictError("delete", owner);
        }
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}${this._getPlatformEndpointPath(`hub/repos/${owner}/${name}/directories`)}`, {
            method: "DELETE",
            headers: this._mergedHeaders,
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions
          });
          await raiseForStatus(res, "delete directory");
          return res;
        });
      }
      async _repoExists(owner, name) {
        try {
          await this.caller.call(async () => {
            const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${name}`, {
              method: "GET",
              headers: this._mergedHeaders,
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions
            });
            await raiseForStatus(res, "check repo exists");
            return res;
          });
          return true;
        } catch (e) {
          if (isLangSmithNotFoundError(e)) {
            return false;
          }
          throw e;
        }
      }
      async _createRepo(name, repoType, options) {
        const body = {
          repo_handle: name,
          repo_type: repoType,
          is_public: !!options.isPublic
        };
        if (options.description !== void 0)
          body.description = options.description;
        if (options.readme !== void 0)
          body.readme = options.readme;
        if (options.tags !== void 0)
          body.tags = options.tags;
        try {
          await this.caller.call(async () => {
            const res = await this._fetch(`${this.apiUrl}/repos/`, {
              method: "POST",
              headers: {
                ...this._mergedHeaders,
                "Content-Type": "application/json"
              },
              signal: AbortSignal.timeout(this.timeout_ms),
              ...this.fetchOptions,
              body: JSON.stringify(body)
            });
            await raiseForStatus(res, `create ${repoType}`);
            return res;
          });
        } catch (e) {
          if (isLangSmithConflictError(e)) {
            return;
          }
          throw e;
        }
      }
      async _updateRepoMetadata(owner, name, options) {
        const body = {};
        if (options.description !== void 0)
          body.description = options.description;
        if (options.readme !== void 0)
          body.readme = options.readme;
        if (options.tags !== void 0)
          body.tags = options.tags;
        if (options.isPublic !== void 0)
          body.is_public = options.isPublic;
        if (Object.keys(body).length === 0)
          return;
        await this.caller.call(async () => {
          const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${name}`, {
            method: "PATCH",
            headers: {
              ...this._mergedHeaders,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(this.timeout_ms),
            ...this.fetchOptions,
            body: JSON.stringify(body)
          });
          await raiseForStatus(res, "update repo metadata");
          return res;
        });
      }
      /**
         * Clone a public dataset to your own langsmith tenant.
         * This operation is idempotent. If you already have a dataset with the given name,
         * this function will do nothing.
      
         * @param {string} tokenOrUrl The token of the public dataset to clone.
         * @param {Object} [options] Additional options for cloning the dataset.
         * @param {string} [options.sourceApiUrl] The URL of the langsmith server where the data is hosted. Defaults to the API URL of your current client.
         * @param {string} [options.datasetName] The name of the dataset to create in your tenant. Defaults to the name of the public dataset.
         * @returns {Promise<void>}
         */
      async clonePublicDataset(tokenOrUrl, options = {}) {
        const { sourceApiUrl = this.apiUrl, datasetName } = options;
        const [parsedApiUrl, tokenUuid] = this.parseTokenOrUrl(tokenOrUrl, sourceApiUrl);
        const sourceClient = new _Client({
          apiUrl: parsedApiUrl,
          // Placeholder API key not needed anymore in most cases, but
          // some private deployments may have API key-based rate limiting
          // that would cause this to fail if we provide no value.
          apiKey: "placeholder"
        });
        const ds = await sourceClient.readSharedDataset(tokenUuid);
        const finalDatasetName = datasetName || ds.name;
        try {
          if (await this.hasDataset({ datasetId: finalDatasetName })) {
            console.log(`Dataset ${finalDatasetName} already exists in your tenant. Skipping.`);
            return;
          }
        } catch (_) {
        }
        const examples = await sourceClient.listSharedExamples(tokenUuid);
        const dataset = await this.createDataset(finalDatasetName, {
          description: ds.description,
          dataType: ds.data_type || "kv",
          inputsSchema: ds.inputs_schema_definition ?? void 0,
          outputsSchema: ds.outputs_schema_definition ?? void 0
        });
        try {
          await this.createExamples({
            inputs: examples.map((e) => e.inputs),
            outputs: examples.flatMap((e) => e.outputs ? [e.outputs] : []),
            datasetId: dataset.id
          });
        } catch (e) {
          console.error(`An error occurred while creating dataset ${finalDatasetName}. You should delete it manually.`);
          throw e;
        }
      }
      parseTokenOrUrl(urlOrToken, apiUrl, numParts = 2, kind = "dataset") {
        try {
          assertUuid(urlOrToken);
          return [apiUrl, urlOrToken];
        } catch (_) {
        }
        try {
          const parsedUrl = new URL(urlOrToken);
          const pathParts = parsedUrl.pathname.split("/").filter((part) => part !== "");
          if (pathParts.length >= numParts) {
            const tokenUuid = pathParts[pathParts.length - numParts];
            return [apiUrl, tokenUuid];
          } else {
            throw new Error(`Invalid public ${kind} URL: ${urlOrToken}`);
          }
        } catch (_error) {
          throw new Error(`Invalid public ${kind} URL or token: ${urlOrToken}`);
        }
      }
      /**
       * Cleanup resources held by the client.
       * Stops the cache's background refresh timer.
       */
      cleanup() {
        if (this._promptCache) {
          this._promptCache.stop();
        }
      }
      /**
       * Awaits all pending trace batches. Useful for environments where
       * you need to be sure that all tracing requests finish before execution ends,
       * such as serverless environments.
       *
       * @example
       * ```
       * import { Client } from "langsmith";
       *
       * const client = new Client();
       *
       * try {
       *   // Tracing happens here
       *   ...
       * } finally {
       *   await client.awaitPendingTraceBatches();
       * }
       * ```
       *
       * @returns A promise that resolves once all currently pending traces have sent.
       */
      async awaitPendingTraceBatches() {
        if (this.manualFlushMode) {
          console.warn("[WARNING]: When tracing in manual flush mode, you must call `await client.flush()` manually to submit trace batches.");
          return Promise.resolve();
        }
        await new Promise((resolve2) => setTimeout(resolve2, 1));
        while (this._pendingDrains.size > 0) {
          await Promise.all([...this._pendingDrains]);
        }
        await Promise.all([
          ...this.autoBatchQueue.items.map(({ itemPromise }) => itemPromise),
          this.batchIngestCaller.queue.onIdle()
        ]);
        if (this.langSmithToOTELTranslator !== void 0) {
          await getDefaultOTLPTracerComponents()?.DEFAULT_LANGSMITH_SPAN_PROCESSOR?.forceFlush();
        }
      }
      /**
       * Returns a string representation of the Client instance.
       * This method is called when the object is converted to a string
       * or logged, ensuring sensitive information like API keys is not exposed.
       *
       * @returns A string representation of the Client.
       */
      toString() {
        const params = [`apiUrl=${JSON.stringify(this.apiUrl)}`];
        if (this.webUrl !== void 0) {
          params.push(`webUrl=${JSON.stringify(this.webUrl)}`);
        }
        if (this.workspaceId !== void 0) {
          params.push(`workspaceId=${JSON.stringify(this.workspaceId)}`);
        }
        return `[LangSmithClient ${params.join(" ")}]`;
      }
      /**
       * Custom inspect method for Node.js.
       * This method is called when the object is inspected in the Node.js REPL
       * or with console.log, ensuring sensitive information like API keys is not exposed.
       *
       * @returns A string representation of the Client for inspection.
       */
      [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
        return this.toString();
      }
    };
    Object.defineProperty(Client, "_fallbackDirsCreated", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/env.mjs
var isEnvTracingEnabled;
var init_env2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/env.mjs"() {
    init_env3();
    isEnvTracingEnabled = (tracingEnabled) => {
      if (tracingEnabled !== void 0) {
        return tracingEnabled;
      }
      const envVars = ["TRACING_V2", "TRACING"];
      return !!envVars.find((envVar) => getLangSmithEnvironmentVariable(envVar) === "true");
    };
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/constants.mjs
var _LC_CONTEXT_VARIABLES_KEY, _REPLICA_TRACE_ROOTS_KEY;
var init_constants2 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/constants.mjs"() {
    _LC_CONTEXT_VARIABLES_KEY = /* @__PURE__ */ Symbol.for("lc:context_variables");
    _REPLICA_TRACE_ROOTS_KEY = /* @__PURE__ */ Symbol.for("langsmith:replica_trace_roots");
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/context_vars.mjs
function getContextVar(runTree, key) {
  if (_LC_CONTEXT_VARIABLES_KEY in runTree) {
    const contextVars = runTree[_LC_CONTEXT_VARIABLES_KEY];
    return contextVars[key];
  }
  return void 0;
}
function setContextVar(runTree, key, value) {
  const contextVars = _LC_CONTEXT_VARIABLES_KEY in runTree ? (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runTree[_LC_CONTEXT_VARIABLES_KEY]
  ) : {};
  contextVars[key] = value;
  runTree[_LC_CONTEXT_VARIABLES_KEY] = contextVars;
}
var init_context_vars = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/context_vars.mjs"() {
    init_constants2();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/run_trees.mjs
function getReplicaKey(replica) {
  const sortedKeys = Object.keys(replica).sort();
  const keyData = sortedKeys.map((key) => `${key}:${replica[key] ?? ""}`).join("|");
  return v5_default(keyData, UUID_NAMESPACE_DNS);
}
function stripNonAlphanumeric(input) {
  return input.replace(/[-:.]/g, "");
}
function getMicrosecondPrecisionDatestring(epoch, executionOrder = 1) {
  const paddedOrder = executionOrder.toFixed(0).slice(0, 3).padStart(3, "0");
  return `${new Date(epoch).toISOString().slice(0, -1)}${paddedOrder}Z`;
}
function convertToDottedOrderFormat(epoch, runId, executionOrder = 1) {
  const microsecondPrecisionDatestring = getMicrosecondPrecisionDatestring(epoch, executionOrder);
  return {
    dottedOrder: stripNonAlphanumeric(microsecondPrecisionDatestring) + runId,
    microsecondPrecisionDatestring
  };
}
function addressFromHeader(value) {
  try {
    return addressFromLrn(value);
  } catch {
    console.warn("Ignoring an unusable address in a `baggage` header.");
    return void 0;
  }
}
function filterReplicaForHeaders(replica) {
  const filtered = {};
  for (const key of Object.keys(replica)) {
    if (key === "primary" && typeof replica[key] !== "boolean") {
      continue;
    }
    if (HEADER_SAFE_REPLICA_FIELDS.has(key)) {
      filtered[key] = replica[key];
    }
  }
  return filtered;
}
function getExcludeInputsOnPatch() {
  const value = getLangSmithEnvironmentVariable("EXCLUDE_INPUTS_ON_PATCH");
  return value === void 0 || value.toLowerCase() === "true" || value === "1";
}
function isRunTree(x) {
  return x != null && typeof x.createChild === "function" && typeof x.postRun === "function";
}
function isLangChainTracerLike(x) {
  return typeof x === "object" && x != null && typeof x.name === "string" && x.name === "langchain_tracer";
}
function containsLangChainTracerLike(x) {
  return Array.isArray(x) && x.some((callback) => isLangChainTracerLike(callback));
}
function isCallbackManagerLike(x) {
  return typeof x === "object" && x != null && Array.isArray(x.handlers);
}
function isRunnableConfigLike(x) {
  const callbacks = x?.callbacks;
  return x != null && typeof callbacks === "object" && // Callback manager with a langchain tracer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (containsLangChainTracerLike(callbacks?.handlers) || // Or it's an array with a LangChainTracerLike object within it
  containsLangChainTracerLike(callbacks));
}
function _getWriteReplicasFromEnv() {
  const envVar = getEnvironmentVariable("LANGSMITH_RUNS_ENDPOINTS");
  if (!envVar)
    return [];
  try {
    const parsed = JSON.parse(envVar);
    if (Array.isArray(parsed)) {
      const replicas = [];
      for (const item of parsed) {
        if (typeof item !== "object" || item === null) {
          console.warn(`Invalid item type in LANGSMITH_RUNS_ENDPOINTS: expected object, got ${typeof item}`);
          continue;
        }
        if (typeof item.api_url !== "string") {
          console.warn(`Invalid api_url type in LANGSMITH_RUNS_ENDPOINTS: expected string, got ${typeof item.api_url}`);
          continue;
        }
        if (typeof item.api_key !== "string") {
          console.warn(`Invalid api_key type in LANGSMITH_RUNS_ENDPOINTS: expected string, got ${typeof item.api_key}`);
          continue;
        }
        if (item.project_name !== void 0 && item.project_name !== null && typeof item.project_name !== "string") {
          console.warn(`Invalid project_name type in LANGSMITH_RUNS_ENDPOINTS: expected string, got ${typeof item.project_name}`);
          continue;
        }
        if (item.primary !== void 0 && typeof item.primary !== "boolean") {
          console.warn(`Invalid primary type in LANGSMITH_RUNS_ENDPOINTS: expected boolean, got ${typeof item.primary}`);
          continue;
        }
        replicas.push({
          apiUrl: item.api_url.replace(/\/$/, ""),
          apiKey: item.api_key,
          projectName: item.project_name ?? void 0,
          primary: item.primary ?? void 0
        });
      }
      return replicas;
    } else if (typeof parsed === "object" && parsed !== null) {
      _checkEndpointEnvUnset(parsed);
      const replicas = [];
      for (const [url, key] of Object.entries(parsed)) {
        const cleanUrl = url.replace(/\/$/, "");
        if (typeof key === "string") {
          replicas.push({
            apiUrl: cleanUrl,
            apiKey: key
          });
        } else {
          console.warn(`Invalid value type in LANGSMITH_RUNS_ENDPOINTS for URL ${url}: expected string, got ${typeof key}`);
          continue;
        }
      }
      return replicas;
    } else {
      console.warn(`Invalid LANGSMITH_RUNS_ENDPOINTS \u2013 must be valid JSON array of objects with api_url and api_key properties, or object mapping url->apiKey, got ${typeof parsed}`);
      return [];
    }
  } catch (e) {
    if (isConflictingEndpointsError(e)) {
      throw e;
    }
    console.warn("Invalid LANGSMITH_RUNS_ENDPOINTS \u2013 must be valid JSON array of objects with api_url and api_key properties, or object mapping url->apiKey");
    return [];
  }
}
function _ensureWriteReplicas(replicas) {
  const ensured = replicas ? replicas.map((replica) => {
    if (Array.isArray(replica)) {
      return {
        projectName: replica[0],
        updates: replica[1]
      };
    }
    const address = ensureAgent(replica.address);
    return address ? { ...replica, address } : replica;
  }) : _getWriteReplicasFromEnv();
  if (ensured.filter((replica) => replica.primary === true).length > 1) {
    throw new Error("Only one replica can be marked as primary.");
  }
  return ensured;
}
function _checkEndpointEnvUnset(parsed) {
  if (Object.keys(parsed).length > 0 && getLangSmithEnvironmentVariable("ENDPOINT")) {
    throw new ConflictingEndpointsError();
  }
}
var TIMESTAMP_LENGTH, UUID_NAMESPACE_DNS, HEADER_SAFE_REPLICA_FIELDS, Baggage, RunTree;
var init_run_trees = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/run_trees.mjs"() {
    init_address();
    init_client2();
    init_env2();
    init_error2();
    init_constants2();
    init_context_vars();
    init_env3();
    init_env3();
    init_warn();
    init_uuid2();
    init_src();
    init_addressing();
    init_address();
    TIMESTAMP_LENGTH = 36;
    UUID_NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    HEADER_SAFE_REPLICA_FIELDS = /* @__PURE__ */ new Set([
      "projectName",
      "primary",
      "updates",
      "reroot",
      "address"
    ]);
    Baggage = class _Baggage {
      constructor(metadata, tags, project_name, replicas, address) {
        Object.defineProperty(this, "metadata", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "tags", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "project_name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "replicas", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "address", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.metadata = metadata;
        this.tags = tags;
        this.project_name = project_name;
        this.replicas = replicas;
        this.address = address;
      }
      static fromHeader(value) {
        const items = value.split(",");
        let metadata = {};
        let tags = [];
        let project_name;
        let replicas;
        let address;
        for (const item of items) {
          const [key, uriValue] = item.split("=");
          const value2 = decodeURIComponent(uriValue);
          if (key === "langsmith-metadata") {
            metadata = JSON.parse(value2);
          } else if (key === "langsmith-tags") {
            tags = value2.split(",");
          } else if (key === "langsmith-project") {
            project_name = value2;
          } else if (key === "langsmith-address") {
            address = addressFromHeader(value2);
          } else if (key === "langsmith-replicas") {
            const parsed = JSON.parse(value2);
            replicas = parsed.flatMap((replica) => {
              if (Array.isArray(replica)) {
                return [replica];
              }
              const filtered = filterReplicaForHeaders(replica);
              const raw = filtered.address;
              delete filtered.address;
              if (filtered.projectName || raw == null) {
                return [filtered];
              }
              const replicaAddress = addressFromHeader(raw);
              return replicaAddress ? [{ ...filtered, address: replicaAddress }] : [];
            });
          }
        }
        return new _Baggage(metadata, tags, project_name, replicas, address);
      }
      toHeader() {
        const items = [];
        if (this.metadata && Object.keys(this.metadata).length > 0) {
          items.push(`langsmith-metadata=${encodeURIComponent(JSON.stringify(this.metadata))}`);
        }
        if (this.tags && this.tags.length > 0) {
          items.push(`langsmith-tags=${encodeURIComponent(this.tags.join(","))}`);
        }
        if (this.project_name) {
          items.push(`langsmith-project=${encodeURIComponent(this.project_name)}`);
        }
        if (this.address) {
          items.push(`langsmith-address=${encodeURIComponent(addressToLrn(this.address))}`);
        }
        return items.join(",");
      }
    };
    RunTree = class _RunTree {
      constructor(originalConfig) {
        Object.defineProperty(this, "id", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "run_type", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "project_name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "address", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "parent_run", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "parent_run_id", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "child_runs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "start_time", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "end_time", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "extra", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "tags", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "error", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "serialized", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "inputs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "outputs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "reference_example_id", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "client", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "events", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "trace_id", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "dotted_order", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "tracingEnabled", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "execution_order", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "child_execution_order", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "attachments", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "replicas", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "distributedParentId", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_serialized_start_time", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "_awaitInputsOnPost", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        if (isRunTree(originalConfig)) {
          Object.assign(this, { ...originalConfig });
          return;
        }
        const defaultConfig = _RunTree.getDefaultConfig();
        const { metadata, ...config } = originalConfig;
        const client = config.client ?? _RunTree.getSharedClient();
        const dedupedMetadata = {
          ...metadata,
          ...config?.extra?.metadata
        };
        config.extra = { ...config.extra, metadata: dedupedMetadata };
        if ("id" in config && config.id == null) {
          delete config.id;
        }
        Object.assign(this, { ...defaultConfig, ...config, client });
        this._resolveAddressing(config);
        this.execution_order ?? (this.execution_order = 1);
        this.child_execution_order ?? (this.child_execution_order = 1);
        if (!this.dotted_order) {
          this._serialized_start_time = getMicrosecondPrecisionDatestring(this.start_time, this.execution_order);
        }
        if (!this.id) {
          this.id = uuid7FromTime(this._serialized_start_time ?? this.start_time);
        }
        if (!this.trace_id) {
          if (this.parent_run) {
            this.trace_id = this.parent_run.trace_id ?? this.id;
          } else {
            this.trace_id = this.id;
          }
        }
        this.replicas = _ensureWriteReplicas(this.replicas);
        if (!this.dotted_order) {
          const { dottedOrder } = convertToDottedOrderFormat(this.start_time, this.id, this.execution_order);
          if (this.parent_run) {
            this.dotted_order = this.parent_run.dotted_order + "." + dottedOrder;
          } else {
            this.dotted_order = dottedOrder;
          }
        }
      }
      /** Falls back to the env; a bad env leaves the run untraced. */
      _resolveAddressing(config) {
        const address = ensureAgent(config.address);
        const project = config.project_name || void 0;
        rejectConflicting(project, address);
        if (project || address) {
          this.project_name = project;
          this.address = address;
          return;
        }
        try {
          [this.project_name, this.address] = resolveFromEnv();
        } catch (e) {
          if (!(e instanceof EnvAddressError)) {
            throw e;
          }
          if (isEnvTracingEnabled(this.tracingEnabled)) {
            logUntraced(e);
          }
          this.project_name = void 0;
          this.address = void 0;
          this.tracingEnabled = false;
        }
      }
      set metadata(metadata) {
        this.extra = {
          ...this.extra,
          metadata: {
            ...this.extra?.metadata,
            ...metadata
          }
        };
      }
      get metadata() {
        return this.extra?.metadata;
      }
      static getDefaultConfig() {
        const start_time = Date.now();
        return {
          run_type: "chain",
          child_runs: [],
          api_url: getEnvironmentVariable("LANGCHAIN_ENDPOINT") ?? "http://localhost:1984",
          api_key: getEnvironmentVariable("LANGCHAIN_API_KEY"),
          caller_options: {},
          start_time,
          serialized: {},
          inputs: {},
          extra: {}
        };
      }
      static getSharedClient() {
        if (!_RunTree.sharedClient) {
          _RunTree.sharedClient = new Client();
        }
        return _RunTree.sharedClient;
      }
      createChild(config) {
        const child_execution_order = this.child_execution_order + 1;
        const inheritedReplicas = this.replicas?.map((replica) => {
          const { reroot, ...rest } = replica;
          return rest;
        });
        const childReplicas = config.replicas ?? inheritedReplicas;
        const child = new _RunTree({
          ...config,
          parent_run: this,
          project_name: this.project_name,
          address: this.address,
          replicas: childReplicas,
          client: this.client,
          tracingEnabled: this.tracingEnabled,
          execution_order: child_execution_order,
          child_execution_order
        });
        const parentMeta = this.extra?.metadata ?? {};
        const childMeta = child.extra?.metadata ?? {};
        if (Object.keys(parentMeta).length > 0) {
          child.extra = {
            ...child.extra,
            metadata: { ...parentMeta, ...childMeta }
          };
        }
        if (_LC_CONTEXT_VARIABLES_KEY in this) {
          child[_LC_CONTEXT_VARIABLES_KEY] = this[_LC_CONTEXT_VARIABLES_KEY];
        }
        const LC_CHILD = /* @__PURE__ */ Symbol.for("lc:child_config");
        const presentConfig = config.extra?.[LC_CHILD] ?? this.extra[LC_CHILD];
        if (isRunnableConfigLike(presentConfig)) {
          const newConfig = { ...presentConfig };
          const callbacks = isCallbackManagerLike(newConfig.callbacks) ? newConfig.callbacks.copy?.() : void 0;
          if (callbacks) {
            Object.assign(callbacks, { _parentRunId: child.id });
            callbacks.handlers?.find(isLangChainTracerLike)?.updateFromRunTree?.(child);
            newConfig.callbacks = callbacks;
          }
          child.extra[LC_CHILD] = newConfig;
        }
        const visited = /* @__PURE__ */ new Set();
        let current = this;
        while (current != null && !visited.has(current.id)) {
          visited.add(current.id);
          current.child_execution_order = Math.max(current.child_execution_order, child_execution_order);
          current = current.parent_run;
        }
        this.child_runs.push(child);
        return child;
      }
      async end(outputs, error, endTime = Date.now(), metadata) {
        this.outputs = this.outputs ?? outputs;
        this.error = this.error ?? error;
        this.end_time = this.end_time ?? endTime;
        if (metadata && Object.keys(metadata).length > 0) {
          this.extra = this.extra ? { ...this.extra, metadata: { ...this.extra.metadata, ...metadata } } : { metadata };
        }
      }
      _convertToCreate(run, runtimeEnv, excludeChildRuns = true) {
        const runExtra = run.extra ?? {};
        if (runExtra?.runtime?.library === void 0) {
          if (!runExtra.runtime) {
            runExtra.runtime = {};
          }
          if (runtimeEnv) {
            for (const [k, v] of Object.entries(runtimeEnv)) {
              if (!runExtra.runtime[k]) {
                runExtra.runtime[k] = v;
              }
            }
          }
        }
        const parent_run_id = run.parent_run?.id ?? run.parent_run_id;
        let child_runs;
        if (!excludeChildRuns) {
          child_runs = run.child_runs.map((child_run) => this._convertToCreate(child_run, runtimeEnv, excludeChildRuns));
        } else {
          child_runs = [];
        }
        return {
          id: run.id,
          name: run.name,
          start_time: run._serialized_start_time ?? run.start_time,
          end_time: run.end_time,
          run_type: run.run_type,
          reference_example_id: run.reference_example_id,
          extra: runExtra,
          serialized: run.serialized,
          error: run.error,
          inputs: run.inputs,
          outputs: run.outputs,
          session_name: run.project_name,
          address: run.address,
          child_runs,
          parent_run_id,
          trace_id: run.trace_id,
          dotted_order: run.dotted_order,
          tags: run.tags,
          attachments: run.attachments,
          events: run.events
        };
      }
      _sliceParentId(parentId, run) {
        if (run.dotted_order) {
          const segs = run.dotted_order.split(".");
          let startIdx = null;
          for (let idx = 0; idx < segs.length; idx++) {
            const segId = segs[idx].slice(-TIMESTAMP_LENGTH);
            if (segId === parentId) {
              startIdx = idx;
              break;
            }
          }
          if (startIdx !== null) {
            const trimmedSegs = segs.slice(startIdx + 1);
            run.dotted_order = trimmedSegs.join(".");
            if (trimmedSegs.length > 0) {
              run.trace_id = trimmedSegs[0].slice(-TIMESTAMP_LENGTH);
            } else {
              run.trace_id = run.id;
            }
          }
        }
        if (run.parent_run_id === parentId) {
          run.parent_run_id = void 0;
        }
      }
      _setReplicaTraceRoot(replicaKey, traceRootId) {
        const replicaTraceRoots = getContextVar(this, _REPLICA_TRACE_ROOTS_KEY) ?? {};
        replicaTraceRoots[replicaKey] = traceRootId;
        setContextVar(this, _REPLICA_TRACE_ROOTS_KEY, replicaTraceRoots);
        for (const child of this.child_runs) {
          child._setReplicaTraceRoot(replicaKey, traceRootId);
        }
      }
      /** A replica naming neither inherits the run tree's destination. */
      _replicaAddressing(replica) {
        const address = ensureAgent(replica.address);
        if (replica.projectName != null) {
          rejectConflicting(replica.projectName, address);
          return [replica.projectName, void 0];
        }
        if (address) {
          return [void 0, address];
        }
        return [this.project_name, this.address];
      }
      _remapForProject(params) {
        const { projectName, address, primary, runtimeEnv, excludeChildRuns = true, reroot = false, distributedParentId, apiUrl, apiKey, workspaceId } = params;
        const baseRun = this._convertToCreate(this, runtimeEnv, excludeChildRuns);
        if (primary === void 0 && !this.replicas?.some((r) => r.primary === true) && projectName === this.project_name && (address ? addressToLrn(address) : void 0) === (this.address ? addressToLrn(this.address) : void 0)) {
          return {
            ...baseRun,
            session_name: projectName,
            address
          };
        }
        const seed = projectName ?? (address ? addressToLrn(address) : void 0) ?? "agent//";
        if (reroot) {
          if (distributedParentId) {
            this._sliceParentId(distributedParentId, baseRun);
          } else {
            baseRun.parent_run_id = void 0;
            if (baseRun.dotted_order) {
              const segs = baseRun.dotted_order.split(".");
              if (segs.length > 0) {
                baseRun.dotted_order = segs[segs.length - 1];
                baseRun.trace_id = baseRun.id;
              }
            }
          }
          const replicaKey = getReplicaKey({
            projectName: seed,
            apiUrl,
            apiKey,
            workspaceId
          });
          this._setReplicaTraceRoot(replicaKey, baseRun.id);
        }
        let ancestorRerootedTraceId;
        if (!reroot) {
          const replicaTraceRoots = getContextVar(this, _REPLICA_TRACE_ROOTS_KEY) ?? {};
          const replicaKey = getReplicaKey({
            projectName: seed,
            apiUrl,
            apiKey,
            workspaceId
          });
          ancestorRerootedTraceId = replicaTraceRoots[replicaKey];
          if (ancestorRerootedTraceId) {
            baseRun.trace_id = ancestorRerootedTraceId;
            if (baseRun.dotted_order) {
              const segs = baseRun.dotted_order.split(".");
              let rootIdx = null;
              for (let idx = 0; idx < segs.length; idx++) {
                const segId = segs[idx].slice(-TIMESTAMP_LENGTH);
                if (segId === ancestorRerootedTraceId) {
                  rootIdx = idx;
                  break;
                }
              }
              if (rootIdx !== null) {
                const trimmedSegs = segs.slice(rootIdx);
                baseRun.dotted_order = trimmedSegs.join(".");
              }
            }
          }
        }
        if (primary) {
          return {
            ...baseRun,
            session_name: projectName,
            address
          };
        }
        const oldId = baseRun.id;
        const newId = nonCryptographicUuid7Deterministic(oldId, seed);
        let newTraceId;
        if (baseRun.trace_id) {
          newTraceId = nonCryptographicUuid7Deterministic(baseRun.trace_id, seed);
        } else {
          newTraceId = newId;
        }
        let newParentId;
        if (baseRun.parent_run_id) {
          newParentId = nonCryptographicUuid7Deterministic(baseRun.parent_run_id, seed);
        }
        let newDottedOrder;
        if (baseRun.dotted_order) {
          const segs = baseRun.dotted_order.split(".");
          const remappedSegs = segs.map((seg) => {
            const segId = seg.slice(-TIMESTAMP_LENGTH);
            const remappedId = nonCryptographicUuid7Deterministic(segId, seed);
            return seg.slice(0, -TIMESTAMP_LENGTH) + remappedId;
          });
          newDottedOrder = remappedSegs.join(".");
        }
        return {
          ...baseRun,
          id: newId,
          trace_id: newTraceId,
          parent_run_id: newParentId,
          dotted_order: newDottedOrder,
          session_name: projectName,
          address
        };
      }
      async postRun(excludeChildRuns = true) {
        if (this._awaitInputsOnPost) {
          this.inputs = await this.inputs;
        }
        try {
          const runtimeEnv = getRuntimeEnvironment();
          if (this.replicas && this.replicas.length > 0) {
            for (const replica of this.replicas) {
              const { primary, apiKey, apiUrl, workspaceId, reroot, client: replicaClient } = replica;
              const [projectName, address] = this._replicaAddressing(replica);
              const runCreate = this._remapForProject({
                projectName,
                address,
                primary,
                runtimeEnv,
                excludeChildRuns: true,
                reroot,
                distributedParentId: this.distributedParentId,
                apiUrl,
                apiKey,
                workspaceId
              });
              const targetClient = replicaClient ?? this.client;
              await targetClient.createRun(runCreate, {
                apiKey,
                apiUrl,
                workspaceId
              });
            }
          } else {
            const runCreate = this._convertToCreate(this, runtimeEnv, excludeChildRuns);
            await this.client.createRun(runCreate);
          }
          if (!excludeChildRuns) {
            warnOnce("Posting with excludeChildRuns=false is deprecated and will be removed in a future version.");
            for (const childRun of this.child_runs) {
              await childRun.postRun(false);
            }
          }
          this.child_runs = [];
        } catch (error) {
          console.error(`Error in postRun for run ${this.id}:`, error);
        }
      }
      /**
       * Patch the run tree to the API.
       *
       * @param options.excludeInputs - Whether to exclude inputs from the patch
       * request. Defaults to the value of `LANGSMITH_EXCLUDE_INPUTS_ON_PATCH`
       * (or its `LANGCHAIN_` equivalent), which itself defaults to `true`.
       * An explicit value overrides the environment variable for this call.
       *
       * Unless the environment variable is disabled, inputs added after the
       * initial `postRun()` are not persisted unless this option is explicitly set
       * to `false`.
       */
      async patchRun(options) {
        const excludeInputs = options?.excludeInputs ?? getExcludeInputsOnPatch();
        if (this.replicas && this.replicas.length > 0) {
          for (const replica of this.replicas) {
            const { primary, apiKey, apiUrl, workspaceId, updates, reroot, client: replicaClient } = replica;
            const [projectName, address] = this._replicaAddressing(replica);
            const runData = this._remapForProject({
              projectName,
              address,
              primary,
              runtimeEnv: void 0,
              excludeChildRuns: true,
              reroot,
              distributedParentId: this.distributedParentId,
              apiUrl,
              apiKey,
              workspaceId
            });
            const updatePayload = {
              id: runData.id,
              name: runData.name,
              run_type: runData.run_type,
              start_time: runData.start_time,
              outputs: runData.outputs,
              error: runData.error,
              parent_run_id: runData.parent_run_id,
              session_name: runData.session_name,
              address: runData.address,
              reference_example_id: runData.reference_example_id,
              end_time: runData.end_time,
              dotted_order: runData.dotted_order,
              trace_id: runData.trace_id,
              events: runData.events,
              tags: runData.tags,
              extra: runData.extra,
              attachments: this.attachments,
              ...updates
            };
            if (!excludeInputs) {
              updatePayload.inputs = runData.inputs;
            }
            const targetClient = replicaClient ?? this.client;
            await targetClient.updateRun(runData.id, updatePayload, {
              apiKey,
              apiUrl,
              workspaceId
            });
          }
        } else {
          try {
            const runUpdate = {
              name: this.name,
              run_type: this.run_type,
              start_time: this._serialized_start_time ?? this.start_time,
              end_time: this.end_time,
              error: this.error,
              outputs: this.outputs,
              parent_run_id: this.parent_run?.id ?? this.parent_run_id,
              reference_example_id: this.reference_example_id,
              extra: this.extra,
              events: this.events,
              dotted_order: this.dotted_order,
              trace_id: this.trace_id,
              tags: this.tags,
              attachments: this.attachments,
              session_name: this.project_name,
              address: this.address
            };
            if (!excludeInputs) {
              runUpdate.inputs = this.inputs;
            }
            await this.client.updateRun(this.id, runUpdate);
          } catch (error) {
            console.error(`Error in patchRun for run ${this.id}`, error);
          }
        }
        this.child_runs = [];
      }
      toJSON() {
        return this._convertToCreate(this, void 0, false);
      }
      /**
       * Add an event to the run tree.
       * @param event - A single event or string to add
       */
      addEvent(event) {
        if (!this.events) {
          this.events = [];
        }
        if (typeof event === "string") {
          this.events.push({
            name: "event",
            time: (/* @__PURE__ */ new Date()).toISOString(),
            message: event
          });
        } else {
          this.events.push({
            ...event,
            time: event.time ?? (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      static fromRunnableConfig(parentConfig, props) {
        const callbackManager = parentConfig?.callbacks;
        let parentRun;
        let projectName;
        let client;
        let tracingEnabled = isEnvTracingEnabled();
        if (callbackManager) {
          const parentRunId = callbackManager?.getParentRunId?.() ?? "";
          const langChainTracer = callbackManager?.handlers?.find((handler) => handler?.name == "langchain_tracer");
          parentRun = langChainTracer?.getRun?.(parentRunId);
          projectName = langChainTracer?.projectName;
          client = langChainTracer?.client;
          tracingEnabled = tracingEnabled || !!langChainTracer;
        }
        if (!parentRun) {
          return new _RunTree({
            ...props,
            client,
            tracingEnabled,
            project_name: props.address ? void 0 : projectName
          });
        }
        const parentRunTree = new _RunTree({
          name: parentRun.name,
          id: parentRun.id,
          trace_id: parentRun.trace_id,
          dotted_order: parentRun.dotted_order,
          client,
          tracingEnabled,
          project_name: projectName,
          tags: [
            ...new Set((parentRun?.tags ?? []).concat(parentConfig?.tags ?? []))
          ],
          extra: {
            metadata: {
              ...parentRun?.extra?.metadata,
              ...parentConfig?.metadata
            }
          }
        });
        return parentRunTree.createChild(props);
      }
      static fromDottedOrder(dottedOrder) {
        return this.fromHeaders({ "langsmith-trace": dottedOrder });
      }
      static fromHeaders(headers, inheritArgs) {
        const rawHeaders = "get" in headers && typeof headers.get === "function" ? {
          "langsmith-trace": headers.get("langsmith-trace"),
          baggage: headers.get("baggage")
        } : headers;
        const headerTrace = rawHeaders["langsmith-trace"];
        if (!headerTrace || typeof headerTrace !== "string")
          return void 0;
        const parentDottedOrder = headerTrace.trim();
        const parsedDottedOrder = parentDottedOrder.split(".").map((part) => {
          const [strTime, uuid] = part.split("Z");
          return { strTime, time: Date.parse(strTime + "Z"), uuid };
        });
        const traceId = parsedDottedOrder[0].uuid;
        const config = {
          ...inheritArgs,
          name: inheritArgs?.["name"] ?? "parent",
          run_type: inheritArgs?.["run_type"] ?? "chain",
          start_time: inheritArgs?.["start_time"] ?? Date.now(),
          id: parsedDottedOrder.at(-1)?.uuid,
          trace_id: traceId,
          dotted_order: parentDottedOrder
        };
        if (rawHeaders["baggage"] && typeof rawHeaders["baggage"] === "string") {
          const baggage = Baggage.fromHeader(rawHeaders["baggage"]);
          config.metadata = baggage.metadata;
          config.tags = baggage.tags;
          if (baggage.project_name && baggage.address) {
            console.warn("Ignoring a `baggage` header that names both a project and an address.");
            return void 0;
          }
          if (baggage.project_name) {
            config.project_name = baggage.project_name;
            delete config.address;
          } else if (baggage.address) {
            config.address = baggage.address;
            delete config.project_name;
          }
          config.replicas = baggage.replicas;
        }
        const runTree = new _RunTree(config);
        runTree.distributedParentId = runTree.id;
        return runTree;
      }
      toHeaders(headers) {
        const result = {
          "langsmith-trace": this.dotted_order,
          baggage: new Baggage(this.extra?.metadata, this.tags, this.project_name, this.replicas, this.address).toHeader()
        };
        if (headers) {
          for (const [key, value] of Object.entries(result)) {
            headers.set(key, value);
          }
        }
        return result;
      }
    };
    Object.defineProperty(RunTree, "sharedClient", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/project.mjs
var init_project = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/project.mjs"() {
    init_env3();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/uuid.mjs
var init_uuid3 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/uuid.mjs"() {
    init_src();
    init_uuid2();
    init_uuid2();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/traceable.mjs
var MockAsyncLocalStorage, TRACING_ALS_KEY, mockAsyncLocalStorage, AsyncLocalStorageProvider, AsyncLocalStorageProviderSingleton;
var init_traceable = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/singletons/traceable.mjs"() {
    MockAsyncLocalStorage = class {
      getStore() {
        return void 0;
      }
      run(_, callback) {
        return callback();
      }
    };
    TRACING_ALS_KEY = /* @__PURE__ */ Symbol.for("ls:tracing_async_local_storage");
    mockAsyncLocalStorage = new MockAsyncLocalStorage();
    AsyncLocalStorageProvider = class {
      getInstance() {
        return globalThis[TRACING_ALS_KEY] ?? mockAsyncLocalStorage;
      }
      initializeGlobalInstance(instance) {
        if (globalThis[TRACING_ALS_KEY] === void 0) {
          globalThis[TRACING_ALS_KEY] = instance;
        }
      }
    };
    AsyncLocalStorageProviderSingleton = new AsyncLocalStorageProvider();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/guard.mjs
var init_guard = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/guard.mjs"() {
    init_env2();
    init_traceable();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/index.mjs
var init_lib = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/index.mjs"() {
    init_client2();
    init_run_trees();
    init_address();
    init_fetch();
    init_project();
    init_uuid3();
    init_guard();
    init_prompt_cache();
    init_error();
    init_version2();
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/env.mjs
function getRuntimeEnvironment() {
  if (runtimeEnvironment === void 0) {
    const env = getEnv();
    const releaseEnv = getShas();
    runtimeEnvironment = {
      library: "langsmith",
      runtime: env,
      sdk: "langsmith-js",
      sdk_version: VERSION,
      ...releaseEnv
    };
  }
  return runtimeEnvironment;
}
function isSensitiveEnvVarName(key) {
  const lowered = key.toLowerCase();
  return EXCLUDED_SUBSTRINGS.some((sub) => lowered.includes(sub));
}
function getLangSmithEnvVarsMetadata() {
  const allEnvVars = getLangSmithEnvironmentVariables();
  const envVars = {};
  const excluded = [
    "LANGCHAIN_API_KEY",
    "LANGCHAIN_ENDPOINT",
    "LANGCHAIN_TRACING_V2",
    "LANGCHAIN_PROJECT",
    "LANGCHAIN_SESSION",
    "LANGSMITH_API_KEY",
    "LANGSMITH_ENDPOINT",
    "LANGSMITH_TRACING_V2",
    "LANGSMITH_CONFIG_FILE",
    "LANGSMITH_PROJECT",
    "LANGSMITH_SESSION",
    "LANGSMITH_AGENT_ID",
    "LANGSMITH_AGENT_ENVIRONMENT"
  ];
  for (const [key, value] of Object.entries(allEnvVars)) {
    if (typeof value === "string" && !excluded.includes(key) && !isSensitiveEnvVarName(key)) {
      if (key !== "LANGSMITH_REVISION_ID" && key !== "LANGCHAIN_REVISION_ID") {
        envVars[key] = value;
      }
    }
  }
  const revisionId = allEnvVars.LANGSMITH_REVISION_ID || allEnvVars.LANGCHAIN_REVISION_ID;
  if (revisionId) {
    envVars["revision_id"] = revisionId;
  }
  return envVars;
}
function getLangSmithEnvironmentVariables() {
  const envVars = {};
  try {
    if (typeof process !== "undefined" && process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if ((key.startsWith("LANGCHAIN_") || key.startsWith("LANGSMITH_")) && value != null) {
          if (isSensitiveEnvVarName(key) && typeof value === "string") {
            envVars[key] = value.slice(0, 2) + "*".repeat(value.length - 4) + value.slice(-2);
          } else {
            envVars[key] = value;
          }
        }
      }
    }
  } catch (_e) {
  }
  return envVars;
}
function getEnvironmentVariable(name) {
  try {
    return typeof process !== "undefined" ? (
      // eslint-disable-next-line no-process-env
      process.env?.[name]
    ) : void 0;
  } catch (_e) {
    return void 0;
  }
}
function getLangSmithEnvironmentVariable(name) {
  return getEnvironmentVariable(`LANGSMITH_${name}`) || getEnvironmentVariable(`LANGCHAIN_${name}`);
}
function getShas() {
  if (cachedCommitSHAs !== void 0) {
    return cachedCommitSHAs;
  }
  const common_release_envs = [
    "VERCEL_GIT_COMMIT_SHA",
    "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA",
    "COMMIT_REF",
    "RENDER_GIT_COMMIT",
    "CI_COMMIT_SHA",
    "CIRCLE_SHA1",
    "CF_PAGES_COMMIT_SHA",
    "REACT_APP_GIT_SHA",
    "SOURCE_VERSION",
    "GITHUB_SHA",
    "TRAVIS_COMMIT",
    "GIT_COMMIT",
    "BUILD_VCS_NUMBER",
    "bamboo_planRepository_revision",
    "Build.SourceVersion",
    "BITBUCKET_COMMIT",
    "DRONE_COMMIT_SHA",
    "SEMAPHORE_GIT_SHA",
    "BUILDKITE_COMMIT"
  ];
  const shas = {};
  for (const env of common_release_envs) {
    const envVar = getEnvironmentVariable(env);
    if (envVar !== void 0) {
      shas[env] = envVar;
    }
  }
  cachedCommitSHAs = shas;
  return shas;
}
function getOtelEnabled() {
  return getEnvironmentVariable("OTEL_ENABLED") === "true" || getLangSmithEnvironmentVariable("OTEL_ENABLED") === "true";
}
function resolveTracingMode(configValue) {
  if (configValue !== void 0) {
    return configValue;
  }
  const envMode = getLangSmithEnvironmentVariable("TRACING_MODE");
  if (envMode !== void 0 && envMode !== "") {
    const lower = envMode.toLowerCase();
    if (!_VALID_TRACING_MODES.has(lower)) {
      throw new Error(`Invalid LANGSMITH_TRACING_MODE=${JSON.stringify(envMode)}. Must be one of: ${[..._VALID_TRACING_MODES].sort().join(", ")}`);
    }
    if (getOtelEnabled()) {
      console.warn("Both LANGSMITH_TRACING_MODE and the legacy OTEL_ENABLED / LANGSMITH_OTEL_ENABLED env vars are set. LANGSMITH_TRACING_MODE takes precedence.");
    }
    return lower;
  }
  if (getOtelEnabled()) {
    return "otel";
  }
  return "langsmith";
}
var globalEnv, isBrowser, isWebWorker, isJsDom, isDeno, isNode, getEnv, runtimeEnvironment, EXCLUDED_SUBSTRINGS, cachedCommitSHAs, _VALID_TRACING_MODES;
var init_env3 = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/env.mjs"() {
    init_lib();
    isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
    isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
    isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");
    isDeno = () => typeof globalThis.Deno !== "undefined";
    isNode = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno();
    getEnv = () => {
      if (globalEnv) {
        return globalEnv;
      }
      if (typeof Bun !== "undefined") {
        globalEnv = "bun";
      } else if (isBrowser()) {
        globalEnv = "browser";
      } else if (isNode()) {
        globalEnv = "node";
      } else if (isWebWorker()) {
        globalEnv = "webworker";
      } else if (isJsDom()) {
        globalEnv = "jsdom";
      } else if (isDeno()) {
        globalEnv = "deno";
      } else {
        globalEnv = "other";
      }
      return globalEnv;
    };
    EXCLUDED_SUBSTRINGS = [
      "key",
      "secret",
      "token",
      "password",
      "passwd",
      "pwd",
      "credential",
      "email"
    ];
    _VALID_TRACING_MODES = /* @__PURE__ */ new Set(["langsmith", "otel"]);
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/profile-lock.mjs
function sleep2(ms) {
  return new Promise((resolve2) => setTimeout(resolve2, ms));
}
function isEEXIST(err) {
  return typeof err === "object" && err !== null && err.code === "EEXIST";
}
function lockMetadataLines(lockDir) {
  try {
    return readFileSync3(path3.join(lockDir, LOCK_METADATA_FILE)).split("\n");
  } catch {
    return void 0;
  }
}
function lockCreatedAtMs(lockDir) {
  const lines2 = lockMetadataLines(lockDir);
  if (lines2 && lines2[0] && lines2[0].trim()) {
    const parsed = Date.parse(lines2[0].trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return statMtimeMs(lockDir);
}
function lockOwner(lockDir) {
  const lines2 = lockMetadataLines(lockDir);
  if (lines2 && lines2.length >= 2 && lines2[1].trim()) {
    return lines2[1].trim();
  }
  return void 0;
}
async function removeStaleLock(lockDir) {
  const createdAt = lockCreatedAtMs(lockDir);
  if (createdAt === void 0 || Date.now() - createdAt <= LOCK_STALE_AFTER_MS) {
    return false;
  }
  await rmRecursive(lockDir);
  return true;
}
async function acquireOAuthRefreshLock(configPath, deadline) {
  const lockDir = `${configPath}.oauth.lock.lock`;
  const parent = path3.dirname(lockDir);
  if (parent) {
    await mkdir2(parent);
  }
  const owner = globalThis.crypto.randomUUID();
  for (; ; ) {
    try {
      await mkdirExclusive(lockDir);
    } catch (err) {
      if (!isEEXIST(err)) {
        throw err;
      }
      if (!await removeStaleLock(lockDir)) {
        if (Date.now() >= deadline) {
          throw new Error("timed out acquiring OAuth refresh lock");
        }
        await sleep2(Math.min(LOCK_POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())));
      }
      continue;
    }
    try {
      await writeFileAtomic(path3.join(lockDir, LOCK_METADATA_FILE), `${(/* @__PURE__ */ new Date()).toISOString()}
${owner}
`);
    } catch (err) {
      await rmRecursive(lockDir);
      throw err;
    }
    break;
  }
  return {
    async release() {
      if (lockOwner(lockDir) === owner) {
        await rmRecursive(lockDir);
      }
    }
  };
}
var LOCK_POLL_INTERVAL_MS, LOCK_STALE_AFTER_MS, LOCK_METADATA_FILE;
var init_profile_lock = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/profile-lock.mjs"() {
    init_fs();
    LOCK_POLL_INTERVAL_MS = 10;
    LOCK_STALE_AFTER_MS = 1e4;
    LOCK_METADATA_FILE = "created_at";
  }
});

// node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/profiles.mjs
var profiles_exports = {};
__export(profiles_exports, {
  DEFAULT_API_URL: () => DEFAULT_API_URL,
  ProfileAuth: () => ProfileAuth,
  hasValue: () => hasValue,
  loadProfileClientConfig: () => loadProfileClientConfig,
  resolveTokenEndpoint: () => resolveTokenEndpoint
});
function isBrowserLikeRuntime() {
  const env = getEnv();
  return env === "browser" || env === "webworker";
}
function getProfileConfigPath(selected) {
  const explicitPath = selected || getEnvironmentVariable("LANGSMITH_CONFIG_FILE");
  if (explicitPath) {
    return explicitPath;
  }
  const home = getEnvironmentVariable("HOME") ?? getEnvironmentVariable("USERPROFILE");
  if (!home) {
    return void 0;
  }
  return path3.join(home, ".langsmith", "config.json");
}
function resolveProfileName(config, selected) {
  const chosen = selected || getEnvironmentVariable("LANGSMITH_PROFILE");
  if (chosen) {
    return chosen;
  }
  if (config.current_profile) {
    return config.current_profile;
  }
  if (config.profiles?.default) {
    return "default";
  }
  return void 0;
}
function loadProfileState(selection = {}) {
  if (isBrowserLikeRuntime()) {
    return void 0;
  }
  const configPath = getProfileConfigPath(selection.configPath);
  if (!configPath || !existsSync2(configPath)) {
    return void 0;
  }
  try {
    const config = JSON.parse(readFileSync3(configPath));
    const profileName = resolveProfileName(config, selection.profile);
    const profile = profileName ? config.profiles?.[profileName] : void 0;
    if (!profileName || !profile) {
      return void 0;
    }
    return { configPath, config, profileName, profile };
  } catch {
    return void 0;
  }
}
function hasValue(value) {
  return value !== void 0 && value !== null && value.trim() !== "";
}
function trimConfigValue(value) {
  return value?.trim().replace(/^["']|["']$/g, "");
}
function shouldRefreshProfileToken(profile) {
  const oauth = profile.oauth;
  if (!oauth?.refresh_token) {
    return false;
  }
  if (!oauth.access_token) {
    return true;
  }
  if (!oauth.expires_at) {
    return false;
  }
  const expiresAt = Date.parse(oauth.expires_at);
  if (Number.isNaN(expiresAt)) {
    return false;
  }
  return expiresAt <= Date.now() + TOKEN_REFRESH_LEEWAY_MS;
}
function normalizeConfigUrl(apiUrl) {
  let normalized = apiUrl;
  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  const apiV1Suffix = "/api/v1";
  return normalized.endsWith(apiV1Suffix) ? normalized.slice(0, -apiV1Suffix.length) : normalized;
}
function oauthDiscoveryCandidates(apiUrl) {
  const given = normalizeConfigUrl(apiUrl);
  const origin = given.endsWith("/api") ? given.slice(0, -"/api".length) : given;
  const candidates = [];
  for (const candidate of [given, `${origin}/api`, origin]) {
    if (candidate && candidate !== "/api" && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }
  return candidates;
}
function isTrustedOAuthMetadata(doc, base) {
  const { issuer } = doc;
  if (typeof issuer !== "string" || issuer.replace(/\/+$/, "") !== base.replace(/\/+$/, "")) {
    return false;
  }
  let issuerUrl;
  try {
    issuerUrl = new URL(issuer);
  } catch {
    return false;
  }
  for (const endpoint of [
    doc.device_authorization_endpoint,
    doc.token_endpoint
  ]) {
    if (typeof endpoint !== "string" || !endpoint) {
      return false;
    }
    try {
      const url = new URL(endpoint);
      if (url.protocol !== issuerUrl.protocol || url.host !== issuerUrl.host) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}
function oauthMetadataUrls(base) {
  const appended = `${base}${WELL_KNOWN_OAUTH_PATH}`;
  let inserted;
  try {
    const url = new URL(base);
    inserted = `${url.origin}${WELL_KNOWN_OAUTH_PATH}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return [appended];
  }
  return inserted === appended ? [inserted] : [inserted, appended];
}
async function fetchOAuthMetadata(url, base, fetchImplementation) {
  let response;
  try {
    response = await fetchImplementation(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(OAUTH_DISCOVERY_TIMEOUT_MS)
    });
  } catch {
    return void 0;
  }
  if (!response.ok) {
    return void 0;
  }
  let doc;
  try {
    doc = await response.json();
  } catch {
    return void 0;
  }
  if (!doc || typeof doc !== "object" || !isTrustedOAuthMetadata(doc, base)) {
    return void 0;
  }
  return doc;
}
async function resolveTokenEndpoint(apiUrl, fetchImplementation) {
  for (const base of oauthDiscoveryCandidates(apiUrl)) {
    for (const url of oauthMetadataUrls(base)) {
      const doc = await fetchOAuthMetadata(url, base, fetchImplementation);
      if (doc) {
        return doc.token_endpoint;
      }
    }
  }
  return `${normalizeConfigUrl(apiUrl)}/oauth/token`;
}
function applyTokenResponse(profile, token) {
  profile.oauth ?? (profile.oauth = {});
  if (token.access_token) {
    profile.oauth.access_token = token.access_token;
  }
  if (token.refresh_token) {
    profile.oauth.refresh_token = token.refresh_token;
  }
  if (typeof token.expires_in === "number" && token.expires_in > 0) {
    profile.oauth.expires_at = new Date(Date.now() + token.expires_in * 1e3).toISOString();
  }
}
function getAbortReason(signal) {
  return signal.reason ?? new Error("The operation was aborted.");
}
async function waitForAbortSignal(promise, signal) {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    throw getAbortReason(signal);
  }
  let cleanup;
  const abortPromise = new Promise((_, reject) => {
    const onAbort = () => {
      reject(getAbortReason(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    cleanup = () => {
      signal.removeEventListener("abort", onAbort);
    };
  });
  try {
    return await Promise.race([promise, abortPromise]);
  } finally {
    cleanup?.();
  }
}
function loadProfileClientConfig(selection = {}) {
  const state = loadProfileState(selection);
  const profile = state?.profile;
  if (!state || !profile) {
    return {};
  }
  const apiKey = trimConfigValue(profile.api_key);
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  const oauthRefreshToken = trimConfigValue(profile.oauth?.refresh_token);
  return {
    apiUrl: profile.api_url,
    apiKey,
    workspaceId: profile.workspace_id,
    oauthAccessToken,
    oauthRefreshToken,
    profileAuth: apiKey || oauthAccessToken || oauthRefreshToken ? new ProfileAuth(state) : void 0
  };
}
function currentAuthHeaderFromProfile(profile) {
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  if (oauthAccessToken) {
    return { name: "Authorization", value: `Bearer ${oauthAccessToken}` };
  }
  if (trimConfigValue(profile.oauth?.refresh_token)) {
    return void 0;
  }
  return authHeaderFromProfile(profile);
}
function authHeaderFromProfile(profile) {
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  if (oauthAccessToken) {
    return { name: "Authorization", value: `Bearer ${oauthAccessToken}` };
  }
  const apiKey = trimConfigValue(profile.api_key);
  if (apiKey) {
    return { name: "x-api-key", value: apiKey };
  }
  return void 0;
}
var DEFAULT_API_URL, OAUTH_CLIENT_ID, TOKEN_REFRESH_LEEWAY_MS, TOKEN_REFRESH_TIMEOUT_MS, OAUTH_DISCOVERY_TIMEOUT_MS, WELL_KNOWN_OAUTH_PATH, ProfileAuth;
var init_profiles = __esm({
  "node_modules/.pnpm/langsmith@0.11.4/node_modules/langsmith/lib/utils/profiles.mjs"() {
    init_env3();
    init_fs();
    init_profile_lock();
    DEFAULT_API_URL = "https://api.smith.langchain.com";
    OAUTH_CLIENT_ID = "langsmith-cli";
    TOKEN_REFRESH_LEEWAY_MS = 6e4;
    TOKEN_REFRESH_TIMEOUT_MS = 1e4;
    OAUTH_DISCOVERY_TIMEOUT_MS = 5e3;
    WELL_KNOWN_OAUTH_PATH = "/.well-known/oauth-authorization-server";
    ProfileAuth = class {
      constructor(state) {
        Object.defineProperty(this, "state", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: state
        });
        Object.defineProperty(this, "refreshPromise", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "managedAuthorizationValue", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.rememberProfileAuthHeader(this.currentAuthHeader());
      }
      currentAuthHeader() {
        const header = currentAuthHeaderFromProfile(this.state.profile);
        this.rememberProfileAuthHeader(header);
        return header;
      }
      async getAuthHeader(fetchImplementation, signal) {
        if (shouldRefreshProfileToken(this.state.profile)) {
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshOAuthToken(fetchImplementation).finally(() => {
              this.refreshPromise = void 0;
            });
          }
          await waitForAbortSignal(this.refreshPromise, signal);
        }
        const header = authHeaderFromProfile(this.state.profile);
        this.rememberProfileAuthHeader(header);
        return header;
      }
      isProfileAuthorizationHeader(value) {
        return value === this.managedAuthorizationValue;
      }
      reloadProfile() {
        try {
          const config = JSON.parse(readFileSync3(this.state.configPath));
          const profile = config.profiles?.[this.state.profileName];
          if (!profile) {
            return void 0;
          }
          this.state.config = config;
          this.state.profile = profile;
          return profile;
        } catch {
          return void 0;
        }
      }
      async refreshOAuthToken(fetchImplementation) {
        var _a2;
        const refreshToken = this.state.profile.oauth?.refresh_token;
        if (!refreshToken) {
          return;
        }
        const refreshApiUrl = trimConfigValue(this.state.profile.api_url) ?? DEFAULT_API_URL;
        const deadline = Date.now() + TOKEN_REFRESH_TIMEOUT_MS;
        let lock2;
        try {
          lock2 = await acquireOAuthRefreshLock(this.state.configPath, deadline);
          const fresh = this.reloadProfile();
          if (fresh && !shouldRefreshProfileToken(this.state.profile)) {
            return;
          }
          const body = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: OAUTH_CLIENT_ID,
            refresh_token: this.state.profile.oauth?.refresh_token ?? refreshToken
          });
          const tokenEndpoint = await resolveTokenEndpoint(refreshApiUrl, fetchImplementation);
          const response = await fetchImplementation(tokenEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: body.toString(),
            signal: AbortSignal.timeout(Math.max(0, deadline - Date.now()))
          });
          if (!response.ok) {
            return;
          }
          const token = await response.json();
          if (!token.access_token) {
            return;
          }
          applyTokenResponse(this.state.profile, token);
          (_a2 = this.state.config).profiles ?? (_a2.profiles = {});
          this.state.config.profiles[this.state.profileName] = this.state.profile;
          await writeFileAtomic(this.state.configPath, `${JSON.stringify(this.state.config, null, 2)}
`);
        } catch {
          return;
        } finally {
          await lock2?.release();
        }
      }
      rememberProfileAuthHeader(header) {
        this.managedAuthorizationValue = header?.name === "Authorization" ? header.value : void 0;
      }
    };
  }
});

// dist/src/hooks/gateway.js
import { fileURLToPath } from "node:url";

// dist/src/proxy/config.js
import { lstatSync as lstatSync2 } from "node:fs";
import { join as join2 } from "node:path";
import { userInfo } from "node:os";

// dist/src/proxy/files.js
import { constants, closeSync, fstatSync, fsyncSync, lstatSync, linkSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
function directory(path4, create = false, privateMode = false) {
  if (create) {
    try {
      mkdirSync(path4, { mode: 448 });
    } catch (e) {
      if (e.code !== "EEXIST")
        throw e;
    }
  }
  const s = lstatSync(path4);
  if (!s.isDirectory() || s.uid !== process.getuid?.() || s.mode & (privateMode ? 63 : 18))
    throw new Error("Unsafe settings directory");
}
function directories(home, create = false) {
  directory(home);
  directory(join(home, ".claude"), create);
}
function snapshot(path4, privateMode = false) {
  let fd;
  try {
    fd = openSync(path4, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (e) {
    if (e.code === "ENOENT")
      return;
    throw e;
  }
  try {
    const s = fstatSync(fd);
    if (!s.isFile() || s.nlink !== 1 || s.uid !== process.getuid?.() || s.mode & (privateMode ? 63 : 18) || s.size > 1024 * 1024)
      throw new Error("Unsafe settings file");
    return {
      text: readFileSync(fd, "utf8"),
      ino: s.ino,
      dev: s.dev,
      mtime: s.mtimeMs,
      mode: s.mode
    };
  } finally {
    closeSync(fd);
  }
}
function unchanged(path4, prior, privateMode = false) {
  if (JSON.stringify(snapshot(path4, privateMode)) !== JSON.stringify(prior))
    throw new Error("Settings changed concurrently; retry");
}
function atomic(path4, text2, prior) {
  const temp = join(dirname(path4), `.gateway-${randomBytes(16).toString("hex")}.tmp`);
  const fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
  try {
    try {
      writeFileSync(fd, text2);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    unchanged(path4, prior);
    if (prior === void 0) {
      linkSync(temp, path4);
      unlinkSync(temp);
    } else
      renameSync(temp, path4);
    const dir = openSync(dirname(path4), constants.O_RDONLY);
    try {
      fsyncSync(dir);
    } finally {
      closeSync(dir);
    }
  } finally {
    try {
      unlinkSync(temp);
    } catch {
    }
  }
}
var jsonText = (value) => JSON.stringify(value, null, 2) + "\n";
function transaction(writes) {
  const completed = [];
  for (const item of writes)
    unchanged(item.path, item.prior);
  try {
    for (const item of writes) {
      atomic(item.path, item.text, item.prior);
      completed.push({ ...item, written: snapshot(item.path) });
    }
  } catch (error) {
    for (const item of completed.reverse()) {
      try {
        unchanged(item.path, item.written);
        if (item.prior)
          atomic(item.path, item.prior.text, item.written);
        else
          unlinkSync(item.path);
      } catch {
      }
    }
    throw error;
  }
}

// dist/src/proxy/proxy-constants.js
var CONFIG_UPDATE_GUIDANCE = "Invalid proxy configuration. A one-time private config update is required, so keep your existing key, profile, port and addresses, and set enabled and useClaudeSubscription explicitly even when disabled. Do not paste secrets.";
var COMMAND_GUIDANCE = 'Run /langsmith-gateway:setup --scope global|project within Claude Code, or /langsmith-gateway:disable to turn it off. To sign in with your own identity token, add --workspace-id UUID and --identity-token-command "your command", where the command prints one token. See GATEWAY.md for the other flags.';
var CONFLICTING_AUTH_GUIDANCE = "Conflicting provider setting; it would send requests to another provider instead of the local proxy.";
var CONFLICTING_BASE_GUIDANCE = "Conflicting Claude API address setting; it will not be overwritten.";
var BASE_OVERWRITE_NOTICE = "Your Claude API address already pointed at the LangSmith gateway, so setup replaced it with the local proxy address; ";
var CONFLICT_ENVIRONMENT_GUIDANCE = "Unset in your shell and restart Claude Code, since it reads these at startup.";
var CONFLICT_SETTINGS_GUIDANCE = "Remove from that file.";
var CONFLICT_RETRY_GUIDANCE = "Then retry setup.";
var PINNED_CHANGE_GUIDANCE = "The running daemon holds the old values, so disable first for every active scope with /langsmith-gateway:disable --scope global|project. Stop other gateway sessions, then retry setup.";
var PINNED_FIELD_LABELS = {
  profile: "profile",
  port: "port",
  identityTokenCommand: "identity token command",
  identityTokenTtlMs: "identity token reuse seconds",
  workspaceId: "workspace id",
  apiUrl: "API address",
  gatewayUrl: "gateway address"
};
var STATUS_GUIDANCE = "Use /langsmith-gateway:status [--scope global|project] within Claude Code.";
var TTL_RANGE_GUIDANCE = "Identity token cache seconds must be between 1 and 3600";
var QUOTE_GUIDANCE = "Unterminated quote after --identity-token-command. Close the quote around your command, or write the command unquoted and last.";
var QUOTES = ["'", '"'];
var TENANT_HEADER_GUIDANCE = "Send x-tenant-id at most once and as a workspace UUID. Drop the header to use the workspace saved in your gateway configuration.";
var ORIGIN_SHAPE_GUIDANCE = "Endpoints must be HTTPS DNS origins without credentials, path, query or fragment";
var ORIGIN_DNS_GUIDANCE = "Endpoints must use public DNS names and HTTPS ports 1-65535";
var API_URL = "https://api.smith.langchain.com";
var UPSTREAM = "https://gateway.smith.langchain.com";
var PROTOCOL_VERSION = 12;
var KEY_HEADER = "x-langsmith-proxy-key";
var BEARER_SLOT = "authorization";
var API_KEY_SLOT = "x-api-key";
var PASSTHROUGH_HEADER = "x-langsmith-anthropic-passthrough";
var CREDENTIAL_PREFIX = "sk-ant-";
var BEARER_PREFIX = /^Bearer /i;
var CREDENTIAL_SLOT_GUIDANCE = "Exactly one sk-ant-... credential with a nonempty, header-safe suffix required, sent once as either Authorization: Bearer or x-api-key";
var TENANT_HEADER = "x-tenant-id";
var HEALTH_PATH = "/_langsmith/health";
var CREDENTIAL_STATE_PATH = "/_langsmith/credential";
var SIGN_IN_COMMAND = "the identity token command you configured; the LangSmith CLI is not used";
var SIGN_IN_CLI_DEFAULT = "the LangSmith CLI with its default/current profile";
var SIGN_IN_CLI_PROFILE = (profile) => `the LangSmith CLI with profile ${JSON.stringify(profile)}`;
var WORKSPACE_UNSET = "none saved, so only a workspace sent with the request is forwarded";
var CREDENTIAL_UNCONFIGURED = "unchecked, because proxy setup is missing";
var CREDENTIAL_NO_DAEMON = "unchecked, because no matching daemon is running to ask";
var CREDENTIAL_NO_ANSWER = "unchecked, because the daemon did not answer";
var CREDENTIAL_UNTRIED = "untried, because the daemon has not needed it yet";
var SECONDS_AGO = (ms) => `${Math.max(0, Math.round(ms / 1e3))} seconds ago`;
var CREDENTIAL_NEVER_OBTAINED = (failed) => `broken, and every attempt so far has failed, the most recent ${failed}`;
var CREDENTIAL_WORKING = (obtained) => `working, and was last obtained ${obtained}`;
var CREDENTIAL_COMMAND_FAILING = (failed, obtained) => `broken, because the last attempt failed ${failed} and the last good one was ${obtained}`;
var CREDENTIAL_REFUSED = (refused, obtained) => `broken, because the gateway refused it ${refused} and it was last obtained ${obtained}`;
var CREDENTIAL_STATE_KEYS = ["sinceSuccessMs", "sinceFailureMs", "sinceRefusalMs"];
var BEARER_TOKEN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
var WORKSPACE_ID = /^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/;
var PROFILE_NAME = /^[a-zA-Z0-9_.-]{1,128}$/;
var SECRET = /^[a-f0-9]{64}$/;
var SETTINGS_TARGET = /\/\.claude\/settings(?:\.local)?\.json$/;
var TTL_SECONDS = /^[0-9]{1,5}$/;
var WHITESPACE = /\s/;
var ORIGIN = /^https:\/\/[a-zA-Z0-9.-]+(?::[0-9]{1,5})?\/?$/;
var DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
var TOP_LEVEL_LABEL = /^[a-z][a-z0-9-]*$/;
var PRIVATE_HOST = /(?:^|\.)(?:localhost|local|internal|home|lan)$/;
var CONTROL = /[\x00-\x1f\x7f]/;
var MAX_ORIGIN_LENGTH = 2048;
var MAX_HOSTNAME_LENGTH = 253;
var MIN_URL_PORT = 1;
var MAX_URL_PORT = 65535;
var MIN_PORT = 1024;
var MAX_PORT = 65535;
var MAX_SETTINGS_TARGETS = 128;
var MAX_PATH_LENGTH = 4096;
var SHELL = "/bin/sh";
var MAX_TOKEN_BYTES = 16384;
var EXPIRY_SKEW_MS = 5e3;
var EXPIRY_MARGIN_MS = 6e4;
var RETRY_AFTER_MS = 2e3;
var REJECTION_RECHECK_MS = 5e3;
var UPSTREAM_REJECTED_STATUS = 401;
var MAX_IDENTITY_TOKEN_COMMAND = 4096;
var CREDENTIAL_TIMEOUT_MS = 1e4;
var LOGIN_TOKEN_TTL_MS = 6e4;
var LOGIN_CONFIG_PATH = [".langsmith", "config.json"];
var GATEWAY_LOG_FILE = "gateway.log";
var MAX_GATEWAY_LOG_BYTES = 1024 * 1024;
var SIGN_IN_FAILED_LOG = "LangSmith sign-in failed: ";
var GATEWAY_REFUSED_LOG = "The gateway refused the LangSmith token";
var NO_LOGIN_REASON = "no saved LangSmith login was found, so run langsmith auth login";
var UNUSABLE_LOGIN_REASON = "the saved login has no usable access token";
var EXPIRED_TOKEN_REASON = "the token is expired, so a refresh failed or was refused";
var TOKEN_COMMAND_REASON = "the identity token command printed no usable token";
var UNREADABLE_TOKEN_REASON = "the token could not be read";
var DEFAULT_IDENTITY_TOKEN_TTL_MS = 5 * 6e4;
var MIN_IDENTITY_TOKEN_TTL_MS = 1e3;
var MAX_IDENTITY_TOKEN_TTL_MS = 60 * 6e4;
var CONFIG_KEYS = [
  "enabled",
  "settingsTargets",
  "profile",
  "port",
  "secret",
  "apiUrl",
  "gatewayUrl",
  "useClaudeSubscription",
  "identityTokenCommand",
  "identityTokenTtlMs",
  "workspaceId"
];
var LEGACY_CONFIG_KEYS = ["cli"];
var SETUP_FLAGS = [
  "--scope",
  "--port",
  "--profile",
  "--api-url",
  "--gateway-url",
  "--identity-token-ttl",
  "--workspace-id"
];
var hop = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "proxy-connection"
]);
var routing = /* @__PURE__ */ new Set([
  "authorization",
  "x-auth-source",
  "x-gateway-key",
  "gateway-key",
  "x-api-key",
  "x-tenant-id",
  "x-workspace-id",
  "x-project-id",
  "x-auth-mode",
  "x-gateway-auth-mode",
  "x-service-key",
  "x-auth-token",
  "x-secret-token"
]);
var MAX_REQUEST_BYTES = 60 * 1024 * 1024;
var PROVIDER_ROUTING = [
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY"
];

// dist/src/proxy/config-validation.js
import { isAbsolute, normalize } from "node:path";
var wellFormedOrigin = (value) => typeof value === "string" && value.length <= MAX_ORIGIN_LENGTH && !WHITESPACE.test(value) && ORIGIN.test(value);
var publicDnsOrigin = (url) => {
  const labels = url.hostname.split(".");
  const port = url.port === "" ? void 0 : Number(url.port);
  return url.hostname.length <= MAX_HOSTNAME_LENGTH && labels.length >= 2 && labels.every((label) => DNS_LABEL.test(label)) && TOP_LEVEL_LABEL.test(labels.at(-1)) && !PRIVATE_HOST.test(url.hostname) && (port === void 0 || port >= MIN_URL_PORT && port <= MAX_URL_PORT);
};
var sameHost = (value, origin) => {
  if (typeof value !== "string" || value.length > MAX_ORIGIN_LENGTH || WHITESPACE.test(value))
    return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.hostname.toLowerCase() === new URL(origin).hostname.toLowerCase();
};
var absent = (value, valid) => value === void 0 || valid(value);
var isIdentityTokenCommand = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= MAX_IDENTITY_TOKEN_COMMAND && !CONTROL.test(value);
var isIdentityTokenTtlMs = (value) => Number.isInteger(value) && value >= MIN_IDENTITY_TOKEN_TTL_MS && value <= MAX_IDENTITY_TOKEN_TTL_MS;
var isWorkspaceId = (value) => typeof value === "string" && WORKSPACE_ID.test(value);
var isProfile = (value) => typeof value === "string" && PROFILE_NAME.test(value);
var isPort = (value) => Number.isInteger(value) && value >= MIN_PORT && value <= MAX_PORT;
var isSecret = (value) => typeof value === "string" && SECRET.test(value);
var isSettingsTarget = (value) => typeof value === "string" && value.length <= MAX_PATH_LENGTH && isAbsolute(value) && normalize(value) === value && !value.includes("\0") && SETTINGS_TARGET.test(value);
var isSettingsTargets = (value) => Array.isArray(value) && value.length <= MAX_SETTINGS_TARGETS && value.every((target) => isSettingsTarget(target));
var onlyKnownKeys = (value) => Object.keys(value).every((key) => CONFIG_KEYS.includes(key) || LEGACY_CONFIG_KEYS.includes(key));
var isCredentialState = (value) => !!value && typeof value === "object" && Object.entries(value).every(([key, elapsed]) => CREDENTIAL_STATE_KEYS.includes(key) && typeof elapsed === "number" && elapsed >= 0);
var isSavedConfig = (c) => typeof c.enabled === "boolean" && typeof c.useClaudeSubscription === "boolean" && absent(c.profile, isProfile) && isPort(c.port) && isSecret(c.secret) && absent(c.settingsTargets, isSettingsTargets) && absent(c.identityTokenCommand, isIdentityTokenCommand) && absent(c.identityTokenTtlMs, isIdentityTokenTtlMs) && absent(c.workspaceId, isWorkspaceId) && onlyKnownKeys(c);

// dist/src/proxy/config.js
var ConfigError = class extends Error {
};
var userHome = () => userInfo().homedir;
var configDir = (home = userHome()) => join2(home, ".claude", "langsmith-proxy");
function httpsOrigin(value) {
  if (!wellFormedOrigin(value))
    throw new Error(ORIGIN_SHAPE_GUIDANCE);
  const url = new URL(value);
  if (!publicDnsOrigin(url))
    throw new Error(ORIGIN_DNS_GUIDANCE);
  return url.origin;
}
function endpoints(c) {
  if (c.apiUrl === void 0 !== (c.gatewayUrl === void 0))
    throw new Error("Supply both --api-url and --gateway-url; no implicit production endpoint");
  return {
    apiUrl: httpsOrigin(c.apiUrl === void 0 ? API_URL : c.apiUrl),
    gatewayUrl: httpsOrigin(c.gatewayUrl === void 0 ? UPSTREAM : c.gatewayUrl)
  };
}
function privatePath(path4, directory2 = false) {
  const s = lstatSync2(path4);
  if (s.uid !== process.getuid?.() || (s.mode & 63) !== 0 || (directory2 ? !s.isDirectory() : !s.isFile()))
    throw new Error("Unsafe proxy configuration");
}
function loadConfig(home = userHome(), includeDisabled = false) {
  let saved;
  try {
    directories(home);
    privatePath(configDir(home), true);
    saved = snapshot(join2(configDir(home), "config.json"), true);
  } catch (e) {
    if (e.code === "ENOENT")
      return;
    if (e instanceof Error && e.message === "Unsafe settings file")
      throw new Error("Unsafe proxy configuration");
    throw e;
  }
  if (!saved)
    return;
  const c = JSON.parse(saved.text);
  if (!c || !isSavedConfig(c))
    throw new ConfigError(CONFIG_UPDATE_GUIDANCE);
  let selected;
  try {
    selected = endpoints(c);
  } catch {
    throw new ConfigError(CONFIG_UPDATE_GUIDANCE);
  }
  if (!c.enabled && !includeDisabled)
    return;
  return { ...c, ...selected };
}
function configStatus(home = userHome()) {
  const config = loadConfig(home, true);
  return {
    state: config === void 0 ? "not configured" : config.enabled ? "enabled" : "disabled",
    config
  };
}

// dist/src/proxy/log.js
import { appendFileSync, renameSync as renameSync2, statSync } from "node:fs";
import { join as join3 } from "node:path";
var path;
function startLog(directory2) {
  path = join3(directory2, GATEWAY_LOG_FILE);
}
function logFailure(message) {
  if (path === void 0)
    return;
  try {
    if ((statSync(path, { throwIfNoEntry: false })?.size ?? 0) >= MAX_GATEWAY_LOG_BYTES)
      renameSync2(path, `${path}.1`);
    appendFileSync(path, `${(/* @__PURE__ */ new Date()).toISOString()} ${message}
`, { mode: 384 });
  } catch {
  }
}

// dist/src/proxy/server.js
import http from "node:http";
import https from "node:https";
import { createHash, timingSafeEqual } from "node:crypto";

// dist/src/proxy/header-slots.js
var slotPresent = (req, name) => req.rawHeaders.some((header, i) => i % 2 === 0 && header.toLowerCase() === name);
function slotValue(req, name) {
  const count = req.rawHeaders.filter((header, i) => i % 2 === 0 && header.toLowerCase() === name).length;
  const value = req.headers[name];
  if (count !== 1 || typeof value !== "string")
    return;
  return value;
}
function bearerCredential(value) {
  if (value === void 0 || !BEARER_PREFIX.test(value))
    return;
  return value.slice("Bearer ".length);
}

// dist/src/proxy/token.js
import { spawn } from "node:child_process";
import { join as join4 } from "node:path";
function cliEnvironment() {
  return { HOME: userHome(), PATH: "/usr/bin:/bin:/usr/sbin:/sbin" };
}
var SignInFailure = class extends Error {
};
async function loginToken(config, signal) {
  const { loadProfileClientConfig: loadProfileClientConfig2 } = await Promise.resolve().then(() => (init_profiles(), profiles_exports));
  const { profileAuth } = loadProfileClientConfig2({
    configPath: join4(userHome(), ...LOGIN_CONFIG_PATH),
    profile: config.profile
  });
  if (profileAuth === void 0)
    throw new SignInFailure(NO_LOGIN_REASON);
  const token = bearerCredential((await profileAuth.getAuthHeader(fetch, signal))?.value);
  if (token === void 0 || !BEARER_TOKEN.test(token))
    throw new SignInFailure(UNUSABLE_LOGIN_REASON);
  return token;
}
function commandToken(command, timeoutMs = CREDENTIAL_TIMEOUT_MS, signal) {
  return spawnToken(SHELL, ["-c", command], timeoutMs, signal);
}
function spawnToken(command, args, timeoutMs, signal) {
  return new Promise((resolve2, reject) => {
    if (signal?.aborted) {
      reject(new Error("LangSmith token unavailable"));
      return;
    }
    const child = spawn(command, args, {
      cwd: userHome(),
      env: cliEnvironment(),
      stdio: ["ignore", "pipe", "ignore"],
      shell: false
    });
    let output = "";
    let settled = false;
    const finish = (token) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      output = "";
      if (token)
        resolve2(token);
      else
        reject(new SignInFailure(TOKEN_COMMAND_REASON));
    };
    const cancel = () => {
      child.kill("SIGKILL");
    };
    signal?.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish();
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.length > MAX_TOKEN_BYTES) {
        child.kill("SIGKILL");
        finish();
      }
    });
    child.on("error", () => finish());
    child.on("close", (code) => {
      const token = output.trim();
      finish(!signal?.aborted && code === 0 && BEARER_TOKEN.test(token) ? token : void 0);
    });
  });
}
var TokenCache = class {
  load;
  now;
  ttlMs;
  cached;
  pending;
  retryAt = 0;
  succeededAt;
  failedAt;
  refusedAt;
  rejectedAt = 0;
  constructor(load, now = Date.now, ttlMs = LOGIN_TOKEN_TTL_MS) {
    this.load = load;
    this.now = now;
    this.ttlMs = ttlMs;
  }
  get loading() {
    return this.pending !== void 0;
  }
  state() {
    const now = this.now();
    const since = (at) => at === void 0 ? void 0 : now - at;
    return {
      sinceSuccessMs: since(this.succeededAt),
      sinceFailureMs: since(this.failedAt),
      sinceRefusalMs: since(this.refusedAt)
    };
  }
  reject(token) {
    this.refusedAt = this.now();
    if (this.cached?.token !== token)
      return;
    if (this.now() < this.rejectedAt + REJECTION_RECHECK_MS)
      return;
    this.cached = void 0;
    this.rejectedAt = this.now();
    logFailure(GATEWAY_REFUSED_LOG);
  }
  get() {
    if (this.cached && this.now() < this.cached.until)
      return Promise.resolve(this.cached.token);
    if (this.pending)
      return this.pending;
    if (this.now() < this.retryAt)
      return Promise.reject(new Error("LangSmith token unavailable"));
    this.pending = this.load().then((token) => {
      const exp = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp;
      if (typeof exp !== "number" || !Number.isFinite(exp) || exp * 1e3 < this.now() + EXPIRY_SKEW_MS)
        throw new SignInFailure(EXPIRED_TOKEN_REASON);
      this.succeededAt = this.now();
      this.cached = {
        token,
        until: Math.min(this.now() + this.ttlMs, exp * 1e3 - EXPIRY_MARGIN_MS)
      };
      return token;
    }).catch((error) => {
      logFailure(SIGN_IN_FAILED_LOG + (error instanceof SignInFailure ? error.message : UNREADABLE_TOKEN_REASON));
      this.cached = void 0;
      this.failedAt = this.now();
      this.retryAt = this.now() + RETRY_AFTER_MS;
      throw new Error("LangSmith token unavailable");
    }).finally(() => {
      this.pending = void 0;
    });
    return this.pending;
  }
};
function commandGuidance(config) {
  const reused = (config.identityTokenTtlMs ?? DEFAULT_IDENTITY_TOKEN_TTL_MS) / 1e3;
  return `LangSmith authentication unavailable. Your configured identity token command did not print one unexpired bearer token on standard output, so it exited non-zero, printed something else, or ran past ${CREDENTIAL_TIMEOUT_MS / 1e3} seconds. It runs with ${SHELL} from your home directory and gets only HOME and a standard PATH, so anything your shell profile or virtual environment normally sets up is missing even when the same command works in your terminal. A good result is reused for ${reused} seconds, or less when the token expires sooner, and a failure is remembered for ${RETRY_AFTER_MS / 1e3} seconds. Fix the command and send the request again, since nothing is replayed for you.
`;
}
function loginGuidance(config) {
  return `LangSmith authentication unavailable. Stop gateway sessions and other CLI writers, then log in in a separate terminal using the LangSmith CLI with: ${config.profile === void 0 ? "" : `--profile ${config.profile} `}--api-url ${endpoints(config).apiUrl} auth login. Use a profile matching the selected API (optionally pin it with --profile): --api-url does not change an existing saved OAuth issuer. Review that issuer privately before login/refresh. Then retry the request; token lookup failures are cached for two seconds. Failed requests are not replayed automatically. Hooks never open a browser.
`;
}

// dist/src/proxy/server.js
var identity = (c) => createHash("sha256").update(JSON.stringify([
  PROTOCOL_VERSION,
  c.useClaudeSubscription,
  c.profile,
  c.port,
  c.secret,
  endpoints(c).apiUrl,
  endpoints(c).gatewayUrl,
  c.identityTokenCommand,
  c.identityTokenTtlMs,
  c.workspaceId
])).digest("hex");
function authenticated(req, secret) {
  const keys = req.rawHeaders.filter((_, i) => i % 2 === 0 && req.rawHeaders[i].toLowerCase() === KEY_HEADER);
  const value = req.headers[KEY_HEADER];
  if (keys.length !== 1 || typeof value !== "string")
    return false;
  const a = Buffer.from(value), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
function nativeToken(req) {
  const token = slotPresent(req, BEARER_SLOT) ? bearerCredential(slotValue(req, BEARER_SLOT)) : slotValue(req, API_KEY_SLOT);
  if (token === void 0)
    return;
  if (!token.startsWith(CREDENTIAL_PREFIX) || token.length <= 7 || /[\s\x00-\x1f\x7f-\x9f,]/.test(token))
    return;
  try {
    http.validateHeaderValue(PASSTHROUGH_HEADER, token);
  } catch {
    return;
  }
  return token;
}
function cleanHeaders(headers, request = true) {
  const blocked = /* @__PURE__ */ new Set([
    ...hop,
    ...(headers.connection ?? "").toLowerCase().split(",").map((s) => s.trim())
  ]);
  const result = {};
  for (const [name, value] of Object.entries(headers)) {
    if (blocked.has(name) || name === KEY_HEADER || name.startsWith("x-langsmith-") || routing.has(name) || request && (name === "host" || name === "expect"))
      continue;
    result[name] = value;
  }
  return result;
}
function upstreamPath(method, raw) {
  if (raw.length > 4096 || /[\\#\x00-\x20\x7f]/.test(raw))
    return;
  const [path4, query] = raw.split("?", 2);
  if (!(method === "POST" && /^\/v1\/messages(?:\/count_tokens)?$/.test(path4) || method === "GET" && /^\/v1\/models(?:\/[a-zA-Z0-9_-]+)?$/.test(path4)))
    return;
  if (query !== void 0) {
    if (raw.indexOf("?", raw.indexOf("?") + 1) !== -1)
      return;
    const allowed = method === "POST" ? ["beta"] : ["beta", "limit", "before_id", "after_id"];
    const params = new URLSearchParams(query);
    for (const [key, value] of params)
      if (!allowed.includes(key) || !/^[a-zA-Z0-9_.-]{1,256}$/.test(value))
        return;
  }
  return method === "GET" && path4.startsWith("/v1/models/") ? "/anthropic" + raw : raw;
}
var RequestError = class extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
function callerWorkspace(req) {
  const values = req.rawHeaders.filter((_, i) => i % 2 === 1 && req.rawHeaders[i - 1].toLowerCase() === TENANT_HEADER);
  if (values.length === 0)
    return void 0;
  if (values.length !== 1 || !isWorkspaceId(values[0]))
    throw new RequestError(400, TENANT_HEADER_GUIDANCE);
  return values[0];
}
function readBody(req) {
  return new Promise((resolve2, reject) => {
    const chunks = [];
    let size = 0;
    const cleanup = () => {
      req.off("data", data);
      req.off("end", done);
      req.off("error", failed);
      req.off("aborted", failed);
    };
    const failed = () => {
      cleanup();
      reject(new RequestError(400, "Invalid JSON request"));
    };
    const data = (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        cleanup();
        req.pause();
        reject(new RequestError(413, "Request body exceeds 60 MiB"));
      } else
        chunks.push(chunk);
    };
    const done = () => {
      cleanup();
      resolve2(Buffer.concat(chunks, size));
    };
    req.on("data", data);
    req.on("end", done);
    req.on("error", failed);
    req.on("aborted", failed);
  });
}
async function prepareBody(req, path4) {
  const encoding = req.headers["content-encoding"];
  if (encoding !== void 0 && encoding.toLowerCase() !== "identity")
    throw new RequestError(415, "Compressed request bodies are unsupported");
  const contentType = req.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase();
  if (contentType && contentType !== "application/json")
    throw new RequestError(415, "Request body must be application/json");
  if (Number(req.headers["content-length"]) > MAX_REQUEST_BYTES)
    throw new RequestError(413, "Request body exceeds 60 MiB");
  const bytes = await readBody(req);
  let body;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RequestError(400, "Invalid JSON request");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new RequestError(400, "Request body must be a JSON object");
  const model = body.model;
  if (typeof model !== "string" || !model.trim())
    throw new RequestError(400, "model must be a non-empty string");
  const slash = model.indexOf("/");
  if (slash === 0 || slash === model.length - 1)
    throw new RequestError(400, "model must be a bare ID or provider/model");
  const normalized = slash === -1 ? `anthropic/${model}` : model;
  body.model = normalized;
  if (path4.split("?", 1)[0] === "/v1/messages/count_tokens") {
    if (!normalized.startsWith("anthropic/"))
      throw new RequestError(501, "count_tokens is supported only for Anthropic models");
    path4 = "/anthropic" + path4;
    body.model = normalized.slice("anthropic/".length);
  }
  const rewritten = Buffer.from(JSON.stringify(body));
  if (rewritten.length > MAX_REQUEST_BYTES)
    throw new RequestError(413, "Request body exceeds 60 MiB");
  return { body: rewritten, path: path4 };
}
var Sessions2 = class {
  now;
  leaseMs;
  idleMs;
  leases = /* @__PURE__ */ new Map();
  ended = /* @__PURE__ */ new Map();
  active = 0;
  lastActivity;
  constructor(now = Date.now, leaseMs = 30 * 6e4, idleMs = 6e4) {
    this.now = now;
    this.leaseMs = leaseMs;
    this.idleMs = idleMs;
    this.lastActivity = now();
  }
  prune() {
    const now = this.now();
    for (const [id, expiry] of this.leases)
      if (expiry <= now)
        this.leases.delete(id);
    for (const [id, expiry] of this.ended)
      if (expiry <= now)
        this.ended.delete(id);
  }
  register(id) {
    this.prune();
    if (this.ended.has(id))
      return false;
    if (!this.leases.has(id) && this.leases.size >= 512)
      return false;
    this.leases.set(id, this.now() + this.leaseMs);
    this.lastActivity = this.now();
    return true;
  }
  release(id) {
    this.prune();
    this.leases.delete(id);
    this.ended.delete(id);
    if (this.ended.size >= 512)
      this.ended.delete(this.ended.keys().next().value);
    this.ended.set(id, this.now() + this.leaseMs);
    this.lastActivity = this.now();
  }
  begin() {
    this.active++;
    this.lastActivity = this.now();
  }
  end() {
    this.active--;
    this.lastActivity = this.now();
  }
  idle() {
    this.prune();
    return this.active === 0 && this.leases.size === 0 && this.now() - this.lastActivity >= this.idleMs;
  }
};
function reply(res, status, message) {
  res.writeHead(status, {
    "content-type": "text/plain",
    "cache-control": "no-store",
    connection: "close"
  });
  res.end(message);
}
function createProxy(config, options = {}) {
  const upstreamOrigin = new URL(endpoints(config).gatewayUrl);
  const credentialAbort = new AbortController();
  const command = config.identityTokenCommand;
  const fetchToken = command === void 0 ? options.token ?? (() => loginToken(config, credentialAbort.signal)) : () => commandToken(command, CREDENTIAL_TIMEOUT_MS, credentialAbort.signal);
  const ttlMs = command === void 0 ? LOGIN_TOKEN_TTL_MS : config.identityTokenTtlMs ?? DEFAULT_IDENTITY_TOKEN_TTL_MS;
  const tokens = new TokenCache(fetchToken, Date.now, ttlMs);
  const unavailable = () => command === void 0 ? loginGuidance(config) : commandGuidance(config);
  const sessions = options.sessions ?? new Sessions2();
  const transport = options.transport ?? https.request;
  let draining = false;
  const server = http.createServer({ maxHeaderSize: 32768 }, (req, res) => {
    if (!authenticated(req, config.secret)) {
      reply(res, 401, "Local proxy authentication required");
      return;
    }
    if (req.headers.origin || req.headers.host !== `127.0.0.1:${config.port}`) {
      reply(res, 403, "Local proxy request rejected");
      return;
    }
    if (draining) {
      reply(res, 503, "Local proxy draining");
      return;
    }
    if (req.method === "GET" && req.url === HEALTH_PATH) {
      reply(res, 200, identity(config));
      return;
    }
    if (req.method === "GET" && req.url === CREDENTIAL_STATE_PATH) {
      reply(res, 200, JSON.stringify(tokens.state()));
      return;
    }
    const control2 = /^\/_langsmith\/sessions\/([a-zA-Z0-9_-]{1,128})$/.exec(req.url ?? "");
    if (control2 && (req.method === "PUT" || req.method === "DELETE")) {
      if (req.headers["transfer-encoding"] || req.headers["content-length"] && req.headers["content-length"] !== "0") {
        reply(res, 400, "Control requests must be empty");
        return;
      }
      if (req.method === "PUT" && !sessions.register(control2[1])) {
        reply(res, 429, "Session registration unavailable");
        return;
      }
      if (req.method === "DELETE")
        sessions.release(control2[1]);
      reply(res, 204, "");
      return;
    }
    const path4 = upstreamPath(req.method ?? "", req.url ?? "");
    if (!path4) {
      reply(res, 404, "Unsupported proxy route");
      return;
    }
    const native = config.useClaudeSubscription ? nativeToken(req) : void 0;
    if (config.useClaudeSubscription && !native) {
      reply(res, 401, CREDENTIAL_SLOT_GUIDANCE);
      return;
    }
    const headers = cleanHeaders(req.headers);
    if (sessions.active >= 64) {
      reply(res, 503, "Local proxy busy");
      return;
    }
    sessions.begin();
    let ended = false;
    let outgoing;
    let incoming;
    let headerTimer;
    const end = () => {
      if (ended)
        return;
      ended = true;
      clearTimeout(headerTimer);
      outgoing?.destroy();
      incoming?.destroy();
      sessions.end();
    };
    req.on("aborted", end);
    req.on("error", end);
    res.on("close", end);
    const fail2 = () => {
      if (ended)
        return;
      if (!res.headersSent)
        reply(res, 502, "LangSmith proxy upstream unavailable");
      else
        res.destroy();
      end();
    };
    void (async () => {
      const workspace = callerWorkspace(req) ?? config.workspaceId;
      const prepared = req.method === "POST" ? await prepareBody(req, path4) : void 0;
      if (ended || res.destroyed)
        return;
      if (prepared) {
        headers["content-type"] = "application/json";
        headers["content-length"] = String(prepared.body.length);
        delete headers["transfer-encoding"];
        delete headers["content-encoding"];
      }
      if (draining)
        throw new RequestError(503, "Local proxy draining");
      const token = await tokens.get().catch(() => {
        throw new RequestError(503, unavailable());
      });
      if (ended || res.destroyed)
        return;
      if (draining)
        throw new RequestError(503, "Local proxy draining");
      headers.authorization = `Bearer ${token}`;
      if (workspace)
        headers[TENANT_HEADER] = workspace;
      if (native)
        headers[PASSTHROUGH_HEADER] = native;
      outgoing = transport({
        protocol: "https:",
        hostname: upstreamOrigin.hostname,
        port: Number(upstreamOrigin.port || 443),
        path: prepared?.path ?? path4,
        method: req.method,
        headers,
        agent: false,
        rejectUnauthorized: true
      }, (upstream) => {
        clearTimeout(headerTimer);
        if (upstream.statusCode === UPSTREAM_REJECTED_STATUS)
          tokens.reject(token);
        incoming = upstream;
        if (ended) {
          upstream.destroy();
          return;
        }
        if ((upstream.statusCode ?? 502) >= 300 && (upstream.statusCode ?? 502) < 400) {
          fail2();
          return;
        }
        const responseHeaders = cleanHeaders(upstream.headers, false);
        delete responseHeaders["location"];
        delete responseHeaders["set-cookie"];
        res.writeHead(upstream.statusCode ?? 502, responseHeaders);
        upstream.on("error", fail2);
        upstream.on("aborted", fail2);
        upstream.pipe(res);
      });
      headerTimer = setTimeout(fail2, 12e4);
      outgoing.setTimeout(12e4, fail2);
      outgoing.on("error", fail2);
      if (prepared)
        outgoing.end(prepared.body);
      else
        req.pipe(outgoing);
    })().catch((error) => {
      if (ended)
        return;
      if (error instanceof RequestError) {
        reply(res, error.status, error.message);
        end();
      } else
        fail2();
    });
  });
  server.headersTimeout = 15e3;
  server.requestTimeout = 12e4;
  server.keepAliveTimeout = 5e3;
  server.maxConnections = 128;
  server.on("connect", (_req, socket) => socket.destroy());
  server.on("upgrade", (_req, socket) => socket.destroy());
  server.on("clientError", (_err, socket) => socket.destroy());
  let drainTimer;
  const close = () => {
    clearInterval(sweep);
    clearTimeout(drainTimer);
    server.close();
    server.closeAllConnections();
  };
  const drain = () => {
    if (draining)
      return;
    draining = true;
    credentialAbort.abort();
    server.closeIdleConnections();
    if (sessions.active === 0 && !tokens.loading) {
      close();
      return;
    }
    drainTimer = setTimeout(close, 3e4);
    drainTimer.unref();
  };
  const sweep = setInterval(() => {
    if (draining && sessions.active === 0 && !tokens.loading)
      close();
    else if (sessions.idle())
      drain();
  }, 1e3);
  sweep.unref();
  server.on("close", () => {
    credentialAbort.abort();
    clearInterval(sweep);
    clearTimeout(drainTimer);
  });
  return { server, sessions, drain };
}

// dist/src/proxy/options.js
var SetupError = class extends Error {
};
function identityTokenTtl(seconds) {
  if (seconds === void 0)
    return void 0;
  const ms = Number(seconds) * 1e3;
  if (!TTL_SECONDS.test(seconds) || !isIdentityTokenTtlMs(ms))
    throw new SetupError(TTL_RANGE_GUIDANCE);
  return ms;
}
function parseSetupArgs(rest) {
  const usage = COMMAND_GUIDANCE;
  if (rest.some((arg) => typeof arg !== "string" || !arg || [...arg].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)))
    throw new SetupError(usage);
  const flags = /* @__PURE__ */ new Map();
  let useClaudeSubscription = false;
  let command;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--use-claude-subscription") {
      if (useClaudeSubscription)
        throw new SetupError(usage);
      useClaudeSubscription = true;
      continue;
    }
    if (arg === "--identity-token-command") {
      if (command !== void 0)
        throw new SetupError(usage);
      const tail = rest.slice(i + 1);
      const quote = tail.length && QUOTES.includes(tail[0][0]) ? tail[0][0] : void 0;
      if (quote === void 0) {
        const joined = tail.join(" ");
        if (!isIdentityTokenCommand(joined))
          throw new SetupError(usage);
        command = joined;
        break;
      }
      const end = tail.findIndex((part, index) => part.endsWith(quote) && (index > 0 || part.length > 1));
      if (end === -1)
        throw new SetupError(QUOTE_GUIDANCE);
      command = tail.slice(0, end + 1).join(" ").slice(1, -1);
      if (!isIdentityTokenCommand(command))
        throw new SetupError(usage);
      i += end + 1;
      continue;
    }
    if (!SETUP_FLAGS.includes(arg) || flags.has(arg) || !rest[i + 1] || rest[i + 1].startsWith("--"))
      throw new SetupError(usage);
    flags.set(arg, rest[++i]);
  }
  const scope = flags.get("--scope");
  if (scope !== "global" && scope !== "project")
    throw new SetupError(usage);
  const result = { scope, useClaudeSubscription };
  if (flags.has("--port")) {
    const port = flags.get("--port");
    if (!/^[0-9]{4,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
      throw new SetupError(usage);
    result.port = Number(port);
  }
  result.profile = flags.get("--profile");
  if (result.profile !== void 0 && !PROFILE_NAME.test(result.profile))
    throw new SetupError("Invalid CLI profile name");
  result.identityTokenCommand = command;
  result.identityTokenTtlMs = identityTokenTtl(flags.get("--identity-token-ttl"));
  result.workspaceId = flags.get("--workspace-id");
  if (result.workspaceId !== void 0 && !isWorkspaceId(result.workspaceId))
    throw new SetupError("Workspace id must be a UUID");
  if (command !== void 0 && result.workspaceId === void 0)
    throw new SetupError("An identity token command also requires --workspace-id");
  if (command === void 0 && result.identityTokenTtlMs !== void 0)
    throw new SetupError("Identity token cache seconds apply only with an identity token command");
  if (flags.has("--api-url") || flags.has("--gateway-url")) {
    try {
      Object.assign(result, endpoints({ apiUrl: flags.get("--api-url"), gatewayUrl: flags.get("--gateway-url") }));
    } catch {
      throw new SetupError("Supply both --api-url and --gateway-url as HTTPS public DNS origins (ports 1-65535), without credentials, paths, query or fragment. No implicit production endpoint.");
    }
  }
  return result;
}
function parseDisableArgs(args) {
  if (args.length !== 2 || args[0] !== "--scope")
    throw new SetupError(COMMAND_GUIDANCE);
  return parseSetupArgs(args);
}
function parseStatusArgs(args) {
  if (args.length === 0)
    return {};
  if (args.length === 2 && args[0] === "--scope" && (args[1] === "global" || args[1] === "project"))
    return { scope: args[1] };
  throw new SetupError(STATUS_GUIDANCE);
}
function parseGatewayCommand(prompt) {
  if (typeof prompt !== "string")
    return;
  const match = /^\/langsmith-gateway:(setup|disable|status)(?=\s|$)/.exec(prompt);
  if (!match)
    return;
  const rest = prompt.slice(match[0].length);
  if (/[\r\n\x00-\x1f`$;&|<>\\]/.test(rest))
    throw new SetupError(match[1] === "status" ? STATUS_GUIDANCE : COMMAND_GUIDANCE);
  const args = rest.trim() ? rest.trim().split(/ +/) : [];
  const command = match[1];
  if (command === "setup")
    parseSetupArgs(args);
  else if (command === "disable")
    parseDisableArgs(args);
  else
    parseStatusArgs(args);
  return { command, args };
}

// dist/src/proxy/settings.js
import { mkdirSync as mkdirSync5, rmdirSync } from "node:fs";
import { dirname as dirname3, join as join7 } from "node:path";

// dist/src/proxy/setup.js
import { mkdirSync as mkdirSync4 } from "node:fs";
import { join as join5 } from "node:path";
import { randomBytes as randomBytes2 } from "node:crypto";
function createConfig(profile, port, home = userHome(), urls = {}, useClaudeSubscription = false, credentials = {}) {
  const valid = typeof useClaudeSubscription === "boolean" && absent(profile, isProfile) && isPort(port) && absent(credentials.identityTokenCommand, isIdentityTokenCommand) && absent(credentials.identityTokenTtlMs, isIdentityTokenTtlMs) && absent(credentials.workspaceId, isWorkspaceId);
  if (!valid)
    throw new Error("Invalid setup arguments");
  const selected = endpoints(urls);
  directories(home, true);
  const dir = configDir(home);
  try {
    mkdirSync4(dir, { mode: 448 });
  } catch (e) {
    if (e.code !== "EEXIST")
      throw e;
  }
  privatePath(dir, true);
  const config = {
    enabled: true,
    useClaudeSubscription,
    ...selected,
    ...credentials,
    profile,
    port,
    secret: randomBytes2(32).toString("hex")
  };
  const path4 = join5(dir, "config.json");
  if (snapshot(path4, true))
    throw new Error("Proxy config already exists");
  atomic(path4, jsonText(config), void 0);
}

// dist/src/proxy/lifecycle.js
import http2 from "node:http";
import { connect } from "node:net";
import { spawn as spawn2 } from "node:child_process";
function control(config, method, path4, timeoutMs = 500) {
  return new Promise((resolve2, reject) => {
    const req = http2.request({
      hostname: "127.0.0.1",
      port: config.port,
      method,
      path: path4,
      agent: false,
      headers: { [KEY_HEADER]: config.secret, "content-length": "0" }
    }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
        if (data.length > 1024)
          req.destroy();
      });
      res.on("error", () => reject(new Error("Local proxy unavailable")));
      res.on("end", () => res.statusCode === 200 || res.statusCode === 204 ? resolve2(data) : reject(new Error("Local proxy unavailable")));
    });
    const timer = setTimeout(() => req.destroy(new Error("Local proxy unavailable")), timeoutMs);
    req.on("close", () => clearTimeout(timer));
    req.on("error", () => reject(new Error("Local proxy unavailable")));
    req.end();
  });
}
async function healthy(config) {
  try {
    return await control(config, "GET", HEALTH_PATH) === identity(config);
  } catch {
    return false;
  }
}
async function ensure(config, entry2) {
  if (await healthy(config))
    return;
  const child = spawn2(process.execPath, [entry2, "daemon"], {
    detached: true,
    stdio: "ignore",
    cwd: userHome(),
    env: cliEnvironment()
  });
  child.on("error", () => {
  });
  child.unref();
  const deadline = Date.now() + 4e3;
  do {
    if (await healthy(config))
      return;
    await new Promise((resolve2) => setTimeout(resolve2, 100));
  } while (Date.now() < deadline);
  throw new Error("Local proxy unavailable");
}
async function gatewayHook(event, session, entry2, home = userHome()) {
  const config = loadConfig(home);
  if (!config)
    return;
  if (!["SessionStart", "UserPromptSubmit", "SessionEnd"].includes(String(event)) || typeof session !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(session))
    return;
  if (event === "SessionEnd") {
    await control(config, "DELETE", `/_langsmith/sessions/${session}`);
  } else {
    await ensure(config, entry2);
    await control(config, "PUT", `/_langsmith/sessions/${session}`);
  }
}
async function waitForStopped(config, timeoutMs = 36e3) {
  const deadline = Date.now() + timeoutMs;
  do {
    const stopped = await new Promise((resolve2) => {
      const socket = connect({ host: "127.0.0.1", port: config.port });
      const finish = (free) => {
        socket.destroy();
        resolve2(free);
      };
      socket.once("connect", () => finish(false));
      socket.once("error", (error) => finish(error.code === "ECONNREFUSED"));
      socket.setTimeout(500, () => finish(false));
    });
    if (stopped)
      return;
    await new Promise((resolve2) => setTimeout(resolve2, 100));
  } while (Date.now() < deadline);
  throw new Error("Old proxy still draining or local port occupied");
}

// dist/src/proxy/scopes.js
import { realpathSync } from "node:fs";
import { dirname as dirname2, join as join6, resolve } from "node:path";
function targetPaths(home, scope, cwd) {
  if (scope === "global")
    return {
      settings: join6(home, ".claude/settings.json"),
      config: join6(configDir(home), "config.json")
    };
  if (!cwd || !cwd.startsWith("/"))
    throw new SetupError("Project scope requires an absolute hook cwd.");
  const root = realpathSync(cwd);
  if (resolve(cwd) !== root)
    throw new SetupError("Project path must be canonical and not a symlink.");
  directory(root);
  const settings2 = join6(root, ".claude/settings.local.json");
  return {
    settings: settings2,
    config: join6(configDir(home), "config.json")
  };
}
var BASE = "ANTHROPIC_BASE_URL";
var HEADERS = "ANTHROPIC_CUSTOM_HEADERS";
var proxyKeyLine = (config) => `X-LangSmith-Proxy-Key: ${config.secret}`;
function routingSnapshot(path4) {
  try {
    const root = dirname2(dirname2(path4));
    if (realpathSync(root) !== root)
      throw new Error("Noncanonical routing target");
    directory(root);
    directory(dirname2(path4));
    return snapshot(path4);
  } catch (error) {
    if (error.code !== "ENOENT")
      throw error;
  }
}
function unchangedRouting(path4, saved) {
  if (JSON.stringify(routingSnapshot(path4)) !== JSON.stringify(saved))
    throw new Error("Settings changed concurrently; retry");
}
function routingEnv(saved) {
  const value = saved ? JSON.parse(saved.text) : {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid settings");
  const env = value.env === void 0 ? {} : value.env;
  if (!env || typeof env !== "object" || Array.isArray(env))
    throw new Error("Invalid settings");
  return env;
}
function matchesRouting(env, config) {
  const headers = env[HEADERS];
  return env[BASE] === `http://127.0.0.1:${config.port}` && typeof headers === "string" && headers.split("\n").filter((line) => /^\s*x-langsmith-proxy-key\s*:/i.test(line)).length === 1 && headers.split("\n").includes(proxyKeyLine(config));
}
function routingTargets(home, cwd, config) {
  const paths = /* @__PURE__ */ new Set([
    targetPaths(home, "global", cwd).settings,
    ...config?.settingsTargets ?? []
  ]);
  if (cwd)
    paths.add(targetPaths(home, "project", cwd).settings);
  return [...paths].map((path4) => ({ path: path4, saved: routingSnapshot(path4) }));
}

// dist/src/proxy/settings.js
var fail = (message) => {
  throw new SetupError(message);
};
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Expected a JSON object; settings were not replaced.");
  return value;
}
function text(value) {
  if (value === void 0)
    return;
  if (typeof value !== "string")
    return fail("Transport settings must be strings.");
  return value;
}
function lines(value) {
  return value === void 0 ? [] : value.split("\n");
}
function withProxyKey(headers, config) {
  return (headers ? headers + "\n" : "") + `X-LangSmith-Proxy-Key: ${config.secret}`;
}
function keyLine(line) {
  return /^\s*x-langsmith-proxy-key\s*:/i.test(line);
}
function validateHeaders(value) {
  for (const line of lines(value)) {
    if (!line)
      continue;
    const match = /^([!#$%&'*+.^_`|~0-9A-Za-z-]+):[^\r\n]*$/.exec(line);
    if (!match || /^(authorization|proxy-authorization|x-api-key|x-langsmith-anthropic-passthrough)$/i.test(match[1]))
      return fail("Conflicting or malformed custom headers; review them privately before setup.");
    if (/^host$/i.test(match[1]))
      fail("Custom Host headers are unsupported by persistent setup. Remove the Host header explicitly so the client uses the loopback target; review headers privately.");
  }
}
function conflicting(guidance, path4, inEnvironment, inSettings) {
  const parts = [guidance];
  if (inEnvironment.length)
    parts.push(`Found in your environment: ${inEnvironment.join(", ")}.`, CONFLICT_ENVIRONMENT_GUIDANCE);
  if (inSettings.length)
    parts.push(`Found in your settings file ${path4}: ${inSettings.join(", ")}.`, CONFLICT_SETTINGS_GUIDANCE);
  parts.push(CONFLICT_RETRY_GUIDANCE);
  return fail(parts.join(" "));
}
function changedFields(config, next) {
  const before = { ...config, ...endpoints(config) };
  const after = { ...next, ...endpoints(next) };
  const keys = Object.keys(PINNED_FIELD_LABELS);
  return keys.filter((key) => before[key] !== after[key]).map((key) => PINNED_FIELD_LABELS[key]);
}
function settings(s) {
  const value = s ? object(JSON.parse(s.text)) : {};
  const env = value.env === void 0 ? {} : object(value.env);
  return { value, env };
}
function supportedHome(home, env) {
  if (env.CLAUDE_CONFIG_DIR && env.CLAUDE_CONFIG_DIR !== join7(home, ".claude"))
    fail("Custom CLAUDE_CONFIG_DIR is unsupported. Restart Claude Code with its default configuration directory, then use /langsmith-gateway:setup or /langsmith-gateway:disable.");
}
function lock(home) {
  directories(home, true);
  const dir = configDir(home);
  try {
    mkdirSync5(dir, { mode: 448 });
  } catch (e) {
    if (e.code !== "EEXIST")
      throw e;
  }
  privatePath(dir, true);
  const path4 = join7(dir, "settings.lock");
  try {
    mkdirSync5(path4, { mode: 448 });
  } catch {
    return fail("Another setup/disable is running or left settings.lock. Stop it before removing that lock directory and retrying.");
  }
  return () => rmdirSync(path4);
}
async function enable(entry2, args, env = process.env, home = userHome(), cwd = process.cwd()) {
  const requested = parseSetupArgs(args);
  supportedHome(home, env);
  loadConfig(home, true);
  const unlock = lock(home);
  try {
    const p = targetPaths(home, requested.scope, cwd);
    directory(dirname3(p.settings), true);
    const beforeSettings = snapshot(p.settings);
    const { value, env: savedEnv } = settings(beforeSettings);
    if (value.disableAllHooks === true)
      fail("Persistent setup requires hooks to restart the daemon. Set disableAllHooks to false or remove it explicitly from user settings before retrying; it will not be overwritten.");
    const authInEnvironment = PROVIDER_ROUTING.filter((key) => env[key] !== void 0);
    const authInSettings = PROVIDER_ROUTING.filter((key) => savedEnv[key] !== void 0);
    if (authInEnvironment.length || authInSettings.length)
      conflicting(CONFLICTING_AUTH_GUIDANCE, p.settings, authInEnvironment, authInSettings);
    if (value.apiKeyHelper !== void 0)
      fail("Conflicting apiKeyHelper. Remove it explicitly before setup; it will not be overwritten.");
    const base = text(savedEnv[BASE]), headers = text(savedEnv[HEADERS]);
    validateHeaders(headers);
    let config = loadConfig(home, true);
    const initiallyEnabled = loadConfig(home) !== void 0;
    const targets = routingTargets(home, cwd, config);
    const active = config ? targets.filter((item) => matchesRouting(routingEnv(item.saved), config)) : [];
    const settingsTargets = [.../* @__PURE__ */ new Set([...active.map((item) => item.path), p.settings])];
    if (settingsTargets.length > 128)
      fail("Too many active routing targets; disable unused scopes before setup.");
    const prior = !!config && matchesRouting(savedEnv, config);
    const port = requested.port ?? config?.port ?? 52507;
    const selected = requested.apiUrl === void 0 ? endpoints(config ?? {}) : endpoints(requested);
    const useClaudeSubscription = requested.useClaudeSubscription;
    const next = config ? {
      ...config,
      enabled: true,
      ...selected,
      useClaudeSubscription,
      profile: requested.profile ?? config.profile,
      port,
      identityTokenCommand: requested.identityTokenCommand ?? config.identityTokenCommand,
      identityTokenTtlMs: requested.identityTokenTtlMs ?? config.identityTokenTtlMs,
      workspaceId: requested.workspaceId ?? config.workspaceId
    } : void 0;
    const changed = config && next ? changedFields(config, next) : [];
    if (changed.length && (initiallyEnabled || active.length))
      fail(`Setup would change settings an active scope is already using: ${changed.join(", ")}. ${PINNED_CHANGE_GUIDANCE}`);
    const modeChanged = !!config && config.useClaudeSubscription !== useClaudeSubscription;
    const switching = initiallyEnabled && modeChanged;
    if (modeChanged && active.some((item) => item.path !== p.settings))
      fail("Subscription forwarding is shared. Disable every other active scope first, then retry setup for this scope; other scopes will not be silently switched.");
    if (switching && !prior)
      fail("Only the sole active configured target can switch subscription forwarding in place. Disable existing routing first, then retry setup.");
    const target = `http://127.0.0.1:${port}`;
    const ours = (value2) => value2 !== void 0 && value2 !== target && (sameHost(value2, selected.gatewayUrl) || sameHost(value2, UPSTREAM));
    const baseOverwritten = ours(env[BASE]) || ours(base);
    const baseInEnvironment = env[BASE] !== void 0 && env[BASE] !== target && !ours(env[BASE]) ? [BASE] : [];
    const baseInSettings = base !== void 0 && base !== target && !ours(base) ? [BASE] : [];
    if (baseInEnvironment.length || baseInSettings.length)
      conflicting(CONFLICTING_BASE_GUIDANCE, p.settings, baseInEnvironment, baseInSettings);
    const retainedHeaders = !!config && !prior && env[HEADERS] === withProxyKey(headers, config);
    if (env[HEADERS] !== void 0 && env[HEADERS] !== headers && !retainedHeaders && !(config && active.some(({ saved }) => routingEnv(saved)[HEADERS] === env[HEADERS])))
      fail("Inherited custom headers differ from the selected scope settings and do not match trusted local transport. Resolve the override privately before setup; it will not be copied into settings.");
    const expectedKey = config ? `X-LangSmith-Proxy-Key: ${config.secret}` : void 0;
    const keys = lines(headers).filter(keyLine);
    if (keys.length && (!config || keys.length !== 1 || keys[0] !== expectedKey))
      fail("Conflicting local proxy header; no different header will be replaced.");
    if (switching && (base !== target || keys.length !== 1))
      fail("Configured transport settings changed. Review them privately or disable this scope before switching subscription forwarding.");
    if (!config) {
      createConfig(requested.profile, port, home, selected, useClaudeSubscription, {
        identityTokenCommand: requested.identityTokenCommand,
        identityTokenTtlMs: requested.identityTokenTtlMs,
        workspaceId: requested.workspaceId
      });
      config = loadConfig(home);
    }
    let configSnapshot = snapshot(p.config, true);
    if (switching) {
      unchanged(p.settings, beforeSettings);
      for (const item of targets)
        unchangedRouting(item.path, item.saved);
      atomic(p.config, jsonText({ ...next, enabled: false }), configSnapshot);
      configSnapshot = snapshot(p.config, true);
    }
    if ((!initiallyEnabled || switching) && next) {
      await waitForStopped(config).catch(() => fail("Old proxy still draining or local port occupied. Config remains disabled; routing settings and requested mode are retained. Wait at least 35 seconds and retry the same setup options; resolve port conflicts privately without killing an unknown listener."));
      unchanged(p.config, configSnapshot, true);
      unchanged(p.settings, beforeSettings);
      for (const item of targets)
        unchangedRouting(item.path, item.saved);
      config = next;
    }
    if (!loadConfig(home))
      atomic(p.config, jsonText(config), configSnapshot);
    const currentConfig = snapshot(p.config, true);
    try {
      await ensure(config, entry2);
      directories(home);
      privatePath(configDir(home), true);
      unchanged(p.settings, beforeSettings);
      unchanged(p.config, currentConfig, true);
      for (const item of targets)
        unchangedRouting(item.path, item.saved);
      directory(dirname3(p.settings));
      const afterHeaders = keys.length ? headers : withProxyKey(headers, config);
      savedEnv[BASE] = target;
      savedEnv[HEADERS] = afterHeaders;
      value.env = savedEnv;
      const settingsChanged = base !== target || headers !== afterHeaders;
      transaction([
        {
          path: p.config,
          text: jsonText({
            ...config,
            settingsTargets
          }),
          prior: currentConfig
        },
        ...settingsChanged ? [{ path: p.settings, text: jsonText(value), prior: beforeSettings }] : []
      ]);
      return {
        settingsChanged,
        useClaudeSubscription: config.useClaudeSubscription,
        modeChanged,
        baseOverwritten
      };
    } catch (error) {
      if (!initiallyEnabled || switching) {
        const rolledBack = snapshot(p.config, true);
        if (rolledBack?.text !== currentConfig?.text)
          throw error;
        atomic(p.config, jsonText({ ...config, enabled: false }), rolledBack);
      }
      if (switching)
        fail("Gateway mode switch did not complete. Config remains disabled with the requested mode; routing settings are retained. Retry the same setup options after resolving local daemon readiness privately.");
      throw error;
    }
  } finally {
    unlock();
  }
}
function modeSummary(useClaudeSubscription, modeChanged) {
  return (useClaudeSubscription ? "Claude subscription credential forwarding enabled (gateway/provider eligibility applies). " : "OAuth-only gateway auth; native credentials are not forwarded. Gateway provider keys and provider billing apply. ") + (modeChanged ? "Daemon mode changed after draining; routing settings retained, with brief local downtime. " : "");
}
function disable(args, env = process.env, home = userHome(), cwd = process.cwd()) {
  const requested = parseDisableArgs(args);
  supportedHome(home, env);
  if (!loadConfig(home, true))
    return;
  const unlock = lock(home);
  try {
    const config = loadConfig(home, true);
    if (!config)
      return;
    const p = targetPaths(home, requested.scope, cwd);
    const targets = routingTargets(home, cwd, config);
    const configSnapshot = snapshot(p.config, true);
    const before = targets.find((item) => item.path === p.settings)?.saved;
    const { value, env: savedEnv } = settings(before);
    let routingRemoved = false;
    if (savedEnv[BASE] === `http://127.0.0.1:${config.port}`) {
      delete savedEnv[BASE];
      routingRemoved = true;
    }
    const current = text(savedEnv[HEADERS]);
    if (current !== void 0) {
      const remaining = lines(current).filter((line) => line !== proxyKeyLine(config));
      if (remaining.length !== lines(current).length) {
        routingRemoved = true;
        if (remaining.length)
          savedEnv[HEADERS] = remaining.join("\n");
        else
          delete savedEnv[HEADERS];
      }
    }
    if (routingRemoved && Object.keys(savedEnv).length === 0)
      delete value.env;
    else if (value.env !== void 0)
      value.env = savedEnv;
    const remainingTargets = targets.filter((item) => item.path !== p.settings && matchesRouting(routingEnv(item.saved), config));
    if (remainingTargets.length > 128)
      fail("Too many active routing targets; review the private target index before disable.");
    const writes = [];
    if (before && JSON.stringify(value) !== JSON.stringify(JSON.parse(before.text)))
      writes.push({ path: p.settings, text: jsonText(value), prior: before });
    writes.push({
      path: p.config,
      text: jsonText({
        ...config,
        enabled: loadConfig(home) !== void 0 && remainingTargets.length > 0,
        settingsTargets: remainingTargets.map((item) => item.path)
      }),
      prior: configSnapshot
    });
    for (const item of targets)
      unchangedRouting(item.path, item.saved);
    transaction(writes);
  } finally {
    unlock();
  }
}
function routingStatus(paths, config) {
  const current = routingSnapshot(paths.settings);
  const env = routingEnv(current);
  const prefix = `settings ${current ? "present" : "missing"}; `;
  if (!config)
    return prefix + "proxy setup is missing";
  if (matchesRouting(env, config))
    return prefix + "configured to use the local gateway proxy";
  const headers = env[HEADERS];
  const keys = typeof headers === "string" ? lines(headers).filter(keyLine) : [];
  if (env[BASE] === void 0 || env[BASE] === "")
    return prefix + (keys.length ? "gateway routing is incomplete; local proxy authentication header is present but Claude\u2019s saved API address is missing" : "gateway routing is not configured in this settings file");
  if (env[BASE] !== `http://127.0.0.1:${config.port}`)
    return prefix + "Claude\u2019s saved API address differs from this proxy\u2019s address";
  return prefix + (keys.length === 0 ? "local proxy authentication header is missing" : "local proxy authentication header does not match");
}

// dist/src/proxy/status.js
import { join as join8 } from "node:path";

// dist/src/proxy/credential-report.js
function signInSummary(config) {
  if (config.identityTokenCommand !== void 0)
    return SIGN_IN_COMMAND;
  return config.profile === void 0 ? SIGN_IN_CLI_DEFAULT : SIGN_IN_CLI_PROFILE(config.profile);
}
function workspaceSummary(config) {
  return config.workspaceId === void 0 ? WORKSPACE_UNSET : JSON.stringify(config.workspaceId);
}
var sooner = (a, b) => a === void 0 ? b : b === void 0 ? a : Math.min(a, b);
function credentialSummary(state) {
  const { sinceSuccessMs, sinceFailureMs, sinceRefusalMs } = state;
  const sinceBadMs = sooner(sinceFailureMs, sinceRefusalMs);
  if (sinceSuccessMs === void 0 && sinceBadMs === void 0)
    return CREDENTIAL_UNTRIED;
  if (sinceSuccessMs === void 0)
    return CREDENTIAL_NEVER_OBTAINED(SECONDS_AGO(sinceBadMs));
  if (sinceBadMs === void 0 || sinceBadMs > sinceSuccessMs)
    return CREDENTIAL_WORKING(SECONDS_AGO(sinceSuccessMs));
  return sinceBadMs === sinceRefusalMs ? CREDENTIAL_REFUSED(SECONDS_AGO(sinceRefusalMs), SECONDS_AGO(sinceSuccessMs)) : CREDENTIAL_COMMAND_FAILING(SECONDS_AGO(sinceFailureMs), SECONDS_AGO(sinceSuccessMs));
}
async function credentialStatus(config, reachable) {
  if (!reachable)
    return CREDENTIAL_NO_DAEMON;
  try {
    const reported = JSON.parse(await control(config, "GET", CREDENTIAL_STATE_PATH));
    return isCredentialState(reported) ? credentialSummary(reported) : CREDENTIAL_NO_ANSWER;
  } catch {
    return CREDENTIAL_NO_ANSWER;
  }
}

// dist/src/proxy/status.js
var STATUS_ERROR = "Gateway status unavailable; review config, settings, permissions and canonical project path privately. No changes made.";
async function gatewayStatus(args, env, home, cwd) {
  const { scope } = parseStatusArgs(args);
  try {
    if (env.CLAUDE_CONFIG_DIR && env.CLAUDE_CONFIG_DIR !== join8(home, ".claude"))
      throw new Error("Unsupported configuration directory");
    const scopes = scope ? [scope] : ["global", "project"];
    const targets = scopes.map((selected) => ({
      selected,
      paths: targetPaths(home, selected, cwd)
    }));
    const { state, config } = configStatus(home);
    const routes = targets.map(({ selected, paths }) => `  ${selected} ${JSON.stringify(paths.settings)}: ${routingStatus(paths, config)}.`);
    const shared = config ? `${state}; useClaudeSubscription ${config.useClaudeSubscription ? "on" : "off"}; API ${config.apiUrl}; gateway ${config.gatewayUrl}.` : "not configured.";
    const reachable = config !== void 0 && await healthy(config);
    const daemon = !config ? "not checked (proxy setup is missing)" : reachable ? `matching listener reachable${state === "disabled" ? " (saved config disabled; may be awaiting drain)" : ""}` : "not reachable or incompatible";
    const credential = config ? await credentialStatus(config, reachable) : CREDENTIAL_UNCONFIGURED;
    return [
      "Gateway status (read-only)",
      `Selected routing targets: ${scope ?? "global + current project"}`,
      ...routes,
      `Shared proxy configuration (applies to enabled scopes): ${shared}`,
      `How you sign in: ${config ? signInSummary(config) : "not configured"}.`,
      `Workspace sent with your requests: ${config ? workspaceSummary(config) : "not configured"}.`,
      `Shared daemon: ${daemon}.`,
      `Your credential is ${credential}.`,
      "This shows saved settings. Your current Claude session may still be using earlier settings. Configured forwarding mode does not verify actual Anthropic usage, authentication or subscription validity. Other projects may use the shared daemon."
    ].join("\n");
  } catch (error) {
    throw new SetupError(error instanceof ConfigError ? error.message : STATUS_ERROR);
  }
}

// dist/src/proxy/commands.js
async function handleGatewayInput(input, entry2, env = process.env, home = userHome(), output = (value) => process.stdout.write(JSON.stringify(value) + "\n")) {
  if (input.hook_event_name === "UserPromptSubmit" && typeof input.prompt === "string" && /^\/langsmith-gateway:(setup|disable|status)(?=\s|$)/.test(input.prompt)) {
    let reason;
    try {
      const command = parseGatewayCommand(input.prompt);
      if (!command)
        return;
      if (command.command === "setup") {
        const { settingsChanged, useClaudeSubscription, modeChanged, baseOverwritten } = await enable(entry2, command.args, env, home, input.cwd ?? "");
        reason = (baseOverwritten ? BASE_OVERWRITE_NOTICE : "") + (settingsChanged ? "Gateway settings saved for the selected scope; " : "Gateway settings already configured for the selected scope; ") + modeSummary(useClaudeSubscription, modeChanged) + "local daemon healthy. Authentication is checked on the first model request, not setup.";
      } else if (command.command === "status") {
        reason = await gatewayStatus(command.args, env, home, input.cwd ?? "");
      } else {
        disable(command.args, env, home, input.cwd ?? "");
        reason = "Gateway disabled for the selected scope; matching gateway routing settings removed (no previous values restored) and later edits preserved. Restart affected Claude sessions to stop using the proxy. Other known matching scopes remain active. After the last known active scope is disabled, the daemon drains (up to 5 seconds to notice, then up to 30 seconds for active work).";
      }
    } catch (error) {
      reason = error instanceof SetupError || error instanceof ConfigError ? error.message : "Gateway command failed; check private config, permissions, links, concurrent edits and port conflicts privately. " + COMMAND_GUIDANCE;
    }
    try {
      output({ decision: "block", reason });
    } catch {
      try {
        process.stderr.write("Gateway command response could not be written.\n");
      } catch {
        return;
      }
    }
    return;
  }
  await gatewayHook(input.hook_event_name, input.session_id, entry2, home);
}

// dist/src/utils/stdin.js
function readStdin() {
  return new Promise((resolve2, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => {
      try {
        resolve2(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Failed to parse hook input: ${err}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

// dist/src/hooks/gateway.js
var entry = fileURLToPath(import.meta.url);
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command !== void 0 && (command !== "daemon" || args.length !== 0))
    throw new SetupError(COMMAND_GUIDANCE);
  if (command === void 0) {
    const input = await readStdin();
    await handleGatewayInput(input, entry);
    return;
  }
  const config = loadConfig();
  if (!config)
    return;
  if (command === "daemon") {
    startLog(configDir());
    const { server, drain } = createProxy(config);
    const watch = setInterval(() => {
      try {
        const current = loadConfig();
        if (!current || identity(current) !== identity(config))
          drain();
      } catch {
        drain();
      }
    }, 5e3);
    watch.unref();
    server.on("close", () => clearInterval(watch));
    process.on("SIGTERM", drain);
    process.on("SIGINT", drain);
    server.once("error", () => process.exit(1));
    server.listen({ host: "127.0.0.1", port: config.port, exclusive: true });
  }
}
void main().catch((error) => {
  process.stderr.write(error instanceof SetupError || error instanceof ConfigError ? error.message + "\n" : "Experimental LangSmith proxy unavailable; check private config, settings permissions/symlinks, and local port conflicts. No sensitive error details are printed. " + COMMAND_GUIDANCE + "\n");
  if (process.argv.length > 2)
    process.exitCode = 1;
});
