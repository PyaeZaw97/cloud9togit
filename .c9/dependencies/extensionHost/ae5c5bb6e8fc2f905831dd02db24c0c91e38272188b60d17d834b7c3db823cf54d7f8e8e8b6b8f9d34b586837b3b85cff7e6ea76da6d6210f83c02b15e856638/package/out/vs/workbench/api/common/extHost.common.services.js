/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/api/common/extHostOutput", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostDecorations", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostTask", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostStorage", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostApiDeprecationService", "vs/workbench/api/common/extHostWindow", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/workbench/api/common/extHostFileSystemInfo", "vs/workbench/api/common/exHostSecretState", "vs/workbench/api/common/extHostTelemetry", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostLoggerService", "vs/platform/log/common/log", "vs/workbench/api/common/extHostLogService", "vs/workbench/api/common/extHostVariableResolverService"], function (require, exports, extensions_1, extHostOutput_1, extHostWorkspace_1, extHostDecorations_1, extHostConfiguration_1, extHostCommands_1, extHostDocumentsAndEditors_1, extHostTerminalService_1, extHostTask_1, extHostDebugService_1, extHostSearch_1, extHostStorage_1, extHostTunnelService_1, extHostApiDeprecationService_1, extHostWindow_1, extHostFileSystemConsumer_1, extHostFileSystemInfo_1, exHostSecretState_1, extHostTelemetry_1, extHostEditorTabs_1, extHostLoggerService_1, log_1, extHostLogService_1, extHostVariableResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(log_1.ILoggerService, extHostLoggerService_1.ExtHostLoggerService);
    (0, extensions_1.registerSingleton)(log_1.ILogService, extHostLogService_1.ExtHostLogService);
    (0, extensions_1.registerSingleton)(extHostApiDeprecationService_1.IExtHostApiDeprecationService, extHostApiDeprecationService_1.ExtHostApiDeprecationService);
    (0, extensions_1.registerSingleton)(extHostCommands_1.IExtHostCommands, extHostCommands_1.ExtHostCommands);
    (0, extensions_1.registerSingleton)(extHostConfiguration_1.IExtHostConfiguration, extHostConfiguration_1.ExtHostConfiguration);
    (0, extensions_1.registerSingleton)(extHostFileSystemConsumer_1.IExtHostConsumerFileSystem, extHostFileSystemConsumer_1.ExtHostConsumerFileSystem);
    (0, extensions_1.registerSingleton)(extHostDebugService_1.IExtHostDebugService, extHostDebugService_1.WorkerExtHostDebugService);
    (0, extensions_1.registerSingleton)(extHostDecorations_1.IExtHostDecorations, extHostDecorations_1.ExtHostDecorations);
    (0, extensions_1.registerSingleton)(extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors, extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors);
    (0, extensions_1.registerSingleton)(extHostFileSystemInfo_1.IExtHostFileSystemInfo, extHostFileSystemInfo_1.ExtHostFileSystemInfo);
    (0, extensions_1.registerSingleton)(extHostOutput_1.IExtHostOutputService, extHostOutput_1.ExtHostOutputService);
    (0, extensions_1.registerSingleton)(extHostSearch_1.IExtHostSearch, extHostSearch_1.ExtHostSearch);
    (0, extensions_1.registerSingleton)(extHostStorage_1.IExtHostStorage, extHostStorage_1.ExtHostStorage);
    (0, extensions_1.registerSingleton)(extHostTask_1.IExtHostTask, extHostTask_1.WorkerExtHostTask);
    (0, extensions_1.registerSingleton)(extHostTerminalService_1.IExtHostTerminalService, extHostTerminalService_1.WorkerExtHostTerminalService);
    (0, extensions_1.registerSingleton)(extHostTunnelService_1.IExtHostTunnelService, extHostTunnelService_1.ExtHostTunnelService);
    (0, extensions_1.registerSingleton)(extHostWindow_1.IExtHostWindow, extHostWindow_1.ExtHostWindow);
    (0, extensions_1.registerSingleton)(extHostWorkspace_1.IExtHostWorkspace, extHostWorkspace_1.ExtHostWorkspace);
    (0, extensions_1.registerSingleton)(exHostSecretState_1.IExtHostSecretState, exHostSecretState_1.ExtHostSecretState);
    (0, extensions_1.registerSingleton)(extHostTelemetry_1.IExtHostTelemetry, extHostTelemetry_1.ExtHostTelemetry);
    (0, extensions_1.registerSingleton)(extHostEditorTabs_1.IExtHostEditorTabs, extHostEditorTabs_1.ExtHostEditorTabs);
    (0, extensions_1.registerSingleton)(extHostVariableResolverService_1.IExtHostVariableResolverProvider, extHostVariableResolverService_1.ExtHostVariableResolverProviderService);
});
//# sourceMappingURL=extHost.common.services.js.map