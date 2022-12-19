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
define(["require", "exports", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/dom", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey"], function (require, exports, iconLabels_1, DOM, menuEntryActionViewItem_1, keybinding_1, notification_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionViewWithLabel = exports.CodiconActionViewItem = void 0;
    let CodiconActionViewItem = class CodiconActionViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        constructor(_action, keybindingService, notificationService, contextKeyService) {
            super(_action, undefined, keybindingService, notificationService, contextKeyService);
        }
        updateLabel() {
            var _a;
            if (this.options.label && this.label) {
                DOM.reset(this.label, ...(0, iconLabels_1.renderLabelWithIcons)((_a = this._commandAction.label) !== null && _a !== void 0 ? _a : ''));
            }
        }
    };
    CodiconActionViewItem = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, notification_1.INotificationService),
        __param(3, contextkey_1.IContextKeyService)
    ], CodiconActionViewItem);
    exports.CodiconActionViewItem = CodiconActionViewItem;
    let ActionViewWithLabel = class ActionViewWithLabel extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        constructor(_action, keybindingService, notificationService, contextKeyService) {
            super(_action, undefined, keybindingService, notificationService, contextKeyService);
        }
        render(container) {
            super.render(container);
            container.classList.add('notebook-action-view-item');
            this._actionLabel = document.createElement('a');
            container.appendChild(this._actionLabel);
            this.updateLabel();
        }
        updateLabel() {
            if (this._actionLabel) {
                this._actionLabel.classList.add('notebook-label');
                this._actionLabel.innerText = this._action.label;
                this._actionLabel.title = this._action.tooltip.length ? this._action.tooltip : this._action.label;
            }
        }
    };
    ActionViewWithLabel = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, notification_1.INotificationService),
        __param(3, contextkey_1.IContextKeyService)
    ], ActionViewWithLabel);
    exports.ActionViewWithLabel = ActionViewWithLabel;
});
//# sourceMappingURL=cellActionView.js.map