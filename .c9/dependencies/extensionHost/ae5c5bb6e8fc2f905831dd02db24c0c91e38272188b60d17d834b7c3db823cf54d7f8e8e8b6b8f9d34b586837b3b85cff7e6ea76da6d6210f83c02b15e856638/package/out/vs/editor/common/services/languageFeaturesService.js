/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languageFeatureRegistry", "vs/editor/common/services/languageFeatures", "vs/platform/instantiation/common/extensions"], function (require, exports, languageFeatureRegistry_1, languageFeatures_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageFeaturesService = void 0;
    class LanguageFeaturesService {
        constructor() {
            this.referenceProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.renameProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.codeActionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.definitionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.typeDefinitionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.declarationProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.implementationProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentSymbolProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlayHintsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.colorProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.codeLensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentRangeFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.onTypeFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.signatureHelpProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.hoverProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentHighlightProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.selectionRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.foldingRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.linkProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineCompletionsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.completionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.linkedEditingRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineValuesProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.evaluatableExpressionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentRangeSemanticTokensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentSemanticTokensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentOnDropEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
        }
        setNotebookTypeResolver(resolver) {
            this._notebookTypeResolver = resolver;
        }
        _score(uri) {
            var _a;
            return (_a = this._notebookTypeResolver) === null || _a === void 0 ? void 0 : _a.call(this, uri);
        }
    }
    exports.LanguageFeaturesService = LanguageFeaturesService;
    (0, extensions_1.registerSingleton)(languageFeatures_1.ILanguageFeaturesService, LanguageFeaturesService, true);
});
//# sourceMappingURL=languageFeaturesService.js.map