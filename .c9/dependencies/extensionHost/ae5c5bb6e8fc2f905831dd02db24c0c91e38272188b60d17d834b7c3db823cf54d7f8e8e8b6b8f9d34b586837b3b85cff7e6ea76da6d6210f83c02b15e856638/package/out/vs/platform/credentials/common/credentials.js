/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryCredentialsProvider = exports.ICredentialsMainService = exports.ICredentialsService = void 0;
    exports.ICredentialsService = (0, instantiation_1.createDecorator)('credentialsService');
    exports.ICredentialsMainService = (0, instantiation_1.createDecorator)('credentialsMainService');
    class InMemoryCredentialsProvider {
        constructor() {
            this.secretVault = {};
        }
        async getPassword(service, account) {
            var _a, _b;
            return (_b = (_a = this.secretVault[service]) === null || _a === void 0 ? void 0 : _a[account]) !== null && _b !== void 0 ? _b : null;
        }
        async setPassword(service, account, password) {
            var _a;
            this.secretVault[service] = (_a = this.secretVault[service]) !== null && _a !== void 0 ? _a : {};
            this.secretVault[service][account] = password;
        }
        async deletePassword(service, account) {
            var _a;
            if (!((_a = this.secretVault[service]) === null || _a === void 0 ? void 0 : _a[account])) {
                return false;
            }
            delete this.secretVault[service][account];
            if (Object.keys(this.secretVault[service]).length === 0) {
                delete this.secretVault[service];
            }
            return true;
        }
        async findPassword(service) {
            var _a;
            return (_a = JSON.stringify(this.secretVault[service])) !== null && _a !== void 0 ? _a : null;
        }
        async findCredentials(service) {
            const credentials = [];
            for (const account of Object.keys(this.secretVault[service] || {})) {
                credentials.push({ account, password: this.secretVault[service][account] });
            }
            return credentials;
        }
        async clear() {
            this.secretVault = {};
        }
    }
    exports.InMemoryCredentialsProvider = InMemoryCredentialsProvider;
});
//# sourceMappingURL=credentials.js.map