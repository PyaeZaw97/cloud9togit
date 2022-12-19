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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/server/node/remoteLanguagePacks"], function (require, exports, resources_1, uri_1, environment_1, extensionsScannerService_1, extensions_1, files_1, log_1, productService_1, remoteLanguagePacks_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsScannerService = void 0;
    let ExtensionsScannerService = class ExtensionsScannerService extends extensionsScannerService_1.AbstractExtensionsScannerService {
        constructor(fileService, logService, nativeEnvironmentService, productService) {
            super(uri_1.URI.file(nativeEnvironmentService.builtinExtensionsPath), uri_1.URI.file(nativeEnvironmentService.extensionsPath), (0, resources_1.joinPath)(nativeEnvironmentService.userHome, '.vscode-oss-dev', 'extensions', 'control.json'), (0, resources_1.joinPath)(uri_1.URI.file(nativeEnvironmentService.userDataPath), extensions_1.MANIFEST_CACHE_FOLDER), fileService, logService, nativeEnvironmentService, productService);
            this.nativeEnvironmentService = nativeEnvironmentService;
        }
        async getTranslations(language) {
            const config = await (0, remoteLanguagePacks_1.getNLSConfiguration)(language, this.nativeEnvironmentService.userDataPath);
            if (remoteLanguagePacks_1.InternalNLSConfiguration.is(config)) {
                try {
                    const content = await this.fileService.readFile(uri_1.URI.file(config._translationsConfigFile));
                    return JSON.parse(content.value.toString());
                }
                catch (err) { /* Ignore error */ }
            }
            return Object.create(null);
        }
    };
    ExtensionsScannerService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, log_1.ILogService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, productService_1.IProductService)
    ], ExtensionsScannerService);
    exports.ExtensionsScannerService = ExtensionsScannerService;
});
//# sourceMappingURL=extensionsScannerService.js.map