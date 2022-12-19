/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/registry/common/platform", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/objects", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, event_1, nls_1, instantiation_1, lifecycle_1, map_1, platform_1, arrays_1, collections_1, objects_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResolvableTreeItem = exports.TreeItemCollapsibleState = exports.ViewVisibilityState = exports.IViewDescriptorService = exports.IViewsService = exports.ViewContentGroups = exports.ViewContainerLocationToString = exports.ViewContainerLocations = exports.ViewContainerLocation = exports.Extensions = exports.defaultViewIcon = void 0;
    exports.defaultViewIcon = (0, iconRegistry_1.registerIcon)('default-view-icon', codicons_1.Codicon.window, (0, nls_1.localize)('defaultViewIcon', 'Default view icon.'));
    var Extensions;
    (function (Extensions) {
        Extensions.ViewContainersRegistry = 'workbench.registry.view.containers';
        Extensions.ViewsRegistry = 'workbench.registry.view';
    })(Extensions = exports.Extensions || (exports.Extensions = {}));
    var ViewContainerLocation;
    (function (ViewContainerLocation) {
        ViewContainerLocation[ViewContainerLocation["Sidebar"] = 0] = "Sidebar";
        ViewContainerLocation[ViewContainerLocation["Panel"] = 1] = "Panel";
        ViewContainerLocation[ViewContainerLocation["AuxiliaryBar"] = 2] = "AuxiliaryBar";
    })(ViewContainerLocation = exports.ViewContainerLocation || (exports.ViewContainerLocation = {}));
    exports.ViewContainerLocations = [0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */, 2 /* ViewContainerLocation.AuxiliaryBar */];
    function ViewContainerLocationToString(viewContainerLocation) {
        switch (viewContainerLocation) {
            case 0 /* ViewContainerLocation.Sidebar */: return 'sidebar';
            case 1 /* ViewContainerLocation.Panel */: return 'panel';
            case 2 /* ViewContainerLocation.AuxiliaryBar */: return 'auxiliarybar';
        }
    }
    exports.ViewContainerLocationToString = ViewContainerLocationToString;
    class ViewContainersRegistryImpl extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidDeregister = this._register(new event_1.Emitter());
            this.onDidDeregister = this._onDidDeregister.event;
            this.viewContainers = new Map();
            this.defaultViewContainers = [];
        }
        get all() {
            return (0, arrays_1.flatten)([...this.viewContainers.values()]);
        }
        registerViewContainer(viewContainerDescriptor, viewContainerLocation, options) {
            var _a;
            const existing = this.get(viewContainerDescriptor.id);
            if (existing) {
                return existing;
            }
            const viewContainer = viewContainerDescriptor;
            viewContainer.openCommandActionDescriptor = (options === null || options === void 0 ? void 0 : options.donotRegisterOpenCommand) ? undefined : ((_a = viewContainer.openCommandActionDescriptor) !== null && _a !== void 0 ? _a : { id: viewContainer.id });
            const viewContainers = (0, map_1.getOrSet)(this.viewContainers, viewContainerLocation, []);
            viewContainers.push(viewContainer);
            if (options === null || options === void 0 ? void 0 : options.isDefault) {
                this.defaultViewContainers.push(viewContainer);
            }
            this._onDidRegister.fire({ viewContainer, viewContainerLocation });
            return viewContainer;
        }
        deregisterViewContainer(viewContainer) {
            for (const viewContainerLocation of this.viewContainers.keys()) {
                const viewContainers = this.viewContainers.get(viewContainerLocation);
                const index = viewContainers === null || viewContainers === void 0 ? void 0 : viewContainers.indexOf(viewContainer);
                if (index !== -1) {
                    viewContainers === null || viewContainers === void 0 ? void 0 : viewContainers.splice(index, 1);
                    if (viewContainers.length === 0) {
                        this.viewContainers.delete(viewContainerLocation);
                    }
                    this._onDidDeregister.fire({ viewContainer, viewContainerLocation });
                    return;
                }
            }
        }
        get(id) {
            return this.all.filter(viewContainer => viewContainer.id === id)[0];
        }
        getViewContainers(location) {
            return [...(this.viewContainers.get(location) || [])];
        }
        getViewContainerLocation(container) {
            return [...this.viewContainers.keys()].filter(location => this.getViewContainers(location).filter(viewContainer => (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.id) === container.id).length > 0)[0];
        }
        getDefaultViewContainer(location) {
            return this.defaultViewContainers.find(viewContainer => this.getViewContainerLocation(viewContainer) === location);
        }
    }
    platform_1.Registry.add(Extensions.ViewContainersRegistry, new ViewContainersRegistryImpl());
    var ViewContentGroups;
    (function (ViewContentGroups) {
        ViewContentGroups["Open"] = "2_open";
        ViewContentGroups["Debug"] = "4_debug";
        ViewContentGroups["SCM"] = "5_scm";
        ViewContentGroups["More"] = "9_more";
    })(ViewContentGroups = exports.ViewContentGroups || (exports.ViewContentGroups = {}));
    function compareViewContentDescriptors(a, b) {
        var _a, _b, _c, _d;
        const aGroup = (_a = a.group) !== null && _a !== void 0 ? _a : ViewContentGroups.More;
        const bGroup = (_b = b.group) !== null && _b !== void 0 ? _b : ViewContentGroups.More;
        if (aGroup !== bGroup) {
            return aGroup.localeCompare(bGroup);
        }
        return ((_c = a.order) !== null && _c !== void 0 ? _c : 5) - ((_d = b.order) !== null && _d !== void 0 ? _d : 5);
    }
    class ViewsRegistry extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onViewsRegistered = this._register(new event_1.Emitter());
            this.onViewsRegistered = this._onViewsRegistered.event;
            this._onViewsDeregistered = this._register(new event_1.Emitter());
            this.onViewsDeregistered = this._onViewsDeregistered.event;
            this._onDidChangeContainer = this._register(new event_1.Emitter());
            this.onDidChangeContainer = this._onDidChangeContainer.event;
            this._onDidChangeViewWelcomeContent = this._register(new event_1.Emitter());
            this.onDidChangeViewWelcomeContent = this._onDidChangeViewWelcomeContent.event;
            this._viewContainers = [];
            this._views = new Map();
            this._viewWelcomeContents = new collections_1.SetMap();
        }
        registerViews(views, viewContainer) {
            this.registerViews2([{ views, viewContainer }]);
        }
        registerViews2(views) {
            views.forEach(({ views, viewContainer }) => this.addViews(views, viewContainer));
            this._onViewsRegistered.fire(views);
        }
        deregisterViews(viewDescriptors, viewContainer) {
            const views = this.removeViews(viewDescriptors, viewContainer);
            if (views.length) {
                this._onViewsDeregistered.fire({ views, viewContainer });
            }
        }
        moveViews(viewsToMove, viewContainer) {
            for (const container of this._views.keys()) {
                if (container !== viewContainer) {
                    const views = this.removeViews(viewsToMove, container);
                    if (views.length) {
                        this.addViews(views, viewContainer);
                        this._onDidChangeContainer.fire({ views, from: container, to: viewContainer });
                    }
                }
            }
        }
        getViews(loc) {
            return this._views.get(loc) || [];
        }
        getView(id) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === id)[0];
                if (viewDescriptor) {
                    return viewDescriptor;
                }
            }
            return null;
        }
        getViewContainer(viewId) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === viewId)[0];
                if (viewDescriptor) {
                    return viewContainer;
                }
            }
            return null;
        }
        registerViewWelcomeContent(id, viewContent) {
            this._viewWelcomeContents.add(id, viewContent);
            this._onDidChangeViewWelcomeContent.fire(id);
            return (0, lifecycle_1.toDisposable)(() => {
                this._viewWelcomeContents.delete(id, viewContent);
                this._onDidChangeViewWelcomeContent.fire(id);
            });
        }
        registerViewWelcomeContent2(id, viewContentMap) {
            const disposables = new Map();
            for (const [key, content] of viewContentMap) {
                this._viewWelcomeContents.add(id, content);
                disposables.set(key, (0, lifecycle_1.toDisposable)(() => {
                    this._viewWelcomeContents.delete(id, content);
                    this._onDidChangeViewWelcomeContent.fire(id);
                }));
            }
            this._onDidChangeViewWelcomeContent.fire(id);
            return disposables;
        }
        getViewWelcomeContent(id) {
            const result = [];
            this._viewWelcomeContents.forEach(id, descriptor => result.push(descriptor));
            return result.sort(compareViewContentDescriptors);
        }
        addViews(viewDescriptors, viewContainer) {
            let views = this._views.get(viewContainer);
            if (!views) {
                views = [];
                this._views.set(viewContainer, views);
                this._viewContainers.push(viewContainer);
            }
            for (const viewDescriptor of viewDescriptors) {
                if (this.getView(viewDescriptor.id) !== null) {
                    throw new Error((0, nls_1.localize)('duplicateId', "A view with id '{0}' is already registered", viewDescriptor.id));
                }
                views.push(viewDescriptor);
            }
        }
        removeViews(viewDescriptors, viewContainer) {
            const views = this._views.get(viewContainer);
            if (!views) {
                return [];
            }
            const viewsToDeregister = [];
            const remaningViews = [];
            for (const view of views) {
                if (!viewDescriptors.includes(view)) {
                    remaningViews.push(view);
                }
                else {
                    viewsToDeregister.push(view);
                }
            }
            if (viewsToDeregister.length) {
                if (remaningViews.length) {
                    this._views.set(viewContainer, remaningViews);
                }
                else {
                    this._views.delete(viewContainer);
                    this._viewContainers.splice(this._viewContainers.indexOf(viewContainer), 1);
                }
            }
            return viewsToDeregister;
        }
    }
    platform_1.Registry.add(Extensions.ViewsRegistry, new ViewsRegistry());
    exports.IViewsService = (0, instantiation_1.createDecorator)('viewsService');
    exports.IViewDescriptorService = (0, instantiation_1.createDecorator)('viewDescriptorService');
    var ViewVisibilityState;
    (function (ViewVisibilityState) {
        ViewVisibilityState[ViewVisibilityState["Default"] = 0] = "Default";
        ViewVisibilityState[ViewVisibilityState["Expand"] = 1] = "Expand";
    })(ViewVisibilityState = exports.ViewVisibilityState || (exports.ViewVisibilityState = {}));
    var TreeItemCollapsibleState;
    (function (TreeItemCollapsibleState) {
        TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
    })(TreeItemCollapsibleState = exports.TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = {}));
    class ResolvableTreeItem {
        constructor(treeItem, resolve) {
            this.resolved = false;
            this._hasResolve = false;
            (0, objects_1.mixin)(this, treeItem);
            this._hasResolve = !!resolve;
            this.resolve = async (token) => {
                var _a, _b;
                if (resolve && !this.resolved) {
                    const resolvedItem = await resolve(token);
                    if (resolvedItem) {
                        // Resolvable elements. Currently tooltip and command.
                        this.tooltip = (_a = this.tooltip) !== null && _a !== void 0 ? _a : resolvedItem.tooltip;
                        this.command = (_b = this.command) !== null && _b !== void 0 ? _b : resolvedItem.command;
                    }
                }
                if (!token.isCancellationRequested) {
                    this.resolved = true;
                }
            };
        }
        get hasResolve() {
            return this._hasResolve;
        }
        resetResolve() {
            this.resolved = false;
        }
        asTreeItem() {
            return {
                handle: this.handle,
                parentHandle: this.parentHandle,
                collapsibleState: this.collapsibleState,
                label: this.label,
                description: this.description,
                icon: this.icon,
                iconDark: this.iconDark,
                themeIcon: this.themeIcon,
                resourceUri: this.resourceUri,
                tooltip: this.tooltip,
                contextValue: this.contextValue,
                command: this.command,
                children: this.children,
                accessibilityInformation: this.accessibilityInformation
            };
        }
    }
    exports.ResolvableTreeItem = ResolvableTreeItem;
});
//# sourceMappingURL=views.js.map