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
define(["require", "exports", "vs/nls", "vs/base/common/network", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/ipc/electron-sandbox/services", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensionManagement/electron-sandbox/remoteExtensionManagementService", "vs/platform/label/common/label", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/extensionManagementIpc"], function (require, exports, nls_1, network_1, extensionManagement_1, remoteAgentService_1, services_1, extensions_1, remoteExtensionManagementService_1, label_1, instantiation_1, extensionManagementIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementServerService = void 0;
    let ExtensionManagementServerService = class ExtensionManagementServerService {
        constructor(sharedProcessService, remoteAgentService, labelService, instantiationService) {
            this.remoteExtensionManagementServer = null;
            this.webExtensionManagementServer = null;
            const localExtensionManagementService = new extensionManagementIpc_1.ExtensionManagementChannelClient(sharedProcessService.getChannel('extensions'));
            this._localExtensionManagementServer = { extensionManagementService: localExtensionManagementService, id: 'local', label: (0, nls_1.localize)('local', "Local") };
            const remoteAgentConnection = remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const extensionManagementService = instantiationService.createInstance(remoteExtensionManagementService_1.NativeRemoteExtensionManagementService, remoteAgentConnection.getChannel('extensions'), this.localExtensionManagementServer);
                this.remoteExtensionManagementServer = {
                    id: 'remote',
                    extensionManagementService,
                    get label() { return labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAgentConnection.remoteAuthority) || (0, nls_1.localize)('remote', "Remote"); },
                };
            }
        }
        get localExtensionManagementServer() { return this._localExtensionManagementServer; }
        getExtensionManagementServer(extension) {
            if (extension.location.scheme === network_1.Schemas.file) {
                return this.localExtensionManagementServer;
            }
            if (this.remoteExtensionManagementServer && extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this.remoteExtensionManagementServer;
            }
            throw new Error(`Invalid Extension ${extension.location}`);
        }
        getExtensionInstallLocation(extension) {
            const server = this.getExtensionManagementServer(extension);
            return server === this.remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */ : 1 /* ExtensionInstallLocation.Local */;
        }
    };
    ExtensionManagementServerService = __decorate([
        __param(0, services_1.ISharedProcessService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, label_1.ILabelService),
        __param(3, instantiation_1.IInstantiationService)
    ], ExtensionManagementServerService);
    exports.ExtensionManagementServerService = ExtensionManagementServerService;
    (0, extensions_1.registerSingleton)(extensionManagement_1.IExtensionManagementServerService, ExtensionManagementServerService);
});
//# sourceMappingURL=extensionManagementServerService.js.map