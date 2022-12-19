/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/modesRegistry", "vs/base/common/lifecycle"], function (require, exports, assert, uri_1, textResourceEditorInput_1, workbenchTestServices_1, textfiles_1, modesRegistry_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextResourceEditorInput', () => {
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
        test('basics', async () => {
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, undefined);
            const model = await input.resolve();
            assert.ok(model);
            assert.strictEqual((0, textfiles_1.snapshotToString)((model.createSnapshot())), 'function test() {}');
        });
        test('preferred language (via ctor)', async () => {
            var _a, _b, _c;
            const registration = accessor.languageService.registerLanguage({
                id: 'resource-input-test',
            });
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', 'resource-input-test', undefined);
            const model = await input.resolve();
            assert.ok(model);
            assert.strictEqual((_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.getLanguageId(), 'resource-input-test');
            input.setLanguageId('text');
            assert.strictEqual((_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            await input.resolve();
            assert.strictEqual((_c = model.textEditorModel) === null || _c === void 0 ? void 0 : _c.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            registration.dispose();
        });
        test('preferred language (via setPreferredLanguageId)', async () => {
            var _a;
            const registration = accessor.languageService.registerLanguage({
                id: 'resource-input-test',
            });
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, undefined);
            input.setPreferredLanguageId('resource-input-test');
            const model = await input.resolve();
            assert.ok(model);
            assert.strictEqual((_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.getLanguageId(), 'resource-input-test');
            registration.dispose();
        });
        test('preferred contents (via ctor)', async () => {
            var _a, _b, _c;
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, 'My Resource Input Contents');
            const model = await input.resolve();
            assert.ok(model);
            assert.strictEqual((_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.getValue(), 'My Resource Input Contents');
            model.textEditorModel.setValue('Some other contents');
            assert.strictEqual((_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.getValue(), 'Some other contents');
            await input.resolve();
            assert.strictEqual((_c = model.textEditorModel) === null || _c === void 0 ? void 0 : _c.getValue(), 'Some other contents'); // preferred contents only used once
        });
        test('preferred contents (via setPreferredContents)', async () => {
            var _a, _b, _c;
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, undefined);
            input.setPreferredContents('My Resource Input Contents');
            const model = await input.resolve();
            assert.ok(model);
            assert.strictEqual((_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.getValue(), 'My Resource Input Contents');
            model.textEditorModel.setValue('Some other contents');
            assert.strictEqual((_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.getValue(), 'Some other contents');
            await input.resolve();
            assert.strictEqual((_c = model.textEditorModel) === null || _c === void 0 ? void 0 : _c.getValue(), 'Some other contents'); // preferred contents only used once
        });
    });
});
//# sourceMappingURL=textResourceEditorInput.test.js.map