/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/parts/ipc/common/ipc"], function (require, exports, platform_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowIgnoreMenuShortcutsManager = void 0;
    class WindowIgnoreMenuShortcutsManager {
        constructor(configurationService, mainProcessService, nativeHostService) {
            this.nativeHostService = nativeHostService;
            this._isUsingNativeTitleBars = configurationService.getValue('window.titleBarStyle') === 'native';
            this.webviewMainService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('webview'));
        }
        didFocus() {
            this.setIgnoreMenuShortcuts(true);
        }
        didBlur() {
            this.setIgnoreMenuShortcuts(false);
        }
        get shouldToggleMenuShortcutsEnablement() {
            return platform_1.isMacintosh || this._isUsingNativeTitleBars;
        }
        setIgnoreMenuShortcuts(value) {
            if (this.shouldToggleMenuShortcutsEnablement) {
                this.webviewMainService.setIgnoreMenuShortcuts({ windowId: this.nativeHostService.windowId }, value);
            }
        }
    }
    exports.WindowIgnoreMenuShortcutsManager = WindowIgnoreMenuShortcutsManager;
});
//# sourceMappingURL=windowIgnoreMenuShortcutsManager.js.map