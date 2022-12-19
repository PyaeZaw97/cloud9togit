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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/canIUse", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/date", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/config/tabFocus", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalEnvironment", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/dnd", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/links/terminalLinkManager", "vs/workbench/contrib/terminal/browser/links/terminalLinkQuickpick", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalProcessManager", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/workbench/contrib/terminal/browser/terminalTypeAheadAddon", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/browser/widgets/environmentVariableInfoWidget", "vs/workbench/contrib/terminal/browser/widgets/widgetManager", "vs/workbench/contrib/terminal/browser/xterm/lineDataEventAddon", "vs/workbench/contrib/terminal/browser/xterm/navigationModeAddon", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminal/common/history", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, browser_1, canIUse_1, dnd_1, dom, keyboardEvent_1, scrollableElement_1, async_1, codicons_1, date_1, decorators_1, errors_1, event_1, labels_1, lifecycle_1, network_1, path, platform_1, types_1, uri_1, tabFocus_1, model_1, resolverService_1, nls, accessibility_1, clipboardService_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, keybinding_1, log_1, notification_1, productService_1, quickInput_1, storage_1, terminal_1, terminalEnvironment_1, colorRegistry_1, themeService_1, workspace_1, workspaceTrust_1, dnd_2, views_1, terminalLinkManager_1, terminalLinkQuickpick_1, terminalActions_1, terminalEditorInput_1, terminalIcon_1, terminalProcessManager_1, terminalStatusList_1, terminalTypeAheadAddon_1, terminalUri_1, environmentVariableInfoWidget_1, widgetManager_1, lineDataEventAddon_1, navigationModeAddon_1, xtermTerminal_1, terminalCapabilityStore_1, history_1, terminal_2, terminalContextKey_1, terminalStrings_1, editorService_1, environmentService_1, history_2, layoutService_1, pathService_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseExitResult = exports.TerminalLabelComputer = exports.TerminalInstance = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The maximum amount of milliseconds to wait for a container before starting to create the
         * terminal process. This period helps ensure the terminal has good initial dimensions to work
         * with if it's going to be a foreground terminal.
         */
        Constants[Constants["WaitForContainerThreshold"] = 100] = "WaitForContainerThreshold";
        Constants[Constants["DefaultCols"] = 80] = "DefaultCols";
        Constants[Constants["DefaultRows"] = 30] = "DefaultRows";
        Constants[Constants["MaxSupportedCols"] = 5000] = "MaxSupportedCols";
        Constants[Constants["MaxCanvasWidth"] = 8000] = "MaxCanvasWidth";
    })(Constants || (Constants = {}));
    let xtermConstructor;
    function getXtermConstructor() {
        if (xtermConstructor) {
            return xtermConstructor;
        }
        xtermConstructor = async_1.Promises.withAsyncBody(async (resolve) => {
            const Terminal = (await new Promise((resolve_1, reject_1) => { require(['xterm'], resolve_1, reject_1); })).Terminal;
            // Localize strings
            Terminal.strings.promptLabel = nls.localize('terminal.integrated.a11yPromptLabel', 'Terminal input');
            Terminal.strings.tooMuchOutput = nls.localize('terminal.integrated.a11yTooMuchOutput', 'Too much output to announce, navigate to rows manually to read');
            resolve(Terminal);
        });
        return xtermConstructor;
    }
    const scrollbarHeight = 5;
    let TerminalOutputProvider = class TerminalOutputProvider {
        constructor(textModelResolverService, _modelService) {
            this._modelService = _modelService;
            textModelResolverService.registerTextModelContentProvider(TerminalOutputProvider.scheme, this);
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            return this._modelService.createModel(resource.fragment, null, resource, false);
        }
    };
    TerminalOutputProvider.scheme = 'TERMINAL_OUTPUT';
    TerminalOutputProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], TerminalOutputProvider);
    let TerminalInstance = class TerminalInstance extends lifecycle_1.Disposable {
        constructor(_terminalFocusContextKey, _terminalHasFixedWidth, _terminalShellTypeContextKey, _terminalAltBufferActiveContextKey, _configHelper, _shellLaunchConfig, resource, _terminalProfileResolverService, _pathService, _contextKeyService, _keybindingService, _notificationService, _preferencesService, _viewsService, _instantiationService, _clipboardService, _themeService, _configurationService, _logService, _dialogService, _storageService, _accessibilityService, _productService, _quickInputService, workbenchEnvironmentService, _workspaceContextService, _editorService, _workspaceTrustRequestService, _historyService) {
            var _a, _b, _c, _d, _e;
            super();
            this._terminalFocusContextKey = _terminalFocusContextKey;
            this._terminalHasFixedWidth = _terminalHasFixedWidth;
            this._terminalShellTypeContextKey = _terminalShellTypeContextKey;
            this._terminalAltBufferActiveContextKey = _terminalAltBufferActiveContextKey;
            this._configHelper = _configHelper;
            this._shellLaunchConfig = _shellLaunchConfig;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._pathService = _pathService;
            this._contextKeyService = _contextKeyService;
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._preferencesService = _preferencesService;
            this._viewsService = _viewsService;
            this._instantiationService = _instantiationService;
            this._clipboardService = _clipboardService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._dialogService = _dialogService;
            this._storageService = _storageService;
            this._accessibilityService = _accessibilityService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._workspaceContextService = _workspaceContextService;
            this._editorService = _editorService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._historyService = _historyService;
            this._latestXtermWriteData = 0;
            this._latestXtermParseData = 0;
            this._title = '';
            this._titleSource = terminal_1.TitleEventSource.Process;
            this._cols = 0;
            this._rows = 0;
            this._cwd = undefined;
            this._initialCwd = undefined;
            this._layoutSettingsChanged = true;
            this._areLinksReady = false;
            this._initialDataEvents = [];
            this._widgetManager = this._instantiationService.createInstance(widgetManager_1.TerminalWidgetManager);
            this._processName = '';
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStoreMultiplexer();
            this.disableLayout = false;
            // The onExit event is special in that it fires and is disposed after the terminal instance
            // itself is disposed
            this._onExit = new event_1.Emitter();
            this.onExit = this._onExit.event;
            this._onDisposed = this._register(new event_1.Emitter());
            this.onDisposed = this._onDisposed.event;
            this._onProcessIdReady = this._register(new event_1.Emitter());
            this.onProcessIdReady = this._onProcessIdReady.event;
            this._onLinksReady = this._register(new event_1.Emitter());
            this.onLinksReady = this._onLinksReady.event;
            this._onTitleChanged = this._register(new event_1.Emitter());
            this.onTitleChanged = this._onTitleChanged.event;
            this._onIconChanged = this._register(new event_1.Emitter());
            this.onIconChanged = this._onIconChanged.event;
            this._onData = this._register(new event_1.Emitter());
            this.onData = this._onData.event;
            this._onBinary = this._register(new event_1.Emitter());
            this.onBinary = this._onBinary.event;
            this._onLineData = this._register(new event_1.Emitter());
            this.onLineData = this._onLineData.event;
            this._onRequestExtHostProcess = this._register(new event_1.Emitter());
            this.onRequestExtHostProcess = this._onRequestExtHostProcess.event;
            this._onDimensionsChanged = this._register(new event_1.Emitter());
            this.onDimensionsChanged = this._onDimensionsChanged.event;
            this._onMaximumDimensionsChanged = this._register(new event_1.Emitter());
            this.onMaximumDimensionsChanged = this._onMaximumDimensionsChanged.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidInputData = this._register(new event_1.Emitter());
            this.onDidInputData = this._onDidInputData.event;
            this._onRequestAddInstanceToGroup = this._register(new event_1.Emitter());
            this.onRequestAddInstanceToGroup = this._onRequestAddInstanceToGroup.event;
            this._onDidChangeHasChildProcesses = this._register(new event_1.Emitter());
            this.onDidChangeHasChildProcesses = this._onDidChangeHasChildProcesses.event;
            this._onDidChangeFindResults = new event_1.Emitter();
            this.onDidChangeFindResults = this._onDidChangeFindResults.event;
            this._skipTerminalCommands = [];
            this._isExiting = false;
            this._hadFocusOnExit = false;
            this._isVisible = false;
            this._isDisposed = false;
            this._instanceId = TerminalInstance._instanceIdCounter++;
            this._hasHadInput = false;
            this._titleReadyPromise = new Promise(c => {
                this._titleReadyComplete = c;
            });
            this._fixedRows = (_b = (_a = _shellLaunchConfig.attachPersistentProcess) === null || _a === void 0 ? void 0 : _a.fixedDimensions) === null || _b === void 0 ? void 0 : _b.rows;
            this._fixedCols = (_d = (_c = _shellLaunchConfig.attachPersistentProcess) === null || _c === void 0 ? void 0 : _c.fixedDimensions) === null || _d === void 0 ? void 0 : _d.cols;
            this._icon = ((_e = _shellLaunchConfig.attachPersistentProcess) === null || _e === void 0 ? void 0 : _e.icon) || _shellLaunchConfig.icon;
            // the resource is already set when it's been moved from another window
            this._resource = resource || (0, terminalUri_1.getTerminalUri)(this._workspaceContextService.getWorkspace().id, this.instanceId, this.title);
            if (this.shellLaunchConfig.cwd) {
                const cwdUri = typeof this._shellLaunchConfig.cwd === 'string' ? uri_1.URI.from({
                    scheme: network_1.Schemas.file,
                    path: this._shellLaunchConfig.cwd
                }) : this._shellLaunchConfig.cwd;
                if (cwdUri) {
                    this._workspaceFolder = (0, types_1.withNullAsUndefined)(this._workspaceContextService.getWorkspaceFolder(cwdUri));
                }
            }
            if (!this._workspaceFolder) {
                const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
                this._workspaceFolder = activeWorkspaceRootUri ? (0, types_1.withNullAsUndefined)(this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
            }
            this._terminalHasTextContextKey = terminalContextKey_1.TerminalContextKeys.textSelected.bindTo(this._contextKeyService);
            this._terminalA11yTreeFocusContextKey = terminalContextKey_1.TerminalContextKeys.a11yTreeFocus.bindTo(this._contextKeyService);
            this._terminalAltBufferActiveContextKey = terminalContextKey_1.TerminalContextKeys.altBufferActive.bindTo(this._contextKeyService);
            this._logService.trace(`terminalInstance#ctor (instanceId: ${this.instanceId})`, this._shellLaunchConfig);
            this._register(this.capabilities.onDidAddCapability(e => {
                var _a, _b;
                this._logService.debug('terminalInstance added capability', e);
                if (e === 0 /* TerminalCapability.CwdDetection */) {
                    (_a = this.capabilities.get(0 /* TerminalCapability.CwdDetection */)) === null || _a === void 0 ? void 0 : _a.onDidChangeCwd(e => {
                        var _a, _b;
                        this._cwd = e;
                        (_a = this._xtermOnKey) === null || _a === void 0 ? void 0 : _a.dispose();
                        this.refreshTabLabels(this.title, terminal_1.TitleEventSource.Config);
                        (_b = this._instantiationService.invokeFunction(history_1.getDirectoryHistory)) === null || _b === void 0 ? void 0 : _b.add(e, { remoteAuthority: this.remoteAuthority });
                    });
                }
                else if (e === 2 /* TerminalCapability.CommandDetection */) {
                    (_b = this.capabilities.get(2 /* TerminalCapability.CommandDetection */)) === null || _b === void 0 ? void 0 : _b.onCommandFinished(e => {
                        var _a;
                        if (e.command.trim().length > 0) {
                            (_a = this._instantiationService.invokeFunction(history_1.getCommandHistory)) === null || _a === void 0 ? void 0 : _a.add(e.command, { shellType: this._shellType });
                        }
                    });
                }
            }));
            this._register(this.capabilities.onDidRemoveCapability(e => this._logService.debug('terminalInstance removed capability', e)));
            // Resolve just the icon ahead of time so that it shows up immediately in the tabs. This is
            // disabled in remote because this needs to be sync and the OS may differ on the remote
            // which would result in the wrong profile being selected and the wrong icon being
            // permanently attached to the terminal.
            if (!this.shellLaunchConfig.executable && !workbenchEnvironmentService.remoteAuthority) {
                this._terminalProfileResolverService.resolveIcon(this._shellLaunchConfig, platform_1.OS);
            }
            // When a custom pty is used set the name immediately so it gets passed over to the exthost
            // and is available when Pseudoterminal.open fires.
            if (this.shellLaunchConfig.customPtyImplementation) {
                this.refreshTabLabels(this._shellLaunchConfig.name, terminal_1.TitleEventSource.Api);
            }
            this.statusList = this._instantiationService.createInstance(terminalStatusList_1.TerminalStatusList);
            this._initDimensions();
            this._processManager = this._createProcessManager();
            this._register((0, lifecycle_1.toDisposable)(() => { var _a; return (_a = this._dndObserver) === null || _a === void 0 ? void 0 : _a.dispose(); }));
            this._containerReadyBarrier = new async_1.AutoOpenBarrier(100 /* Constants.WaitForContainerThreshold */);
            this._attachBarrier = new async_1.AutoOpenBarrier(1000);
            this._xtermReadyPromise = this._createXterm();
            this._xtermReadyPromise.then(async () => {
                var _a;
                // Wait for a period to allow a container to be ready
                await this._containerReadyBarrier.wait();
                // Resolve the executable ahead of time if shell integration is enabled, this should not
                // be done for custom PTYs as that would cause extension Pseudoterminal-based terminals
                // to hang in resolver extensions
                if (!this.shellLaunchConfig.customPtyImplementation && ((_a = this._configHelper.config.shellIntegration) === null || _a === void 0 ? void 0 : _a.enabled) && !this.shellLaunchConfig.executable) {
                    const os = await this._processManager.getBackendOS();
                    this.shellLaunchConfig.executable = (await this._terminalProfileResolverService.getDefaultProfile({ remoteAuthority: this.remoteAuthority, os })).path;
                }
                await this._createProcess();
                // Re-establish the title after reconnect
                if (this.shellLaunchConfig.attachPersistentProcess) {
                    this.refreshTabLabels(this.shellLaunchConfig.attachPersistentProcess.title, this.shellLaunchConfig.attachPersistentProcess.titleSource);
                    this.setShellType(this.shellType);
                }
                if (this._fixedCols) {
                    await this._addScrollbar();
                }
            }).catch((err) => {
                // Ignore exceptions if the terminal is already disposed
                if (!this._isDisposed) {
                    throw err;
                }
            });
            this.addDisposable(this._configurationService.onDidChangeConfiguration(async (e) => {
                var _a;
                if (e.affectsConfiguration('terminal.integrated')) {
                    this.updateConfig();
                    this.setVisible(this._isVisible);
                }
                const layoutSettings = [
                    "terminal.integrated.fontSize" /* TerminalSettingId.FontSize */,
                    "terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */,
                    "terminal.integrated.fontWeight" /* TerminalSettingId.FontWeight */,
                    "terminal.integrated.fontWeightBold" /* TerminalSettingId.FontWeightBold */,
                    "terminal.integrated.letterSpacing" /* TerminalSettingId.LetterSpacing */,
                    "terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */,
                    'editor.fontFamily'
                ];
                if (layoutSettings.some(id => e.affectsConfiguration(id))) {
                    this._layoutSettingsChanged = true;
                    await this._resize();
                }
                if (e.affectsConfiguration("terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */)) {
                    this._updateUnicodeVersion();
                }
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    this.updateAccessibilitySupport();
                }
                if (e.affectsConfiguration("terminal.integrated.tabs.title" /* TerminalSettingId.TerminalTitle */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.separator" /* TerminalSettingId.TerminalTitleSeparator */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.description" /* TerminalSettingId.TerminalDescription */)) {
                    (_a = this._labelComputer) === null || _a === void 0 ? void 0 : _a.refreshLabel();
                }
            }));
            this._workspaceContextService.onDidChangeWorkspaceFolders(() => { var _a; return (_a = this._labelComputer) === null || _a === void 0 ? void 0 : _a.refreshLabel(); });
            // Clear out initial data events after 10 seconds, hopefully extension hosts are up and
            // running at that point.
            let initialDataEventsTimeout = window.setTimeout(() => {
                initialDataEventsTimeout = undefined;
                this._initialDataEvents = undefined;
            }, 10000);
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (initialDataEventsTimeout) {
                    window.clearTimeout(initialDataEventsTimeout);
                }
            }));
        }
        get target() { return this._target; }
        set target(value) {
            if (this.xterm) {
                this.xterm.target = value;
            }
            this._target = value;
        }
        get instanceId() { return this._instanceId; }
        get resource() { return this._resource; }
        get cols() {
            if (this._fixedCols !== undefined) {
                return this._fixedCols;
            }
            if (this._dimensionsOverride && this._dimensionsOverride.cols) {
                if (this._dimensionsOverride.forceExactSize) {
                    return this._dimensionsOverride.cols;
                }
                return Math.min(Math.max(this._dimensionsOverride.cols, 2), this._cols);
            }
            return this._cols;
        }
        get rows() {
            if (this._fixedRows !== undefined) {
                return this._fixedRows;
            }
            if (this._dimensionsOverride && this._dimensionsOverride.rows) {
                if (this._dimensionsOverride.forceExactSize) {
                    return this._dimensionsOverride.rows;
                }
                return Math.min(Math.max(this._dimensionsOverride.rows, 2), this._rows);
            }
            return this._rows;
        }
        get isDisposed() { return this._isDisposed; }
        get fixedCols() { return this._fixedCols; }
        get fixedRows() { return this._fixedRows; }
        get maxCols() { return this._cols; }
        get maxRows() { return this._rows; }
        // TODO: Ideally processId would be merged into processReady
        get processId() { return this._processManager.shellProcessId; }
        // TODO: How does this work with detached processes?
        // TODO: Should this be an event as it can fire twice?
        get processReady() { return this._processManager.ptyProcessReady; }
        get hasChildProcesses() { var _a; return ((_a = this.shellLaunchConfig.attachPersistentProcess) === null || _a === void 0 ? void 0 : _a.hasChildProcesses) || this._processManager.hasChildProcesses; }
        get areLinksReady() { return this._areLinksReady; }
        get initialDataEvents() { return this._initialDataEvents; }
        get exitCode() { return this._exitCode; }
        get hadFocusOnExit() { return this._hadFocusOnExit; }
        get isTitleSetByProcess() { return !!this._messageTitleDisposable; }
        get shellLaunchConfig() { return this._shellLaunchConfig; }
        get shellType() { return this._shellType; }
        get navigationMode() { return this._navigationModeAddon; }
        get isDisconnected() { return this._processManager.isDisconnected; }
        get isRemote() { return this._processManager.remoteAuthority !== undefined; }
        get remoteAuthority() { return this._processManager.remoteAuthority; }
        get hasFocus() { var _a, _b; return (_b = (_a = this._wrapperElement) === null || _a === void 0 ? void 0 : _a.contains(document.activeElement)) !== null && _b !== void 0 ? _b : false; }
        get title() { return this._title; }
        get titleSource() { return this._titleSource; }
        get icon() { return this._getIcon(); }
        get color() { return this._getColor(); }
        get processName() { return this._processName; }
        get sequence() { return this._sequence; }
        get staticTitle() { return this._staticTitle; }
        get workspaceFolder() { return this._workspaceFolder; }
        get cwd() { return this._cwd; }
        get initialCwd() { return this._initialCwd; }
        get description() {
            if (this._description) {
                return this._description;
            }
            else if (this._shellLaunchConfig.type) {
                if (this._shellLaunchConfig.type === 'Task') {
                    return nls.localize('terminalTypeTask', "Task");
                }
                else {
                    return nls.localize('terminalTypeLocal', "Local");
                }
            }
            return undefined;
        }
        get userHome() { return this._userHome; }
        _getIcon() {
            if (!this._icon) {
                this._icon = this._processManager.processState >= 2 /* ProcessState.Launching */ ? codicons_1.Codicon.terminal : undefined;
            }
            return this._icon;
        }
        _getColor() {
            var _a, _b;
            if (this.shellLaunchConfig.color) {
                return this.shellLaunchConfig.color;
            }
            if ((_b = (_a = this.shellLaunchConfig) === null || _a === void 0 ? void 0 : _a.attachPersistentProcess) === null || _b === void 0 ? void 0 : _b.color) {
                return this.shellLaunchConfig.attachPersistentProcess.color;
            }
            if (this._processManager.processState >= 2 /* ProcessState.Launching */) {
                return undefined;
            }
            return undefined;
        }
        addDisposable(disposable) {
            this._register(disposable);
        }
        _initDimensions() {
            // The terminal panel needs to have been created to get the real view dimensions
            if (!this._container) {
                // Set the fallback dimensions if not
                this._cols = 80;
                this._rows = 30;
                return;
            }
            const computedStyle = window.getComputedStyle(this._container);
            const width = parseInt(computedStyle.width);
            const height = parseInt(computedStyle.height);
            this._evaluateColsAndRows(width, height);
        }
        /**
         * Evaluates and sets the cols and rows of the terminal if possible.
         * @param width The width of the container.
         * @param height The height of the container.
         * @return The terminal's width if it requires a layout.
         */
        _evaluateColsAndRows(width, height) {
            // Ignore if dimensions are undefined or 0
            if (!width || !height) {
                this._setLastKnownColsAndRows();
                return null;
            }
            const dimension = this._getDimension(width, height);
            if (!dimension) {
                this._setLastKnownColsAndRows();
                return null;
            }
            const font = this.xterm ? this.xterm.getFont() : this._configHelper.getFont();
            if (!font.charWidth || !font.charHeight) {
                this._setLastKnownColsAndRows();
                return null;
            }
            // Because xterm.js converts from CSS pixels to actual pixels through
            // the use of canvas, window.devicePixelRatio needs to be used here in
            // order to be precise. font.charWidth/charHeight alone as insufficient
            // when window.devicePixelRatio changes.
            const scaledWidthAvailable = dimension.width * window.devicePixelRatio;
            const scaledCharWidth = font.charWidth * window.devicePixelRatio + font.letterSpacing;
            const newCols = Math.max(Math.floor(scaledWidthAvailable / scaledCharWidth), 1);
            const scaledHeightAvailable = dimension.height * window.devicePixelRatio;
            const scaledCharHeight = Math.ceil(font.charHeight * window.devicePixelRatio);
            const scaledLineHeight = Math.floor(scaledCharHeight * font.lineHeight);
            const newRows = Math.max(Math.floor(scaledHeightAvailable / scaledLineHeight), 1);
            if (this._cols !== newCols || this._rows !== newRows) {
                this._cols = newCols;
                this._rows = newRows;
                this._fireMaximumDimensionsChanged();
            }
            return dimension.width;
        }
        _setLastKnownColsAndRows() {
            if (TerminalInstance._lastKnownGridDimensions) {
                this._cols = TerminalInstance._lastKnownGridDimensions.cols;
                this._rows = TerminalInstance._lastKnownGridDimensions.rows;
            }
        }
        _fireMaximumDimensionsChanged() {
            this._onMaximumDimensionsChanged.fire();
        }
        _getDimension(width, height) {
            var _a;
            // The font needs to have been initialized
            const font = this.xterm ? this.xterm.getFont() : this._configHelper.getFont();
            if (!font || !font.charWidth || !font.charHeight) {
                return undefined;
            }
            if (!this._wrapperElement || !((_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.element)) {
                return undefined;
            }
            const computedStyle = window.getComputedStyle(this.xterm.raw.element);
            const horizontalPadding = parseInt(computedStyle.paddingLeft) + parseInt(computedStyle.paddingRight);
            const verticalPadding = parseInt(computedStyle.paddingTop) + parseInt(computedStyle.paddingBottom);
            TerminalInstance._lastKnownCanvasDimensions = new dom.Dimension(Math.min(8000 /* Constants.MaxCanvasWidth */, width - horizontalPadding), height + (this._hasScrollBar && !this._horizontalScrollbar ? -scrollbarHeight : 0) - 2 /* bottom padding */ - verticalPadding);
            return TerminalInstance._lastKnownCanvasDimensions;
        }
        get persistentProcessId() { return this._processManager.persistentProcessId; }
        get shouldPersist() { return this._processManager.shouldPersist && !this.shellLaunchConfig.isTransient; }
        /**
         * Create xterm.js instance and attach data listeners.
         */
        async _createXterm() {
            const Terminal = await getXtermConstructor();
            if (this._isDisposed) {
                throw new errors_1.ErrorNoTelemetry('Terminal disposed of during xterm.js creation');
            }
            const xterm = this._instantiationService.createInstance(xtermTerminal_1.XtermTerminal, Terminal, this._configHelper, this._cols, this._rows, this.target || terminal_1.TerminalLocation.Panel, this.capabilities);
            this.xterm = xterm;
            const lineDataEventAddon = new lineDataEventAddon_1.LineDataEventAddon();
            this.xterm.raw.loadAddon(lineDataEventAddon);
            this.updateAccessibilitySupport();
            this.xterm.onDidRequestRunCommand(e => {
                if (e.copyAsHtml) {
                    this.copySelection(true, e.command);
                }
                else {
                    this.sendText(e.command.command, true);
                }
            });
            // Write initial text, deferring onLineFeed listener when applicable to avoid firing
            // onLineData events containing initialText
            if (this._shellLaunchConfig.initialText) {
                this.xterm.raw.writeln(this._shellLaunchConfig.initialText, () => {
                    lineDataEventAddon.onLineData(e => this._onLineData.fire(e));
                });
            }
            else {
                lineDataEventAddon.onLineData(e => this._onLineData.fire(e));
            }
            // Delay the creation of the bell listener to avoid showing the bell when the terminal
            // starts up or reconnects
            setTimeout(() => {
                xterm.raw.onBell(() => {
                    if (this._configHelper.config.enableBell) {
                        this.statusList.add({
                            id: "bell" /* TerminalStatus.Bell */,
                            severity: notification_1.Severity.Warning,
                            icon: codicons_1.Codicon.bell,
                            tooltip: nls.localize('bellStatus', "Bell")
                        }, this._configHelper.config.bellDuration);
                    }
                });
            }, 1000);
            this._xtermOnKey = xterm.raw.onKey(e => this._onKey(e.key, e.domEvent));
            xterm.raw.onSelectionChange(async () => this._onSelectionChange());
            xterm.raw.buffer.onBufferChange(() => this._refreshAltBufferContextKey());
            this._processManager.onProcessData(e => this._onProcessData(e));
            xterm.raw.onData(async (data) => {
                await this._processManager.write(data);
                this._onDidInputData.fire(this);
            });
            xterm.raw.onBinary(data => this._processManager.processBinary(data));
            this.processReady.then(async () => {
                if (this._linkManager) {
                    this._linkManager.processCwd = await this._processManager.getInitialCwd();
                }
            });
            // Init winpty compat and link handler after process creation as they rely on the
            // underlying process OS
            this._processManager.onProcessReady(async (processTraits) => {
                // If links are ready, do not re-create the manager.
                if (this._areLinksReady) {
                    return;
                }
                if (this._processManager.os) {
                    lineDataEventAddon.setOperatingSystem(this._processManager.os);
                }
                if (this._processManager.os === 1 /* OperatingSystem.Windows */) {
                    xterm.raw.options.windowsMode = processTraits.requiresWindowsMode || false;
                }
                this._linkManager = this._instantiationService.createInstance(terminalLinkManager_1.TerminalLinkManager, xterm.raw, this._processManager, this.capabilities);
                this._areLinksReady = true;
                this._onLinksReady.fire(this);
            });
            this._processManager.onRestoreCommands(e => { var _a; return (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.shellIntegration.deserialize(e); });
            this._loadTypeAheadAddon(xterm);
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.localEchoEnabled" /* TerminalSettingId.LocalEchoEnabled */)) {
                    this._loadTypeAheadAddon(xterm);
                }
            });
            this._pathService.userHome().then(userHome => {
                this._userHome = userHome.fsPath;
            });
            return xterm;
        }
        _loadTypeAheadAddon(xterm) {
            var _a;
            const enabled = this._configHelper.config.localEchoEnabled;
            const isRemote = !!this.remoteAuthority;
            if (enabled === 'off' || enabled === 'auto' && !isRemote) {
                return (_a = this._xtermTypeAheadAddon) === null || _a === void 0 ? void 0 : _a.dispose();
            }
            if (this._xtermTypeAheadAddon) {
                return;
            }
            if (enabled === 'on' || (enabled === 'auto' && isRemote)) {
                this._xtermTypeAheadAddon = this._register(this._instantiationService.createInstance(terminalTypeAheadAddon_1.TypeAheadAddon, this._processManager, this._configHelper));
                xterm.raw.loadAddon(this._xtermTypeAheadAddon);
            }
        }
        async showLinkQuickpick() {
            if (!this._terminalLinkQuickpick) {
                this._terminalLinkQuickpick = this._instantiationService.createInstance(terminalLinkQuickpick_1.TerminalLinkQuickpick);
            }
            const links = await this._getLinks();
            if (!links) {
                return;
            }
            return await this._terminalLinkQuickpick.show(links);
        }
        async _getLinks() {
            if (!this.areLinksReady || !this._linkManager) {
                throw new Error('terminal links are not ready, cannot generate link quick pick');
            }
            if (!this.xterm) {
                throw new Error('no xterm');
            }
            return this._linkManager.getLinks();
        }
        async openRecentLink(type) {
            if (!this.areLinksReady || !this._linkManager) {
                throw new Error('terminal links are not ready, cannot open a link');
            }
            if (!this.xterm) {
                throw new Error('no xterm');
            }
            this._linkManager.openRecentLink(type);
        }
        async runRecent(type) {
            var _a;
            if (!this.xterm) {
                return;
            }
            let items = [];
            const commandMap = new Set();
            const removeFromCommandHistoryButton = {
                iconClass: themeService_1.ThemeIcon.asClassName(codicons_1.Codicon.close),
                tooltip: nls.localize('removeCommand', "Remove from Command History")
            };
            if (type === 'command') {
                const cmdDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
                const commands = cmdDetection === null || cmdDetection === void 0 ? void 0 : cmdDetection.commands;
                // Current session history
                const executingCommand = cmdDetection === null || cmdDetection === void 0 ? void 0 : cmdDetection.executingCommand;
                if (executingCommand) {
                    commandMap.add(executingCommand);
                }
                if (commands && commands.length > 0) {
                    for (const entry of commands) {
                        // trim off any whitespace and/or line endings
                        const label = entry.command.trim();
                        if (label.length === 0 || commandMap.has(label)) {
                            continue;
                        }
                        let description = `${entry.cwd}`;
                        if (entry.exitCode) {
                            // Since you cannot get the last command's exit code on pwsh, just whether it failed
                            // or not, -1 is treated specially as simply failed
                            if (entry.exitCode === -1) {
                                description += ' failed';
                            }
                            else {
                                description += ` exitCode: ${entry.exitCode}`;
                            }
                        }
                        description = description.trim();
                        const iconClass = themeService_1.ThemeIcon.asClassName(codicons_1.Codicon.output);
                        const buttons = [{
                                iconClass,
                                tooltip: nls.localize('viewCommandOutput', "View Command Output"),
                                alwaysVisible: false
                            }];
                        // Merge consecutive commands
                        const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
                        if ((lastItem === null || lastItem === void 0 ? void 0 : lastItem.type) !== 'separator' && (lastItem === null || lastItem === void 0 ? void 0 : lastItem.label) === label) {
                            lastItem.id = entry.timestamp.toString();
                            lastItem.description = description;
                            continue;
                        }
                        items.push({
                            label,
                            description,
                            id: entry.timestamp.toString(),
                            command: entry,
                            buttons: entry.hasOutput ? buttons : undefined
                        });
                        commandMap.add(label);
                    }
                    items = items.reverse();
                }
                if (executingCommand) {
                    items.unshift({
                        label: executingCommand,
                        description: cmdDetection.cwd
                    });
                }
                if (items.length > 0) {
                    items.unshift({ type: 'separator', label: terminalStrings_1.terminalStrings.currentSessionCategory });
                }
                // Gather previous session history
                const history = this._instantiationService.invokeFunction(history_1.getCommandHistory);
                const previousSessionItems = [];
                for (const [label, info] of history.entries) {
                    // Only add previous session item if it's not in this session
                    if (!commandMap.has(label) && info.shellType === this.shellType) {
                        previousSessionItems.unshift({
                            label,
                            buttons: [removeFromCommandHistoryButton]
                        });
                    }
                }
                if (previousSessionItems.length > 0) {
                    items.push({ type: 'separator', label: terminalStrings_1.terminalStrings.previousSessionCategory }, ...previousSessionItems);
                }
            }
            else {
                const cwds = ((_a = this.capabilities.get(0 /* TerminalCapability.CwdDetection */)) === null || _a === void 0 ? void 0 : _a.cwds) || [];
                if (cwds && cwds.length > 0) {
                    for (const label of cwds) {
                        items.push({ label });
                    }
                    items = items.reverse();
                    items.unshift({ type: 'separator', label: terminalStrings_1.terminalStrings.currentSessionCategory });
                }
                // Gather previous session history
                const history = this._instantiationService.invokeFunction(history_1.getDirectoryHistory);
                const previousSessionItems = [];
                // Only add previous session item if it's not in this session and it matches the remote authority
                for (const [label, info] of history.entries) {
                    if ((info === null || info.remoteAuthority === this.remoteAuthority) && !cwds.includes(label)) {
                        previousSessionItems.unshift({
                            label,
                            buttons: [removeFromCommandHistoryButton]
                        });
                    }
                }
                if (previousSessionItems.length > 0) {
                    items.push({ type: 'separator', label: terminalStrings_1.terminalStrings.previousSessionCategory }, ...previousSessionItems);
                }
            }
            if (items.length === 0) {
                return;
            }
            const outputProvider = this._instantiationService.createInstance(TerminalOutputProvider);
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.items = items;
            return new Promise(r => {
                quickPick.onDidTriggerItemButton(async (e) => {
                    var _a, _b;
                    if (e.button === removeFromCommandHistoryButton) {
                        if (type === 'command') {
                            (_a = this._instantiationService.invokeFunction(history_1.getCommandHistory)) === null || _a === void 0 ? void 0 : _a.remove(e.item.label);
                        }
                        else {
                            (_b = this._instantiationService.invokeFunction(history_1.getDirectoryHistory)) === null || _b === void 0 ? void 0 : _b.remove(e.item.label);
                        }
                    }
                    else {
                        const selectedCommand = e.item.command;
                        const output = selectedCommand === null || selectedCommand === void 0 ? void 0 : selectedCommand.getOutput();
                        if (output && (selectedCommand === null || selectedCommand === void 0 ? void 0 : selectedCommand.command)) {
                            const textContent = await outputProvider.provideTextContent(uri_1.URI.from({
                                scheme: TerminalOutputProvider.scheme,
                                path: `${selectedCommand.command}... ${(0, date_1.fromNow)(selectedCommand.timestamp, true)}`,
                                fragment: output,
                                query: `terminal-output-${selectedCommand.timestamp}-${this.instanceId}`
                            }));
                            if (textContent) {
                                await this._editorService.openEditor({
                                    resource: textContent.uri
                                });
                            }
                        }
                    }
                    quickPick.hide();
                });
                quickPick.onDidAccept(e => {
                    const result = quickPick.activeItems[0];
                    this.sendText(type === 'cwd' ? `cd ${result.label}` : result.label, true);
                    quickPick.hide();
                });
                quickPick.show();
                quickPick.onDidHide(() => r());
            });
        }
        detachFromElement() {
            var _a;
            (_a = this._wrapperElement) === null || _a === void 0 ? void 0 : _a.remove();
            this._container = undefined;
        }
        attachToElement(container) {
            var _a;
            // The container did not change, do nothing
            if (this._container === container) {
                return;
            }
            this._attachBarrier.open();
            // Attach has not occurred yet
            if (!this._wrapperElement) {
                return this._attachToElement(container);
            }
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.attachToElement(this._wrapperElement);
            // The container changed, reattach
            this._container = container;
            this._container.appendChild(this._wrapperElement);
            setTimeout(() => this._initDragAndDrop(container));
        }
        async _attachToElement(container) {
            if (this._wrapperElement) {
                throw new Error('The terminal instance has already been attached to a container');
            }
            this._container = container;
            this._wrapperElement = document.createElement('div');
            this._wrapperElement.classList.add('terminal-wrapper');
            const xtermElement = document.createElement('div');
            this._wrapperElement.appendChild(xtermElement);
            this._container.appendChild(this._wrapperElement);
            const xterm = await this._xtermReadyPromise;
            // Attach the xterm object to the DOM, exposing it to the smoke tests
            this._wrapperElement.xterm = xterm.raw;
            const screenElement = xterm.attachToElement(xtermElement);
            xterm.onDidChangeFindResults((results) => this._onDidChangeFindResults.fire(results));
            if (!xterm.raw.element || !xterm.raw.textarea) {
                throw new Error('xterm elements not set after open');
            }
            this._setAriaLabel(xterm.raw, this._instanceId, this._title);
            xterm.raw.attachCustomKeyEventHandler((event) => {
                // Disable all input if the terminal is exiting
                if (this._isExiting) {
                    return false;
                }
                const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(event);
                const resolveResult = this._keybindingService.softDispatch(standardKeyboardEvent, standardKeyboardEvent.target);
                // Respect chords if the allowChords setting is set and it's not Escape. Escape is
                // handled specially for Zen Mode's Escape, Escape chord, plus it's important in
                // terminals generally
                const isValidChord = (resolveResult === null || resolveResult === void 0 ? void 0 : resolveResult.enterChord) && this._configHelper.config.allowChords && event.key !== 'Escape';
                if (this._keybindingService.inChordMode || isValidChord) {
                    event.preventDefault();
                    return false;
                }
                const SHOW_TERMINAL_CONFIG_PROMPT_KEY = 'terminal.integrated.showTerminalConfigPrompt';
                const EXCLUDED_KEYS = ['RightArrow', 'LeftArrow', 'UpArrow', 'DownArrow', 'Space', 'Meta', 'Control', 'Shift', 'Alt', '', 'Delete', 'Backspace', 'Tab'];
                // only keep track of input if prompt hasn't already been shown
                if (this._storageService.getBoolean(SHOW_TERMINAL_CONFIG_PROMPT_KEY, 0 /* StorageScope.GLOBAL */, true) &&
                    !EXCLUDED_KEYS.includes(event.key) &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey) {
                    this._hasHadInput = true;
                }
                // for keyboard events that resolve to commands described
                // within commandsToSkipShell, either alert or skip processing by xterm.js
                if (resolveResult && resolveResult.commandId && this._skipTerminalCommands.some(k => k === resolveResult.commandId) && !this._configHelper.config.sendKeybindingsToShell) {
                    // don't alert when terminal is opened or closed
                    if (this._storageService.getBoolean(SHOW_TERMINAL_CONFIG_PROMPT_KEY, 0 /* StorageScope.GLOBAL */, true) &&
                        this._hasHadInput &&
                        !terminal_2.TERMINAL_CREATION_COMMANDS.includes(resolveResult.commandId)) {
                        this._notificationService.prompt(notification_1.Severity.Info, nls.localize('keybindingHandling', "Some keybindings don't go to the terminal by default and are handled by {0} instead.", this._productService.nameLong), [
                            {
                                label: nls.localize('configureTerminalSettings', "Configure Terminal Settings"),
                                run: () => {
                                    this._preferencesService.openSettings({ jsonEditor: false, query: `@id:${"terminal.integrated.commandsToSkipShell" /* TerminalSettingId.CommandsToSkipShell */},${"terminal.integrated.sendKeybindingsToShell" /* TerminalSettingId.SendKeybindingsToShell */},${"terminal.integrated.allowChords" /* TerminalSettingId.AllowChords */}` });
                                }
                            }
                        ]);
                        this._storageService.store(SHOW_TERMINAL_CONFIG_PROMPT_KEY, false, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                    }
                    event.preventDefault();
                    return false;
                }
                // Skip processing by xterm.js of keyboard events that match menu bar mnemonics
                if (this._configHelper.config.allowMnemonics && !platform_1.isMacintosh && event.altKey) {
                    return false;
                }
                // If tab focus mode is on, tab is not passed to the terminal
                if (tabFocus_1.TabFocus.getTabFocusMode() && event.keyCode === 9) {
                    return false;
                }
                // Always have alt+F4 skip the terminal on Windows and allow it to be handled by the
                // system
                if (platform_1.isWindows && event.altKey && event.key === 'F4' && !event.ctrlKey) {
                    return false;
                }
                // Fallback to force ctrl+v to paste on browsers that do not support
                // navigator.clipboard.readText
                if (!canIUse_1.BrowserFeatures.clipboard.readText && event.key === 'v' && event.ctrlKey) {
                    return false;
                }
                return true;
            });
            this._register(dom.addDisposableListener(xterm.raw.element, 'mousedown', () => {
                // We need to listen to the mouseup event on the document since the user may release
                // the mouse button anywhere outside of _xterm.element.
                const listener = dom.addDisposableListener(document, 'mouseup', () => {
                    // Delay with a setTimeout to allow the mouseup to propagate through the DOM
                    // before evaluating the new selection state.
                    setTimeout(() => this._refreshSelectionContextKey(), 0);
                    listener.dispose();
                });
            }));
            this._register(dom.addDisposableListener(xterm.raw.element, 'touchstart', () => {
                xterm.raw.focus();
            }));
            // xterm.js currently drops selection on keyup as we need to handle this case.
            this._register(dom.addDisposableListener(xterm.raw.element, 'keyup', () => {
                // Wait until keyup has propagated through the DOM before evaluating
                // the new selection state.
                setTimeout(() => this._refreshSelectionContextKey(), 0);
            }));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'focus', () => {
                this._terminalFocusContextKey.set(true);
                this._onDidFocus.fire(this);
            }));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'blur', () => {
                this._terminalFocusContextKey.reset();
                this._onDidBlur.fire(this);
                this._refreshSelectionContextKey();
            }));
            this._initDragAndDrop(container);
            this._widgetManager.attachToElement(screenElement);
            this._processManager.onProcessReady((e) => {
                var _a;
                (_a = this._linkManager) === null || _a === void 0 ? void 0 : _a.setWidgetManager(this._widgetManager);
            });
            // const computedStyle = window.getComputedStyle(this._container);
            // const computedStyle = window.getComputedStyle(this._container.parentElement!);
            // const width = parseInt(computedStyle.getPropertyValue('width').replace('px', ''), 10);
            // const height = parseInt(computedStyle.getPropertyValue('height').replace('px', ''), 10);
            if (this._lastLayoutDimensions) {
                this.layout(this._lastLayoutDimensions);
            }
            this.setVisible(this._isVisible);
            this.updateConfig();
            // If IShellLaunchConfig.waitOnExit was true and the process finished before the terminal
            // panel was initialized.
            if (xterm.raw.getOption('disableStdin')) {
                this._attachPressAnyKeyToCloseListener(xterm.raw);
            }
        }
        _initDragAndDrop(container) {
            var _a;
            (_a = this._dndObserver) === null || _a === void 0 ? void 0 : _a.dispose();
            const dndController = this._instantiationService.createInstance(TerminalInstanceDragAndDropController, container);
            dndController.onDropTerminal(e => this._onRequestAddInstanceToGroup.fire(e));
            dndController.onDropFile(async (path) => {
                this.focus();
                await this.sendPath(path, false);
            });
            this._dndObserver = new dom.DragAndDropObserver(container, dndController);
        }
        hasSelection() {
            return this.xterm ? this.xterm.raw.hasSelection() : false;
        }
        async copySelection(asHtml, command) {
            const xterm = await this._xtermReadyPromise;
            if (this.hasSelection() || (asHtml && command)) {
                if (asHtml) {
                    const textAsHtml = await xterm.getSelectionAsHtml(command);
                    function listener(e) {
                        if (!e.clipboardData.types.includes('text/plain')) {
                            e.clipboardData.setData('text/plain', command === null || command === void 0 ? void 0 : command.getOutput());
                        }
                        e.clipboardData.setData('text/html', textAsHtml);
                        e.preventDefault();
                    }
                    document.addEventListener('copy', listener);
                    document.execCommand('copy');
                    document.removeEventListener('copy', listener);
                }
                else {
                    await this._clipboardService.writeText(xterm.raw.getSelection());
                }
            }
            else {
                this._notificationService.warn(nls.localize('terminal.integrated.copySelection.noSelection', 'The terminal has no selection to copy'));
            }
        }
        get selection() {
            return this.xterm && this.hasSelection() ? this.xterm.raw.getSelection() : undefined;
        }
        clearSelection() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.clearSelection();
        }
        selectAll() {
            var _a, _b;
            // Focus here to ensure the terminal context key is set
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.focus();
            (_b = this.xterm) === null || _b === void 0 ? void 0 : _b.raw.selectAll();
        }
        notifyFindWidgetFocusChanged(isFocused) {
            if (!this.xterm) {
                return;
            }
            const terminalFocused = !isFocused && (document.activeElement === this.xterm.raw.textarea || document.activeElement === this.xterm.raw.element);
            this._terminalFocusContextKey.set(terminalFocused);
        }
        _refreshAltBufferContextKey() {
            this._terminalAltBufferActiveContextKey.set(!!(this.xterm && this.xterm.raw.buffer.active === this.xterm.raw.buffer.alternate));
        }
        async _shouldPasteText(text) {
            var _a;
            // Ignore check if the shell is in bracketed paste mode (ie. the shell can handle multi-line
            // text).
            if ((_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.modes.bracketedPasteMode) {
                return true;
            }
            const textForLines = text.split(/\r?\n/);
            // Ignore check when a command is copied with a trailing new line
            if (textForLines.length === 2 && textForLines[1].trim().length === 0) {
                return true;
            }
            // If the clipboard has only one line, no prompt will be triggered
            if (textForLines.length === 1 || !this._configurationService.getValue("terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */)) {
                return true;
            }
            const displayItemsCount = 3;
            const maxPreviewLineLength = 30;
            let detail = nls.localize('preview', "Preview:");
            for (let i = 0; i < Math.min(textForLines.length, displayItemsCount); i++) {
                const line = textForLines[i];
                const cleanedLine = line.length > maxPreviewLineLength ? `${line.slice(0, maxPreviewLineLength)}…` : line;
                detail += `\n${cleanedLine}`;
            }
            if (textForLines.length > displayItemsCount) {
                detail += `\n…`;
            }
            const confirmation = await this._dialogService.confirm({
                type: 'question',
                message: nls.localize('confirmMoveTrashMessageFilesAndDirectories', "Are you sure you want to paste {0} lines of text into the terminal?", textForLines.length),
                detail,
                primaryButton: nls.localize({ key: 'multiLinePasteButton', comment: ['&& denotes a mnemonic'] }, "&&Paste"),
                checkbox: {
                    label: nls.localize('doNotAskAgain', "Do not ask me again")
                }
            });
            if (confirmation.confirmed && confirmation.checkboxChecked) {
                await this._configurationService.updateValue("terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */, false);
            }
            return confirmation.confirmed;
        }
        dispose(immediate) {
            var _a, _b;
            this._logService.trace(`terminalInstance#dispose (instanceId: ${this.instanceId})`);
            (0, lifecycle_1.dispose)(this._linkManager);
            this._linkManager = undefined;
            (0, lifecycle_1.dispose)(this._widgetManager);
            if ((_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.element) {
                this._hadFocusOnExit = this.hasFocus;
            }
            if (this._wrapperElement) {
                if (this._wrapperElement.xterm) {
                    this._wrapperElement.xterm = undefined;
                }
                if (this._horizontalScrollbar) {
                    this._horizontalScrollbar.dispose();
                    this._horizontalScrollbar = undefined;
                }
            }
            (_b = this.xterm) === null || _b === void 0 ? void 0 : _b.dispose();
            // HACK: Workaround for Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=559561,
            // as 'blur' event in xterm.raw.textarea is not triggered on xterm.dispose()
            // See https://github.com/microsoft/vscode/issues/138358
            if (browser_1.isFirefox) {
                this._terminalFocusContextKey.reset();
                this._terminalHasTextContextKey.reset();
                this._onDidBlur.fire(this);
            }
            if (this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener.dispose();
                this._pressAnyKeyToCloseListener = undefined;
            }
            this._processManager.dispose(immediate);
            // Process manager dispose/shutdown doesn't fire process exit, trigger with undefined if it
            // hasn't happened yet
            this._onProcessExit(undefined);
            if (!this._isDisposed) {
                this._isDisposed = true;
                this._onDisposed.fire(this);
            }
            super.dispose();
        }
        async detachFromProcess() {
            // Detach the process and dispose the instance, without the instance dispose the terminal
            // won't go away
            await this._processManager.detachFromProcess();
            this.dispose();
        }
        focus(force) {
            this._refreshAltBufferContextKey();
            if (!this.xterm) {
                return;
            }
            const selection = window.getSelection();
            if (!selection) {
                return;
            }
            const text = selection.toString();
            if (!text || force) {
                this.xterm.raw.focus();
            }
        }
        async focusWhenReady(force) {
            await this._xtermReadyPromise;
            await this._attachBarrier.wait();
            this.focus(force);
        }
        async paste() {
            if (!this.xterm) {
                return;
            }
            let currentText = await this._clipboardService.readText();
            if (!await this._shouldPasteText(currentText)) {
                return;
            }
            this.focus();
            this.xterm.raw.paste(currentText);
        }
        async pasteSelection() {
            if (!this.xterm) {
                return;
            }
            let currentText = await this._clipboardService.readText('selection');
            if (!await this._shouldPasteText(currentText)) {
                return;
            }
            this.focus();
            this.xterm.raw.paste(currentText);
        }
        async sendText(text, addNewLine) {
            // Normalize line endings to 'enter' press.
            text = text.replace(/\r?\n/g, '\r');
            if (addNewLine && text.substr(text.length - 1) !== '\r') {
                text += '\r';
            }
            // Send it to the process
            await this._processManager.write(text);
            this._onDidInputData.fire(this);
        }
        async sendPath(originalPath, addNewLine) {
            const preparedPath = await preparePathForShell(originalPath, this.shellLaunchConfig.executable, this.title, this.shellType, this._processManager.backend, this._processManager.os);
            return this.sendText(preparedPath, addNewLine);
        }
        setVisible(visible) {
            this._isVisible = visible;
            if (this._wrapperElement) {
                this._wrapperElement.classList.toggle('active', visible);
            }
            if (visible && this.xterm) {
                // Resize to re-evaluate dimensions, this will ensure when switching to a terminal it is
                // using the most up to date dimensions (eg. when terminal is created in the background
                // using cached dimensions of a split terminal).
                this._resize();
                // Trigger a forced refresh of the viewport to sync the viewport and scroll bar. This is
                // necessary if the number of rows in the terminal has decreased while it was in the
                // background since scrollTop changes take no effect but the terminal's position does
                // change since the number of visible rows decreases.
                // This can likely be removed after https://github.com/xtermjs/xterm.js/issues/291 is
                // fixed upstream.
                this.xterm.forceRefresh();
            }
        }
        scrollDownLine() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.scrollDownLine();
        }
        scrollDownPage() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.scrollDownPage();
        }
        scrollToBottom() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.scrollToBottom();
        }
        scrollUpLine() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.scrollUpLine();
        }
        scrollUpPage() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.scrollUpPage();
        }
        scrollToTop() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.scrollToTop();
        }
        clearBuffer() {
            var _a;
            (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.clearBuffer();
        }
        _refreshSelectionContextKey() {
            const isActive = !!this._viewsService.getActiveViewWithId(terminal_2.TERMINAL_VIEW_ID);
            let isEditorActive = false;
            const editor = this._editorService.activeEditor;
            if (editor) {
                isEditorActive = editor instanceof terminalEditorInput_1.TerminalEditorInput;
            }
            this._terminalHasTextContextKey.set((isActive || isEditorActive) && this.hasSelection());
        }
        _createProcessManager() {
            var _a;
            const processManager = this._instantiationService.createInstance(terminalProcessManager_1.TerminalProcessManager, this._instanceId, this._configHelper, (_a = this.shellLaunchConfig) === null || _a === void 0 ? void 0 : _a.cwd);
            this.capabilities.add(processManager.capabilities);
            processManager.onProcessReady(async (e) => {
                this._onProcessIdReady.fire(this);
                this._initialCwd = await this.getInitialCwd();
                // Set the initial name based on the _resolved_ shell launch config, this will also
                // ensure the resolved icon gets shown
                if (!this._labelComputer) {
                    this._labelComputer = this._register(new TerminalLabelComputer(this._configHelper, this, this._workspaceContextService));
                    this._labelComputer.onDidChangeLabel(e => {
                        this._title = e.title;
                        this._description = e.description;
                        this._onTitleChanged.fire(this);
                    });
                }
                if (this._shellLaunchConfig.name) {
                    this.refreshTabLabels(this._shellLaunchConfig.name, terminal_1.TitleEventSource.Api);
                }
                else {
                    // Listen to xterm.js' sequence title change event, trigger this async to ensure
                    // _xtermReadyPromise is ready constructed since this is called from the ctor
                    setTimeout(() => {
                        this._xtermReadyPromise.then(xterm => {
                            this._messageTitleDisposable = xterm.raw.onTitleChange(e => this._onTitleChange(e));
                        });
                    });
                    this.refreshTabLabels(this._shellLaunchConfig.executable, terminal_1.TitleEventSource.Process);
                }
            });
            processManager.onProcessExit(exitCode => this._onProcessExit(exitCode));
            processManager.onDidChangeProperty(({ type, value }) => {
                var _a;
                switch (type) {
                    case "cwd" /* ProcessPropertyType.Cwd */:
                        this._cwd = value;
                        (_a = this._labelComputer) === null || _a === void 0 ? void 0 : _a.refreshLabel();
                        break;
                    case "initialCwd" /* ProcessPropertyType.InitialCwd */:
                        this._initialCwd = value;
                        this._cwd = this._initialCwd;
                        this.refreshTabLabels(this.title, terminal_1.TitleEventSource.Config);
                        break;
                    case "title" /* ProcessPropertyType.Title */:
                        this.refreshTabLabels(value ? value : '', terminal_1.TitleEventSource.Process);
                        break;
                    case "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */:
                        this.setOverrideDimensions(value, true);
                        break;
                    case "resolvedShellLaunchConfig" /* ProcessPropertyType.ResolvedShellLaunchConfig */:
                        this._setResolvedShellLaunchConfig(value);
                        break;
                    case "shellType" /* ProcessPropertyType.ShellType */:
                        this.setShellType(value);
                        break;
                    case "hasChildProcesses" /* ProcessPropertyType.HasChildProcesses */:
                        this._onDidChangeHasChildProcesses.fire(value);
                        break;
                }
            });
            processManager.onProcessData(ev => {
                var _a;
                (_a = this._initialDataEvents) === null || _a === void 0 ? void 0 : _a.push(ev.data);
                this._onData.fire(ev.data);
            });
            processManager.onEnvironmentVariableInfoChanged(e => this._onEnvironmentVariableInfoChanged(e));
            processManager.onPtyDisconnect(() => {
                if (this.xterm) {
                    this.xterm.raw.options.disableStdin = true;
                }
                this.statusList.add({
                    id: "disconnected" /* TerminalStatus.Disconnected */,
                    severity: notification_1.Severity.Error,
                    icon: codicons_1.Codicon.debugDisconnect,
                    tooltip: nls.localize('disconnectStatus', "Lost connection to process")
                });
            });
            processManager.onPtyReconnect(() => {
                if (this.xterm) {
                    this.xterm.raw.options.disableStdin = false;
                }
                this.statusList.remove("disconnected" /* TerminalStatus.Disconnected */);
            });
            return processManager;
        }
        async _createProcess() {
            var _a, _b, _c;
            if (this._isDisposed) {
                return;
            }
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            if (activeWorkspaceRootUri) {
                const trusted = await this._trust();
                if (!trusted) {
                    this._onProcessExit({ message: nls.localize('workspaceNotTrustedCreateTerminal', "Cannot launch a terminal process in an untrusted workspace") });
                }
            }
            else if (this._cwd && this._userHome && this._cwd !== this._userHome) {
                // something strange is going on if cwd is not userHome in an empty workspace
                this._onProcessExit({
                    message: nls.localize('workspaceNotTrustedCreateTerminalCwd', "Cannot launch a terminal process in an untrusted workspace with cwd {0} and userHome {1}", this._cwd, this._userHome)
                });
            }
            // Re-evaluate dimensions if the container has been set since the xterm instance was created
            if (this._container && this._cols === 0 && this._rows === 0) {
                this._initDimensions();
                (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.resize(this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */);
            }
            const hadIcon = !!this.shellLaunchConfig.icon;
            await this._processManager.createProcess(this._shellLaunchConfig, this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */, this._accessibilityService.isScreenReaderOptimized()).then(error => {
                if (error) {
                    this._onProcessExit(error, error.code === terminal_2.ShellIntegrationExitCode);
                }
            });
            if ((_b = this.xterm) === null || _b === void 0 ? void 0 : _b.shellIntegration) {
                this.capabilities.add((_c = this.xterm) === null || _c === void 0 ? void 0 : _c.shellIntegration.capabilities);
            }
            if (!hadIcon && this.shellLaunchConfig.icon || this.shellLaunchConfig.color) {
                this._onIconChanged.fire(this);
            }
        }
        _onProcessData(ev) {
            var _a;
            const messageId = ++this._latestXtermWriteData;
            if (ev.trackCommit) {
                ev.writePromise = new Promise(r => {
                    var _a;
                    (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.write(ev.data, () => {
                        this._latestXtermParseData = messageId;
                        this._processManager.acknowledgeDataEvent(ev.data.length);
                        r();
                    });
                });
            }
            else {
                (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.write(ev.data, () => {
                    this._latestXtermParseData = messageId;
                    this._processManager.acknowledgeDataEvent(ev.data.length);
                });
            }
        }
        /**
         * Called when either a process tied to a terminal has exited or when a terminal renderer
         * simulates a process exiting (e.g. custom execution task).
         * @param exitCode The exit code of the process, this is undefined when the terminal was exited
         * through user action.
         */
        async _onProcessExit(exitCodeOrError, shellIntegrationAttempted) {
            // Prevent dispose functions being triggered multiple times
            if (this._isExiting) {
                return;
            }
            this._isExiting = true;
            await this._flushXtermData();
            this._logService.debug(`Terminal process exit (instanceId: ${this.instanceId}) with code ${this._exitCode}`);
            const parsedExitResult = parseExitResult(exitCodeOrError, this.shellLaunchConfig, this._processManager.processState, this._initialCwd, shellIntegrationAttempted);
            this._exitCode = parsedExitResult === null || parsedExitResult === void 0 ? void 0 : parsedExitResult.code;
            const exitMessage = parsedExitResult === null || parsedExitResult === void 0 ? void 0 : parsedExitResult.message;
            this._logService.debug(`Terminal process exit (instanceId: ${this.instanceId}) state ${this._processManager.processState}`);
            // Only trigger wait on exit when the exit was *not* triggered by the
            // user (via the `workbench.action.terminal.kill` command).
            if (this._shellLaunchConfig.waitOnExit && this._processManager.processState !== 5 /* ProcessState.KilledByUser */) {
                this._xtermReadyPromise.then(xterm => {
                    if (exitMessage) {
                        xterm.raw.writeln(exitMessage);
                    }
                    if (typeof this._shellLaunchConfig.waitOnExit === 'string') {
                        xterm.raw.write((0, terminalStrings_1.formatMessageForTerminal)(this._shellLaunchConfig.waitOnExit));
                    }
                    // Disable all input if the terminal is exiting and listen for next keypress
                    xterm.raw.options.disableStdin = true;
                    if (xterm.raw.textarea) {
                        this._attachPressAnyKeyToCloseListener(xterm.raw);
                    }
                });
            }
            else {
                this.dispose();
                if (exitMessage) {
                    const failedDuringLaunch = this._processManager.processState === 4 /* ProcessState.KilledDuringLaunch */;
                    if (failedDuringLaunch || this._configHelper.config.showExitAlert) {
                        // Always show launch failures
                        this._notificationService.notify({
                            message: exitMessage,
                            severity: notification_1.Severity.Error,
                            actions: { primary: [this._instantiationService.createInstance(terminalActions_1.TerminalLaunchHelpAction)] }
                        });
                    }
                    else {
                        // Log to help surface the error in case users report issues with showExitAlert
                        // disabled
                        this._logService.warn(exitMessage);
                    }
                }
            }
            // First onExit to consumers, this can happen after the terminal has already been disposed.
            this._onExit.fire(exitCodeOrError);
            // Dispose of the onExit event if the terminal will not be reused again
            if (this._isDisposed) {
                this._onExit.dispose();
            }
        }
        /**
         * Ensure write calls to xterm.js have finished before resolving.
         */
        _flushXtermData() {
            if (this._latestXtermWriteData === this._latestXtermParseData) {
                return Promise.resolve();
            }
            let retries = 0;
            return new Promise(r => {
                const interval = setInterval(() => {
                    if (this._latestXtermWriteData === this._latestXtermParseData || ++retries === 5) {
                        clearInterval(interval);
                        r();
                    }
                }, 20);
            });
        }
        _attachPressAnyKeyToCloseListener(xterm) {
            if (xterm.textarea && !this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener = dom.addDisposableListener(xterm.textarea, 'keypress', (event) => {
                    if (this._pressAnyKeyToCloseListener) {
                        this._pressAnyKeyToCloseListener.dispose();
                        this._pressAnyKeyToCloseListener = undefined;
                        this.dispose();
                        event.preventDefault();
                    }
                });
            }
        }
        async reuseTerminal(shell, reset = false) {
            var _a, _b, _c;
            // Unsubscribe any key listener we may have.
            (_a = this._pressAnyKeyToCloseListener) === null || _a === void 0 ? void 0 : _a.dispose();
            this._pressAnyKeyToCloseListener = undefined;
            if (this.xterm) {
                if (!reset) {
                    // Ensure new processes' output starts at start of new line
                    await new Promise(r => this.xterm.raw.write('\n\x1b[G', r));
                }
                // Print initialText if specified
                if (shell.initialText) {
                    await new Promise(r => this.xterm.raw.writeln(shell.initialText, r));
                }
                // Clean up waitOnExit state
                if (this._isExiting && this._shellLaunchConfig.waitOnExit) {
                    this.xterm.raw.options.disableStdin = false;
                    this._isExiting = false;
                }
            }
            // Dispose the environment info widget if it exists
            this.statusList.remove("relaunch-needed" /* TerminalStatus.RelaunchNeeded */);
            (_b = this._environmentInfo) === null || _b === void 0 ? void 0 : _b.disposable.dispose();
            this._environmentInfo = undefined;
            if (!reset) {
                // HACK: Force initialText to be non-falsy for reused terminals such that the
                // conptyInheritCursor flag is passed to the node-pty, this flag can cause a Window to stop
                // responding in Windows 10 1903 so we only want to use it when something is definitely written
                // to the terminal.
                shell.initialText = ' ';
            }
            // Set the new shell launch config
            this._shellLaunchConfig = shell; // Must be done before calling _createProcess()
            await this._processManager.relaunch(this._shellLaunchConfig, this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */, this._accessibilityService.isScreenReaderOptimized(), reset).then(error => {
                if (error) {
                    this._onProcessExit(error);
                }
            });
            (_c = this._xtermTypeAheadAddon) === null || _c === void 0 ? void 0 : _c.reset();
        }
        async setEscapeSequenceLogging(enable) {
            const xterm = await this._xtermReadyPromise;
            xterm.raw.options.logLevel = enable ? 'debug' : 'info';
        }
        relaunch() {
            this.reuseTerminal(this._shellLaunchConfig, true);
        }
        _onTitleChange(title) {
            if (this.isTitleSetByProcess) {
                this.refreshTabLabels(title, terminal_1.TitleEventSource.Sequence);
            }
        }
        async _trust() {
            return (await this._workspaceTrustRequestService.requestWorkspaceTrust({
                message: nls.localize('terminal.requestTrust', "Creating a terminal process requires executing code")
            })) === true;
        }
        _onKey(key, ev) {
            const event = new keyboardEvent_1.StandardKeyboardEvent(ev);
            if (event.equals(3 /* KeyCode.Enter */)) {
                this._updateProcessCwd();
            }
        }
        async _onSelectionChange() {
            if (this._configurationService.getValue("terminal.integrated.copyOnSelection" /* TerminalSettingId.CopyOnSelection */)) {
                if (this.hasSelection()) {
                    await this.copySelection();
                }
            }
        }
        async _updateProcessCwd() {
            if (this._isDisposed || this.shellLaunchConfig.customPtyImplementation) {
                return;
            }
            // reset cwd if it has changed, so file based url paths can be resolved
            try {
                const cwd = await this.refreshProperty("cwd" /* ProcessPropertyType.Cwd */);
                if (typeof cwd !== 'string') {
                    throw new Error(`cwd is not a string ${cwd}`);
                }
            }
            catch (e) {
                // Swallow this as it means the process has been killed
                if (e instanceof Error && e.message === 'Cannot refresh property when process is not set') {
                    return;
                }
                throw e;
            }
        }
        updateConfig() {
            this._setCommandsToSkipShell(this._configHelper.config.commandsToSkipShell);
            this._refreshEnvironmentVariableInfoWidgetState(this._processManager.environmentVariableInfo);
        }
        async _updateUnicodeVersion() {
            this._processManager.setUnicodeVersion(this._configHelper.config.unicodeVersion);
        }
        updateAccessibilitySupport() {
            var _a;
            const isEnabled = this._accessibilityService.isScreenReaderOptimized();
            if (isEnabled) {
                this._navigationModeAddon = new navigationModeAddon_1.NavigationModeAddon(this._terminalA11yTreeFocusContextKey);
                this.xterm.raw.loadAddon(this._navigationModeAddon);
            }
            else {
                (_a = this._navigationModeAddon) === null || _a === void 0 ? void 0 : _a.dispose();
                this._navigationModeAddon = undefined;
            }
            this.xterm.raw.options.screenReaderMode = isEnabled;
        }
        _setCommandsToSkipShell(commands) {
            const excludeCommands = commands.filter(command => command[0] === '-').map(command => command.slice(1));
            this._skipTerminalCommands = terminal_2.DEFAULT_COMMANDS_TO_SKIP_SHELL.filter(defaultCommand => {
                return excludeCommands.indexOf(defaultCommand) === -1;
            }).concat(commands);
        }
        layout(dimension) {
            this._lastLayoutDimensions = dimension;
            if (this.disableLayout) {
                return;
            }
            // Don't layout if dimensions are invalid (eg. the container is not attached to the DOM or
            // if display: none
            if (dimension.width <= 0 || dimension.height <= 0) {
                return;
            }
            // Evaluate columns and rows, exclude the wrapper element's margin
            const terminalWidth = this._evaluateColsAndRows(dimension.width, dimension.height);
            if (!terminalWidth) {
                return;
            }
            this._resize();
            // Signal the container is ready
            this._containerReadyBarrier.open();
        }
        async _resize() {
            this._resizeNow(false);
        }
        async _resizeNow(immediate) {
            let cols = this.cols;
            let rows = this.rows;
            if (this.xterm) {
                // Only apply these settings when the terminal is visible so that
                // the characters are measured correctly.
                if (this._isVisible && this._layoutSettingsChanged) {
                    const font = this.xterm.getFont();
                    const config = this._configHelper.config;
                    this.xterm.raw.options.letterSpacing = font.letterSpacing;
                    this.xterm.raw.options.lineHeight = font.lineHeight;
                    this.xterm.raw.options.fontSize = font.fontSize;
                    this.xterm.raw.options.fontFamily = font.fontFamily;
                    this.xterm.raw.options.fontWeight = config.fontWeight;
                    this.xterm.raw.options.fontWeightBold = config.fontWeightBold;
                    // Any of the above setting changes could have changed the dimensions of the
                    // terminal, re-evaluate now.
                    this._initDimensions();
                    cols = this.cols;
                    rows = this.rows;
                    this._layoutSettingsChanged = false;
                }
                if (isNaN(cols) || isNaN(rows)) {
                    return;
                }
                if (cols !== this.xterm.raw.cols || rows !== this.xterm.raw.rows) {
                    if (this._fixedRows || this._fixedCols) {
                        await this.updateProperty("fixedDimensions" /* ProcessPropertyType.FixedDimensions */, { cols: this._fixedCols, rows: this._fixedRows });
                    }
                    this._onDimensionsChanged.fire();
                }
                this.xterm.raw.resize(cols, rows);
                TerminalInstance._lastKnownGridDimensions = { cols, rows };
                if (this._isVisible) {
                    this.xterm.forceUnpause();
                }
            }
            if (immediate) {
                // do not await, call setDimensions synchronously
                this._processManager.setDimensions(cols, rows, true);
            }
            else {
                await this._processManager.setDimensions(cols, rows);
            }
        }
        setShellType(shellType) {
            this._shellType = shellType;
            if (shellType) {
                this._terminalShellTypeContextKey.set(shellType === null || shellType === void 0 ? void 0 : shellType.toString());
            }
        }
        _setAriaLabel(xterm, terminalId, title) {
            var _a, _b;
            if (xterm && xterm.textarea) {
                let label;
                if (title && title.length > 0) {
                    label = nls.localize('terminalTextBoxAriaLabelNumberAndTitle', "Terminal {0}, {1}", terminalId, title);
                }
                else {
                    label = nls.localize('terminalTextBoxAriaLabel', "Terminal {0}", terminalId);
                }
                const navigateUpKeybinding = (_a = this._keybindingService.lookupKeybinding("workbench.action.terminal.navigationModeFocusPrevious" /* TerminalCommandId.NavigationModeFocusPrevious */)) === null || _a === void 0 ? void 0 : _a.getLabel();
                const navigateDownKeybinding = (_b = this._keybindingService.lookupKeybinding("workbench.action.terminal.navigationModeFocusNext" /* TerminalCommandId.NavigationModeFocusNext */)) === null || _b === void 0 ? void 0 : _b.getLabel();
                if (navigateUpKeybinding && navigateDownKeybinding) {
                    label += `\n${nls.localize('terminalNavigationMode', "Use {0} and {1} to navigate the terminal buffer", navigateUpKeybinding, navigateDownKeybinding)}`;
                }
                xterm.textarea.setAttribute('aria-label', label);
            }
        }
        refreshTabLabels(title, eventSource) {
            var _a, _b;
            const reset = !title;
            title = this._updateTitleProperties(title, eventSource);
            const titleChanged = title !== this._title;
            this._title = title;
            (_a = this._labelComputer) === null || _a === void 0 ? void 0 : _a.refreshLabel(reset);
            this._setAriaLabel((_b = this.xterm) === null || _b === void 0 ? void 0 : _b.raw, this._instanceId, this._title);
            if (this._titleReadyComplete) {
                this._titleReadyComplete(title);
                this._titleReadyComplete = undefined;
            }
            if (titleChanged) {
                this._onTitleChanged.fire(this);
            }
        }
        _updateTitleProperties(title, eventSource) {
            if (!title) {
                return this._processName;
            }
            switch (eventSource) {
                case terminal_1.TitleEventSource.Process:
                    if (this._processManager.os === 1 /* OperatingSystem.Windows */) {
                        // Extract the file name without extension
                        title = path.win32.parse(title).name;
                    }
                    else {
                        const firstSpaceIndex = title.indexOf(' ');
                        if (title.startsWith('/')) {
                            title = path.basename(title);
                        }
                        else if (firstSpaceIndex > -1) {
                            title = title.substring(0, firstSpaceIndex);
                        }
                    }
                    this._processName = title;
                    break;
                case terminal_1.TitleEventSource.Api:
                    // If the title has not been set by the API or the rename command, unregister the handler that
                    // automatically updates the terminal name
                    this._staticTitle = title;
                    (0, lifecycle_1.dispose)(this._messageTitleDisposable);
                    this._messageTitleDisposable = undefined;
                    break;
                case terminal_1.TitleEventSource.Sequence:
                    // On Windows, some shells will fire this with the full path which we want to trim
                    // to show just the file name. This should only happen if the title looks like an
                    // absolute Windows file path
                    this._sequence = title;
                    if (this._processManager.os === 1 /* OperatingSystem.Windows */) {
                        if (title.match(/^[a-zA-Z]:\\.+\.[a-zA-Z]{1,3}/)) {
                            title = path.win32.parse(title).name;
                            this._sequence = title;
                        }
                        else {
                            this._sequence = undefined;
                        }
                    }
                    break;
            }
            this._titleSource = eventSource;
            return title;
        }
        waitForTitle() {
            return this._titleReadyPromise;
        }
        setOverrideDimensions(dimensions, immediate = false) {
            if (this._dimensionsOverride && this._dimensionsOverride.forceExactSize && !dimensions && this._rows === 0 && this._cols === 0) {
                // this terminal never had a real size => keep the last dimensions override exact size
                this._cols = this._dimensionsOverride.cols;
                this._rows = this._dimensionsOverride.rows;
            }
            this._dimensionsOverride = dimensions;
            if (immediate) {
                this._resizeNow(true);
            }
            else {
                this._resize();
            }
        }
        async setFixedDimensions() {
            var _a, _b;
            const cols = await this._quickInputService.input({
                title: nls.localize('setTerminalDimensionsColumn', "Set Fixed Dimensions: Column"),
                placeHolder: 'Enter a number of columns or leave empty for automatic width',
                validateInput: async (text) => text.length > 0 && !text.match(/^\d+$/) ? { content: 'Enter a number or leave empty size automatically', severity: notification_1.Severity.Error } : undefined
            });
            if (cols === undefined) {
                return;
            }
            this._fixedCols = this._parseFixedDimension(cols);
            (_a = this._labelComputer) === null || _a === void 0 ? void 0 : _a.refreshLabel();
            this._terminalHasFixedWidth.set(!!this._fixedCols);
            const rows = await this._quickInputService.input({
                title: nls.localize('setTerminalDimensionsRow', "Set Fixed Dimensions: Row"),
                placeHolder: 'Enter a number of rows or leave empty for automatic height',
                validateInput: async (text) => text.length > 0 && !text.match(/^\d+$/) ? { content: 'Enter a number or leave empty size automatically', severity: notification_1.Severity.Error } : undefined
            });
            if (rows === undefined) {
                return;
            }
            this._fixedRows = this._parseFixedDimension(rows);
            (_b = this._labelComputer) === null || _b === void 0 ? void 0 : _b.refreshLabel();
            await this._refreshScrollbar();
            this._resize();
            this.focus();
        }
        _parseFixedDimension(value) {
            if (value === '') {
                return undefined;
            }
            const parsed = parseInt(value);
            if (parsed <= 0) {
                throw new Error(`Could not parse dimension "${value}"`);
            }
            return parsed;
        }
        async toggleSizeToContentWidth() {
            var _a, _b;
            if (!((_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.buffer.active)) {
                return;
            }
            if (this._hasScrollBar) {
                this._terminalHasFixedWidth.set(false);
                this._fixedCols = undefined;
                this._fixedRows = undefined;
                this._hasScrollBar = false;
                this._initDimensions();
                await this._resize();
            }
            else {
                // Fixed columns should be at least xterm.js' regular column count
                const proposedCols = Math.max(this.maxCols, Math.min(this.xterm.getLongestViewportWrappedLineLength(), 5000 /* Constants.MaxSupportedCols */));
                // Don't switch to fixed dimensions if the content already fits as it makes the scroll
                // bar look bad being off the edge
                if (proposedCols > this.xterm.raw.cols) {
                    this._fixedCols = proposedCols;
                }
            }
            await this._refreshScrollbar();
            (_b = this._labelComputer) === null || _b === void 0 ? void 0 : _b.refreshLabel();
            this.focus();
        }
        _refreshScrollbar() {
            if (this._fixedCols || this._fixedRows) {
                return this._addScrollbar();
            }
            return this._removeScrollbar();
        }
        async _addScrollbar() {
            var _a;
            const charWidth = (this.xterm ? this.xterm.getFont() : this._configHelper.getFont()).charWidth;
            if (!((_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.element) || !this._wrapperElement || !this._container || !charWidth || !this._fixedCols) {
                return;
            }
            this._wrapperElement.classList.add('fixed-dims');
            this._hasScrollBar = true;
            this._initDimensions();
            // Always remove a row to make room for the scroll bar
            this._fixedRows = this._rows - 1;
            await this._resize();
            this._terminalHasFixedWidth.set(true);
            if (!this._horizontalScrollbar) {
                this._horizontalScrollbar = this._register(new scrollableElement_1.DomScrollableElement(this._wrapperElement, {
                    vertical: 2 /* ScrollbarVisibility.Hidden */,
                    horizontal: 1 /* ScrollbarVisibility.Auto */,
                    useShadows: false,
                    scrollYToX: false,
                    consumeMouseWheelIfScrollbarIsNeeded: false
                }));
                this._container.appendChild(this._horizontalScrollbar.getDomNode());
            }
            this._horizontalScrollbar.setScrollDimensions({
                width: this.xterm.raw.element.clientWidth,
                scrollWidth: this._fixedCols * charWidth + 40 // Padding + scroll bar
            });
            this._horizontalScrollbar.getDomNode().style.paddingBottom = '16px';
            // work around for https://github.com/xtermjs/xterm.js/issues/3482
            if (platform_1.isWindows) {
                for (let i = this.xterm.raw.buffer.active.viewportY; i < this.xterm.raw.buffer.active.length; i++) {
                    let line = this.xterm.raw.buffer.active.getLine(i);
                    line._line.isWrapped = false;
                }
            }
        }
        async _removeScrollbar() {
            if (!this._container || !this._wrapperElement || !this._horizontalScrollbar) {
                return;
            }
            this._horizontalScrollbar.getDomNode().remove();
            this._horizontalScrollbar.dispose();
            this._horizontalScrollbar = undefined;
            this._wrapperElement.remove();
            this._wrapperElement.classList.remove('fixed-dims');
            this._container.appendChild(this._wrapperElement);
        }
        _setResolvedShellLaunchConfig(shellLaunchConfig) {
            this._shellLaunchConfig.args = shellLaunchConfig.args;
            this._shellLaunchConfig.cwd = shellLaunchConfig.cwd;
            this._shellLaunchConfig.executable = shellLaunchConfig.executable;
            this._shellLaunchConfig.env = shellLaunchConfig.env;
        }
        showEnvironmentInfoHover() {
            if (this._environmentInfo) {
                this._environmentInfo.widget.focus();
            }
        }
        _onEnvironmentVariableInfoChanged(info) {
            var _a, _b;
            if (info.requiresAction) {
                (_b = (_a = this.xterm) === null || _a === void 0 ? void 0 : _a.raw.textarea) === null || _b === void 0 ? void 0 : _b.setAttribute('aria-label', nls.localize('terminalStaleTextBoxAriaLabel', "Terminal {0} environment is stale, run the 'Show Environment Information' command for more information", this._instanceId));
            }
            this._refreshEnvironmentVariableInfoWidgetState(info);
        }
        _refreshEnvironmentVariableInfoWidgetState(info) {
            var _a, _b;
            // Check if the widget should not exist
            if (!info ||
                this._configHelper.config.environmentChangesIndicator === 'off' ||
                this._configHelper.config.environmentChangesIndicator === 'warnonly' && !info.requiresAction) {
                this.statusList.remove("relaunch-needed" /* TerminalStatus.RelaunchNeeded */);
                (_a = this._environmentInfo) === null || _a === void 0 ? void 0 : _a.disposable.dispose();
                this._environmentInfo = undefined;
                return;
            }
            // Recreate the process if the terminal has not yet been interacted with and it's not a
            // special terminal (eg. task, extension terminal)
            if (info.requiresAction &&
                this._configHelper.config.environmentChangesRelaunch &&
                !this._processManager.hasWrittenData &&
                !this._shellLaunchConfig.isFeatureTerminal &&
                !this._shellLaunchConfig.customPtyImplementation
                && !this._shellLaunchConfig.isExtensionOwnedTerminal &&
                !this._shellLaunchConfig.attachPersistentProcess) {
                this.relaunch();
                return;
            }
            // (Re-)create the widget
            (_b = this._environmentInfo) === null || _b === void 0 ? void 0 : _b.disposable.dispose();
            const widget = this._instantiationService.createInstance(environmentVariableInfoWidget_1.EnvironmentVariableInfoWidget, info);
            const disposable = this._widgetManager.attachWidget(widget);
            if (info.requiresAction) {
                this.statusList.add({
                    id: "relaunch-needed" /* TerminalStatus.RelaunchNeeded */,
                    severity: notification_1.Severity.Warning,
                    icon: codicons_1.Codicon.warning,
                    tooltip: info.getInfo(),
                    hoverActions: info.getActions ? info.getActions() : undefined
                });
            }
            if (disposable) {
                this._environmentInfo = { widget, disposable };
            }
        }
        async toggleEscapeSequenceLogging() {
            const xterm = await this._xtermReadyPromise;
            xterm.raw.options.logLevel = xterm.raw.options.logLevel === 'debug' ? 'info' : 'debug';
            return xterm.raw.options.logLevel === 'debug';
        }
        async getInitialCwd() {
            if (!this._initialCwd) {
                this._initialCwd = await this._processManager.getInitialCwd();
            }
            return this._initialCwd;
        }
        async getCwd() {
            if (this.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
                return this.capabilities.get(0 /* TerminalCapability.CwdDetection */).getCwd();
            }
            else if (this.capabilities.has(1 /* TerminalCapability.NaiveCwdDetection */)) {
                return this.capabilities.get(1 /* TerminalCapability.NaiveCwdDetection */).getCwd();
            }
            return await this._processManager.getInitialCwd();
        }
        async refreshProperty(type) {
            await this.processReady;
            return this._processManager.refreshProperty(type);
        }
        async updateProperty(type, value) {
            return this._processManager.updateProperty(type, value);
        }
        registerLinkProvider(provider) {
            if (!this._linkManager) {
                throw new Error('TerminalInstance.registerLinkProvider before link manager was ready');
            }
            // Avoid a circular dependency by binding the terminal instances to the external link provider
            return this._linkManager.registerExternalLinkProvider(provider.provideLinks.bind(provider, this));
        }
        async rename(title) {
            if (title === 'triggerQuickpick') {
                title = await this._quickInputService.input({
                    value: this.title,
                    prompt: nls.localize('workbench.action.terminal.rename.prompt', "Enter terminal name"),
                });
            }
            this.refreshTabLabels(title, terminal_1.TitleEventSource.Api);
        }
        async changeIcon() {
            const items = [];
            for (const icon of codicons_1.Codicon.getAll()) {
                items.push({ label: `$(${icon.id})`, description: `${icon.id}`, icon });
            }
            const result = await this._quickInputService.pick(items, {
                matchOnDescription: true
            });
            if (result) {
                this._icon = result.icon;
                this._onIconChanged.fire(this);
            }
        }
        async changeColor() {
            const icon = this._getIcon();
            if (!icon) {
                return;
            }
            const colorTheme = this._themeService.getColorTheme();
            const standardColors = (0, terminalIcon_1.getStandardColors)(colorTheme);
            const styleElement = (0, terminalIcon_1.getColorStyleElement)(colorTheme);
            const items = [];
            for (const colorKey of standardColors) {
                const colorClass = (0, terminalIcon_1.getColorClass)(colorKey);
                items.push({
                    label: `$(${codicons_1.Codicon.circleFilled.id}) ${colorKey.replace('terminal.ansi', '')}`, id: colorKey, description: colorKey, iconClasses: [colorClass]
                });
            }
            items.push({ type: 'separator' });
            const showAllColorsItem = { label: 'Reset to default' };
            items.push(showAllColorsItem);
            document.body.appendChild(styleElement);
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.items = items;
            quickPick.matchOnDescription = true;
            quickPick.show();
            const disposables = [];
            const result = await new Promise(r => {
                disposables.push(quickPick.onDidHide(() => r(undefined)));
                disposables.push(quickPick.onDidAccept(() => r(quickPick.selectedItems[0])));
            });
            (0, lifecycle_1.dispose)(disposables);
            if (result) {
                this.shellLaunchConfig.color = result.id;
                this._onIconChanged.fire(this);
            }
            quickPick.hide();
            document.body.removeChild(styleElement);
        }
    };
    TerminalInstance._instanceIdCounter = 1;
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TerminalInstance.prototype, "_fireMaximumDimensionsChanged", null);
    __decorate([
        (0, decorators_1.debounce)(1000)
    ], TerminalInstance.prototype, "relaunch", null);
    __decorate([
        (0, decorators_1.debounce)(2000)
    ], TerminalInstance.prototype, "_updateProcessCwd", null);
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TerminalInstance.prototype, "_resize", null);
    TerminalInstance = __decorate([
        __param(7, terminal_2.ITerminalProfileResolverService),
        __param(8, pathService_1.IPathService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, notification_1.INotificationService),
        __param(12, preferences_1.IPreferencesService),
        __param(13, views_1.IViewsService),
        __param(14, instantiation_1.IInstantiationService),
        __param(15, clipboardService_1.IClipboardService),
        __param(16, themeService_1.IThemeService),
        __param(17, configuration_1.IConfigurationService),
        __param(18, log_1.ILogService),
        __param(19, dialogs_1.IDialogService),
        __param(20, storage_1.IStorageService),
        __param(21, accessibility_1.IAccessibilityService),
        __param(22, productService_1.IProductService),
        __param(23, quickInput_1.IQuickInputService),
        __param(24, environmentService_1.IWorkbenchEnvironmentService),
        __param(25, workspace_1.IWorkspaceContextService),
        __param(26, editorService_1.IEditorService),
        __param(27, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(28, history_2.IHistoryService)
    ], TerminalInstance);
    exports.TerminalInstance = TerminalInstance;
    let TerminalInstanceDragAndDropController = class TerminalInstanceDragAndDropController extends lifecycle_1.Disposable {
        constructor(_container, _layoutService, _viewDescriptorService) {
            super();
            this._container = _container;
            this._layoutService = _layoutService;
            this._viewDescriptorService = _viewDescriptorService;
            this._onDropFile = new event_1.Emitter();
            this._onDropTerminal = new event_1.Emitter();
            this._register((0, lifecycle_1.toDisposable)(() => this._clearDropOverlay()));
        }
        get onDropFile() { return this._onDropFile.event; }
        get onDropTerminal() { return this._onDropTerminal.event; }
        _clearDropOverlay() {
            if (this._dropOverlay && this._dropOverlay.parentElement) {
                this._dropOverlay.parentElement.removeChild(this._dropOverlay);
            }
            this._dropOverlay = undefined;
        }
        onDragEnter(e) {
            if (!(0, dnd_2.containsDragType)(e, dnd_1.DataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, "Terminals" /* TerminalDataTransfers.Terminals */, dnd_2.CodeDataTransfers.FILES)) {
                return;
            }
            if (!this._dropOverlay) {
                this._dropOverlay = document.createElement('div');
                this._dropOverlay.classList.add('terminal-drop-overlay');
            }
            // Dragging terminals
            if ((0, dnd_2.containsDragType)(e, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                const side = this._getDropSide(e);
                this._dropOverlay.classList.toggle('drop-before', side === 'before');
                this._dropOverlay.classList.toggle('drop-after', side === 'after');
            }
            if (!this._dropOverlay.parentElement) {
                this._container.appendChild(this._dropOverlay);
            }
        }
        onDragLeave(e) {
            this._clearDropOverlay();
        }
        onDragEnd(e) {
            this._clearDropOverlay();
        }
        onDragOver(e) {
            if (!e.dataTransfer || !this._dropOverlay) {
                return;
            }
            // Dragging terminals
            if ((0, dnd_2.containsDragType)(e, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                const side = this._getDropSide(e);
                this._dropOverlay.classList.toggle('drop-before', side === 'before');
                this._dropOverlay.classList.toggle('drop-after', side === 'after');
            }
            this._dropOverlay.style.opacity = '1';
        }
        async onDrop(e) {
            this._clearDropOverlay();
            if (!e.dataTransfer) {
                return;
            }
            const terminalResources = (0, terminalUri_1.getTerminalResourcesFromDragEvent)(e);
            if (terminalResources) {
                for (const uri of terminalResources) {
                    const side = this._getDropSide(e);
                    this._onDropTerminal.fire({ uri, side });
                }
                return;
            }
            // Check if files were dragged from the tree explorer
            let path;
            const rawResources = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
            if (rawResources) {
                path = uri_1.URI.parse(JSON.parse(rawResources)[0]).fsPath;
            }
            const rawCodeFiles = e.dataTransfer.getData(dnd_2.CodeDataTransfers.FILES);
            if (!path && rawCodeFiles) {
                path = uri_1.URI.file(JSON.parse(rawCodeFiles)[0]).fsPath;
            }
            if (!path && e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].path /* Electron only */) {
                // Check if the file was dragged from the filesystem
                path = uri_1.URI.file(e.dataTransfer.files[0].path).fsPath;
            }
            if (!path) {
                return;
            }
            this._onDropFile.fire(path);
        }
        _getDropSide(e) {
            const target = this._container;
            if (!target) {
                return 'after';
            }
            const rect = target.getBoundingClientRect();
            return this._getViewOrientation() === 1 /* Orientation.HORIZONTAL */
                ? (e.clientX - rect.left < rect.width / 2 ? 'before' : 'after')
                : (e.clientY - rect.top < rect.height / 2 ? 'before' : 'after');
        }
        _getViewOrientation() {
            const panelPosition = this._layoutService.getPanelPosition();
            const terminalLocation = this._viewDescriptorService.getViewLocationById(terminal_2.TERMINAL_VIEW_ID);
            return terminalLocation === 1 /* ViewContainerLocation.Panel */ && panelPosition === 2 /* Position.BOTTOM */
                ? 1 /* Orientation.HORIZONTAL */
                : 0 /* Orientation.VERTICAL */;
        }
    };
    TerminalInstanceDragAndDropController = __decorate([
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, views_1.IViewDescriptorService)
    ], TerminalInstanceDragAndDropController);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Border
        const border = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (border) {
            collector.addRule(`
			.monaco-workbench.hc-black .editor-instance .xterm.focus::before,
			.monaco-workbench.hc-black .pane-body.integrated-terminal .xterm.focus::before,
			.monaco-workbench.hc-black .editor-instance .xterm:focus::before,
			.monaco-workbench.hc-black .pane-body.integrated-terminal .xterm:focus::before,
			.monaco-workbench.hc-light .editor-instance .xterm.focus::before,
			.monaco-workbench.hc-light .pane-body.integrated-terminal .xterm.focus::before,
			.monaco-workbench.hc-light .editor-instance .xterm:focus::before,
			.monaco-workbench.hc-light .pane-body.integrated-terminal .xterm:focus::before { border-color: ${border}; }`);
        }
        // Scrollbar
        const scrollbarSliderBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderBackground);
        if (scrollbarSliderBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .editor-instance .find-focused .xterm .xterm-viewport,
			.monaco-workbench .pane-body.integrated-terminal .find-focused .xterm .xterm-viewport,
			.monaco-workbench .editor-instance .xterm.focus .xterm-viewport,
			.monaco-workbench .pane-body.integrated-terminal .xterm.focus .xterm-viewport,
			.monaco-workbench .editor-instance .xterm:focus .xterm-viewport,
			.monaco-workbench .pane-body.integrated-terminal .xterm:focus .xterm-viewport,
			.monaco-workbench .editor-instance .xterm:hover .xterm-viewport,
			.monaco-workbench .pane-body.integrated-terminal .xterm:hover .xterm-viewport { background-color: ${scrollbarSliderBackgroundColor} !important; }
			.monaco-workbench .editor-instance .xterm-viewport,
			.monaco-workbench .pane-body.integrated-terminal .xterm-viewport { scrollbar-color: ${scrollbarSliderBackgroundColor} transparent; }
		`);
        }
        const scrollbarSliderHoverBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderHoverBackground);
        if (scrollbarSliderHoverBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .editor-instance .xterm .xterm-viewport::-webkit-scrollbar-thumb:hover,
			.monaco-workbench .pane-body.integrated-terminal .xterm .xterm-viewport::-webkit-scrollbar-thumb:hover { background-color: ${scrollbarSliderHoverBackgroundColor}; }
			.monaco-workbench .editor-instance .xterm-viewport:hover,
			.monaco-workbench .pane-body.integrated-terminal .xterm-viewport:hover { scrollbar-color: ${scrollbarSliderHoverBackgroundColor} transparent; }
		`);
        }
        const scrollbarSliderActiveBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderActiveBackground);
        if (scrollbarSliderActiveBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .editor-instance .xterm .xterm-viewport::-webkit-scrollbar-thumb:active,
			.monaco-workbench .pane-body.integrated-terminal .xterm .xterm-viewport::-webkit-scrollbar-thumb:active { background-color: ${scrollbarSliderActiveBackgroundColor}; }
		`);
        }
    });
    var TerminalLabelType;
    (function (TerminalLabelType) {
        TerminalLabelType["Title"] = "title";
        TerminalLabelType["Description"] = "description";
    })(TerminalLabelType || (TerminalLabelType = {}));
    let TerminalLabelComputer = class TerminalLabelComputer extends lifecycle_1.Disposable {
        constructor(_configHelper, _instance, _workspaceContextService) {
            super();
            this._configHelper = _configHelper;
            this._instance = _instance;
            this._workspaceContextService = _workspaceContextService;
            this._title = '';
            this._description = '';
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this.onDidChangeLabel = this._onDidChangeLabel.event;
        }
        get title() { return this._title; }
        get description() { return this._description; }
        refreshLabel(reset) {
            this._title = this.computeLabel(this._configHelper.config.tabs.title, "title" /* TerminalLabelType.Title */, reset);
            this._description = this.computeLabel(this._configHelper.config.tabs.description, "description" /* TerminalLabelType.Description */);
            if (this._title !== this._instance.title || this._description !== this._instance.description || reset) {
                this._onDidChangeLabel.fire({ title: this._title, description: this._description });
            }
        }
        computeLabel(labelTemplate, labelType, reset) {
            var _a, _b, _c;
            const templateProperties = {
                cwd: this._instance.cwd || this._instance.initialCwd || '',
                cwdFolder: '',
                workspaceFolder: this._instance.workspaceFolder ? path.basename(this._instance.workspaceFolder.uri.fsPath) : undefined,
                local: this._instance.shellLaunchConfig.type === 'Local' ? this._instance.shellLaunchConfig.type : undefined,
                process: this._instance.processName,
                sequence: this._instance.sequence,
                task: this._instance.shellLaunchConfig.type === 'Task' ? this._instance.shellLaunchConfig.type : undefined,
                fixedDimensions: this._instance.fixedCols
                    ? (this._instance.fixedRows ? `\u2194${this._instance.fixedCols} \u2195${this._instance.fixedRows}` : `\u2194${this._instance.fixedCols}`)
                    : (this._instance.fixedRows ? `\u2195${this._instance.fixedRows}` : ''),
                separator: { label: this._configHelper.config.tabs.separator }
            };
            labelTemplate = labelTemplate.trim();
            if (!labelTemplate) {
                return labelType === "title" /* TerminalLabelType.Title */ ? (this._instance.processName || '') : '';
            }
            if (!reset && this._instance.staticTitle && labelType === "title" /* TerminalLabelType.Title */) {
                return this._instance.staticTitle.replace(/[\n\r\t]/g, '') || ((_a = templateProperties.process) === null || _a === void 0 ? void 0 : _a.replace(/[\n\r\t]/g, '')) || '';
            }
            const detection = this._instance.capabilities.has(0 /* TerminalCapability.CwdDetection */) || this._instance.capabilities.has(1 /* TerminalCapability.NaiveCwdDetection */);
            const folders = this._workspaceContextService.getWorkspace().folders;
            const multiRootWorkspace = folders.length > 1;
            // Only set cwdFolder if detection is on
            if (templateProperties.cwd && detection && (!this._instance.shellLaunchConfig.isFeatureTerminal || labelType === "title" /* TerminalLabelType.Title */)) {
                const cwdUri = uri_1.URI.from({ scheme: ((_b = this._instance.workspaceFolder) === null || _b === void 0 ? void 0 : _b.uri.scheme) || network_1.Schemas.file, path: this._instance.cwd });
                // Multi-root workspaces always show cwdFolder to disambiguate them, otherwise only show
                // when it differs from the workspace folder in which it was launched from
                if (multiRootWorkspace || cwdUri.fsPath !== ((_c = this._instance.workspaceFolder) === null || _c === void 0 ? void 0 : _c.uri.fsPath)) {
                    templateProperties.cwdFolder = path.basename(templateProperties.cwd);
                }
            }
            //Remove special characters that could mess with rendering
            let label = (0, labels_1.template)(labelTemplate, templateProperties).replace(/[\n\r\t]/g, '').trim();
            return label === '' && labelType === "title" /* TerminalLabelType.Title */ ? (this._instance.processName || '') : label;
        }
        pathsEqual(path1, path2) {
            if (!path1 && !path2) {
                return true;
            }
            else if (!path1 || !path2) {
                return false;
            }
            else if (path1 === path2) {
                return true;
            }
            const split1 = path1.includes('/') ? path1.split('/') : path1.split('\\');
            const split2 = path2.includes('/') ? path2.split('/') : path2.split('\\');
            if (split1.length !== split2.length) {
                return false;
            }
            for (let i = 0; i < split1.length; i++) {
                if (split1[i] !== split2[i]) {
                    return false;
                }
            }
            return true;
        }
    };
    TerminalLabelComputer = __decorate([
        __param(2, workspace_1.IWorkspaceContextService)
    ], TerminalLabelComputer);
    exports.TerminalLabelComputer = TerminalLabelComputer;
    function parseExitResult(exitCodeOrError, shellLaunchConfig, processState, initialCwd, shellIntegrationAttempted) {
        // Only return a message if the exit code is non-zero
        if (exitCodeOrError === undefined || exitCodeOrError === 0) {
            return { code: exitCodeOrError, message: undefined };
        }
        const code = typeof exitCodeOrError === 'number' ? exitCodeOrError : exitCodeOrError.code;
        // Create exit code message
        let message = undefined;
        switch (typeof exitCodeOrError) {
            case 'number': {
                let commandLine = undefined;
                if (shellLaunchConfig.executable) {
                    commandLine = shellLaunchConfig.executable;
                    if (typeof shellLaunchConfig.args === 'string') {
                        commandLine += ` ${shellLaunchConfig.args}`;
                    }
                    else if (shellLaunchConfig.args && shellLaunchConfig.args.length) {
                        commandLine += shellLaunchConfig.args.map(a => ` '${a}'`).join();
                    }
                }
                if (shellIntegrationAttempted) {
                    if (commandLine) {
                        message = nls.localize('launchFailed.exitCodeAndCommandLineShellIntegration', "The terminal process \"{0}\" failed to launch (exit code: {1}). Disabling shell integration with `terminal.integrated.shellIntegration.enabled` might help.", commandLine, code);
                    }
                    else {
                        message = nls.localize('launchFailed.exitCodeOnlyShellIntegration', "The terminal process failed to launch (exit code: {0}). Disabling shell integration with `terminal.integrated.shellIntegration.enabled` might help.", code);
                    }
                }
                else if (processState === 4 /* ProcessState.KilledDuringLaunch */) {
                    if (commandLine) {
                        message = nls.localize('launchFailed.exitCodeAndCommandLine', "The terminal process \"{0}\" failed to launch (exit code: {1}).", commandLine, code);
                    }
                    else {
                        message = nls.localize('launchFailed.exitCodeOnly', "The terminal process failed to launch (exit code: {0}).", code);
                    }
                }
                else {
                    if (commandLine) {
                        message = nls.localize('terminated.exitCodeAndCommandLine', "The terminal process \"{0}\" terminated with exit code: {1}.", commandLine, code);
                    }
                    else {
                        message = nls.localize('terminated.exitCodeOnly', "The terminal process terminated with exit code: {0}.", code);
                    }
                }
                break;
            }
            case 'object': {
                // Ignore internal errors
                if (exitCodeOrError.message.toString().includes('Could not find pty with id')) {
                    break;
                }
                // Convert conpty code-based failures into human friendly messages
                let innerMessage = exitCodeOrError.message;
                const conptyError = exitCodeOrError.message.match(/.*error code:\s*(\d+).*$/);
                if (conptyError) {
                    const errorCode = conptyError.length > 1 ? parseInt(conptyError[1]) : undefined;
                    switch (errorCode) {
                        case 5:
                            innerMessage = `Access was denied to the path containing your executable "${shellLaunchConfig.executable}". Manage and change your permissions to get this to work`;
                            break;
                        case 267:
                            innerMessage = `Invalid starting directory "${initialCwd}", review your terminal.integrated.cwd setting`;
                            break;
                        case 1260:
                            innerMessage = `Windows cannot open this program because it has been prevented by a software restriction policy. For more information, open Event Viewer or contact your system Administrator`;
                            break;
                    }
                }
                message = nls.localize('launchFailed.errorMessage', "The terminal process failed to launch: {0}.", innerMessage);
                break;
            }
        }
        return { code, message };
    }
    exports.parseExitResult = parseExitResult;
    /**
     * Takes a path and returns the properly escaped path to send to a given shell. On Windows, this
     * included trying to prepare the path for WSL if needed.
     *
     * @param originalPath The path to be escaped and formatted.
     * @param executable The executable off the shellLaunchConfig.
     * @param title The terminal's title.
     * @param shellType The type of shell the path is being sent to.
     * @param backend The backend for the terminal.
     * @returns An escaped version of the path to be execuded in the terminal.
     */
    async function preparePathForShell(originalPath, executable, title, shellType, backend, os) {
        return new Promise(c => {
            if (!executable) {
                c(originalPath);
                return;
            }
            const hasSpace = originalPath.indexOf(' ') !== -1;
            const hasParens = originalPath.indexOf('(') !== -1 || originalPath.indexOf(')') !== -1;
            const pathBasename = path.basename(executable, '.exe');
            const isPowerShell = pathBasename === 'pwsh' ||
                title === 'pwsh' ||
                pathBasename === 'powershell' ||
                title === 'powershell';
            if (isPowerShell && (hasSpace || originalPath.indexOf('\'') !== -1)) {
                c(`& '${originalPath.replace(/'/g, '\'\'')}'`);
                return;
            }
            if (hasParens && isPowerShell) {
                c(`& '${originalPath}'`);
                return;
            }
            if (os === 1 /* OperatingSystem.Windows */) {
                // 17063 is the build number where wsl path was introduced.
                // Update Windows uriPath to be executed in WSL.
                if (shellType !== undefined) {
                    if (shellType === "gitbash" /* WindowsShellType.GitBash */) {
                        c(originalPath.replace(/\\/g, '/'));
                    }
                    else if (shellType === "wsl" /* WindowsShellType.Wsl */) {
                        c((backend === null || backend === void 0 ? void 0 : backend.getWslPath(originalPath)) || originalPath);
                    }
                    else if (hasSpace) {
                        c('"' + originalPath + '"');
                    }
                    else {
                        c(originalPath);
                    }
                }
                else {
                    const lowerExecutable = executable.toLowerCase();
                    if (lowerExecutable.indexOf('wsl') !== -1 || (lowerExecutable.indexOf('bash.exe') !== -1 && lowerExecutable.toLowerCase().indexOf('git') === -1)) {
                        c((backend === null || backend === void 0 ? void 0 : backend.getWslPath(originalPath)) || originalPath);
                    }
                    else if (hasSpace) {
                        c('"' + originalPath + '"');
                    }
                    else {
                        c(originalPath);
                    }
                }
                return;
            }
            c((0, terminalEnvironment_1.escapeNonWindowsPath)(originalPath));
        });
    }
});
//# sourceMappingURL=terminalInstance.js.map