/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/editor/common/services/semanticTokensDto", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures"], function (require, exports, cancellation_1, errors_1, uri_1, model_1, commands_1, types_1, semanticTokensDto_1, range_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDocumentRangeSemanticTokens = exports.hasDocumentRangeSemanticTokensProvider = exports.getDocumentSemanticTokens = exports.hasDocumentSemanticTokensProvider = exports.DocumentSemanticTokensResult = exports.isSemanticTokensEdits = exports.isSemanticTokens = void 0;
    function isSemanticTokens(v) {
        return v && !!(v.data);
    }
    exports.isSemanticTokens = isSemanticTokens;
    function isSemanticTokensEdits(v) {
        return v && Array.isArray(v.edits);
    }
    exports.isSemanticTokensEdits = isSemanticTokensEdits;
    class DocumentSemanticTokensResult {
        constructor(provider, tokens, error) {
            this.provider = provider;
            this.tokens = tokens;
            this.error = error;
        }
    }
    exports.DocumentSemanticTokensResult = DocumentSemanticTokensResult;
    function hasDocumentSemanticTokensProvider(registry, model) {
        return registry.has(model);
    }
    exports.hasDocumentSemanticTokensProvider = hasDocumentSemanticTokensProvider;
    function getDocumentSemanticTokensProviders(registry, model) {
        const groups = registry.orderedGroups(model);
        return (groups.length > 0 ? groups[0] : []);
    }
    async function getDocumentSemanticTokens(registry, model, lastProvider, lastResultId, token) {
        const providers = getDocumentSemanticTokensProviders(registry, model);
        // Get tokens from all providers at the same time.
        const results = await Promise.all(providers.map(async (provider) => {
            let result;
            let error = null;
            try {
                result = await provider.provideDocumentSemanticTokens(model, (provider === lastProvider ? lastResultId : null), token);
            }
            catch (err) {
                error = err;
                result = null;
            }
            if (!result || (!isSemanticTokens(result) && !isSemanticTokensEdits(result))) {
                result = null;
            }
            return new DocumentSemanticTokensResult(provider, result, error);
        }));
        // Try to return the first result with actual tokens or
        // the first result which threw an error (!!)
        for (const result of results) {
            if (result.error) {
                throw result.error;
            }
            if (result.tokens) {
                return result;
            }
        }
        // Return the first result, even if it doesn't have tokens
        if (results.length > 0) {
            return results[0];
        }
        return null;
    }
    exports.getDocumentSemanticTokens = getDocumentSemanticTokens;
    function _getDocumentSemanticTokensProviderHighestGroup(registry, model) {
        const result = registry.orderedGroups(model);
        return (result.length > 0 ? result[0] : null);
    }
    class DocumentRangeSemanticTokensResult {
        constructor(provider, tokens) {
            this.provider = provider;
            this.tokens = tokens;
        }
    }
    function hasDocumentRangeSemanticTokensProvider(providers, model) {
        return providers.has(model);
    }
    exports.hasDocumentRangeSemanticTokensProvider = hasDocumentRangeSemanticTokensProvider;
    function getDocumentRangeSemanticTokensProviders(providers, model) {
        const groups = providers.orderedGroups(model);
        return (groups.length > 0 ? groups[0] : []);
    }
    async function getDocumentRangeSemanticTokens(registry, model, range, token) {
        const providers = getDocumentRangeSemanticTokensProviders(registry, model);
        // Get tokens from all providers at the same time.
        const results = await Promise.all(providers.map(async (provider) => {
            let result;
            try {
                result = await provider.provideDocumentRangeSemanticTokens(model, range, token);
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
                result = null;
            }
            if (!result || !isSemanticTokens(result)) {
                result = null;
            }
            return new DocumentRangeSemanticTokensResult(provider, result);
        }));
        // Try to return the first result with actual tokens
        for (const result of results) {
            if (result.tokens) {
                return result;
            }
        }
        // Return the first result, even if it doesn't have tokens
        if (results.length > 0) {
            return results[0];
        }
        return null;
    }
    exports.getDocumentRangeSemanticTokens = getDocumentRangeSemanticTokens;
    commands_1.CommandsRegistry.registerCommand('_provideDocumentSemanticTokensLegend', async (accessor, ...args) => {
        const [uri] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const providers = _getDocumentSemanticTokensProviderHighestGroup(documentSemanticTokensProvider, model);
        if (!providers) {
            // there is no provider => fall back to a document range semantic tokens provider
            return accessor.get(commands_1.ICommandService).executeCommand('_provideDocumentRangeSemanticTokensLegend', uri);
        }
        return providers[0].getLegend();
    });
    commands_1.CommandsRegistry.registerCommand('_provideDocumentSemanticTokens', async (accessor, ...args) => {
        const [uri] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        if (!hasDocumentSemanticTokensProvider(documentSemanticTokensProvider, model)) {
            // there is no provider => fall back to a document range semantic tokens provider
            return accessor.get(commands_1.ICommandService).executeCommand('_provideDocumentRangeSemanticTokens', uri, model.getFullModelRange());
        }
        const r = await getDocumentSemanticTokens(documentSemanticTokensProvider, model, null, null, cancellation_1.CancellationToken.None);
        if (!r) {
            return undefined;
        }
        const { provider, tokens } = r;
        if (!tokens || !isSemanticTokens(tokens)) {
            return undefined;
        }
        const buff = (0, semanticTokensDto_1.encodeSemanticTokensDto)({
            id: 0,
            type: 'full',
            data: tokens.data
        });
        if (tokens.resultId) {
            provider.releaseDocumentSemanticTokens(tokens.resultId);
        }
        return buff;
    });
    commands_1.CommandsRegistry.registerCommand('_provideDocumentRangeSemanticTokensLegend', async (accessor, ...args) => {
        const [uri, range] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentRangeSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const providers = getDocumentRangeSemanticTokensProviders(documentRangeSemanticTokensProvider, model);
        if (providers.length === 0) {
            // no providers
            return undefined;
        }
        if (providers.length === 1) {
            // straight forward case, just a single provider
            return providers[0].getLegend();
        }
        if (!range || !range_1.Range.isIRange(range)) {
            // if no range is provided, we cannot support multiple providers
            // as we cannot fall back to the one which would give results
            // => return the first legend for backwards compatibility and print a warning
            console.warn(`provideDocumentRangeSemanticTokensLegend might be out-of-sync with provideDocumentRangeSemanticTokens unless a range argument is passed in`);
            return providers[0].getLegend();
        }
        const result = await getDocumentRangeSemanticTokens(documentRangeSemanticTokensProvider, model, range_1.Range.lift(range), cancellation_1.CancellationToken.None);
        if (!result) {
            return undefined;
        }
        return result.provider.getLegend();
    });
    commands_1.CommandsRegistry.registerCommand('_provideDocumentRangeSemanticTokens', async (accessor, ...args) => {
        const [uri, range] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        (0, types_1.assertType)(range_1.Range.isIRange(range));
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentRangeSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const result = await getDocumentRangeSemanticTokens(documentRangeSemanticTokensProvider, model, range_1.Range.lift(range), cancellation_1.CancellationToken.None);
        if (!result || !result.tokens) {
            // there is no provider or it didn't return tokens
            return undefined;
        }
        return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
            id: 0,
            type: 'full',
            data: result.tokens.data
        });
    });
});
//# sourceMappingURL=getSemanticTokens.js.map