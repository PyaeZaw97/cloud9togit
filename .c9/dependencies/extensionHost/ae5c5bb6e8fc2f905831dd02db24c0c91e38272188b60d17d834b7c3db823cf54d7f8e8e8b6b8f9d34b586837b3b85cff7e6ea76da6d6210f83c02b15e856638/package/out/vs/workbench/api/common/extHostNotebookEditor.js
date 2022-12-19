/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/errors"], function (require, exports, extHostTypes, extHostConverter, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookEditor = void 0;
    class NotebookEditorCellEditBuilder {
        constructor(documentVersionId) {
            this._finalized = false;
            this._collectedEdits = [];
            this._documentVersionId = documentVersionId;
        }
        finalize() {
            this._finalized = true;
            return {
                documentVersionId: this._documentVersionId,
                cellEdits: this._collectedEdits
            };
        }
        _throwIfFinalized() {
            if (this._finalized) {
                throw new Error('Edit is only valid while callback runs');
            }
        }
        replaceMetadata(value) {
            this._throwIfFinalized();
            this._collectedEdits.push({
                editType: 5 /* CellEditType.DocumentMetadata */,
                metadata: value
            });
        }
        replaceCellMetadata(index, metadata) {
            this._throwIfFinalized();
            this._collectedEdits.push({
                editType: 8 /* CellEditType.PartialMetadata */,
                index,
                metadata
            });
        }
        replaceCells(from, to, cells) {
            this._throwIfFinalized();
            if (from === to && cells.length === 0) {
                return;
            }
            this._collectedEdits.push({
                editType: 1 /* CellEditType.Replace */,
                index: from,
                count: to - from,
                cells: cells.map(extHostConverter.NotebookCellData.from)
            });
        }
    }
    class ExtHostNotebookEditor {
        constructor(id, _proxy, notebookData, visibleRanges, selections, viewColumn) {
            this.id = id;
            this._proxy = _proxy;
            this.notebookData = notebookData;
            this._selections = [];
            this._visibleRanges = [];
            this._visible = false;
            this._hasDecorationsForKey = new Set();
            this._selections = selections;
            this._visibleRanges = visibleRanges;
            this._viewColumn = viewColumn;
        }
        get apiEditor() {
            if (!this._editor) {
                const that = this;
                this._editor = {
                    get document() {
                        return that.notebookData.apiNotebook;
                    },
                    get selections() {
                        return that._selections;
                    },
                    set selections(value) {
                        if (!Array.isArray(value) || !value.every(extHostTypes.NotebookRange.isNotebookRange)) {
                            throw (0, errors_1.illegalArgument)('selections');
                        }
                        that._selections = value;
                        that._trySetSelections(value);
                    },
                    get visibleRanges() {
                        return that._visibleRanges;
                    },
                    revealRange(range, revealType) {
                        that._proxy.$tryRevealRange(that.id, extHostConverter.NotebookRange.from(range), revealType !== null && revealType !== void 0 ? revealType : extHostTypes.NotebookEditorRevealType.Default);
                    },
                    get viewColumn() {
                        return that._viewColumn;
                    },
                    edit(callback) {
                        const edit = new NotebookEditorCellEditBuilder(this.document.version);
                        callback(edit);
                        return that._applyEdit(edit.finalize());
                    },
                    setDecorations(decorationType, range) {
                        return that.setDecorations(decorationType, range);
                    }
                };
                ExtHostNotebookEditor.apiEditorsToExtHost.set(this._editor, this);
            }
            return this._editor;
        }
        get visible() {
            return this._visible;
        }
        _acceptVisibility(value) {
            this._visible = value;
        }
        _acceptVisibleRanges(value) {
            this._visibleRanges = value;
        }
        _acceptSelections(selections) {
            this._selections = selections;
        }
        _trySetSelections(value) {
            this._proxy.$trySetSelections(this.id, value.map(extHostConverter.NotebookRange.from));
        }
        _acceptViewColumn(value) {
            this._viewColumn = value;
        }
        _applyEdit(editData) {
            // return when there is nothing to do
            if (editData.cellEdits.length === 0) {
                return Promise.resolve(true);
            }
            const compressedEdits = [];
            let compressedEditsIndex = -1;
            for (let i = 0; i < editData.cellEdits.length; i++) {
                if (compressedEditsIndex < 0) {
                    compressedEdits.push(editData.cellEdits[i]);
                    compressedEditsIndex++;
                    continue;
                }
                const prevIndex = compressedEditsIndex;
                const prev = compressedEdits[prevIndex];
                const edit = editData.cellEdits[i];
                if (prev.editType === 1 /* CellEditType.Replace */ && edit.editType === 1 /* CellEditType.Replace */) {
                    if (prev.index === edit.index) {
                        prev.cells.push(...editData.cellEdits[i].cells);
                        prev.count += editData.cellEdits[i].count;
                        continue;
                    }
                }
                compressedEdits.push(editData.cellEdits[i]);
                compressedEditsIndex++;
            }
            return this._proxy.$tryApplyEdits(this.id, editData.documentVersionId, compressedEdits);
        }
        setDecorations(decorationType, range) {
            if (range.isEmpty && !this._hasDecorationsForKey.has(decorationType.key)) {
                // avoid no-op call to the renderer
                return;
            }
            if (range.isEmpty) {
                this._hasDecorationsForKey.delete(decorationType.key);
            }
            else {
                this._hasDecorationsForKey.add(decorationType.key);
            }
            return this._proxy.$trySetDecorations(this.id, extHostConverter.NotebookRange.from(range), decorationType.key);
        }
    }
    exports.ExtHostNotebookEditor = ExtHostNotebookEditor;
    ExtHostNotebookEditor.apiEditorsToExtHost = new WeakMap();
});
//# sourceMappingURL=extHostNotebookEditor.js.map