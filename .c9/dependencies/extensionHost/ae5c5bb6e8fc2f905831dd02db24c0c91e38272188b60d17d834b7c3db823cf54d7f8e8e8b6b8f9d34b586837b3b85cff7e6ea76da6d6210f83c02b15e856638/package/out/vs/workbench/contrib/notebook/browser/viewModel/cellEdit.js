/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, notebookCommon_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JoinCellEdit = void 0;
    class JoinCellEdit {
        constructor(resource, index, direction, cell, selections, inverseRange, insertContent, removedCell, editingDelegate) {
            this.resource = resource;
            this.index = index;
            this.direction = direction;
            this.cell = cell;
            this.selections = selections;
            this.inverseRange = inverseRange;
            this.insertContent = insertContent;
            this.removedCell = removedCell;
            this.editingDelegate = editingDelegate;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.label = 'Join Cell';
            this.code = 'undoredo.notebooks.joinCell';
            this._deletedRawCell = this.removedCell.model;
        }
        async undo() {
            var _a;
            if (!this.editingDelegate.insertCell || !this.editingDelegate.createCellViewModel) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            (_a = this.cell.textModel) === null || _a === void 0 ? void 0 : _a.applyEdits([
                { range: this.inverseRange, text: '' }
            ]);
            this.cell.setSelections(this.selections);
            const cell = this.editingDelegate.createCellViewModel(this._deletedRawCell);
            if (this.direction === 'above') {
                this.editingDelegate.insertCell(this.index, this._deletedRawCell, { kind: notebookCommon_1.SelectionStateType.Handle, primary: cell.handle, selections: [cell.handle] });
                cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
            else {
                this.editingDelegate.insertCell(this.index, cell.model, { kind: notebookCommon_1.SelectionStateType.Handle, primary: this.cell.handle, selections: [this.cell.handle] });
                this.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
        async redo() {
            var _a;
            if (!this.editingDelegate.deleteCell) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            (_a = this.cell.textModel) === null || _a === void 0 ? void 0 : _a.applyEdits([
                { range: this.inverseRange, text: this.insertContent }
            ]);
            this.editingDelegate.deleteCell(this.index, { kind: notebookCommon_1.SelectionStateType.Handle, primary: this.cell.handle, selections: [this.cell.handle] });
            this.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
        }
    }
    exports.JoinCellEdit = JoinCellEdit;
});
//# sourceMappingURL=cellEdit.js.map