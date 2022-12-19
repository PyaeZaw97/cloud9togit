/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/browser", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/platform", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/sidebar/sidebarPart", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/services/layout/browser/layoutService", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/title/common/titleService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/window/common/window", "vs/workbench/services/host/browser/host", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/ui/grid/grid", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/files/common/files", "vs/editor/browser/editorBrowser", "vs/base/common/arrays", "vs/base/common/types", "vs/platform/notification/common/notification", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/uri", "vs/workbench/common/views", "vs/workbench/common/editor/diffEditorInput", "vs/base/common/performance", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/base/common/async", "vs/workbench/services/banner/browser/bannerService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarPart", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/layoutState"], function (require, exports, lifecycle_1, event_1, dom_1, browser_1, workingCopyBackup_1, platform_1, editor_1, sideBySideEditorInput_1, sidebarPart_1, panelPart_1, layoutService_1, workspace_1, storage_1, configuration_1, titleService_1, lifecycle_2, window_1, host_1, environmentService_1, editorService_1, editorGroupsService_1, grid_1, statusbar_1, files_1, editorBrowser_1, arrays_1, types_1, notification_1, themeService_1, theme_1, uri_1, views_1, diffEditorInput_1, performance_1, extensions_1, log_1, async_1, bannerService_1, panecomposite_1, auxiliaryBarPart_1, telemetry_1, layoutState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Layout = void 0;
    var WorkbenchLayoutClasses;
    (function (WorkbenchLayoutClasses) {
        WorkbenchLayoutClasses["SIDEBAR_HIDDEN"] = "nosidebar";
        WorkbenchLayoutClasses["EDITOR_HIDDEN"] = "noeditorarea";
        WorkbenchLayoutClasses["PANEL_HIDDEN"] = "nopanel";
        WorkbenchLayoutClasses["AUXILIARYBAR_HIDDEN"] = "noauxiliarybar";
        WorkbenchLayoutClasses["STATUSBAR_HIDDEN"] = "nostatusbar";
        WorkbenchLayoutClasses["FULLSCREEN"] = "fullscreen";
        WorkbenchLayoutClasses["MAXIMIZED"] = "maximized";
        WorkbenchLayoutClasses["WINDOW_BORDER"] = "border";
    })(WorkbenchLayoutClasses || (WorkbenchLayoutClasses = {}));
    class Layout extends lifecycle_1.Disposable {
        constructor(parent) {
            super();
            this.parent = parent;
            //#region Events
            this._onDidChangeZenMode = this._register(new event_1.Emitter());
            this.onDidChangeZenMode = this._onDidChangeZenMode.event;
            this._onDidChangeFullscreen = this._register(new event_1.Emitter());
            this.onDidChangeFullscreen = this._onDidChangeFullscreen.event;
            this._onDidChangeCenteredLayout = this._register(new event_1.Emitter());
            this.onDidChangeCenteredLayout = this._onDidChangeCenteredLayout.event;
            this._onDidChangePanelAlignment = this._register(new event_1.Emitter());
            this.onDidChangePanelAlignment = this._onDidChangePanelAlignment.event;
            this._onDidChangeWindowMaximized = this._register(new event_1.Emitter());
            this.onDidChangeWindowMaximized = this._onDidChangeWindowMaximized.event;
            this._onDidChangePanelPosition = this._register(new event_1.Emitter());
            this.onDidChangePanelPosition = this._onDidChangePanelPosition.event;
            this._onDidChangePartVisibility = this._register(new event_1.Emitter());
            this.onDidChangePartVisibility = this._onDidChangePartVisibility.event;
            this._onDidChangeNotificationsVisibility = this._register(new event_1.Emitter());
            this.onDidChangeNotificationsVisibility = this._onDidChangeNotificationsVisibility.event;
            this._onDidLayout = this._register(new event_1.Emitter());
            this.onDidLayout = this._onDidLayout.event;
            //#endregion
            //#region Properties
            this.hasContainer = true;
            this.container = document.createElement('div');
            //#endregion
            this.parts = new Map();
            this.initialized = false;
            this.disposed = false;
            this._openedDefaultEditors = false;
            this.whenReadyPromise = new async_1.DeferredPromise();
            this.whenReady = this.whenReadyPromise.p;
            this.whenRestoredPromise = new async_1.DeferredPromise();
            this.whenRestored = this.whenRestoredPromise.p;
            this.restored = false;
        }
        get dimension() { return this._dimension; }
        get offset() {
            return {
                top: (() => {
                    let offset = 0;
                    if (this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */)) {
                        offset = this.getPart("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */).maximumHeight;
                    }
                    return offset;
                })()
            };
        }
        initLayout(accessor) {
            // Services
            this.environmentService = accessor.get(environmentService_1.IBrowserWorkbenchEnvironmentService);
            this.configurationService = accessor.get(configuration_1.IConfigurationService);
            this.hostService = accessor.get(host_1.IHostService);
            this.contextService = accessor.get(workspace_1.IWorkspaceContextService);
            this.storageService = accessor.get(storage_1.IStorageService);
            this.workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            this.themeService = accessor.get(themeService_1.IThemeService);
            this.extensionService = accessor.get(extensions_1.IExtensionService);
            this.logService = accessor.get(log_1.ILogService);
            this.telemetryService = accessor.get(telemetry_1.ITelemetryService);
            // Parts
            this.editorService = accessor.get(editorService_1.IEditorService);
            this.editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            this.paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            this.viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            this.titleService = accessor.get(titleService_1.ITitleService);
            this.notificationService = accessor.get(notification_1.INotificationService);
            this.statusBarService = accessor.get(statusbar_1.IStatusbarService);
            accessor.get(bannerService_1.IBannerService);
            // Listeners
            this.registerLayoutListeners();
            // State
            this.initLayoutState(accessor.get(lifecycle_2.ILifecycleService), accessor.get(files_1.IFileService));
        }
        registerLayoutListeners() {
            // Restore editor if hidden
            const showEditorIfHidden = () => {
                if (!this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */)) {
                    this.toggleMaximizedPanel();
                }
            };
            // Wait to register these listeners after the editor group service
            // is ready to avoid conflicts on startup
            this.editorGroupService.whenRestored.then(() => {
                // Restore editor part on any editor change
                this._register(this.editorService.onDidVisibleEditorsChange(showEditorIfHidden));
                this._register(this.editorGroupService.onDidActivateGroup(showEditorIfHidden));
            });
            // Revalidate center layout when active editor changes: diff editor quits centered mode.
            this._register(this.editorService.onDidActiveEditorChange(() => this.centerEditorLayout(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED))));
            // Configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(() => this.doUpdateLayoutConfiguration()));
            // Fullscreen changes
            this._register((0, browser_1.onDidChangeFullscreen)(() => this.onFullscreenChanged()));
            // Group changes
            this._register(this.editorGroupService.onDidAddGroup(() => this.centerEditorLayout(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED))));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.centerEditorLayout(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED))));
            // Prevent workbench from scrolling #55456
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.SCROLL, () => this.container.scrollTop = 0));
            // Menubar visibility changes
            if ((platform_1.isWindows || platform_1.isLinux || platform_1.isWeb) && (0, window_1.getTitleBarStyle)(this.configurationService) === 'custom') {
                this._register(this.titleService.onMenubarVisibilityChange(visible => this.onMenubarToggled(visible)));
            }
            // Theme changes
            this._register(this.themeService.onDidColorThemeChange(() => this.updateStyles()));
            // Window focus changes
            this._register(this.hostService.onDidChangeFocus(e => this.onWindowFocusChanged(e)));
        }
        onMenubarToggled(visible) {
            if (visible !== this.windowState.runtime.menuBar.toggled) {
                this.windowState.runtime.menuBar.toggled = visible;
                const menuBarVisibility = (0, window_1.getMenuBarVisibility)(this.configurationService);
                // The menu bar toggles the title bar in web because it does not need to be shown for window controls only
                if (platform_1.isWeb && menuBarVisibility === 'toggle') {
                    this.workbenchGrid.setViewVisible(this.titleBarPartView, this.shouldShowTitleBar());
                }
                // The menu bar toggles the title bar in full screen for toggle and classic settings
                else if (this.windowState.runtime.fullscreen && (menuBarVisibility === 'toggle' || menuBarVisibility === 'classic')) {
                    this.workbenchGrid.setViewVisible(this.titleBarPartView, this.shouldShowTitleBar());
                }
                // Move layout call to any time the menubar
                // is toggled to update consumers of offset
                // see issue #115267
                this._onDidLayout.fire(this._dimension);
            }
        }
        onFullscreenChanged() {
            this.windowState.runtime.fullscreen = (0, browser_1.isFullscreen)();
            // Apply as CSS class
            if (this.windowState.runtime.fullscreen) {
                this.container.classList.add(WorkbenchLayoutClasses.FULLSCREEN);
            }
            else {
                this.container.classList.remove(WorkbenchLayoutClasses.FULLSCREEN);
                const zenModeExitInfo = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_EXIT_INFO);
                const zenModeActive = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_ACTIVE);
                if (zenModeExitInfo.transitionedToFullScreen && zenModeActive) {
                    this.toggleZenMode();
                }
            }
            // Change edge snapping accordingly
            this.workbenchGrid.edgeSnapping = this.windowState.runtime.fullscreen;
            // Changing fullscreen state of the window has an impact on custom title bar visibility, so we need to update
            if ((0, window_1.getTitleBarStyle)(this.configurationService) === 'custom') {
                // Propagate to grid
                this.workbenchGrid.setViewVisible(this.titleBarPartView, this.shouldShowTitleBar());
                this.updateWindowBorder(true);
            }
            this._onDidChangeFullscreen.fire(this.windowState.runtime.fullscreen);
        }
        onWindowFocusChanged(hasFocus) {
            if (this.windowState.runtime.hasFocus === hasFocus) {
                return;
            }
            this.windowState.runtime.hasFocus = hasFocus;
            this.updateWindowBorder();
        }
        doUpdateLayoutConfiguration(skipLayout) {
            // Menubar visibility
            this.updateMenubarVisibility(!!skipLayout);
            // Centered Layout
            this.centerEditorLayout(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED), skipLayout);
        }
        setSideBarPosition(position) {
            const activityBar = this.getPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const auxiliaryBar = this.getPart("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            const newPositionValue = (position === 0 /* Position.LEFT */) ? 'left' : 'right';
            const oldPositionValue = (position === 1 /* Position.RIGHT */) ? 'left' : 'right';
            const panelAlignment = this.getPanelAlignment();
            const panelPosition = this.getPanelPosition();
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_POSITON, position);
            // Adjust CSS
            const activityBarContainer = (0, types_1.assertIsDefined)(activityBar.getContainer());
            const sideBarContainer = (0, types_1.assertIsDefined)(sideBar.getContainer());
            const auxiliaryBarContainer = (0, types_1.assertIsDefined)(auxiliaryBar.getContainer());
            activityBarContainer.classList.remove(oldPositionValue);
            sideBarContainer.classList.remove(oldPositionValue);
            activityBarContainer.classList.add(newPositionValue);
            sideBarContainer.classList.add(newPositionValue);
            // Auxiliary Bar has opposite values
            auxiliaryBarContainer.classList.remove(newPositionValue);
            auxiliaryBarContainer.classList.add(oldPositionValue);
            // Update Styles
            activityBar.updateStyles();
            sideBar.updateStyles();
            auxiliaryBar.updateStyles();
            // Move activity bar and side bars
            this.adjustPartPositions(position, panelAlignment, panelPosition);
        }
        updateWindowBorder(skipLayout = false) {
            var _a;
            if (platform_1.isWeb || (0, window_1.getTitleBarStyle)(this.configurationService) !== 'custom') {
                return;
            }
            const theme = this.themeService.getColorTheme();
            const activeBorder = theme.getColor(theme_1.WINDOW_ACTIVE_BORDER);
            const inactiveBorder = theme.getColor(theme_1.WINDOW_INACTIVE_BORDER);
            let windowBorder = false;
            if (!this.windowState.runtime.fullscreen && !this.windowState.runtime.maximized && (activeBorder || inactiveBorder)) {
                windowBorder = true;
                // If the inactive color is missing, fallback to the active one
                const borderColor = this.windowState.runtime.hasFocus ? activeBorder : inactiveBorder !== null && inactiveBorder !== void 0 ? inactiveBorder : activeBorder;
                this.container.style.setProperty('--window-border-color', (_a = borderColor === null || borderColor === void 0 ? void 0 : borderColor.toString()) !== null && _a !== void 0 ? _a : 'transparent');
            }
            if (windowBorder === this.windowState.runtime.windowBorder) {
                return;
            }
            this.windowState.runtime.windowBorder = windowBorder;
            this.container.classList.toggle(WorkbenchLayoutClasses.WINDOW_BORDER, windowBorder);
            if (!skipLayout) {
                this.layout();
            }
        }
        updateStyles() {
            this.updateWindowBorder();
        }
        initLayoutState(lifecycleService, fileService) {
            var _a, _b, _c, _d;
            this.stateModel = new layoutState_1.LayoutStateModel(this.storageService, this.configurationService, this.contextService, this.parent);
            this.stateModel.load();
            // Both editor and panel should not be hidden on startup
            if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN) && this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_HIDDEN)) {
                this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_HIDDEN, false);
            }
            this.stateModel.onDidChangeState(change => {
                if (change.key === layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN) {
                    this.setActivityBarHidden(change.value);
                }
                if (change.key === layoutState_1.LayoutStateKeys.STATUSBAR_HIDDEN) {
                    this.setStatusBarHidden(change.value);
                }
                if (change.key === layoutState_1.LayoutStateKeys.SIDEBAR_POSITON) {
                    this.setSideBarPosition(change.value);
                }
                if (change.key === layoutState_1.LayoutStateKeys.PANEL_POSITION) {
                    this.setPanelPosition(change.value);
                }
                if (change.key === layoutState_1.LayoutStateKeys.PANEL_ALIGNMENT) {
                    this.setPanelAlignment(change.value);
                }
                this.doUpdateLayoutConfiguration();
            });
            // Window Initialization State
            const initialFilesToOpen = this.getInitialFilesToOpen();
            const windowInitializationState = {
                editor: {
                    restoreEditors: this.shouldRestoreEditors(this.contextService, initialFilesToOpen),
                    editorsToOpen: this.resolveEditorsToOpen(fileService, initialFilesToOpen)
                },
                views: {
                    defaults: this.getDefaultLayoutViews(this.environmentService, this.storageService),
                    containerToRestore: {}
                }
            };
            // Window Runtime State
            const windowRuntimeState = {
                fullscreen: (0, browser_1.isFullscreen)(),
                hasFocus: this.hostService.hasFocus,
                maximized: false,
                windowBorder: false,
                menuBar: {
                    toggled: false,
                },
                zenMode: {
                    transitionDisposables: new lifecycle_1.DisposableStore(),
                }
            };
            this.windowState = {
                initialization: windowInitializationState,
                runtime: windowRuntimeState,
            };
            // Sidebar View Container To Restore
            if (this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                // Only restore last viewlet if window was reloaded or we are in development mode
                let viewContainerToRestore;
                if (!this.environmentService.isBuilt || lifecycleService.startupKind === 3 /* StartupKind.ReloadedWindow */ || platform_1.isWeb) {
                    viewContainerToRestore = this.storageService.get(sidebarPart_1.SidebarPart.activeViewletSettingsKey, 1 /* StorageScope.WORKSPACE */, (_a = this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)) === null || _a === void 0 ? void 0 : _a.id);
                }
                else {
                    viewContainerToRestore = (_b = this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)) === null || _b === void 0 ? void 0 : _b.id;
                }
                if (viewContainerToRestore) {
                    this.windowState.initialization.views.containerToRestore.sideBar = viewContainerToRestore;
                }
                else {
                    this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN, true);
                }
            }
            // Panel View Container To Restore
            if (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                let viewContainerToRestore = this.storageService.get(panelPart_1.PanelPart.activePanelSettingsKey, 1 /* StorageScope.WORKSPACE */, (_c = this.viewDescriptorService.getDefaultViewContainer(1 /* ViewContainerLocation.Panel */)) === null || _c === void 0 ? void 0 : _c.id);
                if (viewContainerToRestore) {
                    this.windowState.initialization.views.containerToRestore.panel = viewContainerToRestore;
                }
                else {
                    this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN, true);
                }
            }
            // Auxiliary Panel to restore
            if (this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                let viewContainerToRestore = this.storageService.get(auxiliaryBarPart_1.AuxiliaryBarPart.activePanelSettingsKey, 1 /* StorageScope.WORKSPACE */, (_d = this.viewDescriptorService.getDefaultViewContainer(2 /* ViewContainerLocation.AuxiliaryBar */)) === null || _d === void 0 ? void 0 : _d.id);
                if (viewContainerToRestore) {
                    this.windowState.initialization.views.containerToRestore.auxiliaryBar = viewContainerToRestore;
                }
                else {
                    this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN, true);
                }
            }
            // Window border
            this.updateWindowBorder(true);
        }
        getDefaultLayoutViews(environmentService, storageService) {
            var _a;
            const defaultLayout = (_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.defaultLayout;
            if (!defaultLayout) {
                return undefined;
            }
            if (!defaultLayout.force && !storageService.isNew(1 /* StorageScope.WORKSPACE */)) {
                return undefined;
            }
            const { views } = defaultLayout;
            if (views === null || views === void 0 ? void 0 : views.length) {
                return views.map(view => view.id);
            }
            return undefined;
        }
        shouldRestoreEditors(contextService, initialFilesToOpen) {
            // Restore editors based on a set of rules:
            // - never when running on temporary workspace
            // - not when we have files to open, unless:
            // - always when `window.restoreWindows: preserve`
            if ((0, workspace_1.isTemporaryWorkspace)(contextService.getWorkspace())) {
                return false;
            }
            const forceRestoreEditors = this.configurationService.getValue('window.restoreWindows') === 'preserve';
            return !!forceRestoreEditors || initialFilesToOpen === undefined;
        }
        willRestoreEditors() {
            return this.windowState.initialization.editor.restoreEditors;
        }
        resolveEditorsToOpen(fileService, initialFilesToOpen) {
            // Files to open, diff or create
            if (initialFilesToOpen) {
                // Files to diff is exclusive
                return (0, editor_1.pathsToEditors)(initialFilesToOpen.filesToDiff, fileService).then(filesToDiff => {
                    if (filesToDiff.length === 2) {
                        const diffEditorInput = [{
                                original: { resource: filesToDiff[0].resource },
                                modified: { resource: filesToDiff[1].resource },
                                options: { pinned: true }
                            }];
                        return diffEditorInput;
                    }
                    // Otherwise: Open/Create files
                    return (0, editor_1.pathsToEditors)(initialFilesToOpen.filesToOpenOrCreate, fileService);
                });
            }
            // Empty workbench configured to open untitled file if empty
            else if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && this.configurationService.getValue('workbench.startupEditor') === 'newUntitledFile') {
                if (this.editorGroupService.hasRestorableState) {
                    return []; // do not open any empty untitled file if we restored groups/editors from previous session
                }
                return this.workingCopyBackupService.hasBackups().then(hasBackups => {
                    if (hasBackups) {
                        return []; // do not open any empty untitled file if we have backups to restore
                    }
                    return [{ resource: undefined }]; // open empty untitled file
                });
            }
            return [];
        }
        get openedDefaultEditors() { return this._openedDefaultEditors; }
        getInitialFilesToOpen() {
            var _a, _b;
            // Check for editors from `defaultLayout` options first
            const defaultLayout = (_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.defaultLayout;
            if (((_b = defaultLayout === null || defaultLayout === void 0 ? void 0 : defaultLayout.editors) === null || _b === void 0 ? void 0 : _b.length) && (defaultLayout.force || this.storageService.isNew(1 /* StorageScope.WORKSPACE */))) {
                this._openedDefaultEditors = true;
                return {
                    filesToOpenOrCreate: defaultLayout.editors.map(file => {
                        const legacyOverride = file.openWith;
                        const legacySelection = file.selection && file.selection.start && (0, types_1.isNumber)(file.selection.start.line) ? {
                            startLineNumber: file.selection.start.line,
                            startColumn: (0, types_1.isNumber)(file.selection.start.column) ? file.selection.start.column : 1,
                            endLineNumber: (0, types_1.isNumber)(file.selection.end.line) ? file.selection.end.line : undefined,
                            endColumn: (0, types_1.isNumber)(file.selection.end.line) ? ((0, types_1.isNumber)(file.selection.end.column) ? file.selection.end.column : 1) : undefined,
                        } : undefined;
                        return {
                            fileUri: uri_1.URI.revive(file.uri),
                            openOnlyIfExists: file.openOnlyIfExists,
                            options: Object.assign({ selection: legacySelection, override: legacyOverride }, file.options // keep at the end to override legacy selection/override that may be `undefined`
                            )
                        };
                    })
                };
            }
            // Then check for files to open, create or diff from main side
            const { filesToOpenOrCreate, filesToDiff } = this.environmentService;
            if (filesToOpenOrCreate || filesToDiff) {
                return { filesToOpenOrCreate, filesToDiff };
            }
            return undefined;
        }
        isRestored() {
            return this.restored;
        }
        restoreParts() {
            // distinguish long running restore operations that
            // are required for the layout to be ready from those
            // that are needed to signal restoring is done
            const layoutReadyPromises = [];
            const layoutRestoredPromises = [];
            // Restore editors
            layoutReadyPromises.push((async () => {
                (0, performance_1.mark)('code/willRestoreEditors');
                // first ensure the editor part is ready
                await this.editorGroupService.whenReady;
                // then see for editors to open as instructed
                // it is important that we trigger this from
                // the overall restore flow to reduce possible
                // flicker on startup: we want any editor to
                // open to get a chance to open first before
                // signaling that layout is restored, but we do
                // not need to await the editors from having
                // fully loaded.
                let editors;
                if (Array.isArray(this.windowState.initialization.editor.editorsToOpen)) {
                    editors = this.windowState.initialization.editor.editorsToOpen;
                }
                else {
                    editors = await this.windowState.initialization.editor.editorsToOpen;
                }
                let openEditorsPromise = undefined;
                if (editors.length) {
                    openEditorsPromise = this.editorService.openEditors(editors, undefined, { validateTrust: true });
                }
                // do not block the overall layout ready flow from potentially
                // slow editors to resolve on startup
                layoutRestoredPromises.push(Promise.all([
                    openEditorsPromise,
                    this.editorGroupService.whenRestored
                ]).finally(() => {
                    // the `code/didRestoreEditors` perf mark is specifically
                    // for when visible editors have resolved, so we only mark
                    // if when editor group service has restored.
                    (0, performance_1.mark)('code/didRestoreEditors');
                }));
            })());
            // Restore default views (only when `IDefaultLayout` is provided)
            const restoreDefaultViewsPromise = (async () => {
                var _a;
                if ((_a = this.windowState.initialization.views.defaults) === null || _a === void 0 ? void 0 : _a.length) {
                    (0, performance_1.mark)('code/willOpenDefaultViews');
                    const locationsRestored = [];
                    const tryOpenView = (view) => {
                        var _a, _b;
                        const location = this.viewDescriptorService.getViewLocationById(view.id);
                        if (location !== null) {
                            const container = this.viewDescriptorService.getViewContainerByViewId(view.id);
                            if (container) {
                                if (view.order >= ((_b = (_a = locationsRestored === null || locationsRestored === void 0 ? void 0 : locationsRestored[location]) === null || _a === void 0 ? void 0 : _a.order) !== null && _b !== void 0 ? _b : 0)) {
                                    locationsRestored[location] = { id: container.id, order: view.order };
                                }
                                const containerModel = this.viewDescriptorService.getViewContainerModel(container);
                                containerModel.setCollapsed(view.id, false);
                                containerModel.setVisible(view.id, true);
                                return true;
                            }
                        }
                        return false;
                    };
                    const defaultViews = [...this.windowState.initialization.views.defaults].reverse().map((v, index) => ({ id: v, order: index }));
                    let i = defaultViews.length;
                    while (i) {
                        i--;
                        if (tryOpenView(defaultViews[i])) {
                            defaultViews.splice(i, 1);
                        }
                    }
                    // If we still have views left over, wait until all extensions have been registered and try again
                    if (defaultViews.length) {
                        await this.extensionService.whenInstalledExtensionsRegistered();
                        let i = defaultViews.length;
                        while (i) {
                            i--;
                            if (tryOpenView(defaultViews[i])) {
                                defaultViews.splice(i, 1);
                            }
                        }
                    }
                    // If we opened a view in the sidebar, stop any restore there
                    if (locationsRestored[0 /* ViewContainerLocation.Sidebar */]) {
                        this.windowState.initialization.views.containerToRestore.sideBar = locationsRestored[0 /* ViewContainerLocation.Sidebar */].id;
                    }
                    // If we opened a view in the panel, stop any restore there
                    if (locationsRestored[1 /* ViewContainerLocation.Panel */]) {
                        this.windowState.initialization.views.containerToRestore.panel = locationsRestored[1 /* ViewContainerLocation.Panel */].id;
                    }
                    // If we opened a view in the auxiliary bar, stop any restore there
                    if (locationsRestored[2 /* ViewContainerLocation.AuxiliaryBar */]) {
                        this.windowState.initialization.views.containerToRestore.auxiliaryBar = locationsRestored[2 /* ViewContainerLocation.AuxiliaryBar */].id;
                    }
                    (0, performance_1.mark)('code/didOpenDefaultViews');
                }
            })();
            layoutReadyPromises.push(restoreDefaultViewsPromise);
            // Restore Sidebar
            layoutReadyPromises.push((async () => {
                var _a;
                // Restoring views could mean that sidebar already
                // restored, as such we need to test again
                await restoreDefaultViewsPromise;
                if (!this.windowState.initialization.views.containerToRestore.sideBar) {
                    return;
                }
                (0, performance_1.mark)('code/willRestoreViewlet');
                const viewlet = await this.paneCompositeService.openPaneComposite(this.windowState.initialization.views.containerToRestore.sideBar, 0 /* ViewContainerLocation.Sidebar */);
                if (!viewlet) {
                    await this.paneCompositeService.openPaneComposite((_a = this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)) === null || _a === void 0 ? void 0 : _a.id, 0 /* ViewContainerLocation.Sidebar */); // fallback to default viewlet as needed
                }
                (0, performance_1.mark)('code/didRestoreViewlet');
            })());
            // Restore Panel
            layoutReadyPromises.push((async () => {
                var _a;
                // Restoring views could mean that panel already
                // restored, as such we need to test again
                await restoreDefaultViewsPromise;
                if (!this.windowState.initialization.views.containerToRestore.panel) {
                    return;
                }
                (0, performance_1.mark)('code/willRestorePanel');
                const panel = await this.paneCompositeService.openPaneComposite(this.windowState.initialization.views.containerToRestore.panel, 1 /* ViewContainerLocation.Panel */);
                if (!panel) {
                    await this.paneCompositeService.openPaneComposite((_a = this.viewDescriptorService.getDefaultViewContainer(1 /* ViewContainerLocation.Panel */)) === null || _a === void 0 ? void 0 : _a.id, 1 /* ViewContainerLocation.Panel */); // fallback to default panel as needed
                }
                (0, performance_1.mark)('code/didRestorePanel');
            })());
            // Restore Auxiliary Bar
            layoutReadyPromises.push((async () => {
                var _a;
                // Restoring views could mean that panel already
                // restored, as such we need to test again
                await restoreDefaultViewsPromise;
                if (!this.windowState.initialization.views.containerToRestore.auxiliaryBar) {
                    return;
                }
                (0, performance_1.mark)('code/willRestoreAuxiliaryBar');
                const panel = await this.paneCompositeService.openPaneComposite(this.windowState.initialization.views.containerToRestore.auxiliaryBar, 2 /* ViewContainerLocation.AuxiliaryBar */);
                if (!panel) {
                    await this.paneCompositeService.openPaneComposite((_a = this.viewDescriptorService.getDefaultViewContainer(2 /* ViewContainerLocation.AuxiliaryBar */)) === null || _a === void 0 ? void 0 : _a.id, 2 /* ViewContainerLocation.AuxiliaryBar */); // fallback to default panel as needed
                }
                (0, performance_1.mark)('code/didRestoreAuxiliaryBar');
            })());
            // Restore Zen Mode
            const zenModeWasActive = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_ACTIVE);
            const restoreZenMode = getZenModeConfiguration(this.configurationService).restore;
            if (zenModeWasActive) {
                this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_ACTIVE, !restoreZenMode);
                this.toggleZenMode(false, true);
            }
            // Restore Editor Center Mode
            if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED)) {
                this.centerEditorLayout(true, true);
            }
            // Await for promises that we recorded to update
            // our ready and restored states properly.
            async_1.Promises.settled(layoutReadyPromises).finally(() => {
                this.whenReadyPromise.complete();
                async_1.Promises.settled(layoutRestoredPromises).finally(() => {
                    this.restored = true;
                    this.whenRestoredPromise.complete();
                });
            });
        }
        registerPart(part) {
            this.parts.set(part.getId(), part);
        }
        getPart(key) {
            const part = this.parts.get(key);
            if (!part) {
                throw new Error(`Unknown part ${key}`);
            }
            return part;
        }
        registerNotifications(delegate) {
            this._register(delegate.onDidChangeNotificationsVisibility(visible => this._onDidChangeNotificationsVisibility.fire(visible)));
        }
        hasFocus(part) {
            const activeElement = document.activeElement;
            if (!activeElement) {
                return false;
            }
            const container = this.getContainer(part);
            return !!container && (0, dom_1.isAncestorUsingFlowTo)(activeElement, container);
        }
        focusPart(part) {
            switch (part) {
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    this.editorGroupService.activeGroup.focus();
                    break;
                case "workbench.parts.panel" /* Parts.PANEL_PART */: {
                    const activePanel = this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                    if (activePanel) {
                        activePanel.focus();
                    }
                    break;
                }
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */: {
                    const activeViewlet = this.paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
                    if (activeViewlet) {
                        activeViewlet.focus();
                    }
                    break;
                }
                case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                    this.getPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */).focus();
                    break;
                case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                    this.statusBarService.focus();
                default: {
                    // Title Bar & Banner simply pass focus to container
                    const container = this.getContainer(part);
                    if (container) {
                        container.focus();
                    }
                }
            }
        }
        getContainer(part) {
            if (!this.parts.get(part)) {
                return undefined;
            }
            return this.getPart(part).getContainer();
        }
        isVisible(part) {
            if (this.initialized) {
                switch (part) {
                    case "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */:
                        return this.workbenchGrid.isViewVisible(this.titleBarPartView);
                    case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                        return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN);
                    case "workbench.parts.panel" /* Parts.PANEL_PART */:
                        return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN);
                    case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                        return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN);
                    case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                        return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.STATUSBAR_HIDDEN);
                    case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                        return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN);
                    case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                        return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_HIDDEN);
                    default:
                        return false; // any other part cannot be hidden
                }
            }
            switch (part) {
                case "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */:
                    return this.shouldShowTitleBar();
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                    return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN);
                case "workbench.parts.panel" /* Parts.PANEL_PART */:
                    return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN);
                case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                    return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN);
                case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                    return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.STATUSBAR_HIDDEN);
                case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                    return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN);
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    return !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_HIDDEN);
                default:
                    return false; // any other part cannot be hidden
            }
        }
        shouldShowTitleBar() {
            // Using the native title bar, don't ever show the custom one
            if ((0, window_1.getTitleBarStyle)(this.configurationService) === 'native') {
                return false;
            }
            // macOS desktop does not need a title bar when full screen
            if (platform_1.isMacintosh && platform_1.isNative) {
                return !this.windowState.runtime.fullscreen;
            }
            // non-fullscreen native must show the title bar
            if (platform_1.isNative && !this.windowState.runtime.fullscreen) {
                return true;
            }
            // remaining behavior is based on menubar visibility
            switch ((0, window_1.getMenuBarVisibility)(this.configurationService)) {
                case 'classic':
                    return !this.windowState.runtime.fullscreen || this.windowState.runtime.menuBar.toggled;
                case 'compact':
                case 'hidden':
                    return false;
                case 'toggle':
                    return this.windowState.runtime.menuBar.toggled;
                case 'visible':
                    return true;
                default:
                    return platform_1.isWeb ? false : !this.windowState.runtime.fullscreen || this.windowState.runtime.menuBar.toggled;
            }
        }
        focus() {
            this.focusPart("workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
        getDimension(part) {
            return this.getPart(part).dimension;
        }
        getMaximumEditorDimensions() {
            const panelPosition = this.getPanelPosition();
            const isColumn = panelPosition === 1 /* Position.RIGHT */ || panelPosition === 0 /* Position.LEFT */;
            const takenWidth = (this.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */) ? this.activityBarPartView.minimumWidth : 0) +
                (this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? this.sideBarPartView.minimumWidth : 0) +
                (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) && isColumn ? this.panelPartView.minimumWidth : 0) +
                (this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) ? this.auxiliaryBarPartView.minimumWidth : 0);
            const takenHeight = (this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */) ? this.titleBarPartView.minimumHeight : 0) +
                (this.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */) ? this.statusBarPartView.minimumHeight : 0) +
                (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) && !isColumn ? this.panelPartView.minimumHeight : 0);
            const availableWidth = this.dimension.width - takenWidth;
            const availableHeight = this.dimension.height - takenHeight;
            return new dom_1.Dimension(availableWidth, availableHeight);
        }
        toggleZenMode(skipLayout, restoring = false) {
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_ACTIVE, !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_ACTIVE));
            this.windowState.runtime.zenMode.transitionDisposables.clear();
            const setLineNumbers = (lineNumbers) => {
                const setEditorLineNumbers = (editor) => {
                    // To properly reset line numbers we need to read the configuration for each editor respecting it's uri.
                    if (!lineNumbers && (0, editorBrowser_1.isCodeEditor)(editor) && editor.hasModel()) {
                        const model = editor.getModel();
                        lineNumbers = this.configurationService.getValue('editor.lineNumbers', { resource: model.uri, overrideIdentifier: model.getLanguageId() });
                    }
                    if (!lineNumbers) {
                        lineNumbers = this.configurationService.getValue('editor.lineNumbers');
                    }
                    editor.updateOptions({ lineNumbers });
                };
                if (!lineNumbers) {
                    // Reset line numbers on all editors visible and non-visible
                    for (const editorControl of this.editorService.visibleTextEditorControls) {
                        setEditorLineNumbers(editorControl);
                    }
                }
                else {
                    for (const editorControl of this.editorService.visibleTextEditorControls) {
                        setEditorLineNumbers(editorControl);
                    }
                }
            };
            // Check if zen mode transitioned to full screen and if now we are out of zen mode
            // -> we need to go out of full screen (same goes for the centered editor layout)
            let toggleFullScreen = false;
            const config = getZenModeConfiguration(this.configurationService);
            const zenModeExitInfo = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_EXIT_INFO);
            // Zen Mode Active
            if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_ACTIVE)) {
                toggleFullScreen = !this.windowState.runtime.fullscreen && config.fullScreen && !platform_1.isIOS;
                if (!restoring) {
                    zenModeExitInfo.transitionedToFullScreen = toggleFullScreen;
                    zenModeExitInfo.transitionedToCenteredEditorLayout = !this.isEditorLayoutCentered() && config.centerLayout;
                    zenModeExitInfo.wasVisible.sideBar = this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                    zenModeExitInfo.wasVisible.panel = this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */);
                    zenModeExitInfo.wasVisible.auxiliaryBar = this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                    this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_EXIT_INFO, zenModeExitInfo);
                }
                this.setPanelHidden(true, true);
                this.setAuxiliaryBarHidden(true, true);
                this.setSideBarHidden(true, true);
                if (config.hideActivityBar) {
                    this.setActivityBarHidden(true, true);
                }
                if (config.hideStatusBar) {
                    this.setStatusBarHidden(true, true);
                }
                if (config.hideLineNumbers) {
                    setLineNumbers('off');
                    this.windowState.runtime.zenMode.transitionDisposables.add(this.editorService.onDidVisibleEditorsChange(() => setLineNumbers('off')));
                }
                if (config.hideTabs && this.editorGroupService.partOptions.showTabs) {
                    this.windowState.runtime.zenMode.transitionDisposables.add(this.editorGroupService.enforcePartOptions({ showTabs: false }));
                }
                if (config.silentNotifications) {
                    this.notificationService.setFilter(notification_1.NotificationsFilter.ERROR);
                }
                this.windowState.runtime.zenMode.transitionDisposables.add(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(layoutState_1.WorkbenchLayoutSettings.ZEN_MODE_SILENT_NOTIFICATIONS)) {
                        const filter = this.configurationService.getValue(layoutState_1.WorkbenchLayoutSettings.ZEN_MODE_SILENT_NOTIFICATIONS) ? notification_1.NotificationsFilter.ERROR : notification_1.NotificationsFilter.OFF;
                        this.notificationService.setFilter(filter);
                    }
                }));
                if (config.centerLayout) {
                    this.centerEditorLayout(true, true);
                }
            }
            // Zen Mode Inactive
            else {
                if (zenModeExitInfo.wasVisible.panel) {
                    this.setPanelHidden(false, true);
                }
                if (zenModeExitInfo.wasVisible.auxiliaryBar) {
                    this.setAuxiliaryBarHidden(false, true);
                }
                if (zenModeExitInfo.wasVisible.sideBar) {
                    this.setSideBarHidden(false, true);
                }
                if (!this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN, true)) {
                    this.setActivityBarHidden(false, true);
                }
                if (!this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.STATUSBAR_HIDDEN, true)) {
                    this.setStatusBarHidden(false, true);
                }
                if (zenModeExitInfo.transitionedToCenteredEditorLayout) {
                    this.centerEditorLayout(false, true);
                }
                setLineNumbers();
                this.focus();
                // Clear notifications filter
                this.notificationService.setFilter(notification_1.NotificationsFilter.OFF);
                toggleFullScreen = zenModeExitInfo.transitionedToFullScreen && this.windowState.runtime.fullscreen;
            }
            if (!skipLayout) {
                this.layout();
            }
            if (toggleFullScreen) {
                this.hostService.toggleFullScreen();
            }
            // Event
            this._onDidChangeZenMode.fire(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ZEN_MODE_ACTIVE));
        }
        setStatusBarHidden(hidden, skipLayout) {
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.STATUSBAR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.container.classList.add(WorkbenchLayoutClasses.STATUSBAR_HIDDEN);
            }
            else {
                this.container.classList.remove(WorkbenchLayoutClasses.STATUSBAR_HIDDEN);
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.statusBarPartView, !hidden);
        }
        createWorkbenchLayout() {
            const titleBar = this.getPart("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */);
            const bannerPart = this.getPart("workbench.parts.banner" /* Parts.BANNER_PART */);
            const editorPart = this.getPart("workbench.parts.editor" /* Parts.EDITOR_PART */);
            const activityBar = this.getPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
            const panelPart = this.getPart("workbench.parts.panel" /* Parts.PANEL_PART */);
            const auxiliaryBarPart = this.getPart("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const statusBar = this.getPart("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */);
            // View references for all parts
            this.titleBarPartView = titleBar;
            this.bannerPartView = bannerPart;
            this.sideBarPartView = sideBar;
            this.activityBarPartView = activityBar;
            this.editorPartView = editorPart;
            this.panelPartView = panelPart;
            this.auxiliaryBarPartView = auxiliaryBarPart;
            this.statusBarPartView = statusBar;
            const viewMap = {
                ["workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */]: this.activityBarPartView,
                ["workbench.parts.banner" /* Parts.BANNER_PART */]: this.bannerPartView,
                ["workbench.parts.titlebar" /* Parts.TITLEBAR_PART */]: this.titleBarPartView,
                ["workbench.parts.editor" /* Parts.EDITOR_PART */]: this.editorPartView,
                ["workbench.parts.panel" /* Parts.PANEL_PART */]: this.panelPartView,
                ["workbench.parts.sidebar" /* Parts.SIDEBAR_PART */]: this.sideBarPartView,
                ["workbench.parts.statusbar" /* Parts.STATUSBAR_PART */]: this.statusBarPartView,
                ["workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */]: this.auxiliaryBarPartView
            };
            const fromJSON = ({ type }) => viewMap[type];
            const workbenchGrid = grid_1.SerializableGrid.deserialize(this.createGridDescriptor(), { fromJSON }, { proportionalLayout: false });
            this.container.prepend(workbenchGrid.element);
            this.container.setAttribute('role', 'application');
            this.workbenchGrid = workbenchGrid;
            this.workbenchGrid.edgeSnapping = this.windowState.runtime.fullscreen;
            for (const part of [titleBar, editorPart, activityBar, panelPart, sideBar, statusBar, auxiliaryBarPart]) {
                this._register(part.onDidVisibilityChange((visible) => {
                    if (part === sideBar) {
                        this.setSideBarHidden(!visible, true);
                    }
                    else if (part === panelPart) {
                        this.setPanelHidden(!visible, true);
                    }
                    else if (part === auxiliaryBarPart) {
                        this.setAuxiliaryBarHidden(!visible, true);
                    }
                    else if (part === editorPart) {
                        this.setEditorHidden(!visible, true);
                    }
                    this._onDidChangePartVisibility.fire();
                }));
            }
            this._register(this.storageService.onWillSaveState(willSaveState => {
                if (willSaveState.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    // Side Bar Size
                    const sideBarSize = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN)
                        ? this.workbenchGrid.getViewCachedVisibleSize(this.sideBarPartView)
                        : this.workbenchGrid.getViewSize(this.sideBarPartView).width;
                    this.stateModel.setInitializationValue(layoutState_1.LayoutStateKeys.SIDEBAR_SIZE, sideBarSize);
                    // Panel Size
                    const panelSize = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN)
                        ? this.workbenchGrid.getViewCachedVisibleSize(this.panelPartView)
                        : (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_POSITION) === 2 /* Position.BOTTOM */ ? this.workbenchGrid.getViewSize(this.panelPartView).height : this.workbenchGrid.getViewSize(this.panelPartView).width);
                    this.stateModel.setInitializationValue(layoutState_1.LayoutStateKeys.PANEL_SIZE, panelSize);
                    // Auxiliary Bar Size
                    const auxiliaryBarSize = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN)
                        ? this.workbenchGrid.getViewCachedVisibleSize(this.auxiliaryBarPartView)
                        : this.workbenchGrid.getViewSize(this.auxiliaryBarPartView).width;
                    this.stateModel.setInitializationValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_SIZE, auxiliaryBarSize);
                    this.stateModel.save(true, true);
                }
            }));
        }
        getClientArea() {
            return (0, dom_1.getClientArea)(this.parent);
        }
        layout() {
            if (!this.disposed) {
                this._dimension = this.getClientArea();
                this.logService.trace(`Layout#layout, height: ${this._dimension.height}, width: ${this._dimension.width}`);
                (0, dom_1.position)(this.container, 0, 0, 0, 0, 'relative');
                (0, dom_1.size)(this.container, this._dimension.width, this._dimension.height);
                // Layout the grid widget
                this.workbenchGrid.layout(this._dimension.width, this._dimension.height);
                this.initialized = true;
                // Emit as event
                this._onDidLayout.fire(this._dimension);
            }
        }
        isEditorLayoutCentered() {
            return this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED);
        }
        centerEditorLayout(active, skipLayout) {
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED, active);
            let smartActive = active;
            const activeEditor = this.editorService.activeEditor;
            let isEditorSplit = false;
            if (activeEditor instanceof diffEditorInput_1.DiffEditorInput) {
                isEditorSplit = this.configurationService.getValue('diffEditor.renderSideBySide');
            }
            else if (activeEditor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                isEditorSplit = true;
            }
            const isCenteredLayoutAutoResizing = this.configurationService.getValue('workbench.editor.centeredLayoutAutoResize');
            if (isCenteredLayoutAutoResizing &&
                (this.editorGroupService.groups.length > 1 || isEditorSplit)) {
                smartActive = false;
            }
            // Enter Centered Editor Layout
            if (this.editorGroupService.isLayoutCentered() !== smartActive) {
                this.editorGroupService.centerLayout(smartActive);
                if (!skipLayout) {
                    this.layout();
                }
            }
            this._onDidChangeCenteredLayout.fire(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_CENTERED));
        }
        resizePart(part, sizeChangeWidth, sizeChangeHeight) {
            const sizeChangePxWidth = this.workbenchGrid.width * sizeChangeWidth / 100;
            const sizeChangePxHeight = this.workbenchGrid.height * sizeChangeHeight / 100;
            let viewSize;
            switch (part) {
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.sideBarPartView);
                    this.workbenchGrid.resizeView(this.sideBarPartView, {
                        width: viewSize.width + sizeChangePxWidth,
                        height: viewSize.height
                    });
                    break;
                case "workbench.parts.panel" /* Parts.PANEL_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.panelPartView);
                    this.workbenchGrid.resizeView(this.panelPartView, {
                        width: viewSize.width + (this.getPanelPosition() !== 2 /* Position.BOTTOM */ ? sizeChangePxWidth : 0),
                        height: viewSize.height + (this.getPanelPosition() !== 2 /* Position.BOTTOM */ ? 0 : sizeChangePxHeight)
                    });
                    break;
                case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.auxiliaryBarPartView);
                    this.workbenchGrid.resizeView(this.auxiliaryBarPartView, {
                        width: viewSize.width + sizeChangePxWidth,
                        height: viewSize.height
                    });
                    break;
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.editorPartView);
                    // Single Editor Group
                    if (this.editorGroupService.count === 1) {
                        this.workbenchGrid.resizeView(this.editorPartView, {
                            width: viewSize.width + sizeChangePxWidth,
                            height: viewSize.height + sizeChangePxHeight
                        });
                    }
                    else {
                        const activeGroup = this.editorGroupService.activeGroup;
                        const { width, height } = this.editorGroupService.getSize(activeGroup);
                        this.editorGroupService.setSize(activeGroup, { width: width + sizeChangePxWidth, height: height + sizeChangePxHeight });
                        // After resizing the editor group
                        // if it does not change in either direction
                        // try resizing the full editor part
                        const { width: newWidth, height: newHeight } = this.editorGroupService.getSize(activeGroup);
                        if ((sizeChangePxHeight && height === newHeight) || (sizeChangePxWidth && width === newWidth)) {
                            this.workbenchGrid.resizeView(this.editorPartView, {
                                width: viewSize.width + (sizeChangePxWidth && width === newWidth ? sizeChangePxWidth : 0),
                                height: viewSize.height + (sizeChangePxHeight && height === newHeight ? sizeChangePxHeight : 0)
                            });
                        }
                    }
                    break;
                default:
                    return; // Cannot resize other parts
            }
        }
        setActivityBarHidden(hidden, skipLayout) {
            // Propagate to grid
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN, hidden);
            this.workbenchGrid.setViewVisible(this.activityBarPartView, !hidden);
        }
        setBannerHidden(hidden) {
            this.workbenchGrid.setViewVisible(this.bannerPartView, !hidden);
        }
        setEditorHidden(hidden, skipLayout) {
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.container.classList.add(WorkbenchLayoutClasses.EDITOR_HIDDEN);
            }
            else {
                this.container.classList.remove(WorkbenchLayoutClasses.EDITOR_HIDDEN);
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.editorPartView, !hidden);
            // The editor and panel cannot be hidden at the same time
            if (hidden && !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                this.setPanelHidden(false, true);
            }
        }
        getLayoutClasses() {
            return (0, arrays_1.coalesce)([
                !this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? WorkbenchLayoutClasses.SIDEBAR_HIDDEN : undefined,
                !this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */) ? WorkbenchLayoutClasses.EDITOR_HIDDEN : undefined,
                !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) ? WorkbenchLayoutClasses.PANEL_HIDDEN : undefined,
                !this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) ? WorkbenchLayoutClasses.AUXILIARYBAR_HIDDEN : undefined,
                !this.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */) ? WorkbenchLayoutClasses.STATUSBAR_HIDDEN : undefined,
                this.windowState.runtime.fullscreen ? WorkbenchLayoutClasses.FULLSCREEN : undefined
            ]);
        }
        setSideBarHidden(hidden, skipLayout) {
            var _a;
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.container.classList.add(WorkbenchLayoutClasses.SIDEBAR_HIDDEN);
            }
            else {
                this.container.classList.remove(WorkbenchLayoutClasses.SIDEBAR_HIDDEN);
            }
            // If sidebar becomes hidden, also hide the current active Viewlet if any
            if (hidden && this.paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */)) {
                this.paneCompositeService.hideActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
                // Pass Focus to Editor or Panel if Sidebar is now hidden
                const activePanel = this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                if (this.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */) && activePanel) {
                    activePanel.focus();
                }
                else {
                    this.focus();
                }
            }
            // If sidebar becomes visible, show last active Viewlet or default viewlet
            else if (!hidden && !this.paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */)) {
                const viewletToOpen = this.paneCompositeService.getLastActivePaneCompositeId(0 /* ViewContainerLocation.Sidebar */);
                if (viewletToOpen) {
                    const viewlet = this.paneCompositeService.openPaneComposite(viewletToOpen, 0 /* ViewContainerLocation.Sidebar */, true);
                    if (!viewlet) {
                        this.paneCompositeService.openPaneComposite((_a = this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)) === null || _a === void 0 ? void 0 : _a.id, 0 /* ViewContainerLocation.Sidebar */, true);
                    }
                }
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.sideBarPartView, !hidden);
        }
        hasViews(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (!viewContainer) {
                return false;
            }
            const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
            if (!viewContainerModel) {
                return false;
            }
            return viewContainerModel.activeViewDescriptors.length >= 1;
        }
        adjustPartPositions(sideBarPosition, panelAlignment, panelPosition) {
            var _a, _b, _c, _d;
            // Move activity bar and side bars
            const sideBarSiblingToEditor = panelPosition !== 2 /* Position.BOTTOM */ || !(panelAlignment === 'center' || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'right') || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'left'));
            const auxiliaryBarSiblingToEditor = panelPosition !== 2 /* Position.BOTTOM */ || !(panelAlignment === 'center' || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'right') || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'left'));
            const preMovePanelWidth = !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) ? grid_1.Sizing.Invisible((_a = this.workbenchGrid.getViewCachedVisibleSize(this.panelPartView)) !== null && _a !== void 0 ? _a : this.panelPartView.minimumWidth) : this.workbenchGrid.getViewSize(this.panelPartView).width;
            const preMovePanelHeight = !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) ? grid_1.Sizing.Invisible((_b = this.workbenchGrid.getViewCachedVisibleSize(this.panelPartView)) !== null && _b !== void 0 ? _b : this.panelPartView.minimumHeight) : this.workbenchGrid.getViewSize(this.panelPartView).height;
            const preMoveSideBarSize = !this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? grid_1.Sizing.Invisible((_c = this.workbenchGrid.getViewCachedVisibleSize(this.sideBarPartView)) !== null && _c !== void 0 ? _c : this.sideBarPartView.minimumWidth) : this.workbenchGrid.getViewSize(this.sideBarPartView).width;
            const preMoveAuxiliaryBarSize = !this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) ? grid_1.Sizing.Invisible((_d = this.workbenchGrid.getViewCachedVisibleSize(this.auxiliaryBarPartView)) !== null && _d !== void 0 ? _d : this.auxiliaryBarPartView.minimumWidth) : this.workbenchGrid.getViewSize(this.auxiliaryBarPartView).width;
            if (sideBarPosition === 0 /* Position.LEFT */) {
                this.workbenchGrid.moveViewTo(this.activityBarPartView, [2, 0]);
                this.workbenchGrid.moveView(this.sideBarPartView, preMoveSideBarSize, sideBarSiblingToEditor ? this.editorPartView : this.activityBarPartView, sideBarSiblingToEditor ? 2 /* Direction.Left */ : 3 /* Direction.Right */);
                if (auxiliaryBarSiblingToEditor) {
                    this.workbenchGrid.moveView(this.auxiliaryBarPartView, preMoveAuxiliaryBarSize, this.editorPartView, 3 /* Direction.Right */);
                }
                else {
                    this.workbenchGrid.moveViewTo(this.auxiliaryBarPartView, [2, -1]);
                }
            }
            else {
                this.workbenchGrid.moveViewTo(this.activityBarPartView, [2, -1]);
                this.workbenchGrid.moveView(this.sideBarPartView, preMoveSideBarSize, sideBarSiblingToEditor ? this.editorPartView : this.activityBarPartView, sideBarSiblingToEditor ? 3 /* Direction.Right */ : 2 /* Direction.Left */);
                if (auxiliaryBarSiblingToEditor) {
                    this.workbenchGrid.moveView(this.auxiliaryBarPartView, preMoveAuxiliaryBarSize, this.editorPartView, 2 /* Direction.Left */);
                }
                else {
                    this.workbenchGrid.moveViewTo(this.auxiliaryBarPartView, [2, 0]);
                }
            }
            // We moved all the side parts based on the editor and ignored the panel
            // Now, we need to put the panel back in the right position when it is next to the editor
            if (panelPosition !== 2 /* Position.BOTTOM */) {
                this.workbenchGrid.moveView(this.panelPartView, preMovePanelWidth, this.editorPartView, panelPosition === 0 /* Position.LEFT */ ? 2 /* Direction.Left */ : 3 /* Direction.Right */);
                this.workbenchGrid.resizeView(this.panelPartView, {
                    height: preMovePanelHeight,
                    width: preMovePanelWidth
                });
            }
            // Moving views in the grid can cause them to re-distribute sizing unnecessarily
            // Resize visible parts to the width they were before the operation
            if (this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                this.workbenchGrid.resizeView(this.sideBarPartView, {
                    height: this.workbenchGrid.getViewSize(this.sideBarPartView).height,
                    width: preMoveSideBarSize
                });
            }
            if (this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                this.workbenchGrid.resizeView(this.auxiliaryBarPartView, {
                    height: this.workbenchGrid.getViewSize(this.auxiliaryBarPartView).height,
                    width: preMoveAuxiliaryBarSize
                });
            }
        }
        setPanelAlignment(alignment, skipLayout) {
            // Panel alignment only applies to a panel in the bottom position
            if (this.getPanelPosition() !== 2 /* Position.BOTTOM */) {
                this.setPanelPosition(2 /* Position.BOTTOM */);
            }
            // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
            if (alignment !== 'center' && this.isPanelMaximized()) {
                this.toggleMaximizedPanel();
            }
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_ALIGNMENT, alignment);
            this.adjustPartPositions(this.getSideBarPosition(), alignment, this.getPanelPosition());
            this._onDidChangePanelAlignment.fire(alignment);
        }
        setPanelHidden(hidden, skipLayout) {
            var _a;
            // Return if not initialized fully #105480
            if (!this.workbenchGrid) {
                return;
            }
            const wasHidden = !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */);
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN, hidden);
            const isPanelMaximized = this.isPanelMaximized();
            const panelOpensMaximized = this.panelOpensMaximized();
            // Adjust CSS
            if (hidden) {
                this.container.classList.add(WorkbenchLayoutClasses.PANEL_HIDDEN);
            }
            else {
                this.container.classList.remove(WorkbenchLayoutClasses.PANEL_HIDDEN);
            }
            // If panel part becomes hidden, also hide the current active panel if any
            let focusEditor = false;
            if (hidden && this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)) {
                this.paneCompositeService.hideActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                focusEditor = platform_1.isIOS ? false : true; // Do not auto focus on ios #127832
            }
            // If panel part becomes visible, show last active panel or default panel
            else if (!hidden && !this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)) {
                let panelToOpen = this.paneCompositeService.getLastActivePaneCompositeId(1 /* ViewContainerLocation.Panel */);
                // verify that the panel we try to open has views before we default to it
                // otherwise fall back to any view that has views still refs #111463
                if (!panelToOpen || !this.hasViews(panelToOpen)) {
                    panelToOpen = (_a = this.viewDescriptorService
                        .getViewContainersByLocation(1 /* ViewContainerLocation.Panel */)
                        .find(viewContainer => this.hasViews(viewContainer.id))) === null || _a === void 0 ? void 0 : _a.id;
                }
                if (panelToOpen) {
                    const focus = !skipLayout;
                    this.paneCompositeService.openPaneComposite(panelToOpen, 1 /* ViewContainerLocation.Panel */, focus);
                }
            }
            // If maximized and in process of hiding, unmaximize before hiding to allow caching of non-maximized size
            if (hidden && isPanelMaximized) {
                this.toggleMaximizedPanel();
            }
            // Don't proceed if we have already done this before
            if (wasHidden === hidden) {
                return;
            }
            // Propagate layout changes to grid
            this.workbenchGrid.setViewVisible(this.panelPartView, !hidden);
            // If in process of showing, toggle whether or not panel is maximized
            if (!hidden) {
                if (!skipLayout && isPanelMaximized !== panelOpensMaximized) {
                    this.toggleMaximizedPanel();
                }
            }
            else {
                // If in process of hiding, remember whether the panel is maximized or not
                this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_WAS_LAST_MAXIMIZED, isPanelMaximized);
            }
            if (focusEditor) {
                this.editorGroupService.activeGroup.focus(); // Pass focus to editor group if panel part is now hidden
            }
        }
        toggleMaximizedPanel() {
            const size = this.workbenchGrid.getViewSize(this.panelPartView);
            const panelPosition = this.getPanelPosition();
            const isMaximized = this.isPanelMaximized();
            if (!isMaximized) {
                if (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                    if (panelPosition === 2 /* Position.BOTTOM */) {
                        this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT, size.height);
                    }
                    else {
                        this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH, size.width);
                    }
                }
                this.setEditorHidden(true);
            }
            else {
                this.setEditorHidden(false);
                this.workbenchGrid.resizeView(this.panelPartView, {
                    width: panelPosition === 2 /* Position.BOTTOM */ ? size.width : this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH),
                    height: panelPosition === 2 /* Position.BOTTOM */ ? this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT) : size.height
                });
            }
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_WAS_LAST_MAXIMIZED, !isMaximized);
        }
        /**
         * Returns whether or not the panel opens maximized
         */
        panelOpensMaximized() {
            // The workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
            if (this.getPanelAlignment() !== 'center' && this.getPanelPosition() === 2 /* Position.BOTTOM */) {
                return false;
            }
            const panelOpensMaximized = (0, layoutService_1.panelOpensMaximizedFromString)(this.configurationService.getValue(layoutState_1.WorkbenchLayoutSettings.PANEL_OPENS_MAXIMIZED));
            const panelLastIsMaximized = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_WAS_LAST_MAXIMIZED);
            return panelOpensMaximized === 0 /* PanelOpensMaximizedOptions.ALWAYS */ || (panelOpensMaximized === 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */ && panelLastIsMaximized);
        }
        setAuxiliaryBarHidden(hidden, skipLayout) {
            var _a;
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.container.classList.add(WorkbenchLayoutClasses.AUXILIARYBAR_HIDDEN);
            }
            else {
                this.container.classList.remove(WorkbenchLayoutClasses.AUXILIARYBAR_HIDDEN);
            }
            // If auxiliary bar becomes hidden, also hide the current active pane composite if any
            if (hidden && this.paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */)) {
                this.paneCompositeService.hideActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */);
                // Pass Focus to Editor or Panel if Auxiliary Bar is now hidden
                const activePanel = this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                if (this.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */) && activePanel) {
                    activePanel.focus();
                }
                else {
                    this.focus();
                }
            }
            // If auxiliary bar becomes visible, show last active pane composite or default pane composite
            else if (!hidden && !this.paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */)) {
                let panelToOpen = this.paneCompositeService.getLastActivePaneCompositeId(2 /* ViewContainerLocation.AuxiliaryBar */);
                // verify that the panel we try to open has views before we default to it
                // otherwise fall back to any view that has views still refs #111463
                if (!panelToOpen || !this.hasViews(panelToOpen)) {
                    panelToOpen = (_a = this.viewDescriptorService
                        .getViewContainersByLocation(2 /* ViewContainerLocation.AuxiliaryBar */)
                        .find(viewContainer => this.hasViews(viewContainer.id))) === null || _a === void 0 ? void 0 : _a.id;
                }
                if (panelToOpen) {
                    const focus = !skipLayout;
                    this.paneCompositeService.openPaneComposite(panelToOpen, 2 /* ViewContainerLocation.AuxiliaryBar */, focus);
                }
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.auxiliaryBarPartView, !hidden);
        }
        setPartHidden(hidden, part) {
            switch (part) {
                case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                    return this.setActivityBarHidden(hidden);
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                    return this.setSideBarHidden(hidden);
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    return this.setEditorHidden(hidden);
                case "workbench.parts.banner" /* Parts.BANNER_PART */:
                    return this.setBannerHidden(hidden);
                case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                    return this.setAuxiliaryBarHidden(hidden);
                case "workbench.parts.panel" /* Parts.PANEL_PART */:
                    return this.setPanelHidden(hidden);
            }
        }
        hasWindowBorder() {
            return this.windowState.runtime.windowBorder;
        }
        getWindowBorderWidth() {
            return this.windowState.runtime.windowBorder ? 2 : 0;
        }
        getWindowBorderRadius() {
            return this.windowState.runtime.windowBorder && platform_1.isMacintosh ? '5px' : undefined;
        }
        isPanelMaximized() {
            // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
            return (this.getPanelAlignment() === 'center' || this.getPanelPosition() !== 2 /* Position.BOTTOM */) && !this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
        getSideBarPosition() {
            return this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_POSITON);
        }
        getPanelAlignment() {
            return this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_ALIGNMENT);
        }
        updateMenubarVisibility(skipLayout) {
            const shouldShowTitleBar = this.shouldShowTitleBar();
            if (!skipLayout && this.workbenchGrid && shouldShowTitleBar !== this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */)) {
                this.workbenchGrid.setViewVisible(this.titleBarPartView, shouldShowTitleBar);
            }
        }
        toggleMenuBar() {
            let currentVisibilityValue = (0, window_1.getMenuBarVisibility)(this.configurationService);
            if (typeof currentVisibilityValue !== 'string') {
                currentVisibilityValue = 'classic';
            }
            let newVisibilityValue;
            if (currentVisibilityValue === 'visible' || currentVisibilityValue === 'classic') {
                newVisibilityValue = (0, window_1.getTitleBarStyle)(this.configurationService) === 'native' ? 'toggle' : 'compact';
            }
            else {
                newVisibilityValue = 'classic';
            }
            this.configurationService.updateValue('window.menuBarVisibility', newVisibilityValue);
        }
        getPanelPosition() {
            return this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_POSITION);
        }
        setPanelPosition(position) {
            if (!this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                this.setPanelHidden(false);
            }
            const panelPart = this.getPart("workbench.parts.panel" /* Parts.PANEL_PART */);
            const oldPositionValue = (0, layoutService_1.positionToString)(this.getPanelPosition());
            const newPositionValue = (0, layoutService_1.positionToString)(position);
            // Adjust CSS
            const panelContainer = (0, types_1.assertIsDefined)(panelPart.getContainer());
            panelContainer.classList.remove(oldPositionValue);
            panelContainer.classList.add(newPositionValue);
            // Update Styles
            panelPart.updateStyles();
            // Layout
            const size = this.workbenchGrid.getViewSize(this.panelPartView);
            const sideBarSize = this.workbenchGrid.getViewSize(this.sideBarPartView);
            const auxiliaryBarSize = this.workbenchGrid.getViewSize(this.auxiliaryBarPartView);
            let editorHidden = !this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */);
            // Save last non-maximized size for panel before move
            if (newPositionValue !== oldPositionValue && !editorHidden) {
                // Save the current size of the panel for the new orthogonal direction
                // If moving down, save the width of the panel
                // Otherwise, save the height of the panel
                if (position === 2 /* Position.BOTTOM */) {
                    this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH, size.width);
                }
                else if ((0, layoutService_1.positionFromString)(oldPositionValue) === 2 /* Position.BOTTOM */) {
                    this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT, size.height);
                }
            }
            if (position === 2 /* Position.BOTTOM */ && this.getPanelAlignment() !== 'center' && editorHidden) {
                this.toggleMaximizedPanel();
                editorHidden = false;
            }
            this.stateModel.setRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_POSITION, position);
            const sideBarVisible = this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const auxiliaryBarVisible = this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            if (position === 2 /* Position.BOTTOM */) {
                this.workbenchGrid.moveView(this.panelPartView, editorHidden ? size.height : this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT), this.editorPartView, 1 /* Direction.Down */);
            }
            else if (position === 1 /* Position.RIGHT */) {
                this.workbenchGrid.moveView(this.panelPartView, editorHidden ? size.width : this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH), this.editorPartView, 3 /* Direction.Right */);
            }
            else {
                this.workbenchGrid.moveView(this.panelPartView, editorHidden ? size.width : this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH), this.editorPartView, 2 /* Direction.Left */);
            }
            // Reset sidebar to original size before shifting the panel
            this.workbenchGrid.resizeView(this.sideBarPartView, sideBarSize);
            if (!sideBarVisible) {
                this.setSideBarHidden(true);
            }
            this.workbenchGrid.resizeView(this.auxiliaryBarPartView, auxiliaryBarSize);
            if (!auxiliaryBarVisible) {
                this.setAuxiliaryBarHidden(true);
            }
            if (position === 2 /* Position.BOTTOM */) {
                this.adjustPartPositions(this.getSideBarPosition(), this.getPanelAlignment(), position);
            }
            this._onDidChangePanelPosition.fire(newPositionValue);
        }
        isWindowMaximized() {
            return this.windowState.runtime.maximized;
        }
        updateWindowMaximizedState(maximized) {
            this.container.classList.toggle(WorkbenchLayoutClasses.MAXIMIZED, maximized);
            if (this.windowState.runtime.maximized === maximized) {
                return;
            }
            this.windowState.runtime.maximized = maximized;
            this.updateWindowBorder();
            this._onDidChangeWindowMaximized.fire(maximized);
        }
        getVisibleNeighborPart(part, direction) {
            if (!this.workbenchGrid) {
                return undefined;
            }
            if (!this.isVisible(part)) {
                return undefined;
            }
            const neighborViews = this.workbenchGrid.getNeighborViews(this.getPart(part), direction, false);
            if (!neighborViews) {
                return undefined;
            }
            for (const neighborView of neighborViews) {
                const neighborPart = ["workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, "workbench.parts.editor" /* Parts.EDITOR_PART */, "workbench.parts.panel" /* Parts.PANEL_PART */, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */]
                    .find(partId => this.getPart(partId) === neighborView && this.isVisible(partId));
                if (neighborPart !== undefined) {
                    return neighborPart;
                }
            }
            return undefined;
        }
        arrangeEditorNodes(nodes, availableHeight, availableWidth) {
            if (!nodes.sideBar && !nodes.auxiliaryBar) {
                nodes.editor.size = availableHeight;
                return nodes.editor;
            }
            const result = [nodes.editor];
            nodes.editor.size = availableWidth;
            if (nodes.sideBar) {
                if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_POSITON) === 0 /* Position.LEFT */) {
                    result.splice(0, 0, nodes.sideBar);
                }
                else {
                    result.push(nodes.sideBar);
                }
                nodes.editor.size -= this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN) ? 0 : nodes.sideBar.size;
            }
            if (nodes.auxiliaryBar) {
                if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_POSITON) === 1 /* Position.RIGHT */) {
                    result.splice(0, 0, nodes.auxiliaryBar);
                }
                else {
                    result.push(nodes.auxiliaryBar);
                }
                nodes.editor.size -= this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN) ? 0 : nodes.auxiliaryBar.size;
            }
            return {
                type: 'branch',
                data: result,
                size: availableHeight
            };
        }
        arrangeMiddleSectionNodes(nodes, availableWidth, availableHeight) {
            const activityBarSize = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN) ? 0 : nodes.activityBar.size;
            const sideBarSize = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN) ? 0 : nodes.sideBar.size;
            const auxiliaryBarSize = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN) ? 0 : nodes.auxiliaryBar.size;
            const panelSize = this.stateModel.getInitializationValue(layoutState_1.LayoutStateKeys.PANEL_SIZE) ? 0 : nodes.panel.size;
            const result = [];
            if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_POSITION) !== 2 /* Position.BOTTOM */) {
                result.push(nodes.editor);
                nodes.editor.size = availableWidth - activityBarSize - sideBarSize - panelSize - auxiliaryBarSize;
                if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_POSITION) === 1 /* Position.RIGHT */) {
                    result.push(nodes.panel);
                }
                else {
                    result.splice(0, 0, nodes.panel);
                }
                if (this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_POSITON) === 0 /* Position.LEFT */) {
                    result.push(nodes.auxiliaryBar);
                    result.splice(0, 0, nodes.sideBar);
                    result.splice(0, 0, nodes.activityBar);
                }
                else {
                    result.splice(0, 0, nodes.auxiliaryBar);
                    result.push(nodes.sideBar);
                    result.push(nodes.activityBar);
                }
            }
            else {
                const panelAlignment = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_ALIGNMENT);
                const sideBarPosition = this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_POSITON);
                const sideBarNextToEditor = !(panelAlignment === 'center' || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'right') || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'left'));
                const auxiliaryBarNextToEditor = !(panelAlignment === 'center' || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'right') || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'left'));
                const editorSectionWidth = availableWidth - activityBarSize - (sideBarNextToEditor ? 0 : sideBarSize) - (auxiliaryBarNextToEditor ? 0 : auxiliaryBarSize);
                result.push({
                    type: 'branch',
                    data: [this.arrangeEditorNodes({
                            editor: nodes.editor,
                            sideBar: sideBarNextToEditor ? nodes.sideBar : undefined,
                            auxiliaryBar: auxiliaryBarNextToEditor ? nodes.auxiliaryBar : undefined
                        }, availableHeight - panelSize, editorSectionWidth), nodes.panel],
                    size: editorSectionWidth
                });
                if (!sideBarNextToEditor) {
                    if (sideBarPosition === 0 /* Position.LEFT */) {
                        result.splice(0, 0, nodes.sideBar);
                    }
                    else {
                        result.push(nodes.sideBar);
                    }
                }
                if (!auxiliaryBarNextToEditor) {
                    if (sideBarPosition === 1 /* Position.RIGHT */) {
                        result.splice(0, 0, nodes.auxiliaryBar);
                    }
                    else {
                        result.push(nodes.auxiliaryBar);
                    }
                }
                if (sideBarPosition === 0 /* Position.LEFT */) {
                    result.splice(0, 0, nodes.activityBar);
                }
                else {
                    result.push(nodes.activityBar);
                }
            }
            return result;
        }
        createGridDescriptor() {
            const { width, height } = this.stateModel.getInitializationValue(layoutState_1.LayoutStateKeys.GRID_SIZE);
            const sideBarSize = this.stateModel.getInitializationValue(layoutState_1.LayoutStateKeys.SIDEBAR_SIZE);
            const auxiliaryBarPartSize = this.stateModel.getInitializationValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_SIZE);
            const panelSize = this.stateModel.getInitializationValue(layoutState_1.LayoutStateKeys.PANEL_SIZE);
            const titleBarHeight = this.titleBarPartView.minimumHeight;
            const bannerHeight = this.bannerPartView.minimumHeight;
            const statusBarHeight = this.statusBarPartView.minimumHeight;
            const activityBarWidth = this.activityBarPartView.minimumWidth;
            const middleSectionHeight = height - titleBarHeight - statusBarHeight;
            const activityBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */ },
                size: activityBarWidth,
                visible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN)
            };
            const sideBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */ },
                size: sideBarSize,
                visible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN)
            };
            const auxiliaryBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */ },
                size: auxiliaryBarPartSize,
                visible: this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)
            };
            const editorNode = {
                type: 'leaf',
                data: { type: "workbench.parts.editor" /* Parts.EDITOR_PART */ },
                size: 0,
                visible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.EDITOR_HIDDEN)
            };
            const panelNode = {
                type: 'leaf',
                data: { type: "workbench.parts.panel" /* Parts.PANEL_PART */ },
                size: panelSize,
                visible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN)
            };
            const middleSection = this.arrangeMiddleSectionNodes({
                activityBar: activityBarNode,
                auxiliaryBar: auxiliaryBarNode,
                editor: editorNode,
                panel: panelNode,
                sideBar: sideBarNode
            }, width, middleSectionHeight);
            const result = {
                root: {
                    type: 'branch',
                    size: width,
                    data: [
                        {
                            type: 'leaf',
                            data: { type: "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */ },
                            size: titleBarHeight,
                            visible: this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */)
                        },
                        {
                            type: 'leaf',
                            data: { type: "workbench.parts.banner" /* Parts.BANNER_PART */ },
                            size: bannerHeight,
                            visible: false
                        },
                        {
                            type: 'branch',
                            data: middleSection,
                            size: middleSectionHeight
                        },
                        {
                            type: 'leaf',
                            data: { type: "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */ },
                            size: statusBarHeight,
                            visible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.STATUSBAR_HIDDEN)
                        }
                    ]
                },
                orientation: 0 /* Orientation.VERTICAL */,
                width,
                height
            };
            const layoutDescriptor = {
                activityBarVisible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.ACTIVITYBAR_HIDDEN),
                sideBarVisible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_HIDDEN),
                auxiliaryBarVisible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.AUXILIARYBAR_HIDDEN),
                panelVisible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_HIDDEN),
                statusbarVisible: !this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.STATUSBAR_HIDDEN),
                sideBarPosition: (0, layoutService_1.positionToString)(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.SIDEBAR_POSITON)),
                panelPosition: (0, layoutService_1.positionToString)(this.stateModel.getRuntimeValue(layoutState_1.LayoutStateKeys.PANEL_POSITION)),
            };
            this.telemetryService.publicLog2('startupLayout', layoutDescriptor);
            return result;
        }
        dispose() {
            super.dispose();
            this.disposed = true;
        }
    }
    exports.Layout = Layout;
    function getZenModeConfiguration(configurationService) {
        return configurationService.getValue(layoutState_1.WorkbenchLayoutSettings.ZEN_MODE_CONFIG);
    }
});
//# sourceMappingURL=layout.js.map