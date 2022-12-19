/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/iterator"], function (require, exports, assert, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Iterable', function () {
        const customIterable = new class {
            *[Symbol.iterator]() {
                yield 'one';
                yield 'two';
                yield 'three';
            }
        };
        test('first', function () {
            assert.strictEqual(iterator_1.Iterable.first([]), undefined);
            assert.strictEqual(iterator_1.Iterable.first([1]), 1);
            assert.strictEqual(iterator_1.Iterable.first(customIterable), 'one');
            assert.strictEqual(iterator_1.Iterable.first(customIterable), 'one'); // fresh
        });
        test('equals', () => {
            assert.strictEqual(iterator_1.Iterable.equals([1, 2], [1, 2]), true);
            assert.strictEqual(iterator_1.Iterable.equals([1, 2], [1]), false);
            assert.strictEqual(iterator_1.Iterable.equals([1], [1, 2]), false);
            assert.strictEqual(iterator_1.Iterable.equals([2, 1], [1, 2]), false);
        });
    });
});
//# sourceMappingURL=iterator.test.js.map