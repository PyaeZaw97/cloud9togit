/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/editor/common/languageSelector"], function (require, exports, assert, uri_1, languageSelector_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LanguageSelector', function () {
        let model = {
            language: 'farboo',
            uri: uri_1.URI.parse('file:///testbed/file.fb')
        };
        test('score, invalid selector', function () {
            assert.strictEqual((0, languageSelector_1.score)({}, model.uri, model.language, true, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(undefined, model.uri, model.language, true, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(null, model.uri, model.language, true, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)('', model.uri, model.language, true, undefined), 0);
        });
        test('score, any language', function () {
            assert.strictEqual((0, languageSelector_1.score)({ language: '*' }, model.uri, model.language, true, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('*', model.uri, model.language, true, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('*', uri_1.URI.parse('foo:bar'), model.language, true, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('farboo', uri_1.URI.parse('foo:bar'), model.language, true, undefined), 10);
        });
        test('score, default schemes', function () {
            const uri = uri_1.URI.parse('git:foo/file.txt');
            const language = 'farboo';
            assert.strictEqual((0, languageSelector_1.score)('*', uri, language, true, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('farboo', uri, language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: '' }, uri, language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: 'git' }, uri, language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: '*' }, uri, language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo' }, uri, language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: '*' }, uri, language, true, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)({ scheme: '*' }, uri, language, true, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)({ scheme: 'git' }, uri, language, true, undefined), 10);
        });
        test('score, filter', function () {
            assert.strictEqual((0, languageSelector_1.score)('farboo', model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo' }, model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: 'file' }, model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: 'http' }, model.uri, model.language, true, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb' }, model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb', scheme: 'file' }, model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb' }, uri_1.URI.parse('foo:bar'), model.language, true, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb', scheme: 'foo' }, uri_1.URI.parse('foo:bar'), model.language, true, undefined), 0);
            let doc = {
                uri: uri_1.URI.parse('git:/my/file.js'),
                langId: 'javascript'
            };
            assert.strictEqual((0, languageSelector_1.score)('javascript', doc.uri, doc.langId, true, undefined), 10); // 0;
            assert.strictEqual((0, languageSelector_1.score)({ language: 'javascript', scheme: 'git' }, doc.uri, doc.langId, true, undefined), 10); // 10;
            assert.strictEqual((0, languageSelector_1.score)('*', doc.uri, doc.langId, true, undefined), 5); // 5
            assert.strictEqual((0, languageSelector_1.score)('fooLang', doc.uri, doc.langId, true, undefined), 0); // 0
            assert.strictEqual((0, languageSelector_1.score)(['fooLang', '*'], doc.uri, doc.langId, true, undefined), 5); // 5
        });
        test('score, max(filters)', function () {
            let match = { language: 'farboo', scheme: 'file' };
            let fail = { language: 'farboo', scheme: 'http' };
            assert.strictEqual((0, languageSelector_1.score)(match, model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)(fail, model.uri, model.language, true, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)([match, fail], model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)([fail, fail], model.uri, model.language, true, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(['farboo', '*'], model.uri, model.language, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)(['*', 'farboo'], model.uri, model.language, true, undefined), 10);
        });
        test('score hasAccessToAllModels', function () {
            let doc = {
                uri: uri_1.URI.parse('file:/my/file.js'),
                langId: 'javascript'
            };
            assert.strictEqual((0, languageSelector_1.score)('javascript', doc.uri, doc.langId, false, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'javascript', scheme: 'file' }, doc.uri, doc.langId, false, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)('*', doc.uri, doc.langId, false, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)('fooLang', doc.uri, doc.langId, false, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(['fooLang', '*'], doc.uri, doc.langId, false, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'javascript', scheme: 'file', hasAccessToAllModels: true }, doc.uri, doc.langId, false, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)(['fooLang', '*', { language: '*', hasAccessToAllModels: true }], doc.uri, doc.langId, false, undefined), 5);
        });
        test('score, notebookType', function () {
            let obj = {
                uri: uri_1.URI.parse('file:/my/file.js'),
                langId: 'javascript',
                notebookType: 'fooBook'
            };
            assert.strictEqual((0, languageSelector_1.score)('javascript', obj.uri, obj.langId, true, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)('javascript', obj.uri, obj.langId, true, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: 'fooBook' }, obj.uri, obj.langId, true, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: 'fooBook', language: 'javascript', scheme: 'file' }, obj.uri, obj.langId, true, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: 'fooBook', language: '*' }, obj.uri, obj.langId, true, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: '*', language: '*' }, obj.uri, obj.langId, true, obj.notebookType), 5);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: '*', language: 'javascript' }, obj.uri, obj.langId, true, obj.notebookType), 10);
        });
        test('Document selector match - unexpected result value #60232', function () {
            let selector = {
                language: 'json',
                scheme: 'file',
                pattern: '**/*.interface.json'
            };
            let value = (0, languageSelector_1.score)(selector, uri_1.URI.parse('file:///C:/Users/zlhe/Desktop/test.interface.json'), 'json', true, undefined);
            assert.strictEqual(value, 10);
        });
        test('Document selector match - platform paths #99938', function () {
            let selector = {
                pattern: {
                    base: '/home/user/Desktop',
                    pattern: '*.json'
                }
            };
            let value = (0, languageSelector_1.score)(selector, uri_1.URI.file('/home/user/Desktop/test.json'), 'json', true, undefined);
            assert.strictEqual(value, 10);
        });
        test('NotebookType without notebook', function () {
            let obj = {
                uri: uri_1.URI.parse('file:///my/file.bat'),
                langId: 'bat',
            };
            let value = (0, languageSelector_1.score)({
                language: 'bat',
                notebookType: 'xxx'
            }, obj.uri, obj.langId, true, undefined);
            assert.strictEqual(value, 0);
            value = (0, languageSelector_1.score)({
                language: 'bat',
                notebookType: '*'
            }, obj.uri, obj.langId, true, undefined);
            assert.strictEqual(value, 0);
        });
    });
});
//# sourceMappingURL=languageSelector.test.js.map