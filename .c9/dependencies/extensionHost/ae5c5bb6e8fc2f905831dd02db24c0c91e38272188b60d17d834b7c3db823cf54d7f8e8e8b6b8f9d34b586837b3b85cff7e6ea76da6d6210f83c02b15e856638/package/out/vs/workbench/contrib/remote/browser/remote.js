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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/uri", "vs/workbench/services/layout/browser/layoutService", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/contrib/remote/browser/remoteExplorer", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/platform/progress/common/progress", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/workbench/browser/actions/windowActions", "vs/base/common/lifecycle", "vs/workbench/contrib/remote/browser/explorerViewItems", "vs/base/common/types", "vs/workbench/services/remote/common/remoteExplorerService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/list/browser/listService", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/remote/browser/remoteIcons", "vs/platform/log/common/log", "vs/workbench/services/timer/browser/timerService", "vs/platform/remote/common/remoteHosts", "vs/css!./media/remoteViewlet"], function (require, exports, nls, dom, uri_1, layoutService_1, telemetry_1, workspace_1, storage_1, configuration_1, instantiation_1, themeService_1, contextView_1, extensions_1, viewsViewlet_1, remoteExplorer_1, contextkey_1, views_1, platform_1, opener_1, quickInput_1, commands_1, actions_1, progress_1, remoteAgentService_1, dialogs_1, severity_1, windowActions_1, lifecycle_1, explorerViewItems_1, types_1, remoteExplorerService_1, environmentService_1, viewPane_1, listService_1, keybinding_1, event_1, extensionsRegistry_1, descriptors_1, icons, log_1, timerService_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentConnectionStatusListener = exports.RemoteMarkers = exports.RemoteViewPaneContainer = void 0;
    const remoteHelpExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'remoteHelp',
        jsonSchema: {
            description: nls.localize('RemoteHelpInformationExtPoint', 'Contributes help information for Remote'),
            type: 'object',
            properties: {
                'getStarted': {
                    description: nls.localize('RemoteHelpInformationExtPoint.getStarted', "The url, or a command that returns the url, to your project's Getting Started page"),
                    type: 'string'
                },
                'documentation': {
                    description: nls.localize('RemoteHelpInformationExtPoint.documentation', "The url, or a command that returns the url, to your project's documentation page"),
                    type: 'string'
                },
                'feedback': {
                    description: nls.localize('RemoteHelpInformationExtPoint.feedback', "The url, or a command that returns the url, to your project's feedback reporter"),
                    type: 'string'
                },
                'issues': {
                    description: nls.localize('RemoteHelpInformationExtPoint.issues', "The url, or a command that returns the url, to your project's issues list"),
                    type: 'string'
                }
            }
        }
    });
    class HelpTreeVirtualDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return 'HelpItemTemplate';
        }
    }
    class HelpTreeRenderer {
        constructor() {
            this.templateId = 'HelpItemTemplate';
        }
        renderTemplate(container) {
            container.classList.add('remote-help-tree-node-item');
            const icon = dom.append(container, dom.$('.remote-help-tree-node-item-icon'));
            const data = Object.create(null);
            data.parent = container;
            data.icon = icon;
            return data;
        }
        renderElement(element, index, templateData, height) {
            const container = templateData.parent;
            dom.append(container, templateData.icon);
            templateData.icon.classList.add(...element.element.iconClasses);
            const labelContainer = dom.append(container, dom.$('.help-item-label'));
            labelContainer.innerText = element.element.label;
        }
        disposeTemplate(templateData) {
        }
    }
    class HelpDataSource {
        hasChildren(element) {
            return element instanceof HelpModel;
        }
        getChildren(element) {
            if (element instanceof HelpModel && element.items) {
                return element.items;
            }
            return [];
        }
    }
    class HelpModel {
        constructor(viewModel, openerService, quickInputService, commandService, remoteExplorerService, environmentService) {
            let helpItems = [];
            const getStarted = viewModel.helpInformation.filter(info => info.getStarted);
            if (getStarted.length) {
                helpItems.push(new HelpItem(icons.getStartedIcon, nls.localize('remote.help.getStarted', "Get Started"), getStarted.map((info) => (new HelpItemValue(commandService, info.extensionDescription, (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName, info.getStarted))), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            const documentation = viewModel.helpInformation.filter(info => info.documentation);
            if (documentation.length) {
                helpItems.push(new HelpItem(icons.documentationIcon, nls.localize('remote.help.documentation', "Read Documentation"), documentation.map((info) => (new HelpItemValue(commandService, info.extensionDescription, (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName, info.documentation))), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            const feedback = viewModel.helpInformation.filter(info => info.feedback);
            if (feedback.length) {
                helpItems.push(new HelpItem(icons.feedbackIcon, nls.localize('remote.help.feedback', "Provide Feedback"), feedback.map((info) => (new HelpItemValue(commandService, info.extensionDescription, (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName, info.feedback))), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            const issues = viewModel.helpInformation.filter(info => info.issues);
            if (issues.length) {
                helpItems.push(new HelpItem(icons.reviewIssuesIcon, nls.localize('remote.help.issues', "Review Issues"), issues.map((info) => (new HelpItemValue(commandService, info.extensionDescription, (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName, info.issues))), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            if (helpItems.length) {
                helpItems.push(new IssueReporterItem(icons.reportIssuesIcon, nls.localize('remote.help.report', "Report Issue"), viewModel.helpInformation.map(info => (new HelpItemValue(commandService, info.extensionDescription, (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName))), quickInputService, environmentService, commandService, remoteExplorerService));
            }
            if (helpItems.length) {
                this.items = helpItems;
            }
        }
    }
    class HelpItemValue {
        constructor(commandService, extensionDescription, remoteAuthority, urlOrCommand) {
            this.commandService = commandService;
            this.extensionDescription = extensionDescription;
            this.remoteAuthority = remoteAuthority;
            this.urlOrCommand = urlOrCommand;
        }
        get url() {
            return this.getUrl();
        }
        async getUrl() {
            if (this._url === undefined) {
                if (this.urlOrCommand) {
                    let url = uri_1.URI.parse(this.urlOrCommand);
                    if (url.authority) {
                        this._url = this.urlOrCommand;
                    }
                    else {
                        const urlCommand = this.commandService.executeCommand(this.urlOrCommand);
                        // We must be defensive. The command may never return, meaning that no help at all is ever shown!
                        const emptyString = new Promise(resolve => setTimeout(() => resolve(''), 500));
                        this._url = await Promise.race([urlCommand, emptyString]);
                    }
                }
            }
            if (this._url === undefined) {
                this._url = '';
            }
            return this._url;
        }
    }
    class HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, remoteExplorerService) {
            this.icon = icon;
            this.label = label;
            this.values = values;
            this.quickInputService = quickInputService;
            this.environmentService = environmentService;
            this.remoteExplorerService = remoteExplorerService;
            this.iconClasses = [];
            this.iconClasses.push(...themeService_1.ThemeIcon.asClassNameArray(icon));
            this.iconClasses.push('remote-help-tree-node-item-icon');
        }
        async handleClick() {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (remoteAuthority) {
                for (let i = 0; i < this.remoteExplorerService.targetType.length; i++) {
                    if (remoteAuthority.startsWith(this.remoteExplorerService.targetType[i])) {
                        for (let value of this.values) {
                            if (value.remoteAuthority) {
                                for (let authority of value.remoteAuthority) {
                                    if (remoteAuthority.startsWith(authority)) {
                                        await this.takeAction(value.extensionDescription, await value.url);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (this.values.length > 1) {
                let actions = (await Promise.all(this.values.map(async (value) => {
                    return {
                        label: value.extensionDescription.displayName || value.extensionDescription.identifier.value,
                        description: await value.url,
                        extensionDescription: value.extensionDescription
                    };
                }))).filter(item => item.description);
                if (actions.length) {
                    const action = await this.quickInputService.pick(actions, { placeHolder: nls.localize('pickRemoteExtension', "Select url to open") });
                    if (action) {
                        await this.takeAction(action.extensionDescription, action.description);
                    }
                }
            }
            await this.takeAction(this.values[0].extensionDescription, await this.values[0].url);
        }
    }
    class HelpItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, openerService, remoteExplorerService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService);
            this.openerService = openerService;
        }
        async takeAction(extensionDescription, url) {
            await this.openerService.open(uri_1.URI.parse(url), { allowCommands: true });
        }
    }
    class IssueReporterItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, commandService, remoteExplorerService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService);
            this.commandService = commandService;
        }
        async takeAction(extensionDescription) {
            await this.commandService.executeCommand('workbench.action.openIssueReporter', [extensionDescription.identifier.value]);
        }
    }
    let HelpPanel = class HelpPanel extends viewPane_1.ViewPane {
        constructor(viewModel, options, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, viewDescriptorService, openerService, quickInputService, commandService, remoteExplorerService, environmentService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.viewModel = viewModel;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
        }
        renderBody(container) {
            super.renderBody(container);
            container.classList.add('remote-help');
            const treeContainer = document.createElement('div');
            treeContainer.classList.add('remote-help-content');
            container.appendChild(treeContainer);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'RemoteHelp', treeContainer, new HelpTreeVirtualDelegate(), [new HelpTreeRenderer()], new HelpDataSource(), {
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        return item.label;
                    },
                    getWidgetAriaLabel: () => nls.localize('remotehelp', "Remote Help")
                }
            });
            const model = new HelpModel(this.viewModel, this.openerService, this.quickInputService, this.commandService, this.remoteExplorerService, this.environmentService);
            this.tree.setInput(model);
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, 75, true)(e => {
                var _a;
                (_a = e.element) === null || _a === void 0 ? void 0 : _a.handleClick();
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
    };
    HelpPanel.ID = '~remote.helpPanel';
    HelpPanel.TITLE = nls.localize('remote.help', "Help and feedback");
    HelpPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, opener_1.IOpenerService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, commands_1.ICommandService),
        __param(11, remoteExplorerService_1.IRemoteExplorerService),
        __param(12, environmentService_1.IWorkbenchEnvironmentService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService)
    ], HelpPanel);
    class HelpPanelDescriptor {
        constructor(viewModel) {
            this.id = HelpPanel.ID;
            this.name = HelpPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.group = 'help@50';
            this.order = -10;
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(HelpPanel, [viewModel]);
        }
    }
    let RemoteViewPaneContainer = class RemoteViewPaneContainer extends viewsViewlet_1.FilterViewPaneContainer {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, themeService, contextMenuService, extensionService, remoteExplorerService, environmentService, contextKeyService, viewDescriptorService) {
            super(remoteExplorer_1.VIEWLET_ID, remoteExplorerService.onDidChangeTargetType, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, viewDescriptorService);
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.contextKeyService = contextKeyService;
            this.helpPanelDescriptor = new HelpPanelDescriptor(this);
            this.helpInformation = [];
            this.hasSetSwitchForConnection = false;
            this.addConstantViewDescriptors([this.helpPanelDescriptor]);
            remoteHelpExtPoint.setHandler((extensions) => {
                let helpInformation = [];
                for (let extension of extensions) {
                    this._handleRemoteInfoExtensionPoint(extension, helpInformation);
                }
                this.helpInformation = helpInformation;
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                if (this.helpInformation.length) {
                    viewsRegistry.registerViews([this.helpPanelDescriptor], this.viewContainer);
                }
                else {
                    viewsRegistry.deregisterViews([this.helpPanelDescriptor], this.viewContainer);
                }
            });
        }
        _handleRemoteInfoExtensionPoint(extension, helpInformation) {
            if (!(0, extensions_1.isProposedApiEnabled)(extension.description, 'contribRemoteHelp')) {
                return;
            }
            if (!extension.value.documentation && !extension.value.feedback && !extension.value.getStarted && !extension.value.issues) {
                return;
            }
            helpInformation.push({
                extensionDescription: extension.description,
                getStarted: extension.value.getStarted,
                documentation: extension.value.documentation,
                feedback: extension.value.feedback,
                issues: extension.value.issues,
                remoteName: extension.value.remoteName
            });
        }
        getFilterOn(viewDescriptor) {
            return (0, types_1.isStringArray)(viewDescriptor.remoteAuthority) ? viewDescriptor.remoteAuthority[0] : viewDescriptor.remoteAuthority;
        }
        setFilter(viewDescriptor) {
            this.remoteExplorerService.targetType = (0, types_1.isStringArray)(viewDescriptor.remoteAuthority) ? viewDescriptor.remoteAuthority : [viewDescriptor.remoteAuthority];
        }
        getActionViewItem(action) {
            if (action.id === explorerViewItems_1.SwitchRemoteAction.ID) {
                const optionItems = explorerViewItems_1.SwitchRemoteViewItem.createOptionItems(platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getViews(this.viewContainer), this.contextKeyService);
                const item = this.instantiationService.createInstance(explorerViewItems_1.SwitchRemoteViewItem, action, optionItems);
                if (!this.hasSetSwitchForConnection) {
                    this.hasSetSwitchForConnection = item.setSelectionForConnection();
                }
                else {
                    item.setSelection();
                }
                return item;
            }
            return super.getActionViewItem(action);
        }
        getTitle() {
            const title = nls.localize('remote.explorer', "Remote Explorer");
            return title;
        }
    };
    RemoteViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, extensions_1.IExtensionService),
        __param(9, remoteExplorerService_1.IRemoteExplorerService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, views_1.IViewDescriptorService)
    ], RemoteViewPaneContainer);
    exports.RemoteViewPaneContainer = RemoteViewPaneContainer;
    (0, actions_1.registerAction2)(explorerViewItems_1.SwitchRemoteAction);
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: remoteExplorer_1.VIEWLET_ID,
        title: nls.localize('remote.explorer', "Remote Explorer"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(RemoteViewPaneContainer),
        hideIfEmpty: true,
        viewOrderDelegate: {
            getOrder: (group) => {
                if (!group) {
                    return;
                }
                let matches = /^targets@(\d+)$/.exec(group);
                if (matches) {
                    return -1000;
                }
                matches = /^details(@(\d+))?$/.exec(group);
                if (matches) {
                    return -500 + Number(matches[2]);
                }
                matches = /^help(@(\d+))?$/.exec(group);
                if (matches) {
                    return -10;
                }
                return;
            }
        },
        icon: icons.remoteExplorerViewIcon,
        order: 4
    }, 0 /* ViewContainerLocation.Sidebar */);
    let RemoteMarkers = class RemoteMarkers {
        constructor(remoteAgentService, timerService) {
            remoteAgentService.getEnvironment().then(remoteEnv => {
                if (remoteEnv) {
                    timerService.setPerformanceMarks('server', remoteEnv.marks);
                }
            });
        }
    };
    RemoteMarkers = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, timerService_1.ITimerService)
    ], RemoteMarkers);
    exports.RemoteMarkers = RemoteMarkers;
    class VisibleProgress {
        constructor(progressService, location, initialReport, buttons, onDidCancel) {
            this.location = location;
            this._isDisposed = false;
            this._lastReport = initialReport;
            this._currentProgressPromiseResolve = null;
            this._currentProgress = null;
            this._currentTimer = null;
            const promise = new Promise((resolve) => this._currentProgressPromiseResolve = resolve);
            progressService.withProgress({ location: location, buttons: buttons }, (progress) => { if (!this._isDisposed) {
                this._currentProgress = progress;
            } return promise; }, (choice) => onDidCancel(choice, this._lastReport));
            if (this._lastReport) {
                this.report();
            }
        }
        get lastReport() {
            return this._lastReport;
        }
        dispose() {
            this._isDisposed = true;
            if (this._currentProgressPromiseResolve) {
                this._currentProgressPromiseResolve();
                this._currentProgressPromiseResolve = null;
            }
            this._currentProgress = null;
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
        report(message) {
            if (message) {
                this._lastReport = message;
            }
            if (this._lastReport && this._currentProgress) {
                this._currentProgress.report({ message: this._lastReport });
            }
        }
        startTimer(completionTime) {
            this.stopTimer();
            this._currentTimer = new ReconnectionTimer(this, completionTime);
        }
        stopTimer() {
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
    }
    class ReconnectionTimer {
        constructor(parent, completionTime) {
            this._parent = parent;
            this._completionTime = completionTime;
            this._token = setInterval(() => this._render(), 1000);
            this._render();
        }
        dispose() {
            clearInterval(this._token);
        }
        _render() {
            const remainingTimeMs = this._completionTime - Date.now();
            if (remainingTimeMs < 0) {
                return;
            }
            const remainingTime = Math.ceil(remainingTimeMs / 1000);
            if (remainingTime === 1) {
                this._parent.report(nls.localize('reconnectionWaitOne', "Attempting to reconnect in {0} second...", remainingTime));
            }
            else {
                this._parent.report(nls.localize('reconnectionWaitMany', "Attempting to reconnect in {0} seconds...", remainingTime));
            }
        }
    }
    /**
     * The time when a prompt is shown to the user
     */
    const DISCONNECT_PROMPT_TIME = 40 * 1000; // 40 seconds
    let RemoteAgentConnectionStatusListener = class RemoteAgentConnectionStatusListener extends lifecycle_1.Disposable {
        constructor(remoteAgentService, progressService, dialogService, commandService, quickInputService, logService, environmentService, telemetryService) {
            super();
            this._reloadWindowShown = false;
            const connection = remoteAgentService.getConnection();
            if (connection) {
                let quickInputVisible = false;
                quickInputService.onShow(() => quickInputVisible = true);
                quickInputService.onHide(() => quickInputVisible = false);
                let visibleProgress = null;
                let reconnectWaitEvent = null;
                let disposableListener = null;
                function showProgress(location, buttons, initialReport = null) {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                    if (!location) {
                        location = quickInputVisible ? 15 /* ProgressLocation.Notification */ : 20 /* ProgressLocation.Dialog */;
                    }
                    return new VisibleProgress(progressService, location, initialReport, buttons.map(button => button.label), (choice, lastReport) => {
                        // Handle choice from dialog
                        if (typeof choice !== 'undefined' && buttons[choice]) {
                            buttons[choice].callback();
                        }
                        else {
                            if (location === 20 /* ProgressLocation.Dialog */) {
                                visibleProgress = showProgress(15 /* ProgressLocation.Notification */, buttons, lastReport);
                            }
                            else {
                                hideProgress();
                            }
                        }
                    });
                }
                function hideProgress() {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                }
                let reconnectionToken = '';
                let lastIncomingDataTime = 0;
                let reconnectionAttempts = 0;
                const reconnectButton = {
                    label: nls.localize('reconnectNow', "Reconnect Now"),
                    callback: () => {
                        if (reconnectWaitEvent) {
                            reconnectWaitEvent.skipWait();
                        }
                    }
                };
                const reloadButton = {
                    label: nls.localize('reloadWindow', "Reload Window"),
                    callback: () => {
                        telemetryService.publicLog2('remoteReconnectionReload', {
                            remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                            reconnectionToken: reconnectionToken,
                            millisSinceLastIncomingData: Date.now() - lastIncomingDataTime,
                            attempt: reconnectionAttempts
                        });
                        commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                    }
                };
                // Possible state transitions:
                // ConnectionGain      -> ConnectionLost
                // ConnectionLost      -> ReconnectionWait, ReconnectionRunning
                // ReconnectionWait    -> ReconnectionRunning
                // ReconnectionRunning -> ConnectionGain, ReconnectionPermanentFailure
                connection.onDidStateChange((e) => {
                    if (visibleProgress) {
                        visibleProgress.stopTimer();
                    }
                    if (disposableListener) {
                        disposableListener.dispose();
                        disposableListener = null;
                    }
                    switch (e.type) {
                        case 0 /* PersistentConnectionEventType.ConnectionLost */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = 0;
                            telemetryService.publicLog2('remoteConnectionLost', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                            });
                            if (visibleProgress || e.millisSinceLastIncomingData > DISCONNECT_PROMPT_TIME) {
                                if (!visibleProgress) {
                                    visibleProgress = showProgress(null, [reconnectButton, reloadButton]);
                                }
                                visibleProgress.report(nls.localize('connectionLost', "Connection Lost"));
                            }
                            break;
                        case 1 /* PersistentConnectionEventType.ReconnectionWait */:
                            if (visibleProgress) {
                                reconnectWaitEvent = e;
                                visibleProgress = showProgress(null, [reconnectButton, reloadButton]);
                                visibleProgress.startTimer(Date.now() + 1000 * e.durationSeconds);
                            }
                            break;
                        case 2 /* PersistentConnectionEventType.ReconnectionRunning */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteReconnectionRunning', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt
                            });
                            if (visibleProgress || e.millisSinceLastIncomingData > DISCONNECT_PROMPT_TIME) {
                                visibleProgress = showProgress(null, [reloadButton]);
                                visibleProgress.report(nls.localize('reconnectionRunning', "Disconnected. Attempting to reconnect..."));
                                // Register to listen for quick input is opened
                                disposableListener = quickInputService.onShow(() => {
                                    // Need to move from dialog if being shown and user needs to type in a prompt
                                    if (visibleProgress && visibleProgress.location === 20 /* ProgressLocation.Dialog */) {
                                        visibleProgress = showProgress(15 /* ProgressLocation.Notification */, [reloadButton], visibleProgress.lastReport);
                                    }
                                });
                            }
                            break;
                        case 3 /* PersistentConnectionEventType.ReconnectionPermanentFailure */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteReconnectionPermanentFailure', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt,
                                handled: e.handled
                            });
                            hideProgress();
                            if (e.handled) {
                                logService.info(`Error handled: Not showing a notification for the error.`);
                                console.log(`Error handled: Not showing a notification for the error.`);
                            }
                            else if (!this._reloadWindowShown) {
                                this._reloadWindowShown = true;
                                dialogService.show(severity_1.default.Error, nls.localize('reconnectionPermanentFailure', "Cannot reconnect. Please reload the window."), [nls.localize('reloadWindow', "Reload Window"), nls.localize('cancel', "Cancel")], { cancelId: 1, custom: true }).then(result => {
                                    // Reload the window
                                    if (result.choice === 0) {
                                        commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                                    }
                                });
                            }
                            break;
                        case 4 /* PersistentConnectionEventType.ConnectionGain */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteConnectionGain', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt
                            });
                            hideProgress();
                            break;
                    }
                });
            }
        }
    };
    RemoteAgentConnectionStatusListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, progress_1.IProgressService),
        __param(2, dialogs_1.IDialogService),
        __param(3, commands_1.ICommandService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, log_1.ILogService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, telemetry_1.ITelemetryService)
    ], RemoteAgentConnectionStatusListener);
    exports.RemoteAgentConnectionStatusListener = RemoteAgentConnectionStatusListener;
});
//# sourceMappingURL=remote.js.map