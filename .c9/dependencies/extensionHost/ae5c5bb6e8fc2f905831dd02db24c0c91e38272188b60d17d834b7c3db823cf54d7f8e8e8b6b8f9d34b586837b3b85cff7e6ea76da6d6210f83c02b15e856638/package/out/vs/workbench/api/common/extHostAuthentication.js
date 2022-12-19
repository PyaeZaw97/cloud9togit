/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/extensions/common/extensions"], function (require, exports, event_1, extHost_protocol_1, extHostTypes_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostAuthentication = void 0;
    class ExtHostAuthentication {
        constructor(mainContext) {
            this._authenticationProviders = new Map();
            this._providers = [];
            this._onDidChangeSessions = new event_1.Emitter();
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._inFlightRequests = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadAuthentication);
        }
        $setProviders(providers) {
            this._providers = providers;
            return Promise.resolve();
        }
        async getSession(requestingExtension, providerId, scopes, options = {}) {
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            const inFlightRequests = this._inFlightRequests.get(extensionId) || [];
            const sortedScopes = [...scopes].sort().join(' ');
            let inFlightRequest = inFlightRequests.find(request => request.scopes === sortedScopes);
            if (inFlightRequest) {
                return inFlightRequest.result;
            }
            else {
                const session = this._getSession(requestingExtension, extensionId, providerId, scopes, options);
                inFlightRequest = {
                    scopes: sortedScopes,
                    result: session
                };
                inFlightRequests.push(inFlightRequest);
                this._inFlightRequests.set(extensionId, inFlightRequests);
                try {
                    await session;
                }
                finally {
                    const requestIndex = inFlightRequests.findIndex(request => request.scopes === sortedScopes);
                    if (requestIndex > -1) {
                        inFlightRequests.splice(requestIndex);
                        this._inFlightRequests.set(extensionId, inFlightRequests);
                    }
                }
                return session;
            }
        }
        async _getSession(requestingExtension, extensionId, providerId, scopes, options = {}) {
            await this._proxy.$ensureProvider(providerId);
            const extensionName = requestingExtension.displayName || requestingExtension.name;
            return this._proxy.$getSession(providerId, scopes, extensionId, extensionName, options);
        }
        async removeSession(providerId, sessionId) {
            const providerData = this._authenticationProviders.get(providerId);
            if (!providerData) {
                return this._proxy.$removeSession(providerId, sessionId);
            }
            return providerData.provider.removeSession(sessionId);
        }
        registerAuthenticationProvider(id, label, provider, options) {
            var _a;
            if (this._authenticationProviders.get(id)) {
                throw new Error(`An authentication provider with id '${id}' is already registered.`);
            }
            this._authenticationProviders.set(id, { label, provider, options: options !== null && options !== void 0 ? options : { supportsMultipleAccounts: false } });
            if (!this._providers.find(p => p.id === id)) {
                this._providers.push({
                    id: id,
                    label: label
                });
            }
            const listener = provider.onDidChangeSessions(e => {
                var _a, _b, _c;
                this._proxy.$sendDidChangeSessions(id, {
                    added: (_a = e.added) !== null && _a !== void 0 ? _a : [],
                    changed: (_b = e.changed) !== null && _b !== void 0 ? _b : [],
                    removed: (_c = e.removed) !== null && _c !== void 0 ? _c : []
                });
            });
            this._proxy.$registerAuthenticationProvider(id, label, (_a = options === null || options === void 0 ? void 0 : options.supportsMultipleAccounts) !== null && _a !== void 0 ? _a : false);
            return new extHostTypes_1.Disposable(() => {
                listener.dispose();
                this._authenticationProviders.delete(id);
                const i = this._providers.findIndex(p => p.id === id);
                if (i > -1) {
                    this._providers.splice(i);
                }
                this._proxy.$unregisterAuthenticationProvider(id);
            });
        }
        $createSession(providerId, scopes) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.createSession(scopes));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $removeSession(providerId, sessionId) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.removeSession(sessionId));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $getSessions(providerId, scopes) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.getSessions(scopes));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $onDidChangeAuthenticationSessions(id, label) {
            this._onDidChangeSessions.fire({ provider: { id, label } });
            return Promise.resolve();
        }
    }
    exports.ExtHostAuthentication = ExtHostAuthentication;
});
//# sourceMappingURL=extHostAuthentication.js.map