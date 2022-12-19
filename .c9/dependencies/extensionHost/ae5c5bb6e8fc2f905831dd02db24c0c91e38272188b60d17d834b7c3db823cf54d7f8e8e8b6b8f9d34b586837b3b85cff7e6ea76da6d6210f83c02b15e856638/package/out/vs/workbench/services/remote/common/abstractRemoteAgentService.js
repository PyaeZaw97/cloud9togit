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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/workbench/services/environment/common/environmentService", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/remoteAgentEnvironmentChannel", "vs/base/common/event", "vs/platform/sign/common/sign", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, lifecycle_1, ipc_1, environmentService_1, remoteAgentConnection_1, remoteAuthorityResolver_1, remoteAgentEnvironmentChannel_1, event_1, sign_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentConnection = exports.AbstractRemoteAgentService = void 0;
    let AbstractRemoteAgentService = class AbstractRemoteAgentService extends lifecycle_1.Disposable {
        constructor(socketFactory, _environmentService, productService, _remoteAuthorityResolverService, signService, logService) {
            super();
            this._environmentService = _environmentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this.socketFactory = socketFactory;
            if (this._environmentService.remoteAuthority) {
                this._connection = this._register(new RemoteAgentConnection(this._environmentService.remoteAuthority, productService.commit, this.socketFactory, this._remoteAuthorityResolverService, signService, logService));
            }
            else {
                this._connection = null;
            }
            this._environment = null;
        }
        getConnection() {
            return this._connection;
        }
        getEnvironment() {
            return this.getRawEnvironment().then(undefined, () => null);
        }
        getRawEnvironment() {
            if (!this._environment) {
                this._environment = this._withChannel(async (channel, connection) => {
                    const env = await remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getEnvironmentData(channel, connection.remoteAuthority);
                    this._remoteAuthorityResolverService._setAuthorityConnectionToken(connection.remoteAuthority, env.connectionToken);
                    return env;
                }, null);
            }
            return this._environment;
        }
        getExtensionHostExitInfo(reconnectionToken) {
            return this._withChannel((channel, connection) => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getExtensionHostExitInfo(channel, connection.remoteAuthority, reconnectionToken), null);
        }
        whenExtensionsReady() {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.whenExtensionsReady(channel), undefined);
        }
        scanExtensions(skipExtensions = []) {
            return this._withChannel((channel, connection) => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.scanExtensions(channel, connection.remoteAuthority, this._environmentService.extensionDevelopmentLocationURI, skipExtensions), []).then(undefined, () => []);
        }
        scanSingleExtension(extensionLocation, isBuiltin) {
            return this._withChannel((channel, connection) => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.scanSingleExtension(channel, connection.remoteAuthority, isBuiltin, extensionLocation), null).then(undefined, () => null);
        }
        getDiagnosticInfo(options) {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getDiagnosticInfo(channel, options), undefined);
        }
        updateTelemetryLevel(telemetryLevel) {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.updateTelemetryLevel(channel, telemetryLevel), undefined);
        }
        logTelemetry(eventName, data) {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.logTelemetry(channel, eventName, data), undefined);
        }
        flushTelemetry() {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.flushTelemetry(channel), undefined);
        }
        _withChannel(callback, fallback) {
            const connection = this.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel('remoteextensionsenvironment', (channel) => callback(channel, connection));
        }
        _withTelemetryChannel(callback, fallback) {
            const connection = this.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel('telemetry', (channel) => callback(channel, connection));
        }
    };
    AbstractRemoteAgentService = __decorate([
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, productService_1.IProductService),
        __param(3, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(4, sign_1.ISignService),
        __param(5, log_1.ILogService)
    ], AbstractRemoteAgentService);
    exports.AbstractRemoteAgentService = AbstractRemoteAgentService;
    class RemoteAgentConnection extends lifecycle_1.Disposable {
        constructor(remoteAuthority, _commit, _socketFactory, _remoteAuthorityResolverService, _signService, _logService) {
            super();
            this._commit = _commit;
            this._socketFactory = _socketFactory;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._signService = _signService;
            this._logService = _logService;
            this._onReconnecting = this._register(new event_1.Emitter());
            this.onReconnecting = this._onReconnecting.event;
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.onDidStateChange = this._onDidStateChange.event;
            this.remoteAuthority = remoteAuthority;
            this._connection = null;
        }
        getChannel(channelName) {
            return (0, ipc_1.getDelayedChannel)(this._getOrCreateConnection().then(c => c.getChannel(channelName)));
        }
        withChannel(channelName, callback) {
            const channel = this.getChannel(channelName);
            const result = callback(channel);
            return result;
        }
        registerChannel(channelName, channel) {
            this._getOrCreateConnection().then(client => client.registerChannel(channelName, channel));
        }
        _getOrCreateConnection() {
            if (!this._connection) {
                this._connection = this._createConnection();
            }
            return this._connection;
        }
        async _createConnection() {
            let firstCall = true;
            const options = {
                commit: this._commit,
                socketFactory: this._socketFactory,
                addressProvider: {
                    getAddress: async () => {
                        if (firstCall) {
                            firstCall = false;
                        }
                        else {
                            this._onReconnecting.fire(undefined);
                        }
                        const { authority } = await this._remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority);
                        return { host: authority.host, port: authority.port, connectionToken: authority.connectionToken };
                    }
                },
                signService: this._signService,
                logService: this._logService,
                ipcLogger: false ? new ipc_1.IPCLogger(`Local \u2192 Remote`, `Remote \u2192 Local`) : null
            };
            const connection = this._register(await (0, remoteAgentConnection_1.connectRemoteAgentManagement)(options, this.remoteAuthority, `renderer`));
            connection.protocol.onDidDispose(() => {
                connection.dispose();
            });
            this._register(connection.onDidStateChange(e => this._onDidStateChange.fire(e)));
            return connection.client;
        }
    }
    exports.RemoteAgentConnection = RemoteAgentConnection;
});
//# sourceMappingURL=abstractRemoteAgentService.js.map