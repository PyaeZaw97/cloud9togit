/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/languages/modesRegistry", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/browser/notebookExecutionStateServiceImpl", "vs/workbench/contrib/notebook/browser/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, async_1, event_1, lifecycle_1, uri_1, mock_1, modesRegistry_1, extensions_1, cellOperations_1, notebookExecutionServiceImpl_1, notebookExecutionStateServiceImpl_1, notebookKernelServiceImpl_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookExecutionStateService', () => {
        let instantiationService;
        let kernelService;
        let disposables;
        let testNotebookModel;
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            instantiationService.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidAddNotebookDocument = event_1.Event.None;
                    this.onWillRemoveNotebookDocument = event_1.Event.None;
                }
                getNotebookTextModels() { return []; }
                getNotebookTextModel(uri) {
                    return testNotebookModel;
                }
            });
            kernelService = instantiationService.createInstance(notebookKernelServiceImpl_1.NotebookKernelService);
            instantiationService.set(notebookKernelService_1.INotebookKernelService, kernelService);
            instantiationService.set(notebookExecutionService_1.INotebookExecutionService, instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService));
            instantiationService.set(notebookExecutionStateService_1.INotebookExecutionStateService, instantiationService.createInstance(notebookExecutionStateServiceImpl_1.NotebookExecutionStateService));
        });
        teardown(() => {
            disposables.dispose();
        });
        async function withTestNotebook(cells, callback) {
            return (0, testNotebookEditor_1.withTestNotebook)(cells, (editor, viewModel) => callback(viewModel, viewModel.notebookDocument));
        }
        test('cancel execution when cell is deleted', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                let didCancel = false;
                const kernel = new class extends TestNotebookKernel {
                    constructor() {
                        super({ languages: ['javascript'] });
                    }
                    async executeNotebookCellsRequest() { }
                    async cancelNotebookCellExecution() {
                        didCancel = true;
                    }
                };
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                executionStateService.createCellExecution(kernel.id, viewModel.uri, cell.handle);
                assert.strictEqual(didCancel, false);
                viewModel.notebookDocument.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, false);
                assert.strictEqual(didCancel, true);
            });
        });
        test('fires onDidChangeCellExecution when cell is completed while deleted', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const exe = executionStateService.createCellExecution(kernel.id, viewModel.uri, cell.handle);
                let didFire = false;
                disposables.add(executionStateService.onDidChangeCellExecution(e => {
                    didFire = !e.changed;
                }));
                viewModel.notebookDocument.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, false);
                exe.complete({});
                assert.strictEqual(didFire, true);
            });
        });
        // #142466
        test('getCellExecution and onDidChangeCellExecution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const deferred = new async_1.DeferredPromise();
                disposables.add(executionStateService.onDidChangeCellExecution(e => {
                    var _a, _b;
                    const cellUri = notebookCommon_1.CellUri.generate(e.notebook, e.cellHandle);
                    const exe = executionStateService.getCellExecution(cellUri);
                    assert.ok(exe);
                    assert.strictEqual(e.notebook.toString(), exe.notebook.toString());
                    assert.strictEqual(e.cellHandle, exe.cellHandle);
                    assert.strictEqual(exe.notebook.toString(), (_a = e.changed) === null || _a === void 0 ? void 0 : _a.notebook.toString());
                    assert.strictEqual(exe.cellHandle, (_b = e.changed) === null || _b === void 0 ? void 0 : _b.cellHandle);
                    deferred.complete();
                }));
                executionStateService.createCellExecution(kernel.id, viewModel.uri, cell.handle);
                return deferred.p;
            });
        });
        test('force-cancel works', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                executionStateService.createCellExecution(kernel.id, viewModel.uri, cell.handle);
                const exe = executionStateService.getCellExecution(cell.uri);
                assert.ok(exe);
                executionStateService.forceCancelNotebookExecutions(viewModel.uri);
                const exe2 = executionStateService.getCellExecution(cell.uri);
                assert.strictEqual(exe2, undefined);
            });
        });
    });
    class TestNotebookKernel {
        constructor(opts) {
            var _a;
            this.type = 0 /* NotebookKernelType.Resolved */;
            this.id = 'test';
            this.label = '';
            this.viewType = '*';
            this.onDidChange = event_1.Event.None;
            this.extension = new extensions_1.ExtensionIdentifier('test');
            this.localResourceRoot = uri_1.URI.file('/test');
            this.preloadUris = [];
            this.preloadProvides = [];
            this.supportedLanguages = [];
            this.supportedLanguages = (_a = opts === null || opts === void 0 ? void 0 : opts.languages) !== null && _a !== void 0 ? _a : [modesRegistry_1.PLAINTEXT_LANGUAGE_ID];
            if (opts === null || opts === void 0 ? void 0 : opts.id) {
                this.id = opts === null || opts === void 0 ? void 0 : opts.id;
            }
        }
        async executeNotebookCellsRequest() { }
        async cancelNotebookCellExecution() { }
    }
});
//# sourceMappingURL=notebookExecutionStateService.test.js.map