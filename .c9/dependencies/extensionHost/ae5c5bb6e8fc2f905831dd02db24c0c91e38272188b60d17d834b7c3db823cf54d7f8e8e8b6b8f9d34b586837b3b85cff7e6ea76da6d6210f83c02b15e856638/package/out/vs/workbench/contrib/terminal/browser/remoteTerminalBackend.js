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
define(["require", "exports", "vs/base/common/event", "vs/base/common/marshalling", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/baseTerminalBackend", "vs/workbench/contrib/terminal/browser/remotePty", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/remoteTerminalChannel", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, event_1, marshalling_1, commands_1, configuration_1, instantiation_1, log_1, notification_1, platform_1, remoteAuthorityResolver_1, storage_1, workspace_1, baseTerminalBackend_1, remotePty_1, terminal_1, remoteTerminalChannel_1, terminal_2, configurationResolver_1, history_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTerminalBackendContribution = void 0;
    let RemoteTerminalBackendContribution = class RemoteTerminalBackendContribution {
        constructor(instantiationService, remoteAgentService, terminalService) {
            var _a;
            const remoteAuthority = (_a = remoteAgentService.getConnection()) === null || _a === void 0 ? void 0 : _a.remoteAuthority;
            if (remoteAuthority) {
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    const channel = instantiationService.createInstance(remoteTerminalChannel_1.RemoteTerminalChannelClient, connection.remoteAuthority, connection.getChannel(remoteTerminalChannel_1.REMOTE_TERMINAL_CHANNEL_NAME));
                    const backend = instantiationService.createInstance(RemoteTerminalBackend, remoteAuthority, channel);
                    platform_1.Registry.as(terminal_2.TerminalExtensions.Backend).registerTerminalBackend(backend);
                    terminalService.handleNewRegisteredBackend(backend);
                }
            }
        }
    };
    RemoteTerminalBackendContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, terminal_1.ITerminalService)
    ], RemoteTerminalBackendContribution);
    exports.RemoteTerminalBackendContribution = RemoteTerminalBackendContribution;
    let RemoteTerminalBackend = class RemoteTerminalBackend extends baseTerminalBackend_1.BaseTerminalBackend {
        constructor(remoteAuthority, _remoteTerminalChannel, _remoteAgentService, logService, _commandService, _storageService, notificationService, _remoteAuthorityResolverService, workspaceContextService, configurationResolverService, _historyService, _configurationService) {
            super(_remoteTerminalChannel, logService, notificationService, _historyService, configurationResolverService, workspaceContextService);
            this.remoteAuthority = remoteAuthority;
            this._remoteTerminalChannel = _remoteTerminalChannel;
            this._remoteAgentService = _remoteAgentService;
            this._commandService = _commandService;
            this._storageService = _storageService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._historyService = _historyService;
            this._configurationService = _configurationService;
            this._ptys = new Map();
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._onRestoreCommands = this._register(new event_1.Emitter());
            this.onRestoreCommands = this._onRestoreCommands.event;
            this._remoteTerminalChannel.onProcessData(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleData(e.event); });
            this._remoteTerminalChannel.onProcessReplay(e => {
                var _a;
                (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleReplay(e.event);
                if (e.event.commands.commands.length > 0) {
                    this._onRestoreCommands.fire({ id: e.id, commands: e.event.commands.commands });
                }
            });
            this._remoteTerminalChannel.onProcessOrphanQuestion(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleOrphanQuestion(); });
            this._remoteTerminalChannel.onDidRequestDetach(e => this._onDidRequestDetach.fire(e));
            this._remoteTerminalChannel.onProcessReady(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleReady(e.event); });
            this._remoteTerminalChannel.onDidChangeProperty(e => { var _a; return (_a = this._ptys.get(e.id)) === null || _a === void 0 ? void 0 : _a.handleDidChangeProperty(e.property); });
            this._remoteTerminalChannel.onProcessExit(e => {
                const pty = this._ptys.get(e.id);
                if (pty) {
                    pty.handleExit(e.event);
                    this._ptys.delete(e.id);
                }
            });
            const allowedCommands = ['_remoteCLI.openExternal', '_remoteCLI.windowOpen', '_remoteCLI.getSystemStatus', '_remoteCLI.manageExtensions'];
            this._remoteTerminalChannel.onExecuteCommand(async (e) => {
                const reqId = e.reqId;
                const commandId = e.commandId;
                if (!allowedCommands.includes(commandId)) {
                    this._remoteTerminalChannel.sendCommandResult(reqId, true, 'Invalid remote cli command: ' + commandId);
                    return;
                }
                const commandArgs = e.commandArgs.map(arg => (0, marshalling_1.revive)(arg));
                try {
                    const result = await this._commandService.executeCommand(e.commandId, ...commandArgs);
                    this._remoteTerminalChannel.sendCommandResult(reqId, false, result);
                }
                catch (err) {
                    this._remoteTerminalChannel.sendCommandResult(reqId, true, err);
                }
            });
            // Listen for config changes
            const initialConfig = this._configurationService.getValue(terminal_2.TERMINAL_CONFIG_SECTION);
            for (const match of Object.keys(initialConfig.autoReplies)) {
                // Ensure the value is truthy
                const reply = initialConfig.autoReplies[match];
                if (reply) {
                    this._remoteTerminalChannel.installAutoReply(match, reply);
                }
            }
            // TODO: Could simplify update to a single call
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.autoReplies" /* TerminalSettingId.AutoReplies */)) {
                    this._remoteTerminalChannel.uninstallAllAutoReplies();
                    const config = this._configurationService.getValue(terminal_2.TERMINAL_CONFIG_SECTION);
                    for (const match of Object.keys(config.autoReplies)) {
                        // Ensure the value is truthy
                        const reply = config.autoReplies[match];
                        if (reply) {
                            await this._remoteTerminalChannel.installAutoReply(match, reply);
                        }
                    }
                }
            }));
        }
        async requestDetachInstance(workspaceId, instanceId) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot request detach instance when there is no remote!`);
            }
            return this._remoteTerminalChannel.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot accept detached instance when there is no remote!`);
            }
            else if (!persistentProcessId) {
                this._logService.warn('Cannot attach to feature terminals, custom pty terminals, or those without a persistentProcessId');
                return;
            }
            return this._remoteTerminalChannel.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async persistTerminalState() {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot persist terminal state when there is no remote!`);
            }
            const ids = Array.from(this._ptys.keys());
            const serialized = await this._remoteTerminalChannel.serializeTerminalState(ids);
            this._storageService.store("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async createProcess(shellLaunchConfig, cwd, // TODO: This is ignored
        cols, rows, unicodeVersion, env, // TODO: This is ignored
        options, shouldPersist) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot create remote terminal when there is no remote!`);
            }
            // Fetch the environment to check shell permissions
            const remoteEnv = await this._remoteAgentService.getEnvironment();
            if (!remoteEnv) {
                // Extension host processes are only allowed in remote extension hosts currently
                throw new Error('Could not fetch remote environment');
            }
            const terminalConfig = this._configurationService.getValue(terminal_2.TERMINAL_CONFIG_SECTION);
            const configuration = {
                'terminal.integrated.automationShell.windows': this._configurationService.getValue("terminal.integrated.automationShell.windows" /* TerminalSettingId.AutomationShellWindows */),
                'terminal.integrated.automationShell.osx': this._configurationService.getValue("terminal.integrated.automationShell.osx" /* TerminalSettingId.AutomationShellMacOs */),
                'terminal.integrated.automationShell.linux': this._configurationService.getValue("terminal.integrated.automationShell.linux" /* TerminalSettingId.AutomationShellLinux */),
                'terminal.integrated.shell.windows': this._configurationService.getValue("terminal.integrated.shell.windows" /* TerminalSettingId.ShellWindows */),
                'terminal.integrated.shell.osx': this._configurationService.getValue("terminal.integrated.shell.osx" /* TerminalSettingId.ShellMacOs */),
                'terminal.integrated.shell.linux': this._configurationService.getValue("terminal.integrated.shell.linux" /* TerminalSettingId.ShellLinux */),
                'terminal.integrated.shellArgs.windows': this._configurationService.getValue("terminal.integrated.shellArgs.windows" /* TerminalSettingId.ShellArgsWindows */),
                'terminal.integrated.shellArgs.osx': this._configurationService.getValue("terminal.integrated.shellArgs.osx" /* TerminalSettingId.ShellArgsMacOs */),
                'terminal.integrated.shellArgs.linux': this._configurationService.getValue("terminal.integrated.shellArgs.linux" /* TerminalSettingId.ShellArgsLinux */),
                'terminal.integrated.env.windows': this._configurationService.getValue("terminal.integrated.env.windows" /* TerminalSettingId.EnvWindows */),
                'terminal.integrated.env.osx': this._configurationService.getValue("terminal.integrated.env.osx" /* TerminalSettingId.EnvMacOs */),
                'terminal.integrated.env.linux': this._configurationService.getValue("terminal.integrated.env.linux" /* TerminalSettingId.EnvLinux */),
                'terminal.integrated.cwd': this._configurationService.getValue("terminal.integrated.cwd" /* TerminalSettingId.Cwd */),
                'terminal.integrated.detectLocale': terminalConfig.detectLocale
            };
            const shellLaunchConfigDto = {
                name: shellLaunchConfig.name,
                executable: shellLaunchConfig.executable,
                args: shellLaunchConfig.args,
                cwd: shellLaunchConfig.cwd,
                env: shellLaunchConfig.env,
                useShellEnvironment: shellLaunchConfig.useShellEnvironment
            };
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
            const result = await this._remoteTerminalChannel.createProcess(shellLaunchConfigDto, configuration, activeWorkspaceRootUri, options, shouldPersist, cols, rows, unicodeVersion);
            const pty = new remotePty_1.RemotePty(result.persistentTerminalId, shouldPersist, this._remoteTerminalChannel, this._remoteAgentService, this._logService);
            this._ptys.set(result.persistentTerminalId, pty);
            return pty;
        }
        async attachToProcess(id) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot create remote terminal when there is no remote!`);
            }
            try {
                await this._remoteTerminalChannel.attachToProcess(id);
                const pty = new remotePty_1.RemotePty(id, true, this._remoteTerminalChannel, this._remoteAgentService, this._logService);
                this._ptys.set(id, pty);
                return pty;
            }
            catch (e) {
                this._logService.trace(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async listProcesses() {
            const terms = this._remoteTerminalChannel ? await this._remoteTerminalChannel.listProcesses() : [];
            return terms.map(termDto => {
                return {
                    id: termDto.id,
                    pid: termDto.pid,
                    title: termDto.title,
                    titleSource: termDto.titleSource,
                    cwd: termDto.cwd,
                    workspaceId: termDto.workspaceId,
                    workspaceName: termDto.workspaceName,
                    icon: termDto.icon,
                    color: termDto.color,
                    isOrphan: termDto.isOrphan,
                    fixedDimensions: termDto.fixedDimensions
                };
            });
        }
        async updateProperty(id, property, value) {
            var _a;
            await ((_a = this._remoteTerminalChannel) === null || _a === void 0 ? void 0 : _a.updateProperty(id, property, value));
        }
        async updateTitle(id, title, titleSource) {
            var _a;
            await ((_a = this._remoteTerminalChannel) === null || _a === void 0 ? void 0 : _a.updateTitle(id, title, titleSource));
        }
        async updateIcon(id, icon, color) {
            var _a;
            await ((_a = this._remoteTerminalChannel) === null || _a === void 0 ? void 0 : _a.updateIcon(id, icon, color));
        }
        async getDefaultSystemShell(osOverride) {
            var _a;
            return ((_a = this._remoteTerminalChannel) === null || _a === void 0 ? void 0 : _a.getDefaultSystemShell(osOverride)) || '';
        }
        async getProfiles(profiles, defaultProfile, includeDetectedProfiles) {
            var _a;
            return ((_a = this._remoteTerminalChannel) === null || _a === void 0 ? void 0 : _a.getProfiles(profiles, defaultProfile, includeDetectedProfiles)) || [];
        }
        async getEnvironment() {
            var _a;
            return ((_a = this._remoteTerminalChannel) === null || _a === void 0 ? void 0 : _a.getEnvironment()) || {};
        }
        async getShellEnvironment() {
            var _a;
            const connection = this._remoteAgentService.getConnection();
            if (!connection) {
                return undefined;
            }
            const resolverResult = await this._remoteAuthorityResolverService.resolveAuthority(connection.remoteAuthority);
            return (_a = resolverResult.options) === null || _a === void 0 ? void 0 : _a.extensionHostEnv;
        }
        async getWslPath(original) {
            var _a;
            const env = await this._remoteAgentService.getEnvironment();
            if ((env === null || env === void 0 ? void 0 : env.os) !== 1 /* OperatingSystem.Windows */) {
                return original;
            }
            return ((_a = this._remoteTerminalChannel) === null || _a === void 0 ? void 0 : _a.getWslPath(original)) || original;
        }
        async setTerminalLayoutInfo(layout) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot call setActiveInstanceId when there is no remote`);
            }
            return this._remoteTerminalChannel.setTerminalLayoutInfo(layout);
        }
        async reduceConnectionGraceTime() {
            if (!this._remoteTerminalChannel) {
                throw new Error('Cannot reduce grace time when there is no remote');
            }
            return this._remoteTerminalChannel.reduceConnectionGraceTime();
        }
        async getTerminalLayoutInfo() {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot call getActiveInstanceId when there is no remote`);
            }
            // Revive processes if needed
            const serializedState = this._storageService.get("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
            const parsed = this._deserializeTerminalState(serializedState);
            if (parsed) {
                try {
                    // Note that remote terminals do not get their environment re-resolved unlike in local terminals
                    await this._remoteTerminalChannel.reviveTerminalProcesses(parsed, Intl.DateTimeFormat().resolvedOptions().locale);
                    this._storageService.remove("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
                    // If reviving processes, send the terminal layout info back to the pty host as it
                    // will not have been persisted on application exit
                    const layoutInfo = this._storageService.get("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    if (layoutInfo) {
                        await this._remoteTerminalChannel.setTerminalLayoutInfo(JSON.parse(layoutInfo));
                        this._storageService.remove("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    }
                }
                catch (_a) {
                    // no-op
                }
            }
            return this._remoteTerminalChannel.getTerminalLayoutInfo();
        }
    };
    RemoteTerminalBackend = __decorate([
        __param(2, remoteAgentService_1.IRemoteAgentService),
        __param(3, log_1.ILogService),
        __param(4, commands_1.ICommandService),
        __param(5, storage_1.IStorageService),
        __param(6, notification_1.INotificationService),
        __param(7, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configurationResolver_1.IConfigurationResolverService),
        __param(10, history_1.IHistoryService),
        __param(11, configuration_1.IConfigurationService)
    ], RemoteTerminalBackend);
});
//# sourceMappingURL=remoteTerminalBackend.js.map