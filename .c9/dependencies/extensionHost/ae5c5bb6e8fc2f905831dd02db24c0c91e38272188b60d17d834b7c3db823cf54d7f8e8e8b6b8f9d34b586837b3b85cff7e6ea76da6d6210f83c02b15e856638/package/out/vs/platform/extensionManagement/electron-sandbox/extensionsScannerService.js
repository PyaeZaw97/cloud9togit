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
define(["require", "exports", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, uri_1, environment_1, extensionsScannerService_1, files_1, extensions_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsScannerService = void 0;
    let ExtensionsScannerService = class ExtensionsScannerService extends extensionsScannerService_1.NativeExtensionsScannerService {
        constructor(fileService, logService, environmentService, productService) {
            super(uri_1.URI.file(environmentService.builtinExtensionsPath), uri_1.URI.file(environmentService.extensionsPath), environmentService.userHome, uri_1.URI.file(environmentService.userDataPath), fileService, logService, environmentService, productService);
        }
    };
    ExtensionsScannerService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, log_1.ILogService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, productService_1.IProductService)
    ], ExtensionsScannerService);
    exports.ExtensionsScannerService = ExtensionsScannerService;
    (0, extensions_1.registerSingleton)(extensionsScannerService_1.IExtensionsScannerService, ExtensionsScannerService);
});
//# sourceMappingURL=extensionsScannerService.js.map