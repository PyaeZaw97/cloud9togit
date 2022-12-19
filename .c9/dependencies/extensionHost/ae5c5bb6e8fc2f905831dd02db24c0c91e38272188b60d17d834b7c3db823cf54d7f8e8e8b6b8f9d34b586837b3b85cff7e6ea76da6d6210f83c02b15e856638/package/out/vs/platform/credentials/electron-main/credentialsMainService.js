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
define(["require", "exports", "vs/platform/credentials/common/credentials", "vs/platform/log/common/log", "vs/platform/environment/common/environment", "vs/platform/product/common/productService", "vs/platform/windows/electron-main/windows", "vs/platform/credentials/common/credentialsMainService"], function (require, exports, credentials_1, log_1, environment_1, productService_1, windows_1, credentialsMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CredentialsNativeMainService = void 0;
    let CredentialsNativeMainService = class CredentialsNativeMainService extends credentialsMainService_1.BaseCredentialsMainService {
        constructor(logService, environmentMainService, productService, windowsMainService) {
            super(logService);
            this.environmentMainService = environmentMainService;
            this.productService = productService;
            this.windowsMainService = windowsMainService;
            this.surfaceKeytarLoadError = (err) => {
                var _a;
                this.windowsMainService.sendToFocused('vscode:showCredentialsError', (_a = err.message) !== null && _a !== void 0 ? _a : err);
            };
        }
        // If the credentials service is running on the server, we add a suffix -server to differentiate from the location that the
        // client would store the credentials.
        async getSecretStoragePrefix() { return Promise.resolve(this.productService.urlProtocol); }
        async withKeytar() {
            if (this._keytarCache) {
                return this._keytarCache;
            }
            if (this.environmentMainService.disableKeytar) {
                this.logService.info('Keytar is disabled. Using in-memory credential store instead.');
                this._keytarCache = new credentials_1.InMemoryCredentialsProvider();
                return this._keytarCache;
            }
            const keytarCache = await new Promise((resolve_1, reject_1) => { require(['keytar'], resolve_1, reject_1); });
            // Try using keytar to see if it throws or not.
            await keytarCache.findCredentials('test-keytar-loads');
            this._keytarCache = keytarCache;
            return this._keytarCache;
        }
    };
    CredentialsNativeMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, productService_1.IProductService),
        __param(3, windows_1.IWindowsMainService)
    ], CredentialsNativeMainService);
    exports.CredentialsNativeMainService = CredentialsNativeMainService;
});
//# sourceMappingURL=credentialsMainService.js.map