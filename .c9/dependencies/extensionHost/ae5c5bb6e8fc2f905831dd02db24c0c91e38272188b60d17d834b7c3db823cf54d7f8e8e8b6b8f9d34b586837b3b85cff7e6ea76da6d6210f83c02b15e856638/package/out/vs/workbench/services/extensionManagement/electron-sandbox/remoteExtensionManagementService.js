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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/base/common/errorMessage", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/nls", "vs/platform/product/common/productService", "vs/platform/configuration/common/configuration", "vs/base/common/uuid", "vs/base/common/resources", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/base/common/async", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/extensionManagement/common/extensionManagementIpc"], function (require, exports, extensionManagement_1, extensionManagementUtil_1, log_1, errorMessage_1, arrays_1, cancellation_1, nls_1, productService_1, configuration_1, uuid_1, resources_1, environmentService_1, async_1, extensionManifestPropertiesService_1, extensionManagementIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeRemoteExtensionManagementService = void 0;
    let NativeRemoteExtensionManagementService = class NativeRemoteExtensionManagementService extends extensionManagementIpc_1.ExtensionManagementChannelClient {
        constructor(channel, localExtensionManagementServer, logService, galleryService, configurationService, productService, environmentService, extensionManifestPropertiesService) {
            super(channel);
            this.localExtensionManagementServer = localExtensionManagementServer;
            this.logService = logService;
            this.galleryService = galleryService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.environmentService = environmentService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async install(vsix, options) {
            const local = await super.install(vsix, options);
            await this.installUIDependenciesAndPackedExtensions(local);
            return local;
        }
        async installFromGallery(extension, installOptions) {
            const local = await this.doInstallFromGallery(extension, installOptions);
            await this.installUIDependenciesAndPackedExtensions(local);
            return local;
        }
        async doInstallFromGallery(extension, installOptions) {
            if (this.configurationService.getValue('remote.downloadExtensionsLocally')) {
                return this.downloadAndInstall(extension, installOptions || {});
            }
            try {
                return await super.installFromGallery(extension, installOptions);
            }
            catch (error) {
                switch (error.name) {
                    case extensionManagement_1.ExtensionManagementErrorCode.Download:
                    case extensionManagement_1.ExtensionManagementErrorCode.Internal:
                        try {
                            this.logService.error(`Error while installing '${extension.identifier.id}' extension in the remote server.`, (0, errorMessage_1.toErrorMessage)(error));
                            return await this.downloadAndInstall(extension, installOptions || {});
                        }
                        catch (e) {
                            this.logService.error(e);
                            throw e;
                        }
                    default:
                        this.logService.debug('Remote Install Error Name', error.name);
                        throw error;
                }
            }
        }
        async downloadAndInstall(extension, installOptions) {
            this.logService.info(`Downloading the '${extension.identifier.id}' extension locally and install`);
            const compatible = await this.checkAndGetCompatible(extension, !!installOptions.installPreReleaseVersion);
            installOptions = Object.assign(Object.assign({}, installOptions), { donotIncludePackAndDependencies: true });
            const installed = await this.getInstalled(1 /* ExtensionType.User */);
            const workspaceExtensions = await this.getAllWorkspaceDependenciesAndPackedExtensions(compatible, cancellation_1.CancellationToken.None);
            if (workspaceExtensions.length) {
                this.logService.info(`Downloading the workspace dependencies and packed extensions of '${compatible.identifier.id}' locally and install`);
                for (const workspaceExtension of workspaceExtensions) {
                    await this.downloadCompatibleAndInstall(workspaceExtension, installed, installOptions);
                }
            }
            return await this.downloadCompatibleAndInstall(compatible, installed, installOptions);
        }
        async downloadCompatibleAndInstall(extension, installed, installOptions) {
            const compatible = await this.checkAndGetCompatible(extension, !!installOptions.installPreReleaseVersion);
            const location = (0, resources_1.joinPath)(this.environmentService.tmpDir, (0, uuid_1.generateUuid)());
            this.logService.trace('Downloading extension:', compatible.identifier.id);
            await this.galleryService.download(compatible, location, installed.filter(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, compatible.identifier))[0] ? 3 /* InstallOperation.Update */ : 2 /* InstallOperation.Install */);
            this.logService.info('Downloaded extension:', compatible.identifier.id, location.path);
            const local = await super.install(location, installOptions);
            this.logService.info(`Successfully installed '${compatible.identifier.id}' extension`);
            return local;
        }
        async checkAndGetCompatible(extension, includePreRelease) {
            const compatible = await this.galleryService.getCompatibleExtension(extension, includePreRelease, await this.getTargetPlatform());
            if (compatible) {
                if (includePreRelease && !compatible.properties.isPreReleaseVersion && extension.hasPreReleaseVersion) {
                    throw new extensionManagement_1.ExtensionManagementError((0, nls_1.localize)('notFoundCompatiblePrereleaseDependency', "Can't install pre-release version of '{0}' extension because it is not compatible with the current version of {1} (version {2}).", extension.identifier.id, this.productService.nameLong, this.productService.version), extensionManagement_1.ExtensionManagementErrorCode.IncompatiblePreRelease);
                }
            }
            else {
                throw new extensionManagement_1.ExtensionManagementError((0, nls_1.localize)('notFoundCompatibleDependency', "Can't install '{0}' extension because it is not compatible with the current version of {1} (version {2}).", extension.identifier.id, this.productService.nameLong, this.productService.version), extensionManagement_1.ExtensionManagementErrorCode.Incompatible);
            }
            return compatible;
        }
        async installUIDependenciesAndPackedExtensions(local) {
            const uiExtensions = await this.getAllUIDependenciesAndPackedExtensions(local.manifest, cancellation_1.CancellationToken.None);
            const installed = await this.localExtensionManagementServer.extensionManagementService.getInstalled();
            const toInstall = uiExtensions.filter(e => installed.every(i => !(0, extensionManagementUtil_1.areSameExtensions)(i.identifier, e.identifier)));
            if (toInstall.length) {
                this.logService.info(`Installing UI dependencies and packed extensions of '${local.identifier.id}' locally`);
                await async_1.Promises.settled(toInstall.map(d => this.localExtensionManagementServer.extensionManagementService.installFromGallery(d)));
            }
        }
        async getAllUIDependenciesAndPackedExtensions(manifest, token) {
            const result = new Map();
            const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
            await this.getDependenciesAndPackedExtensionsRecursively(extensions, result, true, token);
            return [...result.values()];
        }
        async getAllWorkspaceDependenciesAndPackedExtensions(extension, token) {
            const result = new Map();
            result.set(extension.identifier.id.toLowerCase(), extension);
            const manifest = await this.galleryService.getManifest(extension, token);
            if (manifest) {
                const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
                await this.getDependenciesAndPackedExtensionsRecursively(extensions, result, false, token);
            }
            result.delete(extension.identifier.id);
            return [...result.values()];
        }
        async getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token) {
            if (toGet.length === 0) {
                return Promise.resolve();
            }
            const extensions = await this.galleryService.getExtensions(toGet.map(id => ({ id })), token);
            const manifests = await Promise.all(extensions.map(e => this.galleryService.getManifest(e, token)));
            const extensionsManifests = [];
            for (let idx = 0; idx < extensions.length; idx++) {
                const extension = extensions[idx];
                const manifest = manifests[idx];
                if (manifest && this.extensionManifestPropertiesService.prefersExecuteOnUI(manifest) === uiExtension) {
                    result.set(extension.identifier.id.toLowerCase(), extension);
                    extensionsManifests.push(manifest);
                }
            }
            toGet = [];
            for (const extensionManifest of extensionsManifests) {
                if ((0, arrays_1.isNonEmptyArray)(extensionManifest.extensionDependencies)) {
                    for (const id of extensionManifest.extensionDependencies) {
                        if (!result.has(id.toLowerCase())) {
                            toGet.push(id);
                        }
                    }
                }
                if ((0, arrays_1.isNonEmptyArray)(extensionManifest.extensionPack)) {
                    for (const id of extensionManifest.extensionPack) {
                        if (!result.has(id.toLowerCase())) {
                            toGet.push(id);
                        }
                    }
                }
            }
            return this.getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token);
        }
    };
    NativeRemoteExtensionManagementService = __decorate([
        __param(2, log_1.ILogService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, productService_1.IProductService),
        __param(6, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(7, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], NativeRemoteExtensionManagementService);
    exports.NativeRemoteExtensionManagementService = NativeRemoteExtensionManagementService;
});
//# sourceMappingURL=remoteExtensionManagementService.js.map