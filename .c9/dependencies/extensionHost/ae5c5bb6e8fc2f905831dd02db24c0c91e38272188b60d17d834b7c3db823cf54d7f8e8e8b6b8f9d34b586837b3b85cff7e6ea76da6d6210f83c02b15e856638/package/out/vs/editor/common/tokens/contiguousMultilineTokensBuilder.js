/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/editor/common/tokens/contiguousMultilineTokens"], function (require, exports, buffer_1, contiguousMultilineTokens_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContiguousMultilineTokensBuilder = void 0;
    class ContiguousMultilineTokensBuilder {
        constructor() {
            this._tokens = [];
        }
        static deserialize(buff) {
            let offset = 0;
            const count = (0, buffer_1.readUInt32BE)(buff, offset);
            offset += 4;
            const result = [];
            for (let i = 0; i < count; i++) {
                offset = contiguousMultilineTokens_1.ContiguousMultilineTokens.deserialize(buff, offset, result);
            }
            return result;
        }
        add(lineNumber, lineTokens) {
            if (this._tokens.length > 0) {
                const last = this._tokens[this._tokens.length - 1];
                if (last.endLineNumber + 1 === lineNumber) {
                    // append
                    last.appendLineTokens(lineTokens);
                    return;
                }
            }
            this._tokens.push(new contiguousMultilineTokens_1.ContiguousMultilineTokens(lineNumber, [lineTokens]));
        }
        finalize() {
            return this._tokens;
        }
        serialize() {
            const size = this._serializeSize();
            const result = new Uint8Array(size);
            this._serialize(result);
            return result;
        }
        _serializeSize() {
            let result = 0;
            result += 4; // 4 bytes for the count
            for (let i = 0; i < this._tokens.length; i++) {
                result += this._tokens[i].serializeSize();
            }
            return result;
        }
        _serialize(destination) {
            let offset = 0;
            (0, buffer_1.writeUInt32BE)(destination, this._tokens.length, offset);
            offset += 4;
            for (let i = 0; i < this._tokens.length; i++) {
                offset = this._tokens[i].serialize(destination, offset);
            }
        }
    }
    exports.ContiguousMultilineTokensBuilder = ContiguousMultilineTokensBuilder;
});
//# sourceMappingURL=contiguousMultilineTokensBuilder.js.map