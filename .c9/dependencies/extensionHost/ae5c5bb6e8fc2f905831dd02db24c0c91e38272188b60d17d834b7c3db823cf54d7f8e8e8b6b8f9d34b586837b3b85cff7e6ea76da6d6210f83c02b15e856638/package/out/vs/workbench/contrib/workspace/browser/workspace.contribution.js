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
define(["require", "exports", "vs/platform/instantiation/common/descriptors", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/contributions", "vs/base/common/codicons", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/browser/editor", "vs/workbench/contrib/workspace/browser/workspaceTrustEditor", "vs/workbench/services/workspaces/browser/workspaceTrustEditorInput", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/workbench/common/editor", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/base/common/path", "vs/platform/configuration/common/configuration", "vs/base/common/htmlContent", "vs/workbench/common/theme", "vs/platform/storage/common/storage", "vs/base/common/labels", "vs/workbench/services/host/browser/host", "vs/workbench/services/banner/browser/bannerService", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/preferences/common/preferences", "vs/platform/label/common/label", "vs/platform/product/common/productService", "vs/workbench/contrib/workspace/common/workspace", "vs/css!./media/workspaceTrustEditor"], function (require, exports, descriptors_1, lifecycle_1, nls_1, actions_1, configurationRegistry_1, dialogs_1, instantiation_1, notification_1, platform_1, workspaceTrust_1, contributions_1, codicons_1, editorService_1, contextkey_1, commands_1, statusbar_1, editor_1, workspaceTrustEditor_1, workspaceTrustEditorInput_1, workspaceTrust_2, editor_2, telemetry_1, workspace_1, path_1, configuration_1, htmlContent_1, theme_1, storage_1, labels_1, host_1, bannerService_1, virtualWorkspace_1, extensions_1, environmentService_1, preferences_1, preferences_2, label_1, productService_1, workspace_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustUXHandler = exports.WorkspaceTrustRequestHandler = exports.WorkspaceTrustContextKeys = void 0;
    const BANNER_RESTRICTED_MODE = 'workbench.banner.restrictedMode';
    const STARTUP_PROMPT_SHOWN_KEY = 'workspace.trust.startupPrompt.shown';
    const BANNER_RESTRICTED_MODE_DISMISSED_KEY = 'workbench.banner.restrictedMode.dismissed';
    let WorkspaceTrustContextKeys = class WorkspaceTrustContextKeys extends lifecycle_1.Disposable {
        constructor(contextKeyService, workspaceTrustEnablementService, workspaceTrustManagementService) {
            super();
            this._ctxWorkspaceTrustEnabled = workspace_2.WorkspaceTrustContext.IsEnabled.bindTo(contextKeyService);
            this._ctxWorkspaceTrustEnabled.set(workspaceTrustEnablementService.isWorkspaceTrustEnabled());
            this._ctxWorkspaceTrustState = workspace_2.WorkspaceTrustContext.IsTrusted.bindTo(contextKeyService);
            this._ctxWorkspaceTrustState.set(workspaceTrustManagementService.isWorkspaceTrusted());
            this._register(workspaceTrustManagementService.onDidChangeTrust(trusted => this._ctxWorkspaceTrustState.set(trusted)));
        }
    };
    WorkspaceTrustContextKeys = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], WorkspaceTrustContextKeys);
    exports.WorkspaceTrustContextKeys = WorkspaceTrustContextKeys;
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WorkspaceTrustContextKeys, 3 /* LifecyclePhase.Restored */);
    /*
     * Trust Request via Service UX handler
     */
    let WorkspaceTrustRequestHandler = class WorkspaceTrustRequestHandler extends lifecycle_1.Disposable {
        constructor(dialogService, commandService, workspaceContextService, workspaceTrustManagementService, workspaceTrustRequestService) {
            super();
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.registerListeners();
        }
        get useWorkspaceLanguage() {
            return !(0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
        }
        async registerListeners() {
            await this.workspaceTrustManagementService.workspaceResolved;
            // Open files trust request
            this._register(this.workspaceTrustRequestService.onDidInitiateOpenFilesTrustRequest(async () => {
                // Details
                const markdownDetails = [
                    this.workspaceContextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ?
                        (0, nls_1.localize)('openLooseFileWorkspaceDetails', "You are trying to open untrusted files in a workspace which is trusted.") :
                        (0, nls_1.localize)('openLooseFileWindowDetails', "You are trying to open untrusted files in a window which is trusted."),
                    (0, nls_1.localize)('openLooseFileLearnMore', "If you don't trust the authors of these files, we recommend to open them in Restricted Mode in a new window as the files may be malicious. See [our docs](https://aka.ms/vscode-workspace-trust) to learn more.")
                ];
                // Dialog
                const result = await this.dialogService.show(notification_1.Severity.Info, (0, nls_1.localize)('openLooseFileMesssage', "Do you trust the authors of these files?"), [(0, nls_1.localize)('open', "Open"), (0, nls_1.localize)('newWindow', "Open in Restricted Mode"), (0, nls_1.localize)('cancel', "Cancel")], {
                    cancelId: 2,
                    checkbox: {
                        label: (0, nls_1.localize)('openLooseFileWorkspaceCheckbox', "Remember my decision for all workspaces"),
                        checked: false
                    },
                    custom: {
                        icon: codicons_1.Codicon.shield,
                        markdownDetails: markdownDetails.map(md => { return { markdown: new htmlContent_1.MarkdownString(md) }; })
                    }
                });
                switch (result.choice) {
                    case 0:
                        await this.workspaceTrustRequestService.completeOpenFilesTrustRequest(1 /* WorkspaceTrustUriResponse.Open */, !!result.checkboxChecked);
                        break;
                    case 1:
                        await this.workspaceTrustRequestService.completeOpenFilesTrustRequest(2 /* WorkspaceTrustUriResponse.OpenInNewWindow */, !!result.checkboxChecked);
                        break;
                    default:
                        await this.workspaceTrustRequestService.completeOpenFilesTrustRequest(3 /* WorkspaceTrustUriResponse.Cancel */);
                        break;
                }
            }));
            // Workspace trust request
            this._register(this.workspaceTrustRequestService.onDidInitiateWorkspaceTrustRequest(async (requestOptions) => {
                var _a, _b;
                // Title
                const title = this.useWorkspaceLanguage ?
                    (0, nls_1.localize)('workspaceTrust', "Do you trust the authors of the files in this workspace?") :
                    (0, nls_1.localize)('folderTrust', "Do you trust the authors of the files in this folder?");
                // Message
                const defaultMessage = (0, nls_1.localize)('immediateTrustRequestMessage', "A feature you are trying to use may be a security risk if you do not trust the source of the files or folders you currently have open.");
                const message = (_a = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.message) !== null && _a !== void 0 ? _a : defaultMessage;
                // Buttons
                const buttons = (_b = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.buttons) !== null && _b !== void 0 ? _b : [
                    { label: this.useWorkspaceLanguage ? (0, nls_1.localize)('grantWorkspaceTrustButton', "Trust Workspace & Continue") : (0, nls_1.localize)('grantFolderTrustButton', "Trust Folder & Continue"), type: 'ContinueWithTrust' },
                    { label: (0, nls_1.localize)('manageWorkspaceTrustButton', "Manage"), type: 'Manage' }
                ];
                // Add Cancel button if not provided
                if (!buttons.some(b => b.type === 'Cancel')) {
                    buttons.push({ label: (0, nls_1.localize)('cancelWorkspaceTrustButton', "Cancel"), type: 'Cancel' });
                }
                // Dialog
                const result = await this.dialogService.show(notification_1.Severity.Info, title, buttons.map(b => b.label), {
                    cancelId: buttons.findIndex(b => b.type === 'Cancel'),
                    custom: {
                        icon: codicons_1.Codicon.shield,
                        markdownDetails: [
                            { markdown: new htmlContent_1.MarkdownString(message) },
                            { markdown: new htmlContent_1.MarkdownString((0, nls_1.localize)('immediateTrustRequestLearnMore', "If you don't trust the authors of these files, we do not recommend continuing as the files may be malicious. See [our docs](https://aka.ms/vscode-workspace-trust) to learn more.")) }
                        ]
                    }
                });
                // Dialog result
                switch (buttons[result.choice].type) {
                    case 'ContinueWithTrust':
                        await this.workspaceTrustRequestService.completeWorkspaceTrustRequest(true);
                        break;
                    case 'ContinueWithoutTrust':
                        await this.workspaceTrustRequestService.completeWorkspaceTrustRequest(undefined);
                        break;
                    case 'Manage':
                        this.workspaceTrustRequestService.cancelWorkspaceTrustRequest();
                        await this.commandService.executeCommand(workspace_2.MANAGE_TRUST_COMMAND_ID);
                        break;
                    case 'Cancel':
                        this.workspaceTrustRequestService.cancelWorkspaceTrustRequest();
                        break;
                }
            }));
        }
    };
    WorkspaceTrustRequestHandler = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, commands_1.ICommandService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustRequestService)
    ], WorkspaceTrustRequestHandler);
    exports.WorkspaceTrustRequestHandler = WorkspaceTrustRequestHandler;
    /*
     * Trust UX and Startup Handler
     */
    let WorkspaceTrustUXHandler = class WorkspaceTrustUXHandler extends lifecycle_1.Disposable {
        constructor(dialogService, workspaceContextService, workspaceTrustEnablementService, workspaceTrustManagementService, configurationService, statusbarService, storageService, workspaceTrustRequestService, bannerService, labelService, hostService, productService) {
            super();
            this.dialogService = dialogService;
            this.workspaceContextService = workspaceContextService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.statusbarService = statusbarService;
            this.storageService = storageService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.bannerService = bannerService;
            this.labelService = labelService;
            this.hostService = hostService;
            this.productService = productService;
            this.entryId = `status.workspaceTrust.${this.workspaceContextService.getWorkspace().id}`;
            this.statusbarEntryAccessor = this._register(new lifecycle_1.MutableDisposable());
            (async () => {
                await this.workspaceTrustManagementService.workspaceTrustInitialized;
                if (this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                    this.registerListeners();
                    this.createStatusbarEntry();
                    // Show modal dialog
                    if (this.hostService.hasFocus) {
                        this.showModalOnStart();
                    }
                    else {
                        const focusDisposable = this.hostService.onDidChangeFocus(focused => {
                            if (focused) {
                                focusDisposable.dispose();
                                this.showModalOnStart();
                            }
                        });
                    }
                }
            })();
        }
        registerListeners() {
            this._register(this.workspaceContextService.onWillChangeWorkspaceFolders(e => {
                if (e.fromCache) {
                    return;
                }
                if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                    return;
                }
                const addWorkspaceFolder = async (e) => {
                    const trusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
                    // Workspace is trusted and there are added/changed folders
                    if (trusted && (e.changes.added.length || e.changes.changed.length)) {
                        const addedFoldersTrustInfo = await Promise.all(e.changes.added.map(folder => this.workspaceTrustManagementService.getUriTrustInfo(folder.uri)));
                        if (!addedFoldersTrustInfo.map(info => info.trusted).every(trusted => trusted)) {
                            const result = await this.dialogService.show(notification_1.Severity.Info, (0, nls_1.localize)('addWorkspaceFolderMessage', "Do you trust the authors of the files in this folder?"), [(0, nls_1.localize)('yes', 'Yes'), (0, nls_1.localize)('no', 'No')], {
                                detail: (0, nls_1.localize)('addWorkspaceFolderDetail', "You are adding files to a trusted workspace that are not currently trusted. Do you trust the authors of these new files?"),
                                cancelId: 1,
                                custom: { icon: codicons_1.Codicon.shield }
                            });
                            // Mark added/changed folders as trusted
                            await this.workspaceTrustManagementService.setUrisTrust(addedFoldersTrustInfo.map(i => i.uri), result.choice === 0);
                        }
                    }
                };
                return e.join(addWorkspaceFolder(e));
            }));
            this._register(this.workspaceTrustManagementService.onDidChangeTrust(trusted => {
                this.updateWorkbenchIndicators(trusted);
            }));
            this._register(this.workspaceTrustRequestService.onDidInitiateWorkspaceTrustRequestOnStartup(() => {
                const title = this.useWorkspaceLanguage ?
                    (0, nls_1.localize)('workspaceTrust', "Do you trust the authors of the files in this workspace?") :
                    (0, nls_1.localize)('folderTrust', "Do you trust the authors of the files in this folder?");
                let checkboxText;
                const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace());
                const isSingleFolderWorkspace = (0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier);
                if (this.workspaceTrustManagementService.canSetParentFolderTrust()) {
                    const { name } = (0, labels_1.splitName)((0, labels_1.splitName)(workspaceIdentifier.uri.fsPath).parentPath);
                    checkboxText = (0, nls_1.localize)('checkboxString', "Trust the authors of all files in the parent folder '{0}'", name);
                }
                // Show Workspace Trust Start Dialog
                this.doShowModal(title, { label: (0, nls_1.localize)('trustOption', "Yes, I trust the authors"), sublabel: isSingleFolderWorkspace ? (0, nls_1.localize)('trustFolderOptionDescription', "Trust folder and enable all features") : (0, nls_1.localize)('trustWorkspaceOptionDescription', "Trust workspace and enable all features") }, { label: (0, nls_1.localize)('dontTrustOption', "No, I don't trust the authors"), sublabel: isSingleFolderWorkspace ? (0, nls_1.localize)('dontTrustFolderOptionDescription', "Browse folder in restricted mode") : (0, nls_1.localize)('dontTrustWorkspaceOptionDescription', "Browse workspace in restricted mode") }, [
                    !isSingleFolderWorkspace ?
                        (0, nls_1.localize)('workspaceStartupTrustDetails', "{0} provides features that may automatically execute files in this workspace.", this.productService.nameShort) :
                        (0, nls_1.localize)('folderStartupTrustDetails', "{0} provides features that may automatically execute files in this folder.", this.productService.nameShort),
                    (0, nls_1.localize)('startupTrustRequestLearnMore', "If you don't trust the authors of these files, we recommend to continue in restricted mode as the files may be malicious. See [our docs](https://aka.ms/vscode-workspace-trust) to learn more."),
                    `\`${this.labelService.getWorkspaceLabel(workspaceIdentifier, { verbose: true })}\``,
                ], checkboxText);
            }));
        }
        updateWorkbenchIndicators(trusted) {
            const bannerItem = this.getBannerItem(!trusted);
            this.updateStatusbarEntry(trusted);
            if (bannerItem) {
                if (!trusted) {
                    this.bannerService.show(bannerItem);
                }
                else {
                    this.bannerService.hide(BANNER_RESTRICTED_MODE);
                }
            }
        }
        //#region Dialog
        async doShowModal(question, trustedOption, untrustedOption, markdownStrings, trustParentString) {
            const result = await this.dialogService.show(notification_1.Severity.Info, question, [
                trustedOption.label,
                untrustedOption.label,
            ], {
                checkbox: trustParentString ? {
                    label: trustParentString
                } : undefined,
                custom: {
                    buttonDetails: [
                        trustedOption.sublabel,
                        untrustedOption.sublabel
                    ],
                    disableCloseAction: true,
                    icon: codicons_1.Codicon.shield,
                    markdownDetails: markdownStrings.map(md => { return { markdown: new htmlContent_1.MarkdownString(md) }; })
                },
            });
            // Dialog result
            switch (result.choice) {
                case 0:
                    if (result.checkboxChecked) {
                        await this.workspaceTrustManagementService.setParentFolderTrust(true);
                    }
                    else {
                        await this.workspaceTrustRequestService.completeWorkspaceTrustRequest(true);
                    }
                    break;
                case 1:
                    this.updateWorkbenchIndicators(false);
                    this.workspaceTrustRequestService.cancelWorkspaceTrustRequest();
                    break;
            }
            this.storageService.store(STARTUP_PROMPT_SHOWN_KEY, true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async showModalOnStart() {
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                this.updateWorkbenchIndicators(true);
                return;
            }
            // Don't show modal prompt if workspace trust cannot be changed
            if (!(this.workspaceTrustManagementService.canSetWorkspaceTrust())) {
                return;
            }
            // Don't show modal prompt for virtual workspaces by default
            if ((0, virtualWorkspace_1.isVirtualWorkspace)(this.workspaceContextService.getWorkspace())) {
                this.updateWorkbenchIndicators(false);
                return;
            }
            // Don't show modal prompt for empty workspaces by default
            if (this.workspaceContextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                this.updateWorkbenchIndicators(false);
                return;
            }
            if (this.startupPromptSetting === 'never') {
                this.updateWorkbenchIndicators(false);
                return;
            }
            if (this.startupPromptSetting === 'once' && this.storageService.getBoolean(STARTUP_PROMPT_SHOWN_KEY, 1 /* StorageScope.WORKSPACE */, false)) {
                this.updateWorkbenchIndicators(false);
                return;
            }
            // Use the workspace trust request service to show modal dialog
            this.workspaceTrustRequestService.requestWorkspaceTrustOnStartup();
        }
        get startupPromptSetting() {
            return this.configurationService.getValue(workspaceTrust_2.WORKSPACE_TRUST_STARTUP_PROMPT);
        }
        get useWorkspaceLanguage() {
            return !(0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
        }
        //#endregion
        //#region Banner
        getBannerItem(restrictedMode) {
            const dismissedRestricted = this.storageService.getBoolean(BANNER_RESTRICTED_MODE_DISMISSED_KEY, 1 /* StorageScope.WORKSPACE */, false);
            // never show the banner
            if (this.bannerSetting === 'never') {
                return undefined;
            }
            // info has been dismissed
            if (this.bannerSetting === 'untilDismissed' && dismissedRestricted) {
                return undefined;
            }
            const actions = [
                {
                    label: (0, nls_1.localize)('restrictedModeBannerManage', "Manage"),
                    href: 'command:' + workspace_2.MANAGE_TRUST_COMMAND_ID
                },
                {
                    label: (0, nls_1.localize)('restrictedModeBannerLearnMore', "Learn More"),
                    href: 'https://aka.ms/vscode-workspace-trust'
                }
            ];
            return {
                id: BANNER_RESTRICTED_MODE,
                icon: workspaceTrustEditor_1.shieldIcon,
                ariaLabel: this.getBannerItemAriaLabels(),
                message: this.getBannerItemMessages(),
                actions,
                onClose: () => {
                    if (restrictedMode) {
                        this.storageService.store(BANNER_RESTRICTED_MODE_DISMISSED_KEY, true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    }
                }
            };
        }
        getBannerItemAriaLabels() {
            switch (this.workspaceContextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */:
                    return (0, nls_1.localize)('restrictedModeBannerAriaLabelWindow', "Restricted Mode is intended for safe code browsing. Trust this window to enable all features. Use navigation keys to access banner actions.");
                case 2 /* WorkbenchState.FOLDER */:
                    return (0, nls_1.localize)('restrictedModeBannerAriaLabelFolder', "Restricted Mode is intended for safe code browsing. Trust this folder to enable all features. Use navigation keys to access banner actions.");
                case 3 /* WorkbenchState.WORKSPACE */:
                    return (0, nls_1.localize)('restrictedModeBannerAriaLabelWorkspace', "Restricted Mode is intended for safe code browsing. Trust this workspace to enable all features. Use navigation keys to access banner actions.");
            }
        }
        getBannerItemMessages() {
            switch (this.workspaceContextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */:
                    return (0, nls_1.localize)('restrictedModeBannerMessageWindow', "Restricted Mode is intended for safe code browsing. Trust this window to enable all features.");
                case 2 /* WorkbenchState.FOLDER */:
                    return (0, nls_1.localize)('restrictedModeBannerMessageFolder', "Restricted Mode is intended for safe code browsing. Trust this folder to enable all features.");
                case 3 /* WorkbenchState.WORKSPACE */:
                    return (0, nls_1.localize)('restrictedModeBannerMessageWorkspace', "Restricted Mode is intended for safe code browsing. Trust this workspace to enable all features.");
            }
        }
        get bannerSetting() {
            return this.configurationService.getValue(workspaceTrust_2.WORKSPACE_TRUST_BANNER);
        }
        //#endregion
        //#region Statusbar
        createStatusbarEntry() {
            const entry = this.getStatusbarEntry(this.workspaceTrustManagementService.isWorkspaceTrusted());
            this.statusbarEntryAccessor.value = this.statusbarService.addEntry(entry, this.entryId, 0 /* StatusbarAlignment.LEFT */, 0.99 * Number.MAX_VALUE /* Right of remote indicator */);
            this.statusbarService.updateEntryVisibility(this.entryId, false);
        }
        getStatusbarEntry(trusted) {
            const text = (0, workspaceTrust_1.workspaceTrustToString)(trusted);
            const backgroundColor = { id: theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND };
            const color = { id: theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND };
            let ariaLabel = '';
            let toolTip;
            switch (this.workspaceContextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: {
                    ariaLabel = trusted ? (0, nls_1.localize)('status.ariaTrustedWindow', "This window is trusted.") :
                        (0, nls_1.localize)('status.ariaUntrustedWindow', "Restricted Mode: Some features are disabled because this window is not trusted.");
                    toolTip = trusted ? ariaLabel : {
                        value: (0, nls_1.localize)({ key: 'status.tooltipUntrustedWindow2', comment: ['[abc]({n}) are links.  Only translate `features are disabled` and `window is not trusted`. Do not change brackets and parentheses or {n}'] }, "Running in Restricted Mode\n\nSome [features are disabled]({0}) because this [window is not trusted]({1}).", `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`, `command:${workspace_2.MANAGE_TRUST_COMMAND_ID}`),
                        isTrusted: true,
                        supportThemeIcons: true
                    };
                    break;
                }
                case 2 /* WorkbenchState.FOLDER */: {
                    ariaLabel = trusted ? (0, nls_1.localize)('status.ariaTrustedFolder', "This folder is trusted.") :
                        (0, nls_1.localize)('status.ariaUntrustedFolder', "Restricted Mode: Some features are disabled because this folder is not trusted.");
                    toolTip = trusted ? ariaLabel : {
                        value: (0, nls_1.localize)({ key: 'status.tooltipUntrustedFolder2', comment: ['[abc]({n}) are links.  Only translate `features are disabled` and `folder is not trusted`. Do not change brackets and parentheses or {n}'] }, "Running in Restricted Mode\n\nSome [features are disabled]({0}) because this [folder is not trusted]({1}).", `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`, `command:${workspace_2.MANAGE_TRUST_COMMAND_ID}`),
                        isTrusted: true,
                        supportThemeIcons: true
                    };
                    break;
                }
                case 3 /* WorkbenchState.WORKSPACE */: {
                    ariaLabel = trusted ? (0, nls_1.localize)('status.ariaTrustedWorkspace', "This workspace is trusted.") :
                        (0, nls_1.localize)('status.ariaUntrustedWorkspace', "Restricted Mode: Some features are disabled because this workspace is not trusted.");
                    toolTip = trusted ? ariaLabel : {
                        value: (0, nls_1.localize)({ key: 'status.tooltipUntrustedWorkspace2', comment: ['[abc]({n}) are links. Only translate `features are disabled` and `workspace is not trusted`. Do not change brackets and parentheses or {n}'] }, "Running in Restricted Mode\n\nSome [features are disabled]({0}) because this [workspace is not trusted]({1}).", `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`, `command:${workspace_2.MANAGE_TRUST_COMMAND_ID}`),
                        isTrusted: true,
                        supportThemeIcons: true
                    };
                    break;
                }
            }
            return {
                name: (0, nls_1.localize)('status.WorkspaceTrust', "Workspace Trust"),
                text: trusted ? `$(shield)` : `$(shield) ${text}`,
                ariaLabel: ariaLabel,
                tooltip: toolTip,
                command: workspace_2.MANAGE_TRUST_COMMAND_ID,
                backgroundColor,
                color
            };
        }
        updateStatusbarEntry(trusted) {
            var _a;
            (_a = this.statusbarEntryAccessor.value) === null || _a === void 0 ? void 0 : _a.update(this.getStatusbarEntry(trusted));
            this.statusbarService.updateEntryVisibility(this.entryId, !trusted);
        }
    };
    WorkspaceTrustUXHandler = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(3, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, storage_1.IStorageService),
        __param(7, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(8, bannerService_1.IBannerService),
        __param(9, label_1.ILabelService),
        __param(10, host_1.IHostService),
        __param(11, productService_1.IProductService)
    ], WorkspaceTrustUXHandler);
    exports.WorkspaceTrustUXHandler = WorkspaceTrustUXHandler;
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WorkspaceTrustRequestHandler, 2 /* LifecyclePhase.Ready */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WorkspaceTrustUXHandler, 3 /* LifecyclePhase.Restored */);
    /**
     * Trusted Workspace GUI Editor
     */
    class WorkspaceTrustEditorInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(input) {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput);
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory)
        .registerEditorSerializer(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput.ID, WorkspaceTrustEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(workspaceTrustEditor_1.WorkspaceTrustEditor, workspaceTrustEditor_1.WorkspaceTrustEditor.ID, (0, nls_1.localize)('workspaceTrustEditor', "Workspace Trust Editor")), [
        new descriptors_1.SyncDescriptor(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput)
    ]);
    /*
     * Actions
     */
    // Configure Workspace Trust
    const CONFIGURE_TRUST_COMMAND_ID = 'workbench.trust.configure';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CONFIGURE_TRUST_COMMAND_ID,
                title: { original: 'Configure Workspace Trust', value: (0, nls_1.localize)('configureWorkspaceTrust', "Configure Workspace Trust") },
                precondition: contextkey_1.ContextKeyExpr.and(workspace_2.WorkspaceTrustContext.IsEnabled, contextkey_1.ContextKeyExpr.equals(`config.${workspaceTrust_2.WORKSPACE_TRUST_ENABLED}`, true)),
                category: (0, nls_1.localize)('workspacesCategory', "Workspaces"),
                f1: true
            });
        }
        run(accessor) {
            accessor.get(preferences_2.IPreferencesService).openUserSettings({ jsonEditor: false, query: `@tag:${preferences_1.WORKSPACE_TRUST_SETTING_TAG}` });
        }
    });
    // Manage Workspace Trust
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: workspace_2.MANAGE_TRUST_COMMAND_ID,
                title: { original: 'Manage Workspace Trust', value: (0, nls_1.localize)('manageWorkspaceTrust', "Manage Workspace Trust") },
                precondition: contextkey_1.ContextKeyExpr.and(workspace_2.WorkspaceTrustContext.IsEnabled, contextkey_1.ContextKeyExpr.equals(`config.${workspaceTrust_2.WORKSPACE_TRUST_ENABLED}`, true)),
                category: (0, nls_1.localize)('workspacesCategory', "Workspaces"),
                f1: true,
                menu: {
                    id: actions_1.MenuId.GlobalActivity,
                    group: '6_workspace_trust',
                    order: 40,
                    when: contextkey_1.ContextKeyExpr.and(workspace_2.WorkspaceTrustContext.IsEnabled, contextkey_1.ContextKeyExpr.equals(`config.${workspaceTrust_2.WORKSPACE_TRUST_ENABLED}`, true))
                },
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const input = instantiationService.createInstance(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput);
            editorService.openEditor(input, { pinned: true });
            return;
        }
    });
    /*
     * Configuration
     */
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'security',
        scope: 1 /* ConfigurationScope.APPLICATION */,
        title: (0, nls_1.localize)('securityConfigurationTitle', "Security"),
        type: 'object',
        order: 7,
        properties: {
            [workspaceTrust_2.WORKSPACE_TRUST_ENABLED]: {
                type: 'boolean',
                default: true,
                description: (0, nls_1.localize)('workspace.trust.description', "Controls whether or not workspace trust is enabled within VS Code."),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
            },
            [workspaceTrust_2.WORKSPACE_TRUST_STARTUP_PROMPT]: {
                type: 'string',
                default: 'once',
                description: (0, nls_1.localize)('workspace.trust.startupPrompt.description', "Controls when the startup prompt to trust a workspace is shown."),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
                enum: ['always', 'once', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('workspace.trust.startupPrompt.always', "Ask for trust every time an untrusted workspace is opened."),
                    (0, nls_1.localize)('workspace.trust.startupPrompt.once', "Ask for trust the first time an untrusted workspace is opened."),
                    (0, nls_1.localize)('workspace.trust.startupPrompt.never', "Do not ask for trust when an untrusted workspace is opened."),
                ]
            },
            [workspaceTrust_2.WORKSPACE_TRUST_BANNER]: {
                type: 'string',
                default: 'untilDismissed',
                description: (0, nls_1.localize)('workspace.trust.banner.description', "Controls when the restricted mode banner is shown."),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
                enum: ['always', 'untilDismissed', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('workspace.trust.banner.always', "Show the banner every time an untrusted workspace is open."),
                    (0, nls_1.localize)('workspace.trust.banner.untilDismissed', "Show the banner when an untrusted workspace is opened until dismissed."),
                    (0, nls_1.localize)('workspace.trust.banner.never', "Do not show the banner when an untrusted workspace is open."),
                ]
            },
            [workspaceTrust_2.WORKSPACE_TRUST_UNTRUSTED_FILES]: {
                type: 'string',
                default: 'prompt',
                markdownDescription: (0, nls_1.localize)('workspace.trust.untrustedFiles.description', "Controls how to handle opening untrusted files in a trusted workspace. This setting also applies to opening files in an empty window which is trusted via `#{0}#`.", workspaceTrust_2.WORKSPACE_TRUST_EMPTY_WINDOW),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
                enum: ['prompt', 'open', 'newWindow'],
                enumDescriptions: [
                    (0, nls_1.localize)('workspace.trust.untrustedFiles.prompt', "Ask how to handle untrusted files for each workspace. Once untrusted files are introduced to a trusted workspace, you will not be prompted again."),
                    (0, nls_1.localize)('workspace.trust.untrustedFiles.open', "Always allow untrusted files to be introduced to a trusted workspace without prompting."),
                    (0, nls_1.localize)('workspace.trust.untrustedFiles.newWindow', "Always open untrusted files in a separate window in restricted mode without prompting."),
                ]
            },
            [workspaceTrust_2.WORKSPACE_TRUST_EMPTY_WINDOW]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('workspace.trust.emptyWindow.description', "Controls whether or not the empty window is trusted by default within VS Code. When used with `#{0}#`, you can enable the full functionality of VS Code without prompting in an empty window.", workspaceTrust_2.WORKSPACE_TRUST_UNTRUSTED_FILES),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */
            }
        }
    });
    let WorkspaceTrustTelemetryContribution = class WorkspaceTrustTelemetryContribution extends lifecycle_1.Disposable {
        constructor(environmentService, telemetryService, workspaceContextService, workspaceTrustEnablementService, workspaceTrustManagementService) {
            super();
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.workspaceContextService = workspaceContextService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.workspaceTrustManagementService.workspaceTrustInitialized
                .then(() => {
                this.logInitialWorkspaceTrustInfo();
                this.logWorkspaceTrust(this.workspaceTrustManagementService.isWorkspaceTrusted());
                this._register(this.workspaceTrustManagementService.onDidChangeTrust(isTrusted => this.logWorkspaceTrust(isTrusted)));
            });
        }
        logInitialWorkspaceTrustInfo() {
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                const disabledByCliFlag = this.environmentService.disableWorkspaceTrust;
                this.telemetryService.publicLog2('workspaceTrustDisabled', {
                    reason: disabledByCliFlag ? 'cli' : 'setting'
                });
                return;
            }
            this.telemetryService.publicLog2('workspaceTrustFolderCounts', {
                trustedFoldersCount: this.workspaceTrustManagementService.getTrustedUris().length,
            });
        }
        async logWorkspaceTrust(isTrusted) {
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return;
            }
            this.telemetryService.publicLog2('workspaceTrustStateChanged', {
                workspaceId: this.workspaceContextService.getWorkspace().id,
                isTrusted: isTrusted
            });
            if (isTrusted) {
                const getDepth = (folder) => {
                    let resolvedPath = (0, path_1.resolve)(folder);
                    let depth = 0;
                    while ((0, path_1.dirname)(resolvedPath) !== resolvedPath && depth < 100) {
                        resolvedPath = (0, path_1.dirname)(resolvedPath);
                        depth++;
                    }
                    return depth;
                };
                for (const folder of this.workspaceContextService.getWorkspace().folders) {
                    const { trusted, uri } = await this.workspaceTrustManagementService.getUriTrustInfo(folder.uri);
                    if (!trusted) {
                        continue;
                    }
                    const workspaceFolderDepth = getDepth(folder.uri.fsPath);
                    const trustedFolderDepth = getDepth(uri.fsPath);
                    const delta = workspaceFolderDepth - trustedFolderDepth;
                    this.telemetryService.publicLog2('workspaceFolderDepthBelowTrustedFolder', { workspaceFolderDepth, trustedFolderDepth, delta });
                }
            }
        }
    };
    WorkspaceTrustTelemetryContribution = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], WorkspaceTrustTelemetryContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WorkspaceTrustTelemetryContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=workspace.contribution.js.map