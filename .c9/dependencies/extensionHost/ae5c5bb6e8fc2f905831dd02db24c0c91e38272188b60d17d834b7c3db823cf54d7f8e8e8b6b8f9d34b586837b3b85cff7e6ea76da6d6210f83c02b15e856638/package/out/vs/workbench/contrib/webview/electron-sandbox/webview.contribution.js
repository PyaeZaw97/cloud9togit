/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/electron-sandbox/webviewCommands", "vs/workbench/contrib/webview/electron-sandbox/webviewService"], function (require, exports, actions_1, extensions_1, webview_1, webviewCommands, webviewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(webview_1.IWebviewService, webviewService_1.ElectronWebviewService, true);
    (0, actions_1.registerAction2)(webviewCommands.OpenWebviewDeveloperToolsAction);
});
//# sourceMappingURL=webview.contribution.js.map