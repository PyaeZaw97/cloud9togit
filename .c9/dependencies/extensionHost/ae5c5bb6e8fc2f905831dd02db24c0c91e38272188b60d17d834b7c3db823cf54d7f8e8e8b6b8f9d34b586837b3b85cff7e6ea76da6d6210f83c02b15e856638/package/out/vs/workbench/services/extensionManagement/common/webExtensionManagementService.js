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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/log/common/log", "vs/platform/extensionManagement/common/abstractExtensionManagementService", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/product/common/productService", "vs/base/common/types"], function (require, exports, extensionManagement_1, uri_1, extensionManagementUtil_1, extensionManagement_2, log_1, abstractExtensionManagementService_1, telemetry_1, extensionManifestPropertiesService_1, productService_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebExtensionManagementService = void 0;
    let WebExtensionManagementService = class WebExtensionManagementService extends abstractExtensionManagementService_1.AbstractExtensionManagementService {
        constructor(extensionGalleryService, telemetryService, logService, webExtensionsScannerService, extensionManifestPropertiesService, productService) {
            super(extensionGalleryService, telemetryService, logService, productService);
            this.webExtensionsScannerService = webExtensionsScannerService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async getTargetPlatform() {
            return "web" /* TargetPlatform.WEB */;
        }
        async canInstall(gallery) {
            if (await super.canInstall(gallery)) {
                return true;
            }
            if (this.isConfiguredToExecuteOnWeb(gallery)) {
                return true;
            }
            return false;
        }
        async getInstalled(type, bailOut) {
            const extensions = [];
            if (type === undefined || type === 0 /* ExtensionType.System */) {
                const systemExtensions = await this.webExtensionsScannerService.scanSystemExtensions();
                extensions.push(...systemExtensions);
            }
            if (type === undefined || type === 1 /* ExtensionType.User */) {
                const userExtensions = await this.webExtensionsScannerService.scanUserExtensions({ bailOut });
                extensions.push(...userExtensions);
            }
            return Promise.all(extensions.map(e => toLocalExtension(e)));
        }
        async install(location, options = {}) {
            this.logService.trace('ExtensionManagementService#install', location.toString());
            const manifest = await this.webExtensionsScannerService.scanExtensionManifest(location);
            if (!manifest) {
                throw new Error(`Cannot find packageJSON from the location ${location.toString()}`);
            }
            return this.installExtension(manifest, location, options);
        }
        async getCompatibleVersion(extension, fetchCompatibleVersion, includePreRelease) {
            const compatibleExtension = await super.getCompatibleVersion(extension, fetchCompatibleVersion, includePreRelease);
            if (compatibleExtension) {
                return compatibleExtension;
            }
            if (this.isConfiguredToExecuteOnWeb(extension)) {
                return extension;
            }
            return null;
        }
        isConfiguredToExecuteOnWeb(gallery) {
            const configuredExtensionKind = this.extensionManifestPropertiesService.getUserConfiguredExtensionKind(gallery.identifier);
            return !!configuredExtensionKind && configuredExtensionKind.includes('web');
        }
        async updateMetadata(local, metadata) {
            return local;
        }
        createInstallExtensionTask(manifest, extension, options) {
            return new InstallExtensionTask(manifest, extension, options, this.webExtensionsScannerService);
        }
        createUninstallExtensionTask(extension, options) {
            return new UninstallExtensionTask(extension, options, this.webExtensionsScannerService);
        }
        zip(extension) { throw new Error('unsupported'); }
        unzip(zipLocation) { throw new Error('unsupported'); }
        getManifest(vsix) { throw new Error('unsupported'); }
        updateExtensionScope() { throw new Error('unsupported'); }
    };
    WebExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILogService),
        __param(3, extensionManagement_2.IWebExtensionsScannerService),
        __param(4, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(5, productService_1.IProductService)
    ], WebExtensionManagementService);
    exports.WebExtensionManagementService = WebExtensionManagementService;
    function toLocalExtension(extension) {
        const metadata = getMetadata(undefined, extension);
        return Object.assign(Object.assign({}, extension), { identifier: { id: extension.identifier.id, uuid: metadata.id }, isMachineScoped: !!metadata.isMachineScoped, publisherId: metadata.publisherId || null, publisherDisplayName: metadata.publisherDisplayName || null, installedTimestamp: metadata.installedTimestamp, isPreReleaseVersion: !!metadata.isPreReleaseVersion, preRelease: !!metadata.preRelease, targetPlatform: "web" /* TargetPlatform.WEB */, updated: !!metadata.updated });
    }
    function getMetadata(options, existingExtension) {
        const metadata = Object.assign({}, ((existingExtension === null || existingExtension === void 0 ? void 0 : existingExtension.metadata) || {}));
        metadata.isMachineScoped = (options === null || options === void 0 ? void 0 : options.isMachineScoped) || metadata.isMachineScoped;
        return metadata;
    }
    class InstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        constructor(manifest, extension, options, webExtensionsScannerService) {
            super();
            this.extension = extension;
            this.options = options;
            this.webExtensionsScannerService = webExtensionsScannerService;
            this._operation = 2 /* InstallOperation.Install */;
            this.identifier = uri_1.URI.isUri(extension) ? { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) } : extension.identifier;
            this.source = extension;
        }
        get operation() { return (0, types_1.isUndefined)(this.options.operation) ? this._operation : this.options.operation; }
        async doRun(token) {
            const userExtensions = await this.webExtensionsScannerService.scanUserExtensions();
            const existingExtension = userExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.identifier));
            if (existingExtension) {
                this._operation = 3 /* InstallOperation.Update */;
            }
            const metadata = getMetadata(this.options, existingExtension);
            if (!uri_1.URI.isUri(this.extension)) {
                metadata.id = this.extension.identifier.uuid;
                metadata.publisherDisplayName = this.extension.publisherDisplayName;
                metadata.publisherId = this.extension.publisherId;
                metadata.installedTimestamp = Date.now();
                metadata.isPreReleaseVersion = this.extension.properties.isPreReleaseVersion;
                metadata.isBuiltin = this.options.isBuiltin || (existingExtension === null || existingExtension === void 0 ? void 0 : existingExtension.isBuiltin);
                metadata.isSystem = (existingExtension === null || existingExtension === void 0 ? void 0 : existingExtension.type) === 0 /* ExtensionType.System */ ? true : undefined;
                metadata.updated = !!existingExtension;
                metadata.preRelease = this.extension.properties.isPreReleaseVersion ||
                    ((0, types_1.isBoolean)(this.options.installPreReleaseVersion)
                        ? this.options.installPreReleaseVersion /* Respect the passed flag */
                        : metadata === null || metadata === void 0 ? void 0 : metadata.preRelease /* Respect the existing pre-release flag if it was set */);
            }
            const scannedExtension = uri_1.URI.isUri(this.extension) ? await this.webExtensionsScannerService.addExtension(this.extension, metadata)
                : await this.webExtensionsScannerService.addExtensionFromGallery(this.extension, metadata);
            return toLocalExtension(scannedExtension);
        }
    }
    class UninstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        constructor(extension, options, webExtensionsScannerService) {
            super();
            this.extension = extension;
            this.webExtensionsScannerService = webExtensionsScannerService;
        }
        doRun(token) {
            return this.webExtensionsScannerService.removeExtension(this.extension.identifier);
        }
    }
});
//# sourceMappingURL=webExtensionManagementService.js.map