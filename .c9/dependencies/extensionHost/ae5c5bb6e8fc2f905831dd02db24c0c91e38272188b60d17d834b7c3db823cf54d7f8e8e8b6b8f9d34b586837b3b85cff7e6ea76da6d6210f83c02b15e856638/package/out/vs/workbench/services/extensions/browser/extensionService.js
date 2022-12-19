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
define(["require", "exports", "vs/nls", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/workbench/services/extensions/common/remoteExtensionHost", "vs/platform/notification/common/notification", "vs/workbench/services/extensions/browser/webWorkerExtensionHost", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/browser/webWorkerFileSystemProvider", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/log/common/log"], function (require, exports, nls, environmentService_1, extensionManagement_1, remoteAgentService_1, instantiation_1, telemetry_1, extensions_1, extensions_2, files_1, productService_1, abstractExtensionService_1, remoteExtensionHost_1, notification_1, webWorkerExtensionHost_1, configuration_1, extensions_3, webWorkerFileSystemProvider_1, network_1, lifecycle_1, remoteAuthorityResolver_1, lifecycle_2, extensionManagement_2, workspace_1, extensionManifestPropertiesService_1, userDataInit_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionService = void 0;
    let ExtensionService = class ExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, webExtensionsScannerService, logService, remoteAgentService, _remoteAuthorityResolverService, _lifecycleService, _userDataInitializationService) {
            super(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, webExtensionsScannerService, logService, remoteAgentService);
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._lifecycleService = _lifecycleService;
            this._userDataInitializationService = _userDataInitializationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._remoteInitData = null;
            // Initialize installed extensions first and do it only after workbench is ready
            this._lifecycleService.when(2 /* LifecyclePhase.Ready */).then(async () => {
                await this._userDataInitializationService.initializeInstalledExtensions(this._instantiationService);
                this._initialize();
            });
            this._initFetchFileSystem();
        }
        dispose() {
            this._disposables.dispose();
            super.dispose();
        }
        async _scanSingleExtension(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this._remoteAgentService.scanSingleExtension(extension.location, extension.type === 0 /* ExtensionType.System */);
            }
            const scannedExtension = await this._webExtensionsScannerService.scanExistingExtension(extension.location, extension.type);
            if (scannedExtension) {
                return (0, extensions_1.toExtensionDescription)(scannedExtension);
            }
            return null;
        }
        _initFetchFileSystem() {
            const provider = new webWorkerFileSystemProvider_1.FetchFileSystemProvider();
            this._disposables.add(this._fileService.registerProvider(network_1.Schemas.http, provider));
            this._disposables.add(this._fileService.registerProvider(network_1.Schemas.https, provider));
        }
        _createLocalExtensionHostDataProvider(desiredRunningLocation) {
            return {
                getInitData: async () => {
                    const allExtensions = await this.getExtensions();
                    const localWebWorkerExtensions = this._filterByRunningLocation(allExtensions, desiredRunningLocation);
                    return {
                        autoStart: true,
                        allExtensions: allExtensions,
                        myExtensions: localWebWorkerExtensions.map(extension => extension.identifier)
                    };
                }
            };
        }
        _createRemoteExtensionHostDataProvider(remoteAuthority) {
            return {
                remoteAuthority: remoteAuthority,
                getInitData: async () => {
                    await this.whenInstalledExtensionsRegistered();
                    return this._remoteInitData;
                }
            };
        }
        _pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = ExtensionService.pickRunningLocation(extensionKinds, isInstalledLocally, isInstalledRemotely, preference);
            this._logService.trace(`pickRunningLocation for ${extensionId.value}, extension kinds: [${extensionKinds.join(', ')}], isInstalledLocally: ${isInstalledLocally}, isInstalledRemotely: ${isInstalledRemotely}, preference: ${(0, abstractExtensionService_1.extensionRunningPreferenceToString)(preference)} => ${(0, extensions_1.extensionHostKindToString)(result)}`);
            return result;
        }
        static pickRunningLocation(extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = [];
            let canRunRemotely = false;
            for (const extensionKind of extensionKinds) {
                if (extensionKind === 'ui' && isInstalledRemotely) {
                    // ui extensions run remotely if possible (but only as a last resort)
                    if (preference === 2 /* ExtensionRunningPreference.Remote */) {
                        return 3 /* ExtensionHostKind.Remote */;
                    }
                    else {
                        canRunRemotely = true;
                    }
                }
                if (extensionKind === 'workspace' && isInstalledRemotely) {
                    // workspace extensions run remotely if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 2 /* ExtensionRunningPreference.Remote */) {
                        return 3 /* ExtensionHostKind.Remote */;
                    }
                    else {
                        result.push(3 /* ExtensionHostKind.Remote */);
                    }
                }
                if (extensionKind === 'web' && (isInstalledLocally || isInstalledRemotely)) {
                    // web worker extensions run in the local web worker if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 2 /* ExtensionHostKind.LocalWebWorker */;
                    }
                    else {
                        result.push(2 /* ExtensionHostKind.LocalWebWorker */);
                    }
                }
            }
            if (canRunRemotely) {
                result.push(3 /* ExtensionHostKind.Remote */);
            }
            return (result.length > 0 ? result[0] : null);
        }
        _createExtensionHost(runningLocation, _isInitialStart) {
            switch (runningLocation.kind) {
                case 1 /* ExtensionHostKind.LocalProcess */: {
                    return null;
                }
                case 2 /* ExtensionHostKind.LocalWebWorker */: {
                    return this._instantiationService.createInstance(webWorkerExtensionHost_1.WebWorkerExtensionHost, runningLocation, false, this._createLocalExtensionHostDataProvider(runningLocation));
                }
                case 3 /* ExtensionHostKind.Remote */: {
                    const remoteAgentConnection = this._remoteAgentService.getConnection();
                    if (remoteAgentConnection) {
                        return this._instantiationService.createInstance(remoteExtensionHost_1.RemoteExtensionHost, runningLocation, this._createRemoteExtensionHostDataProvider(remoteAgentConnection.remoteAuthority), this._remoteAgentService.socketFactory);
                    }
                    return null;
                }
            }
        }
        async _scanAndHandleExtensions() {
            // fetch the remote environment
            let [localExtensions, remoteEnv, remoteExtensions] = await Promise.all([
                this._scanWebExtensions(),
                this._remoteAgentService.getEnvironment(),
                this._remoteAgentService.scanExtensions()
            ]);
            localExtensions = this._checkEnabledAndProposedAPI(localExtensions, false);
            remoteExtensions = this._checkEnabledAndProposedAPI(remoteExtensions, false);
            const remoteAgentConnection = this._remoteAgentService.getConnection();
            // `determineRunningLocation` will look at the complete picture (e.g. an extension installed on both sides),
            // takes care of duplicates and picks a running location for each extension
            this._initializeRunningLocation(localExtensions, remoteExtensions);
            // Some remote extensions could run locally in the web worker, so store them
            const remoteExtensionsThatNeedToRunLocally = this._filterByExtensionHostKind(remoteExtensions, 2 /* ExtensionHostKind.LocalWebWorker */);
            localExtensions = this._filterByExtensionHostKind(localExtensions, 2 /* ExtensionHostKind.LocalWebWorker */);
            remoteExtensions = this._filterByExtensionHostKind(remoteExtensions, 3 /* ExtensionHostKind.Remote */);
            // Add locally the remote extensions that need to run locally in the web worker
            for (const ext of remoteExtensionsThatNeedToRunLocally) {
                if (!includes(localExtensions, ext.identifier)) {
                    localExtensions.push(ext);
                }
            }
            const result = this._registry.deltaExtensions(remoteExtensions.concat(localExtensions), []);
            if (result.removedDueToLooping.length > 0) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', '))
                });
            }
            if (remoteEnv && remoteAgentConnection) {
                // save for remote extension's init data
                this._remoteInitData = {
                    connectionData: this._remoteAuthorityResolverService.getConnectionData(remoteAgentConnection.remoteAuthority),
                    pid: remoteEnv.pid,
                    appRoot: remoteEnv.appRoot,
                    extensionHostLogsPath: remoteEnv.extensionHostLogsPath,
                    globalStorageHome: remoteEnv.globalStorageHome,
                    workspaceStorageHome: remoteEnv.workspaceStorageHome,
                    allExtensions: this._registry.getAllExtensionDescriptions(),
                    myExtensions: remoteExtensions.map(extension => extension.identifier),
                };
            }
            this._doHandleExtensionPoints(this._registry.getAllExtensionDescriptions());
        }
        _onExtensionHostExit(code) {
            // Dispose everything associated with the extension host
            this.stopExtensionHosts();
            const automatedWindow = window;
            if (typeof automatedWindow.codeAutomationExit === 'function') {
                automatedWindow.codeAutomationExit(code);
            }
        }
    };
    ExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, extensionManagement_2.IExtensionManagementService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(11, extensionManagement_1.IWebExtensionsScannerService),
        __param(12, log_1.ILogService),
        __param(13, remoteAgentService_1.IRemoteAgentService),
        __param(14, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(15, lifecycle_2.ILifecycleService),
        __param(16, userDataInit_1.IUserDataInitializationService)
    ], ExtensionService);
    exports.ExtensionService = ExtensionService;
    function includes(extensions, identifier) {
        for (const extension of extensions) {
            if (extensions_3.ExtensionIdentifier.equals(extension.identifier, identifier)) {
                return true;
            }
        }
        return false;
    }
    (0, extensions_2.registerSingleton)(extensions_1.IExtensionService, ExtensionService);
});
//# sourceMappingURL=extensionService.js.map