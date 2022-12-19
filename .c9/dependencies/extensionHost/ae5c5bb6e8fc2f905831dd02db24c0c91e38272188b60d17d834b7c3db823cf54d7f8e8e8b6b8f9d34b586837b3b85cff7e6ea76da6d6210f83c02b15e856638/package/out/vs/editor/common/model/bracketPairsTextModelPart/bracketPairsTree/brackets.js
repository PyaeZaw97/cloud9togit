define(["require", "exports", "vs/base/common/strings", "./ast", "./length", "./smallImmutableSet", "./tokenizer"], function (require, exports, strings_1, ast_1, length_1, smallImmutableSet_1, tokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageAgnosticBracketTokens = exports.BracketTokens = void 0;
    class BracketTokens {
        constructor(map) {
            this.map = map;
            this.hasRegExp = false;
            this._regExpGlobal = null;
        }
        static createFromLanguage(configuration, denseKeyProvider) {
            function getId(bracketInfo) {
                return denseKeyProvider.getKey(`${bracketInfo.languageId}:::${bracketInfo.bracketText}`);
            }
            const map = new Map();
            for (const openingBracket of configuration.bracketsNew.openingBrackets) {
                const length = (0, length_1.toLength)(0, openingBracket.bracketText.length);
                const openingTextId = getId(openingBracket);
                const bracketIds = smallImmutableSet_1.SmallImmutableSet.getEmpty().add(openingTextId, smallImmutableSet_1.identityKeyProvider);
                map.set(openingBracket.bracketText, new tokenizer_1.Token(length, 1 /* TokenKind.OpeningBracket */, openingTextId, bracketIds, ast_1.BracketAstNode.create(length, openingBracket, bracketIds)));
            }
            for (const closingBracket of configuration.bracketsNew.closingBrackets) {
                const length = (0, length_1.toLength)(0, closingBracket.bracketText.length);
                let bracketIds = smallImmutableSet_1.SmallImmutableSet.getEmpty();
                const closingBrackets = closingBracket.getClosedBrackets();
                for (const bracket of closingBrackets) {
                    bracketIds = bracketIds.add(getId(bracket), smallImmutableSet_1.identityKeyProvider);
                }
                map.set(closingBracket.bracketText, new tokenizer_1.Token(length, 2 /* TokenKind.ClosingBracket */, getId(closingBrackets[0]), bracketIds, ast_1.BracketAstNode.create(length, closingBracket, bracketIds)));
            }
            return new BracketTokens(map);
        }
        getRegExpStr() {
            if (this.isEmpty) {
                return null;
            }
            else {
                const keys = [...this.map.keys()];
                keys.sort();
                keys.reverse();
                return keys.map(k => prepareBracketForRegExp(k)).join('|');
            }
        }
        /**
         * Returns null if there is no such regexp (because there are no brackets).
        */
        get regExpGlobal() {
            if (!this.hasRegExp) {
                const regExpStr = this.getRegExpStr();
                this._regExpGlobal = regExpStr ? new RegExp(regExpStr, 'gi') : null;
                this.hasRegExp = true;
            }
            return this._regExpGlobal;
        }
        getToken(value) {
            return this.map.get(value.toLowerCase());
        }
        findClosingTokenText(openingBracketIds) {
            for (const [closingText, info] of this.map) {
                if (info.bracketIds.intersects(openingBracketIds)) {
                    return closingText;
                }
            }
            return undefined;
        }
        get isEmpty() {
            return this.map.size === 0;
        }
    }
    exports.BracketTokens = BracketTokens;
    function prepareBracketForRegExp(str) {
        const escaped = (0, strings_1.escapeRegExpCharacters)(str);
        // This bracket pair uses letters like e.g. "begin" - "end" (see https://github.com/microsoft/vscode/issues/132162)
        const needsWordBoundaries = (/^[\w ]+$/.test(str));
        return (needsWordBoundaries ? `\\b${escaped}\\b` : escaped);
    }
    class LanguageAgnosticBracketTokens {
        constructor(denseKeyProvider, getLanguageConfiguration) {
            this.denseKeyProvider = denseKeyProvider;
            this.getLanguageConfiguration = getLanguageConfiguration;
            this.languageIdToBracketTokens = new Map();
        }
        didLanguageChange(languageId) {
            // Report a change whenever the language configuration updates.
            return this.languageIdToBracketTokens.has(languageId);
        }
        getSingleLanguageBracketTokens(languageId) {
            let singleLanguageBracketTokens = this.languageIdToBracketTokens.get(languageId);
            if (!singleLanguageBracketTokens) {
                singleLanguageBracketTokens = BracketTokens.createFromLanguage(this.getLanguageConfiguration(languageId), this.denseKeyProvider);
                this.languageIdToBracketTokens.set(languageId, singleLanguageBracketTokens);
            }
            return singleLanguageBracketTokens;
        }
        getToken(value, languageId) {
            const singleLanguageBracketTokens = this.getSingleLanguageBracketTokens(languageId);
            return singleLanguageBracketTokens.getToken(value);
        }
    }
    exports.LanguageAgnosticBracketTokens = LanguageAgnosticBracketTokens;
});
//# sourceMappingURL=brackets.js.map