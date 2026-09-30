import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  require_OperatorSubscriber,
  require_lift
} from "./chunk-2T3TMWUQ.js";
import {
  __commonJS
} from "./chunk-6DU2HRTW.js";

// node_modules/rxjs/dist/cjs/internal/operators/map.js
var require_map = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/map.js"(exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.map = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function map(project, thisArg) {
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          subscriber.next(project.call(thisArg, value, index++));
        }));
      });
    }
    exports.map = map;
  }
});

export {
  require_map
};
//# sourceMappingURL=chunk-XZ3TYIBT.js.map
