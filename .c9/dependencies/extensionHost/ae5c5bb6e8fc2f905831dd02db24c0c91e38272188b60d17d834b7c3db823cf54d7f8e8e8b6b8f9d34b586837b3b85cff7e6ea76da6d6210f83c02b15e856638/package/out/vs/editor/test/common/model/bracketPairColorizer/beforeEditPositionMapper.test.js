/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length"], function (require, exports, assert, strings_1, range_1, beforeEditPositionMapper_1, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEdit = void 0;
    suite('Bracket Pair Colorizer - BeforeEditPositionMapper', () => {
        test('Single-Line 1', () => {
            assert.deepStrictEqual(compute([
                '0123456789',
            ], [
                new TextEdit((0, length_1.toLength)(0, 4), (0, length_1.toLength)(0, 7), 'xy')
            ]), [
                '0  1  2  3  x  y  7  8  9  ',
                '0  0  0  0  0  0  0  0  0  0  ',
                '0  1  2  3  4  5  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  ',
                '4  3  2  1  0  0  3  2  1  0  ', // column count until next change
            ]);
        });
        test('Single-Line 2', () => {
            assert.deepStrictEqual(compute([
                '0123456789',
            ], [
                new TextEdit((0, length_1.toLength)(0, 2), (0, length_1.toLength)(0, 4), 'xxxx'),
                new TextEdit((0, length_1.toLength)(0, 6), (0, length_1.toLength)(0, 6), 'yy')
            ]), [
                '0  1  x  x  x  x  4  5  y  y  6  7  8  9  ',
                '0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  ',
                '0  1  2  3  4  5  4  5  6  7  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  ',
                '2  1  0  0  0  0  2  1  0  0  4  3  2  1  0  ',
            ]);
        });
        test('Multi-Line Replace 1', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '0123456789',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 3), 'xy'),
            ]), [
                '₀  ₁  ₂  x  y  3  4  5  6  7  8  9  ',
                '0  0  0  0  0  1  1  1  1  1  1  1  1  ',
                '0  1  2  3  4  3  4  5  6  7  8  9  10 ',
                '0  0  0  0  0  1  1  1  1  1  1  1  1  ',
                '3  2  1  0  0  10 10 10 10 10 10 10 10 ',
                // ------------------
                '⁰  ¹  ²  ³  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  5  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  0  ',
                '10 9  8  7  6  5  4  3  2  1  0  ',
            ]);
        });
        test('Multi-Line Replace 2', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 0), 'ab'),
                new TextEdit((0, length_1.toLength)(1, 5), (0, length_1.toLength)(1, 7), 'c'),
            ]), [
                '₀  ₁  ₂  a  b  0  1  2  3  4  c  7  8  ',
                '0  0  0  0  0  1  1  1  1  1  1  1  1  1  ',
                '0  1  2  3  4  0  1  2  3  4  5  7  8  9  ',
                '0  0  0  0  0  0  0  0  0  0  0  1  1  1  ',
                '3  2  1  0  0  5  4  3  2  1  0  10 10 10 ',
                // ------------------
                '⁰  ¹  ²  ³  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  5  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  0  ',
                '10 9  8  7  6  5  4  3  2  1  0  ',
            ]);
        });
        test('Multi-Line Replace 3', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 0), 'ab'),
                new TextEdit((0, length_1.toLength)(1, 5), (0, length_1.toLength)(1, 7), 'c'),
                new TextEdit((0, length_1.toLength)(1, 8), (0, length_1.toLength)(2, 4), 'd'),
            ]), [
                '₀  ₁  ₂  a  b  0  1  2  3  4  c  7  d  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '0  0  0  0  0  1  1  1  1  1  1  1  1  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  0  1  2  3  4  5  7  8  4  5  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  ',
                '3  2  1  0  0  5  4  3  2  1  0  1  0  6  5  4  3  2  1  0  ',
            ]);
        });
        test('Multi-Line Insert 1', () => {
            assert.deepStrictEqual(compute([
                '012345678',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(0, 5), 'a\nb'),
            ]), [
                '0  1  2  a  ',
                '0  0  0  0  0  ',
                '0  1  2  3  4  ',
                '0  0  0  0  0  ',
                '3  2  1  0  0  ',
                // ------------------
                'b  5  6  7  8  ',
                '1  0  0  0  0  0  ',
                '0  5  6  7  8  9  ',
                '0  0  0  0  0  0  ',
                '0  4  3  2  1  0  ',
            ]);
        });
        test('Multi-Line Insert 2', () => {
            assert.deepStrictEqual(compute([
                '012345678',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(0, 5), 'a\nb'),
                new TextEdit((0, length_1.toLength)(0, 7), (0, length_1.toLength)(0, 8), 'x\ny'),
            ]), [
                '0  1  2  a  ',
                '0  0  0  0  0  ',
                '0  1  2  3  4  ',
                '0  0  0  0  0  ',
                '3  2  1  0  0  ',
                // ------------------
                'b  5  6  x  ',
                '1  0  0  0  0  ',
                '0  5  6  7  8  ',
                '0  0  0  0  0  ',
                '0  2  1  0  0  ',
                // ------------------
                'y  8  ',
                '1  0  0  ',
                '0  8  9  ',
                '0  0  0  ',
                '0  1  0  ',
            ]);
        });
        test('Multi-Line Replace/Insert 1', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 1), 'aaa\nbbb'),
            ]), [
                '₀  ₁  ₂  a  a  a  ',
                '0  0  0  0  0  0  0  ',
                '0  1  2  3  4  5  6  ',
                '0  0  0  0  0  0  0  ',
                '3  2  1  0  0  0  0  ',
                // ------------------
                'b  b  b  1  2  3  4  5  6  7  8  ',
                '1  1  1  1  1  1  1  1  1  1  1  1  ',
                '0  1  2  1  2  3  4  5  6  7  8  9  ',
                '0  0  0  1  1  1  1  1  1  1  1  1  ',
                '0  0  0  10 10 10 10 10 10 10 10 10 ',
                // ------------------
                '⁰  ¹  ²  ³  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  5  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  0  ',
                '10 9  8  7  6  5  4  3  2  1  0  ',
            ]);
        });
        test('Multi-Line Replace/Insert 2', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 1), 'aaa\nbbb'),
                new TextEdit((0, length_1.toLength)(1, 5), (0, length_1.toLength)(1, 5), 'x\ny'),
                new TextEdit((0, length_1.toLength)(1, 7), (0, length_1.toLength)(2, 4), 'k\nl'),
            ]), [
                '₀  ₁  ₂  a  a  a  ',
                '0  0  0  0  0  0  0  ',
                '0  1  2  3  4  5  6  ',
                '0  0  0  0  0  0  0  ',
                '3  2  1  0  0  0  0  ',
                // ------------------
                'b  b  b  1  2  3  4  x  ',
                '1  1  1  1  1  1  1  1  1  ',
                '0  1  2  1  2  3  4  5  6  ',
                '0  0  0  0  0  0  0  0  0  ',
                '0  0  0  4  3  2  1  0  0  ',
                // ------------------
                'y  5  6  k  ',
                '2  1  1  1  1  ',
                '0  5  6  7  8  ',
                '0  0  0  0  0  ',
                '0  2  1  0  0  ',
                // ------------------
                'l  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  ',
                '0  4  5  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  ',
                '0  6  5  4  3  2  1  0  ',
            ]);
        });
    });
    /** @pure */
    function compute(inputArr, edits) {
        const newLines = (0, strings_1.splitLines)(applyLineColumnEdits(inputArr.join('\n'), edits.map(e => ({
            text: e.newText,
            range: range_1.Range.fromPositions((0, length_1.lengthToPosition)(e.startOffset), (0, length_1.lengthToPosition)(e.endOffset))
        }))));
        const mapper = new beforeEditPositionMapper_1.BeforeEditPositionMapper(edits, (0, length_1.lengthOfString)(newLines.join('\n')));
        const result = new Array();
        let lineIdx = 0;
        for (const line of newLines) {
            let lineLine = '';
            let colLine = '';
            let lineStr = '';
            let colDist = '';
            let lineDist = '';
            for (let colIdx = 0; colIdx <= line.length; colIdx++) {
                const before = mapper.getOffsetBeforeChange((0, length_1.toLength)(lineIdx, colIdx));
                const beforeObj = (0, length_1.lengthToObj)(before);
                if (colIdx < line.length) {
                    lineStr += rightPad(line[colIdx], 3);
                }
                lineLine += rightPad('' + beforeObj.lineCount, 3);
                colLine += rightPad('' + beforeObj.columnCount, 3);
                const dist = (0, length_1.lengthToObj)(mapper.getDistanceToNextChange((0, length_1.toLength)(lineIdx, colIdx)));
                lineDist += rightPad('' + dist.lineCount, 3);
                colDist += rightPad('' + dist.columnCount, 3);
            }
            result.push(lineStr);
            result.push(lineLine);
            result.push(colLine);
            result.push(lineDist);
            result.push(colDist);
            lineIdx++;
        }
        return result;
    }
    class TextEdit extends beforeEditPositionMapper_1.TextEditInfo {
        constructor(startOffset, endOffset, newText) {
            super(startOffset, endOffset, (0, length_1.lengthOfString)(newText));
            this.newText = newText;
        }
    }
    exports.TextEdit = TextEdit;
    class PositionOffsetTransformer {
        constructor(text) {
            this.lineStartOffsetByLineIdx = [];
            this.lineStartOffsetByLineIdx.push(0);
            for (let i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\n') {
                    this.lineStartOffsetByLineIdx.push(i + 1);
                }
            }
        }
        getOffset(position) {
            return this.lineStartOffsetByLineIdx[position.lineNumber - 1] + position.column - 1;
        }
    }
    function applyLineColumnEdits(text, edits) {
        const transformer = new PositionOffsetTransformer(text);
        const offsetEdits = edits.map(e => {
            const range = range_1.Range.lift(e.range);
            return ({
                startOffset: transformer.getOffset(range.getStartPosition()),
                endOffset: transformer.getOffset(range.getEndPosition()),
                text: e.text
            });
        });
        offsetEdits.sort((a, b) => b.startOffset - a.startOffset);
        for (const edit of offsetEdits) {
            text = text.substring(0, edit.startOffset) + edit.text + text.substring(edit.endOffset);
        }
        return text;
    }
    function rightPad(str, len) {
        while (str.length < len) {
            str += ' ';
        }
        return str;
    }
});
//# sourceMappingURL=beforeEditPositionMapper.test.js.map