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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/common/services/editorWorker", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/model/editStack", "vs/base/common/map", "vs/editor/common/services/model", "vs/editor/browser/services/bulkEditService"], function (require, exports, lifecycle_1, editOperation_1, range_1, resolverService_1, editorWorker_1, undoRedo_1, editStack_1, map_1, model_1, bulkEditService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkTextEdits = void 0;
    class ModelEditTask {
        constructor(_modelReference) {
            this._modelReference = _modelReference;
            this.model = this._modelReference.object.textEditorModel;
            this._edits = [];
        }
        dispose() {
            this._modelReference.dispose();
        }
        isNoOp() {
            if (this._edits.length > 0) {
                // contains textual edits
                return false;
            }
            if (this._newEol !== undefined && this._newEol !== this.model.getEndOfLineSequence()) {
                // contains an eol change that is a real change
                return false;
            }
            return true;
        }
        addEdit(resourceEdit) {
            this._expectedModelVersionId = resourceEdit.versionId;
            const { textEdit } = resourceEdit;
            if (typeof textEdit.eol === 'number') {
                // honor eol-change
                this._newEol = textEdit.eol;
            }
            if (!textEdit.range && !textEdit.text) {
                // lacks both a range and the text
                return;
            }
            if (range_1.Range.isEmpty(textEdit.range) && !textEdit.text) {
                // no-op edit (replace empty range with empty text)
                return;
            }
            // create edit operation
            let range;
            if (!textEdit.range) {
                range = this.model.getFullModelRange();
            }
            else {
                range = range_1.Range.lift(textEdit.range);
            }
            this._edits.push(editOperation_1.EditOperation.replaceMove(range, textEdit.text));
        }
        validate() {
            if (typeof this._expectedModelVersionId === 'undefined' || this.model.getVersionId() === this._expectedModelVersionId) {
                return { canApply: true };
            }
            return { canApply: false, reason: this.model.uri };
        }
        getBeforeCursorState() {
            return null;
        }
        apply() {
            if (this._edits.length > 0) {
                this._edits = this._edits.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this.model.pushEditOperations(null, this._edits, () => null);
            }
            if (this._newEol !== undefined) {
                this.model.pushEOL(this._newEol);
            }
        }
    }
    class EditorEditTask extends ModelEditTask {
        constructor(modelReference, editor) {
            super(modelReference);
            this._editor = editor;
        }
        getBeforeCursorState() {
            return this._canUseEditor() ? this._editor.getSelections() : null;
        }
        apply() {
            // Check that the editor is still for the wanted model. It might have changed in the
            // meantime and that means we cannot use the editor anymore (instead we perform the edit through the model)
            if (!this._canUseEditor()) {
                super.apply();
                return;
            }
            if (this._edits.length > 0) {
                this._edits = this._edits.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this._editor.executeEdits('', this._edits);
            }
            if (this._newEol !== undefined) {
                if (this._editor.hasModel()) {
                    this._editor.getModel().pushEOL(this._newEol);
                }
            }
        }
        _canUseEditor() {
            var _a, _b;
            return ((_b = (_a = this._editor) === null || _a === void 0 ? void 0 : _a.getModel()) === null || _b === void 0 ? void 0 : _b.uri.toString()) === this.model.uri.toString();
        }
    }
    let BulkTextEdits = class BulkTextEdits {
        constructor(_label, _code, _editor, _undoRedoGroup, _undoRedoSource, _progress, _token, edits, _editorWorker, _modelService, _textModelResolverService, _undoRedoService) {
            this._label = _label;
            this._code = _code;
            this._editor = _editor;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._progress = _progress;
            this._token = _token;
            this._editorWorker = _editorWorker;
            this._modelService = _modelService;
            this._textModelResolverService = _textModelResolverService;
            this._undoRedoService = _undoRedoService;
            this._edits = new map_1.ResourceMap();
            for (const edit of edits) {
                let array = this._edits.get(edit.resource);
                if (!array) {
                    array = [];
                    this._edits.set(edit.resource, array);
                }
                array.push(edit);
            }
        }
        _validateBeforePrepare() {
            // First check if loaded models were not changed in the meantime
            for (const array of this._edits.values()) {
                for (let edit of array) {
                    if (typeof edit.versionId === 'number') {
                        let model = this._modelService.getModel(edit.resource);
                        if (model && model.getVersionId() !== edit.versionId) {
                            // model changed in the meantime
                            throw new Error(`${model.uri.toString()} has changed in the meantime`);
                        }
                    }
                }
            }
        }
        async _createEditsTasks() {
            const tasks = [];
            const promises = [];
            for (let [key, value] of this._edits) {
                const promise = this._textModelResolverService.createModelReference(key).then(async (ref) => {
                    var _a, _b;
                    let task;
                    let makeMinimal = false;
                    if (((_b = (_a = this._editor) === null || _a === void 0 ? void 0 : _a.getModel()) === null || _b === void 0 ? void 0 : _b.uri.toString()) === ref.object.textEditorModel.uri.toString()) {
                        task = new EditorEditTask(ref, this._editor);
                        makeMinimal = true;
                    }
                    else {
                        task = new ModelEditTask(ref);
                    }
                    for (const edit of value) {
                        if (makeMinimal) {
                            const newEdits = await this._editorWorker.computeMoreMinimalEdits(edit.resource, [edit.textEdit]);
                            if (!newEdits) {
                                task.addEdit(edit);
                            }
                            else {
                                for (let moreMinialEdit of newEdits) {
                                    task.addEdit(new bulkEditService_1.ResourceTextEdit(edit.resource, moreMinialEdit, edit.versionId, edit.metadata));
                                }
                            }
                        }
                        else {
                            task.addEdit(edit);
                        }
                    }
                    tasks.push(task);
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            return tasks;
        }
        _validateTasks(tasks) {
            for (const task of tasks) {
                const result = task.validate();
                if (!result.canApply) {
                    return result;
                }
            }
            return { canApply: true };
        }
        async apply() {
            this._validateBeforePrepare();
            const tasks = await this._createEditsTasks();
            try {
                if (this._token.isCancellationRequested) {
                    return [];
                }
                const resources = [];
                const validation = this._validateTasks(tasks);
                if (!validation.canApply) {
                    throw new Error(`${validation.reason.toString()} has changed in the meantime`);
                }
                if (tasks.length === 1) {
                    // This edit touches a single model => keep things simple
                    const task = tasks[0];
                    if (!task.isNoOp()) {
                        const singleModelEditStackElement = new editStack_1.SingleModelEditStackElement(this._label, this._code, task.model, task.getBeforeCursorState());
                        this._undoRedoService.pushElement(singleModelEditStackElement, this._undoRedoGroup, this._undoRedoSource);
                        task.apply();
                        singleModelEditStackElement.close();
                        resources.push(task.model.uri);
                    }
                    this._progress.report(undefined);
                }
                else {
                    // prepare multi model undo element
                    const multiModelEditStackElement = new editStack_1.MultiModelEditStackElement(this._label, this._code, tasks.map(t => new editStack_1.SingleModelEditStackElement(this._label, this._code, t.model, t.getBeforeCursorState())));
                    this._undoRedoService.pushElement(multiModelEditStackElement, this._undoRedoGroup, this._undoRedoSource);
                    for (const task of tasks) {
                        task.apply();
                        this._progress.report(undefined);
                        resources.push(task.model.uri);
                    }
                    multiModelEditStackElement.close();
                }
                return resources;
            }
            finally {
                (0, lifecycle_1.dispose)(tasks);
            }
        }
    };
    BulkTextEdits = __decorate([
        __param(8, editorWorker_1.IEditorWorkerService),
        __param(9, model_1.IModelService),
        __param(10, resolverService_1.ITextModelService),
        __param(11, undoRedo_1.IUndoRedoService)
    ], BulkTextEdits);
    exports.BulkTextEdits = BulkTextEdits;
});
//# sourceMappingURL=bulkTextEdits.js.map