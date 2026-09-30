import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  require_Observable,
  require_observable
} from "./chunk-LDYN4VUQ.js";
import {
  require_isFunction,
  require_reportUnhandledError
} from "./chunk-AO5OQAUC.js";
import {
  __commonJS
} from "./chunk-6DU2HRTW.js";

// node_modules/rxjs/dist/cjs/internal/util/isArrayLike.js
var require_isArrayLike = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isArrayLike.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isArrayLike = void 0;
    exports.isArrayLike = (function(x) {
      return x && typeof x.length === "number" && typeof x !== "function";
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isPromise.js
var require_isPromise = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isPromise.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isPromise = void 0;
    var isFunction_1 = require_isFunction();
    function isPromise(value) {
      return isFunction_1.isFunction(value === null || value === void 0 ? void 0 : value.then);
    }
    exports.isPromise = isPromise;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isInteropObservable.js
var require_isInteropObservable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isInteropObservable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isInteropObservable = void 0;
    var observable_1 = require_observable();
    var isFunction_1 = require_isFunction();
    function isInteropObservable(input) {
      return isFunction_1.isFunction(input[observable_1.observable]);
    }
    exports.isInteropObservable = isInteropObservable;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isAsyncIterable.js
var require_isAsyncIterable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isAsyncIterable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAsyncIterable = void 0;
    var isFunction_1 = require_isFunction();
    function isAsyncIterable(obj) {
      return Symbol.asyncIterator && isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
    }
    exports.isAsyncIterable = isAsyncIterable;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/throwUnobservableError.js
var require_throwUnobservableError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/throwUnobservableError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createInvalidObservableTypeError = void 0;
    function createInvalidObservableTypeError(input) {
      return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
    }
    exports.createInvalidObservableTypeError = createInvalidObservableTypeError;
  }
});

// node_modules/rxjs/dist/cjs/internal/symbol/iterator.js
var require_iterator = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/symbol/iterator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.iterator = exports.getSymbolIterator = void 0;
    function getSymbolIterator() {
      if (typeof Symbol !== "function" || !Symbol.iterator) {
        return "@@iterator";
      }
      return Symbol.iterator;
    }
    exports.getSymbolIterator = getSymbolIterator;
    exports.iterator = getSymbolIterator();
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isIterable.js
var require_isIterable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isIterable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isIterable = void 0;
    var iterator_1 = require_iterator();
    var isFunction_1 = require_isFunction();
    function isIterable(input) {
      return isFunction_1.isFunction(input === null || input === void 0 ? void 0 : input[iterator_1.iterator]);
    }
    exports.isIterable = isIterable;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isReadableStreamLike.js
var require_isReadableStreamLike = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isReadableStreamLike.js"(exports) {
    "use strict";
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    var __await = exports && exports.__await || function(v) {
      return this instanceof __await ? (this.v = v, this) : new __await(v);
    };
    var __asyncGenerator = exports && exports.__asyncGenerator || function(thisArg, _arguments, generator) {
      if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
      var g = generator.apply(thisArg, _arguments || []), i, q = [];
      return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
      }, i;
      function verb(n) {
        if (g[n]) i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
      }
      function resume(n, v) {
        try {
          step(g[n](v));
        } catch (e) {
          settle(q[0][3], e);
        }
      }
      function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
      }
      function fulfill(value) {
        resume("next", value);
      }
      function reject(value) {
        resume("throw", value);
      }
      function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isReadableStreamLike = exports.readableStreamLikeToAsyncGenerator = void 0;
    var isFunction_1 = require_isFunction();
    function readableStreamLikeToAsyncGenerator(readableStream) {
      return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
        var reader, _a, value, done;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              reader = readableStream.getReader();
              _b.label = 1;
            case 1:
              _b.trys.push([1, , 9, 10]);
              _b.label = 2;
            case 2:
              if (false) return [3, 8];
              return [4, __await(reader.read())];
            case 3:
              _a = _b.sent(), value = _a.value, done = _a.done;
              if (!done) return [3, 5];
              return [4, __await(void 0)];
            case 4:
              return [2, _b.sent()];
            case 5:
              return [4, __await(value)];
            case 6:
              return [4, _b.sent()];
            case 7:
              _b.sent();
              return [3, 2];
            case 8:
              return [3, 10];
            case 9:
              reader.releaseLock();
              return [7];
            case 10:
              return [2];
          }
        });
      });
    }
    exports.readableStreamLikeToAsyncGenerator = readableStreamLikeToAsyncGenerator;
    function isReadableStreamLike(obj) {
      return isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
    }
    exports.isReadableStreamLike = isReadableStreamLike;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/innerFrom.js
