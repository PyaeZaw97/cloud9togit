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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/common/languages/textToHtmlTokenizer", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/view/cellParts/cellEditorOptions", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService"], function (require, exports, DOM, iconLabels_1, async_1, cancellation_1, codicons_1, lifecycle_1, codeEditorWidget_1, editorContextKeys_1, language_1, textToHtmlTokenizer_1, nls_1, configuration_1, contextkey_1, instantiation_1, serviceCollection_1, keybinding_1, notebookBrowser_1, notebookIcons_1, cellEditorOptions_1, notebookCellStatusBarService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatefulMarkdownCell = void 0;
    let StatefulMarkdownCell = class StatefulMarkdownCell extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, templateData, renderedEditors, contextKeyService, notebookCellStatusBarService, instantiationService, languageService, configurationService, keybindingService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.renderedEditors = renderedEditors;
            this.contextKeyService = contextKeyService;
            this.notebookCellStatusBarService = notebookCellStatusBarService;
            this.instantiationService = instantiationService;
            this.languageService = languageService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.editor = null;
            this.localDisposables = this._register(new lifecycle_1.DisposableStore());
            this.focusSwitchDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this.constructDOM();
            this.editorPart = templateData.editorPart;
            this.cellEditorOptions = this._register(new cellEditorOptions_1.CellEditorOptions(this.notebookEditor.getBaseCellEditorOptions(viewCell.language), this.notebookEditor.notebookOptions, this.configurationService));
            this.cellEditorOptions.setLineNumbers(this.viewCell.lineNumbers);
            this.editorOptions = this.cellEditorOptions.getValue(this.viewCell.internalMetadata, this.viewCell.uri);
            this._register((0, lifecycle_1.toDisposable)(() => renderedEditors.delete(this.viewCell)));
            this.registerListeners();
            // update for init state
            this.templateData.cellParts.forEach(cellPart => cellPart.renderCell(this.viewCell));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.templateData.cellParts.forEach(cellPart => cellPart.unrenderCell(this.viewCell));
            }));
            this.updateForHover();
            this.updateForFocusModeChange();
            this.foldingState = viewCell.foldingState;
            this.layoutFoldingIndicator();
            this.updateFoldingIconShowClass();
            // the markdown preview's height might already be updated after the renderer calls `element.getHeight()`
            if (this.viewCell.layoutInfo.totalHeight > 0) {
                this.relayoutCell();
            }
            this.applyDecorations();
            this.viewUpdate();
            this.layoutCellParts();
            this._register(this.viewCell.onDidChangeLayout(() => {
                this.layoutCellParts();
            }));
        }
        layoutCellParts() {
            this.templateData.cellParts.forEach(part => {
                part.updateInternalLayoutNow(this.viewCell);
            });
        }
        constructDOM() {
            // Create an element that is only used to announce markup cell content to screen readers
            const id = `aria-markup-cell-${this.viewCell.id}`;
            this.markdownAccessibilityContainer = this.templateData.cellContainer;
            this.markdownAccessibilityContainer.id = id;
            // Hide the element from non-screen readers
            this.markdownAccessibilityContainer.style.height = '1px';
            this.markdownAccessibilityContainer.style.position = 'absolute';
            this.markdownAccessibilityContainer.style.top = '10000px';
            this.markdownAccessibilityContainer.ariaHidden = 'false';
            this.templateData.rootContainer.setAttribute('aria-describedby', id);
            this.templateData.container.classList.toggle('webview-backed-markdown-cell', true);
        }
        registerListeners() {
            this._register(this.viewCell.onDidChangeState(e => {
                this.templateData.cellParts.forEach(cellPart => {
                    cellPart.updateState(this.viewCell, e);
                });
            }));
            this._register(this.viewCell.model.onDidChangeMetadata(() => {
                this.viewUpdate();
            }));
            this._register(this.viewCell.onDidChangeState((e) => {
                if (e.editStateChanged || e.contentChanged) {
                    this.viewUpdate();
                }
                if (e.focusModeChanged) {
                    this.updateForFocusModeChange();
                }
                if (e.foldingStateChanged) {
                    const foldingState = this.viewCell.foldingState;
                    if (foldingState !== this.foldingState) {
                        this.foldingState = foldingState;
                        this.layoutFoldingIndicator();
                    }
                }
                if (e.cellIsHoveredChanged) {
                    this.updateForHover();
                }
                if (e.inputCollapsedChanged) {
                    this.updateCollapsedState();
                    this.viewUpdate();
                }
                if (e.cellLineNumberChanged) {
                    this.cellEditorOptions.setLineNumbers(this.viewCell.lineNumbers);
                }
            }));
            this._register(this.notebookEditor.notebookOptions.onDidChangeOptions(e => {
                if (e.showFoldingControls) {
                    this.updateFoldingIconShowClass();
                }
            }));
            this._register(this.viewCell.onDidChangeLayout((e) => {
                var _a;
                const layoutInfo = (_a = this.editor) === null || _a === void 0 ? void 0 : _a.getLayoutInfo();
                if (e.outerWidth && this.viewCell.getEditState() === notebookBrowser_1.CellEditState.Editing && layoutInfo && layoutInfo.width !== this.viewCell.layoutInfo.editorWidth) {
                    this.onCellEditorWidthChange();
                }
                else if (e.totalHeight || e.outerWidth) {
                    this.relayoutCell();
                }
            }));
            this._register(this.cellEditorOptions.onDidChange(() => {
                this.updateEditorOptions(this.cellEditorOptions.getUpdatedValue(this.viewCell.internalMetadata, this.viewCell.uri));
            }));
        }
        updateCollapsedState() {
            if (this.viewCell.isInputCollapsed) {
                this.notebookEditor.hideMarkupPreviews([this.viewCell]);
            }
            else {
                this.notebookEditor.unhideMarkupPreviews([this.viewCell]);
            }
        }
        updateForHover() {
            this.templateData.container.classList.toggle('markdown-cell-hover', this.viewCell.cellIsHovered);
        }
        updateForFocusModeChange() {
            if (this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                this.focusEditorIfNeeded();
            }
            this.templateData.container.classList.toggle('cell-editor-focus', this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor);
        }
        applyDecorations() {
            // apply decorations
            this._register(this.viewCell.onCellDecorationsChanged((e) => {
                e.added.forEach(options => {
                    if (options.className) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(this.viewCell.id, [options.className], []);
                    }
                });
                e.removed.forEach(options => {
                    if (options.className) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(this.viewCell.id, [], [options.className]);
                    }
                });
            }));
            this.viewCell.getCellDecorations().forEach(options => {
                if (options.className) {
                    this.notebookEditor.deltaCellOutputContainerClassNames(this.viewCell.id, [options.className], []);
                }
            });
        }
        dispose() {
            // move focus back to the cell list otherwise the focus goes to body
            if (this.notebookEditor.getActiveCell() === this.viewCell && this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor && (this.notebookEditor.hasEditorFocus() || document.activeElement === document.body)) {
                this.notebookEditor.focusContainer();
            }
            this.viewCell.detachTextEditor();
            super.dispose();
        }
        updateFoldingIconShowClass() {
            const showFoldingIcon = this.notebookEditor.notebookOptions.getLayoutConfiguration().showFoldingControls;
            this.templateData.foldingIndicator.classList.remove('mouseover', 'always');
            this.templateData.foldingIndicator.classList.add(showFoldingIcon);
        }
        viewUpdate() {
            if (this.viewCell.isInputCollapsed) {
                this.viewUpdateCollapsed();
            }
            else if (this.viewCell.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                this.viewUpdateEditing();
            }
            else {
                this.viewUpdatePreview();
            }
        }
        viewUpdateCollapsed() {
            DOM.show(this.templateData.cellInputCollapsedContainer);
            DOM.hide(this.editorPart);
            this.templateData.cellInputCollapsedContainer.innerText = '';
            const markdownIcon = DOM.append(this.templateData.cellInputCollapsedContainer, DOM.$('span'));
            markdownIcon.classList.add(...codicons_1.CSSIcon.asClassNameArray(codicons_1.Codicon.markdown));
            const element = DOM.$('div');
            element.classList.add('cell-collapse-preview');
            const richEditorText = this.getRichText(this.viewCell.textBuffer, this.viewCell.language);
            DOM.safeInnerHtml(element, richEditorText);
            this.templateData.cellInputCollapsedContainer.appendChild(element);
            const expandIcon = DOM.append(element, DOM.$('span.expandInputIcon'));
            expandIcon.classList.add(...codicons_1.CSSIcon.asClassNameArray(codicons_1.Codicon.more));
            const keybinding = this.keybindingService.lookupKeybinding(notebookBrowser_1.EXPAND_CELL_INPUT_COMMAND_ID);
            if (keybinding) {
                element.title = (0, nls_1.localize)('cellExpandInputButtonLabelWithDoubleClick', "Double click to expand cell input ({0})", keybinding.getLabel());
                expandIcon.title = (0, nls_1.localize)('cellExpandInputButtonLabel', "Expand Cell Input ({0})", keybinding.getLabel());
            }
            this.markdownAccessibilityContainer.ariaHidden = 'true';
            this.templateData.container.classList.toggle('input-collapsed', true);
            this.viewCell.renderedMarkdownHeight = 0;
            this.viewCell.layoutChange({});
        }
        getRichText(buffer, language) {
            return (0, textToHtmlTokenizer_1.tokenizeToStringSync)(this.languageService, buffer.getLineContent(1), language);
        }
        viewUpdateEditing() {
            var _a;
            // switch to editing mode
            let editorHeight;
            DOM.show(this.editorPart);
            this.markdownAccessibilityContainer.ariaHidden = 'true';
            DOM.hide(this.templateData.cellInputCollapsedContainer);
            this.notebookEditor.hideMarkupPreviews([this.viewCell]);
            this.templateData.container.classList.toggle('input-collapsed', false);
            this.templateData.container.classList.toggle('markdown-cell-edit-mode', true);
            if (this.editor && this.editor.hasModel()) {
                editorHeight = this.editor.getContentHeight();
                // not first time, we don't need to create editor
                this.viewCell.attachTextEditor(this.editor);
                this.focusEditorIfNeeded();
                this.bindEditorListeners(this.editor);
                this.editor.layout({
                    width: this.viewCell.layoutInfo.editorWidth,
                    height: editorHeight
                });
            }
            else {
                this.editorDisposables.clear();
                const width = this.notebookEditor.notebookOptions.computeMarkdownCellEditorWidth(this.notebookEditor.getLayoutInfo().width);
                const lineNum = this.viewCell.lineCount;
                const lineHeight = ((_a = this.viewCell.layoutInfo.fontInfo) === null || _a === void 0 ? void 0 : _a.lineHeight) || 17;
                const editorPadding = this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri);
                editorHeight = Math.max(lineNum, 1) * lineHeight + editorPadding.top + editorPadding.bottom;
                this.templateData.editorContainer.innerText = '';
                // create a special context key service that set the inCompositeEditor-contextkey
                const editorContextKeyService = this.contextKeyService.createScoped(this.templateData.editorPart);
                editorContextKeys_1.EditorContextKeys.inCompositeEditor.bindTo(editorContextKeyService).set(true);
                const editorInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorContextKeyService]));
                this.editorDisposables.add(editorContextKeyService);
                this.editor = this.editorDisposables.add(editorInstaService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.templateData.editorContainer, Object.assign(Object.assign({}, this.editorOptions), { dimension: {
                        width: width,
                        height: editorHeight
                    }, enableDropIntoEditor: true }), {
                    contributions: this.notebookEditor.creationOptions.cellEditorContributions
                }));
                this.templateData.currentEditor = this.editor;
                const cts = new cancellation_1.CancellationTokenSource();
                this.editorDisposables.add({ dispose() { cts.dispose(true); } });
                (0, async_1.raceCancellation)(this.viewCell.resolveTextModel(), cts.token).then(model => {
                    if (!model) {
                        return;
                    }
                    this.editor.setModel(model);
                    const realContentHeight = this.editor.getContentHeight();
                    if (realContentHeight !== editorHeight) {
                        this.editor.layout({
                            width: width,
                            height: realContentHeight
                        });
                        editorHeight = realContentHeight;
                    }
                    this.viewCell.attachTextEditor(this.editor);
                    if (this.viewCell.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                        this.focusEditorIfNeeded();
                    }
                    this.bindEditorListeners(this.editor);
                    this.viewCell.editorHeight = editorHeight;
                });
            }
            this.viewCell.editorHeight = editorHeight;
            this.focusEditorIfNeeded();
            this.renderedEditors.set(this.viewCell, this.editor);
        }
        viewUpdatePreview() {
            this.viewCell.detachTextEditor();
            DOM.hide(this.editorPart);
            DOM.hide(this.templateData.cellInputCollapsedContainer);
            this.markdownAccessibilityContainer.ariaHidden = 'false';
            this.templateData.container.classList.toggle('input-collapsed', false);
            this.templateData.container.classList.toggle('markdown-cell-edit-mode', false);
            this.renderedEditors.delete(this.viewCell);
            this.markdownAccessibilityContainer.innerText = '';
            if (this.viewCell.renderedHtml) {
                DOM.safeInnerHtml(this.markdownAccessibilityContainer, this.viewCell.renderedHtml);
            }
            this.notebookEditor.createMarkupPreview(this.viewCell);
        }
        focusEditorIfNeeded() {
            if (this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor &&
                (this.notebookEditor.hasEditorFocus() || document.activeElement === document.body)) { // Don't steal focus from other workbench parts, but if body has focus, we can take it
                if (!this.editor) {
                    return;
                }
                this.editor.focus();
                const primarySelection = this.editor.getSelection();
                if (!primarySelection) {
                    return;
                }
                this.notebookEditor.revealRangeInViewAsync(this.viewCell, primarySelection);
            }
        }
        layoutEditor(dimension) {
            var _a;
            (_a = this.editor) === null || _a === void 0 ? void 0 : _a.layout(dimension);
        }
        onCellEditorWidthChange() {
            const realContentHeight = this.editor.getContentHeight();
            this.layoutEditor({
                width: this.viewCell.layoutInfo.editorWidth,
                height: realContentHeight
            });
            // LET the content size observer to handle it
            // this.viewCell.editorHeight = realContentHeight;
            // this.relayoutCell();
        }
        relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
            this.layoutFoldingIndicator();
        }
        updateEditorOptions(newValue) {
            this.editorOptions = newValue;
            if (this.editor) {
                this.editor.updateOptions(this.editorOptions);
            }
        }
        layoutFoldingIndicator() {
            switch (this.foldingState) {
                case 0 /* CellFoldingState.None */:
                    this.templateData.foldingIndicator.innerText = '';
                    break;
                case 2 /* CellFoldingState.Collapsed */:
                    DOM.reset(this.templateData.foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.collapsedIcon));
                    break;
                case 1 /* CellFoldingState.Expanded */:
                    DOM.reset(this.templateData.foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.expandedIcon));
                    break;
                default:
                    break;
            }
        }
        bindEditorListeners(editor) {
            this.localDisposables.clear();
            this.focusSwitchDisposable.clear();
            this.localDisposables.add(editor.onDidContentSizeChange(e => {
                const viewLayout = editor.getLayoutInfo();
                if (e.contentHeightChanged) {
                    this.viewCell.editorHeight = e.contentHeight;
                    editor.layout({
                        width: viewLayout.width,
                        height: e.contentHeight
                    });
                }
            }));
            this.localDisposables.add(editor.onDidChangeCursorSelection((e) => {
                if (e.source === 'restoreState') {
                    // do not reveal the cell into view if this selection change was caused by restoring editors...
                    return;
                }
                const selections = editor.getSelections();
                if (selections === null || selections === void 0 ? void 0 : selections.length) {
                    const lastSelection = selections[selections.length - 1];
                    this.notebookEditor.revealRangeInViewAsync(this.viewCell, lastSelection);
                }
            }));
            const updateFocusMode = () => this.viewCell.focusMode = editor.hasWidgetFocus() ? notebookBrowser_1.CellFocusMode.Editor : notebookBrowser_1.CellFocusMode.Container;
            this.localDisposables.add(editor.onDidFocusEditorWidget(() => {
                updateFocusMode();
            }));
            this.localDisposables.add(editor.onDidBlurEditorWidget(() => {
                var _a;
                // this is for a special case:
                // users click the status bar empty space, which we will then focus the editor
                // so we don't want to update the focus state too eagerly
                if ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.contains(this.templateData.container)) {
                    this.focusSwitchDisposable.value = (0, async_1.disposableTimeout)(() => updateFocusMode(), 300);
                }
                else {
                    updateFocusMode();
                }
            }));
            updateFocusMode();
        }
    };
    StatefulMarkdownCell = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, notebookCellStatusBarService_1.INotebookCellStatusBarService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, language_1.ILanguageService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], StatefulMarkdownCell);
    exports.StatefulMarkdownCell = StatefulMarkdownCell;
});
//# sourceMappingURL=markdownCell.js.map