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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/compositePart", "vs/workbench/browser/panecomposite", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/contextkeys", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/extensions/common/extensions", "vs/base/common/types", "vs/workbench/browser/dnd", "vs/workbench/common/views", "vs/base/browser/touch", "vs/css!./media/sidebarpart", "vs/workbench/browser/parts/sidebar/sidebarActions"], function (require, exports, platform_1, compositePart_1, panecomposite_1, layoutService_1, contextkeys_1, storage_1, contextView_1, telemetry_1, keybinding_1, instantiation_1, event_1, themeService_1, colorRegistry_1, theme_1, notification_1, dom_1, mouseEvent_1, contextkey_1, extensions_1, types_1, dnd_1, views_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPart = void 0;
    let SidebarPart = class SidebarPart extends compositePart_1.CompositePart {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService) {
            super(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, platform_1.Registry.as(panecomposite_1.Extensions.Viewlets), SidebarPart.activeViewletSettingsKey, viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */).id, 'sideBar', 'viewlet', theme_1.SIDE_BAR_TITLE_FOREGROUND, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, { hasTitle: true, borderWidth: () => (this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder)) ? 1 : 0 });
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            //#region IView
            this.minimumWidth = 170;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.priority = 1 /* LayoutPriority.Low */;
            this.snap = true;
            this._onDidViewletDeregister = this._register(new event_1.Emitter());
            this.onDidPaneCompositeDeregister = this._onDidViewletDeregister.event;
            this.viewletRegistry = platform_1.Registry.as(panecomposite_1.Extensions.Viewlets);
            this.sideBarFocusContextKey = contextkeys_1.SidebarFocusContext.bindTo(this.contextKeyService);
            this.activeViewletContextKey = contextkeys_1.ActiveViewletContext.bindTo(this.contextKeyService);
            this.blockOpeningViewlet = false;
            this.registerListeners();
        }
        get preferredWidth() {
            const viewlet = this.getActivePaneComposite();
            if (!viewlet) {
                return;
            }
            const width = viewlet.getOptimalWidth();
            if (typeof width !== 'number') {
                return;
            }
            return Math.max(width, 300);
        }
        //#endregion
        get onDidPaneCompositeRegister() { return this.viewletRegistry.onDidRegister; }
        get onDidPaneCompositeOpen() { return event_1.Event.map(this.onDidCompositeOpen.event, compositeEvent => compositeEvent.composite); }
        get onDidPaneCompositeClose() { return this.onDidCompositeClose.event; }
        registerListeners() {
            // Viewlet open
            this._register(this.onDidPaneCompositeOpen(viewlet => {
                this.activeViewletContextKey.set(viewlet.getId());
            }));
            // Viewlet close
            this._register(this.onDidPaneCompositeClose(viewlet => {
                if (this.activeViewletContextKey.get() === viewlet.getId()) {
                    this.activeViewletContextKey.reset();
                }
            }));
            // Viewlet deregister
            this._register(this.registry.onDidDeregister(async (viewletDescriptor) => {
                var _a, _b;
                const activeContainers = this.viewDescriptorService.getViewContainersByLocation(0 /* ViewContainerLocation.Sidebar */)
                    .filter(container => this.viewDescriptorService.getViewContainerModel(container).activeViewDescriptors.length > 0);
                if (activeContainers.length) {
                    if (((_a = this.getActiveComposite()) === null || _a === void 0 ? void 0 : _a.getId()) === viewletDescriptor.id) {
                        const defaultViewletId = (_b = this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)) === null || _b === void 0 ? void 0 : _b.id;
                        const containerToOpen = activeContainers.filter(c => c.id === defaultViewletId)[0] || activeContainers[0];
                        await this.openPaneComposite(containerToOpen.id);
                    }
                }
                else {
                    this.layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                }
                this.removeComposite(viewletDescriptor.id);
                this._onDidViewletDeregister.fire(viewletDescriptor);
            }));
        }
        create(parent) {
            this.element = parent;
            super.create(parent);
            const focusTracker = this._register((0, dom_1.trackFocus)(parent));
            this._register(focusTracker.onDidFocus(() => this.sideBarFocusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.sideBarFocusContextKey.set(false)));
        }
        createTitleArea(parent) {
            const titleArea = super.createTitleArea(parent);
            this._register((0, dom_1.addDisposableListener)(titleArea, dom_1.EventType.CONTEXT_MENU, e => {
                this.onTitleAreaContextMenu(new mouseEvent_1.StandardMouseEvent(e));
            }));
            this._register(touch_1.Gesture.addTarget(titleArea));
            this._register((0, dom_1.addDisposableListener)(titleArea, touch_1.EventType.Contextmenu, e => {
                this.onTitleAreaContextMenu(new mouseEvent_1.StandardMouseEvent(e));
            }));
            this.titleLabelElement.draggable = true;
            const draggedItemProvider = () => {
                const activeViewlet = this.getActivePaneComposite();
                return { type: 'composite', id: activeViewlet.getId() };
            };
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerDraggable(this.titleLabelElement, draggedItemProvider, {}));
            return titleArea;
        }
        updateStyles() {
            var _a;
            super.updateStyles();
            // Part container
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.SIDE_BAR_BACKGROUND) || '';
            container.style.color = this.getColor(theme_1.SIDE_BAR_FOREGROUND) || '';
            const borderColor = this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const isPositionLeft = this.layoutService.getSideBarPosition() === 0 /* SideBarPosition.LEFT */;
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '';
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : '';
            container.style.borderRightColor = isPositionLeft ? borderColor || '' : '';
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '';
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : '';
            container.style.borderLeftColor = !isPositionLeft ? borderColor || '' : '';
            container.style.outlineColor = (_a = this.getColor(theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND)) !== null && _a !== void 0 ? _a : '';
        }
        layout(width, height, top, left) {
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                return;
            }
            super.layout(width, height, top, left);
        }
        // Viewlet service
        getActivePaneComposite() {
            return this.getActiveComposite();
        }
        getLastActivePaneCompositeId() {
            return this.getLastActiveCompositetId();
        }
        hideActivePaneComposite() {
            this.hideActiveComposite();
        }
        async openPaneComposite(id, focus) {
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenViewlet(id, focus);
            }
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenViewlet(id, focus);
            }
            return undefined;
        }
        getPaneComposites() {
            return this.viewletRegistry.getPaneComposites().sort((v1, v2) => {
                if (typeof v1.order !== 'number') {
                    return -1;
                }
                if (typeof v2.order !== 'number') {
                    return 1;
                }
                return v1.order - v2.order;
            });
        }
        getPaneComposite(id) {
            return this.getPaneComposites().filter(viewlet => viewlet.id === id)[0];
        }
        doOpenViewlet(id, focus) {
            if (this.blockOpeningViewlet) {
                return undefined; // Workaround against a potential race condition
            }
            // First check if sidebar is hidden and show if so
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                try {
                    this.blockOpeningViewlet = true;
                    this.layoutService.setPartHidden(false, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                }
                finally {
                    this.blockOpeningViewlet = false;
                }
            }
            return this.openComposite(id, focus);
        }
        getTitleAreaDropDownAnchorAlignment() {
            return this.layoutService.getSideBarPosition() === 0 /* SideBarPosition.LEFT */ ? 0 /* AnchorAlignment.LEFT */ : 1 /* AnchorAlignment.RIGHT */;
        }
        onTitleAreaContextMenu(event) {
            const activeViewlet = this.getActivePaneComposite();
            if (activeViewlet) {
                const contextMenuActions = activeViewlet ? activeViewlet.getContextMenuActions() : [];
                if (contextMenuActions.length) {
                    const anchor = { x: event.posx, y: event.posy };
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => anchor,
                        getActions: () => contextMenuActions.slice(),
                        getActionViewItem: action => this.actionViewItemProvider(action),
                        actionRunner: activeViewlet.getActionRunner()
                    });
                }
            }
        }
        toJSON() {
            return {
                type: "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */
            };
        }
    };
    SidebarPart.activeViewletSettingsKey = 'workbench.sidebar.activeviewletid';
    SidebarPart = __decorate([
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
    ], SidebarPart);
    exports.SidebarPart = SidebarPart;
});
//# sourceMappingURL=sidebarPart.js.map