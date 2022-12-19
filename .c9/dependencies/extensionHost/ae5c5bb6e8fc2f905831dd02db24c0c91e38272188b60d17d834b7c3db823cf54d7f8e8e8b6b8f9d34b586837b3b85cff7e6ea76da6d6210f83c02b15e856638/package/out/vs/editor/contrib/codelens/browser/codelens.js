/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/editor/common/services/languageFeatures"], function (require, exports, cancellation_1, errors_1, lifecycle_1, types_1, uri_1, model_1, commands_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCodeLensModel = exports.CodeLensModel = void 0;
    class CodeLensModel {
        constructor() {
            this.lenses = [];
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        get isDisposed() {
            return this._disposables.isDisposed;
        }
        add(list, provider) {
            this._disposables.add(list);
            for (const symbol of list.lenses) {
                this.lenses.push({ symbol, provider });
            }
        }
    }
    exports.CodeLensModel = CodeLensModel;
    async function getCodeLensModel(registry, model, token) {
        const provider = registry.ordered(model);
        const providerRanks = new Map();
        const result = new CodeLensModel();
        const promises = provider.map(async (provider, i) => {
            providerRanks.set(provider, i);
            try {
                const list = await Promise.resolve(provider.provideCodeLenses(model, token));
                if (list) {
                    result.add(list, provider);
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
        });
        await Promise.all(promises);
        result.lenses = result.lenses.sort((a, b) => {
            // sort by lineNumber, provider-rank, and column
            if (a.symbol.range.startLineNumber < b.symbol.range.startLineNumber) {
                return -1;
            }
            else if (a.symbol.range.startLineNumber > b.symbol.range.startLineNumber) {
                return 1;
            }
            else if ((providerRanks.get(a.provider)) < (providerRanks.get(b.provider))) {
                return -1;
            }
            else if ((providerRanks.get(a.provider)) > (providerRanks.get(b.provider))) {
                return 1;
            }
            else if (a.symbol.range.startColumn < b.symbol.range.startColumn) {
                return -1;
            }
            else if (a.symbol.range.startColumn > b.symbol.range.startColumn) {
                return 1;
            }
            else {
                return 0;
            }
        });
        return result;
    }
    exports.getCodeLensModel = getCodeLensModel;
    commands_1.CommandsRegistry.registerCommand('_executeCodeLensProvider', function (accessor, ...args) {
        let [uri, itemResolveCount] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(typeof itemResolveCount === 'number' || !itemResolveCount);
        const { codeLensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const result = [];
        const disposables = new lifecycle_1.DisposableStore();
        return getCodeLensModel(codeLensProvider, model, cancellation_1.CancellationToken.None).then(value => {
            disposables.add(value);
            let resolve = [];
            for (const item of value.lenses) {
                if (itemResolveCount === undefined || itemResolveCount === null || Boolean(item.symbol.command)) {
                    result.push(item.symbol);
                }
                else if (itemResolveCount-- > 0 && item.provider.resolveCodeLens) {
                    resolve.push(Promise.resolve(item.provider.resolveCodeLens(model, item.symbol, cancellation_1.CancellationToken.None)).then(symbol => result.push(symbol || item.symbol)));
                }
            }
            return Promise.all(resolve);
        }).then(() => {
            return result;
        }).finally(() => {
            // make sure to return results, then (on next tick)
            // dispose the results
            setTimeout(() => disposables.dispose(), 100);
        });
    });
});
//# sourceMappingURL=codelens.js.map