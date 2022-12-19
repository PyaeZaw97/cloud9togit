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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/severity", "vs/base/common/uuid", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/debug/common/extensionHostDebug", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/debugAdapterManager", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugConfigurationManager", "vs/workbench/contrib/debug/browser/debugMemory", "vs/workbench/contrib/debug/browser/debugSession", "vs/workbench/contrib/debug/browser/debugTaskRunner", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugCompoundRoot", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugStorage", "vs/workbench/contrib/debug/common/debugTelemetry", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/contrib/debug/common/debugViewModel", "vs/workbench/contrib/debug/common/disassemblyViewInput", "vs/workbench/contrib/files/common/files", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, aria, actions_1, arrays_1, async_1, cancellation_1, errorMessage_1, errors, event_1, lifecycle_1, objects_1, severity_1, uuid_1, editorBrowser_1, nls, commands_1, configuration_1, contextkey_1, extensionHostDebug_1, dialogs_1, files_1, instantiation_1, notification_1, quickInput_1, uriIdentity_1, workspace_1, workspaceTrust_1, views_1, debugAdapterManager_1, debugCommands_1, debugConfigurationManager_1, debugMemory_1, debugSession_1, debugTaskRunner_1, debug_1, debugCompoundRoot_1, debugModel_1, debugStorage_1, debugTelemetry_1, debugUtils_1, debugViewModel_1, disassemblyViewInput_1, files_2, activity_1, editorService_1, extensions_1, layoutService_1, lifecycle_2, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getStackFrameThreadAndSessionToFocus = exports.DebugService = void 0;
    let DebugService = class DebugService {
        constructor(editorService, paneCompositeService, viewsService, viewDescriptorService, notificationService, dialogService, layoutService, contextService, contextKeyService, lifecycleService, instantiationService, extensionService, fileService, configurationService, extensionHostDebugService, activityService, commandService, quickInputService, workspaceTrustRequestService, uriIdentityService) {
            this.editorService = editorService;
            this.paneCompositeService = paneCompositeService;
            this.viewsService = viewsService;
            this.viewDescriptorService = viewDescriptorService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.layoutService = layoutService;
            this.contextService = contextService;
            this.contextKeyService = contextKeyService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.extensionHostDebugService = extensionHostDebugService;
            this.activityService = activityService;
            this.commandService = commandService;
            this.quickInputService = quickInputService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.uriIdentityService = uriIdentityService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.initializing = false;
            this.sessionCancellationTokens = new Map();
            this.breakpointsToSendOnResourceSaved = new Set();
            this._onDidChangeState = new event_1.Emitter();
            this._onDidNewSession = new event_1.Emitter();
            this._onWillNewSession = new event_1.Emitter();
            this._onDidEndSession = new event_1.Emitter();
            this.adapterManager = this.instantiationService.createInstance(debugAdapterManager_1.AdapterManager);
            this.disposables.add(this.adapterManager);
            this.configurationManager = this.instantiationService.createInstance(debugConfigurationManager_1.ConfigurationManager, this.adapterManager);
            this.disposables.add(this.configurationManager);
            this.debugStorage = this.instantiationService.createInstance(debugStorage_1.DebugStorage);
            contextKeyService.bufferChangeEvents(() => {
                this.debugType = debug_1.CONTEXT_DEBUG_TYPE.bindTo(contextKeyService);
                this.debugState = debug_1.CONTEXT_DEBUG_STATE.bindTo(contextKeyService);
                this.inDebugMode = debug_1.CONTEXT_IN_DEBUG_MODE.bindTo(contextKeyService);
                this.debugUx = debug_1.CONTEXT_DEBUG_UX.bindTo(contextKeyService);
                this.debugUx.set(this.debugStorage.loadDebugUxState());
                this.breakpointsExist = debug_1.CONTEXT_BREAKPOINTS_EXIST.bindTo(contextKeyService);
                // Need to set disassemblyViewFocus here to make it in the same context as the debug event handlers
                this.disassemblyViewFocus = debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.bindTo(contextKeyService);
            });
            this.chosenEnvironments = this.debugStorage.loadChosenEnvironments();
            this.model = this.instantiationService.createInstance(debugModel_1.DebugModel, this.debugStorage);
            this.telemetry = this.instantiationService.createInstance(debugTelemetry_1.DebugTelemetry, this.model);
            const setBreakpointsExistContext = () => this.breakpointsExist.set(!!(this.model.getBreakpoints().length || this.model.getDataBreakpoints().length || this.model.getFunctionBreakpoints().length));
            setBreakpointsExistContext();
            this.viewModel = new debugViewModel_1.ViewModel(contextKeyService);
            this.taskRunner = this.instantiationService.createInstance(debugTaskRunner_1.DebugTaskRunner);
            this.disposables.add(this.fileService.registerProvider(debug_1.DEBUG_MEMORY_SCHEME, new debugMemory_1.DebugMemoryFileSystemProvider(this)));
            this.disposables.add(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
            this.disposables.add(this.lifecycleService.onWillShutdown(this.dispose, this));
            this.disposables.add(this.extensionHostDebugService.onAttachSession(event => {
                const session = this.model.getSession(event.sessionId, true);
                if (session) {
                    // EH was started in debug mode -> attach to it
                    session.configuration.request = 'attach';
                    session.configuration.port = event.port;
                    session.setSubId(event.subId);
                    this.launchOrAttachToSession(session);
                }
            }));
            this.disposables.add(this.extensionHostDebugService.onTerminateSession(event => {
                const session = this.model.getSession(event.sessionId);
                if (session && session.subId === event.subId) {
                    session.disconnect();
                }
            }));
            this.disposables.add(this.viewModel.onDidFocusStackFrame(() => {
                this.onStateChange();
            }));
            this.disposables.add(this.viewModel.onDidFocusSession(() => {
                this.onStateChange();
            }));
            this.disposables.add(event_1.Event.any(this.adapterManager.onDidRegisterDebugger, this.configurationManager.onDidSelectConfiguration)(() => {
                const debugUxValue = (this.state !== 0 /* State.Inactive */ || (this.configurationManager.getAllConfigurations().length > 0 && this.adapterManager.hasEnabledDebuggers())) ? 'default' : 'simple';
                this.debugUx.set(debugUxValue);
                this.debugStorage.storeDebugUxState(debugUxValue);
            }));
            this.disposables.add(this.model.onDidChangeCallStack(() => {
                const numberOfSessions = this.model.getSessions().filter(s => !s.parentSession).length;
                if (this.activity) {
                    this.activity.dispose();
                }
                if (numberOfSessions > 0) {
                    const viewContainer = this.viewDescriptorService.getViewContainerByViewId(debug_1.CALLSTACK_VIEW_ID);
                    if (viewContainer) {
                        this.activity = this.activityService.showViewContainerActivity(viewContainer.id, { badge: new activity_1.NumberBadge(numberOfSessions, n => n === 1 ? nls.localize('1activeSession', "1 active session") : nls.localize('nActiveSessions', "{0} active sessions", n)) });
                    }
                }
            }));
            this.disposables.add(this.model.onDidChangeBreakpoints(() => setBreakpointsExistContext()));
            this.disposables.add(editorService.onDidActiveEditorChange(() => {
                this.contextKeyService.bufferChangeEvents(() => {
                    if (editorService.activeEditor === disassemblyViewInput_1.DisassemblyViewInput.instance) {
                        this.disassemblyViewFocus.set(true);
                    }
                    else {
                        this.disassemblyViewFocus.reset();
                    }
                });
            }));
            this.disposables.add(this.lifecycleService.onBeforeShutdown(() => {
                var _a;
                for (const editor of editorService.editors) {
                    // Editors will not be valid on window reload, so close them.
                    if (((_a = editor.resource) === null || _a === void 0 ? void 0 : _a.scheme) === debug_1.DEBUG_MEMORY_SCHEME) {
                        editor.dispose();
                    }
                }
            }));
        }
        getModel() {
            return this.model;
        }
        getViewModel() {
            return this.viewModel;
        }
        getConfigurationManager() {
            return this.configurationManager;
        }
        getAdapterManager() {
            return this.adapterManager;
        }
        sourceIsNotAvailable(uri) {
            this.model.sourceIsNotAvailable(uri);
        }
        dispose() {
            this.disposables.dispose();
        }
        //---- state management
        get state() {
            const focusedSession = this.viewModel.focusedSession;
            if (focusedSession) {
                return focusedSession.state;
            }
            return this.initializing ? 1 /* State.Initializing */ : 0 /* State.Inactive */;
        }
        get initializingOptions() {
            return this._initializingOptions;
        }
        startInitializingState(options) {
            if (!this.initializing) {
                this.initializing = true;
                this._initializingOptions = options;
                this.onStateChange();
            }
        }
        endInitializingState() {
            if (this.initializing) {
                this.initializing = false;
                this._initializingOptions = undefined;
                this.onStateChange();
            }
        }
        cancelTokens(id) {
            if (id) {
                const token = this.sessionCancellationTokens.get(id);
                if (token) {
                    token.cancel();
                    this.sessionCancellationTokens.delete(id);
                }
            }
            else {
                this.sessionCancellationTokens.forEach(t => t.cancel());
                this.sessionCancellationTokens.clear();
            }
        }
        onStateChange() {
            const state = this.state;
            if (this.previousState !== state) {
                this.contextKeyService.bufferChangeEvents(() => {
                    this.debugState.set((0, debug_1.getStateLabel)(state));
                    this.inDebugMode.set(state !== 0 /* State.Inactive */);
                    // Only show the simple ux if debug is not yet started and if no launch.json exists
                    const debugUxValue = ((state !== 0 /* State.Inactive */ && state !== 1 /* State.Initializing */) || (this.adapterManager.hasEnabledDebuggers() && this.configurationManager.selectedConfiguration.name)) ? 'default' : 'simple';
                    this.debugUx.set(debugUxValue);
                    this.debugStorage.storeDebugUxState(debugUxValue);
                });
                this.previousState = state;
                this._onDidChangeState.fire(state);
            }
        }
        get onDidChangeState() {
            return this._onDidChangeState.event;
        }
        get onDidNewSession() {
            return this._onDidNewSession.event;
        }
        get onWillNewSession() {
            return this._onWillNewSession.event;
        }
        get onDidEndSession() {
            return this._onDidEndSession.event;
        }
        //---- life cycle management
        /**
         * main entry point
         * properly manages compounds, checks for errors and handles the initializing state.
         */
        async startDebugging(launch, configOrName, options, saveBeforeStart = !(options === null || options === void 0 ? void 0 : options.parentSession)) {
            const message = options && options.noDebug ? nls.localize('runTrust', "Running executes build tasks and program code from your workspace.") : nls.localize('debugTrust', "Debugging executes build tasks and program code from your workspace.");
            const trust = await this.workspaceTrustRequestService.requestWorkspaceTrust({ message });
            if (!trust) {
                return false;
            }
            this.startInitializingState(options);
            try {
                // make sure to save all files and that the configuration is up to date
                await this.extensionService.activateByEvent('onDebug');
                if (saveBeforeStart) {
                    await (0, debugUtils_1.saveAllBeforeDebugStart)(this.configurationService, this.editorService);
                }
                await this.extensionService.whenInstalledExtensionsRegistered();
                let config;
                let compound;
                if (!configOrName) {
                    configOrName = this.configurationManager.selectedConfiguration.name;
                }
                if (typeof configOrName === 'string' && launch) {
                    config = launch.getConfiguration(configOrName);
                    compound = launch.getCompound(configOrName);
                }
                else if (typeof configOrName !== 'string') {
                    config = configOrName;
                }
                if (compound) {
                    // we are starting a compound debug, first do some error checking and than start each configuration in the compound
                    if (!compound.configurations) {
                        throw new Error(nls.localize({ key: 'compoundMustHaveConfigurations', comment: ['compound indicates a "compounds" configuration item', '"configurations" is an attribute and should not be localized'] }, "Compound must have \"configurations\" attribute set in order to start multiple configurations."));
                    }
                    if (compound.preLaunchTask) {
                        const taskResult = await this.taskRunner.runTaskAndCheckErrors((launch === null || launch === void 0 ? void 0 : launch.workspace) || this.contextService.getWorkspace(), compound.preLaunchTask);
                        if (taskResult === 0 /* TaskRunResult.Failure */) {
                            this.endInitializingState();
                            return false;
                        }
                    }
                    if (compound.stopAll) {
                        options = Object.assign(Object.assign({}, options), { compoundRoot: new debugCompoundRoot_1.DebugCompoundRoot() });
                    }
                    const values = await Promise.all(compound.configurations.map(configData => {
                        const name = typeof configData === 'string' ? configData : configData.name;
                        if (name === compound.name) {
                            return Promise.resolve(false);
                        }
                        let launchForName;
                        if (typeof configData === 'string') {
                            const launchesContainingName = this.configurationManager.getLaunches().filter(l => !!l.getConfiguration(name));
                            if (launchesContainingName.length === 1) {
                                launchForName = launchesContainingName[0];
                            }
                            else if (launch && launchesContainingName.length > 1 && launchesContainingName.indexOf(launch) >= 0) {
                                // If there are multiple launches containing the configuration give priority to the configuration in the current launch
                                launchForName = launch;
                            }
                            else {
                                throw new Error(launchesContainingName.length === 0 ? nls.localize('noConfigurationNameInWorkspace', "Could not find launch configuration '{0}' in the workspace.", name)
                                    : nls.localize('multipleConfigurationNamesInWorkspace', "There are multiple launch configurations '{0}' in the workspace. Use folder name to qualify the configuration.", name));
                            }
                        }
                        else if (configData.folder) {
                            const launchesMatchingConfigData = this.configurationManager.getLaunches().filter(l => l.workspace && l.workspace.name === configData.folder && !!l.getConfiguration(configData.name));
                            if (launchesMatchingConfigData.length === 1) {
                                launchForName = launchesMatchingConfigData[0];
                            }
                            else {
                                throw new Error(nls.localize('noFolderWithName', "Can not find folder with name '{0}' for configuration '{1}' in compound '{2}'.", configData.folder, configData.name, compound.name));
                            }
                        }
                        return this.createSession(launchForName, launchForName.getConfiguration(name), options);
                    }));
                    const result = values.every(success => !!success); // Compound launch is a success only if each configuration launched successfully
                    this.endInitializingState();
                    return result;
                }
                if (configOrName && !config) {
                    const message = !!launch ? nls.localize('configMissing', "Configuration '{0}' is missing in 'launch.json'.", typeof configOrName === 'string' ? configOrName : configOrName.name) :
                        nls.localize('launchJsonDoesNotExist', "'launch.json' does not exist for passed workspace folder.");
                    throw new Error(message);
                }
                const result = await this.createSession(launch, config, options);
                this.endInitializingState();
                return result;
            }
            catch (err) {
                // make sure to get out of initializing state, and propagate the result
                this.notificationService.error(err);
                this.endInitializingState();
                return Promise.reject(err);
            }
        }
        /**
         * gets the debugger for the type, resolves configurations by providers, substitutes variables and runs prelaunch tasks
         */
        async createSession(launch, config, options) {
            // We keep the debug type in a separate variable 'type' so that a no-folder config has no attributes.
            // Storing the type in the config would break extensions that assume that the no-folder case is indicated by an empty config.
            let type;
            if (config) {
                type = config.type;
            }
            else {
                // a no-folder workspace has no launch.config
                config = Object.create(null);
            }
            if (options && options.noDebug) {
                config.noDebug = true;
            }
            else if (options && typeof options.noDebug === 'undefined' && options.parentSession && options.parentSession.configuration.noDebug) {
                config.noDebug = true;
            }
            const unresolvedConfig = (0, objects_1.deepClone)(config);
            let guess;
            let activeEditor;
            if (!type) {
                activeEditor = this.editorService.activeEditor;
                if (activeEditor && activeEditor.resource) {
                    type = this.chosenEnvironments[activeEditor.resource.toString()];
                }
                if (!type) {
                    guess = await this.adapterManager.guessDebugger(false);
                    if (guess) {
                        type = guess.type;
                    }
                }
            }
            const initCancellationToken = new cancellation_1.CancellationTokenSource();
            const sessionId = (0, uuid_1.generateUuid)();
            this.sessionCancellationTokens.set(sessionId, initCancellationToken);
            const configByProviders = await this.configurationManager.resolveConfigurationByProviders(launch && launch.workspace ? launch.workspace.uri : undefined, type, config, initCancellationToken.token);
            // a falsy config indicates an aborted launch
            if (configByProviders && configByProviders.type) {
                try {
                    let resolvedConfig = await this.substituteVariables(launch, configByProviders);
                    if (!resolvedConfig) {
                        // User cancelled resolving of interactive variables, silently return
                        return false;
                    }
                    if (initCancellationToken.token.isCancellationRequested) {
                        // User cancelled, silently return
                        return false;
                    }
                    const workspace = (launch === null || launch === void 0 ? void 0 : launch.workspace) || this.contextService.getWorkspace();
                    const taskResult = await this.taskRunner.runTaskAndCheckErrors(workspace, resolvedConfig.preLaunchTask);
                    if (taskResult === 0 /* TaskRunResult.Failure */) {
                        return false;
                    }
                    const cfg = await this.configurationManager.resolveDebugConfigurationWithSubstitutedVariables(launch && launch.workspace ? launch.workspace.uri : undefined, type, resolvedConfig, initCancellationToken.token);
                    if (!cfg) {
                        if (launch && type && cfg === null && !initCancellationToken.token.isCancellationRequested) { // show launch.json only for "config" being "null".
                            await launch.openConfigFile(true, type, initCancellationToken.token);
                        }
                        return false;
                    }
                    resolvedConfig = cfg;
                    const dbg = this.adapterManager.getDebugger(resolvedConfig.type);
                    if (!dbg || (configByProviders.request !== 'attach' && configByProviders.request !== 'launch')) {
                        let message;
                        if (configByProviders.request !== 'attach' && configByProviders.request !== 'launch') {
                            message = configByProviders.request ? nls.localize('debugRequestNotSupported', "Attribute '{0}' has an unsupported value '{1}' in the chosen debug configuration.", 'request', configByProviders.request)
                                : nls.localize('debugRequesMissing', "Attribute '{0}' is missing from the chosen debug configuration.", 'request');
                        }
                        else {
                            message = resolvedConfig.type ? nls.localize('debugTypeNotSupported', "Configured debug type '{0}' is not supported.", resolvedConfig.type) :
                                nls.localize('debugTypeMissing', "Missing property 'type' for the chosen launch configuration.");
                        }
                        const actionList = [];
                        actionList.push(new actions_1.Action('installAdditionalDebuggers', nls.localize({ key: 'installAdditionalDebuggers', comment: ['Placeholder is the debug type, so for example "node", "python"'] }, "Install {0} Extension", resolvedConfig.type), undefined, true, async () => this.commandService.executeCommand('debug.installAdditionalDebuggers', resolvedConfig === null || resolvedConfig === void 0 ? void 0 : resolvedConfig.type)));
                        await this.showError(message, actionList);
                        return false;
                    }
                    if (!dbg.enabled) {
                        await this.showError((0, debug_1.debuggerDisabledMessage)(dbg.type), []);
                        return false;
                    }
                    const result = await this.doCreateSession(sessionId, launch === null || launch === void 0 ? void 0 : launch.workspace, { resolved: resolvedConfig, unresolved: unresolvedConfig }, options);
                    if (result && guess && activeEditor && activeEditor.resource) {
                        // Remeber user choice of environment per active editor to make starting debugging smoother #124770
                        this.chosenEnvironments[activeEditor.resource.toString()] = guess.type;
                        this.debugStorage.storeChosenEnvironments(this.chosenEnvironments);
                    }
                    return result;
                }
                catch (err) {
                    if (err && err.message) {
                        await this.showError(err.message);
                    }
                    else if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                        await this.showError(nls.localize('noFolderWorkspaceDebugError', "The active file can not be debugged. Make sure it is saved and that you have a debug extension installed for that file type."));
                    }
                    if (launch && !initCancellationToken.token.isCancellationRequested) {
                        await launch.openConfigFile(true, undefined, initCancellationToken.token);
                    }
                    return false;
                }
            }
            if (launch && type && configByProviders === null && !initCancellationToken.token.isCancellationRequested) { // show launch.json only for "config" being "null".
                await launch.openConfigFile(true, type, initCancellationToken.token);
            }
            return false;
        }
        /**
         * instantiates the new session, initializes the session, registers session listeners and reports telemetry
         */
        async doCreateSession(sessionId, root, configuration, options) {
            const session = this.instantiationService.createInstance(debugSession_1.DebugSession, sessionId, configuration, root, this.model, options);
            if ((options === null || options === void 0 ? void 0 : options.startedByUser) && this.model.getSessions().some(s => s.getLabel() === session.getLabel())) {
                // There is already a session with the same name, prompt user #127721
                const result = await this.dialogService.confirm({ message: nls.localize('multipleSession', "'{0}' is already running. Do you want to start another instance?", session.getLabel()) });
                if (!result.confirmed) {
                    return false;
                }
            }
            this.model.addSession(session);
            // register listeners as the very first thing!
            this.registerSessionListeners(session);
            // since the Session is now properly registered under its ID and hooked, we can announce it
            // this event doesn't go to extensions
            this._onWillNewSession.fire(session);
            const openDebug = this.configurationService.getValue('debug').openDebug;
            // Open debug viewlet based on the visibility of the side bar and openDebug setting. Do not open for 'run without debug'
            if (!configuration.resolved.noDebug && (openDebug === 'openOnSessionStart' || (openDebug !== 'neverOpen' && this.viewModel.firstSessionStart)) && !session.isSimpleUI) {
                await this.paneCompositeService.openPaneComposite(debug_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */);
            }
            try {
                await this.launchOrAttachToSession(session);
                const internalConsoleOptions = session.configuration.internalConsoleOptions || this.configurationService.getValue('debug').internalConsoleOptions;
                if (internalConsoleOptions === 'openOnSessionStart' || (this.viewModel.firstSessionStart && internalConsoleOptions === 'openOnFirstSessionStart')) {
                    this.viewsService.openView(debug_1.REPL_VIEW_ID, false);
                }
                this.viewModel.firstSessionStart = false;
                const showSubSessions = this.configurationService.getValue('debug').showSubSessionsInToolBar;
                const sessions = this.model.getSessions();
                const shownSessions = showSubSessions ? sessions : sessions.filter(s => !s.parentSession);
                if (shownSessions.length > 1) {
                    this.viewModel.setMultiSessionView(true);
                }
                // since the initialized response has arrived announce the new Session (including extensions)
                this._onDidNewSession.fire(session);
                return true;
            }
            catch (error) {
                if (errors.isCancellationError(error)) {
                    // don't show 'canceled' error messages to the user #7906
                    return false;
                }
                // Show the repl if some error got logged there #5870
                if (session && session.getReplElements().length > 0) {
                    this.viewsService.openView(debug_1.REPL_VIEW_ID, false);
                }
                if (session.configuration && session.configuration.request === 'attach' && session.configuration.__autoAttach) {
                    // ignore attach timeouts in auto attach mode
                    return false;
                }
                const errorMessage = error instanceof Error ? error.message : error;
                if (error.showUser !== false) {
                    // Only show the error when showUser is either not defined, or is true #128484
                    await this.showError(errorMessage, (0, errorMessage_1.isErrorWithActions)(error) ? error.actions : []);
                }
                return false;
            }
        }
        async launchOrAttachToSession(session, forceFocus = false) {
            const dbgr = this.adapterManager.getDebugger(session.configuration.type);
            try {
                await session.initialize(dbgr);
                await session.launchOrAttach(session.configuration);
                const launchJsonExists = !!session.root && !!this.configurationService.getValue('launch', { resource: session.root.uri });
                await this.telemetry.logDebugSessionStart(dbgr, launchJsonExists);
                if (forceFocus || !this.viewModel.focusedSession || (session.parentSession === this.viewModel.focusedSession && session.compact)) {
                    await this.focusStackFrame(undefined, undefined, session);
                }
            }
            catch (err) {
                if (this.viewModel.focusedSession === session) {
                    await this.focusStackFrame(undefined);
                }
                return Promise.reject(err);
            }
        }
        registerSessionListeners(session) {
            const sessionRunningScheduler = new async_1.RunOnceScheduler(() => {
                // Do not immediatly defocus the stack frame if the session is running
                if (session.state === 3 /* State.Running */ && this.viewModel.focusedSession === session) {
                    this.viewModel.setFocus(undefined, this.viewModel.focusedThread, session, false);
                }
            }, 200);
            this.disposables.add(session.onDidChangeState(() => {
                if (session.state === 3 /* State.Running */ && this.viewModel.focusedSession === session) {
                    sessionRunningScheduler.schedule();
                }
                if (session === this.viewModel.focusedSession) {
                    this.onStateChange();
                }
            }));
            this.disposables.add(session.onDidEndAdapter(async (adapterExitEvent) => {
                var _a;
                if (adapterExitEvent) {
                    if (adapterExitEvent.error) {
                        this.notificationService.error(nls.localize('debugAdapterCrash', "Debug adapter process has terminated unexpectedly ({0})", adapterExitEvent.error.message || adapterExitEvent.error.toString()));
                    }
                    this.telemetry.logDebugSessionStop(session, adapterExitEvent);
                }
                // 'Run without debugging' mode VSCode must terminate the extension host. More details: #3905
                const extensionDebugSession = (0, debugUtils_1.getExtensionHostDebugSession)(session);
                if (extensionDebugSession && extensionDebugSession.state === 3 /* State.Running */ && extensionDebugSession.configuration.noDebug) {
                    this.extensionHostDebugService.close(extensionDebugSession.getId());
                }
                if (session.configuration.postDebugTask) {
                    const root = (_a = session.root) !== null && _a !== void 0 ? _a : this.contextService.getWorkspace();
                    try {
                        await this.taskRunner.runTask(root, session.configuration.postDebugTask);
                    }
                    catch (err) {
                        this.notificationService.error(err);
                    }
                }
                this.endInitializingState();
                this.cancelTokens(session.getId());
                this._onDidEndSession.fire(session);
                const focusedSession = this.viewModel.focusedSession;
                if (focusedSession && focusedSession.getId() === session.getId()) {
                    const { session, thread, stackFrame } = getStackFrameThreadAndSessionToFocus(this.model, undefined, undefined, undefined, focusedSession);
                    this.viewModel.setFocus(stackFrame, thread, session, false);
                }
                if (this.model.getSessions().length === 0) {
                    this.viewModel.setMultiSessionView(false);
                    if (this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) && this.configurationService.getValue('debug').openExplorerOnEnd) {
                        this.paneCompositeService.openPaneComposite(files_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */);
                    }
                    // Data breakpoints that can not be persisted should be cleared when a session ends
                    const dataBreakpoints = this.model.getDataBreakpoints().filter(dbp => !dbp.canPersist);
                    dataBreakpoints.forEach(dbp => this.model.removeDataBreakpoints(dbp.getId()));
                    if (this.viewsService.isViewVisible(debug_1.REPL_VIEW_ID) && this.configurationService.getValue('debug').console.closeOnEnd) {
                        this.viewsService.closeView(debug_1.REPL_VIEW_ID);
                    }
                }
            }));
        }
        async restartSession(session, restartData) {
            await this.editorService.saveAll();
            const isAutoRestart = !!restartData;
            const runTasks = async () => {
                if (isAutoRestart) {
                    // Do not run preLaunch and postDebug tasks for automatic restarts
                    return Promise.resolve(1 /* TaskRunResult.Success */);
                }
                const root = session.root || this.contextService.getWorkspace();
                await this.taskRunner.runTask(root, session.configuration.preRestartTask);
                await this.taskRunner.runTask(root, session.configuration.postDebugTask);
                const taskResult1 = await this.taskRunner.runTaskAndCheckErrors(root, session.configuration.preLaunchTask);
                if (taskResult1 !== 1 /* TaskRunResult.Success */) {
                    return taskResult1;
                }
                return this.taskRunner.runTaskAndCheckErrors(root, session.configuration.postRestartTask);
            };
            const extensionDebugSession = (0, debugUtils_1.getExtensionHostDebugSession)(session);
            if (extensionDebugSession) {
                const taskResult = await runTasks();
                if (taskResult === 1 /* TaskRunResult.Success */) {
                    this.extensionHostDebugService.reload(extensionDebugSession.getId());
                }
                return;
            }
            // Read the configuration again if a launch.json has been changed, if not just use the inmemory configuration
            let needsToSubstitute = false;
            let unresolved;
            const launch = session.root ? this.configurationManager.getLaunch(session.root.uri) : undefined;
            if (launch) {
                unresolved = launch.getConfiguration(session.configuration.name);
                if (unresolved && !(0, objects_1.equals)(unresolved, session.unresolvedConfiguration)) {
                    // Take the type from the session since the debug extension might overwrite it #21316
                    unresolved.type = session.configuration.type;
                    unresolved.noDebug = session.configuration.noDebug;
                    needsToSubstitute = true;
                }
            }
            let resolved = session.configuration;
            if (launch && needsToSubstitute && unresolved) {
                const initCancellationToken = new cancellation_1.CancellationTokenSource();
                this.sessionCancellationTokens.set(session.getId(), initCancellationToken);
                const resolvedByProviders = await this.configurationManager.resolveConfigurationByProviders(launch.workspace ? launch.workspace.uri : undefined, unresolved.type, unresolved, initCancellationToken.token);
                if (resolvedByProviders) {
                    resolved = await this.substituteVariables(launch, resolvedByProviders);
                    if (resolved && !initCancellationToken.token.isCancellationRequested) {
                        resolved = await this.configurationManager.resolveDebugConfigurationWithSubstitutedVariables(launch && launch.workspace ? launch.workspace.uri : undefined, unresolved.type, resolved, initCancellationToken.token);
                    }
                }
                else {
                    resolved = resolvedByProviders;
                }
            }
            if (resolved) {
                session.setConfiguration({ resolved, unresolved });
            }
            session.configuration.__restart = restartData;
            if (session.capabilities.supportsRestartRequest) {
                const taskResult = await runTasks();
                if (taskResult === 1 /* TaskRunResult.Success */) {
                    await session.restart();
                }
                return;
            }
            const shouldFocus = !!this.viewModel.focusedSession && session.getId() === this.viewModel.focusedSession.getId();
            // If the restart is automatic  -> disconnect, otherwise -> terminate #55064
            if (isAutoRestart) {
                await session.disconnect(true);
            }
            else {
                await session.terminate(true);
            }
            return new Promise((c, e) => {
                setTimeout(async () => {
                    const taskResult = await runTasks();
                    if (taskResult !== 1 /* TaskRunResult.Success */) {
                        return;
                    }
                    if (!resolved) {
                        return c(undefined);
                    }
                    try {
                        await this.launchOrAttachToSession(session, shouldFocus);
                        this._onDidNewSession.fire(session);
                        c(undefined);
                    }
                    catch (error) {
                        e(error);
                    }
                }, 300);
            });
        }
        async stopSession(session, disconnect = false, suspend = false) {
            if (session) {
                return disconnect ? session.disconnect(undefined, suspend) : session.terminate();
            }
            const sessions = this.model.getSessions();
            if (sessions.length === 0) {
                this.taskRunner.cancel();
                // User might have cancelled starting of a debug session, and in some cases the quick pick is left open
                await this.quickInputService.cancel();
                this.endInitializingState();
                this.cancelTokens(undefined);
            }
            return Promise.all(sessions.map(s => disconnect ? s.disconnect(undefined, suspend) : s.terminate()));
        }
        async substituteVariables(launch, config) {
            const dbg = this.adapterManager.getDebugger(config.type);
            if (dbg) {
                let folder = undefined;
                if (launch && launch.workspace) {
                    folder = launch.workspace;
                }
                else {
                    const folders = this.contextService.getWorkspace().folders;
                    if (folders.length === 1) {
                        folder = folders[0];
                    }
                }
                try {
                    return await dbg.substituteVariables(folder, config);
                }
                catch (err) {
                    this.showError(err.message);
                    return undefined; // bail out
                }
            }
            return Promise.resolve(config);
        }
        async showError(message, errorActions = []) {
            const configureAction = new actions_1.Action(debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID, debugCommands_1.DEBUG_CONFIGURE_LABEL, undefined, true, () => this.commandService.executeCommand(debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID));
            // Don't append the standard command if id of any provided action indicates it is a command
            const actions = errorActions.filter((action) => action.id.endsWith('.command')).length > 0 ? errorActions : [...errorActions, configureAction];
            const { choice } = await this.dialogService.show(severity_1.default.Error, message, actions.map(a => a.label).concat(nls.localize('cancel', "Cancel")), { cancelId: actions.length });
            if (choice < actions.length) {
                await actions[choice].run();
            }
        }
        //---- focus management
        async focusStackFrame(_stackFrame, _thread, _session, options) {
            var _a;
            const { stackFrame, thread, session } = getStackFrameThreadAndSessionToFocus(this.model, _stackFrame, _thread, _session);
            if (stackFrame) {
                const editor = await stackFrame.openInEditor(this.editorService, (_a = options === null || options === void 0 ? void 0 : options.preserveFocus) !== null && _a !== void 0 ? _a : true, options === null || options === void 0 ? void 0 : options.sideBySide, options === null || options === void 0 ? void 0 : options.pinned);
                if (editor) {
                    if (editor.input === disassemblyViewInput_1.DisassemblyViewInput.instance) {
                        // Go to address is invoked via setFocus
                    }
                    else {
                        const control = editor.getControl();
                        if (stackFrame && (0, editorBrowser_1.isCodeEditor)(control) && control.hasModel()) {
                            const model = control.getModel();
                            const lineNumber = stackFrame.range.startLineNumber;
                            if (lineNumber >= 1 && lineNumber <= model.getLineCount()) {
                                const lineContent = control.getModel().getLineContent(lineNumber);
                                aria.alert(nls.localize({ key: 'debuggingPaused', comment: ['First placeholder is the stack frame name, second is the line number, third placeholder is the reason why debugging is stopped, for example "breakpoint" and the last one is the file line content.'] }, "{0}:{1}, debugging paused {2}, {3}", stackFrame.source ? stackFrame.source.name : '', stackFrame.range.startLineNumber, thread && thread.stoppedDetails ? `, reason ${thread.stoppedDetails.reason}` : '', lineContent));
                            }
                        }
                    }
                }
            }
            if (session) {
                this.debugType.set(session.configuration.type);
            }
            else {
                this.debugType.reset();
            }
            this.viewModel.setFocus(stackFrame, thread, session, !!(options === null || options === void 0 ? void 0 : options.explicit));
        }
        //---- watches
        addWatchExpression(name) {
            const we = this.model.addWatchExpression(name);
            if (!name) {
                this.viewModel.setSelectedExpression(we, false);
            }
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        renameWatchExpression(id, newName) {
            this.model.renameWatchExpression(id, newName);
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        moveWatchExpression(id, position) {
            this.model.moveWatchExpression(id, position);
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        removeWatchExpressions(id) {
            this.model.removeWatchExpressions(id);
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        //---- breakpoints
        canSetBreakpointsIn(model) {
            return this.adapterManager.canSetBreakpointsIn(model);
        }
        async enableOrDisableBreakpoints(enable, breakpoint) {
            if (breakpoint) {
                this.model.setEnablement(breakpoint, enable);
                this.debugStorage.storeBreakpoints(this.model);
                if (breakpoint instanceof debugModel_1.Breakpoint) {
                    await this.sendBreakpoints(breakpoint.uri);
                }
                else if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
                    await this.sendFunctionBreakpoints();
                }
                else if (breakpoint instanceof debugModel_1.DataBreakpoint) {
                    await this.sendDataBreakpoints();
                }
                else if (breakpoint instanceof debugModel_1.InstructionBreakpoint) {
                    await this.sendInstructionBreakpoints();
                }
                else {
                    await this.sendExceptionBreakpoints();
                }
            }
            else {
                this.model.enableOrDisableAllBreakpoints(enable);
                this.debugStorage.storeBreakpoints(this.model);
                await this.sendAllBreakpoints();
            }
            this.debugStorage.storeBreakpoints(this.model);
        }
        async addBreakpoints(uri, rawBreakpoints, ariaAnnounce = true) {
            const breakpoints = this.model.addBreakpoints(uri, rawBreakpoints);
            if (ariaAnnounce) {
                breakpoints.forEach(bp => aria.status(nls.localize('breakpointAdded', "Added breakpoint, line {0}, file {1}", bp.lineNumber, uri.fsPath)));
            }
            // In some cases we need to store breakpoints before we send them because sending them can take a long time
            // And after sending them because the debug adapter can attach adapter data to a breakpoint
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendBreakpoints(uri);
            this.debugStorage.storeBreakpoints(this.model);
            return breakpoints;
        }
        async updateBreakpoints(uri, data, sendOnResourceSaved) {
            this.model.updateBreakpoints(data);
            this.debugStorage.storeBreakpoints(this.model);
            if (sendOnResourceSaved) {
                this.breakpointsToSendOnResourceSaved.add(uri);
            }
            else {
                await this.sendBreakpoints(uri);
                this.debugStorage.storeBreakpoints(this.model);
            }
        }
        async removeBreakpoints(id) {
            const toRemove = this.model.getBreakpoints().filter(bp => !id || bp.getId() === id);
            toRemove.forEach(bp => aria.status(nls.localize('breakpointRemoved', "Removed breakpoint, line {0}, file {1}", bp.lineNumber, bp.uri.fsPath)));
            const urisToClear = (0, arrays_1.distinct)(toRemove, bp => bp.uri.toString()).map(bp => bp.uri);
            this.model.removeBreakpoints(toRemove);
            this.debugStorage.storeBreakpoints(this.model);
            await Promise.all(urisToClear.map(uri => this.sendBreakpoints(uri)));
        }
        setBreakpointsActivated(activated) {
            this.model.setBreakpointsActivated(activated);
            return this.sendAllBreakpoints();
        }
        addFunctionBreakpoint(name, id) {
            this.model.addFunctionBreakpoint(name || '', id);
        }
        async updateFunctionBreakpoint(id, update) {
            this.model.updateFunctionBreakpoint(id, update);
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendFunctionBreakpoints();
        }
        async removeFunctionBreakpoints(id) {
            this.model.removeFunctionBreakpoints(id);
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendFunctionBreakpoints();
        }
        async addDataBreakpoint(label, dataId, canPersist, accessTypes, accessType) {
            this.model.addDataBreakpoint(label, dataId, canPersist, accessTypes, accessType);
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendDataBreakpoints();
            this.debugStorage.storeBreakpoints(this.model);
        }
        async removeDataBreakpoints(id) {
            this.model.removeDataBreakpoints(id);
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendDataBreakpoints();
        }
        async addInstructionBreakpoint(address, offset, condition, hitCondition) {
            this.model.addInstructionBreakpoint(address, offset, condition, hitCondition);
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendInstructionBreakpoints();
            this.debugStorage.storeBreakpoints(this.model);
        }
        async removeInstructionBreakpoints(address) {
            this.model.removeInstructionBreakpoints(address);
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendInstructionBreakpoints();
        }
        setExceptionBreakpoints(data) {
            this.model.setExceptionBreakpoints(data);
            this.debugStorage.storeBreakpoints(this.model);
        }
        async setExceptionBreakpointCondition(exceptionBreakpoint, condition) {
            this.model.setExceptionBreakpointCondition(exceptionBreakpoint, condition);
            this.debugStorage.storeBreakpoints(this.model);
            await this.sendExceptionBreakpoints();
        }
        async sendAllBreakpoints(session) {
            await Promise.all((0, arrays_1.distinct)(this.model.getBreakpoints(), bp => bp.uri.toString()).map(bp => this.sendBreakpoints(bp.uri, false, session)));
            await this.sendFunctionBreakpoints(session);
            await this.sendDataBreakpoints(session);
            await this.sendInstructionBreakpoints(session);
            // send exception breakpoints at the end since some debug adapters rely on the order
            await this.sendExceptionBreakpoints(session);
        }
        async sendBreakpoints(modelUri, sourceModified = false, session) {
            const breakpointsToSend = this.model.getBreakpoints({ uri: modelUri, enabledOnly: true });
            await sendToOneOrAllSessions(this.model, session, async (s) => {
                if (!s.configuration.noDebug) {
                    await s.sendBreakpoints(modelUri, breakpointsToSend, sourceModified);
                }
            });
        }
        async sendFunctionBreakpoints(session) {
            const breakpointsToSend = this.model.getFunctionBreakpoints().filter(fbp => fbp.enabled && this.model.areBreakpointsActivated());
            await sendToOneOrAllSessions(this.model, session, async (s) => {
                if (s.capabilities.supportsFunctionBreakpoints && !s.configuration.noDebug) {
                    await s.sendFunctionBreakpoints(breakpointsToSend);
                }
            });
        }
        async sendDataBreakpoints(session) {
            const breakpointsToSend = this.model.getDataBreakpoints().filter(fbp => fbp.enabled && this.model.areBreakpointsActivated());
            await sendToOneOrAllSessions(this.model, session, async (s) => {
                if (s.capabilities.supportsDataBreakpoints && !s.configuration.noDebug) {
                    await s.sendDataBreakpoints(breakpointsToSend);
                }
            });
        }
        async sendInstructionBreakpoints(session) {
            const breakpointsToSend = this.model.getInstructionBreakpoints().filter(fbp => fbp.enabled && this.model.areBreakpointsActivated());
            await sendToOneOrAllSessions(this.model, session, async (s) => {
                if (s.capabilities.supportsInstructionBreakpoints && !s.configuration.noDebug) {
                    await s.sendInstructionBreakpoints(breakpointsToSend);
                }
            });
        }
        sendExceptionBreakpoints(session) {
            const enabledExceptionBps = this.model.getExceptionBreakpoints().filter(exb => exb.enabled);
            return sendToOneOrAllSessions(this.model, session, async (s) => {
                if (s.capabilities.supportsConfigurationDoneRequest && (!s.capabilities.exceptionBreakpointFilters || s.capabilities.exceptionBreakpointFilters.length === 0)) {
                    // Only call `setExceptionBreakpoints` as specified in dap protocol #90001
                    return;
                }
                if (!s.configuration.noDebug) {
                    await s.sendExceptionBreakpoints(enabledExceptionBps);
                }
            });
        }
        onFileChanges(fileChangesEvent) {
            const toRemove = this.model.getBreakpoints().filter(bp => fileChangesEvent.contains(bp.uri, 2 /* FileChangeType.DELETED */));
            if (toRemove.length) {
                this.model.removeBreakpoints(toRemove);
            }
            const toSend = [];
            for (const uri of this.breakpointsToSendOnResourceSaved) {
                if (fileChangesEvent.contains(uri, 0 /* FileChangeType.UPDATED */)) {
                    toSend.push(uri);
                }
            }
            for (const uri of toSend) {
                this.breakpointsToSendOnResourceSaved.delete(uri);
                this.sendBreakpoints(uri, true);
            }
        }
        async runTo(uri, lineNumber, column) {
            const focusedSession = this.getViewModel().focusedSession;
            if (this.state !== 2 /* State.Stopped */ || !focusedSession) {
                return;
            }
            const bpExists = !!(this.getModel().getBreakpoints({ column, lineNumber, uri }).length);
            let breakpointToRemove;
            let threadToContinue = this.getViewModel().focusedThread;
            if (!bpExists) {
                const addResult = await this.addAndValidateBreakpoints(uri, lineNumber, column);
                if (addResult.thread) {
                    threadToContinue = addResult.thread;
                }
                if (addResult.breakpoint) {
                    breakpointToRemove = addResult.breakpoint;
                }
            }
            if (!threadToContinue) {
                return;
            }
            const oneTimeListener = threadToContinue.session.onDidChangeState(() => {
                const state = focusedSession.state;
                if (state === 2 /* State.Stopped */ || state === 0 /* State.Inactive */) {
                    if (breakpointToRemove) {
                        this.removeBreakpoints(breakpointToRemove.getId());
                    }
                    oneTimeListener.dispose();
                }
            });
            await threadToContinue.continue();
        }
        async addAndValidateBreakpoints(uri, lineNumber, column) {
            const debugModel = this.getModel();
            const viewModel = this.getViewModel();
            const breakpoints = await this.addBreakpoints(uri, [{ lineNumber, column }], false);
            const breakpoint = breakpoints === null || breakpoints === void 0 ? void 0 : breakpoints[0];
            if (!breakpoint) {
                return { breakpoint: undefined, thread: viewModel.focusedThread };
            }
            // If the breakpoint was not initially verified, wait up to 2s for it to become so.
            // Inherently racey if multiple sessions can verify async, but not solvable...
            if (!breakpoint.verified) {
                let listener;
                await (0, async_1.raceTimeout)(new Promise(resolve => {
                    listener = debugModel.onDidChangeBreakpoints(() => {
                        if (breakpoint.verified) {
                            resolve();
                        }
                    });
                }), 2000);
                listener.dispose();
            }
            // Look at paused threads for sessions that verified this bp. Prefer, in order:
            let Score;
            (function (Score) {
                /** The focused thread */
                Score[Score["Focused"] = 0] = "Focused";
                /** Any other stopped thread of a session that verified the bp */
                Score[Score["Verified"] = 1] = "Verified";
                /** Any thread that verified and paused in the same file */
                Score[Score["VerifiedAndPausedInFile"] = 2] = "VerifiedAndPausedInFile";
                /** The focused thread if it verified the breakpoint */
                Score[Score["VerifiedAndFocused"] = 3] = "VerifiedAndFocused";
            })(Score || (Score = {}));
            let bestThread = viewModel.focusedThread;
            let bestScore = 0 /* Score.Focused */;
            for (const sessionId of breakpoint.sessionsThatVerified) {
                const session = debugModel.getSession(sessionId);
                if (!session) {
                    continue;
                }
                const threads = session.getAllThreads().filter(t => t.stopped);
                if (bestScore < 3 /* Score.VerifiedAndFocused */) {
                    if (viewModel.focusedThread && threads.includes(viewModel.focusedThread)) {
                        bestThread = viewModel.focusedThread;
                        bestScore = 3 /* Score.VerifiedAndFocused */;
                    }
                }
                if (bestScore < 2 /* Score.VerifiedAndPausedInFile */) {
                    const pausedInThisFile = threads.find(t => {
                        const top = t.getTopStackFrame();
                        return top && this.uriIdentityService.extUri.isEqual(top.source.uri, uri);
                    });
                    if (pausedInThisFile) {
                        bestThread = pausedInThisFile;
                        bestScore = 2 /* Score.VerifiedAndPausedInFile */;
                    }
                }
                if (bestScore < 1 /* Score.Verified */) {
                    bestThread = threads[0];
                    bestScore = 2 /* Score.VerifiedAndPausedInFile */;
                }
            }
            return { thread: bestThread, breakpoint };
        }
    };
    DebugService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, views_1.IViewsService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, notification_1.INotificationService),
        __param(5, dialogs_1.IDialogService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, lifecycle_2.ILifecycleService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, extensions_1.IExtensionService),
        __param(12, files_1.IFileService),
        __param(13, configuration_1.IConfigurationService),
        __param(14, extensionHostDebug_1.IExtensionHostDebugService),
        __param(15, activity_1.IActivityService),
        __param(16, commands_1.ICommandService),
        __param(17, quickInput_1.IQuickInputService),
        __param(18, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(19, uriIdentity_1.IUriIdentityService)
    ], DebugService);
    exports.DebugService = DebugService;
    function getStackFrameThreadAndSessionToFocus(model, stackFrame, thread, session, avoidSession) {
        if (!session) {
            if (stackFrame || thread) {
                session = stackFrame ? stackFrame.thread.session : thread.session;
            }
            else {
                const sessions = model.getSessions();
                const stoppedSession = sessions.find(s => s.state === 2 /* State.Stopped */);
                // Make sure to not focus session that is going down
                session = stoppedSession || sessions.find(s => s !== avoidSession && s !== (avoidSession === null || avoidSession === void 0 ? void 0 : avoidSession.parentSession)) || (sessions.length ? sessions[0] : undefined);
            }
        }
        if (!thread) {
            if (stackFrame) {
                thread = stackFrame.thread;
            }
            else {
                const threads = session ? session.getAllThreads() : undefined;
                const stoppedThread = threads && threads.find(t => t.stopped);
                thread = stoppedThread || (threads && threads.length ? threads[0] : undefined);
            }
        }
        if (!stackFrame && thread) {
            stackFrame = thread.getTopStackFrame();
        }
        return { session, thread, stackFrame };
    }
    exports.getStackFrameThreadAndSessionToFocus = getStackFrameThreadAndSessionToFocus;
    async function sendToOneOrAllSessions(model, session, send) {
        if (session) {
            await send(session);
        }
        else {
            await Promise.all(model.getSessions().map(s => send(s)));
        }
    }
});
//# sourceMappingURL=debugService.js.map