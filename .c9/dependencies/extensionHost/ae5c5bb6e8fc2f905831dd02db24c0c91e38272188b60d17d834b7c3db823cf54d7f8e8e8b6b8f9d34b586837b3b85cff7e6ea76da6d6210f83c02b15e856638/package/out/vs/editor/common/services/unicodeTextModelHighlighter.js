/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model/textModelSearch", "vs/base/common/strings", "vs/base/common/types", "vs/editor/common/core/wordHelper"], function (require, exports, range_1, textModelSearch_1, strings, types_1, wordHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnicodeHighlighterReasonKind = exports.UnicodeTextModelHighlighter = void 0;
    class UnicodeTextModelHighlighter {
        static computeUnicodeHighlights(model, options, range) {
            const startLine = range ? range.startLineNumber : 1;
            const endLine = range ? range.endLineNumber : model.getLineCount();
            const codePointHighlighter = new CodePointHighlighter(options);
            const candidates = codePointHighlighter.getCandidateCodePoints();
            let regex;
            if (candidates === 'allNonBasicAscii') {
                regex = new RegExp('[^\\t\\n\\r\\x20-\\x7E]', 'g');
            }
            else {
                regex = new RegExp(`${buildRegExpCharClassExpr(Array.from(candidates))}`, 'g');
            }
            const searcher = new textModelSearch_1.Searcher(null, regex);
            const ranges = [];
            let hasMore = false;
            let m;
            let ambiguousCharacterCount = 0;
            let invisibleCharacterCount = 0;
            let nonBasicAsciiCharacterCount = 0;
            forLoop: for (let lineNumber = startLine, lineCount = endLine; lineNumber <= lineCount; lineNumber++) {
                const lineContent = model.getLineContent(lineNumber);
                const lineLength = lineContent.length;
                // Reset regex to search from the beginning
                searcher.reset(0);
                do {
                    m = searcher.next(lineContent);
                    if (m) {
                        let startIndex = m.index;
                        let endIndex = m.index + m[0].length;
                        // Extend range to entire code point
                        if (startIndex > 0) {
                            const charCodeBefore = lineContent.charCodeAt(startIndex - 1);
                            if (strings.isHighSurrogate(charCodeBefore)) {
                                startIndex--;
                            }
                        }
                        if (endIndex + 1 < lineLength) {
                            const charCodeBefore = lineContent.charCodeAt(endIndex - 1);
                            if (strings.isHighSurrogate(charCodeBefore)) {
                                endIndex++;
                            }
                        }
                        const str = lineContent.substring(startIndex, endIndex);
                        const word = (0, wordHelper_1.getWordAtText)(startIndex + 1, wordHelper_1.DEFAULT_WORD_REGEXP, lineContent, 0);
                        const highlightReason = codePointHighlighter.shouldHighlightNonBasicASCII(str, word ? word.word : null);
                        if (highlightReason !== 0 /* SimpleHighlightReason.None */) {
                            if (highlightReason === 3 /* SimpleHighlightReason.Ambiguous */) {
                                ambiguousCharacterCount++;
                            }
                            else if (highlightReason === 2 /* SimpleHighlightReason.Invisible */) {
                                invisibleCharacterCount++;
                            }
                            else if (highlightReason === 1 /* SimpleHighlightReason.NonBasicASCII */) {
                                nonBasicAsciiCharacterCount++;
                            }
                            else {
                                (0, types_1.assertNever)(highlightReason);
                            }
                            const MAX_RESULT_LENGTH = 1000;
                            if (ranges.length >= MAX_RESULT_LENGTH) {
                                hasMore = true;
                                break forLoop;
                            }
                            ranges.push(new range_1.Range(lineNumber, startIndex + 1, lineNumber, endIndex + 1));
                        }
                    }
                } while (m);
            }
            return {
                ranges,
                hasMore,
                ambiguousCharacterCount,
                invisibleCharacterCount,
                nonBasicAsciiCharacterCount
            };
        }
        static computeUnicodeHighlightReason(char, options) {
            const codePointHighlighter = new CodePointHighlighter(options);
            const reason = codePointHighlighter.shouldHighlightNonBasicASCII(char, null);
            switch (reason) {
                case 0 /* SimpleHighlightReason.None */:
                    return null;
                case 2 /* SimpleHighlightReason.Invisible */:
                    return { kind: 1 /* UnicodeHighlighterReasonKind.Invisible */ };
                case 3 /* SimpleHighlightReason.Ambiguous */: {
                    const codePoint = char.codePointAt(0);
                    const primaryConfusable = codePointHighlighter.ambiguousCharacters.getPrimaryConfusable(codePoint);
                    const notAmbiguousInLocales = strings.AmbiguousCharacters.getLocales().filter((l) => !strings.AmbiguousCharacters.getInstance(new Set([...options.allowedLocales, l])).isAmbiguous(codePoint));
                    return { kind: 0 /* UnicodeHighlighterReasonKind.Ambiguous */, confusableWith: String.fromCodePoint(primaryConfusable), notAmbiguousInLocales };
                }
                case 1 /* SimpleHighlightReason.NonBasicASCII */:
                    return { kind: 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */ };
            }
        }
    }
    exports.UnicodeTextModelHighlighter = UnicodeTextModelHighlighter;
    function buildRegExpCharClassExpr(codePoints, flags) {
        const src = `[${strings.escapeRegExpCharacters(codePoints.map((i) => String.fromCodePoint(i)).join(''))}]`;
        return src;
    }
    var UnicodeHighlighterReasonKind;
    (function (UnicodeHighlighterReasonKind) {
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["Ambiguous"] = 0] = "Ambiguous";
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["Invisible"] = 1] = "Invisible";
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["NonBasicAscii"] = 2] = "NonBasicAscii";
    })(UnicodeHighlighterReasonKind = exports.UnicodeHighlighterReasonKind || (exports.UnicodeHighlighterReasonKind = {}));
    class CodePointHighlighter {
        constructor(options) {
            this.options = options;
            this.allowedCodePoints = new Set(options.allowedCodePoints);
            this.ambiguousCharacters = strings.AmbiguousCharacters.getInstance(new Set(options.allowedLocales));
        }
        getCandidateCodePoints() {
            if (this.options.nonBasicASCII) {
                return 'allNonBasicAscii';
            }
            const set = new Set();
            if (this.options.invisibleCharacters) {
                for (const cp of strings.InvisibleCharacters.codePoints) {
                    if (!isAllowedInvisibleCharacter(String.fromCodePoint(cp))) {
                        set.add(cp);
                    }
                }
            }
            if (this.options.ambiguousCharacters) {
                for (const cp of this.ambiguousCharacters.getConfusableCodePoints()) {
                    set.add(cp);
                }
            }
            for (const cp of this.allowedCodePoints) {
                set.delete(cp);
            }
            return set;
        }
        shouldHighlightNonBasicASCII(character, wordContext) {
            const codePoint = character.codePointAt(0);
            if (this.allowedCodePoints.has(codePoint)) {
                return 0 /* SimpleHighlightReason.None */;
            }
            if (this.options.nonBasicASCII) {
                return 1 /* SimpleHighlightReason.NonBasicASCII */;
            }
            let hasBasicASCIICharacters = false;
            let hasNonConfusableNonBasicAsciiCharacter = false;
            if (wordContext) {
                for (let char of wordContext) {
                    const codePoint = char.codePointAt(0);
                    const isBasicASCII = strings.isBasicASCII(char);
                    hasBasicASCIICharacters = hasBasicASCIICharacters || isBasicASCII;
                    if (!isBasicASCII &&
                        !this.ambiguousCharacters.isAmbiguous(codePoint) &&
                        !strings.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                        hasNonConfusableNonBasicAsciiCharacter = true;
                    }
                }
            }
            if (
            /* Don't allow mixing weird looking characters with ASCII */ !hasBasicASCIICharacters &&
                /* Is there an obviously weird looking character? */ hasNonConfusableNonBasicAsciiCharacter) {
                return 0 /* SimpleHighlightReason.None */;
            }
            if (this.options.invisibleCharacters) {
                // TODO check for emojis
                if (!isAllowedInvisibleCharacter(character) && strings.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                    return 2 /* SimpleHighlightReason.Invisible */;
                }
            }
            if (this.options.ambiguousCharacters) {
                if (this.ambiguousCharacters.isAmbiguous(codePoint)) {
                    return 3 /* SimpleHighlightReason.Ambiguous */;
                }
            }
            return 0 /* SimpleHighlightReason.None */;
        }
    }
    function isAllowedInvisibleCharacter(character) {
        return character === ' ' || character === '\n' || character === '\t';
    }
    var SimpleHighlightReason;
    (function (SimpleHighlightReason) {
        SimpleHighlightReason[SimpleHighlightReason["None"] = 0] = "None";
        SimpleHighlightReason[SimpleHighlightReason["NonBasicASCII"] = 1] = "NonBasicASCII";
        SimpleHighlightReason[SimpleHighlightReason["Invisible"] = 2] = "Invisible";
        SimpleHighlightReason[SimpleHighlightReason["Ambiguous"] = 3] = "Ambiguous";
    })(SimpleHighlightReason || (SimpleHighlightReason = {}));
});
//# sourceMappingURL=unicodeTextModelHighlighter.js.map