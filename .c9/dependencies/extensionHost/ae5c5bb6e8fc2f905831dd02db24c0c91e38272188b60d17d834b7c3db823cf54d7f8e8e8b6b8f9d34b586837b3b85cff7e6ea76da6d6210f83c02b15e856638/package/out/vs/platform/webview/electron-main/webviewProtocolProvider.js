/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, electron_1, lifecycle_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewProtocolProvider = void 0;
    class WebviewProtocolProvider extends lifecycle_1.Disposable {
        constructor() {
            super();
            // Register the protocol for loading webview html
            const webviewHandler = this.handleWebviewRequest.bind(this);
            electron_1.protocol.registerFileProtocol(network_1.Schemas.vscodeWebview, webviewHandler);
        }
        handleWebviewRequest(request, callback) {
            try {
                const uri = uri_1.URI.parse(request.url);
                const entry = WebviewProtocolProvider.validWebviewFilePaths.get(uri.path);
                if (typeof entry === 'string') {
                    const relativeResourcePath = `vs/workbench/contrib/webview/browser/pre/${entry}`;
                    const url = network_1.FileAccess.asFileUri(relativeResourcePath, require);
                    return callback(decodeURIComponent(url.fsPath));
                }
                else {
                    return callback({ error: -10 /* ACCESS_DENIED - https://cs.chromium.org/chromium/src/net/base/net_error_list.h?l=32 */ });
                }
            }
            catch (_a) {
                // noop
            }
            return callback({ error: -2 /* FAILED - https://cs.chromium.org/chromium/src/net/base/net_error_list.h?l=32 */ });
        }
    }
    exports.WebviewProtocolProvider = WebviewProtocolProvider;
    WebviewProtocolProvider.validWebviewFilePaths = new Map([
        ['/index.html', 'index.html'],
        ['/fake.html', 'fake.html'],
        ['/main.js', 'main.js'],
        ['/service-worker.js', 'service-worker.js'],
    ]);
});
//# sourceMappingURL=webviewProtocolProvider.js.map