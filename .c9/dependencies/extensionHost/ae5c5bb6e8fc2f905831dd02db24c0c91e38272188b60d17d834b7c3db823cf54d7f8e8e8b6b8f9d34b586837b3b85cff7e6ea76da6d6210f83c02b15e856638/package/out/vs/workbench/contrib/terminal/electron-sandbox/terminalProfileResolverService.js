/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalProfileResolverService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, configuration_1, log_1, notification_1, storage_1, workspace_1, terminal_1, terminalProfileResolverService_1, terminal_2, configurationResolver_1, history_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronTerminalProfileResolverService = void 0;
    let ElectronTerminalProfileResolverService = class ElectronTerminalProfileResolverService extends terminalProfileResolverService_1.BaseTerminalProfileResolverService {
        constructor(configurationResolverService, configurationService, historyService, logService, workspaceContextService, terminalProfileService, remoteAgentService, storageService, notificationService, terminalInstanceService) {
            super({
                getDefaultSystemShell: async (remoteAuthority, platform) => {
                    const backend = terminalInstanceService.getBackend(remoteAuthority);
                    if (!backend) {
                        throw new Error(`Cannot get default system shell when there is no backend for remote authority '${remoteAuthority}'`);
                    }
                    return backend.getDefaultSystemShell(platform);
                },
                getEnvironment: (remoteAuthority) => {
                    const backend = terminalInstanceService.getBackend(remoteAuthority);
                    if (!backend) {
                        throw new Error(`Cannot get environment when there is no backend for remote authority '${remoteAuthority}'`);
                    }
                    return backend.getEnvironment();
                }
            }, configurationService, configurationResolverService, historyService, logService, terminalProfileService, workspaceContextService, remoteAgentService, storageService, notificationService);
        }
    };
    ElectronTerminalProfileResolverService = __decorate([
        __param(0, configurationResolver_1.IConfigurationResolverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, history_1.IHistoryService),
        __param(3, log_1.ILogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, terminal_2.ITerminalProfileService),
        __param(6, remoteAgentService_1.IRemoteAgentService),
        __param(7, storage_1.IStorageService),
        __param(8, notification_1.INotificationService),
        __param(9, terminal_1.ITerminalInstanceService)
    ], ElectronTerminalProfileResolverService);
    exports.ElectronTerminalProfileResolverService = ElectronTerminalProfileResolverService;
});
//# sourceMappingURL=terminalProfileResolverService.js.map