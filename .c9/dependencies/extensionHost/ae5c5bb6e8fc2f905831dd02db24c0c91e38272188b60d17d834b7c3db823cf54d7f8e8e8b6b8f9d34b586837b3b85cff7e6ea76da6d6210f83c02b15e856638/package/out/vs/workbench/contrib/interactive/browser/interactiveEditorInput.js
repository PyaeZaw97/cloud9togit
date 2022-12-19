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
define(["require", "exports", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/interactive/browser/interactiveDocumentService", "vs/workbench/contrib/interactive/browser/interactiveHistoryService", "vs/workbench/contrib/notebook/common/notebookEditorInput"], function (require, exports, event_1, paths, resources_1, model_1, resolverService_1, instantiation_1, editorInput_1, interactiveDocumentService_1, interactiveHistoryService_1, notebookEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditorInput = void 0;
    let InteractiveEditorInput = class InteractiveEditorInput extends editorInput_1.EditorInput {
        constructor(resource, inputResource, title, instantiationService, modelService, textModelService, interactiveDocumentService, historyService) {
            const input = notebookEditorInput_1.NotebookEditorInput.create(instantiationService, resource, 'interactive', {});
            super();
            this._notebookEditorInput = input;
            this._register(this._notebookEditorInput);
            this._initTitle = title;
            this._inputResource = inputResource;
            this._inputResolver = null;
            this._editorModelReference = null;
            this._inputModelRef = null;
            this._textModelService = textModelService;
            this._interactiveDocumentService = interactiveDocumentService;
            this._historyService = historyService;
            this._registerListeners();
        }
        static create(instantiationService, resource, inputResource, title) {
            return instantiationService.createInstance(InteractiveEditorInput, resource, inputResource, title);
        }
        get editorId() {
            return InteractiveEditorInput.ID;
        }
        get typeId() {
            return InteractiveEditorInput.ID;
        }
        get notebookEditorInput() {
            return this._notebookEditorInput;
        }
        get editorInputs() {
            return [this._notebookEditorInput];
        }
        get resource() {
            return this.primary.resource;
        }
        get inputResource() {
            return this._inputResource;
        }
        get primary() {
            return this._notebookEditorInput;
        }
        _registerListeners() {
            const oncePrimaryDisposed = event_1.Event.once(this.primary.onWillDispose);
            this._register(oncePrimaryDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Re-emit some events from the primary side to the outside
            this._register(this.primary.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(this.primary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
            // Re-emit some events from both sides to the outside
            this._register(this.primary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
        }
        isDirty() {
            return false;
        }
        async _resolveEditorModel() {
            if (!this._editorModelReference) {
                this._editorModelReference = await this._notebookEditorInput.resolve();
            }
            return this._editorModelReference;
        }
        async resolve() {
            if (this._editorModelReference) {
                return this._editorModelReference;
            }
            if (this._inputResolver) {
                return this._inputResolver;
            }
            this._inputResolver = this._resolveEditorModel();
            return this._inputResolver;
        }
        async resolveInput(language) {
            if (this._inputModelRef) {
                return this._inputModelRef.object.textEditorModel;
            }
            this._interactiveDocumentService.willCreateInteractiveDocument(this.resource, this.inputResource, language);
            this._inputModelRef = await this._textModelService.createModelReference(this.inputResource);
            return this._inputModelRef.object.textEditorModel;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof InteractiveEditorInput) {
                return (0, resources_1.isEqual)(this.resource, otherInput.resource) && (0, resources_1.isEqual)(this.inputResource, otherInput.inputResource);
            }
            return false;
        }
        getName() {
            if (this._initTitle) {
                return this._initTitle;
            }
            const p = this.primary.resource.path;
            const basename = paths.basename(p);
            return basename.substr(0, basename.length - paths.extname(p).length);
        }
        dispose() {
            var _a, _b, _c, _d;
            // we support closing the interactive window without prompt, so the editor model should not be dirty
            (_a = this._editorModelReference) === null || _a === void 0 ? void 0 : _a.revert({ soft: true });
            (_b = this._notebookEditorInput) === null || _b === void 0 ? void 0 : _b.dispose();
            (_c = this._editorModelReference) === null || _c === void 0 ? void 0 : _c.dispose();
            this._editorModelReference = null;
            this._interactiveDocumentService.willRemoveInteractiveDocument(this.resource, this.inputResource);
            (_d = this._inputModelRef) === null || _d === void 0 ? void 0 : _d.dispose();
            this._inputModelRef = null;
            super.dispose();
        }
        get historyService() {
            return this._historyService;
        }
    };
    InteractiveEditorInput.ID = 'workbench.input.interactive';
    InteractiveEditorInput = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, interactiveDocumentService_1.IInteractiveDocumentService),
        __param(7, interactiveHistoryService_1.IInteractiveHistoryService)
    ], InteractiveEditorInput);
    exports.InteractiveEditorInput = InteractiveEditorInput;
});
//# sourceMappingURL=interactiveEditorInput.js.map