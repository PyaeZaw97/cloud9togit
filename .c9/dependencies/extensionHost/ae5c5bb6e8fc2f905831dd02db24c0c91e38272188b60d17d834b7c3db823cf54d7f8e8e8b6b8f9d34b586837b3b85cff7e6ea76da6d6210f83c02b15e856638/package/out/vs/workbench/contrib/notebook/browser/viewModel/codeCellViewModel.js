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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/editor/common/services/resolverService", "vs/editor/common/model/prefixSumComputer", "vs/platform/configuration/common/configuration", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/cellOutputViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKeymapService", "vs/workbench/contrib/notebook/common/notebookService", "./baseCellViewModel"], function (require, exports, event_1, lifecycle_1, UUID, codeEditorService_1, resolverService_1, prefixSumComputer_1, configuration_1, undoRedo_1, notebookBrowser_1, cellOutputViewModel_1, notebookCommon_1, notebookKeymapService_1, notebookService_1, baseCellViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellViewModel = void 0;
    let CodeCellViewModel = class CodeCellViewModel extends baseCellViewModel_1.BaseCellViewModel {
        constructor(viewType, model, initialNotebookLayoutInfo, viewContext, configurationService, _notebookService, modelService, undoRedoService, keymapService, codeEditorService) {
            super(viewType, model, UUID.generateUuid(), viewContext, configurationService, modelService, undoRedoService, codeEditorService);
            this.viewContext = viewContext;
            this._notebookService = _notebookService;
            this.cellKind = notebookCommon_1.CellKind.Code;
            this._onLayoutInfoRead = this._register(new event_1.Emitter());
            this.onLayoutInfoRead = this._onLayoutInfoRead.event;
            this._onDidChangeOutputs = this._register(new event_1.Emitter());
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            this._onDidRemoveOutputs = this._register(new event_1.Emitter());
            this.onDidRemoveOutputs = this._onDidRemoveOutputs.event;
            this._outputCollection = [];
            this._outputsTop = null;
            this._pauseableEmitter = this._register(new event_1.PauseableEmitter());
            this.onDidChangeLayout = this._pauseableEmitter.event;
            this._editorHeight = 0;
            this._commentHeight = 0;
            this._hoveringOutput = false;
            this._focusOnOutput = false;
            this._outputMinHeight = 0;
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            this._outputViewModels = this.model.outputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService));
            this._register(this.model.onDidChangeOutputs((splice) => {
                const removedOutputs = [];
                this._outputCollection.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(() => 0));
                removedOutputs.push(...this._outputViewModels.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService))));
                this._outputsTop = null;
                this._onDidChangeOutputs.fire(splice);
                this._onDidRemoveOutputs.fire(removedOutputs);
                this.layoutChange({ outputHeight: true }, 'CodeCellViewModel#model.onDidChangeOutputs');
                (0, lifecycle_1.dispose)(removedOutputs);
            }));
            this._outputCollection = new Array(this.model.outputs.length);
            this._layoutInfo = {
                fontInfo: (initialNotebookLayoutInfo === null || initialNotebookLayoutInfo === void 0 ? void 0 : initialNotebookLayoutInfo.fontInfo) || null,
                editorHeight: 0,
                editorWidth: initialNotebookLayoutInfo
                    ? this.viewContext.notebookOptions.computeCodeCellEditorWidth(initialNotebookLayoutInfo.width)
                    : 0,
                statusBarHeight: 0,
                commentHeight: 0,
                outputContainerOffset: 0,
                outputTotalHeight: 0,
                outputShowMoreContainerHeight: 0,
                outputShowMoreContainerOffset: 0,
                totalHeight: this.computeTotalHeight(17, 0, 0),
                codeIndicatorHeight: 0,
                outputIndicatorHeight: 0,
                bottomToolbarOffset: 0,
                layoutState: notebookBrowser_1.CellLayoutState.Uninitialized,
            };
        }
        set editorHeight(height) {
            this._editorHeight = height;
            this.layoutChange({ editorHeight: true }, 'CodeCellViewModel#editorHeight');
        }
        get editorHeight() {
            throw new Error('editorHeight is write-only');
        }
        set commentHeight(height) {
            if (this._commentHeight === height) {
                return;
            }
            this._commentHeight = height;
            this.layoutChange({ commentHeight: true }, 'CodeCellViewModel#commentHeight');
        }
        get outputIsHovered() {
            return this._hoveringOutput;
        }
        set outputIsHovered(v) {
            this._hoveringOutput = v;
            this._onDidChangeState.fire({ outputIsHoveredChanged: true });
        }
        get outputIsFocused() {
            return this._focusOnOutput;
        }
        set outputIsFocused(v) {
            this._focusOnOutput = v;
            this._onDidChangeState.fire({ outputIsFocusedChanged: true });
        }
        get outputMinHeight() {
            return this._outputMinHeight;
        }
        /**
         * The minimum height of the output region. It's only set to non-zero temporarily when replacing an output with a new one.
         * It's reset to 0 when the new output is rendered, or in one second.
         */
        set outputMinHeight(newMin) {
            this._outputMinHeight = newMin;
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        get outputsViewModels() {
            return this._outputViewModels;
        }
        updateOptions(e) {
            if (e.cellStatusBarVisibility || e.insertToolbarPosition || e.cellToolbarLocation) {
                this.layoutChange({});
            }
        }
        pauseLayout() {
            this._pauseableEmitter.pause();
        }
        resumeLayout() {
            this._pauseableEmitter.resume();
        }
        layoutChange(state, source) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            // recompute
            this._ensureOutputsTop();
            const notebookLayoutConfiguration = this.viewContext.notebookOptions.getLayoutConfiguration();
            const bottomToolbarDimensions = this.viewContext.notebookOptions.computeBottomToolbarDimensions();
            const outputShowMoreContainerHeight = state.outputShowMoreContainerHeight ? state.outputShowMoreContainerHeight : this._layoutInfo.outputShowMoreContainerHeight;
            const outputTotalHeight = Math.max(this._outputMinHeight, this.isOutputCollapsed ? notebookLayoutConfiguration.collapsedIndicatorHeight : this._outputsTop.getTotalSum());
            const commentHeight = state.commentHeight ? this._commentHeight : this._layoutInfo.commentHeight;
            const originalLayout = this.layoutInfo;
            if (!this.isInputCollapsed) {
                let newState;
                let editorHeight;
                let totalHeight;
                if (!state.editorHeight && this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.FromCache && !state.outputHeight) {
                    // No new editorHeight info - keep cached totalHeight and estimate editorHeight
                    editorHeight = this.estimateEditorHeight((_b = (_a = state.font) === null || _a === void 0 ? void 0 : _a.lineHeight) !== null && _b !== void 0 ? _b : (_c = this._layoutInfo.fontInfo) === null || _c === void 0 ? void 0 : _c.lineHeight);
                    totalHeight = this._layoutInfo.totalHeight;
                    newState = notebookBrowser_1.CellLayoutState.FromCache;
                }
                else if (state.editorHeight || this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Measured) {
                    // Editor has been measured
                    editorHeight = this._editorHeight;
                    totalHeight = this.computeTotalHeight(this._editorHeight, outputTotalHeight, outputShowMoreContainerHeight);
                    newState = notebookBrowser_1.CellLayoutState.Measured;
                }
                else {
                    editorHeight = this.estimateEditorHeight((_e = (_d = state.font) === null || _d === void 0 ? void 0 : _d.lineHeight) !== null && _e !== void 0 ? _e : (_f = this._layoutInfo.fontInfo) === null || _f === void 0 ? void 0 : _f.lineHeight);
                    totalHeight = this.computeTotalHeight(editorHeight, outputTotalHeight, outputShowMoreContainerHeight);
                    newState = notebookBrowser_1.CellLayoutState.Estimated;
                }
                const statusBarHeight = this.viewContext.notebookOptions.computeEditorStatusbarHeight(this.internalMetadata, this.uri);
                const codeIndicatorHeight = editorHeight + statusBarHeight;
                const outputIndicatorHeight = outputTotalHeight + outputShowMoreContainerHeight;
                const outputContainerOffset = notebookLayoutConfiguration.editorToolbarHeight
                    + notebookLayoutConfiguration.cellTopMargin // CELL_TOP_MARGIN
                    + editorHeight
                    + statusBarHeight;
                const outputShowMoreContainerOffset = totalHeight
                    - bottomToolbarDimensions.bottomToolbarGap
                    - bottomToolbarDimensions.bottomToolbarHeight / 2
                    - outputShowMoreContainerHeight;
                const bottomToolbarOffset = this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType);
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeCodeCellEditorWidth(state.outerWidth)
                    : (_g = this._layoutInfo) === null || _g === void 0 ? void 0 : _g.editorWidth;
                this._layoutInfo = {
                    fontInfo: (_j = (_h = state.font) !== null && _h !== void 0 ? _h : this._layoutInfo.fontInfo) !== null && _j !== void 0 ? _j : null,
                    editorHeight,
                    editorWidth,
                    statusBarHeight,
                    commentHeight,
                    outputContainerOffset,
                    outputTotalHeight,
                    outputShowMoreContainerHeight,
                    outputShowMoreContainerOffset,
                    totalHeight,
                    codeIndicatorHeight,
                    outputIndicatorHeight,
                    bottomToolbarOffset,
                    layoutState: newState,
                };
            }
            else {
                const codeIndicatorHeight = notebookLayoutConfiguration.collapsedIndicatorHeight;
                const outputIndicatorHeight = outputTotalHeight + outputShowMoreContainerHeight;
                const outputContainerOffset = notebookLayoutConfiguration.cellTopMargin + notebookLayoutConfiguration.collapsedIndicatorHeight;
                const totalHeight = notebookLayoutConfiguration.cellTopMargin
                    + notebookLayoutConfiguration.collapsedIndicatorHeight
                    + notebookLayoutConfiguration.cellBottomMargin //CELL_BOTTOM_MARGIN
                    + bottomToolbarDimensions.bottomToolbarGap //BOTTOM_CELL_TOOLBAR_GAP
                    + commentHeight
                    + outputTotalHeight + outputShowMoreContainerHeight;
                const outputShowMoreContainerOffset = totalHeight
                    - bottomToolbarDimensions.bottomToolbarGap
                    - bottomToolbarDimensions.bottomToolbarHeight / 2
                    - outputShowMoreContainerHeight;
                const bottomToolbarOffset = this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType);
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeCodeCellEditorWidth(state.outerWidth)
                    : (_k = this._layoutInfo) === null || _k === void 0 ? void 0 : _k.editorWidth;
                this._layoutInfo = {
                    fontInfo: (_m = (_l = state.font) !== null && _l !== void 0 ? _l : this._layoutInfo.fontInfo) !== null && _m !== void 0 ? _m : null,
                    editorHeight: this._layoutInfo.editorHeight,
                    editorWidth,
                    statusBarHeight: 0,
                    commentHeight,
                    outputContainerOffset,
                    outputTotalHeight,
                    outputShowMoreContainerHeight,
                    outputShowMoreContainerOffset,
                    totalHeight,
                    codeIndicatorHeight,
                    outputIndicatorHeight,
                    bottomToolbarOffset,
                    layoutState: this._layoutInfo.layoutState,
                };
            }
            state.totalHeight = this.layoutInfo.totalHeight !== originalLayout.totalHeight;
            state.source = source;
            this._fireOnDidChangeLayout(state);
        }
        _fireOnDidChangeLayout(state) {
            this._pauseableEmitter.fire(state);
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            super.restoreEditorViewState(editorViewStates);
            if (totalHeight !== undefined && this._layoutInfo.layoutState !== notebookBrowser_1.CellLayoutState.Measured) {
                this._layoutInfo = {
                    fontInfo: this._layoutInfo.fontInfo,
                    editorHeight: this._layoutInfo.editorHeight,
                    editorWidth: this._layoutInfo.editorWidth,
                    statusBarHeight: this.layoutInfo.statusBarHeight,
                    commentHeight: this.layoutInfo.commentHeight,
                    outputContainerOffset: this._layoutInfo.outputContainerOffset,
                    outputTotalHeight: this._layoutInfo.outputTotalHeight,
                    outputShowMoreContainerHeight: this._layoutInfo.outputShowMoreContainerHeight,
                    outputShowMoreContainerOffset: this._layoutInfo.outputShowMoreContainerOffset,
                    totalHeight: totalHeight,
                    codeIndicatorHeight: this._layoutInfo.codeIndicatorHeight,
                    outputIndicatorHeight: this._layoutInfo.outputIndicatorHeight,
                    bottomToolbarOffset: this._layoutInfo.bottomToolbarOffset,
                    layoutState: notebookBrowser_1.CellLayoutState.FromCache
                };
            }
        }
        hasDynamicHeight() {
            // CodeCellVM always measures itself and controls its cell's height
            return false;
        }
        getDynamicHeight() {
            this._onLayoutInfoRead.fire();
            return this._layoutInfo.totalHeight;
        }
        firstLine() {
            return this.getText().split('\n')[0];
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                const editorHeight = this.estimateEditorHeight(lineHeight);
                return this.computeTotalHeight(editorHeight, 0, 0);
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        estimateEditorHeight(lineHeight = 20) {
            let hasScrolling = false;
            if (this.layoutInfo.fontInfo) {
                for (let i = 0; i < this.lineCount; i++) {
                    const max = this.textBuffer.getLineLastNonWhitespaceColumn(i + 1);
                    const estimatedWidth = max * (this.layoutInfo.fontInfo.typicalHalfwidthCharacterWidth + this.layoutInfo.fontInfo.letterSpacing);
                    if (estimatedWidth > this.layoutInfo.editorWidth) {
                        hasScrolling = true;
                        break;
                    }
                }
            }
            const verticalScrollbarHeight = hasScrolling ? 12 : 0; // take zoom level into account
            const editorPadding = this.viewContext.notebookOptions.computeEditorPadding(this.internalMetadata, this.uri);
            return this.lineCount * lineHeight
                + editorPadding.top
                + editorPadding.bottom // EDITOR_BOTTOM_PADDING
                + verticalScrollbarHeight;
        }
        computeTotalHeight(editorHeight, outputsTotalHeight, outputShowMoreContainerHeight) {
            const layoutConfiguration = this.viewContext.notebookOptions.getLayoutConfiguration();
            const { bottomToolbarGap } = this.viewContext.notebookOptions.computeBottomToolbarDimensions(this.viewType);
            return layoutConfiguration.editorToolbarHeight
                + layoutConfiguration.cellTopMargin
                + editorHeight
                + this.viewContext.notebookOptions.computeEditorStatusbarHeight(this.internalMetadata, this.uri)
                + this._commentHeight
                + outputsTotalHeight
                + outputShowMoreContainerHeight
                + bottomToolbarGap
                + layoutConfiguration.cellBottomMargin;
        }
        onDidChangeTextModelContent() {
            if (this.getEditState() !== notebookBrowser_1.CellEditState.Editing) {
                this.updateEditState(notebookBrowser_1.CellEditState.Editing, 'onDidChangeTextModelContent');
                this._onDidChangeState.fire({ contentChanged: true });
            }
        }
        onDeselect() {
            this.updateEditState(notebookBrowser_1.CellEditState.Preview, 'onDeselect');
        }
        updateOutputShowMoreContainerHeight(height) {
            this.layoutChange({ outputShowMoreContainerHeight: height }, 'CodeCellViewModel#updateOutputShowMoreContainerHeight');
        }
        updateOutputMinHeight(height) {
            this.outputMinHeight = height;
        }
        unlockOutputHeight() {
            this.outputMinHeight = 0;
            this.layoutChange({ outputHeight: true });
        }
        updateOutputHeight(index, height, source) {
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            this._ensureOutputsTop();
            if (height < 28 && this._outputViewModels[index].hasMultiMimeType()) {
                height = 28;
            }
            this._outputCollection[index] = height;
            if (this._outputsTop.setValue(index, height)) {
                this.layoutChange({ outputHeight: true }, source);
            }
        }
        getOutputHeight(index) {
            if (index >= this._outputCollection.length) {
                return -1;
            }
            this._ensureOutputsTop();
            return this._outputCollection[index];
        }
        getOutputOffsetInContainer(index) {
            this._ensureOutputsTop();
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            return this._outputsTop.getPrefixSum(index - 1);
        }
        getOutputOffset(index) {
            return this.layoutInfo.outputContainerOffset + this.getOutputOffsetInContainer(index);
        }
        spliceOutputHeights(start, deleteCnt, heights) {
            this._ensureOutputsTop();
            this._outputsTop.removeValues(start, deleteCnt);
            if (heights.length) {
                const values = new Uint32Array(heights.length);
                for (let i = 0; i < heights.length; i++) {
                    values[i] = heights[i];
                }
                this._outputsTop.insertValues(start, values);
            }
            this.layoutChange({ outputHeight: true }, 'CodeCellViewModel#spliceOutputs');
        }
        _ensureOutputsTop() {
            if (!this._outputsTop) {
                const values = new Uint32Array(this._outputCollection.length);
                for (let i = 0; i < this._outputCollection.length; i++) {
                    values[i] = this._outputCollection[i];
                }
                this._outputsTop = new prefixSumComputer_1.PrefixSumComputer(values);
            }
        }
        startFind(value, options) {
            const matches = super.cellStartFind(value, options);
            if (matches === null) {
                return null;
            }
            return {
                cell: this,
                matches,
                modelMatchCount: matches.length
            };
        }
        dispose() {
            super.dispose();
            this._outputCollection = [];
            this._outputsTop = null;
            (0, lifecycle_1.dispose)(this._outputViewModels);
        }
    };
    CodeCellViewModel = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, notebookService_1.INotebookService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, undoRedo_1.IUndoRedoService),
        __param(8, notebookKeymapService_1.INotebookKeymapService),
        __param(9, codeEditorService_1.ICodeEditorService)
    ], CodeCellViewModel);
    exports.CodeCellViewModel = CodeCellViewModel;
});
//# sourceMappingURL=codeCellViewModel.js.map