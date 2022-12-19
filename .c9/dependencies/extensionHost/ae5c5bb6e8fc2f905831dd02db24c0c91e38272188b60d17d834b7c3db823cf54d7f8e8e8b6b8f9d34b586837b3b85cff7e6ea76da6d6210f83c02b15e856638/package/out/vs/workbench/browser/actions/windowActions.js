/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/base/common/keyCodes", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/label/common/label", "vs/platform/keybinding/common/keybinding", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/workspaces/common/workspaces", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/base/common/labels", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/quickaccess", "vs/workbench/services/host/browser/host", "vs/base/common/map", "vs/base/common/codicons", "vs/base/browser/dom", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/backup/common/backup"], function (require, exports, nls_1, dialogs_1, actions_1, keyCodes_1, contextkeys_1, contextkeys_2, actions_2, keybindingsRegistry_1, quickInput_1, workspace_1, label_1, keybinding_1, model_1, language_1, workspaces_1, getIconClasses_1, files_1, labels_1, platform_1, contextkey_1, quickaccess_1, host_1, map_1, codicons_1, dom_1, commands_1, configuration_1, backup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReloadWindowAction = exports.OpenRecentAction = exports.inRecentFilesPickerContextKey = void 0;
    exports.inRecentFilesPickerContextKey = 'inRecentFilesPicker';
    const fileCategory = { value: (0, nls_1.localize)('file', "File"), original: 'File' };
    class BaseOpenRecentAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.removeFromRecentlyOpened = {
                iconClass: codicons_1.Codicon.removeClose.classNames,
                tooltip: (0, nls_1.localize)('remove', "Remove from Recently Opened")
            };
            this.dirtyRecentlyOpenedFolder = {
                iconClass: 'dirty-workspace ' + codicons_1.Codicon.closeDirty.classNames,
                tooltip: (0, nls_1.localize)('dirtyRecentlyOpenedFolder', "Folder With Unsaved Files"),
                alwaysVisible: true
            };
            this.dirtyRecentlyOpenedWorkspace = Object.assign(Object.assign({}, this.dirtyRecentlyOpenedFolder), { tooltip: (0, nls_1.localize)('dirtyRecentlyOpenedWorkspace', "Workspace With Unsaved Files") });
        }
        async run(accessor) {
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const labelService = accessor.get(label_1.ILabelService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const hostService = accessor.get(host_1.IHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const recentlyOpened = await workspacesService.getRecentlyOpened();
            const dirtyWorkspacesAndFolders = await workspacesService.getDirtyWorkspaces();
            let hasWorkspaces = false;
            // Identify all folders and workspaces with unsaved files
            const dirtyFolders = new map_1.ResourceMap();
            const dirtyWorkspaces = new map_1.ResourceMap();
            for (const dirtyWorkspace of dirtyWorkspacesAndFolders) {
                if ((0, backup_1.isFolderBackupInfo)(dirtyWorkspace)) {
                    dirtyFolders.set(dirtyWorkspace.folderUri, true);
                }
                else {
                    dirtyWorkspaces.set(dirtyWorkspace.workspace.configPath, dirtyWorkspace.workspace);
                    hasWorkspaces = true;
                }
            }
            // Identify all recently opened folders and workspaces
            const recentFolders = new map_1.ResourceMap();
            const recentWorkspaces = new map_1.ResourceMap();
            for (const recent of recentlyOpened.workspaces) {
                if ((0, workspaces_1.isRecentFolder)(recent)) {
                    recentFolders.set(recent.folderUri, true);
                }
                else {
                    recentWorkspaces.set(recent.workspace.configPath, recent.workspace);
                    hasWorkspaces = true;
                }
            }
            // Fill in all known recently opened workspaces
            const workspacePicks = [];
            for (const recent of recentlyOpened.workspaces) {
                const isDirty = (0, workspaces_1.isRecentFolder)(recent) ? dirtyFolders.has(recent.folderUri) : dirtyWorkspaces.has(recent.workspace.configPath);
                workspacePicks.push(this.toQuickPick(modelService, languageService, labelService, recent, isDirty));
            }
            // Fill any backup workspace that is not yet shown at the end
            for (const dirtyWorkspaceOrFolder of dirtyWorkspacesAndFolders) {
                if ((0, backup_1.isFolderBackupInfo)(dirtyWorkspaceOrFolder) && !recentFolders.has(dirtyWorkspaceOrFolder.folderUri)) {
                    workspacePicks.push(this.toQuickPick(modelService, languageService, labelService, dirtyWorkspaceOrFolder, true));
                }
                else if ((0, backup_1.isWorkspaceBackupInfo)(dirtyWorkspaceOrFolder) && !recentWorkspaces.has(dirtyWorkspaceOrFolder.workspace.configPath)) {
                    workspacePicks.push(this.toQuickPick(modelService, languageService, labelService, dirtyWorkspaceOrFolder, true));
                }
            }
            const filePicks = recentlyOpened.files.map(p => this.toQuickPick(modelService, languageService, labelService, p, false));
            // focus second entry if the first recent workspace is the current workspace
            const firstEntry = recentlyOpened.workspaces[0];
            const autoFocusSecondEntry = firstEntry && contextService.isCurrentWorkspace((0, workspaces_1.isRecentWorkspace)(firstEntry) ? firstEntry.workspace : firstEntry.folderUri);
            let keyMods;
            const workspaceSeparator = { type: 'separator', label: hasWorkspaces ? (0, nls_1.localize)('workspacesAndFolders', "folders & workspaces") : (0, nls_1.localize)('folders', "folders") };
            const fileSeparator = { type: 'separator', label: (0, nls_1.localize)('files', "files") };
            const picks = [workspaceSeparator, ...workspacePicks, fileSeparator, ...filePicks];
            const pick = await quickInputService.pick(picks, {
                contextKey: exports.inRecentFilesPickerContextKey,
                activeItem: [...workspacePicks, ...filePicks][autoFocusSecondEntry ? 1 : 0],
                placeHolder: platform_1.isMacintosh ? (0, nls_1.localize)('openRecentPlaceholderMac', "Select to open (hold Cmd-key to force new window or Alt-key for same window)") : (0, nls_1.localize)('openRecentPlaceholder', "Select to open (hold Ctrl-key to force new window or Alt-key for same window)"),
                matchOnDescription: true,
                onKeyMods: mods => keyMods = mods,
                quickNavigate: this.isQuickNavigate() ? { keybindings: keybindingService.lookupKeybindings(this.desc.id) } : undefined,
                hideInput: this.isQuickNavigate(),
                onDidTriggerItemButton: async (context) => {
                    // Remove
                    if (context.button === this.removeFromRecentlyOpened) {
                        await workspacesService.removeRecentlyOpened([context.item.resource]);
                        context.removeItem();
                    }
                    // Dirty Folder/Workspace
                    else if (context.button === this.dirtyRecentlyOpenedFolder || context.button === this.dirtyRecentlyOpenedWorkspace) {
                        const isDirtyWorkspace = context.button === this.dirtyRecentlyOpenedWorkspace;
                        const result = await dialogService.confirm({
                            type: 'question',
                            title: isDirtyWorkspace ? (0, nls_1.localize)('dirtyWorkspace', "Workspace with Unsaved Files") : (0, nls_1.localize)('dirtyFolder', "Folder with Unsaved Files"),
                            message: isDirtyWorkspace ? (0, nls_1.localize)('dirtyWorkspaceConfirm', "Do you want to open the workspace to review the unsaved files?") : (0, nls_1.localize)('dirtyFolderConfirm', "Do you want to open the folder to review the unsaved files?"),
                            detail: isDirtyWorkspace ? (0, nls_1.localize)('dirtyWorkspaceConfirmDetail', "Workspaces with unsaved files cannot be removed until all unsaved files have been saved or reverted.") : (0, nls_1.localize)('dirtyFolderConfirmDetail', "Folders with unsaved files cannot be removed until all unsaved files have been saved or reverted.")
                        });
                        if (result.confirmed) {
                            hostService.openWindow([context.item.openable], {
                                remoteAuthority: context.item.remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                            });
                            quickInputService.cancel();
                        }
                    }
                }
            });
            if (pick) {
                return hostService.openWindow([pick.openable], {
                    forceNewWindow: keyMods === null || keyMods === void 0 ? void 0 : keyMods.ctrlCmd,
                    forceReuseWindow: keyMods === null || keyMods === void 0 ? void 0 : keyMods.alt,
                    remoteAuthority: pick.remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                });
            }
        }
        toQuickPick(modelService, languageService, labelService, recent, isDirty) {
            let openable;
            let iconClasses;
            let fullLabel;
            let resource;
            let isWorkspace = false;
            // Folder
            if ((0, workspaces_1.isRecentFolder)(recent)) {
                resource = recent.folderUri;
                iconClasses = (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, files_1.FileKind.FOLDER);
                openable = { folderUri: resource };
                fullLabel = recent.label || labelService.getWorkspaceLabel(resource, { verbose: true });
            }
            // Workspace
            else if ((0, workspaces_1.isRecentWorkspace)(recent)) {
                resource = recent.workspace.configPath;
                iconClasses = (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, files_1.FileKind.ROOT_FOLDER);
                openable = { workspaceUri: resource };
                fullLabel = recent.label || labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
                isWorkspace = true;
            }
            // File
            else {
                resource = recent.fileUri;
                iconClasses = (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, files_1.FileKind.FILE);
                openable = { fileUri: resource };
                fullLabel = recent.label || labelService.getUriLabel(resource);
            }
            const { name, parentPath } = (0, labels_1.splitName)(fullLabel);
            return {
                iconClasses,
                label: name,
                ariaLabel: isDirty ? isWorkspace ? (0, nls_1.localize)('recentDirtyWorkspaceAriaLabel', "{0}, workspace with unsaved changes", name) : (0, nls_1.localize)('recentDirtyFolderAriaLabel', "{0}, folder with unsaved changes", name) : name,
                description: parentPath,
                buttons: isDirty ? [isWorkspace ? this.dirtyRecentlyOpenedWorkspace : this.dirtyRecentlyOpenedFolder] : [this.removeFromRecentlyOpened],
                openable,
                resource,
                remoteAuthority: recent.remoteAuthority
            };
        }
    }
    class OpenRecentAction extends BaseOpenRecentAction {
        constructor() {
            super({
                id: OpenRecentAction.ID,
                title: {
                    value: (0, nls_1.localize)('openRecent', "Open Recent..."),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miMore', comment: ['&& denotes a mnemonic'] }, "&&More..."),
                    original: 'Open Recent...'
                },
                category: fileCategory,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 48 /* KeyCode.KeyR */ }
                },
                menu: {
                    id: actions_1.MenuId.MenubarRecentMenu,
                    group: 'y_more',
                    order: 1
                }
            });
        }
        isQuickNavigate() {
            return false;
        }
    }
    exports.OpenRecentAction = OpenRecentAction;
    OpenRecentAction.ID = 'workbench.action.openRecent';
    class QuickPickRecentAction extends BaseOpenRecentAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenRecent',
                title: { value: (0, nls_1.localize)('quickOpenRecent', "Quick Open Recent..."), original: 'Quick Open Recent...' },
                category: fileCategory,
                f1: true
            });
        }
        isQuickNavigate() {
            return true;
        }
    }
    class ToggleFullScreenAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleFullScreen',
                title: {
                    value: (0, nls_1.localize)('toggleFullScreen', "Toggle Full Screen"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleFullScreen', comment: ['&& denotes a mnemonic'] }, "&&Full Screen"),
                    original: 'Toggle Full Screen'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 69 /* KeyCode.F11 */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 36 /* KeyCode.KeyF */
                    }
                },
                precondition: contextkeys_2.IsIOSContext.toNegated(),
                toggled: contextkeys_1.IsFullscreenContext,
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '1_toggle_view',
                        order: 1
                    }]
            });
        }
        run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            return hostService.toggleFullScreen();
        }
    }
    class ReloadWindowAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ReloadWindowAction.ID,
                title: { value: (0, nls_1.localize)('reloadWindow', "Reload Window"), original: 'Reload Window' },
                category: actions_2.CATEGORIES.Developer,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
                    when: contextkeys_2.IsDevelopmentContext,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */
                }
            });
        }
        run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            return hostService.reload();
        }
    }
    exports.ReloadWindowAction = ReloadWindowAction;
    ReloadWindowAction.ID = 'workbench.action.reloadWindow';
    class ShowAboutDialogAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.showAboutDialog',
                title: {
                    value: (0, nls_1.localize)('about', "About"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miAbout', comment: ['&& denotes a mnemonic'] }, "&&About"),
                    original: 'About'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: 'z_about',
                    order: 1,
                    when: contextkeys_2.IsMacNativeContext.toNegated()
                }
            });
        }
        run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            return dialogService.about();
        }
    }
    class NewWindowAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.newWindow',
                title: {
                    value: (0, nls_1.localize)('newWindow', "New Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miNewWindow', comment: ['&& denotes a mnemonic'] }, "New &&Window"),
                    original: 'New Window'
                },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: platform_1.isWeb ? (platform_1.isWindows ? (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */) : 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */) : 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */,
                    secondary: platform_1.isWeb ? [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */] : undefined
                },
                menu: {
                    id: actions_1.MenuId.MenubarFileMenu,
                    group: '1_new',
                    order: 3
                }
            });
        }
        run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            return hostService.openWindow({ remoteAuthority: null });
        }
    }
    class BlurAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.blur',
                title: { value: (0, nls_1.localize)('blur', "Remove keyboard focus from focused element"), original: 'Remove keyboard focus from focused element' }
            });
        }
        run() {
            const el = document.activeElement;
            if ((0, dom_1.isHTMLElement)(el)) {
                el.blur();
            }
        }
    }
    // --- Actions Registration
    (0, actions_1.registerAction2)(NewWindowAction);
    (0, actions_1.registerAction2)(ToggleFullScreenAction);
    (0, actions_1.registerAction2)(QuickPickRecentAction);
    (0, actions_1.registerAction2)(OpenRecentAction);
    (0, actions_1.registerAction2)(ReloadWindowAction);
    (0, actions_1.registerAction2)(ShowAboutDialogAction);
    (0, actions_1.registerAction2)(BlurAction);
    // --- Commands/Keybindings Registration
    const recentFilesPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(exports.inRecentFilesPickerContextKey));
    const quickPickNavigateNextInRecentFilesPickerId = 'workbench.action.quickOpenNavigateNextInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickPickNavigateNextInRecentFilesPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickPickNavigateNextInRecentFilesPickerId, true),
        when: recentFilesPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 48 /* KeyCode.KeyR */ }
    });
    const quickPickNavigatePreviousInRecentFilesPicker = 'workbench.action.quickOpenNavigatePreviousInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickPickNavigatePreviousInRecentFilesPicker,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickPickNavigatePreviousInRecentFilesPicker, false),
        when: recentFilesPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */ }
    });
    commands_1.CommandsRegistry.registerCommand('workbench.action.toggleConfirmBeforeClose', accessor => {
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const setting = configurationService.inspect('window.confirmBeforeClose').userValue;
        return configurationService.updateValue('window.confirmBeforeClose', setting === 'never' ? 'keyboardOnly' : 'never');
    });
    // --- Menu Registration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: 'z_ConfirmClose',
        command: {
            id: 'workbench.action.toggleConfirmBeforeClose',
            title: (0, nls_1.localize)('miConfirmClose', "Confirm Before Close"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.window.confirmBeforeClose', 'never')
        },
        order: 1,
        when: contextkeys_2.IsWebContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        title: (0, nls_1.localize)({ key: 'miOpenRecent', comment: ['&& denotes a mnemonic'] }, "Open &&Recent"),
        submenu: actions_1.MenuId.MenubarRecentMenu,
        group: '2_open',
        order: 4
    });
});
//# sourceMappingURL=windowActions.js.map