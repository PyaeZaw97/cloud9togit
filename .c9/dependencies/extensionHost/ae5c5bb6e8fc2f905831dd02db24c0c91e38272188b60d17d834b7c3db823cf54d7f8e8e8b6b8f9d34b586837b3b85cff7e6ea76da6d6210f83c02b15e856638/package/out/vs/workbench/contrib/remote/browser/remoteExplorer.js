var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/workbench/services/remote/common/remoteExplorerService", "vs/workbench/contrib/remote/browser/tunnelView", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/environment/common/environmentService", "vs/platform/registry/common/platform", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/contrib/remote/browser/urlFinder", "vs/base/common/severity", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/platform", "vs/platform/tunnel/common/tunnel", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/services/activity/common/activity", "vs/workbench/contrib/remote/browser/remoteIcons", "vs/base/common/event", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService", "vs/workbench/services/host/browser/host", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log"], function (require, exports, nls, lifecycle_1, views_1, remoteExplorerService_1, tunnelView_1, contextkey_1, environmentService_1, platform_1, statusbar_1, urlFinder_1, severity_1, configuration_1, notification_1, opener_1, terminal_1, debug_1, remoteAgentService_1, platform_2, tunnel_1, descriptors_1, viewPaneContainer_1, activity_1, remoteIcons_1, event_1, externalUriOpenerService_1, host_1, configurationRegistry_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutomaticPortForwarding = exports.PortRestore = exports.ForwardedPortsView = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.remote';
    let ForwardedPortsView = class ForwardedPortsView extends lifecycle_1.Disposable {
        constructor(contextKeyService, environmentService, remoteExplorerService, tunnelService, activityService, statusbarService) {
            super();
            this.contextKeyService = contextKeyService;
            this.environmentService = environmentService;
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
            this.activityService = activityService;
            this.statusbarService = statusbarService;
            this._register(platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViewWelcomeContent(remoteExplorerService_1.TUNNEL_VIEW_ID, {
                content: `No forwarded ports. Forward a port to access your running services locally.\n[Forward a Port](command:${tunnelView_1.ForwardPortAction.INLINE_ID})`,
            }));
            this.enableBadgeAndStatusBar();
            this.enableForwardedPortsView();
        }
        async getViewContainer() {
            return platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: remoteExplorerService_1.TUNNEL_VIEW_CONTAINER_ID,
                title: nls.localize('ports', "Ports"),
                icon: remoteIcons_1.portsViewIcon,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [remoteExplorerService_1.TUNNEL_VIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
                storageId: remoteExplorerService_1.TUNNEL_VIEW_CONTAINER_ID,
                hideIfEmpty: true,
                order: 5
            }, 1 /* ViewContainerLocation.Panel */);
        }
        async enableForwardedPortsView() {
            if (this.contextKeyListener) {
                this.contextKeyListener.dispose();
                this.contextKeyListener = undefined;
            }
            const viewEnabled = !!tunnelView_1.forwardedPortsViewEnabled.getValue(this.contextKeyService);
            if (this.environmentService.remoteAuthority && viewEnabled) {
                const viewContainer = await this.getViewContainer();
                const tunnelPanelDescriptor = new tunnelView_1.TunnelPanelDescriptor(new tunnelView_1.TunnelViewModel(this.remoteExplorerService, this.tunnelService), this.environmentService);
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                if (viewContainer) {
                    this.remoteExplorerService.enablePortsFeatures();
                    viewsRegistry.registerViews([tunnelPanelDescriptor], viewContainer);
                }
            }
            else if (this.environmentService.remoteAuthority) {
                this.contextKeyListener = this.contextKeyService.onDidChangeContext(e => {
                    if (e.affectsSome(new Set(tunnelView_1.forwardedPortsViewEnabled.keys()))) {
                        this.enableForwardedPortsView();
                    }
                });
            }
        }
        enableBadgeAndStatusBar() {
            const disposable = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).onViewsRegistered(e => {
                if (e.find(view => view.views.find(viewDescriptor => viewDescriptor.id === remoteExplorerService_1.TUNNEL_VIEW_ID))) {
                    this._register(event_1.Event.debounce(this.remoteExplorerService.tunnelModel.onForwardPort, (_last, e) => e, 50)(() => {
                        this.updateActivityBadge();
                        this.updateStatusBar();
                    }));
                    this._register(event_1.Event.debounce(this.remoteExplorerService.tunnelModel.onClosePort, (_last, e) => e, 50)(() => {
                        this.updateActivityBadge();
                        this.updateStatusBar();
                    }));
                    this.updateActivityBadge();
                    this.updateStatusBar();
                    disposable.dispose();
                }
            });
        }
        async updateActivityBadge() {
            if (this._activityBadge) {
                this._activityBadge.dispose();
            }
            if (this.remoteExplorerService.tunnelModel.forwarded.size > 0) {
                this._activityBadge = this.activityService.showViewActivity(remoteExplorerService_1.TUNNEL_VIEW_ID, {
                    badge: new activity_1.NumberBadge(this.remoteExplorerService.tunnelModel.forwarded.size, n => n === 1 ? nls.localize('1forwardedPort', "1 forwarded port") : nls.localize('nForwardedPorts', "{0} forwarded ports", n))
                });
            }
        }
        updateStatusBar() {
            if (!this.entryAccessor) {
                this._register(this.entryAccessor = this.statusbarService.addEntry(this.entry, 'status.forwardedPorts', 0 /* StatusbarAlignment.LEFT */, 40));
            }
            else {
                this.entryAccessor.update(this.entry);
            }
        }
        get entry() {
            let text;
            let tooltip;
            const count = this.remoteExplorerService.tunnelModel.forwarded.size + this.remoteExplorerService.tunnelModel.detected.size;
            text = `${count}`;
            if (count === 0) {
                tooltip = nls.localize('remote.forwardedPorts.statusbarTextNone', "No Ports Forwarded");
            }
            else {
                const allTunnels = Array.from(this.remoteExplorerService.tunnelModel.forwarded.values());
                allTunnels.push(...Array.from(this.remoteExplorerService.tunnelModel.detected.values()));
                tooltip = nls.localize('remote.forwardedPorts.statusbarTooltip', "Forwarded Ports: {0}", allTunnels.map(forwarded => forwarded.remotePort).join(', '));
            }
            return {
                name: nls.localize('status.forwardedPorts', "Forwarded Ports"),
                text: `$(radio-tower) ${text}`,
                ariaLabel: tooltip,
                tooltip,
                command: `${remoteExplorerService_1.TUNNEL_VIEW_ID}.focus`
            };
        }
    };
    ForwardedPortsView = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, remoteExplorerService_1.IRemoteExplorerService),
        __param(3, tunnel_1.ITunnelService),
        __param(4, activity_1.IActivityService),
        __param(5, statusbar_1.IStatusbarService)
    ], ForwardedPortsView);
    exports.ForwardedPortsView = ForwardedPortsView;
    let PortRestore = class PortRestore {
        constructor(remoteExplorerService, logService) {
            this.remoteExplorerService = remoteExplorerService;
            this.logService = logService;
            if (!this.remoteExplorerService.tunnelModel.environmentTunnelsSet) {
                event_1.Event.once(this.remoteExplorerService.tunnelModel.onEnvironmentTunnelsSet)(async () => {
                    await this.restore();
                });
            }
            else {
                this.restore();
            }
        }
        async restore() {
            this.logService.trace('ForwardedPorts: Doing first restore.');
            return this.remoteExplorerService.restore();
        }
    };
    PortRestore = __decorate([
        __param(0, remoteExplorerService_1.IRemoteExplorerService),
        __param(1, log_1.ILogService)
    ], PortRestore);
    exports.PortRestore = PortRestore;
    let AutomaticPortForwarding = class AutomaticPortForwarding extends lifecycle_1.Disposable {
        constructor(terminalService, notificationService, openerService, externalOpenerService, viewsService, remoteExplorerService, environmentService, contextKeyService, configurationService, debugService, remoteAgentService, tunnelService, hostService, logService) {
            super();
            this.terminalService = terminalService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.externalOpenerService = externalOpenerService;
            this.viewsService = viewsService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.debugService = debugService;
            this.remoteAgentService = remoteAgentService;
            this.tunnelService = tunnelService;
            this.hostService = hostService;
            this.logService = logService;
            if (!this.environmentService.remoteAuthority) {
                return;
            }
            remoteAgentService.getEnvironment().then(environment => {
                if ((environment === null || environment === void 0 ? void 0 : environment.os) !== 3 /* OperatingSystem.Linux */) {
                    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                        .registerDefaultConfigurations([{ overrides: { 'remote.autoForwardPortsSource': remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_OUTPUT } }]);
                    this._register(new OutputAutomaticPortForwarding(terminalService, notificationService, openerService, externalOpenerService, remoteExplorerService, configurationService, debugService, tunnelService, remoteAgentService, hostService, logService, () => false));
                }
                else {
                    const useProc = () => (this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING) === remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_PROCESS);
                    if (useProc()) {
                        this._register(new ProcAutomaticPortForwarding(configurationService, remoteExplorerService, notificationService, openerService, externalOpenerService, tunnelService, hostService, logService));
                    }
                    this._register(new OutputAutomaticPortForwarding(terminalService, notificationService, openerService, externalOpenerService, remoteExplorerService, configurationService, debugService, tunnelService, remoteAgentService, hostService, logService, useProc));
                }
            });
        }
    };
    AutomaticPortForwarding = __decorate([
        __param(0, terminal_1.ITerminalService),
        __param(1, notification_1.INotificationService),
        __param(2, opener_1.IOpenerService),
        __param(3, externalUriOpenerService_1.IExternalUriOpenerService),
        __param(4, views_1.IViewsService),
        __param(5, remoteExplorerService_1.IRemoteExplorerService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, debug_1.IDebugService),
        __param(10, remoteAgentService_1.IRemoteAgentService),
        __param(11, tunnel_1.ITunnelService),
        __param(12, host_1.IHostService),
        __param(13, log_1.ILogService)
    ], AutomaticPortForwarding);
    exports.AutomaticPortForwarding = AutomaticPortForwarding;
    class OnAutoForwardedAction extends lifecycle_1.Disposable {
        constructor(notificationService, remoteExplorerService, openerService, externalOpenerService, tunnelService, hostService, logService) {
            super();
            this.notificationService = notificationService;
            this.remoteExplorerService = remoteExplorerService;
            this.openerService = openerService;
            this.externalOpenerService = externalOpenerService;
            this.tunnelService = tunnelService;
            this.hostService = hostService;
            this.logService = logService;
            this.alreadyOpenedOnce = new Set();
            this.lastNotifyTime = new Date();
            this.lastNotifyTime.setFullYear(this.lastNotifyTime.getFullYear() - 1);
        }
        async doAction(tunnels) {
            var _a, _b;
            this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) Starting action for ${(_a = tunnels[0]) === null || _a === void 0 ? void 0 : _a.tunnelRemotePort}`);
            this.doActionTunnels = tunnels;
            const tunnel = await this.portNumberHeuristicDelay();
            this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) Heuristic chose ${tunnel === null || tunnel === void 0 ? void 0 : tunnel.tunnelRemotePort}`);
            if (tunnel) {
                const allAttributes = await this.remoteExplorerService.tunnelModel.getAttributes([{ port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost }]);
                const attributes = (_b = allAttributes === null || allAttributes === void 0 ? void 0 : allAttributes.get(tunnel.tunnelRemotePort)) === null || _b === void 0 ? void 0 : _b.onAutoForward;
                this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) onAutoForward action is ${attributes}`);
                switch (attributes) {
                    case remoteExplorerService_1.OnPortForward.OpenBrowserOnce: {
                        if (this.alreadyOpenedOnce.has(tunnel.localAddress)) {
                            break;
                        }
                        this.alreadyOpenedOnce.add(tunnel.localAddress);
                        // Intentionally do not break so that the open browser path can be run.
                    }
                    case remoteExplorerService_1.OnPortForward.OpenBrowser: {
                        const address = (0, remoteExplorerService_1.makeAddress)(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                        await tunnelView_1.OpenPortInBrowserAction.run(this.remoteExplorerService.tunnelModel, this.openerService, address);
                        break;
                    }
                    case remoteExplorerService_1.OnPortForward.OpenPreview: {
                        const address = (0, remoteExplorerService_1.makeAddress)(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                        await tunnelView_1.OpenPortInPreviewAction.run(this.remoteExplorerService.tunnelModel, this.openerService, this.externalOpenerService, address);
                        break;
                    }
                    case remoteExplorerService_1.OnPortForward.Silent: break;
                    default: {
                        const elapsed = new Date().getTime() - this.lastNotifyTime.getTime();
                        this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) time elapsed since last notification ${elapsed} ms`);
                        if (elapsed > OnAutoForwardedAction.NOTIFY_COOL_DOWN) {
                            await this.showNotification(tunnel);
                        }
                    }
                }
            }
        }
        hide(removedPorts) {
            var _a;
            if (this.doActionTunnels) {
                this.doActionTunnels = this.doActionTunnels.filter(value => !removedPorts.includes(value.tunnelRemotePort));
            }
            if (this.lastShownPort && removedPorts.indexOf(this.lastShownPort) >= 0) {
                (_a = this.lastNotification) === null || _a === void 0 ? void 0 : _a.close();
            }
        }
        async portNumberHeuristicDelay() {
            this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) Starting heuristic delay`);
            if (!this.doActionTunnels || this.doActionTunnels.length === 0) {
                return;
            }
            this.doActionTunnels = this.doActionTunnels.sort((a, b) => a.tunnelRemotePort - b.tunnelRemotePort);
            const firstTunnel = this.doActionTunnels.shift();
            // Heuristic.
            if (firstTunnel.tunnelRemotePort % 1000 === 0) {
                this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) Heuristic chose tunnel because % 1000: ${firstTunnel.tunnelRemotePort}`);
                this.newerTunnel = firstTunnel;
                return firstTunnel;
                // 9229 is the node inspect port
            }
            else if (firstTunnel.tunnelRemotePort < 10000 && firstTunnel.tunnelRemotePort !== 9229) {
                this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) Heuristic chose tunnel because < 10000: ${firstTunnel.tunnelRemotePort}`);
                this.newerTunnel = firstTunnel;
                return firstTunnel;
            }
            this.logService.trace(`ForwardedPorts: (OnAutoForwardedAction) Waiting for "better" tunnel than ${firstTunnel.tunnelRemotePort}`);
            this.newerTunnel = undefined;
            return new Promise(resolve => {
                setTimeout(() => {
                    var _a;
                    if (this.newerTunnel) {
                        resolve(undefined);
                    }
                    else if ((_a = this.doActionTunnels) === null || _a === void 0 ? void 0 : _a.includes(firstTunnel)) {
                        resolve(firstTunnel);
                    }
                    else {
                        resolve(undefined);
                    }
                }, 3000);
            });
        }
        basicMessage(tunnel) {
            return nls.localize('remote.tunnelsView.automaticForward', "Your application running on port {0} is available.  ", tunnel.tunnelRemotePort);
        }
        linkMessage() {
            return nls.localize({ key: 'remote.tunnelsView.notificationLink2', comment: ['[See all forwarded ports]({0}) is a link. Only translate `See all forwarded ports`. Do not change brackets and parentheses or {0}'] }, "[See all forwarded ports]({0})", `command:${tunnelView_1.TunnelPanel.ID}.focus`);
        }
        async showNotification(tunnel) {
            if (!await this.hostService.hadLastFocus()) {
                return;
            }
            if (this.lastNotification) {
                this.lastNotification.close();
            }
            let message = this.basicMessage(tunnel);
            const choices = [this.openBrowserChoice(tunnel)];
            if (!platform_2.isWeb) {
                choices.push(this.openPreviewChoice(tunnel));
            }
            if ((tunnel.tunnelLocalPort !== tunnel.tunnelRemotePort) && this.tunnelService.canElevate && (0, tunnel_1.isPortPrivileged)(tunnel.tunnelRemotePort)) {
                // Privileged ports are not on Windows, so it's safe to use "superuser"
                message += nls.localize('remote.tunnelsView.elevationMessage', "You'll need to run as superuser to use port {0} locally.  ", tunnel.tunnelRemotePort);
                choices.unshift(this.elevateChoice(tunnel));
            }
            message += this.linkMessage();
            this.lastNotification = this.notificationService.prompt(severity_1.default.Info, message, choices, { neverShowAgain: { id: 'remote.tunnelsView.autoForwardNeverShow', isSecondary: true } });
            this.lastShownPort = tunnel.tunnelRemotePort;
            this.lastNotifyTime = new Date();
            this.lastNotification.onDidClose(() => {
                this.lastNotification = undefined;
                this.lastShownPort = undefined;
            });
        }
        openBrowserChoice(tunnel) {
            const address = (0, remoteExplorerService_1.makeAddress)(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
            return {
                label: tunnelView_1.OpenPortInBrowserAction.LABEL,
                run: () => tunnelView_1.OpenPortInBrowserAction.run(this.remoteExplorerService.tunnelModel, this.openerService, address)
            };
        }
        openPreviewChoice(tunnel) {
            const address = (0, remoteExplorerService_1.makeAddress)(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
            return {
                label: tunnelView_1.OpenPortInPreviewAction.LABEL,
                run: () => tunnelView_1.OpenPortInPreviewAction.run(this.remoteExplorerService.tunnelModel, this.openerService, this.externalOpenerService, address)
            };
        }
        elevateChoice(tunnel) {
            return {
                // Privileged ports are not on Windows, so it's ok to stick to just "sudo".
                label: nls.localize('remote.tunnelsView.elevationButton', "Use Port {0} as Sudo...", tunnel.tunnelRemotePort),
                run: async () => {
                    await this.remoteExplorerService.close({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort });
                    const newTunnel = await this.remoteExplorerService.forward({
                        remote: { host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort },
                        local: tunnel.tunnelRemotePort,
                        elevateIfNeeded: true,
                        source: remoteExplorerService_1.AutoTunnelSource
                    });
                    if (!newTunnel) {
                        return;
                    }
                    if (this.lastNotification) {
                        this.lastNotification.close();
                    }
                    this.lastShownPort = newTunnel.tunnelRemotePort;
                    this.lastNotification = this.notificationService.prompt(severity_1.default.Info, this.basicMessage(newTunnel) + this.linkMessage(), [this.openBrowserChoice(newTunnel), this.openPreviewChoice(tunnel)], { neverShowAgain: { id: 'remote.tunnelsView.autoForwardNeverShow', isSecondary: true } });
                    this.lastNotification.onDidClose(() => {
                        this.lastNotification = undefined;
                        this.lastShownPort = undefined;
                    });
                }
            };
        }
    }
    OnAutoForwardedAction.NOTIFY_COOL_DOWN = 5000; // milliseconds
    class OutputAutomaticPortForwarding extends lifecycle_1.Disposable {
        constructor(terminalService, notificationService, openerService, externalOpenerService, remoteExplorerService, configurationService, debugService, tunnelService, remoteAgentService, hostService, logService, privilegedOnly) {
            super();
            this.terminalService = terminalService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.externalOpenerService = externalOpenerService;
            this.remoteExplorerService = remoteExplorerService;
            this.configurationService = configurationService;
            this.debugService = debugService;
            this.tunnelService = tunnelService;
            this.remoteAgentService = remoteAgentService;
            this.hostService = hostService;
            this.logService = logService;
            this.privilegedOnly = privilegedOnly;
            this.notifier = new OnAutoForwardedAction(notificationService, remoteExplorerService, openerService, externalOpenerService, tunnelService, hostService, logService);
            this._register(configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING)) {
                    this.tryStartStopUrlFinder();
                }
            }));
            this.portsFeatures = this._register(this.remoteExplorerService.onEnabledPortsFeatures(() => {
                this.tryStartStopUrlFinder();
            }));
            this.tryStartStopUrlFinder();
        }
        tryStartStopUrlFinder() {
            if (this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING)) {
                this.startUrlFinder();
            }
            else {
                this.stopUrlFinder();
            }
        }
        startUrlFinder() {
            if (!this.urlFinder && !this.remoteExplorerService.portsFeaturesEnabled) {
                return;
            }
            if (this.portsFeatures) {
                this.portsFeatures.dispose();
            }
            this.urlFinder = this._register(new urlFinder_1.UrlFinder(this.terminalService, this.debugService));
            this._register(this.urlFinder.onDidMatchLocalUrl(async (localUrl) => {
                var _a, _b;
                if ((0, remoteExplorerService_1.mapHasAddressLocalhostOrAllInterfaces)(this.remoteExplorerService.tunnelModel.detected, localUrl.host, localUrl.port)) {
                    return;
                }
                const attributes = (_a = (await this.remoteExplorerService.tunnelModel.getAttributes([localUrl]))) === null || _a === void 0 ? void 0 : _a.get(localUrl.port);
                if ((attributes === null || attributes === void 0 ? void 0 : attributes.onAutoForward) === remoteExplorerService_1.OnPortForward.Ignore) {
                    return;
                }
                if (this.privilegedOnly() && !(0, tunnel_1.isPortPrivileged)(localUrl.port, (_b = (await this.remoteAgentService.getEnvironment())) === null || _b === void 0 ? void 0 : _b.os)) {
                    return;
                }
                const forwarded = await this.remoteExplorerService.forward({ remote: localUrl, source: remoteExplorerService_1.AutoTunnelSource }, attributes !== null && attributes !== void 0 ? attributes : null);
                if (forwarded) {
                    this.notifier.doAction([forwarded]);
                }
            }));
        }
        stopUrlFinder() {
            if (this.urlFinder) {
                this.urlFinder.dispose();
                this.urlFinder = undefined;
            }
        }
    }
    class ProcAutomaticPortForwarding extends lifecycle_1.Disposable {
        constructor(configurationService, remoteExplorerService, notificationService, openerService, externalOpenerService, tunnelService, hostService, logService) {
            super();
            this.configurationService = configurationService;
            this.remoteExplorerService = remoteExplorerService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.externalOpenerService = externalOpenerService;
            this.tunnelService = tunnelService;
            this.hostService = hostService;
            this.logService = logService;
            this.autoForwarded = new Set();
            this.notifiedOnly = new Set();
            this.initialCandidates = new Set();
            this.notifier = new OnAutoForwardedAction(notificationService, remoteExplorerService, openerService, externalOpenerService, tunnelService, hostService, logService);
            this.initialize();
        }
        async initialize() {
            if (!this.remoteExplorerService.tunnelModel.environmentTunnelsSet) {
                await new Promise(resolve => this.remoteExplorerService.tunnelModel.onEnvironmentTunnelsSet(() => resolve()));
            }
            this._register(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING)) {
                    await this.startStopCandidateListener();
                }
            }));
            this.portsFeatures = this._register(this.remoteExplorerService.onEnabledPortsFeatures(async () => {
                await this.startStopCandidateListener();
            }));
            this.startStopCandidateListener();
        }
        async startStopCandidateListener() {
            if (this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING)) {
                await this.startCandidateListener();
            }
            else {
                this.stopCandidateListener();
            }
        }
        stopCandidateListener() {
            if (this.candidateListener) {
                this.candidateListener.dispose();
                this.candidateListener = undefined;
            }
        }
        async startCandidateListener() {
            if (this.candidateListener || !this.remoteExplorerService.portsFeaturesEnabled) {
                return;
            }
            if (this.portsFeatures) {
                this.portsFeatures.dispose();
            }
            // Capture list of starting candidates so we don't auto forward them later.
            await this.setInitialCandidates();
            // Need to check the setting again, since it may have changed while we waited for the initial candidates to be set.
            if (this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING)) {
                this.candidateListener = this._register(this.remoteExplorerService.tunnelModel.onCandidatesChanged(this.handleCandidateUpdate, this));
            }
        }
        async setInitialCandidates() {
            let startingCandidates = this.remoteExplorerService.tunnelModel.candidatesOrUndefined;
            if (!startingCandidates) {
                await new Promise(resolve => this.remoteExplorerService.tunnelModel.onCandidatesChanged(() => resolve()));
                startingCandidates = this.remoteExplorerService.tunnelModel.candidates;
            }
            for (const value of startingCandidates) {
                this.initialCandidates.add((0, remoteExplorerService_1.makeAddress)(value.host, value.port));
            }
        }
        async forwardCandidates() {
            let attributes;
            const allTunnels = [];
            for (const value of this.remoteExplorerService.tunnelModel.candidates) {
                if (!value.detail) {
                    continue;
                }
                const address = (0, remoteExplorerService_1.makeAddress)(value.host, value.port);
                if (this.initialCandidates.has(address)) {
                    continue;
                }
                if (this.notifiedOnly.has(address) || this.autoForwarded.has(address)) {
                    continue;
                }
                const alreadyForwarded = (0, remoteExplorerService_1.mapHasAddressLocalhostOrAllInterfaces)(this.remoteExplorerService.tunnelModel.forwarded, value.host, value.port);
                if ((0, remoteExplorerService_1.mapHasAddressLocalhostOrAllInterfaces)(this.remoteExplorerService.tunnelModel.detected, value.host, value.port)) {
                    continue;
                }
                if (!attributes) {
                    attributes = await this.remoteExplorerService.tunnelModel.getAttributes(this.remoteExplorerService.tunnelModel.candidates);
                }
                const portAttributes = attributes === null || attributes === void 0 ? void 0 : attributes.get(value.port);
                if ((portAttributes === null || portAttributes === void 0 ? void 0 : portAttributes.onAutoForward) === remoteExplorerService_1.OnPortForward.Ignore) {
                    continue;
                }
                const forwarded = await this.remoteExplorerService.forward({ remote: value, source: remoteExplorerService_1.AutoTunnelSource }, portAttributes !== null && portAttributes !== void 0 ? portAttributes : null);
                if (!alreadyForwarded && forwarded) {
                    this.autoForwarded.add(address);
                }
                else if (forwarded) {
                    this.notifiedOnly.add(address);
                }
                if (forwarded) {
                    allTunnels.push(forwarded);
                }
            }
            if (allTunnels.length === 0) {
                return undefined;
            }
            return allTunnels;
        }
        async handleCandidateUpdate(removed) {
            const removedPorts = [];
            for (const removedPort of removed) {
                const key = removedPort[0];
                const value = removedPort[1];
                if (this.autoForwarded.has(key)) {
                    await this.remoteExplorerService.close(value);
                    this.autoForwarded.delete(key);
                    removedPorts.push(value.port);
                }
                else if (this.notifiedOnly.has(key)) {
                    this.notifiedOnly.delete(key);
                    removedPorts.push(value.port);
                }
                else if (this.initialCandidates.has(key)) {
                    this.initialCandidates.delete(key);
                }
            }
            if (removedPorts.length > 0) {
                await this.notifier.hide(removedPorts);
            }
            const tunnels = await this.forwardCandidates();
            if (tunnels) {
                await this.notifier.doAction(tunnels);
            }
        }
    }
});
//# sourceMappingURL=remoteExplorer.js.map