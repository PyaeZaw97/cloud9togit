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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/resources", "vs/base/common/strings", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/themeService", "vs/workbench/browser/panecomposite", "vs/workbench/browser/parts/views/treeView", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/remote/browser/remoteExplorer", "vs/workbench/contrib/scm/common/scm", "vs/workbench/contrib/webviewView/browser/webviewViewPane", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/keyCodes", "vs/platform/list/browser/listService", "vs/workbench/services/hover/browser/hover", "vs/base/common/cancellation", "vs/base/browser/ui/tree/asyncDataTree", "vs/workbench/services/views/browser/treeViewsService"], function (require, exports, arrays_1, collections_1, resources, strings_1, nls_1, contextkey_1, extensions_1, descriptors_1, instantiation_1, platform_1, themeService_1, panecomposite_1, treeView_1, viewPaneContainer_1, contributions_1, views_1, debug_1, files_1, remoteExplorer_1, scm_1, webviewViewPane_1, extensions_2, extensionsRegistry_1, keybindingsRegistry_1, keyCodes_1, listService_1, hover_1, cancellation_1, asyncDataTree_1, treeViewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.viewsContainersContribution = void 0;
    const viewsContainerSchema = {
        type: 'object',
        properties: {
            id: {
                description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.views.containers.id', comment: ['Contribution refers to those that an extension contributes to VS Code through an extension/contribution point. '] }, "Unique id used to identify the container in which views can be contributed using 'views' contribution point"),
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$'
            },
            title: {
                description: (0, nls_1.localize)('vscode.extension.contributes.views.containers.title', 'Human readable string used to render the container'),
                type: 'string'
            },
            icon: {
                description: (0, nls_1.localize)('vscode.extension.contributes.views.containers.icon', "Path to the container icon. Icons are 24x24 centered on a 50x40 block and have a fill color of 'rgb(215, 218, 224)' or '#d7dae0'. It is recommended that icons be in SVG, though any image file type is accepted."),
                type: 'string'
            }
        },
        required: ['id', 'title', 'icon']
    };
    exports.viewsContainersContribution = {
        description: (0, nls_1.localize)('vscode.extension.contributes.viewsContainers', 'Contributes views containers to the editor'),
        type: 'object',
        properties: {
            'activitybar': {
                description: (0, nls_1.localize)('views.container.activitybar', "Contribute views containers to Activity Bar"),
                type: 'array',
                items: viewsContainerSchema
            },
            'panel': {
                description: (0, nls_1.localize)('views.container.panel', "Contribute views containers to Panel"),
                type: 'array',
                items: viewsContainerSchema
            }
        }
    };
    var ViewType;
    (function (ViewType) {
        ViewType["Tree"] = "tree";
        ViewType["Webview"] = "webview";
    })(ViewType || (ViewType = {}));
    var InitialVisibility;
    (function (InitialVisibility) {
        InitialVisibility["Visible"] = "visible";
        InitialVisibility["Hidden"] = "hidden";
        InitialVisibility["Collapsed"] = "collapsed";
    })(InitialVisibility || (InitialVisibility = {}));
    const viewDescriptor = {
        type: 'object',
        required: ['id', 'name'],
        defaultSnippets: [{ body: { id: '${1:id}', name: '${2:name}' } }],
        properties: {
            type: {
                markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.view.type', "Type of the view. This can either be `tree` for a tree view based view or `webview` for a webview based view. The default is `tree`."),
                type: 'string',
                enum: [
                    'tree',
                    'webview',
                ],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('vscode.extension.contributes.view.tree', "The view is backed by a `TreeView` created by `createTreeView`."),
                    (0, nls_1.localize)('vscode.extension.contributes.view.webview', "The view is backed by a `WebviewView` registered by `registerWebviewViewProvider`."),
                ]
            },
            id: {
                markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.view.id', 'Identifier of the view. This should be unique across all views. It is recommended to include your extension id as part of the view id. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
            icon: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.icon', "Path to the view icon. View icons are displayed when the name of the view cannot be shown. It is recommended that icons be in SVG, though any image file type is accepted."),
                type: 'string'
            },
            contextualTitle: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.contextualTitle', "Human-readable context for when the view is moved out of its original location. By default, the view's container name will be used."),
                type: 'string'
            },
            visibility: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.initialState', "Initial state of the view when the extension is first installed. Once the user has changed the view state by collapsing, moving, or hiding the view, the initial state will not be used again."),
                type: 'string',
                enum: [
                    'visible',
                    'hidden',
                    'collapsed'
                ],
                default: 'visible',
                enumDescriptions: [
                    (0, nls_1.localize)('vscode.extension.contributes.view.initialState.visible', "The default initial state for the view. In most containers the view will be expanded, however; some built-in containers (explorer, scm, and debug) show all contributed views collapsed regardless of the `visibility`."),
                    (0, nls_1.localize)('vscode.extension.contributes.view.initialState.hidden', "The view will not be shown in the view container, but will be discoverable through the views menu and other view entry points and can be un-hidden by the user."),
                    (0, nls_1.localize)('vscode.extension.contributes.view.initialState.collapsed', "The view will show in the view container, but will be collapsed.")
                ]
            }
        }
    };
    const remoteViewDescriptor = {
        type: 'object',
        required: ['id', 'name'],
        properties: {
            id: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.id', 'Identifier of the view. This should be unique across all views. It is recommended to include your extension id as part of the view id. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
            group: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.group', 'Nested group in the viewlet'),
                type: 'string'
            },
            remoteName: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.remoteName', 'The name of the remote type associated with this view'),
                type: ['string', 'array'],
                items: {
                    type: 'string'
                }
            }
        }
    };
    const viewsContribution = {
        description: (0, nls_1.localize)('vscode.extension.contributes.views', "Contributes views to the editor"),
        type: 'object',
        properties: {
            'explorer': {
                description: (0, nls_1.localize)('views.explorer', "Contributes views to Explorer container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'debug': {
                description: (0, nls_1.localize)('views.debug', "Contributes views to Debug container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'scm': {
                description: (0, nls_1.localize)('views.scm', "Contributes views to SCM container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'test': {
                description: (0, nls_1.localize)('views.test', "Contributes views to Test container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'remote': {
                description: (0, nls_1.localize)('views.remote', "Contributes views to Remote container in the Activity bar. To contribute to this container, enableProposedApi needs to be turned on"),
                type: 'array',
                items: remoteViewDescriptor,
                default: []
            }
        },
        additionalProperties: {
            description: (0, nls_1.localize)('views.contributed', "Contributes views to contributed views container"),
            type: 'array',
            items: viewDescriptor,
            default: []
        }
    };
    const viewsContainersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'viewsContainers',
        jsonSchema: exports.viewsContainersContribution
    });
    const viewsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'views',
        deps: [viewsContainersExtensionPoint],
        jsonSchema: viewsContribution
    });
    const CUSTOM_VIEWS_START_ORDER = 7;
    let ViewsExtensionHandler = class ViewsExtensionHandler {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this.viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            this.viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.handleAndRegisterCustomViewContainers();
            this.handleAndRegisterCustomViews();
            let showTreeHoverCancellation = new cancellation_1.CancellationTokenSource();
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: 'workbench.action.showTreeHover',
                handler: async (accessor, ...args) => {
                    showTreeHoverCancellation.cancel();
                    showTreeHoverCancellation = new cancellation_1.CancellationTokenSource();
                    const listService = accessor.get(listService_1.IListService);
                    const treeViewsService = accessor.get(treeViewsService_1.ITreeViewsService);
                    const hoverService = accessor.get(hover_1.IHoverService);
                    const lastFocusedList = listService.lastFocusedList;
                    if (!(lastFocusedList instanceof asyncDataTree_1.AsyncDataTree)) {
                        return;
                    }
                    const focus = lastFocusedList.getFocus();
                    if (!focus || (focus.length === 0)) {
                        return;
                    }
                    const treeItem = focus[0];
                    if (treeItem instanceof views_1.ResolvableTreeItem) {
                        await treeItem.resolve(showTreeHoverCancellation.token);
                    }
                    if (!treeItem.tooltip) {
                        return;
                    }
                    const element = treeViewsService.getRenderedTreeElement(treeItem);
                    if (!element) {
                        return;
                    }
                    hoverService.showHover({
                        content: treeItem.tooltip,
                        target: element,
                        hoverPosition: 2 /* HoverPosition.BELOW */,
                        hideOnHover: false
                    }, true);
                },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                when: contextkey_1.ContextKeyExpr.and(treeView_1.RawCustomTreeViewContextKey, listService_1.WorkbenchListFocusContextKey)
            });
        }
        handleAndRegisterCustomViewContainers() {
            viewsContainersExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeCustomViewContainers(removed);
                }
                if (added.length) {
                    this.addCustomViewContainers(added, this.viewContainersRegistry.all);
                }
            });
        }
        addCustomViewContainers(extensionPoints, existingViewContainers) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            let activityBarOrder = CUSTOM_VIEWS_START_ORDER + viewContainersRegistry.all.filter(v => !!v.extensionId && viewContainersRegistry.getViewContainerLocation(v) === 0 /* ViewContainerLocation.Sidebar */).length;
            let panelOrder = 5 + viewContainersRegistry.all.filter(v => !!v.extensionId && viewContainersRegistry.getViewContainerLocation(v) === 1 /* ViewContainerLocation.Panel */).length + 1;
            for (let { value, collector, description } of extensionPoints) {
                (0, collections_1.forEach)(value, entry => {
                    if (!this.isValidViewsContainer(entry.value, collector)) {
                        return;
                    }
                    switch (entry.key) {
                        case 'activitybar':
                            activityBarOrder = this.registerCustomViewContainers(entry.value, description, activityBarOrder, existingViewContainers, 0 /* ViewContainerLocation.Sidebar */);
                            break;
                        case 'panel':
                            panelOrder = this.registerCustomViewContainers(entry.value, description, panelOrder, existingViewContainers, 1 /* ViewContainerLocation.Panel */);
                            break;
                    }
                });
            }
        }
        removeCustomViewContainers(extensionPoints) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            const removedExtensions = extensionPoints.reduce((result, e) => { result.add(extensions_1.ExtensionIdentifier.toKey(e.description.identifier)); return result; }, new Set());
            for (const viewContainer of viewContainersRegistry.all) {
                if (viewContainer.extensionId && removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(viewContainer.extensionId))) {
                    // move all views in this container into default view container
                    const views = this.viewsRegistry.getViews(viewContainer);
                    if (views.length) {
                        this.viewsRegistry.moveViews(views, this.getDefaultViewContainer());
                    }
                    this.deregisterCustomViewContainer(viewContainer);
                }
            }
        }
        isValidViewsContainer(viewsContainersDescriptors, collector) {
            if (!Array.isArray(viewsContainersDescriptors)) {
                collector.error((0, nls_1.localize)('viewcontainer requirearray', "views containers must be an array"));
                return false;
            }
            for (let descriptor of viewsContainersDescriptors) {
                if (typeof descriptor.id !== 'string' && (0, strings_1.isFalsyOrWhitespace)(descriptor.id)) {
                    collector.error((0, nls_1.localize)('requireidstring', "property `{0}` is mandatory and must be of type `string` with non-empty value. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (!(/^[a-z0-9_-]+$/i.test(descriptor.id))) {
                    collector.error((0, nls_1.localize)('requireidstring', "property `{0}` is mandatory and must be of type `string` with non-empty value. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (typeof descriptor.title !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'title'));
                    return false;
                }
                if (typeof descriptor.icon !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'icon'));
                    return false;
                }
                if ((0, strings_1.isFalsyOrWhitespace)(descriptor.title)) {
                    collector.warn((0, nls_1.localize)('requirenonemptystring', "property `{0}` is mandatory and must be of type `string` with non-empty value", 'title'));
                    return true;
                }
            }
            return true;
        }
        registerCustomViewContainers(containers, extension, order, existingViewContainers, location) {
            containers.forEach(descriptor => {
                const themeIcon = themeService_1.ThemeIcon.fromString(descriptor.icon);
                const icon = themeIcon || resources.joinPath(extension.extensionLocation, descriptor.icon);
                const id = `workbench.view.extension.${descriptor.id}`;
                const title = descriptor.title || id;
                const viewContainer = this.registerCustomViewContainer(id, title, icon, order++, extension.identifier, location);
                // Move those views that belongs to this container
                if (existingViewContainers.length) {
                    const viewsToMove = [];
                    for (const existingViewContainer of existingViewContainers) {
                        if (viewContainer !== existingViewContainer) {
                            viewsToMove.push(...this.viewsRegistry.getViews(existingViewContainer).filter(view => view.originalContainerId === descriptor.id));
                        }
                    }
                    if (viewsToMove.length) {
                        this.viewsRegistry.moveViews(viewsToMove, viewContainer);
                    }
                }
            });
            return order;
        }
        registerCustomViewContainer(id, title, icon, order, extensionId, location) {
            let viewContainer = this.viewContainersRegistry.get(id);
            if (!viewContainer) {
                viewContainer = this.viewContainersRegistry.registerViewContainer({
                    id,
                    title, extensionId,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [id, { mergeViewWithContainerWhenSingleView: true }]),
                    hideIfEmpty: true,
                    order,
                    icon,
                }, location);
            }
            return viewContainer;
        }
        deregisterCustomViewContainer(viewContainer) {
            this.viewContainersRegistry.deregisterViewContainer(viewContainer);
            platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).deregisterPaneComposite(viewContainer.id);
        }
        handleAndRegisterCustomViews() {
            viewsExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeViews(removed);
                }
                if (added.length) {
                    this.addViews(added);
                }
            });
        }
        addViews(extensions) {
            const viewIds = new Set();
            const allViewDescriptors = [];
            for (const extension of extensions) {
                const { value, collector } = extension;
                (0, collections_1.forEach)(value, entry => {
                    if (!this.isValidViewDescriptors(entry.value, collector)) {
                        return;
                    }
                    if (entry.key === 'remote' && !(0, extensions_2.isProposedApiEnabled)(extension.description, 'contribViewsRemote')) {
                        collector.warn((0, nls_1.localize)('ViewContainerRequiresProposedAPI', "View container '{0}' requires 'enabledApiProposals: [\"contribViewsRemote\"]' to be added to 'Remote'.", entry.key));
                        return;
                    }
                    const viewContainer = this.getViewContainer(entry.key);
                    if (!viewContainer) {
                        collector.warn((0, nls_1.localize)('ViewContainerDoesnotExist', "View container '{0}' does not exist and all views registered to it will be added to 'Explorer'.", entry.key));
                    }
                    const container = viewContainer || this.getDefaultViewContainer();
                    const viewDescriptors = (0, arrays_1.coalesce)(entry.value.map((item, index) => {
                        // validate
                        if (viewIds.has(item.id)) {
                            collector.error((0, nls_1.localize)('duplicateView1', "Cannot register multiple views with same id `{0}`", item.id));
                            return null;
                        }
                        if (this.viewsRegistry.getView(item.id) !== null) {
                            collector.error((0, nls_1.localize)('duplicateView2', "A view with id `{0}` is already registered.", item.id));
                            return null;
                        }
                        const order = extensions_1.ExtensionIdentifier.equals(extension.description.identifier, container.extensionId)
                            ? index + 1
                            : container.viewOrderDelegate
                                ? container.viewOrderDelegate.getOrder(item.group)
                                : undefined;
                        let icon;
                        if (typeof item.icon === 'string') {
                            icon = themeService_1.ThemeIcon.fromString(item.icon) || resources.joinPath(extension.description.extensionLocation, item.icon);
                        }
                        const initialVisibility = this.convertInitialVisibility(item.visibility);
                        const type = this.getViewType(item.type);
                        if (!type) {
                            collector.error((0, nls_1.localize)('unknownViewType', "Unknown view type `{0}`.", item.type));
                            return null;
                        }
                        const viewDescriptor = {
                            type: type,
                            ctorDescriptor: type === ViewType.Tree ? new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane) : new descriptors_1.SyncDescriptor(webviewViewPane_1.WebviewViewPane),
                            id: item.id,
                            name: item.name,
                            when: contextkey_1.ContextKeyExpr.deserialize(item.when),
                            containerIcon: icon || (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.icon),
                            containerTitle: item.contextualTitle || (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.title),
                            canToggleVisibility: true,
                            canMoveView: (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.id) !== remoteExplorer_1.VIEWLET_ID,
                            treeView: type === ViewType.Tree ? this.instantiationService.createInstance(treeView_1.CustomTreeView, item.id, item.name, extension.description.identifier.value) : undefined,
                            collapsed: this.showCollapsed(container) || initialVisibility === InitialVisibility.Collapsed,
                            order: order,
                            extensionId: extension.description.identifier,
                            originalContainerId: entry.key,
                            group: item.group,
                            remoteAuthority: item.remoteName || item.remoteAuthority,
                            hideByDefault: initialVisibility === InitialVisibility.Hidden,
                            workspace: (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.id) === remoteExplorer_1.VIEWLET_ID ? true : undefined
                        };
                        viewIds.add(viewDescriptor.id);
                        return viewDescriptor;
                    }));
                    allViewDescriptors.push({ viewContainer: container, views: viewDescriptors });
                });
            }
            this.viewsRegistry.registerViews2(allViewDescriptors);
        }
        getViewType(type) {
            if (type === ViewType.Webview) {
                return ViewType.Webview;
            }
            if (!type || type === ViewType.Tree) {
                return ViewType.Tree;
            }
            return undefined;
        }
        getDefaultViewContainer() {
            return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
        }
        removeViews(extensions) {
            const removedExtensions = extensions.reduce((result, e) => { result.add(extensions_1.ExtensionIdentifier.toKey(e.description.identifier)); return result; }, new Set());
            for (const viewContainer of this.viewContainersRegistry.all) {
                const removedViews = this.viewsRegistry.getViews(viewContainer).filter(v => v.extensionId && removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(v.extensionId)));
                if (removedViews.length) {
                    this.viewsRegistry.deregisterViews(removedViews, viewContainer);
                }
            }
        }
        convertInitialVisibility(value) {
            if (Object.values(InitialVisibility).includes(value)) {
                return value;
            }
            return undefined;
        }
        isValidViewDescriptors(viewDescriptors, collector) {
            if (!Array.isArray(viewDescriptors)) {
                collector.error((0, nls_1.localize)('requirearray', "views must be an array"));
                return false;
            }
            for (let descriptor of viewDescriptors) {
                if (typeof descriptor.id !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'id'));
                    return false;
                }
                if (typeof descriptor.name !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'name'));
                    return false;
                }
                if (descriptor.when && typeof descriptor.when !== 'string') {
                    collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                    return false;
                }
                if (descriptor.icon && typeof descriptor.icon !== 'string') {
                    collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'icon'));
                    return false;
                }
                if (descriptor.contextualTitle && typeof descriptor.contextualTitle !== 'string') {
                    collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'contextualTitle'));
                    return false;
                }
                if (descriptor.visibility && !this.convertInitialVisibility(descriptor.visibility)) {
                    collector.error((0, nls_1.localize)('optenum', "property `{0}` can be omitted or must be one of {1}", 'visibility', Object.values(InitialVisibility).join(', ')));
                    return false;
                }
            }
            return true;
        }
        getViewContainer(value) {
            switch (value) {
                case 'explorer': return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
                case 'debug': return this.viewContainersRegistry.get(debug_1.VIEWLET_ID);
                case 'scm': return this.viewContainersRegistry.get(scm_1.VIEWLET_ID);
                case 'remote': return this.viewContainersRegistry.get(remoteExplorer_1.VIEWLET_ID);
                default: return this.viewContainersRegistry.get(`workbench.view.extension.${value}`);
            }
        }
        showCollapsed(container) {
            switch (container.id) {
                case files_1.VIEWLET_ID:
                case scm_1.VIEWLET_ID:
                case debug_1.VIEWLET_ID:
                    return true;
            }
            return false;
        }
    };
    ViewsExtensionHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ViewsExtensionHandler);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ViewsExtensionHandler, 1 /* LifecyclePhase.Starting */);
});
//# sourceMappingURL=viewsExtensionPoint.js.map