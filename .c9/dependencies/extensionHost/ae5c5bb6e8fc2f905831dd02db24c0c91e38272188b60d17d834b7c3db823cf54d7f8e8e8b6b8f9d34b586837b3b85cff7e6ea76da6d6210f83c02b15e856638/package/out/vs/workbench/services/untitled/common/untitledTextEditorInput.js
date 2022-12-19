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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/textfile/common/textfiles", "vs/platform/label/common/label", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService"], function (require, exports, editor_1, textResourceEditorInput_1, textfiles_1, label_1, editorService_1, files_1, resources_1, environmentService_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorInput = void 0;
    /**
     * An editor input to be used for untitled text buffers.
     */
    let UntitledTextEditorInput = class UntitledTextEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        constructor(model, textFileService, labelService, editorService, fileService, environmentService, pathService) {
            super(model.resource, undefined, editorService, textFileService, labelService, fileService);
            this.model = model;
            this.environmentService = environmentService;
            this.pathService = pathService;
            this.modelResolve = undefined;
            this.registerModelListeners(model);
        }
        get typeId() {
            return UntitledTextEditorInput.ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        registerModelListeners(model) {
            // re-emit some events from the model
            this._register(model.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(model.onDidChangeName(() => this._onDidChangeLabel.fire()));
            // a reverted untitled text editor model renders this input disposed
            this._register(model.onDidRevert(() => this.dispose()));
        }
        getName() {
            return this.model.name;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            // Without associated path: only use if name and description differ
            if (!this.model.hasAssociatedFilePath) {
                const descriptionCandidate = this.resource.path;
                if (descriptionCandidate !== this.getName()) {
                    return descriptionCandidate;
                }
                return undefined;
            }
            // With associated path: delegate to parent
            return super.getDescription(verbosity);
        }
        getTitle(verbosity) {
            // Without associated path: check if name and description differ to decide
            // if description should appear besides the name to distinguish better
            if (!this.model.hasAssociatedFilePath) {
                const name = this.getName();
                const description = this.getDescription();
                if (description && description !== name) {
                    return `${name} • ${description}`;
                }
                return name;
            }
            // With associated path: delegate to parent
            return super.getTitle(verbosity);
        }
        isDirty() {
            return this.model.isDirty();
        }
        getEncoding() {
            return this.model.getEncoding();
        }
        setEncoding(encoding, mode /* ignored, we only have Encode */) {
            return this.model.setEncoding(encoding);
        }
        setLanguageId(languageId) {
            this.model.setLanguageId(languageId);
        }
        getLanguageId() {
            return this.model.getLanguageId();
        }
        async resolve() {
            if (!this.modelResolve) {
                this.modelResolve = this.model.resolve();
            }
            await this.modelResolve;
            return this.model;
        }
        toUntyped(options) {
            var _a;
            const untypedInput = {
                resource: this.model.hasAssociatedFilePath ? (0, resources_1.toLocalResource)(this.model.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme) : this.resource,
                forceUntitled: true,
                options: {
                    override: this.editorId
                }
            };
            if (typeof (options === null || options === void 0 ? void 0 : options.preserveViewState) === 'number') {
                untypedInput.encoding = this.getEncoding();
                untypedInput.languageId = this.getLanguageId();
                untypedInput.contents = this.model.isDirty() ? (_a = this.model.textEditorModel) === null || _a === void 0 ? void 0 : _a.getValue() : undefined;
                untypedInput.options.viewState = (0, editor_1.findViewStateForEditor)(this, options.preserveViewState, this.editorService);
                if (typeof untypedInput.contents === 'string' && !this.model.hasAssociatedFilePath) {
                    // Given how generic untitled resources in the system are, we
                    // need to be careful not to set our resource into the untyped
                    // editor if we want to transport contents too, because of
                    // issue https://github.com/microsoft/vscode/issues/140898
                    // The workaround is to simply remove the resource association
                    // if we have contents and no associated resource.
                    // In that case we can ensure that a new untitled resource is
                    // being created and the contents can be restored properly.
                    untypedInput.resource = undefined;
                }
            }
            return untypedInput;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof UntitledTextEditorInput) {
                return (0, resources_1.isEqual)(otherInput.resource, this.resource);
            }
            return false;
        }
        dispose() {
            this.modelResolve = undefined;
            super.dispose();
        }
    };
    UntitledTextEditorInput.ID = 'workbench.editors.untitledEditorInput';
    UntitledTextEditorInput = __decorate([
        __param(1, textfiles_1.ITextFileService),
        __param(2, label_1.ILabelService),
        __param(3, editorService_1.IEditorService),
        __param(4, files_1.IFileService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, pathService_1.IPathService)
    ], UntitledTextEditorInput);
    exports.UntitledTextEditorInput = UntitledTextEditorInput;
});
//# sourceMappingURL=untitledTextEditorInput.js.map