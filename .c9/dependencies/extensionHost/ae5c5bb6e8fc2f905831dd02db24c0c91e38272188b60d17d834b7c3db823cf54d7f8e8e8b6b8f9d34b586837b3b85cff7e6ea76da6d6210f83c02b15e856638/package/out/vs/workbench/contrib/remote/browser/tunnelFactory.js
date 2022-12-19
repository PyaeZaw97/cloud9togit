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
define(["require", "exports", "vs/nls", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/log/common/log"], function (require, exports, nls, tunnel_1, lifecycle_1, environmentService_1, opener_1, uri_1, remoteExplorerService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelFactoryContribution = void 0;
    let TunnelFactoryContribution = class TunnelFactoryContribution extends lifecycle_1.Disposable {
        constructor(tunnelService, environmentService, openerService, remoteExplorerService, logService) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            super();
            this.openerService = openerService;
            const tunnelFactory = (_b = (_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.tunnelProvider) === null || _b === void 0 ? void 0 : _b.tunnelFactory;
            if (tunnelFactory) {
                let privacyOptions = (_f = (_e = (_d = (_c = environmentService.options) === null || _c === void 0 ? void 0 : _c.tunnelProvider) === null || _d === void 0 ? void 0 : _d.features) === null || _e === void 0 ? void 0 : _e.privacyOptions) !== null && _f !== void 0 ? _f : [];
                if (((_j = (_h = (_g = environmentService.options) === null || _g === void 0 ? void 0 : _g.tunnelProvider) === null || _h === void 0 ? void 0 : _h.features) === null || _j === void 0 ? void 0 : _j.public)
                    && (privacyOptions.length === 0)) {
                    privacyOptions = [
                        {
                            id: 'private',
                            label: nls.localize('tunnelPrivacy.private', "Private"),
                            themeIcon: 'lock'
                        },
                        {
                            id: 'public',
                            label: nls.localize('tunnelPrivacy.public', "Public"),
                            themeIcon: 'eye'
                        }
                    ];
                }
                this._register(tunnelService.setTunnelProvider({
                    forwardPort: async (tunnelOptions, tunnelCreationOptions) => {
                        var _a, _b;
                        let tunnelPromise;
                        try {
                            tunnelPromise = tunnelFactory(tunnelOptions, tunnelCreationOptions);
                        }
                        catch (e) {
                            logService.trace('tunnelFactory: tunnel provider error');
                        }
                        if (!tunnelPromise) {
                            return undefined;
                        }
                        let tunnel;
                        try {
                            tunnel = await tunnelPromise;
                        }
                        catch (e) {
                            logService.trace('tunnelFactory: tunnel provider promise error');
                            return undefined;
                        }
                        const localAddress = tunnel.localAddress.startsWith('http') ? tunnel.localAddress : `http://${tunnel.localAddress}`;
                        const remoteTunnel = {
                            tunnelRemotePort: tunnel.remoteAddress.port,
                            tunnelRemoteHost: tunnel.remoteAddress.host,
                            // The tunnel factory may give us an inaccessible local address.
                            // To make sure this doesn't happen, resolve the uri immediately.
                            localAddress: await this.resolveExternalUri(localAddress),
                            privacy: (_a = tunnel.privacy) !== null && _a !== void 0 ? _a : (tunnel.public ? tunnel_1.TunnelPrivacyId.Public : tunnel_1.TunnelPrivacyId.Private),
                            protocol: (_b = tunnel.protocol) !== null && _b !== void 0 ? _b : tunnel_1.TunnelProtocol.Http,
                            dispose: async () => { await tunnel.dispose(); }
                        };
                        return remoteTunnel;
                    }
                }));
                const tunnelInformation = ((_l = (_k = environmentService.options) === null || _k === void 0 ? void 0 : _k.tunnelProvider) === null || _l === void 0 ? void 0 : _l.features) ?
                    {
                        features: {
                            elevation: !!((_p = (_o = (_m = environmentService.options) === null || _m === void 0 ? void 0 : _m.tunnelProvider) === null || _o === void 0 ? void 0 : _o.features) === null || _p === void 0 ? void 0 : _p.elevation),
                            public: !!((_s = (_r = (_q = environmentService.options) === null || _q === void 0 ? void 0 : _q.tunnelProvider) === null || _r === void 0 ? void 0 : _r.features) === null || _s === void 0 ? void 0 : _s.public),
                            privacyOptions
                        }
                    } : undefined;
                remoteExplorerService.setTunnelInformation(tunnelInformation);
            }
        }
        async resolveExternalUri(uri) {
            try {
                return (await this.openerService.resolveExternalUri(uri_1.URI.parse(uri))).resolved.toString();
            }
            catch (_a) {
                return uri;
            }
        }
    };
    TunnelFactoryContribution = __decorate([
        __param(0, tunnel_1.ITunnelService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, opener_1.IOpenerService),
        __param(3, remoteExplorerService_1.IRemoteExplorerService),
        __param(4, log_1.ILogService)
    ], TunnelFactoryContribution);
    exports.TunnelFactoryContribution = TunnelFactoryContribution;
});
//# sourceMappingURL=tunnelFactory.js.map