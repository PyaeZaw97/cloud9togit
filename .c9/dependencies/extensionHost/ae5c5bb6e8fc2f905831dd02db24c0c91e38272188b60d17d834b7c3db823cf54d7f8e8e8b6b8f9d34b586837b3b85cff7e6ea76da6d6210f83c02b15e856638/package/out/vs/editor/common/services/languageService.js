/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/services/languagesRegistry", "vs/base/common/arrays", "vs/editor/common/languages", "vs/editor/common/languages/modesRegistry"], function (require, exports, event_1, lifecycle_1, languagesRegistry_1, arrays_1, languages_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageService = void 0;
    class LanguageService extends lifecycle_1.Disposable {
        constructor(warnOnOverwrite = false) {
            super();
            this._onDidEncounterLanguage = this._register(new event_1.Emitter());
            this.onDidEncounterLanguage = this._onDidEncounterLanguage.event;
            this._onDidChange = this._register(new event_1.Emitter({ leakWarningThreshold: 200 /* https://github.com/microsoft/vscode/issues/119968 */ }));
            this.onDidChange = this._onDidChange.event;
            LanguageService.instanceCount++;
            this._encounteredLanguages = new Set();
            this._registry = this._register(new languagesRegistry_1.LanguagesRegistry(true, warnOnOverwrite));
            this.languageIdCodec = this._registry.languageIdCodec;
            this._register(this._registry.onDidChange(() => this._onDidChange.fire()));
        }
        dispose() {
            LanguageService.instanceCount--;
            super.dispose();
        }
        registerLanguage(def) {
            return this._registry.registerLanguage(def);
        }
        isRegisteredLanguageId(languageId) {
            return this._registry.isRegisteredLanguageId(languageId);
        }
        getRegisteredLanguageIds() {
            return this._registry.getRegisteredLanguageIds();
        }
        getSortedRegisteredLanguageNames() {
            return this._registry.getSortedRegisteredLanguageNames();
        }
        getLanguageName(languageId) {
            return this._registry.getLanguageName(languageId);
        }
        getMimeType(languageId) {
            return this._registry.getMimeType(languageId);
        }
        getIcon(languageId) {
            return this._registry.getIcon(languageId);
        }
        getExtensions(languageId) {
            return this._registry.getExtensions(languageId);
        }
        getFilenames(languageId) {
            return this._registry.getFilenames(languageId);
        }
        getConfigurationFiles(languageId) {
            return this._registry.getConfigurationFiles(languageId);
        }
        getLanguageIdByLanguageName(languageName) {
            return this._registry.getLanguageIdByLanguageName(languageName);
        }
        getLanguageIdByMimeType(mimeType) {
            return this._registry.getLanguageIdByMimeType(mimeType);
        }
        guessLanguageIdByFilepathOrFirstLine(resource, firstLine) {
            const languageIds = this._registry.guessLanguageIdByFilepathOrFirstLine(resource, firstLine);
            return (0, arrays_1.firstOrDefault)(languageIds, null);
        }
        createById(languageId) {
            return new LanguageSelection(this.onDidChange, () => {
                return this._createAndGetLanguageIdentifier(languageId);
            });
        }
        createByMimeType(mimeType) {
            return new LanguageSelection(this.onDidChange, () => {
                const languageId = this.getLanguageIdByMimeType(mimeType);
                return this._createAndGetLanguageIdentifier(languageId);
            });
        }
        createByFilepathOrFirstLine(resource, firstLine) {
            return new LanguageSelection(this.onDidChange, () => {
                const languageId = this.guessLanguageIdByFilepathOrFirstLine(resource, firstLine);
                return this._createAndGetLanguageIdentifier(languageId);
            });
        }
        _createAndGetLanguageIdentifier(languageId) {
            if (!languageId || !this.isRegisteredLanguageId(languageId)) {
                // Fall back to plain text if language is unknown
                languageId = modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            }
            if (!this._encounteredLanguages.has(languageId)) {
                this._encounteredLanguages.add(languageId);
                // Ensure tokenizers are created
                languages_1.TokenizationRegistry.getOrCreate(languageId);
                // Fire event
                this._onDidEncounterLanguage.fire(languageId);
            }
            return languageId;
        }
    }
    exports.LanguageService = LanguageService;
    LanguageService.instanceCount = 0;
    class LanguageSelection {
        constructor(_onDidChangeLanguages, _selector) {
            this._onDidChangeLanguages = _onDidChangeLanguages;
            this._selector = _selector;
            this._listener = null;
            this._emitter = null;
            this.languageId = this._selector();
        }
        _dispose() {
            if (this._listener) {
                this._listener.dispose();
                this._listener = null;
            }
            if (this._emitter) {
                this._emitter.dispose();
                this._emitter = null;
            }
        }
        get onDidChange() {
            if (!this._listener) {
                this._listener = this._onDidChangeLanguages(() => this._evaluate());
            }
            if (!this._emitter) {
                this._emitter = new event_1.Emitter({
                    onLastListenerRemove: () => {
                        this._dispose();
                    }
                });
            }
            return this._emitter.event;
        }
        _evaluate() {
            const languageId = this._selector();
            if (languageId === this.languageId) {
                // no change
                return;
            }
            this.languageId = languageId;
            if (this._emitter) {
                this._emitter.fire(this.languageId);
            }
        }
    }
});
//# sourceMappingURL=languageService.js.map