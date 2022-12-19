/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/contrib/snippet/browser/snippetParser", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/languageFeatures", "vs/platform/history/browser/contextScopedHistoryWidget"], function (require, exports, cancellation_1, errors_1, filters_1, lifecycle_1, stopwatch_1, types_1, uri_1, position_1, range_1, resolverService_1, snippetParser_1, nls_1, actions_1, commands_1, contextkey_1, languageFeatures_1, contextScopedHistoryWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickSuggestionsOptions = exports.showSimpleSuggestions = exports.getSuggestionComparator = exports.provideSuggestionItems = exports.CompletionItemModel = exports.setSnippetSuggestSupport = exports.getSnippetSuggestSupport = exports.CompletionOptions = exports.SnippetSortOrder = exports.CompletionItem = exports.suggestWidgetStatusbarMenu = exports.Context = void 0;
    exports.Context = {
        Visible: contextScopedHistoryWidget_1.historyNavigationVisible,
        DetailsVisible: new contextkey_1.RawContextKey('suggestWidgetDetailsVisible', false, (0, nls_1.localize)('suggestWidgetDetailsVisible', "Whether suggestion details are visible")),
        MultipleSuggestions: new contextkey_1.RawContextKey('suggestWidgetMultipleSuggestions', false, (0, nls_1.localize)('suggestWidgetMultipleSuggestions', "Whether there are multiple suggestions to pick from")),
        MakesTextEdit: new contextkey_1.RawContextKey('suggestionMakesTextEdit', true, (0, nls_1.localize)('suggestionMakesTextEdit', "Whether inserting the current suggestion yields in a change or has everything already been typed")),
        AcceptSuggestionsOnEnter: new contextkey_1.RawContextKey('acceptSuggestionOnEnter', true, (0, nls_1.localize)('acceptSuggestionOnEnter', "Whether suggestions are inserted when pressing Enter")),
        HasInsertAndReplaceRange: new contextkey_1.RawContextKey('suggestionHasInsertAndReplaceRange', false, (0, nls_1.localize)('suggestionHasInsertAndReplaceRange', "Whether the current suggestion has insert and replace behaviour")),
        InsertMode: new contextkey_1.RawContextKey('suggestionInsertMode', undefined, { type: 'string', description: (0, nls_1.localize)('suggestionInsertMode', "Whether the default behaviour is to insert or replace") }),
        CanResolve: new contextkey_1.RawContextKey('suggestionCanResolve', false, (0, nls_1.localize)('suggestionCanResolve', "Whether the current suggestion supports to resolve further details")),
    };
    exports.suggestWidgetStatusbarMenu = new actions_1.MenuId('suggestWidgetStatusBar');
    class CompletionItem {
        constructor(position, completion, container, provider) {
            this.position = position;
            this.completion = completion;
            this.container = container;
            this.provider = provider;
            // validation
            this.isInvalid = false;
            // sorting, filtering
            this.score = filters_1.FuzzyScore.Default;
            this.distance = 0;
            this.textLabel = typeof completion.label === 'string'
                ? completion.label
                : completion.label.label;
            // ensure lower-variants (perf)
            this.labelLow = this.textLabel.toLowerCase();
            // validate label
            this.isInvalid = !this.textLabel;
            this.sortTextLow = completion.sortText && completion.sortText.toLowerCase();
            this.filterTextLow = completion.filterText && completion.filterText.toLowerCase();
            this.extensionId = completion.extensionId;
            // normalize ranges
            if (range_1.Range.isIRange(completion.range)) {
                this.editStart = new position_1.Position(completion.range.startLineNumber, completion.range.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
                // validate range
                this.isInvalid = this.isInvalid
                    || range_1.Range.spansMultipleLines(completion.range) || completion.range.startLineNumber !== position.lineNumber;
            }
            else {
                this.editStart = new position_1.Position(completion.range.insert.startLineNumber, completion.range.insert.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.insert.endLineNumber, completion.range.insert.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.replace.endLineNumber, completion.range.replace.endColumn);
                // validate ranges
                this.isInvalid = this.isInvalid
                    || range_1.Range.spansMultipleLines(completion.range.insert) || range_1.Range.spansMultipleLines(completion.range.replace)
                    || completion.range.insert.startLineNumber !== position.lineNumber || completion.range.replace.startLineNumber !== position.lineNumber
                    || completion.range.insert.startColumn !== completion.range.replace.startColumn;
            }
            // create the suggestion resolver
            if (typeof provider.resolveCompletionItem !== 'function') {
                this._resolveCache = Promise.resolve();
                this._isResolved = true;
            }
        }
        // ---- resolving
        get isResolved() {
            return !!this._isResolved;
        }
        async resolve(token) {
            if (!this._resolveCache) {
                const sub = token.onCancellationRequested(() => {
                    this._resolveCache = undefined;
                    this._isResolved = false;
                });
                this._resolveCache = Promise.resolve(this.provider.resolveCompletionItem(this.completion, token)).then(value => {
                    Object.assign(this.completion, value);
                    this._isResolved = true;
                    sub.dispose();
                }, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        // the IPC queue will reject the request with the
                        // cancellation error -> reset cached
                        this._resolveCache = undefined;
                        this._isResolved = false;
                    }
                });
            }
            return this._resolveCache;
        }
    }
    exports.CompletionItem = CompletionItem;
    var SnippetSortOrder;
    (function (SnippetSortOrder) {
        SnippetSortOrder[SnippetSortOrder["Top"] = 0] = "Top";
        SnippetSortOrder[SnippetSortOrder["Inline"] = 1] = "Inline";
        SnippetSortOrder[SnippetSortOrder["Bottom"] = 2] = "Bottom";
    })(SnippetSortOrder = exports.SnippetSortOrder || (exports.SnippetSortOrder = {}));
    class CompletionOptions {
        constructor(snippetSortOrder = 2 /* SnippetSortOrder.Bottom */, kindFilter = new Set(), providerFilter = new Set(), showDeprecated = true) {
            this.snippetSortOrder = snippetSortOrder;
            this.kindFilter = kindFilter;
            this.providerFilter = providerFilter;
            this.showDeprecated = showDeprecated;
        }
    }
    exports.CompletionOptions = CompletionOptions;
    CompletionOptions.default = new CompletionOptions();
    let _snippetSuggestSupport;
    function getSnippetSuggestSupport() {
        return _snippetSuggestSupport;
    }
    exports.getSnippetSuggestSupport = getSnippetSuggestSupport;
    function setSnippetSuggestSupport(support) {
        const old = _snippetSuggestSupport;
        _snippetSuggestSupport = support;
        return old;
    }
    exports.setSnippetSuggestSupport = setSnippetSuggestSupport;
    class CompletionItemModel {
        constructor(items, needsClipboard, durations, disposable) {
            this.items = items;
            this.needsClipboard = needsClipboard;
            this.durations = durations;
            this.disposable = disposable;
        }
    }
    exports.CompletionItemModel = CompletionItemModel;
    async function provideSuggestionItems(registry, model, position, options = CompletionOptions.default, context = { triggerKind: 0 /* languages.CompletionTriggerKind.Invoke */ }, token = cancellation_1.CancellationToken.None) {
        const sw = new stopwatch_1.StopWatch(true);
        position = position.clone();
        const word = model.getWordAtPosition(position);
        const defaultReplaceRange = word ? new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn) : range_1.Range.fromPositions(position);
        const defaultRange = { replace: defaultReplaceRange, insert: defaultReplaceRange.setEndPosition(position.lineNumber, position.column) };
        const result = [];
        const disposables = new lifecycle_1.DisposableStore();
        const durations = [];
        let needsClipboard = false;
        const onCompletionList = (provider, container, sw) => {
            var _a, _b, _c;
            let didAddResult = false;
            if (!container) {
                return didAddResult;
            }
            for (let suggestion of container.suggestions) {
                if (!options.kindFilter.has(suggestion.kind)) {
                    // skip if not showing deprecated suggestions
                    if (!options.showDeprecated && ((_a = suggestion === null || suggestion === void 0 ? void 0 : suggestion.tags) === null || _a === void 0 ? void 0 : _a.includes(1 /* languages.CompletionItemTag.Deprecated */))) {
                        continue;
                    }
                    // fill in default range when missing
                    if (!suggestion.range) {
                        suggestion.range = defaultRange;
                    }
                    // fill in default sortText when missing
                    if (!suggestion.sortText) {
                        suggestion.sortText = typeof suggestion.label === 'string' ? suggestion.label : suggestion.label.label;
                    }
                    if (!needsClipboard && suggestion.insertTextRules && suggestion.insertTextRules & 4 /* languages.CompletionItemInsertTextRule.InsertAsSnippet */) {
                        needsClipboard = snippetParser_1.SnippetParser.guessNeedsClipboard(suggestion.insertText);
                    }
                    result.push(new CompletionItem(position, suggestion, container, provider));
                    didAddResult = true;
                }
            }
            if ((0, lifecycle_1.isDisposable)(container)) {
                disposables.add(container);
            }
            durations.push({
                providerName: (_b = provider._debugDisplayName) !== null && _b !== void 0 ? _b : 'unknown_provider', elapsedProvider: (_c = container.duration) !== null && _c !== void 0 ? _c : -1, elapsedOverall: sw.elapsed()
            });
            return didAddResult;
        };
        // ask for snippets in parallel to asking "real" providers. Only do something if configured to
        // do so - no snippet filter, no special-providers-only request
        const snippetCompletions = (async () => {
            if (!_snippetSuggestSupport || options.kindFilter.has(27 /* languages.CompletionItemKind.Snippet */)) {
                return;
            }
            if (options.providerFilter.size > 0 && !options.providerFilter.has(_snippetSuggestSupport)) {
                return;
            }
            const sw = new stopwatch_1.StopWatch(true);
            const list = await _snippetSuggestSupport.provideCompletionItems(model, position, context, token);
            onCompletionList(_snippetSuggestSupport, list, sw);
        })();
        // add suggestions from contributed providers - providers are ordered in groups of
        // equal score and once a group produces a result the process stops
        // get provider groups, always add snippet suggestion provider
        for (let providerGroup of registry.orderedGroups(model)) {
            // for each support in the group ask for suggestions
            let didAddResult = false;
            await Promise.all(providerGroup.map(async (provider) => {
                if (options.providerFilter.size > 0 && !options.providerFilter.has(provider)) {
                    return;
                }
                try {
                    const sw = new stopwatch_1.StopWatch(true);
                    const list = await provider.provideCompletionItems(model, position, context, token);
                    didAddResult = onCompletionList(provider, list, sw) || didAddResult;
                }
                catch (err) {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }
            }));
            if (didAddResult || token.isCancellationRequested) {
                break;
            }
        }
        await snippetCompletions;
        if (token.isCancellationRequested) {
            disposables.dispose();
            return Promise.reject(new errors_1.CancellationError());
        }
        return new CompletionItemModel(result.sort(getSuggestionComparator(options.snippetSortOrder)), needsClipboard, { entries: durations, elapsed: sw.elapsed() }, disposables);
    }
    exports.provideSuggestionItems = provideSuggestionItems;
    function defaultComparator(a, b) {
        // check with 'sortText'
        if (a.sortTextLow && b.sortTextLow) {
            if (a.sortTextLow < b.sortTextLow) {
                return -1;
            }
            else if (a.sortTextLow > b.sortTextLow) {
                return 1;
            }
        }
        // check with 'label'
        if (a.completion.label < b.completion.label) {
            return -1;
        }
        else if (a.completion.label > b.completion.label) {
            return 1;
        }
        // check with 'type'
        return a.completion.kind - b.completion.kind;
    }
    function snippetUpComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return -1;
            }
            else if (b.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return 1;
            }
        }
        return defaultComparator(a, b);
    }
    function snippetDownComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return 1;
            }
            else if (b.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return -1;
            }
        }
        return defaultComparator(a, b);
    }
    const _snippetComparators = new Map();
    _snippetComparators.set(0 /* SnippetSortOrder.Top */, snippetUpComparator);
    _snippetComparators.set(2 /* SnippetSortOrder.Bottom */, snippetDownComparator);
    _snippetComparators.set(1 /* SnippetSortOrder.Inline */, defaultComparator);
    function getSuggestionComparator(snippetConfig) {
        return _snippetComparators.get(snippetConfig);
    }
    exports.getSuggestionComparator = getSuggestionComparator;
    commands_1.CommandsRegistry.registerCommand('_executeCompletionItemProvider', async (accessor, ...args) => {
        const [uri, position, triggerCharacter, maxItemsToResolve] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(position_1.Position.isIPosition(position));
        (0, types_1.assertType)(typeof triggerCharacter === 'string' || !triggerCharacter);
        (0, types_1.assertType)(typeof maxItemsToResolve === 'number' || !maxItemsToResolve);
        const { completionProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const ref = await accessor.get(resolverService_1.ITextModelService).createModelReference(uri);
        try {
            const result = {
                incomplete: false,
                suggestions: []
            };
            const resolving = [];
            const completions = await provideSuggestionItems(completionProvider, ref.object.textEditorModel, position_1.Position.lift(position), undefined, { triggerCharacter, triggerKind: triggerCharacter ? 1 /* languages.CompletionTriggerKind.TriggerCharacter */ : 0 /* languages.CompletionTriggerKind.Invoke */ });
            for (const item of completions.items) {
                if (resolving.length < (maxItemsToResolve !== null && maxItemsToResolve !== void 0 ? maxItemsToResolve : 0)) {
                    resolving.push(item.resolve(cancellation_1.CancellationToken.None));
                }
                result.incomplete = result.incomplete || item.container.incomplete;
                result.suggestions.push(item.completion);
            }
            try {
                await Promise.all(resolving);
                return result;
            }
            finally {
                setTimeout(() => completions.disposable.dispose(), 100);
            }
        }
        finally {
            ref.dispose();
        }
    });
    function showSimpleSuggestions(editor, provider) {
        var _a;
        (_a = editor.getContribution('editor.contrib.suggestController')) === null || _a === void 0 ? void 0 : _a.triggerSuggest(new Set().add(provider), undefined, true);
    }
    exports.showSimpleSuggestions = showSimpleSuggestions;
    class QuickSuggestionsOptions {
        static isAllOff(config) {
            return config.other === 'off' && config.comments === 'off' && config.strings === 'off';
        }
        static isAllOn(config) {
            return config.other === 'on' && config.comments === 'on' && config.strings === 'on';
        }
        static valueFor(config, tokenType) {
            switch (tokenType) {
                case 1 /* languages.StandardTokenType.Comment */: return config.comments;
                case 2 /* languages.StandardTokenType.String */: return config.strings;
                default: return config.other;
            }
        }
    }
    exports.QuickSuggestionsOptions = QuickSuggestionsOptions;
});
//# sourceMappingURL=suggest.js.map