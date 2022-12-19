/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, codicons_1, nls_1, actions_1, commands_1, contextkey_1, quickInput_1, coreActions_1, notebookContextKeys_1, notebookCommon_1, notebookService_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.select',
                title: (0, nls_1.localize)('workbench.notebook.layout.select.label', "Select between Notebook Layouts"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true)),
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true)),
                        order: 0
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(commands_1.ICommandService).executeCommand('workbench.action.openWalkthrough', { category: 'notebooks', step: 'notebookProfile' }, true);
        }
    });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.configure',
                title: (0, nls_1.localize)('workbench.notebook.layout.configure.label', "Customize Notebook Layout"),
                f1: true,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true),
                        order: 1
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:notebookLayout' });
        }
    });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.configure.editorTitle',
                title: (0, nls_1.localize)('workbench.notebook.layout.configure.label', "Customize Notebook Layout"),
                f1: false,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayout',
                        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                        order: 1
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:notebookLayout' });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        submenu: actions_1.MenuId.NotebookEditorLayoutConfigure,
        rememberDefaultAction: false,
        title: { value: (0, nls_1.localize)('customizeNotebook', "Customize Notebook..."), original: 'Customize Notebook...', },
        icon: codicons_1.Codicon.gear,
        group: 'navigation',
        order: -1,
        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
    });
    (0, actions_1.registerAction2)(class ToggleLineNumberFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLineNumbersFromEditorTitle',
                title: { value: (0, nls_1.localize)('notebook.toggleLineNumbers', "Toggle Notebook Line Numbers"), original: 'Toggle Notebook Line Numbers' },
                precondition: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 1,
                        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
                    }
                ],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.notEquals('config.notebook.lineNumbers', 'off'),
                    title: { value: (0, nls_1.localize)('notebook.showLineNumbers', "Show Notebook Line Numbers"), original: 'Show Notebook Line Numbers' },
                }
            });
        }
        async run(accessor) {
            return accessor.get(commands_1.ICommandService).executeCommand('notebook.toggleLineNumbers');
        }
    });
    (0, actions_1.registerAction2)(class ToggleCellToolbarPositionFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleCellToolbarPositionFromEditorTitle',
                title: { value: (0, nls_1.localize)('notebook.toggleCellToolbarPosition', "Toggle Cell Toolbar Position"), original: 'Toggle Cell Toolbar Position' },
                menu: [{
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 3
                    }],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: false
            });
        }
        async run(accessor, ...args) {
            return accessor.get(commands_1.ICommandService).executeCommand('notebook.toggleCellToolbarPosition', ...args);
        }
    });
    (0, actions_1.registerAction2)(class ToggleBreadcrumbFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'breadcrumbs.toggleFromEditorTitle',
                title: { value: (0, nls_1.localize)('notebook.toggleBreadcrumb', "Toggle Breadcrumbs"), original: 'Toggle Breadcrumbs' },
                menu: [{
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 2
                    }],
                f1: false
            });
        }
        async run(accessor) {
            return accessor.get(commands_1.ICommandService).executeCommand('breadcrumbs.toggle');
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: 'breadcrumbs.toggle',
            title: { value: (0, nls_1.localize)('cmd.toggle', "Toggle Breadcrumbs"), original: 'Toggle Breadcrumbs' },
        },
        group: 'notebookLayout',
        order: 2
    });
    (0, actions_1.registerAction2)(class SaveMimeTypeDisplayOrder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.saveMimeTypeOrder',
                title: (0, nls_1.localize)('notebook.saveMimeTypeOrder', 'Save Mimetype Display Order'),
                f1: true,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
            });
        }
        run(accessor) {
            const service = accessor.get(notebookService_1.INotebookService);
            const qp = accessor.get(quickInput_1.IQuickInputService).createQuickPick();
            qp.placeholder = (0, nls_1.localize)('notebook.placeholder', 'Settings file to save in');
            qp.items = [
                { target: 1 /* ConfigurationTarget.USER */, label: (0, nls_1.localize)('saveTarget.machine', 'User Settings') },
                { target: 4 /* ConfigurationTarget.WORKSPACE */, label: (0, nls_1.localize)('saveTarget.workspace', 'Workspace Settings') },
            ];
            qp.onDidAccept(() => {
                var _a;
                const target = (_a = qp.selectedItems[0]) === null || _a === void 0 ? void 0 : _a.target;
                if (target !== undefined) {
                    service.saveMimeDisplayOrder(target);
                }
                qp.dispose();
            });
            qp.onDidHide(() => qp.dispose());
            qp.show();
        }
    });
});
//# sourceMappingURL=layoutActions.js.map