/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, strings, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewRulerDecorationsGroup = exports.ViewModelDecoration = exports.SingleLineInlineDecoration = exports.InlineDecoration = exports.InlineDecorationType = exports.ViewLineRenderingData = exports.ViewLineData = exports.MinimapLinesRenderingData = exports.Viewport = void 0;
    class Viewport {
        constructor(top, left, width, height) {
            this._viewportBrand = undefined;
            this.top = top | 0;
            this.left = left | 0;
            this.width = width | 0;
            this.height = height | 0;
        }
    }
    exports.Viewport = Viewport;
    class MinimapLinesRenderingData {
        constructor(tabSize, data) {
            this.tabSize = tabSize;
            this.data = data;
        }
    }
    exports.MinimapLinesRenderingData = MinimapLinesRenderingData;
    class ViewLineData {
        constructor(content, continuesWithWrappedLine, minColumn, maxColumn, startVisibleColumn, tokens, inlineDecorations) {
            this._viewLineDataBrand = undefined;
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.startVisibleColumn = startVisibleColumn;
            this.tokens = tokens;
            this.inlineDecorations = inlineDecorations;
        }
    }
    exports.ViewLineData = ViewLineData;
    class ViewLineRenderingData {
        constructor(minColumn, maxColumn, content, continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, tokens, inlineDecorations, tabSize, startVisibleColumn) {
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.isBasicASCII = ViewLineRenderingData.isBasicASCII(content, mightContainNonBasicASCII);
            this.containsRTL = ViewLineRenderingData.containsRTL(content, this.isBasicASCII, mightContainRTL);
            this.tokens = tokens;
            this.inlineDecorations = inlineDecorations;
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
        }
        static isBasicASCII(lineContent, mightContainNonBasicASCII) {
            if (mightContainNonBasicASCII) {
                return strings.isBasicASCII(lineContent);
            }
            return true;
        }
        static containsRTL(lineContent, isBasicASCII, mightContainRTL) {
            if (!isBasicASCII && mightContainRTL) {
                return strings.containsRTL(lineContent);
            }
            return false;
        }
    }
    exports.ViewLineRenderingData = ViewLineRenderingData;
    var InlineDecorationType;
    (function (InlineDecorationType) {
        InlineDecorationType[InlineDecorationType["Regular"] = 0] = "Regular";
        InlineDecorationType[InlineDecorationType["Before"] = 1] = "Before";
        InlineDecorationType[InlineDecorationType["After"] = 2] = "After";
        InlineDecorationType[InlineDecorationType["RegularAffectingLetterSpacing"] = 3] = "RegularAffectingLetterSpacing";
    })(InlineDecorationType = exports.InlineDecorationType || (exports.InlineDecorationType = {}));
    class InlineDecoration {
        constructor(range, inlineClassName, type) {
            this.range = range;
            this.inlineClassName = inlineClassName;
            this.type = type;
        }
    }
    exports.InlineDecoration = InlineDecoration;
    class SingleLineInlineDecoration {
        constructor(startOffset, endOffset, inlineClassName, inlineClassNameAffectsLetterSpacing) {
            this.startOffset = startOffset;
            this.endOffset = endOffset;
            this.inlineClassName = inlineClassName;
            this.inlineClassNameAffectsLetterSpacing = inlineClassNameAffectsLetterSpacing;
        }
        toInlineDecoration(lineNumber) {
            return new InlineDecoration(new range_1.Range(lineNumber, this.startOffset + 1, lineNumber, this.endOffset + 1), this.inlineClassName, this.inlineClassNameAffectsLetterSpacing ? 3 /* InlineDecorationType.RegularAffectingLetterSpacing */ : 0 /* InlineDecorationType.Regular */);
        }
    }
    exports.SingleLineInlineDecoration = SingleLineInlineDecoration;
    class ViewModelDecoration {
        constructor(range, options) {
            this._viewModelDecorationBrand = undefined;
            this.range = range;
            this.options = options;
        }
    }
    exports.ViewModelDecoration = ViewModelDecoration;
    class OverviewRulerDecorationsGroup {
        constructor(color, zIndex, 
        /**
         * Decorations are encoded in a number array using the following scheme:
         *  - 3*i = lane
         *  - 3*i+1 = startLineNumber
         *  - 3*i+2 = endLineNumber
         */
        data) {
            this.color = color;
            this.zIndex = zIndex;
            this.data = data;
        }
        static cmp(a, b) {
            if (a.zIndex === b.zIndex) {
                if (a.color < b.color) {
                    return -1;
                }
                if (a.color > b.color) {
                    return 1;
                }
                return 0;
            }
            return a.zIndex - b.zIndex;
        }
    }
    exports.OverviewRulerDecorationsGroup = OverviewRulerDecorationsGroup;
});
//# sourceMappingURL=viewModel.js.map