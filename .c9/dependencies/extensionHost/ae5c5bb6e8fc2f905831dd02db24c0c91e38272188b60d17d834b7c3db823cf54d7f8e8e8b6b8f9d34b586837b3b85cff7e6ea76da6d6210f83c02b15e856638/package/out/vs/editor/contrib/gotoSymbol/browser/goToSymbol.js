/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/contrib/gotoSymbol/browser/referencesModel", "vs/editor/common/services/languageFeatures"], function (require, exports, cancellation_1, errors_1, editorExtensions_1, referencesModel_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getReferencesAtPosition = exports.getTypeDefinitionsAtPosition = exports.getImplementationsAtPosition = exports.getDeclarationsAtPosition = exports.getDefinitionsAtPosition = void 0;
    function getLocationLinks(model, position, registry, provide) {
        const provider = registry.ordered(model);
        // get results
        const promises = provider.map((provider) => {
            return Promise.resolve(provide(provider, model, position)).then(undefined, err => {
                (0, errors_1.onUnexpectedExternalError)(err);
                return undefined;
            });
        });
        return Promise.all(promises).then(values => {
            const result = [];
            for (let value of values) {
                if (Array.isArray(value)) {
                    result.push(...value);
                }
                else if (value) {
                    result.push(value);
                }
            }
            return result;
        });
    }
    function getDefinitionsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideDefinition(model, position, token);
        });
    }
    exports.getDefinitionsAtPosition = getDefinitionsAtPosition;
    function getDeclarationsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideDeclaration(model, position, token);
        });
    }
    exports.getDeclarationsAtPosition = getDeclarationsAtPosition;
    function getImplementationsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideImplementation(model, position, token);
        });
    }
    exports.getImplementationsAtPosition = getImplementationsAtPosition;
    function getTypeDefinitionsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideTypeDefinition(model, position, token);
        });
    }
    exports.getTypeDefinitionsAtPosition = getTypeDefinitionsAtPosition;
    function getReferencesAtPosition(registry, model, position, compact, token) {
        return getLocationLinks(model, position, registry, async (provider, model, position) => {
            const result = await provider.provideReferences(model, position, { includeDeclaration: true }, token);
            if (!compact || !result || result.length !== 2) {
                return result;
            }
            const resultWithoutDeclaration = await provider.provideReferences(model, position, { includeDeclaration: false }, token);
            if (resultWithoutDeclaration && resultWithoutDeclaration.length === 1) {
                return resultWithoutDeclaration;
            }
            return result;
        });
    }
    exports.getReferencesAtPosition = getReferencesAtPosition;
    // -- API commands ----
    async function _sortedAndDeduped(callback) {
        const rawLinks = await callback();
        const model = new referencesModel_1.ReferencesModel(rawLinks, '');
        const modelLinks = model.references.map(ref => ref.link);
        model.dispose();
        return modelLinks;
    }
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDefinitionProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getDefinitionsAtPosition(languageFeaturesService.definitionProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeTypeDefinitionProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getTypeDefinitionsAtPosition(languageFeaturesService.typeDefinitionProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDeclarationProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getDeclarationsAtPosition(languageFeaturesService.declarationProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeReferenceProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getReferencesAtPosition(languageFeaturesService.referenceProvider, model, position, false, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeImplementationProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getImplementationsAtPosition(languageFeaturesService.implementationProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
});
//# sourceMappingURL=goToSymbol.js.map