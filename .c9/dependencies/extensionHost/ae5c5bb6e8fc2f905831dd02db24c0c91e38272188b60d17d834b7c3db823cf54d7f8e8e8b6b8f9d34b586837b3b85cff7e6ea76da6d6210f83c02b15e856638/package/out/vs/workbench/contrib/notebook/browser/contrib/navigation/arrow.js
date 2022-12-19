/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/registry/common/platform", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/editor/browser/editorExtensions"], function (require, exports, editorContextKeys_1, nls_1, actions_1, configurationRegistry_1, contextkey_1, contextkeys_1, platform_1, coreActions_1, notebookContextKeys_1, notebookBrowser_1, notebookCommon_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CENTER_ACTIVE_CELL = void 0;
    const NOTEBOOK_FOCUS_TOP = 'notebook.focusTop';
    const NOTEBOOK_FOCUS_BOTTOM = 'notebook.focusBottom';
    const NOTEBOOK_FOCUS_PREVIOUS_EDITOR = 'notebook.focusPreviousEditor';
    const NOTEBOOK_FOCUS_NEXT_EDITOR = 'notebook.focusNextEditor';
    const FOCUS_IN_OUTPUT_COMMAND_ID = 'notebook.cell.focusInOutput';
    const FOCUS_OUT_OUTPUT_COMMAND_ID = 'notebook.cell.focusOutOutput';
    exports.CENTER_ACTIVE_CELL = 'notebook.centerActiveCell';
    const NOTEBOOK_CURSOR_PAGEUP_COMMAND_ID = 'notebook.cell.cursorPageUp';
    const NOTEBOOK_CURSOR_PAGEUP_SELECT_COMMAND_ID = 'notebook.cell.cursorPageUpSelect';
    const NOTEBOOK_CURSOR_PAGEDOWN_COMMAND_ID = 'notebook.cell.cursorPageDown';
    const NOTEBOOK_CURSOR_PAGEDOWN_SELECT_COMMAND_ID = 'notebook.cell.cursorPageDownSelect';
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_NEXT_EDITOR,
                title: (0, nls_1.localize)('cursorMoveDown', 'Focus Next Cell Editor'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('top'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none'), contextkey_1.ContextKeyExpr.equals('config.notebook.navigation.allowNavigateToSurroundingCells', true)),
                        primary: 18 /* KeyCode.DownArrow */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = editor.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            if (idx >= editor.getLength() - 1) {
                // last one
                return;
            }
            const newCell = editor.cellAt(idx + 1);
            const newFocusMode = newCell.cellKind === notebookCommon_1.CellKind.Markup && newCell.getEditState() === notebookBrowser_1.CellEditState.Preview ? 'container' : 'editor';
            editor.focusNotebookCell(newCell, newFocusMode);
            editor.cursorNavigationMode = true;
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_PREVIOUS_EDITOR,
                title: (0, nls_1.localize)('cursorMoveUp', 'Focus Previous Cell Editor'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('bottom'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none'), contextkey_1.ContextKeyExpr.equals('config.notebook.navigation.allowNavigateToSurroundingCells', true)),
                    primary: 16 /* KeyCode.UpArrow */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = editor.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            if (idx < 1 || editor.getLength() === 0) {
                // we don't do loop
                return;
            }
            const newCell = editor.cellAt(idx - 1);
            const newFocusMode = newCell.cellKind === notebookCommon_1.CellKind.Markup && newCell.getEditState() === notebookBrowser_1.CellEditState.Preview ? 'container' : 'editor';
            editor.focusNotebookCell(newCell, newFocusMode);
            editor.cursorNavigationMode = true;
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_TOP,
                title: (0, nls_1.localize)('focusFirstCell', 'Focus First Cell'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (editor.getLength() === 0) {
                return;
            }
            const firstCell = editor.cellAt(0);
            editor.focusNotebookCell(firstCell, 'container');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_BOTTOM,
                title: (0, nls_1.localize)('focusLastCell', 'Focus Last Cell'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (!editor.hasModel() || editor.getLength() === 0) {
                return;
            }
            const lastIdx = editor.getLength() - 1;
            const lastVisibleIdx = editor.getPreviousVisibleCellIndex(lastIdx);
            if (lastVisibleIdx) {
                const cell = editor.cellAt(lastVisibleIdx);
                editor.focusNotebookCell(cell, 'container');
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: FOCUS_IN_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize)('focusOutput', 'Focus In Active Cell Output'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            editor.focusNotebookCell(activeCell, 'output');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: FOCUS_OUT_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize)('focusOutputOut', 'Focus Out Active Cell Output'),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */, },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            editor.focusNotebookCell(activeCell, 'editor');
        }
    });
    (0, actions_1.registerAction2)(class CenterActiveCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: exports.CENTER_ACTIVE_CELL,
                title: (0, nls_1.localize)('notebookActions.centerActiveCell', "Center Active Cell"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 42 /* KeyCode.KeyL */,
                    },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.revealInCenter(context.cell);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEUP_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageUp', "Cell Cursor Page Up"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                        primary: 11 /* KeyCode.PageUp */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageUp').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEUP_SELECT_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageUpSelect', "Cell Cursor Page Up Select"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                        primary: 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageUpSelect').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEDOWN_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageDown', "Cell Cursor Page Down"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                        primary: 12 /* KeyCode.PageDown */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageDown').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEDOWN_SELECT_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageDownSelect', "Cell Cursor Page Down Select"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                        primary: 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageDownSelect').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    function getPageSize(context) {
        const editor = context.notebookEditor;
        const layoutInfo = editor._getViewModel().layoutInfo;
        const lineHeight = (layoutInfo === null || layoutInfo === void 0 ? void 0 : layoutInfo.fontInfo.lineHeight) || 17;
        return Math.max(1, Math.floor(((layoutInfo === null || layoutInfo === void 0 ? void 0 : layoutInfo.height) || 0) / lineHeight) - 2);
    }
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            'notebook.navigation.allowNavigateToSurroundingCells': {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('notebook.navigation.allowNavigateToSurroundingCells', "When enabled cursor can navigate to the next/previous cell when the current cursor in the cell editor is at the first/last line.")
            }
        }
    });
});
//# sourceMappingURL=arrow.js.map