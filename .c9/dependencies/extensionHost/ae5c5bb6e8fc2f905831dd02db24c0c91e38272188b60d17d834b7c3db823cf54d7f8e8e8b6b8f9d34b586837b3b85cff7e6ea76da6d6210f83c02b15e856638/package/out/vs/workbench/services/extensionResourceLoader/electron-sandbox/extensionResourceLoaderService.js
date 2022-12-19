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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation"], function (require, exports, extensions_1, files_1, extensionResourceLoader_1, productService_1, request_1, storage_1, environment_1, configuration_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionResourceLoaderService = void 0;
    let ExtensionResourceLoaderService = class ExtensionResourceLoaderService extends extensionResourceLoader_1.AbstractExtensionResourceLoaderService {
        constructor(fileService, storageService, productService, environmentService, configurationService, _requestService) {
            super(fileService, storageService, productService, environmentService, configurationService);
            this._requestService = _requestService;
        }
        async readExtensionResource(uri) {
            if (this.isExtensionGalleryResource(uri)) {
                const headers = await this.getExtensionGalleryRequestHeaders();
                const requestContext = await this._requestService.request({ url: uri.toString(), headers }, cancellation_1.CancellationToken.None);
                return (await (0, request_1.asTextOrError)(requestContext)) || '';
            }
            const result = await this._fileService.readFile(uri);
            return result.value.toString();
        }
    };
    ExtensionResourceLoaderService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, storage_1.IStorageService),
        __param(2, productService_1.IProductService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, request_1.IRequestService)
    ], ExtensionResourceLoaderService);
    exports.ExtensionResourceLoaderService = ExtensionResourceLoaderService;
    (0, extensions_1.registerSingleton)(extensionResourceLoader_1.IExtensionResourceLoaderService, ExtensionResourceLoaderService);
});
//# sourceMappingURL=extensionResourceLoaderService.js.map