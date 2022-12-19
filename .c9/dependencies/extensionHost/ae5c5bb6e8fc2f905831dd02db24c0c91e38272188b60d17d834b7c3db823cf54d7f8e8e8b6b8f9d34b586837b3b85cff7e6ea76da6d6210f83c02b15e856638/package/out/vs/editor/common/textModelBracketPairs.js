/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairWithMinIndentationInfo = exports.BracketPairInfo = exports.BracketInfo = void 0;
    class BracketInfo {
        constructor(range, 
        /** 0-based level */
        nestingLevel, nestingLevelOfEqualBracketType, isInvalid) {
            this.range = range;
            this.nestingLevel = nestingLevel;
            this.nestingLevelOfEqualBracketType = nestingLevelOfEqualBracketType;
            this.isInvalid = isInvalid;
        }
    }
    exports.BracketInfo = BracketInfo;
    class BracketPairInfo {
        constructor(range, openingBracketRange, closingBracketRange, 
        /** 0-based */
        nestingLevel, nestingLevelOfEqualBracketType, bracketPairNode) {
            this.range = range;
            this.openingBracketRange = openingBracketRange;
            this.closingBracketRange = closingBracketRange;
            this.nestingLevel = nestingLevel;
            this.nestingLevelOfEqualBracketType = nestingLevelOfEqualBracketType;
            this.bracketPairNode = bracketPairNode;
        }
        get openingBracketInfo() {
            return this.bracketPairNode.openingBracket.bracketInfo;
        }
        get closingBracketInfo() {
            var _a;
            return (_a = this.bracketPairNode.closingBracket) === null || _a === void 0 ? void 0 : _a.bracketInfo;
        }
    }
    exports.BracketPairInfo = BracketPairInfo;
    class BracketPairWithMinIndentationInfo extends BracketPairInfo {
        constructor(range, openingBracketRange, closingBracketRange, 
        /**
         * 0-based
        */
        nestingLevel, nestingLevelOfEqualBracketType, bracketPairNode, 
        /**
         * -1 if not requested, otherwise the size of the minimum indentation in the bracket pair in terms of visible columns.
        */
        minVisibleColumnIndentation) {
            super(range, openingBracketRange, closingBracketRange, nestingLevel, nestingLevelOfEqualBracketType, bracketPairNode);
            this.minVisibleColumnIndentation = minVisibleColumnIndentation;
        }
    }
    exports.BracketPairWithMinIndentationInfo = BracketPairWithMinIndentationInfo;
});
//# sourceMappingURL=textModelBracketPairs.js.map