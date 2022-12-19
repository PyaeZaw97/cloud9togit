/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/base/common/cancellation", "vs/platform/files/common/files", "vs/editor/common/core/range", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/base/common/strings", "vs/base/common/arrays"], function (require, exports, errors_1, workspace_1, editor_1, editorService_1, cancellation_1, files_1, range_1, types_1, contextkey_1, strings_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchStateKey = exports.SearchUIState = exports.extractRangeFromFilter = exports.getOutOfWorkspaceEditorResources = exports.getWorkspaceSymbols = exports.WorkspaceSymbolItem = exports.WorkspaceSymbolProviderRegistry = void 0;
    var WorkspaceSymbolProviderRegistry;
    (function (WorkspaceSymbolProviderRegistry) {
        const _supports = [];
        function register(provider) {
            let support = provider;
            if (support) {
                _supports.push(support);
            }
            return {
                dispose() {
                    if (support) {
                        const idx = _supports.indexOf(support);
                        if (idx >= 0) {
                            _supports.splice(idx, 1);
                            support = undefined;
                        }
                    }
                }
            };
        }
        WorkspaceSymbolProviderRegistry.register = register;
        function all() {
            return _supports.slice(0);
        }
        WorkspaceSymbolProviderRegistry.all = all;
    })(WorkspaceSymbolProviderRegistry = exports.WorkspaceSymbolProviderRegistry || (exports.WorkspaceSymbolProviderRegistry = {}));
    class WorkspaceSymbolItem {
        constructor(symbol, provider) {
            this.symbol = symbol;
            this.provider = provider;
        }
    }
    exports.WorkspaceSymbolItem = WorkspaceSymbolItem;
    async function getWorkspaceSymbols(query, token = cancellation_1.CancellationToken.None) {
        const all = [];
        const promises = WorkspaceSymbolProviderRegistry.all().map(async (provider) => {
            try {
                const value = await provider.provideWorkspaceSymbols(query, token);
                if (!value) {
                    return;
                }
                for (let symbol of value) {
                    all.push(new WorkspaceSymbolItem(symbol, provider));
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
        });
        await Promise.all(promises);
        if (token.isCancellationRequested) {
            return [];
        }
        // de-duplicate entries
        function compareItems(a, b) {
            var _a, _b;
            let res = (0, strings_1.compare)(a.symbol.name, b.symbol.name);
            if (res === 0) {
                res = a.symbol.kind - b.symbol.kind;
            }
            if (res === 0) {
                res = (0, strings_1.compare)(a.symbol.location.uri.toString(), b.symbol.location.uri.toString());
            }
            if (res === 0) {
                if (a.symbol.location.range && b.symbol.location.range) {
                    if (!range_1.Range.areIntersecting(a.symbol.location.range, b.symbol.location.range)) {
                        res = range_1.Range.compareRangesUsingStarts(a.symbol.location.range, b.symbol.location.range);
                    }
                }
                else if (a.provider.resolveWorkspaceSymbol && !b.provider.resolveWorkspaceSymbol) {
                    res = -1;
                }
                else if (!a.provider.resolveWorkspaceSymbol && b.provider.resolveWorkspaceSymbol) {
                    res = 1;
                }
            }
            if (res === 0) {
                res = (0, strings_1.compare)((_a = a.symbol.containerName) !== null && _a !== void 0 ? _a : '', (_b = b.symbol.containerName) !== null && _b !== void 0 ? _b : '');
            }
            return res;
        }
        return (0, arrays_1.groupBy)(all, compareItems).map(group => group[0]).flat();
    }
    exports.getWorkspaceSymbols = getWorkspaceSymbols;
    /**
     * Helper to return all opened editors with resources not belonging to the currently opened workspace.
     */
    function getOutOfWorkspaceEditorResources(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const fileService = accessor.get(files_1.IFileService);
        const resources = editorService.editors
            .map(editor => editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }))
            .filter(resource => !!resource && !contextService.isInsideWorkspace(resource) && fileService.hasProvider(resource));
        return resources;
    }
    exports.getOutOfWorkspaceEditorResources = getOutOfWorkspaceEditorResources;
    // Supports patterns of <path><#|:|(><line><#|:|,><col?>
    const LINE_COLON_PATTERN = /\s?[#:\(](?:line )?(\d*)(?:[#:,](\d*))?\)?\s*$/;
    function extractRangeFromFilter(filter, unless) {
        var _a, _b;
        if (!filter || (unless === null || unless === void 0 ? void 0 : unless.some(value => filter.indexOf(value) !== -1))) {
            return undefined;
        }
        let range = undefined;
        // Find Line/Column number from search value using RegExp
        const patternMatch = LINE_COLON_PATTERN.exec(filter);
        if (patternMatch) {
            const startLineNumber = parseInt((_a = patternMatch[1]) !== null && _a !== void 0 ? _a : '', 10);
            // Line Number
            if ((0, types_1.isNumber)(startLineNumber)) {
                range = {
                    startLineNumber: startLineNumber,
                    startColumn: 1,
                    endLineNumber: startLineNumber,
                    endColumn: 1
                };
                // Column Number
                const startColumn = parseInt((_b = patternMatch[2]) !== null && _b !== void 0 ? _b : '', 10);
                if ((0, types_1.isNumber)(startColumn)) {
                    range = {
                        startLineNumber: range.startLineNumber,
                        startColumn: startColumn,
                        endLineNumber: range.endLineNumber,
                        endColumn: startColumn
                    };
                }
            }
            // User has typed "something:" or "something#" without a line number, in this case treat as start of file
            else if (patternMatch[1] === '') {
                range = {
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1
                };
            }
        }
        if (patternMatch && range) {
            return {
                filter: filter.substr(0, patternMatch.index),
                range
            };
        }
        return undefined;
    }
    exports.extractRangeFromFilter = extractRangeFromFilter;
    var SearchUIState;
    (function (SearchUIState) {
        SearchUIState[SearchUIState["Idle"] = 0] = "Idle";
        SearchUIState[SearchUIState["Searching"] = 1] = "Searching";
        SearchUIState[SearchUIState["SlowSearch"] = 2] = "SlowSearch";
    })(SearchUIState = exports.SearchUIState || (exports.SearchUIState = {}));
    exports.SearchStateKey = new contextkey_1.RawContextKey('searchState', SearchUIState.Idle);
});
//# sourceMappingURL=search.js.map