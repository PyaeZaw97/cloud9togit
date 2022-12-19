/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/native/electron-sandbox/native", "vs/workbench/common/actions"], function (require, exports, nls, actions_1, native_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenWebviewDeveloperToolsAction = void 0;
    class OpenWebviewDeveloperToolsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.webview.openDeveloperTools',
                title: { value: nls.localize('openToolsLabel', "Open Webview Developer Tools"), original: 'Open Webview Developer Tools' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const iframeWebviewElements = document.querySelectorAll('iframe.webview.ready');
            if (iframeWebviewElements.length) {
                console.info(nls.localize('iframeWebviewAlert', "Using standard dev tools to debug iframe based webview"));
                nativeHostService.openDevTools();
            }
        }
    }
    exports.OpenWebviewDeveloperToolsAction = OpenWebviewDeveloperToolsAction;
});
//# sourceMappingURL=webviewCommands.js.map