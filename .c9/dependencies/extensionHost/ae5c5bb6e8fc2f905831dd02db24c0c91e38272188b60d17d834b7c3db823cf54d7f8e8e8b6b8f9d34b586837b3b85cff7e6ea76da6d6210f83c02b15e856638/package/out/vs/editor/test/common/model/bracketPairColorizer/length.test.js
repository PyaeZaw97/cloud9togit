/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length"], function (require, exports, assert, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Bracket Pair Colorizer - Length', () => {
        function toStr(length) {
            return (0, length_1.lengthToObj)(length).toString();
        }
        test('Basic', () => {
            const l1 = (0, length_1.toLength)(100, 10);
            assert.strictEqual((0, length_1.lengthToObj)(l1).lineCount, 100);
            assert.strictEqual((0, length_1.lengthToObj)(l1).columnCount, 10);
            assert.deepStrictEqual(toStr((0, length_1.lengthAdd)(l1, (0, length_1.toLength)(100, 10))), '200,10');
            assert.deepStrictEqual(toStr((0, length_1.lengthAdd)(l1, (0, length_1.toLength)(0, 10))), '100,20');
        });
        test('lengthDiffNonNeg', () => {
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(100, 10), (0, length_1.toLength)(100, 20))), '0,10');
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(100, 10), (0, length_1.toLength)(101, 20))), '1,20');
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(101, 30), (0, length_1.toLength)(101, 20))), '0,0');
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(102, 10), (0, length_1.toLength)(101, 20))), '0,0');
        });
    });
});
//# sourceMappingURL=length.test.js.map