/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/contrib/lineSelection/browser/lineSelection", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, position_1, selection_1, lineSelection_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function executeAction(action, editor) {
        action.run(null, editor, undefined);
    }
    suite('LineSelection', () => {
        test('', () => {
            const LINE1 = '    \tMy First Line\t ';
            const LINE2 = '\tMy Second Line';
            const LINE3 = '    Third Line🐶';
            const LINE4 = '';
            const LINE5 = '1';
            const TEXT = LINE1 + '\r\n' +
                LINE2 + '\n' +
                LINE3 + '\n' +
                LINE4 + '\r\n' +
                LINE5;
            (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                const action = new lineSelection_1.ExpandLineSelectionAction();
                //              0          1         2
                //              01234 56789012345678 0
                // let LINE1 = '    \tMy First Line\t ';
                editor.setPosition(new position_1.Position(1, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 2));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 5));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 19));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 20));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 21));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 3, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 4, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 5, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 5, LINE5.length + 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 5, LINE5.length + 1));
            });
        });
    });
});
//# sourceMappingURL=lineSelection.test.js.map