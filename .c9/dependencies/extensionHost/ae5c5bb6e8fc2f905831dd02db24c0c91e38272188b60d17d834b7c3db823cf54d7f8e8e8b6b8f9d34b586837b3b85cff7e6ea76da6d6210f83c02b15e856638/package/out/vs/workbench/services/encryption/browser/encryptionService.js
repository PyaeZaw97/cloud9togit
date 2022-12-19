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
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/encryption/common/encryptionService", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, ipc_1, extensions_1, log_1, encryptionService_1, environmentService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncryptionService = void 0;
    let EncryptionService = class EncryptionService {
        constructor(remoteAgentService, environmentService, logService) {
            var _a;
            // This allows the remote side to handle any encryption requests
            if (environmentService.remoteAuthority && !((_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.credentialsProvider)) {
                logService.trace('EncryptionService#constructor - Detected remote environment, registering proxy for encryption instead');
                return ipc_1.ProxyChannel.toService(remoteAgentService.getConnection().getChannel('encryption'));
            }
        }
        encrypt(value) {
            return Promise.resolve(value);
        }
        decrypt(value) {
            return Promise.resolve(value);
        }
    };
    EncryptionService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, log_1.ILogService)
    ], EncryptionService);
    exports.EncryptionService = EncryptionService;
    (0, extensions_1.registerSingleton)(encryptionService_1.IEncryptionService, EncryptionService, true);
});
//# sourceMappingURL=encryptionService.js.map