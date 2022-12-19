/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/glob", "vs/base/common/objects", "vs/base/common/extpath", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/base/common/path", "vs/base/common/errors", "vs/workbench/services/search/common/searchExtTypes", "vs/base/common/async"], function (require, exports, arrays_1, glob, objects, extpath, strings_1, instantiation_1, paths, errors_1, searchExtTypes_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasSiblingFn = exports.hasSiblingPromiseFn = exports.QueryGlobTester = exports.resolvePatternsForProvider = exports.SerializableFileMatch = exports.isFilePatternMatch = exports.isSerializedFileMatch = exports.isSerializedSearchSuccess = exports.isSerializedSearchComplete = exports.serializeSearchError = exports.deserializeSearchError = exports.SearchError = exports.SearchErrorCode = exports.pathIncludedInQuery = exports.getExcludes = exports.SearchSortOrder = exports.OneLineRange = exports.SearchRange = exports.TextSearchMatch = exports.FileMatch = exports.SearchCompletionExitCode = exports.isProgressMessage = exports.isFileMatch = exports.resultIsMatch = exports.QueryType = exports.SearchProviderType = exports.ISearchService = exports.SEARCH_EXCLUDE_CONFIG = exports.VIEW_ID = exports.PANEL_ID = exports.VIEWLET_ID = exports.TextSearchCompleteMessageType = void 0;
    Object.defineProperty(exports, "TextSearchCompleteMessageType", { enumerable: true, get: function () { return searchExtTypes_1.TextSearchCompleteMessageType; } });
    exports.VIEWLET_ID = 'workbench.view.search';
    exports.PANEL_ID = 'workbench.panel.search';
    exports.VIEW_ID = 'workbench.view.search';
    exports.SEARCH_EXCLUDE_CONFIG = 'search.exclude';
    // Warning: this pattern is used in the search editor to detect offsets. If you
    // change this, also change the search-result built-in extension
    const SEARCH_ELIDED_PREFIX = '⟪ ';
    const SEARCH_ELIDED_SUFFIX = ' characters skipped ⟫';
    const SEARCH_ELIDED_MIN_LEN = (SEARCH_ELIDED_PREFIX.length + SEARCH_ELIDED_SUFFIX.length + 5) * 2;
    exports.ISearchService = (0, instantiation_1.createDecorator)('searchService');
    /**
     * TODO@roblou - split text from file search entirely, or share code in a more natural way.
     */
    var SearchProviderType;
    (function (SearchProviderType) {
        SearchProviderType[SearchProviderType["file"] = 0] = "file";
        SearchProviderType[SearchProviderType["text"] = 1] = "text";
    })(SearchProviderType = exports.SearchProviderType || (exports.SearchProviderType = {}));
    var QueryType;
    (function (QueryType) {
        QueryType[QueryType["File"] = 1] = "File";
        QueryType[QueryType["Text"] = 2] = "Text";
    })(QueryType = exports.QueryType || (exports.QueryType = {}));
    function resultIsMatch(result) {
        return !!result.preview;
    }
    exports.resultIsMatch = resultIsMatch;
    function isFileMatch(p) {
        return !!p.resource;
    }
    exports.isFileMatch = isFileMatch;
    function isProgressMessage(p) {
        return !!p.message;
    }
    exports.isProgressMessage = isProgressMessage;
    var SearchCompletionExitCode;
    (function (SearchCompletionExitCode) {
        SearchCompletionExitCode[SearchCompletionExitCode["Normal"] = 0] = "Normal";
        SearchCompletionExitCode[SearchCompletionExitCode["NewSearchStarted"] = 1] = "NewSearchStarted";
    })(SearchCompletionExitCode = exports.SearchCompletionExitCode || (exports.SearchCompletionExitCode = {}));
    class FileMatch {
        constructor(resource) {
            this.resource = resource;
            this.results = [];
            // empty
        }
    }
    exports.FileMatch = FileMatch;
    class TextSearchMatch {
        constructor(text, range, previewOptions) {
            this.ranges = range;
            // Trim preview if this is one match and a single-line match with a preview requested.
            // Otherwise send the full text, like for replace or for showing multiple previews.
            // TODO this is fishy.
            const ranges = Array.isArray(range) ? range : [range];
            if (previewOptions && previewOptions.matchLines === 1 && isSingleLineRangeList(ranges)) {
                // 1 line preview requested
                text = (0, strings_1.getNLines)(text, previewOptions.matchLines);
                let result = '';
                let shift = 0;
                let lastEnd = 0;
                const leadingChars = Math.floor(previewOptions.charsPerLine / 5);
                const matches = [];
                for (const range of ranges) {
                    const previewStart = Math.max(range.startColumn - leadingChars, 0);
                    const previewEnd = range.startColumn + previewOptions.charsPerLine;
                    if (previewStart > lastEnd + leadingChars + SEARCH_ELIDED_MIN_LEN) {
                        const elision = SEARCH_ELIDED_PREFIX + (previewStart - lastEnd) + SEARCH_ELIDED_SUFFIX;
                        result += elision + text.slice(previewStart, previewEnd);
                        shift += previewStart - (lastEnd + elision.length);
                    }
                    else {
                        result += text.slice(lastEnd, previewEnd);
                    }
                    matches.push(new OneLineRange(0, range.startColumn - shift, range.endColumn - shift));
                    lastEnd = previewEnd;
                }
                this.preview = { text: result, matches: Array.isArray(this.ranges) ? matches : matches[0] };
            }
            else {
                const firstMatchLine = Array.isArray(range) ? range[0].startLineNumber : range.startLineNumber;
                this.preview = {
                    text,
                    matches: (0, arrays_1.mapArrayOrNot)(range, r => new SearchRange(r.startLineNumber - firstMatchLine, r.startColumn, r.endLineNumber - firstMatchLine, r.endColumn))
                };
            }
        }
    }
    exports.TextSearchMatch = TextSearchMatch;
    function isSingleLineRangeList(ranges) {
        const line = ranges[0].startLineNumber;
        for (const r of ranges) {
            if (r.startLineNumber !== line || r.endLineNumber !== line) {
                return false;
            }
        }
        return true;
    }
    class SearchRange {
        constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
        }
    }
    exports.SearchRange = SearchRange;
    class OneLineRange extends SearchRange {
        constructor(lineNumber, startColumn, endColumn) {
            super(lineNumber, startColumn, lineNumber, endColumn);
        }
    }
    exports.OneLineRange = OneLineRange;
    var SearchSortOrder;
    (function (SearchSortOrder) {
        SearchSortOrder["Default"] = "default";
        SearchSortOrder["FileNames"] = "fileNames";
        SearchSortOrder["Type"] = "type";
        SearchSortOrder["Modified"] = "modified";
        SearchSortOrder["CountDescending"] = "countDescending";
        SearchSortOrder["CountAscending"] = "countAscending";
    })(SearchSortOrder = exports.SearchSortOrder || (exports.SearchSortOrder = {}));
    function getExcludes(configuration, includeSearchExcludes = true) {
        const fileExcludes = configuration && configuration.files && configuration.files.exclude;
        const searchExcludes = includeSearchExcludes && configuration && configuration.search && configuration.search.exclude;
        if (!fileExcludes && !searchExcludes) {
            return undefined;
        }
        if (!fileExcludes || !searchExcludes) {
            return fileExcludes || searchExcludes;
        }
        let allExcludes = Object.create(null);
        // clone the config as it could be frozen
        allExcludes = objects.mixin(allExcludes, objects.deepClone(fileExcludes));
        allExcludes = objects.mixin(allExcludes, objects.deepClone(searchExcludes), true);
        return allExcludes;
    }
    exports.getExcludes = getExcludes;
    function pathIncludedInQuery(queryProps, fsPath) {
        if (queryProps.excludePattern && glob.match(queryProps.excludePattern, fsPath)) {
            return false;
        }
        if (queryProps.includePattern || queryProps.usingSearchPaths) {
            if (queryProps.includePattern && glob.match(queryProps.includePattern, fsPath)) {
                return true;
            }
            // If searchPaths are being used, the extra file must be in a subfolder and match the pattern, if present
            if (queryProps.usingSearchPaths) {
                return !!queryProps.folderQueries && queryProps.folderQueries.some(fq => {
                    const searchPath = fq.folder.fsPath;
                    if (extpath.isEqualOrParent(fsPath, searchPath)) {
                        const relPath = paths.relative(searchPath, fsPath);
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
    exports.pathIncludedInQuery = pathIncludedInQuery;
    var SearchErrorCode;
    (function (SearchErrorCode) {
        SearchErrorCode[SearchErrorCode["unknownEncoding"] = 1] = "unknownEncoding";
        SearchErrorCode[SearchErrorCode["regexParseError"] = 2] = "regexParseError";
        SearchErrorCode[SearchErrorCode["globParseError"] = 3] = "globParseError";
        SearchErrorCode[SearchErrorCode["invalidLiteral"] = 4] = "invalidLiteral";
        SearchErrorCode[SearchErrorCode["rgProcessError"] = 5] = "rgProcessError";
        SearchErrorCode[SearchErrorCode["other"] = 6] = "other";
        SearchErrorCode[SearchErrorCode["canceled"] = 7] = "canceled";
    })(SearchErrorCode = exports.SearchErrorCode || (exports.SearchErrorCode = {}));
    class SearchError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.SearchError = SearchError;
    function deserializeSearchError(error) {
        const errorMsg = error.message;
        if ((0, errors_1.isCancellationError)(error)) {
            return new SearchError(errorMsg, SearchErrorCode.canceled);
        }
        try {
            const details = JSON.parse(errorMsg);
            return new SearchError(details.message, details.code);
        }
        catch (e) {
            return new SearchError(errorMsg, SearchErrorCode.other);
        }
    }
    exports.deserializeSearchError = deserializeSearchError;
    function serializeSearchError(searchError) {
        const details = { message: searchError.message, code: searchError.code };
        return new Error(JSON.stringify(details));
    }
    exports.serializeSearchError = serializeSearchError;
    function isSerializedSearchComplete(arg) {
        if (arg.type === 'error') {
            return true;
        }
        else if (arg.type === 'success') {
            return true;
        }
        else {
            return false;
        }
    }
    exports.isSerializedSearchComplete = isSerializedSearchComplete;
    function isSerializedSearchSuccess(arg) {
        return arg.type === 'success';
    }
    exports.isSerializedSearchSuccess = isSerializedSearchSuccess;
    function isSerializedFileMatch(arg) {
        return !!arg.path;
    }
    exports.isSerializedFileMatch = isSerializedFileMatch;
    function isFilePatternMatch(candidate, normalizedFilePatternLowercase) {
        const pathToMatch = candidate.searchPath ? candidate.searchPath : candidate.relativePath;
        return (0, strings_1.fuzzyContains)(pathToMatch, normalizedFilePatternLowercase);
    }
    exports.isFilePatternMatch = isFilePatternMatch;
    class SerializableFileMatch {
        constructor(path) {
            this.path = path;
            this.results = [];
        }
        addMatch(match) {
            this.results.push(match);
        }
        serialize() {
            return {
                path: this.path,
                results: this.results,
                numMatches: this.results.length
            };
        }
    }
    exports.SerializableFileMatch = SerializableFileMatch;
    /**
     *  Computes the patterns that the provider handles. Discards sibling clauses and 'false' patterns
     */
    function resolvePatternsForProvider(globalPattern, folderPattern) {
        const merged = Object.assign(Object.assign({}, (globalPattern || {})), (folderPattern || {}));
        return Object.keys(merged)
            .filter(key => {
            const value = merged[key];
            return typeof value === 'boolean' && value;
        });
    }
    exports.resolvePatternsForProvider = resolvePatternsForProvider;
    class QueryGlobTester {
        constructor(config, folderQuery) {
            this._parsedIncludeExpression = null;
            this._excludeExpression = Object.assign(Object.assign({}, (config.excludePattern || {})), (folderQuery.excludePattern || {}));
            this._parsedExcludeExpression = glob.parse(this._excludeExpression);
            // Empty includeExpression means include nothing, so no {} shortcuts
            let includeExpression = config.includePattern;
            if (folderQuery.includePattern) {
                if (includeExpression) {
                    includeExpression = Object.assign(Object.assign({}, includeExpression), folderQuery.includePattern);
                }
                else {
                    includeExpression = folderQuery.includePattern;
                }
            }
            if (includeExpression) {
                this._parsedIncludeExpression = glob.parse(includeExpression);
            }
        }
        matchesExcludesSync(testPath, basename, hasSibling) {
            if (this._parsedExcludeExpression && this._parsedExcludeExpression(testPath, basename, hasSibling)) {
                return true;
            }
            return false;
        }
        /**
         * Guaranteed sync - siblingsFn should not return a promise.
         */
        includedInQuerySync(testPath, basename, hasSibling) {
            if (this._parsedExcludeExpression && this._parsedExcludeExpression(testPath, basename, hasSibling)) {
                return false;
            }
            if (this._parsedIncludeExpression && !this._parsedIncludeExpression(testPath, basename, hasSibling)) {
                return false;
            }
            return true;
        }
        /**
         * Evaluating the exclude expression is only async if it includes sibling clauses. As an optimization, avoid doing anything with Promises
         * unless the expression is async.
         */
        includedInQuery(testPath, basename, hasSibling) {
            const excluded = this._parsedExcludeExpression(testPath, basename, hasSibling);
            const isIncluded = () => {
                return this._parsedIncludeExpression ?
                    !!(this._parsedIncludeExpression(testPath, basename, hasSibling)) :
                    true;
            };
            if ((0, async_1.isThenable)(excluded)) {
                return excluded.then(excluded => {
                    if (excluded) {
                        return false;
                    }
                    return isIncluded();
                });
            }
            return isIncluded();
        }
        hasSiblingExcludeClauses() {
            return hasSiblingClauses(this._excludeExpression);
        }
    }
    exports.QueryGlobTester = QueryGlobTester;
    function hasSiblingClauses(pattern) {
        for (const key in pattern) {
            if (typeof pattern[key] !== 'boolean') {
                return true;
            }
        }
        return false;
    }
    function hasSiblingPromiseFn(siblingsFn) {
        if (!siblingsFn) {
            return undefined;
        }
        let siblings;
        return (name) => {
            if (!siblings) {
                siblings = (siblingsFn() || Promise.resolve([]))
                    .then(list => list ? listToMap(list) : {});
            }
            return siblings.then(map => !!map[name]);
        };
    }
    exports.hasSiblingPromiseFn = hasSiblingPromiseFn;
    function hasSiblingFn(siblingsFn) {
        if (!siblingsFn) {
            return undefined;
        }
        let siblings;
        return (name) => {
            if (!siblings) {
                const list = siblingsFn();
                siblings = list ? listToMap(list) : {};
            }
            return !!siblings[name];
        };
    }
    exports.hasSiblingFn = hasSiblingFn;
    function listToMap(list) {
        const map = {};
        for (const key of list) {
            map[key] = true;
        }
        return map;
    }
});
//# sourceMappingURL=search.js.map