/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/wordOperations/test/browser/wordTestUtils", "vs/editor/contrib/wordPartOperations/test/browser/utils", "vs/editor/contrib/wordPartOperations/browser/wordPartOperations", "vs/editor/test/common/modes/testLanguageConfigurationService"], function (require, exports, assert, position_1, languageConfigurationRegistry_1, wordTestUtils_1, utils_1, wordPartOperations_1, testLanguageConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WordPartOperations', () => {
        const _deleteWordPartLeft = new wordPartOperations_1.DeleteWordPartLeft();
        const _deleteWordPartRight = new wordPartOperations_1.DeleteWordPartRight();
        const _cursorWordPartLeft = new wordPartOperations_1.CursorWordPartLeft();
        const _cursorWordPartLeftSelect = new wordPartOperations_1.CursorWordPartLeftSelect();
        const _cursorWordPartRight = new wordPartOperations_1.CursorWordPartRight();
        const _cursorWordPartRightSelect = new wordPartOperations_1.CursorWordPartRightSelect();
        const serviceAccessor = new utils_1.StaticServiceAccessor().withService(languageConfigurationRegistry_1.ILanguageConfigurationService, new testLanguageConfigurationService_1.TestLanguageConfigurationService());
        function runEditorCommand(editor, command) {
            command.runEditorCommand(serviceAccessor, editor, null);
        }
        function cursorWordPartLeft(editor, inSelectionmode = false) {
            runEditorCommand(editor, inSelectionmode ? _cursorWordPartLeftSelect : _cursorWordPartLeft);
        }
        function cursorWordPartRight(editor, inSelectionmode = false) {
            runEditorCommand(editor, inSelectionmode ? _cursorWordPartRightSelect : _cursorWordPartRight);
        }
        function deleteWordPartLeft(editor) {
            runEditorCommand(editor, _deleteWordPartLeft);
        }
        function deleteWordPartRight(editor) {
            runEditorCommand(editor, _deleteWordPartRight);
        }
        test('cursorWordPartLeft - basic', () => {
            const EXPECTED = [
                '|start| |line|',
                '|this|Is|A|Camel|Case|Var|  |this_|is_|a_|snake_|case_|var| |THIS_|IS_|CAPS_|SNAKE| |this_|IS|Mixed|Use|',
                '|end| |line'
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartLeft - issue #53899: whitespace', () => {
            const EXPECTED = '|myvar| |=| |\'|demonstration|     |of| |selection| |with| |space|\'';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartLeft - issue #53899: underscores', () => {
            const EXPECTED = '|myvar| |=| |\'|demonstration_____|of| |selection| |with| |space|\'';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - basic', () => {
            const EXPECTED = [
                'start| |line|',
                '|this|Is|A|Camel|Case|Var|  |this|_is|_a|_snake|_case|_var| |THIS|_IS|_CAPS|_SNAKE| |this|_IS|Mixed|Use|',
                '|end| |line|'
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(3, 9)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - issue #53899: whitespace', () => {
            const EXPECTED = 'myvar| |=| |\'|demonstration|     |of| |selection| |with| |space|\'|';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 52)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - issue #53899: underscores', () => {
            const EXPECTED = 'myvar| |=| |\'|demonstration|_____of| |selection| |with| |space|\'|';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 52)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - issue #53899: second case', () => {
            const EXPECTED = [
                ';| |--| |1|',
                '|;|        |--| |2|',
                '|;|    |#|3|',
                '|;|   |#|4|'
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(4, 7)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #93239 - cursorWordPartRight', () => {
            const EXPECTED = [
                'foo|_bar|',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 8)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #93239 - cursorWordPartLeft', () => {
            const EXPECTED = [
                '|foo_|bar',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 8), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordPartLeft - basic', () => {
            const EXPECTED = '|   |/*| |Just| |some| |text| |a|+=| |3| |+|5|-|3| |*/|  |this|Is|A|Camel|Case|Var|  |this_|is_|a_|snake_|case_|var| |THIS_|IS_|CAPS_|SNAKE| |this_|IS|Mixed|Use';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1000), ed => deleteWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordPartRight - basic', () => {
            const EXPECTED = '   |/*| |Just| |some| |text| |a|+=| |3| |+|5|-|3| |*/|  |this|Is|A|Camel|Case|Var|  |this|_is|_a|_snake|_case|_var| |THIS|_IS|_CAPS|_SNAKE| |this|_IS|Mixed|Use|';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => deleteWordPartRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
    });
});
//# sourceMappingURL=wordPartOperations.test.js.map