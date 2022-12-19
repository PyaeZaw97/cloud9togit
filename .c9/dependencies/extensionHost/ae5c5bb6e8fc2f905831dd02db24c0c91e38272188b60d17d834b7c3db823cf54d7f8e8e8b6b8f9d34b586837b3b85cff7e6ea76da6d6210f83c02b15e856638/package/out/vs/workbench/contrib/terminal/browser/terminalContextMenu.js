/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, mouseEvent_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openContextMenu = void 0;
    function openContextMenu(event, parent, menu, contextMenuService, extraActions) {
        const standardEvent = new mouseEvent_1.StandardMouseEvent(event);
        const anchor = { x: standardEvent.posx, y: standardEvent.posy };
        const actions = [];
        const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, actions);
        if (extraActions) {
            actions.push(...extraActions);
        }
        contextMenuService.showContextMenu({
            getAnchor: () => anchor,
            getActions: () => actions,
            getActionsContext: () => parent,
            onHide: () => actionsDisposable.dispose()
        });
    }
    exports.openContextMenu = openContextMenu;
});
//# sourceMappingURL=terminalContextMenu.js.map