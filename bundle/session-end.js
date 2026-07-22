#!/usr/bin/env node
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
        (val) => new Promise((resolve) => {
          resolve(onFinally());
        }).then(() => val),
        (err) => new Promise((resolve) => {
          resolve(onFinally());
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
    var pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
      if (typeof milliseconds !== "number" || milliseconds < 0) {
        throw new TypeError("Expected `milliseconds` to be a positive number");
      }
      if (milliseconds === Infinity) {
        resolve(promise);
        return;
      }
      const timer = setTimeout(() => {
        if (typeof fallback === "function") {
          try {
            resolve(fallback());
          } catch (error2) {
            reject(error2);
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
        promise.then(resolve, reject),
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
        return new Promise((resolve, reject) => {
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
              resolve(await operation);
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
        return new Promise((resolve) => {
          const existingResolve = this._resolveEmpty;
          this._resolveEmpty = () => {
            existingResolve();
            resolve();
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
        return new Promise((resolve) => {
          const existingResolve = this._resolveIdle;
          this._resolveIdle = () => {
            existingResolve();
            resolve();
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

// dist/logger.js
import { appendFileSync, mkdirSync, statSync, renameSync } from "node:fs";
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
    if (statSync(LOG_FILE).size >= MAX_LOG_BYTES) {
      renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  } catch {
  }
}
function write(level, message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").replace("Z", "");
  const line = `${timestamp} [${level}] ${message}
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/regex.js
var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default = validate;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/parse.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr2, offset = 0) {
  return (byteToHex[arr2[offset + 0]] + byteToHex[arr2[offset + 1]] + byteToHex[arr2[offset + 2]] + byteToHex[arr2[offset + 3]] + "-" + byteToHex[arr2[offset + 4]] + byteToHex[arr2[offset + 5]] + "-" + byteToHex[arr2[offset + 6]] + byteToHex[arr2[offset + 7]] + "-" + byteToHex[arr2[offset + 8]] + byteToHex[arr2[offset + 9]] + "-" + byteToHex[arr2[offset + 10]] + byteToHex[arr2[offset + 11]] + byteToHex[arr2[offset + 12]] + byteToHex[arr2[offset + 13]] + byteToHex[arr2[offset + 14]] + byteToHex[arr2[offset + 15]]).toLowerCase();
}

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/rng.js
var rnds8 = new Uint8Array(16);
function rng() {
  return crypto.getRandomValues(rnds8);
}

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/v4.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/sha1.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/v35.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/v5.js
function v5(value, namespace, buf, offset) {
  return v35(80, sha1_default, value, namespace, buf, offset);
}
v5.DNS = DNS;
v5.URL = URL2;
var v5_default = v5;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/uuid/src/v7.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/experimental/otel/constants.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/env.js
var globalEnv;
var isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
var isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
var isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");
var isDeno = () => typeof Deno !== "undefined";
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
    if (typeof value === "string" && !excluded.includes(key) && !key.toLowerCase().includes("key") && !key.toLowerCase().includes("secret") && !key.toLowerCase().includes("token")) {
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
          if ((key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("token")) && typeof value === "string") {
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/singletons/otel.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/experimental/otel/translator.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/is-network-error/index.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/p-retry/index.js
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
    await new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timeoutToken);
        options.signal?.removeEventListener("abort", onAbort);
        reject(options.signal.reason);
      };
      const timeoutToken = setTimeout(() => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve();
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/p-queue.js
var import_p_queue = __toESM(require_dist(), 1);
var PQueue = "default" in import_p_queue.default ? import_p_queue.default.default : import_p_queue.default;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/async_caller.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/messages.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/utils/uuid.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/errors.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/core/error.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/utils/values.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/utils/sleep.js
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/version.js
var VERSION = "0.0.1";

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/detect-platform.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/shims.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/request-options.js
var FallbackEncoder = ({ headers, body }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  };
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/qs/formats.js
var default_format = "RFC3986";
var default_formatter = (v) => String(v);
var formatters = {
  RFC1738: (v) => String(v).replace(/%20/g, "+"),
  RFC3986: default_formatter
};
var RFC1738 = "RFC1738";

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/qs/utils.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/qs/stringify.js
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
function inner_stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder2, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== void 0 && !find_flag) {
    const pos = tmp_sc.get(object);
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
      return encoder2 && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder2(prefix, defaults.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder2) {
      const key_value = encodeValuesOnly ? prefix : encoder2(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder2(obj, defaults.encoder, charset, "value", format))
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
    if (encodeValuesOnly && encoder2) {
      obj = maybe_map(obj, encoder2);
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
    sideChannel.set(object, step);
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
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder2,
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
function stringify(object, opts = {}) {
  let obj = object;
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/utils/query.js
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "comma" });
}

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/utils/log.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/parse.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/core/api-promise.js
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
    super((resolve) => {
      resolve(null);
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/core/pagination.js
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
var OffsetPaginationInsightsClusteringJobs = class extends AbstractPage {
  constructor(client2, response, body, options) {
    super(client2, response, body, options);
    Object.defineProperty(this, "clustering_jobs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.clustering_jobs = body.clustering_jobs || [];
  }
  getPaginatedItems() {
    return this.clustering_jobs ?? [];
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/uploads.js
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
var multipartFormRequestOptions = async (opts, fetch2) => {
  return { ...opts, body: await createForm(opts.body, fetch2) };
};
var supportsFormDataMap = /* @__PURE__ */ new WeakMap();
function supportsFormData(fetchObject) {
  const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
  const cached = supportsFormDataMap.get(fetch2);
  if (cached)
    return cached;
  const promise = (async () => {
    try {
      const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
      const data = new FormData();
      if (data.toString() === await new FetchResponse(data).text()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  })();
  supportsFormDataMap.set(fetch2, promise);
  return promise;
}
var createForm = async (body, fetch2) => {
  if (!await supportsFormData(fetch2)) {
    throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
  }
  const form = new FormData();
  await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value)));
  return form;
};
var isNamedBlob = (value) => value instanceof Blob && "name" in value;
var addFormValue = async (form, key, value) => {
  if (value === void 0)
    return;
  if (value == null) {
    throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    form.append(key, String(value));
  } else if (value instanceof Response) {
    form.append(key, makeFile([await value.blob()], getName(value)));
  } else if (isAsyncIterable(value)) {
    form.append(key, makeFile([await new Response(ReadableStreamFrom(value)).blob()], getName(value)));
  } else if (isNamedBlob(value)) {
    form.append(key, value, getName(value));
  } else if (Array.isArray(value)) {
    await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry)));
  } else if (typeof value === "object") {
    await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop)));
  } else {
    throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/to-file.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/core/resource.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/utils/path.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/comparative.js
var Comparative = class extends APIResource {
  /**
   * Create a comparative experiment.
   */
  create(body, options) {
    return this._client.post("/api/v1/datasets/comparative", { body, ...options });
  }
  /**
   * Delete a specific comparative experiment.
   */
  delete(comparativeExperimentID, options) {
    return this._client.delete(path`/api/v1/datasets/comparative/${comparativeExperimentID}`, options);
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/experiments.js
var Experiments = class extends APIResource {
  /**
   * Stream grouped and aggregated experiments.
   */
  grouped(datasetID, body, options) {
    return this._client.post(path`/api/v1/datasets/${datasetID}/experiments/grouped`, { body, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/group.js
var Group = class extends APIResource {
  /**
   * Fetch examples for a dataset, and fetch the runs for each example if they are
   * associated with the given session_ids.
   */
  runs(datasetID, body, options) {
    return this._client.post(path`/api/v1/datasets/${datasetID}/group/runs`, { body, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/runs.js
var Runs = class extends APIResource {
  /**
   * Fetch examples for a dataset, and fetch the runs for each example if they are
   * associated with the given session_ids.
   */
  create(datasetID, params, options) {
    const { format, ...body } = params;
    return this._client.post(path`/api/v1/datasets/${datasetID}/runs`, {
      query: { format },
      body,
      ...options
    });
  }
  /**
   * Fetch the number of regressions/improvements for each example in a dataset,
   * between sessions[0] and sessions[1].
   */
  delta(datasetID, body, options) {
    return this._client.post(path`/api/v1/datasets/${datasetID}/runs/delta`, { body, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/share.js
var Share = class extends APIResource {
  /**
   * Share a dataset.
   */
  create(datasetID, params = {}, options) {
    const { share_projects } = params ?? {};
    return this._client.put(path`/api/v1/datasets/${datasetID}/share`, {
      query: { share_projects },
      ...options
    });
  }
  /**
   * Get the state of sharing a dataset
   */
  retrieve(datasetID, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/share`, options);
  }
  /**
   * Unshare a dataset.
   */
  deleteAll(datasetID, options) {
    return this._client.delete(path`/api/v1/datasets/${datasetID}/share`, options);
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/splits.js
var Splits = class extends APIResource {
  /**
   * Update Dataset Splits
   */
  create(datasetID, body, options) {
    return this._client.put(path`/api/v1/datasets/${datasetID}/splits`, { body, ...options });
  }
  /**
   * Get Dataset Splits
   */
  retrieve(datasetID, query = {}, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/splits`, { query, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/versions.js
var Versions = class extends APIResource {
  /**
   * Get dataset versions.
   */
  list(datasetID, query = {}, options) {
    return this._client.getAPIList(path`/api/v1/datasets/${datasetID}/versions`, OffsetPaginationTopLevelArray, { query, ...options });
  }
  /**
   * Get diff between two dataset versions.
   */
  retrieveDiff(datasetID, query, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/versions/diff`, { query, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/datasets/datasets.js
var Datasets = class extends APIResource {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "versions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Versions(this._client)
    });
    Object.defineProperty(this, "runs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Runs(this._client)
    });
    Object.defineProperty(this, "group", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Group(this._client)
    });
    Object.defineProperty(this, "experiments", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Experiments(this._client)
    });
    Object.defineProperty(this, "share", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Share(this._client)
    });
    Object.defineProperty(this, "comparative", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Comparative(this._client)
    });
    Object.defineProperty(this, "splits", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Splits(this._client)
    });
  }
  /**
   * Create a new dataset.
   */
  create(body, options) {
    return this._client.post("/api/v1/datasets", { body, ...options });
  }
  /**
   * Get a specific dataset.
   */
  retrieve(datasetID, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}`, options);
  }
  /**
   * Update a specific dataset.
   */
  update(datasetID, body, options) {
    return this._client.patch(path`/api/v1/datasets/${datasetID}`, { body, ...options });
  }
  /**
   * Get all datasets by query params and owner.
   */
  list(params = {}, options) {
    const { datatype, ...query } = params ?? {};
    return this._client.getAPIList("/api/v1/datasets", OffsetPaginationTopLevelArray, {
      query: { data_type: datatype, ...query },
      ...options
    });
  }
  /**
   * Delete a specific dataset.
   */
  delete(datasetID, options) {
    return this._client.delete(path`/api/v1/datasets/${datasetID}`, options);
  }
  /**
   * Clone a dataset.
   */
  clone(body, options) {
    return this._client.post("/api/v1/datasets/clone", { body, ...options });
  }
  /**
   * Download a dataset as CSV format.
   */
  retrieveCsv(datasetID, query = {}, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/csv`, { query, ...options });
  }
  /**
   * Download a dataset as CSV format.
   */
  retrieveJSONL(datasetID, query = {}, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/jsonl`, { query, ...options });
  }
  /**
   * Download a dataset as OpenAI Evals Jsonl format.
   */
  retrieveOpenAI(datasetID, query = {}, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/openai`, { query, ...options });
  }
  /**
   * Download a dataset as OpenAI Jsonl format.
   */
  retrieveOpenAIFt(datasetID, query = {}, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/openai_ft`, { query, ...options });
  }
  /**
   * Get dataset version by as_of or exact tag.
   */
  retrieveVersion(datasetID, query = {}, options) {
    return this._client.get(path`/api/v1/datasets/${datasetID}/version`, { query, ...options });
  }
  /**
   * Set a tag on a dataset version.
   */
  updateTags(datasetID, body, options) {
    return this._client.put(path`/api/v1/datasets/${datasetID}/tags`, { body, ...options });
  }
  /**
   * Create a new dataset from a CSV or JSONL file.
   */
  upload(body, options) {
    return this._client.post("/api/v1/datasets/upload", multipartFormRequestOptions({ body, ...options }, this._client));
  }
};
Datasets.Versions = Versions;
Datasets.Runs = Runs;
Datasets.Group = Group;
Datasets.Experiments = Experiments;
Datasets.Share = Share;
Datasets.Comparative = Comparative;
Datasets.Splits = Splits;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/info.js
var Info = class extends APIResource {
  /**
   * Get information about the current deployment of LangSmith.
   */
  list(options) {
    return this._client.get("/api/v1/info", options);
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/headers.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/online-evaluators.js
var OnlineEvaluators = class extends APIResource {
  /**
   * Create a new LLM or code evaluator for the current workspace.
   */
  create(body, options) {
    return this._client.post("/v1/platform/evaluators", { body, ...options });
  }
  /**
   * Retrieve a single evaluator by its ID.
   */
  retrieve(evaluatorID, options) {
    return this._client.get(path`/v1/platform/evaluators/${evaluatorID}`, options);
  }
  /**
   * Update an existing evaluator's name, LLM configuration, or code configuration.
   */
  update(evaluatorID, body, options) {
    return this._client.patch(path`/v1/platform/evaluators/${evaluatorID}`, { body, ...options });
  }
  /**
   * List evaluators for the current workspace, with optional filtering by type,
   * name, tag, feedback key, or resource ID.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/v1/platform/evaluators", OffsetPaginationOnlineEvaluators, { query, ...options });
  }
  /**
   * Delete an evaluator. When delete_run_rules is true, all run rules referencing
   * this evaluator are deleted first (same tenant). Associated llm_evaluators and
   * code_evaluators rows are removed by foreign-key cascade when the evaluator row
   * is deleted.
   */
  delete(evaluatorID, params = {}, options) {
    const { delete_run_rules } = params ?? {};
    return this._client.delete(path`/v1/platform/evaluators/${evaluatorID}`, {
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
    return this._client.delete("/v1/platform/evaluators", {
      query: { evaluator_ids, delete_run_rules },
      ...options
    });
  }
  /**
   * Returns per-day LLM evaluator spend for the requested 7-day period, grouped by
   * evaluator, resource, or run rule. Exactly one of group_by, evaluator_id,
   * session_id, or dataset_id is required. resource_id, type, and feedback_key may
   * be supplied with group_by to narrow listing aggregations.
   */
  spend(query, options) {
    return this._client.get("/v1/platform/evaluators/spend", { query, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/sessions/insights.js
var Insights = class extends APIResource {
  /**
   * Create an insights job.
   */
  create(sessionID, body, options) {
    return this._client.post(path`/api/v1/sessions/${sessionID}/insights`, { body, ...options });
  }
  /**
   * Update a session cluster job.
   */
  update(jobID, params, options) {
    const { session_id, ...body } = params;
    return this._client.patch(path`/api/v1/sessions/${session_id}/insights/${jobID}`, { body, ...options });
  }
  /**
   * Get all clusters for a session.
   */
  list(sessionID, query = {}, options) {
    return this._client.getAPIList(path`/api/v1/sessions/${sessionID}/insights`, OffsetPaginationInsightsClusteringJobs, { query, ...options });
  }
  /**
   * Delete a session cluster job.
   */
  delete(jobID, params, options) {
    const { session_id } = params;
    return this._client.delete(path`/api/v1/sessions/${session_id}/insights/${jobID}`, options);
  }
  /**
   * Get a specific cluster job for a session.
   */
  retrieveJob(jobID, params, options) {
    const { session_id } = params;
    return this._client.get(path`/api/v1/sessions/${session_id}/insights/${jobID}`, options);
  }
  /**
   * Get all runs for a cluster job, optionally filtered by cluster.
   */
  retrieveRuns(jobID, params, options) {
    const { session_id, ...query } = params;
    return this._client.get(path`/api/v1/sessions/${session_id}/insights/${jobID}/runs`, {
      query,
      ...options
    });
  }
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/resources/sessions/sessions.js
var Sessions = class extends APIResource {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "insights", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Insights(this._client)
    });
  }
  /**
   * Create a new session.
   */
  create(params, options) {
    const { upsert, ...body } = params;
    return this._client.post("/api/v1/sessions", { query: { upsert }, body, ...options });
  }
  /**
   * Get a specific session.
   */
  retrieve(sessionID, params = {}, options) {
    const { accept, ...query } = params ?? {};
    return this._client.get(path`/api/v1/sessions/${sessionID}`, {
      query,
      ...options,
      headers: buildHeaders([{ ...accept != null ? { accept } : void 0 }, options?.headers])
    });
  }
  /**
   * Update a session.
   */
  update(sessionID, body, options) {
    return this._client.patch(path`/api/v1/sessions/${sessionID}`, { body, ...options });
  }
  /**
   * Get all sessions.
   */
  list(params = {}, options) {
    const { accept, ...query } = params ?? {};
    return this._client.getAPIList("/api/v1/sessions", OffsetPaginationTopLevelArray, {
      query,
      ...options,
      headers: buildHeaders([{ ...accept != null ? { accept } : void 0 }, options?.headers])
    });
  }
  /**
   * Delete a specific session.
   */
  delete(sessionID, options) {
    return this._client.delete(path`/api/v1/sessions/${sessionID}`, options);
  }
  /**
   * Get a prebuilt dashboard for a tracing project.
   */
  dashboard(sessionID, params, options) {
    const { accept, ...body } = params;
    return this._client.post(path`/api/v1/sessions/${sessionID}/dashboard`, {
      body,
      ...options,
      headers: buildHeaders([{ ...accept != null ? { accept } : void 0 }, options?.headers])
    });
  }
};
Sessions.Insights = Insights;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/internal/utils/env.js
var readEnv = (env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() || void 0;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
  }
  return void 0;
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/_openapi_client/client.js
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
    Object.defineProperty(this, "onlineEvaluators", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new OnlineEvaluators(this)
    });
    Object.defineProperty(this, "info", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Info(this)
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
Langsmith.Sessions = Sessions;
Langsmith.Datasets = Datasets;
Langsmith.OnlineEvaluators = OnlineEvaluators;
Langsmith.Info = Info;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/warn.js
var warnedMessages = {};
function warnOnce(message) {
  if (!warnedMessages[message]) {
    console.warn(message);
    warnedMessages[message] = true;
  }
}

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/xxhash/xxhash.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/_uuid.js
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    const msecs = Date.now();
    b[0] = msecs / 1099511627776 & 255;
    b[1] = msecs / 4294967296 & 255;
    b[2] = msecs / 16777216 & 255;
    b[3] = msecs / 65536 & 255;
    b[4] = msecs / 256 & 255;
    b[5] = msecs & 255;
  }
  b[6] = 112 | h[0] & 15;
  b[7] = h[1];
  b[8] = 128 | h[2] & 63;
  b.set(h.slice(3, 10), 9);
  return bytesToUuid(b);
}

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/constants.js
var _MIN_BACKEND_VERSION = "0.16.5rc1";

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/error.js
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
  if (response.status === 403) {
    try {
      const errorData = await response.json();
      const errorCode = errorData?.error;
      if (errorCode === "org_scoped_key_requires_workspace") {
        errorBody = "This API key is org-scoped and requires workspace specification. Please provide 'workspaceId' parameter, or set LANGSMITH_WORKSPACE_ID environment variable.";
      }
    } catch (_e) {
      const errorWithStatus = new Error(`${response.status} ${response.statusText}`);
      errorWithStatus.status = response?.status;
      throw errorWithStatus;
    }
  }
  if (errorBody === void 0) {
    try {
      errorBody = await response.text();
    } catch (_e) {
      errorBody = "";
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/prompts.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/fs.js
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
function mkdirSync3(dir) {
  nodeFs.mkdirSync(dir, { recursive: true });
}
function writeFileSync2(filePath, content) {
  nodeFs.writeFileSync(filePath, content);
}
function renameSync3(oldPath, newPath) {
  nodeFs.renameSync(oldPath, newPath);
}
function unlinkSync2(filePath) {
  nodeFs.unlinkSync(filePath);
}
function readFileSync2(filePath) {
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/prompt_cache/index.js
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
      mkdirSync3(dir);
    }
    const tempPath = `${filePath}.tmp`;
    try {
      writeFileSync2(tempPath, JSON.stringify({ entries }, null, 2));
      renameSync3(tempPath, filePath);
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
      const content = readFileSync2(filePath);
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/singletons/fetch.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/profile-lock.js
var LOCK_POLL_INTERVAL_MS = 10;
var LOCK_STALE_AFTER_MS = 1e4;
var LOCK_METADATA_FILE = "created_at";
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isEEXIST(err) {
  return typeof err === "object" && err !== null && err.code === "EEXIST";
}
function lockMetadataLines(lockDir) {
  try {
    return readFileSync2(path2.join(lockDir, LOCK_METADATA_FILE)).split("\n");
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/profiles.js
var DEFAULT_API_URL = "https://api.smith.langchain.com";
var OAUTH_CLIENT_ID = "langsmith-cli";
var TOKEN_REFRESH_LEEWAY_MS = 6e4;
var TOKEN_REFRESH_TIMEOUT_MS = 1e4;
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
    const config = JSON.parse(readFileSync2(configPath));
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
      const config = JSON.parse(readFileSync2(this.state.configPath));
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
      const response = await fetchImplementation(`${normalizeConfigUrl(refreshApiUrl)}/oauth/token`, {
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/fast-safe-stringify/index.js
var LIMIT_REPLACE_NODE = "[...]";
var CIRCULAR_REPLACE_NODE = { result: "[Circular]" };
var arr = [];
var replacerStack = [];
var encoder = new TextEncoder();
function defaultOptions() {
  return {
    depthLimit: Number.MAX_SAFE_INTEGER,
    edgesLimit: Number.MAX_SAFE_INTEGER
  };
}
function encodeString(str) {
  return encoder.encode(str);
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/worker_threads.js
import { Worker as NodeWorker } from "node:worker_threads";
var Worker = NodeWorker;
var WORKER_THREADS_AVAILABLE = true;

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/serialize_worker.js
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
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/client.js
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
function mergeRuntimeEnvIntoRun(run, cachedEnvVars, omitTracedRuntimeInfo) {
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
      ...metadata
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
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
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
function _checkBackendVersion(version, minVersion = _MIN_BACKEND_VERSION) {
  const parse2 = (v) => v.split(".").map((s) => parseInt(s, 10));
  const [maj, min, pat] = parse2(version);
  const [rMaj, rMin, rPat] = parse2(minVersion);
  if (isNaN(maj) || isNaN(min) || isNaN(pat) || isNaN(rMaj) || isNaN(rMin) || isNaN(rPat)) {
    console.warn(`[LANGSMITH]: Could not parse backend version ${JSON.stringify(version)} for compatibility check.`);
    return;
  }
  if (maj < rMaj || maj === rMaj && min < rMin || maj === rMaj && min === rMin && pat < rPat) {
    console.warn(`[LANGSMITH]: Backend version ${JSON.stringify(version)} is older than the minimum version required by this SDK (${JSON.stringify(minVersion)}). Some features may not work as expected.`);
  }
}
var DEFAULT_UNCOMPRESSED_BATCH_SIZE_LIMIT_BYTES = 24 * 1024 * 1024;
var DEFAULT_MAX_SIZE_BYTES = 1024 * 1024 * 1024;
var SERVER_INFO_REQUEST_TIMEOUT_MS = 1e4;
var DEFAULT_BATCH_SIZE_LIMIT = 100;
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
    const itemPromise = new Promise((resolve) => {
      itemPromiseResolve = resolve;
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
    Object.defineProperty(this, "filteredPostUuids", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set()
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
    Object.defineProperty(this, "openAPIClient", {
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
    this.hideMetadata = config.hideMetadata ?? defaultConfig.hideMetadata;
    this.omitTracedRuntimeInfo = config.omitTracedRuntimeInfo ?? false;
    this.autoBatchTracing = config.autoBatchTracing ?? this.autoBatchTracing;
    this.autoBatchQueue = new AutoBatchQueue(maxMemory);
    this.blockOnRootRunFinalization = config.blockOnRootRunFinalization ?? this.blockOnRootRunFinalization;
    this.batchSizeBytesLimit = config.batchSizeBytesLimit;
    this.batchSizeLimit = config.batchSizeLimit;
    this.fetchOptions = config.fetchOptions || {};
    this.openAPIClient = this._newOpenAPIClient();
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
    this._customHeaders = config.headers ?? {};
  }
  static getDefaultClientConfig() {
    const profileConfig = loadProfileClientConfig();
    const envApiKey = getLangSmithEnvironmentVariable("API_KEY");
    const envApiUrl = getLangSmithEnvironmentVariable("ENDPOINT");
    const envWorkspaceId = getLangSmithEnvironmentVariable("WORKSPACE_ID");
    const envAuthSet = hasValue(envApiKey);
    const apiUrl = envApiUrl ?? profileConfig.apiUrl ?? DEFAULT_API_URL;
    const workspaceId = envWorkspaceId ?? profileConfig.workspaceId;
    const hideInputs = getLangSmithEnvironmentVariable("HIDE_INPUTS") === "true";
    const hideOutputs = getLangSmithEnvironmentVariable("HIDE_OUTPUTS") === "true";
    const hideMetadata = getLangSmithEnvironmentVariable("HIDE_METADATA") === "true";
    return {
      apiUrl,
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
  get _mergedHeaders() {
    const headers = {
      "User-Agent": `langsmith-js/${__version__}`,
      ...this._customHeaders
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
   * Get or set custom headers for the client.
   * Custom headers are merged with default headers (User-Agent, x-api-key, x-tenant-id).
   * Custom headers will not override the default required headers.
   */
  get headers() {
    return this._customHeaders;
  }
  set headers(value) {
    this._customHeaders = value ?? {};
  }
  _getOpenAPIBaseUrl() {
    return this.apiUrl.endsWith("/v1") ? this.apiUrl.slice(0, -3) : this.apiUrl;
  }
  _newOpenAPIClient() {
    const defaultHeaders = this.apiKey === void 0 && this.workspaceId === void 0 ? { "X-API-Key": null } : void 0;
    const { method: _method, headers: _headers, body: _body, signal: _signal, ...openAPIFetchOptions } = this.fetchOptions;
    return new Langsmith({
      apiKey: this.apiKey,
      tenantID: this.workspaceId,
      baseURL: this._getOpenAPIBaseUrl(),
      timeout: this.timeout_ms,
      fetch: this._fetch,
      fetchOptions: openAPIFetchOptions,
      defaultHeaders
    });
  }
  _getPlatformEndpointPath(path3) {
    const needsV1Prefix = this.apiUrl.slice(-3) !== "/v1" && this.apiUrl.slice(-4) !== "/v1/";
    return needsV1Prefix ? `/v1/platform/${path3}` : `/platform/${path3}`;
  }
  get onlineEvaluators() {
    return this.openAPIClient.onlineEvaluators;
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
  async prepareRunCreateOrUpdateInputs(run) {
    const runParams = { ...run };
    if (runParams.inputs !== void 0) {
      runParams.inputs = await this.processInputs(runParams.inputs);
    }
    if (runParams.outputs !== void 0) {
      runParams.outputs = await this.processOutputs(runParams.outputs);
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
  _shouldSample() {
    if (this.tracingSampleRate === void 0) {
      return true;
    }
    return Math.random() < this.tracingSampleRate;
  }
  _filterForSampling(runs, patch = false) {
    if (this.tracingSampleRate === void 0) {
      return runs;
    }
    if (patch) {
      const sampled = [];
      for (const run of runs) {
        if (!this.filteredPostUuids.has(run.trace_id)) {
          sampled.push(run);
        } else if (run.id === run.trace_id) {
          this.filteredPostUuids.delete(run.trace_id);
        }
      }
      return sampled;
    } else {
      const sampled = [];
      for (const run of runs) {
        const traceId = run.trace_id ?? run.id;
        if (this.filteredPostUuids.has(traceId)) {
          continue;
        }
        if (run.id === traceId) {
          if (this._shouldSample()) {
            sampled.push(run);
          } else {
            this.filteredPostUuids.add(traceId);
          }
        } else {
          sampled.push(run);
        }
      }
      return sampled;
    }
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
        const isDefault = item.apiKey === this.apiKey && item.apiUrl === this.apiUrl;
        const batchKey = isDefault ? "default" : `${apiUrl}|${apiKey}`;
        if (!acc[batchKey]) {
          acc[batchKey] = [];
        }
        acc[batchKey].push(item);
        return acc;
      }, {});
      const batchPromises = [];
      for (const [batchKey, batch2] of Object.entries(batchesByDestination)) {
        const batchPromise = this._processBatch(batch2, {
          apiUrl: batchKey === "default" ? void 0 : batchKey.split("|")[0],
          apiKey: batchKey === "default" ? void 0 : batchKey.split("|")[1]
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
  async processRunOperation(item) {
    clearTimeout(this.autoBatchTimeout);
    this.autoBatchTimeout = void 0;
    item.item = mergeRuntimeEnvIntoRun(item.item, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo);
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
  async _ensureServerInfo() {
    if (this._getServerInfoPromise === void 0) {
      this._getServerInfoPromise = (async () => {
        if (this._serverInfo === void 0) {
          try {
            this._serverInfo = await this._getServerInfo();
            if (this._serverInfo?.version) {
              _checkBackendVersion(this._serverInfo.version);
            }
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
        apiUrl: options?.apiUrl
      }).catch(console.error);
      return;
    }
    const mergedRunCreateParam = mergeRuntimeEnvIntoRun(runCreate, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo);
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
    const encoder2 = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const writeChunk = async (chunk) => {
          if (typeof chunk === "string") {
            controller.enqueue(encoder2.encode(chunk));
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
    if (!this._filterForSampling([data], true).length) {
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
          apiUrl: options?.apiUrl
        }).catch(console.error);
        return;
      } else {
        void this.processRunOperation({
          action: "update",
          item: data,
          otelContext,
          apiKey: options?.apiKey,
          apiUrl: options?.apiUrl
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
    const body = serialize(run, `Serializing payload to update run with id: ${runId}`);
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
  async readRun(runId, { loadChildRuns } = { loadChildRuns: false }) {
    assertUuid(runId);
    let run = _normalizeRunTimestamps(await this._get(`/runs/${runId}`));
    if (loadChildRuns) {
      run = await this._loadChildRuns(run);
    }
    return run;
  }
  async getRunUrl({ runId, run, projectOpts }) {
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
      const run_ = await this.readRun(runId);
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
    const childRuns = await toArray(this.listRuns({
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
  async *readThread(props) {
    const { threadId, projectId, projectName, isRoot = true, limit: limit2, filter: userFilter, order = "asc" } = props;
    if (!projectId && !projectName) {
      throw new Error("threadId requires projectId or projectName");
    }
    const threadFilter = `eq(thread_id, ${JSON.stringify(threadId)})`;
    const combinedFilter = userFilter ? `and(${threadFilter}, ${userFilter})` : threadFilter;
    yield* this.listRuns({
      projectId: projectId ?? void 0,
      projectName: projectName ?? void 0,
      isRoot,
      limit: limit2,
      filter: combinedFilter,
      order
    });
  }
  async listThreads(props) {
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
  async shareRun(runId, { shareId } = {}) {
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
  async unshareRun(runId) {
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
  async readRunSharedLink(runId) {
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
  async listSharedRuns(shareToken, { runIds } = {}) {
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
  async createProject({ projectName, description = null, metadata = null, upsert = false, projectExtra = null, referenceDatasetId = null, numExamples = null, numRepetitions = null, evaluatorKeys = null }) {
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
  async createDataset(name, { description, dataType, inputsSchema, outputsSchema, metadata } = {}) {
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
      ["attachment_urls", "outputs", "metadata"].forEach((field) => params.append("select", field));
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
  async createFeedback(runId, key, { score, value, correction, comment, sourceInfo, feedbackSourceType = "api", sourceRunId, feedbackId, feedbackConfig, projectId, comparativeExperimentId, sessionId, startTime, extendTraceRetention }) {
    if (!runId && !projectId) {
      throw new Error("One of runId or projectId must be provided");
    }
    if (runId && projectId) {
      throw new Error("Only one of runId or projectId can be provided");
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
  async _logEvaluationFeedback(evaluatorResponse, run, sourceInfo) {
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
        sessionId: run?.session_id,
        startTime: run?.start_time
      }));
    }
    return [evalResults, feedbacks];
  }
  async logEvaluationFeedback(evaluatorResponse, run, sourceInfo) {
    const [results] = await this._logEvaluationFeedback(evaluatorResponse, run, sourceInfo);
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
   * @param queueId - The ID of the annotation queue
   * @param runIds - The IDs of the runs to be added to the annotation queue
   */
  async addRunsToAnnotationQueue(queueId, runIds) {
    const body = JSON.stringify(runIds.map((id, i) => assertUuid(id, `runIds[${i}]`).toString()));
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}/runs`, {
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
  async createCommit(promptIdentifier, object, options) {
    if (!await this.promptExists(promptIdentifier)) {
      throw new Error("Prompt does not exist, you must create it first.");
    }
    const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
    const resolvedParentCommitHash = options?.parentCommitHash === "latest" || !options?.parentCommitHash ? await this._getLatestCommitHash(`${owner}/${promptName}`) : options?.parentCommitHash;
    const payload = {
      manifest: JSON.parse(JSON.stringify(object)),
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
    await new Promise((resolve) => setTimeout(resolve, 1));
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/env.js
var isEnvTracingEnabled = (tracingEnabled) => {
  if (tracingEnabled !== void 0) {
    return tracingEnabled;
  }
  const envVars = ["TRACING_V2", "TRACING"];
  return !!envVars.find((envVar) => getLangSmithEnvironmentVariable(envVar) === "true");
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/singletons/constants.js
var _LC_CONTEXT_VARIABLES_KEY = /* @__PURE__ */ Symbol.for("lc:context_variables");
var _REPLICA_TRACE_ROOTS_KEY = /* @__PURE__ */ Symbol.for("langsmith:replica_trace_roots");

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/context_vars.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/utils/project.js
var getDefaultProjectName = () => {
  return getLangSmithEnvironmentVariable("PROJECT") ?? getEnvironmentVariable("LANGCHAIN_SESSION") ?? // TODO: Deprecate
  "default";
};

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/run_trees.js
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
  "updates",
  "reroot"
]);
function filterReplicaForHeaders(replica) {
  const filtered = {};
  for (const key of Object.keys(replica)) {
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
    const { projectName, runtimeEnv, excludeChildRuns = true, reroot = false, distributedParentId, apiUrl, apiKey, workspaceId } = params;
    const baseRun = this._convertToCreate(this, runtimeEnv, excludeChildRuns);
    if (projectName === this.project_name) {
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
        for (const { projectName, apiKey, apiUrl, workspaceId, reroot, client: replicaClient } of this.replicas) {
          const runCreate = this._remapForProject({
            projectName: projectName ?? this.project_name,
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
  async patchRun(options) {
    if (this.replicas && this.replicas.length > 0) {
      for (const { projectName, apiKey, apiUrl, workspaceId, updates, reroot, client: replicaClient } of this.replicas) {
        const runData = this._remapForProject({
          projectName: projectName ?? this.project_name,
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
        if (!options?.excludeInputs) {
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
        if (!options?.excludeInputs) {
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
        replicas2.push({
          apiUrl: item.api_url.replace(/\/$/, ""),
          apiKey: item.api_key
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
  if (replicas2) {
    return replicas2.map((replica) => {
      if (Array.isArray(replica)) {
        return {
          projectName: replica[0],
          updates: replica[1]
        };
      }
      return replica;
    });
  }
  return _getWriteReplicasFromEnv();
}
function _checkEndpointEnvUnset(parsed) {
  if (Object.keys(parsed).length > 0 && getLangSmithEnvironmentVariable("ENDPOINT")) {
    throw new ConflictingEndpointsError();
  }
}

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/uuid.js
function uuid7() {
  return v7_default();
}

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/singletons/traceable.js
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

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/index.js
var __version__ = "0.7.11";

// node_modules/.pnpm/langsmith@0.7.11/node_modules/langsmith/dist/anonymizer/index.js
function extractStringNodes(data, options) {
  const parsedOptions = { ...options, maxDepth: options.maxDepth ?? 10 };
  const queue = [[data, 0, "", null, ""]];
  let nextId = 0;
  const result = [];
  while (queue.length > 0) {
    const task = queue.shift();
    if (task == null)
      continue;
    const [value, depth, path3, parent, key] = task;
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

// dist/transcript.js
import { readFileSync as readFileSync3, statSync as statSync3, fstatSync, openSync, readSync, closeSync } from "node:fs";
var MAX_FULL_READ_BYTES = 50 * 1024 * 1024;
function readTranscript(filePath, afterLine = -1) {
  let size;
  try {
    size = statSync3(filePath).size;
  } catch {
    return { messages: [], lastLine: afterLine };
  }
  if (size <= MAX_FULL_READ_BYTES) {
    const raw = readFileSync3(filePath, "utf-8");
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
  const fd = openSync(filePath, "r");
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
    closeSync(fd);
  }
}
function readRuntimeVersion(filePath) {
  let fd;
  try {
    fd = openSync(filePath, "r");
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
      closeSync(fd);
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

// dist/state.js
import { readFileSync as readFileSync4, writeFileSync as writeFileSync3, mkdirSync as mkdirSync4, openSync as openSync2, closeSync as closeSync2, unlinkSync as unlinkSync3 } from "node:fs";
import { dirname as dirname2 } from "node:path";
var LOCK_TIMEOUT_MS = 5e3;
var LOCK_RETRY_MS = 20;
function lockPath(stateFilePath) {
  return `${stateFilePath}.lock`;
}
function sleep3(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function acquireLock(stateFilePath) {
  const lock = lockPath(stateFilePath);
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  mkdirSync4(dirname2(stateFilePath), { recursive: true });
  while (Date.now() < deadline) {
    try {
      const fd = openSync2(lock, "wx");
      closeSync2(fd);
      return;
    } catch {
      await sleep3(LOCK_RETRY_MS);
    }
  }
  try {
    unlinkSync3(lock);
  } catch {
  }
}
function releaseLock(stateFilePath) {
  try {
    unlinkSync3(lockPath(stateFilePath));
  } catch {
  }
}
async function atomicUpdateState(stateFilePath, fn) {
  await acquireLock(stateFilePath);
  try {
    const state = loadState(stateFilePath);
    writeFileSync3(stateFilePath, JSON.stringify(fn(state), null, 2));
  } finally {
    releaseLock(stateFilePath);
  }
}
function loadState(stateFilePath) {
  try {
    const raw = readFileSync4(stateFilePath, "utf-8");
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
var SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1e3;

// dist/constants.js
var USER_PROMPT_TURN_NAME = "Claude Code Turn";
var ASSISTANT_RUN_NAME = "Claude";

// dist/metadata.js
var LS_AGENT_PURPOSE = "coding";
var LS_INTEGRATION = "claude-code";
var LS_AGENT_RUNTIME = "Claude Code";
var LS_TRACE_SCHEMA_VERSION = "coding-agent-v1";
function codingAgentMetadata(opts) {
  const { sessionId, base, turnId, turnNumber, runtimeVersion, approvalPolicy, agentType, subagentId, subagentType, toolName, runName, skillName, runSpecific } = opts;
  const meta = {
    // Identity & grouping — always present.
    ls_agent_purpose: LS_AGENT_PURPOSE,
    ls_integration: LS_INTEGRATION,
    ls_agent_runtime: LS_AGENT_RUNTIME,
    ls_trace_schema_version: LS_TRACE_SCHEMA_VERSION,
    thread_id: sessionId
  };
  if (turnId)
    meta.turn_id = turnId;
  if (typeof turnNumber === "number")
    meta.turn_number = turnNumber;
  if (runtimeVersion)
    meta.ls_agent_runtime_version = runtimeVersion;
  if (approvalPolicy)
    meta.approval_policy = approvalPolicy;
  meta.ls_agent_type = agentType;
  if (subagentId) {
    meta.ls_subagent_id = subagentId;
    meta.agent_id = subagentId;
  }
  if (subagentType) {
    meta.ls_subagent_type = subagentType;
    meta.agent_type = subagentType;
  }
  if (toolName) {
    meta.tool_name = toolName;
    if (runName && toolName !== runName)
      meta.ls_tool_name = toolName;
  }
  if (skillName)
    meta.ls_skill_name = skillName;
  return {
    ...meta,
    ...runSpecific,
    ...base
  };
}
function skillNameFromTool(toolName, toolInput) {
  if (toolName !== "Skill")
    return void 0;
  const skill = toolInput?.skill;
  return typeof skill === "string" ? skill : void 0;
}

// dist/langsmith.js
var client = void 0;
var replicas = void 0;
function initTracing(apiKey, apiUrl, providedReplicas, redact = true, extraRedactionRules) {
  const anonymizer = redact ? createSecretAnonymizer(extraRedactionRules ? { extraRules: extraRedactionRules } : void 0) : void 0;
  if (apiKey || anonymizer && providedReplicas) {
    client = new Client({ apiKey: apiKey || void 0, apiUrl, anonymizer });
  } else {
    client = void 0;
  }
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
  const { turn, sessionId, turnNum, project, parentRunId, existingTaskRunMap, tracedToolUseIds, traceId: providedTraceId, parentDottedOrder: providedParentDottedOrder, customMetadata, runtimeVersion, approvalPolicy, agentType = "root" } = options;
  const turnId = turn.promptId;
  let traceId = providedTraceId;
  let parentDottedOrder = providedParentDottedOrder;
  if (!client && !replicas) {
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  }
  const userContent = typeof turn.userContent === "string" ? [{ type: "text", text: turn.userContent }] : turn.userContent;
  let turnRunId;
  let shouldCreateTurn = false;
  if (parentRunId) {
    debug(`Using existing run ${parentRunId} as parent for LLM/tool runs`);
    turnRunId = parentRunId;
    if (!traceId || !parentDottedOrder) {
      throw new Error(`Missing trace context when using parentRunId. traceId=${traceId}, parentDottedOrder=${parentDottedOrder}`);
    }
  } else {
    shouldCreateTurn = true;
    turnRunId = uuid7();
    traceId = turnRunId;
    parentDottedOrder = generateDottedOrderSegment(turn.userTimestamp, turnRunId);
    debug(`Creating new standalone turn run ${turnRunId}`);
    const runTree = new RunTree({
      client,
      replicas,
      id: turnRunId,
      name: USER_PROMPT_TURN_NAME,
      run_type: "chain",
      inputs: { messages: [{ role: "user", content: userContent }] },
      project_name: project,
      start_time: turn.userTimestamp,
      trace_id: traceId,
      dotted_order: parentDottedOrder,
      extra: {
        metadata: codingAgentMetadata({
          sessionId,
          base: customMetadata,
          turnId,
          turnNumber: turnNum,
          runtimeVersion,
          approvalPolicy,
          agentType
        })
      }
    });
    await runTree.postRun();
  }
  const accumulatedMessages = [
    { role: "user", content: userContent }
  ];
  const taskRunMap = {
    ...existingTaskRunMap
  };
  let lastEndTime = turn.userTimestamp;
  for (const llmCall of turn.llmCalls) {
    const assistantContent = formatContent(llmCall.content);
    const assistantRunId = uuid7();
    const assistantDottedOrderSegment = generateDottedOrderSegment(llmCall.startTime, assistantRunId);
    const assistantDottedOrder = `${parentDottedOrder}.${assistantDottedOrderSegment}`;
    const assistantRunTree = new RunTree({
      client,
      replicas,
      id: assistantRunId,
      name: ASSISTANT_RUN_NAME,
      run_type: "llm",
      inputs: { messages: [...accumulatedMessages] },
      project_name: project,
      start_time: llmCall.startTime,
      parent_run_id: turnRunId,
      trace_id: traceId,
      dotted_order: assistantDottedOrder
    });
    await assistantRunTree.postRun();
    for (const toolCall of llmCall.toolCalls) {
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
      const toolRunId = uuid7();
      const toolDottedOrderSegment = generateDottedOrderSegment(toolStartTime, toolRunId);
      const toolDottedOrder = `${parentDottedOrder}.${toolDottedOrderSegment}`;
      const runTree2 = new RunTree({
        client,
        replicas,
        id: toolRunId,
        name: toolCall.tool_use.name,
        run_type: "tool",
        inputs: { input: toolCall.tool_use.input },
        outputs: { output: toolCall.result?.content ?? "No result" },
        project_name: project,
        start_time: toolStartTime,
        end_time: toolEndTime,
        parent_run_id: turnRunId,
        trace_id: traceId,
        dotted_order: toolDottedOrder,
        extra: {
          metadata: codingAgentMetadata({
            sessionId,
            base: customMetadata,
            turnId,
            turnNumber: turnNum,
            runtimeVersion,
            agentType,
            toolName: toolCall.tool_use.name,
            runName: toolCall.tool_use.name,
            skillName: skillNameFromTool(toolCall.tool_use.name, toolCall.tool_use.input)
          })
        }
      });
      await runTree2.postRun();
      if (toolCall.agentId) {
        taskRunMap[toolCall.agentId] = {
          run_id: toolRunId,
          dotted_order: toolDottedOrder
        };
        debug(`Task tool ${toolCall.tool_use.id} \u2192 agentId=${toolCall.agentId}, runId=${toolRunId}`);
      }
      lastEndTime = toolEndTime;
    }
    const assistantEndTime = llmCall.toolCalls.length > 0 ? lastEndTime : llmCall.endTime;
    const runTree = new RunTree({
      client,
      replicas,
      id: assistantRunId,
      run_type: "llm",
      trace_id: traceId,
      dotted_order: assistantDottedOrder,
      parent_run_id: turnRunId,
      name: ASSISTANT_RUN_NAME,
      project_name: project,
      start_time: llmCall.startTime,
      end_time: assistantEndTime,
      outputs: {
        messages: [{ role: "assistant", content: assistantContent }]
      },
      extra: {
        metadata: codingAgentMetadata({
          sessionId,
          base: customMetadata,
          turnId,
          turnNumber: turnNum,
          runtimeVersion,
          agentType,
          runSpecific: {
            ls_provider: resolveProvider(llmCall.model),
            ls_model_name: llmCall.model,
            ls_invocation_params: {
              model: llmCall.model
            },
            usage_metadata: buildUsageMetadata(llmCall.usage),
            ...llmCall.synthetic ? { synthetic: true } : {}
          }
        })
      }
    });
    await runTree.patchRun({ excludeInputs: true });
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
    const runTree = new RunTree({
      client,
      replicas,
      id: turnRunId,
      run_type: "chain",
      trace_id: traceId,
      dotted_order: parentDottedOrder,
      name: USER_PROMPT_TURN_NAME,
      project_name: project,
      start_time: turn.userTimestamp,
      end_time: lastEndTime,
      outputs: { messages: turnOutputs },
      error: error2,
      extra: {
        metadata: codingAgentMetadata({
          sessionId,
          base: customMetadata,
          turnId,
          turnNumber: turnNum,
          runtimeVersion,
          approvalPolicy,
          agentType
        })
      }
    });
    await runTree.patchRun({ excludeInputs: true });
  }
  const status = turn.isComplete ? "complete" : "interrupted";
  log(`Traced turn ${turnNum}: ${turnRunId} with ${turn.llmCalls.length} LLM call(s) [${status}]`);
  return taskRunMap;
}
async function patchTurnRun(id, result) {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  const runTree = new RunTree({
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
    end_time: (/* @__PURE__ */ new Date()).toISOString(),
    ..."error" in result ? { error: result.error } : { outputs: { messages: [{ role: "assistant", content: result.lastAssistantMessage }] } },
    extra: {
      metadata: codingAgentMetadata({
        sessionId: id.sessionId,
        base: id.customMetadata,
        turnId: id.turnId,
        turnNumber: id.turnNumber,
        runtimeVersion: id.runtimeVersion,
        approvalPolicy: id.approvalPolicy,
        agentType: "root"
      })
    }
  });
  await runTree.patchRun({ excludeInputs: true });
}
function turnIdentityFromOpenTurn(turn, ctx) {
  return {
    sessionId: ctx.sessionId,
    project: ctx.project,
    customMetadata: ctx.customMetadata,
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
  await patchTurnRun(options, { lastAssistantMessage: options.lastAssistantMessage });
}
async function closeTurnRun(id, error2) {
  await patchTurnRun(id, { error: error2 });
}
async function closeInterruptedTurn(options) {
  const { sessionId, sessionState, transcriptPath, project, stateFilePath, customMetadata, runtimeVersion, approvalPolicy, turn, error: errorMessage = "User interrupt" } = options;
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  if (turn) {
    await closeTurnRun({
      ...turnIdentityFromOpenTurn(turn, { sessionId, project, customMetadata }),
      runtimeVersion: turn.runtime_version ?? runtimeVersion,
      approvalPolicy: turn.approval_policy ?? approvalPolicy
    }, errorMessage);
    await flushPendingTraces();
    return { lastLine: sessionState.last_line, turnsTraced: 0 };
  }
  let lastLine = sessionState.last_line;
  let turnsTraced = 0;
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
            approvalPolicy
          });
          lastLine = newLastLine;
          turnsTraced = 1;
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
        sessionId,
        pendingSubagents,
        taskRunMap,
        parentTraceId: sessionState.current_trace_id,
        project,
        customMetadata,
        runtimeVersion,
        turnId,
        turnNumber
      });
    } catch (err) {
      error(`Failed to trace pending subagents on interrupt: ${err}`);
    }
  }
  await closeTurnRun({
    sessionId,
    project,
    customMetadata,
    runId: sessionState.current_turn_run_id,
    traceId: sessionState.current_trace_id,
    dottedOrder: sessionState.current_dotted_order,
    parentRunId: sessionState.current_parent_run_id,
    startTime: sessionState.current_turn_start,
    turnNumber: sessionState.current_turn_number,
    runtimeVersion,
    approvalPolicy
  }, errorMessage);
  await flushPendingTraces();
  return { lastLine, turnsTraced };
}
async function tracePendingSubagents(options) {
  const { sessionId, pendingSubagents, taskRunMap, parentTraceId, project, customMetadata, runtimeVersion, turnId, turnNumber, keepAgentToolRunOpen } = options;
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
        const runTree = new RunTree({
          client,
          replicas,
          id: parentToolRunId,
          name: "Agent",
          run_type: "tool",
          inputs: { input: deferred.inputs ?? {} },
          outputs: { output: deferred.outputs ?? {} },
          project_name: deferred.project_name,
          start_time: subagentStartTime,
          // Leave open for async agents — the task-notification turn nests under
          // this run, so it can't be closed until that turn completes.
          end_time: keepAgentToolRunOpen ? void 0 : subagentEndTime,
          parent_run_id: deferred.parent_run_id,
          trace_id: deferred.trace_id,
          dotted_order: agentToolDottedOrder,
          extra: {
            metadata: codingAgentMetadata({
              sessionId,
              base: customMetadata,
              runtimeVersion,
              turnId,
              turnNumber,
              agentType: "root",
              // run_type "tool" (run name "Agent", native tool "Task").
              toolName: "Task",
              runName: "Agent",
              runSpecific: {
                agent_type: toolName,
                // DEPRECATED compat alias.
                agent_id: subagent.agent_id
                // DEPRECATED compat alias.
              }
            })
          }
        });
        await runTree.postRun();
        if (keepAgentToolRunOpen)
          openedAgentRunIds.push(subagent.agent_id);
      }
      if (subagentTurns.length > 0) {
        await traceSubagentChain({
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
          turnNumber
        });
      }
    } catch (err) {
      error(`Failed to trace subagent ${subagent.agent_id}: ${err}`);
    }
  }
  return openedAgentRunIds;
}
async function traceSubagentChain(opts) {
  const subagentChainId = uuid7();
  const subagentChainDottedOrder = `${opts.parentDottedOrder}.${generateDottedOrderSegment(opts.startTime, subagentChainId)}`;
  const runTree = new RunTree({
    client,
    replicas,
    id: subagentChainId,
    name: opts.chainName,
    run_type: "chain",
    inputs: opts.inputs ?? {},
    outputs: { output: opts.outputs },
    project_name: opts.project,
    start_time: opts.startTime,
    end_time: opts.endTime,
    parent_run_id: opts.parentRunId,
    trace_id: opts.parentTraceId,
    dotted_order: subagentChainDottedOrder,
    extra: {
      metadata: codingAgentMetadata({
        sessionId: opts.sessionId,
        base: opts.customMetadata,
        runtimeVersion: opts.runtimeVersion,
        turnId: opts.turnId,
        turnNumber: opts.turnNumber,
        agentType: "subagent",
        subagentId: opts.subagentId,
        // → ls_subagent_id (+ agent_id alias).
        subagentType: opts.subagentType
        // → ls_subagent_type (+ agent_type alias).
      })
    }
  });
  await runTree.postRun();
  for (let i = 0; i < opts.subagentTurns.length; i++) {
    await traceTurn({
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
      agentType: "subagent"
    });
  }
  log(`Traced subagent ${opts.subagentType} (${opts.subagentId}): ${opts.subagentTurns.length} turn(s)`);
}
async function closeAgentToolRun(options) {
  if (!client && !replicas)
    throw new Error("LangSmith client not initialized \u2014 call initTracing() first");
  const deferred = options.taskRunInfo.deferred ?? {};
  const isWorkflow = Boolean(options.taskRunInfo.is_workflow);
  const runName = isWorkflow ? "Workflow" : "Agent";
  const nativeToolName = isWorkflow ? "Workflow" : "Task";
  const agentTypeAlias = isWorkflow ? "Workflow" : options.agentType || "Agent";
  const runTree = new RunTree({
    client,
    replicas,
    id: options.taskRunInfo.run_id,
    name: runName,
    run_type: "tool",
    inputs: { input: deferred.inputs ?? {} },
    outputs: { output: deferred.outputs ?? {} },
    project_name: deferred.project_name ?? options.project,
    start_time: deferred.start_time,
    end_time: (/* @__PURE__ */ new Date()).toISOString(),
    parent_run_id: deferred.parent_run_id,
    trace_id: deferred.trace_id,
    dotted_order: options.taskRunInfo.dotted_order,
    ...options.error ? { error: options.error } : {},
    extra: {
      metadata: codingAgentMetadata({
        sessionId: options.sessionId,
        base: options.customMetadata,
        runtimeVersion: options.runtimeVersion,
        turnId: options.turnId,
        turnNumber: options.turnNumber,
        agentType: "root",
        toolName: nativeToolName,
        runName,
        runSpecific: {
          agent_type: agentTypeAlias,
          // DEPRECATED compat alias.
          agent_id: options.agentId
          // DEPRECATED compat alias.
        }
      })
    }
  });
  if (options.wasOpen) {
    await runTree.patchRun({ excludeInputs: true });
  } else {
    await runTree.postRun();
  }
}

// dist/config.js
import { readFileSync as readFileSync5 } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
var LS_INTEGRATION_VERSION = true ? "0.2.2" : process.env.CC_LANGSMITH_INTEGRATION_VERSION || void 0;
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
  const configPath = join(homeDir, ".claude.json");
  try {
    const raw = readFileSync5(configPath, "utf-8");
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
var GIT_PROVIDERS_REGEX = {
  github: /[@/](?:github\.com)[:/](.+?)(?:\.git)?\s/,
  gitlab: /[@/](?:gitlab\.com)[:/](.+?)(?:\.git)?\s/,
  bitbucket: /[@/](?:bitbucket\.org)[:/](.+?)(?:\.git)?\s/,
  devAzure: /[@/](?:dev\.azure\.com)[:/](.+?)(?:\.git)?\s/
};
function parseRepoName(remoteUrl) {
  for (const [provider, regex] of Object.entries(GIT_PROVIDERS_REGEX)) {
    const match = remoteUrl.match(regex);
    if (match)
      return { provider, name: match[1] };
  }
  return void 0;
}
function getRepoName(cwd) {
  try {
    const output = execSync("git remote -v", {
      cwd,
      encoding: "utf-8",
      timeout: 5e3,
      stdio: ["ignore", "pipe", "ignore"]
    });
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
function getGitInfo(cwd) {
  const result = {};
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf-8",
      timeout: 5e3,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (branch && branch !== "HEAD")
      result.branch = branch;
  } catch {
  }
  try {
    const commit = execSync("git rev-parse HEAD", {
      cwd,
      encoding: "utf-8",
      timeout: 5e3,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (commit)
      result.commit = commit;
  } catch {
  }
  return result;
}
function loadConfig(options) {
  const cwd = options?.cwd ?? process.cwd();
  const apiKey = process.env.CC_LANGSMITH_API_KEY ?? process.env.LANGSMITH_API_KEY ?? "";
  const project = process.env.CC_LANGSMITH_PROJECT ?? "claude-code";
  const apiBaseUrl = process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com";
  const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const stateFilePath = process.env.STATE_FILE ?? `${homeDir}/.claude/state/langsmith_state.json`;
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
        if (validRules.length > 0)
          redactExtraRules = validRules;
      }
    } catch {
      error("Failed to parse CC_LANGSMITH_REDACT_EXTRA. Please make sure it is valid JSON.");
    }
  }
  const anthropicUserId = readAnthropicUserId();
  const localUsername = readLocalUsername();
  const identityMetadata = { local_username: localUsername };
  if (anthropicUserId) {
    identityMetadata.user_id = anthropicUserId;
    identityMetadata.anthropic_user_id = anthropicUserId;
  }
  const contractMetadata = {
    ls_agent_purpose: "coding",
    ls_integration: "claude-code",
    ls_agent_runtime: "Claude Code",
    ls_trace_schema_version: "coding-agent-v1",
    cwd
  };
  if (LS_INTEGRATION_VERSION) {
    contractMetadata.ls_integration_version = LS_INTEGRATION_VERSION;
  }
  const repoMetadata = {};
  const repoName = getRepoName(cwd);
  if (repoName != null) {
    repoMetadata.repository_name = repoName.name;
    repoMetadata.repository_provider = repoName.provider;
    const host = PROVIDER_HOSTS[repoName.provider];
    if (host)
      repoMetadata.repository_url = `https://${host}/${repoName.name}`;
  }
  const gitInfo = getGitInfo(cwd);
  if (gitInfo.branch)
    repoMetadata.git_branch = gitInfo.branch;
  if (gitInfo.commit)
    repoMetadata.git_commit_sha = gitInfo.commit;
  customMetadata = { ...contractMetadata, ...identityMetadata, ...repoMetadata, ...customMetadata };
  return {
    apiKey,
    project,
    apiBaseUrl,
    stateFilePath,
    debug: debug2,
    parentDottedOrder,
    replicas: replicas2,
    customMetadata,
    redact,
    redactExtraRules
  };
}

// dist/utils/hook-init.js
function initHook(cwd) {
  const config = loadConfig({ cwd });
  initLogger(config.debug);
  if (process.env.TRACE_TO_LANGSMITH?.toLowerCase() !== "true") {
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

// dist/utils/stdin.js
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Failed to parse hook input: ${err}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

// dist/hooks/session-end.js
async function main() {
  const input = await readStdin();
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
    return;
  }
  initTracing(config.apiKey, config.apiBaseUrl, config.replicas, config.redact, config.redactExtraRules);
  const expandedTranscript = expandHome(input.transcript_path);
  const runtimeVersion = sessionState.runtime_version ?? (expandedTranscript ? readRuntimeVersion(expandedTranscript) : void 0);
  let lastLine = sessionState.last_line;
  let turnsTraced = 0;
  if (sessionState.current_turn_run_id) {
    debug(`Closing interrupted turn run ${sessionState.current_turn_run_id} on session end`);
    try {
      const res = await closeInterruptedTurn({
        sessionId: input.session_id,
        sessionState,
        transcriptPath: expandedTranscript,
        project: config.project,
        stateFilePath: config.stateFilePath,
        customMetadata: config.customMetadata,
        runtimeVersion,
        approvalPolicy: sessionState.approval_policy
      });
      lastLine = res.lastLine;
      turnsTraced = res.turnsTraced;
    } catch (err) {
      error(`Failed to close interrupted turn on session end: ${err}`);
    }
  }
  for (const [agentId, taskRunInfo] of openAgentRuns) {
    try {
      await closeAgentToolRun({
        sessionId: input.session_id,
        agentId,
        agentType: taskRunInfo.agent_type ?? "",
        taskRunInfo,
        project: config.project,
        customMetadata: config.customMetadata,
        runtimeVersion,
        wasOpen: true
        // subagent_done ⇒ SubagentStop posted it open
      });
      debug(`Closed open Agent tool run ${agentId} on session end`);
    } catch (err) {
      error(`Failed to close Agent tool run ${agentId} on session end: ${err}`);
    }
  }
  for (const [turnRunId, entry] of Object.entries(openTurns)) {
    if (turnRunId === sessionState.current_turn_run_id)
      continue;
    try {
      if (entry.stop_seen) {
        await completeTurnRun({
          ...turnIdentityFromOpenTurn(entry, {
            sessionId: input.session_id,
            project: config.project,
            customMetadata: config.customMetadata
          }),
          lastAssistantMessage: entry.last_assistant_message
        });
        debug(`Completed deferred turn ${turnRunId} on session end`);
      } else {
        await closeInterruptedTurn({
          sessionId: input.session_id,
          sessionState,
          transcriptPath: expandedTranscript,
          project: config.project,
          stateFilePath: config.stateFilePath,
          customMetadata: config.customMetadata,
          runtimeVersion,
          turn: entry,
          error: "Session ended before turn completed"
        });
        debug(`Closed interrupted deferred turn ${turnRunId} on session end`);
      }
    } catch (err) {
      error(`Failed to close deferred turn ${turnRunId} on session end: ${err}`);
    }
  }
  await flushPendingTraces();
  await atomicUpdateState(config.stateFilePath, (s) => {
    const ss = getSessionState(s, input.session_id);
    return {
      ...s,
      [input.session_id]: {
        ...ss,
        last_line: lastLine,
        turn_count: ss.turn_count + turnsTraced,
        current_turn_run_id: void 0,
        current_trace_id: void 0,
        current_dotted_order: void 0,
        current_parent_run_id: void 0,
        task_run_map: {},
        traced_tool_use_ids: [],
        tool_start_times: {},
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
main().catch((err) => {
  try {
    error(`SessionEnd hook fatal error: ${err}`);
  } catch {
  }
  process.exit(0);
});
