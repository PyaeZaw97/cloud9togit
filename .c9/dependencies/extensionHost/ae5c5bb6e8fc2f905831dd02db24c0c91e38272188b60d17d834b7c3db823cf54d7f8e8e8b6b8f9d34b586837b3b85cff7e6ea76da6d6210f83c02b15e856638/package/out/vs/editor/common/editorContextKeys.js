/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorContextKeys = void 0;
    var EditorContextKeys;
    (function (EditorContextKeys) {
        EditorContextKeys.editorSimpleInput = new contextkey_1.RawContextKey('editorSimpleInput', false, true);
        /**
         * A context key that is set when the editor's text has focus (cursor is blinking).
         * Is false when focus is in simple editor widgets (repl input, scm commit input).
         */
        EditorContextKeys.editorTextFocus = new contextkey_1.RawContextKey('editorTextFocus', false, nls.localize('editorTextFocus', "Whether the editor text has focus (cursor is blinking)"));
        /**
         * A context key that is set when the editor's text or an editor's widget has focus.
         */
        EditorContextKeys.focus = new contextkey_1.RawContextKey('editorFocus', false, nls.localize('editorFocus', "Whether the editor or an editor widget has focus (e.g. focus is in the find widget)"));
        /**
         * A context key that is set when any editor input has focus (regular editor, repl input...).
         */
        EditorContextKeys.textInputFocus = new contextkey_1.RawContextKey('textInputFocus', false, nls.localize('textInputFocus', "Whether an editor or a rich text input has focus (cursor is blinking)"));
        EditorContextKeys.readOnly = new contextkey_1.RawContextKey('editorReadonly', false, nls.localize('editorReadonly', "Whether the editor is read only"));
        EditorContextKeys.inDiffEditor = new contextkey_1.RawContextKey('inDiffEditor', false, nls.localize('inDiffEditor', "Whether the context is a diff editor"));
        EditorContextKeys.columnSelection = new contextkey_1.RawContextKey('editorColumnSelection', false, nls.localize('editorColumnSelection', "Whether `editor.columnSelection` is enabled"));
        EditorContextKeys.writable = EditorContextKeys.readOnly.toNegated();
        EditorContextKeys.hasNonEmptySelection = new contextkey_1.RawContextKey('editorHasSelection', false, nls.localize('editorHasSelection', "Whether the editor has text selected"));
        EditorContextKeys.hasOnlyEmptySelection = EditorContextKeys.hasNonEmptySelection.toNegated();
        EditorContextKeys.hasMultipleSelections = new contextkey_1.RawContextKey('editorHasMultipleSelections', false, nls.localize('editorHasMultipleSelections', "Whether the editor has multiple selections"));
        EditorContextKeys.hasSingleSelection = EditorContextKeys.hasMultipleSelections.toNegated();
        EditorContextKeys.tabMovesFocus = new contextkey_1.RawContextKey('editorTabMovesFocus', false, nls.localize('editorTabMovesFocus', "Whether `Tab` will move focus out of the editor"));
        EditorContextKeys.tabDoesNotMoveFocus = EditorContextKeys.tabMovesFocus.toNegated();
        EditorContextKeys.isInWalkThroughSnippet = new contextkey_1.RawContextKey('isInEmbeddedEditor', false, true);
        EditorContextKeys.canUndo = new contextkey_1.RawContextKey('canUndo', false, true);
        EditorContextKeys.canRedo = new contextkey_1.RawContextKey('canRedo', false, true);
        EditorContextKeys.hoverVisible = new contextkey_1.RawContextKey('editorHoverVisible', false, nls.localize('editorHoverVisible', "Whether the editor hover is visible"));
        /**
         * A context key that is set when an editor is part of a larger editor, like notebooks or
         * (future) a diff editor
         */
        EditorContextKeys.inCompositeEditor = new contextkey_1.RawContextKey('inCompositeEditor', undefined, nls.localize('inCompositeEditor', "Whether the editor is part of a larger editor (e.g. notebooks)"));
        EditorContextKeys.notInCompositeEditor = EditorContextKeys.inCompositeEditor.toNegated();
        // -- mode context keys
        EditorContextKeys.languageId = new contextkey_1.RawContextKey('editorLangId', '', nls.localize('editorLangId', "The language identifier of the editor"));
        EditorContextKeys.hasCompletionItemProvider = new contextkey_1.RawContextKey('editorHasCompletionItemProvider', false, nls.localize('editorHasCompletionItemProvider', "Whether the editor has a completion item provider"));
        EditorContextKeys.hasCodeActionsProvider = new contextkey_1.RawContextKey('editorHasCodeActionsProvider', false, nls.localize('editorHasCodeActionsProvider', "Whether the editor has a code actions provider"));
        EditorContextKeys.hasCodeLensProvider = new contextkey_1.RawContextKey('editorHasCodeLensProvider', false, nls.localize('editorHasCodeLensProvider', "Whether the editor has a code lens provider"));
        EditorContextKeys.hasDefinitionProvider = new contextkey_1.RawContextKey('editorHasDefinitionProvider', false, nls.localize('editorHasDefinitionProvider', "Whether the editor has a definition provider"));
        EditorContextKeys.hasDeclarationProvider = new contextkey_1.RawContextKey('editorHasDeclarationProvider', false, nls.localize('editorHasDeclarationProvider', "Whether the editor has a declaration provider"));
        EditorContextKeys.hasImplementationProvider = new contextkey_1.RawContextKey('editorHasImplementationProvider', false, nls.localize('editorHasImplementationProvider', "Whether the editor has an implementation provider"));
        EditorContextKeys.hasTypeDefinitionProvider = new contextkey_1.RawContextKey('editorHasTypeDefinitionProvider', false, nls.localize('editorHasTypeDefinitionProvider', "Whether the editor has a type definition provider"));
        EditorContextKeys.hasHoverProvider = new contextkey_1.RawContextKey('editorHasHoverProvider', false, nls.localize('editorHasHoverProvider', "Whether the editor has a hover provider"));
        EditorContextKeys.hasDocumentHighlightProvider = new contextkey_1.RawContextKey('editorHasDocumentHighlightProvider', false, nls.localize('editorHasDocumentHighlightProvider', "Whether the editor has a document highlight provider"));
        EditorContextKeys.hasDocumentSymbolProvider = new contextkey_1.RawContextKey('editorHasDocumentSymbolProvider', false, nls.localize('editorHasDocumentSymbolProvider', "Whether the editor has a document symbol provider"));
        EditorContextKeys.hasReferenceProvider = new contextkey_1.RawContextKey('editorHasReferenceProvider', false, nls.localize('editorHasReferenceProvider', "Whether the editor has a reference provider"));
        EditorContextKeys.hasRenameProvider = new contextkey_1.RawContextKey('editorHasRenameProvider', false, nls.localize('editorHasRenameProvider', "Whether the editor has a rename provider"));
        EditorContextKeys.hasSignatureHelpProvider = new contextkey_1.RawContextKey('editorHasSignatureHelpProvider', false, nls.localize('editorHasSignatureHelpProvider', "Whether the editor has a signature help provider"));
        EditorContextKeys.hasInlayHintsProvider = new contextkey_1.RawContextKey('editorHasInlayHintsProvider', false, nls.localize('editorHasInlayHintsProvider', "Whether the editor has an inline hints provider"));
        // -- mode context keys: formatting
        EditorContextKeys.hasDocumentFormattingProvider = new contextkey_1.RawContextKey('editorHasDocumentFormattingProvider', false, nls.localize('editorHasDocumentFormattingProvider', "Whether the editor has a document formatting provider"));
        EditorContextKeys.hasDocumentSelectionFormattingProvider = new contextkey_1.RawContextKey('editorHasDocumentSelectionFormattingProvider', false, nls.localize('editorHasDocumentSelectionFormattingProvider', "Whether the editor has a document selection formatting provider"));
        EditorContextKeys.hasMultipleDocumentFormattingProvider = new contextkey_1.RawContextKey('editorHasMultipleDocumentFormattingProvider', false, nls.localize('editorHasMultipleDocumentFormattingProvider', "Whether the editor has multiple document formatting providers"));
        EditorContextKeys.hasMultipleDocumentSelectionFormattingProvider = new contextkey_1.RawContextKey('editorHasMultipleDocumentSelectionFormattingProvider', false, nls.localize('editorHasMultipleDocumentSelectionFormattingProvider', "Whether the editor has multiple document selection formatting providers"));
    })(EditorContextKeys = exports.EditorContextKeys || (exports.EditorContextKeys = {}));
});
//# sourceMappingURL=editorContextKeys.js.map