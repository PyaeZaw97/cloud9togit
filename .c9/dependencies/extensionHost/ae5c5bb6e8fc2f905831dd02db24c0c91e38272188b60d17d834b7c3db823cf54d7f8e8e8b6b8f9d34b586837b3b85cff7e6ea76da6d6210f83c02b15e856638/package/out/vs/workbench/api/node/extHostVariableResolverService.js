/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/workbench/api/common/extHostVariableResolverService"], function (require, exports, os_1, extHostVariableResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeExtHostVariableResolverProviderService = void 0;
    class NodeExtHostVariableResolverProviderService extends extHostVariableResolverService_1.ExtHostVariableResolverProviderService {
        homeDir() {
            return (0, os_1.homedir)();
        }
    }
    exports.NodeExtHostVariableResolverProviderService = NodeExtHostVariableResolverProviderService;
});
//# sourceMappingURL=extHostVariableResolverService.js.map