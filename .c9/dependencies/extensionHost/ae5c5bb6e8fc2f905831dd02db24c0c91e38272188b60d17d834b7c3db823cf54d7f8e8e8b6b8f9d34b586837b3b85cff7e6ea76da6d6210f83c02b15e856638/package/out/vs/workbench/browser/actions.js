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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, lifecycle_1, event_1, actions_1, contextkey_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositeMenuActions = void 0;
    class MenuActions extends lifecycle_1.Disposable {
        constructor(menuId, options, menuService, contextKeyService) {
            super();
            this.options = options;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._primaryActions = [];
            this._secondaryActions = [];
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.menu = this._register(menuService.createMenu(menuId, contextKeyService));
            this._register(this.menu.onDidChange(() => this.updateActions()));
            this.updateActions();
        }
        get primaryActions() { return this._primaryActions; }
        get secondaryActions() { return this._secondaryActions; }
        updateActions() {
            this.disposables.clear();
            this._primaryActions = [];
            this._secondaryActions = [];
            this.disposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, this.options, { primary: this._primaryActions, secondary: this._secondaryActions }));
            this.disposables.add(this.updateSubmenus([...this._primaryActions, ...this._secondaryActions], {}));
            this._onDidChange.fire();
        }
        updateSubmenus(actions, submenus) {
            const disposables = new lifecycle_1.DisposableStore();
            for (const action of actions) {
                if (action instanceof actions_1.SubmenuItemAction && !submenus[action.item.submenu.id]) {
                    const menu = submenus[action.item.submenu.id] = disposables.add(this.menuService.createMenu(action.item.submenu, this.contextKeyService));
                    disposables.add(menu.onDidChange(() => this.updateActions()));
                    disposables.add(this.updateSubmenus(action.actions, submenus));
                }
            }
            return disposables;
        }
    }
    let CompositeMenuActions = class CompositeMenuActions extends lifecycle_1.Disposable {
        constructor(menuId, contextMenuId, options, contextKeyService, menuService) {
            super();
            this.contextMenuId = contextMenuId;
            this.options = options;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.contextMenuActionsDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.menuActions = this._register(new MenuActions(menuId, this.options, menuService, contextKeyService));
            this._register(this.menuActions.onDidChange(() => this._onDidChange.fire()));
        }
        getPrimaryActions() {
            return this.menuActions.primaryActions;
        }
        getSecondaryActions() {
            return this.menuActions.secondaryActions;
        }
        getContextMenuActions() {
            const actions = [];
            if (this.contextMenuId) {
                const menu = this.menuService.createMenu(this.contextMenuId, this.contextKeyService);
                this.contextMenuActionsDisposable.value = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, this.options, { primary: [], secondary: actions });
                menu.dispose();
            }
            return actions;
        }
    };
    CompositeMenuActions = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService)
    ], CompositeMenuActions);
    exports.CompositeMenuActions = CompositeMenuActions;
});
//# sourceMappingURL=actions.js.map