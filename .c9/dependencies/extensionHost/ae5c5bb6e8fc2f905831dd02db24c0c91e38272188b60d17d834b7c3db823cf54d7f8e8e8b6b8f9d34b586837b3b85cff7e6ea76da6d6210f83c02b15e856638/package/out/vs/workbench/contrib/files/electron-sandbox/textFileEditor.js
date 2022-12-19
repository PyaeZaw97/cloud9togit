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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/files/browser/editors/textFileEditor", "vs/platform/files/common/files", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/preferences/common/preferences", "vs/platform/native/electron-sandbox/native", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/files/browser/files", "vs/platform/product/common/productService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/path/common/pathService", "vs/platform/configuration/common/configuration"], function (require, exports, nls_1, textFileEditor_1, files_1, errorMessage_1, actions_1, telemetry_1, instantiation_1, workspace_1, storage_1, textResourceConfiguration_1, editorService_1, themeService_1, editorGroupsService_1, textfiles_1, preferences_1, native_1, uriIdentity_1, files_2, productService_1, panecomposite_1, pathService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeTextFileEditor = void 0;
    /**
     * An implementation of editor for file system resources.
     */
    let NativeTextFileEditor = class NativeTextFileEditor extends textFileEditor_1.TextFileEditor {
        constructor(telemetryService, fileService, paneCompositeService, instantiationService, contextService, storageService, textResourceConfigurationService, editorService, themeService, editorGroupService, textFileService, nativeHostService, preferencesService, explorerService, uriIdentityService, productService, pathService, configurationService) {
            super(telemetryService, fileService, paneCompositeService, instantiationService, contextService, storageService, textResourceConfigurationService, editorService, themeService, editorGroupService, textFileService, explorerService, uriIdentityService, pathService, configurationService);
            this.nativeHostService = nativeHostService;
            this.preferencesService = preferencesService;
            this.productService = productService;
        }
        handleSetInputError(error, input, options) {
            // Allow to restart with higher memory limit if the file is too large
            if (error.fileOperationResult === 9 /* FileOperationResult.FILE_EXCEEDS_MEMORY_LIMIT */) {
                const memoryLimit = Math.max(files_1.MIN_MAX_MEMORY_SIZE_MB, +this.textResourceConfigurationService.getValue(undefined, 'files.maxMemoryForLargeFilesMB') || files_1.FALLBACK_MAX_MEMORY_SIZE_MB);
                throw (0, errorMessage_1.createErrorWithActions)((0, nls_1.localize)('fileTooLargeForHeapError', "To open a file of this size, you need to restart and allow {0} to use more memory", this.productService.nameShort), [
                    (0, actions_1.toAction)({
                        id: 'workbench.window.action.relaunchWithIncreasedMemoryLimit', label: (0, nls_1.localize)('relaunchWithIncreasedMemoryLimit', "Restart with {0} MB", memoryLimit), run: () => {
                            return this.nativeHostService.relaunch({
                                addArgs: [
                                    `--max-memory=${memoryLimit}`
                                ]
                            });
                        }
                    }),
                    (0, actions_1.toAction)({
                        id: 'workbench.window.action.configureMemoryLimit', label: (0, nls_1.localize)('configureMemoryLimit', 'Configure Memory Limit'), run: () => {
                            return this.preferencesService.openUserSettings({ query: 'files.maxMemoryForLargeFilesMB' });
                        }
                    }),
                ]);
            }
            // Fallback to handling in super type
            return super.handleSetInputError(error, input, options);
        }
    };
    NativeTextFileEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, files_1.IFileService),
        __param(2, panecomposite_1.IPaneCompositePartService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, storage_1.IStorageService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, editorService_1.IEditorService),
        __param(8, themeService_1.IThemeService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, native_1.INativeHostService),
        __param(12, preferences_1.IPreferencesService),
        __param(13, files_2.IExplorerService),
        __param(14, uriIdentity_1.IUriIdentityService),
        __param(15, productService_1.IProductService),
        __param(16, pathService_1.IPathService),
        __param(17, configuration_1.IConfigurationService)
    ], NativeTextFileEditor);
    exports.NativeTextFileEditor = NativeTextFileEditor;
});
//# sourceMappingURL=textFileEditor.js.map