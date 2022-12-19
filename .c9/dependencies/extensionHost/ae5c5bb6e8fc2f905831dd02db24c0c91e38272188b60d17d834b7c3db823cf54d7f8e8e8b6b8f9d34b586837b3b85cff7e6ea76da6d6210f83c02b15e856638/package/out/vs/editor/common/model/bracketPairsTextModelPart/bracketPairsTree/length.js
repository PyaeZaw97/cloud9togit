/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, strings_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lengthHash = exports.lengthOfStringObj = exports.lengthOfString = exports.lengthCompare = exports.lengthsToRange = exports.positionToLength = exports.lengthToPosition = exports.lengthGreaterThanEqual = exports.lengthLessThanEqual = exports.lengthLessThan = exports.lengthDiffNonNegative = exports.lengthAdd = exports.lengthGetColumnCountIfZeroLineCount = exports.lengthGetLineCount = exports.lengthToObj = exports.toLength = exports.lengthIsZero = exports.lengthZero = exports.lengthDiff = exports.LengthObj = void 0;
    /**
     * Represents a non-negative length in terms of line and column count.
     * Prefer using {@link Length} for performance reasons.
    */
    class LengthObj {
        constructor(lineCount, columnCount) {
            this.lineCount = lineCount;
            this.columnCount = columnCount;
        }
        static lengthDiffNonNegative(start, end) {
            if (end.isLessThan(start)) {
                return LengthObj.zero;
            }
            if (start.lineCount === end.lineCount) {
                return new LengthObj(0, end.columnCount - start.columnCount);
            }
            else {
                return new LengthObj(end.lineCount - start.lineCount, end.columnCount);
            }
        }
        isZero() {
            return this.lineCount === 0 && this.columnCount === 0;
        }
        toLength() {
            return toLength(this.lineCount, this.columnCount);
        }
        isLessThan(other) {
            if (this.lineCount !== other.lineCount) {
                return this.lineCount < other.lineCount;
            }
            return this.columnCount < other.columnCount;
        }
        isGreaterThan(other) {
            if (this.lineCount !== other.lineCount) {
                return this.lineCount > other.lineCount;
            }
            return this.columnCount > other.columnCount;
        }
        equals(other) {
            return this.lineCount === other.lineCount && this.columnCount === other.columnCount;
        }
        compare(other) {
            if (this.lineCount !== other.lineCount) {
                return this.lineCount - other.lineCount;
            }
            return this.columnCount - other.columnCount;
        }
        add(other) {
            if (other.lineCount === 0) {
                return new LengthObj(this.lineCount, this.columnCount + other.columnCount);
            }
            else {
                return new LengthObj(this.lineCount + other.lineCount, other.columnCount);
            }
        }
        toString() {
            return `${this.lineCount},${this.columnCount}`;
        }
    }
    exports.LengthObj = LengthObj;
    LengthObj.zero = new LengthObj(0, 0);
    /**
     * The end must be greater than or equal to the start.
    */
    function lengthDiff(startLineCount, startColumnCount, endLineCount, endColumnCount) {
        return (startLineCount !== endLineCount)
            ? toLength(endLineCount - startLineCount, endColumnCount)
            : toLength(0, endColumnCount - startColumnCount);
    }
    exports.lengthDiff = lengthDiff;
    exports.lengthZero = 0;
    function lengthIsZero(length) {
        return length === 0;
    }
    exports.lengthIsZero = lengthIsZero;
    /*
     * We have 52 bits available in a JS number.
     * We use the upper 26 bits to store the line and the lower 26 bits to store the column.
     *
     * Set boolean to `true` when debugging, so that debugging is easier.
     */
    const factor = /* is debug: */ false ? 100000 : 2 ** 26;
    function toLength(lineCount, columnCount) {
        // llllllllllllllllllllllllllcccccccccccccccccccccccccc (52 bits)
        //       line count (26 bits)    column count (26 bits)
        // If there is no overflow (all values/sums below 2^26 = 67108864),
        // we have `toLength(lns1, cols1) + toLength(lns2, cols2) = toLength(lns1 + lns2, cols1 + cols2)`.
        return (lineCount * factor + columnCount);
    }
    exports.toLength = toLength;
    function lengthToObj(length) {
        const l = length;
        const lineCount = Math.floor(l / factor);
        const columnCount = l - lineCount * factor;
        return new LengthObj(lineCount, columnCount);
    }
    exports.lengthToObj = lengthToObj;
    function lengthGetLineCount(length) {
        return Math.floor(length / factor);
    }
    exports.lengthGetLineCount = lengthGetLineCount;
    /**
     * Returns the amount of columns of the given length, assuming that it does not span any line.
    */
    function lengthGetColumnCountIfZeroLineCount(length) {
        return length;
    }
    exports.lengthGetColumnCountIfZeroLineCount = lengthGetColumnCountIfZeroLineCount;
    function lengthAdd(l1, l2) {
        return ((l2 < factor)
            ? (l1 + l2) // l2 is the amount of columns (zero line count). Keep the column count from l1.
            : (l1 - (l1 % factor) + l2)); // l1 - (l1 % factor) equals toLength(l1.lineCount, 0)
    }
    exports.lengthAdd = lengthAdd;
    /**
     * Returns a non negative length `result` such that `lengthAdd(length1, result) = length2`, or zero if such length does not exist.
     */
    function lengthDiffNonNegative(length1, length2) {
        const l1 = length1;
        const l2 = length2;
        const diff = l2 - l1;
        if (diff <= 0) {
            // line-count of length1 is higher than line-count of length2
            // or they are equal and column-count of length1 is higher than column-count of length2
            return exports.lengthZero;
        }
        const lineCount1 = Math.floor(l1 / factor);
        const lineCount2 = Math.floor(l2 / factor);
        const colCount2 = l2 - lineCount2 * factor;
        if (lineCount1 === lineCount2) {
            const colCount1 = l1 - lineCount1 * factor;
            return toLength(0, colCount2 - colCount1);
        }
        else {
            return toLength(lineCount2 - lineCount1, colCount2);
        }
    }
    exports.lengthDiffNonNegative = lengthDiffNonNegative;
    function lengthLessThan(length1, length2) {
        // First, compare line counts, then column counts.
        return length1 < length2;
    }
    exports.lengthLessThan = lengthLessThan;
    function lengthLessThanEqual(length1, length2) {
        return length1 <= length2;
    }
    exports.lengthLessThanEqual = lengthLessThanEqual;
    function lengthGreaterThanEqual(length1, length2) {
        return length1 >= length2;
    }
    exports.lengthGreaterThanEqual = lengthGreaterThanEqual;
    function lengthToPosition(length) {
        const l = length;
        const lineCount = Math.floor(l / factor);
        const colCount = l - lineCount * factor;
        return new position_1.Position(lineCount + 1, colCount + 1);
    }
    exports.lengthToPosition = lengthToPosition;
    function positionToLength(position) {
        return toLength(position.lineNumber - 1, position.column - 1);
    }
    exports.positionToLength = positionToLength;
    function lengthsToRange(lengthStart, lengthEnd) {
        const l = lengthStart;
        const lineCount = Math.floor(l / factor);
        const colCount = l - lineCount * factor;
        const l2 = lengthEnd;
        const lineCount2 = Math.floor(l2 / factor);
        const colCount2 = l2 - lineCount2 * factor;
        return new range_1.Range(lineCount + 1, colCount + 1, lineCount2 + 1, colCount2 + 1);
    }
    exports.lengthsToRange = lengthsToRange;
    function lengthCompare(length1, length2) {
        const l1 = length1;
        const l2 = length2;
        return l1 - l2;
    }
    exports.lengthCompare = lengthCompare;
    function lengthOfString(str) {
        const lines = (0, strings_1.splitLines)(str);
        return toLength(lines.length - 1, lines[lines.length - 1].length);
    }
    exports.lengthOfString = lengthOfString;
    function lengthOfStringObj(str) {
        const lines = (0, strings_1.splitLines)(str);
        return new LengthObj(lines.length - 1, lines[lines.length - 1].length);
    }
    exports.lengthOfStringObj = lengthOfStringObj;
    /**
     * Computes a numeric hash of the given length.
    */
    function lengthHash(length) {
        return length;
    }
    exports.lengthHash = lengthHash;
});
//# sourceMappingURL=length.js.map