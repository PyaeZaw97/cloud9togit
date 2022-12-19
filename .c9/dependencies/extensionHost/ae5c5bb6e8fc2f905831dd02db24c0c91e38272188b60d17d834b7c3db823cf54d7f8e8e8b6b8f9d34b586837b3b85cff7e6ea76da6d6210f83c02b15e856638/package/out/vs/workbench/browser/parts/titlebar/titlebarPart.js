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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/workbench/browser/part", "vs/base/browser/browser", "vs/platform/window/common/window", "vs/platform/contextview/browser/contextView", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/workbench/services/environment/browser/environmentService", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/platform", "vs/base/common/color", "vs/base/common/strings", "vs/base/browser/dom", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels", "vs/platform/label/common/label", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/async", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/host/browser/host", "vs/platform/product/common/productService", "vs/base/common/network", "vs/base/common/types", "vs/base/common/codicons", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/theme/common/iconRegistry", "vs/base/browser/ui/toolbar/toolbar", "vs/css!./media/titlebarpart"], function (require, exports, nls_1, resources_1, part_1, browser_1, window_1, contextView_1, mouseEvent_1, actions_1, configuration_1, editorService_1, lifecycle_1, editor_1, environmentService_1, workspace_1, themeService_1, theme_1, platform_1, color_1, strings_1, dom_1, menubarControl_1, instantiation_1, labels_1, label_1, event_1, storage_1, layoutService_1, async_1, menuEntryActionViewItem_1, actions_2, contextkey_1, host_1, productService_1, network_1, types_1, codicons_1, virtualWorkspace_1, iconRegistry_1, toolbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitlebarPart = void 0;
    let TitlebarPart = class TitlebarPart extends part_1.Part {
        constructor(contextMenuService, configurationService, editorService, environmentService, contextService, instantiationService, themeService, labelService, storageService, layoutService, menuService, contextKeyService, hostService, productService) {
            super("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.hostService = hostService;
            this.productService = productService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            //#endregion
            this._onMenubarVisibilityChange = this._register(new event_1.Emitter());
            this.onMenubarVisibilityChange = this._onMenubarVisibilityChange.event;
            this.isInactive = false;
            this.properties = { isPure: true, isAdmin: false, prefix: undefined };
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.titleUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateTitle(), 0));
            this.contextMenu = this._register(menuService.createMenu(actions_2.MenuId.TitleBarContext, contextKeyService));
            this.titleBarStyle = (0, window_1.getTitleBarStyle)(this.configurationService);
            this.registerListeners();
        }
        get minimumHeight() { return 30 / (this.currentMenubarVisibility === 'hidden' ? (0, browser_1.getZoomFactor)() : 1); }
        get maximumHeight() { return this.minimumHeight; }
        registerListeners() {
            this._register(this.hostService.onDidChangeFocus(focused => focused ? this.onFocus() : this.onBlur()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChanged(e)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChange()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkspaceName(() => this.titleUpdater.schedule()));
            this._register(this.labelService.onDidChangeFormatters(() => this.titleUpdater.schedule()));
        }
        onBlur() {
            this.isInactive = true;
            this.updateStyles();
        }
        onFocus() {
            this.isInactive = false;
            this.updateStyles();
        }
        onConfigurationChanged(event) {
            if (event.affectsConfiguration('window.title') || event.affectsConfiguration('window.titleSeparator')) {
                this.titleUpdater.schedule();
            }
            if (this.titleBarStyle !== 'native' && (!platform_1.isMacintosh || platform_1.isWeb)) {
                if (event.affectsConfiguration('window.menuBarVisibility')) {
                    if (this.currentMenubarVisibility === 'compact') {
                        this.uninstallMenubar();
                    }
                    else {
                        this.installMenubar();
                    }
                }
            }
            if (this.titleBarStyle !== 'native' && this.windowControls && event.affectsConfiguration('workbench.layoutControl.enabled')) {
                this.windowControls.classList.toggle('show-layout-control', this.layoutControlEnabled);
            }
        }
        onMenubarVisibilityChanged(visible) {
            if (platform_1.isWeb || platform_1.isWindows || platform_1.isLinux) {
                this.adjustTitleMarginToCenter();
                this._onMenubarVisibilityChange.fire(visible);
            }
        }
        onActiveEditorChange() {
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Calculate New Window Title
            this.titleUpdater.schedule();
            // Apply listener for dirty and label changes
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                this.activeEditorListeners.add(activeEditor.onDidChangeDirty(() => this.titleUpdater.schedule()));
                this.activeEditorListeners.add(activeEditor.onDidChangeLabel(() => this.titleUpdater.schedule()));
            }
        }
        doUpdateTitle() {
            const title = this.getWindowTitle();
            // Always set the native window title to identify us properly to the OS
            let nativeTitle = title;
            if (!(0, strings_1.trim)(nativeTitle)) {
                nativeTitle = this.productService.nameLong;
            }
            window.document.title = nativeTitle;
            // Apply custom title if we can
            if (this.title) {
                this.title.innerText = title;
            }
            else {
                this.pendingTitle = title;
            }
            if ((platform_1.isWeb || platform_1.isWindows || platform_1.isLinux) && this.title) {
                if (this.lastLayoutDimensions) {
                    this.updateLayout(this.lastLayoutDimensions);
                }
            }
        }
        getWindowTitle() {
            let title = this.doGetWindowTitle();
            if (this.properties.prefix) {
                title = `${this.properties.prefix} ${title || this.productService.nameLong}`;
            }
            if (this.properties.isAdmin) {
                title = `${title || this.productService.nameLong} ${TitlebarPart.NLS_USER_IS_ADMIN}`;
            }
            if (!this.properties.isPure) {
                title = `${title || this.productService.nameLong} ${TitlebarPart.NLS_UNSUPPORTED}`;
            }
            if (this.environmentService.isExtensionDevelopment) {
                title = `${TitlebarPart.NLS_EXTENSION_HOST} - ${title || this.productService.nameLong}`;
            }
            // Replace non-space whitespace
            title = title.replace(/[^\S ]/g, ' ');
            return title;
        }
        updateProperties(properties) {
            const isAdmin = typeof properties.isAdmin === 'boolean' ? properties.isAdmin : this.properties.isAdmin;
            const isPure = typeof properties.isPure === 'boolean' ? properties.isPure : this.properties.isPure;
            const prefix = typeof properties.prefix === 'string' ? properties.prefix : this.properties.prefix;
            if (isAdmin !== this.properties.isAdmin || isPure !== this.properties.isPure || prefix !== this.properties.prefix) {
                this.properties.isAdmin = isAdmin;
                this.properties.isPure = isPure;
                this.properties.prefix = prefix;
                this.titleUpdater.schedule();
            }
        }
        /**
         * Possible template values:
         *
         * {activeEditorLong}: e.g. /Users/Development/myFolder/myFileFolder/myFile.txt
         * {activeEditorMedium}: e.g. myFolder/myFileFolder/myFile.txt
         * {activeEditorShort}: e.g. myFile.txt
         * {activeFolderLong}: e.g. /Users/Development/myFolder/myFileFolder
         * {activeFolderMedium}: e.g. myFolder/myFileFolder
         * {activeFolderShort}: e.g. myFileFolder
         * {rootName}: e.g. myFolder1, myFolder2, myFolder3
         * {rootPath}: e.g. /Users/Development
         * {folderName}: e.g. myFolder
         * {folderPath}: e.g. /Users/Development/myFolder
         * {appName}: e.g. VS Code
         * {remoteName}: e.g. SSH
         * {dirty}: indicator
         * {separator}: conditional separator
         */
        doGetWindowTitle() {
            const editor = this.editorService.activeEditor;
            const workspace = this.contextService.getWorkspace();
            // Compute root
            let root;
            if (workspace.configuration) {
                root = workspace.configuration;
            }
            else if (workspace.folders.length) {
                root = workspace.folders[0].uri;
            }
            // Compute active editor folder
            const editorResource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            let editorFolderResource = editorResource ? (0, resources_1.dirname)(editorResource) : undefined;
            if ((editorFolderResource === null || editorFolderResource === void 0 ? void 0 : editorFolderResource.path) === '.') {
                editorFolderResource = undefined;
            }
            // Compute folder resource
            // Single Root Workspace: always the root single workspace in this case
            // Otherwise: root folder of the currently active file if any
            let folder = undefined;
            if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                folder = workspace.folders[0];
            }
            else if (editorResource) {
                folder = (0, types_1.withNullAsUndefined)(this.contextService.getWorkspaceFolder(editorResource));
            }
            // Compute remote
            // vscode-remtoe: use as is
            // otherwise figure out if we have a virtual folder opened
            let remoteName = undefined;
            if (this.environmentService.remoteAuthority && !platform_1.isWeb) {
                remoteName = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, this.environmentService.remoteAuthority);
            }
            else {
                const virtualWorkspaceLocation = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(workspace);
                if (virtualWorkspaceLocation) {
                    remoteName = this.labelService.getHostLabel(virtualWorkspaceLocation.scheme, virtualWorkspaceLocation.authority);
                }
            }
            // Variables
            const activeEditorShort = editor ? editor.getTitle(0 /* Verbosity.SHORT */) : '';
            const activeEditorMedium = editor ? editor.getTitle(1 /* Verbosity.MEDIUM */) : activeEditorShort;
            const activeEditorLong = editor ? editor.getTitle(2 /* Verbosity.LONG */) : activeEditorMedium;
            const activeFolderShort = editorFolderResource ? (0, resources_1.basename)(editorFolderResource) : '';
            const activeFolderMedium = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource, { relative: true }) : '';
            const activeFolderLong = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource) : '';
            const rootName = this.labelService.getWorkspaceLabel(workspace);
            const rootPath = root ? this.labelService.getUriLabel(root) : '';
            const folderName = folder ? folder.name : '';
            const folderPath = folder ? this.labelService.getUriLabel(folder.uri) : '';
            const dirty = (editor === null || editor === void 0 ? void 0 : editor.isDirty()) && !editor.isSaving() ? TitlebarPart.TITLE_DIRTY : '';
            const appName = this.productService.nameLong;
            const separator = this.configurationService.getValue('window.titleSeparator');
            const titleTemplate = this.configurationService.getValue('window.title');
            return (0, labels_1.template)(titleTemplate, {
                activeEditorShort,
                activeEditorLong,
                activeEditorMedium,
                activeFolderShort,
                activeFolderMedium,
                activeFolderLong,
                rootName,
                rootPath,
                folderName,
                folderPath,
                dirty,
                appName,
                remoteName,
                separator: { label: separator }
            });
        }
        uninstallMenubar() {
            if (this.customMenubar) {
                this.customMenubar.dispose();
                this.customMenubar = undefined;
            }
            if (this.menubar) {
                this.menubar.remove();
                this.menubar = undefined;
            }
        }
        installMenubar() {
            // If the menubar is already installed, skip
            if (this.menubar) {
                return;
            }
            this.customMenubar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
            this.menubar = this.rootContainer.insertBefore((0, dom_1.$)('div.menubar'), this.title);
            this.menubar.setAttribute('role', 'menubar');
            this.customMenubar.create(this.menubar);
            this._register(this.customMenubar.onVisibilityChange(e => this.onMenubarVisibilityChanged(e)));
        }
        createContentArea(parent) {
            var _a;
            this.element = parent;
            this.rootContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.titlebar-container'));
            // App Icon (Native Windows/Linux and Web)
            if (!platform_1.isMacintosh || platform_1.isWeb) {
                this.appIcon = (0, dom_1.prepend)(this.rootContainer, (0, dom_1.$)('a.window-appicon'));
                // Web-only home indicator and menu
                if (platform_1.isWeb) {
                    const homeIndicator = (_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.homeIndicator;
                    if (homeIndicator) {
                        const icon = (0, iconRegistry_1.getIconRegistry)().getIcon(homeIndicator.icon) ? { id: homeIndicator.icon } : codicons_1.Codicon.code;
                        this.appIcon.setAttribute('href', homeIndicator.href);
                        this.appIcon.classList.add(...themeService_1.ThemeIcon.asClassNameArray(icon));
                        this.appIconBadge = document.createElement('div');
                        this.appIconBadge.classList.add('home-bar-icon-badge');
                        this.appIcon.appendChild(this.appIconBadge);
                    }
                }
            }
            // Menubar: install a custom menu bar depending on configuration
            // and when not in activity bar
            if (this.titleBarStyle !== 'native'
                && (!platform_1.isMacintosh || platform_1.isWeb)
                && this.currentMenubarVisibility !== 'compact') {
                this.installMenubar();
            }
            // Title
            this.title = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('div.window-title'));
            if (this.pendingTitle) {
                this.title.innerText = this.pendingTitle;
            }
            else {
                this.titleUpdater.schedule();
            }
            if (this.titleBarStyle !== 'native') {
                this.windowControls = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('div.window-controls-container'));
                this.windowControls.classList.toggle('show-layout-control', this.layoutControlEnabled);
                const layoutDropdownContainer = (0, dom_1.append)(this.windowControls, (0, dom_1.$)('div.layout-dropdown-container'));
                this.layoutToolbar = new toolbar_1.ToolBar(layoutDropdownContainer, this.contextMenuService, {
                    actionViewItemProvider: action => {
                        return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action);
                    },
                    allowContextMenu: true
                });
                this._register((0, dom_1.addDisposableListener)(layoutDropdownContainer, dom_1.EventType.CONTEXT_MENU, e => {
                    dom_1.EventHelper.stop(e);
                    this.onLayoutControlContextMenu(e, layoutDropdownContainer);
                }));
                const menu = this._register(this.menuService.createMenu(actions_2.MenuId.LayoutControlMenu, this.contextKeyService));
                const updateLayoutMenu = () => {
                    if (!this.layoutToolbar) {
                        return;
                    }
                    const actions = [];
                    const toDispose = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, { primary: [], secondary: actions });
                    this.layoutToolbar.setActions(actions);
                    toDispose.dispose();
                };
                menu.onDidChange(updateLayoutMenu);
                updateLayoutMenu();
            }
            // Context menu on title
            [dom_1.EventType.CONTEXT_MENU, dom_1.EventType.MOUSE_DOWN].forEach(event => {
                this._register((0, dom_1.addDisposableListener)(this.title, event, e => {
                    if (e.type === dom_1.EventType.CONTEXT_MENU || e.metaKey) {
                        dom_1.EventHelper.stop(e);
                        this.onContextMenu(e);
                    }
                }));
            });
            // Since the title area is used to drag the window, we do not want to steal focus from the
            // currently active element. So we restore focus after a timeout back to where it was.
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.MOUSE_DOWN, e => {
                if (e.target && this.menubar && (0, dom_1.isAncestor)(e.target, this.menubar)) {
                    return;
                }
                if (e.target && this.layoutToolbar && (0, dom_1.isAncestor)(e.target, this.layoutToolbar.getElement())) {
                    return;
                }
                const active = document.activeElement;
                setTimeout(() => {
                    if (active instanceof HTMLElement) {
                        active.focus();
                    }
                }, 0 /* need a timeout because we are in capture phase */);
            }, true /* use capture to know the currently active element properly */));
            this.updateStyles();
            return this.element;
        }
        updateStyles() {
            super.updateStyles();
            // Part container
            if (this.element) {
                if (this.isInactive) {
                    this.element.classList.add('inactive');
                }
                else {
                    this.element.classList.remove('inactive');
                }
                const titleBackground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_BACKGROUND : theme_1.TITLE_BAR_ACTIVE_BACKGROUND, (color, theme) => {
                    // LCD Rendering Support: the title bar part is a defining its own GPU layer.
                    // To benefit from LCD font rendering, we must ensure that we always set an
                    // opaque background color. As such, we compute an opaque color given we know
                    // the background color is the workbench background.
                    return color.isOpaque() ? color : color.makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
                }) || '';
                this.element.style.backgroundColor = titleBackground;
                if (this.appIconBadge) {
                    this.appIconBadge.style.backgroundColor = titleBackground;
                }
                if (titleBackground && color_1.Color.fromHex(titleBackground).isLighter()) {
                    this.element.classList.add('light');
                }
                else {
                    this.element.classList.remove('light');
                }
                const titleForeground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_FOREGROUND : theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
                this.element.style.color = titleForeground || '';
                const titleBorder = this.getColor(theme_1.TITLE_BAR_BORDER);
                this.element.style.borderBottom = titleBorder ? `1px solid ${titleBorder}` : '';
            }
        }
        onContextMenu(e) {
            // Find target anchor
            const event = new mouseEvent_1.StandardMouseEvent(e);
            const anchor = { x: event.posx, y: event.posy };
            // Fill in contributed actions
            const actions = [];
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.contextMenu, undefined, actions);
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
            });
        }
        onLayoutControlContextMenu(e, el) {
            // Find target anchor
            const event = new mouseEvent_1.StandardMouseEvent(e);
            const anchor = { x: event.posx, y: event.posy };
            const actions = [];
            actions.push((0, actions_1.toAction)({
                id: 'layoutControl.hide',
                label: (0, nls_1.localize)('layoutControl.hide', "Hide Layout Control"),
                run: () => {
                    this.configurationService.updateValue('workbench.layoutControl.enabled', false);
                }
            }));
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                domForShadowRoot: el
            });
        }
        adjustTitleMarginToCenter() {
            if (this.customMenubar && this.menubar) {
                const leftMarker = (this.appIcon ? this.appIcon.clientWidth : 0) + this.menubar.clientWidth + 10;
                const rightMarker = this.element.clientWidth - 10;
                // Not enough space to center the titlebar within window,
                // Center between menu and window controls
                if (leftMarker > (this.element.clientWidth - this.title.clientWidth) / 2 ||
                    rightMarker < (this.element.clientWidth + this.title.clientWidth) / 2) {
                    this.title.style.position = '';
                    this.title.style.left = '';
                    this.title.style.transform = '';
                    return;
                }
            }
            this.title.style.position = 'absolute';
            this.title.style.left = '50%';
            this.title.style.transform = 'translate(-50%, 0)';
        }
        get currentMenubarVisibility() {
            return (0, window_1.getMenuBarVisibility)(this.configurationService);
        }
        get layoutControlEnabled() {
            return this.configurationService.getValue('workbench.layoutControl.enabled');
        }
        updateLayout(dimension) {
            this.lastLayoutDimensions = dimension;
            if ((0, window_1.getTitleBarStyle)(this.configurationService) === 'custom') {
                // Only prevent zooming behavior on macOS or when the menubar is not visible
                if ((!platform_1.isWeb && platform_1.isMacintosh) || this.currentMenubarVisibility === 'hidden') {
                    this.rootContainer.style.height = `${100.0 * (0, browser_1.getZoomFactor)()}%`;
                    this.rootContainer.style.width = `${100.0 * (0, browser_1.getZoomFactor)()}%`;
                    this.rootContainer.style.transform = `scale(${1 / (0, browser_1.getZoomFactor)()})`;
                }
                else {
                    this.rootContainer.style.height = '100%';
                    this.rootContainer.style.width = '100%';
                    this.rootContainer.style.transform = '';
                }
                (0, dom_1.runAtThisOrScheduleAtNextAnimationFrame)(() => this.adjustTitleMarginToCenter());
                if (this.customMenubar) {
                    const menubarDimension = new dom_1.Dimension(0, dimension.height);
                    this.customMenubar.layout(menubarDimension);
                }
            }
        }
        layout(width, height) {
            this.updateLayout(new dom_1.Dimension(width, height));
            super.layoutContents(width, height);
        }
        toJSON() {
            return {
                type: "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */
            };
        }
    };
    TitlebarPart.NLS_UNSUPPORTED = (0, nls_1.localize)('patchedWindowTitle', "[Unsupported]");
    TitlebarPart.NLS_USER_IS_ADMIN = platform_1.isWindows ? (0, nls_1.localize)('userIsAdmin', "[Administrator]") : (0, nls_1.localize)('userIsSudo', "[Superuser]");
    TitlebarPart.NLS_EXTENSION_HOST = (0, nls_1.localize)('devExtensionWindowTitlePrefix', "[Extension Development Host]");
    TitlebarPart.TITLE_DIRTY = '\u25cf ';
    TitlebarPart = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, editorService_1.IEditorService),
        __param(3, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, label_1.ILabelService),
        __param(8, storage_1.IStorageService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, actions_2.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, host_1.IHostService),
        __param(13, productService_1.IProductService)
    ], TitlebarPart);
    exports.TitlebarPart = TitlebarPart;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const titlebarActiveFg = theme.getColor(theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
        if (titlebarActiveFg) {
            collector.addRule(`
		.monaco-workbench .part.titlebar .window-controls-container .window-icon {
			color: ${titlebarActiveFg};
		}
		`);
        }
        const titlebarInactiveFg = theme.getColor(theme_1.TITLE_BAR_INACTIVE_FOREGROUND);
        if (titlebarInactiveFg) {
            collector.addRule(`
		.monaco-workbench .part.titlebar.inactive .window-controls-container .window-icon {
				color: ${titlebarInactiveFg};
			}
		`);
        }
    });
});
//# sourceMappingURL=titlebarPart.js.map