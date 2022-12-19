/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MutableObservableValue = exports.staticObservableValue = void 0;
    const staticObservableValue = (value) => ({
        onDidChange: event_1.Event.None,
        value,
    });
    exports.staticObservableValue = staticObservableValue;
    class MutableObservableValue extends lifecycle_1.Disposable {
        constructor(_value) {
            super();
            this._value = _value;
            this.changeEmitter = this._register(new event_1.Emitter());
            this.onDidChange = this.changeEmitter.event;
        }
        get value() {
            return this._value;
        }
        set value(v) {
            if (v !== this._value) {
                this._value = v;
                this.changeEmitter.fire(v);
            }
        }
        static stored(stored, defaultValue) {
            const o = new MutableObservableValue(stored.get(defaultValue));
            o.onDidChange(value => stored.store(value));
            return o;
        }
    }
    exports.MutableObservableValue = MutableObservableValue;
});
//# sourceMappingURL=observableValue.js.map