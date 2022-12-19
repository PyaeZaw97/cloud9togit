/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer", "vs/editor/common/core/position", "vs/editor/common/core/eolCounter", "vs/editor/common/tokens/contiguousTokensEditing"], function (require, exports, arrays, buffer_1, position_1, eolCounter_1, contiguousTokensEditing_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContiguousMultilineTokens = void 0;
    /**
     * Represents contiguous tokens over a contiguous range of lines.
     */
    class ContiguousMultilineTokens {
        constructor(startLineNumber, tokens) {
            this._startLineNumber = startLineNumber;
            this._tokens = tokens;
        }
        static deserialize(buff, offset, result) {
            const view32 = new Uint32Array(buff.buffer);
            const startLineNumber = (0, buffer_1.readUInt32BE)(buff, offset);
            offset += 4;
            const count = (0, buffer_1.readUInt32BE)(buff, offset);
            offset += 4;
            const tokens = [];
            for (let i = 0; i < count; i++) {
                const byteCount = (0, buffer_1.readUInt32BE)(buff, offset);
                offset += 4;
                tokens.push(view32.subarray(offset / 4, offset / 4 + byteCount / 4));
                offset += byteCount;
            }
            result.push(new ContiguousMultilineTokens(startLineNumber, tokens));
            return offset;
        }
        /**
         * (Inclusive) start line number for these tokens.
         */
        get startLineNumber() {
            return this._startLineNumber;
        }
        /**
         * (Inclusive) end line number for these tokens.
         */
        get endLineNumber() {
            return this._startLineNumber + this._tokens.length - 1;
        }
        /**
         * @see {@link _tokens}
         */
        getLineTokens(lineNumber) {
            return this._tokens[lineNumber - this._startLineNumber];
        }
        appendLineTokens(lineTokens) {
            this._tokens.push(lineTokens);
        }
        serializeSize() {
            let result = 0;
            result += 4; // 4 bytes for the start line number
            result += 4; // 4 bytes for the line count
            for (let i = 0; i < this._tokens.length; i++) {
                const lineTokens = this._tokens[i];
                if (!(lineTokens instanceof Uint32Array)) {
                    throw new Error(`Not supported!`);
                }
                result += 4; // 4 bytes for the byte count
                result += lineTokens.byteLength;
            }
            return result;
        }
        serialize(destination, offset) {
            (0, buffer_1.writeUInt32BE)(destination, this._startLineNumber, offset);
            offset += 4;
            (0, buffer_1.writeUInt32BE)(destination, this._tokens.length, offset);
            offset += 4;
            for (let i = 0; i < this._tokens.length; i++) {
                const lineTokens = this._tokens[i];
                if (!(lineTokens instanceof Uint32Array)) {
                    throw new Error(`Not supported!`);
                }
                (0, buffer_1.writeUInt32BE)(destination, lineTokens.byteLength, offset);
                offset += 4;
                destination.set(new Uint8Array(lineTokens.buffer), offset);
                offset += lineTokens.byteLength;
            }
            return offset;
        }
        applyEdit(range, text) {
            const [eolCount, firstLineLength] = (0, eolCounter_1.countEOL)(text);
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength);
        }
        _acceptDeleteRange(range) {
            if (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn) {
                // Nothing to delete
                return;
            }
            const firstLineIndex = range.startLineNumber - this._startLineNumber;
            const lastLineIndex = range.endLineNumber - this._startLineNumber;
            if (lastLineIndex < 0) {
                // this deletion occurs entirely before this block, so we only need to adjust line numbers
                const deletedLinesCount = lastLineIndex - firstLineIndex;
                this._startLineNumber -= deletedLinesCount;
                return;
            }
            if (firstLineIndex >= this._tokens.length) {
                // this deletion occurs entirely after this block, so there is nothing to do
                return;
            }
            if (firstLineIndex < 0 && lastLineIndex >= this._tokens.length) {
                // this deletion completely encompasses this block
                this._startLineNumber = 0;
                this._tokens = [];
                return;
            }
            if (firstLineIndex === lastLineIndex) {
                // a delete on a single line
                this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.delete(this._tokens[firstLineIndex], range.startColumn - 1, range.endColumn - 1);
                return;
            }
            if (firstLineIndex >= 0) {
                // The first line survives
                this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteEnding(this._tokens[firstLineIndex], range.startColumn - 1);
                if (lastLineIndex < this._tokens.length) {
                    // The last line survives
                    const lastLineTokens = contiguousTokensEditing_1.ContiguousTokensEditing.deleteBeginning(this._tokens[lastLineIndex], range.endColumn - 1);
                    // Take remaining text on last line and append it to remaining text on first line
                    this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.append(this._tokens[firstLineIndex], lastLineTokens);
                    // Delete middle lines
                    this._tokens.splice(firstLineIndex + 1, lastLineIndex - firstLineIndex);
                }
                else {
                    // The last line does not survive
                    // Take remaining text on last line and append it to remaining text on first line
                    this._tokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.append(this._tokens[firstLineIndex], null);
                    // Delete lines
                    this._tokens = this._tokens.slice(0, firstLineIndex + 1);
                }
            }
            else {
                // The first line does not survive
                const deletedBefore = -firstLineIndex;
                this._startLineNumber -= deletedBefore;
                // Remove beginning from last line
                this._tokens[lastLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteBeginning(this._tokens[lastLineIndex], range.endColumn - 1);
                // Delete lines
                this._tokens = this._tokens.slice(lastLineIndex);
            }
        }
        _acceptInsertText(position, eolCount, firstLineLength) {
            if (eolCount === 0 && firstLineLength === 0) {
                // Nothing to insert
                return;
            }
            const lineIndex = position.lineNumber - this._startLineNumber;
            if (lineIndex < 0) {
                // this insertion occurs before this block, so we only need to adjust line numbers
                this._startLineNumber += eolCount;
                return;
            }
            if (lineIndex >= this._tokens.length) {
                // this insertion occurs after this block, so there is nothing to do
                return;
            }
            if (eolCount === 0) {
                // Inserting text on one line
                this._tokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.insert(this._tokens[lineIndex], position.column - 1, firstLineLength);
                return;
            }
            this._tokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteEnding(this._tokens[lineIndex], position.column - 1);
            this._tokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.insert(this._tokens[lineIndex], position.column - 1, firstLineLength);
            this._insertLines(position.lineNumber, eolCount);
        }
        _insertLines(insertIndex, insertCount) {
            if (insertCount === 0) {
                return;
            }
            const lineTokens = [];
            for (let i = 0; i < insertCount; i++) {
                lineTokens[i] = null;
            }
            this._tokens = arrays.arrayInsert(this._tokens, insertIndex, lineTokens);
        }
    }
    exports.ContiguousMultilineTokens = ContiguousMultilineTokens;
});
//# sourceMappingURL=contiguousMultilineTokens.js.map