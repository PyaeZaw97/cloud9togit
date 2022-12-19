/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/languages", "vs/editor/test/common/testTextModel", "vs/editor/contrib/suggest/browser/suggestInlineCompletions", "vs/editor/test/browser/testCodeEditor", "vs/base/common/cancellation", "vs/editor/common/services/languageFeatures", "vs/editor/common/core/range", "vs/platform/instantiation/common/serviceCollection", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/base/test/common/mock"], function (require, exports, assert, lifecycle_1, uri_1, position_1, languages_1, testTextModel_1, suggestInlineCompletions_1, testCodeEditor_1, cancellation_1, languageFeatures_1, range_1, serviceCollection_1, suggestMemory_1, mock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Suggest Inline Completions', function () {
        const disposables = new lifecycle_1.DisposableStore();
        const services = new serviceCollection_1.ServiceCollection([suggestMemory_1.ISuggestMemoryService, new class extends (0, mock_1.mock)() {
                select() {
                    return 0;
                }
            }]);
        let insta;
        let model;
        let editor;
        setup(function () {
            insta = (0, testCodeEditor_1.createCodeEditorServices)(disposables, services);
            model = (0, testTextModel_1.createTextModel)('he', undefined, undefined, uri_1.URI.from({ scheme: 'foo', path: 'foo.bar' }));
            editor = (0, testCodeEditor_1.instantiateTestCodeEditor)(insta, model);
            editor.updateOptions({ quickSuggestions: { comments: 'inline', strings: 'inline', other: 'inline' } });
            insta.invokeFunction(accessor => {
                accessor.get(languageFeatures_1.ILanguageFeaturesService).completionProvider.register({ pattern: '*.bar', scheme: 'foo' }, new class {
                    provideCompletionItems(model, position, context, token) {
                        const word = model.getWordUntilPosition(position);
                        const range = new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                        const suggestions = [];
                        suggestions.push({ insertText: 'hello', label: 'hello', range, kind: 5 /* CompletionItemKind.Class */ });
                        suggestions.push({ insertText: 'hell', label: 'hell', range, kind: 5 /* CompletionItemKind.Class */ });
                        suggestions.push({ insertText: 'hey', label: 'hey', range, kind: 5 /* CompletionItemKind.Class */ });
                        return { suggestions };
                    }
                });
            });
        });
        teardown(function () {
            disposables.clear();
            model.dispose();
            editor.dispose();
        });
        test('Aggressive inline completions when typing within line #146948', async function () {
            const completions = insta.createInstance(suggestInlineCompletions_1.SuggestInlineCompletions, (id) => editor.getOption(id));
            {
                // (1,3), end of word -> suggestions
                const result = await completions.provideInlineCompletions(model, new position_1.Position(1, 3), { triggerKind: languages_1.InlineCompletionTriggerKind.Explicit, selectedSuggestionInfo: undefined }, cancellation_1.CancellationToken.None);
                assert.strictEqual(result === null || result === void 0 ? void 0 : result.items.length, 3);
            }
            {
                // (1,2), middle of word -> NO suggestions
                const result = await completions.provideInlineCompletions(model, new position_1.Position(1, 2), { triggerKind: languages_1.InlineCompletionTriggerKind.Explicit, selectedSuggestionInfo: undefined }, cancellation_1.CancellationToken.None);
                assert.ok(result === undefined);
            }
        });
    });
});
//# sourceMappingURL=suggestInlineCompletions.test.js.map