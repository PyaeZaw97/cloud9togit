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
define(["require", "exports", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/textfile/common/textEditorService", "vs/base/common/resources", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/workingCopy/common/workingCopyEditorService"], function (require, exports, network_1, lifecycle_1, uri_1, textEditorService_1, resources_1, modesRegistry_1, environmentService_1, filesConfigurationService_1, pathService_1, untitledTextEditorInput_1, workingCopy_1, workingCopyEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorWorkingCopyEditorHandler = exports.UntitledTextEditorInputSerializer = void 0;
    let UntitledTextEditorInputSerializer = class UntitledTextEditorInputSerializer {
        constructor(filesConfigurationService, environmentService, pathService) {
            this.filesConfigurationService = filesConfigurationService;
            this.environmentService = environmentService;
            this.pathService = pathService;
        }
        canSerialize(editorInput) {
            return this.filesConfigurationService.isHotExitEnabled && !editorInput.isDisposed();
        }
        serialize(editorInput) {
            if (!this.filesConfigurationService.isHotExitEnabled || editorInput.isDisposed()) {
                return undefined;
            }
            const untitledTextEditorInput = editorInput;
            let resource = untitledTextEditorInput.resource;
            if (untitledTextEditorInput.model.hasAssociatedFilePath) {
                resource = (0, resources_1.toLocalResource)(resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme); // untitled with associated file path use the local schema
            }
            // Language: only remember language if it is either specific (not text)
            // or if the language was explicitly set by the user. We want to preserve
            // this information across restarts and not set the language unless
            // this is the case.
            let languageId;
            const languageIdCandidate = untitledTextEditorInput.getLanguageId();
            if (languageIdCandidate !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                languageId = languageIdCandidate;
            }
            else if (untitledTextEditorInput.model.hasLanguageSetExplicitly) {
                languageId = languageIdCandidate;
            }
            const serialized = {
                resourceJSON: resource.toJSON(),
                modeId: languageId,
                encoding: untitledTextEditorInput.getEncoding()
            };
            return JSON.stringify(serialized);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.invokeFunction(accessor => {
                const deserialized = JSON.parse(serializedEditorInput);
                const resource = uri_1.URI.revive(deserialized.resourceJSON);
                const languageId = deserialized.modeId;
                const encoding = deserialized.encoding;
                return accessor.get(textEditorService_1.ITextEditorService).createTextEditor({ resource, languageId, encoding, forceUntitled: true });
            });
        }
    };
    UntitledTextEditorInputSerializer = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, pathService_1.IPathService)
    ], UntitledTextEditorInputSerializer);
    exports.UntitledTextEditorInputSerializer = UntitledTextEditorInputSerializer;
    let UntitledTextEditorWorkingCopyEditorHandler = class UntitledTextEditorWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        constructor(workingCopyEditorService, environmentService, pathService, textEditorService) {
            super();
            this.workingCopyEditorService = workingCopyEditorService;
            this.environmentService = environmentService;
            this.pathService = pathService;
            this.textEditorService = textEditorService;
            this.installHandler();
        }
        installHandler() {
            this._register(this.workingCopyEditorService.registerHandler({
                handles: workingCopy => workingCopy.resource.scheme === network_1.Schemas.untitled && workingCopy.typeId === workingCopy_1.NO_TYPE_ID,
                isOpen: (workingCopy, editor) => editor instanceof untitledTextEditorInput_1.UntitledTextEditorInput && (0, resources_1.isEqual)(workingCopy.resource, editor.resource),
                createEditor: workingCopy => {
                    let editorInputResource;
                    // This is a (weak) strategy to find out if the untitled input had
                    // an associated file path or not by just looking at the path. and
                    // if so, we must ensure to restore the local resource it had.
                    if (!UntitledTextEditorWorkingCopyEditorHandler.UNTITLED_REGEX.test(workingCopy.resource.path)) {
                        editorInputResource = (0, resources_1.toLocalResource)(workingCopy.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
                    }
                    else {
                        editorInputResource = workingCopy.resource;
                    }
                    return this.textEditorService.createTextEditor({ resource: editorInputResource, forceUntitled: true });
                }
            }));
        }
    };
    UntitledTextEditorWorkingCopyEditorHandler.UNTITLED_REGEX = /Untitled-\d+/;
    UntitledTextEditorWorkingCopyEditorHandler = __decorate([
        __param(0, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, pathService_1.IPathService),
        __param(3, textEditorService_1.ITextEditorService)
    ], UntitledTextEditorWorkingCopyEditorHandler);
    exports.UntitledTextEditorWorkingCopyEditorHandler = UntitledTextEditorWorkingCopyEditorHandler;
});
//# sourceMappingURL=untitledTextEditorHandler.js.map