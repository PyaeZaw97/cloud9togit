var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/browser/coreCommands", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/language", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/contrib/suggest/browser/suggestModel", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/label/common/label", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageFeatures", "vs/platform/instantiation/common/instantiation"], function (require, exports, assert, lifecycle_1, uri_1, mock_1, coreCommands_1, editOperation_1, range_1, selection_1, languages_1, languageConfigurationRegistry_1, nullTokenize_1, language_1, snippetController2_1, suggestController_1, suggestMemory_1, suggestModel_1, testCodeEditor_1, testTextModel_1, serviceCollection_1, keybinding_1, mockKeybindingService_1, label_1, storage_1, telemetry_1, telemetryUtils_1, workspace_1, languageFeaturesService_1, languageFeatures_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createMockEditor(model, languageFeaturesService) {
        const editor = (0, testCodeEditor_1.createTestCodeEditor)(model, {
            serviceCollection: new serviceCollection_1.ServiceCollection([languageFeatures_1.ILanguageFeaturesService, languageFeaturesService], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [storage_1.IStorageService, new storage_1.InMemoryStorageService()], [keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService()], [suggestMemory_1.ISuggestMemoryService, new class {
                    memorize() {
                    }
                    select() {
                        return -1;
                    }
                }], [label_1.ILabelService, new class extends (0, mock_1.mock)() {
                }], [workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                }]),
        });
        editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
        editor.hasWidgetFocus = () => true;
        return editor;
    }
    suite('SuggestModel - Context', function () {
        const OUTER_LANGUAGE_ID = 'outerMode';
        const INNER_LANGUAGE_ID = 'innerMode';
        let OuterMode = class OuterMode extends lifecycle_1.Disposable {
            constructor(languageService, languageConfigurationService) {
                super();
                this.languageId = OUTER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {}));
                this._register(languages_1.TokenizationRegistry.register(this.languageId, {
                    getInitialState: () => nullTokenize_1.NullState,
                    tokenize: undefined,
                    tokenizeEncoded: (line, hasEOL, state) => {
                        const tokensArr = [];
                        let prevLanguageId = undefined;
                        for (let i = 0; i < line.length; i++) {
                            const languageId = (line.charAt(i) === 'x' ? INNER_LANGUAGE_ID : OUTER_LANGUAGE_ID);
                            const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(languageId);
                            if (prevLanguageId !== languageId) {
                                tokensArr.push(i);
                                tokensArr.push((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */));
                            }
                            prevLanguageId = languageId;
                        }
                        const tokens = new Uint32Array(tokensArr.length);
                        for (let i = 0; i < tokens.length; i++) {
                            tokens[i] = tokensArr[i];
                        }
                        return new languages_1.EncodedTokenizationResult(tokens, state);
                    }
                }));
            }
        };
        OuterMode = __decorate([
            __param(0, language_1.ILanguageService),
            __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], OuterMode);
        let InnerMode = class InnerMode extends lifecycle_1.Disposable {
            constructor(languageService, languageConfigurationService) {
                super();
                this.languageId = INNER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {}));
            }
        };
        InnerMode = __decorate([
            __param(0, language_1.ILanguageService),
            __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], InnerMode);
        const assertAutoTrigger = (model, offset, expected, message) => {
            const pos = model.getPositionAt(offset);
            const editor = createMockEditor(model, new languageFeaturesService_1.LanguageFeaturesService());
            editor.setPosition(pos);
            assert.strictEqual(suggestModel_1.LineContext.shouldAutoTrigger(editor), expected, message);
            editor.dispose();
        };
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(function () {
            disposables.dispose();
        });
        test('Context - shouldAutoTrigger', function () {
            const model = (0, testTextModel_1.createTextModel)('Das Pferd frisst keinen Gurkensalat - Philipp Reis 1861.\nWer hat\'s erfunden?');
            disposables.add(model);
            assertAutoTrigger(model, 3, true, 'end of word, Das|');
            assertAutoTrigger(model, 4, false, 'no word Das |');
            assertAutoTrigger(model, 1, false, 'middle of word D|as');
            assertAutoTrigger(model, 55, false, 'number, 1861|');
            model.dispose();
        });
        test('shouldAutoTrigger at embedded language boundaries', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const outerMode = disposables.add(instantiationService.createInstance(OuterMode));
            disposables.add(instantiationService.createInstance(InnerMode));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'a<xx>a<x>', outerMode.languageId));
            assertAutoTrigger(model, 1, true, 'a|<x — should trigger at end of word');
            assertAutoTrigger(model, 2, false, 'a<|x — should NOT trigger at start of word');
            assertAutoTrigger(model, 3, false, 'a<x|x —  should NOT trigger in middle of word');
            assertAutoTrigger(model, 4, true, 'a<xx|> — should trigger at boundary between languages');
            assertAutoTrigger(model, 5, false, 'a<xx>|a — should NOT trigger at start of word');
            assertAutoTrigger(model, 6, true, 'a<xx>a|< — should trigger at end of word');
            assertAutoTrigger(model, 8, true, 'a<xx>a<x|> — should trigger at end of word at boundary');
            disposables.dispose();
        });
    });
    suite('SuggestModel - TriggerAndCancelOracle', function () {
        function getDefaultSuggestRange(model, position) {
            const wordUntil = model.getWordUntilPosition(position);
            return new range_1.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
        }
        const alwaysEmptySupport = {
            provideCompletionItems(doc, pos) {
                return {
                    incomplete: false,
                    suggestions: []
                };
            }
        };
        const alwaysSomethingSupport = {
            provideCompletionItems(doc, pos) {
                return {
                    incomplete: false,
                    suggestions: [{
                            label: doc.getWordUntilPosition(pos).word,
                            kind: 9 /* CompletionItemKind.Property */,
                            insertText: 'foofoo',
                            range: getDefaultSuggestRange(doc, pos)
                        }]
                };
            }
        };
        let disposables;
        let model;
        const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
        let registry = languageFeaturesService.completionProvider;
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            model = (0, testTextModel_1.createTextModel)('abc def', undefined, undefined, uri_1.URI.parse('test:somefile.ttt'));
            disposables.add(model);
        });
        teardown(() => {
            disposables.dispose();
        });
        function withOracle(callback) {
            return new Promise((resolve, reject) => {
                const editor = createMockEditor(model, languageFeaturesService);
                const oracle = editor.invokeWithinContext(accessor => accessor.get(instantiation_1.IInstantiationService).createInstance(suggestModel_1.SuggestModel, editor));
                disposables.add(oracle);
                disposables.add(editor);
                try {
                    resolve(callback(oracle, editor));
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        function assertEvent(event, action, assert) {
            return new Promise((resolve, reject) => {
                const sub = event(e => {
                    sub.dispose();
                    try {
                        resolve(assert(e));
                    }
                    catch (err) {
                        reject(err);
                    }
                });
                try {
                    action();
                }
                catch (err) {
                    sub.dispose();
                    reject(err);
                }
            });
        }
        test('events - cancel/trigger', function () {
            return withOracle(model => {
                return Promise.all([
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: true, shy: false });
                    }, function (event) {
                        assert.strictEqual(event.auto, true);
                        return assertEvent(model.onDidCancel, function () {
                            model.cancel();
                        }, function (event) {
                            assert.strictEqual(event.retrigger, false);
                        });
                    }),
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: true, shy: false });
                    }, function (event) {
                        assert.strictEqual(event.auto, true);
                    }),
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: false, shy: false });
                    }, function (event) {
                        assert.strictEqual(event.auto, false);
                    })
                ]);
            });
        });
        test('events - suggest/empty', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysEmptySupport));
            return withOracle(model => {
                return Promise.all([
                    assertEvent(model.onDidCancel, function () {
                        model.trigger({ auto: true, shy: false });
                    }, function (event) {
                        assert.strictEqual(event.retrigger, false);
                    }),
                    assertEvent(model.onDidSuggest, function () {
                        model.trigger({ auto: false, shy: false });
                    }, function (event) {
                        assert.strictEqual(event.auto, false);
                        assert.strictEqual(event.isFrozen, false);
                        assert.strictEqual(event.completionModel.items.length, 0);
                    })
                ]);
            });
        });
        test('trigger - on type', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 4 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'd' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('#17400: Keep filtering suggestModel.ts after space', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'My Table',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'My Table',
                                range: getDefaultSuggestRange(doc, pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    // make sure completionModel starts here!
                    model.trigger({ auto: true, shy: false });
                }, event => {
                    return assertEvent(model.onDidSuggest, () => {
                        editor.setPosition({ lineNumber: 1, column: 1 });
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'My' });
                    }, event => {
                        assert.strictEqual(event.auto, true);
                        assert.strictEqual(event.completionModel.items.length, 1);
                        const [first] = event.completionModel.items;
                        assert.strictEqual(first.completion.label, 'My Table');
                        return assertEvent(model.onDidSuggest, () => {
                            editor.setPosition({ lineNumber: 1, column: 3 });
                            editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
                        }, event => {
                            assert.strictEqual(event.auto, true);
                            assert.strictEqual(event.completionModel.items.length, 1);
                            const [first] = event.completionModel.items;
                            assert.strictEqual(first.completion.label, 'My Table');
                        });
                    });
                });
            });
        });
        test('#21484: Trigger character always force a new completion session', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'foo.bar',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo.bar',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'boom',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'boom',
                                range: range_1.Range.fromPositions(pos.delta(0, doc.getLineContent(pos.lineNumber)[pos.column - 2] === '.' ? 0 : -1), pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'foo' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.completion.label, 'foo.bar');
                    return assertEvent(model.onDidSuggest, () => {
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: '.' });
                    }, event => {
                        assert.strictEqual(event.auto, true);
                        assert.strictEqual(event.completionModel.items.length, 2);
                        const [first, second] = event.completionModel.items;
                        assert.strictEqual(first.completion.label, 'foo.bar');
                        assert.strictEqual(second.completion.label, 'boom');
                    });
                });
            });
        });
        test('Intellisense Completion doesn\'t respect space after equal sign (.html file), #29353 [1/2]', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                editor.getModel().setValue('fo');
                editor.setPosition({ lineNumber: 1, column: 3 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.strictEqual(event.auto, false);
                    assert.strictEqual(event.isFrozen, false);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: '+' });
                    }, event => {
                        assert.strictEqual(event.retrigger, false);
                    });
                });
            });
        });
        test('Intellisense Completion doesn\'t respect space after equal sign (.html file), #29353 [2/2]', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                editor.getModel().setValue('fo');
                editor.setPosition({ lineNumber: 1, column: 3 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.strictEqual(event.auto, false);
                    assert.strictEqual(event.isFrozen, false);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
                    }, event => {
                        assert.strictEqual(event.retrigger, false);
                    });
                });
            });
        });
        test('Incomplete suggestion results cause re-triggering when typing w/o further context, #28400 (1/2)', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'foo',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            return withOracle((model, editor) => {
                editor.getModel().setValue('foo');
                editor.setPosition({ lineNumber: 1, column: 4 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.strictEqual(event.auto, false);
                    assert.strictEqual(event.completionModel.incomplete.size, 1);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: ';' });
                    }, event => {
                        assert.strictEqual(event.retrigger, false);
                    });
                });
            });
        });
        test('Incomplete suggestion results cause re-triggering when typing w/o further context, #28400 (2/2)', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'foo;',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            return withOracle((model, editor) => {
                editor.getModel().setValue('foo');
                editor.setPosition({ lineNumber: 1, column: 4 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.strictEqual(event.auto, false);
                    assert.strictEqual(event.completionModel.incomplete.size, 1);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidSuggest, () => {
                        // while we cancel incrementally enriching the set of
                        // completions we still filter against those that we have
                        // until now
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: ';' });
                    }, event => {
                        assert.strictEqual(event.auto, false);
                        assert.strictEqual(event.completionModel.incomplete.size, 1);
                        assert.strictEqual(event.completionModel.items.length, 1);
                    });
                });
            });
        });
        test('Trigger character is provided in suggest context', function () {
            let triggerCharacter = '';
            disposables.add(registry.register({ scheme: 'test' }, {
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos, context) {
                    assert.strictEqual(context.triggerKind, 1 /* CompletionTriggerKind.TriggerCharacter */);
                    triggerCharacter = context.triggerCharacter;
                    return {
                        incomplete: false,
                        suggestions: [
                            {
                                label: 'foo.bar',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo.bar',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }
                        ]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'foo.' });
                }, event => {
                    assert.strictEqual(triggerCharacter, '.');
                });
            });
        });
        test('Mac press and hold accent character insertion does not update suggestions, #35269', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'abc',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'abc',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }, {
                                label: 'äbc',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'äbc',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'a' });
                }, event => {
                    assert.strictEqual(event.completionModel.items.length, 1);
                    assert.strictEqual(event.completionModel.items[0].completion.label, 'abc');
                    return assertEvent(model.onDidSuggest, () => {
                        editor.executeEdits('test', [editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 2), 'ä')]);
                    }, event => {
                        // suggest model changed to äbc
                        assert.strictEqual(event.completionModel.items.length, 1);
                        assert.strictEqual(event.completionModel.items[0].completion.label, 'äbc');
                    });
                });
            });
        });
        test('Backspace should not always cancel code completion, #36491', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 4 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'd' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
                await assertEvent(model.onDidSuggest, () => {
                    coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('Text changes for completion CodeAction are affected by the completion #39893', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'bar',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'bar',
                                range: range_1.Range.fromPositions(pos.delta(0, -2), pos),
                                additionalTextEdits: [{
                                        text: ', bar',
                                        range: { startLineNumber: 1, endLineNumber: 1, startColumn: 17, endColumn: 17 }
                                    }]
                            }]
                    };
                }
            }));
            model.setValue('ba; import { foo } from "./b"');
            return withOracle(async (sugget, editor) => {
                class TestCtrl extends suggestController_1.SuggestController {
                    _insertSuggestion(item, flags = 0) {
                        super._insertSuggestion(item, flags);
                    }
                }
                const ctrl = editor.registerAndInstantiateContribution(TestCtrl.ID, TestCtrl);
                editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
                await assertEvent(sugget.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 3 });
                    sugget.trigger({ auto: false, shy: false });
                }, event => {
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.completion.label, 'bar');
                    ctrl._insertSuggestion({ item: first, index: 0, model: event.completionModel });
                });
                assert.strictEqual(model.getValue(), 'bar; import { foo, bar } from "./b"');
            });
        });
        test('Completion unexpectedly triggers on second keypress of an edit group in a snippet #43523', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setValue('d');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 2));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'e' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('Fails to render completion details #47988', function () {
            let disposeA = 0;
            let disposeB = 0;
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                kind: 23 /* CompletionItemKind.Folder */,
                                label: 'CompleteNot',
                                insertText: 'Incomplete',
                                sortText: 'a',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                        dispose() { disposeA += 1; }
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                kind: 23 /* CompletionItemKind.Folder */,
                                label: 'Complete',
                                insertText: 'Complete',
                                sortText: 'z',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                        dispose() { disposeB += 1; }
                    };
                },
                resolveCompletionItem(item) {
                    return item;
                },
            }));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'c' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(disposeA, 0);
                    assert.strictEqual(disposeB, 0);
                });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'o' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    // clean up
                    model.clear();
                    assert.strictEqual(disposeA, 2); // provide got called two times!
                    assert.strictEqual(disposeB, 1);
                });
            });
        });
        test('Trigger (full) completions when (incomplete) completions are already active #99504', function () {
            let countA = 0;
            let countB = 0;
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    countA += 1;
                    return {
                        incomplete: false,
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'Z aaa',
                                insertText: 'Z aaa',
                                range: new range_1.Range(1, 1, pos.lineNumber, pos.column)
                            }],
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    countB += 1;
                    if (!doc.getWordUntilPosition(pos).word.startsWith('a')) {
                        return;
                    }
                    return {
                        incomplete: false,
                        suggestions: [{
                                kind: 23 /* CompletionItemKind.Folder */,
                                label: 'aaa',
                                insertText: 'aaa',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                    };
                },
            }));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'Z' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'Z aaa');
                });
                await assertEvent(model.onDidSuggest, () => {
                    // started another word: Z a|
                    // item should be: Z aaa, aaa
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' a' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'Z aaa');
                    assert.strictEqual(event.completionModel.items[1].textLabel, 'aaa');
                    assert.strictEqual(countA, 1); // should we keep the suggestions from the "active" provider?, Yes! See: #106573
                    assert.strictEqual(countB, 2);
                });
            });
        });
        test('registerCompletionItemProvider with letters as trigger characters block other completion items to show up #127815', async function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'AAAA',
                                insertText: 'WordTriggerA',
                                range: new range_1.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
                            }],
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                triggerCharacters: ['a', '.'],
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'AAAA',
                                insertText: 'AutoTriggerA',
                                range: new range_1.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
                            }],
                    };
                },
            }));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: '.' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                });
                editor.getModel().setValue('');
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'a' });
                }, event => {
                    assert.strictEqual(event.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                });
            });
        });
    });
});
//# sourceMappingURL=suggestModel.test.js.map