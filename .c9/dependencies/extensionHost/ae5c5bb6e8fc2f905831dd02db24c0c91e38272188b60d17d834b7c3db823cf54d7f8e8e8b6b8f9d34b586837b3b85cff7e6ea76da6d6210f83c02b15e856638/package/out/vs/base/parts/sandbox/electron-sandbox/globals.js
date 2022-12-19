/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.context = exports.process = exports.webFrame = exports.ipcMessagePort = exports.ipcRenderer = void 0;
    exports.ipcRenderer = platform_1.globals.vscode.ipcRenderer;
    exports.ipcMessagePort = platform_1.globals.vscode.ipcMessagePort;
    exports.webFrame = platform_1.globals.vscode.webFrame;
    exports.process = platform_1.globals.vscode.process;
    exports.context = platform_1.globals.vscode.context;
});
//# sourceMappingURL=globals.js.map