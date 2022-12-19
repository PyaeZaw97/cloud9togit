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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/arrays", "vs/platform/notification/common/notification", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/shared/dataTransfer"], function (require, exports, lifecycle_1, extHost_protocol_1, views_1, extHostCustomers_1, arrays_1, notification_1, types_1, platform_1, extensions_1, log_1, dataTransfer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTreeViews = void 0;
    let MainThreadTreeViews = class MainThreadTreeViews extends lifecycle_1.Disposable {
        constructor(extHostContext, viewsService, notificationService, extensionService, logService) {
            super();
            this.viewsService = viewsService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.logService = logService;
            this._dataProviders = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTreeViews);
        }
        async $registerTreeViewDataProvider(treeViewId, options) {
            this.logService.trace('MainThreadTreeViews#$registerTreeViewDataProvider', treeViewId, options);
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                const dataProvider = new TreeViewDataProvider(treeViewId, this._proxy, this.notificationService);
                this._dataProviders.set(treeViewId, dataProvider);
                const dndController = (options.hasHandleDrag || options.hasHandleDrop)
                    ? new TreeViewDragAndDropController(treeViewId, options.dropMimeTypes, options.dragMimeTypes, options.hasHandleDrag, this._proxy) : undefined;
                const viewer = this.getTreeView(treeViewId);
                if (viewer) {
                    // Order is important here. The internal tree isn't created until the dataProvider is set.
                    // Set all other properties first!
                    viewer.showCollapseAllAction = !!options.showCollapseAll;
                    viewer.canSelectMany = !!options.canSelectMany;
                    viewer.dragAndDropController = dndController;
                    viewer.dataProvider = dataProvider;
                    this.registerListeners(treeViewId, viewer);
                    this._proxy.$setVisible(treeViewId, viewer.visible);
                }
                else {
                    this.notificationService.error('No view is registered with id: ' + treeViewId);
                }
            });
        }
        $reveal(treeViewId, itemInfo, options) {
            this.logService.trace('MainThreadTreeViews#$reveal', treeViewId, itemInfo === null || itemInfo === void 0 ? void 0 : itemInfo.item, itemInfo === null || itemInfo === void 0 ? void 0 : itemInfo.parentChain, options);
            return this.viewsService.openView(treeViewId, options.focus)
                .then(() => {
                const viewer = this.getTreeView(treeViewId);
                if (viewer && itemInfo) {
                    return this.reveal(viewer, this._dataProviders.get(treeViewId), itemInfo.item, itemInfo.parentChain, options);
                }
                return undefined;
            });
        }
        $refresh(treeViewId, itemsToRefreshByHandle) {
            this.logService.trace('MainThreadTreeViews#$refresh', treeViewId, itemsToRefreshByHandle);
            const viewer = this.getTreeView(treeViewId);
            const dataProvider = this._dataProviders.get(treeViewId);
            if (viewer && dataProvider) {
                const itemsToRefresh = dataProvider.getItemsToRefresh(itemsToRefreshByHandle);
                return viewer.refresh(itemsToRefresh.length ? itemsToRefresh : undefined);
            }
            return Promise.resolve();
        }
        $setMessage(treeViewId, message) {
            this.logService.trace('MainThreadTreeViews#$setMessage', treeViewId, message);
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.message = message;
            }
        }
        $setTitle(treeViewId, title, description) {
            this.logService.trace('MainThreadTreeViews#$setTitle', treeViewId, title, description);
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.title = title;
                viewer.description = description;
            }
        }
        $setBadge(treeViewId, badge) {
            this.logService.trace('MainThreadTreeViews#$setBadge', treeViewId, badge === null || badge === void 0 ? void 0 : badge.value, badge === null || badge === void 0 ? void 0 : badge.tooltip);
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.badge = badge;
            }
        }
        async reveal(treeView, dataProvider, itemIn, parentChain, options) {
            options = options ? options : { select: false, focus: false };
            const select = (0, types_1.isUndefinedOrNull)(options.select) ? false : options.select;
            const focus = (0, types_1.isUndefinedOrNull)(options.focus) ? false : options.focus;
            let expand = Math.min((0, types_1.isNumber)(options.expand) ? options.expand : options.expand === true ? 1 : 0, 3);
            if (dataProvider.isEmpty()) {
                // Refresh if empty
                await treeView.refresh();
            }
            for (const parent of parentChain) {
                const parentItem = dataProvider.getItem(parent.handle);
                if (parentItem) {
                    await treeView.expand(parentItem);
                }
            }
            const item = dataProvider.getItem(itemIn.handle);
            if (item) {
                await treeView.reveal(item);
                if (select) {
                    treeView.setSelection([item]);
                }
                if (focus) {
                    treeView.setFocus(item);
                }
                let itemsToExpand = [item];
                for (; itemsToExpand.length > 0 && expand > 0; expand--) {
                    await treeView.expand(itemsToExpand);
                    itemsToExpand = itemsToExpand.reduce((result, itemValue) => {
                        const item = dataProvider.getItem(itemValue.handle);
                        if (item && item.children && item.children.length) {
                            result.push(...item.children);
                        }
                        return result;
                    }, []);
                }
            }
        }
        registerListeners(treeViewId, treeView) {
            this._register(treeView.onDidExpandItem(item => this._proxy.$setExpanded(treeViewId, item.handle, true)));
            this._register(treeView.onDidCollapseItem(item => this._proxy.$setExpanded(treeViewId, item.handle, false)));
            this._register(treeView.onDidChangeSelection(items => this._proxy.$setSelection(treeViewId, items.map(({ handle }) => handle))));
            this._register(treeView.onDidChangeVisibility(isVisible => this._proxy.$setVisible(treeViewId, isVisible)));
        }
        getTreeView(treeViewId) {
            const viewDescriptor = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(treeViewId);
            return viewDescriptor ? viewDescriptor.treeView : null;
        }
        dispose() {
            this._dataProviders.forEach((dataProvider, treeViewId) => {
                const treeView = this.getTreeView(treeViewId);
                if (treeView) {
                    treeView.dataProvider = undefined;
                }
            });
            this._dataProviders.clear();
            super.dispose();
        }
    };
    MainThreadTreeViews = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTreeViews),
        __param(1, views_1.IViewsService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_1.IExtensionService),
        __param(4, log_1.ILogService)
    ], MainThreadTreeViews);
    exports.MainThreadTreeViews = MainThreadTreeViews;
    class TreeViewDragAndDropController {
        constructor(treeViewId, dropMimeTypes, dragMimeTypes, hasWillDrop, _proxy) {
            this.treeViewId = treeViewId;
            this.dropMimeTypes = dropMimeTypes;
            this.dragMimeTypes = dragMimeTypes;
            this.hasWillDrop = hasWillDrop;
            this._proxy = _proxy;
        }
        async handleDrop(dataTransfer, targetTreeItem, token, operationUuid, sourceTreeId, sourceTreeItemHandles) {
            return this._proxy.$handleDrop(this.treeViewId, await dataTransfer_1.DataTransferConverter.toDataTransferDTO(dataTransfer), targetTreeItem === null || targetTreeItem === void 0 ? void 0 : targetTreeItem.handle, token, operationUuid, sourceTreeId, sourceTreeItemHandles);
        }
        async handleDrag(sourceTreeItemHandles, operationUuid, token) {
            if (!this.hasWillDrop) {
                return;
            }
            const additionalTransferItems = await this._proxy.$handleDrag(this.treeViewId, sourceTreeItemHandles, operationUuid, token);
            if (!additionalTransferItems) {
                return;
            }
            return dataTransfer_1.DataTransferConverter.toDataTransfer(additionalTransferItems);
        }
    }
    class TreeViewDataProvider {
        constructor(treeViewId, _proxy, notificationService) {
            this.treeViewId = treeViewId;
            this._proxy = _proxy;
            this.notificationService = notificationService;
            this.itemsMap = new Map();
            this.hasResolve = this._proxy.$hasResolve(this.treeViewId);
        }
        getChildren(treeItem) {
            return this._proxy.$getChildren(this.treeViewId, treeItem ? treeItem.handle : undefined)
                .then(children => this.postGetChildren(children), err => {
                this.notificationService.error(err);
                return [];
            });
        }
        getItemsToRefresh(itemsToRefreshByHandle) {
            const itemsToRefresh = [];
            if (itemsToRefreshByHandle) {
                for (const treeItemHandle of Object.keys(itemsToRefreshByHandle)) {
                    const currentTreeItem = this.getItem(treeItemHandle);
                    if (currentTreeItem) { // Refresh only if the item exists
                        const treeItem = itemsToRefreshByHandle[treeItemHandle];
                        // Update the current item with refreshed item
                        this.updateTreeItem(currentTreeItem, treeItem);
                        if (treeItemHandle === treeItem.handle) {
                            itemsToRefresh.push(currentTreeItem);
                        }
                        else {
                            // Update maps when handle is changed and refresh parent
                            this.itemsMap.delete(treeItemHandle);
                            this.itemsMap.set(currentTreeItem.handle, currentTreeItem);
                            const parent = treeItem.parentHandle ? this.itemsMap.get(treeItem.parentHandle) : null;
                            if (parent) {
                                itemsToRefresh.push(parent);
                            }
                        }
                    }
                }
            }
            return itemsToRefresh;
        }
        getItem(treeItemHandle) {
            return this.itemsMap.get(treeItemHandle);
        }
        isEmpty() {
            return this.itemsMap.size === 0;
        }
        async postGetChildren(elements) {
            if (elements === undefined) {
                return undefined;
            }
            const result = [];
            const hasResolve = await this.hasResolve;
            if (elements) {
                for (const element of elements) {
                    const resolvable = new views_1.ResolvableTreeItem(element, hasResolve ? (token) => {
                        return this._proxy.$resolve(this.treeViewId, element.handle, token);
                    } : undefined);
                    this.itemsMap.set(element.handle, resolvable);
                    result.push(resolvable);
                }
            }
            return result;
        }
        updateTreeItem(current, treeItem) {
            treeItem.children = treeItem.children ? treeItem.children : undefined;
            if (current) {
                const properties = (0, arrays_1.distinct)([...Object.keys(current instanceof views_1.ResolvableTreeItem ? current.asTreeItem() : current),
                    ...Object.keys(treeItem)]);
                for (const property of properties) {
                    current[property] = treeItem[property];
                }
                if (current instanceof views_1.ResolvableTreeItem) {
                    current.resetResolve();
                }
            }
        }
    }
});
//# sourceMappingURL=mainThreadTreeViews.js.map