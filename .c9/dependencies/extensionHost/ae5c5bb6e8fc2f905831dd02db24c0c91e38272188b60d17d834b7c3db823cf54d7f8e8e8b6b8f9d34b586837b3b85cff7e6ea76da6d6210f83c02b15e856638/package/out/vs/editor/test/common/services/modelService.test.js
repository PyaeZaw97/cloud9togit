/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/core/stringBuilder", "vs/editor/common/model/textModel", "vs/editor/common/services/modelService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/theme/test/common/testThemeService", "vs/platform/log/common/log", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/notification/test/common/testNotificationService", "vs/editor/test/common/testTextModel", "vs/base/common/lifecycle", "vs/base/common/cancellation", "vs/base/common/async", "vs/editor/common/services/languageService", "vs/platform/theme/common/theme", "vs/editor/common/services/model", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/common/services/getSemanticTokens", "vs/editor/common/services/languageFeatureDebounce", "vs/base/test/common/timeTravelScheduler", "vs/editor/common/services/languageFeaturesService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/configuration/common/configuration"], function (require, exports, assert, platform, uri_1, editOperation_1, range_1, selection_1, stringBuilder_1, textModel_1, modelService_1, testConfigurationService_1, testThemeService_1, log_1, undoRedoService_1, testDialogService_1, testNotificationService_1, testTextModel_1, lifecycle_1, cancellation_1, async_1, languageService_1, theme_1, model_1, testTextResourcePropertiesService_1, testLanguageConfigurationService_1, getSemanticTokens_1, languageFeatureDebounce_1, timeTravelScheduler_1, languageFeaturesService_1, serviceCollection_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    suite('ModelService', () => {
        let disposables;
        let modelService;
        let instantiationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'eol': '\n' });
            configService.setUserConfiguration('files', { 'eol': '\r\n' }, uri_1.URI.file(platform.isWindows ? 'c:\\myroot' : '/myroot'));
            const serviceCollection = new serviceCollection_1.ServiceCollection([
                configuration_1.IConfigurationService, configService
            ]);
            instantiationService = (0, testTextModel_1.createModelServices)(disposables, serviceCollection);
            modelService = instantiationService.get(model_1.IModelService);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('EOL setting respected depending on root', () => {
            const model1 = modelService.createModel('farboo', null);
            const model2 = modelService.createModel('farboo', null, uri_1.URI.file(platform.isWindows ? 'c:\\myroot\\myfile.txt' : '/myroot/myfile.txt'));
            const model3 = modelService.createModel('farboo', null, uri_1.URI.file(platform.isWindows ? 'c:\\other\\myfile.txt' : '/other/myfile.txt'));
            assert.strictEqual(model1.getOptions().defaultEOL, 1 /* DefaultEndOfLine.LF */);
            assert.strictEqual(model2.getOptions().defaultEOL, 2 /* DefaultEndOfLine.CRLF */);
            assert.strictEqual(model3.getOptions().defaultEOL, 1 /* DefaultEndOfLine.LF */);
        });
        test('_computeEdits no change', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = (0, textModel_1.createTextBuffer)([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.', //29
            ].join('\n'), 1 /* DefaultEndOfLine.LF */).textBuffer;
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, []);
        });
        test('_computeEdits first line changed', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = (0, textModel_1.createTextBuffer)([
                'This is line One',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.', //29
            ].join('\n'), 1 /* DefaultEndOfLine.LF */).textBuffer;
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 1, 2, 1), 'This is line One\n')
            ]);
        });
        test('_computeEdits EOL changed', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = (0, textModel_1.createTextBuffer)([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.', //29
            ].join('\r\n'), 1 /* DefaultEndOfLine.LF */).textBuffer;
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, []);
        });
        test('_computeEdits EOL and other change 1', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = (0, textModel_1.createTextBuffer)([
                'This is line One',
                'and this is line number two',
                'It is followed by #3',
                'and finished with the fourth.', //29
            ].join('\r\n'), 1 /* DefaultEndOfLine.LF */).textBuffer;
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 1, 4, 1), [
                    'This is line One',
                    'and this is line number two',
                    'It is followed by #3',
                    ''
                ].join('\r\n'))
            ]);
        });
        test('_computeEdits EOL and other change 2', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'package main',
                'func foo() {',
                '}' // 3
            ].join('\n')));
            const textBuffer = (0, textModel_1.createTextBuffer)([
                'package main',
                'func foo() {',
                '}',
                ''
            ].join('\r\n'), 1 /* DefaultEndOfLine.LF */).textBuffer;
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(3, 2, 3, 2), '\r\n')
            ]);
        });
        test('generated1', () => {
            const file1 = ['pram', 'okctibad', 'pjuwtemued', 'knnnm', 'u', ''];
            const file2 = ['tcnr', 'rxwlicro', 'vnzy', '', '', 'pjzcogzur', 'ptmxyp', 'dfyshia', 'pee', 'ygg'];
            assertComputeEdits(file1, file2);
        });
        test('generated2', () => {
            const file1 = ['', 'itls', 'hrilyhesv', ''];
            const file2 = ['vdl', '', 'tchgz', 'bhx', 'nyl'];
            assertComputeEdits(file1, file2);
        });
        test('generated3', () => {
            const file1 = ['ubrbrcv', 'wv', 'xodspybszt', 's', 'wednjxm', 'fklajt', 'fyfc', 'lvejgge', 'rtpjlodmmk', 'arivtgmjdm'];
            const file2 = ['s', 'qj', 'tu', 'ur', 'qerhjjhyvx', 't'];
            assertComputeEdits(file1, file2);
        });
        test('generated4', () => {
            const file1 = ['ig', 'kh', 'hxegci', 'smvker', 'pkdmjjdqnv', 'vgkkqqx', '', 'jrzeb'];
            const file2 = ['yk', ''];
            assertComputeEdits(file1, file2);
        });
        test('does insertions in the middle of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 2',
                'line 5',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insertions at the end of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 2',
                'line 3',
                'line 4'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insertions at the beginning of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 0',
                'line 1',
                'line 2',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does replacements', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 7',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does deletions', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insert, replace, and delete', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3',
                'line 4',
                'line 5',
            ];
            const file2 = [
                'line 0',
                'line 1',
                'replace line 2',
                'line 3',
                // delete line 4
                'line 5',
            ];
            assertComputeEdits(file1, file2);
        });
        test('maintains undo for same resource and same content', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            // create a model
            const model1 = modelService.createModel('text', null, resource);
            // make an edit
            model1.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model1.getValue(), 'text1');
            // dispose it
            modelService.destroyModel(resource);
            // create a new model with the same content
            const model2 = modelService.createModel('text1', null, resource);
            // undo
            model2.undo();
            assert.strictEqual(model2.getValue(), 'text');
            // dispose it
            modelService.destroyModel(resource);
        });
        test('maintains version id and alternative version id for same resource and same content', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            // create a model
            const model1 = modelService.createModel('text', null, resource);
            // make an edit
            model1.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model1.getValue(), 'text1');
            const versionId = model1.getVersionId();
            const alternativeVersionId = model1.getAlternativeVersionId();
            // dispose it
            modelService.destroyModel(resource);
            // create a new model with the same content
            const model2 = modelService.createModel('text1', null, resource);
            assert.strictEqual(model2.getVersionId(), versionId);
            assert.strictEqual(model2.getAlternativeVersionId(), alternativeVersionId);
            // dispose it
            modelService.destroyModel(resource);
        });
        test('does not maintain undo for same resource and different content', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            // create a model
            const model1 = modelService.createModel('text', null, resource);
            // make an edit
            model1.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model1.getValue(), 'text1');
            // dispose it
            modelService.destroyModel(resource);
            // create a new model with the same content
            const model2 = modelService.createModel('text2', null, resource);
            // undo
            model2.undo();
            assert.strictEqual(model2.getValue(), 'text2');
            // dispose it
            modelService.destroyModel(resource);
        });
        test('setValue should clear undo stack', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            const model = modelService.createModel('text', null, resource);
            model.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model.getValue(), 'text1');
            model.setValue('text2');
            model.undo();
            assert.strictEqual(model.getValue(), 'text2');
            // dispose it
            modelService.destroyModel(resource);
        });
    });
    suite('ModelSemanticColoring', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let modelService;
        let languageService;
        let languageFeaturesService;
        setup(() => {
            const configService = new testConfigurationService_1.TestConfigurationService({ editor: { semanticHighlighting: true } });
            const themeService = new testThemeService_1.TestThemeService();
            themeService.setTheme(new testThemeService_1.TestColorTheme({}, theme_1.ColorScheme.DARK, true));
            const logService = new log_1.NullLogService();
            languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
            modelService = disposables.add(new modelService_1.ModelService(configService, new testTextResourcePropertiesService_1.TestTextResourcePropertiesService(configService), themeService, logService, new undoRedoService_1.UndoRedoService(new testDialogService_1.TestDialogService(), new testNotificationService_1.TestNotificationService()), disposables.add(new languageService_1.LanguageService()), new testLanguageConfigurationService_1.TestLanguageConfigurationService(), new languageFeatureDebounce_1.LanguageFeatureDebounceService(logService), languageFeaturesService));
            languageService = disposables.add(new languageService_1.LanguageService(false));
        });
        teardown(() => {
            disposables.clear();
        });
        test('DocumentSemanticTokens should be fetched when the result is empty if there are pending changes', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                const inFirstCall = new async_1.Barrier();
                const delayFirstResult = new async_1.Barrier();
                const secondResultProvided = new async_1.Barrier();
                let callCount = 0;
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode', new class {
                    getLegend() {
                        return { tokenTypes: ['class'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        if (callCount === 1) {
                            assert.ok('called once');
                            inFirstCall.open();
                            await delayFirstResult.wait();
                            await (0, async_1.timeout)(0); // wait for the simple scheduler to fire to check that we do actually get rescheduled
                            return null;
                        }
                        if (callCount === 2) {
                            assert.ok('called twice');
                            secondResultProvided.open();
                            return null;
                        }
                        assert.fail('Unexpected call');
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                const textModel = disposables.add(modelService.createModel('Hello world', languageService.createById('testMode')));
                // wait for the provider to be called
                await inFirstCall.wait();
                // the provider is now in the provide call
                // change the text buffer while the provider is running
                textModel.applyEdits([{ range: new range_1.Range(1, 1, 1, 1), text: 'x' }]);
                // let the provider finish its first result
                delayFirstResult.open();
                // we need to check that the provider is called again, even if it returns null
                await secondResultProvided.wait();
                // assert that it got called twice
                assert.strictEqual(callCount, 2);
            });
        });
        test('DocumentSemanticTokens should be pick the token provider with actual items', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                let callCount = 0;
                disposables.add(languageService.registerLanguage({ id: 'testMode2' }));
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode2', new class {
                    getLegend() {
                        return { tokenTypes: ['class1'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        // For a secondary request return a different value
                        if (lastResultId) {
                            return {
                                data: new Uint32Array([2, 1, 1, 1, 1, 0, 2, 1, 1, 1])
                            };
                        }
                        return {
                            resultId: '1',
                            data: new Uint32Array([0, 1, 1, 1, 1, 0, 2, 1, 1, 1])
                        };
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode2', new class {
                    getLegend() {
                        return { tokenTypes: ['class2'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        return null;
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                function toArr(arr) {
                    const result = [];
                    for (let i = 0; i < arr.length; i++) {
                        result[i] = arr[i];
                    }
                    return result;
                }
                const textModel = modelService.createModel('Hello world 2', languageService.createById('testMode2'));
                try {
                    let result = await (0, getSemanticTokens_1.getDocumentSemanticTokens)(languageFeaturesService.documentSemanticTokensProvider, textModel, null, null, cancellation_1.CancellationToken.None);
                    assert.ok(result, `We should have tokens (1)`);
                    assert.ok(result.tokens, `Tokens are found from multiple providers (1)`);
                    assert.ok((0, getSemanticTokens_1.isSemanticTokens)(result.tokens), `Tokens are full (1)`);
                    assert.ok(result.tokens.resultId, `Token result id found from multiple providers (1)`);
                    assert.deepStrictEqual(toArr(result.tokens.data), [0, 1, 1, 1, 1, 0, 2, 1, 1, 1], `Token data returned for multiple providers (1)`);
                    assert.deepStrictEqual(callCount, 2, `Called both token providers (1)`);
                    assert.deepStrictEqual(result.provider.getLegend(), { tokenTypes: ['class1'], tokenModifiers: [] }, `Legend matches the tokens (1)`);
                    // Make a second request. Make sure we get the secondary value
                    result = await (0, getSemanticTokens_1.getDocumentSemanticTokens)(languageFeaturesService.documentSemanticTokensProvider, textModel, result.provider, result.tokens.resultId, cancellation_1.CancellationToken.None);
                    assert.ok(result, `We should have tokens (2)`);
                    assert.ok(result.tokens, `Tokens are found from multiple providers (2)`);
                    assert.ok((0, getSemanticTokens_1.isSemanticTokens)(result.tokens), `Tokens are full (2)`);
                    assert.ok(!result.tokens.resultId, `Token result id found from multiple providers (2)`);
                    assert.deepStrictEqual(toArr(result.tokens.data), [2, 1, 1, 1, 1, 0, 2, 1, 1, 1], `Token data returned for multiple providers (2)`);
                    assert.deepStrictEqual(callCount, 4, `Called both token providers (2)`);
                    assert.deepStrictEqual(result.provider.getLegend(), { tokenTypes: ['class1'], tokenModifiers: [] }, `Legend matches the tokens (2)`);
                }
                finally {
                    disposables.clear();
                    // Wait for scheduler to finish
                    await (0, async_1.timeout)(0);
                    // Now dispose the text model
                    textModel.dispose();
                }
            });
        });
    });
    function assertComputeEdits(lines1, lines2) {
        const model = (0, testTextModel_1.createTextModel)(lines1.join('\n'));
        const textBuffer = (0, textModel_1.createTextBuffer)(lines2.join('\n'), 1 /* DefaultEndOfLine.LF */).textBuffer;
        // compute required edits
        // let start = Date.now();
        const edits = modelService_1.ModelService._computeEdits(model, textBuffer);
        // console.log(`took ${Date.now() - start} ms.`);
        // apply edits
        model.pushEditOperations([], edits, null);
        assert.strictEqual(model.getValue(), lines2.join('\n'));
        model.dispose();
    }
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function getRandomString(minLength, maxLength) {
        const length = getRandomInt(minLength, maxLength);
        const t = (0, stringBuilder_1.createStringBuilder)(length);
        for (let i = 0; i < length; i++) {
            t.appendASCII(getRandomInt(97 /* CharCode.a */, 122 /* CharCode.z */));
        }
        return t.build();
    }
    function generateFile(small) {
        const lineCount = getRandomInt(1, small ? 3 : 10000);
        const lines = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(getRandomString(0, small ? 3 : 10000));
        }
        return lines;
    }
    if (GENERATE_TESTS) {
        let number = 1;
        while (true) {
            console.log('------TEST: ' + number++);
            const file1 = generateFile(true);
            const file2 = generateFile(true);
            console.log('------TEST GENERATED');
            try {
                assertComputeEdits(file1, file2);
            }
            catch (err) {
                console.log(err);
                console.log(`
const file1 = ${JSON.stringify(file1).replace(/"/g, '\'')};
const file2 = ${JSON.stringify(file2).replace(/"/g, '\'')};
assertComputeEdits(file1, file2);
`);
                break;
            }
        }
    }
});
//# sourceMappingURL=modelService.test.js.map