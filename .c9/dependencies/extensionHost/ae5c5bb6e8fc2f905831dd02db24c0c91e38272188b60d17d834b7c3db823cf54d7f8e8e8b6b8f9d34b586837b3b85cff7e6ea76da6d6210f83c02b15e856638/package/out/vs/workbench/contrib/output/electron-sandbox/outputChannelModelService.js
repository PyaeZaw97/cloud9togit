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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/path", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/base/common/date", "vs/platform/instantiation/common/extensions", "vs/platform/native/electron-sandbox/native", "vs/workbench/contrib/output/common/outputChannelModelService"], function (require, exports, instantiation_1, path_1, uri_1, files_1, environmentService_1, date_1, extensions_1, native_1, outputChannelModelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputChannelModelService = void 0;
    let OutputChannelModelService = class OutputChannelModelService extends outputChannelModelService_1.AbstractOutputChannelModelService {
        constructor(instantiationService, environmentService, fileService, nativeHostService) {
            super(uri_1.URI.file((0, path_1.join)(environmentService.logsPath, `output_${nativeHostService.windowId}_${(0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')}`)), fileService, instantiationService);
        }
    };
    OutputChannelModelService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, files_1.IFileService),
        __param(3, native_1.INativeHostService)
    ], OutputChannelModelService);
    exports.OutputChannelModelService = OutputChannelModelService;
    (0, extensions_1.registerSingleton)(outputChannelModelService_1.IOutputChannelModelService, OutputChannelModelService);
});
//# sourceMappingURL=outputChannelModelService.js.map