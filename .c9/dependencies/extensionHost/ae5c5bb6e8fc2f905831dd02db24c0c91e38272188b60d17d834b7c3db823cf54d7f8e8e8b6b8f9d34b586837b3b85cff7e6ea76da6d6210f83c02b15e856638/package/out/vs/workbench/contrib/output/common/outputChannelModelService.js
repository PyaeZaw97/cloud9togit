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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/date", "vs/base/common/resources", "vs/workbench/contrib/output/common/outputChannelModel"], function (require, exports, extensions_1, environmentService_1, instantiation_1, files_1, date_1, resources_1, outputChannelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputChannelModelService = exports.AbstractOutputChannelModelService = exports.IOutputChannelModelService = void 0;
    exports.IOutputChannelModelService = (0, instantiation_1.createDecorator)('outputChannelModelService');
    let AbstractOutputChannelModelService = class AbstractOutputChannelModelService {
        constructor(outputLocation, fileService, instantiationService) {
            this.outputLocation = outputLocation;
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this._outputDir = null;
        }
        createOutputChannelModel(id, modelUri, language, file) {
            return file ? this.instantiationService.createInstance(outputChannelModel_1.FileOutputChannelModel, modelUri, language, file) : this.instantiationService.createInstance(outputChannelModel_1.DelegatedOutputChannelModel, id, modelUri, language, this.outputDir);
        }
        get outputDir() {
            if (!this._outputDir) {
                this._outputDir = this.fileService.createFolder(this.outputLocation).then(() => this.outputLocation);
            }
            return this._outputDir;
        }
    };
    AbstractOutputChannelModelService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, instantiation_1.IInstantiationService)
    ], AbstractOutputChannelModelService);
    exports.AbstractOutputChannelModelService = AbstractOutputChannelModelService;
    let OutputChannelModelService = class OutputChannelModelService extends AbstractOutputChannelModelService {
        constructor(instantiationService, environmentService, fileService) {
            super((0, resources_1.joinPath)((0, resources_1.dirname)(environmentService.logFile), (0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')), fileService, instantiationService);
        }
    };
    OutputChannelModelService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, files_1.IFileService)
    ], OutputChannelModelService);
    exports.OutputChannelModelService = OutputChannelModelService;
    (0, extensions_1.registerSingleton)(exports.IOutputChannelModelService, OutputChannelModelService);
});
//# sourceMappingURL=outputChannelModelService.js.map