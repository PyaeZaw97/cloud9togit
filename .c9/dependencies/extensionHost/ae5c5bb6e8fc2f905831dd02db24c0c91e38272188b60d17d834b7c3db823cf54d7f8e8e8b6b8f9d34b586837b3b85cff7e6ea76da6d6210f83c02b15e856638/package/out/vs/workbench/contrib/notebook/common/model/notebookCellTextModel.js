/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/languages/modesRegistry", "vs/workbench/contrib/notebook/common/model/notebookCellOutputTextModel"], function (require, exports, event_1, hash_1, lifecycle_1, UUID, range_1, pieceTreeTextBuffer_1, pieceTreeTextBufferBuilder_1, modesRegistry_1, notebookCellOutputTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cloneNotebookCellTextModel = exports.NotebookCellTextModel = void 0;
    class NotebookCellTextModel extends lifecycle_1.Disposable {
        constructor(uri, handle, _source, _language, _mime, cellKind, outputs, metadata, internalMetadata, collapseState, transientOptions, _languageService) {
            super();
            this.uri = uri;
            this.handle = handle;
            this._source = _source;
            this._language = _language;
            this._mime = _mime;
            this.cellKind = cellKind;
            this.collapseState = collapseState;
            this.transientOptions = transientOptions;
            this._languageService = _languageService;
            this._onDidChangeOutputs = this._register(new event_1.Emitter());
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            this._onDidChangeOutputItems = this._register(new event_1.Emitter());
            this.onDidChangeOutputItems = this._onDidChangeOutputItems.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeMetadata = this._register(new event_1.Emitter());
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidChangeInternalMetadata = this._register(new event_1.Emitter());
            this.onDidChangeInternalMetadata = this._onDidChangeInternalMetadata.event;
            this._onDidChangeLanguage = this._register(new event_1.Emitter());
            this.onDidChangeLanguage = this._onDidChangeLanguage.event;
            this._hash = null;
            this._versionId = 1;
            this._alternativeId = 1;
            this._textModelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._textModel = undefined;
            this._outputs = outputs.map(op => new notebookCellOutputTextModel_1.NotebookCellOutputTextModel(op));
            this._metadata = metadata !== null && metadata !== void 0 ? metadata : {};
            this._internalMetadata = internalMetadata !== null && internalMetadata !== void 0 ? internalMetadata : {};
        }
        get outputs() {
            return this._outputs;
        }
        get metadata() {
            return this._metadata;
        }
        set metadata(newMetadata) {
            this._metadata = newMetadata;
            this._hash = null;
            this._onDidChangeMetadata.fire();
        }
        get internalMetadata() {
            return this._internalMetadata;
        }
        set internalMetadata(newInternalMetadata) {
            const lastRunSuccessChanged = this._internalMetadata.lastRunSuccess !== newInternalMetadata.lastRunSuccess;
            newInternalMetadata = Object.assign(Object.assign({}, newInternalMetadata), { runStartTimeAdjustment: computeRunStartTimeAdjustment(this._internalMetadata, newInternalMetadata) });
            this._internalMetadata = newInternalMetadata;
            this._hash = null;
            this._onDidChangeInternalMetadata.fire({ lastRunSuccessChanged });
        }
        get language() {
            return this._language;
        }
        set language(newLanguage) {
            if (this._textModel
                // 1. the language update is from workspace edit, checking if it's the same as text model's mode
                && this._textModel.getLanguageId() === this._languageService.getLanguageIdByLanguageName(newLanguage)
                // 2. the text model's mode might be the same as the `this.language`, even if the language friendly name is not the same, we should not trigger an update
                && this._textModel.getLanguageId() === this._languageService.getLanguageIdByLanguageName(this.language)) {
                return;
            }
            const newLanguageId = this._languageService.getLanguageIdByLanguageName(newLanguage);
            if (newLanguageId === null) {
                return;
            }
            if (this._textModel) {
                const languageId = this._languageService.createById(newLanguageId);
                this._textModel.setMode(languageId.languageId);
            }
            if (this._language === newLanguage) {
                return;
            }
            this._language = newLanguage;
            this._hash = null;
            this._onDidChangeLanguage.fire(newLanguage);
            this._onDidChangeContent.fire('language');
        }
        get mime() {
            return this._mime;
        }
        set mime(newMime) {
            if (this._mime === newMime) {
                return;
            }
            this._mime = newMime;
            this._hash = null;
            this._onDidChangeContent.fire('mime');
        }
        get textBuffer() {
            if (this._textBuffer) {
                return this._textBuffer;
            }
            const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
            builder.acceptChunk(this._source);
            const bufferFactory = builder.finish(true);
            const { textBuffer, disposable } = bufferFactory.create(1 /* model.DefaultEndOfLine.LF */);
            this._textBuffer = textBuffer;
            this._register(disposable);
            this._register(this._textBuffer.onDidChangeContent(() => {
                this._hash = null;
                if (!this._textModel) {
                    this._onDidChangeContent.fire('content');
                }
            }));
            return this._textBuffer;
        }
        get alternativeId() {
            return this._alternativeId;
        }
        get textModel() {
            return this._textModel;
        }
        set textModel(m) {
            if (this._textModel === m) {
                return;
            }
            this._textModelDisposables.clear();
            this._textModel = m;
            if (this._textModel) {
                // Init language from text model
                // The language defined in the cell might not be supported in the editor so the text model might be using the default fallback
                // If so let's not modify the language
                if (!(this._languageService.isRegisteredLanguageId(this.language) === false && (this._textModel.getLanguageId() === modesRegistry_1.PLAINTEXT_LANGUAGE_ID || this._textModel.getLanguageId() === 'jupyter'))) {
                    this.language = this._textModel.getLanguageId();
                }
                // Listen to language changes on the model
                this._textModelDisposables.add(this._textModel.onDidChangeLanguage(e => {
                    this.language = e.newLanguage;
                }));
                this._textModelDisposables.add(this._textModel.onWillDispose(() => this.textModel = undefined));
                this._textModelDisposables.add(this._textModel.onDidChangeContent(() => {
                    if (this._textModel) {
                        this._versionId = this._textModel.getVersionId();
                        this._alternativeId = this._textModel.getAlternativeVersionId();
                    }
                    this._onDidChangeContent.fire('content');
                }));
                this._textModel._overwriteVersionId(this._versionId);
                this._textModel._overwriteAlternativeVersionId(this._versionId);
            }
        }
        resetTextBuffer(textBuffer) {
            this._textBuffer = textBuffer;
        }
        getValue() {
            const fullRange = this.getFullModelRange();
            const eol = this.textBuffer.getEOL();
            if (eol === '\n') {
                return this.textBuffer.getValueInRange(fullRange, 1 /* model.EndOfLinePreference.LF */);
            }
            else {
                return this.textBuffer.getValueInRange(fullRange, 2 /* model.EndOfLinePreference.CRLF */);
            }
        }
        getHashValue() {
            if (this._hash !== null) {
                return this._hash;
            }
            this._hash = (0, hash_1.hash)([(0, hash_1.hash)(this.language), (0, hash_1.hash)(this.getValue()), this._getPersisentMetadata(), this.transientOptions.transientOutputs ? [] : this._outputs.map(op => ({
                    outputs: op.outputs.map(output => ({
                        mime: output.mime,
                        data: Array.from(output.data.buffer)
                    })),
                    metadata: op.metadata
                }))]);
            return this._hash;
        }
        _getPersisentMetadata() {
            const filteredMetadata = {};
            const transientCellMetadata = this.transientOptions.transientCellMetadata;
            const keys = new Set([...Object.keys(this.metadata)]);
            for (const key of keys) {
                if (!(transientCellMetadata[key])) {
                    filteredMetadata[key] = this.metadata[key];
                }
            }
            return filteredMetadata;
        }
        getTextLength() {
            return this.textBuffer.getLength();
        }
        getFullModelRange() {
            const lineCount = this.textBuffer.getLineCount();
            return new range_1.Range(1, 1, lineCount, this.textBuffer.getLineLength(lineCount) + 1);
        }
        spliceNotebookCellOutputs(splice) {
            this.outputs.splice(splice.start, splice.deleteCount, ...splice.newOutputs);
            this._onDidChangeOutputs.fire(splice);
        }
        changeOutputItems(outputId, append, items) {
            const outputIndex = this.outputs.findIndex(output => output.outputId === outputId);
            if (outputIndex < 0) {
                return false;
            }
            const output = this.outputs[outputIndex];
            if (append) {
                output.appendData(items);
            }
            else {
                output.replaceData(items);
            }
            this._onDidChangeOutputItems.fire();
            return true;
        }
        _outputNotEqualFastCheck(left, right) {
            if (left.length !== right.length) {
                return false;
            }
            for (let i = 0; i < this.outputs.length; i++) {
                const l = left[i];
                const r = right[i];
                if (l.outputs.length !== r.outputs.length) {
                    return false;
                }
                for (let k = 0; k < l.outputs.length; k++) {
                    if (l.outputs[k].mime !== r.outputs[k].mime) {
                        return false;
                    }
                    if (l.outputs[k].data.byteLength !== r.outputs[k].data.byteLength) {
                        return false;
                    }
                }
            }
            return true;
        }
        equal(b) {
            if (this.language !== b.language) {
                return false;
            }
            if (this.getTextLength() !== b.getTextLength()) {
                return false;
            }
            if (!this.transientOptions.transientOutputs) {
                // compare outputs
                if (!this._outputNotEqualFastCheck(this.outputs, b.outputs)) {
                    return false;
                }
            }
            return this.getHashValue() === b.getHashValue();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._outputs);
            // Manually release reference to previous text buffer to avoid large leaks
            // in case someone leaks a CellTextModel reference
            const emptyDisposedTextBuffer = new pieceTreeTextBuffer_1.PieceTreeTextBuffer([], '', '\n', false, false, true, true);
            emptyDisposedTextBuffer.dispose();
            this._textBuffer = emptyDisposedTextBuffer;
            super.dispose();
        }
    }
    exports.NotebookCellTextModel = NotebookCellTextModel;
    function cloneNotebookCellTextModel(cell) {
        return {
            source: cell.getValue(),
            language: cell.language,
            mime: cell.mime,
            cellKind: cell.cellKind,
            outputs: cell.outputs.map(output => ({
                outputs: output.outputs,
                /* paste should generate new outputId */ outputId: UUID.generateUuid()
            })),
            metadata: Object.assign({}, cell.metadata),
            // Don't include internalMetadata, ie execution state, this is not to be shared
        };
    }
    exports.cloneNotebookCellTextModel = cloneNotebookCellTextModel;
    function computeRunStartTimeAdjustment(oldMetadata, newMetadata) {
        if (oldMetadata.runStartTime !== newMetadata.runStartTime && typeof newMetadata.runStartTime === 'number') {
            const offset = Date.now() - newMetadata.runStartTime;
            return offset < 0 ? Math.abs(offset) : 0;
        }
        else {
            return newMetadata.runStartTimeAdjustment;
        }
    }
});
//# sourceMappingURL=notebookCellTextModel.js.map