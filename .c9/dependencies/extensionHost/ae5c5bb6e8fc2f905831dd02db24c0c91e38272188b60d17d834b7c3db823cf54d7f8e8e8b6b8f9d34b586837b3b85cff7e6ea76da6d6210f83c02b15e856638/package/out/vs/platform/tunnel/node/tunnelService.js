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
define(["require", "exports", "net", "vs/base/node/ports", "vs/platform/remote/node/nodeSocketFactory", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/tunnel/common/tunnel", "vs/platform/sign/common/sign"], function (require, exports, net, ports_1, nodeSocketFactory_1, async_1, lifecycle_1, configuration_1, log_1, productService_1, remoteAgentConnection_1, tunnel_1, sign_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedTunnelsService = exports.TunnelService = exports.BaseTunnelService = void 0;
    async function createRemoteTunnel(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort) {
        let readyTunnel;
        for (let attempts = 3; attempts; attempts--) {
            if (readyTunnel) {
                readyTunnel.dispose();
            }
            const tunnel = new NodeRemoteTunnel(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort);
            readyTunnel = await tunnel.waitForReady();
            if ((tunnelLocalPort && ports_1.BROWSER_RESTRICTED_PORTS[tunnelLocalPort]) || !ports_1.BROWSER_RESTRICTED_PORTS[readyTunnel.tunnelLocalPort]) {
                break;
            }
        }
        return readyTunnel;
    }
    class NodeRemoteTunnel extends lifecycle_1.Disposable {
        constructor(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, suggestedLocalPort) {
            super();
            this.defaultTunnelHost = defaultTunnelHost;
            this.suggestedLocalPort = suggestedLocalPort;
            this.privacy = tunnel_1.TunnelPrivacyId.Private;
            this._socketsDispose = new Map();
            this._options = options;
            this._server = net.createServer();
            this._barrier = new async_1.Barrier();
            this._listeningListener = () => this._barrier.open();
            this._server.on('listening', this._listeningListener);
            this._connectionListener = (socket) => this._onConnection(socket);
            this._server.on('connection', this._connectionListener);
            // If there is no error listener and there is an error it will crash the whole window
            this._errorListener = () => { };
            this._server.on('error', this._errorListener);
            this.tunnelRemotePort = tunnelRemotePort;
            this.tunnelRemoteHost = tunnelRemoteHost;
        }
        async dispose() {
            super.dispose();
            this._server.removeListener('listening', this._listeningListener);
            this._server.removeListener('connection', this._connectionListener);
            this._server.removeListener('error', this._errorListener);
            this._server.close();
            const disposers = Array.from(this._socketsDispose.values());
            disposers.forEach(disposer => {
                disposer();
            });
        }
        async waitForReady() {
            var _a;
            // try to get the same port number as the remote port number...
            let localPort = await (0, ports_1.findFreePortFaster)((_a = this.suggestedLocalPort) !== null && _a !== void 0 ? _a : this.tunnelRemotePort, 2, 1000);
            // if that fails, the method above returns 0, which works out fine below...
            let address = null;
            this._server.listen(localPort, this.defaultTunnelHost);
            await this._barrier.wait();
            address = this._server.address();
            // It is possible for findFreePortFaster to return a port that there is already a server listening on. This causes the previous listen call to error out.
            if (!address) {
                localPort = 0;
                this._server.listen(localPort, this.defaultTunnelHost);
                await this._barrier.wait();
                address = this._server.address();
            }
            this.tunnelLocalPort = address.port;
            this.localAddress = `${this.tunnelRemoteHost === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:${address.port}`;
            return this;
        }
        async _onConnection(localSocket) {
            // pause reading on the socket until we have a chance to forward its data
            localSocket.pause();
            const tunnelRemoteHost = ((0, tunnel_1.isLocalhost)(this.tunnelRemoteHost) || (0, tunnel_1.isAllInterfaces)(this.tunnelRemoteHost)) ? 'localhost' : this.tunnelRemoteHost;
            const protocol = await (0, remoteAgentConnection_1.connectRemoteAgentTunnel)(this._options, tunnelRemoteHost, this.tunnelRemotePort);
            const remoteSocket = protocol.getSocket().socket;
            const dataChunk = protocol.readEntireBuffer();
            protocol.dispose();
            if (dataChunk.byteLength > 0) {
                localSocket.write(dataChunk.buffer);
            }
            localSocket.on('end', () => {
                if (localSocket.localAddress) {
                    this._socketsDispose.delete(localSocket.localAddress);
                }
                remoteSocket.end();
            });
            localSocket.on('close', () => remoteSocket.end());
            localSocket.on('error', () => {
                if (localSocket.localAddress) {
                    this._socketsDispose.delete(localSocket.localAddress);
                }
                remoteSocket.destroy();
            });
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            remoteSocket.on('error', () => {
                localSocket.destroy();
            });
            localSocket.pipe(remoteSocket);
            remoteSocket.pipe(localSocket);
            if (localSocket.localAddress) {
                this._socketsDispose.set(localSocket.localAddress, () => {
                    // Need to end instead of unpipe, otherwise whatever is connected locally could end up "stuck" with whatever state it had until manually exited.
                    localSocket.end();
                    remoteSocket.end();
                });
            }
        }
    }
    let BaseTunnelService = class BaseTunnelService extends tunnel_1.AbstractTunnelService {
        constructor(socketFactory, logService, signService, productService, configurationService) {
            super(logService);
            this.socketFactory = socketFactory;
            this.signService = signService;
            this.productService = productService;
            this.configurationService = configurationService;
        }
        get defaultTunnelHost() {
            const settingValue = this.configurationService.getValue('remote.localPortHost');
            return (!settingValue || settingValue === 'localhost') ? '127.0.0.1' : '0.0.0.0';
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
                const options = {
                    commit: this.productService.commit,
                    socketFactory: this.socketFactory,
                    addressProvider,
                    signService: this.signService,
                    logService: this.logService,
                    ipcLogger: null
                };
                const tunnel = createRemoteTunnel(options, this.defaultTunnelHost, remoteHost, remotePort, localPort);
                this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created without provider.');
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
                return tunnel;
            }
        }
    };
    BaseTunnelService = __decorate([
        __param(1, log_1.ILogService),
        __param(2, sign_1.ISignService),
        __param(3, productService_1.IProductService),
        __param(4, configuration_1.IConfigurationService)
    ], BaseTunnelService);
    exports.BaseTunnelService = BaseTunnelService;
    let TunnelService = class TunnelService extends BaseTunnelService {
        constructor(logService, signService, productService, configurationService) {
            super(nodeSocketFactory_1.nodeSocketFactory, logService, signService, productService, configurationService);
        }
    };
    TunnelService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, sign_1.ISignService),
        __param(2, productService_1.IProductService),
        __param(3, configuration_1.IConfigurationService)
    ], TunnelService);
    exports.TunnelService = TunnelService;
    let SharedTunnelsService = class SharedTunnelsService extends lifecycle_1.Disposable {
        constructor(logService, productService, signService, configurationService) {
            super();
            this.logService = logService;
            this.productService = productService;
            this.signService = signService;
            this.configurationService = configurationService;
            this._tunnelServices = new Map();
        }
        async openTunnel(authority, addressProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (SharedTunnelService) openTunnel request for ${remoteHost}:${remotePort} on local port ${localPort}.`);
            if (!this._tunnelServices.has(authority)) {
                const tunnelService = new TunnelService(this.logService, this.signService, this.productService, this.configurationService);
                this._register(tunnelService);
                this._tunnelServices.set(authority, tunnelService);
                tunnelService.onTunnelClosed(async () => {
                    if ((await tunnelService.tunnels).length === 0) {
                        tunnelService.dispose();
                        this._tunnelServices.delete(authority);
                    }
                });
            }
            return this._tunnelServices.get(authority).openTunnel(addressProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol);
        }
    };
    SharedTunnelsService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, productService_1.IProductService),
        __param(2, sign_1.ISignService),
        __param(3, configuration_1.IConfigurationService)
    ], SharedTunnelsService);
    exports.SharedTunnelsService = SharedTunnelsService;
});
//# sourceMappingURL=tunnelService.js.map