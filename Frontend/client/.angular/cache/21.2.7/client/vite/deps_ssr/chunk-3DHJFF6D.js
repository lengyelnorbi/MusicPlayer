import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  require_innerFrom
} from "./chunk-XG4HEUIY.js";
import {
  require_OperatorSubscriber,
  require_lift
} from "./chunk-2T3TMWUQ.js";
import {
  __commonJS
} from "./chunk-6DU2HRTW.js";

// node_modules/rxjs/dist/cjs/internal/operators/catchError.js
var require_catchError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/catchError.js"(exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.catchError = void 0;
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var lift_1 = require_lift();
    function catchError(selector) {
      return lift_1.operate(function(source, subscriber) {
        var innerSub = null;
        var syncUnsub = false;
        var handledResult;
        innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
          handledResult = innerFrom_1.innerFrom(selector(err, catchError(selector)(source)));
          if (innerSub) {
            innerSub.unsubscribe();
            innerSub = null;
            handledResult.subscribe(subscriber);
          } else {
            syncUnsub = true;
          }
        }));
        if (syncUnsub) {
          innerSub.unsubscribe();
          innerSub = null;
          handledResult.subscribe(subscriber);
        }
      });
    }
    exports.catchError = catchError;
  }
});

export {
  require_catchError
};
//# sourceMappingURL=chunk-3DHJFF6D.js.map
