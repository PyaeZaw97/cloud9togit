/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/replaceCommand", "vs/editor/common/cursor/cursorMoveOperations", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/nls"], function (require, exports, editorExtensions_1, replaceCommand_1, cursorMoveOperations_1, range_1, editorContextKeys_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TransposeLettersAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.transposeLetters',
                label: nls.localize('transposeLetters.label', "Transpose Letters"),
                alias: 'Transpose Letters',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 50 /* KeyCode.KeyT */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            let model = editor.getModel();
            let commands = [];
            let selections = editor.getSelections();
            for (let selection of selections) {
                if (!selection.isEmpty()) {
                    continue;
                }
                let lineNumber = selection.startLineNumber;
                let column = selection.startColumn;
                let lastColumn = model.getLineMaxColumn(lineNumber);
                if (lineNumber === 1 && (column === 1 || (column === 2 && lastColumn === 2))) {
                    // at beginning of file, nothing to do
                    continue;
                }
                // handle special case: when at end of line, transpose left two chars
                // otherwise, transpose left and right chars
                let endPosition = (column === lastColumn) ?
                    selection.getPosition() :
                    cursorMoveOperations_1.MoveOperations.rightPosition(model, selection.getPosition().lineNumber, selection.getPosition().column);
                let middlePosition = cursorMoveOperations_1.MoveOperations.leftPosition(model, endPosition);
                let beginPosition = cursorMoveOperations_1.MoveOperations.leftPosition(model, middlePosition);
                let leftChar = model.getValueInRange(range_1.Range.fromPositions(beginPosition, middlePosition));
                let rightChar = model.getValueInRange(range_1.Range.fromPositions(middlePosition, endPosition));
                let replaceRange = range_1.Range.fromPositions(beginPosition, endPosition);
                commands.push(new replaceCommand_1.ReplaceCommand(replaceRange, rightChar + leftChar));
            }
            if (commands.length > 0) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, commands);
                editor.pushUndoStop();
            }
        }
    }
    (0, editorExtensions_1.registerEditorAction)(TransposeLettersAction);
});
//# sourceMappingURL=transpose.js.map