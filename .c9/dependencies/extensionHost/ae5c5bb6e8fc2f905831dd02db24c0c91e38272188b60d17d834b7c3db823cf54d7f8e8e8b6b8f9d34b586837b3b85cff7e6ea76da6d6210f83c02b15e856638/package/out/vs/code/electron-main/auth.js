/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "electron", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/platform/credentials/common/credentials", "vs/platform/encryption/common/encryptionService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, cancellation_1, event_1, hash_1, lifecycle_1, uuid_1, credentials_1, encryptionService_1, log_1, productService_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProxyAuthHandler = void 0;
    var ProxyAuthState;
    (function (ProxyAuthState) {
        /**
         * Initial state: we will try to use stored credentials
         * first to reply to the auth challenge.
         */
        ProxyAuthState[ProxyAuthState["Initial"] = 1] = "Initial";
        /**
         * We used stored credentials and are still challenged,
         * so we will show a login dialog next.
         */
        ProxyAuthState[ProxyAuthState["StoredCredentialsUsed"] = 2] = "StoredCredentialsUsed";
        /**
         * Finally, if we showed a login dialog already, we will
         * not show any more login dialogs until restart to reduce
         * the UI noise.
         */
        ProxyAuthState[ProxyAuthState["LoginDialogShown"] = 3] = "LoginDialogShown";
    })(ProxyAuthState || (ProxyAuthState = {}));
    let ProxyAuthHandler = class ProxyAuthHandler extends lifecycle_1.Disposable {
        constructor(logService, windowsMainService, credentialsService, encryptionMainService, productService) {
            super();
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.credentialsService = credentialsService;
            this.encryptionMainService = encryptionMainService;
            this.productService = productService;
            this.PROXY_CREDENTIALS_SERVICE_KEY = `${this.productService.urlProtocol}.proxy-credentials`;
            this.pendingProxyResolve = undefined;
            this.state = ProxyAuthState.Initial;
            this.sessionCredentials = undefined;
            this.registerListeners();
        }
        registerListeners() {
            const onLogin = event_1.Event.fromNodeEventEmitter(electron_1.app, 'login', (event, webContents, req, authInfo, callback) => ({ event, webContents, req, authInfo, callback }));
            this._register(onLogin(this.onLogin, this));
        }
        async onLogin({ event, authInfo, req, callback }) {
            if (!authInfo.isProxy) {
                return; // only for proxy
            }
            if (!this.pendingProxyResolve && this.state === ProxyAuthState.LoginDialogShown && req.firstAuthAttempt) {
                this.logService.trace('auth#onLogin (proxy) - exit - proxy dialog already shown');
                return; // only one dialog per session at max (except when firstAuthAttempt: false which indicates a login problem)
            }
            // Signal we handle this event on our own, otherwise
            // Electron will ignore our provided credentials.
            event.preventDefault();
            let credentials = undefined;
            if (!this.pendingProxyResolve) {
                this.logService.trace('auth#onLogin (proxy) - no pending proxy handling found, starting new');
                this.pendingProxyResolve = this.resolveProxyCredentials(authInfo);
                try {
                    credentials = await this.pendingProxyResolve;
                }
                finally {
                    this.pendingProxyResolve = undefined;
                }
            }
            else {
                this.logService.trace('auth#onLogin (proxy) - pending proxy handling found');
                credentials = await this.pendingProxyResolve;
            }
            // According to Electron docs, it is fine to call back without
            // username or password to signal that the authentication was handled
            // by us, even though without having credentials received:
            //
            // > If `callback` is called without a username or password, the authentication
            // > request will be cancelled and the authentication error will be returned to the
            // > page.
            callback(credentials === null || credentials === void 0 ? void 0 : credentials.username, credentials === null || credentials === void 0 ? void 0 : credentials.password);
        }
        async resolveProxyCredentials(authInfo) {
            this.logService.trace('auth#resolveProxyCredentials (proxy) - enter');
            try {
                const credentials = await this.doResolveProxyCredentials(authInfo);
                if (credentials) {
                    this.logService.trace('auth#resolveProxyCredentials (proxy) - got credentials');
                    return credentials;
                }
                else {
                    this.logService.trace('auth#resolveProxyCredentials (proxy) - did not get credentials');
                }
            }
            finally {
                this.logService.trace('auth#resolveProxyCredentials (proxy) - exit');
            }
            return undefined;
        }
        async doResolveProxyCredentials(authInfo) {
            var _a, _b, _c, _d;
            this.logService.trace('auth#doResolveProxyCredentials - enter', authInfo);
            // Compute a hash over the authentication info to be used
            // with the credentials store to return the right credentials
            // given the properties of the auth request
            // (see https://github.com/microsoft/vscode/issues/109497)
            const authInfoHash = String((0, hash_1.hash)({ scheme: authInfo.scheme, host: authInfo.host, port: authInfo.port }));
            // Find any previously stored credentials
            let storedUsername = undefined;
            let storedPassword = undefined;
            try {
                const encryptedSerializedProxyCredentials = await this.credentialsService.getPassword(this.PROXY_CREDENTIALS_SERVICE_KEY, authInfoHash);
                if (encryptedSerializedProxyCredentials) {
                    const credentials = JSON.parse(await this.encryptionMainService.decrypt(encryptedSerializedProxyCredentials));
                    storedUsername = credentials.username;
                    storedPassword = credentials.password;
                }
            }
            catch (error) {
                this.logService.error(error); // handle errors by asking user for login via dialog
            }
            // Reply with stored credentials unless we used them already.
            // In that case we need to show a login dialog again because
            // they seem invalid.
            if (this.state !== ProxyAuthState.StoredCredentialsUsed && typeof storedUsername === 'string' && typeof storedPassword === 'string') {
                this.logService.trace('auth#doResolveProxyCredentials (proxy) - exit - found stored credentials to use');
                this.state = ProxyAuthState.StoredCredentialsUsed;
                return { username: storedUsername, password: storedPassword };
            }
            // Find suitable window to show dialog: prefer to show it in the
            // active window because any other network request will wait on
            // the credentials and we want the user to present the dialog.
            const window = this.windowsMainService.getFocusedWindow() || this.windowsMainService.getLastActiveWindow();
            if (!window) {
                this.logService.trace('auth#doResolveProxyCredentials (proxy) - exit - no opened window found to show dialog in');
                return undefined; // unexpected
            }
            this.logService.trace(`auth#doResolveProxyCredentials (proxy) - asking window ${window.id} to handle proxy login`);
            // Open proxy dialog
            const payload = {
                authInfo,
                username: (_b = (_a = this.sessionCredentials) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : storedUsername,
                password: (_d = (_c = this.sessionCredentials) === null || _c === void 0 ? void 0 : _c.password) !== null && _d !== void 0 ? _d : storedPassword,
                replyChannel: `vscode:proxyAuthResponse:${(0, uuid_1.generateUuid)()}`
            };
            window.sendWhenReady('vscode:openProxyAuthenticationDialog', cancellation_1.CancellationToken.None, payload);
            this.state = ProxyAuthState.LoginDialogShown;
            // Handle reply
            const loginDialogCredentials = await new Promise(resolve => {
                var _a;
                const proxyAuthResponseHandler = async (event, channel, reply /* canceled */) => {
                    var _a;
                    if (channel === payload.replyChannel) {
                        this.logService.trace(`auth#doResolveProxyCredentials - exit - received credentials from window ${window.id}`);
                        (_a = window.win) === null || _a === void 0 ? void 0 : _a.webContents.off('ipc-message', proxyAuthResponseHandler);
                        // We got credentials from the window
                        if (reply) {
                            const credentials = { username: reply.username, password: reply.password };
                            // Update stored credentials based on `remember` flag
                            try {
                                if (reply.remember) {
                                    const encryptedSerializedCredentials = await this.encryptionMainService.encrypt(JSON.stringify(credentials));
                                    await this.credentialsService.setPassword(this.PROXY_CREDENTIALS_SERVICE_KEY, authInfoHash, encryptedSerializedCredentials);
                                }
                                else {
                                    await this.credentialsService.deletePassword(this.PROXY_CREDENTIALS_SERVICE_KEY, authInfoHash);
                                }
                            }
                            catch (error) {
                                this.logService.error(error); // handle gracefully
                            }
                            resolve({ username: credentials.username, password: credentials.password });
                        }
                        // We did not get any credentials from the window (e.g. cancelled)
                        else {
                            resolve(undefined);
                        }
                    }
                };
                (_a = window.win) === null || _a === void 0 ? void 0 : _a.webContents.on('ipc-message', proxyAuthResponseHandler);
            });
            // Remember credentials for the session in case
            // the credentials are wrong and we show the dialog
            // again
            this.sessionCredentials = loginDialogCredentials;
            return loginDialogCredentials;
        }
    };
    ProxyAuthHandler = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, credentials_1.ICredentialsMainService),
        __param(3, encryptionService_1.IEncryptionMainService),
        __param(4, productService_1.IProductService)
    ], ProxyAuthHandler);
    exports.ProxyAuthHandler = ProxyAuthHandler;
});
//# sourceMappingURL=auth.js.map