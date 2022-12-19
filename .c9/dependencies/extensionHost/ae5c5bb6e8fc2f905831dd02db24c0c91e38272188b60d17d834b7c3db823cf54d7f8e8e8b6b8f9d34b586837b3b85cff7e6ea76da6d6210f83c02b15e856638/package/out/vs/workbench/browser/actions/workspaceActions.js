/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/workbench/common/contextkeys", "vs/workbench/services/host/browser/host", "vs/base/common/keyCodes", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspaces/common/workspaces", "vs/platform/contextkey/common/contextkeys"], function (require, exports, nls_1, workspace_1, workspaceEditing_1, editorService_1, commands_1, workspaceCommands_1, dialogs_1, actions_1, contextkeys_1, host_1, keyCodes_1, contextkey_1, environmentService_1, workspaces_1, contextkeys_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AddRootFolderAction = exports.OpenFileFolderAction = exports.OpenFolderViaWorkspaceAction = exports.OpenFolderAction = exports.OpenFileAction = void 0;
    const workspacesCategory = { value: (0, nls_1.localize)('workspaces', "Workspaces"), original: 'Workspaces' };
    const fileCategory = { value: (0, nls_1.localize)('filesCategory', "File"), original: 'File' };
    class OpenFileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenFileAction.ID,
                title: { value: (0, nls_1.localize)('openFile', "Open File..."), original: 'Open File...' },
                category: fileCategory,
                f1: true,
                precondition: contextkeys_2.IsMacNativeContext.toNegated(),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFileAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFileAction = OpenFileAction;
    OpenFileAction.ID = 'workbench.action.files.openFile';
    class OpenFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenFolderAction.ID,
                title: { value: (0, nls_1.localize)('openFolder', "Open Folder..."), original: 'Open Folder...' },
                category: fileCategory,
                f1: true,
                precondition: contextkeys_1.OpenFolderWorkspaceSupportContext,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: undefined,
                    linux: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */)
                    },
                    win: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */)
                    }
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFolderAction = OpenFolderAction;
    OpenFolderAction.ID = 'workbench.action.files.openFolder';
    class OpenFolderViaWorkspaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenFolderViaWorkspaceAction.ID,
                title: { value: (0, nls_1.localize)('openFolder', "Open Folder..."), original: 'Open Folder...' },
                category: fileCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated(), contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(workspaceCommands_1.SET_ROOT_FOLDER_COMMAND_ID);
        }
    }
    exports.OpenFolderViaWorkspaceAction = OpenFolderViaWorkspaceAction;
    // This action swaps the folders of a workspace with
    // the selected folder and is a workaround for providing
    // "Open Folder..." in environments that do not support
    // this without having a workspace open (e.g. web serverless)
    OpenFolderViaWorkspaceAction.ID = 'workbench.action.files.openFolderViaWorkspace';
    class OpenFileFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenFileFolderAction.ID,
                title: OpenFileFolderAction.LABEL,
                category: fileCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsMacNativeContext, contextkeys_1.OpenFolderWorkspaceSupportContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFileFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFileFolderAction = OpenFileFolderAction;
    OpenFileFolderAction.ID = 'workbench.action.files.openFileFolder';
    OpenFileFolderAction.LABEL = { value: (0, nls_1.localize)('openFileFolder', "Open..."), original: 'Open...' };
    class OpenWorkspaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenWorkspaceAction.ID,
                title: { value: (0, nls_1.localize)('openWorkspaceAction', "Open Workspace from File..."), original: 'Open Workspace from File...' },
                category: fileCategory,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickWorkspaceAndOpen({ telemetryExtraData: data });
        }
    }
    OpenWorkspaceAction.ID = 'workbench.action.openWorkspace';
    class CloseWorkspaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: CloseWorkspaceAction.ID,
                title: { value: (0, nls_1.localize)('closeWorkspace', "Close Workspace"), original: 'Close Workspace' },
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkeys_1.EmptyWorkspaceSupportContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 36 /* KeyCode.KeyF */)
                }
            });
        }
        async run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            return hostService.openWindow({ forceReuseWindow: true, remoteAuthority: environmentService.remoteAuthority });
        }
    }
    CloseWorkspaceAction.ID = 'workbench.action.closeFolder';
    class OpenWorkspaceConfigFileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenWorkspaceConfigFileAction.ID,
                title: { value: (0, nls_1.localize)('openWorkspaceConfigFile', "Open Workspace Configuration File"), original: 'Open Workspace Configuration File' },
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
            });
        }
        async run(accessor) {
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const configuration = contextService.getWorkspace().configuration;
            if (configuration) {
                await editorService.openEditor({ resource: configuration, options: { pinned: true } });
            }
        }
    }
    OpenWorkspaceConfigFileAction.ID = 'workbench.action.openWorkspaceConfigFile';
    class AddRootFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: AddRootFolderAction.ID,
                title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL,
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID);
        }
    }
    exports.AddRootFolderAction = AddRootFolderAction;
    AddRootFolderAction.ID = 'workbench.action.addRootFolder';
    class RemoveRootFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: RemoveRootFolderAction.ID,
                title: { value: (0, nls_1.localize)('globalRemoveFolderFromWorkspace', "Remove Folder from Workspace..."), original: 'Remove Folder from Workspace...' },
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'), contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))
            });
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const folder = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            if (folder) {
                await workspaceEditingService.removeFolders([folder.uri]);
            }
        }
    }
    RemoveRootFolderAction.ID = 'workbench.action.removeRootFolder';
    class SaveWorkspaceAsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: SaveWorkspaceAsAction.ID,
                title: { value: (0, nls_1.localize)('saveWorkspaceAsAction', "Save Workspace As..."), original: 'Save Workspace As...' },
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor) {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const configPathUri = await workspaceEditingService.pickNewWorkspacePath();
            if (configPathUri && (0, workspace_1.hasWorkspaceFileExtension)(configPathUri)) {
                switch (contextService.getWorkbenchState()) {
                    case 1 /* WorkbenchState.EMPTY */:
                    case 2 /* WorkbenchState.FOLDER */: {
                        const folders = contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
                        return workspaceEditingService.createAndEnterWorkspace(folders, configPathUri);
                    }
                    case 3 /* WorkbenchState.WORKSPACE */:
                        return workspaceEditingService.saveAndEnterWorkspace(configPathUri);
                }
            }
        }
    }
    SaveWorkspaceAsAction.ID = 'workbench.action.saveWorkspaceAs';
    class DuplicateWorkspaceInNewWindowAction extends actions_1.Action2 {
        constructor() {
            super({
                id: DuplicateWorkspaceInNewWindowAction.ID,
                title: { value: (0, nls_1.localize)('duplicateWorkspaceInNewWindow', "Duplicate As Workspace in New Window"), original: 'Duplicate As Workspace in New Window' },
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor) {
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const hostService = accessor.get(host_1.IHostService);
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            const folders = workspaceContextService.getWorkspace().folders;
            const remoteAuthority = environmentService.remoteAuthority;
            const newWorkspace = await workspacesService.createUntitledWorkspace(folders, remoteAuthority);
            await workspaceEditingService.copyWorkspaceSettings(newWorkspace);
            return hostService.openWindow([{ workspaceUri: newWorkspace.configPath }], { forceNewWindow: true, remoteAuthority });
        }
    }
    DuplicateWorkspaceInNewWindowAction.ID = 'workbench.action.duplicateWorkspaceInNewWindow';
    // --- Actions Registration
    (0, actions_1.registerAction2)(AddRootFolderAction);
    (0, actions_1.registerAction2)(RemoveRootFolderAction);
    (0, actions_1.registerAction2)(OpenFileAction);
    (0, actions_1.registerAction2)(OpenFolderAction);
    (0, actions_1.registerAction2)(OpenFolderViaWorkspaceAction);
    (0, actions_1.registerAction2)(OpenFileFolderAction);
    (0, actions_1.registerAction2)(OpenWorkspaceAction);
    (0, actions_1.registerAction2)(OpenWorkspaceConfigFileAction);
    (0, actions_1.registerAction2)(CloseWorkspaceAction);
    (0, actions_1.registerAction2)(SaveWorkspaceAsAction);
    (0, actions_1.registerAction2)(DuplicateWorkspaceInNewWindowAction);
    // --- Menu Registration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFileAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFile', comment: ['&& denotes a mnemonic'] }, "&&Open File...")
        },
        order: 1,
        when: contextkeys_2.IsMacNativeContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFolderAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
        },
        order: 2,
        when: contextkeys_1.OpenFolderWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFolderViaWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
        },
        order: 2,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated(), contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFileFolderAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpen', comment: ['&& denotes a mnemonic'] }, "&&Open...")
        },
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsMacNativeContext, contextkeys_1.OpenFolderWorkspaceSupportContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenWorkspace', comment: ['&& denotes a mnemonic'] }, "Open Wor&&kspace from File...")
        },
        order: 3,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: (0, nls_1.localize)({ key: 'miAddFolderToWorkspace', comment: ['&& denotes a mnemonic'] }, "A&&dd Folder to Workspace...")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: SaveWorkspaceAsAction.ID,
            title: (0, nls_1.localize)('miSaveWorkspaceAs', "Save Workspace As...")
        },
        order: 2,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: DuplicateWorkspaceInNewWindowAction.ID,
            title: (0, nls_1.localize)('duplicateWorkspace', "Duplicate Workspace")
        },
        order: 3,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miCloseFolder', comment: ['&& denotes a mnemonic'] }, "Close &&Folder")
        },
        order: 3,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('folder'), contextkeys_1.EmptyWorkspaceSupportContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miCloseWorkspace', comment: ['&& denotes a mnemonic'] }, "Close &&Workspace")
        },
        order: 3,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkeys_1.EmptyWorkspaceSupportContext)
    });
});
//# sourceMappingURL=workspaceActions.js.map