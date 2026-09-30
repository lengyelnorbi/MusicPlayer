import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  __commonJS
} from "./chunk-6DU2HRTW.js";

// node_modules/rxjs/dist/cjs/internal/util/createErrorClass.js
var require_createErrorClass = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/createErrorClass.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createErrorClass = void 0;
    function createErrorClass(createImpl) {
      var _super = function(instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
      };
      var ctorFunc = createImpl(_super);
      ctorFunc.prototype = Object.create(Error.prototype);
      ctorFunc.prototype.constructor = ctorFunc;
      return ctorFunc;
    }
    exports.createErrorClass = createErrorClass;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/UnsubscriptionError.js
var require_UnsubscriptionError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/UnsubscriptionError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnsubscriptionError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports.UnsubscriptionError = createErrorClass_1.createErrorClass(function(_super) {
      return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
          return i + 1 + ") " + err.toString();
        }).join("\n  ") : "";
        this.name = "UnsubscriptionError";
        this.errors = errors;
      };
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isFunction.js
var require_isFunction = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isFunction.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isFunction = void 0;
    function isFunction(value) {
      return typeof value === "function";
    }
    exports.isFunction = isFunction;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/arrRemove.js
var require_arrRemove = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/arrRemove.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.arrRemove = void 0;
    function arrRemove(arr, item) {
      if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
      }
    }
    exports.arrRemove = arrRemove;
  }
});

// node_modules/rxjs/dist/cjs/internal/Subscription.js
var require_Subscription = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Subscription.js"(exports) {
    "use strict";
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
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isSubscription = exports.EMPTY_SUBSCRIPTION = exports.Subscription = void 0;
    var isFunction_1 = require_isFunction();
    var UnsubscriptionError_1 = require_UnsubscriptionError();
    var arrRemove_1 = require_arrRemove();
    var Subscription = (function() {
      function Subscription2(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
      }
      Subscription2.prototype.unsubscribe = function() {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
          this.closed = true;
          var _parentage = this._parentage;
          if (_parentage) {
            this._parentage = null;
            if (Array.isArray(_parentage)) {
              try {
                for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                  var parent_1 = _parentage_1_1.value;
                  parent_1.remove(this);
                }
              } catch (e_1_1) {
                e_1 = { error: e_1_1 };
              } finally {
                try {
                  if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                } finally {
                  if (e_1) throw e_1.error;
                }
              }
            } else {
              _parentage.remove(this);
            }
          }
          var initialFinalizer = this.initialTeardown;
          if (isFunction_1.isFunction(initialFinalizer)) {
            try {
              initialFinalizer();
            } catch (e) {
              errors = e instanceof UnsubscriptionError_1.UnsubscriptionError ? e.errors : [e];
            }
          }
          var _finalizers = this._finalizers;
          if (_finalizers) {
            this._finalizers = null;
            try {
              for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                var finalizer = _finalizers_1_1.value;
                try {
                  execFinalizer(finalizer);
                } catch (err) {
                  errors = errors !== null && errors !== void 0 ? errors : [];
                  if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                    errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                  } else {
                    errors.push(err);
                  }
                }
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
              } finally {
                if (e_2) throw e_2.error;
              }
            }
          }
          if (errors) {
            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
          }
        }
      };
      Subscription2.prototype.add = function(teardown) {
        var _a;
        if (teardown && teardown !== this) {
          if (this.closed) {
            execFinalizer(teardown);
          } else {
            if (teardown instanceof Subscription2) {
              if (teardown.closed || teardown._hasParent(this)) {
                return;
              }
              teardown._addParent(this);
            }
            (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
          }
        }
      };
      Subscription2.prototype._hasParent = function(parent) {
        var _parentage = this._parentage;
        return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
      };
      Subscription2.prototype._addParent = function(parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
      };
      Subscription2.prototype._removeParent = function(parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
          this._parentage = null;
        } else if (Array.isArray(_parentage)) {
          arrRemove_1.arrRemove(_parentage, parent);
        }
      };
      Subscription2.prototype.remove = function(teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove_1.arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription2) {
          teardown._removeParent(this);
        }
      };
      Subscription2.EMPTY = (function() {
        var empty = new Subscription2();
        empty.closed = true;
        return empty;
      })();
      return Subscription2;
    })();
    exports.Subscription = Subscription;
    exports.EMPTY_SUBSCRIPTION = Subscription.EMPTY;
    function isSubscription(value) {
      return value instanceof Subscription || value && "closed" in value && isFunction_1.isFunction(value.remove) && isFunction_1.isFunction(value.add) && isFunction_1.isFunction(value.unsubscribe);
    }
    exports.isSubscription = isSubscription;
    function execFinalizer(finalizer) {
      if (isFunction_1.isFunction(finalizer)) {
        finalizer();
      } else {
        finalizer.unsubscribe();
      }
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/config.js
var require_config = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.config = void 0;
    exports.config = {
      onUnhandledError: null,
      onStoppedNotification: null,
      Promise: void 0,
      useDeprecatedSynchronousErrorHandling: false,
      useDeprecatedNextContext: false
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/util/noop.js
var require_noop = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/noop.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.noop = void 0;
    function noop() {
    }
    exports.noop = noop;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/timeoutProvider.js
var require_timeoutProvider = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/timeoutProvider.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timeoutProvider = void 0;
    exports.timeoutProvider = {
      setTimeout: function(handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
          args[_i - 2] = arguments[_i];
        }
        var delegate = exports.timeoutProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
          return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
      },
      clearTimeout: function(handle) {
        var delegate = exports.timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
      },
      delegate: void 0
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/util/reportUnhandledError.js
var require_reportUnhandledError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/reportUnhandledError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportUnhandledError = void 0;
    var config_1 = require_config();
    var timeoutProvider_1 = require_timeoutProvider();
    function reportUnhandledError(err) {
      timeoutProvider_1.timeoutProvider.setTimeout(function() {
        var onUnhandledError = config_1.config.onUnhandledError;
        if (onUnhandledError) {
          onUnhandledError(err);
        } else {
          throw err;
        }
      });
    }
    exports.reportUnhandledError = reportUnhandledError;
  }
});

