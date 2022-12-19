/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/network"], function (require, exports, platform_1, strings_1, uri_1, instantiation_1, serviceMachineId_1, telemetryUtils_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionResourceLoaderService = exports.IExtensionResourceLoaderService = exports.WEB_EXTENSION_RESOURCE_END_POINT = void 0;
    exports.WEB_EXTENSION_RESOURCE_END_POINT = 'web-extension-resource';
    exports.IExtensionResourceLoaderService = (0, instantiation_1.createDecorator)('extensionResourceLoaderService');
    class AbstractExtensionResourceLoaderService {
        constructor(_fileService, _storageService, _productService, _environmentService, _configurationService) {
            this._fileService = _fileService;
            this._storageService = _storageService;
            this._productService = _productService;
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            if (_productService.extensionsGallery) {
                this._extensionGalleryResourceUrlTemplate = _productService.extensionsGallery.resourceUrlTemplate;
                this._extensionGalleryAuthority = this._extensionGalleryResourceUrlTemplate ? this._getExtensionGalleryAuthority(uri_1.URI.parse(this._extensionGalleryResourceUrlTemplate)) : undefined;
            }
        }
        get supportsExtensionGalleryResources() {
            return this._extensionGalleryResourceUrlTemplate !== undefined;
        }
        getExtensionGalleryResourceURL(galleryExtension, path) {
            if (this._extensionGalleryResourceUrlTemplate) {
                const uri = uri_1.URI.parse((0, strings_1.format2)(this._extensionGalleryResourceUrlTemplate, { publisher: galleryExtension.publisher, name: galleryExtension.name, version: galleryExtension.version, path: 'extension' }));
                return this._isWebExtensionResourceEndPoint(uri) ? uri.with({ scheme: network_1.RemoteAuthorities.getPreferredWebSchema() }) : uri;
            }
            return undefined;
        }
        isExtensionGalleryResource(uri) {
            return this._extensionGalleryAuthority && this._extensionGalleryAuthority === this._getExtensionGalleryAuthority(uri);
        }
        async getExtensionGalleryRequestHeaders() {
            const headers = {
                'X-Client-Name': `${this._productService.applicationName}${platform_1.isWeb ? '-web' : ''}`,
                'X-Client-Version': this._productService.version
            };
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService) === 3 /* TelemetryLevel.USAGE */) {
                headers['X-Machine-Id'] = await this._getServiceMachineId();
            }
            if (this._productService.commit) {
                headers['X-Client-Commit'] = this._productService.commit;
            }
            return headers;
        }
        _getServiceMachineId() {
            if (!this._serviceMachineIdPromise) {
                this._serviceMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(this._environmentService, this._fileService, this._storageService);
            }
            return this._serviceMachineIdPromise;
        }
        _getExtensionGalleryAuthority(uri) {
            if (this._isWebExtensionResourceEndPoint(uri)) {
                return uri.authority;
            }
            const index = uri.authority.indexOf('.');
            return index !== -1 ? uri.authority.substring(index + 1) : undefined;
        }
        _isWebExtensionResourceEndPoint(uri) {
            return uri.path.startsWith(`/${exports.WEB_EXTENSION_RESOURCE_END_POINT}/`);
        }
    }
    exports.AbstractExtensionResourceLoaderService = AbstractExtensionResourceLoaderService;
});
//# sourceMappingURL=extensionResourceLoader.js.map