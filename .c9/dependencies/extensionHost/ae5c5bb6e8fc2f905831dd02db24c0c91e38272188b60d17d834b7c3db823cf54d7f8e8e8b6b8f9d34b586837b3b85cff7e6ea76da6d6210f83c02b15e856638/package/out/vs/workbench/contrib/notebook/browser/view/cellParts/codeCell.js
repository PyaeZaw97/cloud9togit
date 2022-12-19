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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/languages/language", "vs/editor/common/languages/textToHtmlTokenizer", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellParts/cellEditorOptions", "vs/workbench/contrib/notebook/browser/view/cellParts/cellOutput", "vs/workbench/contrib/notebook/browser/view/cellParts/codeCellExecutionIcon", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, DOM, async_1, cancellation_1, codicons_1, event_1, lifecycle_1, language_1, textToHtmlTokenizer_1, nls_1, configuration_1, instantiation_1, keybinding_1, opener_1, notebookBrowser_1, cellEditorOptions_1, cellOutput_1, codeCellExecutionIcon_1, notebookCellStatusBarService_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCell = void 0;
    let CodeCell = class CodeCell extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, templateData, instantiationService, notebookCellStatusBarService, keybindingService, openerService, languageService, configurationService, notebookExecutionStateService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.instantiationService = instantiationService;
            this.notebookCellStatusBarService = notebookCellStatusBarService;
            this.keybindingService = keybindingService;
            this.openerService = openerService;
            this.languageService = languageService;
            this.configurationService = configurationService;
            this._isDisposed = false;
            const cellEditorOptions = this._register(new cellEditorOptions_1.CellEditorOptions(this.notebookEditor.getBaseCellEditorOptions(viewCell.language), this.notebookEditor.notebookOptions, this.configurationService));
            this._outputContainerRenderer = this.instantiationService.createInstance(cellOutput_1.CellOutputContainer, notebookEditor, viewCell, templateData, { limit: 500 });
            this.cellParts = [...templateData.cellParts, cellEditorOptions, this._outputContainerRenderer];
            const editorHeight = this.calculateInitEditorHeight();
            this.initializeEditor(editorHeight);
            this.registerViewCellLayoutChange();
            this.registerCellEditorEventListeners();
            this.registerDecorations();
            this.registerMouseListener();
            this._register(notebookExecutionStateService.onDidChangeCellExecution(e => {
                if (e.affectsCell(this.viewCell.uri)) {
                    this.cellParts.forEach(cellPart => {
                        cellPart.updateForExecutionState(this.viewCell, e);
                    });
                }
            }));
            this._register(this.viewCell.onDidChangeState(e => {
                this.cellParts.forEach(cellPart => {
                    cellPart.updateState(this.viewCell, e);
                });
                if (e.outputIsHoveredChanged) {
                    this.updateForOutputHover();
                }
                if (e.outputIsFocusedChanged) {
                    this.updateForOutputFocus();
                }
                if (e.metadataChanged || e.internalMetadataChanged) {
                    this.updateEditorOptions();
                }
                if (e.inputCollapsedChanged || e.outputCollapsedChanged) {
                    this.viewCell.pauseLayout();
                    const updated = this.updateForCollapseState();
                    this.viewCell.resumeLayout();
                    if (updated) {
                        this.relayoutCell();
                    }
                }
                if (e.focusModeChanged) {
                    this.updateEditorForFocusModeChange();
                }
            }));
            this.cellParts.forEach(cellPart => cellPart.renderCell(this.viewCell));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.cellParts.forEach(cellPart => cellPart.unrenderCell(this.viewCell));
            }));
            this.updateEditorOptions();
            this.updateEditorForFocusModeChange();
            this.updateForOutputHover();
            this.updateForOutputFocus();
            // Render Outputs
            this._outputContainerRenderer.render(editorHeight);
            // Need to do this after the intial renderOutput
            if (this.viewCell.isOutputCollapsed === undefined && this.viewCell.isInputCollapsed === undefined) {
                this.initialViewUpdateExpanded();
                this.viewCell.layoutChange({});
            }
            this._register(this.viewCell.onLayoutInfoRead(() => {
                this.cellParts.forEach(cellPart => cellPart.prepareLayout());
            }));
            const executionItemElement = DOM.append(this.templateData.cellInputCollapsedContainer, DOM.$('.collapsed-execution-icon'));
            this._register((0, lifecycle_1.toDisposable)(() => {
                var _a;
                (_a = executionItemElement.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(executionItemElement);
            }));
            this._collapsedExecutionIcon = this._register(this.instantiationService.createInstance(codeCellExecutionIcon_1.CollapsedCodeCellExecutionIcon, this.notebookEditor, this.viewCell, executionItemElement));
            this.updateForCollapseState();
            this._register(event_1.Event.runAndSubscribe(viewCell.onDidChangeOutputs, this.updateForOutputs.bind(this)));
            this._register(event_1.Event.runAndSubscribe(viewCell.onDidChangeLayout, this.updateForLayout.bind(this)));
            this._register(cellEditorOptions.onDidChange(() => templateData.editor.updateOptions(cellEditorOptions.getUpdatedValue(this.viewCell.internalMetadata, this.viewCell.uri))));
            templateData.editor.updateOptions(cellEditorOptions.getUpdatedValue(this.viewCell.internalMetadata, this.viewCell.uri));
            cellEditorOptions.setLineNumbers(this.viewCell.lineNumbers);
        }
        updateForLayout() {
            var _a;
            (_a = this._pendingLayout) === null || _a === void 0 ? void 0 : _a.dispose();
            this._pendingLayout = DOM.modify(() => {
                this.cellParts.forEach(part => {
                    part.updateInternalLayoutNow(this.viewCell);
                });
            });
        }
        updateForOutputHover() {
            this.templateData.container.classList.toggle('cell-output-hover', this.viewCell.outputIsHovered);
        }
        updateForOutputFocus() {
            this.templateData.container.classList.toggle('cell-output-focus', this.viewCell.outputIsFocused);
        }
        calculateInitEditorHeight() {
            var _a;
            const lineNum = this.viewCell.lineCount;
            const lineHeight = ((_a = this.viewCell.layoutInfo.fontInfo) === null || _a === void 0 ? void 0 : _a.lineHeight) || 17;
            const editorPadding = this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri);
            const editorHeight = this.viewCell.layoutInfo.editorHeight === 0
                ? lineNum * lineHeight + editorPadding.top + editorPadding.bottom
                : this.viewCell.layoutInfo.editorHeight;
            return editorHeight;
        }
        initializeEditor(initEditorHeight) {
            const width = this.viewCell.layoutInfo.editorWidth;
            this.layoutEditor({
                width: width,
                height: initEditorHeight
            });
            const cts = new cancellation_1.CancellationTokenSource();
            this._register({ dispose() { cts.dispose(true); } });
            (0, async_1.raceCancellation)(this.viewCell.resolveTextModel(), cts.token).then(model => {
                var _a;
                if (this._isDisposed) {
                    return;
                }
                if (model && this.templateData.editor) {
                    this.templateData.editor.setModel(model);
                    this.viewCell.attachTextEditor(this.templateData.editor);
                    const focusEditorIfNeeded = () => {
                        var _a;
                        if (this.notebookEditor.getActiveCell() === this.viewCell &&
                            this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor &&
                            (this.notebookEditor.hasEditorFocus() || document.activeElement === document.body)) // Don't steal focus from other workbench parts, but if body has focus, we can take it
                         {
                            (_a = this.templateData.editor) === null || _a === void 0 ? void 0 : _a.focus();
                        }
                    };
                    focusEditorIfNeeded();
                    const realContentHeight = (_a = this.templateData.editor) === null || _a === void 0 ? void 0 : _a.getContentHeight();
                    if (realContentHeight !== undefined && realContentHeight !== initEditorHeight) {
                        this.onCellEditorHeightChange(realContentHeight);
                    }
                    focusEditorIfNeeded();
                }
            });
        }
        updateForOutputs() {
            if (this.viewCell.outputsViewModels.length) {
                DOM.show(this.templateData.focusSinkElement);
            }
            else {
                DOM.hide(this.templateData.focusSinkElement);
            }
        }
        updateEditorOptions() {
            const editor = this.templateData.editor;
            if (!editor) {
                return;
            }
            const isReadonly = this.notebookEditor.isReadOnly;
            const padding = this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri);
            const options = editor.getOptions();
            if (options.get(81 /* EditorOption.readOnly */) !== isReadonly || options.get(75 /* EditorOption.padding */) !== padding) {
                editor.updateOptions({ readOnly: this.notebookEditor.isReadOnly, padding: this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri) });
            }
        }
        registerViewCellLayoutChange() {
            this._register(this.viewCell.onDidChangeLayout((e) => {
                if (e.outerWidth !== undefined) {
                    const layoutInfo = this.templateData.editor.getLayoutInfo();
                    if (layoutInfo.width !== this.viewCell.layoutInfo.editorWidth) {
                        this.onCellWidthChange();
                    }
                }
                if (e.totalHeight) {
                    this.relayoutCell();
                }
            }));
        }
        registerCellEditorEventListeners() {
            this._register(this.templateData.editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged) {
                    if (this.viewCell.layoutInfo.editorHeight !== e.contentHeight) {
                        this.onCellEditorHeightChange(e.contentHeight);
                    }
                }
            }));
            this._register(this.templateData.editor.onDidChangeCursorSelection((e) => {
                if (e.source === 'restoreState') {
                    // do not reveal the cell into view if this selection change was caused by restoring editors...
                    return;
                }
                const selections = this.templateData.editor.getSelections();
                if (selections === null || selections === void 0 ? void 0 : selections.length) {
                    const lastSelection = selections[selections.length - 1];
                    this.notebookEditor.revealLineInViewAsync(this.viewCell, lastSelection.positionLineNumber);
                }
            }));
        }
        registerDecorations() {
            // Apply decorations
            this._register(this.viewCell.onCellDecorationsChanged((e) => {
                e.added.forEach(options => {
                    if (options.className) {
                        this.templateData.rootContainer.classList.add(options.className);
                    }
                    if (options.outputClassName) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(this.viewCell.id, [options.outputClassName], []);
                    }
                });
                e.removed.forEach(options => {
                    if (options.className) {
                        this.templateData.rootContainer.classList.remove(options.className);
                    }
                    if (options.outputClassName) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(this.viewCell.id, [], [options.outputClassName]);
                    }
                });
            }));
            this.viewCell.getCellDecorations().forEach(options => {
                if (options.className) {
                    this.templateData.rootContainer.classList.add(options.className);
                }
                if (options.outputClassName) {
                    this.notebookEditor.deltaCellOutputContainerClassNames(this.viewCell.id, [options.outputClassName], []);
                }
            });
        }
        registerMouseListener() {
            this._register(this.templateData.editor.onMouseDown(e => {
                // prevent default on right mouse click, otherwise it will trigger unexpected focus changes
                // the catch is, it means we don't allow customization of right button mouse down handlers other than the built in ones.
                if (e.event.rightButton) {
                    e.event.preventDefault();
                }
            }));
        }
        shouldUpdateDOMFocus() {
            // The DOM focus needs to be adjusted:
            // when a cell editor should be focused
            // the document active element is inside the notebook editor or the document body (cell editor being disposed previously)
            return this.notebookEditor.getActiveCell() === this.viewCell
                && this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor
                && (this.notebookEditor.hasEditorFocus() || document.activeElement === document.body);
        }
        updateEditorForFocusModeChange() {
            var _a;
            if (this.shouldUpdateDOMFocus()) {
                (_a = this.templateData.editor) === null || _a === void 0 ? void 0 : _a.focus();
            }
            this.templateData.container.classList.toggle('cell-editor-focus', this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor);
        }
        updateForCollapseState() {
            if (this.viewCell.isOutputCollapsed === this._renderedOutputCollapseState &&
                this.viewCell.isInputCollapsed === this._renderedInputCollapseState) {
                return false;
            }
            this.viewCell.layoutChange({ editorHeight: true });
            if (this.viewCell.isInputCollapsed) {
                this._collapseInput();
            }
            else {
                this._showInput();
            }
            if (this.viewCell.isOutputCollapsed) {
                this._collapseOutput();
            }
            else {
                this._showOutput(false);
            }
            this.relayoutCell();
            this._renderedOutputCollapseState = this.viewCell.isOutputCollapsed;
            this._renderedInputCollapseState = this.viewCell.isInputCollapsed;
            return true;
        }
        _collapseInput() {
            // hide the editor and execution label, keep the run button
            DOM.hide(this.templateData.editorPart);
            this.templateData.container.classList.toggle('input-collapsed', true);
            // remove input preview
            this._removeInputCollapsePreview();
            this._collapsedExecutionIcon.setVisibility(true);
            // update preview
            const richEditorText = this._getRichText(this.viewCell.textBuffer, this.viewCell.language);
            const element = DOM.$('div.cell-collapse-preview');
            DOM.safeInnerHtml(element, richEditorText);
            this.templateData.cellInputCollapsedContainer.appendChild(element);
            const expandIcon = DOM.$('span.expandInputIcon');
            const keybinding = this.keybindingService.lookupKeybinding(notebookBrowser_1.EXPAND_CELL_INPUT_COMMAND_ID);
            if (keybinding) {
                element.title = (0, nls_1.localize)('cellExpandInputButtonLabelWithDoubleClick', "Double click to expand cell input ({0})", keybinding.getLabel());
                expandIcon.title = (0, nls_1.localize)('cellExpandInputButtonLabel', "Expand Cell Input ({0})", keybinding.getLabel());
            }
            expandIcon.classList.add(...codicons_1.CSSIcon.asClassNameArray(codicons_1.Codicon.more));
            element.appendChild(expandIcon);
            DOM.show(this.templateData.cellInputCollapsedContainer);
        }
        _showInput() {
            this._collapsedExecutionIcon.setVisibility(false);
            DOM.show(this.templateData.editorPart);
            DOM.hide(this.templateData.cellInputCollapsedContainer);
        }
        _getRichText(buffer, language) {
            return (0, textToHtmlTokenizer_1.tokenizeToStringSync)(this.languageService, buffer.getLineContent(1), language);
        }
        _removeInputCollapsePreview() {
            const children = this.templateData.cellInputCollapsedContainer.children;
            const elements = [];
            for (let i = 0; i < children.length; i++) {
                if (children[i].classList.contains('cell-collapse-preview')) {
                    elements.push(children[i]);
                }
            }
            elements.forEach(element => {
                var _a;
                (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(element);
            });
        }
        _updateOutputInnerContainer(hide) {
            const children = this.templateData.outputContainer.domNode.children;
            for (let i = 0; i < children.length; i++) {
                if (children[i].classList.contains('output-inner-container')) {
                    if (hide) {
                        DOM.hide(children[i]);
                    }
                    else {
                        DOM.show(children[i]);
                    }
                }
            }
        }
        _collapseOutput() {
            this.templateData.container.classList.toggle('output-collapsed', true);
            DOM.show(this.templateData.cellOutputCollapsedContainer);
            this._updateOutputInnerContainer(true);
            this._outputContainerRenderer.viewUpdateHideOuputs();
        }
        _showOutput(initRendering) {
            this.templateData.container.classList.toggle('output-collapsed', false);
            DOM.hide(this.templateData.cellOutputCollapsedContainer);
            this._updateOutputInnerContainer(false);
            this._outputContainerRenderer.viewUpdateShowOutputs(initRendering);
        }
        initialViewUpdateExpanded() {
            this.templateData.container.classList.toggle('input-collapsed', false);
            this._showInput();
            this.templateData.container.classList.toggle('output-collapsed', false);
            this._showOutput(true);
            this.relayoutCell();
        }
        layoutEditor(dimension) {
            var _a;
            (_a = this.templateData.editor) === null || _a === void 0 ? void 0 : _a.layout(dimension);
        }
        onCellWidthChange() {
            if (!this.templateData.editor.hasModel()) {
                return;
            }
            const realContentHeight = this.templateData.editor.getContentHeight();
            this.viewCell.editorHeight = realContentHeight;
            this.relayoutCell();
            this.layoutEditor({
                width: this.viewCell.layoutInfo.editorWidth,
                height: realContentHeight
            });
        }
        onCellEditorHeightChange(newHeight) {
            const viewLayout = this.templateData.editor.getLayoutInfo();
            this.viewCell.editorHeight = newHeight;
            this.relayoutCell();
            this.layoutEditor({
                width: viewLayout.width,
                height: newHeight
            });
        }
        relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        dispose() {
            var _a;
            this._isDisposed = true;
            // move focus back to the cell list otherwise the focus goes to body
            if (this.shouldUpdateDOMFocus()) {
                this.notebookEditor.focusContainer();
            }
            this.viewCell.detachTextEditor();
            this._removeInputCollapsePreview();
            this._outputContainerRenderer.dispose();
            (_a = this._pendingLayout) === null || _a === void 0 ? void 0 : _a.dispose();
            super.dispose();
        }
    };
    CodeCell = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, notebookCellStatusBarService_1.INotebookCellStatusBarService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, opener_1.IOpenerService),
        __param(7, language_1.ILanguageService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CodeCell);
    exports.CodeCell = CodeCell;
});
//# sourceMappingURL=codeCell.js.map