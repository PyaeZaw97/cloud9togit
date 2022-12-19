define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network"], function (require, exports, errors, event_1, lifecycle_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverService = void 0;
    class PendingPromise {
        constructor(request) {
            this.input = request;
            this.promise = new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
            this.result = null;
        }
        resolve(result) {
            this.result = result;
            this._resolve(this.result);
        }
        reject(err) {
            this._reject(err);
        }
    }
    class RemoteAuthorityResolverService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChangeConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeConnectionData = this._onDidChangeConnectionData.event;
            this._resolveAuthorityRequests = new Map();
            this._connectionTokens = new Map();
            this._canonicalURIRequests = new Map();
            this._canonicalURIProvider = null;
        }
        resolveAuthority(authority) {
            if (!this._resolveAuthorityRequests.has(authority)) {
                this._resolveAuthorityRequests.set(authority, new PendingPromise(authority));
            }
            return this._resolveAuthorityRequests.get(authority).promise;
        }
        async getCanonicalURI(uri) {
            const key = uri.toString();
            if (!this._canonicalURIRequests.has(key)) {
                const request = new PendingPromise(uri);
                if (this._canonicalURIProvider) {
                    this._canonicalURIProvider(request.input).then((uri) => request.resolve(uri), (err) => request.reject(err));
                }
                this._canonicalURIRequests.set(key, request);
            }
            return this._canonicalURIRequests.get(key).promise;
        }
        getConnectionData(authority) {
            if (!this._resolveAuthorityRequests.has(authority)) {
                return null;
            }
            const request = this._resolveAuthorityRequests.get(authority);
            if (!request.result) {
                return null;
            }
            const connectionToken = this._connectionTokens.get(authority);
            return {
                host: request.result.authority.host,
                port: request.result.authority.port,
                connectionToken: connectionToken
            };
        }
        _clearResolvedAuthority(authority) {
            if (this._resolveAuthorityRequests.has(authority)) {
                this._resolveAuthorityRequests.get(authority).reject(errors.canceled());
                this._resolveAuthorityRequests.delete(authority);
            }
        }
        _setResolvedAuthority(resolvedAuthority, options) {
            if (this._resolveAuthorityRequests.has(resolvedAuthority.authority)) {
                const request = this._resolveAuthorityRequests.get(resolvedAuthority.authority);
                network_1.RemoteAuthorities.set(resolvedAuthority.authority, resolvedAuthority.host, resolvedAuthority.port);
                if (resolvedAuthority.connectionToken) {
                    network_1.RemoteAuthorities.setConnectionToken(resolvedAuthority.authority, resolvedAuthority.connectionToken);
                }
                request.resolve({ authority: resolvedAuthority, options });
                this._onDidChangeConnectionData.fire();
            }
        }
        _setResolvedAuthorityError(authority, err) {
            if (this._resolveAuthorityRequests.has(authority)) {
                const request = this._resolveAuthorityRequests.get(authority);
                // Avoid that this error makes it to telemetry
                request.reject(errors.ErrorNoTelemetry.fromError(err));
            }
        }
        _setAuthorityConnectionToken(authority, connectionToken) {
            this._connectionTokens.set(authority, connectionToken);
            network_1.RemoteAuthorities.setConnectionToken(authority, connectionToken);
            this._onDidChangeConnectionData.fire();
        }
        _setCanonicalURIProvider(provider) {
            this._canonicalURIProvider = provider;
            this._canonicalURIRequests.forEach((value) => {
                this._canonicalURIProvider(value.input).then((uri) => value.resolve(uri), (err) => value.reject(err));
            });
        }
    }
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService;
});
//# sourceMappingURL=remoteAuthorityResolverService.js.map