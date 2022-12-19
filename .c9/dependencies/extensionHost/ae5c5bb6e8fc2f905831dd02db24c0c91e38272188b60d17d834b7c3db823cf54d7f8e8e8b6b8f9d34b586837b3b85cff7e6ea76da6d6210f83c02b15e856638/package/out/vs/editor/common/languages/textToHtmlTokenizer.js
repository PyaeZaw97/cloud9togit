/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/tokens/lineTokens", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize"], function (require, exports, strings, lineTokens_1, languages_1, nullTokenize_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports._tokenizeToString = exports.tokenizeLineToHTML = exports.tokenizeToString = exports.tokenizeToStringSync = void 0;
    const fallback = {
        getInitialState: () => nullTokenize_1.NullState,
        tokenizeEncoded: (buffer, hasEOL, state) => (0, nullTokenize_1.nullTokenizeEncoded)(0 /* LanguageId.Null */, state)
    };
    function tokenizeToStringSync(languageService, text, languageId) {
        return _tokenizeToString(text, languageService.languageIdCodec, languages_1.TokenizationRegistry.get(languageId) || fallback);
    }
    exports.tokenizeToStringSync = tokenizeToStringSync;
    async function tokenizeToString(languageService, text, languageId) {
        if (!languageId) {
            return _tokenizeToString(text, languageService.languageIdCodec, fallback);
        }
        const tokenizationSupport = await languages_1.TokenizationRegistry.getOrCreate(languageId);
        return _tokenizeToString(text, languageService.languageIdCodec, tokenizationSupport || fallback);
    }
    exports.tokenizeToString = tokenizeToString;
    function tokenizeLineToHTML(text, viewLineTokens, colorMap, startOffset, endOffset, tabSize, useNbsp) {
        let result = `<div>`;
        let charIndex = startOffset;
        let tabsCharDelta = 0;
        let prevIsSpace = true;
        for (let tokenIndex = 0, tokenCount = viewLineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
            const tokenEndIndex = viewLineTokens.getEndOffset(tokenIndex);
            if (tokenEndIndex <= startOffset) {
                continue;
            }
            let partContent = '';
            for (; charIndex < tokenEndIndex && charIndex < endOffset; charIndex++) {
                const charCode = text.charCodeAt(charIndex);
                switch (charCode) {
                    case 9 /* CharCode.Tab */: {
                        let insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                        tabsCharDelta += insertSpacesCount - 1;
                        while (insertSpacesCount > 0) {
                            if (useNbsp && prevIsSpace) {
                                partContent += '&#160;';
                                prevIsSpace = false;
                            }
                            else {
                                partContent += ' ';
                                prevIsSpace = true;
                            }
                            insertSpacesCount--;
                        }
                        break;
                    }
                    case 60 /* CharCode.LessThan */:
                        partContent += '&lt;';
                        prevIsSpace = false;
                        break;
                    case 62 /* CharCode.GreaterThan */:
                        partContent += '&gt;';
                        prevIsSpace = false;
                        break;
                    case 38 /* CharCode.Ampersand */:
                        partContent += '&amp;';
                        prevIsSpace = false;
                        break;
                    case 0 /* CharCode.Null */:
                        partContent += '&#00;';
                        prevIsSpace = false;
                        break;
                    case 65279 /* CharCode.UTF8_BOM */:
                    case 8232 /* CharCode.LINE_SEPARATOR */:
                    case 8233 /* CharCode.PARAGRAPH_SEPARATOR */:
                    case 133 /* CharCode.NEXT_LINE */:
                        partContent += '\ufffd';
                        prevIsSpace = false;
                        break;
                    case 13 /* CharCode.CarriageReturn */:
                        // zero width space, because carriage return would introduce a line break
                        partContent += '&#8203';
                        prevIsSpace = false;
                        break;
                    case 32 /* CharCode.Space */:
                        if (useNbsp && prevIsSpace) {
                            partContent += '&#160;';
                            prevIsSpace = false;
                        }
                        else {
                            partContent += ' ';
                            prevIsSpace = true;
                        }
                        break;
                    default:
                        partContent += String.fromCharCode(charCode);
                        prevIsSpace = false;
                }
            }
            result += `<span style="${viewLineTokens.getInlineStyle(tokenIndex, colorMap)}">${partContent}</span>`;
            if (tokenEndIndex > endOffset || charIndex >= endOffset) {
                break;
            }
        }
        result += `</div>`;
        return result;
    }
    exports.tokenizeLineToHTML = tokenizeLineToHTML;
    function _tokenizeToString(text, languageIdCodec, tokenizationSupport) {
        let result = `<div class="monaco-tokenized-source">`;
        const lines = strings.splitLines(text);
        let currentState = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i];
            if (i > 0) {
                result += `<br/>`;
            }
            const tokenizationResult = tokenizationSupport.tokenizeEncoded(line, true, currentState);
            lineTokens_1.LineTokens.convertToEndOffset(tokenizationResult.tokens, line.length);
            const lineTokens = new lineTokens_1.LineTokens(tokenizationResult.tokens, line, languageIdCodec);
            const viewLineTokens = lineTokens.inflate();
            let startOffset = 0;
            for (let j = 0, lenJ = viewLineTokens.getCount(); j < lenJ; j++) {
                const type = viewLineTokens.getClassName(j);
                const endIndex = viewLineTokens.getEndOffset(j);
                result += `<span class="${type}">${strings.escape(line.substring(startOffset, endIndex))}</span>`;
                startOffset = endIndex;
            }
            currentState = tokenizationResult.endState;
        }
        result += `</div>`;
        return result;
    }
    exports._tokenizeToString = _tokenizeToString;
});
//# sourceMappingURL=textToHtmlTokenizer.js.map