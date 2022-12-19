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
define(["require", "exports", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorService", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/product/common/productService"], function (require, exports, commands_1, arrays, instantiation_1, editorService_1, errors_1, workspace_1, configuration_1, workingCopyBackup_1, lifecycle_1, files_1, resources_1, layoutService_1, gettingStartedInput_1, environmentService_1, storage_1, telemetryUtils_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartupPageContribution = exports.restoreWalkthroughsConfigurationKey = void 0;
    exports.restoreWalkthroughsConfigurationKey = 'workbench.welcomePage.restorableWalkthroughs';
    const configurationKey = 'workbench.startupEditor';
    const oldConfigurationKey = 'workbench.welcome.enabled';
    const telemetryOptOutStorageKey = 'workbench.telemetryOptOutShown';
    let StartupPageContribution = class StartupPageContribution {
        constructor(instantiationService, configurationService, editorService, workingCopyBackupService, fileService, contextService, lifecycleService, layoutService, productService, commandService, environmentService, storageService) {
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.fileService = fileService;
            this.contextService = contextService;
            this.lifecycleService = lifecycleService;
            this.layoutService = layoutService;
            this.productService = productService;
            this.commandService = commandService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.run().then(undefined, errors_1.onUnexpectedError);
        }
        async run() {
            // Always open Welcome page for first-launch, no matter what is open or which startupEditor is set.
            if (this.productService.enableTelemetry
                && this.productService.showTelemetryOptOut
                && (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService) !== 0 /* TelemetryLevel.NONE */
                && !this.environmentService.skipWelcome
                && !this.storageService.get(telemetryOptOutStorageKey, 0 /* StorageScope.GLOBAL */)) {
                this.storageService.store(telemetryOptOutStorageKey, true, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                await this.openGettingStarted(true);
                return;
            }
            if (this.tryOpenWalkthroughForFolder()) {
                return;
            }
            const enabled = isStartupPageEnabled(this.configurationService, this.contextService, this.environmentService);
            if (enabled && this.lifecycleService.startupKind !== 3 /* StartupKind.ReloadedWindow */) {
                const hasBackups = await this.workingCopyBackupService.hasBackups();
                if (hasBackups) {
                    return;
                }
                // Open the welcome even if we opened a set of default editors
                if (!this.editorService.activeEditor || this.layoutService.openedDefaultEditors) {
                    const startupEditorSetting = this.configurationService.inspect(configurationKey);
                    // 'readme' should not be set in workspace settings to prevent tracking,
                    // but it can be set as a default (as in codespaces) or a user setting
                    const openWithReadme = startupEditorSetting.value === 'readme' &&
                        (startupEditorSetting.userValue === 'readme' || startupEditorSetting.defaultValue === 'readme');
                    if (openWithReadme) {
                        await this.openReadme();
                    }
                    else {
                        await this.openGettingStarted();
                    }
                }
            }
        }
        tryOpenWalkthroughForFolder() {
            const toRestore = this.storageService.get(exports.restoreWalkthroughsConfigurationKey, 0 /* StorageScope.GLOBAL */);
            if (!toRestore) {
                return false;
            }
            else {
                const restoreData = JSON.parse(toRestore);
                const currentWorkspace = this.contextService.getWorkspace();
                if (restoreData.folder === currentWorkspace.folders[0].uri.toString()) {
                    this.editorService.openEditor(this.instantiationService.createInstance(gettingStartedInput_1.GettingStartedInput, { selectedCategory: restoreData.category, selectedStep: restoreData.step }), { pinned: false });
                    this.storageService.remove(exports.restoreWalkthroughsConfigurationKey, 0 /* StorageScope.GLOBAL */);
                    return true;
                }
            }
            return false;
        }
        async openReadme() {
            const readmes = arrays.coalesce(await Promise.all(this.contextService.getWorkspace().folders.map(async (folder) => {
                const folderUri = folder.uri;
                const folderStat = await this.fileService.resolve(folderUri).catch(errors_1.onUnexpectedError);
                const files = (folderStat === null || folderStat === void 0 ? void 0 : folderStat.children) ? folderStat.children.map(child => child.name).sort() : [];
                const file = files.find(file => file.toLowerCase() === 'readme.md') || files.find(file => file.toLowerCase().startsWith('readme'));
                if (file) {
                    return (0, resources_1.joinPath)(folderUri, file);
                }
                else {
                    return undefined;
                }
            })));
            if (!this.editorService.activeEditor) {
                if (readmes.length) {
                    const isMarkDown = (readme) => readme.path.toLowerCase().endsWith('.md');
                    await Promise.all([
                        this.commandService.executeCommand('markdown.showPreview', null, readmes.filter(isMarkDown), { locked: true }),
                        this.editorService.openEditors(readmes.filter(readme => !isMarkDown(readme)).map(readme => ({ resource: readme }))),
                    ]);
                }
                else {
                    await this.openGettingStarted();
                }
            }
        }
        async openGettingStarted(showTelemetryNotice) {
            const startupEditorTypeID = gettingStartedInput_1.gettingStartedInputTypeId;
            const editor = this.editorService.activeEditor;
            // Ensure that the welcome editor won't get opened more than once
            if ((editor === null || editor === void 0 ? void 0 : editor.typeId) === startupEditorTypeID || this.editorService.editors.some(e => e.typeId === startupEditorTypeID)) {
                return;
            }
            const options = editor ? { pinned: false, index: 0 } : { pinned: false };
            if (startupEditorTypeID === gettingStartedInput_1.gettingStartedInputTypeId) {
                this.editorService.openEditor(this.instantiationService.createInstance(gettingStartedInput_1.GettingStartedInput, { showTelemetryNotice }), options);
            }
        }
    };
    StartupPageContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, editorService_1.IEditorService),
        __param(3, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(4, files_1.IFileService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, lifecycle_1.ILifecycleService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, productService_1.IProductService),
        __param(9, commands_1.ICommandService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, storage_1.IStorageService)
    ], StartupPageContribution);
    exports.StartupPageContribution = StartupPageContribution;
    function isStartupPageEnabled(configurationService, contextService, environmentService) {
        if (environmentService.skipWelcome) {
            return false;
        }
        const startupEditor = configurationService.inspect(configurationKey);
        if (!startupEditor.userValue && !startupEditor.workspaceValue) {
            const welcomeEnabled = configurationService.inspect(oldConfigurationKey);
            if (welcomeEnabled.value !== undefined && welcomeEnabled.value !== null) {
                return welcomeEnabled.value;
            }
        }
        if (startupEditor.value === 'readme' && startupEditor.userValue !== 'readme' && startupEditor.defaultValue !== 'readme') {
            console.error(`Warning: 'workbench.startupEditor: readme' setting ignored due to being set somewhere other than user or default settings (user=${startupEditor.userValue}, default=${startupEditor.defaultValue})`);
        }
        return startupEditor.value === 'welcomePage'
            || startupEditor.value === 'readme' && (startupEditor.userValue === 'readme' || startupEditor.defaultValue === 'readme')
            || (contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && startupEditor.value === 'welcomePageInEmptyWorkbench');
    }
});
//# sourceMappingURL=startupPage.js.map