/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/workbench/services/search/common/search"], function (require, exports, arrays_1, async_1, cancellation_1, errorMessage_1, network_1, path, resources, types_1, uri_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BatchedCollector = exports.extensionResultIsMatch = exports.TextSearchResultsCollector = exports.TextSearchManager = void 0;
    class TextSearchManager {
        constructor(query, provider, fileUtils, processType) {
            this.query = query;
            this.provider = provider;
            this.fileUtils = fileUtils;
            this.processType = processType;
            this.collector = null;
            this.isLimitHit = false;
            this.resultCount = 0;
        }
        search(onProgress, token) {
            const folderQueries = this.query.folderQueries || [];
            const tokenSource = new cancellation_1.CancellationTokenSource();
            token.onCancellationRequested(() => tokenSource.cancel());
            return new Promise((resolve, reject) => {
                this.collector = new TextSearchResultsCollector(onProgress);
                let isCanceled = false;
                const onResult = (result, folderIdx) => {
                    if (isCanceled) {
                        return;
                    }
                    if (!this.isLimitHit) {
                        const resultSize = this.resultSize(result);
                        if (extensionResultIsMatch(result) && typeof this.query.maxResults === 'number' && this.resultCount + resultSize > this.query.maxResults) {
                            this.isLimitHit = true;
                            isCanceled = true;
                            tokenSource.cancel();
                            result = this.trimResultToSize(result, this.query.maxResults - this.resultCount);
                        }
                        const newResultSize = this.resultSize(result);
                        this.resultCount += newResultSize;
                        if (newResultSize > 0 || !extensionResultIsMatch(result)) {
                            this.collector.add(result, folderIdx);
                        }
                    }
                };
                // For each root folder
                Promise.all(folderQueries.map((fq, i) => {
                    return this.searchInFolder(fq, r => onResult(r, i), tokenSource.token);
                })).then(results => {
                    tokenSource.dispose();
                    this.collector.flush();
                    const someFolderHitLImit = results.some(result => !!result && !!result.limitHit);
                    resolve({
                        limitHit: this.isLimitHit || someFolderHitLImit,
                        messages: (0, arrays_1.flatten)(results.map(result => {
                            if (!(result === null || result === void 0 ? void 0 : result.message)) {
                                return [];
                            }
                            if ((0, types_1.isArray)(result.message)) {
                                return result.message;
                            }
                            else {
                                return [result.message];
                            }
                        })),
                        stats: {
                            type: this.processType
                        }
                    });
                }, (err) => {
                    tokenSource.dispose();
                    const errMsg = (0, errorMessage_1.toErrorMessage)(err);
                    reject(new Error(errMsg));
                });
            });
        }
        resultSize(result) {
            if (extensionResultIsMatch(result)) {
                return Array.isArray(result.ranges) ?
                    result.ranges.length :
                    1;
            }
            else {
                // #104400 context lines shoudn't count towards result count
                return 0;
            }
        }
        trimResultToSize(result, size) {
            const rangesArr = Array.isArray(result.ranges) ? result.ranges : [result.ranges];
            const matchesArr = Array.isArray(result.preview.matches) ? result.preview.matches : [result.preview.matches];
            return {
                ranges: rangesArr.slice(0, size),
                preview: {
                    matches: matchesArr.slice(0, size),
                    text: result.preview.text
                },
                uri: result.uri
            };
        }
        async searchInFolder(folderQuery, onResult, token) {
            const queryTester = new search_1.QueryGlobTester(this.query, folderQuery);
            const testingPs = [];
            const progress = {
                report: (result) => {
                    if (!this.validateProviderResult(result)) {
                        return;
                    }
                    const hasSibling = folderQuery.folder.scheme === network_1.Schemas.file ?
                        (0, search_1.hasSiblingPromiseFn)(() => {
                            return this.fileUtils.readdir(resources.dirname(result.uri));
                        }) :
                        undefined;
                    const relativePath = resources.relativePath(folderQuery.folder, result.uri);
                    if (relativePath) {
                        // This method is only async when the exclude contains sibling clauses
                        const included = queryTester.includedInQuery(relativePath, path.basename(relativePath), hasSibling);
                        if ((0, async_1.isThenable)(included)) {
                            testingPs.push(included.then(isIncluded => {
                                if (isIncluded) {
                                    onResult(result);
                                }
                            }));
                        }
                        else if (included) {
                            onResult(result);
                        }
                    }
                }
            };
            const searchOptions = this.getSearchOptionsForFolder(folderQuery);
            const result = await this.provider.provideTextSearchResults(patternInfoToQuery(this.query.contentPattern), searchOptions, progress, token);
            if (testingPs.length) {
                await Promise.all(testingPs);
            }
            return result;
        }
        validateProviderResult(result) {
            if (extensionResultIsMatch(result)) {
                if (Array.isArray(result.ranges)) {
                    if (!Array.isArray(result.preview.matches)) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same type.');
                        return false;
                    }
                    if (result.preview.matches.length !== result.ranges.length) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same length.');
                        return false;
                    }
                }
                else {
                    if (Array.isArray(result.preview.matches)) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same length.');
                        return false;
                    }
                }
            }
            return true;
        }
        getSearchOptionsForFolder(fq) {
            const includes = (0, search_1.resolvePatternsForProvider)(this.query.includePattern, fq.includePattern);
            const excludes = (0, search_1.resolvePatternsForProvider)(this.query.excludePattern, fq.excludePattern);
            const options = {
                folder: uri_1.URI.from(fq.folder),
                excludes,
                includes,
                useIgnoreFiles: !fq.disregardIgnoreFiles,
                useGlobalIgnoreFiles: !fq.disregardGlobalIgnoreFiles,
                useParentIgnoreFiles: !fq.disregardParentIgnoreFiles,
                followSymlinks: !fq.ignoreSymlinks,
                encoding: fq.fileEncoding && this.fileUtils.toCanonicalName(fq.fileEncoding),
                maxFileSize: this.query.maxFileSize,
                maxResults: this.query.maxResults,
                previewOptions: this.query.previewOptions,
                afterContext: this.query.afterContext,
                beforeContext: this.query.beforeContext
            };
            options.usePCRE2 = this.query.usePCRE2;
            return options;
        }
    }
    exports.TextSearchManager = TextSearchManager;
    function patternInfoToQuery(patternInfo) {
        return {
            isCaseSensitive: patternInfo.isCaseSensitive || false,
            isRegExp: patternInfo.isRegExp || false,
            isWordMatch: patternInfo.isWordMatch || false,
            isMultiline: patternInfo.isMultiline || false,
            pattern: patternInfo.pattern
        };
    }
    class TextSearchResultsCollector {
        constructor(_onResult) {
            this._onResult = _onResult;
            this._currentFolderIdx = -1;
            this._currentFileMatch = null;
            this._batchedCollector = new BatchedCollector(512, items => this.sendItems(items));
        }
        add(data, folderIdx) {
            // Collects TextSearchResults into IInternalFileMatches and collates using BatchedCollector.
            // This is efficient for ripgrep which sends results back one file at a time. It wouldn't be efficient for other search
            // providers that send results in random order. We could do this step afterwards instead.
            if (this._currentFileMatch && (this._currentFolderIdx !== folderIdx || !resources.isEqual(this._currentUri, data.uri))) {
                this.pushToCollector();
                this._currentFileMatch = null;
            }
            if (!this._currentFileMatch) {
                this._currentFolderIdx = folderIdx;
                this._currentFileMatch = {
                    resource: data.uri,
                    results: []
                };
            }
            this._currentFileMatch.results.push(extensionResultToFrontendResult(data));
        }
        pushToCollector() {
            const size = this._currentFileMatch && this._currentFileMatch.results ?
                this._currentFileMatch.results.length :
                0;
            this._batchedCollector.addItem(this._currentFileMatch, size);
        }
        flush() {
            this.pushToCollector();
            this._batchedCollector.flush();
        }
        sendItems(items) {
            this._onResult(items);
        }
    }
    exports.TextSearchResultsCollector = TextSearchResultsCollector;
    function extensionResultToFrontendResult(data) {
        // Warning: result from RipgrepTextSearchEH has fake Range. Don't depend on any other props beyond these...
        if (extensionResultIsMatch(data)) {
            return {
                preview: {
                    matches: (0, arrays_1.mapArrayOrNot)(data.preview.matches, m => ({
                        startLineNumber: m.start.line,
                        startColumn: m.start.character,
                        endLineNumber: m.end.line,
                        endColumn: m.end.character
                    })),
                    text: data.preview.text
                },
                ranges: (0, arrays_1.mapArrayOrNot)(data.ranges, r => ({
                    startLineNumber: r.start.line,
                    startColumn: r.start.character,
                    endLineNumber: r.end.line,
                    endColumn: r.end.character
                }))
            };
        }
        else {
            return {
                text: data.text,
                lineNumber: data.lineNumber
            };
        }
    }
    function extensionResultIsMatch(data) {
        return !!data.preview;
    }
    exports.extensionResultIsMatch = extensionResultIsMatch;
    /**
     * Collects items that have a size - before the cumulative size of collected items reaches START_BATCH_AFTER_COUNT, the callback is called for every
     * set of items collected.
     * But after that point, the callback is called with batches of maxBatchSize.
     * If the batch isn't filled within some time, the callback is also called.
     */
    class BatchedCollector {
        constructor(maxBatchSize, cb) {
            this.maxBatchSize = maxBatchSize;
            this.cb = cb;
            this.totalNumberCompleted = 0;
            this.batch = [];
            this.batchSize = 0;
        }
        addItem(item, size) {
            if (!item) {
                return;
            }
            this.addItemToBatch(item, size);
        }
        addItems(items, size) {
            if (!items) {
                return;
            }
            this.addItemsToBatch(items, size);
        }
        addItemToBatch(item, size) {
            this.batch.push(item);
            this.batchSize += size;
            this.onUpdate();
        }
        addItemsToBatch(item, size) {
            this.batch = this.batch.concat(item);
            this.batchSize += size;
            this.onUpdate();
        }
        onUpdate() {
            if (this.totalNumberCompleted < BatchedCollector.START_BATCH_AFTER_COUNT) {
                // Flush because we aren't batching yet
                this.flush();
            }
            else if (this.batchSize >= this.maxBatchSize) {
                // Flush because the batch is full
                this.flush();
            }
            else if (!this.timeoutHandle) {
                // No timeout running, start a timeout to flush
                this.timeoutHandle = setTimeout(() => {
                    this.flush();
                }, BatchedCollector.TIMEOUT);
            }
        }
        flush() {
            if (this.batchSize) {
                this.totalNumberCompleted += this.batchSize;
                this.cb(this.batch);
                this.batch = [];
                this.batchSize = 0;
                if (this.timeoutHandle) {
                    clearTimeout(this.timeoutHandle);
                    this.timeoutHandle = 0;
                }
            }
        }
    }
    exports.BatchedCollector = BatchedCollector;
    BatchedCollector.TIMEOUT = 4000;
    // After START_BATCH_AFTER_COUNT items have been collected, stop flushing on timeout
    BatchedCollector.START_BATCH_AFTER_COUNT = 50;
});
//# sourceMappingURL=textSearchManager.js.map