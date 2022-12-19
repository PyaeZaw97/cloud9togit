/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "vs/base/common/glob", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/cancellation", "vs/workbench/services/search/common/getFileResults", "vs/workbench/services/search/common/ignoreFile", "vs/base/common/strings", "vs/base/common/async", "vs/base/common/resources"], function (require, exports, glob, uri_1, paths, cancellation_1, getFileResults_1, ignoreFile_1, strings_1, async_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalFileSearchSimpleWorker = exports.create = void 0;
    const PERF = false;
    const globalStart = +new Date();
    const itrcount = {};
    const time = async (name, task) => {
        var _a;
        if (!PERF) {
            return task();
        }
        const start = Date.now();
        const itr = ((_a = itrcount[name]) !== null && _a !== void 0 ? _a : 0) + 1;
        console.info(name, itr, 'starting', Math.round((start - globalStart) * 10) / 10000);
        itrcount[name] = itr;
        const r = await task();
        const end = Date.now();
        console.info(name, itr, 'took', end - start);
        return r;
    };
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new LocalFileSearchSimpleWorker(host);
    }
    exports.create = create;
    class LocalFileSearchSimpleWorker {
        constructor(host) {
            this.host = host;
            this.cancellationTokens = new Map();
        }
        cancelQuery(queryId) {
            var _a;
            (_a = this.cancellationTokens.get(queryId)) === null || _a === void 0 ? void 0 : _a.cancel();
        }
        registerCancellationToken(queryId) {
            const source = new cancellation_1.CancellationTokenSource();
            this.cancellationTokens.set(queryId, source);
            return source;
        }
        async listDirectory(handle, query, folderQuery, ignorePathCasing, queryId) {
            const revivedFolderQuery = reviveFolderQuery(folderQuery);
            const extUri = new resources_1.ExtUri(() => ignorePathCasing);
            const token = this.registerCancellationToken(queryId);
            const entries = [];
            let limitHit = false;
            let count = 0;
            const max = query.maxResults || 512;
            const filePatternMatcher = query.filePattern
                ? (name) => query.filePattern.split('').every(c => name.includes(c))
                : (name) => true;
            await time('listDirectory', () => this.walkFolderQuery(handle, reviveQueryProps(query), revivedFolderQuery, extUri, file => {
                if (!filePatternMatcher(file.name)) {
                    return;
                }
                count++;
                if (max && count > max) {
                    limitHit = true;
                    token.cancel();
                }
                return entries.push(file.path);
            }, token.token));
            return {
                results: entries,
                limitHit
            };
        }
        async searchDirectory(handle, query, folderQuery, ignorePathCasing, queryId) {
            const revivedQuery = reviveFolderQuery(folderQuery);
            const extUri = new resources_1.ExtUri(() => ignorePathCasing);
            return time('searchInFiles', async () => {
                const token = this.registerCancellationToken(queryId);
                const results = [];
                const pattern = createSearchRegExp(query.contentPattern);
                const onGoingProcesses = [];
                let fileCount = 0;
                let resultCount = 0;
                let limitHit = false;
                const processFile = async (file) => {
                    var _a, _b;
                    if (token.token.isCancellationRequested) {
                        return;
                    }
                    fileCount++;
                    const contents = await file.resolve();
                    if (token.token.isCancellationRequested) {
                        return;
                    }
                    const bytes = new Uint8Array(contents);
                    const fileResults = (0, getFileResults_1.getFileResults)(bytes, pattern, {
                        afterContext: (_a = query.afterContext) !== null && _a !== void 0 ? _a : 0,
                        beforeContext: (_b = query.beforeContext) !== null && _b !== void 0 ? _b : 0,
                        previewOptions: query.previewOptions,
                        remainingResultQuota: query.maxResults ? (query.maxResults - resultCount) : 10000,
                    });
                    if (fileResults.length) {
                        resultCount += fileResults.length;
                        if (query.maxResults && resultCount > query.maxResults) {
                            token.cancel();
                        }
                        const match = {
                            resource: uri_1.URI.joinPath(revivedQuery.folder, file.path),
                            results: fileResults,
                        };
                        this.host.sendTextSearchMatch(match, queryId);
                        results.push(match);
                    }
                };
                await time('walkFolderToResolve', () => this.walkFolderQuery(handle, reviveQueryProps(query), revivedQuery, extUri, async (file) => onGoingProcesses.push(processFile(file)), token.token));
                await time('resolveOngoingProcesses', () => Promise.all(onGoingProcesses));
                if (PERF) {
                    console.log('Searched in', fileCount, 'files');
                }
                return {
                    results,
                    limitHit,
                };
            });
        }
        async walkFolderQuery(handle, queryProps, folderQuery, extUri, onFile, token) {
            var _a;
            const folderExcludes = glob.parse((_a = folderQuery.excludePattern) !== null && _a !== void 0 ? _a : {}, { trimForExclusions: true });
            // For folders, only check if the folder is explicitly excluded so walking continues.
            const isFolderExcluded = (path, basename, hasSibling) => {
                path = path.slice(1);
                if (folderExcludes(path, basename, hasSibling)) {
                    return true;
                }
                if (pathExcludedInQuery(queryProps, path)) {
                    return true;
                }
                return false;
            };
            // For files ensure the full check takes place.
            const isFileIncluded = (path, basename, hasSibling) => {
                path = path.slice(1);
                if (folderExcludes(path, basename, hasSibling)) {
                    return false;
                }
                if (!pathIncludedInQuery(queryProps, path, extUri)) {
                    return false;
                }
                return true;
            };
            const processFile = (file, prior) => {
                const resolved = {
                    type: 'file',
                    name: file.name,
                    path: prior,
                    resolve: () => file.getFile().then(r => r.arrayBuffer())
                };
                return resolved;
            };
            const isFileSystemDirectoryHandle = (handle) => {
                return handle.kind === 'directory';
            };
            const isFileSystemFileHandle = (handle) => {
                return handle.kind === 'file';
            };
            const processDirectory = async (directory, prior, ignoreFile) => {
                if (!folderQuery.disregardIgnoreFiles) {
                    const ignoreFiles = await Promise.all([
                        directory.getFileHandle('.gitignore').catch(e => undefined),
                        directory.getFileHandle('.ignore').catch(e => undefined),
                    ]);
                    await Promise.all(ignoreFiles.map(async (file) => {
                        if (!file) {
                            return;
                        }
                        const ignoreContents = new TextDecoder('utf8').decode(new Uint8Array(await (await file.getFile()).arrayBuffer()));
                        ignoreFile = new ignoreFile_1.IgnoreFile(ignoreContents, prior, ignoreFile);
                    }));
                }
                const entries = async_1.Promises.withAsyncBody(async (c) => {
                    var e_1, _a;
                    const files = [];
                    const dirs = [];
                    const entries = [];
                    const sibilings = new Set();
                    try {
                        for (var _b = __asyncValues(directory.entries()), _c; _c = await _b.next(), !_c.done;) {
                            const entry = _c.value;
                            entries.push(entry);
                            sibilings.add(entry[0]);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    for (const [basename, handle] of entries) {
                        if (token.isCancellationRequested) {
                            break;
                        }
                        const path = prior + basename;
                        if (ignoreFile && !ignoreFile.isPathIncludedInTraversal(path, handle.kind === 'directory')) {
                            continue;
                        }
                        const hasSibling = (query) => sibilings.has(query);
                        if (isFileSystemDirectoryHandle(handle) && !isFolderExcluded(path, basename, hasSibling)) {
                            dirs.push(processDirectory(handle, path + '/', ignoreFile));
                        }
                        else if (isFileSystemFileHandle(handle) && isFileIncluded(path, basename, hasSibling)) {
                            files.push(processFile(handle, path));
                        }
                    }
                    c([...await Promise.all(dirs), ...files]);
                });
                return {
                    type: 'dir',
                    name: directory.name,
                    entries
                };
            };
            const resolveDirectory = async (directory, onFile) => {
                if (token.isCancellationRequested) {
                    return;
                }
                await Promise.all((await directory.entries)
                    .sort((a, b) => -(a.type === 'dir' ? 0 : 1) + (b.type === 'dir' ? 0 : 1))
                    .map(async (entry) => {
                    if (entry.type === 'dir') {
                        return resolveDirectory(entry, onFile);
                    }
                    else {
                        return onFile(entry);
                    }
                }));
            };
            const processed = await time('process', () => processDirectory(handle, '/'));
            await time('resolve', () => resolveDirectory(processed, onFile));
        }
    }
    exports.LocalFileSearchSimpleWorker = LocalFileSearchSimpleWorker;
    function createSearchRegExp(options) {
        return (0, strings_1.createRegExp)(options.pattern, !!options.isRegExp, {
            wholeWord: options.isWordMatch,
            global: true,
            matchCase: options.isCaseSensitive,
            multiline: true,
            unicode: true,
        });
    }
    function reviveFolderQuery(folderQuery) {
        return Object.assign(Object.assign({}, folderQuery), { folder: uri_1.URI.revive(folderQuery.folder) });
    }
    function reviveQueryProps(queryProps) {
        var _a;
        return Object.assign(Object.assign({}, queryProps), { extraFileResources: (_a = queryProps.extraFileResources) === null || _a === void 0 ? void 0 : _a.map(r => uri_1.URI.revive(r)), folderQueries: queryProps.folderQueries.map(fq => reviveFolderQuery(fq)) });
    }
    function pathExcludedInQuery(queryProps, fsPath) {
        if (queryProps.excludePattern && glob.match(queryProps.excludePattern, fsPath)) {
            return true;
        }
        return false;
    }
    function pathIncludedInQuery(queryProps, path, extUri) {
        if (queryProps.excludePattern && glob.match(queryProps.excludePattern, path)) {
            return false;
        }
        if (queryProps.includePattern || queryProps.usingSearchPaths) {
            if (queryProps.includePattern && glob.match(queryProps.includePattern, path)) {
                return true;
            }
            // If searchPaths are being used, the extra file must be in a subfolder and match the pattern, if present
            if (queryProps.usingSearchPaths) {
                return !!queryProps.folderQueries && queryProps.folderQueries.some(fq => {
                    const searchPath = fq.folder;
                    const uri = uri_1.URI.file(path);
                    if (extUri.isEqualOrParent(uri, searchPath)) {
                        const relPath = paths.relative(searchPath.path, uri.path);
                        return !fq.includePattern || !!glob.match(fq.includePattern, relPath);
                    }
                    else {
                        return false;
                    }
                });
            }
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=localFileSearch.js.map