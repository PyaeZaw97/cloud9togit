/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/mock", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/node/extHostSearch", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/textSearchManager", "vs/workbench/api/test/common/testRPCProtocol"], function (require, exports, assert, arrays_1, async_1, cancellation_1, errors_1, lifecycle_1, resources_1, uri_1, mock_1, log_1, extHost_protocol_1, extHostTypes_1, extHostUriTransformerService_1, extHostSearch_1, search_1, textSearchManager_1, testRPCProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionResultIsMatch = void 0;
    let rpcProtocol;
    let extHostSearch;
    const disposables = new lifecycle_1.DisposableStore();
    let mockMainThreadSearch;
    class MockMainThreadSearch {
        constructor() {
            this.results = [];
        }
        $registerFileSearchProvider(handle, scheme) {
            this.lastHandle = handle;
        }
        $registerTextSearchProvider(handle, scheme) {
            this.lastHandle = handle;
        }
        $unregisterProvider(handle) {
        }
        $handleFileMatch(handle, session, data) {
            this.results.push(...data);
        }
        $handleTextMatch(handle, session, data) {
            this.results.push(...data);
        }
        $handleTelemetry(eventName, data) {
        }
        dispose() {
        }
    }
    let mockPFS;
    function extensionResultIsMatch(data) {
        return !!data.preview;
    }
    exports.extensionResultIsMatch = extensionResultIsMatch;
    suite('ExtHostSearch', () => {
        async function registerTestTextSearchProvider(provider, scheme = 'file') {
            disposables.add(extHostSearch.registerTextSearchProvider(scheme, provider));
            await rpcProtocol.sync();
        }
        async function registerTestFileSearchProvider(provider, scheme = 'file') {
            disposables.add(extHostSearch.registerFileSearchProvider(scheme, provider));
            await rpcProtocol.sync();
        }
        async function runFileSearch(query, cancel = false) {
            let stats;
            try {
                const cancellation = new cancellation_1.CancellationTokenSource();
                const p = extHostSearch.$provideFileSearchResults(mockMainThreadSearch.lastHandle, 0, query, cancellation.token);
                if (cancel) {
                    await (0, async_1.timeout)(0);
                    cancellation.cancel();
                }
                stats = await p;
            }
            catch (err) {
                if (!(0, errors_1.isCancellationError)(err)) {
                    await rpcProtocol.sync();
                    throw err;
                }
            }
            await rpcProtocol.sync();
            return {
                results: mockMainThreadSearch.results.map(r => uri_1.URI.revive(r)),
                stats: stats
            };
        }
        async function runTextSearch(query) {
            let stats;
            try {
                const cancellation = new cancellation_1.CancellationTokenSource();
                const p = extHostSearch.$provideTextSearchResults(mockMainThreadSearch.lastHandle, 0, query, cancellation.token);
                stats = await p;
            }
            catch (err) {
                if (!(0, errors_1.isCancellationError)(err)) {
                    await rpcProtocol.sync();
                    throw err;
                }
            }
            await rpcProtocol.sync();
            const results = mockMainThreadSearch.results.map(r => (Object.assign(Object.assign({}, r), {
                resource: uri_1.URI.revive(r.resource)
            })));
            return { results, stats: stats };
        }
        setup(() => {
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            mockMainThreadSearch = new MockMainThreadSearch();
            const logService = new log_1.NullLogService();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadSearch, mockMainThreadSearch);
            mockPFS = {};
            extHostSearch = new class extends extHostSearch_1.NativeExtHostSearch {
                constructor() {
                    super(rpcProtocol, new class extends (0, mock_1.mock)() {
                        constructor() {
                            super(...arguments);
                            this.remote = { isRemote: false, authority: undefined, connectionData: null };
                        }
                    }, new extHostUriTransformerService_1.URITransformerService(null), logService);
                    this._pfs = mockPFS;
                }
                createTextSearchManager(query, provider) {
                    return new textSearchManager_1.NativeTextSearchManager(query, provider, this._pfs);
                }
            };
        });
        teardown(() => {
            disposables.clear();
            return rpcProtocol.sync();
        });
        const rootFolderA = uri_1.URI.file('/foo/bar1');
        const rootFolderB = uri_1.URI.file('/foo/bar2');
        const fancyScheme = 'fancy';
        const fancySchemeFolderA = uri_1.URI.from({ scheme: fancyScheme, path: '/project/folder1' });
        suite('File:', () => {
            function getSimpleQuery(filePattern = '') {
                return {
                    type: 1 /* QueryType.File */,
                    filePattern,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
            }
            function compareURIs(actual, expected) {
                const sortAndStringify = (arr) => arr.sort().map(u => u.toString());
                assert.deepStrictEqual(sortAndStringify(actual), sortAndStringify(expected));
            }
            test('no results', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = await runFileSearch(getSimpleQuery());
                assert(!stats.limitHit);
                assert(!results.length);
            });
            test('simple results', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'subfolder/file3.ts')
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults);
                    }
                });
                const { results, stats } = await runFileSearch(getSimpleQuery());
                assert(!stats.limitHit);
                assert.strictEqual(results.length, 3);
                compareURIs(results, reportedResults);
            });
            test('Search canceled', async () => {
                let cancelRequested = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return new Promise((resolve, reject) => {
                            function onCancel() {
                                cancelRequested = true;
                                resolve([(0, resources_1.joinPath)(options.folder, 'file1.ts')]); // or reject or nothing?
                            }
                            if (token.isCancellationRequested) {
                                onCancel();
                            }
                            else {
                                token.onCancellationRequested(() => onCancel());
                            }
                        });
                    }
                });
                const { results } = await runFileSearch(getSimpleQuery(), true);
                assert(cancelRequested);
                assert(!results.length);
            });
            test('provider returns null', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return null;
                    }
                });
                try {
                    await runFileSearch(getSimpleQuery());
                    assert(false, 'Expected to fail');
                }
                catch (_a) {
                    // Expected to throw
                }
            });
            test('all provider calls get global include/excludes', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        assert(options.excludes.length === 2 && options.includes.length === 2, 'Missing global include/excludes');
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: {
                        'foo': true,
                        'bar': true
                    },
                    excludePattern: {
                        'something': true,
                        'else': true
                    },
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                await runFileSearch(query);
            });
            test('global/local include/excludes combined', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        if (options.folder.toString() === rootFolderA.toString()) {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts', 'foo']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js', 'bar']);
                        }
                        else {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js']);
                        }
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                'foo': true
                            },
                            excludePattern: {
                                'bar': true
                            }
                        },
                        { folder: rootFolderB }
                    ]
                };
                await runFileSearch(query);
            });
            test('include/excludes resolved correctly', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        assert.deepStrictEqual(options.includes.sort(), ['*.jsx', '*.ts']);
                        assert.deepStrictEqual(options.excludes.sort(), []);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: {
                        '*.ts': true,
                        '*.jsx': false
                    },
                    excludePattern: {
                        '*.js': true,
                        '*.tsx': false
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                '*.jsx': true
                            },
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                await runFileSearch(query);
            });
            test('basic sibling exclude clause', async () => {
                const reportedResults = [
                    'file1.ts',
                    'file1.js',
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults
                            .map(relativePath => (0, resources_1.joinPath)(options.folder, relativePath)));
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts')
                ]);
            });
            // https://github.com/microsoft/vscode-remotehub/issues/255
            test('include, sibling exclude, and subfolder', async () => {
                const reportedResults = [
                    'foo/file1.ts',
                    'foo/file1.js',
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults
                            .map(relativePath => (0, resources_1.joinPath)(options.folder, relativePath)));
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: { '**/*.ts': true },
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, [
                    (0, resources_1.joinPath)(rootFolderA, 'foo/file1.ts')
                ]);
            });
            test('multiroot sibling exclude clause', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        let reportedResults;
                        if (options.folder.fsPath === rootFolderA.fsPath) {
                            reportedResults = [
                                'folder/fileA.scss',
                                'folder/fileA.css',
                                'folder/file2.css'
                            ].map(relativePath => (0, resources_1.joinPath)(rootFolderA, relativePath));
                        }
                        else {
                            reportedResults = [
                                'fileB.ts',
                                'fileB.js',
                                'file3.js'
                            ].map(relativePath => (0, resources_1.joinPath)(rootFolderB, relativePath));
                        }
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        },
                        '*.css': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            excludePattern: {
                                'folder/*.css': {
                                    when: '$(basename).scss'
                                }
                            }
                        },
                        {
                            folder: rootFolderB,
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, [
                    (0, resources_1.joinPath)(rootFolderA, 'folder/fileA.scss'),
                    (0, resources_1.joinPath)(rootFolderA, 'folder/file2.css'),
                    (0, resources_1.joinPath)(rootFolderB, 'fileB.ts'),
                    (0, resources_1.joinPath)(rootFolderB, 'fileB.js'),
                    (0, resources_1.joinPath)(rootFolderB, 'file3.js'),
                ]);
            });
            test('max results = 1', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file3.ts'),
                ];
                let wasCanceled = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 1,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = await runFileSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assert.strictEqual(results.length, 1);
                compareURIs(results, reportedResults.slice(0, 1));
                assert(wasCanceled, 'Expected to be canceled when hitting limit');
            });
            test('max results = 2', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file3.ts'),
                ];
                let wasCanceled = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = await runFileSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assert.strictEqual(results.length, 2);
                compareURIs(results, reportedResults.slice(0, 2));
                assert(wasCanceled, 'Expected to be canceled when hitting limit');
            });
            test('provider returns maxResults exactly', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                ];
                let wasCanceled = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = await runFileSearch(query);
                assert(!stats.limitHit, 'Expected not to return limitHit');
                assert.strictEqual(results.length, 2);
                compareURIs(results, reportedResults);
                assert(!wasCanceled, 'Expected not to be canceled when just reaching limit');
            });
            test('multiroot max results', async () => {
                let cancels = 0;
                await registerTestFileSearchProvider({
                    async provideFileSearchResults(query, options, token) {
                        token.onCancellationRequested(() => cancels++);
                        // Provice results async so it has a chance to invoke every provider
                        await new Promise(r => process.nextTick(r));
                        return [
                            'file1.ts',
                            'file2.ts',
                            'file3.ts',
                        ].map(relativePath => (0, resources_1.joinPath)(options.folder, relativePath));
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        },
                        {
                            folder: rootFolderB
                        }
                    ]
                };
                const { results } = await runFileSearch(query);
                assert.strictEqual(results.length, 2); // Don't care which 2 we got
                assert.strictEqual(cancels, 2, 'Expected all invocations to be canceled when hitting limit');
            });
            test('works with non-file schemes', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(fancySchemeFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(fancySchemeFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(fancySchemeFolderA, 'subfolder/file3.ts'),
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults);
                    }
                }, fancyScheme);
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    folderQueries: [
                        {
                            folder: fancySchemeFolderA
                        }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, reportedResults);
            });
        });
        suite('Text:', () => {
            function makePreview(text) {
                return {
                    matches: [new extHostTypes_1.Range(0, 0, 0, text.length)],
                    text
                };
            }
            function makeTextResult(baseFolder, relativePath) {
                return {
                    preview: makePreview('foo'),
                    ranges: [new extHostTypes_1.Range(0, 0, 0, 3)],
                    uri: (0, resources_1.joinPath)(baseFolder, relativePath)
                };
            }
            function getSimpleQuery(queryText) {
                return {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern(queryText),
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
            }
            function getPattern(queryText) {
                return {
                    pattern: queryText
                };
            }
            function assertResults(actual, expected) {
                const actualTextSearchResults = [];
                for (let fileMatch of actual) {
                    // Make relative
                    for (let lineResult of fileMatch.results) {
                        if ((0, search_1.resultIsMatch)(lineResult)) {
                            actualTextSearchResults.push({
                                preview: {
                                    text: lineResult.preview.text,
                                    matches: (0, arrays_1.mapArrayOrNot)(lineResult.preview.matches, m => new extHostTypes_1.Range(m.startLineNumber, m.startColumn, m.endLineNumber, m.endColumn))
                                },
                                ranges: (0, arrays_1.mapArrayOrNot)(lineResult.ranges, r => new extHostTypes_1.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn)),
                                uri: fileMatch.resource
                            });
                        }
                        else {
                            actualTextSearchResults.push({
                                text: lineResult.text,
                                lineNumber: lineResult.lineNumber,
                                uri: fileMatch.resource
                            });
                        }
                    }
                }
                const rangeToString = (r) => `(${r.start.line}, ${r.start.character}), (${r.end.line}, ${r.end.character})`;
                const makeComparable = (results) => results
                    .sort((a, b) => {
                    const compareKeyA = a.uri.toString() + ': ' + (extensionResultIsMatch(a) ? a.preview.text : a.text);
                    const compareKeyB = b.uri.toString() + ': ' + (extensionResultIsMatch(b) ? b.preview.text : b.text);
                    return compareKeyB.localeCompare(compareKeyA);
                })
                    .map(r => extensionResultIsMatch(r) ? {
                    uri: r.uri.toString(),
                    range: (0, arrays_1.mapArrayOrNot)(r.ranges, rangeToString),
                    preview: {
                        text: r.preview.text,
                        match: null // Don't care about this right now
                    }
                } : {
                    uri: r.uri.toString(),
                    text: r.text,
                    lineNumber: r.lineNumber
                });
                return assert.deepStrictEqual(makeComparable(actualTextSearchResults), makeComparable(expected));
            }
            test('no results', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = await runTextSearch(getSimpleQuery('foo'));
                assert(!stats.limitHit);
                assert(!results.length);
            });
            test('basic results', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = await runTextSearch(getSimpleQuery('foo'));
                assert(!stats.limitHit);
                assertResults(results, providedResults);
            });
            test('all provider calls get global include/excludes', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        assert.strictEqual(options.includes.length, 1);
                        assert.strictEqual(options.excludes.length, 1);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                await runTextSearch(query);
            });
            test('global/local include/excludes combined', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        if (options.folder.toString() === rootFolderA.toString()) {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts', 'foo']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js', 'bar']);
                        }
                        else {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js']);
                        }
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                'foo': true
                            },
                            excludePattern: {
                                'bar': true
                            }
                        },
                        { folder: rootFolderB }
                    ]
                };
                await runTextSearch(query);
            });
            test('include/excludes resolved correctly', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        assert.deepStrictEqual(options.includes.sort(), ['*.jsx', '*.ts']);
                        assert.deepStrictEqual(options.excludes.sort(), []);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true,
                        '*.jsx': false
                    },
                    excludePattern: {
                        '*.js': true,
                        '*.tsx': false
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                '*.jsx': true
                            },
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                await runTextSearch(query);
            });
            test('provider fail', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        throw new Error('Provider fail');
                    }
                });
                try {
                    await runTextSearch(getSimpleQuery('foo'));
                    assert(false, 'Expected to fail');
                }
                catch (_a) {
                    // expected to fail
                }
            });
            test('basic sibling clause', async () => {
                mockPFS.Promises = {
                    readdir: (_path) => {
                        if (_path === rootFolderA.fsPath) {
                            return Promise.resolve([
                                'file1.js',
                                'file1.ts'
                            ]);
                        }
                        else {
                            return Promise.reject(new Error('Wrong path'));
                        }
                    }
                };
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.js'),
                    makeTextResult(rootFolderA, 'file1.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, providedResults.slice(1));
            });
            test('multiroot sibling clause', async () => {
                mockPFS.Promises = {
                    readdir: (_path) => {
                        if (_path === (0, resources_1.joinPath)(rootFolderA, 'folder').fsPath) {
                            return Promise.resolve([
                                'fileA.scss',
                                'fileA.css',
                                'file2.css'
                            ]);
                        }
                        else if (_path === rootFolderB.fsPath) {
                            return Promise.resolve([
                                'fileB.ts',
                                'fileB.js',
                                'file3.js'
                            ]);
                        }
                        else {
                            return Promise.reject(new Error('Wrong path'));
                        }
                    }
                };
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        let reportedResults;
                        if (options.folder.fsPath === rootFolderA.fsPath) {
                            reportedResults = [
                                makeTextResult(rootFolderA, 'folder/fileA.scss'),
                                makeTextResult(rootFolderA, 'folder/fileA.css'),
                                makeTextResult(rootFolderA, 'folder/file2.css')
                            ];
                        }
                        else {
                            reportedResults = [
                                makeTextResult(rootFolderB, 'fileB.ts'),
                                makeTextResult(rootFolderB, 'fileB.js'),
                                makeTextResult(rootFolderB, 'file3.js')
                            ];
                        }
                        reportedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        },
                        '*.css': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            excludePattern: {
                                'folder/*.css': {
                                    when: '$(basename).scss'
                                }
                            }
                        },
                        {
                            folder: rootFolderB,
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, [
                    makeTextResult(rootFolderA, 'folder/fileA.scss'),
                    makeTextResult(rootFolderA, 'folder/file2.css'),
                    makeTextResult(rootFolderB, 'fileB.ts'),
                    makeTextResult(rootFolderB, 'fileB.js'),
                    makeTextResult(rootFolderB, 'file3.js')
                ]);
            });
            test('include pattern applied', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.js'),
                    makeTextResult(rootFolderA, 'file1.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, providedResults.slice(1));
            });
            test('max results = 1', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                let wasCanceled = false;
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 1,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults.slice(0, 1));
                assert(wasCanceled, 'Expected to be canceled');
            });
            test('max results = 2', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts'),
                    makeTextResult(rootFolderA, 'file3.ts')
                ];
                let wasCanceled = false;
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults.slice(0, 2));
                assert(wasCanceled, 'Expected to be canceled');
            });
            test('provider returns maxResults exactly', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                let wasCanceled = false;
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(!stats.limitHit, 'Expected not to return limitHit');
                assertResults(results, providedResults);
                assert(!wasCanceled, 'Expected not to be canceled');
            });
            test('provider returns early with limitHit', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts'),
                    makeTextResult(rootFolderA, 'file3.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve({ limitHit: true });
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 1000,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults);
            });
            test('multiroot max results', async () => {
                let cancels = 0;
                await registerTestTextSearchProvider({
                    async provideTextSearchResults(query, options, progress, token) {
                        token.onCancellationRequested(() => cancels++);
                        await new Promise(r => process.nextTick(r));
                        [
                            'file1.ts',
                            'file2.ts',
                            'file3.ts',
                        ].forEach(f => progress.report(makeTextResult(options.folder, f)));
                        return null;
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                const { results } = await runTextSearch(query);
                assert.strictEqual(results.length, 2);
                assert.strictEqual(cancels, 2);
            });
            test('works with non-file schemes', async () => {
                const providedResults = [
                    makeTextResult(fancySchemeFolderA, 'file1.ts'),
                    makeTextResult(fancySchemeFolderA, 'file2.ts'),
                    makeTextResult(fancySchemeFolderA, 'file3.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                }, fancyScheme);
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    folderQueries: [
                        { folder: fancySchemeFolderA }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, providedResults);
            });
        });
    });
});
//# sourceMappingURL=extHostSearch.test.js.map