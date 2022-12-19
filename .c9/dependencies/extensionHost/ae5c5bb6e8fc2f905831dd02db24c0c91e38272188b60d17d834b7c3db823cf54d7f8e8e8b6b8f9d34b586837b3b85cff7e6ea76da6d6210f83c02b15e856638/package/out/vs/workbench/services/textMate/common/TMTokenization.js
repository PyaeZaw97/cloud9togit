/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/editor/common/languages", "vs/base/common/lifecycle"], function (require, exports, event_1, languages_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TMTokenization = void 0;
    class TMTokenization extends lifecycle_1.Disposable {
        constructor(grammar, initialState, containsEmbeddedLanguages) {
            super();
            this._onDidEncounterLanguage = this._register(new event_1.Emitter());
            this.onDidEncounterLanguage = this._onDidEncounterLanguage.event;
            this._grammar = grammar;
            this._initialState = initialState;
            this._containsEmbeddedLanguages = containsEmbeddedLanguages;
            this._seenLanguages = [];
        }
        getInitialState() {
            return this._initialState;
        }
        tokenize(line, hasEOL, state) {
            throw new Error('Not supported!');
        }
        tokenizeEncoded(line, hasEOL, state) {
            const textMateResult = this._grammar.tokenizeLine2(line, state, 500);
            if (textMateResult.stoppedEarly) {
                console.warn(`Time limit reached when tokenizing line: ${line.substring(0, 100)}`);
                // return the state at the beginning of the line
                return new languages_1.EncodedTokenizationResult(textMateResult.tokens, state);
            }
            if (this._containsEmbeddedLanguages) {
                let seenLanguages = this._seenLanguages;
                let tokens = textMateResult.tokens;
                // Must check if any of the embedded languages was hit
                for (let i = 0, len = (tokens.length >>> 1); i < len; i++) {
                    let metadata = tokens[(i << 1) + 1];
                    let languageId = languages_1.TokenMetadata.getLanguageId(metadata);
                    if (!seenLanguages[languageId]) {
                        seenLanguages[languageId] = true;
                        this._onDidEncounterLanguage.fire(languageId);
                    }
                }
            }
            let endState;
            // try to save an object if possible
            if (state.equals(textMateResult.ruleStack)) {
                endState = state;
            }
            else {
                endState = textMateResult.ruleStack;
            }
            return new languages_1.EncodedTokenizationResult(textMateResult.tokens, endState);
        }
    }
    exports.TMTokenization = TMTokenization;
});
//# sourceMappingURL=TMTokenization.js.map