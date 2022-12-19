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
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/extensions", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/platform/remote/common/sharedProcessTunnelService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/instantiation/common/instantiation"], function (require, exports, log_1, environmentService_1, extensions_1, tunnel_1, lifecycle_1, sharedProcessTunnelService_1, lifecycle_2, remoteAuthorityResolver_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelService = void 0;
    let SharedProcessTunnel = class SharedProcessTunnel extends lifecycle_1.Disposable {
        constructor(_id, _addressProvider, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort, localAddress, _onBeforeDispose, _sharedProcessTunnelService, _remoteAuthorityResolverService) {
            super();
            this._id = _id;
            this._addressProvider = _addressProvider;
            this.tunnelRemoteHost = tunnelRemoteHost;
            this.tunnelRemotePort = tunnelRemotePort;
            this.tunnelLocalPort = tunnelLocalPort;
            this.localAddress = localAddress;
            this._onBeforeDispose = _onBeforeDispose;
            this._sharedProcessTunnelService = _sharedProcessTunnelService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this.privacy = tunnel_1.TunnelPrivacyId.Private;
            this.protocol = undefined;
            this._updateAddress();
            this._register(this._remoteAuthorityResolverService.onDidChangeConnectionData(() => this._updateAddress()));
        }
        _updateAddress() {
            this._addressProvider.getAddress().then((address) => {
                this._sharedProcessTunnelService.setAddress(this._id, address);
            });
        }
        async dispose() {
            this._onBeforeDispose();
            super.dispose();
            await this._sharedProcessTunnelService.destroyTunnel(this._id);
        }
    };
    SharedProcessTunnel = __decorate([
        __param(7, sharedProcessTunnelService_1.ISharedProcessTunnelService),
        __param(8, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], SharedProcessTunnel);
    let TunnelService = class TunnelService extends tunnel_1.AbstractTunnelService {
        constructor(logService, _environmentService, _sharedProcessTunnelService, _instantiationService, lifecycleService) {
            super(logService);
            this._environmentService = _environmentService;
            this._sharedProcessTunnelService = _sharedProcessTunnelService;
            this._instantiationService = _instantiationService;
            this._activeSharedProcessTunnels = new Set();
            // Destroy any shared process tunnels that might still be active
            lifecycleService.onDidShutdown(() => {
                this._activeSharedProcessTunnels.forEach((id) => {
                    this._sharedProcessTunnelService.destroyTunnel(id);
                });
            });
        }
        retainOrCreateTunnel(addressProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol) {
            const existing = this.getTunnelFromMap(remoteHost, remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            if (this._tunnelProvider) {
                return this.createWithProvider(this._tunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol);
            }
            else {
                this.logService.trace(`ForwardedPorts: (TunnelService) Creating tunnel without provider ${remoteHost}:${remotePort} on local port ${localPort}.`);
                const tunnel = this._createSharedProcessTunnel(addressProvider, remoteHost, remotePort, localPort, elevateIfNeeded);
                this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created without provider.');
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
                return tunnel;
            }
        }
        async _createSharedProcessTunnel(addressProvider, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort, elevateIfNeeded) {
            const { id } = await this._sharedProcessTunnelService.createTunnel();
            this._activeSharedProcessTunnels.add(id);
            const authority = this._environmentService.remoteAuthority;
            const result = await this._sharedProcessTunnelService.startTunnel(authority, id, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort, elevateIfNeeded);
            const tunnel = this._instantiationService.createInstance(SharedProcessTunnel, id, addressProvider, tunnelRemoteHost, tunnelRemotePort, result.tunnelLocalPort, result.localAddress, () => {
                this._activeSharedProcessTunnels.delete(id);
            });
            return tunnel;
        }
        canTunnel(uri) {
            return super.canTunnel(uri) && !!this._environmentService.remoteAuthority;
        }
    };
    TunnelService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, sharedProcessTunnelService_1.ISharedProcessTunnelService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, lifecycle_2.ILifecycleService)
    ], TunnelService);
    exports.TunnelService = TunnelService;
    (0, extensions_1.registerSingleton)(tunnel_1.ITunnelService, TunnelService);
});
//# sourceMappingURL=tunnelService.js.map