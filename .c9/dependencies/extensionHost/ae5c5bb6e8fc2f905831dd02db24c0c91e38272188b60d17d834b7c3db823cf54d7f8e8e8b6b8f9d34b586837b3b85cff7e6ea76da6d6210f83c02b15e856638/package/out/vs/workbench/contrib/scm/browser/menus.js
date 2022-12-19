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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/contrib/scm/common/scm", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/css!./media/scm"], function (require, exports, event_1, lifecycle_1, contextkey_1, actions_1, menuEntryActionViewItem_1, scm_1, arrays_1, instantiation_1, serviceCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMMenus = exports.SCMRepositoryMenus = exports.SCMTitleMenu = void 0;
    function actionEquals(a, b) {
        return a.id === b.id;
    }
    let SCMTitleMenu = class SCMTitleMenu {
        constructor(menuService, contextKeyService) {
            this._actions = [];
            this._secondaryActions = [];
            this._onDidChangeTitle = new event_1.Emitter();
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            this.listener = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this.menu = menuService.createMenu(actions_1.MenuId.SCMTitle, contextKeyService);
            this.disposables.add(this.menu);
            this.menu.onDidChange(this.updateTitleActions, this, this.disposables);
            this.updateTitleActions();
        }
        get actions() { return this._actions; }
        get secondaryActions() { return this._secondaryActions; }
        updateTitleActions() {
            const primary = [];
            const secondary = [];
            const disposable = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { shouldForwardArgs: true }, { primary, secondary });
            if ((0, arrays_1.equals)(primary, this._actions, actionEquals) && (0, arrays_1.equals)(secondary, this._secondaryActions, actionEquals)) {
                disposable.dispose();
                return;
            }
            this.listener.dispose();
            this.listener = disposable;
            this._actions = primary;
            this._secondaryActions = secondary;
            this._onDidChangeTitle.fire();
        }
        dispose() {
            this.menu.dispose();
            this.listener.dispose();
        }
    };
    SCMTitleMenu = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, contextkey_1.IContextKeyService)
    ], SCMTitleMenu);
    exports.SCMTitleMenu = SCMTitleMenu;
    class SCMMenusItem {
        constructor(contextKeyService, menuService) {
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        get resourceGroupMenu() {
            if (!this._resourceGroupMenu) {
                this._resourceGroupMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceGroupContext, this.contextKeyService);
            }
            return this._resourceGroupMenu;
        }
        get resourceFolderMenu() {
            if (!this._resourceFolderMenu) {
                this._resourceFolderMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceFolderContext, this.contextKeyService);
            }
            return this._resourceFolderMenu;
        }
        getResourceMenu(resource) {
            if (typeof resource.contextValue === 'undefined') {
                if (!this.genericResourceMenu) {
                    this.genericResourceMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceContext, this.contextKeyService);
                }
                return this.genericResourceMenu;
            }
            if (!this.contextualResourceMenus) {
                this.contextualResourceMenus = new Map();
            }
            let item = this.contextualResourceMenus.get(resource.contextValue);
            if (!item) {
                const contextKeyService = this.contextKeyService.createOverlay([['scmResourceState', resource.contextValue]]);
                const menu = this.menuService.createMenu(actions_1.MenuId.SCMResourceContext, contextKeyService);
                item = {
                    menu, dispose() {
                        menu.dispose();
                    }
                };
                this.contextualResourceMenus.set(resource.contextValue, item);
            }
            return item.menu;
        }
        dispose() {
            var _a, _b, _c;
            (_a = this._resourceGroupMenu) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._resourceFolderMenu) === null || _b === void 0 ? void 0 : _b.dispose();
            (_c = this.genericResourceMenu) === null || _c === void 0 ? void 0 : _c.dispose();
            if (this.contextualResourceMenus) {
                (0, lifecycle_1.dispose)(this.contextualResourceMenus.values());
                this.contextualResourceMenus.clear();
                this.contextualResourceMenus = undefined;
            }
        }
    }
    let SCMRepositoryMenus = class SCMRepositoryMenus {
        constructor(provider, contextKeyService, instantiationService, menuService) {
            var _a;
            this.menuService = menuService;
            this.resourceGroups = [];
            this.resourceGroupMenusItems = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
            this.contextKeyService = contextKeyService.createOverlay([
                ['scmProvider', provider.contextValue],
                ['scmProviderRootUri', (_a = provider.rootUri) === null || _a === void 0 ? void 0 : _a.toString()],
                ['scmProviderHasRootUri', !!provider.rootUri],
            ]);
            const serviceCollection = new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]);
            instantiationService = instantiationService.createChild(serviceCollection);
            this.titleMenu = instantiationService.createInstance(SCMTitleMenu);
            provider.groups.onDidSplice(this.onDidSpliceGroups, this, this.disposables);
            this.onDidSpliceGroups({ start: 0, deleteCount: 0, toInsert: provider.groups.elements });
        }
        get repositoryMenu() {
            if (!this._repositoryMenu) {
                this._repositoryMenu = this.menuService.createMenu(actions_1.MenuId.SCMSourceControl, this.contextKeyService);
                this.disposables.add(this._repositoryMenu);
            }
            return this._repositoryMenu;
        }
        getResourceGroupMenu(group) {
            return this.getOrCreateResourceGroupMenusItem(group).resourceGroupMenu;
        }
        getResourceMenu(resource) {
            return this.getOrCreateResourceGroupMenusItem(resource.resourceGroup).getResourceMenu(resource);
        }
        getResourceFolderMenu(group) {
            return this.getOrCreateResourceGroupMenusItem(group).resourceFolderMenu;
        }
        getOrCreateResourceGroupMenusItem(group) {
            let result = this.resourceGroupMenusItems.get(group);
            if (!result) {
                const contextKeyService = this.contextKeyService.createOverlay([
                    ['scmResourceGroup', group.id],
                ]);
                result = new SCMMenusItem(contextKeyService, this.menuService);
                this.resourceGroupMenusItems.set(group, result);
            }
            return result;
        }
        onDidSpliceGroups({ start, deleteCount, toInsert }) {
            const deleted = this.resourceGroups.splice(start, deleteCount, ...toInsert);
            for (const group of deleted) {
                const item = this.resourceGroupMenusItems.get(group);
                item === null || item === void 0 ? void 0 : item.dispose();
                this.resourceGroupMenusItems.delete(group);
            }
        }
        dispose() {
            this.disposables.dispose();
            this.resourceGroupMenusItems.forEach(item => item.dispose());
        }
    };
    SCMRepositoryMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, actions_1.IMenuService)
    ], SCMRepositoryMenus);
    exports.SCMRepositoryMenus = SCMRepositoryMenus;
    let SCMMenus = class SCMMenus {
        constructor(scmService, instantiationService) {
            this.instantiationService = instantiationService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.menus = new Map();
            this.titleMenu = instantiationService.createInstance(SCMTitleMenu);
            scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
        }
        onDidRemoveRepository(repository) {
            const menus = this.menus.get(repository.provider);
            menus === null || menus === void 0 ? void 0 : menus.dispose();
            this.menus.delete(repository.provider);
        }
        getRepositoryMenus(provider) {
            let result = this.menus.get(provider);
            if (!result) {
                const menus = this.instantiationService.createInstance(SCMRepositoryMenus, provider);
                const dispose = () => {
                    menus.dispose();
                    this.menus.delete(provider);
                };
                result = { menus, dispose };
                this.menus.set(provider, result);
            }
            return result.menus;
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    SCMMenus = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, instantiation_1.IInstantiationService)
    ], SCMMenus);
    exports.SCMMenus = SCMMenus;
});
//# sourceMappingURL=menus.js.map