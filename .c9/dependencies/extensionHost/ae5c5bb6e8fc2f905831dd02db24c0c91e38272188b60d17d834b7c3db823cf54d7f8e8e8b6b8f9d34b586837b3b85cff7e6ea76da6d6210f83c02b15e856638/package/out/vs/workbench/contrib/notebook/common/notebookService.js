/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleNotebookProviderInfo = exports.ComplexNotebookProviderInfo = exports.INotebookService = void 0;
    exports.INotebookService = (0, instantiation_1.createDecorator)('notebookService');
    class ComplexNotebookProviderInfo {
        constructor(viewType, controller, extensionData) {
            this.viewType = viewType;
            this.controller = controller;
            this.extensionData = extensionData;
        }
    }
    exports.ComplexNotebookProviderInfo = ComplexNotebookProviderInfo;
    class SimpleNotebookProviderInfo {
        constructor(viewType, serializer, extensionData) {
            this.viewType = viewType;
            this.serializer = serializer;
            this.extensionData = extensionData;
        }
    }
    exports.SimpleNotebookProviderInfo = SimpleNotebookProviderInfo;
});
//# sourceMappingURL=notebookService.js.map