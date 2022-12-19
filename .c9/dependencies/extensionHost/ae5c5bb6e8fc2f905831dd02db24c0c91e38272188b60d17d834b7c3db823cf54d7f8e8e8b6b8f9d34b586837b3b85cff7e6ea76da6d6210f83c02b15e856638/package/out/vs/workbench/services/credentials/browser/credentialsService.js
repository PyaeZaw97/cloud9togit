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
define(["require", "exports", "vs/platform/credentials/common/credentials", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/product/common/productService", "vs/base/parts/ipc/common/ipc", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, credentials_1, environmentService_1, event_1, lifecycle_1, productService_1, ipc_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserCredentialsService = void 0;
    let BrowserCredentialsService = class BrowserCredentialsService extends lifecycle_1.Disposable {
        constructor(environmentService, remoteAgentService, productService) {
            var _a, _b, _c;
            super();
            this.productService = productService;
            this._onDidChangePassword = this._register(new event_1.Emitter());
            this.onDidChangePassword = this._onDidChangePassword.event;
            if (environmentService.remoteAuthority && !((_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.credentialsProvider)) {
                // If we have a remote authority but the embedder didn't provide a credentialsProvider,
                // we can use the CredentialsService on the remote side
                const remoteCredentialsService = ipc_1.ProxyChannel.toService(remoteAgentService.getConnection().getChannel('credentials'));
                this.credentialsProvider = remoteCredentialsService;
                this._secretStoragePrefix = remoteCredentialsService.getSecretStoragePrefix();
            }
            else {
                // fall back to InMemoryCredentialsProvider if none was given to us. This should really only be used
                // when running tests.
                this.credentialsProvider = (_c = (_b = environmentService.options) === null || _b === void 0 ? void 0 : _b.credentialsProvider) !== null && _c !== void 0 ? _c : new credentials_1.InMemoryCredentialsProvider();
                this._secretStoragePrefix = Promise.resolve(this.productService.urlProtocol);
            }
        }
        async getSecretStoragePrefix() { return this._secretStoragePrefix; }
        getPassword(service, account) {
            return this.credentialsProvider.getPassword(service, account);
        }
        async setPassword(service, account, password) {
            await this.credentialsProvider.setPassword(service, account, password);
            this._onDidChangePassword.fire({ service, account });
        }
        async deletePassword(service, account) {
            const didDelete = await this.credentialsProvider.deletePassword(service, account);
            if (didDelete) {
                this._onDidChangePassword.fire({ service, account });
            }
            return didDelete;
        }
        findPassword(service) {
            return this.credentialsProvider.findPassword(service);
        }
        findCredentials(service) {
            return this.credentialsProvider.findCredentials(service);
        }
        async clear() {
            if (this.credentialsProvider.clear) {
                return this.credentialsProvider.clear();
            }
        }
    };
    BrowserCredentialsService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, productService_1.IProductService)
    ], BrowserCredentialsService);
    exports.BrowserCredentialsService = BrowserCredentialsService;
});
//# sourceMappingURL=credentialsService.js.map