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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification"], function (require, exports, DOM, keyboardEvent_1, actionViewItems_1, dropdownActionViewItem_1, menuEntryActionViewItem_1, contextkey_1, keybinding_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropdownWithPrimaryActionViewItem = void 0;
    let DropdownWithPrimaryActionViewItem = class DropdownWithPrimaryActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(primaryAction, dropdownAction, dropdownMenuActions, className, _contextMenuProvider, _options, _keybindingService, _notificationService, _contextKeyService) {
            var _a;
            super(null, primaryAction);
            this._contextMenuProvider = _contextMenuProvider;
            this._options = _options;
            this._container = null;
            this._dropdownContainer = null;
            this._primaryAction = new menuEntryActionViewItem_1.MenuEntryActionViewItem(primaryAction, undefined, _keybindingService, _notificationService, _contextKeyService);
            this._dropdown = new dropdownActionViewItem_1.DropdownMenuActionViewItem(dropdownAction, dropdownMenuActions, this._contextMenuProvider, {
                menuAsChild: true,
                classNames: ['codicon', 'codicon-chevron-down'],
                keybindingProvider: (_a = this._options) === null || _a === void 0 ? void 0 : _a.getKeyBinding
            });
        }
        get onDidChangeDropdownVisibility() {
            return this._dropdown.onDidChangeVisibility;
        }
        setActionContext(newContext) {
            super.setActionContext(newContext);
            this._primaryAction.setActionContext(newContext);
            this._dropdown.setActionContext(newContext);
        }
        render(container) {
            this._container = container;
            super.render(this._container);
            this._container.classList.add('monaco-dropdown-with-primary');
            const primaryContainer = DOM.$('.action-container');
            this._primaryAction.render(DOM.append(this._container, primaryContainer));
            this._dropdownContainer = DOM.$('.dropdown-action-container');
            this._dropdown.render(DOM.append(this._container, this._dropdownContainer));
            this._register(DOM.addDisposableListener(primaryContainer, DOM.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(17 /* KeyCode.RightArrow */)) {
                    this._primaryAction.element.tabIndex = -1;
                    this._dropdown.focus();
                    event.stopPropagation();
                }
            }));
            this._register(DOM.addDisposableListener(this._dropdownContainer, DOM.EventType.KEY_DOWN, (e) => {
                var _a;
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(15 /* KeyCode.LeftArrow */)) {
                    this._primaryAction.element.tabIndex = 0;
                    this._dropdown.setFocusable(false);
                    (_a = this._primaryAction.element) === null || _a === void 0 ? void 0 : _a.focus();
                    event.stopPropagation();
                }
            }));
        }
        focus(fromRight) {
            if (fromRight) {
                this._dropdown.focus();
            }
            else {
                this._primaryAction.element.tabIndex = 0;
                this._primaryAction.element.focus();
            }
        }
        blur() {
            this._primaryAction.element.tabIndex = -1;
            this._dropdown.blur();
            this._container.blur();
        }
        setFocusable(focusable) {
            if (focusable) {
                this._primaryAction.element.tabIndex = 0;
            }
            else {
                this._primaryAction.element.tabIndex = -1;
                this._dropdown.setFocusable(false);
            }
        }
        update(dropdownAction, dropdownMenuActions, dropdownIcon) {
            this._dropdown.dispose();
            this._dropdown = new dropdownActionViewItem_1.DropdownMenuActionViewItem(dropdownAction, dropdownMenuActions, this._contextMenuProvider, {
                menuAsChild: true,
                classNames: ['codicon', dropdownIcon || 'codicon-chevron-down']
            });
            if (this._dropdownContainer) {
                this._dropdown.render(this._dropdownContainer);
            }
        }
        dispose() {
            this._primaryAction.dispose();
            this._dropdown.dispose();
            super.dispose();
        }
    };
    DropdownWithPrimaryActionViewItem = __decorate([
        __param(6, keybinding_1.IKeybindingService),
        __param(7, notification_1.INotificationService),
        __param(8, contextkey_1.IContextKeyService)
    ], DropdownWithPrimaryActionViewItem);
    exports.DropdownWithPrimaryActionViewItem = DropdownWithPrimaryActionViewItem;
});
//# sourceMappingURL=dropdownWithPrimaryActionViewItem.js.map