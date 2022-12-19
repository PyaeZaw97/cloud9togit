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
define(["require", "exports", "vs/base/common/event", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, event_1, platform_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTunnelService = exports.isPortPrivileged = exports.isAllInterfaces = exports.ALL_INTERFACES_ADDRESSES = exports.isLocalhost = exports.LOCALHOST_ADDRESSES = exports.extractLocalHostUriMetaDataForPortMapping = exports.ProvidedOnAutoForward = exports.TunnelPrivacyId = exports.TunnelProtocol = exports.ISharedTunnelsService = exports.ITunnelService = void 0;
    exports.ITunnelService = (0, instantiation_1.createDecorator)('tunnelService');
    exports.ISharedTunnelsService = (0, instantiation_1.createDecorator)('sharedTunnelsService');
    var TunnelProtocol;
    (function (TunnelProtocol) {
        TunnelProtocol["Http"] = "http";
        TunnelProtocol["Https"] = "https";
    })(TunnelProtocol = exports.TunnelProtocol || (exports.TunnelProtocol = {}));
    var TunnelPrivacyId;
    (function (TunnelPrivacyId) {
        TunnelPrivacyId["ConstantPrivate"] = "constantPrivate";
        TunnelPrivacyId["Private"] = "private";
        TunnelPrivacyId["Public"] = "public";
    })(TunnelPrivacyId = exports.TunnelPrivacyId || (exports.TunnelPrivacyId = {}));
    var ProvidedOnAutoForward;
    (function (ProvidedOnAutoForward) {
        ProvidedOnAutoForward[ProvidedOnAutoForward["Notify"] = 1] = "Notify";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenBrowser"] = 2] = "OpenBrowser";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenPreview"] = 3] = "OpenPreview";
        ProvidedOnAutoForward[ProvidedOnAutoForward["Silent"] = 4] = "Silent";
        ProvidedOnAutoForward[ProvidedOnAutoForward["Ignore"] = 5] = "Ignore";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenBrowserOnce"] = 6] = "OpenBrowserOnce";
    })(ProvidedOnAutoForward = exports.ProvidedOnAutoForward || (exports.ProvidedOnAutoForward = {}));
    function extractLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https') {
            return undefined;
        }
        const localhostMatch = /^(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)$/.exec(uri.authority);
        if (!localhostMatch) {
            return undefined;
        }
        return {
            address: localhostMatch[1],
            port: +localhostMatch[2],
        };
    }
    exports.extractLocalHostUriMetaDataForPortMapping = extractLocalHostUriMetaDataForPortMapping;
    exports.LOCALHOST_ADDRESSES = ['localhost', '127.0.0.1', '0:0:0:0:0:0:0:1', '::1'];
    function isLocalhost(host) {
        return exports.LOCALHOST_ADDRESSES.indexOf(host) >= 0;
    }
    exports.isLocalhost = isLocalhost;
    exports.ALL_INTERFACES_ADDRESSES = ['0.0.0.0', '0:0:0:0:0:0:0:0', '::'];
    function isAllInterfaces(host) {
        return exports.ALL_INTERFACES_ADDRESSES.indexOf(host) >= 0;
    }
    exports.isAllInterfaces = isAllInterfaces;
    function isPortPrivileged(port, os) {
        if (os) {
            return os !== 1 /* OperatingSystem.Windows */ && (port < 1024);
        }
        else {
            return !platform_1.isWindows && (port < 1024);
        }
    }
    exports.isPortPrivileged = isPortPrivileged;
    let AbstractTunnelService = class AbstractTunnelService {
        constructor(logService) {
            this.logService = logService;
            this._onTunnelOpened = new event_1.Emitter();
            this.onTunnelOpened = this._onTunnelOpened.event;
            this._onTunnelClosed = new event_1.Emitter();
            this.onTunnelClosed = this._onTunnelClosed.event;
            this._onAddedTunnelProvider = new event_1.Emitter();
            this.onAddedTunnelProvider = this._onAddedTunnelProvider.event;
            this._tunnels = new Map();
            this._canElevate = false;
            this._privacyOptions = [];
        }
        get hasTunnelProvider() {
            return !!this._tunnelProvider;
        }
        setTunnelProvider(provider) {
            this._tunnelProvider = provider;
            if (!provider) {
                // clear features
                this._canElevate = false;
                this._privacyOptions = [];
                this._onAddedTunnelProvider.fire();
                return {
                    dispose: () => { }
                };
            }
            this._onAddedTunnelProvider.fire();
            return {
                dispose: () => {
                    this._tunnelProvider = undefined;
                    this._canElevate = false;
                    this._privacyOptions = [];
                }
            };
        }
        setTunnelFeatures(features) {
            this._canElevate = features.elevation;
            this._privacyOptions = features.privacyOptions;
        }
        get canElevate() {
            return this._canElevate;
        }
        get canChangePrivacy() {
            return this._privacyOptions.length > 0;
        }
        get privacyOptions() {
            return this._privacyOptions;
        }
        get tunnels() {
            return this.getTunnels();
        }
        async getTunnels() {
            const tunnels = [];
            const tunnelArray = Array.from(this._tunnels.values());
            for (let portMap of tunnelArray) {
                const portArray = Array.from(portMap.values());
                for (let x of portArray) {
                    const tunnelValue = await x.value;
                    if (tunnelValue) {
                        tunnels.push(tunnelValue);
                    }
                }
            }
            return tunnels;
        }
        async dispose() {
            for (const portMap of this._tunnels.values()) {
                for (const { value } of portMap.values()) {
                    await value.then(tunnel => tunnel === null || tunnel === void 0 ? void 0 : tunnel.dispose());
                }
                portMap.clear();
            }
            this._tunnels.clear();
        }
        openTunnel(addressProvider, remoteHost, remotePort, localPort, elevateIfNeeded = false, privacy = TunnelPrivacyId.Private, protocol) {
            this.logService.trace(`ForwardedPorts: (TunnelService) openTunnel request for ${remoteHost}:${remotePort} on local port ${localPort}.`);
            if (!addressProvider) {
                return undefined;
            }
            if (!remoteHost) {
                remoteHost = 'localhost';
            }
            const resolvedTunnel = this.retainOrCreateTunnel(addressProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol);
            if (!resolvedTunnel) {
                this.logService.trace(`ForwardedPorts: (TunnelService) Tunnel was not created.`);
                return resolvedTunnel;
            }
            return resolvedTunnel.then(tunnel => {
                if (!tunnel) {
                    this.logService.trace('ForwardedPorts: (TunnelService) New tunnel is undefined.');
                    this.removeEmptyTunnelFromMap(remoteHost, remotePort);
                    return undefined;
                }
                this.logService.trace('ForwardedPorts: (TunnelService) New tunnel established.');
                const newTunnel = this.makeTunnel(tunnel);
                if (tunnel.tunnelRemoteHost !== remoteHost || tunnel.tunnelRemotePort !== remotePort) {
                    this.logService.warn('ForwardedPorts: (TunnelService) Created tunnel does not match requirements of requested tunnel. Host or port mismatch.');
                }
                this._onTunnelOpened.fire(newTunnel);
                return newTunnel;
            });
        }
        makeTunnel(tunnel) {
            return {
                tunnelRemotePort: tunnel.tunnelRemotePort,
                tunnelRemoteHost: tunnel.tunnelRemoteHost,
                tunnelLocalPort: tunnel.tunnelLocalPort,
                localAddress: tunnel.localAddress,
                privacy: tunnel.privacy,
                protocol: tunnel.protocol,
                dispose: async () => {
                    this.logService.trace(`ForwardedPorts: (TunnelService) dispose request for ${tunnel.tunnelRemoteHost}:${tunnel.tunnelRemotePort} `);
                    const existingHost = this._tunnels.get(tunnel.tunnelRemoteHost);
                    if (existingHost) {
                        const existing = existingHost.get(tunnel.tunnelRemotePort);
                        if (existing) {
                            existing.refcount--;
                            await this.tryDisposeTunnel(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort, existing);
                        }
                    }
                }
            };
        }
        async tryDisposeTunnel(remoteHost, remotePort, tunnel) {
            if (tunnel.refcount <= 0) {
                this.logService.trace(`ForwardedPorts: (TunnelService) Tunnel is being disposed ${remoteHost}:${remotePort}.`);
                const disposePromise = tunnel.value.then(async (tunnel) => {
                    if (tunnel) {
                        await tunnel.dispose(true);
                        this._onTunnelClosed.fire({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort });
                    }
                });
                if (this._tunnels.has(remoteHost)) {
                    this._tunnels.get(remoteHost).delete(remotePort);
                }
                return disposePromise;
            }
        }
        async closeTunnel(remoteHost, remotePort) {
            this.logService.trace(`ForwardedPorts: (TunnelService) close request for ${remoteHost}:${remotePort} `);
            const portMap = this._tunnels.get(remoteHost);
            if (portMap && portMap.has(remotePort)) {
                const value = portMap.get(remotePort);
                value.refcount = 0;
                await this.tryDisposeTunnel(remoteHost, remotePort, value);
            }
        }
        addTunnelToMap(remoteHost, remotePort, tunnel) {
            if (!this._tunnels.has(remoteHost)) {
                this._tunnels.set(remoteHost, new Map());
            }
            this._tunnels.get(remoteHost).set(remotePort, { refcount: 1, value: tunnel });
        }
        async removeEmptyTunnelFromMap(remoteHost, remotePort) {
            const hostMap = this._tunnels.get(remoteHost);
            if (hostMap) {
                const tunnel = hostMap.get(remotePort);
                const tunnelResult = await tunnel;
                if (!tunnelResult) {
                    hostMap.delete(remotePort);
                }
                if (hostMap.size === 0) {
                    this._tunnels.delete(remoteHost);
                }
            }
        }
        getTunnelFromMap(remoteHost, remotePort) {
            let hosts = [remoteHost];
            // Order matters. We want the original host to be first.
            if (isLocalhost(remoteHost)) {
                hosts.push(...exports.LOCALHOST_ADDRESSES);
                // For localhost, we add the all interfaces hosts because if the tunnel is already available at all interfaces,
                // then of course it is available at localhost.
                hosts.push(...exports.ALL_INTERFACES_ADDRESSES);
            }
            else if (isAllInterfaces(remoteHost)) {
                hosts.push(...exports.ALL_INTERFACES_ADDRESSES);
            }
            const existingPortMaps = hosts.map(host => this._tunnels.get(host));
            for (const map of existingPortMaps) {
                const existingTunnel = map === null || map === void 0 ? void 0 : map.get(remotePort);
                if (existingTunnel) {
                    return existingTunnel;
                }
            }
            return undefined;
        }
        canTunnel(uri) {
            return !!extractLocalHostUriMetaDataForPortMapping(uri);
        }
        createWithProvider(tunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (TunnelService) Creating tunnel with provider ${remoteHost}:${remotePort} on local port ${localPort}.`);
            const preferredLocalPort = localPort === undefined ? remotePort : localPort;
            const creationInfo = { elevationRequired: elevateIfNeeded ? isPortPrivileged(preferredLocalPort) : false };
            const tunnelOptions = { remoteAddress: { host: remoteHost, port: remotePort }, localAddressPort: localPort, privacy, public: privacy !== TunnelPrivacyId.Private, protocol };
            const tunnel = tunnelProvider.forwardPort(tunnelOptions, creationInfo);
            this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created by provider.');
            if (tunnel) {
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
            }
            return tunnel;
        }
    };
    AbstractTunnelService = __decorate([
        __param(0, log_1.ILogService)
    ], AbstractTunnelService);
    exports.AbstractTunnelService = AbstractTunnelService;
});
//# sourceMappingURL=tunnel.js.map