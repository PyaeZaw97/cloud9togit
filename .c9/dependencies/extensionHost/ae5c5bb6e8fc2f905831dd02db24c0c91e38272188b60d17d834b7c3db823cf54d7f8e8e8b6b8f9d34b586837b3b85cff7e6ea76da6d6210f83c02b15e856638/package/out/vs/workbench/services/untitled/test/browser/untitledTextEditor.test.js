/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/modesRegistry", "vs/editor/common/core/range", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/buffer"], function (require, exports, assert, uri_1, path_1, workbenchTestServices_1, textfiles_1, modesRegistry_1, range_1, untitledTextEditorInput_1, cancellation_1, lifecycle_1, stream_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Untitled text editors', () => {
        let disposables;
        let instantiationService;
        let accessor;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            accessor.untitledTextEditorService.dispose();
            disposables.dispose();
        });
        test('basics', async () => {
            var _a, _b;
            const service = accessor.untitledTextEditorService;
            const workingCopyService = accessor.workingCopyService;
            const input1 = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            await input1.resolve();
            assert.strictEqual(service.get(input1.resource), input1.model);
            assert.ok(service.get(input1.resource));
            assert.ok(!service.get(uri_1.URI.file('testing')));
            assert.ok(input1.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(!input1.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(!input1.hasCapability(8 /* EditorInputCapabilities.Singleton */));
            assert.ok(!input1.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */));
            const input2 = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            assert.strictEqual(service.get(input2.resource), input2.model);
            // toUntyped()
            const untypedInput = input1.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(untypedInput.forceUntitled, true);
            // get()
            assert.strictEqual(service.get(input1.resource), input1.model);
            assert.strictEqual(service.get(input2.resource), input2.model);
            // revert()
            await input1.revert(0);
            assert.ok(input1.isDisposed());
            assert.ok(!service.get(input1.resource));
            // dirty
            const model = await input2.resolve();
            assert.strictEqual(await service.resolve({ untitledResource: input2.resource }), model);
            assert.ok(service.get(model.resource));
            assert.ok(!input2.isDirty());
            const resourcePromise = awaitDidChangeDirty(accessor.untitledTextEditorService);
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo bar');
            const resource = await resourcePromise;
            assert.strictEqual(resource.toString(), input2.resource.toString());
            assert.ok(input2.isDirty());
            const dirtyUntypedInput = input2.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(dirtyUntypedInput.contents, 'foo bar');
            assert.strictEqual(dirtyUntypedInput.resource, undefined);
            const dirtyUntypedInputWithoutContent = input2.toUntyped();
            assert.strictEqual((_b = dirtyUntypedInputWithoutContent.resource) === null || _b === void 0 ? void 0 : _b.toString(), input2.resource.toString());
            assert.strictEqual(dirtyUntypedInputWithoutContent.contents, undefined);
            assert.ok(workingCopyService.isDirty(input2.resource));
            assert.strictEqual(workingCopyService.dirtyCount, 1);
            await input1.revert(0);
            await input2.revert(0);
            assert.ok(!service.get(input1.resource));
            assert.ok(!service.get(input2.resource));
            assert.ok(!input2.isDirty());
            assert.ok(!model.isDirty());
            assert.ok(!workingCopyService.isDirty(input2.resource));
            assert.strictEqual(workingCopyService.dirtyCount, 0);
            await input1.revert(0);
            assert.ok(input1.isDisposed());
            assert.ok(!service.get(input1.resource));
            input2.dispose();
            assert.ok(!service.get(input2.resource));
        });
        function awaitDidChangeDirty(service) {
            return new Promise(resolve => {
                const listener = service.onDidChangeDirty(async (model) => {
                    listener.dispose();
                    resolve(model.resource);
                });
            });
        }
        test('associated resource is dirty', async () => {
            const service = accessor.untitledTextEditorService;
            const file = uri_1.URI.file((0, path_1.join)('C:\\', '/foo/file.txt'));
            let onDidChangeDirtyModel = undefined;
            const listener = service.onDidChangeDirty(model => {
                onDidChangeDirtyModel = model;
            });
            const model = service.create({ associatedResource: file });
            const untitled = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, model);
            assert.ok(untitled.isDirty());
            assert.strictEqual(model, onDidChangeDirtyModel);
            const resolvedModel = await untitled.resolve();
            assert.ok(resolvedModel.hasAssociatedFilePath);
            assert.strictEqual(untitled.isDirty(), true);
            untitled.dispose();
            listener.dispose();
        });
        test('no longer dirty when content gets empty (not with associated resource)', async () => {
            var _a, _b;
            const service = accessor.untitledTextEditorService;
            const workingCopyService = accessor.workingCopyService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            // dirty
            const model = await input.resolve();
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo bar');
            assert.ok(model.isDirty());
            assert.ok(workingCopyService.isDirty(model.resource, model.typeId));
            (_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.setValue('');
            assert.ok(!model.isDirty());
            assert.ok(!workingCopyService.isDirty(model.resource, model.typeId));
            input.dispose();
            model.dispose();
        });
        test('via create options', async () => {
            const service = accessor.untitledTextEditorService;
            const model1 = await instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()).resolve();
            model1.textEditorModel.setValue('foo bar');
            assert.ok(model1.isDirty());
            model1.textEditorModel.setValue('');
            assert.ok(!model1.isDirty());
            const model2 = await instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ initialValue: 'Hello World' })).resolve();
            assert.strictEqual((0, textfiles_1.snapshotToString)(model2.createSnapshot()), 'Hello World');
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            const model3 = await instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ untitledResource: input.resource })).resolve();
            assert.strictEqual(model3.resource.toString(), input.resource.toString());
            const file = uri_1.URI.file((0, path_1.join)('C:\\', '/foo/file44.txt'));
            const model4 = await instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ associatedResource: file })).resolve();
            assert.ok(model4.hasAssociatedFilePath);
            assert.ok(model4.isDirty());
            model1.dispose();
            model2.dispose();
            model3.dispose();
            model4.dispose();
            input.dispose();
        });
        test('associated path remains dirty when content gets empty', async () => {
            var _a, _b;
            const service = accessor.untitledTextEditorService;
            const file = uri_1.URI.file((0, path_1.join)('C:\\', '/foo/file.txt'));
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ associatedResource: file }));
            // dirty
            const model = await input.resolve();
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo bar');
            assert.ok(model.isDirty());
            (_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.setValue('');
            assert.ok(model.isDirty());
            input.dispose();
            model.dispose();
        });
        test('initial content is dirty', async () => {
            const service = accessor.untitledTextEditorService;
            const workingCopyService = accessor.workingCopyService;
            const untitled = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ initialValue: 'Hello World' }));
            assert.ok(untitled.isDirty());
            const backup = (await untitled.model.backup(cancellation_1.CancellationToken.None)).content;
            if ((0, stream_1.isReadableStream)(backup)) {
                const value = await (0, buffer_1.streamToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello World');
            }
            else if ((0, stream_1.isReadable)(backup)) {
                const value = (0, buffer_1.readableToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello World');
            }
            else {
                assert.fail('Missing untitled backup');
            }
            // dirty
            const model = await untitled.resolve();
            assert.ok(model.isDirty());
            assert.strictEqual(workingCopyService.dirtyCount, 1);
            untitled.dispose();
            model.dispose();
        });
        test('created with files.defaultLanguage setting', () => {
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledTextEditorService;
            const input = service.create();
            assert.strictEqual(input.getLanguageId(), defaultLanguage);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            input.dispose();
        });
        test('created with files.defaultLanguage setting (${activeEditorLanguage})', async () => {
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': '${activeEditorLanguage}' });
            accessor.editorService.activeTextEditorLanguageId = 'typescript';
            const service = accessor.untitledTextEditorService;
            const model = service.create();
            assert.strictEqual(model.getLanguageId(), 'typescript');
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            accessor.editorService.activeTextEditorLanguageId = undefined;
            model.dispose();
        });
        test('created with language overrides files.defaultLanguage setting', () => {
            const language = 'typescript';
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledTextEditorService;
            const input = service.create({ languageId: language });
            assert.strictEqual(input.getLanguageId(), language);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            input.dispose();
        });
        test('can change language afterwards', async () => {
            const languageId = 'untitled-input-test';
            const registration = accessor.languageService.registerLanguage({
                id: languageId,
            });
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ languageId: languageId }));
            assert.strictEqual(input.getLanguageId(), languageId);
            const model = await input.resolve();
            assert.strictEqual(model.getLanguageId(), languageId);
            input.setLanguageId(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            assert.strictEqual(input.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            input.dispose();
            model.dispose();
            registration.dispose();
        });
        test('remembers that language was set explicitly', async () => {
            const language = 'untitled-input-test';
            const registration = accessor.languageService.registerLanguage({
                id: language,
            });
            const service = accessor.untitledTextEditorService;
            const model = service.create();
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, model);
            assert.ok(!input.model.hasLanguageSetExplicitly);
            input.setLanguageId(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            assert.ok(input.model.hasLanguageSetExplicitly);
            assert.strictEqual(input.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            input.dispose();
            model.dispose();
            registration.dispose();
        });
        test('service#onDidChangeEncoding', async () => {
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            service.onDidChangeEncoding(model => {
                counter++;
                assert.strictEqual(model.resource.toString(), input.resource.toString());
            });
            // encoding
            const model = await input.resolve();
            await model.setEncoding('utf16');
            assert.strictEqual(counter, 1);
            input.dispose();
            model.dispose();
        });
        test('service#onDidChangeLabel', async () => {
            var _a;
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            service.onDidChangeLabel(model => {
                counter++;
                assert.strictEqual(model.resource.toString(), input.resource.toString());
            });
            // label
            const model = await input.resolve();
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('Foo Bar');
            assert.strictEqual(counter, 1);
            input.dispose();
            model.dispose();
        });
        test('service#onWillDispose', async () => {
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            service.onWillDispose(model => {
                counter++;
                assert.strictEqual(model.resource.toString(), input.resource.toString());
            });
            const model = await input.resolve();
            assert.strictEqual(counter, 0);
            model.dispose();
            assert.strictEqual(counter, 1);
        });
        test('service#getValue', async () => {
            // This function is used for the untitledocumentData API
            const service = accessor.untitledTextEditorService;
            const model1 = await instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()).resolve();
            model1.textEditorModel.setValue('foo bar');
            assert.strictEqual(service.getValue(model1.resource), 'foo bar');
            model1.dispose();
            // When a model doesn't exist, it should return undefined
            assert.strictEqual(service.getValue(uri_1.URI.parse('https://www.microsoft.com')), undefined);
        });
        test('model#onDidChangeContent', async function () {
            var _a, _b, _c, _d;
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            const model = await input.resolve();
            model.onDidChangeContent(() => counter++);
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(counter, 1, 'Dirty model should trigger event');
            (_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.setValue('bar');
            assert.strictEqual(counter, 2, 'Content change when dirty should trigger event');
            (_c = model.textEditorModel) === null || _c === void 0 ? void 0 : _c.setValue('');
            assert.strictEqual(counter, 3, 'Manual revert should trigger event');
            (_d = model.textEditorModel) === null || _d === void 0 ? void 0 : _d.setValue('foo');
            assert.strictEqual(counter, 4, 'Dirty model should trigger event');
            input.dispose();
            model.dispose();
        });
        test('model#onDidRevert and input disposed when reverted', async function () {
            var _a;
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            const model = await input.resolve();
            model.onDidRevert(() => counter++);
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            await model.revert();
            assert.ok(input.isDisposed());
            assert.ok(counter === 1);
        });
        test('model#onDidChangeName and input name', async function () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            let model = await input.resolve();
            model.onDidChangeName(() => counter++);
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(input.getName(), 'foo');
            assert.strictEqual(model.name, 'foo');
            assert.strictEqual(counter, 1);
            (_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.setValue('bar');
            assert.strictEqual(input.getName(), 'bar');
            assert.strictEqual(model.name, 'bar');
            assert.strictEqual(counter, 2);
            (_c = model.textEditorModel) === null || _c === void 0 ? void 0 : _c.setValue('');
            assert.strictEqual(input.getName(), 'Untitled-1');
            assert.strictEqual(model.name, 'Untitled-1');
            (_d = model.textEditorModel) === null || _d === void 0 ? void 0 : _d.setValue('        ');
            assert.strictEqual(input.getName(), 'Untitled-1');
            assert.strictEqual(model.name, 'Untitled-1');
            (_e = model.textEditorModel) === null || _e === void 0 ? void 0 : _e.setValue('([]}'); // require actual words
            assert.strictEqual(input.getName(), 'Untitled-1');
            assert.strictEqual(model.name, 'Untitled-1');
            (_f = model.textEditorModel) === null || _f === void 0 ? void 0 : _f.setValue('([]}hello   '); // require actual words
            assert.strictEqual(input.getName(), '([]}hello');
            assert.strictEqual(model.name, '([]}hello');
            (_g = model.textEditorModel) === null || _g === void 0 ? void 0 : _g.setValue('12345678901234567890123456789012345678901234567890'); // trimmed at 40chars max
            assert.strictEqual(input.getName(), '1234567890123456789012345678901234567890');
            assert.strictEqual(model.name, '1234567890123456789012345678901234567890');
            (_h = model.textEditorModel) === null || _h === void 0 ? void 0 : _h.setValue('123456789012345678901234567890123456789🌞'); // do not break grapehems (#111235)
            assert.strictEqual(input.getName(), '123456789012345678901234567890123456789');
            assert.strictEqual(model.name, '123456789012345678901234567890123456789');
            assert.strictEqual(counter, 6);
            (_j = model.textEditorModel) === null || _j === void 0 ? void 0 : _j.setValue('Hello\nWorld');
            assert.strictEqual(counter, 7);
            function createSingleEditOp(text, positionLineNumber, positionColumn, selectionLineNumber = positionLineNumber, selectionColumn = positionColumn) {
                let range = new range_1.Range(selectionLineNumber, selectionColumn, positionLineNumber, positionColumn);
                return {
                    range,
                    text,
                    forceMoveMarkers: false
                };
            }
            (_k = model.textEditorModel) === null || _k === void 0 ? void 0 : _k.applyEdits([createSingleEditOp('hello', 2, 2)]);
            assert.strictEqual(counter, 7); // change was not on first line
            input.dispose();
            model.dispose();
            const inputWithContents = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ initialValue: 'Foo' }));
            model = await inputWithContents.resolve();
            assert.strictEqual(inputWithContents.getName(), 'Foo');
            inputWithContents.dispose();
            model.dispose();
        });
        test('model#onDidChangeDirty', async function () {
            var _a, _b;
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            const model = await input.resolve();
            model.onDidChangeDirty(() => counter++);
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('foo');
            assert.strictEqual(counter, 1, 'Dirty model should trigger event');
            (_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.setValue('bar');
            assert.strictEqual(counter, 1, 'Another change does not fire event');
            input.dispose();
            model.dispose();
        });
        test('model#onDidChangeEncoding', async function () {
            const service = accessor.untitledTextEditorService;
            const input = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            let counter = 0;
            const model = await input.resolve();
            model.onDidChangeEncoding(() => counter++);
            await model.setEncoding('utf16');
            assert.strictEqual(counter, 1, 'Dirty model should trigger event');
            await model.setEncoding('utf16');
            assert.strictEqual(counter, 1, 'Another change to same encoding does not fire event');
            input.dispose();
            model.dispose();
        });
        test('backup and restore (simple)', async function () {
            return testBackupAndRestore('Some very small file text content.');
        });
        test('backup and restore (large, #121347)', async function () {
            const largeContent = '국어한\n'.repeat(100000);
            return testBackupAndRestore(largeContent);
        });
        async function testBackupAndRestore(content) {
            var _a, _b;
            const service = accessor.untitledTextEditorService;
            const originalInput = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            const restoredInput = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            const originalModel = await originalInput.resolve();
            (_a = originalModel.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue(content);
            const backup = await originalModel.backup(cancellation_1.CancellationToken.None);
            const modelRestoredIdentifier = { typeId: originalModel.typeId, resource: restoredInput.resource };
            await accessor.workingCopyBackupService.backup(modelRestoredIdentifier, backup.content);
            const restoredModel = await restoredInput.resolve();
            assert.strictEqual((_b = restoredModel.textEditorModel) === null || _b === void 0 ? void 0 : _b.getValue(), content);
            assert.strictEqual(restoredModel.isDirty(), true);
            originalInput.dispose();
            originalModel.dispose();
            restoredInput.dispose();
            restoredModel.dispose();
        }
    });
});
//# sourceMappingURL=untitledTextEditor.test.js.map