/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, strings, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PagedScreenReaderStrategy = exports.TextAreaState = exports._debugComposition = void 0;
    exports._debugComposition = false;
    class TextAreaState {
        constructor(value, selectionStart, selectionEnd, selectionStartPosition, selectionEndPosition) {
            this.value = value;
            this.selectionStart = selectionStart;
            this.selectionEnd = selectionEnd;
            this.selectionStartPosition = selectionStartPosition;
            this.selectionEndPosition = selectionEndPosition;
        }
        toString() {
            return `[ <${this.value}>, selectionStart: ${this.selectionStart}, selectionEnd: ${this.selectionEnd}]`;
        }
        static readFromTextArea(textArea) {
            return new TextAreaState(textArea.getValue(), textArea.getSelectionStart(), textArea.getSelectionEnd(), null, null);
        }
        collapseSelection() {
            return new TextAreaState(this.value, this.value.length, this.value.length, null, null);
        }
        writeToTextArea(reason, textArea, select) {
            if (exports._debugComposition) {
                console.log(`writeToTextArea ${reason}: ${this.toString()}`);
            }
            textArea.setValue(reason, this.value);
            if (select) {
                textArea.setSelectionRange(reason, this.selectionStart, this.selectionEnd);
            }
        }
        deduceEditorPosition(offset) {
            if (offset <= this.selectionStart) {
                const str = this.value.substring(offset, this.selectionStart);
                return this._finishDeduceEditorPosition(this.selectionStartPosition, str, -1);
            }
            if (offset >= this.selectionEnd) {
                const str = this.value.substring(this.selectionEnd, offset);
                return this._finishDeduceEditorPosition(this.selectionEndPosition, str, 1);
            }
            const str1 = this.value.substring(this.selectionStart, offset);
            if (str1.indexOf(String.fromCharCode(8230)) === -1) {
                return this._finishDeduceEditorPosition(this.selectionStartPosition, str1, 1);
            }
            const str2 = this.value.substring(offset, this.selectionEnd);
            return this._finishDeduceEditorPosition(this.selectionEndPosition, str2, -1);
        }
        _finishDeduceEditorPosition(anchor, deltaText, signum) {
            let lineFeedCnt = 0;
            let lastLineFeedIndex = -1;
            while ((lastLineFeedIndex = deltaText.indexOf('\n', lastLineFeedIndex + 1)) !== -1) {
                lineFeedCnt++;
            }
            return [anchor, signum * deltaText.length, lineFeedCnt];
        }
        static deduceInput(previousState, currentState, couldBeEmojiInput) {
            if (!previousState) {
                // This is the EMPTY state
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            if (exports._debugComposition) {
                console.log('------------------------deduceInput');
                console.log(`PREVIOUS STATE: ${previousState.toString()}`);
                console.log(`CURRENT STATE: ${currentState.toString()}`);
            }
            const prefixLength = Math.min(strings.commonPrefixLength(previousState.value, currentState.value), previousState.selectionStart, currentState.selectionStart);
            const suffixLength = Math.min(strings.commonSuffixLength(previousState.value, currentState.value), previousState.value.length - previousState.selectionEnd, currentState.value.length - currentState.selectionEnd);
            const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
            const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
            const previousSelectionStart = previousState.selectionStart - prefixLength;
            const previousSelectionEnd = previousState.selectionEnd - prefixLength;
            const currentSelectionStart = currentState.selectionStart - prefixLength;
            const currentSelectionEnd = currentState.selectionEnd - prefixLength;
            if (exports._debugComposition) {
                console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
                console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
            }
            if (currentSelectionStart === currentSelectionEnd) {
                // no current selection
                const replacePreviousCharacters = (previousState.selectionStart - prefixLength);
                if (exports._debugComposition) {
                    console.log(`REMOVE PREVIOUS: ${replacePreviousCharacters} chars`);
                }
                return {
                    text: currentValue,
                    replacePrevCharCnt: replacePreviousCharacters,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            // there is a current selection => composition case
            const replacePreviousCharacters = previousSelectionEnd - previousSelectionStart;
            return {
                text: currentValue,
                replacePrevCharCnt: replacePreviousCharacters,
                replaceNextCharCnt: 0,
                positionDelta: 0
            };
        }
        static deduceAndroidCompositionInput(previousState, currentState) {
            if (!previousState) {
                // This is the EMPTY state
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            if (exports._debugComposition) {
                console.log('------------------------deduceAndroidCompositionInput');
                console.log(`PREVIOUS STATE: ${previousState.toString()}`);
                console.log(`CURRENT STATE: ${currentState.toString()}`);
            }
            if (previousState.value === currentState.value) {
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: currentState.selectionEnd - previousState.selectionEnd
                };
            }
            const prefixLength = Math.min(strings.commonPrefixLength(previousState.value, currentState.value), previousState.selectionEnd);
            const suffixLength = Math.min(strings.commonSuffixLength(previousState.value, currentState.value), previousState.value.length - previousState.selectionEnd);
            const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
            const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
            const previousSelectionStart = previousState.selectionStart - prefixLength;
            const previousSelectionEnd = previousState.selectionEnd - prefixLength;
            const currentSelectionStart = currentState.selectionStart - prefixLength;
            const currentSelectionEnd = currentState.selectionEnd - prefixLength;
            if (exports._debugComposition) {
                console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
                console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
            }
            return {
                text: currentValue,
                replacePrevCharCnt: previousSelectionEnd,
                replaceNextCharCnt: previousValue.length - previousSelectionEnd,
                positionDelta: currentSelectionEnd - currentValue.length
            };
        }
    }
    exports.TextAreaState = TextAreaState;
    TextAreaState.EMPTY = new TextAreaState('', 0, 0, null, null);
    class PagedScreenReaderStrategy {
        static _getPageOfLine(lineNumber, linesPerPage) {
            return Math.floor((lineNumber - 1) / linesPerPage);
        }
        static _getRangeForPage(page, linesPerPage) {
            const offset = page * linesPerPage;
            const startLineNumber = offset + 1;
            const endLineNumber = offset + linesPerPage;
            return new range_1.Range(startLineNumber, 1, endLineNumber + 1, 1);
        }
        static fromEditorSelection(previousState, model, selection, linesPerPage, trimLongText) {
            const selectionStartPage = PagedScreenReaderStrategy._getPageOfLine(selection.startLineNumber, linesPerPage);
            const selectionStartPageRange = PagedScreenReaderStrategy._getRangeForPage(selectionStartPage, linesPerPage);
            const selectionEndPage = PagedScreenReaderStrategy._getPageOfLine(selection.endLineNumber, linesPerPage);
            const selectionEndPageRange = PagedScreenReaderStrategy._getRangeForPage(selectionEndPage, linesPerPage);
            const pretextRange = selectionStartPageRange.intersectRanges(new range_1.Range(1, 1, selection.startLineNumber, selection.startColumn));
            let pretext = model.getValueInRange(pretextRange, 1 /* EndOfLinePreference.LF */);
            const lastLine = model.getLineCount();
            const lastLineMaxColumn = model.getLineMaxColumn(lastLine);
            const posttextRange = selectionEndPageRange.intersectRanges(new range_1.Range(selection.endLineNumber, selection.endColumn, lastLine, lastLineMaxColumn));
            let posttext = model.getValueInRange(posttextRange, 1 /* EndOfLinePreference.LF */);
            let text;
            if (selectionStartPage === selectionEndPage || selectionStartPage + 1 === selectionEndPage) {
                // take full selection
                text = model.getValueInRange(selection, 1 /* EndOfLinePreference.LF */);
            }
            else {
                const selectionRange1 = selectionStartPageRange.intersectRanges(selection);
                const selectionRange2 = selectionEndPageRange.intersectRanges(selection);
                text = (model.getValueInRange(selectionRange1, 1 /* EndOfLinePreference.LF */)
                    + String.fromCharCode(8230)
                    + model.getValueInRange(selectionRange2, 1 /* EndOfLinePreference.LF */));
            }
            // Chromium handles very poorly text even of a few thousand chars
            // Cut text to avoid stalling the entire UI
            if (trimLongText) {
                const LIMIT_CHARS = 500;
                if (pretext.length > LIMIT_CHARS) {
                    pretext = pretext.substring(pretext.length - LIMIT_CHARS, pretext.length);
                }
                if (posttext.length > LIMIT_CHARS) {
                    posttext = posttext.substring(0, LIMIT_CHARS);
                }
                if (text.length > 2 * LIMIT_CHARS) {
                    text = text.substring(0, LIMIT_CHARS) + String.fromCharCode(8230) + text.substring(text.length - LIMIT_CHARS, text.length);
                }
            }
            return new TextAreaState(pretext + text + posttext, pretext.length, pretext.length + text.length, new position_1.Position(selection.startLineNumber, selection.startColumn), new position_1.Position(selection.endLineNumber, selection.endColumn));
        }
    }
    exports.PagedScreenReaderStrategy = PagedScreenReaderStrategy;
});
//# sourceMappingURL=textAreaState.js.map