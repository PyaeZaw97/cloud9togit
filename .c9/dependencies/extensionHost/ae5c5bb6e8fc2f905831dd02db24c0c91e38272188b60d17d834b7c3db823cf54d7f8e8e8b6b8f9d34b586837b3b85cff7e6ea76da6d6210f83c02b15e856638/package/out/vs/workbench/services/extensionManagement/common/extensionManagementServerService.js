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
define(["require", "exports", "vs/nls", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/network", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensionManagement/common/webExtensionManagementService", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/log/common/log"], function (require, exports, nls_1, extensionManagement_1, remoteAgentService_1, network_1, extensions_1, label_1, platform_1, instantiation_1, webExtensionManagementService_1, extensionManagementIpc_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementServerService = void 0;
    let ExtensionManagementServerService = class ExtensionManagementServerService {
        constructor(remoteAgentService, labelService, instantiationService, logService) {
            this.localExtensionManagementServer = null;
            this.remoteExtensionManagementServer = null;
            this.webExtensionManagementServer = null;
            const remoteAgentConnection = remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const extensionManagementService = new extensionManagementIpc_1.ExtensionManagementChannelClient(remoteAgentConnection.getChannel('extensions'));
                this.remoteExtensionManagementServer = {
                    id: 'remote',
                    extensionManagementService,
                    get label() { return labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAgentConnection.remoteAuthority) || (0, nls_1.localize)('remote', "Remote"); },
                };
            }
            if (platform_1.isWeb) {
                const extensionManagementService = instantiationService.createInstance(webExtensionManagementService_1.WebExtensionManagementService);
                this.webExtensionManagementServer = {
                    id: 'web',
                    extensionManagementService,
                    label: (0, nls_1.localize)('browser', "Browser"),
                };
            }
        }
        getExtensionManagementServer(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this.remoteExtensionManagementServer;
            }
            if (this.webExtensionManagementServer) {
                return this.webExtensionManagementServer;
            }
            throw new Error(`Invalid Extension ${extension.location}`);
        }
        getExtensionInstallLocation(extension) {
            const server = this.getExtensionManagementServer(extension);
            return server === this.remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */ : 3 /* ExtensionInstallLocation.Web */;
        }
    };
    ExtensionManagementServerService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, log_1.ILogService)
    ], ExtensionManagementServerService);
    exports.ExtensionManagementServerService = ExtensionManagementServerService;
    (0, extensions_1.registerSingleton)(extensionManagement_1.IExtensionManagementServerService, ExtensionManagementServerService);
});
//# sourceMappingURL=extensionManagementServerService.js.map