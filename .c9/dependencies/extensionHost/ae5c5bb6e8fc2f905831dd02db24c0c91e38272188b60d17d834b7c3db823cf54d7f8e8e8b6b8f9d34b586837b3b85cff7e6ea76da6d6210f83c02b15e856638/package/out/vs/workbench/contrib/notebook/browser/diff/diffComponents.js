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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/browser/widget/diffEditorWidget", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/diff/diffElementOutputs", "vs/editor/browser/editorExtensions", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/contrib/codeEditor/browser/accessibility/accessibility", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/base/browser/ui/iconLabel/iconLabels", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration"], function (require, exports, DOM, lifecycle_1, network_1, instantiation_1, diffElementViewModel_1, notebookDiffEditorBrowser_1, codeEditorWidget_1, diffEditorWidget_1, model_1, language_1, notebookCommon_1, toolbar_1, contextView_1, actions_1, keybinding_1, notification_1, menuEntryActionViewItem_1, contextkey_1, cellActionView_1, notebookIcons_1, diffElementOutputs_1, editorExtensions_1, contextmenu_1, snippetController2_1, suggestController_1, accessibility_1, menuPreventer_1, selectionClipboard_1, tabCompletion_1, iconLabels_1, resolverService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModifiedElement = exports.InsertElement = exports.DeletedElement = exports.fixedDiffEditorOptions = exports.getOptimizedNestedCodeEditorWidgetOptions = exports.fixedEditorOptions = void 0;
    const fixedEditorPadding = {
        top: 12,
        bottom: 12
    };
    exports.fixedEditorOptions = {
        padding: fixedEditorPadding,
        scrollBeyondLastLine: false,
        scrollbar: {
            verticalScrollbarSize: 14,
            horizontal: 'auto',
            vertical: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            alwaysConsumeMouseWheel: false,
        },
        renderLineHighlightOnlyWhenFocus: true,
        overviewRulerLanes: 0,
        overviewRulerBorder: false,
        selectOnLineNumbers: false,
        wordWrap: 'off',
        lineNumbers: 'off',
        lineDecorationsWidth: 0,
        glyphMargin: false,
        fixedOverflowWidgets: true,
        minimap: { enabled: false },
        renderValidationDecorations: 'on',
        renderLineHighlight: 'none',
        readOnly: true
    };
    function getOptimizedNestedCodeEditorWidgetOptions() {
        return {
            isSimpleWidget: false,
            contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                menuPreventer_1.MenuPreventer.ID,
                selectionClipboard_1.SelectionClipboardContributionID,
                contextmenu_1.ContextMenuController.ID,
                suggestController_1.SuggestController.ID,
                snippetController2_1.SnippetController2.ID,
                tabCompletion_1.TabCompletionController.ID,
                accessibility_1.AccessibilityHelpController.ID
            ])
        };
    }
    exports.getOptimizedNestedCodeEditorWidgetOptions = getOptimizedNestedCodeEditorWidgetOptions;
    exports.fixedDiffEditorOptions = Object.assign(Object.assign({}, exports.fixedEditorOptions), { glyphMargin: true, enableSplitViewResizing: false, renderIndicators: true, readOnly: false, isInEmbeddedEditor: true, renderOverviewRuler: false });
    let PropertyHeader = class PropertyHeader extends lifecycle_1.Disposable {
        constructor(cell, propertyHeaderContainer, notebookEditor, accessor, contextMenuService, keybindingService, notificationService, menuService, contextKeyService) {
            super();
            this.cell = cell;
            this.propertyHeaderContainer = propertyHeaderContainer;
            this.notebookEditor = notebookEditor;
            this.accessor = accessor;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
        }
        buildHeader() {
            const metadataChanged = this.accessor.checkIfModified(this.cell);
            this._foldingIndicator = DOM.append(this.propertyHeaderContainer, DOM.$('.property-folding-indicator'));
            this._foldingIndicator.classList.add(this.accessor.prefix);
            this._updateFoldingIcon();
            const metadataStatus = DOM.append(this.propertyHeaderContainer, DOM.$('div.property-status'));
            this._statusSpan = DOM.append(metadataStatus, DOM.$('span'));
            this._description = DOM.append(metadataStatus, DOM.$('span.property-description'));
            if (metadataChanged) {
                this._statusSpan.textContent = this.accessor.changedLabel;
                this._statusSpan.style.fontWeight = 'bold';
                if (metadataChanged.reason) {
                    this._description.textContent = metadataChanged.reason;
                }
                this.propertyHeaderContainer.classList.add('modified');
            }
            else {
                this._statusSpan.textContent = this.accessor.unChangedLabel;
                this._description.textContent = '';
                this.propertyHeaderContainer.classList.remove('modified');
            }
            const cellToolbarContainer = DOM.append(this.propertyHeaderContainer, DOM.$('div.property-toolbar'));
            this._toolbar = new toolbar_1.ToolBar(cellToolbarContainer, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new cellActionView_1.CodiconActionViewItem(action, this.keybindingService, this.notificationService, this.contextKeyService);
                        return item;
                    }
                    return undefined;
                }
            });
            this._register(this._toolbar);
            this._toolbar.context = {
                cell: this.cell
            };
            const scopedContextKeyService = this.contextKeyService.createScoped(cellToolbarContainer);
            this._register(scopedContextKeyService);
            const propertyChanged = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY.bindTo(scopedContextKeyService);
            propertyChanged.set(!!metadataChanged);
            this._propertyExpanded = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED.bindTo(scopedContextKeyService);
            this._menu = this.menuService.createMenu(this.accessor.menuId, scopedContextKeyService);
            this._register(this._menu);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, { shouldForwardArgs: true }, actions);
            this._toolbar.setActions(actions);
            this._register(this._menu.onDidChange(() => {
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, { shouldForwardArgs: true }, actions);
                this._toolbar.setActions(actions);
            }));
            this._register(this.notebookEditor.onMouseUp(e => {
                if (!e.event.target) {
                    return;
                }
                const target = e.event.target;
                if (target.classList.contains('codicon-notebook-collapsed') || target.classList.contains('codicon-notebook-expanded')) {
                    const parent = target.parentElement;
                    if (!parent) {
                        return;
                    }
                    if (!parent.classList.contains(this.accessor.prefix)) {
                        return;
                    }
                    if (!parent.classList.contains('property-folding-indicator')) {
                        return;
                    }
                    // folding icon
                    const cellViewModel = e.target;
                    if (cellViewModel === this.cell) {
                        const oldFoldingState = this.accessor.getFoldingState(this.cell);
                        this.accessor.updateFoldingState(this.cell, oldFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded ? diffElementViewModel_1.PropertyFoldingState.Collapsed : diffElementViewModel_1.PropertyFoldingState.Expanded);
                        this._updateFoldingIcon();
                        this.accessor.updateInfoRendering(this.cell.renderOutput);
                    }
                }
                return;
            }));
            this._updateFoldingIcon();
            this.accessor.updateInfoRendering(this.cell.renderOutput);
        }
        refresh() {
            const metadataChanged = this.accessor.checkIfModified(this.cell);
            if (metadataChanged) {
                this._statusSpan.textContent = this.accessor.changedLabel;
                this._statusSpan.style.fontWeight = 'bold';
                if (metadataChanged.reason) {
                    this._description.textContent = metadataChanged.reason;
                }
                this.propertyHeaderContainer.classList.add('modified');
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, undefined, actions);
                this._toolbar.setActions(actions);
            }
            else {
                this._statusSpan.textContent = this.accessor.unChangedLabel;
                this._statusSpan.style.fontWeight = 'normal';
                this._description.textContent = '';
                this.propertyHeaderContainer.classList.remove('modified');
                this._toolbar.setActions([]);
            }
        }
        _updateFoldingIcon() {
            var _a, _b;
            if (this.accessor.getFoldingState(this.cell) === diffElementViewModel_1.PropertyFoldingState.Collapsed) {
                DOM.reset(this._foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.collapsedIcon));
                (_a = this._propertyExpanded) === null || _a === void 0 ? void 0 : _a.set(false);
            }
            else {
                DOM.reset(this._foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.expandedIcon));
                (_b = this._propertyExpanded) === null || _b === void 0 ? void 0 : _b.set(true);
            }
        }
    };
    PropertyHeader = __decorate([
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, notification_1.INotificationService),
        __param(7, actions_1.IMenuService),
        __param(8, contextkey_1.IContextKeyService)
    ], PropertyHeader);
    class AbstractElementRenderer extends lifecycle_1.Disposable {
        constructor(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.cell = cell;
            this.templateData = templateData;
            this.style = style;
            this.instantiationService = instantiationService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.textModelService = textModelService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this._metadataLocalDisposable = this._register(new lifecycle_1.DisposableStore());
            this._outputLocalDisposable = this._register(new lifecycle_1.DisposableStore());
            this._ignoreMetadata = false;
            this._ignoreOutputs = false;
            // init
            this._isDisposed = false;
            this._metadataEditorDisposeStore = this._register(new lifecycle_1.DisposableStore());
            this._outputEditorDisposeStore = this._register(new lifecycle_1.DisposableStore());
            this._register(cell.onDidLayoutChange(e => this.layout(e)));
            this._register(cell.onDidLayoutChange(e => this.updateBorders()));
            this.init();
            this.buildBody();
            this._register(cell.onDidStateChange(() => {
                this.updateOutputRendering(this.cell.renderOutput);
            }));
        }
        buildBody() {
            var _a;
            const body = this.templateData.body;
            this._diffEditorContainer = this.templateData.diffEditorContainer;
            body.classList.remove('left', 'right', 'full');
            switch (this.style) {
                case 'left':
                    body.classList.add('left');
                    break;
                case 'right':
                    body.classList.add('right');
                    break;
                default:
                    body.classList.add('full');
                    break;
            }
            this.styleContainer(this._diffEditorContainer);
            this.updateSourceEditor();
            this._ignoreMetadata = this.configurationService.getValue('notebook.diff.ignoreMetadata');
            if (this._ignoreMetadata) {
                this._disposeMetadata();
            }
            else {
                this._buildMetadata();
            }
            this._ignoreOutputs = this.configurationService.getValue('notebook.diff.ignoreOutputs') || !!((_a = this.notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.transientOptions.transientOutputs);
            if (this._ignoreOutputs) {
                this._disposeOutput();
            }
            else {
                this._buildOutput();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                var _a, _b;
                let metadataLayoutChange = false;
                let outputLayoutChange = false;
                if (e.affectsConfiguration('notebook.diff.ignoreMetadata')) {
                    const newValue = this.configurationService.getValue('notebook.diff.ignoreMetadata');
                    if (newValue !== undefined && this._ignoreMetadata !== newValue) {
                        this._ignoreMetadata = newValue;
                        this._metadataLocalDisposable.clear();
                        if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                            this._disposeMetadata();
                        }
                        else {
                            this.cell.metadataStatusHeight = 25;
                            this._buildMetadata();
                            this.updateMetadataRendering();
                            metadataLayoutChange = true;
                        }
                    }
                }
                if (e.affectsConfiguration('notebook.diff.ignoreOutputs')) {
                    const newValue = this.configurationService.getValue('notebook.diff.ignoreOutputs');
                    if (newValue !== undefined && this._ignoreOutputs !== (newValue || ((_a = this.notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.transientOptions.transientOutputs))) {
                        this._ignoreOutputs = newValue || !!((_b = this.notebookEditor.textModel) === null || _b === void 0 ? void 0 : _b.transientOptions.transientOutputs);
                        this._outputLocalDisposable.clear();
                        if (this._ignoreOutputs) {
                            this._disposeOutput();
                        }
                        else {
                            this.cell.outputStatusHeight = 25;
                            this._buildOutput();
                            outputLayoutChange = true;
                        }
                    }
                }
                this.layout({ metadataHeight: metadataLayoutChange, outputTotalHeight: outputLayoutChange });
            }));
        }
        updateMetadataRendering() {
            if (this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                // we should expand the metadata editor
                this._metadataInfoContainer.style.display = 'block';
                if (!this._metadataEditorContainer || !this._metadataEditor) {
                    // create editor
                    this._metadataEditorContainer = DOM.append(this._metadataInfoContainer, DOM.$('.metadata-editor-container'));
                    this._buildMetadataEditor();
                }
                else {
                    this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                }
            }
            else {
                // we should collapse the metadata editor
                this._metadataInfoContainer.style.display = 'none';
                // this._metadataEditorDisposeStore.clear();
                this.cell.metadataHeight = 0;
            }
        }
        updateOutputRendering(renderRichOutput) {
            if (this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                this._outputInfoContainer.style.display = 'block';
                if (renderRichOutput) {
                    this._hideOutputsRaw();
                    this._buildOutputRendererContainer();
                    this._showOutputsRenderer();
                    this._showOutputsEmptyView();
                }
                else {
                    this._hideOutputsRenderer();
                    this._buildOutputRawContainer();
                    this._showOutputsRaw();
                }
            }
            else {
                this._outputInfoContainer.style.display = 'none';
                this._hideOutputsRaw();
                this._hideOutputsRenderer();
                this._hideOutputsEmptyView();
            }
        }
        _buildOutputRawContainer() {
            if (!this._outputEditorContainer) {
                this._outputEditorContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-editor-container'));
                this._buildOutputEditor();
            }
        }
        _showOutputsRaw() {
            if (this._outputEditorContainer) {
                this._outputEditorContainer.style.display = 'block';
                this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
            }
        }
        _showOutputsEmptyView() {
            this.cell.layoutChange();
        }
        _hideOutputsRaw() {
            if (this._outputEditorContainer) {
                this._outputEditorContainer.style.display = 'none';
                this.cell.rawOutputHeight = 0;
            }
        }
        _hideOutputsEmptyView() {
            this.cell.layoutChange();
        }
        _applySanitizedMetadataChanges(currentMetadata, newMetadata) {
            const result = {};
            try {
                const newMetadataObj = JSON.parse(newMetadata);
                const keys = new Set([...Object.keys(newMetadataObj)]);
                for (const key of keys) {
                    switch (key) {
                        case 'inputCollapsed':
                        case 'outputCollapsed':
                            // boolean
                            if (typeof newMetadataObj[key] === 'boolean') {
                                result[key] = newMetadataObj[key];
                            }
                            else {
                                result[key] = currentMetadata[key];
                            }
                            break;
                        default:
                            result[key] = newMetadataObj[key];
                            break;
                    }
                }
                const index = this.notebookEditor.textModel.cells.indexOf(this.cell.modified.textModel);
                if (index < 0) {
                    return;
                }
                this.notebookEditor.textModel.applyEdits([
                    { editType: 3 /* CellEditType.Metadata */, index, metadata: result }
                ], true, undefined, () => undefined, undefined, true);
            }
            catch (_a) {
            }
        }
        async _buildMetadataEditor() {
            var _a;
            this._metadataEditorDisposeStore.clear();
            if (this.cell instanceof diffElementViewModel_1.SideBySideDiffElementViewModel) {
                this._metadataEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._metadataEditorContainer, Object.assign(Object.assign({}, exports.fixedDiffEditorOptions), { overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(), readOnly: false, originalEditable: false, ignoreTrimWhitespace: false, automaticLayout: false, dimension: {
                        height: this.cell.layoutInfo.metadataHeight,
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), true, true)
                    } }), {
                    originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                    modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                });
                this.layout({ metadataHeight: true });
                this._metadataEditorDisposeStore.add(this._metadataEditor);
                (_a = this._metadataEditorContainer) === null || _a === void 0 ? void 0 : _a.classList.add('diff');
                const originalMetadataModel = await this.textModelService.createModelReference(notebookCommon_1.CellUri.generateCellUri(this.cell.originalDocument.uri, this.cell.original.handle, network_1.Schemas.vscodeNotebookCellMetadata));
                const modifiedMetadataModel = await this.textModelService.createModelReference(notebookCommon_1.CellUri.generateCellUri(this.cell.modifiedDocument.uri, this.cell.modified.handle, network_1.Schemas.vscodeNotebookCellMetadata));
                this._metadataEditor.setModel({
                    original: originalMetadataModel.object.textEditorModel,
                    modified: modifiedMetadataModel.object.textEditorModel
                });
                this._metadataEditorDisposeStore.add(originalMetadataModel);
                this._metadataEditorDisposeStore.add(modifiedMetadataModel);
                this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                this._metadataEditorDisposeStore.add(this._metadataEditor.onDidContentSizeChange((e) => {
                    if (e.contentHeightChanged && this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                        this.cell.metadataHeight = e.contentHeight;
                    }
                }));
                let respondingToContentChange = false;
                this._metadataEditorDisposeStore.add(modifiedMetadataModel.object.textEditorModel.onDidChangeContent(() => {
                    respondingToContentChange = true;
                    const value = modifiedMetadataModel.object.textEditorModel.getValue();
                    this._applySanitizedMetadataChanges(this.cell.modified.metadata, value);
                    this._metadataHeader.refresh();
                    respondingToContentChange = false;
                }));
                this._metadataEditorDisposeStore.add(this.cell.modified.textModel.onDidChangeMetadata(() => {
                    var _a, _b;
                    if (respondingToContentChange) {
                        return;
                    }
                    const modifiedMetadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(this.notebookEditor.textModel, ((_a = this.cell.modified) === null || _a === void 0 ? void 0 : _a.metadata) || {}, (_b = this.cell.modified) === null || _b === void 0 ? void 0 : _b.language);
                    modifiedMetadataModel.object.textEditorModel.setValue(modifiedMetadataSource);
                }));
                return;
            }
            else {
                this._metadataEditor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._metadataEditorContainer, Object.assign(Object.assign({}, exports.fixedEditorOptions), { dimension: {
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true),
                        height: this.cell.layoutInfo.metadataHeight
                    }, overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(), readOnly: false }), {});
                this.layout({ metadataHeight: true });
                this._metadataEditorDisposeStore.add(this._metadataEditor);
                const mode = this.languageService.createById('jsonc');
                const originalMetadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(this.notebookEditor.textModel, this.cell.type === 'insert'
                    ? this.cell.modified.metadata || {}
                    : this.cell.original.metadata || {});
                const uri = this.cell.type === 'insert'
                    ? this.cell.modified.uri
                    : this.cell.original.uri;
                const handle = this.cell.type === 'insert'
                    ? this.cell.modified.handle
                    : this.cell.original.handle;
                const modelUri = notebookCommon_1.CellUri.generateCellUri(uri, handle, network_1.Schemas.vscodeNotebookCellMetadata);
                const metadataModel = this.modelService.createModel(originalMetadataSource, mode, modelUri, false);
                this._metadataEditor.setModel(metadataModel);
                this._metadataEditorDisposeStore.add(metadataModel);
                this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                this._metadataEditorDisposeStore.add(this._metadataEditor.onDidContentSizeChange((e) => {
                    if (e.contentHeightChanged && this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                        this.cell.metadataHeight = e.contentHeight;
                    }
                }));
            }
        }
        _buildOutputEditor() {
            var _a, _b, _c;
            this._outputEditorDisposeStore.clear();
            if ((this.cell.type === 'modified' || this.cell.type === 'unchanged') && !this.notebookEditor.textModel.transientOptions.transientOutputs) {
                const originalOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(((_a = this.cell.original) === null || _a === void 0 ? void 0 : _a.outputs) || []);
                const modifiedOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(((_b = this.cell.modified) === null || _b === void 0 ? void 0 : _b.outputs) || []);
                if (originalOutputsSource !== modifiedOutputsSource) {
                    const mode = this.languageService.createById('json');
                    const originalModel = this.modelService.createModel(originalOutputsSource, mode, undefined, true);
                    const modifiedModel = this.modelService.createModel(modifiedOutputsSource, mode, undefined, true);
                    this._outputEditorDisposeStore.add(originalModel);
                    this._outputEditorDisposeStore.add(modifiedModel);
                    const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
                    const lineCount = Math.max(originalModel.getLineCount(), modifiedModel.getLineCount());
                    this._outputEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._outputEditorContainer, Object.assign(Object.assign({}, exports.fixedDiffEditorOptions), { overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(), readOnly: true, ignoreTrimWhitespace: false, automaticLayout: false, dimension: {
                            height: Math.min(diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC, this.cell.layoutInfo.rawOutputHeight || lineHeight * lineCount),
                            width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true)
                        } }), {
                        originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                        modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                    });
                    this._outputEditorDisposeStore.add(this._outputEditor);
                    (_c = this._outputEditorContainer) === null || _c === void 0 ? void 0 : _c.classList.add('diff');
                    this._outputEditor.setModel({
                        original: originalModel,
                        modified: modifiedModel
                    });
                    this._outputEditor.restoreViewState(this.cell.getOutputEditorViewState());
                    this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
                    this._outputEditorDisposeStore.add(this._outputEditor.onDidContentSizeChange((e) => {
                        if (e.contentHeightChanged && this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                            this.cell.rawOutputHeight = e.contentHeight;
                        }
                    }));
                    this._outputEditorDisposeStore.add(this.cell.modified.textModel.onDidChangeOutputs(() => {
                        var _a;
                        const modifiedOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(((_a = this.cell.modified) === null || _a === void 0 ? void 0 : _a.outputs) || []);
                        modifiedModel.setValue(modifiedOutputsSource);
                        this._outputHeader.refresh();
                    }));
                    return;
                }
            }
            this._outputEditor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._outputEditorContainer, Object.assign(Object.assign({}, exports.fixedEditorOptions), { dimension: {
                    width: Math.min(diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC, this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, this.cell.type === 'unchanged' || this.cell.type === 'modified') - 32),
                    height: this.cell.layoutInfo.rawOutputHeight
                }, overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode() }), {});
            this._outputEditorDisposeStore.add(this._outputEditor);
            const mode = this.languageService.createById('json');
            const originaloutputSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.notebookEditor.textModel.transientOptions.transientOutputs
                ? []
                : this.cell.type === 'insert'
                    ? this.cell.modified.outputs || []
                    : this.cell.original.outputs || []);
            const outputModel = this.modelService.createModel(originaloutputSource, mode, undefined, true);
            this._outputEditorDisposeStore.add(outputModel);
            this._outputEditor.setModel(outputModel);
            this._outputEditor.restoreViewState(this.cell.getOutputEditorViewState());
            this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
            this._outputEditorDisposeStore.add(this._outputEditor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                    this.cell.rawOutputHeight = e.contentHeight;
                }
            }));
        }
        layoutNotebookCell() {
            this.notebookEditor.layoutNotebookCell(this.cell, this.cell.layoutInfo.totalHeight);
        }
        updateBorders() {
            this.templateData.leftBorder.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
            this.templateData.rightBorder.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
            this.templateData.bottomBorder.style.top = `${this.cell.layoutInfo.totalHeight - 32}px`;
        }
        dispose() {
            if (this._outputEditor) {
                this.cell.saveOutputEditorViewState(this._outputEditor.saveViewState());
            }
            if (this._metadataEditor) {
                this.cell.saveMetadataEditorViewState(this._metadataEditor.saveViewState());
            }
            this._metadataEditorDisposeStore.dispose();
            this._outputEditorDisposeStore.dispose();
            this._isDisposed = true;
            super.dispose();
        }
    }
    class SingleSideDiffElement extends AbstractElementRenderer {
        constructor(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
            this.cell = cell;
            this.templateData = templateData;
        }
        init() {
            this._diagonalFill = this.templateData.diagonalFill;
        }
        buildBody() {
            var _a;
            const body = this.templateData.body;
            this._diffEditorContainer = this.templateData.diffEditorContainer;
            body.classList.remove('left', 'right', 'full');
            switch (this.style) {
                case 'left':
                    body.classList.add('left');
                    break;
                case 'right':
                    body.classList.add('right');
                    break;
                default:
                    body.classList.add('full');
                    break;
            }
            this.styleContainer(this._diffEditorContainer);
            this.updateSourceEditor();
            if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                this._disposeMetadata();
            }
            else {
                this._buildMetadata();
            }
            if (this.configurationService.getValue('notebook.diff.ignoreOutputs') || ((_a = this.notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.transientOptions.transientOutputs)) {
                this._disposeOutput();
            }
            else {
                this._buildOutput();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                var _a;
                let metadataLayoutChange = false;
                let outputLayoutChange = false;
                if (e.affectsConfiguration('notebook.diff.ignoreMetadata')) {
                    this._metadataLocalDisposable.clear();
                    if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                        this._disposeMetadata();
                    }
                    else {
                        this.cell.metadataStatusHeight = 25;
                        this._buildMetadata();
                        this.updateMetadataRendering();
                        metadataLayoutChange = true;
                    }
                }
                if (e.affectsConfiguration('notebook.diff.ignoreOutputs')) {
                    this._outputLocalDisposable.clear();
                    if (this.configurationService.getValue('notebook.diff.ignoreOutputs') || ((_a = this.notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.transientOptions.transientOutputs)) {
                        this._disposeOutput();
                    }
                    else {
                        this.cell.outputStatusHeight = 25;
                        this._buildOutput();
                        outputLayoutChange = true;
                    }
                }
                this.layout({ metadataHeight: metadataLayoutChange, outputTotalHeight: outputLayoutChange });
            }));
        }
        _disposeMetadata() {
            this.cell.metadataStatusHeight = 0;
            this.cell.metadataHeight = 0;
            this.templateData.metadataHeaderContainer.style.display = 'none';
            this.templateData.metadataInfoContainer.style.display = 'none';
            this._metadataEditor = undefined;
        }
        _buildMetadata() {
            this._metadataHeaderContainer = this.templateData.metadataHeaderContainer;
            this._metadataInfoContainer = this.templateData.metadataInfoContainer;
            this._metadataHeaderContainer.style.display = 'flex';
            this._metadataInfoContainer.style.display = 'block';
            this._metadataHeaderContainer.innerText = '';
            this._metadataInfoContainer.innerText = '';
            this._metadataHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._metadataHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateMetadataRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkMetadataIfModified();
                },
                getFoldingState: (cell) => {
                    return cell.metadataFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.metadataFoldingState = state;
                },
                unChangedLabel: 'Metadata',
                changedLabel: 'Metadata changed',
                prefix: 'metadata',
                menuId: actions_1.MenuId.NotebookDiffCellMetadataTitle
            });
            this._metadataLocalDisposable.add(this._metadataHeader);
            this._metadataHeader.buildHeader();
        }
        _buildOutput() {
            this.templateData.outputHeaderContainer.style.display = 'flex';
            this.templateData.outputInfoContainer.style.display = 'block';
            this._outputHeaderContainer = this.templateData.outputHeaderContainer;
            this._outputInfoContainer = this.templateData.outputInfoContainer;
            this._outputHeaderContainer.innerText = '';
            this._outputInfoContainer.innerText = '';
            this._outputHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._outputHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateOutputRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkIfOutputsModified();
                },
                getFoldingState: (cell) => {
                    return cell.outputFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.outputFoldingState = state;
                },
                unChangedLabel: 'Outputs',
                changedLabel: 'Outputs changed',
                prefix: 'output',
                menuId: actions_1.MenuId.NotebookDiffCellOutputsTitle
            });
            this._outputLocalDisposable.add(this._outputHeader);
            this._outputHeader.buildHeader();
        }
        _disposeOutput() {
            this._hideOutputsRaw();
            this._hideOutputsRenderer();
            this._hideOutputsEmptyView();
            this.cell.rawOutputHeight = 0;
            this.cell.outputStatusHeight = 0;
            this.templateData.outputHeaderContainer.style.display = 'none';
            this.templateData.outputInfoContainer.style.display = 'none';
            this._outputViewContainer = undefined;
        }
    }
    let DeletedElement = class DeletedElement extends SingleSideDiffElement {
        constructor(notebookEditor, cell, templateData, languageService, modelService, textModelService, instantiationService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'left', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
        }
        styleContainer(container) {
            container.classList.remove('inserted');
            container.classList.add('removed');
        }
        updateSourceEditor() {
            const originalCell = this.cell.original;
            const lineCount = originalCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = lineCount * lineHeight + fixedEditorPadding.top + fixedEditorPadding.bottom;
            this._editor = this.templateData.sourceEditor;
            this._editor.layout({
                width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                height: editorHeight
            });
            this.cell.editorHeight = editorHeight;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this.textModelService.createModelReference(originalCell.uri).then(ref => {
                if (this._isDisposed) {
                    return;
                }
                this._register(ref);
                const textModel = ref.object.textEditorModel;
                this._editor.setModel(textModel);
                this.cell.editorHeight = this._editor.getContentHeight();
            });
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(() => {
                var _a, _b;
                if (state.editorHeight || state.outerWidth) {
                    this._editor.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.metadataHeight || state.outerWidth) {
                    (_a = this._metadataEditor) === null || _a === void 0 ? void 0 : _a.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.metadataHeight
                    });
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    (_b = this._outputEditor) === null || _b === void 0 ? void 0 : _b.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.outputTotalHeight
                    });
                }
                if (this._diagonalFill) {
                    this._diagonalFill.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
                }
                this.layoutNotebookCell();
            });
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                const span = DOM.append(this._outputEmptyElement, DOM.$('span'));
                span.innerText = 'No outputs to render';
                if (this.cell.original.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._outputLeftView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.original, notebookDiffEditorBrowser_1.DiffSide.Original, this._outputViewContainer);
                this._register(this._outputLeftView);
                this._outputLeftView.render();
                const removedOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                    if (e.cell.uri.toString() === this.cell.original.uri.toString()) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                        removedOutputRenderListener.dispose();
                    }
                });
                this._register(removedOutputRenderListener);
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
        }
        _showOutputsRenderer() {
            var _a;
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                (_a = this._outputLeftView) === null || _a === void 0 ? void 0 : _a.showOutputs();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            var _a;
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                (_a = this._outputLeftView) === null || _a === void 0 ? void 0 : _a.hideOutputs();
            }
        }
        dispose() {
            if (this._editor) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    DeletedElement = __decorate([
        __param(3, language_1.ILanguageService),
        __param(4, model_1.IModelService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], DeletedElement);
    exports.DeletedElement = DeletedElement;
    let InsertElement = class InsertElement extends SingleSideDiffElement {
        constructor(notebookEditor, cell, templateData, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'right', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
        }
        styleContainer(container) {
            container.classList.remove('removed');
            container.classList.add('inserted');
        }
        updateSourceEditor() {
            const modifiedCell = this.cell.modified;
            const lineCount = modifiedCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = lineCount * lineHeight + fixedEditorPadding.top + fixedEditorPadding.bottom;
            this._editor = this.templateData.sourceEditor;
            this._editor.layout({
                width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                height: editorHeight
            });
            this._editor.updateOptions({ readOnly: false });
            this.cell.editorHeight = editorHeight;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this.textModelService.createModelReference(modifiedCell.uri).then(ref => {
                if (this._isDisposed) {
                    return;
                }
                this._register(ref);
                const textModel = ref.object.textEditorModel;
                this._editor.setModel(textModel);
                this._editor.restoreViewState(this.cell.getSourceEditorViewState());
                this.cell.editorHeight = this._editor.getContentHeight();
            });
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                this._outputEmptyElement.innerText = 'No outputs to render';
                if (this.cell.modified.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._outputRightView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.modified, notebookDiffEditorBrowser_1.DiffSide.Modified, this._outputViewContainer);
                this._register(this._outputRightView);
                this._outputRightView.render();
                const insertOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                    if (e.cell.uri.toString() === this.cell.modified.uri.toString()) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
                        insertOutputRenderListener.dispose();
                    }
                });
                this._register(insertOutputRenderListener);
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
        }
        _showOutputsRenderer() {
            var _a;
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                (_a = this._outputRightView) === null || _a === void 0 ? void 0 : _a.showOutputs();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            var _a;
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                (_a = this._outputRightView) === null || _a === void 0 ? void 0 : _a.hideOutputs();
            }
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(() => {
                var _a, _b;
                if (state.editorHeight || state.outerWidth) {
                    this._editor.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.metadataHeight || state.outerWidth) {
                    (_a = this._metadataEditor) === null || _a === void 0 ? void 0 : _a.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true),
                        height: this.cell.layoutInfo.metadataHeight
                    });
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    (_b = this._outputEditor) === null || _b === void 0 ? void 0 : _b.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.outputTotalHeight
                    });
                }
                this.layoutNotebookCell();
                if (this._diagonalFill) {
                    this._diagonalFill.style.height = `${this.cell.layoutInfo.editorHeight + this.cell.layoutInfo.editorMargin + this.cell.layoutInfo.metadataStatusHeight + this.cell.layoutInfo.metadataHeight + this.cell.layoutInfo.outputTotalHeight + this.cell.layoutInfo.outputStatusHeight}px`;
                }
            });
        }
        dispose() {
            if (this._editor) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    InsertElement = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, language_1.ILanguageService),
        __param(5, model_1.IModelService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], InsertElement);
    exports.InsertElement = InsertElement;
    let ModifiedElement = class ModifiedElement extends AbstractElementRenderer {
        constructor(notebookEditor, cell, templateData, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'full', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
            this.cell = cell;
            this.templateData = templateData;
        }
        init() { }
        styleContainer(container) {
            container.classList.remove('inserted', 'removed');
        }
        _disposeMetadata() {
            this.cell.metadataStatusHeight = 0;
            this.cell.metadataHeight = 0;
            this.templateData.metadataHeaderContainer.style.display = 'none';
            this.templateData.metadataInfoContainer.style.display = 'none';
            this._metadataEditor = undefined;
        }
        _buildMetadata() {
            this._metadataHeaderContainer = this.templateData.metadataHeaderContainer;
            this._metadataInfoContainer = this.templateData.metadataInfoContainer;
            this._metadataHeaderContainer.style.display = 'flex';
            this._metadataInfoContainer.style.display = 'block';
            this._metadataHeaderContainer.innerText = '';
            this._metadataInfoContainer.innerText = '';
            this._metadataHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._metadataHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateMetadataRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkMetadataIfModified();
                },
                getFoldingState: (cell) => {
                    return cell.metadataFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.metadataFoldingState = state;
                },
                unChangedLabel: 'Metadata',
                changedLabel: 'Metadata changed',
                prefix: 'metadata',
                menuId: actions_1.MenuId.NotebookDiffCellMetadataTitle
            });
            this._metadataLocalDisposable.add(this._metadataHeader);
            this._metadataHeader.buildHeader();
        }
        _disposeOutput() {
            this._hideOutputsRaw();
            this._hideOutputsRenderer();
            this._hideOutputsEmptyView();
            this.cell.rawOutputHeight = 0;
            this.cell.outputStatusHeight = 0;
            this.templateData.outputHeaderContainer.style.display = 'none';
            this.templateData.outputInfoContainer.style.display = 'none';
            this._outputViewContainer = undefined;
        }
        _buildOutput() {
            this.templateData.outputHeaderContainer.style.display = 'flex';
            this.templateData.outputInfoContainer.style.display = 'block';
            this._outputHeaderContainer = this.templateData.outputHeaderContainer;
            this._outputInfoContainer = this.templateData.outputInfoContainer;
            this._outputHeaderContainer.innerText = '';
            this._outputInfoContainer.innerText = '';
            if (this.cell.checkIfOutputsModified()) {
                this._outputInfoContainer.classList.add('modified');
            }
            else {
                this._outputInfoContainer.classList.remove('modified');
            }
            this._outputHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._outputHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateOutputRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkIfOutputsModified();
                },
                getFoldingState: (cell) => {
                    return cell.outputFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.outputFoldingState = state;
                },
                unChangedLabel: 'Outputs',
                changedLabel: 'Outputs changed',
                prefix: 'output',
                menuId: actions_1.MenuId.NotebookDiffCellOutputsTitle
            });
            this._outputLocalDisposable.add(this._outputHeader);
            this._outputHeader.buildHeader();
        }
        _buildOutputRendererContainer() {
            var _a, _b;
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                this._outputEmptyElement.innerText = 'No outputs to render';
                if (!this.cell.checkIfOutputsModified() && this.cell.modified.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._register(this.cell.modified.textModel.onDidChangeOutputs(() => {
                    // currently we only allow outputs change to the modified cell
                    if (!this.cell.checkIfOutputsModified() && this.cell.modified.outputs.length === 0) {
                        this._outputEmptyElement.style.display = 'block';
                    }
                    else {
                        this._outputEmptyElement.style.display = 'none';
                    }
                }));
                this._outputLeftContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-left'));
                this._outputRightContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-right'));
                this._outputMetadataContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-metadata'));
                const outputModified = this.cell.checkIfOutputsModified();
                const outputMetadataChangeOnly = outputModified
                    && outputModified.kind === 1 /* OutputComparison.Metadata */
                    && this.cell.original.outputs.length === 1
                    && this.cell.modified.outputs.length === 1
                    && (0, diffElementViewModel_1.outputEqual)(this.cell.original.outputs[0], this.cell.modified.outputs[0]) === 1 /* OutputComparison.Metadata */;
                if (outputModified && !outputMetadataChangeOnly) {
                    const originalOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                        if (e.cell.uri.toString() === this.cell.original.uri.toString()) {
                            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                            originalOutputRenderListener.dispose();
                        }
                    });
                    const modifiedOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                        if (e.cell.uri.toString() === this.cell.modified.uri.toString()) {
                            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
                            modifiedOutputRenderListener.dispose();
                        }
                    });
                    this._register(originalOutputRenderListener);
                    this._register(modifiedOutputRenderListener);
                }
                // We should use the original text model here
                this._outputLeftView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.original, notebookDiffEditorBrowser_1.DiffSide.Original, this._outputLeftContainer);
                this._outputLeftView.render();
                this._register(this._outputLeftView);
                this._outputRightView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.modified, notebookDiffEditorBrowser_1.DiffSide.Modified, this._outputRightContainer);
                this._outputRightView.render();
                this._register(this._outputRightView);
                if (outputModified && !outputMetadataChangeOnly) {
                    this._decorate();
                }
                if (outputMetadataChangeOnly) {
                    this._outputMetadataContainer.style.top = `${this.cell.layoutInfo.rawOutputHeight}px`;
                    // single output, metadata change, let's render a diff editor for metadata
                    this._outputMetadataEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._outputMetadataContainer, Object.assign(Object.assign({}, exports.fixedDiffEditorOptions), { overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(), readOnly: true, ignoreTrimWhitespace: false, automaticLayout: false, dimension: {
                            height: diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC,
                            width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true)
                        } }), {
                        originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                        modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                    });
                    this._register(this._outputMetadataEditor);
                    const originalOutputMetadataSource = JSON.stringify((_a = this.cell.original.outputs[0].metadata) !== null && _a !== void 0 ? _a : {}, undefined, '\t');
                    const modifiedOutputMetadataSource = JSON.stringify((_b = this.cell.modified.outputs[0].metadata) !== null && _b !== void 0 ? _b : {}, undefined, '\t');
                    const mode = this.languageService.createById('json');
                    const originalModel = this.modelService.createModel(originalOutputMetadataSource, mode, undefined, true);
                    const modifiedModel = this.modelService.createModel(modifiedOutputMetadataSource, mode, undefined, true);
                    this._outputMetadataEditor.setModel({
                        original: originalModel,
                        modified: modifiedModel
                    });
                    this.cell.outputMetadataHeight = this._outputMetadataEditor.getContentHeight();
                    this._register(this._outputMetadataEditor.onDidContentSizeChange((e) => {
                        this.cell.outputMetadataHeight = e.contentHeight;
                    }));
                }
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            if (this.cell.checkIfOutputsModified()) {
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
            }
        }
        _showOutputsRenderer() {
            var _a, _b, _c;
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                (_a = this._outputLeftView) === null || _a === void 0 ? void 0 : _a.showOutputs();
                (_b = this._outputRightView) === null || _b === void 0 ? void 0 : _b.showOutputs();
                (_c = this._outputMetadataEditor) === null || _c === void 0 ? void 0 : _c.layout();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            var _a, _b;
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                (_a = this._outputLeftView) === null || _a === void 0 ? void 0 : _a.hideOutputs();
                (_b = this._outputRightView) === null || _b === void 0 ? void 0 : _b.hideOutputs();
            }
        }
        updateSourceEditor() {
            const modifiedCell = this.cell.modified;
            const lineCount = modifiedCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = this.cell.layoutInfo.editorHeight !== 0 ? this.cell.layoutInfo.editorHeight : lineCount * lineHeight + fixedEditorPadding.top + fixedEditorPadding.bottom;
            this._editorContainer = this.templateData.editorContainer;
            this._editor = this.templateData.sourceEditor;
            this._editorContainer.classList.add('diff');
            this._editor.layout({
                width: this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN,
                height: editorHeight
            });
            this._editorContainer.style.height = `${editorHeight}px`;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this._initializeSourceDiffEditor();
            const scopedContextKeyService = this.contextKeyService.createScoped(this.templateData.inputToolbarContainer);
            this._register(scopedContextKeyService);
            const inputChanged = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_INPUT.bindTo(scopedContextKeyService);
            this._inputToolbarContainer = this.templateData.inputToolbarContainer;
            this._toolbar = this.templateData.toolbar;
            this._toolbar.context = {
                cell: this.cell
            };
            if (this.cell.modified.textModel.getValue() !== this.cell.original.textModel.getValue()) {
                this._inputToolbarContainer.style.display = 'block';
                inputChanged.set(true);
            }
            else {
                this._inputToolbarContainer.style.display = 'none';
                inputChanged.set(false);
            }
            this._register(this.cell.modified.textModel.onDidChangeContent(() => {
                if (this.cell.modified.textModel.getValue() !== this.cell.original.textModel.getValue()) {
                    this._inputToolbarContainer.style.display = 'block';
                    inputChanged.set(true);
                }
                else {
                    this._inputToolbarContainer.style.display = 'none';
                    inputChanged.set(false);
                }
            }));
            this._menu = this.menuService.createMenu(actions_1.MenuId.NotebookDiffCellInputTitle, scopedContextKeyService);
            this._register(this._menu);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, { shouldForwardArgs: true }, actions);
            this._toolbar.setActions(actions);
        }
        async _initializeSourceDiffEditor() {
            const originalCell = this.cell.original;
            const modifiedCell = this.cell.modified;
            const originalRef = await this.textModelService.createModelReference(originalCell.uri);
            const modifiedRef = await this.textModelService.createModelReference(modifiedCell.uri);
            if (this._isDisposed) {
                return;
            }
            const textModel = originalRef.object.textEditorModel;
            const modifiedTextModel = modifiedRef.object.textEditorModel;
            this._register(originalRef);
            this._register(modifiedRef);
            this._editor.setModel({
                original: textModel,
                modified: modifiedTextModel
            });
            this._editor.restoreViewState(this.cell.getSourceEditorViewState());
            const contentHeight = this._editor.getContentHeight();
            this.cell.editorHeight = contentHeight;
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(() => {
                var _a, _b, _c;
                if (state.editorHeight) {
                    this._editorContainer.style.height = `${this.cell.layoutInfo.editorHeight}px`;
                    this._editor.layout({
                        width: this._editor.getViewWidth(),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.outerWidth) {
                    this._editorContainer.style.height = `${this.cell.layoutInfo.editorHeight}px`;
                    this._editor.layout();
                }
                if (state.metadataHeight || state.outerWidth) {
                    if (this._metadataEditorContainer) {
                        this._metadataEditorContainer.style.height = `${this.cell.layoutInfo.metadataHeight}px`;
                        (_a = this._metadataEditor) === null || _a === void 0 ? void 0 : _a.layout();
                    }
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    if (this._outputEditorContainer) {
                        this._outputEditorContainer.style.height = `${this.cell.layoutInfo.outputTotalHeight}px`;
                        (_b = this._outputEditor) === null || _b === void 0 ? void 0 : _b.layout();
                    }
                    if (this._outputMetadataContainer) {
                        this._outputMetadataContainer.style.height = `${this.cell.layoutInfo.outputMetadataHeight}px`;
                        this._outputMetadataContainer.style.top = `${this.cell.layoutInfo.outputTotalHeight - this.cell.layoutInfo.outputMetadataHeight}px`;
                        (_c = this._outputMetadataEditor) === null || _c === void 0 ? void 0 : _c.layout();
                    }
                }
                this.layoutNotebookCell();
            });
        }
        dispose() {
            if (this._editor) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    ModifiedElement = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, language_1.ILanguageService),
        __param(5, model_1.IModelService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], ModifiedElement);
    exports.ModifiedElement = ModifiedElement;
});
//# sourceMappingURL=diffComponents.js.map