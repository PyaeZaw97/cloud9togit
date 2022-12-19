/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/notebookServiceImpl", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/workbench/services/editor/browser/editorResolverService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, event_1, lifecycle_1, uri_1, mock_1, testConfigurationService_1, notebookServiceImpl_1, notebookProvider_1, editorResolverService_1, editorResolverService_2, extensions_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookProviderInfoStore', function () {
        test('Can\'t open untitled notebooks in test #119363', function () {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const store = new notebookServiceImpl_1.NotebookProviderInfoStore(new class extends (0, mock_1.mock)() {
                get() { return ''; }
                store() { }
            }, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidRegisterExtensions = event_1.Event.None;
                }
            }, instantiationService.createInstance(editorResolverService_1.EditorResolverService), new testConfigurationService_1.TestConfigurationService(), new class extends (0, mock_1.mock)() {
            }, instantiationService, new class extends (0, mock_1.mock)() {
                hasProvider() { return true; }
            }, new class extends (0, mock_1.mock)() {
            });
            const fooInfo = new notebookProvider_1.NotebookProviderInfo({
                extension: extensions_1.nullExtensionDescription.identifier,
                id: 'foo',
                displayName: 'foo',
                selectors: [{ filenamePattern: '*.foo' }],
                priority: editorResolverService_2.RegisteredEditorPriority.default,
                exclusive: false,
                providerDisplayName: 'foo',
            });
            const barInfo = new notebookProvider_1.NotebookProviderInfo({
                extension: extensions_1.nullExtensionDescription.identifier,
                id: 'bar',
                displayName: 'bar',
                selectors: [{ filenamePattern: '*.bar' }],
                priority: editorResolverService_2.RegisteredEditorPriority.default,
                exclusive: false,
                providerDisplayName: 'bar',
            });
            store.add(fooInfo);
            store.add(barInfo);
            assert.ok(store.get('foo'));
            assert.ok(store.get('bar'));
            assert.ok(!store.get('barfoo'));
            let providers = store.getContributedNotebook(uri_1.URI.parse('file:///test/nb.foo'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === fooInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('file:///test/nb.bar'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === barInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('untitled:///Untitled-1'));
            assert.strictEqual(providers.length, 2);
            assert.strictEqual(providers[0] === fooInfo, true);
            assert.strictEqual(providers[1] === barInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('untitled:///test/nb.bar'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === barInfo, true);
            disposables.dispose();
        });
    });
});
//# sourceMappingURL=notebookServiceImpl.test.js.map