define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/languageFeatureRegistry", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/types", "vs/editor/test/common/testTextModel", "vs/platform/markers/common/markers", "vs/platform/progress/common/progress"], function (require, exports, assert, cancellation_1, lifecycle_1, uri_1, range_1, languageFeatureRegistry_1, codeAction_1, types_1, testTextModel_1, markers_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function staticCodeActionProvider(...actions) {
        return new class {
            provideCodeActions() {
                return {
                    actions: actions,
                    dispose: () => { }
                };
            }
        };
    }
    suite('CodeAction', () => {
        let langId = 'fooLang';
        let uri = uri_1.URI.parse('untitled:path');
        let model;
        let registry;
        const disposables = new lifecycle_1.DisposableStore();
        let testData = {
            diagnostics: {
                abc: {
                    title: 'bTitle',
                    diagnostics: [{
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 2,
                            endColumn: 1,
                            severity: markers_1.MarkerSeverity.Error,
                            message: 'abc'
                        }]
                },
                bcd: {
                    title: 'aTitle',
                    diagnostics: [{
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 2,
                            endColumn: 1,
                            severity: markers_1.MarkerSeverity.Error,
                            message: 'bcd'
                        }]
                }
            },
            command: {
                abc: {
                    command: new class {
                    },
                    title: 'Extract to inner function in function "test"'
                }
            },
            spelling: {
                bcd: {
                    diagnostics: [],
                    edit: new class {
                    },
                    title: 'abc'
                }
            },
            tsLint: {
                abc: {
                    $ident: 57,
                    arguments: [],
                    id: '_internal_command_delegation',
                    title: 'abc'
                },
                bcd: {
                    $ident: 47,
                    arguments: [],
                    id: '_internal_command_delegation',
                    title: 'bcd'
                }
            }
        };
        setup(() => {
            registry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
            disposables.clear();
            model = (0, testTextModel_1.createTextModel)('test1\ntest2\ntest3', langId, undefined, uri);
            disposables.add(model);
        });
        teardown(() => {
            disposables.clear();
        });
        test('CodeActions are sorted by type, #38623', async () => {
            const provider = staticCodeActionProvider(testData.command.abc, testData.diagnostics.bcd, testData.spelling.bcd, testData.tsLint.bcd, testData.tsLint.abc, testData.diagnostics.abc);
            disposables.add(registry.register('fooLang', provider));
            const expected = [
                // CodeActions with a diagnostics array are shown first ordered by diagnostics.message
                new codeAction_1.CodeActionItem(testData.diagnostics.abc, provider),
                new codeAction_1.CodeActionItem(testData.diagnostics.bcd, provider),
                // CodeActions without diagnostics are shown in the given order without any further sorting
                new codeAction_1.CodeActionItem(testData.command.abc, provider),
                new codeAction_1.CodeActionItem(testData.spelling.bcd, provider),
                new codeAction_1.CodeActionItem(testData.tsLint.bcd, provider),
                new codeAction_1.CodeActionItem(testData.tsLint.abc, provider)
            ];
            const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), { type: 1 /* languages.CodeActionTriggerType.Invoke */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 6);
            assert.deepStrictEqual(actions, expected);
        });
        test('getCodeActions should filter by scope', async () => {
            const provider = staticCodeActionProvider({ title: 'a', kind: 'a' }, { title: 'b', kind: 'b' }, { title: 'a.b', kind: 'a.b' });
            disposables.add(registry.register('fooLang', provider));
            {
                const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), { type: 2 /* languages.CodeActionTriggerType.Auto */, filter: { include: new types_1.CodeActionKind('a') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(actions.length, 2);
                assert.strictEqual(actions[0].action.title, 'a');
                assert.strictEqual(actions[1].action.title, 'a.b');
            }
            {
                const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), { type: 2 /* languages.CodeActionTriggerType.Auto */, filter: { include: new types_1.CodeActionKind('a.b') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(actions.length, 1);
                assert.strictEqual(actions[0].action.title, 'a.b');
            }
            {
                const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), { type: 2 /* languages.CodeActionTriggerType.Auto */, filter: { include: new types_1.CodeActionKind('a.b.c') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(actions.length, 0);
            }
        });
        test('getCodeActions should forward requested scope to providers', async () => {
            const provider = new class {
                provideCodeActions(_model, _range, context, _token) {
                    return {
                        actions: [
                            { title: context.only || '', kind: context.only }
                        ],
                        dispose: () => { }
                    };
                }
            };
            disposables.add(registry.register('fooLang', provider));
            const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), { type: 2 /* languages.CodeActionTriggerType.Auto */, filter: { include: new types_1.CodeActionKind('a') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].action.title, 'a');
        });
        test('getCodeActions should not return source code action by default', async () => {
            const provider = staticCodeActionProvider({ title: 'a', kind: types_1.CodeActionKind.Source.value }, { title: 'b', kind: 'b' });
            disposables.add(registry.register('fooLang', provider));
            {
                const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), { type: 2 /* languages.CodeActionTriggerType.Auto */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(actions.length, 1);
                assert.strictEqual(actions[0].action.title, 'b');
            }
            {
                const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), { type: 2 /* languages.CodeActionTriggerType.Auto */, filter: { include: types_1.CodeActionKind.Source, includeSourceActions: true } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(actions.length, 1);
                assert.strictEqual(actions[0].action.title, 'a');
            }
        });
        test('getCodeActions should support filtering out some requested source code actions #84602', async () => {
            const provider = staticCodeActionProvider({ title: 'a', kind: types_1.CodeActionKind.Source.value }, { title: 'b', kind: types_1.CodeActionKind.Source.append('test').value }, { title: 'c', kind: 'c' });
            disposables.add(registry.register('fooLang', provider));
            {
                const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), {
                    type: 2 /* languages.CodeActionTriggerType.Auto */, filter: {
                        include: types_1.CodeActionKind.Source.append('test'),
                        excludes: [types_1.CodeActionKind.Source],
                        includeSourceActions: true,
                    }
                }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(actions.length, 1);
                assert.strictEqual(actions[0].action.title, 'b');
            }
        });
        test('getCodeActions no invoke a provider that has been excluded #84602', async () => {
            const baseType = types_1.CodeActionKind.Refactor;
            const subType = types_1.CodeActionKind.Refactor.append('sub');
            disposables.add(registry.register('fooLang', staticCodeActionProvider({ title: 'a', kind: baseType.value })));
            let didInvoke = false;
            disposables.add(registry.register('fooLang', new class {
                constructor() {
                    this.providedCodeActionKinds = [subType.value];
                }
                provideCodeActions() {
                    didInvoke = true;
                    return {
                        actions: [
                            { title: 'x', kind: subType.value }
                        ],
                        dispose: () => { }
                    };
                }
            }));
            {
                const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), {
                    type: 2 /* languages.CodeActionTriggerType.Auto */, filter: {
                        include: baseType,
                        excludes: [subType],
                    }
                }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(didInvoke, false);
                assert.strictEqual(actions.length, 1);
                assert.strictEqual(actions[0].action.title, 'a');
            }
        });
        test('getCodeActions should not invoke code action providers filtered out by providedCodeActionKinds', async () => {
            let wasInvoked = false;
            const provider = new class {
                constructor() {
                    this.providedCodeActionKinds = [types_1.CodeActionKind.Refactor.value];
                }
                provideCodeActions() {
                    wasInvoked = true;
                    return { actions: [], dispose: () => { } };
                }
            };
            disposables.add(registry.register('fooLang', provider));
            const { validActions: actions } = await (0, codeAction_1.getCodeActions)(registry, model, new range_1.Range(1, 1, 2, 1), {
                type: 2 /* languages.CodeActionTriggerType.Auto */,
                filter: {
                    include: types_1.CodeActionKind.QuickFix
                }
            }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 0);
            assert.strictEqual(wasInvoked, false);
        });
    });
});
//# sourceMappingURL=codeAction.test.js.map