/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/uri", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/workspaces/common/workspaces", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/commands/common/commands", "vs/base/common/resources", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService", "vs/platform/native/electron-sandbox/native", "vs/base/common/platform", "vs/base/common/labels", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspaceTrust"], function (require, exports, nls_1, workspaceEditing_1, uri_1, workspace_1, jsonEditing_1, workspaces_1, storage_1, extensions_1, workingCopyBackup_1, commands_1, resources_1, notification_1, files_1, environmentService_1, lifecycle_1, dialogs_1, configuration_1, extensions_2, label_1, textfiles_1, host_1, abstractWorkspaceEditingService_1, native_1, platform_1, labels_1, workingCopyBackupService_1, uriIdentity_1, workspaceTrust_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkspaceEditingService = void 0;
    let NativeWorkspaceEditingService = class NativeWorkspaceEditingService extends abstractWorkspaceEditingService_1.AbstractWorkspaceEditingService {
        constructor(jsonEditingService, contextService, nativeHostService, configurationService, storageService, extensionService, workingCopyBackupService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, lifecycleService, labelService, hostService, uriIdentityService, workspaceTrustManagementService) {
            super(jsonEditingService, contextService, configurationService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService, uriIdentityService, workspaceTrustManagementService);
            this.nativeHostService = nativeHostService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.lifecycleService = lifecycleService;
            this.labelService = labelService;
            this.registerListeners();
        }
        registerListeners() {
            this.lifecycleService.onBeforeShutdown(e => {
                const saveOperation = this.saveUntitledBeforeShutdown(e.reason);
                e.veto(saveOperation, 'veto.untitledWorkspace');
            });
        }
        async saveUntitledBeforeShutdown(reason) {
            if (reason !== 4 /* ShutdownReason.LOAD */ && reason !== 1 /* ShutdownReason.CLOSE */) {
                return false; // only interested when window is closing or loading
            }
            const workspaceIdentifier = this.getCurrentWorkspaceIdentifier();
            if (!workspaceIdentifier || !(0, workspace_1.isUntitledWorkspace)(workspaceIdentifier.configPath, this.environmentService)) {
                return false; // only care about untitled workspaces to ask for saving
            }
            const windowCount = await this.nativeHostService.getWindowCount();
            if (reason === 1 /* ShutdownReason.CLOSE */ && !platform_1.isMacintosh && windowCount === 1) {
                return false; // Windows/Linux: quits when last window is closed, so do not ask then
            }
            let ConfirmResult;
            (function (ConfirmResult) {
                ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
                ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
                ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
            })(ConfirmResult || (ConfirmResult = {}));
            const buttons = [
                { label: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)('save', "Save")), result: ConfirmResult.SAVE },
                { label: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)('doNotSave', "Don't Save")), result: ConfirmResult.DONT_SAVE },
                { label: (0, nls_1.localize)('cancel', "Cancel"), result: ConfirmResult.CANCEL }
            ];
            const message = (0, nls_1.localize)('saveWorkspaceMessage', "Do you want to save your workspace configuration as a file?");
            const detail = (0, nls_1.localize)('saveWorkspaceDetail', "Save your workspace if you plan to open it again.");
            const { choice } = await this.dialogService.show(notification_1.Severity.Warning, message, buttons.map(button => button.label), { detail, cancelId: 2 });
            switch (buttons[choice].result) {
                // Cancel: veto unload
                case ConfirmResult.CANCEL:
                    return true;
                // Don't Save: delete workspace
                case ConfirmResult.DONT_SAVE:
                    await this.workspacesService.deleteUntitledWorkspace(workspaceIdentifier);
                    return false;
                // Save: save workspace, but do not veto unload if path provided
                case ConfirmResult.SAVE: {
                    const newWorkspacePath = await this.pickNewWorkspacePath();
                    if (!newWorkspacePath || !(0, workspace_1.hasWorkspaceFileExtension)(newWorkspacePath)) {
                        return true; // keep veto if no target was provided
                    }
                    try {
                        await this.saveWorkspaceAs(workspaceIdentifier, newWorkspacePath);
                        // Make sure to add the new workspace to the history to find it again
                        const newWorkspaceIdentifier = await this.workspacesService.getWorkspaceIdentifier(newWorkspacePath);
                        await this.workspacesService.addRecentlyOpened([{
                                label: this.labelService.getWorkspaceLabel(newWorkspaceIdentifier, { verbose: true }),
                                workspace: newWorkspaceIdentifier,
                                remoteAuthority: this.environmentService.remoteAuthority // remember whether this was a remote window
                            }]);
                        // Delete the untitled one
                        await this.workspacesService.deleteUntitledWorkspace(workspaceIdentifier);
                    }
                    catch (error) {
                        // ignore
                    }
                    return false;
                }
            }
        }
        async isValidTargetWorkspacePath(workspaceUri) {
            const windows = await this.nativeHostService.getWindows();
            // Prevent overwriting a workspace that is currently opened in another window
            if (windows.some(window => (0, workspace_1.isWorkspaceIdentifier)(window.workspace) && this.uriIdentityService.extUri.isEqual(window.workspace.configPath, workspaceUri))) {
                await this.dialogService.show(notification_1.Severity.Info, (0, nls_1.localize)('workspaceOpenedMessage', "Unable to save workspace '{0}'", (0, resources_1.basename)(workspaceUri)), undefined, {
                    detail: (0, nls_1.localize)('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again.")
                });
                return false;
            }
            return true; // OK
        }
        async enterWorkspace(workspaceUri) {
            const result = await this.doEnterWorkspace(workspaceUri);
            if (result) {
                // Migrate storage to new workspace
                await this.storageService.migrate(result.workspace);
                // Reinitialize backup service
                if (this.workingCopyBackupService instanceof workingCopyBackupService_1.WorkingCopyBackupService) {
                    const newBackupWorkspaceHome = result.backupPath ? uri_1.URI.file(result.backupPath).with({ scheme: this.environmentService.userRoamingDataHome.scheme }) : undefined;
                    this.workingCopyBackupService.reinitialize(newBackupWorkspaceHome);
                }
            }
            // TODO@aeschli: workaround until restarting works
            if (this.environmentService.remoteAuthority) {
                this.hostService.reload();
            }
            // Restart the extension host: entering a workspace means a new location for
            // storage and potentially a change in the workspace.rootPath property.
            else {
                this.extensionService.restartExtensionHost();
            }
        }
    };
    NativeWorkspaceEditingService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, native_1.INativeHostService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, extensions_1.IExtensionService),
        __param(6, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(7, notification_1.INotificationService),
        __param(8, commands_1.ICommandService),
        __param(9, files_1.IFileService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, workspaces_1.IWorkspacesService),
        __param(12, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(13, dialogs_1.IFileDialogService),
        __param(14, dialogs_1.IDialogService),
        __param(15, lifecycle_1.ILifecycleService),
        __param(16, label_1.ILabelService),
        __param(17, host_1.IHostService),
        __param(18, uriIdentity_1.IUriIdentityService),
        __param(19, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], NativeWorkspaceEditingService);
    exports.NativeWorkspaceEditingService = NativeWorkspaceEditingService;
    (0, extensions_2.registerSingleton)(workspaceEditing_1.IWorkspaceEditingService, NativeWorkspaceEditingService, true);
});
//# sourceMappingURL=workspaceEditingService.js.map