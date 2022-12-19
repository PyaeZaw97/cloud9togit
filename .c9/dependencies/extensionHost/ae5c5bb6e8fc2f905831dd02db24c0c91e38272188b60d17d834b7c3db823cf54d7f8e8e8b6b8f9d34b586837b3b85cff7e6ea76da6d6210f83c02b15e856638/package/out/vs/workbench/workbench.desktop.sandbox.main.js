/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/workbench/workbench.sandbox.main", "vs/workbench/electron-sandbox/desktop.main"], function (require, exports, extensions_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO@bpasero sandbox: remove me when extension host is present
    class SimpleExtensionService extends extensions_1.NullExtensionService {
    }
    (0, extensions_2.registerSingleton)(extensions_1.IExtensionService, SimpleExtensionService);
});
//#endregion
//# sourceMappingURL=workbench.desktop.sandbox.main.js.map