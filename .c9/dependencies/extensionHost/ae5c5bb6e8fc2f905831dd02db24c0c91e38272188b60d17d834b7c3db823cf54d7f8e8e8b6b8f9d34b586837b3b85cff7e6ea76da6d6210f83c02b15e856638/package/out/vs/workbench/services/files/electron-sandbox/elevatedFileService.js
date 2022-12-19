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
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/native/electron-sandbox/native", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/files/common/elevatedFileService"], function (require, exports, extpath_1, network_1, uri_1, files_1, extensions_1, native_1, environmentService_1, elevatedFileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeElevatedFileService = void 0;
    let NativeElevatedFileService = class NativeElevatedFileService {
        constructor(nativeHostService, fileService, environmentService) {
            this.nativeHostService = nativeHostService;
            this.fileService = fileService;
            this.environmentService = environmentService;
        }
        isSupported(resource) {
            // Saving elevated is currently only supported for local
            // files for as long as we have no generic support from
            // the file service
            // (https://github.com/microsoft/vscode/issues/48659)
            return resource.scheme === network_1.Schemas.file;
        }
        async writeFileElevated(resource, value, options) {
            const source = uri_1.URI.file((0, extpath_1.randomPath)(this.environmentService.userDataPath, 'code-elevated'));
            try {
                // write into a tmp file first
                await this.fileService.writeFile(source, value, options);
                // then sudo prompt copy
                await this.nativeHostService.writeElevated(source, resource, options);
            }
            finally {
                // clean up
                await this.fileService.del(source);
            }
            return this.fileService.resolve(resource, { resolveMetadata: true });
        }
    };
    NativeElevatedFileService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, files_1.IFileService),
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService)
    ], NativeElevatedFileService);
    exports.NativeElevatedFileService = NativeElevatedFileService;
    (0, extensions_1.registerSingleton)(elevatedFileService_1.IElevatedFileService, NativeElevatedFileService);
});
//# sourceMappingURL=elevatedFileService.js.map