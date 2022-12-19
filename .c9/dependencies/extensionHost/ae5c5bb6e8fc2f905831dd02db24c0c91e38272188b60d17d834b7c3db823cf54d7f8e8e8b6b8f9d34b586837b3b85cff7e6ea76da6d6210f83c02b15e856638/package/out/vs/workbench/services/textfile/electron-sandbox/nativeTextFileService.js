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
define(["require", "exports", "vs/nls", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/workbench/services/textfile/browser/textFileService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/model", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/editor/common/services/resolverService", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/common/languages/language", "vs/workbench/services/files/common/elevatedFileService", "vs/platform/log/common/log", "vs/base/common/async", "vs/workbench/services/decorations/common/decorations"], function (require, exports, nls_1, globals_1, textFileService_1, textfiles_1, extensions_1, files_1, textResourceConfiguration_1, untitledTextEditorService_1, lifecycle_1, instantiation_1, model_1, environmentService_1, dialogs_1, filesConfigurationService_1, resolverService_1, codeEditorService_1, pathService_1, workingCopyFileService_1, uriIdentity_1, language_1, elevatedFileService_1, log_1, async_1, decorations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeTextFileService = void 0;
    let NativeTextFileService = class NativeTextFileService extends textFileService_1.AbstractTextFileService {
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, elevatedFileService, logService, decorationsService) {
            super(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, logService, elevatedFileService, decorationsService);
            this.environmentService = environmentService;
            this.registerListeners();
        }
        registerListeners() {
            // Lifecycle
            this.lifecycleService.onWillShutdown(event => event.join(this.onWillShutdown(), { id: 'join.textFiles', label: (0, nls_1.localize)('join.textFiles', "Saving text files") }));
        }
        async onWillShutdown() {
            let modelsPendingToSave;
            // As long as models are pending to be saved, we prolong the shutdown
            // until that has happened to ensure we are not shutting down in the
            // middle of writing to the file
            // (https://github.com/microsoft/vscode/issues/116600)
            while ((modelsPendingToSave = this.files.models.filter(model => model.hasState(2 /* TextFileEditorModelState.PENDING_SAVE */))).length > 0) {
                await async_1.Promises.settled(modelsPendingToSave.map(model => model.joinState(2 /* TextFileEditorModelState.PENDING_SAVE */)));
            }
        }
        async read(resource, options) {
            // ensure size & memory limits
            options = this.ensureLimits(options);
            return super.read(resource, options);
        }
        async readStream(resource, options) {
            // ensure size & memory limits
            options = this.ensureLimits(options);
            return super.readStream(resource, options);
        }
        ensureLimits(options) {
            let ensuredOptions;
            if (!options) {
                ensuredOptions = Object.create(null);
            }
            else {
                ensuredOptions = options;
            }
            let ensuredLimits;
            if (!ensuredOptions.limits) {
                ensuredLimits = Object.create(null);
                ensuredOptions.limits = ensuredLimits;
            }
            else {
                ensuredLimits = ensuredOptions.limits;
            }
            if (typeof ensuredLimits.size !== 'number') {
                ensuredLimits.size = (0, files_1.getPlatformLimits)(globals_1.process.arch === 'ia32' ? 0 /* Arch.IA32 */ : 1 /* Arch.OTHER */).maxFileSize;
            }
            if (typeof ensuredLimits.memory !== 'number') {
                const maxMemory = this.environmentService.args['max-memory'];
                ensuredLimits.memory = Math.max(typeof maxMemory === 'string' ? parseInt(maxMemory) * files_1.ByteSize.MB || 0 : 0, (0, files_1.getPlatformLimits)(globals_1.process.arch === 'ia32' ? 0 /* Arch.IA32 */ : 1 /* Arch.OTHER */).maxHeapSize);
            }
            return ensuredOptions;
        }
    };
    NativeTextFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, dialogs_1.IDialogService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, resolverService_1.ITextModelService),
        __param(11, codeEditorService_1.ICodeEditorService),
        __param(12, pathService_1.IPathService),
        __param(13, workingCopyFileService_1.IWorkingCopyFileService),
        __param(14, uriIdentity_1.IUriIdentityService),
        __param(15, language_1.ILanguageService),
        __param(16, elevatedFileService_1.IElevatedFileService),
        __param(17, log_1.ILogService),
        __param(18, decorations_1.IDecorationsService)
    ], NativeTextFileService);
    exports.NativeTextFileService = NativeTextFileService;
    (0, extensions_1.registerSingleton)(textfiles_1.ITextFileService, NativeTextFileService);
});
//# sourceMappingURL=nativeTextFileService.js.map