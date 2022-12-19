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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/textResourceEditorModel", "vs/editor/common/model/textModel"], function (require, exports, editor_1, resourceEditorInput_1, textfiles_1, editorService_1, files_1, label_1, network_1, resources_1, resolverService_1, textResourceEditorModel_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceEditorInput = exports.AbstractTextResourceEditorInput = void 0;
    /**
     * The base class for all editor inputs that open in text editors.
     */
    let AbstractTextResourceEditorInput = class AbstractTextResourceEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
        constructor(resource, preferredResource, editorService, textFileService, labelService, fileService) {
            super(resource, preferredResource, labelService, fileService);
            this.editorService = editorService;
            this.textFileService = textFileService;
        }
        save(group, options) {
            // If this is neither an `untitled` resource, nor a resource
            // we can handle with the file service, we can only "Save As..."
            if (this.resource.scheme !== network_1.Schemas.untitled && !this.fileService.hasProvider(this.resource)) {
                return this.saveAs(group, options);
            }
            // Normal save
            return this.doSave(options, false, group);
        }
        saveAs(group, options) {
            return this.doSave(options, true, group);
        }
        async doSave(options, saveAs, group) {
            // Save / Save As
            let target;
            if (saveAs) {
                target = await this.textFileService.saveAs(this.resource, undefined, Object.assign(Object.assign({}, options), { suggestedTarget: this.preferredResource }));
            }
            else {
                target = await this.textFileService.save(this.resource, options);
            }
            if (!target) {
                return undefined; // save cancelled
            }
            return { resource: target };
        }
        async revert(group, options) {
            await this.textFileService.revert(this.resource, options);
        }
    };
    AbstractTextResourceEditorInput = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, label_1.ILabelService),
        __param(5, files_1.IFileService)
    ], AbstractTextResourceEditorInput);
    exports.AbstractTextResourceEditorInput = AbstractTextResourceEditorInput;
    /**
     * A read-only text editor input whos contents are made of the provided resource that points to an existing
     * code editor model.
     */
    let TextResourceEditorInput = class TextResourceEditorInput extends AbstractTextResourceEditorInput {
        constructor(resource, name, description, preferredLanguageId, preferredContents, textModelResolverService, textFileService, editorService, fileService, labelService) {
            super(resource, undefined, editorService, textFileService, labelService, fileService);
            this.name = name;
            this.description = description;
            this.preferredLanguageId = preferredLanguageId;
            this.preferredContents = preferredContents;
            this.textModelResolverService = textModelResolverService;
            this.cachedModel = undefined;
            this.modelReference = undefined;
        }
        get typeId() {
            return TextResourceEditorInput.ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        getName() {
            return this.name || super.getName();
        }
        setName(name) {
            if (this.name !== name) {
                this.name = name;
                this._onDidChangeLabel.fire();
            }
        }
        getDescription() {
            return this.description;
        }
        setDescription(description) {
            if (this.description !== description) {
                this.description = description;
                this._onDidChangeLabel.fire();
            }
        }
        setLanguageId(languageId) {
            this.setPreferredLanguageId(languageId);
            if (this.cachedModel) {
                this.cachedModel.setLanguageId(languageId);
            }
        }
        setPreferredLanguageId(languageId) {
            this.preferredLanguageId = languageId;
        }
        setPreferredContents(contents) {
            this.preferredContents = contents;
        }
        async resolve() {
            // Unset preferred contents and language after resolving
            // once to prevent these properties to stick. We still
            // want the user to change the language in the editor
            // and want to show updated contents (if any) in future
            // `resolve` calls.
            const preferredContents = this.preferredContents;
            const preferredLanguageId = this.preferredLanguageId;
            this.preferredContents = undefined;
            this.preferredLanguageId = undefined;
            if (!this.modelReference) {
                this.modelReference = this.textModelResolverService.createModelReference(this.resource);
            }
            const ref = await this.modelReference;
            // Ensure the resolved model is of expected type
            const model = ref.object;
            if (!(model instanceof textResourceEditorModel_1.TextResourceEditorModel)) {
                ref.dispose();
                this.modelReference = undefined;
                throw new Error(`Unexpected model for TextResourceEditorInput: ${this.resource}`);
            }
            this.cachedModel = model;
            // Set contents and language if preferred
            if (typeof preferredContents === 'string' || typeof preferredLanguageId === 'string') {
                model.updateTextEditorModel(typeof preferredContents === 'string' ? (0, textModel_1.createTextBufferFactory)(preferredContents) : undefined, preferredLanguageId);
            }
            return model;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof TextResourceEditorInput) {
                return (0, resources_1.isEqual)(otherInput.resource, this.resource);
            }
            return false;
        }
        dispose() {
            if (this.modelReference) {
                this.modelReference.then(ref => ref.dispose());
                this.modelReference = undefined;
            }
            this.cachedModel = undefined;
            super.dispose();
        }
    };
    TextResourceEditorInput.ID = 'workbench.editors.resourceEditorInput';
    TextResourceEditorInput = __decorate([
        __param(5, resolverService_1.ITextModelService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, editorService_1.IEditorService),
        __param(8, files_1.IFileService),
        __param(9, label_1.ILabelService)
    ], TextResourceEditorInput);
    exports.TextResourceEditorInput = TextResourceEditorInput;
});
//# sourceMappingURL=textResourceEditorInput.js.map