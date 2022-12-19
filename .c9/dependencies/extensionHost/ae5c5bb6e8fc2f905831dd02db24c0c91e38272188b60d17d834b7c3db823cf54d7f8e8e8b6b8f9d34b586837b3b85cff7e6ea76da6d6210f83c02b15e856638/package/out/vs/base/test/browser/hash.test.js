/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/hash", "vs/base/common/hash"], function (require, exports, assert, hash_1, hash_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Hash', () => {
        test('string', () => {
            assert.strictEqual((0, hash_2.hash)('hello'), (0, hash_2.hash)('hello'));
            assert.notStrictEqual((0, hash_2.hash)('hello'), (0, hash_2.hash)('world'));
            assert.notStrictEqual((0, hash_2.hash)('hello'), (0, hash_2.hash)('olleh'));
            assert.notStrictEqual((0, hash_2.hash)('hello'), (0, hash_2.hash)('Hello'));
            assert.notStrictEqual((0, hash_2.hash)('hello'), (0, hash_2.hash)('Hello '));
            assert.notStrictEqual((0, hash_2.hash)('h'), (0, hash_2.hash)('H'));
            assert.notStrictEqual((0, hash_2.hash)('-'), (0, hash_2.hash)('_'));
        });
        test('number', () => {
            assert.strictEqual((0, hash_2.hash)(1), (0, hash_2.hash)(1));
            assert.notStrictEqual((0, hash_2.hash)(0), (0, hash_2.hash)(1));
            assert.notStrictEqual((0, hash_2.hash)(1), (0, hash_2.hash)(-1));
            assert.notStrictEqual((0, hash_2.hash)(0x12345678), (0, hash_2.hash)(0x123456789));
        });
        test('boolean', () => {
            assert.strictEqual((0, hash_2.hash)(true), (0, hash_2.hash)(true));
            assert.notStrictEqual((0, hash_2.hash)(true), (0, hash_2.hash)(false));
        });
        test('array', () => {
            assert.strictEqual((0, hash_2.hash)([1, 2, 3]), (0, hash_2.hash)([1, 2, 3]));
            assert.strictEqual((0, hash_2.hash)(['foo', 'bar']), (0, hash_2.hash)(['foo', 'bar']));
            assert.strictEqual((0, hash_2.hash)([]), (0, hash_2.hash)([]));
            assert.strictEqual((0, hash_2.hash)([]), (0, hash_2.hash)(new Array()));
            assert.notStrictEqual((0, hash_2.hash)(['foo', 'bar']), (0, hash_2.hash)(['bar', 'foo']));
            assert.notStrictEqual((0, hash_2.hash)(['foo', 'bar']), (0, hash_2.hash)(['bar', 'foo', null]));
            assert.notStrictEqual((0, hash_2.hash)(['foo', 'bar', null]), (0, hash_2.hash)(['bar', 'foo', null]));
            assert.notStrictEqual((0, hash_2.hash)(['foo', 'bar']), (0, hash_2.hash)(['bar', 'foo', undefined]));
            assert.notStrictEqual((0, hash_2.hash)(['foo', 'bar', undefined]), (0, hash_2.hash)(['bar', 'foo', undefined]));
            assert.notStrictEqual((0, hash_2.hash)(['foo', 'bar', null]), (0, hash_2.hash)(['foo', 'bar', undefined]));
        });
        test('object', () => {
            assert.strictEqual((0, hash_2.hash)({}), (0, hash_2.hash)({}));
            assert.strictEqual((0, hash_2.hash)({}), (0, hash_2.hash)(Object.create(null)));
            assert.strictEqual((0, hash_2.hash)({ 'foo': 'bar' }), (0, hash_2.hash)({ 'foo': 'bar' }));
            assert.strictEqual((0, hash_2.hash)({ 'foo': 'bar', 'foo2': undefined }), (0, hash_2.hash)({ 'foo2': undefined, 'foo': 'bar' }));
            assert.notStrictEqual((0, hash_2.hash)({ 'foo': 'bar' }), (0, hash_2.hash)({ 'foo': 'bar2' }));
            assert.notStrictEqual((0, hash_2.hash)({}), (0, hash_2.hash)([]));
        });
        test('array - unexpected collision', function () {
            const a = (0, hash_2.hash)([undefined, undefined, undefined, undefined, undefined]);
            const b = (0, hash_2.hash)([undefined, undefined, 'HHHHHH', [{ line: 0, character: 0 }, { line: 0, character: 0 }], undefined]);
            assert.notStrictEqual(a, b);
        });
        test('all different', () => {
            const candidates = [
                null, undefined, {}, [], 0, false, true, '', ' ', [null], [undefined], [undefined, undefined], { '': undefined }, { [' ']: undefined },
                'ab', 'ba', ['ab']
            ];
            const hashes = candidates.map(hash_2.hash);
            for (let i = 0; i < hashes.length; i++) {
                assert.strictEqual(hashes[i], (0, hash_2.hash)(candidates[i])); // verify that repeated invocation returns the same hash
                for (let k = i + 1; k < hashes.length; k++) {
                    assert.notStrictEqual(hashes[i], hashes[k], `Same hash ${hashes[i]} for ${JSON.stringify(candidates[i])} and ${JSON.stringify(candidates[k])}`);
                }
            }
        });
        async function checkSHA1(str, expected) {
            // Test with StringSHA1
            const hash = new hash_2.StringSHA1();
            hash.update(str);
            let actual = hash.digest();
            assert.strictEqual(actual, expected);
            // Test with crypto.subtle
            actual = await (0, hash_1.sha1Hex)(str);
            assert.strictEqual(actual, expected);
        }
        test('sha1-1', () => {
            return checkSHA1('\udd56', '9bdb77276c1852e1fb067820472812fcf6084024');
        });
        test('sha1-2', () => {
            return checkSHA1('\udb52', '9bdb77276c1852e1fb067820472812fcf6084024');
        });
        test('sha1-3', () => {
            return checkSHA1('\uda02ꑍ', '9b483a471f22fe7e09d83f221871a987244bbd3f');
        });
        test('sha1-4', () => {
            return checkSHA1('hello', 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
        });
    });
});
//# sourceMappingURL=hash.test.js.map