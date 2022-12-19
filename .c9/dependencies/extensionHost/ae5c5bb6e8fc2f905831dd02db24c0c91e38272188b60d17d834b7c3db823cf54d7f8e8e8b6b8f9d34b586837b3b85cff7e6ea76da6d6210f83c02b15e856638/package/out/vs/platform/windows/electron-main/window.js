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
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/files/common/files", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/externalServices/common/marketplace", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/theme/electron-main/themeMainService", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/platform/window/electron-main/window"], function (require, exports, electron_1, async_1, cancellation_1, errorMessage_1, event_1, labels_1, lifecycle_1, network_1, path_1, performance_1, platform_1, uri_1, nls_1, backup_1, configuration_1, dialogMainService_1, environmentMainService_1, argvHelper_1, files_1, lifecycleMainService_1, log_1, productService_1, protocol_1, marketplace_1, storageMainService_1, telemetry_1, themeService_1, themeMainService_1, window_1, windows_1, workspace_1, workspacesManagementMainService_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeWindow = void 0;
    var ReadyState;
    (function (ReadyState) {
        /**
         * This window has not loaded anything yet
         * and this is the initial state of every
         * window.
         */
        ReadyState[ReadyState["NONE"] = 0] = "NONE";
        /**
         * This window is navigating, either for the
         * first time or subsequent times.
         */
        ReadyState[ReadyState["NAVIGATING"] = 1] = "NAVIGATING";
        /**
         * This window has finished loading and is ready
         * to forward IPC requests to the web contents.
         */
        ReadyState[ReadyState["READY"] = 2] = "READY";
    })(ReadyState || (ReadyState = {}));
    let CodeWindow = class CodeWindow extends lifecycle_1.Disposable {
        constructor(config, logService, environmentMainService, fileService, globalStorageMainService, storageMainService, configurationService, themeMainService, workspacesManagementMainService, backupMainService, telemetryService, dialogMainService, lifecycleMainService, productService, protocolMainService, windowsMainService) {
            super();
            this.logService = logService;
            this.environmentMainService = environmentMainService;
            this.fileService = fileService;
            this.globalStorageMainService = globalStorageMainService;
            this.storageMainService = storageMainService;
            this.configurationService = configurationService;
            this.themeMainService = themeMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.backupMainService = backupMainService;
            this.telemetryService = telemetryService;
            this.dialogMainService = dialogMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.productService = productService;
            this.protocolMainService = protocolMainService;
            this.windowsMainService = windowsMainService;
            //#region Events
            this._onWillLoad = this._register(new event_1.Emitter());
            this.onWillLoad = this._onWillLoad.event;
            this._onDidSignalReady = this._register(new event_1.Emitter());
            this.onDidSignalReady = this._onDidSignalReady.event;
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
            this._onDidDestroy = this._register(new event_1.Emitter());
            this.onDidDestroy = this._onDidDestroy.event;
            this._lastFocusTime = -1;
            this.whenReadyCallbacks = [];
            this.touchBarGroups = [];
            this.currentHttpProxy = undefined;
            this.currentNoProxy = undefined;
            this.configObjectUrl = this._register(this.protocolMainService.createIPCObjectUrl());
            this.wasLoaded = false;
            this.readyState = 0 /* ReadyState.NONE */;
            //#region create browser window
            {
                // Load window state
                const [state, hasMultipleDisplays] = this.restoreWindowState(config.state);
                this.windowState = state;
                this.logService.trace('window#ctor: using window state', state);
                // in case we are maximized or fullscreen, only show later after the call to maximize/fullscreen (see below)
                const isFullscreenOrMaximized = (this.windowState.mode === 0 /* WindowMode.Maximized */ || this.windowState.mode === 3 /* WindowMode.Fullscreen */);
                const windowSettings = this.configurationService.getValue('window');
                const options = {
                    width: this.windowState.width,
                    height: this.windowState.height,
                    x: this.windowState.x,
                    y: this.windowState.y,
                    backgroundColor: this.themeMainService.getBackgroundColor(),
                    minWidth: window_1.WindowMinimumSize.WIDTH,
                    minHeight: window_1.WindowMinimumSize.HEIGHT,
                    show: !isFullscreenOrMaximized,
                    title: this.productService.nameLong,
                    webPreferences: Object.assign({ preload: network_1.FileAccess.asFileUri('vs/base/parts/sandbox/electron-browser/preload.js', require).fsPath, additionalArguments: [`--vscode-window-config=${this.configObjectUrl.resource.toString()}`], v8CacheOptions: this.environmentMainService.useCodeCache ? 'bypassHeatCheck' : 'none', enableWebSQL: false, spellcheck: false, nativeWindowOpen: true, zoomFactor: (0, window_1.zoomLevelToZoomFactor)(windowSettings === null || windowSettings === void 0 ? void 0 : windowSettings.zoomLevel), 
                        // Enable experimental css highlight api https://chromestatus.com/feature/5436441440026624
                        // Refs https://github.com/microsoft/vscode/issues/140098
                        enableBlinkFeatures: 'HighlightAPI' }, this.environmentMainService.sandbox ?
                        // Sandbox
                        {
                            sandbox: true
                        } :
                        // No Sandbox
                        {
                            nodeIntegration: true,
                            contextIsolation: false
                        }),
                    experimentalDarkMode: true
                };
                // Apply icon to window
                // Linux: always
                // Windows: only when running out of sources, otherwise an icon is set by us on the executable
                if (platform_1.isLinux) {
                    options.icon = (0, path_1.join)(this.environmentMainService.appRoot, 'resources/linux/code.png');
                }
                else if (platform_1.isWindows && !this.environmentMainService.isBuilt) {
                    options.icon = (0, path_1.join)(this.environmentMainService.appRoot, 'resources/win32/code_150x150.png');
                }
                if (platform_1.isMacintosh && !this.useNativeFullScreen()) {
                    options.fullscreenable = false; // enables simple fullscreen mode
                }
                if (platform_1.isMacintosh) {
                    options.acceptFirstMouse = true; // enabled by default
                    if ((windowSettings === null || windowSettings === void 0 ? void 0 : windowSettings.clickThroughInactive) === false) {
                        options.acceptFirstMouse = false;
                    }
                }
                const useNativeTabs = platform_1.isMacintosh && (windowSettings === null || windowSettings === void 0 ? void 0 : windowSettings.nativeTabs) === true;
                if (useNativeTabs) {
                    options.tabbingIdentifier = this.productService.nameShort; // this opts in to sierra tabs
                }
                const useCustomTitleStyle = (0, window_1.getTitleBarStyle)(this.configurationService) === 'custom';
                if (useCustomTitleStyle) {
                    options.titleBarStyle = 'hidden';
                    this.hiddenTitleBarStyle = true;
                    if (!platform_1.isMacintosh) {
                        options.frame = false;
                    }
                }
                // Create the browser window
                (0, performance_1.mark)('code/willCreateCodeBrowserWindow');
                this._win = new electron_1.BrowserWindow(options);
                (0, performance_1.mark)('code/didCreateCodeBrowserWindow');
                this._id = this._win.id;
                // Open devtools if instructed from command line args
                if (this.environmentMainService.args['open-devtools'] === true) {
                    this._win.webContents.openDevTools();
                }
                if (platform_1.isMacintosh && useCustomTitleStyle) {
                    this._win.setSheetOffset(22); // offset dialogs by the height of the custom title bar if we have any
                }
                // TODO@electron (Electron 4 regression): when running on multiple displays where the target display
                // to open the window has a larger resolution than the primary display, the window will not size
                // correctly unless we set the bounds again (https://github.com/microsoft/vscode/issues/74872)
                //
                // However, when running with native tabs with multiple windows we cannot use this workaround
                // because there is a potential that the new window will be added as native tab instead of being
                // a window on its own. In that case calling setBounds() would cause https://github.com/microsoft/vscode/issues/75830
                if (platform_1.isMacintosh && hasMultipleDisplays && (!useNativeTabs || electron_1.BrowserWindow.getAllWindows().length === 1)) {
                    if ([this.windowState.width, this.windowState.height, this.windowState.x, this.windowState.y].every(value => typeof value === 'number')) {
                        const ensuredWindowState = this.windowState;
                        this._win.setBounds({
                            width: ensuredWindowState.width,
                            height: ensuredWindowState.height,
                            x: ensuredWindowState.x,
                            y: ensuredWindowState.y
                        });
                    }
                }
                if (isFullscreenOrMaximized) {
                    (0, performance_1.mark)('code/willMaximizeCodeWindow');
                    this._win.maximize();
                    if (this.windowState.mode === 3 /* WindowMode.Fullscreen */) {
                        this.setFullScreen(true);
                    }
                    if (!this._win.isVisible()) {
                        this._win.show(); // to reduce flicker from the default window size to maximize, we only show after maximize
                    }
                    (0, performance_1.mark)('code/didMaximizeCodeWindow');
                }
                this._lastFocusTime = Date.now(); // since we show directly, we need to set the last focus time too
            }
            //#endregion
            // respect configured menu bar visibility
            this.onConfigurationUpdated();
            // macOS: touch bar support
            this.createTouchBar();
            // Eventing
            this.registerListeners();
        }
        get id() { return this._id; }
        get win() { return this._win; }
        get lastFocusTime() { return this._lastFocusTime; }
        get backupPath() { var _a; return (_a = this._config) === null || _a === void 0 ? void 0 : _a.backupPath; }
        get openedWorkspace() { var _a; return (_a = this._config) === null || _a === void 0 ? void 0 : _a.workspace; }
        get remoteAuthority() { var _a; return (_a = this._config) === null || _a === void 0 ? void 0 : _a.remoteAuthority; }
        get config() { return this._config; }
        get hasHiddenTitleBarStyle() { return !!this.hiddenTitleBarStyle; }
        get isExtensionDevelopmentHost() { var _a; return !!((_a = this._config) === null || _a === void 0 ? void 0 : _a.extensionDevelopmentPath); }
        get isExtensionTestHost() { var _a; return !!((_a = this._config) === null || _a === void 0 ? void 0 : _a.extensionTestsPath); }
        get isExtensionDevelopmentTestFromCli() { var _a; return this.isExtensionDevelopmentHost && this.isExtensionTestHost && !((_a = this._config) === null || _a === void 0 ? void 0 : _a.debugId); }
        setRepresentedFilename(filename) {
            if (platform_1.isMacintosh) {
                this._win.setRepresentedFilename(filename);
            }
            else {
                this.representedFilename = filename;
            }
        }
        getRepresentedFilename() {
            if (platform_1.isMacintosh) {
                return this._win.getRepresentedFilename();
            }
            return this.representedFilename;
        }
        setDocumentEdited(edited) {
            if (platform_1.isMacintosh) {
                this._win.setDocumentEdited(edited);
            }
            this.documentEdited = edited;
        }
        isDocumentEdited() {
            if (platform_1.isMacintosh) {
                return this._win.isDocumentEdited();
            }
            return !!this.documentEdited;
        }
        focus(options) {
            // macOS: Electron > 7.x changed its behaviour to not
            // bring the application to the foreground when a window
            // is focused programmatically. Only via `app.focus` and
            // the option `steal: true` can you get the previous
            // behaviour back. The only reason to use this option is
            // when a window is getting focused while the application
            // is not in the foreground.
            if (platform_1.isMacintosh && (options === null || options === void 0 ? void 0 : options.force)) {
                electron_1.app.focus({ steal: true });
            }
            if (!this._win) {
                return;
            }
            if (this._win.isMinimized()) {
                this._win.restore();
            }
            this._win.focus();
        }
        setReady() {
            this.logService.info(`window#load: window reported ready (id: ${this._id})`);
            this.readyState = 2 /* ReadyState.READY */;
            // inform all waiting promises that we are ready now
            while (this.whenReadyCallbacks.length) {
                this.whenReadyCallbacks.pop()(this);
            }
            // Events
            this._onDidSignalReady.fire();
        }
        ready() {
            return new Promise(resolve => {
                if (this.isReady) {
                    return resolve(this);
                }
                // otherwise keep and call later when we are ready
                this.whenReadyCallbacks.push(resolve);
            });
        }
        get isReady() {
            return this.readyState === 2 /* ReadyState.READY */;
        }
        get whenClosedOrLoaded() {
            return new Promise(resolve => {
                function handle() {
                    closeListener.dispose();
                    loadListener.dispose();
                    resolve();
                }
                const closeListener = this.onDidClose(() => handle());
                const loadListener = this.onWillLoad(() => handle());
            });
        }
        registerListeners() {
            // Crashes & Unresponsive & Failed to load
            this._win.on('unresponsive', () => this.onWindowError(1 /* WindowError.UNRESPONSIVE */));
            this._win.webContents.on('render-process-gone', (event, details) => this.onWindowError(2 /* WindowError.CRASHED */, details));
            this._win.webContents.on('did-fail-load', (event, exitCode, reason) => this.onWindowError(3 /* WindowError.LOAD */, { reason, exitCode }));
            // Prevent windows/iframes from blocking the unload
            // through DOM events. We have our own logic for
            // unloading a window that should not be confused
            // with the DOM way.
            // (https://github.com/microsoft/vscode/issues/122736)
            this._win.webContents.on('will-prevent-unload', event => {
                event.preventDefault();
            });
            // Window close
            this._win.on('closed', () => {
                this._onDidClose.fire();
                this.dispose();
            });
            // Remember that we loaded
            this._win.webContents.on('did-finish-load', () => {
                // Associate properties from the load request if provided
                if (this.pendingLoadConfig) {
                    this._config = this.pendingLoadConfig;
                    this.pendingLoadConfig = undefined;
                }
            });
            // Window Focus
            this._win.on('focus', () => {
                this._lastFocusTime = Date.now();
            });
            // Window (Un)Maximize
            this._win.on('maximize', (e) => {
                if (this._config) {
                    this._config.maximized = true;
                }
                electron_1.app.emit('browser-window-maximize', e, this._win);
            });
            this._win.on('unmaximize', (e) => {
                if (this._config) {
                    this._config.maximized = false;
                }
                electron_1.app.emit('browser-window-unmaximize', e, this._win);
            });
            // Window Fullscreen
            this._win.on('enter-full-screen', () => {
                this.sendWhenReady('vscode:enterFullScreen', cancellation_1.CancellationToken.None);
            });
            this._win.on('leave-full-screen', () => {
                this.sendWhenReady('vscode:leaveFullScreen', cancellation_1.CancellationToken.None);
            });
            // Handle configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(() => this.onConfigurationUpdated()));
            // Handle Workspace events
            this._register(this.workspacesManagementMainService.onDidDeleteUntitledWorkspace(e => this.onDidDeleteUntitledWorkspace(e)));
            // Inject headers when requests are incoming
            const urls = ['https://marketplace.visualstudio.com/*', 'https://*.vsassets.io/*'];
            this._win.webContents.session.webRequest.onBeforeSendHeaders({ urls }, async (details, cb) => {
                const headers = await this.getMarketplaceHeaders();
                cb({ cancel: false, requestHeaders: Object.assign(details.requestHeaders, headers) });
            });
        }
        getMarketplaceHeaders() {
            if (!this.marketplaceHeadersPromise) {
                this.marketplaceHeadersPromise = (0, marketplace_1.resolveMarketplaceHeaders)(this.productService.version, this.productService, this.environmentMainService, this.configurationService, this.fileService, this.globalStorageMainService);
            }
            return this.marketplaceHeadersPromise;
        }
        async onWindowError(type, details) {
            var _a, _b, _c;
            switch (type) {
                case 2 /* WindowError.CRASHED */:
                    this.logService.error(`CodeWindow: renderer process crashed (reason: ${(details === null || details === void 0 ? void 0 : details.reason) || '<unknown>'}, code: ${(details === null || details === void 0 ? void 0 : details.exitCode) || '<unknown>'})`);
                    break;
                case 1 /* WindowError.UNRESPONSIVE */:
                    this.logService.error('CodeWindow: detected unresponsive');
                    break;
                case 3 /* WindowError.LOAD */:
                    this.logService.error(`CodeWindow: failed to load (reason: ${(details === null || details === void 0 ? void 0 : details.reason) || '<unknown>'}, code: ${(details === null || details === void 0 ? void 0 : details.exitCode) || '<unknown>'})`);
                    break;
            }
            this.telemetryService.publicLog2('windowerror', { type, reason: details === null || details === void 0 ? void 0 : details.reason, code: details === null || details === void 0 ? void 0 : details.exitCode });
            // Inform User if non-recoverable
            switch (type) {
                case 1 /* WindowError.UNRESPONSIVE */:
                case 2 /* WindowError.CRASHED */:
                    // If we run extension tests from CLI, showing a dialog is not
                    // very helpful in this case. Rather, we bring down the test run
                    // to signal back a failing run.
                    if (this.isExtensionDevelopmentTestFromCli) {
                        this.lifecycleMainService.kill(1);
                        return;
                    }
                    // If we run smoke tests, we never want to show a blocking dialog
                    if (this.environmentMainService.args['enable-smoke-test-driver']) {
                        this.destroyWindow(false, false);
                        return;
                    }
                    // Unresponsive
                    if (type === 1 /* WindowError.UNRESPONSIVE */) {
                        if (this.isExtensionDevelopmentHost || this.isExtensionTestHost || (this._win && this._win.webContents && this._win.webContents.isDevToolsOpened())) {
                            // TODO@electron Workaround for https://github.com/microsoft/vscode/issues/56994
                            // In certain cases the window can report unresponsiveness because a breakpoint was hit
                            // and the process is stopped executing. The most typical cases are:
                            // - devtools are opened and debugging happens
                            // - window is an extensions development host that is being debugged
                            // - window is an extension test development host that is being debugged
                            return;
                        }
                        // Show Dialog
                        const result = await this.dialogMainService.showMessageBox({
                            title: this.productService.nameLong,
                            type: 'warning',
                            buttons: [
                                (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'reopen', comment: ['&& denotes a mnemonic'] }, "&&Reopen")),
                                (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'wait', comment: ['&& denotes a mnemonic'] }, "&&Keep Waiting")),
                                (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))
                            ],
                            message: (0, nls_1.localize)('appStalled', "The window is not responding"),
                            detail: (0, nls_1.localize)('appStalledDetail', "You can reopen or close the window or keep waiting."),
                            noLink: true,
                            defaultId: 0,
                            cancelId: 1,
                            checkboxLabel: ((_a = this._config) === null || _a === void 0 ? void 0 : _a.workspace) ? (0, nls_1.localize)('doNotRestoreEditors', "Don't restore editors") : undefined
                        }, this._win);
                        // Handle choice
                        if (result.response !== 1 /* keep waiting */) {
                            const reopen = result.response === 0;
                            this.destroyWindow(reopen, result.checkboxChecked);
                        }
                    }
                    // Crashed
                    else if (type === 2 /* WindowError.CRASHED */) {
                        let message;
                        if (!details) {
                            message = (0, nls_1.localize)('appCrashed', "The window has crashed");
                        }
                        else {
                            message = (0, nls_1.localize)('appCrashedDetails', "The window has crashed (reason: '{0}', code: '{1}')", details.reason, (_b = details.exitCode) !== null && _b !== void 0 ? _b : '<unknown>');
                        }
                        // Show Dialog
                        const result = await this.dialogMainService.showMessageBox({
                            title: this.productService.nameLong,
                            type: 'warning',
                            buttons: [
                                (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'reopen', comment: ['&& denotes a mnemonic'] }, "&&Reopen")),
                                (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))
                            ],
                            message,
                            detail: (0, nls_1.localize)('appCrashedDetail', "We are sorry for the inconvenience. You can reopen the window to continue where you left off."),
                            noLink: true,
                            defaultId: 0,
                            checkboxLabel: ((_c = this._config) === null || _c === void 0 ? void 0 : _c.workspace) ? (0, nls_1.localize)('doNotRestoreEditors', "Don't restore editors") : undefined
                        }, this._win);
                        // Handle choice
                        const reopen = result.response === 0;
                        this.destroyWindow(reopen, result.checkboxChecked);
                    }
                    break;
            }
        }
        async destroyWindow(reopen, skipRestoreEditors) {
            var _a, _b;
            const workspace = (_a = this._config) === null || _a === void 0 ? void 0 : _a.workspace;
            //  check to discard editor state first
            if (skipRestoreEditors && workspace) {
                try {
                    const workspaceStorage = this.storageMainService.workspaceStorage(workspace);
                    await workspaceStorage.init();
                    workspaceStorage.delete('memento/workbench.parts.editor');
                    await workspaceStorage.close();
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            // 'close' event will not be fired on destroy(), so signal crash via explicit event
            this._onDidDestroy.fire();
            // make sure to destroy the window as it has crashed
            (_b = this._win) === null || _b === void 0 ? void 0 : _b.destroy();
            // ask the windows service to open a new fresh window if specified
            if (reopen && this._config) {
                // We have to reconstruct a openable from the current workspace
                let uriToOpen = undefined;
                let forceEmpty = undefined;
                if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                    uriToOpen = { folderUri: workspace.uri };
                }
                else if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                    uriToOpen = { workspaceUri: workspace.configPath };
                }
                else {
                    forceEmpty = true;
                }
                // Delegate to windows service
                const [window] = this.windowsMainService.open({
                    context: 5 /* OpenContext.API */,
                    userEnv: this._config.userEnv,
                    cli: Object.assign(Object.assign({}, this.environmentMainService.args), { _: [] // we pass in the workspace to open explicitly via `urisToOpen`
                     }),
                    urisToOpen: uriToOpen ? [uriToOpen] : undefined,
                    forceEmpty,
                    forceNewWindow: true,
                    remoteAuthority: this.remoteAuthority
                });
                window.focus();
            }
        }
        onDidDeleteUntitledWorkspace(workspace) {
            var _a, _b;
            // Make sure to update our workspace config if we detect that it
            // was deleted
            if (((_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.workspace) === null || _b === void 0 ? void 0 : _b.id) === workspace.id && this._config) {
                this._config.workspace = undefined;
            }
        }
        onConfigurationUpdated() {
            // Menubar
            const newMenuBarVisibility = this.getMenuBarVisibility();
            if (newMenuBarVisibility !== this.currentMenuBarVisibility) {
                this.currentMenuBarVisibility = newMenuBarVisibility;
                this.setMenuBarVisibility(newMenuBarVisibility);
            }
            // Proxy
            let newHttpProxy = (this.configurationService.getValue('http.proxy') || '').trim()
                || (process.env['https_proxy'] || process.env['HTTPS_PROXY'] || process.env['http_proxy'] || process.env['HTTP_PROXY'] || '').trim() // Not standardized.
                || undefined;
            if (newHttpProxy === null || newHttpProxy === void 0 ? void 0 : newHttpProxy.endsWith('/')) {
                newHttpProxy = newHttpProxy.substr(0, newHttpProxy.length - 1);
            }
            const newNoProxy = (process.env['no_proxy'] || process.env['NO_PROXY'] || '').trim() || undefined; // Not standardized.
            if ((newHttpProxy || '').indexOf('@') === -1 && (newHttpProxy !== this.currentHttpProxy || newNoProxy !== this.currentNoProxy)) {
                this.currentHttpProxy = newHttpProxy;
                this.currentNoProxy = newNoProxy;
                const proxyRules = newHttpProxy || '';
                const proxyBypassRules = newNoProxy ? `${newNoProxy},<local>` : '<local>';
                this.logService.trace(`Setting proxy to '${proxyRules}', bypassing '${proxyBypassRules}'`);
                this._win.webContents.session.setProxy({ proxyRules, proxyBypassRules, pacScript: '' });
            }
        }
        addTabbedWindow(window) {
            if (platform_1.isMacintosh && window.win) {
                this._win.addTabbedWindow(window.win);
            }
        }
        load(configuration, options = Object.create(null)) {
            this.logService.info(`window#load: attempt to load window (id: ${this._id})`);
            // Clear Document Edited if needed
            if (this.isDocumentEdited()) {
                if (!options.isReload || !this.backupMainService.isHotExitEnabled()) {
                    this.setDocumentEdited(false);
                }
            }
            // Clear Title and Filename if needed
            if (!options.isReload) {
                if (this.getRepresentedFilename()) {
                    this.setRepresentedFilename('');
                }
                this._win.setTitle(this.productService.nameLong);
            }
            // Update configuration values based on our window context
            // and set it into the config object URL for usage.
            this.updateConfiguration(configuration, options);
            // If this is the first time the window is loaded, we associate the paths
            // directly with the window because we assume the loading will just work
            if (this.readyState === 0 /* ReadyState.NONE */) {
                this._config = configuration;
            }
            // Otherwise, the window is currently showing a folder and if there is an
            // unload handler preventing the load, we cannot just associate the paths
            // because the loading might be vetoed. Instead we associate it later when
            // the window load event has fired.
            else {
                this.pendingLoadConfig = configuration;
            }
            // Indicate we are navigting now
            this.readyState = 1 /* ReadyState.NAVIGATING */;
            // Load URL
            this._win.loadURL(network_1.FileAccess.asBrowserUri(this.environmentMainService.sandbox ?
                'vs/code/electron-sandbox/workbench/workbench.html' :
                'vs/code/electron-browser/workbench/workbench.html', require).toString(true));
            // Remember that we did load
            const wasLoaded = this.wasLoaded;
            this.wasLoaded = true;
            // Make window visible if it did not open in N seconds because this indicates an error
            // Only do this when running out of sources and not when running tests
            if (!this.environmentMainService.isBuilt && !this.environmentMainService.extensionTestsLocationURI) {
                this._register(new async_1.RunOnceScheduler(() => {
                    if (this._win && !this._win.isVisible() && !this._win.isMinimized()) {
                        this._win.show();
                        this.focus({ force: true });
                        this._win.webContents.openDevTools();
                    }
                }, 10000)).schedule();
            }
            // Event
            this._onWillLoad.fire({ workspace: configuration.workspace, reason: options.isReload ? 3 /* LoadReason.RELOAD */ : wasLoaded ? 2 /* LoadReason.LOAD */ : 1 /* LoadReason.INITIAL */ });
        }
        updateConfiguration(configuration, options) {
            var _a, _b;
            // If this window was loaded before from the command line
            // (as indicated by VSCODE_CLI environment), make sure to
            // preserve that user environment in subsequent loads,
            // unless the new configuration context was also a CLI
            // (for https://github.com/microsoft/vscode/issues/108571)
            // Also, preserve the environment if we're loading from an
            // extension development host that had its environment set
            // (for https://github.com/microsoft/vscode/issues/123508)
            const currentUserEnv = (_b = ((_a = this._config) !== null && _a !== void 0 ? _a : this.pendingLoadConfig)) === null || _b === void 0 ? void 0 : _b.userEnv;
            if (currentUserEnv) {
                const shouldPreserveLaunchCliEnvironment = (0, argvHelper_1.isLaunchedFromCli)(currentUserEnv) && !(0, argvHelper_1.isLaunchedFromCli)(configuration.userEnv);
                const shouldPreserveDebugEnvironmnet = this.isExtensionDevelopmentHost;
                if (shouldPreserveLaunchCliEnvironment || shouldPreserveDebugEnvironmnet) {
                    configuration.userEnv = Object.assign(Object.assign({}, currentUserEnv), configuration.userEnv); // still allow to override certain environment as passed in
                }
            }
            // If named pipe was instantiated for the crashpad_handler process, reuse the same
            // pipe for new app instances connecting to the original app instance.
            // Ref: https://github.com/microsoft/vscode/issues/115874
            if (process.env['CHROME_CRASHPAD_PIPE_NAME']) {
                Object.assign(configuration.userEnv, {
                    CHROME_CRASHPAD_PIPE_NAME: process.env['CHROME_CRASHPAD_PIPE_NAME']
                });
            }
            // Add disable-extensions to the config, but do not preserve it on currentConfig or
            // pendingLoadConfig so that it is applied only on this load
            if (options.disableExtensions !== undefined) {
                configuration['disable-extensions'] = options.disableExtensions;
            }
            // Update window related properties
            configuration.fullscreen = this.isFullScreen;
            configuration.maximized = this._win.isMaximized();
            configuration.partsSplash = this.themeMainService.getWindowSplash();
            // Update with latest perf marks
            (0, performance_1.mark)('code/willOpenNewWindow');
            configuration.perfMarks = (0, performance_1.getMarks)();
            // Update in config object URL for usage in renderer
            this.configObjectUrl.update(configuration);
        }
        async reload(cli) {
            // Copy our current config for reuse
            const configuration = Object.assign({}, this._config);
            // Validate workspace
            configuration.workspace = await this.validateWorkspaceBeforeReload(configuration);
            // Delete some properties we do not want during reload
            delete configuration.filesToOpenOrCreate;
            delete configuration.filesToDiff;
            delete configuration.filesToWait;
            // Some configuration things get inherited if the window is being reloaded and we are
            // in extension development mode. These options are all development related.
            if (this.isExtensionDevelopmentHost && cli) {
                configuration.verbose = cli.verbose;
                configuration.debugId = cli.debugId;
                configuration.extensionEnvironment = cli.extensionEnvironment;
                configuration['inspect-extensions'] = cli['inspect-extensions'];
                configuration['inspect-brk-extensions'] = cli['inspect-brk-extensions'];
                configuration['extensions-dir'] = cli['extensions-dir'];
            }
            configuration.isInitialStartup = false; // since this is a reload
            // Load config
            this.load(configuration, { isReload: true, disableExtensions: cli === null || cli === void 0 ? void 0 : cli['disable-extensions'] });
        }
        async validateWorkspaceBeforeReload(configuration) {
            // Multi folder
            if ((0, workspace_1.isWorkspaceIdentifier)(configuration.workspace)) {
                const configPath = configuration.workspace.configPath;
                if (configPath.scheme === network_1.Schemas.file) {
                    const workspaceExists = await this.fileService.exists(configPath);
                    if (!workspaceExists) {
                        return undefined;
                    }
                }
            }
            // Single folder
            else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(configuration.workspace)) {
                const uri = configuration.workspace.uri;
                if (uri.scheme === network_1.Schemas.file) {
                    const folderExists = await this.fileService.exists(uri);
                    if (!folderExists) {
                        return undefined;
                    }
                }
            }
            // Workspace is valid
            return configuration.workspace;
        }
        serializeWindowState() {
            if (!this._win) {
                return (0, window_2.defaultWindowState)();
            }
            // fullscreen gets special treatment
            if (this.isFullScreen) {
                let display;
                try {
                    display = electron_1.screen.getDisplayMatching(this.getBounds());
                }
                catch (error) {
                    // Electron has weird conditions under which it throws errors
                    // e.g. https://github.com/microsoft/vscode/issues/100334 when
                    // large numbers are passed in
                }
                const defaultState = (0, window_2.defaultWindowState)();
                const res = {
                    mode: 3 /* WindowMode.Fullscreen */,
                    display: display ? display.id : undefined,
                    // Still carry over window dimensions from previous sessions
                    // if we can compute it in fullscreen state.
                    // does not seem possible in all cases on Linux for example
                    // (https://github.com/microsoft/vscode/issues/58218) so we
                    // fallback to the defaults in that case.
                    width: this.windowState.width || defaultState.width,
                    height: this.windowState.height || defaultState.height,
                    x: this.windowState.x || 0,
                    y: this.windowState.y || 0
                };
                return res;
            }
            const state = Object.create(null);
            let mode;
            // get window mode
            if (!platform_1.isMacintosh && this._win.isMaximized()) {
                mode = 0 /* WindowMode.Maximized */;
            }
            else {
                mode = 1 /* WindowMode.Normal */;
            }
            // we don't want to save minimized state, only maximized or normal
            if (mode === 0 /* WindowMode.Maximized */) {
                state.mode = 0 /* WindowMode.Maximized */;
            }
            else {
                state.mode = 1 /* WindowMode.Normal */;
            }
            // only consider non-minimized window states
            if (mode === 1 /* WindowMode.Normal */ || mode === 0 /* WindowMode.Maximized */) {
                let bounds;
                if (mode === 1 /* WindowMode.Normal */) {
                    bounds = this.getBounds();
                }
                else {
                    bounds = this._win.getNormalBounds(); // make sure to persist the normal bounds when maximized to be able to restore them
                }
                state.x = bounds.x;
                state.y = bounds.y;
                state.width = bounds.width;
                state.height = bounds.height;
            }
            return state;
        }
        restoreWindowState(state) {
            (0, performance_1.mark)('code/willRestoreCodeWindowState');
            let hasMultipleDisplays = false;
            if (state) {
                try {
                    const displays = electron_1.screen.getAllDisplays();
                    hasMultipleDisplays = displays.length > 1;
                    state = this.validateWindowState(state, displays);
                }
                catch (err) {
                    this.logService.warn(`Unexpected error validating window state: ${err}\n${err.stack}`); // somehow display API can be picky about the state to validate
                }
            }
            (0, performance_1.mark)('code/didRestoreCodeWindowState');
            return [state || (0, window_2.defaultWindowState)(), hasMultipleDisplays];
        }
        validateWindowState(state, displays) {
            var _a, _b;
            this.logService.trace(`window#validateWindowState: validating window state on ${displays.length} display(s)`, state);
            if (typeof state.x !== 'number'
                || typeof state.y !== 'number'
                || typeof state.width !== 'number'
                || typeof state.height !== 'number') {
                this.logService.trace('window#validateWindowState: unexpected type of state values');
                return undefined;
            }
            if (state.width <= 0 || state.height <= 0) {
                this.logService.trace('window#validateWindowState: unexpected negative values');
                return undefined;
            }
            // Single Monitor: be strict about x/y positioning
            // macOS & Linux: these OS seem to be pretty good in ensuring that a window is never outside of it's bounds.
            // Windows: it is possible to have a window with a size that makes it fall out of the window. our strategy
            //          is to try as much as possible to keep the window in the monitor bounds. we are not as strict as
            //          macOS and Linux and allow the window to exceed the monitor bounds as long as the window is still
            //          some pixels (128) visible on the screen for the user to drag it back.
            if (displays.length === 1) {
                const displayWorkingArea = this.getWorkingArea(displays[0]);
                if (displayWorkingArea) {
                    this.logService.trace('window#validateWindowState: 1 monitor working area', displayWorkingArea);
                    function ensureStateInDisplayWorkingArea() {
                        if (!state || typeof state.x !== 'number' || typeof state.y !== 'number' || !displayWorkingArea) {
                            return;
                        }
                        if (state.x < displayWorkingArea.x) {
                            // prevent window from falling out of the screen to the left
                            state.x = displayWorkingArea.x;
                        }
                        if (state.y < displayWorkingArea.y) {
                            // prevent window from falling out of the screen to the top
                            state.y = displayWorkingArea.y;
                        }
                    }
                    // ensure state is not outside display working area (top, left)
                    ensureStateInDisplayWorkingArea();
                    if (state.width > displayWorkingArea.width) {
                        // prevent window from exceeding display bounds width
                        state.width = displayWorkingArea.width;
                    }
                    if (state.height > displayWorkingArea.height) {
                        // prevent window from exceeding display bounds height
                        state.height = displayWorkingArea.height;
                    }
                    if (state.x > (displayWorkingArea.x + displayWorkingArea.width - 128)) {
                        // prevent window from falling out of the screen to the right with
                        // 128px margin by positioning the window to the far right edge of
                        // the screen
                        state.x = displayWorkingArea.x + displayWorkingArea.width - state.width;
                    }
                    if (state.y > (displayWorkingArea.y + displayWorkingArea.height - 128)) {
                        // prevent window from falling out of the screen to the bottom with
                        // 128px margin by positioning the window to the far bottom edge of
                        // the screen
                        state.y = displayWorkingArea.y + displayWorkingArea.height - state.height;
                    }
                    // again ensure state is not outside display working area
                    // (it may have changed from the previous validation step)
                    ensureStateInDisplayWorkingArea();
                }
                return state;
            }
            // Multi Montior (fullscreen): try to find the previously used display
            if (state.display && state.mode === 3 /* WindowMode.Fullscreen */) {
                const display = displays.find(d => d.id === state.display);
                if (display && typeof ((_a = display.bounds) === null || _a === void 0 ? void 0 : _a.x) === 'number' && typeof ((_b = display.bounds) === null || _b === void 0 ? void 0 : _b.y) === 'number') {
                    this.logService.trace('window#validateWindowState: restoring fullscreen to previous display');
                    const defaults = (0, window_2.defaultWindowState)(3 /* WindowMode.Fullscreen */); // make sure we have good values when the user restores the window
                    defaults.x = display.bounds.x; // carefull to use displays x/y position so that the window ends up on the correct monitor
                    defaults.y = display.bounds.y;
                    return defaults;
                }
            }
            // Multi Monitor (non-fullscreen): ensure window is within display bounds
            let display;
            let displayWorkingArea;
            try {
                display = electron_1.screen.getDisplayMatching({ x: state.x, y: state.y, width: state.width, height: state.height });
                displayWorkingArea = this.getWorkingArea(display);
            }
            catch (error) {
                // Electron has weird conditions under which it throws errors
                // e.g. https://github.com/microsoft/vscode/issues/100334 when
                // large numbers are passed in
            }
            if (display && // we have a display matching the desired bounds
                displayWorkingArea && // we have valid working area bounds
                state.x + state.width > displayWorkingArea.x && // prevent window from falling out of the screen to the left
                state.y + state.height > displayWorkingArea.y && // prevent window from falling out of the screen to the top
                state.x < displayWorkingArea.x + displayWorkingArea.width && // prevent window from falling out of the screen to the right
                state.y < displayWorkingArea.y + displayWorkingArea.height // prevent window from falling out of the screen to the bottom
            ) {
                this.logService.trace('window#validateWindowState: multi-monitor working area', displayWorkingArea);
                return state;
            }
            return undefined;
        }
        getWorkingArea(display) {
            // Prefer the working area of the display to account for taskbars on the
            // desktop being positioned somewhere (https://github.com/microsoft/vscode/issues/50830).
            //
            // Linux X11 sessions sometimes report wrong display bounds, so we validate
            // the reported sizes are positive.
            if (display.workArea.width > 0 && display.workArea.height > 0) {
                return display.workArea;
            }
            if (display.bounds.width > 0 && display.bounds.height > 0) {
                return display.bounds;
            }
            return undefined;
        }
        getBounds() {
            const [x, y] = this._win.getPosition();
            const [width, height] = this._win.getSize();
            return { x, y, width, height };
        }
        toggleFullScreen() {
            this.setFullScreen(!this.isFullScreen);
        }
        setFullScreen(fullscreen) {
            // Set fullscreen state
            if (this.useNativeFullScreen()) {
                this.setNativeFullScreen(fullscreen);
            }
            else {
                this.setSimpleFullScreen(fullscreen);
            }
            // Events
            this.sendWhenReady(fullscreen ? 'vscode:enterFullScreen' : 'vscode:leaveFullScreen', cancellation_1.CancellationToken.None);
            // Respect configured menu bar visibility or default to toggle if not set
            if (this.currentMenuBarVisibility) {
                this.setMenuBarVisibility(this.currentMenuBarVisibility, false);
            }
        }
        get isFullScreen() { return this._win.isFullScreen() || this._win.isSimpleFullScreen(); }
        setNativeFullScreen(fullscreen) {
            if (this._win.isSimpleFullScreen()) {
                this._win.setSimpleFullScreen(false);
            }
            this._win.setFullScreen(fullscreen);
        }
        setSimpleFullScreen(fullscreen) {
            if (this._win.isFullScreen()) {
                this._win.setFullScreen(false);
            }
            this._win.setSimpleFullScreen(fullscreen);
            this._win.webContents.focus(); // workaround issue where focus is not going into window
        }
        useNativeFullScreen() {
            const windowConfig = this.configurationService.getValue('window');
            if (!windowConfig || typeof windowConfig.nativeFullScreen !== 'boolean') {
                return true; // default
            }
            if (windowConfig.nativeTabs) {
                return true; // https://github.com/electron/electron/issues/16142
            }
            return windowConfig.nativeFullScreen !== false;
        }
        isMinimized() {
            return this._win.isMinimized();
        }
        getMenuBarVisibility() {
            let menuBarVisibility = (0, window_1.getMenuBarVisibility)(this.configurationService);
            if (['visible', 'toggle', 'hidden'].indexOf(menuBarVisibility) < 0) {
                menuBarVisibility = 'classic';
            }
            return menuBarVisibility;
        }
        setMenuBarVisibility(visibility, notify = true) {
            if (platform_1.isMacintosh) {
                return; // ignore for macOS platform
            }
            if (visibility === 'toggle') {
                if (notify) {
                    this.send('vscode:showInfoMessage', (0, nls_1.localize)('hiddenMenuBar', "You can still access the menu bar by pressing the Alt-key."));
                }
            }
            if (visibility === 'hidden') {
                // for some weird reason that I have no explanation for, the menu bar is not hiding when calling
                // this without timeout (see https://github.com/microsoft/vscode/issues/19777). there seems to be
                // a timing issue with us opening the first window and the menu bar getting created. somehow the
                // fact that we want to hide the menu without being able to bring it back via Alt key makes Electron
                // still show the menu. Unable to reproduce from a simple Hello World application though...
                setTimeout(() => {
                    this.doSetMenuBarVisibility(visibility);
                });
            }
            else {
                this.doSetMenuBarVisibility(visibility);
            }
        }
        doSetMenuBarVisibility(visibility) {
            const isFullscreen = this.isFullScreen;
            switch (visibility) {
                case ('classic'):
                    this._win.setMenuBarVisibility(!isFullscreen);
                    this._win.autoHideMenuBar = isFullscreen;
                    break;
                case ('visible'):
                    this._win.setMenuBarVisibility(true);
                    this._win.autoHideMenuBar = false;
                    break;
                case ('toggle'):
                    this._win.setMenuBarVisibility(false);
                    this._win.autoHideMenuBar = true;
                    break;
                case ('hidden'):
                    this._win.setMenuBarVisibility(false);
                    this._win.autoHideMenuBar = false;
                    break;
            }
        }
        handleTitleDoubleClick() {
            // Respect system settings on mac with regards to title click on windows title
            if (platform_1.isMacintosh) {
                const action = electron_1.systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string');
                switch (action) {
                    case 'Minimize':
                        this._win.minimize();
                        break;
                    case 'None':
                        break;
                    case 'Maximize':
                    default:
                        if (this._win.isMaximized()) {
                            this._win.unmaximize();
                        }
                        else {
                            this._win.maximize();
                        }
                }
            }
            // Linux/Windows: just toggle maximize/minimized state
            else {
                if (this._win.isMaximized()) {
                    this._win.unmaximize();
                }
                else {
                    this._win.maximize();
                }
            }
        }
        close() {
            if (this._win) {
                this._win.close();
            }
        }
        sendWhenReady(channel, token, ...args) {
            if (this.isReady) {
                this.send(channel, ...args);
            }
            else {
                this.ready().then(() => {
                    if (!token.isCancellationRequested) {
                        this.send(channel, ...args);
                    }
                });
            }
        }
        send(channel, ...args) {
            if (this._win) {
                if (this._win.isDestroyed() || this._win.webContents.isDestroyed()) {
                    this.logService.warn(`Sending IPC message to channel '${channel}' for window that is destroyed`);
                    return;
                }
                try {
                    this._win.webContents.send(channel, ...args);
                }
                catch (error) {
                    this.logService.warn(`Error sending IPC message to channel '${channel}' of window ${this._id}: ${(0, errorMessage_1.toErrorMessage)(error)}`);
                }
            }
        }
        updateTouchBar(groups) {
            if (!platform_1.isMacintosh) {
                return; // only supported on macOS
            }
            // Update segments for all groups. Setting the segments property
            // of the group directly prevents ugly flickering from happening
            this.touchBarGroups.forEach((touchBarGroup, index) => {
                const commands = groups[index];
                touchBarGroup.segments = this.createTouchBarGroupSegments(commands);
            });
        }
        createTouchBar() {
            if (!platform_1.isMacintosh) {
                return; // only supported on macOS
            }
            // To avoid flickering, we try to reuse the touch bar group
            // as much as possible by creating a large number of groups
            // for reusing later.
            for (let i = 0; i < 10; i++) {
                const groupTouchBar = this.createTouchBarGroup();
                this.touchBarGroups.push(groupTouchBar);
            }
            this._win.setTouchBar(new electron_1.TouchBar({ items: this.touchBarGroups }));
        }
        createTouchBarGroup(items = []) {
            // Group Segments
            const segments = this.createTouchBarGroupSegments(items);
            // Group Control
            const control = new electron_1.TouchBar.TouchBarSegmentedControl({
                segments,
                mode: 'buttons',
                segmentStyle: 'automatic',
                change: (selectedIndex) => {
                    this.sendWhenReady('vscode:runAction', cancellation_1.CancellationToken.None, { id: control.segments[selectedIndex].id, from: 'touchbar' });
                }
            });
            return control;
        }
        createTouchBarGroupSegments(items = []) {
            const segments = items.map(item => {
                var _a, _b;
                let icon;
                if (item.icon && !themeService_1.ThemeIcon.isThemeIcon(item.icon) && ((_b = (_a = item.icon) === null || _a === void 0 ? void 0 : _a.dark) === null || _b === void 0 ? void 0 : _b.scheme) === network_1.Schemas.file) {
                    icon = electron_1.nativeImage.createFromPath(uri_1.URI.revive(item.icon.dark).fsPath);
                    if (icon.isEmpty()) {
                        icon = undefined;
                    }
                }
                let title;
                if (typeof item.title === 'string') {
                    title = item.title;
                }
                else {
                    title = item.title.value;
                }
                return {
                    id: item.id,
                    label: !icon ? title : undefined,
                    icon
                };
            });
            return segments;
        }
        dispose() {
            super.dispose();
            this._win = null; // Important to dereference the window object to allow for GC
        }
    };
    CodeWindow = __decorate([
        __param(1, log_1.ILogService),
        __param(2, environmentMainService_1.IEnvironmentMainService),
        __param(3, files_1.IFileService),
        __param(4, storageMainService_1.IGlobalStorageMainService),
        __param(5, storageMainService_1.IStorageMainService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, themeMainService_1.IThemeMainService),
        __param(8, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(9, backup_1.IBackupMainService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, dialogMainService_1.IDialogMainService),
        __param(12, lifecycleMainService_1.ILifecycleMainService),
        __param(13, productService_1.IProductService),
        __param(14, protocol_1.IProtocolMainService),
        __param(15, windows_1.IWindowsMainService)
    ], CodeWindow);
    exports.CodeWindow = CodeWindow;
});
//# sourceMappingURL=window.js.map