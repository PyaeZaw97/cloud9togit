/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language", "vs/editor/common/services/languageService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/layout/browser/layoutService", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModelImpl", "vs/workbench/contrib/notebook/browser/viewModel/viewContext", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookOptions", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/map", "vs/platform/clipboard/test/common/testClipboardService"], function (require, exports, DOM, buffer_1, errors_1, event_1, lifecycle_1, mime_1, uri_1, mock_1, languageConfigurationRegistry_1, language_1, languageService_1, model_1, modelService_1, resolverService_1, testLanguageConfigurationService_1, clipboardService_1, configuration_1, testConfigurationService_1, contextKeyService_1, contextkey_1, instantiationServiceMock_1, layoutService_1, listService_1, log_1, storage_1, themeService_1, testThemeService_1, undoRedo_1, undoRedoService_1, workspaceTrust_1, editorModel_1, notebookCellList_1, eventDispatcher_1, notebookViewModelImpl_1, viewContext_1, notebookCellTextModel_1, notebookTextModel_1, notebookCommon_1, notebookExecutionStateService_1, notebookOptions_1, textModelResolverService_1, testWorkspaceTrustService_1, workbenchTestServices_1, workbenchTestServices_2, map_1, testClipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.valueBytesFromString = exports.createNotebookCellList = exports.withTestNotebook = exports.withTestNotebookDiffModel = exports.createTestNotebookEditor = exports.setupInstantiationService = exports.NotebookEditorTestModel = exports.TestCell = void 0;
    class TestCell extends notebookCellTextModel_1.NotebookCellTextModel {
        constructor(viewType, handle, source, language, cellKind, outputs, languageService) {
            super(notebookCommon_1.CellUri.generate(uri_1.URI.parse('test:///fake/notebook'), handle), handle, source, language, mime_1.Mimes.text, cellKind, outputs, undefined, undefined, undefined, { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false }, languageService);
            this.viewType = viewType;
            this.source = source;
        }
    }
    exports.TestCell = TestCell;
    class NotebookEditorTestModel extends editorModel_1.EditorModel {
        constructor(_notebook) {
            super();
            this._notebook = _notebook;
            this._dirty = false;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this.onDidChangeOrphaned = event_1.Event.None;
            this.onDidChangeReadonly = event_1.Event.None;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            if (_notebook && _notebook.onDidChangeContent) {
                this._register(_notebook.onDidChangeContent(() => {
                    this._dirty = true;
                    this._onDidChangeDirty.fire();
                    this._onDidChangeContent.fire();
                }));
            }
        }
        get viewType() {
            return this._notebook.viewType;
        }
        get resource() {
            return this._notebook.uri;
        }
        get notebook() {
            return this._notebook;
        }
        isReadonly() {
            return false;
        }
        isOrphaned() {
            return false;
        }
        hasAssociatedFilePath() {
            return false;
        }
        isDirty() {
            return this._dirty;
        }
        getNotebook() {
            return this._notebook;
        }
        async load() {
            return this;
        }
        async save() {
            if (this._notebook) {
                this._dirty = false;
                this._onDidChangeDirty.fire();
                this._onDidSave.fire({});
                // todo, flush all states
                return true;
            }
            return false;
        }
        saveAs() {
            throw new errors_1.NotImplementedError();
        }
        revert() {
            throw new errors_1.NotImplementedError();
        }
    }
    exports.NotebookEditorTestModel = NotebookEditorTestModel;
    function setupInstantiationService(disposables = new lifecycle_1.DisposableStore()) {
        const instantiationService = new instantiationServiceMock_1.TestInstantiationService();
        instantiationService.stub(language_1.ILanguageService, disposables.add(new languageService_1.LanguageService()));
        instantiationService.stub(undoRedo_1.IUndoRedoService, instantiationService.createInstance(undoRedoService_1.UndoRedoService));
        instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
        instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
        instantiationService.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, new testLanguageConfigurationService_1.TestLanguageConfigurationService());
        instantiationService.stub(model_1.IModelService, instantiationService.createInstance(modelService_1.ModelService));
        instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
        instantiationService.stub(contextkey_1.IContextKeyService, instantiationService.createInstance(contextKeyService_1.ContextKeyService));
        instantiationService.stub(listService_1.IListService, instantiationService.createInstance(listService_1.ListService));
        instantiationService.stub(layoutService_1.ILayoutService, new workbenchTestServices_1.TestLayoutService());
        instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        instantiationService.stub(clipboardService_1.IClipboardService, testClipboardService_1.TestClipboardService);
        instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_2.TestStorageService());
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, new testWorkspaceTrustService_1.TestWorkspaceTrustRequestService(true));
        instantiationService.stub(notebookExecutionStateService_1.INotebookExecutionStateService, new TestNotebookExecutionStateService());
        return instantiationService;
    }
    exports.setupInstantiationService = setupInstantiationService;
    function _createTestNotebookEditor(instantiationService, cells) {
        const viewType = 'notebook';
        const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, viewType, uri_1.URI.parse('test'), cells.map(cell => {
            var _a;
            return {
                source: cell[0],
                language: cell[1],
                cellKind: cell[2],
                outputs: (_a = cell[3]) !== null && _a !== void 0 ? _a : [],
                metadata: cell[4]
            };
        }), {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false });
        const model = new NotebookEditorTestModel(notebook);
        const notebookOptions = new notebookOptions_1.NotebookOptions(instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService));
        const viewContext = new viewContext_1.ViewContext(notebookOptions, new eventDispatcher_1.NotebookEventDispatcher());
        const viewModel = instantiationService.createInstance(notebookViewModelImpl_1.NotebookViewModel, viewType, model.notebook, viewContext, null, { isReadOnly: false });
        const cellList = createNotebookCellList(instantiationService, viewContext);
        cellList.attachViewModel(viewModel);
        const listViewInfoAccessor = new notebookCellList_1.ListViewInfoAccessor(cellList);
        const notebookEditor = new class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.notebookOptions = notebookOptions;
                this.onDidChangeModel = new event_1.Emitter().event;
                this.textModel = viewModel.notebookDocument;
            }
            dispose() {
                viewModel.dispose();
            }
            _getViewModel() {
                return viewModel;
            }
            hasModel() {
                return !!viewModel;
            }
            getLength() { return viewModel.length; }
            getFocus() { return viewModel.getFocus(); }
            getSelections() { return viewModel.getSelections(); }
            setFocus(focus) {
                viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: focus,
                    selections: viewModel.getSelections()
                });
            }
            setSelections(selections) {
                viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: viewModel.getFocus(),
                    selections: selections
                });
            }
            getViewIndexByModelIndex(index) { return listViewInfoAccessor.getViewIndex(viewModel.viewCells[index]); }
            getCellRangeFromViewRange(startIndex, endIndex) { return listViewInfoAccessor.getCellRangeFromViewRange(startIndex, endIndex); }
            revealCellRangeInView() { }
            setHiddenAreas(_ranges) {
                return cellList.setHiddenAreas(_ranges, true);
            }
            getActiveCell() {
                const elements = cellList.getFocusedElements();
                if (elements && elements.length) {
                    return elements[0];
                }
                return undefined;
            }
            hasOutputTextSelection() {
                return false;
            }
            changeModelDecorations() { return null; }
            focusElement() { }
            setCellEditorSelection() { }
            async revealRangeInCenterIfOutsideViewportAsync() { }
            async layoutNotebookCell() { }
            async removeInset() { }
            async focusNotebookCell() { }
            cellAt(index) { return viewModel.cellAt(index); }
            getCellIndex(cell) { return viewModel.getCellIndex(cell); }
            getCellsInRange(range) { return viewModel.getCellsInRange(range); }
            getNextVisibleCellIndex(index) { return viewModel.getNextVisibleCellIndex(index); }
            getControl() { return this; }
            get onDidChangeSelection() { return viewModel.onDidChangeSelection; }
            get onDidChangeOptions() { return viewModel.onDidChangeOptions; }
            get onDidChangeViewCells() { return viewModel.onDidChangeViewCells; }
            async find(query, options) {
                const findMatches = viewModel.find(query, options).filter(match => match.matches.length > 0);
                return findMatches;
            }
            deltaCellDecorations() { return []; }
        };
        return { editor: notebookEditor, viewModel };
    }
    function createTestNotebookEditor(instantiationService, cells) {
        return _createTestNotebookEditor(instantiationService, cells);
    }
    exports.createTestNotebookEditor = createTestNotebookEditor;
    async function withTestNotebookDiffModel(originalCells, modifiedCells, callback) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = setupInstantiationService(disposables);
        const originalNotebook = createTestNotebookEditor(instantiationService, originalCells);
        const modifiedNotebook = createTestNotebookEditor(instantiationService, modifiedCells);
        const originalResource = new class extends (0, mock_1.mock)() {
            get notebook() {
                return originalNotebook.viewModel.notebookDocument;
            }
        };
        const modifiedResource = new class extends (0, mock_1.mock)() {
            get notebook() {
                return modifiedNotebook.viewModel.notebookDocument;
            }
        };
        const model = new class extends (0, mock_1.mock)() {
            get original() {
                return originalResource;
            }
            get modified() {
                return modifiedResource;
            }
        };
        const res = await callback(model, instantiationService);
        if (res instanceof Promise) {
            res.finally(() => {
                originalNotebook.editor.dispose();
                originalNotebook.viewModel.dispose();
                modifiedNotebook.editor.dispose();
                modifiedNotebook.viewModel.dispose();
                disposables.dispose();
            });
        }
        else {
            originalNotebook.editor.dispose();
            originalNotebook.viewModel.dispose();
            modifiedNotebook.editor.dispose();
            modifiedNotebook.viewModel.dispose();
            disposables.dispose();
        }
        return res;
    }
    exports.withTestNotebookDiffModel = withTestNotebookDiffModel;
    async function withTestNotebook(cells, callback, accessor) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = accessor !== null && accessor !== void 0 ? accessor : setupInstantiationService(disposables);
        const notebookEditor = _createTestNotebookEditor(instantiationService, cells);
        const res = await callback(notebookEditor.editor, notebookEditor.viewModel, instantiationService);
        if (res instanceof Promise) {
            res.finally(() => {
                notebookEditor.editor.dispose();
                notebookEditor.viewModel.dispose();
                disposables.dispose();
            });
        }
        else {
            notebookEditor.editor.dispose();
            notebookEditor.viewModel.dispose();
            disposables.dispose();
        }
        return res;
    }
    exports.withTestNotebook = withTestNotebook;
    function createNotebookCellList(instantiationService, viewContext) {
        const delegate = {
            getHeight(element) { return element.getHeight(17); },
            getTemplateId() { return 'template'; }
        };
        const renderer = {
            templateId: 'template',
            renderTemplate() { },
            renderElement() { },
            disposeTemplate() { }
        };
        const cellList = instantiationService.createInstance(notebookCellList_1.NotebookCellList, 'NotebookCellList', DOM.$('container'), DOM.$('body'), viewContext !== null && viewContext !== void 0 ? viewContext : new viewContext_1.ViewContext(new notebookOptions_1.NotebookOptions(instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService)), new eventDispatcher_1.NotebookEventDispatcher()), delegate, [renderer], instantiationService.get(contextkey_1.IContextKeyService), {
            supportDynamicHeights: true,
            multipleSelectionSupport: true,
            enableKeyboardNavigation: true,
            focusNextPreviousDelegate: {
                onFocusNext: (applyFocusNext) => { applyFocusNext(); },
                onFocusPrevious: (applyFocusPrevious) => { applyFocusPrevious(); },
            }
        });
        return cellList;
    }
    exports.createNotebookCellList = createNotebookCellList;
    function valueBytesFromString(value) {
        return buffer_1.VSBuffer.fromString(value);
    }
    exports.valueBytesFromString = valueBytesFromString;
    class TestCellExecution {
        constructor(notebook, cellHandle, onComplete) {
            this.notebook = notebook;
            this.cellHandle = cellHandle;
            this.onComplete = onComplete;
            this.state = notebookCommon_1.NotebookCellExecutionState.Unconfirmed;
            this.didPause = false;
            this.isPaused = false;
        }
        confirm() {
        }
        update(updates) {
        }
        complete(complete) {
            this.onComplete();
        }
    }
    class TestNotebookExecutionStateService {
        constructor() {
            this._executions = new map_1.ResourceMap();
            this.onDidChangeCellExecution = new event_1.Emitter().event;
        }
        forceCancelNotebookExecutions(notebookUri) {
        }
        getCellExecutionStatesForNotebook(notebook) {
            return [];
        }
        getCellExecution(cellUri) {
            return this._executions.get(cellUri);
        }
        createCellExecution(controllerId, notebook, cellHandle) {
            const onComplete = () => this._executions.delete(notebookCommon_1.CellUri.generate(notebook, cellHandle));
            const exe = new TestCellExecution(notebook, cellHandle, onComplete);
            this._executions.set(notebookCommon_1.CellUri.generate(notebook, cellHandle), exe);
            return exe;
        }
    }
});
//# sourceMappingURL=testNotebookEditor.js.map