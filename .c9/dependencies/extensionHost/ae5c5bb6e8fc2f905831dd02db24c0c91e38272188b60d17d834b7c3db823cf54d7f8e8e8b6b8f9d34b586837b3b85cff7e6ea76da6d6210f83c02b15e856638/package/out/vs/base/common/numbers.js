/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlidingWindowAverage = exports.MovingAverage = exports.Counter = exports.rot = exports.clamp = void 0;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    exports.clamp = clamp;
    function rot(index, modulo) {
        return (modulo + (index % modulo)) % modulo;
    }
    exports.rot = rot;
    class Counter {
        constructor() {
            this._next = 0;
        }
        getNext() {
            return this._next++;
        }
    }
    exports.Counter = Counter;
    class MovingAverage {
        constructor() {
            this._n = 1;
            this._val = 0;
        }
        update(value) {
            this._val = this._val + (value - this._val) / this._n;
            this._n += 1;
            return this._val;
        }
        get value() {
            return this._val;
        }
    }
    exports.MovingAverage = MovingAverage;
    class SlidingWindowAverage {
        constructor(size) {
            this._n = 0;
            this._val = 0;
            this._values = [];
            this._index = 0;
            this._sum = 0;
            this._values = new Array(size);
            this._values.fill(0, 0, size);
        }
        update(value) {
            const oldValue = this._values[this._index];
            this._values[this._index] = value;
            this._index = (this._index + 1) % this._values.length;
            this._sum -= oldValue;
            this._sum += value;
            if (this._n < this._values.length) {
                this._n += 1;
            }
            this._val = this._sum / this._n;
            return this._val;
        }
        get value() {
            return this._val;
        }
    }
    exports.SlidingWindowAverage = SlidingWindowAverage;
});
//# sourceMappingURL=numbers.js.map