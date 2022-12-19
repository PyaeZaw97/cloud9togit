/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/editor/common/languages/language", "vs/platform/commands/common/commands", "vs/workbench/contrib/snippets/browser/snippets.contribution", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/platform/clipboard/common/clipboardService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/snippets/browser/snippetPicker"], function (require, exports, nls, editorExtensions_1, language_1, commands_1, snippets_contribution_1, snippetController2_1, editorContextKeys_1, snippetsFile_1, clipboardService_1, instantiation_1, snippetPicker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Args {
        constructor(snippet, name, langId) {
            this.snippet = snippet;
            this.name = name;
            this.langId = langId;
        }
        static fromUser(arg) {
            if (!arg || typeof arg !== 'object') {
                return Args._empty;
            }
            let { snippet, name, langId } = arg;
            if (typeof snippet !== 'string') {
                snippet = undefined;
            }
            if (typeof name !== 'string') {
                name = undefined;
            }
            if (typeof langId !== 'string') {
                langId = undefined;
            }
            return new Args(snippet, name, langId);
        }
    }
    Args._empty = new Args(undefined, undefined, undefined);
    class InsertSnippetAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertSnippet',
                label: nls.localize('snippet.suggestions.label', "Insert Snippet"),
                alias: 'Insert Snippet',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                description: {
                    description: `Insert Snippet`,
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'snippet': {
                                        'type': 'string'
                                    },
                                    'langId': {
                                        'type': 'string',
                                    },
                                    'name': {
                                        'type': 'string'
                                    }
                                },
                            }
                        }]
                }
            });
        }
        async run(accessor, editor, arg) {
            var _a;
            const languageService = accessor.get(language_1.ILanguageService);
            const snippetService = accessor.get(snippets_contribution_1.ISnippetsService);
            if (!editor.hasModel()) {
                return;
            }
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const snippet = await new Promise((resolve, reject) => {
                const { lineNumber, column } = editor.getPosition();
                const { snippet, name, langId } = Args.fromUser(arg);
                if (snippet) {
                    return resolve(new snippetsFile_1.Snippet([], '', '', '', snippet, '', 1 /* SnippetSource.User */));
                }
                let languageId;
                if (langId) {
                    if (!languageService.isRegisteredLanguageId(langId)) {
                        return resolve(undefined);
                    }
                    languageId = langId;
                }
                else {
                    editor.getModel().tokenization.tokenizeIfCheap(lineNumber);
                    languageId = editor.getModel().getLanguageIdAtPosition(lineNumber, column);
                    // validate the `languageId` to ensure this is a user
                    // facing language with a name and the chance to have
                    // snippets, else fall back to the outer language
                    if (!languageService.getLanguageName(languageId)) {
                        languageId = editor.getModel().getLanguageId();
                    }
                }
                if (name) {
                    // take selected snippet
                    snippetService.getSnippets(languageId, { includeNoPrefixSnippets: true })
                        .then(snippets => snippets.find(snippet => snippet.name === name))
                        .then(resolve, reject);
                }
                else {
                    // let user pick a snippet
                    resolve(instaService.invokeFunction(snippetPicker_1.pickSnippet, languageId));
                }
            });
            if (!snippet) {
                return;
            }
            let clipboardText;
            if (snippet.needsClipboard) {
                clipboardText = await clipboardService.readText();
            }
            (_a = snippetController2_1.SnippetController2.get(editor)) === null || _a === void 0 ? void 0 : _a.insert(snippet.codeSnippet, { clipboardText });
        }
    }
    (0, editorExtensions_1.registerEditorAction)(InsertSnippetAction);
    // compatibility command to make sure old keybinding are still working
    commands_1.CommandsRegistry.registerCommand('editor.action.showSnippets', accessor => {
        return accessor.get(commands_1.ICommandService).executeCommand('editor.action.insertSnippet');
    });
});
//# sourceMappingURL=insertSnippet.js.map