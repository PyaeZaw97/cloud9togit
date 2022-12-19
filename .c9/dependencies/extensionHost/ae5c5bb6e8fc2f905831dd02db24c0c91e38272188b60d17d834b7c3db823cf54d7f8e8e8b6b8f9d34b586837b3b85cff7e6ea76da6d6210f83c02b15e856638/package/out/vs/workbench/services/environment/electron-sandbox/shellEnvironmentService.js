/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/instantiation/common/extensions"], function (require, exports, instantiation_1, globals_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShellEnvironmentService = exports.IShellEnvironmentService = void 0;
    exports.IShellEnvironmentService = (0, instantiation_1.createDecorator)('shellEnvironmentService');
    class ShellEnvironmentService {
        getShellEnv() {
            return globals_1.process.shellEnv();
        }
    }
    exports.ShellEnvironmentService = ShellEnvironmentService;
    (0, extensions_1.registerSingleton)(exports.IShellEnvironmentService, ShellEnvironmentService);
});
//# sourceMappingURL=shellEnvironmentService.js.map