// node_modules/rxjs/dist/cjs/internal/NotificationFactories.js
var require_NotificationFactories = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/NotificationFactories.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createNotification = exports.nextNotification = exports.errorNotification = exports.COMPLETE_NOTIFICATION = void 0;
    exports.COMPLETE_NOTIFICATION = (function() {
      return createNotification("C", void 0, void 0);
    })();
    function errorNotification(error) {
      return createNotification("E", void 0, error);
    }
    exports.errorNotification = errorNotification;
    function nextNotification(value) {
      return createNotification("N", value, void 0);
    }
    exports.nextNotification = nextNotification;
    function createNotification(kind, value, error) {
      return {
        kind,
        value,
        error
      };
    }
    exports.createNotification = createNotification;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/errorContext.js
var require_errorContext = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/errorContext.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.captureError = exports.errorContext = void 0;
    var config_1 = require_config();
    var context = null;
    function errorContext(cb) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        var isRoot = !context;
        if (isRoot) {
          context = { errorThrown: false, error: null };
        }
        cb();
        if (isRoot) {
          var _a = context, errorThrown = _a.errorThrown, error = _a.error;
          context = null;
          if (errorThrown) {
            throw error;
          }
        }
      } else {
        cb();
      }
    }
    exports.errorContext = errorContext;
    function captureError(err) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling && context) {
        context.errorThrown = true;
        context.error = err;
      }
    }
    exports.captureError = captureError;
  }
});

