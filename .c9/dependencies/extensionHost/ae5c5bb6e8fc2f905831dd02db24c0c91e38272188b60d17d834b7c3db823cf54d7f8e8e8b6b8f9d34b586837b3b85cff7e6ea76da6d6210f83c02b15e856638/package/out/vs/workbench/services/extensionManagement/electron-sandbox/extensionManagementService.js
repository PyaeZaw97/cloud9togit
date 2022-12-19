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
define(["require", "exports", "vs/base/common/uuid", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagementService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/platform/download/common/download", "vs/platform/product/common/productService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/base/common/resources", "vs/platform/userDataSync/common/userDataSync", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, uuid_1, extensionManagement_1, extensionManagementService_1, extensions_1, extensionManagement_2, network_1, configuration_1, download_1, productService_1, environmentService_1, resources_1, userDataSync_1, dialogs_1, workspaceTrust_1, extensionManifestPropertiesService_1, instantiation_1, files_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementService = void 0;
    let ExtensionManagementService = class ExtensionManagementService extends extensionManagementService_1.ExtensionManagementService {
        constructor(environmentService, extensionManagementServerService, extensionGalleryService, configurationService, productService, downloadService, userDataSyncEnablementService, dialogService, workspaceTrustRequestService, extensionManifestPropertiesService, fileService, logService, instantiationService) {
            super(extensionManagementServerService, extensionGalleryService, configurationService, productService, downloadService, userDataSyncEnablementService, dialogService, workspaceTrustRequestService, extensionManifestPropertiesService, fileService, logService, instantiationService);
            this.environmentService = environmentService;
        }
        async installVSIX(vsix, server, options) {
            if (vsix.scheme === network_1.Schemas.vscodeRemote && server === this.extensionManagementServerService.localExtensionManagementServer) {
                const downloadedLocation = (0, resources_1.joinPath)(this.environmentService.tmpDir, (0, uuid_1.generateUuid)());
                await this.downloadService.download(vsix, downloadedLocation);
                vsix = downloadedLocation;
            }
            const manifest = await this.getManifest(vsix);
            if (manifest) {
                await this.checkForWorkspaceTrust(manifest);
                return server.extensionManagementService.install(vsix, options);
            }
            return Promise.reject('Unable to get the extension manifest.');
        }
    };
    ExtensionManagementService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, productService_1.IProductService),
        __param(5, download_1.IDownloadService),
        __param(6, userDataSync_1.IUserDataSyncEnablementService),
        __param(7, dialogs_1.IDialogService),
        __param(8, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(9, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(10, files_1.IFileService),
        __param(11, log_1.ILogService),
        __param(12, instantiation_1.IInstantiationService)
    ], ExtensionManagementService);
    exports.ExtensionManagementService = ExtensionManagementService;
    (0, extensions_1.registerSingleton)(extensionManagement_2.IWorkbenchExtensionManagementService, ExtensionManagementService);
});
//# sourceMappingURL=extensionManagementService.js.map