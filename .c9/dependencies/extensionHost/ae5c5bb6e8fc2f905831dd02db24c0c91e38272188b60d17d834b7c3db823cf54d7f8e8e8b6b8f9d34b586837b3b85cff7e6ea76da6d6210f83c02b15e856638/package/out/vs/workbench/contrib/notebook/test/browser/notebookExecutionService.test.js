/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/common/languages/modesRegistry", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/browser/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, sinon, event_1, lifecycle_1, uri_1, mock_1, utils_1, modesRegistry_1, extensions_1, cellOperations_1, notebookExecutionServiceImpl_1, notebookKernelServiceImpl_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookExecutionService', () => {
        let instantiationService;
        let kernelService;
        let disposables;
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
            });
            kernelService = instantiationService.createInstance(notebookKernelServiceImpl_1.NotebookKernelService);
            instantiationService.set(notebookKernelService_1.INotebookKernelService, kernelService);
        });
        teardown(() => {
            disposables.dispose();
        });
        async function withTestNotebook(cells, callback) {
            return (0, testNotebookEditor_1.withTestNotebook)(cells, (editor, viewModel) => callback(viewModel, viewModel.notebookDocument));
        }
        // test('ctor', () => {
        // 	instantiationService.createInstance(NotebookEditorKernelManager, { activeKernel: undefined, viewModel: undefined });
        // 	const contextKeyService = instantiationService.get(IContextKeyService);
        // 	assert.strictEqual(contextKeyService.getContextKeyValue(NOTEBOOK_KERNEL_COUNT.key), 0);
        // });
        test('cell is not runnable when no kernel is selected', async () => {
            await withTestNotebook([], async (viewModel) => {
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 1, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await (0, utils_1.assertThrowsAsync)(async () => await executionService.executeNotebookCell(cell));
            });
        });
        test('cell is not runnable when kernel does not support the language', async () => {
            await withTestNotebook([], async (viewModel) => {
                kernelService.registerKernel(new TestNotebookKernel({ languages: ['testlang'] }));
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 1, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await (0, utils_1.assertThrowsAsync)(async () => await executionService.executeNotebookCell(cell));
            });
        });
        test('cell is runnable when kernel does support the language', async () => {
            await withTestNotebook([], async (viewModel) => {
                const kernel = new TestNotebookKernel({ languages: ['javascript'] });
                kernelService.registerKernel(kernel);
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const executeSpy = sinon.spy();
                kernel.executeNotebookCellsRequest = executeSpy;
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await executionService.executeNotebookCells(viewModel.notebookDocument, [cell]);
                assert.strictEqual(executeSpy.calledOnce, true);
            });
        });
        test('select kernel when running cell', async function () {
            // https://github.com/microsoft/vscode/issues/121904
            return withTestNotebook([], async (viewModel) => {
                assert.strictEqual(kernelService.getMatchingKernel(viewModel.notebookDocument).all.length, 0);
                let didExecute = false;
                const kernel = new class extends TestNotebookKernel {
                    constructor() {
                        super({ languages: ['javascript'] });
                        this.id = 'mySpecialId';
                    }
                    async executeNotebookCellsRequest() {
                        didExecute = true;
                        return;
                    }
                };
                kernelService.registerKernel(kernel);
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                let event;
                kernelService.onDidChangeSelectedNotebooks(e => event = e);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await executionService.executeNotebookCells(viewModel.notebookDocument, [cell]);
                assert.strictEqual(didExecute, true);
                assert.ok(event !== undefined);
                assert.strictEqual(event.newKernel, kernel.id);
                assert.strictEqual(event.oldKernel, undefined);
            });
        });
        test('Completes unconfirmed executions', async function () {
            return withTestNotebook([], async (viewModel) => {
                let didExecute = false;
                const kernel = new class extends TestNotebookKernel {
                    constructor() {
                        super({ languages: ['javascript'] });
                        this.id = 'mySpecialId';
                    }
                    async executeNotebookCellsRequest() {
                        didExecute = true;
                        return;
                    }
                };
                kernelService.registerKernel(kernel);
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const exeStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await executionService.executeNotebookCells(viewModel.notebookDocument, [cell]);
                assert.strictEqual(didExecute, true);
                assert.strictEqual(exeStateService.getCellExecution(cell.uri), undefined);
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
        }
        executeNotebookCellsRequest() {
            throw new Error('Method not implemented.');
        }
        cancelNotebookCellExecution() {
            throw new Error('Method not implemented.');
        }
    }
});
//# sourceMappingURL=notebookExecutionService.test.js.map