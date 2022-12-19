/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/search/common/search", "vs/workbench/api/browser/mainThreadWorkspace", "assert", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle"], function (require, exports, workbenchTestServices_1, search_1, mainThreadWorkspace_1, assert, testRPCProtocol_1, cancellation_1, configuration_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadWorkspace', () => {
        let disposables;
        let configService;
        let instantiationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            configService = instantiationService.get(configuration_1.IConfigurationService);
            configService.setUserConfiguration('search', {});
        });
        teardown(() => {
            disposables.dispose();
        });
        test('simple', () => {
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.strictEqual(query.folderQueries.length, 1);
                    assert.strictEqual(query.folderQueries[0].disregardIgnoreFiles, true);
                    assert.deepStrictEqual(Object.assign({}, query.includePattern), { 'foo': true });
                    assert.strictEqual(query.maxResults, 10);
                    return Promise.resolve({ results: [], messages: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, (0, testRPCProtocol_1.SingleProxyRPCProtocol)({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('foo', null, null, 10, new cancellation_1.CancellationTokenSource().token);
        });
        test('exclude defaults', () => {
            configService.setUserConfiguration('search', {
                'exclude': { 'searchExclude': true }
            });
            configService.setUserConfiguration('files', {
                'exclude': { 'filesExclude': true }
            });
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.strictEqual(query.folderQueries.length, 1);
                    assert.strictEqual(query.folderQueries[0].disregardIgnoreFiles, true);
                    assert.deepStrictEqual(query.folderQueries[0].excludePattern, { 'filesExclude': true });
                    return Promise.resolve({ results: [], messages: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, (0, testRPCProtocol_1.SingleProxyRPCProtocol)({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('', null, null, 10, new cancellation_1.CancellationTokenSource().token);
        });
        test('disregard excludes', () => {
            configService.setUserConfiguration('search', {
                'exclude': { 'searchExclude': true }
            });
            configService.setUserConfiguration('files', {
                'exclude': { 'filesExclude': true }
            });
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.strictEqual(query.folderQueries[0].excludePattern, undefined);
                    assert.deepStrictEqual(query.excludePattern, undefined);
                    return Promise.resolve({ results: [], messages: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, (0, testRPCProtocol_1.SingleProxyRPCProtocol)({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('', null, false, 10, new cancellation_1.CancellationTokenSource().token);
        });
        test('exclude string', () => {
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.strictEqual(query.folderQueries[0].excludePattern, undefined);
                    assert.deepStrictEqual(Object.assign({}, query.excludePattern), { 'exclude/**': true });
                    return Promise.resolve({ results: [], messages: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, (0, testRPCProtocol_1.SingleProxyRPCProtocol)({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('', null, 'exclude/**', 10, new cancellation_1.CancellationTokenSource().token);
        });
    });
});
//# sourceMappingURL=mainThreadWorkspace.test.js.map