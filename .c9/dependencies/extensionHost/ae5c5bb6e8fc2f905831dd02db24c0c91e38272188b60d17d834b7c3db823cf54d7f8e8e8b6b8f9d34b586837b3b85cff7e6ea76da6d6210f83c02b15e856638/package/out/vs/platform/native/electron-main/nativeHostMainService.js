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
define(["require", "exports", "child_process", "electron", "os", "util", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/extpath", "vs/base/node/id", "vs/base/node/pfs", "vs/base/node/ports", "vs/nls", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/theme/electron-main/themeMainService", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService"], function (require, exports, child_process_1, electron_1, os_1, util_1, decorators_1, event_1, labels_1, lifecycle_1, network_1, path_1, platform_1, uri_1, extpath_1, id_1, pfs_1, ports_1, nls_1, dialogMainService_1, environmentMainService_1, instantiation_1, lifecycleMainService_1, log_1, productService_1, themeMainService_1, windows_1, workspace_1, workspacesManagementMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeHostMainService = exports.INativeHostMainService = void 0;
    exports.INativeHostMainService = (0, instantiation_1.createDecorator)('nativeHostMainService');
    let NativeHostMainService = class NativeHostMainService extends lifecycle_1.Disposable {
        constructor(sharedProcess, windowsMainService, dialogMainService, lifecycleMainService, environmentMainService, logService, productService, themeMainService, workspacesManagementMainService) {
            super();
            this.sharedProcess = sharedProcess;
            this.windowsMainService = windowsMainService;
            this.dialogMainService = dialogMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.productService = productService;
            this.themeMainService = themeMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            //#endregion
            //#region Events
            this.onDidOpenWindow = event_1.Event.map(this.windowsMainService.onDidOpenWindow, window => window.id);
            this.onDidMaximizeWindow = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-maximize', (event, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onDidUnmaximizeWindow = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-unmaximize', (event, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onDidBlurWindow = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-blur', (event, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onDidFocusWindow = event_1.Event.any(event_1.Event.map(event_1.Event.filter(event_1.Event.map(this.windowsMainService.onDidChangeWindowsCount, () => this.windowsMainService.getLastActiveWindow()), window => !!window), window => window.id), event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-focus', (event, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId)));
            this.onDidResumeOS = event_1.Event.fromNodeEventEmitter(electron_1.powerMonitor, 'resume');
            this.onDidChangeColorScheme = this.themeMainService.onDidChangeColorScheme;
            this._onDidChangePassword = this._register(new event_1.Emitter());
            this.onDidChangePassword = this._onDidChangePassword.event;
            this.onDidChangeDisplay = event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.screen, 'display-metrics-changed', (event, display, changedMetrics) => changedMetrics), changedMetrics => {
                // Electron will emit 'display-metrics-changed' events even when actually
                // going fullscreen, because the dock hides. However, we do not want to
                // react on this event as there is no change in display bounds.
                return !(Array.isArray(changedMetrics) && changedMetrics.length === 1 && changedMetrics[0] === 'workArea');
            }), event_1.Event.fromNodeEventEmitter(electron_1.screen, 'display-added'), event_1.Event.fromNodeEventEmitter(electron_1.screen, 'display-removed')), () => { }, 100);
        }
        //#region Properties
        get windowId() { throw new Error('Not implemented in electron-main'); }
        //#endregion
        //#region Window
        async getWindows() {
            const windows = this.windowsMainService.getWindows();
            return windows.map(window => {
                var _a, _b;
                return ({
                    id: window.id,
                    workspace: window.openedWorkspace,
                    title: (_b = (_a = window.win) === null || _a === void 0 ? void 0 : _a.getTitle()) !== null && _b !== void 0 ? _b : '',
                    filename: window.getRepresentedFilename(),
                    dirty: window.isDocumentEdited()
                });
            });
        }
        async getWindowCount(windowId) {
            return this.windowsMainService.getWindowCount();
        }
        async getActiveWindowId(windowId) {
            const activeWindow = electron_1.BrowserWindow.getFocusedWindow() || this.windowsMainService.getLastActiveWindow();
            if (activeWindow) {
                return activeWindow.id;
            }
            return undefined;
        }
        openWindow(windowId, arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(windowId, arg1, arg2);
            }
            return this.doOpenEmptyWindow(windowId, arg1);
        }
        async doOpenWindow(windowId, toOpen, options = Object.create(null)) {
            if (toOpen.length > 0) {
                this.windowsMainService.open({
                    context: 5 /* OpenContext.API */,
                    contextWindowId: windowId,
                    urisToOpen: toOpen,
                    cli: this.environmentMainService.args,
                    forceNewWindow: options.forceNewWindow,
                    forceReuseWindow: options.forceReuseWindow,
                    preferNewWindow: options.preferNewWindow,
                    diffMode: options.diffMode,
                    addMode: options.addMode,
                    gotoLineMode: options.gotoLineMode,
                    noRecentEntry: options.noRecentEntry,
                    waitMarkerFileURI: options.waitMarkerFileURI,
                    remoteAuthority: options.remoteAuthority || undefined
                });
            }
        }
        async doOpenEmptyWindow(windowId, options) {
            this.windowsMainService.openEmptyWindow({
                context: 5 /* OpenContext.API */,
                contextWindowId: windowId
            }, options);
        }
        async toggleFullScreen(windowId) {
            const window = this.windowById(windowId);
            if (window) {
                window.toggleFullScreen();
            }
        }
        async handleTitleDoubleClick(windowId) {
            const window = this.windowById(windowId);
            if (window) {
                window.handleTitleDoubleClick();
            }
        }
        async isMaximized(windowId) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                return window.win.isMaximized();
            }
            return false;
        }
        async maximizeWindow(windowId) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                window.win.maximize();
            }
        }
        async unmaximizeWindow(windowId) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                window.win.unmaximize();
            }
        }
        async minimizeWindow(windowId) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                window.win.minimize();
            }
        }
        async focusWindow(windowId, options) {
            var _a;
            if (options && typeof options.windowId === 'number') {
                windowId = options.windowId;
            }
            const window = this.windowById(windowId);
            if (window) {
                window.focus({ force: (_a = options === null || options === void 0 ? void 0 : options.force) !== null && _a !== void 0 ? _a : false });
            }
        }
        async setMinimumSize(windowId, width, height) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                const [windowWidth, windowHeight] = window.win.getSize();
                const [minWindowWidth, minWindowHeight] = window.win.getMinimumSize();
                const [newMinWindowWidth, newMinWindowHeight] = [width !== null && width !== void 0 ? width : minWindowWidth, height !== null && height !== void 0 ? height : minWindowHeight];
                const [newWindowWidth, newWindowHeight] = [Math.max(windowWidth, newMinWindowWidth), Math.max(windowHeight, newMinWindowHeight)];
                if (minWindowWidth !== newMinWindowWidth || minWindowHeight !== newMinWindowHeight) {
                    window.win.setMinimumSize(newMinWindowWidth, newMinWindowHeight);
                }
                if (windowWidth !== newWindowWidth || windowHeight !== newWindowHeight) {
                    window.win.setSize(newWindowWidth, newWindowHeight);
                }
            }
        }
        async saveWindowSplash(windowId, splash) {
            this.themeMainService.saveWindowSplash(windowId, splash);
        }
        //#endregion
        //#region macOS Shell Command
        async installShellCommand(windowId) {
            const { source, target } = await this.getShellCommandLink();
            // Only install unless already existing
            try {
                const { symbolicLink } = await pfs_1.SymlinkSupport.stat(source);
                if (symbolicLink && !symbolicLink.dangling) {
                    const linkTargetRealPath = await (0, extpath_1.realpath)(source);
                    if (target === linkTargetRealPath) {
                        return;
                    }
                }
                // Different source, delete it first
                await pfs_1.Promises.unlink(source);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error; // throw on any error but file not found
                }
            }
            try {
                await pfs_1.Promises.symlink(target, source);
            }
            catch (error) {
                if (error.code !== 'EACCES' && error.code !== 'ENOENT') {
                    throw error;
                }
                const { response } = await this.showMessageBox(windowId, {
                    title: this.productService.nameLong,
                    type: 'info',
                    message: (0, nls_1.localize)('warnEscalation', "{0} will now prompt with 'osascript' for Administrator privileges to install the shell command.", this.productService.nameShort),
                    buttons: [
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK")),
                        (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel")),
                    ],
                    noLink: true,
                    defaultId: 0,
                    cancelId: 1
                });
                if (response === 0 /* OK */) {
                    try {
                        const command = `osascript -e "do shell script \\"mkdir -p /usr/local/bin && ln -sf \'${target}\' \'${source}\'\\" with administrator privileges"`;
                        await (0, util_1.promisify)(child_process_1.exec)(command);
                    }
                    catch (error) {
                        throw new Error((0, nls_1.localize)('cantCreateBinFolder', "Unable to install the shell command '{0}'.", source));
                    }
                }
            }
        }
        async uninstallShellCommand(windowId) {
            const { source } = await this.getShellCommandLink();
            try {
                await pfs_1.Promises.unlink(source);
            }
            catch (error) {
                switch (error.code) {
                    case 'EACCES': {
                        const { response } = await this.showMessageBox(windowId, {
                            title: this.productService.nameLong,
                            type: 'info',
                            message: (0, nls_1.localize)('warnEscalationUninstall', "{0} will now prompt with 'osascript' for Administrator privileges to uninstall the shell command.", this.productService.nameShort),
                            buttons: [
                                (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK")),
                                (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel")),
                            ],
                            noLink: true,
                            defaultId: 0,
                            cancelId: 1
                        });
                        if (response === 0 /* OK */) {
                            try {
                                const command = `osascript -e "do shell script \\"rm \'${source}\'\\" with administrator privileges"`;
                                await (0, util_1.promisify)(child_process_1.exec)(command);
                            }
                            catch (error) {
                                throw new Error((0, nls_1.localize)('cantUninstall', "Unable to uninstall the shell command '{0}'.", source));
                            }
                        }
                        break;
                    }
                    case 'ENOENT':
                        break; // ignore file not found
                    default:
                        throw error;
                }
            }
        }
        async getShellCommandLink() {
            const target = (0, path_1.resolve)(this.environmentMainService.appRoot, 'bin', 'code');
            const source = `/usr/local/bin/${this.productService.applicationName}`;
            // Ensure source exists
            const sourceExists = await pfs_1.Promises.exists(target);
            if (!sourceExists) {
                throw new Error((0, nls_1.localize)('sourceMissing', "Unable to find shell script in '{0}'", target));
            }
            return { source, target };
        }
        //#region Dialog
        async showMessageBox(windowId, options) {
            return this.dialogMainService.showMessageBox(options, this.toBrowserWindow(windowId));
        }
        async showSaveDialog(windowId, options) {
            return this.dialogMainService.showSaveDialog(options, this.toBrowserWindow(windowId));
        }
        async showOpenDialog(windowId, options) {
            return this.dialogMainService.showOpenDialog(options, this.toBrowserWindow(windowId));
        }
        toBrowserWindow(windowId) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                return window.win;
            }
            return undefined;
        }
        async pickFileFolderAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickFileFolder(options);
            if (paths) {
                this.doOpenPicked(await Promise.all(paths.map(async (path) => (await pfs_1.SymlinkSupport.existsDirectory(path)) ? { folderUri: uri_1.URI.file(path) } : { fileUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        async pickFolderAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickFolder(options);
            if (paths) {
                this.doOpenPicked(paths.map(path => ({ folderUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        async pickFileAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickFile(options);
            if (paths) {
                this.doOpenPicked(paths.map(path => ({ fileUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        async pickWorkspaceAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickWorkspace(options);
            if (paths) {
                this.doOpenPicked(paths.map(path => ({ workspaceUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        doOpenPicked(openable, options, windowId) {
            this.windowsMainService.open({
                context: 3 /* OpenContext.DIALOG */,
                contextWindowId: windowId,
                cli: this.environmentMainService.args,
                urisToOpen: openable,
                forceNewWindow: options.forceNewWindow,
                /* remoteAuthority will be determined based on openable */
            });
        }
        //#endregion
        //#region OS
        async showItemInFolder(windowId, path) {
            electron_1.shell.showItemInFolder(path);
        }
        async setRepresentedFilename(windowId, path) {
            const window = this.windowById(windowId);
            if (window) {
                window.setRepresentedFilename(path);
            }
        }
        async setDocumentEdited(windowId, edited) {
            const window = this.windowById(windowId);
            if (window) {
                window.setDocumentEdited(edited);
            }
        }
        async openExternal(windowId, url) {
            if (platform_1.isLinuxSnap) {
                this.safeSnapOpenExternal(url);
            }
            else {
                electron_1.shell.openExternal(url);
            }
            return true;
        }
        safeSnapOpenExternal(url) {
            // Remove some environment variables before opening to avoid issues...
            const gdkPixbufModuleFile = process.env['GDK_PIXBUF_MODULE_FILE'];
            const gdkPixbufModuleDir = process.env['GDK_PIXBUF_MODULEDIR'];
            delete process.env['GDK_PIXBUF_MODULE_FILE'];
            delete process.env['GDK_PIXBUF_MODULEDIR'];
            electron_1.shell.openExternal(url);
            // ...but restore them after
            process.env['GDK_PIXBUF_MODULE_FILE'] = gdkPixbufModuleFile;
            process.env['GDK_PIXBUF_MODULEDIR'] = gdkPixbufModuleDir;
        }
        moveItemToTrash(windowId, fullPath) {
            return electron_1.shell.trashItem(fullPath);
        }
        async isAdmin() {
            let isAdmin;
            if (platform_1.isWindows) {
                isAdmin = (await new Promise((resolve_1, reject_1) => { require(['native-is-elevated'], resolve_1, reject_1); }))();
            }
            else {
                isAdmin = process.getuid() === 0;
            }
            return isAdmin;
        }
        async writeElevated(windowId, source, target, options) {
            const sudoPrompt = await new Promise((resolve_2, reject_2) => { require(['@vscode/sudo-prompt'], resolve_2, reject_2); });
            return new Promise((resolve, reject) => {
                const sudoCommand = [`"${this.cliPath}"`];
                if (options === null || options === void 0 ? void 0 : options.unlock) {
                    sudoCommand.push('--file-chmod');
                }
                sudoCommand.push('--file-write', `"${source.fsPath}"`, `"${target.fsPath}"`);
                const promptOptions = {
                    name: this.productService.nameLong.replace('-', ''),
                    icns: (platform_1.isMacintosh && this.environmentMainService.isBuilt) ? (0, path_1.join)((0, path_1.dirname)(this.environmentMainService.appRoot), `${this.productService.nameShort}.icns`) : undefined
                };
                sudoPrompt.exec(sudoCommand.join(' '), promptOptions, (error, stdout, stderr) => {
                    if (stdout) {
                        this.logService.trace(`[sudo-prompt] received stdout: ${stdout}`);
                    }
                    if (stderr) {
                        this.logService.trace(`[sudo-prompt] received stderr: ${stderr}`);
                    }
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(undefined);
                    }
                });
            });
        }
        get cliPath() {
            // Windows
            if (platform_1.isWindows) {
                if (this.environmentMainService.isBuilt) {
                    return (0, path_1.join)((0, path_1.dirname)(process.execPath), 'bin', `${this.productService.applicationName}.cmd`);
                }
                return (0, path_1.join)(this.environmentMainService.appRoot, 'scripts', 'code-cli.bat');
            }
            // Linux
            if (platform_1.isLinux) {
                if (this.environmentMainService.isBuilt) {
                    return (0, path_1.join)((0, path_1.dirname)(process.execPath), 'bin', `${this.productService.applicationName}`);
                }
                return (0, path_1.join)(this.environmentMainService.appRoot, 'scripts', 'code-cli.sh');
            }
            // macOS
            if (this.environmentMainService.isBuilt) {
                return (0, path_1.join)(this.environmentMainService.appRoot, 'bin', 'code');
            }
            return (0, path_1.join)(this.environmentMainService.appRoot, 'scripts', 'code-cli.sh');
        }
        async getOSStatistics() {
            return {
                totalmem: (0, os_1.totalmem)(),
                freemem: (0, os_1.freemem)(),
                loadavg: (0, os_1.loadavg)()
            };
        }
        async getOSProperties() {
            return {
                arch: (0, os_1.arch)(),
                platform: (0, os_1.platform)(),
                release: (0, os_1.release)(),
                type: (0, os_1.type)(),
                cpus: (0, os_1.cpus)()
            };
        }
        async getOSVirtualMachineHint() {
            return id_1.virtualMachineHint.value();
        }
        async getOSColorScheme() {
            return this.themeMainService.getColorScheme();
        }
        //#endregion
        //#region Process
        async killProcess(windowId, pid, code) {
            process.kill(pid, code);
        }
        //#endregion
        //#region Clipboard
        async readClipboardText(windowId, type) {
            return electron_1.clipboard.readText(type);
        }
        async writeClipboardText(windowId, text, type) {
            return electron_1.clipboard.writeText(text, type);
        }
        async readClipboardFindText(windowId) {
            return electron_1.clipboard.readFindText();
        }
        async writeClipboardFindText(windowId, text) {
            return electron_1.clipboard.writeFindText(text);
        }
        async writeClipboardBuffer(windowId, format, buffer, type) {
            return electron_1.clipboard.writeBuffer(format, Buffer.from(buffer), type);
        }
        async readClipboardBuffer(windowId, format) {
            return electron_1.clipboard.readBuffer(format);
        }
        async hasClipboard(windowId, format, type) {
            return electron_1.clipboard.has(format, type);
        }
        //#endregion
        //#region macOS Touchbar
        async newWindowTab() {
            this.windowsMainService.open({
                context: 5 /* OpenContext.API */,
                cli: this.environmentMainService.args,
                forceNewTabbedWindow: true,
                forceEmpty: true,
                remoteAuthority: this.environmentMainService.args.remote || undefined
            });
        }
        async showPreviousWindowTab() {
            electron_1.Menu.sendActionToFirstResponder('selectPreviousTab:');
        }
        async showNextWindowTab() {
            electron_1.Menu.sendActionToFirstResponder('selectNextTab:');
        }
        async moveWindowTabToNewWindow() {
            electron_1.Menu.sendActionToFirstResponder('moveTabToNewWindow:');
        }
        async mergeAllWindowTabs() {
            electron_1.Menu.sendActionToFirstResponder('mergeAllWindows:');
        }
        async toggleWindowTabsBar() {
            electron_1.Menu.sendActionToFirstResponder('toggleTabBar:');
        }
        async updateTouchBar(windowId, items) {
            const window = this.windowById(windowId);
            if (window) {
                window.updateTouchBar(items);
            }
        }
        //#endregion
        //#region Lifecycle
        async notifyReady(windowId) {
            const window = this.windowById(windowId);
            if (window) {
                window.setReady();
            }
        }
        async relaunch(windowId, options) {
            return this.lifecycleMainService.relaunch(options);
        }
        async reload(windowId, options) {
            const window = this.windowById(windowId);
            if (window) {
                // Special case: support `transient` workspaces by preventing
                // the reload and rather go back to an empty window. Transient
                // workspaces should never restore, even when the user wants
                // to reload.
                // For: https://github.com/microsoft/vscode/issues/119695
                if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace)) {
                    const configPath = window.openedWorkspace.configPath;
                    if (configPath.scheme === network_1.Schemas.file) {
                        const workspace = await this.workspacesManagementMainService.resolveLocalWorkspace(configPath);
                        if (workspace === null || workspace === void 0 ? void 0 : workspace.transient) {
                            return this.openWindow(window.id, { forceReuseWindow: true });
                        }
                    }
                }
                // Proceed normally to reload the window
                return this.lifecycleMainService.reload(window, (options === null || options === void 0 ? void 0 : options.disableExtensions) !== undefined ? { _: [], 'disable-extensions': options.disableExtensions } : undefined);
            }
        }
        async closeWindow(windowId) {
            this.closeWindowById(windowId, windowId);
        }
        async closeWindowById(currentWindowId, targetWindowId) {
            const window = this.windowById(targetWindowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                return window.win.close();
            }
        }
        async quit(windowId) {
            // If the user selected to exit from an extension development host window, do not quit, but just
            // close the window unless this is the last window that is opened.
            const window = this.windowsMainService.getLastActiveWindow();
            if ((window === null || window === void 0 ? void 0 : window.isExtensionDevelopmentHost) && this.windowsMainService.getWindowCount() > 1 && window.win) {
                window.win.close();
            }
            // Otherwise: normal quit
            else {
                this.lifecycleMainService.quit();
            }
        }
        async exit(windowId, code) {
            await this.lifecycleMainService.kill(code);
        }
        //#endregion
        //#region Connectivity
        async resolveProxy(windowId, url) {
            var _a, _b;
            const window = this.windowById(windowId);
            const session = (_b = (_a = window === null || window === void 0 ? void 0 : window.win) === null || _a === void 0 ? void 0 : _a.webContents) === null || _b === void 0 ? void 0 : _b.session;
            if (session) {
                return session.resolveProxy(url);
            }
            else {
                return undefined;
            }
        }
        findFreePort(windowId, startPort, giveUpAfter, timeout, stride = 1) {
            return (0, ports_1.findFreePort)(startPort, giveUpAfter, timeout, stride);
        }
        //#endregion
        //#region Development
        async openDevTools(windowId, options) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                window.win.webContents.openDevTools(options);
            }
        }
        async toggleDevTools(windowId) {
            const window = this.windowById(windowId);
            if (window === null || window === void 0 ? void 0 : window.win) {
                const contents = window.win.webContents;
                contents.toggleDevTools();
            }
        }
        async sendInputEvent(windowId, event) {
            const window = this.windowById(windowId);
            if ((window === null || window === void 0 ? void 0 : window.win) && (event.type === 'mouseDown' || event.type === 'mouseUp')) {
                window.win.webContents.sendInputEvent(event);
            }
        }
        async toggleSharedProcessWindow() {
            return this.sharedProcess.toggle();
        }
        //#endregion
        //#region Registry (windows)
        async windowsGetStringRegKey(windowId, hive, path, name) {
            if (!platform_1.isWindows) {
                return undefined;
            }
            const Registry = await new Promise((resolve_3, reject_3) => { require(['@vscode/windows-registry'], resolve_3, reject_3); });
            try {
                return Registry.GetStringRegKey(hive, path, name);
            }
            catch (_a) {
                return undefined;
            }
        }
        //#endregion
        windowById(windowId) {
            if (typeof windowId !== 'number') {
                return undefined;
            }
            return this.windowsMainService.getWindowById(windowId);
        }
    };
    __decorate([
        decorators_1.memoize
    ], NativeHostMainService.prototype, "cliPath", null);
    NativeHostMainService = __decorate([
        __param(1, windows_1.IWindowsMainService),
        __param(2, dialogMainService_1.IDialogMainService),
        __param(3, lifecycleMainService_1.ILifecycleMainService),
        __param(4, environmentMainService_1.IEnvironmentMainService),
        __param(5, log_1.ILogService),
        __param(6, productService_1.IProductService),
        __param(7, themeMainService_1.IThemeMainService),
        __param(8, workspacesManagementMainService_1.IWorkspacesManagementMainService)
    ], NativeHostMainService);
    exports.NativeHostMainService = NativeHostMainService;
});
//# sourceMappingURL=nativeHostMainService.js.map