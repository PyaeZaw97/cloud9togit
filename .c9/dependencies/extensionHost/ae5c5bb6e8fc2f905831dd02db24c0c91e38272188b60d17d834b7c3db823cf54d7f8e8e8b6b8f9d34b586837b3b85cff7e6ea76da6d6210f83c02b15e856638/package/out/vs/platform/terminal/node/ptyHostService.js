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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/environment/common/environmentService", "vs/platform/shell/node/shellEnv", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/terminal/common/requestStore", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/platform/terminal/node/terminalProfiles"], function (require, exports, event_1, lifecycle_1, network_1, platform_1, ipc_1, ipc_cp_1, configuration_1, environment_1, environmentService_1, shellEnv_1, log_1, logIpc_1, requestStore_1, terminal_1, terminalPlatformConfiguration_1, terminalProfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PtyHostService = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["MaxRestarts"] = 5] = "MaxRestarts";
    })(Constants || (Constants = {}));
    /**
     * Tracks the last terminal ID from the pty host so we can give it to the new pty host if it's
     * restarted and avoid ID conflicts.
     */
    let lastPtyId = 0;
    /**
     * This service implements IPtyService by launching a pty host process, forwarding messages to and
     * from the pty host process and manages the connection.
     */
    let PtyHostService = class PtyHostService extends lifecycle_1.Disposable {
        constructor(_reconnectConstants, _configurationService, _environmentService, _logService) {
            super();
            this._reconnectConstants = _reconnectConstants;
            this._configurationService = _configurationService;
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._restartCount = 0;
            this._isResponsive = true;
            this._isDisposed = false;
            this._onPtyHostExit = this._register(new event_1.Emitter());
            this.onPtyHostExit = this._onPtyHostExit.event;
            this._onPtyHostStart = this._register(new event_1.Emitter());
            this.onPtyHostStart = this._onPtyHostStart.event;
            this._onPtyHostUnresponsive = this._register(new event_1.Emitter());
            this.onPtyHostUnresponsive = this._onPtyHostUnresponsive.event;
            this._onPtyHostResponsive = this._register(new event_1.Emitter());
            this.onPtyHostResponsive = this._onPtyHostResponsive.event;
            this._onPtyHostRequestResolveVariables = this._register(new event_1.Emitter());
            this.onPtyHostRequestResolveVariables = this._onPtyHostRequestResolveVariables.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._onProcessOrphanQuestion.event;
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            // Platform configuration is required on the process running the pty host (shared process or
            // remote server).
            (0, terminalPlatformConfiguration_1.registerTerminalPlatformConfiguration)();
            this._shellEnv = this._resolveShellEnv();
            this._register((0, lifecycle_1.toDisposable)(() => this._disposePtyHost()));
            this._resolveVariablesRequestStore = this._register(new requestStore_1.RequestStore(undefined, this._logService));
            this._resolveVariablesRequestStore.onCreateRequest(this._onPtyHostRequestResolveVariables.fire, this._onPtyHostRequestResolveVariables);
            [this._client, this._proxy] = this._startPtyHost();
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */)) {
                    await this._refreshIgnoreProcessNames();
                }
            }));
        }
        async initialize() {
            await this._refreshIgnoreProcessNames();
        }
        get _ignoreProcessNames() {
            return this._configurationService.getValue("terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */);
        }
        async _refreshIgnoreProcessNames() {
            var _a, _b;
            return (_b = (_a = this._proxy).refreshIgnoreProcessNames) === null || _b === void 0 ? void 0 : _b.call(_a, this._ignoreProcessNames);
        }
        async _resolveShellEnv() {
            if (platform_1.isWindows) {
                return process.env;
            }
            try {
                return await (0, shellEnv_1.getResolvedShellEnv)(this._logService, { _: [] }, process.env);
            }
            catch (error) {
                this._logService.error('ptyHost was unable to resolve shell environment', error);
                return {};
            }
        }
        _startPtyHost() {
            const opts = {
                serverName: 'Pty Host',
                args: ['--type=ptyHost'],
                env: {
                    VSCODE_LAST_PTY_ID: lastPtyId,
                    VSCODE_AMD_ENTRYPOINT: 'vs/platform/terminal/node/ptyHostMain',
                    VSCODE_PIPE_LOGGING: 'true',
                    VSCODE_VERBOSE_LOGGING: 'true',
                    VSCODE_RECONNECT_GRACE_TIME: this._reconnectConstants.graceTime,
                    VSCODE_RECONNECT_SHORT_GRACE_TIME: this._reconnectConstants.shortGraceTime,
                    VSCODE_RECONNECT_SCROLLBACK: this._reconnectConstants.scrollback
                }
            };
            const ptyHostDebug = (0, environmentService_1.parsePtyHostPort)(this._environmentService.args, this._environmentService.isBuilt);
            if (ptyHostDebug) {
                if (ptyHostDebug.break && ptyHostDebug.port) {
                    opts.debugBrk = ptyHostDebug.port;
                }
                else if (!ptyHostDebug.break && ptyHostDebug.port) {
                    opts.debug = ptyHostDebug.port;
                }
            }
            const client = new ipc_cp_1.Client(network_1.FileAccess.asFileUri('bootstrap-fork', require).fsPath, opts);
            this._onPtyHostStart.fire();
            // Setup heartbeat service and trigger a heartbeat immediately to reset the timeouts
            const heartbeatService = ipc_1.ProxyChannel.toService(client.getChannel(terminal_1.TerminalIpcChannels.Heartbeat));
            heartbeatService.onBeat(() => this._handleHeartbeat());
            this._handleHeartbeat();
            // Handle exit
            this._register(client.onDidProcessExit(e => {
                this._onPtyHostExit.fire(e.code);
                if (!this._isDisposed) {
                    if (this._restartCount <= Constants.MaxRestarts) {
                        this._logService.error(`ptyHost terminated unexpectedly with code ${e.code}`);
                        this._restartCount++;
                        this.restartPtyHost();
                    }
                    else {
                        this._logService.error(`ptyHost terminated unexpectedly with code ${e.code}, giving up`);
                    }
                }
            }));
            // Setup logging
            const logChannel = client.getChannel(terminal_1.TerminalIpcChannels.Log);
            logIpc_1.LogLevelChannelClient.setLevel(logChannel, this._logService.getLevel());
            this._register(this._logService.onDidChangeLogLevel(() => {
                logIpc_1.LogLevelChannelClient.setLevel(logChannel, this._logService.getLevel());
            }));
            // Create proxy and forward events
            const proxy = ipc_1.ProxyChannel.toService(client.getChannel(terminal_1.TerminalIpcChannels.PtyHost));
            this._register(proxy.onProcessData(e => this._onProcessData.fire(e)));
            this._register(proxy.onProcessReady(e => this._onProcessReady.fire(e)));
            this._register(proxy.onProcessExit(e => this._onProcessExit.fire(e)));
            this._register(proxy.onDidChangeProperty(e => this._onDidChangeProperty.fire(e)));
            this._register(proxy.onProcessReplay(e => this._onProcessReplay.fire(e)));
            this._register(proxy.onProcessOrphanQuestion(e => this._onProcessOrphanQuestion.fire(e)));
            this._register(proxy.onDidRequestDetach(e => this._onDidRequestDetach.fire(e)));
            return [client, proxy];
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName) {
            const timeout = setTimeout(() => this._handleUnresponsiveCreateProcess(), terminal_1.HeartbeatConstants.CreateProcessTimeout);
            const id = await this._proxy.createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName);
            clearTimeout(timeout);
            lastPtyId = Math.max(lastPtyId, id);
            return id;
        }
        updateTitle(id, title, titleSource) {
            return this._proxy.updateTitle(id, title, titleSource);
        }
        updateIcon(id, icon, color) {
            return this._proxy.updateIcon(id, icon, color);
        }
        attachToProcess(id) {
            return this._proxy.attachToProcess(id);
        }
        detachFromProcess(id) {
            return this._proxy.detachFromProcess(id);
        }
        listProcesses() {
            return this._proxy.listProcesses();
        }
        reduceConnectionGraceTime() {
            return this._proxy.reduceConnectionGraceTime();
        }
        start(id) {
            return this._proxy.start(id);
        }
        shutdown(id, immediate) {
            return this._proxy.shutdown(id, immediate);
        }
        input(id, data) {
            return this._proxy.input(id, data);
        }
        processBinary(id, data) {
            return this._proxy.processBinary(id, data);
        }
        resize(id, cols, rows) {
            return this._proxy.resize(id, cols, rows);
        }
        acknowledgeDataEvent(id, charCount) {
            return this._proxy.acknowledgeDataEvent(id, charCount);
        }
        setUnicodeVersion(id, version) {
            return this._proxy.setUnicodeVersion(id, version);
        }
        getInitialCwd(id) {
            return this._proxy.getInitialCwd(id);
        }
        getCwd(id) {
            return this._proxy.getCwd(id);
        }
        getLatency(id) {
            return this._proxy.getLatency(id);
        }
        orphanQuestionReply(id) {
            return this._proxy.orphanQuestionReply(id);
        }
        installAutoReply(match, reply) {
            return this._proxy.installAutoReply(match, reply);
        }
        uninstallAllAutoReplies() {
            return this._proxy.uninstallAllAutoReplies();
        }
        uninstallAutoReply(match) {
            return this._proxy.uninstallAutoReply(match);
        }
        getDefaultSystemShell(osOverride) {
            return this._proxy.getDefaultSystemShell(osOverride);
        }
        async getProfiles(workspaceId, profiles, defaultProfile, includeDetectedProfiles = false) {
            const shellEnv = await this._shellEnv;
            return (0, terminalProfiles_1.detectAvailableProfiles)(profiles, defaultProfile, includeDetectedProfiles, this._configurationService, shellEnv, undefined, this._logService, this._resolveVariables.bind(this, workspaceId));
        }
        getEnvironment() {
            return this._proxy.getEnvironment();
        }
        getWslPath(original) {
            return this._proxy.getWslPath(original);
        }
        setTerminalLayoutInfo(args) {
            return this._proxy.setTerminalLayoutInfo(args);
        }
        async getTerminalLayoutInfo(args) {
            return await this._proxy.getTerminalLayoutInfo(args);
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._proxy.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            return this._proxy.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async serializeTerminalState(ids) {
            return this._proxy.serializeTerminalState(ids);
        }
        async reviveTerminalProcesses(state, dateTimeFormatLocate) {
            return this._proxy.reviveTerminalProcesses(state, dateTimeFormatLocate);
        }
        async refreshProperty(id, property) {
            return this._proxy.refreshProperty(id, property);
        }
        async updateProperty(id, property, value) {
            return this._proxy.updateProperty(id, property, value);
        }
        async restartPtyHost() {
            this._isResponsive = true;
            this._disposePtyHost();
            [this._client, this._proxy] = this._startPtyHost();
        }
        _disposePtyHost() {
            var _a, _b;
            (_b = (_a = this._proxy).shutdownAll) === null || _b === void 0 ? void 0 : _b.call(_a);
            this._client.dispose();
        }
        _handleHeartbeat() {
            this._clearHeartbeatTimeouts();
            this._heartbeatFirstTimeout = setTimeout(() => this._handleHeartbeatFirstTimeout(), terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier);
            if (!this._isResponsive) {
                this._isResponsive = true;
                this._onPtyHostResponsive.fire();
            }
        }
        _handleHeartbeatFirstTimeout() {
            this._logService.warn(`No ptyHost heartbeat after ${terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier / 1000} seconds`);
            this._heartbeatFirstTimeout = undefined;
            this._heartbeatSecondTimeout = setTimeout(() => this._handleHeartbeatSecondTimeout(), terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.SecondWaitMultiplier);
        }
        _handleHeartbeatSecondTimeout() {
            this._logService.error(`No ptyHost heartbeat after ${(terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier + terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier) / 1000} seconds`);
            this._heartbeatSecondTimeout = undefined;
            if (this._isResponsive) {
                this._isResponsive = false;
                this._onPtyHostUnresponsive.fire();
            }
        }
        _handleUnresponsiveCreateProcess() {
            this._clearHeartbeatTimeouts();
            this._logService.error(`No ptyHost response to createProcess after ${terminal_1.HeartbeatConstants.CreateProcessTimeout / 1000} seconds`);
            if (this._isResponsive) {
                this._isResponsive = false;
                this._onPtyHostUnresponsive.fire();
            }
        }
        _clearHeartbeatTimeouts() {
            if (this._heartbeatFirstTimeout) {
                clearTimeout(this._heartbeatFirstTimeout);
                this._heartbeatFirstTimeout = undefined;
            }
            if (this._heartbeatSecondTimeout) {
                clearTimeout(this._heartbeatSecondTimeout);
                this._heartbeatSecondTimeout = undefined;
            }
        }
        _resolveVariables(workspaceId, text) {
            return this._resolveVariablesRequestStore.createRequest({ workspaceId, originalText: text });
        }
        async acceptPtyHostResolvedVariables(requestId, resolved) {
            this._resolveVariablesRequestStore.acceptReply(requestId, resolved);
        }
    };
    PtyHostService = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, log_1.ILogService)
    ], PtyHostService);
    exports.PtyHostService = PtyHostService;
});
//# sourceMappingURL=ptyHostService.js.map