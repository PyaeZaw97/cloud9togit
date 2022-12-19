/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/performance", "vs/base/browser/dom", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/log/browser/log", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/browser/workbench", "vs/workbench/services/remote/common/remoteFileSystemProviderClient", "vs/platform/product/common/productService", "vs/platform/product/common/product", "vs/workbench/services/remote/browser/remoteAgentService", "vs/platform/remote/browser/remoteAuthorityResolverService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/files/common/files", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/configuration", "vs/base/common/errors", "vs/base/browser/browser", "vs/base/common/uri", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/configuration/common/configurationCache", "vs/platform/sign/common/sign", "vs/platform/sign/browser/signService", "vs/platform/storage/browser/storageService", "vs/platform/storage/common/storage", "vs/platform/log/common/bufferLog", "vs/platform/log/common/fileLog", "vs/base/common/date", "vs/platform/window/common/window", "vs/workbench/services/workspaces/browser/workspaces", "vs/base/common/arrays", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/commands/common/commands", "vs/platform/files/browser/indexedDBFileSystemProvider", "vs/workbench/services/request/browser/requestService", "vs/platform/request/common/request", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/actions/common/actions", "vs/nls", "vs/workbench/common/actions", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/host/browser/host", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/browser/window", "vs/workbench/services/timer/browser/timerService", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/platform/workspace/common/workspaceTrust", "vs/platform/files/browser/htmlFileSystemProvider", "vs/platform/opener/common/opener", "vs/base/common/objects", "vs/platform/credentials/common/credentials", "vs/base/browser/indexedDB", "vs/workbench/services/credentials/browser/credentialsService", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/telemetry/common/telemetry", "vs/platform/progress/common/progress"], function (require, exports, performance_1, dom_1, serviceCollection_1, log_1, log_2, lifecycle_1, environmentService_1, workbench_1, remoteFileSystemProviderClient_1, productService_1, product_1, remoteAgentService_1, remoteAuthorityResolverService_1, remoteAuthorityResolver_1, remoteAgentService_2, files_1, fileService_1, network_1, workspace_1, configuration_1, errors_1, browser_1, uri_1, configurationService_1, configurationCache_1, sign_1, signService_1, storageService_1, storage_1, bufferLog_1, fileLog_1, date_1, window_1, workspaces_1, arrays_1, inMemoryFilesystemProvider_1, commands_1, indexedDBFileSystemProvider_1, requestService_1, request_1, userDataInit_1, userDataSyncStoreService_1, userDataSync_1, lifecycle_2, actions_1, nls_1, actions_2, dialogs_1, host_1, uriIdentity_1, uriIdentityService_1, window_2, timerService_1, workspaceTrust_1, workspaceTrust_2, htmlFileSystemProvider_1, opener_1, objects_1, credentials_1, indexedDB_1, credentialsService_1, webFileSystemAccess_1, telemetry_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserMain = void 0;
    class BrowserMain extends lifecycle_1.Disposable {
        constructor(domElement, configuration) {
            super();
            this.domElement = domElement;
            this.configuration = configuration;
            this.onWillShutdownDisposables = this._register(new lifecycle_1.DisposableStore());
            this.init();
        }
        init() {
            // Browser config
            (0, browser_1.setFullscreen)(!!(0, dom_1.detectFullscreen)());
        }
        async open() {
            // Init services and wait for DOM to be ready in parallel
            const [services] = await Promise.all([this.initServices(), (0, dom_1.domContentLoaded)()]);
            // Create Workbench
            const workbench = new workbench_1.Workbench(this.domElement, undefined, services.serviceCollection, services.logService);
            // Listeners
            this.registerListeners(workbench);
            // Startup
            const instantiationService = workbench.startup();
            // Window
            this._register(instantiationService.createInstance(window_2.BrowserWindow));
            // Logging
            services.logService.trace('workbench#open with configuration', (0, objects_1.safeStringify)(this.configuration));
            // Return API Facade
            return instantiationService.invokeFunction(accessor => {
                const commandService = accessor.get(commands_1.ICommandService);
                const lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
                const timerService = accessor.get(timerService_1.ITimerService);
                const openerService = accessor.get(opener_1.IOpenerService);
                const productService = accessor.get(productService_1.IProductService);
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                const progessService = accessor.get(progress_1.IProgressService);
                return {
                    commands: {
                        executeCommand: (command, ...args) => commandService.executeCommand(command, ...args)
                    },
                    env: {
                        telemetryLevel: telemetryService.telemetryLevel,
                        async getUriScheme() {
                            return productService.urlProtocol;
                        },
                        async retrievePerformanceMarks() {
                            await timerService.whenReady();
                            return timerService.getPerformanceMarks();
                        },
                        async openUri(uri) {
                            return openerService.open(uri, {});
                        }
                    },
                    window: {
                        withProgress: (options, task) => progessService.withProgress(options, task)
                    },
                    shutdown: () => lifecycleService.shutdown()
                };
            });
        }
        registerListeners(workbench) {
            // Workbench Lifecycle
            this._register(workbench.onWillShutdown(() => this.onWillShutdownDisposables.clear()));
            this._register(workbench.onDidShutdown(() => this.dispose()));
        }
        async initServices() {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const payload = this.resolveWorkspaceInitializationPayload();
            // Product
            const productService = (0, objects_1.mixin)(Object.assign({ _serviceBrand: undefined }, product_1.default), this.configuration.productConfiguration);
            serviceCollection.set(productService_1.IProductService, productService);
            // Environment
            const logsPath = uri_1.URI.file((0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')).with({ scheme: 'vscode-log' });
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService(payload.id, logsPath, this.configuration, productService);
            serviceCollection.set(environmentService_1.IBrowserWorkbenchEnvironmentService, environmentService);
            // Log
            const logService = new bufferLog_1.BufferLogService((0, log_1.getLogLevel)(environmentService));
            serviceCollection.set(log_1.ILogService, logService);
            // Remote
            const connectionToken = environmentService.options.connectionToken || (0, dom_1.getCookieValue)(network_1.connectionTokenCookieName);
            const remoteAuthorityResolverService = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(connectionToken, this.configuration.resourceUriProvider);
            serviceCollection.set(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, remoteAuthorityResolverService);
            // Signing
            const signService = new signService_1.SignService(connectionToken);
            serviceCollection.set(sign_1.ISignService, signService);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Remote Agent
            const remoteAgentService = this._register(new remoteAgentService_1.RemoteAgentService(this.configuration.webSocketFactory, environmentService, productService, remoteAuthorityResolverService, signService, logService));
            serviceCollection.set(remoteAgentService_2.IRemoteAgentService, remoteAgentService);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            serviceCollection.set(files_1.IWorkbenchFileService, fileService);
            await this.registerFileSystemProviders(environmentService, fileService, remoteAgentService, logService, logsPath);
            // URI Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            serviceCollection.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // Long running services (workspace, config, storage)
            const [configurationService, storageService] = await Promise.all([
                this.createWorkspaceService(payload, environmentService, fileService, remoteAgentService, uriIdentityService, logService).then(service => {
                    // Workspace
                    serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                    // Configuration
                    serviceCollection.set(configuration_1.IWorkbenchConfigurationService, service);
                    return service;
                }),
                this.createStorageService(payload, logService).then(service => {
                    // Storage
                    serviceCollection.set(storage_1.IStorageService, service);
                    return service;
                })
            ]);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Workspace Trust Service
            const workspaceTrustEnablementService = new workspaceTrust_1.WorkspaceTrustEnablementService(configurationService, environmentService);
            serviceCollection.set(workspaceTrust_2.IWorkspaceTrustEnablementService, workspaceTrustEnablementService);
            const workspaceTrustManagementService = new workspaceTrust_1.WorkspaceTrustManagementService(configurationService, remoteAuthorityResolverService, storageService, uriIdentityService, environmentService, configurationService, workspaceTrustEnablementService);
            serviceCollection.set(workspaceTrust_2.IWorkspaceTrustManagementService, workspaceTrustManagementService);
            // Update workspace trust so that configuration is updated accordingly
            configurationService.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted());
            this._register(workspaceTrustManagementService.onDidChangeTrust(() => configurationService.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted())));
            // Request Service
            const requestService = new requestService_1.BrowserRequestService(remoteAgentService, configurationService, logService);
            serviceCollection.set(request_1.IRequestService, requestService);
            // Userdata Sync Store Management Service
            const userDataSyncStoreManagementService = new userDataSyncStoreService_1.UserDataSyncStoreManagementService(productService, configurationService, storageService);
            serviceCollection.set(userDataSync_1.IUserDataSyncStoreManagementService, userDataSyncStoreManagementService);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Credentials Service
            const credentialsService = new credentialsService_1.BrowserCredentialsService(environmentService, remoteAgentService, productService);
            serviceCollection.set(credentials_1.ICredentialsService, credentialsService);
            // Userdata Initialize Service
            const userDataInitializationService = new userDataInit_1.UserDataInitializationService(environmentService, credentialsService, userDataSyncStoreManagementService, fileService, storageService, productService, requestService, logService, uriIdentityService);
            serviceCollection.set(userDataInit_1.IUserDataInitializationService, userDataInitializationService);
            if (await userDataInitializationService.requiresInitialization()) {
                (0, performance_1.mark)('code/willInitRequiredUserData');
                // Initialize required resources - settings & global state
                await userDataInitializationService.initializeRequiredResources();
                // Important: Reload only local user configuration after initializing
                // Reloading complete configuration blocks workbench until remote configuration is loaded.
                await configurationService.reloadLocalUserConfiguration();
                (0, performance_1.mark)('code/didInitRequiredUserData');
            }
            return { serviceCollection, configurationService, logService };
        }
        async registerFileSystemProviders(environmentService, fileService, remoteAgentService, logService, logsPath) {
            // IndexedDB is used for logging and user data
            let indexedDB;
            const userDataStore = 'vscode-userdata-store';
            const logsStore = 'vscode-logs-store';
            const handlesStore = 'vscode-filehandles-store';
            try {
                indexedDB = await indexedDB_1.IndexedDB.create('vscode-web-db', 3, [userDataStore, logsStore, handlesStore]);
                // Close onWillShutdown
                this.onWillShutdownDisposables.add((0, lifecycle_1.toDisposable)(() => indexedDB === null || indexedDB === void 0 ? void 0 : indexedDB.close()));
            }
            catch (error) {
                logService.error('Error while creating IndexedDB', error);
            }
            // Logger
            if (indexedDB) {
                fileService.registerProvider(logsPath.scheme, new indexedDBFileSystemProvider_1.IndexedDBFileSystemProvider(logsPath.scheme, indexedDB, logsStore, false));
            }
            else {
                fileService.registerProvider(logsPath.scheme, new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            }
            logService.logger = new log_1.MultiplexLogService((0, arrays_1.coalesce)([
                new log_1.ConsoleLogger(logService.getLevel()),
                new fileLog_1.FileLogger('window', environmentService.logFile, logService.getLevel(), false, fileService),
                // Extension development test CLI: forward everything to test runner
                environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI ? new log_2.ConsoleLogInAutomationLogger(logService.getLevel()) : undefined
            ]));
            // User data
            let userDataProvider;
            if (indexedDB) {
                userDataProvider = new indexedDBFileSystemProvider_1.IndexedDBFileSystemProvider(logsPath.scheme, indexedDB, userDataStore, false);
                this.registerDeveloperActions(userDataProvider);
            }
            else {
                logService.info('Using in-memory user data provider');
                userDataProvider = new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider();
            }
            fileService.registerProvider(network_1.Schemas.vscodeUserData, userDataProvider);
            // Remote file system
            this._register(remoteFileSystemProviderClient_1.RemoteFileSystemProviderClient.register(remoteAgentService, fileService, logService));
            // Local file access (if supported by browser)
            if (webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
                fileService.registerProvider(network_1.Schemas.file, new htmlFileSystemProvider_1.HTMLFileSystemProvider(indexedDB, handlesStore, logService));
            }
            // In-memory
            fileService.registerProvider(network_1.Schemas.tmp, new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
        }
        registerDeveloperActions(provider) {
            (0, actions_1.registerAction2)(class ResetUserDataAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.resetUserData',
                        title: { original: 'Reset User Data', value: (0, nls_1.localize)('reset', "Reset User Data") },
                        category: actions_2.CATEGORIES.Developer,
                        menu: {
                            id: actions_1.MenuId.CommandPalette
                        }
                    });
                }
                async run(accessor) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const hostService = accessor.get(host_1.IHostService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const credentialsService = accessor.get(credentials_1.ICredentialsService);
                    const logService = accessor.get(log_1.ILogService);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)('reset user data message', "Would you like to reset your data (settings, keybindings, extensions, snippets and UI State) and reload?")
                    });
                    if (result.confirmed) {
                        try {
                            await (provider === null || provider === void 0 ? void 0 : provider.reset());
                            if (storageService instanceof storageService_1.BrowserStorageService) {
                                await storageService.clear();
                            }
                            if (typeof credentialsService.clear === 'function') {
                                await credentialsService.clear();
                            }
                        }
                        catch (error) {
                            logService.error(error);
                            throw error;
                        }
                    }
                    hostService.reload();
                }
            });
        }
        async createStorageService(payload, logService) {
            const storageService = new storageService_1.BrowserStorageService(payload, logService);
            try {
                await storageService.initialize();
                // Register to close on shutdown
                this.onWillShutdownDisposables.add((0, lifecycle_1.toDisposable)(() => storageService.close()));
                return storageService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                logService.error(error);
                return storageService;
            }
        }
        async createWorkspaceService(payload, environmentService, fileService, remoteAgentService, uriIdentityService, logService) {
            const configurationCache = new configurationCache_1.ConfigurationCache([network_1.Schemas.file, network_1.Schemas.vscodeUserData, network_1.Schemas.tmp] /* Cache all non native resources */, environmentService, fileService);
            const workspaceService = new configurationService_1.WorkspaceService({ remoteAuthority: this.configuration.remoteAuthority, configurationCache }, environmentService, fileService, remoteAgentService, uriIdentityService, logService);
            try {
                await workspaceService.initialize(payload);
                return workspaceService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                logService.error(error);
                return workspaceService;
            }
        }
        resolveWorkspaceInitializationPayload() {
            let workspace = undefined;
            if (this.configuration.workspaceProvider) {
                workspace = this.configuration.workspaceProvider.workspace;
            }
            // Multi-root workspace
            if (workspace && (0, window_1.isWorkspaceToOpen)(workspace)) {
                return (0, workspaces_1.getWorkspaceIdentifier)(workspace.workspaceUri);
            }
            // Single-folder workspace
            if (workspace && (0, window_1.isFolderToOpen)(workspace)) {
                return (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(workspace.folderUri);
            }
            return { id: 'empty-window' };
        }
    }
    exports.BrowserMain = BrowserMain;
});
//# sourceMappingURL=web.main.js.map