/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/mime", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, keyCodes_1, mime_1, bulkEditService_1, nls_1, actions_1, contextkey_1, contextkeys_1, bulkCellEdits_1, cellOperations_1, coreActions_1, notebookBrowser_1, notebookContextKeys_1, icons, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Move/Copy cells
    const MOVE_CELL_UP_COMMAND_ID = 'notebook.cell.moveUp';
    const MOVE_CELL_DOWN_COMMAND_ID = 'notebook.cell.moveDown';
    const COPY_CELL_UP_COMMAND_ID = 'notebook.cell.copyUp';
    const COPY_CELL_DOWN_COMMAND_ID = 'notebook.cell.copyDown';
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: MOVE_CELL_UP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.moveCellUp', "Move Cell Up"),
                icon: icons.moveUpIcon,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.equals('config.notebook.dragAndDropEnabled', false),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 13
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.moveCellRange)(context, 'up');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: MOVE_CELL_DOWN_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.moveCellDown', "Move Cell Down"),
                icon: icons.moveDownIcon,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.equals('config.notebook.dragAndDropEnabled', false),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 14
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.moveCellRange)(context, 'down');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: COPY_CELL_UP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.copyCellUp', "Copy Cell Up"),
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.copyCellRange)(context, 'up');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: COPY_CELL_DOWN_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.copyCellDown', "Copy Cell Down"),
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 12
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.copyCellRange)(context, 'down');
        }
    });
    //#endregion
    //#region Join/Split
    const SPLIT_CELL_COMMAND_ID = 'notebook.cell.split';
    const JOIN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.joinAbove';
    const JOIN_CELL_BELOW_COMMAND_ID = 'notebook.cell.joinBelow';
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: SPLIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.splitCell', "Split Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED.toNegated()),
                    order: 4 /* CellToolbarOrder.SplitCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.splitCellIcon,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Backslash */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            if (context.notebookEditor.isReadOnly) {
                return;
            }
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const cell = context.cell;
            const index = context.notebookEditor.getCellIndex(cell);
            const splitPoints = cell.focusMode === notebookBrowser_1.CellFocusMode.Container ? [{ lineNumber: 1, column: 1 }] : cell.getSelectionsStartPosition();
            if (splitPoints && splitPoints.length > 0) {
                await cell.resolveTextModel();
                if (!cell.hasModel()) {
                    return;
                }
                const newLinesContents = (0, cellOperations_1.computeCellLinesContents)(cell, splitPoints);
                if (newLinesContents) {
                    const language = cell.language;
                    const kind = cell.cellKind;
                    const mime = cell.mime;
                    const textModel = await cell.resolveTextModel();
                    await bulkEditService.apply([
                        new bulkEditService_1.ResourceTextEdit(cell.uri, { range: textModel.getFullModelRange(), text: newLinesContents[0] }),
                        new bulkCellEdits_1.ResourceNotebookCellEdit(context.notebookEditor.textModel.uri, {
                            editType: 1 /* CellEditType.Replace */,
                            index: index + 1,
                            count: 0,
                            cells: newLinesContents.slice(1).map(line => ({
                                cellKind: kind,
                                language,
                                mime,
                                source: line,
                                outputs: [],
                                metadata: {}
                            }))
                        })
                    ], { quotableLabel: 'Split Notebook Cell' });
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: JOIN_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.joinCellAbove', "Join With Previous Cell"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 40 /* KeyCode.KeyJ */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 10
                }
            });
        }
        async runWithContext(accessor, context) {
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            return (0, cellOperations_1.joinCellsWithSurrounds)(bulkEditService, context, 'above');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: JOIN_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.joinCellBelow', "Join With Next Cell"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 40 /* KeyCode.KeyJ */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 11
                }
            });
        }
        async runWithContext(accessor, context) {
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            return (0, cellOperations_1.joinCellsWithSurrounds)(bulkEditService, context, 'below');
        }
    });
    //#endregion
    //#region Change Cell Type
    const CHANGE_CELL_TO_CODE_COMMAND_ID = 'notebook.cell.changeToCode';
    const CHANGE_CELL_TO_MARKDOWN_COMMAND_ID = 'notebook.cell.changeToMarkdown';
    (0, actions_1.registerAction2)(class ChangeCellToCodeAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: CHANGE_CELL_TO_CODE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.changeCellToCode', "Change Cell to Code"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 55 /* KeyCode.KeyY */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                }
            });
        }
        async runWithContext(accessor, context) {
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Code, context);
        }
    });
    (0, actions_1.registerAction2)(class ChangeCellToMarkdownAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: CHANGE_CELL_TO_MARKDOWN_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.changeCellToMarkdown', "Change Cell to Markdown"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 43 /* KeyCode.KeyM */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code')),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code')),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                }
            });
        }
        async runWithContext(accessor, context) {
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Markup, context, 'markdown', mime_1.Mimes.markdown);
        }
    });
    //#endregion
    //#region Collapse Cell
    const COLLAPSE_CELL_INPUT_COMMAND_ID = 'notebook.cell.collapseCellInput';
    const COLLAPSE_CELL_OUTPUT_COMMAND_ID = 'notebook.cell.collapseCellOutput';
    const COLLAPSE_ALL_CELL_INPUTS_COMMAND_ID = 'notebook.cell.collapseAllCellInputs';
    const EXPAND_ALL_CELL_INPUTS_COMMAND_ID = 'notebook.cell.expandAllCellInputs';
    const COLLAPSE_ALL_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.collapseAllCellOutputs';
    const EXPAND_ALL_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.expandAllCellOutputs';
    const TOGGLE_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.toggleOutputs';
    (0, actions_1.registerAction2)(class CollapseCellInputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_CELL_INPUT_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.collapseCellInput', "Collapse Cell Input"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED.toNegated(), contextkeys_1.InputFocusedContext.toNegated()),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isInputCollapsed = true;
            }
            else {
                context.selectedCells.forEach(cell => cell.isInputCollapsed = true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExpandCellInputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.EXPAND_CELL_INPUT_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.expandCellInput', "Expand Cell Input"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isInputCollapsed = false;
            }
            else {
                context.selectedCells.forEach(cell => cell.isInputCollapsed = false);
            }
        }
    });
    (0, actions_1.registerAction2)(class CollapseCellOutputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_CELL_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.collapseCellOutput', "Collapse Cell Output"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_OUTPUT_COLLAPSED.toNegated(), contextkeys_1.InputFocusedContext.toNegated(), notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 50 /* KeyCode.KeyT */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isOutputCollapsed = true;
            }
            else {
                context.selectedCells.forEach(cell => cell.isOutputCollapsed = true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExpandCellOuputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.EXPAND_CELL_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.expandCellOutput', "Expand Cell Output"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_OUTPUT_COLLAPSED),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 50 /* KeyCode.KeyT */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isOutputCollapsed = false;
            }
            else {
                context.selectedCells.forEach(cell => cell.isOutputCollapsed = false);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: TOGGLE_CELL_OUTPUTS_COMMAND_ID,
                precondition: notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED,
                title: (0, nls_1.localize)('notebookActions.toggleOutputs', "Toggle Outputs"),
                description: {
                    description: (0, nls_1.localize)('notebookActions.toggleOutputs', "Toggle Outputs"),
                    args: coreActions_1.cellExecutionArgs
                }
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let cells = [];
            if (context.ui) {
                cells = [context.cell];
            }
            else if (context.selectedCells) {
                cells = context.selectedCells;
            }
            for (const cell of cells) {
                cell.isOutputCollapsed = !cell.isOutputCollapsed;
            }
        }
    });
    (0, actions_1.registerAction2)(class CollapseAllCellInputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_ALL_CELL_INPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.collapseAllCellInput', "Collapse All Cell Inputs"),
                f1: true,
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isInputCollapsed = true);
        }
    });
    (0, actions_1.registerAction2)(class ExpandAllCellInputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXPAND_ALL_CELL_INPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.expandAllCellInput', "Expand All Cell Inputs"),
                f1: true
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isInputCollapsed = false);
        }
    });
    (0, actions_1.registerAction2)(class CollapseAllCellOutputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_ALL_CELL_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.collapseAllCellOutput', "Collapse All Cell Outputs"),
                f1: true,
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isOutputCollapsed = true);
        }
    });
    (0, actions_1.registerAction2)(class ExpandAllCellOutputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXPAND_ALL_CELL_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.expandAllCellOutput', "Expand All Cell Outputs"),
                f1: true
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isOutputCollapsed = false);
        }
    });
    //#endregion
    function forEachCell(editor, callback) {
        for (let i = 0; i < editor.getLength(); i++) {
            const cell = editor.cellAt(i);
            callback(cell, i);
        }
    }
});
//# sourceMappingURL=cellCommands.js.map