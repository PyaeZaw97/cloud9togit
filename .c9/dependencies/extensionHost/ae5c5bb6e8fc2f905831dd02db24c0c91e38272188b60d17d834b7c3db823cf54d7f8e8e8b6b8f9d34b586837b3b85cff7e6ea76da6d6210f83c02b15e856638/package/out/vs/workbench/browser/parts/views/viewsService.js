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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/workbench/common/contextkeys", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/base/common/event", "vs/base/common/types", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/browser/panecomposite", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/uri", "vs/workbench/common/actions", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, lifecycle_1, views_1, contextkeys_1, platform_1, storage_1, contextkey_1, event_1, types_1, actions_1, nls_1, extensions_1, instantiation_1, telemetry_1, themeService_1, contextView_1, extensions_2, workspace_1, panecomposite_1, layoutService_1, uri_1, actions_2, editorGroupsService_1, viewsViewlet_1, panecomposite_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPartByLocation = exports.ViewsService = void 0;
    let ViewsService = class ViewsService extends lifecycle_1.Disposable {
        constructor(viewDescriptorService, paneCompositeService, contextKeyService, layoutService) {
            super();
            this.viewDescriptorService = viewDescriptorService;
            this.paneCompositeService = paneCompositeService;
            this.contextKeyService = contextKeyService;
            this.layoutService = layoutService;
            this._onDidChangeViewVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewVisibility = this._onDidChangeViewVisibility.event;
            this._onDidChangeViewContainerVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewContainerVisibility = this._onDidChangeViewContainerVisibility.event;
            this.viewDisposable = new Map();
            this.visibleViewContextKeys = new Map();
            this.viewPaneContainers = new Map();
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.viewDisposable.forEach(disposable => disposable.dispose());
                this.viewDisposable.clear();
            }));
            this.viewDescriptorService.viewContainers.forEach(viewContainer => this.onDidRegisterViewContainer(viewContainer, this.viewDescriptorService.getViewContainerLocation(viewContainer)));
            this._register(this.viewDescriptorService.onDidChangeViewContainers(({ added, removed }) => this.onDidChangeContainers(added, removed)));
            this._register(this.viewDescriptorService.onDidChangeContainerLocation(({ viewContainer, from, to }) => this.onDidChangeContainerLocation(viewContainer, from, to)));
            // View Container Visibility
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(e => this._onDidChangeViewContainerVisibility.fire({ id: e.composite.getId(), visible: true, location: e.viewContainerLocation })));
            this._register(this.paneCompositeService.onDidPaneCompositeClose(e => this._onDidChangeViewContainerVisibility.fire({ id: e.composite.getId(), visible: false, location: e.viewContainerLocation })));
            this.focusedViewContextKey = contextkeys_1.FocusedViewContext.bindTo(contextKeyService);
        }
        onViewsAdded(added) {
            for (const view of added) {
                this.onViewsVisibilityChanged(view, view.isBodyVisible());
            }
        }
        onViewsVisibilityChanged(view, visible) {
            this.getOrCreateActiveViewContextKey(view).set(visible);
            this._onDidChangeViewVisibility.fire({ id: view.id, visible: visible });
        }
        onViewsRemoved(removed) {
            for (const view of removed) {
                this.onViewsVisibilityChanged(view, false);
            }
        }
        getOrCreateActiveViewContextKey(view) {
            const visibleContextKeyId = (0, contextkeys_1.getVisbileViewContextKey)(view.id);
            let contextKey = this.visibleViewContextKeys.get(visibleContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(visibleContextKeyId, false).bindTo(this.contextKeyService);
                this.visibleViewContextKeys.set(visibleContextKeyId, contextKey);
            }
            return contextKey;
        }
        onDidChangeContainers(added, removed) {
            for (const { container, location } of removed) {
                this.deregisterPaneComposite(container, location);
            }
            for (const { container, location } of added) {
                this.onDidRegisterViewContainer(container, location);
            }
        }
        onDidRegisterViewContainer(viewContainer, viewContainerLocation) {
            this.registerPaneComposite(viewContainer, viewContainerLocation);
            const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
            this.onViewDescriptorsAdded(viewContainerModel.allViewDescriptors, viewContainer);
            this._register(viewContainerModel.onDidChangeAllViewDescriptors(({ added, removed }) => {
                this.onViewDescriptorsAdded(added, viewContainer);
                this.onViewDescriptorsRemoved(removed);
            }));
            this._register(this.registerOpenViewContainerAction(viewContainer));
        }
        onDidChangeContainerLocation(viewContainer, from, to) {
            this.deregisterPaneComposite(viewContainer, from);
            this.registerPaneComposite(viewContainer, to);
        }
        onViewDescriptorsAdded(views, container) {
            const location = this.viewDescriptorService.getViewContainerLocation(container);
            if (location === null) {
                return;
            }
            const composite = this.getComposite(container.id, location);
            for (const viewDescriptor of views) {
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(this.registerOpenViewAction(viewDescriptor));
                disposables.add(this.registerFocusViewAction(viewDescriptor, (composite === null || composite === void 0 ? void 0 : composite.name) && composite.name !== composite.id ? composite.name : actions_2.CATEGORIES.View));
                disposables.add(this.registerResetViewLocationAction(viewDescriptor));
                this.viewDisposable.set(viewDescriptor, disposables);
            }
        }
        onViewDescriptorsRemoved(views) {
            for (const view of views) {
                const disposable = this.viewDisposable.get(view);
                if (disposable) {
                    disposable.dispose();
                    this.viewDisposable.delete(view);
                }
            }
        }
        async openComposite(compositeId, location, focus) {
            return this.paneCompositeService.openPaneComposite(compositeId, location, focus);
        }
        getComposite(compositeId, location) {
            return this.paneCompositeService.getPaneComposite(compositeId, location);
        }
        isViewContainerVisible(id) {
            var _a;
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                if (viewContainerLocation !== null) {
                    return ((_a = this.paneCompositeService.getActivePaneComposite(viewContainerLocation)) === null || _a === void 0 ? void 0 : _a.getId()) === id;
                }
            }
            return false;
        }
        getVisibleViewContainer(location) {
            var _a;
            const viewContainerId = (_a = this.paneCompositeService.getActivePaneComposite(location)) === null || _a === void 0 ? void 0 : _a.getId();
            return viewContainerId ? this.viewDescriptorService.getViewContainerById(viewContainerId) : null;
        }
        getActiveViewPaneContainerWithId(viewContainerId) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(viewContainerId);
            return viewContainer ? this.getActiveViewPaneContainer(viewContainer) : null;
        }
        async openViewContainer(id, focus) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                if (viewContainerLocation !== null) {
                    const paneComposite = await this.paneCompositeService.openPaneComposite(id, viewContainerLocation, focus);
                    return paneComposite || null;
                }
            }
            return null;
        }
        async closeViewContainer(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                const isActive = viewContainerLocation !== null && this.paneCompositeService.getActivePaneComposite(viewContainerLocation);
                if (viewContainerLocation !== null) {
                    return isActive ? this.layoutService.setPartHidden(true, getPartByLocation(viewContainerLocation)) : undefined;
                }
            }
        }
        isViewVisible(id) {
            const activeView = this.getActiveViewWithId(id);
            return (activeView === null || activeView === void 0 ? void 0 : activeView.isBodyVisible()) || false;
        }
        getActiveViewWithId(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const activeViewPaneContainer = this.getActiveViewPaneContainer(viewContainer);
                if (activeViewPaneContainer) {
                    return activeViewPaneContainer.getView(id);
                }
            }
            return null;
        }
        getViewWithId(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const viewPaneContainer = this.viewPaneContainers.get(viewContainer.id);
                if (viewPaneContainer) {
                    return viewPaneContainer.getView(id);
                }
            }
            return null;
        }
        async openView(id, focus) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (!viewContainer) {
                return null;
            }
            if (!this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === id)) {
                return null;
            }
            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            const compositeDescriptor = this.getComposite(viewContainer.id, location);
            if (compositeDescriptor) {
                const paneComposite = await this.openComposite(compositeDescriptor.id, location);
                if (paneComposite && paneComposite.openView) {
                    return paneComposite.openView(id, focus) || null;
                }
                else if (focus) {
                    paneComposite === null || paneComposite === void 0 ? void 0 : paneComposite.focus();
                }
            }
            return null;
        }
        closeView(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const activeViewPaneContainer = this.getActiveViewPaneContainer(viewContainer);
                if (activeViewPaneContainer) {
                    const view = activeViewPaneContainer.getView(id);
                    if (view) {
                        if (activeViewPaneContainer.views.length === 1) {
                            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                            if (location === 0 /* ViewContainerLocation.Sidebar */) {
                                this.layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                            }
                            else if (location === 1 /* ViewContainerLocation.Panel */ || location === 2 /* ViewContainerLocation.AuxiliaryBar */) {
                                this.paneCompositeService.hideActivePaneComposite(location);
                            }
                            // The blur event doesn't fire on WebKit when the focused element is hidden,
                            // so the context key needs to be forced here too otherwise a view may still
                            // think it's showing, breaking toggle commands.
                            if (this.focusedViewContextKey.get() === id) {
                                this.focusedViewContextKey.reset();
                            }
                        }
                        else {
                            view.setExpanded(false);
                        }
                    }
                }
            }
        }
        getActiveViewPaneContainer(viewContainer) {
            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            if (location === null) {
                return null;
            }
            const activePaneComposite = this.paneCompositeService.getActivePaneComposite(location);
            if ((activePaneComposite === null || activePaneComposite === void 0 ? void 0 : activePaneComposite.getId()) === viewContainer.id) {
                return activePaneComposite.getViewPaneContainer() || null;
            }
            return null;
        }
        getViewProgressIndicator(viewId) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(viewId);
            if (!viewContainer) {
                return undefined;
            }
            const viewPaneContainer = this.viewPaneContainers.get(viewContainer.id);
            if (!viewPaneContainer) {
                return undefined;
            }
            const view = viewPaneContainer.getView(viewId);
            if (!view) {
                return undefined;
            }
            if (viewPaneContainer.isViewMergedWithContainer()) {
                return this.getViewContainerProgressIndicator(viewContainer);
            }
            return view.getProgressIndicator();
        }
        getViewContainerProgressIndicator(viewContainer) {
            const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            if (viewContainerLocation === null) {
                return undefined;
            }
            return this.paneCompositeService.getProgressIndicator(viewContainer.id, viewContainerLocation);
        }
        registerOpenViewContainerAction(viewContainer) {
            var _a;
            const disposables = new lifecycle_1.DisposableStore();
            if (viewContainer.openCommandActionDescriptor) {
                let { id, title, mnemonicTitle, keybindings, order } = (_a = viewContainer.openCommandActionDescriptor) !== null && _a !== void 0 ? _a : { id: viewContainer.id };
                title = title !== null && title !== void 0 ? title : viewContainer.title;
                const that = this;
                disposables.add((0, actions_1.registerAction2)(class OpenViewContainerAction extends actions_1.Action2 {
                    constructor() {
                        super({
                            id,
                            get title() {
                                const viewContainerLocation = that.viewDescriptorService.getViewContainerLocation(viewContainer);
                                if (viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                                    return { value: (0, nls_1.localize)('show view', "Show {0}", title), original: `Show ${title}` };
                                }
                                else {
                                    return { value: (0, nls_1.localize)('toggle view', "Toggle {0}", title), original: `Toggle ${title}` };
                                }
                            },
                            category: actions_2.CATEGORIES.View,
                            precondition: contextkey_1.ContextKeyExpr.has((0, contextkeys_1.getEnabledViewContainerContextKey)(viewContainer.id)),
                            keybinding: keybindings ? Object.assign(Object.assign({}, keybindings), { weight: 200 /* KeybindingWeight.WorkbenchContrib */ }) : undefined,
                            f1: true
                        });
                    }
                    async run(serviceAccessor) {
                        const editorGroupService = serviceAccessor.get(editorGroupsService_1.IEditorGroupsService);
                        const viewDescriptorService = serviceAccessor.get(views_1.IViewDescriptorService);
                        const layoutService = serviceAccessor.get(layoutService_1.IWorkbenchLayoutService);
                        const viewsService = serviceAccessor.get(views_1.IViewsService);
                        const viewContainerLocation = viewDescriptorService.getViewContainerLocation(viewContainer);
                        switch (viewContainerLocation) {
                            case 0 /* ViewContainerLocation.Sidebar */:
                                if (!viewsService.isViewContainerVisible(viewContainer.id) || !layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                                    await viewsService.openViewContainer(viewContainer.id, true);
                                }
                                else {
                                    editorGroupService.activeGroup.focus();
                                }
                                break;
                            case 1 /* ViewContainerLocation.Panel */:
                                if (!viewsService.isViewContainerVisible(viewContainer.id) || !layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                                    await viewsService.openViewContainer(viewContainer.id, true);
                                }
                                else {
                                    viewsService.closeViewContainer(viewContainer.id);
                                }
                                break;
                        }
                    }
                }));
                if (mnemonicTitle) {
                    const defaultLocation = this.viewDescriptorService.getDefaultViewContainerLocation(viewContainer);
                    disposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
                        command: {
                            id,
                            title: mnemonicTitle,
                        },
                        group: defaultLocation === 0 /* ViewContainerLocation.Sidebar */ ? '3_views' : '4_panels',
                        when: contextkey_1.ContextKeyExpr.has((0, contextkeys_1.getEnabledViewContainerContextKey)(viewContainer.id)),
                        order: order !== null && order !== void 0 ? order : Number.MAX_VALUE
                    }));
                }
            }
            return disposables;
        }
        registerOpenViewAction(viewDescriptor) {
            var _a, _b;
            const disposables = new lifecycle_1.DisposableStore();
            if (viewDescriptor.openCommandActionDescriptor) {
                const title = (_a = viewDescriptor.openCommandActionDescriptor.title) !== null && _a !== void 0 ? _a : viewDescriptor.name;
                const commandId = viewDescriptor.openCommandActionDescriptor.id;
                const that = this;
                disposables.add((0, actions_1.registerAction2)(class OpenViewAction extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: commandId,
                            get title() {
                                const viewContainerLocation = that.viewDescriptorService.getViewLocationById(viewDescriptor.id);
                                if (viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                                    return { value: (0, nls_1.localize)('show view', "Show {0}", title), original: `Show ${title}` };
                                }
                                else {
                                    return { value: (0, nls_1.localize)('toggle view', "Toggle {0}", title), original: `Toggle ${title}` };
                                }
                            },
                            category: actions_2.CATEGORIES.View,
                            precondition: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`),
                            keybinding: viewDescriptor.openCommandActionDescriptor.keybindings ? Object.assign(Object.assign({}, viewDescriptor.openCommandActionDescriptor.keybindings), { weight: 200 /* KeybindingWeight.WorkbenchContrib */ }) : undefined,
                            f1: true
                        });
                    }
                    async run(serviceAccessor) {
                        const editorGroupService = serviceAccessor.get(editorGroupsService_1.IEditorGroupsService);
                        const viewDescriptorService = serviceAccessor.get(views_1.IViewDescriptorService);
                        const layoutService = serviceAccessor.get(layoutService_1.IWorkbenchLayoutService);
                        const viewsService = serviceAccessor.get(views_1.IViewsService);
                        const contextKeyService = serviceAccessor.get(contextkey_1.IContextKeyService);
                        const focusedViewId = contextkeys_1.FocusedViewContext.getValue(contextKeyService);
                        if (focusedViewId === viewDescriptor.id) {
                            const viewLocation = viewDescriptorService.getViewLocationById(viewDescriptor.id);
                            if (viewDescriptorService.getViewLocationById(viewDescriptor.id) === 0 /* ViewContainerLocation.Sidebar */) {
                                // focus the editor if the view is focused and in the side bar
                                editorGroupService.activeGroup.focus();
                            }
                            else if (viewLocation !== null) {
                                // otherwise hide the part where the view lives if focused
                                layoutService.setPartHidden(true, getPartByLocation(viewLocation));
                            }
                        }
                        else {
                            viewsService.openView(viewDescriptor.id, true);
                        }
                    }
                }));
                if (viewDescriptor.openCommandActionDescriptor.mnemonicTitle) {
                    const defaultViewContainer = this.viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
                    if (defaultViewContainer) {
                        const defaultLocation = this.viewDescriptorService.getDefaultViewContainerLocation(defaultViewContainer);
                        disposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
                            command: {
                                id: commandId,
                                title: viewDescriptor.openCommandActionDescriptor.mnemonicTitle,
                            },
                            group: defaultLocation === 0 /* ViewContainerLocation.Sidebar */ ? '3_views' : '4_panels',
                            when: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`),
                            order: (_b = viewDescriptor.openCommandActionDescriptor.order) !== null && _b !== void 0 ? _b : Number.MAX_VALUE
                        }));
                    }
                }
            }
            return disposables;
        }
        registerFocusViewAction(viewDescriptor, category) {
            return (0, actions_1.registerAction2)(class FocusViewAction extends actions_1.Action2 {
                constructor() {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    const title = (0, nls_1.localize)({ key: 'focus view', comment: ['{0} indicates the name of the view to be focused.'] }, "Focus on {0} View", viewDescriptor.name);
                    super({
                        id: viewDescriptor.focusCommand ? viewDescriptor.focusCommand.id : `${viewDescriptor.id}.focus`,
                        title: { original: `Focus on ${viewDescriptor.name} View`, value: title },
                        category,
                        menu: [{
                                id: actions_1.MenuId.CommandPalette,
                                when: viewDescriptor.when,
                            }],
                        keybinding: {
                            when: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`),
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            primary: (_b = (_a = viewDescriptor.focusCommand) === null || _a === void 0 ? void 0 : _a.keybindings) === null || _b === void 0 ? void 0 : _b.primary,
                            secondary: (_d = (_c = viewDescriptor.focusCommand) === null || _c === void 0 ? void 0 : _c.keybindings) === null || _d === void 0 ? void 0 : _d.secondary,
                            linux: (_f = (_e = viewDescriptor.focusCommand) === null || _e === void 0 ? void 0 : _e.keybindings) === null || _f === void 0 ? void 0 : _f.linux,
                            mac: (_h = (_g = viewDescriptor.focusCommand) === null || _g === void 0 ? void 0 : _g.keybindings) === null || _h === void 0 ? void 0 : _h.mac,
                            win: (_k = (_j = viewDescriptor.focusCommand) === null || _j === void 0 ? void 0 : _j.keybindings) === null || _k === void 0 ? void 0 : _k.win
                        },
                        description: {
                            description: title,
                            args: [
                                {
                                    name: 'focusOptions',
                                    description: 'Focus Options',
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            'preserveFocus': {
                                                type: 'boolean',
                                                default: false
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    });
                }
                run(accessor, options) {
                    accessor.get(views_1.IViewsService).openView(viewDescriptor.id, !(options === null || options === void 0 ? void 0 : options.preserveFocus));
                }
            });
        }
        registerResetViewLocationAction(viewDescriptor) {
            return (0, actions_1.registerAction2)(class ResetViewLocationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `${viewDescriptor.id}.resetViewLocation`,
                        title: {
                            original: 'Reset Location',
                            value: (0, nls_1.localize)('resetViewLocation', "Reset Location")
                        },
                        menu: [{
                                id: actions_1.MenuId.ViewTitleContext,
                                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewDescriptor.id), contextkey_1.ContextKeyExpr.equals(`${viewDescriptor.id}.defaultViewLocation`, false))),
                                group: '1_hide',
                                order: 2
                            }],
                    });
                }
                run(accessor) {
                    const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
                    const defaultContainer = viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
                    const containerModel = viewDescriptorService.getViewContainerModel(defaultContainer);
                    // The default container is hidden so we should try to reset its location first
                    if (defaultContainer.hideIfEmpty && containerModel.visibleViewDescriptors.length === 0) {
                        const defaultLocation = viewDescriptorService.getDefaultViewContainerLocation(defaultContainer);
                        viewDescriptorService.moveViewContainerToLocation(defaultContainer, defaultLocation);
                    }
                    viewDescriptorService.moveViewsToContainer([viewDescriptor], viewDescriptorService.getDefaultContainerById(viewDescriptor.id));
                    accessor.get(views_1.IViewsService).openView(viewDescriptor.id, true);
                }
            });
        }
        registerPaneComposite(viewContainer, viewContainerLocation) {
            const that = this;
            let PaneContainer = class PaneContainer extends panecomposite_1.PaneComposite {
                constructor(telemetryService, contextService, storageService, instantiationService, themeService, contextMenuService, extensionService) {
                    super(viewContainer.id, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
                }
                createViewPaneContainer(element) {
                    const viewPaneContainerDisposables = this._register(new lifecycle_1.DisposableStore());
                    // Use composite's instantiation service to get the editor progress service for any editors instantiated within the composite
                    const viewPaneContainer = that.createViewPaneContainer(element, viewContainer, viewContainerLocation, viewPaneContainerDisposables, this.instantiationService);
                    // Only updateTitleArea for non-filter views: microsoft/vscode-remote-release#3676
                    if (!(viewPaneContainer instanceof viewsViewlet_1.FilterViewPaneContainer)) {
                        viewPaneContainerDisposables.add(event_1.Event.any(viewPaneContainer.onDidAddViews, viewPaneContainer.onDidRemoveViews, viewPaneContainer.onTitleAreaUpdate)(() => {
                            // Update title area since there is no better way to update secondary actions
                            this.updateTitleArea();
                        }));
                    }
                    return viewPaneContainer;
                }
            };
            PaneContainer = __decorate([
                __param(0, telemetry_1.ITelemetryService),
                __param(1, workspace_1.IWorkspaceContextService),
                __param(2, storage_1.IStorageService),
                __param(3, instantiation_1.IInstantiationService),
                __param(4, themeService_1.IThemeService),
                __param(5, contextView_1.IContextMenuService),
                __param(6, extensions_2.IExtensionService)
            ], PaneContainer);
            platform_1.Registry.as(getPaneCompositeExtension(viewContainerLocation)).registerPaneComposite(panecomposite_1.PaneCompositeDescriptor.create(PaneContainer, viewContainer.id, viewContainer.title, (0, types_1.isString)(viewContainer.icon) ? viewContainer.icon : undefined, viewContainer.order, viewContainer.requestedIndex, viewContainer.icon instanceof uri_1.URI ? viewContainer.icon : undefined));
        }
        deregisterPaneComposite(viewContainer, viewContainerLocation) {
            platform_1.Registry.as(getPaneCompositeExtension(viewContainerLocation)).deregisterPaneComposite(viewContainer.id);
        }
        createViewPaneContainer(element, viewContainer, viewContainerLocation, disposables, instantiationService) {
            const viewPaneContainer = instantiationService.createInstance(viewContainer.ctorDescriptor.ctor, ...(viewContainer.ctorDescriptor.staticArguments || []));
            this.viewPaneContainers.set(viewPaneContainer.getId(), viewPaneContainer);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.viewPaneContainers.delete(viewPaneContainer.getId())));
            disposables.add(viewPaneContainer.onDidAddViews(views => this.onViewsAdded(views)));
            disposables.add(viewPaneContainer.onDidChangeViewVisibility(view => this.onViewsVisibilityChanged(view, view.isBodyVisible())));
            disposables.add(viewPaneContainer.onDidRemoveViews(views => this.onViewsRemoved(views)));
            disposables.add(viewPaneContainer.onDidFocusView(view => this.focusedViewContextKey.set(view.id)));
            disposables.add(viewPaneContainer.onDidBlurView(view => {
                if (this.focusedViewContextKey.get() === view.id) {
                    this.focusedViewContextKey.reset();
                }
            }));
            return viewPaneContainer;
        }
    };
    ViewsService = __decorate([
        __param(0, views_1.IViewDescriptorService),
        __param(1, panecomposite_2.IPaneCompositePartService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], ViewsService);
    exports.ViewsService = ViewsService;
    function getPaneCompositeExtension(viewContainerLocation) {
        switch (viewContainerLocation) {
            case 2 /* ViewContainerLocation.AuxiliaryBar */:
                return panecomposite_1.Extensions.Auxiliary;
            case 1 /* ViewContainerLocation.Panel */:
                return panecomposite_1.Extensions.Panels;
            case 0 /* ViewContainerLocation.Sidebar */:
            default:
                return panecomposite_1.Extensions.Viewlets;
        }
    }
    function getPartByLocation(viewContainerLocation) {
        switch (viewContainerLocation) {
            case 2 /* ViewContainerLocation.AuxiliaryBar */:
                return "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */;
            case 1 /* ViewContainerLocation.Panel */:
                return "workbench.parts.panel" /* Parts.PANEL_PART */;
            case 0 /* ViewContainerLocation.Sidebar */:
            default:
                return "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
        }
    }
    exports.getPartByLocation = getPartByLocation;
    (0, extensions_1.registerSingleton)(views_1.IViewsService, ViewsService);
});
//# sourceMappingURL=viewsService.js.map