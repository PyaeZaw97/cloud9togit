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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/selection", "vs/editor/common/services/editorWorker", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/wordDistance", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "./completionModel", "./suggest", "vs/editor/common/services/languageFeatures"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, strings_1, selection_1, editorWorker_1, snippetController2_1, wordDistance_1, clipboardService_1, configuration_1, contextkey_1, log_1, telemetry_1, completionModel_1, suggest_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestModel = exports.State = exports.LineContext = void 0;
    class LineContext {
        constructor(model, position, auto, shy) {
            this.leadingLineContent = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
            this.leadingWord = model.getWordUntilPosition(position);
            this.lineNumber = position.lineNumber;
            this.column = position.column;
            this.auto = auto;
            this.shy = shy;
        }
        static shouldAutoTrigger(editor) {
            if (!editor.hasModel()) {
                return false;
            }
            const model = editor.getModel();
            const pos = editor.getPosition();
            model.tokenization.tokenizeIfCheap(pos.lineNumber);
            const word = model.getWordAtPosition(pos);
            if (!word) {
                return false;
            }
            if (word.endColumn !== pos.column) {
                return false;
            }
            if (!isNaN(Number(word.word))) {
                return false;
            }
            return true;
        }
    }
    exports.LineContext = LineContext;
    var State;
    (function (State) {
        State[State["Idle"] = 0] = "Idle";
        State[State["Manual"] = 1] = "Manual";
        State[State["Auto"] = 2] = "Auto";
    })(State = exports.State || (exports.State = {}));
    function isSuggestPreviewEnabled(editor) {
        return editor.getOption(106 /* EditorOption.suggest */).preview;
    }
    function canShowQuickSuggest(editor, contextKeyService, configurationService) {
        if (!Boolean(contextKeyService.getContextKeyValue('inlineSuggestionVisible'))) {
            // Allow if there is no inline suggestion.
            return true;
        }
        const allowQuickSuggestions = configurationService.getValue('editor.inlineSuggest.allowQuickSuggestions');
        if (allowQuickSuggestions !== undefined) {
            // Use setting if available.
            return Boolean(allowQuickSuggestions);
        }
        // Don't allow if inline suggestions are visible and no suggest preview is configured.
        // TODO disabled for copilot
        return false && isSuggestPreviewEnabled(editor);
    }
    function canShowSuggestOnTriggerCharacters(editor, contextKeyService, configurationService) {
        if (!Boolean(contextKeyService.getContextKeyValue('inlineSuggestionVisible'))) {
            // Allow if there is no inline suggestion.
            return true;
        }
        const allowQuickSuggestions = configurationService.getValue('editor.inlineSuggest.allowSuggestOnTriggerCharacters');
        if (allowQuickSuggestions !== undefined) {
            // Use setting if available.
            return Boolean(allowQuickSuggestions);
        }
        // Don't allow if inline suggestions are visible and no suggest preview is configured.
        // TODO disabled for copilot
        return false && isSuggestPreviewEnabled(editor);
    }
    let SuggestModel = class SuggestModel {
        constructor(_editor, _editorWorkerService, _clipboardService, _telemetryService, _logService, _contextKeyService, _configurationService, _languageFeaturesService) {
            this._editor = _editor;
            this._editorWorkerService = _editorWorkerService;
            this._clipboardService = _clipboardService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._triggerCharacterListener = new lifecycle_1.DisposableStore();
            this._triggerQuickSuggest = new async_1.TimeoutTimer();
            this._state = 0 /* State.Idle */;
            this._completionDisposables = new lifecycle_1.DisposableStore();
            this._onDidCancel = new event_1.Emitter();
            this._onDidTrigger = new event_1.Emitter();
            this._onDidSuggest = new event_1.Emitter();
            this.onDidCancel = this._onDidCancel.event;
            this.onDidTrigger = this._onDidTrigger.event;
            this.onDidSuggest = this._onDidSuggest.event;
            this._telemetryGate = 0;
            this._currentSelection = this._editor.getSelection() || new selection_1.Selection(1, 1, 1, 1);
            // wire up various listeners
            this._toDispose.add(this._editor.onDidChangeModel(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeModelLanguage(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeConfiguration(() => {
                this._updateTriggerCharacters();
            }));
            this._toDispose.add(this._languageFeaturesService.completionProvider.onDidChange(() => {
                this._updateTriggerCharacters();
                this._updateActiveSuggestSession();
            }));
            let editorIsComposing = false;
            this._toDispose.add(this._editor.onDidCompositionStart(() => {
                editorIsComposing = true;
            }));
            this._toDispose.add(this._editor.onDidCompositionEnd(() => {
                editorIsComposing = false;
                this._onCompositionEnd();
            }));
            this._toDispose.add(this._editor.onDidChangeCursorSelection(e => {
                // only trigger suggest when the editor isn't composing a character
                if (!editorIsComposing) {
                    this._onCursorChange(e);
                }
            }));
            this._toDispose.add(this._editor.onDidChangeModelContent(() => {
                // only filter completions when the editor isn't composing a character
                // allow-any-unicode-next-line
                // e.g. ¨ + u makes ü but just ¨ cannot be used for filtering
                if (!editorIsComposing) {
                    this._refilterCompletionItems();
                }
            }));
            this._updateTriggerCharacters();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._triggerCharacterListener);
            (0, lifecycle_1.dispose)([this._onDidCancel, this._onDidSuggest, this._onDidTrigger, this._triggerQuickSuggest]);
            this._toDispose.dispose();
            this._completionDisposables.dispose();
            this.cancel();
        }
        _updateTriggerCharacters() {
            this._triggerCharacterListener.clear();
            if (this._editor.getOption(81 /* EditorOption.readOnly */)
                || !this._editor.hasModel()
                || !this._editor.getOption(109 /* EditorOption.suggestOnTriggerCharacters */)) {
                return;
            }
            const supportsByTriggerCharacter = new Map();
            for (const support of this._languageFeaturesService.completionProvider.all(this._editor.getModel())) {
                for (const ch of support.triggerCharacters || []) {
                    let set = supportsByTriggerCharacter.get(ch);
                    if (!set) {
                        set = new Set();
                        set.add((0, suggest_1.getSnippetSuggestSupport)());
                        supportsByTriggerCharacter.set(ch, set);
                    }
                    set.add(support);
                }
            }
            const checkTriggerCharacter = (text) => {
                if (!canShowSuggestOnTriggerCharacters(this._editor, this._contextKeyService, this._configurationService)) {
                    return;
                }
                if (LineContext.shouldAutoTrigger(this._editor)) {
                    // don't trigger by trigger characters when this is a case for quick suggest
                    return;
                }
                if (!text) {
                    // came here from the compositionEnd-event
                    const position = this._editor.getPosition();
                    const model = this._editor.getModel();
                    text = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
                }
                let lastChar = '';
                if ((0, strings_1.isLowSurrogate)(text.charCodeAt(text.length - 1))) {
                    if ((0, strings_1.isHighSurrogate)(text.charCodeAt(text.length - 2))) {
                        lastChar = text.substr(text.length - 2);
                    }
                }
                else {
                    lastChar = text.charAt(text.length - 1);
                }
                const supports = supportsByTriggerCharacter.get(lastChar);
                if (supports) {
                    // keep existing items that where not computed by the
                    // supports/providers that want to trigger now
                    const existing = this._completionModel
                        ? { items: this._completionModel.adopt(supports), clipboardText: this._completionModel.clipboardText }
                        : undefined;
                    this.trigger({ auto: true, shy: false, triggerCharacter: lastChar }, Boolean(this._completionModel), supports, existing);
                }
            };
            this._triggerCharacterListener.add(this._editor.onDidType(checkTriggerCharacter));
            this._triggerCharacterListener.add(this._editor.onDidCompositionEnd(() => checkTriggerCharacter()));
        }
        // --- trigger/retrigger/cancel suggest
        get state() {
            return this._state;
        }
        cancel(retrigger = false) {
            var _a;
            if (this._state !== 0 /* State.Idle */) {
                this._triggerQuickSuggest.cancel();
                (_a = this._requestToken) === null || _a === void 0 ? void 0 : _a.cancel();
                this._requestToken = undefined;
                this._state = 0 /* State.Idle */;
                this._completionModel = undefined;
                this._context = undefined;
                this._onDidCancel.fire({ retrigger });
            }
        }
        clear() {
            this._completionDisposables.clear();
        }
        _updateActiveSuggestSession() {
            if (this._state !== 0 /* State.Idle */) {
                if (!this._editor.hasModel() || !this._languageFeaturesService.completionProvider.has(this._editor.getModel())) {
                    this.cancel();
                }
                else {
                    this.trigger({ auto: this._state === 2 /* State.Auto */, shy: false }, true);
                }
            }
        }
        _onCursorChange(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            const prevSelection = this._currentSelection;
            this._currentSelection = this._editor.getSelection();
            if (!e.selection.isEmpty()
                || (e.reason !== 0 /* CursorChangeReason.NotSet */ && e.reason !== 3 /* CursorChangeReason.Explicit */)
                || (e.source !== 'keyboard' && e.source !== 'deleteLeft')) {
                // Early exit if nothing needs to be done!
                // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                this.cancel();
                return;
            }
            if (this._state === 0 /* State.Idle */ && e.reason === 0 /* CursorChangeReason.NotSet */) {
                if (prevSelection.containsRange(this._currentSelection) || prevSelection.getEndPosition().isBeforeOrEqual(this._currentSelection.getPosition())) {
                    // cursor did move RIGHT due to typing -> trigger quick suggest
                    this._doTriggerQuickSuggest();
                }
            }
            else if (this._state !== 0 /* State.Idle */ && e.reason === 3 /* CursorChangeReason.Explicit */) {
                // suggest is active and something like cursor keys are used to move
                // the cursor. this means we can refilter at the new position
                this._refilterCompletionItems();
            }
        }
        _onCompositionEnd() {
            // trigger or refilter when composition ends
            if (this._state === 0 /* State.Idle */) {
                this._doTriggerQuickSuggest();
            }
            else {
                this._refilterCompletionItems();
            }
        }
        _doTriggerQuickSuggest() {
            var _a;
            if (suggest_1.QuickSuggestionsOptions.isAllOff(this._editor.getOption(79 /* EditorOption.quickSuggestions */))) {
                // not enabled
                return;
            }
            if (this._editor.getOption(106 /* EditorOption.suggest */).snippetsPreventQuickSuggestions && ((_a = snippetController2_1.SnippetController2.get(this._editor)) === null || _a === void 0 ? void 0 : _a.isInSnippet())) {
                // no quick suggestion when in snippet mode
                return;
            }
            this.cancel();
            this._triggerQuickSuggest.cancelAndSet(() => {
                if (this._state !== 0 /* State.Idle */) {
                    return;
                }
                if (!LineContext.shouldAutoTrigger(this._editor)) {
                    return;
                }
                if (!this._editor.hasModel() || !this._editor.hasWidgetFocus()) {
                    return;
                }
                const model = this._editor.getModel();
                const pos = this._editor.getPosition();
                // validate enabled now
                const config = this._editor.getOption(79 /* EditorOption.quickSuggestions */);
                if (suggest_1.QuickSuggestionsOptions.isAllOff(config)) {
                    return;
                }
                if (!suggest_1.QuickSuggestionsOptions.isAllOn(config)) {
                    // Check the type of the token that triggered this
                    model.tokenization.tokenizeIfCheap(pos.lineNumber);
                    const lineTokens = model.tokenization.getLineTokens(pos.lineNumber);
                    const tokenType = lineTokens.getStandardTokenType(lineTokens.findTokenIndexAtOffset(Math.max(pos.column - 1 - 1, 0)));
                    if (suggest_1.QuickSuggestionsOptions.valueFor(config, tokenType) !== 'on') {
                        return;
                    }
                }
                if (!canShowQuickSuggest(this._editor, this._contextKeyService, this._configurationService)) {
                    // do not trigger quick suggestions if inline suggestions are shown
                    return;
                }
                if (!this._languageFeaturesService.completionProvider.has(model)) {
                    return;
                }
                // we made it till here -> trigger now
                this.trigger({ auto: true, shy: false });
            }, this._editor.getOption(80 /* EditorOption.quickSuggestionsDelay */));
        }
        _refilterCompletionItems() {
            // Re-filter suggestions. This MUST run async because filtering/scoring
            // uses the model content AND the cursor position. The latter is NOT
            // updated when the document has changed (the event which drives this method)
            // and therefore a little pause (next mirco task) is needed. See:
            // https://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context#25933985
            Promise.resolve().then(() => {
                if (this._state === 0 /* State.Idle */) {
                    return;
                }
                if (!this._editor.hasModel()) {
                    return;
                }
                const model = this._editor.getModel();
                const position = this._editor.getPosition();
                const ctx = new LineContext(model, position, this._state === 2 /* State.Auto */, false);
                this._onNewContext(ctx);
            });
        }
        trigger(context, retrigger = false, onlyFrom, existing, noFilter) {
            var _a;
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const auto = context.auto;
            const ctx = new LineContext(model, this._editor.getPosition(), auto, context.shy);
            // Cancel previous requests, change state & update UI
            this.cancel(retrigger);
            this._state = auto ? 2 /* State.Auto */ : 1 /* State.Manual */;
            this._onDidTrigger.fire({ auto, shy: context.shy, position: this._editor.getPosition() });
            // Capture context when request was sent
            this._context = ctx;
            // Build context for request
            let suggestCtx = { triggerKind: (_a = context.triggerKind) !== null && _a !== void 0 ? _a : 0 /* CompletionTriggerKind.Invoke */ };
            if (context.triggerCharacter) {
                suggestCtx = {
                    triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */,
                    triggerCharacter: context.triggerCharacter
                };
            }
            this._requestToken = new cancellation_1.CancellationTokenSource();
            // kind filter and snippet sort rules
            const snippetSuggestions = this._editor.getOption(101 /* EditorOption.snippetSuggestions */);
            let snippetSortOrder = 1 /* SnippetSortOrder.Inline */;
            switch (snippetSuggestions) {
                case 'top':
                    snippetSortOrder = 0 /* SnippetSortOrder.Top */;
                    break;
                // 	↓ that's the default anyways...
                // case 'inline':
                // 	snippetSortOrder = SnippetSortOrder.Inline;
                // 	break;
                case 'bottom':
                    snippetSortOrder = 2 /* SnippetSortOrder.Bottom */;
                    break;
            }
            const { itemKind: itemKindFilter, showDeprecated } = SuggestModel._createSuggestFilter(this._editor);
            const completionOptions = new suggest_1.CompletionOptions(snippetSortOrder, !noFilter ? itemKindFilter : new Set(), onlyFrom, showDeprecated);
            const wordDistance = wordDistance_1.WordDistance.create(this._editorWorkerService, this._editor);
            const completions = (0, suggest_1.provideSuggestionItems)(this._languageFeaturesService.completionProvider, model, this._editor.getPosition(), completionOptions, suggestCtx, this._requestToken.token);
            Promise.all([completions, wordDistance]).then(async ([completions, wordDistance]) => {
                var _a;
                (_a = this._requestToken) === null || _a === void 0 ? void 0 : _a.dispose();
                if (!this._editor.hasModel()) {
                    return;
                }
                let clipboardText = existing === null || existing === void 0 ? void 0 : existing.clipboardText;
                if (!clipboardText && completions.needsClipboard) {
                    clipboardText = await this._clipboardService.readText();
                }
                if (this._state === 0 /* State.Idle */) {
                    return;
                }
                const model = this._editor.getModel();
                let items = completions.items;
                if (existing) {
                    const cmpFn = (0, suggest_1.getSuggestionComparator)(snippetSortOrder);
                    items = items.concat(existing.items).sort(cmpFn);
                }
                const ctx = new LineContext(model, this._editor.getPosition(), auto, context.shy);
                this._completionModel = new completionModel_1.CompletionModel(items, this._context.column, {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                }, wordDistance, this._editor.getOption(106 /* EditorOption.suggest */), this._editor.getOption(101 /* EditorOption.snippetSuggestions */), undefined, clipboardText);
                // store containers so that they can be disposed later
                this._completionDisposables.add(completions.disposable);
                this._onNewContext(ctx);
                // finally report telemetry about durations
                this._reportDurationsTelemetry(completions.durations);
            }).catch(errors_1.onUnexpectedError);
        }
        _reportDurationsTelemetry(durations) {
            if (this._telemetryGate++ % 230 !== 0) {
                return;
            }
            setTimeout(() => {
                this._telemetryService.publicLog2('suggest.durations.json', { data: JSON.stringify(durations) });
                this._logService.debug('suggest.durations.json', durations);
            });
        }
        static _createSuggestFilter(editor) {
            // kind filter and snippet sort rules
            const result = new Set();
            // snippet setting
            const snippetSuggestions = editor.getOption(101 /* EditorOption.snippetSuggestions */);
            if (snippetSuggestions === 'none') {
                result.add(27 /* CompletionItemKind.Snippet */);
            }
            // type setting
            const suggestOptions = editor.getOption(106 /* EditorOption.suggest */);
            if (!suggestOptions.showMethods) {
                result.add(0 /* CompletionItemKind.Method */);
            }
            if (!suggestOptions.showFunctions) {
                result.add(1 /* CompletionItemKind.Function */);
            }
            if (!suggestOptions.showConstructors) {
                result.add(2 /* CompletionItemKind.Constructor */);
            }
            if (!suggestOptions.showFields) {
                result.add(3 /* CompletionItemKind.Field */);
            }
            if (!suggestOptions.showVariables) {
                result.add(4 /* CompletionItemKind.Variable */);
            }
            if (!suggestOptions.showClasses) {
                result.add(5 /* CompletionItemKind.Class */);
            }
            if (!suggestOptions.showStructs) {
                result.add(6 /* CompletionItemKind.Struct */);
            }
            if (!suggestOptions.showInterfaces) {
                result.add(7 /* CompletionItemKind.Interface */);
            }
            if (!suggestOptions.showModules) {
                result.add(8 /* CompletionItemKind.Module */);
            }
            if (!suggestOptions.showProperties) {
                result.add(9 /* CompletionItemKind.Property */);
            }
            if (!suggestOptions.showEvents) {
                result.add(10 /* CompletionItemKind.Event */);
            }
            if (!suggestOptions.showOperators) {
                result.add(11 /* CompletionItemKind.Operator */);
            }
            if (!suggestOptions.showUnits) {
                result.add(12 /* CompletionItemKind.Unit */);
            }
            if (!suggestOptions.showValues) {
                result.add(13 /* CompletionItemKind.Value */);
            }
            if (!suggestOptions.showConstants) {
                result.add(14 /* CompletionItemKind.Constant */);
            }
            if (!suggestOptions.showEnums) {
                result.add(15 /* CompletionItemKind.Enum */);
            }
            if (!suggestOptions.showEnumMembers) {
                result.add(16 /* CompletionItemKind.EnumMember */);
            }
            if (!suggestOptions.showKeywords) {
                result.add(17 /* CompletionItemKind.Keyword */);
            }
            if (!suggestOptions.showWords) {
                result.add(18 /* CompletionItemKind.Text */);
            }
            if (!suggestOptions.showColors) {
                result.add(19 /* CompletionItemKind.Color */);
            }
            if (!suggestOptions.showFiles) {
                result.add(20 /* CompletionItemKind.File */);
            }
            if (!suggestOptions.showReferences) {
                result.add(21 /* CompletionItemKind.Reference */);
            }
            if (!suggestOptions.showColors) {
                result.add(22 /* CompletionItemKind.Customcolor */);
            }
            if (!suggestOptions.showFolders) {
                result.add(23 /* CompletionItemKind.Folder */);
            }
            if (!suggestOptions.showTypeParameters) {
                result.add(24 /* CompletionItemKind.TypeParameter */);
            }
            if (!suggestOptions.showSnippets) {
                result.add(27 /* CompletionItemKind.Snippet */);
            }
            if (!suggestOptions.showUsers) {
                result.add(25 /* CompletionItemKind.User */);
            }
            if (!suggestOptions.showIssues) {
                result.add(26 /* CompletionItemKind.Issue */);
            }
            return { itemKind: result, showDeprecated: suggestOptions.showDeprecated };
        }
        _onNewContext(ctx) {
            if (!this._context) {
                // happens when 24x7 IntelliSense is enabled and still in its delay
                return;
            }
            if (ctx.lineNumber !== this._context.lineNumber) {
                // e.g. happens when pressing Enter while IntelliSense is computed
                this.cancel();
                return;
            }
            if ((0, strings_1.getLeadingWhitespace)(ctx.leadingLineContent) !== (0, strings_1.getLeadingWhitespace)(this._context.leadingLineContent)) {
                // cancel IntelliSense when line start changes
                // happens when the current word gets outdented
                this.cancel();
                return;
            }
            if (ctx.column < this._context.column) {
                // typed -> moved cursor LEFT -> retrigger if still on a word
                if (ctx.leadingWord.word) {
                    this.trigger({ auto: this._context.auto, shy: false }, true);
                }
                else {
                    this.cancel();
                }
                return;
            }
            if (!this._completionModel) {
                // happens when IntelliSense is not yet computed
                return;
            }
            if (ctx.leadingWord.word.length !== 0 && ctx.leadingWord.startColumn > this._context.leadingWord.startColumn) {
                // started a new word while IntelliSense shows -> retrigger
                // Select those providers have not contributed to this completion model and re-trigger completions for
                // them. Also adopt the existing items and merge them into the new completion model
                const inactiveProvider = new Set(this._languageFeaturesService.completionProvider.all(this._editor.getModel()));
                for (let provider of this._completionModel.allProvider) {
                    inactiveProvider.delete(provider);
                }
                const items = this._completionModel.adopt(new Set());
                this.trigger({ auto: this._context.auto, shy: false }, true, inactiveProvider, { items, clipboardText: this._completionModel.clipboardText });
                return;
            }
            if (ctx.column > this._context.column && this._completionModel.incomplete.size > 0 && ctx.leadingWord.word.length !== 0) {
                // typed -> moved cursor RIGHT & incomple model & still on a word -> retrigger
                const { incomplete } = this._completionModel;
                const items = this._completionModel.adopt(incomplete);
                this.trigger({ auto: this._state === 2 /* State.Auto */, shy: false, triggerKind: 2 /* CompletionTriggerKind.TriggerForIncompleteCompletions */ }, true, incomplete, { items, clipboardText: this._completionModel.clipboardText });
            }
            else {
                // typed -> moved cursor RIGHT -> update UI
                let oldLineContext = this._completionModel.lineContext;
                let isFrozen = false;
                this._completionModel.lineContext = {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                };
                if (this._completionModel.items.length === 0) {
                    if (LineContext.shouldAutoTrigger(this._editor) && this._context.leadingWord.endColumn < ctx.leadingWord.startColumn) {
                        // retrigger when heading into a new word
                        this.trigger({ auto: this._context.auto, shy: false }, true);
                        return;
                    }
                    if (!this._context.auto) {
                        // freeze when IntelliSense was manually requested
                        this._completionModel.lineContext = oldLineContext;
                        isFrozen = this._completionModel.items.length > 0;
                        if (isFrozen && ctx.leadingWord.word.length === 0) {
                            // there were results before but now there aren't
                            // and also we are not on a word anymore -> cancel
                            this.cancel();
                            return;
                        }
                    }
                    else {
                        // nothing left
                        this.cancel();
                        return;
                    }
                }
                this._onDidSuggest.fire({
                    completionModel: this._completionModel,
                    auto: this._context.auto,
                    shy: this._context.shy,
                    isFrozen,
                });
            }
        }
    };
    SuggestModel = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, log_1.ILogService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, languageFeatures_1.ILanguageFeaturesService)
    ], SuggestModel);
    exports.SuggestModel = SuggestModel;
});
//# sourceMappingURL=suggestModel.js.map