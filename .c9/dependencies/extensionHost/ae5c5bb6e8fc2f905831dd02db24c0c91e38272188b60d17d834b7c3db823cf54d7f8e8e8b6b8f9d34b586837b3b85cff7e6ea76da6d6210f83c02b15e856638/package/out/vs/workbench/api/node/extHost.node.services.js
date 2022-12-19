/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/api/node/extHostTerminalService", "vs/workbench/api/node/extHostTask", "vs/workbench/api/node/extHostDebugService", "vs/workbench/api/node/extHostSearch", "vs/workbench/api/node/extHostExtensionService", "vs/workbench/api/node/extHostTunnelService", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostTask", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/node/extHostStoragePaths", "vs/workbench/api/node/extHostLoggerService", "vs/platform/log/common/log", "vs/workbench/api/node/extHostVariableResolverService", "vs/workbench/api/common/extHostVariableResolverService"], function (require, exports, extensions_1, extHostTerminalService_1, extHostTask_1, extHostDebugService_1, extHostSearch_1, extHostExtensionService_1, extHostTunnelService_1, extHostDebugService_2, extHostExtensionService_2, extHostSearch_2, extHostTask_2, extHostTerminalService_2, extHostTunnelService_2, extHostStoragePaths_1, extHostStoragePaths_2, extHostLoggerService_1, log_1, extHostVariableResolverService_1, extHostVariableResolverService_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // #########################################################################
    // ###                                                                   ###
    // ### !!! PLEASE ADD COMMON IMPORTS INTO extHost.common.services.ts !!! ###
    // ###                                                                   ###
    // #########################################################################
    (0, extensions_1.registerSingleton)(extHostExtensionService_2.IExtHostExtensionService, extHostExtensionService_1.ExtHostExtensionService);
    (0, extensions_1.registerSingleton)(log_1.ILoggerService, extHostLoggerService_1.ExtHostLoggerService);
    (0, extensions_1.registerSingleton)(extHostStoragePaths_1.IExtensionStoragePaths, extHostStoragePaths_2.ExtensionStoragePaths);
    (0, extensions_1.registerSingleton)(extHostDebugService_2.IExtHostDebugService, extHostDebugService_1.ExtHostDebugService);
    (0, extensions_1.registerSingleton)(extHostSearch_2.IExtHostSearch, extHostSearch_1.NativeExtHostSearch);
    (0, extensions_1.registerSingleton)(extHostTask_2.IExtHostTask, extHostTask_1.ExtHostTask);
    (0, extensions_1.registerSingleton)(extHostTerminalService_2.IExtHostTerminalService, extHostTerminalService_1.ExtHostTerminalService);
    (0, extensions_1.registerSingleton)(extHostTunnelService_2.IExtHostTunnelService, extHostTunnelService_1.ExtHostTunnelService);
    (0, extensions_1.registerSingleton)(extHostVariableResolverService_2.IExtHostVariableResolverProvider, extHostVariableResolverService_1.NodeExtHostVariableResolverProviderService);
});
//# sourceMappingURL=extHost.node.services.js.map