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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "./ghostText", "./inlineCompletionsModel", "./inlineCompletionToGhostText", "./suggestWidgetInlineCompletionProvider"], function (require, exports, async_1, errors_1, lifecycle_1, languages_1, languageFeatures_1, ghostText_1, inlineCompletionsModel_1, inlineCompletionToGhostText_1, suggestWidgetInlineCompletionProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestWidgetPreviewModel = void 0;
    let SuggestWidgetPreviewModel = class SuggestWidgetPreviewModel extends ghostText_1.BaseGhostTextWidgetModel {
        constructor(editor, cache, languageFeaturesService) {
            super(editor);
            this.cache = cache;
            this.languageFeaturesService = languageFeaturesService;
            this.suggestionInlineCompletionSource = this._register(new suggestWidgetInlineCompletionProvider_1.SuggestWidgetInlineCompletionProvider(this.editor, 
            // Use the first cache item (if any) as preselection.
            () => { var _a, _b; return (_b = (_a = this.cache.value) === null || _a === void 0 ? void 0 : _a.completions[0]) === null || _b === void 0 ? void 0 : _b.toLiveInlineCompletion(); }));
            this.updateOperation = this._register(new lifecycle_1.MutableDisposable());
            this.updateCacheSoon = this._register(new async_1.RunOnceScheduler(() => this.updateCache(), 50));
            this.minReservedLineCount = 0;
            this._register(this.suggestionInlineCompletionSource.onDidChange(() => {
                if (!this.editor.hasModel()) {
                    // onDidChange might be called when calling setModel on the editor, before we are disposed.
                    return;
                }
                this.updateCacheSoon.schedule();
                const suggestWidgetState = this.suggestionInlineCompletionSource.state;
                if (!suggestWidgetState) {
                    this.minReservedLineCount = 0;
                }
                const newGhostText = this.ghostText;
                if (newGhostText) {
                    this.minReservedLineCount = Math.max(this.minReservedLineCount, sum(newGhostText.parts.map(p => p.lines.length - 1)));
                }
                if (this.minReservedLineCount >= 1) {
                    this.suggestionInlineCompletionSource.forceRenderingAbove();
                }
                else {
                    this.suggestionInlineCompletionSource.stopForceRenderingAbove();
                }
                this.onDidChangeEmitter.fire();
            }));
            this._register(this.cache.onDidChange(() => {
                this.onDidChangeEmitter.fire();
            }));
            this._register(this.editor.onDidChangeCursorPosition((e) => {
                this.minReservedLineCount = 0;
                this.updateCacheSoon.schedule();
                this.onDidChangeEmitter.fire();
            }));
            this._register((0, lifecycle_1.toDisposable)(() => this.suggestionInlineCompletionSource.stopForceRenderingAbove()));
        }
        get isActive() {
            return this.suggestionInlineCompletionSource.state !== undefined;
        }
        isSuggestionPreviewEnabled() {
            const suggestOptions = this.editor.getOption(106 /* EditorOption.suggest */);
            return suggestOptions.preview;
        }
        async updateCache() {
            const state = this.suggestionInlineCompletionSource.state;
            if (!state || !state.selectedItem) {
                return;
            }
            const info = {
                text: state.selectedItem.normalizedInlineCompletion.insertText,
                range: state.selectedItem.normalizedInlineCompletion.range,
                isSnippetText: state.selectedItem.isSnippetText,
                completionKind: state.selectedItem.completionItemKind,
            };
            const position = this.editor.getPosition();
            if (state.selectedItem.isSnippetText ||
                state.selectedItem.completionItemKind === 27 /* CompletionItemKind.Snippet */ ||
                state.selectedItem.completionItemKind === 20 /* CompletionItemKind.File */ ||
                state.selectedItem.completionItemKind === 23 /* CompletionItemKind.Folder */) {
                // Don't ask providers for these types of suggestions.
                this.cache.clear();
                return;
            }
            const promise = (0, async_1.createCancelablePromise)(async (token) => {
                let result;
                try {
                    result = await (0, inlineCompletionsModel_1.provideInlineCompletions)(this.languageFeaturesService.inlineCompletionsProvider, position, this.editor.getModel(), { triggerKind: languages_1.InlineCompletionTriggerKind.Automatic, selectedSuggestionInfo: info }, token);
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                    return;
                }
                if (token.isCancellationRequested) {
                    result.dispose();
                    return;
                }
                this.cache.setValue(this.editor, result, languages_1.InlineCompletionTriggerKind.Automatic);
                this.onDidChangeEmitter.fire();
            });
            const operation = new inlineCompletionsModel_1.UpdateOperation(promise, languages_1.InlineCompletionTriggerKind.Automatic);
            this.updateOperation.value = operation;
            await promise;
            if (this.updateOperation.value === operation) {
                this.updateOperation.clear();
            }
        }
        get ghostText() {
            var _a, _b, _c;
            const isSuggestionPreviewEnabled = this.isSuggestionPreviewEnabled();
            const model = this.editor.getModel();
            const augmentedCompletion = (0, inlineCompletionToGhostText_1.minimizeInlineCompletion)(model, (_b = (_a = this.cache.value) === null || _a === void 0 ? void 0 : _a.completions[0]) === null || _b === void 0 ? void 0 : _b.toLiveInlineCompletion());
            const suggestWidgetState = this.suggestionInlineCompletionSource.state;
            const suggestInlineCompletion = (0, inlineCompletionToGhostText_1.minimizeInlineCompletion)(model, (_c = suggestWidgetState === null || suggestWidgetState === void 0 ? void 0 : suggestWidgetState.selectedItem) === null || _c === void 0 ? void 0 : _c.normalizedInlineCompletion);
            const isAugmentedCompletionValid = augmentedCompletion
                && suggestInlineCompletion
                && augmentedCompletion.insertText.startsWith(suggestInlineCompletion.insertText)
                && augmentedCompletion.range.equalsRange(suggestInlineCompletion.range);
            if (!isSuggestionPreviewEnabled && !isAugmentedCompletionValid) {
                return undefined;
            }
            // If the augmented completion is not valid and there is no suggest inline completion, we still show the augmented completion.
            const finalCompletion = isAugmentedCompletionValid ? augmentedCompletion : (suggestInlineCompletion || augmentedCompletion);
            const inlineCompletionPreviewLength = isAugmentedCompletionValid ? finalCompletion.insertText.length - suggestInlineCompletion.insertText.length : 0;
            const newGhostText = this.toGhostText(finalCompletion, inlineCompletionPreviewLength);
            return newGhostText;
        }
        toGhostText(completion, inlineCompletionPreviewLength) {
            const mode = this.editor.getOptions().get(106 /* EditorOption.suggest */).previewMode;
            return completion
                ? ((0, inlineCompletionToGhostText_1.inlineCompletionToGhostText)(completion, this.editor.getModel(), mode, this.editor.getPosition(), inlineCompletionPreviewLength) ||
                    // Show an invisible ghost text to reserve space
                    new ghostText_1.GhostText(completion.range.endLineNumber, [], this.minReservedLineCount))
                : undefined;
        }
    };
    SuggestWidgetPreviewModel = __decorate([
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], SuggestWidgetPreviewModel);
    exports.SuggestWidgetPreviewModel = SuggestWidgetPreviewModel;
    function sum(arr) {
        return arr.reduce((a, b) => a + b, 0);
    }
});
//# sourceMappingURL=suggestWidgetPreviewModel.js.map