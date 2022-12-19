define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/editor/browser/coreCommands", "vs/editor/common/core/selection", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace"], function (require, exports, assert, mock_1, coreCommands_1, selection_1, snippetController2_1, testCodeEditor_1, testTextModel_1, contextkey_1, instantiationService_1, serviceCollection_1, mockKeybindingService_1, label_1, log_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SnippetController2', function () {
        function assertSelections(editor, ...s) {
            for (const selection of editor.getSelections()) {
                const actual = s.shift();
                assert.ok(selection.equalsSelection(actual), `actual=${selection.toString()} <> expected=${actual.toString()}`);
            }
            assert.strictEqual(s.length, 0);
        }
        function assertContextKeys(service, inSnippet, hasPrev, hasNext) {
            assert.strictEqual(snippetController2_1.SnippetController2.InSnippetMode.getValue(service), inSnippet, `inSnippetMode`);
            assert.strictEqual(snippetController2_1.SnippetController2.HasPrevTabstop.getValue(service), hasPrev, `HasPrevTabstop`);
            assert.strictEqual(snippetController2_1.SnippetController2.HasNextTabstop.getValue(service), hasNext, `HasNextTabstop`);
        }
        let editor;
        let model;
        let contextKeys;
        let instaService;
        setup(function () {
            contextKeys = new mockKeybindingService_1.MockContextKeyService();
            model = (0, testTextModel_1.createTextModel)('if\n    $state\nfi');
            const serviceCollection = new serviceCollection_1.ServiceCollection([label_1.ILabelService, new class extends (0, mock_1.mock)() {
                }], [workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                }], [log_1.ILogService, new log_1.NullLogService()], [contextkey_1.IContextKeyService, contextKeys]);
            instaService = new instantiationService_1.InstantiationService(serviceCollection);
            editor = (0, testCodeEditor_1.createTestCodeEditor)(model, { serviceCollection });
            editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5)]);
            assert.strictEqual(model.getEOL(), '\n');
        });
        teardown(function () {
            model.dispose();
        });
        test('creation', () => {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            assertContextKeys(contextKeys, false, false, false);
            ctrl.dispose();
        });
        test('insert, insert -> abort', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('foo${1:bar}foo$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            ctrl.cancel();
            assertContextKeys(contextKeys, false, false, false);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
        });
        test('insert, insert -> tab, tab, done', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('${1:one}${2:two}$0');
            assertContextKeys(contextKeys, true, false, true);
            ctrl.next();
            assertContextKeys(contextKeys, true, true, true);
            ctrl.next();
            assertContextKeys(contextKeys, false, false, false);
            editor.trigger('test', 'type', { text: '\t' });
            assert.strictEqual(snippetController2_1.SnippetController2.InSnippetMode.getValue(contextKeys), false);
            assert.strictEqual(snippetController2_1.SnippetController2.HasNextTabstop.getValue(contextKeys), false);
            assert.strictEqual(snippetController2_1.SnippetController2.HasPrevTabstop.getValue(contextKeys), false);
        });
        test('insert, insert -> cursor moves out (left/right)', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('foo${1:bar}foo$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // bad selection change
            editor.setSelections([new selection_1.Selection(1, 12, 1, 12), new selection_1.Selection(2, 16, 2, 16)]);
            assertContextKeys(contextKeys, false, false, false);
        });
        test('insert, insert -> cursor moves out (up/down)', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('foo${1:bar}foo$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // bad selection change
            editor.setSelections([new selection_1.Selection(2, 4, 2, 7), new selection_1.Selection(3, 8, 3, 11)]);
            assertContextKeys(contextKeys, false, false, false);
        });
        test('insert, insert -> cursors collapse', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('foo${1:bar}foo$0');
            assert.strictEqual(snippetController2_1.SnippetController2.InSnippetMode.getValue(contextKeys), true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // bad selection change
            editor.setSelections([new selection_1.Selection(1, 4, 1, 7)]);
            assertContextKeys(contextKeys, false, false, false);
        });
        test('insert, insert plain text -> no snippet mode', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('foobar');
            assertContextKeys(contextKeys, false, false, false);
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
        });
        test('insert, delete snippet text', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('${1:foobar}$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 7), new selection_1.Selection(2, 5, 2, 11));
            editor.trigger('test', 'cut', {});
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            editor.trigger('test', 'type', { text: 'abc' });
            assertContextKeys(contextKeys, true, false, true);
            ctrl.next();
            assertContextKeys(contextKeys, false, false, false);
            editor.trigger('test', 'tab', {});
            assertContextKeys(contextKeys, false, false, false);
            // editor.trigger('test', 'type', { text: 'abc' });
            // assertContextKeys(contextKeys, false, false, false);
        });
        test('insert, nested trivial snippet', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('${1:foo}bar$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(2, 5, 2, 8));
            ctrl.insert('FOO$0');
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
            assertContextKeys(contextKeys, true, false, true);
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
            assertContextKeys(contextKeys, false, false, false);
        });
        test('insert, nested snippet', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('${1:foobar}$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 7), new selection_1.Selection(2, 5, 2, 11));
            ctrl.insert('far$1boo$0');
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
            assertContextKeys(contextKeys, true, false, true);
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
            assertContextKeys(contextKeys, true, true, true);
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
            assertContextKeys(contextKeys, false, false, false);
        });
        test('insert, nested plain text', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('${1:foobar}$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 7), new selection_1.Selection(2, 5, 2, 11));
            ctrl.insert('farboo');
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
            assertContextKeys(contextKeys, true, false, true);
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
            assertContextKeys(contextKeys, false, false, false);
        });
        test('Nested snippets without final placeholder jumps to next outer placeholder, #27898', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('for(const ${1:element} of ${2:array}) {$0}');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 11, 1, 18), new selection_1.Selection(2, 15, 2, 22));
            ctrl.next();
            assertContextKeys(contextKeys, true, true, true);
            assertSelections(editor, new selection_1.Selection(1, 22, 1, 27), new selection_1.Selection(2, 26, 2, 31));
            ctrl.insert('document');
            assertContextKeys(contextKeys, true, true, true);
            assertSelections(editor, new selection_1.Selection(1, 30, 1, 30), new selection_1.Selection(2, 34, 2, 34));
            ctrl.next();
            assertContextKeys(contextKeys, false, false, false);
        });
        test('Inconsistent tab stop behaviour with recursive snippets and tab / shift tab, #27543', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            ctrl.insert('1_calize(${1:nl}, \'${2:value}\')$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 12), new selection_1.Selection(2, 14, 2, 16));
            ctrl.insert('2_calize(${1:nl}, \'${2:value}\')$0');
            assertSelections(editor, new selection_1.Selection(1, 19, 1, 21), new selection_1.Selection(2, 23, 2, 25));
            ctrl.next(); // inner `value`
            assertSelections(editor, new selection_1.Selection(1, 24, 1, 29), new selection_1.Selection(2, 28, 2, 33));
            ctrl.next(); // inner `$0`
            assertSelections(editor, new selection_1.Selection(1, 31, 1, 31), new selection_1.Selection(2, 35, 2, 35));
            ctrl.next(); // outer `value`
            assertSelections(editor, new selection_1.Selection(1, 34, 1, 39), new selection_1.Selection(2, 38, 2, 43));
            ctrl.prev(); // inner `$0`
            assertSelections(editor, new selection_1.Selection(1, 31, 1, 31), new selection_1.Selection(2, 35, 2, 35));
        });
        test('Snippet tabstop selecting content of previously entered variable only works when separated by space, #23728', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('import ${2:${1:module}} from \'${1:module}\'$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 8, 1, 14), new selection_1.Selection(1, 21, 1, 27));
            ctrl.insert('foo');
            assertSelections(editor, new selection_1.Selection(1, 11, 1, 11), new selection_1.Selection(1, 21, 1, 21));
            ctrl.next(); // ${2:...}
            assertSelections(editor, new selection_1.Selection(1, 8, 1, 11));
        });
        test('HTML Snippets Combine, #32211', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            model.updateOptions({ insertSpaces: false, tabSize: 4, trimAutoWhitespace: false });
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert(`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=\${2:device-width}, initial-scale=\${3:1.0}">
				<meta http-equiv="X-UA-Compatible" content="\${5:ie=edge}">
				<title>\${7:Document}</title>
			</head>
			<body>
				\${8}
			</body>
			</html>
		`);
            ctrl.next();
            ctrl.next();
            ctrl.next();
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(11, 5, 11, 5));
            ctrl.insert('<input type="${2:text}">');
            assertSelections(editor, new selection_1.Selection(11, 18, 11, 22));
        });
        test('Problems with nested snippet insertion #39594', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('$1 = ConvertTo-Json $1');
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 19, 1, 19));
            editor.setSelection(new selection_1.Selection(1, 19, 1, 19));
            // snippet mode should stop because $1 has two occurrences
            // and we only have one selection left
            assertContextKeys(contextKeys, false, false, false);
        });
        test('Problems with nested snippet insertion #39594', function () {
            // ensure selection-change-to-cancel logic isn't too aggressive
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('a-\naaa-');
            editor.setSelections([new selection_1.Selection(2, 5, 2, 5), new selection_1.Selection(1, 3, 1, 3)]);
            ctrl.insert('log($1);$0');
            assertSelections(editor, new selection_1.Selection(2, 9, 2, 9), new selection_1.Selection(1, 7, 1, 7));
            assertContextKeys(contextKeys, true, false, true);
        });
        test('“Nested” snippets terminating abruptly in VSCode 1.19.2. #42012', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('var ${2:${1:name}} = ${1:name} + 1;${0}');
            assertSelections(editor, new selection_1.Selection(1, 5, 1, 9), new selection_1.Selection(1, 12, 1, 16));
            assertContextKeys(contextKeys, true, false, true);
            ctrl.next();
            assertContextKeys(contextKeys, true, true, true);
        });
        test('Placeholders order #58267', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('\\pth{$1}$0');
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 6));
            assertContextKeys(contextKeys, true, false, true);
            ctrl.insert('\\itv{${1:left}}{${2:right}}{${3:left_value}}{${4:right_value}}$0');
            assertSelections(editor, new selection_1.Selection(1, 11, 1, 15));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 17, 1, 22));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 24, 1, 34));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 36, 1, 47));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 48, 1, 48));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 49, 1, 49));
            assertContextKeys(contextKeys, false, false, false);
        });
        test('Must tab through deleted tab stops in snippets #31619', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('foo${1:a${2:bar}baz}end$0');
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 11));
            editor.trigger('test', "cut" /* Handler.Cut */, null);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7));
            assertContextKeys(contextKeys, false, false, false);
        });
        test('Cancelling snippet mode should discard added cursors #68512 (soft cancel)', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('.REGION ${2:FUNCTION_NAME}\nCREATE.FUNCTION ${1:VOID} ${2:FUNCTION_NAME}(${3:})\n\t${4:}\nEND\n.ENDREGION$0');
            assertSelections(editor, new selection_1.Selection(2, 17, 2, 21));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 22), new selection_1.Selection(2, 22, 2, 35));
            assertContextKeys(contextKeys, true, true, true);
            editor.setSelections([new selection_1.Selection(1, 22, 1, 22), new selection_1.Selection(2, 35, 2, 35)]);
            assertContextKeys(contextKeys, true, true, true);
            editor.setSelections([new selection_1.Selection(2, 1, 2, 1), new selection_1.Selection(2, 36, 2, 36)]);
            assertContextKeys(contextKeys, false, false, false);
            assertSelections(editor, new selection_1.Selection(2, 1, 2, 1), new selection_1.Selection(2, 36, 2, 36));
        });
        test('Cancelling snippet mode should discard added cursors #68512 (hard cancel)', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('.REGION ${2:FUNCTION_NAME}\nCREATE.FUNCTION ${1:VOID} ${2:FUNCTION_NAME}(${3:})\n\t${4:}\nEND\n.ENDREGION$0');
            assertSelections(editor, new selection_1.Selection(2, 17, 2, 21));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 22), new selection_1.Selection(2, 22, 2, 35));
            assertContextKeys(contextKeys, true, true, true);
            editor.setSelections([new selection_1.Selection(1, 22, 1, 22), new selection_1.Selection(2, 35, 2, 35)]);
            assertContextKeys(contextKeys, true, true, true);
            ctrl.cancel(true);
            assertContextKeys(contextKeys, false, false, false);
            assertSelections(editor, new selection_1.Selection(1, 22, 1, 22));
        });
        test('User defined snippet tab stops ignored #72862', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('export default $1');
            assertContextKeys(contextKeys, true, false, true);
        });
        test('Optional tabstop in snippets #72358', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            ctrl.insert('${1:prop: {$2\\},}\nmore$0');
            assertContextKeys(contextKeys, true, false, true);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 10));
            editor.trigger('test', "cut" /* Handler.Cut */, {});
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1));
            ctrl.next();
            assertSelections(editor, new selection_1.Selection(2, 5, 2, 5));
            assertContextKeys(contextKeys, false, false, false);
        });
        test('issue #90135: confusing trim whitespace edits', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
            ctrl.insert('\nfoo');
            assertSelections(editor, new selection_1.Selection(2, 8, 2, 8));
        });
        test('issue #145727: insertSnippet can put snippet selections in wrong positions (1 of 2)', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
            ctrl.insert('\naProperty: aClass<${2:boolean}> = new aClass<${2:boolean}>();\n', { adjustWhitespace: false });
            assertSelections(editor, new selection_1.Selection(2, 19, 2, 26), new selection_1.Selection(2, 41, 2, 48));
        });
        test('issue #145727: insertSnippet can put snippet selections in wrong positions (2 of 2)', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
            ctrl.insert('\naProperty: aClass<${2:boolean}> = new aClass<${2:boolean}>();\n');
            // This will insert \n    aProperty....
            assertSelections(editor, new selection_1.Selection(2, 23, 2, 30), new selection_1.Selection(2, 45, 2, 52));
        });
        test('leading TAB by snippets won\'t replace by spaces #101870', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            model.updateOptions({ insertSpaces: true, tabSize: 4 });
            ctrl.insert('\tHello World\n\tNew Line');
            assert.strictEqual(model.getValue(), '    Hello World\n    New Line');
        });
        test('leading TAB by snippets won\'t replace by spaces #101870 (part 2)', function () {
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            model.updateOptions({ insertSpaces: true, tabSize: 4 });
            ctrl.insert('\tHello World\n\tNew Line\n${1:\tmore}');
            assert.strictEqual(model.getValue(), '    Hello World\n    New Line\n    more');
        });
        test.skip('Snippet transformation does not work after inserting variable using intellisense, #112362', function () {
            {
                // HAPPY - no nested snippet
                const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
                model.setValue('');
                model.updateOptions({ insertSpaces: true, tabSize: 4 });
                ctrl.insert('$1\n\n${1/([A-Za-z0-9]+): ([A-Za-z]+).*/$1: \'$2\',/gm}');
                assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(3, 1, 3, 1));
                editor.trigger('test', 'type', { text: 'foo: number;' });
                ctrl.next();
                assert.strictEqual(model.getValue(), `foo: number;\n\nfoo: 'number',`);
            }
            const ctrl = instaService.createInstance(snippetController2_1.SnippetController2, editor);
            model.setValue('');
            model.updateOptions({ insertSpaces: true, tabSize: 4 });
            ctrl.insert('$1\n\n${1/([A-Za-z0-9]+): ([A-Za-z]+).*/$1: \'$2\',/gm}');
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(3, 1, 3, 1));
            editor.trigger('test', 'type', { text: 'foo: ' });
            ctrl.insert('number;');
            ctrl.next();
            assert.strictEqual(model.getValue(), `foo: number;\n\nfoo: 'number',`);
            // editor.trigger('test', 'type', { text: ';' });
        });
    });
});
//# sourceMappingURL=snippetController2.test.js.map