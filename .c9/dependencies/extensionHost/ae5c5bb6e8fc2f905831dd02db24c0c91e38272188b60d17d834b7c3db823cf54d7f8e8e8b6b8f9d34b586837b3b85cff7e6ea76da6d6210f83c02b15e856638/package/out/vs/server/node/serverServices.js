/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/node/id", "vs/base/node/pfs", "vs/base/parts/ipc/common/ipc", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/credentials/common/credentials", "vs/platform/credentials/node/credentialsMainService", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/download/common/download", "vs/platform/download/common/downloadIpc", "vs/platform/encryption/common/encryptionService", "vs/platform/encryption/node/encryptionMainService", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementCLIService", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/localizations/common/localizations", "vs/platform/localizations/node/localizations", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/log/node/spdlogLog", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/request/common/requestIpc", "vs/platform/request/node/requestService", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/appInsightsAppender", "vs/platform/telemetry/node/errorTelemetry", "vs/platform/terminal/common/terminal", "vs/platform/terminal/node/ptyHostService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/server/node/remoteAgentEnvironmentImpl", "vs/server/node/remoteFileSystemProviderServer", "vs/platform/telemetry/common/remoteTelemetryChannel", "vs/platform/telemetry/common/serverTelemetryService", "vs/server/node/remoteTerminalChannel", "vs/workbench/api/node/uriTransformer", "vs/server/node/serverEnvironmentService", "vs/workbench/contrib/terminal/common/remoteTerminalChannel", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/common/remoteFileSystemProviderClient", "vs/server/node/extensionHostStatusService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/server/node/extensionsScannerService"], function (require, exports, os_1, event_1, lifecycle_1, network_1, path, id_1, pfs_1, ipc_1, configuration_1, configurationService_1, credentials_1, credentialsMainService_1, extensionHostDebugIpc_1, download_1, downloadIpc_1, encryptionService_1, encryptionMainService_1, environment_1, extensionGalleryService_1, extensionManagement_1, extensionManagementCLIService_1, extensionManagementIpc_1, extensionManagementService_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, localizations_1, localizations_2, log_1, logIpc_1, spdlogLog_1, product_1, productService_1, request_1, requestIpc_1, requestService_1, commonProperties_1, telemetry_1, telemetryUtils_1, appInsightsAppender_1, errorTelemetry_1, terminal_1, ptyHostService_1, uriIdentity_1, uriIdentityService_1, remoteAgentEnvironmentImpl_1, remoteFileSystemProviderServer_1, remoteTelemetryChannel_1, serverTelemetryService_1, remoteTerminalChannel_1, uriTransformer_1, serverEnvironmentService_1, remoteTerminalChannel_2, remoteAgentService_1, remoteFileSystemProviderClient_1, extensionHostStatusService_1, extensionsScannerService_1, extensionsScannerService_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SocketServer = exports.setupServerServices = void 0;
    const eventPrefix = 'monacoworkbench';
    async function setupServerServices(connectionToken, args, REMOTE_DATA_FOLDER, disposables) {
        var _a;
        const services = new serviceCollection_1.ServiceCollection();
        const socketServer = new SocketServer();
        const productService = Object.assign({ _serviceBrand: undefined }, product_1.default);
        services.set(productService_1.IProductService, productService);
        const environmentService = new serverEnvironmentService_1.ServerEnvironmentService(args, productService);
        services.set(environment_1.IEnvironmentService, environmentService);
        services.set(environment_1.INativeEnvironmentService, environmentService);
        const spdLogService = new log_1.LogService(new spdlogLog_1.SpdLogLogger(remoteAgentService_1.RemoteExtensionLogFileName, path.join(environmentService.logsPath, `${remoteAgentService_1.RemoteExtensionLogFileName}.log`), true, false, (0, log_1.getLogLevel)(environmentService)));
        const logService = new log_1.MultiplexLogService([new ServerLogService((0, log_1.getLogLevel)(environmentService)), spdLogService]);
        services.set(log_1.ILogService, logService);
        setTimeout(() => cleanupOlderLogs(environmentService.logsPath).then(null, err => logService.error(err)), 10000);
        logService.trace(`Remote configuration data at ${REMOTE_DATA_FOLDER}`);
        logService.trace('process arguments:', environmentService.args);
        if (Array.isArray(productService.serverGreeting)) {
            spdLogService.info(`\n\n${productService.serverGreeting.join('\n')}\n\n`);
        }
        // ExtensionHost Debug broadcast service
        socketServer.registerChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName, new extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel());
        // TODO: @Sandy @Joao need dynamic context based router
        const router = new ipc_1.StaticRouter(ctx => ctx.clientId === 'renderer');
        socketServer.registerChannel('logger', new logIpc_1.LogLevelChannel(logService));
        // Files
        const fileService = disposables.add(new fileService_1.FileService(logService));
        services.set(files_1.IFileService, fileService);
        fileService.registerProvider(network_1.Schemas.file, disposables.add(new diskFileSystemProvider_1.DiskFileSystemProvider(logService)));
        const configurationService = new configurationService_1.ConfigurationService(environmentService.machineSettingsResource, fileService);
        services.set(configuration_1.IConfigurationService, configurationService);
        const extensionHostStatusService = new extensionHostStatusService_1.ExtensionHostStatusService();
        services.set(extensionHostStatusService_1.IExtensionHostStatusService, extensionHostStatusService);
        // URI Identity
        services.set(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(fileService));
        // Request
        services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
        let appInsightsAppender = telemetryUtils_1.NullAppender;
        const machineId = await (0, id_1.getMachineId)();
        if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
            if (productService.aiConfig && productService.aiConfig.asimovKey) {
                appInsightsAppender = new appInsightsAppender_1.AppInsightsAppender(eventPrefix, null, productService.aiConfig.asimovKey);
                disposables.add((0, lifecycle_1.toDisposable)(() => appInsightsAppender.flush())); // Ensure the AI appender is disposed so that it flushes remaining data
            }
            const config = {
                appenders: [appInsightsAppender],
                commonProperties: (0, commonProperties_1.resolveCommonProperties)(fileService, (0, os_1.release)(), (0, os_1.hostname)(), process.arch, productService.commit, productService.version + '-remote', machineId, productService.msftInternalDomains, environmentService.installSourcePath, 'remoteAgent'),
                piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService)
            };
            const initialTelemetryLevelArg = environmentService.args['telemetry-level'];
            let injectedTelemetryLevel = 3 /* TelemetryLevel.USAGE */;
            // Convert the passed in CLI argument into a telemetry level for the telemetry service
            if (initialTelemetryLevelArg === 'all') {
                injectedTelemetryLevel = 3 /* TelemetryLevel.USAGE */;
            }
            else if (initialTelemetryLevelArg === 'error') {
                injectedTelemetryLevel = 2 /* TelemetryLevel.ERROR */;
            }
            else if (initialTelemetryLevelArg === 'crash') {
                injectedTelemetryLevel = 1 /* TelemetryLevel.CRASH */;
            }
            else if (initialTelemetryLevelArg !== undefined) {
                injectedTelemetryLevel = 0 /* TelemetryLevel.NONE */;
            }
            services.set(serverTelemetryService_1.IServerTelemetryService, new descriptors_1.SyncDescriptor(serverTelemetryService_1.ServerTelemetryService, [config, injectedTelemetryLevel]));
        }
        else {
            services.set(serverTelemetryService_1.IServerTelemetryService, serverTelemetryService_1.ServerNullTelemetryService);
        }
        services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryServiceWithNoStorageService));
        const downloadChannel = socketServer.getChannel('download', router);
        services.set(download_1.IDownloadService, new downloadIpc_1.DownloadServiceChannelClient(downloadChannel, () => getUriTransformer('renderer') /* TODO: @Sandy @Joao need dynamic context based router */));
        services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService));
        services.set(extensionManagement_1.IExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
        const instantiationService = new instantiationService_1.InstantiationService(services);
        services.set(localizations_1.ILocalizationsService, instantiationService.createInstance(localizations_2.LocalizationsService));
        const extensionManagementCLIService = instantiationService.createInstance(extensionManagementCLIService_1.ExtensionManagementCLIService);
        services.set(extensionManagement_1.IExtensionManagementCLIService, extensionManagementCLIService);
        const ptyService = instantiationService.createInstance(ptyHostService_1.PtyHostService, {
            graceTime: 10800000 /* ProtocolConstants.ReconnectionGraceTime */,
            shortGraceTime: 300000 /* ProtocolConstants.ReconnectionShortGraceTime */,
            scrollback: (_a = configurationService.getValue("terminal.integrated.persistentSessionScrollback" /* TerminalSettingId.PersistentSessionScrollback */)) !== null && _a !== void 0 ? _a : 100
        });
        services.set(terminal_1.IPtyService, ptyService);
        services.set(encryptionService_1.IEncryptionMainService, new descriptors_1.SyncDescriptor(encryptionMainService_1.EncryptionMainService, [machineId]));
        services.set(credentials_1.ICredentialsMainService, new descriptors_1.SyncDescriptor(credentialsMainService_1.CredentialsWebMainService));
        instantiationService.invokeFunction(accessor => {
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const extensionsScannerService = accessor.get(extensionsScannerService_1.IExtensionsScannerService);
            const remoteExtensionEnvironmentChannel = new remoteAgentEnvironmentImpl_1.RemoteAgentEnvironmentChannel(connectionToken, environmentService, extensionManagementCLIService, logService, extensionHostStatusService, extensionsScannerService);
            socketServer.registerChannel('remoteextensionsenvironment', remoteExtensionEnvironmentChannel);
            const telemetryChannel = new remoteTelemetryChannel_1.ServerTelemetryChannel(accessor.get(serverTelemetryService_1.IServerTelemetryService), appInsightsAppender);
            socketServer.registerChannel('telemetry', telemetryChannel);
            socketServer.registerChannel(remoteTerminalChannel_2.REMOTE_TERMINAL_CHANNEL_NAME, new remoteTerminalChannel_1.RemoteTerminalChannel(environmentService, logService, ptyService, productService, extensionManagementService));
            const remoteFileSystemChannel = new remoteFileSystemProviderServer_1.RemoteAgentFileSystemProviderChannel(logService, environmentService);
            socketServer.registerChannel(remoteFileSystemProviderClient_1.REMOTE_FILE_SYSTEM_CHANNEL_NAME, remoteFileSystemChannel);
            socketServer.registerChannel('request', new requestIpc_1.RequestChannel(accessor.get(request_1.IRequestService)));
            const channel = new extensionManagementIpc_1.ExtensionManagementChannel(extensionManagementService, (ctx) => getUriTransformer(ctx.remoteAuthority));
            socketServer.registerChannel('extensions', channel);
            const encryptionChannel = ipc_1.ProxyChannel.fromService(accessor.get(encryptionService_1.IEncryptionMainService));
            socketServer.registerChannel('encryption', encryptionChannel);
            const credentialsChannel = ipc_1.ProxyChannel.fromService(accessor.get(credentials_1.ICredentialsMainService));
            socketServer.registerChannel('credentials', credentialsChannel);
            // clean up deprecated extensions
            extensionManagementService.removeDeprecatedExtensions();
            disposables.add(new errorTelemetry_1.default(accessor.get(telemetry_1.ITelemetryService)));
            return {
                telemetryService: accessor.get(telemetry_1.ITelemetryService)
            };
        });
        return { socketServer, instantiationService };
    }
    exports.setupServerServices = setupServerServices;
    const _uriTransformerCache = Object.create(null);
    function getUriTransformer(remoteAuthority) {
        if (!_uriTransformerCache[remoteAuthority]) {
            _uriTransformerCache[remoteAuthority] = (0, uriTransformer_1.createURITransformer)(remoteAuthority);
        }
        return _uriTransformerCache[remoteAuthority];
    }
    class SocketServer extends ipc_1.IPCServer {
        constructor() {
            const emitter = new event_1.Emitter();
            super(emitter.event);
            this._onDidConnectEmitter = emitter;
        }
        acceptConnection(protocol, onDidClientDisconnect) {
            this._onDidConnectEmitter.fire({ protocol, onDidClientDisconnect });
        }
    }
    exports.SocketServer = SocketServer;
    class ServerLogService extends log_1.AbstractLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.setLevel(logLevel);
            this.useColors = Boolean(process.stdout.isTTY);
        }
        trace(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Trace) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        debug(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Debug) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        info(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Info) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        warn(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Warning) {
                if (this.useColors) {
                    console.warn(`\x1b[93m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.warn(`[${now()}]`, message, ...args);
                }
            }
        }
        error(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Error) {
                if (this.useColors) {
                    console.error(`\x1b[91m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.error(`[${now()}]`, message, ...args);
                }
            }
        }
        critical(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Critical) {
                if (this.useColors) {
                    console.error(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.error(`[${now()}]`, message, ...args);
                }
            }
        }
        dispose() {
            // noop
        }
        flush() {
            // noop
        }
    }
    function now() {
        const date = new Date();
        return `${twodigits(date.getHours())}:${twodigits(date.getMinutes())}:${twodigits(date.getSeconds())}`;
    }
    function twodigits(n) {
        if (n < 10) {
            return `0${n}`;
        }
        return String(n);
    }
    /**
     * Cleans up older logs, while keeping the 10 most recent ones.
     */
    async function cleanupOlderLogs(logsPath) {
        const currentLog = path.basename(logsPath);
        const logsRoot = path.dirname(logsPath);
        const children = await pfs_1.Promises.readdir(logsRoot);
        const allSessions = children.filter(name => /^\d{8}T\d{6}$/.test(name));
        const oldSessions = allSessions.sort().filter((d) => d !== currentLog);
        const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 9));
        await Promise.all(toDelete.map(name => pfs_1.Promises.rm(path.join(logsRoot, name))));
    }
});
//# sourceMappingURL=serverServices.js.map