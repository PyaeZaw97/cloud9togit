/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages"], function (require, exports, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestLineTokenFactory = exports.TestLineTokens = exports.TestLineToken = void 0;
    /**
     * A token on a line.
     */
    class TestLineToken {
        constructor(endIndex, metadata) {
            this.endIndex = endIndex;
            this._metadata = metadata;
        }
        getForeground() {
            return languages_1.TokenMetadata.getForeground(this._metadata);
        }
        getType() {
            return languages_1.TokenMetadata.getClassNameFromMetadata(this._metadata);
        }
        getInlineStyle(colorMap) {
            return languages_1.TokenMetadata.getInlineStyleFromMetadata(this._metadata, colorMap);
        }
        getPresentation() {
            return languages_1.TokenMetadata.getPresentationFromMetadata(this._metadata);
        }
        static _equals(a, b) {
            return (a.endIndex === b.endIndex
                && a._metadata === b._metadata);
        }
        static equalsArr(a, b) {
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!this._equals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.TestLineToken = TestLineToken;
    class TestLineTokens {
        constructor(actual) {
            this._actual = actual;
        }
        equals(other) {
            if (other instanceof TestLineTokens) {
                return TestLineToken.equalsArr(this._actual, other._actual);
            }
            return false;
        }
        getCount() {
            return this._actual.length;
        }
        getForeground(tokenIndex) {
            return this._actual[tokenIndex].getForeground();
        }
        getEndOffset(tokenIndex) {
            return this._actual[tokenIndex].endIndex;
        }
        getClassName(tokenIndex) {
            return this._actual[tokenIndex].getType();
        }
        getInlineStyle(tokenIndex, colorMap) {
            return this._actual[tokenIndex].getInlineStyle(colorMap);
        }
        getPresentation(tokenIndex) {
            return this._actual[tokenIndex].getPresentation();
        }
        findTokenIndexAtOffset(offset) {
            throw new Error('Not implemented');
        }
        getLineContent() {
            throw new Error('Not implemented');
        }
        getMetadata(tokenIndex) {
            throw new Error('Method not implemented.');
        }
        getLanguageId(tokenIndex) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestLineTokens = TestLineTokens;
    class TestLineTokenFactory {
        static inflateArr(tokens) {
            const tokensCount = (tokens.length >>> 1);
            let result = new Array(tokensCount);
            for (let i = 0; i < tokensCount; i++) {
                const endOffset = tokens[i << 1];
                const metadata = tokens[(i << 1) + 1];
                result[i] = new TestLineToken(endOffset, metadata);
            }
            return result;
        }
    }
    exports.TestLineTokenFactory = TestLineTokenFactory;
});
//# sourceMappingURL=testLineToken.js.map