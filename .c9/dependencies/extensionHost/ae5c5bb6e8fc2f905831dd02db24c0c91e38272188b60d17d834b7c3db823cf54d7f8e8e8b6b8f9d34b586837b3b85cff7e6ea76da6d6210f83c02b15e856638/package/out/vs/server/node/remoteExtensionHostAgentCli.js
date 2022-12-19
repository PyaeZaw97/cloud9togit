/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/instantiation/common/descriptors", "vs/platform/configuration/common/configurationService", "vs/platform/configuration/common/configuration", "vs/platform/request/common/request", "vs/platform/request/node/requestService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/instantiation/common/instantiationService", "vs/platform/product/common/product", "vs/base/common/lifecycle", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/log/node/spdlogLog", "vs/workbench/services/remote/common/remoteAgentService", "vs/server/node/serverEnvironmentService", "vs/platform/extensionManagement/common/extensionManagementCLIService", "vs/platform/localizations/common/localizations", "vs/platform/localizations/node/localizations", "vs/base/common/errors", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/process", "vs/platform/download/common/downloadService", "vs/platform/download/common/download", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/environment/node/argv", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/server/node/extensionsScannerService"], function (require, exports, serviceCollection_1, log_1, descriptors_1, configurationService_1, configuration_1, request_1, requestService_1, telemetryUtils_1, telemetry_1, extensionManagement_1, extensionGalleryService_1, extensionManagementService_1, instantiationService_1, product_1, lifecycle_1, fileService_1, diskFileSystemProvider_1, network_1, files_1, productService_1, spdlogLog_1, remoteAgentService_1, serverEnvironmentService_1, extensionManagementCLIService_1, localizations_1, localizations_2, errors_1, uri_1, path_1, process_1, downloadService_1, download_1, uriIdentity_1, uriIdentityService_1, argv_1, platform_1, extensionsScannerService_1, extensionsScannerService_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.run = void 0;
    class CliMain extends lifecycle_1.Disposable {
        constructor(args, remoteDataFolder) {
            super();
            this.args = args;
            this.remoteDataFolder = remoteDataFolder;
            this.registerListeners();
        }
        registerListeners() {
            // Dispose on exit
            process.once('exit', () => this.dispose());
        }
        async run() {
            const instantiationService = await this.initServices();
            await instantiationService.invokeFunction(async (accessor) => {
                const logService = accessor.get(log_1.ILogService);
                const extensionManagementCLIService = accessor.get(extensionManagement_1.IExtensionManagementCLIService);
                try {
                    await this.doRun(extensionManagementCLIService);
                }
                catch (error) {
                    logService.error(error);
                    console.error((0, errors_1.getErrorMessage)(error));
                    throw error;
                }
            });
        }
        async initServices() {
            const services = new serviceCollection_1.ServiceCollection();
            const productService = Object.assign({ _serviceBrand: undefined }, product_1.default);
            services.set(productService_1.IProductService, productService);
            const environmentService = new serverEnvironmentService_1.ServerEnvironmentService(this.args, productService);
            services.set(serverEnvironmentService_1.IServerEnvironmentService, environmentService);
            const logService = new log_1.LogService(new spdlogLog_1.SpdLogLogger(remoteAgentService_1.RemoteExtensionLogFileName, (0, path_1.join)(environmentService.logsPath, `${remoteAgentService_1.RemoteExtensionLogFileName}.log`), true, false, (0, log_1.getLogLevel)(environmentService)));
            services.set(log_1.ILogService, logService);
            logService.trace(`Remote configuration data at ${this.remoteDataFolder}`);
            logService.trace('process arguments:', this.args);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            services.set(files_1.IFileService, fileService);
            fileService.registerProvider(network_1.Schemas.file, this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(logService)));
            // Configuration
            const configurationService = this._register(new configurationService_1.ConfigurationService(environmentService.settingsResource, fileService));
            await configurationService.initialize();
            services.set(configuration_1.IConfigurationService, configurationService);
            services.set(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(fileService));
            services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
            services.set(download_1.IDownloadService, new descriptors_1.SyncDescriptor(downloadService_1.DownloadService));
            services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryServiceWithNoStorageService));
            services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService));
            services.set(extensionManagement_1.IExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
            services.set(extensionManagement_1.IExtensionManagementCLIService, new descriptors_1.SyncDescriptor(extensionManagementCLIService_1.ExtensionManagementCLIService));
            services.set(localizations_1.ILocalizationsService, new descriptors_1.SyncDescriptor(localizations_2.LocalizationsService));
            return new instantiationService_1.InstantiationService(services);
        }
        async doRun(extensionManagementCLIService) {
            // List Extensions
            if (this.args['list-extensions']) {
                return extensionManagementCLIService.listExtensions(!!this.args['show-versions'], this.args['category']);
            }
            // Install Extension
            else if (this.args['install-extension'] || this.args['install-builtin-extension']) {
                const installOptions = { isMachineScoped: !!this.args['do-not-sync'], installPreReleaseVersion: !!this.args['pre-release'] };
                return extensionManagementCLIService.installExtensions(this.asExtensionIdOrVSIX(this.args['install-extension'] || []), this.args['install-builtin-extension'] || [], installOptions, !!this.args['force']);
            }
            // Uninstall Extension
            else if (this.args['uninstall-extension']) {
                return extensionManagementCLIService.uninstallExtensions(this.asExtensionIdOrVSIX(this.args['uninstall-extension']), !!this.args['force']);
            }
            // Locate Extension
            else if (this.args['locate-extension']) {
                return extensionManagementCLIService.locateExtension(this.args['locate-extension']);
            }
        }
        asExtensionIdOrVSIX(inputs) {
            return inputs.map(input => /\.vsix$/i.test(input) ? uri_1.URI.file((0, path_1.isAbsolute)(input) ? input : (0, path_1.join)((0, process_1.cwd)(), input)) : input);
        }
    }
    function eventuallyExit(code) {
        setTimeout(() => process.exit(code), 0);
    }
    async function run(args, REMOTE_DATA_FOLDER, optionDescriptions) {
        if (args.help) {
            const executable = product_1.default.serverApplicationName + (platform_1.isWindows ? '.cmd' : '');
            console.log((0, argv_1.buildHelpMessage)(product_1.default.nameLong, executable, product_1.default.version, optionDescriptions, { noInputFiles: true, noPipe: true }));
            return;
        }
        // Version Info
        if (args.version) {
            console.log((0, argv_1.buildVersionMessage)(product_1.default.version, product_1.default.commit));
            return;
        }
        const cliMain = new CliMain(args, REMOTE_DATA_FOLDER);
        try {
            await cliMain.run();
            eventuallyExit(0);
        }
        catch (err) {
            eventuallyExit(1);
        }
        finally {
            cliMain.dispose();
        }
    }
    exports.run = run;
});
//# sourceMappingURL=remoteExtensionHostAgentCli.js.map