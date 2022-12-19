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
define(["require", "exports", "vs/workbench/services/extensions/electron-browser/localProcessExtensionHost", "vs/workbench/services/extensions/electron-sandbox/cachedExtensionScanner", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/nls", "vs/base/common/async", "vs/workbench/services/environment/common/environmentService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/configuration/common/configuration", "vs/workbench/services/extensions/common/remoteExtensionHost", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/base/common/arrays", "vs/platform/native/electron-sandbox/native", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/actions/common/actions", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/extensions/browser/webWorkerExtensionHost", "vs/platform/workspace/common/workspace", "vs/platform/log/common/log", "vs/workbench/common/actions", "vs/base/common/network", "vs/platform/request/common/request", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/workspace/common/workspaceTrust", "vs/base/common/cancellation", "vs/base/common/stopwatch", "vs/base/common/platform"], function (require, exports, localProcessExtensionHost_1, cachedExtensionScanner_1, extensions_1, abstractExtensionService_1, nls, async_1, environmentService_1, extensionManagement_1, extensionManagement_2, configuration_1, remoteExtensionHost_1, remoteAgentService_1, remoteAuthorityResolver_1, instantiation_1, lifecycle_1, notification_1, telemetry_1, host_1, extensions_2, files_1, productService_1, arrays_1, native_1, remoteExplorerService_1, actions_1, remoteHosts_1, webWorkerExtensionHost_1, workspace_1, log_1, actions_2, network_1, request_1, extensionManifestPropertiesService_1, workspaceTrust_1, cancellation_1, stopwatch_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionService = void 0;
    let ExtensionService = class ExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, webExtensionsScannerService, logService, remoteAgentService, _remoteAuthorityResolverService, _lifecycleService, _nativeHostService, _hostService, _remoteExplorerService, _extensionGalleryService, _workspaceTrustManagementService) {
            super(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, webExtensionsScannerService, logService, remoteAgentService);
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._lifecycleService = _lifecycleService;
            this._nativeHostService = _nativeHostService;
            this._hostService = _hostService;
            this._remoteExplorerService = _remoteExplorerService;
            this._extensionGalleryService = _extensionGalleryService;
            this._workspaceTrustManagementService = _workspaceTrustManagementService;
            this._localCrashTracker = new abstractExtensionService_1.ExtensionHostCrashTracker();
            this._resolveAuthorityAttempt = 0;
            [this._enableLocalWebWorker, this._lazyLocalWebWorker] = this._isLocalWebWorkerEnabled();
            this._remoteInitData = new Map();
            this._extensionScanner = instantiationService.createInstance(cachedExtensionScanner_1.CachedExtensionScanner);
            // delay extension host creation and extension scanning
            // until the workbench is running. we cannot defer the
            // extension host more (LifecyclePhase.Restored) because
            // some editors require the extension host to restore
            // and this would result in a deadlock
            // see https://github.com/microsoft/vscode/issues/41322
            this._lifecycleService.when(2 /* LifecyclePhase.Ready */).then(() => {
                // reschedule to ensure this runs after restoring viewlets, panels, and editors
                (0, async_1.runWhenIdle)(() => {
                    this._initialize();
                }, 50 /*max delay*/);
            });
        }
        _isLocalWebWorkerEnabled() {
            var _a;
            let isEnabled;
            let isLazy;
            if (this._environmentService.isExtensionDevelopment && ((_a = this._environmentService.extensionDevelopmentKind) === null || _a === void 0 ? void 0 : _a.some(k => k === 'web'))) {
                isEnabled = true;
                isLazy = false;
            }
            else {
                const config = this._configurationService.getValue(extensions_2.webWorkerExtHostConfig);
                if (config === true) {
                    isEnabled = true;
                    isLazy = false;
                }
                else if (config === 'auto') {
                    isEnabled = true;
                    isLazy = true;
                }
                else {
                    isEnabled = false;
                    isLazy = false;
                }
            }
            return [isEnabled, isLazy];
        }
        _scanSingleExtension(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this._remoteAgentService.scanSingleExtension(extension.location, extension.type === 0 /* ExtensionType.System */);
            }
            return this._extensionScanner.scanSingleExtension(extension.location.fsPath, extension.type === 0 /* ExtensionType.System */);
        }
        async _scanAllLocalExtensions() {
            return (0, arrays_1.flatten)(await Promise.all([
                this._extensionScanner.scannedExtensions,
                this._scanWebExtensions(),
            ]));
        }
        _createLocalExtensionHostDataProvider(isInitialStart, desiredRunningLocation) {
            return {
                getInitData: async () => {
                    if (isInitialStart) {
                        // Here we load even extensions that would be disabled by workspace trust
                        const localExtensions = this._checkEnabledAndProposedAPI(await this._scanAllLocalExtensions(), /* ignore workspace trust */ true);
                        const runningLocation = this._determineRunningLocation(localExtensions);
                        const myExtensions = (0, abstractExtensionService_1.filterByRunningLocation)(localExtensions, runningLocation, desiredRunningLocation);
                        return {
                            autoStart: false,
                            allExtensions: localExtensions,
                            myExtensions: myExtensions.map(extension => extension.identifier)
                        };
                    }
                    else {
                        // restart case
                        const allExtensions = await this.getExtensions();
                        const myExtensions = this._filterByRunningLocation(allExtensions, desiredRunningLocation);
                        return {
                            autoStart: true,
                            allExtensions: allExtensions,
                            myExtensions: myExtensions.map(extension => extension.identifier)
                        };
                    }
                }
            };
        }
        _createRemoteExtensionHostDataProvider(remoteAuthority) {
            return {
                remoteAuthority: remoteAuthority,
                getInitData: async () => {
                    await this.whenInstalledExtensionsRegistered();
                    return this._remoteInitData.get(remoteAuthority);
                }
            };
        }
        _pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = ExtensionService.pickExtensionHostKind(extensionKinds, isInstalledLocally, isInstalledRemotely, preference, Boolean(this._environmentService.remoteAuthority), this._enableLocalWebWorker);
            this._logService.trace(`pickRunningLocation for ${extensionId.value}, extension kinds: [${extensionKinds.join(', ')}], isInstalledLocally: ${isInstalledLocally}, isInstalledRemotely: ${isInstalledRemotely}, preference: ${(0, abstractExtensionService_1.extensionRunningPreferenceToString)(preference)} => ${(0, extensions_2.extensionHostKindToString)(result)}`);
            return result;
        }
        static pickExtensionHostKind(extensionKinds, isInstalledLocally, isInstalledRemotely, preference, hasRemoteExtHost, hasWebWorkerExtHost) {
            const result = [];
            for (const extensionKind of extensionKinds) {
                if (extensionKind === 'ui' && isInstalledLocally) {
                    // ui extensions run locally if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    else {
                        result.push(1 /* ExtensionHostKind.LocalProcess */);
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
                if (extensionKind === 'workspace' && !hasRemoteExtHost) {
                    // workspace extensions also run locally if there is no remote
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    else {
                        result.push(1 /* ExtensionHostKind.LocalProcess */);
                    }
                }
                if (extensionKind === 'web' && isInstalledLocally && hasWebWorkerExtHost) {
                    // web worker extensions run in the local web worker if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 2 /* ExtensionHostKind.LocalWebWorker */;
                    }
                    else {
                        result.push(2 /* ExtensionHostKind.LocalWebWorker */);
                    }
                }
            }
            return (result.length > 0 ? result[0] : null);
        }
        _createExtensionHost(runningLocation, isInitialStart) {
            switch (runningLocation.kind) {
                case 1 /* ExtensionHostKind.LocalProcess */: {
                    return this._instantiationService.createInstance(localProcessExtensionHost_1.LocalProcessExtensionHost, runningLocation, this._createLocalExtensionHostDataProvider(isInitialStart, runningLocation));
                }
                case 2 /* ExtensionHostKind.LocalWebWorker */: {
                    if (this._enableLocalWebWorker) {
                        return this._instantiationService.createInstance(webWorkerExtensionHost_1.WebWorkerExtensionHost, runningLocation, this._lazyLocalWebWorker, this._createLocalExtensionHostDataProvider(isInitialStart, runningLocation));
                    }
                    return null;
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
        _onExtensionHostCrashed(extensionHost, code, signal) {
            const activatedExtensions = Array.from(this._extensionHostActiveExtensions.values()).filter(extensionId => extensionHost.containsExtension(extensionId));
            super._onExtensionHostCrashed(extensionHost, code, signal);
            if (extensionHost.kind === 1 /* ExtensionHostKind.LocalProcess */) {
                if (code === 55 /* ExtensionHostExitCode.VersionMismatch */) {
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.versionMismatchCrash', "Extension host cannot start: version mismatch."), [{
                            label: nls.localize('relaunch', "Relaunch VS Code"),
                            run: () => {
                                this._instantiationService.invokeFunction((accessor) => {
                                    const hostService = accessor.get(host_1.IHostService);
                                    hostService.restart();
                                });
                            }
                        }]);
                    return;
                }
                this._logExtensionHostCrash(extensionHost);
                this._sendExtensionHostCrashTelemetry(code, signal, activatedExtensions);
                this._localCrashTracker.registerCrash();
                if (this._localCrashTracker.shouldAutomaticallyRestart()) {
                    this._logService.info(`Automatically restarting the extension host.`);
                    this._notificationService.status(nls.localize('extensionService.autoRestart', "The extension host terminated unexpectedly. Restarting..."), { hideAfter: 5000 });
                    this.startExtensionHosts();
                }
                else {
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.crash', "Extension host terminated unexpectedly 3 times within the last 5 minutes."), [{
                            label: nls.localize('devTools', "Open Developer Tools"),
                            run: () => this._nativeHostService.openDevTools()
                        },
                        {
                            label: nls.localize('restart', "Restart Extension Host"),
                            run: () => this.startExtensionHosts()
                        }]);
                }
            }
        }
        _sendExtensionHostCrashTelemetry(code, signal, activatedExtensions) {
            this._telemetryService.publicLog2('extensionHostCrash', {
                code,
                signal,
                extensionIds: activatedExtensions.map(e => e.value)
            });
            for (const extensionId of activatedExtensions) {
                this._telemetryService.publicLog2('extensionHostCrashExtension', {
                    code,
                    signal,
                    extensionId: extensionId.value
                });
            }
        }
        // --- impl
        async _resolveAuthority(remoteAuthority) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                // This authority does not need to be resolved, simply parse the port number
                const lastColon = remoteAuthority.lastIndexOf(':');
                return {
                    authority: {
                        authority: remoteAuthority,
                        host: remoteAuthority.substring(0, lastColon),
                        port: parseInt(remoteAuthority.substring(lastColon + 1), 10),
                        connectionToken: undefined
                    }
                };
            }
            const localProcessExtensionHosts = this._getExtensionHostManagers(1 /* ExtensionHostKind.LocalProcess */);
            if (localProcessExtensionHosts.length === 0) {
                // no local process extension hosts
                throw new Error(`Cannot resolve authority`);
            }
            this._resolveAuthorityAttempt++;
            const results = await Promise.all(localProcessExtensionHosts.map(extHost => extHost.resolveAuthority(remoteAuthority, this._resolveAuthorityAttempt)));
            let bestErrorResult = null;
            for (const result of results) {
                if (result.type === 'ok') {
                    return result.value;
                }
                if (!bestErrorResult) {
                    bestErrorResult = result;
                    continue;
                }
                const bestErrorIsUnknown = (bestErrorResult.error.code === remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown);
                const errorIsUnknown = (result.error.code === remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown);
                if (bestErrorIsUnknown && !errorIsUnknown) {
                    bestErrorResult = result;
                }
            }
            // we can only reach this if there is an error
            throw new remoteAuthorityResolver_1.RemoteAuthorityResolverError(bestErrorResult.error.message, bestErrorResult.error.code, bestErrorResult.error.detail);
        }
        async _getCanonicalURI(remoteAuthority, uri) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                // This authority does not use a resolver
                return uri;
            }
            const localProcessExtensionHosts = this._getExtensionHostManagers(1 /* ExtensionHostKind.LocalProcess */);
            if (localProcessExtensionHosts.length === 0) {
                // no local process extension hosts
                throw new Error(`Cannot resolve canonical URI`);
            }
            const results = await Promise.all(localProcessExtensionHosts.map(extHost => extHost.getCanonicalURI(remoteAuthority, uri)));
            for (const result of results) {
                if (result) {
                    return result;
                }
            }
            // we can only reach this if there was no resolver extension that can return the cannonical uri
            throw new Error(`Cannot get canonical URI because no extension is installed to resolve ${getRemoteAuthorityPrefix(remoteAuthority)}`);
        }
        async _resolveAuthorityAgain() {
            const remoteAuthority = this._environmentService.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            this._remoteAuthorityResolverService._clearResolvedAuthority(remoteAuthority);
            const sw = stopwatch_1.StopWatch.create(false);
            this._logService.info(`Invoking resolveAuthority(${getRemoteAuthorityPrefix(remoteAuthority)})`);
            try {
                const result = await this._resolveAuthority(remoteAuthority);
                this._logService.info(`resolveAuthority(${getRemoteAuthorityPrefix(remoteAuthority)}) returned '${result.authority.host}:${result.authority.port}' after ${sw.elapsed()} ms`);
                this._remoteAuthorityResolverService._setResolvedAuthority(result.authority, result.options);
            }
            catch (err) {
                this._logService.error(`resolveAuthority(${getRemoteAuthorityPrefix(remoteAuthority)}) returned an error after ${sw.elapsed()} ms`, err);
                this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
            }
        }
        async _scanAndHandleExtensions() {
            this._extensionScanner.startScanningExtensions();
            const remoteAuthority = this._environmentService.remoteAuthority;
            let remoteEnv = null;
            let remoteExtensions = [];
            if (remoteAuthority) {
                this._remoteAuthorityResolverService._setCanonicalURIProvider(async (uri) => {
                    if (uri.scheme !== network_1.Schemas.vscodeRemote || uri.authority !== remoteAuthority) {
                        // The current remote authority resolver cannot give the canonical URI for this URI
                        return uri;
                    }
                    if (platform_1.isCI) {
                        this._logService.info(`Invoking getCanonicalURI for authority ${getRemoteAuthorityPrefix(remoteAuthority)}...`);
                    }
                    try {
                        return this._getCanonicalURI(remoteAuthority, uri);
                    }
                    finally {
                        if (platform_1.isCI) {
                            this._logService.info(`getCanonicalURI returned for authority ${getRemoteAuthorityPrefix(remoteAuthority)}.`);
                        }
                    }
                });
                if (platform_1.isCI) {
                    this._logService.info(`Starting to wait on IWorkspaceTrustManagementService.workspaceResolved...`);
                }
                // Now that the canonical URI provider has been registered, we need to wait for the trust state to be
                // calculated. The trust state will be used while resolving the authority, however the resolver can
                // override the trust state through the resolver result.
                await this._workspaceTrustManagementService.workspaceResolved;
                if (platform_1.isCI) {
                    this._logService.info(`Finished waiting on IWorkspaceTrustManagementService.workspaceResolved.`);
                }
                let resolverResult;
                const sw = stopwatch_1.StopWatch.create(false);
                this._logService.info(`Invoking resolveAuthority(${getRemoteAuthorityPrefix(remoteAuthority)})`);
                try {
                    resolverResult = await this._resolveAuthority(remoteAuthority);
                    this._logService.info(`resolveAuthority(${getRemoteAuthorityPrefix(remoteAuthority)}) returned '${resolverResult.authority.host}:${resolverResult.authority.port}' after ${sw.elapsed()} ms`);
                }
                catch (err) {
                    this._logService.error(`resolveAuthority(${getRemoteAuthorityPrefix(remoteAuthority)}) returned an error after ${sw.elapsed()} ms`, err);
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isNoResolverFound(err)) {
                        err.isHandled = await this._handleNoResolverFound(remoteAuthority);
                    }
                    else {
                        if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                            console.log(`Error handled: Not showing a notification for the error`);
                        }
                    }
                    this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
                    // Proceed with the local extension host
                    await this._startLocalExtensionHost();
                    return;
                }
                // set the resolved authority
                this._remoteAuthorityResolverService._setResolvedAuthority(resolverResult.authority, resolverResult.options);
                this._remoteExplorerService.setTunnelInformation(resolverResult.tunnelInformation);
                // monitor for breakage
                const connection = this._remoteAgentService.getConnection();
                if (connection) {
                    connection.onDidStateChange(async (e) => {
                        if (e.type === 0 /* PersistentConnectionEventType.ConnectionLost */) {
                            this._remoteAuthorityResolverService._clearResolvedAuthority(remoteAuthority);
                        }
                    });
                    connection.onReconnecting(() => this._resolveAuthorityAgain());
                }
                // fetch the remote environment
                [remoteEnv, remoteExtensions] = await Promise.all([
                    this._remoteAgentService.getEnvironment(),
                    this._remoteAgentService.scanExtensions()
                ]);
                if (!remoteEnv) {
                    this._notificationService.notify({ severity: notification_1.Severity.Error, message: nls.localize('getEnvironmentFailure', "Could not fetch remote environment") });
                    // Proceed with the local extension host
                    await this._startLocalExtensionHost();
                    return;
                }
                (0, request_1.updateProxyConfigurationsScope)(remoteEnv.useHostProxy ? 1 /* ConfigurationScope.APPLICATION */ : 2 /* ConfigurationScope.MACHINE */);
            }
            else {
                this._remoteAuthorityResolverService._setCanonicalURIProvider(async (uri) => uri);
            }
            await this._startLocalExtensionHost(remoteAuthority, remoteEnv, remoteExtensions);
        }
        async _startLocalExtensionHost(remoteAuthority = undefined, remoteEnv = null, remoteExtensions = []) {
            // Ensure that the workspace trust state has been fully initialized so
            // that the extension host can start with the correct set of extensions.
            await this._workspaceTrustManagementService.workspaceTrustInitialized;
            remoteExtensions = this._checkEnabledAndProposedAPI(remoteExtensions, false);
            const localExtensions = this._checkEnabledAndProposedAPI(await this._scanAllLocalExtensions(), false);
            this._initializeRunningLocation(localExtensions, remoteExtensions);
            // remove non-UI extensions from the local extensions
            const localProcessExtensions = this._filterByExtensionHostKind(localExtensions, 1 /* ExtensionHostKind.LocalProcess */);
            const localWebWorkerExtensions = this._filterByExtensionHostKind(localExtensions, 2 /* ExtensionHostKind.LocalWebWorker */);
            remoteExtensions = this._filterByExtensionHostKind(remoteExtensions, 3 /* ExtensionHostKind.Remote */);
            const result = this._registry.deltaExtensions(remoteExtensions.concat(localProcessExtensions).concat(localWebWorkerExtensions), []);
            if (result.removedDueToLooping.length > 0) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', '))
                });
            }
            if (remoteAuthority && remoteEnv) {
                this._remoteInitData.set(remoteAuthority, {
                    connectionData: this._remoteAuthorityResolverService.getConnectionData(remoteAuthority),
                    pid: remoteEnv.pid,
                    appRoot: remoteEnv.appRoot,
                    extensionHostLogsPath: remoteEnv.extensionHostLogsPath,
                    globalStorageHome: remoteEnv.globalStorageHome,
                    workspaceStorageHome: remoteEnv.workspaceStorageHome,
                    allExtensions: this._registry.getAllExtensionDescriptions(),
                    myExtensions: remoteExtensions.map(extension => extension.identifier),
                });
            }
            this._doHandleExtensionPoints(this._registry.getAllExtensionDescriptions());
            const localProcessExtensionHosts = this._getExtensionHostManagers(1 /* ExtensionHostKind.LocalProcess */);
            const filteredLocalProcessExtensions = localProcessExtensions.filter(extension => this._registry.containsExtension(extension.identifier));
            for (const extHost of localProcessExtensionHosts) {
                this._startExtensionHost(extHost, filteredLocalProcessExtensions);
            }
            const localWebWorkerExtensionHosts = this._getExtensionHostManagers(2 /* ExtensionHostKind.LocalWebWorker */);
            const filteredLocalWebWorkerExtensions = localWebWorkerExtensions.filter(extension => this._registry.containsExtension(extension.identifier));
            for (const extHost of localWebWorkerExtensionHosts) {
                this._startExtensionHost(extHost, filteredLocalWebWorkerExtensions);
            }
        }
        _startExtensionHost(extensionHostManager, _extensions) {
            const extensions = this._filterByExtensionHostManager(_extensions, extensionHostManager);
            extensionHostManager.start(this._registry.getAllExtensionDescriptions(), extensions.map(extension => extension.identifier));
        }
        _onExtensionHostExit(code) {
            // Dispose everything associated with the extension host
            this.stopExtensionHosts();
            if (this._isExtensionDevTestFromCli) {
                // When CLI testing make sure to exit with proper exit code
                this._nativeHostService.exit(code);
            }
            else {
                // Expected development extension termination: When the extension host goes down we also shutdown the window
                this._nativeHostService.closeWindow();
            }
        }
        async _handleNoResolverFound(remoteAuthority) {
            var _a;
            const remoteName = (0, remoteHosts_1.getRemoteName)(remoteAuthority);
            const recommendation = (_a = this._productService.remoteExtensionTips) === null || _a === void 0 ? void 0 : _a[remoteName];
            if (!recommendation) {
                return false;
            }
            const sendTelemetry = (userReaction) => {
                /* __GDPR__
                "remoteExtensionRecommendations:popup" : {
                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                }
                */
                this._telemetryService.publicLog('remoteExtensionRecommendations:popup', { userReaction, extensionId: resolverExtensionId });
            };
            const resolverExtensionId = recommendation.extensionId;
            const allExtensions = await this._scanAllLocalExtensions();
            const extension = allExtensions.filter(e => e.identifier.value === resolverExtensionId)[0];
            if (extension) {
                if (!this._isEnabled(extension, false)) {
                    const message = nls.localize('enableResolver', "Extension '{0}' is required to open the remote window.\nOK to enable?", recommendation.friendlyName);
                    this._notificationService.prompt(notification_1.Severity.Info, message, [{
                            label: nls.localize('enable', 'Enable and Reload'),
                            run: async () => {
                                sendTelemetry('enable');
                                await this._extensionEnablementService.setEnablement([(0, extensions_2.toExtension)(extension)], 8 /* EnablementState.EnabledGlobally */);
                                await this._hostService.reload();
                            }
                        }], { sticky: true });
                }
            }
            else {
                // Install the Extension and reload the window to handle.
                const message = nls.localize('installResolver', "Extension '{0}' is required to open the remote window.\nDo you want to install the extension?", recommendation.friendlyName);
                this._notificationService.prompt(notification_1.Severity.Info, message, [{
                        label: nls.localize('install', 'Install and Reload'),
                        run: async () => {
                            sendTelemetry('install');
                            const [galleryExtension] = await this._extensionGalleryService.getExtensions([{ id: resolverExtensionId }], cancellation_1.CancellationToken.None);
                            if (galleryExtension) {
                                await this._extensionManagementService.installFromGallery(galleryExtension);
                                await this._hostService.reload();
                            }
                            else {
                                this._notificationService.error(nls.localize('resolverExtensionNotFound', "`{0}` not found on marketplace"));
                            }
                        }
                    }], {
                    sticky: true,
                    onCancel: () => sendTelemetry('cancel')
                });
            }
            return true;
        }
    };
    ExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, extensionManagement_1.IExtensionManagementService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(11, extensionManagement_2.IWebExtensionsScannerService),
        __param(12, log_1.ILogService),
        __param(13, remoteAgentService_1.IRemoteAgentService),
        __param(14, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(15, lifecycle_1.ILifecycleService),
        __param(16, native_1.INativeHostService),
        __param(17, host_1.IHostService),
        __param(18, remoteExplorerService_1.IRemoteExplorerService),
        __param(19, extensionManagement_1.IExtensionGalleryService),
        __param(20, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], ExtensionService);
    exports.ExtensionService = ExtensionService;
    function getRemoteAuthorityPrefix(remoteAuthority) {
        const plusIndex = remoteAuthority.indexOf('+');
        if (plusIndex === -1) {
            return remoteAuthority;
        }
        return remoteAuthority.substring(0, plusIndex);
    }
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionService, ExtensionService);
    class RestartExtensionHostAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.restartExtensionHost',
                title: { value: nls.localize('restartExtensionHost', "Restart Extension Host"), original: 'Restart Extension Host' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(extensions_2.IExtensionService).restartExtensionHost();
        }
    }
    (0, actions_1.registerAction2)(RestartExtensionHostAction);
});
//# sourceMappingURL=extensionService.js.map