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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, dom, actionbar_1, lifecycle_1, suggest_1, nls_1, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestWidgetStatus = void 0;
    class StatusBarViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        updateLabel() {
            const kb = this._keybindingService.lookupKeybinding(this._action.id, this._contextKeyService);
            if (!kb) {
                return super.updateLabel();
            }
            if (this.label) {
                this.label.textContent = (0, nls_1.localize)('ddd', '{0} ({1})', this._action.label, StatusBarViewItem.symbolPrintEnter(kb));
            }
        }
        static symbolPrintEnter(kb) {
            var _a;
            return (_a = kb.getLabel()) === null || _a === void 0 ? void 0 : _a.replace(/\benter\b/gi, '\u23CE');
        }
    }
    let SuggestWidgetStatus = class SuggestWidgetStatus {
        constructor(container, instantiationService, _menuService, _contextKeyService) {
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._menuDisposables = new lifecycle_1.DisposableStore();
            this.element = dom.append(container, dom.$('.suggest-status-bar'));
            const actionViewItemProvider = (action => {
                return action instanceof actions_1.MenuItemAction ? instantiationService.createInstance(StatusBarViewItem, action, undefined) : undefined;
            });
            this._leftActions = new actionbar_1.ActionBar(this.element, { actionViewItemProvider });
            this._rightActions = new actionbar_1.ActionBar(this.element, { actionViewItemProvider });
            this._leftActions.domNode.classList.add('left');
            this._rightActions.domNode.classList.add('right');
        }
        dispose() {
            this._menuDisposables.dispose();
            this.element.remove();
        }
        show() {
            const menu = this._menuService.createMenu(suggest_1.suggestWidgetStatusbarMenu, this._contextKeyService);
            const renderMenu = () => {
                const left = [];
                const right = [];
                for (let [group, actions] of menu.getActions()) {
                    if (group === 'left') {
                        left.push(...actions);
                    }
                    else {
                        right.push(...actions);
                    }
                }
                this._leftActions.clear();
                this._leftActions.push(left);
                this._rightActions.clear();
                this._rightActions.push(right);
            };
            this._menuDisposables.add(menu.onDidChange(() => renderMenu()));
            this._menuDisposables.add(menu);
        }
        hide() {
            this._menuDisposables.clear();
        }
    };
    SuggestWidgetStatus = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService)
    ], SuggestWidgetStatus);
    exports.SuggestWidgetStatus = SuggestWidgetStatus;
});
//# sourceMappingURL=suggestWidgetStatus.js.map