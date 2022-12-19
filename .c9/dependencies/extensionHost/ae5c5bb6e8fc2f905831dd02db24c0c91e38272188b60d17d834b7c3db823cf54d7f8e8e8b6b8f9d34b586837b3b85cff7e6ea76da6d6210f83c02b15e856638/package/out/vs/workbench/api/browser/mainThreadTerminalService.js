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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/uri", "vs/base/common/stopwatch", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalDataBuffering", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalProcessExtHostProxy", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/common/environmentVariableShared", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/async"], function (require, exports, lifecycle_1, extHost_protocol_1, extHostCustomers_1, uri_1, stopwatch_1, instantiation_1, log_1, terminal_1, terminalDataBuffering_1, terminal_2, terminalProcessExtHostProxy_1, environmentVariable_1, environmentVariableShared_1, terminal_3, remoteAgentService_1, types_1, platform_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTerminalService = void 0;
    let MainThreadTerminalService = class MainThreadTerminalService {
        constructor(_extHostContext, _terminalService, terminalInstanceService, _instantiationService, _environmentVariableService, _logService, _terminalProfileResolverService, remoteAgentService, _terminalGroupService, _terminalEditorService, _terminalProfileService) {
            this._extHostContext = _extHostContext;
            this._terminalService = _terminalService;
            this.terminalInstanceService = terminalInstanceService;
            this._instantiationService = _instantiationService;
            this._environmentVariableService = _environmentVariableService;
            this._logService = _logService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._terminalGroupService = _terminalGroupService;
            this._terminalEditorService = _terminalEditorService;
            this._terminalProfileService = _terminalProfileService;
            /**
             * Stores a map from a temporary terminal id (a UUID generated on the extension host side)
             * to a numeric terminal id (an id generated on the renderer side)
             * This comes in play only when dealing with terminals created on the extension host side
             */
            this._extHostTerminals = new Map();
            this._toDispose = new lifecycle_1.DisposableStore();
            this._terminalProcessProxies = new Map();
            this._profileProviders = new Map();
            this._os = platform_1.OS;
            this._proxy = _extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTerminalService);
            // ITerminalService listeners
            this._toDispose.add(_terminalService.onDidCreateInstance((instance) => {
                this._onTerminalOpened(instance);
                this._onInstanceDimensionsChanged(instance);
            }));
            this._toDispose.add(_terminalService.onDidDisposeInstance(instance => this._onTerminalDisposed(instance)));
            this._toDispose.add(_terminalService.onDidReceiveProcessId(instance => this._onTerminalProcessIdReady(instance)));
            this._toDispose.add(_terminalService.onDidChangeInstanceDimensions(instance => this._onInstanceDimensionsChanged(instance)));
            this._toDispose.add(_terminalService.onDidMaximumDimensionsChange(instance => this._onInstanceMaximumDimensionsChanged(instance)));
            this._toDispose.add(_terminalService.onDidRequestStartExtensionTerminal(e => this._onRequestStartExtensionTerminal(e)));
            this._toDispose.add(_terminalService.onDidChangeActiveInstance(instance => this._onActiveTerminalChanged(instance ? instance.instanceId : null)));
            this._toDispose.add(_terminalService.onDidChangeInstanceTitle(instance => instance && this._onTitleChanged(instance.instanceId, instance.title)));
            this._toDispose.add(_terminalService.onDidInputInstanceData(instance => this._proxy.$acceptTerminalInteraction(instance.instanceId)));
            // Set initial ext host state
            this._terminalService.instances.forEach(t => {
                this._onTerminalOpened(t);
                t.processReady.then(() => this._onTerminalProcessIdReady(t));
            });
            const activeInstance = this._terminalService.activeInstance;
            if (activeInstance) {
                this._proxy.$acceptActiveTerminalChanged(activeInstance.instanceId);
            }
            if (this._environmentVariableService.collections.size > 0) {
                const collectionAsArray = [...this._environmentVariableService.collections.entries()];
                const serializedCollections = collectionAsArray.map(e => {
                    return [e[0], (0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(e[1].map)];
                });
                this._proxy.$initEnvironmentVariableCollections(serializedCollections);
            }
            remoteAgentService.getEnvironment().then(async (env) => {
                this._os = (env === null || env === void 0 ? void 0 : env.os) || platform_1.OS;
                this._updateDefaultProfile();
            });
            this._terminalProfileService.onDidChangeAvailableProfiles(() => this._updateDefaultProfile());
        }
        dispose() {
            var _a;
            this._toDispose.dispose();
            (_a = this._linkProvider) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        async _updateDefaultProfile() {
            const remoteAuthority = (0, types_1.withNullAsUndefined)(this._extHostContext.remoteAuthority);
            const defaultProfile = this._terminalProfileResolverService.getDefaultProfile({ remoteAuthority, os: this._os });
            const defaultAutomationProfile = this._terminalProfileResolverService.getDefaultProfile({ remoteAuthority, os: this._os, allowAutomationShell: true });
            this._proxy.$acceptDefaultProfile(...await Promise.all([defaultProfile, defaultAutomationProfile]));
        }
        async _getTerminalInstance(id) {
            if (typeof id === 'string') {
                return this._extHostTerminals.get(id);
            }
            return this._terminalService.getInstanceFromId(id);
        }
        async $createTerminal(extHostTerminalId, launchConfig) {
            const shellLaunchConfig = {
                name: launchConfig.name,
                executable: launchConfig.shellPath,
                args: launchConfig.shellArgs,
                cwd: typeof launchConfig.cwd === 'string' ? launchConfig.cwd : uri_1.URI.revive(launchConfig.cwd),
                icon: launchConfig.icon,
                color: launchConfig.color,
                initialText: launchConfig.initialText,
                waitOnExit: launchConfig.waitOnExit,
                ignoreConfigurationCwd: true,
                env: launchConfig.env,
                strictEnv: launchConfig.strictEnv,
                hideFromUser: launchConfig.hideFromUser,
                customPtyImplementation: launchConfig.isExtensionCustomPtyTerminal
                    ? (id, cols, rows) => new terminalProcessExtHostProxy_1.TerminalProcessExtHostProxy(id, cols, rows, this._terminalService)
                    : undefined,
                extHostTerminalId,
                isFeatureTerminal: launchConfig.isFeatureTerminal,
                isExtensionOwnedTerminal: launchConfig.isExtensionOwnedTerminal,
                useShellEnvironment: launchConfig.useShellEnvironment,
                isTransient: launchConfig.isTransient
            };
            const terminal = async_1.Promises.withAsyncBody(async (r) => {
                const terminal = await this._terminalService.createTerminal({
                    config: shellLaunchConfig,
                    location: await this._deserializeParentTerminal(launchConfig.location)
                });
                r(terminal);
            });
            this._extHostTerminals.set(extHostTerminalId, terminal);
            await terminal;
        }
        async _deserializeParentTerminal(location) {
            if (typeof location === 'object' && 'parentTerminal' in location) {
                const parentTerminal = await this._extHostTerminals.get(location.parentTerminal.toString());
                return parentTerminal ? { parentTerminal } : undefined;
            }
            return location;
        }
        async $show(id, preserveFocus) {
            const terminalInstance = await this._getTerminalInstance(id);
            if (terminalInstance) {
                this._terminalService.setActiveInstance(terminalInstance);
                if (terminalInstance.target === terminal_1.TerminalLocation.Editor) {
                    this._terminalEditorService.revealActiveEditor(preserveFocus);
                }
                else {
                    this._terminalGroupService.showPanel(!preserveFocus);
                }
            }
        }
        async $hide(id) {
            const instanceToHide = await this._getTerminalInstance(id);
            const activeInstance = this._terminalService.activeInstance;
            if (activeInstance && activeInstance.instanceId === (instanceToHide === null || instanceToHide === void 0 ? void 0 : instanceToHide.instanceId) && activeInstance.target !== terminal_1.TerminalLocation.Editor) {
                this._terminalGroupService.hidePanel();
            }
        }
        async $dispose(id) {
            var _a;
            (_a = (await this._getTerminalInstance(id))) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        async $sendText(id, text, addNewLine) {
            const instance = await this._getTerminalInstance(id);
            await (instance === null || instance === void 0 ? void 0 : instance.sendText(text, addNewLine));
        }
        $sendProcessExit(terminalId, exitCode) {
            var _a;
            (_a = this._terminalProcessProxies.get(terminalId)) === null || _a === void 0 ? void 0 : _a.emitExit(exitCode);
        }
        $startSendingDataEvents() {
            if (!this._dataEventTracker) {
                this._dataEventTracker = this._instantiationService.createInstance(TerminalDataEventTracker, (id, data) => {
                    this._onTerminalData(id, data);
                });
                // Send initial events if they exist
                this._terminalService.instances.forEach(t => {
                    var _a;
                    (_a = t.initialDataEvents) === null || _a === void 0 ? void 0 : _a.forEach(d => this._onTerminalData(t.instanceId, d));
                });
            }
        }
        $stopSendingDataEvents() {
            var _a;
            (_a = this._dataEventTracker) === null || _a === void 0 ? void 0 : _a.dispose();
            this._dataEventTracker = undefined;
        }
        $startLinkProvider() {
            var _a;
            (_a = this._linkProvider) === null || _a === void 0 ? void 0 : _a.dispose();
            this._linkProvider = this._terminalService.registerLinkProvider(new ExtensionTerminalLinkProvider(this._proxy));
        }
        $stopLinkProvider() {
            var _a;
            (_a = this._linkProvider) === null || _a === void 0 ? void 0 : _a.dispose();
            this._linkProvider = undefined;
        }
        $registerProcessSupport(isSupported) {
            this._terminalService.registerProcessSupport(isSupported);
        }
        $registerProfileProvider(id, extensionIdentifier) {
            // Proxy profile provider requests through the extension host
            this._profileProviders.set(id, this._terminalProfileService.registerTerminalProfileProvider(extensionIdentifier, id, {
                createContributedTerminalProfile: async (options) => {
                    return this._proxy.$createContributedProfileTerminal(id, options);
                }
            }));
        }
        $unregisterProfileProvider(id) {
            var _a;
            (_a = this._profileProviders.get(id)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._profileProviders.delete(id);
        }
        _onActiveTerminalChanged(terminalId) {
            this._proxy.$acceptActiveTerminalChanged(terminalId);
        }
        _onTerminalData(terminalId, data) {
            this._proxy.$acceptTerminalProcessData(terminalId, data);
        }
        _onTitleChanged(terminalId, name) {
            this._proxy.$acceptTerminalTitleChange(terminalId, name);
        }
        _onTerminalDisposed(terminalInstance) {
            this._proxy.$acceptTerminalClosed(terminalInstance.instanceId, terminalInstance.exitCode);
        }
        _onTerminalOpened(terminalInstance) {
            const extHostTerminalId = terminalInstance.shellLaunchConfig.extHostTerminalId;
            const shellLaunchConfigDto = {
                name: terminalInstance.shellLaunchConfig.name,
                executable: terminalInstance.shellLaunchConfig.executable,
                args: terminalInstance.shellLaunchConfig.args,
                cwd: terminalInstance.shellLaunchConfig.cwd,
                env: terminalInstance.shellLaunchConfig.env,
                hideFromUser: terminalInstance.shellLaunchConfig.hideFromUser
            };
            this._proxy.$acceptTerminalOpened(terminalInstance.instanceId, extHostTerminalId, terminalInstance.title, shellLaunchConfigDto);
        }
        _onTerminalProcessIdReady(terminalInstance) {
            if (terminalInstance.processId === undefined) {
                return;
            }
            this._proxy.$acceptTerminalProcessId(terminalInstance.instanceId, terminalInstance.processId);
        }
        _onInstanceDimensionsChanged(instance) {
            this._proxy.$acceptTerminalDimensions(instance.instanceId, instance.cols, instance.rows);
        }
        _onInstanceMaximumDimensionsChanged(instance) {
            this._proxy.$acceptTerminalMaximumDimensions(instance.instanceId, instance.maxCols, instance.maxRows);
        }
        _onRequestStartExtensionTerminal(request) {
            const proxy = request.proxy;
            this._terminalProcessProxies.set(proxy.instanceId, proxy);
            // Note that onReisze is not being listened to here as it needs to fire when max dimensions
            // change, excluding the dimension override
            const initialDimensions = request.cols && request.rows ? {
                columns: request.cols,
                rows: request.rows
            } : undefined;
            this._proxy.$startExtensionTerminal(proxy.instanceId, initialDimensions).then(request.callback);
            proxy.onInput(data => this._proxy.$acceptProcessInput(proxy.instanceId, data));
            proxy.onShutdown(immediate => this._proxy.$acceptProcessShutdown(proxy.instanceId, immediate));
            proxy.onRequestCwd(() => this._proxy.$acceptProcessRequestCwd(proxy.instanceId));
            proxy.onRequestInitialCwd(() => this._proxy.$acceptProcessRequestInitialCwd(proxy.instanceId));
            proxy.onRequestLatency(() => this._onRequestLatency(proxy.instanceId));
        }
        $sendProcessData(terminalId, data) {
            var _a;
            (_a = this._terminalProcessProxies.get(terminalId)) === null || _a === void 0 ? void 0 : _a.emitData(data);
        }
        $sendProcessReady(terminalId, pid, cwd) {
            var _a;
            (_a = this._terminalProcessProxies.get(terminalId)) === null || _a === void 0 ? void 0 : _a.emitReady(pid, cwd);
        }
        $sendProcessProperty(terminalId, property) {
            var _a;
            if (property.type === "title" /* ProcessPropertyType.Title */) {
                const instance = this._terminalService.getInstanceFromId(terminalId);
                if (instance) {
                    instance.refreshTabLabels(property.value, terminal_1.TitleEventSource.Api);
                }
            }
            (_a = this._terminalProcessProxies.get(terminalId)) === null || _a === void 0 ? void 0 : _a.emitProcessProperty(property);
        }
        async _onRequestLatency(terminalId) {
            var _a;
            const COUNT = 2;
            let sum = 0;
            for (let i = 0; i < COUNT; i++) {
                const sw = stopwatch_1.StopWatch.create(true);
                await this._proxy.$acceptProcessRequestLatency(terminalId);
                sw.stop();
                sum += sw.elapsed();
            }
            (_a = this._getTerminalProcess(terminalId)) === null || _a === void 0 ? void 0 : _a.emitLatency(sum / COUNT);
        }
        _getTerminalProcess(terminalId) {
            const terminal = this._terminalProcessProxies.get(terminalId);
            if (!terminal) {
                this._logService.error(`Unknown terminal: ${terminalId}`);
                return undefined;
            }
            return terminal;
        }
        $setEnvironmentVariableCollection(extensionIdentifier, persistent, collection) {
            if (collection) {
                const translatedCollection = {
                    persistent,
                    map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)(collection)
                };
                this._environmentVariableService.set(extensionIdentifier, translatedCollection);
            }
            else {
                this._environmentVariableService.delete(extensionIdentifier);
            }
        }
    };
    MainThreadTerminalService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTerminalService),
        __param(1, terminal_2.ITerminalService),
        __param(2, terminal_2.ITerminalInstanceService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, environmentVariable_1.IEnvironmentVariableService),
        __param(5, log_1.ILogService),
        __param(6, terminal_3.ITerminalProfileResolverService),
        __param(7, remoteAgentService_1.IRemoteAgentService),
        __param(8, terminal_2.ITerminalGroupService),
        __param(9, terminal_2.ITerminalEditorService),
        __param(10, terminal_3.ITerminalProfileService)
    ], MainThreadTerminalService);
    exports.MainThreadTerminalService = MainThreadTerminalService;
    /**
     * Encapsulates temporary tracking of data events from terminal instances, once disposed all
     * listeners are removed.
     */
    let TerminalDataEventTracker = class TerminalDataEventTracker extends lifecycle_1.Disposable {
        constructor(_callback, _terminalService) {
            super();
            this._callback = _callback;
            this._terminalService = _terminalService;
            this._register(this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer(this._callback));
            this._terminalService.instances.forEach(instance => this._registerInstance(instance));
            this._register(this._terminalService.onDidCreateInstance(instance => this._registerInstance(instance)));
            this._register(this._terminalService.onDidDisposeInstance(instance => this._bufferer.stopBuffering(instance.instanceId)));
        }
        _registerInstance(instance) {
            // Buffer data events to reduce the amount of messages going to the extension host
            this._register(this._bufferer.startBuffering(instance.instanceId, instance.onData));
        }
    };
    TerminalDataEventTracker = __decorate([
        __param(1, terminal_2.ITerminalService)
    ], TerminalDataEventTracker);
    class ExtensionTerminalLinkProvider {
        constructor(_proxy) {
            this._proxy = _proxy;
        }
        async provideLinks(instance, line) {
            const proxy = this._proxy;
            const extHostLinks = await proxy.$provideLinks(instance.instanceId, line);
            return extHostLinks.map(dto => ({
                id: dto.id,
                startIndex: dto.startIndex,
                length: dto.length,
                label: dto.label,
                activate: () => proxy.$activateLink(instance.instanceId, dto.id)
            }));
        }
    }
});
//# sourceMappingURL=mainThreadTerminalService.js.map