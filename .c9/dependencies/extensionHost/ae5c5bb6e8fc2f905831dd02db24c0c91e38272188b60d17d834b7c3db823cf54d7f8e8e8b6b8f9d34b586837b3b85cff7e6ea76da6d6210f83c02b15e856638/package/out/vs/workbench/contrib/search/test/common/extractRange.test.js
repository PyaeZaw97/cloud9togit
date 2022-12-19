/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/search/common/search"], function (require, exports, assert, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('extractRangeFromFilter', () => {
        test('basics', async function () {
            assert.ok(!(0, search_1.extractRangeFromFilter)(''));
            assert.ok(!(0, search_1.extractRangeFromFilter)('/some/path'));
            assert.ok(!(0, search_1.extractRangeFromFilter)('/some/path/file.txt'));
            for (const lineSep of [':', '#', '(', ':line ']) {
                for (const colSep of [':', '#', ',']) {
                    const base = '/some/path/file.txt';
                    let res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20`);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.filter, base);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startLineNumber, 20);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startColumn, 1);
                    res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20${colSep}`);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.filter, base);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startLineNumber, 20);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startColumn, 1);
                    res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20${colSep}3`);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.filter, base);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startLineNumber, 20);
                    assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startColumn, 3);
                }
            }
        });
        test('allow space after path', async function () {
            const res = (0, search_1.extractRangeFromFilter)('/some/path/file.txt (19,20)');
            assert.strictEqual(res === null || res === void 0 ? void 0 : res.filter, '/some/path/file.txt');
            assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startLineNumber, 19);
            assert.strictEqual(res === null || res === void 0 ? void 0 : res.range.startColumn, 20);
        });
        test('unless', async function () {
            const res = (0, search_1.extractRangeFromFilter)('/some/path/file.txt@ (19,20)', ['@']);
            assert.ok(!res);
        });
    });
});
//# sourceMappingURL=extractRange.test.js.map