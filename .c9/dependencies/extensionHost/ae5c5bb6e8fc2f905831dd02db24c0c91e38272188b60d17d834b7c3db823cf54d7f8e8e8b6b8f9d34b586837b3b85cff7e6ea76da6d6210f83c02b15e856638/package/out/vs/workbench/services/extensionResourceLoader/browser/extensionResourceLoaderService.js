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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/base/common/network", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration"], function (require, exports, extensions_1, files_1, extensionResourceLoader_1, network_1, productService_1, storage_1, environment_1, log_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionResourceLoaderService = class ExtensionResourceLoaderService extends extensionResourceLoader_1.AbstractExtensionResourceLoaderService {
        constructor(fileService, storageService, productService, environmentService, configurationService, _logService) {
            super(fileService, storageService, productService, environmentService, configurationService);
            this._logService = _logService;
        }
        async readExtensionResource(uri) {
            uri = network_1.FileAccess.asBrowserUri(uri);
            if (uri.scheme !== network_1.Schemas.http && uri.scheme !== network_1.Schemas.https) {
                const result = await this._fileService.readFile(uri);
                return result.value.toString();
            }
            const requestInit = {};
            if (this.isExtensionGalleryResource(uri)) {
                requestInit.headers = await this.getExtensionGalleryRequestHeaders();
                requestInit.mode = 'cors'; /* set mode to cors so that above headers are always passed */
            }
            const response = await fetch(uri.toString(true), requestInit);
            if (response.status !== 200) {
                this._logService.info(`Request to '${uri.toString(true)}' failed with status code ${response.status}`);
                throw new Error(response.statusText);
            }
            return response.text();
        }
    };
    ExtensionResourceLoaderService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, storage_1.IStorageService),
        __param(2, productService_1.IProductService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, log_1.ILogService)
    ], ExtensionResourceLoaderService);
    (0, extensions_1.registerSingleton)(extensionResourceLoader_1.IExtensionResourceLoaderService, ExtensionResourceLoaderService);
});
//# sourceMappingURL=extensionResourceLoaderService.js.map