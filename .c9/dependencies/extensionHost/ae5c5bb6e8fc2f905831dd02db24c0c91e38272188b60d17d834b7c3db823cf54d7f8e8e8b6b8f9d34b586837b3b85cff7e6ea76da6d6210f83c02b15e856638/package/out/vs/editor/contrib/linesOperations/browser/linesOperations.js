/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/editor/browser/coreCommands", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/replaceCommand", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/cursor/cursorTypeOperations", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/contrib/linesOperations/browser/copyLinesCommand", "vs/editor/contrib/linesOperations/browser/moveLinesCommand", "vs/editor/contrib/linesOperations/browser/sortLinesCommand", "vs/nls", "vs/platform/actions/common/actions", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, keyCodes_1, coreCommands_1, editorExtensions_1, replaceCommand_1, trimTrailingWhitespaceCommand_1, cursorTypeOperations_1, editOperation_1, position_1, range_1, selection_1, editorContextKeys_1, copyLinesCommand_1, moveLinesCommand_1, sortLinesCommand_1, nls, actions_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnakeCaseAction = exports.TitleCaseAction = exports.LowerCaseAction = exports.UpperCaseAction = exports.AbstractCaseAction = exports.TransposeAction = exports.JoinLinesAction = exports.DeleteAllRightAction = exports.DeleteAllLeftAction = exports.AbstractDeleteAllToBoundaryAction = exports.InsertLineAfterAction = exports.InsertLineBeforeAction = exports.IndentLinesAction = exports.DeleteLinesAction = exports.TrimTrailingWhitespaceAction = exports.DeleteDuplicateLinesAction = exports.SortLinesDescendingAction = exports.SortLinesAscendingAction = exports.AbstractSortLinesAction = exports.DuplicateSelectionAction = void 0;
    // copy lines
    class AbstractCopyLinesAction extends editorExtensions_1.EditorAction {
        constructor(down, opts) {
            super(opts);
            this.down = down;
        }
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const selections = editor.getSelections().map((selection, index) => ({ selection, index, ignore: false }));
            selections.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.selection, b.selection));
            // Remove selections that would result in copying the same line
            let prev = selections[0];
            for (let i = 1; i < selections.length; i++) {
                const curr = selections[i];
                if (prev.selection.endLineNumber === curr.selection.startLineNumber) {
                    // these two selections would copy the same line
                    if (prev.index < curr.index) {
                        // prev wins
                        curr.ignore = true;
                    }
                    else {
                        // curr wins
                        prev.ignore = true;
                        prev = curr;
                    }
                }
            }
            const commands = [];
            for (const selection of selections) {
                commands.push(new copyLinesCommand_1.CopyLinesCommand(selection.selection, this.down, selection.ignore));
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    class CopyLinesUpAction extends AbstractCopyLinesAction {
        constructor() {
            super(false, {
                id: 'editor.action.copyLinesUpAction',
                label: nls.localize('lines.copyUp', "Copy Line Up"),
                alias: 'Copy Line Up',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miCopyLinesUp', comment: ['&& denotes a mnemonic'] }, "&&Copy Line Up"),
                    order: 1
                }
            });
        }
    }
    class CopyLinesDownAction extends AbstractCopyLinesAction {
        constructor() {
            super(true, {
                id: 'editor.action.copyLinesDownAction',
                label: nls.localize('lines.copyDown', "Copy Line Down"),
                alias: 'Copy Line Down',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miCopyLinesDown', comment: ['&& denotes a mnemonic'] }, "Co&&py Line Down"),
                    order: 2
                }
            });
        }
    }
    class DuplicateSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.duplicateSelection',
                label: nls.localize('duplicateSelection', "Duplicate Selection"),
                alias: 'Duplicate Selection',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miDuplicateSelection', comment: ['&& denotes a mnemonic'] }, "&&Duplicate Selection"),
                    order: 5
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const commands = [];
            const selections = editor.getSelections();
            const model = editor.getModel();
            for (const selection of selections) {
                if (selection.isEmpty()) {
                    commands.push(new copyLinesCommand_1.CopyLinesCommand(selection, true));
                }
                else {
                    const insertSelection = new selection_1.Selection(selection.endLineNumber, selection.endColumn, selection.endLineNumber, selection.endColumn);
                    commands.push(new replaceCommand_1.ReplaceCommandThatSelectsText(insertSelection, model.getValueInRange(selection)));
                }
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.DuplicateSelectionAction = DuplicateSelectionAction;
    // move lines
    class AbstractMoveLinesAction extends editorExtensions_1.EditorAction {
        constructor(down, opts) {
            super(opts);
            this.down = down;
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            let commands = [];
            let selections = editor.getSelections() || [];
            const autoIndent = editor.getOption(9 /* EditorOption.autoIndent */);
            for (const selection of selections) {
                commands.push(new moveLinesCommand_1.MoveLinesCommand(selection, this.down, autoIndent, languageConfigurationService));
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    class MoveLinesUpAction extends AbstractMoveLinesAction {
        constructor() {
            super(false, {
                id: 'editor.action.moveLinesUpAction',
                label: nls.localize('lines.moveUp', "Move Line Up"),
                alias: 'Move Line Up',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                    linux: { primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miMoveLinesUp', comment: ['&& denotes a mnemonic'] }, "Mo&&ve Line Up"),
                    order: 3
                }
            });
        }
    }
    class MoveLinesDownAction extends AbstractMoveLinesAction {
        constructor() {
            super(true, {
                id: 'editor.action.moveLinesDownAction',
                label: nls.localize('lines.moveDown', "Move Line Down"),
                alias: 'Move Line Down',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                    linux: { primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miMoveLinesDown', comment: ['&& denotes a mnemonic'] }, "Move &&Line Down"),
                    order: 4
                }
            });
        }
    }
    class AbstractSortLinesAction extends editorExtensions_1.EditorAction {
        constructor(descending, opts) {
            super(opts);
            this.descending = descending;
        }
        run(_accessor, editor) {
            const selections = editor.getSelections() || [];
            for (const selection of selections) {
                if (!sortLinesCommand_1.SortLinesCommand.canRun(editor.getModel(), selection, this.descending)) {
                    return;
                }
            }
            let commands = [];
            for (let i = 0, len = selections.length; i < len; i++) {
                commands[i] = new sortLinesCommand_1.SortLinesCommand(selections[i], this.descending);
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.AbstractSortLinesAction = AbstractSortLinesAction;
    class SortLinesAscendingAction extends AbstractSortLinesAction {
        constructor() {
            super(false, {
                id: 'editor.action.sortLinesAscending',
                label: nls.localize('lines.sortAscending', "Sort Lines Ascending"),
                alias: 'Sort Lines Ascending',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.SortLinesAscendingAction = SortLinesAscendingAction;
    class SortLinesDescendingAction extends AbstractSortLinesAction {
        constructor() {
            super(true, {
                id: 'editor.action.sortLinesDescending',
                label: nls.localize('lines.sortDescending', "Sort Lines Descending"),
                alias: 'Sort Lines Descending',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.SortLinesDescendingAction = SortLinesDescendingAction;
    class DeleteDuplicateLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.removeDuplicateLines',
                label: nls.localize('lines.deleteDuplicates', "Delete Duplicate Lines"),
                alias: 'Delete Duplicate Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            let model = editor.getModel();
            if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
                return;
            }
            let edits = [];
            let endCursorState = [];
            let linesDeleted = 0;
            for (let selection of editor.getSelections()) {
                let uniqueLines = new Set();
                let lines = [];
                for (let i = selection.startLineNumber; i <= selection.endLineNumber; i++) {
                    let line = model.getLineContent(i);
                    if (uniqueLines.has(line)) {
                        continue;
                    }
                    lines.push(line);
                    uniqueLines.add(line);
                }
                let selectionToReplace = new selection_1.Selection(selection.startLineNumber, 1, selection.endLineNumber, model.getLineMaxColumn(selection.endLineNumber));
                let adjustedSelectionStart = selection.startLineNumber - linesDeleted;
                let finalSelection = new selection_1.Selection(adjustedSelectionStart, 1, adjustedSelectionStart + lines.length - 1, lines[lines.length - 1].length);
                edits.push(editOperation_1.EditOperation.replace(selectionToReplace, lines.join('\n')));
                endCursorState.push(finalSelection);
                linesDeleted += (selection.endLineNumber - selection.startLineNumber + 1) - lines.length;
            }
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, endCursorState);
            editor.pushUndoStop();
        }
    }
    exports.DeleteDuplicateLinesAction = DeleteDuplicateLinesAction;
    class TrimTrailingWhitespaceAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: TrimTrailingWhitespaceAction.ID,
                label: nls.localize('lines.trimTrailingWhitespace', "Trim Trailing Whitespace"),
                alias: 'Trim Trailing Whitespace',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor, args) {
            let cursors = [];
            if (args.reason === 'auto-save') {
                // See https://github.com/editorconfig/editorconfig-vscode/issues/47
                // It is very convenient for the editor config extension to invoke this action.
                // So, if we get a reason:'auto-save' passed in, let's preserve cursor positions.
                cursors = (editor.getSelections() || []).map(s => new position_1.Position(s.positionLineNumber, s.positionColumn));
            }
            let selection = editor.getSelection();
            if (selection === null) {
                return;
            }
            let command = new trimTrailingWhitespaceCommand_1.TrimTrailingWhitespaceCommand(selection, cursors);
            editor.pushUndoStop();
            editor.executeCommands(this.id, [command]);
            editor.pushUndoStop();
        }
    }
    exports.TrimTrailingWhitespaceAction = TrimTrailingWhitespaceAction;
    TrimTrailingWhitespaceAction.ID = 'editor.action.trimTrailingWhitespace';
    class DeleteLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.deleteLines',
                label: nls.localize('lines.delete', "Delete Line"),
                alias: 'Delete Line',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 41 /* KeyCode.KeyK */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            let ops = this._getLinesToRemove(editor);
            let model = editor.getModel();
            if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
                // Model is empty
                return;
            }
            let linesDeleted = 0;
            let edits = [];
            let cursorState = [];
            for (let i = 0, len = ops.length; i < len; i++) {
                const op = ops[i];
                let startLineNumber = op.startLineNumber;
                let endLineNumber = op.endLineNumber;
                let startColumn = 1;
                let endColumn = model.getLineMaxColumn(endLineNumber);
                if (endLineNumber < model.getLineCount()) {
                    endLineNumber += 1;
                    endColumn = 1;
                }
                else if (startLineNumber > 1) {
                    startLineNumber -= 1;
                    startColumn = model.getLineMaxColumn(startLineNumber);
                }
                edits.push(editOperation_1.EditOperation.replace(new selection_1.Selection(startLineNumber, startColumn, endLineNumber, endColumn), ''));
                cursorState.push(new selection_1.Selection(startLineNumber - linesDeleted, op.positionColumn, startLineNumber - linesDeleted, op.positionColumn));
                linesDeleted += (op.endLineNumber - op.startLineNumber + 1);
            }
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, cursorState);
            editor.pushUndoStop();
        }
        _getLinesToRemove(editor) {
            // Construct delete operations
            let operations = editor.getSelections().map((s) => {
                let endLineNumber = s.endLineNumber;
                if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                    endLineNumber -= 1;
                }
                return {
                    startLineNumber: s.startLineNumber,
                    selectionStartColumn: s.selectionStartColumn,
                    endLineNumber: endLineNumber,
                    positionColumn: s.positionColumn
                };
            });
            // Sort delete operations
            operations.sort((a, b) => {
                if (a.startLineNumber === b.startLineNumber) {
                    return a.endLineNumber - b.endLineNumber;
                }
                return a.startLineNumber - b.startLineNumber;
            });
            // Merge delete operations which are adjacent or overlapping
            let mergedOperations = [];
            let previousOperation = operations[0];
            for (let i = 1; i < operations.length; i++) {
                if (previousOperation.endLineNumber + 1 >= operations[i].startLineNumber) {
                    // Merge current operations into the previous one
                    previousOperation.endLineNumber = operations[i].endLineNumber;
                }
                else {
                    // Push previous operation
                    mergedOperations.push(previousOperation);
                    previousOperation = operations[i];
                }
            }
            // Push the last operation
            mergedOperations.push(previousOperation);
            return mergedOperations;
        }
    }
    exports.DeleteLinesAction = DeleteLinesAction;
    class IndentLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.indentLines',
                label: nls.localize('lines.indent', "Indent Line"),
                alias: 'Indent Line',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.BracketRight */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                return;
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.indent(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
            editor.pushUndoStop();
        }
    }
    exports.IndentLinesAction = IndentLinesAction;
    class OutdentLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.outdentLines',
                label: nls.localize('lines.outdent', "Outdent Line"),
                alias: 'Outdent Line',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 87 /* KeyCode.BracketLeft */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(_accessor, editor, null);
        }
    }
    class InsertLineBeforeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertLineBefore',
                label: nls.localize('lines.insertBefore', "Insert Line Above"),
                alias: 'Insert Line Above',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                return;
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.lineInsertBefore(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
        }
    }
    exports.InsertLineBeforeAction = InsertLineBeforeAction;
    class InsertLineAfterAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertLineAfter',
                label: nls.localize('lines.insertAfter', "Insert Line Below"),
                alias: 'Insert Line Below',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                return;
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.lineInsertAfter(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
        }
    }
    exports.InsertLineAfterAction = InsertLineAfterAction;
    class AbstractDeleteAllToBoundaryAction extends editorExtensions_1.EditorAction {
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const primaryCursor = editor.getSelection();
            let rangesToDelete = this._getRangesToDelete(editor);
            // merge overlapping selections
            let effectiveRanges = [];
            for (let i = 0, count = rangesToDelete.length - 1; i < count; i++) {
                let range = rangesToDelete[i];
                let nextRange = rangesToDelete[i + 1];
                if (range_1.Range.intersectRanges(range, nextRange) === null) {
                    effectiveRanges.push(range);
                }
                else {
                    rangesToDelete[i + 1] = range_1.Range.plusRange(range, nextRange);
                }
            }
            effectiveRanges.push(rangesToDelete[rangesToDelete.length - 1]);
            let endCursorState = this._getEndCursorState(primaryCursor, effectiveRanges);
            let edits = effectiveRanges.map(range => {
                return editOperation_1.EditOperation.replace(range, '');
            });
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, endCursorState);
            editor.pushUndoStop();
        }
    }
    exports.AbstractDeleteAllToBoundaryAction = AbstractDeleteAllToBoundaryAction;
    class DeleteAllLeftAction extends AbstractDeleteAllToBoundaryAction {
        constructor() {
            super({
                id: 'deleteAllLeft',
                label: nls.localize('lines.deleteAllLeft', "Delete All Left"),
                alias: 'Delete All Left',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _getEndCursorState(primaryCursor, rangesToDelete) {
            let endPrimaryCursor = null;
            let endCursorState = [];
            let deletedLines = 0;
            rangesToDelete.forEach(range => {
                let endCursor;
                if (range.endColumn === 1 && deletedLines > 0) {
                    let newStartLine = range.startLineNumber - deletedLines;
                    endCursor = new selection_1.Selection(newStartLine, range.startColumn, newStartLine, range.startColumn);
                }
                else {
                    endCursor = new selection_1.Selection(range.startLineNumber, range.startColumn, range.startLineNumber, range.startColumn);
                }
                deletedLines += range.endLineNumber - range.startLineNumber;
                if (range.intersectRanges(primaryCursor)) {
                    endPrimaryCursor = endCursor;
                }
                else {
                    endCursorState.push(endCursor);
                }
            });
            if (endPrimaryCursor) {
                endCursorState.unshift(endPrimaryCursor);
            }
            return endCursorState;
        }
        _getRangesToDelete(editor) {
            let selections = editor.getSelections();
            if (selections === null) {
                return [];
            }
            let rangesToDelete = selections;
            let model = editor.getModel();
            if (model === null) {
                return [];
            }
            rangesToDelete.sort(range_1.Range.compareRangesUsingStarts);
            rangesToDelete = rangesToDelete.map(selection => {
                if (selection.isEmpty()) {
                    if (selection.startColumn === 1) {
                        let deleteFromLine = Math.max(1, selection.startLineNumber - 1);
                        let deleteFromColumn = selection.startLineNumber === 1 ? 1 : model.getLineContent(deleteFromLine).length + 1;
                        return new range_1.Range(deleteFromLine, deleteFromColumn, selection.startLineNumber, 1);
                    }
                    else {
                        return new range_1.Range(selection.startLineNumber, 1, selection.startLineNumber, selection.startColumn);
                    }
                }
                else {
                    return new range_1.Range(selection.startLineNumber, 1, selection.endLineNumber, selection.endColumn);
                }
            });
            return rangesToDelete;
        }
    }
    exports.DeleteAllLeftAction = DeleteAllLeftAction;
    class DeleteAllRightAction extends AbstractDeleteAllToBoundaryAction {
        constructor() {
            super({
                id: 'deleteAllRight',
                label: nls.localize('lines.deleteAllRight', "Delete All Right"),
                alias: 'Delete All Right',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 41 /* KeyCode.KeyK */, secondary: [2048 /* KeyMod.CtrlCmd */ | 20 /* KeyCode.Delete */] },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _getEndCursorState(primaryCursor, rangesToDelete) {
            let endPrimaryCursor = null;
            let endCursorState = [];
            for (let i = 0, len = rangesToDelete.length, offset = 0; i < len; i++) {
                let range = rangesToDelete[i];
                let endCursor = new selection_1.Selection(range.startLineNumber - offset, range.startColumn, range.startLineNumber - offset, range.startColumn);
                if (range.intersectRanges(primaryCursor)) {
                    endPrimaryCursor = endCursor;
                }
                else {
                    endCursorState.push(endCursor);
                }
            }
            if (endPrimaryCursor) {
                endCursorState.unshift(endPrimaryCursor);
            }
            return endCursorState;
        }
        _getRangesToDelete(editor) {
            let model = editor.getModel();
            if (model === null) {
                return [];
            }
            let selections = editor.getSelections();
            if (selections === null) {
                return [];
            }
            let rangesToDelete = selections.map((sel) => {
                if (sel.isEmpty()) {
                    const maxColumn = model.getLineMaxColumn(sel.startLineNumber);
                    if (sel.startColumn === maxColumn) {
                        return new range_1.Range(sel.startLineNumber, sel.startColumn, sel.startLineNumber + 1, 1);
                    }
                    else {
                        return new range_1.Range(sel.startLineNumber, sel.startColumn, sel.startLineNumber, maxColumn);
                    }
                }
                return sel;
            });
            rangesToDelete.sort(range_1.Range.compareRangesUsingStarts);
            return rangesToDelete;
        }
    }
    exports.DeleteAllRightAction = DeleteAllRightAction;
    class JoinLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.joinLines',
                label: nls.localize('lines.joinLines', "Join Lines"),
                alias: 'Join Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 40 /* KeyCode.KeyJ */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            let selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            let primaryCursor = editor.getSelection();
            if (primaryCursor === null) {
                return;
            }
            selections.sort(range_1.Range.compareRangesUsingStarts);
            let reducedSelections = [];
            let lastSelection = selections.reduce((previousValue, currentValue) => {
                if (previousValue.isEmpty()) {
                    if (previousValue.endLineNumber === currentValue.startLineNumber) {
                        if (primaryCursor.equalsSelection(previousValue)) {
                            primaryCursor = currentValue;
                        }
                        return currentValue;
                    }
                    if (currentValue.startLineNumber > previousValue.endLineNumber + 1) {
                        reducedSelections.push(previousValue);
                        return currentValue;
                    }
                    else {
                        return new selection_1.Selection(previousValue.startLineNumber, previousValue.startColumn, currentValue.endLineNumber, currentValue.endColumn);
                    }
                }
                else {
                    if (currentValue.startLineNumber > previousValue.endLineNumber) {
                        reducedSelections.push(previousValue);
                        return currentValue;
                    }
                    else {
                        return new selection_1.Selection(previousValue.startLineNumber, previousValue.startColumn, currentValue.endLineNumber, currentValue.endColumn);
                    }
                }
            });
            reducedSelections.push(lastSelection);
            let model = editor.getModel();
            if (model === null) {
                return;
            }
            let edits = [];
            let endCursorState = [];
            let endPrimaryCursor = primaryCursor;
            let lineOffset = 0;
            for (let i = 0, len = reducedSelections.length; i < len; i++) {
                let selection = reducedSelections[i];
                let startLineNumber = selection.startLineNumber;
                let startColumn = 1;
                let columnDeltaOffset = 0;
                let endLineNumber, endColumn;
                let selectionEndPositionOffset = model.getLineContent(selection.endLineNumber).length - selection.endColumn;
                if (selection.isEmpty() || selection.startLineNumber === selection.endLineNumber) {
                    let position = selection.getStartPosition();
                    if (position.lineNumber < model.getLineCount()) {
                        endLineNumber = startLineNumber + 1;
                        endColumn = model.getLineMaxColumn(endLineNumber);
                    }
                    else {
                        endLineNumber = position.lineNumber;
                        endColumn = model.getLineMaxColumn(position.lineNumber);
                    }
                }
                else {
                    endLineNumber = selection.endLineNumber;
                    endColumn = model.getLineMaxColumn(endLineNumber);
                }
                let trimmedLinesContent = model.getLineContent(startLineNumber);
                for (let i = startLineNumber + 1; i <= endLineNumber; i++) {
                    let lineText = model.getLineContent(i);
                    let firstNonWhitespaceIdx = model.getLineFirstNonWhitespaceColumn(i);
                    if (firstNonWhitespaceIdx >= 1) {
                        let insertSpace = true;
                        if (trimmedLinesContent === '') {
                            insertSpace = false;
                        }
                        if (insertSpace && (trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === ' ' ||
                            trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === '\t')) {
                            insertSpace = false;
                            trimmedLinesContent = trimmedLinesContent.replace(/[\s\uFEFF\xA0]+$/g, ' ');
                        }
                        let lineTextWithoutIndent = lineText.substr(firstNonWhitespaceIdx - 1);
                        trimmedLinesContent += (insertSpace ? ' ' : '') + lineTextWithoutIndent;
                        if (insertSpace) {
                            columnDeltaOffset = lineTextWithoutIndent.length + 1;
                        }
                        else {
                            columnDeltaOffset = lineTextWithoutIndent.length;
                        }
                    }
                    else {
                        columnDeltaOffset = 0;
                    }
                }
                let deleteSelection = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
                if (!deleteSelection.isEmpty()) {
                    let resultSelection;
                    if (selection.isEmpty()) {
                        edits.push(editOperation_1.EditOperation.replace(deleteSelection, trimmedLinesContent));
                        resultSelection = new selection_1.Selection(deleteSelection.startLineNumber - lineOffset, trimmedLinesContent.length - columnDeltaOffset + 1, startLineNumber - lineOffset, trimmedLinesContent.length - columnDeltaOffset + 1);
                    }
                    else {
                        if (selection.startLineNumber === selection.endLineNumber) {
                            edits.push(editOperation_1.EditOperation.replace(deleteSelection, trimmedLinesContent));
                            resultSelection = new selection_1.Selection(selection.startLineNumber - lineOffset, selection.startColumn, selection.endLineNumber - lineOffset, selection.endColumn);
                        }
                        else {
                            edits.push(editOperation_1.EditOperation.replace(deleteSelection, trimmedLinesContent));
                            resultSelection = new selection_1.Selection(selection.startLineNumber - lineOffset, selection.startColumn, selection.startLineNumber - lineOffset, trimmedLinesContent.length - selectionEndPositionOffset);
                        }
                    }
                    if (range_1.Range.intersectRanges(deleteSelection, primaryCursor) !== null) {
                        endPrimaryCursor = resultSelection;
                    }
                    else {
                        endCursorState.push(resultSelection);
                    }
                }
                lineOffset += deleteSelection.endLineNumber - deleteSelection.startLineNumber;
            }
            endCursorState.unshift(endPrimaryCursor);
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, endCursorState);
            editor.pushUndoStop();
        }
    }
    exports.JoinLinesAction = JoinLinesAction;
    class TransposeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.transpose',
                label: nls.localize('editor.transpose', "Transpose characters around the cursor"),
                alias: 'Transpose characters around the cursor',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(_accessor, editor) {
            let selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            let model = editor.getModel();
            if (model === null) {
                return;
            }
            let commands = [];
            for (let i = 0, len = selections.length; i < len; i++) {
                let selection = selections[i];
                if (!selection.isEmpty()) {
                    continue;
                }
                let cursor = selection.getStartPosition();
                let maxColumn = model.getLineMaxColumn(cursor.lineNumber);
                if (cursor.column >= maxColumn) {
                    if (cursor.lineNumber === model.getLineCount()) {
                        continue;
                    }
                    // The cursor is at the end of current line and current line is not empty
                    // then we transpose the character before the cursor and the line break if there is any following line.
                    let deleteSelection = new range_1.Range(cursor.lineNumber, Math.max(1, cursor.column - 1), cursor.lineNumber + 1, 1);
                    let chars = model.getValueInRange(deleteSelection).split('').reverse().join('');
                    commands.push(new replaceCommand_1.ReplaceCommand(new selection_1.Selection(cursor.lineNumber, Math.max(1, cursor.column - 1), cursor.lineNumber + 1, 1), chars));
                }
                else {
                    let deleteSelection = new range_1.Range(cursor.lineNumber, Math.max(1, cursor.column - 1), cursor.lineNumber, cursor.column + 1);
                    let chars = model.getValueInRange(deleteSelection).split('').reverse().join('');
                    commands.push(new replaceCommand_1.ReplaceCommandThatPreservesSelection(deleteSelection, chars, new selection_1.Selection(cursor.lineNumber, cursor.column + 1, cursor.lineNumber, cursor.column + 1)));
                }
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.TransposeAction = TransposeAction;
    class AbstractCaseAction extends editorExtensions_1.EditorAction {
        run(_accessor, editor) {
            const selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            const model = editor.getModel();
            if (model === null) {
                return;
            }
            const wordSeparators = editor.getOption(117 /* EditorOption.wordSeparators */);
            const textEdits = [];
            for (const selection of selections) {
                if (selection.isEmpty()) {
                    const cursor = selection.getStartPosition();
                    const word = editor.getConfiguredWordAtPosition(cursor);
                    if (!word) {
                        continue;
                    }
                    const wordRange = new range_1.Range(cursor.lineNumber, word.startColumn, cursor.lineNumber, word.endColumn);
                    const text = model.getValueInRange(wordRange);
                    textEdits.push(editOperation_1.EditOperation.replace(wordRange, this._modifyText(text, wordSeparators)));
                }
                else {
                    const text = model.getValueInRange(selection);
                    textEdits.push(editOperation_1.EditOperation.replace(selection, this._modifyText(text, wordSeparators)));
                }
            }
            editor.pushUndoStop();
            editor.executeEdits(this.id, textEdits);
            editor.pushUndoStop();
        }
    }
    exports.AbstractCaseAction = AbstractCaseAction;
    class UpperCaseAction extends AbstractCaseAction {
        constructor() {
            super({
                id: 'editor.action.transformToUppercase',
                label: nls.localize('editor.transformToUppercase', "Transform to Uppercase"),
                alias: 'Transform to Uppercase',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            return text.toLocaleUpperCase();
        }
    }
    exports.UpperCaseAction = UpperCaseAction;
    class LowerCaseAction extends AbstractCaseAction {
        constructor() {
            super({
                id: 'editor.action.transformToLowercase',
                label: nls.localize('editor.transformToLowercase', "Transform to Lowercase"),
                alias: 'Transform to Lowercase',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            return text.toLocaleLowerCase();
        }
    }
    exports.LowerCaseAction = LowerCaseAction;
    class BackwardsCompatibleRegExp {
        constructor(_pattern, _flags) {
            this._pattern = _pattern;
            this._flags = _flags;
            this._actual = null;
            this._evaluated = false;
        }
        get() {
            if (!this._evaluated) {
                this._evaluated = true;
                try {
                    this._actual = new RegExp(this._pattern, this._flags);
                }
                catch (err) {
                    // this browser does not support this regular expression
                }
            }
            return this._actual;
        }
        isSupported() {
            return (this.get() !== null);
        }
    }
    class TitleCaseAction extends AbstractCaseAction {
        constructor() {
            super({
                id: 'editor.action.transformToTitlecase',
                label: nls.localize('editor.transformToTitlecase', "Transform to Title Case"),
                alias: 'Transform to Title Case',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            const titleBoundary = TitleCaseAction.titleBoundary.get();
            if (!titleBoundary) {
                // cannot support this
                return text;
            }
            return text
                .toLocaleLowerCase()
                .replace(titleBoundary, (b) => b.toLocaleUpperCase());
        }
    }
    exports.TitleCaseAction = TitleCaseAction;
    TitleCaseAction.titleBoundary = new BackwardsCompatibleRegExp('(^|[^\\p{L}\\p{N}\']|((^|\\P{L})\'))\\p{L}', 'gmu');
    class SnakeCaseAction extends AbstractCaseAction {
        constructor() {
            super({
                id: 'editor.action.transformToSnakecase',
                label: nls.localize('editor.transformToSnakecase', "Transform to Snake Case"),
                alias: 'Transform to Snake Case',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            const caseBoundary = SnakeCaseAction.caseBoundary.get();
            const singleLetters = SnakeCaseAction.singleLetters.get();
            if (!caseBoundary || !singleLetters) {
                // cannot support this
                return text;
            }
            return (text
                .replace(caseBoundary, '$1_$2')
                .replace(singleLetters, '$1_$2$3')
                .toLocaleLowerCase());
        }
    }
    exports.SnakeCaseAction = SnakeCaseAction;
    SnakeCaseAction.caseBoundary = new BackwardsCompatibleRegExp('(\\p{Ll})(\\p{Lu})', 'gmu');
    SnakeCaseAction.singleLetters = new BackwardsCompatibleRegExp('(\\p{Lu}|\\p{N})(\\p{Lu})(\\p{Ll})', 'gmu');
    (0, editorExtensions_1.registerEditorAction)(CopyLinesUpAction);
    (0, editorExtensions_1.registerEditorAction)(CopyLinesDownAction);
    (0, editorExtensions_1.registerEditorAction)(DuplicateSelectionAction);
    (0, editorExtensions_1.registerEditorAction)(MoveLinesUpAction);
    (0, editorExtensions_1.registerEditorAction)(MoveLinesDownAction);
    (0, editorExtensions_1.registerEditorAction)(SortLinesAscendingAction);
    (0, editorExtensions_1.registerEditorAction)(SortLinesDescendingAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteDuplicateLinesAction);
    (0, editorExtensions_1.registerEditorAction)(TrimTrailingWhitespaceAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteLinesAction);
    (0, editorExtensions_1.registerEditorAction)(IndentLinesAction);
    (0, editorExtensions_1.registerEditorAction)(OutdentLinesAction);
    (0, editorExtensions_1.registerEditorAction)(InsertLineBeforeAction);
    (0, editorExtensions_1.registerEditorAction)(InsertLineAfterAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteAllLeftAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteAllRightAction);
    (0, editorExtensions_1.registerEditorAction)(JoinLinesAction);
    (0, editorExtensions_1.registerEditorAction)(TransposeAction);
    (0, editorExtensions_1.registerEditorAction)(UpperCaseAction);
    (0, editorExtensions_1.registerEditorAction)(LowerCaseAction);
    if (SnakeCaseAction.caseBoundary.isSupported() && SnakeCaseAction.singleLetters.isSupported()) {
        (0, editorExtensions_1.registerEditorAction)(SnakeCaseAction);
    }
    if (TitleCaseAction.titleBoundary.isSupported()) {
        (0, editorExtensions_1.registerEditorAction)(TitleCaseAction);
    }
});
//# sourceMappingURL=linesOperations.js.map