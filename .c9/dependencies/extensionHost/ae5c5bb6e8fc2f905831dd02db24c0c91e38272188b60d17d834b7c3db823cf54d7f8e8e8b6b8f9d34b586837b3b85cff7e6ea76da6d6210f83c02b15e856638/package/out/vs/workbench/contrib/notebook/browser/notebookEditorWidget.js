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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uuid", "vs/editor/browser/config/fontMeasurements", "vs/editor/common/config/fontInfo", "vs/editor/common/core/range", "vs/editor/contrib/suggest/browser/suggestController", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/layout/browser/layoutService", "vs/platform/layout/browser/zIndexRegistry", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/notebookEditorService", "vs/workbench/contrib/notebook/browser/notebookLogger", "vs/workbench/contrib/notebook/browser/notebookViewEvents", "vs/workbench/contrib/notebook/browser/view/cellParts/cellContextKeys", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDnd", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/view/renderers/backLayerWebView", "vs/workbench/contrib/notebook/browser/view/renderers/cellRenderer", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModelImpl", "vs/workbench/contrib/notebook/browser/viewModel/viewContext", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorDecorations", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorToolbar", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorWidgetContextKeys", "vs/workbench/contrib/notebook/browser/viewParts/notebookOverviewRuler", "vs/workbench/contrib/notebook/browser/viewParts/notebookTopCellToolbar", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookOptions", "vs/workbench/contrib/notebook/common/notebookPerformance", "vs/workbench/contrib/notebook/common/notebookRendererMessagingService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/scm/browser/dirtydiffDecorator", "vs/editor/browser/editorExtensions", "vs/css!./media/notebook", "vs/css!./media/notebookCellInsertToolbar", "vs/css!./media/notebookCellStatusBar", "vs/css!./media/notebookCellTitleToolbar", "vs/css!./media/notebookFocusIndicator", "vs/css!./media/notebookToolbar"], function (require, exports, browser_1, DOM, aria, async_1, color_1, errors_1, event_1, lifecycle_1, objects_1, platform_1, resources_1, uuid_1, fontMeasurements_1, fontInfo_1, range_1, suggestController_1, nls, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, layoutService_1, zIndexRegistry_1, progress_1, telemetry_1, colorRegistry_1, themeService_1, theme_1, debugColors_1, notebookBrowser_1, notebookEditorExtensions_1, notebookEditorService_1, notebookLogger_1, notebookViewEvents_1, cellContextKeys_1, cellDnd_1, notebookCellList_1, backLayerWebView_1, cellRenderer_1, codeCellViewModel_1, eventDispatcher_1, markupCellViewModel_1, notebookViewModelImpl_1, viewContext_1, notebookEditorDecorations_1, notebookEditorToolbar_1, notebookEditorWidgetContextKeys_1, notebookOverviewRuler_1, notebookTopCellToolbar_1, notebookCommon_1, notebookContextKeys_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookOptions_1, notebookPerformance_1, notebookRendererMessagingService_1, notebookService_1, dirtydiffDecorator_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cellEditorBackground = exports.cellSymbolHighlight = exports.listScrollbarSliderActiveBackground = exports.listScrollbarSliderHoverBackground = exports.listScrollbarSliderBackground = exports.cellInsertionIndicator = exports.cellStatusBarItemHover = exports.inactiveFocusedCellBorder = exports.focusedCellBorder = exports.inactiveSelectedCellBorder = exports.selectedCellBorder = exports.cellHoverBackground = exports.selectedCellBackground = exports.focusedCellBackground = exports.CELL_TOOLBAR_SEPERATOR = exports.notebookOutputContainerColor = exports.notebookOutputContainerBorderColor = exports.cellStatusIconRunning = exports.cellStatusIconError = exports.cellStatusIconSuccess = exports.focusedEditorBorderColor = exports.notebookCellBorder = exports.NotebookEditorWidget = exports.getDefaultNotebookCreationOptions = exports.BaseCellEditorOptions = void 0;
    const $ = DOM.$;
    class BaseCellEditorOptions extends lifecycle_1.Disposable {
        constructor(notebookEditor, notebookOptions, configurationService, language) {
            super();
            this.notebookEditor = notebookEditor;
            this.notebookOptions = notebookOptions;
            this.configurationService = configurationService;
            this.language = language;
            this._localDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor') || e.affectsConfiguration('notebook')) {
                    this._recomputeOptions();
                }
            }));
            this._register(notebookOptions.onDidChangeOptions(e => {
                if (e.cellStatusBarVisibility || e.editorTopPadding || e.editorOptionsCustomizations) {
                    this._recomputeOptions();
                }
            }));
            this._register(this.notebookEditor.onDidChangeModel(() => {
                this._localDisposableStore.clear();
                if (this.notebookEditor.hasModel()) {
                    this._localDisposableStore.add(this.notebookEditor.onDidChangeOptions(() => {
                        this._recomputeOptions();
                    }));
                    this._recomputeOptions();
                }
            }));
            if (this.notebookEditor.hasModel()) {
                this._localDisposableStore.add(this.notebookEditor.onDidChangeOptions(() => {
                    this._recomputeOptions();
                }));
            }
            this._value = this._computeEditorOptions();
        }
        get value() {
            return this._value;
        }
        _recomputeOptions() {
            this._value = this._computeEditorOptions();
            this._onDidChange.fire();
        }
        _computeEditorOptions() {
            var _a;
            const editorOptions = (0, objects_1.deepClone)(this.configurationService.getValue('editor', { overrideIdentifier: this.language }));
            const layoutConfig = this.notebookOptions.getLayoutConfiguration();
            const editorOptionsOverrideRaw = (_a = layoutConfig.editorOptionsCustomizations) !== null && _a !== void 0 ? _a : {};
            const editorOptionsOverride = {};
            for (const key in editorOptionsOverrideRaw) {
                if (key.indexOf('editor.') === 0) {
                    editorOptionsOverride[key.substring(7)] = editorOptionsOverrideRaw[key];
                }
            }
            const computed = Object.freeze(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, editorOptions), BaseCellEditorOptions.fixedEditorOptions), editorOptionsOverride), { padding: { top: 12, bottom: 12 } }), { readOnly: this.notebookEditor.isReadOnly }));
            return computed;
        }
    }
    exports.BaseCellEditorOptions = BaseCellEditorOptions;
    BaseCellEditorOptions.fixedEditorOptions = {
        scrollBeyondLastLine: false,
        scrollbar: {
            verticalScrollbarSize: 14,
            horizontal: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            alwaysConsumeMouseWheel: false
        },
        renderLineHighlightOnlyWhenFocus: true,
        overviewRulerLanes: 0,
        selectOnLineNumbers: false,
        lineNumbers: 'off',
        lineDecorationsWidth: 0,
        folding: true,
        fixedOverflowWidgets: true,
        minimap: { enabled: false },
        renderValidationDecorations: 'on',
        lineNumbersMinChars: 3
    };
    function getDefaultNotebookCreationOptions() {
        // We inlined the id to avoid loading comment contrib in tests
        const skipContributions = ['editor.contrib.review'];
        const contributions = editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => skipContributions.indexOf(c.id) === -1);
        return {
            menuIds: {
                notebookToolbar: actions_1.MenuId.NotebookToolbar,
                cellTitleToolbar: actions_1.MenuId.NotebookCellTitle,
                cellInsertToolbar: actions_1.MenuId.NotebookCellBetween,
                cellTopInsertToolbar: actions_1.MenuId.NotebookCellListTop,
                cellExecuteToolbar: actions_1.MenuId.NotebookCellExecute,
                cellExecutePrimary: actions_1.MenuId.NotebookCellExecutePrimary,
            },
            cellEditorContributions: contributions
        };
    }
    exports.getDefaultNotebookCreationOptions = getDefaultNotebookCreationOptions;
    let NotebookEditorWidget = class NotebookEditorWidget extends lifecycle_1.Disposable {
        constructor(creationOptions, instantiationService, notebookRendererMessaging, notebookEditorService, notebookKernelService, _notebookService, configurationService, contextKeyService, layoutService, contextMenuService, menuService, themeService, telemetryService, notebookExecutionService, notebookExecutionStateService, editorProgressService) {
            var _a, _b, _c;
            super();
            this.creationOptions = creationOptions;
            this.notebookRendererMessaging = notebookRendererMessaging;
            this.notebookEditorService = notebookEditorService;
            this.notebookKernelService = notebookKernelService;
            this._notebookService = _notebookService;
            this.configurationService = configurationService;
            this.layoutService = layoutService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.themeService = themeService;
            this.telemetryService = telemetryService;
            this.notebookExecutionService = notebookExecutionService;
            this.editorProgressService = editorProgressService;
            //#region Eventing
            this._onDidChangeCellState = this._register(new event_1.Emitter());
            this.onDidChangeCellState = this._onDidChangeCellState.event;
            this._onDidChangeViewCells = this._register(new event_1.Emitter());
            this.onDidChangeViewCells = this._onDidChangeViewCells.event;
            this._onDidChangeModel = this._register(new event_1.Emitter());
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._onDidChangeOptions = this._register(new event_1.Emitter());
            this.onDidChangeOptions = this._onDidChangeOptions.event;
            this._onDidChangeDecorations = this._register(new event_1.Emitter());
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidChangeContentHeight = this._register(new event_1.Emitter());
            this.onDidChangeContentHeight = this._onDidChangeContentHeight.event;
            this._onDidChangeActiveCell = this._register(new event_1.Emitter());
            this.onDidChangeActiveCell = this._onDidChangeActiveCell.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeVisibleRanges = this._register(new event_1.Emitter());
            this.onDidChangeVisibleRanges = this._onDidChangeVisibleRanges.event;
            this._onDidFocusEmitter = this._register(new event_1.Emitter());
            this.onDidFocusWidget = this._onDidFocusEmitter.event;
            this._onDidBlurEmitter = this._register(new event_1.Emitter());
            this.onDidBlurWidget = this._onDidBlurEmitter.event;
            this._onDidChangeActiveEditor = this._register(new event_1.Emitter());
            this.onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;
            this._onDidChangeActiveKernel = this._register(new event_1.Emitter());
            this.onDidChangeActiveKernel = this._onDidChangeActiveKernel.event;
            this._onMouseUp = this._register(new event_1.Emitter());
            this.onMouseUp = this._onMouseUp.event;
            this._onMouseDown = this._register(new event_1.Emitter());
            this.onMouseDown = this._onMouseDown.event;
            this._onDidReceiveMessage = this._register(new event_1.Emitter());
            this.onDidReceiveMessage = this._onDidReceiveMessage.event;
            this._onDidRenderOutput = this._register(new event_1.Emitter());
            this.onDidRenderOutput = this._onDidRenderOutput.event;
            this._webview = null;
            this._webviewResolvePromise = null;
            this._webviewTransparentCover = null;
            this._listDelegate = null;
            this._dndController = null;
            this._listTopCellToolbar = null;
            this._renderedEditors = new Map();
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._localCellStateListeners = [];
            this._dimension = null;
            this._shadowElementViewInfo = null;
            this._contributions = new Map();
            this._insetModifyQueueByOutputId = new async_1.SequencerByKey();
            this._cellContextKeyManager = null;
            this._isVisible = false;
            this._uuid = (0, uuid_1.generateUuid)();
            this._webviewFocused = false;
            this._isDisposed = false;
            this._cursorNavigationMode = false;
            this._baseCellEditorOptions = new Map();
            this._debugFlag = false;
            this._isScheduled = false;
            this._lastCellWithEditorFocus = null;
            //#endregion
            //#region Decorations
            this._editorStyleSheets = new Map();
            this._decorationRules = new Map();
            this._decortionKeyToIds = new Map();
            //#endregion
            //#region Cell operations/layout API
            this._pendingLayouts = new WeakMap();
            this._pendingOutputHeightAcks = new Map();
            this.isEmbedded = (_a = creationOptions.isEmbedded) !== null && _a !== void 0 ? _a : false;
            this._readOnly = (_b = creationOptions.isReadOnly) !== null && _b !== void 0 ? _b : false;
            this._notebookOptions = (_c = creationOptions.options) !== null && _c !== void 0 ? _c : new notebookOptions_1.NotebookOptions(this.configurationService, notebookExecutionStateService);
            this._register(this._notebookOptions);
            this._viewContext = new viewContext_1.ViewContext(this._notebookOptions, new eventDispatcher_1.NotebookEventDispatcher());
            this._register(this._viewContext.eventDispatcher.onDidChangeCellState(e => {
                this._onDidChangeCellState.fire(e);
            }));
            this._overlayContainer = document.createElement('div');
            this.scopedContextKeyService = contextKeyService.createScoped(this._overlayContainer);
            this.instantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
            this._register(this.instantiationService.createInstance(notebookEditorWidgetContextKeys_1.NotebookEditorContextKeys, this));
            this._register(notebookKernelService.onDidChangeSelectedNotebooks(e => {
                var _a;
                if ((0, resources_1.isEqual)(e.notebook, (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.uri)) {
                    this._loadKernelPreloads();
                    this._onDidChangeActiveKernel.fire();
                }
            }));
            this._scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.scrollBeyondLastLine')) {
                    this._scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
                    if (this._dimension && this._isVisible) {
                        this.layout(this._dimension);
                    }
                }
            }));
            this._register(this._notebookOptions.onDidChangeOptions(e => {
                var _a, _b;
                if (e.cellStatusBarVisibility || e.cellToolbarLocation || e.cellToolbarInteraction) {
                    this._updateForNotebookConfiguration();
                }
                if (e.fontFamily) {
                    this._generateFontInfo();
                }
                if (e.compactView || e.focusIndicator || e.insertToolbarPosition || e.cellToolbarLocation || e.dragAndDropEnabled || e.fontSize || e.outputFontSize || e.markupFontSize || e.fontFamily || e.outputFontFamily || e.insertToolbarAlignment || e.outputLineHeight) {
                    (_a = this._styleElement) === null || _a === void 0 ? void 0 : _a.remove();
                    this._createLayoutStyles();
                    (_b = this._webview) === null || _b === void 0 ? void 0 : _b.updateOptions(Object.assign(Object.assign({}, this.notebookOptions.computeWebviewOptions()), { fontFamily: this._generateFontFamily() }));
                }
                if (this._dimension && this._isVisible) {
                    this.layout(this._dimension);
                }
            }));
            this.notebookEditorService.addNotebookEditor(this);
            const id = (0, uuid_1.generateUuid)();
            this._overlayContainer.id = `notebook-${id}`;
            this._overlayContainer.className = 'notebookOverlay';
            this._overlayContainer.classList.add('notebook-editor');
            this._overlayContainer.style.visibility = 'hidden';
            this.layoutService.container.appendChild(this._overlayContainer);
            this._createBody(this._overlayContainer);
            this._generateFontInfo();
            this._isVisible = true;
            this._editorFocus = notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED.bindTo(this.scopedContextKeyService);
            this._outputFocus = notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED.bindTo(this.scopedContextKeyService);
            this._editorEditable = notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.bindTo(this.scopedContextKeyService);
            this._editorEditable.set(!creationOptions.isReadOnly);
            let contributions;
            if (Array.isArray(this.creationOptions.contributions)) {
                contributions = this.creationOptions.contributions;
            }
            else {
                contributions = notebookEditorExtensions_1.NotebookEditorExtensionsRegistry.getEditorContributions();
            }
            for (const desc of contributions) {
                let contribution;
                try {
                    contribution = this.instantiationService.createInstance(desc.ctor, this);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                if (contribution) {
                    if (!this._contributions.has(desc.id)) {
                        this._contributions.set(desc.id, contribution);
                    }
                    else {
                        contribution.dispose();
                        throw new Error(`DUPLICATE notebook editor contribution: '${desc.id}'`);
                    }
                }
            }
            this._updateForNotebookConfiguration();
        }
        get isDisposed() {
            return this._isDisposed;
        }
        set viewModel(newModel) {
            this._notebookViewModel = newModel;
            this._onDidChangeModel.fire(newModel === null || newModel === void 0 ? void 0 : newModel.notebookDocument);
        }
        get viewModel() {
            return this._notebookViewModel;
        }
        get textModel() {
            var _a;
            return (_a = this._notebookViewModel) === null || _a === void 0 ? void 0 : _a.notebookDocument;
        }
        get isReadOnly() {
            var _a, _b;
            return (_b = (_a = this._notebookViewModel) === null || _a === void 0 ? void 0 : _a.options.isReadOnly) !== null && _b !== void 0 ? _b : false;
        }
        get activeCodeEditor() {
            if (this._isDisposed) {
                return;
            }
            const [focused] = this._list.getFocusedElements();
            return this._renderedEditors.get(focused);
        }
        get cursorNavigationMode() {
            return this._cursorNavigationMode;
        }
        set cursorNavigationMode(v) {
            this._cursorNavigationMode = v;
        }
        get visibleRanges() {
            return this._list.visibleRanges || [];
        }
        get notebookOptions() {
            return this._notebookOptions;
        }
        _debug(...args) {
            if (!this._debugFlag) {
                return;
            }
            (0, notebookLogger_1.notebookDebug)(...args);
        }
        /**
         * EditorId
         */
        getId() {
            return this._uuid;
        }
        _getViewModel() {
            return this.viewModel;
        }
        getLength() {
            var _a, _b;
            return (_b = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        }
        getSelections() {
            var _a, _b;
            return (_b = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getSelections()) !== null && _b !== void 0 ? _b : [];
        }
        setSelections(selections) {
            if (!this.viewModel) {
                return;
            }
            const focus = this.viewModel.getFocus();
            this.viewModel.updateSelectionsState({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            });
        }
        getFocus() {
            var _a, _b;
            return (_b = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getFocus()) !== null && _b !== void 0 ? _b : { start: 0, end: 0 };
        }
        setFocus(focus) {
            if (!this.viewModel) {
                return;
            }
            const selections = this.viewModel.getSelections();
            this.viewModel.updateSelectionsState({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            });
        }
        getSelectionViewModels() {
            if (!this.viewModel) {
                return [];
            }
            const cellsSet = new Set();
            return this.viewModel.getSelections().map(range => this.viewModel.viewCells.slice(range.start, range.end)).reduce((a, b) => {
                b.forEach(cell => {
                    if (!cellsSet.has(cell.handle)) {
                        cellsSet.add(cell.handle);
                        a.push(cell);
                    }
                });
                return a;
            }, []);
        }
        hasModel() {
            return !!this._notebookViewModel;
        }
        showProgress() {
            this._currentProgress = this.editorProgressService.show(true);
        }
        hideProgress() {
            if (this._currentProgress) {
                this._currentProgress.done();
                this._currentProgress = undefined;
            }
        }
        //#region Editor Core
        getBaseCellEditorOptions(language) {
            const existingOptions = this._baseCellEditorOptions.get(language);
            if (existingOptions) {
                return existingOptions;
            }
            else {
                const options = new BaseCellEditorOptions(this, this.notebookOptions, this.configurationService, language);
                this._baseCellEditorOptions.set(language, options);
                return options;
            }
        }
        _updateForNotebookConfiguration() {
            var _a;
            if (!this._overlayContainer) {
                return;
            }
            this._overlayContainer.classList.remove('cell-title-toolbar-left');
            this._overlayContainer.classList.remove('cell-title-toolbar-right');
            this._overlayContainer.classList.remove('cell-title-toolbar-hidden');
            const cellToolbarLocation = this._notebookOptions.computeCellToolbarLocation((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewType);
            this._overlayContainer.classList.add(`cell-title-toolbar-${cellToolbarLocation}`);
            const cellToolbarInteraction = this._notebookOptions.getLayoutConfiguration().cellToolbarInteraction;
            let cellToolbarInteractionState = 'hover';
            this._overlayContainer.classList.remove('cell-toolbar-hover');
            this._overlayContainer.classList.remove('cell-toolbar-click');
            if (cellToolbarInteraction === 'hover' || cellToolbarInteraction === 'click') {
                cellToolbarInteractionState = cellToolbarInteraction;
            }
            this._overlayContainer.classList.add(`cell-toolbar-${cellToolbarInteractionState}`);
        }
        _generateFontInfo() {
            const editorOptions = this.configurationService.getValue('editor');
            this._fontInfo = fontMeasurements_1.FontMeasurements.readFontInfo(fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.PixelRatio.value));
        }
        _createBody(parent) {
            this._notebookTopToolbarContainer = document.createElement('div');
            this._notebookTopToolbarContainer.classList.add('notebook-toolbar-container');
            this._notebookTopToolbarContainer.tabIndex = 0;
            this._notebookTopToolbarContainer.style.display = 'none';
            DOM.append(parent, this._notebookTopToolbarContainer);
            this._body = document.createElement('div');
            DOM.append(parent, this._body);
            this._body.classList.add('cell-list-container');
            this._createLayoutStyles();
            this._createCellList();
            this._notebookOverviewRulerContainer = document.createElement('div');
            this._notebookOverviewRulerContainer.classList.add('notebook-overview-ruler-container');
            this._list.scrollableElement.appendChild(this._notebookOverviewRulerContainer);
            this._registerNotebookOverviewRuler();
            this._overflowContainer = document.createElement('div');
            this._overflowContainer.classList.add('notebook-overflow-widget-container', 'monaco-editor');
            DOM.append(parent, this._overflowContainer);
        }
        _generateFontFamily() {
            var _a, _b;
            return (_b = (_a = this._fontInfo) === null || _a === void 0 ? void 0 : _a.fontFamily) !== null && _b !== void 0 ? _b : `"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`;
        }
        _createLayoutStyles() {
            var _a, _b;
            this._styleElement = DOM.createStyleSheet(this._body);
            const { cellRightMargin, cellTopMargin, cellRunGutter, cellBottomMargin, codeCellLeftMargin, markdownCellGutter, markdownCellLeftMargin, markdownCellBottomMargin, markdownCellTopMargin, 
            // bottomToolbarGap: bottomCellToolbarGap,
            // bottomToolbarHeight: bottomCellToolbarHeight,
            collapsedIndicatorHeight, compactView, focusIndicator, insertToolbarPosition, insertToolbarAlignment, fontSize, focusIndicatorLeftMargin, focusIndicatorGap } = this._notebookOptions.getLayoutConfiguration();
            const { bottomToolbarGap, bottomToolbarHeight } = this._notebookOptions.computeBottomToolbarDimensions((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewType);
            const styleSheets = [];
            if (!this._fontInfo) {
                this._generateFontInfo();
            }
            const fontFamily = this._generateFontFamily();
            styleSheets.push(`
		:root {
			--notebook-cell-output-font-size: ${fontSize}px;
			--notebook-cell-output-font-family: ${fontFamily};
			--notebook-cell-input-preview-font-size: ${fontSize}px;
			--notebook-cell-input-preview-font-family: ${fontFamily};
		}
		`);
            if (compactView) {
                styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row div.cell.code { margin-left: ${codeCellLeftMargin + cellRunGutter}px; }`);
            }
            else {
                styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row div.cell.code { margin-left: ${codeCellLeftMargin}px; }`);
            }
            // focus indicator
            if (focusIndicator === 'border') {
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-top:before,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-bottom:before,
			.monaco-workbench .notebookOverlay .monaco-list .markdown-cell-row .cell-inner-container:before,
			.monaco-workbench .notebookOverlay .monaco-list .markdown-cell-row .cell-inner-container:after {
				content: "";
				position: absolute;
				width: 100%;
				height: 1px;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left:before,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-right:before {
				content: "";
				position: absolute;
				width: 1px;
				height: 100%;
				z-index: 10;
			}

			/* top border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-top:before {
				border-top: 1px solid transparent;
			}

			/* left border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left:before {
				border-left: 1px solid transparent;
			}

			/* bottom border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-bottom:before {
				border-bottom: 1px solid transparent;
			}

			/* right border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-right:before {
				border-right: 1px solid transparent;
			}
			`);
                // left and right border margins
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.focused .cell-focus-indicator-left:before,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.focused .cell-focus-indicator-right:before,
			.monaco-workbench .notebookOverlay .monaco-list.selection-multiple .monaco-list-row.code-cell-row.selected .cell-focus-indicator-left:before,
			.monaco-workbench .notebookOverlay .monaco-list.selection-multiple .monaco-list-row.code-cell-row.selected .cell-focus-indicator-right:before {
				top: -${cellTopMargin}px; height: calc(100% + ${cellTopMargin + cellBottomMargin}px)
			}`);
            }
            else {
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left .codeOutput-focus-indicator {
				border-left: 3px solid transparent;
				border-radius: 4px;
				width: 0px;
				margin-left: ${focusIndicatorLeftMargin}px;
				border-color: var(--notebook-inactive-focused-cell-border-color) !important;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.focused .cell-focus-indicator-left .codeOutput-focus-indicator-container,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-output-hover .cell-focus-indicator-left .codeOutput-focus-indicator-container,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .markdown-cell-hover .cell-focus-indicator-left .codeOutput-focus-indicator-container,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row:hover .cell-focus-indicator-left .codeOutput-focus-indicator-container {
				display: block;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left .codeOutput-focus-indicator-container:hover .codeOutput-focus-indicator {
				border-left: 5px solid transparent;
				margin-left: ${focusIndicatorLeftMargin - 1}px;
			}
			`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.focused .cell-inner-container.cell-output-focus .cell-focus-indicator-left .codeOutput-focus-indicator,
			.monaco-workbench .notebookOverlay .monaco-list:focus-within .monaco-list-row.focused .cell-inner-container .cell-focus-indicator-left .codeOutput-focus-indicator {
				border-color: var(--notebook-focused-cell-border-color) !important;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-inner-container .cell-focus-indicator-left .output-focus-indicator {
				margin-top: ${focusIndicatorGap}px;
			}
			`);
            }
            // between cell insert toolbar
            if (insertToolbarPosition === 'betweenCells' || insertToolbarPosition === 'both') {
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container { display: flex; }`);
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .cell-list-top-cell-toolbar-container { display: flex; }`);
            }
            else {
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container { display: none; }`);
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .cell-list-top-cell-toolbar-container { display: none; }`);
            }
            if (insertToolbarAlignment === 'left') {
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .action-item:first-child,
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .action-item:first-child, .monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container .action-item:first-child {
				margin-right: 0px !important;
			}`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .monaco-toolbar .action-label,
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .monaco-toolbar .action-label, .monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container .monaco-toolbar .action-label {
				padding: 0px !important;
				justify-content: center;
				border-radius: 4px;
			}`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container,
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container, .monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container {
				align-items: flex-start;
				justify-content: left;
				margin: 0 16px 0 ${8 + codeCellLeftMargin}px;
			}`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container,
			.notebookOverlay .cell-bottom-toolbar-container .action-item {
				border: 0px;
			}`);
            }
            // top insert toolbar
            const topInsertToolbarHeight = this._notebookOptions.computeTopInsertToolbarHeight((_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.viewType);
            styleSheets.push(`.notebookOverlay .cell-list-top-cell-toolbar-container { top: -${topInsertToolbarHeight - 3}px }`);
            styleSheets.push(`.notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element,
		.notebookOverlay > .cell-list-container > .notebook-gutter > .monaco-list > .monaco-scrollable-element {
			padding-top: ${topInsertToolbarHeight}px !important;
			box-sizing: border-box;
		}`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .code-cell-row div.cell.code { margin-left: ${codeCellLeftMargin + cellRunGutter}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row div.cell { margin-right: ${cellRightMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row > .cell-inner-container { padding-top: ${cellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row > .cell-inner-container { padding-bottom: ${markdownCellBottomMargin}px; padding-top: ${markdownCellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row > .cell-inner-container.webview-backed-markdown-cell { padding: 0; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row > .webview-backed-markdown-cell.markdown-cell-edit-mode .cell.code { padding-bottom: ${markdownCellBottomMargin}px; padding-top: ${markdownCellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .output { margin: 0px ${cellRightMargin}px 0px ${codeCellLeftMargin + cellRunGutter}px; }`);
            styleSheets.push(`.notebookOverlay .output { width: calc(100% - ${codeCellLeftMargin + cellRunGutter + cellRightMargin}px); }`);
            // comment
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-comment-container { left: ${codeCellLeftMargin + cellRunGutter}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-comment-container { width: calc(100% - ${codeCellLeftMargin + cellRunGutter + cellRightMargin}px); }`);
            // output collapse button
            styleSheets.push(`.monaco-workbench .notebookOverlay .output .output-collapse-container .expandButton { left: -${cellRunGutter}px; }`);
            styleSheets.push(`.monaco-workbench .notebookOverlay .output .output-collapse-container .expandButton {
			position: absolute;
			width: ${cellRunGutter}px;
			padding: 6px 0px;
		}`);
            // show more container
            styleSheets.push(`.notebookOverlay .output-show-more-container { margin: 0px ${cellRightMargin}px 0px ${codeCellLeftMargin + cellRunGutter}px; }`);
            styleSheets.push(`.notebookOverlay .output-show-more-container { width: calc(100% - ${codeCellLeftMargin + cellRunGutter + cellRightMargin}px); }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row div.cell.markdown { padding-left: ${cellRunGutter}px; }`);
            styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container .notebook-folding-indicator { left: ${(markdownCellGutter - 20) / 2 + markdownCellLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay > .cell-list-container .notebook-folded-hint { left: ${markdownCellGutter + markdownCellLeftMargin + 8}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row :not(.webview-backed-markdown-cell) .cell-focus-indicator-top { height: ${cellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-side { bottom: ${bottomToolbarGap}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row.code-cell-row .cell-focus-indicator-left { width: ${codeCellLeftMargin + cellRunGutter}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row.markdown-cell-row .cell-focus-indicator-left { width: ${codeCellLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator.cell-focus-indicator-right { width: ${cellRightMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-bottom { height: ${cellBottomMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-shadow-container-bottom { top: ${cellBottomMargin}px; }`);
            styleSheets.push(`
			.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .input-collapse-container .cell-collapse-preview {
				line-height: ${collapsedIndicatorHeight}px;
			}

			.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .input-collapse-container .cell-collapse-preview .monaco-tokenized-source {
				max-height: ${collapsedIndicatorHeight}px;
			}
		`);
            styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container .monaco-toolbar { height: ${bottomToolbarHeight}px }`);
            styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .cell-list-top-cell-toolbar-container .monaco-toolbar { height: ${bottomToolbarHeight}px }`);
            // cell toolbar
            styleSheets.push(`.monaco-workbench .notebookOverlay.cell-title-toolbar-right > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-title-toolbar {
			right: ${cellRightMargin + 26}px;
		}
		.monaco-workbench .notebookOverlay.cell-title-toolbar-left > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-title-toolbar {
			left: ${codeCellLeftMargin + cellRunGutter + 16}px;
		}
		.monaco-workbench .notebookOverlay.cell-title-toolbar-hidden > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-title-toolbar {
			display: none;
		}`);
            // cell output innert container
            styleSheets.push(`
		.monaco-workbench .notebookOverlay .output > div.foreground.output-inner-container {
			padding: ${notebookOptions_1.OutputInnerContainerTopPadding}px 8px;
		}
		.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .output-collapse-container {
			padding: ${notebookOptions_1.OutputInnerContainerTopPadding}px 8px;
		}
		`);
            this._styleElement.textContent = styleSheets.join('\n');
        }
        _createCellList() {
            this._body.classList.add('cell-list-container');
            this._dndController = this._register(new cellDnd_1.CellDragAndDropController(this, this._body));
            const getScopedContextKeyService = (container) => this._list.contextKeyService.createScoped(container);
            const renderers = [
                this.instantiationService.createInstance(cellRenderer_1.CodeCellRenderer, this, this._renderedEditors, this._dndController, getScopedContextKeyService),
                this.instantiationService.createInstance(cellRenderer_1.MarkupCellRenderer, this, this._dndController, this._renderedEditors, getScopedContextKeyService),
            ];
            renderers.forEach(renderer => {
                this._register(renderer);
            });
            this._listDelegate = this.instantiationService.createInstance(cellRenderer_1.NotebookCellListDelegate);
            this._register(this._listDelegate);
            this._list = this.instantiationService.createInstance(notebookCellList_1.NotebookCellList, 'NotebookCellList', this._overlayContainer, this._body, this._viewContext, this._listDelegate, renderers, this.scopedContextKeyService, {
                setRowLineHeight: false,
                setRowHeight: false,
                supportDynamicHeights: true,
                horizontalScrolling: false,
                keyboardSupport: false,
                mouseSupport: true,
                multipleSelectionSupport: true,
                selectionNavigation: true,
                enableKeyboardNavigation: true,
                additionalScrollHeight: 0,
                transformOptimization: false,
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
                    getAriaLabel: (element) => {
                        if (!this.viewModel) {
                            return '';
                        }
                        const index = this.viewModel.getCellIndex(element);
                        if (index >= 0) {
                            return `Cell ${index}, ${element.cellKind === notebookCommon_1.CellKind.Markup ? 'markdown' : 'code'}  cell`;
                        }
                        return '';
                    },
                    getWidgetAriaLabel() {
                        return nls.localize('notebookTreeAriaLabel', "Notebook");
                    }
                },
                focusNextPreviousDelegate: {
                    onFocusNext: (applyFocusNext) => this._updateForCursorNavigationMode(applyFocusNext),
                    onFocusPrevious: (applyFocusPrevious) => this._updateForCursorNavigationMode(applyFocusPrevious),
                }
            });
            this._dndController.setList(this._list);
            // create Webview
            this._register(this._list);
            this._listViewInfoAccessor = new notebookCellList_1.ListViewInfoAccessor(this._list);
            this._register(this._listViewInfoAccessor);
            this._register((0, lifecycle_1.combinedDisposable)(...renderers));
            // top cell toolbar
            this._listTopCellToolbar = this._register(this.instantiationService.createInstance(notebookTopCellToolbar_1.ListTopCellToolbar, this, this.scopedContextKeyService, this._list.rowsContainer));
            // transparent cover
            this._webviewTransparentCover = DOM.append(this._list.rowsContainer, $('.webview-cover'));
            this._webviewTransparentCover.style.display = 'none';
            this._register(DOM.addStandardDisposableGenericMouseDownListener(this._overlayContainer, (e) => {
                if (e.target.classList.contains('slider') && this._webviewTransparentCover) {
                    this._webviewTransparentCover.style.display = 'block';
                }
            }));
            this._register(DOM.addStandardDisposableGenericMouseUpListener(this._overlayContainer, () => {
                if (this._webviewTransparentCover) {
                    // no matter when
                    this._webviewTransparentCover.style.display = 'none';
                }
            }));
            this._register(this._list.onMouseDown(e => {
                if (e.element) {
                    this._onMouseDown.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onMouseUp(e => {
                if (e.element) {
                    this._onMouseUp.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onDidChangeFocus(_e => {
                this._onDidChangeActiveEditor.fire(this);
                this._onDidChangeActiveCell.fire();
                this._cursorNavigationMode = false;
            }));
            this._register(this._list.onContextMenu(e => {
                this.showListContextMenu(e);
            }));
            this._register(this._list.onDidChangeVisibleRanges(() => {
                this._onDidChangeVisibleRanges.fire();
            }));
            this._register(this._list.onDidScroll((e) => {
                this._onDidScroll.fire();
                if (e.scrollTop !== e.oldScrollTop) {
                    this._renderedEditors.forEach((editor, cell) => {
                        var _a;
                        if (this.getActiveCell() === cell && editor) {
                            (_a = suggestController_1.SuggestController.get(editor)) === null || _a === void 0 ? void 0 : _a.cancelSuggestWidget();
                        }
                    });
                }
            }));
            this._focusTracker = this._register(DOM.trackFocus(this.getDomNode()));
            this._register(this._focusTracker.onDidBlur(() => {
                var _a;
                this._editorFocus.set(false);
                (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.setEditorFocus(false);
                this._onDidBlurEmitter.fire();
            }));
            this._register(this._focusTracker.onDidFocus(() => {
                var _a;
                this._editorFocus.set(true);
                (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.setEditorFocus(true);
                this._onDidFocusEmitter.fire();
            }));
            this._registerNotebookActionsToolbar();
        }
        showListContextMenu(e) {
            this.contextMenuService.showContextMenu({
                getActions: () => {
                    const result = [];
                    const menu = this.menuService.createMenu(actions_1.MenuId.NotebookCellTitle, this.scopedContextKeyService);
                    (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, result);
                    menu.dispose();
                    return result;
                },
                getAnchor: () => e.anchor
            });
        }
        _registerNotebookOverviewRuler() {
            this._notebookOverviewRuler = this._register(this.instantiationService.createInstance(notebookOverviewRuler_1.NotebookOverviewRuler, this, this._notebookOverviewRulerContainer));
        }
        _registerNotebookActionsToolbar() {
            this._notebookTopToolbar = this._register(this.instantiationService.createInstance(notebookEditorToolbar_1.NotebookEditorToolbar, this, this.scopedContextKeyService, this._notebookOptions, this._notebookTopToolbarContainer));
            this._register(this._notebookTopToolbar.onDidChangeState(() => {
                if (this._dimension && this._isVisible) {
                    this.layout(this._dimension);
                }
            }));
        }
        _updateForCursorNavigationMode(applyFocusChange) {
            if (this._cursorNavigationMode) {
                // Will fire onDidChangeFocus, resetting the state to Container
                applyFocusChange();
                const newFocusedCell = this._list.getFocusedElements()[0];
                if (newFocusedCell.cellKind === notebookCommon_1.CellKind.Code || newFocusedCell.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                    this.focusNotebookCell(newFocusedCell, 'editor');
                }
                else {
                    // Reset to "Editor", the state has not been consumed
                    this._cursorNavigationMode = true;
                }
            }
            else {
                applyFocusChange();
            }
        }
        getDomNode() {
            return this._overlayContainer;
        }
        getOverflowContainerDomNode() {
            return this._overflowContainer;
        }
        getInnerWebview() {
            var _a;
            return (_a = this._webview) === null || _a === void 0 ? void 0 : _a.webview;
        }
        setParentContextKeyService(parentContextKeyService) {
            this.scopedContextKeyService.updateParent(parentContextKeyService);
        }
        async setModel(textModel, viewState) {
            var _a, _b, _c, _d, _f, _g, _h;
            if (this.viewModel === undefined || !this.viewModel.equal(textModel)) {
                const oldTopInsertToolbarHeight = this._notebookOptions.computeTopInsertToolbarHeight((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewType);
                const oldBottomToolbarDimensions = this._notebookOptions.computeBottomToolbarDimensions((_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.viewType);
                this._detachModel();
                await this._attachModel(textModel, viewState);
                const newTopInsertToolbarHeight = this._notebookOptions.computeTopInsertToolbarHeight((_c = this.viewModel) === null || _c === void 0 ? void 0 : _c.viewType);
                const newBottomToolbarDimensions = this._notebookOptions.computeBottomToolbarDimensions((_d = this.viewModel) === null || _d === void 0 ? void 0 : _d.viewType);
                if (oldTopInsertToolbarHeight !== newTopInsertToolbarHeight
                    || oldBottomToolbarDimensions.bottomToolbarGap !== newBottomToolbarDimensions.bottomToolbarGap
                    || oldBottomToolbarDimensions.bottomToolbarHeight !== newBottomToolbarDimensions.bottomToolbarHeight) {
                    (_f = this._styleElement) === null || _f === void 0 ? void 0 : _f.remove();
                    this._createLayoutStyles();
                    (_g = this._webview) === null || _g === void 0 ? void 0 : _g.updateOptions(Object.assign(Object.assign({}, this.notebookOptions.computeWebviewOptions()), { fontFamily: this._generateFontFamily() }));
                }
                this.telemetryService.publicLog2('notebook/editorOpened', {
                    scheme: textModel.uri.scheme,
                    ext: (0, resources_1.extname)(textModel.uri),
                    viewType: textModel.viewType
                });
            }
            else {
                this.restoreListViewState(viewState);
            }
            // load preloads for matching kernel
            this._loadKernelPreloads();
            // clear state
            (_h = this._dndController) === null || _h === void 0 ? void 0 : _h.clearGlobalDragState();
            this._localStore.add(this._list.onDidChangeFocus(() => {
                this.updateContextKeysOnFocusChange();
            }));
            this.updateContextKeysOnFocusChange();
            // render markdown top down on idle
            this._backgroundMarkdownRendering();
        }
        _backgroundMarkdownRendering() {
            if (this._isScheduled) {
                return;
            }
            (0, async_1.runWhenIdle)((deadline) => {
                this._isScheduled = false;
                this._backgroundMarkdownRenderingWithDeadline(deadline);
            });
        }
        _backgroundMarkdownRenderingWithDeadline(deadline) {
            const endTime = Date.now() + deadline.timeRemaining();
            const execute = () => {
                if (this._isDisposed) {
                    return;
                }
                if (!this.viewModel) {
                    return;
                }
                const firstMarkupCell = this.viewModel.viewCells.find(cell => { var _a; return cell.cellKind === notebookCommon_1.CellKind.Markup && !((_a = this._webview) === null || _a === void 0 ? void 0 : _a.markupPreviewMapping.has(cell.id)); });
                if (!firstMarkupCell) {
                    return;
                }
                this.createMarkupPreview(firstMarkupCell);
                if (Date.now() < endTime) {
                    (0, platform_1.setTimeout0)(execute);
                }
                else {
                    this._backgroundMarkdownRendering();
                }
            };
            execute();
        }
        updateContextKeysOnFocusChange() {
            if (!this.viewModel) {
                return;
            }
            const focused = this._list.getFocusedElements()[0];
            if (focused) {
                if (!this._cellContextKeyManager) {
                    this._cellContextKeyManager = this._localStore.add(this.instantiationService.createInstance(cellContextKeys_1.CellContextKeyManager, this, focused));
                }
                this._cellContextKeyManager.updateForElement(focused);
            }
        }
        async setOptions(options) {
            var _a, _b, _c, _d;
            if ((options === null || options === void 0 ? void 0 : options.isReadOnly) !== undefined) {
                this._readOnly = options === null || options === void 0 ? void 0 : options.isReadOnly;
            }
            if (!this.viewModel) {
                return;
            }
            this.viewModel.updateOptions({ isReadOnly: this._readOnly });
            // reveal cell if editor options tell to do so
            const cellOptions = (_a = options === null || options === void 0 ? void 0 : options.cellOptions) !== null && _a !== void 0 ? _a : this._parseIndexedCellOptions(options);
            if (cellOptions) {
                const cell = this.viewModel.viewCells.find(cell => cell.uri.toString() === cellOptions.resource.toString());
                if (cell) {
                    this.focusElement(cell);
                    const selection = (_b = cellOptions.options) === null || _b === void 0 ? void 0 : _b.selection;
                    if (selection) {
                        await this.revealLineInCenterIfOutsideViewportAsync(cell, selection.startLineNumber);
                    }
                    else {
                        await this.revealInCenterIfOutsideViewportAsync(cell);
                    }
                    const editor = this._renderedEditors.get(cell);
                    if (editor) {
                        if ((_c = cellOptions.options) === null || _c === void 0 ? void 0 : _c.selection) {
                            const { selection } = cellOptions.options;
                            editor.setSelection(Object.assign(Object.assign({}, selection), { endLineNumber: selection.endLineNumber || selection.startLineNumber, endColumn: selection.endColumn || selection.startColumn }));
                            editor.revealPositionInCenterIfOutsideViewport({
                                lineNumber: selection.startLineNumber,
                                column: selection.startColumn
                            });
                            await this.revealLineInCenterIfOutsideViewportAsync(cell, selection.startLineNumber);
                        }
                        if (!((_d = cellOptions.options) === null || _d === void 0 ? void 0 : _d.preserveFocus)) {
                            editor.focus();
                        }
                    }
                }
            }
            // select cells if options tell to do so
            // todo@rebornix https://github.com/microsoft/vscode/issues/118108 support selections not just focus
            // todo@rebornix support multipe selections
            if (options === null || options === void 0 ? void 0 : options.cellSelections) {
                const focusCellIndex = options.cellSelections[0].start;
                const focusedCell = this.viewModel.cellAt(focusCellIndex);
                if (focusedCell) {
                    this.viewModel.updateSelectionsState({
                        kind: notebookCommon_1.SelectionStateType.Index,
                        focus: { start: focusCellIndex, end: focusCellIndex + 1 },
                        selections: options.cellSelections
                    });
                    this.revealInCenterIfOutsideViewport(focusedCell);
                }
            }
            this._updateForOptions();
            this._onDidChangeOptions.fire();
        }
        _parseIndexedCellOptions(options) {
            if (options === null || options === void 0 ? void 0 : options.indexedCellOptions) {
                // convert index based selections
                const cell = this.cellAt(options.indexedCellOptions.index);
                if (cell) {
                    return {
                        resource: cell.uri,
                        options: {
                            selection: options.indexedCellOptions.selection,
                            preserveFocus: false
                        }
                    };
                }
            }
            return undefined;
        }
        _detachModel() {
            var _a, _b, _c;
            this._localStore.clear();
            (0, lifecycle_1.dispose)(this._localCellStateListeners);
            this._list.detachViewModel();
            (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.dispose();
            // avoid event
            this.viewModel = undefined;
            (_b = this._webview) === null || _b === void 0 ? void 0 : _b.dispose();
            (_c = this._webview) === null || _c === void 0 ? void 0 : _c.element.remove();
            this._webview = null;
            this._list.clear();
        }
        _updateForOptions() {
            if (!this.viewModel) {
                return;
            }
            this._editorEditable.set(!this.viewModel.options.isReadOnly);
            this._overflowContainer.classList.toggle('notebook-editor-editable', !this.viewModel.options.isReadOnly);
            this.getDomNode().classList.toggle('notebook-editor-editable', !this.viewModel.options.isReadOnly);
        }
        async _resolveWebview() {
            if (!this.textModel) {
                return null;
            }
            if (this._webviewResolvePromise) {
                return this._webviewResolvePromise;
            }
            if (!this._webview) {
                this._createWebview(this.getId(), this.textModel.uri);
            }
            this._webviewResolvePromise = (async () => {
                if (!this._webview) {
                    throw new Error('Notebook output webview object is not created successfully.');
                }
                await this._webview.createWebview();
                if (!this._webview.webview) {
                    throw new Error('Notebook output webview element was not created successfully.');
                }
                this._localStore.add(this._webview.webview.onDidBlur(() => {
                    this._outputFocus.set(false);
                    this.updateEditorFocus();
                    this._webviewFocused = false;
                }));
                this._localStore.add(this._webview.webview.onDidFocus(() => {
                    this._outputFocus.set(true);
                    this.updateEditorFocus();
                    this._webviewFocused = true;
                }));
                this._localStore.add(this._webview.onMessage(e => {
                    this._onDidReceiveMessage.fire(e);
                }));
                return this._webview;
            })();
            return this._webviewResolvePromise;
        }
        async _createWebview(id, resource) {
            const that = this;
            this._webview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, {
                get creationOptions() { return that.creationOptions; },
                setScrollTop(scrollTop) { that._listViewInfoAccessor.setScrollTop(scrollTop); },
                triggerScroll(event) { that._listViewInfoAccessor.triggerScroll(event); },
                getCellByInfo: that.getCellByInfo.bind(that),
                getCellById: that._getCellById.bind(that),
                toggleNotebookCellSelection: that._toggleNotebookCellSelection.bind(that),
                focusNotebookCell: that.focusNotebookCell.bind(that),
                focusNextNotebookCell: that.focusNextNotebookCell.bind(that),
                updateOutputHeight: that._updateOutputHeight.bind(that),
                scheduleOutputHeightAck: that._scheduleOutputHeightAck.bind(that),
                updateMarkupCellHeight: that._updateMarkupCellHeight.bind(that),
                setMarkupCellEditState: that._setMarkupCellEditState.bind(that),
                didStartDragMarkupCell: that._didStartDragMarkupCell.bind(that),
                didDragMarkupCell: that._didDragMarkupCell.bind(that),
                didDropMarkupCell: that._didDropMarkupCell.bind(that),
                didEndDragMarkupCell: that._didEndDragMarkupCell.bind(that)
            }, id, resource, Object.assign(Object.assign({}, this._notebookOptions.computeWebviewOptions()), { fontFamily: this._generateFontFamily() }), this.notebookRendererMessaging.getScoped(this._uuid));
            this._webview.element.style.width = '100%';
            // attach the webview container to the DOM tree first
            this._list.attachWebview(this._webview.element);
        }
        async _attachModel(textModel, viewState) {
            var _a, _b, _c;
            await this._createWebview(this.getId(), textModel.uri);
            this.viewModel = this.instantiationService.createInstance(notebookViewModelImpl_1.NotebookViewModel, textModel.viewType, textModel, this._viewContext, this.getLayoutInfo(), { isReadOnly: this._readOnly });
            this._viewContext.eventDispatcher.emit([new notebookViewEvents_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
            this._updateForOptions();
            this._updateForNotebookConfiguration();
            // restore view states, including contributions
            {
                // restore view state
                this.viewModel.restoreEditorViewState(viewState);
                // contribution state restore
                const contributionsState = (viewState === null || viewState === void 0 ? void 0 : viewState.contributionsState) || {};
                for (const [id, contribution] of this._contributions) {
                    if (typeof contribution.restoreViewState === 'function') {
                        contribution.restoreViewState(contributionsState[id]);
                    }
                }
            }
            this._localStore.add(this.viewModel.onDidChangeViewCells(e => {
                this._onDidChangeViewCells.fire(e);
            }));
            this._localStore.add(this.viewModel.onDidChangeSelection(() => {
                this._onDidChangeSelection.fire();
                this.updateSelectedMarkdownPreviews();
            }));
            this._localStore.add(this._list.onWillScroll(e => {
                var _a;
                if ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.isResolved()) {
                    this._webviewTransparentCover.style.transform = `translateY(${e.scrollTop})`;
                }
            }));
            let hasPendingChangeContentHeight = false;
            this._localStore.add(this._list.onDidChangeContentHeight(() => {
                if (hasPendingChangeContentHeight) {
                    return;
                }
                hasPendingChangeContentHeight = true;
                DOM.scheduleAtNextAnimationFrame(() => {
                    hasPendingChangeContentHeight = false;
                    this._updateScrollHeight();
                    this._onDidChangeContentHeight.fire(this._list.getScrollHeight());
                }, 100);
            }));
            this._localStore.add(this._list.onDidRemoveOutputs(outputs => {
                outputs.forEach(output => this.removeInset(output));
            }));
            this._localStore.add(this._list.onDidHideOutputs(outputs => {
                outputs.forEach(output => this.hideInset(output));
            }));
            this._localStore.add(this._list.onDidRemoveCellsFromView(cells => {
                var _a;
                const hiddenCells = [];
                const deletedCells = [];
                for (const cell of cells) {
                    if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        const mdCell = cell;
                        if ((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewCells.find(cell => cell.handle === mdCell.handle)) {
                            // Cell has been folded but is still in model
                            hiddenCells.push(mdCell);
                        }
                        else {
                            // Cell was deleted
                            deletedCells.push(mdCell);
                        }
                    }
                }
                this.hideMarkupPreviews(hiddenCells);
                this.deleteMarkupPreviews(deletedCells);
            }));
            // init rendering
            await this._warmupWithMarkdownRenderer(this.viewModel, viewState);
            (0, notebookPerformance_1.mark)(textModel.uri, 'customMarkdownLoaded');
            // model attached
            this._localCellStateListeners = this.viewModel.viewCells.map(cell => this._bindCellListener(cell));
            this._lastCellWithEditorFocus = (_a = this.viewModel.viewCells.find(viewCell => this.getActiveCell() === viewCell && viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor)) !== null && _a !== void 0 ? _a : null;
            this._localStore.add(this.viewModel.onDidChangeViewCells((e) => {
                if (this._isDisposed) {
                    return;
                }
                // update cell listener
                e.splices.reverse().forEach(splice => {
                    const [start, deleted, newCells] = splice;
                    const deletedCells = this._localCellStateListeners.splice(start, deleted, ...newCells.map(cell => this._bindCellListener(cell)));
                    (0, lifecycle_1.dispose)(deletedCells);
                });
            }));
            if (this._dimension) {
                const topInserToolbarHeight = this._notebookOptions.computeTopInsertToolbarHeight((_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.viewType);
                this._list.layout(this._dimension.height - topInserToolbarHeight, this._dimension.width);
            }
            else {
                this._list.layout();
            }
            (_c = this._dndController) === null || _c === void 0 ? void 0 : _c.clearGlobalDragState();
            // restore list state at last, it must be after list layout
            this.restoreListViewState(viewState);
        }
        _bindCellListener(cell) {
            const store = new lifecycle_1.DisposableStore();
            store.add(cell.onDidChangeLayout(e => {
                if (e.totalHeight !== undefined || e.outerWidth) {
                    this.layoutNotebookCell(cell, cell.layoutInfo.totalHeight, e.context);
                }
            }));
            if (cell.cellKind === notebookCommon_1.CellKind.Code) {
                store.add(cell.onDidRemoveOutputs((outputs) => {
                    outputs.forEach(output => this.removeInset(output));
                }));
            }
            store.add(cell.onDidChangeState(e => {
                if (e.inputCollapsedChanged && cell.isInputCollapsed && cell.cellKind === notebookCommon_1.CellKind.Markup) {
                    this.hideMarkupPreviews([cell]);
                }
                if (e.outputCollapsedChanged && cell.isOutputCollapsed && cell.cellKind === notebookCommon_1.CellKind.Code) {
                    cell.outputsViewModels.forEach(output => this.hideInset(output));
                }
                if (e.focusModeChanged) {
                    this._validateCellFocusMode(cell);
                }
            }));
            return store;
        }
        _validateCellFocusMode(cell) {
            if (cell.focusMode !== notebookBrowser_1.CellFocusMode.Editor) {
                return;
            }
            if (this._lastCellWithEditorFocus && this._lastCellWithEditorFocus !== cell) {
                this._lastCellWithEditorFocus.focusMode = notebookBrowser_1.CellFocusMode.Container;
            }
            this._lastCellWithEditorFocus = cell;
        }
        async _warmupWithMarkdownRenderer(viewModel, viewState) {
            var _a, _b;
            await this._resolveWebview();
            // make sure that the webview is not visible otherwise users will see pre-rendered markdown cells in wrong position as the list view doesn't have a correct `top` offset yet
            this._webview.element.style.visibility = 'hidden';
            // warm up can take around 200ms to load markdown libraries, etc.
            await this._warmupViewport(viewModel, viewState);
            // todo@rebornix @mjbvz, is this too complicated?
            /* now the webview is ready, and requests to render markdown are fast enough
             * we can start rendering the list view
             * render
             *   - markdown cell -> request to webview to (10ms, basically just latency between UI and iframe)
             *   - code cell -> render in place
             */
            this._list.layout(0, 0);
            this._list.attachViewModel(viewModel);
            // now the list widget has a correct contentHeight/scrollHeight
            // setting scrollTop will work properly
            // after setting scroll top, the list view will update `top` of the scrollable element, e.g. `top: -584px`
            this._list.scrollTop = (_b = (_a = viewState === null || viewState === void 0 ? void 0 : viewState.scrollPosition) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0;
            this._debug('finish initial viewport warmup and view state restore.');
            this._webview.element.style.visibility = 'visible';
        }
        async _warmupViewport(viewModel, viewState) {
            var _a, _b, _c, _d, _f, _g, _h, _j;
            if (viewState && viewState.cellTotalHeights) {
                const totalHeightCache = viewState.cellTotalHeights;
                const scrollTop = (_b = (_a = viewState.scrollPosition) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0;
                const scrollBottom = scrollTop + Math.max((_d = (_c = this._dimension) === null || _c === void 0 ? void 0 : _c.height) !== null && _d !== void 0 ? _d : 0, 1080);
                let offset = 0;
                const requests = [];
                for (let i = 0; i < viewModel.length; i++) {
                    const cell = viewModel.cellAt(i);
                    if (offset + ((_f = totalHeightCache[i]) !== null && _f !== void 0 ? _f : 0) < scrollTop) {
                        offset += (totalHeightCache ? totalHeightCache[i] : 0);
                        continue;
                    }
                    else {
                        if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                            requests.push([cell, offset]);
                        }
                    }
                    offset += (totalHeightCache ? totalHeightCache[i] : 0);
                    if (offset > scrollBottom) {
                        break;
                    }
                }
                await this._webview.initializeMarkup(requests.map(([model, offset]) => this.createMarkupCellInitialization(model, offset)));
            }
            else {
                const initRequests = viewModel.viewCells
                    .filter(cell => cell.cellKind === notebookCommon_1.CellKind.Markup)
                    .slice(0, 5)
                    .map(cell => this.createMarkupCellInitialization(cell, -10000));
                await this._webview.initializeMarkup(initRequests);
                // no cached view state so we are rendering the first viewport
                // after above async call, we already get init height for markdown cells, we can update their offset
                let offset = 0;
                const offsetUpdateRequests = [];
                const scrollBottom = Math.max((_h = (_g = this._dimension) === null || _g === void 0 ? void 0 : _g.height) !== null && _h !== void 0 ? _h : 0, 1080);
                for (const cell of viewModel.viewCells) {
                    if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        offsetUpdateRequests.push({ id: cell.id, top: offset });
                    }
                    offset += cell.getHeight(this.getLayoutInfo().fontInfo.lineHeight);
                    if (offset > scrollBottom) {
                        break;
                    }
                }
                (_j = this._webview) === null || _j === void 0 ? void 0 : _j.updateScrollTops([], offsetUpdateRequests);
            }
        }
        createMarkupCellInitialization(model, offset) {
            return ({
                mime: model.mime,
                cellId: model.id,
                cellHandle: model.handle,
                content: model.getText(),
                offset: offset,
                visible: false,
            });
        }
        restoreListViewState(viewState) {
            var _a;
            if (!this.viewModel) {
                return;
            }
            if ((viewState === null || viewState === void 0 ? void 0 : viewState.scrollPosition) !== undefined) {
                this._list.scrollTop = viewState.scrollPosition.top;
                this._list.scrollLeft = viewState.scrollPosition.left;
            }
            else {
                this._list.scrollTop = 0;
                this._list.scrollLeft = 0;
            }
            const focusIdx = typeof (viewState === null || viewState === void 0 ? void 0 : viewState.focus) === 'number' ? viewState.focus : 0;
            if (focusIdx < this.viewModel.length) {
                const element = this.viewModel.cellAt(focusIdx);
                if (element) {
                    (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.updateSelectionsState({
                        kind: notebookCommon_1.SelectionStateType.Handle,
                        primary: element.handle,
                        selections: [element.handle]
                    });
                }
            }
            else if (this._list.length > 0) {
                this.viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: { start: 0, end: 1 },
                    selections: [{ start: 0, end: 1 }]
                });
            }
            if (viewState === null || viewState === void 0 ? void 0 : viewState.editorFocused) {
                const cell = this.viewModel.cellAt(focusIdx);
                if (cell) {
                    cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                }
            }
        }
        getEditorViewState() {
            var _a;
            const state = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getEditorViewState();
            if (!state) {
                return {
                    editingCells: {},
                    editorViewStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                };
            }
            if (this._list) {
                state.scrollPosition = { left: this._list.scrollLeft, top: this._list.scrollTop };
                const cellHeights = {};
                for (let i = 0; i < this.viewModel.length; i++) {
                    const elm = this.viewModel.cellAt(i);
                    if (elm.cellKind === notebookCommon_1.CellKind.Code) {
                        cellHeights[i] = elm.layoutInfo.totalHeight;
                    }
                    else {
                        cellHeights[i] = elm.layoutInfo.totalHeight;
                    }
                }
                state.cellTotalHeights = cellHeights;
                if (this.viewModel) {
                    const focusRange = this.viewModel.getFocus();
                    const element = this.viewModel.cellAt(focusRange.start);
                    if (element) {
                        const itemDOM = this._list.domElementOfElement(element);
                        const editorFocused = element.getEditState() === notebookBrowser_1.CellEditState.Editing && !!(document.activeElement && itemDOM && itemDOM.contains(document.activeElement));
                        state.editorFocused = editorFocused;
                        state.focus = focusRange.start;
                    }
                }
            }
            // Save contribution view states
            const contributionsState = {};
            for (const [id, contribution] of this._contributions) {
                if (typeof contribution.saveViewState === 'function') {
                    contributionsState[id] = contribution.saveViewState();
                }
            }
            state.contributionsState = contributionsState;
            return state;
        }
        _allowScrollBeyondLastLine() {
            return this._scrollBeyondLastLine && !this.isEmbedded;
        }
        layout(dimension, shadowElement) {
            var _a, _b, _c, _d;
            if (!shadowElement && this._shadowElementViewInfo === null) {
                this._dimension = dimension;
                return;
            }
            if (dimension.width <= 0 || dimension.height <= 0) {
                this.onWillHide();
                return;
            }
            if (shadowElement) {
                const containerRect = shadowElement.getBoundingClientRect();
                this._shadowElementViewInfo = {
                    height: containerRect.height,
                    width: containerRect.width,
                    top: containerRect.top,
                    left: containerRect.left
                };
            }
            if (this._shadowElementViewInfo && this._shadowElementViewInfo.width <= 0 && this._shadowElementViewInfo.height <= 0) {
                this.onWillHide();
                return;
            }
            this._dimension = new DOM.Dimension(dimension.width, dimension.height);
            const newBodyHeight = Math.max(dimension.height - (((_a = this._notebookTopToolbar) === null || _a === void 0 ? void 0 : _a.useGlobalToolbar) ? /** Toolbar height */ 26 : 0), 0);
            DOM.size(this._body, dimension.width, newBodyHeight);
            const topInserToolbarHeight = this._notebookOptions.computeTopInsertToolbarHeight((_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.viewType);
            const newCellListHeight = Math.max(dimension.height - topInserToolbarHeight, 0);
            if (this._list.getRenderHeight() < newCellListHeight) {
                // the new dimension is larger than the list viewport, update its additional height first, otherwise the list view will move down a bit (as the `scrollBottom` will move down)
                this._list.updateOptions({ additionalScrollHeight: this._allowScrollBeyondLastLine() ? Math.max(0, (newCellListHeight - 50)) : topInserToolbarHeight });
                this._list.layout(newCellListHeight, dimension.width);
            }
            else {
                // the new dimension is smaller than the list viewport, if we update the additional height, the `scrollBottom` will move up, which moves the whole list view upwards a bit. So we run a layout first.
                this._list.layout(newCellListHeight, dimension.width);
                this._list.updateOptions({ additionalScrollHeight: this._allowScrollBeyondLastLine() ? Math.max(0, (newCellListHeight - 50)) : topInserToolbarHeight });
            }
            this._overlayContainer.style.visibility = 'visible';
            this._overlayContainer.style.display = 'block';
            this._overlayContainer.style.position = 'absolute';
            this._overlayContainer.style.overflow = 'hidden';
            const containerRect = (_c = this._overlayContainer.parentElement) === null || _c === void 0 ? void 0 : _c.getBoundingClientRect();
            this._overlayContainer.style.top = `${this._shadowElementViewInfo.top - ((containerRect === null || containerRect === void 0 ? void 0 : containerRect.top) || 0)}px`;
            this._overlayContainer.style.left = `${this._shadowElementViewInfo.left - ((containerRect === null || containerRect === void 0 ? void 0 : containerRect.left) || 0)}px`;
            this._overlayContainer.style.width = `${dimension ? dimension.width : this._shadowElementViewInfo.width}px`;
            this._overlayContainer.style.height = `${dimension ? dimension.height : this._shadowElementViewInfo.height}px`;
            if (this._webviewTransparentCover) {
                this._webviewTransparentCover.style.height = `${dimension.height}px`;
                this._webviewTransparentCover.style.width = `${dimension.width}px`;
            }
            this._notebookTopToolbar.layout(this._dimension);
            this._notebookOverviewRuler.layout();
            (_d = this._viewContext) === null || _d === void 0 ? void 0 : _d.eventDispatcher.emit([new notebookViewEvents_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
        }
        //#endregion
        //#region Focus tracker
        focus() {
            var _a;
            this._isVisible = true;
            this._editorFocus.set(true);
            if (this._webviewFocused) {
                (_a = this._webview) === null || _a === void 0 ? void 0 : _a.focusWebview();
            }
            else {
                if (this.viewModel) {
                    const focusRange = this.viewModel.getFocus();
                    const element = this.viewModel.cellAt(focusRange.start);
                    // The notebook editor doesn't have focus yet
                    if (!this.hasEditorFocus()) {
                        this.focusContainer();
                    }
                    if (element && element.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                        element.updateEditState(notebookBrowser_1.CellEditState.Editing, 'editorWidget.focus');
                        element.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                        this.focusEditor(element);
                        return;
                    }
                }
                this._list.domFocus();
            }
            if (this._currentProgress) {
                // The editor forces progress to hide when switching editors. So if progress should be visible, force it to show when the editor is focused.
                this.showProgress();
            }
        }
        focusEditor(activeElement) {
            for (const [element, editor] of this._renderedEditors.entries()) {
                if (element === activeElement) {
                    editor.focus();
                    return;
                }
            }
        }
        focusContainer() {
            var _a;
            if (this._webviewFocused) {
                (_a = this._webview) === null || _a === void 0 ? void 0 : _a.focusWebview();
            }
            else {
                this._list.focusContainer();
            }
        }
        onWillHide() {
            this._isVisible = false;
            this._editorFocus.set(false);
            this._overlayContainer.style.visibility = 'hidden';
            this._overlayContainer.style.left = '-50000px';
            this._notebookTopToolbarContainer.style.display = 'none';
        }
        editorHasDomFocus() {
            return DOM.isAncestor(document.activeElement, this.getDomNode());
        }
        updateEditorFocus() {
            var _a;
            // Note - focus going to the webview will fire 'blur', but the webview element will be
            // a descendent of the notebook editor root.
            this._focusTracker.refreshState();
            const focused = this.editorHasDomFocus();
            this._editorFocus.set(focused);
            (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.setEditorFocus(focused);
        }
        hasEditorFocus() {
            // _editorFocus is driven by the FocusTracker, which is only guaranteed to _eventually_ fire blur.
            // If we need to know whether we have focus at this instant, we need to check the DOM manually.
            this.updateEditorFocus();
            return this.editorHasDomFocus();
        }
        hasWebviewFocus() {
            return this._webviewFocused;
        }
        hasOutputTextSelection() {
            if (!this.hasEditorFocus()) {
                return false;
            }
            const windowSelection = window.getSelection();
            if ((windowSelection === null || windowSelection === void 0 ? void 0 : windowSelection.rangeCount) !== 1) {
                return false;
            }
            const activeSelection = windowSelection.getRangeAt(0);
            if (activeSelection.startContainer === activeSelection.endContainer && activeSelection.endOffset - activeSelection.startOffset === 0) {
                return false;
            }
            let container = activeSelection.commonAncestorContainer;
            if (!this._body.contains(container)) {
                return false;
            }
            while (container
                &&
                    container !== this._body) {
                if (container.classList && container.classList.contains('output')) {
                    return true;
                }
                container = container.parentNode;
            }
            return false;
        }
        //#endregion
        //#region Editor Features
        focusElement(cell) {
            var _a;
            (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.updateSelectionsState({
                kind: notebookCommon_1.SelectionStateType.Handle,
                primary: cell.handle,
                selections: [cell.handle]
            });
        }
        get scrollTop() {
            return this._list.scrollTop;
        }
        getAbsoluteTopOfElement(cell) {
            return this._list.getAbsoluteTopOfElement(cell);
        }
        isScrolledToBottom() {
            return this._listViewInfoAccessor.isScrolledToBottom();
        }
        scrollToBottom() {
            this._listViewInfoAccessor.scrollToBottom();
        }
        revealCellRangeInView(range) {
            return this._listViewInfoAccessor.revealCellRangeInView(range);
        }
        revealInView(cell) {
            this._listViewInfoAccessor.revealInView(cell);
        }
        revealInViewAtTop(cell) {
            this._listViewInfoAccessor.revealInViewAtTop(cell);
        }
        revealInCenterIfOutsideViewport(cell) {
            this._listViewInfoAccessor.revealInCenterIfOutsideViewport(cell);
        }
        async revealInCenterIfOutsideViewportAsync(cell) {
            return this._listViewInfoAccessor.revealInCenterIfOutsideViewportAsync(cell);
        }
        revealInCenter(cell) {
            this._listViewInfoAccessor.revealInCenter(cell);
        }
        async revealLineInViewAsync(cell, line) {
            return this._listViewInfoAccessor.revealLineInViewAsync(cell, line);
        }
        async revealLineInCenterAsync(cell, line) {
            return this._listViewInfoAccessor.revealLineInCenterAsync(cell, line);
        }
        async revealLineInCenterIfOutsideViewportAsync(cell, line) {
            return this._listViewInfoAccessor.revealLineInCenterIfOutsideViewportAsync(cell, line);
        }
        async revealRangeInViewAsync(cell, range) {
            return this._listViewInfoAccessor.revealRangeInViewAsync(cell, range);
        }
        async revealRangeInCenterAsync(cell, range) {
            return this._listViewInfoAccessor.revealRangeInCenterAsync(cell, range);
        }
        async revealRangeInCenterIfOutsideViewportAsync(cell, range) {
            return this._listViewInfoAccessor.revealRangeInCenterIfOutsideViewportAsync(cell, range);
        }
        async revealCellOffsetInCenterAsync(cell, offset) {
            return this._listViewInfoAccessor.revealCellOffsetInCenterAsync(cell, offset);
        }
        getViewIndexByModelIndex(index) {
            var _a;
            if (!this._listViewInfoAccessor) {
                return -1;
            }
            const cell = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewCells[index];
            if (!cell) {
                return -1;
            }
            return this._listViewInfoAccessor.getViewIndex(cell);
        }
        getViewHeight(cell) {
            if (!this._listViewInfoAccessor) {
                return -1;
            }
            return this._listViewInfoAccessor.getViewHeight(cell);
        }
        getCellRangeFromViewRange(startIndex, endIndex) {
            return this._listViewInfoAccessor.getCellRangeFromViewRange(startIndex, endIndex);
        }
        getCellsInRange(range) {
            return this._listViewInfoAccessor.getCellsInRange(range);
        }
        setCellEditorSelection(cell, range) {
            this._listViewInfoAccessor.setCellEditorSelection(cell, range);
        }
        setHiddenAreas(_ranges) {
            return this._listViewInfoAccessor.setHiddenAreas(_ranges);
        }
        getVisibleRangesPlusViewportBelow() {
            return this._listViewInfoAccessor.getVisibleRangesPlusViewportBelow();
        }
        setScrollTop(scrollTop) {
            this._listViewInfoAccessor.setScrollTop(scrollTop);
        }
        _registerDecorationType(key) {
            const options = this.notebookEditorService.resolveEditorDecorationOptions(key);
            if (options) {
                const styleElement = DOM.createStyleSheet(this._body);
                const styleSheet = new notebookEditorDecorations_1.NotebookRefCountedStyleSheet({
                    removeEditorStyleSheets: (key) => {
                        this._editorStyleSheets.delete(key);
                    }
                }, key, styleElement);
                this._editorStyleSheets.set(key, styleSheet);
                this._decorationRules.set(key, new notebookEditorDecorations_1.NotebookDecorationCSSRules(this.themeService, styleSheet, {
                    key,
                    options,
                    styleSheet
                }));
            }
        }
        setEditorDecorations(key, range) {
            if (!this.viewModel) {
                return;
            }
            // create css style for the decoration
            if (!this._editorStyleSheets.has(key)) {
                this._registerDecorationType(key);
            }
            const decorationRule = this._decorationRules.get(key);
            if (!decorationRule) {
                return;
            }
            const existingDecorations = this._decortionKeyToIds.get(key) || [];
            const newDecorations = this.viewModel.getCellsInRange(range).map(cell => ({
                handle: cell.handle,
                options: { className: decorationRule.className, outputClassName: decorationRule.className, topClassName: decorationRule.topClassName }
            }));
            this._decortionKeyToIds.set(key, this.deltaCellDecorations(existingDecorations, newDecorations));
        }
        removeEditorDecorations(key) {
            var _a;
            if (this._decorationRules.has(key)) {
                (_a = this._decorationRules.get(key)) === null || _a === void 0 ? void 0 : _a.dispose();
            }
            const cellDecorations = this._decortionKeyToIds.get(key);
            this.deltaCellDecorations(cellDecorations || [], []);
        }
        deltaCellDecorations(oldDecorations, newDecorations) {
            var _a;
            const ret = ((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.deltaCellDecorations(oldDecorations, newDecorations)) || [];
            this._onDidChangeDecorations.fire();
            return ret;
        }
        deltaCellOutputContainerClassNames(cellId, added, removed) {
            var _a;
            (_a = this._webview) === null || _a === void 0 ? void 0 : _a.deltaCellOutputContainerClassNames(cellId, added, removed);
        }
        changeModelDecorations(callback) {
            var _a;
            return ((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.changeModelDecorations(callback)) || null;
        }
        //#endregion
        //#region Kernel/Execution
        async _loadKernelPreloads() {
            var _a, _b;
            if (!this.hasModel()) {
                return;
            }
            const { selected } = this.notebookKernelService.getMatchingKernel(this.textModel);
            if (!((_a = this._webview) === null || _a === void 0 ? void 0 : _a.isResolved())) {
                await this._resolveWebview();
            }
            (_b = this._webview) === null || _b === void 0 ? void 0 : _b.updateKernelPreloads(selected);
        }
        get activeKernel() {
            return this.textModel && this.notebookKernelService.getSelectedOrSuggestedKernel(this.textModel);
        }
        async cancelNotebookCells(cells) {
            if (!this.viewModel || !this.hasModel()) {
                return;
            }
            if (!cells) {
                cells = this.viewModel.viewCells;
            }
            return this.notebookExecutionService.cancelNotebookCellHandles(this.textModel, Array.from(cells).map(cell => cell.handle));
        }
        async executeNotebookCells(cells) {
            if (!this.viewModel || !this.hasModel()) {
                return;
            }
            if (!cells) {
                cells = this.viewModel.viewCells;
            }
            return this.notebookExecutionService.executeNotebookCells(this.textModel, Array.from(cells).map(c => c.model));
        }
        async layoutNotebookCell(cell, height, context) {
            var _a, _b, _c;
            this._debug('layout cell', cell.handle, height);
            const viewIndex = this._list.getViewIndex(cell);
            if (viewIndex === undefined) {
                // the cell is hidden
                return;
            }
            const relayout = (cell, height) => {
                if (this._isDisposed) {
                    return;
                }
                this._list.updateElementHeight2(cell, height);
            };
            if ((_a = this._pendingLayouts) === null || _a === void 0 ? void 0 : _a.has(cell)) {
                (_b = this._pendingLayouts) === null || _b === void 0 ? void 0 : _b.get(cell).dispose();
            }
            let deferred = new async_1.DeferredPromise();
            const doLayout = () => {
                var _a;
                if (this._isDisposed) {
                    return;
                }
                if (this._list.elementHeight(cell) === height) {
                    return;
                }
                (_a = this._pendingLayouts) === null || _a === void 0 ? void 0 : _a.delete(cell);
                relayout(cell, height);
                deferred.complete(undefined);
            };
            if (context === notebookBrowser_1.CellLayoutContext.Fold) {
                doLayout();
            }
            else {
                const layoutDisposable = DOM.scheduleAtNextAnimationFrame(doLayout);
                (_c = this._pendingLayouts) === null || _c === void 0 ? void 0 : _c.set(cell, (0, lifecycle_1.toDisposable)(() => {
                    layoutDisposable.dispose();
                    deferred.complete(undefined);
                }));
            }
            return deferred.p;
        }
        getActiveCell() {
            const elements = this._list.getFocusedElements();
            if (elements && elements.length) {
                return elements[0];
            }
            return undefined;
        }
        _cellFocusAria(cell, focusItem) {
            var _a, _b;
            const index = (_a = this._notebookViewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(cell);
            if (index !== undefined && index >= 0) {
                let position = '';
                switch (focusItem) {
                    case 'editor':
                        position = `the inner ${cell.cellKind === notebookCommon_1.CellKind.Markup ? 'markdown' : 'code'} editor is focused, press escape to focus the cell container`;
                        break;
                    case 'output':
                        position = `the cell output is focused, press escape to focus the cell container`;
                        break;
                    case 'container':
                        position = `the ${cell.cellKind === notebookCommon_1.CellKind.Markup ? 'markdown preview' : 'cell container'} is focused, press enter to focus the inner ${cell.cellKind === notebookCommon_1.CellKind.Markup ? 'markdown' : 'code'} editor`;
                        break;
                    default:
                        break;
                }
                aria.alert(`Cell ${(_b = this._notebookViewModel) === null || _b === void 0 ? void 0 : _b.getCellIndex(cell)}, ${position} `);
            }
        }
        _toggleNotebookCellSelection(selectedCell, selectFromPrevious) {
            var _a;
            const currentSelections = this._list.getSelectedElements();
            const isSelected = currentSelections.includes(selectedCell);
            const previousSelection = selectFromPrevious ? (_a = currentSelections[currentSelections.length - 1]) !== null && _a !== void 0 ? _a : selectedCell : selectedCell;
            const selectedIndex = this._list.getViewIndex(selectedCell);
            const previousIndex = this._list.getViewIndex(previousSelection);
            const cellsInSelectionRange = this.getCellsInViewRange(selectedIndex, previousIndex);
            if (isSelected) {
                // Deselect
                this._list.selectElements(currentSelections.filter(current => !cellsInSelectionRange.includes(current)));
            }
            else {
                // Add to selection
                this.focusElement(selectedCell);
                this._list.selectElements([...currentSelections.filter(current => !cellsInSelectionRange.includes(current)), ...cellsInSelectionRange]);
            }
        }
        getCellsInViewRange(fromInclusive, toInclusive) {
            const selectedCellsInRange = [];
            for (let index = 0; index < this._list.length; ++index) {
                const cell = this._list.element(index);
                if (cell) {
                    if ((index >= fromInclusive && index <= toInclusive) || (index >= toInclusive && index <= fromInclusive)) {
                        selectedCellsInRange.push(cell);
                    }
                }
            }
            return selectedCellsInRange;
        }
        focusNotebookCell(cell, focusItem, options) {
            if (this._isDisposed) {
                return;
            }
            if (focusItem === 'editor') {
                this.focusElement(cell);
                this._cellFocusAria(cell, focusItem);
                this._list.focusView();
                cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'focusNotebookCell');
                cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                if (!(options === null || options === void 0 ? void 0 : options.skipReveal)) {
                    const selectionsStartPosition = cell.getSelectionsStartPosition();
                    if (selectionsStartPosition === null || selectionsStartPosition === void 0 ? void 0 : selectionsStartPosition.length) {
                        const firstSelectionPosition = selectionsStartPosition[0];
                        this.revealRangeInCenterIfOutsideViewportAsync(cell, range_1.Range.fromPositions(firstSelectionPosition, firstSelectionPosition));
                    }
                    else {
                        this.revealInCenterIfOutsideViewport(cell);
                    }
                }
            }
            else if (focusItem === 'output') {
                this.focusElement(cell);
                this._cellFocusAria(cell, focusItem);
                this._list.focusView();
                if (!this._webview) {
                    return;
                }
                this._webview.focusOutput(cell.id);
                cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'focusNotebookCell');
                cell.focusMode = notebookBrowser_1.CellFocusMode.Container;
                if (!(options === null || options === void 0 ? void 0 : options.skipReveal)) {
                    this.revealInCenterIfOutsideViewport(cell);
                }
            }
            else {
                const itemDOM = this._list.domElementOfElement(cell);
                if (document.activeElement && itemDOM && itemDOM.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
                cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'focusNotebookCell');
                cell.focusMode = notebookBrowser_1.CellFocusMode.Container;
                this.focusElement(cell);
                this._cellFocusAria(cell, focusItem);
                if (!(options === null || options === void 0 ? void 0 : options.skipReveal)) {
                    this.revealInCenterIfOutsideViewport(cell);
                }
                this._list.focusView();
            }
        }
        focusNextNotebookCell(cell, focusItem) {
            var _a, _b;
            const idx = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(cell);
            if (typeof idx !== 'number') {
                return;
            }
            const newCell = (_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.cellAt(idx + 1);
            if (!newCell) {
                return;
            }
            this.focusNotebookCell(newCell, focusItem);
        }
        //#endregion
        //#region Find
        async _renderCell(viewCell) {
            var _a;
            if (viewCell.isOutputCollapsed) {
                return;
            }
            const outputs = viewCell.outputsViewModels;
            for (let output of outputs) {
                const [mimeTypes, pick] = output.resolveMimeTypes(this.textModel, undefined);
                if (!mimeTypes.find(mimeType => mimeType.isTrusted) || mimeTypes.length === 0) {
                    continue;
                }
                const pickedMimeTypeRenderer = mimeTypes[pick];
                if (!pickedMimeTypeRenderer) {
                    return;
                }
                const renderer = this._notebookService.getRendererInfo(pickedMimeTypeRenderer.rendererId);
                if (!renderer) {
                    return;
                }
                const result = { type: 1 /* RenderOutputType.Extension */, renderer, source: output, mimeType: pickedMimeTypeRenderer.mimeType };
                if (!((_a = this._webview) === null || _a === void 0 ? void 0 : _a.insetMapping.has(result.source))) {
                    const p = new Promise(resolve => {
                        this.onDidRenderOutput(e => {
                            if (e.model === result.source.model) {
                                resolve();
                            }
                        });
                    });
                    this.createOutput(viewCell, result, 0);
                    await p;
                }
                return;
            }
        }
        async _warmupAll(includeOutput) {
            if (!this.hasModel() || !this.viewModel) {
                return;
            }
            const cells = this.viewModel.viewCells;
            const requests = [];
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].cellKind === notebookCommon_1.CellKind.Markup && !this._webview.markupPreviewMapping.has(cells[i].id)) {
                    requests.push(this.createMarkupPreview(cells[i]));
                }
            }
            if (includeOutput) {
                for (let i = 0; i < this.getLength(); i++) {
                    const cell = this.cellAt(i);
                    if ((cell === null || cell === void 0 ? void 0 : cell.cellKind) === notebookCommon_1.CellKind.Code) {
                        requests.push(this._renderCell(cell));
                    }
                }
            }
            return Promise.all(requests);
        }
        async find(query, options, token, skipWarmup = false) {
            var _a;
            if (!this._notebookViewModel) {
                return [];
            }
            const findMatches = this._notebookViewModel.find(query, options).filter(match => match.matches.length > 0);
            if (!options.includeMarkupPreview && !options.includeOutput) {
                (_a = this._webview) === null || _a === void 0 ? void 0 : _a.findStop();
                return findMatches.filter(match => (match.cell.cellKind === notebookCommon_1.CellKind.Code && options.includeCodeInput) ||
                    (match.cell.cellKind === notebookCommon_1.CellKind.Markup && options.includeMarkupInput));
            }
            const matchMap = {};
            findMatches.forEach(match => {
                if (match.cell.cellKind === notebookCommon_1.CellKind.Code && options.includeCodeInput) {
                    matchMap[match.cell.id] = match;
                }
                if (match.cell.cellKind === notebookCommon_1.CellKind.Markup && options.includeMarkupInput) {
                    matchMap[match.cell.id] = match;
                }
            });
            if (this._webview) {
                // request all outputs to be rendered
                await this._warmupAll(!!options.includeOutput);
                const webviewMatches = await this._webview.find(query, { caseSensitive: options.caseSensitive, wholeWord: options.wholeWord, includeMarkup: !!options.includeMarkupPreview, includeOutput: !!options.includeOutput });
                // attach webview matches to model find matches
                webviewMatches.forEach(match => {
                    if (!options.includeMarkupPreview && match.type === 'preview') {
                        // skip outputs if not included
                        return;
                    }
                    if (!options.includeOutput && match.type === 'output') {
                        // skip outputs if not included
                        return;
                    }
                    const exisitingMatch = matchMap[match.cellId];
                    if (exisitingMatch) {
                        exisitingMatch.matches.push(match);
                    }
                    else {
                        matchMap[match.cellId] = {
                            cell: this._notebookViewModel.viewCells.find(cell => cell.id === match.cellId),
                            index: this._notebookViewModel.viewCells.findIndex(cell => cell.id === match.cellId),
                            matches: [match],
                            modelMatchCount: 0
                        };
                    }
                });
            }
            const ret = [];
            this._notebookViewModel.viewCells.forEach((cell, index) => {
                if (matchMap[cell.id]) {
                    ret.push({
                        cell: cell,
                        index: index,
                        matches: matchMap[cell.id].matches,
                        modelMatchCount: matchMap[cell.id].modelMatchCount
                    });
                }
            });
            return ret;
        }
        async highlightFind(cell, matchIndex) {
            var _a;
            if (!this._webview) {
                return 0;
            }
            return (_a = this._webview) === null || _a === void 0 ? void 0 : _a.findHighlight(matchIndex);
        }
        async unHighlightFind(matchIndex) {
            var _a;
            if (!this._webview) {
                return;
            }
            return (_a = this._webview) === null || _a === void 0 ? void 0 : _a.findUnHighlight(matchIndex);
        }
        findStop() {
            if (this._webview) {
                this._webview.findStop();
            }
        }
        //#endregion
        //#region MISC
        getLayoutInfo() {
            var _a, _b, _c, _d, _f, _g;
            if (!this._list) {
                throw new Error('Editor is not initalized successfully');
            }
            if (!this._fontInfo) {
                this._generateFontInfo();
            }
            return {
                width: (_b = (_a = this._dimension) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : 0,
                height: (_d = (_c = this._dimension) === null || _c === void 0 ? void 0 : _c.height) !== null && _d !== void 0 ? _d : 0,
                scrollHeight: (_g = (_f = this._list) === null || _f === void 0 ? void 0 : _f.getScrollHeight()) !== null && _g !== void 0 ? _g : 0,
                fontInfo: this._fontInfo
            };
        }
        async createMarkupPreview(cell) {
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            if (!this._webview || !this._list.webviewElement) {
                return;
            }
            if (!this.viewModel) {
                return;
            }
            const modelIndex = this.viewModel.getCellIndex(cell);
            const foldedRanges = this.viewModel.getHiddenRanges();
            const isVisible = !foldedRanges.some(range => modelIndex >= range.start && modelIndex < range.end);
            if (!isVisible) {
                return;
            }
            const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
            const top = !!webviewTop ? (0 - webviewTop) : 0;
            const cellTop = this._list.getAbsoluteTopOfElement(cell);
            await this._webview.showMarkupPreview({
                mime: cell.mime,
                cellHandle: cell.handle,
                cellId: cell.id,
                content: cell.getText(),
                offset: cellTop + top,
                visible: true,
            });
        }
        async unhideMarkupPreviews(cells) {
            var _a;
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            await ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.unhideMarkupPreviews(cells.map(cell => cell.id)));
        }
        async hideMarkupPreviews(cells) {
            var _a;
            if (!this._webview || !cells.length) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            await ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.hideMarkupPreviews(cells.map(cell => cell.id)));
        }
        async deleteMarkupPreviews(cells) {
            var _a;
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            await ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.deleteMarkupPreviews(cells.map(cell => cell.id)));
        }
        async updateSelectedMarkdownPreviews() {
            var _a;
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            const selectedCells = this.getSelectionViewModels().map(cell => cell.id);
            // Only show selection when there is more than 1 cell selected
            await ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.updateMarkupPreviewSelections(selectedCells.length > 1 ? selectedCells : []));
        }
        async createOutput(cell, output, offset) {
            this._insetModifyQueueByOutputId.queue(output.source.model.outputId, async () => {
                if (!this._webview) {
                    return;
                }
                if (!this._webview.isResolved()) {
                    await this._resolveWebview();
                }
                if (!this._webview) {
                    return;
                }
                if (!this._list.webviewElement) {
                    return;
                }
                if (output.type === 1 /* RenderOutputType.Extension */) {
                    this.notebookRendererMessaging.prepare(output.renderer.id);
                }
                const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
                const top = !!webviewTop ? (0 - webviewTop) : 0;
                const cellTop = this._list.getAbsoluteTopOfElement(cell) + top;
                // const cellTop = this._list.getAbsoluteTopOfElement(cell);
                if (!this._webview.insetMapping.has(output.source)) {
                    await this._webview.createOutput({ cellId: cell.id, cellHandle: cell.handle, cellUri: cell.uri }, output, cellTop, offset);
                }
                else {
                    const outputIndex = cell.outputsViewModels.indexOf(output.source);
                    const outputOffset = cell.getOutputOffset(outputIndex);
                    this._webview.updateScrollTops([{
                            cell,
                            output: output.source,
                            cellTop,
                            outputOffset,
                            forceDisplay: !cell.isOutputCollapsed,
                        }], []);
                }
            });
        }
        async updateOutput(cell, output, offset) {
            this._insetModifyQueueByOutputId.queue(output.source.model.outputId, async () => {
                if (!this._webview) {
                    return;
                }
                if (!this._webview.isResolved()) {
                    await this._resolveWebview();
                }
                if (!this._webview || !this._list.webviewElement) {
                    return;
                }
                if (!this._webview.insetMapping.has(output.source)) {
                    return this.createOutput(cell, output, offset);
                }
                if (output.type === 1 /* RenderOutputType.Extension */) {
                    this.notebookRendererMessaging.prepare(output.renderer.id);
                }
                const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
                const top = !!webviewTop ? (0 - webviewTop) : 0;
                const cellTop = this._list.getAbsoluteTopOfElement(cell) + top;
                await this._webview.updateOutput({ cellId: cell.id, cellHandle: cell.handle, cellUri: cell.uri }, output, cellTop, offset);
            });
        }
        removeInset(output) {
            this._insetModifyQueueByOutputId.queue(output.model.outputId, async () => {
                var _a;
                if ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.isResolved()) {
                    this._webview.removeInsets([output]);
                }
            });
        }
        hideInset(output) {
            this._insetModifyQueueByOutputId.queue(output.model.outputId, async () => {
                var _a;
                if ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.isResolved()) {
                    this._webview.hideInset(output);
                }
            });
        }
        //#region --- webview IPC ----
        postMessage(message) {
            var _a;
            if ((_a = this._webview) === null || _a === void 0 ? void 0 : _a.isResolved()) {
                this._webview.postKernelMessage(message);
            }
        }
        //#endregion
        addClassName(className) {
            this._overlayContainer.classList.add(className);
        }
        removeClassName(className) {
            this._overlayContainer.classList.remove(className);
        }
        cellAt(index) {
            var _a;
            return (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.cellAt(index);
        }
        getCellByInfo(cellInfo) {
            var _a;
            const { cellHandle } = cellInfo;
            return (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewCells.find(vc => vc.handle === cellHandle);
        }
        getCellByHandle(handle) {
            var _a;
            return (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getCellByHandle(handle);
        }
        getCellIndex(cell) {
            var _a;
            return (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndexByHandle(cell.handle);
        }
        getNextVisibleCellIndex(index) {
            var _a;
            return (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getNextVisibleCellIndex(index);
        }
        getPreviousVisibleCellIndex(index) {
            var _a;
            return (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getPreviousVisibleCellIndex(index);
        }
        _updateScrollHeight() {
            var _a, _b, _c, _d;
            if (this._isDisposed || !((_a = this._webview) === null || _a === void 0 ? void 0 : _a.isResolved())) {
                return;
            }
            if (!this._list.webviewElement) {
                return;
            }
            const scrollHeight = this._list.scrollHeight;
            this._webview.element.style.height = `${scrollHeight + notebookCellList_1.NOTEBOOK_WEBVIEW_BOUNDARY * 2}px`;
            const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
            const top = !!webviewTop ? (0 - webviewTop) : 0;
            const updateItems = [];
            const removedItems = [];
            (_b = this._webview) === null || _b === void 0 ? void 0 : _b.insetMapping.forEach((value, key) => {
                var _a, _b;
                const cell = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.getCellByHandle(value.cellInfo.cellHandle);
                if (!cell || !(cell instanceof codeCellViewModel_1.CodeCellViewModel)) {
                    return;
                }
                (_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells.find(cell => cell.handle === value.cellInfo.cellHandle);
                const viewIndex = this._list.getViewIndex(cell);
                if (viewIndex === undefined) {
                    return;
                }
                if (cell.outputsViewModels.indexOf(key) < 0) {
                    // output is already gone
                    removedItems.push(key);
                }
                const cellTop = this._list.getAbsoluteTopOfElement(cell);
                const outputIndex = cell.outputsViewModels.indexOf(key);
                const outputOffset = cell.getOutputOffset(outputIndex);
                updateItems.push({
                    cell,
                    output: key,
                    cellTop: cellTop + top,
                    outputOffset,
                    forceDisplay: false,
                });
            });
            this._webview.removeInsets(removedItems);
            const markdownUpdateItems = [];
            for (const cellId of this._webview.markupPreviewMapping.keys()) {
                const cell = (_c = this.viewModel) === null || _c === void 0 ? void 0 : _c.viewCells.find(cell => cell.id === cellId);
                if (cell) {
                    const cellTop = this._list.getAbsoluteTopOfElement(cell);
                    // markdownUpdateItems.push({ id: cellId, top: cellTop });
                    markdownUpdateItems.push({ id: cellId, top: cellTop + top });
                }
            }
            if (markdownUpdateItems.length || updateItems.length) {
                this._debug('_list.onDidChangeContentHeight/markdown', markdownUpdateItems);
                (_d = this._webview) === null || _d === void 0 ? void 0 : _d.updateScrollTops(updateItems, markdownUpdateItems);
            }
        }
        //#endregion
        //#region BacklayerWebview delegate
        _updateOutputHeight(cellInfo, output, outputHeight, isInit, source) {
            var _a;
            const cell = (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewCells.find(vc => vc.handle === cellInfo.cellHandle);
            if (cell && cell instanceof codeCellViewModel_1.CodeCellViewModel) {
                const outputIndex = cell.outputsViewModels.indexOf(output);
                if (outputHeight !== 0) {
                    cell.updateOutputMinHeight(0);
                }
                this._debug('update cell output', cell.handle, outputHeight);
                cell.updateOutputHeight(outputIndex, outputHeight, source);
                this.layoutNotebookCell(cell, cell.layoutInfo.totalHeight);
                if (isInit) {
                    this._onDidRenderOutput.fire(output);
                }
            }
        }
        _scheduleOutputHeightAck(cellInfo, outputId, height) {
            const wasEmpty = this._pendingOutputHeightAcks.size === 0;
            this._pendingOutputHeightAcks.set(outputId, { cellId: cellInfo.cellId, outputId, height });
            if (wasEmpty) {
                DOM.scheduleAtNextAnimationFrame(() => {
                    var _a;
                    this._debug('ack height');
                    this._updateScrollHeight();
                    (_a = this._webview) === null || _a === void 0 ? void 0 : _a.ackHeight([...this._pendingOutputHeightAcks.values()]);
                    this._pendingOutputHeightAcks.clear();
                }, -1); // -1 priority because this depends on calls to layoutNotebookCell, and that may be called multiple times before this runs
            }
        }
        _getCellById(cellId) {
            var _a;
            return (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewCells.find(vc => vc.id === cellId);
        }
        _updateMarkupCellHeight(cellId, height, isInit) {
            var _a;
            const cell = this._getCellById(cellId);
            if (cell && cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const { bottomToolbarGap } = this._notebookOptions.computeBottomToolbarDimensions((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.viewType);
                this._debug('updateMarkdownCellHeight', cell.handle, height + bottomToolbarGap, isInit);
                cell.renderedMarkdownHeight = height;
            }
        }
        _setMarkupCellEditState(cellId, editState) {
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.revealInView(cell);
                cell.updateEditState(editState, 'setMarkdownCellEditState');
            }
        }
        _didStartDragMarkupCell(cellId, event) {
            var _a;
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const webviewOffset = this._list.webviewElement ? -parseInt(this._list.webviewElement.domNode.style.top, 10) : 0;
                (_a = this._dndController) === null || _a === void 0 ? void 0 : _a.startExplicitDrag(cell, event.dragOffsetY - webviewOffset);
            }
        }
        _didDragMarkupCell(cellId, event) {
            var _a;
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const webviewOffset = this._list.webviewElement ? -parseInt(this._list.webviewElement.domNode.style.top, 10) : 0;
                (_a = this._dndController) === null || _a === void 0 ? void 0 : _a.explicitDrag(cell, event.dragOffsetY - webviewOffset);
            }
        }
        _didDropMarkupCell(cellId, event) {
            var _a;
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const webviewOffset = this._list.webviewElement ? -parseInt(this._list.webviewElement.domNode.style.top, 10) : 0;
                event.dragOffsetY -= webviewOffset;
                (_a = this._dndController) === null || _a === void 0 ? void 0 : _a.explicitDrop(cell, event);
            }
        }
        _didEndDragMarkupCell(cellId) {
            var _a;
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                (_a = this._dndController) === null || _a === void 0 ? void 0 : _a.endExplicitDrag(cell);
            }
        }
        //#endregion
        //#region Editor Contributions
        getContribution(id) {
            return (this._contributions.get(id) || null);
        }
        //#endregion
        dispose() {
            var _a, _b, _c;
            this._isDisposed = true;
            // dispose webview first
            (_a = this._webview) === null || _a === void 0 ? void 0 : _a.dispose();
            this._webview = null;
            this.notebookEditorService.removeNotebookEditor(this);
            (0, lifecycle_1.dispose)(this._contributions.values());
            this._contributions.clear();
            this._localStore.clear();
            (0, lifecycle_1.dispose)(this._localCellStateListeners);
            this._list.dispose();
            (_b = this._listTopCellToolbar) === null || _b === void 0 ? void 0 : _b.dispose();
            this._overlayContainer.remove();
            (_c = this.viewModel) === null || _c === void 0 ? void 0 : _c.dispose();
            this._renderedEditors.clear();
            this._baseCellEditorOptions.forEach(v => v.dispose());
            this._baseCellEditorOptions.clear();
            super.dispose();
            // unref
            this._webview = null;
            this._webviewResolvePromise = null;
            this._webviewTransparentCover = null;
            this._dndController = null;
            this._listTopCellToolbar = null;
            this._notebookViewModel = undefined;
            this._cellContextKeyManager = null;
            this._notebookTopToolbar = null;
            this._list = null;
            this._listViewInfoAccessor = null;
            this._pendingLayouts = null;
            this._listDelegate = null;
        }
        toJSON() {
            var _a;
            return {
                notebookUri: (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.uri,
            };
        }
    };
    NotebookEditorWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notebookRendererMessagingService_1.INotebookRendererMessagingService),
        __param(3, notebookEditorService_1.INotebookEditorService),
        __param(4, notebookKernelService_1.INotebookKernelService),
        __param(5, notebookService_1.INotebookService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, layoutService_1.ILayoutService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, actions_1.IMenuService),
        __param(11, themeService_1.IThemeService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, notebookExecutionService_1.INotebookExecutionService),
        __param(14, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(15, progress_1.IEditorProgressService)
    ], NotebookEditorWidget);
    exports.NotebookEditorWidget = NotebookEditorWidget;
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 5, 'notebook-progress-bar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 10, 'notebook-list-insertion-indicator');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 20, 'notebook-cell-editor-outline');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 25, 'notebook-scrollbar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 26, 'notebook-cell-status');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 26, 'notebook-folding-indicator');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 27, 'notebook-output');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 28, 'notebook-cell-bottom-toolbar-container');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 29, 'notebook-run-button-container');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 29, 'notebook-input-collapse-condicon');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 30, 'notebook-cell-output-toolbar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Sash, 1, 'notebook-cell-expand-part-button');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Sash, 2, 'notebook-cell-toolbar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Sash, 3, 'notebook-cell-toolbar-dropdown-active');
    exports.notebookCellBorder = (0, colorRegistry_1.registerColor)('notebook.cellBorderColor', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.listInactiveSelectionBackground, 1),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.listInactiveSelectionBackground, 1),
        hcDark: theme_1.PANEL_BORDER,
        hcLight: theme_1.PANEL_BORDER
    }, nls.localize('notebook.cellBorderColor', "The border color for notebook cells."));
    exports.focusedEditorBorderColor = (0, colorRegistry_1.registerColor)('notebook.focusedEditorBorder', {
        light: colorRegistry_1.focusBorder,
        dark: colorRegistry_1.focusBorder,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.focusedEditorBorder', "The color of the notebook cell editor border."));
    exports.cellStatusIconSuccess = (0, colorRegistry_1.registerColor)('notebookStatusSuccessIcon.foreground', {
        light: debugColors_1.debugIconStartForeground,
        dark: debugColors_1.debugIconStartForeground,
        hcDark: debugColors_1.debugIconStartForeground,
        hcLight: debugColors_1.debugIconStartForeground
    }, nls.localize('notebookStatusSuccessIcon.foreground', "The error icon color of notebook cells in the cell status bar."));
    exports.cellStatusIconError = (0, colorRegistry_1.registerColor)('notebookStatusErrorIcon.foreground', {
        light: colorRegistry_1.errorForeground,
        dark: colorRegistry_1.errorForeground,
        hcDark: colorRegistry_1.errorForeground,
        hcLight: colorRegistry_1.errorForeground
    }, nls.localize('notebookStatusErrorIcon.foreground', "The error icon color of notebook cells in the cell status bar."));
    exports.cellStatusIconRunning = (0, colorRegistry_1.registerColor)('notebookStatusRunningIcon.foreground', {
        light: colorRegistry_1.foreground,
        dark: colorRegistry_1.foreground,
        hcDark: colorRegistry_1.foreground,
        hcLight: colorRegistry_1.foreground
    }, nls.localize('notebookStatusRunningIcon.foreground', "The running icon color of notebook cells in the cell status bar."));
    exports.notebookOutputContainerBorderColor = (0, colorRegistry_1.registerColor)('notebook.outputContainerBorderColor', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.outputContainerBorderColor', "The border color of the notebook output container."));
    exports.notebookOutputContainerColor = (0, colorRegistry_1.registerColor)('notebook.outputContainerBackgroundColor', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.outputContainerBackgroundColor', "The color of the notebook output container background."));
    // TODO@rebornix currently also used for toolbar border, if we keep all of this, pick a generic name
    exports.CELL_TOOLBAR_SEPERATOR = (0, colorRegistry_1.registerColor)('notebook.cellToolbarSeparator', {
        dark: color_1.Color.fromHex('#808080').transparent(0.35),
        light: color_1.Color.fromHex('#808080').transparent(0.35),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, nls.localize('notebook.cellToolbarSeparator', "The color of the separator in the cell bottom toolbar"));
    exports.focusedCellBackground = (0, colorRegistry_1.registerColor)('notebook.focusedCellBackground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, nls.localize('focusedCellBackground', "The background color of a cell when the cell is focused."));
    exports.selectedCellBackground = (0, colorRegistry_1.registerColor)('notebook.selectedCellBackground', {
        dark: colorRegistry_1.listInactiveSelectionBackground,
        light: colorRegistry_1.listInactiveSelectionBackground,
        hcDark: null,
        hcLight: null
    }, nls.localize('selectedCellBackground', "The background color of a cell when the cell is selected."));
    exports.cellHoverBackground = (0, colorRegistry_1.registerColor)('notebook.cellHoverBackground', {
        dark: (0, colorRegistry_1.transparent)(exports.focusedCellBackground, .5),
        light: (0, colorRegistry_1.transparent)(exports.focusedCellBackground, .7),
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.cellHoverBackground', "The background color of a cell when the cell is hovered."));
    exports.selectedCellBorder = (0, colorRegistry_1.registerColor)('notebook.selectedCellBorder', {
        dark: exports.notebookCellBorder,
        light: exports.notebookCellBorder,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, nls.localize('notebook.selectedCellBorder', "The color of the cell's top and bottom border when the cell is selected but not focused."));
    exports.inactiveSelectedCellBorder = (0, colorRegistry_1.registerColor)('notebook.inactiveSelectedCellBorder', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.inactiveSelectedCellBorder', "The color of the cell's borders when multiple cells are selected."));
    exports.focusedCellBorder = (0, colorRegistry_1.registerColor)('notebook.focusedCellBorder', {
        dark: colorRegistry_1.focusBorder,
        light: colorRegistry_1.focusBorder,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.focusedCellBorder', "The color of the cell's focus indicator borders when the cell is focused."));
    exports.inactiveFocusedCellBorder = (0, colorRegistry_1.registerColor)('notebook.inactiveFocusedCellBorder', {
        dark: exports.notebookCellBorder,
        light: exports.notebookCellBorder,
        hcDark: exports.notebookCellBorder,
        hcLight: exports.notebookCellBorder
    }, nls.localize('notebook.inactiveFocusedCellBorder', "The color of the cell's top and bottom border when a cell is focused while the primary focus is outside of the editor."));
    exports.cellStatusBarItemHover = (0, colorRegistry_1.registerColor)('notebook.cellStatusBarItemHoverBackground', {
        light: new color_1.Color(new color_1.RGBA(0, 0, 0, 0.08)),
        dark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.15)),
        hcDark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.15)),
        hcLight: new color_1.Color(new color_1.RGBA(0, 0, 0, 0.08)),
    }, nls.localize('notebook.cellStatusBarItemHoverBackground', "The background color of notebook cell status bar items."));
    exports.cellInsertionIndicator = (0, colorRegistry_1.registerColor)('notebook.cellInsertionIndicator', {
        light: colorRegistry_1.focusBorder,
        dark: colorRegistry_1.focusBorder,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.cellInsertionIndicator', "The color of the notebook cell insertion indicator."));
    exports.listScrollbarSliderBackground = (0, colorRegistry_1.registerColor)('notebookScrollbarSlider.background', {
        dark: colorRegistry_1.scrollbarSliderBackground,
        light: colorRegistry_1.scrollbarSliderBackground,
        hcDark: colorRegistry_1.scrollbarSliderBackground,
        hcLight: colorRegistry_1.scrollbarSliderBackground
    }, nls.localize('notebookScrollbarSliderBackground', "Notebook scrollbar slider background color."));
    exports.listScrollbarSliderHoverBackground = (0, colorRegistry_1.registerColor)('notebookScrollbarSlider.hoverBackground', {
        dark: colorRegistry_1.scrollbarSliderHoverBackground,
        light: colorRegistry_1.scrollbarSliderHoverBackground,
        hcDark: colorRegistry_1.scrollbarSliderHoverBackground,
        hcLight: colorRegistry_1.scrollbarSliderHoverBackground
    }, nls.localize('notebookScrollbarSliderHoverBackground', "Notebook scrollbar slider background color when hovering."));
    exports.listScrollbarSliderActiveBackground = (0, colorRegistry_1.registerColor)('notebookScrollbarSlider.activeBackground', {
        dark: colorRegistry_1.scrollbarSliderActiveBackground,
        light: colorRegistry_1.scrollbarSliderActiveBackground,
        hcDark: colorRegistry_1.scrollbarSliderActiveBackground,
        hcLight: colorRegistry_1.scrollbarSliderActiveBackground
    }, nls.localize('notebookScrollbarSliderActiveBackground', "Notebook scrollbar slider background color when clicked on."));
    exports.cellSymbolHighlight = (0, colorRegistry_1.registerColor)('notebook.symbolHighlightBackground', {
        dark: color_1.Color.fromHex('#ffffff0b'),
        light: color_1.Color.fromHex('#fdff0033'),
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.symbolHighlightBackground', "Background color of highlighted cell"));
    exports.cellEditorBackground = (0, colorRegistry_1.registerColor)('notebook.cellEditorBackground', {
        light: theme_1.SIDE_BAR_BACKGROUND,
        dark: theme_1.SIDE_BAR_BACKGROUND,
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.cellEditorBackground', "Cell editor background color."));
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // add css variable rules
        var _a;
        const focusedCellBorderColor = theme.getColor(exports.focusedCellBorder);
        const inactiveFocusedBorderColor = theme.getColor(exports.inactiveFocusedCellBorder);
        const selectedCellBorderColor = theme.getColor(exports.selectedCellBorder);
        collector.addRule(`
	:root {
		--notebook-focused-cell-border-color: ${focusedCellBorderColor};
		--notebook-inactive-focused-cell-border-color: ${inactiveFocusedBorderColor};
		--notebook-selected-cell-border-color: ${selectedCellBorderColor};
	}
	`);
        const cellStatusIconSuccessColor = theme.getColor(exports.cellStatusIconSuccess);
        const cellStatusIconErrorColor = theme.getColor(exports.cellStatusIconError);
        const cellStatusIconRunningColor = theme.getColor(exports.cellStatusIconRunning);
        collector.addRule(`
	:root {
		--notebook-cell-status-icon-success: ${cellStatusIconSuccessColor};
		--notebook-cell-status-icon-error: ${cellStatusIconErrorColor};
		--notebook-cell-status-icon-running: ${cellStatusIconRunningColor};
	}
	`);
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.notebookOverlay .cell.markdown a,
			.notebookOverlay .output-show-more-container a,
			.notebookOverlay div.output-show-more a
			{ color: ${link};} `);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.notebookOverlay .output-show-more-container a:active,
		.notebookOverlay .output-show-more a:active
			{ color: ${activeLink}; }`);
        }
        const shortcut = theme.getColor(colorRegistry_1.textPreformatForeground);
        if (shortcut) {
            collector.addRule(`.notebookOverlay code,
			.notebookOverlay .shortcut { color: ${shortcut}; }`);
        }
        const border = theme.getColor(colorRegistry_1.contrastBorder);
        if (border) {
            collector.addRule(`.notebookOverlay .monaco-editor { border-color: ${border}; }`);
        }
        const quoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
        if (quoteBackground) {
            collector.addRule(`.notebookOverlay blockquote { background: ${quoteBackground}; }`);
        }
        const quoteBorder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
        if (quoteBorder) {
            collector.addRule(`.notebookOverlay blockquote { border-color: ${quoteBorder}; }`);
        }
        const containerBackground = theme.getColor(exports.notebookOutputContainerColor);
        if (containerBackground) {
            collector.addRule(`.notebookOverlay .output { background-color: ${containerBackground}; }`);
            collector.addRule(`.notebookOverlay .output-element { background-color: ${containerBackground}; }`);
            collector.addRule(`.notebookOverlay .output-show-more-container { background-color: ${containerBackground}; }`);
        }
        const containerBorder = theme.getColor(exports.notebookOutputContainerBorderColor);
        if (containerBorder) {
            collector.addRule(`.notebookOverlay .output-element { border-top: none !important; border: 1px solid transparent; border-color: ${containerBorder} !important; }`);
        }
        const notebookBackground = theme.getColor(colorRegistry_1.editorBackground);
        if (notebookBackground) {
            collector.addRule(`.notebookOverlay .cell-drag-image .cell-editor-container > div { background: ${notebookBackground} !important; }`);
            collector.addRule(`.notebookOverlay .monaco-list-row .cell-title-toolbar { background-color: ${notebookBackground}; }`);
            collector.addRule(`.notebookOverlay .monaco-list-row.cell-drag-image { background-color: ${notebookBackground}; }`);
            collector.addRule(`.notebookOverlay .cell-bottom-toolbar-container .action-item { background-color: ${notebookBackground} }`);
            collector.addRule(`.notebookOverlay .cell-list-top-cell-toolbar-container .action-item { background-color: ${notebookBackground} }`);
        }
        const editorBackgroundColor = (_a = theme.getColor(exports.cellEditorBackground)) !== null && _a !== void 0 ? _a : theme.getColor(colorRegistry_1.editorBackground);
        if (editorBackgroundColor) {
            collector.addRule(`.notebookOverlay .cell .monaco-editor-background,
		.notebookOverlay .cell .margin-view-overlays,
		.notebookOverlay .cell .cell-statusbar-container { background: ${editorBackgroundColor}; }`);
        }
        const cellToolbarSeperator = theme.getColor(exports.CELL_TOOLBAR_SEPERATOR);
        if (cellToolbarSeperator) {
            collector.addRule(`.notebookOverlay .monaco-list-row .cell-title-toolbar { border: solid 1px ${cellToolbarSeperator}; }`);
            collector.addRule(`.notebookOverlay .cell-bottom-toolbar-container .action-item { border: solid 1px ${cellToolbarSeperator} }`);
            collector.addRule(`.notebookOverlay .cell-list-top-cell-toolbar-container .action-item { border: solid 1px ${cellToolbarSeperator} }`);
            collector.addRule(`.notebookOverlay .monaco-action-bar .action-item.verticalSeparator { background-color: ${cellToolbarSeperator} }`);
            collector.addRule(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .input-collapse-container { border-bottom: solid 1px ${cellToolbarSeperator} }`);
        }
        const focusedCellBackgroundColor = theme.getColor(exports.focusedCellBackground);
        if (focusedCellBackgroundColor) {
            collector.addRule(`.notebookOverlay .code-cell-row.focused .cell-focus-indicator { background-color: ${focusedCellBackgroundColor} !important; }`);
            collector.addRule(`.notebookOverlay .markdown-cell-row.focused { background-color: ${focusedCellBackgroundColor} !important; }`);
            collector.addRule(`.notebookOverlay .code-cell-row.focused .input-collapse-container { background-color: ${focusedCellBackgroundColor} !important; }`);
        }
        const selectedCellBackgroundColor = theme.getColor(exports.selectedCellBackground);
        if (exports.selectedCellBackground) {
            collector.addRule(`.notebookOverlay .monaco-list.selection-multiple .markdown-cell-row.selected { background-color: ${selectedCellBackgroundColor} !important; }`);
            collector.addRule(`.notebookOverlay .monaco-list.selection-multiple .code-cell-row.selected .cell-focus-indicator-top { background-color: ${selectedCellBackgroundColor} !important; }`);
            collector.addRule(`.notebookOverlay .monaco-list.selection-multiple .code-cell-row.selected .cell-focus-indicator-left { background-color: ${selectedCellBackgroundColor} !important; }`);
            collector.addRule(`.notebookOverlay .monaco-list.selection-multiple .code-cell-row.selected .cell-focus-indicator-right { background-color: ${selectedCellBackgroundColor} !important; }`);
            collector.addRule(`.notebookOverlay .monaco-list.selection-multiple .code-cell-row.selected .cell-focus-indicator-bottom { background-color: ${selectedCellBackgroundColor} !important; }`);
        }
        const inactiveSelectedCellBorderColor = theme.getColor(exports.inactiveSelectedCellBorder);
        collector.addRule(`
			.notebookOverlay .monaco-list.selection-multiple:focus-within .monaco-list-row.selected .cell-focus-indicator-top:before,
			.notebookOverlay .monaco-list.selection-multiple:focus-within .monaco-list-row.selected .cell-focus-indicator-bottom:before,
			.notebookOverlay .monaco-list.selection-multiple:focus-within .monaco-list-row.selected .cell-inner-container:not(.cell-editor-focus) .cell-focus-indicator-left:before,
			.notebookOverlay .monaco-list.selection-multiple:focus-within .monaco-list-row.selected .cell-inner-container:not(.cell-editor-focus) .cell-focus-indicator-right:before {
					border-color: ${inactiveSelectedCellBorderColor} !important;
			}
	`);
        const cellHoverBackgroundColor = theme.getColor(exports.cellHoverBackground);
        if (cellHoverBackgroundColor) {
            collector.addRule(`.notebookOverlay .code-cell-row:not(.focused):hover .cell-focus-indicator,
			.notebookOverlay .code-cell-row:not(.focused).cell-output-hover .cell-focus-indicator,
			.notebookOverlay .markdown-cell-row:not(.focused):hover { background-color: ${cellHoverBackgroundColor} !important; }`);
            collector.addRule(`.notebookOverlay .code-cell-row:not(.focused):hover .input-collapse-container,
			.notebookOverlay .code-cell-row:not(.focused).cell-output-hover .input-collapse-container { background-color: ${cellHoverBackgroundColor}; }`);
        }
        const cellSymbolHighlightColor = theme.getColor(exports.cellSymbolHighlight);
        if (cellSymbolHighlightColor) {
            collector.addRule(`.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.nb-symbolHighlight .cell-focus-indicator,
		.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.markdown-cell-row.nb-symbolHighlight {
			background-color: ${cellSymbolHighlightColor} !important;
		}`);
        }
        const focusedEditorBorderColorColor = theme.getColor(exports.focusedEditorBorderColor);
        if (focusedEditorBorderColorColor) {
            collector.addRule(`.notebookOverlay .monaco-list:focus-within .monaco-list-row.focused .cell-editor-focus .cell-editor-part:before { outline: solid 1px ${focusedEditorBorderColorColor}; }`);
        }
        const cellBorderColor = theme.getColor(exports.notebookCellBorder);
        if (cellBorderColor) {
            collector.addRule(`.notebookOverlay .cell.markdown h1 { border-color: ${cellBorderColor}; }`);
            collector.addRule(`.notebookOverlay .monaco-list-row .cell-editor-part:before { outline: solid 1px ${cellBorderColor}; }`);
        }
        const cellStatusBarHoverBg = theme.getColor(exports.cellStatusBarItemHover);
        if (cellStatusBarHoverBg) {
            collector.addRule(`.monaco-workbench .notebookOverlay .cell-statusbar-container .cell-language-picker:hover,
		.monaco-workbench .notebookOverlay .cell-statusbar-container .cell-status-item.cell-status-item-has-command:hover { background-color: ${cellStatusBarHoverBg}; }`);
        }
        const cellInsertionIndicatorColor = theme.getColor(exports.cellInsertionIndicator);
        if (cellInsertionIndicatorColor) {
            collector.addRule(`.notebookOverlay > .cell-list-container > .cell-list-insertion-indicator { background-color: ${cellInsertionIndicatorColor}; }`);
        }
        const scrollbarSliderBackgroundColor = theme.getColor(exports.listScrollbarSliderBackground);
        if (scrollbarSliderBackgroundColor) {
            collector.addRule(` .notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .scrollbar > .slider { background: ${scrollbarSliderBackgroundColor}; } `);
        }
        const scrollbarSliderHoverBackgroundColor = theme.getColor(exports.listScrollbarSliderHoverBackground);
        if (scrollbarSliderHoverBackgroundColor) {
            collector.addRule(` .notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .scrollbar > .slider:hover { background: ${scrollbarSliderHoverBackgroundColor}; } `);
        }
        const scrollbarSliderActiveBackgroundColor = theme.getColor(exports.listScrollbarSliderActiveBackground);
        if (scrollbarSliderActiveBackgroundColor) {
            collector.addRule(` .notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .scrollbar > .slider.active { background: ${scrollbarSliderActiveBackgroundColor}; } `);
        }
        const toolbarHoverBackgroundColor = theme.getColor(colorRegistry_1.toolbarHoverBackground);
        if (toolbarHoverBackgroundColor) {
            collector.addRule(`
		.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .expandInputIcon:hover,
		.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .expandOutputIcon:hover,
		.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-expand-part-button:hover {
			background-color: ${toolbarHoverBackgroundColor};
		}
	`);
        }
        // case ChangeType.Modify: return theme.getColor(editorGutterModifiedBackground);
        // case ChangeType.Add: return theme.getColor(editorGutterAddedBackground);
        // case ChangeType.Delete: return theme.getColor(editorGutterDeletedBackground);
        // diff
        const modifiedBackground = theme.getColor(dirtydiffDecorator_1.editorGutterModifiedBackground);
        if (modifiedBackground) {
            collector.addRule(`
		.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.nb-cell-modified .cell-focus-indicator {
			background-color: ${modifiedBackground} !important;
		}

		.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.markdown-cell-row.nb-cell-modified {
			background-color: ${modifiedBackground} !important;
		}`);
        }
        const addedBackground = theme.getColor(colorRegistry_1.diffInserted);
        if (addedBackground) {
            collector.addRule(`
		.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.nb-cell-added .cell-focus-indicator {
			background-color: ${addedBackground} !important;
		}

		.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.markdown-cell-row.nb-cell-added {
			background-color: ${addedBackground} !important;
		}`);
        }
        const deletedBackground = theme.getColor(colorRegistry_1.diffRemoved);
        if (deletedBackground) {
            collector.addRule(`
		.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.nb-cell-deleted .cell-focus-indicator {
			background-color: ${deletedBackground} !important;
		}

		.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.markdown-cell-row.nb-cell-deleted {
			background-color: ${deletedBackground} !important;
		}`);
        }
        const iconForegroundColor = theme.getColor(colorRegistry_1.iconForeground);
        if (iconForegroundColor) {
            collector.addRule(`.monaco-workbench .notebookOverlay .codicon-debug-continue { color: ${iconForegroundColor} !important; }`);
        }
    });
});
//# sourceMappingURL=notebookEditorWidget.js.map