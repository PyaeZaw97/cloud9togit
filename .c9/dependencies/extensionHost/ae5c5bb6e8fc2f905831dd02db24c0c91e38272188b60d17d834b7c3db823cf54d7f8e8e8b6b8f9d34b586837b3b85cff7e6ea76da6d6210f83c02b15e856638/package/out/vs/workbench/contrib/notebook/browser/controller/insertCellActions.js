/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, codicons_1, language_1, nls_1, actions_1, contextkey_1, contextkeys_1, cellOperations_1, coreActions_1, notebookContextKeys_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const INSERT_CODE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertCodeCellAbove';
    const INSERT_CODE_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertCodeCellBelow';
    const INSERT_CODE_CELL_ABOVE_AND_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.insertCodeCellAboveAndFocusContainer';
    const INSERT_CODE_CELL_BELOW_AND_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.insertCodeCellBelowAndFocusContainer';
    const INSERT_CODE_CELL_AT_TOP_COMMAND_ID = 'notebook.cell.insertCodeCellAtTop';
    const INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertMarkdownCellAbove';
    const INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertMarkdownCellBelow';
    const INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID = 'notebook.cell.insertMarkdownCellAtTop';
    class InsertCellCommand extends coreActions_1.NotebookAction {
        constructor(desc, kind, direction, focusEditor) {
            super(desc);
            this.kind = kind;
            this.direction = direction;
            this.focusEditor = focusEditor;
        }
        async runWithContext(accessor, context) {
            let newCell = null;
            if (context.ui) {
                context.notebookEditor.focus();
            }
            const languageService = accessor.get(language_1.ILanguageService);
            if (context.cell) {
                const idx = context.notebookEditor.getCellIndex(context.cell);
                newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, this.kind, this.direction, undefined, true);
            }
            else {
                const focusRange = context.notebookEditor.getFocus();
                const next = Math.max(focusRange.end - 1, 0);
                newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, next, this.kind, this.direction, undefined, true);
            }
            if (newCell) {
                context.notebookEditor.focusNotebookCell(newCell, this.focusEditor ? 'editor' : 'container');
            }
        }
    }
    (0, actions_1.registerAction2)(class InsertCodeCellAboveAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAbove', "Insert Code Cell Above"),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 0
                }
            }, notebookCommon_1.CellKind.Code, 'above', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellAboveAndFocusContainerAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_AND_FOCUS_CONTAINER_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAboveAndFocusContainer', "Insert Code Cell Above and Focus Container")
            }, notebookCommon_1.CellKind.Code, 'above', false);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellBelowAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellBelow', "Insert Code Cell Below"),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 1
                }
            }, notebookCommon_1.CellKind.Code, 'below', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellBelowAndFocusContainerAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_AND_FOCUS_CONTAINER_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellBelowAndFocusContainer', "Insert Code Cell Below and Focus Container"),
            }, notebookCommon_1.CellKind.Code, 'below', false);
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellAboveAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellAbove', "Insert Markdown Cell Above"),
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 2
                }
            }, notebookCommon_1.CellKind.Markup, 'above', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellBelowAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellBelow', "Insert Markdown Cell Below"),
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 3
                }
            }, notebookCommon_1.CellKind.Markup, 'below', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellAtTopAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAtTop', "Add Code Cell At Top"),
                f1: false
            });
        }
        async run(accessor, context) {
            context = context !== null && context !== void 0 ? context : this.getEditorContextFromArgsOrActive(accessor);
            if (context) {
                this.runWithContext(accessor, context);
            }
        }
        async runWithContext(accessor, context) {
            const languageService = accessor.get(language_1.ILanguageService);
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, 0, notebookCommon_1.CellKind.Code, 'above', undefined, true);
            if (newCell) {
                context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellAtTopAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellAtTop', "Add Markdown Cell At Top"),
                f1: false
            });
        }
        async run(accessor, context) {
            context = context !== null && context !== void 0 ? context : this.getEditorContextFromArgsOrActive(accessor);
            if (context) {
                this.runWithContext(accessor, context);
            }
        }
        async runWithContext(accessor, context) {
            const languageService = accessor.get(language_1.ILanguageService);
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, 0, notebookCommon_1.CellKind.Markup, 'above', undefined, true);
            if (newCell) {
                context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode', "$(add) Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.minimalToolbar', "Add Code"),
            icon: codicons_1.Codicon.add,
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.equals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            icon: codicons_1.Codicon.add,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.ontoolbar', "Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: -5,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode', "$(add) Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.minimaltoolbar', "Add Code"),
            icon: codicons_1.Codicon.add,
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.equals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertMarkdown', "$(add) Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: 1,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
            icon: codicons_1.Codicon.add,
            title: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.ontoolbar', "Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: -5,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'), contextkey_1.ContextKeyExpr.notEquals(`config.${notebookCommon_1.NotebookSetting.globalToolbarShowLabel}`, false), contextkey_1.ContextKeyExpr.notEquals(`config.${notebookCommon_1.NotebookSetting.globalToolbarShowLabel}`, 'never'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertMarkdown', "$(add) Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: 1,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
});
//# sourceMappingURL=insertCellActions.js.map