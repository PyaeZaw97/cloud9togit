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
define(["require", "exports", "electron", "vs/base/parts/ipc/electron-main/ipcMain", "os", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/node/ps", "vs/nls", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/electron-main/diagnosticsMainService", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/instantiation/common/instantiation", "vs/platform/launch/electron-main/launchMainService", "vs/platform/log/common/log", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/window/common/window"], function (require, exports, electron_1, ipcMain_1, os_1, labels_1, lifecycle_1, network_1, platform_1, ps_1, nls_1, diagnostics_1, diagnosticsMainService_1, dialogMainService_1, environmentMainService_1, instantiation_1, launchMainService_1, log_1, nativeHostMainService_1, product_1, productService_1, protocol_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IssueMainService = exports.IIssueMainService = void 0;
    exports.IIssueMainService = (0, instantiation_1.createDecorator)('issueMainService');
    let IssueMainService = class IssueMainService {
        constructor(userEnv, environmentMainService, launchMainService, logService, diagnosticsService, diagnosticsMainService, dialogMainService, nativeHostMainService, protocolMainService, productService) {
            this.userEnv = userEnv;
            this.environmentMainService = environmentMainService;
            this.launchMainService = launchMainService;
            this.logService = logService;
            this.diagnosticsService = diagnosticsService;
            this.diagnosticsMainService = diagnosticsMainService;
            this.dialogMainService = dialogMainService;
            this.nativeHostMainService = nativeHostMainService;
            this.protocolMainService = protocolMainService;
            this.productService = productService;
            this.issueReporterWindow = null;
            this.issueReporterParentWindow = null;
            this.processExplorerWindow = null;
            this.processExplorerParentWindow = null;
            this.registerListeners();
        }
        registerListeners() {
            ipcMain_1.validatedIpcMain.on('vscode:issueSystemInfoRequest', async (event) => {
                const [info, remoteData] = await Promise.all([this.launchMainService.getMainProcessInfo(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: false, includeWorkspaceMetadata: false })]);
                const msg = await this.diagnosticsService.getSystemInfo(info, remoteData);
                this.safeSend(event, 'vscode:issueSystemInfoResponse', msg);
            });
            ipcMain_1.validatedIpcMain.on('vscode:listProcesses', async (event) => {
                const processes = [];
                try {
                    const mainPid = await this.launchMainService.getMainProcessId();
                    processes.push({ name: (0, nls_1.localize)('local', "Local"), rootProcess: await (0, ps_1.listProcesses)(mainPid) });
                    const remoteDiagnostics = await this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true });
                    remoteDiagnostics.forEach(data => {
                        if ((0, diagnostics_1.isRemoteDiagnosticError)(data)) {
                            processes.push({
                                name: data.hostName,
                                rootProcess: data
                            });
                        }
                        else {
                            if (data.processes) {
                                processes.push({
                                    name: data.hostName,
                                    rootProcess: data.processes
                                });
                            }
                        }
                    });
                }
                catch (e) {
                    this.logService.error(`Listing processes failed: ${e}`);
                }
                this.safeSend(event, 'vscode:listProcessesResponse', processes);
            });
            ipcMain_1.validatedIpcMain.on('vscode:issueReporterClipboard', async (event) => {
                const messageOptions = {
                    title: this.productService.nameLong,
                    message: (0, nls_1.localize)('issueReporterWriteToClipboard', "There is too much data to send to GitHub directly. The data will be copied to the clipboard, please paste it into the GitHub issue page that is opened."),
                    type: 'warning',
                    buttons: [
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK")),
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel")),
                    ],
                    defaultId: 0,
                    cancelId: 1,
                    noLink: true
                };
                if (this.issueReporterWindow) {
                    const result = await this.dialogMainService.showMessageBox(messageOptions, this.issueReporterWindow);
                    this.safeSend(event, 'vscode:issueReporterClipboardResponse', result.response === 0);
                }
            });
            ipcMain_1.validatedIpcMain.on('vscode:issuePerformanceInfoRequest', async (event) => {
                const performanceInfo = await this.getPerformanceInfo();
                this.safeSend(event, 'vscode:issuePerformanceInfoResponse', performanceInfo);
            });
            ipcMain_1.validatedIpcMain.on('vscode:issueReporterConfirmClose', async () => {
                const messageOptions = {
                    title: this.productService.nameLong,
                    message: (0, nls_1.localize)('confirmCloseIssueReporter', "Your input will not be saved. Are you sure you want to close this window?"),
                    type: 'warning',
                    buttons: [
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'yes', comment: ['&& denotes a mnemonic'] }, "&&Yes")),
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel")),
                    ],
                    defaultId: 0,
                    cancelId: 1,
                    noLink: true
                };
                if (this.issueReporterWindow) {
                    const result = await this.dialogMainService.showMessageBox(messageOptions, this.issueReporterWindow);
                    if (result.response === 0) {
                        if (this.issueReporterWindow) {
                            this.issueReporterWindow.destroy();
                            this.issueReporterWindow = null;
                        }
                    }
                }
            });
            ipcMain_1.validatedIpcMain.on('vscode:workbenchCommand', (_, commandInfo) => {
                const { id, from, args } = commandInfo;
                let parentWindow;
                switch (from) {
                    case 'issueReporter':
                        parentWindow = this.issueReporterParentWindow;
                        break;
                    case 'processExplorer':
                        parentWindow = this.processExplorerParentWindow;
                        break;
                    default:
                        throw new Error(`Unexpected command source: ${from}`);
                }
                if (parentWindow) {
                    parentWindow.webContents.send('vscode:runAction', { id, from, args });
                }
            });
            ipcMain_1.validatedIpcMain.on('vscode:openExternal', (_, arg) => {
                this.nativeHostMainService.openExternal(undefined, arg);
            });
            ipcMain_1.validatedIpcMain.on('vscode:closeIssueReporter', event => {
                if (this.issueReporterWindow) {
                    this.issueReporterWindow.close();
                }
            });
            ipcMain_1.validatedIpcMain.on('vscode:closeProcessExplorer', event => {
                if (this.processExplorerWindow) {
                    this.processExplorerWindow.close();
                }
            });
            ipcMain_1.validatedIpcMain.on('vscode:windowsInfoRequest', async (event) => {
                const mainProcessInfo = await this.launchMainService.getMainProcessInfo();
                this.safeSend(event, 'vscode:windowsInfoResponse', mainProcessInfo.windows);
            });
        }
        safeSend(event, channel, ...args) {
            if (!event.sender.isDestroyed()) {
                event.sender.send(channel, ...args);
            }
        }
        async openReporter(data) {
            if (!this.issueReporterWindow) {
                this.issueReporterParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                if (this.issueReporterParentWindow) {
                    const issueReporterDisposables = new lifecycle_1.DisposableStore();
                    const issueReporterWindowConfigUrl = issueReporterDisposables.add(this.protocolMainService.createIPCObjectUrl());
                    const position = this.getWindowPosition(this.issueReporterParentWindow, 700, 800);
                    this.issueReporterWindow = this.createBrowserWindow(position, issueReporterWindowConfigUrl, {
                        backgroundColor: data.styles.backgroundColor,
                        title: (0, nls_1.localize)('issueReporter', "Issue Reporter"),
                        zoomLevel: data.zoomLevel,
                        alwaysOnTop: false
                    }, 'issue-reporter');
                    // Store into config object URL
                    issueReporterWindowConfigUrl.update({
                        appRoot: this.environmentMainService.appRoot,
                        windowId: this.issueReporterWindow.id,
                        userEnv: this.userEnv,
                        data,
                        disableExtensions: !!this.environmentMainService.disableExtensions,
                        os: {
                            type: (0, os_1.type)(),
                            arch: (0, os_1.arch)(),
                            release: (0, os_1.release)(),
                        },
                        product: product_1.default
                    });
                    this.issueReporterWindow.loadURL(network_1.FileAccess.asBrowserUri('vs/code/electron-sandbox/issue/issueReporter.html', require).toString(true));
                    this.issueReporterWindow.on('close', () => {
                        this.issueReporterWindow = null;
                        issueReporterDisposables.dispose();
                    });
                    this.issueReporterParentWindow.on('closed', () => {
                        if (this.issueReporterWindow) {
                            this.issueReporterWindow.close();
                            this.issueReporterWindow = null;
                            issueReporterDisposables.dispose();
                        }
                    });
                }
            }
            if (this.issueReporterWindow) {
                this.focusWindow(this.issueReporterWindow);
            }
        }
        async openProcessExplorer(data) {
            if (!this.processExplorerWindow) {
                this.processExplorerParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                if (this.processExplorerParentWindow) {
                    const processExplorerDisposables = new lifecycle_1.DisposableStore();
                    const processExplorerWindowConfigUrl = processExplorerDisposables.add(this.protocolMainService.createIPCObjectUrl());
                    const position = this.getWindowPosition(this.processExplorerParentWindow, 800, 500);
                    this.processExplorerWindow = this.createBrowserWindow(position, processExplorerWindowConfigUrl, {
                        backgroundColor: data.styles.backgroundColor,
                        title: (0, nls_1.localize)('processExplorer', "Process Explorer"),
                        zoomLevel: data.zoomLevel,
                        alwaysOnTop: true
                    }, 'process-explorer');
                    // Store into config object URL
                    processExplorerWindowConfigUrl.update({
                        appRoot: this.environmentMainService.appRoot,
                        windowId: this.processExplorerWindow.id,
                        userEnv: this.userEnv,
                        data,
                        product: product_1.default
                    });
                    this.processExplorerWindow.loadURL(network_1.FileAccess.asBrowserUri('vs/code/electron-sandbox/processExplorer/processExplorer.html', require).toString(true));
                    this.processExplorerWindow.on('close', () => {
                        this.processExplorerWindow = null;
                        processExplorerDisposables.dispose();
                    });
                    this.processExplorerParentWindow.on('close', () => {
                        if (this.processExplorerWindow) {
                            this.processExplorerWindow.close();
                            this.processExplorerWindow = null;
                            processExplorerDisposables.dispose();
                        }
                    });
                }
            }
            if (this.processExplorerWindow) {
                this.focusWindow(this.processExplorerWindow);
            }
        }
        focusWindow(window) {
            if (window.isMinimized()) {
                window.restore();
            }
            window.focus();
        }
        createBrowserWindow(position, ipcObjectUrl, options, windowKind) {
            const window = new electron_1.BrowserWindow({
                fullscreen: false,
                skipTaskbar: true,
                resizable: true,
                width: position.width,
                height: position.height,
                minWidth: 300,
                minHeight: 200,
                x: position.x,
                y: position.y,
                title: options.title,
                backgroundColor: options.backgroundColor || IssueMainService.DEFAULT_BACKGROUND_COLOR,
                webPreferences: {
                    preload: network_1.FileAccess.asFileUri('vs/base/parts/sandbox/electron-browser/preload.js', require).fsPath,
                    additionalArguments: [`--vscode-window-config=${ipcObjectUrl.resource.toString()}`, `--vscode-window-kind=${windowKind}`],
                    v8CacheOptions: this.environmentMainService.useCodeCache ? 'bypassHeatCheck' : 'none',
                    enableWebSQL: false,
                    spellcheck: false,
                    nativeWindowOpen: true,
                    zoomFactor: (0, window_1.zoomLevelToZoomFactor)(options.zoomLevel),
                    sandbox: true,
                    contextIsolation: true
                },
                alwaysOnTop: options.alwaysOnTop,
                experimentalDarkMode: true
            });
            window.setMenuBarVisibility(false);
            return window;
        }
        async getSystemStatus() {
            const [info, remoteData] = await Promise.all([this.launchMainService.getMainProcessInfo(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: false, includeWorkspaceMetadata: false })]);
            return this.diagnosticsService.getDiagnostics(info, remoteData);
        }
        getWindowPosition(parentWindow, defaultWidth, defaultHeight) {
            // We want the new window to open on the same display that the parent is in
            let displayToUse;
            const displays = electron_1.screen.getAllDisplays();
            // Single Display
            if (displays.length === 1) {
                displayToUse = displays[0];
            }
            // Multi Display
            else {
                // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
                if (platform_1.isMacintosh) {
                    const cursorPoint = electron_1.screen.getCursorScreenPoint();
                    displayToUse = electron_1.screen.getDisplayNearestPoint(cursorPoint);
                }
                // if we have a last active window, use that display for the new window
                if (!displayToUse && parentWindow) {
                    displayToUse = electron_1.screen.getDisplayMatching(parentWindow.getBounds());
                }
                // fallback to primary display or first display
                if (!displayToUse) {
                    displayToUse = electron_1.screen.getPrimaryDisplay() || displays[0];
                }
            }
            const state = {
                width: defaultWidth,
                height: defaultHeight
            };
            const displayBounds = displayToUse.bounds;
            state.x = displayBounds.x + (displayBounds.width / 2) - (state.width / 2);
            state.y = displayBounds.y + (displayBounds.height / 2) - (state.height / 2);
            if (displayBounds.width > 0 && displayBounds.height > 0 /* Linux X11 sessions sometimes report wrong display bounds */) {
                if (state.x < displayBounds.x) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the left
                }
                if (state.y < displayBounds.y) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the top
                }
                if (state.x > (displayBounds.x + displayBounds.width)) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the right
                }
                if (state.y > (displayBounds.y + displayBounds.height)) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the bottom
                }
                if (state.width > displayBounds.width) {
                    state.width = displayBounds.width; // prevent window from exceeding display bounds width
                }
                if (state.height > displayBounds.height) {
                    state.height = displayBounds.height; // prevent window from exceeding display bounds height
                }
            }
            return state;
        }
        async getPerformanceInfo() {
            try {
                const [info, remoteData] = await Promise.all([this.launchMainService.getMainProcessInfo(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true })]);
                return await this.diagnosticsService.getPerformanceInfo(info, remoteData);
            }
            catch (error) {
                this.logService.warn('issueService#getPerformanceInfo ', error.message);
                throw error;
            }
        }
    };
    IssueMainService.DEFAULT_BACKGROUND_COLOR = '#1E1E1E';
    IssueMainService = __decorate([
        __param(1, environmentMainService_1.IEnvironmentMainService),
        __param(2, launchMainService_1.ILaunchMainService),
        __param(3, log_1.ILogService),
        __param(4, diagnostics_1.IDiagnosticsService),
        __param(5, diagnosticsMainService_1.IDiagnosticsMainService),
        __param(6, dialogMainService_1.IDialogMainService),
        __param(7, nativeHostMainService_1.INativeHostMainService),
        __param(8, protocol_1.IProtocolMainService),
        __param(9, productService_1.IProductService)
    ], IssueMainService);
    exports.IssueMainService = IssueMainService;
});
//# sourceMappingURL=issueMainService.js.map