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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/common/model/cellEdit", "vs/base/common/diff/diff", "vs/base/common/hash", "vs/workbench/contrib/notebook/common/model/notebookCellOutputTextModel", "vs/editor/common/services/model", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/languages/language", "vs/editor/common/model/textModel", "vs/base/common/types"], function (require, exports, event_1, lifecycle_1, notebookCellTextModel_1, notebookCommon_1, undoRedo_1, cellEdit_1, diff_1, hash_1, notebookCellOutputTextModel_1, model_1, network_1, resources_1, language_1, textModel_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextModel = exports.NotebookEventEmitter = exports.NotebookOperationManager = void 0;
    class StackOperation {
        constructor(textModel, label, undoRedoGroup, _pauseableEmitter, _postUndoRedo, selectionState, beginAlternativeVersionId) {
            this.textModel = textModel;
            this.label = label;
            this.undoRedoGroup = undoRedoGroup;
            this._pauseableEmitter = _pauseableEmitter;
            this._postUndoRedo = _postUndoRedo;
            this.code = 'undoredo.notebooks.stackOperation';
            this._operations = [];
            this._beginSelectionState = undefined;
            this._resultSelectionState = undefined;
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this._beginSelectionState = selectionState;
            this._beginAlternativeVersionId = beginAlternativeVersionId;
            this._resultAlternativeVersionId = beginAlternativeVersionId;
        }
        get resources() {
            return [this.textModel.uri];
        }
        get isEmpty() {
            return this._operations.length === 0;
        }
        pushEndState(alternativeVersionId, selectionState) {
            this._resultAlternativeVersionId = alternativeVersionId;
            this._resultSelectionState = selectionState;
        }
        pushEditOperation(element, beginSelectionState, resultSelectionState) {
            var _a;
            if (this._operations.length === 0) {
                this._beginSelectionState = (_a = this._beginSelectionState) !== null && _a !== void 0 ? _a : beginSelectionState;
            }
            this._operations.push(element);
            this._resultSelectionState = resultSelectionState;
        }
        async undo() {
            this._pauseableEmitter.pause();
            for (let i = this._operations.length - 1; i >= 0; i--) {
                await this._operations[i].undo();
            }
            this._postUndoRedo(this._beginAlternativeVersionId);
            this._pauseableEmitter.fire({
                rawEvents: [],
                synchronous: undefined,
                versionId: this.textModel.versionId,
                endSelectionState: this._beginSelectionState
            });
            this._pauseableEmitter.resume();
        }
        async redo() {
            this._pauseableEmitter.pause();
            for (let i = 0; i < this._operations.length; i++) {
                await this._operations[i].redo();
            }
            this._postUndoRedo(this._resultAlternativeVersionId);
            this._pauseableEmitter.fire({
                rawEvents: [],
                synchronous: undefined,
                versionId: this.textModel.versionId,
                endSelectionState: this._resultSelectionState
            });
            this._pauseableEmitter.resume();
        }
    }
    class NotebookOperationManager {
        constructor(_textModel, _undoService, _pauseableEmitter, _postUndoRedo) {
            this._textModel = _textModel;
            this._undoService = _undoService;
            this._pauseableEmitter = _pauseableEmitter;
            this._postUndoRedo = _postUndoRedo;
            this._pendingStackOperation = null;
        }
        isUndoStackEmpty() {
            return this._pendingStackOperation === null || this._pendingStackOperation.isEmpty;
        }
        pushStackElement(label, selectionState, undoRedoGroup, alternativeVersionId) {
            if (this._pendingStackOperation) {
                this._pendingStackOperation.pushEndState(alternativeVersionId, selectionState);
                if (!this._pendingStackOperation.isEmpty) {
                    this._undoService.pushElement(this._pendingStackOperation, this._pendingStackOperation.undoRedoGroup);
                }
                this._pendingStackOperation = null;
                return;
            }
            this._pendingStackOperation = new StackOperation(this._textModel, label, undoRedoGroup, this._pauseableEmitter, this._postUndoRedo, selectionState, alternativeVersionId);
        }
        pushEditOperation(element, beginSelectionState, resultSelectionState) {
            if (this._pendingStackOperation) {
                this._pendingStackOperation.pushEditOperation(element, beginSelectionState, resultSelectionState);
                return;
            }
            this._undoService.pushElement(element);
        }
    }
    exports.NotebookOperationManager = NotebookOperationManager;
    class NotebookEventEmitter extends event_1.PauseableEmitter {
        isDirtyEvent() {
            for (const e of this._eventQueue) {
                for (let i = 0; i < e.rawEvents.length; i++) {
                    if (!e.rawEvents[i].transient) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
    exports.NotebookEventEmitter = NotebookEventEmitter;
    let NotebookTextModel = class NotebookTextModel extends lifecycle_1.Disposable {
        constructor(viewType, uri, cells, metadata, options, _undoService, _modelService, _languageService) {
            super();
            this.viewType = viewType;
            this.uri = uri;
            this._undoService = _undoService;
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._isDisposed = false;
            this._onWillDispose = this._register(new event_1.Emitter());
            this._onWillAddRemoveCells = this._register(new event_1.Emitter());
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.onWillAddRemoveCells = this._onWillAddRemoveCells.event;
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._cellhandlePool = 0;
            this._cellListeners = new Map();
            this._cells = [];
            this.metadata = {};
            this.transientOptions = { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false };
            this._versionId = 0;
            /**
             * This alternative id is only for non-cell-content changes.
             */
            this._notebookSpecificAlternativeId = 0;
            /**
             * Unlike, versionId, this can go down (via undo) or go to previous values (via redo)
             */
            this._alternativeVersionId = '1';
            this.transientOptions = options;
            this.metadata = metadata;
            this._initialize(cells);
            const maybeUpdateCellTextModel = (textModel) => {
                if (textModel.uri.scheme === network_1.Schemas.vscodeNotebookCell && textModel instanceof textModel_1.TextModel) {
                    const cellUri = notebookCommon_1.CellUri.parse(textModel.uri);
                    if (cellUri && (0, resources_1.isEqual)(cellUri.notebook, this.uri)) {
                        const cellIdx = this._getCellIndexByHandle(cellUri.handle);
                        if (cellIdx >= 0) {
                            const cell = this.cells[cellIdx];
                            if (cell) {
                                cell.textModel = textModel;
                            }
                        }
                    }
                }
            };
            this._register(_modelService.onModelAdded(e => maybeUpdateCellTextModel(e)));
            this._pauseableEmitter = new NotebookEventEmitter({
                merge: (events) => {
                    const first = events[0];
                    const rawEvents = first.rawEvents;
                    let versionId = first.versionId;
                    let endSelectionState = first.endSelectionState;
                    let synchronous = first.synchronous;
                    for (let i = 1; i < events.length; i++) {
                        rawEvents.push(...events[i].rawEvents);
                        versionId = events[i].versionId;
                        endSelectionState = events[i].endSelectionState !== undefined ? events[i].endSelectionState : endSelectionState;
                        synchronous = events[i].synchronous !== undefined ? events[i].synchronous : synchronous;
                    }
                    return { rawEvents, versionId, endSelectionState, synchronous };
                }
            });
            this._register(this._pauseableEmitter.event(e => {
                if (e.rawEvents.length) {
                    this._onDidChangeContent.fire(e);
                }
            }));
            this._operationManager = new NotebookOperationManager(this, this._undoService, this._pauseableEmitter, (alternativeVersionId) => {
                this._increaseVersionId(true);
                this._overwriteAlternativeVersionId(alternativeVersionId);
            });
        }
        get length() {
            return this._cells.length;
        }
        get cells() {
            return this._cells;
        }
        get versionId() {
            return this._versionId;
        }
        get alternativeVersionId() {
            return this._alternativeVersionId;
        }
        setCellCollapseDefault(collapseConfig) {
            this._defaultCollapseConfig = collapseConfig;
        }
        _initialize(cells, triggerDirty) {
            this._cells = [];
            this._versionId = 0;
            this._notebookSpecificAlternativeId = 0;
            const mainCells = cells.map(cell => {
                const cellHandle = this._cellhandlePool++;
                const cellUri = notebookCommon_1.CellUri.generate(this.uri, cellHandle);
                const collapseState = this._getDefaultCollapseState(cell);
                return new notebookCellTextModel_1.NotebookCellTextModel(cellUri, cellHandle, cell.source, cell.language, cell.mime, cell.cellKind, cell.outputs, cell.metadata, cell.internalMetadata, collapseState, this.transientOptions, this._languageService);
            });
            for (let i = 0; i < mainCells.length; i++) {
                const dirtyStateListener = mainCells[i].onDidChangeContent((e) => {
                    this._bindCellContentHandler(mainCells[i], e);
                });
                this._cellListeners.set(mainCells[i].handle, dirtyStateListener);
            }
            this._cells.splice(0, 0, ...mainCells);
            this._alternativeVersionId = this._generateAlternativeId();
            if (triggerDirty) {
                this._pauseableEmitter.fire({
                    rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.Unknown, transient: false }],
                    versionId: this.versionId,
                    synchronous: true,
                    endSelectionState: undefined
                });
            }
        }
        _bindCellContentHandler(cell, e) {
            this._increaseVersionId(e === 'content');
            switch (e) {
                case 'content':
                    this._pauseableEmitter.fire({
                        rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellContent, index: this._getCellIndexByHandle(cell.handle), transient: false }],
                        versionId: this.versionId,
                        synchronous: true,
                        endSelectionState: undefined
                    });
                    break;
                case 'language':
                    this._pauseableEmitter.fire({
                        rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage, index: this._getCellIndexByHandle(cell.handle), language: cell.language, transient: false }],
                        versionId: this.versionId,
                        synchronous: true,
                        endSelectionState: undefined
                    });
                    break;
                case 'mime':
                    this._pauseableEmitter.fire({
                        rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellMime, index: this._getCellIndexByHandle(cell.handle), mime: cell.mime, transient: false }],
                        versionId: this.versionId,
                        synchronous: true,
                        endSelectionState: undefined
                    });
                    break;
            }
        }
        _generateAlternativeId() {
            return `${this._notebookSpecificAlternativeId}_` + this.cells.map(cell => cell.handle + ',' + cell.alternativeId).join(';');
        }
        dispose() {
            if (this._isDisposed) {
                // NotebookEditorModel can be disposed twice, don't fire onWillDispose again
                return;
            }
            this._isDisposed = true;
            this._onWillDispose.fire();
            this._undoService.removeElements(this.uri);
            (0, lifecycle_1.dispose)(this._cellListeners.values());
            this._cellListeners.clear();
            (0, lifecycle_1.dispose)(this._cells);
            super.dispose();
        }
        pushStackElement(label, selectionState, undoRedoGroup) {
            this._operationManager.pushStackElement(label, selectionState, undoRedoGroup, this.alternativeVersionId);
        }
        _getCellIndexByHandle(handle) {
            return this.cells.findIndex(c => c.handle === handle);
        }
        _getCellIndexWithOutputIdHandleFromEdits(outputId, rawEdits) {
            const edit = rawEdits.find(e => 'outputs' in e && e.outputs.some(o => o.outputId === outputId));
            if (edit) {
                if ('index' in edit) {
                    return edit.index;
                }
                else if ('handle' in edit) {
                    const cellIndex = this._getCellIndexByHandle(edit.handle);
                    this._assertIndex(cellIndex);
                    return cellIndex;
                }
            }
            return -1;
        }
        _getCellIndexWithOutputIdHandle(outputId) {
            return this.cells.findIndex(c => !!c.outputs.find(o => o.outputId === outputId));
        }
        reset(cells, metadata, transientOptions) {
            this.transientOptions = transientOptions;
            this._cellhandlePool = 0;
            this.applyEdits([
                { editType: 1 /* CellEditType.Replace */, index: 0, count: this.cells.length, cells },
                { editType: 5 /* CellEditType.DocumentMetadata */, metadata }
            ], true, undefined, () => undefined, undefined, true);
        }
        applyEdits(rawEdits, synchronous, beginSelectionState, endSelectionsComputer, undoRedoGroup, computeUndoRedo) {
            this._pauseableEmitter.pause();
            this.pushStackElement('edit', beginSelectionState, undoRedoGroup);
            try {
                this._doApplyEdits(rawEdits, synchronous, computeUndoRedo);
                return true;
            }
            finally {
                // Update selection and versionId after applying edits.
                const endSelections = endSelectionsComputer();
                this._increaseVersionId(this._operationManager.isUndoStackEmpty() && !this._pauseableEmitter.isDirtyEvent());
                // Finalize undo element
                this.pushStackElement('edit', endSelections, undefined);
                // Broadcast changes
                this._pauseableEmitter.fire({ rawEvents: [], versionId: this.versionId, synchronous: synchronous, endSelectionState: endSelections });
                this._pauseableEmitter.resume();
            }
        }
        _doApplyEdits(rawEdits, synchronous, computeUndoRedo) {
            const editsWithDetails = rawEdits.map((edit, index) => {
                let cellIndex = -1;
                if ('index' in edit) {
                    cellIndex = edit.index;
                }
                else if ('handle' in edit) {
                    cellIndex = this._getCellIndexByHandle(edit.handle);
                    this._assertIndex(cellIndex);
                }
                else if ('outputId' in edit) {
                    cellIndex = this._getCellIndexWithOutputIdHandle(edit.outputId);
                    if (this._indexIsInvalid(cellIndex)) {
                        // The referenced output may have been created in this batch of edits
                        cellIndex = this._getCellIndexWithOutputIdHandleFromEdits(edit.outputId, rawEdits.slice(0, index));
                    }
                    if (this._indexIsInvalid(cellIndex)) {
                        // It's possible for an edit to refer to an output which was just cleared, ignore it without throwing
                        return null;
                    }
                }
                else if (edit.editType !== 5 /* CellEditType.DocumentMetadata */) {
                    throw new Error('Invalid cell edit');
                }
                return {
                    edit,
                    cellIndex,
                    end: (edit.editType === 5 /* CellEditType.DocumentMetadata */)
                        ? undefined
                        : (edit.editType === 1 /* CellEditType.Replace */ ? edit.index + edit.count : cellIndex),
                    originalIndex: index
                };
            }).filter(types_1.isDefined);
            // compress all edits which have no side effects on cell index
            const edits = this._mergeCellEdits(editsWithDetails)
                .sort((a, b) => {
                if (a.end === undefined) {
                    return -1;
                }
                if (b.end === undefined) {
                    return -1;
                }
                return b.end - a.end || b.originalIndex - a.originalIndex;
            }).reduce((prev, curr) => {
                if (!prev.length) {
                    // empty
                    prev.push([curr]);
                }
                else {
                    const last = prev[prev.length - 1];
                    const index = last[0].cellIndex;
                    if (curr.cellIndex === index) {
                        last.push(curr);
                    }
                    else {
                        prev.push([curr]);
                    }
                }
                return prev;
            }, []).map(editsOnSameIndex => {
                const replaceEdits = [];
                const otherEdits = [];
                editsOnSameIndex.forEach(edit => {
                    if (edit.edit.editType === 1 /* CellEditType.Replace */) {
                        replaceEdits.push(edit);
                    }
                    else {
                        otherEdits.push(edit);
                    }
                });
                return [...otherEdits.reverse(), ...replaceEdits];
            });
            const flattenEdits = edits.flat();
            for (const { edit, cellIndex } of flattenEdits) {
                switch (edit.editType) {
                    case 1 /* CellEditType.Replace */:
                        this._replaceCells(edit.index, edit.count, edit.cells, synchronous, computeUndoRedo);
                        break;
                    case 2 /* CellEditType.Output */: {
                        this._assertIndex(cellIndex);
                        const cell = this._cells[cellIndex];
                        if (edit.append) {
                            this._spliceNotebookCellOutputs(cell, { start: cell.outputs.length, deleteCount: 0, newOutputs: edit.outputs.map(op => new notebookCellOutputTextModel_1.NotebookCellOutputTextModel(op)) }, true, computeUndoRedo);
                        }
                        else {
                            this._spliceNotebookCellOutputs2(cell, edit.outputs.map(op => new notebookCellOutputTextModel_1.NotebookCellOutputTextModel(op)), computeUndoRedo);
                        }
                        break;
                    }
                    case 7 /* CellEditType.OutputItems */:
                        {
                            this._assertIndex(cellIndex);
                            const cell = this._cells[cellIndex];
                            if (edit.append) {
                                this._appendNotebookCellOutputItems(cell, edit.outputId, edit.items);
                            }
                            else {
                                this._replaceNotebookCellOutputItems(cell, edit.outputId, edit.items);
                            }
                        }
                        break;
                    case 3 /* CellEditType.Metadata */:
                        this._assertIndex(edit.index);
                        this._changeCellMetadata(this._cells[edit.index], edit.metadata, computeUndoRedo);
                        break;
                    case 8 /* CellEditType.PartialMetadata */:
                        this._assertIndex(cellIndex);
                        this._changeCellMetadataPartial(this._cells[cellIndex], edit.metadata, computeUndoRedo);
                        break;
                    case 9 /* CellEditType.PartialInternalMetadata */:
                        this._assertIndex(cellIndex);
                        this._changeCellInternalMetadataPartial(this._cells[cellIndex], edit.internalMetadata);
                        break;
                    case 4 /* CellEditType.CellLanguage */:
                        this._assertIndex(edit.index);
                        this._changeCellLanguage(this._cells[edit.index], edit.language, computeUndoRedo);
                        break;
                    case 5 /* CellEditType.DocumentMetadata */:
                        this._updateNotebookMetadata(edit.metadata, computeUndoRedo);
                        break;
                    case 6 /* CellEditType.Move */:
                        this._moveCellToIdx(edit.index, edit.length, edit.newIdx, synchronous, computeUndoRedo, undefined, undefined);
                        break;
                }
            }
        }
        _mergeCellEdits(rawEdits) {
            const mergedEdits = [];
            rawEdits.forEach(edit => {
                if (mergedEdits.length) {
                    const last = mergedEdits[mergedEdits.length - 1];
                    if (last.edit.editType === 2 /* CellEditType.Output */
                        && last.edit.append
                        && edit.edit.editType === 2 /* CellEditType.Output */
                        && edit.edit.append
                        && last.cellIndex === edit.cellIndex) {
                        last.edit.outputs = [...last.edit.outputs, ...edit.edit.outputs];
                    }
                    else if (last.edit.editType === 2 /* CellEditType.Output */
                        && !last.edit.append // last cell is not append
                        && last.edit.outputs.length === 0 // last cell is clear outputs
                        && edit.edit.editType === 2 /* CellEditType.Output */
                        && edit.edit.append
                        && last.cellIndex === edit.cellIndex) {
                        last.edit.append = false;
                        last.edit.outputs = edit.edit.outputs;
                    }
                    else {
                        mergedEdits.push(edit);
                    }
                }
                else {
                    mergedEdits.push(edit);
                }
            });
            return mergedEdits;
        }
        _getDefaultCollapseState(cellDto) {
            var _a, _b, _c;
            const defaultConfig = cellDto.cellKind === notebookCommon_1.CellKind.Code ? (_a = this._defaultCollapseConfig) === null || _a === void 0 ? void 0 : _a.codeCell : (_b = this._defaultCollapseConfig) === null || _b === void 0 ? void 0 : _b.markupCell;
            return (_c = cellDto.collapseState) !== null && _c !== void 0 ? _c : (defaultConfig !== null && defaultConfig !== void 0 ? defaultConfig : undefined);
        }
        _replaceCells(index, count, cellDtos, synchronous, computeUndoRedo) {
            var _a;
            if (count === 0 && cellDtos.length === 0) {
                return;
            }
            const oldViewCells = this._cells.slice(0);
            const oldSet = new Set();
            oldViewCells.forEach(cell => {
                oldSet.add(cell.handle);
            });
            // prepare remove
            for (let i = index; i < Math.min(index + count, this._cells.length); i++) {
                const cell = this._cells[i];
                (_a = this._cellListeners.get(cell.handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._cellListeners.delete(cell.handle);
            }
            // prepare add
            const cells = cellDtos.map(cellDto => {
                const cellHandle = this._cellhandlePool++;
                const cellUri = notebookCommon_1.CellUri.generate(this.uri, cellHandle);
                const collapseState = this._getDefaultCollapseState(cellDto);
                const cell = new notebookCellTextModel_1.NotebookCellTextModel(cellUri, cellHandle, cellDto.source, cellDto.language, cellDto.mime, cellDto.cellKind, cellDto.outputs || [], cellDto.metadata, cellDto.internalMetadata, collapseState, this.transientOptions, this._languageService);
                const textModel = this._modelService.getModel(cellUri);
                if (textModel && textModel instanceof textModel_1.TextModel) {
                    cell.textModel = textModel;
                    cell.language = cellDto.language;
                    cell.textModel.setValue(cellDto.source);
                    cell.resetTextBuffer(cell.textModel.getTextBuffer());
                }
                const dirtyStateListener = cell.onDidChangeContent((e) => {
                    this._bindCellContentHandler(cell, e);
                });
                this._cellListeners.set(cell.handle, dirtyStateListener);
                return cell;
            });
            // compute change
            const cellsCopy = this._cells.slice(0);
            cellsCopy.splice(index, count, ...cells);
            const diffs = (0, notebookCommon_1.diff)(this._cells, cellsCopy, cell => {
                return oldSet.has(cell.handle);
            }).map(diff => {
                return [diff.start, diff.deleteCount, diff.toInsert];
            });
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes: diffs } });
            // make change
            this._cells = cellsCopy;
            const undoDiff = diffs.map(diff => {
                const deletedCells = oldViewCells.slice(diff[0], diff[0] + diff[1]);
                return [diff[0], deletedCells, diff[2]];
            });
            if (computeUndoRedo) {
                this._operationManager.pushEditOperation(new cellEdit_1.SpliceCellsEdit(this.uri, undoDiff, {
                    insertCell: (index, cell, endSelections) => { this._insertNewCell(index, [cell], true, endSelections); },
                    deleteCell: (index, endSelections) => { this._removeCell(index, 1, true, endSelections); },
                    replaceCell: (index, count, cells, endSelections) => { this._replaceNewCells(index, count, cells, true, endSelections); },
                }, undefined, undefined), undefined, undefined);
            }
            // should be deferred
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes: diffs, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: undefined
            });
        }
        _increaseVersionId(transient) {
            this._versionId = this._versionId + 1;
            if (!transient) {
                this._notebookSpecificAlternativeId = this._versionId;
            }
            this._alternativeVersionId = this._generateAlternativeId();
        }
        _overwriteAlternativeVersionId(newAlternativeVersionId) {
            this._alternativeVersionId = newAlternativeVersionId;
            this._notebookSpecificAlternativeId = Number(newAlternativeVersionId.substring(0, newAlternativeVersionId.indexOf('_')));
        }
        _updateNotebookMetadata(metadata, computeUndoRedo) {
            const oldMetadata = this.metadata;
            const triggerDirtyChange = this._isDocumentMetadataChanged(this.metadata, metadata);
            if (triggerDirtyChange) {
                if (computeUndoRedo) {
                    const that = this;
                    this._operationManager.pushEditOperation(new class {
                        constructor() {
                            this.type = 0 /* UndoRedoElementType.Resource */;
                            this.label = 'Update Notebook Metadata';
                            this.code = 'undoredo.notebooks.updateCellMetadata';
                        }
                        get resource() {
                            return that.uri;
                        }
                        undo() {
                            that._updateNotebookMetadata(oldMetadata, false);
                        }
                        redo() {
                            that._updateNotebookMetadata(metadata, false);
                        }
                    }(), undefined, undefined);
                }
            }
            this.metadata = metadata;
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeDocumentMetadata, metadata: this.metadata, transient: !triggerDirtyChange }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _insertNewCell(index, cells, synchronous, endSelections) {
            for (let i = 0; i < cells.length; i++) {
                const dirtyStateListener = cells[i].onDidChangeContent((e) => {
                    this._bindCellContentHandler(cells[i], e);
                });
                this._cellListeners.set(cells[i].handle, dirtyStateListener);
            }
            const changes = [[index, 0, cells]];
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes } });
            this._cells.splice(index, 0, ...cells);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
            return;
        }
        _removeCell(index, count, synchronous, endSelections) {
            var _a;
            for (let i = index; i < index + count; i++) {
                const cell = this._cells[i];
                (_a = this._cellListeners.get(cell.handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._cellListeners.delete(cell.handle);
            }
            const changes = [[index, count, []]];
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes } });
            this._cells.splice(index, count);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
        }
        _replaceNewCells(index, count, cells, synchronous, endSelections) {
            var _a;
            for (let i = index; i < index + count; i++) {
                const cell = this._cells[i];
                (_a = this._cellListeners.get(cell.handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._cellListeners.delete(cell.handle);
            }
            for (let i = 0; i < cells.length; i++) {
                const dirtyStateListener = cells[i].onDidChangeContent((e) => {
                    this._bindCellContentHandler(cells[i], e);
                });
                this._cellListeners.set(cells[i].handle, dirtyStateListener);
            }
            const changes = [[index, count, cells]];
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes } });
            this._cells.splice(index, count, ...cells);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
        }
        _isDocumentMetadataChanged(a, b) {
            const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
            for (const key of keys) {
                if (key === 'custom') {
                    if (!this._customMetadataEqual(a[key], b[key])
                        &&
                            !(this.transientOptions.transientDocumentMetadata[key])) {
                        return true;
                    }
                }
                else if ((a[key] !== b[key])
                    &&
                        !(this.transientOptions.transientDocumentMetadata[key])) {
                    return true;
                }
            }
            return false;
        }
        _isCellMetadataChanged(a, b) {
            const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
            for (const key of keys) {
                if ((a[key] !== b[key])
                    &&
                        !(this.transientOptions.transientCellMetadata[key])) {
                    return true;
                }
            }
            return false;
        }
        _customMetadataEqual(a, b) {
            if (!a && !b) {
                // both of them are nullish or undefined
                return true;
            }
            if (!a || !b) {
                return false;
            }
            const aProps = Object.getOwnPropertyNames(a);
            const bProps = Object.getOwnPropertyNames(b);
            if (aProps.length !== bProps.length) {
                return false;
            }
            for (let i = 0; i < aProps.length; i++) {
                const propName = aProps[i];
                if (a[propName] !== b[propName]) {
                    return false;
                }
            }
            return true;
        }
        _changeCellMetadataPartial(cell, metadata, computeUndoRedo) {
            var _a;
            const newMetadata = Object.assign({}, cell.metadata);
            let k;
            for (k in metadata) {
                const value = (_a = metadata[k]) !== null && _a !== void 0 ? _a : undefined;
                newMetadata[k] = value;
            }
            return this._changeCellMetadata(cell, newMetadata, computeUndoRedo);
        }
        _changeCellMetadata(cell, metadata, computeUndoRedo) {
            const triggerDirtyChange = this._isCellMetadataChanged(cell.metadata, metadata);
            if (triggerDirtyChange) {
                if (computeUndoRedo) {
                    const index = this._cells.indexOf(cell);
                    this._operationManager.pushEditOperation(new cellEdit_1.CellMetadataEdit(this.uri, index, Object.freeze(cell.metadata), Object.freeze(metadata), {
                        updateCellMetadata: (index, newMetadata) => {
                            const cell = this._cells[index];
                            if (!cell) {
                                return;
                            }
                            this._changeCellMetadata(cell, newMetadata, false);
                        }
                    }), undefined, undefined);
                }
            }
            // should be deferred
            cell.metadata = metadata;
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellMetadata, index: this._cells.indexOf(cell), metadata: cell.metadata, transient: !triggerDirtyChange }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _changeCellInternalMetadataPartial(cell, internalMetadata) {
            var _a;
            const newInternalMetadata = Object.assign({}, cell.internalMetadata);
            let k;
            for (k in internalMetadata) {
                const value = (_a = internalMetadata[k]) !== null && _a !== void 0 ? _a : undefined;
                newInternalMetadata[k] = value;
            }
            cell.internalMetadata = newInternalMetadata;
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellInternalMetadata, index: this._cells.indexOf(cell), internalMetadata: cell.internalMetadata, transient: true }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _changeCellLanguage(cell, languageId, computeUndoRedo) {
            if (cell.language === languageId) {
                return;
            }
            const oldLanguage = cell.language;
            cell.language = languageId;
            if (computeUndoRedo) {
                const that = this;
                this._operationManager.pushEditOperation(new class {
                    constructor() {
                        this.type = 0 /* UndoRedoElementType.Resource */;
                        this.label = 'Update Cell Language';
                        this.code = 'undoredo.notebooks.updateCellLanguage';
                    }
                    get resource() {
                        return that.uri;
                    }
                    undo() {
                        that._changeCellLanguage(cell, oldLanguage, false);
                    }
                    redo() {
                        that._changeCellLanguage(cell, languageId, false);
                    }
                }(), undefined, undefined);
            }
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage, index: this._cells.indexOf(cell), language: languageId, transient: false }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _spliceNotebookCellOutputs2(cell, outputs, computeUndoRedo) {
            if (outputs.length === 0 && cell.outputs.length === 0) {
                return;
            }
            if (outputs.length <= 1) {
                this._spliceNotebookCellOutputs(cell, { start: 0, deleteCount: cell.outputs.length, newOutputs: outputs }, false, computeUndoRedo);
                return;
            }
            const diff = new diff_1.LcsDiff(new OutputSequence(cell.outputs), new OutputSequence(outputs));
            const diffResult = diff.ComputeDiff(false);
            const splices = diffResult.changes.map(change => ({ start: change.originalStart, deleteCount: change.originalLength, newOutputs: outputs.slice(change.modifiedStart, change.modifiedStart + change.modifiedLength) }));
            splices.reverse().forEach(splice => {
                this._spliceNotebookCellOutputs(cell, splice, false, computeUndoRedo);
            });
        }
        _spliceNotebookCellOutputs(cell, splice, append, computeUndoRedo) {
            var _a;
            cell.spliceNotebookCellOutputs(splice);
            this._pauseableEmitter.fire({
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.Output,
                        index: this._cells.indexOf(cell),
                        outputs: (_a = cell.outputs) !== null && _a !== void 0 ? _a : [],
                        append,
                        transient: this.transientOptions.transientOutputs,
                    }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _appendNotebookCellOutputItems(cell, outputId, items) {
            if (cell.changeOutputItems(outputId, true, items)) {
                this._pauseableEmitter.fire({
                    rawEvents: [{
                            kind: notebookCommon_1.NotebookCellsChangeType.OutputItem,
                            index: this._cells.indexOf(cell),
                            outputId: outputId,
                            outputItems: items,
                            append: true,
                            transient: this.transientOptions.transientOutputs
                        }],
                    versionId: this.versionId,
                    synchronous: true,
                    endSelectionState: undefined
                });
            }
        }
        _replaceNotebookCellOutputItems(cell, outputId, items) {
            if (cell.changeOutputItems(outputId, false, items)) {
                this._pauseableEmitter.fire({
                    rawEvents: [{
                            kind: notebookCommon_1.NotebookCellsChangeType.OutputItem,
                            index: this._cells.indexOf(cell),
                            outputId: outputId,
                            outputItems: items,
                            append: false,
                            transient: this.transientOptions.transientOutputs
                        }],
                    versionId: this.versionId,
                    synchronous: true,
                    endSelectionState: undefined
                });
            }
        }
        _moveCellToIdx(index, length, newIdx, synchronous, pushedToUndoStack, beforeSelections, endSelections) {
            if (pushedToUndoStack) {
                this._operationManager.pushEditOperation(new cellEdit_1.MoveCellEdit(this.uri, index, length, newIdx, {
                    moveCell: (fromIndex, length, toIndex, beforeSelections, endSelections) => {
                        this._moveCellToIdx(fromIndex, length, toIndex, true, false, beforeSelections, endSelections);
                    },
                }, beforeSelections, endSelections), beforeSelections, endSelections);
            }
            this._assertIndex(index);
            this._assertIndex(newIdx);
            const cells = this._cells.splice(index, length);
            this._cells.splice(newIdx, 0, ...cells);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.Move, index, length, newIdx, cells, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
            return true;
        }
        _assertIndex(index) {
            if (this._indexIsInvalid(index)) {
                throw new Error(`model index out of range ${index}`);
            }
        }
        _indexIsInvalid(index) {
            return index < 0 || index >= this._cells.length;
        }
    };
    NotebookTextModel = __decorate([
        __param(5, undoRedo_1.IUndoRedoService),
        __param(6, model_1.IModelService),
        __param(7, language_1.ILanguageService)
    ], NotebookTextModel);
    exports.NotebookTextModel = NotebookTextModel;
    class OutputSequence {
        constructor(outputs) {
            this.outputs = outputs;
        }
        getElements() {
            return this.outputs.map(output => {
                return (0, hash_1.hash)(output.outputs.map(output => ({
                    mime: output.mime,
                    data: output.data
                })));
            });
        }
    }
});
//# sourceMappingURL=notebookTextModel.js.map