var require_innerFrom = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/innerFrom.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    var __asyncValues = exports && exports.__asyncValues || function(o) {
      if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
      var m = o[Symbol.asyncIterator], i;
      return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
      }, i);
      function verb(n) {
        i[n] = o[n] && function(v) {
          return new Promise(function(resolve, reject) {
            v = o[n](v), settle(resolve, reject, v.done, v.value);
          });
        };
      }
      function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v2) {
          resolve({ value: v2, done: d });
        }, reject);
      }
    };
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromReadableStreamLike = exports.fromAsyncIterable = exports.fromIterable = exports.fromPromise = exports.fromArrayLike = exports.fromInteropObservable = exports.innerFrom = void 0;
    var isArrayLike_1 = require_isArrayLike();
    var isPromise_1 = require_isPromise();
    var Observable_1 = require_Observable();
    var isInteropObservable_1 = require_isInteropObservable();
    var isAsyncIterable_1 = require_isAsyncIterable();
    var throwUnobservableError_1 = require_throwUnobservableError();
    var isIterable_1 = require_isIterable();
    var isReadableStreamLike_1 = require_isReadableStreamLike();
    var isFunction_1 = require_isFunction();
    var reportUnhandledError_1 = require_reportUnhandledError();
    var observable_1 = require_observable();
    function innerFrom(input) {
      if (input instanceof Observable_1.Observable) {
        return input;
      }
      if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
          return fromInteropObservable(input);
        }
        if (isArrayLike_1.isArrayLike(input)) {
          return fromArrayLike(input);
        }
        if (isPromise_1.isPromise(input)) {
          return fromPromise(input);
        }
        if (isAsyncIterable_1.isAsyncIterable(input)) {
          return fromAsyncIterable(input);
        }
        if (isIterable_1.isIterable(input)) {
          return fromIterable(input);
        }
        if (isReadableStreamLike_1.isReadableStreamLike(input)) {
          return fromReadableStreamLike(input);
        }
      }
      throw throwUnobservableError_1.createInvalidObservableTypeError(input);
    }
    exports.innerFrom = innerFrom;
    function fromInteropObservable(obj) {
      return new Observable_1.Observable(function(subscriber) {
        var obs = obj[observable_1.observable]();
        if (isFunction_1.isFunction(obs.subscribe)) {
          return obs.subscribe(subscriber);
        }
        throw new TypeError("Provided object does not correctly implement Symbol.observable");
      });
    }
    exports.fromInteropObservable = fromInteropObservable;
    function fromArrayLike(array) {
      return new Observable_1.Observable(function(subscriber) {
        for (var i = 0; i < array.length && !subscriber.closed; i++) {
          subscriber.next(array[i]);
        }
        subscriber.complete();
      });
    }
    exports.fromArrayLike = fromArrayLike;
    function fromPromise(promise) {
      return new Observable_1.Observable(function(subscriber) {
        promise.then(function(value) {
          if (!subscriber.closed) {
            subscriber.next(value);
            subscriber.complete();
          }
        }, function(err) {
          return subscriber.error(err);
        }).then(null, reportUnhandledError_1.reportUnhandledError);
      });
    }
    exports.fromPromise = fromPromise;
    function fromIterable(iterable) {
      return new Observable_1.Observable(function(subscriber) {
        var e_1, _a;
        try {
          for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
            var value = iterable_1_1.value;
            subscriber.next(value);
            if (subscriber.closed) {
              return;
            }
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
        subscriber.complete();
      });
    }
    exports.fromIterable = fromIterable;
    function fromAsyncIterable(asyncIterable) {
      return new Observable_1.Observable(function(subscriber) {
        process(asyncIterable, subscriber).catch(function(err) {
          return subscriber.error(err);
        });
      });
    }
    exports.fromAsyncIterable = fromAsyncIterable;
    function fromReadableStreamLike(readableStream) {
      return fromAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(readableStream));
    }
    exports.fromReadableStreamLike = fromReadableStreamLike;
    function process(asyncIterable, subscriber) {
      var asyncIterable_1, asyncIterable_1_1;
      var e_2, _a;
      return __awaiter(this, void 0, void 0, function() {
        var value, e_2_1;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              _b.trys.push([0, 5, 6, 11]);
              asyncIterable_1 = __asyncValues(asyncIterable);
              _b.label = 1;
            case 1:
              return [4, asyncIterable_1.next()];
            case 2:
              if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
              value = asyncIterable_1_1.value;
              subscriber.next(value);
              if (subscriber.closed) {
                return [2];
              }
              _b.label = 3;
            case 3:
              return [3, 1];
            case 4:
              return [3, 11];
            case 5:
              e_2_1 = _b.sent();
              e_2 = { error: e_2_1 };
              return [3, 11];
            case 6:
              _b.trys.push([6, , 9, 10]);
              if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
              return [4, _a.call(asyncIterable_1)];
            case 7:
              _b.sent();
              _b.label = 8;
            case 8:
              return [3, 10];
            case 9:
              if (e_2) throw e_2.error;
              return [7];
            case 10:
              return [7];
            case 11:
              subscriber.complete();
              return [2];
          }
        });
      });
    }
  }
});

export {
  require_isArrayLike,
  require_isPromise,
  require_isInteropObservable,
  require_isAsyncIterable,
  require_throwUnobservableError,
  require_iterator,
  require_isIterable,
  require_isReadableStreamLike,
  require_innerFrom
};
//# sourceMappingURL=chunk-XG4HEUIY.js.map
