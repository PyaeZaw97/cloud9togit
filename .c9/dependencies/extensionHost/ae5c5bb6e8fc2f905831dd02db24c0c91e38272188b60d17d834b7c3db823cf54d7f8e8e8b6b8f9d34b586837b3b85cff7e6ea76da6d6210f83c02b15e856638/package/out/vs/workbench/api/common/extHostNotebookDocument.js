/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, network_1, uri_1, extHostTypeConverters, extHostTypes_1, notebookCommon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookDocument = exports.ExtHostCell = void 0;
    class RawContentChangeEvent {
        constructor(start, deletedCount, deletedItems, items) {
            this.start = start;
            this.deletedCount = deletedCount;
            this.deletedItems = deletedItems;
            this.items = items;
        }
        asApiEvent() {
            return {
                range: new extHostTypes_1.NotebookRange(this.start, this.start + this.deletedCount),
                addedCells: this.items.map(cell => cell.apiCell),
                removedCells: this.deletedItems,
            };
        }
    }
    class ExtHostCell {
        constructor(notebook, _extHostDocument, _cellData) {
            var _a, _b, _c;
            this.notebook = notebook;
            this._extHostDocument = _extHostDocument;
            this._cellData = _cellData;
            this.handle = _cellData.handle;
            this.uri = uri_1.URI.revive(_cellData.uri);
            this.cellKind = _cellData.cellKind;
            this._outputs = _cellData.outputs.map(extHostTypeConverters.NotebookCellOutput.to);
            this._internalMetadata = (_a = _cellData.internalMetadata) !== null && _a !== void 0 ? _a : {};
            this._metadata = Object.freeze((_b = _cellData.metadata) !== null && _b !== void 0 ? _b : {});
            this._previousResult = Object.freeze(extHostTypeConverters.NotebookCellExecutionSummary.to((_c = _cellData.internalMetadata) !== null && _c !== void 0 ? _c : {}));
        }
        static asModelAddData(notebook, cell) {
            return {
                EOL: cell.eol,
                lines: cell.source,
                languageId: cell.language,
                uri: cell.uri,
                isDirty: false,
                versionId: 1,
                notebook
            };
        }
        get internalMetadata() {
            return this._internalMetadata;
        }
        get apiCell() {
            if (!this._apiCell) {
                const that = this;
                const data = this._extHostDocument.getDocument(this.uri);
                if (!data) {
                    throw new Error(`MISSING extHostDocument for notebook cell: ${this.uri}`);
                }
                const apiCell = {
                    get index() { return that.notebook.getCellIndex(that); },
                    notebook: that.notebook.apiNotebook,
                    kind: extHostTypeConverters.NotebookCellKind.to(this._cellData.cellKind),
                    document: data.document,
                    get mime() { return that._mime; },
                    set mime(value) { that._mime = value; },
                    get outputs() { return that._outputs.slice(0); },
                    get metadata() { return that._metadata; },
                    get executionSummary() { return that._previousResult; }
                };
                this._apiCell = Object.freeze(apiCell);
            }
            return this._apiCell;
        }
        setOutputs(newOutputs) {
            this._outputs = newOutputs.map(extHostTypeConverters.NotebookCellOutput.to);
        }
        setOutputItems(outputId, append, newOutputItems) {
            const newItems = newOutputItems.map(extHostTypeConverters.NotebookCellOutputItem.to);
            const output = this._outputs.find(op => op.id === outputId);
            if (output) {
                if (!append) {
                    output.items.length = 0;
                }
                output.items.push(...newItems);
            }
        }
        setMetadata(newMetadata) {
            this._metadata = Object.freeze(newMetadata);
        }
        setInternalMetadata(newInternalMetadata) {
            this._internalMetadata = newInternalMetadata;
            this._previousResult = Object.freeze(extHostTypeConverters.NotebookCellExecutionSummary.to(newInternalMetadata));
        }
        setMime(newMime) {
        }
    }
    exports.ExtHostCell = ExtHostCell;
    class ExtHostNotebookDocument {
        constructor(_proxy, _textDocumentsAndEditors, _textDocuments, uri, data) {
            var _a;
            this._proxy = _proxy;
            this._textDocumentsAndEditors = _textDocumentsAndEditors;
            this._textDocuments = _textDocuments;
            this.uri = uri;
            this.handle = ExtHostNotebookDocument._handlePool++;
            this._cells = [];
            this._versionId = 0;
            this._isDirty = false;
            this._disposed = false;
            this._notebookType = data.viewType;
            this._metadata = Object.freeze((_a = data.metadata) !== null && _a !== void 0 ? _a : Object.create(null));
            this._spliceNotebookCells([[0, 0, data.cells]], true /* init -> no event*/, undefined);
            this._versionId = data.versionId;
        }
        dispose() {
            this._disposed = true;
        }
        get apiNotebook() {
            if (!this._notebook) {
                const that = this;
                const apiObject = {
                    get uri() { return that.uri; },
                    get version() { return that._versionId; },
                    get notebookType() { return that._notebookType; },
                    get isDirty() { return that._isDirty; },
                    get isUntitled() { return that.uri.scheme === network_1.Schemas.untitled; },
                    get isClosed() { return that._disposed; },
                    get metadata() { return that._metadata; },
                    get cellCount() { return that._cells.length; },
                    cellAt(index) {
                        index = that._validateIndex(index);
                        return that._cells[index].apiCell;
                    },
                    getCells(range) {
                        const cells = range ? that._getCells(range) : that._cells;
                        return cells.map(cell => cell.apiCell);
                    },
                    save() {
                        return that._save();
                    }
                };
                this._notebook = Object.freeze(apiObject);
            }
            return this._notebook;
        }
        updateBackup(backup) {
            var _a;
            (_a = this._backup) === null || _a === void 0 ? void 0 : _a.delete();
            this._backup = backup;
        }
        disposeBackup() {
            var _a;
            (_a = this._backup) === null || _a === void 0 ? void 0 : _a.delete();
            this._backup = undefined;
        }
        acceptDocumentPropertiesChanged(data) {
            if (data.metadata) {
                this._metadata = Object.freeze(Object.assign(Object.assign({}, this._metadata), data.metadata));
            }
        }
        acceptDirty(isDirty) {
            this._isDirty = isDirty;
        }
        acceptModelChanged(event, isDirty, newMetadata) {
            this._versionId = event.versionId;
            this._isDirty = isDirty;
            this.acceptDocumentPropertiesChanged({ metadata: newMetadata });
            const result = {
                notebook: this.apiNotebook,
                metadata: newMetadata,
                cellChanges: [],
                contentChanges: [],
            };
            const relaxedCellChanges = [];
            // -- apply change and populate content changes
            for (const rawEvent of event.rawEvents) {
                if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ModelChange) {
                    this._spliceNotebookCells(rawEvent.changes, false, result.contentChanges);
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.Move) {
                    this._moveCell(rawEvent.index, rawEvent.newIdx, result.contentChanges);
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.Output) {
                    this._setCellOutputs(rawEvent.index, rawEvent.outputs);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, outputs: this._cells[rawEvent.index].apiCell.outputs });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.OutputItem) {
                    this._setCellOutputItems(rawEvent.index, rawEvent.outputId, rawEvent.append, rawEvent.outputItems);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, outputs: this._cells[rawEvent.index].apiCell.outputs });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellLanguage) {
                    this._changeCellLanguage(rawEvent.index, rawEvent.language);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, document: this._cells[rawEvent.index].apiCell.document });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellContent) {
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, document: this._cells[rawEvent.index].apiCell.document });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellMime) {
                    this._changeCellMime(rawEvent.index, rawEvent.mime);
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellMetadata) {
                    this._changeCellMetadata(rawEvent.index, rawEvent.metadata);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, metadata: this._cells[rawEvent.index].apiCell.metadata });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellInternalMetadata) {
                    this._changeCellInternalMetadata(rawEvent.index, rawEvent.internalMetadata);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, executionSummary: this._cells[rawEvent.index].apiCell.executionSummary });
                }
            }
            // -- compact cellChanges
            const map = new Map();
            for (let i = 0; i < relaxedCellChanges.length; i++) {
                const relaxedCellChange = relaxedCellChanges[i];
                const existing = map.get(relaxedCellChange.cell);
                if (existing === undefined) {
                    const newLen = result.cellChanges.push(Object.assign({ document: undefined, executionSummary: undefined, metadata: undefined, outputs: undefined }, relaxedCellChange));
                    map.set(relaxedCellChange.cell, newLen - 1);
                }
                else {
                    result.cellChanges[existing] = Object.assign(Object.assign({}, result.cellChanges[existing]), relaxedCellChange);
                }
            }
            // Freeze event properties so handlers cannot accidentally modify them
            Object.freeze(result);
            Object.freeze(result.cellChanges);
            Object.freeze(result.contentChanges);
            return result;
        }
        _validateIndex(index) {
            index = index | 0;
            if (index < 0) {
                return 0;
            }
            else if (index >= this._cells.length) {
                return this._cells.length - 1;
            }
            else {
                return index;
            }
        }
        _validateRange(range) {
            let start = range.start | 0;
            let end = range.end | 0;
            if (start < 0) {
                start = 0;
            }
            if (end > this._cells.length) {
                end = this._cells.length;
            }
            return range.with({ start, end });
        }
        _getCells(range) {
            range = this._validateRange(range);
            const result = [];
            for (let i = range.start; i < range.end; i++) {
                result.push(this._cells[i]);
            }
            return result;
        }
        async _save() {
            if (this._disposed) {
                return Promise.reject(new Error('Notebook has been closed'));
            }
            return this._proxy.$trySaveNotebook(this.uri);
        }
        _spliceNotebookCells(splices, initialization, bucket) {
            if (this._disposed) {
                return;
            }
            const contentChangeEvents = [];
            const addedCellDocuments = [];
            const removedCellDocuments = [];
            splices.reverse().forEach(splice => {
                const cellDtos = splice[2];
                const newCells = cellDtos.map(cell => {
                    const extCell = new ExtHostCell(this, this._textDocumentsAndEditors, cell);
                    if (!initialization) {
                        addedCellDocuments.push(ExtHostCell.asModelAddData(this.apiNotebook, cell));
                    }
                    return extCell;
                });
                const changeEvent = new RawContentChangeEvent(splice[0], splice[1], [], newCells);
                const deletedItems = this._cells.splice(splice[0], splice[1], ...newCells);
                for (const cell of deletedItems) {
                    removedCellDocuments.push(cell.uri);
                    changeEvent.deletedItems.push(cell.apiCell);
                }
                contentChangeEvents.push(changeEvent);
            });
            this._textDocumentsAndEditors.acceptDocumentsAndEditorsDelta({
                addedDocuments: addedCellDocuments,
                removedDocuments: removedCellDocuments
            });
            if (bucket) {
                for (let changeEvent of contentChangeEvents) {
                    bucket.push(changeEvent.asApiEvent());
                }
            }
        }
        _moveCell(index, newIdx, bucket) {
            const cells = this._cells.splice(index, 1);
            this._cells.splice(newIdx, 0, ...cells);
            const changes = [
                new RawContentChangeEvent(index, 1, cells.map(c => c.apiCell), []),
                new RawContentChangeEvent(newIdx, 0, [], cells)
            ];
            for (const change of changes) {
                bucket.push(change.asApiEvent());
            }
        }
        _setCellOutputs(index, outputs) {
            const cell = this._cells[index];
            cell.setOutputs(outputs);
        }
        _setCellOutputItems(index, outputId, append, outputItems) {
            const cell = this._cells[index];
            cell.setOutputItems(outputId, append, outputItems);
        }
        _changeCellLanguage(index, newLanguageId) {
            const cell = this._cells[index];
            if (cell.apiCell.document.languageId !== newLanguageId) {
                this._textDocuments.$acceptModelLanguageChanged(cell.uri, newLanguageId);
            }
        }
        _changeCellMime(index, newMime) {
            const cell = this._cells[index];
            cell.apiCell.mime = newMime;
        }
        _changeCellMetadata(index, newMetadata) {
            const cell = this._cells[index];
            cell.setMetadata(newMetadata);
        }
        _changeCellInternalMetadata(index, newInternalMetadata) {
            const cell = this._cells[index];
            cell.setInternalMetadata(newInternalMetadata);
        }
        getCellFromApiCell(apiCell) {
            return this._cells.find(cell => cell.apiCell === apiCell);
        }
        getCellFromIndex(index) {
            return this._cells[index];
        }
        getCell(cellHandle) {
            return this._cells.find(cell => cell.handle === cellHandle);
        }
        getCellIndex(cell) {
            return this._cells.indexOf(cell);
        }
    }
    exports.ExtHostNotebookDocument = ExtHostNotebookDocument;
    ExtHostNotebookDocument._handlePool = 0;
});
//# sourceMappingURL=extHostNotebookDocument.js.map