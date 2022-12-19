/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/electron-sandbox/parts/titlebar/titlebarPart", "vs/workbench/services/title/common/titleService"], function (require, exports, extensions_1, titlebarPart_1, titleService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(titleService_1.ITitleService, titlebarPart_1.TitlebarPart);
});
//# sourceMappingURL=titleService.js.map