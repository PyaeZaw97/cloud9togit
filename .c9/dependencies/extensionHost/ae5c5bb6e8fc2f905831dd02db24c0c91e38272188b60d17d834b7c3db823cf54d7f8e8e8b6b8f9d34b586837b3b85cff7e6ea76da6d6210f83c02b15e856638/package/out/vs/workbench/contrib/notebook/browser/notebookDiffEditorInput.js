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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/editorModel", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, editor_1, editorModel_1, diffEditorInput_1, notebookEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDiffEditorInput = void 0;
    class NotebookDiffEditorModel extends editorModel_1.EditorModel {
        constructor(original, modified) {
            super();
            this.original = original;
            this.modified = modified;
        }
    }
    let NotebookDiffEditorInput = class NotebookDiffEditorInput extends diffEditorInput_1.DiffEditorInput {
        constructor(name, description, original, modified, viewType, editorService) {
            super(name, description, original, modified, undefined, editorService);
            this.original = original;
            this.modified = modified;
            this.viewType = viewType;
            this._modifiedTextModel = null;
            this._originalTextModel = null;
            this._cachedModel = undefined;
        }
        static create(instantiationService, resource, name, description, originalResource, viewType) {
            const original = notebookEditorInput_1.NotebookEditorInput.create(instantiationService, originalResource, viewType);
            const modified = notebookEditorInput_1.NotebookEditorInput.create(instantiationService, resource, viewType);
            return instantiationService.createInstance(NotebookDiffEditorInput, name, description, original, modified, viewType);
        }
        get resource() {
            return this.modified.resource;
        }
        get editorId() {
            return this.viewType;
        }
        get typeId() {
            return NotebookDiffEditorInput.ID;
        }
        async resolve() {
            var _a;
            const [originalEditorModel, modifiedEditorModel] = await Promise.all([
                this.original.resolve(),
                this.modified.resolve(),
            ]);
            (_a = this._cachedModel) === null || _a === void 0 ? void 0 : _a.dispose();
            // TODO@rebornix check how we restore the editor in text diff editor
            if (!modifiedEditorModel) {
                throw new Error(`Fail to resolve modified editor model for resource ${this.modified.resource} with notebookType ${this.viewType}`);
            }
            if (!originalEditorModel) {
                throw new Error(`Fail to resolve original editor model for resource ${this.original.resource} with notebookType ${this.viewType}`);
            }
            this._originalTextModel = originalEditorModel;
            this._modifiedTextModel = modifiedEditorModel;
            this._cachedModel = new NotebookDiffEditorModel(this._originalTextModel, this._modifiedTextModel);
            return this._cachedModel;
        }
        toUntyped() {
            const original = { resource: this.original.resource };
            const modified = { resource: this.resource };
            return {
                original,
                modified,
                primary: modified,
                secondary: original,
                options: {
                    override: this.viewType
                }
            };
        }
        matches(otherInput) {
            var _a;
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof NotebookDiffEditorInput) {
                return this.modified.matches(otherInput.modified)
                    && this.original.matches(otherInput.original)
                    && this.viewType === otherInput.viewType;
            }
            if ((0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return this.modified.matches(otherInput.modified)
                    && this.original.matches(otherInput.original)
                    && this.editorId !== undefined
                    && this.editorId === ((_a = otherInput.options) === null || _a === void 0 ? void 0 : _a.override);
            }
            return false;
        }
    };
    NotebookDiffEditorInput.ID = 'workbench.input.diffNotebookInput';
    NotebookDiffEditorInput = __decorate([
        __param(5, editorService_1.IEditorService)
    ], NotebookDiffEditorInput);
    exports.NotebookDiffEditorInput = NotebookDiffEditorInput;
});
//# sourceMappingURL=notebookDiffEditorInput.js.map