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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/base/common/cancellation", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/diff/notebookTextDiffList", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/notebook/common/services/notebookWorkerService", "vs/platform/configuration/common/configuration", "vs/editor/common/config/fontInfo", "vs/base/browser/browser", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/async", "vs/base/common/uuid", "vs/workbench/contrib/notebook/browser/diff/diffNestedCellViewModel", "vs/workbench/contrib/notebook/browser/view/renderers/backLayerWebView", "vs/workbench/contrib/notebook/browser/diff/eventDispatcher", "vs/editor/browser/config/fontMeasurements", "vs/workbench/contrib/notebook/common/notebookOptions", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, nls, DOM, storage_1, telemetry_1, themeService_1, notebookEditorWidget_1, cancellation_1, diffElementViewModel_1, instantiation_1, notebookTextDiffList_1, contextkey_1, colorRegistry_1, notebookWorkerService_1, configuration_1, fontInfo_1, browser_1, notebookDiffEditorBrowser_1, event_1, lifecycle_1, editorPane_1, notebookCommon_1, async_1, uuid_1, diffNestedCellViewModel_1, backLayerWebView_1, eventDispatcher_1, fontMeasurements_1, notebookOptions_1, notebookExecutionStateService_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextDiffEditor = void 0;
    const $ = DOM.$;
    class NotebookDiffEditorSelection {
        constructor(selections) {
            this.selections = selections;
        }
        compare(other) {
            if (!(other instanceof NotebookDiffEditorSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if (this.selections.length !== other.selections.length) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            for (let i = 0; i < this.selections.length; i++) {
                if (this.selections[i] !== other.selections[i]) {
                    return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
                }
            }
            return 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
        }
        restore(options) {
            const notebookOptions = {
                cellSelections: (0, notebookRange_1.cellIndexesToRanges)(this.selections)
            };
            Object.assign(notebookOptions, options);
            return notebookOptions;
        }
    }
    let NotebookTextDiffEditor = class NotebookTextDiffEditor extends editorPane_1.EditorPane {
        constructor(instantiationService, themeService, contextKeyService, notebookEditorWorkerService, configurationService, telemetryService, storageService, notebookExecutionStateService) {
            super(NotebookTextDiffEditor.ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.notebookEditorWorkerService = notebookEditorWorkerService;
            this.configurationService = configurationService;
            this.creationOptions = (0, notebookEditorWidget_1.getDefaultNotebookCreationOptions)();
            this._dimension = null;
            this._diffElementViewModels = [];
            this._modifiedWebview = null;
            this._originalWebview = null;
            this._webviewTransparentCover = null;
            this._onMouseUp = this._register(new event_1.Emitter());
            this.onMouseUp = this._onMouseUp.event;
            this._model = null;
            this._modifiedResourceDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._insetModifyQueueByOutputId = new async_1.SequencerByKey();
            this._onDidDynamicOutputRendered = this._register(new event_1.Emitter());
            this.onDidDynamicOutputRendered = this._onDidDynamicOutputRendered.event;
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._isDisposed = false;
            this.pendingLayouts = new WeakMap();
            this._notebookOptions = new notebookOptions_1.NotebookOptions(this.configurationService, notebookExecutionStateService);
            this._register(this._notebookOptions);
            const editorOptions = this.configurationService.getValue('editor');
            this._fontInfo = fontMeasurements_1.FontMeasurements.readFontInfo(fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.PixelRatio.value));
            this._revealFirst = true;
        }
        get textModel() {
            var _a;
            return (_a = this._model) === null || _a === void 0 ? void 0 : _a.modified.notebook;
        }
        get notebookOptions() {
            return this._notebookOptions;
        }
        get isDisposed() {
            return this._isDisposed;
        }
        getSelection() {
            const selections = this._list.getFocus();
            return new NotebookDiffEditorSelection(selections);
        }
        toggleNotebookCellSelection(cell) {
            // throw new Error('Method not implemented.');
        }
        focusNotebookCell(cell, focus) {
            // throw new Error('Method not implemented.');
        }
        focusNextNotebookCell(cell, focus) {
            // throw new Error('Method not implemented.');
        }
        updateOutputHeight(cellInfo, output, outputHeight, isInit) {
            var _a;
            const diffElement = cellInfo.diffElement;
            const cell = this.getCellByInfo(cellInfo);
            const outputIndex = cell.outputsViewModels.indexOf(output);
            if (diffElement instanceof diffElementViewModel_1.SideBySideDiffElementViewModel) {
                const info = notebookCommon_1.CellUri.parse(cellInfo.cellUri);
                if (!info) {
                    return;
                }
                diffElement.updateOutputHeight(info.notebook.toString() === ((_a = this._model) === null || _a === void 0 ? void 0 : _a.original.resource.toString()) ? notebookDiffEditorBrowser_1.DiffSide.Original : notebookDiffEditorBrowser_1.DiffSide.Modified, outputIndex, outputHeight);
            }
            else {
                diffElement.updateOutputHeight(diffElement.type === 'insert' ? notebookDiffEditorBrowser_1.DiffSide.Modified : notebookDiffEditorBrowser_1.DiffSide.Original, outputIndex, outputHeight);
            }
            if (isInit) {
                this._onDidDynamicOutputRendered.fire({ cell, output });
            }
        }
        setMarkupCellEditState(cellId, editState) {
            // throw new Error('Method not implemented.');
        }
        didStartDragMarkupCell(cellId, event) {
            // throw new Error('Method not implemented.');
        }
        didDragMarkupCell(cellId, event) {
            // throw new Error('Method not implemented.');
        }
        didEndDragMarkupCell(cellId) {
            // throw new Error('Method not implemented.');
        }
        didDropMarkupCell(cellId) {
            // throw new Error('Method not implemented.');
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.notebook-text-diff-editor'));
            this._overflowContainer = document.createElement('div');
            this._overflowContainer.classList.add('notebook-overflow-widget-container', 'monaco-editor');
            DOM.append(parent, this._overflowContainer);
            const renderers = [
                this.instantiationService.createInstance(notebookTextDiffList_1.CellDiffSingleSideRenderer, this),
                this.instantiationService.createInstance(notebookTextDiffList_1.CellDiffSideBySideRenderer, this),
            ];
            this._list = this.instantiationService.createInstance(notebookTextDiffList_1.NotebookTextDiffList, 'NotebookTextDiff', this._rootElement, this.instantiationService.createInstance(notebookTextDiffList_1.NotebookCellTextDiffListDelegate), renderers, this.contextKeyService, {
                setRowLineHeight: false,
                setRowHeight: false,
                supportDynamicHeights: true,
                horizontalScrolling: false,
                keyboardSupport: false,
                mouseSupport: true,
                multipleSelectionSupport: false,
                enableKeyboardNavigation: true,
                additionalScrollHeight: 0,
                // transformOptimization: (isMacintosh && isNative) || getTitleBarStyle(this.configurationService, this.environmentService) === 'native',
                styleController: (_suffix) => { return this._list; },
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground,
                    listActiveSelectionBackground: colorRegistry_1.editorBackground,
                    listActiveSelectionForeground: colorRegistry_1.foreground,
                    listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                    listFocusAndSelectionForeground: colorRegistry_1.foreground,
                    listFocusBackground: colorRegistry_1.editorBackground,
                    listFocusForeground: colorRegistry_1.foreground,
                    listHoverForeground: colorRegistry_1.foreground,
                    listHoverBackground: colorRegistry_1.editorBackground,
                    listHoverOutline: colorRegistry_1.focusBorder,
                    listFocusOutline: colorRegistry_1.focusBorder,
                    listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                    listInactiveSelectionForeground: colorRegistry_1.foreground,
                    listInactiveFocusBackground: colorRegistry_1.editorBackground,
                    listInactiveFocusOutline: colorRegistry_1.editorBackground,
                },
                accessibilityProvider: {
                    getAriaLabel() { return null; },
                    getWidgetAriaLabel() {
                        return nls.localize('notebookTreeAriaLabel', "Notebook Text Diff");
                    }
                },
                // focusNextPreviousDelegate: {
                // 	onFocusNext: (applyFocusNext: () => void) => this._updateForCursorNavigationMode(applyFocusNext),
                // 	onFocusPrevious: (applyFocusPrevious: () => void) => this._updateForCursorNavigationMode(applyFocusPrevious),
                // }
            });
            this._register(this._list);
            this._register(this._list.onMouseUp(e => {
                if (e.element) {
                    this._onMouseUp.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onDidChangeFocus(() => this._onDidChangeSelection.fire({ reason: 2 /* EditorPaneSelectionChangeReason.USER */ })));
            // transparent cover
            this._webviewTransparentCover = DOM.append(this._list.rowsContainer, $('.webview-cover'));
            this._webviewTransparentCover.style.display = 'none';
            this._register(DOM.addStandardDisposableGenericMouseDownListener(this._overflowContainer, (e) => {
                if (e.target.classList.contains('slider') && this._webviewTransparentCover) {
                    this._webviewTransparentCover.style.display = 'block';
                }
            }));
            this._register(DOM.addStandardDisposableGenericMouseUpListener(this._overflowContainer, () => {
                if (this._webviewTransparentCover) {
                    // no matter when
                    this._webviewTransparentCover.style.display = 'none';
                }
            }));
            this._register(this._list.onDidScroll(e => {
                this._webviewTransparentCover.style.top = `${e.scrollTop}px`;
            }));
        }
        _updateOutputsOffsetsInWebview(scrollTop, scrollHeight, activeWebview, getActiveNestedCell, diffSide) {
            activeWebview.element.style.height = `${scrollHeight}px`;
            if (activeWebview.insetMapping) {
                const updateItems = [];
                const removedItems = [];
                activeWebview.insetMapping.forEach((value, key) => {
                    const cell = getActiveNestedCell(value.cellInfo.diffElement);
                    if (!cell) {
                        return;
                    }
                    const viewIndex = this._list.indexOf(value.cellInfo.diffElement);
                    if (viewIndex === undefined) {
                        return;
                    }
                    if (cell.outputsViewModels.indexOf(key) < 0) {
                        // output is already gone
                        removedItems.push(key);
                    }
                    else {
                        const cellTop = this._list.getAbsoluteTopOfElement(value.cellInfo.diffElement);
                        const outputIndex = cell.outputsViewModels.indexOf(key);
                        const outputOffset = value.cellInfo.diffElement.getOutputOffsetInCell(diffSide, outputIndex);
                        updateItems.push({
                            cell,
                            output: key,
                            cellTop: cellTop,
                            outputOffset: outputOffset,
                            forceDisplay: false
                        });
                    }
                });
                activeWebview.removeInsets(removedItems);
                if (updateItems.length) {
                    activeWebview.updateScrollTops(updateItems, []);
                }
            }
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            const model = await input.resolve();
            if (this._model !== model) {
                this._detachModel();
                this._model = model;
                this._attachModel();
            }
            this._model = model;
            if (this._model === null) {
                return;
            }
            this._revealFirst = true;
            this._modifiedResourceDisposableStore.clear();
            this._layoutCancellationTokenSource = new cancellation_1.CancellationTokenSource();
            this._modifiedResourceDisposableStore.add(event_1.Event.any(this._model.original.notebook.onDidChangeContent, this._model.modified.notebook.onDidChangeContent)(e => {
                var _a;
                if (this._model !== null) {
                    (_a = this._layoutCancellationTokenSource) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._layoutCancellationTokenSource = new cancellation_1.CancellationTokenSource();
                    this.updateLayout(this._layoutCancellationTokenSource.token);
                }
            }));
            await this._createOriginalWebview((0, uuid_1.generateUuid)(), this._model.original.resource);
            if (this._originalWebview) {
                this._modifiedResourceDisposableStore.add(this._originalWebview);
            }
            await this._createModifiedWebview((0, uuid_1.generateUuid)(), this._model.modified.resource);
            if (this._modifiedWebview) {
                this._modifiedResourceDisposableStore.add(this._modifiedWebview);
            }
            await this.updateLayout(this._layoutCancellationTokenSource.token, (options === null || options === void 0 ? void 0 : options.cellSelections) ? (0, notebookRange_1.cellRangesToIndexes)(options.cellSelections) : undefined);
        }
        _detachModel() {
            var _a, _b, _c, _d;
            this._localStore.clear();
            (_a = this._originalWebview) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._originalWebview) === null || _b === void 0 ? void 0 : _b.element.remove();
            this._originalWebview = null;
            (_c = this._modifiedWebview) === null || _c === void 0 ? void 0 : _c.dispose();
            (_d = this._modifiedWebview) === null || _d === void 0 ? void 0 : _d.element.remove();
            this._modifiedWebview = null;
            this._modifiedResourceDisposableStore.clear();
            this._list.clear();
        }
        _attachModel() {
            this._eventDispatcher = new eventDispatcher_1.NotebookDiffEditorEventDispatcher();
            const updateInsets = () => {
                DOM.scheduleAtNextAnimationFrame(() => {
                    if (this._isDisposed) {
                        return;
                    }
                    if (this._modifiedWebview) {
                        this._updateOutputsOffsetsInWebview(this._list.scrollTop, this._list.scrollHeight, this._modifiedWebview, (diffElement) => {
                            return diffElement.modified;
                        }, notebookDiffEditorBrowser_1.DiffSide.Modified);
                    }
                    if (this._originalWebview) {
                        this._updateOutputsOffsetsInWebview(this._list.scrollTop, this._list.scrollHeight, this._originalWebview, (diffElement) => {
                            return diffElement.original;
                        }, notebookDiffEditorBrowser_1.DiffSide.Original);
                    }
                });
            };
            this._localStore.add(this._list.onDidChangeContentHeight(() => {
                updateInsets();
            }));
            this._localStore.add(this._eventDispatcher.onDidChangeCellLayout(() => {
                updateInsets();
            }));
        }
        async _createModifiedWebview(id, resource) {
            if (this._modifiedWebview) {
                this._modifiedWebview.dispose();
            }
            this._modifiedWebview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, this, id, resource, Object.assign(Object.assign({}, this._notebookOptions.computeDiffWebviewOptions()), { fontFamily: this._generateFontFamily() }), undefined);
            // attach the webview container to the DOM tree first
            this._list.rowsContainer.insertAdjacentElement('afterbegin', this._modifiedWebview.element);
            await this._modifiedWebview.createWebview();
            this._modifiedWebview.element.style.width = `calc(50% - 16px)`;
            this._modifiedWebview.element.style.left = `calc(50%)`;
        }
        _generateFontFamily() {
            var _a, _b;
            return (_b = (_a = this._fontInfo) === null || _a === void 0 ? void 0 : _a.fontFamily) !== null && _b !== void 0 ? _b : `"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`;
        }
        async _createOriginalWebview(id, resource) {
            if (this._originalWebview) {
                this._originalWebview.dispose();
            }
            this._originalWebview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, this, id, resource, Object.assign(Object.assign({}, this._notebookOptions.computeDiffWebviewOptions()), { fontFamily: this._generateFontFamily() }), undefined);
            // attach the webview container to the DOM tree first
            this._list.rowsContainer.insertAdjacentElement('afterbegin', this._originalWebview.element);
            await this._originalWebview.createWebview();
            this._originalWebview.element.style.width = `calc(50% - 16px)`;
            this._originalWebview.element.style.left = `16px`;
        }
        setOptions(options) {
            const selections = (options === null || options === void 0 ? void 0 : options.cellSelections) ? (0, notebookRange_1.cellRangesToIndexes)(options.cellSelections) : undefined;
            if (selections) {
                this._list.setFocus(selections);
            }
        }
        async updateLayout(token, selections) {
            var _a, _b, _c, _d;
            if (!this._model) {
                return;
            }
            const diffResult = await this.notebookEditorWorkerService.computeDiff(this._model.original.resource, this._model.modified.resource);
            if (token.isCancellationRequested) {
                // after await the editor might be disposed.
                return;
            }
            NotebookTextDiffEditor.prettyChanges(this._model, diffResult.cellsDiff);
            const { viewModels, firstChangeIndex } = NotebookTextDiffEditor.computeDiff(this.instantiationService, this.configurationService, this._model, this._eventDispatcher, diffResult);
            const isSame = this._isViewModelTheSame(viewModels);
            if (!isSame) {
                (_a = this._originalWebview) === null || _a === void 0 ? void 0 : _a.removeInsets([...(_b = this._originalWebview) === null || _b === void 0 ? void 0 : _b.insetMapping.keys()]);
                (_c = this._modifiedWebview) === null || _c === void 0 ? void 0 : _c.removeInsets([...(_d = this._modifiedWebview) === null || _d === void 0 ? void 0 : _d.insetMapping.keys()]);
                this._setViewModel(viewModels);
            }
            // this._diffElementViewModels = viewModels;
            // this._list.splice(0, this._list.length, this._diffElementViewModels);
            if (this._revealFirst && firstChangeIndex !== -1 && firstChangeIndex < this._list.length) {
                this._revealFirst = false;
                this._list.setFocus([firstChangeIndex]);
                this._list.reveal(firstChangeIndex, 0.3);
            }
            if (selections) {
                this._list.setFocus(selections);
            }
        }
        _isViewModelTheSame(viewModels) {
            var _a, _b, _c, _d;
            let isSame = true;
            if (this._diffElementViewModels.length === viewModels.length) {
                for (let i = 0; i < viewModels.length; i++) {
                    const a = this._diffElementViewModels[i];
                    const b = viewModels[i];
                    if (((_a = a.original) === null || _a === void 0 ? void 0 : _a.textModel.getHashValue()) !== ((_b = b.original) === null || _b === void 0 ? void 0 : _b.textModel.getHashValue())
                        || ((_c = a.modified) === null || _c === void 0 ? void 0 : _c.textModel.getHashValue()) !== ((_d = b.modified) === null || _d === void 0 ? void 0 : _d.textModel.getHashValue())) {
                        isSame = false;
                        break;
                    }
                }
            }
            else {
                isSame = false;
            }
            return isSame;
        }
        _setViewModel(viewModels) {
            this._diffElementViewModels = viewModels;
            this._list.splice(0, this._list.length, this._diffElementViewModels);
        }
        /**
         * making sure that swapping cells are always translated to `insert+delete`.
         */
        static prettyChanges(model, diffResult) {
            const changes = diffResult.changes;
            for (let i = 0; i < diffResult.changes.length - 1; i++) {
                // then we know there is another change after current one
                const curr = changes[i];
                const next = changes[i + 1];
                const x = curr.originalStart;
                const y = curr.modifiedStart;
                if (curr.originalLength === 1
                    && curr.modifiedLength === 0
                    && next.originalStart === x + 2
                    && next.originalLength === 0
                    && next.modifiedStart === y + 1
                    && next.modifiedLength === 1
                    && model.original.notebook.cells[x].getHashValue() === model.modified.notebook.cells[y + 1].getHashValue()
                    && model.original.notebook.cells[x + 1].getHashValue() === model.modified.notebook.cells[y].getHashValue()) {
                    // this is a swap
                    curr.originalStart = x;
                    curr.originalLength = 0;
                    curr.modifiedStart = y;
                    curr.modifiedLength = 1;
                    next.originalStart = x + 1;
                    next.originalLength = 1;
                    next.modifiedStart = y + 2;
                    next.modifiedLength = 0;
                    i++;
                }
            }
        }
        static computeDiff(instantiationService, configurationService, model, eventDispatcher, diffResult) {
            const cellChanges = diffResult.cellsDiff.changes;
            const diffElementViewModels = [];
            const originalModel = model.original.notebook;
            const modifiedModel = model.modified.notebook;
            let originalCellIndex = 0;
            let modifiedCellIndex = 0;
            let firstChangeIndex = -1;
            const initData = {
                metadataStatusHeight: configurationService.getValue('notebook.diff.ignoreMetadata') ? 0 : 25,
                outputStatusHeight: configurationService.getValue('notebook.diff.ignoreOutputs') || !!(modifiedModel.transientOptions.transientOutputs) ? 0 : 25
            };
            for (let i = 0; i < cellChanges.length; i++) {
                const change = cellChanges[i];
                // common cells
                for (let j = 0; j < change.originalStart - originalCellIndex; j++) {
                    const originalCell = originalModel.cells[originalCellIndex + j];
                    const modifiedCell = modifiedModel.cells[modifiedCellIndex + j];
                    if (originalCell.getHashValue() === modifiedCell.getHashValue()) {
                        diffElementViewModels.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(model.modified.notebook, model.original.notebook, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalCell), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedCell), 'unchanged', eventDispatcher, initData));
                    }
                    else {
                        if (firstChangeIndex === -1) {
                            firstChangeIndex = diffElementViewModels.length;
                        }
                        diffElementViewModels.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(model.modified.notebook, model.original.notebook, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalCell), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedCell), 'modified', eventDispatcher, initData));
                    }
                }
                const modifiedLCS = NotebookTextDiffEditor.computeModifiedLCS(instantiationService, change, originalModel, modifiedModel, eventDispatcher, initData);
                if (modifiedLCS.length && firstChangeIndex === -1) {
                    firstChangeIndex = diffElementViewModels.length;
                }
                diffElementViewModels.push(...modifiedLCS);
                originalCellIndex = change.originalStart + change.originalLength;
                modifiedCellIndex = change.modifiedStart + change.modifiedLength;
            }
            for (let i = originalCellIndex; i < originalModel.cells.length; i++) {
                diffElementViewModels.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(model.modified.notebook, model.original.notebook, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalModel.cells[i]), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedModel.cells[i - originalCellIndex + modifiedCellIndex]), 'unchanged', eventDispatcher, initData));
            }
            return {
                viewModels: diffElementViewModels,
                firstChangeIndex
            };
        }
        static computeModifiedLCS(instantiationService, change, originalModel, modifiedModel, eventDispatcher, initData) {
            const result = [];
            // modified cells
            const modifiedLen = Math.min(change.originalLength, change.modifiedLength);
            for (let j = 0; j < modifiedLen; j++) {
                const isTheSame = originalModel.cells[change.originalStart + j].equal(modifiedModel.cells[change.modifiedStart + j]);
                result.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(modifiedModel, originalModel, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalModel.cells[change.originalStart + j]), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedModel.cells[change.modifiedStart + j]), isTheSame ? 'unchanged' : 'modified', eventDispatcher, initData));
            }
            for (let j = modifiedLen; j < change.originalLength; j++) {
                // deletion
                result.push(new diffElementViewModel_1.SingleSideDiffElementViewModel(originalModel, modifiedModel, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalModel.cells[change.originalStart + j]), undefined, 'delete', eventDispatcher, initData));
            }
            for (let j = modifiedLen; j < change.modifiedLength; j++) {
                // insertion
                result.push(new diffElementViewModel_1.SingleSideDiffElementViewModel(modifiedModel, originalModel, undefined, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedModel.cells[change.modifiedStart + j]), 'insert', eventDispatcher, initData));
            }
            return result;
        }
        scheduleOutputHeightAck(cellInfo, outputId, height) {
            var _a;
            const diffElement = cellInfo.diffElement;
            // const activeWebview = diffSide === DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
            let diffSide = notebookDiffEditorBrowser_1.DiffSide.Original;
            if (diffElement instanceof diffElementViewModel_1.SideBySideDiffElementViewModel) {
                const info = notebookCommon_1.CellUri.parse(cellInfo.cellUri);
                if (!info) {
                    return;
                }
                diffSide = info.notebook.toString() === ((_a = this._model) === null || _a === void 0 ? void 0 : _a.original.resource.toString()) ? notebookDiffEditorBrowser_1.DiffSide.Original : notebookDiffEditorBrowser_1.DiffSide.Modified;
            }
            else {
                diffSide = diffElement.type === 'insert' ? notebookDiffEditorBrowser_1.DiffSide.Modified : notebookDiffEditorBrowser_1.DiffSide.Original;
            }
            const webview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
            DOM.scheduleAtNextAnimationFrame(() => {
                webview === null || webview === void 0 ? void 0 : webview.ackHeight([{ cellId: cellInfo.cellId, outputId, height }]);
            }, 10);
        }
        layoutNotebookCell(cell, height) {
            const relayout = (cell, height) => {
                this._list.updateElementHeight2(cell, height);
            };
            if (this.pendingLayouts.has(cell)) {
                this.pendingLayouts.get(cell).dispose();
            }
            let r;
            const layoutDisposable = DOM.scheduleAtNextAnimationFrame(() => {
                this.pendingLayouts.delete(cell);
                relayout(cell, height);
                r();
            });
            this.pendingLayouts.set(cell, (0, lifecycle_1.toDisposable)(() => {
                layoutDisposable.dispose();
                r();
            }));
            return new Promise(resolve => { r = resolve; });
        }
        setScrollTop(scrollTop) {
            this._list.scrollTop = scrollTop;
        }
        triggerScroll(event) {
            this._list.triggerScrollFromMouseWheelEvent(event);
        }
        createOutput(cellDiffViewModel, cellViewModel, output, getOffset, diffSide) {
            this._insetModifyQueueByOutputId.queue(output.source.model.outputId + (diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? '-right' : 'left'), async () => {
                const activeWebview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
                if (!activeWebview) {
                    return;
                }
                if (!activeWebview.insetMapping.has(output.source)) {
                    const cellTop = this._list.getAbsoluteTopOfElement(cellDiffViewModel);
                    await activeWebview.createOutput({ diffElement: cellDiffViewModel, cellHandle: cellViewModel.handle, cellId: cellViewModel.id, cellUri: cellViewModel.uri }, output, cellTop, getOffset());
                }
                else {
                    const cellTop = this._list.getAbsoluteTopOfElement(cellDiffViewModel);
                    const outputIndex = cellViewModel.outputsViewModels.indexOf(output.source);
                    const outputOffset = cellDiffViewModel.getOutputOffsetInCell(diffSide, outputIndex);
                    activeWebview.updateScrollTops([{
                            cell: cellViewModel,
                            output: output.source,
                            cellTop,
                            outputOffset,
                            forceDisplay: true
                        }], []);
                }
            });
        }
        updateMarkupCellHeight() {
            // TODO
        }
        getCellByInfo(cellInfo) {
            return cellInfo.diffElement.getCellByUri(cellInfo.cellUri);
        }
        getCellById(cellId) {
            throw new Error('Not implemented');
        }
        removeInset(cellDiffViewModel, cellViewModel, displayOutput, diffSide) {
            this._insetModifyQueueByOutputId.queue(displayOutput.model.outputId + (diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? '-right' : 'left'), async () => {
                const activeWebview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
                if (!activeWebview) {
                    return;
                }
                if (!activeWebview.insetMapping.has(displayOutput)) {
                    return;
                }
                activeWebview.removeInsets([displayOutput]);
            });
        }
        showInset(cellDiffViewModel, cellViewModel, displayOutput, diffSide) {
            this._insetModifyQueueByOutputId.queue(displayOutput.model.outputId + (diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? '-right' : 'left'), async () => {
                const activeWebview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
                if (!activeWebview) {
                    return;
                }
                if (!activeWebview.insetMapping.has(displayOutput)) {
                    return;
                }
                const cellTop = this._list.getAbsoluteTopOfElement(cellDiffViewModel);
                const outputIndex = cellViewModel.outputsViewModels.indexOf(displayOutput);
                const outputOffset = cellDiffViewModel.getOutputOffsetInCell(diffSide, outputIndex);
                activeWebview.updateScrollTops([{
                        cell: cellViewModel,
                        output: displayOutput,
                        cellTop,
                        outputOffset,
                        forceDisplay: true,
                    }], []);
            });
        }
        hideInset(cellDiffViewModel, cellViewModel, output) {
            var _a, _b;
            (_a = this._modifiedWebview) === null || _a === void 0 ? void 0 : _a.hideInset(output);
            (_b = this._originalWebview) === null || _b === void 0 ? void 0 : _b.hideInset(output);
        }
        // private async _resolveWebview(rightEditor: boolean): Promise<BackLayerWebView | null> {
        // 	if (rightEditor) {
        // 	}
        // }
        getDomNode() {
            return this._rootElement;
        }
        getOverflowContainerDomNode() {
            return this._overflowContainer;
        }
        getControl() {
            return undefined;
        }
        setEditorVisible(visible, group) {
            super.setEditorVisible(visible, group);
        }
        focus() {
            super.focus();
        }
        clearInput() {
            var _a, _b;
            super.clearInput();
            this._modifiedResourceDisposableStore.clear();
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.splice(0, ((_b = this._list) === null || _b === void 0 ? void 0 : _b.length) || 0);
            this._model = null;
            this._diffElementViewModels = [];
        }
        deltaCellOutputContainerClassNames(diffSide, cellId, added, removed) {
            var _a, _b;
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                (_a = this._originalWebview) === null || _a === void 0 ? void 0 : _a.deltaCellOutputContainerClassNames(cellId, added, removed);
            }
            else {
                (_b = this._modifiedWebview) === null || _b === void 0 ? void 0 : _b.deltaCellOutputContainerClassNames(cellId, added, removed);
            }
        }
        getLayoutInfo() {
            var _a, _b;
            if (!this._list) {
                throw new Error('Editor is not initalized successfully');
            }
            return {
                width: this._dimension.width,
                height: this._dimension.height,
                fontInfo: this._fontInfo,
                scrollHeight: (_b = (_a = this._list) === null || _a === void 0 ? void 0 : _a.getScrollHeight()) !== null && _b !== void 0 ? _b : 0,
            };
        }
        getCellOutputLayoutInfo(nestedCell) {
            if (!this._model) {
                throw new Error('Editor is not attached to model yet');
            }
            const documentModel = notebookCommon_1.CellUri.parse(nestedCell.uri);
            if (!documentModel) {
                throw new Error('Nested cell in the diff editor has wrong Uri');
            }
            const belongToOriginalDocument = this._model.original.notebook.uri.toString() === documentModel.notebook.toString();
            const viewModel = this._diffElementViewModels.find(element => {
                const textModel = belongToOriginalDocument ? element.original : element.modified;
                if (!textModel) {
                    return false;
                }
                if (textModel.uri.toString() === nestedCell.uri.toString()) {
                    return true;
                }
                return false;
            });
            if (!viewModel) {
                throw new Error('Nested cell in the diff editor does not match any diff element');
            }
            if (viewModel.type === 'unchanged') {
                return this.getLayoutInfo();
            }
            if (viewModel.type === 'insert' || viewModel.type === 'delete') {
                return {
                    width: this._dimension.width / 2,
                    height: this._dimension.height / 2,
                    fontInfo: this._fontInfo
                };
            }
            if (viewModel.checkIfOutputsModified()) {
                return {
                    width: this._dimension.width / 2,
                    height: this._dimension.height / 2,
                    fontInfo: this._fontInfo
                };
            }
            else {
                return this.getLayoutInfo();
            }
        }
        layout(dimension) {
            var _a, _b;
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            this._dimension = dimension;
            this._rootElement.style.height = `${dimension.height}px`;
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.layout(this._dimension.height, this._dimension.width);
            if (this._modifiedWebview) {
                this._modifiedWebview.element.style.width = `calc(50% - 16px)`;
                this._modifiedWebview.element.style.left = `calc(50%)`;
            }
            if (this._originalWebview) {
                this._originalWebview.element.style.width = `calc(50% - 16px)`;
                this._originalWebview.element.style.left = `16px`;
            }
            if (this._webviewTransparentCover) {
                this._webviewTransparentCover.style.height = `${dimension.height}px`;
                this._webviewTransparentCover.style.width = `${dimension.width}px`;
            }
            (_b = this._eventDispatcher) === null || _b === void 0 ? void 0 : _b.emit([new eventDispatcher_1.NotebookDiffLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
        }
        dispose() {
            var _a;
            this._isDisposed = true;
            (_a = this._layoutCancellationTokenSource) === null || _a === void 0 ? void 0 : _a.dispose();
            super.dispose();
        }
    };
    NotebookTextDiffEditor.ID = notebookCommon_1.NOTEBOOK_DIFF_EDITOR_ID;
    NotebookTextDiffEditor = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, themeService_1.IThemeService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, notebookWorkerService_1.INotebookEditorWorkerService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookTextDiffEditor);
    exports.NotebookTextDiffEditor = NotebookTextDiffEditor;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        var _a;
        const cellBorderColor = theme.getColor(notebookEditorWidget_1.notebookCellBorder);
        if (cellBorderColor) {
            collector.addRule(`.notebook-text-diff-editor .cell-body .border-container .top-border { border-top: 1px solid ${cellBorderColor};}`);
            collector.addRule(`.notebook-text-diff-editor .cell-body .border-container .bottom-border { border-top: 1px solid ${cellBorderColor};}`);
            collector.addRule(`.notebook-text-diff-editor .cell-body .border-container .left-border { border-left: 1px solid ${cellBorderColor};}`);
            collector.addRule(`.notebook-text-diff-editor .cell-body .border-container .right-border { border-right: 1px solid ${cellBorderColor};}`);
            collector.addRule(`.notebook-text-diff-editor .cell-diff-editor-container .output-header-container,
		.notebook-text-diff-editor .cell-diff-editor-container .metadata-header-container {
			border-top: 1px solid ${cellBorderColor};
		}`);
        }
        const focusCellBackgroundColor = theme.getColor(notebookEditorWidget_1.focusedEditorBorderColor);
        if (focusCellBackgroundColor) {
            collector.addRule(`.notebook-text-diff-editor .monaco-list-row.focused .cell-body .border-container .top-border { border-top: 1px solid ${focusCellBackgroundColor};}`);
            collector.addRule(`.notebook-text-diff-editor .monaco-list-row.focused .cell-body .border-container .bottom-border { border-top: 1px solid ${focusCellBackgroundColor};}`);
            collector.addRule(`.notebook-text-diff-editor .monaco-list-row.focused .cell-body .border-container .left-border { border-left: 1px solid ${focusCellBackgroundColor};}`);
            collector.addRule(`.notebook-text-diff-editor .monaco-list-row.focused .cell-body .border-container .right-border { border-right: 1px solid ${focusCellBackgroundColor};}`);
        }
        const diffDiagonalFillColor = theme.getColor(colorRegistry_1.diffDiagonalFill);
        collector.addRule(`
	.notebook-text-diff-editor .diagonal-fill {
		background-image: linear-gradient(
			-45deg,
			${diffDiagonalFillColor} 12.5%,
			#0000 12.5%, #0000 50%,
			${diffDiagonalFillColor} 50%, ${diffDiagonalFillColor} 62.5%,
			#0000 62.5%, #0000 100%
		);
		background-size: 8px 8px;
	}
	`);
        const editorBackgroundColor = (_a = theme.getColor(notebookEditorWidget_1.cellEditorBackground)) !== null && _a !== void 0 ? _a : theme.getColor(colorRegistry_1.editorBackground);
        if (editorBackgroundColor) {
            collector.addRule(`.notebook-text-diff-editor .cell-body .cell-diff-editor-container .source-container .monaco-editor .margin,
		.notebook-text-diff-editor .cell-body .cell-diff-editor-container .source-container .monaco-editor .monaco-editor-background { background: ${editorBackgroundColor}; }`);
        }
        const added = theme.getColor(colorRegistry_1.diffInserted);
        if (added) {
            collector.addRule(`
			.monaco-workbench .notebook-text-diff-editor .cell-body.full .output-info-container.modified .output-view-container .output-view-container-right div.foreground { background-color: ${added}; }
			.monaco-workbench .notebook-text-diff-editor .cell-body.right .output-info-container .output-view-container div.foreground { background-color: ${added}; }
			.monaco-workbench .notebook-text-diff-editor .cell-body.right .output-info-container .output-view-container div.output-empty-view { background-color: ${added}; }
			`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .source-container { background-color: ${added}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .source-container .monaco-editor .margin,
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .source-container .monaco-editor .monaco-editor-background {
					background-color: ${added};
			}
		`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .metadata-editor-container { background-color: ${added}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .metadata-editor-container .monaco-editor .margin,
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .metadata-editor-container .monaco-editor .monaco-editor-background {
					background-color: ${added};
			}
		`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .output-editor-container { background-color: ${added}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .output-editor-container .monaco-editor .margin,
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .output-editor-container .monaco-editor .monaco-editor-background {
					background-color: ${added};
			}
		`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .metadata-header-container { background-color: ${added}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.inserted .output-header-container { background-color: ${added}; }
		`);
        }
        const removed = theme.getColor(colorRegistry_1.diffRemoved);
        if (removed) {
            collector.addRule(`
			.monaco-workbench .notebook-text-diff-editor .cell-body.full .output-info-container.modified .output-view-container .output-view-container-left div.foreground { background-color: ${removed}; }
			.monaco-workbench .notebook-text-diff-editor .cell-body.left .output-info-container .output-view-container div.foreground { background-color: ${removed}; }
			.monaco-workbench .notebook-text-diff-editor .cell-body.left .output-info-container .output-view-container div.output-empty-view { background-color: ${removed}; }

			`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .source-container { background-color: ${removed}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .source-container .monaco-editor .margin,
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .source-container .monaco-editor .monaco-editor-background {
					background-color: ${removed};
			}
		`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .metadata-editor-container { background-color: ${removed}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .metadata-editor-container .monaco-editor .margin,
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .metadata-editor-container .monaco-editor .monaco-editor-background {
					background-color: ${removed};
			}
		`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .output-editor-container { background-color: ${removed}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .output-editor-container .monaco-editor .margin,
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .output-editor-container .monaco-editor .monaco-editor-background {
					background-color: ${removed};
			}
		`);
            collector.addRule(`
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .metadata-header-container { background-color: ${removed}; }
			.notebook-text-diff-editor .cell-body .cell-diff-editor-container.removed .output-header-container { background-color: ${removed}; }
		`);
        }
        // const changed = theme.getColor(editorGutterModifiedBackground);
        // if (changed) {
        // 	collector.addRule(`
        // 		.notebook-text-diff-editor .cell-diff-editor-container .metadata-header-container.modified {
        // 			background-color: ${changed};
        // 		}
        // 	`);
        // }
        collector.addRule(`.notebook-text-diff-editor .cell-body { margin: ${notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN}px; }`);
    });
});
//# sourceMappingURL=notebookTextDiffEditor.js.map