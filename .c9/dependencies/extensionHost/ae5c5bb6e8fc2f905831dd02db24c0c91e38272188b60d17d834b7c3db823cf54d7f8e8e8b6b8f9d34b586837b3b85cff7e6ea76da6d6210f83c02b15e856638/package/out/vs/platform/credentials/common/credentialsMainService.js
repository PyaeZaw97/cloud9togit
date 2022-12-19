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
define(["require", "exports", "vs/platform/credentials/common/credentials", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/platform"], function (require, exports, credentials_1, event_1, lifecycle_1, log_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseCredentialsMainService = void 0;
    let BaseCredentialsMainService = class BaseCredentialsMainService extends lifecycle_1.Disposable {
        constructor(logService) {
            super();
            this.logService = logService;
            this._onDidChangePassword = this._register(new event_1.Emitter());
            this.onDidChangePassword = this._onDidChangePassword.event;
        }
        //#endregion
        async getPassword(service, account) {
            let keytar;
            try {
                keytar = await this.withKeytar();
            }
            catch (e) {
                // for get operations, we don't want to surface errors to the user
                return null;
            }
            const password = await keytar.getPassword(service, account);
            if (password) {
                try {
                    let { content, hasNextChunk } = JSON.parse(password);
                    if (!content || !hasNextChunk) {
                        return password;
                    }
                    let index = 1;
                    while (hasNextChunk) {
                        const nextChunk = await keytar.getPassword(service, `${account}-${index}`);
                        const result = JSON.parse(nextChunk);
                        content += result.content;
                        hasNextChunk = result.hasNextChunk;
                        index++;
                    }
                    return content;
                }
                catch (_a) {
                    return password;
                }
            }
            return password;
        }
        async setPassword(service, account, password) {
            var _a;
            let keytar;
            try {
                keytar = await this.withKeytar();
            }
            catch (e) {
                (_a = this.surfaceKeytarLoadError) === null || _a === void 0 ? void 0 : _a.call(this, e);
                throw e;
            }
            const MAX_SET_ATTEMPTS = 3;
            // Sometimes Keytar has a problem talking to the keychain on the OS. To be more resilient, we retry a few times.
            const setPasswordWithRetry = async (service, account, password) => {
                var _a;
                let attempts = 0;
                let error;
                while (attempts < MAX_SET_ATTEMPTS) {
                    try {
                        await keytar.setPassword(service, account, password);
                        return;
                    }
                    catch (e) {
                        error = e;
                        this.logService.warn('Error attempting to set a password: ', (_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : e);
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
                // throw last error
                throw error;
            };
            if (platform_1.isWindows && password.length > BaseCredentialsMainService.MAX_PASSWORD_LENGTH) {
                let index = 0;
                let chunk = 0;
                let hasNextChunk = true;
                while (hasNextChunk) {
                    const passwordChunk = password.substring(index, index + BaseCredentialsMainService.PASSWORD_CHUNK_SIZE);
                    index += BaseCredentialsMainService.PASSWORD_CHUNK_SIZE;
                    hasNextChunk = password.length - index > 0;
                    const content = {
                        content: passwordChunk,
                        hasNextChunk: hasNextChunk
                    };
                    await setPasswordWithRetry(service, chunk ? `${account}-${chunk}` : account, JSON.stringify(content));
                    chunk++;
                }
            }
            else {
                await setPasswordWithRetry(service, account, password);
            }
            this._onDidChangePassword.fire({ service, account });
        }
        async deletePassword(service, account) {
            var _a;
            let keytar;
            try {
                keytar = await this.withKeytar();
            }
            catch (e) {
                (_a = this.surfaceKeytarLoadError) === null || _a === void 0 ? void 0 : _a.call(this, e);
                throw e;
            }
            const password = await keytar.getPassword(service, account);
            if (!password) {
                return false;
            }
            const didDelete = await keytar.deletePassword(service, account);
            let { content, hasNextChunk } = JSON.parse(password);
            if (content && hasNextChunk) {
                // need to delete additional chunks
                let index = 1;
                while (hasNextChunk) {
                    const accountWithIndex = `${account}-${index}`;
                    const nextChunk = await keytar.getPassword(service, accountWithIndex);
                    await keytar.deletePassword(service, accountWithIndex);
                    const result = JSON.parse(nextChunk);
                    hasNextChunk = result.hasNextChunk;
                    index++;
                }
            }
            if (didDelete) {
                this._onDidChangePassword.fire({ service, account });
            }
            return didDelete;
        }
        async findPassword(service) {
            let keytar;
            try {
                keytar = await this.withKeytar();
            }
            catch (e) {
                // for get operations, we don't want to surface errors to the user
                return null;
            }
            return keytar.findPassword(service);
        }
        async findCredentials(service) {
            let keytar;
            try {
                keytar = await this.withKeytar();
            }
            catch (e) {
                // for get operations, we don't want to surface errors to the user
                return [];
            }
            return keytar.findCredentials(service);
        }
        clear() {
            if (this._keytarCache instanceof credentials_1.InMemoryCredentialsProvider) {
                return this._keytarCache.clear();
            }
            // We don't know how to properly clear Keytar because we don't know
            // what services have stored credentials. For reference, a "service" is an extension.
            // TODO: should we clear credentials for the built-in auth extensions?
            return Promise.resolve();
        }
    };
    BaseCredentialsMainService.MAX_PASSWORD_LENGTH = 2500;
    BaseCredentialsMainService.PASSWORD_CHUNK_SIZE = BaseCredentialsMainService.MAX_PASSWORD_LENGTH - 100;
    BaseCredentialsMainService = __decorate([
        __param(0, log_1.ILogService)
    ], BaseCredentialsMainService);
    exports.BaseCredentialsMainService = BaseCredentialsMainService;
});
//# sourceMappingURL=credentialsMainService.js.map