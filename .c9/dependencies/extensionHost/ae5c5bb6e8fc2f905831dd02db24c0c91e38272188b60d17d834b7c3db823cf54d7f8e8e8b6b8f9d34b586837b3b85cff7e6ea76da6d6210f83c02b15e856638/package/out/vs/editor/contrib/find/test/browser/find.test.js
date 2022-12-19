/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/find/browser/findController", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, position_1, range_1, findController_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Find', () => {
        test('search string at position', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'ABC DEF',
                '0123 456'
            ], {}, (editor) => {
                // The cursor is at the very top, of the file, at the first ABC
                let searchStringAtTop = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringAtTop, 'ABC');
                // Move cursor to the end of ABC
                editor.setPosition(new position_1.Position(1, 3));
                let searchStringAfterABC = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringAfterABC, 'ABC');
                // Move cursor to DEF
                editor.setPosition(new position_1.Position(1, 5));
                let searchStringInsideDEF = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringInsideDEF, 'DEF');
            });
        });
        test('search string with selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'ABC DEF',
                '0123 456'
            ], {}, (editor) => {
                // Select A of ABC
                editor.setSelection(new range_1.Range(1, 1, 1, 2));
                let searchStringSelectionA = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionA, 'A');
                // Select BC of ABC
                editor.setSelection(new range_1.Range(1, 2, 1, 4));
                let searchStringSelectionBC = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionBC, 'BC');
                // Select BC DE
                editor.setSelection(new range_1.Range(1, 2, 1, 7));
                let searchStringSelectionBCDE = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionBCDE, 'BC DE');
            });
        });
        test('search string with multiline selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'ABC DEF',
                '0123 456'
            ], {}, (editor) => {
                // Select first line and newline
                editor.setSelection(new range_1.Range(1, 1, 2, 1));
                let searchStringSelectionWholeLine = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionWholeLine, null);
                // Select first line and chunk of second
                editor.setSelection(new range_1.Range(1, 1, 2, 4));
                let searchStringSelectionTwoLines = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionTwoLines, null);
                // Select end of first line newline and chunk of second
                editor.setSelection(new range_1.Range(1, 7, 2, 4));
                let searchStringSelectionSpanLines = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionSpanLines, null);
            });
        });
    });
});
//# sourceMappingURL=find.test.js.map