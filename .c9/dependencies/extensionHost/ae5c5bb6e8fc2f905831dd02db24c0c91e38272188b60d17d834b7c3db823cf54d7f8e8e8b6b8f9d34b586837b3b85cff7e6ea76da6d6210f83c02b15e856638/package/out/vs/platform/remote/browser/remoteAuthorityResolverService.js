/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network"], function (require, exports, event_1, lifecycle_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverService = void 0;
    class RemoteAuthorityResolverService extends lifecycle_1.Disposable {
        constructor(connectionToken, resourceUriProvider) {
            super();
            this._onDidChangeConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeConnectionData = this._onDidChangeConnectionData.event;
            this._cache = new Map();
            this._connectionToken = connectionToken;
            this._connectionTokens = new Map();
            if (resourceUriProvider) {
                network_1.RemoteAuthorities.setDelegate(resourceUriProvider);
            }
        }
        async resolveAuthority(authority) {
            if (!this._cache.has(authority)) {
                const result = this._doResolveAuthority(authority);
                network_1.RemoteAuthorities.set(authority, result.authority.host, result.authority.port);
                this._cache.set(authority, result);
                this._onDidChangeConnectionData.fire();
            }
            return this._cache.get(authority);
        }
        async getCanonicalURI(uri) {
            return uri;
        }
        getConnectionData(authority) {
            if (!this._cache.has(authority)) {
                return null;
            }
            const resolverResult = this._cache.get(authority);
            const connectionToken = this._connectionTokens.get(authority) || this._connectionToken;
            return {
                host: resolverResult.authority.host,
                port: resolverResult.authority.port,
                connectionToken: connectionToken
            };
        }
        _doResolveAuthority(authority) {
            const connectionToken = this._connectionTokens.get(authority) || this._connectionToken;
            if (authority.indexOf(':') >= 0) {
                const pieces = authority.split(':');
                return { authority: { authority, host: pieces[0], port: parseInt(pieces[1], 10), connectionToken } };
            }
            const port = (/^https:/.test(window.location.href) ? 443 : 80);
            return { authority: { authority, host: authority, port: port, connectionToken } };
        }
        _clearResolvedAuthority(authority) {
        }
        _setResolvedAuthority(resolvedAuthority) {
        }
        _setResolvedAuthorityError(authority, err) {
        }
        _setAuthorityConnectionToken(authority, connectionToken) {
            this._connectionTokens.set(authority, connectionToken);
            network_1.RemoteAuthorities.setConnectionToken(authority, connectionToken);
            this._onDidChangeConnectionData.fire();
        }
        _setCanonicalURIProvider(provider) {
        }
    }
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService;
});
//# sourceMappingURL=remoteAuthorityResolverService.js.map