/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/snippet/browser/snippetController2", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/snippets/browser/snippetPicker", "vs/workbench/contrib/snippets/browser/snippets.contribution"], function (require, exports, editorExtensions_1, editorContextKeys_1, snippetController2_1, nls_1, actions_1, clipboardService_1, contextkey_1, instantiation_1, snippetPicker_1, snippets_contribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class SurroundWithAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.surroundWithSnippet',
                title: { value: (0, nls_1.localize)('label', 'Surround With Snippet...'), original: 'Surround With Snippet...' },
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
                f1: true
            });
        }
        async runEditorCommand(accessor, editor, ...args) {
            var _a;
            const snippetService = accessor.get(snippets_contribution_1.ISnippetsService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            if (!editor.hasModel()) {
                return;
            }
            const { lineNumber, column } = editor.getPosition();
            editor.getModel().tokenization.tokenizeIfCheap(lineNumber);
            const languageId = editor.getModel().getLanguageIdAtPosition(lineNumber, column);
            const allSnippets = await snippetService.getSnippets(languageId, { includeNoPrefixSnippets: true, includeDisabledSnippets: true });
            const surroundSnippets = allSnippets.filter(snippet => snippet.usesSelection);
            const snippet = await instaService.invokeFunction(snippetPicker_1.pickSnippet, surroundSnippets);
            if (!snippet) {
                return;
            }
            let clipboardText;
            if (snippet.needsClipboard) {
                clipboardText = await clipboardService.readText();
            }
            (_a = snippetController2_1.SnippetController2.get(editor)) === null || _a === void 0 ? void 0 : _a.insert(snippet.codeSnippet, { clipboardText });
        }
    });
});
//# sourceMappingURL=surroundWithSnippet.js.map