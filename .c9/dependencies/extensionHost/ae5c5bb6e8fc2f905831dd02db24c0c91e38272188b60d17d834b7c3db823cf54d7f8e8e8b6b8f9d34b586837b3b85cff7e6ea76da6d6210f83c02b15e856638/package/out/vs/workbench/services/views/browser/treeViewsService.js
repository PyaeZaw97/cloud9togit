/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/views/common/treeViewsService"], function (require, exports, extensions_1, instantiation_1, treeViewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITreeViewsService = void 0;
    exports.ITreeViewsService = (0, instantiation_1.createDecorator)('treeViewsService');
    (0, extensions_1.registerSingleton)(exports.ITreeViewsService, treeViewsService_1.TreeviewsService);
});
//# sourceMappingURL=treeViewsService.js.map