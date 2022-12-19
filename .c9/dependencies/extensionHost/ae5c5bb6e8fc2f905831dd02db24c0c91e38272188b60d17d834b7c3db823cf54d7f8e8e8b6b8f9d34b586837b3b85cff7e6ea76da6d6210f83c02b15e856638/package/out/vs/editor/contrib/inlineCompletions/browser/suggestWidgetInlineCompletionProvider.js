/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetSession", "vs/editor/contrib/suggest/browser/suggestController", "./inlineCompletionToGhostText"], function (require, exports, arrays_1, async_1, event_1, lifecycle_1, position_1, range_1, snippetParser_1, snippetSession_1, suggestController_1, inlineCompletionToGhostText_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rangeStartsWith = exports.SuggestWidgetInlineCompletionProvider = void 0;
    class SuggestWidgetInlineCompletionProvider extends lifecycle_1.Disposable {
        constructor(editor, suggestControllerPreselector) {
            super();
            this.editor = editor;
            this.suggestControllerPreselector = suggestControllerPreselector;
            this.isSuggestWidgetVisible = false;
            this.isShiftKeyPressed = false;
            this._isActive = false;
            this._currentSuggestItemInfo = undefined;
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            // This delay fixes a suggest widget issue when typing "." immediately restarts the suggestion session.
            this.setInactiveDelayed = this._register(new async_1.RunOnceScheduler(() => {
                if (!this.isSuggestWidgetVisible) {
                    if (this._isActive) {
                        this._isActive = false;
                        this.onDidChangeEmitter.fire();
                    }
                }
            }, 100));
            // See the command acceptAlternativeSelectedSuggestion that is bound to shift+tab
            this._register(editor.onKeyDown(e => {
                if (e.shiftKey && !this.isShiftKeyPressed) {
                    this.isShiftKeyPressed = true;
                    this.update(this._isActive);
                }
            }));
            this._register(editor.onKeyUp(e => {
                if (e.shiftKey && this.isShiftKeyPressed) {
                    this.isShiftKeyPressed = false;
                    this.update(this._isActive);
                }
            }));
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (suggestController) {
                this._register(suggestController.registerSelector({
                    priority: 100,
                    select: (model, pos, suggestItems) => {
                        const textModel = this.editor.getModel();
                        const normalizedItemToPreselect = (0, inlineCompletionToGhostText_1.minimizeInlineCompletion)(textModel, this.suggestControllerPreselector());
                        if (!normalizedItemToPreselect) {
                            return -1;
                        }
                        const position = position_1.Position.lift(pos);
                        const candidates = suggestItems
                            .map((suggestItem, index) => {
                            const inlineSuggestItem = suggestionToSuggestItemInfo(suggestController, position, suggestItem, this.isShiftKeyPressed);
                            const normalizedSuggestItem = (0, inlineCompletionToGhostText_1.minimizeInlineCompletion)(textModel, inlineSuggestItem === null || inlineSuggestItem === void 0 ? void 0 : inlineSuggestItem.normalizedInlineCompletion);
                            if (!normalizedSuggestItem) {
                                return undefined;
                            }
                            const valid = rangeStartsWith(normalizedItemToPreselect.range, normalizedSuggestItem.range) &&
                                normalizedItemToPreselect.insertText.startsWith(normalizedSuggestItem.insertText);
                            return { index, valid, prefixLength: normalizedSuggestItem.insertText.length, suggestItem };
                        })
                            .filter(item => item && item.valid);
                        const result = (0, arrays_1.findMaxBy)(candidates, (0, arrays_1.compareBy)(s => s.prefixLength, arrays_1.numberComparator));
                        return result ? result.index : -1;
                    }
                }));
                let isBoundToSuggestWidget = false;
                const bindToSuggestWidget = () => {
                    if (isBoundToSuggestWidget) {
                        return;
                    }
                    isBoundToSuggestWidget = true;
                    this._register(suggestController.widget.value.onDidShow(() => {
                        this.isSuggestWidgetVisible = true;
                        this.update(true);
                    }));
                    this._register(suggestController.widget.value.onDidHide(() => {
                        this.isSuggestWidgetVisible = false;
                        this.setInactiveDelayed.schedule();
                        this.update(this._isActive);
                    }));
                    this._register(suggestController.widget.value.onDidFocus(() => {
                        this.isSuggestWidgetVisible = true;
                        this.update(true);
                    }));
                };
                this._register(event_1.Event.once(suggestController.model.onDidTrigger)(e => {
                    bindToSuggestWidget();
                }));
            }
            this.update(this._isActive);
        }
        /**
         * Returns undefined if the suggest widget is not active.
        */
        get state() {
            if (!this._isActive) {
                return undefined;
            }
            return { selectedItem: this._currentSuggestItemInfo };
        }
        update(newActive) {
            const newInlineCompletion = this.getSuggestItemInfo();
            let shouldFire = false;
            if (!suggestItemInfoEquals(this._currentSuggestItemInfo, newInlineCompletion)) {
                this._currentSuggestItemInfo = newInlineCompletion;
                shouldFire = true;
            }
            if (this._isActive !== newActive) {
                this._isActive = newActive;
                shouldFire = true;
            }
            if (shouldFire) {
                this.onDidChangeEmitter.fire();
            }
        }
        getSuggestItemInfo() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (!suggestController) {
                return undefined;
            }
            if (!this.isSuggestWidgetVisible) {
                return undefined;
            }
            const focusedItem = suggestController.widget.value.getFocusedItem();
            if (!focusedItem) {
                return undefined;
            }
            // TODO: item.isResolved
            return suggestionToSuggestItemInfo(suggestController, this.editor.getPosition(), focusedItem.item, this.isShiftKeyPressed);
        }
        stopForceRenderingAbove() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (suggestController) {
                suggestController.stopForceRenderingAbove();
            }
        }
        forceRenderingAbove() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (suggestController) {
                suggestController.forceRenderingAbove();
            }
        }
    }
    exports.SuggestWidgetInlineCompletionProvider = SuggestWidgetInlineCompletionProvider;
    function rangeStartsWith(rangeToTest, prefix) {
        return (prefix.startLineNumber === rangeToTest.startLineNumber &&
            prefix.startColumn === rangeToTest.startColumn &&
            (prefix.endLineNumber < rangeToTest.endLineNumber ||
                (prefix.endLineNumber === rangeToTest.endLineNumber &&
                    prefix.endColumn <= rangeToTest.endColumn)));
    }
    exports.rangeStartsWith = rangeStartsWith;
    function suggestItemInfoEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return a.completionItemKind === b.completionItemKind &&
            a.isSnippetText === b.isSnippetText &&
            (0, inlineCompletionToGhostText_1.normalizedInlineCompletionsEquals)(a.normalizedInlineCompletion, b.normalizedInlineCompletion);
    }
    function suggestionToSuggestItemInfo(suggestController, position, item, toggleMode) {
        // additionalTextEdits might not be resolved here, this could be problematic.
        if (Array.isArray(item.completion.additionalTextEdits) && item.completion.additionalTextEdits.length > 0) {
            // cannot represent additional text edits. TODO: Now we can.
            return {
                completionItemKind: item.completion.kind,
                isSnippetText: false,
                normalizedInlineCompletion: {
                    // Dummy element, so that space is reserved, but no text is shown
                    range: range_1.Range.fromPositions(position, position),
                    insertText: '',
                    filterText: '',
                    snippetInfo: undefined,
                    additionalTextEdits: [],
                },
            };
        }
        let { insertText } = item.completion;
        let isSnippetText = false;
        if (item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */) {
            const snippet = new snippetParser_1.SnippetParser().parse(insertText);
            const model = suggestController.editor.getModel();
            // Ignore snippets that are too large.
            // Adjust whitespace is expensive for them.
            if (snippet.children.length > 100) {
                return undefined;
            }
            snippetSession_1.SnippetSession.adjustWhitespace(model, position, snippet, true, true);
            insertText = snippet.toString();
            isSnippetText = true;
        }
        const info = suggestController.getOverwriteInfo(item, toggleMode);
        return {
            isSnippetText,
            completionItemKind: item.completion.kind,
            normalizedInlineCompletion: {
                insertText: insertText,
                filterText: insertText,
                range: range_1.Range.fromPositions(position.delta(0, -info.overwriteBefore), position.delta(0, Math.max(info.overwriteAfter, 0))),
                snippetInfo: undefined,
                additionalTextEdits: [],
            }
        };
    }
});
//# sourceMappingURL=suggestWidgetInlineCompletionProvider.js.map