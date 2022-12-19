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
define(["require", "exports", "vs/base/common/event", "vs/base/common/platform", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/terminal/electron-sandbox/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/electron-sandbox/localPty", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/environment/electron-sandbox/shellEnvironmentService", "vs/workbench/services/history/common/history", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/platform/product/common/productService", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/browser/baseTerminalBackend"], function (require, exports, event_1, platform_1, types_1, configuration_1, instantiation_1, label_1, log_1, notification_1, platform_2, storage_1, terminal_1, workspace_1, terminal_2, terminal_3, localPty_1, configurationResolver_1, shellEnvironmentService_1, history_1, terminalEnvironment, productService_1, environmentVariable_1, baseTerminalBackend_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalTerminalBackendContribution = void 0;
    let LocalTerminalBackendContribution = class LocalTerminalBackendContribution {
        constructor(instantiationService, terminalService) {
            const backend = instantiationService.createInstance(LocalTerminalBackend, undefined);
            platform_2.Registry.as(terminal_3.TerminalExtensions.Backend).registerTerminalBackend(backend);
            terminalService.handleNewRegisteredBackend(backend);
        }
    };
    LocalTerminalBackendContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, terminal_2.ITerminalService)
    ], LocalTerminalBackendContribution);
    exports.LocalTerminalBackendContribution = LocalTerminalBackendContribution;
    let LocalTerminalBackend = class LocalTerminalBackend extends baseTerminalBackend_1.BaseTerminalBackend {
        constructor(remoteAuthority, _instantiationService, workspaceContextService, logService, _localPtyService, _labelService, _shellEnvironmentService, _storageService, _configurationResolverService, configurationService, _configurationService, _productService, _historyService, _terminalProfileResolverService, _environmentVariableService, notificationService, historyService) {
            super(_localPtyService, logService, notificationService, historyService, _configurationResolverService, workspaceContextService);
            this.remoteAuthority = remoteAuthority;
            this._instantiationService = _instantiationService;
            this._localPtyService = _localPtyService;
            this._labelService = _labelService;
            this._shellEnvironmentService = _shellEnvironmentService;
            this._storageService = _storageService;
            this._configurationResolverService = _configurationResolverService;
            this._configurationService = _configurationService;
            this._productService = _productService;
            this._historyService = _historyService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._environmentVariableService = _environmentVariableService;
            this._ptys = new Map();
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            // Attach process listeners
            this._localPtyService.onProcessData(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleData(e.event); });
            this._localPtyService.onDidChangeProperty(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleDidChangeProperty(e.property); });
            this._localPtyService.onProcessExit(e => {
                const pty = this._ptys.get(e.id);
                if (pty) {
                    pty.handleExit(e.event);
                    this._ptys.delete(e.id);
                }
            });
            this._localPtyService.onProcessReady(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleReady(e.event); });
            this._localPtyService.onProcessReplay(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleReplay(e.event); });
            this._localPtyService.onProcessOrphanQuestion(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleOrphanQuestion(); });
            this._localPtyService.onDidRequestDetach(e => this._onDidRequestDetach.fire(e));
            // Listen for config changes
            const initialConfig = configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
            for (const match of Object.keys(initialConfig.autoReplies)) {
                // Ensure the reply is value
                const reply = initialConfig.autoReplies[match];
                if (reply) {
                    this._localPtyService.installAutoReply(match, reply);
                }
            }
            // TODO: Could simplify update to a single call
            this._register(configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.autoReplies" /* TerminalSettingId.AutoReplies */)) {
                    this._localPtyService.uninstallAllAutoReplies();
                    const config = configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
                    for (const match of Object.keys(config.autoReplies)) {
                        // Ensure the reply is value
                        const reply = config.autoReplies[match];
                        if (reply) {
                            await this._localPtyService.installAutoReply(match, reply);
                        }
                    }
                }
            }));
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._localPtyService.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            if (!persistentProcessId) {
                this._logService.warn('Cannot attach to feature terminals, custom pty terminals, or those without a persistentProcessId');
                return;
            }
            return this._localPtyService.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async persistTerminalState() {
            const ids = Array.from(this._ptys.keys());
            const serialized = await this._localPtyService.serializeTerminalState(ids);
            this._storageService.store("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async updateTitle(id, title, titleSource) {
            await this._localPtyService.updateTitle(id, title, titleSource);
        }
        async updateIcon(id, icon, color) {
            await this._localPtyService.updateIcon(id, icon, color);
        }
        updateProperty(id, property, value) {
            return this._localPtyService.updateProperty(id, property, value);
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, options, shouldPersist) {
            const executableEnv = await this._shellEnvironmentService.getShellEnv();
            const id = await this._localPtyService.createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, this._getWorkspaceId(), this._getWorkspaceName());
            const pty = this._instantiationService.createInstance(localPty_1.LocalPty, id, shouldPersist);
            this._ptys.set(id, pty);
            return pty;
        }
        async attachToProcess(id) {
            try {
                await this._localPtyService.attachToProcess(id);
                const pty = this._instantiationService.createInstance(localPty_1.LocalPty, id, true);
                this._ptys.set(id, pty);
                return pty;
            }
            catch (e) {
                this._logService.trace(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async listProcesses() {
            return this._localPtyService.listProcesses();
        }
        async reduceConnectionGraceTime() {
            this._localPtyService.reduceConnectionGraceTime();
        }
        async getDefaultSystemShell(osOverride) {
            return this._localPtyService.getDefaultSystemShell(osOverride);
        }
        async getProfiles(profiles, defaultProfile, includeDetectedProfiles) {
            var _a, _b;
            return ((_b = (_a = this._localPtyService).getProfiles) === null || _b === void 0 ? void 0 : _b.call(_a, this._workspaceContextService.getWorkspace().id, profiles, defaultProfile, includeDetectedProfiles)) || [];
        }
        async getEnvironment() {
            return this._localPtyService.getEnvironment();
        }
        async getShellEnvironment() {
            return this._shellEnvironmentService.getShellEnv();
        }
        async getWslPath(original) {
            return this._localPtyService.getWslPath(original);
        }
        async setTerminalLayoutInfo(layoutInfo) {
            const args = {
                workspaceId: this._getWorkspaceId(),
                tabs: layoutInfo ? layoutInfo.tabs : []
            };
            await this._localPtyService.setTerminalLayoutInfo(args);
            // Store in the storage service as well to be used when reviving processes as normally this
            // is stored in memory on the pty host
            this._storageService.store("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, JSON.stringify(args), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async getTerminalLayoutInfo() {
            const layoutArgs = {
                workspaceId: this._getWorkspaceId()
            };
            // Revive processes if needed
            const serializedState = this._storageService.get("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
            const parsed = this._deserializeTerminalState(serializedState);
            if (parsed) {
                try {
                    // Create variable resolver
                    const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
                    const lastActiveWorkspace = activeWorkspaceRootUri ? (0, types_1.withNullAsUndefined)(this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
                    const variableResolver = terminalEnvironment.createVariableResolver(lastActiveWorkspace, await this._terminalProfileResolverService.getEnvironment(this.remoteAuthority), this._configurationResolverService);
                    // Re-resolve the environments and replace it on the state so local terminals use a fresh
                    // environment
                    for (const state of parsed) {
                        const freshEnv = await this._resolveEnvironmentForRevive(variableResolver, state.shellLaunchConfig);
                        state.processLaunchConfig.env = freshEnv;
                    }
                    await this._localPtyService.reviveTerminalProcesses(parsed, Intl.DateTimeFormat().resolvedOptions().locale);
                    this._storageService.remove("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
                    // If reviving processes, send the terminal layout info back to the pty host as it
                    // will not have been persisted on application exit
                    const layoutInfo = this._storageService.get("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    if (layoutInfo) {
                        await this._localPtyService.setTerminalLayoutInfo(JSON.parse(layoutInfo));
                        this._storageService.remove("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    }
                }
                catch (_a) {
                    // no-op
                }
            }
            return this._localPtyService.getTerminalLayoutInfo(layoutArgs);
        }
        async _resolveEnvironmentForRevive(variableResolver, shellLaunchConfig) {
            const platformKey = platform_1.isWindows ? 'windows' : (platform_1.isMacintosh ? 'osx' : 'linux');
            const envFromConfigValue = this._configurationService.getValue(`terminal.integrated.env.${platformKey}`);
            const baseEnv = await (shellLaunchConfig.useShellEnvironment ? this.getShellEnvironment() : this.getEnvironment());
            const env = await terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, envFromConfigValue, variableResolver, this._productService.version, this._configurationService.getValue("terminal.integrated.detectLocale" /* TerminalSettingId.DetectLocale */), baseEnv);
            if (!shellLaunchConfig.strictEnv && !shellLaunchConfig.hideFromUser) {
                await this._environmentVariableService.mergedCollection.applyToProcessEnvironment(env, variableResolver);
            }
            return env;
        }
        _getWorkspaceId() {
            return this._workspaceContextService.getWorkspace().id;
        }
        _getWorkspaceName() {
            return this._labelService.getWorkspaceLabel(this._workspaceContextService.getWorkspace());
        }
    };
    LocalTerminalBackend = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, log_1.ILogService),
        __param(4, terminal_1.ILocalPtyService),
        __param(5, label_1.ILabelService),
        __param(6, shellEnvironmentService_1.IShellEnvironmentService),
        __param(7, storage_1.IStorageService),
        __param(8, configurationResolver_1.IConfigurationResolverService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, productService_1.IProductService),
        __param(12, history_1.IHistoryService),
        __param(13, terminal_3.ITerminalProfileResolverService),
        __param(14, environmentVariable_1.IEnvironmentVariableService),
        __param(15, notification_1.INotificationService),
        __param(16, history_1.IHistoryService)
    ], LocalTerminalBackend);
});
//# sourceMappingURL=localTerminalBackend.js.map