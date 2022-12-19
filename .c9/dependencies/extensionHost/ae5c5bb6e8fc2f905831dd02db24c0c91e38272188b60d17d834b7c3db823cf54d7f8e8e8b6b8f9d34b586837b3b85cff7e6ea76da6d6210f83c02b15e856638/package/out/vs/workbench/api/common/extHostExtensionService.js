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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/resources", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostExtensionActivator", "vs/workbench/api/common/extHostStorage", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/base/common/errors", "vs/platform/extensions/common/extensions", "vs/base/common/buffer", "vs/workbench/api/common/extHostMemento", "vs/workbench/api/common/extHostTypes", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/common/extHostRpcService", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostTerminalService", "vs/base/common/event", "vs/workbench/services/extensions/common/workspaceContains", "vs/workbench/api/common/exHostSecretState", "vs/workbench/api/common/extHostSecrets", "vs/base/common/network"], function (require, exports, nls, path, performance, resources_1, async_1, lifecycle_1, map_1, uri_1, log_1, extHost_protocol_1, extHostConfiguration_1, extHostExtensionActivator_1, extHostStorage_1, extHostWorkspace_1, extensions_1, extensionDescriptionRegistry_1, errors, extensions_2, buffer_1, extHostMemento_1, extHostTypes_1, remoteAuthorityResolver_1, instantiation_1, extHostInitDataService_1, extHostStoragePaths_1, extHostRpcService_1, serviceCollection_1, extHostTunnelService_1, extHostTerminalService_1, event_1, workspaceContains_1, exHostSecretState_1, extHostSecrets_1, network_1) {
    "use strict";
    var _Extension_extensionService, _Extension_originExtensionId, _Extension_identifier;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionPaths = exports.Extension = exports.IExtHostExtensionService = exports.AbstractExtHostExtensionService = exports.IHostUtils = void 0;
    exports.IHostUtils = (0, instantiation_1.createDecorator)('IHostUtils');
    let AbstractExtHostExtensionService = class AbstractExtHostExtensionService extends lifecycle_1.Disposable {
        constructor(instaService, hostUtils, extHostContext, extHostWorkspace, extHostConfiguration, logService, initData, storagePath, extHostTunnelService, extHostTerminalService) {
            super();
            this._onDidChangeRemoteConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeRemoteConnectionData = this._onDidChangeRemoteConnectionData.event;
            this._isTerminating = false;
            this._hostUtils = hostUtils;
            this._extHostContext = extHostContext;
            this._initData = initData;
            this._extHostWorkspace = extHostWorkspace;
            this._extHostConfiguration = extHostConfiguration;
            this._logService = logService;
            this._extHostTunnelService = extHostTunnelService;
            this._extHostTerminalService = extHostTerminalService;
            this._mainThreadWorkspaceProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadWorkspace);
            this._mainThreadTelemetryProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            this._mainThreadExtensionsProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            this._almostReadyToRunExtensions = new async_1.Barrier();
            this._readyToStartExtensionHost = new async_1.Barrier();
            this._readyToRunExtensions = new async_1.Barrier();
            this._eagerExtensionsActivated = new async_1.Barrier();
            this._globalRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(this._initData.allExtensions);
            const myExtensionsSet = (0, extensions_1.extensionIdentifiersArrayToSet)(this._initData.myExtensions);
            this._myRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(filterExtensions(this._globalRegistry, myExtensionsSet));
            this._storage = new extHostStorage_1.ExtHostStorage(this._extHostContext);
            this._secretState = new exHostSecretState_1.ExtHostSecretState(this._extHostContext);
            this._storagePath = storagePath;
            this._instaService = instaService.createChild(new serviceCollection_1.ServiceCollection([extHostStorage_1.IExtHostStorage, this._storage], [exHostSecretState_1.IExtHostSecretState, this._secretState]));
            let resolvedExtensions = [];
            let hostExtensions = [];
            if (this._initData.remote.isRemote) {
                resolvedExtensions = this._initData.allExtensions.filter(extension => !extension.main && !extension.browser).map(extension => extension.identifier);
                hostExtensions = (this._initData.allExtensions
                    .filter(extension => !myExtensionsSet.has(extensions_2.ExtensionIdentifier.toKey(extension.identifier.value)))
                    .filter(extension => (extension.main || extension.browser) && extension.api === 'none').map(extension => extension.identifier));
            }
            const hostExtensionsSet = (0, extensions_1.extensionIdentifiersArrayToSet)(hostExtensions);
            this._activator = this._register(new extHostExtensionActivator_1.ExtensionsActivator(this._myRegistry, resolvedExtensions, hostExtensions, {
                onExtensionActivationError: (extensionId, error, missingExtensionDependency) => {
                    this._mainThreadExtensionsProxy.$onExtensionActivationError(extensionId, errors.transformErrorForSerialization(error), missingExtensionDependency);
                },
                actualActivateExtension: async (extensionId, reason) => {
                    if (hostExtensionsSet.has(extensions_2.ExtensionIdentifier.toKey(extensionId))) {
                        await this._mainThreadExtensionsProxy.$activateExtension(extensionId, reason);
                        return new extHostExtensionActivator_1.HostExtension();
                    }
                    const extensionDescription = this._myRegistry.getExtensionDescription(extensionId);
                    return this._activateExtension(extensionDescription, reason);
                }
            }, this._logService));
            this._extensionPathIndex = null;
            this._resolvers = Object.create(null);
            this._started = false;
            this._remoteConnectionData = this._initData.remote.connectionData;
        }
        getRemoteConnectionData() {
            return this._remoteConnectionData;
        }
        async initialize() {
            try {
                await this._beforeAlmostReadyToRunExtensions();
                this._almostReadyToRunExtensions.open();
                await this._extHostWorkspace.waitForInitializeCall();
                performance.mark('code/extHost/ready');
                this._readyToStartExtensionHost.open();
                if (this._initData.autoStart) {
                    this._startExtensionHost();
                }
            }
            catch (err) {
                errors.onUnexpectedError(err);
            }
        }
        async _deactivateAll() {
            this._storagePath.onWillDeactivateAll();
            let allPromises = [];
            try {
                const allExtensions = this._myRegistry.getAllExtensionDescriptions();
                const allExtensionsIds = allExtensions.map(ext => ext.identifier);
                const activatedExtensions = allExtensionsIds.filter(id => this.isActivated(id));
                allPromises = activatedExtensions.map((extensionId) => {
                    return this._deactivate(extensionId);
                });
            }
            catch (err) {
                // TODO: write to log once we have one
            }
            await Promise.all(allPromises);
        }
        terminate(reason, code = 0) {
            if (this._isTerminating) {
                // we are already shutting down...
                return;
            }
            this._isTerminating = true;
            this._logService.info(`Extension host terminating: ${reason}`);
            this._logService.flush();
            this._extHostTerminalService.dispose();
            this._activator.dispose();
            errors.setUnexpectedErrorHandler((err) => {
                this._logService.error(err);
            });
            // Invalidate all proxies
            this._extHostContext.dispose();
            const extensionsDeactivated = this._deactivateAll();
            // Give extensions at most 5 seconds to wrap up any async deactivate, then exit
            Promise.race([(0, async_1.timeout)(5000), extensionsDeactivated]).finally(() => {
                if (this._hostUtils.pid) {
                    this._logService.info(`Extension host with pid ${this._hostUtils.pid} exiting with code ${code}`);
                }
                else {
                    this._logService.info(`Extension host exiting with code ${code}`);
                }
                this._logService.flush();
                this._logService.dispose();
                this._hostUtils.exit(code);
            });
        }
        isActivated(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.isActivated(extensionId);
            }
            return false;
        }
        async getExtension(extensionId) {
            const ext = await this._mainThreadExtensionsProxy.$getExtension(extensionId);
            return ext && Object.assign(Object.assign({}, ext), { identifier: new extensions_2.ExtensionIdentifier(ext.identifier.value), extensionLocation: uri_1.URI.revive(ext.extensionLocation) });
        }
        _activateByEvent(activationEvent, startup) {
            return this._activator.activateByEvent(activationEvent, startup);
        }
        _activateById(extensionId, reason) {
            return this._activator.activateById(extensionId, reason);
        }
        activateByIdWithErrors(extensionId, reason) {
            return this._activateById(extensionId, reason).then(() => {
                const extension = this._activator.getActivatedExtension(extensionId);
                if (extension.activationFailed) {
                    // activation failed => bubble up the error as the promise result
                    return Promise.reject(extension.activationFailedError);
                }
                return undefined;
            });
        }
        getExtensionRegistry() {
            return this._readyToRunExtensions.wait().then(_ => this._myRegistry);
        }
        getExtensionExports(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.getActivatedExtension(extensionId).exports;
            }
            else {
                return null;
            }
        }
        /**
         * Applies realpath to file-uris and returns all others uris unmodified
         */
        async _realPathExtensionUri(uri) {
            if (uri.scheme !== network_1.Schemas.file) {
                return uri;
            }
            const realpathValue = await this._hostUtils.realpath(uri.fsPath);
            return uri_1.URI.file(realpathValue);
        }
        // create trie to enable fast 'filename -> extension id' look up
        async getExtensionPathIndex() {
            if (!this._extensionPathIndex) {
                this._extensionPathIndex = this._createExtensionPathIndex(this._myRegistry.getAllExtensionDescriptions()).then((searchTree) => {
                    return new ExtensionPaths(searchTree);
                });
            }
            return this._extensionPathIndex;
        }
        /**
         * create trie to enable fast 'filename -> extension id' look up
         */
        async _createExtensionPathIndex(extensions) {
            const tst = map_1.TernarySearchTree.forUris(key => {
                // using the default/biased extUri-util because the IExtHostFileSystemInfo-service
                // isn't ready to be used yet, e.g the knowledge about `file` protocol and others
                // comes in while this code runs
                return resources_1.extUriBiasedIgnorePathCase.ignorePathCasing(key);
            });
            // const tst = TernarySearchTree.forUris<IExtensionDescription>(key => true);
            await Promise.all(extensions.map(async (ext) => {
                if (this._getEntryPoint(ext)) {
                    const uri = await this._realPathExtensionUri(ext.extensionLocation);
                    tst.set(uri, ext);
                }
            }));
            return tst;
        }
        _deactivate(extensionId) {
            let result = Promise.resolve(undefined);
            if (!this._readyToRunExtensions.isOpen()) {
                return result;
            }
            if (!this._activator.isActivated(extensionId)) {
                return result;
            }
            const extension = this._activator.getActivatedExtension(extensionId);
            if (!extension) {
                return result;
            }
            // call deactivate if available
            try {
                if (typeof extension.module.deactivate === 'function') {
                    result = Promise.resolve(extension.module.deactivate()).then(undefined, (err) => {
                        this._logService.error(err);
                        return Promise.resolve(undefined);
                    });
                }
            }
            catch (err) {
                this._logService.error(`An error occurred when deactivating the extension '${extensionId.value}':`);
                this._logService.error(err);
            }
            // clean up subscriptions
            try {
                (0, lifecycle_1.dispose)(extension.subscriptions);
            }
            catch (err) {
                this._logService.error(`An error occurred when deactivating the subscriptions for extension '${extensionId.value}':`);
                this._logService.error(err);
            }
            return result;
        }
        // --- impl
        async _activateExtension(extensionDescription, reason) {
            if (!this._initData.remote.isRemote) {
                // local extension host process
                await this._mainThreadExtensionsProxy.$onWillActivateExtension(extensionDescription.identifier);
            }
            else {
                // remote extension host process
                // do not wait for renderer confirmation
                this._mainThreadExtensionsProxy.$onWillActivateExtension(extensionDescription.identifier);
            }
            return this._doActivateExtension(extensionDescription, reason).then((activatedExtension) => {
                const activationTimes = activatedExtension.activationTimes;
                this._mainThreadExtensionsProxy.$onDidActivateExtension(extensionDescription.identifier, activationTimes.codeLoadingTime, activationTimes.activateCallTime, activationTimes.activateResolvedTime, reason);
                this._logExtensionActivationTimes(extensionDescription, reason, 'success', activationTimes);
                return activatedExtension;
            }, (err) => {
                this._logExtensionActivationTimes(extensionDescription, reason, 'failure');
                throw err;
            });
        }
        _logExtensionActivationTimes(extensionDescription, reason, outcome, activationTimes) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            this._mainThreadTelemetryProxy.$publicLog2('extensionActivationTimes', Object.assign(Object.assign(Object.assign({}, event), (activationTimes || {})), { outcome }));
        }
        _doActivateExtension(extensionDescription, reason) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            this._mainThreadTelemetryProxy.$publicLog2('activatePlugin', event);
            const entryPoint = this._getEntryPoint(extensionDescription);
            if (!entryPoint) {
                // Treat the extension as being empty => NOT AN ERROR CASE
                return Promise.resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
            this._logService.info(`ExtensionService#_doActivateExtension ${extensionDescription.identifier.value}, startup: ${reason.startup}, activationEvent: '${reason.activationEvent}'${extensionDescription.identifier.value !== reason.extensionId.value ? `, root cause: ${reason.extensionId.value}` : ``}`);
            this._logService.flush();
            const activationTimesBuilder = new extHostExtensionActivator_1.ExtensionActivationTimesBuilder(reason.startup);
            return Promise.all([
                this._loadCommonJSModule(extensionDescription.identifier, (0, resources_1.joinPath)(extensionDescription.extensionLocation, entryPoint), activationTimesBuilder),
                this._loadExtensionContext(extensionDescription)
            ]).then(values => {
                performance.mark(`code/extHost/willActivateExtension/${extensionDescription.identifier.value}`);
                return AbstractExtHostExtensionService._callActivate(this._logService, extensionDescription.identifier, values[0], values[1], activationTimesBuilder);
            }).then((activatedExtension) => {
                performance.mark(`code/extHost/didActivateExtension/${extensionDescription.identifier.value}`);
                return activatedExtension;
            });
        }
        _loadExtensionContext(extensionDescription) {
            const globalState = new extHostMemento_1.ExtensionGlobalMemento(extensionDescription, this._storage);
            const workspaceState = new extHostMemento_1.ExtensionMemento(extensionDescription.identifier.value, false, this._storage);
            const secrets = new extHostSecrets_1.ExtensionSecrets(extensionDescription, this._secretState);
            const extensionMode = extensionDescription.isUnderDevelopment
                ? (this._initData.environment.extensionTestsLocationURI ? extHostTypes_1.ExtensionMode.Test : extHostTypes_1.ExtensionMode.Development)
                : extHostTypes_1.ExtensionMode.Production;
            const extensionKind = this._initData.remote.isRemote ? extHostTypes_1.ExtensionKind.Workspace : extHostTypes_1.ExtensionKind.UI;
            this._logService.trace(`ExtensionService#loadExtensionContext ${extensionDescription.identifier.value}`);
            return Promise.all([
                globalState.whenReady,
                workspaceState.whenReady,
                this._storagePath.whenReady
            ]).then(() => {
                var _a;
                const that = this;
                let extension;
                let messagePassingProtocol;
                const messagePort = (0, extensions_1.isProposedApiEnabled)(extensionDescription, 'ipc')
                    ? (_a = this._initData.messagePorts) === null || _a === void 0 ? void 0 : _a.get(extensions_2.ExtensionIdentifier.toKey(extensionDescription.identifier))
                    : undefined;
                return Object.freeze({
                    globalState,
                    workspaceState,
                    secrets,
                    subscriptions: [],
                    get extensionUri() { return extensionDescription.extensionLocation; },
                    get extensionPath() { return extensionDescription.extensionLocation.fsPath; },
                    asAbsolutePath(relativePath) { return path.join(extensionDescription.extensionLocation.fsPath, relativePath); },
                    get storagePath() { var _a; return (_a = that._storagePath.workspaceValue(extensionDescription)) === null || _a === void 0 ? void 0 : _a.fsPath; },
                    get globalStoragePath() { return that._storagePath.globalValue(extensionDescription).fsPath; },
                    get logPath() { return path.join(that._initData.logsLocation.fsPath, extensionDescription.identifier.value); },
                    get logUri() { return uri_1.URI.joinPath(that._initData.logsLocation, extensionDescription.identifier.value); },
                    get storageUri() { return that._storagePath.workspaceValue(extensionDescription); },
                    get globalStorageUri() { return that._storagePath.globalValue(extensionDescription); },
                    get extensionMode() { return extensionMode; },
                    get extension() {
                        if (extension === undefined) {
                            extension = new Extension(that, extensionDescription.identifier, extensionDescription, extensionKind, false);
                        }
                        return extension;
                    },
                    get extensionRuntime() {
                        (0, extensions_1.checkProposedApiEnabled)(extensionDescription, 'extensionRuntime');
                        return that.extensionRuntime;
                    },
                    get environmentVariableCollection() { return that._extHostTerminalService.getEnvironmentVariableCollection(extensionDescription); },
                    get messagePassingProtocol() {
                        if (!messagePassingProtocol) {
                            if (!messagePort) {
                                return undefined;
                            }
                            const onDidReceiveMessage = event_1.Event.buffer(event_1.Event.fromDOMEventEmitter(messagePort, 'message', e => e.data));
                            messagePort.start();
                            messagePassingProtocol = {
                                onDidReceiveMessage,
                                postMessage: messagePort.postMessage.bind(messagePort)
                            };
                        }
                        return messagePassingProtocol;
                    }
                });
            });
        }
        static _callActivate(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            // Make sure the extension's surface is not undefined
            extensionModule = extensionModule || {
                activate: undefined,
                deactivate: undefined
            };
            return this._callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder).then((extensionExports) => {
                return new extHostExtensionActivator_1.ActivatedExtension(false, null, activationTimesBuilder.build(), extensionModule, extensionExports, context.subscriptions);
            });
        }
        static _callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            if (typeof extensionModule.activate === 'function') {
                try {
                    activationTimesBuilder.activateCallStart();
                    logService.trace(`ExtensionService#_callActivateOptional ${extensionId.value}`);
                    const scope = typeof global === 'object' ? global : self; // `global` is nodejs while `self` is for workers
                    const activateResult = extensionModule.activate.apply(scope, [context]);
                    activationTimesBuilder.activateCallStop();
                    activationTimesBuilder.activateResolveStart();
                    return Promise.resolve(activateResult).then((value) => {
                        activationTimesBuilder.activateResolveStop();
                        return value;
                    });
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
            else {
                // No activate found => the module is the extension's exports
                return Promise.resolve(extensionModule);
            }
        }
        // -- eager activation
        _activateOneStartupFinished(desc, activationEvent) {
            this._activateById(desc.identifier, {
                startup: false,
                extensionId: desc.identifier,
                activationEvent: activationEvent
            }).then(undefined, (err) => {
                this._logService.error(err);
            });
        }
        _activateAllStartupFinished() {
            // startup is considered finished
            this._mainThreadExtensionsProxy.$setPerformanceMarks(performance.getMarks());
            for (const desc of this._myRegistry.getAllExtensionDescriptions()) {
                if (desc.activationEvents) {
                    for (const activationEvent of desc.activationEvents) {
                        if (activationEvent === 'onStartupFinished') {
                            this._activateOneStartupFinished(desc, activationEvent);
                        }
                    }
                }
            }
        }
        // Handle "eager" activation extensions
        _handleEagerExtensions() {
            const starActivation = this._activateByEvent('*', true).then(undefined, (err) => {
                this._logService.error(err);
            });
            this._register(this._extHostWorkspace.onDidChangeWorkspace((e) => this._handleWorkspaceContainsEagerExtensions(e.added)));
            const folders = this._extHostWorkspace.workspace ? this._extHostWorkspace.workspace.folders : [];
            const workspaceContainsActivation = this._handleWorkspaceContainsEagerExtensions(folders);
            const eagerExtensionsActivation = Promise.all([starActivation, workspaceContainsActivation]).then(() => { });
            Promise.race([eagerExtensionsActivation, (0, async_1.timeout)(10000)]).then(() => {
                this._activateAllStartupFinished();
            });
            return eagerExtensionsActivation;
        }
        _handleWorkspaceContainsEagerExtensions(folders) {
            if (folders.length === 0) {
                return Promise.resolve(undefined);
            }
            return Promise.all(this._myRegistry.getAllExtensionDescriptions().map((desc) => {
                return this._handleWorkspaceContainsEagerExtension(folders, desc);
            })).then(() => { });
        }
        async _handleWorkspaceContainsEagerExtension(folders, desc) {
            if (this.isActivated(desc.identifier)) {
                return;
            }
            const localWithRemote = !this._initData.remote.isRemote && !!this._initData.remote.authority;
            const host = {
                logService: this._logService,
                folders: folders.map(folder => folder.uri),
                forceUsingSearch: localWithRemote,
                exists: (uri) => this._hostUtils.exists(uri.fsPath),
                checkExists: (folders, includes, token) => this._mainThreadWorkspaceProxy.$checkExists(folders, includes, token)
            };
            const result = await (0, workspaceContains_1.checkActivateWorkspaceContainsExtension)(host, desc);
            if (!result) {
                return;
            }
            return (this._activateById(desc.identifier, { startup: true, extensionId: desc.identifier, activationEvent: result.activationEvent })
                .then(undefined, err => this._logService.error(err)));
        }
        async $extensionTestsExecute() {
            await this._eagerExtensionsActivated.wait();
            try {
                return await this._doHandleExtensionTests();
            }
            catch (error) {
                console.error(error); // ensure any error message makes it onto the console
                throw error;
            }
        }
        async _doHandleExtensionTests() {
            const { extensionDevelopmentLocationURI, extensionTestsLocationURI } = this._initData.environment;
            if (!extensionDevelopmentLocationURI || !extensionTestsLocationURI) {
                throw new Error(nls.localize('extensionTestError1', "Cannot load test runner."));
            }
            // Require the test runner via node require from the provided path
            const testRunner = await this._loadCommonJSModule(null, extensionTestsLocationURI, new extHostExtensionActivator_1.ExtensionActivationTimesBuilder(false));
            if (!testRunner || typeof testRunner.run !== 'function') {
                throw new Error(nls.localize('extensionTestError', "Path {0} does not point to a valid extension test runner.", extensionTestsLocationURI.toString()));
            }
            // Execute the runner if it follows the old `run` spec
            return new Promise((resolve, reject) => {
                const oldTestRunnerCallback = (error, failures) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve((typeof failures === 'number' && failures > 0) ? 1 /* ERROR */ : 0 /* OK */);
                    }
                };
                const extensionTestsPath = (0, resources_1.originalFSPath)(extensionTestsLocationURI); // for the old test runner API
                const runResult = testRunner.run(extensionTestsPath, oldTestRunnerCallback);
                // Using the new API `run(): Promise<void>`
                if (runResult && runResult.then) {
                    runResult
                        .then(() => {
                        resolve(0);
                    })
                        .catch((err) => {
                        reject(err instanceof Error && err.stack ? err.stack : String(err));
                    });
                }
            });
        }
        async $extensionTestsExit(code) {
            this.terminate(`test runner requested exit with code ${code}`, code);
        }
        _startExtensionHost() {
            if (this._started) {
                throw new Error(`Extension host is already started!`);
            }
            this._started = true;
            return this._readyToStartExtensionHost.wait()
                .then(() => this._readyToRunExtensions.open())
                .then(() => this._handleEagerExtensions())
                .then(() => {
                this._eagerExtensionsActivated.open();
                this._logService.info(`Eager extensions activated`);
            });
        }
        // -- called by extensions
        registerRemoteAuthorityResolver(authorityPrefix, resolver) {
            this._resolvers[authorityPrefix] = resolver;
            return (0, lifecycle_1.toDisposable)(() => {
                delete this._resolvers[authorityPrefix];
            });
        }
        // -- called by main thread
        async _activateAndGetResolver(remoteAuthority) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                throw new Error(`Not an authority that can be resolved!`);
            }
            const authorityPrefix = remoteAuthority.substr(0, authorityPlusIndex);
            await this._almostReadyToRunExtensions.wait();
            await this._activateByEvent(`onResolveRemoteAuthority:${authorityPrefix}`, false);
            return { authorityPrefix, resolver: this._resolvers[authorityPrefix] };
        }
        async $resolveAuthority(remoteAuthority, resolveAttempt) {
            this._logService.info(`$resolveAuthority invoked for authority (${getRemoteAuthorityPrefix(remoteAuthority)})`);
            const { authorityPrefix, resolver } = await this._activateAndGetResolver(remoteAuthority);
            if (!resolver) {
                return {
                    type: 'error',
                    error: {
                        code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.NoResolverFound,
                        message: `No remote extension installed to resolve ${authorityPrefix}.`,
                        detail: undefined
                    }
                };
            }
            try {
                this._register(await this._extHostTunnelService.setTunnelFactory(resolver));
                performance.mark(`code/extHost/willResolveAuthority/${authorityPrefix}`);
                const result = await resolver.resolve(remoteAuthority, { resolveAttempt });
                performance.mark(`code/extHost/didResolveAuthorityOK/${authorityPrefix}`);
                // Split merged API result into separate authority/options
                const authority = {
                    authority: remoteAuthority,
                    host: result.host,
                    port: result.port,
                    connectionToken: result.connectionToken
                };
                const options = {
                    extensionHostEnv: result.extensionHostEnv,
                    isTrusted: result.isTrusted,
                    authenticationSession: result.authenticationSessionForInitializingExtensions ? { id: result.authenticationSessionForInitializingExtensions.id, providerId: result.authenticationSessionForInitializingExtensions.providerId } : undefined
                };
                return {
                    type: 'ok',
                    value: {
                        authority,
                        options,
                        tunnelInformation: {
                            environmentTunnels: result.environmentTunnels,
                            features: result.tunnelFeatures
                        }
                    }
                };
            }
            catch (err) {
                performance.mark(`code/extHost/didResolveAuthorityError/${authorityPrefix}`);
                if (err instanceof extHostTypes_1.RemoteAuthorityResolverError) {
                    return {
                        type: 'error',
                        error: {
                            code: err._code,
                            message: err._message,
                            detail: err._detail
                        }
                    };
                }
                throw err;
            }
        }
        async $getCanonicalURI(remoteAuthority, uriComponents) {
            this._logService.info(`$getCanonicalURI invoked for authority (${getRemoteAuthorityPrefix(remoteAuthority)})`);
            const { resolver } = await this._activateAndGetResolver(remoteAuthority);
            if (!resolver) {
                // Return `null` if no resolver for `remoteAuthority` is found.
                return null;
            }
            const uri = uri_1.URI.revive(uriComponents);
            if (typeof resolver.getCanonicalURI === 'undefined') {
                // resolver cannot compute canonical URI
                return uri;
            }
            const result = await (0, async_1.asPromise)(() => resolver.getCanonicalURI(uri));
            if (!result) {
                return uri;
            }
            return result;
        }
        static _applyExtensionsDelta(oldGlobalRegistry, oldMyRegistry, extensionsDelta) {
            const globalRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(oldGlobalRegistry.getAllExtensionDescriptions());
            globalRegistry.deltaExtensions(extensionsDelta.toAdd, extensionsDelta.toRemove);
            const myExtensionsSet = (0, extensions_1.extensionIdentifiersArrayToSet)(oldMyRegistry.getAllExtensionDescriptions().map(extension => extension.identifier));
            for (const extensionId of extensionsDelta.myToRemove) {
                myExtensionsSet.delete(extensions_2.ExtensionIdentifier.toKey(extensionId));
            }
            for (const extensionId of extensionsDelta.myToAdd) {
                myExtensionsSet.add(extensions_2.ExtensionIdentifier.toKey(extensionId));
            }
            const myExtensions = filterExtensions(globalRegistry, myExtensionsSet);
            return { globalRegistry, myExtensions };
        }
        $startExtensionHost(extensionsDelta) {
            extensionsDelta.toAdd.forEach((extension) => extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation));
            const { globalRegistry, myExtensions } = AbstractExtHostExtensionService._applyExtensionsDelta(this._globalRegistry, this._myRegistry, extensionsDelta);
            this._globalRegistry.set(globalRegistry.getAllExtensionDescriptions());
            this._myRegistry.set(myExtensions);
            return this._startExtensionHost();
        }
        $activateByEvent(activationEvent, activationKind) {
            if (activationKind === 1 /* ActivationKind.Immediate */) {
                return this._activateByEvent(activationEvent, false);
            }
            return (this._readyToRunExtensions.wait()
                .then(_ => this._activateByEvent(activationEvent, false)));
        }
        async $activate(extensionId, reason) {
            await this._readyToRunExtensions.wait();
            if (!this._myRegistry.getExtensionDescription(extensionId)) {
                // unknown extension => ignore
                return false;
            }
            await this._activateById(extensionId, reason);
            return true;
        }
        async $deltaExtensions(extensionsDelta) {
            extensionsDelta.toAdd.forEach((extension) => extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation));
            // First build up and update the trie and only afterwards apply the delta
            const { globalRegistry, myExtensions } = AbstractExtHostExtensionService._applyExtensionsDelta(this._globalRegistry, this._myRegistry, extensionsDelta);
            const newSearchTree = await this._createExtensionPathIndex(myExtensions);
            const extensionsPaths = await this.getExtensionPathIndex();
            extensionsPaths.setSearchTree(newSearchTree);
            this._globalRegistry.set(globalRegistry.getAllExtensionDescriptions());
            this._myRegistry.set(myExtensions);
            return Promise.resolve(undefined);
        }
        async $test_latency(n) {
            return n;
        }
        async $test_up(b) {
            return b.byteLength;
        }
        async $test_down(size) {
            let buff = buffer_1.VSBuffer.alloc(size);
            let value = Math.random() % 256;
            for (let i = 0; i < size; i++) {
                buff.writeUInt8(value, i);
            }
            return buff;
        }
        async $updateRemoteConnectionData(connectionData) {
            this._remoteConnectionData = connectionData;
            this._onDidChangeRemoteConnectionData.fire();
        }
    };
    AbstractExtHostExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, exports.IHostUtils),
        __param(2, extHostRpcService_1.IExtHostRpcService),
        __param(3, extHostWorkspace_1.IExtHostWorkspace),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, log_1.ILogService),
        __param(6, extHostInitDataService_1.IExtHostInitDataService),
        __param(7, extHostStoragePaths_1.IExtensionStoragePaths),
        __param(8, extHostTunnelService_1.IExtHostTunnelService),
        __param(9, extHostTerminalService_1.IExtHostTerminalService)
    ], AbstractExtHostExtensionService);
    exports.AbstractExtHostExtensionService = AbstractExtHostExtensionService;
    function getTelemetryActivationEvent(extensionDescription, reason) {
        const event = {
            id: extensionDescription.identifier.value,
            name: extensionDescription.name,
            extensionVersion: extensionDescription.version,
            publisherDisplayName: extensionDescription.publisher,
            activationEvents: extensionDescription.activationEvents ? extensionDescription.activationEvents.join(',') : null,
            isBuiltin: extensionDescription.isBuiltin,
            reason: reason.activationEvent,
            reasonId: reason.extensionId.value,
        };
        return event;
    }
    exports.IExtHostExtensionService = (0, instantiation_1.createDecorator)('IExtHostExtensionService');
    class Extension {
        constructor(extensionService, originExtensionId, description, kind, isFromDifferentExtensionHost) {
            _Extension_extensionService.set(this, void 0);
            _Extension_originExtensionId.set(this, void 0);
            _Extension_identifier.set(this, void 0);
            __classPrivateFieldSet(this, _Extension_extensionService, extensionService, "f");
            __classPrivateFieldSet(this, _Extension_originExtensionId, originExtensionId, "f");
            __classPrivateFieldSet(this, _Extension_identifier, description.identifier, "f");
            this.id = description.identifier.value;
            this.extensionUri = description.extensionLocation;
            this.extensionPath = path.normalize((0, resources_1.originalFSPath)(description.extensionLocation));
            this.packageJSON = description;
            this.extensionKind = kind;
            this.isFromDifferentExtensionHost = isFromDifferentExtensionHost;
        }
        get isActive() {
            // TODO@alexdima support this
            return __classPrivateFieldGet(this, _Extension_extensionService, "f").isActivated(__classPrivateFieldGet(this, _Extension_identifier, "f"));
        }
        get exports() {
            if (this.packageJSON.api === 'none' || this.isFromDifferentExtensionHost) {
                return undefined; // Strict nulloverride - Public api
            }
            return __classPrivateFieldGet(this, _Extension_extensionService, "f").getExtensionExports(__classPrivateFieldGet(this, _Extension_identifier, "f"));
        }
        async activate() {
            if (this.isFromDifferentExtensionHost) {
                throw new Error('Cannot activate foreign extension'); // TODO@alexdima support this
            }
            await __classPrivateFieldGet(this, _Extension_extensionService, "f").activateByIdWithErrors(__classPrivateFieldGet(this, _Extension_identifier, "f"), { startup: false, extensionId: __classPrivateFieldGet(this, _Extension_originExtensionId, "f"), activationEvent: 'api' });
            return this.exports;
        }
    }
    exports.Extension = Extension;
    _Extension_extensionService = new WeakMap(), _Extension_originExtensionId = new WeakMap(), _Extension_identifier = new WeakMap();
    function filterExtensions(globalRegistry, desiredExtensions) {
        return globalRegistry.getAllExtensionDescriptions().filter(extension => desiredExtensions.has(extensions_2.ExtensionIdentifier.toKey(extension.identifier)));
    }
    function getRemoteAuthorityPrefix(remoteAuthority) {
        const plusIndex = remoteAuthority.indexOf('+');
        if (plusIndex === -1) {
            return remoteAuthority;
        }
        return remoteAuthority.substring(0, plusIndex);
    }
    class ExtensionPaths {
        constructor(_searchTree) {
            this._searchTree = _searchTree;
        }
        setSearchTree(searchTree) {
            this._searchTree = searchTree;
        }
        findSubstr(key) {
            return this._searchTree.findSubstr(key);
        }
        forEach(callback) {
            return this._searchTree.forEach(callback);
        }
    }
    exports.ExtensionPaths = ExtensionPaths;
});
//# sourceMappingURL=extHostExtensionService.js.map