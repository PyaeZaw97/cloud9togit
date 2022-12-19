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
define(["require", "exports", "electron", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/configuration/common/configuration", "vs/platform/environment/node/argvHelper", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/url/common/url", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService"], function (require, exports, electron_1, arrays_1, platform_1, types_1, uri_1, pfs_1, configuration_1, argvHelper_1, instantiation_1, log_1, url_1, windows_1, workspace_1, workspacesManagementMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LaunchMainService = exports.ILaunchMainService = exports.ID = void 0;
    exports.ID = 'launchMainService';
    exports.ILaunchMainService = (0, instantiation_1.createDecorator)(exports.ID);
    let LaunchMainService = class LaunchMainService {
        constructor(logService, windowsMainService, urlService, workspacesManagementMainService, configurationService) {
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.urlService = urlService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.configurationService = configurationService;
        }
        async start(args, userEnv) {
            this.logService.trace('Received data from other instance: ', args, userEnv);
            // macOS: Electron > 7.x changed its behaviour to not
            // bring the application to the foreground when a window
            // is focused programmatically. Only via `app.focus` and
            // the option `steal: true` can you get the previous
            // behaviour back. The only reason to use this option is
            // when a window is getting focused while the application
            // is not in the foreground and since we got instructed
            // to open a new window from another instance, we ensure
            // that the app has focus.
            if (platform_1.isMacintosh) {
                electron_1.app.focus({ steal: true });
            }
            // Check early for open-url which is handled in URL service
            const urlsToOpen = this.parseOpenUrl(args);
            if (urlsToOpen.length) {
                let whenWindowReady = Promise.resolve();
                // Create a window if there is none
                if (this.windowsMainService.getWindowCount() === 0) {
                    const window = this.windowsMainService.openEmptyWindow({ context: 4 /* OpenContext.DESKTOP */ })[0];
                    whenWindowReady = window.ready();
                }
                // Make sure a window is open, ready to receive the url event
                whenWindowReady.then(() => {
                    for (const { uri, url } of urlsToOpen) {
                        this.urlService.open(uri, { originalUrl: url });
                    }
                });
            }
            // Otherwise handle in windows service
            else {
                return this.startOpenWindow(args, userEnv);
            }
        }
        parseOpenUrl(args) {
            if (args['open-url'] && args._urls && args._urls.length > 0) {
                // --open-url must contain -- followed by the url(s)
                // process.argv is used over args._ as args._ are resolved to file paths at this point
                return (0, arrays_1.coalesce)(args._urls
                    .map(url => {
                    try {
                        return { uri: uri_1.URI.parse(url), url };
                    }
                    catch (err) {
                        return null;
                    }
                }));
            }
            return [];
        }
        async startOpenWindow(args, userEnv) {
            const context = (0, argvHelper_1.isLaunchedFromCli)(userEnv) ? 0 /* OpenContext.CLI */ : 4 /* OpenContext.DESKTOP */;
            let usedWindows = [];
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            const remoteAuthority = args.remote || undefined;
            const baseConfig = {
                context,
                cli: args,
                userEnv,
                waitMarkerFileURI,
                remoteAuthority
            };
            // Special case extension development
            if (!!args.extensionDevelopmentPath) {
                this.windowsMainService.openExtensionDevelopmentHostWindow(args.extensionDevelopmentPath, baseConfig);
            }
            // Start without file/folder arguments
            else if (!args._.length && !args['folder-uri'] && !args['file-uri']) {
                let openNewWindow = false;
                // Force new window
                if (args['new-window'] || args['unity-launch']) {
                    openNewWindow = true;
                }
                // Force reuse window
                else if (args['reuse-window']) {
                    openNewWindow = false;
                }
                // Otherwise check for settings
                else {
                    const windowConfig = this.configurationService.getValue('window');
                    const openWithoutArgumentsInNewWindowConfig = (windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openWithoutArgumentsInNewWindow) || 'default' /* default */;
                    switch (openWithoutArgumentsInNewWindowConfig) {
                        case 'on':
                            openNewWindow = true;
                            break;
                        case 'off':
                            openNewWindow = false;
                            break;
                        default:
                            openNewWindow = !platform_1.isMacintosh; // prefer to restore running instance on macOS
                    }
                }
                // Open new Window
                if (openNewWindow) {
                    usedWindows = this.windowsMainService.open(Object.assign(Object.assign({}, baseConfig), { forceNewWindow: true, forceEmpty: true }));
                }
                // Focus existing window or open if none opened
                else {
                    const lastActive = this.windowsMainService.getLastActiveWindow();
                    if (lastActive) {
                        this.windowsMainService.openExistingWindow(lastActive, baseConfig);
                        usedWindows = [lastActive];
                    }
                    else {
                        usedWindows = this.windowsMainService.open(Object.assign(Object.assign({}, baseConfig), { forceEmpty: true }));
                    }
                }
            }
            // Start with file/folder arguments
            else {
                usedWindows = this.windowsMainService.open(Object.assign(Object.assign({}, baseConfig), { forceNewWindow: args['new-window'], preferNewWindow: !args['reuse-window'] && !args.wait, forceReuseWindow: args['reuse-window'], diffMode: args.diff, addMode: args.add, noRecentEntry: !!args['skip-add-to-recently-opened'], gotoLineMode: args.goto }));
            }
            // If the other instance is waiting to be killed, we hook up a window listener if one window
            // is being used and only then resolve the startup promise which will kill this second instance.
            // In addition, we poll for the wait marker file to be deleted to return.
            if (waitMarkerFileURI && usedWindows.length === 1 && usedWindows[0]) {
                return Promise.race([
                    usedWindows[0].whenClosedOrLoaded,
                    (0, pfs_1.whenDeleted)(waitMarkerFileURI.fsPath)
                ]).then(() => undefined, () => undefined);
            }
        }
        async getMainProcessId() {
            this.logService.trace('Received request for process ID from other instance.');
            return process.pid;
        }
        async getMainProcessInfo() {
            this.logService.trace('Received request for main process info from other instance.');
            const windows = [];
            electron_1.BrowserWindow.getAllWindows().forEach(window => {
                const codeWindow = this.windowsMainService.getWindowById(window.id);
                if (codeWindow) {
                    windows.push(this.codeWindowToInfo(codeWindow));
                }
                else {
                    windows.push(this.browserWindowToInfo(window));
                }
            });
            return {
                mainPID: process.pid,
                mainArguments: process.argv.slice(1),
                windows,
                screenReader: !!electron_1.app.accessibilitySupportEnabled,
                gpuFeatureStatus: electron_1.app.getGPUFeatureStatus()
            };
        }
        getFolderURIs(window) {
            const folderURIs = [];
            const workspace = window.openedWorkspace;
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                folderURIs.push(workspace.uri);
            }
            else if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                const resolvedWorkspace = this.workspacesManagementMainService.resolveLocalWorkspaceSync(workspace.configPath); // workspace folders can only be shown for local (resolved) workspaces
                if (resolvedWorkspace) {
                    const rootFolders = resolvedWorkspace.folders;
                    rootFolders.forEach(root => {
                        folderURIs.push(root.uri);
                    });
                }
                else {
                    //TODO@RMacfarlane: can we add the workspace file here?
                }
            }
            return folderURIs;
        }
        codeWindowToInfo(window) {
            const folderURIs = this.getFolderURIs(window);
            const win = (0, types_1.assertIsDefined)(window.win);
            return this.browserWindowToInfo(win, folderURIs, window.remoteAuthority);
        }
        browserWindowToInfo(window, folderURIs = [], remoteAuthority) {
            return {
                pid: window.webContents.getOSProcessId(),
                title: window.getTitle(),
                folderURIs,
                remoteAuthority
            };
        }
    };
    LaunchMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, url_1.IURLService),
        __param(3, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(4, configuration_1.IConfigurationService)
    ], LaunchMainService);
    exports.LaunchMainService = LaunchMainService;
});
//# sourceMappingURL=launchMainService.js.map