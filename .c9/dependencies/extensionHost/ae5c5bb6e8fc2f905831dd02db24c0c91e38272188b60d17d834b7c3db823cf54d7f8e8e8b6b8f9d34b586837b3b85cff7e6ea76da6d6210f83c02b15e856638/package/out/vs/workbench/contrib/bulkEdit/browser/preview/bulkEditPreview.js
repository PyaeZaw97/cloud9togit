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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/common/model/textModel", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/editor/common/core/editOperation", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/event", "vs/workbench/contrib/bulkEdit/browser/conflicts", "vs/base/common/map", "vs/nls", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/base/common/codicons", "vs/base/common/uuid"], function (require, exports, resolverService_1, uri_1, language_1, model_1, textModel_1, lifecycle_1, arrays_1, range_1, editOperation_1, instantiation_1, files_1, event_1, conflicts_1, map_1, nls_1, resources_1, bulkEditService_1, codicons_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditPreviewProvider = exports.BulkFileOperations = exports.BulkCategory = exports.BulkFileOperation = exports.BulkFileOperationType = exports.BulkTextEdit = exports.CheckedStates = void 0;
    class CheckedStates {
        constructor() {
            this._states = new WeakMap();
            this._checkedCount = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            this._onDidChange.dispose();
        }
        get checkedCount() {
            return this._checkedCount;
        }
        isChecked(obj) {
            var _a;
            return (_a = this._states.get(obj)) !== null && _a !== void 0 ? _a : false;
        }
        updateChecked(obj, value) {
            const valueNow = this._states.get(obj);
            if (valueNow === value) {
                return;
            }
            if (valueNow === undefined) {
                if (value) {
                    this._checkedCount += 1;
                }
            }
            else {
                if (value) {
                    this._checkedCount += 1;
                }
                else {
                    this._checkedCount -= 1;
                }
            }
            this._states.set(obj, value);
            this._onDidChange.fire(obj);
        }
    }
    exports.CheckedStates = CheckedStates;
    class BulkTextEdit {
        constructor(parent, textEdit) {
            this.parent = parent;
            this.textEdit = textEdit;
        }
    }
    exports.BulkTextEdit = BulkTextEdit;
    var BulkFileOperationType;
    (function (BulkFileOperationType) {
        BulkFileOperationType[BulkFileOperationType["TextEdit"] = 1] = "TextEdit";
        BulkFileOperationType[BulkFileOperationType["Create"] = 2] = "Create";
        BulkFileOperationType[BulkFileOperationType["Delete"] = 4] = "Delete";
        BulkFileOperationType[BulkFileOperationType["Rename"] = 8] = "Rename";
    })(BulkFileOperationType = exports.BulkFileOperationType || (exports.BulkFileOperationType = {}));
    class BulkFileOperation {
        constructor(uri, parent) {
            this.uri = uri;
            this.parent = parent;
            this.type = 0;
            this.textEdits = [];
            this.originalEdits = new Map();
        }
        addEdit(index, type, edit) {
            this.type |= type;
            this.originalEdits.set(index, edit);
            if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                this.textEdits.push(new BulkTextEdit(this, edit));
            }
            else if (type === 8 /* BulkFileOperationType.Rename */) {
                this.newUri = edit.newResource;
            }
        }
        needsConfirmation() {
            for (let [, edit] of this.originalEdits) {
                if (!this.parent.checked.isChecked(edit)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.BulkFileOperation = BulkFileOperation;
    class BulkCategory {
        constructor(metadata = BulkCategory._defaultMetadata) {
            this.metadata = metadata;
            this.operationByResource = new Map();
        }
        static keyOf(metadata) {
            return (metadata === null || metadata === void 0 ? void 0 : metadata.label) || '<default>';
        }
        get fileOperations() {
            return this.operationByResource.values();
        }
    }
    exports.BulkCategory = BulkCategory;
    BulkCategory._defaultMetadata = Object.freeze({
        label: (0, nls_1.localize)('default', "Other"),
        icon: codicons_1.Codicon.symbolFile,
        needsConfirmation: false
    });
    let BulkFileOperations = class BulkFileOperations {
        constructor(_bulkEdit, _fileService, instaService) {
            this._bulkEdit = _bulkEdit;
            this._fileService = _fileService;
            this.checked = new CheckedStates();
            this.fileOperations = [];
            this.categories = [];
            this.conflicts = instaService.createInstance(conflicts_1.ConflictDetector, _bulkEdit);
        }
        static async create(accessor, bulkEdit) {
            const result = accessor.get(instantiation_1.IInstantiationService).createInstance(BulkFileOperations, bulkEdit);
            return await result._init();
        }
        dispose() {
            this.checked.dispose();
            this.conflicts.dispose();
        }
        async _init() {
            var _a, _b, _c, _d, _e, _f;
            const operationByResource = new Map();
            const operationByCategory = new Map();
            const newToOldUri = new map_1.ResourceMap();
            for (let idx = 0; idx < this._bulkEdit.length; idx++) {
                const edit = this._bulkEdit[idx];
                let uri;
                let type;
                // store inital checked state
                this.checked.updateChecked(edit, !((_a = edit.metadata) === null || _a === void 0 ? void 0 : _a.needsConfirmation));
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    type = 1 /* BulkFileOperationType.TextEdit */;
                    uri = edit.resource;
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    if (edit.newResource && edit.oldResource) {
                        type = 8 /* BulkFileOperationType.Rename */;
                        uri = edit.oldResource;
                        if (((_b = edit.options) === null || _b === void 0 ? void 0 : _b.overwrite) === undefined && ((_c = edit.options) === null || _c === void 0 ? void 0 : _c.ignoreIfExists) && await this._fileService.exists(uri)) {
                            // noop -> "soft" rename to something that already exists
                            continue;
                        }
                        // map newResource onto oldResource so that text-edit appear for
                        // the same file element
                        newToOldUri.set(edit.newResource, uri);
                    }
                    else if (edit.oldResource) {
                        type = 4 /* BulkFileOperationType.Delete */;
                        uri = edit.oldResource;
                        if (((_d = edit.options) === null || _d === void 0 ? void 0 : _d.ignoreIfNotExists) && !await this._fileService.exists(uri)) {
                            // noop -> "soft" delete something that doesn't exist
                            continue;
                        }
                    }
                    else if (edit.newResource) {
                        type = 2 /* BulkFileOperationType.Create */;
                        uri = edit.newResource;
                        if (((_e = edit.options) === null || _e === void 0 ? void 0 : _e.overwrite) === undefined && ((_f = edit.options) === null || _f === void 0 ? void 0 : _f.ignoreIfExists) && await this._fileService.exists(uri)) {
                            // noop -> "soft" create something that already exists
                            continue;
                        }
                    }
                    else {
                        // invalid edit -> skip
                        continue;
                    }
                }
                else {
                    // unsupported edit
                    continue;
                }
                const insert = (uri, map) => {
                    let key = resources_1.extUri.getComparisonKey(uri, true);
                    let operation = map.get(key);
                    // rename
                    if (!operation && newToOldUri.has(uri)) {
                        uri = newToOldUri.get(uri);
                        key = resources_1.extUri.getComparisonKey(uri, true);
                        operation = map.get(key);
                    }
                    if (!operation) {
                        operation = new BulkFileOperation(uri, this);
                        map.set(key, operation);
                    }
                    operation.addEdit(idx, type, edit);
                };
                insert(uri, operationByResource);
                // insert into "this" category
                let key = BulkCategory.keyOf(edit.metadata);
                let category = operationByCategory.get(key);
                if (!category) {
                    category = new BulkCategory(edit.metadata);
                    operationByCategory.set(key, category);
                }
                insert(uri, category.operationByResource);
            }
            operationByResource.forEach(value => this.fileOperations.push(value));
            operationByCategory.forEach(value => this.categories.push(value));
            // "correct" invalid parent-check child states that is
            // unchecked file edits (rename, create, delete) uncheck
            // all edits for a file, e.g no text change without rename
            for (let file of this.fileOperations) {
                if (file.type !== 1 /* BulkFileOperationType.TextEdit */) {
                    let checked = true;
                    for (const edit of file.originalEdits.values()) {
                        if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                            checked = checked && this.checked.isChecked(edit);
                        }
                    }
                    if (!checked) {
                        for (const edit of file.originalEdits.values()) {
                            this.checked.updateChecked(edit, checked);
                        }
                    }
                }
            }
            // sort (once) categories atop which have unconfirmed edits
            this.categories.sort((a, b) => {
                if (a.metadata.needsConfirmation === b.metadata.needsConfirmation) {
                    return a.metadata.label.localeCompare(b.metadata.label);
                }
                else if (a.metadata.needsConfirmation) {
                    return -1;
                }
                else {
                    return 1;
                }
            });
            return this;
        }
        getWorkspaceEdit() {
            const result = [];
            let allAccepted = true;
            for (let i = 0; i < this._bulkEdit.length; i++) {
                const edit = this._bulkEdit[i];
                if (this.checked.isChecked(edit)) {
                    result[i] = edit;
                    continue;
                }
                allAccepted = false;
            }
            if (allAccepted) {
                return this._bulkEdit;
            }
            // not all edits have been accepted
            (0, arrays_1.coalesceInPlace)(result);
            return result;
        }
        getFileEdits(uri) {
            for (let file of this.fileOperations) {
                if (file.uri.toString() === uri.toString()) {
                    const result = [];
                    let ignoreAll = false;
                    for (const edit of file.originalEdits.values()) {
                        if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                            if (this.checked.isChecked(edit)) {
                                result.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.textEdit.range), edit.textEdit.text));
                            }
                        }
                        else if (!this.checked.isChecked(edit)) {
                            // UNCHECKED WorkspaceFileEdit disables all text edits
                            ignoreAll = true;
                        }
                    }
                    if (ignoreAll) {
                        return [];
                    }
                    return result.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                }
            }
            return [];
        }
        getUriOfEdit(edit) {
            for (let file of this.fileOperations) {
                for (const value of file.originalEdits.values()) {
                    if (value === edit) {
                        return file.uri;
                    }
                }
            }
            throw new Error('invalid edit');
        }
    };
    BulkFileOperations = __decorate([
        __param(1, files_1.IFileService),
        __param(2, instantiation_1.IInstantiationService)
    ], BulkFileOperations);
    exports.BulkFileOperations = BulkFileOperations;
    let BulkEditPreviewProvider = class BulkEditPreviewProvider {
        constructor(_operations, _languageService, _modelService, _textModelResolverService) {
            this._operations = _operations;
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._textModelResolverService = _textModelResolverService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._modelPreviewEdits = new Map();
            this._instanceId = (0, uuid_1.generateUuid)();
            this._disposables.add(this._textModelResolverService.registerTextModelContentProvider(BulkEditPreviewProvider.Schema, this));
            this._ready = this._init();
        }
        static fromPreviewUri(uri) {
            return uri_1.URI.parse(uri.query);
        }
        dispose() {
            this._disposables.dispose();
        }
        asPreviewUri(uri) {
            return uri_1.URI.from({ scheme: BulkEditPreviewProvider.Schema, authority: this._instanceId, path: uri.path, query: uri.toString() });
        }
        async _init() {
            for (let operation of this._operations.fileOperations) {
                await this._applyTextEditsToPreviewModel(operation.uri);
            }
            this._disposables.add(this._operations.checked.onDidChange(e => {
                const uri = this._operations.getUriOfEdit(e);
                this._applyTextEditsToPreviewModel(uri);
            }));
        }
        async _applyTextEditsToPreviewModel(uri) {
            const model = await this._getOrCreatePreviewModel(uri);
            // undo edits that have been done before
            let undoEdits = this._modelPreviewEdits.get(model.id);
            if (undoEdits) {
                model.applyEdits(undoEdits);
            }
            // apply new edits and keep (future) undo edits
            const newEdits = this._operations.getFileEdits(uri);
            const newUndoEdits = model.applyEdits(newEdits, true);
            this._modelPreviewEdits.set(model.id, newUndoEdits);
        }
        async _getOrCreatePreviewModel(uri) {
            const previewUri = this.asPreviewUri(uri);
            let model = this._modelService.getModel(previewUri);
            if (!model) {
                try {
                    // try: copy existing
                    const ref = await this._textModelResolverService.createModelReference(uri);
                    const sourceModel = ref.object.textEditorModel;
                    model = this._modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(sourceModel.createSnapshot()), this._languageService.createById(sourceModel.getLanguageId()), previewUri);
                    ref.dispose();
                }
                catch (_a) {
                    // create NEW model
                    model = this._modelService.createModel('', this._languageService.createByFilepathOrFirstLine(previewUri), previewUri);
                }
                // this is a little weird but otherwise editors and other cusomers
                // will dispose my models before they should be disposed...
                // And all of this is off the eventloop to prevent endless recursion
                queueMicrotask(async () => {
                    this._disposables.add(await this._textModelResolverService.createModelReference(model.uri));
                });
            }
            return model;
        }
        async provideTextContent(previewUri) {
            if (previewUri.toString() === BulkEditPreviewProvider.emptyPreview.toString()) {
                return this._modelService.createModel('', null, previewUri);
            }
            await this._ready;
            return this._modelService.getModel(previewUri);
        }
    };
    BulkEditPreviewProvider.Schema = 'vscode-bulkeditpreview';
    BulkEditPreviewProvider.emptyPreview = uri_1.URI.from({ scheme: BulkEditPreviewProvider.Schema, fragment: 'empty' });
    BulkEditPreviewProvider = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, resolverService_1.ITextModelService)
    ], BulkEditPreviewProvider);
    exports.BulkEditPreviewProvider = BulkEditPreviewProvider;
});
//# sourceMappingURL=bulkEditPreview.js.map