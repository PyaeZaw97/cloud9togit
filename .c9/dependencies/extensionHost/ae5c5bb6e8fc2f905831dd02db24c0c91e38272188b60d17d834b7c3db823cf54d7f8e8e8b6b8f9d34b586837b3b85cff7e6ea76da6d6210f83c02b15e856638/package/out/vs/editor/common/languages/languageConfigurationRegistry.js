/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/supports", "vs/editor/common/languages/supports/characterPair", "vs/editor/common/languages/supports/electricCharacter", "vs/editor/common/languages/supports/indentRules", "vs/editor/common/languages/supports/onEnter", "vs/editor/common/languages/supports/richEditBrackets", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/language", "vs/platform/instantiation/common/extensions", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/supports/languageBracketsConfiguration"], function (require, exports, event_1, lifecycle_1, strings, wordHelper_1, languageConfiguration_1, supports_1, characterPair_1, electricCharacter_1, indentRules_1, onEnter_1, richEditBrackets_1, instantiation_1, configuration_1, language_1, extensions_1, modesRegistry_1, languageBracketsConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResolvedLanguageConfiguration = exports.LanguageConfigurationRegistry = exports.LanguageConfigurationChangeEvent = exports.getScopedLineTokens = exports.getIndentationAtPosition = exports.LanguageConfigurationService = exports.ILanguageConfigurationService = exports.LanguageConfigurationServiceChangeEvent = void 0;
    class LanguageConfigurationServiceChangeEvent {
        constructor(languageId) {
            this.languageId = languageId;
        }
        affects(languageId) {
            return !this.languageId ? true : this.languageId === languageId;
        }
    }
    exports.LanguageConfigurationServiceChangeEvent = LanguageConfigurationServiceChangeEvent;
    exports.ILanguageConfigurationService = (0, instantiation_1.createDecorator)('languageConfigurationService');
    let LanguageConfigurationService = class LanguageConfigurationService extends lifecycle_1.Disposable {
        constructor(configurationService, languageService) {
            super();
            this.configurationService = configurationService;
            this.languageService = languageService;
            this._registry = this._register(new LanguageConfigurationRegistry());
            this.onDidChangeEmitter = this._register(new event_1.Emitter());
            this.onDidChange = this.onDidChangeEmitter.event;
            this.configurations = new Map();
            const languageConfigKeys = new Set(Object.values(customizedLanguageConfigKeys));
            this._register(this.configurationService.onDidChangeConfiguration((e) => {
                const globalConfigChanged = e.change.keys.some((k) => languageConfigKeys.has(k));
                const localConfigChanged = e.change.overrides
                    .filter(([overrideLangName, keys]) => keys.some((k) => languageConfigKeys.has(k)))
                    .map(([overrideLangName]) => overrideLangName);
                if (globalConfigChanged) {
                    this.configurations.clear();
                    this.onDidChangeEmitter.fire(new LanguageConfigurationServiceChangeEvent(undefined));
                }
                else {
                    for (const languageId of localConfigChanged) {
                        if (this.languageService.isRegisteredLanguageId(languageId)) {
                            this.configurations.delete(languageId);
                            this.onDidChangeEmitter.fire(new LanguageConfigurationServiceChangeEvent(languageId));
                        }
                    }
                }
            }));
            this._register(this._registry.onDidChange((e) => {
                this.configurations.delete(e.languageId);
                this.onDidChangeEmitter.fire(new LanguageConfigurationServiceChangeEvent(e.languageId));
            }));
        }
        register(languageId, configuration, priority) {
            return this._registry.register(languageId, configuration, priority);
        }
        getLanguageConfiguration(languageId) {
            let result = this.configurations.get(languageId);
            if (!result) {
                result = computeConfig(languageId, this._registry, this.configurationService, this.languageService);
                this.configurations.set(languageId, result);
            }
            return result;
        }
    };
    LanguageConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, language_1.ILanguageService)
    ], LanguageConfigurationService);
    exports.LanguageConfigurationService = LanguageConfigurationService;
    function computeConfig(languageId, registry, configurationService, languageService) {
        let languageConfig = registry.getLanguageConfiguration(languageId);
        if (!languageConfig) {
            if (!languageService.isRegisteredLanguageId(languageId)) {
                throw new Error(`Language id "${languageId}" is not configured nor known`);
            }
            languageConfig = new ResolvedLanguageConfiguration(languageId, {});
        }
        const customizedConfig = getCustomizedLanguageConfig(languageConfig.languageId, configurationService);
        const data = combineLanguageConfigurations([languageConfig.underlyingConfig, customizedConfig]);
        const config = new ResolvedLanguageConfiguration(languageConfig.languageId, data);
        return config;
    }
    const customizedLanguageConfigKeys = {
        brackets: 'editor.language.brackets',
        colorizedBracketPairs: 'editor.language.colorizedBracketPairs'
    };
    function getCustomizedLanguageConfig(languageId, configurationService) {
        const brackets = configurationService.getValue(customizedLanguageConfigKeys.brackets, {
            overrideIdentifier: languageId,
        });
        const colorizedBracketPairs = configurationService.getValue(customizedLanguageConfigKeys.colorizedBracketPairs, {
            overrideIdentifier: languageId,
        });
        return {
            brackets: validateBracketPairs(brackets),
            colorizedBracketPairs: validateBracketPairs(colorizedBracketPairs),
        };
    }
    function validateBracketPairs(data) {
        if (!Array.isArray(data)) {
            return undefined;
        }
        return data.map(pair => {
            if (!Array.isArray(pair) || pair.length !== 2) {
                return undefined;
            }
            return [pair[0], pair[1]];
        }).filter((p) => !!p);
    }
    function getIndentationAtPosition(model, lineNumber, column) {
        const lineText = model.getLineContent(lineNumber);
        let indentation = strings.getLeadingWhitespace(lineText);
        if (indentation.length > column - 1) {
            indentation = indentation.substring(0, column - 1);
        }
        return indentation;
    }
    exports.getIndentationAtPosition = getIndentationAtPosition;
    function getScopedLineTokens(model, lineNumber, columnNumber) {
        model.tokenization.forceTokenization(lineNumber);
        const lineTokens = model.tokenization.getLineTokens(lineNumber);
        const column = (typeof columnNumber === 'undefined' ? model.getLineMaxColumn(lineNumber) - 1 : columnNumber - 1);
        return (0, supports_1.createScopedLineTokens)(lineTokens, column);
    }
    exports.getScopedLineTokens = getScopedLineTokens;
    class ComposedLanguageConfiguration {
        constructor(languageId) {
            this.languageId = languageId;
            this._resolved = null;
            this._entries = [];
            this._order = 0;
            this._resolved = null;
        }
        register(configuration, priority) {
            const entry = new LanguageConfigurationContribution(configuration, priority, ++this._order);
            this._entries.push(entry);
            this._resolved = null;
            return (0, lifecycle_1.toDisposable)(() => {
                for (let i = 0; i < this._entries.length; i++) {
                    if (this._entries[i] === entry) {
                        this._entries.splice(i, 1);
                        this._resolved = null;
                        break;
                    }
                }
            });
        }
        getResolvedConfiguration() {
            if (!this._resolved) {
                const config = this._resolve();
                if (config) {
                    this._resolved = new ResolvedLanguageConfiguration(this.languageId, config);
                }
            }
            return this._resolved;
        }
        _resolve() {
            if (this._entries.length === 0) {
                return null;
            }
            this._entries.sort(LanguageConfigurationContribution.cmp);
            return combineLanguageConfigurations(this._entries.map(e => e.configuration));
        }
    }
    function combineLanguageConfigurations(configs) {
        let result = {
            comments: undefined,
            brackets: undefined,
            wordPattern: undefined,
            indentationRules: undefined,
            onEnterRules: undefined,
            autoClosingPairs: undefined,
            surroundingPairs: undefined,
            autoCloseBefore: undefined,
            folding: undefined,
            colorizedBracketPairs: undefined,
            __electricCharacterSupport: undefined,
        };
        for (const entry of configs) {
            result = {
                comments: entry.comments || result.comments,
                brackets: entry.brackets || result.brackets,
                wordPattern: entry.wordPattern || result.wordPattern,
                indentationRules: entry.indentationRules || result.indentationRules,
                onEnterRules: entry.onEnterRules || result.onEnterRules,
                autoClosingPairs: entry.autoClosingPairs || result.autoClosingPairs,
                surroundingPairs: entry.surroundingPairs || result.surroundingPairs,
                autoCloseBefore: entry.autoCloseBefore || result.autoCloseBefore,
                folding: entry.folding || result.folding,
                colorizedBracketPairs: entry.colorizedBracketPairs || result.colorizedBracketPairs,
                __electricCharacterSupport: entry.__electricCharacterSupport || result.__electricCharacterSupport,
            };
        }
        return result;
    }
    class LanguageConfigurationContribution {
        constructor(configuration, priority, order) {
            this.configuration = configuration;
            this.priority = priority;
            this.order = order;
        }
        static cmp(a, b) {
            if (a.priority === b.priority) {
                // higher order last
                return a.order - b.order;
            }
            // higher priority last
            return a.priority - b.priority;
        }
    }
    class LanguageConfigurationChangeEvent {
        constructor(languageId) {
            this.languageId = languageId;
        }
    }
    exports.LanguageConfigurationChangeEvent = LanguageConfigurationChangeEvent;
    class LanguageConfigurationRegistry extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._entries = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this.register(modesRegistry_1.PLAINTEXT_LANGUAGE_ID, {
                brackets: [
                    ['(', ')'],
                    ['[', ']'],
                    ['{', '}'],
                ],
                surroundingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '<', close: '>' },
                    { open: '\"', close: '\"' },
                    { open: '\'', close: '\'' },
                    { open: '`', close: '`' },
                ],
                colorizedBracketPairs: [],
                folding: {
                    offSide: true
                }
            }, 0));
        }
        /**
         * @param priority Use a higher number for higher priority
         */
        register(languageId, configuration, priority = 0) {
            let entries = this._entries.get(languageId);
            if (!entries) {
                entries = new ComposedLanguageConfiguration(languageId);
                this._entries.set(languageId, entries);
            }
            const disposable = entries.register(configuration, priority);
            this._onDidChange.fire(new LanguageConfigurationChangeEvent(languageId));
            return (0, lifecycle_1.toDisposable)(() => {
                disposable.dispose();
                this._onDidChange.fire(new LanguageConfigurationChangeEvent(languageId));
            });
        }
        getLanguageConfiguration(languageId) {
            const entries = this._entries.get(languageId);
            return (entries === null || entries === void 0 ? void 0 : entries.getResolvedConfiguration()) || null;
        }
    }
    exports.LanguageConfigurationRegistry = LanguageConfigurationRegistry;
    /**
     * Immutable.
    */
    class ResolvedLanguageConfiguration {
        constructor(languageId, underlyingConfig) {
            this.languageId = languageId;
            this.underlyingConfig = underlyingConfig;
            this._brackets = null;
            this._electricCharacter = null;
            this._onEnterSupport =
                this.underlyingConfig.brackets ||
                    this.underlyingConfig.indentationRules ||
                    this.underlyingConfig.onEnterRules
                    ? new onEnter_1.OnEnterSupport(this.underlyingConfig)
                    : null;
            this.comments = ResolvedLanguageConfiguration._handleComments(this.underlyingConfig);
            this.characterPair = new characterPair_1.CharacterPairSupport(this.underlyingConfig);
            this.wordDefinition = this.underlyingConfig.wordPattern || wordHelper_1.DEFAULT_WORD_REGEXP;
            this.indentationRules = this.underlyingConfig.indentationRules;
            if (this.underlyingConfig.indentationRules) {
                this.indentRulesSupport = new indentRules_1.IndentRulesSupport(this.underlyingConfig.indentationRules);
            }
            else {
                this.indentRulesSupport = null;
            }
            this.foldingRules = this.underlyingConfig.folding || {};
            this.bracketsNew = new languageBracketsConfiguration_1.LanguageBracketsConfiguration(languageId, this.underlyingConfig);
        }
        getWordDefinition() {
            return (0, wordHelper_1.ensureValidWordDefinition)(this.wordDefinition);
        }
        get brackets() {
            if (!this._brackets && this.underlyingConfig.brackets) {
                this._brackets = new richEditBrackets_1.RichEditBrackets(this.languageId, this.underlyingConfig.brackets);
            }
            return this._brackets;
        }
        get electricCharacter() {
            if (!this._electricCharacter) {
                this._electricCharacter = new electricCharacter_1.BracketElectricCharacterSupport(this.brackets);
            }
            return this._electricCharacter;
        }
        onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText) {
            if (!this._onEnterSupport) {
                return null;
            }
            return this._onEnterSupport.onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText);
        }
        getAutoClosingPairs() {
            return new languageConfiguration_1.AutoClosingPairs(this.characterPair.getAutoClosingPairs());
        }
        getAutoCloseBeforeSet() {
            return this.characterPair.getAutoCloseBeforeSet();
        }
        getSurroundingPairs() {
            return this.characterPair.getSurroundingPairs();
        }
        static _handleComments(conf) {
            const commentRule = conf.comments;
            if (!commentRule) {
                return null;
            }
            // comment configuration
            const comments = {};
            if (commentRule.lineComment) {
                comments.lineCommentToken = commentRule.lineComment;
            }
            if (commentRule.blockComment) {
                const [blockStart, blockEnd] = commentRule.blockComment;
                comments.blockCommentStartToken = blockStart;
                comments.blockCommentEndToken = blockEnd;
            }
            return comments;
        }
    }
    exports.ResolvedLanguageConfiguration = ResolvedLanguageConfiguration;
    (0, extensions_1.registerSingleton)(exports.ILanguageConfigurationService, LanguageConfigurationService);
});
//# sourceMappingURL=languageConfigurationRegistry.js.map