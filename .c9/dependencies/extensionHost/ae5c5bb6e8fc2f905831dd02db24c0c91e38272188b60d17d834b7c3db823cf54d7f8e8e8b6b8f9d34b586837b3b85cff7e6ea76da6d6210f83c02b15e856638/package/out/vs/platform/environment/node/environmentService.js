/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/platform/environment/common/environmentService", "vs/platform/environment/node/userDataPath"], function (require, exports, os_1, environmentService_1, userDataPath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeEnvironmentService = void 0;
    class NativeEnvironmentService extends environmentService_1.AbstractNativeEnvironmentService {
        constructor(args, productService) {
            super(args, {
                homeDir: (0, os_1.homedir)(),
                tmpDir: (0, os_1.tmpdir)(),
                userDataDir: (0, userDataPath_1.getUserDataPath)(args)
            }, productService);
        }
    }
    exports.NativeEnvironmentService = NativeEnvironmentService;
});
//# sourceMappingURL=environmentService.js.map