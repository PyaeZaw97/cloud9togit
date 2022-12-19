/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/contextmenu/common/contextmenu", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, contextmenu_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.popup = void 0;
    let contextMenuIdPool = 0;
    function popup(items, options, onHide) {
        const processedItems = [];
        const contextMenuId = contextMenuIdPool++;
        const onClickChannel = `vscode:onContextMenu${contextMenuId}`;
        const onClickChannelHandler = (event, itemId, context) => {
            const item = processedItems[itemId];
            if (item.click) {
                item.click(context);
            }
        };
        globals_1.ipcRenderer.once(onClickChannel, onClickChannelHandler);
        globals_1.ipcRenderer.once(contextmenu_1.CONTEXT_MENU_CLOSE_CHANNEL, (event, closedContextMenuId) => {
            if (closedContextMenuId !== contextMenuId) {
                return;
            }
            globals_1.ipcRenderer.removeListener(onClickChannel, onClickChannelHandler);
            if (onHide) {
                onHide();
            }
        });
        globals_1.ipcRenderer.send(contextmenu_1.CONTEXT_MENU_CHANNEL, contextMenuId, items.map(item => createItem(item, processedItems)), onClickChannel, options);
    }
    exports.popup = popup;
    function createItem(item, processedItems) {
        const serializableItem = {
            id: processedItems.length,
            label: item.label,
            type: item.type,
            accelerator: item.accelerator,
            checked: item.checked,
            enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
            visible: typeof item.visible === 'boolean' ? item.visible : true
        };
        processedItems.push(item);
        // Submenu
        if (Array.isArray(item.submenu)) {
            serializableItem.submenu = item.submenu.map(submenuItem => createItem(submenuItem, processedItems));
        }
        return serializableItem;
    }
});
//# sourceMappingURL=contextmenu.js.map