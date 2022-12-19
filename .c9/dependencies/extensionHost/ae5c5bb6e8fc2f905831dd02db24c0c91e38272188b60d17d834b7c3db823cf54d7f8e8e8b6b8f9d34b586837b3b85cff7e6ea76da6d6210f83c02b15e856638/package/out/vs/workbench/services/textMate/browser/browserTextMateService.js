/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/textMate/browser/textMate", "vs/platform/instantiation/common/extensions", "vs/workbench/services/textMate/browser/abstractTextMateService", "vs/base/common/network"], function (require, exports, textMate_1, extensions_1, abstractTextMateService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateService = void 0;
    class TextMateService extends abstractTextMateService_1.AbstractTextMateService {
        async _loadVSCodeOnigurumWASM() {
            const response = await fetch(network_1.FileAccess.asBrowserUri('vscode-oniguruma/../onig.wasm', require).toString(true));
            // Using the response directly only works if the server sets the MIME type 'application/wasm'.
            // Otherwise, a TypeError is thrown when using the streaming compiler.
            // We therefore use the non-streaming compiler :(.
            return await response.arrayBuffer();
        }
    }
    exports.TextMateService = TextMateService;
    (0, extensions_1.registerSingleton)(textMate_1.ITextMateService, TextMateService);
});
//# sourceMappingURL=browserTextMateService.js.map