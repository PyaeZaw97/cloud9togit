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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/arrays", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages/language", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/textMate/common/TMGrammars", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/workbench/services/textMate/common/TMGrammarFactory", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/progress/common/progress", "vs/workbench/services/textMate/common/TMTokenization"], function (require, exports, nls, dom, color_1, errors_1, event_1, resources, types, arrays_1, languages_1, nullTokenize_1, tokenization_1, language_1, log_1, notification_1, TMGrammars_1, workbenchThemeService_1, lifecycle_1, configuration_1, TMGrammarFactory_1, extensionResourceLoader_1, progress_1, TMTokenization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTextMateService = void 0;
    let AbstractTextMateService = class AbstractTextMateService extends lifecycle_1.Disposable {
        constructor(_languageService, _themeService, _extensionResourceLoaderService, _notificationService, _logService, _configurationService, _progressService) {
            super();
            this._languageService = _languageService;
            this._themeService = _themeService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._notificationService = _notificationService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._progressService = _progressService;
            this._onDidEncounterLanguage = this._register(new event_1.Emitter());
            this.onDidEncounterLanguage = this._onDidEncounterLanguage.event;
            this._vscodeOniguruma = null;
            this._styleElement = dom.createStyleSheet();
            this._styleElement.className = 'vscode-tokens-styles';
            this._createdModes = [];
            this._encounteredLanguages = [];
            this._debugMode = false;
            this._debugModePrintFunc = () => { };
            this._grammarDefinitions = null;
            this._grammarFactory = null;
            this._tokenizersRegistrations = [];
            this._currentTheme = null;
            this._currentTokenColorMap = null;
            TMGrammars_1.grammarsExtPoint.setHandler((extensions) => {
                this._grammarDefinitions = null;
                if (this._grammarFactory) {
                    this._grammarFactory.dispose();
                    this._grammarFactory = null;
                    this._onDidDisposeGrammarFactory();
                }
                this._tokenizersRegistrations = (0, lifecycle_1.dispose)(this._tokenizersRegistrations);
                this._grammarDefinitions = [];
                for (const extension of extensions) {
                    const grammars = extension.value;
                    for (const grammar of grammars) {
                        if (!this._validateGrammarExtensionPoint(extension.description.extensionLocation, grammar, extension.collector)) {
                            continue;
                        }
                        const grammarLocation = resources.joinPath(extension.description.extensionLocation, grammar.path);
                        const embeddedLanguages = Object.create(null);
                        if (grammar.embeddedLanguages) {
                            let scopes = Object.keys(grammar.embeddedLanguages);
                            for (let i = 0, len = scopes.length; i < len; i++) {
                                let scope = scopes[i];
                                let language = grammar.embeddedLanguages[scope];
                                if (typeof language !== 'string') {
                                    // never hurts to be too careful
                                    continue;
                                }
                                if (this._languageService.isRegisteredLanguageId(language)) {
                                    embeddedLanguages[scope] = this._languageService.languageIdCodec.encodeLanguageId(language);
                                }
                            }
                        }
                        const tokenTypes = Object.create(null);
                        if (grammar.tokenTypes) {
                            const scopes = Object.keys(grammar.tokenTypes);
                            for (const scope of scopes) {
                                const tokenType = grammar.tokenTypes[scope];
                                switch (tokenType) {
                                    case 'string':
                                        tokenTypes[scope] = 2 /* StandardTokenType.String */;
                                        break;
                                    case 'other':
                                        tokenTypes[scope] = 0 /* StandardTokenType.Other */;
                                        break;
                                    case 'comment':
                                        tokenTypes[scope] = 1 /* StandardTokenType.Comment */;
                                        break;
                                }
                            }
                        }
                        let validLanguageId = null;
                        if (grammar.language && this._languageService.isRegisteredLanguageId(grammar.language)) {
                            validLanguageId = grammar.language;
                        }
                        function asStringArray(array, defaultValue) {
                            if (!Array.isArray(array)) {
                                return defaultValue;
                            }
                            if (!array.every(e => typeof e === 'string')) {
                                return defaultValue;
                            }
                            return array;
                        }
                        this._grammarDefinitions.push({
                            location: grammarLocation,
                            language: validLanguageId ? validLanguageId : undefined,
                            scopeName: grammar.scopeName,
                            embeddedLanguages: embeddedLanguages,
                            tokenTypes: tokenTypes,
                            injectTo: grammar.injectTo,
                            balancedBracketSelectors: asStringArray(grammar.balancedBracketScopes, ['*']),
                            unbalancedBracketSelectors: asStringArray(grammar.unbalancedBracketScopes, []),
                        });
                        if (validLanguageId) {
                            this._tokenizersRegistrations.push(languages_1.TokenizationRegistry.registerFactory(validLanguageId, this._createFactory(validLanguageId)));
                        }
                    }
                }
                for (const createMode of this._createdModes) {
                    languages_1.TokenizationRegistry.getOrCreate(createMode);
                }
            });
            this._updateTheme(this._grammarFactory, this._themeService.getColorTheme(), true);
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._updateTheme(this._grammarFactory, this._themeService.getColorTheme(), false);
            }));
            this._languageService.onDidEncounterLanguage((languageId) => {
                this._createdModes.push(languageId);
            });
        }
        startDebugMode(printFn, onStop) {
            if (this._debugMode) {
                this._notificationService.error(nls.localize('alreadyDebugging', "Already Logging."));
                return;
            }
            this._debugModePrintFunc = printFn;
            this._debugMode = true;
            if (this._debugMode) {
                this._progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    buttons: [nls.localize('stop', "Stop")]
                }, (progress) => {
                    progress.report({
                        message: nls.localize('progress1', "Preparing to log TM Grammar parsing. Press Stop when finished.")
                    });
                    return this._getVSCodeOniguruma().then((vscodeOniguruma) => {
                        vscodeOniguruma.setDefaultDebugCall(true);
                        progress.report({
                            message: nls.localize('progress2', "Now logging TM Grammar parsing. Press Stop when finished.")
                        });
                        return new Promise((resolve, reject) => { });
                    });
                }, (choice) => {
                    this._getVSCodeOniguruma().then((vscodeOniguruma) => {
                        this._debugModePrintFunc = () => { };
                        this._debugMode = false;
                        vscodeOniguruma.setDefaultDebugCall(false);
                        onStop();
                    });
                });
            }
        }
        _canCreateGrammarFactory() {
            // Check if extension point is ready
            return (this._grammarDefinitions ? true : false);
        }
        async _getOrCreateGrammarFactory() {
            if (this._grammarFactory) {
                return this._grammarFactory;
            }
            const [vscodeTextmate, vscodeOniguruma] = await Promise.all([new Promise((resolve_1, reject_1) => { require(['vscode-textmate'], resolve_1, reject_1); }), this._getVSCodeOniguruma()]);
            const onigLib = Promise.resolve({
                createOnigScanner: (sources) => vscodeOniguruma.createOnigScanner(sources),
                createOnigString: (str) => vscodeOniguruma.createOnigString(str)
            });
            // Avoid duplicate instantiations
            if (this._grammarFactory) {
                return this._grammarFactory;
            }
            this._grammarFactory = new TMGrammarFactory_1.TMGrammarFactory({
                logTrace: (msg) => this._logService.trace(msg),
                logError: (msg, err) => this._logService.error(msg, err),
                readFile: (resource) => this._extensionResourceLoaderService.readExtensionResource(resource)
            }, this._grammarDefinitions || [], vscodeTextmate, onigLib);
            this._onDidCreateGrammarFactory(this._grammarDefinitions || []);
            this._updateTheme(this._grammarFactory, this._themeService.getColorTheme(), true);
            return this._grammarFactory;
        }
        _createFactory(languageId) {
            return {
                createTokenizationSupport: async () => {
                    if (!this._languageService.isRegisteredLanguageId(languageId)) {
                        return null;
                    }
                    if (!this._canCreateGrammarFactory()) {
                        return null;
                    }
                    const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
                    try {
                        const grammarFactory = await this._getOrCreateGrammarFactory();
                        if (!grammarFactory.has(languageId)) {
                            return null;
                        }
                        const r = await grammarFactory.createGrammar(languageId, encodedLanguageId);
                        if (!r.grammar) {
                            return null;
                        }
                        const tokenization = new TMTokenization_1.TMTokenization(r.grammar, r.initialState, r.containsEmbeddedLanguages);
                        tokenization.onDidEncounterLanguage((encodedLanguageId) => {
                            if (!this._encounteredLanguages[encodedLanguageId]) {
                                const languageId = this._languageService.languageIdCodec.decodeLanguageId(encodedLanguageId);
                                this._encounteredLanguages[encodedLanguageId] = true;
                                this._onDidEncounterLanguage.fire(languageId);
                            }
                        });
                        return new TMTokenizationSupportWithLineLimit(languageId, encodedLanguageId, tokenization, this._configurationService);
                    }
                    catch (err) {
                        if (err.message && err.message === TMGrammarFactory_1.missingTMGrammarErrorMessage) {
                            // Don't log this error message
                            return null;
                        }
                        (0, errors_1.onUnexpectedError)(err);
                        return null;
                    }
                }
            };
        }
        static _toColorMap(colorMap) {
            let result = [null];
            for (let i = 1, len = colorMap.length; i < len; i++) {
                result[i] = color_1.Color.fromHex(colorMap[i]);
            }
            return result;
        }
        _updateTheme(grammarFactory, colorTheme, forceUpdate) {
            if (!forceUpdate && this._currentTheme && this._currentTokenColorMap && AbstractTextMateService.equalsTokenRules(this._currentTheme.settings, colorTheme.tokenColors) && (0, arrays_1.equals)(this._currentTokenColorMap, colorTheme.tokenColorMap)) {
                return;
            }
            this._currentTheme = { name: colorTheme.label, settings: colorTheme.tokenColors };
            this._currentTokenColorMap = colorTheme.tokenColorMap;
            this._doUpdateTheme(grammarFactory, this._currentTheme, this._currentTokenColorMap);
        }
        _doUpdateTheme(grammarFactory, theme, tokenColorMap) {
            grammarFactory === null || grammarFactory === void 0 ? void 0 : grammarFactory.setTheme(theme, tokenColorMap);
            let colorMap = AbstractTextMateService._toColorMap(tokenColorMap);
            let cssRules = (0, tokenization_1.generateTokensCSSForColorMap)(colorMap);
            this._styleElement.textContent = cssRules;
            languages_1.TokenizationRegistry.setColorMap(colorMap);
        }
        static equalsTokenRules(a, b) {
            if (!b || !a || b.length !== a.length) {
                return false;
            }
            for (let i = b.length - 1; i >= 0; i--) {
                let r1 = b[i];
                let r2 = a[i];
                if (r1.scope !== r2.scope) {
                    return false;
                }
                let s1 = r1.settings;
                let s2 = r2.settings;
                if (s1 && s2) {
                    if (s1.fontStyle !== s2.fontStyle || s1.foreground !== s2.foreground || s1.background !== s2.background) {
                        return false;
                    }
                }
                else if (!s1 || !s2) {
                    return false;
                }
            }
            return true;
        }
        _validateGrammarExtensionPoint(extensionLocation, syntax, collector) {
            if (syntax.language && ((typeof syntax.language !== 'string') || !this._languageService.isRegisteredLanguageId(syntax.language))) {
                collector.error(nls.localize('invalid.language', "Unknown language in `contributes.{0}.language`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.language)));
                return false;
            }
            if (!syntax.scopeName || (typeof syntax.scopeName !== 'string')) {
                collector.error(nls.localize('invalid.scopeName', "Expected string in `contributes.{0}.scopeName`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.scopeName)));
                return false;
            }
            if (!syntax.path || (typeof syntax.path !== 'string')) {
                collector.error(nls.localize('invalid.path.0', "Expected string in `contributes.{0}.path`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.path)));
                return false;
            }
            if (syntax.injectTo && (!Array.isArray(syntax.injectTo) || syntax.injectTo.some(scope => typeof scope !== 'string'))) {
                collector.error(nls.localize('invalid.injectTo', "Invalid value in `contributes.{0}.injectTo`. Must be an array of language scope names. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.injectTo)));
                return false;
            }
            if (syntax.embeddedLanguages && !types.isObject(syntax.embeddedLanguages)) {
                collector.error(nls.localize('invalid.embeddedLanguages', "Invalid value in `contributes.{0}.embeddedLanguages`. Must be an object map from scope name to language. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.embeddedLanguages)));
                return false;
            }
            if (syntax.tokenTypes && !types.isObject(syntax.tokenTypes)) {
                collector.error(nls.localize('invalid.tokenTypes', "Invalid value in `contributes.{0}.tokenTypes`. Must be an object map from scope name to token type. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.tokenTypes)));
                return false;
            }
            const grammarLocation = resources.joinPath(extensionLocation, syntax.path);
            if (!resources.isEqualOrParent(grammarLocation, extensionLocation)) {
                collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", TMGrammars_1.grammarsExtPoint.name, grammarLocation.path, extensionLocation.path));
            }
            return true;
        }
        async createGrammar(languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return null;
            }
            const grammarFactory = await this._getOrCreateGrammarFactory();
            if (!grammarFactory.has(languageId)) {
                return null;
            }
            const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
            const { grammar } = await grammarFactory.createGrammar(languageId, encodedLanguageId);
            return grammar;
        }
        _onDidCreateGrammarFactory(grammarDefinitions) {
        }
        _onDidDisposeGrammarFactory() {
        }
        _getVSCodeOniguruma() {
            if (!this._vscodeOniguruma) {
                this._vscodeOniguruma = this._doGetVSCodeOniguruma();
            }
            return this._vscodeOniguruma;
        }
        async _doGetVSCodeOniguruma() {
            const [vscodeOniguruma, wasm] = await Promise.all([new Promise((resolve_2, reject_2) => { require(['vscode-oniguruma'], resolve_2, reject_2); }), this._loadVSCodeOnigurumWASM()]);
            const options = {
                data: wasm,
                print: (str) => {
                    this._debugModePrintFunc(str);
                }
            };
            await vscodeOniguruma.loadWASM(options);
            return vscodeOniguruma;
        }
    };
    AbstractTextMateService = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, progress_1.IProgressService)
    ], AbstractTextMateService);
    exports.AbstractTextMateService = AbstractTextMateService;
    let TMTokenizationSupportWithLineLimit = class TMTokenizationSupportWithLineLimit {
        constructor(languageId, encodedLanguageId, actual, _configurationService) {
            this._configurationService = _configurationService;
            this._languageId = languageId;
            this._encodedLanguageId = encodedLanguageId;
            this._actual = actual;
            this._maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                overrideIdentifier: this._languageId
            });
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.maxTokenizationLineLength')) {
                    this._maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                        overrideIdentifier: this._languageId
                    });
                }
            });
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        tokenize(line, hasEOL, state) {
            throw new Error('Not supported!');
        }
        tokenizeEncoded(line, hasEOL, state) {
            // Do not attempt to tokenize if a line is too long
            if (line.length >= this._maxTokenizationLineLength) {
                return (0, nullTokenize_1.nullTokenizeEncoded)(this._encodedLanguageId, state);
            }
            return this._actual.tokenizeEncoded(line, hasEOL, state);
        }
    };
    TMTokenizationSupportWithLineLimit = __decorate([
        __param(3, configuration_1.IConfigurationService)
    ], TMTokenizationSupportWithLineLimit);
});
//# sourceMappingURL=abstractTextMateService.js.map