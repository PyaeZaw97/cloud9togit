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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/common/contextkeys", "vs/workbench/browser/parts/compositePart", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/panel/panelActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/compositeBar", "vs/workbench/browser/parts/compositeBarActions", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/common/views", "vs/workbench/browser/dnd", "vs/workbench/browser/panecomposite", "vs/base/browser/ui/toolbar/toolbar", "vs/workbench/browser/actions", "vs/platform/actions/common/actions", "vs/base/common/hash", "vs/base/common/uri", "vs/workbench/services/profiles/common/profileStorageRegistry", "vs/css!./media/basepanelpart", "vs/css!./media/panelpart"], function (require, exports, nls_1, actions_1, event_1, platform_1, actionbar_1, contextkeys_1, compositePart_1, layoutService_1, storage_1, contextView_1, telemetry_1, keybinding_1, instantiation_1, panelActions_1, themeService_1, theme_1, colorRegistry_1, compositeBar_1, compositeBarActions_1, notification_1, dom_1, lifecycle_1, contextkey_1, types_1, extensions_1, views_1, dnd_1, panecomposite_1, toolbar_1, actions_2, actions_3, hash_1, uri_1, profileStorageRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanelPart = exports.BasePanelPart = void 0;
    let BasePanelPart = class BasePanelPart extends compositePart_1.CompositePart {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, partId, activePanelSettingsKey, pinnedPanelsKey, placeholdeViewContainersKey, panelRegistryId, backgroundColor, viewContainerLocation, activePanelContextKey, panelFocusContextKey, panelOptions) {
            var _a;
            super(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, platform_1.Registry.as(panelRegistryId), activePanelSettingsKey, ((_a = viewDescriptorService.getDefaultViewContainer(viewContainerLocation)) === null || _a === void 0 ? void 0 : _a.id) || '', 'panel', 'panel', undefined, partId, panelOptions);
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            this.partId = partId;
            this.pinnedPanelsKey = pinnedPanelsKey;
            this.placeholdeViewContainersKey = placeholdeViewContainersKey;
            this.backgroundColor = backgroundColor;
            this.viewContainerLocation = viewContainerLocation;
            this.activePanelContextKey = activePanelContextKey;
            this.panelFocusContextKey = panelFocusContextKey;
            this.panelOptions = panelOptions;
            //#region IView
            this.minimumWidth = 300;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 77;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.snap = true;
            this.onDidPaneCompositeClose = this.onDidCompositeClose.event;
            this.compositeActions = new Map();
            this.panelDisposables = new Map();
            this.blockOpeningPanel = false;
            this.extensionsRegistered = false;
            this.enabledViewContainersContextKeys = new Map();
            this.panelRegistry = platform_1.Registry.as(panelRegistryId);
            this.dndHandler = new compositeBar_1.CompositeDragAndDrop(this.viewDescriptorService, this.viewContainerLocation, (id, focus) => this.openPaneComposite(id, focus).then(panel => panel || null), (from, to, before) => this.compositeBar.move(from, to, before === null || before === void 0 ? void 0 : before.horizontallyBefore), () => this.compositeBar.getCompositeBarItems());
            this.compositeBar = this._register(this.instantiationService.createInstance(compositeBar_1.CompositeBar, this.getCachedPanels(), {
                icon: !!this.panelOptions.useIcons,
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                activityHoverOptions: this.getActivityHoverOptions(),
                openComposite: (compositeId, preserveFocus) => this.openPaneComposite(compositeId, !preserveFocus).then(panel => panel || null),
                getActivityAction: compositeId => this.getCompositeActions(compositeId).activityAction,
                getCompositePinnedAction: compositeId => this.getCompositeActions(compositeId).pinnedAction,
                getOnCompositeClickAction: compositeId => this.instantiationService.createInstance(panelActions_1.PanelActivityAction, (0, types_1.assertIsDefined)(this.getPaneComposite(compositeId)), this.viewContainerLocation),
                fillExtraContextMenuActions: actions => this.fillExtraContextMenuActions(actions),
                getContextMenuActionsForComposite: compositeId => this.getContextMenuActionsForComposite(compositeId),
                getDefaultCompositeId: () => { var _a; return (_a = viewDescriptorService.getDefaultViewContainer(this.viewContainerLocation)) === null || _a === void 0 ? void 0 : _a.id; },
                hidePart: () => this.layoutService.setPartHidden(true, this.partId),
                dndHandler: this.dndHandler,
                compositeSize: 0,
                overflowActionSize: 44,
                colors: theme => ({
                    activeBackgroundColor: theme.getColor(this.backgroundColor),
                    inactiveBackgroundColor: theme.getColor(this.backgroundColor),
                    activeBorderBottomColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER),
                    activeForegroundColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.PANEL_INACTIVE_TITLE_FOREGROUND),
                    badgeBackground: theme.getColor(colorRegistry_1.badgeBackground),
                    badgeForeground: theme.getColor(colorRegistry_1.badgeForeground),
                    dragAndDropBorder: theme.getColor(theme_1.PANEL_DRAG_AND_DROP_BORDER)
                })
            }));
            this.registerListeners();
            this.onDidRegisterPanels([...this.getPaneComposites()]);
            // Global Panel Actions
            this.globalActions = this._register(this.instantiationService.createInstance(actions_2.CompositeMenuActions, partId === "workbench.parts.panel" /* Parts.PANEL_PART */ ? actions_3.MenuId.PanelTitle : actions_3.MenuId.AuxiliaryBarTitle, undefined, undefined));
            this._register(this.globalActions.onDidChange(() => this.updateGlobalToolbarActions()));
            platform_1.Registry.as(profileStorageRegistry_1.Extensions.ProfileStorageRegistry)
                .registerKeys([{
                    key: this.pinnedPanelsKey,
                    description: (0, nls_1.localize)('pinned view containers', "Panel entries visibility customizations")
                }]);
        }
        get preferredHeight() {
            // Don't worry about titlebar or statusbar visibility
            // The difference is minimal and keeps this function clean
            return this.layoutService.dimension.height * 0.4;
        }
        get preferredWidth() {
            const activeComposite = this.getActivePaneComposite();
            if (!activeComposite) {
                return;
            }
            const width = activeComposite.getOptimalWidth();
            if (typeof width !== 'number') {
                return;
            }
            return Math.max(width, 300);
        }
        //#endregion
        get onDidPaneCompositeOpen() { return event_1.Event.map(this.onDidCompositeOpen.event, compositeEvent => compositeEvent.composite); }
        getContextMenuActionsForComposite(compositeId) {
            const result = [];
            const viewContainer = this.viewDescriptorService.getViewContainerById(compositeId);
            const defaultLocation = this.viewDescriptorService.getDefaultViewContainerLocation(viewContainer);
            if (defaultLocation !== this.viewDescriptorService.getViewContainerLocation(viewContainer)) {
                result.push((0, actions_1.toAction)({ id: 'resetLocationAction', label: (0, nls_1.localize)('resetLocation', "Reset Location"), run: () => this.viewDescriptorService.moveViewContainerToLocation(viewContainer, defaultLocation) }));
            }
            else {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                if (viewContainerModel.allViewDescriptors.length === 1) {
                    const viewToReset = viewContainerModel.allViewDescriptors[0];
                    const defaultContainer = this.viewDescriptorService.getDefaultContainerById(viewToReset.id);
                    if (defaultContainer !== viewContainer) {
                        result.push((0, actions_1.toAction)({ id: 'resetLocationAction', label: (0, nls_1.localize)('resetLocation', "Reset Location"), run: () => this.viewDescriptorService.moveViewsToContainer([viewToReset], defaultContainer) }));
                    }
                }
            }
            return result;
        }
        onDidRegisterPanels(panels) {
            const cachedPanels = this.getCachedPanels();
            for (const panel of panels) {
                const cachedPanel = cachedPanels.filter(({ id }) => id === panel.id)[0];
                const activePanel = this.getActivePaneComposite();
                const isActive = (activePanel === null || activePanel === void 0 ? void 0 : activePanel.getId()) === panel.id ||
                    (this.extensionsRegistered && this.compositeBar.getVisibleComposites().length === 0);
                if (isActive || !this.shouldBeHidden(panel.id, cachedPanel)) {
                    // Override order
                    const newPanel = {
                        id: panel.id,
                        name: panel.name,
                        order: panel.order,
                        requestedIndex: panel.requestedIndex
                    };
                    this.compositeBar.addComposite(newPanel);
                    // Pin it by default if it is new
                    if (!cachedPanel) {
                        this.compositeBar.pin(panel.id);
                    }
                    if (isActive) {
                        this.compositeBar.activateComposite(panel.id);
                        // Only try to open the panel if it has been created and visible
                        if (!activePanel && this.element && this.layoutService.isVisible(this.partId)) {
                            this.doOpenPanel(panel.id);
                        }
                    }
                }
            }
            for (const panel of panels) {
                const viewContainer = this.getViewContainer(panel.id);
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                this.updateActivity(viewContainer, viewContainerModel);
                this.showOrHideViewContainer(viewContainer, viewContainerModel);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(viewContainerModel.onDidChangeActiveViewDescriptors(() => this.showOrHideViewContainer(viewContainer, viewContainerModel)));
                disposables.add(viewContainerModel.onDidChangeContainerInfo(() => this.updateActivity(viewContainer, viewContainerModel)));
                this.panelDisposables.set(panel.id, disposables);
            }
        }
        async onDidDeregisterPanel(panelId) {
            var _a, _b;
            const disposable = this.panelDisposables.get(panelId);
            if (disposable) {
                disposable.dispose();
            }
            this.panelDisposables.delete(panelId);
            const activeContainers = this.viewDescriptorService.getViewContainersByLocation(this.viewContainerLocation)
                .filter(container => this.viewDescriptorService.getViewContainerModel(container).activeViewDescriptors.length > 0);
            if (activeContainers.length) {
                if (((_a = this.getActivePaneComposite()) === null || _a === void 0 ? void 0 : _a.getId()) === panelId) {
                    const defaultPanelId = (_b = this.viewDescriptorService.getDefaultViewContainer(this.viewContainerLocation)) === null || _b === void 0 ? void 0 : _b.id;
                    const containerToOpen = activeContainers.filter(c => c.id === defaultPanelId)[0] || activeContainers[0];
                    await this.openPaneComposite(containerToOpen.id);
                }
            }
            else {
                this.layoutService.setPartHidden(true, this.partId);
            }
            this.removeComposite(panelId);
        }
        updateActivity(viewContainer, viewContainerModel) {
            var _a;
            const cachedTitle = (_a = this.getPlaceholderViewContainers().filter(panel => panel.id === viewContainer.id)[0]) === null || _a === void 0 ? void 0 : _a.name;
            const activity = {
                id: viewContainer.id,
                name: this.extensionsRegistered || cachedTitle === undefined ? viewContainerModel.title : cachedTitle,
                keybindingId: viewContainerModel.keybindingId
            };
            const { activityAction, pinnedAction } = this.getCompositeActions(viewContainer.id);
            activityAction.setActivity(this.toActivity(viewContainerModel));
            if (pinnedAction instanceof panelActions_1.PlaceHolderToggleCompositePinnedAction) {
                pinnedAction.setActivity(activity);
            }
            // Composite Bar Swither needs to refresh tabs sizes and overflow action
            this.compositeBar.recomputeSizes();
            this.layoutCompositeBar();
            // only update our cached panel info after extensions are done registering
            if (this.extensionsRegistered) {
                this.saveCachedPanels();
            }
        }
        toActivity(viewContainerModel) {
            return BasePanelPart.toActivity(viewContainerModel.viewContainer.id, viewContainerModel.title, this.panelOptions.useIcons ? viewContainerModel.icon : undefined, viewContainerModel.keybindingId);
        }
        static toActivity(id, name, icon, keybindingId) {
            let cssClass = undefined;
            let iconUrl = undefined;
            if (uri_1.URI.isUri(icon)) {
                iconUrl = icon;
                const cssUrl = (0, dom_1.asCSSUrl)(icon);
                const hash = new hash_1.StringSHA1();
                hash.update(cssUrl);
                cssClass = `activity-${id.replace(/\./g, '-')}-${hash.digest()}`;
                const iconClass = `.monaco-workbench .basepanel .monaco-action-bar .action-label.${cssClass}`;
                (0, dom_1.createCSSRule)(iconClass, `
				mask: ${cssUrl} no-repeat 50% 50%;
				mask-size: 16px;
				-webkit-mask: ${cssUrl} no-repeat 50% 50%;
				-webkit-mask-size: 16px;
				mask-origin: padding;
				-webkit-mask-origin: padding;
			`);
            }
            else if (themeService_1.ThemeIcon.isThemeIcon(icon)) {
                cssClass = themeService_1.ThemeIcon.asClassName(icon);
            }
            return { id, name, cssClass, iconUrl, keybindingId };
        }
        showOrHideViewContainer(viewContainer, viewContainerModel) {
            let contextKey = this.enabledViewContainersContextKeys.get(viewContainer.id);
            if (!contextKey) {
                contextKey = this.contextKeyService.createKey((0, contextkeys_1.getEnabledViewContainerContextKey)(viewContainer.id), false);
                this.enabledViewContainersContextKeys.set(viewContainer.id, contextKey);
            }
            if (viewContainerModel.activeViewDescriptors.length) {
                contextKey.set(true);
                this.compositeBar.addComposite({ id: viewContainer.id, name: viewContainer.title, order: viewContainer.order, requestedIndex: viewContainer.requestedIndex });
                const activeComposite = this.getActiveComposite();
                if (activeComposite === undefined || activeComposite.getId() === viewContainer.id) {
                    this.compositeBar.activateComposite(viewContainer.id);
                }
                this.layoutCompositeBar();
                this.layoutEmptyMessage();
            }
            else if (viewContainer.hideIfEmpty) {
                contextKey.set(false);
                this.hideComposite(viewContainer.id);
            }
        }
        shouldBeHidden(panelId, cachedPanel) {
            const viewContainer = this.getViewContainer(panelId);
            if (!viewContainer || !viewContainer.hideIfEmpty) {
                return false;
            }
            return (cachedPanel === null || cachedPanel === void 0 ? void 0 : cachedPanel.views) && cachedPanel.views.length
                ? cachedPanel.views.every(({ when }) => !!when && !this.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(when)))
                : false;
        }
        registerListeners() {
            // Panel registration
            this._register(this.registry.onDidRegister(panel => this.onDidRegisterPanels([panel])));
            this._register(this.registry.onDidDeregister(panel => this.onDidDeregisterPanel(panel.id)));
            // Activate on panel open
            this._register(this.onDidPaneCompositeOpen(panel => this.onPanelOpen(panel)));
            // Deactivate on panel close
            this._register(this.onDidPaneCompositeClose(this.onPanelClose, this));
            // Extension registration
            let disposables = this._register(new lifecycle_1.DisposableStore());
            this._register(this.extensionService.onDidRegisterExtensions(() => {
                disposables.clear();
                this.onDidRegisterExtensions();
                this.compositeBar.onDidChange(() => this.saveCachedPanels(), this, disposables);
                this.storageService.onDidChangeValue(e => this.onDidStorageValueChange(e), this, disposables);
            }));
        }
        onDidRegisterExtensions() {
            this.extensionsRegistered = true;
            this.removeNotExistingComposites();
            this.saveCachedPanels();
        }
        removeNotExistingComposites() {
            const panels = this.getPaneComposites();
            for (const { id } of this.getCachedPanels()) { // should this value match viewlet (load on ctor)
                if (panels.every(panel => panel.id !== id)) {
                    this.hideComposite(id);
                }
            }
        }
        hideComposite(compositeId) {
            this.compositeBar.hideComposite(compositeId);
            const compositeActions = this.compositeActions.get(compositeId);
            if (compositeActions) {
                compositeActions.activityAction.dispose();
                compositeActions.pinnedAction.dispose();
                this.compositeActions.delete(compositeId);
            }
        }
        onPanelOpen(panel) {
            this.activePanelContextKey.set(panel.getId());
            const foundPanel = this.panelRegistry.getPaneComposite(panel.getId());
            if (foundPanel) {
                this.compositeBar.addComposite(foundPanel);
            }
            // Activate composite when opened
            this.compositeBar.activateComposite(panel.getId());
            const panelDescriptor = this.panelRegistry.getPaneComposite(panel.getId());
            if (panelDescriptor) {
                const viewContainer = this.getViewContainer(panelDescriptor.id);
                if (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.hideIfEmpty) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    if (viewContainerModel.activeViewDescriptors.length === 0) {
                        this.hideComposite(panelDescriptor.id); // Update the composite bar by hiding
                    }
                }
            }
            this.layoutCompositeBar(); // Need to relayout composite bar since different panels have different action bar width
            this.layoutEmptyMessage();
        }
        onPanelClose(panel) {
            const id = panel.getId();
            if (this.activePanelContextKey.get() === id) {
                this.activePanelContextKey.reset();
            }
            this.compositeBar.deactivateComposite(panel.getId());
            this.layoutEmptyMessage();
        }
        create(parent) {
            this.element = parent;
            super.create(parent);
            this.createEmptyPanelMessage();
            const focusTracker = this._register((0, dom_1.trackFocus)(parent));
            this._register(focusTracker.onDidFocus(() => this.panelFocusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.panelFocusContextKey.set(false)));
        }
        createEmptyPanelMessage() {
            const contentArea = this.getContentArea();
            this.emptyPanelMessageElement = document.createElement('div');
            this.emptyPanelMessageElement.classList.add('empty-panel-message-area');
            const messageElement = document.createElement('div');
            messageElement.classList.add('empty-panel-message');
            messageElement.innerText = (0, nls_1.localize)('panel.emptyMessage', "Drag a view here to display.");
            this.emptyPanelMessageElement.appendChild(messageElement);
            contentArea.appendChild(this.emptyPanelMessageElement);
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(this.emptyPanelMessageElement, {
                onDragOver: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    const validDropTarget = this.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                    (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', validDropTarget);
                },
                onDragEnter: (e) => {
                    var _a;
                    dom_1.EventHelper.stop(e.eventData, true);
                    const validDropTarget = this.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                    this.emptyPanelMessageElement.style.backgroundColor = validDropTarget ? ((_a = this.theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND)) === null || _a === void 0 ? void 0 : _a.toString()) || '' : '';
                },
                onDragLeave: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPanelMessageElement.style.backgroundColor = '';
                },
                onDragEnd: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPanelMessageElement.style.backgroundColor = '';
                },
                onDrop: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPanelMessageElement.style.backgroundColor = '';
                    this.dndHandler.drop(e.dragAndDropData, undefined, e.eventData);
                },
            }));
        }
        createTitleArea(parent) {
            const element = super.createTitleArea(parent);
            const globalTitleActionsContainer = element.appendChild((0, dom_1.$)('.global-actions'));
            // Global Actions Toolbar
            this.globalToolBar = this._register(new toolbar_1.ToolBar(globalTitleActionsContainer, this.contextMenuService, {
                actionViewItemProvider: action => this.actionViewItemProvider(action),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                anchorAlignmentProvider: () => this.getTitleAreaDropDownAnchorAlignment(),
                toggleMenuTitle: (0, nls_1.localize)('moreActions', "More Actions...")
            }));
            this.updateGlobalToolbarActions();
            return element;
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            container.style.backgroundColor = this.getColor(this.backgroundColor) || '';
            const borderColor = this.getColor(colorRegistry_1.contrastBorder) || '';
            container.style.borderLeftColor = borderColor;
            container.style.borderRightColor = borderColor;
            const title = this.getTitleArea();
            if (title) {
                title.style.borderTopColor = this.getColor(colorRegistry_1.contrastBorder) || '';
            }
        }
        doOpenPanel(id, focus) {
            if (this.blockOpeningPanel) {
                return undefined; // Workaround against a potential race condition
            }
            // First check if panel is hidden and show if so
            if (!this.layoutService.isVisible(this.partId)) {
                try {
                    this.blockOpeningPanel = true;
                    this.layoutService.setPartHidden(false, this.partId);
                }
                finally {
                    this.blockOpeningPanel = false;
                }
            }
            return this.openComposite(id, focus);
        }
        async openPaneComposite(id, focus) {
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenPanel(id, focus);
            }
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenPanel(id, focus);
            }
            return undefined;
        }
        showActivity(panelId, badge, clazz) {
            return this.compositeBar.showActivity(panelId, badge, clazz);
        }
        getPaneComposite(panelId) {
            return this.panelRegistry.getPaneComposite(panelId);
        }
        getPaneComposites() {
            return this.panelRegistry.getPaneComposites()
                .sort((v1, v2) => {
                if (typeof v1.order !== 'number') {
                    return 1;
                }
                if (typeof v2.order !== 'number') {
                    return -1;
                }
                return v1.order - v2.order;
            });
        }
        getPinnedPaneCompositeIds() {
            const pinnedCompositeIds = this.compositeBar.getPinnedComposites().map(c => c.id);
            return this.getPaneComposites()
                .filter(p => pinnedCompositeIds.includes(p.id))
                .sort((p1, p2) => pinnedCompositeIds.indexOf(p1.id) - pinnedCompositeIds.indexOf(p2.id))
                .map(p => p.id);
        }
        getVisiblePaneCompositeIds() {
            return this.compositeBar.getVisibleComposites()
                .filter(v => { var _a; return ((_a = this.getActivePaneComposite()) === null || _a === void 0 ? void 0 : _a.getId()) === v.id || this.compositeBar.isPinned(v.id); })
                .map(v => v.id);
        }
        getActivePaneComposite() {
            return this.getActiveComposite();
        }
        getLastActivePaneCompositeId() {
            return this.getLastActiveCompositetId();
        }
        hideActivePaneComposite() {
            // First check if panel is visible and hide if so
            if (this.layoutService.isVisible(this.partId)) {
                this.layoutService.setPartHidden(true, this.partId);
            }
            this.hideActiveComposite();
        }
        createTitleLabel(parent) {
            const titleArea = this.compositeBar.create(parent);
            titleArea.classList.add('panel-switcher-container');
            return {
                updateTitle: (id, title, keybinding) => {
                    const action = this.compositeBar.getAction(id);
                    if (action) {
                        action.label = title;
                    }
                },
                updateStyles: () => {
                    // Handled via theming participant
                }
            };
        }
        onTitleAreaUpdate(compositeId) {
            super.onTitleAreaUpdate(compositeId);
            // If title actions change, relayout the composite bar
            this.layoutCompositeBar();
        }
        layout(width, height, top, left) {
            if (!this.layoutService.isVisible(this.partId)) {
                return;
            }
            this.contentDimension = new dom_1.Dimension(width, height);
            // Layout contents
            super.layout(this.contentDimension.width, this.contentDimension.height, top, left);
            // Layout composite bar
            this.layoutCompositeBar();
            // Add empty panel message
            this.layoutEmptyMessage();
        }
        layoutCompositeBar() {
            if (this.contentDimension && this.dimension) {
                let availableWidth = this.contentDimension.width - 40; // take padding into account
                if (this.toolBar) {
                    availableWidth = Math.max(BasePanelPart.MIN_COMPOSITE_BAR_WIDTH, availableWidth - this.getToolbarWidth()); // adjust height for global actions showing
                }
                this.compositeBar.layout(new dom_1.Dimension(availableWidth, this.dimension.height));
            }
        }
        layoutEmptyMessage() {
            if (this.emptyPanelMessageElement) {
                this.emptyPanelMessageElement.classList.toggle('visible', this.compositeBar.getVisibleComposites().length === 0);
            }
        }
        getViewContainer(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            return viewContainer && this.viewDescriptorService.getViewContainerLocation(viewContainer) === this.viewContainerLocation ? viewContainer : undefined;
        }
        updateGlobalToolbarActions() {
            const primaryActions = this.globalActions.getPrimaryActions();
            const secondaryActions = this.globalActions.getSecondaryActions();
            if (this.globalToolBar) {
                this.globalToolBar.setActions((0, actionbar_1.prepareActions)(primaryActions), (0, actionbar_1.prepareActions)(secondaryActions));
            }
        }
        getCompositeActions(compositeId) {
            let compositeActions = this.compositeActions.get(compositeId);
            if (!compositeActions) {
                // const panel = this.getPaneComposite(compositeId);
                const viewContainer = this.getViewContainer(compositeId);
                if (viewContainer) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    compositeActions = {
                        activityAction: this.instantiationService.createInstance(panelActions_1.PanelActivityAction, this.toActivity(viewContainerModel), this.viewContainerLocation),
                        pinnedAction: new compositeBarActions_1.ToggleCompositePinnedAction(this.toActivity(viewContainerModel), this.compositeBar)
                    };
                }
                else {
                    compositeActions = {
                        activityAction: this.instantiationService.createInstance(panelActions_1.PlaceHolderPanelActivityAction, compositeId, this.viewContainerLocation),
                        pinnedAction: new panelActions_1.PlaceHolderToggleCompositePinnedAction(compositeId, this.compositeBar)
                    };
                }
                this.compositeActions.set(compositeId, compositeActions);
            }
            return compositeActions;
        }
        removeComposite(compositeId) {
            if (super.removeComposite(compositeId)) {
                this.compositeBar.removeComposite(compositeId);
                const compositeActions = this.compositeActions.get(compositeId);
                if (compositeActions) {
                    compositeActions.activityAction.dispose();
                    compositeActions.pinnedAction.dispose();
                    this.compositeActions.delete(compositeId);
                }
                return true;
            }
            return false;
        }
        getToolbarWidth() {
            var _a, _b;
            const activePanel = this.getActivePaneComposite();
            if (!activePanel || !this.toolBar) {
                return 0;
            }
            return this.toolBar.getItemsWidth() + ((_b = (_a = this.globalToolBar) === null || _a === void 0 ? void 0 : _a.getItemsWidth()) !== null && _b !== void 0 ? _b : 0);
        }
        onDidStorageValueChange(e) {
            if (e.key === this.pinnedPanelsKey && e.scope === 0 /* StorageScope.GLOBAL */
                && this.cachedPanelsValue !== this.getStoredCachedPanelsValue() /* This checks if current window changed the value or not */) {
                this._cachedPanelsValue = undefined;
                const newCompositeItems = [];
                const compositeItems = this.compositeBar.getCompositeBarItems();
                const cachedPanels = this.getCachedPanels();
                for (const cachedPanel of cachedPanels) {
                    // copy behavior from activity bar
                    newCompositeItems.push({
                        id: cachedPanel.id,
                        name: cachedPanel.name,
                        order: cachedPanel.order,
                        pinned: cachedPanel.pinned,
                        visible: !!compositeItems.find(({ id }) => id === cachedPanel.id)
                    });
                }
                for (let index = 0; index < compositeItems.length; index++) {
                    // Add items currently exists but does not exist in new.
                    if (!newCompositeItems.some(({ id }) => id === compositeItems[index].id)) {
                        newCompositeItems.splice(index, 0, compositeItems[index]);
                    }
                }
                this.compositeBar.setCompositeBarItems(newCompositeItems);
            }
        }
        saveCachedPanels() {
            const state = [];
            const placeholders = [];
            const compositeItems = this.compositeBar.getCompositeBarItems();
            for (const compositeItem of compositeItems) {
                const viewContainer = this.getViewContainer(compositeItem.id);
                if (viewContainer) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    state.push({ id: compositeItem.id, name: viewContainerModel.title, pinned: compositeItem.pinned, order: compositeItem.order, visible: compositeItem.visible });
                    placeholders.push({ id: compositeItem.id, name: this.getCompositeActions(compositeItem.id).activityAction.label });
                }
            }
            this.cachedPanelsValue = JSON.stringify(state);
            this.setPlaceholderViewContainers(placeholders);
        }
        getCachedPanels() {
            const registeredPanels = this.getPaneComposites();
            const storedStates = JSON.parse(this.cachedPanelsValue);
            const cachedPanels = storedStates.map(c => {
                const serialized = typeof c === 'string' /* migration from pinned states to composites states */ ? { id: c, pinned: true, order: undefined, visible: true } : c;
                const registered = registeredPanels.some(p => p.id === serialized.id);
                serialized.visible = registered ? (0, types_1.isUndefinedOrNull)(serialized.visible) ? true : serialized.visible : false;
                return serialized;
            });
            for (const placeholderViewContainer of this.getPlaceholderViewContainers()) {
                const cachedViewContainer = cachedPanels.filter(cached => cached.id === placeholderViewContainer.id)[0];
                if (cachedViewContainer) {
                    cachedViewContainer.name = placeholderViewContainer.name;
                }
            }
            return cachedPanels;
        }
        get cachedPanelsValue() {
            if (!this._cachedPanelsValue) {
                this._cachedPanelsValue = this.getStoredCachedPanelsValue();
            }
            return this._cachedPanelsValue;
        }
        set cachedPanelsValue(cachedViewletsValue) {
            if (this.cachedPanelsValue !== cachedViewletsValue) {
                this._cachedPanelsValue = cachedViewletsValue;
                this.setStoredCachedViewletsValue(cachedViewletsValue);
            }
        }
        getStoredCachedPanelsValue() {
            return this.storageService.get(this.pinnedPanelsKey, 0 /* StorageScope.GLOBAL */, '[]');
        }
        setStoredCachedViewletsValue(value) {
            this.storageService.store(this.pinnedPanelsKey, value, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        getPlaceholderViewContainers() {
            return JSON.parse(this.placeholderViewContainersValue);
        }
        setPlaceholderViewContainers(placeholderViewContainers) {
            this.placeholderViewContainersValue = JSON.stringify(placeholderViewContainers);
        }
        get placeholderViewContainersValue() {
            if (!this._placeholderViewContainersValue) {
                this._placeholderViewContainersValue = this.getStoredPlaceholderViewContainersValue();
            }
            return this._placeholderViewContainersValue;
        }
        set placeholderViewContainersValue(placeholderViewContainesValue) {
            if (this.placeholderViewContainersValue !== placeholderViewContainesValue) {
                this._placeholderViewContainersValue = placeholderViewContainesValue;
                this.setStoredPlaceholderViewContainersValue(placeholderViewContainesValue);
            }
        }
        getStoredPlaceholderViewContainersValue() {
            return this.storageService.get(this.placeholdeViewContainersKey, 1 /* StorageScope.WORKSPACE */, '[]');
        }
        setStoredPlaceholderViewContainersValue(value) {
            this.storageService.store(this.placeholdeViewContainersKey, value, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
    };
    BasePanelPart.MIN_COMPOSITE_BAR_WIDTH = 50;
    BasePanelPart = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, extensions_1.IExtensionService)
    ], BasePanelPart);
    exports.BasePanelPart = BasePanelPart;
    let PanelPart = class PanelPart extends BasePanelPart {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService) {
            super(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, "workbench.parts.panel" /* Parts.PANEL_PART */, PanelPart.activePanelSettingsKey, PanelPart.pinnedPanelsKey, PanelPart.placeholdeViewContainersKey, panecomposite_1.Extensions.Panels, theme_1.PANEL_BACKGROUND, 1 /* ViewContainerLocation.Panel */, contextkeys_1.ActivePanelContext.bindTo(contextKeyService), contextkeys_1.PanelFocusContext.bindTo(contextKeyService), {
                useIcons: false,
                hasTitle: true
            });
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const borderColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            container.style.borderLeftColor = borderColor;
            container.style.borderRightColor = borderColor;
            const title = this.getTitleArea();
            if (title) {
                title.style.borderTopColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            }
        }
        getActivityHoverOptions() {
            return {
                position: () => this.layoutService.getPanelPosition() === 2 /* Position.BOTTOM */ && !this.layoutService.isPanelMaximized() ? 3 /* HoverPosition.ABOVE */ : 2 /* HoverPosition.BELOW */,
            };
        }
        fillExtraContextMenuActions(actions) {
            actions.push(...[
                new actions_1.Separator(),
                ...panelActions_1.PositionPanelActionConfigs
                    // show the contextual menu item if it is not in that position
                    .filter(({ when }) => this.contextKeyService.contextMatchesRules(when))
                    .map(({ id, title }) => this.instantiationService.createInstance(panelActions_1.SetPanelPositionAction, id, title.value)),
                this.instantiationService.createInstance(panelActions_1.TogglePanelAction, panelActions_1.TogglePanelAction.ID, (0, nls_1.localize)('hidePanel', "Hide Panel"))
            ]);
        }
        layout(width, height, top, left) {
            let dimensions;
            if (this.layoutService.getPanelPosition() === 1 /* Position.RIGHT */) {
                dimensions = new dom_1.Dimension(width - 1, height); // Take into account the 1px border when layouting
            }
            else {
                dimensions = new dom_1.Dimension(width, height);
            }
            // Layout contents
            super.layout(dimensions.width, dimensions.height, top, left);
        }
        toJSON() {
            return {
                type: "workbench.parts.panel" /* Parts.PANEL_PART */
            };
        }
    };
    PanelPart.activePanelSettingsKey = 'workbench.panelpart.activepanelid';
    PanelPart.pinnedPanelsKey = 'workbench.panel.pinnedPanels';
    PanelPart.placeholdeViewContainersKey = 'workbench.panel.placeholderPanels';
    PanelPart = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, extensions_1.IExtensionService)
    ], PanelPart);
    exports.PanelPart = PanelPart;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Panel Background: since panels can host editors, we apply a background rule if the panel background
        // color is different from the editor background color. This is a bit of a hack though. The better way
        // would be to have a way to push the background color onto each editor widget itself somehow.
        const panelBackground = theme.getColor(theme_1.PANEL_BACKGROUND);
        if (panelBackground && panelBackground !== theme.getColor(colorRegistry_1.editorBackground)) {
            collector.addRule(`
			.monaco-workbench .part.panel > .content .monaco-editor,
			.monaco-workbench .part.panel > .content .monaco-editor .margin,
			.monaco-workbench .part.panel > .content .monaco-editor .monaco-editor-background {
				background-color: ${panelBackground};
			}
		`);
        }
        // Title Active
        const titleActive = theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND);
        if (titleActive) {
            collector.addRule(`
		.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:hover .action-label {
			color: ${titleActive} !important;
		}
		`);
            collector.addRule(`
		.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus .action-label {
			color: ${titleActive} !important;
		}
		`);
        }
        const inputBorder = theme.getColor(theme_1.PANEL_INPUT_BORDER);
        if (inputBorder) {
            collector.addRule(`
			.monaco-workbench .part.panel .monaco-inputbox {
				border-color: ${inputBorder}
			}
		`);
        }
        // Base Panel Styles
        // Title focus
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`
				.monaco-workbench .part.basepanel > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus .active-item-indicator:before {
					border-top-color: ${focusBorderColor};
				}
				`);
            collector.addRule(`
				.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus {
					outline: none;
				}
				`);
        }
        const titleActiveBorder = theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER);
        if (titleActiveBorder) {
            collector.addRule(`
				.monaco-workbench .part.basepanel > .title > .panel-switcher-container > .monaco-action-bar .action-item.checked:not(:focus) .active-item-indicator:before,
					.monaco-workbench .part.basepanel > .title > .panel-switcher-container > .monaco-action-bar .action-item.checked.clicked:focus .active-item-indicator:before {
					border-top-color: ${titleActiveBorder};
				}
			`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
				.monaco-workbench .part.basepanel > .title > .panel-switcher-container > .monaco-action-bar .action-item.checked .action-label,
				.monaco-workbench .part.basepanel > .title > .panel-switcher-container > .monaco-action-bar .action-item:hover .action-label {
					outline-color: ${outline};
					outline-width: 1px;
					outline-style: solid;
					border-bottom: none;
					outline-offset: -2px;
				}

				.monaco-workbench .part.basepanel > .title > .panel-switcher-container > .monaco-action-bar .action-item:not(.checked):hover .action-label {
					outline-style: dashed;
				}
			`);
        }
    });
});
//# sourceMappingURL=panelPart.js.map