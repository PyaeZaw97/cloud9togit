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
define(["require", "exports", "vs/nls", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, nls, extHost_protocol_1, extHostTunnelService_1, extHostCustomers_1, remoteExplorerService_1, tunnel_1, lifecycle_1, notification_1, configuration_1, log_1, remoteAgentService_1, platform_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTunnelService = void 0;
    let MainThreadTunnelService = class MainThreadTunnelService extends lifecycle_1.Disposable {
        constructor(extHostContext, remoteExplorerService, tunnelService, notificationService, configurationService, logService, remoteAgentService) {
            super();
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.remoteAgentService = remoteAgentService;
            this.elevateionRetry = false;
            this.portsAttributesProviders = new Map();
            this._alreadyRegistered = false;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTunnelService);
            this._register(tunnelService.onTunnelOpened(() => this._proxy.$onDidTunnelsChange()));
            this._register(tunnelService.onTunnelClosed(() => this._proxy.$onDidTunnelsChange()));
        }
        processFindingEnabled() {
            return (!!this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING) || this.tunnelService.hasTunnelProvider)
                && (this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING) === remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_PROCESS);
        }
        async $setRemoteTunnelService(processId) {
            this.remoteExplorerService.namedProcesses.set(processId, 'Code Extension Host');
            if (this.remoteExplorerService.portsFeaturesEnabled) {
                this._proxy.$registerCandidateFinder(this.processFindingEnabled());
            }
            else {
                this._register(this.remoteExplorerService.onEnabledPortsFeatures(() => this._proxy.$registerCandidateFinder(this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING))));
            }
            this._register(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING) || e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING)) {
                    return this._proxy.$registerCandidateFinder(this.processFindingEnabled());
                }
            }));
            this._register(this.tunnelService.onAddedTunnelProvider(() => {
                return this._proxy.$registerCandidateFinder(this.processFindingEnabled());
            }));
        }
        async $registerPortsAttributesProvider(selector, providerHandle) {
            this.portsAttributesProviders.set(providerHandle, selector);
            if (!this._alreadyRegistered) {
                this.remoteExplorerService.tunnelModel.addAttributesProvider(this);
                this._alreadyRegistered = true;
            }
        }
        async $unregisterPortsAttributesProvider(providerHandle) {
            this.portsAttributesProviders.delete(providerHandle);
        }
        async providePortAttributes(ports, pid, commandLine, token) {
            if (this.portsAttributesProviders.size === 0) {
                return [];
            }
            // Check all the selectors to make sure it's worth going to the extension host.
            const appropriateHandles = Array.from(this.portsAttributesProviders.entries()).filter(entry => {
                const selector = entry[1];
                const portRange = selector.portRange;
                const portInRange = portRange ? ports.some(port => portRange[0] <= port && port < portRange[1]) : true;
                const pidMatches = !selector.pid || (selector.pid === pid);
                const commandMatches = !selector.commandMatcher || (commandLine && (commandLine.match(selector.commandMatcher)));
                return portInRange && pidMatches && commandMatches;
            }).map(entry => entry[0]);
            if (appropriateHandles.length === 0) {
                return [];
            }
            return this._proxy.$providePortAttributes(appropriateHandles, ports, pid, commandLine, token);
        }
        async $openTunnel(tunnelOptions, source) {
            const tunnel = await this.remoteExplorerService.forward({
                remote: tunnelOptions.remoteAddress,
                local: tunnelOptions.localAddressPort,
                name: tunnelOptions.label,
                source: {
                    source: remoteExplorerService_1.TunnelSource.Extension,
                    description: source
                },
                elevateIfNeeded: false
            });
            if (tunnel) {
                if (!this.elevateionRetry
                    && (tunnelOptions.localAddressPort !== undefined)
                    && (tunnel.tunnelLocalPort !== undefined)
                    && (0, tunnel_1.isPortPrivileged)(tunnelOptions.localAddressPort)
                    && (tunnel.tunnelLocalPort !== tunnelOptions.localAddressPort)
                    && this.tunnelService.canElevate) {
                    this.elevationPrompt(tunnelOptions, tunnel, source);
                }
                return extHostTunnelService_1.TunnelDtoConverter.fromServiceTunnel(tunnel);
            }
            return undefined;
        }
        async elevationPrompt(tunnelOptions, tunnel, source) {
            return this.notificationService.prompt(notification_1.Severity.Info, nls.localize('remote.tunnel.openTunnel', "The extension {0} has forwarded port {1}. You'll need to run as superuser to use port {2} locally.", source, tunnelOptions.remoteAddress.port, tunnelOptions.localAddressPort), [{
                    label: nls.localize('remote.tunnelsView.elevationButton', "Use Port {0} as Sudo...", tunnel.tunnelRemotePort),
                    run: async () => {
                        this.elevateionRetry = true;
                        await this.remoteExplorerService.close({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort });
                        await this.remoteExplorerService.forward({
                            remote: tunnelOptions.remoteAddress,
                            local: tunnelOptions.localAddressPort,
                            name: tunnelOptions.label,
                            source: {
                                source: remoteExplorerService_1.TunnelSource.Extension,
                                description: source
                            },
                            elevateIfNeeded: true
                        });
                        this.elevateionRetry = false;
                    }
                }]);
        }
        async $closeTunnel(remote) {
            return this.remoteExplorerService.close(remote);
        }
        async $getTunnels() {
            return (await this.tunnelService.tunnels).map(tunnel => {
                return {
                    remoteAddress: { port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost },
                    localAddress: tunnel.localAddress,
                    privacy: tunnel.privacy,
                    protocol: tunnel.protocol
                };
            });
        }
        async $onFoundNewCandidates(candidates) {
            this.remoteExplorerService.onFoundNewCandidates(candidates);
        }
        async $setTunnelProvider(features) {
            const tunnelProvider = {
                forwardPort: (tunnelOptions, tunnelCreationOptions) => {
                    const forward = this._proxy.$forwardPort(tunnelOptions, tunnelCreationOptions);
                    return forward.then(tunnel => {
                        var _a;
                        this.logService.trace(`ForwardedPorts: (MainThreadTunnelService) New tunnel established by tunnel provider: ${tunnel === null || tunnel === void 0 ? void 0 : tunnel.remoteAddress.host}:${tunnel === null || tunnel === void 0 ? void 0 : tunnel.remoteAddress.port}`);
                        if (!tunnel) {
                            return undefined;
                        }
                        return {
                            tunnelRemotePort: tunnel.remoteAddress.port,
                            tunnelRemoteHost: tunnel.remoteAddress.host,
                            localAddress: typeof tunnel.localAddress === 'string' ? tunnel.localAddress : (0, remoteExplorerService_1.makeAddress)(tunnel.localAddress.host, tunnel.localAddress.port),
                            tunnelLocalPort: typeof tunnel.localAddress !== 'string' ? tunnel.localAddress.port : undefined,
                            public: tunnel.public,
                            privacy: tunnel.privacy,
                            protocol: (_a = tunnel.protocol) !== null && _a !== void 0 ? _a : tunnel_1.TunnelProtocol.Http,
                            dispose: async (silent) => {
                                this.logService.trace(`ForwardedPorts: (MainThreadTunnelService) Closing tunnel from tunnel provider: ${tunnel === null || tunnel === void 0 ? void 0 : tunnel.remoteAddress.host}:${tunnel === null || tunnel === void 0 ? void 0 : tunnel.remoteAddress.port}`);
                                return this._proxy.$closeTunnel({ host: tunnel.remoteAddress.host, port: tunnel.remoteAddress.port }, silent);
                            }
                        };
                    });
                }
            };
            this.tunnelService.setTunnelProvider(tunnelProvider);
            if (features) {
                this.tunnelService.setTunnelFeatures(features);
            }
        }
        async $setCandidateFilter() {
            this.remoteExplorerService.setCandidateFilter((candidates) => {
                return this._proxy.$applyCandidateFilter(candidates);
            });
        }
        async $setCandidatePortSource(source) {
            // Must wait for the remote environment before trying to set settings there.
            this.remoteAgentService.getEnvironment().then(() => {
                switch (source) {
                    case extHost_protocol_1.CandidatePortSource.None: {
                        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                            .registerDefaultConfigurations([{ overrides: { 'remote.autoForwardPorts': false } }]);
                        break;
                    }
                    case extHost_protocol_1.CandidatePortSource.Output: {
                        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                            .registerDefaultConfigurations([{ overrides: { 'remote.autoForwardPortsSource': remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_OUTPUT } }]);
                        break;
                    }
                    default: // Do nothing, the defaults for these settings should be used.
                }
            }).catch(() => {
                // The remote failed to get setup. Errors from that area will already be surfaced to the user.
            });
        }
    };
    MainThreadTunnelService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTunnelService),
        __param(1, remoteExplorerService_1.IRemoteExplorerService),
        __param(2, tunnel_1.ITunnelService),
        __param(3, notification_1.INotificationService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, log_1.ILogService),
        __param(6, remoteAgentService_1.IRemoteAgentService)
    ], MainThreadTunnelService);
    exports.MainThreadTunnelService = MainThreadTunnelService;
});
//# sourceMappingURL=mainThreadTunnelService.js.map