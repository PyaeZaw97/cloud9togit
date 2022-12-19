/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/editor/common/services/languageFeatures"], function (require, exports, cancellation_1, errors_1, uri_1, range_1, model_1, commands_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getColorPresentations = exports.getColors = void 0;
    function getColors(registry, model, token) {
        const colors = [];
        const providers = registry.ordered(model).reverse();
        const promises = providers.map(provider => Promise.resolve(provider.provideDocumentColors(model, token)).then(result => {
            if (Array.isArray(result)) {
                for (let colorInfo of result) {
                    colors.push({ colorInfo, provider });
                }
            }
        }));
        return Promise.all(promises).then(() => colors);
    }
    exports.getColors = getColors;
    function getColorPresentations(model, colorInfo, provider, token) {
        return Promise.resolve(provider.provideColorPresentations(model, colorInfo, token));
    }
    exports.getColorPresentations = getColorPresentations;
    commands_1.CommandsRegistry.registerCommand('_executeDocumentColorProvider', function (accessor, ...args) {
        const [resource] = args;
        if (!(resource instanceof uri_1.URI)) {
            throw (0, errors_1.illegalArgument)();
        }
        const { colorProvider: colorProviderRegistry } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(resource);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const rawCIs = [];
        const providers = colorProviderRegistry.ordered(model).reverse();
        const promises = providers.map(provider => Promise.resolve(provider.provideDocumentColors(model, cancellation_1.CancellationToken.None)).then(result => {
            if (Array.isArray(result)) {
                for (let ci of result) {
                    rawCIs.push({ range: ci.range, color: [ci.color.red, ci.color.green, ci.color.blue, ci.color.alpha] });
                }
            }
        }));
        return Promise.all(promises).then(() => rawCIs);
    });
    commands_1.CommandsRegistry.registerCommand('_executeColorPresentationProvider', function (accessor, ...args) {
        const [color, context] = args;
        const { uri, range } = context;
        if (!(uri instanceof uri_1.URI) || !Array.isArray(color) || color.length !== 4 || !range_1.Range.isIRange(range)) {
            throw (0, errors_1.illegalArgument)();
        }
        const [red, green, blue, alpha] = color;
        const { colorProvider: colorProviderRegistry } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const colorInfo = {
            range,
            color: { red, green, blue, alpha }
        };
        const presentations = [];
        const providers = colorProviderRegistry.ordered(model).reverse();
        const promises = providers.map(provider => Promise.resolve(provider.provideColorPresentations(model, colorInfo, cancellation_1.CancellationToken.None)).then(result => {
            if (Array.isArray(result)) {
                presentations.push(...result);
            }
        }));
        return Promise.all(promises).then(() => presentations);
    });
});
//# sourceMappingURL=color.js.map