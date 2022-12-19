define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/bracketMatching/browser/bracketMatching", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/base/common/lifecycle", "vs/editor/common/languages/language"], function (require, exports, assert, position_1, selection_1, languageConfigurationRegistry_1, bracketMatching_1, testCodeEditor_1, testTextModel_1, lifecycle_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('bracket matching', () => {
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        teardown(() => {
            disposables.dispose();
        });
        function createTextModelWithBrackets(text) {
            const languageId = 'bracketMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            return disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
        }
        function createCodeEditorWithBrackets(text) {
            return disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, createTextModelWithBrackets(text)));
        }
        test('issue #183: jump to matching bracket position', () => {
            const editor = createCodeEditorWithBrackets('var x = (3 + (5-7)) + ((5+3)+5);');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // start on closing bracket
            editor.setPosition(new position_1.Position(1, 20));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 9));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 19));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 9));
            // start on opening bracket
            editor.setPosition(new position_1.Position(1, 23));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 31));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 23));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 31));
        });
        test('Jump to next bracket', () => {
            const editor = createCodeEditorWithBrackets('var x = (3 + (5-7)); y();');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // start position between brackets
            editor.setPosition(new position_1.Position(1, 16));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 18));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 14));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 18));
            // skip brackets in comments
            editor.setPosition(new position_1.Position(1, 21));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 23));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 24));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 23));
            // do not break if no brackets are available
            editor.setPosition(new position_1.Position(1, 26));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 26));
        });
        test('Select to next bracket', () => {
            const editor = createCodeEditorWithBrackets('var x = (3 + (5-7)); y();');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // start position in open brackets
            editor.setPosition(new position_1.Position(1, 9));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 20));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 9, 1, 20));
            // start position in close brackets (should select backwards)
            editor.setPosition(new position_1.Position(1, 20));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 9));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 20, 1, 9));
            // start position between brackets
            editor.setPosition(new position_1.Position(1, 16));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 19));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 19));
            // start position outside brackets
            editor.setPosition(new position_1.Position(1, 21));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 25));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 23, 1, 25));
            // do not break if no brackets are available
            editor.setPosition(new position_1.Position(1, 26));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 26));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 26, 1, 26));
        });
        test('issue #1772: jump to enclosing brackets', () => {
            const text = [
                'const x = {',
                '    something: [0, 1, 2],',
                '    another: true,',
                '    somethingmore: [0, 2, 4]',
                '};',
            ].join('\n');
            const editor = createCodeEditorWithBrackets(text);
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            editor.setPosition(new position_1.Position(3, 5));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(5, 1, 5, 1));
        });
        test('issue #43371: argument to not select brackets', () => {
            const text = [
                'const x = {',
                '    something: [0, 1, 2],',
                '    another: true,',
                '    somethingmore: [0, 2, 4]',
                '};',
            ].join('\n');
            const editor = createCodeEditorWithBrackets(text);
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            editor.setPosition(new position_1.Position(3, 5));
            bracketMatchingController.selectToBracket(false);
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 12, 5, 1));
        });
        test('issue #45369: Select to Bracket with multicursor', () => {
            const editor = createCodeEditorWithBrackets('{  }   {   }   { }');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // cursors inside brackets become selections of the entire bracket contents
            editor.setSelections([
                new selection_1.Selection(1, 3, 1, 3),
                new selection_1.Selection(1, 10, 1, 10),
                new selection_1.Selection(1, 17, 1, 17)
            ]);
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getSelections(), [
                new selection_1.Selection(1, 1, 1, 5),
                new selection_1.Selection(1, 8, 1, 13),
                new selection_1.Selection(1, 16, 1, 19)
            ]);
            // cursors to the left of bracket pairs become selections of the entire pair
            editor.setSelections([
                new selection_1.Selection(1, 1, 1, 1),
                new selection_1.Selection(1, 6, 1, 6),
                new selection_1.Selection(1, 14, 1, 14)
            ]);
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getSelections(), [
                new selection_1.Selection(1, 1, 1, 5),
                new selection_1.Selection(1, 8, 1, 13),
                new selection_1.Selection(1, 16, 1, 19)
            ]);
            // cursors just right of a bracket pair become selections of the entire pair
            editor.setSelections([
                new selection_1.Selection(1, 5, 1, 5),
                new selection_1.Selection(1, 13, 1, 13),
                new selection_1.Selection(1, 19, 1, 19)
            ]);
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getSelections(), [
                new selection_1.Selection(1, 5, 1, 1),
                new selection_1.Selection(1, 13, 1, 8),
                new selection_1.Selection(1, 19, 1, 16)
            ]);
        });
    });
});
//# sourceMappingURL=bracketMatching.test.js.map