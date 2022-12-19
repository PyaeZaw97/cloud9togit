/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/files/common/files", "vs/base/test/common/utils", "vs/editor/common/languages/modesRegistry", "vs/editor/common/model/textModel", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, assert, uri_1, workbenchTestServices_1, textFileEditorModel_1, files_1, utils_1, modesRegistry_1, textModel_1, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - TextFileEditorModelManager', () => {
        let disposables;
        let instantiationService;
        let accessor;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('add, remove, clear, get, getAll', function () {
            const manager = accessor.textFileService.files;
            const model1 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random1.txt'), 'utf8', undefined);
            const model2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random2.txt'), 'utf8', undefined);
            const model3 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random3.txt'), 'utf8', undefined);
            manager.add(uri_1.URI.file('/test.html'), model1);
            manager.add(uri_1.URI.file('/some/other.html'), model2);
            manager.add(uri_1.URI.file('/some/this.txt'), model3);
            const fileUpper = uri_1.URI.file('/TEST.html');
            assert(!manager.get(uri_1.URI.file('foo')));
            assert.strictEqual(manager.get(uri_1.URI.file('/test.html')), model1);
            assert.ok(!manager.get(fileUpper));
            let results = manager.models;
            assert.strictEqual(3, results.length);
            let result = manager.get(uri_1.URI.file('/yes'));
            assert.ok(!result);
            result = manager.get(uri_1.URI.file('/some/other.txt'));
            assert.ok(!result);
            result = manager.get(uri_1.URI.file('/some/other.html'));
            assert.ok(result);
            result = manager.get(fileUpper);
            assert.ok(!result);
            manager.remove(uri_1.URI.file(''));
            results = manager.models;
            assert.strictEqual(3, results.length);
            manager.remove(uri_1.URI.file('/some/other.html'));
            results = manager.models;
            assert.strictEqual(2, results.length);
            manager.remove(fileUpper);
            results = manager.models;
            assert.strictEqual(2, results.length);
            manager.dispose();
            results = manager.models;
            assert.strictEqual(0, results.length);
            model1.dispose();
            model2.dispose();
            model3.dispose();
            manager.dispose();
        });
        test('resolve', async () => {
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/test.html');
            const encoding = 'utf8';
            const events = [];
            const listener = manager.onDidCreate(model => {
                events.push(model);
            });
            const modelPromise = manager.resolve(resource, { encoding });
            assert.ok(manager.get(resource)); // model known even before resolved()
            const model1 = await modelPromise;
            assert.ok(model1);
            assert.strictEqual(model1.getEncoding(), encoding);
            assert.strictEqual(manager.get(resource), model1);
            const model2 = await manager.resolve(resource, { encoding });
            assert.strictEqual(model2, model1);
            model1.dispose();
            const model3 = await manager.resolve(resource, { encoding });
            assert.notStrictEqual(model3, model2);
            assert.strictEqual(manager.get(resource), model3);
            model3.dispose();
            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[0].resource.toString(), model1.resource.toString());
            assert.strictEqual(events[1].resource.toString(), model2.resource.toString());
            listener.dispose();
            model1.dispose();
            model2.dispose();
            model3.dispose();
            manager.dispose();
        });
        test('resolve (async)', async () => {
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/path/index.txt');
            await manager.resolve(resource);
            let didResolve = false;
            let onDidResolve = new Promise(resolve => {
                manager.onDidResolve(({ model }) => {
                    if (model.resource.toString() === resource.toString()) {
                        didResolve = true;
                        resolve();
                    }
                });
            });
            manager.resolve(resource, { reload: { async: true } });
            await onDidResolve;
            assert.strictEqual(didResolve, true);
        });
        test('resolve (sync)', async () => {
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/path/index.txt');
            await manager.resolve(resource);
            let didResolve = false;
            manager.onDidResolve(({ model }) => {
                if (model.resource.toString() === resource.toString()) {
                    didResolve = true;
                }
            });
            await manager.resolve(resource, { reload: { async: false } });
            assert.strictEqual(didResolve, true);
        });
        test('resolve (sync) - model disposed when error and first call to resolve', async () => {
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/path/index.txt');
            accessor.textFileService.setReadStreamErrorOnce(new files_1.FileOperationError('fail', 11 /* FileOperationResult.FILE_OTHER_ERROR */));
            let error = undefined;
            try {
                await manager.resolve(resource);
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
            assert.strictEqual(manager.models.length, 0);
        });
        test('resolve (sync) - model not disposed when error and model existed before', async () => {
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/path/index.txt');
            await manager.resolve(resource);
            accessor.textFileService.setReadStreamErrorOnce(new files_1.FileOperationError('fail', 11 /* FileOperationResult.FILE_OTHER_ERROR */));
            let error = undefined;
            try {
                await manager.resolve(resource, { reload: { async: false } });
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
            assert.strictEqual(manager.models.length, 1);
        });
        test('resolve with initial contents', async () => {
            var _a, _b;
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/test.html');
            const model = await manager.resolve(resource, { contents: (0, textModel_1.createTextBufferFactory)('Hello World') });
            assert.strictEqual((_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.getValue(), 'Hello World');
            assert.strictEqual(model.isDirty(), true);
            await manager.resolve(resource, { contents: (0, textModel_1.createTextBufferFactory)('More Changes') });
            assert.strictEqual((_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.getValue(), 'More Changes');
            assert.strictEqual(model.isDirty(), true);
            model.dispose();
            manager.dispose();
        });
        test('multiple resolves execute in sequence', async () => {
            var _a;
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/test.html');
            let resolvedModel;
            const contents = [];
            manager.onDidResolve(e => {
                if (e.model.resource.toString() === resource.toString()) {
                    resolvedModel = e.model;
                    contents.push(e.model.textEditorModel.getValue());
                }
            });
            await Promise.all([
                manager.resolve(resource),
                manager.resolve(resource, { contents: (0, textModel_1.createTextBufferFactory)('Hello World') }),
                manager.resolve(resource, { reload: { async: false } }),
                manager.resolve(resource, { contents: (0, textModel_1.createTextBufferFactory)('More Changes') })
            ]);
            assert.ok(resolvedModel instanceof textFileEditorModel_1.TextFileEditorModel);
            assert.strictEqual((_a = resolvedModel.textEditorModel) === null || _a === void 0 ? void 0 : _a.getValue(), 'More Changes');
            assert.strictEqual(resolvedModel.isDirty(), true);
            assert.strictEqual(contents[0], 'Hello Html');
            assert.strictEqual(contents[1], 'Hello World');
            assert.strictEqual(contents[2], 'More Changes');
            resolvedModel.dispose();
            manager.dispose();
        });
        test('removed from cache when model disposed', function () {
            const manager = accessor.textFileService.files;
            const model1 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random1.txt'), 'utf8', undefined);
            const model2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random2.txt'), 'utf8', undefined);
            const model3 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random3.txt'), 'utf8', undefined);
            manager.add(uri_1.URI.file('/test.html'), model1);
            manager.add(uri_1.URI.file('/some/other.html'), model2);
            manager.add(uri_1.URI.file('/some/this.txt'), model3);
            assert.strictEqual(manager.get(uri_1.URI.file('/test.html')), model1);
            model1.dispose();
            assert(!manager.get(uri_1.URI.file('/test.html')));
            model2.dispose();
            model3.dispose();
            manager.dispose();
        });
        test('events', async function () {
            const manager = accessor.textFileService.files;
            const resource1 = utils_1.toResource.call(this, '/path/index.txt');
            const resource2 = utils_1.toResource.call(this, '/path/other.txt');
            let resolvedCounter = 0;
            let removedCounter = 0;
            let gotDirtyCounter = 0;
            let gotNonDirtyCounter = 0;
            let revertedCounter = 0;
            let savedCounter = 0;
            let encodingCounter = 0;
            manager.onDidResolve(({ model }) => {
                if (model.resource.toString() === resource1.toString()) {
                    resolvedCounter++;
                }
            });
            manager.onDidRemove(resource => {
                if (resource.toString() === resource1.toString() || resource.toString() === resource2.toString()) {
                    removedCounter++;
                }
            });
            manager.onDidChangeDirty(model => {
                if (model.resource.toString() === resource1.toString()) {
                    if (model.isDirty()) {
                        gotDirtyCounter++;
                    }
                    else {
                        gotNonDirtyCounter++;
                    }
                }
            });
            manager.onDidRevert(model => {
                if (model.resource.toString() === resource1.toString()) {
                    revertedCounter++;
                }
            });
            manager.onDidSave(({ model }) => {
                if (model.resource.toString() === resource1.toString()) {
                    savedCounter++;
                }
            });
            manager.onDidChangeEncoding(model => {
                if (model.resource.toString() === resource1.toString()) {
                    encodingCounter++;
                }
            });
            const model1 = await manager.resolve(resource1, { encoding: 'utf8' });
            assert.strictEqual(resolvedCounter, 1);
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource: resource1, type: 2 /* FileChangeType.DELETED */ }], false));
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource: resource1, type: 1 /* FileChangeType.ADDED */ }], false));
            const model2 = await manager.resolve(resource2, { encoding: 'utf8' });
            assert.strictEqual(resolvedCounter, 2);
            model1.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('changed'));
            model1.updatePreferredEncoding('utf16');
            await model1.revert();
            model1.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('changed again'));
            await model1.save();
            model1.dispose();
            model2.dispose();
            await model1.revert();
            assert.strictEqual(removedCounter, 2);
            assert.strictEqual(gotDirtyCounter, 2);
            assert.strictEqual(gotNonDirtyCounter, 2);
            assert.strictEqual(revertedCounter, 1);
            assert.strictEqual(savedCounter, 1);
            assert.strictEqual(encodingCounter, 2);
            model1.dispose();
            model2.dispose();
            assert.ok(!accessor.modelService.getModel(resource1));
            assert.ok(!accessor.modelService.getModel(resource2));
            manager.dispose();
        });
        test('disposing model takes it out of the manager', async function () {
            const manager = accessor.textFileService.files;
            const resource = utils_1.toResource.call(this, '/path/index_something.txt');
            const model = await manager.resolve(resource, { encoding: 'utf8' });
            model.dispose();
            assert.ok(!manager.get(resource));
            assert.ok(!accessor.modelService.getModel(model.resource));
            manager.dispose();
        });
        test('canDispose with dirty model', async function () {
            const manager = accessor.textFileService.files;
            const resource = utils_1.toResource.call(this, '/path/index_something.txt');
            const model = await manager.resolve(resource, { encoding: 'utf8' });
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('make dirty'));
            let canDisposePromise = manager.canDispose(model);
            assert.ok(canDisposePromise instanceof Promise);
            let canDispose = false;
            (async () => {
                canDispose = await canDisposePromise;
            })();
            assert.strictEqual(canDispose, false);
            model.revert({ soft: true });
            await (0, async_1.timeout)(0);
            assert.strictEqual(canDispose, true);
            let canDispose2 = manager.canDispose(model);
            assert.strictEqual(canDispose2, true);
            manager.dispose();
        });
        test('language', async function () {
            const languageId = 'text-file-model-manager-test';
            const registration = accessor.languageService.registerLanguage({
                id: languageId,
            });
            const manager = accessor.textFileService.files;
            const resource = utils_1.toResource.call(this, '/path/index_something.txt');
            let model = await manager.resolve(resource, { languageId: languageId });
            assert.strictEqual(model.textEditorModel.getLanguageId(), languageId);
            model = await manager.resolve(resource, { languageId: 'text' });
            assert.strictEqual(model.textEditorModel.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            model.dispose();
            manager.dispose();
            registration.dispose();
        });
        test('file change events trigger reload (on a resolved model)', async () => {
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/path/index.txt');
            await manager.resolve(resource);
            let didResolve = false;
            let onDidResolve = new Promise(resolve => {
                manager.onDidResolve(({ model }) => {
                    if (model.resource.toString() === resource.toString()) {
                        didResolve = true;
                        resolve();
                    }
                });
            });
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 0 /* FileChangeType.UPDATED */ }], false));
            await onDidResolve;
            assert.strictEqual(didResolve, true);
        });
        test('file change events trigger reload (after a model is resolved: https://github.com/microsoft/vscode/issues/132765)', async () => {
            const manager = accessor.textFileService.files;
            const resource = uri_1.URI.file('/path/index.txt');
            manager.resolve(resource);
            let didResolve = false;
            let resolvedCounter = 0;
            let onDidResolve = new Promise(resolve => {
                manager.onDidResolve(({ model }) => {
                    if (model.resource.toString() === resource.toString()) {
                        resolvedCounter++;
                        if (resolvedCounter === 2) {
                            didResolve = true;
                            resolve();
                        }
                    }
                });
            });
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 0 /* FileChangeType.UPDATED */ }], false));
            await onDidResolve;
            assert.strictEqual(didResolve, true);
        });
    });
});
//# sourceMappingURL=textFileEditorModelManager.test.js.map