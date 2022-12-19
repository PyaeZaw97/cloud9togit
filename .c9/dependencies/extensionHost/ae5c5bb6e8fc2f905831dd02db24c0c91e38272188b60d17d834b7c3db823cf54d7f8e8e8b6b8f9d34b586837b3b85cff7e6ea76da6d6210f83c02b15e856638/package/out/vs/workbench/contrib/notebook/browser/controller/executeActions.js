/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/base/common/network"], function (require, exports, iterator_1, uri_1, language_1, nls_1, actions_1, contextkey_1, themeService_1, cellOperations_1, coreActions_1, notebookContextKeys_1, notebookBrowser_1, icons, notebookCommon_1, notebookEditorInput_1, notebookExecutionStateService_1, editorGroupsService_1, editorService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.executeThisCellCondition = exports.executeCondition = void 0;
    const EXECUTE_NOTEBOOK_COMMAND_ID = 'notebook.execute';
    const CANCEL_NOTEBOOK_COMMAND_ID = 'notebook.cancelExecution';
    const CANCEL_CELL_COMMAND_ID = 'notebook.cell.cancelExecution';
    const EXECUTE_CELL_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.executeAndFocusContainer';
    const EXECUTE_CELL_SELECT_BELOW = 'notebook.cell.executeAndSelectBelow';
    const EXECUTE_CELL_INSERT_BELOW = 'notebook.cell.executeAndInsertBelow';
    const EXECUTE_CELL_AND_BELOW = 'notebook.cell.executeCellAndBelow';
    const EXECUTE_CELLS_ABOVE = 'notebook.cell.executeCellsAbove';
    const RENDER_ALL_MARKDOWN_CELLS = 'notebook.renderAllMarkdownCells';
    const REVEAL_RUNNING_CELL = 'notebook.revealRunningCell';
    // If this changes, update getCodeCellExecutionContextKeyService to match
    exports.executeCondition = contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.key, 0), notebookContextKeys_1.NOTEBOOK_MISSING_KERNEL_EXTENSION));
    exports.executeThisCellCondition = contextkey_1.ContextKeyExpr.and(exports.executeCondition, notebookContextKeys_1.NOTEBOOK_CELL_EXECUTING.toNegated());
    function renderAllMarkdownCells(context) {
        for (let i = 0; i < context.notebookEditor.getLength(); i++) {
            const cell = context.notebookEditor.cellAt(i);
            if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'renderAllMarkdownCells');
            }
        }
    }
    async function runCell(accessor, context) {
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const group = editorGroupService.activeGroup;
        if (group) {
            if (group.activeEditor) {
                group.pinEditor(group.activeEditor);
            }
        }
        if (context.ui && context.cell) {
            await context.notebookEditor.executeNotebookCells(iterator_1.Iterable.single(context.cell));
            if (context.autoReveal) {
                const cellIndex = context.notebookEditor.getCellIndex(context.cell);
                context.notebookEditor.revealCellRangeInView({ start: cellIndex, end: cellIndex + 1 });
            }
        }
        else if (context.selectedCells) {
            await context.notebookEditor.executeNotebookCells(context.selectedCells);
            const firstCell = context.selectedCells[0];
            if (firstCell && context.autoReveal) {
                const cellIndex = context.notebookEditor.getCellIndex(firstCell);
                context.notebookEditor.revealCellRangeInView({ start: cellIndex, end: cellIndex + 1 });
            }
        }
    }
    (0, actions_1.registerAction2)(class RenderAllMarkdownCellsAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: RENDER_ALL_MARKDOWN_CELLS,
                title: (0, nls_1.localize)('notebookActions.renderMarkdown', "Render All Markdown Cells"),
            });
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
        }
    });
    (0, actions_1.registerAction2)(class ExecuteNotebookAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: EXECUTE_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.executeNotebook', "Run All"),
                icon: icons.executeAllIcon,
                description: {
                    description: (0, nls_1.localize)('notebookActions.executeNotebook', "Run All"),
                    args: [
                        {
                            name: 'uri',
                            description: 'The document uri'
                        }
                    ]
                },
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.toNegated()), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.toNegated()), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    }
                ]
            });
        }
        getEditorContextFromArgsOrActive(accessor, context) {
            var _a;
            return (_a = (0, coreActions_1.getContextFromUri)(accessor, context)) !== null && _a !== void 0 ? _a : (0, coreActions_1.getContextFromActiveEditor)(accessor.get(editorService_1.IEditorService));
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).find(editor => editor.editor instanceof notebookEditorInput_1.NotebookEditorInput && editor.editor.viewType === context.notebookEditor.textModel.viewType && editor.editor.resource.toString() === context.notebookEditor.textModel.uri.toString());
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            if (editor) {
                const group = editorGroupService.getGroup(editor.groupId);
                group === null || group === void 0 ? void 0 : group.pinEditor(editor.editor);
            }
            return context.notebookEditor.executeNotebookCells();
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCell extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.EXECUTE_CELL_COMMAND_ID,
                precondition: exports.executeThisCellCondition,
                title: (0, nls_1.localize)('notebookActions.execute', "Execute Cell"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED,
                    primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                    win: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                    },
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellExecutePrimary,
                    when: exports.executeThisCellCondition,
                    group: 'inline'
                },
                description: {
                    description: (0, nls_1.localize)('notebookActions.execute', "Execute Cell"),
                    args: coreActions_1.cellExecutionArgs
                },
                icon: icons.executeIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            return runCell(accessor, context);
        }
    });
    (0, actions_1.registerAction2)(class ExecuteAboveCells extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELLS_ABOVE,
                precondition: exports.executeCondition,
                title: (0, nls_1.localize)('notebookActions.executeAbove', "Execute Above Cells"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellExecute,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, true))
                    },
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        order: 1 /* CellToolbarOrder.ExecuteAboveCells */,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, false))
                    }
                ],
                icon: icons.executeAboveIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let endCellIdx = undefined;
            if (context.ui) {
                endCellIdx = context.notebookEditor.getCellIndex(context.cell);
                context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                endCellIdx = Math.min(...context.selectedCells.map(cell => context.notebookEditor.getCellIndex(cell)));
            }
            if (typeof endCellIdx === 'number') {
                const range = { start: 0, end: endCellIdx };
                const cells = context.notebookEditor.getCellsInRange(range);
                context.notebookEditor.executeNotebookCells(cells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellAndBelow extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_AND_BELOW,
                precondition: exports.executeCondition,
                title: (0, nls_1.localize)('notebookActions.executeBelow', "Execute Cell and Below"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellExecute,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, true))
                    },
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        order: 2 /* CellToolbarOrder.ExecuteCellAndBelow */,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, false))
                    }
                ],
                icon: icons.executeBelowIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let startCellIdx = undefined;
            if (context.ui) {
                startCellIdx = context.notebookEditor.getCellIndex(context.cell);
                context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                startCellIdx = Math.min(...context.selectedCells.map(cell => context.notebookEditor.getCellIndex(cell)));
            }
            if (typeof startCellIdx === 'number') {
                const range = { start: startCellIdx, end: context.notebookEditor.getLength() };
                const cells = context.notebookEditor.getCellsInRange(range);
                context.notebookEditor.executeNotebookCells(cells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellFocusContainer extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_FOCUS_CONTAINER_COMMAND_ID,
                precondition: exports.executeThisCellCondition,
                title: (0, nls_1.localize)('notebookActions.executeAndFocusContainer', "Execute Cell and Focus Container"),
                description: {
                    description: (0, nls_1.localize)('notebookActions.executeAndFocusContainer', "Execute Cell and Focus Container"),
                    args: coreActions_1.cellExecutionArgs
                },
                icon: icons.executeIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                const firstCell = context.selectedCells[0];
                if (firstCell) {
                    context.notebookEditor.focusNotebookCell(firstCell, 'container', { skipReveal: true });
                }
            }
            await runCell(accessor, context);
        }
    });
    const cellCancelCondition = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.key, 'executing'), contextkey_1.ContextKeyExpr.equals(notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.key, 'pending'));
    (0, actions_1.registerAction2)(class CancelExecuteCell extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: CANCEL_CELL_COMMAND_ID,
                precondition: cellCancelCondition,
                title: (0, nls_1.localize)('notebookActions.cancel', "Stop Cell Execution"),
                icon: icons.stopIcon,
                menu: {
                    id: actions_1.MenuId.NotebookCellExecutePrimary,
                    when: cellCancelCondition,
                    group: 'inline'
                },
                description: {
                    description: (0, nls_1.localize)('notebookActions.cancel', "Stop Cell Execution"),
                    args: [
                        {
                            name: 'options',
                            description: 'The cell range options',
                            schema: {
                                'type': 'object',
                                'required': ['ranges'],
                                'properties': {
                                    'ranges': {
                                        'type': 'array',
                                        items: [
                                            {
                                                'type': 'object',
                                                'required': ['start', 'end'],
                                                'properties': {
                                                    'start': {
                                                        'type': 'number'
                                                    },
                                                    'end': {
                                                        'type': 'number'
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    'document': {
                                        'type': 'object',
                                        'description': 'The document uri',
                                    }
                                }
                            }
                        }
                    ]
                },
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
                return context.notebookEditor.cancelNotebookCells(iterator_1.Iterable.single(context.cell));
            }
            else {
                return context.notebookEditor.cancelNotebookCells(context.selectedCells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellSelectBelow extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_SELECT_BELOW,
                precondition: contextkey_1.ContextKeyExpr.or(exports.executeThisCellCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                title: (0, nls_1.localize)('notebookActions.executeAndSelectBelow', "Execute Notebook Cell and Select Below"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED,
                    primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const idx = context.notebookEditor.getCellIndex(context.cell);
            if (typeof idx !== 'number') {
                return;
            }
            const languageService = accessor.get(language_1.ILanguageService);
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                const nextCell = context.notebookEditor.cellAt(idx + 1);
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, EXECUTE_CELL_SELECT_BELOW);
                if (nextCell) {
                    context.notebookEditor.focusNotebookCell(nextCell, 'container');
                }
                else {
                    const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, notebookCommon_1.CellKind.Markup, 'below');
                    if (newCell) {
                        context.notebookEditor.focusNotebookCell(newCell, 'editor');
                    }
                }
                return;
            }
            else {
                // Try to select below, fall back on inserting
                const nextCell = context.notebookEditor.cellAt(idx + 1);
                if (nextCell) {
                    context.notebookEditor.focusNotebookCell(nextCell, 'container');
                }
                else {
                    const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, notebookCommon_1.CellKind.Code, 'below');
                    if (newCell) {
                        context.notebookEditor.focusNotebookCell(newCell, 'editor');
                    }
                }
                return runCell(accessor, context);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellInsertBelow extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_INSERT_BELOW,
                precondition: contextkey_1.ContextKeyExpr.or(exports.executeThisCellCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                title: (0, nls_1.localize)('notebookActions.executeAndInsertBelow', "Execute Notebook Cell and Insert Below"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED,
                    primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const idx = context.notebookEditor.getCellIndex(context.cell);
            const languageService = accessor.get(language_1.ILanguageService);
            const newFocusMode = context.cell.focusMode === notebookBrowser_1.CellFocusMode.Editor ? 'editor' : 'container';
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, context.cell.cellKind, 'below');
            if (newCell) {
                context.notebookEditor.focusNotebookCell(newCell, newFocusMode);
            }
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, EXECUTE_CELL_INSERT_BELOW);
            }
            else {
                runCell(accessor, context);
            }
        }
    });
    (0, actions_1.registerAction2)(class CancelNotebook extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: CANCEL_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.cancelNotebook', "Stop Execution"),
                icon: icons.stopIcon,
                description: {
                    description: (0, nls_1.localize)('notebookActions.cancelNotebook', "Stop Execution"),
                    args: [
                        {
                            name: 'uri',
                            description: 'The document uri',
                            constraint: uri_1.URI
                        }
                    ]
                },
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    }
                ]
            });
        }
        getEditorContextFromArgsOrActive(accessor, context) {
            var _a;
            return (_a = (0, coreActions_1.getContextFromUri)(accessor, context)) !== null && _a !== void 0 ? _a : (0, coreActions_1.getContextFromActiveEditor)(accessor.get(editorService_1.IEditorService));
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.cancelNotebookCells();
        }
    });
    (0, actions_1.registerAction2)(class RevealRunningCellAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: REVEAL_RUNNING_CELL,
                title: (0, nls_1.localize)('revealRunningCell', "Go To Running Cell"),
                precondition: notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.InteractiveToolbar,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.vscodeInteractive)),
                        group: 'navigation',
                        order: 10
                    }
                ],
                icon: themeService_1.ThemeIcon.modify(icons.executingStateIcon, 'spin')
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const notebook = context.notebookEditor.textModel.uri;
            const executingCells = notebookExecutionStateService.getCellExecutionStatesForNotebook(notebook);
            if (executingCells[0]) {
                const cell = context.notebookEditor.getCellByHandle(executingCells[0].cellHandle);
                if (cell) {
                    context.notebookEditor.revealInCenter(cell);
                }
            }
        }
    });
});
//# sourceMappingURL=executeActions.js.map