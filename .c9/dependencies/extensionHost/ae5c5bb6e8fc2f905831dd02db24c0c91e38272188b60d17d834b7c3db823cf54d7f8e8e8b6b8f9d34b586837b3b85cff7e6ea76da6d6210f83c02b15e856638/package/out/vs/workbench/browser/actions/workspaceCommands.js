/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/resources", "vs/base/common/cancellation", "vs/base/common/labels", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/dialogs/common/dialogs", "vs/base/common/uri", "vs/base/common/network", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/path/common/pathService"], function (require, exports, nls_1, workspace_1, workspaceEditing_1, resources_1, cancellation_1, labels_1, commands_1, files_1, label_1, quickInput_1, getIconClasses_1, model_1, language_1, dialogs_1, uri_1, network_1, workspaces_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PICK_WORKSPACE_FOLDER_COMMAND_ID = exports.SET_ROOT_FOLDER_COMMAND_ID = exports.ADD_ROOT_FOLDER_LABEL = exports.ADD_ROOT_FOLDER_COMMAND_ID = void 0;
    exports.ADD_ROOT_FOLDER_COMMAND_ID = 'addRootFolder';
    exports.ADD_ROOT_FOLDER_LABEL = { value: (0, nls_1.localize)('addFolderToWorkspace', "Add Folder to Workspace..."), original: 'Add Folder to Workspace...' };
    exports.SET_ROOT_FOLDER_COMMAND_ID = 'setRootFolder';
    exports.PICK_WORKSPACE_FOLDER_COMMAND_ID = '_workbench.pickWorkspaceFolder';
    // Command registration
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFileFolderInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFileFolderAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: '_files.pickFolderAndOpen',
        handler: (accessor, options) => accessor.get(dialogs_1.IFileDialogService).pickFolderAndOpen(options)
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFolderInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFolderAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFileInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFileAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.openWorkspaceInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickWorkspaceAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.ADD_ROOT_FOLDER_COMMAND_ID,
        handler: async (accessor) => {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const folders = await selectWorkspaceFolders(accessor);
            if (!folders || !folders.length) {
                return;
            }
            await workspaceEditingService.addFolders(folders.map(folder => ({ uri: folder })));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SET_ROOT_FOLDER_COMMAND_ID,
        handler: async (accessor) => {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const folders = await selectWorkspaceFolders(accessor);
            if (!folders || !folders.length) {
                return;
            }
            await workspaceEditingService.updateFolders(0, contextService.getWorkspace().folders.length, folders.map(folder => ({ uri: folder })));
        }
    });
    async function selectWorkspaceFolders(accessor) {
        const dialogsService = accessor.get(dialogs_1.IFileDialogService);
        const pathService = accessor.get(pathService_1.IPathService);
        const folders = await dialogsService.showOpenDialog({
            openLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'add', comment: ['&& denotes a mnemonic'] }, "&&Add")),
            title: (0, nls_1.localize)('addFolderToWorkspaceTitle', "Add Folder to Workspace"),
            canSelectFolders: true,
            canSelectMany: true,
            defaultUri: await dialogsService.defaultFolderPath(),
            availableFileSystems: [pathService.defaultUriScheme]
        });
        return folders;
    }
    commands_1.CommandsRegistry.registerCommand(exports.PICK_WORKSPACE_FOLDER_COMMAND_ID, async function (accessor, args) {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const labelService = accessor.get(label_1.ILabelService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const modelService = accessor.get(model_1.IModelService);
        const languageService = accessor.get(language_1.ILanguageService);
        const folders = contextService.getWorkspace().folders;
        if (!folders.length) {
            return;
        }
        const folderPicks = folders.map(folder => {
            return {
                label: folder.name,
                description: labelService.getUriLabel((0, resources_1.dirname)(folder.uri), { relative: true }),
                folder,
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, folder.uri, files_1.FileKind.ROOT_FOLDER)
            };
        });
        const options = (args ? args[0] : undefined) || Object.create(null);
        if (!options.activeItem) {
            options.activeItem = folderPicks[0];
        }
        if (!options.placeHolder) {
            options.placeHolder = (0, nls_1.localize)('workspaceFolderPickerPlaceholder', "Select workspace folder");
        }
        if (typeof options.matchOnDescription !== 'boolean') {
            options.matchOnDescription = true;
        }
        const token = (args ? args[1] : undefined) || cancellation_1.CancellationToken.None;
        const pick = await quickInputService.pick(folderPicks, options, token);
        if (pick) {
            return folders[folderPicks.indexOf(pick)];
        }
        return;
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.openFolder',
        handler: (accessor, uri, arg) => {
            const commandService = accessor.get(commands_1.ICommandService);
            // Be compatible to previous args by converting to options
            if (typeof arg === 'boolean') {
                arg = { forceNewWindow: arg };
            }
            // Without URI, ask to pick a folder or workspace to open
            if (!uri) {
                const options = {
                    forceNewWindow: arg === null || arg === void 0 ? void 0 : arg.forceNewWindow
                };
                if (arg === null || arg === void 0 ? void 0 : arg.forceLocalWindow) {
                    options.remoteAuthority = null;
                    options.availableFileSystems = ['file'];
                }
                return commandService.executeCommand('_files.pickFolderAndOpen', options);
            }
            uri = uri_1.URI.revive(uri);
            const options = {
                forceNewWindow: arg === null || arg === void 0 ? void 0 : arg.forceNewWindow,
                forceReuseWindow: arg === null || arg === void 0 ? void 0 : arg.forceReuseWindow,
                noRecentEntry: arg === null || arg === void 0 ? void 0 : arg.noRecentEntry,
                remoteAuthority: (arg === null || arg === void 0 ? void 0 : arg.forceLocalWindow) ? null : undefined
            };
            const uriToOpen = ((0, workspace_1.hasWorkspaceFileExtension)(uri) || uri.scheme === network_1.Schemas.untitled) ? { workspaceUri: uri } : { folderUri: uri };
            return commandService.executeCommand('_files.windowOpen', [uriToOpen], options);
        },
        description: {
            description: 'Open a folder or workspace in the current window or new window depending on the newWindow argument. Note that opening in the same window will shutdown the current extension host process and start a new one on the given folder/workspace unless the newWindow parameter is set to true.',
            args: [
                {
                    name: 'uri', description: '(optional) Uri of the folder or workspace file to open. If not provided, a native dialog will ask the user for the folder',
                    constraint: (value) => value === undefined || value === null || value instanceof uri_1.URI
                },
                {
                    name: 'options',
                    description: '(optional) Options. Object with the following properties: ' +
                        '`forceNewWindow`: Whether to open the folder/workspace in a new window or the same. Defaults to opening in the same window. ' +
                        '`forceReuseWindow`: Whether to force opening the folder/workspace in the same window.  Defaults to false. ' +
                        '`noRecentEntry`: Whether the opened URI will appear in the \'Open Recent\' list. Defaults to false. ' +
                        'Note, for backward compatibility, options can also be of type boolean, representing the `forceNewWindow` setting.',
                    constraint: (value) => value === undefined || typeof value === 'object' || typeof value === 'boolean'
                }
            ]
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.newWindow',
        handler: (accessor, options) => {
            const commandService = accessor.get(commands_1.ICommandService);
            const commandOptions = {
                forceReuseWindow: options && options.reuseWindow,
                remoteAuthority: options && options.remoteAuthority
            };
            return commandService.executeCommand('_files.newWindow', commandOptions);
        },
        description: {
            description: 'Opens an new window depending on the newWindow argument.',
            args: [
                {
                    name: 'options',
                    description: '(optional) Options. Object with the following properties: ' +
                        '`reuseWindow`: Whether to open a new window or the same. Defaults to opening in a new window. ',
                    constraint: (value) => value === undefined || typeof value === 'object'
                }
            ]
        }
    });
    // recent history commands
    commands_1.CommandsRegistry.registerCommand('_workbench.removeFromRecentlyOpened', function (accessor, uri) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        return workspacesService.removeRecentlyOpened([uri]);
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.removeFromRecentlyOpened',
        handler: (accessor, path) => {
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            if (typeof path === 'string') {
                path = path.match(/^[^:/?#]+:\/\//) ? uri_1.URI.parse(path) : uri_1.URI.file(path);
            }
            else {
                path = uri_1.URI.revive(path); // called from extension host
            }
            return workspacesService.removeRecentlyOpened([path]);
        },
        description: {
            description: 'Removes an entry with the given path from the recently opened list.',
            args: [
                { name: 'path', description: 'URI or URI string to remove from recently opened.', constraint: (value) => typeof value === 'string' || value instanceof uri_1.URI }
            ]
        }
    });
    commands_1.CommandsRegistry.registerCommand('_workbench.addToRecentlyOpened', async function (accessor, recentEntry) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        const uri = recentEntry.uri;
        const label = recentEntry.label;
        const remoteAuthority = recentEntry.remoteAuthority;
        let recent = undefined;
        if (recentEntry.type === 'workspace') {
            const workspace = await workspacesService.getWorkspaceIdentifier(uri);
            recent = { workspace, label, remoteAuthority };
        }
        else if (recentEntry.type === 'folder') {
            recent = { folderUri: uri, label, remoteAuthority };
        }
        else {
            recent = { fileUri: uri, label, remoteAuthority };
        }
        return workspacesService.addRecentlyOpened([recent]);
    });
    commands_1.CommandsRegistry.registerCommand('_workbench.getRecentlyOpened', async function (accessor) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        return workspacesService.getRecentlyOpened();
    });
});
//# sourceMappingURL=workspaceCommands.js.map