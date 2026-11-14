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
        (val) => new Promise((resolve17) => {
          resolve17(onFinally());
        }).then(() => val),
        (err) => new Promise((resolve17) => {
          resolve17(onFinally());
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
    var pTimeout = (promise, milliseconds, fallback) => new Promise((resolve17, reject) => {
      if (typeof milliseconds !== "number" || milliseconds < 0) {
        throw new TypeError("Expected `milliseconds` to be a positive number");
      }
      if (milliseconds === Infinity) {
        resolve17(promise);
        return;
      }
      const timer = setTimeout(() => {
        if (typeof fallback === "function") {
          try {
            resolve17(fallback());
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
        promise.then(resolve17, reject),
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
          const delay6 = this._intervalEnd - now;
          if (delay6 < 0) {
            this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
          } else {
            if (this._timeoutId === void 0) {
              this._timeoutId = setTimeout(() => {
                this._onResumeInterval();
              }, delay6);
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
        return new Promise((resolve17, reject) => {
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
              resolve17(await operation);
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
        return new Promise((resolve17) => {
          const existingResolve = this._resolveEmpty;
          this._resolveEmpty = () => {
            existingResolve();
            resolve17();
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
        return new Promise((resolve17) => {
          const existingResolve = this._resolveIdle;
          this._resolveIdle = () => {
            existingResolve();
            resolve17();
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/errors.js
function describe(error2) {
  return error2 instanceof Error ? error2.message : String(error2);
}
function errorCode(error2) {
  return error2 !== null && typeof error2 === "object" && "code" in error2 && typeof error2.code === "string" ? error2.code : void 0;
}
function failureStatus(error2) {
  if (typeof error2 !== "object" || error2 === null)
    return void 0;
  const status = Reflect.get(error2, "status");
  return typeof status === "number" ? status : void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/constants.js
var POLICY_LOCK_TIMEOUT_MS = 2e3;
var POLICY_LOCK_TIMEOUT_ERROR = "Timed out waiting for tracing preference lock";
var POLICY_LOCK_TIMEOUT_MESSAGE = "Retry; if it persists, remove the lock only after confirming no preference writer is running.";
var POLICY_UNREADABLE_MESSAGE = "Refusing to overwrite them; repair the file or its permissions before retrying. No preferences were changed.";
var POLICY_NOT_REGULAR_MESSAGE = "Tracing preferences must be a regular, non-symlink file";
var POLICY_ASYNC_UPDATE_MESSAGE = "A policy update must change the policy synchronously";
var POLICY_FILE_MODE = 384;
var POLICY_FILE_ENCODING = "utf8";
var POLICY_TEMP_CREATE_FLAG = "wx";
var POLICY_DIRECTORY_OPEN_FLAG = "r";
var POLICY_WARNING_SEPARATOR = "; ";
var POLICY_TEMP_CLOSE_WARNING = "Temporary file close failed";
var POLICY_TEMP_CLEANUP_WARNING = "Temporary file cleanup failed";
var POLICY_DIRECTORY_CLOSE_WARNING = "Directory close cleanup failed";
var POLICY_LOCK_CLEANUP_FAILED_PREFIX = "Preference lock cleanup failed at";
var POLICY_CANNOT_READ_PREFIX = "Cannot read tracing preferences at";
var POLICY_DURABILITY_WARNING = "Preference is effective, but crash durability could not be confirmed; retry saving";
var POLICY_LOCK_RELEASE_WARNING = "Before retrying, remove the lock only after confirming no preference writer is running";
var COMPILED_BINARY_ENTRY_PREFIXES = [
  "/$bunfs/",
  "B:/~BUN/",
  "B:\\~BUN\\"
];
var WORKER_LOG_FILE_NAME = "worker.log";
var WORKER_LOG_MODE = 384;
var WORKER_LOG_MAX_BYTES = 1024 * 1024;
var WORKER_LOG_APPEND_FLAG = "a";
var WORKER_LOG_TRUNCATE_FLAG = "w";
var SYSTEM_CERTIFICATES_FILE_NAME = "system_certificates.pem";
var WORKER_NO_PID_MESSAGE = "Background worker did not report a process ID";
var HOOK_HELP_FLAGS = ["--help", "-h"];
var HOOK_VERSION_FLAGS = ["--version", "-v"];
var POLICY_PARSE_RESULT_MESSAGE = "A policy parser must return a policy";
var HOOK_OPTIONS_INVALID_MESSAGE = "Hook options need a hooks table and onHookError and onUnknown callbacks";
var HOOK_ERROR_HANDLER_WARNING = "The hook error handler failed:";
var NOTICE_DEFAULT_COOLDOWN_MINUTES = 2;
var NOTICE_MINUTE_MS = 6e4;
var NOTICE_OFF = "off";
var NOTICE_STATE_FILE = "notices.json";
var NOTICE_KEY_SEPARATOR = "\n";
var COMMAND_REPLY_MARKER = "[LangSmith tracing command]";
var COMMAND_REPLY_INSTRUCTION = "The user ran a LangSmith tracing command and the plugin already did what they asked. Let them know what happened, based on the result below:";
var PROMPT_SUBMIT_EVENT = "UserPromptSubmit";
var COMMAND_ARGUMENT_START = /^\s/u;
var COMMAND_REPLY_NOTICE_SEPARATOR = "\n\n";
var SYSTEM_MESSAGE_SEPARATOR = "\n";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/hook-command.js
async function dispatchHookCommand(argv, options) {
  assertHookOptions(options);
  const [argument, ...rest] = argv;
  if (argument !== void 0 && HOOK_HELP_FLAGS.includes(argument)) {
    console.log(options.usage);
  } else if (argument !== void 0 && HOOK_VERSION_FLAGS.includes(argument)) {
    console.log(options.version);
  } else if (argument !== void 0 && options.worker?.command === argument) {
    await guarded(argument, () => options.worker.run(rest), options);
  } else if (argument !== void 0 && Object.hasOwn(options.hooks, argument)) {
    await guarded(argument, options.hooks[argument], options);
  } else {
    options.onUnknown(argument);
  }
}
async function guarded(name, run, options) {
  try {
    await run();
  } catch (error2) {
    reportHookError(name, error2, options);
  }
}
function assertHookOptions(options) {
  if (options === null || typeof options !== "object" || options.hooks === null || typeof options.hooks !== "object" || typeof options.onHookError !== "function" || typeof options.onUnknown !== "function")
    throw new TypeError(HOOK_OPTIONS_INVALID_MESSAGE);
}
function reportHookError(name, error2, options) {
  try {
    options.onHookError(name, error2);
  } catch (handlerError) {
    console.warn(HOOK_ERROR_HANDLER_WARNING, describe(handlerError));
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/prompt-command.js
function matchPromptCommand(prompt, commands) {
  for (const { name, text, takesArguments } of commands) {
    if (prompt === text)
      return { name, argumentText: "" };
    const rest = prompt.slice(text.length);
    if (takesArguments && prompt.startsWith(text) && COMMAND_ARGUMENT_START.test(rest)) {
      return { name, argumentText: rest };
    }
  }
  return void 0;
}
async function runPromptCommand(command, handlers, context) {
  try {
    return await handlers[command.name](command.argumentText, context);
  } catch (error2) {
    return error2 instanceof Error ? error2.message : String(error2);
  }
}
function commandReplyContext(reply) {
  return `${COMMAND_REPLY_MARKER} ${COMMAND_REPLY_INSTRUCTION}${COMMAND_REPLY_NOTICE_SEPARATOR}${reply}`;
}
function promptCommandResponse(reply, notices) {
  if (notices.blockReason !== void 0) {
    const reason = reply.includes(notices.blockReason) ? reply : `${reply}${COMMAND_REPLY_NOTICE_SEPARATOR}${notices.blockReason}`;
    return { decision: "block", reason };
  }
  const unrepeated = (notices.systemMessages ?? []).filter((notice) => !reply.includes(notice));
  return {
    ...unrepeated.length === 0 ? {} : { systemMessage: unrepeated.join(SYSTEM_MESSAGE_SEPARATOR) },
    hookSpecificOutput: {
      hookEventName: PROMPT_SUBMIT_EVENT,
      additionalContext: commandReplyContext(reply)
    }
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/policy-file.js
import { randomUUID as randomUUID3 } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { open, rename as rename3, unlink as unlink3 } from "node:fs/promises";
import { dirname as dirname4 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/files/cleanup.js
import { rmdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/constants.js
var FILE_MISSING_CODE = "ENOENT";
var PROCESS_MISSING_CODE = "ESRCH";
var PROCESS_CHECK_SIGNAL = 0;
var WINDOWS_PLATFORM = "win32";
var FILE_EXISTS_CODE = "EEXIST";
var PERMISSION_DENIED_CODE = "EPERM";
var FILE_ACCESS_DENIED_CODE = "EACCES";
var FILE_BUSY_CODE = "EBUSY";
var DIRECTORY_NOT_EMPTY_CODE = "ENOTEMPTY";
var TEMPLATE_PLACEHOLDER = /\{(\w+)\}/gu;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/files/cleanup-constants.js
var CLEANUP_IGNORED_DIRECTORY_CODES = [
  FILE_MISSING_CODE,
  DIRECTORY_NOT_EMPTY_CODE,
  FILE_EXISTS_CODE,
  PERMISSION_DENIED_CODE,
  FILE_BUSY_CODE,
  FILE_ACCESS_DENIED_CODE
];

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/files/cleanup.js
async function removeDirectoryBestEffort(path3, warning) {
  try {
    await rmdir(path3);
  } catch (error2) {
    if (errorCode(error2) !== FILE_MISSING_CODE)
      console.warn(warning, describe(error2));
  }
}
async function removeEmptyAncestors(directory, root) {
  for (let current = directory; current !== root && current !== dirname(current); ) {
    try {
      await rmdir(current);
    } catch (error2) {
      const code = errorCode(error2);
      if (CLEANUP_IGNORED_DIRECTORY_CODES.some((ignored) => ignored === code))
        return;
      throw error2;
    }
    current = dirname(current);
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/constants.js
var FILE_LOCK_CLAIM_VERSION = 1;
var FILE_LOCK_CLAIM_EXTENSION = ".json";
var FILE_LOCK_DIRECTORY_SUFFIX = ".claims";
var FILE_LOCK_LEGACY_DIRECTORY_SUFFIX = ".lock";
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
var FILE_LOCK_RENAME_RETRY_TIMEOUT_MS = 100;
var FILE_LOCK_HEARTBEAT_MS = 500;
var FILE_LOCK_STALE_CLAIM_MS = 3e3;
var FILE_LOCK_TRY_CHOOSING_WAIT_MS = 1e3;
var FILE_LOCK_DIRECTORY_CONTENTION_CODES = [
  PERMISSION_DENIED_CODE,
  FILE_ACCESS_DENIED_CODE
];
var FILE_LOCK_BUSY_FILE_CODES = [
  ...FILE_LOCK_DIRECTORY_CONTENTION_CODES,
  FILE_BUSY_CODE
];
var FILE_LOCK_HEARTBEAT_WARNING = "Could not refresh a file lock claim:";
var FILE_LOCK_COMPATIBLE_ACQUIRE_CLEANUP_MESSAGE = "Could not release the legacy lock gate after shared lock acquisition failed";
var FILE_LOCK_COMPATIBLE_RELEASE_MESSAGE = "Could not release compatible file lock";
var FILE_LOCK_COMPATIBLE_GATE_CHANGED_MESSAGE = "Legacy file lock gate changed before release";
var FILE_LOCK_COMPATIBLE_OWNER_FILE = "owner";
var FILE_LOCK_COMPATIBLE_OWNER_MESSAGE = "Could not record the legacy file lock gate owner";
var FILE_LOCK_COMPATIBLE_OWNER_PID_PATTERN = /^[1-9]\d*$/u;
var FILE_LOCK_COMPATIBLE_ABANDONED_GATE_MS = 2e4;
var FILE_LOCK_COMPATIBLE_STALE_SUFFIX = ".stale";
var FILE_LOCK_GATE_CLEANUP_WARNING = "Could not remove a half-created lock folder:";
var FILE_LOCK_STALE_GATE_CLEANUP_WARNING = "Could not remove an old lock folder:";
var FILE_LOCK_WINDOWS_DENIED_RETRIES = 5;
var STORAGE_NOT_WRITABLE_ERROR_NAME = "StorageNotWritableError";
var STORAGE_NOT_WRITABLE_MESSAGE = "LangSmith can't write to its storage folder";
var STORAGE_NOT_WRITABLE_FIX = "Fix that folder's permissions so your user account can create files in it, and tracing will resume.";
var STORAGE_STALE_FILE_MAX_AGE_MS = 2 * 60 * 60 * 1e3;
var FILE_LOCK_LOST_MESSAGE = "The file lock was taken over before the write finished";
var STORAGE_UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
var STORAGE_ENGINE_FILE_PATTERNS = [
  new RegExp(`^\\.${STORAGE_UUID}(\\.${STORAGE_UUID})?\\.tmp$`, "u"),
  new RegExp(`^wake-[0-9a-f]{64}\\.active\\.${STORAGE_UUID}(\\.attempt\\.[1-9]\\d*)?\\.json$`, "u"),
  /^wake-[0-9a-f]{64}\.launching$/u
];
var STORAGE_CLAIM_FILE = new RegExp(`^${STORAGE_UUID}\\.json$`, "u");

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/lock-folders.js
async function removeEmptyLockFolders(lockPath, root) {
  await removeEmptyAncestors(`${lockPath}${FILE_LOCK_DIRECTORY_SUFFIX}`, root);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/file-lock.js
import { chmod, link, lstat as lstat2, mkdir as mkdir2, readFile as readFile2, readdir, rename as rename2, writeFile as writeFile2 } from "node:fs/promises";
import { performance as performance4 } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID as randomUUID2 } from "node:crypto";
import { dirname as dirname3, join as join2, resolve as resolve2 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/constants.js
var JSON_ARRAY_INDEX_KEY = /^(0|[1-9]\d*)$/u;
var CAPTURE_TURN_CEILING_MS = 7 * 24 * 60 * 60 * 1e3;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/utils/serialization.js
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/validation/objects.js
function isPlainRecord(value) {
  return value !== null && typeof value === "object" && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function requirePlainRecord(value, name) {
  if (!isPlainRecord(value))
    throw new TypeError(`${name} must be a plain object`);
  return value;
}
function canonicalJsonObject(value, name) {
  return canonicalValue(requirePlainRecord(value, name), /* @__PURE__ */ new Set());
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/errors.js
import { resolve } from "node:path";
var FileLockTimeoutError = class extends Error {
  blockedPath;
  constructor(blockedPath) {
    super(`${FILE_LOCK_TIMEOUT_MESSAGE}: ${resolve(blockedPath)}`);
    this.name = FILE_LOCK_TIMEOUT_ERROR_NAME;
    this.blockedPath = resolve(blockedPath);
  }
};
var StorageNotWritableError = class extends Error {
  folder;
  code;
  constructor(folder, cause) {
    super(`${STORAGE_NOT_WRITABLE_MESSAGE} ${resolve(folder)}. ${STORAGE_NOT_WRITABLE_FIX}`, {
      cause
    });
    this.name = STORAGE_NOT_WRITABLE_ERROR_NAME;
    this.folder = resolve(folder);
    this.code = errorCode(cause);
  }
};

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/file-lock-heartbeat.js
import { utimes } from "node:fs/promises";
var heartbeats = /* @__PURE__ */ new Map();
function startHeartbeat(path3, id) {
  const timer = setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    utimes(path3, now, now).catch(warnUnlessMissing);
  }, FILE_LOCK_HEARTBEAT_MS);
  timer.unref();
  heartbeats.set(id, timer);
}
function stopHeartbeat(id) {
  clearInterval(heartbeats.get(id));
  heartbeats.delete(id);
}
function warnUnlessMissing(error2) {
  if (errorCode(error2) !== FILE_MISSING_CODE)
    console.warn(FILE_LOCK_HEARTBEAT_WARNING, describe(error2));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/legacy-gate.js
import { lstat, mkdir, readFile, rename, rmdir as rmdir2, writeFile } from "node:fs/promises";
import { performance as performance3 } from "node:perf_hooks";
import { randomUUID } from "node:crypto";
import { dirname as dirname2, join } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/file-lock-support.js
import { unlink as unlink2 } from "node:fs/promises";
import { performance as performance2 } from "node:perf_hooks";
function processIsAlive(pid) {
  try {
    process.kill(pid, PROCESS_CHECK_SIGNAL);
    return true;
  } catch (error2) {
    if (errorCode(error2) === PROCESS_MISSING_CODE)
      return false;
    return void 0;
  }
}
async function removeFile(filePath) {
  try {
    await unlink2(filePath);
    return true;
  } catch (error2) {
    if (errorCode(error2) === FILE_MISSING_CODE)
      return true;
    return false;
  }
}
function isBusyFileError(error2) {
  return FILE_LOCK_BUSY_FILE_CODES.includes(errorCode(error2) ?? "");
}
function timeoutMs(options) {
  const value = options?.timeoutMs ?? FILE_LOCK_DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(FILE_LOCK_INVALID_TIMEOUT_MESSAGE);
  return value;
}
function waitForNextScan(deadline, blockedPath) {
  const remaining = deadline - performance2.now();
  if (remaining <= 0)
    return Promise.reject(new FileLockTimeoutError(blockedPath));
  return new Promise((resolvePromise) => setTimeout(resolvePromise, Math.min(FILE_LOCK_POLL_INTERVAL_MS, remaining)));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/legacy-gate.js
async function createLegacyGate(gatePath) {
  await mkdir(gatePath, { mode: FILE_LOCK_DIRECTORY_MODE });
  const stat3 = await lstat(gatePath);
  if (!stat3.isDirectory())
    throw new Error(FILE_LOCK_COMPATIBLE_GATE_CHANGED_MESSAGE);
  await recordLegacyGateOwner(gatePath);
  startHeartbeat(join(gatePath, FILE_LOCK_COMPATIBLE_OWNER_FILE), gatePath);
  return { path: gatePath, dev: stat3.dev, ino: stat3.ino, birthtimeMs: stat3.birthtimeMs };
}
function resetMissingPermission(attempt) {
  attempt.missingPermissionError = void 0;
  attempt.windowsDeniedRetries = 0;
}
async function waitOutContention(attempt, error2) {
  const { gatePath, filePath, deadline, tryAcquire } = attempt;
  const code = errorCode(error2);
  const permissionDenied = FILE_LOCK_DIRECTORY_CONTENTION_CODES.includes(code ?? "");
  if (code !== FILE_EXISTS_CODE && !permissionDenied)
    throw error2;
  let isContended = false;
  try {
    const gate = await lstat(gatePath);
    const isDirectory = gate.isDirectory();
    isContended = isDirectory || gate.isFile() && code === FILE_EXISTS_CODE;
    if (isContended && await legacyGateIsAbandoned(gatePath, isDirectory, gate.mtimeMs)) {
      if (!await reclaimLegacyGate(gatePath, filePath, tryAcquire))
        await waitForNextScan(deadline, gatePath);
      return;
    }
  } catch (statError) {
    if (errorCode(statError) === FILE_MISSING_CODE) {
      if (code === FILE_EXISTS_CODE) {
        resetMissingPermission(attempt);
        await waitForNextScan(deadline, gatePath);
        return;
      }
      if (permissionDenied) {
        const firstRetry = attempt.missingPermissionError === void 0;
        attempt.missingPermissionError = new StorageNotWritableError(dirname2(gatePath), error2);
        if (firstRetry)
          return;
        if (process.platform !== WINDOWS_PLATFORM || code !== PERMISSION_DENIED_CODE || attempt.windowsDeniedRetries >= FILE_LOCK_WINDOWS_DENIED_RETRIES)
          throw attempt.missingPermissionError;
        attempt.windowsDeniedRetries += 1;
        const denied = attempt.missingPermissionError;
        await waitForNextScan(deadline, gatePath).catch(() => Promise.reject(denied));
        return;
      }
    }
    throw error2;
  }
  if (!isContended)
    throw error2;
  resetMissingPermission(attempt);
  await waitForNextScan(deadline, gatePath);
}
async function acquireLegacyDirectoryGate(filePath, deadline, tryAcquire) {
  const gatePath = `${filePath}${FILE_LOCK_LEGACY_DIRECTORY_SUFFIX}`;
  await mkdir(dirname2(filePath), { recursive: true, mode: FILE_LOCK_DIRECTORY_MODE });
  const attempt = {
    gatePath,
    filePath,
    deadline,
    tryAcquire,
    windowsDeniedRetries: 0
  };
  for (; ; ) {
    if (performance3.now() >= deadline) {
      throw attempt.missingPermissionError ?? new FileLockTimeoutError(gatePath);
    }
    try {
      return await createLegacyGate(gatePath);
    } catch (error2) {
      await waitOutContention(attempt, error2);
    }
  }
}
async function releaseLegacyDirectoryGate(gate) {
  stopHeartbeat(gate.path);
  let stat3;
  try {
    stat3 = await lstat(gate.path);
  } catch (error2) {
    if (errorCode(error2) === FILE_MISSING_CODE)
      return;
    throw error2;
  }
  if (!stat3.isDirectory() || stat3.dev !== gate.dev || stat3.ino !== gate.ino || stat3.birthtimeMs !== gate.birthtimeMs) {
    throw new Error(FILE_LOCK_COMPATIBLE_GATE_CHANGED_MESSAGE);
  }
  await removeFile(join(gate.path, FILE_LOCK_COMPATIBLE_OWNER_FILE));
  await rmdir2(gate.path);
}
async function recordLegacyGateOwner(gatePath) {
  try {
    await writeFile(join(gatePath, FILE_LOCK_COMPATIBLE_OWNER_FILE), String(process.pid), {
      flag: FILE_LOCK_EXCLUSIVE_FLAG,
      mode: FILE_LOCK_FILE_MODE
    });
  } catch (error2) {
    await removeDirectoryBestEffort(gatePath, FILE_LOCK_GATE_CLEANUP_WARNING);
    throw new Error(FILE_LOCK_COMPATIBLE_OWNER_MESSAGE, { cause: error2 });
  }
}
async function legacyGateIsAbandoned(gatePath, isDirectory, modifiedAtMs) {
  let contents;
  try {
    contents = await readFile(isDirectory ? join(gatePath, FILE_LOCK_COMPATIBLE_OWNER_FILE) : gatePath, FILE_LOCK_ENCODING);
  } catch (error2) {
    if (errorCode(error2) !== FILE_MISSING_CODE)
      return false;
    contents = "";
  }
  const pid = FILE_LOCK_COMPATIBLE_OWNER_PID_PATTERN.test(contents.trim()) ? Number(contents.trim()) : void 0;
  if (pid !== void 0 && Number.isSafeInteger(pid) && pid > 0)
    return processIsAlive(pid) === false || isDirectory && await ownerHeartbeatStopped(gatePath);
  return Date.now() - modifiedAtMs >= FILE_LOCK_COMPATIBLE_ABANDONED_GATE_MS;
}
async function ownerHeartbeatStopped(gatePath) {
  try {
    const owner = await lstat(join(gatePath, FILE_LOCK_COMPATIBLE_OWNER_FILE));
    return Date.now() - owner.mtimeMs >= FILE_LOCK_STALE_CLAIM_MS;
  } catch {
    return false;
  }
}
async function reclaimLegacyGate(gatePath, filePath, tryAcquire) {
  const takeover = await tryAcquire(filePath);
  if (!takeover)
    return false;
  try {
    let gate;
    try {
      gate = await lstat(gatePath);
    } catch (error2) {
      if (errorCode(error2) === FILE_MISSING_CODE)
        return true;
      throw error2;
    }
    const isDirectory = gate.isDirectory();
    if (!await legacyGateIsAbandoned(gatePath, isDirectory, gate.mtimeMs))
      return false;
    const stalePath = `${gatePath}.${randomUUID()}${FILE_LOCK_COMPATIBLE_STALE_SUFFIX}`;
    try {
      await rename(gatePath, stalePath);
    } catch (error2) {
      if (isBusyFileError(error2))
        return false;
      throw error2;
    }
    if (!isDirectory) {
      await removeFile(stalePath);
      return true;
    }
    await removeFile(join(stalePath, FILE_LOCK_COMPATIBLE_OWNER_FILE));
    await removeDirectoryBestEffort(stalePath, FILE_LOCK_STALE_GATE_CLEANUP_WARNING);
    return true;
  } finally {
    await takeover.release();
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/file-lock.js
function parseClaim(value, id) {
  if (!isPlainRecord(value))
    return void 0;
  if (value.version !== FILE_LOCK_CLAIM_VERSION || value.id !== id || typeof value.pid !== "number" || !Number.isSafeInteger(value.pid) || value.pid <= 0 || typeof value.choosing !== "boolean" || typeof value.ticket !== "number" || !Number.isSafeInteger(value.ticket) || value.ticket < FILE_LOCK_NEGATIVE_TICKET_LIMIT || (value.choosing ? value.ticket !== FILE_LOCK_UNSELECTED_TICKET : value.ticket === FILE_LOCK_UNSELECTED_TICKET)) {
    return void 0;
  }
  return value;
}
async function publishClaim(filePath, claim, create, deadline) {
  const temporaryPath = join2(dirname3(filePath), `${FILE_LOCK_TEMP_PREFIX}${claim.id}.${randomUUID2()}${FILE_LOCK_TEMP_SUFFIX}`);
  try {
    await writeFile2(temporaryPath, JSON.stringify(claim), {
      flag: FILE_LOCK_EXCLUSIVE_FLAG,
      mode: FILE_LOCK_FILE_MODE
    });
    if (create)
      await link(temporaryPath, filePath);
    else {
      const replacementDeadline = deadline ?? performance4.now() + FILE_LOCK_RENAME_RETRY_TIMEOUT_MS;
      for (; ; ) {
        try {
          await rename2(temporaryPath, filePath);
          break;
        } catch (error2) {
          if (errorCode(error2) !== PERMISSION_DENIED_CODE)
            throw error2;
          await waitForNextScan(replacementDeadline, dirname3(filePath));
        }
      }
    }
  } finally {
    await removeFile(temporaryPath);
  }
}
async function createClaim(claimDirectory) {
  for (; ; ) {
    const id = randomUUID2();
    const claim = {
      version: FILE_LOCK_CLAIM_VERSION,
      id,
      pid: process.pid,
      choosing: true,
      ticket: FILE_LOCK_UNSELECTED_TICKET
    };
    try {
      const path3 = join2(claimDirectory, `${id}${FILE_LOCK_CLAIM_EXTENSION}`);
      await publishClaim(path3, claim, true);
      startHeartbeat(path3, id);
      return claim;
    } catch (error2) {
      if (errorCode(error2) !== FILE_EXISTS_CODE)
        throw error2;
    }
  }
}
async function scanClaims(claimDirectory, ownPath) {
  const entries = await readdir(claimDirectory, { withFileTypes: true });
  const claims = [];
  const reference = ownPath === void 0 ? void 0 : await modifiedAt(ownPath);
  const abandoned = async (path3) => {
    if (reference === void 0)
      return false;
    const modified = await modifiedAt(path3);
    if (modified === void 0 || reference - modified < FILE_LOCK_STALE_CLAIM_MS)
      return false;
    return removeFile(path3);
  };
  for (const entry of entries) {
    if (!entry.name.endsWith(FILE_LOCK_CLAIM_EXTENSION))
      continue;
    const id = entry.name.slice(0, -FILE_LOCK_CLAIM_EXTENSION.length);
    const path3 = join2(claimDirectory, entry.name);
    if (!entry.isFile())
      return { claims, blocked: true };
    let value;
    try {
      value = JSON.parse(await readFile2(path3, FILE_LOCK_ENCODING));
    } catch (error2) {
      if (errorCode(error2) === FILE_MISSING_CODE)
        continue;
      if (await abandoned(path3))
        continue;
      return {
        claims,
        blocked: true,
        transient: isBusyFileError(error2)
      };
    }
    const claim = parseClaim(value, id);
    if (!claim) {
      if (await abandoned(path3))
        continue;
      return { claims, blocked: true };
    }
    const alive = processIsAlive(claim.pid);
    if (alive === false) {
      if (!await removeFile(path3))
        return { claims, blocked: true };
      continue;
    }
    if (await abandoned(path3))
      continue;
    if (alive === void 0)
      return { claims, blocked: true };
    claims.push(claim);
  }
  return { claims, blocked: false };
}
async function modifiedAt(path3) {
  try {
    return (await lstat2(path3)).mtimeMs;
  } catch (error2) {
    if (errorCode(error2) === FILE_MISSING_CODE)
      return void 0;
    throw error2;
  }
}
function claimPath(claimDirectory, id) {
  return join2(claimDirectory, `${id}${FILE_LOCK_CLAIM_EXTENSION}`);
}
function hasClaimState(claims, id, choosing, ticket) {
  const claim = claims.find((peer) => peer.id === id);
  return claim?.choosing === choosing && claim.ticket === ticket;
}
function makeHandle(claimDirectory, claim) {
  let releasePromise;
  return {
    async assertHeld() {
      if (await modifiedAt(claimPath(claimDirectory, claim.id)) === void 0)
        throw new Error(FILE_LOCK_LOST_MESSAGE);
    },
    release() {
      stopHeartbeat(claim.id);
      releasePromise ??= removeFile(claimPath(claimDirectory, claim.id)).then((removed) => {
        if (!removed)
          throw new Error(FILE_LOCK_RELEASE_MESSAGE);
      });
      return releasePromise;
    }
  };
}
async function beginClaim(filePath) {
  const claimDirectory = `${resolve2(filePath)}${FILE_LOCK_DIRECTORY_SUFFIX}`;
  for (; ; ) {
    try {
      await assertSafeClaimDirectory(claimDirectory);
      await mkdir2(claimDirectory, { recursive: true, mode: FILE_LOCK_DIRECTORY_MODE });
      await assertSafeClaimDirectory(claimDirectory);
      await chmod(claimDirectory, FILE_LOCK_DIRECTORY_MODE);
      return { claimDirectory, claim: await createClaim(claimDirectory) };
    } catch (error2) {
      if (errorCode(error2) !== FILE_MISSING_CODE)
        throw error2;
    }
  }
}
async function assertSafeClaimDirectory(claimDirectory) {
  let stat3;
  try {
    stat3 = await lstat2(claimDirectory);
  } catch (error2) {
    if (errorCode(error2) === FILE_MISSING_CODE)
      return;
    throw error2;
  }
  if (stat3.isSymbolicLink() || !stat3.isDirectory())
    throw new Error(FILE_LOCK_UNSAFE_DIRECTORY_MESSAGE);
}
function isStillBusy(attempt, scan) {
  return !attempt.waitForPeers && scan.blocked && scan.transient === true && performance4.now() < attempt.busyDeadline;
}
async function waitOrReleaseClaim(attempt) {
  if (!attempt.waitForPeers) {
    await makeHandle(attempt.claimDirectory, attempt.claim).release();
    return false;
  }
  await waitForNextScan(attempt.deadline, attempt.claimDirectory);
  return true;
}
async function observePeers(attempt, expectedChoosing, expectedTicket) {
  for (; ; ) {
    const scan = await scanClaims(attempt.claimDirectory, attempt.ownPath);
    if (isStillBusy(attempt, scan)) {
      await delay(FILE_LOCK_POLL_INTERVAL_MS);
      continue;
    }
    if (scan.blocked || !hasClaimState(scan.claims, attempt.claim.id, expectedChoosing, expectedTicket)) {
      if (!await waitOrReleaseClaim(attempt))
        return void 0;
      continue;
    }
    return scan.claims;
  }
}
async function takeTicket(attempt) {
  const { claim, claimDirectory, ownPath, waitForPeers } = attempt;
  const claims = await observePeers(attempt, true, FILE_LOCK_UNSELECTED_TICKET);
  if (claims === void 0)
    return void 0;
  if (!waitForPeers && claims.some((peer) => peer.id !== claim.id && !peer.choosing)) {
    await makeHandle(claimDirectory, claim).release();
    return void 0;
  }
  let maxTicket = FILE_LOCK_UNSELECTED_TICKET;
  for (const peer of claims)
    maxTicket = Math.max(maxTicket, peer.ticket);
  if (maxTicket >= Number.MAX_SAFE_INTEGER)
    throw new Error(FILE_LOCK_TICKET_LIMIT_MESSAGE);
  const ticketedClaim = { ...claim, choosing: false, ticket: maxTicket + 1 };
  await publishClaim(ownPath, ticketedClaim, false, waitForPeers ? attempt.deadline : attempt.busyDeadline);
  return ticketedClaim;
}
async function waitForTurn(attempt, ticketedClaim) {
  const { claim, claimDirectory, waitForPeers } = attempt;
  const choosingDeadline = performance4.now() + FILE_LOCK_TRY_CHOOSING_WAIT_MS;
  for (; ; ) {
    const claims = await observePeers(attempt, false, ticketedClaim.ticket);
    if (claims === void 0)
      return void 0;
    const peers = claims.filter((peer) => peer.id !== claim.id);
    if (!waitForPeers && !peers.some((peer) => !peer.choosing && precedes(peer, ticketedClaim)) && peers.some((peer) => peer.choosing) && performance4.now() < choosingDeadline) {
      await delay(FILE_LOCK_POLL_INTERVAL_MS);
      continue;
    }
    if (peers.some((peer) => precedes(peer, ticketedClaim))) {
      if (!await waitOrReleaseClaim(attempt))
        return void 0;
      continue;
    }
    if (waitForPeers && performance4.now() > attempt.deadline)
      throw new FileLockTimeoutError(claimDirectory);
    return { claimDirectory, claim: ticketedClaim };
  }
}
async function acquireClaim(filePath, waitForPeers, deadline) {
  const { claimDirectory, claim } = await beginClaim(filePath);
  const attempt = {
    filePath,
    claimDirectory,
    claim,
    ownPath: claimPath(claimDirectory, claim.id),
    waitForPeers,
    deadline,
    busyDeadline: performance4.now() + FILE_LOCK_TRY_CHOOSING_WAIT_MS
  };
  try {
    const ticketedClaim = await takeTicket(attempt);
    if (!ticketedClaim)
      return void 0;
    return await waitForTurn(attempt, ticketedClaim);
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
async function acquireCompatibleDirectoryFileLock(filePath, options) {
  const resolvedPath = resolve2(filePath);
  const deadline = performance4.now() + timeoutMs(options);
  const gate = await acquireLegacyDirectoryGate(resolvedPath, deadline, tryAcquireFileLock);
  let acquired;
  try {
    acquired = await acquireClaim(resolvedPath, true, deadline);
    if (!acquired)
      throw new Error(FILE_LOCK_ACQUIRE_MESSAGE);
  } catch (error2) {
    try {
      await releaseLegacyDirectoryGate(gate);
    } catch (cleanupError) {
      throw new AggregateError([error2, cleanupError], FILE_LOCK_COMPATIBLE_ACQUIRE_CLEANUP_MESSAGE, {
        cause: cleanupError
      });
    }
    throw error2;
  }
  const sharedHandle = makeHandle(acquired.claimDirectory, acquired.claim);
  let releasePromise;
  return {
    assertHeld: () => sharedHandle.assertHeld(),
    release() {
      releasePromise ??= (async () => {
        const errors = [];
        try {
          await sharedHandle.release();
        } catch (error2) {
          errors.push(error2);
        }
        try {
          await releaseLegacyDirectoryGate(gate);
        } catch (error2) {
          errors.push(error2);
        }
        if (errors.length === 1)
          throw errors[0];
        if (errors.length > 1)
          throw new AggregateError(errors, FILE_LOCK_COMPATIBLE_RELEASE_MESSAGE);
      })();
      return releasePromise;
    }
  };
}
function precedes(left, right) {
  return left.ticket < right.ticket || left.ticket === right.ticket && left.id < right.id;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/policy-file.js
function readPolicyFile(path3, options) {
  let raw;
  try {
    if (options.requireRegularFile && !lstatSync(path3).isFile())
      throw new Error(POLICY_NOT_REGULAR_MESSAGE);
    raw = readFileSync(path3, POLICY_FILE_ENCODING);
  } catch (error2) {
    if (errorCode(error2) === FILE_MISSING_CODE) {
      try {
        lstatSync(path3);
      } catch (statError) {
        if (errorCode(statError) === FILE_MISSING_CODE)
          return options.empty();
        throw statError;
      }
    }
    throw error2;
  }
  const policy = options.parse(JSON.parse(raw));
  if (policy === void 0)
    throw new TypeError(POLICY_PARSE_RESULT_MESSAGE);
  return policy;
}
async function updatePolicyFile(path3, options, update) {
  const lockPath = `${path3}${FILE_LOCK_DIRECTORY_SUFFIX}`;
  const lock = await acquirePolicyLock(path3);
  const warnings = [];
  try {
    const policy = readPolicyForUpdate(path3, options);
    const updated = update(policy);
    if (isThenable(updated))
      throw new TypeError(POLICY_ASYNC_UPDATE_MESSAGE);
    await replacePolicyFile(path3, updated === void 0 ? policy : updated, warnings);
    if (process.platform !== WINDOWS_PLATFORM)
      await syncPolicyDirectory(path3, warnings);
  } finally {
    await bestEffort(warnings, async () => {
      await lock.release();
      await removeEmptyLockFolders(path3, dirname4(path3));
    }, `${POLICY_LOCK_CLEANUP_FAILED_PREFIX} ${lockPath}. ${POLICY_LOCK_RELEASE_WARNING}`);
  }
  return warnings.length ? { warning: warnings.join(POLICY_WARNING_SEPARATOR) } : {};
}
async function bestEffort(warnings, action, message) {
  try {
    await action();
  } catch (error2) {
    warnings.push(`${message}: ${describe(error2)}`);
  }
}
function acquirePolicyLock(path3) {
  return acquireCompatibleDirectoryFileLock(path3, {
    timeoutMs: POLICY_LOCK_TIMEOUT_MS
  }).catch((error2) => {
    const timeout = findLockTimeout(error2);
    if (timeout !== void 0) {
      throw new Error(`${POLICY_LOCK_TIMEOUT_ERROR} ${timeout.blockedPath}. ${POLICY_LOCK_TIMEOUT_MESSAGE}`, { cause: error2 });
    }
    throw error2;
  });
}
function readPolicyForUpdate(path3, options) {
  try {
    return readPolicyFile(path3, options);
  } catch (error2) {
    throw new Error(`${POLICY_CANNOT_READ_PREFIX} ${path3}. ${POLICY_UNREADABLE_MESSAGE}`, {
      cause: error2
    });
  }
}
async function writePolicyTemp(tempPath, policy, warnings) {
  const temp = await open(tempPath, POLICY_TEMP_CREATE_FLAG, POLICY_FILE_MODE);
  try {
    await temp.writeFile(`${JSON.stringify(policy)}
`, POLICY_FILE_ENCODING);
    await temp.sync();
  } catch (error2) {
    await bestEffort(warnings, () => temp.close(), POLICY_TEMP_CLOSE_WARNING);
    throw error2;
  }
  await temp.close();
}
async function replacePolicyFile(path3, policy, warnings) {
  const tempPath = `${path3}.${process.pid}.${randomUUID3()}.tmp`;
  try {
    await writePolicyTemp(tempPath, policy, warnings);
    await rename3(tempPath, path3);
  } catch (error2) {
    await bestEffort(warnings, () => unlink3(tempPath), POLICY_TEMP_CLEANUP_WARNING);
    throw error2;
  }
}
async function syncPolicyDirectory(path3, warnings) {
  await bestEffort(warnings, async () => {
    const directory = await open(dirname4(path3), POLICY_DIRECTORY_OPEN_FLAG);
    try {
      await directory.sync();
    } finally {
      await bestEffort(warnings, () => directory.close(), POLICY_DIRECTORY_CLOSE_WARNING);
    }
  }, POLICY_DURABILITY_WARNING);
}
function isThenable(value) {
  return typeof Reflect.get(Object(value), "then") === "function";
}
function findLockTimeout(error2) {
  if (error2 instanceof FileLockTimeoutError)
    return error2;
  if (!(error2 instanceof AggregateError))
    return void 0;
  return error2.errors.map(findLockTimeout).find((found) => found !== void 0);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/capture-store.js
import { lstat as lstat6 } from "node:fs/promises";
import { basename as basename2, dirname as dirname8, join as join8, resolve as resolve5 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/state-store.js
import { readFileSync as readFileSync3, renameSync as renameSync2 } from "node:fs";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/files/publish.js
import { closeSync, openSync, renameSync, writeSync } from "node:fs";
import { randomUUID as randomUUID4 } from "node:crypto";
function publishByRename(path3, contents, tempSuffix, mode) {
  const temp = `${path3}.${randomUUID4()}${tempSuffix}`;
  const fd = openSync(temp, "wx", mode);
  try {
    writeSync(fd, contents);
  } finally {
    closeSync(fd);
  }
  renameSync(temp, path3);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/state-constants.js
var STATE_TEMP_SUFFIX = ".state.tmp";
var STATE_CORRUPT_SUFFIX = ".corrupt";
var STATE_FILE_ENCODING = "utf-8";
var STATE_LOCK_RELEASE_WARNING = "Could not release the shared state lock";
var STATE_LOCK_BUSY_WARNING = "Another process holds the state lock, so state updates in this hook are saved for the next lock holder";
var STATE_CORRUPT_WARNING = `State was unreadable; started over and kept the old file as ${STATE_CORRUPT_SUFFIX}`;
var STATE_LOCK_WAIT_MS = 1e3;
var STATE_LOCK_PROBE_MS = 200;
var STATE_LOCK_BUSY_MEMORY_MS = 3e4;
var PENDING_STATE_DIR_SUFFIX = ".pending";
var PENDING_STATE_FILE_SUFFIX = ".json";
var PENDING_STATE_TEMP_SUFFIX = ".pending.tmp";
var PENDING_STATE_ABANDONED_MS = 6e4;
var PENDING_STATE_TIME_WIDTH = 13;
var PENDING_STATE_SEQUENCE_WIDTH = 6;
var PENDING_STATE_WRITE_ATTEMPTS = 3;
var STATE_PRIVATE_DIR_MODE = 448;
var STATE_PRIVATE_FILE_MODE = 384;
var STATE_CLAIM_SUFFIX = ".claim";
var STATE_CLAIM_SKEW_MS = 6e4;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/state-pending.js
import { mkdirSync, readdirSync, readFileSync as readFileSync2, rmdirSync, rmSync, statSync } from "node:fs";
import { join as join3 } from "node:path";
var sequence = 0;
var same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function diffValue(path3, before, after, operations) {
  if (same(before, after))
    return;
  if (isPlainRecord(before) && isPlainRecord(after)) {
    for (const key of Object.keys(before)) {
      if (before[key] !== void 0 && after[key] === void 0) {
        operations.push({ path: [...path3, key], unset: true });
      }
    }
    for (const [key, value] of Object.entries(after)) {
      if (value !== void 0)
        diffValue([...path3, key], before[key], value, operations);
    }
  } else if (Array.isArray(before) && Array.isArray(after)) {
    const kept = new Set(after.map((item) => JSON.stringify(item)));
    const known = new Set(before.map((item) => JSON.stringify(item)));
    const add = after.filter((item) => !known.has(JSON.stringify(item)));
    const remove = before.filter((item) => !kept.has(JSON.stringify(item)));
    operations.push({ path: path3, add, remove });
  } else {
    operations.push({ path: path3, set: after });
  }
}
function diffState(before, after) {
  const patch = [];
  for (const session of Object.keys(before)) {
    if (!Object.hasOwn(after, session))
      patch.push({ session, removed: true });
  }
  for (const [session, next] of Object.entries(after)) {
    const operations = [];
    if (Object.hasOwn(before, session))
      diffValue([], before[session], next, operations);
    else
      operations.push({ path: [], set: next });
    if (operations.length > 0)
      patch.push({ session, operations });
  }
  return patch;
}
function applyOperation(root, operation) {
  const { path: path3 } = operation;
  if (path3.length === 0)
    return operation.set;
  const [key, ...rest] = path3;
  const node = isPlainRecord(root) ? { ...root } : {};
  if (rest.length > 0) {
    node[key] = applyOperation(node[key], { ...operation, path: rest });
  } else if (operation.unset) {
    delete node[key];
  } else if (operation.add || operation.remove) {
    node[key] = mergeList(node[key], operation);
  } else {
    node[key] = operation.set;
  }
  return node;
}
function mergeList(current, operation) {
  const removed = new Set((operation.remove ?? []).map((item) => JSON.stringify(item)));
  const list = (Array.isArray(current) ? current : []).filter((item) => !removed.has(JSON.stringify(item)));
  const present = new Set(list.map((item) => JSON.stringify(item)));
  for (const item of operation.add ?? []) {
    if (!present.has(JSON.stringify(item)))
      list.push(item);
  }
  return list;
}
function applyPatches(state, patches) {
  let result = state;
  for (const patch of patches) {
    for (const entry of patch) {
      if (entry.removed) {
        result = Object.fromEntries(Object.entries(result).filter(([id]) => id !== entry.session));
        continue;
      }
      let session = result[entry.session];
      for (const operation of entry.operations ?? [])
        session = applyOperation(session, operation);
      result = { ...result, [entry.session]: session };
    }
  }
  return result;
}
var pendingDirectory = (stateFilePath) => `${stateFilePath}${PENDING_STATE_DIR_SUFFIX}`;
function names(directory) {
  try {
    return readdirSync(directory);
  } catch {
    return [];
  }
}
function writePending(stateFilePath, patch) {
  if (patch.length === 0)
    return;
  const directory = pendingDirectory(stateFilePath);
  const time = String(Date.now()).padStart(PENDING_STATE_TIME_WIDTH, "0");
  const order = String(sequence++).padStart(PENDING_STATE_SEQUENCE_WIDTH, "0");
  const file = join3(directory, `${time}-${order}-${process.pid}${PENDING_STATE_FILE_SUFFIX}`);
  for (let attempt = 1; ; attempt++) {
    try {
      mkdirSync(directory, { recursive: true, mode: STATE_PRIVATE_DIR_MODE });
      publishByRename(file, JSON.stringify(patch), PENDING_STATE_TEMP_SUFFIX, STATE_PRIVATE_FILE_MODE);
      return;
    } catch (error2) {
      if (attempt >= PENDING_STATE_WRITE_ATTEMPTS)
        throw error2;
    }
  }
}
function readPending(stateFilePath) {
  const directory = pendingDirectory(stateFilePath);
  const files = [];
  const patches = [];
  for (const name of names(directory).filter((n2) => n2.endsWith(PENDING_STATE_FILE_SUFFIX)).toSorted()) {
    const file = join3(directory, name);
    files.push(file);
    try {
      patches.push(JSON.parse(readFileSync2(file, "utf-8")));
    } catch {
      continue;
    }
  }
  return { files, patches };
}
function hasRecentPending(stateFilePath) {
  const directory = pendingDirectory(stateFilePath);
  return names(directory).some((name) => {
    try {
      return name.endsWith(PENDING_STATE_FILE_SUFFIX) && Date.now() - statSync(join3(directory, name)).mtimeMs < STATE_LOCK_BUSY_MEMORY_MS;
    } catch {
      return false;
    }
  });
}
function removePending(stateFilePath, files) {
  const directory = pendingDirectory(stateFilePath);
  for (const file of files)
    rmSync(file, { force: true });
  for (const name of names(directory)) {
    if (name.endsWith(PENDING_STATE_FILE_SUFFIX))
      continue;
    const file = join3(directory, name);
    try {
      if (Date.now() - statSync(file).mtimeMs > PENDING_STATE_ABANDONED_MS)
        rmSync(file, { force: true });
    } catch {
      continue;
    }
  }
  if (names(directory).length > 0)
    return;
  try {
    rmdirSync(directory);
  } catch {
    return;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/state-store.js
function createStateStore(options) {
  const { path: path3 } = options;
  const warn2 = options.warn ?? console.warn;
  function read() {
    const { patches } = readPending(path3);
    return applyPatches(readStateFile(path3), patches);
  }
  async function update(fn) {
    const waitMs = hasRecentPending(path3) ? STATE_LOCK_PROBE_MS : STATE_LOCK_WAIT_MS;
    const ran = await withStateFileLock(path3, warn2, () => {
      const { files, patches } = readPending(path3);
      const current = readStateFile(path3, () => setAsideCorruptState(path3, warn2));
      publishState(path3, fn(applyPatches(current, patches)));
      removePending(path3, files);
    }, waitMs);
    if (ran)
      return;
    const before = read();
    writePending(path3, diffState(before, fn(before)));
  }
  return { read, update };
}
function readStateFile(path3, onUnparseable) {
  let raw;
  try {
    raw = readFileSync3(path3, STATE_FILE_ENCODING);
  } catch {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return isPlainRecord(parsed) ? parsed : {};
  } catch {
    onUnparseable?.();
    return {};
  }
}
function setAsideCorruptState(path3, warn2) {
  try {
    renameSync2(path3, `${path3}${STATE_CORRUPT_SUFFIX}`);
  } catch {
  }
  warn2(STATE_CORRUPT_WARNING);
}
function publishState(path3, state) {
  publishByRename(path3, JSON.stringify(state, null, 2), STATE_TEMP_SUFFIX, STATE_PRIVATE_FILE_MODE);
}
async function withStateFileLock(path3, warn2, callback, waitMs) {
  let lock;
  try {
    lock = await acquireCompatibleDirectoryFileLock(path3, { timeoutMs: waitMs });
  } catch (error2) {
    if (!(error2 instanceof FileLockTimeoutError))
      throw error2;
    warn2(STATE_LOCK_BUSY_WARNING);
    return false;
  }
  try {
    await callback();
  } finally {
    try {
      await lock.release();
    } catch (error2) {
      warn2(`${STATE_LOCK_RELEASE_WARNING}: ${error2}`);
    }
  }
  return true;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/state-claim.js
import { mkdirSync as mkdirSync2 } from "node:fs";
import { dirname as dirname5 } from "node:path";
async function claimStateEntry(path3, key, windowMs) {
  mkdirSync2(dirname5(path3), { recursive: true, mode: STATE_PRIVATE_DIR_MODE });
  const lock = await tryAcquireFileLock(`${path3}${STATE_CLAIM_SUFFIX}`);
  if (lock === void 0)
    return false;
  try {
    const store = createStateStore({ path: path3, warn: () => void 0 });
    const now = Date.now();
    const age = now - (store.read()[key]?.at ?? -Infinity);
    if (age > -STATE_CLAIM_SKEW_MS && age < windowMs)
      return false;
    await store.update((state) => ({ ...state, [key]: { at: now } }));
    return true;
  } finally {
    await lock.release();
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/paths.js
import { createHash } from "node:crypto";
import { resolve as resolve3, join as join4 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/utils/atomic-file.js
import { constants as fsConstants } from "node:fs";
import { chmod as chmod2, link as link2, lstat as lstat3, mkdir as mkdir3, open as open2, rename as rename4, unlink as unlink4 } from "node:fs/promises";
import { dirname as dirname6, isAbsolute, join as join5, relative, sep } from "node:path";
import { randomUUID as randomUUID5 } from "node:crypto";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/files/private-directory.js
import { lstat as lstat4, readdir as readdir2 } from "node:fs/promises";
import { isAbsolute as isAbsolute2, join as join6, relative as relative2, resolve as resolve4, sep as sep2 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/utils/digest.js
import { createHash as createHash2 } from "node:crypto";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/markers.js
import { lstat as lstat5 } from "node:fs/promises";
import { basename, dirname as dirname7, join as join7 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/format.js
function fillTemplate(template, values) {
  return template.replace(TEMPLATE_PLACEHOLDER, (_match, key) => String(values[key]));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/background-worker/worker.js
import { randomUUID as randomUUID6 } from "node:crypto";
import { resolve as resolve7 } from "node:path";
import { setTimeout as delay2 } from "node:timers/promises";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/background-worker/paths.js
import { join as join9, resolve as resolve6 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/background-worker/state.js
import { join as join10 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/bridge.js
import { join as join16, resolve as resolve10 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/stale-files.js
import { lstat as lstat7, readFile as readFile3, readdir as readdir3, rmdir as rmdir3 } from "node:fs/promises";
import { basename as basename3, dirname as dirname9, join as join11 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/files/missing.js
function ifMissing(fallback) {
  return (error2) => {
    if (errorCode(error2) === FILE_MISSING_CODE)
      return fallback;
    throw error2;
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/delivery/coordinator.js
import { join as join12, resolve as resolve8 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/delivery/constants.js
var DELIVERY_RETRY_MAX_MS = 30 * 60 * 1e3;
var DELIVERY_DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1e3;
var DELIVERY_REJECTED_REASON = "rejected";
var DELIVERY_AUTH_STATUSES = [401, 403];
var DELIVERY_AUTH_HINT = "Check the LangSmith API key or CLI login and its access.";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/storage/capture/retry-state.js
var PROCESS_STARTED_AT_MS = Date.now();

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/delivery/deliver.js
import { setTimeout as delay3 } from "node:timers/promises";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/delivery/retry.js
function isRetryable(error2) {
  return error2?.retryable !== false;
}
function rejection(error2) {
  const status = failureStatus(error2);
  return status === void 0 ? { reason: DELIVERY_REJECTED_REASON } : { reason: `${DELIVERY_REJECTED_REASON} (HTTP ${status})`, status };
}
function authHint(status) {
  return status !== void 0 && DELIVERY_AUTH_STATUSES.includes(status) ? ` ${DELIVERY_AUTH_HINT}` : "";
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/auth/profile.js
import { createHash as createHash3 } from "node:crypto";
import { readFileSync as readFileSync4 } from "node:fs";
import { join as join13 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/sdk/sdk-constants.js
var SDK_DOUBLE_QUOTED = /^"(.*)"$/;
var SDK_SINGLE_QUOTED = /^'(.*)'$/;
var SDK_PROFILE_QUOTES = /^["']|["']$/g;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/sdk/normalize.js
function sdkSetting(value) {
  if (typeof value !== "string")
    return void 0;
  const trimmed = value.trim().replace(SDK_DOUBLE_QUOTED, "$1").replace(SDK_SINGLE_QUOTED, "$1");
  return trimmed.trim() === "" ? void 0 : trimmed;
}
function sdkProfileValue(value) {
  if (typeof value !== "string")
    return void 0;
  return value.trim().replace(SDK_PROFILE_QUOTES, "") || void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/auth/constants.js
var LOGIN_CONFIG_FILE_VARIABLE = "LANGSMITH_CONFIG_FILE";
var LOGIN_PROFILE_VARIABLE = "LANGSMITH_PROFILE";
var LOGIN_WORKSPACE_VARIABLE = "LANGSMITH_WORKSPACE_ID";
var LOGIN_HOME_VARIABLES = ["HOME", "USERPROFILE"];
var LOGIN_API_KEY_VARIABLES = ["LANGSMITH_API_KEY", "LANGCHAIN_API_KEY"];
var LOGIN_CONFIG_DIRECTORY = ".langsmith";
var LOGIN_CONFIG_FILE_NAME = "config.json";
var LOGIN_DEFAULT_PROFILE = "default";
var LOGIN_CONFIG_KEYS = {
  profiles: "profiles",
  currentProfile: "current_profile",
  oauth: "oauth",
  refreshToken: "refresh_token",
  accessToken: "access_token",
  apiKey: "api_key",
  workspaceId: "workspace_id",
  apiUrl: "api_url"
};
var LOGIN_DEFAULT_API_URL = "https://api.smith.langchain.com";
var LOGIN_URL_TRAILING_PATTERN = /(\/api\/v1)?\/*$/u;
var LOGIN_TOKEN_HASH = "sha256";
var LOGIN_TOKEN_HASH_LENGTH = 16;
var LOGIN_EXPIRED_MARKER_PREFIX = "login-expired-";
var LOGIN_CONFIG_FILE_ENCODING = "utf8";
var LOGIN_COMMAND = "langsmith auth login";
var LOGIN_PROFILE_FLAG = "--profile";
var LOGIN_PLAIN_PROFILE_PATTERN = /^[\w.-]+$/u;
var LOGIN_WINDOWS_PLATFORM = "win32";
var LOGIN_QUOTED_PROFILE_APOSTROPHE = "'\\''";
var LOGIN_NOTICE_HEADING = "\u26A0\uFE0F LANGSMITH TRACING IS PAUSED \u26A0\uFE0F";
var LOGIN_NONE_REASON = [
  LOGIN_NOTICE_HEADING,
  "You're not signed in to LangSmith so this session isn't being traced.",
  "\u25B6 Run the following command: {command}"
].join("\n");
var LOGIN_ENDPOINT_MISMATCH_REASON = [
  LOGIN_NOTICE_HEADING,
  "Your LangSmith login is for {loginUrl} but tracing sends to {apiUrl} so this session isn't being traced.",
  "\u25B6 Point tracing at {loginUrl}, or set an API key for {apiUrl}"
].join("\n");
var AGENT_ID_INVALID_REASON = [
  LOGIN_NOTICE_HEADING,
  "Your agent_id setting {agentId} isn't an agent ID so this session isn't being traced.",
  "\u25B6 Copy the agent ID from LangSmith, which uses lowercase letters, digits and hyphens"
].join("\n");
var AGENT_ID_PATTERN = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/u;
var LOGIN_WORKSPACE_INVALID_REASON = [
  LOGIN_NOTICE_HEADING,
  "Your workspace_id setting {workspaceId} isn't a workspace ID so this session isn't being traced.",
  "\u25B6 Copy the workspace ID from LangSmith's workspace settings"
].join("\n");
var LOGIN_WORKSPACE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
var LOGIN_REPLICA_REFUSED_REASON = "LangSmith replicas on {urls} need their own API key, so they're skipped.";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/auth/profile.js
function readLoginProfile(env, profile) {
  const configPath = loginConfigPath(env);
  return configPath === void 0 ? void 0 : readProfileAt(configPath, profile || env[LOGIN_PROFILE_VARIABLE] || void 0);
}
function loginCommand(profile, platform = process.platform) {
  if (!profile)
    return LOGIN_COMMAND;
  const name = LOGIN_PLAIN_PROFILE_PATTERN.test(profile) ? profile : platform === LOGIN_WINDOWS_PLATFORM ? `"${profile}"` : `'${profile.replaceAll("'", LOGIN_QUOTED_PROFILE_APOSTROPHE)}'`;
  return `${LOGIN_COMMAND} ${LOGIN_PROFILE_FLAG} ${name}`;
}
function readProfileAt(configPath, name) {
  let config;
  try {
    config = JSON.parse(readFileSync4(configPath, LOGIN_CONFIG_FILE_ENCODING));
  } catch {
    return void 0;
  }
  if (!isPlainRecord(config))
    return void 0;
  const profiles = config[LOGIN_CONFIG_KEYS.profiles];
  const current = config[LOGIN_CONFIG_KEYS.currentProfile];
  if (!isPlainRecord(profiles))
    return void 0;
  const profile = name ?? (typeof current === "string" ? current || void 0 : void 0) ?? (Object.hasOwn(profiles, LOGIN_DEFAULT_PROFILE) ? LOGIN_DEFAULT_PROFILE : void 0);
  const entry = profile !== void 0 && Object.hasOwn(profiles, profile) ? profiles[profile] : void 0;
  if (profile === void 0 || !isPlainRecord(entry))
    return void 0;
  const credentials = entry[LOGIN_CONFIG_KEYS.oauth];
  const oauth = isPlainRecord(credentials) ? credentials : {};
  const secret = sdkProfileValue(oauth[LOGIN_CONFIG_KEYS.refreshToken]) ?? sdkProfileValue(oauth[LOGIN_CONFIG_KEYS.accessToken]) ?? sdkProfileValue(entry[LOGIN_CONFIG_KEYS.apiKey]);
  if (secret === void 0)
    return void 0;
  const accessToken = sdkProfileValue(oauth[LOGIN_CONFIG_KEYS.accessToken]);
  const workspaceId = sdkSetting(entry[LOGIN_CONFIG_KEYS.workspaceId]);
  return {
    configPath,
    profile,
    ...workspaceId === void 0 ? {} : { workspaceId },
    apiUrl: sdkSetting(entry[LOGIN_CONFIG_KEYS.apiUrl]) ?? LOGIN_DEFAULT_API_URL,
    tokenHash: credentialHash(secret),
    ...accessToken === void 0 ? {} : { accessTokenHash: credentialHash(accessToken) }
  };
}
function expiredMarkerPrefix(login) {
  return `${LOGIN_EXPIRED_MARKER_PREFIX}${credentialHash(`${login.configPath}
${login.profile}`)}.`;
}
function sameServer(left, right) {
  return serverKey(left) === serverKey(right);
}
function serverKey(value) {
  try {
    const url = new URL(sdkSetting(value) ?? "");
    return `${url.origin}${url.pathname.replace(LOGIN_URL_TRAILING_PATTERN, "")}`;
  } catch {
    return value;
  }
}
function loginConfigPath(env) {
  const explicit = env[LOGIN_CONFIG_FILE_VARIABLE];
  if (explicit)
    return explicit;
  const home = LOGIN_HOME_VARIABLES.map((name) => env[name]).find((value) => value !== void 0);
  return home ? join13(home, LOGIN_CONFIG_DIRECTORY, LOGIN_CONFIG_FILE_NAME) : void 0;
}
function credentialHash(value) {
  return createHash3(LOGIN_TOKEN_HASH).update(value).digest("hex").slice(0, LOGIN_TOKEN_HASH_LENGTH);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/auth/expiry-constants.js
var LOGIN_EXPIRED_STATUS = 401;
var LOGIN_PAUSED_NOTICE = [
  LOGIN_NOTICE_HEADING,
  "Your LangSmith login expired so this session isn't being traced.",
  "\u25B6 Run the following command: {command}"
].join("\n");
var LOGIN_KEY_REJECTED_NOTICE = [
  LOGIN_NOTICE_HEADING,
  "Your LangSmith API key was rejected so this session isn't being traced.",
  "\u25B6 Replace the key, or remove it and run: langsmith auth login"
].join("\n");
var LOGIN_NO_ACCESS_STATUS = 403;
var LOGIN_NO_ACCESS_SUFFIX = ".no-access";
var LOGIN_NO_ACCESS_NOTICE = [
  LOGIN_NOTICE_HEADING,
  "LangSmith denied access to this workspace so this session isn't being traced.",
  "\u25B6 Check your workspace, or use a key or login that has access"
].join("\n");
var LOGIN_MARKER_WARNING = "Could not record the expired LangSmith login:";
var LOGIN_CLEANUP_WARNING = "Could not clear the LangSmith sign-in marker:";
var LOGIN_STATE_FILE = "sign-in.json";
var LOGIN_NOTICE_KIND = "login-expired";
var LOGIN_KEY_REJECTED_ENTRY = "api-key-rejected.";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/auth/expiry.js
import { join as join14 } from "node:path";
var unrecorded = /* @__PURE__ */ new Set();
async function recordExpiredLogin(login, sentTokenHash, storageRoot, denied = false) {
  try {
    const profile = readProfileAt(login.configPath, login.profile);
    if (profile === void 0 || profile.accessTokenHash !== sentTokenHash)
      return "superseded";
    const key = `${expiredMarkerPrefix(profile)}${profile.tokenHash}${denied ? LOGIN_NO_ACCESS_SUFFIX : ""}`;
    const claim = await claimLogin(profile, key, storageRoot);
    if (claim === "existing" || claim === "unrecorded" && unrecorded.has(key))
      return "already-handled";
    if (claim === "unrecorded")
      unrecorded.add(key);
  } catch (error2) {
    console.warn(LOGIN_MARKER_WARNING, describe(error2));
  }
  console.warn(denied ? LOGIN_NO_ACCESS_NOTICE : pausedNotice(login.profile));
  return "notice";
}
async function recordRejectedKey(key, storageRoot, denied = false) {
  if (storageRoot === void 0)
    return;
  const path3 = join14(storageRoot, LOGIN_STATE_FILE);
  const entry = `${rejectedKeyEntry(key)}${denied ? LOGIN_NO_ACCESS_SUFFIX : ""}`;
  try {
    if (!await claimStateEntry(path3, entry, Infinity))
      return;
    await forgetLogins(storageRoot, rejectedKeyEntry(key), entry);
  } catch {
    return;
  }
  console.warn(denied ? LOGIN_NO_ACCESS_NOTICE : LOGIN_KEY_REJECTED_NOTICE);
}
async function clearRejectedKey(storageRoot, key) {
  const entry = key === void 0 ? LOGIN_KEY_REJECTED_ENTRY : rejectedKeyEntry(key);
  if (storageRoot !== void 0)
    await clearMarkers(storageRoot, entry);
}
function readLoginNotice(storageRoot, env = process.env, rejected, profile) {
  const saved = loginStore(storageRoot).read();
  const recorded = (key2) => unrecorded.has(key2) || saved[key2] !== void 0;
  const login = rejected === void 0 ? readLoginProfile(env, profile) : void 0;
  const key = rejected === void 0 ? loginExpiryKey(login) : rejectedKeyEntry(rejected);
  if (key === void 0)
    return void 0;
  if (recorded(key))
    return login === void 0 ? LOGIN_KEY_REJECTED_NOTICE : pausedNotice(login.profile);
  return recorded(`${key}${LOGIN_NO_ACCESS_SUFFIX}`) ? LOGIN_NO_ACCESS_NOTICE : void 0;
}
async function clearLoginExpiry(login, storageRoot) {
  const prefix = expiredMarkerPrefix(login);
  for (const key of unrecorded)
    if (key.startsWith(prefix))
      unrecorded.delete(key);
  if (storageRoot !== void 0)
    await clearMarkers(storageRoot, prefix);
}
async function clearMarkers(storageRoot, prefix) {
  try {
    await forgetLogins(storageRoot, prefix, void 0);
  } catch (error2) {
    console.warn(LOGIN_CLEANUP_WARNING, describe(error2));
  }
}
async function claimLogin(profile, key, storageRoot) {
  if (storageRoot === void 0)
    return "unrecorded";
  try {
    if (!await claimStateEntry(join14(storageRoot, LOGIN_STATE_FILE), key, Infinity))
      return "existing";
  } catch (error2) {
    console.warn(LOGIN_MARKER_WARNING, describe(error2));
    return "unrecorded";
  }
  await forgetLogins(storageRoot, expiredMarkerPrefix(profile), key);
  return "claimed";
}
function pausedNotice(profile) {
  return fillTemplate(LOGIN_PAUSED_NOTICE, { command: loginCommand(profile) });
}
function loginExpiryKey(profile) {
  return profile && `${expiredMarkerPrefix(profile)}${profile.tokenHash}`;
}
function rejectedKeyEntry({ apiKey, apiUrl }) {
  const credential = `${sdkSetting(apiKey) ?? apiKey}
${serverKey(apiUrl)}`;
  return `${LOGIN_KEY_REJECTED_ENTRY}${credentialHash(credential)}`;
}
async function forgetLogins(storageRoot, prefix, keep) {
  const forget = (key) => key.startsWith(prefix) && key !== keep;
  const store = loginStore(storageRoot);
  if (Object.keys(store.read()).some(forget))
    await store.update((state) => Object.fromEntries(Object.entries(state).filter(([key]) => !forget(key))));
}
function loginStore(storageRoot) {
  return createStateStore({
    path: join14(storageRoot, LOGIN_STATE_FILE),
    warn: () => void 0
  });
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/metadata/constants.js
var CODING_AGENT_SCHEMA_VERSION = "coding-agent-v1";
var CODING_AGENT_PURPOSE = "coding";
var GIT_METADATA_KEYS = {
  repository: "ls_git_repo",
  repositoryUrl: "ls_git_repo_url",
  provider: "ls_repo_provider",
  branch: "ls_git_branch",
  commit: "ls_git_commit_hash"
};
var LEGACY_GIT_METADATA_KEYS = {
  repository: "repository_name",
  repositoryUrl: "repository_url",
  provider: "repository_provider",
  branch: "git_branch",
  commit: "git_commit_sha"
};
var ATTRIBUTION_IDENTIFIER_KEY = "ls_attribution_identifier";
var REPOSITORY_METADATA_KEYS = [
  GIT_METADATA_KEYS.repository,
  GIT_METADATA_KEYS.provider,
  GIT_METADATA_KEYS.repositoryUrl,
  GIT_METADATA_KEYS.branch,
  GIT_METADATA_KEYS.commit,
  LEGACY_GIT_METADATA_KEYS.repository,
  LEGACY_GIT_METADATA_KEYS.provider,
  LEGACY_GIT_METADATA_KEYS.repositoryUrl,
  LEGACY_GIT_METADATA_KEYS.branch,
  LEGACY_GIT_METADATA_KEYS.commit,
  ATTRIBUTION_IDENTIFIER_KEY
];
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
var CODING_AGENT_AGENT_TYPES = ["root", "subagent", "middleware", "compaction"];
var CODING_AGENT_SCHEMA_INTEGRATIONS = [
  "claude-code",
  "openai-codex",
  "deepagents-code",
  "cursor",
  "pi"
];
var CODING_AGENT_CORE_INTEGRATIONS = [
  "claude-code",
  "cursor",
  "openai-codex"
];
var CODING_AGENT_CODEX_INTEGRATION = ["openai-codex"];
var CODING_AGENT_RUNTIME_NAMES = {
  "claude-code": "Claude Code",
  "openai-codex": "Codex",
  "deepagents-code": "Deep Agents Code",
  cursor: "Cursor",
  pi: "Pi"
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
var TRUSTED_METADATA = /* @__PURE__ */ Symbol("coding-agent trusted metadata");
var METADATA_MODE_NAME = "metadata";
var METADATA_MODE_STATUS_VALUES = ["running", "completed", "error"];
var CODING_AGENT_RUNTIME_LIBRARY = "langsmith";
var CODING_AGENT_RUNTIME_SDK = "langsmith-js";
var CODING_AGENT_RELEASE_ENVIRONMENT_VARIABLES = [
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
var CODING_AGENT_ENVIRONMENT_METADATA_PREFIXES = ["LANGCHAIN_", "LANGSMITH_"];
var CODING_AGENT_ENVIRONMENT_METADATA_EXCLUDED = [
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
var CODING_AGENT_ENVIRONMENT_METADATA_SENSITIVE_SUBSTRINGS = [
  "key",
  "secret",
  "token",
  "password",
  "passwd",
  "pwd",
  "credential",
  "email"
];
var CODING_AGENT_ENVIRONMENT_METADATA_ENDPOINT_SUBSTRINGS = [
  "endpoint",
  "proxy",
  "url",
  "auth",
  "header"
];
var CODING_AGENT_REVISION_ID_VARIABLE = "LANGCHAIN_REVISION_ID";
var CODING_AGENT_REVISION_ID_KEY = "revision_id";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/metadata/contract.js
function field(key, options = {}) {
  return { key, ...CODING_AGENT_FIELD_DEFAULTS, ...options };
}
var structural = (key, options = {}) => field(key, { ...CODING_AGENT_STRUCTURAL_FIELD_DEFAULTS, ...options });
var provider = (key, options = {}) => field(key, { ...CODING_AGENT_PROVIDER_FIELD_DEFAULTS, ...options });
var CODING_AGENT_V1_CONTRACT = {
  schemaVersion: CODING_AGENT_SCHEMA_VERSION,
  integrations: CODING_AGENT_SCHEMA_INTEGRATIONS,
  runtimeNames: CODING_AGENT_RUNTIME_NAMES,
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
      allowedValues: Object.values(CODING_AGENT_RUNTIME_NAMES)
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
    field(GIT_METADATA_KEYS.repositoryUrl, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(GIT_METADATA_KEYS.provider, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(GIT_METADATA_KEYS.repository, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(GIT_METADATA_KEYS.branch, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(GIT_METADATA_KEYS.commit, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(LEGACY_GIT_METADATA_KEYS.repositoryUrl, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(LEGACY_GIT_METADATA_KEYS.provider, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(LEGACY_GIT_METADATA_KEYS.repository, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(LEGACY_GIT_METADATA_KEYS.branch, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field(LEGACY_GIT_METADATA_KEYS.commit, CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("cwd", CODING_AGENT_WHERE_KNOWN_FIELD_OPTIONS),
    field("ls_skill_name", {
      appliesTo: CODING_AGENT_RUN_SCOPES.tool,
      metadataModeIntegrations: CODING_AGENT_CORE_INTEGRATIONS
    }),
    field(ATTRIBUTION_IDENTIFIER_KEY),
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
  runtime: {
    library: CODING_AGENT_RUNTIME_LIBRARY,
    sdk: CODING_AGENT_RUNTIME_SDK,
    releaseEnvironmentVariables: CODING_AGENT_RELEASE_ENVIRONMENT_VARIABLES,
    environmentMetadata: {
      prefixes: CODING_AGENT_ENVIRONMENT_METADATA_PREFIXES,
      excluded: CODING_AGENT_ENVIRONMENT_METADATA_EXCLUDED,
      sensitiveSubstrings: CODING_AGENT_ENVIRONMENT_METADATA_SENSITIVE_SUBSTRINGS,
      endpointSubstrings: CODING_AGENT_ENVIRONMENT_METADATA_ENDPOINT_SUBSTRINGS,
      revisionId: {
        variable: CODING_AGENT_REVISION_ID_VARIABLE,
        key: CODING_AGENT_REVISION_ID_KEY
      }
    }
  },
  integrationPolicies: CODING_AGENT_INTEGRATION_POLICIES
};

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/metadata/git-names.js
function withBothGitMetadataNames(metadata) {
  const both = { ...metadata };
  for (const role of Object.keys(GIT_METADATA_KEYS)) {
    const value = both[GIT_METADATA_KEYS[role]] ?? both[LEGACY_GIT_METADATA_KEYS[role]];
    if (value === void 0)
      continue;
    both[GIT_METADATA_KEYS[role]] ??= value;
    both[LEGACY_GIT_METADATA_KEYS[role]] ??= value;
  }
  return both;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/metadata/validation.js
function metadataFieldTypeIssue(field2, value) {
  const matchesType = field2.type === "string" ? typeof value === "string" && value.length > 0 : field2.type === "integer" ? typeof value === "number" && Number.isSafeInteger(value) && value >= 1 : isPlainRecord(value);
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
  if (!isPlainRecord(value))
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
  if (!isPlainRecord(value))
    return {};
  const issues = new Map(validateProviderMetadata(value, integration, runType).map((issue) => [issue.key, issue]));
  return Object.fromEntries(Object.entries(value).filter(([key, entry]) => entry !== void 0 && !issues.has(key)));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/metadata/builder.js
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
  const merged = {};
  for (const piece of full) {
    if (piece)
      Object.assign(merged, piece);
  }
  const result = withBothGitMetadataNames(merged);
  Object.defineProperty(result, TRUSTED_METADATA, { value: trusted });
  return result;
}
function trustedCodingAgentMetadata(metadata) {
  return metadata?.[TRUSTED_METADATA];
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/metadata/runtime.js
function forwardsEnvironmentVariable(name, value, environmentMetadata) {
  return typeof value === "string" && environmentMetadata.prefixes.some((prefix) => name.startsWith(prefix)) && !environmentMetadata.excluded.includes(name) && ![...environmentMetadata.sensitiveSubstrings, ...environmentMetadata.endpointSubstrings].some((part) => name.toLowerCase().includes(part));
}
function buildCodingAgentRuntimeMetadata(options) {
  const { library, sdk, releaseEnvironmentVariables, environmentMetadata } = CODING_AGENT_V1_CONTRACT.runtime;
  const runtime = {
    library,
    runtime: options.runtime,
    sdk,
    sdk_version: options.sdkVersion
  };
  for (const name of releaseEnvironmentVariables) {
    const value = options.env[name];
    if (value !== void 0)
      runtime[name] = value;
  }
  const metadata = {};
  for (const [name, value] of Object.entries(options.env)) {
    if (!forwardsEnvironmentVariable(name, value, environmentMetadata))
      continue;
    metadata[name === environmentMetadata.revisionId.variable ? environmentMetadata.revisionId.key : name] = value;
  }
  return { runtime, metadata };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/metadata/privacy.js
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/tslib.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/uuid.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/errors.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/core/error.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/values.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/sleep.mjs
var sleep = (ms) => new Promise((resolve17) => setTimeout(resolve17, ms));

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/version.mjs
var VERSION = "0.11.6";

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/detect-platform.mjs
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
  return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/shims.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/request-options.mjs
var FallbackEncoder = ({ headers, body }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  };
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/qs/formats.mjs
var default_format = "RFC3986";
var default_formatter = (v) => String(v);
var formatters = {
  RFC1738: (v) => String(v).replace(/%20/g, "+"),
  RFC3986: default_formatter
};
var RFC1738 = "RFC1738";

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/qs/utils.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/qs/stringify.mjs
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
    return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date);
  },
  skipNulls: false,
  strictNullHandling: false
};
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
var sentinel = {};
function inner_stringify(object2, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder4, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
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
      return encoder4 && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder4(prefix, defaults.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder4) {
      const key_value = encodeValuesOnly ? prefix : encoder4(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder4(obj, defaults.encoder, charset, "value", format))
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
    if (encodeValuesOnly && encoder4) {
      obj = maybe_map(obj, encoder4);
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
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder4,
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/query.mjs
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "repeat" });
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/bytes.mjs
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
var encodeUTF8_;
function encodeUTF8(str) {
  let encoder4;
  return (encodeUTF8_ ?? (encoder4 = new globalThis.TextEncoder(), encodeUTF8_ = encoder4.encode.bind(encoder4)))(str);
}
var decodeUTF8_;
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/decoders/line.mjs
var _LineDecoder_buffer;
var _LineDecoder_carriageReturnIndex;
var LineDecoder = class {
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
    const lines = [];
    let patternIndex;
    while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
      if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
        continue;
      }
      if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
        lines.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
        __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        continue;
      }
      const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
      const line = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
      lines.push(line);
      __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
      __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
    }
    return lines;
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/log.mjs
var levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500
};
var parseLogLevel = (maybeLevel, sourceName, client) => {
  if (!maybeLevel) {
    return void 0;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/core/streaming.mjs
var _Stream_client;
var Stream = class _Stream {
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
var SSEDecoder = class {
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
function partition(str, delimiter) {
  const index = str.indexOf(delimiter);
  if (index !== -1) {
    return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
  }
  return [str, "", ""];
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/parse.mjs
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
    const text = await response.text();
    return text;
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/core/api-promise.mjs
var _APIPromise_client;
var APIPromise = class _APIPromise extends Promise {
  constructor(client, responsePromise, parseResponse = defaultParseResponse) {
    super((resolve17) => {
      resolve17(null);
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/core/pagination.mjs
var _AbstractPage_client;
var AbstractPage = class {
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
var PagePromise = class extends APIPromise {
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
var OffsetPaginationTopLevelArray = class extends AbstractPage {
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
var OffsetPaginationIssues = class extends AbstractPage {
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
var OffsetPaginationOnlineEvaluators = class extends AbstractPage {
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
var ItemsCursorPostPagination = class extends AbstractPage {
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
var ItemsCursorGetPagination = class extends AbstractPage {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/uploads.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/to-file.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/core/resource.mjs
var APIResource = class {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/headers.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/path.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/agents.mjs
var Agents = class extends APIResource {
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
    return this._client.get(path`/api/v1/agents/${agentID}`, { query, ...options });
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
    return this._client.patch(path`/api/v1/agents/${agentID}`, { body, ...options });
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
    return this._client.delete(path`/api/v1/agents/${agentID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/annotation-queues/items.mjs
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
   * the page. Optional min_start_time/max_start_time bound the item's trace start
   * time; items with no start time are excluded when either bound is set.
   * direction=backward returns items before the supplied cursor. The response
   * contains item metadata only, not expanded run or thread payloads.
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
   * Remove RUN or THREAD items from a single annotation queue by item ID. Both
   * active and completed items can be removed.
   */
  deleteAll(queueID, body, options) {
    return this._client.post(path`/api/v1/platform/annotation-queues/${queueID}/items/delete`, {
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
    return this._client.get(path`/api/v1/platform/annotation-queues/${queueID}/items/count`, {
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
    return this._client.get(path`/api/v1/platform/annotation-queues/${queue_id}/items/${itemID}/placement`, options);
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/annotation-queues/runs.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/annotation-queues/annotation-queues.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/datasets/examples.mjs
var Examples = class extends APIResource {
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
    return this._client.delete(path`/api/v1/platform/datasets/${dataset_id}/examples/${exampleID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/datasets/experiment-runs.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/datasets/datasets.mjs
var Datasets = class extends APIResource {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/evaluators.mjs
var Evaluators = class extends APIResource {
  /**
   * List all run rules.
   */
  list(query = {}, options) {
    return this._client.get("/api/v1/runs/rules", { query, ...options });
  }
  /**
   * Create a decision-model evaluator (Jev, SemIf or OpenAI Decisions) from its
   * prompt and questions, and attach it to a project or dataset. Each question's key
   * becomes a feedback key.
   */
  createDecisionModel(body, options) {
    return this._client.post("/api/v1/runs/rules/decision-models", { body, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/fleet/threads.mjs
var Threads = class extends APIResource {
  /**
   * Starts or resumes the sandbox referenced by the thread and returns when it is
   * ready. The operation is idempotent. The thread must include
   * sandbox.sandbox_slug.
   */
  activateSandbox(threadID, options) {
    return this._client.post(path`/v1/fleet/threads/${threadID}/sandbox-activation`, options);
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/fleet/fleet.mjs
var Fleet = class extends APIResource {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/info.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/issues.mjs
var Issues = class extends APIResource {
  /**
   * **Beta:** This endpoint is in active development and may change without notice.
   *
   * Returns one issue for the authenticated tenant.
   */
  retrieve(id, query = {}, options) {
    return this._client.get(path`/api/v1/platform/issues/${id}`, { query, ...options });
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/online-evaluators.mjs
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
   * Returns 409 when a code evaluator build is ENQUEUED or BUILDING.
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
   * Delete an evaluator. Returns 409 when a code evaluator build is ENQUEUED or
   * BUILDING, or when run rules still reference the evaluator and delete_run_rules
   * is false. When delete_run_rules is true, all run rules referencing this
   * evaluator are deleted first (same tenant) if the build is not in flight.
   * Associated llm_evaluators and code_evaluators rows are removed by foreign-key
   * cascade when the evaluator row is deleted.
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
   * session_id, or dataset_id is required. resource_id, type, feedback_key,
   * tag_value_id, and agent_id may be supplied with group_by to narrow listing
   * aggregations.
   */
  spend(query, options) {
    return this._client.get("/api/v1/platform/evaluators/spend", { query, ...options });
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/product-feedback.mjs
var ProductFeedback = class extends APIResource {
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
    return this._client.get(path`/api/v1/platform/product-feedbacks/${id}`, options);
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/prompt-webhooks.mjs
var PromptWebhooks = class extends APIResource {
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
    return this._client.get(path`/api/v1/prompt-webhooks/${webhookID}`, options);
  }
  /**
   * Update a specific prompt webhook.
   *
   * Omitted fields keep their current values; list fields and headers that are set
   * replace the stored values.
   */
  update(webhookID, body, options) {
    return this._client.patch(path`/api/v1/prompt-webhooks/${webhookID}`, { body, ...options });
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
    return this._client.delete(path`/api/v1/prompt-webhooks/${webhookID}`, {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/public/runs.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/public/public.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/runs/share.mjs
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
   *   {
   *     session_id: '018e4c7e-a9fb-7ef0-a5b6-6ea3a82e9327',
   *     trace_id: '018e4c7e-a9fb-7ef0-a5b6-6ea3a82e9327',
   *   },
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
   *   { session_id: '018e4c7e-a9fb-7ef0-a5b6-6ea3a82e9327' },
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/core/query-streaming.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/runs/streaming.mjs
var Streaming = class extends APIResource {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/runs/runs.mjs
var Runs3 = class extends APIResource {
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
    return this._client.get(path`/api/v2/runs/${runID}/url`, { query, ...options });
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
    return this._client.get(path`/api/v2/runs/${runID}`, {
      query,
      ...options,
      headers: buildHeaders([{ ...Accept != null ? { Accept } : void 0 }, options?.headers])
    });
  }
};
Runs3.Streaming = Streaming;
Runs3.Share = Share;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/sandboxes/boxes.mjs
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
   * Removes the sharing grant for one port, or for every port when port is omitted.
   * A LangSmith login URL stops working immediately. A previously minted service
   * token is not revoked and stays valid until it expires, but no new one can be
   * issued from the removed grant.
   */
  deleteServiceURL(name, params = {}, options) {
    const { port } = params ?? {};
    return this._client.delete(path`/api/v2/sandboxes/boxes/${name}/service-urls`, {
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
    return this._client.post(path`/api/v2/sandboxes/boxes/${name}/download-url`, { body, ...options });
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
    return this._client.post(path`/api/v2/sandboxes/boxes/${name}/service-url`, { body, ...options });
  }
  /**
   * Retrieve the lightweight status of a sandbox for polling.
   */
  getStatus(name, options) {
    return this._client.get(path`/api/v2/sandboxes/boxes/${name}/status`, options);
  }
  /**
   * Returns one entry per port the sandbox is currently reachable on, so a caller
   * can see what is shared before turning it off. Expired token grants are omitted.
   * Cursors are opaque and only valid on this endpoint; do not parse or construct
   * one.
   */
  listServiceURLs(name, query = {}, options) {
    return this._client.getAPIList(path`/api/v2/sandboxes/boxes/${name}/service-urls`, ItemsCursorGetPagination, { query, ...options });
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/sandboxes/registries.mjs
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
    return this._client.delete(path`/api/v2/sandboxes/registries/${name}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/sandboxes/snapshots.mjs
var Snapshots = class extends APIResource {
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
    return this._client.get(path`/api/v2/sandboxes/snapshots/${snapshotID}`, options);
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/sandboxes/sandboxes.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/sessions.mjs
var Sessions = class extends APIResource {
  /**
   * Create a new project.
   */
  create(params, options) {
    const { upsert, ...body } = params;
    return this._client.post("/api/v1/sessions", { query: { upsert }, body, ...options });
  }
  /**
   * Update a project.
   */
  update(project_id, body, options) {
    return this._client.patch(path`/api/v1/sessions/${project_id}`, { body, ...options });
  }
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/threads/share.mjs
var Share2 = class extends APIResource {
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
    return this._client.post(path`/api/v2/threads/${threadID}/share`, { body, ...options });
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
    return this._client.get(path`/api/v2/threads/${threadID}/share`, { query, ...options });
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
    return this._client.delete(path`/api/v2/threads/${threadID}/share`, {
      query: { project_id },
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/threads/streaming.mjs
var Streaming2 = class extends APIResource {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/threads/threads.mjs
var Threads2 = class extends APIResource {
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
    return this._client.getAPIList(path`/api/v2/threads/${threadID}/traces`, ItemsCursorGetPagination, { query, ...options });
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
    return this._client.get(path`/api/v2/threads/${threadID}/stats`, { query, ...options });
  }
};
Threads2.Streaming = Streaming2;
Threads2.Share = Share2;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/traces/streaming.mjs
var Streaming3 = class extends APIResource {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/resources/traces/traces.mjs
var Traces = class extends APIResource {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/internal/utils/env.mjs
var readEnv = (env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() || void 0;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
  }
  return void 0;
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/client.mjs
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
    Object.defineProperty(this, "evaluators", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Evaluators(this)
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
  makeStatusError(status, error2, message, headers) {
    return APIError.generate(status, error2, message, headers);
  }
  buildURL(path3, query, defaultBaseURL) {
    const baseURL = !__classPrivateFieldGet(this, _Langsmith_instances, "m", _Langsmith_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
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
Langsmith.Evaluators = Evaluators;
Langsmith.OnlineEvaluators = OnlineEvaluators;
Langsmith.Public = Public;
Langsmith.AnnotationQueues = AnnotationQueues;
Langsmith.PromptWebhooks = PromptWebhooks;
Langsmith.Info = Info;
Langsmith.Issues = Issues;
Langsmith.Sandboxes = Sandboxes;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/env.mjs
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
      sdk_version: VERSION,
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/address.mjs
var UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var AGENT_ID_PATTERN2 = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;
var ENVIRONMENTS = ["local", "development", "staging", "production"];
var LRN_PATTERN = /^lrn:agents\/([^/]+)\/environments\/([^/]+)$/;
var ENV_NAMES = ["LANGSMITH_AGENT_ID", "LANGSMITH_AGENT_ENVIRONMENT"];
var EnvAddressError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "EnvAddressError";
  }
};
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
  if (typeof id !== "string" || !AGENT_ID_PATTERN2.test(id)) {
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/regex.mjs
var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/validate.mjs
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default = validate;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/parse.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/stringify.mjs
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr2, offset = 0) {
  return (byteToHex[arr2[offset + 0]] + byteToHex[arr2[offset + 1]] + byteToHex[arr2[offset + 2]] + byteToHex[arr2[offset + 3]] + "-" + byteToHex[arr2[offset + 4]] + byteToHex[arr2[offset + 5]] + "-" + byteToHex[arr2[offset + 6]] + byteToHex[arr2[offset + 7]] + "-" + byteToHex[arr2[offset + 8]] + byteToHex[arr2[offset + 9]] + "-" + byteToHex[arr2[offset + 10]] + byteToHex[arr2[offset + 11]] + byteToHex[arr2[offset + 12]] + byteToHex[arr2[offset + 13]] + byteToHex[arr2[offset + 14]] + byteToHex[arr2[offset + 15]]).toLowerCase();
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/rng.mjs
var rnds8 = new Uint8Array(16);
function rng() {
  return crypto.getRandomValues(rnds8);
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/v4.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/sha1.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/v35.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/v5.mjs
function v5(value, namespace, buf, offset) {
  return v35(80, sha1_default, value, namespace, buf, offset);
}
v5.DNS = DNS;
v5.URL = URL2;
var v5_default = v5;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/uuid/src/v7.mjs
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
var v7_default = v7;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/api_url.mjs
function getOpenAPIBaseUrl(apiUrl) {
  const url = apiUrl.replace(/\/$/, "");
  for (const suffix of ["/api/v1", "/api"]) {
    if (url.endsWith(suffix))
      return url.slice(0, -suffix.length);
  }
  return url;
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/experimental/otel/constants.mjs
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
var GEN_AI_TOOL_NAME = "gen_ai.tool.name";
var GEN_AI_TOOL_CALL_ID = "gen_ai.tool.call.id";
var GEN_AI_TOOL_DEFINITIONS = "gen_ai.tool.definitions";
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/singletons/otel.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/experimental/otel/translator.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/is-network-error/index.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/p-retry/index.mjs
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
    await new Promise((resolve17, reject) => {
      const onAbort = () => {
        clearTimeout(timeoutToken);
        options.signal?.removeEventListener("abort", onAbort);
        reject(options.signal.reason);
      };
      const timeoutToken = setTimeout(() => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve17();
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/p-queue.mjs
var import_p_queue = __toESM(require_dist(), 1);
var PQueue = "default" in import_p_queue.default ? import_p_queue.default.default : import_p_queue.default;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/async_caller.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/messages.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/warn.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/xxhash/xxhash.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/_uuid.mjs
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
    b.set(h.slice(10, 16), 0);
  }
  b[6] = 112 | h[0] & 15;
  b[7] = h[1];
  b[8] = 128 | h[2] & 63;
  b.set(h.slice(3, 10), 9);
  return bytesToUuid(b);
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/compressed_runs.mjs
var encoder = new TextEncoder();
var CompressedRunBuffer = class {
  constructor() {
    Object.defineProperty(this, "boundary", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "----LangSmithFormBoundary" + Math.random().toString(36).slice(2)
    });
    Object.defineProperty(this, "uncompressedSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "count", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "context", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "onSent", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "writer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "chunks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "readDone", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    const stream = new CompressionStream("gzip");
    this.writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    this.readDone = (async () => {
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done)
          return;
        this.chunks.push(value);
      }
    })();
  }
  static isSupported() {
    return typeof CompressionStream !== "undefined";
  }
  /** Resolves once gzip has taken the bytes, so the caller can drop them. */
  async writeParts(parts, context, onSent) {
    this.count += 1;
    this.context.push(context);
    this.onSent.push(onSent);
    for (const part of parts) {
      await this._write(encoder.encode(`--${this.boundary}\r
Content-Disposition: form-data; name="${part.name}"\r
Content-Type: ${part.contentType}\r
\r
`));
      await this._write(part.data);
      await this._write(encoder.encode("\r\n"));
    }
  }
  /** Close the multipart body and return the gzipped bytes. */
  async close() {
    await this._write(encoder.encode(`--${this.boundary}--\r
`));
    await this.writer.close();
    await this.readDone;
    const body = new Uint8Array(this.chunks.reduce((sum, c) => sum + c.byteLength, 0));
    let offset = 0;
    for (const chunk of this.chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    this.chunks = [];
    return body;
  }
  async _write(chunk) {
    this.uncompressedSize += chunk.byteLength;
    await this.writer.write(chunk);
  }
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/sampling.mjs
var SAMPLING_HASH_MODULUS = 1000000n;
var encoder2 = new TextEncoder();
var isSampledById = (identifier, samplingRate2) => {
  if (samplingRate2 === void 0 || samplingRate2 >= 1) {
    return true;
  }
  if (samplingRate2 <= 0) {
    return false;
  }
  if (identifier == null) {
    return true;
  }
  const bucket = XXH3_128(encoder2.encode(identifier.toLowerCase())) % SAMPLING_HASH_MODULUS;
  return Number(bucket) / Number(SAMPLING_HASH_MODULUS) < samplingRate2;
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/addressing.mjs
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
function logUntraced(error2) {
  warnOnce(`LangSmith is not tracing this call: ${error2.message}`);
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/v2_migration.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/error.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/prompts.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/fs.mjs
import * as nodeFs from "node:fs";
import * as nodeFsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { homedir } from "node:os";
import { randomUUID as randomUUID7 } from "node:crypto";
function resolveConfigPath(filePath) {
  const expanded = filePath === "~" || filePath.startsWith("~/") || filePath.startsWith("~\\") ? nodePath.join(homedir(), filePath.slice(1)) : filePath;
  const absolute = nodePath.resolve(expanded);
  return nodeFs.existsSync(absolute) ? nodeFs.realpathSync(absolute) : absolute;
}
function homeDirectory() {
  return homedir();
}
var path2 = nodePath;
async function mkdir5(dir) {
  await nodeFsPromises.mkdir(dir, { recursive: true });
}
async function writeFileAtomic(filePath, content) {
  const tempPath = `${filePath}.${randomUUID7()}.tmp`;
  const file = await nodeFsPromises.open(tempPath, "wx", 384);
  try {
    try {
      await file.writeFile(content, "utf8");
      await file.sync();
    } finally {
      await file.close();
    }
    await nodeFsPromises.rename(tempPath, filePath);
  } finally {
    await nodeFsPromises.rm(tempPath, { force: true });
  }
}
async function readdir5(dir) {
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
function writeFileSync2(filePath, content) {
  nodeFs.writeFileSync(filePath, content);
}
function renameSync4(oldPath, newPath) {
  nodeFs.renameSync(oldPath, newPath);
}
function unlinkSync2(filePath) {
  nodeFs.unlinkSync(filePath);
}
function readFileSync6(filePath) {
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
  await nodeFsPromises.rm(filePath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 10
  });
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/prompt_cache/index.mjs
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
      writeFileSync2(tempPath, JSON.stringify({ entries }, null, 2));
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
      const content = readFileSync6(filePath);
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/singletons/fetch.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/profile-lock.mjs
var LOCK_POLL_INTERVAL_MS = 10;
var OAUTH_REFRESH_LOCK_STALE_AFTER_MS = 15e3;
var LOCK_STALE_AFTER_MS = OAUTH_REFRESH_LOCK_STALE_AFTER_MS;
var LOCK_METADATA_FILE = "created_at";
function sleep2(ms) {
  return new Promise((resolve17) => setTimeout(resolve17, ms));
}
function isEEXIST(err) {
  return typeof err === "object" && err !== null && err.code === "EEXIST";
}
function lockMetadataLines(lockDir) {
  try {
    return readFileSync6(path2.join(lockDir, LOCK_METADATA_FILE)).split("\n");
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
async function removeStaleLock(lockDir) {
  const createdAt = lockCreatedAtMs(lockDir);
  if (createdAt === void 0 || Date.now() - createdAt <= LOCK_STALE_AFTER_MS) {
    return false;
  }
  await rmRecursive(lockDir);
  return true;
}
function lockOwner(lockDir) {
  const lines = lockMetadataLines(lockDir);
  if (lines && lines.length >= 2 && lines[1].trim()) {
    return lines[1].trim();
  }
  return void 0;
}
async function acquireOAuthRefreshLock(configPath, deadline) {
  const lockDir = `${resolveConfigPath(configPath)}.oauth.lock.lock`;
  const waitUntil = performance.now() + Math.max(0, deadline - Date.now());
  const parent = path2.dirname(lockDir);
  if (parent) {
    await mkdir5(parent);
  }
  const owner = globalThis.crypto.randomUUID();
  for (; ; ) {
    if (performance.now() >= waitUntil) {
      throw new Error("timed out acquiring OAuth refresh lock");
    }
    try {
      await mkdirExclusive(lockDir);
    } catch (err) {
      if (!isEEXIST(err)) {
        throw err;
      }
      if (!await removeStaleLock(lockDir)) {
        await sleep2(Math.min(LOCK_POLL_INTERVAL_MS, Math.max(0, waitUntil - performance.now())));
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/profiles.mjs
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
function getProfileConfigPath(selected) {
  const explicitPath = selected || getEnvironmentVariable("LANGSMITH_CONFIG_FILE");
  const configuredPath = explicitPath || path2.join(homeDirectory(), ".langsmith", "config.json");
  try {
    return resolveConfigPath(configuredPath);
  } catch {
    return void 0;
  }
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
    const config = JSON.parse(readFileSync6(configPath));
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
function accessTokenUsable(profile) {
  if (!trimConfigValue(profile.oauth?.access_token)) {
    return false;
  }
  const expiresAt = profile.oauth?.expires_at ? Date.parse(profile.oauth.expires_at) : Number.NaN;
  return Number.isNaN(expiresAt) || expiresAt > Date.now();
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
async function fetchOAuthMetadata(url, base, fetchImplementation, deadline) {
  const timeoutMs2 = Math.min(OAUTH_DISCOVERY_TIMEOUT_MS, deadline - Date.now());
  if (timeoutMs2 <= 0) {
    return void 0;
  }
  let response;
  try {
    response = await fetchImplementation(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs2)
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
async function resolveTokenEndpoint(apiUrl, fetchImplementation, deadline = Number.POSITIVE_INFINITY) {
  for (const base of oauthDiscoveryCandidates(apiUrl)) {
    for (const url of oauthMetadataUrls(base)) {
      const doc = await fetchOAuthMetadata(url, base, fetchImplementation, deadline);
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
  const apiKeyRef = trimConfigValue(profile.api_key_env) || trimConfigValue(profile.api_key_cmd);
  return {
    apiUrl: profile.api_url,
    apiKey,
    workspaceId: profile.workspace_id,
    oauthAccessToken,
    oauthRefreshToken,
    profileAuth: apiKey || oauthAccessToken || oauthRefreshToken || apiKeyRef ? new ProfileAuth(state) : void 0
  };
}
var ProfileApiKeyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ProfileApiKeyError";
  }
};
var ProfileRefreshLockError = class extends Error {
  constructor(message, options) {
    super(message);
    this.name = "ProfileRefreshLockError";
    if (options && "cause" in options) {
      this.cause = options.cause;
    }
  }
};
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
  /**
   * The auth header to snapshot into default headers. A profile API key that
   * cannot be resolved yields none here; `getAuthHeader` reports it when a
   * request needs it.
   */
  currentAuthHeader() {
    let header;
    try {
      header = currentAuthHeaderFromProfile(this.state);
    } catch (error2) {
      if (!(error2 instanceof ProfileApiKeyError)) {
        throw error2;
      }
      header = void 0;
    }
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
    const header = authHeaderFromProfile(this.state);
    this.rememberProfileAuthHeader(header);
    return header;
  }
  isProfileAuthorizationHeader(value) {
    return value === this.managedAuthorizationValue;
  }
  reloadProfile() {
    try {
      const config = JSON.parse(readFileSync6(this.state.configPath));
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
    const deadline = Date.now() + TOKEN_REFRESH_TIMEOUT_MS;
    let lock;
    try {
      try {
        lock = await acquireOAuthRefreshLock(this.state.configPath, deadline);
      } catch (error2) {
        if (!accessTokenUsable(this.state.profile)) {
          throw new ProfileRefreshLockError(`Could not refresh the expired OAuth token for LangSmith profile "${this.state.profileName}": failed to acquire the refresh lock next to ${this.state.configPath} (${error2 instanceof Error ? error2.message : String(error2)}). Another process may be refreshing it, or the config directory may not be writable; OAuth profiles need a writable config. Use an API key for read-only configs. A lock left by a crashed process is released automatically after ${OAUTH_REFRESH_LOCK_STALE_AFTER_MS / 1e3} seconds.`, { cause: error2 });
        }
        return;
      }
      const fresh = this.reloadProfile();
      const freshRefreshToken = fresh?.oauth?.refresh_token;
      if (!fresh || !freshRefreshToken || !shouldRefreshProfileToken(fresh)) {
        return;
      }
      const refreshApiUrl = trimConfigValue(fresh.api_url) ?? DEFAULT_API_URL;
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: OAUTH_CLIENT_ID,
        refresh_token: freshRefreshToken
      });
      const tokenEndpoint = await resolveTokenEndpoint(refreshApiUrl, fetchImplementation, deadline);
      if (Date.now() >= deadline) {
        return;
      }
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
    } catch (error2) {
      if (error2 instanceof ProfileRefreshLockError) {
        throw error2;
      }
      return;
    } finally {
      await lock?.release();
    }
  }
  rememberProfileAuthHeader(header) {
    this.managedAuthorizationValue = header?.name === "Authorization" ? header.value : void 0;
  }
};
function currentAuthHeaderFromProfile(state) {
  const { profile } = state;
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  if (oauthAccessToken) {
    return { name: "Authorization", value: `Bearer ${oauthAccessToken}` };
  }
  if (trimConfigValue(profile.oauth?.refresh_token)) {
    return void 0;
  }
  return authHeaderFromProfile(state);
}
function authHeaderFromProfile(state) {
  const { profile } = state;
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  if (oauthAccessToken) {
    return { name: "Authorization", value: `Bearer ${oauthAccessToken}` };
  }
  const apiKey = profileApiKey(state.profileName, profile);
  if (apiKey) {
    return { name: "x-api-key", value: apiKey };
  }
  return void 0;
}
function profileApiKey(profileName, profile) {
  const apiKey = trimConfigValue(profile.api_key);
  if (apiKey) {
    return apiKey;
  }
  const apiKeyEnv = trimConfigValue(profile.api_key_env);
  if (apiKeyEnv) {
    const key = getEnvironmentVariable(apiKeyEnv)?.trim();
    if (key) {
      return key;
    }
    throw new ProfileApiKeyError(`LangSmith profile "${profileName}" reads its API key from $${apiKeyEnv}, which is not set`);
  }
  if (trimConfigValue(profile.api_key_cmd)) {
    throw new ProfileApiKeyError(`LangSmith profile "${profileName}" gets its API key from a command (api_key_cmd), which the JS SDK does not support yet. Set api_key_env in the profile, or set LANGSMITH_API_KEY.`);
  }
  return void 0;
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/fast-safe-stringify/index.mjs
var LIMIT_REPLACE_NODE = "[...]";
var CIRCULAR_REPLACE_NODE = { result: "[Circular]" };
var arr = [];
var replacerStack = [];
var encoder3 = new TextEncoder();
function defaultOptions() {
  return {
    depthLimit: Number.MAX_SAFE_INTEGER,
    edgesLimit: Number.MAX_SAFE_INTEGER
  };
}
function encodeString(str) {
  return encoder3.encode(str);
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/worker_threads.mjs
import { Worker as NodeWorker } from "node:worker_threads";
var Worker = NodeWorker;
var WORKER_THREADS_AVAILABLE = true;

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/serialize_worker.mjs
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
    return new Promise((resolve17, reject) => {
      this.pending.set(id, { resolve: resolve17, reject });
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/client.mjs
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
var getTracingSamplingRate = (configRate) => {
  const samplingRateStr = configRate?.toString() ?? getLangSmithEnvironmentVariable("TRACING_SAMPLING_RATE");
  if (samplingRateStr === void 0) {
    return void 0;
  }
  const samplingRate2 = parseFloat(samplingRateStr);
  if (samplingRate2 < 0 || samplingRate2 > 1) {
    throw new Error(`LANGSMITH_TRACING_SAMPLING_RATE must be between 0 and 1 if set. Got: ${samplingRate2}`);
  }
  return samplingRate2;
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
      await new Promise((resolve17) => setTimeout(resolve17, retryAfter));
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
    const itemPromise = new Promise((resolve17) => {
      itemPromiseResolve = resolve17;
    });
    const size = estimateSerializedSize(item.item).size;
    if (this.sizeBytes + size > this.maxSizeBytes && this.sizeBytes > 0) {
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
  // Workspace ids are per instance: a replica with its own key on another host
  // drops the inherited one.
  _applyReplicaWorkspace(headers, options) {
    if (options?.workspaceId !== void 0) {
      headers["x-tenant-id"] = options.workspaceId;
    } else if (options?.apiUrl !== void 0 && options.apiKey !== void 0 && options.apiKey !== this.apiKey && new URL(options.apiUrl).host !== new URL(this.apiUrl).host) {
      delete headers["x-tenant-id"];
    }
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
    const hasApiKey2 = hasValue(getHeader("x-api-key"));
    const authorization = getHeader("authorization");
    const hasExplicitAuthorization = hasValue(authorization) && !this.isProfileManagedAuthorizationHeader(authorization ?? "", profileManagedAuthorization);
    if (this.apiKey !== void 0 && authHeader.name === "x-api-key") {
      const authorizationKey = getHeaderKey("authorization");
      if (authorizationKey) {
        delete headers[authorizationKey];
      }
      if (!hasApiKey2) {
        headers["x-api-key"] = authHeader.value;
      }
      return { ...init, headers };
    }
    if (authHeader.name === "Authorization") {
      if (!hasApiKey2 && !hasExplicitAuthorization) {
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
      if (!hasApiKey2) {
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
    Object.defineProperty(this, "_compressedBuffers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "_compressedWriteChain", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: Promise.resolve()
    });
    Object.defineProperty(this, "_compressedFlushTimeout", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_maxIngestMemoryBytes", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: DEFAULT_MAX_SIZE_BYTES
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
    this._maxIngestMemoryBytes = maxMemory;
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
        const workspaceId = item.workspaceId;
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
        await mkdir5(directory);
        _Client._fallbackDirsCreated.add(directory);
      }
      if (maxBytes !== void 0 && maxBytes > 0) {
        try {
          const entries = await readdir5(directory);
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
    if (this._shouldCompressOnQueue()) {
      this._moveQueueToCompressed();
      return itemPromise;
    }
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
  /** OTel and JSON batch need run objects, so they keep the queue. */
  _shouldCompressOnQueue() {
    const serverInfo = this._serverInfo;
    return serverInfo !== void 0 && this.langSmithToOTELTranslator === void 0 && !this._runCompressionDisabled && !this._multipartDisabled && CompressedRunBuffer.isSupported() && (serverInfo.batch_ingest_config?.use_multipart_endpoint ?? true) && serverInfo.instance_flags?.gzip_body_enabled === true;
  }
  /** Move queued runs into the gzip buffers, oldest first. */
  _moveQueueToCompressed() {
    const queued = this.autoBatchQueue.items.splice(0);
    for (const queuedItem of queued) {
      const { itemPromiseResolve, size } = queuedItem;
      void this._enqueueCompressed(size, {
        action: queuedItem.action,
        item: queuedItem.payload,
        otelContext: queuedItem.otelContext,
        apiKey: queuedItem.apiKey,
        apiUrl: queuedItem.apiUrl,
        workspaceId: queuedItem.workspaceId
      }).then(itemPromiseResolve);
    }
  }
  async _serializeQueuedOperation(item) {
    if (item.action === "feedback") {
      const feedback = item.item;
      return {
        parts: [await this._serializeFeedbackPart(feedback)],
        context: `trace=${feedback.trace_id},id=${feedback.id}`
      };
    }
    const prepared = item.action === "create" ? await this.prepareRunCreateOrUpdateInputs(item.item) : await this.prepareRunCreateOrUpdateInputs(item.item, {
      update: true
    });
    const attachments = prepared.attachments;
    delete prepared.attachments;
    return {
      parts: await this._serializeRunParts(item.action === "create" ? "post" : "patch", prepared, attachments),
      context: `trace=${prepared.trace_id},id=${prepared.id}`
    };
  }
  /** Gzip an operation into its destination's buffer. Resolves once sent. */
  _enqueueCompressed(queuedSize, item) {
    let onSent;
    const sent = new Promise((resolve17) => {
      onSent = resolve17;
    });
    const isDefault = item.apiKey === this.apiKey && item.apiUrl === this.apiUrl && item.workspaceId === this.workspaceId;
    const key = isDefault ? "default" : `${item.apiUrl ?? this.apiUrl}|${item.apiKey ?? this.apiKey}|${item.workspaceId ?? this.workspaceId ?? ""}`;
    const write2 = async () => {
      let serialized;
      try {
        serialized = await this._serializeQueuedOperation(item);
      } finally {
        this.autoBatchQueue.sizeBytes -= queuedSize;
      }
      const { parts, context } = serialized;
      const sizeLimitBytes = await this._getBatchSizeLimitBytes();
      const sizeLimit = await this._getBatchSizeLimit();
      const size = parts.reduce((sum, p) => sum + p.data.byteLength, 0);
      let entry = this._compressedBuffers.get(key);
      if (entry !== void 0 && entry.buffer.count > 0 && entry.buffer.uncompressedSize + size > this._maxIngestMemoryBytes) {
        this._compressedBuffers.delete(key);
        this._trackDrain(this._sendCompressedBuffer(entry));
        entry = void 0;
      }
      if (entry === void 0) {
        entry = {
          buffer: new CompressedRunBuffer(),
          apiKey: isDefault ? void 0 : item.apiKey ?? this.apiKey,
          apiUrl: isDefault ? void 0 : item.apiUrl ?? this.apiUrl,
          workspaceId: isDefault ? void 0 : item.workspaceId ?? this.workspaceId
        };
        this._compressedBuffers.set(key, entry);
      }
      await entry.buffer.writeParts(parts, context, onSent);
      if (entry.buffer.uncompressedSize >= sizeLimitBytes || entry.buffer.count >= sizeLimit) {
        this._compressedBuffers.delete(key);
        this._trackDrain(this._sendCompressedBuffer(entry));
      }
    };
    this._compressedWriteChain = this._compressedWriteChain.then(write2).catch((e) => {
      console.error("Error queueing run for tracing:", e);
      onSent();
    });
    if (!this.manualFlushMode && this._compressedFlushTimeout === void 0) {
      this._compressedFlushTimeout = setTimeout(() => {
        this._compressedFlushTimeout = void 0;
        this._trackDrain(this._flushCompressedBuffers());
      }, this.autoBatchAggregationDelayMs);
    }
    return sent;
  }
  /** Close and send a buffer already taken out of _compressedBuffers. */
  async _sendCompressedBuffer(entry) {
    const { buffer } = entry;
    try {
      const body = await buffer.close();
      await this._sendCompressedMultipart(body, buffer, entry);
    } catch (e) {
      console.error("Error exporting batch:", e);
    } finally {
      for (const onSent of buffer.onSent) {
        onSent();
      }
    }
  }
  async _flushCompressedBuffers() {
    const taken = this._compressedWriteChain.then(() => {
      const entries2 = [...this._compressedBuffers.values()];
      this._compressedBuffers.clear();
      return entries2;
    });
    this._compressedWriteChain = taken.then(() => void 0);
    const entries = await taken;
    await Promise.all(entries.map((entry) => this._sendCompressedBuffer(entry)));
  }
  async _sendCompressedMultipart(body, buffer, options) {
    const context = buffer.context.join("; ");
    const headers = {
      ...this._mergedHeaders,
      "Content-Type": `multipart/form-data; boundary=${buffer.boundary}`,
      "Content-Encoding": "gzip"
    };
    if (options.apiKey !== void 0) {
      headers["x-api-key"] = options.apiKey;
    }
    if (options.workspaceId !== void 0) {
      headers["x-tenant-id"] = options.workspaceId;
    }
    try {
      await this.batchIngestCaller.callWithOptions({ sizeBytes: body.byteLength }, async () => {
        const response = await this._fetch(`${options.apiUrl ?? this.apiUrl}/runs/multipart`, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions
        });
        await raiseForStatus(response, `Failed to send multipart request`, true);
        return response;
      });
    } catch (e) {
      if (isLangSmithNotFoundError(e)) {
        this._multipartDisabled = true;
      }
      console.warn(`${e.message.trim()}

Context: ${context}`);
      if (this.failedTracesDir) {
        await _Client._writeTraceToFallbackDir(this.failedTracesDir, body.buffer, {
          "Content-Type": `multipart/form-data; boundary=${buffer.boundary}`,
          "Content-Encoding": "gzip"
        }, "runs/multipart", this.failedTracesMaxBytes);
      }
    }
  }
  /**
   * Flushes current queued traces.
   */
  async flush() {
    const sizeLimitBytes = await this._getBatchSizeLimitBytes();
    const sizeLimit = await this._getBatchSizeLimit();
    await Promise.all([
      this.drainAutoBatchQueue({
        batchSizeLimitBytes: sizeLimitBytes,
        batchSizeLimit: sizeLimit
      }),
      this._flushCompressedBuffers()
    ]);
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
    this._applyReplicaWorkspace(headers, options);
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
    this._applyReplicaWorkspace(headers, options);
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
      const preparedUpdate = await this.prepareRunCreateOrUpdateInputs(update, {
        update: true
      });
      if (preparedUpdate.id !== void 0 && preparedUpdate.attachments !== void 0) {
        allAttachments[preparedUpdate.id] = {
          ...allAttachments[preparedUpdate.id],
          ...preparedUpdate.attachments
        };
      }
      delete preparedUpdate.attachments;
      preparedUpdateParams.push(preparedUpdate);
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
    const toMultipartPart = (part) => ({
      name: part.name,
      payload: new Blob([part.data], { type: part.contentType })
    });
    for (const [method, payloads] of [
      ["post", preparedCreateParams],
      ["patch", preparedUpdateParams]
    ]) {
      for (const originalPayload of payloads) {
        const attachments = originalPayload.id !== void 0 ? allAttachments[originalPayload.id] : void 0;
        if (originalPayload.id !== void 0) {
          delete allAttachments[originalPayload.id];
        }
        const parts = await this._serializeRunParts(method, originalPayload, attachments);
        accumulatedParts.push(...parts.map(toMultipartPart));
        accumulatedContext.push(`trace=${originalPayload.trace_id},id=${originalPayload.id}`);
      }
    }
    for (const feedback of feedbacks ?? []) {
      accumulatedParts.push(toMultipartPart(await this._serializeFeedbackPart(feedback)));
      accumulatedContext.push(`trace=${feedback.trace_id},id=${feedback.id}`);
    }
    await this._sendMultipartRequest(accumulatedParts, accumulatedContext.join("; "), options);
  }
  /** Serialize one run operation into its multipart parts. */
  async _serializeRunParts(method, originalPayload, attachments) {
    const parts = [];
    const { inputs, outputs, events, extra, error: error2, serialized, attachments: _attachments, ...payload } = originalPayload;
    const fields = { inputs, outputs, events, extra, error: error2, serialized };
    const stringifiedPayload = await this._serializeBody(payload, `Serializing for multipart ingestion of run with id: ${payload.id}`);
    parts.push({
      name: `${method}.${payload.id}`,
      contentType: `application/json; length=${stringifiedPayload.length}`,
      data: stringifiedPayload
    });
    for (const [key, value] of Object.entries(fields)) {
      if (value === void 0) {
        continue;
      }
      const stringifiedValue = await this._serializeBody(value, `Serializing ${key} for multipart ingestion of run with id: ${payload.id}`);
      parts.push({
        name: `${method}.${payload.id}.${key}`,
        contentType: `application/json; length=${stringifiedValue.length}`,
        data: stringifiedValue
      });
    }
    for (const [name, attachment] of Object.entries(attachments ?? {})) {
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
      parts.push({
        name: `attachment.${payload.id}.${name}`,
        contentType: `${contentType}; length=${content.byteLength}`,
        data: content instanceof Uint8Array ? content : new Uint8Array(content)
      });
    }
    return parts;
  }
  async _serializeFeedbackPart(feedback) {
    const stringifiedFeedback = await this._serializeBody(feedback, `Serializing for multipart ingestion of feedback with id: ${feedback.id}`);
    return {
      name: `feedback.${feedback.id}`,
      contentType: `application/json; length=${stringifiedFeedback.length}`,
      data: stringifiedFeedback
    };
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
    const encoder4 = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const writeChunk = async (chunk) => {
          if (typeof chunk === "string") {
            controller.enqueue(encoder4.encode(chunk));
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
        this._applyReplicaWorkspace(headers, options);
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
    this._applyReplicaWorkspace(headers, options);
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
    const path3 = `/examples/${exampleId}`;
    const rawExample = await this._get(path3);
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
      for (const field2 of ["attachment_urls", "outputs", "metadata"]) {
        selectFields.add(field2);
      }
    }
    for (const field2 of selectFields) {
      params.append("select", field2);
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
    this._applyReplicaWorkspace(headers, options);
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
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${promptName}`, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "delete prompt", true);
      return res;
    });
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
    await new Promise((resolve17) => setTimeout(resolve17, 1));
    while (this._pendingDrains.size > 0) {
      await Promise.all([...this._pendingDrains]);
    }
    for (let pass = 0; pass < 2; pass++) {
      clearTimeout(this._compressedFlushTimeout);
      this._compressedFlushTimeout = void 0;
      await this._flushCompressedBuffers();
      while (this._pendingDrains.size > 0) {
        await Promise.all([...this._pendingDrains]);
      }
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
function getExampleReferenceOutputs(example) {
  if (example.reference_outputs !== void 0 && example.outputs !== void 0) {
    throw new Error("Cannot specify both reference_outputs and outputs");
  }
  return example.reference_outputs ?? example.outputs;
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/env.mjs
var isEnvTracingEnabled = (tracingEnabled) => {
  if (tracingEnabled !== void 0) {
    return tracingEnabled;
  }
  const envVars = ["TRACING_V2", "TRACING"];
  return !!envVars.find((envVar) => getLangSmithEnvironmentVariable(envVar) === "true");
};

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/singletons/constants.mjs
var _LC_CONTEXT_VARIABLES_KEY = /* @__PURE__ */ Symbol.for("lc:context_variables");
var _REPLICA_TRACE_ROOTS_KEY = /* @__PURE__ */ Symbol.for("langsmith:replica_trace_roots");

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/utils/context_vars.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/run_trees.mjs
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
  "reroot",
  "address"
]);
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
var Baggage = class _Baggage {
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
    Object.defineProperty(this, "_postedAttachmentNames", {
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
      address: run.address,
      child_runs,
      parent_run_id,
      trace_id: run.trace_id,
      dotted_order: run.dotted_order,
      tags: run.tags,
      // Copied so files added later are left to patchRun, not this create.
      attachments: run.attachments ? { ...run.attachments } : void 0,
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
      const postedAttachmentNames = new Set(Object.keys(this.attachments ?? {}));
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
      this._postedAttachmentNames = postedAttachmentNames;
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
  /** Attachments added since postRun, or undefined when there are none. */
  _attachmentsToPatch() {
    const posted2 = this._postedAttachmentNames;
    const pending = Object.entries(this.attachments ?? {}).filter(([name]) => !posted2?.has(name));
    return pending.length > 0 ? Object.fromEntries(pending) : void 0;
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
    const attachments = this._attachmentsToPatch();
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
          attachments,
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
          attachments,
          session_name: this.project_name,
          address: this.address
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
        if (item.workspace_id !== void 0 && item.workspace_id !== null && typeof item.workspace_id !== "string") {
          console.warn(`Invalid workspace_id type in LANGSMITH_RUNS_ENDPOINTS: expected string, got ${typeof item.workspace_id}; ignoring it`);
          item.workspace_id = void 0;
        }
        if (item.primary !== void 0 && typeof item.primary !== "boolean") {
          console.warn(`Invalid primary type in LANGSMITH_RUNS_ENDPOINTS: expected boolean, got ${typeof item.primary}`);
          continue;
        }
        replicas.push({
          apiUrl: item.api_url.replace(/\/$/, ""),
          apiKey: item.api_key,
          projectName: item.project_name ?? void 0,
          workspaceId: item.workspace_id?.trim() || void 0,
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/uuid.mjs
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

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/singletons/traceable.mjs
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/privacy/constants.js
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/privacy/run-tree.js
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
  if (Array.isArray(source.tags) && source.tags.length === 0)
    safe.tags = [];
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
  if (!Array.isArray(run.tags) || run.tags.length > 0)
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
  const routed = config.replicas === void 0 ? { ...config, replicas: [] } : config;
  const run = new RunTree(mode === "metadata" ? configForMetadataMode(routed, integration, privacyContext) : routed);
  return mode === "metadata" ? protectRunTree(run, integration) : preserveFullModePatchInputs(run);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/constants.js
var UPLOAD_ACCOUNT_FINGERPRINT_PREFIX = "account_";
var UPLOAD_DESTINATION_ID_PREFIX = "destination_";
var UPLOAD_FINGERPRINT_LENGTH = 32;
var UPLOAD_ALREADY_RECEIVED_STATUS = 409;
var UPLOAD_CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;
var UPLOAD_API_URL_TRAILING_SLASH_PATTERN = /\/$/;
var UPLOAD_AGENT_ADDRESS = "lrn:agents/{agentId}/environments/production";
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
var UPLOAD_FAILED_MESSAGE = "LangSmith upload failed";
var UPLOAD_RETRYABLE_STATUSES = [408, 409, 429];
var UPLOAD_SDK_MAX_RETRIES = 0;
var UPLOAD_BUN_RUNTIME = "bun";
var UPLOAD_NODE_RUNTIME = "node";
var UPLOAD_DOTTED_ORDER_SEGMENT = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{6})Z/;
var UPLOAD_REQUEST_TIMEOUT_MS = 15e3;
var UPLOAD_SEND_DEADLINE_MS = 2e4;
var UPLOAD_BATCH_LIMITS = { maxRuns: 100, maxBytes: 8 * 1024 * 1024 };
var UPLOAD_ALREADY_RECEIVED_MESSAGE = "already received";
var UPLOAD_DEADLINE_MESSAGE = "LangSmith upload did not finish in time";
var UPLOAD_RECEIPT_MISSING_MESSAGE = "The upload returned no receipt";
var UPLOAD_ERROR_NAME = "UploadError";
var UPLOAD_SERVER_ERROR_MIN_STATUS = 500;
var UPLOAD_UNKNOWN_DESTINATION_MESSAGE = "Unknown upload destination";
var UPLOAD_SAMPLING_RATE_VARIABLES = [
  "LANGSMITH_TRACING_SAMPLING_RATE",
  "LANGCHAIN_TRACING_SAMPLING_RATE"
];
var UPLOAD_SAMPLING_HASH = "sha256";
var UPLOAD_SAMPLING_BUCKET_BYTES = 6;
var UPLOAD_DOTTED_ORDER_ROOT_ID = /^\d{8}T\d+Z([0-9a-f-]{36})/i;
var UPLOAD_SDK_API_KEY_FIELD = "apiKey";
var UPLOAD_SDK_API_URL_FIELD = "apiUrl";
var UPLOAD_AUTHORIZATION_HEADER = "Authorization";
var UPLOAD_MANAGED_HEADERS = { "X-LangSmith-Team-Tags": "true" };
var UPLOAD_BEARER_PATTERN = /^Bearer /u;
var UPLOAD_LOGIN_UNUSABLE_MESSAGE = "The LangSmith SDK would not send this destination's uploads with the CLI login on its own server, so nothing is uploaded to it";
var UPLOAD_KEY_UNUSABLE_MESSAGE = "The LangSmith SDK read this destination's API key as empty, so nothing is uploaded to it";
var UPLOAD_CREDENTIAL_REQUIRED_MESSAGE = "An API key or a LangSmith CLI login is required for each upload destination";
var UPLOAD_LOGIN_INVALID_MESSAGE = "Invalid upload login";
var UPLOAD_LOGIN_FIELD_NAMES = {
  configPath: "login config path",
  profile: "login profile",
  workspaceId: "login workspace ID"
};

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/client.js
var rejectedAuthorizations = /* @__PURE__ */ new WeakMap();
function createUploadClient(options) {
  const { apiKey, apiUrl, workspaceId, login, anonymizer, redactedFields } = options;
  const auth = login === void 0 ? { apiKey: apiKey ?? "", workspaceId: workspaceId ?? "" } : {
    profile: login.profile,
    profileConfigPath: login.configPath,
    preferProfileAuth: true,
    ...login.workspaceId === void 0 ? {} : { workspaceId: login.workspaceId }
  };
  const config = {
    ...auth,
    apiUrl,
    autoBatchTracing: false,
    manualFlushMode: true,
    timeout_ms: UPLOAD_REQUEST_TIMEOUT_MS,
    callerOptions: { maxRetries: UPLOAD_SDK_MAX_RETRIES },
    disablePromptCache: true,
    debug: false,
    omitTracedRuntimeInfo: true,
    tracingMode: "langsmith",
    headers: UPLOAD_MANAGED_HEADERS,
    ...anonymizer === void 0 ? {} : { anonymizer, hideMetadata: anonymizer },
    ...redactedFields?.includes("inputs") ? { hideInputs: false } : {},
    ...redactedFields?.includes("outputs") ? { hideOutputs: false } : {},
    fetchImplementation: async (input, init) => {
      const response = await fetch(input, init);
      if (response.status === LOGIN_EXPIRED_STATUS || response.status === LOGIN_NO_ACCESS_STATUS)
        rejectedAuthorizations.set(client, new Headers(init?.headers).get(UPLOAD_AUTHORIZATION_HEADER) ?? "");
      return response;
    }
  };
  const client = new Client(config);
  return client;
}
function takeRejectedAccessToken(client) {
  const authorization = rejectedAuthorizations.get(client);
  rejectedAuthorizations.delete(client);
  return authorization?.replace(UPLOAD_BEARER_PATTERN, "") || void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/destination-identity.js
import { createHash as createHash4 } from "node:crypto";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/auth/credential.js
function resolveUploadCredential(options = {}) {
  const env = options.env ?? process.env;
  const workspaceId = sdkSetting(options.workspaceId);
  const workspace = workspaceId ? { workspaceId } : {};
  const configuredUrl = sdkSetting(options.apiUrl);
  const apiUrl = options.apiUrlIsDefault ? void 0 : configuredUrl;
  const apiKey = sdkSetting(options.apiKey);
  const { agentId } = options;
  if (agentId !== void 0 && !AGENT_ID_PATTERN.test(agentId))
    return {
      kind: "none",
      reason: fillTemplate(AGENT_ID_INVALID_REASON, { agentId: JSON.stringify(agentId) })
    };
  if (apiKey !== void 0)
    return keyCredential(apiKey, configuredUrl);
  const login = loginCredential(env, apiUrl, workspace, options.profile);
  if (login.kind === "login" || options.profile)
    return login;
  const envKey = LOGIN_API_KEY_VARIABLES.map((name) => sdkSetting(env[name])).find(Boolean);
  return envKey === void 0 ? login : keyCredential(envKey, configuredUrl);
}
function keyCredential(apiKey, apiUrl) {
  return { kind: "api-key", apiKey, apiUrl: apiUrl ?? LOGIN_DEFAULT_API_URL };
}
function loginCredential(env, apiUrl, workspace, configuredProfile) {
  const requestedWorkspace = workspace.workspaceId ?? sdkSetting(env[LOGIN_WORKSPACE_VARIABLE]);
  if (requestedWorkspace !== void 0 && !LOGIN_WORKSPACE_ID_PATTERN.test(requestedWorkspace))
    return {
      kind: "none",
      reason: fillTemplate(LOGIN_WORKSPACE_INVALID_REASON, {
        workspaceId: JSON.stringify(requestedWorkspace)
      })
    };
  const profile = readLoginProfile(env, configuredProfile);
  if (profile === void 0)
    return {
      kind: "none",
      reason: fillTemplate(LOGIN_NONE_REASON, {
        command: loginCommand(configuredProfile || env[LOGIN_PROFILE_VARIABLE])
      })
    };
  if (apiUrl !== void 0 && !sameServer(apiUrl, profile.apiUrl))
    return {
      kind: "none",
      reason: fillTemplate(LOGIN_ENDPOINT_MISMATCH_REASON, { loginUrl: profile.apiUrl, apiUrl })
    };
  const { configPath, profile: name } = profile;
  const loginWorkspace = requestedWorkspace ?? profile.workspaceId;
  return {
    kind: "login",
    login: {
      configPath,
      profile: name,
      ...loginWorkspace === void 0 ? {} : { workspaceId: loginWorkspace }
    },
    apiUrl: apiUrl ?? profile.apiUrl,
    ...workspace
  };
}
function refusedLoginReplicas(replicas, apiUrl) {
  const refused = (replicas ?? []).filter((replica) => sdkSetting(replica.apiKey) === void 0 && replica.apiUrl !== void 0).map(({ apiUrl: url }) => url).filter((url) => !sameServer(url, apiUrl));
  return refused.length === 0 ? void 0 : fillTemplate(LOGIN_REPLICA_REFUSED_REASON, { urls: refused.join(", "), apiUrl });
}
function loginReplicaRefusal(replicas, apiUrl) {
  const configured = replicas ?? [];
  const usable = configured.some((replica) => sdkSetting(replica.apiKey) !== void 0 || replica.apiUrl === void 0 || sameServer(replica.apiUrl, apiUrl));
  return usable ? void 0 : refusedLoginReplicas(configured, apiUrl);
}
function uploadingReplicaCount(replicas, credential) {
  if (credential.kind === "api-key")
    return replicas?.length ?? 0;
  return (replicas ?? []).filter((replica) => sdkSetting(replica.apiKey) !== void 0 || credential.kind === "login" && refusedLoginReplicas([replica], credential.apiUrl) === void 0).length;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/destination-identity.js
function resolveUploadDestinationIdentities(options) {
  if (!Array.isArray(options.destinations) || options.destinations.length === 0) {
    throw new TypeError("At least one upload destination is required");
  }
  if (options.replicas !== void 0 && !Array.isArray(options.replicas)) {
    throw new TypeError("Upload replicas must be an array");
  }
  if (typeof options.redact !== "boolean")
    throw new TypeError("A redaction setting is required");
  const replicas = options.replicas ?? [];
  if (replicas.length > 0 && options.destinations.length !== 1) {
    throw new TypeError("A replica upload requires exactly one primary destination");
  }
  const primary = options.destinations[0];
  const routedReplicas = primary && typeof primary === "object" && !hasApiKey(primary.apiKey) ? replicas.filter((replica) => !replica || typeof replica !== "object" || hasApiKey(replica.apiKey) || primary.login !== void 0 && (replica.apiUrl === void 0 || sameServer(replica.apiUrl, primary.apiUrl))) : replicas;
  if (replicas.length > 0 && routedReplicas.length === 0 && primary?.login !== void 0)
    throw new TypeError(refusedLoginReplicas(replicas, primary.apiUrl));
  const primaryProjectName = routedReplicas.length === 0 || primary === void 0 ? void 0 : normalizeRequiredText(primary.projectName, "project name");
  const destinations = routedReplicas.length === 0 ? options.destinations.map((destination) => resolveDestination(destination)) : routedReplicas.map((replica) => resolveReplicaDestination(replica, primary, primaryProjectName));
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
function resolveDestination(config, sourceProjectName, updates, replicaProjectName) {
  if (!config || typeof config !== "object")
    throw new TypeError("Invalid upload destination");
  const login = hasApiKey(config.apiKey) ? void 0 : normalizeLogin(config.login);
  if (login === void 0 && !hasApiKey(config.apiKey)) {
    throw new TypeError(UPLOAD_CREDENTIAL_REQUIRED_MESSAGE);
  }
  const apiUrl = normalizeApiUrl(config.apiUrl);
  const projectName = normalizeRequiredText(config.projectName, "project name");
  const agentId = config.agentId === void 0 ? void 0 : normalizeRequiredText(config.agentId, "agent ID");
  const workspaceId = config.workspaceId === void 0 ? void 0 : sdkSetting(normalizeRequiredText(config.workspaceId, "workspace ID"));
  const identity = JSON.stringify({
    ...login === void 0 ? { apiKey: config.apiKey } : { login },
    apiUrl,
    workspaceId: workspaceId ?? null,
    ...sourceProjectName === void 0 ? {} : { projectName: replicaProjectName ?? null, updates: updates ?? null }
  });
  const id = `${UPLOAD_DESTINATION_ID_PREFIX}${fingerprint(identity)}`;
  return {
    id,
    ...login === void 0 ? { apiKey: config.apiKey } : { login },
    apiUrl,
    projectName,
    ...agentId === void 0 ? {} : { agentId },
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
  const ownKey = hasApiKey(replica.apiKey);
  const apiKey = ownKey ? replica.apiKey : primary.apiKey;
  return resolveDestination({
    ...apiKey === void 0 ? {} : { apiKey },
    ...!ownKey && primary.login ? { login: primary.login } : {},
    apiUrl: replica.apiUrl ?? primary.apiUrl,
    projectName: replica.projectName ?? primary.projectName,
    ...replica.projectName === void 0 && primary.agentId !== void 0 && !ownKey && (replica.apiUrl === void 0 || replica.apiUrl === primary.apiUrl) && (replica.workspaceId === void 0 || replica.workspaceId === primary.workspaceId) ? { agentId: primary.agentId } : {},
    ...workspaceId === void 0 ? {} : { workspaceId }
  }, primaryProjectName, updates, replica.projectName === void 0 ? null : normalizeRequiredText(replica.projectName, "project name"));
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
function normalizeLogin(login) {
  if (login === void 0)
    return void 0;
  if (!login || typeof login !== "object")
    throw new TypeError(UPLOAD_LOGIN_INVALID_MESSAGE);
  const workspaceId = login.workspaceId === void 0 ? void 0 : sdkSetting(normalizeRequiredText(login.workspaceId, UPLOAD_LOGIN_FIELD_NAMES.workspaceId));
  return {
    configPath: normalizeRequiredText(login.configPath, UPLOAD_LOGIN_FIELD_NAMES.configPath),
    profile: normalizeRequiredText(login.profile, UPLOAD_LOGIN_FIELD_NAMES.profile),
    ...workspaceId === void 0 ? {} : { workspaceId }
  };
}
function hasApiKey(value) {
  return sdkSetting(value) !== void 0;
}
function fingerprint(value) {
  return createHash4("sha256").update(value).digest("hex").slice(0, UPLOAD_FINGERPRINT_LENGTH);
}

// node_modules/.pnpm/langsmith@0.11.6/node_modules/langsmith/lib/anonymizer/index.mjs
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
    pattern: /\b([A-Za-z0-9_.-]*(?:API[_-]?KEY[_-]?SALT|LICENSE[_-]?KEY|API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE[_-]?KEY|ACCESS[_-]?KEY|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET)(?![A-Za-z0-9])(?:[_.-][A-Za-z0-9]+)*["']?\s*[:=]\s*["']?)(?:(?:bearer|token|basic)\s+)?[^\s"'&;]{6,}/gi,
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/redaction.js
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/destinations.js
function resolveUploadDestinations(options) {
  const resolved = resolveUploadDestinationIdentities(options);
  const destinations = resolved.destinations.map((destination) => {
    const anonymizer = createUploadAnonymizer(options.redact, options.redactExtraRules);
    const client = createUploadClient({
      ...destination,
      ...anonymizer === void 0 ? {} : { anonymizer }
    });
    if (destination.login === void 0 && Reflect.get(client, UPLOAD_SDK_API_KEY_FIELD) === void 0)
      throw new TypeError(UPLOAD_KEY_UNUSABLE_MESSAGE);
    if (destination.login !== void 0 && !usesLogin(destination.login, client))
      throw new TypeError(UPLOAD_LOGIN_UNUSABLE_MESSAGE);
    return {
      ...destination,
      ...anonymizer === void 0 ? {} : { anonymizer },
      client
    };
  });
  return { accountFingerprint: resolved.accountFingerprint, destinations };
}
function usesLogin(login, client) {
  if (Reflect.get(client, UPLOAD_SDK_API_KEY_FIELD) !== void 0)
    return false;
  const loginUrl = readProfileAt(login.configPath, login.profile)?.apiUrl;
  const clientUrl = Reflect.get(client, UPLOAD_SDK_API_URL_FIELD);
  return loginUrl === void 0 || typeof clientUrl === "string" && sameServer(clientUrl, loginUrl);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/client-cache.js
function createUploadClientCache() {
  const clientsByMode = /* @__PURE__ */ new Map();
  return {
    forSubmission(destination, submission) {
      const redactedFields = normalizedRedactedFields(submission.redactedFields).filter((field2) => submission.privacyMode === "full" && !(submission.operation === "patch" && field2 === "outputs" && Object.hasOwn(destination.updates ?? {}, "outputs")));
      let client = destination.client;
      if (redactedFields.length > 0) {
        const key = JSON.stringify([destination.id, redactedFields]);
        const previous = clientsByMode.get(key);
        client = previous ?? createUploadClient({ ...destination, redactedFields });
        if (previous === void 0)
          clientsByMode.set(key, client);
      }
      return client;
    }
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/errors.js
var UploadError = class extends Error {
  retryable;
  status;
  loginRejected;
  constructor(cause, login = false) {
    super(UPLOAD_FAILED_MESSAGE, { cause });
    this.name = UPLOAD_ERROR_NAME;
    const status = failureStatus(cause);
    this.status = status;
    this.loginRejected = login && status === LOGIN_EXPIRED_STATUS;
    this.retryable = status === void 0 || status >= UPLOAD_SERVER_ERROR_MIN_STATUS || UPLOAD_RETRYABLE_STATUSES.includes(status);
  }
};
function isAlreadyReceived(cause) {
  return failureStatus(cause) === UPLOAD_ALREADY_RECEIVED_STATUS && describe(cause).includes(UPLOAD_ALREADY_RECEIVED_MESSAGE);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/runtime-metadata.js
function applyRuntimeMetadata(payload, privacyMode) {
  if (privacyMode !== "full")
    return;
  const added = buildCodingAgentRuntimeMetadata({
    env: process.env,
    runtime: "Bun" in globalThis ? UPLOAD_BUN_RUNTIME : UPLOAD_NODE_RUNTIME,
    sdkVersion: VERSION
  });
  const extra = payload.extra ?? {};
  const metadata = { ...added.metadata, ...extra["metadata"] };
  payload.extra = {
    ...extra,
    runtime: { ...added.runtime, ...extra["runtime"] },
    metadata
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/replica-identifiers.js
import { createHash as createHash5 } from "node:crypto";
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
  const hash = createHash5("sha1").update(UPLOAD_REPLICA_UUID_V5_NAMESPACE_BYTES).update(name).digest();
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/replica-updates.js
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/deadline.js
async function withDeadline(work) {
  let timer;
  const expired = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(UPLOAD_DEADLINE_MESSAGE)), UPLOAD_SEND_DEADLINE_MS);
  });
  try {
    return await Promise.race([work, expired]);
  } finally {
    clearTimeout(timer);
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/sampling.js
import { createHash as createHash6 } from "node:crypto";
function samplingRate(environment) {
  for (const name of UPLOAD_SAMPLING_RATE_VARIABLES) {
    const value = environment[name]?.trim();
    if (value === void 0 || value === "")
      continue;
    const rate = Number(value);
    return Number.isFinite(rate) ? rate : void 0;
  }
  return void 0;
}
function isSampled(item, rate) {
  if (rate === void 0 || rate >= 1)
    return true;
  const traceId = traceIdOf(item.submission.run);
  const digest = createHash6(UPLOAD_SAMPLING_HASH).update(traceId.toLowerCase()).digest();
  return digest.readUIntBE(0, UPLOAD_SAMPLING_BUCKET_BYTES) / 2 ** (8 * UPLOAD_SAMPLING_BUCKET_BYTES) < rate;
}
function traceIdOf(run) {
  return run.trace_id ?? UPLOAD_DOTTED_ORDER_ROOT_ID.exec(run.dotted_order ?? "")?.[1] ?? run.id;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/timestamps.js
function startTimeFromDottedOrder(dottedOrder) {
  if (typeof dottedOrder !== "string")
    return void 0;
  const own = dottedOrder.slice(dottedOrder.lastIndexOf(".") + 1);
  const match = UPLOAD_DOTTED_ORDER_SEGMENT.exec(own);
  if (match === null)
    return void 0;
  const [, year, month, day, hour, minute, second, micros] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${micros}Z`;
}
function startTimeText(supplied, dottedOrder) {
  if (typeof supplied === "string")
    return supplied;
  if (typeof supplied === "number")
    return new Date(supplied).toISOString();
  return startTimeFromDottedOrder(dottedOrder);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/upload/upload.js
function createLangSmithUploadWriter(options) {
  const resolved = resolveUploadDestinations(options);
  const destinations = resolved.destinations.map(({ id }) => Object.freeze({ id }));
  const byId = new Map(resolved.destinations.map((destination) => [destination.id, destination]));
  const clients = createUploadClientCache();
  const rate = samplingRate(process.env);
  const routes = Object.freeze(Object.fromEntries(resolved.destinations.map(({ id, projectName, agentId, sourceProjectName }) => [
    id,
    Object.freeze({
      projectName,
      ...agentId === void 0 ? {} : { agentId },
      ...sourceProjectName === void 0 ? {} : { sourceProjectName }
    })
  ])));
  async function sendBatch(items, destinationId) {
    const configured = byId.get(destinationId);
    if (!configured)
      throw new TypeError(UPLOAD_UNKNOWN_DESTINATION_MESSAGE);
    const prepared = items.map(({ submission, route }) => prepareItem(clients, route === void 0 || options.projectLocked ? configured : routedDestination(configured, route), submission));
    const clientOptions = {
      apiUrl: configured.apiUrl,
      ...configured.workspaceId === void 0 ? {} : { workspaceId: configured.workspaceId }
    };
    let uploaded = false;
    for (const [client, group] of segmentByClient(prepared)) {
      const sampled = group.filter((item) => isSampled(item, rate));
      try {
        await withDeadline(client.batchIngestRuns(ingestFor(sampled), clientOptions)).catch(ignoreAlreadyReceived);
        uploaded ||= sampled.length > 0;
      } catch (error2) {
        const failure = new UploadError(error2, configured.login !== void 0);
        const sent = takeRejectedAccessToken(client);
        const denied = failure.status === LOGIN_NO_ACCESS_STATUS;
        if ((failure.loginRejected || denied) && configured.login !== void 0)
          void recordExpiredLogin(configured.login, sent && credentialHash(sent), options.storageRoot, denied);
        if (configured.apiKey !== void 0 && (failure.status === LOGIN_EXPIRED_STATUS || denied))
          void recordRejectedKey({ apiKey: configured.apiKey, apiUrl: configured.apiUrl }, options.storageRoot, denied);
        throw failure;
      }
    }
    if (uploaded && configured.login !== void 0) {
      void clearLoginExpiry(configured.login, options.storageRoot);
      void clearRejectedKey(options.storageRoot);
    } else if (uploaded && configured.apiKey !== void 0)
      void clearRejectedKey(options.storageRoot, {
        apiKey: configured.apiKey,
        apiUrl: configured.apiUrl
      });
    return prepared.map(({ submission, operation }) => ({
      destinationId,
      runId: submission.run.id,
      operation
    }));
  }
  return Object.freeze({
    accountFingerprint: resolved.accountFingerprint,
    destinations: Object.freeze(destinations),
    routes,
    batchLimits: UPLOAD_BATCH_LIMITS,
    sendBatch,
    async send(submission, destinationId, route) {
      const [receipt] = await sendBatch([route === void 0 ? { submission } : { submission, route }], destinationId);
      if (receipt === void 0)
        throw new Error(UPLOAD_RECEIPT_MISSING_MESSAGE);
      return receipt;
    }
  });
}
function routedDestination(destination, route) {
  const routed = { ...destination, projectName: route.projectName };
  if (route.agentId === void 0)
    delete routed.agentId;
  else
    routed.agentId = route.agentId;
  if (route.sourceProjectName === void 0)
    delete routed.sourceProjectName;
  else
    routed.sourceProjectName = route.sourceProjectName;
  return routed;
}
function prepareItem(clients, destination, submission) {
  validateSubmission(submission);
  const client = clients.forSubmission(destination, submission);
  const payload = submission.operation === "post" ? preparePostRunPayload(submission, destination) : preparePatchRunPayload(submission, destination);
  if (submission.operation === "patch") {
    applyReplicaPatchUpdates(payload, destination, submission.privacyMode);
  }
  applyRuntimeMetadata(payload, submission.privacyMode);
  redactSdkOmittedFields(payload, destination.anonymizer);
  return {
    client,
    submission,
    payload,
    destination,
    operation: submission.operation === "post" ? "posted" : "patched"
  };
}
function segmentByClient(items) {
  const segments = [];
  for (const item of items) {
    const last = segments.at(-1);
    if (last !== void 0 && last[0] === item.client)
      last[1].push(item);
    else
      segments.push([item.client, [item]]);
  }
  return segments;
}
function ingestFor(items) {
  const runCreates = [];
  const runUpdates = [];
  for (const { payload, submission, destination, operation } of items) {
    if (operation === "posted") {
      runCreates.push(withTarget(payload, destination));
    } else {
      const id = runIdForDestination(submission.run.id, destination);
      runUpdates.push(withTarget({ ...payload, id }, destination));
    }
  }
  return { runCreates, runUpdates };
}
function withTarget(payload, destination) {
  if (destination.agentId === void 0)
    return { ...payload, session_name: destination.projectName };
  const { session_name: _project, ...rest } = payload;
  const address = fillTemplate(UPLOAD_AGENT_ADDRESS, { agentId: destination.agentId });
  return { ...rest, address };
}
function ignoreAlreadyReceived(error2) {
  if (!isAlreadyReceived(error2))
    throw error2;
}
function runConfig(context, submission, destination) {
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
function preparePostRunPayload(submission, destination) {
  const source = submission.run;
  const config = runConfig(source, submission, destination);
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
  const create = JSON.parse(JSON.stringify(run.toJSON()));
  const startTime = startTimeText(source.start_time, create.dotted_order);
  if (startTime !== void 0)
    create.start_time = startTime;
  return create;
}
function preparePatchRunPayload(submission, destination) {
  const config = runConfig(submission.run, submission, destination);
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
    session_name: destination.projectName,
    trace_id: snapshot["trace_id"],
    dotted_order: snapshot["dotted_order"],
    ...snapshot["parent_run_id"] === void 0 ? {} : { parent_run_id: snapshot["parent_run_id"] }
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/lifecycle/constants.js
var LIFECYCLE_CHILD_TURN_GRACE_MS = 60 * 60 * 1e3;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/settlement/constants.js
var REPOSITORY_NAME_KEY = GIT_METADATA_KEYS.repository;
var SETTLEMENT_QUIET_TURN_MS = 2 * 60 * 60 * 1e3;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/settlement/revision.js
import { createHash as createHash7 } from "node:crypto";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/reconstruction/worker.js
import { join as join17, resolve as resolve11 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/engine/options.js
import { resolve as resolve12 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/engine/constants.js
var TRACING_ENGINE_FOREIGN_SESSION_MIN_AGE_MS = 2 * 60 * 60 * 1e3;
var TRACING_ENGINE_MAX_RETRY_WAIT_MS = 2 * 60 * 1e3;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/engine/recovery.js
import { join as join18 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracing/engine/retry-wait.js
import { setTimeout as delay4 } from "node:timers/promises";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/worker-launch.js
import { spawn } from "node:child_process";
import { closeSync as closeSync2, mkdirSync as mkdirSync5, openSync as openSync2, statSync as statSync3, writeSync as writeSync2 } from "node:fs";
import { dirname as dirname10, join as join19 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/binary-runtime.js
function builtAsBinary() {
  return typeof LS_COMPILED_BINARY !== "undefined";
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/tls/system-certificates.js
import { readFileSync as readFileSync7, writeFileSync as writeFileSync3 } from "node:fs";
import * as tls from "node:tls";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/tls/tls-constants.js
var EXTRA_CERTIFICATES_VARIABLE = "NODE_EXTRA_CA_CERTS";
var SYSTEM_CERTIFICATE_STORE = "system";
var CERTIFICATE_FILE_ENCODING = "utf8";
var SYSTEM_CERTIFICATES_WARNING = "Uploads will not trust this computer's certificates:";
var CERTIFICATE_PATTERN = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/tls/system-certificates.js
function trustSystemCertificates(file, environment, readSystem = readSystemStore) {
  const existing = environment[EXTRA_CERTIFICATES_VARIABLE] || void 0;
  if (existing === file)
    return { environment };
  try {
    const system = readSystem();
    if (system.length === 0)
      return { environment };
    const extra = existing === void 0 ? [] : [readFileSync7(existing, CERTIFICATE_FILE_ENCODING)];
    writeIfChanged(file, bundle([...extra, ...system]));
    return { environment: { ...environment, [EXTRA_CERTIFICATES_VARIABLE]: file } };
  } catch (error2) {
    return { environment, warning: `${SYSTEM_CERTIFICATES_WARNING} ${describe(error2)}` };
  }
}
function readSystemStore() {
  return typeof tls.getCACertificates === "function" ? tls.getCACertificates(SYSTEM_CERTIFICATE_STORE) : [];
}
function bundle(sources) {
  const certificates = new Set(sources.flatMap((source) => source.match(CERTIFICATE_PATTERN) ?? []));
  return [...certificates].map((certificate) => `${certificate}
`).join("");
}
function writeIfChanged(file, contents) {
  if (readIfPresent(file) !== contents)
    writeFileSync3(file, contents);
}
function readIfPresent(file) {
  try {
    return readFileSync7(file, CERTIFICATE_FILE_ENCODING);
  } catch {
    return void 0;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/worker-launch.js
function launchDetachedWorker(args, options = {}) {
  const root = options.storageRoot;
  const log2 = root === void 0 ? void 0 : openLog(join19(root, WORKER_LOG_FILE_NAME));
  const certificates = root === void 0 ? void 0 : trustSystemCertificates(join19(root, SYSTEM_CERTIFICATES_FILE_NAME), process.env);
  if (log2 !== void 0 && certificates?.warning !== void 0)
    logWarning(log2, certificates.warning);
  const child = spawn(options.executable ?? process.execPath, [...scriptArguments(), ...args], {
    detached: true,
    env: certificates?.environment ?? process.env,
    stdio: log2 === void 0 ? "ignore" : ["ignore", log2, log2],
    windowsHide: true
  });
  if (log2 !== void 0)
    closeSync2(log2);
  return new Promise((resolve17, reject) => {
    child.once("error", reject);
    child.once("spawn", () => {
      if (child.pid === void 0) {
        reject(new Error(WORKER_NO_PID_MESSAGE));
        return;
      }
      child.unref();
      resolve17(child.pid);
    });
  });
}
function scriptArguments() {
  const entry = process.argv[1];
  const compiled = builtAsBinary() || entry === void 0 || COMPILED_BINARY_ENTRY_PREFIXES.some((prefix) => entry.startsWith(prefix));
  return compiled ? [] : [entry];
}
function openLog(path3) {
  try {
    mkdirSync5(dirname10(path3), { recursive: true });
    const size = statSync3(path3, { throwIfNoEntry: false })?.size ?? 0;
    const flag = size > WORKER_LOG_MAX_BYTES ? WORKER_LOG_TRUNCATE_FLAG : WORKER_LOG_APPEND_FLAG;
    return openSync2(path3, flag, WORKER_LOG_MODE);
  } catch {
    return void 0;
  }
}
function logWarning(log2, warning) {
  try {
    writeSync2(log2, `${warning}
`);
  } catch {
    return;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/plugin/notice-cooldown.js
import { join as join20 } from "node:path";
var shownInProcess = /* @__PURE__ */ new Set();
async function shouldShowNotice(options) {
  if (options.cooldown === NOTICE_OFF)
    return false;
  const windowMs = (options.cooldown ?? NOTICE_DEFAULT_COOLDOWN_MINUTES) * NOTICE_MINUTE_MS;
  const key = `${options.plugin}${NOTICE_KEY_SEPARATOR}${options.kind}`;
  try {
    return await claimStateEntry(join20(options.storageRoot, NOTICE_STATE_FILE), key, windowMs);
  } catch {
    if (options.persistentOnly || shownInProcess.has(key))
      return false;
    shownInProcess.add(key);
    return true;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/binary.js
import { arch as osArch, platform as osPlatform } from "node:os";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/constants.js
var DEFAULT_PUBLISHED_TARGETS = {
  darwin: ["arm64", "x64"]
};

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/target.js
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/binary.js
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/constants.js
import { constants } from "node:fs";
var COMMON_BOOLEAN_SETTINGS = {
  enabled: { default: false, restrictive: false },
  defaultMuted: { default: false, restrictive: true }
};
var COMMON_NOTICE_COOLDOWN_OFF = "off";
var COMMON_STRICT_BOOLEAN_FIELDS = [
  "redact",
  "strict_auth",
  "capture_hook_outputs"
];
var COMMON_DEFAULT_API_URL = "https://api.smith.langchain.com";
var COMMON_NO_API_KEY = "";
var COMMON_CONFIG_FILE_NAME = "langsmith.json";
var COMMON_CONFIG_OPEN_FLAGS = constants.O_RDONLY | (constants.O_NONBLOCK ?? 0);
var COMMON_CONFIG_ROOT_FILE_NAME = "langsmith-plugins.json";
var COMMON_CONFIG_USER_ROOT_FILE_NAME = ".langsmith-plugins.json";
var MANAGED_CONFIG_DIRECTORY = ".langsmith-plugins";
var MANAGED_CONFIG_FILE_NAME = "managed.json";
var MANAGED_CONFIG_OPEN_FLAGS = COMMON_CONFIG_OPEN_FLAGS | (constants.O_NOFOLLOW ?? 0);
var MANAGED_CONFIG_OWNER_UID = 0;
var GROUP_OR_OTHERS_WRITE_BITS = 18;
var MANAGED_CONFIG_OVERRIDE_SOURCES = [
  "env",
  "harness",
  "root",
  "user",
  "userRoot"
];
var MANAGED_CONFIG_UNSAFE_OWNERSHIP = "LangSmith managed settings aren't owned by root, so tracing is off. Contact your admin.";
var MANAGED_CONFIG_INVALID = "LangSmith managed settings are invalid, so tracing is off. Contact your admin.";
var MANAGED_CONFIG_OVERRIDE_WARNING = "Ignored settings the managed config locks: {overrides}.";
var MANAGED_CONFIG_OVERRIDE_FIELD_SEPARATOR = "; ";
var MANAGED_CONFIG_OVERRIDE_SOURCE_SEPARATOR = ", ";
var ACCOUNT_LOOKUP_TIMEOUT_MS = 2e3;
var MACOS_ACCOUNT_LOOKUP = "/usr/bin/id";
var MACOS_ACCOUNT_LOOKUP_ARGUMENTS = ["-P"];
var MACOS_ACCOUNT_HOME_FIELD = 8;
var LINUX_ACCOUNT_LIST_FILE = "/etc/passwd";
var LINUX_ACCOUNT_LOOKUPS = ["/usr/bin/getent", "/bin/getent"];
var LINUX_ACCOUNT_HOME_FIELD = 5;
var ACCOUNT_ID_FIELD = 2;
var ACCOUNT_FIELD_SEPARATOR = ":";
var UTF8_BOM = /^\uFEFF/;
var SETUP_URL_PATTERN = /^https?:\/\//iu;
var SETUP_URL_QUERY_OR_FRAGMENT = /[?#]/u;
var SETUP_API_KEY_PATTERN = /(?:^|[^a-z0-9])(?:lsv2_|ls__)/iu;
var SETUP_API_KEY_GIVEN = "That looks like a LangSmith API key, so nothing was changed. Put the key in your config file instead, since anything typed in chat can end up in your history and traces.";
var SETUP_LINE_BREAK = /[\n\v\f\r\u0085\u2028\u2029]/u;
var SETUP_MULTIPLE_LINES = "Setup takes its project and URL on one line, so nothing was changed. Send anything else as its own message.";
var SETUP_ARGUMENT_SEPARATOR = /\s+/u;
var SETUP_FILE_MODE = 384;
var SETUP_DIRECTORY_MODE = 448;
var SETUP_TEMP_SUFFIX = ".tmp";
var SETUP_PROJECT_QUOTES = /^(["'])(.*)\1$/u;
var SETUP_INVALID_URL = "{url} isn't a valid URL, so nothing was changed.";
var SETUP_TOO_MANY_URLS = "Setup takes one URL, so nothing was changed.";
var SETUP_URL_WITH_CREDENTIALS = "Leave the username and password out of the URL and put the API key in your config file instead, so nothing was changed.";
var SETUP_URL_WITH_QUERY = "Leave the ? and # parts out of the URL, since uploads can't use them, so nothing was changed.";
var SETUP_INVALID_CONFIG = "{path} has a setting LangSmith can't use, so nothing was changed. Fix that setting and run setup again.";
var SETUP_UNREADABLE_CONFIG = "Couldn't read {path} as a JSON object, so nothing was changed. Fix or remove that file and run setup again.";
var SETUP_ENABLED = "Turned LangSmith tracing on in {path}.";
var SETUP_DESTINATION = "Traces go to the {project} project at {apiUrl}.";
var SETUP_REPLICA_DESTINATION = {
  one: "Traces go to the replica destination in your settings, which replaces the usual project and URL.",
  many: "Traces go to the {replicaCount} replica destinations in your settings, which replace the usual project and URL."
};
var SETUP_AGENT_DESTINATION = "Traces go to the {agentId} agent at {apiUrl}.";
var SETUP_DESTINATION_FIELDS = /\{(project|agentId|apiUrl)\}/gu;
var SETUP_FILE_FAILED = "Couldn't update {path} ({reason}), so nothing was changed. Check that file's permissions and run setup again.";
var SETUP_FILE_FAILED_FIELDS = /\{(path|reason)\}/gu;
var SETUP_STILL_OFF = "Tracing is still off because an environment variable, a project's langsmith.json or langsmith-plugins.json, or your admin's managed settings turn it off.";
var SETUP_OVERRIDDEN = "Another setting overrides part of this (an agent_id, an environment variable, a project's langsmith.json or langsmith-plugins.json, or your admin's managed settings), so the values above are what's in effect.";
var SETUP_MUTED = "This thread is muted, so traces keep their structure and usage but not your prompts, responses or tool data.";
var SETUP_SIGN_IN = {
  login: "Signed in with the LangSmith CLI.",
  "api-key": "Using your LangSmith API key."
};
var SETUP_NO_CREDENTIAL = "No LangSmith login or API key found yet, so run `langsmith auth login` to sign in.";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/managed-config.js
import { closeSync as closeSync3, fstatSync, lstatSync as lstatSync2, openSync as openSync3, readFileSync as readFileSync9 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname11, join as join21 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/utils/records.js
function object(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/parse.js
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
function absent() {
  return { status: "absent", common: {}, diagnostics: [] };
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
  for (const field2 of [
    "api_key",
    "api_url",
    "project",
    "agent_id",
    "profile",
    "workspace_id"
  ]) {
    if (!Object.hasOwn(value, field2))
      continue;
    if (typeof value[field2] !== "string")
      return invalid(value);
    common[field2] = value[field2];
  }
  for (const field2 of COMMON_STRICT_BOOLEAN_FIELDS) {
    if (!Object.hasOwn(value, field2))
      continue;
    if (typeof value[field2] !== "boolean")
      return invalid(value);
    common[field2] = value[field2];
  }
  if (Object.hasOwn(value, "notice_cooldown")) {
    const cooldown = value.notice_cooldown;
    const minutes = typeof cooldown === "number" && Number.isFinite(cooldown) && cooldown >= 0;
    if (!minutes && cooldown !== COMMON_NOTICE_COOLDOWN_OFF)
      return invalid(value);
    common.notice_cooldown = cooldown;
  }
  if (Object.hasOwn(value, "metadata")) {
    if (!object(value.metadata))
      return invalid(value);
    common.metadata = value.metadata;
  }
  if (Object.hasOwn(value, "replicas")) {
    if (!Array.isArray(value.replicas))
      return invalid(value);
    const replicas = [];
    for (const entry of value.replicas) {
      const replica = parseReplica(entry);
      if (replica === void 0)
        return invalid(value);
      replicas.push(replica);
    }
    common.replicas = replicas;
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

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/utils/account-home.js
import { execFileSync } from "node:child_process";
import { readFileSync as readFileSync8 } from "node:fs";
import { userInfo } from "node:os";
import { isAbsolute as isAbsolute3 } from "node:path";
var cachedBunHome;
function accountHomeDirectory() {
  if (process.versions.bun === void 0)
    return nodeAccountHome();
  cachedBunHome ??= { home: bunAccountHome() };
  return cachedBunHome.home;
}
function bunAccountHome() {
  const uid = process.getuid?.();
  if (uid === void 0)
    return void 0;
  if (process.platform === "darwin")
    return macosAccountHome(uid);
  return linuxAccountHome(uid);
}
function nodeAccountHome() {
  try {
    return userInfo().homedir;
  } catch {
    return void 0;
  }
}
function macosAccountHome(uid) {
  const entry = runAccountLookup(MACOS_ACCOUNT_LOOKUP, [
    ...MACOS_ACCOUNT_LOOKUP_ARGUMENTS,
    String(uid)
  ]);
  return homeField(entry, MACOS_ACCOUNT_HOME_FIELD);
}
function linuxAccountHome(uid) {
  const fromFile = accountListEntry(uid);
  if (fromFile !== void 0)
    return homeField(fromFile, LINUX_ACCOUNT_HOME_FIELD);
  for (const lookup of LINUX_ACCOUNT_LOOKUPS) {
    const entry = runAccountLookup(lookup, ["passwd", String(uid)]);
    if (entry !== void 0)
      return homeField(entry, LINUX_ACCOUNT_HOME_FIELD);
  }
  return void 0;
}
function accountListEntry(uid) {
  let contents;
  try {
    contents = readFileSync8(LINUX_ACCOUNT_LIST_FILE, "utf8");
  } catch {
    return void 0;
  }
  for (const line of contents.split("\n")) {
    if (line.split(ACCOUNT_FIELD_SEPARATOR)[ACCOUNT_ID_FIELD] === String(uid))
      return line;
  }
  return void 0;
}
function runAccountLookup(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      timeout: ACCOUNT_LOOKUP_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return void 0;
  }
}
function homeField(entry, field2) {
  const home = entry?.split(ACCOUNT_FIELD_SEPARATOR)[field2];
  return home !== void 0 && isAbsolute3(home) ? home : void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/utils/warnings.js
var warned = /* @__PURE__ */ new Set();
function warnOnce2(lines) {
  for (const line of lines) {
    if (warned.has(line))
      continue;
    warned.add(line);
    console.warn(line);
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/managed-config.js
function onlyOwnerCanChange(stats, ownerUid) {
  return !stats.isSymbolicLink() && stats.uid === ownerUid && (stats.mode & GROUP_OR_OTHERS_WRITE_BITS) === 0;
}
function managedConfigPath() {
  if (process.platform === "win32")
    return void 0;
  const accountHome = accountHomeDirectory() ?? homedir2();
  return join21(accountHome, MANAGED_CONFIG_DIRECTORY, MANAGED_CONFIG_FILE_NAME);
}
function rejectManagedConfig(diagnostic) {
  return { status: "invalid", common: {}, diagnostics: [diagnostic] };
}
function readManagedConfigFile(options = {}) {
  const path3 = options.path ?? managedConfigPath();
  if (path3 === void 0)
    return absent();
  const ownerUid = options.ownerUid ?? MANAGED_CONFIG_OWNER_UID;
  let fd;
  try {
    fd = openSync3(path3, MANAGED_CONFIG_OPEN_FLAGS);
  } catch (error2) {
    const code = error2.code;
    if (code === "ENOENT")
      return absent();
    return rejectManagedConfig(code === "ELOOP" ? MANAGED_CONFIG_UNSAFE_OWNERSHIP : MANAGED_CONFIG_INVALID);
  }
  let raw;
  try {
    const file = fstatSync(fd);
    if (!file.isFile())
      return rejectManagedConfig(MANAGED_CONFIG_INVALID);
    if ((options.checkOwnership ?? true) && !(onlyOwnerCanChange(file, ownerUid) && onlyOwnerCanChange(lstatSync2(dirname11(path3)), ownerUid))) {
      return rejectManagedConfig(MANAGED_CONFIG_UNSAFE_OWNERSHIP);
    }
    raw = JSON.parse(readFileSync9(fd, "utf8").replace(UTF8_BOM, ""));
  } catch {
    return rejectManagedConfig(MANAGED_CONFIG_INVALID);
  } finally {
    try {
      closeSync3(fd);
    } catch {
    }
  }
  if (!object(raw))
    return rejectManagedConfig(MANAGED_CONFIG_INVALID);
  const parsed = parseCommonConfig(raw);
  if (parsed.status === "invalid")
    return rejectManagedConfig(MANAGED_CONFIG_INVALID);
  return { status: "valid", common: parsed.common, raw, diagnostics: parsed.diagnostics };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/managed-lock.js
import { isDeepStrictEqual } from "node:util";
function lockedValues(common) {
  const lock = { ...common };
  if (lock.profile === "")
    delete lock.profile;
  if (lock.api_key !== void 0 || lock.replicas !== void 0)
    lock.api_url ??= COMMON_DEFAULT_API_URL;
  if (lock.api_url !== void 0 || lock.project !== void 0)
    lock.replicas ??= [];
  if (lock.profile !== void 0)
    lock.api_key ??= COMMON_NO_API_KEY;
  if (lock.redact_extra_rules !== void 0)
    lock.redact ??= true;
  return lock;
}
function lockedFields(lock) {
  const fields = [];
  for (const field2 of Object.keys(lock)) {
    if (lock[field2] !== void 0)
      fields.push(field2);
  }
  return fields;
}
function overridesLock(value, locked) {
  if (!object(value) || !object(locked))
    return !isDeepStrictEqual(value, locked);
  for (const key of Object.keys(value)) {
    if (Object.hasOwn(locked, key) && !isDeepStrictEqual(value[key], locked[key]))
      return true;
  }
  return false;
}
function overridingSources(sources, field2, lock) {
  const overriding = [];
  for (const source of MANAGED_CONFIG_OVERRIDE_SOURCES) {
    const value = sources[source]?.[field2];
    if (value !== void 0 && overridesLock(value, lock[field2]))
      overriding.push(source);
  }
  return overriding;
}
function overrideDiagnostics(sources, lock) {
  const overrides = [];
  for (const field2 of lockedFields(lock)) {
    const overriding = overridingSources(sources, field2, lock);
    if (overriding.length === 0)
      continue;
    overrides.push(`${field2} from ${overriding.join(MANAGED_CONFIG_OVERRIDE_SOURCE_SEPARATOR)}`);
  }
  if (overrides.length === 0)
    return [];
  const list = overrides.join(MANAGED_CONFIG_OVERRIDE_FIELD_SEPARATOR);
  return [MANAGED_CONFIG_OVERRIDE_WARNING.replace("{overrides}", list)];
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/common-config.js
function resolveField(sources, field2) {
  return sources.find((source) => source[field2] !== void 0)?.[field2];
}
function mergeCommonConfig(sources, options = {}) {
  const { harness = {}, root = {}, user = {}, userRoot = {}, env = {}, defaults: defaults2 = {}, managed = readManagedConfigFile() } = sources;
  const lock = lockedValues(managed.common);
  const files = [harness, root, user, userRoot];
  const precedence = [lock, env, ...files, defaults2];
  const switches = options.envFirst ? precedence : [lock, ...files, env, defaults2];
  const merged = {
    enabled: false,
    defaultMuted: false,
    redact: true,
    locked: lockedFields(lock),
    defaulted: Object.keys(defaults2).filter((field2) => resolveField([lock, env, ...files], field2) === void 0),
    diagnostics: [...managed.diagnostics, ...overrideDiagnostics(sources, lock)]
  };
  for (const field2 of ["enabled", "defaultMuted"]) {
    merged[field2] = resolveField(switches, field2) ?? COMMON_BOOLEAN_SETTINGS[field2].default;
  }
  if (managed.status === "invalid") {
    merged.enabled = false;
    if (managed.diagnostics[0] !== void 0)
      merged.managedConfigProblem = managed.diagnostics[0];
  }
  warnOnce2(merged.diagnostics);
  merged.api_key = resolveField(precedence, "api_key");
  merged.api_url = resolveField(precedence, "api_url");
  merged.project = resolveField(precedence, "project");
  merged.agent_id = resolveField(precedence, "agent_id");
  if (lock.project !== void 0 && lock.agent_id === void 0)
    delete merged.agent_id;
  merged.profile = resolveField(precedence, "profile");
  merged.workspace_id = resolveField(precedence, "workspace_id");
  merged.replicas = resolveField(precedence, "replicas");
  merged.redact = resolveField(precedence, "redact") ?? true;
  merged.redact_extra_rules = resolveField(precedence, "redact_extra_rules");
  merged.strict_auth = resolveField(precedence, "strict_auth");
  merged.capture_hook_outputs = resolveField(precedence, "capture_hook_outputs");
  merged.notice_cooldown = resolveField(precedence, "notice_cooldown");
  if (precedence.some((source) => source.metadata !== void 0)) {
    merged.metadata = [...precedence].reverse().reduce((metadata, source) => ({ ...metadata, ...source.metadata }), {});
  }
  return merged;
}
function toSdkReplicas(replicas) {
  return replicas?.map((replica) => ({
    ...replica.api_url === void 0 ? {} : { apiUrl: replica.api_url },
    ...replica.api_key === void 0 ? {} : { apiKey: replica.api_key },
    ...replica.project === void 0 ? {} : { projectName: replica.project },
    ...replica.updates === void 0 ? {} : { updates: replica.updates }
  }));
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/config-files.js
import { closeSync as closeSync4, fstatSync as fstatSync2, lstatSync as lstatSync3, openSync as openSync4, readFileSync as readFileSync10 } from "node:fs";
import { join as join22 } from "node:path";
function readCommonConfigFile(path3) {
  let fd;
  try {
    fd = openSync4(path3, COMMON_CONFIG_OPEN_FLAGS);
  } catch (error2) {
    if (error2.code === "ENOENT") {
      try {
        lstatSync3(path3);
      } catch (lstatError) {
        if (lstatError.code === "ENOENT") {
          return absent();
        }
      }
    }
    return invalid();
  }
  try {
    if (!fstatSync2(fd).isFile())
      return invalid();
    return parseCommonConfig(JSON.parse(readFileSync10(fd, "utf8")));
  } catch {
    return invalid();
  } finally {
    try {
      closeSync4(fd);
    } catch {
    }
  }
}
function readCommonConfigFiles(options) {
  const { cwd, home, harnessDirectory } = options;
  return {
    harness: readCommonConfigFile(join22(cwd, harnessDirectory, COMMON_CONFIG_FILE_NAME)),
    root: readCommonConfigFile(join22(cwd, COMMON_CONFIG_ROOT_FILE_NAME)),
    user: home ? readCommonConfigFile(join22(home, harnessDirectory, COMMON_CONFIG_FILE_NAME)) : absent(),
    userRoot: home ? readCommonConfigFile(join22(home, COMMON_CONFIG_USER_ROOT_FILE_NAME)) : absent(),
    managed: readManagedConfigFile(options.managed)
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/settings/setup.js
import { closeSync as closeSync5, fsyncSync, mkdirSync as mkdirSync6, openSync as openSync5, readFileSync as readFileSync11, readlinkSync, realpathSync as realpathSync2, renameSync as renameSync5, rmSync as rmSync2, writeSync as writeSync3 } from "node:fs";
import { randomUUID as randomUUID8 } from "node:crypto";
import { dirname as dirname12, join as join23, resolve as resolve13 } from "node:path";
function parseSetupArguments(text) {
  if (SETUP_LINE_BREAK.test(text.trimEnd()))
    throw new Error(SETUP_MULTIPLE_LINES);
  if (SETUP_API_KEY_PATTERN.test(text))
    throw new Error(SETUP_API_KEY_GIVEN);
  const words = text.trim().split(SETUP_ARGUMENT_SEPARATOR).filter(Boolean);
  const urls = words.filter((word) => SETUP_URL_PATTERN.test(word));
  if (urls.length > 1)
    throw new Error(SETUP_TOO_MANY_URLS);
  const apiUrl = urls[0];
  if (apiUrl !== void 0 && !URL.canParse(apiUrl)) {
    throw new Error(SETUP_INVALID_URL.replace("{url}", () => apiUrl));
  }
  if (apiUrl !== void 0) {
    const { username, password } = new URL(apiUrl);
    if (username || password)
      throw new Error(SETUP_URL_WITH_CREDENTIALS);
    if (SETUP_URL_QUERY_OR_FRAGMENT.test(apiUrl))
      throw new Error(SETUP_URL_WITH_QUERY);
  }
  const project = words.filter((word) => word !== apiUrl).join(" ").replace(SETUP_PROJECT_QUOTES, "$2").trim();
  return {
    ...project ? { project } : {},
    ...apiUrl === void 0 ? {} : { apiUrl }
  };
}
function readExisting(path3) {
  let fd;
  try {
    fd = openSync5(path3, COMMON_CONFIG_OPEN_FLAGS);
  } catch (error2) {
    if (error2.code === "ENOENT")
      return {};
    throw error2;
  }
  try {
    return JSON.parse(readFileSync11(fd, "utf8").replace(UTF8_BOM, ""));
  } catch {
    return void 0;
  } finally {
    closeSync5(fd);
  }
}
function resolveTarget2(path3) {
  try {
    return realpathSync2(path3);
  } catch (error2) {
    if (error2.code !== "ENOENT")
      throw error2;
  }
  try {
    return resolve13(dirname12(path3), readlinkSync(path3));
  } catch {
    return path3;
  }
}
function settingsWriteError(path3, error2) {
  const reason = error2.code ?? String(error2);
  return new Error(SETUP_FILE_FAILED.replace(SETUP_FILE_FAILED_FIELDS, (_match, field2) => field2 === "path" ? path3 : reason));
}
function writeAtomically(target, contents) {
  mkdirSync6(dirname12(target), { recursive: true, mode: SETUP_DIRECTORY_MODE });
  const temp = `${target}.${randomUUID8()}${SETUP_TEMP_SUFFIX}`;
  const fd = openSync5(temp, "wx", SETUP_FILE_MODE);
  try {
    try {
      writeSync3(fd, contents);
      fsyncSync(fd);
    } finally {
      closeSync5(fd);
    }
    renameSync5(temp, target);
  } catch (error2) {
    rmSync2(temp, { force: true });
    throw error2;
  }
}
function writeSetupConfig(home, harnessDirectory, request) {
  const path3 = join23(home, harnessDirectory, COMMON_CONFIG_FILE_NAME);
  let target;
  let existing;
  try {
    target = resolveTarget2(path3);
    existing = readExisting(target);
  } catch (error2) {
    throw settingsWriteError(path3, error2);
  }
  if (!object(existing))
    throw new Error(SETUP_UNREADABLE_CONFIG.replace("{path}", () => path3));
  const updated = {
    ...existing,
    enabled: true,
    ...request.project === void 0 ? {} : { project: request.project },
    ...request.apiUrl === void 0 ? {} : { api_url: request.apiUrl }
  };
  if (parseCommonConfig(updated).status !== "valid") {
    throw new Error(SETUP_INVALID_CONFIG.replace("{path}", () => path3));
  }
  try {
    writeAtomically(target, `${JSON.stringify(updated, null, 2)}
`);
  } catch (error2) {
    throw settingsWriteError(path3, error2);
  }
  return path3;
}
function sendsToReplicas(outcome) {
  return outcome.replicaCount !== void 0 && outcome.replicaCount > 0;
}
function describeDestination(outcome) {
  if (sendsToReplicas(outcome)) {
    const template2 = outcome.replicaCount === 1 ? SETUP_REPLICA_DESTINATION.one : SETUP_REPLICA_DESTINATION.many;
    return template2.replace("{replicaCount}", () => String(outcome.replicaCount));
  }
  const template = outcome.agentId === void 0 ? SETUP_DESTINATION : SETUP_AGENT_DESTINATION;
  return template.replace(SETUP_DESTINATION_FIELDS, (_match, field2) => JSON.stringify(outcome[field2]));
}
function describeSetup(outcome) {
  const { requested } = outcome;
  const toReplicas = sendsToReplicas(outcome);
  const projectOverridden = requested.project !== void 0 && (toReplicas || outcome.agentId !== void 0 || requested.project !== outcome.project);
  const urlOverridden = requested.apiUrl !== void 0 && (toReplicas || requested.apiUrl !== outcome.apiUrl);
  const overridden = projectOverridden || urlOverridden;
  return [
    SETUP_ENABLED.replace("{path}", () => outcome.path),
    describeDestination(outcome),
    ...outcome.enabled ? [] : [SETUP_STILL_OFF],
    ...overridden ? [SETUP_OVERRIDDEN] : [],
    ...outcome.muted ? [SETUP_MUTED] : [],
    outcome.credentialProblem ?? (outcome.signIn === "none" ? SETUP_NO_CREDENTIAL : SETUP_SIGN_IN[outcome.signIn])
  ].join(" ");
}
async function applySetup(argumentText, target) {
  const requested = parseSetupArguments(argumentText);
  const path3 = writeSetupConfig(target.home, target.harnessDirectory, requested);
  return describeSetup({ path: path3, requested, ...await target.readState() });
}

// dist/src/constants.js
var USER_PROMPT_TURN_NAME = "Claude Code Turn";
var ASSISTANT_RUN_NAME = "Claude";
var LS_INTEGRATION = "claude-code";
var ENGINE_STORAGE_DIR_NAME = "langsmith_engine";
var SDK_REPLICA_PROBE = { name: "replicas", run_type: "chain" };
var STOP_FLUSH_WAIT_MS = 200;
var HELD_TOOL_RUN_MAX_AGE_MS = 6 * 60 * 60 * 1e3;
var RUN_CONTEXT_FIELDS = [
  "id",
  "name",
  "run_type",
  "start_time",
  "parent_run_id",
  "trace_id",
  "dotted_order"
];
var RUN_PATCH_FIELDS = ["outputs", "end_time", "error"];
var RUN_SNAPSHOT_FIELDS = [...RUN_CONTEXT_FIELDS, "inputs", ...RUN_PATCH_FIELDS];
var HOOK_PATCH_FIELDS = ["inputs", ...RUN_PATCH_FIELDS];
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
var TOOL_PATH_INPUT_KEYS = ["file_path", "notebook_path", "path", "cwd"];
var PINNED_REPOSITORY_KEYS = /* @__PURE__ */ Symbol("pinned repository metadata keys");
var NO_PINNED_KEYS = /* @__PURE__ */ new Set();
var SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
var ENGINE_WORKER_ARG = "--engine-worker";
var DEVELOPMENT_VERSION = "development";
var PLUGIN_FLAG = "--plugin";
var GATEWAY_PLUGIN = "gateway";
var BUNDLE_USAGE = `Usage: langsmith-claude ${PLUGIN_FLAG} ${GATEWAY_PLUGIN} [arguments]
`;
var STATE_FILE_DEFAULT = [".claude", "state", "langsmith_state.json"];
var GH_LOGIN_MARKER_FILE = "langsmith_gh_login.json";
var NOTICE_KINDS = {
  managed: "managed-invalid",
  credential: "credential-problem"
};
var NOTICE_COOLDOWN_OFF = "off";
var MUTE_LOCKED_REPLY = "An admin has enabled muting for all sessions, so this thread cannot be unmuted.";
var TRACING_COMMAND_PREFIX = "/langsmith-tracing:";
var TRACING_COMMAND_ENTRIES = [
  { name: "mute", takesArguments: false },
  { name: "unmute", takesArguments: false },
  { name: "trace", takesArguments: false },
  { name: "setup", takesArguments: true }
];
var TRACING_COMMANDS = TRACING_COMMAND_ENTRIES.map((entry) => ({ ...entry, text: `${TRACING_COMMAND_PREFIX}${entry.name}` }));
var THREAD_MODE_REPLIES = {
  metadata: {
    verb: "mute",
    saved: "Thread tracing muted (metadata-only). Preference saved for the next turn; the current turn is unchanged."
  },
  full: {
    verb: "unmute",
    saved: "Thread tracing unmuted (full content). Preference saved for the next turn; the current turn is unchanged."
  }
};
var MASTER_DISABLED_NOTE = " Tracing is disabled. Changes will not take effect until it's configured with /langsmith-tracing:setup.";
var NO_CREDENTIALS_NOTE = " No tracing credentials are configured, so this session won't be traced.";
var MUTE_FAILED = "Could not {verb} thread tracing: {error}. Tracing may still be enabled.";
var TRACE_FAILED = "Could not run the trace command. Session ID: {sessionId}. No tracing settings were changed.";
var HARNESS_DIRECTORY = ".claude";
var TURN_START_FAILED = "Could not start the turn: {error}";
var RESPONSE_WRITE_FAILED = "Could not write the UserPromptSubmit response: {error}";
var BOOLEAN_SETTINGS = {
  enabled: { env: "TRACE_TO_LANGSMITH", ...COMMON_BOOLEAN_SETTINGS.enabled },
  defaultMuted: { env: "CC_LANGSMITH_DEFAULT_MUTED", ...COMMON_BOOLEAN_SETTINGS.defaultMuted },
  strict_auth: { env: "CC_LANGSMITH_STRICT_AUTH", restrictive: false },
  capture_hook_outputs: { env: "CC_LANGSMITH_CAPTURE_HOOK_OUTPUTS", restrictive: false }
};
var USAGE_TEMPLATE = `Usage:
  {name} <HookEventName>
  {name} --version

Options:
  --help, -h     Show this help and exit
  --version, -v  Print the installed version and exit`;
var MAX_LOG_BYTES = 5 * 1024 * 1024;
var LOOKUP_TIMEOUT_MS = 4e3;
var AGENT_ADDRESS_KIND = "AGENT";
var AGENT_ADDRESS_ENVIRONMENT = "PRODUCTION";
var WORKSPACE_ID_VARIABLE = "LANGSMITH_WORKSPACE_ID";
var LOOKUP_FORBIDDEN_STATUS = 403;
var NO_PROJECT_ACCESS_REPLY = "You don't have access to this project so we're unable to generate a valid link. Please follow up with a LangSmith admin to update your access.";
var TASK_NOTIFICATION_OPENING = "<task-notification>";
var HARNESS_DROPPED_ELEMENT = /<(system-reminder|local-command-caveat|command-message|ide_opened_file|ide_selection)>[\s\S]*?<\/\1>/g;
var HARNESS_COMMAND = /<command-name>([\s\S]*?)<\/command-name>\s*(?:<command-args>([\s\S]*?)<\/command-args>)?/g;
var HARNESS_TASK_NOTIFICATION = /^(?:\s*<task-notification>\s*<task-id>(?:(?!<\/task-notification>)[\s\S])*<\/task-notification>)+\s*$/;
var HARNESS_TASK_NOTIFICATION_KEPT = /<(summary|result)>([\s\S]*?)<\/\1>/g;
var HARNESS_UNWRAPPED_TAG = /<\/?(bash-input|bash-stdout|bash-stderr|local-command-stdout|local-command-stderr)>|<\/?pasted_content(\s[^>]*)?>/g;
var SKILL_COMMAND_OPENING = "<command-message>";
var SKILL_NAME_LEADING_SLASH = /^\//;
var NON_SKILL_PROMPT_COMMAND = /^(?:mcp__|(?:init|insights|security-review|statusline|team-onboarding)$)/;
var GIT_DIR_COMMAND = /^\s*git\s+-C\s+("[^"$`\\]*"|'[^']*'|[^\s"'$`\\;&|<>()*?~]+)(?![^]*(?:[;|\n]|(?<!>)&(?!>)))/;
var SURROUNDING_QUOTES = /^["']|["']$/g;
var GLOB_CHARACTER = /[*?[{]/;
var SERVER_TOOL_RESULT_TYPE = /_tool_result$/;
var LEGACY_MAX_AGE_MS = 6 * 60 * 60 * 1e3;
var LEGACY_EMPTY_FOLDER_IDLE_MS = 2 * 60 * 60 * 1e3;
var LEGACY_UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
var LEGACY_QUEUE_ID = `\\d{16}-${LEGACY_UUID}`;
var LEGACY_QUEUE_FILE = new RegExp(`^${LEGACY_QUEUE_ID}\\.queue\\.json$`);
var LEGACY_QUEUE_TEMP_FILE = new RegExp(`^${LEGACY_QUEUE_ID}\\.queue\\.json\\.${LEGACY_UUID}\\.queue\\.tmp$`);
var LEGACY_TURN_FILE = new RegExp(`^${LEGACY_UUID}\\.turn\\.jsonl$`);
var LEGACY_FLUSH_LOCK_FILE = new RegExp(`^[\\w.-]+\\.flush\\.lock(\\.${LEGACY_UUID}\\.lock\\.staging)?$`);

// dist/src/integration-version.js
var LS_INTEGRATION_VERSION = true ? "0.6.6" : process.env.CC_LANGSMITH_INTEGRATION_VERSION || void 0;
var PLUGIN_VERSION = LS_INTEGRATION_VERSION ?? DEVELOPMENT_VERSION;

// dist/src/logger.js
import { appendFileSync, mkdirSync as mkdirSync7, statSync as statSync4, renameSync as renameSync6 } from "node:fs";
import { dirname as dirname13 } from "node:path";
var LOG_FILE = process.env.CC_LANGSMITH_LOG_FILE ?? `${process.env.HOME ?? ""}/.claude/state/hook.log`;
var debugEnabled = false;
function initLogger(debug2) {
  debugEnabled = debug2;
  mkdirSync7(dirname13(LOG_FILE), { recursive: true });
}
function rotateIfNeeded() {
  try {
    if (statSync4(LOG_FILE).size >= MAX_LOG_BYTES) {
      renameSync6(LOG_FILE, `${LOG_FILE}.1`);
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

// dist/src/tracer-hooks/tracer-hooks.js
import { dirname as dirname26 } from "node:path";
import { setTimeout as sleep3 } from "node:timers/promises";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/paths.js
import { join as join24 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/constants.js
var PLUGINS_BASE_FOLDER = "langsmith_plugins_base";
var LOCK_FILE = "tracer.lock";
var SNAPSHOT_FILE = "snapshot.json";
var NOTES_FILE = "notes.jsonl";
var LOG_FILE2 = "tracer.log";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/paths.js
function tracerPaths(agentStateFolder) {
  const folder = join24(agentStateFolder, PLUGINS_BASE_FOLDER);
  return {
    folder,
    lock: join24(folder, LOCK_FILE),
    snapshot: join24(folder, SNAPSHOT_FILE),
    notes: join24(folder, NOTES_FILE),
    log: join24(folder, LOG_FILE2)
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/reader/reader.js
import { closeSync as closeSync6, existsSync as existsSync3, fstatSync as fstatSync3, openSync as openSync6 } from "node:fs";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/reader/bookmark.js
import { readSync as readSync2 } from "node:fs";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/reader/lines.js
import { readSync } from "node:fs";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/reader/reader-constants.js
var READ_CHUNK_BYTES = 1048576;
var BOOKMARK_CHECK_BYTES = 1048576;
var NEWLINE = 10;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/reader/lines.js
function scanLines(file, from, to, visit) {
  let carried = Buffer.alloc(0);
  let carriedStart = from;
  let position = from;
  while (position < to) {
    const chunk = Buffer.alloc(Math.min(READ_CHUNK_BYTES, to - position));
    const count = readSync(file, chunk, 0, chunk.length, position);
    if (count === 0)
      break;
    position += count;
    const data = Buffer.concat([carried, chunk.subarray(0, count)]);
    let lineStart = 0;
    let newline = data.indexOf(NEWLINE);
    while (newline !== -1) {
      const end = carriedStart + newline + 1;
      if (visit(data.subarray(lineStart, newline), end))
        return end;
      lineStart = newline + 1;
      newline = data.indexOf(NEWLINE, lineStart);
    }
    carried = Buffer.from(data.subarray(lineStart));
    carriedStart += lineStart;
  }
  return carriedStart;
}
function parseLine(text) {
  try {
    return JSON.parse(text.toString());
  } catch {
    return void 0;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/reader/bookmark.js
function recoverBookmark(file, size, bookmark, lineId, notices) {
  if (bookmark.offset === 0)
    return;
  const id = bookmark.lastLineId;
  if (id === void 0) {
    if (bookmark.offset <= size)
      return;
    bookmark.offset = 0;
    notices.push(`${bookmark.path} shrank and has no line ID to resume from, reading from the start`);
    return;
  }
  if (bookmark.offset <= size && lastIdEndingAt(file, bookmark.offset, lineId) === id)
    return;
  const end = findLineEnd(file, size, id, lineId);
  if (end === void 0) {
    bookmark.offset = 0;
    notices.push(`line ${id} is gone from ${bookmark.path}, reading from the start`);
    return;
  }
  bookmark.offset = end;
  notices.push(`${bookmark.path} changed, resuming after line ${id} at byte ${end}`);
}
function lastIdEndingAt(file, offset, lineId) {
  const start = Math.max(0, offset - BOOKMARK_CHECK_BYTES);
  const window2 = Buffer.alloc(offset - start);
  readSync2(file, window2, 0, window2.length, start);
  const text = window2.toString("utf8");
  if (!text.endsWith("\n"))
    return void 0;
  const pieces = text.slice(0, -1).split("\n");
  for (const piece of pieces.toReversed()) {
    const line = parseLine(piece);
    const id = line === void 0 ? void 0 : lineId(line);
    if (id !== void 0)
      return id;
  }
  return void 0;
}
function findLineEnd(file, size, id, lineId) {
  let found;
  scanLines(file, 0, size, (text, end) => {
    if (!text.includes(id))
      return false;
    const line = parseLine(text);
    if (line === void 0 || lineId(line) !== id)
      return false;
    found = end;
    return true;
  });
  return found;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/reader/reader.js
var checkedBookmarks = /* @__PURE__ */ new WeakSet();
function readNewLines(bookmark, lineId) {
  const lines = [];
  const notices = [];
  if (!existsSync3(bookmark.path))
    return { lines, notices, reachedEnd: true };
  const file = openSync6(bookmark.path, "r");
  try {
    const size = fstatSync3(file).size;
    if (size < bookmark.offset || !checkedBookmarks.has(bookmark)) {
      recoverBookmark(file, size, bookmark, lineId, notices);
      checkedBookmarks.add(bookmark);
    }
    const start = bookmark.offset;
    let reachedEnd = true;
    bookmark.offset = scanLines(file, start, size, (text, end) => {
      const line = parseLine(text);
      if (line !== void 0) {
        lines.push({ line, end });
        const id = lineId(line);
        if (id !== void 0)
          bookmark.lastLineId = id;
      } else if (text.toString("utf8").trim() !== "") {
        notices.push(`skipped an unreadable line ending at byte ${end} of ${bookmark.path}`);
      }
      reachedEnd = end - start < READ_CHUNK_BYTES;
      return !reachedEnd;
    });
    return { lines, notices, reachedEnd };
  } finally {
    closeSync6(file);
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/snapshot/legacy.js
import { existsSync as existsSync5, mkdirSync as mkdirSync8, rmSync as rmSync3 } from "node:fs";
import { isAbsolute as isAbsolute4, join as join25 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/snapshot/snapshot-constants.js
var SNAPSHOT_VERSION = 1;
var SNAPSHOT_TEMP_SUFFIX = ".tmp";
var SNAPSHOT_FILE_MODE = 384;
var LEGACY_IMPORT_WINDOW_MS = 24 * 60 * 60 * 1e3;
var LEGACY_ENGINE_FOLDER = "langsmith_engine";
var LEGACY_STATE_FILE = "langsmith_state.json";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/snapshot/snapshot.js
import { existsSync as existsSync4, readFileSync as readFileSync12 } from "node:fs";
function loadSnapshot(path3) {
  const empty = { version: SNAPSHOT_VERSION, sessions: {} };
  if (!existsSync4(path3))
    return { snapshot: empty };
  try {
    const parsed = JSON.parse(readFileSync12(path3, "utf8"));
    if (parsed.version !== SNAPSHOT_VERSION || typeof parsed.sessions !== "object") {
      return { snapshot: empty, problem: `ignored ${path3} since its version is unknown` };
    }
    return { snapshot: parsed };
  } catch (error2) {
    return { snapshot: empty, problem: `ignored unreadable ${path3}: ${String(error2)}` };
  }
}
function writeSnapshot(path3, snapshot) {
  publishByRename(path3, JSON.stringify(snapshot), SNAPSHOT_TEMP_SUFFIX, SNAPSHOT_FILE_MODE);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/snapshot/legacy.js
function importLegacyState(options) {
  if (!isAbsolute4(options.stateFolder)) {
    throw new Error(`refusing to import legacy state from relative folder "${options.stateFolder}"`);
  }
  const legacyEngine = join25(options.stateFolder, LEGACY_ENGINE_FOLDER);
  const legacyState = join25(options.stateFolder, LEGACY_STATE_FILE);
  if (!existsSync5(legacyEngine) && !existsSync5(legacyState))
    return 0;
  const paths = tracerPaths(options.stateFolder);
  const saved = loadSnapshot(paths.snapshot).snapshot;
  const legacySessions = existsSync5(legacyState) ? options.readLegacySessions(legacyState) : [];
  const cutoff = Date.now() - LEGACY_IMPORT_WINDOW_MS;
  const imported = legacySessions.filter((legacy) => legacy.updatedAt >= cutoff && saved.sessions[legacy.sessionId] === void 0).map((legacy) => ({
    sessionId: legacy.sessionId,
    integration: options.integration,
    writer: options.writer,
    bookmarks: { [legacy.transcriptPath]: { path: legacy.transcriptPath, offset: 0 } },
    pendingNotes: [],
    builderState: void 0,
    tracingMode: legacy.tracingMode,
    ended: false
  }));
  for (const session of imported)
    saved.sessions[session.sessionId] = session;
  mkdirSync8(paths.folder, { recursive: true });
  writeSnapshot(paths.snapshot, saved);
  rmSync3(legacyEngine, { recursive: true, force: true });
  rmSync3(legacyState, { force: true });
  return imported.length;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/upload-queue/upload-queue-constants.js
var UPLOAD_QUEUE_MAX_REQUESTS_IN_FLIGHT = 4;
var MAX_QUEUED_BYTES = 40 * 1024 * 1024;
var MAX_QUEUED_RUNS = 5e3;
var UPLOAD_QUEUE_POLICY = { retryBaseMs: 500, retryMaxMs: 1e4 };
var UPLOAD_QUEUE_PATCH_FIELDS = ["inputs", "outputs", "end_time", "error"];
var UPLOAD_QUEUE_RETRY_LOG = "Upload of {count} runs to {destination} failed, retrying in {delayMs} ms: {reason}";
var UPLOAD_QUEUE_DROPPED_LOG = "DROPPED run {runId} of session {sessionId} on {destination}, since LangSmith rejected it for good: {reason}{hint}";
var UPLOAD_QUEUE_WRITER_FAILED_LOG = "DROPPED every run for an upload setting that could not be used: {reason}";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/upload-queue/submissions.js
function mergeRun(base, update) {
  if (update === void 0)
    return base;
  const merged = { ...base };
  for (const [field2, value] of Object.entries(update)) {
    if (value !== void 0)
      merged[field2] = value;
  }
  return merged;
}
function postSubmission(run) {
  const privacyMode = run.tracingMode === "metadata" ? "metadata" : "full";
  return {
    operation: "post",
    integration: run.metadata.integration,
    privacyMode,
    metadata: run.metadata,
    ...privacyMode === "metadata" ? { privacyContext: { status: privacyStatus(run) } } : {},
    run: {
      id: run.id,
      name: run.name,
      run_type: run.run_type,
      start_time: run.start_time,
      trace_id: run.trace_id,
      dotted_order: run.dotted_order,
      inputs: run.inputs ?? {},
      ...run.parent_run_id === void 0 ? {} : { parent_run_id: run.parent_run_id },
      ...run.end_time === void 0 ? {} : { end_time: run.end_time },
      ...run.outputs === void 0 ? {} : { outputs: run.outputs },
      ...run.error === void 0 ? {} : { error: run.error }
    }
  };
}
function patchSubmission(patch) {
  const fields = [];
  const values = {};
  for (const field2 of UPLOAD_QUEUE_PATCH_FIELDS) {
    if (patch[field2] === void 0)
      continue;
    fields.push(field2);
    values[field2] = patch[field2];
  }
  return {
    operation: "patch",
    integration: patch.metadata.integration,
    privacyMode: patch.tracingMode === "metadata" ? "metadata" : "full",
    metadata: patch.metadata,
    privacyContext: { status: privacyStatus(patch) },
    run: {
      id: patch.id,
      name: patch.name,
      run_type: patch.run_type,
      trace_id: patch.trace_id,
      dotted_order: patch.dotted_order,
      ...patch.parent_run_id === void 0 ? {} : { parent_run_id: patch.parent_run_id },
      ...patch.start_time === void 0 ? {} : { start_time: patch.start_time }
    },
    patch: { fields, values }
  };
}
function privacyStatus(run) {
  if (run.error !== void 0)
    return "error";
  return run.end_time === void 0 ? "running" : "completed";
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/upload-queue/queued-runs.js
function runKey(lane, runId) {
  return JSON.stringify([lane.key, runId]);
}
function parentKey(run) {
  const parentId = run.post?.parent_run_id;
  if (parentId === void 0)
    return void 0;
  return runKey(run.lane, parentId);
}
function requeue(run) {
  const sent = run.sending;
  run.sending = void 0;
  if (sent?.post !== void 0) {
    run.post = mergeRun(sent.post, run.patch);
    run.patch = void 0;
  } else if (sent?.patch !== void 0 && run.post === void 0) {
    run.patch = run.patch === void 0 ? sent.patch : mergeRun(sent.patch, run.patch);
  }
  run.lane.ready.add(run);
}
function startSending(run) {
  const { post: unsentPost, patch: unsentPatch } = run;
  run.sending = unsentPost === void 0 ? { patch: unsentPatch } : { post: unsentPost };
  run.post = void 0;
  run.patch = void 0;
  return {
    submission: unsentPost === void 0 ? patchSubmission(unsentPatch) : postSubmission(unsentPost)
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/upload-queue/upload-queue.js
function createUploadQueue(log2, policy = UPLOAD_QUEUE_POLICY) {
  const lanesByWriter = /* @__PURE__ */ new Map();
  const lanes = [];
  const runs = /* @__PURE__ */ new Map();
  const waitingOnParent = /* @__PURE__ */ new Map();
  const pendingBySession = /* @__PURE__ */ new Map();
  let inFlight = 0;
  let queuedBytes = 0;
  let nextLane = 0;
  let retryTimer;
  function lanesFor(options) {
    const key = JSON.stringify(options);
    const known = lanesByWriter.get(key);
    if (known !== void 0)
      return known;
    let created = [];
    try {
      const writer = createLangSmithUploadWriter(options);
      created = writer.destinations.map(({ id }, index) => ({
        key: `${lanes.length + index}`,
        writer,
        destinationId: id,
        ready: /* @__PURE__ */ new Set(),
        failures: 0,
        retryAt: 0
      }));
    } catch (error2) {
      log2(fillTemplate(UPLOAD_QUEUE_WRITER_FAILED_LOG, { reason: describe(error2) }));
    }
    lanesByWriter.set(key, created);
    lanes.push(...created);
    return created;
  }
  function track(sessionId, lane, runId) {
    const key = runKey(lane, runId);
    const known = runs.get(key);
    if (known !== void 0)
      return known;
    const run = { key, runId, sessionId, lane, sendAlone: false, bytes: 0 };
    runs.set(key, run);
    pendingBySession.set(sessionId, (pendingBySession.get(sessionId) ?? 0) + 1);
    return run;
  }
  function hold(run, content) {
    const bytes = Buffer.byteLength(JSON.stringify(content));
    run.bytes += bytes;
    queuedBytes += bytes;
  }
  function forget(run) {
    runs.delete(run.key);
    queuedBytes -= run.bytes;
    const left = (pendingBySession.get(run.sessionId) ?? 1) - 1;
    if (left === 0)
      pendingBySession.delete(run.sessionId);
    else
      pendingBySession.set(run.sessionId, left);
  }
  function parentUnacknowledged(key) {
    const parent = runs.get(key);
    return parent?.post !== void 0 || parent?.sending?.post !== void 0;
  }
  function releaseChildren(run) {
    for (const child of waitingOnParent.get(run.key) ?? [])
      child.lane.ready.add(child);
    waitingOnParent.delete(run.key);
  }
  function takeBatch(lane) {
    const batch = [];
    const inBatch = /* @__PURE__ */ new Set();
    for (const run of lane.ready) {
      const parent = parentKey(run);
      if (parent !== void 0 && !inBatch.has(parent) && parentUnacknowledged(parent)) {
        lane.ready.delete(run);
        const siblings = waitingOnParent.get(parent);
        if (siblings === void 0)
          waitingOnParent.set(parent, [run]);
        else
          siblings.push(run);
        continue;
      }
      if (run.sendAlone && batch.length > 0)
        continue;
      lane.ready.delete(run);
      batch.push(run);
      inBatch.add(run.key);
      if (run.sendAlone || batch.length >= lane.writer.batchLimits.maxRuns)
        break;
    }
    return batch;
  }
  function acknowledge(run) {
    const postedNow = run.sending?.post !== void 0;
    run.sending = void 0;
    if (run.post !== void 0 || run.patch !== void 0)
      run.lane.ready.add(run);
    else
      forget(run);
    if (postedNow)
      releaseChildren(run);
  }
  function drop(run, error2) {
    const { reason, status } = rejection(error2);
    log2(fillTemplate(UPLOAD_QUEUE_DROPPED_LOG, {
      runId: run.runId,
      sessionId: run.sessionId,
      destination: run.lane.destinationId,
      reason,
      hint: authHint(status)
    }));
    run.sending = void 0;
    forget(run);
    releaseChildren(run);
  }
  function backOff(lane, count, error2) {
    lane.failures += 1;
    const delayMs = Math.min(policy.retryMaxMs, policy.retryBaseMs * 2 ** (lane.failures - 1));
    lane.retryAt = Date.now() + delayMs;
    log2(fillTemplate(UPLOAD_QUEUE_RETRY_LOG, {
      count,
      destination: lane.destinationId,
      delayMs,
      reason: failureReason(error2)
    }));
  }
  async function send(lane, batch) {
    const error2 = await Promise.resolve().then(() => lane.writer.sendBatch(batch.map(startSending), lane.destinationId)).then(() => void 0, (failure) => failure ?? new Error());
    inFlight -= 1;
    if (error2 === void 0) {
      lane.failures = 0;
      for (const run of batch)
        acknowledge(run);
    } else if (isRetryable(error2) && !(error2 instanceof TypeError)) {
      backOff(lane, batch.length, error2);
      for (const run of batch)
        requeue(run);
    } else if (batch.length > 1) {
      for (const run of batch) {
        run.sendAlone = true;
        requeue(run);
      }
    } else {
      for (const run of batch)
        drop(run, error2);
    }
    flush();
  }
  function laneToServe(now) {
    for (let step = 0; step < lanes.length; step += 1) {
      const lane = lanes[(nextLane + step) % lanes.length];
      if (lane.ready.size > 0 && lane.retryAt <= now) {
        nextLane = (nextLane + step + 1) % lanes.length;
        return lane;
      }
    }
    return void 0;
  }
  function scheduleRetry(now) {
    clearTimeout(retryTimer);
    retryTimer = void 0;
    let earliest = Infinity;
    for (const lane of lanes) {
      if (lane.ready.size > 0 && lane.retryAt > now)
        earliest = Math.min(earliest, lane.retryAt);
    }
    if (earliest === Infinity)
      return;
    retryTimer = setTimeout(flush, earliest - now);
    retryTimer.unref();
  }
  function flush() {
    const now = Date.now();
    while (inFlight < UPLOAD_QUEUE_MAX_REQUESTS_IN_FLIGHT) {
      const lane = laneToServe(now);
      if (lane === void 0)
        break;
      const batch = takeBatch(lane);
      if (batch.length === 0)
        continue;
      inFlight += 1;
      void send(lane, batch);
    }
    scheduleRetry(now);
  }
  function post(sessionId, options, run) {
    if (run.tracingMode === "off")
      return;
    for (const lane of lanesFor(options)) {
      const queued = track(sessionId, lane, run.id);
      if (queued.post !== void 0 || queued.sending?.post !== void 0)
        continue;
      hold(queued, run);
      queued.post = mergeRun(mergeRun(run, queued.sending?.patch), queued.patch);
      queued.patch = void 0;
      if (queued.sending === void 0)
        lane.ready.add(queued);
    }
  }
  function patch(sessionId, options, update) {
    if (update.tracingMode === "off")
      return;
    for (const lane of lanesFor(options)) {
      const queued = track(sessionId, lane, update.id);
      hold(queued, update);
      if (queued.post !== void 0) {
        queued.post = mergeRun(queued.post, update);
        continue;
      }
      queued.patch = queued.patch === void 0 ? update : mergeRun(queued.patch, update);
      if (queued.sending === void 0)
        lane.ready.add(queued);
    }
  }
  return {
    post,
    patch,
    pendingFor: (sessionId) => pendingBySession.get(sessionId) ?? 0,
    idle: () => runs.size === 0,
    full: () => queuedBytes >= MAX_QUEUED_BYTES || runs.size >= MAX_QUEUED_RUNS,
    flush
  };
}
function failureReason(error2) {
  const cause = error2 instanceof Error && error2.cause !== void 0 ? error2.cause : error2;
  const status = failureStatus(cause);
  return status === void 0 ? describe(cause) : `${describe(cause)} (HTTP ${status})`;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/worker/worker.js
import { appendFileSync as appendFileSync2, mkdirSync as mkdirSync9, watch } from "node:fs";
import { basename as basename5 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/worker/lock.js
import { linkSync, readFileSync as readFileSync13, statSync as statSync5, writeFileSync as writeFileSync4 } from "node:fs";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/files/remove.js
import { unlinkSync as unlinkSync3 } from "node:fs";
function removeFile2(path3) {
  try {
    unlinkSync3(path3);
  } catch (error2) {
    ifMissing(void 0)(error2);
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/worker/worker-constants.js
var LOCK_TEMPORARY_SUFFIX = ".claim.";
var LOCK_TAKEOVER_SUFFIX = ".takeover";
var LOCK_ATTEMPTS = 3;
var LOCK_TAKEOVER_STALE_MS = 1e3;
var UNREAD_NOTES = { base: 0, offset: 0 };
var HOOK_WARNING_PREFIX = "langsmith tracer: ";
var READ_DEBOUNCE_MS = 20;
var TICK_MS = 500;
var IDLE_EXIT_MS = 3e3;
var ABANDONED_EXIT_MS = 6e5;
var SESSION_END_EVENT = "SessionEnd";
var WORKER_STARTED_LOG = "worker started";
var WORKER_STOPPED_LOG = "worker stopped";
var WORKER_RESUMED_LOG = "worker resumed for late notes";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/worker/lock.js
function createLock(lock, version) {
  const temporary = `${lock}${LOCK_TEMPORARY_SUFFIX}${process.pid}`;
  const holder = { pid: process.pid, version };
  writeFileSync4(temporary, JSON.stringify(holder));
  try {
    linkSync(temporary, lock);
    return true;
  } catch (error2) {
    if (errorCode(error2) === FILE_EXISTS_CODE)
      return false;
    throw error2;
  } finally {
    removeFile2(temporary);
  }
}
function lockOwner2(lock) {
  try {
    return readFileSync13(lock, "utf8");
  } catch (error2) {
    if (errorCode(error2) === FILE_MISSING_CODE)
      return void 0;
    throw error2;
  }
}
function parseHolder(owner) {
  try {
    const holder = JSON.parse(owner);
    const { pid, version } = holder;
    if (typeof pid !== "number" || !Number.isSafeInteger(pid) || pid <= 0)
      return void 0;
    return { pid, version: typeof version === "string" ? version : "" };
  } catch {
    return void 0;
  }
}
function ownerIsAlive(owner) {
  const holder = parseHolder(owner);
  return holder !== void 0 && processIsAlive(holder.pid) !== false;
}
function claimTakeover(takeover, version) {
  if (createLock(takeover, version))
    return true;
  const claimed = statSync5(takeover, { throwIfNoEntry: false });
  if (claimed === void 0 || Date.now() - claimed.mtimeMs < LOCK_TAKEOVER_STALE_MS)
    return false;
  removeFile2(takeover);
  return createLock(takeover, version);
}
function takeOverDeadLock(lock, deadOwner, version) {
  const takeover = `${lock}${LOCK_TAKEOVER_SUFFIX}`;
  if (!claimTakeover(takeover, version))
    return false;
  try {
    if (lockOwner2(lock) === deadOwner)
      removeFile2(lock);
    return createLock(lock, version);
  } finally {
    removeFile2(takeover);
  }
}
function takeLock(lock, version) {
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt++) {
    if (createLock(lock, version))
      return true;
    const owner = lockOwner2(lock);
    if (owner === void 0)
      continue;
    if (ownerIsAlive(owner))
      return false;
    return takeOverDeadLock(lock, owner, version);
  }
  return false;
}
function liveLockHolder(lock) {
  const owner = lockOwner2(lock);
  return owner !== void 0 && ownerIsAlive(owner) ? parseHolder(owner) : void 0;
}
function releaseLock(lock) {
  const owner = lockOwner2(lock);
  if (owner !== void 0 && parseHolder(owner)?.pid === process.pid)
    removeFile2(lock);
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/notes/notes.js
import { closeSync as closeSync7, fstatSync as fstatSync4, openSync as openSync7, readdirSync as readdirSync2, readSync as readSync3, renameSync as renameSync7, statSync as statSync6 } from "node:fs";
import { basename as basename4, dirname as dirname14, join as join26 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/notes/notes-constants.js
var NOTES_ROTATE_BYTES = 10 * 1024 * 1024;
var ROTATED_NOTES_SUFFIX = ".rotated.";
var ROTATED_NOTES_NAME = /\.rotated\.(\d+)-(\d+)$/u;
var ROTATED_NOTES_SETTLE_MS = 500;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/notes/notes.js
var NotesFollower = class {
  notes;
  receive;
  base = 0;
  offset = 0;
  rotated = [];
  constructor(notes, receive) {
    this.notes = notes;
    this.receive = receive;
  }
  readFrom(path3, offset) {
    let file;
    try {
      file = openSync7(path3, "r");
    } catch (error2) {
      if (errorCode(error2) === FILE_MISSING_CODE)
        return { offset, size: 0 };
      throw error2;
    }
    try {
      const size = fstatSync4(file).size;
      const buffer = Buffer.alloc(Math.max(0, size - offset));
      readSync3(file, buffer, 0, buffer.length, offset);
      const complete = buffer.lastIndexOf(NEWLINE) + 1;
      const text = buffer.subarray(0, complete).toString("utf8");
      for (const line of text.split("\n").filter(Boolean))
        this.receive(line);
      return { offset: offset + complete, size };
    } finally {
      closeSync7(file);
    }
  }
  leftovers() {
    const folder = dirname14(this.notes);
    const prefix = `${basename4(this.notes)}${ROTATED_NOTES_SUFFIX}`;
    return readdirSync2(folder).filter((name) => name.startsWith(prefix)).flatMap((name) => {
      const match = ROTATED_NOTES_NAME.exec(name);
      if (match === null)
        return [];
      return [{ path: join26(folder, name), base: Number(match[1]), nextBase: Number(match[2]) }];
    }).toSorted((left, right) => left.base - right.base);
  }
  resume(bookmark) {
    const position = bookmark.base + bookmark.offset;
    this.base = bookmark.base;
    for (const leftover of this.leftovers()) {
      this.readFrom(leftover.path, Math.max(0, position - leftover.base));
      removeFile2(leftover.path);
      this.base = Math.max(this.base, leftover.nextBase);
    }
    this.offset = Math.max(0, position - this.base);
  }
  take() {
    this.settle();
    const read = this.readFrom(this.notes, this.offset);
    if (read.size < this.offset) {
      this.base += this.offset;
      this.offset = 0;
      return;
    }
    this.offset = read.offset;
    if (this.offset >= NOTES_ROTATE_BYTES && read.size === this.offset)
      this.rotate();
  }
  rotate() {
    const nextBase = this.base + this.offset;
    const path3 = `${this.notes}${ROTATED_NOTES_SUFFIX}${this.base}-${nextBase}`;
    renameSync7(this.notes, path3);
    this.rotated.push({ path: path3, offset: this.offset, rotatedAt: Date.now() });
    this.base = nextBase;
    this.offset = 0;
  }
  settle() {
    for (let next = this.rotated[0]; next !== void 0 && Date.now() - next.rotatedAt >= ROTATED_NOTES_SETTLE_MS; next = this.rotated[0]) {
      this.readFrom(next.path, next.offset);
      removeFile2(next.path);
      this.rotated.shift();
    }
  }
  bookmark() {
    return { base: this.base, offset: this.offset };
  }
  rotating() {
    return this.rotated.length > 0;
  }
  unread() {
    const size = statSync6(this.notes, { throwIfNoEntry: false })?.size ?? 0;
    return this.rotating() || size > this.offset;
  }
};

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/worker/session.js
import { statSync as statSync7 } from "node:fs";
var fileSize = (path3) => statSync7(path3, { throwIfNoEntry: false })?.size ?? 0;
function sessionTranscripts(session) {
  return [.../* @__PURE__ */ new Set([...Object.keys(session.bookmarks), ...session.builder.transcripts()])];
}
function positionNote(session, note) {
  const transcriptSizes = { ...note.transcriptSizes };
  for (const path3 of sessionTranscripts(session))
    transcriptSizes[path3] ??= fileSize(path3);
  return { ...note, transcriptSizes };
}
function noteReached(session, note) {
  return Object.entries(note.transcriptSizes).every(([path3, size]) => (session.bookmarks[path3]?.offset ?? 0) >= size);
}
function deliverReadyNotes(session, log2) {
  let delivered = false;
  for (let note = session.pendingNotes[0]; note !== void 0; note = session.pendingNotes[0]) {
    if (!noteReached(session, note))
      break;
    session.pendingNotes.shift();
    delivered = true;
    if (note.event === SESSION_END_EVENT)
      session.ended = true;
    try {
      session.builder.receiveNote(note);
    } catch (error2) {
      log2(`could not apply ${note.event} for ${session.sessionId}: ${describe(error2)}`);
    }
  }
  return delivered;
}
function readLimit(session, path3) {
  return session.pendingNotes[0]?.transcriptSizes[path3] ?? Infinity;
}
function reachNoteAt(session, path3, offset) {
  const sizes = session.pendingNotes[0]?.transcriptSizes;
  const size = sizes?.[path3];
  if (sizes !== void 0 && size !== void 0 && size > offset)
    sizes[path3] = offset;
}
function deliverLine(session, bookmark, read, log2) {
  try {
    session.builder.readLine(bookmark.path, read.line);
  } catch (error2) {
    log2(`could not trace a line in ${bookmark.path}: ${describe(error2)}`);
  }
  bookmark.offset = read.end;
  const id = session.builder.lineId(read.line);
  if (id !== void 0)
    bookmark.lastLineId = id;
}
function moveBookmark(bookmark, to) {
  bookmark.offset = to.offset;
  if (to.lastLineId === void 0)
    delete bookmark.lastLineId;
  else
    bookmark.lastLineId = to.lastLineId;
}
function readTranscript(session, path3, readNewLines2, log2) {
  const bookmark = session.bookmarks[path3] ??= { path: path3, offset: 0 };
  const readFrom = { ...bookmark };
  const lines = readNewLines2(bookmark, session.builder.lineId, log2);
  const readTo = { ...bookmark };
  moveBookmark(bookmark, readFrom);
  let advanced = false;
  for (const read of lines) {
    if (read.end > readLimit(session, path3)) {
      reachNoteAt(session, path3, bookmark.offset);
      deliverReadyNotes(session, log2);
      if (read.end > readLimit(session, path3))
        return advanced;
    }
    deliverLine(session, bookmark, read, log2);
    advanced = true;
  }
  if (readTo.offset > bookmark.offset)
    moveBookmark(bookmark, readTo);
  return advanced;
}
function settleUnreachableNote(session) {
  const sizes = session.pendingNotes[0]?.transcriptSizes ?? {};
  let settled = false;
  for (const [path3, size] of Object.entries(sizes)) {
    const offset = session.bookmarks[path3]?.offset ?? 0;
    if (offset >= size || fileSize(path3) >= size)
      continue;
    sizes[path3] = offset;
    settled = true;
  }
  return settled;
}
function readPass(session, readNewLines2, log2, paused) {
  let progressed = false;
  for (; ; ) {
    if (paused())
      return progressed;
    let advanced = deliverReadyNotes(session, log2);
    for (const path3 of sessionTranscripts(session))
      advanced = readTranscript(session, path3, readNewLines2, log2) || advanced;
    if (!advanced)
      advanced = settleUnreachableNote(session);
    if (!advanced)
      return progressed;
    progressed = true;
  }
}
function snapshotOf({ builder, ...saved }) {
  return { ...saved, builderState: builder.state() };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/worker/worker.js
var TracerWorker = class {
  options;
  sessions = /* @__PURE__ */ new Map();
  scheduled = /* @__PURE__ */ new Set();
  waitingForUploads = /* @__PURE__ */ new Set();
  queue;
  notes;
  saved = { version: SNAPSHOT_VERSION, sessions: {} };
  unsaved = false;
  lastActivity = Date.now();
  stopRequested = false;
  ticker;
  watcher;
  stop;
  constructor(options) {
    this.options = options;
    this.queue = options.createQueue(this.log);
    this.notes = new NotesFollower(options.paths.notes, (line) => this.receiveLine(line));
  }
  log = (line) => {
    try {
      appendFileSync2(this.options.paths.log, `${(/* @__PURE__ */ new Date()).toISOString()} ${line}
`);
    } catch {
      return;
    }
  };
  attempt(failure, action) {
    try {
      action();
    } catch (error2) {
      this.log(`${failure}: ${describe(error2)}`);
    }
  }
  start() {
    this.log(`${WORKER_STARTED_LOG} ${process.pid}`);
    this.attempt("could not upgrade older state", () => this.options.upgradeState());
    this.attempt("could not load the snapshot", () => {
      this.saved = this.options.snapshots.load() ?? this.saved;
    });
    for (const snapshot of Object.values(this.saved.sessions)) {
      this.sessions.set(snapshot.sessionId, this.createSession(snapshot));
      this.scheduleRead(snapshot.sessionId);
    }
    this.notes.resume(this.saved.notes ?? UNREAD_NOTES);
    this.takeNotes();
    const notesName = basename5(this.options.paths.notes);
    this.watcher = watch(this.options.paths.folder, (_event, name) => {
      if (name === null || name === notesName)
        this.takeNotes();
    });
    this.watcher.on("error", (error2) => this.log(`stopped watching notes: ${describe(error2)}`));
    this.ticker = setInterval(() => this.tick(), TICK_MS);
  }
  stopped() {
    return new Promise((resolve17) => {
      this.stop = resolve17;
    });
  }
  createSession({ builderState, ...saved }) {
    const session = {
      ...saved,
      builder: this.options.createBuilder({
        sessionId: saved.sessionId,
        savedState: builderState,
        sink: {
          post: (run) => this.queue.post(session.sessionId, session.writer, run),
          patch: (patch) => this.queue.patch(session.sessionId, session.writer, patch)
        }
      })
    };
    return session;
  }
  receive(note) {
    this.lastActivity = Date.now();
    const session = this.sessions.get(note.sessionId) ?? this.createSession({
      sessionId: note.sessionId,
      integration: note.integration,
      writer: note.writer,
      bookmarks: {},
      pendingNotes: [],
      builderState: void 0,
      ended: false
    });
    this.sessions.set(session.sessionId, session);
    session.integration = note.integration;
    session.writer = note.writer;
    session.ended = false;
    if (note.transcriptPath !== void 0)
      session.bookmarks[note.transcriptPath] ??= { path: note.transcriptPath, offset: 0 };
    session.pendingNotes.push(positionNote(session, note));
    this.scheduleRead(session.sessionId);
  }
  receiveLine(text) {
    this.unsaved = true;
    try {
      const note = JSON.parse(text);
      if ("stopWorker" in note) {
        this.log(`stopping for a newer worker ${note.version}`);
        this.stopRequested = true;
        return;
      }
      if (typeof note.sessionId !== "string")
        throw new Error("the note has no session id");
      this.receive(note);
    } catch (error2) {
      this.log(`skipped a bad hook note: ${describe(error2)}`);
    }
  }
  scheduleRead(sessionId) {
    if (this.scheduled.has(sessionId))
      return;
    this.scheduled.add(sessionId);
    setTimeout(() => {
      this.scheduled.delete(sessionId);
      this.read(sessionId);
    }, READ_DEBOUNCE_MS);
  }
  read(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session === void 0)
      return;
    this.attempt(`read failed for ${sessionId}`, () => {
      if (readPass(session, this.options.readNewLines, this.log, () => this.queue.full())) {
        this.lastActivity = Date.now();
        this.unsaved = true;
      }
      if (this.queue.full())
        this.waitingForUploads.add(sessionId);
      this.queue.flush();
    });
  }
  takeNotes() {
    this.attempt("could not take the notes", () => this.notes.take());
  }
  saveSnapshot() {
    if (!this.unsaved || this.notes.rotating())
      return;
    const sessions = [...this.sessions.values()];
    if (sessions.some((session) => this.queue.pendingFor(session.sessionId) > 0))
      return;
    for (const session of sessions)
      if (session.ended && session.pendingNotes.length === 0)
        this.sessions.delete(session.sessionId);
    this.saved = {
      version: SNAPSHOT_VERSION,
      sessions: Object.fromEntries([...this.sessions.values()].map((s) => [s.sessionId, snapshotOf(s)])),
      notes: this.notes.bookmark()
    };
    this.unsaved = false;
    this.attempt("could not save the snapshot", () => this.options.snapshots.save(this.saved));
  }
  shouldExit() {
    const busy = this.scheduled.size > 0 || this.waitingForUploads.size > 0 || this.notes.rotating() || !this.queue.idle();
    if (busy)
      return false;
    const quiet = Date.now() - this.lastActivity;
    return this.stopRequested || quiet >= ABANDONED_EXIT_MS || quiet >= IDLE_EXIT_MS && this.sessions.size === 0 && !this.notes.unread();
  }
  resumeReadsAfterUploads() {
    if (this.queue.full())
      return;
    for (const sessionId of this.waitingForUploads)
      this.scheduleRead(sessionId);
    this.waitingForUploads.clear();
  }
  tick() {
    this.takeNotes();
    this.queue.flush();
    this.resumeReadsAfterUploads();
    this.saveSnapshot();
    if (this.shouldExit())
      this.exit();
  }
  exit() {
    const { lock } = this.options.paths;
    this.unsaved = true;
    this.saveSnapshot();
    releaseLock(lock);
    if (!this.stopRequested && this.notes.unread() && takeLock(lock, this.options.version)) {
      this.log(`${WORKER_RESUMED_LOG} ${process.pid}`);
      return;
    }
    clearInterval(this.ticker);
    this.watcher?.close();
    this.log(`${WORKER_STOPPED_LOG} ${process.pid}`);
    this.stop?.();
  }
};
async function runWorker(options) {
  mkdirSync9(options.paths.folder, { recursive: true });
  if (!takeLock(options.paths.lock, options.version))
    return;
  const worker = new TracerWorker(options);
  const stopped = worker.stopped();
  try {
    worker.start();
  } catch (error2) {
    worker.log(`worker failed to start: ${describe(error2)}`);
    releaseLock(options.paths.lock);
    return;
  }
  await stopped;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/start.js
function startTracerWorker(options) {
  const paths = tracerPaths(options.agentStateFolder);
  return runWorker({
    paths,
    version: options.version,
    createBuilder: options.createBuilder,
    createQueue: (log2) => createUploadQueue(log2),
    readNewLines: (bookmark, lineId, log2) => {
      const read = readNewLines(bookmark, lineId);
      for (const notice of read.notices)
        log2(notice);
      return read.lines;
    },
    snapshots: {
      load: () => loadSnapshot(paths.snapshot).snapshot,
      save: (snapshot) => writeSnapshot(paths.snapshot, snapshot)
    },
    upgradeState: () => {
      importLegacyState({
        stateFolder: options.agentStateFolder,
        integration: options.integration,
        writer: options.writer,
        readLegacySessions: options.readLegacySessions
      });
    }
  });
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/tracer/worker/hook.js
import { appendFileSync as appendFileSync3, mkdirSync as mkdirSync10, statSync as statSync8 } from "node:fs";
function positioned(note) {
  const path3 = note.transcriptPath;
  const size = path3 === void 0 ? void 0 : statSync8(path3, { throwIfNoEntry: false })?.size;
  const transcriptSizes = path3 !== void 0 && size !== void 0 ? { [path3]: size } : {};
  return { ...note, transcriptSizes };
}
var isNewerVersion = (candidate, current) => candidate.localeCompare(current, void 0, { numeric: true }) > 0;
function sendHookNote(note, options) {
  const { paths, version, startWorker } = options;
  try {
    mkdirSync10(paths.folder, { recursive: true });
    appendFileSync3(paths.notes, `${JSON.stringify(positioned(note))}
`);
    const holder = liveLockHolder(paths.lock);
    if (holder === void 0)
      startWorker();
    else if (isNewerVersion(version, holder.version)) {
      const request = { stopWorker: true, version };
      appendFileSync3(paths.notes, `${JSON.stringify(request)}
`);
    }
  } catch (error2) {
    process.stderr.write(`${HOOK_WARNING_PREFIX}${describe(error2)}
`);
  }
}

// dist/src/engine-writer.js
import { dirname as dirname15, join as join27 } from "node:path";

// dist/src/utils/clone.js
function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

// dist/src/engine-writer.js
function writerOptions(config) {
  const replicas = uploadReplicas(config.replicas);
  return {
    destinations: [
      {
        ...config.login ? { login: config.login } : { apiKey: config.apiKey },
        apiUrl: config.apiBaseUrl,
        projectName: config.project,
        ...config.agentId === void 0 ? {} : { agentId: config.agentId }
      }
    ],
    ...replicas.length ? { replicas } : {},
    redact: config.redact,
    ...config.projectLocked ? { projectLocked: true } : {},
    ...config.redactExtraRules ? {
      redactExtraRules: config.redactExtraRules
    } : {}
  };
}
function engineStorageRoot(stateFilePath) {
  return join27(dirname15(stateFilePath), ENGINE_STORAGE_DIR_NAME);
}
function uploadReplicas(replicas) {
  return (replicas ?? replicasFromEnvironment() ?? []).map(writerReplica);
}
function replicasFromEnvironment() {
  return new RunTree(SDK_REPLICA_PROBE).replicas;
}
function writerReplica(replica) {
  const source = Array.isArray(replica) ? { projectName: replica[0], updates: replica[1] } : replica;
  return cloneJson(source);
}
function readUploadNotices(config) {
  const apiKey = sdkSetting(config.apiKey);
  const loginNotice = readLoginNotice(engineStorageRoot(config.stateFilePath), process.env, config.login || apiKey === void 0 ? void 0 : { apiKey, apiUrl: config.apiBaseUrl }, config.profile);
  const credentialNotice = config.login ? refusedLoginReplicas(writerOptions(config).replicas, config.apiBaseUrl) : void 0;
  return { loginNotice, credentialNotice };
}

// dist/src/tracing-policy.js
import { mkdir as mkdir6 } from "node:fs/promises";
import { dirname as dirname16 } from "node:path";

// dist/src/utils/records.js
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// dist/src/tracing-policy.js
function isMode(value) {
  return value === "full" || value === "metadata";
}
function parsePolicy(value) {
  if (!isRecord(value) || !isRecord(value.threads) || Object.values(value.threads).some((mode) => !isMode(mode)) || Object.keys(value).some((key) => key !== "threads")) {
    throw new Error("Invalid tracing preference format");
  }
  return value;
}
var POLICY_FILE = {
  empty: () => ({ threads: {} }),
  parse: parsePolicy
};
function tracingPolicyPath(stateFilePath) {
  return `${stateFilePath.replace(/\.json$/, "")}.privacy.json`;
}
function getThreadTracingMode(stateFilePath, sessionId, defaultMuted = false) {
  try {
    const policy = readPolicyFile(tracingPolicyPath(stateFilePath), POLICY_FILE);
    if (Object.hasOwn(policy.threads, sessionId))
      return policy.threads[sessionId];
    return defaultMuted ? "metadata" : "full";
  } catch {
    return "metadata";
  }
}
async function setThreadTracingMode(stateFilePath, sessionId, mode) {
  if (typeof sessionId !== "string" || !sessionId || !isMode(mode)) {
    throw new Error("A nonempty session ID and a full/metadata tracing mode are required");
  }
  const path3 = tracingPolicyPath(stateFilePath);
  await mkdir6(dirname16(path3), { recursive: true });
  return updatePolicyFile(path3, POLICY_FILE, (policy) => {
    policy.threads = { ...policy.threads, [sessionId]: mode };
  });
}

// dist/src/transcript.js
import { existsSync as existsSync6, statSync as statSync9, fstatSync as fstatSync5, openSync as openSync8, readSync as readSync4, closeSync as closeSync8 } from "node:fs";
import { StringDecoder } from "node:string_decoder";

// dist/src/utils/files.js
import { lstatSync as lstatSync4, mkdirSync as mkdirSync11, readdirSync as readdirSync3, readFileSync as readFileSync14, renameSync as renameSync8, rmdirSync as rmdirSync2, unlinkSync as unlinkSync4, writeFileSync as writeFileSync5 } from "node:fs";
import { randomUUID as randomUUID9 } from "node:crypto";
import { dirname as dirname17 } from "node:path";

// dist/src/utils/ids/prompt-hash.js
import { createHash as createHash8 } from "node:crypto";

// dist/src/transcript.js
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
function isInsertedMessage(msg) {
  return msg.isMeta === true || msg.isCompactSummary === true || typeof msg.message.content === "string" && msg.message.content.startsWith(TASK_NOTIFICATION_OPENING);
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

// dist/src/tracing-mode.js
function resolveTurnTracingMode(config, sessionId, ...snapshots) {
  const { stateFilePath, defaultMuted, mutedLocked } = typeof config === "string" ? { stateFilePath: config } : config;
  return snapshots.find((mode) => mode !== void 0) ?? (mutedLocked ? "metadata" : getThreadTracingMode(stateFilePath, sessionId, defaultMuted));
}
function promptTurnMode(config, sessionId, currentTurnMode) {
  return config.mutedLocked ? "metadata" : resolveTurnTracingMode(config, sessionId, currentTurnMode);
}

// dist/src/state.js
import { join as join28 } from "node:path";
var stores = /* @__PURE__ */ new Map();
function storeFor(stateFilePath) {
  let store = stores.get(stateFilePath);
  if (!store) {
    store = createStateStore({ path: stateFilePath, warn });
    stores.set(stateFilePath, store);
  }
  return store;
}
function loadState(stateFilePath) {
  return storeFor(stateFilePath).read();
}

// dist/src/utils/harness.js
function isCursorPayload(input) {
  return typeof input === "object" && input !== null && Object.hasOwn(input, CURSOR_VERSION_FIELD);
}
function isPayloadForHook(input, event) {
  if (isCursorPayload(input))
    return false;
  const declared = input.hook_event_name;
  return declared === void 0 || declared === event;
}
function stripHarnessMarkup(text) {
  return text.replace(HARNESS_DROPPED_ELEMENT, "").replace(HARNESS_COMMAND, (_, name, args = "") => `${name.trim()} ${args.trim()}`.trim()).replace(HARNESS_TASK_NOTIFICATION, (block) => [...block.matchAll(HARNESS_TASK_NOTIFICATION_KEPT)].map((m) => m[2].trim()).join("\n\n")).replace(HARNESS_UNWRAPPED_TAG, "").trim();
}
function typedSkillName(content) {
  if (typeof content !== "string" || !content.startsWith(SKILL_COMMAND_OPENING))
    return void 0;
  const name = [...content.matchAll(HARNESS_COMMAND)][0]?.[1]?.trim().replace(SKILL_NAME_LEADING_SLASH, "");
  return name && !NON_SKILL_PROMPT_COMMAND.test(name) ? name : void 0;
}
function stripContentMarkup(content) {
  if (typeof content === "string")
    return stripHarnessMarkup(content) || void 0;
  const blocks = content.flatMap((block) => {
    if (block.type !== "text" || typeof block.text !== "string")
      return [block];
    const text = stripHarnessMarkup(block.text);
    return text ? [{ ...block, text }] : [];
  });
  return blocks.length > 0 ? blocks : void 0;
}

// dist/src/metadata.js
function runTypeOf(options) {
  if (options.toolName)
    return "tool";
  if (options.agentType === "subagent" || options.agentType === "compaction")
    return "subagent";
  return options.modelName === void 0 ? "root" : "llm";
}
function codingAgentMetadata(options) {
  const { sessionId, ...rest } = options;
  return {
    ...rest,
    runType: runTypeOf(options),
    integration: LS_INTEGRATION,
    integrationVersion: LS_INTEGRATION_VERSION,
    threadId: sessionId
  };
}
function skillNameFromTool(toolName, toolInput) {
  if (toolName !== "Skill")
    return void 0;
  const skill = toolInput?.skill;
  return typeof skill === "string" ? skill.trim().replace(SKILL_NAME_LEADING_SLASH, "") || void 0 : void 0;
}

// dist/src/repo-attribution.js
import { dirname as dirname22, join as join32 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/attribution.js
import { isAbsolute as isAbsolute5 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/paths.js
import { statSync as statSync10 } from "node:fs";
import { dirname as dirname18 } from "node:path";
function nearestExistingDirectory(path3) {
  let current = path3;
  for (; ; ) {
    const parent = dirname18(current);
    const reachedFilesystemRoot = parent === current;
    if (reachedFilesystemRoot)
      return void 0;
    try {
      if (statSync10(current).isDirectory())
        return current;
    } catch {
    }
    current = parent;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/github-login.js
import { mkdirSync as mkdirSync12, readFileSync as readFileSync15, renameSync as renameSync9, writeFileSync as writeFileSync6 } from "node:fs";
import { dirname as dirname19 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/constants.js
var GIT_LOCATION_ENV_KEYS = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_COMMON_DIR",
  "GIT_INDEX_FILE",
  "GIT_CEILING_DIRECTORIES"
];
var NOT_A_REPOSITORY = /not a git repository \(or any of the parent directories\)/i;
var REMOTE_PATH_EDGE_SLASHES = /^\/+|\/+$/g;
var REMOTE_PATH_TRAILING_SLASHES = /\/+$/;
var REMOTE_GIT_SUFFIX = /\.git$/;
var REMOTE_LINE_WHITESPACE = /\s+/;
var SCP_REMOTE_PATTERN = /^(?:[^@]+@)?([^:]+):\/?(.+)$/;
var GIT_DIRECTORY_NAME = ".git";
var GIT_FILE_POINTER = /^gitdir:\s*(.+?)\s*$/m;
var GIT_MARKERS = {
  REPOSITORY_ROOT: "repository root",
  ONLY_GIT_CAN_SAY: "only git can say",
  NOTHING_HERE: "nothing here"
};
var GIT_PROVIDERS = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
  "dev.azure.com": "devAzure"
};
var SELF_HOSTED_PROVIDER_HINTS = ["github", "gitlab", "bitbucket"];
var PROVIDER_HOSTS = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
  devAzure: "dev.azure.com"
};
var GIT_COMMAND_TIMEOUT_MS = 5e3;
var GH_LOGIN_COMMAND = "gh";
var GIT_COMMAND = "git";
var GIT_COMMAND_MISSING = "is not installed in an absolute PATH folder";
var GH_LOGIN_ARGUMENTS = ["api", "user", "--jq", ".login"];
var GH_LOGIN_TIMEOUT_MS = 5e3;
var GH_LOGIN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
var GH_LOGIN_NULL_OUTPUT = "null";
var GH_LOGIN_RETRY_AFTER_MS = 24 * 60 * 60 * 1e3;

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/repository.js
import { execFileSync as execFileSync2 } from "node:child_process";
import { resolve as resolve14 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/desktop/launch.js
import { accessSync, constants as constants2, statSync as statSync11 } from "node:fs";
import { join as join29, posix, win32 } from "node:path";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/desktop/desktop-constants.js
var DESKTOP_WINDOWS_EXTENSIONS = ".EXE;.CMD;.BAT";
var DESKTOP_WINDOWS_SEPARATOR = ";";
var DESKTOP_PATH_SEPARATOR = ":";
var DESKTOP_PATH_VARIABLES = ["PATH", "Path"];
var DESKTOP_EXTENSIONS_VARIABLE = "PATHEXT";

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/utils/desktop/launch.js
function findExecutable(name, env, platform) {
  const windows = platform === WINDOWS_PLATFORM;
  const extensions = windows ? (env[DESKTOP_EXTENSIONS_VARIABLE] ?? DESKTOP_WINDOWS_EXTENSIONS).split(DESKTOP_WINDOWS_SEPARATOR) : [""];
  const path3 = DESKTOP_PATH_VARIABLES.map((variable) => env[variable]).find((value) => value !== void 0);
  const folders = (path3 ?? "").split(windows ? DESKTOP_WINDOWS_SEPARATOR : DESKTOP_PATH_SEPARATOR);
  const absolute = windows ? win32.isAbsolute : posix.isAbsolute;
  for (const folder of folders.filter((entry) => entry !== "" && absolute(entry))) {
    for (const extension of extensions) {
      const candidate = join29(folder, `${name}${extension}`);
      try {
        accessSync(candidate, constants2.X_OK);
        if (statSync11(candidate).isFile())
          return candidate;
      } catch {
      }
    }
  }
  return void 0;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/repository.js
function parseRepoName(remoteUrl) {
  const value = remoteUrl.trim();
  try {
    const url = new URL(value);
    const name = url.pathname.replace(REMOTE_PATH_EDGE_SLASHES, "").replace(REMOTE_GIT_SUFFIX, "");
    const repository = repositoryOnHost(url.hostname, name);
    if (repository)
      return repository;
  } catch {
  }
  const scpMatch = value.match(SCP_REMOTE_PATTERN);
  if (scpMatch) {
    const host = scpMatch[1];
    const path3 = scpMatch[2];
    if (host && path3) {
      const name = path3.replace(REMOTE_PATH_TRAILING_SLASHES, "").replace(REMOTE_GIT_SUFFIX, "");
      return repositoryOnHost(host, name);
    }
  }
  return void 0;
}
function repositoryOnHost(hostname, name) {
  const host = hostname.toLowerCase();
  if (!name)
    return void 0;
  const provider2 = GIT_PROVIDERS[host];
  if (provider2)
    return { provider: provider2, name };
  if (!host.includes("."))
    return void 0;
  const hinted = SELF_HOSTED_PROVIDER_HINTS.find((hint) => host.includes(hint));
  return { provider: hinted ?? host, name, host };
}
function gitOutput(args, cwd) {
  const env = { ...process.env, LC_ALL: "C", LANG: "C" };
  for (const key of GIT_LOCATION_ENV_KEYS)
    delete env[key];
  return execFileSync2(installedCommand(GIT_COMMAND), args, {
    cwd,
    env,
    encoding: "utf-8",
    timeout: GIT_COMMAND_TIMEOUT_MS,
    stdio: ["ignore", "pipe", "pipe"]
  });
}
function getRepoName(cwd) {
  try {
    const output = gitOutput(["remote", "-v"], cwd);
    const lines = output.trim().split("\n").filter(Boolean);
    const remotes = [];
    for (const line of lines) {
      const parts = line.split(REMOTE_LINE_WHITESPACE);
      const name = parts[0];
      const url = parts[1];
      if (name && url && line.includes("(fetch)"))
        remotes.push({ name, url });
    }
    const origin = remotes.find((remote) => remote.name === "origin");
    if (origin) {
      const name = parseRepoName(origin.url);
      if (name)
        return name;
    }
    for (const remote of remotes) {
      const name = parseRepoName(remote.url);
      if (name)
        return name;
    }
  } catch {
  }
  return void 0;
}
function getRepoUrl(provider2, name) {
  const host = PROVIDER_HOSTS[provider2];
  return host ? `https://${host}/${name}` : void 0;
}
function getRepoRoot(cwd) {
  try {
    const root = gitOutput(["rev-parse", "--show-toplevel"], cwd).trim();
    return root ? resolve14(root) : void 0;
  } catch (error2) {
    const stderr = String(error2?.stderr ?? "");
    return NOT_A_REPOSITORY.test(stderr) ? null : void 0;
  }
}
function getGitUserName(cwd, options) {
  try {
    const name = gitOutput(["config", "user.name"], cwd).trim();
    if (name)
      return name;
  } catch {
  }
  return options?.githubLogin?.();
}
function getGitInfo(cwd) {
  const result = {};
  try {
    const branch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"], cwd).trim();
    if (branch && branch !== "HEAD")
      result.branch = branch;
  } catch {
  }
  try {
    const commit = gitOutput(["rev-parse", "HEAD"], cwd).trim();
    if (commit)
      result.commit = commit;
  } catch {
  }
  return result;
}
function getRepositoryMetadata(cwd) {
  const metadata = {};
  const repoName = getRepoName(cwd);
  if (repoName) {
    metadata[GIT_METADATA_KEYS.repository] = repoName.name;
    metadata[GIT_METADATA_KEYS.provider] = repoName.provider;
    const url = repoName.host ? `https://${repoName.host}/${repoName.name}` : getRepoUrl(repoName.provider, repoName.name);
    if (url)
      metadata[GIT_METADATA_KEYS.repositoryUrl] = url;
  }
  const gitInfo = getGitInfo(cwd);
  if (gitInfo.branch)
    metadata[GIT_METADATA_KEYS.branch] = gitInfo.branch;
  if (gitInfo.commit)
    metadata[GIT_METADATA_KEYS.commit] = gitInfo.commit;
  return withBothGitMetadataNames(metadata);
}
function githubLoginLookup() {
  return execFileSync2(installedCommand(GH_LOGIN_COMMAND), GH_LOGIN_ARGUMENTS, {
    encoding: "utf-8",
    timeout: GH_LOGIN_TIMEOUT_MS,
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
}
function isGitHubLogin(printed) {
  return printed !== GH_LOGIN_NULL_OUTPUT && GH_LOGIN_PATTERN.test(printed);
}
function installedCommand(name) {
  const found = findExecutable(name, process.env, process.platform);
  if (found === void 0)
    throw new Error(`${name} ${GIT_COMMAND_MISSING}`);
  return found;
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/github-login.js
function createGitHubLoginFallback(options) {
  const now = options.now ?? Date.now;
  const retryAfterMs = options.retryAfterMs ?? GH_LOGIN_RETRY_AFTER_MS;
  let alreadyTried = false;
  let login;
  function failedRecently() {
    try {
      const marker = JSON.parse(readFileSync15(options.markerPath, "utf-8"));
      const failed = new Date(marker.failed).getTime();
      const since = now() - failed;
      return since >= 0 && since < retryAfterMs;
    } catch {
      return false;
    }
  }
  function recordFailure() {
    try {
      mkdirSync12(dirname19(options.markerPath), { recursive: true });
      const partial = `${options.markerPath}.${process.pid}`;
      const marker = { failed: new Date(now()).toISOString() };
      writeFileSync6(partial, JSON.stringify(marker));
      renameSync9(partial, options.markerPath);
    } catch {
    }
  }
  return () => {
    if (alreadyTried)
      return login;
    alreadyTried = true;
    if (failedRecently())
      return void 0;
    try {
      const printed = githubLoginLookup();
      if (isGitHubLogin(printed))
        login = printed;
    } catch {
    }
    if (login === void 0)
      recordFailure();
    return login;
  };
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/paths.js
import { readFileSync as readFileSync16, statSync as statSync12 } from "node:fs";
import { dirname as dirname20, join as join30, resolve as resolve15 } from "node:path";
function gitMarkerAt(directory) {
  const marker = join30(directory, GIT_DIRECTORY_NAME);
  try {
    if (statSync12(marker).isDirectory())
      return GIT_MARKERS.REPOSITORY_ROOT;
  } catch {
    return GIT_MARKERS.NOTHING_HERE;
  }
  return pointsAtGitDirectory(directory, marker) ? GIT_MARKERS.REPOSITORY_ROOT : GIT_MARKERS.ONLY_GIT_CAN_SAY;
}
function pointsAtGitDirectory(directory, marker) {
  try {
    const pointer = readFileSync16(marker, "utf-8").match(GIT_FILE_POINTER)?.[1];
    return pointer !== void 0 && statSync12(resolve15(directory, pointer)).isDirectory();
  } catch {
    return false;
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
    const parent = dirname20(current);
    const reachedFilesystemRoot = parent === current;
    if (reachedFilesystemRoot)
      return null;
    current = parent;
  }
}

// node_modules/.pnpm/@langchain+plugins-base@htt_ba8faf2bb6059991f57529dcc9a49c51/node_modules/@langchain/plugins-base/dist/git/attribution.js
function createRepositoryAttributor(options) {
  const rootByDirectory = /* @__PURE__ */ new Map();
  const attributionByRoot = /* @__PURE__ */ new Map();
  const identifierByRoot = /* @__PURE__ */ new Map();
  const githubLogin = createGitHubLoginFallback({ markerPath: options.githubLoginMarkerPath });
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
  function identifierForRoot(root) {
    const cached = identifierByRoot.get(root);
    if (cached)
      return cached;
    const userName = getGitUserName(root, { githubLogin });
    const identifier = userName ? { ls_attribution_identifier: userName } : {};
    identifierByRoot.set(root, identifier);
    return identifier;
  }
  function attributionForRoot(root) {
    const cached = attributionByRoot.get(root);
    if (cached)
      return cached;
    const attribution = {
      ...identifierForRoot(root),
      ...getRepositoryMetadata(root)
    };
    attributionByRoot.set(root, attribution);
    return attribution;
  }
  function scopedToPath(base, origin, pinned) {
    const namedSomewhereNothingSits = origin.namedAPath && !origin.path;
    if (namedSomewhereNothingSits)
      return base;
    const path3 = origin.path ?? origin.cwd;
    if (!path3 || !isAbsolute5(path3))
      return base;
    const root = rootForPath(path3);
    const gitCouldNotAnswer = root === void 0;
    if (gitCouldNotAnswer)
      return base;
    const pathIsInNoRepository = root === null;
    if (pathIsInNoRepository)
      return withoutRepositoryKeys(base, pinned);
    if (isSessionsOwnRepository(origin.cwd, root)) {
      return { ...base, ...withoutPinnedKeys(identifierForRoot(root), pinned) };
    }
    return {
      ...withoutRepositoryKeys(base, pinned),
      ...withoutPinnedKeys(attributionForRoot(root), pinned)
    };
  }
  function withSessionRepository(base, sessionCwd) {
    const sessionRoot = sessionCwd ? rootForPath(sessionCwd) : void 0;
    if (typeof sessionRoot !== "string")
      return base;
    return { ...attributionForRoot(sessionRoot), ...base };
  }
  function toolMetadata(base, origin) {
    const pinned = new Set(REPOSITORY_METADATA_KEYS.filter((key) => base?.[key] !== void 0));
    return scopedToPath(withSessionRepository(base, origin.cwd), origin, pinned);
  }
  function turnMetadata(base, cwd, toolOrigins) {
    const sessionCwd = cwd ? { cwd } : {};
    const sessionRoot = cwd ? rootForPath(cwd) : void 0;
    if (typeof sessionRoot === "string") {
      return toolMetadata(base, { ...sessionCwd, namedAPath: false });
    }
    for (const { path: path3, namedAPath } of toolOrigins) {
      if (!path3)
        continue;
      const landedInRepository = typeof rootForPath(path3) === "string";
      if (landedInRepository)
        return toolMetadata(base, { path: path3, namedAPath, ...sessionCwd });
    }
    return base;
  }
  return { toolMetadata, turnMetadata };
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

// dist/src/config.js
import { readFileSync as readFileSync17 } from "node:fs";
import { homedir as homedir3, userInfo as userInfo2 } from "node:os";
import { join as join31 } from "node:path";
function readAnthropicUserId() {
  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (!homeDir)
    return void 0;
  const configPath = join31(homeDir, ".claude.json");
  try {
    const raw = readFileSync17(configPath, "utf-8");
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
  return userInfo2().username;
}
function pinnedRepositoryKeys(metadata) {
  return metadata?.[PINNED_REPOSITORY_KEYS] ?? NO_PINNED_KEYS;
}
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
function envCooldown() {
  const env = process.env.CC_LANGSMITH_NOTICE_COOLDOWN?.trim().toLowerCase();
  if (!env)
    return void 0;
  if (env === NOTICE_COOLDOWN_OFF)
    return NOTICE_COOLDOWN_OFF;
  const minutes = Number(env);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : void 0;
}
function resolveStateFilePath() {
  return process.env.STATE_FILE ?? join31(homedir3(), ...STATE_FILE_DEFAULT);
}
function loadConfig(options) {
  const cwd = options?.cwd ?? process.cwd();
  const homeDir = homedir3();
  const stateFilePath = resolveStateFilePath();
  const debug2 = (process.env.CC_LANGSMITH_DEBUG ?? "").toLowerCase() === "true";
  let replicas;
  const providedReplicas = process.env.CC_LANGSMITH_RUNS_ENDPOINTS;
  if (providedReplicas !== void 0) {
    try {
      replicas = JSON.parse(providedReplicas);
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
  const files = readCommonConfigFiles({ cwd, home: homeDir, harnessDirectory: HARNESS_DIRECTORY });
  const common = mergeCommonConfig({
    harness: files.harness.common,
    root: files.root.common,
    user: files.user.common,
    userRoot: files.userRoot.common,
    env: {
      enabled: envBoolean("enabled"),
      defaultMuted: envBoolean("defaultMuted"),
      strict_auth: envBoolean("strict_auth"),
      capture_hook_outputs: envBoolean("capture_hook_outputs"),
      notice_cooldown: envCooldown(),
      api_key: process.env.CC_LANGSMITH_API_KEY,
      api_url: process.env.LANGSMITH_ENDPOINT,
      project: process.env.CC_LANGSMITH_PROJECT,
      metadata: customMetadata,
      redact: process.env.CC_LANGSMITH_REDACT === void 0 ? void 0 : redact,
      redact_extra_rules: redactExtraRules
    },
    defaults: { api_key: "", api_url: "https://api.smith.langchain.com", project: "claude-code" }
  }, { envFirst: true });
  if (replicas === void 0 || common.locked.includes("replicas")) {
    replicas = toSdkReplicas(common.replicas);
  }
  redactExtraRules = common.redact_extra_rules;
  const credential = resolveUploadCredential({
    apiKey: common.api_key,
    apiUrl: common.api_url,
    apiUrlIsDefault: common.defaulted.includes("api_url"),
    profile: common.profile,
    workspaceId: common.workspace_id,
    agentId: common.agent_id
  });
  const unreachable = credential.kind === "login" ? loginReplicaRefusal(uploadReplicas(replicas), credential.apiUrl) : void 0;
  customMetadata = common.metadata && withBothGitMetadataNames(common.metadata);
  const anthropicUserId = readAnthropicUserId();
  const localUsername = readLocalUsername();
  const identityMetadata = { local_username: localUsername };
  if (anthropicUserId) {
    identityMetadata.user_id = anthropicUserId;
    identityMetadata.anthropic_user_id = anthropicUserId;
  }
  const pinned = REPOSITORY_METADATA_KEYS.filter((key) => customMetadata?.[key] !== void 0);
  customMetadata = { cwd, ...identityMetadata, ...customMetadata };
  Object.defineProperty(customMetadata, PINNED_REPOSITORY_KEYS, { value: new Set(pinned) });
  return {
    enabled: common.enabled,
    defaultMuted: common.defaultMuted,
    apiKey: credential.kind === "api-key" && sdkSetting(common.api_key) === void 0 ? credential.apiKey : common.api_key,
    project: common.project,
    apiBaseUrl: credential.kind === "login" ? credential.apiUrl : common.api_url,
    stateFilePath,
    debug: debug2,
    parentDottedOrder,
    replicas,
    customMetadata,
    redact: common.redact,
    redactExtraRules,
    ...common.managedConfigProblem === void 0 ? {} : { managedConfigProblem: common.managedConfigProblem },
    ...credential.kind === "login" ? { login: credential.login } : {},
    ...common.profile === void 0 ? {} : { profile: common.profile },
    ...common.agent_id === void 0 ? {} : { agentId: common.agent_id },
    ...credential.kind === "none" ? { credentialProblem: credential.reason } : {},
    ...unreachable ? { credentialProblem: unreachable } : {},
    ...common.strict_auth ? { strictAuth: true } : {},
    ...common.capture_hook_outputs ? { captureHookOutputs: true } : {},
    ...common.notice_cooldown === void 0 ? {} : { noticeCooldown: common.notice_cooldown },
    ...common.locked.includes("project") ? { projectLocked: true } : {},
    ...common.locked.includes("defaultMuted") && common.defaultMuted ? { mutedLocked: true } : {}
  };
}

// dist/src/repo-attribution-paths.js
import { existsSync as existsSync7 } from "node:fs";
import { dirname as dirname21, isAbsolute as isAbsolute6, resolve as resolve16 } from "node:path";
function gitCommandFolder(command) {
  if (typeof command !== "string")
    return void 0;
  return GIT_DIR_COMMAND.exec(command)?.[1]?.replace(SURROUNDING_QUOTES, "");
}
function globFolder(input, toolName) {
  const { pattern, path: path3 } = input;
  if (toolName !== "Glob" || typeof pattern !== "string" || !isAbsolute6(pattern))
    return void 0;
  if (path3 !== void 0)
    return void 0;
  const folder = dirname21(`${pattern.split(GLOB_CHARACTER)[0]}_`);
  return existsSync7(folder) ? folder : void 0;
}
function toolPathFromInput(toolInput, sessionCwd, toolName) {
  if (!toolInput || typeof toolInput !== "object" || Array.isArray(toolInput)) {
    return { namedAPath: false };
  }
  const named = toolInput;
  const folder = gitCommandFolder(named.command) || globFolder(named, toolName);
  const input = folder ? { ...named, path: folder } : named;
  let namedAPath = false;
  for (const key of TOOL_PATH_INPUT_KEYS) {
    const value = input[key];
    if (typeof value !== "string" || value.length === 0)
      continue;
    namedAPath = true;
    if (isAbsolute6(value))
      return { path: value, namedAPath };
    if (!sessionCwd || !isAbsolute6(sessionCwd))
      continue;
    const resolved = resolve16(sessionCwd, value);
    if (existsSync7(resolved))
      return { path: resolved, namedAPath };
  }
  return { namedAPath };
}

// dist/src/repo-attribution.js
var attributor;
function repositoryAttributor() {
  attributor ??= createRepositoryAttributor({
    githubLoginMarkerPath: join32(dirname22(resolveStateFilePath()), GH_LOGIN_MARKER_FILE)
  });
  return attributor;
}
function withoutUnpinnedRepositoryKeys(base) {
  const pinned = pinnedRepositoryKeys(base);
  const stripped = { ...base };
  for (const key of REPOSITORY_METADATA_KEYS) {
    if (!pinned.has(key))
      delete stripped[key];
  }
  return stripped;
}
function withPinsOf(base, scoped) {
  if (scoped && base) {
    Object.defineProperty(scoped, PINNED_REPOSITORY_KEYS, { value: pinnedRepositoryKeys(base) });
  }
  return scoped;
}
function toolOrigin(toolInput, sessionCwd, toolName) {
  return { cwd: sessionCwd, ...toolPathFromInput(toolInput, sessionCwd, toolName) };
}
function repoScopedMetadata(base, toolInput, sessionCwd, toolName) {
  return repositoryAttributor().toolMetadata(withoutUnpinnedRepositoryKeys(base), toolOrigin(toolInput, sessionCwd, toolName));
}
function originScopedMetadata(base, toolOrigins, sessionCwd) {
  return withPinsOf(base, repositoryAttributor().turnMetadata(base, sessionCwd, toolOrigins));
}
function clearRepoAttributionCache() {
  attributor = void 0;
}

// dist/src/hooks/stop.js
import { randomUUID as randomUUID11 } from "node:crypto";

// dist/src/utils/replicas.js
function hasOwnApiKey(replica) {
  return !Array.isArray(replica) && sdkSetting(replica.apiKey) !== void 0;
}
function hasUsableDestination(config) {
  return !config.credentialProblem || Boolean(config.replicas?.some(hasOwnApiKey));
}

// dist/src/utils/hook-init.js
function initHook(cwd) {
  const config = loadConfig({ cwd });
  initLogger(config.debug);
  if (!config.enabled) {
    return null;
  }
  if (!hasUsableDestination(config)) {
    error(config.credentialProblem);
    return null;
  }
  return config;
}
function expandHome(path3) {
  return path3?.replace(/^~/, process.env.HOME ?? "");
}

// dist/src/utils/stdin.js
function readStdin() {
  return new Promise((resolve17, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => {
      try {
        resolve17(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Failed to parse hook input: ${err}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

// dist/src/closing-queue.js
import { randomUUID as randomUUID10 } from "node:crypto";

// dist/src/hooks/stop.js
import { setTimeout as delay5 } from "node:timers/promises";

// dist/src/utils/ids/run-id.js
import { createHash as createHash9 } from "node:crypto";
function stableRunId(time, ...identity) {
  const stamp = new Date(time).getTime().toString(16).padStart(12, "0");
  const hash = createHash9("sha256").update(JSON.stringify(identity)).digest("hex");
  const variant = (8 + Number.parseInt(hash[3], 16) % 4).toString(16);
  return `${stamp.slice(0, 8)}-${stamp.slice(8)}-7${hash.slice(0, 3)}-${variant}${hash.slice(4, 7)}-${hash.slice(7, 19)}`;
}

// dist/src/legacy-import.js
import { createHmac } from "node:crypto";
import { basename as basename6, dirname as dirname23, join as join33 } from "node:path";

// dist/src/legacy-sweep.js
import { join as join34, dirname as dirname24 } from "node:path";

// dist/src/langsmith.js
function generateDottedOrderSegment(time, runId) {
  const iso2 = typeof time === "string" ? time : new Date(time).toISOString();
  const isoWithMicroseconds = `${iso2.slice(0, -1)}000Z`;
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
  return blocks.flatMap((block) => {
    switch (block.type) {
      case "text":
        return block.text ? [{ type: "text", text: block.text }] : [];
      case "thinking":
        return { type: "thinking", thinking: block.thinking };
      case "tool_use":
      case "server_tool_use":
        return { type: "tool_call", name: block.name, args: block.input, id: block.id };
      default:
        return block;
    }
  });
}
function assistantMessages(blocks) {
  const messages = [];
  let content = [];
  for (const block of formatContent(blocks)) {
    if (!SERVER_TOOL_RESULT_TYPE.test(String(block.type))) {
      content.push(block);
      continue;
    }
    if (content.length > 0)
      messages.push({ role: "assistant", content });
    content = [];
    const text = JSON.stringify(block.content);
    messages.push({ role: "tool", tool_call_id: block.tool_use_id, content: textBlocks(text) });
  }
  if (content.length > 0)
    messages.push({ role: "assistant", content });
  return messages;
}
function textBlocks(content) {
  return typeof content === "string" ? [{ type: "text", text: content }] : content;
}
function toolResultBlocks(content) {
  if (content === void 0 || typeof content === "string")
    return textBlocks(content ?? "");
  return content.map((block) => {
    if (block.type === "tool_reference")
      return { type: "text", text: String(block.tool_name) };
    if (block.type !== "search_result")
      return block;
    const texts = textBlocks(block.content).map((part) => part.text);
    return { type: "text", text: [block.title, block.source, ...texts].join("\n") };
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

// dist/src/tracing-commands.js
import { homedir as homedir4 } from "node:os";

// dist/src/thread-link.js
function lookupOptions(apiUrl, onDenied) {
  return {
    apiUrl,
    timeout_ms: LOOKUP_TIMEOUT_MS,
    fetchImplementation: async (...request) => {
      const response = await fetch(...request);
      if (response.status === LOOKUP_FORBIDDEN_STATUS)
        onDenied();
      return response;
    },
    callerOptions: {
      // The SDK ignores maxRetries on reads. Throwing here is what stops the retries.
      onFailedResponseHook: async () => {
        throw new Error("Thread link lookup failed");
      }
    }
  };
}
function keyClient(apiKey, apiUrl, onDenied, workspaceId) {
  const fallback = sdkSetting(process.env[WORKSPACE_ID_VARIABLE]) ?? "";
  return new Client({
    ...lookupOptions(apiUrl, onDenied),
    apiKey,
    workspaceId: workspaceId ?? fallback
  });
}
function loginClient(login, apiUrl, onDenied, workspaceId) {
  return new Client({
    ...lookupOptions(apiUrl, onDenied),
    profile: login.profile,
    profileConfigPath: login.configPath,
    preferProfileAuth: true,
    workspaceId: workspaceId ?? login.workspaceId
  });
}
async function describeThreadLinks(config, sessionId) {
  if (!config.enabled) {
    return config.managedConfigProblem ?? "LangSmith tracing is disabled. Enable it and send a prompt first.";
  }
  const destinations = config.replicas?.length ? config.replicas : [{}];
  const results = await Promise.all(destinations.map(async (replica) => {
    const destination = Array.isArray(replica) ? { projectName: replica[0] } : replica;
    const projectName = destination.projectName ?? config.project;
    const apiKey = destination.apiKey ?? config.apiKey;
    const keyed = sdkSetting(apiKey) !== void 0;
    const missingKey = {
      resolved: false,
      line: `${projectName}: No LangSmith API key configured for this destination.`
    };
    const otherServer = destination.apiUrl !== void 0 && refusedLoginReplicas([{ apiUrl: destination.apiUrl }], config.apiBaseUrl) !== void 0;
    if (!keyed && (otherServer || !config.login))
      return missingKey;
    let denied = false;
    const onDenied = () => {
      denied = true;
    };
    try {
      const apiUrl = destination.apiUrl ?? config.apiBaseUrl;
      const client = keyed ? keyClient(apiKey, apiUrl, onDenied, destination.workspaceId) : loginClient(config.login, apiUrl, onDenied, destination.workspaceId);
      if (keyed && !client.apiKey)
        return missingKey;
      const agentId = destination.projectName === void 0 ? config.agentId : void 0;
      const project = await client.readProject(agentId === void 0 ? { projectName } : {
        projectId: (await client.sessions.resolve({
          kind: AGENT_ADDRESS_KIND,
          id: agentId,
          environment: AGENT_ADDRESS_ENVIRONMENT
        })).session_id
      });
      const url = new URL(client.getHostUrl());
      const path3 = ["o", project.tenant_id, "projects", "p", project.id, "t", sessionId];
      url.pathname = `${url.pathname.replace(/\/$/, "")}/${path3.map(encodeURIComponent).join("/")}`;
      return { resolved: true, line: `${projectName}: ${url.href}` };
    } catch {
      if (denied) {
        return { resolved: false, line: `${projectName}: ${NO_PROJECT_ACCESS_REPLY}` };
      }
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

// dist/src/tracing-commands.js
function signInState(config) {
  if (config.managedConfigProblem) {
    return { signIn: "none", credentialProblem: config.managedConfigProblem };
  }
  if (!hasUsableDestination(config)) {
    return { signIn: "none", credentialProblem: config.credentialProblem };
  }
  const { loginNotice, credentialNotice } = readUploadNotices(config);
  return {
    signIn: config.login ? "login" : "api-key",
    credentialProblem: loginNotice ?? credentialNotice
  };
}
function uploadCredential(config) {
  const apiKey = sdkSetting(config.apiKey);
  if (config.login)
    return { kind: "login", login: config.login, apiUrl: config.apiBaseUrl };
  if (apiKey !== void 0)
    return { kind: "api-key", apiKey, apiUrl: config.apiBaseUrl };
  return { kind: "none", reason: config.credentialProblem ?? "" };
}
function destinationState(config) {
  if (!hasUsableDestination(config))
    return {};
  try {
    return {
      replicaCount: uploadingReplicaCount(uploadReplicas(config.replicas), uploadCredential(config))
    };
  } catch (error2) {
    return { credentialProblem: error2 instanceof Error ? error2.message : String(error2) };
  }
}
function setupState(input) {
  const config = loadConfig({ cwd: input.cwd });
  const destination = destinationState(config);
  const signIn = signInState(config);
  return {
    enabled: config.enabled,
    project: config.project,
    ...config.agentId === void 0 ? {} : { agentId: config.agentId },
    apiUrl: config.apiBaseUrl,
    replicaCount: destination.replicaCount,
    muted: resolveTurnTracingMode(config, input.session_id) === "metadata",
    signIn: signIn.signIn,
    credentialProblem: signIn.credentialProblem ?? destination.credentialProblem
  };
}
function setUpTracing(argumentText, input) {
  return applySetup(argumentText, {
    home: homedir4(),
    harnessDirectory: HARNESS_DIRECTORY,
    readState: () => setupState(input)
  });
}
async function replyWithThreadLinks(_argumentText, input) {
  try {
    return await describeThreadLinks(loadConfig({ cwd: input.cwd }), input.session_id);
  } catch {
    return TRACE_FAILED.replace("{sessionId}", () => input.session_id);
  }
}
async function saveThreadMode(input, mode) {
  const replies = THREAD_MODE_REPLIES[mode];
  try {
    const config = loadConfig({ cwd: input.cwd });
    if (mode === "full" && config.mutedLocked)
      return MUTE_LOCKED_REPLY;
    const result = await setThreadTracingMode(config.stateFilePath, input.session_id, mode);
    let reply = replies.saved;
    if (result?.warning)
      reply += ` Warning: ${result.warning}.`;
    if (config.managedConfigProblem) {
      reply += ` ${config.managedConfigProblem}`;
    } else if (!config.enabled) {
      reply += MASTER_DISABLED_NOTE;
    } else if (!hasUsableDestination(config)) {
      reply += NO_CREDENTIALS_NOTE;
    }
    return reply;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return MUTE_FAILED.replace("{verb}", () => replies.verb).replace("{error}", () => message);
  }
}
var COMMAND_HANDLERS = {
  setup: setUpTracing,
  trace: replyWithThreadLinks,
  mute: (_argumentText, input) => saveThreadMode(input, "metadata"),
  unmute: (_argumentText, input) => saveThreadMode(input, "full")
};

// dist/src/hooks/user-prompt-submit.js
async function answerPrompt(beginTurn) {
  const input = await readStdin();
  if (!isPayloadForHook(input, "UserPromptSubmit"))
    return;
  const command = matchPromptCommand(input.prompt, TRACING_COMMANDS);
  const currentTurnMode = command ? threadModeBeforeCommand(input) : void 0;
  const reply = command ? await runPromptCommand(command, COMMAND_HANDLERS, input) : void 0;
  const output = {};
  try {
    await beginTurn(input, output, currentTurnMode);
  } catch (err) {
    error(TURN_START_FAILED.replace("{error}", () => String(err)));
  }
  const response = reply === void 0 ? output : promptCommandResponse(reply, {
    systemMessages: output.systemMessage === void 0 ? [] : [output.systemMessage],
    blockReason: output.reason
  });
  if (Object.keys(response).length === 0)
    return;
  try {
    console.log(JSON.stringify(response));
  } catch (err) {
    error(RESPONSE_WRITE_FAILED.replace("{error}", () => String(err)));
  }
}
function threadModeBeforeCommand(input) {
  try {
    return resolveTurnTracingMode(loadConfig({ cwd: input.cwd }), input.session_id);
  } catch {
    return void 0;
  }
}
async function promptTracingConfig(input, output) {
  const config = initHook(input.cwd);
  if (!config) {
    const setup = loadConfig({ cwd: input.cwd });
    if (setup.enabled && setup.credentialProblem && setup.strictAuth && !setup.managedConfigProblem) {
      Object.assign(output, { decision: "block", reason: setup.credentialProblem });
      return;
    }
    if (setup.managedConfigProblem)
      await showNotice(NOTICE_KINDS.managed, setup.managedConfigProblem, setup, output);
    else if (setup.enabled)
      await showNotice(NOTICE_KINDS.credential, setup.credentialProblem, setup, output);
    return;
  }
  debug(`UserPromptSubmit hook started, session=${input.session_id}`);
  if (input.agent_id) {
    debug("Skipping UserPromptSubmit for subagent \u2014 Stop hook handles tracing");
    return;
  }
  const { loginNotice, credentialNotice } = readUploadNotices(config);
  if (loginNotice && config.strictAuth) {
    Object.assign(output, { decision: "block", reason: loginNotice });
    return;
  }
  if (!await showNotice(LOGIN_NOTICE_KIND, loginNotice, config, output)) {
    await showNotice(NOTICE_KINDS.credential, credentialNotice, config, output);
  }
  return config;
}
async function showNotice(kind, notice, config, output) {
  const options = {
    plugin: LS_INTEGRATION,
    kind,
    cooldown: config.noticeCooldown,
    storageRoot: engineStorageRoot(config.stateFilePath)
  };
  if (!notice || !await shouldShowNotice(options))
    return false;
  output.systemMessage = notice;
  return true;
}

// dist/src/tracer-builder/tracer-builder.js
import { basename as basename8 } from "node:path";

// dist/src/utils/times.js
var iso = (time) => new Date(time).toISOString();
var later = (a, b) => a === void 0 || b !== void 0 && Date.parse(b) > Date.parse(a) ? b : a;
var earlier = (a, b) => Date.parse(b) < Date.parse(a) ? b : a;

// dist/src/tracer-builder/subagent-files.js
import { closeSync as closeSync9, fstatSync as fstatSync6, openSync as openSync9, readFileSync as readFileSync18, readSync as readSync5 } from "node:fs";
import { basename as basename7, dirname as dirname25, join as join35 } from "node:path";

// dist/src/tracer-builder/tracer-builder-constants.js
var BUILDER_STATE_VERSION = 1;
var MAIN_THREAD = "main";
var AGENT_RUN_NAME = "Agent";
var AGENT_NATIVE_TOOL_NAME = "Task";
var AGENT_TOOL_NAMES = /* @__PURE__ */ new Set(["Agent", "Task"]);
var ASYNC_LAUNCHED_STATUS = "async_launched";
var DEFAULT_SUBAGENT_TYPE = "general-purpose";
var SUBAGENT_CHAIN_SUFFIX = " Subagent";
var NO_MESSAGE_ID = "__no_id__";
var NO_TOOL_RESULT = "No result";
var END_TURN = "end_turn";
var COMPACT_BOUNDARY_SUBTYPE = "compact_boundary";
var DEFAULT_COMPACT_TRIGGER = "auto";
var COMPACTION_RUN_NAME = (trigger) => `Context Compaction (${trigger})`;
var USER_INTERRUPT_ERROR = "User interrupt";
var TOOL_INTERRUPTED_ERROR = "Interrupted";
var SESSION_ENDED_ERROR = "Session ended before turn completed";
var SUBAGENTS_FOLDER = "subagents";
var SUBAGENT_FILE = /^agent-(.+)\.jsonl$/;
var subagentFileName = (agentId) => `agent-${agentId}.jsonl`;
var subagentMetaFileName = (agentId) => `agent-${agentId}.meta.json`;
var TRANSCRIPT_EXTENSION = ".jsonl";
var TAIL_READ_BYTES = 65536;
var TRACING_MODE_STRICTNESS = ["full", "metadata", "off"];
var HOOK_EVENTS = {
  userPromptSubmit: "UserPromptSubmit",
  preToolUse: "PreToolUse",
  stop: "Stop",
  stopFailure: "StopFailure",
  subagentStop: "SubagentStop",
  preCompact: "PreCompact",
  sessionEnd: "SessionEnd"
};

// dist/src/tracer-builder/subagent-files.js
function subagentTranscriptPath(mainPath, sessionId, agentId) {
  return join35(dirname25(mainPath), sessionId, SUBAGENTS_FOLDER, subagentFileName(agentId));
}
function subagentIdOf(path3) {
  return SUBAGENT_FILE.exec(basename7(path3))?.[1];
}
function topLevelUuid(line) {
  try {
    const uuid = JSON.parse(line).uuid;
    return typeof uuid === "string" ? uuid : void 0;
  } catch {
    return void 0;
  }
}
function lastLineUuid(path3) {
  let fd;
  try {
    fd = openSync9(path3, "r");
    const size = fstatSync6(fd).size;
    for (let tail = TAIL_READ_BYTES; ; tail *= 2) {
      const start = Math.max(0, size - tail);
      const buffer = Buffer.alloc(size - start);
      readSync5(fd, buffer, 0, buffer.length, start);
      const lines = buffer.toString("utf8").split("\n").slice(start === 0 ? 0 : 1);
      const uuid = lines.reverse().map(topLevelUuid).find((id) => id !== void 0);
      if (uuid !== void 0 || start === 0)
        return uuid;
    }
  } catch {
    return void 0;
  } finally {
    if (fd !== void 0)
      closeSync9(fd);
  }
}
function metaToolUseId(mainPath, sessionId, agentId) {
  const path3 = join35(dirname25(mainPath), sessionId, SUBAGENTS_FOLDER, subagentMetaFileName(agentId));
  try {
    const meta = JSON.parse(readFileSync18(path3, "utf8"));
    return typeof meta.toolUseId === "string" ? meta.toolUseId : void 0;
  } catch {
    return void 0;
  }
}

// dist/src/tracer-builder/tracer-builder.js
function childPlace(parent, id, start) {
  const segment = generateDottedOrderSegment(start, id);
  return { id, traceId: parent.traceId, dottedOrder: `${parent.dottedOrder}.${segment}` };
}
function outsideParent(dottedOrder) {
  if (dottedOrder === void 0)
    return void 0;
  const { traceId, runId } = parseDottedOrder(dottedOrder);
  return { id: runId, traceId, dottedOrder };
}
function stricterMode(mode, other = mode) {
  const rank = (candidate) => TRACING_MODE_STRICTNESS.indexOf(candidate);
  return rank(other) > rank(mode) ? other : mode;
}
function rootPlace(id, start) {
  return { id, traceId: id, dottedOrder: generateDottedOrderSegment(start, id) };
}
function isMainTranscript(path3, sessionId) {
  return basename8(path3) === `${sessionId}${TRANSCRIPT_EXTENSION}`;
}
function blocksOf(line, type) {
  const content = line.message?.content;
  return Array.isArray(content) ? content.filter((block) => block?.type === type) : [];
}
function textOf(content) {
  if (typeof content === "string")
    return content;
  if (!Array.isArray(content))
    return "";
  return content.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n");
}
function freshThread(mode, agentType) {
  return { mode, agentType, llmIndex: 0, endTurnSeen: false, pendingInputs: [], lastText: "" };
}
function freshState() {
  return {
    version: BUILDER_STATE_VERSION,
    sessionMode: "full",
    turnCount: 0,
    turns: {},
    threads: { [MAIN_THREAD]: freshThread("full", "root") },
    tools: {},
    hookTimes: {}
  };
}
function restoredState(saved) {
  const candidate = saved;
  return candidate?.version === BUILDER_STATE_VERSION ? candidate : freshState();
}
var createTranscriptBuilder = ({ sessionId, savedState, sink }) => {
  const state = restoredState(savedState);
  const main = () => state.threads[MAIN_THREAD];
  const metadata = (options) => codingAgentMetadata({
    sessionId,
    runtimeVersion: state.runtimeVersion,
    ...options,
    base: { ...state.baseMetadata, ...options.base }
  });
  function runIdentity(run) {
    return {
      id: run.id,
      name: run.name,
      run_type: run.runType,
      trace_id: run.traceId,
      dotted_order: run.dottedOrder,
      ...run.parentId === void 0 ? {} : { parent_run_id: run.parentId },
      tracingMode: run.mode
    };
  }
  function postRun(run, content) {
    sink.post({
      ...runIdentity(run),
      start_time: run.start,
      ...run.end === void 0 ? {} : { end_time: run.end },
      ...content,
      metadata: run.metadata
    });
  }
  function patchRun(run, end, content) {
    sink.patch({
      ...runIdentity(run),
      end_time: later(run.start, end),
      ...content,
      metadata: content.metadata ?? run.metadata
    });
  }
  function openRun(place, parent, fields) {
    return { ...place, ...fields, ...parent === void 0 ? {} : { parentId: parent.id } };
  }
  function openTurn(time) {
    const pendingPrompt = state.pendingPrompt;
    const start = state.pendingStart;
    const turnNumber = ++state.turnCount;
    const promptId = pendingPrompt?.promptId;
    const lineTime = pendingPrompt?.time ?? time;
    if (start && pendingPrompt)
      state.hookClockOffset = Date.parse(start.time) - Date.parse(lineTime);
    const startTime = start?.time ?? iso(Date.parse(lineTime) + (state.hookClockOffset ?? 0));
    const id = start ? stableRunId(startTime, sessionId, turnNumber) : stableRunId(startTime, sessionId, promptId, turnNumber);
    const notifiedTool = pendingPrompt?.notificationOf ? state.tools[pendingPrompt.notificationOf] : void 0;
    const parent = notifiedTool?.run ?? outsideParent(start?.parentDottedOrder);
    const place = parent ? childPlace(parent, id, startTime) : rootPlace(id, startTime);
    const mode = stricterMode(start?.mode ?? state.sessionMode, notifiedTool?.run?.mode);
    const approvalPolicy = start?.approvalPolicy ?? pendingPrompt?.approvalPolicy;
    const content = pendingPrompt?.content;
    const run = openRun(place, parent, {
      name: USER_PROMPT_TURN_NAME,
      runType: "chain",
      start: startTime,
      mode,
      metadata: metadata({ turnNumber, approvalPolicy, agentType: "root" })
    });
    const userContent = content === void 0 ? void 0 : textBlocks(stripContentMarkup(content) ?? content);
    const messages = userContent ? [{ role: "user", content: userContent }] : [];
    postRun(run, { inputs: { messages } });
    state.turns[id] = {
      run,
      promptId,
      turnNumber,
      approvalPolicy,
      typedSkill: content === void 0 ? void 0 : typedSkillName(content),
      stopped: false,
      toolOrigins: []
    };
    if (notifiedTool?.launch)
      notifiedTool.launch.notificationTurn = id;
    state.currentTurn = id;
    state.lastTurnPlace = place;
    state.pendingStart = void 0;
    state.pendingPrompt = void 0;
    state.hookTimes = {};
    clearRepoAttributionCache();
    state.threads[MAIN_THREAD] = {
      ...freshThread(mode, "root"),
      parent: place,
      ownerId: id,
      promptId,
      turnNumber,
      pendingInputs: [...messages, ...main().pendingInputs],
      lastTime: startTime
    };
  }
  function stopTurn(turnId, outcome) {
    const turn = state.turns[turnId];
    if (turn === void 0)
      return;
    if (state.currentTurn === turnId) {
      finishCall(MAIN_THREAD);
      turn.text = outcome.text ?? main().lastText;
      turn.run.end = later(turn.run.end, main().lastTime);
      state.currentTurn = void 0;
    }
    turn.stopped = true;
    turn.error = outcome.error;
    for (const tool of Object.values(state.tools)) {
      if (tool.turnId !== turnId || tool.launch)
        continue;
      const end = tool.result?.time ?? turn.run.end ?? turn.run.start;
      closeToolNow(tool, {
        output: NO_TOOL_RESULT,
        end,
        error: outcome.error && TOOL_INTERRUPTED_ERROR
      });
    }
    maybeCloseTurn(turnId);
  }
  function maybeCloseTurn(turnId) {
    const turn = turnId === void 0 ? void 0 : state.turns[turnId];
    if (turn === void 0 || !turn.stopped)
      return;
    if (Object.values(state.tools).some((tool) => tool.turnId === turnId))
      return;
    delete state.turns[turnId];
    const messages = turn.text ? [{ role: "assistant", content: turn.text }] : [];
    patchRun(turn.run, turn.run.end ?? turn.run.start, {
      outputs: { messages },
      ...turn.error ? { error: turn.error } : {},
      metadata: metadata({
        base: turn.gitMetadata,
        turnId: turn.promptId,
        turnNumber: turn.turnNumber,
        approvalPolicy: turn.approvalPolicy,
        agentType: "root"
      })
    });
    const notified = Object.values(state.tools).find((tool) => tool.launch?.notificationTurn === turnId);
    if (notified?.launch) {
      notified.launch.notified = true;
      notified.run.end = later(notified.run.end, turn.run.end);
      maybeCloseAgentTool(notified);
    }
  }
  function readAssistant(threadKey, line, time) {
    const thread = state.threads[threadKey];
    const messageId = line.message?.id ?? NO_MESSAGE_ID;
    if (thread.call && thread.call.messageId !== messageId)
      finishCall(threadKey);
    const content = Array.isArray(line.message?.content) ? line.message.content : [];
    thread.call ??= {
      messageId,
      index: thread.llmIndex++,
      start: time,
      end: time,
      content: [],
      model: stripModelDateSuffix(line.message?.model ?? ""),
      usage: line.message?.usage ?? { input_tokens: 0, output_tokens: 0 },
      inputs: thread.pendingInputs
    };
    thread.pendingInputs = [];
    const call = thread.call;
    call.end = time;
    call.content.push(...content);
    if (line.message?.usage)
      call.usage = line.message.usage;
    call.effort ??= line.effort;
    if (line.message?.stop_reason === END_TURN)
      thread.endTurnSeen = true;
    const text = textOf(content);
    if (text)
      thread.lastText = text;
    for (const use of content.filter((block) => block.type === "tool_use")) {
      const toolUseId = use.id;
      const tool = {
        toolUseId,
        toolName: use.name,
        thread: threadKey,
        turnId: threadKey === MAIN_THREAD ? state.currentTurn : void 0,
        input: use.input,
        cwd: line.cwd,
        callMessageId: messageId
      };
      state.tools[toolUseId] = tool;
      if (tool.turnId)
        state.turns[tool.turnId]?.toolOrigins.push(toolOrigin(tool.input, state.cwd));
      const hook = threadKey === MAIN_THREAD ? state.hookTimes[toolUseId] : void 0;
      if (hook)
        applyHookTime(tool, hook.time, hook.mode);
    }
  }
  function finishCall(threadKey) {
    const thread = state.threads[threadKey];
    const call = thread?.call;
    if (call === void 0 || thread.parent === void 0)
      return;
    thread.call = void 0;
    const id = stableRunId(call.start, thread.ownerId, thread.promptId, call.index);
    const merged = mergeAdjacentTextBlocks(call.content);
    const hasTools = merged.some((block) => block.type === "tool_use");
    const usage = buildUsageMetadata(call.usage);
    const typedSkill = threadKey === MAIN_THREAD && call.index === 0 && call.inputs.length > 1 ? state.turns[thread.ownerId]?.typedSkill : void 0;
    const run = openRun(childPlace(thread.parent, id, call.start), thread.parent, {
      name: ASSISTANT_RUN_NAME,
      runType: "llm",
      start: call.start,
      mode: thread.mode,
      metadata: metadata({
        turnId: thread.promptId,
        turnNumber: thread.turnNumber,
        agentType: thread.agentType,
        modelName: call.model,
        skillName: typedSkill,
        usageMetadata: usage,
        runSpecific: {
          ls_provider: resolveProvider(call.model),
          ls_model_name: call.model,
          ls_invocation_params: {
            model: call.model,
            ...call.effort ? { effort: call.effort } : {},
            ...call.usage.service_tier ? { service_tier: call.usage.service_tier } : {}
          },
          usage_metadata: usage
        }
      })
    });
    run.end = hasTools ? later(call.end, call.toolEnd) ?? call.end : call.end;
    postRun(run, {
      inputs: { messages: call.inputs },
      outputs: { messages: assistantMessages(merged) }
    });
    for (const tool of Object.values(state.tools)) {
      if (tool.thread !== threadKey || tool.callMessageId !== call.messageId || tool.run)
        continue;
      tool.callEnd = call.end;
      if (tool.result)
        postTool(tool, earlier(call.end, tool.result.time));
      else if (threadKey !== MAIN_THREAD)
        postTool(tool, call.end);
    }
  }
  function toolParent(tool) {
    if (tool.thread !== MAIN_THREAD)
      return state.threads[tool.thread]?.parent;
    return tool.turnId === void 0 ? void 0 : state.turns[tool.turnId]?.run;
  }
  function toolMode(tool) {
    if (tool.thread !== MAIN_THREAD)
      return state.threads[tool.thread]?.mode ?? state.sessionMode;
    const turnMode = state.turns[tool.turnId ?? ""]?.run.mode ?? state.sessionMode;
    return turnMode === "full" ? tool.hookMode ?? turnMode : turnMode;
  }
  function applyHookTime(tool, time, mode) {
    delete state.hookTimes[tool.toolUseId];
    if (tool.run)
      return;
    tool.hookMode = mode;
    postTool(tool, time);
  }
  function postTool(tool, start) {
    const parent = toolParent(tool);
    if (parent === void 0)
      return;
    const thread = state.threads[tool.thread];
    const id = stableRunId(start, sessionId, tool.toolUseId);
    const isAgent = AGENT_TOOL_NAMES.has(tool.toolName);
    const name = isAgent ? AGENT_RUN_NAME : tool.toolName;
    tool.run = openRun(childPlace(parent, id, start), parent, {
      name,
      runType: "tool",
      start: iso(start),
      mode: toolMode(tool),
      metadata: metadata({
        base: repoScopedMetadata(state.baseMetadata, tool.input, tool.cwd ?? state.cwd, tool.toolName),
        turnId: thread?.promptId,
        turnNumber: thread?.turnNumber,
        agentType: thread?.agentType ?? "root",
        toolName: isAgent ? AGENT_NATIVE_TOOL_NAME : tool.toolName,
        runName: name,
        skillName: skillNameFromTool(tool.toolName, tool.input)
      })
    });
    postRun(tool.run, { inputs: { input: tool.input } });
    if (!isAgent)
      tool.input = void 0;
    if (tool.result)
      finishTool(tool, tool.result);
  }
  function readToolResult(threadKey, line, block, time) {
    const thread = state.threads[threadKey];
    thread.pendingInputs.push({
      role: "tool",
      tool_call_id: block.tool_use_id,
      content: toolResultBlocks(block.content)
    });
    const tool = state.tools[block.tool_use_id];
    if (tool === void 0)
      return;
    const result = {
      time,
      output: line.toolUseResult ?? block.content,
      ...block.is_error ? { error: textOf(block.content) || TOOL_INTERRUPTED_ERROR } : {},
      agentId: typeof line.toolUseResult?.agentId === "string" ? line.toolUseResult.agentId : void 0,
      agentType: typeof line.toolUseResult?.agentType === "string" ? line.toolUseResult.agentType : void 0,
      launched: line.toolUseResult?.status === ASYNC_LAUNCHED_STATUS
    };
    const call = state.threads[tool.thread]?.call;
    if (call?.messageId === tool.callMessageId)
      call.toolEnd = later(call.toolEnd, time);
    if (tool.run)
      finishTool(tool, result);
    else if (tool.callEnd !== void 0) {
      tool.result = result;
      postTool(tool, earlier(tool.callEnd, time));
    } else
      tool.result = result;
  }
  function finishTool(tool, result) {
    tool.result = void 0;
    if (result.agentId && AGENT_TOOL_NAMES.has(tool.toolName)) {
      linkAgent(tool, result.agentId, result.agentType);
      if (result.launched) {
        tool.launch = {
          agentId: result.agentId,
          output: result.output,
          chainClosed: false,
          notified: false
        };
        tool.run.end = result.time;
        if (!state.threads[result.agentId])
          tool.launch.chainClosed = true;
        maybeCloseAgentTool(tool);
        return;
      }
    }
    closeToolNow(tool, { output: result.output, error: result.error, end: result.time });
  }
  function closeToolNow(tool, outcome) {
    if (tool.agentId && !tool.launch)
      finishAgent(tool.agentId);
    if (!tool.run)
      postTool(tool, tool.callEnd ?? outcome.end);
    delete state.tools[tool.toolUseId];
    if (!tool.run)
      return;
    patchRun(tool.run, outcome.end, {
      outputs: { output: outcome.output },
      ...outcome.error ? { error: outcome.error } : {},
      ...AGENT_TOOL_NAMES.has(tool.toolName) ? { metadata: agentToolMetadata(tool) } : {}
    });
    const turn = state.turns[tool.turnId ?? ""];
    if (turn)
      turn.run.end = later(turn.run.end, outcome.end);
    maybeCloseTurn(tool.turnId);
  }
  function agentToolMetadata(tool) {
    return {
      ...tool.run.metadata,
      runSpecific: { agent_type: tool.subagentType ?? AGENT_RUN_NAME, agent_id: tool.agentId }
    };
  }
  function linkAgent(tool, agentId, agentType) {
    if (state.threads[agentId] || tool.agentId || !tool.run)
      return;
    const subagentType = agentType ?? tool.input?.subagent_type ?? DEFAULT_SUBAGENT_TYPE;
    const id = stableRunId(tool.run.start, tool.run.id, agentId);
    const parentThread = state.threads[tool.thread];
    const chain = openRun(childPlace(tool.run, id, tool.run.start), tool.run, {
      name: `${subagentType}${SUBAGENT_CHAIN_SUFFIX}`,
      runType: "chain",
      start: tool.run.start,
      mode: tool.run.mode,
      metadata: metadata({
        turnId: parentThread?.promptId,
        turnNumber: parentThread?.turnNumber,
        agentType: "subagent",
        subagentId: agentId,
        subagentType
      })
    });
    postRun(chain, { inputs: tool.input ?? {} });
    tool.agentId = agentId;
    tool.subagentType = subagentType;
    state.threads[agentId] = {
      ...freshThread(tool.run.mode, "subagent"),
      parent: chain,
      ownerId: id,
      chain,
      toolUseId: tool.toolUseId,
      turnNumber: 0,
      lastTime: tool.run.start
    };
  }
  function linkFromMeta(agentId) {
    if (state.threads[agentId] || state.mainPath === void 0)
      return;
    const toolUseId = metaToolUseId(state.mainPath, sessionId, agentId);
    const tool = toolUseId === void 0 ? void 0 : state.tools[toolUseId];
    if (tool && AGENT_TOOL_NAMES.has(tool.toolName))
      linkAgent(tool, agentId, void 0);
  }
  function finishAgent(agentId) {
    const thread = state.threads[agentId];
    if (thread === void 0 || state.mainPath === void 0)
      return;
    const last = lastLineUuid(subagentTranscriptPath(state.mainPath, sessionId, agentId));
    if (last === void 0 || last === thread.lastLineId)
      closeSubagent(agentId);
    else
      thread.closeAtLineId = last;
  }
  function closeSubagent(agentId) {
    const thread = state.threads[agentId];
    if (thread?.chain === void 0)
      return;
    finishCall(agentId);
    const end = thread.lastTime ?? thread.chain.start;
    for (const tool2 of Object.values(state.tools)) {
      if (tool2.thread !== agentId)
        continue;
      tool2.launch = void 0;
      closeToolNow(tool2, {
        output: NO_TOOL_RESULT,
        end: tool2.result?.time ?? end,
        error: TOOL_INTERRUPTED_ERROR
      });
    }
    delete state.threads[agentId];
    patchRun(thread.chain, end, { outputs: { output: thread.lastText } });
    const tool = state.tools[thread.toolUseId ?? ""];
    if (tool?.launch) {
      tool.launch.chainClosed = true;
      tool.run.end = later(tool.run.end, end);
      maybeCloseAgentTool(tool);
    }
  }
  function maybeCloseAgentTool(tool) {
    const launch = tool.launch;
    if (!launch.chainClosed || !launch.notified)
      return;
    closeToolNow(tool, { output: launch.output, end: tool.run.end ?? tool.run.start });
  }
  function notificationTarget(content) {
    const text = textOf(content);
    return Object.values(state.tools).find((tool) => tool.launch && (text.includes(tool.launch.agentId) || text.includes(tool.toolUseId)));
  }
  function startsNewTurn(thread, line, hasTurn) {
    if (!hasTurn)
      return true;
    const sameTurn = line.promptId !== void 0 && line.promptId === thread.promptId;
    const inserted = isInsertedMessage(line) && !thread.endTurnSeen;
    return !sameTurn && !inserted;
  }
  function readMainHuman(line, time) {
    const thread = main();
    const pending = state.pendingPrompt;
    const promptId = state.currentTurn ? thread.promptId : pending?.promptId;
    const hasTurn = state.currentTurn !== void 0 || pending !== void 0;
    const target = notificationTarget(line.message?.content);
    const endTurnSeen = state.currentTurn ? thread.endTurnSeen : false;
    if (!startsNewTurn({ ...thread, promptId, endTurnSeen }, line, hasTurn)) {
      thread.pendingInputs.push({ role: "user", content: line.message?.content });
      if (target?.launch) {
        target.launch.notified = true;
        finishAgent(target.launch.agentId);
        maybeCloseAgentTool(target);
      }
      return;
    }
    if (state.currentTurn) {
      stopTurn(state.currentTurn, { error: thread.endTurnSeen ? void 0 : USER_INTERRUPT_ERROR });
    }
    thread.pendingInputs = [];
    state.pendingPrompt = {
      time,
      promptId: line.promptId,
      content: line.message?.content,
      approvalPolicy: line.permissionMode,
      ...target ? { notificationOf: target.toolUseId } : {}
    };
    if (target?.launch)
      finishAgent(target.launch.agentId);
    if (state.pendingStart)
      openTurn(time);
  }
  function readThreadHuman(threadKey, line) {
    const thread = state.threads[threadKey];
    const message = { role: "user", content: line.message?.content };
    if (!startsNewTurn(thread, line, thread.prompted === true)) {
      thread.pendingInputs.push(message);
      return;
    }
    finishCall(threadKey);
    const content = line.message?.content;
    thread.promptId = line.promptId;
    thread.prompted = true;
    thread.turnNumber = (thread.turnNumber ?? 0) + 1;
    thread.llmIndex = 0;
    thread.endTurnSeen = false;
    thread.pendingInputs = [
      { role: "user", content: textBlocks(stripContentMarkup(content) ?? content) }
    ];
  }
  function readCompaction(line, time) {
    if (line.subtype === COMPACT_BOUNDARY_SUBTYPE) {
      flushCompaction(void 0);
      state.compaction = {
        start: state.preCompact?.time ?? time,
        end: time,
        trigger: line.compactMetadata?.trigger ?? DEFAULT_COMPACT_TRIGGER,
        mode: state.preCompact?.mode
      };
      state.preCompact = void 0;
      return true;
    }
    flushCompaction(line.isCompactSummary ? textOf(line.message?.content) : void 0);
    return false;
  }
  function flushCompaction(summary) {
    const compaction = state.compaction;
    if (compaction === void 0)
      return;
    state.compaction = void 0;
    const turn = state.turns[state.currentTurn ?? ""];
    const parent = turn?.run ?? state.lastTurnPlace;
    if (parent === void 0)
      return;
    const id = stableRunId(compaction.start, sessionId, compaction.trigger);
    const run = openRun(childPlace(parent, id, compaction.start), parent, {
      name: COMPACTION_RUN_NAME(compaction.trigger),
      runType: "chain",
      start: compaction.start,
      mode: compaction.mode ?? turn?.run.mode ?? state.sessionMode,
      metadata: metadata({
        turnNumber: turn?.turnNumber,
        agentType: "compaction",
        runSpecific: { trigger: compaction.trigger }
      })
    });
    run.end = compaction.end;
    postRun(run, { inputs: {}, outputs: { compact_summary: summary } });
  }
  function readMainLine(line, time) {
    if (typeof line.cwd === "string")
      state.cwd = line.cwd;
    if (readCompaction(line, time))
      return;
    if (line.isSidechain)
      return;
    if (line.type === "assistant") {
      if (state.currentTurn === void 0)
        openTurn(time);
      readAssistant(MAIN_THREAD, line, time);
    } else if (line.type === "user")
      readUserLine(MAIN_THREAD, line, time);
    main().lastTime = later(main().lastTime, time);
  }
  function readSubagentLine(agentId, line, time) {
    const thread = state.threads[agentId];
    thread.lastTime = later(thread.lastTime, time);
    const launchCopy = blocksOf(line, line.type === "assistant" ? "tool_use" : "tool_result").some((block) => (block.id ?? block.tool_use_id) === thread.toolUseId);
    if (launchCopy)
      return;
    if (line.type === "assistant") {
      if (thread.turnNumber === 0)
        thread.turnNumber = 1;
      readAssistant(agentId, line, time);
    } else if (line.type === "user")
      readUserLine(agentId, line, time);
  }
  function readUserLine(threadKey, line, time) {
    if (!isHumanMessage(line)) {
      for (const block of blocksOf(line, "tool_result"))
        readToolResult(threadKey, line, block, time);
    } else if (threadKey === MAIN_THREAD)
      readMainHuman(line, time);
    else
      readThreadHuman(threadKey, line);
  }
  function readLine(transcriptPath, transcriptLine) {
    const line = transcriptLine;
    if (typeof line.version === "string" && line.version)
      state.runtimeVersion = line.version;
    if (state.mainPath === void 0 && isMainTranscript(transcriptPath, sessionId))
      state.mainPath = transcriptPath;
    const time = line.timestamp;
    if (typeof time === "string")
      state.lastTime = later(state.lastTime, time);
    if (transcriptPath === state.mainPath) {
      if (typeof time === "string")
        readMainLine(line, time);
      return;
    }
    const agentId = subagentIdOf(transcriptPath);
    const thread = agentId === void 0 ? void 0 : state.threads[agentId];
    if (thread === void 0)
      return;
    if (typeof time === "string")
      readSubagentLine(agentId, line, time);
    if (line.uuid !== void 0)
      thread.lastLineId = line.uuid;
    if (thread.closeAtLineId !== void 0 && thread.closeAtLineId === line.uuid)
      closeSubagent(agentId);
  }
  function endSession() {
    flushCompaction(void 0);
    for (const agentId of Object.keys(state.threads)) {
      if (agentId !== MAIN_THREAD)
        closeSubagent(agentId);
    }
    if (state.currentTurn)
      stopTurn(state.currentTurn, { error: SESSION_ENDED_ERROR });
    for (const tool of Object.values(state.tools)) {
      const end = tool.run?.end ?? state.lastTime ?? tool.run?.start ?? "";
      if (tool.launch)
        closeToolNow(tool, { output: tool.launch.output, end });
    }
    for (const [turnId, turn] of Object.entries(state.turns)) {
      turn.stopped = true;
      maybeCloseTurn(turnId);
    }
  }
  function receiveNote(note) {
    const details = note.details ?? {};
    const time = details.time === void 0 ? void 0 : iso(details.time);
    if (details.metadata)
      state.baseMetadata = details.metadata;
    if (details.cwd)
      state.cwd = details.cwd;
    if (state.mainPath === void 0 && note.transcriptPath && !note.agentId)
      state.mainPath = note.transcriptPath;
    const toolUseId = details.toolUseId;
    switch (note.event) {
      case HOOK_EVENTS.userPromptSubmit:
        if (note.agentId)
          return;
        state.sessionMode = note.tracingMode ?? state.sessionMode;
        state.pendingStart = {
          time: time ?? state.lastTime ?? iso(Date.now()),
          mode: state.sessionMode,
          approvalPolicy: details.permissionMode,
          parentDottedOrder: details.parentDottedOrder
        };
        return;
      case HOOK_EVENTS.preToolUse:
        if (note.agentId || toolUseId === void 0 || details.time === void 0)
          return;
        if (state.tools[toolUseId])
          applyHookTime(state.tools[toolUseId], details.time, note.tracingMode);
        else
          state.hookTimes[toolUseId] = { time: details.time, mode: note.tracingMode };
        return;
      case HOOK_EVENTS.stop: {
        const turn = state.turns[state.currentTurn ?? ""];
        if (note.agentId || turn === void 0)
          return;
        clearRepoAttributionCache();
        turn.gitMetadata = originScopedMetadata(state.baseMetadata, turn.toolOrigins, state.cwd);
        stopTurn(state.currentTurn, { text: details.lastAssistantMessage });
        return;
      }
      case HOOK_EVENTS.stopFailure: {
        if (note.agentId || state.currentTurn === void 0)
          return;
        const error2 = details.errorDetails ? `${details.error}: ${details.errorDetails}` : details.error;
        stopTurn(state.currentTurn, { error: error2 });
        return;
      }
      case HOOK_EVENTS.subagentStop:
        if (note.agentId === void 0)
          return;
        linkFromMeta(note.agentId);
        finishAgent(note.agentId);
        return;
      case HOOK_EVENTS.preCompact:
        state.preCompact = {
          time: time ?? state.lastTime ?? iso(Date.now()),
          mode: note.tracingMode
        };
        return;
      case HOOK_EVENTS.sessionEnd:
        endSession();
        return;
    }
  }
  function transcripts() {
    const mainPath = state.mainPath;
    if (mainPath === void 0)
      return [];
    const agents = Object.keys(state.threads).filter((key) => key !== MAIN_THREAD);
    return [
      mainPath,
      ...agents.map((agentId) => subagentTranscriptPath(mainPath, sessionId, agentId))
    ];
  }
  return {
    lineId: (line) => typeof line.uuid === "string" ? line.uuid : void 0,
    readLine,
    receiveNote,
    transcripts,
    state: () => state
  };
};

// dist/src/tracer-hooks/legacy-sessions.js
import { existsSync as existsSync8, readdirSync as readdirSync4 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { join as join36 } from "node:path";

// dist/src/tracer-hooks/tracer-hooks-constants.js
var CLAUDE_PROJECTS_PATH = [".claude", "projects"];

// dist/src/tracer-hooks/legacy-sessions.js
function projectFolders() {
  const projects = join36(homedir5(), ...CLAUDE_PROJECTS_PATH);
  try {
    return readdirSync4(projects).map((folder) => join36(projects, folder));
  } catch {
    return [];
  }
}
function readLegacySessions(stateFile) {
  const folders = projectFolders();
  return Object.entries(loadState(stateFile)).flatMap(([sessionId, session]) => {
    const transcriptPath = folders.map((folder) => join36(folder, `${sessionId}${TRANSCRIPT_EXTENSION}`)).find((path3) => existsSync8(path3));
    if (transcriptPath === void 0)
      return [];
    return [
      {
        sessionId,
        transcriptPath,
        updatedAt: Date.parse(session.updated),
        tracingMode: session.current_turn_tracing
      }
    ];
  });
}

// dist/src/tracer-hooks/tracer-hooks.js
async function sendTracerNote(event, input, config, tracingMode = resolveTurnTracingMode(config, input.session_id)) {
  const paths = tracerPaths(dirname26(config.stateFilePath));
  let launch;
  sendHookNote({
    integration: LS_INTEGRATION,
    event,
    sessionId: input.session_id,
    ...input.transcript_path ? { transcriptPath: expandHome(input.transcript_path) } : {},
    ...input.agent_id ? { agentId: input.agent_id } : {},
    tracingMode,
    details: {
      time: Date.now(),
      cwd: input.cwd,
      toolUseId: input.tool_use_id,
      permissionMode: input.permission_mode,
      lastAssistantMessage: input.last_assistant_message,
      error: input.error,
      errorDetails: input.error_details,
      metadata: config.customMetadata,
      parentDottedOrder: config.parentDottedOrder
    },
    writer: writerOptions(config)
  }, {
    paths,
    version: PLUGIN_VERSION,
    startWorker: () => {
      launch = launchDetachedWorker([ENGINE_WORKER_ARG, input.cwd], {
        storageRoot: paths.folder
      }).catch((err) => warn(`Could not start the tracing worker: ${err}`));
    }
  });
  await launch;
}
function noteHandler(event) {
  return async () => {
    const input = await readStdin();
    if (!isPayloadForHook(input, event))
      return;
    const config = initHook(input.cwd);
    if (config)
      await sendTracerNote(event, input, config);
  };
}
var sendPromptNote = async (input, output, currentTurnMode) => {
  const config = await promptTracingConfig(input, output);
  if (!config)
    return;
  const mode = promptTurnMode(config, input.session_id, currentTurnMode);
  await sendTracerNote("UserPromptSubmit", input, config, mode);
};
var NOTE_HANDLERS = {
  ...Object.fromEntries(HOOK_EVENT_NAMES.map((event) => [event, noteHandler(event)])),
  UserPromptSubmit: () => answerPrompt(sendPromptNote),
  Stop: () => sleep3(STOP_FLUSH_WAIT_MS).then(noteHandler("Stop"))
};
async function runTracerWorker(cwd) {
  const config = initHook(cwd);
  if (!config)
    return;
  await startTracerWorker({
    agentStateFolder: dirname26(config.stateFilePath),
    integration: LS_INTEGRATION,
    version: PLUGIN_VERSION,
    writer: writerOptions(config),
    createBuilder: createTranscriptBuilder,
    readLegacySessions
  });
}

// dist/src/hooks/dispatch.js
var EXECUTABLE_NAME = binary.target.executableName;
var USAGE = USAGE_TEMPLATE.replaceAll("{name}", EXECUTABLE_NAME);
void dispatchHookCommand(process.argv.slice(2), {
  usage: USAGE,
  version: PLUGIN_VERSION,
  hooks: NOTE_HANDLERS,
  worker: {
    command: ENGINE_WORKER_ARG,
    run: ([cwd]) => runTracerWorker(cwd ?? process.cwd())
  },
  onHookError: (name, err) => {
    try {
      initLogger(false);
      error(`${name} hook fatal error: ${err}`);
    } finally {
      process.exit(0);
    }
  },
  onUnknown: (argument) => {
    if (argument?.startsWith("-")) {
      console.error(`unknown option: ${argument}`);
      console.error(USAGE);
      process.exitCode = 1;
      return;
    }
    initLogger(false);
    error(`Unknown hook event: ${argument ?? "(none)"}`);
  }
});
