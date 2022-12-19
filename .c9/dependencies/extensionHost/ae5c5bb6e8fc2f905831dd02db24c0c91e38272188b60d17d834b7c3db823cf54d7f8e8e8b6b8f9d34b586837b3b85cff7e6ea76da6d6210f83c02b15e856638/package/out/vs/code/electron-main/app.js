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
define(["require", "exports", "electron", "vs/base/parts/ipc/electron-main/ipcMain", "fs", "os", "vs/base/common/buffer", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/functional", "vs/base/common/json", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/id", "vs/base/parts/contextmenu/electron-main/contextmenu", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/electron-main/ipc.electron", "vs/base/parts/ipc/electron-main/ipc.mp", "vs/code/electron-main/auth", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/backup/electron-main/backupMainService", "vs/platform/configuration/common/configuration", "vs/platform/credentials/common/credentials", "vs/platform/debug/electron-main/extensionHostDebugIpc", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/electron-main/diagnosticsMainService", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/encryption/common/encryptionService", "vs/platform/encryption/node/encryptionMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/shell/node/shellEnv", "vs/platform/extensionManagement/common/extensionUrlTrust", "vs/platform/extensionManagement/node/extensionUrlTrustService", "vs/platform/extensions/common/extensionHostStarter", "vs/platform/extensions/electron-main/workerMainProcessExtensionHostStarter", "vs/platform/externalTerminal/common/externalTerminal", "vs/platform/externalTerminal/node/externalTerminalService", "vs/platform/files/common/diskFileSystemProviderClient", "vs/platform/files/common/files", "vs/platform/files/electron-main/diskFileSystemProviderServer", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/issue/electron-main/issueMainService", "vs/platform/keyboardLayout/electron-main/keyboardLayoutMainService", "vs/platform/launch/electron-main/launchMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/menubar/electron-main/menubarMainService", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteHosts", "vs/platform/sharedProcess/electron-main/sharedProcess", "vs/platform/sign/common/sign", "vs/platform/state/electron-main/state", "vs/platform/storage/electron-main/storageIpc", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/update/common/update", "vs/platform/update/common/updateIpc", "vs/platform/update/electron-main/updateService.darwin", "vs/platform/update/electron-main/updateService.linux", "vs/platform/update/electron-main/updateService.snap", "vs/platform/update/electron-main/updateService.win32", "vs/platform/url/common/url", "vs/platform/url/common/urlIpc", "vs/platform/url/common/urlService", "vs/platform/url/electron-main/electronUrlListener", "vs/platform/webview/common/webviewManagerService", "vs/platform/webview/electron-main/webviewMainService", "vs/platform/windows/electron-main/windows", "vs/platform/windows/electron-main/windowsMainService", "vs/platform/windows/node/windowTracker", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/platform/credentials/electron-main/credentialsMainService"], function (require, exports, electron_1, ipcMain_1, fs_1, os_1, buffer_1, errorMessage_1, errors_1, extpath_1, functional_1, json_1, labels_1, lifecycle_1, network_1, path_1, platform_1, types_1, uri_1, uuid_1, id_1, contextmenu_1, ipc_1, ipc_electron_1, ipc_mp_1, auth_1, nls_1, backup_1, backupMainService_1, configuration_1, credentials_1, extensionHostDebugIpc_1, diagnostics_1, diagnosticsMainService_1, dialogMainService_1, encryptionService_1, encryptionMainService_1, environmentMainService_1, argvHelper_1, shellEnv_1, extensionUrlTrust_1, extensionUrlTrustService_1, extensionHostStarter_1, workerMainProcessExtensionHostStarter_1, externalTerminal_1, externalTerminalService_1, diskFileSystemProviderClient_1, files_1, diskFileSystemProviderServer_1, diskFileSystemProvider_1, descriptors_1, instantiation_1, serviceCollection_1, issueMainService_1, keyboardLayoutMainService_1, launchMainService_1, lifecycleMainService_1, log_1, logIpc_1, menubarMainService_1, nativeHostMainService_1, productService_1, remoteHosts_1, sharedProcess_1, sign_1, state_1, storageIpc_1, storageMainService_1, commonProperties_1, telemetry_1, telemetryIpc_1, telemetryService_1, telemetryUtils_1, update_1, updateIpc_1, updateService_darwin_1, updateService_linux_1, updateService_snap_1, updateService_win32_1, url_1, urlIpc_1, urlService_1, electronUrlListener_1, webviewManagerService_1, webviewMainService_1, windows_1, windowsMainService_1, windowTracker_1, workspace_1, workspaces_1, workspacesHistoryMainService_1, workspacesMainService_1, workspacesManagementMainService_1, credentialsMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeApplication = void 0;
    /**
     * The main VS Code application. There will only ever be one instance,
     * even if the user starts many instances (e.g. from the command line).
     */
    let CodeApplication = class CodeApplication extends lifecycle_1.Disposable {
        constructor(mainProcessNodeIpcServer, userEnv, mainInstantiationService, logService, environmentMainService, lifecycleMainService, configurationService, stateMainService, fileService, productService) {
            super();
            this.mainProcessNodeIpcServer = mainProcessNodeIpcServer;
            this.userEnv = userEnv;
            this.mainInstantiationService = mainInstantiationService;
            this.logService = logService;
            this.environmentMainService = environmentMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.configurationService = configurationService;
            this.stateMainService = stateMainService;
            this.fileService = fileService;
            this.productService = productService;
            this.configureSession();
            this.registerListeners();
        }
        configureSession() {
            //#region Security related measures (https://electronjs.org/docs/tutorial/security)
            //
            // !!! DO NOT CHANGE without consulting the documentation !!!
            //
            const isUrlFromWebview = (requestingUrl) => requestingUrl === null || requestingUrl === void 0 ? void 0 : requestingUrl.startsWith(`${network_1.Schemas.vscodeWebview}://`);
            const allowedPermissionsInWebview = new Set([
                'clipboard-read',
                'clipboard-sanitized-write',
            ]);
            electron_1.session.defaultSession.setPermissionRequestHandler((_webContents, permission /* 'media' | 'geolocation' | 'notifications' | 'midiSysex' | 'pointerLock' | 'fullscreen' | 'openExternal' */, callback, details) => {
                if (isUrlFromWebview(details.requestingUrl)) {
                    return callback(allowedPermissionsInWebview.has(permission));
                }
                return callback(false);
            });
            electron_1.session.defaultSession.setPermissionCheckHandler((_webContents, permission /* 'media' */, _origin, details) => {
                if (isUrlFromWebview(details.requestingUrl)) {
                    return allowedPermissionsInWebview.has(permission);
                }
                return false;
            });
            //#endregion
            //#region Request filtering
            // Block all SVG requests from unsupported origins
            const supportedSvgSchemes = new Set([network_1.Schemas.file, network_1.Schemas.vscodeFileResource, network_1.Schemas.vscodeRemoteResource, 'devtools']);
            // But allow them if the are made from inside an webview
            const isSafeFrame = (requestFrame) => {
                for (let frame = requestFrame; frame; frame = frame.parent) {
                    if (frame.url.startsWith(`${network_1.Schemas.vscodeWebview}://`)) {
                        return true;
                    }
                }
                return false;
            };
            const isSvgRequestFromSafeContext = (details) => {
                return details.resourceType === 'xhr' || isSafeFrame(details.frame);
            };
            const isAllowedVsCodeFileRequest = (details) => {
                const frame = details.frame;
                if (!frame || !this.windowsMainService) {
                    return false;
                }
                // Check to see if the request comes from one of the main windows (or shared process) and not from embedded content
                const windows = electron_1.BrowserWindow.getAllWindows();
                for (const window of windows) {
                    if (frame.processId === window.webContents.mainFrame.processId) {
                        return true;
                    }
                }
                return false;
            };
            const isAllowedWebviewRequest = (uri, details) => {
                // Only restrict top level page of webviews: index.html
                if (uri.path !== '/index.html') {
                    return true;
                }
                const frame = details.frame;
                if (!frame || !this.windowsMainService) {
                    return false;
                }
                // Check to see if the request comes from one of the main editor windows.
                for (const window of this.windowsMainService.getWindows()) {
                    if (window.win) {
                        if (frame.processId === window.win.webContents.mainFrame.processId) {
                            return true;
                        }
                    }
                }
                return false;
            };
            electron_1.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
                const uri = uri_1.URI.parse(details.url);
                if (uri.scheme === network_1.Schemas.vscodeWebview) {
                    if (!isAllowedWebviewRequest(uri, details)) {
                        this.logService.error('Blocked vscode-webview request', details.url);
                        return callback({ cancel: true });
                    }
                }
                if (uri.scheme === network_1.Schemas.vscodeFileResource) {
                    if (!isAllowedVsCodeFileRequest(details)) {
                        this.logService.error('Blocked vscode-file request', details.url);
                        return callback({ cancel: true });
                    }
                }
                // Block most svgs
                if (uri.path.endsWith('.svg')) {
                    const isSafeResourceUrl = supportedSvgSchemes.has(uri.scheme);
                    if (!isSafeResourceUrl) {
                        return callback({ cancel: !isSvgRequestFromSafeContext(details) });
                    }
                }
                return callback({ cancel: false });
            });
            // Configure SVG header content type properly
            // https://github.com/microsoft/vscode/issues/97564
            electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
                const responseHeaders = details.responseHeaders;
                const contentTypes = (responseHeaders['content-type'] || responseHeaders['Content-Type']);
                if (contentTypes && Array.isArray(contentTypes)) {
                    const uri = uri_1.URI.parse(details.url);
                    if (uri.path.endsWith('.svg')) {
                        if (supportedSvgSchemes.has(uri.scheme)) {
                            responseHeaders['Content-Type'] = ['image/svg+xml'];
                            return callback({ cancel: false, responseHeaders });
                        }
                    }
                    // remote extension schemes have the following format
                    // http://127.0.0.1:<port>/vscode-remote-resource?path=
                    if (!uri.path.includes(network_1.Schemas.vscodeRemoteResource) && contentTypes.some(contentType => contentType.toLowerCase().includes('image/svg'))) {
                        return callback({ cancel: !isSvgRequestFromSafeContext(details) });
                    }
                }
                return callback({ cancel: false });
            });
            const defaultSession = electron_1.session.defaultSession;
            if (typeof defaultSession.setCodeCachePath === 'function' && this.environmentMainService.codeCachePath) {
                // Make sure to partition Chrome's code cache folder
                // in the same way as our code cache path to help
                // invalidate caches that we know are invalid
                // (https://github.com/microsoft/vscode/issues/120655)
                defaultSession.setCodeCachePath((0, path_1.join)(this.environmentMainService.codeCachePath, 'chrome'));
            }
            //#endregion
        }
        registerListeners() {
            // We handle uncaught exceptions here to prevent electron from opening a dialog to the user
            (0, errors_1.setUnexpectedErrorHandler)(error => this.onUnexpectedError(error));
            process.on('uncaughtException', error => (0, errors_1.onUnexpectedError)(error));
            process.on('unhandledRejection', (reason) => (0, errors_1.onUnexpectedError)(reason));
            // Dispose on shutdown
            this.lifecycleMainService.onWillShutdown(() => this.dispose());
            // Contextmenu via IPC support
            (0, contextmenu_1.registerContextMenuListener)();
            // Accessibility change event
            electron_1.app.on('accessibility-support-changed', (event, accessibilitySupportEnabled) => {
                var _a;
                (_a = this.windowsMainService) === null || _a === void 0 ? void 0 : _a.sendToAll('vscode:accessibilitySupportChanged', accessibilitySupportEnabled);
            });
            // macOS dock activate
            electron_1.app.on('activate', (event, hasVisibleWindows) => {
                var _a;
                this.logService.trace('app#activate');
                // Mac only event: open new window when we get activated
                if (!hasVisibleWindows) {
                    (_a = this.windowsMainService) === null || _a === void 0 ? void 0 : _a.openEmptyWindow({ context: 1 /* OpenContext.DOCK */ });
                }
            });
            //#region Security related measures (https://electronjs.org/docs/tutorial/security)
            //
            // !!! DO NOT CHANGE without consulting the documentation !!!
            //
            electron_1.app.on('web-contents-created', (event, contents) => {
                contents.on('will-navigate', event => {
                    this.logService.error('webContents#will-navigate: Prevented webcontent navigation');
                    event.preventDefault();
                });
                contents.setWindowOpenHandler(({ url }) => {
                    var _a;
                    (_a = this.nativeHostMainService) === null || _a === void 0 ? void 0 : _a.openExternal(undefined, url);
                    return { action: 'deny' };
                });
            });
            //#endregion
            let macOpenFileURIs = [];
            let runningTimeout = undefined;
            electron_1.app.on('open-file', (event, path) => {
                this.logService.trace('app#open-file: ', path);
                event.preventDefault();
                // Keep in array because more might come!
                macOpenFileURIs.push(this.getWindowOpenableFromPathSync(path));
                // Clear previous handler if any
                if (runningTimeout !== undefined) {
                    clearTimeout(runningTimeout);
                    runningTimeout = undefined;
                }
                // Handle paths delayed in case more are coming!
                runningTimeout = setTimeout(() => {
                    var _a;
                    (_a = this.windowsMainService) === null || _a === void 0 ? void 0 : _a.open({
                        context: 1 /* OpenContext.DOCK */ /* can also be opening from finder while app is running */,
                        cli: this.environmentMainService.args,
                        urisToOpen: macOpenFileURIs,
                        gotoLineMode: false,
                        preferNewWindow: true /* dropping on the dock or opening from finder prefers to open in a new window */
                    });
                    macOpenFileURIs = [];
                    runningTimeout = undefined;
                }, 100);
            });
            electron_1.app.on('new-window-for-tab', () => {
                var _a;
                (_a = this.windowsMainService) === null || _a === void 0 ? void 0 : _a.openEmptyWindow({ context: 4 /* OpenContext.DESKTOP */ }); //macOS native tab "+" button
            });
            //#region Bootstrap IPC Handlers
            ipcMain_1.validatedIpcMain.handle('vscode:fetchShellEnv', event => {
                var _a;
                // Prefer to use the args and env from the target window
                // when resolving the shell env. It is possible that
                // a first window was opened from the UI but a second
                // from the CLI and that has implications for whether to
                // resolve the shell environment or not.
                //
                // Window can be undefined for e.g. the shared process
                // that is not part of our windows registry!
                const window = (_a = this.windowsMainService) === null || _a === void 0 ? void 0 : _a.getWindowByWebContents(event.sender); // Note: this can be `undefined` for the shared process
                let args;
                let env;
                if (window === null || window === void 0 ? void 0 : window.config) {
                    args = window.config;
                    env = Object.assign(Object.assign({}, process.env), window.config.userEnv);
                }
                else {
                    args = this.environmentMainService.args;
                    env = process.env;
                }
                // Resolve shell env
                return this.resolveShellEnvironment(args, env, false);
            });
            ipcMain_1.validatedIpcMain.handle('vscode:writeNlsFile', (event, path, data) => {
                const uri = this.validateNlsPath([path]);
                if (!uri || typeof data !== 'string') {
                    throw new Error('Invalid operation (vscode:writeNlsFile)');
                }
                return this.fileService.writeFile(uri, buffer_1.VSBuffer.fromString(data));
            });
            ipcMain_1.validatedIpcMain.handle('vscode:readNlsFile', async (event, ...paths) => {
                const uri = this.validateNlsPath(paths);
                if (!uri) {
                    throw new Error('Invalid operation (vscode:readNlsFile)');
                }
                return (await this.fileService.readFile(uri)).value.toString();
            });
            ipcMain_1.validatedIpcMain.on('vscode:toggleDevTools', event => event.sender.toggleDevTools());
            ipcMain_1.validatedIpcMain.on('vscode:openDevTools', event => event.sender.openDevTools());
            ipcMain_1.validatedIpcMain.on('vscode:reloadWindow', event => event.sender.reload());
            //#endregion
        }
        validateNlsPath(pathSegments) {
            let path = undefined;
            for (const pathSegment of pathSegments) {
                if (typeof pathSegment === 'string') {
                    if (typeof path !== 'string') {
                        path = pathSegment;
                    }
                    else {
                        path = (0, path_1.join)(path, pathSegment);
                    }
                }
            }
            if (typeof path !== 'string' || !(0, path_1.isAbsolute)(path) || !(0, extpath_1.isEqualOrParent)(path, this.environmentMainService.cachedLanguagesPath, !platform_1.isLinux)) {
                return undefined;
            }
            return uri_1.URI.file(path);
        }
        onUnexpectedError(error) {
            var _a;
            if (error) {
                // take only the message and stack property
                const friendlyError = {
                    message: `[uncaught exception in main]: ${error.message}`,
                    stack: error.stack
                };
                // handle on client side
                (_a = this.windowsMainService) === null || _a === void 0 ? void 0 : _a.sendToFocused('vscode:reportError', JSON.stringify(friendlyError));
            }
            this.logService.error(`[uncaught exception in main]: ${error}`);
            if (error.stack) {
                this.logService.error(error.stack);
            }
        }
        async startup() {
            this.logService.debug('Starting VS Code');
            this.logService.debug(`from: ${this.environmentMainService.appRoot}`);
            this.logService.debug('args:', this.environmentMainService.args);
            // Make sure we associate the program with the app user model id
            // This will help Windows to associate the running program with
            // any shortcut that is pinned to the taskbar and prevent showing
            // two icons in the taskbar for the same app.
            const win32AppUserModelId = this.productService.win32AppUserModelId;
            if (platform_1.isWindows && win32AppUserModelId) {
                electron_1.app.setAppUserModelId(win32AppUserModelId);
            }
            // Fix native tabs on macOS 10.13
            // macOS enables a compatibility patch for any bundle ID beginning with
            // "com.microsoft.", which breaks native tabs for VS Code when using this
            // identifier (from the official build).
            // Explicitly opt out of the patch here before creating any windows.
            // See: https://github.com/microsoft/vscode/issues/35361#issuecomment-399794085
            try {
                if (platform_1.isMacintosh && this.configurationService.getValue('window.nativeTabs') === true && !electron_1.systemPreferences.getUserDefault('NSUseImprovedLayoutPass', 'boolean')) {
                    electron_1.systemPreferences.setUserDefault('NSUseImprovedLayoutPass', 'boolean', true);
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            // Main process server (electron IPC based)
            const mainProcessElectronServer = new ipc_electron_1.Server();
            this.lifecycleMainService.onWillShutdown(e => {
                if (e.reason === 2 /* ShutdownReason.KILL */) {
                    // When we go down abnormally, make sure to free up
                    // any IPC we accept from other windows to reduce
                    // the chance of doing work after we go down. Kill
                    // is special in that it does not orderly shutdown
                    // windows.
                    mainProcessElectronServer.dispose();
                }
            });
            // Resolve unique machine ID
            this.logService.trace('Resolving machine identifier...');
            const machineId = await this.resolveMachineId();
            this.logService.trace(`Resolved machine identifier: ${machineId}`);
            // Shared process
            const { sharedProcess, sharedProcessReady, sharedProcessClient } = this.setupSharedProcess(machineId);
            // Services
            const appInstantiationService = await this.initServices(machineId, sharedProcess, sharedProcessReady);
            // Setup Auth Handler
            this._register(appInstantiationService.createInstance(auth_1.ProxyAuthHandler));
            // Init Channels
            appInstantiationService.invokeFunction(accessor => this.initChannels(accessor, mainProcessElectronServer, sharedProcessClient));
            // Open Windows
            const windows = appInstantiationService.invokeFunction(accessor => this.openFirstWindow(accessor, mainProcessElectronServer));
            // Post Open Windows Tasks
            appInstantiationService.invokeFunction(accessor => this.afterWindowOpen(accessor, sharedProcess));
            // Tracing: Stop tracing after windows are ready if enabled
            if (this.environmentMainService.args.trace) {
                appInstantiationService.invokeFunction(accessor => this.stopTracingEventually(accessor, windows));
            }
        }
        async resolveMachineId() {
            // We cache the machineId for faster lookups on startup
            // and resolve it only once initially if not cached or we need to replace the macOS iBridge device
            let machineId = this.stateMainService.getItem(telemetry_1.machineIdKey);
            if (!machineId || (platform_1.isMacintosh && machineId === '6c9d2bc8f91b89624add29c0abeae7fb42bf539fa1cdb2e3e57cd668fa9bcead')) {
                machineId = await (0, id_1.getMachineId)();
                this.stateMainService.setItem(telemetry_1.machineIdKey, machineId);
            }
            return machineId;
        }
        setupSharedProcess(machineId) {
            const sharedProcess = this._register(this.mainInstantiationService.createInstance(sharedProcess_1.SharedProcess, machineId, this.userEnv));
            const sharedProcessClient = (async () => {
                this.logService.trace('Main->SharedProcess#connect');
                const port = await sharedProcess.connect();
                this.logService.trace('Main->SharedProcess#connect: connection established');
                return new ipc_mp_1.Client(port, 'main');
            })();
            const sharedProcessReady = (async () => {
                await sharedProcess.whenReady();
                return sharedProcessClient;
            })();
            return { sharedProcess, sharedProcessReady, sharedProcessClient };
        }
        async initServices(machineId, sharedProcess, sharedProcessReady) {
            const services = new serviceCollection_1.ServiceCollection();
            // Update
            switch (process.platform) {
                case 'win32':
                    services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_win32_1.Win32UpdateService));
                    break;
                case 'linux':
                    if (platform_1.isLinuxSnap) {
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_snap_1.SnapUpdateService, [process.env['SNAP'], process.env['SNAP_REVISION']]));
                    }
                    else {
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_linux_1.LinuxUpdateService));
                    }
                    break;
                case 'darwin':
                    services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_darwin_1.DarwinUpdateService));
                    break;
            }
            // Windows
            services.set(windows_1.IWindowsMainService, new descriptors_1.SyncDescriptor(windowsMainService_1.WindowsMainService, [machineId, this.userEnv]));
            // Dialogs
            services.set(dialogMainService_1.IDialogMainService, new descriptors_1.SyncDescriptor(dialogMainService_1.DialogMainService));
            // Launch
            services.set(launchMainService_1.ILaunchMainService, new descriptors_1.SyncDescriptor(launchMainService_1.LaunchMainService));
            // Diagnostics
            services.set(diagnosticsMainService_1.IDiagnosticsMainService, new descriptors_1.SyncDescriptor(diagnosticsMainService_1.DiagnosticsMainService));
            services.set(diagnostics_1.IDiagnosticsService, ipc_1.ProxyChannel.toService((0, ipc_1.getDelayedChannel)(sharedProcessReady.then(client => client.getChannel('diagnostics')))));
            // Issues
            services.set(issueMainService_1.IIssueMainService, new descriptors_1.SyncDescriptor(issueMainService_1.IssueMainService, [this.userEnv]));
            // Encryption
            services.set(encryptionService_1.IEncryptionMainService, new descriptors_1.SyncDescriptor(encryptionMainService_1.EncryptionMainService, [machineId]));
            // Keyboard Layout
            services.set(keyboardLayoutMainService_1.IKeyboardLayoutMainService, new descriptors_1.SyncDescriptor(keyboardLayoutMainService_1.KeyboardLayoutMainService));
            // Native Host
            services.set(nativeHostMainService_1.INativeHostMainService, new descriptors_1.SyncDescriptor(nativeHostMainService_1.NativeHostMainService, [sharedProcess]));
            // Credentials
            services.set(credentials_1.ICredentialsMainService, new descriptors_1.SyncDescriptor(credentialsMainService_1.CredentialsNativeMainService));
            // Webview Manager
            services.set(webviewManagerService_1.IWebviewManagerService, new descriptors_1.SyncDescriptor(webviewMainService_1.WebviewMainService));
            // Workspaces
            services.set(workspaces_1.IWorkspacesService, new descriptors_1.SyncDescriptor(workspacesMainService_1.WorkspacesMainService));
            services.set(workspacesManagementMainService_1.IWorkspacesManagementMainService, new descriptors_1.SyncDescriptor(workspacesManagementMainService_1.WorkspacesManagementMainService));
            services.set(workspacesHistoryMainService_1.IWorkspacesHistoryMainService, new descriptors_1.SyncDescriptor(workspacesHistoryMainService_1.WorkspacesHistoryMainService));
            // Menubar
            services.set(menubarMainService_1.IMenubarMainService, new descriptors_1.SyncDescriptor(menubarMainService_1.MenubarMainService));
            // Extension URL Trust
            services.set(extensionUrlTrust_1.IExtensionUrlTrustService, new descriptors_1.SyncDescriptor(extensionUrlTrustService_1.ExtensionUrlTrustService));
            // Extension Host Starter
            services.set(extensionHostStarter_1.IExtensionHostStarter, new descriptors_1.SyncDescriptor(workerMainProcessExtensionHostStarter_1.WorkerMainProcessExtensionHostStarter));
            // Storage
            services.set(storageMainService_1.IStorageMainService, new descriptors_1.SyncDescriptor(storageMainService_1.StorageMainService));
            services.set(storageMainService_1.IGlobalStorageMainService, new descriptors_1.SyncDescriptor(storageMainService_1.GlobalStorageMainService));
            // External terminal
            if (platform_1.isWindows) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.WindowsExternalTerminalService));
            }
            else if (platform_1.isMacintosh) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.MacExternalTerminalService));
            }
            else if (platform_1.isLinux) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.LinuxExternalTerminalService));
            }
            // Backups
            const backupMainService = new backupMainService_1.BackupMainService(this.environmentMainService, this.configurationService, this.logService);
            services.set(backup_1.IBackupMainService, backupMainService);
            // URL handling
            services.set(url_1.IURLService, new descriptors_1.SyncDescriptor(urlService_1.NativeURLService));
            // Telemetry
            if ((0, telemetryUtils_1.supportsTelemetry)(this.productService, this.environmentMainService)) {
                const channel = (0, ipc_1.getDelayedChannel)(sharedProcessReady.then(client => client.getChannel('telemetryAppender')));
                const appender = new telemetryIpc_1.TelemetryAppenderClient(channel);
                const commonProperties = (0, commonProperties_1.resolveCommonProperties)(this.fileService, (0, os_1.release)(), (0, os_1.hostname)(), process.arch, this.productService.commit, this.productService.version, machineId, this.productService.msftInternalDomains, this.environmentMainService.installSourcePath);
                const piiPaths = (0, telemetryUtils_1.getPiiPathsFromEnvironment)(this.environmentMainService);
                const config = { appenders: [appender], commonProperties, piiPaths, sendErrorTelemetry: true };
                services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [config]));
            }
            else {
                services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            }
            // Init services that require it
            await backupMainService.initialize();
            return this.mainInstantiationService.createChild(services);
        }
        initChannels(accessor, mainProcessElectronServer, sharedProcessClient) {
            // Channels registered to node.js are exposed to second instances
            // launching because that is the only way the second instance
            // can talk to the first instance. Electron IPC does not work
            // across apps until `requestSingleInstance` APIs are adopted.
            const launchChannel = ipc_1.ProxyChannel.fromService(accessor.get(launchMainService_1.ILaunchMainService), { disableMarshalling: true });
            this.mainProcessNodeIpcServer.registerChannel('launch', launchChannel);
            const diagnosticsChannel = ipc_1.ProxyChannel.fromService(accessor.get(diagnosticsMainService_1.IDiagnosticsMainService), { disableMarshalling: true });
            this.mainProcessNodeIpcServer.registerChannel('diagnostics', diagnosticsChannel);
            // Local Files
            const diskFileSystemProvider = this.fileService.getProvider(network_1.Schemas.file);
            (0, types_1.assertType)(diskFileSystemProvider instanceof diskFileSystemProvider_1.DiskFileSystemProvider);
            const fileSystemProviderChannel = new diskFileSystemProviderServer_1.DiskFileSystemProviderChannel(diskFileSystemProvider, this.logService, this.environmentMainService);
            mainProcessElectronServer.registerChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME, fileSystemProviderChannel);
            sharedProcessClient.then(client => client.registerChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME, fileSystemProviderChannel));
            // Update
            const updateChannel = new updateIpc_1.UpdateChannel(accessor.get(update_1.IUpdateService));
            mainProcessElectronServer.registerChannel('update', updateChannel);
            // Issues
            const issueChannel = ipc_1.ProxyChannel.fromService(accessor.get(issueMainService_1.IIssueMainService));
            mainProcessElectronServer.registerChannel('issue', issueChannel);
            // Encryption
            const encryptionChannel = ipc_1.ProxyChannel.fromService(accessor.get(encryptionService_1.IEncryptionMainService));
            mainProcessElectronServer.registerChannel('encryption', encryptionChannel);
            // Credentials
            const credentialsChannel = ipc_1.ProxyChannel.fromService(accessor.get(credentials_1.ICredentialsMainService));
            mainProcessElectronServer.registerChannel('credentials', credentialsChannel);
            // Signing
            const signChannel = ipc_1.ProxyChannel.fromService(accessor.get(sign_1.ISignService));
            mainProcessElectronServer.registerChannel('sign', signChannel);
            // Keyboard Layout
            const keyboardLayoutChannel = ipc_1.ProxyChannel.fromService(accessor.get(keyboardLayoutMainService_1.IKeyboardLayoutMainService));
            mainProcessElectronServer.registerChannel('keyboardLayout', keyboardLayoutChannel);
            // Native host (main & shared process)
            this.nativeHostMainService = accessor.get(nativeHostMainService_1.INativeHostMainService);
            const nativeHostChannel = ipc_1.ProxyChannel.fromService(this.nativeHostMainService);
            mainProcessElectronServer.registerChannel('nativeHost', nativeHostChannel);
            sharedProcessClient.then(client => client.registerChannel('nativeHost', nativeHostChannel));
            // Workspaces
            const workspacesChannel = ipc_1.ProxyChannel.fromService(accessor.get(workspaces_1.IWorkspacesService));
            mainProcessElectronServer.registerChannel('workspaces', workspacesChannel);
            // Menubar
            const menubarChannel = ipc_1.ProxyChannel.fromService(accessor.get(menubarMainService_1.IMenubarMainService));
            mainProcessElectronServer.registerChannel('menubar', menubarChannel);
            // URL handling
            const urlChannel = ipc_1.ProxyChannel.fromService(accessor.get(url_1.IURLService));
            mainProcessElectronServer.registerChannel('url', urlChannel);
            // Extension URL Trust
            const extensionUrlTrustChannel = ipc_1.ProxyChannel.fromService(accessor.get(extensionUrlTrust_1.IExtensionUrlTrustService));
            mainProcessElectronServer.registerChannel('extensionUrlTrust', extensionUrlTrustChannel);
            // Webview Manager
            const webviewChannel = ipc_1.ProxyChannel.fromService(accessor.get(webviewManagerService_1.IWebviewManagerService));
            mainProcessElectronServer.registerChannel('webview', webviewChannel);
            // Storage (main & shared process)
            const storageChannel = this._register(new storageIpc_1.StorageDatabaseChannel(this.logService, accessor.get(storageMainService_1.IStorageMainService)));
            mainProcessElectronServer.registerChannel('storage', storageChannel);
            sharedProcessClient.then(client => client.registerChannel('storage', storageChannel));
            // External Terminal
            const externalTerminalChannel = ipc_1.ProxyChannel.fromService(accessor.get(externalTerminal_1.IExternalTerminalMainService));
            mainProcessElectronServer.registerChannel('externalTerminal', externalTerminalChannel);
            // Log Level (main & shared process)
            const logLevelChannel = new logIpc_1.LogLevelChannel(accessor.get(log_1.ILogService));
            mainProcessElectronServer.registerChannel('logLevel', logLevelChannel);
            sharedProcessClient.then(client => client.registerChannel('logLevel', logLevelChannel));
            // Logger
            const loggerChannel = new logIpc_1.LoggerChannel(accessor.get(log_1.ILoggerService));
            mainProcessElectronServer.registerChannel('logger', loggerChannel);
            sharedProcessClient.then(client => client.registerChannel('logger', loggerChannel));
            // Extension Host Debug Broadcasting
            const electronExtensionHostDebugBroadcastChannel = new extensionHostDebugIpc_1.ElectronExtensionHostDebugBroadcastChannel(accessor.get(windows_1.IWindowsMainService));
            mainProcessElectronServer.registerChannel('extensionhostdebugservice', electronExtensionHostDebugBroadcastChannel);
            // Extension Host Starter
            const extensionHostStarterChannel = ipc_1.ProxyChannel.fromService(accessor.get(extensionHostStarter_1.IExtensionHostStarter));
            mainProcessElectronServer.registerChannel(extensionHostStarter_1.ipcExtensionHostStarterChannelName, extensionHostStarterChannel);
        }
        openFirstWindow(accessor, mainProcessElectronServer) {
            const windowsMainService = this.windowsMainService = accessor.get(windows_1.IWindowsMainService);
            const urlService = accessor.get(url_1.IURLService);
            const nativeHostMainService = accessor.get(nativeHostMainService_1.INativeHostMainService);
            // Signal phase: ready (services set)
            this.lifecycleMainService.phase = 2 /* LifecycleMainPhase.Ready */;
            // Check for initial URLs to handle from protocol link invocations
            const pendingWindowOpenablesFromProtocolLinks = [];
            const pendingProtocolLinksToHandle = [
                // Windows/Linux: protocol handler invokes CLI with --open-url
                ...this.environmentMainService.args['open-url'] ? this.environmentMainService.args._urls || [] : [],
                // macOS: open-url events
                ...(global.getOpenUrls() || [])
            ].map(url => {
                try {
                    return { uri: uri_1.URI.parse(url), url };
                }
                catch (_a) {
                    return undefined;
                }
            }).filter((obj) => {
                if (!obj) {
                    return false;
                }
                // If URI should be blocked, filter it out
                if (this.shouldBlockURI(obj.uri)) {
                    return false;
                }
                // Filter out any protocol link that wants to open as window so that
                // we open the right set of windows on startup and not restore the
                // previous workspace too.
                const windowOpenable = this.getWindowOpenableFromProtocolLink(obj.uri);
                if (windowOpenable) {
                    pendingWindowOpenablesFromProtocolLinks.push(windowOpenable);
                    return false;
                }
                return true;
            });
            // Create a URL handler to open file URIs in the active window
            // or open new windows. The URL handler will be invoked from
            // protocol invocations outside of VSCode.
            const app = this;
            const environmentService = this.environmentMainService;
            const productService = this.productService;
            const logService = this.logService;
            urlService.registerHandler({
                async handleURL(uri, options) {
                    logService.trace('app#handleURL: ', uri.toString(true), options);
                    if (uri.scheme === productService.urlProtocol && uri.path === 'workspace') {
                        uri = uri.with({
                            authority: 'file',
                            path: uri_1.URI.parse(uri.query).path,
                            query: ''
                        });
                    }
                    // If URI should be blocked, behave as if it's handled
                    if (app.shouldBlockURI(uri)) {
                        return true;
                    }
                    let shouldOpenInNewWindow = false;
                    // We should handle the URI in a new window if the URL contains `windowId=_blank`
                    const params = new URLSearchParams(uri.query);
                    if (params.get('windowId') === '_blank') {
                        params.delete('windowId');
                        uri = uri.with({ query: params.toString() });
                        shouldOpenInNewWindow = true;
                    }
                    // or if no window is open (macOS only)
                    shouldOpenInNewWindow || (shouldOpenInNewWindow = platform_1.isMacintosh && windowsMainService.getWindowCount() === 0);
                    // Check for URIs to open in window
                    const windowOpenableFromProtocolLink = app.getWindowOpenableFromProtocolLink(uri);
                    logService.trace('app#handleURL: windowOpenableFromProtocolLink = ', windowOpenableFromProtocolLink);
                    if (windowOpenableFromProtocolLink) {
                        const [window] = windowsMainService.open({
                            context: 5 /* OpenContext.API */,
                            cli: Object.assign({}, environmentService.args),
                            urisToOpen: [windowOpenableFromProtocolLink],
                            forceNewWindow: shouldOpenInNewWindow,
                            gotoLineMode: true
                            // remoteAuthority: will be determined based on windowOpenableFromProtocolLink
                        });
                        window.focus(); // this should help ensuring that the right window gets focus when multiple are opened
                        return true;
                    }
                    if (shouldOpenInNewWindow) {
                        const [window] = windowsMainService.open({
                            context: 5 /* OpenContext.API */,
                            cli: Object.assign({}, environmentService.args),
                            forceNewWindow: true,
                            forceEmpty: true,
                            gotoLineMode: true,
                            remoteAuthority: (0, remoteHosts_1.getRemoteAuthority)(uri)
                        });
                        await window.ready();
                        return urlService.open(uri, options);
                    }
                    return false;
                }
            });
            // Create a URL handler which forwards to the last active window
            const activeWindowManager = this._register(new windowTracker_1.ActiveWindowManager({
                onDidOpenWindow: nativeHostMainService.onDidOpenWindow,
                onDidFocusWindow: nativeHostMainService.onDidFocusWindow,
                getActiveWindowId: () => nativeHostMainService.getActiveWindowId(-1)
            }));
            const activeWindowRouter = new ipc_1.StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
            const urlHandlerRouter = new urlIpc_1.URLHandlerRouter(activeWindowRouter);
            const urlHandlerChannel = mainProcessElectronServer.getChannel('urlHandler', urlHandlerRouter);
            urlService.registerHandler(new urlIpc_1.URLHandlerChannelClient(urlHandlerChannel));
            // Watch Electron URLs and forward them to the UrlService
            this._register(new electronUrlListener_1.ElectronURLListener(pendingProtocolLinksToHandle, urlService, windowsMainService, this.environmentMainService, this.productService));
            // Open our first window
            const args = this.environmentMainService.args;
            const macOpenFiles = global.macOpenFiles;
            const context = (0, argvHelper_1.isLaunchedFromCli)(process.env) ? 0 /* OpenContext.CLI */ : 4 /* OpenContext.DESKTOP */;
            const hasCliArgs = args._.length;
            const hasFolderURIs = !!args['folder-uri'];
            const hasFileURIs = !!args['file-uri'];
            const noRecentEntry = args['skip-add-to-recently-opened'] === true;
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            const remoteAuthority = args.remote || undefined;
            // check for a pending window to open from URI
            // e.g. when running code with --open-uri from
            // a protocol handler
            if (pendingWindowOpenablesFromProtocolLinks.length > 0) {
                return windowsMainService.open({
                    context,
                    cli: args,
                    urisToOpen: pendingWindowOpenablesFromProtocolLinks,
                    gotoLineMode: true,
                    initialStartup: true
                    // remoteAuthority: will be determined based on pendingWindowOpenablesFromProtocolLinks
                });
            }
            // new window if "-n"
            if (args['new-window'] && !hasCliArgs && !hasFolderURIs && !hasFileURIs) {
                return windowsMainService.open({
                    context,
                    cli: args,
                    forceNewWindow: true,
                    forceEmpty: true,
                    noRecentEntry,
                    waitMarkerFileURI,
                    initialStartup: true,
                    remoteAuthority
                });
            }
            // mac: open-file event received on startup
            if (macOpenFiles.length && !hasCliArgs && !hasFolderURIs && !hasFileURIs) {
                return windowsMainService.open({
                    context: 1 /* OpenContext.DOCK */,
                    cli: args,
                    urisToOpen: macOpenFiles.map(file => this.getWindowOpenableFromPathSync(file)),
                    noRecentEntry,
                    waitMarkerFileURI,
                    initialStartup: true,
                    // remoteAuthority: will be determined based on macOpenFiles
                });
            }
            // default: read paths from cli
            return windowsMainService.open({
                context,
                cli: args,
                forceNewWindow: args['new-window'] || (!hasCliArgs && args['unity-launch']),
                diffMode: args.diff,
                noRecentEntry,
                waitMarkerFileURI,
                gotoLineMode: args.goto,
                initialStartup: true,
                remoteAuthority
            });
        }
        shouldBlockURI(uri) {
            if (uri.authority === network_1.Schemas.file && platform_1.isWindows) {
                const res = electron_1.dialog.showMessageBoxSync({
                    title: this.productService.nameLong,
                    type: 'question',
                    buttons: [
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Yes")),
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&No")),
                    ],
                    defaultId: 0,
                    cancelId: 1,
                    message: (0, nls_1.localize)('confirmOpenMessage', "An external application wants to open '{0}' in {1}. Do you want to open this file or folder?", (0, labels_1.getPathLabel)(uri, { os: platform_1.OS, tildify: this.environmentMainService }), this.productService.nameShort),
                    detail: (0, nls_1.localize)('confirmOpenDetail', "If you did not initiate this request, it may represent an attempted attack on your system. Unless you took an explicit action to initiate this request, you should press 'No'"),
                    noLink: true
                });
                if (res === 1) {
                    return true;
                }
            }
            return false;
        }
        getWindowOpenableFromProtocolLink(uri) {
            if (!uri.path) {
                return undefined;
            }
            // File path
            if (uri.authority === network_1.Schemas.file) {
                const fileUri = uri_1.URI.file(uri.fsPath);
                if ((0, workspace_1.hasWorkspaceFileExtension)(fileUri)) {
                    return { workspaceUri: fileUri };
                }
                return { fileUri };
            }
            // Remote path
            else if (uri.authority === network_1.Schemas.vscodeRemote) {
                // Example conversion:
                // From: vscode://vscode-remote/wsl+ubuntu/mnt/c/GitDevelopment/monaco
                //   To: vscode-remote://wsl+ubuntu/mnt/c/GitDevelopment/monaco
                const secondSlash = uri.path.indexOf(path_1.posix.sep, 1 /* skip over the leading slash */);
                if (secondSlash !== -1) {
                    const authority = uri.path.substring(1, secondSlash);
                    const path = uri.path.substring(secondSlash);
                    const remoteUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, authority, path, query: uri.query, fragment: uri.fragment });
                    if ((0, workspace_1.hasWorkspaceFileExtension)(path)) {
                        return { workspaceUri: remoteUri };
                    }
                    if (/:[\d]+$/.test(path)) {
                        // path with :line:column syntax
                        return { fileUri: remoteUri };
                    }
                    return { folderUri: remoteUri };
                }
            }
            return undefined;
        }
        getWindowOpenableFromPathSync(path) {
            try {
                const fileStat = (0, fs_1.statSync)(path);
                if (fileStat.isDirectory()) {
                    return { folderUri: uri_1.URI.file(path) };
                }
                if ((0, workspace_1.hasWorkspaceFileExtension)(path)) {
                    return { workspaceUri: uri_1.URI.file(path) };
                }
            }
            catch (error) {
                // ignore errors
            }
            return { fileUri: uri_1.URI.file(path) };
        }
        async afterWindowOpen(accessor, sharedProcess) {
            // Signal phase: after window open
            this.lifecycleMainService.phase = 3 /* LifecycleMainPhase.AfterWindowOpen */;
            // Observe shared process for errors
            let willShutdown = false;
            (0, functional_1.once)(this.lifecycleMainService.onWillShutdown)(() => willShutdown = true);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            this._register(sharedProcess.onDidError(({ type, details }) => {
                var _a, _b, _c, _d;
                // Logging
                let message;
                switch (type) {
                    case 1 /* WindowError.UNRESPONSIVE */:
                        message = 'SharedProcess: detected unresponsive window';
                        break;
                    case 2 /* WindowError.CRASHED */:
                        message = `SharedProcess: crashed (detail: ${(_a = details === null || details === void 0 ? void 0 : details.reason) !== null && _a !== void 0 ? _a : '<unknown>'}, code: ${(_b = details === null || details === void 0 ? void 0 : details.exitCode) !== null && _b !== void 0 ? _b : '<unknown>'})`;
                        break;
                    case 3 /* WindowError.LOAD */:
                        message = `SharedProcess: failed to load (detail: ${(_c = details === null || details === void 0 ? void 0 : details.reason) !== null && _c !== void 0 ? _c : '<unknown>'}, code: ${(_d = details === null || details === void 0 ? void 0 : details.exitCode) !== null && _d !== void 0 ? _d : '<unknown>'})`;
                        break;
                }
                (0, errors_1.onUnexpectedError)(new Error(message));
                telemetryService.publicLog2('sharedprocesserror', {
                    type,
                    reason: details === null || details === void 0 ? void 0 : details.reason,
                    code: details === null || details === void 0 ? void 0 : details.exitCode,
                    visible: sharedProcess.isVisible(),
                    shuttingdown: willShutdown
                });
            }));
            // Windows: install mutex
            const win32MutexName = this.productService.win32MutexName;
            if (platform_1.isWindows && win32MutexName) {
                try {
                    const WindowsMutex = require.__$__nodeRequire('windows-mutex').Mutex;
                    const mutex = new WindowsMutex(win32MutexName);
                    (0, functional_1.once)(this.lifecycleMainService.onWillShutdown)(() => mutex.release());
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            // Remote Authorities
            electron_1.protocol.registerHttpProtocol(network_1.Schemas.vscodeRemoteResource, (request, callback) => {
                callback({
                    url: request.url.replace(/^vscode-remote-resource:/, 'http:'),
                    method: request.method
                });
            });
            // Initialize update service
            const updateService = accessor.get(update_1.IUpdateService);
            if (updateService instanceof updateService_win32_1.Win32UpdateService || updateService instanceof updateService_linux_1.LinuxUpdateService || updateService instanceof updateService_darwin_1.DarwinUpdateService) {
                await updateService.initialize();
            }
            // Start to fetch shell environment (if needed) after window has opened
            // Since this operation can take a long time, we want to warm it up while
            // the window is opening.
            // We also show an error to the user in case this fails.
            this.resolveShellEnvironment(this.environmentMainService.args, process.env, true);
            // If enable-crash-reporter argv is undefined then this is a fresh start,
            // based on telemetry.enableCrashreporter settings, generate a UUID which
            // will be used as crash reporter id and also update the json file.
            try {
                const argvContent = await this.fileService.readFile(this.environmentMainService.argvResource);
                const argvString = argvContent.value.toString();
                const argvJSON = JSON.parse((0, json_1.stripComments)(argvString));
                if (argvJSON['enable-crash-reporter'] === undefined) {
                    const telemetryLevel = (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService);
                    const enableCrashReporter = telemetryLevel >= 1 /* TelemetryLevel.CRASH */;
                    const additionalArgvContent = [
                        '',
                        '	// Allows to disable crash reporting.',
                        '	// Should restart the app if the value is changed.',
                        `	"enable-crash-reporter": ${enableCrashReporter},`,
                        '',
                        '	// Unique id used for correlating crash reports sent from this instance.',
                        '	// Do not edit this value.',
                        `	"crash-reporter-id": "${(0, uuid_1.generateUuid)()}"`,
                        '}'
                    ];
                    const newArgvString = argvString.substring(0, argvString.length - 2).concat(',\n', additionalArgvContent.join('\n'));
                    await this.fileService.writeFile(this.environmentMainService.argvResource, buffer_1.VSBuffer.fromString(newArgvString));
                }
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        async resolveShellEnvironment(args, env, notifyOnError) {
            var _a;
            try {
                return await (0, shellEnv_1.getResolvedShellEnv)(this.logService, args, env);
            }
            catch (error) {
                const errorMessage = (0, errorMessage_1.toErrorMessage)(error);
                if (notifyOnError) {
                    (_a = this.windowsMainService) === null || _a === void 0 ? void 0 : _a.sendToFocused('vscode:showResolveShellEnvError', errorMessage);
                }
                else {
                    this.logService.error(errorMessage);
                }
            }
            return {};
        }
        stopTracingEventually(accessor, windows) {
            this.logService.info('Tracing: waiting for windows to get ready...');
            const dialogMainService = accessor.get(dialogMainService_1.IDialogMainService);
            let recordingStopped = false;
            const stopRecording = async (timeout) => {
                if (recordingStopped) {
                    return;
                }
                recordingStopped = true; // only once
                const path = await electron_1.contentTracing.stopRecording(`${(0, extpath_1.randomPath)(this.environmentMainService.userHome.fsPath, this.productService.applicationName)}.trace.txt`);
                if (!timeout) {
                    dialogMainService.showMessageBox({
                        title: this.productService.nameLong,
                        type: 'info',
                        message: (0, nls_1.localize)('trace.message', "Successfully created trace."),
                        detail: (0, nls_1.localize)('trace.detail', "Please create an issue and manually attach the following file:\n{0}", path),
                        buttons: [(0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'trace.ok', comment: ['&& denotes a mnemonic'] }, "&&OK"))],
                        defaultId: 0,
                        noLink: true
                    }, (0, types_1.withNullAsUndefined)(electron_1.BrowserWindow.getFocusedWindow()));
                }
                else {
                    this.logService.info(`Tracing: data recorded (after 30s timeout) to ${path}`);
                }
            };
            // Wait up to 30s before creating the trace anyways
            const timeoutHandle = setTimeout(() => stopRecording(true), 30000);
            // Wait for all windows to get ready and stop tracing then
            Promise.all(windows.map(window => window.ready())).then(() => {
                clearTimeout(timeoutHandle);
                stopRecording(false);
            });
        }
    };
    CodeApplication = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, log_1.ILogService),
        __param(4, environmentMainService_1.IEnvironmentMainService),
        __param(5, lifecycleMainService_1.ILifecycleMainService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, state_1.IStateMainService),
        __param(8, files_1.IFileService),
        __param(9, productService_1.IProductService)
    ], CodeApplication);
    exports.CodeApplication = CodeApplication;
});
//# sourceMappingURL=app.js.map