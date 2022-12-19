/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/webview/browser/webview", "./webviewService"], function (require, exports, extensions_1, webview_1, webviewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(webview_1.IWebviewService, webviewService_1.WebviewService, true);
});
//# sourceMappingURL=webview.web.contribution.js.map