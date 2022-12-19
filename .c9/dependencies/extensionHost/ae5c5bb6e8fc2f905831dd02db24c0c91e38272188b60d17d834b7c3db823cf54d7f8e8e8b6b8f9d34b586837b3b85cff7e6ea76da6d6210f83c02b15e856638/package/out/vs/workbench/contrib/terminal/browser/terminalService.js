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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/contrib/find/browser/findState", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/notification/common/notification", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/terminal/browser/terminalProfileQuickpick", "vs/platform/log/common/log", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/platform/workspace/common/workspace", "vs/platform/commands/common/commands"], function (require, exports, dom, async_1, decorators_1, event_1, lifecycle_1, network_1, platform_1, uri_1, findState_1, nls, contextkey_1, dialogs_1, instantiation_1, terminal_1, colorRegistry_1, iconRegistry_1, theme_1, themeService_1, contextkeys_1, views_1, terminal_2, terminalConfigHelper_1, terminalIcon_1, terminalUri_1, terminal_3, terminalContextKey_1, terminalStrings_1, environmentService_1, lifecycle_2, remoteAgentService_1, editorService_1, editorGroupsService_1, notification_1, extensions_1, terminalProfileQuickpick_1, log_1, terminalEditorInput_1, terminalActions_1, workspace_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalService = void 0;
    let TerminalService = class TerminalService {
        constructor(_contextKeyService, lifecycleService, _logService, _dialogService, _instantiationService, _remoteAgentService, _viewsService, _environmentService, _terminalEditorService, _terminalGroupService, _terminalInstanceService, _editorGroupsService, _terminalProfileService, _extensionService, _notificationService, _workspaceContextService, _commandService) {
            this._contextKeyService = _contextKeyService;
            this._logService = _logService;
            this._dialogService = _dialogService;
            this._instantiationService = _instantiationService;
            this._remoteAgentService = _remoteAgentService;
            this._viewsService = _viewsService;
            this._environmentService = _environmentService;
            this._terminalEditorService = _terminalEditorService;
            this._terminalGroupService = _terminalGroupService;
            this._terminalInstanceService = _terminalInstanceService;
            this._editorGroupsService = _editorGroupsService;
            this._terminalProfileService = _terminalProfileService;
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._workspaceContextService = _workspaceContextService;
            this._commandService = _commandService;
            this._hostActiveTerminals = new Map();
            this._escapeSequenceLoggingEnabled = false;
            this._isShuttingDown = false;
            this._backgroundedTerminalInstances = [];
            this._backgroundedTerminalDisposables = new Map();
            this._findState = new findState_1.FindReplaceState();
            this._linkProviders = new Set();
            this._linkProviderDisposables = new Map();
            this._connectionState = 0 /* TerminalConnectionState.Connecting */;
            this._onDidChangeActiveGroup = new event_1.Emitter();
            this._onDidCreateInstance = new event_1.Emitter();
            this._onDidDisposeInstance = new event_1.Emitter();
            this._onDidFocusInstance = new event_1.Emitter();
            this._onDidReceiveProcessId = new event_1.Emitter();
            this._onDidReceiveInstanceLinks = new event_1.Emitter();
            this._onDidRequestStartExtensionTerminal = new event_1.Emitter();
            this._onDidChangeInstanceDimensions = new event_1.Emitter();
            this._onDidMaxiumumDimensionsChange = new event_1.Emitter();
            this._onDidChangeInstanceCapability = new event_1.Emitter();
            this._onDidChangeInstances = new event_1.Emitter();
            this._onDidChangeInstanceTitle = new event_1.Emitter();
            this._onDidChangeInstanceIcon = new event_1.Emitter();
            this._onDidChangeInstanceColor = new event_1.Emitter();
            this._onDidChangeActiveInstance = new event_1.Emitter();
            this._onDidChangeInstancePrimaryStatus = new event_1.Emitter();
            this._onDidInputInstanceData = new event_1.Emitter();
            this._onDidDisposeGroup = new event_1.Emitter();
            this._onDidChangeGroups = new event_1.Emitter();
            this._onDidRegisterProcessSupport = new event_1.Emitter();
            this._onDidChangeConnectionState = new event_1.Emitter();
            this._onDidRequestHideFindWidget = new event_1.Emitter();
            this._configHelper = this._instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper);
            // the below avoids having to poll routinely.
            // we update detected profiles when an instance is created so that,
            // for example, we detect if you've installed a pwsh
            this.onDidCreateInstance(() => this._terminalProfileService.refreshAvailableProfiles());
            this._forwardInstanceHostEvents(this._terminalGroupService);
            this._forwardInstanceHostEvents(this._terminalEditorService);
            this._terminalGroupService.onDidChangeActiveGroup(this._onDidChangeActiveGroup.fire, this._onDidChangeActiveGroup);
            this._terminalInstanceService.onDidCreateInstance(instance => {
                instance.setEscapeSequenceLogging(this._escapeSequenceLoggingEnabled);
                this._initInstanceListeners(instance);
                this._onDidCreateInstance.fire(instance);
            });
            this.onDidReceiveInstanceLinks(instance => this._setInstanceLinkProviders(instance));
            // Hide the panel if there are no more instances, provided that VS Code is not shutting
            // down. When shutting down the panel is locked in place so that it is restored upon next
            // launch.
            this._terminalGroupService.onDidChangeActiveInstance(instance => {
                if (!instance && !this._isShuttingDown) {
                    this._terminalGroupService.hidePanel();
                }
                if (instance === null || instance === void 0 ? void 0 : instance.shellType) {
                    this._terminalShellTypeContextKey.set(instance.shellType.toString());
                }
                else if (!instance) {
                    this._terminalShellTypeContextKey.reset();
                }
            });
            this._handleInstanceContextKeys();
            this._terminalShellTypeContextKey = terminalContextKey_1.TerminalContextKeys.shellType.bindTo(this._contextKeyService);
            this._processSupportContextKey = terminalContextKey_1.TerminalContextKeys.processSupported.bindTo(this._contextKeyService);
            this._processSupportContextKey.set(!platform_1.isWeb || this._remoteAgentService.getConnection() !== null);
            this._terminalHasBeenCreated = terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated.bindTo(this._contextKeyService);
            this._terminalCountContextKey = terminalContextKey_1.TerminalContextKeys.count.bindTo(this._contextKeyService);
            this._terminalEditorActive = terminalContextKey_1.TerminalContextKeys.terminalEditorActive.bindTo(this._contextKeyService);
            this.onDidChangeActiveInstance(instance => {
                this._terminalEditorActive.set(!!(instance === null || instance === void 0 ? void 0 : instance.target) && instance.target === terminal_1.TerminalLocation.Editor);
            });
            lifecycleService.onBeforeShutdown(async (e) => e.veto(this._onBeforeShutdown(e.reason), 'veto.terminal'));
            lifecycleService.onWillShutdown(e => this._onWillShutdown(e));
            // Create async as the class depends on `this`
            (0, async_1.timeout)(0).then(() => this._instantiationService.createInstance(TerminalEditorStyle, document.head));
        }
        get isProcessSupportRegistered() { return !!this._processSupportContextKey.get(); }
        get connectionState() { return this._connectionState; }
        get configHelper() { return this._configHelper; }
        get instances() {
            return this._terminalGroupService.instances.concat(this._terminalEditorService.instances);
        }
        get defaultLocation() { return this.configHelper.config.defaultLocation === "editor" /* TerminalLocationString.Editor */ ? terminal_1.TerminalLocation.Editor : terminal_1.TerminalLocation.Panel; }
        get activeInstance() {
            // Check if either an editor or panel terminal has focus and return that, regardless of the
            // value of _activeInstance. This avoids terminals created in the panel for example stealing
            // the active status even when it's not focused.
            for (const activeHostTerminal of this._hostActiveTerminals.values()) {
                if (activeHostTerminal === null || activeHostTerminal === void 0 ? void 0 : activeHostTerminal.hasFocus) {
                    return activeHostTerminal;
                }
            }
            // Fallback to the last recorded active terminal if neither have focus
            return this._activeInstance;
        }
        get onDidChangeActiveGroup() { return this._onDidChangeActiveGroup.event; }
        get onDidCreateInstance() { return this._onDidCreateInstance.event; }
        get onDidDisposeInstance() { return this._onDidDisposeInstance.event; }
        get onDidFocusInstance() { return this._onDidFocusInstance.event; }
        get onDidReceiveProcessId() { return this._onDidReceiveProcessId.event; }
        get onDidReceiveInstanceLinks() { return this._onDidReceiveInstanceLinks.event; }
        get onDidRequestStartExtensionTerminal() { return this._onDidRequestStartExtensionTerminal.event; }
        get onDidChangeInstanceDimensions() { return this._onDidChangeInstanceDimensions.event; }
        get onDidMaximumDimensionsChange() { return this._onDidMaxiumumDimensionsChange.event; }
        get onDidChangeInstanceCapability() { return this._onDidChangeInstanceCapability.event; }
        get onDidChangeInstances() { return this._onDidChangeInstances.event; }
        get onDidChangeInstanceTitle() { return this._onDidChangeInstanceTitle.event; }
        get onDidChangeInstanceIcon() { return this._onDidChangeInstanceIcon.event; }
        get onDidChangeInstanceColor() { return this._onDidChangeInstanceColor.event; }
        get onDidChangeActiveInstance() { return this._onDidChangeActiveInstance.event; }
        get onDidChangeInstancePrimaryStatus() { return this._onDidChangeInstancePrimaryStatus.event; }
        get onDidInputInstanceData() { return this._onDidInputInstanceData.event; }
        get onDidDisposeGroup() { return this._onDidDisposeGroup.event; }
        get onDidChangeGroups() { return this._onDidChangeGroups.event; }
        get onDidRegisterProcessSupport() { return this._onDidRegisterProcessSupport.event; }
        get onDidChangeConnectionState() { return this._onDidChangeConnectionState.event; }
        get onDidRequestHideFindWidget() { return this._onDidRequestHideFindWidget.event; }
        async showProfileQuickPick(type, cwd) {
            var _a, _b;
            const quickPick = this._instantiationService.createInstance(terminalProfileQuickpick_1.TerminalProfileQuickpick);
            const result = await quickPick.showAndGetResult(type);
            if (!result) {
                return;
            }
            if (typeof result === 'string') {
                return;
            }
            let keyMods = result.keyMods;
            if (type === 'createInstance') {
                const activeInstance = this.getDefaultInstanceHost().activeInstance;
                let instance;
                if (result.config && 'id' in (result === null || result === void 0 ? void 0 : result.config)) {
                    await this.createContributedTerminalProfile(result.config.extensionIdentifier, result.config.id, {
                        icon: (_a = result.config.options) === null || _a === void 0 ? void 0 : _a.icon,
                        color: (_b = result.config.options) === null || _b === void 0 ? void 0 : _b.color,
                        location: !!((keyMods === null || keyMods === void 0 ? void 0 : keyMods.alt) && activeInstance) ? { splitActiveTerminal: true } : this.defaultLocation
                    });
                    return;
                }
                else if (result.config && 'profileName' in result.config) {
                    if ((keyMods === null || keyMods === void 0 ? void 0 : keyMods.alt) && activeInstance) {
                        // create split, only valid if there's an active instance
                        instance = await this.createTerminal({ location: { parentTerminal: activeInstance }, config: result.config, cwd });
                    }
                    else {
                        instance = await this.createTerminal({ location: this.defaultLocation, config: result.config, cwd });
                    }
                }
                if (instance && this.defaultLocation !== terminal_1.TerminalLocation.Editor) {
                    this._terminalGroupService.showPanel(true);
                    this.setActiveInstance(instance);
                    return instance;
                }
            }
            return undefined;
        }
        handleNewRegisteredBackend(backend) {
            if (backend.remoteAuthority === this._environmentService.remoteAuthority) {
                this._primaryBackend = backend;
                const enableTerminalReconnection = this.configHelper.config.enablePersistentSessions;
                // Connect to the extension host if it's there, set the connection state to connected when
                // it's done. This should happen even when there is no extension host.
                this._connectionState = 0 /* TerminalConnectionState.Connecting */;
                const isPersistentRemote = !!this._environmentService.remoteAuthority && enableTerminalReconnection;
                if (isPersistentRemote) {
                    this._remoteTerminalsInitPromise = this._reconnectToRemoteTerminals();
                }
                else if (enableTerminalReconnection) {
                    this._localTerminalsInitPromise = this._reconnectToLocalTerminals();
                }
                else {
                    this._connectionState = 1 /* TerminalConnectionState.Connected */;
                }
                backend.onDidRequestDetach(async (e) => {
                    var _a, _b, _c;
                    const instanceToDetach = this.getInstanceFromResource((0, terminalUri_1.getTerminalUri)(e.workspaceId, e.instanceId));
                    if (instanceToDetach) {
                        const persistentProcessId = instanceToDetach === null || instanceToDetach === void 0 ? void 0 : instanceToDetach.persistentProcessId;
                        if (persistentProcessId && !instanceToDetach.shellLaunchConfig.isFeatureTerminal && !instanceToDetach.shellLaunchConfig.customPtyImplementation) {
                            if (instanceToDetach.target === terminal_1.TerminalLocation.Editor) {
                                this._terminalEditorService.detachInstance(instanceToDetach);
                            }
                            else {
                                (_a = this._terminalGroupService.getGroupForInstance(instanceToDetach)) === null || _a === void 0 ? void 0 : _a.removeInstance(instanceToDetach);
                            }
                            await instanceToDetach.detachFromProcess();
                            await ((_b = this._primaryBackend) === null || _b === void 0 ? void 0 : _b.acceptDetachInstanceReply(e.requestId, persistentProcessId));
                        }
                        else {
                            // will get rejected without a persistentProcessId to attach to
                            await ((_c = this._primaryBackend) === null || _c === void 0 ? void 0 : _c.acceptDetachInstanceReply(e.requestId, undefined));
                        }
                    }
                });
            }
        }
        getPrimaryBackend() {
            return this._primaryBackend;
        }
        _forwardInstanceHostEvents(host) {
            host.onDidChangeInstances(this._onDidChangeInstances.fire, this._onDidChangeInstances);
            host.onDidDisposeInstance(this._onDidDisposeInstance.fire, this._onDidDisposeInstance);
            host.onDidChangeActiveInstance(instance => this._evaluateActiveInstance(host, instance));
            host.onDidFocusInstance(instance => {
                this._onDidFocusInstance.fire(instance);
                this._evaluateActiveInstance(host, instance);
            });
            host.onDidChangeInstanceCapability((instance) => {
                this._onDidChangeInstanceCapability.fire(instance);
            });
            this._hostActiveTerminals.set(host, undefined);
        }
        _evaluateActiveInstance(host, instance) {
            // Track the latest active terminal for each host so that when one becomes undefined, the
            // TerminalService's active terminal is set to the last active terminal from the other host.
            // This means if the last terminal editor is closed such that it becomes undefined, the last
            // active group's terminal will be used as the active terminal if available.
            this._hostActiveTerminals.set(host, instance);
            if (instance === undefined) {
                for (const active of this._hostActiveTerminals.values()) {
                    if (active) {
                        instance = active;
                    }
                }
            }
            this._activeInstance = instance;
            this._onDidChangeActiveInstance.fire(instance);
        }
        setActiveInstance(value) {
            // If this was a hideFromUser terminal created by the API this was triggered by show,
            // in which case we need to create the terminal group
            if (value.shellLaunchConfig.hideFromUser) {
                this._showBackgroundTerminal(value);
            }
            if (value.target === terminal_1.TerminalLocation.Editor) {
                this._terminalEditorService.setActiveInstance(value);
            }
            else {
                this._terminalGroupService.setActiveInstance(value);
            }
        }
        async createContributedTerminalProfile(extensionIdentifier, id, options) {
            var _a;
            await this._extensionService.activateByEvent(`onTerminalProfile:${id}`);
            const profileProvider = this._terminalProfileService.getContributedProfileProvider(extensionIdentifier, id);
            if (!profileProvider) {
                this._notificationService.error(`No terminal profile provider registered for id "${id}"`);
                return;
            }
            try {
                await profileProvider.createContributedTerminalProfile(options);
                this._terminalGroupService.setActiveInstanceByIndex(this._terminalGroupService.instances.length - 1);
                await ((_a = this._terminalGroupService.activeInstance) === null || _a === void 0 ? void 0 : _a.focusWhenReady());
            }
            catch (e) {
                this._notificationService.error(e.message);
            }
        }
        async safeDisposeTerminal(instance) {
            // Confirm on kill in the editor is handled by the editor input
            if (instance.target !== terminal_1.TerminalLocation.Editor &&
                instance.hasChildProcesses &&
                (this.configHelper.config.confirmOnKill === 'panel' || this.configHelper.config.confirmOnKill === 'always')) {
                const veto = await this._showTerminalCloseConfirmation(true);
                if (veto) {
                    return;
                }
            }
            return new Promise(r => {
                instance.onExit(() => r());
                instance.dispose();
            });
        }
        _setConnected() {
            this._connectionState = 1 /* TerminalConnectionState.Connected */;
            this._onDidChangeConnectionState.fire();
        }
        async _reconnectToRemoteTerminals() {
            const remoteAuthority = this._environmentService.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            const backend = this._terminalInstanceService.getBackend(remoteAuthority);
            if (!backend) {
                return;
            }
            const layoutInfo = await backend.getTerminalLayoutInfo();
            backend.reduceConnectionGraceTime();
            await this._recreateTerminalGroups(layoutInfo);
            // now that terminals have been restored,
            // attach listeners to update remote when terminals are changed
            this._attachProcessLayoutListeners();
        }
        async _reconnectToLocalTerminals() {
            const localBackend = this._terminalInstanceService.getBackend();
            if (!localBackend) {
                return;
            }
            const layoutInfo = await localBackend.getTerminalLayoutInfo();
            if (layoutInfo && layoutInfo.tabs.length > 0) {
                await this._recreateTerminalGroups(layoutInfo);
            }
            // now that terminals have been restored,
            // attach listeners to update local state when terminals are changed
            this._attachProcessLayoutListeners();
        }
        async _recreateTerminalGroups(layoutInfo) {
            let reconnectCounter = 0;
            let activeGroup;
            if (layoutInfo) {
                for (const groupLayout of layoutInfo.tabs) {
                    const terminalLayouts = groupLayout.terminals.filter(t => t.terminal && t.terminal.isOrphan);
                    if (terminalLayouts.length) {
                        reconnectCounter += terminalLayouts.length;
                        let terminalInstance;
                        let group;
                        for (const terminalLayout of terminalLayouts) {
                            if (!terminalInstance) {
                                // create group and terminal
                                terminalInstance = await this.createTerminal({
                                    config: { attachPersistentProcess: terminalLayout.terminal },
                                    location: terminal_1.TerminalLocation.Panel
                                });
                                group = this._terminalGroupService.getGroupForInstance(terminalInstance);
                                if (groupLayout.isActive) {
                                    activeGroup = group;
                                }
                            }
                            else {
                                // add split terminals to this group
                                terminalInstance = await this.createTerminal({ config: { attachPersistentProcess: terminalLayout.terminal }, location: { parentTerminal: terminalInstance } });
                            }
                        }
                        const activeInstance = this.instances.find(t => {
                            var _a;
                            return ((_a = t.shellLaunchConfig.attachPersistentProcess) === null || _a === void 0 ? void 0 : _a.id) === groupLayout.activePersistentProcessId;
                        });
                        if (activeInstance) {
                            this.setActiveInstance(activeInstance);
                        }
                        group === null || group === void 0 ? void 0 : group.resizePanes(groupLayout.terminals.map(terminal => terminal.relativeSize));
                    }
                }
                if (layoutInfo.tabs.length) {
                    this._terminalGroupService.activeGroup = activeGroup;
                }
            }
            return reconnectCounter;
        }
        async toggleEscapeSequenceLogging() {
            if (this.instances.length === 0) {
                return;
            }
            this._escapeSequenceLoggingEnabled = await this.instances[0].toggleEscapeSequenceLogging();
            for (let i = 1; i < this.instances.length; i++) {
                this.instances[i].setEscapeSequenceLogging(this._escapeSequenceLoggingEnabled);
            }
            await this._toggleDevTools(this._escapeSequenceLoggingEnabled);
        }
        _attachProcessLayoutListeners() {
            this.onDidChangeActiveGroup(() => this._saveState());
            this.onDidChangeActiveInstance(() => this._saveState());
            this.onDidChangeInstances(() => this._saveState());
            // The state must be updated when the terminal is relaunched, otherwise the persistent
            // terminal ID will be stale and the process will be leaked.
            this.onDidReceiveProcessId(() => this._saveState());
            this.onDidChangeInstanceTitle(instance => this._updateTitle(instance));
            this.onDidChangeInstanceIcon(instance => this._updateIcon(instance));
        }
        _handleInstanceContextKeys() {
            const terminalIsOpenContext = terminalContextKey_1.TerminalContextKeys.isOpen.bindTo(this._contextKeyService);
            const updateTerminalContextKeys = () => {
                terminalIsOpenContext.set(this.instances.length > 0);
                this._terminalCountContextKey.set(this.instances.length);
            };
            this.onDidChangeInstances(() => updateTerminalContextKeys());
        }
        async getActiveOrCreateInstance() {
            return this.activeInstance || this.createTerminal();
        }
        setEditable(instance, data) {
            var _a;
            if (!data) {
                this._editable = undefined;
            }
            else {
                this._editable = { instance: instance, data };
            }
            const pane = this._viewsService.getActiveViewWithId(terminal_3.TERMINAL_VIEW_ID);
            const isEditing = this.isEditable(instance);
            (_a = pane === null || pane === void 0 ? void 0 : pane.terminalTabbedView) === null || _a === void 0 ? void 0 : _a.setEditable(isEditing);
        }
        isEditable(instance) {
            return !!this._editable && (this._editable.instance === instance || !instance);
        }
        getEditableData(instance) {
            return this._editable && this._editable.instance === instance ? this._editable.data : undefined;
        }
        requestStartExtensionTerminal(proxy, cols, rows) {
            // The initial request came from the extension host, no need to wait for it
            return new Promise(callback => {
                this._onDidRequestStartExtensionTerminal.fire({ proxy, cols, rows, callback });
            });
        }
        _onBeforeShutdown(reason) {
            // Never veto on web as this would block all windows from being closed. This disables
            // process revive as we can't handle it on shutdown.
            if (platform_1.isWeb) {
                this._isShuttingDown = true;
                return false;
            }
            return this._onBeforeShutdownAsync(reason);
        }
        async _onBeforeShutdownAsync(reason) {
            var _a, _b;
            if (this.instances.length === 0) {
                // No terminal instances, don't veto
                return false;
            }
            // Persist terminal _buffer state_, note that even if this happens the dirty terminal prompt
            // still shows as that cannot be revived
            try {
                this._shutdownWindowCount = await ((_a = this._nativeDelegate) === null || _a === void 0 ? void 0 : _a.getWindowCount());
                const shouldReviveProcesses = this._shouldReviveProcesses(reason);
                if (shouldReviveProcesses) {
                    // Attempt to persist the terminal state but only allow 2000ms as we can't block
                    // shutdown. This can happen when in a remote workspace but the other side has been
                    // suspended and is in the process of reconnecting, the message will be put in a
                    // queue in this case for when the connection is back up and running. Aborting the
                    // process is preferable in this case.
                    await Promise.race([
                        (_b = this._primaryBackend) === null || _b === void 0 ? void 0 : _b.persistTerminalState(),
                        (0, async_1.timeout)(2000)
                    ]);
                }
                // Persist terminal _processes_
                const shouldPersistProcesses = this._configHelper.config.enablePersistentSessions && reason === 3 /* ShutdownReason.RELOAD */;
                if (!shouldPersistProcesses) {
                    const hasDirtyInstances = ((this.configHelper.config.confirmOnExit === 'always' && this.instances.length > 0) ||
                        (this.configHelper.config.confirmOnExit === 'hasChildProcesses' && this.instances.some(e => e.hasChildProcesses)));
                    if (hasDirtyInstances) {
                        return this._onBeforeShutdownConfirmation(reason);
                    }
                }
            }
            catch (err) {
                // Swallow as exceptions should not cause a veto to prevent shutdown
                this._logService.warn('Exception occurred during terminal shutdown', err);
            }
            this._isShuttingDown = true;
            return false;
        }
        setNativeDelegate(nativeDelegate) {
            this._nativeDelegate = nativeDelegate;
        }
        async _toggleDevTools(open) {
            var _a, _b;
            if (open) {
                (_a = this._nativeDelegate) === null || _a === void 0 ? void 0 : _a.openDevTools();
            }
            else {
                (_b = this._nativeDelegate) === null || _b === void 0 ? void 0 : _b.toggleDevTools();
            }
        }
        _shouldReviveProcesses(reason) {
            if (!this._configHelper.config.enablePersistentSessions) {
                return false;
            }
            switch (this.configHelper.config.persistentSessionReviveProcess) {
                case 'onExit': {
                    // Allow on close if it's the last window on Windows or Linux
                    if (reason === 1 /* ShutdownReason.CLOSE */ && (this._shutdownWindowCount === 1 && !platform_1.isMacintosh)) {
                        return true;
                    }
                    return reason === 4 /* ShutdownReason.LOAD */ || reason === 2 /* ShutdownReason.QUIT */;
                }
                case 'onExitAndWindowClose': return reason !== 3 /* ShutdownReason.RELOAD */;
                default: return false;
            }
        }
        async _onBeforeShutdownConfirmation(reason) {
            // veto if configured to show confirmation and the user chose not to exit
            const veto = await this._showTerminalCloseConfirmation();
            if (!veto) {
                this._isShuttingDown = true;
            }
            return veto;
        }
        _onWillShutdown(e) {
            var _a;
            // Don't touch processes if the shutdown was a result of reload as they will be reattached
            const shouldPersistTerminals = this._configHelper.config.enablePersistentSessions && e.reason === 3 /* ShutdownReason.RELOAD */;
            if (shouldPersistTerminals) {
                for (const instance of this.instances) {
                    instance.detachFromProcess();
                }
                return;
            }
            // Force dispose of all terminal instances
            for (const instance of this.instances) {
                instance.dispose();
            }
            // Clear terminal layout info only when not persisting
            if (!this._shouldReviveProcesses(e.reason)) {
                (_a = this._primaryBackend) === null || _a === void 0 ? void 0 : _a.setTerminalLayoutInfo(undefined);
            }
        }
        getFindState() {
            return this._findState;
        }
        _saveState() {
            var _a;
            // Avoid saving state when shutting down as that would override process state to be revived
            if (this._isShuttingDown) {
                return;
            }
            if (!this.configHelper.config.enablePersistentSessions) {
                return;
            }
            const tabs = this._terminalGroupService.groups.map(g => g.getLayoutInfo(g === this._terminalGroupService.activeGroup));
            const state = { tabs };
            (_a = this._primaryBackend) === null || _a === void 0 ? void 0 : _a.setTerminalLayoutInfo(state);
        }
        _updateTitle(instance) {
            var _a, _b;
            if (!this.configHelper.config.enablePersistentSessions || !instance || !instance.persistentProcessId || !instance.title || instance.isDisposed) {
                return;
            }
            if (instance.staticTitle) {
                (_a = this._primaryBackend) === null || _a === void 0 ? void 0 : _a.updateTitle(instance.persistentProcessId, instance.staticTitle, terminal_1.TitleEventSource.Api);
            }
            else {
                (_b = this._primaryBackend) === null || _b === void 0 ? void 0 : _b.updateTitle(instance.persistentProcessId, instance.title, instance.titleSource);
            }
        }
        _updateIcon(instance) {
            var _a;
            if (!this.configHelper.config.enablePersistentSessions || !instance || !instance.persistentProcessId || !instance.icon || instance.isDisposed) {
                return;
            }
            (_a = this._primaryBackend) === null || _a === void 0 ? void 0 : _a.updateIcon(instance.persistentProcessId, instance.icon, instance.color);
        }
        refreshActiveGroup() {
            this._onDidChangeActiveGroup.fire(this._terminalGroupService.activeGroup);
        }
        doWithActiveInstance(callback) {
            const instance = this.activeInstance;
            if (instance) {
                return callback(instance);
            }
        }
        getInstanceFromId(terminalId) {
            let bgIndex = -1;
            this._backgroundedTerminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.instanceId === terminalId) {
                    bgIndex = i;
                }
            });
            if (bgIndex !== -1) {
                return this._backgroundedTerminalInstances[bgIndex];
            }
            try {
                return this.instances[this._getIndexFromId(terminalId)];
            }
            catch (_a) {
                return undefined;
            }
        }
        getInstanceFromIndex(terminalIndex) {
            return this.instances[terminalIndex];
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        isAttachedToTerminal(remoteTerm) {
            return this.instances.some(term => term.processId === remoteTerm.pid);
        }
        async initializeTerminals() {
            if (this._remoteTerminalsInitPromise) {
                await this._remoteTerminalsInitPromise;
                this._setConnected();
            }
            else if (this._localTerminalsInitPromise) {
                await this._localTerminalsInitPromise;
                this._setConnected();
            }
            if (this._terminalGroupService.groups.length === 0 && this.isProcessSupportRegistered) {
                this.createTerminal({ location: terminal_1.TerminalLocation.Panel });
            }
        }
        moveToEditor(source) {
            if (source.target === terminal_1.TerminalLocation.Editor) {
                return;
            }
            const sourceGroup = this._terminalGroupService.getGroupForInstance(source);
            if (!sourceGroup) {
                return;
            }
            sourceGroup.removeInstance(source);
            this._terminalEditorService.openEditor(source);
            this._onDidRequestHideFindWidget.fire();
        }
        async moveToTerminalView(source, target, side) {
            if (uri_1.URI.isUri(source)) {
                source = this.getInstanceFromResource(source);
            }
            if (source) {
                this._terminalEditorService.detachInstance(source);
            }
            else {
                source = this._terminalEditorService.detachActiveEditorInstance();
                if (!source) {
                    return;
                }
            }
            if (source.target !== terminal_1.TerminalLocation.Editor) {
                await this._terminalGroupService.showPanel(true);
                return;
            }
            source.target = terminal_1.TerminalLocation.Panel;
            let group;
            if (target) {
                group = this._terminalGroupService.getGroupForInstance(target);
            }
            if (!group) {
                group = this._terminalGroupService.createGroup();
            }
            group.addInstance(source);
            this.setActiveInstance(source);
            await this._terminalGroupService.showPanel(true);
            // TODO: Shouldn't this happen automatically?
            source.setVisible(true);
            if (target && side) {
                const index = group.terminalInstances.indexOf(target) + (side === 'after' ? 1 : 0);
                group.moveInstance(source, index);
            }
            // Fire events
            this._onDidChangeInstances.fire();
            this._onDidChangeActiveGroup.fire(this._terminalGroupService.activeGroup);
            this._terminalGroupService.showPanel(true);
            this._onDidRequestHideFindWidget.fire();
        }
        _initInstanceListeners(instance) {
            instance.addDisposable(instance.onTitleChanged(this._onDidChangeInstanceTitle.fire, this._onDidChangeInstanceTitle));
            instance.addDisposable(instance.onIconChanged(this._onDidChangeInstanceIcon.fire, this._onDidChangeInstanceIcon));
            instance.addDisposable(instance.onIconChanged(this._onDidChangeInstanceColor.fire, this._onDidChangeInstanceColor));
            instance.addDisposable(instance.onProcessIdReady(this._onDidReceiveProcessId.fire, this._onDidReceiveProcessId));
            instance.addDisposable(instance.statusList.onDidChangePrimaryStatus(() => this._onDidChangeInstancePrimaryStatus.fire(instance)));
            instance.addDisposable(instance.onLinksReady(this._onDidReceiveInstanceLinks.fire, this._onDidReceiveInstanceLinks));
            instance.addDisposable(instance.onDimensionsChanged(() => {
                this._onDidChangeInstanceDimensions.fire(instance);
                if (this.configHelper.config.enablePersistentSessions && this.isProcessSupportRegistered) {
                    this._saveState();
                }
            }));
            instance.addDisposable(instance.onMaximumDimensionsChanged(() => this._onDidMaxiumumDimensionsChange.fire(instance)));
            instance.addDisposable(instance.onDidInputData(this._onDidInputInstanceData.fire, this._onDidInputInstanceData));
            instance.addDisposable(instance.onDidFocus(this._onDidChangeActiveInstance.fire, this._onDidChangeActiveInstance));
            instance.addDisposable(instance.onRequestAddInstanceToGroup(async (e) => await this._addInstanceToGroup(instance, e)));
        }
        async _addInstanceToGroup(instance, e) {
            var _a;
            const terminalIdentifier = (0, terminalUri_1.parseTerminalUri)(e.uri);
            if (terminalIdentifier.instanceId === undefined) {
                return;
            }
            let sourceInstance = this.getInstanceFromResource(e.uri);
            // Terminal from a different window
            if (!sourceInstance) {
                const attachPersistentProcess = await ((_a = this._primaryBackend) === null || _a === void 0 ? void 0 : _a.requestDetachInstance(terminalIdentifier.workspaceId, terminalIdentifier.instanceId));
                if (attachPersistentProcess) {
                    sourceInstance = await this.createTerminal({ config: { attachPersistentProcess }, resource: e.uri });
                    this._terminalGroupService.moveInstance(sourceInstance, instance, e.side);
                    return;
                }
            }
            // View terminals
            sourceInstance = this._terminalGroupService.getInstanceFromResource(e.uri);
            if (sourceInstance) {
                this._terminalGroupService.moveInstance(sourceInstance, instance, e.side);
                return;
            }
            // Terminal editors
            sourceInstance = this._terminalEditorService.getInstanceFromResource(e.uri);
            if (sourceInstance) {
                this.moveToTerminalView(sourceInstance, instance, e.side);
                return;
            }
            return;
        }
        registerProcessSupport(isSupported) {
            if (!isSupported) {
                return;
            }
            this._processSupportContextKey.set(isSupported);
            this._onDidRegisterProcessSupport.fire();
        }
        registerLinkProvider(linkProvider) {
            const disposables = [];
            this._linkProviders.add(linkProvider);
            for (const instance of this.instances) {
                if (instance.areLinksReady) {
                    disposables.push(instance.registerLinkProvider(linkProvider));
                }
            }
            this._linkProviderDisposables.set(linkProvider, disposables);
            return {
                dispose: () => {
                    const disposables = this._linkProviderDisposables.get(linkProvider) || [];
                    for (const disposable of disposables) {
                        disposable.dispose();
                    }
                    this._linkProviders.delete(linkProvider);
                }
            };
        }
        _setInstanceLinkProviders(instance) {
            for (const linkProvider of this._linkProviders) {
                const disposables = this._linkProviderDisposables.get(linkProvider);
                const provider = instance.registerLinkProvider(linkProvider);
                disposables === null || disposables === void 0 ? void 0 : disposables.push(provider);
            }
        }
        // TODO: Remove this, it should live in group/editor servioce
        _getIndexFromId(terminalId) {
            let terminalIndex = -1;
            this.instances.forEach((terminalInstance, i) => {
                if (terminalInstance.instanceId === terminalId) {
                    terminalIndex = i;
                }
            });
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        async _showTerminalCloseConfirmation(singleTerminal) {
            let message;
            if (this.instances.length === 1 || singleTerminal) {
                message = nls.localize('terminalService.terminalCloseConfirmationSingular', "Do you want to terminate the active terminal session?");
            }
            else {
                message = nls.localize('terminalService.terminalCloseConfirmationPlural', "Do you want to terminate the {0} active terminal sessions?", this.instances.length);
            }
            const res = await this._dialogService.confirm({
                message,
                primaryButton: nls.localize('terminate', "Terminate"),
                type: 'warning',
            });
            return !res.confirmed;
        }
        getDefaultInstanceHost() {
            if (this.defaultLocation === terminal_1.TerminalLocation.Editor) {
                return this._terminalEditorService;
            }
            return this._terminalGroupService;
        }
        getInstanceHost(location) {
            if (location) {
                if (location === terminal_1.TerminalLocation.Editor) {
                    return this._terminalEditorService;
                }
                else if (typeof location === 'object') {
                    if ('viewColumn' in location) {
                        return this._terminalEditorService;
                    }
                    else if ('parentTerminal' in location) {
                        return location.parentTerminal.target === terminal_1.TerminalLocation.Editor ? this._terminalEditorService : this._terminalGroupService;
                    }
                }
                else {
                    return this._terminalGroupService;
                }
            }
            return this;
        }
        getFindHost(instance = this.activeInstance) {
            return (instance === null || instance === void 0 ? void 0 : instance.target) === terminal_1.TerminalLocation.Editor ? this._terminalEditorService : this._terminalGroupService;
        }
        async createTerminal(options) {
            var _a;
            // Await the initialization of available profiles as long as this is not a pty terminal or a
            // local terminal in a remote workspace as profile won't be used in those cases and these
            // terminals need to be launched before remote connections are established.
            if (!this._terminalProfileService.availableProfiles) {
                const isPtyTerminal = (options === null || options === void 0 ? void 0 : options.config) && 'customPtyImplementation' in options.config;
                const isLocalInRemoteTerminal = this._remoteAgentService.getConnection() && uri_1.URI.isUri(options === null || options === void 0 ? void 0 : options.cwd) && (options === null || options === void 0 ? void 0 : options.cwd.scheme) === network_1.Schemas.vscodeFileResource;
                if (!isPtyTerminal && !isLocalInRemoteTerminal) {
                    await this._terminalProfileService.refreshAvailableProfiles();
                }
            }
            const config = (options === null || options === void 0 ? void 0 : options.config) || ((_a = this._terminalProfileService.availableProfiles) === null || _a === void 0 ? void 0 : _a.find(p => p.profileName === this._terminalProfileService.getDefaultProfileName()));
            const shellLaunchConfig = config && 'extensionIdentifier' in config ? {} : this._terminalInstanceService.convertProfileToShellLaunchConfig(config || {});
            // Get the contributed profile if it was provided
            let contributedProfile = config && 'extensionIdentifier' in config ? config : undefined;
            // Get the default profile as a contributed profile if it exists
            if (!contributedProfile && (!options || !options.config)) {
                contributedProfile = await this._terminalProfileService.getContributedDefaultProfile(shellLaunchConfig);
            }
            const splitActiveTerminal = typeof (options === null || options === void 0 ? void 0 : options.location) === 'object' && 'splitActiveTerminal' in options.location ? options.location.splitActiveTerminal : typeof (options === null || options === void 0 ? void 0 : options.location) === 'object' ? 'parentTerminal' in options.location : false;
            this._resolveCwd(shellLaunchConfig, splitActiveTerminal, options);
            // Launch the contributed profile
            if (contributedProfile) {
                const resolvedLocation = this.resolveLocation(options === null || options === void 0 ? void 0 : options.location);
                let location;
                if (splitActiveTerminal) {
                    location = resolvedLocation === terminal_1.TerminalLocation.Editor ? { viewColumn: editorService_1.SIDE_GROUP } : { splitActiveTerminal: true };
                }
                else {
                    location = typeof (options === null || options === void 0 ? void 0 : options.location) === 'object' && 'viewColumn' in options.location ? options.location : resolvedLocation;
                }
                await this.createContributedTerminalProfile(contributedProfile.extensionIdentifier, contributedProfile.id, {
                    icon: contributedProfile.icon,
                    color: contributedProfile.color,
                    location
                });
                const instanceHost = resolvedLocation === terminal_1.TerminalLocation.Editor ? this._terminalEditorService : this._terminalGroupService;
                const instance = instanceHost.instances[instanceHost.instances.length - 1];
                await instance.focusWhenReady();
                this._terminalHasBeenCreated.set(true);
                return instance;
            }
            if (!shellLaunchConfig.customPtyImplementation && !this.isProcessSupportRegistered) {
                throw new Error('Could not create terminal when process support is not registered');
            }
            if (shellLaunchConfig.hideFromUser) {
                const instance = this._terminalInstanceService.createInstance(shellLaunchConfig, undefined, options === null || options === void 0 ? void 0 : options.resource);
                this._backgroundedTerminalInstances.push(instance);
                this._backgroundedTerminalDisposables.set(instance.instanceId, [
                    instance.onDisposed(this._onDidDisposeInstance.fire, this._onDidDisposeInstance)
                ]);
                this._terminalHasBeenCreated.set(true);
                return instance;
            }
            this._evaluateLocalCwd(shellLaunchConfig);
            const location = this.resolveLocation(options === null || options === void 0 ? void 0 : options.location) || this.defaultLocation;
            const parent = this._getSplitParent(options === null || options === void 0 ? void 0 : options.location);
            this._terminalHasBeenCreated.set(true);
            if (parent) {
                return this._splitTerminal(shellLaunchConfig, location, parent);
            }
            return this._createTerminal(shellLaunchConfig, location, options);
        }
        async _resolveCwd(shellLaunchConfig, splitActiveTerminal, options) {
            let cwd = shellLaunchConfig.cwd;
            if (!cwd) {
                if (options === null || options === void 0 ? void 0 : options.cwd) {
                    shellLaunchConfig.cwd = options.cwd;
                }
                else if (splitActiveTerminal && (options === null || options === void 0 ? void 0 : options.location)) {
                    let parent = this.activeInstance;
                    if (typeof options.location === 'object' && 'parentTerminal' in options.location) {
                        parent = options.location.parentTerminal;
                    }
                    if (!parent) {
                        throw new Error('Cannot split without an active instance');
                    }
                    shellLaunchConfig.cwd = await (0, terminalActions_1.getCwdForSplit)(this.configHelper, parent, this._workspaceContextService.getWorkspace().folders, this._commandService);
                }
            }
        }
        _splitTerminal(shellLaunchConfig, location, parent) {
            let instance;
            // Use the URI from the base instance if it exists, this will correctly split local terminals
            if (typeof shellLaunchConfig.cwd !== 'object' && typeof parent.shellLaunchConfig.cwd === 'object') {
                shellLaunchConfig.cwd = uri_1.URI.from({
                    scheme: parent.shellLaunchConfig.cwd.scheme,
                    authority: parent.shellLaunchConfig.cwd.authority,
                    path: shellLaunchConfig.cwd || parent.shellLaunchConfig.cwd.path
                });
            }
            if (location === terminal_1.TerminalLocation.Editor || parent.target === terminal_1.TerminalLocation.Editor) {
                instance = this._terminalEditorService.splitInstance(parent, shellLaunchConfig);
            }
            else {
                const group = this._terminalGroupService.getGroupForInstance(parent);
                if (!group) {
                    throw new Error(`Cannot split a terminal without a group ${parent}`);
                }
                shellLaunchConfig.parentTerminalId = parent.instanceId;
                instance = group.split(shellLaunchConfig);
                this._terminalGroupService.groups.forEach((g, i) => g.setVisible(i === this._terminalGroupService.activeGroupIndex));
            }
            return instance;
        }
        _createTerminal(shellLaunchConfig, location, options) {
            let instance;
            const editorOptions = this._getEditorOptions(options === null || options === void 0 ? void 0 : options.location);
            if (location === terminal_1.TerminalLocation.Editor) {
                instance = this._terminalInstanceService.createInstance(shellLaunchConfig, undefined, options === null || options === void 0 ? void 0 : options.resource);
                instance.target = terminal_1.TerminalLocation.Editor;
                this._terminalEditorService.openEditor(instance, editorOptions);
            }
            else {
                // TODO: pass resource?
                const group = this._terminalGroupService.createGroup(shellLaunchConfig);
                instance = group.terminalInstances[0];
            }
            return instance;
        }
        resolveLocation(location) {
            var _a, _b;
            if (location && typeof location === 'object') {
                if ('parentTerminal' in location) {
                    // since we don't set the target unless it's an editor terminal, this is necessary
                    return !location.parentTerminal.target ? terminal_1.TerminalLocation.Panel : location.parentTerminal.target;
                }
                else if ('viewColumn' in location) {
                    return terminal_1.TerminalLocation.Editor;
                }
                else if ('splitActiveTerminal' in location) {
                    // since we don't set the target unless it's an editor terminal, this is necessary
                    return !((_a = this._activeInstance) === null || _a === void 0 ? void 0 : _a.target) ? terminal_1.TerminalLocation.Panel : (_b = this._activeInstance) === null || _b === void 0 ? void 0 : _b.target;
                }
            }
            return location;
        }
        _getSplitParent(location) {
            if (location && typeof location === 'object' && 'parentTerminal' in location) {
                return location.parentTerminal;
            }
            else if (location && typeof location === 'object' && 'splitActiveTerminal' in location) {
                return this.activeInstance;
            }
            return undefined;
        }
        _getEditorOptions(location) {
            if (location && typeof location === 'object' && 'viewColumn' in location) {
                // When ACTIVE_GROUP is used, resolve it to an actual group to ensure the is created in
                // the active group even if it is locked
                if (location.viewColumn === editorService_1.ACTIVE_GROUP) {
                    location.viewColumn = this._editorGroupsService.activeGroup.index;
                }
                return location;
            }
            return undefined;
        }
        _evaluateLocalCwd(shellLaunchConfig) {
            var _a;
            // Add welcome message and title annotation for local terminals launched within remote or
            // virtual workspaces
            if (typeof shellLaunchConfig.cwd !== 'string' && ((_a = shellLaunchConfig.cwd) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.file) {
                if (contextkeys_1.VirtualWorkspaceContext.getValue(this._contextKeyService)) {
                    shellLaunchConfig.initialText = (0, terminalStrings_1.formatMessageForTerminal)(nls.localize('localTerminalVirtualWorkspace', "⚠ : This shell is open to a {0}local{1} folder, NOT to the virtual folder", '\x1b[3m', '\x1b[23m'), true);
                    shellLaunchConfig.type = 'Local';
                }
                else if (this._remoteAgentService.getConnection()) {
                    shellLaunchConfig.initialText = (0, terminalStrings_1.formatMessageForTerminal)(nls.localize('localTerminalRemote', "⚠ : This shell is running on your {0}local{1} machine, NOT on the connected remote machine", '\x1b[3m', '\x1b[23m'), true);
                    shellLaunchConfig.type = 'Local';
                }
            }
        }
        _showBackgroundTerminal(instance) {
            this._backgroundedTerminalInstances.splice(this._backgroundedTerminalInstances.indexOf(instance), 1);
            const disposables = this._backgroundedTerminalDisposables.get(instance.instanceId);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
            }
            this._backgroundedTerminalDisposables.delete(instance.instanceId);
            instance.shellLaunchConfig.hideFromUser = false;
            this._terminalGroupService.createGroup(instance);
            // Make active automatically if it's the first instance
            if (this.instances.length === 1) {
                this._terminalGroupService.setActiveInstanceByIndex(0);
            }
            this._onDidChangeInstances.fire();
            this._onDidChangeGroups.fire();
        }
        async setContainers(panelContainer, terminalContainer) {
            this._configHelper.panelContainer = panelContainer;
            this._terminalGroupService.setContainer(terminalContainer);
        }
    };
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_saveState", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_updateTitle", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_updateIcon", null);
    TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, log_1.ILogService),
        __param(3, dialogs_1.IDialogService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, remoteAgentService_1.IRemoteAgentService),
        __param(6, views_1.IViewsService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, terminal_2.ITerminalEditorService),
        __param(9, terminal_2.ITerminalGroupService),
        __param(10, terminal_2.ITerminalInstanceService),
        __param(11, editorGroupsService_1.IEditorGroupsService),
        __param(12, terminal_3.ITerminalProfileService),
        __param(13, extensions_1.IExtensionService),
        __param(14, notification_1.INotificationService),
        __param(15, workspace_1.IWorkspaceContextService),
        __param(16, commands_1.ICommandService)
    ], TerminalService);
    exports.TerminalService = TerminalService;
    let TerminalEditorStyle = class TerminalEditorStyle extends themeService_1.Themable {
        constructor(container, _terminalService, _themeService, _terminalProfileService, _editorService) {
            super(_themeService);
            this._terminalService = _terminalService;
            this._themeService = _themeService;
            this._terminalProfileService = _terminalProfileService;
            this._editorService = _editorService;
            this._registerListeners();
            this._styleElement = document.createElement('style');
            container.appendChild(this._styleElement);
            this._register((0, lifecycle_1.toDisposable)(() => container.removeChild(this._styleElement)));
            this.updateStyles();
        }
        _registerListeners() {
            this._register(this._terminalService.onDidChangeInstanceIcon(() => this.updateStyles()));
            this._register(this._terminalService.onDidChangeInstanceColor(() => this.updateStyles()));
            this._register(this._terminalService.onDidCreateInstance(() => this.updateStyles()));
            this._register(this._editorService.onDidActiveEditorChange(() => {
                if (this._editorService.activeEditor instanceof terminalEditorInput_1.TerminalEditorInput) {
                    this.updateStyles();
                }
            }));
            this._register(this._editorService.onDidCloseEditor(() => {
                if (this._editorService.activeEditor instanceof terminalEditorInput_1.TerminalEditorInput) {
                    this.updateStyles();
                }
            }));
            this._register(this._terminalProfileService.onDidChangeAvailableProfiles(() => this.updateStyles()));
        }
        updateStyles() {
            var _a, _b;
            super.updateStyles();
            const colorTheme = this._themeService.getColorTheme();
            // TODO: add a rule collector to avoid duplication
            let css = '';
            const productIconTheme = this._themeService.getProductIconTheme();
            // Add icons
            for (const instance of this._terminalService.instances) {
                const icon = instance.icon;
                if (!icon) {
                    continue;
                }
                let uri = undefined;
                if (icon instanceof uri_1.URI) {
                    uri = icon;
                }
                else if (icon instanceof Object && 'light' in icon && 'dark' in icon) {
                    uri = colorTheme.type === theme_1.ColorScheme.LIGHT ? icon.light : icon.dark;
                }
                const iconClasses = (0, terminalIcon_1.getUriClasses)(instance, colorTheme.type);
                if (uri instanceof uri_1.URI && iconClasses && iconClasses.length > 1) {
                    css += (`.monaco-workbench .terminal-tab.${iconClasses[0]}::before` +
                        `{background-image: ${dom.asCSSUrl(uri)};}`);
                }
                if (themeService_1.ThemeIcon.isThemeIcon(icon)) {
                    const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
                    const iconContribution = iconRegistry.getIcon(icon.id);
                    if (iconContribution) {
                        const def = productIconTheme.getIcon(iconContribution);
                        if (def) {
                            css += (`.monaco-workbench .terminal-tab.codicon-${icon.id}::before` +
                                `{content: '${def.fontCharacter}' !important; font-family: ${dom.asCSSPropertyValue((_b = (_a = def.font) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 'codicon')} !important;}`);
                        }
                    }
                }
            }
            // Add colors
            const iconForegroundColor = colorTheme.getColor(colorRegistry_1.iconForeground);
            if (iconForegroundColor) {
                css += `.monaco-workbench .show-file-icons .file-icon.terminal-tab::before { color: ${iconForegroundColor}; }`;
            }
            css += (0, terminalIcon_1.getColorStyleContent)(colorTheme, true);
            this._styleElement.textContent = css;
        }
    };
    TerminalEditorStyle = __decorate([
        __param(1, terminal_2.ITerminalService),
        __param(2, themeService_1.IThemeService),
        __param(3, terminal_3.ITerminalProfileService),
        __param(4, editorService_1.IEditorService)
    ], TerminalEditorStyle);
});
//# sourceMappingURL=terminalService.js.map