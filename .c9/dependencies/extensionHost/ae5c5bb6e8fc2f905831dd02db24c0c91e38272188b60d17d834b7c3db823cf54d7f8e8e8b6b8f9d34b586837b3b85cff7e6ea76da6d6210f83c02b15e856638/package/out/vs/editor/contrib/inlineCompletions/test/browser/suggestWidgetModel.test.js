/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/contrib/inlineCompletions/browser/ghostTextModel", "vs/editor/contrib/inlineCompletions/browser/suggestWidgetPreviewModel", "vs/editor/contrib/inlineCompletions/test/browser/utils", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/test/browser/testCodeEditor", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "assert", "vs/editor/test/common/testTextModel", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "vs/editor/contrib/inlineCompletions/browser/suggestWidgetInlineCompletionProvider", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionToGhostText"], function (require, exports, async_1, event_1, lifecycle_1, mock_1, timeTravelScheduler_1, range_1, editorWorker_1, ghostTextModel_1, suggestWidgetPreviewModel_1, utils_1, snippetController2_1, suggestController_1, suggestMemory_1, testCodeEditor_1, actions_1, serviceCollection_1, keybinding_1, mockKeybindingService_1, log_1, storage_1, telemetry_1, telemetryUtils_1, assert, testTextModel_1, label_1, workspace_1, suggestWidgetInlineCompletionProvider_1, languageFeaturesService_1, languageFeatures_1, inlineCompletionToGhostText_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Suggest Widget Model', () => {
        test('rangeStartsWith', () => {
            assert.strictEqual((0, suggestWidgetInlineCompletionProvider_1.rangeStartsWith)(new range_1.Range(1, 1, 10, 5), new range_1.Range(1, 1, 1, 1)), true);
            assert.strictEqual((0, suggestWidgetInlineCompletionProvider_1.rangeStartsWith)(new range_1.Range(1, 1, 10, 5), new range_1.Range(1, 1, 10, 5)), true);
            assert.strictEqual((0, suggestWidgetInlineCompletionProvider_1.rangeStartsWith)(new range_1.Range(1, 1, 10, 5), new range_1.Range(1, 1, 10, 4)), true);
            assert.strictEqual((0, suggestWidgetInlineCompletionProvider_1.rangeStartsWith)(new range_1.Range(1, 1, 10, 5), new range_1.Range(1, 1, 9, 6)), true);
            assert.strictEqual((0, suggestWidgetInlineCompletionProvider_1.rangeStartsWith)(new range_1.Range(2, 1, 10, 5), new range_1.Range(1, 1, 10, 5)), false);
            assert.strictEqual((0, suggestWidgetInlineCompletionProvider_1.rangeStartsWith)(new range_1.Range(1, 1, 10, 5), new range_1.Range(1, 1, 10, 6)), false);
            assert.strictEqual((0, suggestWidgetInlineCompletionProvider_1.rangeStartsWith)(new range_1.Range(1, 1, 10, 5), new range_1.Range(1, 1, 11, 4)), false);
        });
        test('Active', async () => {
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, }, async ({ editor, editorViewModel, context, model }) => {
                let last = undefined;
                const history = new Array();
                model.onDidChange(() => {
                    if (last !== model.isActive) {
                        last = model.isActive;
                        history.push(last);
                    }
                });
                context.keyboardType('h');
                const suggestController = editor.getContribution(suggestController_1.SuggestController.ID);
                suggestController.triggerSuggest();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(history.splice(0), [false, true]);
                context.keyboardType('.');
                await (0, async_1.timeout)(1000);
                // No flicker here
                assert.deepStrictEqual(history.splice(0), []);
                suggestController.cancelSuggestWidget();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(history.splice(0), [false]);
            });
        });
        test('Ghost Text', async () => {
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, suggest: { preview: true } }, async ({ editor, editorViewModel, context, model }) => {
                context.keyboardType('h');
                const suggestController = editor.getContribution(suggestController_1.SuggestController.ID);
                suggestController.triggerSuggest();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'h', 'h[ello]']);
                context.keyboardType('.');
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['hello', 'hello.', 'hello.[hello]']);
                suggestController.cancelSuggestWidget();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['hello.']);
            });
        });
        test('minimizeInlineCompletion', async () => {
            const model = (0, testTextModel_1.createTextModel)('fun');
            const result = (0, inlineCompletionToGhostText_1.minimizeInlineCompletion)(model, {
                range: new range_1.Range(1, 1, 1, 4),
                filterText: 'function',
                insertText: 'function',
                snippetInfo: undefined,
                additionalTextEdits: [],
            });
            assert.deepStrictEqual({
                range: result.range.toString(),
                text: result.insertText
            }, {
                range: '[1,4 -> 1,4]',
                text: 'ction'
            });
            model.dispose();
        });
    });
    const provider = {
        triggerCharacters: ['.'],
        async provideCompletionItems(model, pos) {
            const word = model.getWordAtPosition(pos);
            const range = word
                ? { startLineNumber: 1, startColumn: word.startColumn, endLineNumber: 1, endColumn: word.endColumn }
                : range_1.Range.fromPositions(pos);
            return {
                suggestions: [{
                        insertText: 'hello',
                        kind: 18 /* CompletionItemKind.Text */,
                        label: 'hello',
                        range,
                        commitCharacters: ['.'],
                    }]
            };
        },
    };
    async function withAsyncTestCodeEditorAndInlineCompletionsModel(text, options, callback) {
        await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: options.fakeClock }, async () => {
            const disposableStore = new lifecycle_1.DisposableStore();
            try {
                const serviceCollection = new serviceCollection_1.ServiceCollection([telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [log_1.ILogService, new log_1.NullLogService()], [storage_1.IStorageService, new storage_1.InMemoryStorageService()], [keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService()], [editorWorker_1.IEditorWorkerService, new class extends (0, mock_1.mock)() {
                        computeWordRanges() {
                            return Promise.resolve({});
                        }
                    }], [suggestMemory_1.ISuggestMemoryService, new class extends (0, mock_1.mock)() {
                        memorize() { }
                        select() { return 0; }
                    }], [actions_1.IMenuService, new class extends (0, mock_1.mock)() {
                        createMenu() {
                            return new class extends (0, mock_1.mock)() {
                                constructor() {
                                    super(...arguments);
                                    this.onDidChange = event_1.Event.None;
                                }
                                dispose() { }
                            };
                        }
                    }], [label_1.ILabelService, new class extends (0, mock_1.mock)() {
                    }], [workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                    }]);
                if (options.provider) {
                    const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
                    serviceCollection.set(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService);
                    const d = languageFeaturesService.completionProvider.register({ pattern: '**' }, options.provider);
                    disposableStore.add(d);
                }
                await (0, testCodeEditor_1.withAsyncTestCodeEditor)(text, Object.assign(Object.assign({}, options), { serviceCollection }), async (editor, editorViewModel, instantiationService) => {
                    editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
                    editor.registerAndInstantiateContribution(suggestController_1.SuggestController.ID, suggestController_1.SuggestController);
                    const cache = disposableStore.add(new ghostTextModel_1.SharedInlineCompletionCache());
                    const model = instantiationService.createInstance(suggestWidgetPreviewModel_1.SuggestWidgetPreviewModel, editor, cache);
                    const context = new utils_1.GhostTextContext(model, editor);
                    await callback({ editor, editorViewModel, model, context });
                    model.dispose();
                });
            }
            finally {
                disposableStore.dispose();
            }
        });
    }
});
//# sourceMappingURL=suggestWidgetModel.test.js.map