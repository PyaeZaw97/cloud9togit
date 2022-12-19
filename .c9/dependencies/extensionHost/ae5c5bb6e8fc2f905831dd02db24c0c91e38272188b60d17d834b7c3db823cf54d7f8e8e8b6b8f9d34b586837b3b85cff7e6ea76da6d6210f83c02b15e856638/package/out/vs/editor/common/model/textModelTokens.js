/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/tokens/lineTokens", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/editor/common/core/eolCounter", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/base/common/async", "vs/base/common/platform"], function (require, exports, arrays, errors_1, lineTokens_1, languages_1, nullTokenize_1, lifecycle_1, stopwatch_1, eolCounter_1, contiguousMultilineTokensBuilder_1, async_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelTokenization = exports.TokenizationStateStore = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["CHEAP_TOKENIZATION_LENGTH_LIMIT"] = 2048] = "CHEAP_TOKENIZATION_LENGTH_LIMIT";
    })(Constants || (Constants = {}));
    /**
     * An array that avoids being sparse by always
     * filling up unused indices with a default value.
     */
    class ContiguousGrowingArray {
        constructor(_default) {
            this._default = _default;
            this._store = [];
        }
        get(index) {
            if (index < this._store.length) {
                return this._store[index];
            }
            return this._default;
        }
        set(index, value) {
            while (index >= this._store.length) {
                this._store[this._store.length] = this._default;
            }
            this._store[index] = value;
        }
        delete(deleteIndex, deleteCount) {
            if (deleteCount === 0 || deleteIndex >= this._store.length) {
                return;
            }
            this._store.splice(deleteIndex, deleteCount);
        }
        insert(insertIndex, insertCount) {
            if (insertCount === 0 || insertIndex >= this._store.length) {
                return;
            }
            const arr = [];
            for (let i = 0; i < insertCount; i++) {
                arr[i] = this._default;
            }
            this._store = arrays.arrayInsert(this._store, insertIndex, arr);
        }
    }
    /**
     * Stores the states at the start of each line and keeps track of which lines
     * must be retokenized. Also uses state equality to quickly validate lines
     * that don't need to be retokenized.
     *
     * For example, when typing on a line, the line gets marked as needing to be tokenized.
     * Once the line is tokenized, the end state is checked for equality against the begin
     * state of the next line. If the states are equal, tokenization doesn't need to run
     * again over the rest of the file. If the states are not equal, the next line gets marked
     * as needing to be tokenized.
     */
    class TokenizationStateStore {
        constructor(tokenizationSupport, initialState) {
            this.tokenizationSupport = tokenizationSupport;
            this.initialState = initialState;
            /**
             * `lineBeginState[i]` contains the begin state used to tokenize line number `i + 1`.
             */
            this._lineBeginState = new ContiguousGrowingArray(null);
            /**
             * `lineNeedsTokenization[i]` describes if line number `i + 1` needs to be tokenized.
             */
            this._lineNeedsTokenization = new ContiguousGrowingArray(true);
            this._firstLineNeedsTokenization = 0;
            this._lineBeginState.set(0, this.initialState);
        }
        get invalidLineStartIndex() {
            return this._firstLineNeedsTokenization;
        }
        markMustBeTokenized(lineIndex) {
            this._lineNeedsTokenization.set(lineIndex, true);
            this._firstLineNeedsTokenization = Math.min(this._firstLineNeedsTokenization, lineIndex);
        }
        getBeginState(lineIndex) {
            return this._lineBeginState.get(lineIndex);
        }
        setEndState(linesLength, lineIndex, endState) {
            this._lineNeedsTokenization.set(lineIndex, false);
            this._firstLineNeedsTokenization = lineIndex + 1;
            // Check if this was the last line
            if (lineIndex === linesLength - 1) {
                return;
            }
            // Check if the end state has changed
            const previousEndState = this._lineBeginState.get(lineIndex + 1);
            if (previousEndState === null || !endState.equals(previousEndState)) {
                this._lineBeginState.set(lineIndex + 1, endState);
                this.markMustBeTokenized(lineIndex + 1);
                return;
            }
            // Perhaps we can skip tokenizing some lines...
            let i = lineIndex + 1;
            while (i < linesLength) {
                if (this._lineNeedsTokenization.get(i)) {
                    break;
                }
                i++;
            }
            this._firstLineNeedsTokenization = i;
        }
        //#region Editing
        applyEdits(range, eolCount) {
            this.markMustBeTokenized(range.startLineNumber - 1);
            this._lineBeginState.delete(range.startLineNumber, range.endLineNumber - range.startLineNumber);
            this._lineNeedsTokenization.delete(range.startLineNumber, range.endLineNumber - range.startLineNumber);
            this._lineBeginState.insert(range.startLineNumber, eolCount);
            this._lineNeedsTokenization.insert(range.startLineNumber, eolCount);
        }
    }
    exports.TokenizationStateStore = TokenizationStateStore;
    class TextModelTokenization extends lifecycle_1.Disposable {
        constructor(_textModel, _tokenizationPart, _languageIdCodec) {
            super();
            this._textModel = _textModel;
            this._tokenizationPart = _tokenizationPart;
            this._languageIdCodec = _languageIdCodec;
            this._isScheduled = false;
            this._isDisposed = false;
            this._tokenizationStateStore = null;
            this._register(languages_1.TokenizationRegistry.onDidChange((e) => {
                const languageId = this._textModel.getLanguageId();
                if (e.changedLanguages.indexOf(languageId) === -1) {
                    return;
                }
                this._resetTokenizationState();
                this._tokenizationPart.clearTokens();
            }));
            this._resetTokenizationState();
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
        //#region TextModel events
        handleDidChangeContent(e) {
            if (e.isFlush) {
                this._resetTokenizationState();
                return;
            }
            if (this._tokenizationStateStore) {
                for (let i = 0, len = e.changes.length; i < len; i++) {
                    const change = e.changes[i];
                    const [eolCount] = (0, eolCounter_1.countEOL)(change.text);
                    this._tokenizationStateStore.applyEdits(change.range, eolCount);
                }
            }
            this._beginBackgroundTokenization();
        }
        handleDidChangeAttached() {
            this._beginBackgroundTokenization();
        }
        handleDidChangeLanguage(e) {
            this._resetTokenizationState();
            this._tokenizationPart.clearTokens();
        }
        //#endregion
        _resetTokenizationState() {
            const [tokenizationSupport, initialState] = initializeTokenization(this._textModel, this._tokenizationPart);
            if (tokenizationSupport && initialState) {
                this._tokenizationStateStore = new TokenizationStateStore(tokenizationSupport, initialState);
            }
            else {
                this._tokenizationStateStore = null;
            }
            this._beginBackgroundTokenization();
        }
        _beginBackgroundTokenization() {
            if (this._isScheduled || !this._textModel.isAttachedToEditor() || !this._hasLinesToTokenize()) {
                return;
            }
            this._isScheduled = true;
            (0, async_1.runWhenIdle)((deadline) => {
                this._isScheduled = false;
                this._backgroundTokenizeWithDeadline(deadline);
            });
        }
        /**
         * Tokenize until the deadline occurs, but try to yield every 1-2ms.
         */
        _backgroundTokenizeWithDeadline(deadline) {
            // Read the time remaining from the `deadline` immediately because it is unclear
            // if the `deadline` object will be valid after execution leaves this function.
            const endTime = Date.now() + deadline.timeRemaining();
            const execute = () => {
                if (this._isDisposed || !this._textModel.isAttachedToEditor() || !this._hasLinesToTokenize()) {
                    // disposed in the meantime or detached or finished
                    return;
                }
                this._backgroundTokenizeForAtLeast1ms();
                if (Date.now() < endTime) {
                    // There is still time before reaching the deadline, so yield to the browser and then
                    // continue execution
                    (0, platform_1.setTimeout0)(execute);
                }
                else {
                    // The deadline has been reached, so schedule a new idle callback if necessary
                    this._beginBackgroundTokenization();
                }
            };
            execute();
        }
        /**
         * Tokenize for at least 1ms.
         */
        _backgroundTokenizeForAtLeast1ms() {
            const lineCount = this._textModel.getLineCount();
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            const sw = stopwatch_1.StopWatch.create(false);
            do {
                if (sw.elapsed() > 1) {
                    // the comparison is intentionally > 1 and not >= 1 to ensure that
                    // a full millisecond has elapsed, given how microseconds are rounded
                    // to milliseconds
                    break;
                }
                const tokenizedLineNumber = this._tokenizeOneInvalidLine(builder);
                if (tokenizedLineNumber >= lineCount) {
                    break;
                }
            } while (this._hasLinesToTokenize());
            this._tokenizationPart.setTokens(builder.finalize(), this._isTokenizationComplete());
        }
        tokenizeViewport(startLineNumber, endLineNumber) {
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            this._tokenizeViewport(builder, startLineNumber, endLineNumber);
            this._tokenizationPart.setTokens(builder.finalize(), this._isTokenizationComplete());
        }
        reset() {
            this._resetTokenizationState();
            this._tokenizationPart.clearTokens();
        }
        forceTokenization(lineNumber) {
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            this._updateTokensUntilLine(builder, lineNumber);
            this._tokenizationPart.setTokens(builder.finalize(), this._isTokenizationComplete());
        }
        getTokenTypeIfInsertingCharacter(position, character) {
            if (!this._tokenizationStateStore) {
                return 0 /* StandardTokenType.Other */;
            }
            this.forceTokenization(position.lineNumber);
            const lineStartState = this._tokenizationStateStore.getBeginState(position.lineNumber - 1);
            if (!lineStartState) {
                return 0 /* StandardTokenType.Other */;
            }
            const languageId = this._textModel.getLanguageId();
            const lineContent = this._textModel.getLineContent(position.lineNumber);
            // Create the text as if `character` was inserted
            const text = (lineContent.substring(0, position.column - 1)
                + character
                + lineContent.substring(position.column - 1));
            const r = safeTokenize(this._languageIdCodec, languageId, this._tokenizationStateStore.tokenizationSupport, text, true, lineStartState);
            const lineTokens = new lineTokens_1.LineTokens(r.tokens, text, this._languageIdCodec);
            if (lineTokens.getCount() === 0) {
                return 0 /* StandardTokenType.Other */;
            }
            const tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
            return lineTokens.getStandardTokenType(tokenIndex);
        }
        tokenizeLineWithEdit(position, length, newText) {
            const lineNumber = position.lineNumber;
            const column = position.column;
            if (!this._tokenizationStateStore) {
                return null;
            }
            this.forceTokenization(lineNumber);
            const lineStartState = this._tokenizationStateStore.getBeginState(lineNumber - 1);
            if (!lineStartState) {
                return null;
            }
            const curLineContent = this._textModel.getLineContent(lineNumber);
            const newLineContent = curLineContent.substring(0, column - 1)
                + newText + curLineContent.substring(column - 1 + length);
            const languageId = this._textModel.getLanguageIdAtPosition(lineNumber, 0);
            const result = safeTokenize(this._languageIdCodec, languageId, this._tokenizationStateStore.tokenizationSupport, newLineContent, true, lineStartState);
            const lineTokens = new lineTokens_1.LineTokens(result.tokens, newLineContent, this._languageIdCodec);
            return lineTokens;
        }
        isCheapToTokenize(lineNumber) {
            if (!this._tokenizationStateStore) {
                return true;
            }
            const firstInvalidLineNumber = this._tokenizationStateStore.invalidLineStartIndex + 1;
            if (lineNumber > firstInvalidLineNumber) {
                return false;
            }
            if (lineNumber < firstInvalidLineNumber) {
                return true;
            }
            if (this._textModel.getLineLength(lineNumber) < 2048 /* Constants.CHEAP_TOKENIZATION_LENGTH_LIMIT */) {
                return true;
            }
            return false;
        }
        _hasLinesToTokenize() {
            if (!this._tokenizationStateStore) {
                return false;
            }
            return (this._tokenizationStateStore.invalidLineStartIndex < this._textModel.getLineCount());
        }
        _isTokenizationComplete() {
            if (!this._tokenizationStateStore) {
                return false;
            }
            return (this._tokenizationStateStore.invalidLineStartIndex >= this._textModel.getLineCount());
        }
        _tokenizeOneInvalidLine(builder) {
            if (!this._tokenizationStateStore || !this._hasLinesToTokenize()) {
                return this._textModel.getLineCount() + 1;
            }
            const lineNumber = this._tokenizationStateStore.invalidLineStartIndex + 1;
            this._updateTokensUntilLine(builder, lineNumber);
            return lineNumber;
        }
        _updateTokensUntilLine(builder, lineNumber) {
            if (!this._tokenizationStateStore) {
                return;
            }
            const languageId = this._textModel.getLanguageId();
            const linesLength = this._textModel.getLineCount();
            const endLineIndex = lineNumber - 1;
            // Validate all states up to and including endLineIndex
            for (let lineIndex = this._tokenizationStateStore.invalidLineStartIndex; lineIndex <= endLineIndex; lineIndex++) {
                const text = this._textModel.getLineContent(lineIndex + 1);
                const lineStartState = this._tokenizationStateStore.getBeginState(lineIndex);
                const r = safeTokenize(this._languageIdCodec, languageId, this._tokenizationStateStore.tokenizationSupport, text, true, lineStartState);
                builder.add(lineIndex + 1, r.tokens);
                this._tokenizationStateStore.setEndState(linesLength, lineIndex, r.endState);
                lineIndex = this._tokenizationStateStore.invalidLineStartIndex - 1; // -1 because the outer loop increments it
            }
        }
        _tokenizeViewport(builder, startLineNumber, endLineNumber) {
            if (!this._tokenizationStateStore) {
                // nothing to do
                return;
            }
            if (endLineNumber <= this._tokenizationStateStore.invalidLineStartIndex) {
                // nothing to do
                return;
            }
            if (startLineNumber <= this._tokenizationStateStore.invalidLineStartIndex) {
                // tokenization has reached the viewport start...
                this._updateTokensUntilLine(builder, endLineNumber);
                return;
            }
            let nonWhitespaceColumn = this._textModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            const fakeLines = [];
            let initialState = null;
            for (let i = startLineNumber - 1; nonWhitespaceColumn > 1 && i >= 1; i--) {
                const newNonWhitespaceIndex = this._textModel.getLineFirstNonWhitespaceColumn(i);
                if (newNonWhitespaceIndex === 0) {
                    continue;
                }
                if (newNonWhitespaceIndex < nonWhitespaceColumn) {
                    initialState = this._tokenizationStateStore.getBeginState(i - 1);
                    if (initialState) {
                        break;
                    }
                    fakeLines.push(this._textModel.getLineContent(i));
                    nonWhitespaceColumn = newNonWhitespaceIndex;
                }
            }
            if (!initialState) {
                initialState = this._tokenizationStateStore.initialState;
            }
            const languageId = this._textModel.getLanguageId();
            let state = initialState;
            for (let i = fakeLines.length - 1; i >= 0; i--) {
                const r = safeTokenize(this._languageIdCodec, languageId, this._tokenizationStateStore.tokenizationSupport, fakeLines[i], false, state);
                state = r.endState;
            }
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const text = this._textModel.getLineContent(lineNumber);
                const r = safeTokenize(this._languageIdCodec, languageId, this._tokenizationStateStore.tokenizationSupport, text, true, state);
                builder.add(lineNumber, r.tokens);
                this._tokenizationStateStore.markMustBeTokenized(lineNumber - 1);
                state = r.endState;
            }
        }
    }
    exports.TextModelTokenization = TextModelTokenization;
    function initializeTokenization(textModel, tokenizationPart) {
        if (textModel.isTooLargeForTokenization()) {
            return [null, null];
        }
        const tokenizationSupport = languages_1.TokenizationRegistry.get(tokenizationPart.getLanguageId());
        if (!tokenizationSupport) {
            return [null, null];
        }
        let initialState;
        try {
            initialState = tokenizationSupport.getInitialState();
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
            return [null, null];
        }
        return [tokenizationSupport, initialState];
    }
    function safeTokenize(languageIdCodec, languageId, tokenizationSupport, text, hasEOL, state) {
        let r = null;
        if (tokenizationSupport) {
            try {
                r = tokenizationSupport.tokenizeEncoded(text, hasEOL, state.clone());
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        if (!r) {
            r = (0, nullTokenize_1.nullTokenizeEncoded)(languageIdCodec.encodeLanguageId(languageId), state);
        }
        lineTokens_1.LineTokens.convertToEndOffset(r.tokens, text.length);
        return r;
    }
});
//# sourceMappingURL=textModelTokens.js.map