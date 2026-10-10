var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
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
    function addListener(emitter, event2, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event2 : event2;
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
      var names2 = [], events, name;
      if (this._eventsCount === 0) return names2;
      for (name in events = this._events) {
        if (has2.call(events, name)) names2.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names2.concat(Object.getOwnPropertySymbols(events));
      }
      return names2;
    };
    EventEmitter.prototype.listeners = function listeners(event2) {
      var evt = prefix ? prefix + event2 : event2, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter.prototype.listenerCount = function listenerCount(event2) {
      var evt = prefix ? prefix + event2 : event2, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter.prototype.emit = function emit(event2, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event2 : event2;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event2, listeners.fn, void 0, true);
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
          if (listeners[i].once) this.removeListener(event2, listeners[i].fn, void 0, true);
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
    EventEmitter.prototype.on = function on(event2, fn, context) {
      return addListener(this, event2, fn, context, false);
    };
    EventEmitter.prototype.once = function once(event2, fn, context) {
      return addListener(this, event2, fn, context, true);
    };
    EventEmitter.prototype.removeListener = function removeListener(event2, fn, context, once) {
      var evt = prefix ? prefix + event2 : event2;
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
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event2) {
      var evt;
      if (event2) {
        evt = prefix ? prefix + event2 : event2;
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
        (val) => new Promise((resolve16) => {
          resolve16(onFinally());
        }).then(() => val),
        (err) => new Promise((resolve16) => {
          resolve16(onFinally());
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
    var pTimeout = (promise, milliseconds, fallback) => new Promise((resolve16, reject) => {
      if (typeof milliseconds !== "number" || milliseconds < 0) {
        throw new TypeError("Expected `milliseconds` to be a positive number");
      }
      if (milliseconds === Infinity) {
        resolve16(promise);
        return;
      }
      const timer = setTimeout(() => {
        if (typeof fallback === "function") {
          try {
            resolve16(fallback());
          } catch (error2) {
            reject(error2);
          }
          return;
        }
        const message = typeof fallback === "string" ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
        const timeoutError2 = fallback instanceof Error ? fallback : new TimeoutError(message);
        if (typeof promise.cancel === "function") {
          promise.cancel();
        }
        reject(timeoutError2);
      }, milliseconds);
      pFinally(
        // eslint-disable-next-line promise/prefer-await-to-then
        promise.then(resolve16, reject),
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
    var timeoutError2 = new p_timeout_1.TimeoutError();
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
          const delay3 = this._intervalEnd - now;
          if (delay3 < 0) {
            this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
          } else {
            if (this._timeoutId === void 0) {
              this._timeoutId = setTimeout(() => {
                this._onResumeInterval();
              }, delay3);
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
        return new Promise((resolve16, reject) => {
          const run = async () => {
            this._pendingCount++;
            this._intervalCount++;
            try {
              const operation = this._timeout === void 0 && options.timeout === void 0 ? fn() : p_timeout_1.default(Promise.resolve(fn()), options.timeout === void 0 ? this._timeout : options.timeout, () => {
                if (options.throwOnTimeout === void 0 ? this._throwOnTimeout : options.throwOnTimeout) {
                  reject(timeoutError2);
                }
                return void 0;
              });
              resolve16(await operation);
            } catch (error2) {
              reject(error2);
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
        return new Promise((resolve16) => {
          const existingResolve = this._resolveEmpty;
          this._resolveEmpty = () => {
            existingResolve();
            resolve16();
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
        return new Promise((resolve16) => {
          const existingResolve = this._resolveIdle;
          this._resolveIdle = () => {
            existingResolve();
            resolve16();
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

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/binary.js
import { arch as osArch, platform as osPlatform } from "node:os";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/constants.js
var DEFAULT_PUBLISHED_TARGETS = {
  darwin: ["arm64", "x64"]
};

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/target.js
function resolveTarget(options) {
  for (const field2 of ["executableName", "repository", "userAgent"]) {
    if (typeof options[field2] !== "string" || options[field2].trim() === "") {
      throw new Error(`the binary target needs a ${field2}`);
    }
  }
  return {
    executableName: options.executableName,
    repository: options.repository,
    userAgent: options.userAgent,
    releasesApiOverrideEnvVar: options.releasesApiOverrideEnvVar,
    publishedTargets: options.publishedTargets ?? DEFAULT_PUBLISHED_TARGETS
  };
}
function isPublishedTarget(target, platform, arch) {
  return target.publishedTargets[platform]?.includes(arch) ?? false;
}
function releaseAssetName(target, platform, arch, version) {
  return `${target.executableName}-${platform}-${arch}-${version}`;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/binary.js
function defineBinaryTarget(options) {
  const target = resolveTarget(options);
  return {
    target,
    supportsHost: (platform = osPlatform(), arch = osArch()) => isPublishedTarget(target, platform, arch),
    assetName: (platform, arch, version) => releaseAssetName(target, platform, arch, version)
  };
}

// dist/binary.config.json
var binary_config_default = { executableName: "langsmith-claude-code-tracing", repository: "langchain-ai/langsmith-claude-code-plugins" };

// dist/src/binary-target.js
var binary = defineBinaryTarget({
  executableName: binary_config_default.executableName,
  repository: binary_config_default.repository,
  userAgent: "langsmith-claude-code",
  releasesApiOverrideEnvVar: "CC_LANGSMITH_RELEASES_API"
});

// dist/src/config.js
import { readFileSync as readFileSync3 } from "node:fs";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/settings/constants.js
var COMMON_BOOLEAN_SETTINGS = {
  enabled: { default: false, restrictive: false },
  defaultMuted: { default: false, restrictive: true }
};

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/settings/common-config.js
import { lstatSync, readFileSync, statSync } from "node:fs";
function object(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function invalid(raw) {
  return {
    status: "invalid",
    common: { enabled: false, defaultMuted: true },
    ...raw === void 0 ? {} : { raw },
    diagnostics: [
      "Invalid or unreadable common config; ordinary fields discarded, privacy switches restricted."
    ]
  };
}
function parseReplica(value) {
  if (!object(value))
    return void 0;
  const replica = {};
  for (const [canonical, alias] of [
    ["api_url", "apiUrl"],
    ["api_key", "apiKey"],
    ["project", "projectName"]
  ]) {
    const selected = Object.hasOwn(value, canonical) ? canonical : alias;
    if (Object.hasOwn(value, selected)) {
      const entry = value[selected];
      if (typeof entry !== "string")
        return void 0;
      replica[canonical] = entry;
    }
  }
  if (Object.hasOwn(value, "updates")) {
    if (!object(value.updates))
      return void 0;
    replica.updates = value.updates;
  }
  return replica;
}
function parseCommonConfig(value) {
  if (!object(value))
    return invalid();
  const common = {};
  const diagnostics = [];
  for (const field2 of ["enabled", "defaultMuted"]) {
    if (!Object.hasOwn(value, field2))
      continue;
    const entry = value[field2];
    common[field2] = typeof entry === "boolean" ? entry : COMMON_BOOLEAN_SETTINGS[field2].restrictive;
    if (typeof entry !== "boolean")
      diagnostics.push(`Invalid ${field2}; using restrictive value.`);
  }
  for (const field2 of ["api_key", "api_url", "project"]) {
    if (!Object.hasOwn(value, field2))
      continue;
    if (typeof value[field2] !== "string")
      return invalid(value);
    common[field2] = value[field2];
  }
  if (Object.hasOwn(value, "redact")) {
    if (typeof value.redact !== "boolean")
      return invalid(value);
    common.redact = value.redact;
  }
  if (Object.hasOwn(value, "metadata")) {
    if (!object(value.metadata))
      return invalid(value);
    common.metadata = value.metadata;
  }
  if (Object.hasOwn(value, "replicas")) {
    if (!Array.isArray(value.replicas))
      return invalid(value);
    const replicas2 = [];
    for (const entry of value.replicas) {
      const replica = parseReplica(entry);
      if (replica === void 0)
        return invalid(value);
      replicas2.push(replica);
    }
    common.replicas = replicas2;
  }
  if (Object.hasOwn(value, "redact_extra_rules")) {
    if (!Array.isArray(value.redact_extra_rules))
      return invalid(value);
    const rules = [];
    for (const rule of value.redact_extra_rules) {
      if (!object(rule) || typeof rule.pattern !== "string" || !Object.hasOwn(rule, "pattern")) {
        return invalid(value);
      }
      const hasReplace = Object.hasOwn(rule, "replace");
      if (hasReplace && typeof rule.replace !== "string")
        return invalid(value);
      try {
        new RegExp(rule.pattern, "g");
      } catch {
        return invalid(value);
      }
      rules.push({
        pattern: rule.pattern,
        ...hasReplace ? { replace: rule.replace } : {}
      });
    }
    common.redact_extra_rules = rules;
  }
  return { status: "valid", common, raw: value, diagnostics };
}
function readCommonConfigFile(path3) {
  try {
    if (!statSync(path3).isFile())
      return invalid();
  } catch (error2) {
    if (error2.code === "ENOENT") {
      try {
        lstatSync(path3);
      } catch (lstatError) {
        if (lstatError.code === "ENOENT") {
          return { status: "absent", common: {}, diagnostics: [] };
        }
      }
    }
    return invalid();
  }
  try {
    return parseCommonConfig(JSON.parse(readFileSync(path3, "utf8")));
  } catch {
    return invalid();
  }
}
function resolveField(sources, field2) {
  return sources.find((source) => source[field2] !== void 0)?.[field2];
}
function mergeCommonConfig(sources, options = {}) {
  const { harness = {}, root = {}, user = {}, userRoot = {}, env = {}, defaults: defaults2 = {} } = sources;
  const files = [harness, root, user, userRoot];
  const precedence = [env, ...files, defaults2];
  const switches = options.envFirst ? precedence : [...files, env, defaults2];
  const merged = { enabled: false, defaultMuted: false, redact: true };
  for (const field2 of ["enabled", "defaultMuted"]) {
    merged[field2] = resolveField(switches, field2) ?? COMMON_BOOLEAN_SETTINGS[field2].default;
  }
  merged.api_key = resolveField(precedence, "api_key");
  merged.api_url = resolveField(precedence, "api_url");
  merged.project = resolveField(precedence, "project");
  merged.replicas = resolveField(precedence, "replicas");
  merged.redact = resolveField(precedence, "redact") ?? true;
  merged.redact_extra_rules = resolveField(precedence, "redact_extra_rules");
  if (precedence.some((source) => source.metadata !== void 0)) {
    merged.metadata = [...precedence].reverse().reduce((metadata, source) => ({ ...metadata, ...source.metadata }), {});
  }
  return merged;
}
function toSdkReplicas(replicas2) {
  return replicas2?.map((replica) => ({
    ...replica.api_url === void 0 ? {} : { apiUrl: replica.api_url },
    ...replica.api_key === void 0 ? {} : { apiKey: replica.api_key },
    ...replica.project === void 0 ? {} : { projectName: replica.project },
    ...replica.updates === void 0 ? {} : { updates: replica.updates }
  }));
}

// dist/src/config.js
import { homedir as homedir2, userInfo } from "node:os";
import { join as join2, resolve } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/metadata/constants.js
var CODING_AGENT_SCHEMA_VERSION = "coding-agent-v1";
var CODING_AGENT_PURPOSE = "coding";
var CODING_AGENT_RUN_TYPES = [
  "root",
  "llm",
  "tool",
  "subagent",
  "interrupted"
];
var CODING_AGENT_RUN_SCOPES = {
  all: CODING_AGENT_RUN_TYPES,
  rootInterrupted: ["root", "interrupted"],
  subagent: ["subagent"],
  tool: ["tool"],
  llmTool: ["llm", "tool"],
  chain: ["root", "subagent", "interrupted"]
};
var CODING_AGENT_SCHEMA_INTEGRATIONS = [
  "claude-code",
  "openai-codex",
  "deepagents-code",
  "cursor",
  "pi"
];
var CODING_AGENT_SUPPORTED_INTEGRATIONS = [
  "claude-code",
  "cursor",
  "openai-codex"
];
var CODING_AGENT_CORE_INTEGRATIONS = CODING_AGENT_SUPPORTED_INTEGRATIONS;
var CODING_AGENT_CODEX_INTEGRATION = ["openai-codex"];
var CODING_AGENT_AGENT_TYPES = ["root", "subagent", "middleware", "compaction"];
var CODING_AGENT_ALWAYS_FIELD_OPTIONS = {
  requirement: "always"
};
var CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS = {
  requirement: "where_known",
  requiredWhereKnown: true
};
var CODING_AGENT_FIELD_DEFAULTS = {
  appliesTo: CODING_AGENT_RUN_TYPES,
  type: "string",
  allowedValues: null,
  requirement: "contextual",
  requiredWhereKnown: false,
  metadataModeIntegrations: []
};
var CODING_AGENT_STRUCTURAL_FIELD_DEFAULTS = {
  metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS,
  metadataSource: "structural"
};
var CODING_AGENT_PROVIDER_FIELD_DEFAULTS = {
  metadataSource: "provider",
  providerIntegrations: CODING_AGENT_CORE_INTEGRATIONS
};
var CODING_AGENT_INTEGRATION_POLICIES = {
  "claude-code": {
    fullModePrecedence: "custom-wins",
    metadataModeUsesDirectMetadata: true,
    metadataModePreservesToolName: false,
    legacyAliases: true
  },
  cursor: {
    fullModePrecedence: "custom-wins",
    metadataModeUsesDirectMetadata: true,
    metadataModePreservesToolName: true,
    legacyAliases: false
  },
  "openai-codex": {
    fullModePrecedence: "structural-wins",
    metadataModeUsesDirectMetadata: false,
    metadataModePreservesToolName: false,
    legacyAliases: false
  }
};
var TRUSTED_METADATA = /* @__PURE__ */ Symbol("coding-agent trusted metadata");
var METADATA_MODE_STATUS_VALUES = ["running", "completed", "error"];
var METADATA_MODE_NAME = "metadata";
var CODING_AGENT_METADATA_PROVENANCE_FIELDS = [
  "integration",
  "integrationVersion",
  "runtimeVersion",
  "threadId",
  "turnId",
  "turnNumber",
  "agentType",
  "runType",
  "approvalPolicy",
  "subagentId",
  "subagentType",
  "clearSubagent",
  "toolName",
  "runName",
  "skillName",
  "modelName",
  "usageMetadata",
  "providerMetadata",
  "runSpecific",
  "base"
];
var CODING_AGENT_METADATA_PROJECTION_FIELDS = [
  ["integrationVersion", "ls_integration_version"],
  ["runtimeVersion", "ls_agent_runtime_version"],
  ["turnId", "turn_id"],
  ["turnNumber", "turn_number"],
  ["approvalPolicy", "approval_policy"],
  ["subagentId", "ls_subagent_id"],
  ["subagentType", "ls_subagent_type"],
  ["skillName", "ls_skill_name"],
  ["modelName", "ls_model_name"]
];

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/metadata/contract.js
function field(key, options = {}) {
  return { key, ...CODING_AGENT_FIELD_DEFAULTS, ...options };
}
var structural = (key, options = {}) => field(key, { ...CODING_AGENT_STRUCTURAL_FIELD_DEFAULTS, ...options });
var provider = (key, options = {}) => field(key, { ...CODING_AGENT_PROVIDER_FIELD_DEFAULTS, ...options });
var CODING_AGENT_V1_CONTRACT = {
  schemaVersion: CODING_AGENT_SCHEMA_VERSION,
  integrations: CODING_AGENT_SCHEMA_INTEGRATIONS,
  runtimeNames: {
    "claude-code": "Claude Code",
    "openai-codex": "Codex",
    "deepagents-code": "Deep Agents Code",
    cursor: "Cursor",
    pi: "Pi"
  },
  keys: [
    structural("ls_agent_purpose", {
      ...CODING_AGENT_ALWAYS_FIELD_OPTIONS,
      allowedValues: [CODING_AGENT_PURPOSE]
    }),
    structural("ls_integration", {
      ...CODING_AGENT_ALWAYS_FIELD_OPTIONS,
      allowedValues: CODING_AGENT_SCHEMA_INTEGRATIONS
    }),
    structural("ls_agent_runtime", {
      ...CODING_AGENT_ALWAYS_FIELD_OPTIONS,
      allowedValues: ["Claude Code", "Codex", "Deep Agents Code", "Cursor", "Pi"]
    }),
    structural("thread_id", CODING_AGENT_ALWAYS_FIELD_OPTIONS),
    structural("ls_trace_schema_version", {
      ...CODING_AGENT_ALWAYS_FIELD_OPTIONS,
      allowedValues: [CODING_AGENT_SCHEMA_VERSION]
    }),
    structural("ls_agent_type", {
      ...CODING_AGENT_ALWAYS_FIELD_OPTIONS,
      allowedValues: CODING_AGENT_AGENT_TYPES
    }),
    structural("ls_integration_version", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    structural("ls_agent_runtime_version", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    structural("turn_id", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    structural("turn_number", { ...CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS, type: "integer" }),
    field("repository_url", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("repository_provider", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("repository_name", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("git_branch", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("git_commit_sha", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("cwd", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("ls_skill_name", {
      appliesTo: CODING_AGENT_RUN_SCOPES.tool,
      metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS
    }),
    field("ls_attribution_identifier"),
    field("user_id"),
    field("local_username"),
    field("user_email"),
    field("sandbox_type"),
    field("approval_policy", { appliesTo: CODING_AGENT_RUN_SCOPES.rootInterrupted }),
    field("ls_subagent_id", {
      appliesTo: CODING_AGENT_RUN_SCOPES.subagent,
      metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS
    }),
    field("ls_subagent_type", {
      appliesTo: CODING_AGENT_RUN_SCOPES.subagent,
      metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS
    }),
    field("ls_tool_name", {
      appliesTo: CODING_AGENT_RUN_SCOPES.tool,
      metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS
    }),
    provider("ls_provider", {
      appliesTo: CODING_AGENT_RUN_SCOPES.llmTool,
      metadataModeIntegrations: CODING_AGENT_CODEX_INTEGRATION
    }),
    provider("ls_model_type", {
      appliesTo: CODING_AGENT_RUN_SCOPES.llmTool,
      metadataModeIntegrations: CODING_AGENT_CODEX_INTEGRATION,
      providerIntegrations: CODING_AGENT_CODEX_INTEGRATION
    }),
    provider("ls_message_format", {
      metadataModeIntegrations: CODING_AGENT_CODEX_INTEGRATION,
      providerIntegrations: CODING_AGENT_CODEX_INTEGRATION
    }),
    provider("codex_cli_version", {
      metadataModeIntegrations: CODING_AGENT_CODEX_INTEGRATION,
      providerIntegrations: CODING_AGENT_CODEX_INTEGRATION
    }),
    provider("ls_raw_aggregated_usage", {
      appliesTo: CODING_AGENT_RUN_SCOPES.chain,
      type: "object",
      metadataModeIntegrations: CODING_AGENT_CODEX_INTEGRATION,
      providerIntegrations: CODING_AGENT_CODEX_INTEGRATION
    }),
    provider("ls_invocation_params", {
      appliesTo: CODING_AGENT_RUN_SCOPES.llmTool,
      type: "object"
    }),
    field("usage_metadata", {
      type: "object",
      metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS,
      metadataSource: "explicit"
    }),
    field("ls_model_name", {
      metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS,
      metadataSource: "explicit"
    })
  ],
  integrationPolicies: CODING_AGENT_INTEGRATION_POLICIES
};

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/metadata/validation.js
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function metadataFieldTypeIssue(field2, value) {
  const matchesType = field2.type === "string" ? typeof value === "string" && value.length > 0 : field2.type === "integer" ? typeof value === "number" && Number.isSafeInteger(value) && value >= 1 : isRecord(value);
  if (!matchesType)
    return "type";
  return void 0;
}
function metadataFieldValueIssue(field2, value) {
  const typeIssue = metadataFieldTypeIssue(field2, value);
  if (typeIssue)
    return typeIssue;
  if (field2.allowedValues && !field2.allowedValues.includes(value))
    return "value";
  return void 0;
}
function validateProviderMetadata(value, integration, runType) {
  if (!isRecord(value))
    return [{ key: "", reason: "type" }];
  const issues = [];
  for (const [key, entry] of Object.entries(value)) {
    const field2 = CODING_AGENT_V1_CONTRACT.keys.find((candidate) => candidate.key === key);
    if (field2?.metadataSource !== "provider") {
      issues.push({ key, reason: "scope" });
      continue;
    }
    if (!field2.providerIntegrations?.includes(integration)) {
      issues.push({ key, reason: "integration" });
      continue;
    }
    if (!field2.appliesTo.includes(runType)) {
      issues.push({ key, reason: "scope" });
      continue;
    }
    const reason = metadataFieldValueIssue(field2, entry);
    if (reason)
      issues.push({ key, reason });
  }
  return issues;
}
function normalizeProviderMetadata(value, integration, runType) {
  if (!isRecord(value))
    return {};
  const issues = new Map(validateProviderMetadata(value, integration, runType).map((issue) => [issue.key, issue]));
  return Object.fromEntries(Object.entries(value).filter(([key, entry]) => entry !== void 0 && !issues.has(key)));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/metadata/builder.js
function buildCodingAgentMetadata(options) {
  const policy = CODING_AGENT_INTEGRATION_POLICIES[options.integration];
  const identity = {
    ls_agent_purpose: CODING_AGENT_PURPOSE,
    ls_integration: options.integration,
    ls_agent_runtime: CODING_AGENT_V1_CONTRACT.runtimeNames[options.integration],
    ls_trace_schema_version: CODING_AGENT_SCHEMA_VERSION,
    ls_agent_type: options.agentType,
    thread_id: options.threadId
  };
  if (options.integrationVersion)
    identity.ls_integration_version = options.integrationVersion;
  if (options.runtimeVersion)
    identity.ls_agent_runtime_version = options.runtimeVersion;
  if (options.turnId)
    identity.turn_id = options.turnId;
  if (typeof options.turnNumber === "number")
    identity.turn_number = options.turnNumber;
  if (options.approvalPolicy)
    identity.approval_policy = options.approvalPolicy;
  if (options.clearSubagent) {
    identity.ls_subagent_id = void 0;
    identity.ls_subagent_type = void 0;
  } else {
    if (options.subagentId)
      identity.ls_subagent_id = options.subagentId;
    if (options.subagentType)
      identity.ls_subagent_type = options.subagentType;
  }
  if (options.toolName) {
    if (policy.legacyAliases)
      identity.tool_name = options.toolName;
    if (options.runName && options.toolName !== options.runName) {
      identity.ls_tool_name = options.toolName;
    }
  }
  if (options.skillName)
    identity.ls_skill_name = options.skillName;
  if (policy.legacyAliases && options.subagentId)
    identity.agent_id = options.subagentId;
  if (policy.legacyAliases && options.subagentType)
    identity.agent_type = options.subagentType;
  const explicit = {};
  if (options.modelName !== void 0)
    explicit.ls_model_name = options.modelName;
  if (options.usageMetadata !== void 0)
    explicit.usage_metadata = options.usageMetadata;
  const provider2 = normalizeProviderMetadata(options.providerMetadata, options.integration, options.runType);
  const trusted = { ...identity, ...explicit, ...provider2 };
  if (policy.metadataModePreservesToolName && options.toolName) {
    trusted.ls_tool_name = options.toolName;
  }
  const pieces = [identity, explicit, provider2, options.runSpecific, options.base];
  const full = policy.fullModePrecedence === "custom-wins" ? pieces : pieces.toReversed();
  const result = {};
  for (const piece of full) {
    if (piece)
      Object.assign(result, piece);
  }
  Object.defineProperty(result, TRUSTED_METADATA, { value: trusted });
  return result;
}
function trustedCodingAgentMetadata(metadata) {
  return metadata?.[TRUSTED_METADATA];
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/capture/constants.js
var CAPTURE_DIRECTORY = "capture-v1";
var CAPTURE_RECORD_VERSION = 2;
var CAPTURE_RECEIPT_VERSION = 1;
var CAPTURE_DIRECTORY_MODE = 448;
var CAPTURE_FILE_MODE = 384;
var CAPTURE_INTEGRATION = /^[a-z][a-z0-9-]{0,62}$/;
var CAPTURE_MAX_IDENTIFIER_BYTES = 4096;
var CAPTURE_HASH = /^[0-9a-f]{64}$/u;
var CAPTURE_EVENT_FILE = /^[0-9a-f]{64}\.json$/u;
var CAPTURE_STAGING_FILE = /^\.[0-9a-f-]{36}\.tmp$/u;
var JSON_ARRAY_INDEX_KEY = /^(0|[1-9]\d*)$/u;

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/capture/utils/serialization.js
function canonicalJson(value) {
  const result = JSON.stringify(canonicalValue(value, /* @__PURE__ */ new Set()));
  if (result === void 0)
    throw new TypeError("Value cannot be serialized as JSON");
  return result;
}
function canonicalValue(value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number" && Number.isFinite(value))
    return value;
  if (Array.isArray(value)) {
    if (seen.has(value))
      throw new TypeError("Cyclic data cannot be captured");
    seen.add(value);
    const descriptors2 = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(descriptors2).some((key) => typeof key === "symbol" || key !== "length" && (!JSON_ARRAY_INDEX_KEY.test(key) || Number(key) >= value.length))) {
      throw new TypeError("Array properties cannot be captured");
    }
    if (Object.keys(descriptors2).length - 1 < value.length)
      throw new TypeError("Sparse arrays cannot be captured");
    const result2 = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors2[index];
      if (!descriptor?.enumerable || !("value" in descriptor))
        throw new TypeError("Sparse arrays cannot be captured");
      result2.push(canonicalValue(descriptor.value, seen));
    }
    seen.delete(value);
    return result2;
  }
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    throw new TypeError("Capture data must contain only JSON values");
  }
  if (seen.has(value))
    throw new TypeError("Cyclic data cannot be captured");
  seen.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).some((key) => typeof key === "symbol"))
    throw new TypeError("Symbol keys cannot be captured");
  const result = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(descriptors).toSorted()) {
    const descriptor = descriptors[key];
    if (!descriptor?.enumerable || !("value" in descriptor))
      throw new TypeError("Capture data must use enumerable data fields");
    result[key] = canonicalValue(descriptor.value, seen);
  }
  seen.delete(value);
  return result;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/utils/validation/objects.js
function isPlainRecord(value) {
  return value !== null && typeof value === "object" && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function requirePlainRecord(value, name) {
  if (!isPlainRecord(value))
    throw new TypeError(`${name} must be a plain object`);
  return value;
}
function ownDataField(source, key) {
  const descriptor = Object.getOwnPropertyDescriptor(source, key);
  if (!descriptor?.enumerable || !("value" in descriptor))
    return { present: false };
  return { present: true, value: descriptor.value };
}
function requireOwnDataField(source, key) {
  const field2 = ownDataField(source, key);
  if (!field2.present)
    throw new TypeError(`${key} is required`);
  return field2.value;
}
function canonicalJsonValue(value) {
  return canonicalValue(value, /* @__PURE__ */ new Set());
}
function canonicalJsonObject(value, name) {
  return canonicalValue(requirePlainRecord(value, name), /* @__PURE__ */ new Set());
}
function canonicalJsonArray(value, name) {
  if (!Array.isArray(value))
    throw new TypeError(`${name} must be an array`);
  return canonicalValue(value, /* @__PURE__ */ new Set());
}
function requireNonBlankString(value, name) {
  if (typeof value !== "string" || value.trim().length === 0)
    throw new TypeError(`${name} is required`);
  return value;
}
function requireString(value, name) {
  if (typeof value !== "string")
    throw new TypeError(`${name} must be a string`);
  return value;
}
function requireBoolean(value, name) {
  if (typeof value !== "boolean")
    throw new TypeError(`${name} must be a boolean`);
  return value;
}
function requireStringArray(value, name) {
  const values = canonicalJsonArray(value, name);
  if (!values.every((entry) => typeof entry === "string"))
    throw new TypeError(`${name} must contain strings`);
  return values;
}
function requireTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value) && Number.isFinite(new Date(value).getTime())) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0 && Number.isFinite(new Date(value).getTime())) {
    return value;
  }
  throw new TypeError("Run timestamp must be a valid date or millisecond time");
}
function requireSafeEpochMilliseconds(value, name) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || !Number.isFinite(new Date(value).getTime())) {
    throw new TypeError(`${name} must be a valid millisecond timestamp`);
  }
  return value;
}
function requireNonNegativeInteger(value, name) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new TypeError(`${name} must be a non-negative safe integer`);
  return value;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/metadata/privacy.js
function projectCodingAgentMetadata(metadata, integration, status) {
  const safe = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    const field2 = CODING_AGENT_V1_CONTRACT.keys.find((entry) => entry.key === key);
    if (!field2?.metadataModeIntegrations.includes(integration) || value === void 0 || metadataFieldTypeIssue(field2, value) !== void 0) {
      continue;
    }
    safe[key] = value;
  }
  safe.status = METADATA_MODE_STATUS_VALUES.includes(status) ? status : "running";
  safe.ls_tracing_mode = METADATA_MODE_NAME;
  return safe;
}
function metadataForMode(metadata, integration, mode = "full", status) {
  if (mode === "full")
    return metadata;
  const trusted = trustedCodingAgentMetadata(metadata);
  const source = trusted ?? (CODING_AGENT_INTEGRATION_POLICIES[integration].metadataModeUsesDirectMetadata ? metadata : void 0);
  return projectCodingAgentMetadata(source, integration, status);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/metadata/provenance.js
function prepareCodingAgentMetadataProvenance(value, integration, mode, status = "running") {
  const source = requirePlainRecord(value, "Run metadata");
  const declaredIntegration = ownDataField(source, "integration");
  if (declaredIntegration.present && declaredIntegration.value !== integration) {
    throw new TypeError("Run metadata integration does not match the lifecycle bridge");
  }
  const selected = {};
  for (const key of CODING_AGENT_METADATA_PROVENANCE_FIELDS) {
    const field2 = ownDataField(source, key);
    if (field2.present && field2.value !== void 0)
      selected[key] = field2.value;
  }
  selected["integration"] = integration;
  const threadId = selected["threadId"];
  if (typeof threadId !== "string" || threadId.trim().length === 0)
    return { status: "deferred" };
  const agentType = selected["agentType"];
  if (typeof agentType !== "string" || !CODING_AGENT_AGENT_TYPES.includes(agentType)) {
    throw new TypeError("Run metadata has an invalid agent type");
  }
  const runType = selected["runType"];
  if (typeof runType !== "string" || !CODING_AGENT_RUN_TYPES.includes(runType)) {
    throw new TypeError("Run metadata has an invalid run type");
  }
  for (const key of ["usageMetadata", "providerMetadata", "runSpecific", "base"]) {
    if (selected[key] !== void 0)
      selected[key] = canonicalJsonObject(selected[key], `Run metadata ${key}`);
  }
  selected["providerMetadata"] = normalizeProviderMetadata(selected["providerMetadata"], integration, runType);
  if (mode === "metadata") {
    delete selected["base"];
    delete selected["runSpecific"];
  }
  const options = selected;
  return {
    status: "ready",
    value: mode === "metadata" ? projectMetadataProvenance(options, integration, status) : options
  };
}
function projectMetadataProvenance(options, integration, status) {
  const projection = metadataForMode(buildCodingAgentMetadata(options), integration, "metadata", status) ?? {};
  const safe = {
    integration,
    threadId: projectedString(projection, "thread_id"),
    agentType: projectedString(projection, "ls_agent_type"),
    runType: options.runType
  };
  for (const [optionKey, metadataKey] of CODING_AGENT_METADATA_PROJECTION_FIELDS) {
    if (Object.hasOwn(projection, metadataKey))
      safe[optionKey] = projection[metadataKey];
  }
  if (options.clearSubagent === true)
    safe["clearSubagent"] = true;
  if (typeof options.toolName === "string" && (projection["ls_tool_name"] === options.toolName || projection["tool_name"] === options.toolName)) {
    safe["toolName"] = options.toolName;
    if (typeof options.runName === "string")
      safe["runName"] = options.runName;
  }
  if (Object.hasOwn(projection, "usage_metadata"))
    safe["usageMetadata"] = projection["usage_metadata"];
  const provider2 = normalizeProviderMetadata(options.providerMetadata, integration, options.runType);
  const allowedProvider = Object.fromEntries(Object.entries(provider2).filter(([key]) => Object.hasOwn(projection, key)));
  if (Object.keys(allowedProvider).length > 0)
    safe["providerMetadata"] = allowedProvider;
  return safe;
}
function projectedString(source, key) {
  const value = source[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`Metadata projection ${key} is required`);
  }
  return value;
}

// dist/src/logger.js
import { appendFileSync, mkdirSync, statSync as statSync2, renameSync } from "node:fs";
import { dirname } from "node:path";
var MAX_LOG_BYTES = 5 * 1024 * 1024;
var LOG_FILE = process.env.CC_LANGSMITH_LOG_FILE ?? `${process.env.HOME ?? ""}/.claude/state/hook.log`;
var debugEnabled = false;
function initLogger(debug2) {
  debugEnabled = debug2;
  mkdirSync(dirname(LOG_FILE), { recursive: true });
}
function rotateIfNeeded() {
  try {
    if (statSync2(LOG_FILE).size >= MAX_LOG_BYTES) {
      renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  } catch {
  }
}
function write(level, message) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").replace("Z", "");
  const line = `${timestamp2} [${level}] ${message}
`;
  try {
    rotateIfNeeded();
    appendFileSync(LOG_FILE, line);
  } catch {
  }
}
function log(message) {
  write("INFO", message);
}
function warn(message) {
  write("WARN", message);
}
function error(message) {
  write("ERROR", message);
}
function debug(message) {
  if (debugEnabled) {
    write("DEBUG", message);
  }
}

// dist/src/config.js
import { execSync } from "node:child_process";

// dist/src/constants.js
var USER_PROMPT_TURN_NAME = "Claude Code Turn";
var ASSISTANT_RUN_NAME = "Claude";
var CLAUDE_CODE_INTEGRATION = "claude-code";
var CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX = ":native-tool";
var CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX = ":reconstruct-tool";
var CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX = ":reconstruct-run";
var CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX = ":run-snapshot";
var CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR = ":";
var CLAUDE_TURN_CLOSURE_EVENT_SUFFIX = ":turn-closure";
var CLAUDE_TURN_FAILURE_EVENT_SUFFIX = ":turn-failure";
var CLAUDE_AGENT_CLOSURE_EVENT_SUFFIX = ":agent-closure";
var CLAUDE_TURN_PROGRESS_EVENT_SUFFIX = ":turn-progress";
var CLAUDE_SETTLEMENT_EVENT_KIND = "run-settlement-patch";
var TRUSTED_INTEGRATION_VERSION = true ? "0.4.2" : process.env.CC_LANGSMITH_INTEGRATION_VERSION || void 0;
var HOOK_EVENT_NAMES = [
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "StopFailure",
  "SubagentStop",
  "PreCompact",
  "PostCompact",
  "SessionEnd"
];
var CURSOR_VERSION_FIELD = "cursor_version";
var GIT_LOCATION_ENV_KEYS = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_COMMON_DIR",
  "GIT_INDEX_FILE",
  "GIT_CEILING_DIRECTORIES"
];
var NOT_A_REPOSITORY = /not a git repository \(or any of the parent directories\)/i;
var TOOL_PATH_INPUT_KEYS = ["file_path", "notebook_path", "path", "cwd"];
var GIT_DIRECTORY_NAME = ".git";
var GIT_MARKERS = {
  REPOSITORY_ROOT: "repository root",
  ONLY_GIT_CAN_SAY: "only git can say",
  NOTHING_HERE: "nothing here"
};
var TURN_REPOSITORY_KEYS = [
  "repository_name",
  "repository_provider",
  "repository_url",
  "git_branch",
  "git_commit_sha"
];
var REPOSITORY_METADATA_KEYS = [...TURN_REPOSITORY_KEYS, "ls_attribution_identifier"];
var PINNED_REPOSITORY_KEYS = /* @__PURE__ */ Symbol("pinned repository metadata keys");
var NO_PINNED_KEYS = /* @__PURE__ */ new Set();
var QUEUE_DIR_NAME = "langsmith_queue";
var QUEUE_FILE_SUFFIX = ".queue.json";
var QUEUE_SESSION_UNSAFE_CHARS = /[^\w.-]/g;
var QUEUE_TEMP_SUFFIX = ".queue.tmp";
var STATE_TEMP_SUFFIX = ".state.tmp";
var STATE_LOCK_RELEASE_WARNING = "Could not release the shared state lock";
var LOCK_STAGING_SUFFIX = ".lock.staging";
var PRIVATE_DIR_MODE = 448;
var PRIVATE_FILE_MODE = 384;
var QUEUE_ORIGIN_LENGTH = 12;
var QUEUE_ID_TIME_WIDTH = 16;
var QUEUE_MAX_ENTRIES = 500;
var QUEUE_RUN_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
var FOREIGN_QUEUE_MIN_RECORD_AGE_MS = 2 * 60 * 60 * 1e3;
var EMPTY_QUEUE_MIN_IDLE_MS = 2 * 60 * 60 * 1e3;
var FLUSH_QUEUE_ARG = "--flush-queue";
var GH_LOGIN_COMMAND = "gh";
var GH_LOGIN_ARGUMENTS = ["api", "user", "--jq", ".login"];
var GH_LOGIN_TIMEOUT_MS = 5e3;
var GH_LOGIN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
var JQ_NULL_OUTPUT = "null";
var STATE_FILE_DEFAULT = [".claude", "state", "langsmith_state.json"];
var GH_LOGIN_MARKER_FILE = "langsmith_gh_login.json";
var GH_LOGIN_RETRY_AFTER_MS = 24 * 60 * 60 * 1e3;
var TURN_RECORD_DIR_NAME = "langsmith_turns";
var TURN_RECORD_SUFFIX = ".turn.jsonl";
var SHARED_ENGINE_STORAGE_DIRECTORY = "langsmith_engine_v1";
var TURN_RECORD_MAX_BYTES = 8 * 1024 * 1024;
var TURN_RECORD_VALIDATION_LIMITS = {
  originLength: 512,
  pathLength: 16384,
  toolUseIdLength: 512,
  toolNameLength: 512,
  resolvedMetadataValueLength: 4096
};
var TURN_RECORD_TOOL_ORIGIN_KEYS = [
  "toolUseId",
  "toolName",
  "order",
  "origin",
  "pinnedRepositoryKeys",
  "resolvedMetadata"
];
var TURN_RECORD_TOOL_ORIGIN_FIELDS = ["path", "cwd", "namedAPath"];
var TURN_RECORD_ORIGIN_NULL_CHARACTER = "\0";
var LEGACY_PROVIDER_METADATA_KEYS = [
  "ls_provider",
  "ls_model_type",
  "ls_message_format",
  "codex_cli_version",
  "ls_raw_aggregated_usage",
  "ls_invocation_params"
];
var LEGACY_RUN_STRING_FIELDS = [
  "end_time",
  "parent_run_id",
  "trace_id",
  "dotted_order",
  "error",
  "reference_example_id"
];
var LEGACY_RUN_OBJECT_FIELDS = ["outputs", "serialized"];
var REPOSITORY_NAME_KEY = "repository_name";
var ATTRIBUTION_IDENTIFIER_KEY = "ls_attribution_identifier";
var UPDATE_ALREADY_RECEIVED_STATUS = 409;
var RECORDED_RUN_FALLBACK_TYPE = "tool";
var TURN_RECORD_LINE = {
  run: "run",
  toolOrigin: "tool-origin",
  closed: "closed",
  delivered: "ok",
  reconciled: "fixed"
};

// dist/src/utils/gh-login.js
import { execFileSync } from "node:child_process";
import { mkdirSync as mkdirSync2, readFileSync as readFileSync2, renameSync as renameSync2, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname as dirname2, join } from "node:path";
function isLogin(printed) {
  return printed !== JQ_NULL_OUTPUT && GH_LOGIN_PATTERN.test(printed);
}
function markerPath() {
  const stateFile = process.env.STATE_FILE ?? join(homedir(), ...STATE_FILE_DEFAULT);
  return join(dirname2(stateFile), GH_LOGIN_MARKER_FILE);
}
function failedRecently() {
  try {
    const marker = JSON.parse(readFileSync2(markerPath(), "utf-8"));
    const failed = new Date(marker.failed).getTime();
    const since = Date.now() - failed;
    return since >= 0 && since < GH_LOGIN_RETRY_AFTER_MS;
  } catch {
    return false;
  }
}
function recordFailure() {
  try {
    const path3 = markerPath();
    mkdirSync2(dirname2(path3), { recursive: true });
    const partial = `${path3}.${process.pid}`;
    const marker = { failed: (/* @__PURE__ */ new Date()).toISOString() };
    writeFileSync(partial, JSON.stringify(marker));
    renameSync2(partial, path3);
  } catch {
  }
}
var alreadyTried = false;
var login;
function githubLogin() {
  if (alreadyTried)
    return login;
  alreadyTried = true;
  if (failedRecently())
    return void 0;
  try {
    const printed = execFileSync(GH_LOGIN_COMMAND, GH_LOGIN_ARGUMENTS, {
      encoding: "utf-8",
      timeout: GH_LOGIN_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (isLogin(printed))
      login = printed;
  } catch {
  }
  if (login === void 0)
    recordFailure();
  return login;
}

// dist/src/config.js
var LS_INTEGRATION_VERSION = true ? "0.4.2" : process.env.CC_LANGSMITH_INTEGRATION_VERSION || void 0;
var PROVIDER_HOSTS = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
  devAzure: "dev.azure.com"
};
function readAnthropicUserId() {
  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (!homeDir)
    return void 0;
  const configPath = join2(homeDir, ".claude.json");
  try {
    const raw = readFileSync3(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    const userId = parsed?.userID;
    if (typeof userId === "string" && userId.length > 0) {
      return userId;
    }
  } catch (err) {
    debug(`Could not read Anthropic user ID from ${configPath}: ${err}`);
  }
  return void 0;
}
function readLocalUsername() {
  return userInfo().username;
}
var GIT_PROVIDERS = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
  "dev.azure.com": "devAzure"
};
function parseRepoName(remoteUrl) {
  const value = remoteUrl.trim();
  try {
    const url = new URL(value);
    const provider2 = GIT_PROVIDERS[url.hostname.toLowerCase()];
    const name = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
    if (provider2 && name)
      return { provider: provider2, name };
  } catch {
  }
  const scpMatch = value.match(/^(?:[^@]+@)?([^:]+):\/?(.+)$/);
  if (scpMatch) {
    const provider2 = GIT_PROVIDERS[scpMatch[1].toLowerCase()];
    const name = scpMatch[2].replace(/\/+$/, "").replace(/\.git$/, "");
    if (provider2 && name)
      return { provider: provider2, name };
  }
  return void 0;
}
function gitOutput(command, cwd) {
  const env = { ...process.env, LC_ALL: "C", LANG: "C" };
  for (const key of GIT_LOCATION_ENV_KEYS)
    delete env[key];
  return execSync(command, {
    cwd,
    env,
    encoding: "utf-8",
    timeout: 5e3,
    stdio: ["ignore", "pipe", "pipe"]
  });
}
function getRepoName(cwd) {
  try {
    const output = gitOutput("git remote -v", cwd);
    const lines = output.trim().split("\n").filter(Boolean);
    const remotes = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && line.includes("(fetch)")) {
        remotes.push({ name: parts[0], url: parts[1] });
      }
    }
    const origin = remotes.find((r) => r.name === "origin");
    if (origin) {
      const name = parseRepoName(origin.url + " ");
      if (name)
        return name;
    }
    for (const remote of remotes) {
      const name = parseRepoName(remote.url + " ");
      if (name)
        return name;
    }
  } catch {
  }
  return void 0;
}
function pinnedRepositoryKeys(metadata) {
  return metadata?.[PINNED_REPOSITORY_KEYS] ?? NO_PINNED_KEYS;
}
function getRepoUrl(provider2, name) {
  const host = PROVIDER_HOSTS[provider2];
  return host ? `https://${host}/${name}` : void 0;
}
function getRepoRoot(cwd) {
  try {
    const root = gitOutput("git rev-parse --show-toplevel", cwd).trim();
    return root ? resolve(root) : void 0;
  } catch (err) {
    const stderr = String(err?.stderr ?? "");
    return NOT_A_REPOSITORY.test(stderr) ? null : void 0;
  }
}
function getGitUserName(cwd) {
  try {
    const name = gitOutput("git config user.name", cwd).trim();
    if (name)
      return name;
  } catch {
  }
  return githubLogin();
}
function getGitInfo(cwd) {
  const result = {};
  try {
    const branch = gitOutput("git rev-parse --abbrev-ref HEAD", cwd).trim();
    if (branch && branch !== "HEAD")
      result.branch = branch;
  } catch {
  }
  try {
    const commit = gitOutput("git rev-parse HEAD", cwd).trim();
    if (commit)
      result.commit = commit;
  } catch {
  }
  return result;
}
var BOOLEAN_SETTINGS = {
  enabled: { env: "TRACE_TO_LANGSMITH", ...COMMON_BOOLEAN_SETTINGS.enabled },
  defaultMuted: { env: "CC_LANGSMITH_DEFAULT_MUTED", ...COMMON_BOOLEAN_SETTINGS.defaultMuted }
};
function envBoolean(field2) {
  const setting = BOOLEAN_SETTINGS[field2];
  const env = process.env[setting.env]?.toLowerCase();
  if (env === void 0)
    return void 0;
  if (env === "true")
    return true;
  if (env === "false")
    return false;
  return setting.restrictive;
}
function loadConfig(options) {
  const cwd = options?.cwd ?? process.cwd();
  const homeDir = homedir2();
  const stateFilePath = process.env.STATE_FILE ?? join2(homeDir, ...STATE_FILE_DEFAULT);
  const debug2 = (process.env.CC_LANGSMITH_DEBUG ?? "").toLowerCase() === "true";
  let replicas2;
  const providedReplicas = process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
  if (providedReplicas !== void 0) {
    try {
      replicas2 = JSON.parse(providedReplicas);
    } catch {
      error("Failed to parse provided CC_LANGSMITH_RUNS_ENDPOINTS. Please make sure they are valid JSON.");
    }
  }
  const parentDottedOrder = process.env.CC_LANGSMITH_PARENT_DOTTED_ORDER || void 0;
  let customMetadata;
  const providedMetadata = process.env.CC_LANGSMITH_METADATA;
  if (providedMetadata !== void 0) {
    try {
      const parsed = JSON.parse(providedMetadata);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        customMetadata = parsed;
      } else {
        error("CC_LANGSMITH_METADATA must be a JSON object (not an array or primitive).");
      }
    } catch {
      error("Failed to parse provided CC_LANGSMITH_METADATA. Please make sure it is valid JSON.");
    }
  }
  const redactEnv = (process.env.CC_LANGSMITH_REDACT ?? "").trim().toLowerCase();
  const redact = !["0", "false", "no", "off"].includes(redactEnv);
  let redactExtraRules;
  const providedExtra = process.env.CC_LANGSMITH_REDACT_EXTRA;
  if (providedExtra !== void 0) {
    try {
      const parsed = JSON.parse(providedExtra);
      if (!Array.isArray(parsed)) {
        error("CC_LANGSMITH_REDACT_EXTRA must be a JSON array of { pattern, replace }.");
      } else {
        const validRules = [];
        for (const rule of parsed) {
          if (typeof rule !== "object" || rule === null || typeof rule.pattern !== "string" || rule.replace !== void 0 && typeof rule.replace !== "string") {
            error(`Skipping invalid CC_LANGSMITH_REDACT_EXTRA rule (expected { pattern: string, replace?: string }): ${JSON.stringify(rule)}`);
            continue;
          }
          try {
            new RegExp(rule.pattern);
          } catch {
            error(`Skipping CC_LANGSMITH_REDACT_EXTRA rule with an invalid regex pattern: ${rule.pattern}`);
            continue;
          }
          validRules.push(rule);
        }
        if (validRules.length > 0 || parsed.length === 0)
          redactExtraRules = validRules;
      }
    } catch {
      error("Failed to parse CC_LANGSMITH_REDACT_EXTRA. Please make sure it is valid JSON.");
    }
  }
  const common = mergeCommonConfig({
    harness: readCommonConfigFile(join2(cwd, ".claude", "langsmith.json")).common,
    root: readCommonConfigFile(join2(cwd, "langsmith-plugins.json")).common,
    user: homeDir ? readCommonConfigFile(join2(homeDir, ".claude", "langsmith.json")).common : void 0,
    userRoot: homeDir ? readCommonConfigFile(join2(homeDir, ".langsmith-plugins.json")).common : void 0,
    env: {
      enabled: envBoolean("enabled"),
      defaultMuted: envBoolean("defaultMuted"),
      api_key: process.env.CC_LANGSMITH_API_KEY ?? process.env.LANGSMITH_API_KEY,
      api_url: process.env.LANGSMITH_ENDPOINT,
      project: process.env.CC_LANGSMITH_PROJECT,
      metadata: customMetadata,
      redact: process.env.CC_LANGSMITH_REDACT === void 0 ? void 0 : redact
      // Environment rules retain the existing tolerant parser.
    },
    defaults: { api_key: "", api_url: "https://api.smith.langchain.com", project: "claude-code" }
  }, { envFirst: true });
  if (replicas2 === void 0)
    replicas2 = toSdkReplicas(common.replicas);
  redactExtraRules ??= common.redact_extra_rules;
  customMetadata = common.metadata;
  const anthropicUserId = readAnthropicUserId();
  const localUsername = readLocalUsername();
  const identityMetadata = { local_username: localUsername };
  if (anthropicUserId) {
    identityMetadata.user_id = anthropicUserId;
    identityMetadata.anthropic_user_id = anthropicUserId;
  }
  const contractMetadata = {
    ls_agent_purpose: CODING_AGENT_PURPOSE,
    ls_integration: CLAUDE_CODE_INTEGRATION,
    ls_agent_runtime: CODING_AGENT_V1_CONTRACT.runtimeNames[CLAUDE_CODE_INTEGRATION],
    ls_trace_schema_version: CODING_AGENT_SCHEMA_VERSION,
    cwd
  };
  if (LS_INTEGRATION_VERSION) {
    contractMetadata.ls_integration_version = LS_INTEGRATION_VERSION;
  }
  const repoMetadata = {};
  if (!options?.deferGit) {
    const repoName = getRepoName(cwd);
    if (repoName != null) {
      repoMetadata.repository_name = repoName.name;
      repoMetadata.repository_provider = repoName.provider;
      const url = getRepoUrl(repoName.provider, repoName.name);
      if (url)
        repoMetadata.repository_url = url;
    }
    const gitInfo = getGitInfo(cwd);
    if (gitInfo.branch)
      repoMetadata.git_branch = gitInfo.branch;
    if (gitInfo.commit)
      repoMetadata.git_commit_sha = gitInfo.commit;
  }
  const pinned = REPOSITORY_METADATA_KEYS.filter((key) => customMetadata?.[key] !== void 0);
  customMetadata = { ...contractMetadata, ...identityMetadata, ...repoMetadata, ...customMetadata };
  Object.defineProperty(customMetadata, PINNED_REPOSITORY_KEYS, { value: new Set(pinned) });
  return {
    enabled: common.enabled,
    defaultMuted: common.defaultMuted,
    apiKey: common.api_key,
    project: common.project,
    apiBaseUrl: common.api_url,
    stateFilePath,
    debug: debug2,
    parentDottedOrder,
    replicas: replicas2,
    customMetadata,
    redact: common.redact,
    redactExtraRules
  };
}

// dist/src/utils/hook-entry.js
function runHookEntry(event2, main11) {
  main11().catch((err) => {
    try {
      error(`${event2} hook fatal error: ${err}`);
    } catch {
    }
    process.exit(0);
  });
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/regex.js
var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default = validate;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/parse.js
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
var parse_default = parse;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr2, offset = 0) {
  return (byteToHex[arr2[offset + 0]] + byteToHex[arr2[offset + 1]] + byteToHex[arr2[offset + 2]] + byteToHex[arr2[offset + 3]] + "-" + byteToHex[arr2[offset + 4]] + byteToHex[arr2[offset + 5]] + "-" + byteToHex[arr2[offset + 6]] + byteToHex[arr2[offset + 7]] + "-" + byteToHex[arr2[offset + 8]] + byteToHex[arr2[offset + 9]] + "-" + byteToHex[arr2[offset + 10]] + byteToHex[arr2[offset + 11]] + byteToHex[arr2[offset + 12]] + byteToHex[arr2[offset + 13]] + byteToHex[arr2[offset + 14]] + byteToHex[arr2[offset + 15]]).toLowerCase();
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/rng.js
var rnds8 = new Uint8Array(16);
function rng() {
  return crypto.getRandomValues(rnds8);
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/v4.js
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
var v4_default = v4;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/sha1.js
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
var sha1_default = sha1;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/v35.js
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
var URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
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
    offset ??= 0;
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/v5.js
function v5(value, namespace, buf, offset) {
  return v35(80, sha1_default, value, namespace, buf, offset);
}
v5.DNS = DNS;
v5.URL = URL2;
var v5_default = v5;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/uuid/src/v7.js
var _state = {};
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
  state.msecs ??= -Infinity;
  state.seq ??= 0;
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
  msecs ??= Date.now();
  seq ??= rnds[6] * 127 << 24 | rnds[7] << 16 | rnds[8] << 8 | rnds[9];
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
var v7_default = v7;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/experimental/otel/constants.js
var GEN_AI_OPERATION_NAME = "gen_ai.operation.name";
var GEN_AI_SYSTEM = "gen_ai.system";
var GEN_AI_REQUEST_MODEL = "gen_ai.request.model";
var GEN_AI_RESPONSE_MODEL = "gen_ai.response.model";
var GEN_AI_USAGE_INPUT_TOKENS = "gen_ai.usage.input_tokens";
var GEN_AI_USAGE_OUTPUT_TOKENS = "gen_ai.usage.output_tokens";
var GEN_AI_USAGE_TOTAL_TOKENS = "gen_ai.usage.total_tokens";
var GEN_AI_REQUEST_MAX_TOKENS = "gen_ai.request.max_tokens";
var GEN_AI_REQUEST_TEMPERATURE = "gen_ai.request.temperature";
var GEN_AI_REQUEST_TOP_P = "gen_ai.request.top_p";
var GEN_AI_REQUEST_FREQUENCY_PENALTY = "gen_ai.request.frequency_penalty";
var GEN_AI_REQUEST_PRESENCE_PENALTY = "gen_ai.request.presence_penalty";
var GEN_AI_RESPONSE_FINISH_REASONS = "gen_ai.response.finish_reasons";
var GENAI_PROMPT = "gen_ai.prompt";
var GENAI_COMPLETION = "gen_ai.completion";
var GEN_AI_REQUEST_EXTRA_QUERY = "gen_ai.request.extra_query";
var GEN_AI_REQUEST_EXTRA_BODY = "gen_ai.request.extra_body";
var GEN_AI_SERIALIZED_NAME = "gen_ai.serialized.name";
var GEN_AI_SERIALIZED_SIGNATURE = "gen_ai.serialized.signature";
var GEN_AI_SERIALIZED_DOC = "gen_ai.serialized.doc";
var GEN_AI_RESPONSE_ID = "gen_ai.response.id";
var GEN_AI_RESPONSE_SERVICE_TIER = "gen_ai.response.service_tier";
var GEN_AI_RESPONSE_SYSTEM_FINGERPRINT = "gen_ai.response.system_fingerprint";
var GEN_AI_USAGE_INPUT_TOKEN_DETAILS = "gen_ai.usage.input_token_details";
var GEN_AI_USAGE_OUTPUT_TOKEN_DETAILS = "gen_ai.usage.output_token_details";
var LANGSMITH_SESSION_ID = "langsmith.trace.session_id";
var LANGSMITH_SESSION_NAME = "langsmith.trace.session_name";
var LANGSMITH_RUN_TYPE = "langsmith.span.kind";
var LANGSMITH_NAME = "langsmith.trace.name";
var LANGSMITH_METADATA = "langsmith.metadata";
var LANGSMITH_TAGS = "langsmith.span.tags";
var LANGSMITH_REQUEST_STREAMING = "langsmith.request.streaming";
var LANGSMITH_REQUEST_HEADERS = "langsmith.request.headers";
var LANGSMITH_USAGE_METADATA = "langsmith.usage_metadata";

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/env.js
var globalEnv;
var isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
var isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
var isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");
var isDeno = () => typeof globalThis.Deno !== "undefined";
var isNode = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno();
var getEnv = () => {
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
var runtimeEnvironment;
function getRuntimeEnvironment() {
  if (runtimeEnvironment === void 0) {
    const env = getEnv();
    const releaseEnv = getShas();
    runtimeEnvironment = {
      library: "langsmith",
      runtime: env,
      sdk: "langsmith-js",
      sdk_version: __version__,
      ...releaseEnv
    };
  }
  return runtimeEnvironment;
}
var EXCLUDED_SUBSTRINGS = [
  "key",
  "secret",
  "token",
  "password",
  "passwd",
  "pwd",
  "credential",
  "email"
];
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
    "LANGSMITH_SESSION"
  ];
  for (const [key, value] of Object.entries(allEnvVars)) {
    if (typeof value === "string" && !excluded.includes(key) && !isSensitiveEnvVarName(key)) {
      if (key === "LANGCHAIN_REVISION_ID") {
        envVars["revision_id"] = value;
      } else {
        envVars[key] = value;
      }
    }
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
var cachedCommitSHAs;
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
var _VALID_TRACING_MODES = /* @__PURE__ */ new Set(["langsmith", "otel"]);
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/singletons/otel.js
var MockTracer = class {
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
var MockOTELTrace = class {
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
var MockOTELContext = class {
  active() {
    return {};
  }
  with(_context, fn) {
    return fn();
  }
};
var OTEL_TRACE_KEY = /* @__PURE__ */ Symbol.for("ls:otel_trace");
var OTEL_CONTEXT_KEY = /* @__PURE__ */ Symbol.for("ls:otel_context");
var OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY = /* @__PURE__ */ Symbol.for("ls:otel_get_default_otlp_tracer_provider");
var mockOTELTrace = new MockOTELTrace();
var mockOTELContext = new MockOTELContext();
var OTELProvider = class {
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
var OTELProviderSingleton = new OTELProvider();
function getOTELTrace() {
  return OTELProviderSingleton.getTraceInstance();
}
function getOTELContext() {
  return OTELProviderSingleton.getContextInstance();
}
function getDefaultOTLPTracerComponents() {
  return OTELProviderSingleton.getDefaultOTLPTracerComponents();
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/experimental/otel/translator.js
var WELL_KNOWN_OPERATION_NAMES = {
  llm: "chat",
  tool: "execute_tool",
  retriever: "embeddings",
  embedding: "embeddings",
  prompt: "chat"
};
function getOperationName(runType) {
  return WELL_KNOWN_OPERATION_NAMES[runType] || runType;
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
var LangSmithToOTELTranslator = class {
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/is-network-error/index.js
var objectToString = Object.prototype.toString;
var isError = (value) => objectToString.call(value) === "[object Error]";
var errorMessages = /* @__PURE__ */ new Set([
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
function isNetworkError(error2) {
  const isValid = error2 && isError(error2) && error2.name === "TypeError" && typeof error2.message === "string";
  if (!isValid) {
    return false;
  }
  const { message, stack } = error2;
  if (message === "Load failed") {
    return stack === void 0 || // Sentry adds its own stack trace to the fetch error, so also check for that
    "__sentry_captured__" in error2;
  }
  if (message.startsWith("error sending request for url")) {
    return true;
  }
  return errorMessages.has(message);
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/p-retry/index.js
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
var AbortError = class extends Error {
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
async function onAttemptFailure({ error: error2, attemptNumber, retriesConsumed, startTime, options }) {
  const normalizedError = error2 instanceof Error ? error2 : new TypeError(`Non-error was thrown: "${error2}". You should only throw errors.`);
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
    await new Promise((resolve16, reject) => {
      const onAbort = () => {
        clearTimeout(timeoutToken);
        options.signal?.removeEventListener("abort", onAbort);
        reject(options.signal.reason);
      };
      const timeoutToken = setTimeout(() => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve16();
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
  options.retries ??= 10;
  options.factor ??= 2;
  options.minTimeout ??= 1e3;
  options.maxTimeout ??= Number.POSITIVE_INFINITY;
  options.maxRetryTime ??= Number.POSITIVE_INFINITY;
  options.randomize ??= false;
  options.onFailedAttempt ??= () => {
  };
  options.shouldRetry ??= () => true;
  options.shouldConsumeRetry ??= () => true;
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
    } catch (error2) {
      if (await onAttemptFailure({
        error: error2,
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/p-queue.js
var import_p_queue = __toESM(require_dist(), 1);
var PQueue = "default" in import_p_queue.default ? import_p_queue.default.default : import_p_queue.default;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/async_caller.js
var STATUS_RETRYABLE = [
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
var AsyncCaller = class {
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
    let promise = this.queue.add(() => pRetry(() => callable(...args).catch((error2) => {
      if (error2 instanceof Error) {
        throw error2;
      } else {
        throw new Error(error2);
      }
    }), {
      async onFailedAttempt({ error: error2 }) {
        if (typeof error2 !== "object" || error2 == null)
          throw error2;
        const errorMessage = "message" in error2 && typeof error2.message === "string" ? error2.message : void 0;
        if (errorMessage?.startsWith("Cancel") || errorMessage?.startsWith("TimeoutError") || errorMessage?.startsWith("AbortError")) {
          throw error2;
        }
        if ("name" in error2 && error2.name === "TimeoutError") {
          throw error2;
        }
        if ("code" in error2 && error2.code === "ECONNABORTED") {
          throw error2;
        }
        const response = "response" in error2 ? error2.response : void 0;
        if (onFailedResponseHook) {
          const handled = await onFailedResponseHook(response);
          if (handled)
            return;
        }
        const status = response?.status ?? ("status" in error2 ? error2.status : void 0);
        if (status != null && (typeof status === "number" || typeof status === "string") && !STATUS_RETRYABLE.includes(+status)) {
          throw error2;
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/messages.js
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/utils/uuid.js
var uuid4 = function() {
  const { crypto: crypto2 } = globalThis;
  if (crypto2?.randomUUID) {
    uuid4 = crypto2.randomUUID.bind(crypto2);
    return crypto2.randomUUID();
  }
  const u8 = new Uint8Array(1);
  const randomByte = crypto2 ? () => crypto2.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/errors.js
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError = (err) => {
  if (err instanceof Error)
    return err;
  if (typeof err === "object" && err !== null) {
    try {
      if (Object.prototype.toString.call(err) === "[object Error]") {
        const error2 = new Error(err.message, err.cause ? { cause: err.cause } : {});
        if (err.stack)
          error2.stack = err.stack;
        if (err.cause && !error2.cause)
          error2.cause = err.cause;
        if (err.name)
          error2.name = err.name;
        return error2;
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/core/error.js
var LangsmithError = class extends Error {
};
var APIError = class _APIError extends LangsmithError {
  constructor(status, error2, message, headers) {
    super(`${_APIError.makeMessage(status, error2, message)}`);
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
    this.error = error2;
  }
  static makeMessage(status, error2, message) {
    const msg = error2?.message ? typeof error2.message === "string" ? error2.message : JSON.stringify(error2.message) : error2 ? JSON.stringify(error2) : message;
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
    const error2 = errorResponse;
    if (status === 400) {
      return new BadRequestError(status, error2, message, headers);
    }
    if (status === 401) {
      return new AuthenticationError(status, error2, message, headers);
    }
    if (status === 403) {
      return new PermissionDeniedError(status, error2, message, headers);
    }
    if (status === 404) {
      return new NotFoundError(status, error2, message, headers);
    }
    if (status === 409) {
      return new ConflictError(status, error2, message, headers);
    }
    if (status === 422) {
      return new UnprocessableEntityError(status, error2, message, headers);
    }
    if (status === 429) {
      return new RateLimitError(status, error2, message, headers);
    }
    if (status >= 500) {
      return new InternalServerError(status, error2, message, headers);
    }
    return new _APIError(status, error2, message, headers);
  }
};
var APIUserAbortError = class extends APIError {
  constructor({ message } = {}) {
    super(void 0, void 0, message || "Request was aborted.", void 0);
  }
};
var APIConnectionError = class extends APIError {
  constructor({ message, cause }) {
    super(void 0, void 0, message || "Connection error.", void 0);
    if (cause)
      this.cause = cause;
  }
};
var APIConnectionTimeoutError = class extends APIConnectionError {
  constructor({ message } = {}) {
    super({ message: message ?? "Request timed out." });
  }
};
var BadRequestError = class extends APIError {
};
var AuthenticationError = class extends APIError {
};
var PermissionDeniedError = class extends APIError {
};
var NotFoundError = class extends APIError {
};
var ConflictError = class extends APIError {
};
var UnprocessableEntityError = class extends APIError {
};
var RateLimitError = class extends APIError {
};
var InternalServerError = class extends APIError {
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/utils/values.js
var startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
var isAbsoluteURL = (url) => {
  return startsWithSchemeRegexp.test(url);
};
var isArray = (val) => (isArray = Array.isArray, isArray(val));
var isReadonlyArray = isArray;
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
var validatePositiveInteger = (name, n2) => {
  if (typeof n2 !== "number" || !Number.isInteger(n2)) {
    throw new LangsmithError(`${name} must be an integer`);
  }
  if (n2 < 0) {
    throw new LangsmithError(`${name} must be a positive integer`);
  }
  return n2;
};
var safeJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return void 0;
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/utils/sleep.js
var sleep = (ms) => new Promise((resolve16) => setTimeout(resolve16, ms));

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/version.js
var VERSION = "0.0.1";

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/detect-platform.js
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
var getPlatformProperties = () => {
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
var normalizeArch = (arch) => {
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
var normalizePlatform = (platform) => {
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
var _platformHeaders;
var getPlatformHeaders = () => {
  return _platformHeaders ??= getPlatformProperties();
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/shims.js
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/request-options.js
var FallbackEncoder = ({ headers, body }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  };
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/qs/formats.js
var default_format = "RFC3986";
var default_formatter = (v) => String(v);
var formatters = {
  RFC1738: (v) => String(v).replace(/%20/g, "+"),
  RFC3986: default_formatter
};
var RFC1738 = "RFC1738";

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/qs/utils.js
var has = (obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key));
var hex_table = /* @__PURE__ */ (() => {
  const array = [];
  for (let i = 0; i < 256; ++i) {
    array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
  }
  return array;
})();
var limit = 1024;
var encode = (str, _defaultEncoder, charset, _kind, format) => {
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/qs/stringify.js
var array_prefix_generators = {
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
var push_to_array = function(arr2, value_or_array) {
  Array.prototype.push.apply(arr2, isArray(value_or_array) ? value_or_array : [value_or_array]);
};
var toISOString;
var defaults = {
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
    return (toISOString ??= Function.prototype.call.bind(Date.prototype.toISOString))(date);
  },
  skipNulls: false,
  strictNullHandling: false
};
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
var sentinel = {};
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/utils/query.js
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "repeat" });
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/utils/log.js
var levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500
};
var parseLogLevel = (maybeLevel, sourceName, client2) => {
  if (!maybeLevel) {
    return void 0;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client2).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
  return void 0;
};
function noop() {
}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
var noopLogger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop
};
var cachedLoggers = /* @__PURE__ */ new WeakMap();
function loggerFor(client2) {
  const logger = client2.logger;
  const logLevel = client2.logLevel ?? "off";
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
var formatRequestDetails = (details) => {
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/parse.js
async function defaultParseResponse(client2, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
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
    const text = await response.text();
    return text;
  })();
  loggerFor(client2).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/core/api-promise.js
var __classPrivateFieldSet = function(receiver, state, value, kind, f2) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f2.call(receiver, value) : f2 ? f2.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = function(receiver, state, kind, f2) {
  if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f2 : kind === "a" ? f2.call(receiver) : f2 ? f2.value : state.get(receiver);
};
var _APIPromise_client;
var APIPromise = class _APIPromise extends Promise {
  constructor(client2, responsePromise, parseResponse = defaultParseResponse) {
    super((resolve16) => {
      resolve16(null);
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
    __classPrivateFieldSet(this, _APIPromise_client, client2, "f");
  }
  _thenUnwrap(transform) {
    return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client2, props) => transform(await this.parseResponse(client2, props), props));
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/core/pagination.js
var __classPrivateFieldSet2 = function(receiver, state, value, kind, f2) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f2.call(receiver, value) : f2 ? f2.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet2 = function(receiver, state, kind, f2) {
  if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f2 : kind === "a" ? f2.call(receiver) : f2 ? f2.value : state.get(receiver);
};
var _AbstractPage_client;
var AbstractPage = class {
  constructor(client2, response, body, options) {
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
    __classPrivateFieldSet2(this, _AbstractPage_client, client2, "f");
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
    return await __classPrivateFieldGet2(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
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
var PagePromise = class extends APIPromise {
  constructor(client2, request, Page) {
    super(client2, request, async (client3, props) => new Page(client3, props.response, await defaultParseResponse(client3, props), props.options));
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
var OffsetPaginationTopLevelArray = class extends AbstractPage {
  constructor(client2, response, body, options) {
    super(client2, response, body, options);
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
var OffsetPaginationIssues = class extends AbstractPage {
  constructor(client2, response, body, options) {
    super(client2, response, body, options);
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
var OffsetPaginationOnlineEvaluators = class extends AbstractPage {
  constructor(client2, response, body, options) {
    super(client2, response, body, options);
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
var ItemsCursorPostPagination = class extends AbstractPage {
  constructor(client2, response, body, options) {
    super(client2, response, body, options);
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
var ItemsCursorGetPagination = class extends AbstractPage {
  constructor(client2, response, body, options) {
    super(client2, response, body, options);
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/uploads.js
var checkFileSupport = () => {
  if (typeof File === "undefined") {
    const { process: process2 } = globalThis;
    const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
    throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
  }
};
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value) {
  return (typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "").split(/[\\/]/).pop() || void 0;
}
var isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/to-file.js
var isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
var isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
var isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
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
    name ||= new URL(value.url).pathname.split(/[\\/]/).pop();
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  name ||= getName(value);
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/core/resource.js
var APIResource = class {
  constructor(client2) {
    Object.defineProperty(this, "_client", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._client = client2;
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/utils/path.js
function encodeURIPath(str) {
  return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
var createPathTagFunction = (pathEncoder = encodeURIPath) => function path3(statics, ...params) {
  if (statics.length === 1)
    return statics[0];
  let postPath = false;
  const invalidSegments = [];
  const path4 = statics.reduce((previousValue, currentValue, index) => {
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
  const pathOnly = path4.split(/[?#]/, 1)[0];
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
${path4}
${underline}`);
  }
  return path4;
};
var path = /* @__PURE__ */ createPathTagFunction(encodeURIPath);

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/annotation-queues/items.js
var Items = class extends APIResource {
  /**
   * Add RUN or THREAD items to a single annotation queue. RUN items require run_id
   * unless they are created from a suggested example. THREAD items require thread_id
   * and project_id.
   */
  create(queueID, params, options) {
    const { extend_trace_retention, ...body } = params;
    return this._client.post(path`/api/v1/platform/annotation-queues/${queueID}/items`, {
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
    return this._client.patch(path`/api/v1/platform/annotation-queues/${queue_id}/items/${itemID}`, {
      body,
      ...options
    });
  }
  /**
   * List RUN and THREAD items in a single annotation queue for one review status
   * section, with opaque cursor pagination. Optional item_type=RUN|THREAD filters
   * the page. direction=backward returns items before the supplied cursor. The
   * response contains item metadata only, not expanded run or thread payloads.
   * status=archived returns items whose queue review requirements have been
   * satisfied, not merely items the caller personally marked completed.
   */
  list(queueID, query, options) {
    return this._client.getAPIList(path`/api/v1/platform/annotation-queues/${queueID}/items`, ItemsCursorGetPagination, { query, ...options });
  }
  /**
   * Log the caller's reviewer status for a RUN or THREAD annotation queue item. A
   * null status re-shows the item for this reviewer.
   */
  createStatus(queueItemID, body, options) {
    return this._client.post(path`/api/v1/platform/annotation-queues/items/${queueItemID}/status`, {
      body,
      ...options
    });
  }
  /**
   * Remove RUN or THREAD items from a single annotation queue by item ID.
   */
  deleteAll(queueID, body, options) {
    return this._client.post(path`/api/v1/platform/annotation-queues/${queueID}/items/delete`, {
      body,
      ...options
    });
  }
  /**
   * Returns the number of annotation queue items for the requested reviewer-specific
   * or archived bucket.
   */
  retrieveCount(queueID, query, options) {
    return this._client.get(path`/api/v1/platform/annotation-queues/${queueID}/items/count`, {
      query,
      ...options
    });
  }
  /**
   * Resolve a RUN or THREAD item to its current review section and zero-based
   * position for deep linking.
   */
  retrievePlacement(itemID, params, options) {
    const { queue_id } = params;
    return this._client.get(path`/api/v1/platform/annotation-queues/${queue_id}/items/${itemID}/placement`, options);
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/annotation-queues/runs.js
var Runs = class extends APIResource {
  /**
   * Add Runs To Annotation Queue
   *
   * @deprecated Deprecated: use the annotation queue items create endpoint (POST /api/v1/platform/annotation-queues/{queue_id}/items) instead. Will be removed after Jan 31, 2027.
   */
  create(queueID, params, options) {
    const { body, extend_trace_retention } = params;
    return this._client.post(path`/api/v1/annotation-queues/${queueID}/runs`, {
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
    return this._client.patch(path`/api/v1/annotation-queues/${queue_id}/runs/${queueRunID}`, {
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
    return this._client.get(path`/api/v1/annotation-queues/${queueID}/runs`, { query, ...options });
  }
  /**
   * Self-hosted deployments require LangSmith `v0.16` or later.
   *
   * @deprecated Deprecated: use the annotation queue items create endpoint (POST /api/v1/platform/annotation-queues/{queue_id}/items) instead. Will be removed after Jan 31, 2027.
   */
  createByKey(queueID, params, options) {
    const { body, extend_trace_retention } = params;
    return this._client.post(path`/api/v1/annotation-queues/${queueID}/runs/by-key`, {
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
    return this._client.post(path`/api/v1/annotation-queues/${queueID}/runs/delete`, { body, ...options });
  }
  /**
   * Delete Run From Annotation Queue
   *
   * @deprecated Deprecated: use the annotation queue items delete_all method (POST /api/v1/platform/annotation-queues/{queue_id}/items/delete) with the item ID instead. Will be removed after Jan 31, 2027.
   */
  deleteQueue(queueRunID, params, options) {
    const { queue_id } = params;
    return this._client.delete(path`/api/v1/annotation-queues/${queue_id}/runs/${queueRunID}`, options);
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/annotation-queues/annotation-queues.js
var AnnotationQueues = class extends APIResource {
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
    return this._client.get(path`/api/v1/annotation-queues/${queueID}`, options);
  }
  /**
   * Update Annotation Queue
   */
  update(queueID, body, options) {
    return this._client.patch(path`/api/v1/annotation-queues/${queueID}`, { body, ...options });
  }
  /**
   * Delete Annotation Queue
   */
  delete(queueID, options) {
    return this._client.delete(path`/api/v1/annotation-queues/${queueID}`, options);
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
    return this._client.post(path`/api/v1/annotation-queues/status/${annotationQueueRunID}`, {
      body,
      ...options
    });
  }
  /**
   * Export Annotation Queue Archived Runs
   */
  export(queueID, body, options) {
    return this._client.post(path`/api/v1/annotation-queues/${queueID}/export`, { body, ...options });
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
    return this._client.get(path`/api/v1/annotation-queues/${runID}/queues`, options);
  }
  /**
   * Get a run from an annotation queue
   *
   * @deprecated Deprecated: use the annotation queue items list and retrieve_placement methods instead, which call GET /api/v1/platform/annotation-queues/{queue_id}/items and GET /api/v1/platform/annotation-queues/{queue_id}/items/{item_id}/placement. Will be removed after Jan 31, 2027.
   */
  retrieveRun(index, params, options) {
    const { queue_id, ...query } = params;
    return this._client.get(path`/api/v1/annotation-queues/${queue_id}/run/${index}`, { query, ...options });
  }
  /**
   * Get Size From Annotation Queue
   *
   * @deprecated Deprecated: use the annotation queue items retrieve_count method (GET /api/v1/platform/annotation-queues/{queue_id}/items/count) with the desired status instead. Will be removed after Jan 31, 2027.
   */
  retrieveSize(queueID, query = {}, options) {
    return this._client.get(path`/api/v1/annotation-queues/${queueID}/size`, { query, ...options });
  }
  /**
   * Get Total Archived From Annotation Queue
   *
   * @deprecated Deprecated: use the annotation queue items retrieve_count method (GET /api/v1/platform/annotation-queues/{queue_id}/items/count?status=archived) instead. Will be removed after Jan 31, 2027.
   */
  retrieveTotalArchived(queueID, query = {}, options) {
    return this._client.get(path`/api/v1/annotation-queues/${queueID}/total_archived`, { query, ...options });
  }
  /**
   * Get Total Size From Annotation Queue
   *
   * @deprecated Deprecated: use the annotation queue items retrieve_count method (GET /api/v1/platform/annotation-queues/{queue_id}/items/count?status=all) instead. Will be removed after Jan 31, 2027.
   */
  retrieveTotalSize(queueID, options) {
    return this._client.get(path`/api/v1/annotation-queues/${queueID}/total_size`, options);
  }
};
AnnotationQueues.Runs = Runs;
AnnotationQueues.Items = Items;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/datasets/experiment-runs.js
var ExperimentRuns = class extends APIResource {
  /**
   * Returns a paginated page of dataset examples with runs from the requested
   * experiments. Response uses the canonical `{items, next_cursor}` envelope.
   *
   * Self-hosted deployments require LangSmith `v0.16` or later.
   */
  query(datasetID, body, options) {
    return this._client.getAPIList(path`/api/v2/datasets/${datasetID}/experiment-runs`, ItemsCursorPostPagination, { body, method: "post", ...options });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/datasets/datasets.js
var Datasets = class extends APIResource {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "experimentRuns", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new ExperimentRuns(this._client)
    });
  }
};
Datasets.ExperimentRuns = ExperimentRuns;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/info.js
var Info = class extends APIResource {
  /**
   * Returns information about the current LangSmith deployment: version, instance
   * feature flags, batch-ingest limits, and max SDK versions. Unauthenticated by
   * default; set FF_INFO_ENDPOINT_AUTH_REQUIRED=true to require auth.
   */
  list(options) {
    return this._client.get("/api/v1/info", options);
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/issues.js
var Issues = class extends APIResource {
  /**
   * **Beta:** This endpoint is in active development and may change without notice.
   *
   * Returns one issue for the authenticated tenant.
   */
  retrieve(id, options) {
    return this._client.get(path`/api/v1/platform/issues/${id}`, options);
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/headers.js
var brand_privateNullableHeaders = /* @__PURE__ */ Symbol("brand.privateNullableHeaders");
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
var buildHeaders = (newHeaders) => {
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/online-evaluators.js
var OnlineEvaluators = class extends APIResource {
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
    return this._client.get(path`/api/v1/platform/evaluators/${evaluatorID}`, options);
  }
  /**
   * Update an existing evaluator's name, LLM configuration, or code configuration.
   */
  update(evaluatorID, body, options) {
    return this._client.patch(path`/api/v1/platform/evaluators/${evaluatorID}`, { body, ...options });
  }
  /**
   * List evaluators for the current workspace, with optional filtering by type,
   * name, tag, feedback key, or resource ID.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/api/v1/platform/evaluators", OffsetPaginationOnlineEvaluators, { query, ...options });
  }
  /**
   * Delete an evaluator. When delete_run_rules is true, all run rules referencing
   * this evaluator are deleted first (same tenant). Associated llm_evaluators and
   * code_evaluators rows are removed by foreign-key cascade when the evaluator row
   * is deleted.
   */
  delete(evaluatorID, params = {}, options) {
    const { delete_run_rules } = params ?? {};
    return this._client.delete(path`/api/v1/platform/evaluators/${evaluatorID}`, {
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
   * session_id, or dataset_id is required. resource_id, type, feedback_key, and
   * tag_value_id may be supplied with group_by to narrow listing aggregations.
   */
  spend(query, options) {
    return this._client.get("/api/v1/platform/evaluators/spend", { query, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/public/runs.js
var Runs2 = class extends APIResource {
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
    return this._client.get(path`/api/v2/public/${share_token}/run/${runID}`, {
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
    return this._client.post(path`/api/v2/public/${shareToken}/runs/query`, {
      body,
      ...options,
      headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/public/public.js
var Public = class extends APIResource {
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/runs/share.js
var Share = class extends APIResource {
  /**
   * Creates or returns a share token for a run. Child runs share their trace root.
   *
   * Self-hosted deployments require LangSmith `v0.16` or later.
   *
   * @example
   * ```ts
   * const share = await client.runs.share.create(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   * );
   * ```
   */
  create(runID, body, options) {
    return this._client.post(path`/api/v2/runs/${runID}/share`, { body, ...options });
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
   * );
   * ```
   */
  delete(traceID, body, options) {
    return this._client.delete(path`/api/v2/runs/${traceID}/share`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/runs/runs.js
var Runs3 = class extends APIResource {
  constructor() {
    super(...arguments);
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
    return this._client.get(path`/api/v2/runs/${runID}/url`, { query, ...options });
  }
  /**
   * Returns a paginated list of runs for the given projects within min/max
   * start_time. Supports filters, cursor pagination, and `selects` to select fields
   * to return.
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
    return this._client.get(path`/api/v2/runs/${runID}`, {
      query,
      ...options,
      headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
    });
  }
};
Runs3.Share = Share;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/sandboxes/boxes.js
var Boxes = class extends APIResource {
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
    return this._client.get(path`/api/v2/sandboxes/boxes/${name}`, options);
  }
  /**
   * Update a sandbox's display name, retention, resources, tags, or proxy
   * configuration. The name must be unique within the tenant. Proxy configuration
   * sent to a sandbox that is not running is stored and applied when it next starts.
   */
  update(name, body, options) {
    return this._client.patch(path`/api/v2/sandboxes/boxes/${name}`, { body, ...options });
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
    return this._client.delete(path`/api/v2/sandboxes/boxes/${name}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Create a snapshot by capturing the current state of a sandbox or promoting an
   * existing checkpoint.
   */
  createSnapshot(name, body, options) {
    return this._client.post(path`/api/v2/sandboxes/boxes/${name}/snapshot`, { body, ...options });
  }
  /**
   * Generate a tokenized link that downloads a single file from a sandbox with no
   * further authentication. This mints a token rather than creating an addressable
   * resource, so it returns 200 with no Location header. The token pins the sandbox,
   * the file path, and the response content type and disposition, so a link cannot
   * be repointed at another file. Links never expire unless expires_in_seconds is
   * set. The link is served from the sandbox service domain, not the API host.
   */
  generateDownloadURL(name, body, options) {
    return this._client.post(path`/api/v2/sandboxes/boxes/${name}/download-url`, { body, ...options });
  }
  /**
   * Create a short-lived JWT for accessing an HTTP service running on a specific
   * port inside a sandbox. Returns a browser_url (sets auth cookie via redirect), a
   * service_url (for use with the X-Langsmith-Sandbox-Service-Token header), the raw
   * token, and its expiry.
   */
  generateServiceURL(name, body, options) {
    return this._client.post(path`/api/v2/sandboxes/boxes/${name}/service-url`, { body, ...options });
  }
  /**
   * Retrieve the lightweight status of a sandbox for polling.
   */
  getStatus(name, options) {
    return this._client.get(path`/api/v2/sandboxes/boxes/${name}/status`, options);
  }
  /**
   * Start a stopped or failed sandbox. This endpoint is not idempotent.
   */
  start(name, options) {
    return this._client.post(path`/api/v2/sandboxes/boxes/${name}/start`, options);
  }
  /**
   * Stop a ready sandbox. This endpoint is not idempotent; the filesystem is
   * preserved for later restart.
   */
  stop(name, options) {
    return this._client.post(path`/api/v2/sandboxes/boxes/${name}/stop`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/sandboxes/registries.js
var Registries = class extends APIResource {
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
    return this._client.get(path`/api/v2/sandboxes/registries/${name}`, options);
  }
  /**
   * Update a sandbox registry's name and/or credentials.
   */
  update(name, body, options) {
    return this._client.patch(path`/api/v2/sandboxes/registries/${name}`, { body, ...options });
  }
  /**
   * List sandbox registries for pulling private images.
   */
  list(query = {}, options) {
    return this._client.get("/api/v2/sandboxes/registries", { query, ...options });
  }
  /**
   * Delete a sandbox registry by name.
   */
  delete(name, options) {
    return this._client.delete(path`/api/v2/sandboxes/registries/${name}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/sandboxes/snapshots.js
var Snapshots = class extends APIResource {
  /**
   * Create a snapshot from a Docker image (async build).
   */
  create(body, options) {
    return this._client.post("/api/v2/sandboxes/snapshots", { body, ...options });
  }
  /**
   * Get a sandbox snapshot by ID or by a Docker-style reference. A bare name means
   * name:latest, falling back to the newest ready untagged snapshot of that name. To
   * list the tags under a name, use /api/v2/sandboxes/snapshots-by-name/{name}.
   */
  retrieve(snapshotID, options) {
    return this._client.get(path`/api/v2/sandboxes/snapshots/${snapshotID}`, options);
  }
  /**
   * List sandbox snapshots for the authenticated tenant, with optional filtering,
   * sorting, and pagination. Page with page_size and cursor: replay the response's
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
    return this._client.delete(path`/api/v2/sandboxes/snapshots/${snapshotID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Get a snapshot name and every tag under it, with the snapshot each tag resolves
   * to. To fetch one snapshot, use /api/v2/sandboxes/snapshots/{snapshot_id}.
   */
  retrieveByName(name, options) {
    return this._client.get(path`/api/v2/sandboxes/snapshots-by-name/${name}`, options);
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/sandboxes/sandboxes.js
var Sandboxes = class extends APIResource {
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
};
Sandboxes.Boxes = Boxes;
Sandboxes.Registries = Registries;
Sandboxes.Snapshots = Snapshots;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/threads.js
var Threads = class extends APIResource {
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
    return this._client.getAPIList(path`/api/v2/threads/${threadID}/traces`, ItemsCursorGetPagination, { query, ...options });
  }
  /**
   * Query threads within a project (session), with cursor-based pagination. Returns
   * threads matching the given time range and optional filters.
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
  query(body, options) {
    return this._client.getAPIList("/api/v2/threads/query", ItemsCursorPostPagination, {
      body,
      method: "post",
      ...options
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
    return this._client.get(path`/api/v2/threads/${threadID}/stats`, { query, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/resources/traces.js
var Traces = class extends APIResource {
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
    return this._client.get(path`/api/v2/traces/${traceID}/runs`, {
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
  query(body, options) {
    return this._client.getAPIList("/api/v2/traces/query", ItemsCursorPostPagination, {
      body,
      method: "post",
      ...options
    });
  }
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/internal/utils/env.js
var readEnv = (env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() || void 0;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
  }
  return void 0;
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/_openapi_client/client.js
var __classPrivateFieldSet3 = function(receiver, state, value, kind, f2) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f2.call(receiver, value) : f2 ? f2.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet3 = function(receiver, state, kind, f2) {
  if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f2 : kind === "a" ? f2.call(receiver) : f2 ? f2.value : state.get(receiver);
};
var _Langsmith_instances;
var _a;
var _Langsmith_encoder;
var _Langsmith_baseURLOverridden;
var Langsmith = class {
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
      value: new Threads(this)
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
    __classPrivateFieldSet3(this, _Langsmith_encoder, FallbackEncoder, "f");
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
    const client2 = new this.constructor({
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
    return client2;
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
  makeStatusError(status, error2, message, headers) {
    return APIError.generate(status, error2, message, headers);
  }
  buildURL(path3, query, defaultBaseURL) {
    const baseURL = !__classPrivateFieldGet3(this, _Langsmith_instances, "m", _Langsmith_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
    const url = isAbsoluteURL(path3) ? new URL(path3) : new URL(baseURL + (baseURL.endsWith("/") && path3.startsWith("/") ? path3.slice(1) : path3));
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
  get(path3, opts) {
    return this.methodRequest("get", path3, opts);
  }
  post(path3, opts) {
    return this.methodRequest("post", path3, opts);
  }
  patch(path3, opts) {
    return this.methodRequest("patch", path3, opts);
  }
  put(path3, opts) {
    return this.methodRequest("put", path3, opts);
  }
  delete(path3, opts) {
    return this.methodRequest("delete", path3, opts);
  }
  methodRequest(method, path3, opts) {
    return this.request(Promise.resolve(opts).then((opts2) => {
      return { method, path: path3, ...opts2 };
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
  getAPIList(path3, Page, opts) {
    return this.requestAPIList(Page, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path: path3, ...opts2 })) : { method: "get", path: path3, ...opts });
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
      const timeoutMs2 = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs2)) {
        timeoutMillis = timeoutMs2;
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
    const { method, path: path3, query, defaultBaseURL } = options;
    const url = this.buildURL(path3, query, defaultBaseURL);
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
      return __classPrivateFieldGet3(this, _Langsmith_encoder, "f").call(this, { body, headers });
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
Langsmith.Datasets = Datasets;
Langsmith.Runs = Runs3;
Langsmith.Threads = Threads;
Langsmith.Traces = Traces;
Langsmith.OnlineEvaluators = OnlineEvaluators;
Langsmith.Public = Public;
Langsmith.AnnotationQueues = AnnotationQueues;
Langsmith.Info = Info;
Langsmith.Issues = Issues;
Langsmith.Sandboxes = Sandboxes;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/warn.js
var warnedMessages = {};
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/xxhash/xxhash.js
var n = (n2) => BigInt(n2);
var PRIME32_1 = n("0x9E3779B1");
var PRIME32_2 = n("0x85EBCA77");
var PRIME32_3 = n("0xC2B2AE3D");
var PRIME64_1 = n("0x9E3779B185EBCA87");
var PRIME64_2 = n("0xC2B2AE3D27D4EB4F");
var PRIME64_3 = n("0x165667B19E3779F9");
var PRIME64_4 = n("0x85EBCA77C2B2AE63");
var PRIME64_5 = n("0x27D4EB2F165667C5");
var PRIME_MX1 = n("0x165667919E3779F9");
var PRIME_MX2 = n("0x9FB21C651E98DF25");
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
var kkey = hexToBytes("b8fe6c3923a44bbe7c01812cf721ad1cded46de9839097db7240a4a4b7b3671fcb79e64eccc0e578825ad07dccff7221b8084674f743248ee03590e6813a264c3c2852bb91c300cb88d0658b1b532ea371644897a20df94e3819ef46a9deacd8a8fa763fe39c343ff9dcbbc7c70b4f1d8a51e04bcdb45931c89f7ec9d9787364eac5ac8334d3ebc3c581a0fffa1363eb170ddd51b7f0da49d316552629d4689e2b16be587d47a1fc8ff8b8d17ad031ce45cb3a8f95160428afd7fbcabb4b407e");
var mask128 = (n(1) << n(128)) - n(1);
var mask64 = (n(1) << n(64)) - n(1);
var mask32 = (n(1) << n(32)) - n(1);
var STRIPE_LEN = 64;
var ACC_NB = STRIPE_LEN / 8;
var _U64 = 8;
var _U32 = 4;
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
var bswap64 = (a) => {
  return (a & n(255)) << n(56) | (a & n(65280)) << n(40) | (a & n(16711680)) << n(24) | (a & n(4278190080)) << n(8) | (a & n(1095216660480)) >> n(8) | (a & n(280375465082880)) >> n(24) | (a & n(71776119061217280)) >> n(40) | (a & n(18374686479671624e3)) >> n(56);
};
var bswap32 = (a) => {
  a = (a & n(65535)) << n(16) | (a & n(4294901760)) >> n(16);
  a = (a & n(16711935)) << n(8) | (a & n(4278255360)) >> n(8);
  return a;
};
var XXH_mult32to64 = (a, b) => (a & mask32) * (b & mask32) & mask64;
var assert = (a) => {
  if (!a)
    throw new Error("Assert failed");
};
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/_uuid.js
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUuid(str, which) {
  if (!UUID_REGEX.test(str)) {
    const msg = which !== void 0 ? `Invalid UUID for ${which}: ${str}` : `Invalid UUID: ${str}`;
    throw new Error(msg);
  }
  return str;
}
function uuid7FromTime(timestamp2) {
  const msecs = typeof timestamp2 === "string" ? Date.parse(timestamp2) : timestamp2;
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
var _textEncoder = new TextEncoder();
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/sampling.js
var SAMPLING_HASH_MODULUS = 1000000n;
var encoder = new TextEncoder();
var isSampledById = (identifier, samplingRate) => {
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/v2_migration.js
var QueryBackend = {
  CLICKHOUSE_ONLY: "clickhouse_only",
  SMITHDB_ONLY: "smithdb_only",
  DUAL: "dual"
};
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/error.js
function getInvalidPromptIdentifierMsg(identifier) {
  return `Invalid prompt identifier format: "${identifier}". Expected one of:
  - "prompt-name" (for private prompts)
  - "owner/prompt-name" (for prompts with explicit owner)
  - "prompt-name:commit-hash" (with commit reference)
  - "owner/prompt-name:commit-hash" (with owner and commit)`;
}
var LangSmithConflictError = class extends Error {
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
var LangSmithNotFoundError = class extends Error {
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
function isLangSmithNotFoundError(error2) {
  return error2 != null && typeof error2 === "object" && "name" in error2 && error2?.name === "LangSmithNotFoundError";
}
function isLangSmithConflictError(error2) {
  return error2 != null && typeof error2 === "object" && "name" in error2 && error2?.name === "LangSmithConflictError";
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
var ERR_CONFLICTING_ENDPOINTS = "ERR_CONFLICTING_ENDPOINTS";
var ConflictingEndpointsError = class extends Error {
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
function isConflictingEndpointsError(err) {
  return typeof err === "object" && err !== null && err.code === ERR_CONFLICTING_ENDPOINTS;
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/prompts.js
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/fs.js
import * as nodeFs from "node:fs";
import * as nodeFsPromises from "node:fs/promises";
import * as nodePath from "node:path";
var path2 = nodePath;
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
function mkdirSync4(dir) {
  nodeFs.mkdirSync(dir, { recursive: true });
}
function writeFileSync3(filePath, content) {
  nodeFs.writeFileSync(filePath, content);
}
function renameSync4(oldPath, newPath) {
  nodeFs.renameSync(oldPath, newPath);
}
function unlinkSync2(filePath) {
  nodeFs.unlinkSync(filePath);
}
function readFileSync5(filePath) {
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/prompt_cache/index.js
function isStale(entry, ttlSeconds) {
  if (ttlSeconds === null) {
    return false;
  }
  const ageMs = Date.now() - entry.createdAt;
  return ageMs > ttlSeconds * 1e3;
}
var PromptCache = class {
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
    const entry = this.cache.get(key);
    if (!entry) {
      this._metrics.misses += 1;
      return void 0;
    }
    this.cache.delete(key);
    this.cache.set(key, { ...entry, refreshFunc });
    this._metrics.hits += 1;
    return entry.value;
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
    const entry = {
      value,
      createdAt: Date.now(),
      refreshFunc
    };
    this.cache.delete(key);
    this.cache.set(key, entry);
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
    for (const [key, entry] of this.cache.entries()) {
      entries[key] = entry.value;
    }
    const dir = path2.dirname(filePath);
    if (!existsSync2(dir)) {
      mkdirSync4(dir);
    }
    const tempPath = `${filePath}.tmp`;
    try {
      writeFileSync3(tempPath, JSON.stringify({ entries }, null, 2));
      renameSync4(tempPath, filePath);
    } catch (e) {
      if (existsSync2(tempPath)) {
        unlinkSync2(tempPath);
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
      const content = readFileSync5(filePath);
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
      const entry = {
        value,
        createdAt: now
        // Fresh TTL from load time
      };
      this.cache.set(key, entry);
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
var promptCacheSingleton = new PromptCache();

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/singletons/fetch.js
var DEFAULT_FETCH_IMPLEMENTATION = (...args) => fetch(...args);
var globalFetchSupportsWebStreaming = void 0;
var LANGSMITH_FETCH_IMPLEMENTATION_KEY = /* @__PURE__ */ Symbol.for("ls:fetch_implementation");
var _shouldStreamForGlobalFetchImplementation = () => {
  const overriddenFetchImpl = globalThis[LANGSMITH_FETCH_IMPLEMENTATION_KEY];
  if (overriddenFetchImpl === void 0) {
    return true;
  }
  return globalFetchSupportsWebStreaming ?? false;
};
var _getFetchImplementation = (debug2) => {
  return async (...args) => {
    if (debug2 || getLangSmithEnvironmentVariable("DEBUG") === "true") {
      const [url, options] = args;
      console.log(`\u2192 ${options?.method || "GET"} ${url}`);
    }
    const res = await (globalThis[LANGSMITH_FETCH_IMPLEMENTATION_KEY] ?? DEFAULT_FETCH_IMPLEMENTATION)(...args);
    if (debug2 || getLangSmithEnvironmentVariable("DEBUG") === "true") {
      console.log(`\u2190 ${res.status} ${res.statusText} ${res.url}`);
    }
    return res;
  };
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/profile-lock.js
var LOCK_POLL_INTERVAL_MS = 10;
var LOCK_STALE_AFTER_MS = 1e4;
var LOCK_METADATA_FILE = "created_at";
function sleep2(ms) {
  return new Promise((resolve16) => setTimeout(resolve16, ms));
}
function isEEXIST(err) {
  return typeof err === "object" && err !== null && err.code === "EEXIST";
}
function lockMetadataLines(lockDir) {
  try {
    return readFileSync5(path2.join(lockDir, LOCK_METADATA_FILE)).split("\n");
  } catch {
    return void 0;
  }
}
function lockCreatedAtMs(lockDir) {
  const lines = lockMetadataLines(lockDir);
  if (lines && lines[0] && lines[0].trim()) {
    const parsed = Date.parse(lines[0].trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return statMtimeMs(lockDir);
}
function lockOwner(lockDir) {
  const lines = lockMetadataLines(lockDir);
  if (lines && lines.length >= 2 && lines[1].trim()) {
    return lines[1].trim();
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
  const parent = path2.dirname(lockDir);
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
      await writeFileAtomic(path2.join(lockDir, LOCK_METADATA_FILE), `${(/* @__PURE__ */ new Date()).toISOString()}
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/profiles.js
var DEFAULT_API_URL = "https://api.smith.langchain.com";
var OAUTH_CLIENT_ID = "langsmith-cli";
var TOKEN_REFRESH_LEEWAY_MS = 6e4;
var TOKEN_REFRESH_TIMEOUT_MS = 1e4;
var OAUTH_DISCOVERY_TIMEOUT_MS = 5e3;
var WELL_KNOWN_OAUTH_PATH = "/.well-known/oauth-authorization-server";
function isBrowserLikeRuntime() {
  const env = getEnv();
  return env === "browser" || env === "webworker";
}
function getProfileConfigPath() {
  const explicitPath = getEnvironmentVariable("LANGSMITH_CONFIG_FILE");
  if (explicitPath) {
    return explicitPath;
  }
  const home = getEnvironmentVariable("HOME") ?? getEnvironmentVariable("USERPROFILE");
  if (!home) {
    return void 0;
  }
  return path2.join(home, ".langsmith", "config.json");
}
function resolveProfileName(config) {
  const envProfile = getEnvironmentVariable("LANGSMITH_PROFILE");
  if (envProfile) {
    return envProfile;
  }
  if (config.current_profile) {
    return config.current_profile;
  }
  if (config.profiles?.default) {
    return "default";
  }
  return void 0;
}
function loadProfileState() {
  if (isBrowserLikeRuntime()) {
    return void 0;
  }
  const configPath = getProfileConfigPath();
  if (!configPath || !existsSync2(configPath)) {
    return void 0;
  }
  try {
    const config = JSON.parse(readFileSync5(configPath));
    const profileName = resolveProfileName(config);
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
  profile.oauth ??= {};
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
function loadProfileClientConfig() {
  const state = loadProfileState();
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
var ProfileAuth = class {
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
      const config = JSON.parse(readFileSync5(this.state.configPath));
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
    const refreshToken = this.state.profile.oauth?.refresh_token;
    if (!refreshToken) {
      return;
    }
    const refreshApiUrl = trimConfigValue(this.state.profile.api_url) ?? DEFAULT_API_URL;
    const deadline = Date.now() + TOKEN_REFRESH_TIMEOUT_MS;
    let lock;
    try {
      lock = await acquireOAuthRefreshLock(this.state.configPath, deadline);
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
      this.state.config.profiles ??= {};
      this.state.config.profiles[this.state.profileName] = this.state.profile;
      await writeFileAtomic(this.state.configPath, `${JSON.stringify(this.state.config, null, 2)}
`);
    } catch {
      return;
    } finally {
      await lock?.release();
    }
  }
  rememberProfileAuthHeader(header) {
    this.managedAuthorizationValue = header?.name === "Authorization" ? header.value : void 0;
  }
};
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/fast-safe-stringify/index.js
var LIMIT_REPLACE_NODE = "[...]";
var CIRCULAR_REPLACE_NODE = { result: "[Circular]" };
var arr = [];
var replacerStack = [];
var encoder2 = new TextEncoder();
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/worker_threads.js
import { Worker as NodeWorker } from "node:worker_threads";
var Worker = NodeWorker;
var WORKER_THREADS_AVAILABLE = true;

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/serialize_worker.js
var WORKER_SOURCE = (
  /* js */
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
`
);
var SerializeWorker = class {
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
    return new Promise((resolve16, reject) => {
      this.pending.set(id, { resolve: resolve16, reject });
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
var sharedWorker = null;
function getSharedSerializeWorker() {
  if (sharedWorker === null)
    sharedWorker = new SerializeWorker();
  return sharedWorker;
}
var LARGE_STRING_THRESHOLD = 64 * 1024;
var NODE_BUDGET = 2048;
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/client.js
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
var getTracingSamplingRate = (configRate) => {
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
var isLocalhost = (url) => {
  const strippedUrl = url.replace("http://", "").replace("https://", "");
  const hostname = strippedUrl.split("/")[0].split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};
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
var handle429 = async (response) => {
  if (response?.status === 429) {
    const retryAfter = parseInt(response.headers.get("retry-after") ?? "10", 10) * 1e3;
    if (retryAfter > 0) {
      await new Promise((resolve16) => setTimeout(resolve16, retryAfter));
      return true;
    }
  }
  return false;
};
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
var DEFAULT_UNCOMPRESSED_BATCH_SIZE_LIMIT_BYTES = 24 * 1024 * 1024;
var DEFAULT_MAX_SIZE_BYTES = 1024 * 1024 * 1024;
var SERVER_INFO_REQUEST_TIMEOUT_MS = 1e4;
var DEFAULT_BATCH_SIZE_LIMIT = 100;
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
var AutoBatchQueue = class {
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
    const itemPromise = new Promise((resolve16) => {
      itemPromiseResolve = resolve16;
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
var Client = class _Client {
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
    const defaultConfig = _Client.getDefaultClientConfig();
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
  static getDefaultClientConfig() {
    const profileConfig = loadProfileClientConfig();
    const envApiKey = getLangSmithEnvironmentVariable("API_KEY");
    const envApiUrl = getLangSmithEnvironmentVariable("ENDPOINT");
    const envWorkspaceId = getLangSmithEnvironmentVariable("WORKSPACE_ID");
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
    const names2 = /* @__PURE__ */ new Set();
    if (this.apiKey !== void 0) {
      names2.add("x-api-key");
    } else {
      const profileAuthHeader = this.profileAuth?.currentAuthHeader();
      if (profileAuthHeader) {
        names2.add(profileAuthHeader.name.toLowerCase());
      }
    }
    if (this.workspaceId) {
      names2.add("x-tenant-id");
    }
    return names2;
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
      "User-Agent": `langsmith-js/${__version__}`,
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
      headers["User-Agent"] = `langsmith-js/${__version__}`;
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
    const url = this.apiUrl.replace(/\/$/, "");
    for (const suffix of ["/api/v1", "/api"]) {
      if (url.endsWith(suffix))
        return url.slice(0, -suffix.length);
    }
    return url;
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
  _getPlatformEndpointPath(path3) {
    const needsV1Prefix = this.apiUrl.slice(-3) !== "/v1" && this.apiUrl.slice(-4) !== "/v1/";
    return needsV1Prefix ? `/v1/platform/${path3}` : `/platform/${path3}`;
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
  async processError(error2) {
    if (this.anonymizer == null) {
      return error2;
    }
    const result = await this.anonymizer({ error: error2 });
    return typeof result?.error === "string" ? result.error : error2;
  }
  /**
   * Filter content from new_token events to prevent streaming LLM output
   * from being uploaded via events.
   */
  _filterNewTokenEvents(events) {
    if (!events || events.length === 0) {
      return events;
    }
    return events.map((event2) => {
      if (event2.name === "new_token") {
        const { kwargs: _, ...rest } = event2;
        return rest;
      }
      return event2;
    });
  }
  async prepareRunCreateOrUpdateInputs(run) {
    const runParams = { ...run };
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
  async _getResponse(path3, queryParams) {
    const paramsString = queryParams?.toString() ?? "";
    const url = `${this.apiUrl}${path3}?${paramsString}`;
    const response = await this.caller.call(async () => {
      const res = await this._fetch(url, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `fetch ${path3}`);
      return res;
    });
    return response;
  }
  async _get(path3, queryParams) {
    const response = await this._getResponse(path3, queryParams);
    return response.json();
  }
  async *_getPaginated(path3, queryParams = new URLSearchParams(), transform) {
    let offset = Number(queryParams.get("offset")) || 0;
    const limit2 = Number(queryParams.get("limit")) || 100;
    while (true) {
      queryParams.set("offset", String(offset));
      queryParams.set("limit", String(limit2));
      const url = `${this.apiUrl}${path3}?${queryParams}`;
      const response = await this.caller.call(async () => {
        const res = await this._fetch(url, {
          method: "GET",
          headers: this._mergedHeaders,
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions
        });
        await raiseForStatus(res, `fetch ${path3}`);
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
  async *_getCursorPaginatedList(path3, body = null, requestMethod = "POST", dataKey = "runs") {
    const bodyParams = body ? { ...body } : {};
    while (true) {
      const body2 = JSON.stringify(bodyParams);
      const response = await this.caller.call(async () => {
        const res = await this._fetch(`${this.apiUrl}${path3}`, {
          method: requestMethod,
          headers: {
            ...this._mergedHeaders,
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions,
          body: body2
        });
        await raiseForStatus(res, `fetch ${path3}`);
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
  static async _writeTraceToFallbackDir(directory, body, replayHeaders, endpoint, maxBytes) {
    try {
      const bodyBuffer = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
      const envelope = JSON.stringify({
        version: 1,
        endpoint,
        headers: replayHeaders,
        body_base64: bodyBuffer.toString("base64")
      });
      const filename = `trace_${Date.now()}_${v4_default().slice(0, 8)}.json`;
      const filepath = path2.join(directory, filename);
      if (!_Client._fallbackDirsCreated.has(directory)) {
        await mkdir2(directory);
        _Client._fallbackDirsCreated.add(directory);
      }
      if (maxBytes !== void 0 && maxBytes > 0) {
        try {
          const entries = await readdir2(directory);
          const traceFiles = entries.filter((f2) => f2.startsWith("trace_") && f2.endsWith(".json"));
          let total = 0;
          for (const name of traceFiles) {
            const { size } = await stat2(path2.join(directory, name));
            total += size;
          }
          if (total >= maxBytes) {
            console.warn(`Could not write trace to fallback dir ${directory} as it's already over size limit (${total} bytes >= ${maxBytes} bytes). Increase LANGSMITH_FAILED_TRACES_MAX_MB if possible.`);
            return;
          }
        } catch {
        }
      }
      await writeFileAtomic(filepath, envelope);
      console.warn(`LangSmith trace upload failed; data saved to ${filepath} for later replay.`);
    } catch (writeErr) {
      console.error(`LangSmith tracing error: could not write trace to fallback dir ${directory}:`, writeErr);
    }
  }
  async _processBatch(batch, options) {
    if (!batch.length) {
      return;
    }
    const batchSizeBytes = batch.reduce((sum, item) => sum + (item.size ?? 0), 0);
    try {
      if (this.langSmithToOTELTranslator !== void 0) {
        for (const item of batch) {
          item.item = await this._maskRunMetadata(item.item);
        }
        this._sendBatchToOTELTranslator(batch);
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
            await this.multipartIngestRuns(ingestParams, {
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
            } else {
              throw e;
            }
          }
        } else {
          await this.batchIngestRuns(ingestParams, {
            ...options,
            sizeBytes: batchSizeBytes
          });
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
    item.item = mergeRuntimeEnvIntoRun(item.item, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo, this.tracingSampleRate);
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
    const session_name = run.project_name;
    delete run.project_name;
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
    let preparedUpdateParams = await Promise.all(runUpdates?.map((update) => this.prepareRunCreateOrUpdateInputs(update)) ?? []);
    if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
      const createById = preparedCreateParams.reduce((params, run) => {
        if (!run.id) {
          return params;
        }
        params[run.id] = run;
        return params;
      }, {});
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
  async multipartIngestRuns({ runCreates, runUpdates }, options) {
    if (runCreates === void 0 && runUpdates === void 0) {
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
      preparedUpdateParams.push(await this.prepareRunCreateOrUpdateInputs(update));
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
    if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
      const createById = preparedCreateParams.reduce((params, run) => {
        if (!run.id) {
          return params;
        }
        params[run.id] = run;
        return params;
      }, {});
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
    if (preparedCreateParams.length === 0 && preparedUpdateParams.length === 0) {
      return;
    }
    const accumulatedContext = [];
    const accumulatedParts = [];
    for (const [method, payloads] of [
      ["post", preparedCreateParams],
      ["patch", preparedUpdateParams]
    ]) {
      for (const originalPayload of payloads) {
        const { inputs, outputs, events, extra, error: error2, serialized, attachments, ...payload } = originalPayload;
        const fields = { inputs, outputs, events, extra, error: error2, serialized };
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
    const body = serialize(run.extra ? mergeRuntimeEnvIntoRun(run, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo, this.tracingSampleRate) : run, `Serializing payload to update run with id: ${runId}`);
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
  async getRunUrl({ runId, run, projectOpts }) {
    warnOnce("getRunUrl() is deprecated and will be removed after Jan 31, 2027. Use client.runs.getURL() instead. See https://docs.langchain.com/langsmith/smithdb-sdk-migration-runs#runs-get-url for the migration guide.", { type: "DeprecationWarning", code: "LANGSMITH_DEPRECATED_GET_RUN_URL" });
    if (run !== void 0) {
      let sessionId;
      if (run.session_id) {
        sessionId = run.session_id;
      } else if (projectOpts?.projectName) {
        sessionId = (await this.readProject({ projectName: projectOpts?.projectName })).id;
      } else if (projectOpts?.projectId) {
        sessionId = projectOpts?.projectId;
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
    const { projectId, projectName, parentRunId, traceId, referenceExampleId, startTime, executionOrder, isRoot, runType, error: error2, id, query, filter, traceFilter, treeFilter, limit: limit2, select, order } = props;
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
      error: error2,
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
    const path3 = "/runs/group";
    const url = `${this.apiUrl}${path3}`;
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
        await raiseForStatus(res, `Failed to fetch ${path3}`);
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
  async getRunStats({ id, trace, parentRun, runType, projectNames, projectIds, referenceExampleIds, startTime, endTime, error: error2, query, filter, traceFilter, treeFilter, isRoot, dataSourceType }) {
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
      error: error2,
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
    let path3 = "/sessions";
    const params = new URLSearchParams();
    if (projectId !== void 0 && projectName !== void 0) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId !== void 0) {
      assertUuid(projectId);
      path3 += `/${projectId}`;
    } else if (projectName !== void 0) {
      params.append("name", projectName);
    } else {
      throw new Error("Must provide projectName or projectId");
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}${path3}?${params}`, {
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
    let path3 = "/sessions";
    const params = new URLSearchParams();
    if (projectId !== void 0 && projectName !== void 0) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId !== void 0) {
      assertUuid(projectId);
      path3 += `/${projectId}`;
    } else if (projectName !== void 0) {
      params.append("name", projectName);
    } else {
      throw new Error("Must provide projectName or projectId");
    }
    if (includeStats !== void 0) {
      params.append("include_stats", includeStats.toString());
    }
    const response = await this._get(path3, params);
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
    let path3 = "/datasets";
    const params = new URLSearchParams({ limit: "1" });
    if (datasetId && datasetName) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId) {
      assertUuid(datasetId);
      path3 += `/${datasetId}`;
    } else if (datasetName) {
      params.append("name", datasetName);
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    const response = await this._get(path3, params);
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
      if (
        // eslint-disable-next-line no-instanceof/no-instanceof
        e instanceof Error && e.message.toLocaleLowerCase().includes("not found")
      ) {
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
    const path3 = "/datasets";
    if (datasetId !== void 0) {
    } else if (datasetName !== void 0) {
      datasetId = (await this.readDataset({ datasetName })).id;
    } else {
      throw new Error("Must provide either datasetName or datasetId");
    }
    const response = await this._getResponse(`${path3}/${datasetId}/openai_ft`);
    const datasetText = await response.text();
    const dataset = datasetText.trim().split("\n").map((line) => JSON.parse(line));
    return dataset;
  }
  async *listDatasets({ limit: limit2 = 100, offset = 0, datasetIds, datasetName, datasetNameContains, metadata } = {}) {
    const path3 = "/datasets";
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
    for await (const datasets of this._getPaginated(path3, params)) {
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
    let path3 = "/datasets";
    let datasetId_ = datasetId;
    if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetName !== void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    }
    if (datasetId_ !== void 0) {
      assertUuid(datasetId_);
      path3 += `/${datasetId_}`;
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    await this.caller.call(async () => {
      const res = await this._fetch(this.apiUrl + path3, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `delete ${path3}`, true);
      return res;
    });
  }
  async createExample(inputsOrUpdate, outputs, options) {
    if (isExampleCreate(inputsOrUpdate)) {
      if (outputs !== void 0 || options !== void 0) {
        throw new Error("Cannot provide outputs or options when using ExampleCreate object");
      }
    }
    let datasetId_ = outputs ? options?.datasetId : inputsOrUpdate.dataset_id;
    const datasetName_ = outputs ? options?.datasetName : inputsOrUpdate.dataset_name;
    if (datasetId_ === void 0 && datasetName_ === void 0) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== void 0 && datasetName_ !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === void 0) {
      const dataset = await this.readDataset({ datasetName: datasetName_ });
      datasetId_ = dataset.id;
    }
    const createdAt_ = (outputs ? options?.createdAt : inputsOrUpdate.created_at) || /* @__PURE__ */ new Date();
    let data;
    if (!isExampleCreate(inputsOrUpdate)) {
      data = {
        inputs: inputsOrUpdate,
        outputs,
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
    const { inputs, outputs, metadata, splits, sourceRunIds, useSourceRunIOs, useSourceRunAttachments, attachments, exampleIds, datasetId, datasetName } = propsOrUploads;
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
        outputs: outputs?.[idx],
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
    const path3 = `/examples/${exampleId}`;
    const rawExample = await this._get(path3);
    const { attachment_urls, ...rest } = rawExample;
    const example = rest;
    if (attachment_urls) {
      example.attachments = Object.entries(attachment_urls).reduce((acc, [key, value]) => {
        acc[key.slice("attachment.".length)] = {
          presigned_url: value.presigned_url,
          mime_type: value.mime_type
        };
        return acc;
      }, {});
    }
    return example;
  }
  async *listExamples({ datasetId, datasetName, exampleIds, asOf, splits, inlineS3Urls, metadata, limit: limit2, offset, filter, includeAttachments } = {}) {
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
    if (includeAttachments === true) {
      ["attachment_urls", "outputs", "metadata"].forEach((field2) => params.append("select", field2));
    }
    let i = 0;
    for await (const rawExamples of this._getPaginated("/examples", params)) {
      for (const rawExample of rawExamples) {
        const { attachment_urls, ...rest } = rawExample;
        const example = rest;
        if (attachment_urls) {
          example.attachments = Object.entries(attachment_urls).reduce((acc, [key, value]) => {
            acc[key.slice("attachment.".length)] = {
              presigned_url: value.presigned_url,
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
    const path3 = `/examples/${exampleId}`;
    await this.caller.call(async () => {
      const res = await this._fetch(this.apiUrl + path3, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `delete ${path3}`, true);
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
      const path3 = this._getPlatformEndpointPath("datasets/examples/delete");
      await this.caller.call(async () => {
        const res = await this._fetch(`${this.apiUrl}${path3}`, {
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
    const { runId = null, key, score, value, correction, comment, sourceInfo, feedbackSourceType = "api", sourceRunId, feedbackId, feedbackConfig, projectId, traceId, comparativeExperimentId, sessionId, startTime, extendTraceRetention } = typeof runIdOrParams === "object" && runIdOrParams !== null ? runIdOrParams : { runId: runIdOrParams, key: keyArg, ...optionsArg };
    if (!runId && !projectId) {
      throw new Error("One of runId or projectId must be provided");
    }
    if (runId && projectId) {
      throw new Error("Only one of runId or projectId can be provided");
    }
    if (runId && sessionId === void 0) {
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
    const body = JSON.stringify(feedback);
    const url = `${this.apiUrl}/feedback`;
    await this.caller.call(async () => {
      const res = await this._fetch(url, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "create feedback", true);
      return res;
    });
    return feedback;
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
    const path3 = `/feedback/${feedbackId}`;
    const response = await this._get(path3);
    return response;
  }
  async deleteFeedback(feedbackId) {
    assertUuid(feedbackId);
    const path3 = `/feedback/${feedbackId}`;
    await this.caller.call(async () => {
      const res = await this._fetch(this.apiUrl + path3, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `delete ${path3}`, true);
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
   * @param options.isLowerScoreBetter - Whether a lower score is better
   * @returns The created FeedbackConfigSchema object
   */
  async createFeedbackConfig(options) {
    const { feedbackKey, feedbackConfig, isLowerScoreBetter = false } = options;
    const body = {
      feedback_key: feedbackKey,
      feedback_config: feedbackConfig,
      is_lower_score_better: isLowerScoreBetter
    };
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
    const path3 = `/annotation-queues/${assertUuid(queueId, "queueId")}/runs`;
    for await (const runs of this._getPaginated(path3, params)) {
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
    const settings = await this._getSettings();
    return owner == "-" || settings.tenant_handle === owner;
  }
  async _ownerConflictError(action, owner) {
    const settings = await this._getSettings();
    return new Error(`Cannot ${action} for another tenant.

      Current tenant: ${settings.tenant_handle}

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
      const settings = await this._getSettings();
      if (commitHash !== "latest") {
        return `${this.getHostUrl()}/prompts/${promptName}/${commitHash.substring(0, 8)}?organizationId=${settings.id}`;
      } else {
        return `${this.getHostUrl()}/prompts/${promptName}?organizationId=${settings.id}`;
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
    const settings = await this._getSettings();
    if (options?.isPublic && !settings.tenant_handle) {
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
      if (example.outputs) {
        const stringifiedOutputs = serialize(example.outputs, `Serializing outputs for uploaded example with id: ${exampleId}`);
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
    const settings = await this._getSettings();
    const query = new URLSearchParams({ organizationId: settings.id });
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
    await new Promise((resolve16) => setTimeout(resolve16, 1));
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
function isExampleCreate(input) {
  return "dataset_id" in input || "dataset_name" in input;
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/env.js
var isEnvTracingEnabled = (tracingEnabled) => {
  if (tracingEnabled !== void 0) {
    return tracingEnabled;
  }
  const envVars = ["TRACING_V2", "TRACING"];
  return !!envVars.find((envVar) => getLangSmithEnvironmentVariable(envVar) === "true");
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/singletons/constants.js
var _LC_CONTEXT_VARIABLES_KEY = /* @__PURE__ */ Symbol.for("lc:context_variables");
var _REPLICA_TRACE_ROOTS_KEY = /* @__PURE__ */ Symbol.for("langsmith:replica_trace_roots");

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/context_vars.js
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/utils/project.js
var getDefaultProjectName = () => {
  return getLangSmithEnvironmentVariable("PROJECT") ?? getEnvironmentVariable("LANGCHAIN_SESSION") ?? // TODO: Deprecate
  "default";
};

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/run_trees.js
var TIMESTAMP_LENGTH = 36;
var UUID_NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
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
var HEADER_SAFE_REPLICA_FIELDS = /* @__PURE__ */ new Set([
  "projectName",
  "primary",
  "updates",
  "reroot"
]);
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
var Baggage = class _Baggage {
  constructor(metadata, tags, project_name, replicas2) {
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
    this.metadata = metadata;
    this.tags = tags;
    this.project_name = project_name;
    this.replicas = replicas2;
  }
  static fromHeader(value) {
    const items = value.split(",");
    let metadata = {};
    let tags = [];
    let project_name;
    let replicas2;
    for (const item of items) {
      const [key, uriValue] = item.split("=");
      const value2 = decodeURIComponent(uriValue);
      if (key === "langsmith-metadata") {
        metadata = JSON.parse(value2);
      } else if (key === "langsmith-tags") {
        tags = value2.split(",");
      } else if (key === "langsmith-project") {
        project_name = value2;
      } else if (key === "langsmith-replicas") {
        const parsed = JSON.parse(value2);
        replicas2 = parsed.map((replica) => {
          if (Array.isArray(replica)) {
            return replica;
          }
          return filterReplicaForHeaders(replica);
        });
      }
    }
    return new _Baggage(metadata, tags, project_name, replicas2);
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
    return items.join(",");
  }
};
function getExcludeInputsOnPatch() {
  const value = getLangSmithEnvironmentVariable("EXCLUDE_INPUTS_ON_PATCH");
  return value === void 0 || value.toLowerCase() === "true" || value === "1";
}
var RunTree = class _RunTree {
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
    const client2 = config.client ?? _RunTree.getSharedClient();
    const dedupedMetadata = {
      ...metadata,
      ...config?.extra?.metadata
    };
    config.extra = { ...config.extra, metadata: dedupedMetadata };
    if ("id" in config && config.id == null) {
      delete config.id;
    }
    Object.assign(this, { ...defaultConfig, ...config, client: client2 });
    this.execution_order ??= 1;
    this.child_execution_order ??= 1;
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
      project_name: getDefaultProjectName(),
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
  async end(outputs, error2, endTime = Date.now(), metadata) {
    this.outputs = this.outputs ?? outputs;
    this.error = this.error ?? error2;
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
  _remapForProject(params) {
    const { projectName, primary, runtimeEnv, excludeChildRuns = true, reroot = false, distributedParentId, apiUrl, apiKey, workspaceId } = params;
    const baseRun = this._convertToCreate(this, runtimeEnv, excludeChildRuns);
    if (primary === void 0 && projectName === this.project_name) {
      return {
        ...baseRun,
        session_name: projectName
      };
    }
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
        projectName,
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
        projectName,
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
        session_name: projectName
      };
    }
    const oldId = baseRun.id;
    const newId = nonCryptographicUuid7Deterministic(oldId, projectName);
    let newTraceId;
    if (baseRun.trace_id) {
      newTraceId = nonCryptographicUuid7Deterministic(baseRun.trace_id, projectName);
    } else {
      newTraceId = newId;
    }
    let newParentId;
    if (baseRun.parent_run_id) {
      newParentId = nonCryptographicUuid7Deterministic(baseRun.parent_run_id, projectName);
    }
    let newDottedOrder;
    if (baseRun.dotted_order) {
      const segs = baseRun.dotted_order.split(".");
      const remappedSegs = segs.map((seg) => {
        const segId = seg.slice(-TIMESTAMP_LENGTH);
        const remappedId = nonCryptographicUuid7Deterministic(segId, projectName);
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
      session_name: projectName
    };
  }
  async postRun(excludeChildRuns = true) {
    if (this._awaitInputsOnPost) {
      this.inputs = await this.inputs;
    }
    try {
      const runtimeEnv = getRuntimeEnvironment();
      if (this.replicas && this.replicas.length > 0) {
        for (const { projectName, primary, apiKey, apiUrl, workspaceId, reroot, client: replicaClient } of this.replicas) {
          const runCreate = this._remapForProject({
            projectName: projectName ?? this.project_name,
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
    } catch (error2) {
      console.error(`Error in postRun for run ${this.id}:`, error2);
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
      for (const { projectName, primary, apiKey, apiUrl, workspaceId, updates, reroot, client: replicaClient } of this.replicas) {
        const runData = this._remapForProject({
          projectName: projectName ?? this.project_name,
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
          session_name: this.project_name
        };
        if (!excludeInputs) {
          runUpdate.inputs = this.inputs;
        }
        await this.client.updateRun(this.id, runUpdate);
      } catch (error2) {
        console.error(`Error in patchRun for run ${this.id}`, error2);
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
  addEvent(event2) {
    if (!this.events) {
      this.events = [];
    }
    if (typeof event2 === "string") {
      this.events.push({
        name: "event",
        time: (/* @__PURE__ */ new Date()).toISOString(),
        message: event2
      });
    } else {
      this.events.push({
        ...event2,
        time: event2.time ?? (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  static fromRunnableConfig(parentConfig, props) {
    const callbackManager = parentConfig?.callbacks;
    let parentRun;
    let projectName;
    let client2;
    let tracingEnabled = isEnvTracingEnabled();
    if (callbackManager) {
      const parentRunId = callbackManager?.getParentRunId?.() ?? "";
      const langChainTracer = callbackManager?.handlers?.find((handler) => handler?.name == "langchain_tracer");
      parentRun = langChainTracer?.getRun?.(parentRunId);
      projectName = langChainTracer?.projectName;
      client2 = langChainTracer?.client;
      tracingEnabled = tracingEnabled || !!langChainTracer;
    }
    if (!parentRun) {
      return new _RunTree({
        ...props,
        client: client2,
        tracingEnabled,
        project_name: projectName
      });
    }
    const parentRunTree = new _RunTree({
      name: parentRun.name,
      id: parentRun.id,
      trace_id: parentRun.trace_id,
      dotted_order: parentRun.dotted_order,
      client: client2,
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
      config.project_name = baggage.project_name;
      config.replicas = baggage.replicas;
    }
    const runTree = new _RunTree(config);
    runTree.distributedParentId = runTree.id;
    return runTree;
  }
  toHeaders(headers) {
    const result = {
      "langsmith-trace": this.dotted_order,
      baggage: new Baggage(this.extra?.metadata, this.tags, this.project_name, this.replicas).toHeader()
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
      const replicas2 = [];
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
        replicas2.push({
          apiUrl: item.api_url.replace(/\/$/, ""),
          apiKey: item.api_key,
          projectName: item.project_name ?? void 0,
          primary: item.primary ?? void 0
        });
      }
      return replicas2;
    } else if (typeof parsed === "object" && parsed !== null) {
      _checkEndpointEnvUnset(parsed);
      const replicas2 = [];
      for (const [url, key] of Object.entries(parsed)) {
        const cleanUrl = url.replace(/\/$/, "");
        if (typeof key === "string") {
          replicas2.push({
            apiUrl: cleanUrl,
            apiKey: key
          });
        } else {
          console.warn(`Invalid value type in LANGSMITH_RUNS_ENDPOINTS for URL ${url}: expected string, got ${typeof key}`);
          continue;
        }
      }
      return replicas2;
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
function _ensureWriteReplicas(replicas2) {
  const ensured = replicas2 ? replicas2.map((replica) => {
    if (Array.isArray(replica)) {
      return {
        projectName: replica[0],
        updates: replica[1]
      };
    }
    return replica;
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

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/uuid.js
function computeRunIdForSecondaryReplica(runId, projectName) {
  if (typeof projectName !== "string" || projectName.length === 0) {
    throw new Error("projectName must be a non-empty string");
  }
  assertUuid(runId, "runId");
  const normalizedRunId = runId.toLowerCase();
  if (getUuidVersion(normalizedRunId) !== 7) {
    throw new Error("runId must be a UUID v7");
  }
  return nonCryptographicUuid7Deterministic(normalizedRunId, projectName);
}

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/singletons/traceable.js
var MockAsyncLocalStorage = class {
  getStore() {
    return void 0;
  }
  run(_, callback) {
    return callback();
  }
};
var TRACING_ALS_KEY = /* @__PURE__ */ Symbol.for("ls:tracing_async_local_storage");
var mockAsyncLocalStorage = new MockAsyncLocalStorage();
var AsyncLocalStorageProvider = class {
  getInstance() {
    return globalThis[TRACING_ALS_KEY] ?? mockAsyncLocalStorage;
  }
  initializeGlobalInstance(instance) {
    if (globalThis[TRACING_ALS_KEY] === void 0) {
      globalThis[TRACING_ALS_KEY] = instance;
    }
  }
};
var AsyncLocalStorageProviderSingleton = new AsyncLocalStorageProvider();

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/index.js
var __version__ = "0.10.5";

// node_modules/.pnpm/langsmith@0.10.5/node_modules/langsmith/dist/anonymizer/index.js
function extractStringNodes(data, options) {
  const parsedOptions = { ...options, maxDepth: options.maxDepth ?? 10 };
  const queue = [[data, 0, "", null, ""]];
  let nextId = 0;
  const result = [];
  let head = 0;
  while (head < queue.length) {
    const [value, depth, path3, parent, key] = queue[head++];
    if (typeof value === "string") {
      result.push({
        value,
        path: path3,
        parent,
        key,
        _id: nextId++
      });
    } else if (Array.isArray(value)) {
      if (depth >= parsedOptions.maxDepth)
        continue;
      for (let i = 0; i < value.length; i++) {
        queue.push([
          value[i],
          depth + 1,
          `${path3}[${i}]`,
          value,
          String(i)
        ]);
      }
    } else if (typeof value === "object" && value != null) {
      if (depth >= parsedOptions.maxDepth)
        continue;
      for (const [k, nestedValue] of Object.entries(value)) {
        queue.push([
          nestedValue,
          depth + 1,
          path3 ? `${path3}.${k}` : k,
          value,
          k
        ]);
      }
    }
  }
  return result;
}
function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}
function createAnonymizer(replacer, options) {
  return (data) => {
    let mutateValue = deepClone(data);
    const nodes = extractStringNodes(mutateValue, {
      maxDepth: options?.maxDepth
    });
    const processor = Array.isArray(replacer) ? (() => {
      const replacers = replacer.map(({ pattern, type, replace }) => {
        if (type != null && type !== "pattern")
          throw new Error("Invalid anonymizer type");
        return [
          typeof pattern === "string" ? new RegExp(pattern, "g") : pattern,
          replace ?? "[redacted]"
        ];
      });
      if (replacers.length === 0)
        throw new Error("No replacers provided");
      return {
        maskNodes: (nodes2) => {
          return nodes2.reduce((memo, item) => {
            const newValue = replacers.reduce((value, [regex, replace]) => {
              const result = value.replace(regex, replace);
              regex.lastIndex = 0;
              return result;
            }, item.value);
            if (newValue !== item.value) {
              memo.push({ ...item, value: newValue });
            }
            return memo;
          }, []);
        }
      };
    })() : typeof replacer === "function" ? {
      maskNodes: (nodes2) => nodes2.reduce((memo, item) => {
        const newValue = replacer(item.value, item.path);
        if (newValue !== item.value) {
          memo.push({ ...item, value: newValue });
        }
        return memo;
      }, [])
    } : replacer;
    const nodesById = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      nodesById.set(node._id, node);
    }
    const toUpdate = processor.maskNodes(nodes);
    for (const node of toUpdate) {
      if (node.path === "") {
        mutateValue = node.value;
      } else {
        const asInternal = node;
        const internal = asInternal._id !== void 0 ? nodesById.get(asInternal._id) : nodes.find((n2) => n2.path === node.path);
        if (internal) {
          internal.parent[internal.key] = node.value;
        }
      }
    }
    return mutateValue;
  };
}
var SECRET_PLACEHOLDER = "[SECRET_DETECTED]";
var DEFAULT_SECRET_RULES = [
  // ── Provider API keys (prefix-anchored) ─────────────────────────────────
  // Anthropic
  { pattern: /sk-ant-[A-Za-z0-9_-]{20,}/g, replace: SECRET_PLACEHOLDER },
  // OpenAI: project / service-account / admin keys, then legacy `sk-...`
  {
    pattern: /sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}/g,
    replace: SECRET_PLACEHOLDER
  },
  { pattern: /sk-[A-Za-z0-9]{32,}/g, replace: SECRET_PLACEHOLDER },
  // LangSmith (keys are multi-segment: lsv2_pt_<key>_<tail> — match the
  // full underscore-delimited tail so none of it leaks past the placeholder)
  {
    pattern: /lsv2_(?:pt|sk)_[A-Za-z0-9]{32,}(?:_[A-Za-z0-9]+)*/g,
    replace: SECRET_PLACEHOLDER
  },
  { pattern: /ls__[A-Za-z0-9]{16,}/g, replace: SECRET_PLACEHOLDER },
  // GitHub personal access / app tokens
  { pattern: /gh[pousr]_[A-Za-z0-9]{36,}/g, replace: SECRET_PLACEHOLDER },
  { pattern: /github_pat_[A-Za-z0-9_]{82}/g, replace: SECRET_PLACEHOLDER },
  // GitLab personal access token
  { pattern: /glpat-[A-Za-z0-9_-]{20,}/g, replace: SECRET_PLACEHOLDER },
  // AWS access key id (covers AKIA/ASIA/ABIA/ACCA/A3T* prefixes)
  {
    pattern: /\b(?:AKIA|ASIA|ABIA|ACCA|A3T[A-Z0-9])[0-9A-Z]{16}\b/g,
    replace: SECRET_PLACEHOLDER
  },
  // Google API key + OAuth access token
  { pattern: /AIza[0-9A-Za-z_-]{35}/g, replace: SECRET_PLACEHOLDER },
  { pattern: /ya29\.[0-9A-Za-z_-]+/g, replace: SECRET_PLACEHOLDER },
  // Slack tokens (bot/user + app-level) + incoming webhooks
  { pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/g, replace: SECRET_PLACEHOLDER },
  { pattern: /xapp-\d-[A-Za-z0-9-]{10,}/g, replace: SECRET_PLACEHOLDER },
  {
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/g,
    replace: SECRET_PLACEHOLDER
  },
  // Stripe
  {
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/g,
    replace: SECRET_PLACEHOLDER
  },
  // npm
  { pattern: /npm_[A-Za-z0-9]{36}/g, replace: SECRET_PLACEHOLDER },
  // PyPI upload token
  {
    pattern: /pypi-AgEIcHlwaS[A-Za-z0-9_-]{50,}/g,
    replace: SECRET_PLACEHOLDER
  },
  // SendGrid
  {
    pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g,
    replace: SECRET_PLACEHOLDER
  },
  // ── Structured tokens ────────────────────────────────────────────────────
  // JWT (header.payload.signature)
  {
    pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    replace: SECRET_PLACEHOLDER
  },
  // PEM private key blocks (RSA/EC/OPENSSH/DSA/plain + PGP "...KEY BLOCK")
  {
    pattern: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY(?: BLOCK)?-----[\s\S]+?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY(?: BLOCK)?-----/g,
    replace: SECRET_PLACEHOLDER
  },
  // ── Structural / contextual (sensitive NAME + assignment) ─────────────────
  // KEY=value or "key": "value" where the name looks sensitive. Keep the name
  // and separator ($1), redact the value. Notes:
  //  - (?![A-Za-z0-9]) after the keyword requires a component boundary, so
  //    `token` matches `api_token`/`mytoken` but NOT `tokenizer`/`tokens`.
  //  - the value may start with an auth scheme word (Bearer/Token/Basic) so a
  //    `X-Api-Key: Bearer <tok>` shape redacts the credential, not just "Bearer".
  //  - value excludes & and ; so query-string params past the secret survive.
  //  - requires a 6+ char value so short non-secret values are not touched.
  {
    pattern: /\b([A-Za-z0-9_.-]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE[_-]?KEY|ACCESS[_-]?KEY|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET)(?![A-Za-z0-9])(?:[_.-][A-Za-z0-9]+)*["']?\s*[:=]\s*["']?)(?:(?:bearer|token|basic)\s+)?[^\s"'&;]{6,}/gi,
    replace: `$1${SECRET_PLACEHOLDER}`
  },
  // Authorization / API-key headers. Keep the header name + separator ($1$2)
  // and an optional scheme ($3); redact the credential.
  {
    pattern: /\b(authorization|x-api-key|x-auth-token)(["']?\s*[:=]\s*["']?)(bearer\s+|token\s+|basic\s+)?[A-Za-z0-9._~+/-]{8,}=*/gi,
    replace: `$1$2$3${SECRET_PLACEHOLDER}`
  },
  // Bare "Bearer <token>" (any case; the scheme word is preserved via $1).
  {
    pattern: /\b(Bearer\s+)[A-Za-z0-9._~+/-]{10,}=*/gi,
    replace: `$1${SECRET_PLACEHOLDER}`
  },
  // Credentials embedded in URLs: proto://user:PASS@host -> redact PASS only.
  // Username is optional so proto://:PASS@host (empty user) is still covered.
  {
    pattern: /\b([a-z][a-z0-9+.-]*:\/\/[^:@/\s]*:)[^@/\s]+(@)/gi,
    replace: `$1${SECRET_PLACEHOLDER}$2`
  }
];
function createSecretAnonymizer(options) {
  const rules = [...DEFAULT_SECRET_RULES, ...options?.extraRules ?? []];
  return createAnonymizer(rules, { maxDepth: options?.maxDepth ?? 24 });
}

// dist/src/hooks/flush-queue.js
import { join as join22 } from "node:path";

// dist/src/utils/hook-init.js
function initHook(cwd, options) {
  const config = loadConfig({ cwd, deferGit: options?.deferGit });
  initLogger(config.debug);
  if (!config.enabled) {
    return null;
  }
  if (!config.apiKey && (!config.replicas || config.replicas.length === 0)) {
    error("No API key set (CC_LANGSMITH_API_KEY or LANGSMITH_API_KEY) and no replicas configured");
    return null;
  }
  return config;
}
function expandHome(path3) {
  return path3?.replace(/^~/, process.env.HOME ?? "");
}

// dist/src/queue.js
import { mkdirSync as mkdirSync6, readFileSync as readFileSync7, readdirSync as readdirSync3, statSync as statSync5, unlinkSync as unlinkSync4 } from "node:fs";
import { join as join5 } from "node:path";
import { createHmac, randomUUID as randomUUID2 } from "node:crypto";

// dist/src/utils/atomic-file.js
import { openSync, writeSync, closeSync, renameSync as renameSync5 } from "node:fs";
import { randomUUID } from "node:crypto";
function publishByRename(path3, contents, tempSuffix, mode) {
  const temp = `${path3}.${randomUUID()}${tempSuffix}`;
  const fd = openSync(temp, "wx", mode);
  try {
    writeSync(fd, contents);
  } finally {
    closeSync(fd);
  }
  renameSync5(temp, path3);
}

// dist/src/utils/session-store.js
import { readdirSync, rmdirSync } from "node:fs";
import { dirname as dirname3, join as join3 } from "node:path";
var safeName = (value) => {
  const safe = value.replace(QUEUE_SESSION_UNSAFE_CHARS, "_");
  return /[^.]/.test(safe) ? safe : `_${safe}`;
};
var storeRoot = (stateFilePath, dirName) => join3(dirname3(stateFilePath), dirName);
var storeDir = (stateFilePath, dirName, sessionId) => join3(storeRoot(stateFilePath, dirName), safeName(sessionId));
function listStoredSessions(stateFilePath, dirName) {
  try {
    return readdirSync(storeRoot(stateFilePath, dirName), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}
function discardDirIfEmpty(dir) {
  try {
    rmdirSync(dir);
  } catch {
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/privacy/constants.js
var MUTED_TRACE_CONTENT = "[LangSmith system notice: content omitted because tracing is muted.]";
var METADATA_MODE_RUN_CONFIG_FIELDS = [
  "client",
  "id",
  "name",
  "run_type",
  "project_name",
  "start_time",
  "end_time",
  "parent_run",
  "parent_run_id",
  "trace_id",
  "dotted_order",
  "distributedParentId"
];

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/privacy/run-tree.js
function mutedContent(role) {
  return { messages: [{ role, content: MUTED_TRACE_CONTENT }] };
}
function statusOfRun(run) {
  const metadataStatus = run.extra?.metadata?.status;
  if (run.error != null || metadataStatus === "error")
    return "error";
  if (run.end_time != null || metadataStatus === "completed")
    return "completed";
  return "running";
}
function projectReplica(replica) {
  if (!replica || typeof replica !== "object")
    return replica;
  if (Array.isArray(replica))
    return { projectName: replica[0] };
  const { updates: _updates, ...safe } = replica;
  return safe;
}
function extraForMode(metadata, integration, status) {
  return {
    metadata,
    toJSON() {
      const currentStatus = this.metadata?.status;
      const safeStatus = currentStatus === "running" || currentStatus === "completed" || currentStatus === "error" ? currentStatus : status;
      return {
        metadata: projectCodingAgentMetadata(this.metadata, integration, safeStatus)
      };
    }
  };
}
function configForMetadataMode(config, integration, privacyContext) {
  const source = config;
  const status = privacyContext?.status ?? (source.error != null ? "error" : source.end_time != null ? "completed" : "running");
  const originalExtra = source.extra;
  const safe = {};
  for (const key of METADATA_MODE_RUN_CONFIG_FIELDS) {
    if (key in source && source[key] !== void 0)
      safe[key] = source[key];
  }
  if (Array.isArray(source.replicas))
    safe.replicas = source.replicas.map(projectReplica);
  safe.inputs = mutedContent("user");
  safe.outputs = mutedContent("assistant");
  safe.extra = extraForMode(metadataForMode(originalExtra?.metadata, integration, "metadata", status) ?? {}, integration, status);
  return safe;
}
function sanitizeRunTree(run, integration) {
  const status = statusOfRun(run);
  const metadata = projectCodingAgentMetadata(run.extra?.metadata, integration, status);
  run.inputs = mutedContent("user");
  run.outputs = mutedContent("assistant");
  delete run.error;
  run.serialized = {};
  delete run.tags;
  delete run.reference_example_id;
  delete run.attachments;
  delete run.events;
  if (run.replicas)
    run.replicas = run.replicas.map(projectReplica);
  for (const child of run.child_runs ?? [])
    sanitizeRunTree(child, integration);
  run.extra = extraForMode(metadata, integration, status);
}
function protectRunTree(run, integration) {
  sanitizeRunTree(run, integration);
  const createChild = run.createChild.bind(run);
  run.createChild = (config) => protectRunTree(createChild(configForMetadataMode(config, integration)), integration);
  const postRun = run.postRun.bind(run);
  run.postRun = async (excludeChildRuns = true) => {
    sanitizeRunTree(run, integration);
    if (!excludeChildRuns) {
      const childRuns = [...run.child_runs];
      await postRun(true);
      for (const childRun of childRuns)
        await childRun.postRun(false);
      return;
    }
    return postRun(excludeChildRuns);
  };
  const patchRun = run.patchRun.bind(run);
  run.patchRun = (options) => {
    sanitizeRunTree(run, integration);
    return patchRun({ excludeInputs: false, ...options });
  };
  const end = run.end.bind(run);
  run.end = (outputs, error2, endTime, metadata) => {
    const status = error2 != null ? "error" : endTime != null ? "completed" : statusOfRun(run);
    const safeMetadata = metadataForMode(metadata, integration, "metadata", status) ?? { status };
    return end(mutedContent("assistant"), void 0, endTime, safeMetadata);
  };
  const toJSON = run.toJSON.bind(run);
  run.toJSON = () => {
    sanitizeRunTree(run, integration);
    return toJSON();
  };
  return run;
}
function preserveFullModePatchInputs(run) {
  const createChild = run.createChild.bind(run);
  run.createChild = (config) => preserveFullModePatchInputs(createChild(config));
  const patchRun = run.patchRun.bind(run);
  run.patchRun = (options) => patchRun({ excludeInputs: false, ...options });
  return run;
}
function createCodingAgentRunTree(config, integration, mode = "full", privacyContext) {
  const run = new RunTree(mode === "metadata" ? configForMetadataMode(config, integration, privacyContext) : config);
  return mode === "metadata" ? protectRunTree(run, integration) : preserveFullModePatchInputs(run);
}
function survivingCodingAgentPatchFields(projectedRun, fields) {
  return fields.filter((field2) => {
    const descriptor = Object.getOwnPropertyDescriptor(projectedRun, field2);
    return descriptor?.enumerable === true && "value" in descriptor && descriptor.value !== void 0;
  });
}

// dist/src/privacy.js
function metadataForMode2(metadata, mode = "full", status) {
  return metadataForMode(metadata, CLAUDE_CODE_INTEGRATION, mode, status);
}
function sanitizeReplica(replica, mode) {
  if (mode === "full")
    return replica;
  return projectReplica(replica);
}
function runConfigForMode(config, mode = "full") {
  if (mode === "full")
    return config;
  const status = config.error ? "error" : config.end_time != null ? "completed" : "running";
  const extra = config.extra;
  const safe = {};
  for (const key of [
    "client",
    "id",
    "name",
    "run_type",
    "project_name",
    "start_time",
    "end_time",
    "parent_run_id",
    "trace_id",
    "dotted_order"
  ]) {
    if (key in config && config[key] !== void 0)
      safe[key] = config[key];
  }
  if (Array.isArray(config.replicas)) {
    safe.replicas = config.replicas.map((replica) => sanitizeReplica(replica, mode));
  }
  safe.inputs = { messages: [{ role: "user", content: MUTED_TRACE_CONTENT }] };
  safe.outputs = { messages: [{ role: "assistant", content: MUTED_TRACE_CONTENT }] };
  safe.extra = {
    metadata: metadataForMode2(extra?.metadata, mode, status),
    // RunTree and Client both enrich extra AFTER construction. A client-level
    // omitTracedRuntimeInfo flag alone does not suppress RunTree's additions,
    // and replicas may use their own clients. Keep this method enumerable so it
    // survives SDK object spreads and filters at the REST serialization boundary
    // (including multipart .extra parts). Wire-payload tests guard this SDK behavior.
    toJSON() {
      return {
        // Read the current metadata, not the constructor's copy: the client may
        // have anonymized allowlisted values, which must not be restored here.
        metadata: projectCodingAgentMetadata(this.metadata, CLAUDE_CODE_INTEGRATION, typeof this.metadata?.status === "string" ? this.metadata.status : status)
      };
    }
  };
  return safe;
}
function createRunTree(config, mode = "full") {
  const run = new RunTree(runConfigForMode(config, mode));
  if (mode === "metadata" && run.replicas) {
    run.replicas = run.replicas.map((replica) => sanitizeReplica(replica, mode));
  }
  if (typeof run.patchRun === "function") {
    const patchRun = run.patchRun.bind(run);
    run.patchRun = (options) => patchRun({ excludeInputs: false, ...options });
  }
  return run;
}

// dist/src/turn-record.js
import { appendFileSync as appendFileSync2, existsSync as existsSync3, mkdirSync as mkdirSync5, readFileSync as readFileSync6, readdirSync as readdirSync2, statSync as statSync4, unlinkSync as unlinkSync3 } from "node:fs";
import { dirname as dirname4, isAbsolute as isAbsolute2, join as join4 } from "node:path";

// dist/src/utils/validation/origin.js
import { isAbsolute } from "node:path";
function isValidRecordOrigin(value) {
  return typeof value === "string" && value.length > 0 && value.length <= TURN_RECORD_VALIDATION_LIMITS.originLength;
}
function isValidOriginPath(value) {
  return typeof value === "string" && value.length > 0 && value.length <= TURN_RECORD_VALIDATION_LIMITS.pathLength && !value.includes(TURN_RECORD_ORIGIN_NULL_CHARACTER) && isAbsolute(value);
}

// dist/src/turn-record.js
var turnRecordRoot = (stateFilePath) => storeRoot(stateFilePath, TURN_RECORD_DIR_NAME);
var turnRecordDir = (stateFilePath, sessionId) => storeDir(stateFilePath, TURN_RECORD_DIR_NAME, sessionId);
function turnRecordPath(stateFilePath, sessionId, turnKey) {
  return join4(turnRecordDir(stateFilePath, sessionId), `${safeName(turnKey)}${TURN_RECORD_SUFFIX}`);
}
function entriesIn(dir, suffix) {
  try {
    return readdirSync2(dir).filter((name) => name.endsWith(suffix)).sort().map((name) => join4(dir, name));
  } catch {
    return [];
  }
}
var listRecordedSessions = (stateFilePath) => listStoredSessions(stateFilePath, TURN_RECORD_DIR_NAME);
var listTurnRecords = (dir) => entriesIn(dir, TURN_RECORD_SUFFIX);
function recordsIdleMs(dir, now = Date.now()) {
  let newest = 0;
  for (const path3 of listTurnRecords(dir)) {
    try {
      newest = Math.max(newest, statSync4(path3).mtimeMs);
    } catch {
    }
  }
  return newest === 0 ? Number.POSITIVE_INFINITY : now - newest;
}
function append(path3, line) {
  try {
    mkdirSync5(dirname4(path3), { recursive: true, mode: PRIVATE_DIR_MODE });
    appendFileSync2(path3, `${JSON.stringify(line)}
`, { mode: PRIVATE_FILE_MODE });
    return true;
  } catch (err) {
    warn(`Could not add to the turn record: ${err}`);
    return false;
  }
}
function validResolvedToolOriginMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return false;
  return Object.entries(value).every(([key, item]) => REPOSITORY_METADATA_KEYS.includes(key) && typeof item === "string" && item.length <= TURN_RECORD_VALIDATION_LIMITS.resolvedMetadataValueLength);
}
function isClaudeRecordedToolOrigin(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return false;
  const candidate = value;
  if (Object.keys(candidate).some((key) => !TURN_RECORD_TOOL_ORIGIN_KEYS.includes(key)) || typeof candidate.toolUseId !== "string" || candidate.toolUseId.length === 0 || candidate.toolUseId.length > TURN_RECORD_VALIDATION_LIMITS.toolUseIdLength || typeof candidate.toolName !== "string" || candidate.toolName.length === 0 || candidate.toolName.length > TURN_RECORD_VALIDATION_LIMITS.toolNameLength || !Number.isSafeInteger(candidate.order) || candidate.order < 0 || !candidate.origin || typeof candidate.origin !== "object" || Array.isArray(candidate.origin)) {
    return false;
  }
  const origin = candidate.origin;
  if (Object.keys(origin).some((key) => !TURN_RECORD_TOOL_ORIGIN_FIELDS.includes(key)) || typeof origin.namedAPath !== "boolean" || origin.path !== void 0 && !isValidOriginPath(origin.path) || origin.cwd !== void 0 && !isValidOriginPath(origin.cwd)) {
    return false;
  }
  if (candidate.pinnedRepositoryKeys !== void 0 && (!Array.isArray(candidate.pinnedRepositoryKeys) || !candidate.pinnedRepositoryKeys.every((key) => typeof key === "string" && REPOSITORY_METADATA_KEYS.includes(key)))) {
    return false;
  }
  if (candidate.resolvedMetadata === void 0)
    return true;
  return validResolvedToolOriginMetadata(candidate.resolvedMetadata);
}
function recordedRun(run, tracing, shared, routing, toolUseId) {
  const safe = runConfigForMode(run, tracing);
  const extra = safe.extra;
  if (typeof safe.id !== "string" || typeof safe.dotted_order !== "string" || routing !== void 0 && (typeof routing.cwd !== "string" || !routing.cwd.trim() || !isAbsolute2(routing.cwd)))
    return void 0;
  return {
    run_id: safe.id,
    ...toolUseId === void 0 ? {} : { toolUseId },
    parent_run_id: typeof safe.parent_run_id === "string" ? safe.parent_run_id : void 0,
    trace_id: typeof safe.trace_id === "string" ? safe.trace_id : safe.id,
    dotted_order: safe.dotted_order,
    name: typeof safe.name === "string" ? safe.name : "",
    run_type: typeof safe.run_type === "string" ? safe.run_type : RECORDED_RUN_FALLBACK_TYPE,
    project_name: typeof safe.project_name === "string" ? safe.project_name : void 0,
    start_time: typeof safe.start_time === "string" ? safe.start_time : void 0,
    end_time: typeof safe.end_time === "string" ? safe.end_time : void 0,
    tracing,
    ...shared ? { shared: true } : {},
    ...routing === void 0 ? {} : { routing },
    metadata: JSON.parse(JSON.stringify(extra?.metadata ?? {}))
  };
}
function recordRun(options) {
  const run = recordedRun(options.run, options.tracing, options.shared ?? false, options.routing, options.toolUseId);
  if (!run)
    return false;
  if (options.closesAt) {
    run.open = true;
    run.end_time = options.closesAt;
  }
  return append(options.path, {
    k: TURN_RECORD_LINE.run,
    root: options.root,
    origin: options.origin,
    run
  });
}
function recordToolOrigin(path3, origin, tracing, toolOrigin2) {
  if (tracing !== "full")
    return true;
  if (!isValidRecordOrigin(origin) || !isClaudeRecordedToolOrigin(toolOrigin2))
    return false;
  return append(path3, { k: TURN_RECORD_LINE.toolOrigin, origin, toolOrigin: toolOrigin2 });
}
function sameMetadata(left, right) {
  if (left === void 0)
    return false;
  const leftEntries = Object.entries(left ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries);
}
function recordResolvedToolOriginMetadata(path3, origin, toolUseId, metadata) {
  if (!isValidRecordOrigin(origin) || !validResolvedToolOriginMetadata(metadata))
    return false;
  const record = readTurnRecord(path3);
  if (!record || record.origin !== origin)
    return false;
  const toolOrigin2 = record.toolOrigins.find((candidate) => candidate.toolUseId === toolUseId);
  if (!toolOrigin2)
    return false;
  if (sameMetadata(toolOrigin2.resolvedMetadata, metadata))
    return true;
  return append(path3, {
    k: TURN_RECORD_LINE.toolOrigin,
    origin,
    toolOrigin: {
      ...toolOrigin2,
      resolvedMetadata: { ...toolOrigin2.resolvedMetadata, ...metadata }
    }
  });
}
function recordResolvedMetadata(path3, runId, metadata, expectedOrigin) {
  const record = readTurnRecord(path3);
  if (!record || expectedOrigin !== void 0 && record.origin !== expectedOrigin)
    return false;
  const isRoot = record.root?.run_id === runId;
  const run = isRoot ? record.root : record.children.find((child) => child.run_id === runId);
  if (!run)
    return false;
  const additions = Object.fromEntries(Object.entries(metadata).filter(([key, value]) => run.metadata[key] !== value));
  if (Object.keys(additions).length === 0)
    return true;
  return append(path3, {
    k: TURN_RECORD_LINE.run,
    ...isRoot ? { root: true } : {},
    origin: record.origin,
    ...expectedOrigin === void 0 ? {} : { ackOrigin: expectedOrigin },
    run: { ...run, metadata: { ...run.metadata, ...additions } }
  });
}
function recordTurnClosed(path3, turnId) {
  append(path3, { k: TURN_RECORD_LINE.closed, turn_id: turnId });
}
function closeTurnRecord(options) {
  const path3 = turnRecordPath(options.stateFilePath, options.sessionId, options.turnRunId);
  if (!existsSync3(path3))
    return;
  recordTurnClosed(path3, options.turnId);
}
function recordDelivered(path3, runId, expectedOrigin) {
  if (expectedOrigin !== void 0) {
    const record = readTurnRecord(path3);
    if (!record || record.origin !== expectedOrigin)
      return false;
  }
  return append(path3, {
    k: TURN_RECORD_LINE.delivered,
    id: runId,
    ...expectedOrigin === void 0 ? {} : { origin: expectedOrigin, ackOrigin: expectedOrigin }
  });
}
function recordReconciled(path3, runId) {
  append(path3, { k: TURN_RECORD_LINE.reconciled, id: runId });
}
function readTurnRecord(path3) {
  let contents;
  try {
    if (statSync4(path3).size > TURN_RECORD_MAX_BYTES) {
      warn(`Dropping a turn record too large to be real: ${path3}`);
      discardTurnRecord(path3);
      return void 0;
    }
    contents = readFileSync6(path3, "utf-8");
  } catch {
    return void 0;
  }
  const record = {
    path: path3,
    origin: "",
    children: [],
    toolOrigins: [],
    closed: false,
    delivered: /* @__PURE__ */ new Set(),
    fixed: /* @__PURE__ */ new Set()
  };
  const byId = /* @__PURE__ */ new Map();
  const originsByToolUseId = /* @__PURE__ */ new Map();
  const runLines = [];
  const scopedDeliveryLines = [];
  for (const line of contents.split("\n")) {
    if (!line)
      continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    const ackOrigin = "ackOrigin" in parsed ? parsed.ackOrigin : void 0;
    if (ackOrigin !== void 0) {
      if (!isValidRecordOrigin(ackOrigin))
        continue;
      if (parsed.k === TURN_RECORD_LINE.run && typeof parsed.run?.run_id === "string") {
        runLines.push(parsed);
      } else if (parsed.k === TURN_RECORD_LINE.delivered && typeof parsed.id === "string") {
        scopedDeliveryLines.push(parsed);
      }
      continue;
    }
    if (parsed.k === TURN_RECORD_LINE.run && typeof parsed.run?.run_id === "string") {
      runLines.push(parsed);
      if (parsed.origin)
        record.origin = parsed.origin;
    } else if (parsed.k === TURN_RECORD_LINE.toolOrigin && isClaudeRecordedToolOrigin(parsed.toolOrigin) && (parsed.origin === void 0 || isValidRecordOrigin(parsed.origin)) && (!parsed.origin || !record.origin || parsed.origin === record.origin)) {
      if (parsed.origin)
        record.origin = parsed.origin;
      originsByToolUseId.set(parsed.toolOrigin.toolUseId, parsed.toolOrigin);
    } else if (parsed.k === TURN_RECORD_LINE.closed) {
      record.closed = true;
      record.turnId = parsed.turn_id;
    } else if (parsed.k === TURN_RECORD_LINE.delivered && typeof parsed.id === "string") {
      record.delivered.add(parsed.id);
    } else if (parsed.k === TURN_RECORD_LINE.reconciled && typeof parsed.id === "string") {
      record.fixed.add(parsed.id);
    }
  }
  for (const line of runLines) {
    if (line.k !== TURN_RECORD_LINE.run || typeof line.run?.run_id !== "string")
      continue;
    if (line.ackOrigin !== void 0 && (line.ackOrigin !== record.origin || line.origin !== line.ackOrigin))
      continue;
    if (line.root)
      record.root = line.run;
    else
      byId.set(line.run.run_id, line.run);
  }
  for (const line of scopedDeliveryLines) {
    if (line.k === TURN_RECORD_LINE.delivered && line.ackOrigin === record.origin && line.origin === line.ackOrigin) {
      record.delivered.add(line.id);
    }
  }
  record.children = [...byId.values()];
  record.toolOrigins = [...originsByToolUseId.values()].sort((left, right) => left.order - right.order);
  return record;
}
function discardTurnRecord(path3) {
  try {
    unlinkSync3(path3);
    debug(`Removed the turn record ${path3}`);
  } catch {
  }
}

// dist/src/queue.js
function queueOrigin(destination) {
  const identity = JSON.stringify([
    destination.apiBaseUrl,
    destination.replicas ?? null,
    destination.redact ?? false,
    destination.redactExtraRules ?? null
  ]);
  return createHmac("sha256", destination.apiKey).update(identity).digest("hex").slice(0, QUEUE_ORIGIN_LENGTH);
}
var queueDir = (stateFilePath) => storeRoot(stateFilePath, QUEUE_DIR_NAME);
var queueSessionDir = (stateFilePath, sessionId) => storeDir(stateFilePath, QUEUE_DIR_NAME, sessionId);
var listQueues = (stateFilePath) => listStoredSessions(stateFilePath, QUEUE_DIR_NAME);
function names(dir) {
  try {
    return readdirSync3(dir);
  } catch {
    return [];
  }
}
function entryIds(dir) {
  try {
    return readdirSync3(dir).filter((name) => name.endsWith(QUEUE_FILE_SUFFIX)).sort().map((name) => name.slice(0, -QUEUE_FILE_SUFFIX.length));
  } catch {
    return [];
  }
}
function entryPath(dir, queueId) {
  return join5(dir, `${queueId}${QUEUE_FILE_SUFFIX}`);
}
function readEntry(dir, queueId) {
  try {
    const parsed = JSON.parse(readFileSync7(entryPath(dir, queueId), "utf-8"));
    return parsed && parsed.run ? { ...parsed, queue_id: queueId } : void 0;
  } catch {
    return void 0;
  }
}
function readQueue(dir) {
  return entryIds(dir).map((queueId) => readEntry(dir, queueId)).filter((entry) => entry !== void 0);
}
function publish(dir, queueId, entry) {
  publishByRename(entryPath(dir, queueId), JSON.stringify(entry), QUEUE_TEMP_SUFFIX, PRIVATE_FILE_MODE);
}
function trim(dir) {
  const ids = entryIds(dir);
  for (const queueId of ids.slice(0, Math.max(0, ids.length - QUEUE_MAX_ENTRIES))) {
    removeQueued(dir, queueId);
  }
}
async function enqueueRun(stateFilePath, sessionId, run, tracing, origin, record, where) {
  const dir = queueSessionDir(stateFilePath, sessionId);
  const queueId = `${String(Date.now()).padStart(QUEUE_ID_TIME_WIDTH, "0")}-${randomUUID2()}`;
  try {
    mkdirSync6(dir, { recursive: true, mode: PRIVATE_DIR_MODE });
    publish(dir, queueId, {
      tracing,
      attempts: 0,
      origin,
      record,
      where,
      run: runConfigForMode(run, tracing)
    });
    trim(dir);
    debug(`Queued run for upload in ${entryPath(dir, queueId)}`);
  } catch (err) {
    warn(`Could not queue run for upload: ${err}`);
  }
}
function abandonQueued(entry) {
  if (entry.record && typeof entry.run.id === "string")
    recordDelivered(entry.record, entry.run.id);
}
function removeQueued(dir, queueId) {
  try {
    unlinkSync4(entryPath(dir, queueId));
  } catch {
  }
}
function discardEmptyQueue(dir, now = Date.now()) {
  if (entryIds(dir).length > 0)
    return;
  if (queueIdleMs(dir, now) < EMPTY_QUEUE_MIN_IDLE_MS)
    return;
  for (const name of names(dir).filter((entry) => entry.endsWith(QUEUE_TEMP_SUFFIX))) {
    try {
      unlinkSync4(join5(dir, name));
    } catch {
    }
  }
  discardDirIfEmpty(dir);
}
function queueIdleMs(dir, now = Date.now()) {
  try {
    return now - statSync5(dir).mtimeMs;
  } catch {
    return 0;
  }
}
function queuedAtMs(queueId) {
  const queuedAt = Number(queueId.slice(0, QUEUE_ID_TIME_WIDTH));
  return Number.isFinite(queuedAt) && queuedAt > 0 ? queuedAt : void 0;
}
function oldestQueuedAtMs(dir) {
  const [oldest] = entryIds(dir);
  return oldest === void 0 ? void 0 : queuedAtMs(oldest);
}
function foreignQueueLooksAbandoned(dir, now = Date.now()) {
  const queuedAt = oldestQueuedAtMs(dir);
  if (queuedAt === void 0)
    return false;
  return now - queuedAt >= FOREIGN_QUEUE_MIN_RECORD_AGE_MS;
}
function runIsTooOldToUpload(entry, now = Date.now()) {
  const started = new Date(entry.run.start_time).getTime();
  if (Number.isFinite(started))
    return now - started >= QUEUE_RUN_MAX_AGE_MS;
  const queuedAt = queuedAtMs(entry.queue_id);
  return queuedAt === void 0 || now - queuedAt >= QUEUE_RUN_MAX_AGE_MS;
}

// dist/src/reconcile.js
function attributionOf(metadata) {
  const carried = {};
  for (const key of REPOSITORY_METADATA_KEYS) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.length > 0)
      carried[key] = value;
  }
  return carried;
}
var namesARepository = (carried) => carried[REPOSITORY_NAME_KEY] !== void 0;
var everyChildLanded = (record) => record.children.every((child) => record.delivered.has(child.run_id));
function turnAttribution(record) {
  const inToolCallOrder = [...record.children].sort((left, right) => left.dotted_order < right.dotted_order ? -1 : 1);
  return turnAttributionFromOrderedChildren(record, inToolCallOrder);
}
function turnAttributionFromOrderedChildren(record, children) {
  const root = attributionOf(record.root?.metadata);
  const inToolCallOrder = children.map((child) => attributionOf(child.metadata));
  const source = namesARepository(root) ? root : inToolCallOrder.find((carried) => namesARepository(carried));
  const knowsWhoWorkedInSource = (carried) => carried[ATTRIBUTION_IDENTIFIER_KEY] !== void 0 && carried[REPOSITORY_NAME_KEY] === source?.[REPOSITORY_NAME_KEY];
  const author = root[ATTRIBUTION_IDENTIFIER_KEY] ?? source?.[ATTRIBUTION_IDENTIFIER_KEY] ?? inToolCallOrder.find(knowsWhoWorkedInSource)?.[ATTRIBUTION_IDENTIFIER_KEY];
  const filled = { ...source };
  if (author !== void 0)
    filled[ATTRIBUTION_IDENTIFIER_KEY] = author;
  return Object.keys(filled).length > 0 ? filled : void 0;
}
function metadataAfterFill(run, filled) {
  const carried = attributionOf(run.metadata);
  const workedOutItsOwn = namesARepository(carried) && carried[REPOSITORY_NAME_KEY] !== filled[REPOSITORY_NAME_KEY];
  if (workedOutItsOwn)
    return void 0;
  const missing = Object.entries(filled).filter(([key]) => carried[key] === void 0);
  if (missing.length === 0)
    return void 0;
  return { ...run.metadata, ...Object.fromEntries(missing) };
}
function settledTurnMetadata(base, record) {
  if (!record?.root)
    return base;
  const filled = turnAttribution({ ...record, root: { ...record.root, metadata: base ?? {} } });
  if (!filled)
    return base;
  const missing = Object.entries(filled).filter(([key]) => base?.[key] === void 0);
  return missing.length === 0 ? base : { ...base, ...Object.fromEntries(missing) };
}
function settledFromTurn(options) {
  const { base, stateFilePath, sessionId, turnRunId } = options;
  if (!turnRunId)
    return base;
  const record = readTurnRecord(turnRecordPath(stateFilePath, sessionId, turnRunId));
  if (!record || !everyChildLanded(record))
    return base;
  return settledTurnMetadata(base, record) ?? base;
}
function attributionFiller(target) {
  const record = target ? readTurnRecord(target.path) : void 0;
  return (metadata) => settledTurnMetadata(metadata, record) ?? metadata;
}
function runConfig(run, metadata, client2, replicas2) {
  return {
    client: client2,
    replicas: replicas2,
    id: run.run_id,
    name: run.name,
    run_type: run.run_type,
    project_name: run.project_name,
    start_time: run.start_time,
    end_time: run.end_time,
    parent_run_id: run.parent_run_id,
    trace_id: run.trace_id,
    dotted_order: run.dotted_order,
    extra: { metadata }
  };
}
function alreadyUpdated(failure2) {
  const status = failure2?.status;
  return status === UPDATE_ALREADY_RECEIVED_STATUS;
}
function tooOldToUpload(record, now) {
  const started = new Date(record.root?.start_time ?? "").getTime();
  return Number.isFinite(started) && now - started >= QUEUE_RUN_MAX_AGE_MS;
}
async function reconcileTurn(options) {
  const { record, client: client2, replicas: replicas2, watch } = options;
  const now = options.now ?? Date.now();
  if (!record.root)
    return true;
  if (tooOldToUpload(record, now)) {
    warn(`Dropping a turn record LangSmith will no longer accept: ${record.path}`);
    return true;
  }
  if (!record.closed)
    return false;
  if (!everyChildLanded(record)) {
    debug(`Waiting for the rest of ${record.path} to land before settling it`);
    return false;
  }
  const filled = turnAttribution(record) ?? {};
  const stillOpen = record.children.filter((child) => !child.shared && child.open && record.delivered.has(child.run_id));
  let settled = true;
  for (const run of [...record.root.shared ? [] : [record.root], ...stillOpen]) {
    if (record.fixed.has(run.run_id))
      continue;
    const metadata = metadataAfterFill(run, filled) ?? run.metadata;
    const runTree = createRunTree(runConfig(run, metadata, client2, replicas2), run.tracing);
    await runTree.patchRun({ excludeInputs: true });
    const failure2 = watch.failure();
    if (failure2 && !alreadyUpdated(failure2)) {
      warn(`Could not settle the repository on run ${run.run_id}: ${failure2}`);
      settled = false;
      continue;
    }
    recordReconciled(record.path, run.run_id);
    debug(`Settled the repository and author on run ${run.run_id}`);
  }
  return settled;
}
async function reconcileAndClear(options) {
  if (await reconcileTurn(options))
    discardTurnRecord(options.record.path);
}

// dist/src/upload-confirm.js
function watchUploads(client2) {
  let failure2;
  const createRun = client2.createRun.bind(client2);
  const updateRun = client2.updateRun.bind(client2);
  client2.createRun = async (...args) => {
    try {
      return await createRun(...args);
    } catch (err) {
      failure2 = err;
      throw err;
    }
  };
  client2.updateRun = async (...args) => {
    try {
      return await updateRun(...args);
    } catch (err) {
      failure2 = err;
      throw err;
    }
  };
  return {
    failure() {
      const seen = failure2;
      failure2 = void 0;
      return seen;
    }
  };
}

// dist/src/utils/file-lock.js
import { readFileSync as readFileSync8, writeFileSync as writeFileSync4, linkSync, mkdirSync as mkdirSync7, unlinkSync as unlinkSync5 } from "node:fs";
import { dirname as dirname5 } from "node:path";
import { randomUUID as randomUUID3 } from "node:crypto";
function lockPath(stateFilePath) {
  return `${stateFilePath}.lock`;
}
function releaseLock(stateFilePath) {
  try {
    unlinkSync5(lockPath(stateFilePath));
  } catch {
  }
}
function claimLock(lock) {
  const staging = `${lock}.${randomUUID3()}${LOCK_STAGING_SUFFIX}`;
  try {
    writeFileSync4(staging, String(process.pid), { mode: PRIVATE_FILE_MODE });
  } catch {
    return false;
  }
  try {
    linkSync(staging, lock);
    return true;
  } catch {
    return false;
  } finally {
    try {
      unlinkSync5(staging);
    } catch {
    }
  }
}
function holderIsGone(lock) {
  let pid;
  try {
    pid = Number(readFileSync8(lock, "utf-8"));
  } catch {
    return false;
  }
  if (!Number.isInteger(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch (err) {
    return err.code !== "EPERM";
  }
}
function tryAcquireLock(filePath) {
  const lock = lockPath(filePath);
  try {
    mkdirSync7(dirname5(filePath), { recursive: true });
  } catch {
    return false;
  }
  if (claimLock(lock))
    return true;
  if (!holderIsGone(lock))
    return false;
  try {
    unlinkSync5(lock);
  } catch {
    return false;
  }
  return claimLock(lock);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/capture/capture-store.js
import { lstat as lstat3 } from "node:fs/promises";
import { join as join9, resolve as resolve4 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/capture/paths.js
import { createHash } from "node:crypto";
import { resolve as resolve2, join as join6 } from "node:path";
function validateIntegration(value) {
  if (!CAPTURE_INTEGRATION.test(value))
    throw new TypeError("Invalid integration namespace");
}
function validateIdentifier(value, name) {
  if (value.length === 0 || Buffer.byteLength(value, "utf8") > CAPTURE_MAX_IDENTIFIER_BYTES || hasControlCharacter(value)) {
    throw new TypeError(`Invalid ${name}`);
  }
}
function hasControlCharacter(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== void 0 && (codePoint < 32 || codePoint === 127))
      return true;
  }
  return false;
}
function identifierHash(value) {
  return createHash("sha256").update(value).digest("hex");
}
function captureDirectory(root) {
  return join6(resolve2(root), CAPTURE_DIRECTORY);
}
function eventPath(root, scope) {
  return join6(captureDirectory(root), "integrations", scope.integration, "sessions", identifierHash(scope.sessionId), "turns", identifierHash(scope.turnId), "events", `${identifierHash(scope.eventId)}.json`);
}
function receiptPath(root, scope, destination) {
  return join6(captureDirectory(root), "integrations", scope.integration, "sessions", identifierHash(scope.sessionId), "turns", identifierHash(scope.turnId), "receipts", identifierHash(destination), `${identifierHash(scope.eventId)}.json`);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/capture/utils/atomic-file.js
import { constants as fsConstants } from "node:fs";
import { chmod, link, lstat, mkdir as mkdir3, open, unlink as unlink2 } from "node:fs/promises";
import { dirname as dirname6, isAbsolute as isAbsolute3, join as join7, relative, sep } from "node:path";
import { randomUUID as randomUUID4 } from "node:crypto";
async function ensurePrivateDirectory(root, segments) {
  await mkdir3(root, { recursive: true, mode: CAPTURE_DIRECTORY_MODE });
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink())
    throw new Error("Capture root must be a real directory");
  let current = root;
  for (const segment of segments) {
    current = join7(current, segment);
    try {
      await mkdir3(current, { mode: CAPTURE_DIRECTORY_MODE });
    } catch (error2) {
      if (errorCode(error2) !== "EEXIST")
        throw error2;
    }
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("Capture path contains a non-directory");
    await chmod(current, CAPTURE_DIRECTORY_MODE);
    const checked = await lstat(current);
    if (!checked.isDirectory() || checked.isSymbolicLink())
      throw new Error("Capture path changed during setup");
  }
  return current;
}
async function publishExclusive(path3, contents, beforeCommit) {
  const directory = dirname6(path3);
  const stagingPath = join7(directory, `.${randomUUID4()}.tmp`);
  const handle = await open(stagingPath, "wx", CAPTURE_FILE_MODE);
  try {
    await handle.writeFile(contents, "utf8");
    await handle.chmod(CAPTURE_FILE_MODE);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    beforeCommit?.();
    await link(stagingPath, path3);
    await syncDirectory(directory);
    return true;
  } catch (error2) {
    if (errorCode(error2) === "EEXIST")
      return false;
    throw error2;
  } finally {
    await unlink2(stagingPath).catch((error2) => {
      if (errorCode(error2) !== "ENOENT")
        throw error2;
    });
  }
}
async function readPrivateFile(root, path3) {
  if (!await hasRealParentDirectories(root, path3))
    return void 0;
  let handle;
  try {
    const info = await lstat(path3);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error("Capture record must be a regular file");
    handle = await open(path3, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
  } catch (error2) {
    if (errorCode(error2) === "ENOENT")
      return void 0;
    throw error2;
  }
  try {
    if (!(await handle.stat()).isFile())
      throw new Error("Capture record must be a regular file");
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}
async function hasRealParentDirectories(root, path3) {
  const relativeDirectory = relative(root, dirname6(path3));
  if (relativeDirectory === ".." || relativeDirectory.startsWith(`..${sep}`) || isAbsolute3(relativeDirectory)) {
    throw new Error("Capture path is outside storage root");
  }
  const directories = [root];
  let current = root;
  for (const segment of relativeDirectory.split(sep).filter(Boolean)) {
    current = join7(current, segment);
    directories.push(current);
  }
  for (const directory of directories) {
    let info;
    try {
      info = await lstat(directory);
    } catch (error2) {
      if (errorCode(error2) === "ENOENT")
        return false;
      throw error2;
    }
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("Capture path contains a non-directory");
  }
  return true;
}
async function syncDirectory(path3) {
  if (process.platform === "win32")
    return;
  const handle = await open(path3, fsConstants.O_RDONLY | (fsConstants.O_DIRECTORY ?? 0) | (fsConstants.O_NOFOLLOW ?? 0));
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}
function errorCode(error2) {
  return error2 !== null && typeof error2 === "object" && "code" in error2 && typeof error2.code === "string" ? error2.code : void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/utils/files/private-directory.js
import { lstat as lstat2, readdir as readdir3 } from "node:fs/promises";
import { isAbsolute as isAbsolute4, join as join8, relative as relative2, resolve as resolve3, sep as sep2 } from "node:path";
async function listPrivateDirectory(root, directory) {
  const storageRoot = resolve3(root);
  const target = resolve3(directory);
  const relativePath = relative2(storageRoot, target);
  if (relativePath === ".." || relativePath.startsWith(`..${sep2}`) || isAbsolute4(relativePath)) {
    throw new Error("Private directory is outside storage root");
  }
  let current = storageRoot;
  for (const segment of ["", ...relativePath.split(sep2).filter(Boolean)]) {
    if (segment)
      current = join8(current, segment);
    const info = await lstatDirectory(current);
    if (!info)
      return void 0;
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("Private path contains a non-directory");
  }
  const entries = await readdir3(target, { withFileTypes: true });
  const finalInfo = await lstat2(target);
  if (!finalInfo.isDirectory() || finalInfo.isSymbolicLink())
    throw new Error("Private path changed during enumeration");
  return entries;
}
async function lstatDirectory(path3) {
  try {
    return await lstat2(path3);
  } catch (error2) {
    if (errorCode2(error2) === "ENOENT")
      return void 0;
    throw error2;
  }
}
function errorCode2(error2) {
  return error2 !== null && typeof error2 === "object" && "code" in error2 && typeof error2.code === "string" ? error2.code : void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/capture/capture-store.js
function createCaptureStore(root) {
  const storageRoot = resolve4(root);
  return {
    async capture(input) {
      let record;
      let contents;
      try {
        validateScope(input);
        const dependencies = normalizeDependencies(input.dependencies, input);
        validateIdentifier(input.runId, "run ID");
        validateIdentifier(input.destinationFingerprint, "destination fingerprint");
        validateIdentifier(input.eventKind, "event kind");
        record = {
          version: CAPTURE_RECORD_VERSION,
          capturedAtMs: Date.now(),
          integration: input.integration,
          sessionId: input.sessionId,
          turnId: input.turnId,
          eventId: input.eventId,
          runId: input.runId,
          destinationFingerprint: input.destinationFingerprint,
          eventKind: input.eventKind,
          normalizedPayload: canonicalValue(input.normalizedPayload, /* @__PURE__ */ new Set()),
          turnEvidence: canonicalValue(input.turnEvidence, /* @__PURE__ */ new Set()),
          metadataProvenance: canonicalValue(input.metadataProvenance, /* @__PURE__ */ new Set()),
          ...input.sourceAgeStartedAtMs === void 0 ? {} : {
            sourceAgeStartedAtMs: requireSafeEpochMilliseconds(input.sourceAgeStartedAtMs, "Source age")
          },
          ...input.priorDeliveryAttempts === void 0 ? {} : {
            priorDeliveryAttempts: requireNonNegativeInteger(input.priorDeliveryAttempts, "Prior delivery attempts")
          },
          ...dependencies === void 0 ? {} : { dependencies }
        };
        contents = canonicalJson(record);
      } catch (error2) {
        return failure("SERIALIZATION_FAILED", error2);
      }
      try {
        const path3 = eventPath(storageRoot, input);
        await ensureDirectories(input.integration, input.sessionId, input.turnId, "events");
        if (await publishExclusive(path3, contents))
          return { status: "published", record };
        const previous = await readRecord(storageRoot, path3);
        if (previous === void 0)
          return {
            status: "failed",
            code: "STORAGE_FAILED",
            message: "Published event disappeared"
          };
        if (!sameScope(previous, input))
          return { status: "conflict" };
        return sameCapture(previous, record) ? { status: "duplicate", record: previous } : { status: "conflict" };
      } catch (error2) {
        return failure("STORAGE_FAILED", error2);
      }
    },
    async read(scope) {
      validateScope(scope);
      const record = await readRecord(storageRoot, eventPath(storageRoot, scope));
      if (record === void 0)
        return void 0;
      if (!sameScope(record, scope))
        throw new Error("Capture namespace does not match");
      return record;
    },
    async enumerate(integration, sessionId) {
      validateIntegration(integration);
      validateIdentifier(sessionId, "session ID");
      const turnsDirectory = join9(captureDirectory(storageRoot), "integrations", integration, "sessions", identifierHash(sessionId), "turns");
      const turns = await listPrivateDirectory(storageRoot, turnsDirectory);
      if (turns === void 0)
        return [];
      const captures = [];
      for (const turn of turns) {
        if (!turn.isDirectory() || turn.isSymbolicLink() || !CAPTURE_HASH.test(turn.name))
          throw new Error("Invalid capture turn directory");
        const eventDirectory = join9(turnsDirectory, turn.name, "events");
        const events = await listPrivateDirectory(storageRoot, eventDirectory);
        if (events === void 0)
          continue;
        for (const event2 of events) {
          if (event2.isSymbolicLink() || !event2.isFile())
            throw new Error("Capture event must be a regular file");
          if (CAPTURE_STAGING_FILE.test(event2.name))
            continue;
          if (!CAPTURE_EVENT_FILE.test(event2.name))
            throw new Error("Invalid capture event path");
          const path3 = join9(eventDirectory, event2.name);
          const record = await readRecord(storageRoot, path3);
          if (record === void 0 || record.integration !== integration || record.sessionId !== sessionId || identifierHash(record.turnId) !== turn.name || `${identifierHash(record.eventId)}.json` !== event2.name) {
            throw new Error("Capture event namespace does not match");
          }
          const info = await lstat3(path3);
          if (!info.isFile() || info.isSymbolicLink() || !Number.isFinite(info.mtimeMs))
            throw new Error("Capture event must be a regular file");
          captures.push({ record, capturedAtMs: record.capturedAtMs });
        }
      }
      return captures.toSorted(compareCaptures);
    },
    async enumerateTurn(integration, sessionId, turnId) {
      return enumerateTurnCaptures(storageRoot, integration, sessionId, turnId);
    },
    async enumerateSessions(integration) {
      validateIntegration(integration);
      const sessionsDirectory = join9(captureDirectory(storageRoot), "integrations", integration, "sessions");
      const directories = await listPrivateDirectory(storageRoot, sessionsDirectory);
      if (directories === void 0)
        return [];
      const sessions = [];
      for (const directory of directories) {
        if (!directory.isDirectory() || directory.isSymbolicLink() || !CAPTURE_HASH.test(directory.name)) {
          throw new Error("Invalid capture session directory");
        }
        const session = await enumerateSession(storageRoot, integration, directory.name);
        if (session === void 0 || session.captures.length === 0)
          continue;
        sessions.push(session);
      }
      return sessions.toSorted((left, right) => left.sessionId === right.sessionId ? 0 : left.sessionId < right.sessionId ? -1 : 1);
    },
    async recordOutcome(input) {
      try {
        validateScope(input);
        validateIdentifier(input.destination, "destination");
        if (input.outcome !== "delivered" && input.outcome !== "dropped")
          throw new TypeError("Invalid outcome");
        if (input.reason !== void 0)
          validateIdentifier(input.reason, "outcome reason");
        if (await this.read(input) === void 0)
          return { status: "missing-capture" };
        const path3 = receiptPath(storageRoot, input, input.destination);
        await ensureDirectories(input.integration, input.sessionId, input.turnId, "receipts", input.destination);
        const comparable = receiptValue(input, (/* @__PURE__ */ new Date()).toISOString());
        const contents = canonicalJson(comparable);
        if (await publishExclusive(path3, contents))
          return { status: "recorded", receipt: comparable };
        const previous = await readReceipt(storageRoot, path3);
        if (previous === void 0)
          return {
            status: "failed",
            code: "STORAGE_FAILED",
            message: "Published receipt disappeared"
          };
        return sameReceipt(previous, input) ? { status: "duplicate", receipt: previous } : { status: "conflict" };
      } catch (error2) {
        return failure("STORAGE_FAILED", error2);
      }
    },
    async readOutcome(scope, destination) {
      try {
        validateScope(scope);
        validateIdentifier(destination, "destination");
        if (await this.read(scope) === void 0)
          return { status: "missing-capture" };
        const receipt = await readReceipt(storageRoot, receiptPath(storageRoot, scope, destination));
        if (receipt === void 0)
          return { status: "pending" };
        return sameScope(receipt, scope) && receipt.destination === destination ? { status: "settled", receipt } : {
          status: "failed",
          code: "STORAGE_FAILED",
          message: "Receipt namespace does not match"
        };
      } catch (error2) {
        return failure("STORAGE_FAILED", error2);
      }
    }
  };
  async function ensureDirectories(integration, sessionId, turnId, collection, destination) {
    const pathSegments = [
      CAPTURE_DIRECTORY,
      "integrations",
      integration,
      "sessions",
      identifierHash(sessionId),
      "turns",
      identifierHash(turnId),
      collection
    ];
    if (destination !== void 0)
      pathSegments.push(identifierHash(destination));
    await ensurePrivateDirectory(storageRoot, pathSegments);
  }
}
function compareCaptures(left, right) {
  if (left.capturedAtMs !== right.capturedAtMs)
    return left.capturedAtMs < right.capturedAtMs ? -1 : 1;
  if (left.record.eventId === right.record.eventId)
    return 0;
  return left.record.eventId < right.record.eventId ? -1 : 1;
}
async function enumerateTurnCaptures(root, integration, sessionId, turnId) {
  validateIntegration(integration);
  validateIdentifier(sessionId, "session ID");
  validateIdentifier(turnId, "turn ID");
  const turnsDirectory = join9(captureDirectory(root), "integrations", integration, "sessions", identifierHash(sessionId), "turns");
  const turns = await listPrivateDirectory(root, turnsDirectory);
  if (turns === void 0)
    return [];
  const turnHash = identifierHash(turnId);
  const turn = turns.find((entry) => entry.name === turnHash);
  if (turn === void 0)
    return [];
  if (!turn.isDirectory() || turn.isSymbolicLink())
    throw new Error("Invalid capture turn directory");
  const eventDirectory = join9(turnsDirectory, turnHash, "events");
  const events = await listPrivateDirectory(root, eventDirectory);
  if (events === void 0)
    return [];
  const captures = [];
  for (const event2 of events) {
    if (event2.isSymbolicLink() || !event2.isFile())
      throw new Error("Capture event must be a regular file");
    if (CAPTURE_STAGING_FILE.test(event2.name))
      continue;
    if (!CAPTURE_EVENT_FILE.test(event2.name))
      throw new Error("Invalid capture event path");
    const path3 = join9(eventDirectory, event2.name);
    const record = await readRecord(root, path3);
    if (record === void 0 || record.integration !== integration || record.sessionId !== sessionId || record.turnId !== turnId || `${identifierHash(record.eventId)}.json` !== event2.name) {
      throw new Error("Capture event namespace does not match");
    }
    const info = await lstat3(path3);
    if (!info.isFile() || info.isSymbolicLink() || !Number.isFinite(info.mtimeMs))
      throw new Error("Capture event must be a regular file");
    captures.push({ record, capturedAtMs: record.capturedAtMs });
  }
  return captures.toSorted(compareCaptures);
}
async function enumerateSession(root, integration, sessionHash) {
  const turnsDirectory = join9(captureDirectory(root), "integrations", integration, "sessions", sessionHash, "turns");
  const turns = await listPrivateDirectory(root, turnsDirectory);
  if (turns === void 0)
    return void 0;
  const captures = [];
  let sessionId;
  for (const turn of turns) {
    if (!turn.isDirectory() || turn.isSymbolicLink() || !CAPTURE_HASH.test(turn.name))
      throw new Error("Invalid capture turn directory");
    const eventDirectory = join9(turnsDirectory, turn.name, "events");
    const events = await listPrivateDirectory(root, eventDirectory);
    if (events === void 0)
      continue;
    for (const event2 of events) {
      if (event2.isSymbolicLink() || !event2.isFile())
        throw new Error("Capture event must be a regular file");
      if (CAPTURE_STAGING_FILE.test(event2.name))
        continue;
      if (!CAPTURE_EVENT_FILE.test(event2.name))
        throw new Error("Invalid capture event path");
      const path3 = join9(eventDirectory, event2.name);
      const record = await readRecord(root, path3);
      if (record === void 0 || record.integration !== integration || identifierHash(record.sessionId) !== sessionHash || identifierHash(record.turnId) !== turn.name || `${identifierHash(record.eventId)}.json` !== event2.name || sessionId !== void 0 && record.sessionId !== sessionId) {
        throw new Error("Capture event namespace does not match");
      }
      sessionId = record.sessionId;
      const info = await lstat3(path3);
      if (!info.isFile() || info.isSymbolicLink() || !Number.isFinite(info.mtimeMs))
        throw new Error("Capture event must be a regular file");
      captures.push({ record, capturedAtMs: record.capturedAtMs });
    }
  }
  if (sessionId === void 0)
    return void 0;
  return { sessionId, captures: captures.toSorted(compareCaptures) };
}
function sameCapture(left, right) {
  const leftContent = { ...left };
  const rightContent = { ...right };
  delete leftContent.capturedAtMs;
  delete rightContent.capturedAtMs;
  return canonicalJson(leftContent) === canonicalJson(rightContent);
}
function receiptValue(input, recordedAt) {
  return {
    version: CAPTURE_RECEIPT_VERSION,
    integration: input.integration,
    sessionId: input.sessionId,
    turnId: input.turnId,
    eventId: input.eventId,
    destination: input.destination,
    outcome: input.outcome,
    ...input.reason === void 0 ? {} : { reason: input.reason },
    recordedAt
  };
}
async function readRecord(root, path3) {
  const contents = await readPrivateFile(root, path3);
  if (contents === void 0)
    return void 0;
  const value = parseObject(contents);
  if (value.version !== CAPTURE_RECORD_VERSION || typeof value.capturedAtMs !== "number" || !Number.isSafeInteger(value.capturedAtMs) || !Number.isFinite(new Date(value.capturedAtMs).getTime()) || typeof value.integration !== "string" || typeof value.sessionId !== "string" || typeof value.turnId !== "string" || typeof value.eventId !== "string" || typeof value.runId !== "string" || typeof value.destinationFingerprint !== "string" || typeof value.eventKind !== "string" || !("normalizedPayload" in value) || !("turnEvidence" in value) || !("metadataProvenance" in value)) {
    throw new Error("Unsupported capture record");
  }
  if ("sourceAgeStartedAtMs" in value) {
    requireSafeEpochMilliseconds(value["sourceAgeStartedAtMs"], "Stored source age");
  }
  if ("priorDeliveryAttempts" in value)
    requireNonNegativeInteger(value["priorDeliveryAttempts"], "Stored prior delivery attempts");
  for (const [identifier, name] of [
    [value.runId, "run ID"],
    [value.destinationFingerprint, "destination fingerprint"],
    [value.eventKind, "event kind"]
  ]) {
    validateIdentifier(identifier, name);
  }
  const scope = {
    integration: value.integration,
    sessionId: value.sessionId,
    turnId: value.turnId,
    eventId: value.eventId
  };
  validateScope(scope);
  const dependencies = normalizeDependencies(value.dependencies, scope);
  return {
    ...value,
    ...dependencies === void 0 ? {} : { dependencies }
  };
}
async function readReceipt(root, path3) {
  const contents = await readPrivateFile(root, path3);
  if (contents === void 0)
    return void 0;
  const value = parseObject(contents);
  if (value.version !== CAPTURE_RECEIPT_VERSION || typeof value.integration !== "string" || typeof value.sessionId !== "string" || typeof value.turnId !== "string" || typeof value.eventId !== "string" || typeof value.destination !== "string" || value.outcome !== "delivered" && value.outcome !== "dropped" || typeof value.recordedAt !== "string" || "reason" in value && typeof value.reason !== "string") {
    throw new Error("Unsupported outcome receipt");
  }
  validateIdentifier(value.destination, "destination");
  if ("reason" in value)
    validateIdentifier(value.reason, "outcome reason");
  const recordedAt = new Date(value.recordedAt);
  if (!Number.isFinite(recordedAt.getTime()) || recordedAt.toISOString() !== value.recordedAt)
    throw new Error("Unsupported outcome receipt");
  return value;
}
function parseObject(contents) {
  const value = JSON.parse(contents);
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid storage record");
  return value;
}
function validateScope(scope) {
  validateIntegration(scope.integration);
  validateIdentifier(scope.sessionId, "session ID");
  validateIdentifier(scope.turnId, "turn ID");
  validateIdentifier(scope.eventId, "event ID");
}
function normalizeDependencies(value, dependent) {
  if (value === void 0)
    return void 0;
  if (!Array.isArray(value))
    throw new TypeError("Invalid capture dependencies");
  const seen = /* @__PURE__ */ new Set();
  return value.map((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item))
      throw new TypeError("Invalid capture dependency");
    const candidate = item;
    if (typeof candidate.integration !== "string" || typeof candidate.sessionId !== "string" || typeof candidate.turnId !== "string" || typeof candidate.eventId !== "string") {
      throw new TypeError("Invalid capture dependency");
    }
    const dependency = {
      integration: candidate.integration,
      sessionId: candidate.sessionId,
      turnId: candidate.turnId,
      eventId: candidate.eventId
    };
    validateScope(dependency);
    if (dependency.integration !== dependent.integration)
      throw new TypeError("Capture dependencies must use the same integration");
    if (sameScope(dependency, dependent))
      throw new TypeError("Capture cannot depend on itself");
    const key = canonicalJson(dependency);
    if (seen.has(key))
      throw new TypeError("Capture dependencies must be unique");
    seen.add(key);
    return dependency;
  });
}
function sameScope(record, scope) {
  return record.integration === scope.integration && record.sessionId === scope.sessionId && record.turnId === scope.turnId && record.eventId === scope.eventId;
}
function sameReceipt(receipt, input) {
  return sameScope(receipt, input) && receipt.destination === input.destination && receipt.outcome === input.outcome && receipt.reason === input.reason;
}
function failure(code, error2) {
  return {
    status: "failed",
    code: errorCode3(error2) ?? code,
    message: error2 instanceof Error ? error2.message : String(error2)
  };
}
function errorCode3(error2) {
  return error2 !== null && typeof error2 === "object" && "code" in error2 && typeof error2.code === "string" ? error2.code : void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/background-worker/worker.js
import { randomUUID as randomUUID6 } from "node:crypto";
import { unlink as unlink4 } from "node:fs/promises";
import { join as join12, resolve as resolve8 } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/file-lock.js
import { chmod as chmod2, link as link2, lstat as lstat4, mkdir as mkdir4, readFile, readdir as readdir4, rmdir, rename as rename2, unlink as unlink3, writeFile as writeFile2 } from "node:fs/promises";
import { performance as performance2 } from "node:perf_hooks";
import { randomUUID as randomUUID5 } from "node:crypto";
import { dirname as dirname7, join as join10, resolve as resolve6 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/constants.js
var FILE_LOCK_CLAIM_VERSION = 1;
var FILE_LOCK_CLAIM_EXTENSION = ".json";
var FILE_LOCK_DIRECTORY_SUFFIX = ".claims";
var FILE_LOCK_TIMEOUT_ERROR_NAME = "FileLockTimeoutError";
var FILE_LOCK_TEMP_PREFIX = ".";
var FILE_LOCK_TEMP_SUFFIX = ".tmp";
var FILE_LOCK_EXCLUSIVE_FLAG = "wx";
var FILE_LOCK_ENCODING = "utf-8";
var FILE_LOCK_DEFAULT_TIMEOUT_MS = 5e3;
var FILE_LOCK_POLL_INTERVAL_MS = 10;
var FILE_LOCK_DIRECTORY_MODE = 448;
var FILE_LOCK_FILE_MODE = 384;
var FILE_LOCK_UNSELECTED_TICKET = 0;
var FILE_LOCK_NEGATIVE_TICKET_LIMIT = 0;
var FILE_LOCK_TIMEOUT_MESSAGE = "Timed out waiting for file lock";
var FILE_LOCK_TICKET_LIMIT_MESSAGE = "File lock ticket limit reached";
var FILE_LOCK_RELEASE_MESSAGE = "Could not release file lock claim";
var FILE_LOCK_INVALID_TIMEOUT_MESSAGE = "timeoutMs must be a finite positive number";
var FILE_LOCK_ACQUIRE_MESSAGE = "Could not acquire file lock claim";
var FILE_LOCK_UNSAFE_DIRECTORY_MESSAGE = "Unsafe file lock claims directory";
var FILE_LOCK_EXISTS_CODE = "EEXIST";
var FILE_LOCK_MISSING_CODE = "ENOENT";
var FILE_LOCK_PROCESS_MISSING_CODE = "ESRCH";
var FILE_LOCK_PROCESS_CHECK_SIGNAL = 0;
var FILE_LOCK_RENAME_RETRY_TIMEOUT_MS = 100;
var FILE_LOCK_RENAME_BUSY_CODE = "EPERM";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/errors.js
import { resolve as resolve5 } from "node:path";
var FileLockTimeoutError = class extends Error {
  constructor(filePath) {
    super(`${FILE_LOCK_TIMEOUT_MESSAGE}: ${resolve5(filePath)}`);
    this.name = FILE_LOCK_TIMEOUT_ERROR_NAME;
  }
};

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/storage/file-lock.js
function isRecord2(value) {
  return typeof value === "object" && value !== null;
}
function parseClaim(value, id) {
  if (!isRecord2(value))
    return void 0;
  if (value.version !== FILE_LOCK_CLAIM_VERSION || value.id !== id || typeof value.pid !== "number" || !Number.isSafeInteger(value.pid) || value.pid <= 0 || typeof value.choosing !== "boolean" || typeof value.ticket !== "number" || !Number.isSafeInteger(value.ticket) || value.ticket < FILE_LOCK_NEGATIVE_TICKET_LIMIT || (value.choosing ? value.ticket !== FILE_LOCK_UNSELECTED_TICKET : value.ticket === FILE_LOCK_UNSELECTED_TICKET)) {
    return void 0;
  }
  return value;
}
async function processIsAlive(pid) {
  try {
    process.kill(pid, FILE_LOCK_PROCESS_CHECK_SIGNAL);
    return true;
  } catch (error2) {
    const code = error2.code;
    if (code === FILE_LOCK_PROCESS_MISSING_CODE)
      return false;
    return void 0;
  }
}
async function removeFile(filePath) {
  try {
    await unlink3(filePath);
    return true;
  } catch (error2) {
    if (error2.code === FILE_LOCK_MISSING_CODE)
      return true;
    return false;
  }
}
async function publishClaim(filePath, claim, create, deadline) {
  const temporaryPath = join10(dirname7(filePath), `${FILE_LOCK_TEMP_PREFIX}${claim.id}.${randomUUID5()}${FILE_LOCK_TEMP_SUFFIX}`);
  try {
    await writeFile2(temporaryPath, JSON.stringify(claim), {
      flag: FILE_LOCK_EXCLUSIVE_FLAG,
      mode: FILE_LOCK_FILE_MODE
    });
    if (create)
      await link2(temporaryPath, filePath);
    else {
      const replacementDeadline = deadline ?? performance2.now() + FILE_LOCK_RENAME_RETRY_TIMEOUT_MS;
      for (; ; ) {
        try {
          await rename2(temporaryPath, filePath);
          break;
        } catch (error2) {
          if (error2.code !== FILE_LOCK_RENAME_BUSY_CODE)
            throw error2;
          await waitForNextScan(replacementDeadline, filePath);
        }
      }
    }
  } finally {
    await removeFile(temporaryPath);
  }
}
async function createClaim(claimDirectory) {
  for (; ; ) {
    const id = randomUUID5();
    const claim = {
      version: FILE_LOCK_CLAIM_VERSION,
      id,
      pid: process.pid,
      choosing: true,
      ticket: FILE_LOCK_UNSELECTED_TICKET
    };
    try {
      await publishClaim(join10(claimDirectory, `${id}${FILE_LOCK_CLAIM_EXTENSION}`), claim, true);
      return claim;
    } catch (error2) {
      if (error2.code !== FILE_LOCK_EXISTS_CODE)
        throw error2;
    }
  }
}
async function scanClaims(claimDirectory) {
  const entries = await readdir4(claimDirectory, { withFileTypes: true });
  const claims = [];
  for (const entry of entries) {
    if (!entry.name.endsWith(FILE_LOCK_CLAIM_EXTENSION))
      continue;
    const id = entry.name.slice(0, -FILE_LOCK_CLAIM_EXTENSION.length);
    if (!entry.isFile())
      return { claims, blocked: true };
    let value;
    try {
      value = JSON.parse(await readFile(join10(claimDirectory, entry.name), FILE_LOCK_ENCODING));
    } catch (error2) {
      if (error2.code === FILE_LOCK_MISSING_CODE)
        continue;
      return { claims, blocked: true };
    }
    const claim = parseClaim(value, id);
    if (!claim)
      return { claims, blocked: true };
    const alive = await processIsAlive(claim.pid);
    if (alive === false) {
      if (!await removeFile(join10(claimDirectory, entry.name)))
        return { claims, blocked: true };
      continue;
    }
    if (alive === void 0)
      return { claims, blocked: true };
    claims.push(claim);
  }
  return { claims, blocked: false };
}
function claimPath(claimDirectory, id) {
  return join10(claimDirectory, `${id}${FILE_LOCK_CLAIM_EXTENSION}`);
}
function hasClaimState(claims, id, choosing, ticket) {
  const claim = claims.find((peer) => peer.id === id);
  return claim?.choosing === choosing && claim.ticket === ticket;
}
function makeHandle(claimDirectory, claim) {
  let releasePromise;
  return {
    release() {
      releasePromise ??= removeFile(claimPath(claimDirectory, claim.id)).then((removed) => {
        if (!removed)
          throw new Error(FILE_LOCK_RELEASE_MESSAGE);
      });
      return releasePromise;
    }
  };
}
async function beginClaim(filePath) {
  const claimDirectory = `${resolve6(filePath)}${FILE_LOCK_DIRECTORY_SUFFIX}`;
  await assertSafeClaimDirectory(claimDirectory);
  await mkdir4(claimDirectory, { recursive: true, mode: FILE_LOCK_DIRECTORY_MODE });
  await assertSafeClaimDirectory(claimDirectory);
  await chmod2(claimDirectory, FILE_LOCK_DIRECTORY_MODE);
  return { claimDirectory, claim: await createClaim(claimDirectory) };
}
async function assertSafeClaimDirectory(claimDirectory) {
  let stat3;
  try {
    stat3 = await lstat4(claimDirectory);
  } catch (error2) {
    if (error2.code === FILE_LOCK_MISSING_CODE)
      return;
    throw error2;
  }
  if (stat3.isSymbolicLink() || !stat3.isDirectory())
    throw new Error(FILE_LOCK_UNSAFE_DIRECTORY_MESSAGE);
}
async function acquireClaim(filePath, waitForPeers, deadline) {
  const { claimDirectory, claim } = await beginClaim(filePath);
  const ownPath = claimPath(claimDirectory, claim.id);
  let ownedClaim;
  try {
    for (; ; ) {
      const scan = await scanClaims(claimDirectory);
      if (scan.blocked || !hasClaimState(scan.claims, claim.id, true, FILE_LOCK_UNSELECTED_TICKET)) {
        if (!await waitOrReleaseClaim(waitForPeers, deadline, filePath, claimDirectory, claim))
          return void 0;
        continue;
      }
      const peers = scan.claims.filter((peer) => peer.id !== claim.id);
      if (!waitForPeers && peers.length > 0) {
        await makeHandle(claimDirectory, claim).release();
        return void 0;
      }
      let maxTicket = FILE_LOCK_UNSELECTED_TICKET;
      for (const peer of scan.claims)
        maxTicket = Math.max(maxTicket, peer.ticket);
      if (maxTicket >= Number.MAX_SAFE_INTEGER)
        throw new Error(FILE_LOCK_TICKET_LIMIT_MESSAGE);
      ownedClaim = { ...claim, choosing: false, ticket: maxTicket + 1 };
      await publishClaim(ownPath, ownedClaim, false, waitForPeers ? deadline : void 0);
      break;
    }
    const ticketedClaim = ownedClaim;
    if (!ticketedClaim)
      throw new Error(FILE_LOCK_ACQUIRE_MESSAGE);
    for (; ; ) {
      const scan = await scanClaims(claimDirectory);
      if (scan.blocked || !hasClaimState(scan.claims, claim.id, false, ticketedClaim.ticket)) {
        if (!await waitOrReleaseClaim(waitForPeers, deadline, filePath, claimDirectory, claim))
          return void 0;
        continue;
      }
      const peers = scan.claims.filter((peer) => peer.id !== claim.id);
      const blockedByPeer = peers.length > 0 && (!waitForPeers || peers.some((peer) => precedes(peer, ticketedClaim)));
      if (blockedByPeer) {
        if (!await waitOrReleaseClaim(waitForPeers, deadline, filePath, claimDirectory, claim))
          return void 0;
        continue;
      }
      if (waitForPeers && performance2.now() > deadline)
        throw timeoutError(filePath);
      return { claimDirectory, claim: ticketedClaim };
    }
  } catch (error2) {
    await makeHandle(claimDirectory, claim).release();
    throw error2;
  }
}
async function tryAcquireFileLock(filePath) {
  const acquired = await acquireClaim(filePath, false, 0);
  if (!acquired)
    return void 0;
  return makeHandle(acquired.claimDirectory, acquired.claim);
}
async function waitForFileLockClaim(filePath, pid, options) {
  if (!Number.isSafeInteger(pid) || pid <= 0)
    throw new TypeError("Invalid file lock process ID");
  const waitMs = timeoutMs(options);
  const deadline = performance2.now() + waitMs;
  const claimDirectory = `${resolve6(filePath)}${FILE_LOCK_DIRECTORY_SUFFIX}`;
  for (; ; ) {
    await assertSafeClaimDirectory(claimDirectory);
    try {
      const scan = await scanClaims(claimDirectory);
      if (scan.claims.some((claim) => claim.pid === pid))
        return true;
    } catch (error2) {
      if (error2.code !== FILE_LOCK_MISSING_CODE)
        throw error2;
    }
    if (await processIsAlive(pid) === false)
      return false;
    const remaining = deadline - performance2.now();
    if (remaining <= 0)
      return false;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, Math.min(FILE_LOCK_POLL_INTERVAL_MS, remaining)));
  }
}
function precedes(left, right) {
  return left.ticket < right.ticket || left.ticket === right.ticket && left.id < right.id;
}
function timeoutError(filePath) {
  return new FileLockTimeoutError(filePath);
}
function timeoutMs(options) {
  const value = options?.timeoutMs ?? FILE_LOCK_DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(FILE_LOCK_INVALID_TIMEOUT_MESSAGE);
  return value;
}
function waitForNextScan(deadline, filePath) {
  const remaining = deadline - performance2.now();
  if (remaining <= 0)
    return Promise.reject(timeoutError(filePath));
  return new Promise((resolvePromise) => setTimeout(resolvePromise, Math.min(FILE_LOCK_POLL_INTERVAL_MS, remaining)));
}
async function waitOrReleaseClaim(waitForPeers, deadline, filePath, claimDirectory, claim) {
  if (!waitForPeers) {
    await makeHandle(claimDirectory, claim).release();
    return false;
  }
  await waitForNextScan(deadline, filePath);
  return true;
}
async function withFileLock(filePath, callback, options) {
  const waitMs = timeoutMs(options);
  const deadline = performance2.now() + waitMs;
  const acquired = await acquireClaim(filePath, true, deadline);
  if (!acquired)
    throw new Error(FILE_LOCK_ACQUIRE_MESSAGE);
  try {
    return await callback();
  } finally {
    await makeHandle(acquired.claimDirectory, acquired.claim).release();
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/background-worker/constants.js
var BACKGROUND_WORKER_DIRECTORY = "background-worker";
var BACKGROUND_WORKER_INTEGRATIONS_DIRECTORY = "integrations";
var BACKGROUND_WORKER_SESSIONS_DIRECTORY = "sessions";
var BACKGROUND_WORKER_ACCOUNTS_DIRECTORY = "accounts";
var BACKGROUND_WORKER_LOCK_FILE = "worker";
var BACKGROUND_WORKER_PENDING_FILE = "wake.pending";
var BACKGROUND_WORKER_ACTIVE_PREFIX = "wake.active.";
var BACKGROUND_WORKER_LAUNCHING_FILE = "wake.launching";
var BACKGROUND_WORKER_STAGING_FILE = /^\.[0-9a-f-]{36}\.tmp$/u;
var BACKGROUND_WORKER_MARKER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
var BACKGROUND_WORKER_ACTIVE_MARKER_NAME = /^wake\.active\.([0-9a-f-]{36})\.json$/u;
var BACKGROUND_WORKER_ATTEMPT_NAME = /^wake\.active\.([0-9a-f-]{36})\.attempt\.([1-9]\d*)\.json$/u;
var BACKGROUND_WORKER_MARKER_VERSION = 1;
var BACKGROUND_WORKER_ATTEMPT_VERSION = 1;
var BACKGROUND_WORKER_LAUNCH_VERSION = 1;
var BACKGROUND_WORKER_DEFAULT_MAX_ATTEMPTS = 3;
var BACKGROUND_WORKER_DEFAULT_RETRY_DELAY_MS = 100;
var BACKGROUND_WORKER_OWNER_WAIT_MS = 3e4;
var BACKGROUND_WORKER_STARTUP_WAIT_MS = 2e3;
var BACKGROUND_WORKER_LAUNCH_LEASE_MS = 3e4;

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/background-worker/paths.js
import { join as join11, resolve as resolve7 } from "node:path";
function validateWorkerScope(scope) {
  validateIntegration(scope.integration);
  validateIdentifier(scope.sessionId, "session ID");
  validateIdentifier(scope.accountFingerprint, "account fingerprint");
}
function workerDirectory(storageRoot, scope) {
  validateWorkerScope(scope);
  return join11(resolve7(storageRoot), BACKGROUND_WORKER_DIRECTORY, BACKGROUND_WORKER_INTEGRATIONS_DIRECTORY, scope.integration, BACKGROUND_WORKER_SESSIONS_DIRECTORY, identifierHash(scope.sessionId), BACKGROUND_WORKER_ACCOUNTS_DIRECTORY, identifierHash(scope.accountFingerprint));
}
function workerLockPath(storageRoot, scope) {
  return join11(workerDirectory(storageRoot, scope), BACKGROUND_WORKER_LOCK_FILE);
}
function workerPendingPath(storageRoot, scope) {
  return join11(workerDirectory(storageRoot, scope), BACKGROUND_WORKER_PENDING_FILE);
}
function workerActivePath(storageRoot, scope, markerId) {
  return join11(workerDirectory(storageRoot, scope), `${BACKGROUND_WORKER_ACTIVE_PREFIX}${markerId}.json`);
}
function workerAttemptPath(storageRoot, scope, markerId, attempt) {
  return join11(workerDirectory(storageRoot, scope), `${BACKGROUND_WORKER_ACTIVE_PREFIX}${markerId}.attempt.${attempt}.json`);
}
function workerLaunchPath(storageRoot, scope) {
  return join11(workerDirectory(storageRoot, scope), BACKGROUND_WORKER_LAUNCHING_FILE);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/background-worker/utils/scope.js
async function matchesScope(resolveScope, expected) {
  const actual = await resolveScope();
  return actual.integration === expected.integration && actual.sessionId === expected.sessionId && actual.accountFingerprint === expected.accountFingerprint;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/background-worker/worker.js
function createBackgroundWorker(options) {
  validateOptions(options);
  const storageRoot = resolve8(options.storageRoot);
  const scope = Object.freeze({ ...options.scope });
  const retryPolicy = {
    maxAttempts: options.retryPolicy?.maxAttempts ?? BACKGROUND_WORKER_DEFAULT_MAX_ATTEMPTS,
    retryDelayMs: options.retryPolicy?.retryDelayMs ?? BACKGROUND_WORKER_DEFAULT_RETRY_DELAY_MS
  };
  const config = { ...options, storageRoot, scope, retryPolicy };
  const directory = workerDirectory(storageRoot, scope);
  const lockPath2 = workerLockPath(storageRoot, scope);
  const directorySegments = [
    BACKGROUND_WORKER_DIRECTORY,
    BACKGROUND_WORKER_INTEGRATIONS_DIRECTORY,
    scope.integration,
    BACKGROUND_WORKER_SESSIONS_DIRECTORY,
    identifierHash(scope.sessionId),
    BACKGROUND_WORKER_ACCOUNTS_DIRECTORY,
    identifierHash(scope.accountFingerprint)
  ];
  return {
    async wake() {
      await ensurePrivateDirectory(storageRoot, directorySegments);
      const marker = makeMarker(randomUUID6());
      await publishExclusive(workerPendingPath(storageRoot, scope), JSON.stringify(marker));
      const lock = await tryAcquireFileLock(lockPath2);
      if (!lock)
        return "queued";
      try {
        const existingLaunch = await readLaunch(storageRoot, scope);
        if (existingLaunch && existingLaunch.expiresAtMs > Date.now() && await processIsAlive2(existingLaunch.pid)) {
          return "queued";
        }
        if (existingLaunch)
          await removeFile2(workerLaunchPath(storageRoot, scope));
        const pid = await config.launchWorker();
        if (!Number.isSafeInteger(pid) || pid <= 0 || pid === process.pid)
          throw new TypeError("Background worker launcher must return a child process ID");
        const createdAtMs = Date.now();
        const launch = {
          version: BACKGROUND_WORKER_LAUNCH_VERSION,
          pid,
          createdAtMs,
          expiresAtMs: createdAtMs + Math.max(BACKGROUND_WORKER_LAUNCH_LEASE_MS, config.startupWaitMs ?? 0)
        };
        if (!await publishExclusive(workerLaunchPath(storageRoot, scope), JSON.stringify(launch))) {
          throw new Error("Background worker launch is already pending");
        }
        const claimed = await waitForFileLockClaim(lockPath2, pid, {
          timeoutMs: config.startupWaitMs ?? BACKGROUND_WORKER_STARTUP_WAIT_MS
        });
        if (!claimed)
          throw new Error("Background worker did not claim its lock before timeout");
        return "launched";
      } finally {
        await lock.release();
      }
    },
    async run() {
      await ensurePrivateDirectory(storageRoot, directorySegments);
      let processed = false;
      let retryExhausted = false;
      let failures = 0;
      for (; ; ) {
        const result = await withFileLock(lockPath2, async () => {
          for (; ; ) {
            if (!await matchesScope(config.resolveScope, scope))
              return "scope-mismatch";
            const pass = await (async () => {
              if (!await matchesScope(config.resolveScope, scope))
                return {
                  scopeMismatch: true,
                  processed: false,
                  retryExhausted: false,
                  retryPending: false,
                  retryAttempted: false
                };
              await clearOwnedLaunch(storageRoot, scope);
              return processLocked(storageRoot, directory, scope, config, retryPolicy);
            })();
            if (pass.scopeMismatch)
              return "scope-mismatch";
            processed ||= pass.processed;
            retryExhausted ||= pass.retryExhausted;
            if (pass.retryAttempted)
              failures += 1;
            if (failures >= retryPolicy.maxAttempts && pass.retryAttempted)
              return "retry-exhausted";
            if (pass.retryPending && retryPolicy.retryDelayMs > 0)
              await delay(retryPolicy.retryDelayMs);
            if (!await hasPendingWork(storageRoot, directory))
              return retryExhausted ? "retry-exhausted" : processed ? "completed" : "idle";
          }
        }, { timeoutMs: BACKGROUND_WORKER_OWNER_WAIT_MS });
        if (result === "scope-mismatch")
          return result;
        if (failures >= retryPolicy.maxAttempts)
          return "retry-exhausted";
        if (!await hasPendingWork(storageRoot, directory))
          return result;
      }
    }
  };
}
function validateOptions(options) {
  const policy = options.retryPolicy;
  if (policy?.maxAttempts !== void 0 && (!Number.isSafeInteger(policy.maxAttempts) || policy.maxAttempts < 1)) {
    throw new RangeError("Background worker max attempts must be a positive integer");
  }
  if (policy?.retryDelayMs !== void 0 && (!Number.isFinite(policy.retryDelayMs) || policy.retryDelayMs < 0)) {
    throw new RangeError("Background worker retry delay must be non-negative");
  }
  if (options.startupWaitMs !== void 0 && (!Number.isSafeInteger(options.startupWaitMs) || options.startupWaitMs <= 0)) {
    throw new RangeError("Background worker startup wait must be a positive integer");
  }
}
function makeMarker(id) {
  return { version: BACKGROUND_WORKER_MARKER_VERSION, id, sourcePid: process.pid };
}
async function processLocked(storageRoot, directory, scope, options, retryPolicy) {
  const state = await readWorkerState(storageRoot, directory);
  for (const attempt of state.orphanedAttempts) {
    await removeFile2(workerAttemptPath(storageRoot, scope, attempt.markerId, attempt.attempt));
  }
  let marker = state.active;
  if (!marker && state.pending) {
    marker = state.pending;
    if (!await publishExclusive(workerActivePath(storageRoot, scope, marker.id), JSON.stringify(marker))) {
      throw new Error("Background worker active marker already exists");
    }
    await removeFile2(workerPendingPath(storageRoot, scope));
  } else if (marker && state.pending?.id === marker.id) {
    await removeFile2(workerPendingPath(storageRoot, scope));
  }
  if (!marker)
    return {
      scopeMismatch: false,
      processed: false,
      retryExhausted: false,
      retryPending: false,
      retryAttempted: false
    };
  let attempts = state.attempts;
  if (attempts.length >= retryPolicy.maxAttempts) {
    await removeActiveMarker(storageRoot, scope, marker, attempts);
    return {
      scopeMismatch: false,
      processed: true,
      retryExhausted: true,
      retryPending: false,
      retryAttempted: false
    };
  }
  for (; ; ) {
    if (!await matchesScope(options.resolveScope, scope))
      return {
        scopeMismatch: true,
        processed: false,
        retryExhausted: false,
        retryPending: false,
        retryAttempted: false
      };
    const result = await runTasks(options, scope);
    if (result === "scope-mismatch" || !await matchesScope(options.resolveScope, scope))
      return {
        scopeMismatch: true,
        processed: false,
        retryExhausted: false,
        retryPending: false,
        retryAttempted: false
      };
    if (result === "progressed")
      continue;
    if (result === "idle") {
      await removeActiveMarker(storageRoot, scope, marker, attempts);
      return {
        scopeMismatch: false,
        processed: true,
        retryExhausted: false,
        retryPending: false,
        retryAttempted: false
      };
    }
    const attemptNumber = attempts.length + 1;
    const attempt = {
      version: BACKGROUND_WORKER_ATTEMPT_VERSION,
      markerId: marker.id,
      attempt: attemptNumber
    };
    if (!await publishExclusive(workerAttemptPath(storageRoot, scope, marker.id, attemptNumber), JSON.stringify(attempt))) {
      throw new Error("Background worker retry attempt already exists");
    }
    attempts = [...attempts, attempt];
    if (attempts.length >= retryPolicy.maxAttempts) {
      await removeActiveMarker(storageRoot, scope, marker, attempts);
      return {
        scopeMismatch: false,
        processed: true,
        retryExhausted: true,
        retryPending: false,
        retryAttempted: true
      };
    }
    return {
      scopeMismatch: false,
      processed: true,
      retryExhausted: false,
      retryPending: true,
      retryAttempted: true
    };
  }
}
async function runTasks(options, scope) {
  let progressed = false;
  if (options.reconstructPending) {
    let result2;
    try {
      result2 = await options.reconstructPending();
    } catch {
      return "retryable-failure";
    }
    if (!await matchesScope(options.resolveScope, scope))
      return "scope-mismatch";
    if (result2 === "retryable-failure")
      return result2;
    progressed ||= result2 === "progressed";
  }
  let result;
  try {
    result = await options.drainPending();
  } catch {
    return "retryable-failure";
  }
  if (result === "retryable-failure")
    return result;
  progressed ||= result === "progressed";
  return progressed ? "progressed" : "idle";
}
async function readWorkerState(storageRoot, directory) {
  const entries = await listPrivateDirectory(storageRoot, directory);
  let pending;
  let active;
  const attemptsByMarker = /* @__PURE__ */ new Map();
  if (!entries)
    return { attempts: [], orphanedAttempts: [] };
  const claimsDirectory = `${BACKGROUND_WORKER_LOCK_FILE}${FILE_LOCK_DIRECTORY_SUFFIX}`;
  for (const entry of entries) {
    if (entry.name === claimsDirectory) {
      if (!entry.isDirectory() || entry.isSymbolicLink())
        throw new Error("Unsafe background worker lock directory");
      continue;
    }
    if (entry.name === BACKGROUND_WORKER_PENDING_FILE) {
      if (!entry.isFile() || entry.isSymbolicLink())
        throw new Error("Unsafe background worker pending marker");
      pending = parseMarker(await readRequired(storageRoot, join12(directory, entry.name)));
      continue;
    }
    const activeMatch = BACKGROUND_WORKER_ACTIVE_MARKER_NAME.exec(entry.name);
    if (activeMatch) {
      if (!entry.isFile() || entry.isSymbolicLink())
        throw new Error("Unsafe background worker active marker");
      const markerId = activeMatch[1];
      if (markerId === void 0 || !BACKGROUND_WORKER_MARKER_ID_PATTERN.test(markerId))
        throw new Error("Invalid background worker active path");
      if (active)
        throw new Error("Multiple background worker active markers");
      active = parseMarker(await readRequired(storageRoot, join12(directory, entry.name)));
      if (active.id !== markerId)
        throw new Error("Background worker active marker path mismatch");
      continue;
    }
    const attemptMatch = BACKGROUND_WORKER_ATTEMPT_NAME.exec(entry.name);
    if (attemptMatch) {
      if (!entry.isFile() || entry.isSymbolicLink())
        throw new Error("Unsafe background worker retry attempt");
      const markerId = attemptMatch[1];
      const attemptNumber = Number(attemptMatch[2]);
      if (markerId === void 0 || !BACKGROUND_WORKER_MARKER_ID_PATTERN.test(markerId) || !Number.isSafeInteger(attemptNumber)) {
        throw new Error("Invalid background worker attempt path");
      }
      const attempt = parseAttempt(await readRequired(storageRoot, join12(directory, entry.name)), markerId, attemptNumber);
      const markerAttempts = attemptsByMarker.get(markerId) ?? [];
      markerAttempts.push(attempt);
      attemptsByMarker.set(markerId, markerAttempts);
      continue;
    }
    if (BACKGROUND_WORKER_STAGING_FILE.test(entry.name)) {
      if (!entry.isFile() || entry.isSymbolicLink())
        throw new Error("Unsafe background worker staging file");
      continue;
    }
    if (entry.name === BACKGROUND_WORKER_LAUNCHING_FILE) {
      if (!entry.isFile() || entry.isSymbolicLink())
        throw new Error("Unsafe background worker launch marker");
      continue;
    }
    throw new Error("Unexpected background worker state path");
  }
  const attempts = active ? attemptsByMarker.get(active.id) ?? [] : [];
  attempts.sort((left, right) => left.attempt - right.attempt);
  for (let index = 0; index < attempts.length; index += 1) {
    if (attempts[index]?.attempt !== index + 1)
      throw new Error("Background worker retry sequence has a gap");
  }
  const orphanedAttempts = [...attemptsByMarker.entries()].filter(([markerId]) => active?.id !== markerId).flatMap(([, markerAttempts]) => markerAttempts);
  return {
    ...pending ? { pending } : {},
    ...active ? { active } : {},
    attempts,
    orphanedAttempts
  };
}
async function hasPendingWork(storageRoot, directory) {
  const entries = await listPrivateDirectory(storageRoot, directory);
  return entries?.some((entry) => entry.name === BACKGROUND_WORKER_PENDING_FILE || BACKGROUND_WORKER_ACTIVE_MARKER_NAME.test(entry.name)) ?? false;
}
async function removeActiveMarker(storageRoot, scope, marker, attempts) {
  await removeFile2(workerActivePath(storageRoot, scope, marker.id));
  for (const attempt of attempts)
    await removeFile2(workerAttemptPath(storageRoot, scope, marker.id, attempt.attempt));
}
async function clearOwnedLaunch(storageRoot, scope) {
  const launch = await readLaunch(storageRoot, scope);
  if (launch?.pid === process.pid)
    await removeFile2(workerLaunchPath(storageRoot, scope));
}
async function readLaunch(storageRoot, scope) {
  const contents = await readPrivateFile(storageRoot, workerLaunchPath(storageRoot, scope));
  if (contents === void 0)
    return void 0;
  const value = parseObject2(contents);
  if (value.version !== BACKGROUND_WORKER_LAUNCH_VERSION || typeof value.pid !== "number" || !Number.isSafeInteger(value.pid) || value.pid <= 0 || typeof value.createdAtMs !== "number" || !Number.isSafeInteger(value.createdAtMs) || typeof value.expiresAtMs !== "number" || !Number.isSafeInteger(value.expiresAtMs) || value.expiresAtMs <= value.createdAtMs) {
    throw new Error("Invalid background worker launch marker");
  }
  return value;
}
async function processIsAlive2(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error2) {
    if (error2.code === "ESRCH")
      return false;
    return true;
  }
}
async function readRequired(storageRoot, path3) {
  const contents = await readPrivateFile(storageRoot, path3);
  if (contents === void 0)
    throw new Error("Background worker state disappeared");
  return contents;
}
async function removeFile2(path3) {
  try {
    await unlink4(path3);
  } catch (error2) {
    if (error2.code !== "ENOENT")
      throw error2;
  }
}
function parseMarker(contents) {
  const value = parseObject2(contents);
  if (value.version !== BACKGROUND_WORKER_MARKER_VERSION || typeof value.id !== "string" || !BACKGROUND_WORKER_MARKER_ID_PATTERN.test(value.id) || typeof value.sourcePid !== "number" || !Number.isSafeInteger(value.sourcePid) || value.sourcePid <= 0) {
    throw new Error("Invalid background worker marker");
  }
  return value;
}
function parseAttempt(contents, markerId, attempt) {
  const value = parseObject2(contents);
  if (value.version !== BACKGROUND_WORKER_ATTEMPT_VERSION || value.markerId !== markerId || value.attempt !== attempt) {
    throw new Error("Invalid background worker retry attempt");
  }
  return value;
}
function parseObject2(contents) {
  const value = JSON.parse(contents);
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid background worker state");
  return value;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/bridge.js
import { join as join16, resolve as resolve11 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/delivery/coordinator.js
import { join as join14, resolve as resolve10 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/delivery/constants.js
var DELIVERY_DIRECTORY = "delivery-v1";
var DELIVERY_ATTEMPT_VERSION = 1;
var DELIVERY_DEFAULT_MAX_ATTEMPTS = 5;
var DELIVERY_DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
var DELIVERY_DEFAULT_MAX_ENTRIES = 500;
var DELIVERY_ATTEMPT_FILE = /^([1-9]\d*)\.json$/u;
var DELIVERY_STAGING_FILE = /^\.[0-9a-f-]{36}\.tmp$/u;
var DELIVERY_EXPIRED_REASON = "expired";
var DELIVERY_CAPACITY_REASON = "capacity";
var DELIVERY_RETRY_EXHAUSTED_REASON = "retry-exhausted";
var DELIVERY_DEPENDENCY_DROPPED_REASON = "dependency-dropped";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/delivery/attempt-store.js
import { join as join13, resolve as resolve9 } from "node:path";
function createDeliveryAttemptStore(root) {
  const storageRoot = resolve9(root);
  return {
    async count(scope, destination) {
      validateAttemptScope(scope, destination);
      const directory = attemptDirectory(storageRoot, scope, destination);
      const entries = await listPrivateDirectory(storageRoot, directory);
      if (entries === void 0)
        return 0;
      const attempts = [];
      for (const entry of entries) {
        if (entry.isSymbolicLink() || !entry.isFile())
          throw new Error("Delivery attempt must be a regular file");
        if (DELIVERY_STAGING_FILE.test(entry.name))
          continue;
        const match = DELIVERY_ATTEMPT_FILE.exec(entry.name);
        if (!match)
          throw new Error("Invalid delivery attempt path");
        const attempt = Number(match[1]);
        if (!Number.isSafeInteger(attempt) || String(attempt) !== match[1])
          throw new Error("Invalid delivery attempt number");
        const contents = await readPrivateFile(storageRoot, join13(directory, entry.name));
        if (contents === void 0)
          throw new Error("Delivery attempt disappeared");
        const record = parseAttempt2(contents);
        if (!sameAttempt(record, scope, destination, attempt))
          throw new Error("Delivery attempt namespace does not match");
        attempts.push(attempt);
      }
      attempts.sort((left, right) => left - right);
      for (let index = 0; index < attempts.length; index += 1) {
        if (attempts[index] !== index + 1)
          throw new Error("Delivery attempt sequence has a gap");
      }
      return attempts.length;
    },
    async record(scope, destination, attempt, startedAt) {
      validateAttemptScope(scope, destination);
      if (!Number.isSafeInteger(attempt) || attempt <= 0)
        throw new TypeError("Invalid delivery attempt number");
      validateTimestamp(startedAt);
      const directory = attemptDirectory(storageRoot, scope, destination);
      await ensurePrivateDirectory(storageRoot, attemptSegments(scope, destination));
      const record = {
        version: DELIVERY_ATTEMPT_VERSION,
        ...scope,
        destination,
        attempt,
        startedAt
      };
      const published = await publishExclusive(join13(directory, `${attempt}.json`), JSON.stringify(record));
      if (!published)
        throw new Error("Delivery attempt already exists");
    }
  };
}
function attemptSegments(scope, destination) {
  return [
    DELIVERY_DIRECTORY,
    "integrations",
    scope.integration,
    "sessions",
    identifierHash(scope.sessionId),
    "turns",
    identifierHash(scope.turnId),
    "events",
    identifierHash(scope.eventId),
    "destinations",
    identifierHash(destination),
    "attempts"
  ];
}
function attemptDirectory(root, scope, destination) {
  return join13(root, ...attemptSegments(scope, destination));
}
function validateAttemptScope(scope, destination) {
  validateIntegration(scope.integration);
  validateIdentifier(scope.sessionId, "session ID");
  validateIdentifier(scope.turnId, "turn ID");
  validateIdentifier(scope.eventId, "event ID");
  validateIdentifier(destination, "destination");
}
function parseAttempt2(contents) {
  const value = JSON.parse(contents);
  if (value === null || typeof value !== "object" || Array.isArray(value) || !("version" in value) || value.version !== DELIVERY_ATTEMPT_VERSION || !("integration" in value) || typeof value.integration !== "string" || !("sessionId" in value) || typeof value.sessionId !== "string" || !("turnId" in value) || typeof value.turnId !== "string" || !("eventId" in value) || typeof value.eventId !== "string" || !("destination" in value) || typeof value.destination !== "string" || !("attempt" in value) || typeof value.attempt !== "number" || !("startedAt" in value) || typeof value.startedAt !== "string") {
    throw new Error("Unsupported delivery attempt");
  }
  const record = value;
  validateAttemptScope(record, record.destination);
  if (!Number.isSafeInteger(record.attempt) || record.attempt <= 0)
    throw new Error("Invalid delivery attempt number");
  validateTimestamp(record.startedAt);
  return record;
}
function sameAttempt(record, scope, destination, attempt) {
  return record.integration === scope.integration && record.sessionId === scope.sessionId && record.turnId === scope.turnId && record.eventId === scope.eventId && record.destination === destination && record.attempt === attempt;
}
function validateTimestamp(value) {
  const timestamp2 = new Date(value);
  if (!Number.isFinite(timestamp2.getTime()) || timestamp2.toISOString() !== value)
    throw new TypeError("Invalid delivery attempt timestamp");
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/delivery/coordinator.js
function createDeliveryCoordinator(options) {
  const { integration, sessionId } = options;
  validateIntegration(integration);
  validateIdentifier(sessionId, "session ID");
  const storageRoot = resolve10(options.storageRoot);
  const policy = resolvePolicy(options.policy);
  const captureStore = createCaptureStore(storageRoot);
  const attemptStore = createDeliveryAttemptStore(storageRoot);
  return {
    capture(input) {
      const scoped = {
        ...input,
        integration,
        sessionId
      };
      return captureStore.capture(scoped);
    },
    async drain(request) {
      const writer = snapshotWriter(request.writer);
      const drainRequest = {
        writer,
        ...request.now === void 0 ? {} : { now: request.now }
      };
      validateDrainRequest(drainRequest);
      const sessionDirectory = await ensurePrivateDirectory(storageRoot, [
        DELIVERY_DIRECTORY,
        "integrations",
        integration,
        "sessions",
        identifierHash(sessionId)
      ]);
      const lock = await tryAcquireFileLock(join14(sessionDirectory, "drain"));
      if (!lock)
        return { status: "busy" };
      const drainCache = createDrainCache(captureStore);
      let counts;
      try {
        counts = await drainLocked(captureStore, attemptStore, integration, sessionId, policy, drainRequest, drainCache);
      } finally {
        await lock.release();
      }
      const captures = await captureStore.enumerate(integration, sessionId);
      const eligible = captures.filter(({ record }) => record.destinationFingerprint === writer.accountFingerprint);
      return {
        status: "drained",
        ...counts,
        pending: await countPending(drainCache, eligible, writer.destinations),
        accountMismatch: captures.length - eligible.length
      };
    }
  };
}
async function drainLocked(captureStore, attemptStore, integration, sessionId, policy, request, drainCache) {
  const captures = await captureStore.enumerate(integration, sessionId);
  const eligible = captures.filter(({ record }) => record.destinationFingerprint === request.writer.accountFingerprint);
  for (const { record } of eligible)
    drainCache.rememberCapture(record);
  let dropped = 0;
  let failed = 0;
  let delivered = 0;
  const now = request.now ?? Date.now();
  const candidates = await pendingCandidates(drainCache, eligible, request.writer.destinations);
  for (const candidate of candidates) {
    const pending = [];
    for (const destination of candidate.pending) {
      const dependencyState = await dependenciesForDestination(drainCache, candidate.entry.record, destination.id);
      if (dependencyState === "dropped") {
        dropped += await recordDropped(drainCache, candidate.scope, destination.id, DELIVERY_DEPENDENCY_DROPPED_REASON);
      } else {
        pending.push(destination);
      }
    }
    candidate.pending = pending;
  }
  const active = candidates.filter((candidate) => candidate.pending.length > 0);
  const expired = active.filter(({ entry }) => now - (entry.record.sourceAgeStartedAtMs ?? entry.capturedAtMs) >= policy.maxAgeMs);
  for (const candidate of expired) {
    dropped += await dropPending(drainCache, candidate, DELIVERY_EXPIRED_REASON);
  }
  const fresh = active.filter(({ entry }) => now - (entry.record.sourceAgeStartedAtMs ?? entry.capturedAtMs) < policy.maxAgeMs);
  const overCapacity = Math.max(0, fresh.length - policy.maxEntries);
  for (const candidate of fresh.slice(0, overCapacity)) {
    dropped += await dropPending(drainCache, candidate, DELIVERY_CAPACITY_REASON);
  }
  const sendable = fresh.slice(overCapacity);
  const attempted = /* @__PURE__ */ new Set();
  let progressed;
  do {
    progressed = false;
    for (const candidate of sendable) {
      for (const destination of candidate.pending) {
        const key = deliveryKey(candidate.scope, destination.id);
        if (attempted.has(key))
          continue;
        const dependencyState = await dependenciesForDestination(drainCache, candidate.entry.record, destination.id);
        if (dependencyState === "pending")
          continue;
        attempted.add(key);
        if (dependencyState === "dropped") {
          dropped += await recordDropped(drainCache, candidate.scope, destination.id, DELIVERY_DEPENDENCY_DROPPED_REASON);
          progressed = true;
          continue;
        }
        const attemptCount = await attemptStore.count(candidate.scope, destination.id);
        const remainingAttempts = policy.maxAttempts - (candidate.entry.record.priorDeliveryAttempts ?? 0);
        if (attemptCount >= remainingAttempts) {
          dropped += await recordDropped(drainCache, candidate.scope, destination.id, DELIVERY_RETRY_EXHAUSTED_REASON);
          progressed = true;
          continue;
        }
        const attempt = attemptCount + 1;
        await attemptStore.record(candidate.scope, destination.id, attempt, new Date(now).toISOString());
        if (candidate.entry.record.destinationFingerprint !== request.writer.accountFingerprint)
          continue;
        try {
          await request.writer.send(structuredClone(candidate.entry.record), destination, request.writer.accountFingerprint);
        } catch {
          failed += 1;
          if (attempt >= remainingAttempts) {
            dropped += await recordDropped(drainCache, candidate.scope, destination.id, DELIVERY_RETRY_EXHAUSTED_REASON);
            progressed = true;
          }
          continue;
        }
        await drainCache.recordOutcome({
          ...candidate.scope,
          destination: destination.id,
          outcome: "delivered"
        });
        delivered += 1;
        progressed = true;
      }
    }
  } while (progressed);
  return { delivered, dropped, failed };
}
async function pendingCandidates(drainCache, entries, destinations) {
  const candidates = [];
  for (const entry of entries) {
    const scope = scopeOf(entry.record);
    const pending = [];
    for (const destination of destinations) {
      if ((await requireOutcome(drainCache, scope, destination.id)).status === "pending")
        pending.push(destination);
    }
    if (pending.length > 0)
      candidates.push({ entry, scope, pending });
  }
  return candidates;
}
async function dependenciesForDestination(drainCache, dependent, destination) {
  let pending = false;
  for (const dependency of dependent.dependencies ?? []) {
    const prerequisite = await drainCache.read(dependency);
    if (prerequisite === void 0) {
      pending = true;
      continue;
    }
    if (prerequisite.destinationFingerprint !== dependent.destinationFingerprint) {
      pending = true;
      continue;
    }
    const outcome = await drainCache.readOutcome(dependency, destination);
    if (outcome.status === "failed")
      throw new Error(`Could not read prerequisite receipt: ${outcome.status}`);
    if (outcome.status === "pending" || outcome.status === "missing-capture") {
      pending = true;
      continue;
    }
    if (outcome.receipt.outcome === "dropped")
      return "dropped";
  }
  return pending ? "pending" : "ready";
}
function deliveryKey(scope, destination) {
  return JSON.stringify([
    scope.integration,
    scope.sessionId,
    scope.turnId,
    scope.eventId,
    destination
  ]);
}
async function dropPending(drainCache, candidate, reason) {
  let dropped = 0;
  for (const destination of candidate.pending) {
    dropped += await recordDropped(drainCache, candidate.scope, destination.id, reason);
  }
  return dropped;
}
async function recordDropped(drainCache, scope, destination, reason) {
  await drainCache.recordOutcome({ ...scope, destination, outcome: "dropped", reason });
  return 1;
}
function createDrainCache(store) {
  const captures = /* @__PURE__ */ new Map();
  const outcomes = /* @__PURE__ */ new Map();
  return {
    read(scope) {
      const key = captureKey(scope);
      let record = captures.get(key);
      if (record === void 0) {
        record = store.read(scope);
        captures.set(key, record);
      }
      return record;
    },
    readOutcome(scope, destination) {
      const key = deliveryKey(scope, destination);
      let outcome = outcomes.get(key);
      if (outcome === void 0) {
        outcome = store.readOutcome(scope, destination);
        outcomes.set(key, outcome);
      }
      return outcome;
    },
    async recordOutcome(input) {
      const result = await store.recordOutcome(input);
      if (result.status !== "recorded" && result.status !== "duplicate")
        throw new Error(`Could not persist ${input.outcome} delivery receipt: ${result.status}`);
      outcomes.set(deliveryKey(input, input.destination), Promise.resolve({
        status: "settled",
        receipt: result.receipt
      }));
      return result.receipt;
    },
    rememberCapture(record) {
      captures.set(captureKey(record), Promise.resolve(record));
    }
  };
}
function captureKey(scope) {
  return JSON.stringify([scope.integration, scope.sessionId, scope.turnId, scope.eventId]);
}
async function requireOutcome(drainCache, scope, destination) {
  const result = await drainCache.readOutcome(scope, destination);
  if (result.status === "failed" || result.status === "missing-capture")
    throw new Error(`Could not read delivery receipt: ${result.status}`);
  return result;
}
async function countPending(drainCache, entries, destinations) {
  let count = 0;
  for (const entry of entries) {
    const scope = scopeOf(entry.record);
    for (const destination of destinations) {
      if ((await requireOutcome(drainCache, scope, destination.id)).status === "pending")
        count += 1;
    }
  }
  return count;
}
function scopeOf(record) {
  return {
    integration: record.integration,
    sessionId: record.sessionId,
    turnId: record.turnId,
    eventId: record.eventId
  };
}
function validateDrainRequest(request) {
  if (request.writer === null || typeof request.writer !== "object")
    throw new TypeError("A delivery writer is required");
  validateIdentifier(request.writer.accountFingerprint, "account fingerprint");
  if (!Array.isArray(request.writer.destinations) || request.writer.destinations.length === 0)
    throw new TypeError("At least one delivery destination is required");
  const ids = /* @__PURE__ */ new Set();
  for (const destination of request.writer.destinations) {
    validateIdentifier(destination.id, "destination");
    if (ids.has(destination.id))
      throw new TypeError("Delivery destinations must be unique");
    ids.add(destination.id);
  }
  if (typeof request.writer.send !== "function")
    throw new TypeError("A delivery transport is required");
  if (request.now !== void 0 && (!Number.isSafeInteger(request.now) || !Number.isFinite(new Date(request.now).getTime()))) {
    throw new TypeError("Invalid delivery clock");
  }
}
function snapshotWriter(writer) {
  if (writer === null || typeof writer !== "object")
    throw new TypeError("A delivery writer is required");
  const accountFingerprint = writer.accountFingerprint;
  const sourceDestinations = writer.destinations;
  const send = writer.send;
  if (!Array.isArray(sourceDestinations) || sourceDestinations.length === 0)
    throw new TypeError("At least one delivery destination is required");
  const destinations = sourceDestinations.map((destination) => {
    if (destination === null || typeof destination !== "object")
      throw new TypeError("Invalid delivery destination");
    return Object.freeze({ id: destination.id });
  });
  return Object.freeze({
    accountFingerprint,
    destinations: Object.freeze(destinations),
    send: typeof send === "function" ? send.bind(writer) : send
  });
}
function resolvePolicy(policy) {
  const resolved = {
    maxAttempts: policy?.maxAttempts ?? DELIVERY_DEFAULT_MAX_ATTEMPTS,
    maxAgeMs: policy?.maxAgeMs ?? DELIVERY_DEFAULT_MAX_AGE_MS,
    maxEntries: policy?.maxEntries ?? DELIVERY_DEFAULT_MAX_ENTRIES
  };
  if (!Number.isSafeInteger(resolved.maxAttempts) || resolved.maxAttempts <= 0 || !Number.isSafeInteger(resolved.maxAgeMs) || resolved.maxAgeMs <= 0 || !Number.isSafeInteger(resolved.maxEntries) || resolved.maxEntries <= 0) {
    throw new TypeError("Invalid delivery policy");
  }
  return resolved;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/client.js
function createUploadClient(options) {
  const { apiKey, apiUrl, workspaceId, anonymizer, redactedFields } = options;
  return new Client({
    apiKey,
    apiUrl,
    workspaceId: workspaceId ?? "",
    autoBatchTracing: false,
    tracingSamplingRate: 1,
    disablePromptCache: true,
    debug: false,
    omitTracedRuntimeInfo: true,
    tracingMode: "langsmith",
    ...anonymizer === void 0 ? {} : { anonymizer, hideMetadata: anonymizer },
    ...redactedFields?.includes("inputs") ? { hideInputs: false } : {},
    ...redactedFields?.includes("outputs") ? { hideOutputs: false } : {}
  });
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/destination-identity.js
import { createHash as createHash2 } from "node:crypto";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/constants.js
var UPLOAD_ACCOUNT_FINGERPRINT_PREFIX = "account_";
var UPLOAD_DESTINATION_ID_PREFIX = "destination_";
var UPLOAD_FINGERPRINT_LENGTH = 32;
var UPLOAD_CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;
var UPLOAD_API_URL_TRAILING_SLASH_PATTERN = /\/$/;
var UPLOAD_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var UPLOAD_REPLICA_UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var UPLOAD_REPLICA_UUID_V5_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
var UPLOAD_REPLICA_UUID_V5_NAMESPACE_BYTES = Buffer.from(UPLOAD_REPLICA_UUID_V5_NAMESPACE.replaceAll("-", ""), "hex");
var UPLOAD_REPLICA_UUID_V5_DOMAIN = "langchain-upload-replica-v1";
var UPLOAD_REPLICA_DOTTED_ORDER_ID_LENGTH = 36;
var UPLOAD_REPLICA_IDENTITY_UPDATE_FIELDS = /* @__PURE__ */ new Set([
  "id",
  "name",
  "run_type",
  "start_time",
  "parent_run_id",
  "session_id",
  "session_name",
  "trace_id",
  "dotted_order"
]);
var UPLOAD_REPLICA_PATCH_UPDATE_FIELDS = /* @__PURE__ */ new Set([
  "inputs",
  "outputs",
  "end_time",
  "extra",
  "tags",
  "error",
  "serialized",
  "reference_example_id",
  "events"
]);
var UPLOAD_PATCH_FIELDS = /* @__PURE__ */ new Set([
  "inputs",
  "outputs",
  "end_time",
  "error",
  "tags",
  "serialized",
  "events",
  "reference_example_id"
]);
var UPLOAD_REDACTED_FIELDS = ["inputs", "outputs"];

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/destination-identity.js
function resolveUploadDestinationIdentities(options) {
  if (!Array.isArray(options.destinations) || options.destinations.length === 0) {
    throw new TypeError("At least one upload destination is required");
  }
  if (options.replicas !== void 0 && !Array.isArray(options.replicas)) {
    throw new TypeError("Upload replicas must be an array");
  }
  if (typeof options.redact !== "boolean")
    throw new TypeError("A redaction setting is required");
  const replicas2 = options.replicas ?? [];
  if (replicas2.length > 0 && options.destinations.length !== 1) {
    throw new TypeError("A replica upload requires exactly one primary destination");
  }
  const primary = options.destinations[0];
  const primaryProjectName = replicas2.length === 0 || primary === void 0 ? void 0 : normalizeRequiredText(primary.projectName, "project name");
  const destinations = replicas2.length === 0 ? options.destinations.map((destination) => resolveDestination(destination)) : replicas2.map((replica) => resolveReplicaDestination(replica, primary, primaryProjectName));
  const ids = /* @__PURE__ */ new Set();
  for (const destination of destinations) {
    if (ids.has(destination.id))
      throw new TypeError("Upload destinations must be unique");
    ids.add(destination.id);
  }
  const fingerprints = destinations.map(({ id }) => id).toSorted();
  const accountFingerprint = `${UPLOAD_ACCOUNT_FINGERPRINT_PREFIX}${fingerprint(JSON.stringify({
    destinations: fingerprints,
    redact: options.redact,
    redactExtraRules: options.redactExtraRules ?? null
  }))}`;
  return { accountFingerprint, destinations };
}
function resolveDestination(config, sourceProjectName, updates) {
  if (!config || typeof config !== "object")
    throw new TypeError("Invalid upload destination");
  if (typeof config.apiKey !== "string" || config.apiKey.trim().length === 0) {
    throw new TypeError("An API key is required for each upload destination");
  }
  const apiUrl = normalizeApiUrl(config.apiUrl);
  const projectName = normalizeRequiredText(config.projectName, "project name");
  const workspaceId = config.workspaceId === void 0 ? void 0 : normalizeRequiredText(config.workspaceId, "workspace ID");
  const identity = JSON.stringify({
    apiKey: config.apiKey,
    apiUrl,
    projectName,
    workspaceId: workspaceId ?? null,
    ...sourceProjectName === void 0 ? {} : { sourceProjectName, updates: updates ?? null }
  });
  const id = `${UPLOAD_DESTINATION_ID_PREFIX}${fingerprint(identity)}`;
  return {
    id,
    apiKey: config.apiKey,
    apiUrl,
    projectName,
    ...workspaceId === void 0 ? {} : { workspaceId },
    ...sourceProjectName === void 0 ? {} : { sourceProjectName },
    ...updates === void 0 ? {} : { updates }
  };
}
function resolveReplicaDestination(replica, primary, primaryProjectName) {
  if (!replica || typeof replica !== "object")
    throw new TypeError("Invalid upload replica");
  const updates = snapshotReplicaUpdates(replica.updates);
  const workspaceId = replica.workspaceId ?? primary.workspaceId;
  return resolveDestination({
    apiKey: replica.apiKey ?? primary.apiKey,
    apiUrl: replica.apiUrl ?? primary.apiUrl,
    projectName: replica.projectName ?? primary.projectName,
    ...workspaceId === void 0 ? {} : { workspaceId }
  }, primaryProjectName, updates);
}
function snapshotReplicaUpdates(value) {
  if (value === void 0)
    return void 0;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Replica updates must be an object");
  }
  let snapshot;
  try {
    snapshot = JSON.parse(JSON.stringify(value));
  } catch {
    throw new TypeError("Replica updates must be JSON serializable");
  }
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("Replica updates must be an object");
  }
  const updates = snapshot;
  for (const field2 of Object.keys(updates)) {
    if (UPLOAD_REPLICA_IDENTITY_UPDATE_FIELDS.has(field2)) {
      throw new TypeError("Replica updates cannot override run identity");
    }
    if (!UPLOAD_REPLICA_PATCH_UPDATE_FIELDS.has(field2)) {
      throw new TypeError("Unsupported replica update field");
    }
    if (field2 === "extra" && (updates[field2] === null || typeof updates[field2] !== "object" || Array.isArray(updates[field2]))) {
      throw new TypeError("Replica extra updates must be an object");
    }
  }
  return canonicalJsonObject(updates, "Replica updates");
}
function normalizeApiUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError("An API endpoint is required for each upload destination");
  }
  let endpoint;
  try {
    endpoint = new URL(value);
  } catch {
    throw new TypeError("Invalid upload API endpoint");
  }
  if (endpoint.protocol !== "https:" && endpoint.protocol !== "http:" || endpoint.username.length > 0 || endpoint.password.length > 0 || endpoint.search.length > 0 || endpoint.hash.length > 0) {
    throw new TypeError("Invalid upload API endpoint");
  }
  return endpoint.toString().replace(UPLOAD_API_URL_TRAILING_SLASH_PATTERN, "");
}
function normalizeRequiredText(value, name) {
  if (typeof value !== "string" || value.trim().length === 0 || UPLOAD_CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new TypeError(`Invalid upload ${name}`);
  }
  return value.trim();
}
function fingerprint(value) {
  return createHash2("sha256").update(value).digest("hex").slice(0, UPLOAD_FINGERPRINT_LENGTH);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/redaction.js
function createUploadAnonymizer(enabled, extraRules) {
  if (!enabled)
    return void 0;
  const normalizedRules = extraRules?.map(({ pattern, replace }) => ({
    pattern,
    ...replace === void 0 ? {} : { replace }
  }));
  return createSecretAnonymizer(normalizedRules === void 0 ? {} : { extraRules: normalizedRules });
}
function redactSdkOmittedFields(payload, anonymizer) {
  if (!anonymizer)
    return;
  if (payload["tags"] !== void 0)
    payload["tags"] = anonymizer(payload["tags"]);
  if (payload["serialized"] !== void 0) {
    payload["serialized"] = anonymizer(payload["serialized"]);
  }
  if (payload["events"] !== void 0)
    payload["events"] = anonymizer(payload["events"]);
}
function normalizedRedactedFields(value) {
  if (value === void 0)
    return [];
  if (!Array.isArray(value) || value.some((field2) => !UPLOAD_REDACTED_FIELDS.includes(field2)) || new Set(value).size !== value.length) {
    throw new TypeError("Redacted fields must be unique inputs or outputs");
  }
  return UPLOAD_REDACTED_FIELDS.filter((field2) => value.includes(field2));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/destinations.js
function resolveUploadDestinations(options) {
  const resolved = resolveUploadDestinationIdentities(options);
  const destinations = resolved.destinations.map((destination) => {
    const anonymizer = createUploadAnonymizer(options.redact, options.redactExtraRules);
    const client2 = createUploadClient({
      apiKey: destination.apiKey,
      apiUrl: destination.apiUrl,
      ...destination.workspaceId === void 0 ? {} : { workspaceId: destination.workspaceId },
      ...anonymizer === void 0 ? {} : { anonymizer }
    });
    return {
      ...destination,
      ...anonymizer === void 0 ? {} : { anonymizer },
      client: client2
    };
  });
  return { accountFingerprint: resolved.accountFingerprint, destinations };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/replica-identifiers.js
import { createHash as createHash3 } from "node:crypto";
function remapReplicaRunContext(context, sourceProjectName, destinationProjectName) {
  if (sourceProjectName === destinationProjectName)
    return context;
  return {
    ...context,
    id: remapReplicaRunId(context.id, destinationProjectName),
    ...context.parent_run_id === void 0 ? {} : { parent_run_id: remapReplicaRunId(context.parent_run_id, destinationProjectName) },
    ...context.trace_id === void 0 ? {} : { trace_id: remapReplicaRunId(context.trace_id, destinationProjectName) },
    ...context.dotted_order === void 0 ? {} : { dotted_order: remapReplicaDottedOrder(context.dotted_order, destinationProjectName) }
  };
}
function remapReplicaRunId(runId, projectName) {
  if (!UPLOAD_UUID_PATTERN.test(runId))
    throw new TypeError("Replica run IDs must be UUIDs");
  if (UPLOAD_REPLICA_UUID_V7_PATTERN.test(runId)) {
    return computeRunIdForSecondaryReplica(runId, projectName);
  }
  const name = JSON.stringify([UPLOAD_REPLICA_UUID_V5_DOMAIN, projectName, runId.toLowerCase()]);
  const hash = createHash3("sha1").update(UPLOAD_REPLICA_UUID_V5_NAMESPACE_BYTES).update(name).digest();
  hash[6] = hash[6] & 15 | 80;
  hash[8] = hash[8] & 63 | 128;
  const value = hash.subarray(0, 16).toString("hex");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}
function remapReplicaDottedOrder(dottedOrder, projectName) {
  return dottedOrder.split(".").map((segment) => {
    const id = segment.slice(-UPLOAD_REPLICA_DOTTED_ORDER_ID_LENGTH);
    return `${segment.slice(0, -UPLOAD_REPLICA_DOTTED_ORDER_ID_LENGTH)}${remapReplicaRunId(id, projectName)}`;
  }).join(".");
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/upload/upload.js
function createLangSmithUploadWriter(options) {
  const resolved = resolveUploadDestinations(options);
  const destinations = resolved.destinations.map(({ id }) => Object.freeze({ id }));
  const byId = new Map(resolved.destinations.map((destination) => [destination.id, destination]));
  const redactedClients = /* @__PURE__ */ new Map();
  return Object.freeze({
    accountFingerprint: resolved.accountFingerprint,
    destinations: Object.freeze(destinations),
    async send(submission, destinationId) {
      const destination = byId.get(destinationId);
      if (!destination)
        throw new TypeError("Unknown upload destination");
      validateSubmission(submission);
      const redactedFields = normalizedRedactedFields(submission.redactedFields).filter((field2) => submission.privacyMode === "full" && !(submission.operation === "patch" && field2 === "outputs" && Object.hasOwn(destination.updates ?? {}, "outputs")));
      let client2 = destination.client;
      if (redactedFields.length > 0) {
        const key = JSON.stringify([destinationId, redactedFields]);
        const previous = redactedClients.get(key);
        client2 = previous ?? createUploadClient({ ...destination, redactedFields });
        if (previous === void 0)
          redactedClients.set(key, client2);
      }
      const payload = submission.operation === "post" ? preparePostRunPayload(submission, destination) : preparePatchRunPayload(submission, destination);
      if (submission.operation === "patch") {
        applyReplicaPatchUpdates(payload, destination, submission.privacyMode);
      }
      redactSdkOmittedFields(payload, destination.anonymizer);
      const clientOptions = {
        apiKey: destination.apiKey,
        apiUrl: destination.apiUrl,
        ...destination.workspaceId === void 0 ? {} : { workspaceId: destination.workspaceId }
      };
      try {
        if (submission.operation === "post") {
          await client2.createRun({ ...payload, project_name: destination.projectName }, clientOptions);
          return { destinationId, runId: submission.run.id, operation: "posted" };
        }
        await client2.updateRun(runIdForDestination(submission.run.id, destination), payload, clientOptions);
        return { destinationId, runId: submission.run.id, operation: "patched" };
      } catch {
        throw new Error("LangSmith upload failed");
      }
    }
  });
}
function runConfig2(context, submission, destination) {
  const metadata = buildCodingAgentMetadata(submission.metadata);
  const destinationContext = contextForDestination(context, destination);
  return {
    id: destinationContext.id,
    name: destinationContext.name,
    run_type: destinationContext.run_type,
    project_name: destination.projectName,
    inputs: {},
    extra: { metadata },
    client: destination.client,
    ...destinationContext.start_time === void 0 ? {} : { start_time: destinationContext.start_time },
    ...destinationContext.parent_run_id === void 0 ? {} : { parent_run_id: destinationContext.parent_run_id },
    ...destinationContext.trace_id === void 0 ? {} : { trace_id: destinationContext.trace_id },
    ...destinationContext.dotted_order === void 0 ? {} : { dotted_order: destinationContext.dotted_order }
  };
}
function contextForDestination(context, destination) {
  if (destination.sourceProjectName === void 0)
    return context;
  return remapReplicaRunContext(context, destination.sourceProjectName, destination.projectName);
}
function runIdForDestination(runId, destination) {
  if (destination.sourceProjectName === void 0 || destination.sourceProjectName === destination.projectName) {
    return runId;
  }
  return remapReplicaRunId(runId, destination.projectName);
}
function applyReplicaPatchUpdates(payload, destination, privacyMode) {
  if (privacyMode !== "full" || destination.updates === void 0)
    return;
  const mutablePayload = payload;
  for (const [field2, value] of Object.entries(destination.updates)) {
    if (field2 === "inputs" || field2 === "end_time" && payload.end_time === void 0)
      continue;
    if (field2 === "extra") {
      mutablePayload.extra = mergeReplicaExtra(mutablePayload.extra, value);
    } else {
      mutablePayload[field2] = structuredClone(value);
    }
  }
}
function mergeReplicaExtra(baseValue, updateValue) {
  const baseExtra = isPlainRecord(baseValue) ? baseValue : {};
  const updateExtra = isPlainRecord(updateValue) ? structuredClone(updateValue) : {};
  const baseMetadata = isPlainRecord(baseExtra["metadata"]) ? baseExtra["metadata"] : {};
  const updateMetadata = isPlainRecord(updateExtra["metadata"]) ? updateExtra["metadata"] : {};
  return {
    ...baseExtra,
    ...updateExtra,
    metadata: { ...updateMetadata, ...baseMetadata }
  };
}
function preparePostRunPayload(submission, destination) {
  const source = submission.run;
  const config = runConfig2(source, submission, destination);
  config.inputs = source.inputs;
  if (source.end_time !== void 0)
    config.end_time = source.end_time;
  if (source.outputs !== void 0)
    config.outputs = source.outputs;
  if (source.tags !== void 0)
    config.tags = source.tags;
  if (source.error !== void 0)
    config.error = source.error;
  if (source.serialized !== void 0)
    config.serialized = source.serialized;
  if (source.reference_example_id !== void 0) {
    config.reference_example_id = source.reference_example_id;
  }
  const run = createCodingAgentRunTree(config, submission.integration, submission.privacyMode, submission.privacyContext);
  if (source.events !== void 0)
    run.events = source.events;
  return JSON.parse(JSON.stringify(run.toJSON()));
}
function preparePatchRunPayload(submission, destination) {
  const config = runConfig2(submission.run, submission, destination);
  for (const field2 of submission.patch.fields) {
    if (field2 === "inputs")
      config.inputs = submission.patch.values.inputs;
    else if (field2 === "outputs")
      config.outputs = submission.patch.values.outputs;
    else if (field2 === "end_time")
      config.end_time = submission.patch.values.end_time;
    else if (field2 === "error")
      config.error = submission.patch.values.error;
    else if (field2 === "tags")
      config.tags = submission.patch.values.tags;
    else if (field2 === "serialized")
      config.serialized = submission.patch.values.serialized;
    else if (field2 === "reference_example_id") {
      config.reference_example_id = submission.patch.values.reference_example_id;
    }
  }
  const run = createCodingAgentRunTree(config, submission.integration, submission.privacyMode, submission.privacyContext);
  if (submission.patch.fields.includes("events")) {
    run.events = submission.patch.values.events;
  }
  const snapshot = JSON.parse(JSON.stringify(run.toJSON()));
  const update = {
    extra: snapshot["extra"],
    session_name: destination.projectName
  };
  for (const field2 of submission.patch.fields) {
    const value = snapshot[field2];
    if (value === void 0)
      continue;
    if (field2 === "inputs")
      update.inputs = value;
    else if (field2 === "outputs")
      update.outputs = value;
    else if (field2 === "end_time")
      update.end_time = value;
    else if (field2 === "error")
      update.error = value;
    else if (field2 === "tags")
      update.tags = value;
    else if (field2 === "serialized")
      update.serialized = value;
    else if (field2 === "events")
      update.events = value;
    else if (field2 === "reference_example_id") {
      update.reference_example_id = value;
    }
  }
  return update;
}
function validateSubmission(submission) {
  if (submission === null || typeof submission !== "object") {
    throw new TypeError("A prepared run submission is required");
  }
  if (submission.operation !== "post" && submission.operation !== "patch") {
    throw new TypeError("Invalid upload operation");
  }
  if (submission.metadata === null || typeof submission.metadata !== "object") {
    throw new TypeError("Run metadata is required");
  }
  if (submission.integration !== submission.metadata.integration) {
    throw new TypeError("Run metadata integration does not match the submission");
  }
  if (submission.run === null || typeof submission.run !== "object") {
    throw new TypeError("Run data is required");
  }
  if (Object.hasOwn(submission.run, "child_runs")) {
    throw new TypeError("Each upload submission must contain a single run");
  }
  if (typeof submission.run.id !== "string" || submission.run.id.trim().length === 0) {
    throw new TypeError("A stable run ID is required");
  }
  if (submission.privacyMode !== "full" && submission.privacyMode !== "metadata") {
    throw new TypeError("Invalid privacy mode");
  }
  if (submission.operation === "patch")
    validatePatch(submission);
}
function validatePatch(submission) {
  if (submission.patch === null || typeof submission.patch !== "object" || !Array.isArray(submission.patch.fields) || submission.patch.values === null || typeof submission.patch.values !== "object") {
    throw new TypeError("A patch field set and values are required");
  }
  if (typeof submission.run.name !== "string" || typeof submission.run.run_type !== "string") {
    throw new TypeError("Patch run context must preserve its name and type");
  }
  const selected = /* @__PURE__ */ new Set();
  for (const candidate of submission.patch.fields) {
    if (typeof candidate !== "string" || !UPLOAD_PATCH_FIELDS.has(candidate)) {
      throw new TypeError("Invalid patch field");
    }
    const field2 = candidate;
    if (selected.has(field2))
      throw new TypeError("Patch fields must be unique");
    if (!Object.hasOwn(submission.patch.values, field2) || submission.patch.values[field2] === void 0) {
      throw new TypeError("Every selected patch field must have a value");
    }
    selected.add(field2);
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/capture-wake-constants.js
var CAPTURE_WAKE_ERROR_NAME = "CaptureWakeError";
var CAPTURE_WAKE_FAILURE_MESSAGE = "Trace work was saved but its worker could not start";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/capture-wake.js
var CaptureWakeError = class extends Error {
  captureResult;
  constructor(captureResult, cause) {
    super(`${CAPTURE_WAKE_FAILURE_MESSAGE}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
    this.name = CAPTURE_WAKE_ERROR_NAME;
    this.captureResult = captureResult;
  }
};
async function wakeCapturedWork(captureResult, wake) {
  try {
    await wake();
  } catch (cause) {
    throw new CaptureWakeError(captureResult, cause);
  }
}
async function readSavedCaptureWake(error2, options) {
  if (!(error2 instanceof CaptureWakeError))
    return void 0;
  const result = structuredClone(error2.captureResult);
  const { record } = result;
  if (record.integration !== options.integration || record.sessionId !== options.sessionId || record.turnId !== options.turnId || record.destinationFingerprint !== options.destinationFingerprint || options.eventId !== void 0 && record.eventId !== options.eventId || options.runId !== void 0 && record.runId !== options.runId)
    return void 0;
  const saved = await options.store.read({
    integration: record.integration,
    sessionId: record.sessionId,
    turnId: record.turnId,
    eventId: record.eventId
  });
  return saved !== void 0 && canonicalJson(saved) === canonicalJson(record) ? result : void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/settlement/pass.js
import { createHash as createHash4 } from "node:crypto";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/constants.js
var ROOT_RUN_EXECUTION_ORDER = 1;
var DOTTED_ORDER_TIME_PREFIX_LENGTH = 18;
var DOTTED_ORDER_SEGMENT_PATTERN = /^(\d{8}T\d{12}Z)([^.]+)$/u;
var DOTTED_ORDER_STRIP_PATTERN = /[-:.]/gu;
var LIFECYCLE_POST_EVENT_KIND = "run-post";
var LIFECYCLE_PATCH_EVENT_KIND = "run-patch";
var LIFECYCLE_SETTLEMENT_EVENT_KIND = "run-settlement-patch";
var LIFECYCLE_ATTRIBUTION_READY_FIELD = "attributionReady";
var LIFECYCLE_SETTLEMENT_LOCK_DIRECTORY = "lifecycle-settlement-v1";
var LIFECYCLE_SETTLEMENT_LOCK_FILE = "drain";
var LIFECYCLE_SETTLEMENT_LOCK_INTEGRATIONS_DIRECTORY = "integrations";
var LIFECYCLE_SETTLEMENT_LOCK_SESSIONS_DIRECTORY = "sessions";
var LIFECYCLE_SETTLEMENT_LOCK_ACCOUNTS_DIRECTORY = "accounts";
var LIFECYCLE_SNAPSHOT_LOCK_DIRECTORY = "lifecycle-snapshot-v1";
var LIFECYCLE_SNAPSHOT_LOCK_FILE = "capture";
var LIFECYCLE_SNAPSHOT_REVISION_EVENT_ID_PREFIX = "run-snapshot-v1:";
var LIFECYCLE_SNAPSHOT_OPTIONAL_RUN_FIELDS = [
  "outputs",
  "end_time",
  "error",
  "tags",
  "serialized",
  "events",
  "reference_example_id"
];
var LIFECYCLE_TURN_CLOSURE_STATES = ["open", "provisional", "authoritative"];

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/closure.js
function deriveAttributionReadiness(value, integration) {
  const source = requirePlainRecord(value, "Prepared run submission");
  const metadata = prepareCodingAgentMetadataProvenance(requireOwnDataField(source, "metadata"), integration, "full");
  if (metadata.status === "deferred")
    return false;
  return attributionMetadataReady(buildCodingAgentMetadata(metadata.value));
}
function storedAttributionReadiness(record, integration) {
  const evidence = requirePlainRecord(record.turnEvidence, "Stored turn evidence");
  const readiness = ownDataField(evidence, LIFECYCLE_ATTRIBUTION_READY_FIELD);
  if (readiness.present) {
    return requireBoolean(readiness.value, `Stored turn evidence ${LIFECYCLE_ATTRIBUTION_READY_FIELD}`);
  }
  const payload = requirePlainRecord(record.normalizedPayload, "Stored run payload");
  if (requireOwnDataField(payload, "privacyMode") !== "full")
    return false;
  const metadata = prepareCodingAgentMetadataProvenance(record.metadataProvenance, integration, "full");
  if (metadata.status === "deferred")
    return false;
  return attributionMetadataReady(buildCodingAgentMetadata(metadata.value));
}
function indexCaptureSources(sources) {
  return new Map(sources.map((source) => [captureScopeKey(captureScope(source)), source]));
}
function attributionMetadataReady(projected) {
  return typeof projected["repository_name"] === "string" && projected["repository_name"].length > 0 && typeof projected["ls_attribution_identifier"] === "string" && projected["ls_attribution_identifier"].length > 0;
}
async function withholdUnresolvedEndTime(input) {
  const { record, submission, sourceSnapshot, sourceByScope, integration, destinations, readOutcome } = input;
  if (record.eventKind !== LIFECYCLE_POST_EVENT_KIND && record.eventKind !== LIFECYCLE_PATCH_EVENT_KIND) {
    return submission;
  }
  const evidence = requirePlainRecord(record.turnEvidence, "Stored turn evidence");
  const attributionReady = storedAttributionReadiness(record, integration);
  const closureState = requireOwnDataField(evidence, "closureState");
  if (typeof closureState !== "string" || !LIFECYCLE_TURN_CLOSURE_STATES.includes(closureState)) {
    throw new TypeError("Stored turn evidence has an invalid closure state");
  }
  const runType = submission.metadata.runType;
  if (runType !== "tool" && runType !== "root")
    return submission;
  const hasCurrentEndTime = submission.operation === "post" ? submission.run.end_time !== void 0 : submission.patch.fields.includes("end_time");
  const hasEndTime = hasCurrentEndTime || hasPriorEndTime(record, sourceByScope);
  if (!hasEndTime || attributionReady)
    return submission;
  if (runType === "root" && !await hasMissingChildReceipts(record, evidence, sourceSnapshot, destinations, readOutcome)) {
    return submission;
  }
  return removeOutgoingEndTime(submission);
}
function hasPriorEndTime(record, sourceByScope) {
  const pending = [...record.dependencies ?? []];
  const visited = /* @__PURE__ */ new Set();
  while (pending.length > 0) {
    const scope = pending.pop();
    const key = captureScopeKey(scope);
    if (visited.has(key))
      continue;
    visited.add(key);
    const previous = sourceByScope.get(key);
    if (previous === void 0)
      continue;
    if (previous.runId === record.runId && (previous.eventKind === LIFECYCLE_POST_EVENT_KIND || previous.eventKind === LIFECYCLE_PATCH_EVENT_KIND) && recordHasEndTime(previous)) {
      return true;
    }
    pending.push(...previous.dependencies ?? []);
  }
  return false;
}
function recordHasEndTime(record) {
  const payload = requirePlainRecord(record.normalizedPayload, "Stored run payload");
  if (payload["operation"] === "post") {
    const run = requirePlainRecord(requireOwnDataField(payload, "run"), "Stored run snapshot");
    const endTime2 = ownDataField(run, "end_time");
    return endTime2.present && endTime2.value !== void 0;
  }
  if (payload["operation"] !== "patch")
    return false;
  const patch = requirePlainRecord(requireOwnDataField(payload, "patch"), "Stored run patch");
  const fields = requireStringArray(requireOwnDataField(patch, "fields"), "Patch fields");
  if (!fields.includes("end_time"))
    return false;
  const values = requirePlainRecord(requireOwnDataField(patch, "values"), "Patch values");
  const endTime = ownDataField(values, "end_time");
  return endTime.present && endTime.value !== void 0;
}
async function hasMissingChildReceipts(record, evidence, sourceSnapshot, destinations, readOutcome) {
  const childRunIds = requireStringArray(requireOwnDataField(evidence, "childRunIds"), "Child run IDs").map((runId) => requireNonBlankString(runId, "Child run ID"));
  const children = childRunIds.filter((runId) => runId !== record.runId);
  if (children.length === 0)
    return false;
  for (const childRunId of children) {
    const childCaptures = sourceSnapshot.filter((source) => source.runId === childRunId && source.destinationFingerprint === record.destinationFingerprint && source.eventKind === LIFECYCLE_POST_EVENT_KIND);
    if (childCaptures.length === 0)
      return true;
    for (const child of childCaptures) {
      const scope = captureScope(child);
      for (const destination of destinations) {
        const outcome = await readOutcome(scope, destination.id);
        if (outcome.status === "failed")
          throw new Error(`Could not read child delivery receipt: ${outcome.code}`);
        if (outcome.status !== "settled" || outcome.receipt.outcome !== "delivered")
          return true;
      }
    }
  }
  return false;
}
function removeOutgoingEndTime(submission) {
  const privacyContext = submission.privacyMode !== "metadata" ? void 0 : submission.operation === "post" ? {
    status: submission.run.error !== void 0 || submission.privacyContext?.status === "error" ? "error" : "running"
  } : {
    status: submission.privacyContext.status === "error" ? "error" : "running"
  };
  if (submission.operation === "post") {
    const run = { ...submission.run };
    delete run.end_time;
    return {
      ...submission,
      run,
      ...privacyContext === void 0 ? {} : { privacyContext }
    };
  }
  const fields = submission.patch.fields.filter((field2) => field2 !== "end_time");
  const values = { ...submission.patch.values };
  delete values.end_time;
  return {
    ...submission,
    patch: { fields, values },
    ...privacyContext === void 0 ? {} : { privacyContext }
  };
}
function captureScope(record) {
  return {
    integration: record.integration,
    sessionId: record.sessionId,
    turnId: record.turnId,
    eventId: record.eventId
  };
}
function captureScopeKey(scope) {
  return JSON.stringify([scope.integration, scope.sessionId, scope.turnId, scope.eventId]);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/identity.js
function createRunIdentity(input) {
  const id = requireNonBlankString(input.id, "Run ID");
  const start_time = requireTimestamp(input.start_time);
  const segment = dottedOrderSegment(start_time, id);
  if (input.parent === void 0) {
    return { id, start_time, trace_id: id, dotted_order: segment };
  }
  const parent = canonicalParent(input.parent);
  return {
    id,
    start_time,
    parent_run_id: parent.id,
    trace_id: parent.trace_id,
    dotted_order: `${parent.dotted_order}.${segment}`
  };
}
function canonicalParent(parent) {
  const id = requireNonBlankString(parent.id, "Parent run ID");
  const trace_id = requireNonBlankString(parent.trace_id, "Parent trace ID");
  const dotted_order = requireNonBlankString(parent.dotted_order, "Parent dotted order");
  const parent_run_id = parent.parent_run_id === void 0 ? void 0 : requireNonBlankString(parent.parent_run_id, "Parent run's parent ID");
  const segments = dotted_order.split(".").map(parseDottedOrderSegment);
  const runIds = segments.map((segment) => segment.runId);
  const lastSegment = segments.at(-1);
  const start_time = parent.start_time === void 0 ? void 0 : requireTimestamp(parent.start_time);
  if (lastSegment?.runId !== id || runIds[0] !== trace_id || parent_run_id !== void 0 && (runIds.length < 2 || runIds.at(-2) !== parent_run_id) || start_time !== void 0 && lastSegment.timestamp.slice(0, DOTTED_ORDER_TIME_PREFIX_LENGTH) !== dottedOrderTimePrefix(start_time)) {
    throw new TypeError("Parent run identity is not canonical");
  }
  return {
    id,
    ...parent_run_id === void 0 ? {} : { parent_run_id },
    trace_id,
    dotted_order,
    ...start_time === void 0 ? {} : { start_time }
  };
}
function parseDottedOrderSegment(segment) {
  const match = DOTTED_ORDER_SEGMENT_PATTERN.exec(segment);
  if (match === null || !isValidDottedOrderTime(match[1])) {
    throw new TypeError("Parent run identity is not canonical");
  }
  return { timestamp: match[1], runId: match[2] };
}
function isValidDottedOrderTime(value) {
  const time = value.slice(0, DOTTED_ORDER_TIME_PREFIX_LENGTH);
  const iso = `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}T${time.slice(9, 11)}:${time.slice(11, 13)}:${time.slice(13, 15)}.${time.slice(15, 18)}Z`;
  const parsed = new Date(iso);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === iso;
}
function dottedOrderTimePrefix(startTime) {
  return new Date(startTime).toISOString().slice(0, -1).replace(DOTTED_ORDER_STRIP_PATTERN, "");
}
function dottedOrderSegment(startTime, runId) {
  const epoch = new Date(startTime).getTime();
  const serialized = new Date(epoch).toISOString().slice(0, -1);
  const precisionTime = `${serialized}${String(ROOT_RUN_EXECUTION_ORDER).padStart(3, "0")}Z`;
  return `${precisionTime.replace(DOTTED_ORDER_STRIP_PATTERN, "")}${runId}`;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/projection.js
function projectSubmission(value, integration, priorIdentity) {
  const source = requirePlainRecord(value, "Prepared run submission");
  if (requireOwnDataField(source, "integration") !== integration) {
    throw new TypeError("Run integration does not match the lifecycle bridge");
  }
  const privacyMode = requireOwnDataField(source, "privacyMode");
  if (privacyMode !== "full" && privacyMode !== "metadata")
    throw new TypeError("Invalid privacy mode");
  const redactedField = ownDataField(source, "redactedFields");
  const redactedFields = normalizedRedactedFields(redactedField.present ? redactedField.value : void 0);
  const redaction = privacyMode === "full" && redactedFields.length > 0 ? { redactedFields } : {};
  const operation = requireOwnDataField(source, "operation");
  if (operation !== "post" && operation !== "patch")
    throw new TypeError("Invalid run operation");
  if (operation === "post") {
    const run2 = canonicalIdentity(normalizedRunSnapshot(requireOwnDataField(source, "run")), priorIdentity);
    const suppliedPrivacyContext = ownDataField(source, "privacyContext");
    const status = run2.error !== void 0 ? "error" : suppliedPrivacyContext.present ? privacyStatus(suppliedPrivacyContext.value).status : statusForPost(run2);
    const metadata2 = prepareCodingAgentMetadataProvenance(requireOwnDataField(source, "metadata"), integration, privacyMode, status);
    if (metadata2.status === "deferred")
      return metadata2;
    const projected2 = {
      payload: {
        operation,
        integration,
        privacyMode,
        ...redaction,
        ...privacyMode === "metadata" ? { privacyContext: { status } } : {},
        run: privacyMode === "metadata" ? projectPost(run2, metadata2.value, status) : run2
      },
      metadata: metadata2.value,
      privacyStatus: status
    };
    return { status: "ready", value: projected2 };
  }
  const run = canonicalIdentity(normalizedRunContext(requireOwnDataField(source, "run")), priorIdentity, true);
  const patch = normalizedPatch(requireOwnDataField(source, "patch"));
  const privacyContext = privacyStatus(requireOwnDataField(source, "privacyContext"));
  const metadata = prepareCodingAgentMetadataProvenance(requireOwnDataField(source, "metadata"), integration, privacyMode, privacyContext.status);
  if (metadata.status === "deferred")
    return metadata;
  const projected = {
    payload: {
      operation,
      integration,
      privacyMode,
      ...redaction,
      run,
      privacyContext,
      patch: privacyMode === "metadata" ? projectPatch(run, patch, integration, metadata.value, privacyContext) : patch
    },
    metadata: metadata.value,
    privacyStatus: privacyContext.status
  };
  return { status: "ready", value: projected };
}
function projectTurnEvidence(value, mode, attributionReady) {
  const source = requirePlainRecord(value, "Lifecycle turn evidence");
  const childRunIds = requireStringArray(requireOwnDataField(source, "childRunIds"), "Child run IDs").map((runId) => requireNonBlankString(runId, "Child run ID"));
  const closureState = requireOwnDataField(source, "closureState");
  if (typeof closureState !== "string" || !LIFECYCLE_TURN_CLOSURE_STATES.includes(closureState)) {
    throw new TypeError("Lifecycle turn evidence has an invalid closure state");
  }
  const structural2 = {
    childRunIds,
    closureState
  };
  const persisted = { ...structural2, [LIFECYCLE_ATTRIBUTION_READY_FIELD]: attributionReady };
  const rootRunId = ownDataField(source, "rootRunId");
  if (rootRunId.present && rootRunId.value !== void 0) {
    persisted.rootRunId = requireNonBlankString(rootRunId.value, "Root run ID");
  }
  return canonicalJsonValue(mode === "metadata" ? persisted : { ...source, ...persisted });
}
function projectPost(run, metadata, status) {
  const tree = createCodingAgentRunTree({
    id: run.id,
    name: run.name,
    run_type: run.run_type,
    ...run.start_time === void 0 ? {} : { start_time: run.start_time },
    inputs: run.inputs,
    extra: { metadata: buildCodingAgentMetadata(metadata) },
    ...run.end_time === void 0 ? {} : { end_time: run.end_time },
    ...run.outputs === void 0 ? {} : { outputs: run.outputs },
    ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
    ...run.trace_id === void 0 ? {} : { trace_id: run.trace_id },
    ...run.dotted_order === void 0 ? {} : { dotted_order: run.dotted_order },
    ...run.error === void 0 ? {} : { error: run.error },
    ...run.tags === void 0 ? {} : { tags: run.tags },
    ...run.serialized === void 0 ? {} : { serialized: run.serialized },
    ...run.reference_example_id === void 0 ? {} : { reference_example_id: run.reference_example_id }
  }, metadata.integration, "metadata", { status });
  if (run.events !== void 0)
    tree.events = run.events;
  const projected = tree.toJSON();
  return {
    id: run.id,
    name: run.name,
    run_type: run.run_type,
    start_time: requireTimestamp(run.start_time),
    inputs: canonicalJsonObject(projected["inputs"], "Projected run inputs"),
    outputs: canonicalJsonObject(projected["outputs"], "Projected run outputs"),
    ...run.end_time === void 0 ? {} : { end_time: run.end_time },
    ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
    ...run.trace_id === void 0 ? {} : { trace_id: run.trace_id },
    ...run.dotted_order === void 0 ? {} : { dotted_order: run.dotted_order }
  };
}
function projectPatch(context, patch, integration, metadata, privacyContext) {
  const tree = createCodingAgentRunTree({
    id: context.id,
    name: context.name,
    run_type: context.run_type,
    ...context.start_time === void 0 ? {} : { start_time: context.start_time },
    inputs: patch.values.inputs ?? {},
    outputs: patch.values.outputs ?? {},
    extra: { metadata: buildCodingAgentMetadata(metadata) },
    ...context.parent_run_id === void 0 ? {} : { parent_run_id: context.parent_run_id },
    ...context.trace_id === void 0 ? {} : { trace_id: context.trace_id },
    ...context.dotted_order === void 0 ? {} : { dotted_order: context.dotted_order },
    ...patch.values.end_time === void 0 ? {} : { end_time: patch.values.end_time },
    ...patch.values.error === void 0 ? {} : { error: patch.values.error },
    ...patch.values.tags === void 0 ? {} : { tags: patch.values.tags },
    ...patch.values.serialized === void 0 ? {} : { serialized: patch.values.serialized },
    ...patch.values.reference_example_id === void 0 ? {} : { reference_example_id: patch.values.reference_example_id }
  }, integration, "metadata", privacyContext);
  if (patch.values.events !== void 0)
    tree.events = patch.values.events;
  const projected = tree.toJSON();
  const fields = survivingCodingAgentPatchFields(projected, patch.fields);
  const values = {};
  for (const field2 of fields) {
    const value = ownDataField(projected, field2);
    if (!value.present)
      continue;
    values[field2] = field2 === "inputs" || field2 === "outputs" ? canonicalJsonObject(value.value, `Projected patch ${field2}`) : field2 === "tags" ? requireStringArray(value.value, `Projected patch ${field2}`) : field2 === "events" ? canonicalJsonArray(value.value, `Projected patch ${field2}`) : field2 === "error" || field2 === "reference_example_id" ? requireString(value.value, `Projected patch ${field2}`) : field2 === "end_time" ? requireTimestamp(value.value) : canonicalJsonObject(value.value, `Projected patch ${field2}`);
  }
  return { fields: fields.filter((field2) => Object.hasOwn(values, field2)), values };
}
function normalizedRunSnapshot(value) {
  const source = requirePlainRecord(value, "Normalized run snapshot");
  const run = {
    id: requiredText(source, "id", "Run ID"),
    name: requiredText(source, "name", "Run name"),
    run_type: requiredText(source, "run_type", "Run type"),
    inputs: canonicalJsonObject(requireOwnDataField(source, "inputs"), "Run inputs")
  };
  copyRunContext(source, run);
  const endTime = ownDataField(source, "end_time");
  if (endTime.present && endTime.value !== void 0)
    run.end_time = requireTimestamp(endTime.value);
  const outputs = ownDataField(source, "outputs");
  if (outputs.present && outputs.value !== void 0)
    run.outputs = canonicalJsonObject(outputs.value, "Run outputs");
  const tags = ownDataField(source, "tags");
  if (tags.present && tags.value !== void 0)
    run.tags = requireStringArray(tags.value, "Run tags");
  const error2 = ownDataField(source, "error");
  if (error2.present && error2.value !== void 0)
    run.error = requireString(error2.value, "Run error");
  const serialized = ownDataField(source, "serialized");
  if (serialized.present && serialized.value !== void 0)
    run.serialized = canonicalJsonObject(serialized.value, "Serialized run data");
  const events = ownDataField(source, "events");
  if (events.present && events.value !== void 0)
    run.events = canonicalJsonArray(events.value, "Run events");
  const example = ownDataField(source, "reference_example_id");
  if (example.present && example.value !== void 0) {
    run.reference_example_id = requireNonBlankString(example.value, "Reference example ID");
  }
  return run;
}
function normalizedRunContext(value) {
  const source = requirePlainRecord(value, "Normalized run context");
  const run = {
    id: requiredText(source, "id", "Run ID"),
    name: requiredText(source, "name", "Run name"),
    run_type: requiredText(source, "run_type", "Run type")
  };
  copyRunContext(source, run);
  return run;
}
function copyRunContext(source, run) {
  const start = ownDataField(source, "start_time");
  if (start.present && start.value !== void 0)
    run.start_time = requireTimestamp(start.value);
  for (const [key, name] of [
    ["parent_run_id", "Parent run ID"],
    ["trace_id", "Trace ID"],
    ["dotted_order", "Dotted order"]
  ]) {
    const field2 = ownDataField(source, key);
    if (field2.present && field2.value !== void 0)
      run[key] = requireNonBlankString(field2.value, name);
  }
}
function canonicalIdentity(run, prior, requireStableIdentity = false) {
  const reusable = prior?.id === run.id && prior.parent_run_id === run.parent_run_id ? prior : void 0;
  if (reusable !== void 0 && (run.start_time !== void 0 && run.start_time !== reusable.start_time || run.trace_id !== void 0 && run.trace_id !== reusable.trace_id || run.dotted_order !== void 0 && run.dotted_order !== reusable.dotted_order)) {
    throw new TypeError("Run identity changed for a persisted capture");
  }
  const knownStartTime = run.start_time ?? reusable?.start_time;
  if (knownStartTime === void 0 && requireStableIdentity) {
    throw new TypeError("Patch run context must preserve its canonical start time");
  }
  const startTime = knownStartTime ?? Date.now();
  const result = { ...run, start_time: startTime };
  const canGenerateRootIdentity = !requireStableIdentity && result.parent_run_id === void 0;
  const generatedOrder = canGenerateRootIdentity && result.dotted_order === void 0 && reusable?.dotted_order === void 0 ? createRunIdentity({ id: result.id, start_time: startTime }).dotted_order : void 0;
  const traceId = result.trace_id ?? reusable?.trace_id ?? (canGenerateRootIdentity ? result.id : void 0);
  const order = result.dotted_order ?? reusable?.dotted_order ?? generatedOrder;
  if (traceId === void 0 || order === void 0) {
    throw new TypeError("Run context must preserve its canonical trace ID and dotted order");
  }
  result.trace_id = traceId;
  result.dotted_order = order;
  return result;
}
function normalizedPatch(value) {
  const source = requirePlainRecord(value, "Normalized run patch");
  const candidates = canonicalJsonArray(requireOwnDataField(source, "fields"), "Patch field mask");
  const sourceValues = requirePlainRecord(requireOwnDataField(source, "values"), "Patch values");
  const seen = /* @__PURE__ */ new Set();
  const fields = [];
  const values = {};
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !UPLOAD_PATCH_FIELDS.has(candidate)) {
      throw new TypeError("Invalid patch field");
    }
    const field2 = candidate;
    if (seen.has(field2))
      throw new TypeError("Patch fields must be unique");
    const selected = ownDataField(sourceValues, field2);
    if (!selected.present || selected.value === void 0) {
      throw new TypeError("Every selected patch field must have a value");
    }
    seen.add(field2);
    fields.push(field2);
    values[field2] = field2 === "inputs" || field2 === "outputs" ? canonicalJsonObject(selected.value, `Patch ${field2}`) : field2 === "end_time" ? requireTimestamp(selected.value) : field2 === "error" ? requireString(selected.value, "Patch error") : field2 === "reference_example_id" ? requireNonBlankString(selected.value, "Patch reference example ID") : field2 === "tags" ? requireStringArray(selected.value, "Patch tags") : field2 === "events" ? canonicalJsonArray(selected.value, "Patch events") : canonicalJsonObject(selected.value, `Patch ${field2}`);
  }
  return { fields, values };
}
function privacyStatus(value) {
  const source = requirePlainRecord(value, "Patch privacy context");
  const status = requireOwnDataField(source, "status");
  if (status !== "running" && status !== "completed" && status !== "error") {
    throw new TypeError("Invalid patch privacy status");
  }
  return { status };
}
function statusForPost(run) {
  if (run.error !== void 0)
    return "error";
  if (run.end_time !== void 0)
    return "completed";
  return "running";
}
function requiredText(source, key, name) {
  return requireNonBlankString(requireOwnDataField(source, key), name);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/settlement/constants.js
var TURN_REPOSITORY_KEYS2 = [
  "repository_name",
  "repository_provider",
  "repository_url",
  "git_branch",
  "git_commit_sha"
];
var REPOSITORY_METADATA_KEYS2 = [...TURN_REPOSITORY_KEYS2, "ls_attribution_identifier"];
var REPOSITORY_NAME_KEY2 = "repository_name";
var ATTRIBUTION_IDENTIFIER_KEY2 = "ls_attribution_identifier";
var SETTLEMENT_EVENT_ID_PREFIX = "turn-settlement-";
var SETTLEMENT_EVENT_ID_PATTERN = /^turn-settlement-[0-9a-f]{64}$/u;

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/settlement/settlement.js
function attributionOf2(metadata) {
  const carried = {};
  for (const key of REPOSITORY_METADATA_KEYS2) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.length > 0)
      carried[key] = value;
  }
  return carried;
}
var namesARepository2 = (carried) => carried[REPOSITORY_NAME_KEY2] !== void 0;
function turnAttribution2(record) {
  const root = attributionOf2(record.root?.metadata);
  const inToolCallOrder = [...record.children].sort((left, right) => left.dotted_order < right.dotted_order ? -1 : 1).map((child) => attributionOf2(child.metadata));
  const source = namesARepository2(root) ? root : inToolCallOrder.find((carried) => namesARepository2(carried));
  const knowsWhoWorkedInSource = (carried) => carried[ATTRIBUTION_IDENTIFIER_KEY2] !== void 0 && carried[REPOSITORY_NAME_KEY2] === source?.[REPOSITORY_NAME_KEY2];
  const author = root[ATTRIBUTION_IDENTIFIER_KEY2] ?? source?.[ATTRIBUTION_IDENTIFIER_KEY2] ?? inToolCallOrder.find(knowsWhoWorkedInSource)?.[ATTRIBUTION_IDENTIFIER_KEY2];
  const filled = { ...source };
  if (author !== void 0)
    filled[ATTRIBUTION_IDENTIFIER_KEY2] = author;
  return Object.keys(filled).length > 0 ? filled : void 0;
}
function metadataAfterFill2(run, filled) {
  const carried = attributionOf2(run.metadata);
  const workedOutItsOwn = namesARepository2(carried) && carried[REPOSITORY_NAME_KEY2] !== filled[REPOSITORY_NAME_KEY2];
  if (workedOutItsOwn)
    return void 0;
  const missing = Object.entries(filled).filter(([key]) => carried[key] === void 0);
  if (missing.length === 0)
    return void 0;
  return { ...run.metadata, ...Object.fromEntries(missing) };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/settlement/pass.js
async function settleCapturedTurns(options) {
  if (options.destinations.length === 0)
    throw new TypeError("At least one settlement destination is required");
  const sourceRecords = orderSourceCaptures(options.captures.map(({ record }) => record).filter((record) => record.integration === options.integration && record.sessionId === options.sessionId && record.destinationFingerprint === options.destinationFingerprint && (record.eventKind === LIFECYCLE_POST_EVENT_KIND || record.eventKind === LIFECYCLE_PATCH_EVENT_KIND)));
  const generatedRecords = options.captures.map(({ record }) => record).filter((record) => record.integration === options.integration && record.sessionId === options.sessionId && record.destinationFingerprint === options.destinationFingerprint && record.eventKind === LIFECYCLE_SETTLEMENT_EVENT_KIND);
  const projected = /* @__PURE__ */ new Map();
  const allByRunId = /* @__PURE__ */ new Map();
  for (const record of sourceRecords) {
    const capture = projectCapture(record, options.integration);
    if (capture === void 0)
      continue;
    const turn = projected.get(record.turnId) ?? [];
    turn.push(capture);
    projected.set(record.turnId, turn);
    const runEvents = allByRunId.get(record.runId) ?? [];
    runEvents.push(capture);
    allByRunId.set(record.runId, runEvents);
  }
  const generatedByTurn = groupByTurn(generatedRecords);
  const turns = [.../* @__PURE__ */ new Set([...projected.keys(), ...generatedByTurn.keys()])].toSorted();
  const reports = [];
  const patches = [];
  let captured = 0;
  for (const turnId of turns) {
    const events = projected.get(turnId) ?? [];
    const generated = generatedByTurn.get(turnId) ?? [];
    const result = await settleOneTurn(turnId, events, generated, allByRunId, options);
    reports.push(result.report);
    patches.push(...result.patches);
    captured += result.captured;
  }
  return { progress: { captured, turns: reports }, patches };
}
async function refreshSettlementProgress(work, destinations, readOutcome) {
  const patchesByTurn = /* @__PURE__ */ new Map();
  for (const patch of work.patches) {
    const turn = patchesByTurn.get(patch.turnId) ?? [];
    turn.push(patch);
    patchesByTurn.set(patch.turnId, turn);
  }
  const turns = [];
  for (const entry of work.progress.turns) {
    const patches = patchesByTurn.get(entry.turnId) ?? [];
    if (patches.length === 0 || entry.status !== "pending" && entry.status !== "settled") {
      turns.push(entry);
      continue;
    }
    const readiness = await captureReadiness(patches.map(({ scope }) => scope), destinations, readOutcome);
    const { reason: previousReason, destinations: previousDestinations, ...unchanged } = entry;
    const reason = readiness.status === "delivered" ? previousReason === "settlement-pending" ? void 0 : previousReason : readiness.status === "dropped" ? "settlement-dropped" : "settlement-pending";
    const reportDestinations = readiness.destinations.length > 0 ? readiness.destinations : previousReason === "settlement-pending" ? void 0 : previousDestinations;
    turns.push({
      ...unchanged,
      status: readiness.status === "dropped" ? "blocked" : readiness.status === "pending" ? "pending" : "settled",
      ...reason === void 0 ? {} : { reason },
      ...reportDestinations === void 0 ? {} : { destinations: reportDestinations }
    });
  }
  return { captured: work.progress.captured, turns };
}
async function settleOneTurn(turnId, events, generated, allByRunId, options) {
  const rootRunIds = /* @__PURE__ */ new Set();
  const childRunIds = /* @__PURE__ */ new Set();
  let closureState = "open";
  for (const event2 of events) {
    const evidence = parseEvidence(event2.record.turnEvidence, event2.attributionReady);
    if (evidence.rootRunId !== void 0)
      rootRunIds.add(evidence.rootRunId);
    for (const childRunId of evidence.childRunIds)
      childRunIds.add(childRunId);
    if (closureRank(evidence.closureState) > closureRank(closureState))
      closureState = evidence.closureState;
  }
  if (rootRunIds.size === 0)
    return { report: report(turnId, "deferred", "missing-root"), patches: [], captured: 0 };
  if (rootRunIds.size > 1)
    return {
      report: report(turnId, "blocked", "conflicting-root", [...rootRunIds].toSorted()),
      patches: [],
      captured: 0
    };
  if (closureState !== "authoritative") {
    return {
      report: report(turnId, "deferred", closureState),
      patches: [],
      captured: 0
    };
  }
  const rootRunId = [...rootRunIds][0];
  childRunIds.delete(rootRunId);
  const requiredRunIds = [rootRunId, ...[...childRunIds].toSorted()];
  const currentByRunId = /* @__PURE__ */ new Map();
  for (const event2 of events) {
    const runEvents2 = currentByRunId.get(event2.record.runId) ?? [];
    runEvents2.push(event2);
    currentByRunId.set(event2.record.runId, runEvents2);
  }
  const byRunId = /* @__PURE__ */ new Map();
  for (const runId of requiredRunIds) {
    const runEvents2 = runId === rootRunId ? currentByRunId.get(runId) ?? [] : allByRunId.get(runId) ?? [];
    byRunId.set(runId, runEvents2);
    if (!runEvents2.some(({ payload }) => payload.operation === "post")) {
      return {
        report: report(turnId, "deferred", "missing-run", [runId]),
        patches: [],
        captured: 0
      };
    }
  }
  const sourceEvents = [...events];
  for (const childRunId of childRunIds) {
    sourceEvents.push(...allByRunId.get(childRunId) ?? []);
  }
  const sourceScopes = uniqueScopes(sourceEvents.map(({ record }) => captureScope2(record)));
  const sourceReadiness = await captureReadiness(sourceScopes, options.destinations, options.readOutcome);
  if (sourceReadiness.status === "dropped") {
    return {
      report: report(turnId, "blocked", "source-dropped", requiredRunIds, sourceReadiness.destinations),
      patches: [],
      captured: 0
    };
  }
  if (sourceReadiness.status === "pending") {
    return {
      report: report(turnId, "pending", "source-pending", requiredRunIds, sourceReadiness.destinations),
      patches: [],
      captured: 0
    };
  }
  const runEvents = /* @__PURE__ */ new Map();
  const recorded = /* @__PURE__ */ new Map();
  for (const runId of requiredRunIds) {
    const captures = byRunId.get(runId) ?? [];
    runEvents.set(runId, captures);
    recorded.set(runId, recordRun2(captures));
  }
  const root = recorded.get(rootRunId);
  const children = requiredRunIds.filter((runId) => runId !== rootRunId).map((runId) => recorded.get(runId));
  const turn = {
    path: "",
    origin: "capture",
    root,
    children,
    turnId,
    closed: true,
    delivered: new Set(requiredRunIds),
    fixed: /* @__PURE__ */ new Set()
  };
  const attribution = turnAttribution2(turn);
  const dependencies = sourceScopes;
  const patches = [];
  let captured = 0;
  for (const runId of requiredRunIds) {
    if (!currentByRunId.has(runId))
      continue;
    const captureEvents = runEvents.get(runId);
    const latest = captureEvents.at(-1);
    const run = recorded.get(runId);
    const merged = attribution === void 0 ? void 0 : metadataAfterFill2(run, attribution);
    const currentAttribution = attributionOf2(run.metadata);
    const added = Object.fromEntries(Object.entries(merged === void 0 ? {} : attribution ?? {}).filter(([key]) => currentAttribution[key] === void 0));
    const endTime = retainedEndTime(captureEvents);
    const restoreEndTime = endTime !== void 0 && captureEvents.some((event2) => (event2.metadata.runType === "tool" || event2.metadata.runType === "root") && !event2.attributionReady && capturedEndTime(event2) !== void 0);
    if (Object.keys(added).length === 0 && !restoreEndTime)
      continue;
    const sourceMetadata = mergeMetadataOptions(captureEvents);
    const metadata = Object.keys(added).length === 0 ? sourceMetadata : addAttribution(sourceMetadata, added);
    const updatedMetadata = buildCodingAgentMetadata(metadata);
    if (Object.entries(added).some(([key, value]) => updatedMetadata[key] !== value))
      throw new Error("Settlement metadata could not preserve attribution");
    const submission = patchPayload(latest, metadata, options.integration, restoreEndTime ? endTime : void 0, hasCausalRunError(captureEvents));
    const eventId = settlementEventId(turnId, runId, dependencies, rootRunId, childRunIds, added);
    const scope = {
      integration: options.integration,
      sessionId: options.sessionId,
      turnId,
      eventId
    };
    const previous = orderSourceCaptures(generated.filter((item) => item.runId === runId && item.eventId !== eventId)).at(-1);
    const previousDependency = previous === void 0 ? [] : [captureScope2(previous)];
    if (previous !== void 0) {
      const previousReadiness = await captureReadiness(previousDependency, options.destinations, options.readOutcome);
      if (previousReadiness.status === "dropped") {
        return {
          report: report(turnId, "blocked", "settlement-dropped", [runId], previousReadiness.destinations),
          patches,
          captured
        };
      }
    }
    const result = await options.capture({
      turnId,
      eventId,
      runId,
      destinationFingerprint: options.destinationFingerprint,
      eventKind: LIFECYCLE_SETTLEMENT_EVENT_KIND,
      normalizedPayload: canonicalJsonValue(submission.payload),
      metadataProvenance: canonicalJsonValue(submission.metadata),
      turnEvidence: canonicalJsonValue({
        rootRunId,
        childRunIds: [...childRunIds].toSorted(),
        closureState,
        [LIFECYCLE_ATTRIBUTION_READY_FIELD]: latest.attributionReady
      }),
      dependencies: uniqueScopes([...dependencies, ...previousDependency])
    });
    if (result.status === "failed" || result.status === "conflict")
      throw new Error(`Could not capture settled run ${runId}: ${result.status}`);
    if (result.status === "published")
      captured += 1;
    patches.push({ turnId, runId, scope });
  }
  const reportResult = report(turnId, patches.length === 0 ? "settled" : "pending", patches.length === 0 ? "no-change" : "settlement-pending", patches.map(({ runId }) => runId));
  return { report: { ...reportResult, patches: patches.length }, patches, captured };
}
function projectCapture(record, integration) {
  const rawPayload = canonicalJsonObject(record.normalizedPayload, "Stored run payload");
  const submission = projectSubmission({ ...rawPayload, metadata: record.metadataProvenance }, integration);
  if (submission.status === "deferred")
    return void 0;
  const expectedKind = submission.value.payload.operation === "post" ? LIFECYCLE_POST_EVENT_KIND : LIFECYCLE_PATCH_EVENT_KIND;
  if (record.eventKind !== expectedKind)
    throw new TypeError("Capture event kind does not match its operation");
  const evidence = parseEvidence(record.turnEvidence, storedAttributionReadiness(record, integration));
  return {
    record,
    payload: submission.value.payload,
    metadata: submission.value.metadata,
    open: captureIsOpen(submission.value.payload),
    attributionReady: evidence.attributionReady
  };
}
function captureIsOpen(payload) {
  if (payload.operation === "post")
    return payload.run.end_time === void 0 && payload.run.error === void 0;
  if (payload.privacyContext.status === "running")
    return true;
  return false;
}
function recordRun2(events) {
  const latest = events.at(-1);
  const run = latest.payload.run;
  return {
    run_id: latest.record.runId,
    ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
    trace_id: requireNonBlankString(run.trace_id, "Trace ID"),
    dotted_order: requireNonBlankString(run.dotted_order, "Dotted order"),
    name: requireNonBlankString(run.name, "Run name"),
    run_type: requireNonBlankString(run.run_type, "Run type"),
    tracing: latest.payload.privacyMode,
    open: latest.open,
    metadata: buildCodingAgentMetadata(mergeMetadataOptions(events))
  };
}
function mergeMetadataOptions(captures) {
  const first = captures[0];
  if (first === void 0)
    throw new Error("Run metadata is required for settlement");
  let merged = first.metadata;
  for (const { metadata } of captures.slice(1)) {
    const base = mergeMetadataObject(merged.base, metadata.base);
    const runSpecific = mergeMetadataObject(merged.runSpecific, metadata.runSpecific);
    const providerMetadata = mergeMetadataObject(merged.providerMetadata, metadata.providerMetadata);
    const usageMetadata = mergeMetadataObject(merged.usageMetadata, metadata.usageMetadata);
    merged = {
      ...merged,
      ...metadata,
      ...base === void 0 ? {} : { base },
      ...runSpecific === void 0 ? {} : { runSpecific },
      ...providerMetadata === void 0 ? {} : { providerMetadata },
      ...usageMetadata === void 0 ? {} : { usageMetadata }
    };
  }
  return merged;
}
function mergeMetadataObject(previous, current) {
  if (previous === void 0 && current === void 0)
    return void 0;
  return { ...previous, ...current };
}
function patchPayload(source, metadata, integration, endTime, causalRunError = false) {
  const context = source.payload.run;
  const submission = {
    operation: "patch",
    integration,
    privacyMode: source.payload.privacyMode,
    ...source.payload.redactedFields === void 0 ? {} : { redactedFields: source.payload.redactedFields },
    metadata,
    run: {
      id: context.id,
      name: context.name,
      run_type: context.run_type,
      ...context.start_time === void 0 ? {} : { start_time: context.start_time },
      ...context.parent_run_id === void 0 ? {} : { parent_run_id: context.parent_run_id },
      ...context.trace_id === void 0 ? {} : { trace_id: context.trace_id },
      ...context.dotted_order === void 0 ? {} : { dotted_order: context.dotted_order }
    },
    privacyContext: source.payload.operation === "patch" ? {
      ...source.payload.privacyContext,
      ...causalRunError ? { status: "error" } : endTime !== void 0 && source.payload.privacyContext.status !== "error" ? { status: "completed" } : {}
    } : {
      status: causalRunError || source.payload.run.error !== void 0 || source.payload.privacyContext?.status === "error" ? "error" : endTime !== void 0 || source.payload.run.end_time !== void 0 ? "completed" : source.payload.privacyContext?.status ?? "running"
    },
    patch: endTime === void 0 ? { fields: [], values: {} } : { fields: ["end_time"], values: { end_time: endTime } }
  };
  const projected = projectSubmission(submission, integration);
  if (projected.status === "deferred")
    throw new Error("Settlement patch lost thread identity");
  return projected.value;
}
function hasCausalRunError(events) {
  let hasError = false;
  for (const { payload } of events) {
    if (payload.operation === "post") {
      hasError = payload.run.error !== void 0 || payload.privacyContext?.status === "error";
    } else if (payload.patch.fields.includes("error")) {
      hasError = payload.patch.values.error !== void 0;
    } else if (payload.privacyContext.status === "error") {
      hasError = true;
    }
  }
  return hasError;
}
function addAttribution(metadata, attribution) {
  const layer = CODING_AGENT_INTEGRATION_POLICIES[metadata.integration].fullModePrecedence === "custom-wins" ? "base" : "runSpecific";
  const previous = metadata[layer] ?? {};
  return { ...metadata, [layer]: { ...previous, ...attribution } };
}
function parseEvidence(value, attributionReady) {
  const source = requirePlainRecord(value, "Stored turn evidence");
  const childRunIds = requireStringArray(requireOwnDataField(source, "childRunIds"), "Child run IDs").map((runId) => requireNonBlankString(runId, "Child run ID"));
  const closureState = requireOwnDataField(source, "closureState");
  if (typeof closureState !== "string" || !LIFECYCLE_TURN_CLOSURE_STATES.includes(closureState)) {
    throw new TypeError("Stored turn evidence has an invalid closure state");
  }
  const result = {
    childRunIds,
    closureState,
    attributionReady
  };
  const rootRunId = ownDataField(source, "rootRunId");
  if (rootRunId.present && rootRunId.value !== void 0)
    result.rootRunId = requireNonBlankString(rootRunId.value, "Root run ID");
  return result;
}
function capturedEndTime(event2) {
  if (event2.payload.operation === "post")
    return event2.payload.run.end_time;
  if (!event2.payload.patch.fields.includes("end_time"))
    return void 0;
  const value = event2.payload.patch.values.end_time;
  return value === void 0 ? void 0 : requireTimestamp(value);
}
function retainedEndTime(events) {
  let endTime;
  for (const event2 of events) {
    const captured = capturedEndTime(event2);
    if (captured !== void 0)
      endTime = captured;
  }
  return endTime;
}
function closureRank(state) {
  return state === "authoritative" ? 2 : state === "provisional" ? 1 : 0;
}
async function captureReadiness(scopes, destinations, readOutcome) {
  const pending = /* @__PURE__ */ new Set();
  const dropped = /* @__PURE__ */ new Set();
  for (const scope of scopes) {
    for (const destination of destinations) {
      const outcome = await readOutcome(scope, destination.id);
      if (outcome.status === "failed")
        throw new Error(`Could not read settlement receipt: ${outcome.code}`);
      if (outcome.status === "settled") {
        if (outcome.receipt.outcome === "dropped")
          dropped.add(destination.id);
      } else {
        pending.add(destination.id);
      }
    }
  }
  return dropped.size > 0 ? { status: "dropped", destinations: [...dropped].toSorted() } : pending.size > 0 ? { status: "pending", destinations: [...pending].toSorted() } : { status: "delivered", destinations: [] };
}
function settlementEventId(turnId, runId, dependencies, rootRunId, childRunIds, attribution) {
  const revision = createHash4("sha256").update(JSON.stringify({
    turnId,
    runId,
    rootRunId,
    childRunIds: [...childRunIds].toSorted(),
    dependencies: dependencies.toSorted(compareScopes),
    attribution
  })).digest("hex");
  return `${SETTLEMENT_EVENT_ID_PREFIX}${revision}`;
}
function uniqueScopes(scopes) {
  const unique = /* @__PURE__ */ new Map();
  for (const scope of scopes)
    unique.set(JSON.stringify(scope), scope);
  return [...unique.values()].toSorted(compareScopes);
}
function captureScope2(record) {
  return {
    integration: record.integration,
    sessionId: record.sessionId,
    turnId: record.turnId,
    eventId: record.eventId
  };
}
function captureScopeKey2(scope) {
  return JSON.stringify([scope.integration, scope.sessionId, scope.turnId, scope.eventId]);
}
function compareScopes(left, right) {
  return JSON.stringify(left).localeCompare(JSON.stringify(right));
}
function compareCaptures2(left, right) {
  if (left.capturedAtMs !== right.capturedAtMs)
    return left.capturedAtMs - right.capturedAtMs;
  return left.eventId.localeCompare(right.eventId);
}
function orderSourceCaptures(records) {
  const byScope = new Map(records.map((record) => [captureScopeKey2(captureScope2(record)), record]));
  const dependents = new Map(records.map((record) => [captureScopeKey2(captureScope2(record)), []]));
  const dependencyCounts = new Map(records.map((record) => [captureScopeKey2(captureScope2(record)), 0]));
  for (const record of records) {
    const recordKey = captureScopeKey2(captureScope2(record));
    for (const dependency of record.dependencies ?? []) {
      const prerequisite = byScope.get(captureScopeKey2(dependency));
      if (prerequisite === void 0)
        continue;
      dependents.get(captureScopeKey2(captureScope2(prerequisite))).push(record);
      dependencyCounts.set(recordKey, dependencyCounts.get(recordKey) + 1);
    }
  }
  const ready = [];
  for (const record of records) {
    if (dependencyCounts.get(captureScopeKey2(captureScope2(record))) === 0)
      pushOrderedCapture(ready, record);
  }
  const ordered = [];
  while (ready.length > 0) {
    const record = popOrderedCapture(ready);
    ordered.push(record);
    for (const dependent of dependents.get(captureScopeKey2(captureScope2(record))) ?? []) {
      const key = captureScopeKey2(captureScope2(dependent));
      const count = dependencyCounts.get(key) - 1;
      dependencyCounts.set(key, count);
      if (count === 0)
        pushOrderedCapture(ready, dependent);
    }
  }
  if (ordered.length !== records.length)
    throw new TypeError("Source capture dependencies contain a cycle");
  return ordered;
}
function compareSourceCaptures(left, right) {
  return compareCaptures2(left, right) || compareScopes(captureScope2(left), captureScope2(right));
}
function pushOrderedCapture(heap, record) {
  let index = heap.length;
  heap.push(record);
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2);
    const parent = heap[parentIndex];
    if (compareSourceCaptures(parent, record) <= 0)
      break;
    heap[index] = parent;
    index = parentIndex;
  }
  heap[index] = record;
}
function popOrderedCapture(heap) {
  const first = heap[0];
  if (first === void 0)
    return void 0;
  const last = heap.pop();
  if (heap.length === 0)
    return first;
  let index = 0;
  while (index * 2 + 1 < heap.length) {
    const leftIndex = index * 2 + 1;
    const rightIndex = leftIndex + 1;
    const childIndex = rightIndex < heap.length && compareSourceCaptures(heap[rightIndex], heap[leftIndex]) < 0 ? rightIndex : leftIndex;
    const child = heap[childIndex];
    if (compareSourceCaptures(last, child) <= 0)
      break;
    heap[index] = child;
    index = childIndex;
  }
  heap[index] = last;
  return first;
}
function groupByTurn(records) {
  const turns = /* @__PURE__ */ new Map();
  for (const record of records) {
    const captures = turns.get(record.turnId) ?? [];
    captures.push(record);
    turns.set(record.turnId, captures);
  }
  return turns;
}
function report(turnId, status, reason, runIds = [], destinations = []) {
  return {
    turnId,
    status,
    reason,
    ...runIds.length === 0 ? {} : { runIds },
    ...destinations.length === 0 ? {} : { destinations },
    patches: 0
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/utils/validation/snapshot.js
function snapshotData(value) {
  return copySnapshot(value, /* @__PURE__ */ new WeakMap());
}
function copySnapshot(value, copies) {
  if (value === null || typeof value !== "object")
    return value;
  const previous = copies.get(value);
  if (previous !== void 0)
    return previous;
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Snapshot input must contain plain objects and arrays");
  }
  let copy;
  if (Array.isArray(value)) {
    const array = [];
    array.length = value.length;
    copy = array;
  } else {
    copy = Object.create(prototype);
  }
  copies.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === "length")
      continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === void 0 || !("value" in descriptor)) {
      throw new TypeError("Snapshot input must use data properties");
    }
    Object.defineProperty(copy, key, {
      value: copySnapshot(descriptor.value, copies),
      enumerable: descriptor.enumerable === true,
      configurable: true,
      writable: true
    });
  }
  return copy;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/snapshot.js
import { join as join15 } from "node:path";
async function captureLifecycleSnapshot(options, input) {
  const captureInput = snapshotData(requirePlainRecord(input, "Lifecycle snapshot capture"));
  const snapshot = requirePlainRecord(captureInput, "Lifecycle snapshot capture");
  const turnId = requireNonBlankString(snapshot["turnId"], "Turn ID");
  const eventId = requireNonBlankString(snapshot["eventId"], "Event ID");
  validateIdentifier(turnId, "turn ID");
  validateIdentifier(eventId, "event ID");
  const submission = requirePlainRecord(snapshot["submission"], "Prepared run snapshot");
  if (submission["operation"] !== "post")
    throw new TypeError("A full run snapshot must be a POST");
  const sourceRun = requirePlainRecord(requireOwnDataField(submission, "run"), "Run snapshot");
  const runId = requireNonBlankString(requireOwnDataField(sourceRun, "id"), "Run ID");
  validateIdentifier(runId, "run ID");
  const streamHash = identifierHash(`${options.integration}\0${options.sessionId}\0${turnId}\0${runId}`);
  const revisionPrefix = `${LIFECYCLE_SNAPSHOT_REVISION_EVENT_ID_PREFIX}${streamHash}:`;
  const lockDirectory = await ensurePrivateDirectory(options.storageRoot, [
    LIFECYCLE_SNAPSHOT_LOCK_DIRECTORY,
    "integrations",
    options.integration,
    "sessions",
    identifierHash(options.sessionId),
    "turns",
    identifierHash(turnId),
    "runs",
    identifierHash(runId)
  ]);
  return withFileLock(join15(lockDirectory, LIFECYCLE_SNAPSHOT_LOCK_FILE), async () => {
    const records = (await options.store.enumerateTurn(options.integration, options.sessionId, turnId)).map(({ record }) => record).filter((record) => record.runId === runId);
    const state = readSnapshotState(records, options.destinationFingerprint, revisionPrefix);
    if (state === "conflict")
      return { status: "conflict" };
    if (state === void 0) {
      if (records.length > 0)
        return { status: "conflict" };
      return options.capture(captureInput);
    }
    if (state.post.destinationFingerprint !== options.destinationFingerprint) {
      return { status: "conflict" };
    }
    const projected = projectSubmission(snapshot["submission"], options.integration, runContext(state.post));
    if (projected.status === "deferred") {
      return { status: "deferred", reason: "missing-thread-identity" };
    }
    if (projected.value.payload.operation !== "post")
      return { status: "conflict" };
    if (projected.value.payload.privacyMode !== state.privacyMode || !sameCanonical(normalizedRedactedFields(projected.value.payload.redactedFields), state.redactedFields)) {
      return { status: "conflict" };
    }
    const candidateRun = applySnapshotOmissions(projected.value.payload.run, state.run, sourceRun);
    if (!sameRunIdentity(state.run, candidateRun))
      return { status: "conflict" };
    const privacyStatus2 = state.privacyMode === "metadata" ? projected.value.privacyStatus : runPrivacyStatus(candidateRun);
    const evidence = projectTurnEvidence(snapshot["turnEvidence"], state.privacyMode, deriveAttributionReadiness(snapshot["submission"], options.integration));
    const metadata = canonicalJsonValue(projected.value.metadata);
    const changedFields = snapshotPatchFields(state.run, candidateRun);
    const newDependencies = (captureInput.dependencies ?? []).some((dependency) => !sameCanonical(dependency, captureScope3(state.head)) && !state.snapshotDependencies.some((persisted) => sameCanonical(dependency, persisted)));
    if (changedFields.length === 0 && sameCanonical(state.metadataProvenance, metadata) && sameCanonical(state.turnEvidence, evidence) && state.privacyStatus === privacyStatus2 && !newDependencies) {
      const result = { status: "duplicate", record: state.head };
      await wakeCapturedWork(result, options.wake);
      return result;
    }
    const patchValues = {};
    for (const field2 of changedFields) {
      const value = ownDataField(sourceRun, field2);
      if (!value.present || value.value === void 0)
        return { status: "conflict" };
      patchValues[field2] = value.value;
    }
    const patch = {
      operation: "patch",
      integration: options.integration,
      privacyMode: state.privacyMode,
      ...submission["redactedFields"] === void 0 ? {} : { redactedFields: normalizedRedactedFields(submission["redactedFields"]) },
      metadata: captureInput.submission.metadata,
      run: runContext(state.post),
      privacyContext: { status: privacyStatus2 },
      patch: { fields: changedFields, values: patchValues }
    };
    const nextRevision = state.revisionCount + 1;
    const revisionInput = {
      turnId,
      eventId: `${revisionPrefix}${String(nextRevision).padStart(12, "0")}`,
      submission: patch,
      turnEvidence: captureInput.turnEvidence,
      dependencies: [
        captureScope3(state.head),
        ...(captureInput.dependencies ?? []).filter((dependency) => !sameCanonical(dependency, captureScope3(state.head)))
      ],
      sourceAgeStartedAtMs: state.post.sourceAgeStartedAtMs ?? state.post.capturedAtMs
    };
    return options.capture(revisionInput);
  });
}
function readSnapshotState(records, destinationFingerprint, revisionPrefix) {
  const posts = records.filter((record) => record.eventKind === LIFECYCLE_POST_EVENT_KIND);
  const revisionCandidates = records.filter((record) => record.eventId.startsWith(revisionPrefix));
  if (posts.length > 1)
    return "conflict";
  const post = posts[0];
  if (post === void 0)
    return records.length === 0 ? void 0 : "conflict";
  if (post.destinationFingerprint !== destinationFingerprint || recordOperation(post) !== "post") {
    return "conflict";
  }
  const postPayload = payloadObject(post);
  const privacyMode = readPrivacyMode(postPayload);
  const run = storedRun(postPayload, post.runId);
  const redactedFields = storedRedactedFields(postPayload);
  let metadataProvenance = canonicalJsonValue(post.metadataProvenance);
  let turnEvidence = canonicalJsonValue(post.turnEvidence);
  let privacyStatus2 = storedPrivacyStatus(postPayload, run, privacyMode);
  const runFields = run;
  let head = post;
  const orderedRevisions = revisionCandidates.toSorted((left, right) => left.eventId.localeCompare(right.eventId));
  let expectedPrevious = post;
  for (let index = 0; index < orderedRevisions.length; index += 1) {
    const revision = orderedRevisions[index];
    const expectedId = `${revisionPrefix}${String(index + 1).padStart(12, "0")}`;
    if (revision.eventId !== expectedId || revision.eventKind !== LIFECYCLE_PATCH_EVENT_KIND || revision.destinationFingerprint !== destinationFingerprint || !sameDependencies(revision, expectedPrevious)) {
      return "conflict";
    }
    const payload = payloadObject(revision);
    if (readPrivacyMode(payload) !== privacyMode)
      return "conflict";
    const candidateFields = storedRedactedFields(payload);
    if (!sameCanonical(candidateFields, redactedFields))
      return "conflict";
    const patch = requirePlainRecord(requireOwnDataField(payload, "patch"), "Stored run patch");
    const values = requirePlainRecord(requireOwnDataField(patch, "values"), "Stored patch values");
    const fields = requireStringArray(requireOwnDataField(patch, "fields"), "Stored patch fields");
    const seen = /* @__PURE__ */ new Set();
    for (const field2 of fields) {
      if (!UPLOAD_PATCH_FIELDS.has(field2) || seen.has(field2))
        return "conflict";
      const value = ownDataField(values, field2);
      if (!value.present || value.value === void 0)
        return "conflict";
      runFields[field2] = value.value;
      seen.add(field2);
    }
    const runContextValue = requirePlainRecord(requireOwnDataField(payload, "run"), "Stored run context");
    if (!sameRunIdentity(run, runContextValue))
      return "conflict";
    privacyStatus2 = readPrivacyStatus(requireOwnDataField(payload, "privacyContext"));
    metadataProvenance = canonicalJsonValue(revision.metadataProvenance);
    turnEvidence = canonicalJsonValue(revision.turnEvidence);
    head = revision;
    expectedPrevious = revision;
  }
  const snapshotChain = [post, ...orderedRevisions];
  for (const record of records) {
    if (snapshotChain.includes(record))
      continue;
    if (record.eventKind !== LIFECYCLE_SETTLEMENT_EVENT_KIND || !SETTLEMENT_EVENT_ID_PATTERN.test(record.eventId) || record.destinationFingerprint !== destinationFingerprint || !validSettlementRecord(record, run, privacyMode, redactedFields, snapshotChain)) {
      return "conflict";
    }
  }
  return {
    post,
    head,
    run,
    metadataProvenance,
    turnEvidence,
    privacyMode,
    redactedFields,
    privacyStatus: privacyStatus2,
    revisionCount: orderedRevisions.length,
    snapshotDependencies: snapshotChain.flatMap((record) => record.dependencies ?? [])
  };
}
function payloadObject(record) {
  return requirePlainRecord(record.normalizedPayload, "Stored run payload");
}
function recordOperation(record) {
  return payloadObject(record)["operation"];
}
function validSettlementRecord(record, currentRun, privacyMode, redactedFields, snapshotChain) {
  const payload = payloadObject(record);
  if (recordOperation(record) !== "patch" || readPrivacyMode(payload) !== privacyMode)
    return false;
  if (!sameCanonical(storedRedactedFields(payload), redactedFields))
    return false;
  readPrivacyStatus(requireOwnDataField(payload, "privacyContext"));
  const run = requirePlainRecord(requireOwnDataField(payload, "run"), "Settlement run context");
  if (!sameRunIdentity(currentRun, run))
    return false;
  const patch = requirePlainRecord(requireOwnDataField(payload, "patch"), "Settlement run patch");
  const fields = requireStringArray(requireOwnDataField(patch, "fields"), "Settlement patch fields");
  const values = requirePlainRecord(requireOwnDataField(patch, "values"), "Settlement patch values");
  const seen = /* @__PURE__ */ new Set();
  for (const field2 of fields) {
    if (!UPLOAD_PATCH_FIELDS.has(field2) || seen.has(field2))
      return false;
    const value = ownDataField(values, field2);
    if (!value.present || value.value === void 0)
      return false;
    seen.add(field2);
  }
  return (record.dependencies ?? []).some((dependency) => snapshotChain.some((source) => sameCanonical(dependency, captureScope3(source))));
}
function readPrivacyMode(payload) {
  const value = requireOwnDataField(payload, "privacyMode");
  if (value !== "full" && value !== "metadata")
    throw new TypeError("Stored privacy mode is invalid");
  return value;
}
function storedRun(payload, runId) {
  const run = canonicalJsonValue(requireOwnDataField(payload, "run"));
  const source = requirePlainRecord(run, "Stored run snapshot");
  if (source["id"] !== runId)
    throw new TypeError("Stored run ID does not match its capture");
  requireNonBlankString(source["name"], "Run name");
  requireNonBlankString(source["run_type"], "Run type");
  return source;
}
function storedRedactedFields(payload) {
  const field2 = ownDataField(payload, "redactedFields");
  return normalizedRedactedFields(field2.present ? field2.value : void 0);
}
function storedPrivacyStatus(payload, run, privacyMode) {
  if (privacyMode === "metadata")
    return readPrivacyStatus(requireOwnDataField(payload, "privacyContext"));
  return runPrivacyStatus(run);
}
function readPrivacyStatus(value) {
  const context = requirePlainRecord(value, "Run privacy context");
  const status = requireOwnDataField(context, "status");
  if (status !== "running" && status !== "completed" && status !== "error") {
    throw new TypeError("Invalid run privacy status");
  }
  return status;
}
function runPrivacyStatus(run) {
  if (run.error !== void 0)
    return "error";
  if (run.end_time !== void 0)
    return "completed";
  return "running";
}
function applySnapshotOmissions(current, previous, sourceRun) {
  const result = { ...current };
  const resultFields = result;
  const previousFields = previous;
  for (const field2 of LIFECYCLE_SNAPSHOT_OPTIONAL_RUN_FIELDS) {
    const supplied = ownDataField(sourceRun, field2);
    if (supplied.present && supplied.value !== void 0)
      continue;
    const oldValue = ownDataField(previousFields, field2);
    if (oldValue.present)
      resultFields[field2] = oldValue.value;
    else
      delete resultFields[field2];
  }
  return result;
}
function snapshotPatchFields(previous, current) {
  const previousFields = previous;
  const currentFields = current;
  return [...UPLOAD_PATCH_FIELDS].filter((field2) => {
    const oldValue = ownDataField(previousFields, field2);
    const nextValue = ownDataField(currentFields, field2);
    if (oldValue.present !== nextValue.present)
      return true;
    return oldValue.present && nextValue.present && !sameCanonical(oldValue.value, nextValue.value);
  });
}
function sameRunIdentity(left, right) {
  return left.id === right.id && left.name === right.name && left.run_type === right.run_type && sameTimestamp(left.start_time, right.start_time) && left.parent_run_id === right.parent_run_id && left.trace_id === right.trace_id && left.dotted_order === right.dotted_order;
}
function sameTimestamp(left, right) {
  if (left === void 0 || right === void 0)
    return left === right;
  return new Date(left).getTime() === new Date(right).getTime();
}
function runContext(record) {
  const run = storedRun(payloadObject(record), record.runId);
  return {
    id: run.id,
    name: run.name,
    run_type: run.run_type,
    ...run.start_time === void 0 ? {} : { start_time: run.start_time },
    ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
    ...run.trace_id === void 0 ? {} : { trace_id: run.trace_id },
    ...run.dotted_order === void 0 ? {} : { dotted_order: run.dotted_order }
  };
}
function sameDependencies(record, previous) {
  const dependencies = record.dependencies ?? [];
  return dependencies.some((dependency) => sameCanonical(dependency, captureScope3(previous)));
}
function captureScope3(record) {
  return {
    integration: record.integration,
    sessionId: record.sessionId,
    turnId: record.turnId,
    eventId: record.eventId
  };
}
function sameCanonical(left, right) {
  return JSON.stringify(canonicalJsonValue(left)) === JSON.stringify(canonicalJsonValue(right));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/bridge.js
function createLifecycleBridge(options) {
  const integration = options.integration;
  const wake = options.wake;
  const sessionId = requireNonBlankString(options.sessionId, "Session ID");
  const storageRoot = resolve11(options.storageRoot);
  const captureStore = createCaptureStore(storageRoot);
  const coordinator = createDeliveryCoordinator({
    storageRoot,
    integration,
    sessionId,
    ...options.policy === void 0 ? {} : { policy: options.policy }
  });
  const writer = createLangSmithUploadWriter(options.writer);
  const capture = async (input) => {
    const captureRecord = requirePlainRecord(snapshotData(requirePlainRecord(input, "Lifecycle capture")), "Lifecycle capture");
    const turnId = requireNonBlankString(captureRecord["turnId"], "Turn ID");
    const eventId = requireNonBlankString(captureRecord["eventId"], "Event ID");
    const sourceAge = ownDataField(captureRecord, "sourceAgeStartedAtMs");
    const sourceAgeStartedAtMs = sourceAge.present ? requireSafeEpochMilliseconds(sourceAge.value, "Source age") : void 0;
    const priorAttempts = ownDataField(captureRecord, "priorDeliveryAttempts");
    const priorDeliveryAttempts = priorAttempts.present ? requireNonNegativeInteger(priorAttempts.value, "Prior delivery attempts") : void 0;
    const scope = { integration, sessionId, turnId, eventId };
    const previous = await captureStore.read(scope);
    const projected = projectSubmission(captureRecord["submission"], integration, previous === void 0 ? void 0 : previousRunContext(previous));
    if (projected.status === "deferred") {
      return { status: "deferred", reason: "missing-thread-identity" };
    }
    const turnEvidence = projectTurnEvidence(captureRecord["turnEvidence"], projected.value.payload.privacyMode, deriveAttributionReadiness(captureRecord["submission"], integration));
    const dependencies = captureRecord["dependencies"];
    const identityPresence = projected.value.payload.operation === "post" ? suppliedRunIdentityFields(captureRecord["submission"]) : void 0;
    const captureProjected = (value) => coordinator.capture({
      turnId,
      eventId,
      runId: value.payload.run.id,
      destinationFingerprint: writer.accountFingerprint,
      eventKind: value.payload.operation === "post" ? LIFECYCLE_POST_EVENT_KIND : LIFECYCLE_PATCH_EVENT_KIND,
      normalizedPayload: canonicalJsonValue(value.payload),
      turnEvidence,
      metadataProvenance: canonicalJsonValue(value.metadata),
      ...sourceAgeStartedAtMs === void 0 ? {} : { sourceAgeStartedAtMs },
      ...priorDeliveryAttempts === void 0 ? {} : { priorDeliveryAttempts },
      ...dependencies === void 0 ? {} : { dependencies }
    });
    let result = await captureProjected(projected.value);
    if (result.status === "conflict" && previous === void 0 && identityPresence !== void 0 && projected.value.payload.operation === "post") {
      const winner = await captureStore.read(scope);
      if (winner?.runId === projected.value.payload.run.id) {
        const run = { ...projected.value.payload.run };
        if (!identityPresence.startTime)
          delete run.start_time;
        if (!identityPresence.traceId)
          delete run.trace_id;
        if (!identityPresence.dottedOrder)
          delete run.dotted_order;
        const retry = projectSubmission({ ...projected.value.payload, run, metadata: projected.value.metadata }, integration, previousRunContext(winner));
        if (retry.status === "ready")
          result = await captureProjected(retry.value);
      }
    }
    if (result.status === "published" || result.status === "duplicate")
      await wakeCapturedWork(result, () => wake?.());
    return result;
  };
  return Object.freeze({
    accountFingerprint: writer.accountFingerprint,
    capture,
    captureSnapshot(input) {
      return captureLifecycleSnapshot({
        storageRoot,
        integration,
        sessionId,
        destinationFingerprint: writer.accountFingerprint,
        store: captureStore,
        capture,
        wake: async () => wake?.()
      }, input);
    },
    async drain(input = {}) {
      const settlementLockDirectory = await ensurePrivateDirectory(storageRoot, [
        LIFECYCLE_SETTLEMENT_LOCK_DIRECTORY,
        LIFECYCLE_SETTLEMENT_LOCK_INTEGRATIONS_DIRECTORY,
        integration,
        LIFECYCLE_SETTLEMENT_LOCK_SESSIONS_DIRECTORY,
        identifierHash(sessionId),
        LIFECYCLE_SETTLEMENT_LOCK_ACCOUNTS_DIRECTORY,
        identifierHash(writer.accountFingerprint)
      ]);
      const settlementLock = await tryAcquireFileLock(join16(settlementLockDirectory, LIFECYCLE_SETTLEMENT_LOCK_FILE));
      if (settlementLock === void 0)
        return { status: "busy", settlement: { captured: 0, turns: [] } };
      let drainResult;
      try {
        const drainOnce = async () => {
          const sourceSnapshot = (await captureStore.enumerate(integration, sessionId)).map(({ record }) => record);
          const sourceByScope = indexCaptureSources(sourceSnapshot);
          return coordinator.drain({
            writer: {
              accountFingerprint: writer.accountFingerprint,
              destinations: writer.destinations,
              async send(record, destination, fingerprint2) {
                if (fingerprint2 !== writer.accountFingerprint)
                  throw new Error("Upload account changed");
                const submission = restoreSubmission(record, integration);
                const outgoing = await withholdUnresolvedEndTime({
                  record,
                  submission,
                  sourceSnapshot,
                  sourceByScope,
                  integration,
                  destinations: writer.destinations,
                  readOutcome: (scope, destinationId) => captureStore.readOutcome(scope, destinationId)
                });
                await writer.send(outgoing, destination.id);
              }
            },
            ...input.now === void 0 ? {} : { now: input.now }
          });
        };
        const first = await drainOnce();
        if (first.status === "busy")
          return { status: "busy", settlement: { captured: 0, turns: [] } };
        const readOutcome = (scope, destination) => captureStore.readOutcome(scope, destination);
        const work = await settleCapturedTurns({
          captures: await captureStore.enumerate(integration, sessionId),
          integration,
          sessionId,
          destinationFingerprint: writer.accountFingerprint,
          destinations: writer.destinations,
          capture: (captureInput) => coordinator.capture(captureInput),
          readOutcome
        });
        let result = first;
        if (work.progress.captured > 0) {
          const second = await drainOnce();
          if (second.status === "drained") {
            result = {
              status: "drained",
              delivered: first.delivered + second.delivered,
              dropped: first.dropped + second.dropped,
              failed: first.failed + second.failed,
              pending: second.pending,
              accountMismatch: second.accountMismatch
            };
          }
        }
        const settlement = await refreshSettlementProgress(work, writer.destinations, readOutcome);
        drainResult = { ...result, settlement };
      } finally {
        await settlementLock.release();
      }
      if (drainResult.status === "drained" && drainResult.delivered + drainResult.dropped > 0) {
        await wake?.();
      }
      return drainResult;
    }
  });
}
function suppliedRunIdentityFields(value) {
  const source = requirePlainRecord(value, "Prepared run submission");
  const run = requirePlainRecord(requireOwnDataField(source, "run"), "Normalized run snapshot");
  const supplied = (key) => {
    const field2 = ownDataField(run, key);
    return field2.present && field2.value !== void 0;
  };
  return {
    startTime: supplied("start_time"),
    traceId: supplied("trace_id"),
    dottedOrder: supplied("dotted_order")
  };
}
function previousRunContext(record) {
  const payload = requirePlainRecord(record.normalizedPayload, "Stored run payload");
  const runField = ownDataField(payload, "run");
  if (!runField.present)
    throw new TypeError("Stored run context is required");
  const run = requirePlainRecord(runField.value, "Stored run context");
  const context = {
    id: requireNonBlankString(run["id"], "Run ID"),
    name: requireNonBlankString(run["name"], "Run name"),
    run_type: requireNonBlankString(run["run_type"], "Run type")
  };
  const startTime = ownDataField(run, "start_time");
  if (startTime.present && startTime.value !== void 0)
    context.start_time = requireTimestamp(startTime.value);
  const parentRunId = ownDataField(run, "parent_run_id");
  if (parentRunId.present && parentRunId.value !== void 0) {
    context.parent_run_id = requireNonBlankString(parentRunId.value, "Parent run ID");
  }
  const traceId = ownDataField(run, "trace_id");
  if (traceId.present && traceId.value !== void 0) {
    context.trace_id = requireNonBlankString(traceId.value, "Trace ID");
  }
  const dottedOrder = ownDataField(run, "dotted_order");
  if (dottedOrder.present && dottedOrder.value !== void 0) {
    context.dotted_order = requireNonBlankString(dottedOrder.value, "Dotted order");
  }
  return context;
}
function restoreSubmission(record, integration) {
  const payload = canonicalJsonObject(record.normalizedPayload, "Stored run payload");
  if (payload["integration"] !== integration)
    throw new TypeError("Stored integration does not match the lifecycle bridge");
  if (payload["run"] === null || typeof payload["run"] !== "object") {
    throw new TypeError("Stored run data is required");
  }
  const run = payload["run"];
  if (run["id"] !== record.runId)
    throw new TypeError("Stored run ID does not match its capture");
  const mode = payload["privacyMode"];
  if (mode !== "full" && mode !== "metadata")
    throw new TypeError("Stored privacy mode is invalid");
  const projected = projectSubmission({ ...payload, metadata: record.metadataProvenance }, integration);
  if (projected.status === "deferred")
    throw new TypeError("Stored capture is missing thread identity");
  return { ...projected.value.payload, metadata: projected.value.metadata };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/reconstruction/worker.js
import { join as join17, resolve as resolve12 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/reconstruction/constants.js
var RECONSTRUCTION_DIRECTORY = "reconstruction-v1";
var RECONSTRUCTION_WORKER_DIRECTORY = "workers";
var RECONSTRUCTION_SESSIONS_DIRECTORY = "sessions";
var RECONSTRUCTION_DRAIN_LOCK = "drain";
var RECONSTRUCTION_RUN_ID_PREFIX = "reconstruction:";
var RECONSTRUCTION_MAPPING_EVENT_ID_PREFIX = "reconstruction-map:";
var RECONSTRUCTION_JOB_KIND = "reconstruction-job-v1";
var RECONSTRUCTION_MAPPING_KIND = "reconstruction-map-v1";
var RECONSTRUCTION_RECORD_VERSION = 1;
var RECONSTRUCTION_DEFERRED_REASON = "missing-thread-identity";
var RECONSTRUCTION_CLOSURE_STATES = ["open", "provisional", "authoritative"];
var RECONSTRUCTION_JOB_INPUT_KEYS = [
  "eventId",
  "privacyMode",
  "sourceRefs",
  "turnEvidence",
  "turnId"
];
var RECONSTRUCTION_JOB_OPTIONAL_INPUT_KEYS = [
  "sourceAgeStartedAtMs",
  "sourceSnapshots"
];
var RECONSTRUCTION_SOURCE_SNAPSHOT_KEYS = [
  "sourceAgeStartedAtMs",
  "sourceRef",
  "submission"
];
var RECONSTRUCTION_SOURCE_SNAPSHOT_OPTIONAL_KEYS = ["attributionContext"];
var RECONSTRUCTION_STORED_JOB_KEYS = [
  "privacyMode",
  "recordVersion",
  "sourceRefs"
];
var RECONSTRUCTION_STORED_JOB_OPTIONAL_KEYS = [
  "sourceAgeStartedAtMs",
  "sourceSnapshots"
];
var RECONSTRUCTION_ATTRIBUTION_CONTEXT_KEYS = ["toolOrigin"];
var RECONSTRUCTION_ATTRIBUTION_CONTEXT_OPTIONAL_KEYS = ["pinnedRepositoryKeys"];
var RECONSTRUCTION_TOOL_ORIGIN_KEYS = ["namedAPath"];
var RECONSTRUCTION_TOOL_ORIGIN_OPTIONAL_KEYS = ["cwd", "path"];
var RECONSTRUCTION_OUTPUT_KEYS = ["eventId", "submission"];
var RECONSTRUCTION_OUTPUT_OPTIONAL_KEYS = [
  "dependencies",
  "sourceRef",
  "turnEvidence"
];
var RECONSTRUCTION_TURN_EVIDENCE_KEYS = ["childRunIds", "closureState"];
var RECONSTRUCTION_TURN_EVIDENCE_KEYS_WITH_ROOT = [
  "childRunIds",
  "closureState",
  "rootRunId"
];
var RECONSTRUCTION_DEPENDENCY_KEYS = [
  "eventId",
  "integration",
  "sessionId",
  "turnId"
];

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/reconstruction/worker.js
function createReconstructionWorker(options) {
  const integration = options.integration;
  const sessionId = requireNonBlankString(options.sessionId, "Session ID");
  const accountFingerprint = requireNonBlankString(options.bridge.accountFingerprint, "Account fingerprint");
  const bridge = Object.freeze({ accountFingerprint, capture: options.bridge.capture });
  const reconstruct = options.reconstruct;
  if (typeof bridge.capture !== "function" || typeof reconstruct !== "function")
    throw new TypeError("Reconstruction callbacks are required");
  validateIntegration(integration);
  validateIdentifier(sessionId, "session ID");
  validateIdentifier(accountFingerprint, "account fingerprint");
  const policy = resolvePolicy2(options.policy);
  const storageRoot = join17(resolve12(options.storageRoot), RECONSTRUCTION_DIRECTORY);
  const captureStore = createCaptureStore(storageRoot);
  const attemptStore = createDeliveryAttemptStore(storageRoot);
  return {
    async enqueue(input) {
      const job = validateJobInput(input, integration, sessionId, accountFingerprint);
      return captureStore.capture(jobRecord(job));
    },
    async readSavedWake(error2, input) {
      const job = validateJobInput(input, integration, sessionId, accountFingerprint);
      const expected = jobRecord(job);
      const saved = await readSavedCaptureWake(error2, {
        store: captureStore,
        integration,
        sessionId,
        turnId: job.turnId,
        destinationFingerprint: accountFingerprint,
        eventId: job.eventId,
        runId: expected.runId
      });
      if (saved === void 0)
        return void 0;
      return canonicalJson(saved.record) === canonicalJson({
        ...expected,
        version: saved.record.version,
        capturedAtMs: saved.record.capturedAtMs
      }) ? saved : void 0;
    },
    async drain(request = {}) {
      const now = request.now ?? Date.now();
      if (!Number.isFinite(now))
        throw new RangeError("Drain time must be finite");
      const lockDirectory = await ensurePrivateDirectory(storageRoot, [
        RECONSTRUCTION_WORKER_DIRECTORY,
        integration,
        RECONSTRUCTION_SESSIONS_DIRECTORY,
        identifierHash(sessionId)
      ]);
      const lock = await tryAcquireFileLock(join17(lockDirectory, RECONSTRUCTION_DRAIN_LOCK));
      if (!lock)
        return { status: "busy" };
      const counts = { captured: 0, deferred: 0, failed: 0, dropped: 0 };
      try {
        const entries = await captureStore.enumerate(integration, sessionId);
        const candidates = [];
        for (const entry of entries) {
          if (entry.record.eventKind === RECONSTRUCTION_MAPPING_KIND) {
            readMapping(entry.record);
            continue;
          }
          if (entry.record.eventKind !== RECONSTRUCTION_JOB_KIND)
            throw new Error("Unsupported reconstruction record");
          const job = readJob(entry.record, integration);
          const scope = scopeOf2(entry.record);
          const outcome = await captureStore.readOutcome(scope, job.accountFingerprint);
          if (outcome.status === "failed")
            throw new Error(outcome.message);
          if (outcome.status === "missing-capture")
            throw new Error("Reconstruction job disappeared");
          if (outcome.status === "settled")
            continue;
          if (job.accountFingerprint !== accountFingerprint)
            continue;
          if (now - jobAgeStartedAtMs(job, entry.capturedAtMs) >= policy.maxAgeMs) {
            counts.dropped += Number(await recordTerminal(captureStore, scope, job.accountFingerprint, "dropped", DELIVERY_EXPIRED_REASON));
            continue;
          }
          candidates.push({ entry, job, scope });
        }
        const overCapacity = Math.max(0, candidates.length - policy.maxEntries);
        for (const candidate of candidates.slice(0, overCapacity)) {
          counts.dropped += Number(await recordTerminal(captureStore, candidate.scope, candidate.job.accountFingerprint, "dropped", DELIVERY_CAPACITY_REASON));
        }
        for (const candidate of candidates.slice(overCapacity)) {
          const result = await processJob(candidate.job, candidate.entry.capturedAtMs, candidate.scope, reconstruct, bridge, captureStore, attemptStore, policy.maxAttempts, counts);
          if (result === "deferred")
            counts.deferred += 1;
        }
      } finally {
        await lock.release();
      }
      const finalEntries = await captureStore.enumerate(integration, sessionId);
      let pending = 0;
      let accountMismatch = 0;
      for (const entry of finalEntries) {
        if (entry.record.eventKind !== RECONSTRUCTION_JOB_KIND)
          continue;
        const job = readJob(entry.record, integration);
        const outcome = await captureStore.readOutcome(scopeOf2(entry.record), job.accountFingerprint);
        if (outcome.status === "failed")
          throw new Error(outcome.message);
        if (outcome.status !== "settled") {
          pending += 1;
          if (job.accountFingerprint !== accountFingerprint)
            accountMismatch += 1;
        }
      }
      return { status: "drained", ...counts, pending, accountMismatch };
    }
  };
}
async function processJob(job, jobCapturedAtMs, scope, reconstruct, bridge, store, attempts, maxAttempts, counts) {
  const attemptCount = await attempts.count(scope, job.accountFingerprint);
  if (attemptCount >= maxAttempts) {
    counts.dropped += Number(await recordTerminal(store, scope, job.accountFingerprint, "dropped", DELIVERY_RETRY_EXHAUSTED_REASON));
    return "complete";
  }
  let interpretation;
  try {
    const result = requirePlainRecord(await reconstruct(snapshotJob(job)), "Reconstruction result");
    const status = requireOwnDataField(result, "status");
    if (status === "deferred") {
      if (requireOwnDataField(result, "reason") !== RECONSTRUCTION_DEFERRED_REASON)
        throw new TypeError("Invalid reconstruction deferral reason");
      return "deferred";
    }
    if (status !== "ready")
      throw new TypeError("Invalid reconstruction result status");
    interpretation = {
      status,
      outputs: requireOwnDataField(result, "outputs")
    };
  } catch {
    await recordFailure2(store, attempts, scope, job.accountFingerprint, maxAttempts, counts);
    return "complete";
  }
  let outputs;
  try {
    outputs = validateOutputs(interpretation.outputs, job, jobCapturedAtMs);
    if (outputs.length === 0)
      throw new TypeError("Reconstruction produced no captures");
  } catch {
    await recordFailure2(store, attempts, scope, job.accountFingerprint, maxAttempts, counts);
    return "complete";
  }
  const mappingInput = mappingRecord(job, outputs);
  const mappingResult = await store.capture(mappingInput);
  if (mappingResult.status !== "published" && mappingResult.status !== "duplicate") {
    await recordFailure2(store, attempts, scope, job.accountFingerprint, maxAttempts, counts);
    return "complete";
  }
  const storedMapping = readMapping(mappingResult.record);
  if (storedMapping.jobEventId !== job.eventId || !sameOutputMapping(storedMapping, outputs)) {
    await recordFailure2(store, attempts, scope, job.accountFingerprint, maxAttempts, counts);
    return "complete";
  }
  for (const output of outputs) {
    const evidence = output.turnEvidence ?? job.turnEvidence;
    const turnEvidence = {
      ...evidence.rootRunId === void 0 ? {} : { rootRunId: evidence.rootRunId },
      childRunIds: [...evidence.childRunIds],
      closureState: evidence.closureState
    };
    const captureInput = {
      turnId: job.turnId,
      eventId: output.eventId,
      submission: output.submission,
      turnEvidence,
      ...output.dependencies === void 0 ? {} : { dependencies: output.dependencies },
      ...output.sourceAgeStartedAtMs === void 0 ? {} : { sourceAgeStartedAtMs: output.sourceAgeStartedAtMs }
    };
    let captureStatus;
    try {
      captureStatus = requireOwnDataField(requirePlainRecord(await bridge.capture(captureInput), "Lifecycle capture result"), "status");
    } catch {
      await recordFailure2(store, attempts, scope, job.accountFingerprint, maxAttempts, counts);
      return "complete";
    }
    if (captureStatus === "deferred")
      return "deferred";
    if (captureStatus !== "published" && captureStatus !== "duplicate") {
      await recordFailure2(store, attempts, scope, job.accountFingerprint, maxAttempts, counts);
      return "complete";
    }
    if (captureStatus === "published")
      counts.captured += 1;
  }
  await recordTerminal(store, scope, job.accountFingerprint, "delivered");
  return "complete";
}
async function recordFailure2(store, attempts, scope, accountFingerprint, maxAttempts, counts) {
  const nextAttempt = await attempts.count(scope, accountFingerprint) + 1;
  await attempts.record(scope, accountFingerprint, nextAttempt, (/* @__PURE__ */ new Date()).toISOString());
  counts.failed += 1;
  if (nextAttempt >= maxAttempts) {
    counts.dropped += Number(await recordTerminal(store, scope, accountFingerprint, "dropped", DELIVERY_RETRY_EXHAUSTED_REASON));
  }
}
async function recordTerminal(store, scope, accountFingerprint, outcome, reason) {
  const result = await store.recordOutcome({
    ...scope,
    destination: accountFingerprint,
    outcome,
    ...outcome === "dropped" ? { reason: reason ?? DELIVERY_RETRY_EXHAUSTED_REASON } : {}
  });
  if (result.status !== "recorded" && result.status !== "duplicate")
    throw new Error(`Could not record terminal reconstruction outcome: ${result.status}`);
  return result.status === "recorded";
}
function snapshotJob(job) {
  return Object.freeze({
    ...job,
    sourceRefs: Object.freeze([...job.sourceRefs]),
    ...job.sourceSnapshots === void 0 ? {} : {
      sourceSnapshots: Object.freeze(job.sourceSnapshots.map((snapshot) => Object.freeze({
        ...snapshot,
        submission: snapshotData(snapshot.submission),
        ...snapshot.attributionContext === void 0 ? {} : {
          attributionContext: Object.freeze({
            toolOrigin: Object.freeze({ ...snapshot.attributionContext.toolOrigin }),
            ...snapshot.attributionContext.pinnedRepositoryKeys === void 0 ? {} : {
              pinnedRepositoryKeys: Object.freeze([
                ...snapshot.attributionContext.pinnedRepositoryKeys
              ])
            }
          })
        }
      })))
    },
    turnEvidence: Object.freeze({
      ...job.turnEvidence.rootRunId === void 0 ? {} : { rootRunId: job.turnEvidence.rootRunId },
      childRunIds: Object.freeze([...job.turnEvidence.childRunIds]),
      closureState: job.turnEvidence.closureState
    })
  });
}
function jobAgeStartedAtMs(job, capturedAtMs) {
  if (job.sourceSnapshots !== void 0) {
    return Math.max(...job.sourceSnapshots.map(({ sourceAgeStartedAtMs }) => sourceAgeStartedAtMs));
  }
  return job.sourceAgeStartedAtMs ?? capturedAtMs;
}
function resolvePolicy2(policy) {
  const resolved = {
    maxAttempts: policy?.maxAttempts ?? DELIVERY_DEFAULT_MAX_ATTEMPTS,
    maxAgeMs: policy?.maxAgeMs ?? DELIVERY_DEFAULT_MAX_AGE_MS,
    maxEntries: policy?.maxEntries ?? DELIVERY_DEFAULT_MAX_ENTRIES
  };
  if (!Number.isSafeInteger(resolved.maxAttempts) || resolved.maxAttempts <= 0 || !Number.isSafeInteger(resolved.maxAgeMs) || resolved.maxAgeMs <= 0 || !Number.isSafeInteger(resolved.maxEntries) || resolved.maxEntries <= 0) {
    throw new TypeError("Invalid delivery policy");
  }
  return resolved;
}
function validateOutputs(value, job, jobCapturedAtMs) {
  if (!Array.isArray(value))
    throw new TypeError("Reconstruction outputs must be an array");
  const seen = /* @__PURE__ */ new Set();
  return value.map((item) => {
    const output = requirePlainRecord(item, "Reconstruction output");
    const outputKeys = Object.keys(output).toSorted();
    if (RECONSTRUCTION_OUTPUT_KEYS.some((key) => !outputKeys.includes(key)) || outputKeys.some((key) => !RECONSTRUCTION_OUTPUT_KEYS.includes(key) && !RECONSTRUCTION_OUTPUT_OPTIONAL_KEYS.includes(key))) {
      throw new TypeError("Reconstruction output has unsupported fields");
    }
    const eventId = requireNonBlankString(requireOwnDataField(output, "eventId"), "Event ID");
    validateIdentifier(eventId, "event ID");
    if (seen.has(eventId))
      throw new TypeError("Reconstruction event IDs must be unique");
    seen.add(eventId);
    const submissionValue = canonicalJsonObject(requirePlainRecord(requireOwnDataField(output, "submission"), "Reconstruction submission"), "Reconstruction submission");
    const integration = requireNonBlankString(requireOwnDataField(submissionValue, "integration"), "Integration");
    if (integration !== job.integration)
      throw new TypeError("Reconstruction integration changed");
    const privacyMode = requireOwnDataField(submissionValue, "privacyMode");
    if (privacyMode !== "full" && privacyMode !== "metadata")
      throw new TypeError("Reconstruction privacy mode is invalid");
    if (job.privacyMode === "metadata" && privacyMode === "full")
      throw new TypeError("Metadata reconstruction cannot emit full-mode captures");
    const run = requirePlainRecord(requireOwnDataField(submissionValue, "run"), "Run");
    const runId = requireNonBlankString(requireOwnDataField(run, "id"), "Run ID");
    validateIdentifier(runId, "run ID");
    const dependenciesValue = ownDataField(output, "dependencies");
    let dependencies;
    if (dependenciesValue.present) {
      if (!Array.isArray(dependenciesValue.value))
        throw new TypeError("Reconstruction dependencies must be an array");
      dependencies = validateDependencies(dependenciesValue.value, job, eventId);
    }
    const sourceRefField = ownDataField(output, "sourceRef");
    const evidenceField = ownDataField(output, "turnEvidence");
    const turnEvidence = evidenceField.present ? validateTurnEvidence(evidenceField.value) : void 0;
    if (turnEvidence !== void 0 && (job.turnEvidence.rootRunId !== void 0 && turnEvidence.rootRunId !== job.turnEvidence.rootRunId || job.turnEvidence.childRunIds.some((id) => !turnEvidence.childRunIds.includes(id)))) {
      throw new TypeError("Reconstructed turn evidence must preserve known run identities");
    }
    let sourceRef;
    let sourceAgeStartedAtMs;
    if (sourceRefField.present) {
      sourceRef = requireNonBlankString(sourceRefField.value, "Source ref");
      validateIdentifier(sourceRef, "source ref");
    }
    if (job.sourceSnapshots !== void 0) {
      if (sourceRef === void 0)
        throw new TypeError("Snapshot outputs require a source ref");
      const snapshot = job.sourceSnapshots.find((candidate) => candidate.sourceRef === sourceRef);
      if (snapshot === void 0)
        throw new TypeError("Output source ref has no snapshot");
      sourceAgeStartedAtMs = snapshot.sourceAgeStartedAtMs;
    } else if (sourceRef !== void 0) {
      if (!job.sourceRefs.includes(sourceRef))
        throw new TypeError("Output source ref is not in the reconstruction job");
      sourceAgeStartedAtMs = job.sourceAgeStartedAtMs ?? jobCapturedAtMs;
    } else {
      sourceAgeStartedAtMs = job.sourceAgeStartedAtMs ?? jobCapturedAtMs;
    }
    return {
      eventId,
      runId,
      submission: submissionValue,
      ...turnEvidence === void 0 ? {} : { turnEvidence },
      ...sourceRef === void 0 ? {} : { sourceRef },
      ...sourceAgeStartedAtMs === void 0 ? {} : { sourceAgeStartedAtMs },
      ...dependencies === void 0 ? {} : { dependencies }
    };
  });
}
function validateDependencies(value, job, eventId) {
  if (!Array.isArray(value))
    throw new TypeError("Reconstruction dependencies must be an array");
  const dependent = { ...scopeOf2(job), eventId };
  const seen = /* @__PURE__ */ new Set();
  return value.map((item) => {
    const source = requirePlainRecord(item, "Reconstruction dependency");
    const keys = Object.keys(source).toSorted();
    if (canonicalJson(keys) !== canonicalJson(RECONSTRUCTION_DEPENDENCY_KEYS))
      throw new TypeError("Reconstruction dependencies must contain only capture scopes");
    const integration = requireNonBlankString(requireOwnDataField(source, "integration"), "Dependency integration");
    if (integration !== job.integration)
      throw new TypeError("Reconstruction dependencies must use the same integration");
    const scope = {
      integration,
      sessionId: requireNonBlankString(requireOwnDataField(source, "sessionId"), "Dependency session ID"),
      turnId: requireNonBlankString(requireOwnDataField(source, "turnId"), "Dependency turn ID"),
      eventId: requireNonBlankString(requireOwnDataField(source, "eventId"), "Dependency event ID")
    };
    validateIdentifier(scope.sessionId, "dependency session ID");
    validateIdentifier(scope.turnId, "dependency turn ID");
    validateIdentifier(scope.eventId, "dependency event ID");
    if (scope.sessionId === dependent.sessionId && scope.turnId === dependent.turnId && scope.eventId === dependent.eventId) {
      throw new TypeError("Reconstruction captures cannot depend on themselves");
    }
    const key = canonicalJson(scope);
    if (seen.has(key))
      throw new TypeError("Reconstruction dependencies must be unique");
    seen.add(key);
    return scope;
  });
}
function validateJobInput(value, integration, sessionId, accountFingerprint) {
  const input = requirePlainRecord(snapshotData(requirePlainRecord(value, "Reconstruction job")), "Reconstruction job");
  const keys = Object.keys(input).toSorted();
  if (RECONSTRUCTION_JOB_INPUT_KEYS.some((key) => !keys.includes(key)) || keys.some((key) => !RECONSTRUCTION_JOB_INPUT_KEYS.includes(key) && !RECONSTRUCTION_JOB_OPTIONAL_INPUT_KEYS.includes(key))) {
    throw new TypeError("Reconstruction job has unsupported fields");
  }
  const turnId = requireNonBlankString(requireOwnDataField(input, "turnId"), "Turn ID");
  const eventId = requireNonBlankString(requireOwnDataField(input, "eventId"), "Event ID");
  validateIdentifier(turnId, "turn ID");
  validateIdentifier(eventId, "event ID");
  const privacyMode = requireOwnDataField(input, "privacyMode");
  if (privacyMode !== "full" && privacyMode !== "metadata")
    throw new TypeError("Reconstruction privacy mode is invalid");
  const sourceRefs = requireStringArray(requireOwnDataField(input, "sourceRefs"), "Source refs");
  if (sourceRefs.length === 0)
    throw new TypeError("Reconstruction source refs are required");
  if (new Set(sourceRefs).size !== sourceRefs.length)
    throw new TypeError("Reconstruction source refs must be unique");
  for (const ref of sourceRefs) {
    requireNonBlankString(ref, "Source ref");
    validateIdentifier(ref, "source ref");
  }
  const turnEvidence = validateTurnEvidence(requireOwnDataField(input, "turnEvidence"));
  const sourceSnapshotsField = ownDataField(input, "sourceSnapshots");
  const sourceAgeField = ownDataField(input, "sourceAgeStartedAtMs");
  if (sourceSnapshotsField.present && sourceAgeField.present)
    throw new TypeError("Reconstruction jobs cannot combine snapshots with a job-level source age");
  const sourceAgeStartedAtMs = sourceAgeField.present ? requireSafeEpochMilliseconds(sourceAgeField.value, "Source age") : void 0;
  const sourceSnapshots = sourceSnapshotsField.present ? validateSourceSnapshots(sourceSnapshotsField.value, integration, privacyMode, sourceRefs) : void 0;
  return {
    integration,
    sessionId,
    turnId,
    eventId,
    accountFingerprint,
    sourceRefs,
    privacyMode,
    turnEvidence,
    ...sourceSnapshots === void 0 ? {} : { sourceSnapshots },
    ...sourceAgeStartedAtMs === void 0 ? {} : { sourceAgeStartedAtMs }
  };
}
function validateSourceSnapshots(value, integration, privacyMode, sourceRefs) {
  if (!Array.isArray(value) || value.length === 0)
    throw new TypeError("Reconstruction source snapshots must be a nonempty array");
  for (const ref of sourceRefs)
    validatePathlessSourceRef(ref);
  const seen = /* @__PURE__ */ new Set();
  const snapshots = value.map((item) => {
    const source = requirePlainRecord(item, "Reconstruction source snapshot");
    const keys = Object.keys(source).toSorted();
    if (RECONSTRUCTION_SOURCE_SNAPSHOT_KEYS.some((key) => !keys.includes(key)) || keys.some((key) => !RECONSTRUCTION_SOURCE_SNAPSHOT_KEYS.includes(key) && !RECONSTRUCTION_SOURCE_SNAPSHOT_OPTIONAL_KEYS.includes(key))) {
      throw new TypeError("Reconstruction source snapshot has unsupported fields");
    }
    const sourceRef = requireNonBlankString(requireOwnDataField(source, "sourceRef"), "Source ref");
    validatePathlessSourceRef(sourceRef);
    if (!sourceRefs.includes(sourceRef))
      throw new TypeError("Reconstruction snapshot ref must belong to the job");
    if (seen.has(sourceRef))
      throw new TypeError("Reconstruction snapshot refs must be unique");
    seen.add(sourceRef);
    const sourceAgeStartedAtMs = requireSafeEpochMilliseconds(requireOwnDataField(source, "sourceAgeStartedAtMs"), "Source age");
    const submission = canonicalJsonObject(requirePlainRecord(requireOwnDataField(source, "submission"), "Prepared submission"), "Prepared submission");
    if (requireOwnDataField(submission, "privacyMode") !== privacyMode)
      throw new TypeError("Snapshot privacy mode must match the reconstruction job");
    if (submission["operation"] === "post") {
      const run = requirePlainRecord(requireOwnDataField(submission, "run"), "Prepared run");
      if (!ownDataField(run, "start_time").present)
        throw new TypeError("Source snapshot posts must preserve their start time");
    }
    const projected = projectSubmission(submission, integration);
    if (projected.status !== "ready")
      throw new TypeError("Reconstruction snapshots must be ready for shared projection");
    const projectedSubmission = canonicalJsonObject({ ...projected.value.payload, metadata: projected.value.metadata }, "Projected submission");
    const attributionField = ownDataField(source, "attributionContext");
    const attributionContext = attributionField.present ? validateAttributionContext(attributionField.value, privacyMode) : void 0;
    return {
      sourceRef,
      submission: projectedSubmission,
      sourceAgeStartedAtMs,
      ...attributionContext === void 0 ? {} : { attributionContext }
    };
  });
  if (snapshots.length !== sourceRefs.length)
    throw new TypeError("Source snapshots must cover every reconstruction source ref");
  return snapshots;
}
function validatePathlessSourceRef(sourceRef) {
  validateIdentifier(sourceRef, "source ref");
  if (sourceRef.includes("/") || sourceRef.includes("\\"))
    throw new TypeError("Snapshot source refs must be pathless identifiers");
}
function validateAttributionContext(value, privacyMode) {
  const context = requirePlainRecord(value, "Attribution context");
  const keys = Object.keys(context).toSorted();
  if (RECONSTRUCTION_ATTRIBUTION_CONTEXT_KEYS.some((key) => !keys.includes(key)) || keys.some((key) => !RECONSTRUCTION_ATTRIBUTION_CONTEXT_KEYS.includes(key) && !RECONSTRUCTION_ATTRIBUTION_CONTEXT_OPTIONAL_KEYS.includes(key))) {
    throw new TypeError("Attribution context has unsupported fields");
  }
  const origin = requirePlainRecord(requireOwnDataField(context, "toolOrigin"), "Tool origin");
  const originKeys = Object.keys(origin).toSorted();
  if (RECONSTRUCTION_TOOL_ORIGIN_KEYS.some((key) => !originKeys.includes(key)) || originKeys.some((key) => !RECONSTRUCTION_TOOL_ORIGIN_KEYS.includes(key) && !RECONSTRUCTION_TOOL_ORIGIN_OPTIONAL_KEYS.includes(key))) {
    throw new TypeError("Tool origin has unsupported fields");
  }
  const namedAPath = requireBoolean(requireOwnDataField(origin, "namedAPath"), "namedAPath");
  const pathField = ownDataField(origin, "path");
  const cwdField = ownDataField(origin, "cwd");
  const pinnedField = ownDataField(context, "pinnedRepositoryKeys");
  const toolOrigin2 = privacyMode === "metadata" ? { namedAPath } : {
    ...pathField.present ? { path: requireNonBlankString(pathField.value, "Tool path") } : {},
    ...cwdField.present ? { cwd: requireNonBlankString(cwdField.value, "Tool cwd") } : {},
    namedAPath
  };
  let pinnedRepositoryKeys2;
  if (privacyMode === "full" && pinnedField.present) {
    pinnedRepositoryKeys2 = requireStringArray(pinnedField.value, "Pinned repository keys");
    if (pinnedRepositoryKeys2.some((key) => key.trim().length === 0))
      throw new TypeError("Pinned repository keys must be nonblank");
    if (new Set(pinnedRepositoryKeys2).size !== pinnedRepositoryKeys2.length)
      throw new TypeError("Pinned repository keys must be unique");
  }
  return {
    toolOrigin: toolOrigin2,
    ...pinnedRepositoryKeys2 === void 0 ? {} : { pinnedRepositoryKeys: pinnedRepositoryKeys2 }
  };
}
function validateTurnEvidence(value) {
  const evidence = requirePlainRecord(value, "Turn evidence");
  canonicalJson(evidence);
  const keys = Object.keys(evidence).toSorted();
  if (RECONSTRUCTION_TURN_EVIDENCE_KEYS.some((key) => !keys.includes(key)) || keys.some((key) => !RECONSTRUCTION_TURN_EVIDENCE_KEYS_WITH_ROOT.includes(key)))
    throw new TypeError("Reconstruction turn evidence must be structural only");
  const childRunIds = requireStringArray(requireOwnDataField(evidence, "childRunIds"), "Child run IDs");
  for (const childRunId of childRunIds) {
    requireNonBlankString(childRunId, "Child run ID");
    validateIdentifier(childRunId, "child run ID");
  }
  const rootRunIdField = ownDataField(evidence, "rootRunId");
  const rootRunId = rootRunIdField.present ? requireNonBlankString(rootRunIdField.value, "Root run ID") : void 0;
  if (rootRunId !== void 0)
    validateIdentifier(rootRunId, "root run ID");
  const closureState = requireOwnDataField(evidence, "closureState");
  if (typeof closureState !== "string" || !RECONSTRUCTION_CLOSURE_STATES.includes(closureState)) {
    throw new TypeError("Reconstruction turn evidence has an invalid closure state");
  }
  return {
    ...rootRunId === void 0 ? {} : { rootRunId },
    childRunIds,
    closureState
  };
}
function jobRecord(job) {
  const scope = scopeOf2(job);
  return {
    ...scope,
    runId: `${RECONSTRUCTION_RUN_ID_PREFIX}${identifierHash(canonicalJson(scope))}`,
    destinationFingerprint: job.accountFingerprint,
    eventKind: RECONSTRUCTION_JOB_KIND,
    normalizedPayload: canonicalValue({
      recordVersion: RECONSTRUCTION_RECORD_VERSION,
      privacyMode: job.privacyMode,
      sourceRefs: [...job.sourceRefs],
      ...job.sourceAgeStartedAtMs === void 0 ? {} : { sourceAgeStartedAtMs: job.sourceAgeStartedAtMs },
      ...job.sourceSnapshots === void 0 ? {} : {
        sourceSnapshots: job.sourceSnapshots.map((snapshot) => ({
          sourceRef: snapshot.sourceRef,
          submission: snapshot.submission,
          sourceAgeStartedAtMs: snapshot.sourceAgeStartedAtMs,
          ...snapshot.attributionContext === void 0 ? {} : { attributionContext: snapshot.attributionContext }
        }))
      }
    }, /* @__PURE__ */ new Set()),
    turnEvidence: canonicalValue(job.turnEvidence, /* @__PURE__ */ new Set()),
    metadataProvenance: {}
  };
}
function mappingRecord(job, outputs) {
  const scope = mappingScope(job);
  return {
    ...scope,
    runId: scope.eventId,
    destinationFingerprint: job.accountFingerprint,
    eventKind: RECONSTRUCTION_MAPPING_KIND,
    normalizedPayload: {
      recordVersion: RECONSTRUCTION_RECORD_VERSION,
      jobEventId: job.eventId,
      outputs: outputs.map(({ eventId, runId, dependencies, sourceRef, turnEvidence }) => ({
        eventId,
        runId,
        ...turnEvidence === void 0 ? {} : { turnEvidence: canonicalValue(turnEvidence, /* @__PURE__ */ new Set()) },
        ...sourceRef === void 0 ? {} : { sourceRef },
        ...dependencies === void 0 ? {} : {
          dependencies: dependencies.map((dependency) => ({
            integration: dependency.integration,
            sessionId: dependency.sessionId,
            turnId: dependency.turnId,
            eventId: dependency.eventId
          }))
        }
      }))
    },
    turnEvidence: canonicalValue(job.turnEvidence, /* @__PURE__ */ new Set()),
    metadataProvenance: {}
  };
}
function readJob(record, integration) {
  if (record.integration !== integration || record.eventKind !== RECONSTRUCTION_JOB_KIND)
    throw new Error("Stored reconstruction job namespace does not match");
  const payload = requirePlainRecord(record.normalizedPayload, "Stored reconstruction job");
  if (payload["recordVersion"] !== RECONSTRUCTION_RECORD_VERSION)
    throw new Error("Unsupported reconstruction job");
  const payloadKeys = Object.keys(payload).toSorted();
  if (RECONSTRUCTION_STORED_JOB_KEYS.some((key) => !payloadKeys.includes(key)) || payloadKeys.some((key) => !RECONSTRUCTION_STORED_JOB_KEYS.includes(key) && !RECONSTRUCTION_STORED_JOB_OPTIONAL_KEYS.includes(key)))
    throw new Error("Stored reconstruction job has unsupported fields");
  const privacyMode = payload["privacyMode"];
  if (privacyMode !== "full" && privacyMode !== "metadata")
    throw new Error("Invalid stored reconstruction privacy mode");
  const sourceRefs = requireStringArray(payload["sourceRefs"], "Stored source refs");
  if (sourceRefs.length === 0)
    throw new Error("Stored reconstruction source refs are empty");
  if (new Set(sourceRefs).size !== sourceRefs.length)
    throw new Error("Stored reconstruction source refs are not unique");
  for (const ref of sourceRefs) {
    requireNonBlankString(ref, "Stored source ref");
    validateIdentifier(ref, "source ref");
  }
  const sourceSnapshotsField = ownDataField(payload, "sourceSnapshots");
  const sourceAgeField = ownDataField(payload, "sourceAgeStartedAtMs");
  if (sourceSnapshotsField.present && sourceAgeField.present)
    throw new Error("Stored reconstruction job combines snapshots with a job-level source age");
  const sourceAgeStartedAtMs = sourceAgeField.present ? requireSafeEpochMilliseconds(sourceAgeField.value, "Stored source age") : void 0;
  const sourceSnapshots = sourceSnapshotsField.present ? validateSourceSnapshots(sourceSnapshotsField.value, integration, privacyMode, sourceRefs) : void 0;
  const turnEvidence = validateTurnEvidence(record.turnEvidence);
  if (Object.keys(requirePlainRecord(record.metadataProvenance, "Stored metadata provenance")).length > 0)
    throw new Error("Reconstruction jobs cannot store metadata provenance");
  if (record.dependencies !== void 0)
    throw new Error("Reconstruction jobs cannot have capture dependencies");
  return {
    integration,
    sessionId: record.sessionId,
    turnId: record.turnId,
    eventId: record.eventId,
    accountFingerprint: record.destinationFingerprint,
    sourceRefs,
    privacyMode,
    turnEvidence,
    ...sourceSnapshots === void 0 ? {} : { sourceSnapshots },
    ...sourceAgeStartedAtMs === void 0 ? {} : { sourceAgeStartedAtMs }
  };
}
function readMapping(record) {
  if (record.eventKind !== RECONSTRUCTION_MAPPING_KIND)
    throw new Error("Unsupported reconstruction mapping");
  const payload = requirePlainRecord(record.normalizedPayload, "Stored reconstruction mapping");
  if (payload["recordVersion"] !== RECONSTRUCTION_RECORD_VERSION)
    throw new Error("Unsupported reconstruction mapping");
  const jobEventId = requireNonBlankString(payload["jobEventId"], "Job event ID");
  const outputs = payload["outputs"];
  if (!Array.isArray(outputs) || outputs.length === 0)
    throw new Error("Stored reconstruction mapping has no outputs");
  const seen = /* @__PURE__ */ new Set();
  const normalizedOutputs = outputs.map((value) => {
    const output = requirePlainRecord(value, "Stored reconstruction output");
    const eventId = requireNonBlankString(output["eventId"], "Output event ID");
    const runId = requireNonBlankString(output["runId"], "Output run ID");
    validateIdentifier(eventId, "output event ID");
    validateIdentifier(runId, "output run ID");
    if (seen.has(eventId))
      throw new Error("Stored reconstruction event IDs are not unique");
    seen.add(eventId);
    const dependenciesField = ownDataField(output, "dependencies");
    const sourceRefField = ownDataField(output, "sourceRef");
    const evidenceField = ownDataField(output, "turnEvidence");
    const turnEvidence = evidenceField.present ? validateTurnEvidence(evidenceField.value) : void 0;
    let sourceRef;
    if (sourceRefField.present) {
      sourceRef = requireNonBlankString(sourceRefField.value, "Output source ref");
      validateIdentifier(sourceRef, "output source ref");
    }
    let dependencies;
    if (dependenciesField.present) {
      if (!Array.isArray(dependenciesField.value))
        throw new Error("Stored reconstruction dependencies are invalid");
      dependencies = dependenciesField.value;
    }
    return {
      eventId,
      runId,
      ...turnEvidence === void 0 ? {} : { turnEvidence },
      ...sourceRef === void 0 ? {} : { sourceRef },
      ...dependencies === void 0 ? {} : { dependencies }
    };
  });
  return { recordVersion: RECONSTRUCTION_RECORD_VERSION, jobEventId, outputs: normalizedOutputs };
}
function sameOutputMapping(mapping, outputs) {
  return canonicalJson(mapping.outputs) === canonicalJson(outputs.map(({ eventId, runId, dependencies, sourceRef, turnEvidence }) => ({
    eventId,
    runId,
    ...turnEvidence === void 0 ? {} : { turnEvidence },
    ...sourceRef === void 0 ? {} : { sourceRef },
    ...dependencies === void 0 ? {} : { dependencies }
  })));
}
function scopeOf2(value) {
  return {
    integration: value.integration,
    sessionId: value.sessionId,
    turnId: value.turnId,
    eventId: value.eventId
  };
}
function mappingScope(job) {
  const eventId = `${RECONSTRUCTION_MAPPING_EVENT_ID_PREFIX}${identifierHash(canonicalJson(scopeOf2(job)))}`;
  return { ...scopeOf2(job), eventId };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/utils/errors.js
function describe(error2) {
  return error2 instanceof Error ? error2.message : String(error2);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/pass-results.js
function reconstructionPassResult(result) {
  if (result.status === "busy")
    return "retryable-failure";
  return result.captured > 0 || result.failed > 0 || result.dropped > 0 ? "progressed" : "idle";
}
function lifecyclePassResult(result) {
  if (result.status === "busy")
    return "retryable-failure";
  return result.settlement.captured > 0 || result.delivered > 0 || result.dropped > 0 || result.failed > 0 ? "progressed" : "idle";
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/options.js
import { resolve as resolve13 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/constants.js
var TRACING_ENGINE_FOREIGN_SESSION_MIN_AGE_MS = 2 * 60 * 60 * 1e3;
var TRACING_ENGINE_BACKGROUND_RECOVERY_COOLDOWN_MS = 5 * 60 * 1e3;
var TRACING_ENGINE_BACKGROUND_RECOVERY_DIRECTORY = "background-recovery";
var TRACING_ENGINE_BACKGROUND_RECOVERY_INTEGRATIONS_DIRECTORY = "integrations";
var TRACING_ENGINE_BACKGROUND_RECOVERY_ACCOUNTS_DIRECTORY = "accounts";
var TRACING_ENGINE_BACKGROUND_RECOVERY_LOCK_FILE = "scan.lock";
var TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_FILE = "cooldown.json";
var TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_VERSION = 1;
var TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_EXISTS_ERROR = "Background recovery cooldown marker is already published";
var TRACING_ENGINE_BACKGROUND_RECOVERY_RETRY_RANGE_ERROR = "Background recovery retry time is outside the supported range";
var TRACING_ENGINE_BACKGROUND_RECOVERY_REPORT_ERROR = "Background recovery report callback failed";
var TRACING_ENGINE_BACKGROUND_RECOVERY_FILE_NOT_FOUND_CODE = "ENOENT";
var TRACING_ENGINE_BACKGROUND_RECOVERY_SESSION_CALLBACK_ERROR = "Background recovery session callback is required";
var TRACING_ENGINE_BACKGROUND_RECOVERY_REPORT_CALLBACK_ERROR = "Background recovery report callback is required";
var TRACING_ENGINE_BACKGROUND_RECOVERY_MINIMUM_AGE_ERROR = "Minimum foreign session age must be a non-negative integer";
var TRACING_ENGINE_BACKGROUND_RECOVERY_COOLDOWN_RANGE_ERROR = "Background recovery cooldown must be a positive integer";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/options.js
function snapshotEngineOptions(options) {
  return Object.freeze({
    ...options,
    storageRoot: resolve13(options.storageRoot),
    writer: snapshotWriterOptions(options.writer),
    ...options.policy === void 0 ? {} : { policy: snapshotPolicy(options.policy) }
  });
}
function snapshotSessionOptions(options) {
  if (options.backgroundRecovery !== void 0) {
    if (typeof options.backgroundRecovery.optionsForSession !== "function")
      throw new TypeError(TRACING_ENGINE_BACKGROUND_RECOVERY_SESSION_CALLBACK_ERROR);
    if (typeof options.backgroundRecovery.onReport !== "function")
      throw new TypeError(TRACING_ENGINE_BACKGROUND_RECOVERY_REPORT_CALLBACK_ERROR);
    if (options.backgroundRecovery.minimumForeignAgeMs !== void 0 && (!Number.isSafeInteger(options.backgroundRecovery.minimumForeignAgeMs) || options.backgroundRecovery.minimumForeignAgeMs < 0)) {
      throw new RangeError(TRACING_ENGINE_BACKGROUND_RECOVERY_MINIMUM_AGE_ERROR);
    }
    if (options.backgroundRecovery.cooldownMs !== void 0 && (!Number.isSafeInteger(options.backgroundRecovery.cooldownMs) || options.backgroundRecovery.cooldownMs < 1)) {
      throw new RangeError(TRACING_ENGINE_BACKGROUND_RECOVERY_COOLDOWN_RANGE_ERROR);
    }
  }
  return Object.freeze({
    ...options,
    ...options.retryPolicy === void 0 ? {} : { retryPolicy: Object.freeze({ ...options.retryPolicy }) },
    ...options.backgroundRecovery === void 0 ? {} : { backgroundRecovery: Object.freeze({ ...options.backgroundRecovery }) }
  });
}
function snapshotWriterOptions(options) {
  return Object.freeze({
    ...options,
    destinations: Object.freeze(options.destinations.map((destination) => Object.freeze({ ...destination }))),
    ...options.replicas === void 0 ? {} : {
      replicas: Object.freeze(options.replicas.map((replica) => Object.freeze({
        ...replica,
        ...replica.updates === void 0 ? {} : { updates: structuredClone(replica.updates) }
      })))
    },
    ...options.redactExtraRules === void 0 ? {} : {
      redactExtraRules: Object.freeze(options.redactExtraRules.map((rule) => Object.freeze({ ...rule })))
    }
  });
}
function snapshotPolicy(policy) {
  return Object.freeze({ ...policy });
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/recovery.js
import { join as join18 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/recovery-settlement.js
async function hasUnsettledRecoverySettlement(options) {
  const missingSettlementCapture = /* @__PURE__ */ Symbol();
  try {
    const work = await settleCapturedTurns({
      captures: options.captures,
      integration: options.integration,
      sessionId: options.sessionId,
      destinationFingerprint: options.destinationFingerprint,
      destinations: options.destinations,
      capture: async (input) => {
        const scope = {
          integration: options.integration,
          sessionId: options.sessionId,
          turnId: input.turnId,
          eventId: input.eventId
        };
        const existing = await options.store.read(scope);
        if (existing === void 0)
          throw missingSettlementCapture;
        const existingContent = Object.fromEntries(Object.entries(existing).filter(([key]) => key !== "capturedAtMs"));
        const plannedContent = {
          version: existing.version,
          integration: options.integration,
          sessionId: options.sessionId,
          ...input
        };
        if (canonicalJson(existingContent) !== canonicalJson(plannedContent))
          throw new Error("Recovery settlement capture conflicts with the current source state");
        return { status: "duplicate", record: existing };
      },
      readOutcome: (scope, destination) => options.store.readOutcome(scope, destination)
    });
    const progress = await refreshSettlementProgress(work, options.destinations, (scope, destination) => options.store.readOutcome(scope, destination));
    return progress.turns.some((turn) => turn.status !== "settled");
  } catch (error2) {
    if (error2 === missingSettlementCapture)
      return true;
    throw error2;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/recovery.js
async function recoverTracingSessions(runtime, request, scopeGuard) {
  const now = request.now ?? Date.now();
  if (!Number.isSafeInteger(now) || !Number.isFinite(new Date(now).getTime()))
    throw new RangeError("Recovery time must be a valid timestamp");
  const minimumForeignAgeMs = request.minimumForeignAgeMs ?? TRACING_ENGINE_FOREIGN_SESSION_MIN_AGE_MS;
  if (!Number.isSafeInteger(minimumForeignAgeMs) || minimumForeignAgeMs < 0)
    throw new RangeError("Minimum foreign session age must be a non-negative integer");
  if (typeof request.optionsForSession !== "function")
    throw new TypeError("Session recovery options callback is required");
  const optionsForSession = request.optionsForSession;
  const lifecycleStore = createCaptureStore(runtime.storageRoot);
  const reconstructionStore = createCaptureStore(join18(runtime.storageRoot, RECONSTRUCTION_DIRECTORY));
  const [lifecycleSessions, reconstructionSessions] = await Promise.all([
    lifecycleStore.enumerateSessions(runtime.integration),
    reconstructionStore.enumerateSessions(runtime.integration)
  ]);
  const writer = createLangSmithUploadWriter(runtime.writer);
  if (writer.accountFingerprint !== runtime.accountFingerprint)
    throw new Error("Recovery account fingerprint does not match the active session");
  const destinationIds = writer.destinations.map((destination) => destination.id);
  const lifecycleBySession = new Map(lifecycleSessions.map((entry) => [entry.sessionId, entry.captures]));
  const reconstructionBySession = new Map(reconstructionSessions.map((entry) => [entry.sessionId, entry.captures]));
  const sessionIds = /* @__PURE__ */ new Set([
    ...lifecycleBySession.keys(),
    ...reconstructionBySession.keys(),
    runtime.currentSessionId
  ]);
  const scheduled = [];
  const failed = [];
  for (const sessionId of [...sessionIds].toSorted()) {
    if (request.excludeCurrentSession && sessionId === runtime.currentSessionId)
      continue;
    try {
      const lifecycleEntries = lifecycleBySession.get(sessionId) ?? [];
      const reconstructionEntries = reconstructionBySession.get(sessionId) ?? [];
      let hasPendingWork2 = false;
      let hasUnsettledTurn = false;
      let oldestPendingAtMs = Number.POSITIVE_INFINITY;
      let lastActivityAtMs = 0;
      for (const entry of lifecycleEntries) {
        const record = entry.record;
        if (record.destinationFingerprint !== runtime.accountFingerprint)
          continue;
        lastActivityAtMs = Math.max(lastActivityAtMs, entry.capturedAtMs);
        let pending = false;
        for (const destinationId of destinationIds) {
          const outcome = await lifecycleStore.readOutcome({
            integration: record.integration,
            sessionId: record.sessionId,
            turnId: record.turnId,
            eventId: record.eventId
          }, destinationId);
          if (outcome.status === "failed")
            throw new Error(outcome.message);
          if (outcome.status === "missing-capture")
            throw new Error("Recovery capture disappeared");
          if (outcome.status === "pending")
            pending = true;
          else
            lastActivityAtMs = Math.max(lastActivityAtMs, new Date(outcome.receipt.recordedAt).getTime());
        }
        if (pending) {
          hasPendingWork2 = true;
          oldestPendingAtMs = Math.min(oldestPendingAtMs, entry.capturedAtMs);
        }
      }
      const hasUnsupportedLifecycleRecord = lifecycleEntries.some(({ record }) => record.destinationFingerprint === runtime.accountFingerprint && record.eventKind !== LIFECYCLE_POST_EVENT_KIND && record.eventKind !== LIFECYCLE_PATCH_EVENT_KIND && record.eventKind !== LIFECYCLE_SETTLEMENT_EVENT_KIND);
      if (hasUnsupportedLifecycleRecord)
        hasUnsettledTurn = true;
      else if (!hasPendingWork2 && lifecycleEntries.some(({ record }) => record.destinationFingerprint === runtime.accountFingerprint)) {
        hasUnsettledTurn = await hasUnsettledRecoverySettlement({
          captures: lifecycleEntries,
          integration: runtime.integration,
          sessionId,
          destinationFingerprint: runtime.accountFingerprint,
          destinations: writer.destinations,
          store: lifecycleStore
        });
      }
      for (const entry of reconstructionEntries) {
        const record = entry.record;
        if (record.destinationFingerprint !== runtime.accountFingerprint)
          continue;
        lastActivityAtMs = Math.max(lastActivityAtMs, entry.capturedAtMs);
        if (record.eventKind !== RECONSTRUCTION_JOB_KIND)
          continue;
        const outcome = await reconstructionStore.readOutcome({
          integration: record.integration,
          sessionId: record.sessionId,
          turnId: record.turnId,
          eventId: record.eventId
        }, runtime.accountFingerprint);
        if (outcome.status === "failed")
          throw new Error(outcome.message);
        if (outcome.status === "missing-capture")
          throw new Error("Recovery reconstruction job disappeared");
        if (outcome.status === "pending") {
          hasPendingWork2 = true;
          oldestPendingAtMs = Math.min(oldestPendingAtMs, entry.capturedAtMs);
        } else {
          lastActivityAtMs = Math.max(lastActivityAtMs, new Date(outcome.receipt.recordedAt).getTime());
        }
      }
      const isCurrentSession = sessionId === runtime.currentSessionId;
      if (!hasUnsettledTurn && !hasPendingWork2)
        continue;
      if (!isCurrentSession && now - oldestPendingAtMs < minimumForeignAgeMs && now - lastActivityAtMs < minimumForeignAgeMs) {
        continue;
      }
      if (isCurrentSession) {
        scheduled.push({ sessionId, status: await runtime.wakeCurrent() });
        continue;
      }
      const callbacks = await optionsForSession(sessionId);
      if (callbacks === null || typeof callbacks !== "object")
        throw new TypeError("Session recovery options must be an object");
      const sessionOptions = { ...callbacks, sessionId };
      const target = runtime.createSession(sessionOptions);
      if (scopeGuard && !await scopeGuard())
        return { scheduled, failed };
      scheduled.push({ sessionId, status: await target.wake() });
    } catch (error2) {
      failed.push({
        sessionId,
        message: error2 instanceof Error ? error2.message : String(error2)
      });
    }
  }
  return { scheduled, failed };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/background-recovery.js
import { unlink as unlink5 } from "node:fs/promises";

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/recovery-paths.js
import { join as join19, resolve as resolve14 } from "node:path";
function backgroundRecoveryPathSegments(scope) {
  return [
    TRACING_ENGINE_BACKGROUND_RECOVERY_DIRECTORY,
    TRACING_ENGINE_BACKGROUND_RECOVERY_INTEGRATIONS_DIRECTORY,
    identifierHash(scope.integration),
    TRACING_ENGINE_BACKGROUND_RECOVERY_ACCOUNTS_DIRECTORY,
    identifierHash(scope.accountFingerprint)
  ];
}
function backgroundRecoveryPaths(storageRoot, scope) {
  const directory = join19(resolve14(storageRoot), ...backgroundRecoveryPathSegments(scope));
  return {
    directory,
    lock: join19(directory, TRACING_ENGINE_BACKGROUND_RECOVERY_LOCK_FILE),
    marker: join19(directory, TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_FILE)
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/background-recovery.js
async function runBackgroundRecovery(runtime, options, scopeGuard) {
  const cooldownMs = options.cooldownMs ?? TRACING_ENGINE_BACKGROUND_RECOVERY_COOLDOWN_MS;
  const minimumForeignAgeMs = options.minimumForeignAgeMs ?? TRACING_ENGINE_FOREIGN_SESSION_MIN_AGE_MS;
  const paths = backgroundRecoveryPaths(runtime.storageRoot, runtime);
  let retryAtMs;
  let scopeMismatch = false;
  let scopeCheckFailed = false;
  let scopeCheckError;
  const checkScope = scopeGuard ? async () => {
    try {
      const matches = await scopeGuard();
      scopeMismatch ||= !matches;
      return matches;
    } catch (error2) {
      scopeCheckFailed = true;
      scopeCheckError = error2;
      return false;
    }
  } : void 0;
  try {
    await ensurePrivateDirectory(runtime.storageRoot, backgroundRecoveryPathSegments(runtime));
    const observedMarker = await readMarker(runtime.storageRoot, paths.marker);
    if (observedMarker && observedMarker.retryAtMs > Date.now())
      return { status: "cooldown", retryAtMs: observedMarker.retryAtMs };
    return await withFileLock(paths.lock, async () => {
      if (checkScope && !await checkScope())
        return scopeCheckFailed ? { status: "failed", message: describe(scopeCheckError), retryable: true } : { status: "scope-mismatch" };
      const now = Date.now();
      const existing = await readMarker(runtime.storageRoot, paths.marker);
      if (existing && existing.retryAtMs > now)
        return { status: "cooldown", retryAtMs: existing.retryAtMs };
      retryAtMs = now + cooldownMs;
      if (!Number.isSafeInteger(retryAtMs))
        throw new RangeError(TRACING_ENGINE_BACKGROUND_RECOVERY_RETRY_RANGE_ERROR);
      await writeMarker(paths.marker, {
        version: TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_VERSION,
        retryAtMs
      });
      try {
        const report2 = await recoverTracingSessions(runtime, {
          optionsForSession: options.optionsForSession,
          minimumForeignAgeMs,
          now,
          excludeCurrentSession: true
        }, checkScope);
        if (checkScope && !scopeMismatch && !scopeCheckFailed)
          await checkScope();
        retryAtMs = nextRetryAt(cooldownMs);
        await writeMarker(paths.marker, {
          version: TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_VERSION,
          retryAtMs
        });
        if (scopeCheckFailed)
          return {
            status: "failed",
            message: describe(scopeCheckError),
            retryable: true,
            retryAtMs
          };
        if (scopeMismatch)
          return { status: "scope-mismatch" };
        return report2.failed.length === 0 ? { status: "completed", report: report2, retryAtMs } : { status: "partial", report: report2, retryAtMs, retryable: true };
      } catch (error2) {
        retryAtMs = nextRetryAt(cooldownMs);
        await writeMarker(paths.marker, {
          version: TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_VERSION,
          retryAtMs
        });
        return {
          status: "failed",
          message: describe(error2),
          retryable: true,
          retryAtMs
        };
      }
    });
  } catch (error2) {
    return {
      status: "failed",
      message: describe(error2),
      retryable: true,
      ...retryAtMs === void 0 ? {} : { retryAtMs }
    };
  }
}
function nextRetryAt(cooldownMs) {
  const retryAtMs = Date.now() + cooldownMs;
  if (!Number.isSafeInteger(retryAtMs))
    throw new RangeError(TRACING_ENGINE_BACKGROUND_RECOVERY_RETRY_RANGE_ERROR);
  return retryAtMs;
}
async function readMarker(root, path3) {
  const contents = await readPrivateFile(root, path3);
  if (contents === void 0)
    return void 0;
  try {
    const value = JSON.parse(contents);
    if (typeof value === "object" && value !== null && "version" in value && value.version === TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_VERSION && "retryAtMs" in value && typeof value.retryAtMs === "number" && Number.isSafeInteger(value.retryAtMs) && value.retryAtMs >= 0) {
      return value;
    }
  } catch {
  }
  return void 0;
}
async function writeMarker(path3, marker) {
  try {
    await unlink5(path3);
  } catch (error2) {
    if (error2.code !== TRACING_ENGINE_BACKGROUND_RECOVERY_FILE_NOT_FOUND_CODE)
      throw error2;
  }
  if (!await publishExclusive(path3, JSON.stringify(marker)))
    throw new Error(TRACING_ENGINE_BACKGROUND_RECOVERY_MARKER_EXISTS_ERROR);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_110bc52b9a180c58046e6de42c7052b4/node_modules/@langchain/plugins-base/dist/tracing/engine/engine.js
function createTracingEngine(options) {
  const config = snapshotEngineOptions(options);
  function forSession(sessionOptions) {
    return createSession(snapshotSessionOptions(sessionOptions));
  }
  function createSession(session) {
    let backgroundWorker;
    const lifecycleBridge = createLifecycleBridge({
      storageRoot: config.storageRoot,
      integration: config.integration,
      sessionId: session.sessionId,
      writer: config.writer,
      ...config.policy === void 0 ? {} : { policy: config.policy },
      wake: async () => backgroundWorker?.wake()
    });
    const reconstructionWorker = createReconstructionWorker({
      storageRoot: config.storageRoot,
      integration: config.integration,
      sessionId: session.sessionId,
      bridge: lifecycleBridge,
      reconstruct: session.reconstruct,
      ...config.policy === void 0 ? {} : { policy: config.policy }
    });
    const scope = Object.freeze({
      integration: config.integration,
      sessionId: session.sessionId,
      accountFingerprint: lifecycleBridge.accountFingerprint
    });
    backgroundWorker = createBackgroundWorker({
      storageRoot: config.storageRoot,
      scope,
      resolveScope: () => session.resolveScope(scope),
      launchWorker: session.scheduleWake,
      ...session.startupWaitMs === void 0 ? {} : { startupWaitMs: session.startupWaitMs },
      ...session.retryPolicy === void 0 ? {} : { retryPolicy: session.retryPolicy },
      reconstructPending: async () => reconstructionPassResult(await reconstructionWorker.drain()),
      drainPending: async () => lifecyclePassResult(await lifecycleBridge.drain())
    });
    const recoveryRuntime = () => ({
      storageRoot: config.storageRoot,
      integration: config.integration,
      accountFingerprint: lifecycleBridge.accountFingerprint,
      writer: config.writer,
      currentSessionId: session.sessionId,
      wakeCurrent: () => backgroundWorker.wake(),
      createSession: (recoveredOptions) => createSession(snapshotSessionOptions({
        ...recoveredOptions,
        ...session.backgroundRecovery === void 0 ? {} : { backgroundRecovery: session.backgroundRecovery }
      }))
    });
    return Object.freeze({
      async capture(input) {
        return lifecycleBridge.capture(input);
      },
      async captureSnapshot(input) {
        return lifecycleBridge.captureSnapshot(input);
      },
      async queueReconstruction(input) {
        const result = await reconstructionWorker.enqueue(input);
        if (result.status === "published" || result.status === "duplicate")
          await wakeCapturedWork(result, () => backgroundWorker?.wake());
        return result;
      },
      async readSavedReconstructionWake(error2, input) {
        return reconstructionWorker.readSavedWake(error2, input);
      },
      async wake() {
        return backgroundWorker.wake();
      },
      async drain() {
        const result = await backgroundWorker.run();
        const backgroundRecovery = session.backgroundRecovery;
        if (backgroundRecovery && (result === "completed" || result === "idle")) {
          let recoveryResult;
          const checkScope = () => matchesScope(() => session.resolveScope(scope), scope);
          try {
            recoveryResult = await checkScope() ? await runBackgroundRecovery(recoveryRuntime(), backgroundRecovery, checkScope) : { status: "scope-mismatch" };
          } catch (error2) {
            recoveryResult = {
              status: "failed",
              message: describe(error2),
              retryable: true
            };
          }
          try {
            await backgroundRecovery.onReport(recoveryResult);
          } catch (error2) {
            console.error(TRACING_ENGINE_BACKGROUND_RECOVERY_REPORT_ERROR, describe(error2));
          }
        }
        return result;
      },
      async recoverSessions(request) {
        return recoverTracingSessions(recoveryRuntime(), request);
      }
    });
  }
  return Object.freeze({ forSession });
}

// dist/src/tracing-engine.js
import { dirname as dirname9, join as join21 } from "node:path";

// dist/src/utils/detach.js
import { spawn } from "node:child_process";

// dist/src/utils/binary-runtime.js
var COMPILED_ROOT = "/$bunfs/";
function runningCompiledBinary() {
  const main11 = globalThis.Bun?.main;
  return typeof main11 === "string" && main11.startsWith(COMPILED_ROOT);
}

// dist/src/utils/detach.js
function startQueueFlusher(cwd, sessionId, projectName) {
  void launchQueueFlusher(cwd, sessionId, projectName).catch(() => {
  });
}
function launchQueueFlusher(cwd, sessionId, projectName) {
  return new Promise((resolve16, reject) => {
    const self = runningCompiledBinary() || !process.argv[1] ? [] : [process.argv[1]];
    const child = spawn(process.execPath, [
      ...self,
      FLUSH_QUEUE_ARG,
      cwd,
      sessionId,
      ...projectName === void 0 ? [] : [projectName]
    ], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    child.once("spawn", () => {
      if (!child.pid) {
        reject(new Error("The queue flusher did not start"));
        return;
      }
      child.unref();
      debug(`Started detached queue flusher (pid ${child.pid})`);
      resolve16(child.pid);
    });
    child.once("error", (err) => {
      warn(`The queue flusher could not start: ${err}`);
      reject(err);
    });
  });
}

// dist/src/legacy-import.js
import { isAbsolute as isAbsolute7 } from "node:path";

// dist/src/repo-attribution.js
import { isAbsolute as isAbsolute6 } from "node:path";

// dist/src/repo-attribution-paths.js
import { existsSync as existsSync4, statSync as statSync6 } from "node:fs";
import { dirname as dirname8, isAbsolute as isAbsolute5, join as join20, resolve as resolve15 } from "node:path";
function toolPathFromInput(toolInput, sessionCwd) {
  if (!toolInput || typeof toolInput !== "object" || Array.isArray(toolInput)) {
    return { namedAPath: false };
  }
  const input = toolInput;
  let namedAPath = false;
  for (const key of TOOL_PATH_INPUT_KEYS) {
    const value = input[key];
    if (typeof value !== "string" || value.length === 0)
      continue;
    namedAPath = true;
    if (isAbsolute5(value))
      return { path: value, namedAPath };
    if (!sessionCwd || !isAbsolute5(sessionCwd))
      continue;
    const resolved = resolve15(sessionCwd, value);
    if (existsSync4(resolved))
      return { path: resolved, namedAPath };
  }
  return { namedAPath };
}
function nearestExistingDirectory(path3) {
  let current = path3;
  for (; ; ) {
    const parent = dirname8(current);
    const reachedFilesystemRoot = parent === current;
    if (reachedFilesystemRoot)
      return void 0;
    try {
      if (statSync6(current).isDirectory())
        return current;
    } catch {
    }
    current = parent;
  }
}
function gitMarkerAt(directory) {
  try {
    return statSync6(join20(directory, GIT_DIRECTORY_NAME)).isDirectory() ? GIT_MARKERS.REPOSITORY_ROOT : GIT_MARKERS.ONLY_GIT_CAN_SAY;
  } catch {
    return GIT_MARKERS.NOTHING_HERE;
  }
}
function rootFromGitMarker(directory) {
  let current = resolve15(directory);
  for (; ; ) {
    const marker = gitMarkerAt(current);
    if (marker === GIT_MARKERS.REPOSITORY_ROOT)
      return current;
    if (marker === GIT_MARKERS.ONLY_GIT_CAN_SAY)
      return void 0;
    const parent = dirname8(current);
    const reachedFilesystemRoot = parent === current;
    if (reachedFilesystemRoot)
      return null;
    current = parent;
  }
}

// dist/src/repo-attribution.js
var rootByDirectory = /* @__PURE__ */ new Map();
var attributionByRoot = /* @__PURE__ */ new Map();
var identifierByRoot = /* @__PURE__ */ new Map();
function rootForPath(path3) {
  const directory = nearestExistingDirectory(path3);
  if (!directory)
    return void 0;
  if (rootByDirectory.has(directory))
    return rootByDirectory.get(directory);
  const walked = rootFromGitMarker(directory);
  const onlyGitCanSay = walked === void 0;
  const root = onlyGitCanSay ? getRepoRoot(directory) : walked;
  rootByDirectory.set(directory, root);
  return root;
}
function isSessionsOwnRepository(sessionCwd, root) {
  return sessionCwd ? rootForPath(sessionCwd) === root : false;
}
function withoutPinnedKeys(attribution, pinned) {
  if (pinned.size === 0)
    return { ...attribution };
  return Object.fromEntries(Object.entries(attribution).filter(([key]) => !pinned.has(key)));
}
function withoutRepositoryKeys(base, pinned) {
  const stripped = { ...base };
  for (const key of REPOSITORY_METADATA_KEYS) {
    if (!pinned.has(key))
      delete stripped[key];
  }
  return stripped;
}
function identifierForRoot(root) {
  const cached = identifierByRoot.get(root);
  if (cached)
    return cached;
  const userName = getGitUserName(root);
  const identifier = userName ? { ls_attribution_identifier: userName } : {};
  identifierByRoot.set(root, identifier);
  return identifier;
}
function attributionForRoot(root) {
  const cached = attributionByRoot.get(root);
  if (cached)
    return cached;
  const attribution = { ...identifierForRoot(root) };
  const repoName = getRepoName(root);
  if (repoName) {
    attribution.repository_name = repoName.name;
    attribution.repository_provider = repoName.provider;
    const url = getRepoUrl(repoName.provider, repoName.name);
    if (url)
      attribution.repository_url = url;
  }
  const gitInfo = getGitInfo(root);
  if (gitInfo.branch)
    attribution.git_branch = gitInfo.branch;
  if (gitInfo.commit)
    attribution.git_commit_sha = gitInfo.commit;
  attributionByRoot.set(root, attribution);
  return attribution;
}
function withSessionAuthor(base, sessionRoot) {
  if (base?.ls_attribution_identifier !== void 0)
    return base;
  return { ...base, ...identifierForRoot(sessionRoot) };
}
function sessionScopedMetadata(base, sessionCwd) {
  const sessionRoot = sessionCwd ? rootForPath(sessionCwd) : void 0;
  return typeof sessionRoot === "string" ? withSessionAuthor(base, sessionRoot) : base;
}
function scopedToPath(base, lookup, sessionCwd, pinned) {
  const { path: toolPath, namedAPath } = lookup;
  const namedSomewhereNothingSits = namedAPath && !toolPath;
  if (namedSomewhereNothingSits)
    return base;
  const path3 = toolPath ?? sessionCwd;
  if (!path3 || !isAbsolute6(path3))
    return base;
  const root = rootForPath(path3);
  const gitCouldNotAnswer = root === void 0;
  if (gitCouldNotAnswer)
    return base;
  const pathIsInNoRepository = root === null;
  if (pathIsInNoRepository)
    return withoutRepositoryKeys(base, pinned);
  if (isSessionsOwnRepository(sessionCwd, root)) {
    return { ...base, ...withoutPinnedKeys(identifierForRoot(root), pinned) };
  }
  return {
    ...withoutRepositoryKeys(base, pinned),
    ...withoutPinnedKeys(attributionForRoot(root), pinned)
  };
}
function repoScopedMetadata(base, toolInput, sessionCwd) {
  return scopedToPath(base, toolPathFromInput(toolInput, sessionCwd), sessionCwd, pinnedRepositoryKeys(base));
}
var awaitsTheTurn = (metadata) => !metadata?.[REPOSITORY_NAME_KEY] || !metadata?.[ATTRIBUTION_IDENTIFIER_KEY];
function toolOrigin(toolInput, sessionCwd) {
  return { cwd: sessionCwd, ...toolPathFromInput(toolInput, sessionCwd) };
}
function withSessionRepository(base, sessionCwd) {
  const sessionRoot = sessionCwd ? rootForPath(sessionCwd) : void 0;
  if (typeof sessionRoot !== "string")
    return base;
  return { ...attributionForRoot(sessionRoot), ...base };
}
function settledRepositoryMetadata(base, origin, turnAttributionFallback) {
  const pinned = new Set(REPOSITORY_METADATA_KEYS.filter((key) => base?.[key] !== void 0));
  const sessionScoped = withSessionRepository(base, origin.cwd);
  const settled = scopedToPath(sessionScoped, { path: origin.path, namedAPath: origin.namedAPath }, origin.cwd, pinned);
  const sessionRoot = origin.cwd ? rootForPath(origin.cwd) : void 0;
  const sessionAttribution = typeof sessionRoot === "string" ? attributionForRoot(sessionRoot) : void 0;
  const sessionAuthorFallback = (settled?.[REPOSITORY_NAME_KEY] === sessionAttribution?.[REPOSITORY_NAME_KEY] || turnAttributionFallback?.[REPOSITORY_NAME_KEY] === sessionAttribution?.[REPOSITORY_NAME_KEY]) && typeof sessionAttribution?.[ATTRIBUTION_IDENTIFIER_KEY] === "string" ? { [ATTRIBUTION_IDENTIFIER_KEY]: sessionAttribution[ATTRIBUTION_IDENTIFIER_KEY] } : void 0;
  const fallback = { ...sessionAuthorFallback, ...turnAttributionFallback };
  const settledRepository = settled?.[REPOSITORY_NAME_KEY];
  const fallbackRepository = fallback[REPOSITORY_NAME_KEY];
  if (typeof fallbackRepository !== "string" || typeof settledRepository === "string" && settledRepository !== fallbackRepository)
    return settled;
  const missing = Object.fromEntries(Object.entries(fallback).filter(([key]) => settled?.[key] === void 0));
  return { ...settled, ...missing };
}
function settledRunConfig(run, origin) {
  const extra = run.extra;
  const metadata = settledRepositoryMetadata(extra?.metadata, origin) ?? extra?.metadata ?? {};
  const settled = { ...run, extra: { ...extra, metadata } };
  const open3 = awaitsTheTurn(metadata);
  if (open3)
    delete settled.end_time;
  return { run: settled, open: open3 };
}
function turnScopedMetadata(base, toolInputs, sessionCwd) {
  const sessionRoot = sessionCwd ? rootForPath(sessionCwd) : void 0;
  if (typeof sessionRoot === "string")
    return withSessionAuthor(base, sessionRoot);
  for (const toolInput of toolInputs) {
    const { path: path3 } = toolPathFromInput(toolInput, sessionCwd);
    if (!path3)
      continue;
    const landedInRepository = typeof rootForPath(path3) === "string";
    if (landedInRepository)
      return repoScopedMetadata(base, toolInput, sessionCwd);
  }
  return base;
}

// dist/src/utils/validation/values.js
function nonBlank(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : void 0;
}
function stringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function integerValue(value) {
  return Number.isSafeInteger(value) ? value : void 0;
}
function timestamp(value) {
  const time = typeof value === "number" ? value : typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isSafeInteger(time) && time >= 0 ? time : void 0;
}
function isRecord3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// dist/src/legacy-import/normalizers.js
function legacyMetadataOptions(source, sessionId, runName) {
  const base = source === void 0 ? void 0 : { ...source };
  if (base)
    delete base.cwd;
  const provider2 = Object.fromEntries(LEGACY_PROVIDER_METADATA_KEYS.flatMap((key) => source?.[key] === void 0 ? [] : [[key, source[key]]]));
  return {
    integration: CLAUDE_CODE_INTEGRATION,
    threadId: sessionId,
    agentType: "root",
    runType: "tool",
    runName,
    toolName: stringValue(source?.ls_tool_name) ?? stringValue(source?.tool_name) ?? runName,
    ...stringValue(source?.ls_integration_version) === void 0 ? {} : { integrationVersion: stringValue(source?.ls_integration_version) },
    ...stringValue(source?.ls_agent_runtime_version) === void 0 ? {} : { runtimeVersion: stringValue(source?.ls_agent_runtime_version) },
    ...stringValue(source?.turn_id) === void 0 ? {} : { turnId: stringValue(source?.turn_id) },
    ...integerValue(source?.turn_number) === void 0 ? {} : { turnNumber: integerValue(source?.turn_number) },
    ...stringValue(source?.approval_policy) === void 0 ? {} : { approvalPolicy: stringValue(source?.approval_policy) },
    ...stringValue(source?.ls_subagent_id) === void 0 ? {} : { subagentId: stringValue(source?.ls_subagent_id) },
    ...stringValue(source?.ls_subagent_type) === void 0 ? {} : { subagentType: stringValue(source?.ls_subagent_type) },
    ...stringValue(source?.ls_skill_name) === void 0 ? {} : { skillName: stringValue(source?.ls_skill_name) },
    ...stringValue(source?.ls_model_name) === void 0 ? {} : { modelName: stringValue(source?.ls_model_name) },
    ...isRecord3(source?.usage_metadata) ? { usageMetadata: source?.usage_metadata } : {},
    ...Object.keys(provider2).length === 0 ? {} : { providerMetadata: provider2 },
    ...base === void 0 ? {} : { base }
  };
}
function normalizedRunSnapshot2(source, tracing, sourceAgeStartedAtMs) {
  const safe = runConfigForMode(source, tracing);
  const id = nonBlank(safe.id);
  const name = nonBlank(safe.name);
  const runType = nonBlank(safe.run_type);
  if (!id || !name || runType !== "tool" || !isRecord3(safe.inputs))
    return void 0;
  const run = {
    id,
    name,
    run_type: runType,
    inputs: safe.inputs,
    start_time: timestamp(safe.start_time) === void 0 ? sourceAgeStartedAtMs : safe.start_time
  };
  for (const key of LEGACY_RUN_STRING_FIELDS) {
    const value = safe[key];
    if (value === void 0)
      continue;
    if (key === "end_time") {
      if (timestamp(value) === void 0)
        return void 0;
    } else if (typeof value !== "string") {
      return void 0;
    }
    run[key] = value;
  }
  for (const key of LEGACY_RUN_OBJECT_FIELDS) {
    const value = safe[key];
    if (value === void 0)
      continue;
    if (!isRecord3(value))
      return void 0;
    run[key] = value;
  }
  if (safe.tags !== void 0) {
    if (!Array.isArray(safe.tags) || safe.tags.some((tag) => typeof tag !== "string"))
      return void 0;
    run.tags = safe.tags;
  }
  if (safe.events !== void 0) {
    if (!Array.isArray(safe.events))
      return void 0;
    run.events = safe.events;
  }
  return run;
}
function runMetadata(run) {
  const extra = run.extra;
  return isRecord3(extra) && isRecord3(extra.metadata) ? extra.metadata : void 0;
}
function normalizedToolOrigin(value, cwd) {
  const path3 = nonBlank(value?.path);
  return { ...path3 === void 0 ? {} : { path: path3 }, cwd, namedAPath: value?.namedAPath === true };
}

// dist/src/legacy-import.js
async function importLegacyQueueEntries(options) {
  const entries = readQueue(options.dir);
  for (const entry of entries) {
    if (entry.origin !== options.origin) {
      warn(`Leaving queued run ${entry.queue_id} in place because it belongs to a different LangSmith account`);
      return;
    }
    if (runIsTooOldToUpload(entry)) {
      const record = entry.record ? readTurnRecord(entry.record) : void 0;
      if (entry.record && (!record || record.origin !== entry.origin)) {
        warn(`Leaving expired queue entry ${entry.queue_id} in place because its turn record account cannot be verified`);
        return;
      }
      abandonQueued(entry);
      removeQueued(options.dir, entry.queue_id);
      continue;
    }
    const result = legacyQueueCapturePlan(entry);
    if ("reason" in result) {
      warn(`Leaving queued run ${entry.queue_id} in place: ${result.reason}`);
      return;
    }
    const { plan } = result;
    const projectConfig = { ...options.config, project: plan.projectName };
    const context = options.createContext(projectConfig, plan.cwd, plan.sessionId, plan.projectName);
    if (!context) {
      warn(`Leaving queued run ${entry.queue_id} in place because its saved project route is unavailable`);
      return;
    }
    let accepted = false;
    let failure2;
    try {
      const result2 = await context.session.captureSnapshot(plan.input);
      accepted = result2.status === "published" || result2.status === "duplicate";
      if (!accepted)
        failure2 = `shared capture returned ${result2.status}`;
    } catch (err) {
      accepted = await readSavedCaptureWake(err, {
        store: context.captureStore,
        integration: CLAUDE_CODE_INTEGRATION,
        sessionId: plan.sessionId,
        turnId: plan.turnId,
        runId: plan.input.submission.run.id,
        destinationFingerprint: context.accountFingerprint
      }) !== void 0;
      if (!accepted)
        failure2 = `shared capture failed: ${err}`;
    }
    if (!accepted) {
      warn(`Leaving queued run ${entry.queue_id} in place because ${failure2 ?? "shared capture was not confirmed"}`);
      return;
    }
    const wroteRecord = recordRun({
      path: plan.recordPath,
      run: plan.run,
      tracing: entry.tracing,
      origin: entry.origin,
      shared: true,
      closesAt: plan.open ? entry.run.end_time : void 0,
      routing: { cwd: plan.cwd }
    });
    if (!wroteRecord) {
      warn(`Leaving queued run ${entry.queue_id} in place because its local turn record could not be updated`);
      return;
    }
    removeQueued(options.dir, entry.queue_id);
  }
}
function legacyQueueCapturePlan(entry) {
  if (!entry.record)
    return { reason: "the queue entry has no turn record" };
  if (entry.tracing !== "full" && entry.tracing !== "metadata")
    return { reason: "the queue entry has an unknown privacy mode" };
  const runId = nonBlank(entry.run.id);
  const turnId = nonBlank(entry.run.parent_run_id);
  const sourceMetadata = runMetadata(entry.run);
  if (!runId || !turnId)
    return { reason: "the queued run has no stable run or turn ID" };
  const record = readTurnRecord(entry.record);
  if (!record || record.origin !== entry.origin)
    return { reason: "the turn record is missing or belongs to a different account" };
  if (record.root?.run_id !== turnId)
    return { reason: "the queued run parent does not match its saved turn root" };
  const recorded = record.children.find((child) => child.run_id === runId);
  if (!recorded)
    return { reason: "the queued run is missing from its turn record" };
  const sessionId = nonBlank(recorded.metadata.thread_id);
  const queuedSessionId = nonBlank(sourceMetadata?.thread_id);
  if (!sessionId || queuedSessionId !== sessionId)
    return { reason: "the original Claude session ID cannot be verified" };
  const recordedProject = nonBlank(recorded.project_name);
  const queuedProject = nonBlank(entry.run.project_name);
  if (!recordedProject && !queuedProject)
    return { reason: "the original LangSmith project cannot be verified" };
  if (recordedProject && queuedProject && recordedProject !== queuedProject)
    return { reason: "the queue and turn record disagree about the original LangSmith project" };
  const projectName = recordedProject ?? queuedProject;
  const recordedCwd = nonBlank(recorded.routing?.cwd);
  const queuedCwd = nonBlank(entry.where?.cwd);
  if (!recordedCwd && !queuedCwd)
    return { reason: "the original working directory cannot be verified" };
  if (recordedCwd && !isAbsolute7(recordedCwd) || queuedCwd && !isAbsolute7(queuedCwd))
    return { reason: "the saved working directory is not absolute" };
  if (recordedCwd && queuedCwd && recordedCwd !== queuedCwd)
    return { reason: "the queue and turn record disagree about the original working directory" };
  const cwd = recordedCwd ?? queuedCwd;
  const toolOrigin2 = normalizedToolOrigin(entry.where, cwd);
  const settled = entry.where ? settledRunConfig(entry.run, toolOrigin2) : { run: entry.run, open: false };
  const sourceAgeStartedAtMs = timestamp(settled.run.start_time) ?? queuedAtMs(entry.queue_id);
  if (sourceAgeStartedAtMs === void 0)
    return { reason: "the original run age cannot be verified" };
  const attempts = entry.attempts;
  if (!Number.isSafeInteger(attempts) || attempts < 0)
    return { reason: "the prior delivery attempt count is invalid" };
  const run = normalizedRunSnapshot2(settled.run, entry.tracing, sourceAgeStartedAtMs);
  if (!run || run.id !== runId)
    return { reason: "the queued run cannot be converted to a safe shared snapshot" };
  const children = record.children.filter((child) => child.shared || !record.delivered.has(child.run_id)).map((child) => child.run_id);
  if (!children.includes(runId))
    children.push(runId);
  const input = {
    turnId,
    eventId: runId,
    sourceAgeStartedAtMs,
    priorDeliveryAttempts: attempts,
    submission: {
      operation: "post",
      integration: CLAUDE_CODE_INTEGRATION,
      privacyMode: entry.tracing,
      metadata: legacyMetadataOptions(runMetadata(settled.run), sessionId, run.name),
      privacyContext: { status: settled.open ? "running" : run.error ? "error" : "completed" },
      run
    },
    turnEvidence: {
      rootRunId: turnId,
      childRunIds: [...new Set(children.filter((child) => child !== turnId))],
      closureState: record.closed ? "authoritative" : "open"
    }
  };
  return {
    plan: {
      cwd,
      sessionId,
      projectName,
      turnId,
      recordPath: entry.record,
      run: settled.run,
      open: settled.open,
      input
    }
  };
}
function listLegacySessionRoutes(stateFilePath, origin, storedSession) {
  const routes = /* @__PURE__ */ new Map();
  const storedSessions = storedSession === void 0 ? listRecordedSessions(stateFilePath) : [storedSession];
  for (const recordedSession of storedSessions) {
    const directory = turnRecordDir(stateFilePath, recordedSession);
    for (const path3 of listTurnRecords(directory)) {
      const record = readTurnRecord(path3);
      if (!record || record.origin !== origin)
        continue;
      for (const run of [...record.root ? [record.root] : [], ...record.children]) {
        if (!run.shared)
          continue;
        const sessionId = nonBlank(run.metadata.thread_id);
        const projectName = nonBlank(run.project_name);
        const cwd = nonBlank(run.routing?.cwd);
        if (!sessionId || !projectName || !cwd || !isAbsolute7(cwd))
          continue;
        const route = { cwd, projectName, sessionId };
        routes.set(`${sessionId}\0${projectName}\0${cwd}`, route);
      }
    }
  }
  return [...routes.values()];
}
function legacyRouteForSession(stateFilePath, sessionId, origin) {
  const routes = /* @__PURE__ */ new Map();
  for (const path3 of listTurnRecords(turnRecordDir(stateFilePath, sessionId))) {
    const record = readTurnRecord(path3);
    if (!record || record.origin !== origin)
      continue;
    for (const run of [...record.root ? [record.root] : [], ...record.children]) {
      if (!run.shared || nonBlank(run.metadata.thread_id) !== sessionId)
        continue;
      const projectName = nonBlank(run.project_name);
      const cwd = nonBlank(run.routing?.cwd);
      if (!projectName || !cwd || !isAbsolute7(cwd))
        continue;
      const route = { cwd, projectName, sessionId };
      routes.set(`${sessionId}\0${projectName}\0${cwd}`, route);
    }
  }
  const matchingRoutes = [...routes.values()];
  if (matchingRoutes.length !== 1)
    return void 0;
  return matchingRoutes[0];
}

// dist/src/tracing-engine.js
function createClaudeTracingSession(config, cwd, sessionId, projectName) {
  const projectConfig = projectName === void 0 ? config : { ...config, project: projectName };
  const writerOptions = writerOptionsForConfig(projectConfig);
  if (!writerOptions)
    return void 0;
  const writer = createLangSmithUploadWriter(writerOptions);
  const runReconstructionContext = {
    project: projectConfig.project,
    recordOrigin: queueOrigin(projectConfig),
    stateFilePath: projectConfig.stateFilePath,
    sessionId
  };
  const storageRoot = join21(dirname9(config.stateFilePath), SHARED_ENGINE_STORAGE_DIRECTORY);
  const captureStore = createCaptureStore(storageRoot);
  const engine = createTracingEngine({
    storageRoot,
    integration: CLAUDE_CODE_INTEGRATION,
    writer: writerOptions
  });
  const session = engine.forSession({
    sessionId,
    resolveScope: () => resolveClaudeScope(cwd, sessionId, projectName),
    scheduleWake: () => launchQueueFlusher(cwd, sessionId, projectName),
    reconstruct: (job) => reconstructClaudeJob(job, runReconstructionContext),
    backgroundRecovery: {
      optionsForSession: (recoveredSessionId) => {
        const current = loadConfig({ cwd, deferGit: true });
        const origin = queueOrigin(current);
        const route = legacyRouteForSession(current.stateFilePath, recoveredSessionId, origin);
        if (!route)
          throw new Error(`Could not find a saved route for ${recoveredSessionId}`);
        const recovered = loadConfig({ cwd: route.cwd, deferGit: true });
        if (queueOrigin(recovered) !== origin)
          throw new Error(`Saved route for ${recoveredSessionId} belongs to another LangSmith account`);
        return {
          resolveScope: () => resolveClaudeScope(route.cwd, recoveredSessionId, route.projectName),
          scheduleWake: () => launchQueueFlusher(route.cwd, recoveredSessionId, route.projectName),
          reconstruct: (job) => reconstructClaudeJob(job, {
            project: route.projectName,
            recordOrigin: queueOrigin(recovered),
            stateFilePath: recovered.stateFilePath,
            sessionId: recoveredSessionId
          })
        };
      },
      onReport: (result) => {
        if (result.status === "partial" || result.status === "failed") {
          warn(`Shared session recovery was incomplete: ${JSON.stringify(result)}`);
        }
      }
    }
  });
  return {
    accountFingerprint: writer.accountFingerprint,
    captureStore,
    destinations: writer.destinations,
    project: projectConfig.project,
    recordOrigin: queueOrigin(projectConfig),
    stateFilePath: projectConfig.stateFilePath,
    session,
    sessionId,
    storageRoot
  };
}
async function reconstructClaudeJob(job, context) {
  return job.eventId.endsWith(CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX) ? reconstructClaudeRun(job, context) : reconstructClaudeTool(job);
}
function resolveClaudeScope(cwd, sessionId, projectName) {
  const current = loadConfig({ cwd, deferGit: true });
  const scoped = projectName === void 0 ? current : { ...current, project: projectName };
  const options = writerOptionsForConfig(scoped);
  if (!options)
    return {
      integration: CLAUDE_CODE_INTEGRATION,
      sessionId,
      accountFingerprint: "unavailable"
    };
  try {
    return {
      integration: CLAUDE_CODE_INTEGRATION,
      sessionId,
      accountFingerprint: createLangSmithUploadWriter(options).accountFingerprint
    };
  } catch {
    return {
      integration: CLAUDE_CODE_INTEGRATION,
      sessionId,
      accountFingerprint: "unavailable"
    };
  }
}
async function captureClaudeRun(context, input) {
  try {
    const result = await context.session.capture(input);
    return result.status === "published" || result.status === "duplicate";
  } catch (err) {
    if (await readSavedCaptureWake(err, {
      store: context.captureStore,
      integration: CLAUDE_CODE_INTEGRATION,
      sessionId: context.sessionId,
      turnId: input.turnId,
      eventId: input.eventId,
      runId: input.submission.run.id,
      destinationFingerprint: context.accountFingerprint
    })) {
      warn(`Shared capture was saved but its worker wake failed: ${err}`);
      return true;
    }
    throw err;
  }
}
async function captureClaudeRunWithReconstruction(context, input, nativeTurnRecordRunId) {
  const source = input.submission;
  const run = source.run;
  if (source.operation === "post" && source.privacyMode === "full" && (run.run_type === "llm" || run.run_type === "tool" && run.name === "Agent")) {
    return queueClaudeRunReconstruction(context, input, nativeTurnRecordRunId);
  }
  return captureClaudeRun(context, input);
}
async function sharedClaudeChildRunIds(context, turnId, rootRunId, recordedSharedChildRunIds = []) {
  const shared = new Set(recordedSharedChildRunIds.filter((runId) => runId !== rootRunId));
  const lifecycle = await context.captureStore.enumerate(CLAUDE_CODE_INTEGRATION, context.sessionId);
  for (const { record } of lifecycle) {
    if (record.turnId === turnId && record.runId !== rootRunId && record.eventId === record.runId && record.destinationFingerprint === context.accountFingerprint) {
      shared.add(record.runId);
    }
  }
  return [...shared].sort();
}
async function queueClaudeToolReconstruction(context, input) {
  const sourceRef = `${input.run.id}${CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX}`;
  const startTime = typeof input.run.start_time === "number" ? input.run.start_time : typeof input.run.start_time === "string" ? Date.parse(input.run.start_time) : Number.NaN;
  if (!Number.isSafeInteger(startTime) || startTime < 0)
    throw new TypeError(`Completed tool ${input.run.id} has an invalid start time`);
  const submission = {
    operation: "post",
    integration: CLAUDE_CODE_INTEGRATION,
    privacyMode: input.privacyMode,
    metadata: {
      integration: CLAUDE_CODE_INTEGRATION,
      ...TRUSTED_INTEGRATION_VERSION === void 0 ? {} : { integrationVersion: TRUSTED_INTEGRATION_VERSION },
      threadId: context.sessionId,
      agentType: "root",
      runType: "tool",
      toolName: input.metadata.toolName,
      runName: input.run.name,
      ...input.metadata.turnNumber === void 0 ? {} : { turnNumber: input.metadata.turnNumber },
      ...input.metadata.runtimeVersion === void 0 ? {} : { runtimeVersion: input.metadata.runtimeVersion },
      ...input.metadata.skillName === void 0 ? {} : { skillName: input.metadata.skillName },
      ...input.privacyMode === "full" && input.metadata.base !== void 0 ? { base: { ...input.metadata.base } } : {},
      ...input.privacyMode === "full" && input.metadata.turnAttributionFallback !== void 0 ? { runSpecific: { ...input.metadata.turnAttributionFallback } } : {}
    },
    privacyContext: { status: "completed" },
    run: runSnapshotForMode(input.run, input.privacyMode)
  };
  const reconstruction = {
    turnId: input.turnId,
    eventId: `${input.run.id}${CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX}`,
    sourceRefs: [sourceRef],
    privacyMode: input.privacyMode,
    turnEvidence: input.turnEvidence,
    sourceSnapshots: [
      {
        sourceRef,
        sourceAgeStartedAtMs: startTime,
        submission,
        attributionContext: {
          toolOrigin: input.privacyMode === "full" ? {
            ...input.origin.path === void 0 ? {} : { path: input.origin.path },
            ...input.origin.cwd === void 0 ? {} : { cwd: input.origin.cwd },
            namedAPath: input.origin.namedAPath
          } : { namedAPath: false },
          ...input.privacyMode === "full" && input.pinnedRepositoryKeys !== void 0 ? { pinnedRepositoryKeys: [...input.pinnedRepositoryKeys] } : {}
        }
      }
    ]
  };
  try {
    const queued = await context.session.queueReconstruction(reconstruction);
    if (queued.status !== "published" && queued.status !== "duplicate") {
      throw new Error(`Could not queue completed tool ${input.run.id}: ${queued.status}`);
    }
  } catch (err) {
    if (!await context.session.readSavedReconstructionWake(err, reconstruction))
      throw err;
    warn(`Completed tool ${input.run.id} was saved but its worker wake failed: ${err}`);
  }
}
async function queueClaudeRunReconstruction(context, input, nativeTurnRecordRunId) {
  const source = input.submission;
  if (source.operation !== "post" || source.privacyMode !== "full" || source.run.run_type !== "llm" && !(source.run.run_type === "tool" && source.run.name === "Agent")) {
    return false;
  }
  const run = source.run;
  const rootRunId = input.turnEvidence.rootRunId;
  if (typeof nativeTurnRecordRunId !== "string" || nativeTurnRecordRunId.length === 0 || typeof rootRunId !== "string" || typeof run.trace_id !== "string" || typeof run.dotted_order !== "string" || run.trace_id !== rootRunId || !input.turnEvidence.childRunIds.includes(run.id) || typeof run.parent_run_id !== "string") {
    return false;
  }
  const turnPath = turnRecordPath(context.stateFilePath, context.sessionId, nativeTurnRecordRunId);
  const turn = readTurnRecord(turnPath);
  if (!turn || turn.origin !== context.recordOrigin || turn.root?.run_id !== nativeTurnRecordRunId)
    return false;
  const sourceRef = claudeRunSnapshotSourceRef(nativeTurnRecordRunId, run.id);
  const reconstruction = {
    turnId: input.turnId,
    eventId: `${run.id}${CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX}`,
    sourceRefs: [sourceRef],
    privacyMode: "full",
    turnEvidence: input.turnEvidence,
    sourceSnapshots: [
      {
        sourceRef,
        sourceAgeStartedAtMs: runStartTime(run.start_time, run.id),
        submission: source
      }
    ]
  };
  const metadata = buildCodingAgentMetadata(source.metadata);
  if (!recordRun({
    path: turnPath,
    run: { ...run, project_name: context.project, extra: { metadata } },
    tracing: "full",
    origin: context.recordOrigin,
    shared: true
  })) {
    return false;
  }
  try {
    const queued = await context.session.queueReconstruction(reconstruction);
    if (queued.status !== "published" && queued.status !== "duplicate") {
      throw new Error(`Could not queue run ${run.id}: ${queued.status}`);
    }
  } catch (err) {
    if (!await context.session.readSavedReconstructionWake(err, reconstruction))
      throw err;
    warn(`Run ${run.id} was saved but its worker wake failed: ${err}`);
  }
  return true;
}
function runStartTime(value, runId) {
  const startTime = typeof value === "number" ? value : typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (!Number.isSafeInteger(startTime) || startTime < 0)
    throw new TypeError(`Run ${runId} has an invalid start time`);
  return startTime;
}
function claudeRunSnapshotSourceRef(nativeTurnRecordRunId, runId) {
  return `${nativeTurnRecordRunId}${CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR}${runId}${CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX}`;
}
function nativeTurnRecordRunIdFromSourceRef(sourceRef) {
  if (!sourceRef.endsWith(CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX))
    return void 0;
  const identity = sourceRef.slice(0, -CLAUDE_RUN_SNAPSHOT_EVENT_SUFFIX.length);
  const separator = identity.indexOf(CLAUDE_RUN_SNAPSHOT_SOURCE_SEPARATOR);
  if (separator <= 0 || separator === identity.length - 1)
    return void 0;
  return identity.slice(0, separator);
}
function runSnapshotForMode(run, mode) {
  const projected = runConfigForMode(run, mode);
  if (mode === "full")
    return projected;
  const metadata = projected.extra?.metadata;
  return { ...projected, extra: metadata === void 0 ? {} : { metadata } };
}
async function acknowledgeClaudeSharedDeliveries(context, config, sessionId) {
  const recordDirectory = turnRecordDir(config.stateFilePath, sessionId);
  const origin = queueOrigin(config);
  const paths = listTurnRecords(recordDirectory);
  if (paths.length === 0)
    return;
  const captures = await context.captureStore.enumerate(CLAUDE_CODE_INTEGRATION, sessionId);
  for (const path3 of paths) {
    const turn = readTurnRecord(path3);
    if (!turn || turn.origin !== origin)
      continue;
    const recordedRuns = [...turn.root ? [turn.root] : [], ...turn.children];
    for (const run of recordedRuns) {
      if (!run.shared)
        continue;
      const matching = captures.filter(({ record }) => record.integration === CLAUDE_CODE_INTEGRATION && record.sessionId === sessionId && record.runId === run.run_id && record.destinationFingerprint === context.accountFingerprint && (record.eventId === run.run_id || record.eventKind === CLAUDE_SETTLEMENT_EVENT_KIND)).sort((left, right) => left.capturedAtMs - right.capturedAtMs);
      for (const { record } of matching) {
        const scope = {
          integration: record.integration,
          sessionId: record.sessionId,
          turnId: record.turnId,
          eventId: record.eventId
        };
        const outcomes = await Promise.all(context.destinations.map((destination) => context.captureStore.readOutcome(scope, destination.id)));
        if (outcomes.length === 0 || !outcomes.every((outcome) => outcome.status === "settled" && outcome.receipt.outcome === "delivered"))
          continue;
        const attribution = repositoryMetadataFromCapture(record.metadataProvenance);
        if (Object.keys(attribution).length > 0 && !recordResolvedMetadata(turn.path, run.run_id, attribution, origin)) {
          warn(`Could not save resolved repository metadata for run ${run.run_id}`);
          break;
        }
      }
      if (turn.root?.run_id !== run.run_id && !turn.delivered.has(run.run_id)) {
        const postedCapture = matching.find(({ record }) => record.eventId === run.run_id && record.runId === run.run_id);
        if (postedCapture) {
          const { record } = postedCapture;
          const scope = {
            integration: record.integration,
            sessionId: record.sessionId,
            turnId: record.turnId,
            eventId: record.eventId
          };
          const outcomes = await Promise.all(context.destinations.map((destination) => context.captureStore.readOutcome(scope, destination.id)));
          if (outcomes.length > 0 && outcomes.every((outcome) => outcome.status === "settled" && outcome.receipt.outcome === "delivered")) {
            recordDelivered(turn.path, run.run_id, origin);
          }
        }
      }
    }
  }
}
function repositoryMetadataFromCapture(value) {
  if (!isRecord4(value))
    return {};
  const metadata = buildCodingAgentMetadata(value);
  return Object.fromEntries(REPOSITORY_METADATA_KEYS.flatMap((key) => typeof metadata[key] === "string" ? [[key, metadata[key]]] : []));
}
function writerOptionsForConfig(config) {
  const replicas2 = (config.replicas ?? []).map(replicaConfig);
  if (replicas2.some((replica) => replica === void 0)) {
    throw new TypeError("LangSmith replica configuration is invalid");
  }
  if (!config.apiKey.trim() && replicas2.length === 0)
    return void 0;
  return {
    destinations: [
      {
        apiKey: config.apiKey,
        apiUrl: config.apiBaseUrl,
        projectName: config.project
      }
    ],
    ...replicas2.length === 0 ? {} : { replicas: replicas2 },
    redact: config.redact,
    ...config.redactExtraRules === void 0 ? {} : { redactExtraRules: config.redactExtraRules }
  };
}
function replicaConfig(candidate) {
  let source;
  if (Array.isArray(candidate)) {
    if (typeof candidate[0] !== "string" || !candidate[0].trim())
      return void 0;
    source = isRecord4(candidate[1]) ? candidate[1] : {};
    return {
      projectName: candidate[0],
      ...Object.keys(source).length === 0 ? {} : { updates: source }
    };
  } else if (isRecord4(candidate)) {
    source = candidate;
  } else {
    return void 0;
  }
  const apiKey = source.apiKey ?? source.api_key;
  const apiUrl = source.apiUrl ?? source.api_url;
  const projectName = source.projectName ?? source.project_name ?? source.project;
  const workspaceId = source.workspaceId ?? source.workspace_id;
  if (apiKey !== void 0 && (typeof apiKey !== "string" || !apiKey.trim()))
    return void 0;
  if (apiUrl !== void 0 && (typeof apiUrl !== "string" || !apiUrl.trim()))
    return void 0;
  if (projectName !== void 0 && (typeof projectName !== "string" || !projectName.trim()))
    return void 0;
  if (workspaceId !== void 0 && (typeof workspaceId !== "string" || !workspaceId.trim()))
    return void 0;
  if (source.updates !== void 0 && !isRecord4(source.updates))
    return void 0;
  const allowed = /* @__PURE__ */ new Set([
    "apiKey",
    "api_key",
    "apiUrl",
    "api_url",
    "projectName",
    "project_name",
    "project",
    "workspaceId",
    "workspace_id",
    "updates"
  ]);
  if (Object.keys(source).some((key) => !allowed.has(key)))
    return void 0;
  return {
    ...typeof apiKey === "string" ? { apiKey } : {},
    ...typeof apiUrl === "string" ? { apiUrl } : {},
    ...typeof projectName === "string" ? { projectName } : {},
    ...workspaceId === void 0 ? {} : { workspaceId },
    ...isRecord4(source.updates) ? { updates: source.updates } : {}
  };
}
function isRecord4(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
async function reconstructClaudeTool(job) {
  if (job.sourceRefs.length !== 1 || job.sourceSnapshots?.length !== 1)
    throw new Error("Claude tool reconstruction needs one source snapshot");
  const [sourceRef] = job.sourceRefs;
  const snapshot = job.sourceSnapshots[0];
  const source = snapshot.submission;
  if (source.operation !== "post")
    throw new Error("Claude tool source snapshots must be posts");
  const run = source.run;
  if (snapshot.sourceRef !== sourceRef || source.privacyMode !== job.privacyMode || run.run_type !== "tool" || sourceRef !== `${run.id}${CLAUDE_TOOL_SNAPSHOT_EVENT_SUFFIX}` || job.eventId !== `${run.id}${CLAUDE_TOOL_RECONSTRUCTION_EVENT_SUFFIX}` || job.turnEvidence.rootRunId !== void 0 && run.parent_run_id !== job.turnEvidence.rootRunId || !job.turnEvidence.childRunIds.includes(run.id)) {
    throw new Error("Claude tool snapshot does not match its reconstruction job");
  }
  const attributionContext = snapshot.attributionContext;
  if (job.privacyMode === "metadata") {
    return { status: "ready", outputs: [{ eventId: run.id, sourceRef, submission: source }] };
  }
  if (!attributionContext)
    throw new Error("Claude tool attribution context is missing");
  const baseWithPins = withPinnedRepositoryKeys(source.metadata.base, attributionContext.pinnedRepositoryKeys);
  const base = job.privacyMode === "full" ? settledRepositoryMetadata(baseWithPins, attributionContext.toolOrigin, source.metadata.runSpecific) : void 0;
  const metadata = {
    ...source.metadata,
    ...base === void 0 ? {} : { base }
  };
  const submission = {
    ...source,
    metadata
  };
  return {
    status: "ready",
    outputs: [{ eventId: run.id, sourceRef, submission }]
  };
}
function reconstructClaudeRun(job, context) {
  if (job.sourceRefs.length !== 1 || job.sourceSnapshots?.length !== 1)
    throw new Error("Claude run reconstruction needs one source snapshot");
  const [sourceRef] = job.sourceRefs;
  const nativeTurnRecordRunId = nativeTurnRecordRunIdFromSourceRef(sourceRef);
  const snapshot = job.sourceSnapshots[0];
  const source = snapshot.submission;
  if (source.operation !== "post")
    throw new Error("Claude run source snapshots must be posts");
  const run = source.run;
  if (job.privacyMode !== "full" || source.privacyMode !== "full" || nativeTurnRecordRunId === void 0 || snapshot.sourceRef !== sourceRef || sourceRef !== claudeRunSnapshotSourceRef(nativeTurnRecordRunId, run.id) || job.eventId !== `${run.id}${CLAUDE_RUN_RECONSTRUCTION_EVENT_SUFFIX}` || run.run_type !== "llm" && !(run.run_type === "tool" && run.name === "Agent") || typeof run.trace_id !== "string" || typeof run.dotted_order !== "string" || run.trace_id !== job.turnEvidence.rootRunId || !job.turnEvidence.childRunIds.includes(run.id)) {
    throw new Error("Claude run snapshot does not match its reconstruction job");
  }
  const turn = readTurnRecord(turnRecordPath(context.stateFilePath, context.sessionId, nativeTurnRecordRunId));
  if (!turn || turn.origin !== context.recordOrigin || turn.root?.run_id !== nativeTurnRecordRunId) {
    throw new Error("Claude native turn record is missing or invalid");
  }
  const attribution = turnAttributionWithToolOrigins(turn);
  const sourceMetadata = buildCodingAgentMetadata(source.metadata);
  const recorded = {
    run_id: run.id,
    ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
    trace_id: run.trace_id,
    dotted_order: run.dotted_order,
    name: run.name,
    run_type: run.run_type,
    tracing: "full",
    metadata: sourceMetadata
  };
  const filled = attribution ? metadataAfterFill(recorded, attribution) : void 0;
  const additions = Object.fromEntries(REPOSITORY_METADATA_KEYS.flatMap((key) => sourceMetadata[key] === void 0 && typeof filled?.[key] === "string" ? [[key, filled[key]]] : []));
  const submission = Object.keys(additions).length === 0 ? source : {
    ...source,
    metadata: {
      ...source.metadata,
      base: { ...source.metadata.base, ...additions }
    }
  };
  return {
    status: "ready",
    outputs: [
      {
        eventId: run.id,
        sourceRef,
        submission
      }
    ]
  };
}
function turnAttributionWithToolOrigins(record, resolveOrigin = settledRepositoryMetadata) {
  const matched = /* @__PURE__ */ new Set();
  const toolChildren = [];
  const missingToolRuns = [];
  for (const toolOrigin2 of record.toolOrigins) {
    const captured = recordedToolForOrigin(record, toolOrigin2, matched);
    if (captured)
      matched.add(captured.run_id);
    const capturedMetadata = repositoryMetadata(captured?.metadata);
    if (capturedMetadata[REPOSITORY_NAME_KEY] !== void 0) {
      if (captured)
        toolChildren.push(captured);
      continue;
    }
    let resolvedMetadata = toolOrigin2.resolvedMetadata;
    if (resolvedMetadata === void 0) {
      const base = withPinnedRepositoryKeys(record.root?.metadata, toolOrigin2.pinnedRepositoryKeys);
      resolvedMetadata = repositoryMetadata(resolveOrigin(base, toolOrigin2.origin));
      if (!recordResolvedToolOriginMetadata(record.path, record.origin, toolOrigin2.toolUseId, resolvedMetadata)) {
        throw new Error(`Could not save the resolved origin for tool ${toolOrigin2.toolUseId}`);
      }
    }
    const metadata = { ...resolvedMetadata, ...capturedMetadata };
    if (captured) {
      toolChildren.push({
        ...captured,
        metadata: { ...captured.metadata, ...metadata }
      });
    } else if (Object.keys(metadata).length > 0) {
      missingToolRuns.push({
        run_id: `origin-${toolOrigin2.toolUseId}`,
        parent_run_id: record.root?.run_id,
        trace_id: record.root?.trace_id ?? record.root?.run_id ?? "",
        dotted_order: `${record.root?.dotted_order ?? "0"}.${String(toolOrigin2.order).padStart(12, "0")}`,
        name: toolOrigin2.toolName,
        run_type: "tool",
        tracing: "full",
        metadata
      });
    }
  }
  const remainingChildren = record.children.filter((child) => !matched.has(child.run_id)).sort((left, right) => left.dotted_order < right.dotted_order ? -1 : 1);
  return turnAttributionFromOrderedChildren(record, [
    ...toolChildren,
    ...remainingChildren,
    ...missingToolRuns
  ]);
}
function repositoryMetadata(metadata) {
  return Object.fromEntries(REPOSITORY_METADATA_KEYS.flatMap((key) => typeof metadata?.[key] === "string" && metadata[key].length > 0 ? [[key, metadata[key]]] : []));
}
function recordedToolForOrigin(record, origin, alreadyMatched) {
  const byId = record.children.find((child) => child.run_type === "tool" && child.toolUseId === origin.toolUseId);
  if (byId && !alreadyMatched.has(byId.run_id))
    return byId;
  return record.children.filter((child) => child.run_type === "tool" && child.toolUseId === void 0 && !alreadyMatched.has(child.run_id) && (child.name === origin.toolName || child.metadata.ls_tool_name === origin.toolName)).sort((left, right) => left.dotted_order < right.dotted_order ? -1 : 1)[0];
}
function withPinnedRepositoryKeys(base, keys) {
  if (base === void 0 || keys === void 0)
    return base;
  const result = { ...base };
  Object.defineProperty(result, PINNED_REPOSITORY_KEYS, { value: new Set(keys) });
  return result;
}

// dist/src/hooks/flush-queue.js
function flusherClient(config) {
  const anonymizer = config.redact ? createSecretAnonymizer(config.redactExtraRules ? { extraRules: config.redactExtraRules } : void 0) : void 0;
  return new Client({
    apiKey: config.apiKey || void 0,
    apiUrl: config.apiBaseUrl,
    anonymizer,
    autoBatchTracing: false
  });
}
async function settleTurns(recordDir, config, origin, client2, watch) {
  for (const path3 of listTurnRecords(recordDir)) {
    const record = readTurnRecord(path3);
    if (!record)
      continue;
    if (record.origin !== origin) {
      debug(`Leaving ${path3} alone: it was traced for a different LangSmith account`);
      continue;
    }
    try {
      await reconcileAndClear({ record, client: client2, replicas: config.replicas, watch });
    } catch (err) {
      warn(`Could not settle the repository on ${path3}: ${err}`);
    }
  }
  discardDirIfEmpty(recordDir);
}
async function drainSession(session, config, cwd, origin, activeSessionId, activeProjectName) {
  const dir = join22(queueDir(config.stateFilePath), session);
  const flushTarget = `${dir}.flush`;
  if (!tryAcquireLock(flushTarget)) {
    debug(`Another flusher already owns ${dir}`);
    return;
  }
  const queueBefore = new Set(readQueue(dir).map((entry) => entry.queue_id));
  const client2 = flusherClient(config);
  const watch = watchUploads(client2);
  const records = join22(turnRecordRoot(config.stateFilePath), session);
  try {
    const contexts = /* @__PURE__ */ new Map();
    const getContext = (projectConfig, routeCwd, sessionId, projectName) => {
      const key = `${sessionId}\0${projectName}\0${routeCwd}`;
      const existing = contexts.get(key);
      if (existing)
        return existing;
      const created = createClaudeTracingSession(projectConfig, routeCwd, sessionId, projectName);
      if (created)
        contexts.set(key, created);
      return created;
    };
    await importLegacyQueueEntries({
      config,
      dir,
      origin,
      createContext: getContext
    });
    if (activeSessionId && activeProjectName) {
      getContext({ ...config, project: activeProjectName }, cwd, activeSessionId, activeProjectName);
    }
    for (const route of listLegacySessionRoutes(config.stateFilePath, origin, session)) {
      getContext({ ...config, project: route.projectName }, route.cwd, route.sessionId, route.projectName);
    }
    for (const context of contexts.values()) {
      const result = await context.session.drain();
      if (result === "scope-mismatch") {
        debug(`Leaving shared captures for ${context.sessionId} alone after an account change`);
      } else {
        await acknowledgeClaudeSharedDeliveries(context, config, context.sessionId);
      }
    }
    discardEmptyQueue(dir);
    await settleTurns(records, config, origin, client2, watch);
  } finally {
    releaseLock(flushTarget);
  }
  const queueAfter = readQueue(dir);
  if (!queueAfter.some((entry) => queueBefore.has(entry.queue_id)) && queueAfter.some((entry) => !queueBefore.has(entry.queue_id)) && queueAfter[0]?.origin === origin) {
    await drainSession(session, config, cwd, origin, activeSessionId, activeProjectName);
  }
}
function looksAbandoned(session, stateFilePath) {
  const queued = join22(queueDir(stateFilePath), session);
  if (foreignQueueLooksAbandoned(queued))
    return true;
  return recordsIdleMs(join22(turnRecordRoot(stateFilePath), session)) >= FOREIGN_QUEUE_MIN_RECORD_AGE_MS;
}
async function main(cwd, sessionId, projectName) {
  const config = initHook(cwd);
  if (!config)
    return;
  if (sessionId) {
    const context = createClaudeTracingSession(config, cwd, sessionId, projectName);
    if (context) {
      try {
        await context.session.drain();
      } catch (err) {
        warn(`Could not drain shared captures for ${sessionId}: ${err}`);
      }
    }
  }
  const own = sessionId ? safeName(sessionId) : void 0;
  const origin = queueOrigin(config);
  const sessions = /* @__PURE__ */ new Set([
    ...listQueues(config.stateFilePath),
    ...listRecordedSessions(config.stateFilePath)
  ]);
  if (own)
    sessions.add(own);
  for (const session of [...sessions].sort()) {
    if (session !== own && !looksAbandoned(session, config.stateFilePath)) {
      debug(`Not flushing ${session}, which another session may still be writing to`);
      discardEmptyQueue(join22(queueDir(config.stateFilePath), session));
      continue;
    }
    try {
      await drainSession(session, config, cwd, origin, session === own ? sessionId : void 0, session === own ? projectName ?? config.project : void 0);
    } catch (err) {
      warn(`Could not flush ${session}: ${err}`);
    }
  }
}

// dist/src/tracing-policy.js
import { randomUUID as randomUUID7 } from "node:crypto";
import { lstatSync as lstatSync2, readFileSync as readFileSync9 } from "node:fs";
import { mkdir as mkdir5, open as open2, rename as rename3, rmdir as rmdir2, unlink as unlink6 } from "node:fs/promises";
import { dirname as dirname10 } from "node:path";
import { performance as performance3 } from "node:perf_hooks";
import { setTimeout as delay2 } from "node:timers/promises";
function isMode(value) {
  return value === "full" || value === "metadata";
}
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasCode(error2, code) {
  return isObject(error2) && error2.code === code;
}
function readPolicy(path3) {
  let raw;
  try {
    raw = readFileSync9(path3, "utf8");
  } catch (error2) {
    if (hasCode(error2, "ENOENT")) {
      try {
        lstatSync2(path3);
      } catch (statError) {
        if (hasCode(statError, "ENOENT"))
          return { threads: {} };
        throw statError;
      }
    }
    throw error2;
  }
  const value = JSON.parse(raw);
  if (!isObject(value) || !isObject(value.threads) || Object.values(value.threads).some((mode) => !isMode(mode)) || Object.keys(value).some((key) => key !== "threads")) {
    throw new Error("Invalid tracing preference format");
  }
  return value;
}
function tracingPolicyPath(stateFilePath) {
  return `${stateFilePath.replace(/\.json$/, "")}.privacy.json`;
}
function getThreadTracingMode(stateFilePath, sessionId, defaultMuted = false) {
  try {
    const policy = readPolicy(tracingPolicyPath(stateFilePath));
    if (Object.hasOwn(policy.threads, sessionId))
      return policy.threads[sessionId];
    return defaultMuted ? "metadata" : "full";
  } catch {
    return "metadata";
  }
}
function parseTracingCommand(prompt) {
  if (prompt === "/langsmith-tracing:mute")
    return "mute";
  if (prompt === "/langsmith-tracing:unmute")
    return "unmute";
  if (prompt === "/langsmith-tracing:trace")
    return "trace";
  return void 0;
}
async function setThreadTracingMode(stateFilePath, sessionId, mode) {
  if (typeof sessionId !== "string" || !sessionId || !isMode(mode)) {
    throw new Error("A nonempty session ID and a full/metadata tracing mode are required");
  }
  const path3 = tracingPolicyPath(stateFilePath);
  const lockPath2 = `${path3}.lock`;
  await mkdir5(dirname10(path3), { recursive: true });
  const deadline = performance3.now() + 2e3;
  let locked = false;
  while (!locked) {
    try {
      await mkdir5(lockPath2, { mode: 448 });
      locked = true;
    } catch (error2) {
      if (!hasCode(error2, "EEXIST"))
        throw error2;
      if (performance3.now() >= deadline) {
        throw new Error(`Timed out waiting for tracing preference lock ${lockPath2}. Retry; if it persists, remove the lock only after confirming no preference writer is running.`);
      }
      await delay2(10 + Math.random() * 20);
    }
  }
  const warnings = [];
  async function bestEffort(action, message) {
    try {
      await action();
    } catch (error2) {
      warnings.push(`${message}: ${error2 instanceof Error ? error2.message : String(error2)}`);
    }
  }
  let tempPath;
  try {
    let policy;
    try {
      policy = readPolicy(path3);
    } catch (error2) {
      throw new Error(`Cannot read tracing preferences at ${path3}. Refusing to overwrite them; repair the file or its permissions before retrying. No preferences were changed.`, { cause: error2 });
    }
    policy.threads = { ...policy.threads, [sessionId]: mode };
    tempPath = `${path3}.${process.pid}.${randomUUID7()}.tmp`;
    const temp = await open2(tempPath, "wx", 384);
    try {
      await temp.writeFile(`${JSON.stringify(policy)}
`, "utf8");
      await temp.sync();
    } catch (error2) {
      await bestEffort(() => temp.close(), "Temporary file close failed");
      throw error2;
    }
    await temp.close();
    await rename3(tempPath, path3);
    tempPath = void 0;
    await bestEffort(async () => {
      const directory = await open2(dirname10(path3), "r");
      try {
        await directory.sync();
      } finally {
        await bestEffort(() => directory.close(), "Directory close cleanup failed");
      }
    }, "Preference is effective, but crash durability could not be confirmed; retry saving");
  } finally {
    if (tempPath) {
      await bestEffort(() => unlink6(tempPath), "Temporary file cleanup failed");
    }
    await bestEffort(() => rmdir2(lockPath2), `Preference lock cleanup failed at ${lockPath2}. Before retrying, remove the lock only after confirming no preference writer is running`);
  }
  return warnings.length ? { warning: warnings.join("; ") } : {};
}

// dist/src/tracing-mode.js
function resolveTurnTracingMode(config, sessionId, ...snapshots) {
  const { stateFilePath, defaultMuted } = typeof config === "string" ? { stateFilePath: config } : config;
  return snapshots.find((mode) => mode !== void 0) ?? getThreadTracingMode(stateFilePath, sessionId, defaultMuted);
}

// dist/src/transcript.js
import { readFileSync as readFileSync10, statSync as statSync7, fstatSync, openSync as openSync2, readSync, closeSync as closeSync2 } from "node:fs";
var MAX_FULL_READ_BYTES = 50 * 1024 * 1024;
function readTranscript(filePath, afterLine = -1) {
  let size;
  try {
    size = statSync7(filePath).size;
  } catch {
    return { messages: [], lastLine: afterLine };
  }
  if (size <= MAX_FULL_READ_BYTES) {
    const raw = readFileSync10(filePath, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim() !== "");
    const messages = [];
    let lastLine = afterLine;
    for (let i = 0; i < lines.length; i++) {
      lastLine = i;
      if (i <= afterLine)
        continue;
      try {
        messages.push(JSON.parse(lines[i]));
      } catch {
      }
    }
    return { messages, lastLine };
  }
  const fd = openSync2(filePath, "r");
  try {
    const chunkSize = 2 * 1024 * 1024;
    const buf = Buffer.alloc(chunkSize);
    const messages = [];
    let lastLine = afterLine;
    let lineIndex = -1;
    let partial = "";
    let bytesRead;
    let pos = 0;
    while ((bytesRead = readSync(fd, buf, 0, chunkSize, pos)) > 0) {
      const chunk = partial + buf.toString("utf-8", 0, bytesRead);
      partial = "";
      const lines = chunk.split("\n");
      partial = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "")
          continue;
        lineIndex++;
        lastLine = lineIndex;
        if (lineIndex <= afterLine)
          continue;
        try {
          messages.push(JSON.parse(trimmed));
        } catch {
        }
      }
      pos += bytesRead;
    }
    if (partial.trim() !== "") {
      lineIndex++;
      lastLine = lineIndex;
      if (lineIndex > afterLine) {
        try {
          messages.push(JSON.parse(partial.trim()));
        } catch {
        }
      }
    }
    return { messages, lastLine };
  } finally {
    closeSync2(fd);
  }
}
function getTranscriptEndLine(filePath) {
  try {
    const size = statSync7(filePath).size;
    if (size === 0)
      return -1;
    if (size <= MAX_FULL_READ_BYTES) {
      const raw = readFileSync10(filePath, "utf-8");
      const lines = raw.split("\n").filter((l) => l.trim() !== "");
      return lines.length > 0 ? lines.length - 1 : -1;
    }
    const fd = openSync2(filePath, "r");
    try {
      const chunkSize = 1024 * 1024;
      const buf = Buffer.alloc(chunkSize);
      let lineCount = 0;
      let bytesRead;
      let pos = 0;
      let partial = "";
      while ((bytesRead = readSync(fd, buf, 0, chunkSize, pos)) > 0) {
        const chunk = partial + buf.toString("utf-8", 0, bytesRead);
        partial = "";
        const lines = chunk.split("\n");
        partial = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim() !== "")
            lineCount++;
        }
        pos += bytesRead;
      }
      if (partial.trim() !== "")
        lineCount++;
      return lineCount > 0 ? lineCount - 1 : -1;
    } finally {
      closeSync2(fd);
    }
  } catch {
    return -1;
  }
}
function readRuntimeVersion(filePath) {
  let fd;
  try {
    fd = openSync2(filePath, "r");
    const size = fstatSync(fd).size;
    if (size === 0)
      return void 0;
    const window2 = 64 * 1024;
    const start = Math.max(0, size - window2);
    const len = size - start;
    const buf = Buffer.alloc(len);
    readSync(fd, buf, 0, len, start);
    const text = buf.toString("utf-8");
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (typeof parsed.version === "string" && parsed.version.length > 0) {
          return parsed.version;
        }
      } catch {
      }
    }
  } catch {
  } finally {
    if (fd !== void 0)
      closeSync2(fd);
  }
  return void 0;
}
function isHumanMessage(msg) {
  if (msg.type !== "user")
    return false;
  if (typeof msg.message.content === "string")
    return true;
  if (Array.isArray(msg.message.content)) {
    return !msg.message.content.some((b) => b.type === "tool_result");
  }
  return false;
}
function isToolResult(msg) {
  if (msg.type !== "user" || !Array.isArray(msg.message.content))
    return false;
  return msg.message.content.some((b) => b.type === "tool_result");
}
function isAssistantMessage(msg) {
  return msg.type === "assistant";
}
function stripModelDateSuffix(model) {
  return model.replace(/-\d{8}$/, "");
}
function resolveProvider(model) {
  const flag = (name) => ["1", "true"].includes((process.env[name] ?? "").toLowerCase());
  if (flag("CLAUDE_CODE_USE_BEDROCK"))
    return "amazon_bedrock";
  if (flag("CLAUDE_CODE_USE_VERTEX"))
    return "google_vertex_ai";
  return /^([a-z0-9-]+\.)?anthropic\.claude/.test(model) ? "amazon_bedrock" : "anthropic";
}
function turnToolInputs(turn) {
  return turn.llmCalls.flatMap((call) => call.toolCalls.map((tool) => tool.tool_use.input));
}
function completedToolUseIds(turns) {
  return turns.flatMap((turn) => turn.llmCalls.flatMap((call) => call.toolCalls.filter((tool) => tool.result !== void 0).map((tool) => tool.tool_use.id)));
}
function mergeAssistantChunks(chunks) {
  if (chunks.length === 0) {
    throw new Error("Cannot merge zero chunks");
  }
  const first = chunks[0];
  const last = chunks[chunks.length - 1];
  const allBlocks = chunks.flatMap((c) => c.message.content);
  const merged = mergeAdjacentTextBlocks(allBlocks);
  return {
    content: merged,
    model: stripModelDateSuffix(first.message.model),
    usage: last.message.usage,
    // SSE usage is cumulative; last chunk has final totals.
    effort: chunks.find((c) => c.effort)?.effort,
    // Only some chunks carry effort; take the first.
    startTime: first.timestamp,
    endTime: last.timestamp
  };
}
function mergeAdjacentTextBlocks(blocks) {
  const result = [];
  let textBuffer = null;
  for (const block of blocks) {
    if (block.type === "text") {
      textBuffer = (textBuffer ?? "") + block.text;
    } else {
      if (textBuffer !== null) {
        result.push({ type: "text", text: textBuffer });
        textBuffer = null;
      }
      result.push(block);
    }
  }
  if (textBuffer !== null) {
    result.push({ type: "text", text: textBuffer });
  }
  return result;
}
function findToolResult(toolUseId, toolResults) {
  for (const msg of toolResults) {
    for (const block of msg.message.content) {
      if (block.type === "tool_result" && block.tool_use_id === toolUseId) {
        const content = typeof block.content === "string" ? block.content : block.content.filter((c) => c.type === "text").map((c) => c.text).join(" ");
        return {
          content,
          timestamp: msg.timestamp,
          agentId: msg.toolUseResult?.agentId
        };
      }
    }
  }
  return void 0;
}
function groupIntoTurns(messages) {
  const turns = [];
  let currentPromptId = null;
  let currentUser = null;
  let assistantChunks = /* @__PURE__ */ new Map();
  let assistantOrder = [];
  let toolResults = [];
  let hasStopReasonEndTurn = false;
  function finalizeTurn(forceIncomplete = false) {
    if (!currentUser)
      return;
    if (assistantChunks.size === 0)
      return;
    const assistantMessages = Array.from(assistantChunks.values()).flat();
    const hasStopReasonField = assistantMessages.some((m) => m.message.stop_reason !== void 0);
    const isComplete = hasStopReasonEndTurn || !forceIncomplete && !hasStopReasonField;
    const llmCalls = [];
    for (const msgId of assistantOrder) {
      const chunks = assistantChunks.get(msgId);
      if (!chunks || chunks.length === 0)
        continue;
      const merged = mergeAssistantChunks(chunks);
      const toolUses = merged.content.filter((b) => b.type === "tool_use");
      const toolCalls = toolUses.map((tu) => {
        const result = findToolResult(tu.id, toolResults);
        return {
          tool_use: tu,
          result: result ? { content: result.content, timestamp: result.timestamp } : void 0,
          agentId: result?.agentId
        };
      });
      llmCalls.push({
        content: merged.content,
        model: merged.model,
        usage: merged.usage,
        effort: merged.effort,
        startTime: merged.startTime,
        endTime: merged.endTime,
        toolCalls
      });
    }
    turns.push({
      userContent: currentUser.message.content,
      userTimestamp: currentUser.timestamp,
      llmCalls,
      isComplete,
      promptId: currentUser.promptId
    });
  }
  for (const msg of messages) {
    if (isHumanMessage(msg)) {
      const isNewTurn = currentUser === null || msg.promptId !== void 0 && msg.promptId !== currentPromptId || msg.promptId === void 0;
      if (isNewTurn) {
        finalizeTurn();
        currentPromptId = msg.promptId;
        currentUser = msg;
        assistantChunks = /* @__PURE__ */ new Map();
        assistantOrder = [];
        toolResults = [];
        hasStopReasonEndTurn = false;
      }
    } else if (isToolResult(msg)) {
      toolResults.push(msg);
    } else if (isAssistantMessage(msg)) {
      const id = msg.message.id ?? "__no_id__";
      if (!assistantChunks.has(id)) {
        assistantChunks.set(id, []);
        assistantOrder.push(id);
      }
      assistantChunks.get(id).push(msg);
      if (msg.message.stop_reason === "end_turn") {
        hasStopReasonEndTurn = true;
      }
    }
  }
  finalizeTurn(true);
  return turns;
}

// dist/src/state.js
import { readFileSync as readFileSync11 } from "node:fs";

// dist/src/utils/locks/state-file-lock.js
async function withStateFileLock(stateFilePath, callback) {
  let callbackCompleted = false;
  let callbackFailed = false;
  let callbackResult;
  let callbackError;
  try {
    return await withFileLock(stateFilePath, async () => {
      try {
        callbackResult = await callback();
        callbackCompleted = true;
        return callbackResult;
      } catch (error2) {
        callbackFailed = true;
        callbackError = error2;
        throw error2;
      }
    });
  } catch (error2) {
    if (callbackFailed) {
      if (error2 !== callbackError)
        warnStateLockReleaseFailure(error2);
      throw callbackError;
    }
    if (callbackCompleted) {
      warnStateLockReleaseFailure(error2);
      return callbackResult;
    }
    throw error2;
  }
}
function warnStateLockReleaseFailure(error2) {
  try {
    console.warn(STATE_LOCK_RELEASE_WARNING, error2);
  } catch {
    return;
  }
}

// dist/src/state.js
function publishState(stateFilePath, state) {
  publishByRename(stateFilePath, JSON.stringify(state, null, 2), STATE_TEMP_SUFFIX, PRIVATE_FILE_MODE);
}
async function atomicUpdateState(stateFilePath, fn) {
  await withStateFileLock(stateFilePath, () => {
    const state = loadState(stateFilePath);
    publishState(stateFilePath, fn(state));
  });
}
function loadState(stateFilePath) {
  try {
    const raw = readFileSync11(stateFilePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function getSessionState(state, sessionId) {
  return state[sessionId] ?? {
    last_line: -1,
    turn_count: 0,
    updated: "",
    task_run_map: {}
  };
}
function advanceToolTracingProgress(session, ids, phase) {
  const modes = { ...session.tool_tracing_modes };
  const progress = { ...session.tool_tracing_progress };
  for (const id of ids) {
    if (!Object.hasOwn(modes, id))
      continue;
    if (progress[id] && progress[id] !== phase) {
      delete modes[id];
      delete progress[id];
    } else {
      progress[id] = phase;
    }
  }
  return { tool_tracing_modes: modes, tool_tracing_progress: progress };
}
var SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
function pruneOldSessions(state, now = Date.now()) {
  const cutoff = now - SESSION_MAX_AGE_MS;
  const pruned = {};
  for (const [sessionId, session] of Object.entries(state)) {
    const updatedMs = session.updated ? new Date(session.updated).getTime() : 0;
    if (updatedMs >= cutoff) {
      pruned[sessionId] = session;
    }
  }
  return pruned;
}
function updateSessionState(state, sessionId, lastLine, turnCount, taskRunMap, currentTurnRunId) {
  const existingSession = state[sessionId] ?? {
    last_line: -1,
    turn_count: 0,
    updated: "",
    task_run_map: {}
  };
  return {
    ...state,
    [sessionId]: {
      ...existingSession,
      last_line: lastLine,
      turn_count: turnCount,
      updated: (/* @__PURE__ */ new Date()).toISOString(),
      task_run_map: taskRunMap ?? existingSession.task_run_map,
      current_turn_run_id: currentTurnRunId !== void 0 ? currentTurnRunId : existingSession.current_turn_run_id
    }
  };
}

// dist/src/metadata.js
function codingAgentMetadataOptions(options) {
  const { sessionId, ...nativeOptions } = options;
  return Object.fromEntries(Object.entries({
    ...nativeOptions,
    ...nativeOptions.base === void 0 ? {} : { base: { ...nativeOptions.base } },
    integration: CLAUDE_CODE_INTEGRATION,
    integrationVersion: TRUSTED_INTEGRATION_VERSION,
    threadId: sessionId
  }).filter(([, value]) => value !== void 0));
}
function codingAgentMetadata(options) {
  return buildCodingAgentMetadata(codingAgentMetadataOptions(options));
}
function skillNameFromTool(toolName, toolInput) {
  if (toolName !== "Skill")
    return void 0;
  const skill = toolInput?.skill;
  return typeof skill === "string" ? skill : void 0;
}

// dist/src/langsmith.js
var client = void 0;
var replicas = void 0;
function metadataOptionsForTurn(options, fill) {
  const filled = fill(codingAgentMetadata(options));
  const base = { ...options.base };
  for (const key of REPOSITORY_METADATA_KEYS) {
    if (base[key] === void 0 && filled[key] !== void 0)
      base[key] = filled[key];
  }
  return codingAgentMetadataOptions({
    ...options,
    ...options.base === void 0 && Object.keys(base).length === 0 ? {} : { base }
  });
}
function initTracing(apiKey, apiUrl, providedReplicas, redact = true, extraRedactionRules) {
  const anonymizer = redact ? createSecretAnonymizer(extraRedactionRules ? { extraRules: extraRedactionRules } : void 0) : void 0;
  client = new Client({ apiKey: apiKey || void 0, apiUrl, anonymizer });
  replicas = providedReplicas;
  return client;
}
async function flushPendingTraces() {
  debug("Awaiting pending trace batches...");
  await Promise.all([
    client?.awaitPendingTraceBatches(),
    RunTree.getSharedClient().awaitPendingTraceBatches()
  ]);
  debug("Trace batches flushed successfully");
}
function generateDottedOrderSegment(time, runId) {
  const iso = typeof time === "string" ? time : new Date(time).toISOString();
  const isoWithMicroseconds = `${iso.slice(0, -1)}000Z`;
  const stripped = isoWithMicroseconds.replace(/[-:.]/g, "");
  return stripped + runId;
}
function runIdFromSegment(segment) {
  const zIdx = segment.indexOf("Z");
  return zIdx >= 0 ? segment.slice(zIdx + 1) : segment;
}
function parseDottedOrder(dottedOrder) {
  const segments = dottedOrder.split(".");
  const traceId = runIdFromSegment(segments[0]);
  const runId = runIdFromSegment(segments[segments.length - 1]);
  return { traceId, runId };
}
function formatContent(blocks) {
  return blocks.map((block) => {
    switch (block.type) {
      case "text":
        return { type: "text", text: block.text };
      case "thinking":
        return { type: "thinking", thinking: block.thinking };
      case "tool_use":
        return { type: "tool_call", name: block.name, args: block.input, id: block.id };
      default:
        return block;
    }
  });
}
function buildUsageMetadata(usage) {
  const input_tokens = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  const output_tokens = usage.output_tokens ?? 0;
  const total_tokens = input_tokens + output_tokens;
  if (total_tokens === 0) {
    return void 0;
  }
  return {
    input_tokens,
    output_tokens,
    total_tokens,
    input_token_details: {
      cache_read: usage.cache_read_input_tokens ?? 0,
      cache_creation: usage.cache_creation_input_tokens ?? 0
    }
  };
}
async function traceTurn(options) {
  const { turn, sessionId, turnNum, project, parentRunId, existingTaskRunMap, tracedToolUseIds, traceId: providedTraceId, parentDottedOrder: providedParentDottedOrder, customMetadata, runtimeVersion, approvalPolicy, agentType = "root", tracing = "full", toolTracingModes, record, hookCwd, captureSharedRun } = options;
  const sessionCwd = typeof customMetadata?.cwd === "string" ? customMetadata.cwd : void 0;
  const modelRunBase = sessionScopedMetadata(customMetadata, hookCwd ?? sessionCwd);
  const turnId = turn.promptId;
  let traceId = providedTraceId;
  let parentDottedOrder = providedParentDottedOrder;
  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  }
  const userContent = typeof turn.userContent === "string" ? [{ type: "text", text: turn.userContent }] : turn.userContent;
  let turnRunId;
  let shouldCreateTurn = false;
  const turnMetadataBase = turnScopedMetadata(customMetadata, turnToolInputs(turn), sessionCwd);
  const filledForTheTurn = attributionFiller(record);
  if (parentRunId) {
    debug(`Using existing run ${parentRunId} as parent for LLM/tool runs`);
    turnRunId = parentRunId;
    if (!traceId || !parentDottedOrder) {
      throw new Error(`Missing trace context when using parentRunId. traceId=${traceId}, parentDottedOrder=${parentDottedOrder}`);
    }
  } else {
    shouldCreateTurn = true;
    turnRunId = uuid7FromTime(turn.userTimestamp);
    traceId = turnRunId;
    parentDottedOrder = generateDottedOrderSegment(turn.userTimestamp, turnRunId);
    debug(`Creating new standalone turn run ${turnRunId}`);
    const rootMetadataInput = {
      sessionId,
      runType: turn.isComplete ? agentType === "subagent" ? "subagent" : "root" : "interrupted",
      base: turnMetadataBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      approvalPolicy,
      agentType
    };
    const rootInputs = { messages: [{ role: "user", content: userContent }] };
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: turnRunId,
        eventId: turnRunId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: metadataOptionsForTurn(rootMetadataInput, filledForTheTurn),
          privacyContext: { status: "running" },
          run: {
            id: turnRunId,
            name: USER_PROMPT_TURN_NAME,
            run_type: "chain",
            inputs: rootInputs,
            start_time: turn.userTimestamp,
            trace_id: traceId,
            dotted_order: parentDottedOrder
          }
        },
        turnEvidence: { rootRunId: turnRunId, childRunIds: [], closureState: "open" }
      }, turnRunId);
      if (!captured)
        throw new Error(`Could not capture shared Claude Turn run ${turnRunId}`);
    } else {
      const runTree = createRunTree({
        client,
        replicas,
        id: turnRunId,
        name: USER_PROMPT_TURN_NAME,
        run_type: "chain",
        inputs: rootInputs,
        project_name: project,
        start_time: turn.userTimestamp,
        trace_id: traceId,
        dotted_order: parentDottedOrder,
        extra: { metadata: codingAgentMetadata(rootMetadataInput) }
      }, tracing);
      await runTree.postRun();
    }
  }
  const accumulatedMessages = [
    { role: "user", content: userContent }
  ];
  const taskRunMap = {
    ...existingTaskRunMap
  };
  const sharedChildRunIds = /* @__PURE__ */ new Set();
  let lastEndTime = turn.userTimestamp;
  for (const llmCall of turn.llmCalls) {
    const assistantContent = formatContent(llmCall.content);
    const assistantRunId = uuid7FromTime(llmCall.startTime);
    const assistantDottedOrderSegment = generateDottedOrderSegment(llmCall.startTime, assistantRunId);
    const assistantDottedOrder = `${parentDottedOrder}.${assistantDottedOrderSegment}`;
    const assistantMetadataInput = {
      sessionId,
      runType: "llm",
      base: modelRunBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      agentType
    };
    const assistantMetadata = filledForTheTurn(codingAgentMetadata(assistantMetadataInput));
    const assistantInputs = { messages: [...accumulatedMessages] };
    if (!captureSharedRun) {
      await createRunTree({
        client,
        replicas,
        id: assistantRunId,
        name: ASSISTANT_RUN_NAME,
        run_type: "llm",
        inputs: assistantInputs,
        project_name: project,
        start_time: llmCall.startTime,
        parent_run_id: turnRunId,
        trace_id: traceId,
        dotted_order: assistantDottedOrder,
        extra: { metadata: assistantMetadata }
      }, tracing).postRun();
    }
    for (const toolCall of llmCall.toolCalls) {
      const toolMode = tracing === "metadata" ? "metadata" : toolTracingModes?.[toolCall.tool_use.id] ?? tracing;
      if (toolCall.agentId && existingTaskRunMap?.[toolCall.agentId]) {
        debug(`Skipping Task tool for agent ${toolCall.agentId} - already traced by PostToolUse`);
        lastEndTime = toolCall.result?.timestamp ?? llmCall.endTime;
        continue;
      }
      if (!toolCall.agentId && tracedToolUseIds?.has(toolCall.tool_use.id)) {
        lastEndTime = toolCall.result?.timestamp ?? llmCall.endTime;
        continue;
      }
      const toolEndTime = toolCall.result?.timestamp ?? llmCall.endTime;
      const toolStartTime = llmCall.endTime <= toolEndTime ? llmCall.endTime : toolEndTime;
      const toolRunId = uuid7FromTime(toolStartTime);
      const toolDottedOrderSegment = generateDottedOrderSegment(toolStartTime, toolRunId);
      const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;
      const toolMetadataInput = {
        sessionId,
        runType: "tool",
        base: repoScopedMetadata(turnMetadataBase, toolCall.tool_use.input, sessionCwd),
        turnId,
        turnNumber: turnNum,
        runtimeVersion,
        agentType,
        toolName: toolCall.tool_use.name,
        runName: toolCall.tool_use.name,
        skillName: skillNameFromTool(toolCall.tool_use.name, toolCall.tool_use.input)
      };
      const toolInputs = { input: toolCall.tool_use.input };
      const toolOutputs = { output: toolCall.result?.content ?? "No result" };
      if (captureSharedRun) {
        const captured = await captureSharedRun({
          turnId: traceId ?? turnRunId,
          eventId: toolRunId,
          submission: {
            operation: "post",
            integration: CLAUDE_CODE_INTEGRATION,
            privacyMode: toolMode,
            metadata: metadataOptionsForTurn(toolMetadataInput, filledForTheTurn),
            privacyContext: { status: "completed" },
            run: {
              id: toolRunId,
              name: toolCall.tool_use.name,
              run_type: "tool",
              inputs: toolInputs,
              outputs: toolOutputs,
              start_time: toolStartTime,
              end_time: toolEndTime,
              parent_run_id: turnRunId,
              trace_id: traceId,
              dotted_order: toolDottedOrder
            }
          },
          turnEvidence: {
            rootRunId: traceId ?? turnRunId,
            childRunIds: [toolRunId],
            closureState: "open"
          }
        });
        if (!captured)
          throw new Error(`Could not capture shared Claude tool run ${toolRunId}`);
        sharedChildRunIds.add(toolRunId);
      } else {
        const runTree = createRunTree({
          client,
          replicas,
          id: toolRunId,
          name: toolCall.tool_use.name,
          run_type: "tool",
          inputs: toolInputs,
          outputs: toolOutputs,
          project_name: project,
          start_time: toolStartTime,
          end_time: toolEndTime,
          parent_run_id: turnRunId,
          trace_id: traceId,
          dotted_order: toolDottedOrder,
          extra: { metadata: codingAgentMetadata(toolMetadataInput) }
        }, toolMode);
        await runTree.postRun();
      }
      if (toolCall.agentId) {
        taskRunMap[toolCall.agentId] = {
          tracing: toolMode,
          run_id: toolRunId,
          dotted_order: toolDottedOrder
        };
        debug(`Task tool ${toolCall.tool_use.id} \u2192 agentId=${toolCall.agentId}, runId=${toolRunId}`);
      }
      lastEndTime = toolEndTime;
    }
    const assistantEndTime = llmCall.toolCalls.length > 0 ? lastEndTime : llmCall.endTime;
    const usageMetadata = buildUsageMetadata(llmCall.usage);
    const closedAssistantMetadataInput = {
      sessionId,
      runType: "llm",
      base: modelRunBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      agentType,
      modelName: llmCall.model,
      usageMetadata,
      runSpecific: {
        ls_provider: resolveProvider(llmCall.model),
        ls_model_name: llmCall.model,
        ls_invocation_params: {
          model: llmCall.model,
          ...llmCall.effort ? { effort: llmCall.effort } : {},
          ...llmCall.usage.service_tier ? { service_tier: llmCall.usage.service_tier } : {}
        },
        ...usageMetadata === void 0 ? {} : { usage_metadata: usageMetadata },
        ...llmCall.synthetic ? { synthetic: true } : {}
      }
    };
    const closedAssistantMetadataOptions = metadataOptionsForTurn(closedAssistantMetadataInput, filledForTheTurn);
    const closedAssistantMetadata = filledForTheTurn(codingAgentMetadata(closedAssistantMetadataInput));
    const settlesLater = record !== void 0 && awaitsTheTurn(closedAssistantMetadata);
    const assistantClose = {
      id: assistantRunId,
      run_type: "llm",
      trace_id: traceId,
      dotted_order: assistantDottedOrder,
      parent_run_id: turnRunId,
      name: ASSISTANT_RUN_NAME,
      project_name: project,
      start_time: llmCall.startTime,
      ...settlesLater ? {} : { end_time: assistantEndTime },
      outputs: {
        messages: [{ role: "assistant", content: assistantContent }]
      },
      extra: { metadata: closedAssistantMetadata }
    };
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: traceId ?? turnRunId,
        eventId: assistantRunId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: closedAssistantMetadataOptions,
          privacyContext: { status: "completed" },
          run: {
            id: assistantRunId,
            name: ASSISTANT_RUN_NAME,
            run_type: "llm",
            inputs: assistantInputs,
            outputs: { messages: [{ role: "assistant", content: assistantContent }] },
            start_time: llmCall.startTime,
            end_time: assistantEndTime,
            parent_run_id: turnRunId,
            trace_id: traceId,
            dotted_order: assistantDottedOrder
          }
        },
        turnEvidence: {
          rootRunId: traceId ?? turnRunId,
          childRunIds: [assistantRunId],
          closureState: "open"
        }
      }, record?.runId ?? (shouldCreateTurn ? turnRunId : void 0));
      if (!captured)
        throw new Error(`Could not capture shared Claude LLM run ${assistantRunId}`);
      sharedChildRunIds.add(assistantRunId);
    } else {
      const runTree = createRunTree({ ...assistantClose, client, replicas }, tracing);
      await runTree.patchRun({ excludeInputs: true });
    }
    if (settlesLater && record && !captureSharedRun) {
      recordRun({
        path: record.path,
        run: assistantClose,
        tracing,
        origin: record.origin,
        closesAt: assistantEndTime
      });
      recordDelivered(record.path, assistantRunId);
    }
    accumulatedMessages.push({ role: "assistant", content: assistantContent });
    for (const tc of llmCall.toolCalls) {
      accumulatedMessages.push({
        role: "tool",
        tool_call_id: tc.tool_use.id,
        content: [{ type: "text", text: tc.result?.content ?? "" }]
      });
    }
    lastEndTime = assistantEndTime;
  }
  if (shouldCreateTurn) {
    const turnOutputs = accumulatedMessages.filter((m) => m.role !== "user");
    const error2 = turn.isComplete ? void 0 : "Interrupted";
    const rootMetadataInput = {
      sessionId,
      runType: turn.isComplete ? agentType === "subagent" ? "subagent" : "root" : "interrupted",
      base: turnMetadataBase,
      turnId,
      turnNumber: turnNum,
      runtimeVersion,
      approvalPolicy,
      agentType
    };
    const outputs = { messages: turnOutputs };
    const endTime = lastEndTime;
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: turnRunId,
        eventId: `${turnRunId}${CLAUDE_TURN_CLOSURE_EVENT_SUFFIX}`,
        submission: {
          operation: "patch",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: metadataOptionsForTurn(rootMetadataInput, filledForTheTurn),
          privacyContext: { status: error2 ? "error" : "completed" },
          run: {
            id: turnRunId,
            name: USER_PROMPT_TURN_NAME,
            run_type: "chain",
            start_time: turn.userTimestamp,
            trace_id: traceId,
            dotted_order: parentDottedOrder
          },
          patch: {
            fields: error2 ? ["outputs", "error", "end_time"] : ["outputs", "end_time"],
            values: { outputs, ...error2 ? { error: error2 } : {}, end_time: endTime }
          }
        },
        turnEvidence: {
          rootRunId: turnRunId,
          childRunIds: [...sharedChildRunIds].sort(),
          closureState: "authoritative"
        }
      });
      if (!captured)
        throw new Error(`Could not capture shared Claude Turn closure ${turnRunId}`);
    } else {
      const runTree = createRunTree({
        client,
        replicas,
        id: turnRunId,
        run_type: "chain",
        trace_id: traceId,
        dotted_order: parentDottedOrder,
        name: USER_PROMPT_TURN_NAME,
        project_name: project,
        start_time: turn.userTimestamp,
        end_time: endTime,
        outputs,
        error: error2,
        extra: { metadata: codingAgentMetadata(rootMetadataInput) }
      }, tracing);
      await runTree.patchRun({ excludeInputs: true });
    }
  }
  const status = turn.isComplete ? "complete" : "interrupted";
  log(`Traced turn ${turnNum}: ${turnRunId} with ${turn.llmCalls.length} LLM call(s) [${status}]`);
  return taskRunMap;
}
async function patchTurnRun(id, result, leaveOpen = false) {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  const metadataInput = {
    sessionId: id.sessionId,
    runType: "error" in result ? "interrupted" : "root",
    base: id.customMetadata,
    turnId: id.turnId,
    turnNumber: id.turnNumber,
    runtimeVersion: id.runtimeVersion,
    approvalPolicy: id.approvalPolicy,
    agentType: "root"
  };
  const endTime = leaveOpen ? void 0 : (/* @__PURE__ */ new Date()).toISOString();
  const patch = "error" in result ? {
    fields: ["error", "end_time"],
    values: { error: result.error, end_time: endTime }
  } : leaveOpen ? {
    fields: ["outputs"],
    values: {
      outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] }
    }
  } : {
    fields: ["outputs", "end_time"],
    values: {
      outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] },
      end_time: endTime
    }
  };
  const metadata = codingAgentMetadata(metadataInput);
  const config = {
    client,
    replicas,
    name: USER_PROMPT_TURN_NAME,
    run_type: "chain",
    project_name: id.project,
    id: id.runId,
    trace_id: id.traceId,
    dotted_order: id.dottedOrder,
    parent_run_id: id.parentRunId,
    start_time: id.startTime,
    ...endTime === void 0 ? {} : { end_time: endTime },
    ..."error" in result ? { error: result.error } : { outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] } },
    extra: {
      metadata
    }
  };
  if (id.captureSharedRun) {
    const captured = await id.captureSharedRun({
      turnId: id.runId,
      eventId: `${id.runId}${"error" in result ? CLAUDE_TURN_CLOSURE_EVENT_SUFFIX : leaveOpen ? CLAUDE_TURN_PROGRESS_EVENT_SUFFIX : CLAUDE_TURN_CLOSURE_EVENT_SUFFIX}`,
      submission: {
        operation: "patch",
        integration: CLAUDE_CODE_INTEGRATION,
        privacyMode: id.tracing ?? "full",
        metadata: codingAgentMetadataOptions(metadataInput),
        privacyContext: {
          status: "error" in result ? "error" : leaveOpen ? "running" : "completed"
        },
        run: {
          id: id.runId,
          name: USER_PROMPT_TURN_NAME,
          run_type: "chain",
          ...id.startTime === void 0 ? {} : { start_time: id.startTime },
          ...id.traceId === void 0 ? {} : { trace_id: id.traceId },
          ...id.dottedOrder === void 0 ? {} : { dotted_order: id.dottedOrder },
          ...id.parentRunId === void 0 ? {} : { parent_run_id: id.parentRunId }
        },
        patch
      },
      turnEvidence: {
        rootRunId: id.runId,
        childRunIds: [...id.sharedChildRunIds ?? []],
        closureState: leaveOpen ? "open" : "authoritative"
      }
    });
    if (!captured)
      throw new Error(`Could not capture shared Claude Turn closure ${id.runId}`);
    return {
      ...config,
      project_name: id.project,
      ...endTime === void 0 ? {} : { end_time: endTime },
      extra: { metadata }
    };
  }
  const runTree = createRunTree(config, id.tracing);
  await runTree.patchRun({ excludeInputs: true });
  return config;
}
function turnIdentityFromOpenTurn(turn, ctx) {
  return {
    sessionId: ctx.sessionId,
    project: ctx.project,
    customMetadata: ctx.customMetadata,
    tracing: turn.tracing ?? "full",
    runId: turn.run_id,
    traceId: turn.trace_id,
    dottedOrder: turn.dotted_order,
    parentRunId: turn.parent_run_id,
    startTime: turn.start_time,
    turnId: turn.turn_id,
    turnNumber: turn.turn_number,
    runtimeVersion: turn.runtime_version,
    approvalPolicy: turn.approval_policy
  };
}
async function completeTurnRun(options) {
  return patchTurnRun(options, { lastAssistantMessage: options.lastAssistantMessage }, options.leaveOpen);
}
async function closeTurnRun(id, error2) {
  await patchTurnRun(id, { error: error2 });
}
async function closeInterruptedTurn(options) {
  const { sessionId, sessionState, transcriptPath, project, stateFilePath, customMetadata, runtimeVersion, approvalPolicy, turn, record, captureSharedRun, getSharedChildRunIds, error: errorMessage = "User interrupt" } = options;
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  if (turn) {
    const recordedChildIds2 = record ? (readTurnRecord(record.path)?.children ?? []).filter((child) => child.shared).map((child) => child.run_id) : [];
    const sharedChildRunIds2 = getSharedChildRunIds ? await getSharedChildRunIds(turn.run_id, turn.run_id, recordedChildIds2) : recordedChildIds2;
    await closeTurnRun({
      ...turnIdentityFromOpenTurn(turn, { sessionId, project, customMetadata }),
      tracing: resolveTurnTracingMode(options, sessionId, turn.tracing),
      runtimeVersion: turn.runtime_version ?? runtimeVersion,
      approvalPolicy: turn.approval_policy ?? approvalPolicy,
      captureSharedRun,
      sharedChildRunIds: sharedChildRunIds2
    }, errorMessage);
    await flushPendingTraces();
    return { lastLine: sessionState.last_line, turnsTraced: 0 };
  }
  const tracing = resolveTurnTracingMode(options, sessionId, sessionState.current_turn_tracing, sessionState.current_turn_run_id ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing : void 0);
  let lastLine = sessionState.last_line;
  let turnsTraced = 0;
  let consumedToolUseIds = [];
  let taskRunMap = sessionState.task_run_map ?? {};
  let turnId;
  const turnNumber = sessionState.current_turn_number;
  if (transcriptPath) {
    try {
      const { messages, lastLine: newLastLine } = readTranscript(transcriptPath, sessionState.last_line);
      if (messages.length > 0) {
        const turns = groupIntoTurns(messages);
        if (turns.length > 0) {
          turnId = turns[turns.length - 1].promptId;
          await traceTurn({
            tracing,
            toolTracingModes: sessionState.tool_tracing_modes ?? {},
            turn: turns[turns.length - 1],
            sessionId,
            turnNum: sessionState.turn_count + 1,
            project,
            parentRunId: sessionState.current_turn_run_id,
            existingTaskRunMap: taskRunMap,
            tracedToolUseIds: new Set(sessionState.traced_tool_use_ids ?? []),
            traceId: sessionState.current_trace_id,
            parentDottedOrder: sessionState.current_dotted_order,
            customMetadata,
            runtimeVersion,
            approvalPolicy,
            record,
            captureSharedRun
          });
          lastLine = newLastLine;
          turnsTraced = 1;
          consumedToolUseIds = completedToolUseIds(turns);
        }
      }
    } catch (err) {
      error(`Failed to trace interrupted turn transcript: ${err}`);
    }
  }
  const freshSession = getSessionState(loadState(stateFilePath), sessionId);
  taskRunMap = { ...taskRunMap, ...freshSession.task_run_map };
  const pendingSubagents = freshSession.pending_subagent_traces ?? [];
  if (pendingSubagents.length > 0) {
    try {
      await tracePendingSubagents({
        tracing,
        sessionId,
        pendingSubagents,
        taskRunMap,
        parentTraceId: sessionState.current_trace_id,
        project,
        customMetadata,
        runtimeVersion,
        turnId,
        turnNumber,
        record,
        captureSharedRun
      });
    } catch (err) {
      error(`Failed to trace pending subagents on interrupt: ${err}`);
    }
  }
  const recordedChildIds = record ? (readTurnRecord(record.path)?.children ?? []).filter((child) => child.shared).map((child) => child.run_id) : [];
  const sharedChildRunIds = getSharedChildRunIds && sessionState.current_turn_run_id ? await getSharedChildRunIds(sessionState.current_turn_run_id, sessionState.current_turn_run_id, recordedChildIds) : recordedChildIds;
  await closeTurnRun({
    sessionId,
    project,
    customMetadata,
    tracing,
    runId: sessionState.current_turn_run_id,
    traceId: sessionState.current_trace_id,
    dottedOrder: sessionState.current_dotted_order,
    parentRunId: sessionState.current_parent_run_id,
    startTime: sessionState.current_turn_start,
    turnNumber: sessionState.current_turn_number,
    runtimeVersion,
    approvalPolicy,
    captureSharedRun,
    sharedChildRunIds
  }, errorMessage);
  await flushPendingTraces();
  return { lastLine, turnsTraced, consumedToolUseIds };
}
async function tracePendingSubagents(options) {
  const { sessionId, pendingSubagents, taskRunMap, parentTraceId, project, customMetadata, runtimeVersion, turnId, turnNumber, keepAgentToolRunOpen, record, captureSharedRun } = options;
  const filledForTheTurn = attributionFiller(record);
  const openedAgentRunIds = [];
  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  }
  if (!parentTraceId) {
    warn("Cannot trace subagents: no parent trace ID");
    return openedAgentRunIds;
  }
  for (const subagent of pendingSubagents) {
    try {
      const taskRunInfo = taskRunMap[subagent.agent_id];
      if (!taskRunInfo) {
        error(`No Agent tool run found for ${subagent.agent_id} - cannot trace subagent`);
        continue;
      }
      const tracing = taskRunInfo.tracing ?? options.tracing ?? "full";
      const parentToolRunId = taskRunInfo.run_id;
      const agentToolDottedOrder = taskRunInfo.dotted_order;
      const toolName = subagent.agent_type || "Agent";
      const deferred = taskRunInfo.deferred;
      debug(`Processing subagent ${toolName} (${subagent.agent_id}) under run ${parentToolRunId}`);
      const { messages: subagentMessages } = readTranscript(subagent.agent_transcript_path, -1);
      const subagentTurns = subagentMessages.length > 0 ? groupIntoTurns(subagentMessages) : [];
      if (subagentTurns.length === 0) {
        debug(`Empty/unreadable subagent transcript: ${subagent.agent_transcript_path}`);
      }
      const subagentStartTime = deferred?.start_time ?? (/* @__PURE__ */ new Date()).toISOString();
      const lastSubagentActivity = subagentTurns.reduce((max, t) => t.llmCalls.reduce((m, c) => c.endTime > m ? c.endTime : m, max), "");
      const deferredEnd = deferred?.end_time ?? "";
      const subagentEndTime = (lastSubagentActivity > deferredEnd ? lastSubagentActivity : deferredEnd) || (/* @__PURE__ */ new Date()).toISOString();
      if (deferred) {
        const agentMetadataInput = {
          sessionId,
          runType: "tool",
          base: customMetadata,
          runtimeVersion,
          turnId,
          turnNumber,
          agentType: "root",
          toolName: "Task",
          runName: "Agent",
          runSpecific: { agent_type: toolName, agent_id: subagent.agent_id }
        };
        const agentInputs = { input: deferred.inputs ?? {} };
        const agentOutputs = { output: deferred.outputs ?? {} };
        const agentEndTime = keepAgentToolRunOpen ? void 0 : subagentEndTime;
        if (captureSharedRun) {
          const captured = await captureSharedRun({
            turnId: parentTraceId,
            eventId: parentToolRunId,
            submission: {
              operation: "post",
              integration: CLAUDE_CODE_INTEGRATION,
              privacyMode: tracing,
              metadata: metadataOptionsForTurn(agentMetadataInput, filledForTheTurn),
              privacyContext: { status: keepAgentToolRunOpen ? "running" : "completed" },
              run: {
                id: parentToolRunId,
                name: "Agent",
                run_type: "tool",
                inputs: agentInputs,
                outputs: agentOutputs,
                start_time: subagentStartTime,
                ...agentEndTime === void 0 ? {} : { end_time: agentEndTime },
                parent_run_id: deferred.parent_run_id,
                trace_id: deferred.trace_id,
                dotted_order: agentToolDottedOrder
              }
            },
            turnEvidence: {
              rootRunId: parentTraceId,
              childRunIds: [parentToolRunId],
              closureState: "open"
            }
          }, record?.runId);
          if (!captured)
            throw new Error(`Could not capture shared Claude Agent run ${parentToolRunId}`);
        } else {
          const runTree = createRunTree({
            client,
            replicas,
            id: parentToolRunId,
            name: "Agent",
            run_type: "tool",
            inputs: agentInputs,
            outputs: agentOutputs,
            project_name: deferred.project_name,
            start_time: subagentStartTime,
            end_time: agentEndTime,
            parent_run_id: deferred.parent_run_id,
            trace_id: deferred.trace_id,
            dotted_order: agentToolDottedOrder,
            extra: { metadata: filledForTheTurn(codingAgentMetadata(agentMetadataInput)) }
          }, tracing);
          await runTree.postRun();
        }
        if (keepAgentToolRunOpen)
          openedAgentRunIds.push(subagent.agent_id);
      }
      if (subagentTurns.length > 0) {
        await traceSubagentChain({
          tracing,
          sessionId,
          project,
          parentRunId: parentToolRunId,
          parentDottedOrder: agentToolDottedOrder,
          parentTraceId,
          subagentId: subagent.agent_id,
          subagentType: toolName,
          chainName: `${toolName} Subagent`,
          subagentTurns,
          startTime: subagentStartTime,
          endTime: subagentEndTime,
          inputs: deferred?.inputs,
          outputs: deferred?.outputs,
          customMetadata,
          runtimeVersion,
          turnId,
          turnNumber,
          record,
          captureSharedRun
        });
      }
    } catch (err) {
      error(`Failed to trace subagent ${subagent.agent_id}: ${err}`);
    }
  }
  return openedAgentRunIds;
}
async function traceSubagentChain(opts) {
  const filledForTheTurn = attributionFiller(opts.record);
  const subagentChainId = uuid7FromTime(opts.startTime);
  const subagentChainDottedOrder = `${opts.parentDottedOrder}.${generateDottedOrderSegment(opts.startTime, subagentChainId)}`;
  const chainMetadataInput = {
    sessionId: opts.sessionId,
    runType: "subagent",
    base: opts.customMetadata,
    runtimeVersion: opts.runtimeVersion,
    turnId: opts.turnId,
    turnNumber: opts.turnNumber,
    agentType: "subagent",
    subagentId: opts.subagentId,
    subagentType: opts.subagentType
  };
  const chainInputs = opts.inputs ?? {};
  const chainOutputs = opts.outputs === void 0 ? {} : { output: opts.outputs };
  if (opts.captureSharedRun) {
    const captured = await opts.captureSharedRun({
      turnId: opts.parentTraceId,
      eventId: subagentChainId,
      submission: {
        operation: "post",
        integration: CLAUDE_CODE_INTEGRATION,
        privacyMode: opts.tracing ?? "full",
        metadata: metadataOptionsForTurn(chainMetadataInput, filledForTheTurn),
        privacyContext: { status: "completed" },
        run: {
          id: subagentChainId,
          name: opts.chainName,
          run_type: "chain",
          inputs: chainInputs,
          outputs: chainOutputs,
          start_time: opts.startTime,
          ...opts.endTime === void 0 ? {} : { end_time: opts.endTime },
          parent_run_id: opts.parentRunId,
          trace_id: opts.parentTraceId,
          dotted_order: subagentChainDottedOrder
        }
      },
      turnEvidence: {
        rootRunId: opts.parentTraceId,
        childRunIds: [subagentChainId],
        closureState: "open"
      }
    });
    if (!captured)
      throw new Error(`Could not capture shared Claude subagent run ${subagentChainId}`);
  } else {
    const runTree = createRunTree({
      client,
      replicas,
      id: subagentChainId,
      name: opts.chainName,
      run_type: "chain",
      inputs: chainInputs,
      outputs: chainOutputs,
      project_name: opts.project,
      start_time: opts.startTime,
      ...opts.endTime === void 0 ? {} : { end_time: opts.endTime },
      parent_run_id: opts.parentRunId,
      trace_id: opts.parentTraceId,
      dotted_order: subagentChainDottedOrder,
      extra: { metadata: filledForTheTurn(codingAgentMetadata(chainMetadataInput)) }
    }, opts.tracing);
    await runTree.postRun();
  }
  for (let i = 0; i < opts.subagentTurns.length; i++) {
    await traceTurn({
      tracing: opts.tracing,
      turn: opts.subagentTurns[i],
      sessionId: opts.sessionId,
      turnNum: i + 1,
      project: opts.project,
      parentRunId: subagentChainId,
      existingTaskRunMap: void 0,
      traceId: opts.parentTraceId,
      parentDottedOrder: subagentChainDottedOrder,
      customMetadata: opts.customMetadata,
      runtimeVersion: opts.runtimeVersion,
      agentType: "subagent",
      record: opts.record,
      captureSharedRun: opts.captureSharedRun
    });
  }
  log(`Traced subagent ${opts.subagentType} (${opts.subagentId}): ${opts.subagentTurns.length} turn(s)`);
}
async function traceWorkflowStage(opts) {
  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  }
  if (!opts.parentTraceId) {
    warn(`Cannot trace workflow stage ${opts.stageAgentId}: no parent trace ID`);
    return;
  }
  const { messages } = readTranscript(opts.transcriptPath, -1);
  const turns = messages.length > 0 ? groupIntoTurns(messages) : [];
  if (turns.length === 0) {
    debug(`Empty/unreadable workflow stage transcript: ${opts.transcriptPath}`);
    return;
  }
  const startTime = turns[0].llmCalls[0]?.startTime ?? turns[0].userTimestamp ?? (/* @__PURE__ */ new Date()).toISOString();
  const endTime = turns.reduce((max, t) => t.llmCalls.reduce((m, c) => c.endTime > m ? c.endTime : m, max), "") || (/* @__PURE__ */ new Date()).toISOString();
  await traceSubagentChain({
    tracing: opts.tracing,
    sessionId: opts.sessionId,
    project: opts.project,
    parentRunId: opts.workflowRun.run_id,
    parentDottedOrder: opts.workflowRun.dotted_order,
    parentTraceId: opts.parentTraceId,
    subagentId: opts.stageAgentId,
    subagentType: opts.stageType,
    chainName: "Workflow step",
    subagentTurns: turns,
    startTime,
    endTime,
    customMetadata: opts.customMetadata,
    runtimeVersion: opts.runtimeVersion,
    turnId: opts.turnId,
    turnNumber: opts.turnNumber,
    record: opts.record,
    captureSharedRun: opts.captureSharedRun
  });
}
async function closeAgentToolRun(options) {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  const deferred = options.taskRunInfo.deferred ?? {};
  const isWorkflow = Boolean(options.taskRunInfo.is_workflow);
  const runName = isWorkflow ? "Workflow" : "Agent";
  const nativeToolName = isWorkflow ? "Workflow" : "Task";
  const agentTypeAlias = isWorkflow ? "Workflow" : options.agentType || "Agent";
  const tracing = options.taskRunInfo.tracing ?? options.tracing ?? "full";
  const metadataInput = {
    sessionId: options.sessionId,
    runType: "tool",
    base: options.customMetadata,
    runtimeVersion: options.runtimeVersion,
    turnId: options.turnId,
    turnNumber: options.turnNumber,
    agentType: "root",
    toolName: nativeToolName,
    runName,
    runSpecific: {
      agent_type: agentTypeAlias,
      agent_id: options.agentId
    }
  };
  const metadata = codingAgentMetadata(metadataInput);
  const run = {
    id: options.taskRunInfo.run_id,
    name: runName,
    run_type: "tool",
    inputs: { input: deferred.inputs ?? {} },
    outputs: { output: deferred.outputs ?? {} },
    start_time: deferred.start_time,
    parent_run_id: deferred.parent_run_id,
    trace_id: deferred.trace_id,
    dotted_order: options.taskRunInfo.dotted_order
  };
  if (options.captureSharedRun) {
    const runId = options.taskRunInfo.run_id;
    const rootRunId = deferred.trace_id ?? runId;
    const endTime = (/* @__PURE__ */ new Date()).toISOString();
    const submission = options.wasOpen ? {
      operation: "patch",
      integration: CLAUDE_CODE_INTEGRATION,
      privacyMode: tracing,
      metadata: codingAgentMetadataOptions(metadataInput),
      privacyContext: { status: options.error ? "error" : "completed" },
      run: {
        id: runId,
        name: runName,
        run_type: "tool",
        ...run.start_time === void 0 ? {} : { start_time: run.start_time },
        ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
        ...run.trace_id === void 0 ? {} : { trace_id: run.trace_id },
        dotted_order: run.dotted_order
      },
      patch: options.error ? {
        fields: ["outputs", "end_time", "error"],
        values: { outputs: run.outputs, end_time: endTime, error: options.error }
      } : {
        fields: ["outputs", "end_time"],
        values: { outputs: run.outputs, end_time: endTime }
      }
    } : {
      operation: "post",
      integration: CLAUDE_CODE_INTEGRATION,
      privacyMode: tracing,
      metadata: codingAgentMetadataOptions(metadataInput),
      privacyContext: { status: options.error ? "error" : "completed" },
      run: {
        id: runId,
        name: runName,
        run_type: "tool",
        inputs: run.inputs,
        outputs: run.outputs,
        ...run.start_time === void 0 ? {} : { start_time: run.start_time },
        end_time: endTime,
        ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
        ...run.trace_id === void 0 ? {} : { trace_id: run.trace_id },
        dotted_order: run.dotted_order,
        ...options.error ? { error: options.error } : {}
      }
    };
    const captured = await options.captureSharedRun({
      turnId: rootRunId,
      eventId: options.wasOpen ? `${runId}${CLAUDE_AGENT_CLOSURE_EVENT_SUFFIX}` : runId,
      submission,
      turnEvidence: { rootRunId, childRunIds: [runId], closureState: "open" }
    }, options.nativeTurnRecordRunId);
    if (!captured)
      throw new Error(`Could not capture shared Claude Agent closure ${runId}`);
    return;
  }
  const runTree = createRunTree({
    client,
    replicas,
    ...run,
    project_name: deferred.project_name ?? options.project,
    end_time: (/* @__PURE__ */ new Date()).toISOString(),
    ...options.error ? { error: options.error } : {},
    extra: { metadata }
  }, tracing);
  if (options.wasOpen) {
    await runTree.patchRun({ excludeInputs: true });
  } else {
    await runTree.postRun();
  }
}

// dist/src/utils/harness.js
function isCursorPayload(input) {
  return typeof input === "object" && input !== null && Object.hasOwn(input, CURSOR_VERSION_FIELD);
}
function isPayloadForHook(input, event2) {
  if (isCursorPayload(input))
    return false;
  const declared = input.hook_event_name;
  return declared === void 0 || declared === event2;
}

// dist/src/utils/stdin.js
function readStdin() {
  return new Promise((resolve16, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => {
      try {
        resolve16(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Failed to parse hook input: ${err}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

// dist/src/hooks/post-compact.js
async function main2() {
  const input = await readStdin();
  if (!isPayloadForHook(input, "PostCompact"))
    return;
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`PostCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);
  const client2 = initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  const endTime = (/* @__PURE__ */ new Date()).toISOString();
  const startTime = sessionState.compaction_start_time ? new Date(sessionState.compaction_start_time).toISOString() : endTime;
  const runId = uuid7FromTime(startTime);
  const segment = generateDottedOrderSegment(startTime, runId);
  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id ?? runId;
  const dottedOrder = sessionState.current_dotted_order ? `${sessionState.current_dotted_order}.${segment}` : segment;
  const tracing = resolveTurnTracingMode(config, input.session_id, sessionState.compaction_tracing, sessionState.current_turn_tracing, sessionState.current_turn_run_id ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing : void 0);
  const metadataInput = {
    sessionId: input.session_id,
    runType: "root",
    base: config.customMetadata,
    turnNumber: sessionState.current_turn_number,
    runtimeVersion: sessionState.runtime_version,
    agentType: "compaction",
    runSpecific: { trigger: input.trigger }
  };
  const metadata = codingAgentMetadata(metadataInput);
  const run = {
    id: runId,
    name: `Context Compaction (${input.trigger})`,
    run_type: "chain",
    inputs: {},
    outputs: { compact_summary: input.compact_summary },
    start_time: startTime,
    end_time: endTime,
    trace_id: traceId,
    dotted_order: dottedOrder,
    ...parentRunId ? { parent_run_id: parentRunId } : {}
  };
  let rootCaptureAvailable = !parentRunId;
  try {
    const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
    if (engine && parentRunId) {
      const rootCapture = await engine.captureStore.read({
        integration: CLAUDE_CODE_INTEGRATION,
        sessionId: input.session_id,
        turnId: parentRunId,
        eventId: parentRunId
      });
      rootCaptureAvailable = rootCapture?.runId === parentRunId && rootCapture.destinationFingerprint === engine.accountFingerprint;
      const record = readTurnRecord(turnRecordPath(config.stateFilePath, input.session_id, parentRunId));
      if (!rootCaptureAvailable && record?.root?.shared) {
        throw new Error(`Could not find shared Turn capture ${parentRunId}`);
      }
    }
    const captureSharedRun = engine ? rootCaptureAvailable ? (capture) => captureClaudeRun(engine, capture) : void 0 : void 0;
    if (captureSharedRun) {
      const rootRunId = parentRunId ?? runId;
      const captured = await captureSharedRun({
        turnId: rootRunId,
        eventId: runId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: "completed" },
          run
        },
        turnEvidence: { rootRunId, childRunIds: [runId], closureState: "open" }
      });
      if (!captured)
        throw new Error(`Could not capture shared Claude compaction run ${runId}`);
    } else {
      const runTree = createRunTree({
        client: client2,
        replicas: config.replicas,
        project_name: config.project,
        ...run,
        extra: { metadata }
      }, tracing);
      await runTree.postRun();
    }
    debug(`Created compaction run ${runId} (${input.trigger})`);
  } catch (err) {
    error(`Failed to create compaction run: ${err}`);
  }
  await flushPendingTraces();
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        compaction_start_time: void 0,
        compaction_tracing: void 0
      }
    };
  });
}

// dist/src/background-runs.js
function recordBackgroundRun(session, turn, backgroundId, entry) {
  const existing = session.open_turns?.[turn.run_id];
  return {
    task_run_map: {
      ...session.task_run_map,
      [backgroundId]: entry
    },
    open_turns: {
      ...session.open_turns,
      [turn.run_id]: {
        ...existing,
        tracing: existing?.tracing ?? turn.tracing,
        run_id: turn.run_id,
        trace_id: turn.trace_id,
        dotted_order: turn.dotted_order,
        parent_run_id: turn.parent_run_id,
        start_time: turn.start_time,
        turn_number: turn.turn_number,
        runtime_version: turn.runtime_version,
        approval_policy: turn.approval_policy,
        stop_seen: existing?.stop_seen ?? false,
        agent_ids: [
          ...(existing?.agent_ids ?? []).filter((id) => id !== backgroundId),
          backgroundId
        ]
      }
    }
  };
}

// dist/src/workflows.js
var WORKFLOW_TOOL_NAME = "Workflow";
var WORKFLOW_SUBAGENT_TYPE = "workflow-subagent";
function detectWorkflowLaunch(toolName, toolResponse) {
  if (toolName !== WORKFLOW_TOOL_NAME)
    return void 0;
  const r = toolResponse;
  if (!r || r.status !== "async_launched" || !r.taskId || !r.runId)
    return void 0;
  return { taskId: r.taskId, runId: r.runId, workflowName: r.workflowName };
}
function workflowRunIdFromPath(path3) {
  return /\/workflows\/(wf_[A-Za-z0-9_-]+)\//.exec(path3)?.[1];
}
function findWorkflowEntry(taskRunMap, runId) {
  for (const [taskId, entry] of Object.entries(taskRunMap ?? {})) {
    if (entry.workflow_run_id === runId)
      return [taskId, entry];
  }
  return void 0;
}
async function handleWorkflowSubagentStop(opts) {
  const runId = workflowRunIdFromPath(opts.agentTranscriptPath);
  if (!runId) {
    error(`workflow-subagent ${opts.agentId}: no workflow run_id in ${opts.agentTranscriptPath}`);
    return;
  }
  const ss = getSessionState(loadState(opts.stateFilePath), opts.sessionId);
  const found = findWorkflowEntry(ss.task_run_map, runId);
  if (!found) {
    debug(`No Workflow run recorded for ${runId}; skipping stage ${opts.agentId}`);
    return;
  }
  const [, entry] = found;
  const deferred = entry.deferred;
  const launchingTurnId = deferred?.parent_run_id;
  const launchingTurn = launchingTurnId ? ss.open_turns?.[launchingTurnId] : void 0;
  const parentTraceId = deferred?.trace_id ?? ss.current_trace_id;
  const record = launchingTurnId && opts.recordOrigin ? {
    path: turnRecordPath(opts.stateFilePath, opts.sessionId, launchingTurnId),
    origin: opts.recordOrigin,
    runId: launchingTurnId
  } : void 0;
  try {
    await traceWorkflowStage({
      tracing: resolveTurnTracingMode(opts, opts.sessionId, entry.tracing, launchingTurn?.tracing, launchingTurnId === ss.current_turn_run_id ? ss.current_turn_tracing : void 0),
      sessionId: opts.sessionId,
      project: opts.project,
      customMetadata: opts.customMetadata,
      workflowRun: { run_id: entry.run_id, dotted_order: entry.dotted_order },
      parentTraceId,
      stageAgentId: opts.agentId,
      stageType: opts.agentType,
      transcriptPath: opts.agentTranscriptPath,
      runtimeVersion: launchingTurn?.runtime_version ?? ss.runtime_version,
      turnId: launchingTurn?.turn_id,
      turnNumber: launchingTurn?.turn_number ?? ss.current_turn_number,
      record,
      captureSharedRun: opts.captureSharedRun
    });
    debug(`Traced workflow stage ${opts.agentId} under Workflow run ${entry.run_id}`);
  } catch (err) {
    error(`Failed to trace workflow stage ${opts.agentId}: ${err}`);
  }
  await flushPendingTraces();
}

// dist/src/hooks/post-tool-use.js
async function main3() {
  const input = await readStdin();
  if (!isPayloadForHook(input, "PostToolUse"))
    return;
  const config = initHook(input.cwd, { deferGit: true });
  if (!config)
    return;
  if (input.agent_id || input.agent_type) {
    debug("Skipping PostToolUse for subagent tool \u2014 Stop hook handles tracing");
    return;
  }
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  const tracing = resolveTurnTracingMode(config, input.session_id, sessionState.tool_tracing_modes?.[input.tool_use_id], sessionState.current_turn_tracing, sessionState.current_turn_run_id ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing : void 0);
  const parentRunId = sessionState.current_turn_run_id;
  const traceId = sessionState.current_trace_id;
  const parentDottedOrder = sessionState.current_dotted_order;
  if (!parentRunId || !traceId || !parentDottedOrder) {
    error("No current_turn_run_id or trace_id in state - UserPromptSubmit hook may not have run");
    return;
  }
  const startTime = sessionState.tool_start_times?.[input.tool_use_id] ?? Date.now();
  const toolRunId = uuid7FromTime(startTime);
  const toolEndTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  const toolEndTimeIso = new Date(toolEndTime).toISOString();
  const toolDottedOrderSegment = generateDottedOrderSegment(startTime, toolRunId);
  const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;
  const agentId = input.tool_response.agentId;
  const workflow = !agentId ? detectWorkflowLaunch(input.tool_name, input.tool_response) : void 0;
  const origin = toolOrigin(input.tool_input, input.cwd);
  const turnRecord = turnRecordPath(config.stateFilePath, input.session_id, parentRunId);
  if (agentId) {
    debug(`Agent tool detected, deferring run creation for ${agentId} -> ${toolRunId}`);
  } else if (workflow) {
    debug(`Workflow tool detected, posting open run for ${workflow.runId} (task ${workflow.taskId}) -> ${toolRunId}`);
    const client2 = initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
    const metadataInput = {
      sessionId: input.session_id,
      runType: "tool",
      base: config.customMetadata,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion: sessionState.runtime_version,
      agentType: "root",
      toolName: "Workflow",
      runName: "Workflow"
    };
    const metadata = codingAgentMetadata(metadataInput);
    const run = {
      id: toolRunId,
      name: "Workflow",
      run_type: "tool",
      inputs: { input: input.tool_input },
      start_time: startTimeIso,
      parent_run_id: parentRunId,
      trace_id: traceId,
      dotted_order: toolDottedOrder
    };
    const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
    const captureSharedRun = engine ? (capture) => captureClaudeRun(engine, capture) : void 0;
    if (captureSharedRun) {
      const captured = await captureSharedRun({
        turnId: parentRunId,
        eventId: toolRunId,
        submission: {
          operation: "post",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: "running" },
          run
        },
        turnEvidence: {
          rootRunId: traceId,
          childRunIds: [toolRunId],
          closureState: "open"
        }
      });
      if (!captured)
        throw new Error(`Could not capture shared Claude Workflow run ${toolRunId}`);
      recordRun({
        path: turnRecord,
        run: { ...run, project_name: config.project, extra: { metadata } },
        tracing,
        origin: queueOrigin(config),
        toolUseId: input.tool_use_id,
        shared: true,
        routing: { cwd: input.cwd }
      });
    } else {
      const runTree = createRunTree({
        client: client2,
        replicas: config.replicas,
        project_name: config.project,
        // No end_time — left open until finalizeNotificationChain closes it.
        ...run,
        extra: { metadata }
      }, tracing);
      await runTree.postRun();
    }
  } else {
    const queued = queueOrigin(config);
    const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
    const existing = readTurnRecord(turnRecord);
    const turnAttributionFallback = tracing === "full" && existing?.origin === queued ? turnAttribution(existing) : void 0;
    const toolMetadata = codingAgentMetadata({
      sessionId: input.session_id,
      runType: "tool",
      base: config.customMetadata,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion: sessionState.runtime_version,
      agentType: "root",
      toolName: input.tool_name,
      runName: input.tool_name,
      skillName: skillNameFromTool(input.tool_name, input.tool_input)
    });
    const settles = tracing === "full" ? origin : void 0;
    const toolRun = {
      id: toolRunId,
      name: input.tool_name,
      run_type: "tool",
      inputs: { input: input.tool_input },
      outputs: { output: input.tool_response },
      project_name: config.project,
      start_time: startTimeIso,
      end_time: toolEndTimeIso,
      parent_run_id: parentRunId,
      trace_id: traceId,
      dotted_order: toolDottedOrder,
      extra: { metadata: toolMetadata }
    };
    if (engine) {
      const childRunIds = /* @__PURE__ */ new Set();
      for (const child of existing?.origin === queued ? existing.children : []) {
        if (child.shared) {
          childRunIds.add(child.run_id);
          continue;
        }
        const stored = await engine.captureStore.read({
          integration: CLAUDE_CODE_INTEGRATION,
          sessionId: input.session_id,
          turnId: parentRunId,
          eventId: child.run_id
        });
        if (stored?.runId === child.run_id && stored.destinationFingerprint === engine.accountFingerprint) {
          childRunIds.add(child.run_id);
          continue;
        }
      }
      childRunIds.add(toolRunId);
      await queueClaudeToolReconstruction(engine, {
        turnId: parentRunId,
        privacyMode: tracing,
        run: {
          id: toolRunId,
          name: input.tool_name,
          run_type: "tool",
          inputs: { input: input.tool_input },
          outputs: { output: input.tool_response },
          start_time: startTimeIso,
          end_time: toolEndTimeIso,
          parent_run_id: parentRunId,
          trace_id: traceId,
          dotted_order: toolDottedOrder
        },
        origin,
        ...tracing === "full" && Object.hasOwn(config.customMetadata ?? {}, PINNED_REPOSITORY_KEYS) ? { pinnedRepositoryKeys: [...pinnedRepositoryKeys(config.customMetadata)].sort() } : {},
        metadata: {
          turnNumber: sessionState.current_turn_number,
          runtimeVersion: sessionState.runtime_version,
          toolName: input.tool_name,
          skillName: skillNameFromTool(input.tool_name, input.tool_input),
          ...tracing === "full" ? { base: config.customMetadata } : {},
          ...tracing === "full" && turnAttributionFallback !== void 0 ? { turnAttributionFallback } : {}
        },
        turnEvidence: {
          rootRunId: parentRunId,
          childRunIds: [...childRunIds],
          closureState: "open"
        }
      });
      recordRun({
        path: turnRecord,
        run: toolRun,
        tracing,
        origin: queued,
        shared: true,
        routing: { cwd: input.cwd },
        toolUseId: input.tool_use_id
      });
    } else {
      recordRun({
        path: turnRecord,
        run: toolRun,
        tracing,
        origin: queued,
        routing: { cwd: input.cwd },
        toolUseId: input.tool_use_id
      });
      await enqueueRun(config.stateFilePath, input.session_id, toolRun, tracing, queued, turnRecord, settles);
      startQueueFlusher(input.cwd, input.session_id, config.project);
    }
  }
  await atomicUpdateState(config.stateFilePath, (freshState) => {
    const freshSession = getSessionState(freshState, input.session_id);
    let backgroundUpdate;
    if (agentId || workflow) {
      const deferred = runConfigForMode({
        trace_id: traceId,
        parent_run_id: parentRunId,
        start_time: startTimeIso,
        end_time: toolEndTimeIso,
        inputs: input.tool_input,
        outputs: input.tool_response,
        project_name: config.project
      }, tracing);
      const launchingTurn = {
        tracing: resolveTurnTracingMode(config, input.session_id, sessionState.current_turn_tracing, sessionState.current_turn_run_id ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing : void 0),
        run_id: parentRunId,
        trace_id: traceId,
        dotted_order: parentDottedOrder,
        parent_run_id: sessionState.current_parent_run_id,
        start_time: sessionState.current_turn_start,
        turn_number: sessionState.current_turn_number,
        runtime_version: sessionState.runtime_version,
        approval_policy: sessionState.approval_policy
      };
      backgroundUpdate = recordBackgroundRun(freshSession, launchingTurn, agentId ?? workflow.taskId, {
        tracing,
        run_id: toolRunId,
        dotted_order: toolDottedOrder,
        deferred,
        ...workflow ? { workflow_run_id: workflow.runId, is_workflow: true, subagent_done: true } : {}
      });
    }
    return {
      ...freshState,
      [input.session_id]: {
        ...freshSession,
        // Don't resurrect a snapshot reclaimed while this hook awaited the SDK
        // (notably by definitive SessionEnd). The local mode still protects this post.
        ...sessionState.tool_tracing_modes?.[input.tool_use_id] !== void 0 && freshSession.tool_tracing_modes?.[input.tool_use_id] === void 0 ? {} : advanceToolTracingProgress({
          ...freshSession,
          tool_tracing_modes: {
            ...freshSession.tool_tracing_modes,
            [input.tool_use_id]: tracing
          }
        }, [input.tool_use_id], "post"),
        last_tool_end_time: toolEndTime,
        ...backgroundUpdate,
        // Mark the tool_use_id traced so traceTurn (Stop) skips re-tracing this
        // tool call from the transcript. A deferred Agent tool is skipped there
        // via its agentId link instead, so it's the one case we don't record —
        // but a Workflow tool call has no agentId, so without this it would get a
        // duplicate "Workflow" tool run next to the open one posted above.
        ...agentId ? {} : {
          traced_tool_use_ids: [...freshSession.traced_tool_use_ids ?? [], input.tool_use_id]
        }
      }
    };
  });
  if (workflow) {
    await flushPendingTraces();
  }
}

// dist/src/hooks/pre-compact.js
async function main4() {
  const input = await readStdin();
  if (!isPayloadForHook(input, "PreCompact"))
    return;
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`PreCompact hook started, session=${input.session_id}, trigger=${input.trigger}`);
  await atomicUpdateState(config.stateFilePath, (state) => {
    const sessionState = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...sessionState,
        compaction_start_time: Date.now(),
        compaction_tracing: resolveTurnTracingMode(config, input.session_id, input.trigger === "manual" ? void 0 : sessionState.current_turn_tracing, input.trigger !== "manual" && sessionState.current_turn_run_id ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing : void 0)
      }
    };
  });
  debug(`Recorded compaction start time for session ${input.session_id}`);
}

// dist/src/hooks/pre-tool-use.js
async function main5() {
  const input = await readStdin();
  if (!isPayloadForHook(input, "PreToolUse"))
    return;
  const config = initHook(input.cwd, { deferGit: true });
  if (!config)
    return;
  const startTime = Date.now();
  debug(`PreToolUse hook: tool=${input.tool_name}, id=${input.tool_use_id}`);
  await atomicUpdateState(config.stateFilePath, (state) => {
    const ss = getSessionState(state, input.session_id);
    return {
      ...state,
      [input.session_id]: {
        ...ss,
        tool_tracing_modes: {
          ...ss.tool_tracing_modes,
          [input.tool_use_id]: resolveTurnTracingMode(config, input.session_id, ss.tool_tracing_modes?.[input.tool_use_id], ss.current_turn_tracing, ss.current_turn_run_id ? ss.open_turns?.[ss.current_turn_run_id]?.tracing : void 0)
        },
        tool_start_times: {
          ...ss.tool_start_times,
          [input.tool_use_id]: startTime
        }
      }
    };
  });
}

// dist/src/hooks/session-end.js
async function main6() {
  const input = await readStdin();
  if (!isPayloadForHook(input, "SessionEnd"))
    return;
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`SessionEnd hook: session=${input.session_id}, reason=${input.reason}`);
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  const openTurns = sessionState.open_turns ?? {};
  const openAgentRuns = Object.entries(sessionState.task_run_map ?? {}).filter(([, e]) => e.subagent_done);
  const hasOpenTurns = Object.keys(openTurns).length > 0;
  const hasOpenAgentRuns = openAgentRuns.length > 0;
  if (!sessionState.current_turn_run_id && !hasOpenTurns && !hasOpenAgentRuns) {
    debug("No open turn run \u2014 nothing to close");
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = s[input.session_id];
      if (!ss)
        return s;
      return {
        ...s,
        [input.session_id]: { ...ss, tool_tracing_modes: {}, tool_tracing_progress: {} }
      };
    });
    return;
  }
  initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
  const captureSharedRun = engine ? (capture, nativeTurnRecordRunId) => captureClaudeRunWithReconstruction(engine, capture, nativeTurnRecordRunId) : void 0;
  const getSharedChildRunIds = engine ? (turnId, rootRunId, recorded) => sharedClaudeChildRunIds(engine, turnId, rootRunId, recorded) : void 0;
  const expandedTranscript = expandHome(input.transcript_path);
  const runtimeVersion = sessionState.runtime_version ?? (expandedTranscript ? readRuntimeVersion(expandedTranscript) : void 0);
  let lastLine = sessionState.last_line;
  let turnsTraced = 0;
  if (sessionState.current_turn_run_id) {
    closeTurnRecord({
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      turnRunId: sessionState.current_turn_run_id
    });
    debug(`Closing interrupted turn run ${sessionState.current_turn_run_id} on session end`);
    try {
      const res = await closeInterruptedTurn({
        defaultMuted: config.defaultMuted,
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandedTranscript,
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy: sessionState.approval_policy,
        record: {
          path: turnRecordPath(config.stateFilePath, input.session_id, sessionState.current_turn_run_id),
          origin: queueOrigin(config),
          runId: sessionState.current_turn_run_id
        },
        captureSharedRun,
        getSharedChildRunIds
      });
      lastLine = res.lastLine;
      turnsTraced = res.turnsTraced;
    } catch (err) {
      error(`Failed to close interrupted turn on session end: ${err}`);
    }
  }
  for (const [agentId, taskRunInfo] of openAgentRuns) {
    const launchingTurnId = taskRunInfo.deferred?.parent_run_id;
    const launchingTurn = launchingTurnId ? openTurns[launchingTurnId] : void 0;
    try {
      await closeAgentToolRun({
        tracing: resolveTurnTracingMode(config, input.session_id, taskRunInfo.tracing, launchingTurn?.tracing, launchingTurnId === sessionState.current_turn_run_id ? sessionState.current_turn_tracing : void 0),
        sessionId: input.session_id,
        agentId,
        agentType: taskRunInfo.agent_type ?? "",
        taskRunInfo,
        project: config.project,
        customMetadata: config.customMetadata,
        runtimeVersion,
        wasOpen: true,
        // subagent_done ⇒ SubagentStop posted it open
        captureSharedRun,
        nativeTurnRecordRunId: launchingTurnId
      });
      debug(`Closed open Agent tool run ${agentId} on session end`);
    } catch (err) {
      error(`Failed to close Agent tool run ${agentId} on session end: ${err}`);
    }
  }
  for (const [turnRunId, entry] of Object.entries(openTurns)) {
    if (turnRunId === sessionState.current_turn_run_id)
      continue;
    closeTurnRecord({
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      turnRunId,
      turnId: entry.turn_id
    });
    try {
      if (entry.stop_seen) {
        const sharedChildRunIds = getSharedChildRunIds ? await getSharedChildRunIds(turnRunId, turnRunId) : [];
        await completeTurnRun({
          ...turnIdentityFromOpenTurn(entry, {
            sessionId: input.session_id,
            project: config.project,
            customMetadata: config.customMetadata
          }),
          tracing: resolveTurnTracingMode(config, input.session_id, entry.tracing),
          lastAssistantMessage: entry.last_assistant_message,
          captureSharedRun,
          sharedChildRunIds
        });
        debug(`Completed deferred turn ${turnRunId} on session end`);
      } else {
        await closeInterruptedTurn({
          defaultMuted: config.defaultMuted,
          sessionId: input.session_id,
          sessionState,
          transcriptPath: expandedTranscript,
          project: config.project,
          stateFilePath: config.stateFilePath,
          customMetadata: config.customMetadata,
          runtimeVersion,
          turn: entry,
          error: "Session ended before turn completed",
          captureSharedRun,
          getSharedChildRunIds
        });
        debug(`Closed interrupted deferred turn ${turnRunId} on session end`);
      }
    } catch (err) {
      error(`Failed to close deferred turn ${turnRunId} on session end: ${err}`);
    }
  }
  await flushPendingTraces();
  startQueueFlusher(input.cwd, input.session_id, config.project);
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        last_line: lastLine,
        turn_count: ss.turn_count + turnsTraced,
        current_turn_tracing: void 0,
        current_turn_run_id: void 0,
        current_trace_id: void 0,
        current_dotted_order: void 0,
        current_parent_run_id: void 0,
        task_run_map: {},
        traced_tool_use_ids: [],
        tool_start_times: {},
        tool_tracing_modes: {},
        tool_tracing_progress: {},
        pending_subagent_traces: [],
        open_turns: {},
        current_notification_agent_id: void 0,
        current_notification_interrupted: void 0,
        notification_done_agents: []
      }
    };
  });
  debug(`Session end cleanup complete (reason=${input.reason})`);
}

// dist/src/finalize.js
async function finalizeNotificationChain(opts) {
  const { stateFilePath, sessionId, project, customMetadata, runtimeVersion } = opts;
  let agentId = opts.agentId;
  let interrupted = opts.interrupted ?? false;
  while (agentId) {
    const ss = getSessionState(loadState(stateFilePath), sessionId);
    const taskRunInfo = ss.task_run_map?.[agentId];
    if (!taskRunInfo) {
      debug(`finalizeNotificationChain: no task run for ${agentId}, stopping`);
      break;
    }
    const launchingTurnId = taskRunInfo.deferred?.parent_run_id;
    const launchingTurn = launchingTurnId ? ss.open_turns?.[launchingTurnId] : void 0;
    const agentType = taskRunInfo.agent_type ?? "";
    const settled = settledFromTurn({
      base: customMetadata,
      stateFilePath,
      sessionId,
      turnRunId: launchingTurnId
    });
    try {
      await closeAgentToolRun({
        tracing: resolveTurnTracingMode(opts, sessionId, taskRunInfo.tracing, launchingTurn?.tracing, launchingTurnId === ss.current_turn_run_id ? ss.current_turn_tracing : void 0),
        sessionId,
        agentId,
        agentType,
        taskRunInfo,
        project,
        customMetadata: settled,
        runtimeVersion,
        turnNumber: launchingTurnId ? ss.open_turns?.[launchingTurnId]?.turn_number : void 0,
        wasOpen: Boolean(taskRunInfo.subagent_done),
        error: interrupted ? taskRunInfo.is_workflow ? "Workflow killed" : "Subagent killed" : void 0,
        captureSharedRun: opts.captureSharedRun,
        nativeTurnRecordRunId: launchingTurnId
      });
    } catch (err) {
      error(`Failed to close Agent tool run for ${agentId}: ${err}`);
    }
    let toComplete;
    let nextAgentId;
    const drainedAgentId = agentId;
    await atomicUpdateState(stateFilePath, (s) => {
      const sess = getSessionState(s, sessionId);
      const openTurns = { ...sess.open_turns };
      const taskRunMap = { ...sess.task_run_map };
      delete taskRunMap[drainedAgentId];
      const entry = launchingTurnId ? openTurns[launchingTurnId] : void 0;
      if (entry) {
        const remaining = entry.agent_ids.filter((id) => id !== drainedAgentId);
        if (remaining.length === 0 && entry.stop_seen) {
          toComplete = entry;
          nextAgentId = entry.notification_for_agent_id;
          if (launchingTurnId)
            delete openTurns[launchingTurnId];
        } else {
          openTurns[launchingTurnId] = { ...entry, agent_ids: remaining };
        }
      }
      return {
        ...s,
        [sessionId]: {
          ...sess,
          open_turns: openTurns,
          task_run_map: taskRunMap
        }
      };
    });
    if (toComplete) {
      closeTurnRecord({
        stateFilePath,
        sessionId,
        turnRunId: toComplete.run_id,
        turnId: toComplete.turn_id
      });
      try {
        const sharedChildRunIds = opts.getSharedChildRunIds ? await opts.getSharedChildRunIds(toComplete.run_id, toComplete.run_id) : [];
        await completeTurnRun({
          ...turnIdentityFromOpenTurn(toComplete, { sessionId, project, customMetadata: settled }),
          tracing: resolveTurnTracingMode(opts, sessionId, toComplete.tracing),
          lastAssistantMessage: toComplete.last_assistant_message,
          captureSharedRun: opts.captureSharedRun,
          sharedChildRunIds
        });
        debug(`Completed launching turn ${toComplete.run_id} after notification chain`);
      } catch (err) {
        error(`Failed to complete launching turn ${toComplete.run_id}: ${err}`);
      }
    }
    agentId = nextAgentId;
    interrupted = false;
  }
  await flushPendingTraces();
}

// dist/src/hooks/stop.js
function recordCompletedToolOrigins(path3, origin, turn, config, sessionId, sessionState, tracing, cwd) {
  const completed = new Set(completedToolUseIds([turn]));
  const pinnedKeys = Object.hasOwn(config.customMetadata ?? {}, PINNED_REPOSITORY_KEYS) ? [...pinnedRepositoryKeys(config.customMetadata)].sort() : void 0;
  let order = 0;
  for (const tool of turn.llmCalls.flatMap((call) => call.toolCalls)) {
    if (!completed.has(tool.tool_use.id)) {
      order++;
      continue;
    }
    const toolMode = resolveTurnTracingMode(config, sessionId, sessionState.tool_tracing_modes?.[tool.tool_use.id], tracing);
    if (!recordToolOrigin(path3, origin, toolMode, {
      toolUseId: tool.tool_use.id,
      toolName: tool.tool_use.name,
      order,
      origin: toolOrigin(tool.tool_use.input, cwd),
      ...toolMode === "full" && pinnedKeys !== void 0 ? { pinnedRepositoryKeys: pinnedKeys } : {}
    })) {
      warn(`Could not record the origin for tool ${tool.tool_use.id}`);
      return tool.tool_use.id;
    }
    order++;
  }
  return void 0;
}
async function main7() {
  const startTime = Date.now();
  const input = await readStdin();
  if (!isPayloadForHook(input, "Stop"))
    return;
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`Stop hook started, session=${input.session_id}`);
  startQueueFlusher(input.cwd, input.session_id, config.project);
  if (input.stop_hook_active) {
    debug("stop_hook_active=true, skipping");
    return;
  }
  const transcriptPath = expandHome(input.transcript_path);
  if (!input.session_id || !transcriptPath) {
    warn(`Invalid input: session=${input.session_id}, transcript=${transcriptPath}`);
    return;
  }
  initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  debug(`Last line: ${sessionState.last_line}, turn count: ${sessionState.turn_count}`);
  const runtimeVersion = sessionState.runtime_version ?? readRuntimeVersion(transcriptPath);
  const approvalPolicy = sessionState.approval_policy ?? input.permission_mode;
  await new Promise((r) => setTimeout(r, 200));
  const { messages, lastLine } = readTranscript(transcriptPath, sessionState.last_line);
  if (messages.length === 0) {
    debug("No new messages");
    if (sessionState.current_turn_run_id) {
      await atomicUpdateState(config.stateFilePath, (s) => {
        const ss = getSessionState(s, input.session_id);
        return {
          ...s,
          [input.session_id]: {
            ...ss,
            current_turn_run_id: void 0,
            current_turn_tracing: void 0
          }
        };
      });
    }
    return;
  }
  log(`Found ${messages.length} new messages`);
  const notifiedBy = sessionState.current_notification_agent_id;
  const notifiedFrom = notifiedBy ? sessionState.task_run_map?.[notifiedBy]?.deferred?.parent_run_id : void 0;
  const sessionMetadata = settledFromTurn({
    base: config.customMetadata,
    stateFilePath: config.stateFilePath,
    sessionId: input.session_id,
    turnRunId: notifiedFrom
  });
  const turns = groupIntoTurns(messages);
  const currentTracing = resolveTurnTracingMode(config, input.session_id, sessionState.current_turn_tracing, sessionState.current_turn_run_id ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing : void 0);
  if (turns.length > 0 && input.last_assistant_message) {
    const lastTurn = turns[turns.length - 1];
    const lastLlm = lastTurn.llmCalls[lastTurn.llmCalls.length - 1];
    if (lastLlm && lastLlm.toolCalls.length > 0) {
      debug("Final LLM response missing from transcript, synthesizing from last_assistant_message");
      const syntheticStart = sessionState.last_tool_end_time ? new Date(sessionState.last_tool_end_time).toISOString() : lastLlm.toolCalls[lastLlm.toolCalls.length - 1].result?.timestamp ?? lastLlm.endTime;
      const syntheticEnd = new Date(startTime).toISOString();
      lastTurn.llmCalls.push({
        content: [{ type: "text", text: input.last_assistant_message }],
        model: lastLlm.model,
        // A request setting, so it carries over like the model. service_tier is a
        // response value with no reading for this call, so it stays absent.
        effort: lastLlm.effort,
        usage: { input_tokens: 0, output_tokens: 0 },
        startTime: syntheticStart,
        endTime: syntheticEnd,
        toolCalls: [],
        synthetic: true
      });
    }
  }
  let tracedTurns = 0;
  let allTaskRunMaps = {};
  const currentRunId = sessionState.current_turn_run_id;
  const currentTraceId = sessionState.current_trace_id;
  const currentDottedOrder = sessionState.current_dotted_order;
  const currentParentRunId = sessionState.current_parent_run_id;
  const currentTurnRecord = currentRunId ? {
    path: turnRecordPath(config.stateFilePath, input.session_id, currentRunId),
    origin: queueOrigin(config),
    runId: currentRunId
  } : void 0;
  const closingTurn = turns[turns.length - 1];
  const existingTurnRecord = currentTurnRecord ? readTurnRecord(currentTurnRecord.path) : void 0;
  const currentRecordIsValid = currentRunId !== void 0 && existingTurnRecord !== void 0 && existingTurnRecord?.origin === currentTurnRecord?.origin && existingTurnRecord.root?.run_id === currentRunId;
  if (currentRunId !== void 0 && currentTracing === "full" && !currentRecordIsValid) {
    error(`Cannot finish full-tracing turn ${currentRunId} without its native turn record`);
    return;
  }
  if (currentTurnRecord && existingTurnRecord && closingTurn && currentRecordIsValid) {
    const failedToolOriginId = recordCompletedToolOrigins(currentTurnRecord.path, currentTurnRecord.origin, closingTurn, config, input.session_id, sessionState, currentTracing, input.cwd);
    if (failedToolOriginId)
      throw new Error(`Could not save tool ${failedToolOriginId}'s repository origin before Stop`);
  }
  const captureSharedRun = engine ? async (capture, nativeTurnRecordRunId) => {
    const source = capture.submission;
    const run = capture.submission.run;
    if (source.operation === "post" && source.privacyMode === "full" && run.run_type === "chain" && run.name === USER_PROMPT_TURN_NAME && run.id === capture.turnEvidence.rootRunId) {
      const rootRunId = run.id;
      if (nativeTurnRecordRunId !== rootRunId)
        return false;
      if (currentRunId !== void 0)
        return false;
      const path3 = turnRecordPath(config.stateFilePath, input.session_id, rootRunId);
      const record = readTurnRecord(path3);
      if (record && (record.origin !== engine.recordOrigin || record.root?.run_id !== rootRunId)) {
        return false;
      }
      if (!await captureClaudeRun(engine, capture))
        return false;
      if (!record && !recordRun({
        path: path3,
        run: {
          ...run,
          project_name: config.project,
          extra: { metadata: buildCodingAgentMetadata(source.metadata) }
        },
        tracing: "full",
        origin: engine.recordOrigin,
        shared: true,
        root: true,
        routing: { cwd: input.cwd }
      })) {
        return false;
      }
      const failedToolOriginId = closingTurn ? recordCompletedToolOrigins(path3, engine.recordOrigin, closingTurn, config, input.session_id, sessionState, currentTracing, input.cwd) : void 0;
      if (failedToolOriginId)
        return false;
      return true;
    }
    if (source.operation === "post" && source.privacyMode === "full" && (run.run_type === "llm" || run.run_type === "tool" && run.name === "Agent")) {
      return queueClaudeRunReconstruction(engine, capture, nativeTurnRecordRunId);
    }
    return captureClaudeRunWithReconstruction(engine, capture, nativeTurnRecordRunId);
  } : void 0;
  const getSharedChildRunIds = engine ? (turnId, rootRunId, recorded) => sharedClaudeChildRunIds(engine, turnId, rootRunId, recorded) : void 0;
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const isLastTurn = i === turns.length - 1;
    const turnNum = sessionState.turn_count + tracedTurns + 1;
    const parentRunId = isLastTurn ? currentRunId : void 0;
    const traceId = isLastTurn ? currentTraceId : void 0;
    const dottedOrder = isLastTurn ? currentDottedOrder : void 0;
    const existingTaskRunMap = isLastTurn ? sessionState.task_run_map : void 0;
    const tracedToolUseIds = isLastTurn ? new Set(sessionState.traced_tool_use_ids ?? []) : void 0;
    const record = isLastTurn ? currentTurnRecord : void 0;
    try {
      const taskRunMap = await traceTurn({
        // Earlier transcript turns have no original snapshot; never backfill them as full.
        tracing: isLastTurn ? currentTracing : "metadata",
        toolTracingModes: sessionState.tool_tracing_modes ?? {},
        turn,
        sessionId: input.session_id,
        turnNum,
        project: config.project,
        customMetadata: sessionMetadata,
        hookCwd: input.cwd,
        runtimeVersion,
        approvalPolicy,
        parentRunId,
        existingTaskRunMap,
        tracedToolUseIds,
        traceId,
        parentDottedOrder: dottedOrder,
        record,
        captureSharedRun
      });
      allTaskRunMaps = { ...allTaskRunMaps, ...taskRunMap };
      tracedTurns++;
    } catch (err) {
      error(`Failed to trace turn ${turnNum}: ${err}`);
      return;
    }
  }
  const freshState = loadState(config.stateFilePath);
  const freshSession = getSessionState(freshState, input.session_id);
  const mergedTaskRunMap = { ...freshSession.task_run_map, ...allTaskRunMaps };
  const lastTurnId = turns[turns.length - 1]?.promptId;
  const closingTurnTools = closingTurn ? turnToolInputs(closingTurn) : [];
  const turnMetadataBase = turnScopedMetadata(sessionMetadata, closingTurnTools, input.cwd);
  const recordedTurn = currentTurnRecord ? readTurnRecord(currentTurnRecord.path) : void 0;
  const turnMetadata = recordedTurn?.origin === currentTurnRecord?.origin ? settledTurnMetadata(turnMetadataBase, recordedTurn) : turnMetadataBase;
  const pendingSubagents = freshSession.pending_subagent_traces || [];
  const processedAgentIds = /* @__PURE__ */ new Set();
  if (pendingSubagents.length > 0) {
    debug(`Processing ${pendingSubagents.length} pending subagent trace(s)`);
    await tracePendingSubagents({
      tracing: currentTracing,
      sessionId: input.session_id,
      pendingSubagents,
      taskRunMap: mergedTaskRunMap,
      parentTraceId: freshSession.current_trace_id,
      project: config.project,
      customMetadata: turnMetadata,
      runtimeVersion,
      turnId: lastTurnId,
      turnNumber: sessionState.current_turn_number,
      record: currentTurnRecord,
      captureSharedRun
    });
    for (const sa of pendingSubagents)
      processedAgentIds.add(sa.agent_id);
  }
  const savedLastLine = tracedTurns > 0 ? lastLine : sessionState.last_line;
  let completeNow = false;
  let notificationToFinalize;
  let notificationInterrupted = false;
  const notifiedWithinTurn = /* @__PURE__ */ new Set();
  const knownAgentIds = Object.keys(sessionState.task_run_map ?? {});
  if (knownAgentIds.length > 0) {
    for (const t of turns) {
      const uc = typeof t.userContent === "string" ? t.userContent : "";
      for (const id of knownAgentIds) {
        if (uc.includes(id))
          notifiedWithinTurn.add(id);
      }
    }
  }
  let doneAgentsToFinalize = [];
  await atomicUpdateState(config.stateFilePath, (latestState) => {
    const latestSession = getSessionState(latestState, input.session_id);
    const updatedState = updateSessionState(
      latestState,
      input.session_id,
      savedLastLine,
      latestSession.turn_count + tracedTurns,
      // Merge any late PostToolUse writes with our traced entries. allTaskRunMaps
      // wins on conflicts since it has the fully resolved data from traceTurn.
      { ...latestSession.task_run_map, ...allTaskRunMaps }
    );
    const s = updatedState[input.session_id];
    if (tracedTurns > 0) {
      Object.assign(s, advanceToolTracingProgress(latestSession, completedToolUseIds(turns), "transcript"));
    }
    const notifAgentId = latestSession.current_notification_agent_id;
    const notifInterrupted = latestSession.current_notification_interrupted ?? false;
    s.pending_subagent_traces = (latestSession.pending_subagent_traces ?? []).filter((sa) => !processedAgentIds.has(sa.agent_id));
    const openTurns = { ...latestSession.open_turns };
    const entry = currentRunId ? openTurns[currentRunId] : void 0;
    if (currentRunId && entry) {
      const remaining = entry.agent_ids.filter((id) => !processedAgentIds.has(id));
      doneAgentsToFinalize = remaining.filter((id) => latestSession.task_run_map?.[id]?.subagent_done && notifiedWithinTurn.has(id));
      if (remaining.length > 0) {
        openTurns[currentRunId] = {
          ...entry,
          agent_ids: remaining,
          stop_seen: true,
          tracing: entry.tracing ?? currentTracing,
          last_assistant_message: (entry.tracing ?? currentTracing) === "metadata" ? MUTED_TRACE_CONTENT : input.last_assistant_message,
          turn_id: lastTurnId,
          // If this turn is itself a task-notification turn that spawned its own
          // background subagent, remember the agent to finalize once it drains.
          notification_for_agent_id: notifAgentId ?? entry.notification_for_agent_id
        };
        debug(`${remaining.length} background subagent(s) in flight, deferring turn completion`);
      } else {
        completeNow = true;
        notificationToFinalize = notifAgentId;
        notificationInterrupted = notifInterrupted;
        delete openTurns[currentRunId];
      }
    } else {
      completeNow = Boolean(currentRunId);
      if (completeNow) {
        notificationToFinalize = notifAgentId;
        notificationInterrupted = notifInterrupted;
      }
    }
    s.open_turns = openTurns;
    s.current_turn_run_id = void 0;
    s.current_turn_tracing = void 0;
    s.current_notification_agent_id = void 0;
    s.current_notification_interrupted = void 0;
    s.traced_tool_use_ids = [];
    s.tool_start_times = {};
    return pruneOldSessions(updatedState);
  });
  let turnRecord;
  let closedTurnRun;
  let leaveTurnOpen = false;
  let rootUsesSharedEngine = false;
  let turnClosureCaptured = false;
  if (completeNow && currentRunId) {
    debug(`Completing Turn run ${currentRunId}`);
    turnRecord = turnRecordPath(config.stateFilePath, input.session_id, currentRunId);
    const record = readTurnRecord(turnRecord);
    const everythingIn = !record || everyChildLanded(record);
    const settled = settledTurnMetadata(turnMetadata, record);
    const undeliveredChildren = record?.children.filter((child) => !record.delivered.has(child.run_id)) ?? [];
    const sharedSettlementOwnsPendingChildren = record?.root?.shared === true && undeliveredChildren.every((child) => child.shared);
    leaveTurnOpen = !everythingIn && awaitsTheTurn(settled) && !sharedSettlementOwnsPendingChildren;
    const rootCapture = engine ? await engine.captureStore.read({
      integration: CLAUDE_CODE_INTEGRATION,
      sessionId: input.session_id,
      turnId: currentRunId,
      eventId: currentRunId
    }) : void 0;
    const rootCaptureAvailable = engine !== void 0 && rootCapture?.runId === currentRunId && rootCapture.destinationFingerprint === engine.accountFingerprint;
    rootUsesSharedEngine = rootCaptureAvailable || record?.root?.shared === true;
    try {
      if (rootUsesSharedEngine) {
        if (!engine || !rootCaptureAvailable) {
          error(`Could not capture shared Turn closure ${currentRunId}: root capture is unavailable`);
        } else {
          const runMetadata2 = {
            sessionId: input.session_id,
            runType: "root",
            base: settled,
            turnId: lastTurnId,
            turnNumber: sessionState.current_turn_number,
            runtimeVersion,
            approvalPolicy,
            agentType: "root"
          };
          const run = {
            id: currentRunId,
            name: USER_PROMPT_TURN_NAME,
            run_type: "chain",
            ...sessionState.current_turn_start === void 0 ? {} : { start_time: sessionState.current_turn_start },
            ...currentTraceId === void 0 ? {} : { trace_id: currentTraceId },
            ...currentDottedOrder === void 0 ? {} : { dotted_order: currentDottedOrder },
            ...currentParentRunId === void 0 ? {} : { parent_run_id: currentParentRunId }
          };
          const outputs = {
            messages: [{ role: "assistant", content: input.last_assistant_message }]
          };
          const endTime = (/* @__PURE__ */ new Date()).toISOString();
          const captured = await captureClaudeRun(engine, {
            turnId: currentRunId,
            eventId: `${currentRunId}${leaveTurnOpen ? CLAUDE_TURN_PROGRESS_EVENT_SUFFIX : CLAUDE_TURN_CLOSURE_EVENT_SUFFIX}`,
            submission: {
              operation: "patch",
              integration: CLAUDE_CODE_INTEGRATION,
              privacyMode: currentTracing,
              metadata: codingAgentMetadataOptions(runMetadata2),
              privacyContext: { status: "completed" },
              run,
              patch: leaveTurnOpen ? { fields: ["outputs"], values: { outputs } } : { fields: ["outputs", "end_time"], values: { outputs, end_time: endTime } }
            },
            turnEvidence: {
              rootRunId: currentRunId,
              childRunIds: await sharedClaudeChildRunIds(engine, currentRunId, currentRunId, record?.origin === queueOrigin(config) ? record.children.filter((child) => child.shared).map((child) => child.run_id) : []),
              closureState: leaveTurnOpen ? "open" : "authoritative"
            }
          });
          if (!captured) {
            error(`Could not capture shared Turn closure ${currentRunId}`);
          } else {
            closedTurnRun = {
              ...run,
              project_name: config.project,
              ...leaveTurnOpen ? {} : { end_time: endTime },
              outputs,
              extra: { metadata: codingAgentMetadata(runMetadata2) }
            };
            turnClosureCaptured = true;
          }
        }
      } else {
        closedTurnRun = await completeTurnRun({
          leaveOpen: leaveTurnOpen,
          tracing: currentTracing,
          sessionId: input.session_id,
          runId: currentRunId,
          traceId: currentTraceId,
          dottedOrder: currentDottedOrder,
          parentRunId: currentParentRunId,
          startTime: sessionState.current_turn_start,
          project: config.project,
          lastAssistantMessage: input.last_assistant_message,
          customMetadata: settled,
          turnId: lastTurnId,
          turnNumber: sessionState.current_turn_number,
          runtimeVersion,
          approvalPolicy
        });
        turnClosureCaptured = closedTurnRun !== void 0;
      }
      if (closedTurnRun)
        debug(`Turn run ${currentRunId} completed`);
    } catch (err) {
      error(`Failed to complete turn run: ${err}`);
    }
  }
  for (const doneAgentId of doneAgentsToFinalize) {
    debug(`Finalizing subagent ${doneAgentId} that finished within its launching turn`);
    await finalizeNotificationChain({
      defaultMuted: config.defaultMuted,
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      project: config.project,
      customMetadata: turnMetadata,
      runtimeVersion,
      agentId: doneAgentId,
      captureSharedRun,
      getSharedChildRunIds
    });
  }
  if (notificationToFinalize && notificationInterrupted) {
    await finalizeNotificationChain({
      defaultMuted: config.defaultMuted,
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      project: config.project,
      customMetadata: sessionMetadata,
      runtimeVersion,
      agentId: notificationToFinalize,
      interrupted: true,
      captureSharedRun,
      getSharedChildRunIds
    });
  } else if (notificationToFinalize) {
    let finalizeNow = false;
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      if (ss.task_run_map?.[notificationToFinalize]?.subagent_done) {
        finalizeNow = true;
        return s;
      }
      return {
        ...s,
        [input.session_id]: {
          ...ss,
          notification_done_agents: [
            ...(ss.notification_done_agents ?? []).filter((id) => id !== notificationToFinalize),
            notificationToFinalize
          ]
        }
      };
    });
    if (finalizeNow) {
      await finalizeNotificationChain({
        defaultMuted: config.defaultMuted,
        stateFilePath: config.stateFilePath,
        sessionId: input.session_id,
        project: config.project,
        customMetadata: sessionMetadata,
        runtimeVersion,
        agentId: notificationToFinalize,
        captureSharedRun,
        getSharedChildRunIds
      });
    }
  }
  await flushPendingTraces();
  if (turnRecord) {
    if (closedTurnRun) {
      recordRun({
        path: turnRecord,
        run: closedTurnRun,
        tracing: currentTracing,
        origin: queueOrigin(config),
        shared: rootUsesSharedEngine,
        root: true,
        closesAt: leaveTurnOpen ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
        routing: { cwd: input.cwd }
      });
    }
    if (turnClosureCaptured)
      recordTurnClosed(turnRecord, lastTurnId);
  }
  if (completeNow && rootUsesSharedEngine && !turnClosureCaptured && currentRunId) {
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      const openTurns = { ...ss.open_turns };
      const existing = openTurns[currentRunId];
      openTurns[currentRunId] = {
        ...existing,
        run_id: currentRunId,
        trace_id: currentTraceId,
        dotted_order: currentDottedOrder,
        parent_run_id: currentParentRunId,
        start_time: sessionState.current_turn_start,
        turn_number: sessionState.current_turn_number,
        turn_id: lastTurnId,
        runtime_version: runtimeVersion,
        approval_policy: approvalPolicy,
        tracing: currentTracing,
        last_assistant_message: currentTracing === "metadata" ? MUTED_TRACE_CONTENT : input.last_assistant_message,
        stop_seen: true,
        agent_ids: existing?.agent_ids ?? [],
        retry_closure: true,
        leave_open: leaveTurnOpen
      };
      return { ...s, [input.session_id]: { ...ss, open_turns: openTurns } };
    });
  }
  startQueueFlusher(input.cwd, input.session_id, config.project);
  const duration = ((Date.now() - startTime) / 1e3).toFixed(1);
  log(`Processed ${tracedTurns} turns in ${duration}s`);
  if (Date.now() - startTime > 18e4) {
    warn(`Hook took ${duration}s (>3min), consider optimizing`);
  }
}

// dist/src/hooks/stop-failure.js
async function main8() {
  const input = await readStdin();
  if (!isPayloadForHook(input, "StopFailure"))
    return;
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`StopFailure hook: session=${input.session_id}, error=${input.error}`);
  const client2 = initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
  const state = loadState(config.stateFilePath);
  const sessionState = getSessionState(state, input.session_id);
  if (!sessionState.current_turn_run_id) {
    debug("No open turn run to close");
    return;
  }
  const errorMessage = input.error_details ? `${input.error}: ${input.error_details}` : input.error;
  const tracing = resolveTurnTracingMode(config, input.session_id, sessionState.current_turn_tracing, sessionState.current_turn_run_id ? sessionState.open_turns?.[sessionState.current_turn_run_id]?.tracing : void 0);
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
  let closed = false;
  try {
    const metadataInput = {
      sessionId: input.session_id,
      runType: "interrupted",
      base: config.customMetadata,
      turnNumber: sessionState.current_turn_number,
      runtimeVersion: sessionState.runtime_version,
      approvalPolicy: sessionState.approval_policy,
      agentType: "root"
    };
    const run = {
      id: sessionState.current_turn_run_id,
      name: USER_PROMPT_TURN_NAME,
      run_type: "chain",
      start_time: sessionState.current_turn_start,
      trace_id: sessionState.current_trace_id,
      dotted_order: sessionState.current_dotted_order,
      parent_run_id: sessionState.current_parent_run_id
    };
    const endTime = (/* @__PURE__ */ new Date()).toISOString();
    let rootCaptureAvailable = false;
    if (engine) {
      const rootCapture = await engine.captureStore.read({
        integration: CLAUDE_CODE_INTEGRATION,
        sessionId: input.session_id,
        turnId: sessionState.current_turn_run_id,
        eventId: sessionState.current_turn_run_id
      });
      rootCaptureAvailable = rootCapture?.runId === sessionState.current_turn_run_id && rootCapture.destinationFingerprint === engine.accountFingerprint;
      const record = readTurnRecord(turnRecordPath(config.stateFilePath, input.session_id, sessionState.current_turn_run_id));
      if (!rootCaptureAvailable && record?.root?.shared) {
        throw new Error(`Could not find shared Turn capture ${sessionState.current_turn_run_id}`);
      }
    }
    if (engine && rootCaptureAvailable) {
      const captured = await captureClaudeRun(engine, {
        turnId: sessionState.current_turn_run_id,
        eventId: `${sessionState.current_turn_run_id}${CLAUDE_TURN_FAILURE_EVENT_SUFFIX}`,
        submission: {
          operation: "patch",
          integration: CLAUDE_CODE_INTEGRATION,
          privacyMode: tracing,
          metadata: codingAgentMetadataOptions(metadataInput),
          privacyContext: { status: "error" },
          run,
          patch: {
            fields: ["error", "end_time"],
            values: { error: errorMessage, end_time: endTime }
          }
        },
        turnEvidence: {
          rootRunId: sessionState.current_turn_run_id,
          childRunIds: await sharedClaudeChildRunIds(engine, sessionState.current_turn_run_id, sessionState.current_turn_run_id),
          closureState: "authoritative"
        }
      });
      if (!captured)
        throw new Error(`Could not capture shared Turn failure ${run.id}`);
    } else {
      const runTree = createRunTree({
        client: client2,
        replicas: config.replicas,
        project_name: config.project,
        ...run,
        end_time: endTime,
        error: errorMessage,
        extra: { metadata: codingAgentMetadata(metadataInput) }
      }, tracing);
      await runTree.patchRun({ excludeInputs: true });
    }
    closed = true;
    debug(`Closed turn run ${sessionState.current_turn_run_id} with error: ${errorMessage}`);
  } catch (err) {
    error(`Failed to close turn run on StopFailure: ${err}`);
  }
  if (closed) {
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      return {
        ...s,
        [input.session_id]: {
          ...ss,
          current_turn_tracing: void 0,
          current_turn_run_id: void 0,
          current_trace_id: void 0,
          current_dotted_order: void 0,
          current_parent_run_id: void 0
        }
      };
    });
  }
  await flushPendingTraces();
}

// dist/src/hooks/subagent-stop.js
async function main9() {
  const input = await readStdin();
  if (!isPayloadForHook(input, "SubagentStop"))
    return;
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`SubagentStop hook: agent_id=${input.agent_id}, type=${input.agent_type}`);
  const agentTranscriptPath = expandHome(input.agent_transcript_path);
  if (!agentTranscriptPath) {
    debug("No agent_transcript_path provided, skipping");
    return;
  }
  initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
  const captureSharedRun = engine ? (capture, nativeTurnRecordRunId) => captureClaudeRunWithReconstruction(engine, capture, nativeTurnRecordRunId) : void 0;
  const getSharedChildRunIds = engine ? (turnId, rootRunId, recorded) => sharedClaudeChildRunIds(engine, turnId, rootRunId, recorded) : void 0;
  if (input.agent_type === WORKFLOW_SUBAGENT_TYPE) {
    await handleWorkflowSubagentStop({
      defaultMuted: config.defaultMuted,
      sessionId: input.session_id,
      agentId: input.agent_id,
      agentType: input.agent_type,
      agentTranscriptPath,
      stateFilePath: config.stateFilePath,
      project: config.project,
      customMetadata: config.customMetadata,
      captureSharedRun,
      recordOrigin: engine?.recordOrigin
    });
    return;
  }
  const sessionState = getSessionState(loadState(config.stateFilePath), input.session_id);
  const taskRunMap = sessionState.task_run_map ?? {};
  const taskRunInfo = taskRunMap[input.agent_id];
  if (!taskRunInfo) {
    await atomicUpdateState(config.stateFilePath, (s) => {
      const ss = getSessionState(s, input.session_id);
      return {
        ...s,
        [input.session_id]: {
          ...ss,
          pending_subagent_traces: [
            ...ss.pending_subagent_traces || [],
            {
              agent_id: input.agent_id,
              agent_type: input.agent_type,
              agent_transcript_path: agentTranscriptPath,
              session_id: input.session_id
            }
          ]
        }
      };
    });
    debug(`Queued subagent ${input.agent_id} for Stop hook (Agent tool run not recorded yet)`);
    return;
  }
  const deferred = taskRunInfo.deferred;
  const turnRunId = deferred?.parent_run_id ?? sessionState.current_turn_run_id;
  const turnTraceId = deferred?.trace_id ?? sessionState.current_trace_id;
  const launchingTurn = turnRunId ? sessionState.open_turns?.[turnRunId] : void 0;
  if (!turnTraceId) {
    debug(`No trace context for subagent ${input.agent_id}, cannot trace`);
    return;
  }
  try {
    await tracePendingSubagents({
      tracing: resolveTurnTracingMode(config, input.session_id, taskRunInfo.tracing, launchingTurn?.tracing, turnRunId === sessionState.current_turn_run_id ? sessionState.current_turn_tracing : void 0),
      sessionId: input.session_id,
      pendingSubagents: [
        {
          agent_id: input.agent_id,
          agent_type: input.agent_type,
          agent_transcript_path: agentTranscriptPath,
          session_id: input.session_id
        }
      ],
      taskRunMap,
      parentTraceId: turnTraceId,
      project: config.project,
      customMetadata: config.customMetadata,
      runtimeVersion: launchingTurn?.runtime_version ?? sessionState.runtime_version,
      turnId: launchingTurn?.turn_id,
      turnNumber: launchingTurn?.turn_number ?? sessionState.current_turn_number,
      // Leave the Agent tool run open — the task-notification turn nests under it.
      keepAgentToolRunOpen: true,
      record: turnRunId ? {
        path: turnRecordPath(config.stateFilePath, input.session_id, turnRunId),
        origin: queueOrigin(config),
        runId: turnRunId
      } : void 0,
      captureSharedRun
    });
    debug(`Traced background subagent ${input.agent_type} (${input.agent_id})`);
  } catch (err) {
    error(`Failed to trace background subagent: ${err}`);
  }
  let finalizeNow = false;
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    const entry = ss.task_run_map?.[input.agent_id];
    const notifDone = (ss.notification_done_agents ?? []).includes(input.agent_id);
    if (notifDone)
      finalizeNow = true;
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        task_run_map: entry ? {
          ...ss.task_run_map,
          [input.agent_id]: {
            ...entry,
            agent_type: input.agent_type || entry.agent_type,
            subagent_done: true
          }
        } : ss.task_run_map,
        notification_done_agents: notifDone ? (ss.notification_done_agents ?? []).filter((id) => id !== input.agent_id) : ss.notification_done_agents
      }
    };
  });
  if (finalizeNow) {
    debug(`Notification already done for ${input.agent_id}; finalizing from SubagentStop`);
    await finalizeNotificationChain({
      defaultMuted: config.defaultMuted,
      stateFilePath: config.stateFilePath,
      sessionId: input.session_id,
      project: config.project,
      customMetadata: config.customMetadata,
      runtimeVersion: launchingTurn?.runtime_version ?? sessionState.runtime_version,
      agentId: input.agent_id,
      captureSharedRun,
      getSharedChildRunIds
    });
  } else {
    debug(`Subagent ${input.agent_id} traced; awaiting task-notification to finalize`);
  }
  await flushPendingTraces();
}

// dist/src/thread-link.js
var LOOKUP_TIMEOUT_MS = 4e3;
function terminalLink(url) {
  const OSC8 = "\x1B]8;;";
  const BEL = "\x07";
  return `${OSC8}${url}${BEL}${url}${OSC8}${BEL}`;
}
async function describeThreadLinks(config, sessionId) {
  if (!config.enabled) {
    return "LangSmith tracing is disabled. Enable it and send a prompt first.";
  }
  const destinations = config.replicas?.length ? config.replicas : [{}];
  const results = await Promise.all(destinations.map(async (replica) => {
    const destination = Array.isArray(replica) ? { projectName: replica[0] } : replica;
    const projectName = destination.projectName ?? config.project;
    const apiKey = destination.apiKey ?? config.apiKey;
    if (!apiKey) {
      return {
        resolved: false,
        line: `${projectName}: No LangSmith API key configured for this destination.`
      };
    }
    try {
      const client2 = new Client({
        apiKey,
        apiUrl: destination.apiUrl ?? config.apiBaseUrl,
        workspaceId: destination.workspaceId,
        timeout_ms: LOOKUP_TIMEOUT_MS,
        callerOptions: {
          // The SDK ignores maxRetries on reads. Throwing here is what stops the retries.
          onFailedResponseHook: async () => {
            throw new Error("Thread link lookup failed");
          }
        }
      });
      const project = await client2.readProject({ projectName });
      const url = new URL(client2.getHostUrl());
      const path3 = ["o", project.tenant_id, "projects", "p", project.id, "t", sessionId];
      url.pathname = `${url.pathname.replace(/\/$/, "")}/${path3.map(encodeURIComponent).join("/")}`;
      return { resolved: true, line: `${projectName}: ${terminalLink(url.href)}` };
    } catch {
      return {
        resolved: false,
        line: `${projectName}: Could not resolve the thread link. Check access and connectivity, then retry.`
      };
    }
  }));
  const lines = results.map((result) => result.line);
  if (results.some((result) => !result.resolved))
    lines.push(`Session ID: ${sessionId}`);
  return lines.join("\n");
}

// dist/src/hooks/user-prompt-submit.js
var KILLED_NOTIFICATION_STATUS = "killed";
async function main10() {
  const hookStartTime = Date.now();
  const input = await readStdin();
  if (!isPayloadForHook(input, "UserPromptSubmit"))
    return;
  const command = parseTracingCommand(input.prompt);
  if (command) {
    let reason;
    try {
      const commandConfig = loadConfig({ cwd: input.cwd });
      if (command === "trace") {
        reason = await describeThreadLinks(commandConfig, input.session_id);
      } else {
        const mode = command === "mute" ? "metadata" : "full";
        const result = await setThreadTracingMode(commandConfig.stateFilePath, input.session_id, mode);
        reason = `Thread tracing ${command === "mute" ? "muted (metadata-only)" : "unmuted (full content)"}. Preference saved for the next turn; the current turn is unchanged.`;
        if (result?.warning)
          reason += ` Warning: ${result.warning}.`;
        if (!commandConfig.enabled) {
          reason += " Master tracing is disabled; this preference does not enable it.";
        } else if (!commandConfig.apiKey && (!commandConfig.replicas || commandConfig.replicas.length === 0)) {
          reason += " Tracing remains inactive until credentials are configured.";
        }
      }
    } catch (err) {
      reason = command === "trace" ? `Could not run the trace command. Session ID: ${input.session_id}. No tracing settings were changed.` : `Could not ${command} thread tracing: ${err instanceof Error ? err.message : String(err)}. Tracing may still be enabled. Command blocked; no model turn was started.`;
    }
    try {
      console.log(JSON.stringify({ decision: "block", reason }));
    } catch (err) {
      error(`Could not write the ${command} command response: ${err}`);
    }
    return;
  }
  const config = initHook(input.cwd);
  if (!config)
    return;
  debug(`UserPromptSubmit hook started, session=${input.session_id}`);
  if (input.agent_id || input.agent_type) {
    debug("Skipping UserPromptSubmit for subagent \u2014 Stop hook handles tracing");
    return;
  }
  const client2 = initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
  const engine = createClaudeTracingSession(config, input.cwd, input.session_id);
  const captureSharedRun = engine ? (capture, nativeTurnRecordRunId) => captureClaudeRunWithReconstruction(engine, capture, nativeTurnRecordRunId) : void 0;
  const getSharedChildRunIds = engine ? (turnId, rootRunId, recorded) => sharedClaudeChildRunIds(engine, turnId, rootRunId, recorded) : void 0;
  const state = loadState(config.stateFilePath);
  if (state[input.session_id] === void 0)
    startQueueFlusher(input.cwd, input.session_id, config.project);
  const sessionState = getSessionState(state, input.session_id);
  const turnMode = getThreadTracingMode(config.stateFilePath, input.session_id, config.defaultMuted);
  const expandedTranscript = expandHome(input.transcript_path);
  const runtimeVersion = (expandedTranscript ? readRuntimeVersion(expandedTranscript) : void 0) ?? sessionState.runtime_version;
  const approvalPolicy = input.permission_mode;
  let interruptedLastLine = sessionState.last_line;
  if (interruptedLastLine === -1 && input.transcript_path) {
    const transcriptPath = expandHome(input.transcript_path);
    const endLine = getTranscriptEndLine(transcriptPath);
    if (endLine > 0) {
      debug(`Fresh state but transcript has ${endLine + 1} lines \u2014 skipping to end`);
      interruptedLastLine = endLine;
    }
  }
  let interruptedTurnsTraced = 0;
  let consumedToolUseIds = [];
  if (sessionState.current_turn_run_id) {
    const supersededNotificationAgentId = sessionState.current_notification_agent_id;
    debug(`Closing stale turn ${sessionState.current_turn_run_id}` + (supersededNotificationAgentId ? " (superseded task-notification)" : " (interrupted)"));
    try {
      const { lastLine, turnsTraced, consumedToolUseIds: consumed } = await closeInterruptedTurn({
        defaultMuted: config.defaultMuted,
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandHome(input.transcript_path),
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy,
        record: {
          path: turnRecordPath(config.stateFilePath, input.session_id, sessionState.current_turn_run_id),
          origin: queueOrigin(config),
          runId: sessionState.current_turn_run_id
        },
        error: supersededNotificationAgentId ? "Superseded by a newer task-notification" : "User interrupt",
        captureSharedRun,
        getSharedChildRunIds
      });
      interruptedLastLine = lastLine;
      interruptedTurnsTraced = turnsTraced;
      consumedToolUseIds = consumed ?? [];
      if (supersededNotificationAgentId) {
        await finalizeNotificationChain({
          defaultMuted: config.defaultMuted,
          stateFilePath: config.stateFilePath,
          sessionId: input.session_id,
          project: config.project,
          customMetadata: config.customMetadata,
          runtimeVersion,
          agentId: supersededNotificationAgentId,
          // Carry the killed marker through this path too, in case the killed
          // subagent's notification turn was itself superseded before its Stop.
          interrupted: sessionState.current_notification_interrupted,
          captureSharedRun,
          getSharedChildRunIds
        });
      }
    } catch (err) {
      error(`Failed to close interrupted turn: ${err}`);
    }
  }
  for (const [turnRunId, turn] of Object.entries(sessionState.open_turns ?? {})) {
    if (!turn.retry_closure)
      continue;
    try {
      const sharedChildRunIds = getSharedChildRunIds ? await getSharedChildRunIds(turnRunId, turnRunId) : [];
      const closedRun = await completeTurnRun({
        ...turnIdentityFromOpenTurn(turn, {
          sessionId: input.session_id,
          project: config.project,
          customMetadata: config.customMetadata
        }),
        tracing: turn.tracing ?? "full",
        lastAssistantMessage: turn.last_assistant_message,
        leaveOpen: turn.leave_open,
        captureSharedRun,
        sharedChildRunIds
      });
      const recordPath = turnRecordPath(config.stateFilePath, input.session_id, turnRunId);
      recordRun({
        path: recordPath,
        run: closedRun,
        tracing: turn.tracing ?? "full",
        origin: queueOrigin(config),
        shared: true,
        root: true,
        ...turn.leave_open ? { closesAt: (/* @__PURE__ */ new Date()).toISOString() } : {},
        routing: { cwd: input.cwd }
      });
      recordTurnClosed(recordPath, turn.turn_id);
      await atomicUpdateState(config.stateFilePath, (s) => {
        const ss = getSessionState(s, input.session_id);
        const openTurns = { ...ss.open_turns };
        if (openTurns[turnRunId]?.retry_closure)
          delete openTurns[turnRunId];
        return { ...s, [input.session_id]: { ...ss, open_turns: openTurns } };
      });
    } catch (err) {
      error(`Failed to retry shared Turn closure ${turnRunId}: ${err}`);
    }
  }
  const turnNum = sessionState.turn_count + interruptedTurnsTraced + 1;
  const startTime = (/* @__PURE__ */ new Date()).toISOString();
  const runId = uuid7FromTime(startTime);
  const segment = generateDottedOrderSegment(startTime, runId);
  let traceId;
  let parentRunId;
  let dottedOrder;
  const notifAgentId = Object.keys(sessionState.task_run_map ?? {}).find((id) => input.prompt.includes(id));
  const agentToolRun = notifAgentId ? sessionState.task_run_map?.[notifAgentId] : void 0;
  const notificationAgentId = agentToolRun ? notifAgentId : void 0;
  const notificationStatus = notificationAgentId ? /<status>([^<]+)<\/status>/.exec(input.prompt)?.[1] : void 0;
  const notificationInterrupted = notificationStatus?.toLowerCase() === KILLED_NOTIFICATION_STATUS;
  if (agentToolRun) {
    traceId = parseDottedOrder(agentToolRun.dotted_order).traceId;
    parentRunId = agentToolRun.run_id;
    dottedOrder = `${agentToolRun.dotted_order}.${segment}`;
    debug(`Task-notification for agent ${notifAgentId}, nesting turn under Agent run ${parentRunId}`);
  } else if (config.parentDottedOrder) {
    const parsed = parseDottedOrder(config.parentDottedOrder);
    traceId = parsed.traceId;
    parentRunId = parsed.runId;
    dottedOrder = `${config.parentDottedOrder}.${segment}`;
    debug(`Nesting under parent run ${parentRunId} (trace ${traceId})`);
  } else {
    traceId = runId;
    parentRunId = void 0;
    dottedOrder = segment;
  }
  const launchingTurnId = agentToolRun?.deferred?.parent_run_id;
  const inherited = settledFromTurn({
    base: config.customMetadata,
    stateFilePath: config.stateFilePath,
    sessionId: input.session_id,
    turnRunId: launchingTurnId
  });
  const rootMetadata = {
    sessionId: input.session_id,
    runType: "root",
    base: inherited,
    turnNumber: turnNum,
    runtimeVersion,
    approvalPolicy,
    agentType: "root"
  };
  const turnRun = {
    client: client2,
    replicas: config.replicas,
    id: runId,
    name: USER_PROMPT_TURN_NAME,
    run_type: "chain",
    inputs: { messages: [{ role: "user", content: input.prompt }] },
    project_name: config.project,
    start_time: startTime,
    trace_id: traceId,
    dotted_order: dottedOrder,
    ...parentRunId ? { parent_run_id: parentRunId } : {},
    extra: {
      metadata: codingAgentMetadata(rootMetadata)
    }
  };
  const sharedRoot = engine ? await captureClaudeRun(engine, {
    turnId: runId,
    eventId: runId,
    submission: {
      operation: "post",
      integration: CLAUDE_CODE_INTEGRATION,
      privacyMode: turnMode,
      metadata: codingAgentMetadataOptions(rootMetadata),
      privacyContext: { status: "running" },
      run: {
        id: runId,
        name: USER_PROMPT_TURN_NAME,
        run_type: "chain",
        inputs: { messages: [{ role: "user", content: input.prompt }] },
        start_time: startTime,
        trace_id: traceId,
        dotted_order: dottedOrder,
        ...parentRunId ? { parent_run_id: parentRunId } : {}
      }
    },
    turnEvidence: { rootRunId: runId, childRunIds: [], closureState: "open" }
  }) : false;
  if (!engine)
    await createRunTree(turnRun, turnMode).postRun();
  else if (!sharedRoot) {
    error(`Could not capture shared Turn run ${runId}`);
    return;
  }
  recordRun({
    path: turnRecordPath(config.stateFilePath, input.session_id, runId),
    run: turnRun,
    tracing: turnMode,
    origin: queueOrigin(config),
    root: true,
    shared: engine !== void 0,
    routing: { cwd: input.cwd }
  });
  debug(`Created initial run ${runId} for turn ${turnNum}`);
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    const inflightAgentIds = new Set(Object.values(ss.open_turns ?? {}).flatMap((t) => t.agent_ids));
    const preservedTaskRunMap = Object.fromEntries(Object.entries(ss.task_run_map ?? {}).filter(([id]) => inflightAgentIds.has(id)));
    const preservedOpenTurns = { ...ss.open_turns };
    if (sessionState.current_turn_run_id) {
      delete preservedOpenTurns[sessionState.current_turn_run_id];
    }
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        current_turn_tracing: turnMode,
        current_turn_run_id: runId,
        current_trace_id: traceId,
        current_dotted_order: dottedOrder,
        current_parent_run_id: parentRunId,
        current_turn_number: turnNum,
        current_turn_start: startTime,
        // If this is a task-notification turn, record the agent it's for so Stop
        // closes that agent's tool run + launching turn once this turn completes.
        current_notification_agent_id: notificationAgentId,
        current_notification_interrupted: notificationInterrupted,
        // Persisted so the closing hooks can stamp them onto their runs.
        approval_policy: approvalPolicy,
        ...runtimeVersion ? { runtime_version: runtimeVersion } : {},
        // Advance past the interrupted turn's messages so Stop doesn't re-trace them
        last_line: interruptedLastLine,
        ...advanceToolTracingProgress(ss, consumedToolUseIds, "transcript"),
        turn_count: ss.turn_count + interruptedTurnsTraced,
        // Clear this turn's stale data, but keep still-running background subagents
        // and any Agent tool runs left open awaiting their task-notification.
        task_run_map: preservedTaskRunMap,
        traced_tool_use_ids: [],
        tool_start_times: {},
        pending_subagent_traces: [],
        open_turns: preservedOpenTurns,
        notification_done_agents: ss.notification_done_agents
      }
    };
  });
  const duration = ((Date.now() - hookStartTime) / 1e3).toFixed(1);
  debug(`UserPromptSubmit hook completed in ${duration}s`);
}

// dist/src/hooks/registry.js
var HOOK_HANDLERS = {
  UserPromptSubmit: main10,
  PreToolUse: main5,
  PostToolUse: main3,
  Stop: main7,
  StopFailure: main8,
  SubagentStop: main9,
  PreCompact: main4,
  PostCompact: main2,
  SessionEnd: main6
};

// dist/src/hooks/dispatch.js
var EXECUTABLE_NAME = binary.target.executableName;
var USAGE = `Usage:
  ${EXECUTABLE_NAME} <HookEventName>
  ${EXECUTABLE_NAME} --version

Options:
  --help, -h     Show this help and exit
  --version, -v  Print the installed version and exit`;
var argument = process.argv[2];
var event = HOOK_EVENT_NAMES.find((name) => name === argument);
if (argument === "--help" || argument === "-h") {
  console.log(USAGE);
} else if (argument === "--version" || argument === "-v") {
  console.log(LS_INTEGRATION_VERSION ?? "development");
} else if (argument === FLUSH_QUEUE_ARG) {
  const [cwd, sessionId, projectName] = process.argv.slice(3);
  void runHookEntry(FLUSH_QUEUE_ARG, () => main(cwd ?? process.cwd(), sessionId, projectName));
} else if (event) {
  void runHookEntry(event, HOOK_HANDLERS[event]);
} else if (argument?.startsWith("-")) {
  console.error(`unknown option: ${argument}`);
  console.error(USAGE);
  process.exitCode = 1;
} else {
  initLogger(false);
  error(`Unknown hook event: ${argument ?? "(none)"}`);
}
