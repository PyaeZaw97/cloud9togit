/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/services/languagesAssociations", "vs/editor/common/languages/modesRegistry", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, errors_1, event_1, lifecycle_1, strings_1, languagesAssociations_1, modesRegistry_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagesRegistry = exports.LanguageIdCodec = void 0;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const NULL_LANGUAGE_ID = 'vs.editor.nullLanguage';
    class LanguageIdCodec {
        constructor() {
            this._languageIdToLanguage = [];
            this._languageToLanguageId = new Map();
            this._register(NULL_LANGUAGE_ID, 0 /* LanguageId.Null */);
            this._register(modesRegistry_1.PLAINTEXT_LANGUAGE_ID, 1 /* LanguageId.PlainText */);
            this._nextLanguageId = 2;
        }
        _register(language, languageId) {
            this._languageIdToLanguage[languageId] = language;
            this._languageToLanguageId.set(language, languageId);
        }
        register(language) {
            if (this._languageToLanguageId.has(language)) {
                return;
            }
            const languageId = this._nextLanguageId++;
            this._register(language, languageId);
        }
        encodeLanguageId(languageId) {
            return this._languageToLanguageId.get(languageId) || 0 /* LanguageId.Null */;
        }
        decodeLanguageId(languageId) {
            return this._languageIdToLanguage[languageId] || NULL_LANGUAGE_ID;
        }
    }
    exports.LanguageIdCodec = LanguageIdCodec;
    class LanguagesRegistry extends lifecycle_1.Disposable {
        constructor(useModesRegistry = true, warnOnOverwrite = false) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            LanguagesRegistry.instanceCount++;
            this._warnOnOverwrite = warnOnOverwrite;
            this.languageIdCodec = new LanguageIdCodec();
            this._dynamicLanguages = [];
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            if (useModesRegistry) {
                this._initializeFromRegistry();
                this._register(modesRegistry_1.ModesRegistry.onDidChangeLanguages((m) => {
                    this._initializeFromRegistry();
                }));
            }
        }
        dispose() {
            LanguagesRegistry.instanceCount--;
            super.dispose();
        }
        setDynamicLanguages(def) {
            this._dynamicLanguages = def;
            this._initializeFromRegistry();
        }
        _initializeFromRegistry() {
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            (0, languagesAssociations_1.clearPlatformLanguageAssociations)();
            const desc = [].concat(modesRegistry_1.ModesRegistry.getLanguages()).concat(this._dynamicLanguages);
            this._registerLanguages(desc);
        }
        registerLanguage(desc) {
            return modesRegistry_1.ModesRegistry.registerLanguage(desc);
        }
        _registerLanguages(desc) {
            for (const d of desc) {
                this._registerLanguage(d);
            }
            // Rebuild fast path maps
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            Object.keys(this._languages).forEach((langId) => {
                const language = this._languages[langId];
                if (language.name) {
                    this._nameMap[language.name] = language.identifier;
                }
                language.aliases.forEach((alias) => {
                    this._lowercaseNameMap[alias.toLowerCase()] = language.identifier;
                });
                language.mimetypes.forEach((mimetype) => {
                    this._mimeTypesMap[mimetype] = language.identifier;
                });
            });
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerOverrideIdentifiers(this.getRegisteredLanguageIds());
            this._onDidChange.fire();
        }
        _registerLanguage(lang) {
            const langId = lang.id;
            let resolvedLanguage;
            if (hasOwnProperty.call(this._languages, langId)) {
                resolvedLanguage = this._languages[langId];
            }
            else {
                this.languageIdCodec.register(langId);
                resolvedLanguage = {
                    identifier: langId,
                    name: null,
                    mimetypes: [],
                    aliases: [],
                    extensions: [],
                    filenames: [],
                    configurationFiles: [],
                    icons: []
                };
                this._languages[langId] = resolvedLanguage;
            }
            this._mergeLanguage(resolvedLanguage, lang);
        }
        _mergeLanguage(resolvedLanguage, lang) {
            const langId = lang.id;
            let primaryMime = null;
            if (Array.isArray(lang.mimetypes) && lang.mimetypes.length > 0) {
                resolvedLanguage.mimetypes.push(...lang.mimetypes);
                primaryMime = lang.mimetypes[0];
            }
            if (!primaryMime) {
                primaryMime = `text/x-${langId}`;
                resolvedLanguage.mimetypes.push(primaryMime);
            }
            if (Array.isArray(lang.extensions)) {
                if (lang.configuration) {
                    // insert first as this appears to be the 'primary' language definition
                    resolvedLanguage.extensions = lang.extensions.concat(resolvedLanguage.extensions);
                }
                else {
                    resolvedLanguage.extensions = resolvedLanguage.extensions.concat(lang.extensions);
                }
                for (let extension of lang.extensions) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, extension: extension }, this._warnOnOverwrite);
                }
            }
            if (Array.isArray(lang.filenames)) {
                for (let filename of lang.filenames) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, filename: filename }, this._warnOnOverwrite);
                    resolvedLanguage.filenames.push(filename);
                }
            }
            if (Array.isArray(lang.filenamePatterns)) {
                for (let filenamePattern of lang.filenamePatterns) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, filepattern: filenamePattern }, this._warnOnOverwrite);
                }
            }
            if (typeof lang.firstLine === 'string' && lang.firstLine.length > 0) {
                let firstLineRegexStr = lang.firstLine;
                if (firstLineRegexStr.charAt(0) !== '^') {
                    firstLineRegexStr = '^' + firstLineRegexStr;
                }
                try {
                    const firstLineRegex = new RegExp(firstLineRegexStr);
                    if (!(0, strings_1.regExpLeadsToEndlessLoop)(firstLineRegex)) {
                        (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, firstline: firstLineRegex }, this._warnOnOverwrite);
                    }
                }
                catch (err) {
                    // Most likely, the regex was bad
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            resolvedLanguage.aliases.push(langId);
            let langAliases = null;
            if (typeof lang.aliases !== 'undefined' && Array.isArray(lang.aliases)) {
                if (lang.aliases.length === 0) {
                    // signal that this language should not get a name
                    langAliases = [null];
                }
                else {
                    langAliases = lang.aliases;
                }
            }
            if (langAliases !== null) {
                for (const langAlias of langAliases) {
                    if (!langAlias || langAlias.length === 0) {
                        continue;
                    }
                    resolvedLanguage.aliases.push(langAlias);
                }
            }
            const containsAliases = (langAliases !== null && langAliases.length > 0);
            if (containsAliases && langAliases[0] === null) {
                // signal that this language should not get a name
            }
            else {
                const bestName = (containsAliases ? langAliases[0] : null) || langId;
                if (containsAliases || !resolvedLanguage.name) {
                    resolvedLanguage.name = bestName;
                }
            }
            if (lang.configuration) {
                resolvedLanguage.configurationFiles.push(lang.configuration);
            }
            if (lang.icon) {
                resolvedLanguage.icons.push(lang.icon);
            }
        }
        isRegisteredLanguageId(languageId) {
            if (!languageId) {
                return false;
            }
            return hasOwnProperty.call(this._languages, languageId);
        }
        getRegisteredLanguageIds() {
            return Object.keys(this._languages);
        }
        getSortedRegisteredLanguageNames() {
            const result = [];
            for (const languageName in this._nameMap) {
                if (hasOwnProperty.call(this._nameMap, languageName)) {
                    result.push({
                        languageName: languageName,
                        languageId: this._nameMap[languageName]
                    });
                }
            }
            result.sort((a, b) => (0, strings_1.compareIgnoreCase)(a.languageName, b.languageName));
            return result;
        }
        getLanguageName(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            return this._languages[languageId].name;
        }
        getMimeType(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            const language = this._languages[languageId];
            return (language.mimetypes[0] || null);
        }
        getExtensions(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].extensions;
        }
        getFilenames(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].filenames;
        }
        getIcon(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            const language = this._languages[languageId];
            return (language.icons[0] || null);
        }
        getConfigurationFiles(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].configurationFiles || [];
        }
        getLanguageIdByLanguageName(languageName) {
            const languageNameLower = languageName.toLowerCase();
            if (!hasOwnProperty.call(this._lowercaseNameMap, languageNameLower)) {
                return null;
            }
            return this._lowercaseNameMap[languageNameLower];
        }
        getLanguageIdByMimeType(mimeType) {
            if (!mimeType) {
                return null;
            }
            if (hasOwnProperty.call(this._mimeTypesMap, mimeType)) {
                return this._mimeTypesMap[mimeType];
            }
            return null;
        }
        guessLanguageIdByFilepathOrFirstLine(resource, firstLine) {
            if (!resource && !firstLine) {
                return [];
            }
            return (0, languagesAssociations_1.getLanguageIds)(resource, firstLine);
        }
    }
    exports.LanguagesRegistry = LanguagesRegistry;
    LanguagesRegistry.instanceCount = 0;
});
//# sourceMappingURL=languagesRegistry.js.map