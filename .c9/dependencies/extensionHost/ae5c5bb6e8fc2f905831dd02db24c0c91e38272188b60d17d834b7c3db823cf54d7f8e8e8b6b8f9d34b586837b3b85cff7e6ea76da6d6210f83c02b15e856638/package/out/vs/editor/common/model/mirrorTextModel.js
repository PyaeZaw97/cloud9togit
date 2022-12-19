/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/model/prefixSumComputer"], function (require, exports, strings_1, position_1, prefixSumComputer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MirrorTextModel = void 0;
    class MirrorTextModel {
        constructor(uri, lines, eol, versionId, _mainThreadProxy, _logger) {
            this._mainThreadProxy = _mainThreadProxy;
            this._logger = _logger;
            this._uri = uri;
            this._lines = lines;
            this._eol = eol;
            this._versionId = versionId;
            this._lineStarts = null;
            this._cachedTextValue = null;
        }
        dispose() {
            this._lines.length = 0;
        }
        get version() {
            return this._versionId;
        }
        getText() {
            if (this._cachedTextValue === null) {
                this._cachedTextValue = this._lines.join(this._eol);
            }
            return this._cachedTextValue;
        }
        onEvents(e) {
            if (e.eol && e.eol !== this._eol) {
                this._eol = e.eol;
                this._lineStarts = null;
            }
            // Update my lines
            const changes = e.changes;
            for (const change of changes) {
                this._acceptDeleteRange(change.range);
                this._acceptInsertText(new position_1.Position(change.range.startLineNumber, change.range.startColumn), change.text);
            }
            this._versionId = e.versionId;
            this._cachedTextValue = null;
        }
        _ensureLineStarts() {
            if (!this._lineStarts) {
                const eolLength = this._eol.length;
                const linesLength = this._lines.length;
                const lineStartValues = new Uint32Array(linesLength);
                for (let i = 0; i < linesLength; i++) {
                    lineStartValues[i] = this._lines[i].length + eolLength;
                }
                this._lineStarts = new prefixSumComputer_1.PrefixSumComputer(lineStartValues);
            }
        }
        /**
         * All changes to a line's text go through this method
         */
        _setLineText(lineIndex, newValue) {
            this._lines[lineIndex] = newValue;
            if (this._lineStarts) {
                // update prefix sum
                this._lineStarts.setValue(lineIndex, this._lines[lineIndex].length + this._eol.length);
            }
        }
        _acceptDeleteRange(range) {
            if (range.startLineNumber === range.endLineNumber) {
                if (range.startColumn === range.endColumn) {
                    // Nothing to delete
                    return;
                }
                if (this.reportErrorIfNoLinesInRange(range))
                    return;
                // Delete text on the affected line
                this._setLineText(range.startLineNumber - 1, this._lines[range.startLineNumber - 1].substring(0, range.startColumn - 1) +
                    this._lines[range.startLineNumber - 1].substring(range.endColumn - 1));
                return;
            }
            if (this.reportErrorIfNoLinesInRange(range))
                return;
            // Take remaining text on last line and append it to remaining text on first line
            this._setLineText(range.startLineNumber - 1, this._lines[range.startLineNumber - 1].substring(0, range.startColumn - 1) +
                this._lines[range.endLineNumber - 1].substring(range.endColumn - 1));
            // Delete middle lines
            this._lines.splice(range.startLineNumber, range.endLineNumber - range.startLineNumber);
            if (this._lineStarts) {
                // update prefix sum
                this._lineStarts.removeValues(range.startLineNumber, range.endLineNumber - range.startLineNumber);
            }
        }
        _acceptInsertText(position, insertText) {
            if (insertText.length === 0) {
                // Nothing to insert
                return;
            }
            const insertLines = (0, strings_1.splitLines)(insertText);
            if (insertLines.length === 1) {
                if (this.reportErrorIfNoLinesInPosition(position))
                    return;
                // Inserting text on one line
                this._setLineText(position.lineNumber - 1, this._lines[position.lineNumber - 1].substring(0, position.column - 1) +
                    insertLines[0] +
                    this._lines[position.lineNumber - 1].substring(position.column - 1));
                return;
            }
            if (this.reportErrorIfNoLinesInPosition(position))
                return;
            // Append overflowing text from first line to the end of text to insert
            insertLines[insertLines.length - 1] += this._lines[position.lineNumber - 1].substring(position.column - 1);
            // Delete overflowing text from first line and insert text on first line
            this._setLineText(position.lineNumber - 1, this._lines[position.lineNumber - 1].substring(0, position.column - 1) + insertLines[0]);
            // Insert new lines & store lengths
            const newLengths = new Uint32Array(insertLines.length - 1);
            for (let i = 1; i < insertLines.length; i++) {
                this._lines.splice(position.lineNumber + i - 1, 0, insertLines[i]);
                newLengths[i - 1] = insertLines[i].length + this._eol.length;
            }
            if (this._lineStarts) {
                // update prefix sum
                this._lineStarts.insertValues(position.lineNumber, newLengths);
            }
        }
        reportErrorIfNoLinesInPosition(position) {
            var _a, _b, _c;
            const possibleLine = this._lines[position.lineNumber - 1];
            if (possibleLine === undefined) {
                (_a = this._logger) === null || _a === void 0 ? void 0 : _a.warn('Model change position is out of bound');
                (_b = this._logger) === null || _b === void 0 ? void 0 : _b.warn(`Lines count: ${this._lines.length}, attempted position: ${position.lineNumber}`);
                (_c = this._mainThreadProxy) === null || _c === void 0 ? void 0 : _c.$onDocumentSyncError(this._uri);
                return true;
            }
            return false;
        }
        reportErrorIfNoLinesInRange(range) {
            var _a, _b, _c;
            const startLine = this._lines[range.startLineNumber - 1];
            const endLine = this._lines[range.endLineNumber - 1];
            if (startLine === undefined || endLine === undefined) {
                (_a = this._logger) === null || _a === void 0 ? void 0 : _a.warn('Model change range is out of bound');
                (_b = this._logger) === null || _b === void 0 ? void 0 : _b.warn(`Lines count: ${this._lines.length}, attempted range: (${range.startLineNumber}:${range.startColumn}, ${range.endLineNumber}:${range.endColumn})`);
                (_c = this._mainThreadProxy) === null || _c === void 0 ? void 0 : _c.$onDocumentSyncError(this._uri);
                return true;
            }
            return false;
        }
    }
    exports.MirrorTextModel = MirrorTextModel;
});
//# sourceMappingURL=mirrorTextModel.js.map