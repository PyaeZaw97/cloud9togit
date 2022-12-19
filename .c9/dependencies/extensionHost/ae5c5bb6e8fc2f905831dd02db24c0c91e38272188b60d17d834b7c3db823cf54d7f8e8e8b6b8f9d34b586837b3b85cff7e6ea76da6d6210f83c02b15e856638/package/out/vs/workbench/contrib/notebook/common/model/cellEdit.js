/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellMetadataEdit = exports.SpliceCellsEdit = exports.MoveCellEdit = void 0;
    class MoveCellEdit {
        constructor(resource, fromIndex, length, toIndex, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.fromIndex = fromIndex;
            this.length = length;
            this.toIndex = toIndex;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.label = 'Move Cell';
            this.code = 'undoredo.notebooks.moveCell';
        }
        undo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.toIndex, this.length, this.fromIndex, this.endSelections, this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.fromIndex, this.length, this.toIndex, this.beforedSelections, this.endSelections);
        }
    }
    exports.MoveCellEdit = MoveCellEdit;
    class SpliceCellsEdit {
        constructor(resource, diffs, editingDelegate, beforeHandles, endHandles) {
            this.resource = resource;
            this.diffs = diffs;
            this.editingDelegate = editingDelegate;
            this.beforeHandles = beforeHandles;
            this.endHandles = endHandles;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.label = 'Insert Cell';
            this.code = 'undoredo.notebooks.insertCell';
        }
        undo() {
            if (!this.editingDelegate.replaceCell) {
                throw new Error('Notebook Replace Cell not implemented for Undo/Redo');
            }
            this.diffs.forEach(diff => {
                this.editingDelegate.replaceCell(diff[0], diff[2].length, diff[1], this.beforeHandles);
            });
        }
        redo() {
            if (!this.editingDelegate.replaceCell) {
                throw new Error('Notebook Replace Cell not implemented for Undo/Redo');
            }
            this.diffs.reverse().forEach(diff => {
                this.editingDelegate.replaceCell(diff[0], diff[1].length, diff[2], this.endHandles);
            });
        }
    }
    exports.SpliceCellsEdit = SpliceCellsEdit;
    class CellMetadataEdit {
        constructor(resource, index, oldMetadata, newMetadata, editingDelegate) {
            this.resource = resource;
            this.index = index;
            this.oldMetadata = oldMetadata;
            this.newMetadata = newMetadata;
            this.editingDelegate = editingDelegate;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.label = 'Update Cell Metadata';
            this.code = 'undoredo.notebooks.updateCellMetadata';
        }
        undo() {
            if (!this.editingDelegate.updateCellMetadata) {
                return;
            }
            this.editingDelegate.updateCellMetadata(this.index, this.oldMetadata);
        }
        redo() {
            if (!this.editingDelegate.updateCellMetadata) {
                return;
            }
            this.editingDelegate.updateCellMetadata(this.index, this.newMetadata);
        }
    }
    exports.CellMetadataEdit = CellMetadataEdit;
});
//# sourceMappingURL=cellEdit.js.map