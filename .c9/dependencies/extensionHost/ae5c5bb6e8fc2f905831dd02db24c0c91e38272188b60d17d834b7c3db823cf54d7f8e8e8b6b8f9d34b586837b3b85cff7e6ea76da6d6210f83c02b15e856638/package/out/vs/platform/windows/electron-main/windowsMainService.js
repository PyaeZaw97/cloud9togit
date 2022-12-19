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
define(["require", "exports", "electron", "fs", "os", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/functional", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/remote/common/remoteHosts", "vs/platform/state/electron-main/state", "vs/platform/window/common/window", "vs/platform/windows/electron-main/window", "vs/platform/windows/electron-main/windowsFinder", "vs/platform/windows/electron-main/windowsStateHandler", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspaces", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/platform/theme/electron-main/themeMainService"], function (require, exports, electron_1, fs_1, os_1, arrays_1, cancellation_1, event_1, extpath_1, functional_1, labels_1, lifecycle_1, network_1, path_1, performance_1, platform_1, process_1, resources_1, types_1, uri_1, nls_1, backup_1, configuration_1, dialogMainService_1, environmentMainService_1, files_1, instantiation_1, lifecycleMainService_1, log_1, product_1, productService_1, protocol_1, remoteHosts_1, state_1, window_1, window_2, windowsFinder_1, windowsStateHandler_1, workspace_1, workspaces_1, workspacesHistoryMainService_1, workspacesManagementMainService_1, themeMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsMainService = void 0;
    function isWorkspacePathToOpen(path) {
        return (0, workspace_1.isWorkspaceIdentifier)(path === null || path === void 0 ? void 0 : path.workspace);
    }
    function isSingleFolderWorkspacePathToOpen(path) {
        return (0, workspace_1.isSingleFolderWorkspaceIdentifier)(path === null || path === void 0 ? void 0 : path.workspace);
    }
    //#endregion
    let WindowsMainService = class WindowsMainService extends lifecycle_1.Disposable {
        constructor(machineId, initialUserEnv, logService, stateMainService, environmentMainService, lifecycleMainService, backupMainService, configurationService, workspacesHistoryMainService, workspacesManagementMainService, instantiationService, dialogMainService, fileService, productService, protocolMainService, themeMainService) {
            super();
            this.machineId = machineId;
            this.initialUserEnv = initialUserEnv;
            this.logService = logService;
            this.stateMainService = stateMainService;
            this.environmentMainService = environmentMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.backupMainService = backupMainService;
            this.configurationService = configurationService;
            this.workspacesHistoryMainService = workspacesHistoryMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.instantiationService = instantiationService;
            this.dialogMainService = dialogMainService;
            this.fileService = fileService;
            this.productService = productService;
            this.protocolMainService = protocolMainService;
            this.themeMainService = themeMainService;
            this._onDidOpenWindow = this._register(new event_1.Emitter());
            this.onDidOpenWindow = this._onDidOpenWindow.event;
            this._onDidSignalReadyWindow = this._register(new event_1.Emitter());
            this.onDidSignalReadyWindow = this._onDidSignalReadyWindow.event;
            this._onDidDestroyWindow = this._register(new event_1.Emitter());
            this.onDidDestroyWindow = this._onDidDestroyWindow.event;
            this._onDidChangeWindowsCount = this._register(new event_1.Emitter());
            this.onDidChangeWindowsCount = this._onDidChangeWindowsCount.event;
            this.windowsStateHandler = this._register(new windowsStateHandler_1.WindowsStateHandler(this, this.stateMainService, this.lifecycleMainService, this.logService, this.configurationService));
            this.registerListeners();
        }
        registerListeners() {
            // Signal a window is ready after having entered a workspace
            this._register(this.workspacesManagementMainService.onDidEnterWorkspace(event => this._onDidSignalReadyWindow.fire(event.window)));
            // Update valid roots in protocol service for extension dev windows
            this._register(this.onDidSignalReadyWindow(window => {
                var _a, _b;
                if (((_a = window.config) === null || _a === void 0 ? void 0 : _a.extensionDevelopmentPath) || ((_b = window.config) === null || _b === void 0 ? void 0 : _b.extensionTestsPath)) {
                    const disposables = new lifecycle_1.DisposableStore();
                    disposables.add(event_1.Event.any(window.onDidClose, window.onDidDestroy)(() => disposables.dispose()));
                    // Allow access to extension development path
                    if (window.config.extensionDevelopmentPath) {
                        for (const extensionDevelopmentPath of window.config.extensionDevelopmentPath) {
                            disposables.add(this.protocolMainService.addValidFileRoot(extensionDevelopmentPath));
                        }
                    }
                    // Allow access to extension tests path
                    if (window.config.extensionTestsPath) {
                        disposables.add(this.protocolMainService.addValidFileRoot(window.config.extensionTestsPath));
                    }
                }
            }));
        }
        openEmptyWindow(openConfig, options) {
            let cli = this.environmentMainService.args;
            const remoteAuthority = (options === null || options === void 0 ? void 0 : options.remoteAuthority) || undefined;
            const forceEmpty = true;
            const forceReuseWindow = options === null || options === void 0 ? void 0 : options.forceReuseWindow;
            const forceNewWindow = !forceReuseWindow;
            return this.open(Object.assign(Object.assign({}, openConfig), { cli, forceEmpty, forceNewWindow, forceReuseWindow, remoteAuthority }));
        }
        openExistingWindow(window, openConfig) {
            // Bring window to front
            window.focus();
            // Handle --wait
            this.handleWaitMarkerFile(openConfig, [window]);
        }
        open(openConfig) {
            this.logService.trace('windowsManager#open');
            if (openConfig.addMode && (openConfig.initialStartup || !this.getLastActiveWindow())) {
                openConfig.addMode = false; // Make sure addMode is only enabled if we have an active window
            }
            const foldersToAdd = [];
            const foldersToOpen = [];
            const workspacesToOpen = [];
            const untitledWorkspacesToRestore = [];
            const emptyWindowsWithBackupsToRestore = [];
            let filesToOpen;
            let emptyToOpen = 0;
            // Identify things to open from open config
            const pathsToOpen = this.getPathsToOpen(openConfig);
            this.logService.trace('windowsManager#open pathsToOpen', pathsToOpen);
            for (const path of pathsToOpen) {
                if (isSingleFolderWorkspacePathToOpen(path)) {
                    if (openConfig.addMode) {
                        // When run with --add, take the folders that are to be opened as
                        // folders that should be added to the currently active window.
                        foldersToAdd.push(path);
                    }
                    else {
                        foldersToOpen.push(path);
                    }
                }
                else if (isWorkspacePathToOpen(path)) {
                    workspacesToOpen.push(path);
                }
                else if (path.fileUri) {
                    if (!filesToOpen) {
                        filesToOpen = { filesToOpenOrCreate: [], filesToDiff: [], remoteAuthority: path.remoteAuthority };
                    }
                    filesToOpen.filesToOpenOrCreate.push(path);
                }
                else if (path.backupPath) {
                    emptyWindowsWithBackupsToRestore.push({ backupFolder: (0, path_1.basename)(path.backupPath), remoteAuthority: path.remoteAuthority });
                }
                else {
                    emptyToOpen++;
                }
            }
            // When run with --diff, take the first 2 files to open as files to diff
            if (openConfig.diffMode && filesToOpen && filesToOpen.filesToOpenOrCreate.length >= 2) {
                filesToOpen.filesToDiff = filesToOpen.filesToOpenOrCreate.slice(0, 2);
                filesToOpen.filesToOpenOrCreate = [];
            }
            // When run with --wait, make sure we keep the paths to wait for
            if (filesToOpen && openConfig.waitMarkerFileURI) {
                filesToOpen.filesToWait = { paths: [...filesToOpen.filesToDiff, ...filesToOpen.filesToOpenOrCreate], waitMarkerFileUri: openConfig.waitMarkerFileURI };
            }
            // These are windows to restore because of hot-exit or from previous session (only performed once on startup!)
            if (openConfig.initialStartup) {
                // Untitled workspaces are always restored
                untitledWorkspacesToRestore.push(...this.workspacesManagementMainService.getUntitledWorkspacesSync());
                workspacesToOpen.push(...untitledWorkspacesToRestore);
                // Empty windows with backups are always restored
                emptyWindowsWithBackupsToRestore.push(...this.backupMainService.getEmptyWindowBackupPaths());
            }
            else {
                emptyWindowsWithBackupsToRestore.length = 0;
            }
            // Open based on config
            const { windows: usedWindows, filesOpenedInWindow } = this.doOpen(openConfig, workspacesToOpen, foldersToOpen, emptyWindowsWithBackupsToRestore, emptyToOpen, filesToOpen, foldersToAdd);
            this.logService.trace(`windowsManager#open used window count ${usedWindows.length} (workspacesToOpen: ${workspacesToOpen.length}, foldersToOpen: ${foldersToOpen.length}, emptyToRestore: ${emptyWindowsWithBackupsToRestore.length}, emptyToOpen: ${emptyToOpen})`);
            // Make sure to pass focus to the most relevant of the windows if we open multiple
            if (usedWindows.length > 1) {
                // 1.) focus window we opened files in always with highest priority
                if (filesOpenedInWindow) {
                    filesOpenedInWindow.focus();
                }
                // Otherwise, find a good window based on open params
                else {
                    const focusLastActive = this.windowsStateHandler.state.lastActiveWindow && !openConfig.forceEmpty && !openConfig.cli._.length && !openConfig.cli['file-uri'] && !openConfig.cli['folder-uri'] && !(openConfig.urisToOpen && openConfig.urisToOpen.length);
                    let focusLastOpened = true;
                    let focusLastWindow = true;
                    // 2.) focus last active window if we are not instructed to open any paths
                    if (focusLastActive) {
                        const lastActiveWindow = usedWindows.filter(window => this.windowsStateHandler.state.lastActiveWindow && window.backupPath === this.windowsStateHandler.state.lastActiveWindow.backupPath);
                        if (lastActiveWindow.length) {
                            lastActiveWindow[0].focus();
                            focusLastOpened = false;
                            focusLastWindow = false;
                        }
                    }
                    // 3.) if instructed to open paths, focus last window which is not restored
                    if (focusLastOpened) {
                        for (let i = usedWindows.length - 1; i >= 0; i--) {
                            const usedWindow = usedWindows[i];
                            if ((usedWindow.openedWorkspace && untitledWorkspacesToRestore.some(workspace => usedWindow.openedWorkspace && workspace.workspace.id === usedWindow.openedWorkspace.id)) || // skip over restored workspace
                                (usedWindow.backupPath && emptyWindowsWithBackupsToRestore.some(empty => usedWindow.backupPath && empty.backupFolder === (0, path_1.basename)(usedWindow.backupPath))) // skip over restored empty window
                            ) {
                                continue;
                            }
                            usedWindow.focus();
                            focusLastWindow = false;
                            break;
                        }
                    }
                    // 4.) finally, always ensure to have at least last used window focused
                    if (focusLastWindow) {
                        usedWindows[usedWindows.length - 1].focus();
                    }
                }
            }
            // Remember in recent document list (unless this opens for extension development)
            // Also do not add paths when files are opened for diffing, only if opened individually
            const isDiff = filesToOpen && filesToOpen.filesToDiff.length > 0;
            if (!usedWindows.some(window => window.isExtensionDevelopmentHost) && !isDiff && !openConfig.noRecentEntry) {
                const recents = [];
                for (const pathToOpen of pathsToOpen) {
                    if (isWorkspacePathToOpen(pathToOpen) && !pathToOpen.transient /* never add transient workspaces to history */) {
                        recents.push({ label: pathToOpen.label, workspace: pathToOpen.workspace, remoteAuthority: pathToOpen.remoteAuthority });
                    }
                    else if (isSingleFolderWorkspacePathToOpen(pathToOpen)) {
                        recents.push({ label: pathToOpen.label, folderUri: pathToOpen.workspace.uri, remoteAuthority: pathToOpen.remoteAuthority });
                    }
                    else if (pathToOpen.fileUri) {
                        recents.push({ label: pathToOpen.label, fileUri: pathToOpen.fileUri, remoteAuthority: pathToOpen.remoteAuthority });
                    }
                }
                this.workspacesHistoryMainService.addRecentlyOpened(recents);
            }
            // Handle --wait
            this.handleWaitMarkerFile(openConfig, usedWindows);
            return usedWindows;
        }
        handleWaitMarkerFile(openConfig, usedWindows) {
            // If we got started with --wait from the CLI, we need to signal to the outside when the window
            // used for the edit operation is closed or loaded to a different folder so that the waiting
            // process can continue. We do this by deleting the waitMarkerFilePath.
            const waitMarkerFileURI = openConfig.waitMarkerFileURI;
            if (openConfig.context === 0 /* OpenContext.CLI */ && waitMarkerFileURI && usedWindows.length === 1 && usedWindows[0]) {
                (async () => {
                    await usedWindows[0].whenClosedOrLoaded;
                    try {
                        await this.fileService.del(waitMarkerFileURI);
                    }
                    catch (error) {
                        // ignore - could have been deleted from the window already
                    }
                })();
            }
        }
        doOpen(openConfig, workspacesToOpen, foldersToOpen, emptyToRestore, emptyToOpen, filesToOpen, foldersToAdd) {
            // Keep track of used windows and remember
            // if files have been opened in one of them
            const usedWindows = [];
            let filesOpenedInWindow = undefined;
            function addUsedWindow(window, openedFiles) {
                usedWindows.push(window);
                if (openedFiles) {
                    filesOpenedInWindow = window;
                    filesToOpen = undefined; // reset `filesToOpen` since files have been opened
                }
            }
            // Settings can decide if files/folders open in new window or not
            let { openFolderInNewWindow, openFilesInNewWindow } = this.shouldOpenNewWindow(openConfig);
            // Handle folders to add by looking for the last active workspace (not on initial startup)
            if (!openConfig.initialStartup && foldersToAdd.length > 0) {
                const authority = foldersToAdd[0].remoteAuthority;
                const lastActiveWindow = this.getLastActiveWindowForAuthority(authority);
                if (lastActiveWindow) {
                    addUsedWindow(this.doAddFoldersToExistingWindow(lastActiveWindow, foldersToAdd.map(folderToAdd => folderToAdd.workspace.uri)));
                }
            }
            // Handle files to open/diff or to create when we dont open a folder and we do not restore any
            // folder/untitled from hot-exit by trying to open them in the window that fits best
            const potentialNewWindowsCount = foldersToOpen.length + workspacesToOpen.length + emptyToRestore.length;
            if (filesToOpen && potentialNewWindowsCount === 0) {
                // Find suitable window or folder path to open files in
                const fileToCheck = filesToOpen.filesToOpenOrCreate[0] || filesToOpen.filesToDiff[0];
                // only look at the windows with correct authority
                const windows = this.getWindows().filter(window => filesToOpen && (0, resources_1.isEqualAuthority)(window.remoteAuthority, filesToOpen.remoteAuthority));
                // figure out a good window to open the files in if any
                // with a fallback to the last active window.
                //
                // in case `openFilesInNewWindow` is enforced, we skip
                // this step.
                let windowToUseForFiles = undefined;
                if ((fileToCheck === null || fileToCheck === void 0 ? void 0 : fileToCheck.fileUri) && !openFilesInNewWindow) {
                    if (openConfig.context === 4 /* OpenContext.DESKTOP */ || openConfig.context === 0 /* OpenContext.CLI */ || openConfig.context === 1 /* OpenContext.DOCK */) {
                        windowToUseForFiles = (0, windowsFinder_1.findWindowOnFile)(windows, fileToCheck.fileUri, workspace => workspace.configPath.scheme === network_1.Schemas.file ? this.workspacesManagementMainService.resolveLocalWorkspaceSync(workspace.configPath) : undefined);
                    }
                    if (!windowToUseForFiles) {
                        windowToUseForFiles = this.doGetLastActiveWindow(windows);
                    }
                }
                // We found a window to open the files in
                if (windowToUseForFiles) {
                    // Window is workspace
                    if ((0, workspace_1.isWorkspaceIdentifier)(windowToUseForFiles.openedWorkspace)) {
                        workspacesToOpen.push({ workspace: windowToUseForFiles.openedWorkspace, remoteAuthority: windowToUseForFiles.remoteAuthority });
                    }
                    // Window is single folder
                    else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(windowToUseForFiles.openedWorkspace)) {
                        foldersToOpen.push({ workspace: windowToUseForFiles.openedWorkspace, remoteAuthority: windowToUseForFiles.remoteAuthority });
                    }
                    // Window is empty
                    else {
                        addUsedWindow(this.doOpenFilesInExistingWindow(openConfig, windowToUseForFiles, filesToOpen), true);
                    }
                }
                // Finally, if no window or folder is found, just open the files in an empty window
                else {
                    addUsedWindow(this.openInBrowserWindow({
                        userEnv: openConfig.userEnv,
                        cli: openConfig.cli,
                        initialStartup: openConfig.initialStartup,
                        filesToOpen,
                        forceNewWindow: true,
                        remoteAuthority: filesToOpen.remoteAuthority,
                        forceNewTabbedWindow: openConfig.forceNewTabbedWindow
                    }), true);
                }
            }
            // Handle workspaces to open (instructed and to restore)
            const allWorkspacesToOpen = (0, arrays_1.distinct)(workspacesToOpen, workspace => workspace.workspace.id); // prevent duplicates
            if (allWorkspacesToOpen.length > 0) {
                // Check for existing instances
                const windowsOnWorkspace = (0, arrays_1.coalesce)(allWorkspacesToOpen.map(workspaceToOpen => (0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), workspaceToOpen.workspace.configPath)));
                if (windowsOnWorkspace.length > 0) {
                    const windowOnWorkspace = windowsOnWorkspace[0];
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.remoteAuthority, windowOnWorkspace.remoteAuthority) ? filesToOpen : undefined;
                    // Do open files
                    addUsedWindow(this.doOpenFilesInExistingWindow(openConfig, windowOnWorkspace, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
                // Open remaining ones
                allWorkspacesToOpen.forEach(workspaceToOpen => {
                    if (windowsOnWorkspace.some(window => window.openedWorkspace && window.openedWorkspace.id === workspaceToOpen.workspace.id)) {
                        return; // ignore folders that are already open
                    }
                    const remoteAuthority = workspaceToOpen.remoteAuthority;
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.remoteAuthority, remoteAuthority) ? filesToOpen : undefined;
                    // Do open folder
                    addUsedWindow(this.doOpenFolderOrWorkspace(openConfig, workspaceToOpen, openFolderInNewWindow, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                });
            }
            // Handle folders to open (instructed and to restore)
            const allFoldersToOpen = (0, arrays_1.distinct)(foldersToOpen, folder => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(folder.workspace.uri)); // prevent duplicates
            if (allFoldersToOpen.length > 0) {
                // Check for existing instances
                const windowsOnFolderPath = (0, arrays_1.coalesce)(allFoldersToOpen.map(folderToOpen => (0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), folderToOpen.workspace.uri)));
                if (windowsOnFolderPath.length > 0) {
                    const windowOnFolderPath = windowsOnFolderPath[0];
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.remoteAuthority, windowOnFolderPath.remoteAuthority) ? filesToOpen : undefined;
                    // Do open files
                    addUsedWindow(this.doOpenFilesInExistingWindow(openConfig, windowOnFolderPath, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
                // Open remaining ones
                allFoldersToOpen.forEach(folderToOpen => {
                    if (windowsOnFolderPath.some(window => (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqual(window.openedWorkspace.uri, folderToOpen.workspace.uri))) {
                        return; // ignore folders that are already open
                    }
                    const remoteAuthority = folderToOpen.remoteAuthority;
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.remoteAuthority, remoteAuthority) ? filesToOpen : undefined;
                    // Do open folder
                    addUsedWindow(this.doOpenFolderOrWorkspace(openConfig, folderToOpen, openFolderInNewWindow, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                });
            }
            // Handle empty to restore
            const allEmptyToRestore = (0, arrays_1.distinct)(emptyToRestore, info => info.backupFolder); // prevent duplicates
            if (allEmptyToRestore.length > 0) {
                allEmptyToRestore.forEach(emptyWindowBackupInfo => {
                    const remoteAuthority = emptyWindowBackupInfo.remoteAuthority;
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.remoteAuthority, remoteAuthority) ? filesToOpen : undefined;
                    addUsedWindow(this.doOpenEmpty(openConfig, true, remoteAuthority, filesToOpenInWindow, emptyWindowBackupInfo), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                });
            }
            // Handle empty to open (only if no other window opened)
            if (usedWindows.length === 0 || filesToOpen) {
                if (filesToOpen && !emptyToOpen) {
                    emptyToOpen++;
                }
                const remoteAuthority = filesToOpen ? filesToOpen.remoteAuthority : openConfig.remoteAuthority;
                for (let i = 0; i < emptyToOpen; i++) {
                    addUsedWindow(this.doOpenEmpty(openConfig, openFolderInNewWindow, remoteAuthority, filesToOpen), !!filesToOpen);
                    // any other window to open must open in new window then
                    openFolderInNewWindow = true;
                }
            }
            return { windows: (0, arrays_1.distinct)(usedWindows), filesOpenedInWindow };
        }
        doOpenFilesInExistingWindow(configuration, window, filesToOpen) {
            var _a;
            this.logService.trace('windowsManager#doOpenFilesInExistingWindow', { filesToOpen });
            window.focus(); // make sure window has focus
            const params = {
                filesToOpenOrCreate: filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.filesToOpenOrCreate,
                filesToDiff: filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.filesToDiff,
                filesToWait: filesToOpen === null || filesToOpen === void 0 ? void 0 : filesToOpen.filesToWait,
                termProgram: (_a = configuration === null || configuration === void 0 ? void 0 : configuration.userEnv) === null || _a === void 0 ? void 0 : _a['TERM_PROGRAM']
            };
            window.sendWhenReady('vscode:openFiles', cancellation_1.CancellationToken.None, params);
            return window;
        }
        doAddFoldersToExistingWindow(window, foldersToAdd) {
            this.logService.trace('windowsManager#doAddFoldersToExistingWindow', { foldersToAdd });
            window.focus(); // make sure window has focus
            const request = { foldersToAdd };
            window.sendWhenReady('vscode:addFolders', cancellation_1.CancellationToken.None, request);
            return window;
        }
        doOpenEmpty(openConfig, forceNewWindow, remoteAuthority, filesToOpen, emptyWindowBackupInfo) {
            this.logService.trace('windowsManager#doOpenEmpty', { restore: !!emptyWindowBackupInfo, remoteAuthority, filesToOpen, forceNewWindow });
            let windowToUse;
            if (!forceNewWindow && typeof openConfig.contextWindowId === 'number') {
                windowToUse = this.getWindowById(openConfig.contextWindowId); // fix for https://github.com/microsoft/vscode/issues/97172
            }
            return this.openInBrowserWindow({
                userEnv: openConfig.userEnv,
                cli: openConfig.cli,
                initialStartup: openConfig.initialStartup,
                remoteAuthority,
                forceNewWindow,
                forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                filesToOpen,
                windowToUse,
                emptyWindowBackupInfo
            });
        }
        doOpenFolderOrWorkspace(openConfig, folderOrWorkspace, forceNewWindow, filesToOpen, windowToUse) {
            this.logService.trace('windowsManager#doOpenFolderOrWorkspace', { folderOrWorkspace, filesToOpen });
            if (!forceNewWindow && !windowToUse && typeof openConfig.contextWindowId === 'number') {
                windowToUse = this.getWindowById(openConfig.contextWindowId); // fix for https://github.com/microsoft/vscode/issues/49587
            }
            return this.openInBrowserWindow({
                workspace: folderOrWorkspace.workspace,
                userEnv: openConfig.userEnv,
                cli: openConfig.cli,
                initialStartup: openConfig.initialStartup,
                remoteAuthority: folderOrWorkspace.remoteAuthority,
                forceNewWindow,
                forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                filesToOpen,
                windowToUse
            });
        }
        getPathsToOpen(openConfig) {
            var _a;
            let pathsToOpen;
            let isCommandLineOrAPICall = false;
            let restoredWindows = false;
            // Extract paths: from API
            if (openConfig.urisToOpen && openConfig.urisToOpen.length > 0) {
                pathsToOpen = this.doExtractPathsFromAPI(openConfig);
                isCommandLineOrAPICall = true;
            }
            // Check for force empty
            else if (openConfig.forceEmpty) {
                pathsToOpen = [Object.create(null)];
            }
            // Extract paths: from CLI
            else if (openConfig.cli._.length || openConfig.cli['folder-uri'] || openConfig.cli['file-uri']) {
                pathsToOpen = this.doExtractPathsFromCLI(openConfig.cli);
                if (pathsToOpen.length === 0) {
                    pathsToOpen.push(Object.create(null)); // add an empty window if we did not have windows to open from command line
                }
                isCommandLineOrAPICall = true;
            }
            // Extract paths: from previous session
            else {
                pathsToOpen = this.doGetPathsFromLastSession();
                if (pathsToOpen.length === 0) {
                    pathsToOpen.push(Object.create(null)); // add an empty window if we did not have windows to restore
                }
                restoredWindows = true;
            }
            // Convert multiple folders into workspace (if opened via API or CLI)
            // This will ensure to open these folders in one window instead of multiple
            // If we are in `addMode`, we should not do this because in that case all
            // folders should be added to the existing window.
            if (!openConfig.addMode && isCommandLineOrAPICall) {
                const foldersToOpen = pathsToOpen.filter(path => isSingleFolderWorkspacePathToOpen(path));
                if (foldersToOpen.length > 1) {
                    const remoteAuthority = foldersToOpen[0].remoteAuthority;
                    if (foldersToOpen.every(folderToOpen => (0, resources_1.isEqualAuthority)(folderToOpen.remoteAuthority, remoteAuthority))) { // only if all folder have the same authority
                        const workspace = this.workspacesManagementMainService.createUntitledWorkspaceSync(foldersToOpen.map(folder => ({ uri: folder.workspace.uri })));
                        // Add workspace and remove folders thereby
                        pathsToOpen.push({ workspace, remoteAuthority });
                        pathsToOpen = pathsToOpen.filter(path => !isSingleFolderWorkspacePathToOpen(path));
                    }
                }
            }
            // Check for `window.startup` setting to include all windows
            // from the previous session if this is the initial startup and we have
            // not restored windows already otherwise.
            // Use `unshift` to ensure any new window to open comes last
            // for proper focus treatment.
            if (openConfig.initialStartup && !restoredWindows && ((_a = this.configurationService.getValue('window')) === null || _a === void 0 ? void 0 : _a.restoreWindows) === 'preserve') {
                pathsToOpen.unshift(...this.doGetPathsFromLastSession().filter(path => isWorkspacePathToOpen(path) || isSingleFolderWorkspacePathToOpen(path) || path.backupPath));
            }
            return pathsToOpen;
        }
        doExtractPathsFromAPI(openConfig) {
            const pathsToOpen = [];
            const pathResolveOptions = { gotoLineMode: openConfig.gotoLineMode, remoteAuthority: openConfig.remoteAuthority };
            for (const pathToOpen of (0, arrays_1.coalesce)(openConfig.urisToOpen || [])) {
                const path = this.resolveOpenable(pathToOpen, pathResolveOptions);
                // Path exists
                if (path) {
                    path.label = pathToOpen.label;
                    pathsToOpen.push(path);
                }
                // Path does not exist: show a warning box
                else {
                    const uri = this.resourceFromOpenable(pathToOpen);
                    const options = {
                        title: this.productService.nameLong,
                        type: 'info',
                        buttons: [(0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"))],
                        defaultId: 0,
                        message: uri.scheme === network_1.Schemas.file ? (0, nls_1.localize)('pathNotExistTitle', "Path does not exist") : (0, nls_1.localize)('uriInvalidTitle', "URI can not be opened"),
                        detail: uri.scheme === network_1.Schemas.file ?
                            (0, nls_1.localize)('pathNotExistDetail', "The path '{0}' does not exist on this computer.", (0, labels_1.getPathLabel)(uri, { os: platform_1.OS, tildify: this.environmentMainService })) :
                            (0, nls_1.localize)('uriInvalidDetail', "The URI '{0}' is not valid and can not be opened.", uri.toString(true)),
                        noLink: true
                    };
                    this.dialogMainService.showMessageBox(options, (0, types_1.withNullAsUndefined)(electron_1.BrowserWindow.getFocusedWindow()));
                }
            }
            return pathsToOpen;
        }
        doExtractPathsFromCLI(cli) {
            const pathsToOpen = [];
            const pathResolveOptions = { ignoreFileNotFound: true, gotoLineMode: cli.goto, remoteAuthority: cli.remote || undefined, forceOpenWorkspaceAsFile: false };
            // folder uris
            const folderUris = cli['folder-uri'];
            if (folderUris) {
                for (const rawFolderUri of folderUris) {
                    const folderUri = this.cliArgToUri(rawFolderUri);
                    if (folderUri) {
                        const path = this.resolveOpenable({ folderUri }, pathResolveOptions);
                        if (path) {
                            pathsToOpen.push(path);
                        }
                    }
                }
            }
            // file uris
            const fileUris = cli['file-uri'];
            if (fileUris) {
                for (const rawFileUri of fileUris) {
                    const fileUri = this.cliArgToUri(rawFileUri);
                    if (fileUri) {
                        const path = this.resolveOpenable((0, workspace_1.hasWorkspaceFileExtension)(rawFileUri) ? { workspaceUri: fileUri } : { fileUri }, pathResolveOptions);
                        if (path) {
                            pathsToOpen.push(path);
                        }
                    }
                }
            }
            // folder or file paths
            const cliPaths = cli._;
            for (const cliPath of cliPaths) {
                const path = pathResolveOptions.remoteAuthority ? this.doResolvePathRemote(cliPath, pathResolveOptions) : this.doResolveFilePath(cliPath, pathResolveOptions);
                if (path) {
                    pathsToOpen.push(path);
                }
            }
            return pathsToOpen;
        }
        cliArgToUri(arg) {
            try {
                const uri = uri_1.URI.parse(arg);
                if (!uri.scheme) {
                    this.logService.error(`Invalid URI input string, scheme missing: ${arg}`);
                    return undefined;
                }
                return uri;
            }
            catch (e) {
                this.logService.error(`Invalid URI input string: ${arg}, ${e.message}`);
            }
            return undefined;
        }
        doGetPathsFromLastSession() {
            const restoreWindowsSetting = this.getRestoreWindowsSetting();
            switch (restoreWindowsSetting) {
                // none: no window to restore
                case 'none':
                    return [];
                // one: restore last opened workspace/folder or empty window
                // all: restore all windows
                // folders: restore last opened folders only
                case 'one':
                case 'all':
                case 'preserve':
                case 'folders': {
                    // Collect previously opened windows
                    const lastSessionWindows = [];
                    if (restoreWindowsSetting !== 'one') {
                        lastSessionWindows.push(...this.windowsStateHandler.state.openedWindows);
                    }
                    if (this.windowsStateHandler.state.lastActiveWindow) {
                        lastSessionWindows.push(this.windowsStateHandler.state.lastActiveWindow);
                    }
                    const pathsToOpen = [];
                    for (const lastSessionWindow of lastSessionWindows) {
                        // Workspaces
                        if (lastSessionWindow.workspace) {
                            const pathToOpen = this.resolveOpenable({ workspaceUri: lastSessionWindow.workspace.configPath }, { remoteAuthority: lastSessionWindow.remoteAuthority, rejectTransientWorkspaces: true /* https://github.com/microsoft/vscode/issues/119695 */ });
                            if (isWorkspacePathToOpen(pathToOpen)) {
                                pathsToOpen.push(pathToOpen);
                            }
                        }
                        // Folders
                        else if (lastSessionWindow.folderUri) {
                            const pathToOpen = this.resolveOpenable({ folderUri: lastSessionWindow.folderUri }, { remoteAuthority: lastSessionWindow.remoteAuthority });
                            if (isSingleFolderWorkspacePathToOpen(pathToOpen)) {
                                pathsToOpen.push(pathToOpen);
                            }
                        }
                        // Empty window, potentially editors open to be restored
                        else if (restoreWindowsSetting !== 'folders' && lastSessionWindow.backupPath) {
                            pathsToOpen.push({ backupPath: lastSessionWindow.backupPath, remoteAuthority: lastSessionWindow.remoteAuthority });
                        }
                    }
                    return pathsToOpen;
                }
            }
        }
        getRestoreWindowsSetting() {
            let restoreWindows;
            if (this.lifecycleMainService.wasRestarted) {
                restoreWindows = 'all'; // always reopen all windows when an update was applied
            }
            else {
                const windowConfig = this.configurationService.getValue('window');
                restoreWindows = (windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.restoreWindows) || 'all'; // by default restore all windows
                if (!['preserve', 'all', 'folders', 'one', 'none'].includes(restoreWindows)) {
                    restoreWindows = 'all'; // by default restore all windows
                }
            }
            return restoreWindows;
        }
        resolveOpenable(openable, options = Object.create(null)) {
            // handle file:// openables with some extra validation
            let uri = this.resourceFromOpenable(openable);
            if (uri.scheme === network_1.Schemas.file) {
                if ((0, window_1.isFileToOpen)(openable)) {
                    options = Object.assign(Object.assign({}, options), { forceOpenWorkspaceAsFile: true });
                }
                return this.doResolveFilePath(uri.fsPath, options);
            }
            // handle non file:// openables
            return this.doResolveRemoteOpenable(openable, options);
        }
        doResolveRemoteOpenable(openable, options) {
            let uri = this.resourceFromOpenable(openable);
            // use remote authority from vscode
            const remoteAuthority = (0, remoteHosts_1.getRemoteAuthority)(uri) || options.remoteAuthority;
            // normalize URI
            uri = (0, resources_1.removeTrailingPathSeparator)((0, resources_1.normalizePath)(uri));
            // File
            if ((0, window_1.isFileToOpen)(openable)) {
                if (options.gotoLineMode) {
                    const { path, line, column } = (0, extpath_1.parseLineAndColumnAware)(uri.path);
                    return {
                        fileUri: uri.with({ path }),
                        options: {
                            selection: line ? { startLineNumber: line, startColumn: column || 1 } : undefined
                        },
                        remoteAuthority
                    };
                }
                return { fileUri: uri, remoteAuthority };
            }
            // Workspace
            else if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return { workspace: (0, workspaces_1.getWorkspaceIdentifier)(uri), remoteAuthority };
            }
            // Folder
            return { workspace: (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri), remoteAuthority };
        }
        resourceFromOpenable(openable) {
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return openable.workspaceUri;
            }
            if ((0, window_1.isFolderToOpen)(openable)) {
                return openable.folderUri;
            }
            return openable.fileUri;
        }
        doResolveFilePath(path, options) {
            // Extract line/col information from path
            let lineNumber;
            let columnNumber;
            if (options.gotoLineMode) {
                ({ path, line: lineNumber, column: columnNumber } = (0, extpath_1.parseLineAndColumnAware)(path));
            }
            // Ensure the path is normalized and absolute
            path = (0, extpath_1.sanitizeFilePath)((0, path_1.normalize)(path), (0, process_1.cwd)());
            try {
                const pathStat = (0, fs_1.statSync)(path);
                // File
                if (pathStat.isFile()) {
                    // Workspace (unless disabled via flag)
                    if (!options.forceOpenWorkspaceAsFile) {
                        const workspace = this.workspacesManagementMainService.resolveLocalWorkspaceSync(uri_1.URI.file(path));
                        if (workspace) {
                            // If the workspace is transient and we are to ignore
                            // transient workspaces, reject it.
                            if (workspace.transient && options.rejectTransientWorkspaces) {
                                return undefined;
                            }
                            return {
                                workspace: { id: workspace.id, configPath: workspace.configPath },
                                type: files_1.FileType.File,
                                exists: true,
                                remoteAuthority: workspace.remoteAuthority,
                                transient: workspace.transient
                            };
                        }
                    }
                    return {
                        fileUri: uri_1.URI.file(path),
                        type: files_1.FileType.File,
                        exists: true,
                        options: {
                            selection: lineNumber ? { startLineNumber: lineNumber, startColumn: columnNumber || 1 } : undefined
                        }
                    };
                }
                // Folder
                else if (pathStat.isDirectory()) {
                    return {
                        workspace: (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri_1.URI.file(path), pathStat),
                        type: files_1.FileType.Directory,
                        exists: true
                    };
                }
                // Special device: in POSIX environments, we may get /dev/null passed
                // in (for example git uses it to signal one side of a diff does not
                // exist). In that special case, treat it like a file to support this
                // scenario ()
                else if (!platform_1.isWindows && path === '/dev/null') {
                    return {
                        fileUri: uri_1.URI.file(path),
                        type: files_1.FileType.File,
                        exists: true
                    };
                }
            }
            catch (error) {
                const fileUri = uri_1.URI.file(path);
                // since file does not seem to exist anymore, remove from recent
                this.workspacesHistoryMainService.removeRecentlyOpened([fileUri]);
                // assume this is a file that does not yet exist
                if (options.ignoreFileNotFound) {
                    return {
                        fileUri,
                        type: files_1.FileType.File,
                        exists: false
                    };
                }
            }
            return undefined;
        }
        doResolvePathRemote(path, options) {
            const first = path.charCodeAt(0);
            const remoteAuthority = options.remoteAuthority;
            // Extract line/col information from path
            let lineNumber;
            let columnNumber;
            if (options.gotoLineMode) {
                ({ path, line: lineNumber, column: columnNumber } = (0, extpath_1.parseLineAndColumnAware)(path));
            }
            // make absolute
            if (first !== 47 /* CharCode.Slash */) {
                if ((0, extpath_1.isWindowsDriveLetter)(first) && path.charCodeAt(path.charCodeAt(1)) === 58 /* CharCode.Colon */) {
                    path = (0, extpath_1.toSlashes)(path);
                }
                path = `/${path}`;
            }
            const uri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, authority: remoteAuthority, path: path });
            // guess the file type:
            // - if it ends with a slash it's a folder
            // - if in goto line mode or if it has a file extension, it's a file or a workspace
            // - by defaults it's a folder
            if (path.charCodeAt(path.length - 1) !== 47 /* CharCode.Slash */) {
                // file name ends with .code-workspace
                if ((0, workspace_1.hasWorkspaceFileExtension)(path)) {
                    if (options.forceOpenWorkspaceAsFile) {
                        return {
                            fileUri: uri,
                            options: {
                                selection: lineNumber ? { startLineNumber: lineNumber, startColumn: columnNumber || 1 } : undefined
                            },
                            remoteAuthority: options.remoteAuthority
                        };
                    }
                    return { workspace: (0, workspaces_1.getWorkspaceIdentifier)(uri), remoteAuthority };
                }
                // file name starts with a dot or has an file extension
                else if (options.gotoLineMode || path_1.posix.basename(path).indexOf('.') !== -1) {
                    return {
                        fileUri: uri,
                        options: {
                            selection: lineNumber ? { startLineNumber: lineNumber, startColumn: columnNumber || 1 } : undefined
                        },
                        remoteAuthority
                    };
                }
            }
            return { workspace: (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri), remoteAuthority };
        }
        shouldOpenNewWindow(openConfig) {
            // let the user settings override how folders are open in a new window or same window unless we are forced
            const windowConfig = this.configurationService.getValue('window');
            const openFolderInNewWindowConfig = (windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFoldersInNewWindow) || 'default' /* default */;
            const openFilesInNewWindowConfig = (windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFilesInNewWindow) || 'off' /* default */;
            let openFolderInNewWindow = (openConfig.preferNewWindow || openConfig.forceNewWindow) && !openConfig.forceReuseWindow;
            if (!openConfig.forceNewWindow && !openConfig.forceReuseWindow && (openFolderInNewWindowConfig === 'on' || openFolderInNewWindowConfig === 'off')) {
                openFolderInNewWindow = (openFolderInNewWindowConfig === 'on');
            }
            // let the user settings override how files are open in a new window or same window unless we are forced (not for extension development though)
            let openFilesInNewWindow = false;
            if (openConfig.forceNewWindow || openConfig.forceReuseWindow) {
                openFilesInNewWindow = !!openConfig.forceNewWindow && !openConfig.forceReuseWindow;
            }
            else {
                // macOS: by default we open files in a new window if this is triggered via DOCK context
                if (platform_1.isMacintosh) {
                    if (openConfig.context === 1 /* OpenContext.DOCK */) {
                        openFilesInNewWindow = true;
                    }
                }
                // Linux/Windows: by default we open files in the new window unless triggered via DIALOG / MENU context
                // or from the integrated terminal where we assume the user prefers to open in the current window
                else {
                    if (openConfig.context !== 3 /* OpenContext.DIALOG */ && openConfig.context !== 2 /* OpenContext.MENU */ && !(openConfig.userEnv && openConfig.userEnv['TERM_PROGRAM'] === 'vscode')) {
                        openFilesInNewWindow = true;
                    }
                }
                // finally check for overrides of default
                if (!openConfig.cli.extensionDevelopmentPath && (openFilesInNewWindowConfig === 'on' || openFilesInNewWindowConfig === 'off')) {
                    openFilesInNewWindow = (openFilesInNewWindowConfig === 'on');
                }
            }
            return { openFolderInNewWindow: !!openFolderInNewWindow, openFilesInNewWindow };
        }
        openExtensionDevelopmentHostWindow(extensionDevelopmentPaths, openConfig) {
            // Reload an existing extension development host window on the same path
            // We currently do not allow more than one extension development window
            // on the same extension path.
            const existingWindow = (0, windowsFinder_1.findWindowOnExtensionDevelopmentPath)(this.getWindows(), extensionDevelopmentPaths);
            if (existingWindow) {
                this.lifecycleMainService.reload(existingWindow, openConfig.cli);
                existingWindow.focus(); // make sure it gets focus and is restored
                return [existingWindow];
            }
            let folderUris = openConfig.cli['folder-uri'] || [];
            let fileUris = openConfig.cli['file-uri'] || [];
            let cliArgs = openConfig.cli._;
            // Fill in previously opened workspace unless an explicit path is provided and we are not unit testing
            if (!cliArgs.length && !folderUris.length && !fileUris.length && !openConfig.cli.extensionTestsPath) {
                const extensionDevelopmentWindowState = this.windowsStateHandler.state.lastPluginDevelopmentHostWindow;
                const workspaceToOpen = extensionDevelopmentWindowState && (extensionDevelopmentWindowState.workspace || extensionDevelopmentWindowState.folderUri);
                if (workspaceToOpen) {
                    if (uri_1.URI.isUri(workspaceToOpen)) {
                        if (workspaceToOpen.scheme === network_1.Schemas.file) {
                            cliArgs = [workspaceToOpen.fsPath];
                        }
                        else {
                            folderUris = [workspaceToOpen.toString()];
                        }
                    }
                    else {
                        if (workspaceToOpen.configPath.scheme === network_1.Schemas.file) {
                            cliArgs = [(0, resources_1.originalFSPath)(workspaceToOpen.configPath)];
                        }
                        else {
                            fileUris = [workspaceToOpen.configPath.toString()];
                        }
                    }
                }
            }
            let remoteAuthority = openConfig.remoteAuthority;
            for (const extensionDevelopmentPath of extensionDevelopmentPaths) {
                if (extensionDevelopmentPath.match(/^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/)) {
                    const url = uri_1.URI.parse(extensionDevelopmentPath);
                    const extensionDevelopmentPathRemoteAuthority = (0, remoteHosts_1.getRemoteAuthority)(url);
                    if (extensionDevelopmentPathRemoteAuthority) {
                        if (remoteAuthority) {
                            if (!(0, resources_1.isEqualAuthority)(extensionDevelopmentPathRemoteAuthority, remoteAuthority)) {
                                this.logService.error('more than one extension development path authority');
                            }
                        }
                        else {
                            remoteAuthority = extensionDevelopmentPathRemoteAuthority;
                        }
                    }
                }
            }
            // Make sure that we do not try to open:
            // - a workspace or folder that is already opened
            // - a workspace or file that has a different authority as the extension development.
            cliArgs = cliArgs.filter(path => {
                const uri = uri_1.URI.file(path);
                if (!!(0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), uri)) {
                    return false;
                }
                return (0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(uri), remoteAuthority);
            });
            folderUris = folderUris.filter(folderUriStr => {
                const folderUri = this.cliArgToUri(folderUriStr);
                if (folderUri && !!(0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), folderUri)) {
                    return false;
                }
                return folderUri ? (0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(folderUri), remoteAuthority) : false;
            });
            fileUris = fileUris.filter(fileUriStr => {
                const fileUri = this.cliArgToUri(fileUriStr);
                if (fileUri && !!(0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), fileUri)) {
                    return false;
                }
                return fileUri ? (0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(fileUri), remoteAuthority) : false;
            });
            openConfig.cli._ = cliArgs;
            openConfig.cli['folder-uri'] = folderUris;
            openConfig.cli['file-uri'] = fileUris;
            const noFilesOrFolders = !cliArgs.length && !folderUris.length && !fileUris.length;
            // Open it
            const openArgs = {
                context: openConfig.context,
                cli: openConfig.cli,
                forceNewWindow: true,
                forceEmpty: noFilesOrFolders,
                userEnv: openConfig.userEnv,
                noRecentEntry: true,
                waitMarkerFileURI: openConfig.waitMarkerFileURI,
                remoteAuthority
            };
            return this.open(openArgs);
        }
        openInBrowserWindow(options) {
            var _a, _b, _c, _d, _e, _f;
            const windowConfig = this.configurationService.getValue('window');
            // Build up the window configuration from provided options, config and environment
            const configuration = Object.assign(Object.assign(Object.assign({}, this.environmentMainService.args), options.cli), { machineId: this.machineId, windowId: -1, mainPid: process.pid, appRoot: this.environmentMainService.appRoot, execPath: process.execPath, codeCachePath: this.environmentMainService.codeCachePath, 
                // If we know the backup folder upfront (for empty windows to restore), we can set it
                // directly here which helps for restoring UI state associated with that window.
                // For all other cases we first call into registerEmptyWindowBackupSync() to set it before
                // loading the window.
                backupPath: options.emptyWindowBackupInfo ? (0, path_1.join)(this.environmentMainService.backupHome, options.emptyWindowBackupInfo.backupFolder) : undefined, homeDir: this.environmentMainService.userHome.fsPath, tmpDir: this.environmentMainService.tmpDir.fsPath, userDataDir: this.environmentMainService.userDataPath, remoteAuthority: options.remoteAuthority, workspace: options.workspace, userEnv: Object.assign(Object.assign({}, this.initialUserEnv), options.userEnv), filesToOpenOrCreate: (_a = options.filesToOpen) === null || _a === void 0 ? void 0 : _a.filesToOpenOrCreate, filesToDiff: (_b = options.filesToOpen) === null || _b === void 0 ? void 0 : _b.filesToDiff, filesToWait: (_c = options.filesToOpen) === null || _c === void 0 ? void 0 : _c.filesToWait, logLevel: this.logService.getLevel(), logsPath: this.environmentMainService.logsPath, product: product_1.default, isInitialStartup: options.initialStartup, perfMarks: (0, performance_1.getMarks)(), os: { release: (0, os_1.release)(), hostname: (0, os_1.hostname)() }, zoomLevel: typeof (windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.zoomLevel) === 'number' ? windowConfig.zoomLevel : undefined, autoDetectHighContrast: (_d = windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.autoDetectHighContrast) !== null && _d !== void 0 ? _d : true, autoDetectColorScheme: (_e = windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.autoDetectColorScheme) !== null && _e !== void 0 ? _e : false, accessibilitySupport: electron_1.app.accessibilitySupportEnabled, colorScheme: this.themeMainService.getColorScheme() });
            let window;
            if (!options.forceNewWindow && !options.forceNewTabbedWindow) {
                window = options.windowToUse || this.getLastActiveWindow();
                if (window) {
                    window.focus();
                }
            }
            // New window
            if (!window) {
                const state = this.windowsStateHandler.getNewWindowState(configuration);
                // Create the window
                (0, performance_1.mark)('code/willCreateCodeWindow');
                const createdWindow = window = this.instantiationService.createInstance(window_2.CodeWindow, {
                    state,
                    extensionDevelopmentPath: configuration.extensionDevelopmentPath,
                    isExtensionTestHost: !!configuration.extensionTestsPath
                });
                (0, performance_1.mark)('code/didCreateCodeWindow');
                // Add as window tab if configured (macOS only)
                if (options.forceNewTabbedWindow) {
                    const activeWindow = this.getLastActiveWindow();
                    if (activeWindow) {
                        activeWindow.addTabbedWindow(createdWindow);
                    }
                }
                // Add to our list of windows
                WindowsMainService.WINDOWS.push(createdWindow);
                // Indicate new window via event
                this._onDidOpenWindow.fire(createdWindow);
                // Indicate number change via event
                this._onDidChangeWindowsCount.fire({ oldCount: this.getWindowCount() - 1, newCount: this.getWindowCount() });
                // Window Events
                (0, functional_1.once)(createdWindow.onDidSignalReady)(() => this._onDidSignalReadyWindow.fire(createdWindow));
                (0, functional_1.once)(createdWindow.onDidClose)(() => this.onWindowClosed(createdWindow));
                (0, functional_1.once)(createdWindow.onDidDestroy)(() => this._onDidDestroyWindow.fire(createdWindow));
                const webContents = (0, types_1.assertIsDefined)((_f = createdWindow.win) === null || _f === void 0 ? void 0 : _f.webContents);
                webContents.removeAllListeners('devtools-reload-page'); // remove built in listener so we can handle this on our own
                webContents.on('devtools-reload-page', () => this.lifecycleMainService.reload(createdWindow));
                // Lifecycle
                this.lifecycleMainService.registerWindow(createdWindow);
            }
            // Existing window
            else {
                // Some configuration things get inherited if the window is being reused and we are
                // in extension development host mode. These options are all development related.
                const currentWindowConfig = window.config;
                if (!configuration.extensionDevelopmentPath && currentWindowConfig && !!currentWindowConfig.extensionDevelopmentPath) {
                    configuration.extensionDevelopmentPath = currentWindowConfig.extensionDevelopmentPath;
                    configuration.verbose = currentWindowConfig.verbose;
                    configuration['inspect-brk-extensions'] = currentWindowConfig['inspect-brk-extensions'];
                    configuration.debugId = currentWindowConfig.debugId;
                    configuration.extensionEnvironment = currentWindowConfig.extensionEnvironment;
                    configuration['inspect-extensions'] = currentWindowConfig['inspect-extensions'];
                    configuration['extensions-dir'] = currentWindowConfig['extensions-dir'];
                }
            }
            // Update window identifier and session now
            // that we have the window object in hand.
            configuration.windowId = window.id;
            // If the window was already loaded, make sure to unload it
            // first and only load the new configuration if that was
            // not vetoed
            if (window.isReady) {
                this.lifecycleMainService.unload(window, 4 /* UnloadReason.LOAD */).then(veto => {
                    if (!veto) {
                        this.doOpenInBrowserWindow(window, configuration, options);
                    }
                });
            }
            else {
                this.doOpenInBrowserWindow(window, configuration, options);
            }
            return window;
        }
        doOpenInBrowserWindow(window, configuration, options) {
            // Register window for backups
            if (!configuration.extensionDevelopmentPath) {
                if ((0, workspace_1.isWorkspaceIdentifier)(configuration.workspace)) {
                    configuration.backupPath = this.backupMainService.registerWorkspaceBackupSync({ workspace: configuration.workspace, remoteAuthority: configuration.remoteAuthority });
                }
                else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(configuration.workspace)) {
                    configuration.backupPath = this.backupMainService.registerFolderBackupSync({ folderUri: configuration.workspace.uri, remoteAuthority: configuration.remoteAuthority });
                }
                else {
                    const backupFolder = options.emptyWindowBackupInfo && options.emptyWindowBackupInfo.backupFolder;
                    configuration.backupPath = this.backupMainService.registerEmptyWindowBackupSync(backupFolder, configuration.remoteAuthority);
                }
            }
            // Load it
            window.load(configuration);
        }
        onWindowClosed(window) {
            // Remove from our list so that Electron can clean it up
            const index = WindowsMainService.WINDOWS.indexOf(window);
            WindowsMainService.WINDOWS.splice(index, 1);
            // Emit
            this._onDidChangeWindowsCount.fire({ oldCount: this.getWindowCount() + 1, newCount: this.getWindowCount() });
        }
        getFocusedWindow() {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window) {
                return this.getWindowById(window.id);
            }
            return undefined;
        }
        getLastActiveWindow() {
            return this.doGetLastActiveWindow(this.getWindows());
        }
        getLastActiveWindowForAuthority(remoteAuthority) {
            return this.doGetLastActiveWindow(this.getWindows().filter(window => (0, resources_1.isEqualAuthority)(window.remoteAuthority, remoteAuthority)));
        }
        doGetLastActiveWindow(windows) {
            const lastFocusedDate = Math.max.apply(Math, windows.map(window => window.lastFocusTime));
            return windows.find(window => window.lastFocusTime === lastFocusedDate);
        }
        sendToFocused(channel, ...args) {
            const focusedWindow = this.getFocusedWindow() || this.getLastActiveWindow();
            if (focusedWindow) {
                focusedWindow.sendWhenReady(channel, cancellation_1.CancellationToken.None, ...args);
            }
        }
        sendToAll(channel, payload, windowIdsToIgnore) {
            for (const window of this.getWindows()) {
                if (windowIdsToIgnore && windowIdsToIgnore.indexOf(window.id) >= 0) {
                    continue; // do not send if we are instructed to ignore it
                }
                window.sendWhenReady(channel, cancellation_1.CancellationToken.None, payload);
            }
        }
        getWindows() {
            return WindowsMainService.WINDOWS;
        }
        getWindowCount() {
            return WindowsMainService.WINDOWS.length;
        }
        getWindowById(windowId) {
            const windows = this.getWindows().filter(window => window.id === windowId);
            return (0, arrays_1.firstOrDefault)(windows);
        }
        getWindowByWebContents(webContents) {
            const browserWindow = electron_1.BrowserWindow.fromWebContents(webContents);
            if (!browserWindow) {
                return undefined;
            }
            return this.getWindowById(browserWindow.id);
        }
    };
    WindowsMainService.WINDOWS = [];
    WindowsMainService = __decorate([
        __param(2, log_1.ILogService),
        __param(3, state_1.IStateMainService),
        __param(4, environmentMainService_1.IEnvironmentMainService),
        __param(5, lifecycleMainService_1.ILifecycleMainService),
        __param(6, backup_1.IBackupMainService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
        __param(9, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, dialogMainService_1.IDialogMainService),
        __param(12, files_1.IFileService),
        __param(13, productService_1.IProductService),
        __param(14, protocol_1.IProtocolMainService),
        __param(15, themeMainService_1.IThemeMainService)
    ], WindowsMainService);
    exports.WindowsMainService = WindowsMainService;
});
//# sourceMappingURL=windowsMainService.js.map