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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService"], function (require, exports, arrays_1, strings_1, bulkEditService_1, notebookEditorModelResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkCellEdits = exports.ResourceNotebookCellEdit = void 0;
    class ResourceNotebookCellEdit extends bulkEditService_1.ResourceEdit {
        constructor(resource, cellEdit, versionId, metadata) {
            super(metadata);
            this.resource = resource;
            this.cellEdit = cellEdit;
            this.versionId = versionId;
        }
    }
    exports.ResourceNotebookCellEdit = ResourceNotebookCellEdit;
    let BulkCellEdits = class BulkCellEdits {
        constructor(_undoRedoGroup, undoRedoSource, _progress, _token, _edits, _notebookModelService) {
            this._undoRedoGroup = _undoRedoGroup;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._notebookModelService = _notebookModelService;
        }
        async apply() {
            const resources = [];
            const editsByNotebook = (0, arrays_1.groupBy)(this._edits, (a, b) => (0, strings_1.compare)(a.resource.toString(), b.resource.toString()));
            for (let group of editsByNotebook) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                const [first] = group;
                const ref = await this._notebookModelService.resolve(first.resource);
                // check state
                if (typeof first.versionId === 'number' && ref.object.notebook.versionId !== first.versionId) {
                    ref.dispose();
                    throw new Error(`Notebook '${first.resource}' has changed in the meantime`);
                }
                // apply edits
                const edits = group.map(entry => entry.cellEdit);
                ref.object.notebook.applyEdits(edits, true, undefined, () => undefined, this._undoRedoGroup, true);
                ref.dispose();
                this._progress.report(undefined);
                resources.push(first.resource);
            }
            return resources;
        }
    };
    BulkCellEdits = __decorate([
        __param(5, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], BulkCellEdits);
    exports.BulkCellEdits = BulkCellEdits;
});
//# sourceMappingURL=bulkCellEdits.js.map