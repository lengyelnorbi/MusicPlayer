import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  require_Subscriber,
  require_isFunction
} from "./chunk-AO5OQAUC.js";
import {
  __commonJS
} from "./chunk-6DU2HRTW.js";

// node_modules/rxjs/dist/cjs/internal/util/lift.js
var require_lift = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/lift.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.operate = exports.hasLift = void 0;
    var isFunction_1 = require_isFunction();
    function hasLift(source) {
      return isFunction_1.isFunction(source === null || source === void 0 ? void 0 : source.lift);
    }
    exports.hasLift = hasLift;
    function operate(init) {
      return function(source) {
        if (hasLift(source)) {
          return source.lift(function(liftedSource) {
            try {
              return init(liftedSource, this);
            } catch (err) {
              this.error(err);
            }
          });
        }
        throw new TypeError("Unable to lift unknown Observable type");
      };
    }
    exports.operate = operate;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/OperatorSubscriber.js
var require_OperatorSubscriber = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/OperatorSubscriber.js"(exports) {
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
    exports.OperatorSubscriber = exports.createOperatorSubscriber = void 0;
    var Subscriber_1 = require_Subscriber();
    function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
      return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
    }
    exports.createOperatorSubscriber = createOperatorSubscriber;
    var OperatorSubscriber = (function(_super) {
      __extends(OperatorSubscriber2, _super);
      function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext ? function(value) {
          try {
            onNext(value);
          } catch (err) {
            destination.error(err);
          }
        } : _super.prototype._next;
        _this._error = onError ? function(err) {
          try {
            onError(err);
          } catch (err2) {
            destination.error(err2);
          } finally {
            this.unsubscribe();
          }
        } : _super.prototype._error;
        _this._complete = onComplete ? function() {
          try {
            onComplete();
          } catch (err) {
            destination.error(err);
          } finally {
            this.unsubscribe();
          }
        } : _super.prototype._complete;
        return _this;
      }
      OperatorSubscriber2.prototype.unsubscribe = function() {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
          var closed_1 = this.closed;
          _super.prototype.unsubscribe.call(this);
          !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
      };
      return OperatorSubscriber2;
    })(Subscriber_1.Subscriber);
    exports.OperatorSubscriber = OperatorSubscriber;
  }
});

export {
  require_lift,
  require_OperatorSubscriber
};
//# sourceMappingURL=chunk-2T3TMWUQ.js.map
