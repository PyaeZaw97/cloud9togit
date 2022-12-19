/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, event_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewViewService = exports.IWebviewViewService = void 0;
    exports.IWebviewViewService = (0, instantiation_1.createDecorator)('webviewViewService');
    class WebviewViewService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._resolvers = new Map();
            this._awaitingRevival = new Map();
            this._onNewResolverRegistered = this._register(new event_1.Emitter());
            this.onNewResolverRegistered = this._onNewResolverRegistered.event;
        }
        register(viewType, resolver) {
            if (this._resolvers.has(viewType)) {
                throw new Error(`View resolver already registered for ${viewType}`);
            }
            this._resolvers.set(viewType, resolver);
            this._onNewResolverRegistered.fire({ viewType: viewType });
            const pending = this._awaitingRevival.get(viewType);
            if (pending) {
                resolver.resolve(pending.webview, cancellation_1.CancellationToken.None).then(() => {
                    this._awaitingRevival.delete(viewType);
                    pending.resolve();
                });
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this._resolvers.delete(viewType);
            });
        }
        resolve(viewType, webview, cancellation) {
            const resolver = this._resolvers.get(viewType);
            if (!resolver) {
                if (this._awaitingRevival.has(viewType)) {
                    throw new Error('View already awaiting revival');
                }
                let resolve;
                const p = new Promise(r => resolve = r);
                this._awaitingRevival.set(viewType, { webview, resolve: resolve });
                return p;
            }
            return resolver.resolve(webview, cancellation);
        }
    }
    exports.WebviewViewService = WebviewViewService;
});
//# sourceMappingURL=webviewViewService.js.map