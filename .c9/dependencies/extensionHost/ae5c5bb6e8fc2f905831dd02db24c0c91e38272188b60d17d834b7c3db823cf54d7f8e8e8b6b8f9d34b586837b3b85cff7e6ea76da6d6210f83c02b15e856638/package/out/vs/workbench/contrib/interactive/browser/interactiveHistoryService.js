/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/base/common/history", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/instantiation/common/instantiation"], function (require, exports, history_1, lifecycle_1, map_1, instantiation_1) {
    "use strict";
    var _InteractiveHistoryService_history;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveHistoryService = exports.IInteractiveHistoryService = void 0;
    exports.IInteractiveHistoryService = (0, instantiation_1.createDecorator)('IInteractiveHistoryService');
    class InteractiveHistoryService extends lifecycle_1.Disposable {
        constructor() {
            super();
            _InteractiveHistoryService_history.set(this, void 0);
            __classPrivateFieldSet(this, _InteractiveHistoryService_history, new map_1.ResourceMap(), "f");
        }
        addToHistory(uri, value) {
            if (!__classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").has(uri)) {
                __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").set(uri, new history_1.HistoryNavigator2([value], 50));
                return;
            }
            const history = __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").get(uri);
            history.resetCursor();
            if ((history === null || history === void 0 ? void 0 : history.current()) !== value) {
                history === null || history === void 0 ? void 0 : history.add(value);
            }
        }
        getPreviousValue(uri) {
            var _a;
            const history = __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").get(uri);
            return (_a = history === null || history === void 0 ? void 0 : history.previous()) !== null && _a !== void 0 ? _a : null;
        }
        getNextValue(uri) {
            var _a;
            const history = __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").get(uri);
            return (_a = history === null || history === void 0 ? void 0 : history.next()) !== null && _a !== void 0 ? _a : null;
        }
        replaceLast(uri, value) {
            if (!__classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").has(uri)) {
                __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").set(uri, new history_1.HistoryNavigator2([value], 50));
                return;
            }
            else {
                const history = __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").get(uri);
                if ((history === null || history === void 0 ? void 0 : history.current()) !== value) {
                    history === null || history === void 0 ? void 0 : history.replaceLast(value);
                }
            }
        }
        clearHistory(uri) {
            __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").delete(uri);
        }
        has(uri) {
            return __classPrivateFieldGet(this, _InteractiveHistoryService_history, "f").has(uri) ? true : false;
        }
    }
    exports.InteractiveHistoryService = InteractiveHistoryService;
    _InteractiveHistoryService_history = new WeakMap();
});
//# sourceMappingURL=interactiveHistoryService.js.map