/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INotebookKernelService = exports.ProxyKernelState = exports.NotebookKernelType = void 0;
    var NotebookKernelType;
    (function (NotebookKernelType) {
        NotebookKernelType[NotebookKernelType["Resolved"] = 0] = "Resolved";
        NotebookKernelType[NotebookKernelType["Proxy"] = 1] = "Proxy";
    })(NotebookKernelType = exports.NotebookKernelType || (exports.NotebookKernelType = {}));
    var ProxyKernelState;
    (function (ProxyKernelState) {
        ProxyKernelState[ProxyKernelState["Disconnected"] = 1] = "Disconnected";
        ProxyKernelState[ProxyKernelState["Connected"] = 2] = "Connected";
        ProxyKernelState[ProxyKernelState["Initializing"] = 3] = "Initializing";
    })(ProxyKernelState = exports.ProxyKernelState || (exports.ProxyKernelState = {}));
    exports.INotebookKernelService = (0, instantiation_1.createDecorator)('INotebookKernelService');
});
//# sourceMappingURL=notebookKernelService.js.map