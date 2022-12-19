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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/json", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/configuration/common/jsonEditing", "vs/editor/common/services/resolverService", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/workbench/services/editor/common/editorService", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/base/browser/ui/aria/aria", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/label/common/label", "vs/workbench/services/textfile/common/textfiles", "vs/platform/product/common/productService", "vs/platform/dialogs/common/dialogs", "vs/platform/progress/common/progress", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/base/common/errors", "vs/platform/userDataSync/common/userDataSync", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/platform/log/common/log", "vs/workbench/contrib/logs/common/logConstants", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/base/common/platform", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/workspace/common/workspaceTrust", "vs/platform/workspace/common/virtualWorkspace", "vs/base/common/htmlContent", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/arrays", "vs/base/common/types", "vs/base/common/date", "vs/css!./media/extensionActions"], function (require, exports, nls_1, actions_1, async_1, DOM, event_1, json, contextView_1, lifecycle_1, extensions_1, extensionsFileTemplate_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, extensionManagementUtil_1, extensions_2, instantiation_1, files_1, workspace_1, host_1, extensions_3, uri_1, commands_1, configuration_1, themeService_1, colorRegistry_1, jsonEditing_1, resolverService_1, contextkey_1, actions_2, workspaceCommands_1, notification_1, opener_1, editorService_1, quickInput_1, cancellation_1, aria_1, workbenchThemeService_1, label_1, textfiles_1, productService_1, dialogs_1, progress_1, actionViewItems_1, workspaceExtensionsConfig_1, errors_1, userDataSync_1, dropdownActionViewItem_1, log_1, Constants, extensionsIcons_1, platform_1, extensionManifestPropertiesService_1, workspaceTrust_1, virtualWorkspace_1, htmlContent_1, panecomposite_1, arrays_1, types_1, date_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionButtonProminentHoverBackground = exports.extensionButtonProminentForeground = exports.extensionButtonProminentBackground = exports.InstallRemoteExtensionsInLocalAction = exports.InstallLocalExtensionsInRemoteAction = exports.AbstractInstallExtensionsInServerAction = exports.InstallSpecificVersionOfExtensionAction = exports.ReinstallAction = exports.ExtensionStatusAction = exports.ToggleSyncExtensionAction = exports.ExtensionStatusLabelAction = exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = exports.ConfigureWorkspaceRecommendedExtensionsAction = exports.AbstractConfigureRecommendedExtensionsAction = exports.SearchExtensionsAction = exports.UndoIgnoreExtensionRecommendationAction = exports.IgnoreExtensionRecommendationAction = exports.InstallRecommendedExtensionAction = exports.ShowRecommendedExtensionAction = exports.SetProductIconThemeAction = exports.SetFileIconThemeAction = exports.SetColorThemeAction = exports.ReloadAction = exports.DisableDropDownAction = exports.EnableDropDownAction = exports.DisableGloballyAction = exports.DisableForWorkspaceAction = exports.EnableGloballyAction = exports.EnableForWorkspaceAction = exports.InstallAnotherVersionAction = exports.SwitchToReleasedVersionAction = exports.SwitchToPreReleaseVersionAction = exports.MenuItemExtensionAction = exports.ExtensionEditorManageExtensionAction = exports.ManageExtensionAction = exports.getContextMenuActions = exports.DropDownMenuActionViewItem = exports.ExtensionDropDownAction = exports.ExtensionActionWithDropdownActionViewItem = exports.UpdateAction = exports.UninstallAction = exports.WebInstallAction = exports.LocalInstallAction = exports.RemoteInstallAction = exports.InstallInOtherServerAction = exports.InstallingLabelAction = exports.InstallDropdownAction = exports.InstallAndSyncAction = exports.InstallAction = exports.AbstractInstallAction = exports.ActionWithDropDownAction = exports.ExtensionAction = exports.PromptExtensionInstallFailureAction = void 0;
    let PromptExtensionInstallFailureAction = class PromptExtensionInstallFailureAction extends actions_1.Action {
        constructor(extension, version, installOperation, installOptions, error, productService, openerService, notificationService, dialogService, commandService, logService, extensionManagementServerService, instantiationService) {
            super('extension.promptExtensionInstallFailure');
            this.extension = extension;
            this.version = version;
            this.installOperation = installOperation;
            this.installOptions = installOptions;
            this.error = error;
            this.productService = productService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.logService = logService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.instantiationService = instantiationService;
        }
        async run() {
            if ((0, errors_1.isCancellationError)(this.error)) {
                return;
            }
            this.logService.error(this.error);
            if (this.error.name === extensionManagement_1.ExtensionManagementErrorCode.Unsupported) {
                const productName = platform_1.isWeb ? (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong) : this.productService.nameLong;
                const message = (0, nls_1.localize)('cannot be installed', "The '{0}' extension is not available in {1}. Click 'More Information' to learn more.", this.extension.displayName || this.extension.identifier.id, productName);
                const result = await this.dialogService.show(notification_1.Severity.Info, message, [(0, nls_1.localize)('close', "Close"), (0, nls_1.localize)('more information', "More Information")], { cancelId: 0 });
                if (result.choice === 1) {
                    this.openerService.open(platform_1.isWeb ? uri_1.URI.parse('https://aka.ms/vscode-web-extensions-guide') : uri_1.URI.parse('https://aka.ms/vscode-remote'));
                }
                return;
            }
            if ([extensionManagement_1.ExtensionManagementErrorCode.Incompatible, extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform, extensionManagement_1.ExtensionManagementErrorCode.Malicious, extensionManagement_1.ExtensionManagementErrorCode.ReleaseVersionNotFound, extensionManagement_1.ExtensionManagementErrorCode.UnsupportedPreRelease].includes(this.error.name)) {
                await this.dialogService.show(notification_1.Severity.Info, (0, errors_1.getErrorMessage)(this.error));
                return;
            }
            let operationMessage = this.installOperation === 3 /* InstallOperation.Update */ ? (0, nls_1.localize)('update operation', "Error while updating '{0}' extension.", this.extension.displayName || this.extension.identifier.id)
                : (0, nls_1.localize)('install operation', "Error while installing '{0}' extension.", this.extension.displayName || this.extension.identifier.id);
            let additionalMessage;
            const promptChoices = [];
            if (extensionManagement_1.ExtensionManagementErrorCode.IncompatiblePreRelease === this.error.name) {
                operationMessage = (0, errors_1.getErrorMessage)(this.error);
                additionalMessage = (0, nls_1.localize)('install release version message', "Would you like to install the release version?");
                promptChoices.push({
                    label: (0, nls_1.localize)('install release version', "Install Release Version"),
                    run: () => {
                        var _a, _b;
                        const installAction = ((_a = this.installOptions) === null || _a === void 0 ? void 0 : _a.isMachineScoped) ? this.instantiationService.createInstance(InstallAction, !!this.installOptions.installPreReleaseVersion) : this.instantiationService.createInstance(InstallAndSyncAction, !!((_b = this.installOptions) === null || _b === void 0 ? void 0 : _b.installPreReleaseVersion));
                        installAction.extension = this.extension;
                        return installAction.run();
                    }
                });
            }
            else if (this.extension.gallery && this.productService.extensionsGallery && (this.extensionManagementServerService.localExtensionManagementServer || this.extensionManagementServerService.remoteExtensionManagementServer) && !platform_1.isIOS) {
                additionalMessage = (0, nls_1.localize)('check logs', "Please check the [log]({0}) for more details.", `command:${Constants.showWindowLogActionId}`);
                promptChoices.push({
                    label: (0, nls_1.localize)('download', "Try Downloading Manually..."),
                    run: () => this.openerService.open(uri_1.URI.parse(`${this.productService.extensionsGallery.serviceUrl}/publishers/${this.extension.publisher}/vsextensions/${this.extension.name}/${this.version}/vspackage`)).then(() => {
                        this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('install vsix', 'Once downloaded, please manually install the downloaded VSIX of \'{0}\'.', this.extension.identifier.id), [{
                                label: (0, nls_1.localize)('installVSIX', "Install from VSIX..."),
                                run: () => this.commandService.executeCommand(extensions_1.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID)
                            }]);
                    })
                });
            }
            let message = `${operationMessage}${additionalMessage ? ` ${additionalMessage}` : ''}`;
            this.notificationService.prompt(notification_1.Severity.Error, message, promptChoices);
        }
    };
    PromptExtensionInstallFailureAction = __decorate([
        __param(5, productService_1.IProductService),
        __param(6, opener_1.IOpenerService),
        __param(7, notification_1.INotificationService),
        __param(8, dialogs_1.IDialogService),
        __param(9, commands_1.ICommandService),
        __param(10, log_1.ILogService),
        __param(11, extensionManagement_2.IExtensionManagementServerService),
        __param(12, instantiation_1.IInstantiationService)
    ], PromptExtensionInstallFailureAction);
    exports.PromptExtensionInstallFailureAction = PromptExtensionInstallFailureAction;
    class ExtensionAction extends actions_1.Action {
        constructor() {
            super(...arguments);
            this._extension = null;
        }
        get extension() { return this._extension; }
        set extension(extension) { this._extension = extension; this.update(); }
    }
    exports.ExtensionAction = ExtensionAction;
    ExtensionAction.EXTENSION_ACTION_CLASS = 'extension-action';
    ExtensionAction.TEXT_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} text`;
    ExtensionAction.LABEL_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} label`;
    ExtensionAction.ICON_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} icon`;
    class ActionWithDropDownAction extends ExtensionAction {
        constructor(id, label, actionsGroups) {
            super(id, label);
            this.actionsGroups = actionsGroups;
            this._menuActions = [];
            this.extensionActions = (0, arrays_1.flatten)(actionsGroups);
            this.update();
            this._register(event_1.Event.any(...this.extensionActions.map(a => a.onDidChange))(() => this.update(true)));
            this.extensionActions.forEach(a => this._register(a));
        }
        get menuActions() { return [...this._menuActions]; }
        get extension() {
            return super.extension;
        }
        set extension(extension) {
            this.extensionActions.forEach(a => a.extension = extension);
            super.extension = extension;
        }
        update(donotUpdateActions) {
            var _a;
            if (!donotUpdateActions) {
                this.extensionActions.forEach(a => a.update());
            }
            const enabledActionsGroups = this.actionsGroups.map(actionsGroup => actionsGroup.filter(a => a.enabled));
            let actions = [];
            for (const enabledActions of enabledActionsGroups) {
                if (enabledActions.length) {
                    actions = [...actions, ...enabledActions, new actions_1.Separator()];
                }
            }
            actions = actions.length ? actions.slice(0, actions.length - 1) : actions;
            this.action = actions[0];
            this._menuActions = actions.length > 1 ? actions : [];
            this.enabled = !!this.action;
            if (this.action) {
                this.label = this.getLabel(this.action);
                this.tooltip = this.action.tooltip;
            }
            let clazz = ((_a = (this.action || this.extensionActions[0])) === null || _a === void 0 ? void 0 : _a.class) || '';
            clazz = clazz ? `${clazz} action-dropdown` : 'action-dropdown';
            if (this._menuActions.length === 0) {
                clazz += ' action-dropdown';
            }
            this.class = clazz;
        }
        run() {
            const enabledActions = this.extensionActions.filter(a => a.enabled);
            return enabledActions[0].run();
        }
        getLabel(action) {
            return action.label;
        }
    }
    exports.ActionWithDropDownAction = ActionWithDropDownAction;
    let AbstractInstallAction = class AbstractInstallAction extends ExtensionAction {
        constructor(id, installPreReleaseVersion, cssClass, extensionsWorkbenchService, instantiationService, runtimeExtensionService, workbenchThemeService, labelService) {
            super(id, (0, nls_1.localize)('install', "Install"), cssClass, false);
            this.installPreReleaseVersion = installPreReleaseVersion;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.instantiationService = instantiationService;
            this.runtimeExtensionService = runtimeExtensionService;
            this.workbenchThemeService = workbenchThemeService;
            this.labelService = labelService;
            this._manifest = null;
            this.updateThrottler = new async_1.Throttler();
            this.update();
            this._register(this.labelService.onDidChangeFormatters(() => this.updateLabel(), this));
        }
        set manifest(manifest) {
            this._manifest = manifest;
            this.updateLabel();
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateEnablement());
        }
        async computeAndUpdateEnablement() {
            this.enabled = false;
            if (this.extension && !this.extension.isBuiltin) {
                if (this.extension.state === 3 /* ExtensionState.Uninstalled */ && await this.extensionsWorkbenchService.canInstall(this.extension)) {
                    this.enabled = this.installPreReleaseVersion ? this.extension.hasPreReleaseVersion : this.extension.hasReleaseVersion;
                    this.updateLabel();
                }
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            this.extensionsWorkbenchService.open(this.extension, { showPreReleaseVersion: this.installPreReleaseVersion });
            (0, aria_1.alert)((0, nls_1.localize)('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
            const extension = await this.install(this.extension);
            if (extension === null || extension === void 0 ? void 0 : extension.local) {
                (0, aria_1.alert)((0, nls_1.localize)('installExtensionComplete', "Installing extension {0} is completed.", this.extension.displayName));
                const runningExtension = await this.getRunningExtension(extension.local);
                if (runningExtension && !(runningExtension.activationEvents && runningExtension.activationEvents.some(activationEent => activationEent.startsWith('onLanguage')))) {
                    const action = await this.getThemeAction(extension);
                    if (action) {
                        action.extension = extension;
                        try {
                            return action.run({ showCurrentTheme: true, ignoreFocusLost: true });
                        }
                        finally {
                            action.dispose();
                        }
                    }
                }
            }
        }
        async getThemeAction(extension) {
            const colorThemes = await this.workbenchThemeService.getColorThemes();
            if (colorThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetColorThemeAction);
            }
            const fileIconThemes = await this.workbenchThemeService.getFileIconThemes();
            if (fileIconThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetFileIconThemeAction);
            }
            const productIconThemes = await this.workbenchThemeService.getProductIconThemes();
            if (productIconThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetProductIconThemeAction);
            }
            return undefined;
        }
        async install(extension) {
            const installOptions = this.getInstallOptions();
            try {
                return await this.extensionsWorkbenchService.install(extension, installOptions);
            }
            catch (error) {
                await this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 2 /* InstallOperation.Install */, installOptions, error).run();
                return undefined;
            }
        }
        async getRunningExtension(extension) {
            const runningExtension = await this.runtimeExtensionService.getExtension(extension.identifier.id);
            if (runningExtension) {
                return runningExtension;
            }
            if (this.runtimeExtensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension))) {
                return new Promise((c, e) => {
                    const disposable = this.runtimeExtensionService.onDidChangeExtensions(async () => {
                        const runningExtension = await this.runtimeExtensionService.getExtension(extension.identifier.id);
                        if (runningExtension) {
                            disposable.dispose();
                            c(runningExtension);
                        }
                    });
                });
            }
            return null;
        }
        updateLabel() {
            this.label = this.getLabel();
        }
        getLabel(primary) {
            var _a, _b;
            /* install pre-release version */
            if (this.installPreReleaseVersion && ((_a = this.extension) === null || _a === void 0 ? void 0 : _a.hasPreReleaseVersion)) {
                return primary ? (0, nls_1.localize)('install pre-release', "Install Pre-Release") : (0, nls_1.localize)('install pre-release version', "Install Pre-Release Version");
            }
            /* install released version that has a pre release version */
            if ((_b = this.extension) === null || _b === void 0 ? void 0 : _b.hasPreReleaseVersion) {
                return primary ? (0, nls_1.localize)('install', "Install") : (0, nls_1.localize)('install release version', "Install Release Version");
            }
            return (0, nls_1.localize)('install', "Install");
        }
        getInstallOptions() {
            return { installPreReleaseVersion: this.installPreReleaseVersion };
        }
    };
    AbstractInstallAction.Class = `${ExtensionAction.LABEL_ACTION_CLASS} prominent install`;
    AbstractInstallAction = __decorate([
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensions_3.IExtensionService),
        __param(6, workbenchThemeService_1.IWorkbenchThemeService),
        __param(7, label_1.ILabelService)
    ], AbstractInstallAction);
    exports.AbstractInstallAction = AbstractInstallAction;
    let InstallAction = class InstallAction extends AbstractInstallAction {
        constructor(installPreReleaseVersion, extensionsWorkbenchService, instantiationService, runtimeExtensionService, workbenchThemeService, labelService, extensionManagementServerService, workbenchExtensioManagementService, userDataSyncEnablementService) {
            super(`extensions.install`, installPreReleaseVersion, InstallAction.Class, extensionsWorkbenchService, instantiationService, runtimeExtensionService, workbenchThemeService, labelService);
            this.extensionManagementServerService = extensionManagementServerService;
            this.workbenchExtensioManagementService = workbenchExtensioManagementService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.updateLabel();
            this._register(labelService.onDidChangeFormatters(() => this.updateLabel(), this));
            this._register(event_1.Event.any(userDataSyncEnablementService.onDidChangeEnablement, event_1.Event.filter(userDataSyncEnablementService.onDidChangeResourceEnablement, e => e[0] === "extensions" /* SyncResource.Extensions */))(() => this.update()));
        }
        getLabel(primary) {
            const baseLabel = super.getLabel(primary);
            const donotSyncLabel = (0, nls_1.localize)('do no sync', "Do not sync");
            const isMachineScoped = this.getInstallOptions().isMachineScoped;
            // When remote connection exists
            if (this._manifest && this.extensionManagementServerService.remoteExtensionManagementServer) {
                const server = this.workbenchExtensioManagementService.getExtensionManagementServerToInstall(this._manifest);
                if (server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                    const host = this.extensionManagementServerService.remoteExtensionManagementServer.label;
                    return isMachineScoped
                        ? (0, nls_1.localize)({
                            key: 'install extension in remote and do not sync',
                            comment: [
                                'First placeholder is install action label.',
                                'Second placeholder is the name of the action to install an extension in remote server and do not sync it. Placeholder is for the name of remote server.',
                                'Third placeholder is do not sync label.',
                            ]
                        }, "{0} in {1} ({2})", baseLabel, host, donotSyncLabel)
                        : (0, nls_1.localize)({
                            key: 'install extension in remote',
                            comment: [
                                'First placeholder is install action label.',
                                'Second placeholder is the name of the action to install an extension in remote server and do not sync it. Placeholder is for the name of remote server.',
                            ]
                        }, "{0} in {1}", baseLabel, host);
                }
                return isMachineScoped ?
                    (0, nls_1.localize)('install extension locally and do not sync', "{0} Locally ({1})", baseLabel, donotSyncLabel) : (0, nls_1.localize)('install extension locally', "{0} Locally", baseLabel);
            }
            return isMachineScoped ? `${baseLabel} (${donotSyncLabel})` : baseLabel;
        }
        getInstallOptions() {
            return Object.assign(Object.assign({}, super.getInstallOptions()), { isMachineScoped: this.userDataSyncEnablementService.isEnabled() && this.userDataSyncEnablementService.isResourceEnabled("extensions" /* SyncResource.Extensions */) });
        }
    };
    InstallAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_3.IExtensionService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, label_1.ILabelService),
        __param(6, extensionManagement_2.IExtensionManagementServerService),
        __param(7, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService)
    ], InstallAction);
    exports.InstallAction = InstallAction;
    let InstallAndSyncAction = class InstallAndSyncAction extends AbstractInstallAction {
        constructor(installPreReleaseVersion, extensionsWorkbenchService, instantiationService, runtimeExtensionService, workbenchThemeService, labelService, productService, userDataSyncEnablementService) {
            super('extensions.installAndSync', installPreReleaseVersion, AbstractInstallAction.Class, extensionsWorkbenchService, instantiationService, runtimeExtensionService, workbenchThemeService, labelService);
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.tooltip = (0, nls_1.localize)({ key: 'install everywhere tooltip', comment: ['Placeholder is the name of the product. Eg: Visual Studio Code or Visual Studio Code - Insiders'] }, "Install this extension in all your synced {0} instances", productService.nameLong);
            this._register(event_1.Event.any(userDataSyncEnablementService.onDidChangeEnablement, event_1.Event.filter(userDataSyncEnablementService.onDidChangeResourceEnablement, e => e[0] === "extensions" /* SyncResource.Extensions */))(() => this.update()));
        }
        async computeAndUpdateEnablement() {
            await super.computeAndUpdateEnablement();
            if (this.enabled) {
                this.enabled = this.userDataSyncEnablementService.isEnabled() && this.userDataSyncEnablementService.isResourceEnabled("extensions" /* SyncResource.Extensions */);
            }
        }
        getInstallOptions() {
            return Object.assign(Object.assign({}, super.getInstallOptions()), { isMachineScoped: false });
        }
    };
    InstallAndSyncAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_3.IExtensionService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, label_1.ILabelService),
        __param(6, productService_1.IProductService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService)
    ], InstallAndSyncAction);
    exports.InstallAndSyncAction = InstallAndSyncAction;
    let InstallDropdownAction = class InstallDropdownAction extends ActionWithDropDownAction {
        set manifest(manifest) {
            this.extensionActions.forEach(a => a.manifest = manifest);
            this.update();
        }
        constructor(instantiationService, extensionsWorkbenchService) {
            super(`extensions.installActions`, '', [
                [
                    instantiationService.createInstance(InstallAndSyncAction, extensionsWorkbenchService.preferPreReleases),
                    instantiationService.createInstance(InstallAndSyncAction, !extensionsWorkbenchService.preferPreReleases),
                ],
                [
                    instantiationService.createInstance(InstallAction, extensionsWorkbenchService.preferPreReleases),
                    instantiationService.createInstance(InstallAction, !extensionsWorkbenchService.preferPreReleases),
                ]
            ]);
        }
        getLabel(action) {
            return action.getLabel(true);
        }
    };
    InstallDropdownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], InstallDropdownAction);
    exports.InstallDropdownAction = InstallDropdownAction;
    class InstallingLabelAction extends ExtensionAction {
        constructor() {
            super('extension.installing', InstallingLabelAction.LABEL, InstallingLabelAction.CLASS, false);
        }
        update() {
            this.class = `${InstallingLabelAction.CLASS}${this.extension && this.extension.state === 0 /* ExtensionState.Installing */ ? '' : ' hide'}`;
        }
    }
    exports.InstallingLabelAction = InstallingLabelAction;
    InstallingLabelAction.LABEL = (0, nls_1.localize)('installing', "Installing");
    InstallingLabelAction.CLASS = `${ExtensionAction.LABEL_ACTION_CLASS} install installing`;
    let InstallInOtherServerAction = class InstallInOtherServerAction extends ExtensionAction {
        constructor(id, server, canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(id, InstallInOtherServerAction.INSTALL_LABEL, InstallInOtherServerAction.Class, false);
            this.server = server;
            this.canInstallAnyWhere = canInstallAnyWhere;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.updateWhenCounterExtensionChanges = true;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = InstallInOtherServerAction.Class;
            if (this.canInstall()) {
                const extensionInOtherServer = this.extensionsWorkbenchService.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server === this.server)[0];
                if (extensionInOtherServer) {
                    // Getting installed in other server
                    if (extensionInOtherServer.state === 0 /* ExtensionState.Installing */ && !extensionInOtherServer.local) {
                        this.enabled = true;
                        this.label = InstallInOtherServerAction.INSTALLING_LABEL;
                        this.class = InstallInOtherServerAction.InstallingClass;
                    }
                }
                else {
                    // Not installed in other server
                    this.enabled = true;
                    this.label = this.getInstallLabel();
                }
            }
        }
        canInstall() {
            // Disable if extension is not installed or not an user extension
            if (!this.extension
                || !this.server
                || !this.extension.local
                || this.extension.state !== 1 /* ExtensionState.Installed */
                || this.extension.type !== 1 /* ExtensionType.User */
                || this.extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */ || this.extension.enablementState === 0 /* EnablementState.DisabledByTrustRequirement */ || this.extension.enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                return false;
            }
            if ((0, extensions_2.isLanguagePackExtension)(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on UI
            if (this.server === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on Workspace
            if (this.server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on Web
            if (this.server === this.extensionManagementServerService.webExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWeb(this.extension.local.manifest)) {
                return true;
            }
            if (this.canInstallAnyWhere) {
                // Can run on UI
                if (this.server === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.canExecuteOnUI(this.extension.local.manifest)) {
                    return true;
                }
                // Can run on Workspace
                if (this.server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.canExecuteOnWorkspace(this.extension.local.manifest)) {
                    return true;
                }
            }
            return false;
        }
        async run() {
            if (!this.extension) {
                return;
            }
            if (this.server) {
                this.extensionsWorkbenchService.open(this.extension);
                (0, aria_1.alert)((0, nls_1.localize)('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
                if (this.extension.gallery) {
                    await this.server.extensionManagementService.installFromGallery(this.extension.gallery);
                }
                else {
                    const vsix = await this.extension.server.extensionManagementService.zip(this.extension.local);
                    await this.server.extensionManagementService.install(vsix);
                }
            }
        }
    };
    InstallInOtherServerAction.INSTALL_LABEL = (0, nls_1.localize)('install', "Install");
    InstallInOtherServerAction.INSTALLING_LABEL = (0, nls_1.localize)('installing', "Installing");
    InstallInOtherServerAction.Class = `${ExtensionAction.LABEL_ACTION_CLASS} prominent install`;
    InstallInOtherServerAction.InstallingClass = `${ExtensionAction.LABEL_ACTION_CLASS} install installing`;
    InstallInOtherServerAction = __decorate([
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensionManagement_2.IExtensionManagementServerService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], InstallInOtherServerAction);
    exports.InstallInOtherServerAction = InstallInOtherServerAction;
    let RemoteInstallAction = class RemoteInstallAction extends InstallInOtherServerAction {
        constructor(canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.remoteinstall`, extensionManagementServerService.remoteExtensionManagementServer, canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return this.extensionManagementServerService.remoteExtensionManagementServer
                ? (0, nls_1.localize)({ key: 'install in remote', comment: ['This is the name of the action to install an extension in remote server. Placeholder is for the name of remote server.'] }, "Install in {0}", this.extensionManagementServerService.remoteExtensionManagementServer.label)
                : InstallInOtherServerAction.INSTALL_LABEL;
        }
    };
    RemoteInstallAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IExtensionManagementServerService),
        __param(3, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteInstallAction);
    exports.RemoteInstallAction = RemoteInstallAction;
    let LocalInstallAction = class LocalInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.localinstall`, extensionManagementServerService.localExtensionManagementServer, false, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return (0, nls_1.localize)('install locally', "Install Locally");
        }
    };
    LocalInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], LocalInstallAction);
    exports.LocalInstallAction = LocalInstallAction;
    let WebInstallAction = class WebInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.webInstall`, extensionManagementServerService.webExtensionManagementServer, false, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return (0, nls_1.localize)('install browser', "Install in Browser");
        }
    };
    WebInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], WebInstallAction);
    exports.WebInstallAction = WebInstallAction;
    let UninstallAction = class UninstallAction extends ExtensionAction {
        constructor(extensionsWorkbenchService) {
            super('extensions.uninstall', UninstallAction.UninstallLabel, UninstallAction.UninstallClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            if (!this.extension) {
                this.enabled = false;
                return;
            }
            const state = this.extension.state;
            if (state === 2 /* ExtensionState.Uninstalling */) {
                this.label = UninstallAction.UninstallingLabel;
                this.class = UninstallAction.UnInstallingClass;
                this.enabled = false;
                return;
            }
            this.label = UninstallAction.UninstallLabel;
            this.class = UninstallAction.UninstallClass;
            this.tooltip = UninstallAction.UninstallLabel;
            if (state !== 1 /* ExtensionState.Installed */) {
                this.enabled = false;
                return;
            }
            if (this.extension.isBuiltin) {
                this.enabled = false;
                return;
            }
            this.enabled = true;
        }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('uninstallExtensionStart', "Uninstalling extension {0} started.", this.extension.displayName));
            return this.extensionsWorkbenchService.uninstall(this.extension).then(() => {
                (0, aria_1.alert)((0, nls_1.localize)('uninstallExtensionComplete', "Please reload Visual Studio Code to complete the uninstallation of the extension {0}.", this.extension.displayName));
            });
        }
    };
    UninstallAction.UninstallLabel = (0, nls_1.localize)('uninstallAction', "Uninstall");
    UninstallAction.UninstallingLabel = (0, nls_1.localize)('Uninstalling', "Uninstalling");
    UninstallAction.UninstallClass = `${ExtensionAction.LABEL_ACTION_CLASS} uninstall`;
    UninstallAction.UnInstallingClass = `${ExtensionAction.LABEL_ACTION_CLASS} uninstall uninstalling`;
    UninstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], UninstallAction);
    exports.UninstallAction = UninstallAction;
    let UpdateAction = class UpdateAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, instantiationService) {
            super(`extensions.update`, '', UpdateAction.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.instantiationService = instantiationService;
            this.updateThrottler = new async_1.Throttler();
            this.update();
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateEnablement());
        }
        async computeAndUpdateEnablement() {
            if (!this.extension) {
                this.enabled = false;
                this.class = UpdateAction.DisabledClass;
                this.label = this.getLabel();
                return;
            }
            const canInstall = await this.extensionsWorkbenchService.canInstall(this.extension);
            const isInstalled = this.extension.state === 1 /* ExtensionState.Installed */;
            this.enabled = canInstall && isInstalled && this.extension.outdated;
            this.class = this.enabled ? UpdateAction.EnabledClass : UpdateAction.DisabledClass;
            this.label = this.getLabel(this.extension);
        }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('updateExtensionStart', "Updating extension {0} to version {1} started.", this.extension.displayName, this.extension.latestVersion));
            return this.install(this.extension);
        }
        async install(extension) {
            var _a;
            try {
                await this.extensionsWorkbenchService.install(extension, ((_a = extension.local) === null || _a === void 0 ? void 0 : _a.preRelease) ? { installPreReleaseVersion: true } : undefined);
                (0, aria_1.alert)((0, nls_1.localize)('updateExtensionComplete', "Updating extension {0} to version {1} completed.", extension.displayName, extension.latestVersion));
            }
            catch (err) {
                this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 3 /* InstallOperation.Update */, undefined, err).run();
            }
        }
        getLabel(extension) {
            if (!(extension === null || extension === void 0 ? void 0 : extension.outdated)) {
                return (0, nls_1.localize)('updateAction', "Update");
            }
            if (extension.outdatedTargetPlatform) {
                return (0, nls_1.localize)('updateToTargetPlatformVersion', "Update to {0} version", (0, extensionManagement_1.TargetPlatformToString)(extension.gallery.properties.targetPlatform));
            }
            return (0, nls_1.localize)('updateToLatestVersion', "Update to {0}", extension.latestVersion);
        }
    };
    UpdateAction.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} prominent update`;
    UpdateAction.DisabledClass = `${UpdateAction.EnabledClass} disabled`;
    UpdateAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, instantiation_1.IInstantiationService)
    ], UpdateAction);
    exports.UpdateAction = UpdateAction;
    class ExtensionActionWithDropdownActionViewItem extends dropdownActionViewItem_1.ActionWithDropdownActionViewItem {
        constructor(action, options, contextMenuProvider) {
            super(null, action, options, contextMenuProvider);
        }
        render(container) {
            super.render(container);
            this.updateClass();
        }
        updateClass() {
            super.updateClass();
            if (this.element && this.dropdownMenuActionViewItem && this.dropdownMenuActionViewItem.element) {
                this.element.classList.toggle('empty', this._action.menuActions.length === 0);
                this.dropdownMenuActionViewItem.element.classList.toggle('hide', this._action.menuActions.length === 0);
            }
        }
    }
    exports.ExtensionActionWithDropdownActionViewItem = ExtensionActionWithDropdownActionViewItem;
    let ExtensionDropDownAction = class ExtensionDropDownAction extends ExtensionAction {
        constructor(id, label, cssClass, enabled, instantiationService) {
            super(id, label, cssClass, enabled);
            this.instantiationService = instantiationService;
            this._actionViewItem = null;
        }
        createActionViewItem() {
            this._actionViewItem = this.instantiationService.createInstance(DropDownMenuActionViewItem, this);
            return this._actionViewItem;
        }
        run({ actionGroups, disposeActionsOnHide }) {
            if (this._actionViewItem) {
                this._actionViewItem.showMenu(actionGroups, disposeActionsOnHide);
            }
            return Promise.resolve();
        }
    };
    ExtensionDropDownAction = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], ExtensionDropDownAction);
    exports.ExtensionDropDownAction = ExtensionDropDownAction;
    let DropDownMenuActionViewItem = class DropDownMenuActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action, contextMenuService) {
            super(null, action, { icon: true, label: true });
            this.contextMenuService = contextMenuService;
        }
        showMenu(menuActionGroups, disposeActionsOnHide) {
            if (this.element) {
                const actions = this.getActions(menuActionGroups);
                let elementPosition = DOM.getDomNodePagePosition(this.element);
                const anchor = { x: elementPosition.left, y: elementPosition.top + elementPosition.height + 10 };
                this.contextMenuService.showContextMenu({
                    getAnchor: () => anchor,
                    getActions: () => actions,
                    actionRunner: this.actionRunner,
                    onHide: () => { if (disposeActionsOnHide) {
                        (0, lifecycle_1.dispose)(actions);
                    } }
                });
            }
        }
        getActions(menuActionGroups) {
            let actions = [];
            for (const menuActions of menuActionGroups) {
                actions = [...actions, ...menuActions, new actions_1.Separator()];
            }
            return actions.length ? actions.slice(0, actions.length - 1) : actions;
        }
    };
    DropDownMenuActionViewItem = __decorate([
        __param(1, contextView_1.IContextMenuService)
    ], DropDownMenuActionViewItem);
    exports.DropDownMenuActionViewItem = DropDownMenuActionViewItem;
    async function getContextMenuActionsGroups(extension, contextKeyService, instantiationService) {
        return instantiationService.invokeFunction(async (accessor) => {
            var _a, _b, _c;
            const menuService = accessor.get(actions_2.IMenuService);
            const extensionRecommendationsService = accessor.get(extensionRecommendations_1.IExtensionRecommendationsService);
            const extensionIgnoredRecommendationsService = accessor.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService);
            const workbenchThemeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const cksOverlay = [];
            if (extension) {
                cksOverlay.push(['extension', extension.identifier.id]);
                cksOverlay.push(['isBuiltinExtension', extension.isBuiltin]);
                cksOverlay.push(['extensionHasConfiguration', extension.local && !!extension.local.manifest.contributes && !!extension.local.manifest.contributes.configuration]);
                cksOverlay.push(['isExtensionRecommended', !!extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()]]);
                cksOverlay.push(['isExtensionWorkspaceRecommended', ((_a = extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()]) === null || _a === void 0 ? void 0 : _a.reasonId) === 0 /* ExtensionRecommendationReason.Workspace */]);
                cksOverlay.push(['isUserIgnoredRecommendation', extensionIgnoredRecommendationsService.globalIgnoredRecommendations.some(e => e === extension.identifier.id.toLowerCase())]);
                if (extension.state === 1 /* ExtensionState.Installed */) {
                    cksOverlay.push(['extensionStatus', 'installed']);
                }
                cksOverlay.push(['installedExtensionIsPreReleaseVersion', !!((_b = extension.local) === null || _b === void 0 ? void 0 : _b.isPreReleaseVersion)]);
                cksOverlay.push(['galleryExtensionIsPreReleaseVersion', !!((_c = extension.gallery) === null || _c === void 0 ? void 0 : _c.properties.isPreReleaseVersion)]);
                cksOverlay.push(['extensionHasPreReleaseVersion', extension.hasPreReleaseVersion]);
                cksOverlay.push(['extensionHasReleaseVersion', extension.hasReleaseVersion]);
                const [colorThemes, fileIconThemes, productIconThemes] = await Promise.all([workbenchThemeService.getColorThemes(), workbenchThemeService.getFileIconThemes(), workbenchThemeService.getProductIconThemes()]);
                cksOverlay.push(['extensionHasColorThemes', colorThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['extensionHasFileIconThemes', fileIconThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['extensionHasProductIconThemes', productIconThemes.some(theme => isThemeFromExtension(theme, extension))]);
            }
            const menu = menuService.createMenu(actions_2.MenuId.ExtensionContext, contextKeyService.createOverlay(cksOverlay));
            const actionsGroups = menu.getActions({ shouldForwardArgs: true });
            menu.dispose();
            return actionsGroups;
        });
    }
    function toActions(actionsGroups, instantiationService) {
        const result = [];
        for (const [, actions] of actionsGroups) {
            result.push(actions.map(action => {
                if (action instanceof actions_1.SubmenuAction) {
                    return action;
                }
                return instantiationService.createInstance(MenuItemExtensionAction, action);
            }));
        }
        return result;
    }
    async function getContextMenuActions(extension, contextKeyService, instantiationService) {
        const actionsGroups = await getContextMenuActionsGroups(extension, contextKeyService, instantiationService);
        return toActions(actionsGroups, instantiationService);
    }
    exports.getContextMenuActions = getContextMenuActions;
    let ManageExtensionAction = class ManageExtensionAction extends ExtensionDropDownAction {
        constructor(instantiationService, extensionService, contextKeyService) {
            super(ManageExtensionAction.ID, '', '', true, instantiationService);
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.tooltip = (0, nls_1.localize)('manage', "Manage");
            this.update();
        }
        async getActionGroups(runningExtensions) {
            const groups = [];
            const contextMenuActionsGroups = await getContextMenuActionsGroups(this.extension, this.contextKeyService, this.instantiationService);
            const themeActions = [], installActions = [], otherActionGroups = [];
            for (const [group, actions] of contextMenuActionsGroups) {
                if (group === extensions_1.INSTALL_ACTIONS_GROUP) {
                    installActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else if (group === extensions_1.THEME_ACTIONS_GROUP) {
                    themeActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else {
                    otherActionGroups.push(...toActions([[group, actions]], this.instantiationService));
                }
            }
            if (themeActions.length) {
                groups.push(themeActions);
            }
            groups.push([
                this.instantiationService.createInstance(EnableGloballyAction),
                this.instantiationService.createInstance(EnableForWorkspaceAction)
            ]);
            groups.push([
                this.instantiationService.createInstance(DisableGloballyAction, runningExtensions),
                this.instantiationService.createInstance(DisableForWorkspaceAction, runningExtensions)
            ]);
            groups.push([
                ...(installActions.length ? installActions : []),
                this.instantiationService.createInstance(InstallAnotherVersionAction),
                this.instantiationService.createInstance(UninstallAction),
            ]);
            otherActionGroups.forEach(actions => groups.push(actions));
            groups.forEach(group => group.forEach(extensionAction => {
                if (extensionAction instanceof ExtensionAction) {
                    extensionAction.extension = this.extension;
                }
            }));
            return groups;
        }
        async run() {
            const runtimeExtensions = await this.extensionService.getExtensions();
            return super.run({ actionGroups: await this.getActionGroups(runtimeExtensions), disposeActionsOnHide: true });
        }
        update() {
            this.class = ManageExtensionAction.HideManageExtensionClass;
            this.enabled = false;
            if (this.extension) {
                const state = this.extension.state;
                this.enabled = state === 1 /* ExtensionState.Installed */;
                this.class = this.enabled || state === 2 /* ExtensionState.Uninstalling */ ? ManageExtensionAction.Class : ManageExtensionAction.HideManageExtensionClass;
                this.tooltip = state === 2 /* ExtensionState.Uninstalling */ ? (0, nls_1.localize)('ManageExtensionAction.uninstallingTooltip', "Uninstalling") : '';
            }
        }
    };
    ManageExtensionAction.ID = 'extensions.manage';
    ManageExtensionAction.Class = `${ExtensionAction.ICON_ACTION_CLASS} manage ` + themeService_1.ThemeIcon.asClassName(extensionsIcons_1.manageExtensionIcon);
    ManageExtensionAction.HideManageExtensionClass = `${ManageExtensionAction.Class} hide`;
    ManageExtensionAction = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_3.IExtensionService),
        __param(2, contextkey_1.IContextKeyService)
    ], ManageExtensionAction);
    exports.ManageExtensionAction = ManageExtensionAction;
    class ExtensionEditorManageExtensionAction extends ExtensionDropDownAction {
        constructor(contextKeyService, instantiationService) {
            super('extensionEditor.manageExtension', '', `${ExtensionAction.ICON_ACTION_CLASS} manage ${themeService_1.ThemeIcon.asClassName(extensionsIcons_1.manageExtensionIcon)}`, true, instantiationService);
            this.contextKeyService = contextKeyService;
            this.tooltip = (0, nls_1.localize)('manage', "Manage");
        }
        update() { }
        async run() {
            const actionGroups = [];
            (await getContextMenuActions(this.extension, this.contextKeyService, this.instantiationService)).forEach(actions => actionGroups.push(actions));
            actionGroups.forEach(group => group.forEach(extensionAction => {
                if (extensionAction instanceof ExtensionAction) {
                    extensionAction.extension = this.extension;
                }
            }));
            return super.run({ actionGroups, disposeActionsOnHide: true });
        }
    }
    exports.ExtensionEditorManageExtensionAction = ExtensionEditorManageExtensionAction;
    let MenuItemExtensionAction = class MenuItemExtensionAction extends ExtensionAction {
        constructor(action, extensionsWorkbenchService) {
            super(action.id, action.label);
            this.action = action;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
        }
        update() {
            if (!this.extension) {
                return;
            }
            if (this.action.id === extensions_1.TOGGLE_IGNORE_EXTENSION_ACTION_ID) {
                this.checked = !this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension);
            }
        }
        async run() {
            if (this.extension) {
                await this.action.run(this.extension.local ? (0, extensionManagementUtil_1.getExtensionId)(this.extension.local.manifest.publisher, this.extension.local.manifest.name)
                    : this.extension.gallery ? (0, extensionManagementUtil_1.getExtensionId)(this.extension.gallery.publisher, this.extension.gallery.name)
                        : this.extension.identifier.id);
            }
        }
    };
    MenuItemExtensionAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], MenuItemExtensionAction);
    exports.MenuItemExtensionAction = MenuItemExtensionAction;
    let SwitchToPreReleaseVersionAction = class SwitchToPreReleaseVersionAction extends ExtensionAction {
        constructor(commandService) {
            super(SwitchToPreReleaseVersionAction.ID, SwitchToPreReleaseVersionAction.TITLE.value, SwitchToPreReleaseVersionAction.Class);
            this.commandService = commandService;
            this.update();
        }
        update() {
            var _a;
            this.enabled = !!this.extension && !this.extension.isBuiltin && !((_a = this.extension.local) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion) && this.extension.hasPreReleaseVersion && this.extension.state === 1 /* ExtensionState.Installed */;
        }
        async run() {
            var _a;
            if (!this.enabled) {
                return;
            }
            return this.commandService.executeCommand(SwitchToPreReleaseVersionAction.ID, (_a = this.extension) === null || _a === void 0 ? void 0 : _a.identifier.id);
        }
    };
    SwitchToPreReleaseVersionAction.ID = 'workbench.extensions.action.switchToPreReleaseVersion';
    SwitchToPreReleaseVersionAction.TITLE = { value: (0, nls_1.localize)('switch to pre-release version', "Switch to Pre-Release Version"), original: 'Switch to  Pre-Release Version' };
    SwitchToPreReleaseVersionAction.Class = `${ExtensionAction.LABEL_ACTION_CLASS} hide-when-disabled`;
    SwitchToPreReleaseVersionAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], SwitchToPreReleaseVersionAction);
    exports.SwitchToPreReleaseVersionAction = SwitchToPreReleaseVersionAction;
    let SwitchToReleasedVersionAction = class SwitchToReleasedVersionAction extends ExtensionAction {
        constructor(commandService) {
            super(SwitchToReleasedVersionAction.ID, SwitchToReleasedVersionAction.TITLE.value, SwitchToReleasedVersionAction.Class);
            this.commandService = commandService;
            this.update();
        }
        update() {
            var _a;
            this.enabled = !!this.extension && !this.extension.isBuiltin && this.extension.state === 1 /* ExtensionState.Installed */ && !!((_a = this.extension.local) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion) && !!this.extension.hasReleaseVersion;
        }
        async run() {
            var _a;
            if (!this.enabled) {
                return;
            }
            return this.commandService.executeCommand(SwitchToReleasedVersionAction.ID, (_a = this.extension) === null || _a === void 0 ? void 0 : _a.identifier.id);
        }
    };
    SwitchToReleasedVersionAction.ID = 'workbench.extensions.action.switchToReleaseVersion';
    SwitchToReleasedVersionAction.TITLE = { value: (0, nls_1.localize)('switch to release version', "Switch to Release Version"), original: 'Switch to Release Version' };
    SwitchToReleasedVersionAction.Class = `${ExtensionAction.LABEL_ACTION_CLASS} hide-when-disabled`;
    SwitchToReleasedVersionAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], SwitchToReleasedVersionAction);
    exports.SwitchToReleasedVersionAction = SwitchToReleasedVersionAction;
    let InstallAnotherVersionAction = class InstallAnotherVersionAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, extensionGalleryService, quickInputService, instantiationService, dialogService) {
            super(InstallAnotherVersionAction.ID, InstallAnotherVersionAction.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionGalleryService = extensionGalleryService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.update();
        }
        update() {
            this.enabled = !!this.extension && !this.extension.isBuiltin && !!this.extension.gallery && !!this.extension.local && !!this.extension.server && this.extension.state === 1 /* ExtensionState.Installed */;
        }
        async run() {
            if (!this.enabled) {
                return;
            }
            const targetPlatform = await this.extension.server.extensionManagementService.getTargetPlatform();
            const allVersions = await this.extensionGalleryService.getAllCompatibleVersions(this.extension.gallery, this.extension.local.isPreReleaseVersion, targetPlatform);
            if (!allVersions.length) {
                await this.dialogService.show(notification_1.Severity.Info, (0, nls_1.localize)('no versions', "This extension has no other versions."));
                return;
            }
            const picks = allVersions.map((v, i) => {
                return {
                    id: v.version,
                    label: v.version,
                    description: `${(0, date_1.fromNow)(new Date(Date.parse(v.date)), true)}${v.isPreReleaseVersion ? ` (${(0, nls_1.localize)('pre-release', "pre-release")})` : ''}${v.version === this.extension.version ? ` (${(0, nls_1.localize)('current', "current")})` : ''}`,
                    latest: i === 0,
                    ariaLabel: `${v.isPreReleaseVersion ? 'Pre-Release version' : 'Release version'} ${v.version}`,
                    isPreReleaseVersion: v.isPreReleaseVersion
                };
            });
            const pick = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('selectVersion', "Select Version to Install"),
                matchOnDetail: true
            });
            if (pick) {
                if (this.extension.version === pick.id) {
                    return;
                }
                try {
                    if (pick.latest) {
                        await this.extensionsWorkbenchService.install(this.extension, { installPreReleaseVersion: pick.isPreReleaseVersion });
                    }
                    else {
                        await this.extensionsWorkbenchService.installVersion(this.extension, pick.id, { installPreReleaseVersion: pick.isPreReleaseVersion });
                    }
                }
                catch (error) {
                    this.instantiationService.createInstance(PromptExtensionInstallFailureAction, this.extension, pick.latest ? this.extension.latestVersion : pick.id, 2 /* InstallOperation.Install */, undefined, error).run();
                }
            }
            return null;
        }
    };
    InstallAnotherVersionAction.ID = 'workbench.extensions.action.install.anotherVersion';
    InstallAnotherVersionAction.LABEL = (0, nls_1.localize)('install another version', "Install Another Version...");
    InstallAnotherVersionAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, dialogs_1.IDialogService)
    ], InstallAnotherVersionAction);
    exports.InstallAnotherVersionAction = InstallAnotherVersionAction;
    let EnableForWorkspaceAction = class EnableForWorkspaceAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableForWorkspaceAction.ID, EnableForWorkspaceAction.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('enableForWorkspaceActionToolTip', "Enable this extension only in this workspace");
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && !this.extensionEnablementService.isEnabled(this.extension.local)
                    && this.extensionEnablementService.canChangeWorkspaceEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 9 /* EnablementState.EnabledWorkspace */);
        }
    };
    EnableForWorkspaceAction.ID = 'extensions.enableForWorkspace';
    EnableForWorkspaceAction.LABEL = (0, nls_1.localize)('enableForWorkspaceAction', "Enable (Workspace)");
    EnableForWorkspaceAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], EnableForWorkspaceAction);
    exports.EnableForWorkspaceAction = EnableForWorkspaceAction;
    let EnableGloballyAction = class EnableGloballyAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableGloballyAction.ID, EnableGloballyAction.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('enableGloballyActionToolTip', "Enable this extension");
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && this.extensionEnablementService.isDisabledGlobally(this.extension.local)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 8 /* EnablementState.EnabledGlobally */);
        }
    };
    EnableGloballyAction.ID = 'extensions.enableGlobally';
    EnableGloballyAction.LABEL = (0, nls_1.localize)('enableGloballyAction', "Enable");
    EnableGloballyAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], EnableGloballyAction);
    exports.EnableGloballyAction = EnableGloballyAction;
    let DisableForWorkspaceAction = class DisableForWorkspaceAction extends ExtensionAction {
        constructor(_runningExtensions, workspaceContextService, extensionsWorkbenchService, extensionEnablementService) {
            super(DisableForWorkspaceAction.ID, DisableForWorkspaceAction.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this._runningExtensions = _runningExtensions;
            this.workspaceContextService = workspaceContextService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('disableForWorkspaceActionToolTip', "Disable this extension only in this workspace");
            this.update();
        }
        set runningExtensions(runningExtensions) {
            this._runningExtensions = runningExtensions;
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && this._runningExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.workspaceContextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */)) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */ || this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeWorkspaceEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 7 /* EnablementState.DisabledWorkspace */);
        }
    };
    DisableForWorkspaceAction.ID = 'extensions.disableForWorkspace';
    DisableForWorkspaceAction.LABEL = (0, nls_1.localize)('disableForWorkspaceAction', "Disable (Workspace)");
    DisableForWorkspaceAction = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], DisableForWorkspaceAction);
    exports.DisableForWorkspaceAction = DisableForWorkspaceAction;
    let DisableGloballyAction = class DisableGloballyAction extends ExtensionAction {
        constructor(_runningExtensions, extensionsWorkbenchService, extensionEnablementService) {
            super(DisableGloballyAction.ID, DisableGloballyAction.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this._runningExtensions = _runningExtensions;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('disableGloballyActionToolTip', "Disable this extension");
            this.update();
        }
        set runningExtensions(runningExtensions) {
            this._runningExtensions = runningExtensions;
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && this._runningExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */ || this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 6 /* EnablementState.DisabledGlobally */);
        }
    };
    DisableGloballyAction.ID = 'extensions.disableGlobally';
    DisableGloballyAction.LABEL = (0, nls_1.localize)('disableGloballyAction', "Disable");
    DisableGloballyAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], DisableGloballyAction);
    exports.DisableGloballyAction = DisableGloballyAction;
    let EnableDropDownAction = class EnableDropDownAction extends ActionWithDropDownAction {
        constructor(instantiationService) {
            super('extensions.enable', (0, nls_1.localize)('enableAction', "Enable"), [
                [
                    instantiationService.createInstance(EnableGloballyAction),
                    instantiationService.createInstance(EnableForWorkspaceAction)
                ]
            ]);
        }
    };
    EnableDropDownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], EnableDropDownAction);
    exports.EnableDropDownAction = EnableDropDownAction;
    let DisableDropDownAction = class DisableDropDownAction extends ActionWithDropDownAction {
        constructor(extensionService, instantiationService) {
            const actions = [
                instantiationService.createInstance(DisableGloballyAction, []),
                instantiationService.createInstance(DisableForWorkspaceAction, [])
            ];
            super('extensions.disable', (0, nls_1.localize)('disableAction', "Disable"), [actions]);
            const updateRunningExtensions = async () => {
                const runningExtensions = await extensionService.getExtensions();
                actions.forEach(a => a.runningExtensions = runningExtensions);
            };
            updateRunningExtensions();
            this._register(extensionService.onDidChangeExtensions(() => updateRunningExtensions()));
        }
    };
    DisableDropDownAction = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, instantiation_1.IInstantiationService)
    ], DisableDropDownAction);
    exports.DisableDropDownAction = DisableDropDownAction;
    let ReloadAction = class ReloadAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, hostService, extensionService, extensionEnablementService, extensionManagementServerService, extensionManifestPropertiesService, productService, configurationService) {
            super('extensions.reload', (0, nls_1.localize)('reloadAction', "Reload"), ReloadAction.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.hostService = hostService;
            this.extensionService = extensionService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.updateWhenCounterExtensionChanges = true;
            this._runningExtensions = null;
            this._register(this.extensionService.onDidChangeExtensions(this.updateRunningExtensions, this));
            this.updateRunningExtensions();
        }
        updateRunningExtensions() {
            this.extensionService.getExtensions().then(runningExtensions => { this._runningExtensions = runningExtensions; this.update(); });
        }
        update() {
            this.enabled = false;
            this.tooltip = '';
            if (!this.extension || !this._runningExtensions) {
                return;
            }
            const state = this.extension.state;
            if (state === 0 /* ExtensionState.Installing */ || state === 2 /* ExtensionState.Uninstalling */) {
                return;
            }
            if (this.extension.local && this.extension.local.manifest && this.extension.local.manifest.contributes && this.extension.local.manifest.contributes.localizations && this.extension.local.manifest.contributes.localizations.length > 0) {
                return;
            }
            this.computeReloadState();
            this.class = this.enabled ? ReloadAction.EnabledClass : ReloadAction.DisabledClass;
        }
        computeReloadState() {
            var _a;
            if (!this._runningExtensions || !this.extension) {
                return;
            }
            const isUninstalled = this.extension.state === 3 /* ExtensionState.Uninstalled */;
            const runningExtension = this._runningExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier));
            if (isUninstalled) {
                const canRemoveRunningExtension = runningExtension && this.extensionService.canRemoveExtension(runningExtension);
                const isSameExtensionRunning = runningExtension && (!this.extension.server || this.extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension)));
                if (!canRemoveRunningExtension && isSameExtensionRunning) {
                    this.enabled = true;
                    this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                    this.tooltip = (0, nls_1.localize)('postUninstallTooltip', "Please reload Visual Studio Code to complete the uninstallation of this extension.");
                    (0, aria_1.alert)((0, nls_1.localize)('uninstallExtensionComplete', "Please reload Visual Studio Code to complete the uninstallation of the extension {0}.", this.extension.displayName));
                }
                return;
            }
            if (this.extension.local) {
                const isSameExtensionRunning = runningExtension && this.extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension));
                const isEnabled = this.extensionEnablementService.isEnabled(this.extension.local);
                // Extension is running
                if (runningExtension) {
                    if (isEnabled) {
                        // No Reload is required if extension can run without reload
                        if (this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(this.extension.local))) {
                            return;
                        }
                        const runningExtensionServer = this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension));
                        if (isSameExtensionRunning) {
                            // Different version or target platform of same extension is running. Requires reload to run the current version
                            if (this.extension.version !== runningExtension.version || this.extension.local.targetPlatform !== runningExtension.targetPlatform) {
                                this.enabled = true;
                                this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                                this.tooltip = (0, nls_1.localize)('postUpdateTooltip', "Please reload Visual Studio Code to enable the updated extension.");
                                return;
                            }
                            const extensionInOtherServer = this.extensionsWorkbenchService.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server !== this.extension.server)[0];
                            if (extensionInOtherServer) {
                                // This extension prefers to run on UI/Local side but is running in remote
                                if (runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                                    this.enabled = true;
                                    this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                                    this.tooltip = (0, nls_1.localize)('enable locally', "Please reload Visual Studio Code to enable this extension locally.");
                                    return;
                                }
                                // This extension prefers to run on Workspace/Remote side but is running in local
                                if (runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                                    this.enabled = true;
                                    this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                                    this.tooltip = (0, nls_1.localize)('enable remote', "Please reload Visual Studio Code to enable this extension in {0}.", (_a = this.extensionManagementServerService.remoteExtensionManagementServer) === null || _a === void 0 ? void 0 : _a.label);
                                    return;
                                }
                            }
                        }
                        else {
                            if (this.extension.server === this.extensionManagementServerService.localExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer) {
                                // This extension prefers to run on UI/Local side but is running in remote
                                if (this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                                    this.enabled = true;
                                    this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                                    this.tooltip = (0, nls_1.localize)('postEnableTooltip', "Please reload Visual Studio Code to enable this extension.");
                                }
                            }
                            if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer) {
                                // This extension prefers to run on Workspace/Remote side but is running in local
                                if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                                    this.enabled = true;
                                    this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                                    this.tooltip = (0, nls_1.localize)('postEnableTooltip', "Please reload Visual Studio Code to enable this extension.");
                                }
                            }
                        }
                        return;
                    }
                    else {
                        if (isSameExtensionRunning) {
                            this.enabled = true;
                            this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                            this.tooltip = (0, nls_1.localize)('postDisableTooltip', "Please reload Visual Studio Code to disable this extension.");
                        }
                    }
                    return;
                }
                // Extension is not running
                else {
                    if (isEnabled && !this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(this.extension.local))) {
                        this.enabled = true;
                        this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                        this.tooltip = (0, nls_1.localize)('postEnableTooltip', "Please reload Visual Studio Code to enable this extension.");
                        return;
                    }
                    const otherServer = this.extension.server ? this.extension.server === this.extensionManagementServerService.localExtensionManagementServer ? this.extensionManagementServerService.remoteExtensionManagementServer : this.extensionManagementServerService.localExtensionManagementServer : null;
                    if (otherServer && this.extension.enablementState === 1 /* EnablementState.DisabledByExtensionKind */) {
                        const extensionInOtherServer = this.extensionsWorkbenchService.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server === otherServer)[0];
                        // Same extension in other server exists and
                        if (extensionInOtherServer && extensionInOtherServer.local && this.extensionEnablementService.isEnabled(extensionInOtherServer.local)) {
                            this.enabled = true;
                            this.label = (0, nls_1.localize)('reloadRequired', "Reload Required");
                            this.tooltip = (0, nls_1.localize)('postEnableTooltip', "Please reload Visual Studio Code to enable this extension.");
                            (0, aria_1.alert)((0, nls_1.localize)('installExtensionCompletedAndReloadRequired', "Installing extension {0} is completed. Please reload Visual Studio Code to enable it.", this.extension.displayName));
                            return;
                        }
                    }
                }
            }
        }
        run() {
            return Promise.resolve(this.hostService.reload());
        }
    };
    ReloadAction.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} reload`;
    ReloadAction.DisabledClass = `${ReloadAction.EnabledClass} disabled`;
    ReloadAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, host_1.IHostService),
        __param(2, extensions_3.IExtensionService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(4, extensionManagement_2.IExtensionManagementServerService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(6, productService_1.IProductService),
        __param(7, configuration_1.IConfigurationService)
    ], ReloadAction);
    exports.ReloadAction = ReloadAction;
    function isThemeFromExtension(theme, extension) {
        return !!(extension && theme.extensionData && extensions_2.ExtensionIdentifier.equals(theme.extensionData.extensionId, extension.identifier.id));
    }
    function getQuickPickEntries(themes, currentTheme, extension, showCurrentTheme) {
        const picks = [];
        for (const theme of themes) {
            if (isThemeFromExtension(theme, extension) && !(showCurrentTheme && theme === currentTheme)) {
                picks.push({ label: theme.label, id: theme.id });
            }
        }
        if (showCurrentTheme) {
            picks.push({ type: 'separator', label: (0, nls_1.localize)('current', "current") });
            picks.push({ label: currentTheme.label, id: currentTheme.id });
        }
        return picks;
    }
    let SetColorThemeAction = class SetColorThemeAction extends ExtensionAction {
        constructor(extensionService, workbenchThemeService, quickInputService) {
            super(SetColorThemeAction.ID, SetColorThemeAction.TITLE.value, SetColorThemeAction.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.colorThemes = [];
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidColorThemeChange)(() => this.update(), this));
            workbenchThemeService.getColorThemes().then(colorThemes => {
                this.colorThemes = colorThemes;
                this.update();
            });
            this.update();
        }
        update() {
            this.enabled = !!this.extension && (this.extension.state === 1 /* ExtensionState.Installed */) && this.colorThemes.some(th => isThemeFromExtension(th, this.extension));
            this.class = this.enabled ? SetColorThemeAction.EnabledClass : SetColorThemeAction.DisabledClass;
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            this.colorThemes = await this.workbenchThemeService.getColorThemes();
            this.update();
            if (!this.enabled) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getColorTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(this.colorThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select color theme', "Select Color Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setColorTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setColorTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    SetColorThemeAction.ID = 'workbench.extensions.action.setColorTheme';
    SetColorThemeAction.TITLE = { value: (0, nls_1.localize)('workbench.extensions.action.setColorTheme', "Set Color Theme"), original: 'Set Color Theme' };
    SetColorThemeAction.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`;
    SetColorThemeAction.DisabledClass = `${SetColorThemeAction.EnabledClass} disabled`;
    SetColorThemeAction = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService)
    ], SetColorThemeAction);
    exports.SetColorThemeAction = SetColorThemeAction;
    let SetFileIconThemeAction = class SetFileIconThemeAction extends ExtensionAction {
        constructor(extensionService, workbenchThemeService, quickInputService) {
            super(SetFileIconThemeAction.ID, SetFileIconThemeAction.TITLE.value, SetFileIconThemeAction.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.fileIconThemes = [];
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidFileIconThemeChange)(() => this.update(), this));
            workbenchThemeService.getFileIconThemes().then(fileIconThemes => {
                this.fileIconThemes = fileIconThemes;
                this.update();
            });
            this.update();
        }
        update() {
            this.enabled = !!this.extension && (this.extension.state === 1 /* ExtensionState.Installed */) && this.fileIconThemes.some(th => isThemeFromExtension(th, this.extension));
            this.class = this.enabled ? SetFileIconThemeAction.EnabledClass : SetFileIconThemeAction.DisabledClass;
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            this.fileIconThemes = await this.workbenchThemeService.getFileIconThemes();
            this.update();
            if (!this.enabled) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getFileIconTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(this.fileIconThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select file icon theme', "Select File Icon Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setFileIconTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setFileIconTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    SetFileIconThemeAction.ID = 'workbench.extensions.action.setFileIconTheme';
    SetFileIconThemeAction.TITLE = { value: (0, nls_1.localize)('workbench.extensions.action.setFileIconTheme', "Set File Icon Theme"), original: 'Set File Icon Theme' };
    SetFileIconThemeAction.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`;
    SetFileIconThemeAction.DisabledClass = `${SetFileIconThemeAction.EnabledClass} disabled`;
    SetFileIconThemeAction = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService)
    ], SetFileIconThemeAction);
    exports.SetFileIconThemeAction = SetFileIconThemeAction;
    let SetProductIconThemeAction = class SetProductIconThemeAction extends ExtensionAction {
        constructor(extensionService, workbenchThemeService, quickInputService) {
            super(SetProductIconThemeAction.ID, SetProductIconThemeAction.TITLE.value, SetProductIconThemeAction.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.productIconThemes = [];
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidProductIconThemeChange)(() => this.update(), this));
            workbenchThemeService.getProductIconThemes().then(productIconThemes => {
                this.productIconThemes = productIconThemes;
                this.update();
            });
            this.update();
        }
        update() {
            this.enabled = !!this.extension && (this.extension.state === 1 /* ExtensionState.Installed */) && this.productIconThemes.some(th => isThemeFromExtension(th, this.extension));
            this.class = this.enabled ? SetProductIconThemeAction.EnabledClass : SetProductIconThemeAction.DisabledClass;
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            this.productIconThemes = await this.workbenchThemeService.getProductIconThemes();
            this.update();
            if (!this.enabled) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getProductIconTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(this.productIconThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select product icon theme', "Select Product Icon Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setProductIconTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setProductIconTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    SetProductIconThemeAction.ID = 'workbench.extensions.action.setProductIconTheme';
    SetProductIconThemeAction.TITLE = { value: (0, nls_1.localize)('workbench.extensions.action.setProductIconTheme', "Set Product Icon Theme"), original: 'Set Product Icon Theme' };
    SetProductIconThemeAction.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`;
    SetProductIconThemeAction.DisabledClass = `${SetProductIconThemeAction.EnabledClass} disabled`;
    SetProductIconThemeAction = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService)
    ], SetProductIconThemeAction);
    exports.SetProductIconThemeAction = SetProductIconThemeAction;
    let ShowRecommendedExtensionAction = class ShowRecommendedExtensionAction extends actions_1.Action {
        constructor(extensionId, paneCompositeService, extensionWorkbenchService) {
            super(ShowRecommendedExtensionAction.ID, ShowRecommendedExtensionAction.LABEL, undefined, false);
            this.paneCompositeService = paneCompositeService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionId = extensionId;
        }
        async run() {
            const paneComposite = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const paneContainer = paneComposite === null || paneComposite === void 0 ? void 0 : paneComposite.getViewPaneContainer();
            paneContainer.search(`@id:${this.extensionId}`);
            paneContainer.focus();
            const [extension] = await this.extensionWorkbenchService.getExtensions([{ id: this.extensionId }], { source: 'install-recommendation' }, cancellation_1.CancellationToken.None);
            if (extension) {
                return this.extensionWorkbenchService.open(extension);
            }
            return null;
        }
    };
    ShowRecommendedExtensionAction.ID = 'workbench.extensions.action.showRecommendedExtension';
    ShowRecommendedExtensionAction.LABEL = (0, nls_1.localize)('showRecommendedExtension', "Show Recommended Extension");
    ShowRecommendedExtensionAction = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, extensions_1.IExtensionsWorkbenchService)
    ], ShowRecommendedExtensionAction);
    exports.ShowRecommendedExtensionAction = ShowRecommendedExtensionAction;
    let InstallRecommendedExtensionAction = class InstallRecommendedExtensionAction extends actions_1.Action {
        constructor(extensionId, paneCompositeService, instantiationService, extensionWorkbenchService) {
            super(InstallRecommendedExtensionAction.ID, InstallRecommendedExtensionAction.LABEL, undefined, false);
            this.paneCompositeService = paneCompositeService;
            this.instantiationService = instantiationService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionId = extensionId;
        }
        async run() {
            const viewlet = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const viewPaneContainer = viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer();
            viewPaneContainer.search(`@id:${this.extensionId}`);
            viewPaneContainer.focus();
            const [extension] = await this.extensionWorkbenchService.getExtensions([{ id: this.extensionId }], { source: 'install-recommendation' }, cancellation_1.CancellationToken.None);
            if (extension) {
                await this.extensionWorkbenchService.open(extension);
                try {
                    await this.extensionWorkbenchService.install(extension);
                }
                catch (err) {
                    this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 2 /* InstallOperation.Install */, undefined, err).run();
                }
            }
        }
    };
    InstallRecommendedExtensionAction.ID = 'workbench.extensions.action.installRecommendedExtension';
    InstallRecommendedExtensionAction.LABEL = (0, nls_1.localize)('installRecommendedExtension', "Install Recommended Extension");
    InstallRecommendedExtensionAction = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_1.IExtensionsWorkbenchService)
    ], InstallRecommendedExtensionAction);
    exports.InstallRecommendedExtensionAction = InstallRecommendedExtensionAction;
    let IgnoreExtensionRecommendationAction = class IgnoreExtensionRecommendationAction extends actions_1.Action {
        constructor(extension, extensionRecommendationsManagementService) {
            super(IgnoreExtensionRecommendationAction.ID, 'Ignore Recommendation');
            this.extension = extension;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.class = IgnoreExtensionRecommendationAction.Class;
            this.tooltip = (0, nls_1.localize)('ignoreExtensionRecommendation', "Do not recommend this extension again");
            this.enabled = true;
        }
        run() {
            this.extensionRecommendationsManagementService.toggleGlobalIgnoredRecommendation(this.extension.identifier.id, true);
            return Promise.resolve();
        }
    };
    IgnoreExtensionRecommendationAction.ID = 'extensions.ignore';
    IgnoreExtensionRecommendationAction.Class = `${ExtensionAction.LABEL_ACTION_CLASS} ignore`;
    IgnoreExtensionRecommendationAction = __decorate([
        __param(1, extensionRecommendations_1.IExtensionIgnoredRecommendationsService)
    ], IgnoreExtensionRecommendationAction);
    exports.IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction;
    let UndoIgnoreExtensionRecommendationAction = class UndoIgnoreExtensionRecommendationAction extends actions_1.Action {
        constructor(extension, extensionRecommendationsManagementService) {
            super(UndoIgnoreExtensionRecommendationAction.ID, 'Undo');
            this.extension = extension;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.class = UndoIgnoreExtensionRecommendationAction.Class;
            this.tooltip = (0, nls_1.localize)('undo', "Undo");
            this.enabled = true;
        }
        run() {
            this.extensionRecommendationsManagementService.toggleGlobalIgnoredRecommendation(this.extension.identifier.id, false);
            return Promise.resolve();
        }
    };
    UndoIgnoreExtensionRecommendationAction.ID = 'extensions.ignore';
    UndoIgnoreExtensionRecommendationAction.Class = `${ExtensionAction.LABEL_ACTION_CLASS} undo-ignore`;
    UndoIgnoreExtensionRecommendationAction = __decorate([
        __param(1, extensionRecommendations_1.IExtensionIgnoredRecommendationsService)
    ], UndoIgnoreExtensionRecommendationAction);
    exports.UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction;
    let SearchExtensionsAction = class SearchExtensionsAction extends actions_1.Action {
        constructor(searchValue, paneCompositeService) {
            super('extensions.searchExtensions', (0, nls_1.localize)('search recommendations', "Search Extensions"), undefined, true);
            this.searchValue = searchValue;
            this.paneCompositeService = paneCompositeService;
        }
        async run() {
            var _a;
            const viewPaneContainer = (_a = (await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))) === null || _a === void 0 ? void 0 : _a.getViewPaneContainer();
            viewPaneContainer.search(this.searchValue);
            viewPaneContainer.focus();
        }
    };
    SearchExtensionsAction = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService)
    ], SearchExtensionsAction);
    exports.SearchExtensionsAction = SearchExtensionsAction;
    let AbstractConfigureRecommendedExtensionsAction = class AbstractConfigureRecommendedExtensionsAction extends actions_1.Action {
        constructor(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label);
            this.contextService = contextService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.jsonEditingService = jsonEditingService;
            this.textModelResolverService = textModelResolverService;
        }
        openExtensionsFile(extensionsFileResource) {
            return this.getOrCreateExtensionsFile(extensionsFileResource)
                .then(({ created, content }) => this.getSelectionPosition(content, extensionsFileResource, ['recommendations'])
                .then(selection => this.editorService.openEditor({
                resource: extensionsFileResource,
                options: {
                    pinned: created,
                    selection
                }
            })), error => Promise.reject(new Error((0, nls_1.localize)('OpenExtensionsFile.failed', "Unable to create 'extensions.json' file inside the '.vscode' folder ({0}).", error))));
        }
        openWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return this.getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile)
                .then(content => this.getSelectionPosition(content.value.toString(), content.resource, ['extensions', 'recommendations']))
                .then(selection => this.editorService.openEditor({
                resource: workspaceConfigurationFile,
                options: {
                    selection,
                    forceReload: true // because content has changed
                }
            }));
        }
        getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return Promise.resolve(this.fileService.readFile(workspaceConfigurationFile))
                .then(content => {
                const workspaceRecommendations = json.parse(content.value.toString())['extensions'];
                if (!workspaceRecommendations || !workspaceRecommendations.recommendations) {
                    return this.jsonEditingService.write(workspaceConfigurationFile, [{ path: ['extensions'], value: { recommendations: [] } }], true)
                        .then(() => this.fileService.readFile(workspaceConfigurationFile));
                }
                return content;
            });
        }
        getSelectionPosition(content, resource, path) {
            const tree = json.parseTree(content);
            const node = json.findNodeAtLocation(tree, path);
            if (node && node.parent && node.parent.children) {
                const recommendationsValueNode = node.parent.children[1];
                const lastExtensionNode = recommendationsValueNode.children && recommendationsValueNode.children.length ? recommendationsValueNode.children[recommendationsValueNode.children.length - 1] : null;
                const offset = lastExtensionNode ? lastExtensionNode.offset + lastExtensionNode.length : recommendationsValueNode.offset + 1;
                return Promise.resolve(this.textModelResolverService.createModelReference(resource))
                    .then(reference => {
                    const position = reference.object.textEditorModel.getPositionAt(offset);
                    reference.dispose();
                    return {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    };
                });
            }
            return Promise.resolve(undefined);
        }
        getOrCreateExtensionsFile(extensionsFileResource) {
            return Promise.resolve(this.fileService.readFile(extensionsFileResource)).then(content => {
                return { created: false, extensionsFileResource, content: content.value.toString() };
            }, err => {
                return this.textFileService.write(extensionsFileResource, extensionsFileTemplate_1.ExtensionsConfigurationInitialContent).then(() => {
                    return { created: true, extensionsFileResource, content: extensionsFileTemplate_1.ExtensionsConfigurationInitialContent };
                });
            });
        }
    };
    AbstractConfigureRecommendedExtensionsAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], AbstractConfigureRecommendedExtensionsAction);
    exports.AbstractConfigureRecommendedExtensionsAction = AbstractConfigureRecommendedExtensionsAction;
    let ConfigureWorkspaceRecommendedExtensionsAction = class ConfigureWorkspaceRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.update(), this));
            this.update();
        }
        update() {
            this.enabled = this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */;
        }
        run() {
            switch (this.contextService.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */:
                    return this.openExtensionsFile(this.contextService.getWorkspace().folders[0].toResource(workspaceExtensionsConfig_1.EXTENSIONS_CONFIG));
                case 3 /* WorkbenchState.WORKSPACE */:
                    return this.openWorkspaceConfigurationFile(this.contextService.getWorkspace().configuration);
            }
            return Promise.resolve();
        }
    };
    ConfigureWorkspaceRecommendedExtensionsAction.ID = 'workbench.extensions.action.configureWorkspaceRecommendedExtensions';
    ConfigureWorkspaceRecommendedExtensionsAction.LABEL = (0, nls_1.localize)('configureWorkspaceRecommendedExtensions', "Configure Recommended Extensions (Workspace)");
    ConfigureWorkspaceRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], ConfigureWorkspaceRecommendedExtensionsAction);
    exports.ConfigureWorkspaceRecommendedExtensionsAction = ConfigureWorkspaceRecommendedExtensionsAction;
    let ConfigureWorkspaceFolderRecommendedExtensionsAction = class ConfigureWorkspaceFolderRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService, commandService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this.commandService = commandService;
        }
        run() {
            const folderCount = this.contextService.getWorkspace().folders.length;
            const pickFolderPromise = folderCount === 1 ? Promise.resolve(this.contextService.getWorkspace().folders[0]) : this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            return Promise.resolve(pickFolderPromise)
                .then(workspaceFolder => {
                if (workspaceFolder) {
                    return this.openExtensionsFile(workspaceFolder.toResource(workspaceExtensionsConfig_1.EXTENSIONS_CONFIG));
                }
                return null;
            });
        }
    };
    ConfigureWorkspaceFolderRecommendedExtensionsAction.ID = 'workbench.extensions.action.configureWorkspaceFolderRecommendedExtensions';
    ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL = (0, nls_1.localize)('configureWorkspaceFolderRecommendedExtensions', "Configure Recommended Extensions (Workspace Folder)");
    ConfigureWorkspaceFolderRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService),
        __param(8, commands_1.ICommandService)
    ], ConfigureWorkspaceFolderRecommendedExtensionsAction);
    exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = ConfigureWorkspaceFolderRecommendedExtensionsAction;
    let ExtensionStatusLabelAction = class ExtensionStatusLabelAction extends actions_1.Action {
        constructor(extensionService, extensionManagementServerService, extensionEnablementService) {
            super('extensions.action.statusLabel', '', ExtensionStatusLabelAction.DISABLED_CLASS, false);
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionEnablementService = extensionEnablementService;
            this.initialStatus = null;
            this.status = null;
            this.enablementState = null;
            this._extension = null;
        }
        get extension() { return this._extension; }
        set extension(extension) {
            if (!(this._extension && extension && (0, extensionManagementUtil_1.areSameExtensions)(this._extension.identifier, extension.identifier))) {
                // Different extension. Reset
                this.initialStatus = null;
                this.status = null;
                this.enablementState = null;
            }
            this._extension = extension;
            this.update();
        }
        update() {
            this.computeLabel()
                .then(label => {
                this.label = label || '';
                this.class = label ? ExtensionStatusLabelAction.ENABLED_CLASS : ExtensionStatusLabelAction.DISABLED_CLASS;
            });
        }
        async computeLabel() {
            if (!this.extension) {
                return null;
            }
            const currentStatus = this.status;
            const currentEnablementState = this.enablementState;
            this.status = this.extension.state;
            if (this.initialStatus === null) {
                this.initialStatus = this.status;
            }
            this.enablementState = this.extension.enablementState;
            const runningExtensions = await this.extensionService.getExtensions();
            const canAddExtension = () => {
                const runningExtension = runningExtensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
                if (this.extension.local) {
                    if (runningExtension && this.extension.version === runningExtension.version) {
                        return true;
                    }
                    return this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(this.extension.local));
                }
                return false;
            };
            const canRemoveExtension = () => {
                if (this.extension.local) {
                    if (runningExtensions.every(e => !((0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(e))))) {
                        return true;
                    }
                    return this.extensionService.canRemoveExtension((0, extensions_3.toExtensionDescription)(this.extension.local));
                }
                return false;
            };
            if (currentStatus !== null) {
                if (currentStatus === 0 /* ExtensionState.Installing */ && this.status === 1 /* ExtensionState.Installed */) {
                    return canAddExtension() ? this.initialStatus === 1 /* ExtensionState.Installed */ ? (0, nls_1.localize)('updated', "Updated") : (0, nls_1.localize)('installed', "Installed") : null;
                }
                if (currentStatus === 2 /* ExtensionState.Uninstalling */ && this.status === 3 /* ExtensionState.Uninstalled */) {
                    this.initialStatus = this.status;
                    return canRemoveExtension() ? (0, nls_1.localize)('uninstalled', "Uninstalled") : null;
                }
            }
            if (currentEnablementState !== null) {
                const currentlyEnabled = this.extensionEnablementService.isEnabledEnablementState(currentEnablementState);
                const enabled = this.extensionEnablementService.isEnabledEnablementState(this.enablementState);
                if (!currentlyEnabled && enabled) {
                    return canAddExtension() ? (0, nls_1.localize)('enabled', "Enabled") : null;
                }
                if (currentlyEnabled && !enabled) {
                    return canRemoveExtension() ? (0, nls_1.localize)('disabled', "Disabled") : null;
                }
            }
            return null;
        }
        run() {
            return Promise.resolve();
        }
    };
    ExtensionStatusLabelAction.ENABLED_CLASS = `${ExtensionAction.TEXT_ACTION_CLASS} extension-status-label`;
    ExtensionStatusLabelAction.DISABLED_CLASS = `${ExtensionStatusLabelAction.ENABLED_CLASS} hide`;
    ExtensionStatusLabelAction = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], ExtensionStatusLabelAction);
    exports.ExtensionStatusLabelAction = ExtensionStatusLabelAction;
    let ToggleSyncExtensionAction = class ToggleSyncExtensionAction extends ExtensionDropDownAction {
        constructor(configurationService, extensionsWorkbenchService, userDataSyncEnablementService, instantiationService) {
            super('extensions.sync', '', ToggleSyncExtensionAction.SYNC_CLASS, false, instantiationService);
            this.configurationService = configurationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectedKeys.includes('settingsSync.ignoredExtensions'))(() => this.update()));
            this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.update()));
            this.update();
        }
        update() {
            this.enabled = !!this.extension && this.userDataSyncEnablementService.isEnabled() && this.extension.state === 1 /* ExtensionState.Installed */;
            if (this.extension) {
                const isIgnored = this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension);
                this.class = isIgnored ? ToggleSyncExtensionAction.IGNORED_SYNC_CLASS : ToggleSyncExtensionAction.SYNC_CLASS;
                this.tooltip = isIgnored ? (0, nls_1.localize)('ignored', "This extension is ignored during sync") : (0, nls_1.localize)('synced', "This extension is synced");
            }
        }
        async run() {
            return super.run({
                actionGroups: [
                    [
                        new actions_1.Action('extensions.syncignore', this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension) ? (0, nls_1.localize)('sync', "Sync this extension") : (0, nls_1.localize)('do not sync', "Do not sync this extension"), undefined, true, () => this.extensionsWorkbenchService.toggleExtensionIgnoredToSync(this.extension))
                    ]
                ], disposeActionsOnHide: true
            });
        }
    };
    ToggleSyncExtensionAction.IGNORED_SYNC_CLASS = `${ExtensionAction.ICON_ACTION_CLASS} extension-sync ${themeService_1.ThemeIcon.asClassName(extensionsIcons_1.syncIgnoredIcon)}`;
    ToggleSyncExtensionAction.SYNC_CLASS = `${ToggleSyncExtensionAction.ICON_ACTION_CLASS} extension-sync ${themeService_1.ThemeIcon.asClassName(extensionsIcons_1.syncEnabledIcon)}`;
    ToggleSyncExtensionAction = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, instantiation_1.IInstantiationService)
    ], ToggleSyncExtensionAction);
    exports.ToggleSyncExtensionAction = ToggleSyncExtensionAction;
    let ExtensionStatusAction = class ExtensionStatusAction extends ExtensionAction {
        constructor(extensionManagementServerService, labelService, commandService, workspaceTrustEnablementService, workspaceTrustService, extensionsWorkbenchService, extensionService, extensionManifestPropertiesService, contextService, productService, workbenchExtensionEnablementService) {
            super('extensions.status', '', `${ExtensionStatusAction.CLASS} hide`, false);
            this.extensionManagementServerService = extensionManagementServerService;
            this.labelService = labelService;
            this.commandService = commandService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.workspaceTrustService = workspaceTrustService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionService = extensionService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.contextService = contextService;
            this.productService = productService;
            this.workbenchExtensionEnablementService = workbenchExtensionEnablementService;
            this.updateWhenCounterExtensionChanges = true;
            this._runningExtensions = null;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this.updateThrottler = new async_1.Throttler();
            this._register(this.labelService.onDidChangeFormatters(() => this.update(), this));
            this._register(this.extensionService.onDidChangeExtensions(this.updateRunningExtensions, this));
            this.updateRunningExtensions();
            this.update();
        }
        get status() { return this._status; }
        updateRunningExtensions() {
            this.extensionService.getExtensions().then(runningExtensions => { this._runningExtensions = runningExtensions; this.update(); });
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateStatus());
        }
        async computeAndUpdateStatus() {
            var _a, _b, _c, _d;
            this.updateStatus(undefined, true);
            this.enabled = false;
            if (!this.extension) {
                return;
            }
            if (this.extension.isMalicious) {
                this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('malicious tooltip', "This extension was reported to be problematic.")) }, true);
                return;
            }
            if (this.extension.isUnsupported) {
                if ((0, types_1.isBoolean)(this.extension.isUnsupported)) {
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('unsupported tooltip', "This extension no longer supported.")) }, true);
                }
                else {
                    const link = `[${this.extension.isUnsupported.preReleaseExtension.displayName}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.isUnsupported.preReleaseExtension.id]))}`)})`;
                    if (this.extension.state !== 1 /* ExtensionState.Installed */) {
                        this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('unsupported prerelease switch tooltip', "This extension is now part of the {0} extension as a pre-release version.", link)) }, true);
                    }
                }
                return;
            }
            if (this.extension.gallery && this.extension.state === 3 /* ExtensionState.Uninstalled */ && !await this.extensionsWorkbenchService.canInstall(this.extension)) {
                if (this.extensionManagementServerService.localExtensionManagementServer || this.extensionManagementServerService.remoteExtensionManagementServer) {
                    const targetPlatform = await (this.extensionManagementServerService.localExtensionManagementServer ? this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getTargetPlatform() : this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform());
                    const message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('incompatible platform', "The '{0}' extension is not available in {1} for {2}.", this.extension.displayName || this.extension.identifier.id, this.productService.nameLong, (0, extensionManagement_1.TargetPlatformToString)(targetPlatform))} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-platform-specific-extensions)`);
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    return;
                }
                if (this.extensionManagementServerService.webExtensionManagementServer) {
                    const productName = (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong);
                    const message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('not web tooltip', "The '{0}' extension is not available in {1}.", this.extension.displayName || this.extension.identifier.id, productName)} [${(0, nls_1.localize)('learn why', "Learn Why")}](https://aka.ms/vscode-web-extensions-guide)`);
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    return;
                }
            }
            if (!this.extension.local ||
                !this.extension.server ||
                !this._runningExtensions ||
                this.extension.state !== 1 /* ExtensionState.Installed */) {
                return;
            }
            // Extension is disabled by environment
            if (this.extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */) {
                this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('disabled by environment', "This extension is disabled by the environment.")) }, true);
                return;
            }
            // Extension is enabled by environment
            if (this.extension.enablementState === 3 /* EnablementState.EnabledByEnvironment */) {
                this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('enabled by environment', "This extension is enabled because it is required in the current environment.")) }, true);
                return;
            }
            // Extension is disabled by virtual workspace
            if (this.extension.enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                const details = (0, extensions_2.getWorkspaceSupportTypeMessage)((_a = this.extension.local.manifest.capabilities) === null || _a === void 0 ? void 0 : _a.virtualWorkspaces);
                this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(details ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(details) : (0, nls_1.localize)('disabled because of virtual workspace', "This extension has been disabled because it does not support virtual workspaces.")) }, true);
                return;
            }
            // Limited support in Virtual Workspace
            if ((0, virtualWorkspace_1.isVirtualWorkspace)(this.contextService.getWorkspace())) {
                const virtualSupportType = this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(this.extension.local.manifest);
                const details = (0, extensions_2.getWorkspaceSupportTypeMessage)((_b = this.extension.local.manifest.capabilities) === null || _b === void 0 ? void 0 : _b.virtualWorkspaces);
                if (virtualSupportType === 'limited' || details) {
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString(details ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(details) : (0, nls_1.localize)('extension limited because of virtual workspace', "This extension has limited features because the current workspace is virtual.")) }, true);
                    return;
                }
            }
            // Extension is disabled by untrusted workspace
            if (this.extension.enablementState === 0 /* EnablementState.DisabledByTrustRequirement */ ||
                // All disabled dependencies of the extension are disabled by untrusted workspace
                (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */ && this.workbenchExtensionEnablementService.getDependenciesEnablementStates(this.extension.local).every(([, enablementState]) => this.workbenchExtensionEnablementService.isEnabledEnablementState(enablementState) || enablementState === 0 /* EnablementState.DisabledByTrustRequirement */))) {
                this.enabled = true;
                const untrustedDetails = (0, extensions_2.getWorkspaceSupportTypeMessage)((_c = this.extension.local.manifest.capabilities) === null || _c === void 0 ? void 0 : _c.untrustedWorkspaces);
                this.updateStatus({ icon: extensionsIcons_1.trustIcon, message: new htmlContent_1.MarkdownString(untrustedDetails ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(untrustedDetails) : (0, nls_1.localize)('extension disabled because of trust requirement', "This extension has been disabled because the current workspace is not trusted.")) }, true);
                return;
            }
            // Limited support in Untrusted Workspace
            if (this.workspaceTrustEnablementService.isWorkspaceTrustEnabled() && !this.workspaceTrustService.isWorkspaceTrusted()) {
                const untrustedSupportType = this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(this.extension.local.manifest);
                const untrustedDetails = (0, extensions_2.getWorkspaceSupportTypeMessage)((_d = this.extension.local.manifest.capabilities) === null || _d === void 0 ? void 0 : _d.untrustedWorkspaces);
                if (untrustedSupportType === 'limited' || untrustedDetails) {
                    this.enabled = true;
                    this.updateStatus({ icon: extensionsIcons_1.trustIcon, message: new htmlContent_1.MarkdownString(untrustedDetails ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(untrustedDetails) : (0, nls_1.localize)('extension limited because of trust requirement', "This extension has limited features because the current workspace is not trusted.")) }, true);
                    return;
                }
            }
            // Extension is disabled by extension kind
            if (this.extension.enablementState === 1 /* EnablementState.DisabledByExtensionKind */) {
                if (!this.extensionsWorkbenchService.installed.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server !== this.extension.server)) {
                    let message;
                    // Extension on Local Server
                    if (this.extensionManagementServerService.localExtensionManagementServer === this.extension.server) {
                        if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Install in remote server to enable', "This extension is disabled in this workspace because it is defined to run in the Remote Extension Host. Please install the extension in '{0}' to enable.", this.extensionManagementServerService.remoteExtensionManagementServer.label)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                            }
                        }
                    }
                    // Extension on Remote Server
                    else if (this.extensionManagementServerService.remoteExtensionManagementServer === this.extension.server) {
                        if (this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                            if (this.extensionManagementServerService.localExtensionManagementServer) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Install in local server to enable', "This extension is disabled in this workspace because it is defined to run in the Local Extension Host. Please install the extension locally to enable.", this.extensionManagementServerService.remoteExtensionManagementServer.label)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                            }
                            else if (platform_1.isWeb) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Defined to run in desktop', "This extension is disabled because it is defined to run only in {0} for the Desktop.", this.productService.nameLong)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                            }
                        }
                    }
                    // Extension on Web Server
                    else if (this.extensionManagementServerService.webExtensionManagementServer === this.extension.server) {
                        message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Cannot be enabled', "This extension is disabled because it is not supported in {0} for the Web.", this.productService.nameLong)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                    }
                    if (message) {
                        this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    }
                    return;
                }
            }
            // Remote Workspace
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                if ((0, extensions_2.isLanguagePackExtension)(this.extension.local.manifest)) {
                    if (!this.extensionsWorkbenchService.installed.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server !== this.extension.server)) {
                        const message = this.extension.server === this.extensionManagementServerService.localExtensionManagementServer
                            ? new htmlContent_1.MarkdownString((0, nls_1.localize)('Install language pack also in remote server', "Install the language pack extension on '{0}' to enable it there also.", this.extensionManagementServerService.remoteExtensionManagementServer.label))
                            : new htmlContent_1.MarkdownString((0, nls_1.localize)('Install language pack also locally', "Install the language pack extension locally to enable it there also."));
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message }, true);
                    }
                    return;
                }
                const runningExtension = this._runningExtensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
                const runningExtensionServer = runningExtension ? this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension)) : null;
                if (this.extension.server === this.extensionManagementServerService.localExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled remotely', "This extension is enabled in the Remote Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`) }, true);
                    }
                    return;
                }
                if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled locally', "This extension is enabled in the Local Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`) }, true);
                    }
                    return;
                }
                if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.webExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.canExecuteOnWeb(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled in web worker', "This extension is enabled in the Web Worker Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`) }, true);
                    }
                    return;
                }
            }
            // Extension is disabled by its dependency
            if (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */) {
                this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('extension disabled because of dependency', "This extension has been disabled because it depends on an extension that is disabled.")) }, true);
                return;
            }
            const isEnabled = this.workbenchExtensionEnablementService.isEnabled(this.extension.local);
            const isRunning = this._runningExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier));
            if (isEnabled && isRunning) {
                if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                    if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                        this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('extension enabled on remote', "Extension is enabled on '{0}'", this.extension.server.label)) }, true);
                        return;
                    }
                }
                if (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('globally enabled', "This extension is enabled globally.")) }, true);
                    return;
                }
                if (this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('workspace enabled', "This extension is enabled for this workspace by the user.")) }, true);
                    return;
                }
            }
            if (!isEnabled && !isRunning) {
                if (this.extension.enablementState === 6 /* EnablementState.DisabledGlobally */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('globally disabled', "This extension is disabled globally by the user.")) }, true);
                    return;
                }
                if (this.extension.enablementState === 7 /* EnablementState.DisabledWorkspace */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('workspace disabled', "This extension is disabled for this workspace by the user.")) }, true);
                    return;
                }
            }
            if (isEnabled && !isRunning && !this.extension.local.isValid) {
                const errors = this.extension.local.validations.filter(([severity]) => severity === notification_1.Severity.Error).map(([, message]) => message);
                this.updateStatus({ icon: extensionsIcons_1.errorIcon, message: new htmlContent_1.MarkdownString(errors.join(' ').trim()) }, true);
            }
        }
        updateStatus(status, updateClass) {
            var _a, _b, _c, _d, _e, _f;
            if (this._status === status) {
                return;
            }
            if (this._status && status && this._status.message === status.message && ((_a = this._status.icon) === null || _a === void 0 ? void 0 : _a.id) === ((_b = status.icon) === null || _b === void 0 ? void 0 : _b.id)) {
                return;
            }
            this._status = status;
            if (updateClass) {
                if (((_c = this._status) === null || _c === void 0 ? void 0 : _c.icon) === extensionsIcons_1.errorIcon) {
                    this.class = `${ExtensionStatusAction.CLASS} extension-status-error ${themeService_1.ThemeIcon.asClassName(extensionsIcons_1.errorIcon)}`;
                }
                else if (((_d = this._status) === null || _d === void 0 ? void 0 : _d.icon) === extensionsIcons_1.warningIcon) {
                    this.class = `${ExtensionStatusAction.CLASS} extension-status-warning ${themeService_1.ThemeIcon.asClassName(extensionsIcons_1.warningIcon)}`;
                }
                else if (((_e = this._status) === null || _e === void 0 ? void 0 : _e.icon) === extensionsIcons_1.infoIcon) {
                    this.class = `${ExtensionStatusAction.CLASS} extension-status-info ${themeService_1.ThemeIcon.asClassName(extensionsIcons_1.infoIcon)}`;
                }
                else if (((_f = this._status) === null || _f === void 0 ? void 0 : _f.icon) === extensionsIcons_1.trustIcon) {
                    this.class = `${ExtensionStatusAction.CLASS} ${themeService_1.ThemeIcon.asClassName(extensionsIcons_1.trustIcon)}`;
                }
                else {
                    this.class = `${ExtensionStatusAction.CLASS} hide`;
                }
            }
            this._onDidChangeStatus.fire();
        }
        async run() {
            var _a;
            if (((_a = this._status) === null || _a === void 0 ? void 0 : _a.icon) === extensionsIcons_1.trustIcon) {
                return this.commandService.executeCommand('workbench.trust.manage');
            }
        }
    };
    ExtensionStatusAction.CLASS = `${ExtensionAction.ICON_ACTION_CLASS} extension-status`;
    ExtensionStatusAction = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, label_1.ILabelService),
        __param(2, commands_1.ICommandService),
        __param(3, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, extensions_3.IExtensionService),
        __param(7, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, productService_1.IProductService),
        __param(10, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], ExtensionStatusAction);
    exports.ExtensionStatusAction = ExtensionStatusAction;
    let ReinstallAction = class ReinstallAction extends actions_1.Action {
        constructor(id = ReinstallAction.ID, label = ReinstallAction.LABEL, extensionsWorkbenchService, quickInputService, notificationService, hostService, instantiationService, extensionService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.hostService = hostService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.filter(l => !l.isBuiltin && l.local).length > 0;
        }
        run() {
            return this.quickInputService.pick(this.getEntries(), { placeHolder: (0, nls_1.localize)('selectExtensionToReinstall', "Select Extension to Reinstall") })
                .then(pick => pick && this.reinstallExtension(pick.extension));
        }
        getEntries() {
            return this.extensionsWorkbenchService.queryLocal()
                .then(local => {
                const entries = local
                    .filter(extension => !extension.isBuiltin)
                    .map(extension => {
                    return {
                        id: extension.identifier.id,
                        label: extension.displayName,
                        description: extension.identifier.id,
                        extension,
                    };
                });
                return entries;
            });
        }
        reinstallExtension(extension) {
            return this.instantiationService.createInstance(SearchExtensionsAction, '@installed ').run()
                .then(() => {
                return this.extensionsWorkbenchService.reinstall(extension)
                    .then(extension => {
                    const requireReload = !(extension.local && this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local)));
                    const message = requireReload ? (0, nls_1.localize)('ReinstallAction.successReload', "Please reload Visual Studio Code to complete reinstalling the extension {0}.", extension.identifier.id)
                        : (0, nls_1.localize)('ReinstallAction.success', "Reinstalling the extension {0} is completed.", extension.identifier.id);
                    const actions = requireReload ? [{
                            label: (0, nls_1.localize)('InstallVSIXAction.reloadNow', "Reload Now"),
                            run: () => this.hostService.reload()
                        }] : [];
                    this.notificationService.prompt(notification_1.Severity.Info, message, actions, { sticky: true });
                }, error => this.notificationService.error(error));
            });
        }
    };
    ReinstallAction.ID = 'workbench.extensions.action.reinstall';
    ReinstallAction.LABEL = (0, nls_1.localize)('reinstall', "Reinstall Extension...");
    ReinstallAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, host_1.IHostService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, extensions_3.IExtensionService)
    ], ReinstallAction);
    exports.ReinstallAction = ReinstallAction;
    let InstallSpecificVersionOfExtensionAction = class InstallSpecificVersionOfExtensionAction extends actions_1.Action {
        constructor(id = InstallSpecificVersionOfExtensionAction.ID, label = InstallSpecificVersionOfExtensionAction.LABEL, extensionsWorkbenchService, quickInputService, instantiationService, extensionEnablementService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.extensionEnablementService = extensionEnablementService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.some(l => this.isEnabled(l));
        }
        async run() {
            const extensionPick = await this.quickInputService.pick(this.getExtensionEntries(), { placeHolder: (0, nls_1.localize)('selectExtension', "Select Extension"), matchOnDetail: true });
            if (extensionPick && extensionPick.extension) {
                const action = this.instantiationService.createInstance(InstallAnotherVersionAction);
                action.extension = extensionPick.extension;
                await action.run();
                await this.instantiationService.createInstance(SearchExtensionsAction, extensionPick.extension.identifier.id).run();
            }
        }
        isEnabled(extension) {
            const action = this.instantiationService.createInstance(InstallAnotherVersionAction);
            action.extension = extension;
            return action.enabled && !!extension.local && this.extensionEnablementService.isEnabled(extension.local);
        }
        async getExtensionEntries() {
            const installed = await this.extensionsWorkbenchService.queryLocal();
            const entries = [];
            for (const extension of installed) {
                if (this.isEnabled(extension)) {
                    entries.push({
                        id: extension.identifier.id,
                        label: extension.displayName || extension.identifier.id,
                        description: extension.identifier.id,
                        extension,
                    });
                }
            }
            return entries.sort((e1, e2) => e1.extension.displayName.localeCompare(e2.extension.displayName));
        }
    };
    InstallSpecificVersionOfExtensionAction.ID = 'workbench.extensions.action.install.specificVersion';
    InstallSpecificVersionOfExtensionAction.LABEL = (0, nls_1.localize)('install previous version', "Install Specific Version of Extension...");
    InstallSpecificVersionOfExtensionAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], InstallSpecificVersionOfExtensionAction);
    exports.InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction;
    let AbstractInstallExtensionsInServerAction = class AbstractInstallExtensionsInServerAction extends actions_1.Action {
        constructor(id, extensionsWorkbenchService, quickInputService, notificationService, progressService) {
            super(id);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.extensions = undefined;
            this.update();
            this.extensionsWorkbenchService.queryLocal().then(() => this.updateExtensions());
            this._register(this.extensionsWorkbenchService.onChange(() => {
                if (this.extensions) {
                    this.updateExtensions();
                }
            }));
        }
        updateExtensions() {
            this.extensions = this.extensionsWorkbenchService.local;
            this.update();
        }
        update() {
            this.enabled = !!this.extensions && this.getExtensionsToInstall(this.extensions).length > 0;
            this.tooltip = this.label;
        }
        async run() {
            return this.selectAndInstallExtensions();
        }
        async queryExtensionsToInstall() {
            const local = await this.extensionsWorkbenchService.queryLocal();
            return this.getExtensionsToInstall(local);
        }
        async selectAndInstallExtensions() {
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.busy = true;
            const disposable = quickPick.onDidAccept(() => {
                disposable.dispose();
                quickPick.hide();
                quickPick.dispose();
                this.onDidAccept(quickPick.selectedItems);
            });
            quickPick.show();
            const localExtensionsToInstall = await this.queryExtensionsToInstall();
            quickPick.busy = false;
            if (localExtensionsToInstall.length) {
                quickPick.title = this.getQuickPickTitle();
                quickPick.placeholder = (0, nls_1.localize)('select extensions to install', "Select extensions to install");
                quickPick.canSelectMany = true;
                localExtensionsToInstall.sort((e1, e2) => e1.displayName.localeCompare(e2.displayName));
                quickPick.items = localExtensionsToInstall.map(extension => ({ extension, label: extension.displayName, description: extension.version }));
            }
            else {
                quickPick.hide();
                quickPick.dispose();
                this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, nls_1.localize)('no local extensions', "There are no extensions to install.")
                });
            }
        }
        async onDidAccept(selectedItems) {
            if (selectedItems.length) {
                const localExtensionsToInstall = selectedItems.filter(r => !!r.extension).map(r => r.extension);
                if (localExtensionsToInstall.length) {
                    await this.progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: (0, nls_1.localize)('installing extensions', "Installing Extensions...")
                    }, () => this.installExtensions(localExtensionsToInstall));
                    this.notificationService.info((0, nls_1.localize)('finished installing', "Successfully installed extensions."));
                }
            }
        }
    };
    AbstractInstallExtensionsInServerAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, progress_1.IProgressService)
    ], AbstractInstallExtensionsInServerAction);
    exports.AbstractInstallExtensionsInServerAction = AbstractInstallExtensionsInServerAction;
    let InstallLocalExtensionsInRemoteAction = class InstallLocalExtensionsInRemoteAction extends AbstractInstallExtensionsInServerAction {
        constructor(extensionsWorkbenchService, quickInputService, progressService, notificationService, extensionManagementServerService, extensionGalleryService, instantiationService) {
            super('workbench.extensions.actions.installLocalExtensionsInRemote', extensionsWorkbenchService, quickInputService, notificationService, progressService);
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.instantiationService = instantiationService;
        }
        get label() {
            if (this.extensionManagementServerService && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return (0, nls_1.localize)('select and install local extensions', "Install Local Extensions in '{0}'...", this.extensionManagementServerService.remoteExtensionManagementServer.label);
            }
            return '';
        }
        getQuickPickTitle() {
            return (0, nls_1.localize)('install local extensions title', "Install Local Extensions in '{0}'", this.extensionManagementServerService.remoteExtensionManagementServer.label);
        }
        getExtensionsToInstall(local) {
            return local.filter(extension => {
                const action = this.instantiationService.createInstance(RemoteInstallAction, true);
                action.extension = extension;
                return action.enabled;
            });
        }
        async installExtensions(localExtensionsToInstall) {
            const galleryExtensions = [];
            const vsixs = [];
            const targetPlatform = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform();
            await async_1.Promises.settled(localExtensionsToInstall.map(async (extension) => {
                var _a;
                if (this.extensionGalleryService.isEnabled()) {
                    const gallery = (await this.extensionGalleryService.getExtensions([Object.assign(Object.assign({}, extension.identifier), { preRelease: !!((_a = extension.local) === null || _a === void 0 ? void 0 : _a.preRelease) })], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0];
                    if (gallery) {
                        galleryExtensions.push(gallery);
                        return;
                    }
                }
                const vsix = await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.zip(extension.local);
                vsixs.push(vsix);
            }));
            await async_1.Promises.settled(galleryExtensions.map(gallery => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(gallery)));
            await async_1.Promises.settled(vsixs.map(vsix => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.install(vsix)));
        }
    };
    InstallLocalExtensionsInRemoteAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, progress_1.IProgressService),
        __param(3, notification_1.INotificationService),
        __param(4, extensionManagement_2.IExtensionManagementServerService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, instantiation_1.IInstantiationService)
    ], InstallLocalExtensionsInRemoteAction);
    exports.InstallLocalExtensionsInRemoteAction = InstallLocalExtensionsInRemoteAction;
    let InstallRemoteExtensionsInLocalAction = class InstallRemoteExtensionsInLocalAction extends AbstractInstallExtensionsInServerAction {
        constructor(id, extensionsWorkbenchService, quickInputService, progressService, notificationService, extensionManagementServerService, extensionGalleryService) {
            super(id, extensionsWorkbenchService, quickInputService, notificationService, progressService);
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
        }
        get label() {
            return (0, nls_1.localize)('select and install remote extensions', "Install Remote Extensions Locally...");
        }
        getQuickPickTitle() {
            return (0, nls_1.localize)('install remote extensions', "Install Remote Extensions Locally");
        }
        getExtensionsToInstall(local) {
            return local.filter(extension => extension.type === 1 /* ExtensionType.User */ && extension.server !== this.extensionManagementServerService.localExtensionManagementServer
                && !this.extensionsWorkbenchService.installed.some(e => e.server === this.extensionManagementServerService.localExtensionManagementServer && (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier)));
        }
        async installExtensions(extensions) {
            const galleryExtensions = [];
            const vsixs = [];
            const targetPlatform = await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getTargetPlatform();
            await async_1.Promises.settled(extensions.map(async (extension) => {
                var _a;
                if (this.extensionGalleryService.isEnabled()) {
                    const gallery = (await this.extensionGalleryService.getExtensions([Object.assign(Object.assign({}, extension.identifier), { preRelease: !!((_a = extension.local) === null || _a === void 0 ? void 0 : _a.preRelease) })], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0];
                    if (gallery) {
                        galleryExtensions.push(gallery);
                        return;
                    }
                }
                const vsix = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.zip(extension.local);
                vsixs.push(vsix);
            }));
            await async_1.Promises.settled(galleryExtensions.map(gallery => this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery)));
            await async_1.Promises.settled(vsixs.map(vsix => this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.install(vsix)));
        }
    };
    InstallRemoteExtensionsInLocalAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, progress_1.IProgressService),
        __param(4, notification_1.INotificationService),
        __param(5, extensionManagement_2.IExtensionManagementServerService),
        __param(6, extensionManagement_1.IExtensionGalleryService)
    ], InstallRemoteExtensionsInLocalAction);
    exports.InstallRemoteExtensionsInLocalAction = InstallRemoteExtensionsInLocalAction;
    commands_1.CommandsRegistry.registerCommand('workbench.extensions.action.showExtensionsForLanguage', function (accessor, fileExtension) {
        const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
            .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
            .then(viewlet => {
            viewlet.search(`ext:${fileExtension.replace(/^\./, '')}`);
            viewlet.focus();
        });
    });
    commands_1.CommandsRegistry.registerCommand('workbench.extensions.action.showExtensionsWithIds', function (accessor, extensionIds) {
        const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
            .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
            .then(viewlet => {
            const query = extensionIds
                .map(id => `@id:${id}`)
                .join(' ');
            viewlet.search(query);
            viewlet.focus();
        });
    });
    exports.extensionButtonProminentBackground = (0, colorRegistry_1.registerColor)('extensionButton.prominentBackground', {
        dark: colorRegistry_1.buttonBackground,
        light: colorRegistry_1.buttonBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentBackground', "Button background color for actions extension that stand out (e.g. install button)."));
    exports.extensionButtonProminentForeground = (0, colorRegistry_1.registerColor)('extensionButton.prominentForeground', {
        dark: colorRegistry_1.buttonForeground,
        light: colorRegistry_1.buttonForeground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentForeground', "Button foreground color for actions extension that stand out (e.g. install button)."));
    exports.extensionButtonProminentHoverBackground = (0, colorRegistry_1.registerColor)('extensionButton.prominentHoverBackground', {
        dark: colorRegistry_1.buttonHoverBackground,
        light: colorRegistry_1.buttonHoverBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentHoverBackground', "Button background hover color for actions extension that stand out (e.g. install button)."));
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.built-in-status { border-color: ${foregroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.built-in-status { border-color: ${foregroundColor}; }`);
        }
        const buttonBackgroundColor = theme.getColor(colorRegistry_1.buttonBackground);
        if (buttonBackgroundColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.label { background-color: ${buttonBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.label { background-color: ${buttonBackgroundColor}; }`);
        }
        const buttonForegroundColor = theme.getColor(colorRegistry_1.buttonForeground);
        if (buttonForegroundColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.label { color: ${buttonForegroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.label { color: ${buttonForegroundColor}; }`);
        }
        const buttonHoverBackgroundColor = theme.getColor(colorRegistry_1.buttonHoverBackground);
        if (buttonHoverBackgroundColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item:hover .action-label.extension-action.label { background-color: ${buttonHoverBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item:hover .action-label.extension-action.label { background-color: ${buttonHoverBackgroundColor}; }`);
        }
        const extensionButtonProminentBackgroundColor = theme.getColor(exports.extensionButtonProminentBackground);
        if (exports.extensionButtonProminentBackground) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.label.prominent { background-color: ${extensionButtonProminentBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.label.prominent { background-color: ${extensionButtonProminentBackgroundColor}; }`);
        }
        const extensionButtonProminentForegroundColor = theme.getColor(exports.extensionButtonProminentForeground);
        if (exports.extensionButtonProminentForeground) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.label.prominent { color: ${extensionButtonProminentForegroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.label.prominent { color: ${extensionButtonProminentForegroundColor}; }`);
        }
        const extensionButtonProminentHoverBackgroundColor = theme.getColor(exports.extensionButtonProminentHoverBackground);
        if (exports.extensionButtonProminentHoverBackground) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item:hover .action-label.extension-action.label.prominent { background-color: ${extensionButtonProminentHoverBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item:hover .action-label.extension-action.label.prominent { background-color: ${extensionButtonProminentHoverBackgroundColor}; }`);
        }
        const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
        if (contrastBorderColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action:not(.disabled) { border: 1px solid ${contrastBorderColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action:not(.disabled) { border: 1px solid ${contrastBorderColor}; }`);
        }
        const errorColor = theme.getColor(colorRegistry_1.editorErrorForeground);
        if (errorColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.extension-status-error { color: ${errorColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.extension-status-error { color: ${errorColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
        }
        const warningColor = theme.getColor(colorRegistry_1.editorWarningForeground);
        if (warningColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.extension-status-warning { color: ${warningColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.extension-status-warning { color: ${warningColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
        }
        const infoColor = theme.getColor(colorRegistry_1.editorInfoForeground);
        if (infoColor) {
            collector.addRule(`.extension-list-item .monaco-action-bar .action-item .action-label.extension-action.extension-status-info { color: ${infoColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.extension-status-info { color: ${infoColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themeService_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
        }
    });
});
//# sourceMappingURL=extensionsActions.js.map