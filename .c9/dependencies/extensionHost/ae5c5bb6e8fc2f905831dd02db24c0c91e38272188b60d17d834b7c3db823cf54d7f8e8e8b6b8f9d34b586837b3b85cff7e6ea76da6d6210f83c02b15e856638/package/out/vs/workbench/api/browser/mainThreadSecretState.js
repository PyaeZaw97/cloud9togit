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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/credentials/common/credentials", "vs/workbench/services/encryption/common/encryptionService", "../common/extHost.protocol", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, extHostCustomers_1, credentials_1, encryptionService_1, extHost_protocol_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSecretState = void 0;
    let MainThreadSecretState = class MainThreadSecretState extends lifecycle_1.Disposable {
        constructor(extHostContext, credentialsService, encryptionService, logService) {
            super();
            this.credentialsService = credentialsService;
            this.encryptionService = encryptionService;
            this.logService = logService;
            this.secretStoragePrefix = this.credentialsService.getSecretStoragePrefix();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSecretState);
            this._register(this.credentialsService.onDidChangePassword(async (e) => {
                const extensionId = e.service.substring((await this.secretStoragePrefix).length);
                this._proxy.$onDidChangePassword({ extensionId, key: e.account });
            }));
        }
        async getFullKey(extensionId) {
            return `${await this.secretStoragePrefix}${extensionId}`;
        }
        async $getPassword(extensionId, key) {
            const fullKey = await this.getFullKey(extensionId);
            const password = await this.credentialsService.getPassword(fullKey, key);
            if (!password) {
                return undefined;
            }
            let decrypted;
            try {
                decrypted = await this.encryptionService.decrypt(password);
            }
            catch (e) {
                this.logService.error(e);
                // If we are on a platform that newly started encrypting secrets before storing them,
                // then passwords previously stored were stored un-encrypted (NOTE: but still being stored in a secure keyring).
                // When we try to decrypt a password that wasn't encrypted previously, the encryption service will throw.
                // To recover gracefully, we first try to encrypt & store the password (essentially migrating the secret to the new format)
                // and then we try to read it and decrypt again.
                const encryptedForSet = await this.encryptionService.encrypt(password);
                await this.credentialsService.setPassword(fullKey, key, encryptedForSet);
                const passwordEncrypted = await this.credentialsService.getPassword(fullKey, key);
                decrypted = passwordEncrypted && await this.encryptionService.decrypt(passwordEncrypted);
            }
            if (decrypted) {
                try {
                    const value = JSON.parse(decrypted);
                    if (value.extensionId === extensionId) {
                        return value.content;
                    }
                }
                catch (e) {
                    this.logService.error(e);
                    throw new Error('Cannot get password');
                }
            }
            return undefined;
        }
        async $setPassword(extensionId, key, value) {
            const fullKey = await this.getFullKey(extensionId);
            const toEncrypt = JSON.stringify({
                extensionId,
                content: value
            });
            const encrypted = await this.encryptionService.encrypt(toEncrypt);
            return await this.credentialsService.setPassword(fullKey, key, encrypted);
        }
        async $deletePassword(extensionId, key) {
            try {
                const fullKey = await this.getFullKey(extensionId);
                await this.credentialsService.deletePassword(fullKey, key);
            }
            catch (_) {
                throw new Error('Cannot delete password');
            }
        }
    };
    MainThreadSecretState = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadSecretState),
        __param(1, credentials_1.ICredentialsService),
        __param(2, encryptionService_1.IEncryptionService),
        __param(3, log_1.ILogService)
    ], MainThreadSecretState);
    exports.MainThreadSecretState = MainThreadSecretState;
});
//# sourceMappingURL=mainThreadSecretState.js.map