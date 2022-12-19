/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/editorSimpleWorker", "vs/editor/browser/services/editorWorkerService", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/suggest/browser/wordDistance", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/log/common/log", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/languages/language"], function (require, exports, assert, event_1, lifecycle_1, uri_1, mock_1, wordHelper_1, languageConfigurationRegistry_1, editorSimpleWorker_1, editorWorkerService_1, suggest_1, wordDistance_1, testCodeEditor_1, testTextModel_1, testLanguageConfigurationService_1, log_1, languageFeaturesService_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('suggest, word distance', function () {
        let distance;
        let disposables = new lifecycle_1.DisposableStore();
        setup(async function () {
            const languageId = 'bracketMode';
            disposables.clear();
            const instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'function abc(aa, ab){\na\n}', languageId, undefined, uri_1.URI.parse('test:///some.path')));
            const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model));
            editor.updateOptions({ suggest: { localityBonus: true } });
            editor.setPosition({ lineNumber: 2, column: 2 });
            let modelService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onModelRemoved = event_1.Event.None;
                }
                getModel(uri) {
                    return uri.toString() === model.uri.toString() ? model : null;
                }
            };
            let service = new class extends editorWorkerService_1.EditorWorkerService {
                constructor() {
                    super(modelService, new class extends (0, mock_1.mock)() {
                    }, new log_1.NullLogService(), new testLanguageConfigurationService_1.TestLanguageConfigurationService(), new languageFeaturesService_1.LanguageFeaturesService());
                    this._worker = new editorSimpleWorker_1.EditorSimpleWorker(new class extends (0, mock_1.mock)() {
                    }, null);
                    this._worker.acceptNewModel({
                        url: model.uri.toString(),
                        lines: model.getLinesContent(),
                        EOL: model.getEOL(),
                        versionId: model.getVersionId()
                    });
                    model.onDidChangeContent(e => this._worker.acceptModelChanged(model.uri.toString(), e));
                }
                computeWordRanges(resource, range) {
                    return this._worker.computeWordRanges(resource.toString(), range, wordHelper_1.DEFAULT_WORD_REGEXP.source, wordHelper_1.DEFAULT_WORD_REGEXP.flags);
                }
            };
            distance = await wordDistance_1.WordDistance.create(service, editor);
            disposables.add(service);
        });
        teardown(function () {
            disposables.clear();
        });
        function createSuggestItem(label, overwriteBefore, position) {
            const suggestion = {
                label,
                range: { startLineNumber: position.lineNumber, startColumn: position.column - overwriteBefore, endLineNumber: position.lineNumber, endColumn: position.column },
                insertText: label,
                kind: 0
            };
            const container = {
                suggestions: [suggestion]
            };
            const provider = {
                provideCompletionItems() {
                    return;
                }
            };
            return new suggest_1.CompletionItem(position, suggestion, container, provider);
        }
        test('Suggest locality bonus can boost current word #90515', function () {
            const pos = { lineNumber: 2, column: 2 };
            const d1 = distance.distance(pos, createSuggestItem('a', 1, pos).completion);
            const d2 = distance.distance(pos, createSuggestItem('aa', 1, pos).completion);
            const d3 = distance.distance(pos, createSuggestItem('ab', 1, pos).completion);
            assert.ok(d1 > d2);
            assert.ok(d2 === d3);
        });
    });
});
//# sourceMappingURL=wordDistance.test.js.map