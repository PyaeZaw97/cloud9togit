define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/model", "vs/editor/contrib/smartSelect/browser/bracketSelections", "vs/editor/contrib/smartSelect/browser/smartSelect", "vs/editor/contrib/smartSelect/browser/wordSelections", "vs/editor/test/common/testTextModel", "vs/editor/test/common/modes/supports/javascriptOnEnterRules", "vs/editor/common/languageFeatureRegistry", "vs/editor/common/languages/language"], function (require, exports, assert, cancellation_1, event_1, lifecycle_1, uri_1, position_1, range_1, languageConfigurationRegistry_1, model_1, bracketSelections_1, smartSelect_1, wordSelections_1, testTextModel_1, javascriptOnEnterRules_1, languageFeatureRegistry_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StaticLanguageSelector {
        constructor(languageId) {
            this.languageId = languageId;
            this.onDidChange = event_1.Event.None;
        }
    }
    suite('SmartSelect', () => {
        const OriginalBracketSelectionRangeProviderMaxDuration = bracketSelections_1.BracketSelectionRangeProvider._maxDuration;
        suiteSetup(() => {
            bracketSelections_1.BracketSelectionRangeProvider._maxDuration = 5000; // 5 seconds
        });
        suiteTeardown(() => {
            bracketSelections_1.BracketSelectionRangeProvider._maxDuration = OriginalBracketSelectionRangeProviderMaxDuration;
        });
        const languageId = 'mockJSMode';
        let disposables;
        let modelService;
        let providers = new languageFeatureRegistry_1.LanguageFeatureRegistry();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            modelService = instantiationService.get(model_1.IModelService);
            const languagConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languagConfigurationService.register(languageId, {
                brackets: [
                    ['(', ')'],
                    ['{', '}'],
                    ['[', ']']
                ],
                onEnterRules: javascriptOnEnterRules_1.javascriptOnEnterRules,
                wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\$\%\^\&\*\(\)\=\+\[\{\]\}\\\;\:\'\"\,\.\<\>\/\?\s]+)/g
            }));
        });
        teardown(() => {
            disposables.dispose();
        });
        async function assertGetRangesToPosition(text, lineNumber, column, ranges, selectLeadingAndTrailingWhitespace = true) {
            let uri = uri_1.URI.file('test.js');
            let model = modelService.createModel(text.join('\n'), new StaticLanguageSelector(languageId), uri);
            let [actual] = await (0, smartSelect_1.provideSelectionRanges)(providers, model, [new position_1.Position(lineNumber, column)], { selectLeadingAndTrailingWhitespace }, cancellation_1.CancellationToken.None);
            let actualStr = actual.map(r => new range_1.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn).toString());
            let desiredStr = ranges.reverse().map(r => String(r));
            assert.deepStrictEqual(actualStr, desiredStr, `\nA: ${actualStr} VS \nE: ${desiredStr}`);
            modelService.destroyModel(uri);
        }
        test('getRangesToPosition #1', () => {
            return assertGetRangesToPosition([
                'function a(bar, foo){',
                '\tif (bar) {',
                '\t\treturn (bar + (2 * foo))',
                '\t}',
                '}'
            ], 3, 20, [
                new range_1.Range(1, 1, 5, 2),
                new range_1.Range(1, 21, 5, 2),
                new range_1.Range(1, 22, 5, 1),
                new range_1.Range(2, 1, 4, 3),
                new range_1.Range(2, 1, 4, 3),
                new range_1.Range(2, 2, 4, 3),
                new range_1.Range(2, 11, 4, 3),
                new range_1.Range(2, 12, 4, 2),
                new range_1.Range(3, 1, 3, 27),
                new range_1.Range(3, 3, 3, 27),
                new range_1.Range(3, 10, 3, 27),
                new range_1.Range(3, 11, 3, 26),
                new range_1.Range(3, 17, 3, 26),
                new range_1.Range(3, 18, 3, 25), // () inside
            ]);
        });
        test('config: selectLeadingAndTrailingWhitespace', async () => {
            await assertGetRangesToPosition([
                'aaa',
                '\tbbb',
                ''
            ], 2, 3, [
                new range_1.Range(1, 1, 3, 1),
                new range_1.Range(2, 1, 2, 5),
                new range_1.Range(2, 2, 2, 5), // bbb
            ], true);
            await assertGetRangesToPosition([
                'aaa',
                '\tbbb',
                ''
            ], 2, 3, [
                new range_1.Range(1, 1, 3, 1),
                new range_1.Range(2, 2, 2, 5), // () inside
            ], false);
        });
        test('getRangesToPosition #56886. Skip empty lines correctly.', () => {
            return assertGetRangesToPosition([
                'function a(bar, foo){',
                '\tif (bar) {',
                '',
                '\t}',
                '}'
            ], 3, 1, [
                new range_1.Range(1, 1, 5, 2),
                new range_1.Range(1, 21, 5, 2),
                new range_1.Range(1, 22, 5, 1),
                new range_1.Range(2, 1, 4, 3),
                new range_1.Range(2, 1, 4, 3),
                new range_1.Range(2, 2, 4, 3),
                new range_1.Range(2, 11, 4, 3),
                new range_1.Range(2, 12, 4, 2),
            ]);
        });
        test('getRangesToPosition #56886. Do not skip lines with only whitespaces.', () => {
            return assertGetRangesToPosition([
                'function a(bar, foo){',
                '\tif (bar) {',
                ' ',
                '\t}',
                '}'
            ], 3, 1, [
                new range_1.Range(1, 1, 5, 2),
                new range_1.Range(1, 21, 5, 2),
                new range_1.Range(1, 22, 5, 1),
                new range_1.Range(2, 1, 4, 3),
                new range_1.Range(2, 1, 4, 3),
                new range_1.Range(2, 2, 4, 3),
                new range_1.Range(2, 11, 4, 3),
                new range_1.Range(2, 12, 4, 2),
                new range_1.Range(3, 1, 3, 2),
                new range_1.Range(3, 1, 3, 2) // empty line
            ]);
        });
        test('getRangesToPosition #40658. Cursor at first position inside brackets should select line inside.', () => {
            return assertGetRangesToPosition([
                ' [ ]',
                ' { } ',
                '( ) '
            ], 2, 3, [
                new range_1.Range(1, 1, 3, 5),
                new range_1.Range(2, 1, 2, 6),
                new range_1.Range(2, 2, 2, 5),
                new range_1.Range(2, 3, 2, 4) // {} inside
            ]);
        });
        test('getRangesToPosition #40658. Cursor in empty brackets should reveal brackets first.', () => {
            return assertGetRangesToPosition([
                ' [] ',
                ' { } ',
                '  ( ) '
            ], 1, 3, [
                new range_1.Range(1, 1, 3, 7),
                new range_1.Range(1, 1, 1, 5),
                new range_1.Range(1, 2, 1, 4),
                new range_1.Range(1, 3, 1, 3), // [] inside
            ]);
        });
        test('getRangesToPosition #40658. Tokens before bracket will be revealed first.', () => {
            return assertGetRangesToPosition([
                '  [] ',
                ' { } ',
                'selectthis( ) '
            ], 3, 11, [
                new range_1.Range(1, 1, 3, 15),
                new range_1.Range(3, 1, 3, 15),
                new range_1.Range(3, 1, 3, 14),
                new range_1.Range(3, 1, 3, 11) // word
            ]);
        });
        // -- bracket selections
        async function assertRanges(provider, value, ...expected) {
            let index = value.indexOf('|');
            value = value.replace('|', '');
            let model = modelService.createModel(value, new StaticLanguageSelector(languageId), uri_1.URI.parse('fake:lang'));
            let pos = model.getPositionAt(index);
            let all = await provider.provideSelectionRanges(model, [pos], cancellation_1.CancellationToken.None);
            let ranges = all[0];
            modelService.destroyModel(model.uri);
            assert.strictEqual(expected.length, ranges.length);
            for (const range of ranges) {
                let exp = expected.shift() || null;
                assert.ok(range_1.Range.equalsRange(range.range, exp), `A=${range.range} <> E=${exp}`);
            }
        }
        test('bracket selection', async () => {
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '(|)', new range_1.Range(1, 2, 1, 2), new range_1.Range(1, 1, 1, 3));
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '[[[](|)]]', new range_1.Range(1, 6, 1, 6), new range_1.Range(1, 5, 1, 7), // ()
            new range_1.Range(1, 3, 1, 7), new range_1.Range(1, 2, 1, 8), // [[]()]
            new range_1.Range(1, 2, 1, 8), new range_1.Range(1, 1, 1, 9));
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '[a[](|)a]', new range_1.Range(1, 6, 1, 6), new range_1.Range(1, 5, 1, 7), new range_1.Range(1, 2, 1, 8), new range_1.Range(1, 1, 1, 9));
            // no bracket
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), 'fofof|fofo');
            // empty
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '[[[]()]]|');
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '|[[[]()]]');
            // edge
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '[|[[]()]]', new range_1.Range(1, 2, 1, 8), new range_1.Range(1, 1, 1, 9));
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '[[[]()]|]', new range_1.Range(1, 2, 1, 8), new range_1.Range(1, 1, 1, 9));
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), 'aaa(aaa)bbb(b|b)ccc(ccc)', new range_1.Range(1, 13, 1, 15), new range_1.Range(1, 12, 1, 16));
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), '(aaa(aaa)bbb(b|b)ccc(ccc))', new range_1.Range(1, 14, 1, 16), new range_1.Range(1, 13, 1, 17), new range_1.Range(1, 2, 1, 25), new range_1.Range(1, 1, 1, 26));
        });
        test('bracket with leading/trailing', async () => {
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), 'for(a of b){\n  foo(|);\n}', new range_1.Range(2, 7, 2, 7), new range_1.Range(2, 6, 2, 8), new range_1.Range(1, 13, 3, 1), new range_1.Range(1, 12, 3, 2), new range_1.Range(1, 1, 3, 2), new range_1.Range(1, 1, 3, 2));
            await assertRanges(new bracketSelections_1.BracketSelectionRangeProvider(), 'for(a of b)\n{\n  foo(|);\n}', new range_1.Range(3, 7, 3, 7), new range_1.Range(3, 6, 3, 8), new range_1.Range(2, 2, 4, 1), new range_1.Range(2, 1, 4, 2), new range_1.Range(1, 1, 4, 2), new range_1.Range(1, 1, 4, 2));
        });
        test('in-word ranges', async () => {
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'f|ooBar', new range_1.Range(1, 1, 1, 4), // foo
            new range_1.Range(1, 1, 1, 7), // fooBar
            new range_1.Range(1, 1, 1, 7));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'f|oo_Ba', new range_1.Range(1, 1, 1, 4), new range_1.Range(1, 1, 1, 7), new range_1.Range(1, 1, 1, 7));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'f|oo-Ba', new range_1.Range(1, 1, 1, 4), new range_1.Range(1, 1, 1, 7), new range_1.Range(1, 1, 1, 7));
        });
        test('Default selection should select current word/hump first in camelCase #67493', async function () {
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Abs|tractSmartSelect', new range_1.Range(1, 1, 1, 9), new range_1.Range(1, 1, 1, 20), new range_1.Range(1, 1, 1, 20));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'AbstractSma|rtSelect', new range_1.Range(1, 9, 1, 14), new range_1.Range(1, 1, 1, 20), new range_1.Range(1, 1, 1, 20));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Abstrac-Sma|rt-elect', new range_1.Range(1, 9, 1, 14), new range_1.Range(1, 1, 1, 20), new range_1.Range(1, 1, 1, 20));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Abstrac_Sma|rt_elect', new range_1.Range(1, 9, 1, 14), new range_1.Range(1, 1, 1, 20), new range_1.Range(1, 1, 1, 20));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Abstrac_Sma|rt-elect', new range_1.Range(1, 9, 1, 14), new range_1.Range(1, 1, 1, 20), new range_1.Range(1, 1, 1, 20));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Abstrac_Sma|rtSelect', new range_1.Range(1, 9, 1, 14), new range_1.Range(1, 1, 1, 20), new range_1.Range(1, 1, 1, 20));
        });
        test('Smart select: only add line ranges if they\'re contained by the next range #73850', async function () {
            const reg = providers.register('*', {
                provideSelectionRanges() {
                    return [[
                            { range: { startLineNumber: 1, startColumn: 10, endLineNumber: 1, endColumn: 11 } },
                            { range: { startLineNumber: 1, startColumn: 10, endLineNumber: 3, endColumn: 2 } },
                            { range: { startLineNumber: 1, startColumn: 1, endLineNumber: 3, endColumn: 2 } },
                        ]];
                }
            });
            await assertGetRangesToPosition(['type T = {', '\tx: number', '}'], 1, 10, [
                new range_1.Range(1, 1, 3, 2),
                new range_1.Range(1, 10, 3, 2),
                new range_1.Range(1, 10, 1, 11), // {
            ]);
            reg.dispose();
        });
        test('Expand selection in words with underscores is inconsistent #90589', async function () {
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Hel|lo_World', new range_1.Range(1, 1, 1, 6), new range_1.Range(1, 1, 1, 12), new range_1.Range(1, 1, 1, 12));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Hello_Wo|rld', new range_1.Range(1, 7, 1, 12), new range_1.Range(1, 1, 1, 12), new range_1.Range(1, 1, 1, 12));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Hello|_World', new range_1.Range(1, 1, 1, 6), new range_1.Range(1, 1, 1, 12), new range_1.Range(1, 1, 1, 12));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Hello_|World', new range_1.Range(1, 7, 1, 12), new range_1.Range(1, 1, 1, 12), new range_1.Range(1, 1, 1, 12));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Hello|-World', new range_1.Range(1, 1, 1, 6), new range_1.Range(1, 1, 1, 12), new range_1.Range(1, 1, 1, 12));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Hello-|World', new range_1.Range(1, 7, 1, 12), new range_1.Range(1, 1, 1, 12), new range_1.Range(1, 1, 1, 12));
            await assertRanges(new wordSelections_1.WordSelectionRangeProvider(), 'Hello|World', new range_1.Range(1, 6, 1, 11), new range_1.Range(1, 1, 1, 11), new range_1.Range(1, 1, 1, 11));
        });
    });
});
//# sourceMappingURL=smartSelect.test.js.map