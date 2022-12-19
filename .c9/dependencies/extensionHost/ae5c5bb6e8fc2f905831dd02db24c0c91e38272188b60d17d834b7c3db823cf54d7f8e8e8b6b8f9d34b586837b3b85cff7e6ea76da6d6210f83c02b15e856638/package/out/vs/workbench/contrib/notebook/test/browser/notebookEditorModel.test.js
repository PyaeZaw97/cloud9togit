/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/mock", "vs/platform/instantiation/common/instantiationService", "vs/platform/log/common/log", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/mime"], function (require, exports, assert, event_1, lifecycle_1, resources_1, uri_1, mock_1, instantiationService_1, log_1, notebookEditorModel_1, notebookTextModel_1, notebookCommon_1, testNotebookEditor_1, buffer_1, cancellation_1, mime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookFileWorkingCopyModel', function () {
        let disposables;
        let instantiationService;
        suiteSetup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
        });
        suiteTeardown(() => disposables.dispose());
        test('no transient output is send to serializer', function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', source: 'foo', outputs: [{ outputId: 'id', outputs: [{ mime: mime_1.Mimes.text, value: 'Hello Out' }] }] }], {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false });
            { // transient output
                let callCount = 0;
                const model = new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientCellMetadata: {}, transientDocumentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells.length, 1);
                        assert.strictEqual(notebook.cells[0].outputs.length, 0);
                        return buffer_1.VSBuffer.fromString('');
                    }
                });
                model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient output
                let callCount = 0;
                const model = new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells.length, 1);
                        assert.strictEqual(notebook.cells[0].outputs.length, 1);
                        return buffer_1.VSBuffer.fromString('');
                    }
                });
                model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
        test('no transient metadata is send to serializer', function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', source: 'foo', outputs: [] }], { foo: 123, bar: 456 }, { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false });
            { // transient
                let callCount = 0;
                const model = new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientCellMetadata: {}, transientDocumentMetadata: { bar: true } };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.metadata.foo, 123);
                        assert.strictEqual(notebook.metadata.bar, undefined);
                        return buffer_1.VSBuffer.fromString('');
                    }
                });
                model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient
                let callCount = 0;
                const model = new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.metadata.foo, 123);
                        assert.strictEqual(notebook.metadata.bar, 456);
                        return buffer_1.VSBuffer.fromString('');
                    }
                });
                model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
        test('no transient cell metadata is send to serializer', function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', source: 'foo', outputs: [], metadata: { foo: 123, bar: 456 } }], {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false });
            { // transient
                let callCount = 0;
                const model = new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: { bar: true } };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells[0].metadata.foo, 123);
                        assert.strictEqual(notebook.cells[0].metadata.bar, undefined);
                        return buffer_1.VSBuffer.fromString('');
                    }
                });
                model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient
                let callCount = 0;
                const model = new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells[0].metadata.foo, 123);
                        assert.strictEqual(notebook.cells[0].metadata.bar, 456);
                        return buffer_1.VSBuffer.fromString('');
                    }
                });
                model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
    });
    suite('ComplexNotebookEditorModel', function () {
        const instaService = new instantiationService_1.InstantiationService();
        const notebokService = new class extends (0, mock_1.mock)() {
        };
        const backupService = new class extends (0, mock_1.mock)() {
        };
        const notificationService = new class extends (0, mock_1.mock)() {
        };
        const untitledTextEditorService = new class extends (0, mock_1.mock)() {
        };
        const fileService = new class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.onDidFilesChange = event_1.Event.None;
            }
        };
        const labelService = new class extends (0, mock_1.mock)() {
            getUriBasenameLabel(uri) { return uri.toString(); }
        };
        const notebookDataProvider = new class extends (0, mock_1.mock)() {
        };
        test('working copy uri', function () {
            const r1 = uri_1.URI.parse('foo-files:///my.nb');
            const r2 = uri_1.URI.parse('bar-files:///my.nb');
            const copies = [];
            const workingCopyService = new class extends (0, mock_1.mock)() {
                registerWorkingCopy(copy) {
                    copies.push(copy);
                    return lifecycle_1.Disposable.None;
                }
            };
            new notebookEditorModel_1.ComplexNotebookEditorModel(r1, 'fff', notebookDataProvider, instaService, notebokService, workingCopyService, backupService, fileService, notificationService, new log_1.NullLogService(), untitledTextEditorService, labelService);
            new notebookEditorModel_1.ComplexNotebookEditorModel(r2, 'fff', notebookDataProvider, instaService, notebokService, workingCopyService, backupService, fileService, notificationService, new log_1.NullLogService(), untitledTextEditorService, labelService);
            assert.strictEqual(copies.length, 2);
            assert.strictEqual(!(0, resources_1.isEqual)(copies[0].resource, copies[1].resource), true);
        });
    });
});
//# sourceMappingURL=notebookEditorModel.test.js.map