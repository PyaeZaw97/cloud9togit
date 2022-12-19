/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/collections", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, collections_1, event_1, lifecycle_1, types_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVisibleCellObserver = void 0;
    class NotebookVisibleCellObserver extends lifecycle_1.Disposable {
        constructor(_notebookEditor) {
            super();
            this._notebookEditor = _notebookEditor;
            this._onDidChangeVisibleCells = this._register(new event_1.Emitter());
            this.onDidChangeVisibleCells = this._onDidChangeVisibleCells.event;
            this._viewModelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._visibleCells = [];
            this._register(this._notebookEditor.onDidChangeVisibleRanges(this._updateVisibleCells, this));
            this._register(this._notebookEditor.onDidChangeModel(this._onModelChange, this));
            this._updateVisibleCells();
        }
        get visibleCells() {
            return this._visibleCells;
        }
        _onModelChange() {
            this._viewModelDisposables.clear();
            if (this._notebookEditor.hasModel()) {
                this._viewModelDisposables.add(this._notebookEditor.onDidChangeViewCells(() => this.updateEverything()));
            }
            this.updateEverything();
        }
        updateEverything() {
            this._onDidChangeVisibleCells.fire({ added: [], removed: Array.from(this._visibleCells) });
            this._visibleCells = [];
            this._updateVisibleCells();
        }
        _updateVisibleCells() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const newVisibleCells = (0, notebookRange_1.cellRangesToIndexes)(this._notebookEditor.visibleRanges)
                .map(index => this._notebookEditor.cellAt(index))
                .filter(types_1.isDefined);
            const newVisibleHandles = new Set(newVisibleCells.map(cell => cell.handle));
            const oldVisibleHandles = new Set(this._visibleCells.map(cell => cell.handle));
            const diff = (0, collections_1.diffSets)(oldVisibleHandles, newVisibleHandles);
            const added = diff.added
                .map(handle => this._notebookEditor.getCellByHandle(handle))
                .filter(types_1.isDefined);
            const removed = diff.removed
                .map(handle => this._notebookEditor.getCellByHandle(handle))
                .filter(types_1.isDefined);
            this._visibleCells = newVisibleCells;
            this._onDidChangeVisibleCells.fire({
                added,
                removed
            });
        }
    }
    exports.NotebookVisibleCellObserver = NotebookVisibleCellObserver;
});
//# sourceMappingURL=notebookVisibleCellObserver.js.map