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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/objects", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/platform/window/common/window", "vs/workbench/services/title/common/titleService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/window/electron-sandbox/window", "vs/base/browser/browser", "vs/platform/commands/common/commands", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/integrity/common/integrity", "vs/base/common/platform", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/accessibility/common/accessibility", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/native/electron-sandbox/native", "vs/base/common/path", "vs/base/common/labels", "vs/platform/tunnel/common/tunnel", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/event", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/dialogs/common/dialogs", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/editor", "vs/platform/ipc/electron-sandbox/services", "vs/platform/progress/common/progress", "vs/base/common/errorMessage", "vs/platform/driver/electron-sandbox/driver"], function (require, exports, nls_1, uri_1, errors_1, objects_1, dom_1, actions_1, files_1, editor_1, editorService_1, telemetry_1, window_1, titleService_1, workbenchThemeService_1, window_2, browser_1, commands_1, globals_1, workspaceEditing_1, actions_2, menuEntryActionViewItem_1, async_1, lifecycle_1, lifecycle_2, integrity_1, platform_1, productService_1, notification_1, keybinding_1, environmentService_1, accessibility_1, workspace_1, arrays_1, configuration_1, storage_1, types_1, opener_1, network_1, native_1, path_1, labels_1, tunnel_1, layoutService_1, workingCopyService_1, filesConfigurationService_1, event_1, remoteAuthorityResolver_1, editorGroupsService_1, dialogs_1, log_1, instantiation_1, editor_2, services_1, progress_1, errorMessage_1, driver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWindow = void 0;
    let NativeWindow = class NativeWindow extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupService, configurationService, titleService, themeService, notificationService, commandService, keybindingService, telemetryService, workspaceEditingService, fileService, menuService, lifecycleService, integrityService, environmentService, accessibilityService, contextService, openerService, nativeHostService, tunnelService, layoutService, workingCopyService, filesConfigurationService, productService, remoteAuthorityResolverService, dialogService, storageService, logService, instantiationService, sharedProcessService, progressService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.titleService = titleService;
            this.themeService = themeService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.telemetryService = telemetryService;
            this.workspaceEditingService = workspaceEditingService;
            this.fileService = fileService;
            this.menuService = menuService;
            this.lifecycleService = lifecycleService;
            this.integrityService = integrityService;
            this.environmentService = environmentService;
            this.accessibilityService = accessibilityService;
            this.contextService = contextService;
            this.openerService = openerService;
            this.nativeHostService = nativeHostService;
            this.tunnelService = tunnelService;
            this.layoutService = layoutService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.productService = productService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.dialogService = dialogService;
            this.storageService = storageService;
            this.logService = logService;
            this.instantiationService = instantiationService;
            this.sharedProcessService = sharedProcessService;
            this.progressService = progressService;
            this.touchBarDisposables = this._register(new lifecycle_1.DisposableStore());
            this.customTitleContextMenuDisposable = this._register(new lifecycle_1.DisposableStore());
            this.addFoldersScheduler = this._register(new async_1.RunOnceScheduler(() => this.doAddFolders(), 100));
            this.pendingFoldersToAdd = [];
            this.closeEmptyWindowScheduler = this._register(new async_1.RunOnceScheduler(() => this.onDidAllEditorsClose(), 50));
            this.isDocumentedEdited = false;
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            var _a;
            // Layout
            this._register((0, dom_1.addDisposableListener)(window, dom_1.EventType.RESIZE, e => this.onWindowResize(e, true)));
            // React to editor input changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateTouchbarMenu()));
            // prevent opening a real URL inside the window
            for (const event of [dom_1.EventType.DRAG_OVER, dom_1.EventType.DROP]) {
                window.document.body.addEventListener(event, (e) => {
                    dom_1.EventHelper.stop(e);
                });
            }
            // Support runAction event
            globals_1.ipcRenderer.on('vscode:runAction', async (event, request) => {
                const args = request.args || [];
                // If we run an action from the touchbar, we fill in the currently active resource
                // as payload because the touch bar items are context aware depending on the editor
                if (request.from === 'touchbar') {
                    const activeEditor = this.editorService.activeEditor;
                    if (activeEditor) {
                        const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                        if (resource) {
                            args.push(resource);
                        }
                    }
                }
                else {
                    args.push({ from: request.from });
                }
                try {
                    await this.commandService.executeCommand(request.id, ...args);
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: request.id, from: request.from });
                }
                catch (error) {
                    this.notificationService.error(error);
                }
            });
            // Support runKeybinding event
            globals_1.ipcRenderer.on('vscode:runKeybinding', (event, request) => {
                if (document.activeElement) {
                    this.keybindingService.dispatchByUserSettingsLabel(request.userSettingsLabel, document.activeElement);
                }
            });
            // Error reporting from main
            globals_1.ipcRenderer.on('vscode:reportError', (event, error) => {
                if (error) {
                    (0, errors_1.onUnexpectedError)(JSON.parse(error));
                }
            });
            // Support openFiles event for existing and new files
            globals_1.ipcRenderer.on('vscode:openFiles', (event, request) => this.onOpenFiles(request));
            // Support addFolders event if we have a workspace opened
            globals_1.ipcRenderer.on('vscode:addFolders', (event, request) => this.onAddFoldersRequest(request));
            // Message support
            globals_1.ipcRenderer.on('vscode:showInfoMessage', (event, message) => this.notificationService.info(message));
            // Shell Environment Issue Notifications
            globals_1.ipcRenderer.on('vscode:showResolveShellEnvError', (event, message) => this.notificationService.prompt(notification_1.Severity.Error, message, [{
                    label: (0, nls_1.localize)('learnMore', "Learn More"),
                    run: () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2149667')
                }]));
            globals_1.ipcRenderer.on('vscode:showCredentialsError', (event, message) => this.notificationService.prompt(notification_1.Severity.Error, (0, nls_1.localize)('keychainWriteError', "Writing login information to the keychain failed with error '{0}'.", message), [{
                    label: (0, nls_1.localize)('troubleshooting', "Troubleshooting Guide"),
                    run: () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2190713')
                }]));
            // Fullscreen Events
            globals_1.ipcRenderer.on('vscode:enterFullScreen', async () => (0, browser_1.setFullscreen)(true));
            globals_1.ipcRenderer.on('vscode:leaveFullScreen', async () => (0, browser_1.setFullscreen)(false));
            // Proxy Login Dialog
            globals_1.ipcRenderer.on('vscode:openProxyAuthenticationDialog', async (event, payload) => {
                const rememberCredentials = this.storageService.getBoolean(NativeWindow.REMEMBER_PROXY_CREDENTIALS_KEY, 0 /* StorageScope.GLOBAL */);
                const result = await this.dialogService.input(notification_1.Severity.Warning, (0, nls_1.localize)('proxyAuthRequired', "Proxy Authentication Required"), [
                    (0, nls_1.localize)({ key: 'loginButton', comment: ['&& denotes a mnemonic'] }, "&&Log In"),
                    (0, nls_1.localize)({ key: 'cancelButton', comment: ['&& denotes a mnemonic'] }, "&&Cancel")
                ], [
                    { placeholder: (0, nls_1.localize)('username', "Username"), value: payload.username },
                    { placeholder: (0, nls_1.localize)('password', "Password"), type: 'password', value: payload.password }
                ], {
                    cancelId: 1,
                    detail: (0, nls_1.localize)('proxyDetail', "The proxy {0} requires a username and password.", `${payload.authInfo.host}:${payload.authInfo.port}`),
                    checkbox: {
                        label: (0, nls_1.localize)('rememberCredentials', "Remember my credentials"),
                        checked: rememberCredentials
                    }
                });
                // Reply back to the channel without result to indicate
                // that the login dialog was cancelled
                if (result.choice !== 0 || !result.values) {
                    globals_1.ipcRenderer.send(payload.replyChannel);
                }
                // Other reply back with the picked credentials
                else {
                    // Update state based on checkbox
                    if (result.checkboxChecked) {
                        this.storageService.store(NativeWindow.REMEMBER_PROXY_CREDENTIALS_KEY, true, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                    }
                    else {
                        this.storageService.remove(NativeWindow.REMEMBER_PROXY_CREDENTIALS_KEY, 0 /* StorageScope.GLOBAL */);
                    }
                    // Reply back to main side with credentials
                    const [username, password] = result.values;
                    globals_1.ipcRenderer.send(payload.replyChannel, { username, password, remember: !!result.checkboxChecked });
                }
            });
            // Accessibility support changed event
            globals_1.ipcRenderer.on('vscode:accessibilitySupportChanged', (event, accessibilitySupportEnabled) => {
                this.accessibilityService.setAccessibilitySupport(accessibilitySupportEnabled ? 2 /* AccessibilitySupport.Enabled */ : 1 /* AccessibilitySupport.Disabled */);
            });
            // Zoom level changes
            this.updateWindowZoomLevel();
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.zoomLevel')) {
                    this.updateWindowZoomLevel();
                }
                else if (e.affectsConfiguration('keyboard.touchbar.enabled') || e.affectsConfiguration('keyboard.touchbar.ignored')) {
                    this.updateTouchbarMenu();
                }
            }));
            // Listen to visible editor changes
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.onDidChangeVisibleEditors()));
            // Listen to editor closing (if we run with --wait)
            const filesToWait = this.environmentService.filesToWait;
            if (filesToWait) {
                this.trackClosedWaitFiles(filesToWait.waitMarkerFileUri, (0, arrays_1.coalesce)(filesToWait.paths.map(path => path.fileUri)));
            }
            // macOS OS integration
            if (platform_1.isMacintosh) {
                this._register(this.editorService.onDidActiveEditorChange(() => {
                    const file = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: network_1.Schemas.file });
                    // Represented Filename
                    this.updateRepresentedFilename(file === null || file === void 0 ? void 0 : file.fsPath);
                    // Custom title menu
                    this.provideCustomTitleContextMenu(file === null || file === void 0 ? void 0 : file.fsPath);
                }));
            }
            // Maximize/Restore on doubleclick (for macOS custom title)
            if (platform_1.isMacintosh && (0, window_1.getTitleBarStyle)(this.configurationService) === 'custom') {
                const titlePart = (0, types_1.assertIsDefined)(this.layoutService.getContainer("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */));
                this._register((0, dom_1.addDisposableListener)(titlePart, dom_1.EventType.DBLCLICK, e => {
                    dom_1.EventHelper.stop(e);
                    this.nativeHostService.handleTitleDoubleClick();
                }));
            }
            // Document edited: indicate for dirty working copies
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => {
                const gotDirty = workingCopy.isDirty();
                if (gotDirty && !(workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) && this.filesConfigurationService.getAutoSaveMode() === 1 /* AutoSaveMode.AFTER_SHORT_DELAY */) {
                    return; // do not indicate dirty of working copies that are auto saved after short delay
                }
                this.updateDocumentEdited(gotDirty);
            }));
            this.updateDocumentEdited();
            // Detect minimize / maximize
            this._register(event_1.Event.any(event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidMaximizeWindow, id => id === this.nativeHostService.windowId), () => true), event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidUnmaximizeWindow, id => id === this.nativeHostService.windowId), () => false))(e => this.onDidChangeWindowMaximized(e)));
            this.onDidChangeWindowMaximized((_a = this.environmentService.window.maximized) !== null && _a !== void 0 ? _a : false);
            // Detect panel position to determine minimum width
            this._register(this.layoutService.onDidChangePanelPosition(pos => this.onDidChangePanelPosition((0, layoutService_1.positionFromString)(pos))));
            this.onDidChangePanelPosition(this.layoutService.getPanelPosition());
            // Lifecycle
            this._register(this.lifecycleService.onBeforeShutdown(e => this.onBeforeShutdown(e)));
            this._register(this.lifecycleService.onBeforeShutdownError(e => this.onBeforeShutdownError(e)));
            this._register(this.lifecycleService.onWillShutdown(e => this.onWillShutdown(e)));
        }
        onBeforeShutdown({ veto, reason }) {
            if (reason === 1 /* ShutdownReason.CLOSE */) {
                const confirmBeforeCloseSetting = this.configurationService.getValue('window.confirmBeforeClose');
                const confirmBeforeClose = confirmBeforeCloseSetting === 'always' || (confirmBeforeCloseSetting === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed);
                if (confirmBeforeClose) {
                    // When we need to confirm on close or quit, veto the shutdown
                    // with a long running promise to figure out whether shutdown
                    // can proceed or not.
                    return veto((async () => {
                        let actualReason = reason;
                        if (reason === 1 /* ShutdownReason.CLOSE */ && !platform_1.isMacintosh) {
                            const windowCount = await this.nativeHostService.getWindowCount();
                            if (windowCount === 1) {
                                actualReason = 2 /* ShutdownReason.QUIT */; // Windows/Linux: closing last window means to QUIT
                            }
                        }
                        let confirmed = true;
                        if (confirmBeforeClose) {
                            confirmed = await this.instantiationService.invokeFunction(accessor => NativeWindow.confirmOnShutdown(accessor, actualReason));
                        }
                        // Progress for long running shutdown
                        if (confirmed) {
                            this.progressOnBeforeShutdown(reason);
                        }
                        return !confirmed;
                    })(), 'veto.confirmBeforeClose');
                }
            }
            // Progress for long running shutdown
            this.progressOnBeforeShutdown(reason);
        }
        progressOnBeforeShutdown(reason) {
            this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                title: this.toShutdownLabel(reason, false),
            }, () => {
                return event_1.Event.toPromise(event_1.Event.any(this.lifecycleService.onWillShutdown, // dismiss this dialog when we shutdown
                this.lifecycleService.onShutdownVeto, // or when shutdown was vetoed
                this.dialogService.onWillShowDialog // or when a dialog asks for input
                ));
            });
        }
        static async confirmOnShutdown(accessor, reason) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const message = reason === 2 /* ShutdownReason.QUIT */ ?
                (platform_1.isMacintosh ? (0, nls_1.localize)('quitMessageMac', "Are you sure you want to quit?") : (0, nls_1.localize)('quitMessage', "Are you sure you want to exit?")) :
                (0, nls_1.localize)('closeWindowMessage', "Are you sure you want to close the window?");
            const primaryButton = reason === 2 /* ShutdownReason.QUIT */ ?
                (platform_1.isMacintosh ? (0, nls_1.localize)({ key: 'quitButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Quit") : (0, nls_1.localize)({ key: 'exitButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Exit")) :
                (0, nls_1.localize)({ key: 'closeWindowButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Close Window");
            const res = await dialogService.confirm({
                type: 'question',
                message,
                primaryButton,
                checkbox: {
                    label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                }
            });
            // Update setting if checkbox checked
            if (res.checkboxChecked) {
                await configurationService.updateValue('window.confirmBeforeClose', 'never');
            }
            return res.confirmed;
        }
        onBeforeShutdownError({ error, reason }) {
            this.dialogService.show(notification_1.Severity.Error, this.toShutdownLabel(reason, true), undefined, {
                detail: (0, nls_1.localize)('shutdownErrorDetail', "Error: {0}", (0, errorMessage_1.toErrorMessage)(error))
            });
        }
        onWillShutdown({ reason, force, joiners }) {
            // Delay so that the dialog only appears after timeout
            const shutdownDialogScheduler = new async_1.RunOnceScheduler(() => {
                const pendingJoiners = joiners();
                this.progressService.withProgress({
                    location: 20 /* ProgressLocation.Dialog */,
                    buttons: [this.toForceShutdownLabel(reason)],
                    cancellable: false,
                    sticky: true,
                    title: this.toShutdownLabel(reason, false),
                    detail: pendingJoiners.length > 0 ? (0, nls_1.localize)('willShutdownDetail', "The following operations are still running: \n{0}", pendingJoiners.map(joiner => `- ${joiner.label}`).join('\n')) : undefined
                }, () => {
                    return event_1.Event.toPromise(this.lifecycleService.onDidShutdown); // dismiss this dialog when we actually shutdown
                }, () => {
                    force();
                });
            }, 1200);
            shutdownDialogScheduler.schedule();
            // Dispose scheduler when we actually shutdown
            event_1.Event.once(this.lifecycleService.onDidShutdown)(() => shutdownDialogScheduler.dispose());
        }
        toShutdownLabel(reason, isError) {
            if (isError) {
                switch (reason) {
                    case 1 /* ShutdownReason.CLOSE */:
                        return (0, nls_1.localize)('shutdownErrorClose', "An unexpected error prevented the window to close");
                    case 2 /* ShutdownReason.QUIT */:
                        return (0, nls_1.localize)('shutdownErrorQuit', "An unexpected error prevented the application to quit");
                    case 3 /* ShutdownReason.RELOAD */:
                        return (0, nls_1.localize)('shutdownErrorReload', "An unexpected error prevented the window to reload");
                    case 4 /* ShutdownReason.LOAD */:
                        return (0, nls_1.localize)('shutdownErrorLoad', "An unexpected error prevented to change the workspace");
                }
            }
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    return (0, nls_1.localize)('shutdownTitleClose', "Closing the window is taking a bit longer...");
                case 2 /* ShutdownReason.QUIT */:
                    return (0, nls_1.localize)('shutdownTitleQuit', "Quitting the application is taking a bit longer...");
                case 3 /* ShutdownReason.RELOAD */:
                    return (0, nls_1.localize)('shutdownTitleReload', "Reloading the window is taking a bit longer...");
                case 4 /* ShutdownReason.LOAD */:
                    return (0, nls_1.localize)('shutdownTitleLoad', "Changing the workspace is taking a bit longer...");
            }
        }
        toForceShutdownLabel(reason) {
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    return (0, nls_1.localize)('shutdownForceClose', "Close Anyway");
                case 2 /* ShutdownReason.QUIT */:
                    return (0, nls_1.localize)('shutdownForceQuit', "Quit Anyway");
                case 3 /* ShutdownReason.RELOAD */:
                    return (0, nls_1.localize)('shutdownForceReload', "Reload Anyway");
                case 4 /* ShutdownReason.LOAD */:
                    return (0, nls_1.localize)('shutdownForceLoad', "Change Anyway");
            }
        }
        onWindowResize(e, retry) {
            if (e.target === window) {
                if (window.document && window.document.body && window.document.body.clientWidth === 0) {
                    // TODO@electron this is an electron issue on macOS when simple fullscreen is enabled
                    // where for some reason the window clientWidth is reported as 0 when switching
                    // between simple fullscreen and normal screen. In that case we schedule the layout
                    // call at the next animation frame once, in the hope that the dimensions are
                    // proper then.
                    if (retry) {
                        (0, dom_1.scheduleAtNextAnimationFrame)(() => this.onWindowResize(e, false));
                    }
                    return;
                }
                this.layoutService.layout();
            }
        }
        updateDocumentEdited(isDirty = this.workingCopyService.hasDirty) {
            if ((!this.isDocumentedEdited && isDirty) || (this.isDocumentedEdited && !isDirty)) {
                this.isDocumentedEdited = isDirty;
                this.nativeHostService.setDocumentEdited(isDirty);
            }
        }
        onDidChangeWindowMaximized(maximized) {
            this.layoutService.updateWindowMaximizedState(maximized);
        }
        getWindowMinimumWidth(panelPosition = this.layoutService.getPanelPosition()) {
            // if panel is on the side, then return the larger minwidth
            const panelOnSide = panelPosition === 0 /* Position.LEFT */ || panelPosition === 1 /* Position.RIGHT */;
            if (panelOnSide) {
                return window_1.WindowMinimumSize.WIDTH_WITH_VERTICAL_PANEL;
            }
            return window_1.WindowMinimumSize.WIDTH;
        }
        onDidChangePanelPosition(pos) {
            const minWidth = this.getWindowMinimumWidth(pos);
            this.nativeHostService.setMinimumSize(minWidth, undefined);
        }
        onDidChangeVisibleEditors() {
            // Close when empty: check if we should close the window based on the setting
            // Overruled by: window has a workspace opened or this window is for extension development
            // or setting is disabled. Also enabled when running with --wait from the command line.
            const visibleEditorPanes = this.editorService.visibleEditorPanes;
            if (visibleEditorPanes.length === 0 && this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && !this.environmentService.isExtensionDevelopment) {
                const closeWhenEmpty = this.configurationService.getValue('window.closeWhenEmpty');
                if (closeWhenEmpty || this.environmentService.args.wait) {
                    this.closeEmptyWindowScheduler.schedule();
                }
            }
        }
        onDidAllEditorsClose() {
            const visibleEditorPanes = this.editorService.visibleEditorPanes.length;
            if (visibleEditorPanes === 0) {
                this.nativeHostService.closeWindow();
            }
        }
        updateWindowZoomLevel() {
            const windowConfig = this.configurationService.getValue();
            let configuredZoomLevel = 0;
            if (windowConfig.window && typeof windowConfig.window.zoomLevel === 'number') {
                configuredZoomLevel = windowConfig.window.zoomLevel;
                // Leave early if the configured zoom level did not change (https://github.com/microsoft/vscode/issues/1536)
                if (this.previousConfiguredZoomLevel === configuredZoomLevel) {
                    return;
                }
                this.previousConfiguredZoomLevel = configuredZoomLevel;
            }
            if ((0, browser_1.getZoomLevel)() !== configuredZoomLevel) {
                (0, window_2.applyZoom)(configuredZoomLevel);
            }
        }
        updateRepresentedFilename(filePath) {
            this.nativeHostService.setRepresentedFilename(filePath ? filePath : '');
        }
        provideCustomTitleContextMenu(filePath) {
            // Clear old menu
            this.customTitleContextMenuDisposable.clear();
            // Provide new menu if a file is opened and we are on a custom title
            if (!filePath || (0, window_1.getTitleBarStyle)(this.configurationService) !== 'custom') {
                return;
            }
            // Split up filepath into segments
            const segments = filePath.split(path_1.posix.sep);
            for (let i = segments.length; i > 0; i--) {
                const isFile = (i === segments.length);
                let pathOffset = i;
                if (!isFile) {
                    pathOffset++; // for segments which are not the file name we want to open the folder
                }
                const path = segments.slice(0, pathOffset).join(path_1.posix.sep);
                let label;
                if (!isFile) {
                    label = (0, labels_1.getBaseLabel)((0, path_1.dirname)(path));
                }
                else {
                    label = (0, labels_1.getBaseLabel)(path);
                }
                const commandId = `workbench.action.revealPathInFinder${i}`;
                this.customTitleContextMenuDisposable.add(commands_1.CommandsRegistry.registerCommand(commandId, () => this.nativeHostService.showItemInFolder(path)));
                this.customTitleContextMenuDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TitleBarContext, { command: { id: commandId, title: label || path_1.posix.sep }, order: -i }));
            }
        }
        create() {
            // Handle open calls
            this.setupOpenHandlers();
            // Notify some services about lifecycle phases
            this.lifecycleService.when(2 /* LifecyclePhase.Ready */).then(() => this.nativeHostService.notifyReady());
            this.lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => this.sharedProcessService.notifyRestored());
            // Integrity warning
            this.integrityService.isPure().then(({ isPure }) => this.titleService.updateProperties({ isPure }));
            // Root warning
            this.lifecycleService.when(3 /* LifecyclePhase.Restored */).then(async () => {
                const isAdmin = await this.nativeHostService.isAdmin();
                // Update title
                this.titleService.updateProperties({ isAdmin });
                // Show warning message (unix only)
                if (isAdmin && !platform_1.isWindows) {
                    this.notificationService.warn((0, nls_1.localize)('runningAsRoot', "It is not recommended to run {0} as root user.", this.productService.nameShort));
                }
            });
            // Touchbar menu (if enabled)
            this.updateTouchbarMenu();
            // Check for cyclic dependencies
            if (require.hasDependencyCycle()) {
                if (platform_1.isCI) {
                    this.logService.error('Error: There is a dependency cycle in the AMD modules that needs to be resolved!');
                    this.nativeHostService.exit(37); // running on a build machine, just exit without showing a dialog
                }
                else {
                    this.dialogService.show(notification_1.Severity.Error, (0, nls_1.localize)('loaderCycle', "There is a dependency cycle in the AMD modules that needs to be resolved!"));
                    this.nativeHostService.openDevTools();
                }
            }
            // Smoke Test Driver
            if (this.environmentService.enableSmokeTestDriver) {
                this.setupDriver();
            }
        }
        setupDriver() {
            const that = this;
            (0, driver_1.registerWindowDriver)({
                async exitApplication() {
                    return that.nativeHostService.quit();
                }
            });
        }
        setupOpenHandlers() {
            // Block window.open() calls
            window.open = function () {
                throw new Error('Prevented call to window.open(). Use IOpenerService instead!');
            };
            // Handle external open() calls
            this.openerService.setDefaultExternalOpener({
                openExternal: async (href) => {
                    const success = await this.nativeHostService.openExternal(href);
                    if (!success) {
                        const fileCandidate = uri_1.URI.parse(href);
                        if (fileCandidate.scheme === network_1.Schemas.file) {
                            // if opening failed, and this is a file, we can still try to reveal it
                            await this.nativeHostService.showItemInFolder(fileCandidate.fsPath);
                        }
                    }
                    return true;
                }
            });
            // Register external URI resolver
            this.openerService.registerExternalUriResolver({
                resolveExternalUri: async (uri, options) => {
                    if (options === null || options === void 0 ? void 0 : options.allowTunneling) {
                        const portMappingRequest = (0, tunnel_1.extractLocalHostUriMetaDataForPortMapping)(uri);
                        if (portMappingRequest) {
                            const remoteAuthority = this.environmentService.remoteAuthority;
                            const addressProvider = remoteAuthority ? {
                                getAddress: async () => {
                                    return (await this.remoteAuthorityResolverService.resolveAuthority(remoteAuthority)).authority;
                                }
                            } : undefined;
                            const tunnel = await this.tunnelService.openTunnel(addressProvider, portMappingRequest.address, portMappingRequest.port);
                            if (tunnel) {
                                const addressAsUri = uri_1.URI.parse(tunnel.localAddress);
                                const resolved = addressAsUri.scheme.startsWith(uri.scheme) ? addressAsUri : uri.with({ authority: tunnel.localAddress });
                                return {
                                    resolved,
                                    dispose: () => tunnel.dispose(),
                                };
                            }
                        }
                    }
                    if (!(options === null || options === void 0 ? void 0 : options.openExternal)) {
                        const canHandleResource = await this.fileService.canHandleResource(uri);
                        if (canHandleResource) {
                            return {
                                resolved: uri_1.URI.from({
                                    scheme: this.productService.urlProtocol,
                                    path: 'workspace',
                                    query: uri.toString()
                                }),
                                dispose() { }
                            };
                        }
                    }
                    return undefined;
                }
            });
        }
        updateTouchbarMenu() {
            if (!platform_1.isMacintosh) {
                return; // macOS only
            }
            // Dispose old
            this.touchBarDisposables.clear();
            this.touchBarMenu = undefined;
            // Create new (delayed)
            const scheduler = this.touchBarDisposables.add(new async_1.RunOnceScheduler(() => this.doUpdateTouchbarMenu(scheduler), 300));
            scheduler.schedule();
        }
        doUpdateTouchbarMenu(scheduler) {
            var _a;
            if (!this.touchBarMenu) {
                const scopedContextKeyService = ((_a = this.editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.scopedContextKeyService) || this.editorGroupService.activeGroup.scopedContextKeyService;
                this.touchBarMenu = this.menuService.createMenu(actions_2.MenuId.TouchBarContext, scopedContextKeyService);
                this.touchBarDisposables.add(this.touchBarMenu);
                this.touchBarDisposables.add(this.touchBarMenu.onDidChange(() => scheduler.schedule()));
            }
            const actions = [];
            const disabled = this.configurationService.getValue('keyboard.touchbar.enabled') === false;
            const touchbarIgnored = this.configurationService.getValue('keyboard.touchbar.ignored');
            const ignoredItems = (0, types_1.isArray)(touchbarIgnored) ? touchbarIgnored : [];
            // Fill actions into groups respecting order
            this.touchBarDisposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.touchBarMenu, undefined, actions));
            // Convert into command action multi array
            const items = [];
            let group = [];
            if (!disabled) {
                for (const action of actions) {
                    // Command
                    if (action instanceof actions_2.MenuItemAction) {
                        if (ignoredItems.indexOf(action.item.id) >= 0) {
                            continue; // ignored
                        }
                        group.push(action.item);
                    }
                    // Separator
                    else if (action instanceof actions_1.Separator) {
                        if (group.length) {
                            items.push(group);
                        }
                        group = [];
                    }
                }
                if (group.length) {
                    items.push(group);
                }
            }
            // Only update if the actions have changed
            if (!(0, objects_1.equals)(this.lastInstalledTouchedBar, items)) {
                this.lastInstalledTouchedBar = items;
                this.nativeHostService.updateTouchBar(items);
            }
        }
        onAddFoldersRequest(request) {
            // Buffer all pending requests
            this.pendingFoldersToAdd.push(...request.foldersToAdd.map(folder => uri_1.URI.revive(folder)));
            // Delay the adding of folders a bit to buffer in case more requests are coming
            if (!this.addFoldersScheduler.isScheduled()) {
                this.addFoldersScheduler.schedule();
            }
        }
        doAddFolders() {
            const foldersToAdd = [];
            for (const folder of this.pendingFoldersToAdd) {
                foldersToAdd.push(({ uri: folder }));
            }
            this.pendingFoldersToAdd = [];
            this.workspaceEditingService.addFolders(foldersToAdd);
        }
        async onOpenFiles(request) {
            const inputs = [];
            const diffMode = !!(request.filesToDiff && (request.filesToDiff.length === 2));
            if (!diffMode && request.filesToOpenOrCreate) {
                inputs.push(...(await (0, editor_1.pathsToEditors)(request.filesToOpenOrCreate, this.fileService)));
            }
            if (diffMode && request.filesToDiff) {
                inputs.push(...(await (0, editor_1.pathsToEditors)(request.filesToDiff, this.fileService)));
            }
            if (inputs.length) {
                this.openResources(inputs, diffMode);
            }
            if (request.filesToWait && inputs.length) {
                // In wait mode, listen to changes to the editors and wait until the files
                // are closed that the user wants to wait for. When this happens we delete
                // the wait marker file to signal to the outside that editing is done.
                this.trackClosedWaitFiles(uri_1.URI.revive(request.filesToWait.waitMarkerFileUri), (0, arrays_1.coalesce)(request.filesToWait.paths.map(path => uri_1.URI.revive(path.fileUri))));
            }
        }
        async trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor) {
            // Wait for the resources to be closed in the text editor...
            await this.instantiationService.invokeFunction(accessor => (0, editor_2.whenEditorClosed)(accessor, resourcesToWaitFor));
            // ...before deleting the wait marker file
            await this.fileService.del(waitMarkerFile);
        }
        async openResources(resources, diffMode) {
            const editors = [];
            // In diffMode we open 2 resources as diff
            if (diffMode && resources.length === 2 && resources[0].resource && resources[1].resource) {
                const diffEditor = {
                    original: { resource: resources[0].resource },
                    modified: { resource: resources[1].resource },
                    options: { pinned: true }
                };
                editors.push(diffEditor);
            }
            else {
                editors.push(...resources);
            }
            // Open as editors
            return this.editorService.openEditors(editors, undefined, { validateTrust: true });
        }
    };
    NativeWindow.REMEMBER_PROXY_CREDENTIALS_KEY = 'window.rememberProxyCredentials';
    NativeWindow = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, titleService_1.ITitleService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, notification_1.INotificationService),
        __param(6, commands_1.ICommandService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, workspaceEditing_1.IWorkspaceEditingService),
        __param(10, files_1.IFileService),
        __param(11, actions_2.IMenuService),
        __param(12, lifecycle_2.ILifecycleService),
        __param(13, integrity_1.IIntegrityService),
        __param(14, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(15, accessibility_1.IAccessibilityService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, opener_1.IOpenerService),
        __param(18, native_1.INativeHostService),
        __param(19, tunnel_1.ITunnelService),
        __param(20, layoutService_1.IWorkbenchLayoutService),
        __param(21, workingCopyService_1.IWorkingCopyService),
        __param(22, filesConfigurationService_1.IFilesConfigurationService),
        __param(23, productService_1.IProductService),
        __param(24, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(25, dialogs_1.IDialogService),
        __param(26, storage_1.IStorageService),
        __param(27, log_1.ILogService),
        __param(28, instantiation_1.IInstantiationService),
        __param(29, services_1.ISharedProcessService),
        __param(30, progress_1.IProgressService)
    ], NativeWindow);
    exports.NativeWindow = NativeWindow;
});
//# sourceMappingURL=window.js.map