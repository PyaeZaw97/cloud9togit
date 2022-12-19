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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/window/common/window", "vs/workbench/common/editor", "vs/workbench/browser/editor", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/decorators", "vs/base/common/extpath", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/workspaces/browser/workspaces", "vs/nls", "vs/base/common/severity", "vs/platform/dialogs/common/dialogs", "vs/base/browser/event", "vs/base/common/types", "vs/platform/workspace/common/workspace", "vs/base/common/network"], function (require, exports, event_1, host_1, extensions_1, layoutService_1, editorService_1, configuration_1, window_1, editor_1, editor_2, files_1, label_1, dom_1, lifecycle_1, environmentService_1, decorators_1, extpath_1, workspaceEditing_1, instantiation_1, lifecycle_2, log_1, workspaces_1, nls_1, severity_1, dialogs_1, event_2, types_1, workspace_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserHostService = void 0;
    var HostShutdownReason;
    (function (HostShutdownReason) {
        /**
         * An unknown shutdown reason.
         */
        HostShutdownReason[HostShutdownReason["Unknown"] = 1] = "Unknown";
        /**
         * A shutdown that was potentially triggered by keyboard use.
         */
        HostShutdownReason[HostShutdownReason["Keyboard"] = 2] = "Keyboard";
        /**
         * An explicit shutdown via code.
         */
        HostShutdownReason[HostShutdownReason["Api"] = 3] = "Api";
    })(HostShutdownReason || (HostShutdownReason = {}));
    let BrowserHostService = class BrowserHostService extends lifecycle_1.Disposable {
        constructor(layoutService, configurationService, fileService, labelService, environmentService, instantiationService, lifecycleService, logService, dialogService, contextService) {
            var _a;
            super();
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.labelService = labelService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.lifecycleService = lifecycleService;
            this.logService = logService;
            this.dialogService = dialogService;
            this.contextService = contextService;
            this.shutdownReason = HostShutdownReason.Unknown;
            if ((_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.workspaceProvider) {
                this.workspaceProvider = environmentService.options.workspaceProvider;
            }
            else {
                this.workspaceProvider = new class {
                    constructor() {
                        this.workspace = undefined;
                        this.trusted = undefined;
                    }
                    async open() { return true; }
                };
            }
            this.registerListeners();
        }
        registerListeners() {
            // Veto shutdown depending on `window.confirmBeforeClose` setting
            this._register(this.lifecycleService.onBeforeShutdown(e => this.onBeforeShutdown(e)));
            // Track modifier keys to detect keybinding usage
            this._register(dom_1.ModifierKeyEmitter.getInstance().event(() => this.updateShutdownReasonFromEvent()));
        }
        onBeforeShutdown(e) {
            switch (this.shutdownReason) {
                // Unknown / Keyboard shows veto depending on setting
                case HostShutdownReason.Unknown:
                case HostShutdownReason.Keyboard: {
                    const confirmBeforeClose = this.configurationService.getValue('window.confirmBeforeClose');
                    if (confirmBeforeClose === 'always' || (confirmBeforeClose === 'keyboardOnly' && this.shutdownReason === HostShutdownReason.Keyboard)) {
                        e.veto(true, 'veto.confirmBeforeClose');
                    }
                    break;
                }
                // Api never shows veto
                case HostShutdownReason.Api:
                    break;
            }
            // Unset for next shutdown
            this.shutdownReason = HostShutdownReason.Unknown;
        }
        updateShutdownReasonFromEvent() {
            if (this.shutdownReason === HostShutdownReason.Api) {
                return; // do not overwrite any explicitly set shutdown reason
            }
            if (dom_1.ModifierKeyEmitter.getInstance().isModifierPressed) {
                this.shutdownReason = HostShutdownReason.Keyboard;
            }
            else {
                this.shutdownReason = HostShutdownReason.Unknown;
            }
        }
        //#region Focus
        get onDidChangeFocus() {
            const focusTracker = this._register((0, dom_1.trackFocus)(window));
            const onVisibilityChange = this._register(new event_2.DomEmitter(window.document, 'visibilitychange'));
            return event_1.Event.latch(event_1.Event.any(event_1.Event.map(focusTracker.onDidFocus, () => this.hasFocus), event_1.Event.map(focusTracker.onDidBlur, () => this.hasFocus), event_1.Event.map(onVisibilityChange.event, () => this.hasFocus)));
        }
        get hasFocus() {
            return document.hasFocus();
        }
        async hadLastFocus() {
            return true;
        }
        async focus() {
            window.focus();
        }
        openWindow(arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(arg1, arg2);
            }
            return this.doOpenEmptyWindow(arg1);
        }
        async doOpenWindow(toOpen, options) {
            const payload = this.preservePayload();
            const fileOpenables = [];
            const foldersToAdd = [];
            for (const openable of toOpen) {
                openable.label = openable.label || this.getRecentLabel(openable);
                // Folder
                if ((0, window_1.isFolderToOpen)(openable)) {
                    if (options === null || options === void 0 ? void 0 : options.addMode) {
                        foldersToAdd.push(({ uri: openable.folderUri }));
                    }
                    else {
                        this.doOpen({ folderUri: openable.folderUri }, { reuse: this.shouldReuse(options, false /* no file */), payload });
                    }
                }
                // Workspace
                else if ((0, window_1.isWorkspaceToOpen)(openable)) {
                    this.doOpen({ workspaceUri: openable.workspaceUri }, { reuse: this.shouldReuse(options, false /* no file */), payload });
                }
                // File (handled later in bulk)
                else if ((0, window_1.isFileToOpen)(openable)) {
                    fileOpenables.push(openable);
                }
            }
            // Handle Folders to Add
            if (foldersToAdd.length > 0) {
                this.withServices(accessor => {
                    const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
                    workspaceEditingService.addFolders(foldersToAdd);
                });
            }
            // Handle Files
            if (fileOpenables.length > 0) {
                this.withServices(async (accessor) => {
                    const editorService = accessor.get(editorService_1.IEditorService);
                    // Support diffMode
                    if ((options === null || options === void 0 ? void 0 : options.diffMode) && fileOpenables.length === 2) {
                        const editors = await (0, editor_1.pathsToEditors)(fileOpenables, this.fileService);
                        if (editors.length !== 2 || !editors[0].resource || !editors[1].resource) {
                            return; // invalid resources
                        }
                        // Same Window: open via editor service in current window
                        if (this.shouldReuse(options, true /* file */)) {
                            editorService.openEditor({
                                original: { resource: editors[0].resource },
                                modified: { resource: editors[1].resource },
                                options: { pinned: true }
                            });
                        }
                        // New Window: open into empty window
                        else {
                            const environment = new Map();
                            environment.set('diffFileSecondary', editors[0].resource.toString());
                            environment.set('diffFilePrimary', editors[1].resource.toString());
                            this.doOpen(undefined, { payload: Array.from(environment.entries()) });
                        }
                    }
                    // Just open normally
                    else {
                        for (const openable of fileOpenables) {
                            // Same Window: open via editor service in current window
                            if (this.shouldReuse(options, true /* file */)) {
                                let openables = [];
                                // Support: --goto parameter to open on line/col
                                if (options === null || options === void 0 ? void 0 : options.gotoLineMode) {
                                    const pathColumnAware = (0, extpath_1.parseLineAndColumnAware)(openable.fileUri.path);
                                    openables = [{
                                            fileUri: openable.fileUri.with({ path: pathColumnAware.path }),
                                            options: {
                                                selection: !(0, types_1.isUndefined)(pathColumnAware.line) ? { startLineNumber: pathColumnAware.line, startColumn: pathColumnAware.column || 1 } : undefined
                                            }
                                        }];
                                }
                                else {
                                    openables = [openable];
                                }
                                editorService.openEditors(await (0, editor_1.pathsToEditors)(openables, this.fileService), undefined, { validateTrust: true });
                            }
                            // New Window: open into empty window
                            else {
                                const environment = new Map();
                                environment.set('openFile', openable.fileUri.toString());
                                if (options === null || options === void 0 ? void 0 : options.gotoLineMode) {
                                    environment.set('gotoLineMode', 'true');
                                }
                                this.doOpen(undefined, { payload: Array.from(environment.entries()) });
                            }
                        }
                    }
                    // Support wait mode
                    const waitMarkerFileURI = options === null || options === void 0 ? void 0 : options.waitMarkerFileURI;
                    if (waitMarkerFileURI) {
                        (async () => {
                            // Wait for the resources to be closed in the text editor...
                            await this.instantiationService.invokeFunction(accessor => (0, editor_2.whenEditorClosed)(accessor, fileOpenables.map(fileOpenable => fileOpenable.fileUri)));
                            // ...before deleting the wait marker file
                            await this.fileService.del(waitMarkerFileURI);
                        })();
                    }
                });
            }
        }
        withServices(fn) {
            // Host service is used in a lot of contexts and some services
            // need to be resolved dynamically to avoid cyclic dependencies
            // (https://github.com/microsoft/vscode/issues/108522)
            this.instantiationService.invokeFunction(accessor => fn(accessor));
        }
        preservePayload() {
            // Selectively copy payload: for now only extension debugging properties are considered
            let newPayload = undefined;
            if (this.environmentService.extensionDevelopmentLocationURI) {
                newPayload = new Array();
                newPayload.push(['extensionDevelopmentPath', this.environmentService.extensionDevelopmentLocationURI.toString()]);
                if (this.environmentService.debugExtensionHost.debugId) {
                    newPayload.push(['debugId', this.environmentService.debugExtensionHost.debugId]);
                }
                if (this.environmentService.debugExtensionHost.port) {
                    newPayload.push(['inspect-brk-extensions', String(this.environmentService.debugExtensionHost.port)]);
                }
            }
            return newPayload;
        }
        getRecentLabel(openable) {
            if ((0, window_1.isFolderToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel(openable.folderUri, { verbose: true });
            }
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel((0, workspaces_1.getWorkspaceIdentifier)(openable.workspaceUri), { verbose: true });
            }
            return this.labelService.getUriLabel(openable.fileUri);
        }
        shouldReuse(options = Object.create(null), isFile) {
            if (options.waitMarkerFileURI) {
                return true; // always handle --wait in same window
            }
            const windowConfig = this.configurationService.getValue('window');
            const openInNewWindowConfig = isFile ? ((windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFilesInNewWindow) || 'off' /* default */) : ((windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFoldersInNewWindow) || 'default' /* default */);
            let openInNewWindow = (options.preferNewWindow || !!options.forceNewWindow) && !options.forceReuseWindow;
            if (!options.forceNewWindow && !options.forceReuseWindow && (openInNewWindowConfig === 'on' || openInNewWindowConfig === 'off')) {
                openInNewWindow = (openInNewWindowConfig === 'on');
            }
            return !openInNewWindow;
        }
        async doOpenEmptyWindow(options) {
            return this.doOpen(undefined, { reuse: options === null || options === void 0 ? void 0 : options.forceReuseWindow });
        }
        async doOpen(workspace, options) {
            // When we are in a temporary workspace and are asked to open a local folder
            // we swap that folder into the workspace to avoid a window reload. Access
            // to local resources is only possible without a window reload because it
            // needs user activation.
            if (workspace && (0, window_1.isFolderToOpen)(workspace) && workspace.folderUri.scheme === network_1.Schemas.file && (0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace())) {
                this.withServices(async (accessor) => {
                    const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
                    await workspaceEditingService.updateFolders(0, this.contextService.getWorkspace().folders.length, [{ uri: workspace.folderUri }]);
                });
                return;
            }
            // We know that `workspaceProvider.open` will trigger a shutdown
            // with `options.reuse` so we handle this expected shutdown
            if (options === null || options === void 0 ? void 0 : options.reuse) {
                await this.handleExpectedShutdown(4 /* ShutdownReason.LOAD */);
            }
            const opened = await this.workspaceProvider.open(workspace, options);
            if (!opened) {
                const showResult = await this.dialogService.show(severity_1.default.Warning, (0, nls_1.localize)('unableToOpenExternal', "The browser interrupted the opening of a new tab or window. Press 'Open' to open it anyway."), [(0, nls_1.localize)('open', "Open"), (0, nls_1.localize)('cancel', "Cancel")], { cancelId: 1 });
                if (showResult.choice === 0) {
                    await this.workspaceProvider.open(workspace, options);
                }
            }
        }
        async toggleFullScreen() {
            const target = this.layoutService.container;
            // Chromium
            if (document.fullscreen !== undefined) {
                if (!document.fullscreen) {
                    try {
                        return await target.requestFullscreen();
                    }
                    catch (error) {
                        this.logService.warn('toggleFullScreen(): requestFullscreen failed'); // https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
                    }
                }
                else {
                    try {
                        return await document.exitFullscreen();
                    }
                    catch (error) {
                        this.logService.warn('toggleFullScreen(): exitFullscreen failed');
                    }
                }
            }
            // Safari and Edge 14 are all using webkit prefix
            if (document.webkitIsFullScreen !== undefined) {
                try {
                    if (!document.webkitIsFullScreen) {
                        target.webkitRequestFullscreen(); // it's async, but doesn't return a real promise.
                    }
                    else {
                        document.webkitExitFullscreen(); // it's async, but doesn't return a real promise.
                    }
                }
                catch (_a) {
                    this.logService.warn('toggleFullScreen(): requestFullscreen/exitFullscreen failed');
                }
            }
        }
        //#endregion
        //#region Lifecycle
        async restart() {
            this.reload();
        }
        async reload() {
            await this.handleExpectedShutdown(3 /* ShutdownReason.RELOAD */);
            window.location.reload();
        }
        async close() {
            await this.handleExpectedShutdown(1 /* ShutdownReason.CLOSE */);
            window.close();
        }
        async handleExpectedShutdown(reason) {
            // Update shutdown reason in a way that we do
            // not show a dialog because this is a expected
            // shutdown.
            this.shutdownReason = HostShutdownReason.Api;
            // Signal shutdown reason to lifecycle
            return this.lifecycleService.withExpectedShutdown(reason);
        }
    };
    __decorate([
        decorators_1.memoize
    ], BrowserHostService.prototype, "onDidChangeFocus", null);
    BrowserHostService = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, files_1.IFileService),
        __param(3, label_1.ILabelService),
        __param(4, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, log_1.ILogService),
        __param(8, dialogs_1.IDialogService),
        __param(9, workspace_1.IWorkspaceContextService)
    ], BrowserHostService);
    exports.BrowserHostService = BrowserHostService;
    (0, extensions_1.registerSingleton)(host_1.IHostService, BrowserHostService, true);
});
//# sourceMappingURL=browserHostService.js.map