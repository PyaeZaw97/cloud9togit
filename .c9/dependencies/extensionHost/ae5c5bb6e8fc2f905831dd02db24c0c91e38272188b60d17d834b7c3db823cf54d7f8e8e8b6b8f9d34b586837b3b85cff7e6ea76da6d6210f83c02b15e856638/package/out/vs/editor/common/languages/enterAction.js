/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, languageConfiguration_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getEnterAction = void 0;
    function getEnterAction(autoIndent, model, range, languageConfigurationService) {
        const scopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.startLineNumber, range.startColumn);
        const richEditSupport = languageConfigurationService.getLanguageConfiguration(scopedLineTokens.languageId);
        if (!richEditSupport) {
            return null;
        }
        const scopedLineText = scopedLineTokens.getLineContent();
        const beforeEnterText = scopedLineText.substr(0, range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        // selection support
        let afterEnterText;
        if (range.isEmpty()) {
            afterEnterText = scopedLineText.substr(range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        else {
            const endScopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.endLineNumber, range.endColumn);
            afterEnterText = endScopedLineTokens.getLineContent().substr(range.endColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        let previousLineText = '';
        if (range.startLineNumber > 1 && scopedLineTokens.firstCharOffset === 0) {
            // This is not the first line and the entire line belongs to this mode
            const oneLineAboveScopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.startLineNumber - 1);
            if (oneLineAboveScopedLineTokens.languageId === scopedLineTokens.languageId) {
                // The line above ends with text belonging to the same mode
                previousLineText = oneLineAboveScopedLineTokens.getLineContent();
            }
        }
        const enterResult = richEditSupport.onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText);
        if (!enterResult) {
            return null;
        }
        const indentAction = enterResult.indentAction;
        let appendText = enterResult.appendText;
        const removeText = enterResult.removeText || 0;
        // Here we add `\t` to appendText first because enterAction is leveraging appendText and removeText to change indentation.
        if (!appendText) {
            if ((indentAction === languageConfiguration_1.IndentAction.Indent) ||
                (indentAction === languageConfiguration_1.IndentAction.IndentOutdent)) {
                appendText = '\t';
            }
            else {
                appendText = '';
            }
        }
        else if (indentAction === languageConfiguration_1.IndentAction.Indent) {
            appendText = '\t' + appendText;
        }
        let indentation = (0, languageConfigurationRegistry_1.getIndentationAtPosition)(model, range.startLineNumber, range.startColumn);
        if (removeText) {
            indentation = indentation.substring(0, indentation.length - removeText);
        }
        return {
            indentAction: indentAction,
            appendText: appendText,
            removeText: removeText,
            indentation: indentation
        };
    }
    exports.getEnterAction = getEnterAction;
});
//# sourceMappingURL=enterAction.js.map