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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/touch", "vs/base/browser/ui/splitview/paneview", "vs/base/common/async", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions", "vs/workbench/browser/dnd", "vs/workbench/common/component", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/common/contextkeys", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/css!./media/paneviewlet"], function (require, exports, dom_1, mouseEvent_1, touch_1, paneview_1, async_1, event_1, keyCodes_1, lifecycle_1, types_1, nls, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, storage_1, telemetry_1, colorRegistry_1, styler_1, themeService_1, workspace_1, actions_2, dnd_1, component_1, theme_1, views_1, contextkeys_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewPaneContainerAction = exports.ViewPaneContainer = exports.ViewsSubMenu = void 0;
    exports.ViewsSubMenu = new actions_1.MenuId('Views');
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
        submenu: exports.ViewsSubMenu,
        title: nls.localize('views', "Views"),
        order: 1,
        when: contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)),
    });
    var DropDirection;
    (function (DropDirection) {
        DropDirection[DropDirection["UP"] = 0] = "UP";
        DropDirection[DropDirection["DOWN"] = 1] = "DOWN";
        DropDirection[DropDirection["LEFT"] = 2] = "LEFT";
        DropDirection[DropDirection["RIGHT"] = 3] = "RIGHT";
    })(DropDirection || (DropDirection = {}));
    class ViewPaneDropOverlay extends themeService_1.Themable {
        constructor(paneElement, orientation, bounds, location, themeService) {
            super(themeService);
            this.paneElement = paneElement;
            this.orientation = orientation;
            this.bounds = bounds;
            this.location = location;
            this.cleanupOverlayScheduler = this._register(new async_1.RunOnceScheduler(() => this.dispose(), 300));
            this.create();
        }
        get currentDropOperation() {
            return this._currentDropOperation;
        }
        get disposed() {
            return !!this._disposed;
        }
        create() {
            // Container
            this.container = document.createElement('div');
            this.container.id = ViewPaneDropOverlay.OVERLAY_ID;
            this.container.style.top = '0px';
            // Parent
            this.paneElement.appendChild(this.container);
            this.paneElement.classList.add('dragged-over');
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.paneElement.removeChild(this.container);
                this.paneElement.classList.remove('dragged-over');
            }));
            // Overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('pane-overlay-indicator');
            this.container.appendChild(this.overlay);
            // Overlay Event Handling
            this.registerListeners();
            // Styles
            this.updateStyles();
        }
        updateStyles() {
            // Overlay drop background
            this.overlay.style.backgroundColor = this.getColor(this.location === 1 /* ViewContainerLocation.Panel */ ? theme_1.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND : theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND) || '';
            // Overlay contrast border (if any)
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            this.overlay.style.outlineColor = activeContrastBorderColor || '';
            this.overlay.style.outlineOffset = activeContrastBorderColor ? '-2px' : '';
            this.overlay.style.outlineStyle = activeContrastBorderColor ? 'dashed' : '';
            this.overlay.style.outlineWidth = activeContrastBorderColor ? '2px' : '';
            this.overlay.style.borderColor = activeContrastBorderColor || '';
            this.overlay.style.borderStyle = 'solid' || '';
            this.overlay.style.borderWidth = '0px';
        }
        registerListeners() {
            this._register(new dom_1.DragAndDropObserver(this.container, {
                onDragEnter: e => undefined,
                onDragOver: e => {
                    // Position overlay
                    this.positionOverlay(e.offsetX, e.offsetY);
                    // Make sure to stop any running cleanup scheduler to remove the overlay
                    if (this.cleanupOverlayScheduler.isScheduled()) {
                        this.cleanupOverlayScheduler.cancel();
                    }
                },
                onDragLeave: e => this.dispose(),
                onDragEnd: e => this.dispose(),
                onDrop: e => {
                    // Dispose overlay
                    this.dispose();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_OVER, () => {
                // Under some circumstances we have seen reports where the drop overlay is not being
                // cleaned up and as such the editor area remains under the overlay so that you cannot
                // type into the editor anymore. This seems related to using VMs and DND via host and
                // guest OS, though some users also saw it without VMs.
                // To protect against this issue we always destroy the overlay as soon as we detect a
                // mouse event over it. The delay is used to guarantee we are not interfering with the
                // actual DROP event that can also trigger a mouse over event.
                if (!this.cleanupOverlayScheduler.isScheduled()) {
                    this.cleanupOverlayScheduler.schedule();
                }
            }));
        }
        positionOverlay(mousePosX, mousePosY) {
            const paneWidth = this.paneElement.clientWidth;
            const paneHeight = this.paneElement.clientHeight;
            const splitWidthThreshold = paneWidth / 2;
            const splitHeightThreshold = paneHeight / 2;
            let dropDirection;
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                if (mousePosY < splitHeightThreshold) {
                    dropDirection = 0 /* DropDirection.UP */;
                }
                else if (mousePosY >= splitHeightThreshold) {
                    dropDirection = 1 /* DropDirection.DOWN */;
                }
            }
            else if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                if (mousePosX < splitWidthThreshold) {
                    dropDirection = 2 /* DropDirection.LEFT */;
                }
                else if (mousePosX >= splitWidthThreshold) {
                    dropDirection = 3 /* DropDirection.RIGHT */;
                }
            }
            // Draw overlay based on split direction
            switch (dropDirection) {
                case 0 /* DropDirection.UP */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '50%' });
                    break;
                case 1 /* DropDirection.DOWN */:
                    this.doPositionOverlay({ bottom: '0', left: '0', width: '100%', height: '50%' });
                    break;
                case 2 /* DropDirection.LEFT */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '50%', height: '100%' });
                    break;
                case 3 /* DropDirection.RIGHT */:
                    this.doPositionOverlay({ top: '0', right: '0', width: '50%', height: '100%' });
                    break;
                default: {
                    // const top = this.bounds?.top || 0;
                    // const left = this.bounds?.bottom || 0;
                    let top = '0';
                    let left = '0';
                    let width = '100%';
                    let height = '100%';
                    if (this.bounds) {
                        const boundingRect = this.container.getBoundingClientRect();
                        top = `${this.bounds.top - boundingRect.top}px`;
                        left = `${this.bounds.left - boundingRect.left}px`;
                        height = `${this.bounds.bottom - this.bounds.top}px`;
                        width = `${this.bounds.right - this.bounds.left}px`;
                    }
                    this.doPositionOverlay({ top, left, width, height });
                }
            }
            if ((this.orientation === 0 /* Orientation.VERTICAL */ && paneHeight <= 25) ||
                (this.orientation === 1 /* Orientation.HORIZONTAL */ && paneWidth <= 25)) {
                this.doUpdateOverlayBorder(dropDirection);
            }
            else {
                this.doUpdateOverlayBorder(undefined);
            }
            // Make sure the overlay is visible now
            this.overlay.style.opacity = '1';
            // Enable transition after a timeout to prevent initial animation
            setTimeout(() => this.overlay.classList.add('overlay-move-transition'), 0);
            // Remember as current split direction
            this._currentDropOperation = dropDirection;
        }
        doUpdateOverlayBorder(direction) {
            this.overlay.style.borderTopWidth = direction === 0 /* DropDirection.UP */ ? '2px' : '0px';
            this.overlay.style.borderLeftWidth = direction === 2 /* DropDirection.LEFT */ ? '2px' : '0px';
            this.overlay.style.borderBottomWidth = direction === 1 /* DropDirection.DOWN */ ? '2px' : '0px';
            this.overlay.style.borderRightWidth = direction === 3 /* DropDirection.RIGHT */ ? '2px' : '0px';
        }
        doPositionOverlay(options) {
            // Container
            this.container.style.height = '100%';
            // Overlay
            this.overlay.style.top = options.top || '';
            this.overlay.style.left = options.left || '';
            this.overlay.style.bottom = options.bottom || '';
            this.overlay.style.right = options.right || '';
            this.overlay.style.width = options.width;
            this.overlay.style.height = options.height;
        }
        contains(element) {
            return element === this.container || element === this.overlay;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    }
    ViewPaneDropOverlay.OVERLAY_ID = 'monaco-pane-drop-overlay';
    let ViewContainerMenuActions = class ViewContainerMenuActions extends actions_2.CompositeMenuActions {
        constructor(element, viewContainer, viewDescriptorService, contextKeyService, menuService) {
            const scopedContextKeyService = contextKeyService.createScoped(element);
            scopedContextKeyService.createKey('viewContainer', viewContainer.id);
            const viewContainerLocationKey = scopedContextKeyService.createKey('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(viewDescriptorService.getViewContainerLocation(viewContainer)));
            super(actions_1.MenuId.ViewContainerTitle, actions_1.MenuId.ViewContainerTitleContext, { shouldForwardArgs: true }, scopedContextKeyService, menuService);
            this._register(scopedContextKeyService);
            this._register(event_1.Event.filter(viewDescriptorService.onDidChangeContainerLocation, e => e.viewContainer === viewContainer)(() => viewContainerLocationKey.set((0, views_1.ViewContainerLocationToString)(viewDescriptorService.getViewContainerLocation(viewContainer)))));
        }
    };
    ViewContainerMenuActions = __decorate([
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService)
    ], ViewContainerMenuActions);
    let ViewPaneContainer = class ViewPaneContainer extends component_1.Component {
        constructor(id, options, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService) {
            super(id, themeService, storageService);
            this.options = options;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.layoutService = layoutService;
            this.contextMenuService = contextMenuService;
            this.telemetryService = telemetryService;
            this.extensionService = extensionService;
            this.storageService = storageService;
            this.contextService = contextService;
            this.viewDescriptorService = viewDescriptorService;
            this.paneItems = [];
            this.visible = false;
            this.areExtensionsReady = false;
            this.didLayout = false;
            this.viewDisposables = [];
            this._onTitleAreaUpdate = this._register(new event_1.Emitter());
            this.onTitleAreaUpdate = this._onTitleAreaUpdate.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidAddViews = this._register(new event_1.Emitter());
            this.onDidAddViews = this._onDidAddViews.event;
            this._onDidRemoveViews = this._register(new event_1.Emitter());
            this.onDidRemoveViews = this._onDidRemoveViews.event;
            this._onDidChangeViewVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewVisibility = this._onDidChangeViewVisibility.event;
            this._onDidFocusView = this._register(new event_1.Emitter());
            this.onDidFocusView = this._onDidFocusView.event;
            this._onDidBlurView = this._register(new event_1.Emitter());
            this.onDidBlurView = this._onDidBlurView.event;
            const container = this.viewDescriptorService.getViewContainerById(id);
            if (!container) {
                throw new Error('Could not find container');
            }
            this.viewContainer = container;
            this.visibleViewsStorageId = `${id}.numberOfVisibleViews`;
            this.visibleViewsCountFromCache = this.storageService.getNumber(this.visibleViewsStorageId, 1 /* StorageScope.WORKSPACE */, undefined);
            this._register((0, lifecycle_1.toDisposable)(() => this.viewDisposables = (0, lifecycle_1.dispose)(this.viewDisposables)));
            this.viewContainerModel = this.viewDescriptorService.getViewContainerModel(container);
        }
        get onDidSashChange() {
            return (0, types_1.assertIsDefined)(this.paneview).onDidSashChange;
        }
        get panes() {
            return this.paneItems.map(i => i.pane);
        }
        get views() {
            return this.panes;
        }
        get length() {
            return this.paneItems.length;
        }
        get menuActions() {
            return this._menuActions;
        }
        create(parent) {
            const options = this.options;
            options.orientation = this.orientation;
            this.paneview = this._register(new paneview_1.PaneView(parent, this.options));
            this._register(this.paneview.onDidDrop(({ from, to }) => this.movePane(from, to)));
            this._register(this.paneview.onDidScroll(_ => this.onDidScrollPane()));
            this._register(this.paneview.onDidSashReset((index) => this.onDidSashReset(index)));
            this._register((0, dom_1.addDisposableListener)(parent, dom_1.EventType.CONTEXT_MENU, (e) => this.showContextMenu(new mouseEvent_1.StandardMouseEvent(e))));
            this._register(touch_1.Gesture.addTarget(parent));
            this._register((0, dom_1.addDisposableListener)(parent, touch_1.EventType.Contextmenu, (e) => this.showContextMenu(new mouseEvent_1.StandardMouseEvent(e))));
            this._menuActions = this._register(this.instantiationService.createInstance(ViewContainerMenuActions, this.paneview.element, this.viewContainer));
            this._register(this._menuActions.onDidChange(() => this.updateTitleArea()));
            let overlay;
            const getOverlayBounds = () => {
                const fullSize = parent.getBoundingClientRect();
                const lastPane = this.panes[this.panes.length - 1].element.getBoundingClientRect();
                const top = this.orientation === 0 /* Orientation.VERTICAL */ ? lastPane.bottom : fullSize.top;
                const left = this.orientation === 1 /* Orientation.HORIZONTAL */ ? lastPane.right : fullSize.left;
                return {
                    top,
                    bottom: fullSize.bottom,
                    left,
                    right: fullSize.right,
                };
            };
            const inBounds = (bounds, pos) => {
                return pos.x >= bounds.left && pos.x <= bounds.right && pos.y >= bounds.top && pos.y <= bounds.bottom;
            };
            let bounds;
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(parent, {
                onDragEnter: (e) => {
                    bounds = getOverlayBounds();
                    if (overlay && overlay.disposed) {
                        overlay = undefined;
                    }
                    if (!overlay && inBounds(bounds, e.eventData)) {
                        const dropData = e.dragAndDropData.getData();
                        if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && (!viewDescriptor || !viewDescriptor.canMoveView || this.viewContainer.rejectAddedViews)) {
                                return;
                            }
                            overlay = new ViewPaneDropOverlay(parent, undefined, bounds, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                        }
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const viewsToMove = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!viewsToMove.some(v => !v.canMoveView) && viewsToMove.length > 0) {
                                overlay = new ViewPaneDropOverlay(parent, undefined, bounds, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                            }
                        }
                    }
                },
                onDragOver: (e) => {
                    if (overlay && overlay.disposed) {
                        overlay = undefined;
                    }
                    if (overlay && !inBounds(bounds, e.eventData)) {
                        overlay.dispose();
                        overlay = undefined;
                    }
                    if (inBounds(bounds, e.eventData)) {
                        (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', overlay !== undefined);
                    }
                },
                onDragLeave: (e) => {
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                },
                onDrop: (e) => {
                    if (overlay) {
                        const dropData = e.dragAndDropData.getData();
                        const viewsToMove = [];
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const allViews = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!allViews.some(v => !v.canMoveView)) {
                                viewsToMove.push(...allViews);
                            }
                        }
                        else if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && viewDescriptor && viewDescriptor.canMoveView) {
                                this.viewDescriptorService.moveViewsToContainer([viewDescriptor], this.viewContainer);
                            }
                        }
                        const paneCount = this.panes.length;
                        if (viewsToMove.length > 0) {
                            this.viewDescriptorService.moveViewsToContainer(viewsToMove, this.viewContainer);
                        }
                        if (paneCount > 0) {
                            for (const view of viewsToMove) {
                                const paneToMove = this.panes.find(p => p.id === view.id);
                                if (paneToMove) {
                                    this.movePane(paneToMove, this.panes[this.panes.length - 1]);
                                }
                            }
                        }
                    }
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                }
            }));
            this._register(this.onDidSashChange(() => this.saveViewSizes()));
            this._register(this.viewContainerModel.onDidAddVisibleViewDescriptors(added => this.onDidAddViewDescriptors(added)));
            this._register(this.viewContainerModel.onDidRemoveVisibleViewDescriptors(removed => this.onDidRemoveViewDescriptors(removed)));
            const addedViews = this.viewContainerModel.visibleViewDescriptors.map((viewDescriptor, index) => {
                const size = this.viewContainerModel.getSize(viewDescriptor.id);
                const collapsed = this.viewContainerModel.isCollapsed(viewDescriptor.id);
                return ({ viewDescriptor, index, size, collapsed });
            });
            if (addedViews.length) {
                this.onDidAddViewDescriptors(addedViews);
            }
            // Update headers after and title contributed views after available, since we read from cache in the beginning to know if the viewlet has single view or not. Ref #29609
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.areExtensionsReady = true;
                if (this.panes.length) {
                    this.updateTitleArea();
                    this.updateViewHeaders();
                }
            });
            this._register(this.viewContainerModel.onDidChangeActiveViewDescriptors(() => this._onTitleAreaUpdate.fire()));
        }
        getTitle() {
            const containerTitle = this.viewContainerModel.title;
            if (this.isViewMergedWithContainer()) {
                const paneItemTitle = this.paneItems[0].pane.title;
                if (containerTitle === paneItemTitle) {
                    return this.paneItems[0].pane.title;
                }
                return paneItemTitle ? `${containerTitle}: ${paneItemTitle}` : containerTitle;
            }
            return containerTitle;
        }
        showContextMenu(event) {
            for (const paneItem of this.paneItems) {
                // Do not show context menu if target is coming from inside pane views
                if ((0, dom_1.isAncestor)(event.target, paneItem.pane.element)) {
                    return;
                }
            }
            event.stopPropagation();
            event.preventDefault();
            let anchor = { x: event.posx, y: event.posy };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => { var _a, _b; return (_b = (_a = this.menuActions) === null || _a === void 0 ? void 0 : _a.getContextMenuActions()) !== null && _b !== void 0 ? _b : []; }
            });
        }
        getActionsContext() {
            return undefined;
        }
        getActionViewItem(action) {
            if (this.isViewMergedWithContainer()) {
                return this.paneItems[0].pane.getActionViewItem(action);
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action);
        }
        focus() {
            if (this.lastFocusedPane) {
                this.lastFocusedPane.focus();
            }
            else if (this.paneItems.length > 0) {
                for (const { pane: pane } of this.paneItems) {
                    if (pane.isExpanded()) {
                        pane.focus();
                        return;
                    }
                }
            }
        }
        get orientation() {
            switch (this.viewDescriptorService.getViewContainerLocation(this.viewContainer)) {
                case 0 /* ViewContainerLocation.Sidebar */:
                case 2 /* ViewContainerLocation.AuxiliaryBar */:
                    return 0 /* Orientation.VERTICAL */;
                case 1 /* ViewContainerLocation.Panel */:
                    return this.layoutService.getPanelPosition() === 2 /* Position.BOTTOM */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
            }
            return 0 /* Orientation.VERTICAL */;
        }
        layout(dimension) {
            if (this.paneview) {
                if (this.paneview.orientation !== this.orientation) {
                    this.paneview.flipOrientation(dimension.height, dimension.width);
                }
                this.paneview.layout(dimension.height, dimension.width);
            }
            this.dimension = dimension;
            if (this.didLayout) {
                this.saveViewSizes();
            }
            else {
                this.didLayout = true;
                this.restoreViewSizes();
            }
        }
        getOptimalWidth() {
            const additionalMargin = 16;
            const optimalWidth = Math.max(...this.panes.map(view => view.getOptimalWidth() || 0));
            return optimalWidth + additionalMargin;
        }
        addPanes(panes) {
            const wasMerged = this.isViewMergedWithContainer();
            for (const { pane: pane, size, index } of panes) {
                this.addPane(pane, size, index);
            }
            this.updateViewHeaders();
            if (this.isViewMergedWithContainer() !== wasMerged) {
                this.updateTitleArea();
            }
            this._onDidAddViews.fire(panes.map(({ pane }) => pane));
        }
        setVisible(visible) {
            if (this.visible !== !!visible) {
                this.visible = visible;
                this._onDidChangeVisibility.fire(visible);
            }
            this.panes.filter(view => view.isVisible() !== visible)
                .map((view) => view.setVisible(visible));
        }
        isVisible() {
            return this.visible;
        }
        updateTitleArea() {
            this._onTitleAreaUpdate.fire();
        }
        createView(viewDescriptor, options) {
            return this.instantiationService.createInstance(viewDescriptor.ctorDescriptor.ctor, ...(viewDescriptor.ctorDescriptor.staticArguments || []), options);
        }
        getView(id) {
            return this.panes.filter(view => view.id === id)[0];
        }
        saveViewSizes() {
            // Save size only when the layout has happened
            if (this.didLayout) {
                this.viewContainerModel.setSizes(this.panes.map(view => ({ id: view.id, size: this.getPaneSize(view) })));
            }
        }
        restoreViewSizes() {
            // Restore sizes only when the layout has happened
            if (this.didLayout) {
                let initialSizes;
                for (let i = 0; i < this.viewContainerModel.visibleViewDescriptors.length; i++) {
                    const pane = this.panes[i];
                    const viewDescriptor = this.viewContainerModel.visibleViewDescriptors[i];
                    const size = this.viewContainerModel.getSize(viewDescriptor.id);
                    if (typeof size === 'number') {
                        this.resizePane(pane, size);
                    }
                    else {
                        initialSizes = initialSizes ? initialSizes : this.computeInitialSizes();
                        this.resizePane(pane, initialSizes.get(pane.id) || 200);
                    }
                }
            }
        }
        computeInitialSizes() {
            const sizes = new Map();
            if (this.dimension) {
                const totalWeight = this.viewContainerModel.visibleViewDescriptors.reduce((totalWeight, { weight }) => totalWeight + (weight || 20), 0);
                for (const viewDescriptor of this.viewContainerModel.visibleViewDescriptors) {
                    if (this.orientation === 0 /* Orientation.VERTICAL */) {
                        sizes.set(viewDescriptor.id, this.dimension.height * (viewDescriptor.weight || 20) / totalWeight);
                    }
                    else {
                        sizes.set(viewDescriptor.id, this.dimension.width * (viewDescriptor.weight || 20) / totalWeight);
                    }
                }
            }
            return sizes;
        }
        saveState() {
            this.panes.forEach((view) => view.saveState());
            this.storageService.store(this.visibleViewsStorageId, this.length, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        onContextMenu(event, viewPane) {
            event.stopPropagation();
            event.preventDefault();
            const actions = viewPane.menuActions.getContextMenuActions();
            let anchor = { x: event.posx, y: event.posy };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions
            });
        }
        openView(id, focus) {
            let view = this.getView(id);
            if (!view) {
                this.toggleViewVisibility(id);
            }
            view = this.getView(id);
            if (view) {
                view.setExpanded(true);
                if (focus) {
                    view.focus();
                }
            }
            return view;
        }
        onDidAddViewDescriptors(added) {
            const panesToAdd = [];
            for (const { viewDescriptor, collapsed, index, size } of added) {
                const pane = this.createView(viewDescriptor, {
                    id: viewDescriptor.id,
                    title: viewDescriptor.name,
                    fromExtensionId: viewDescriptor.extensionId,
                    expanded: !collapsed
                });
                pane.render();
                const contextMenuDisposable = (0, dom_1.addDisposableListener)(pane.draggableElement, 'contextmenu', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.onContextMenu(new mouseEvent_1.StandardMouseEvent(e), pane);
                });
                const collapseDisposable = event_1.Event.latch(event_1.Event.map(pane.onDidChange, () => !pane.isExpanded()))(collapsed => {
                    this.viewContainerModel.setCollapsed(viewDescriptor.id, collapsed);
                });
                this.viewDisposables.splice(index, 0, (0, lifecycle_1.combinedDisposable)(contextMenuDisposable, collapseDisposable));
                panesToAdd.push({ pane, size: size || pane.minimumSize, index });
            }
            this.addPanes(panesToAdd);
            this.restoreViewSizes();
            const panes = [];
            for (const { pane } of panesToAdd) {
                pane.setVisible(this.isVisible());
                panes.push(pane);
            }
            return panes;
        }
        onDidRemoveViewDescriptors(removed) {
            removed = removed.sort((a, b) => b.index - a.index);
            const panesToRemove = [];
            for (const { index } of removed) {
                const [disposable] = this.viewDisposables.splice(index, 1);
                disposable.dispose();
                panesToRemove.push(this.panes[index]);
            }
            this.removePanes(panesToRemove);
            for (const pane of panesToRemove) {
                pane.setVisible(false);
            }
        }
        toggleViewVisibility(viewId) {
            // Check if view is active
            if (this.viewContainerModel.activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === viewId)) {
                const visible = !this.viewContainerModel.isVisible(viewId);
                this.telemetryService.publicLog2('views.toggleVisibility', { viewId, visible });
                this.viewContainerModel.setVisible(viewId, visible);
            }
        }
        addPane(pane, size, index = this.paneItems.length - 1) {
            const onDidFocus = pane.onDidFocus(() => {
                this._onDidFocusView.fire(pane);
                this.lastFocusedPane = pane;
            });
            const onDidBlur = pane.onDidBlur(() => this._onDidBlurView.fire(pane));
            const onDidChangeTitleArea = pane.onDidChangeTitleArea(() => {
                if (this.isViewMergedWithContainer()) {
                    this.updateTitleArea();
                }
            });
            const onDidChangeVisibility = pane.onDidChangeBodyVisibility(() => this._onDidChangeViewVisibility.fire(pane));
            const onDidChange = pane.onDidChange(() => {
                if (pane === this.lastFocusedPane && !pane.isExpanded()) {
                    this.lastFocusedPane = undefined;
                }
            });
            const isPanel = this.viewDescriptorService.getViewContainerLocation(this.viewContainer) === 1 /* ViewContainerLocation.Panel */;
            const paneStyler = (0, styler_1.attachStyler)(this.themeService, {
                headerForeground: isPanel ? theme_1.PANEL_SECTION_HEADER_FOREGROUND : theme_1.SIDE_BAR_SECTION_HEADER_FOREGROUND,
                headerBackground: isPanel ? theme_1.PANEL_SECTION_HEADER_BACKGROUND : theme_1.SIDE_BAR_SECTION_HEADER_BACKGROUND,
                headerBorder: isPanel ? theme_1.PANEL_SECTION_HEADER_BORDER : theme_1.SIDE_BAR_SECTION_HEADER_BORDER,
                dropBackground: isPanel ? theme_1.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND : theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND,
                leftBorder: isPanel ? theme_1.PANEL_SECTION_BORDER : undefined
            }, pane);
            const disposable = (0, lifecycle_1.combinedDisposable)(pane, onDidFocus, onDidBlur, onDidChangeTitleArea, paneStyler, onDidChange, onDidChangeVisibility);
            const paneItem = { pane, disposable };
            this.paneItems.splice(index, 0, paneItem);
            (0, types_1.assertIsDefined)(this.paneview).addPane(pane, size, index);
            let overlay;
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerDraggable(pane.draggableElement, () => { return { type: 'view', id: pane.id }; }, {}));
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(pane.dropTargetElement, {
                onDragEnter: (e) => {
                    var _a, _b;
                    if (!overlay) {
                        const dropData = e.dragAndDropData.getData();
                        if (dropData.type === 'view' && dropData.id !== pane.id) {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && (!viewDescriptor || !viewDescriptor.canMoveView || this.viewContainer.rejectAddedViews)) {
                                return;
                            }
                            overlay = new ViewPaneDropOverlay(pane.dropTargetElement, (_a = this.orientation) !== null && _a !== void 0 ? _a : 0 /* Orientation.VERTICAL */, undefined, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                        }
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id && !this.viewContainer.rejectAddedViews) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const viewsToMove = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!viewsToMove.some(v => !v.canMoveView) && viewsToMove.length > 0) {
                                overlay = new ViewPaneDropOverlay(pane.dropTargetElement, (_b = this.orientation) !== null && _b !== void 0 ? _b : 0 /* Orientation.VERTICAL */, undefined, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                            }
                        }
                    }
                },
                onDragOver: (e) => {
                    (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', overlay !== undefined);
                },
                onDragLeave: (e) => {
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                },
                onDrop: (e) => {
                    if (overlay) {
                        const dropData = e.dragAndDropData.getData();
                        const viewsToMove = [];
                        let anchorView;
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id && !this.viewContainer.rejectAddedViews) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const allViews = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (allViews.length > 0 && !allViews.some(v => !v.canMoveView)) {
                                viewsToMove.push(...allViews);
                                anchorView = allViews[0];
                            }
                        }
                        else if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && viewDescriptor && viewDescriptor.canMoveView && !this.viewContainer.rejectAddedViews) {
                                viewsToMove.push(viewDescriptor);
                            }
                            if (viewDescriptor) {
                                anchorView = viewDescriptor;
                            }
                        }
                        if (viewsToMove) {
                            this.viewDescriptorService.moveViewsToContainer(viewsToMove, this.viewContainer);
                        }
                        if (anchorView) {
                            if (overlay.currentDropOperation === 1 /* DropDirection.DOWN */ ||
                                overlay.currentDropOperation === 3 /* DropDirection.RIGHT */) {
                                const fromIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                let toIndex = this.panes.findIndex(p => p.id === pane.id);
                                if (fromIndex >= 0 && toIndex >= 0) {
                                    if (fromIndex > toIndex) {
                                        toIndex++;
                                    }
                                    if (toIndex < this.panes.length && toIndex !== fromIndex) {
                                        this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                    }
                                }
                            }
                            if (overlay.currentDropOperation === 0 /* DropDirection.UP */ ||
                                overlay.currentDropOperation === 2 /* DropDirection.LEFT */) {
                                const fromIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                let toIndex = this.panes.findIndex(p => p.id === pane.id);
                                if (fromIndex >= 0 && toIndex >= 0) {
                                    if (fromIndex < toIndex) {
                                        toIndex--;
                                    }
                                    if (toIndex >= 0 && toIndex !== fromIndex) {
                                        this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                    }
                                }
                            }
                            if (viewsToMove.length > 1) {
                                viewsToMove.slice(1).forEach(view => {
                                    let toIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                    let fromIndex = this.panes.findIndex(p => p.id === view.id);
                                    if (fromIndex >= 0 && toIndex >= 0) {
                                        if (fromIndex > toIndex) {
                                            toIndex++;
                                        }
                                        if (toIndex < this.panes.length && toIndex !== fromIndex) {
                                            this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                            anchorView = view;
                                        }
                                    }
                                });
                            }
                        }
                    }
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                }
            }));
        }
        removePanes(panes) {
            const wasMerged = this.isViewMergedWithContainer();
            panes.forEach(pane => this.removePane(pane));
            this.updateViewHeaders();
            if (wasMerged !== this.isViewMergedWithContainer()) {
                this.updateTitleArea();
            }
            this._onDidRemoveViews.fire(panes);
        }
        removePane(pane) {
            const index = this.paneItems.findIndex(i => i.pane === pane);
            if (index === -1) {
                return;
            }
            if (this.lastFocusedPane === pane) {
                this.lastFocusedPane = undefined;
            }
            (0, types_1.assertIsDefined)(this.paneview).removePane(pane);
            const [paneItem] = this.paneItems.splice(index, 1);
            paneItem.disposable.dispose();
        }
        movePane(from, to) {
            const fromIndex = this.paneItems.findIndex(item => item.pane === from);
            const toIndex = this.paneItems.findIndex(item => item.pane === to);
            const fromViewDescriptor = this.viewContainerModel.visibleViewDescriptors[fromIndex];
            const toViewDescriptor = this.viewContainerModel.visibleViewDescriptors[toIndex];
            if (fromIndex < 0 || fromIndex >= this.paneItems.length) {
                return;
            }
            if (toIndex < 0 || toIndex >= this.paneItems.length) {
                return;
            }
            const [paneItem] = this.paneItems.splice(fromIndex, 1);
            this.paneItems.splice(toIndex, 0, paneItem);
            (0, types_1.assertIsDefined)(this.paneview).movePane(from, to);
            this.viewContainerModel.move(fromViewDescriptor.id, toViewDescriptor.id);
            this.updateTitleArea();
        }
        resizePane(pane, size) {
            (0, types_1.assertIsDefined)(this.paneview).resizePane(pane, size);
        }
        getPaneSize(pane) {
            return (0, types_1.assertIsDefined)(this.paneview).getPaneSize(pane);
        }
        updateViewHeaders() {
            if (this.isViewMergedWithContainer()) {
                if (this.paneItems[0].pane.isExpanded()) {
                    this.lastMergedCollapsedPane = undefined;
                }
                else {
                    this.lastMergedCollapsedPane = this.paneItems[0].pane;
                    this.paneItems[0].pane.setExpanded(true);
                }
                this.paneItems[0].pane.headerVisible = false;
            }
            else {
                this.paneItems.forEach(i => {
                    i.pane.headerVisible = true;
                    if (i.pane === this.lastMergedCollapsedPane) {
                        i.pane.setExpanded(false);
                    }
                });
                this.lastMergedCollapsedPane = undefined;
            }
        }
        isViewMergedWithContainer() {
            if (!(this.options.mergeViewWithContainerWhenSingleView && this.paneItems.length === 1)) {
                return false;
            }
            if (!this.areExtensionsReady) {
                if (this.visibleViewsCountFromCache === undefined) {
                    // TODO @sbatten fix hack for #91367
                    return this.viewDescriptorService.getViewContainerLocation(this.viewContainer) === 1 /* ViewContainerLocation.Panel */;
                }
                // Check in cache so that view do not jump. See #29609
                return this.visibleViewsCountFromCache === 1;
            }
            return true;
        }
        onDidScrollPane() {
            for (const pane of this.panes) {
                pane.onDidScrollRoot();
            }
        }
        onDidSashReset(index) {
            var _a, _b, _c, _d;
            let firstPane = undefined;
            let secondPane = undefined;
            // Deal with collapsed views: to be clever, we split the space taken by the nearest uncollapsed views
            for (let i = index; i >= 0; i--) {
                if (((_a = this.paneItems[i].pane) === null || _a === void 0 ? void 0 : _a.isVisible()) && ((_b = this.paneItems[i]) === null || _b === void 0 ? void 0 : _b.pane.isExpanded())) {
                    firstPane = this.paneItems[i].pane;
                    break;
                }
            }
            for (let i = index + 1; i < this.paneItems.length; i++) {
                if (((_c = this.paneItems[i].pane) === null || _c === void 0 ? void 0 : _c.isVisible()) && ((_d = this.paneItems[i]) === null || _d === void 0 ? void 0 : _d.pane.isExpanded())) {
                    secondPane = this.paneItems[i].pane;
                    break;
                }
            }
            if (firstPane && secondPane) {
                const firstPaneSize = this.getPaneSize(firstPane);
                const secondPaneSize = this.getPaneSize(secondPane);
                // Avoid rounding errors and be consistent when resizing
                // The first pane always get half rounded up and the second is half rounded down
                const newFirstPaneSize = Math.ceil((firstPaneSize + secondPaneSize) / 2);
                const newSecondPaneSize = Math.floor((firstPaneSize + secondPaneSize) / 2);
                // Shrink the larger pane first, then grow the smaller pane
                // This prevents interfering with other view sizes
                if (firstPaneSize > secondPaneSize) {
                    this.resizePane(firstPane, newFirstPaneSize);
                    this.resizePane(secondPane, newSecondPaneSize);
                }
                else {
                    this.resizePane(secondPane, newSecondPaneSize);
                    this.resizePane(firstPane, newFirstPaneSize);
                }
            }
        }
        dispose() {
            super.dispose();
            this.paneItems.forEach(i => i.disposable.dispose());
            if (this.paneview) {
                this.paneview.dispose();
            }
        }
    };
    ViewPaneContainer = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, extensions_1.IExtensionService),
        __param(8, themeService_1.IThemeService),
        __param(9, storage_1.IStorageService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, views_1.IViewDescriptorService)
    ], ViewPaneContainer);
    exports.ViewPaneContainer = ViewPaneContainer;
    class ViewPaneContainerAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.desc = desc;
        }
        run(accessor, ...args) {
            const viewPaneContainer = accessor.get(views_1.IViewsService).getActiveViewPaneContainerWithId(this.desc.viewPaneContainerId);
            if (viewPaneContainer) {
                return this.runInViewPaneContainer(accessor, viewPaneContainer, ...args);
            }
        }
    }
    exports.ViewPaneContainerAction = ViewPaneContainerAction;
    class MoveViewPosition extends actions_1.Action2 {
        constructor(desc, offset) {
            super(desc);
            this.offset = offset;
        }
        async run(accessor) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const viewId = contextkeys_1.FocusedViewContext.getValue(contextKeyService);
            if (viewId === undefined) {
                return;
            }
            const viewContainer = viewDescriptorService.getViewContainerByViewId(viewId);
            const model = viewDescriptorService.getViewContainerModel(viewContainer);
            const viewDescriptor = model.visibleViewDescriptors.find(vd => vd.id === viewId);
            const currentIndex = model.visibleViewDescriptors.indexOf(viewDescriptor);
            if (currentIndex + this.offset < 0 || currentIndex + this.offset >= model.visibleViewDescriptors.length) {
                return;
            }
            const newPosition = model.visibleViewDescriptors[currentIndex + this.offset];
            model.move(viewDescriptor.id, newPosition.id);
        }
    }
    (0, actions_1.registerAction2)(class MoveViewUp extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewUp',
                title: nls.localize('viewMoveUp', "Move View Up"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 16 /* KeyCode.UpArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, -1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViewLeft extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewLeft',
                title: nls.localize('viewMoveLeft', "Move View Left"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 15 /* KeyCode.LeftArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, -1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViewDown extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewDown',
                title: nls.localize('viewMoveDown', "Move View Down"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 18 /* KeyCode.DownArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, 1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViewRight extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewRight',
                title: nls.localize('viewMoveRight', "Move View Right"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 17 /* KeyCode.RightArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, 1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViews extends actions_1.Action2 {
        constructor() {
            super({
                id: 'vscode.moveViews',
                title: nls.localize('viewsMove', "Move Views"),
            });
        }
        async run(accessor, options) {
            if (!Array.isArray(options === null || options === void 0 ? void 0 : options.viewIds) || typeof (options === null || options === void 0 ? void 0 : options.destinationId) !== 'string') {
                return Promise.reject('Invalid arguments');
            }
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const destination = viewDescriptorService.getViewContainerById(options.destinationId);
            if (!destination) {
                return;
            }
            // FYI, don't use `moveViewsToContainer` in 1 shot, because it expects all views to have the same current location
            for (const viewId of options.viewIds) {
                const viewDescriptor = viewDescriptorService.getViewDescriptorById(viewId);
                if (viewDescriptor === null || viewDescriptor === void 0 ? void 0 : viewDescriptor.canMoveView) {
                    viewDescriptorService.moveViewsToContainer([viewDescriptor], destination, views_1.ViewVisibilityState.Default);
                }
            }
            await accessor.get(views_1.IViewsService).openViewContainer(destination.id, true);
        }
    });
});
//# sourceMappingURL=viewPaneContainer.js.map