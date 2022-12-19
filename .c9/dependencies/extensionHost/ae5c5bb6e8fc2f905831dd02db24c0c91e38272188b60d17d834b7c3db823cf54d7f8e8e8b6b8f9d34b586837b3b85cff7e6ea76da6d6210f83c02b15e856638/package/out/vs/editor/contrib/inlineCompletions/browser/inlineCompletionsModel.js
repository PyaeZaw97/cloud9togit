/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/coreCommands", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/inlineCompletions/browser/ghostText", "vs/platform/commands/common/commands", "vs/editor/contrib/inlineCompletions/browser/consts", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionToGhostText", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model/bracketPairsTextModelPart/fixBrackets", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetController2", "vs/base/common/types", "vs/base/common/filters", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/platform/configuration/common/configuration"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, coreCommands_1, editOperation_1, range_1, languages_1, ghostText_1, commands_1, consts_1, inlineCompletionToGhostText_1, languageConfigurationRegistry_1, fixBrackets_1, languageFeatures_1, languageFeatureDebounce_1, snippetParser_1, snippetController2_1, types_1, filters_1, utils_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.provideInlineCompletions = exports.SynchronizedInlineCompletionsCache = exports.UpdateOperation = exports.InlineCompletionsSession = exports.InlineCompletionsModel = void 0;
    let InlineCompletionsModel = class InlineCompletionsModel extends lifecycle_1.Disposable {
        constructor(editor, cache, commandService, languageConfigurationService, languageFeaturesService, debounceService, configurationService) {
            super();
            this.editor = editor;
            this.cache = cache;
            this.commandService = commandService;
            this.languageConfigurationService = languageConfigurationService;
            this.languageFeaturesService = languageFeaturesService;
            this.debounceService = debounceService;
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.completionSession = this._register(new lifecycle_1.MutableDisposable());
            this.active = false;
            this.disposed = false;
            this.debounceValue = this.debounceService.for(this.languageFeaturesService.inlineCompletionsProvider, 'InlineCompletionsDebounce', { min: 50, max: 200 });
            this._register(commandService.onDidExecuteCommand((e) => {
                // These commands don't trigger onDidType.
                const commands = new Set([
                    coreCommands_1.CoreEditingCommands.Tab.id,
                    coreCommands_1.CoreEditingCommands.DeleteLeft.id,
                    coreCommands_1.CoreEditingCommands.DeleteRight.id,
                    consts_1.inlineSuggestCommitId,
                    'acceptSelectedSuggestion',
                ]);
                if (commands.has(e.commandId) && editor.hasTextFocus()) {
                    this.handleUserInput();
                }
            }));
            this._register(this.editor.onDidType((e) => {
                this.handleUserInput();
            }));
            this._register(this.editor.onDidChangeCursorPosition((e) => {
                if (e.reason === 3 /* CursorChangeReason.Explicit */ ||
                    this.session && !this.session.isValid) {
                    this.hide();
                }
            }));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.disposed = true;
            }));
            this._register(this.editor.onDidBlurEditorWidget(() => {
                // This is a hidden setting very useful for debugging
                if (configurationService.getValue('editor.inlineSuggest.hideOnBlur')) {
                    return;
                }
                this.hide();
            }));
        }
        handleUserInput() {
            if (this.session && !this.session.isValid) {
                this.hide();
            }
            setTimeout(() => {
                if (this.disposed) {
                    return;
                }
                // Wait for the cursor update that happens in the same iteration loop iteration
                this.startSessionIfTriggered();
            }, 0);
        }
        get session() {
            return this.completionSession.value;
        }
        get ghostText() {
            var _a;
            return (_a = this.session) === null || _a === void 0 ? void 0 : _a.ghostText;
        }
        get minReservedLineCount() {
            return this.session ? this.session.minReservedLineCount : 0;
        }
        get expanded() {
            return this.session ? this.session.expanded : false;
        }
        setExpanded(expanded) {
            var _a;
            (_a = this.session) === null || _a === void 0 ? void 0 : _a.setExpanded(expanded);
        }
        setActive(active) {
            var _a;
            this.active = active;
            if (active) {
                (_a = this.session) === null || _a === void 0 ? void 0 : _a.scheduleAutomaticUpdate();
            }
        }
        startSessionIfTriggered() {
            const suggestOptions = this.editor.getOption(55 /* EditorOption.inlineSuggest */);
            if (!suggestOptions.enabled) {
                return;
            }
            if (this.session && this.session.isValid) {
                return;
            }
            this.trigger(languages_1.InlineCompletionTriggerKind.Automatic);
        }
        trigger(triggerKind) {
            if (this.completionSession.value) {
                if (triggerKind === languages_1.InlineCompletionTriggerKind.Explicit) {
                    void this.completionSession.value.ensureUpdateWithExplicitContext();
                }
                return;
            }
            this.completionSession.value = new InlineCompletionsSession(this.editor, this.editor.getPosition(), () => this.active, this.commandService, this.cache, triggerKind, this.languageConfigurationService, this.languageFeaturesService.inlineCompletionsProvider, this.debounceValue);
            this.completionSession.value.takeOwnership(this.completionSession.value.onDidChange(() => {
                this.onDidChangeEmitter.fire();
            }));
        }
        hide() {
            this.completionSession.clear();
            this.onDidChangeEmitter.fire();
        }
        commitCurrentSuggestion() {
            var _a;
            // Don't dispose the session, so that after committing, more suggestions are shown.
            (_a = this.session) === null || _a === void 0 ? void 0 : _a.commitCurrentCompletion();
        }
        showNext() {
            var _a;
            (_a = this.session) === null || _a === void 0 ? void 0 : _a.showNextInlineCompletion();
        }
        showPrevious() {
            var _a;
            (_a = this.session) === null || _a === void 0 ? void 0 : _a.showPreviousInlineCompletion();
        }
        async hasMultipleInlineCompletions() {
            var _a;
            const result = await ((_a = this.session) === null || _a === void 0 ? void 0 : _a.hasMultipleInlineCompletions());
            return result !== undefined ? result : false;
        }
    };
    InlineCompletionsModel = __decorate([
        __param(2, commands_1.ICommandService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(6, configuration_1.IConfigurationService)
    ], InlineCompletionsModel);
    exports.InlineCompletionsModel = InlineCompletionsModel;
    class InlineCompletionsSession extends ghostText_1.BaseGhostTextWidgetModel {
        constructor(editor, triggerPosition, shouldUpdate, commandService, cache, initialTriggerKind, languageConfigurationService, registry, debounce) {
            super(editor);
            this.triggerPosition = triggerPosition;
            this.shouldUpdate = shouldUpdate;
            this.commandService = commandService;
            this.cache = cache;
            this.initialTriggerKind = initialTriggerKind;
            this.languageConfigurationService = languageConfigurationService;
            this.registry = registry;
            this.debounce = debounce;
            this.minReservedLineCount = 0;
            this.updateOperation = this._register(new lifecycle_1.MutableDisposable());
            this.updateSoon = this._register(new async_1.RunOnceScheduler(() => {
                let triggerKind = this.initialTriggerKind;
                // All subsequent triggers are automatic.
                this.initialTriggerKind = languages_1.InlineCompletionTriggerKind.Automatic;
                return this.update(triggerKind);
            }, 50));
            this.filteredCompletions = [];
            //#region Selection
            // We use a semantic id to track the selection even if the cache changes.
            this.currentlySelectedCompletionId = undefined;
            let lastCompletionItem = undefined;
            this._register(this.onDidChange(() => {
                const currentCompletion = this.currentCompletion;
                if (currentCompletion && currentCompletion.sourceInlineCompletion !== lastCompletionItem) {
                    lastCompletionItem = currentCompletion.sourceInlineCompletion;
                    const provider = currentCompletion.sourceProvider;
                    if (provider.handleItemDidShow) {
                        provider.handleItemDidShow(currentCompletion.sourceInlineCompletions, lastCompletionItem);
                    }
                }
            }));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.cache.clear();
            }));
            this._register(this.editor.onDidChangeCursorPosition((e) => {
                var _a;
                if (e.reason === 3 /* CursorChangeReason.Explicit */) {
                    return;
                }
                // Ghost text depends on the cursor position
                (_a = this.cache.value) === null || _a === void 0 ? void 0 : _a.updateRanges();
                if (this.cache.value) {
                    this.updateFilteredInlineCompletions();
                    this.onDidChangeEmitter.fire();
                }
            }));
            this._register(this.editor.onDidChangeModelContent((e) => {
                var _a;
                // Call this in case `onDidChangeModelContent` calls us first.
                (_a = this.cache.value) === null || _a === void 0 ? void 0 : _a.updateRanges();
                this.updateFilteredInlineCompletions();
                this.scheduleAutomaticUpdate();
            }));
            this._register(this.registry.onDidChange(() => {
                this.updateSoon.schedule(this.debounce.get(this.editor.getModel()));
            }));
            this.scheduleAutomaticUpdate();
        }
        updateFilteredInlineCompletions() {
            if (!this.cache.value) {
                this.filteredCompletions = [];
                return;
            }
            const model = this.editor.getModel();
            const cursorPosition = model.validatePosition(this.editor.getPosition());
            this.filteredCompletions = this.cache.value.completions.filter(c => {
                const originalValue = model.getValueInRange(c.synchronizedRange).toLowerCase();
                const filterText = c.inlineCompletion.filterText.toLowerCase();
                const indent = model.getLineIndentColumn(c.synchronizedRange.startLineNumber);
                const cursorPosIndex = Math.max(0, cursorPosition.column - c.synchronizedRange.startColumn);
                let filterTextBefore = filterText.substring(0, cursorPosIndex);
                let filterTextAfter = filterText.substring(cursorPosIndex);
                let originalValueBefore = originalValue.substring(0, cursorPosIndex);
                let originalValueAfter = originalValue.substring(cursorPosIndex);
                if (c.synchronizedRange.startColumn <= indent) {
                    // Remove indentation
                    originalValueBefore = originalValueBefore.trimStart();
                    if (originalValueBefore.length === 0) {
                        originalValueAfter = originalValueAfter.trimStart();
                    }
                    filterTextBefore = filterTextBefore.trimStart();
                    if (filterTextBefore.length === 0) {
                        filterTextAfter = filterTextAfter.trimStart();
                    }
                }
                return filterTextBefore.startsWith(originalValueBefore)
                    && (0, filters_1.matchesSubString)(originalValueAfter, filterTextAfter);
            });
        }
        fixAndGetIndexOfCurrentSelection() {
            if (!this.currentlySelectedCompletionId || !this.cache.value) {
                return 0;
            }
            if (this.cache.value.completions.length === 0) {
                // don't reset the selection in this case
                return 0;
            }
            const idx = this.filteredCompletions.findIndex(v => v.semanticId === this.currentlySelectedCompletionId);
            if (idx === -1) {
                // Reset the selection so that the selection does not jump back when it appears again
                this.currentlySelectedCompletionId = undefined;
                return 0;
            }
            return idx;
        }
        get currentCachedCompletion() {
            if (!this.cache.value) {
                return undefined;
            }
            return this.filteredCompletions[this.fixAndGetIndexOfCurrentSelection()];
        }
        async showNextInlineCompletion() {
            await this.ensureUpdateWithExplicitContext();
            const completions = this.filteredCompletions || [];
            if (completions.length > 0) {
                const newIdx = (this.fixAndGetIndexOfCurrentSelection() + 1) % completions.length;
                this.currentlySelectedCompletionId = completions[newIdx].semanticId;
            }
            else {
                this.currentlySelectedCompletionId = undefined;
            }
            this.onDidChangeEmitter.fire();
        }
        async showPreviousInlineCompletion() {
            await this.ensureUpdateWithExplicitContext();
            const completions = this.filteredCompletions || [];
            if (completions.length > 0) {
                const newIdx = (this.fixAndGetIndexOfCurrentSelection() + completions.length - 1) % completions.length;
                this.currentlySelectedCompletionId = completions[newIdx].semanticId;
            }
            else {
                this.currentlySelectedCompletionId = undefined;
            }
            this.onDidChangeEmitter.fire();
        }
        async ensureUpdateWithExplicitContext() {
            var _a;
            if (this.updateOperation.value) {
                // Restart or wait for current update operation
                if (this.updateOperation.value.triggerKind === languages_1.InlineCompletionTriggerKind.Explicit) {
                    await this.updateOperation.value.promise;
                }
                else {
                    await this.update(languages_1.InlineCompletionTriggerKind.Explicit);
                }
            }
            else if (((_a = this.cache.value) === null || _a === void 0 ? void 0 : _a.triggerKind) !== languages_1.InlineCompletionTriggerKind.Explicit) {
                // Refresh cache
                await this.update(languages_1.InlineCompletionTriggerKind.Explicit);
            }
        }
        async hasMultipleInlineCompletions() {
            var _a;
            await this.ensureUpdateWithExplicitContext();
            return (((_a = this.cache.value) === null || _a === void 0 ? void 0 : _a.completions.length) || 0) > 1;
        }
        //#endregion
        get ghostText() {
            const currentCompletion = this.currentCompletion;
            if (!currentCompletion) {
                return undefined;
            }
            const cursorPosition = this.editor.getPosition();
            if (currentCompletion.range.getEndPosition().isBefore(cursorPosition)) {
                return undefined;
            }
            const mode = this.editor.getOptions().get(55 /* EditorOption.inlineSuggest */).mode;
            const ghostText = (0, inlineCompletionToGhostText_1.inlineCompletionToGhostText)(currentCompletion, this.editor.getModel(), mode, cursorPosition);
            if (ghostText) {
                if (ghostText.isEmpty()) {
                    return undefined;
                }
                return ghostText;
            }
            return new ghostText_1.GhostTextReplacement(currentCompletion.range.startLineNumber, currentCompletion.range.startColumn, currentCompletion.range.endColumn - currentCompletion.range.startColumn, currentCompletion.insertText.split('\n'), 0);
        }
        get currentCompletion() {
            const completion = this.currentCachedCompletion;
            if (!completion) {
                return undefined;
            }
            return completion.toLiveInlineCompletion();
        }
        get isValid() {
            return this.editor.getPosition().lineNumber === this.triggerPosition.lineNumber;
        }
        scheduleAutomaticUpdate() {
            // Since updateSoon debounces, starvation can happen.
            // To prevent stale cache, we clear the current update operation.
            this.updateOperation.clear();
            this.updateSoon.schedule(this.debounce.get(this.editor.getModel()));
        }
        async update(triggerKind) {
            if (!this.shouldUpdate()) {
                return;
            }
            const position = this.editor.getPosition();
            const startTime = new Date();
            const promise = (0, async_1.createCancelablePromise)(async (token) => {
                let result;
                try {
                    result = await provideInlineCompletions(this.registry, position, this.editor.getModel(), { triggerKind, selectedSuggestionInfo: undefined }, token, this.languageConfigurationService);
                    const endTime = new Date();
                    this.debounce.update(this.editor.getModel(), endTime.getTime() - startTime.getTime());
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                    return;
                }
                if (token.isCancellationRequested) {
                    return;
                }
                this.cache.setValue(this.editor, result, triggerKind);
                this.updateFilteredInlineCompletions();
                this.onDidChangeEmitter.fire();
            });
            const operation = new UpdateOperation(promise, triggerKind);
            this.updateOperation.value = operation;
            await promise;
            if (this.updateOperation.value === operation) {
                this.updateOperation.clear();
            }
        }
        takeOwnership(disposable) {
            this._register(disposable);
        }
        commitCurrentCompletion() {
            const ghostText = this.ghostText;
            if (!ghostText) {
                // No ghost text was shown for this completion.
                // Thus, we don't want to commit anything.
                return;
            }
            const completion = this.currentCompletion;
            if (completion) {
                this.commit(completion);
            }
        }
        commit(completion) {
            var _a;
            // Mark the cache as stale, but don't dispose it yet,
            // otherwise command args might get disposed.
            const cache = this.cache.clearAndLeak();
            if (completion.snippetInfo) {
                this.editor.executeEdits('inlineSuggestion.accept', [
                    editOperation_1.EditOperation.replaceMove(completion.range, ''),
                    ...completion.additionalTextEdits
                ]);
                this.editor.setPosition(completion.snippetInfo.range.getStartPosition());
                (_a = snippetController2_1.SnippetController2.get(this.editor)) === null || _a === void 0 ? void 0 : _a.insert(completion.snippetInfo.snippet);
            }
            else {
                this.editor.executeEdits('inlineSuggestion.accept', [
                    editOperation_1.EditOperation.replaceMove(completion.range, completion.insertText),
                    ...completion.additionalTextEdits
                ]);
            }
            if (completion.command) {
                this.commandService
                    .executeCommand(completion.command.id, ...(completion.command.arguments || []))
                    .finally(() => {
                    cache === null || cache === void 0 ? void 0 : cache.dispose();
                })
                    .then(undefined, errors_1.onUnexpectedExternalError);
            }
            else {
                cache === null || cache === void 0 ? void 0 : cache.dispose();
            }
            this.onDidChangeEmitter.fire();
        }
        get commands() {
            var _a;
            const lists = new Set(((_a = this.cache.value) === null || _a === void 0 ? void 0 : _a.completions.map(c => c.inlineCompletion.sourceInlineCompletions)) || []);
            return [...lists].flatMap(l => l.commands || []);
        }
    }
    exports.InlineCompletionsSession = InlineCompletionsSession;
    class UpdateOperation {
        constructor(promise, triggerKind) {
            this.promise = promise;
            this.triggerKind = triggerKind;
        }
        dispose() {
            this.promise.cancel();
        }
    }
    exports.UpdateOperation = UpdateOperation;
    /**
     * The cache keeps itself in sync with the editor.
     * It also owns the completions result and disposes it when the cache is diposed.
    */
    class SynchronizedInlineCompletionsCache extends lifecycle_1.Disposable {
        constructor(completionsSource, editor, onChange, triggerKind) {
            super();
            this.editor = editor;
            this.onChange = onChange;
            this.triggerKind = triggerKind;
            this.isDisposing = false;
            const decorationIds = editor.deltaDecorations([], completionsSource.items.map(i => ({
                range: i.range,
                options: {
                    description: 'inline-completion-tracking-range'
                },
            })));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.isDisposing = true;
                editor.deltaDecorations(decorationIds, []);
            }));
            this.completions = completionsSource.items.map((c, idx) => new CachedInlineCompletion(c, decorationIds[idx]));
            this._register(editor.onDidChangeModelContent(() => {
                this.updateRanges();
            }));
            this._register(completionsSource);
        }
        updateRanges() {
            if (this.isDisposing) {
                return;
            }
            let hasChanged = false;
            const model = this.editor.getModel();
            for (const c of this.completions) {
                const newRange = model.getDecorationRange(c.decorationId);
                if (!newRange) {
                    (0, errors_1.onUnexpectedError)(new Error('Decoration has no range'));
                    continue;
                }
                if (!c.synchronizedRange.equalsRange(newRange)) {
                    hasChanged = true;
                    c.synchronizedRange = newRange;
                }
            }
            if (hasChanged) {
                this.onChange();
            }
        }
    }
    exports.SynchronizedInlineCompletionsCache = SynchronizedInlineCompletionsCache;
    class CachedInlineCompletion {
        constructor(inlineCompletion, decorationId) {
            this.inlineCompletion = inlineCompletion;
            this.decorationId = decorationId;
            this.semanticId = JSON.stringify({
                text: this.inlineCompletion.insertText,
                abbreviation: this.inlineCompletion.filterText,
                startLine: this.inlineCompletion.range.startLineNumber,
                startColumn: this.inlineCompletion.range.startColumn,
                command: this.inlineCompletion.command
            });
            this.synchronizedRange = inlineCompletion.range;
        }
        toLiveInlineCompletion() {
            return {
                insertText: this.inlineCompletion.insertText,
                range: this.synchronizedRange,
                command: this.inlineCompletion.command,
                sourceProvider: this.inlineCompletion.sourceProvider,
                sourceInlineCompletions: this.inlineCompletion.sourceInlineCompletions,
                sourceInlineCompletion: this.inlineCompletion.sourceInlineCompletion,
                snippetInfo: this.inlineCompletion.snippetInfo,
                filterText: this.inlineCompletion.filterText,
                additionalTextEdits: this.inlineCompletion.additionalTextEdits,
            };
        }
    }
    async function provideInlineCompletions(registry, position, model, context, token = cancellation_1.CancellationToken.None, languageConfigurationService) {
        const defaultReplaceRange = getDefaultRange(position, model);
        const providers = registry.all(model);
        const results = await Promise.all(providers.map(async (provider) => {
            const completions = await Promise.resolve(provider.provideInlineCompletions(model, position, context, token)).catch(errors_1.onUnexpectedExternalError);
            return ({
                completions,
                provider,
                dispose: () => {
                    if (completions) {
                        provider.freeInlineCompletions(completions);
                    }
                }
            });
        }));
        const itemsByHash = new Map();
        for (const result of results) {
            const completions = result.completions;
            if (!completions) {
                continue;
            }
            for (const item of completions.items) {
                const range = item.range ? range_1.Range.lift(item.range) : defaultReplaceRange;
                if (range.startLineNumber !== range.endLineNumber) {
                    // Ignore invalid ranges.
                    continue;
                }
                let insertText;
                let snippetInfo;
                if (typeof item.insertText === 'string') {
                    insertText = item.insertText;
                    if (languageConfigurationService && item.completeBracketPairs) {
                        insertText = closeBrackets(insertText, range.getStartPosition(), model, languageConfigurationService);
                    }
                    snippetInfo = undefined;
                }
                else if ('snippet' in item.insertText) {
                    const snippet = new snippetParser_1.SnippetParser().parse(item.insertText.snippet);
                    insertText = snippet.toString();
                    snippetInfo = {
                        snippet: item.insertText.snippet,
                        range: range
                    };
                }
                else {
                    (0, types_1.assertNever)(item.insertText);
                }
                const trackedItem = ({
                    insertText,
                    snippetInfo,
                    range,
                    command: item.command,
                    sourceProvider: result.provider,
                    sourceInlineCompletions: completions,
                    sourceInlineCompletion: item,
                    filterText: item.filterText || insertText,
                    additionalTextEdits: item.additionalTextEdits || (0, utils_1.getReadonlyEmptyArray)()
                });
                itemsByHash.set(JSON.stringify({ insertText, range: item.range }), trackedItem);
            }
        }
        return {
            items: [...itemsByHash.values()],
            dispose: () => {
                for (const result of results) {
                    result.dispose();
                }
            },
        };
    }
    exports.provideInlineCompletions = provideInlineCompletions;
    function getDefaultRange(position, model) {
        const word = model.getWordAtPosition(position);
        const maxColumn = model.getLineMaxColumn(position.lineNumber);
        // By default, always replace up until the end of the current line.
        // This default might be subject to change!
        return word
            ? new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, maxColumn)
            : range_1.Range.fromPositions(position, position.with(undefined, maxColumn));
    }
    function closeBrackets(text, position, model, languageConfigurationService) {
        const lineStart = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
        const newLine = lineStart + text;
        const newTokens = model.tokenization.tokenizeLineWithEdit(position, newLine.length - (position.column - 1), text);
        const slicedTokens = newTokens === null || newTokens === void 0 ? void 0 : newTokens.sliceAndInflate(position.column - 1, newLine.length, 0);
        if (!slicedTokens) {
            return text;
        }
        const newText = (0, fixBrackets_1.fixBracketsInLine)(slicedTokens, languageConfigurationService);
        return newText;
    }
});
//# sourceMappingURL=inlineCompletionsModel.js.map