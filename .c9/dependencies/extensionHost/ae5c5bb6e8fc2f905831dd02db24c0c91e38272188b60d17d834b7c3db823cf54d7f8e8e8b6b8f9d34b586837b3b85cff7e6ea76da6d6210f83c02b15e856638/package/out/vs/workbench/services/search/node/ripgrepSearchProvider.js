/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/workbench/services/search/node/ripgrepTextSearchEngine", "vs/platform/progress/common/progress", "vs/base/common/network"], function (require, exports, cancellation_1, ripgrepTextSearchEngine_1, progress_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RipgrepSearchProvider = void 0;
    class RipgrepSearchProvider {
        constructor(outputChannel) {
            this.outputChannel = outputChannel;
            this.inProgress = new Set();
            process.once('exit', () => this.dispose());
        }
        provideTextSearchResults(query, options, progress, token) {
            const engine = new ripgrepTextSearchEngine_1.RipgrepTextSearchEngine(this.outputChannel);
            if (options.folder.scheme === network_1.Schemas.vscodeUserData) {
                // Ripgrep search engine can only provide file-scheme results, but we want to use it to search some schemes that are backed by the filesystem, but with some other provider as the frontend,
                // case in point vscode-userdata. In these cases we translate the query to a file, and translate the results back to the frontend scheme.
                const translatedOptions = Object.assign(Object.assign({}, options), { folder: options.folder.with({ scheme: network_1.Schemas.file }) });
                const progressTranslator = new progress_1.Progress(data => progress.report(Object.assign(Object.assign({}, data), { uri: data.uri.with({ scheme: options.folder.scheme }) })));
                return this.withToken(token, token => engine.provideTextSearchResults(query, translatedOptions, progressTranslator, token));
            }
            else {
                return this.withToken(token, token => engine.provideTextSearchResults(query, options, progress, token));
            }
        }
        async withToken(token, fn) {
            const merged = mergedTokenSource(token);
            this.inProgress.add(merged);
            const result = await fn(merged.token);
            this.inProgress.delete(merged);
            return result;
        }
        dispose() {
            this.inProgress.forEach(engine => engine.cancel());
        }
    }
    exports.RipgrepSearchProvider = RipgrepSearchProvider;
    function mergedTokenSource(token) {
        const tokenSource = new cancellation_1.CancellationTokenSource();
        token.onCancellationRequested(() => tokenSource.cancel());
        return tokenSource;
    }
});
//# sourceMappingURL=ripgrepSearchProvider.js.map