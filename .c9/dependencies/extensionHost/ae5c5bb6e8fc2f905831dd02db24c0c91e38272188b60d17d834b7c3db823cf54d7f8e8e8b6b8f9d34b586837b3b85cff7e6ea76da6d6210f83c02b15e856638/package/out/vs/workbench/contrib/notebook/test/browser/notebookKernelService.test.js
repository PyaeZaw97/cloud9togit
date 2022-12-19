/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/base/common/event", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/browser/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/test/common/mock", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/editor/common/languages/modesRegistry"], function (require, exports, assert, uri_1, extensions_1, testNotebookEditor_1, event_1, notebookKernelService_1, notebookKernelServiceImpl_1, notebookService_1, mock_1, lifecycle_1, notebookTextModel_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookKernelService', () => {
        let instantiationService;
        let kernelService;
        let disposables;
        let onDidAddNotebookDocument;
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            onDidAddNotebookDocument = new event_1.Emitter();
            disposables.add(onDidAddNotebookDocument);
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            instantiationService.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidAddNotebookDocument = onDidAddNotebookDocument.event;
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
        test('notebook priorities', function () {
            const u1 = uri_1.URI.parse('foo:///one');
            const u2 = uri_1.URI.parse('foo:///two');
            const k1 = new TestNotebookKernel({ label: 'z' });
            const k2 = new TestNotebookKernel({ label: 'a' });
            kernelService.registerKernel(k1);
            kernelService.registerKernel(k2);
            // equal priorities -> sort by name
            let info = kernelService.getMatchingKernel({ uri: u1, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
            // update priorities for u1 notebook
            kernelService.updateKernelNotebookAffinity(k2, u1, 2);
            kernelService.updateKernelNotebookAffinity(k2, u2, 1);
            // updated
            info = kernelService.getMatchingKernel({ uri: u1, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
            // NOT updated
            info = kernelService.getMatchingKernel({ uri: u2, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
            // reset
            kernelService.updateKernelNotebookAffinity(k2, u1, undefined);
            info = kernelService.getMatchingKernel({ uri: u1, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
        });
        test('new kernel with higher affinity wins, https://github.com/microsoft/vscode/issues/122028', function () {
            const notebook = uri_1.URI.parse('foo:///one');
            const kernel = new TestNotebookKernel();
            kernelService.registerKernel(kernel);
            let info = kernelService.getMatchingKernel({ uri: notebook, viewType: 'foo' });
            assert.strictEqual(info.all.length, 1);
            assert.ok(info.all[0] === kernel);
            const betterKernel = new TestNotebookKernel();
            kernelService.registerKernel(betterKernel);
            info = kernelService.getMatchingKernel({ uri: notebook, viewType: 'foo' });
            assert.strictEqual(info.all.length, 2);
            kernelService.updateKernelNotebookAffinity(betterKernel, notebook, 2);
            info = kernelService.getMatchingKernel({ uri: notebook, viewType: 'foo' });
            assert.strictEqual(info.all.length, 2);
            assert.ok(info.all[0] === betterKernel);
            assert.ok(info.all[1] === kernel);
        });
        test('onDidChangeSelectedNotebooks not fired on initial notebook open #121904', function () {
            const uri = uri_1.URI.parse('foo:///one');
            const jupyter = { uri, viewType: 'jupyter' };
            const dotnet = { uri, viewType: 'dotnet' };
            const jupyterKernel = new TestNotebookKernel({ viewType: jupyter.viewType });
            const dotnetKernel = new TestNotebookKernel({ viewType: dotnet.viewType });
            kernelService.registerKernel(jupyterKernel);
            kernelService.registerKernel(dotnetKernel);
            kernelService.selectKernelForNotebook(jupyterKernel, jupyter);
            kernelService.selectKernelForNotebook(dotnetKernel, dotnet);
            let info = kernelService.getMatchingKernel(dotnet);
            assert.strictEqual(info.selected === dotnetKernel, true);
            info = kernelService.getMatchingKernel(jupyter);
            assert.strictEqual(info.selected === jupyterKernel, true);
        });
        test('onDidChangeSelectedNotebooks not fired on initial notebook open #121904, p2', async function () {
            const uri = uri_1.URI.parse('foo:///one');
            const jupyter = { uri, viewType: 'jupyter' };
            const dotnet = { uri, viewType: 'dotnet' };
            const jupyterKernel = new TestNotebookKernel({ viewType: jupyter.viewType });
            const dotnetKernel = new TestNotebookKernel({ viewType: dotnet.viewType });
            kernelService.registerKernel(jupyterKernel);
            kernelService.registerKernel(dotnetKernel);
            kernelService.selectKernelForNotebook(jupyterKernel, jupyter);
            kernelService.selectKernelForNotebook(dotnetKernel, dotnet);
            {
                // open as jupyter -> bind event
                const p1 = event_1.Event.toPromise(kernelService.onDidChangeSelectedNotebooks);
                const d1 = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, jupyter.viewType, jupyter.uri, [], {}, {});
                onDidAddNotebookDocument.fire(d1);
                const event = await p1;
                assert.strictEqual(event.newKernel, jupyterKernel.id);
            }
            {
                // RE-open as dotnet -> bind event
                const p2 = event_1.Event.toPromise(kernelService.onDidChangeSelectedNotebooks);
                const d2 = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, dotnet.viewType, dotnet.uri, [], {}, {});
                onDidAddNotebookDocument.fire(d2);
                const event2 = await p2;
                assert.strictEqual(event2.newKernel, dotnetKernel.id);
            }
        });
    });
    class TestNotebookKernel {
        constructor(opts) {
            var _a, _b, _c;
            this.type = 0 /* NotebookKernelType.Resolved */;
            this.id = Math.random() + 'kernel';
            this.label = 'test-label';
            this.viewType = '*';
            this.onDidChange = event_1.Event.None;
            this.extension = new extensions_1.ExtensionIdentifier('test');
            this.localResourceRoot = uri_1.URI.file('/test');
            this.preloadUris = [];
            this.preloadProvides = [];
            this.supportedLanguages = [];
            this.supportedLanguages = (_a = opts === null || opts === void 0 ? void 0 : opts.languages) !== null && _a !== void 0 ? _a : [modesRegistry_1.PLAINTEXT_LANGUAGE_ID];
            this.label = (_b = opts === null || opts === void 0 ? void 0 : opts.label) !== null && _b !== void 0 ? _b : this.label;
            this.viewType = (_c = opts === null || opts === void 0 ? void 0 : opts.viewType) !== null && _c !== void 0 ? _c : this.viewType;
        }
        executeNotebookCellsRequest() {
            throw new Error('Method not implemented.');
        }
        cancelNotebookCellExecution() {
            throw new Error('Method not implemented.');
        }
    }
});
//# sourceMappingURL=notebookKernelService.test.js.map