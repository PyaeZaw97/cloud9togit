/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/browser/widget/diffEditorWidget", "vs/base/common/hash", "vs/base/common/jsonFormatter", "vs/workbench/contrib/notebook/browser/diff/eventDispatcher"], function (require, exports, event_1, lifecycle_1, notebookDiffEditorBrowser_1, notebookBrowser_1, diffEditorWidget_1, hash_1, jsonFormatter_1, eventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFormattedOutputJSON = exports.getStreamOutputData = exports.getFormattedMetadataJSON = exports.outputEqual = exports.OutputComparison = exports.SingleSideDiffElementViewModel = exports.SideBySideDiffElementViewModel = exports.DiffElementViewModelBase = exports.OUTPUT_EDITOR_HEIGHT_MAGIC = exports.PropertyFoldingState = void 0;
    var PropertyFoldingState;
    (function (PropertyFoldingState) {
        PropertyFoldingState[PropertyFoldingState["Expanded"] = 0] = "Expanded";
        PropertyFoldingState[PropertyFoldingState["Collapsed"] = 1] = "Collapsed";
    })(PropertyFoldingState = exports.PropertyFoldingState || (exports.PropertyFoldingState = {}));
    exports.OUTPUT_EDITOR_HEIGHT_MAGIC = 1440;
    class DiffElementViewModelBase extends lifecycle_1.Disposable {
        constructor(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super();
            this.mainDocumentTextModel = mainDocumentTextModel;
            this.original = original;
            this.modified = modified;
            this.type = type;
            this.editorEventDispatcher = editorEventDispatcher;
            this.initData = initData;
            this._layoutInfoEmitter = this._register(new event_1.Emitter());
            this.onDidLayoutChange = this._layoutInfoEmitter.event;
            this._stateChangeEmitter = this._register(new event_1.Emitter());
            this.onDidStateChange = this._stateChangeEmitter.event;
            this._renderOutput = true;
            this._sourceEditorViewState = null;
            this._outputEditorViewState = null;
            this._metadataEditorViewState = null;
            this._layoutInfo = {
                width: 0,
                editorHeight: 0,
                editorMargin: 0,
                metadataHeight: 0,
                metadataStatusHeight: 25,
                rawOutputHeight: 0,
                outputTotalHeight: 0,
                outputStatusHeight: 25,
                outputMetadataHeight: 0,
                bodyMargin: 32,
                totalHeight: 82,
                layoutState: notebookBrowser_1.CellLayoutState.Uninitialized
            };
            this.metadataFoldingState = PropertyFoldingState.Collapsed;
            this.outputFoldingState = PropertyFoldingState.Collapsed;
            this._register(this.editorEventDispatcher.onDidChangeLayout(e => {
                this._layoutInfoEmitter.fire({ outerWidth: true });
            }));
        }
        set rawOutputHeight(height) {
            this._layout({ rawOutputHeight: Math.min(exports.OUTPUT_EDITOR_HEIGHT_MAGIC, height) });
        }
        get rawOutputHeight() {
            throw new Error('Use Cell.layoutInfo.rawOutputHeight');
        }
        set outputStatusHeight(height) {
            this._layout({ outputStatusHeight: height });
        }
        get outputStatusHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set outputMetadataHeight(height) {
            this._layout({ outputMetadataHeight: height });
        }
        get outputMetadataHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set editorHeight(height) {
            this._layout({ editorHeight: height });
        }
        get editorHeight() {
            throw new Error('Use Cell.layoutInfo.editorHeight');
        }
        set editorMargin(margin) {
            this._layout({ editorMargin: margin });
        }
        get editorMargin() {
            throw new Error('Use Cell.layoutInfo.editorMargin');
        }
        set metadataStatusHeight(height) {
            this._layout({ metadataStatusHeight: height });
        }
        get metadataStatusHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set metadataHeight(height) {
            this._layout({ metadataHeight: height });
        }
        get metadataHeight() {
            throw new Error('Use Cell.layoutInfo.metadataHeight');
        }
        set renderOutput(value) {
            this._renderOutput = value;
            this._layout({ recomputeOutput: true });
            this._stateChangeEmitter.fire({ renderOutput: this._renderOutput });
        }
        get renderOutput() {
            return this._renderOutput;
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        layoutChange() {
            this._layout({ recomputeOutput: true });
        }
        _layout(delta) {
            const width = delta.width !== undefined ? delta.width : this._layoutInfo.width;
            const editorHeight = delta.editorHeight !== undefined ? delta.editorHeight : this._layoutInfo.editorHeight;
            const editorMargin = delta.editorMargin !== undefined ? delta.editorMargin : this._layoutInfo.editorMargin;
            const metadataHeight = delta.metadataHeight !== undefined ? delta.metadataHeight : this._layoutInfo.metadataHeight;
            const metadataStatusHeight = delta.metadataStatusHeight !== undefined ? delta.metadataStatusHeight : this._layoutInfo.metadataStatusHeight;
            const rawOutputHeight = delta.rawOutputHeight !== undefined ? delta.rawOutputHeight : this._layoutInfo.rawOutputHeight;
            const outputStatusHeight = delta.outputStatusHeight !== undefined ? delta.outputStatusHeight : this._layoutInfo.outputStatusHeight;
            const bodyMargin = delta.bodyMargin !== undefined ? delta.bodyMargin : this._layoutInfo.bodyMargin;
            const outputMetadataHeight = delta.outputMetadataHeight !== undefined ? delta.outputMetadataHeight : this._layoutInfo.outputMetadataHeight;
            const outputHeight = (delta.recomputeOutput || delta.rawOutputHeight !== undefined || delta.outputMetadataHeight !== undefined) ? this._getOutputTotalHeight(rawOutputHeight, outputMetadataHeight) : this._layoutInfo.outputTotalHeight;
            const totalHeight = editorHeight
                + editorMargin
                + metadataHeight
                + metadataStatusHeight
                + outputHeight
                + outputStatusHeight
                + bodyMargin;
            const newLayout = {
                width: width,
                editorHeight: editorHeight,
                editorMargin: editorMargin,
                metadataHeight: metadataHeight,
                metadataStatusHeight: metadataStatusHeight,
                outputTotalHeight: outputHeight,
                outputStatusHeight: outputStatusHeight,
                bodyMargin: bodyMargin,
                rawOutputHeight: rawOutputHeight,
                outputMetadataHeight: outputMetadataHeight,
                totalHeight: totalHeight,
                layoutState: notebookBrowser_1.CellLayoutState.Measured
            };
            const changeEvent = {};
            if (newLayout.width !== this._layoutInfo.width) {
                changeEvent.width = true;
            }
            if (newLayout.editorHeight !== this._layoutInfo.editorHeight) {
                changeEvent.editorHeight = true;
            }
            if (newLayout.editorMargin !== this._layoutInfo.editorMargin) {
                changeEvent.editorMargin = true;
            }
            if (newLayout.metadataHeight !== this._layoutInfo.metadataHeight) {
                changeEvent.metadataHeight = true;
            }
            if (newLayout.metadataStatusHeight !== this._layoutInfo.metadataStatusHeight) {
                changeEvent.metadataStatusHeight = true;
            }
            if (newLayout.outputTotalHeight !== this._layoutInfo.outputTotalHeight) {
                changeEvent.outputTotalHeight = true;
            }
            if (newLayout.outputStatusHeight !== this._layoutInfo.outputStatusHeight) {
                changeEvent.outputStatusHeight = true;
            }
            if (newLayout.bodyMargin !== this._layoutInfo.bodyMargin) {
                changeEvent.bodyMargin = true;
            }
            if (newLayout.outputMetadataHeight !== this._layoutInfo.outputMetadataHeight) {
                changeEvent.outputMetadataHeight = true;
            }
            if (newLayout.totalHeight !== this._layoutInfo.totalHeight) {
                changeEvent.totalHeight = true;
            }
            this._layoutInfo = newLayout;
            this._fireLayoutChangeEvent(changeEvent);
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                const editorHeight = this.estimateEditorHeight(lineHeight);
                return this._computeTotalHeight(editorHeight);
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        _computeTotalHeight(editorHeight) {
            const totalHeight = editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputTotalHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.outputMetadataHeight
                + this._layoutInfo.bodyMargin;
            return totalHeight;
        }
        estimateEditorHeight(lineHeight = 20) {
            var _a, _b, _c, _d;
            const hasScrolling = false;
            const verticalScrollbarHeight = hasScrolling ? 12 : 0; // take zoom level into account
            // const editorPadding = this.viewContext.notebookOptions.computeEditorPadding(this.internalMetadata);
            const lineCount = Math.max((_b = (_a = this.original) === null || _a === void 0 ? void 0 : _a.textModel.textBuffer.getLineCount()) !== null && _b !== void 0 ? _b : 1, (_d = (_c = this.modified) === null || _c === void 0 ? void 0 : _c.textModel.textBuffer.getLineCount()) !== null && _d !== void 0 ? _d : 1);
            return lineCount * lineHeight
                + 24 // Top padding
                + 12 // Bottom padding
                + verticalScrollbarHeight;
        }
        _getOutputTotalHeight(rawOutputHeight, metadataHeight) {
            if (this.outputFoldingState === PropertyFoldingState.Collapsed) {
                return 0;
            }
            if (this.renderOutput) {
                if (this.isOutputEmpty()) {
                    // single line;
                    return 24;
                }
                return this.getRichOutputTotalHeight() + metadataHeight;
            }
            else {
                return rawOutputHeight;
            }
        }
        _fireLayoutChangeEvent(state) {
            this._layoutInfoEmitter.fire(state);
            this.editorEventDispatcher.emit([{ type: eventDispatcher_1.NotebookDiffViewEventType.CellLayoutChanged, source: this._layoutInfo }]);
        }
        getComputedCellContainerWidth(layoutInfo, diffEditor, fullWidth) {
            if (fullWidth) {
                return layoutInfo.width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN + (diffEditor ? diffEditorWidget_1.DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0) - 2;
            }
            return (layoutInfo.width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN + (diffEditor ? diffEditorWidget_1.DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0)) / 2 - 18 - 2;
        }
        getOutputEditorViewState() {
            return this._outputEditorViewState;
        }
        saveOutputEditorViewState(viewState) {
            this._outputEditorViewState = viewState;
        }
        getMetadataEditorViewState() {
            return this._metadataEditorViewState;
        }
        saveMetadataEditorViewState(viewState) {
            this._metadataEditorViewState = viewState;
        }
        getSourceEditorViewState() {
            return this._sourceEditorViewState;
        }
        saveSpirceEditorViewState(viewState) {
            this._sourceEditorViewState = viewState;
        }
    }
    exports.DiffElementViewModelBase = DiffElementViewModelBase;
    class SideBySideDiffElementViewModel extends DiffElementViewModelBase {
        constructor(mainDocumentTextModel, otherDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData);
            this.otherDocumentTextModel = otherDocumentTextModel;
            this.original = original;
            this.modified = modified;
            this.type = type;
            this.metadataFoldingState = PropertyFoldingState.Collapsed;
            this.outputFoldingState = PropertyFoldingState.Collapsed;
            if (this.checkMetadataIfModified()) {
                this.metadataFoldingState = PropertyFoldingState.Expanded;
            }
            if (this.checkIfOutputsModified()) {
                this.outputFoldingState = PropertyFoldingState.Expanded;
            }
            this._register(this.original.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
            this._register(this.modified.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
        }
        get originalDocument() {
            return this.otherDocumentTextModel;
        }
        get modifiedDocument() {
            return this.mainDocumentTextModel;
        }
        checkIfOutputsModified() {
            var _a, _b, _c, _d;
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return false;
            }
            const ret = outputsEqual((_b = (_a = this.original) === null || _a === void 0 ? void 0 : _a.outputs) !== null && _b !== void 0 ? _b : [], (_d = (_c = this.modified) === null || _c === void 0 ? void 0 : _c.outputs) !== null && _d !== void 0 ? _d : []);
            if (ret === 0 /* OutputComparison.Unchanged */) {
                return false;
            }
            return {
                reason: ret === 1 /* OutputComparison.Metadata */ ? 'Output metadata is changed' : undefined,
                kind: ret
            };
        }
        checkMetadataIfModified() {
            var _a, _b, _c, _d, _e;
            const modified = (0, hash_1.hash)(getFormattedMetadataJSON(this.mainDocumentTextModel, ((_a = this.original) === null || _a === void 0 ? void 0 : _a.metadata) || {}, (_b = this.original) === null || _b === void 0 ? void 0 : _b.language)) !== (0, hash_1.hash)(getFormattedMetadataJSON(this.mainDocumentTextModel, (_d = (_c = this.modified) === null || _c === void 0 ? void 0 : _c.metadata) !== null && _d !== void 0 ? _d : {}, (_e = this.modified) === null || _e === void 0 ? void 0 : _e.language));
            if (modified) {
                return { reason: undefined };
            }
            else {
                return false;
            }
        }
        updateOutputHeight(diffSide, index, height) {
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                this.original.updateOutputHeight(index, height);
            }
            else {
                this.modified.updateOutputHeight(index, height);
            }
        }
        getOutputOffsetInContainer(diffSide, index) {
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                return this.original.getOutputOffset(index);
            }
            else {
                return this.modified.getOutputOffset(index);
            }
        }
        getOutputOffsetInCell(diffSide, index) {
            const offsetInOutputsContainer = this.getOutputOffsetInContainer(diffSide, index);
            return this._layoutInfo.editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.bodyMargin / 2
                + offsetInOutputsContainer;
        }
        isOutputEmpty() {
            var _a;
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return true;
            }
            if (this.checkIfOutputsModified()) {
                return false;
            }
            // outputs are not changed
            return (((_a = this.original) === null || _a === void 0 ? void 0 : _a.outputs) || []).length === 0;
        }
        getRichOutputTotalHeight() {
            return Math.max(this.original.getOutputTotalHeight(), this.modified.getOutputTotalHeight());
        }
        getNestedCellViewModel(diffSide) {
            return diffSide === notebookDiffEditorBrowser_1.DiffSide.Original ? this.original : this.modified;
        }
        getCellByUri(cellUri) {
            if (cellUri.toString() === this.original.uri.toString()) {
                return this.original;
            }
            else {
                return this.modified;
            }
        }
    }
    exports.SideBySideDiffElementViewModel = SideBySideDiffElementViewModel;
    class SingleSideDiffElementViewModel extends DiffElementViewModelBase {
        constructor(mainDocumentTextModel, otherDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData);
            this.otherDocumentTextModel = otherDocumentTextModel;
            this.type = type;
            this._register(this.cellViewModel.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
        }
        get cellViewModel() {
            return this.type === 'insert' ? this.modified : this.original;
        }
        get originalDocument() {
            if (this.type === 'insert') {
                return this.otherDocumentTextModel;
            }
            else {
                return this.mainDocumentTextModel;
            }
        }
        get modifiedDocument() {
            if (this.type === 'insert') {
                return this.mainDocumentTextModel;
            }
            else {
                return this.otherDocumentTextModel;
            }
        }
        getNestedCellViewModel(diffSide) {
            return this.type === 'insert' ? this.modified : this.original;
        }
        checkIfOutputsModified() {
            return false;
        }
        checkMetadataIfModified() {
            return false;
        }
        updateOutputHeight(diffSide, index, height) {
            var _a;
            (_a = this.cellViewModel) === null || _a === void 0 ? void 0 : _a.updateOutputHeight(index, height);
        }
        getOutputOffsetInContainer(diffSide, index) {
            return this.cellViewModel.getOutputOffset(index);
        }
        getOutputOffsetInCell(diffSide, index) {
            const offsetInOutputsContainer = this.cellViewModel.getOutputOffset(index);
            return this._layoutInfo.editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.bodyMargin / 2
                + offsetInOutputsContainer;
        }
        isOutputEmpty() {
            var _a, _b;
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return true;
            }
            // outputs are not changed
            return (((_a = this.original) === null || _a === void 0 ? void 0 : _a.outputs) || ((_b = this.modified) === null || _b === void 0 ? void 0 : _b.outputs) || []).length === 0;
        }
        getRichOutputTotalHeight() {
            var _a, _b;
            return (_b = (_a = this.cellViewModel) === null || _a === void 0 ? void 0 : _a.getOutputTotalHeight()) !== null && _b !== void 0 ? _b : 0;
        }
        getCellByUri(cellUri) {
            return this.cellViewModel;
        }
    }
    exports.SingleSideDiffElementViewModel = SingleSideDiffElementViewModel;
    var OutputComparison;
    (function (OutputComparison) {
        OutputComparison[OutputComparison["Unchanged"] = 0] = "Unchanged";
        OutputComparison[OutputComparison["Metadata"] = 1] = "Metadata";
        OutputComparison[OutputComparison["Other"] = 2] = "Other";
    })(OutputComparison = exports.OutputComparison || (exports.OutputComparison = {}));
    function outputEqual(a, b) {
        if ((0, hash_1.hash)(a.metadata) === (0, hash_1.hash)(b.metadata)) {
            return 2 /* OutputComparison.Other */;
        }
        // metadata not equal
        for (let j = 0; j < a.outputs.length; j++) {
            const aOutputItem = a.outputs[j];
            const bOutputItem = b.outputs[j];
            if (aOutputItem.mime !== bOutputItem.mime) {
                return 2 /* OutputComparison.Other */;
            }
            if (aOutputItem.data.buffer.length !== bOutputItem.data.buffer.length) {
                return 2 /* OutputComparison.Other */;
            }
            for (let k = 0; k < aOutputItem.data.buffer.length; k++) {
                if (aOutputItem.data.buffer[k] !== bOutputItem.data.buffer[k]) {
                    return 2 /* OutputComparison.Other */;
                }
            }
        }
        return 1 /* OutputComparison.Metadata */;
    }
    exports.outputEqual = outputEqual;
    function outputsEqual(original, modified) {
        if (original.length !== modified.length) {
            return 2 /* OutputComparison.Other */;
        }
        const len = original.length;
        for (let i = 0; i < len; i++) {
            const a = original[i];
            const b = modified[i];
            if ((0, hash_1.hash)(a.metadata) !== (0, hash_1.hash)(b.metadata)) {
                return 1 /* OutputComparison.Metadata */;
            }
            if (a.outputs.length !== b.outputs.length) {
                return 2 /* OutputComparison.Other */;
            }
            for (let j = 0; j < a.outputs.length; j++) {
                const aOutputItem = a.outputs[j];
                const bOutputItem = b.outputs[j];
                if (aOutputItem.mime !== bOutputItem.mime) {
                    return 2 /* OutputComparison.Other */;
                }
                if (aOutputItem.data.buffer.length !== bOutputItem.data.buffer.length) {
                    return 2 /* OutputComparison.Other */;
                }
                for (let k = 0; k < aOutputItem.data.buffer.length; k++) {
                    if (aOutputItem.data.buffer[k] !== bOutputItem.data.buffer[k]) {
                        return 2 /* OutputComparison.Other */;
                    }
                }
            }
        }
        return 0 /* OutputComparison.Unchanged */;
    }
    function getFormattedMetadataJSON(documentTextModel, metadata, language) {
        let filteredMetadata = {};
        if (documentTextModel) {
            const transientCellMetadata = documentTextModel.transientOptions.transientCellMetadata;
            const keys = new Set([...Object.keys(metadata)]);
            for (const key of keys) {
                if (!(transientCellMetadata[key])) {
                    filteredMetadata[key] = metadata[key];
                }
            }
        }
        else {
            filteredMetadata = metadata;
        }
        const obj = Object.assign({ language }, filteredMetadata);
        const metadataSource = (0, jsonFormatter_1.toFormattedString)(obj, {});
        return metadataSource;
    }
    exports.getFormattedMetadataJSON = getFormattedMetadataJSON;
    function getStreamOutputData(outputs) {
        if (!outputs.length) {
            return null;
        }
        const first = outputs[0];
        const mime = first.mime;
        const sameStream = !outputs.find(op => op.mime !== mime);
        if (sameStream) {
            return outputs.map(opit => opit.data.toString()).join('');
        }
        else {
            return null;
        }
    }
    exports.getStreamOutputData = getStreamOutputData;
    function getFormattedOutputJSON(outputs) {
        if (outputs.length === 1) {
            const streamOutputData = getStreamOutputData(outputs[0].outputs);
            if (streamOutputData) {
                return streamOutputData;
            }
        }
        return JSON.stringify(outputs.map(output => {
            return ({
                metadata: output.metadata,
                outputItems: output.outputs.map(opit => ({
                    mimeType: opit.mime,
                    data: opit.data.toString()
                }))
            });
        }), undefined, '\t');
    }
    exports.getFormattedOutputJSON = getFormattedOutputJSON;
});
//# sourceMappingURL=diffElementViewModel.js.map