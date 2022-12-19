/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/browser/coreCommands", "vs/editor/common/core/selection", "vs/editor/contrib/cursorUndo/browser/cursorUndo", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, coreCommands_1, selection_1, cursorUndo_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FindController', () => {
        const cursorUndoAction = new cursorUndo_1.CursorUndo();
        test('issue #82535: Edge case with cursorUndo', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor) => {
                editor.registerAndInstantiateContribution(cursorUndo_1.CursorUndoRedoController.ID, cursorUndo_1.CursorUndoRedoController);
                // type hello
                editor.trigger('test', "type" /* Handler.Type */, { text: 'hello' });
                // press left
                coreCommands_1.CoreNavigationCommands.CursorLeft.runEditorCommand(null, editor, {});
                // press Delete
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, {});
                assert.deepStrictEqual(editor.getValue(), 'hell');
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 5, 1, 5)]);
                // press left
                coreCommands_1.CoreNavigationCommands.CursorLeft.runEditorCommand(null, editor, {});
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 4, 1, 4)]);
                // press Ctrl+U
                cursorUndoAction.run(null, editor, {});
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 5, 1, 5)]);
            });
        });
        test('issue #82535: Edge case with cursorUndo (reverse)', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor) => {
                editor.registerAndInstantiateContribution(cursorUndo_1.CursorUndoRedoController.ID, cursorUndo_1.CursorUndoRedoController);
                // type hello
                editor.trigger('test', "type" /* Handler.Type */, { text: 'hell' });
                editor.trigger('test', "type" /* Handler.Type */, { text: 'o' });
                assert.deepStrictEqual(editor.getValue(), 'hello');
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                // press Ctrl+U
                cursorUndoAction.run(null, editor, {});
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
            });
        });
    });
});
//# sourceMappingURL=cursorUndo.test.js.map