// node_modules/rxjs/dist/cjs/internal/Subscriber.js
var require_Subscriber = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Subscriber.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EMPTY_OBSERVER = exports.SafeSubscriber = exports.Subscriber = void 0;
    var isFunction_1 = require_isFunction();
    var Subscription_1 = require_Subscription();
    var config_1 = require_config();
    var reportUnhandledError_1 = require_reportUnhandledError();
    var noop_1 = require_noop();
    var NotificationFactories_1 = require_NotificationFactories();
    var timeoutProvider_1 = require_timeoutProvider();
    var errorContext_1 = require_errorContext();
    var Subscriber = (function(_super) {
      __extends(Subscriber2, _super);
      function Subscriber2(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
          _this.destination = destination;
          if (Subscription_1.isSubscription(destination)) {
            destination.add(_this);
          }
        } else {
          _this.destination = exports.EMPTY_OBSERVER;
        }
        return _this;
      }
      Subscriber2.create = function(next, error, complete) {
        return new SafeSubscriber(next, error, complete);
      };
      Subscriber2.prototype.next = function(value) {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.nextNotification(value), this);
        } else {
          this._next(value);
        }
      };
      Subscriber2.prototype.error = function(err) {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.errorNotification(err), this);
        } else {
          this.isStopped = true;
          this._error(err);
        }
      };
      Subscriber2.prototype.complete = function() {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.COMPLETE_NOTIFICATION, this);
        } else {
          this.isStopped = true;
          this._complete();
        }
      };
      Subscriber2.prototype.unsubscribe = function() {
        if (!this.closed) {
          this.isStopped = true;
          _super.prototype.unsubscribe.call(this);
          this.destination = null;
        }
      };
      Subscriber2.prototype._next = function(value) {
        this.destination.next(value);
      };
      Subscriber2.prototype._error = function(err) {
        try {
          this.destination.error(err);
        } finally {
          this.unsubscribe();
        }
      };
      Subscriber2.prototype._complete = function() {
        try {
          this.destination.complete();
        } finally {
          this.unsubscribe();
        }
      };
      return Subscriber2;
    })(Subscription_1.Subscription);
    exports.Subscriber = Subscriber;
    var _bind = Function.prototype.bind;
    function bind(fn, thisArg) {
      return _bind.call(fn, thisArg);
    }
    var ConsumerObserver = (function() {
      function ConsumerObserver2(partialObserver) {
        this.partialObserver = partialObserver;
      }
      ConsumerObserver2.prototype.next = function(value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
          try {
            partialObserver.next(value);
          } catch (error) {
            handleUnhandledError(error);
          }
        }
      };
      ConsumerObserver2.prototype.error = function(err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
          try {
            partialObserver.error(err);
          } catch (error) {
            handleUnhandledError(error);
          }
        } else {
          handleUnhandledError(err);
        }
      };
      ConsumerObserver2.prototype.complete = function() {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
          try {
            partialObserver.complete();
          } catch (error) {
            handleUnhandledError(error);
          }
        }
      };
      return ConsumerObserver2;
    })();
    var SafeSubscriber = (function(_super) {
      __extends(SafeSubscriber2, _super);
      function SafeSubscriber2(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction_1.isFunction(observerOrNext) || !observerOrNext) {
          partialObserver = {
            next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
            error: error !== null && error !== void 0 ? error : void 0,
            complete: complete !== null && complete !== void 0 ? complete : void 0
          };
        } else {
          var context_1;
          if (_this && config_1.config.useDeprecatedNextContext) {
            context_1 = Object.create(observerOrNext);
            context_1.unsubscribe = function() {
              return _this.unsubscribe();
            };
            partialObserver = {
              next: observerOrNext.next && bind(observerOrNext.next, context_1),
              error: observerOrNext.error && bind(observerOrNext.error, context_1),
              complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
            };
          } else {
            partialObserver = observerOrNext;
          }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
      }
      return SafeSubscriber2;
    })(Subscriber);
    exports.SafeSubscriber = SafeSubscriber;
    function handleUnhandledError(error) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        errorContext_1.captureError(error);
      } else {
        reportUnhandledError_1.reportUnhandledError(error);
      }
    }
    function defaultErrorHandler(err) {
      throw err;
    }
    function handleStoppedNotification(notification, subscriber) {
      var onStoppedNotification = config_1.config.onStoppedNotification;
      onStoppedNotification && timeoutProvider_1.timeoutProvider.setTimeout(function() {
        return onStoppedNotification(notification, subscriber);
      });
    }
    exports.EMPTY_OBSERVER = {
      closed: true,
      next: noop_1.noop,
      error: defaultErrorHandler,
      complete: noop_1.noop
    };
  }
});

export {
  require_isFunction,
  require_createErrorClass,
  require_UnsubscriptionError,
  require_arrRemove,
  require_Subscription,
  require_config,
  require_reportUnhandledError,
  require_noop,
  require_errorContext,
  require_Subscriber
};
//# sourceMappingURL=chunk-AO5OQAUC.js.map
