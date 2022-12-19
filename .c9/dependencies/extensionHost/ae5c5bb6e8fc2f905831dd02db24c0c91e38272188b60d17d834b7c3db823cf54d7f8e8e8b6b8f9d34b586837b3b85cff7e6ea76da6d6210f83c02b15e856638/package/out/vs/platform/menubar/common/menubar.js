/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isMenubarMenuItemAction = exports.isMenubarMenuItemRecentAction = exports.isMenubarMenuItemSeparator = exports.isMenubarMenuItemSubmenu = void 0;
    function isMenubarMenuItemSubmenu(menuItem) {
        return menuItem.submenu !== undefined;
    }
    exports.isMenubarMenuItemSubmenu = isMenubarMenuItemSubmenu;
    function isMenubarMenuItemSeparator(menuItem) {
        return menuItem.id === 'vscode.menubar.separator';
    }
    exports.isMenubarMenuItemSeparator = isMenubarMenuItemSeparator;
    function isMenubarMenuItemRecentAction(menuItem) {
        return menuItem.uri !== undefined;
    }
    exports.isMenubarMenuItemRecentAction = isMenubarMenuItemRecentAction;
    function isMenubarMenuItemAction(menuItem) {
        return !isMenubarMenuItemSubmenu(menuItem) && !isMenubarMenuItemSeparator(menuItem) && !isMenubarMenuItemRecentAction(menuItem);
    }
    exports.isMenubarMenuItemAction = isMenubarMenuItemAction;
});
//# sourceMappingURL=menubar.js.map