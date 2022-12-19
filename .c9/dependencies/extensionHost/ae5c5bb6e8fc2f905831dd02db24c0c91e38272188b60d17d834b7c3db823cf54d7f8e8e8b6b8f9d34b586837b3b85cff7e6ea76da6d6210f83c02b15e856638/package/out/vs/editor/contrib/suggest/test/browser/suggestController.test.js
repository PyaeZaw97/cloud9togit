/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/editorWorker", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageFeatures"], function (require, exports, assert, async_1, event_1, lifecycle_1, uri_1, mock_1, range_1, selection_1, editorWorker_1, snippetController2_1, suggestController_1, suggestMemory_1, testCodeEditor_1, testTextModel_1, actions_1, serviceCollection_1, keybinding_1, mockKeybindingService_1, label_1, log_1, storage_1, telemetry_1, telemetryUtils_1, workspace_1, languageFeaturesService_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SuggestController', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let controller;
        let editor;
        let model;
        const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
        teardown(function () {
            disposables.clear();
        });
        setup(function () {
            const serviceCollection = new serviceCollection_1.ServiceCollection([languageFeatures_1.ILanguageFeaturesService, languageFeaturesService], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [log_1.ILogService, new log_1.NullLogService()], [storage_1.IStorageService, new storage_1.InMemoryStorageService()], [keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService()], [editorWorker_1.IEditorWorkerService, new class extends (0, mock_1.mock)() {
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
            model = disposables.add((0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.from({ scheme: 'test-ctrl', path: '/path.tst' })));
            editor = disposables.add((0, testCodeEditor_1.createTestCodeEditor)(model, { serviceCollection }));
            editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
            controller = editor.registerAndInstantiateContribution(suggestController_1.SuggestController.ID, suggestController_1.SuggestController);
        });
        test('postfix completion reports incorrect position #86984', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'let ${1:name} = foo$0',
                                insertTextRules: 4 /* CompletionItemInsertTextRule.InsertAsSnippet */,
                                range: { startLineNumber: 1, startColumn: 9, endLineNumber: 1, endColumn: 11 },
                                additionalTextEdits: [{
                                        text: '',
                                        range: { startLineNumber: 1, startColumn: 5, endLineNumber: 1, endColumn: 9 }
                                    }]
                            }]
                    };
                }
            }));
            editor.setValue('    foo.le');
            editor.setSelection(new selection_1.Selection(1, 11, 1, 11));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            assert.strictEqual(editor.getValue(), '    let name = foo');
        });
        test('use additionalTextEdits sync when possible', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos),
                                additionalTextEdits: [{
                                        text: 'I came sync',
                                        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
                                    }]
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'I came synchello\nhallohello');
        });
        test('resolve additionalTextEdits async when needed', async function () {
            var _a;
            let resolveCallCount = 0;
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await (0, async_1.timeout)(10);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
                        }];
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello\nhallohello');
            assert.strictEqual(resolveCallCount, 1);
            // additional edits happened after a litte wait
            await (0, async_1.timeout)(20);
            assert.strictEqual(editor.getValue(), 'I came latehello\nhallohello');
            // single undo stop
            (_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.undo();
            assert.strictEqual(editor.getValue(), 'hello\nhallo');
        });
        test('resolve additionalTextEdits async when needed (typing)', async function () {
            var _a, _b;
            let resolveCallCount = 0;
            let resolve = () => { };
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await new Promise(_resolve => resolve = _resolve);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
                        }];
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello\nhallohello');
            assert.strictEqual(resolveCallCount, 1);
            // additional edits happened after a litte wait
            assert.ok((_a = editor.getSelection()) === null || _a === void 0 ? void 0 : _a.equalsSelection(new selection_1.Selection(2, 11, 2, 11)));
            editor.trigger('test', 'type', { text: 'TYPING' });
            assert.strictEqual(editor.getValue(), 'hello\nhallohelloTYPING');
            resolve();
            await (0, async_1.timeout)(10);
            assert.strictEqual(editor.getValue(), 'I came latehello\nhallohelloTYPING');
            assert.ok((_b = editor.getSelection()) === null || _b === void 0 ? void 0 : _b.equalsSelection(new selection_1.Selection(2, 17, 2, 17)));
        });
        // additional edit come late and are AFTER the selection -> cancel
        test('resolve additionalTextEdits async when needed (simple conflict)', async function () {
            let resolveCallCount = 0;
            let resolve = () => { };
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await new Promise(_resolve => resolve = _resolve);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 6, endLineNumber: 1, endColumn: 6 }
                        }];
                    return item;
                }
            }));
            editor.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello');
            assert.strictEqual(resolveCallCount, 1);
            resolve();
            await (0, async_1.timeout)(10);
            assert.strictEqual(editor.getValue(), 'hello');
        });
        // additional edit come late and are AFTER the position at which the user typed -> cancelled
        test('resolve additionalTextEdits async when needed (conflict)', async function () {
            var _a;
            let resolveCallCount = 0;
            let resolve = () => { };
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await new Promise(_resolve => resolve = _resolve);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 2 }
                        }];
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello\nhallohello');
            assert.strictEqual(resolveCallCount, 1);
            // additional edits happened after a litte wait
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            editor.trigger('test', 'type', { text: 'TYPING' });
            assert.strictEqual(editor.getValue(), 'TYPINGhello\nhallohello');
            resolve();
            await (0, async_1.timeout)(10);
            assert.strictEqual(editor.getValue(), 'TYPINGhello\nhallohello');
            assert.ok((_a = editor.getSelection()) === null || _a === void 0 ? void 0 : _a.equalsSelection(new selection_1.Selection(1, 7, 1, 7)));
        });
        test('resolve additionalTextEdits async when needed (cancel)', async function () {
            let resolve = [];
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }, {
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hallo',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    await new Promise(_resolve => resolve.push(_resolve));
                    item.additionalTextEdits = [{
                            text: 'additionalTextEdits',
                            range: { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 2 }
                        }];
                    return item;
                }
            }));
            editor.setValue('abc');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(true, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'helloabc');
            // next
            controller.acceptNextSuggestion();
            // resolve additional edits (MUST be cancelled)
            resolve.forEach(fn => fn);
            resolve.length = 0;
            await (0, async_1.timeout)(10);
            // next suggestion used
            assert.strictEqual(editor.getValue(), 'halloabc');
        });
        test('Completion edits are applied inconsistently when additionalTextEdits and textEdit start at the same offset #143888', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'MyClassName',
                                insertText: 'MyClassName',
                                range: range_1.Range.fromPositions(pos),
                                additionalTextEdits: [{
                                        range: range_1.Range.fromPositions(pos),
                                        text: 'import "my_class.txt";\n'
                                    }]
                            }]
                    };
                }
            }));
            editor.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            // trigger
            let p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            let p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(true, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'import "my_class.txt";\nMyClassName');
        });
    });
});
//# sourceMappingURL=suggestController.test.js.map