/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/languages/supports/characterPair", "vs/editor/test/common/modesTestUtils", "vs/editor/common/languages/languageConfiguration"], function (require, exports, assert, characterPair_1, modesTestUtils_1, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CharacterPairSupport', () => {
        test('only autoClosingPairs', () => {
            let characaterPairSupport = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: 'a', close: 'b' }] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
        });
        test('only empty autoClosingPairs', () => {
            let characaterPairSupport = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        test('only brackets', () => {
            let characaterPairSupport = new characterPair_1.CharacterPairSupport({ brackets: [['a', 'b']] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
        });
        test('only empty brackets', () => {
            let characaterPairSupport = new characterPair_1.CharacterPairSupport({ brackets: [] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        test('only surroundingPairs', () => {
            let characaterPairSupport = new characterPair_1.CharacterPairSupport({ surroundingPairs: [{ open: 'a', close: 'b' }] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [{ open: 'a', close: 'b' }]);
        });
        test('only empty surroundingPairs', () => {
            let characaterPairSupport = new characterPair_1.CharacterPairSupport({ surroundingPairs: [] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        test('brackets is ignored when having autoClosingPairs', () => {
            let characaterPairSupport = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [], brackets: [['a', 'b']] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        function testShouldAutoClose(characterPairSupport, line, column) {
            const autoClosingPair = characterPairSupport.getAutoClosingPairs()[0];
            return autoClosingPair.shouldAutoClose((0, modesTestUtils_1.createFakeScopedLineTokens)(line), column);
        }
        test('shouldAutoClosePair in empty line', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true);
        });
        test('shouldAutoClosePair in not interesting line 1', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: 'do', type: 0 /* StandardTokenType.Other */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true);
        });
        test('shouldAutoClosePair in not interesting line 2', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}' }] });
            const tokenText = [
                { text: 'do', type: 2 /* StandardTokenType.String */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true);
        });
        test('shouldAutoClosePair in interesting line 1', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: '"a"', type: 2 /* StandardTokenType.String */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false);
        });
        test('shouldAutoClosePair in interesting line 2', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: 'x=', type: 0 /* StandardTokenType.Other */ },
                { text: '"a"', type: 2 /* StandardTokenType.String */ },
                { text: ';', type: 0 /* StandardTokenType.Other */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 5), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 6), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 7), true);
        });
        test('shouldAutoClosePair in interesting line 3', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: ' ', type: 0 /* StandardTokenType.Other */ },
                { text: '//a', type: 1 /* StandardTokenType.Comment */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 5), false);
        });
    });
});
//# sourceMappingURL=characterPair.test.js.map