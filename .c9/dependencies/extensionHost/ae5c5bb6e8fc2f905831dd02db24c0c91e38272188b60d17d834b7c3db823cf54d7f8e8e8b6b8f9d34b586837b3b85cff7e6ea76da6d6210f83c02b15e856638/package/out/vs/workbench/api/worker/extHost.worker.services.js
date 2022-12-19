/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/worker/extHostExtensionService"], function (require, exports, extensions_1, extHostExtensionService_1, extHostStoragePaths_1, extHostExtensionService_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // #########################################################################
    // ###                                                                   ###
    // ### !!! PLEASE ADD COMMON IMPORTS INTO extHost.common.services.ts !!! ###
    // ###                                                                   ###
    // #########################################################################
    (0, extensions_1.registerSingleton)(extHostExtensionService_1.IExtHostExtensionService, extHostExtensionService_2.ExtHostExtensionService);
    (0, extensions_1.registerSingleton)(extHostStoragePaths_1.IExtensionStoragePaths, extHostStoragePaths_1.ExtensionStoragePaths);
});
//# sourceMappingURL=extHost.worker.services.js.map