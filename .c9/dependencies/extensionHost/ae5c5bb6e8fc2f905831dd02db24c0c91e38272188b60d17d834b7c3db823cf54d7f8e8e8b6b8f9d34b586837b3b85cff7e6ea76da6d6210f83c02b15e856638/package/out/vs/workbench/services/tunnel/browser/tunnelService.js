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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/tunnel/common/tunnel", "vs/workbench/services/environment/common/environmentService"], function (require, exports, extensions_1, log_1, tunnel_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelService = void 0;
    let TunnelService = class TunnelService extends tunnel_1.AbstractTunnelService {
        constructor(logService, environmentService) {
            super(logService);
            this.environmentService = environmentService;
        }
        retainOrCreateTunnel(_addressProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol) {
            const existing = this.getTunnelFromMap(remoteHost, remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            if (this._tunnelProvider) {
                return this.createWithProvider(this._tunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol);
            }
            return undefined;
        }
        canTunnel(uri) {
            return super.canTunnel(uri) && !!this.environmentService.remoteAuthority;
        }
    };
    TunnelService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], TunnelService);
    exports.TunnelService = TunnelService;
    (0, extensions_1.registerSingleton)(tunnel_1.ITunnelService, TunnelService, true);
});
//# sourceMappingURL=tunnelService.js.map