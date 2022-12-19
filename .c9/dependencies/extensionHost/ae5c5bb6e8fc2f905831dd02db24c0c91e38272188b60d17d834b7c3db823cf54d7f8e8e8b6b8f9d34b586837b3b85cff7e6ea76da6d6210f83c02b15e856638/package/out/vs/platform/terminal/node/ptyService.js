/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/node/shell", "vs/platform/terminal/common/requestStore", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalDataBuffering", "vs/platform/terminal/common/terminalEnvironment", "xterm-headless", "vs/platform/terminal/node/terminalEnvironment", "vs/platform/terminal/node/terminalProcess", "vs/nls", "vs/platform/terminal/node/childProcessMonitor", "vs/platform/terminal/common/terminalAutoResponder", "vs/base/common/errors", "vs/platform/terminal/common/xterm/shellIntegrationAddon"], function (require, exports, child_process_1, async_1, event_1, lifecycle_1, platform_1, shell_1, requestStore_1, terminal_1, terminalDataBuffering_1, terminalEnvironment_1, xterm_headless_1, terminalEnvironment_2, terminalProcess_1, nls_1, childProcessMonitor_1, terminalAutoResponder_1, errors_1, shellIntegrationAddon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersistentTerminalProcess = exports.PtyService = void 0;
    let SerializeAddon;
    let Unicode11Addon;
    class PtyService extends lifecycle_1.Disposable {
        constructor(_lastPtyId, _logService, _reconnectConstants) {
            super();
            this._lastPtyId = _lastPtyId;
            this._logService = _logService;
            this._reconnectConstants = _reconnectConstants;
            this._ptys = new Map();
            this._workspaceLayoutInfos = new Map();
            this._revivedPtyIdMap = new Map();
            this._autoReplies = new Map();
            this._onHeartbeat = this._register(new event_1.Emitter());
            this.onHeartbeat = this._onHeartbeat.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._onProcessOrphanQuestion.event;
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const pty of this._ptys.values()) {
                    pty.shutdown(true);
                }
                this._ptys.clear();
            }));
            this._detachInstanceRequestStore = this._register(new requestStore_1.RequestStore(undefined, this._logService));
            this._detachInstanceRequestStore.onCreateRequest(this._onDidRequestDetach.fire, this._onDidRequestDetach);
        }
        async refreshIgnoreProcessNames(names) {
            childProcessMonitor_1.ignoreProcessNames.length = 0;
            childProcessMonitor_1.ignoreProcessNames.push(...names);
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._detachInstanceRequestStore.createRequest({ workspaceId, instanceId });
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            let processDetails = undefined;
            const pty = this._ptys.get(persistentProcessId);
            if (pty) {
                processDetails = await this._buildProcessDetails(persistentProcessId, pty);
            }
            this._detachInstanceRequestStore.acceptReply(requestId, processDetails);
        }
        async serializeTerminalState(ids) {
            const promises = [];
            for (const [persistentProcessId, persistentProcess] of this._ptys.entries()) {
                // Only serialize persistent processes that have had data written or performed a replay
                if (persistentProcess.hasWrittenData && ids.indexOf(persistentProcessId) !== -1) {
                    promises.push(async_1.Promises.withAsyncBody(async (r) => {
                        r({
                            id: persistentProcessId,
                            shellLaunchConfig: persistentProcess.shellLaunchConfig,
                            processDetails: await this._buildProcessDetails(persistentProcessId, persistentProcess),
                            processLaunchConfig: persistentProcess.processLaunchOptions,
                            unicodeVersion: persistentProcess.unicodeVersion,
                            replayEvent: await persistentProcess.serializeNormalBuffer(),
                            timestamp: Date.now()
                        });
                    }));
                }
            }
            const serialized = {
                version: 1,
                state: await Promise.all(promises)
            };
            return JSON.stringify(serialized);
        }
        async reviveTerminalProcesses(state, dateTimeFormatLocate) {
            for (const terminal of state) {
                const restoreMessage = (0, nls_1.localize)({
                    key: 'terminal-session-restore',
                    comment: ['date the snapshot was taken', 'time the snapshot was taken']
                }, "Session contents restored from {0} at {1}", new Date(terminal.timestamp).toLocaleDateString(dateTimeFormatLocate), new Date(terminal.timestamp).toLocaleTimeString(dateTimeFormatLocate));
                const newId = await this.createProcess(Object.assign(Object.assign({}, terminal.shellLaunchConfig), { cwd: terminal.processDetails.cwd, color: terminal.processDetails.color, icon: terminal.processDetails.icon, name: terminal.processDetails.titleSource === terminal_1.TitleEventSource.Api ? terminal.processDetails.title : undefined, initialText: terminal.replayEvent.events[0].data + '\x1b[0m\n\n\r\x1b[1;48;5;252;38;5;234m ' + restoreMessage + ' \x1b[K\x1b[0m\n\r' }), terminal.processDetails.cwd, terminal.replayEvent.events[0].cols, terminal.replayEvent.events[0].rows, terminal.unicodeVersion, terminal.processLaunchConfig.env, terminal.processLaunchConfig.executableEnv, terminal.processLaunchConfig.options, true, terminal.processDetails.workspaceId, terminal.processDetails.workspaceName, true);
                // Don't start the process here as there's no terminal to answer CPR
                this._revivedPtyIdMap.set(terminal.id, { newId, state: terminal });
            }
        }
        async shutdownAll() {
            this.dispose();
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName, isReviving) {
            if (shellLaunchConfig.attachPersistentProcess) {
                throw new Error('Attempt to create a process when attach object was provided');
            }
            const id = ++this._lastPtyId;
            const process = new terminalProcess_1.TerminalProcess(shellLaunchConfig, cwd, cols, rows, env, executableEnv, options, this._logService);
            process.onProcessData(event => this._onProcessData.fire({ id, event }));
            const processLaunchOptions = {
                env,
                executableEnv,
                options
            };
            const persistentProcess = new PersistentTerminalProcess(id, process, workspaceId, workspaceName, shouldPersist, cols, rows, processLaunchOptions, unicodeVersion, this._reconnectConstants, this._logService, isReviving ? shellLaunchConfig.initialText : undefined, shellLaunchConfig.icon, shellLaunchConfig.color, shellLaunchConfig.name, shellLaunchConfig.fixedDimensions);
            process.onDidChangeProperty(property => this._onDidChangeProperty.fire({ id, property }));
            process.onProcessExit(event => {
                persistentProcess.dispose();
                this._ptys.delete(id);
                this._onProcessExit.fire({ id, event });
            });
            persistentProcess.onProcessReplay(event => this._onProcessReplay.fire({ id, event }));
            persistentProcess.onProcessReady(event => this._onProcessReady.fire({ id, event }));
            persistentProcess.onProcessOrphanQuestion(() => this._onProcessOrphanQuestion.fire({ id }));
            persistentProcess.onDidChangeProperty(property => this._onDidChangeProperty.fire({ id, property }));
            persistentProcess.onPersistentProcessReady(() => {
                for (const e of this._autoReplies.entries()) {
                    persistentProcess.installAutoReply(e[0], e[1]);
                }
            });
            this._ptys.set(id, persistentProcess);
            return id;
        }
        async attachToProcess(id) {
            try {
                this._throwIfNoPty(id).attach();
                this._logService.trace(`Persistent process reconnection "${id}"`);
            }
            catch (e) {
                this._logService.trace(`Persistent process reconnection "${id}" failed`, e.message);
            }
        }
        async updateTitle(id, title, titleSource) {
            this._throwIfNoPty(id).setTitle(title, titleSource);
        }
        async updateIcon(id, icon, color) {
            this._throwIfNoPty(id).setIcon(icon, color);
        }
        async refreshProperty(id, type) {
            return this._throwIfNoPty(id).refreshProperty(type);
        }
        async updateProperty(id, type, value) {
            return this._throwIfNoPty(id).updateProperty(type, value);
        }
        async detachFromProcess(id) {
            return this._throwIfNoPty(id).detach();
        }
        async reduceConnectionGraceTime() {
            for (const pty of this._ptys.values()) {
                pty.reduceGraceTime();
            }
        }
        async listProcesses() {
            const persistentProcesses = Array.from(this._ptys.entries()).filter(([_, pty]) => pty.shouldPersistTerminal);
            this._logService.info(`Listing ${persistentProcesses.length} persistent terminals, ${this._ptys.size} total terminals`);
            const promises = persistentProcesses.map(async ([id, terminalProcessData]) => this._buildProcessDetails(id, terminalProcessData));
            const allTerminals = await Promise.all(promises);
            return allTerminals.filter(entry => entry.isOrphan);
        }
        async start(id) {
            this._logService.trace('ptyService#start', id);
            const pty = this._ptys.get(id);
            return pty ? pty.start() : { message: `Could not find pty with id "${id}"` };
        }
        async shutdown(id, immediate) {
            var _a;
            // Don't throw if the pty is already shutdown
            this._logService.trace('ptyService#shutDown', id, immediate);
            return (_a = this._ptys.get(id)) === null || _a === void 0 ? void 0 : _a.shutdown(immediate);
        }
        async input(id, data) {
            return this._throwIfNoPty(id).input(data);
        }
        async processBinary(id, data) {
            return this._throwIfNoPty(id).writeBinary(data);
        }
        async resize(id, cols, rows) {
            return this._throwIfNoPty(id).resize(cols, rows);
        }
        async getInitialCwd(id) {
            return this._throwIfNoPty(id).getInitialCwd();
        }
        async getCwd(id) {
            return this._throwIfNoPty(id).getCwd();
        }
        async acknowledgeDataEvent(id, charCount) {
            return this._throwIfNoPty(id).acknowledgeDataEvent(charCount);
        }
        async setUnicodeVersion(id, version) {
            return this._throwIfNoPty(id).setUnicodeVersion(version);
        }
        async getLatency(id) {
            return 0;
        }
        async orphanQuestionReply(id) {
            return this._throwIfNoPty(id).orphanQuestionReply();
        }
        async installAutoReply(match, reply) {
            this._autoReplies.set(match, reply);
            // If the auto reply exists on any existing terminals it will be overridden
            for (const p of this._ptys.values()) {
                p.installAutoReply(match, reply);
            }
        }
        async uninstallAllAutoReplies() {
            for (const match of this._autoReplies.keys()) {
                for (const p of this._ptys.values()) {
                    p.uninstallAutoReply(match);
                }
            }
        }
        async uninstallAutoReply(match) {
            for (const p of this._ptys.values()) {
                p.uninstallAutoReply(match);
            }
        }
        async getDefaultSystemShell(osOverride = platform_1.OS) {
            return (0, shell_1.getSystemShell)(osOverride, process.env);
        }
        async getEnvironment() {
            return Object.assign({}, process.env);
        }
        async getWslPath(original) {
            if (!platform_1.isWindows) {
                return original;
            }
            if ((0, terminalEnvironment_2.getWindowsBuildNumber)() < 17063) {
                return original.replace(/\\/g, '/');
            }
            return new Promise(c => {
                const proc = (0, child_process_1.execFile)('bash.exe', ['-c', `wslpath ${(0, terminalEnvironment_1.escapeNonWindowsPath)(original)}`], {}, (error, stdout, stderr) => {
                    c((0, terminalEnvironment_1.escapeNonWindowsPath)(stdout.trim()));
                });
                proc.stdin.end();
            });
        }
        async setTerminalLayoutInfo(args) {
            this._workspaceLayoutInfos.set(args.workspaceId, args);
        }
        async getTerminalLayoutInfo(args) {
            const layout = this._workspaceLayoutInfos.get(args.workspaceId);
            this._logService.trace('ptyService#getLayoutInfo', args);
            if (layout) {
                const expandedTabs = await Promise.all(layout.tabs.map(async (tab) => this._expandTerminalTab(tab)));
                const tabs = expandedTabs.filter(t => t.terminals.length > 0);
                this._logService.trace('ptyService#returnLayoutInfo', tabs);
                return { tabs };
            }
            return undefined;
        }
        async _expandTerminalTab(tab) {
            const expandedTerminals = (await Promise.all(tab.terminals.map(t => this._expandTerminalInstance(t))));
            const filtered = expandedTerminals.filter(term => term.terminal !== null);
            return {
                isActive: tab.isActive,
                activePersistentProcessId: tab.activePersistentProcessId,
                terminals: filtered
            };
        }
        async _expandTerminalInstance(t) {
            var _a, _b;
            try {
                const revivedPtyId = (_a = this._revivedPtyIdMap.get(t.terminal)) === null || _a === void 0 ? void 0 : _a.newId;
                const persistentProcessId = revivedPtyId !== null && revivedPtyId !== void 0 ? revivedPtyId : t.terminal;
                const persistentProcess = this._throwIfNoPty(persistentProcessId);
                const processDetails = persistentProcess && await this._buildProcessDetails(t.terminal, persistentProcess, revivedPtyId !== undefined);
                return {
                    terminal: (_b = Object.assign(Object.assign({}, processDetails), { id: persistentProcessId })) !== null && _b !== void 0 ? _b : null,
                    relativeSize: t.relativeSize
                };
            }
            catch (e) {
                this._logService.trace(`Couldn't get layout info, a terminal was probably disconnected`, e.message);
                // this will be filtered out and not reconnected
                return {
                    terminal: null,
                    relativeSize: t.relativeSize
                };
            }
        }
        async _buildProcessDetails(id, persistentProcess, wasRevived = false) {
            // If the process was just revived, don't do the orphan check as it will
            // take some time
            const [cwd, isOrphan] = await Promise.all([persistentProcess.getCwd(), wasRevived ? true : persistentProcess.isOrphaned()]);
            return {
                id,
                title: persistentProcess.title,
                titleSource: persistentProcess.titleSource,
                pid: persistentProcess.pid,
                workspaceId: persistentProcess.workspaceId,
                workspaceName: persistentProcess.workspaceName,
                cwd,
                isOrphan,
                icon: persistentProcess.icon,
                color: persistentProcess.color,
                fixedDimensions: persistentProcess.fixedDimensions
            };
        }
        _throwIfNoPty(id) {
            const pty = this._ptys.get(id);
            if (!pty) {
                throw new errors_1.ErrorNoTelemetry(`Could not find pty on pty host`);
            }
            return pty;
        }
    }
    exports.PtyService = PtyService;
    class PersistentTerminalProcess extends lifecycle_1.Disposable {
        constructor(_persistentProcessId, _terminalProcess, workspaceId, workspaceName, shouldPersistTerminal, cols, rows, processLaunchOptions, unicodeVersion, reconnectConstants, _logService, reviveBuffer, _icon, _color, name, fixedDimensions) {
            super();
            this._persistentProcessId = _persistentProcessId;
            this._terminalProcess = _terminalProcess;
            this.workspaceId = workspaceId;
            this.workspaceName = workspaceName;
            this.shouldPersistTerminal = shouldPersistTerminal;
            this.processLaunchOptions = processLaunchOptions;
            this.unicodeVersion = unicodeVersion;
            this._logService = _logService;
            this._icon = _icon;
            this._color = _color;
            this._autoReplies = new Map();
            this._pendingCommands = new Map();
            this._isStarted = false;
            this._hasWrittenData = false;
            this._orphanRequestQueue = new async_1.Queue();
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onPersistentProcessReady = this._register(new event_1.Emitter());
            /** Fired when the persistent process has a ready process and has finished its replay. */
            this.onPersistentProcessReady = this._onPersistentProcessReady.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._onProcessOrphanQuestion.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._inReplay = false;
            this._pid = -1;
            this._cwd = '';
            this._titleSource = terminal_1.TitleEventSource.Process;
            if (name) {
                this.setTitle(name, terminal_1.TitleEventSource.Api);
            }
            this._logService.trace('persistentTerminalProcess#ctor', _persistentProcessId, arguments);
            this._wasRevived = reviveBuffer !== undefined;
            this._serializer = new XtermSerializer(cols, rows, reconnectConstants.scrollback, unicodeVersion, reviveBuffer, this._logService);
            this._fixedDimensions = fixedDimensions;
            this._orphanQuestionBarrier = null;
            this._orphanQuestionReplyTime = 0;
            this._disconnectRunner1 = this._register(new async_1.ProcessTimeRunOnceScheduler(() => {
                this._logService.info(`Persistent process "${this._persistentProcessId}": The reconnection grace time of ${printTime(reconnectConstants.graceTime)} has expired, shutting down pid "${this._pid}"`);
                this.shutdown(true);
            }, reconnectConstants.graceTime));
            this._disconnectRunner2 = this._register(new async_1.ProcessTimeRunOnceScheduler(() => {
                this._logService.info(`Persistent process "${this._persistentProcessId}": The short reconnection grace time of ${printTime(reconnectConstants.shortGraceTime)} has expired, shutting down pid ${this._pid}`);
                this.shutdown(true);
            }, reconnectConstants.shortGraceTime));
            this._register(this._terminalProcess.onProcessExit(() => this._bufferer.stopBuffering(this._persistentProcessId)));
            this._register(this._terminalProcess.onProcessReady(e => {
                this._pid = e.pid;
                this._cwd = e.cwd;
                this._onProcessReady.fire(e);
            }));
            this._register(this._terminalProcess.onDidChangeProperty(e => {
                this._onDidChangeProperty.fire(e);
            }));
            // Data buffering to reduce the amount of messages going to the renderer
            this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer((_, data) => this._onProcessData.fire(data));
            this._register(this._bufferer.startBuffering(this._persistentProcessId, this._terminalProcess.onProcessData));
            // Data recording for reconnect
            this._register(this.onProcessData(e => this._serializer.handleData(e)));
            // Clean up other disposables
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const e of this._autoReplies.values()) {
                    e.dispose();
                }
                this._autoReplies.clear();
            }));
        }
        get pid() { return this._pid; }
        get shellLaunchConfig() { return this._terminalProcess.shellLaunchConfig; }
        get hasWrittenData() { return this._hasWrittenData; }
        get title() { return this._title || this._terminalProcess.currentTitle; }
        get titleSource() { return this._titleSource; }
        get icon() { return this._icon; }
        get color() { return this._color; }
        get fixedDimensions() { return this._fixedDimensions; }
        setTitle(title, titleSource) {
            this._hasWrittenData = true;
            this._title = title;
            this._titleSource = titleSource;
        }
        setIcon(icon, color) {
            this._hasWrittenData = true;
            this._icon = icon;
            this._color = color;
        }
        _setFixedDimensions(fixedDimensions) {
            this._fixedDimensions = fixedDimensions;
        }
        attach() {
            this._logService.trace('persistentTerminalProcess#attach', this._persistentProcessId);
            this._disconnectRunner1.cancel();
            this._disconnectRunner2.cancel();
        }
        async detach() {
            this._logService.trace('persistentTerminalProcess#detach', this._persistentProcessId);
            if (this.shouldPersistTerminal) {
                this._disconnectRunner1.schedule();
            }
            else {
                this.shutdown(true);
            }
        }
        serializeNormalBuffer() {
            return this._serializer.generateReplayEvent(true);
        }
        async refreshProperty(type) {
            return this._terminalProcess.refreshProperty(type);
        }
        async updateProperty(type, value) {
            if (type === "fixedDimensions" /* ProcessPropertyType.FixedDimensions */) {
                return this._setFixedDimensions(value);
            }
        }
        async start() {
            this._logService.trace('persistentTerminalProcess#start', this._persistentProcessId, this._isStarted);
            if (!this._isStarted) {
                const result = await this._terminalProcess.start();
                if (result) {
                    // it's a terminal launch error
                    return result;
                }
                this._isStarted = true;
                // If the process was revived, trigger a replay on first start. An alternative approach
                // could be to start it on the pty host before attaching but this fails on Windows as
                // conpty's inherit cursor option which is required, ends up sending DSR CPR which
                // causes conhost to hang when no response is received from the terminal (which wouldn't
                // be attached yet). https://github.com/microsoft/terminal/issues/11213
                if (this._wasRevived) {
                    this.triggerReplay();
                }
                else {
                    this._onPersistentProcessReady.fire();
                }
            }
            else {
                this._onProcessReady.fire({ pid: this._pid, cwd: this._cwd, requiresWindowsMode: platform_1.isWindows && (0, terminalEnvironment_2.getWindowsBuildNumber)() < 21376 });
                this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: this._terminalProcess.currentTitle });
                this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: this._terminalProcess.shellType });
                this.triggerReplay();
            }
            return undefined;
        }
        shutdown(immediate) {
            return this._terminalProcess.shutdown(immediate);
        }
        input(data) {
            this._hasWrittenData = true;
            if (this._inReplay) {
                return;
            }
            for (const listener of this._autoReplies.values()) {
                listener.handleInput();
            }
            return this._terminalProcess.input(data);
        }
        writeBinary(data) {
            return this._terminalProcess.processBinary(data);
        }
        resize(cols, rows) {
            if (this._inReplay) {
                return;
            }
            this._serializer.handleResize(cols, rows);
            // Buffered events should flush when a resize occurs
            this._bufferer.flushBuffer(this._persistentProcessId);
            for (const listener of this._autoReplies.values()) {
                listener.handleResize();
            }
            return this._terminalProcess.resize(cols, rows);
        }
        setUnicodeVersion(version) {
            var _a, _b;
            this.unicodeVersion = version;
            (_b = (_a = this._serializer).setUnicodeVersion) === null || _b === void 0 ? void 0 : _b.call(_a, version);
            // TODO: Pass in unicode version in ctor
        }
        acknowledgeDataEvent(charCount) {
            if (this._inReplay) {
                return;
            }
            return this._terminalProcess.acknowledgeDataEvent(charCount);
        }
        getInitialCwd() {
            return this._terminalProcess.getInitialCwd();
        }
        getCwd() {
            return this._terminalProcess.getCwd();
        }
        getLatency() {
            return this._terminalProcess.getLatency();
        }
        async triggerReplay() {
            this._hasWrittenData = true;
            const ev = await this._serializer.generateReplayEvent();
            let dataLength = 0;
            for (const e of ev.events) {
                dataLength += e.data.length;
            }
            this._logService.info(`Persistent process "${this._persistentProcessId}": Replaying ${dataLength} chars and ${ev.events.length} size events`);
            this._onProcessReplay.fire(ev);
            this._terminalProcess.clearUnacknowledgedChars();
            this._onPersistentProcessReady.fire();
        }
        installAutoReply(match, reply) {
            var _a;
            (_a = this._autoReplies.get(match)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._autoReplies.set(match, new terminalAutoResponder_1.TerminalAutoResponder(this._terminalProcess, match, reply));
        }
        uninstallAutoReply(match) {
            const autoReply = this._autoReplies.get(match);
            autoReply === null || autoReply === void 0 ? void 0 : autoReply.dispose();
            this._autoReplies.delete(match);
        }
        sendCommandResult(reqId, isError, serializedPayload) {
            const data = this._pendingCommands.get(reqId);
            if (!data) {
                return;
            }
            this._pendingCommands.delete(reqId);
        }
        orphanQuestionReply() {
            this._orphanQuestionReplyTime = Date.now();
            if (this._orphanQuestionBarrier) {
                const barrier = this._orphanQuestionBarrier;
                this._orphanQuestionBarrier = null;
                barrier.open();
            }
        }
        reduceGraceTime() {
            if (this._disconnectRunner2.isScheduled()) {
                // we are disconnected and already running the short reconnection timer
                return;
            }
            if (this._disconnectRunner1.isScheduled()) {
                // we are disconnected and running the long reconnection timer
                this._disconnectRunner2.schedule();
            }
        }
        async isOrphaned() {
            return await this._orphanRequestQueue.queue(async () => this._isOrphaned());
        }
        async _isOrphaned() {
            // The process is already known to be orphaned
            if (this._disconnectRunner1.isScheduled() || this._disconnectRunner2.isScheduled()) {
                return true;
            }
            // Ask whether the renderer(s) whether the process is orphaned and await the reply
            if (!this._orphanQuestionBarrier) {
                // the barrier opens after 4 seconds with or without a reply
                this._orphanQuestionBarrier = new async_1.AutoOpenBarrier(4000);
                this._orphanQuestionReplyTime = 0;
                this._onProcessOrphanQuestion.fire();
            }
            await this._orphanQuestionBarrier.wait();
            return (Date.now() - this._orphanQuestionReplyTime > 500);
        }
    }
    exports.PersistentTerminalProcess = PersistentTerminalProcess;
    class XtermSerializer {
        constructor(cols, rows, scrollback, unicodeVersion, reviveBuffer, logService) {
            this._xterm = new xterm_headless_1.Terminal({ cols, rows, scrollback });
            if (reviveBuffer) {
                this._xterm.writeln(reviveBuffer);
            }
            this.setUnicodeVersion(unicodeVersion);
            this._shellIntegrationAddon = new shellIntegrationAddon_1.ShellIntegrationAddon(logService);
            this._xterm.loadAddon(this._shellIntegrationAddon);
        }
        handleData(data) {
            this._xterm.write(data);
        }
        handleResize(cols, rows) {
            this._xterm.resize(cols, rows);
        }
        async generateReplayEvent(normalBufferOnly) {
            const serialize = new (await this._getSerializeConstructor());
            this._xterm.loadAddon(serialize);
            const options = { scrollback: this._xterm.getOption('scrollback') };
            if (normalBufferOnly) {
                options.excludeAltBuffer = true;
                options.excludeModes = true;
            }
            const serialized = serialize.serialize(options);
            return {
                events: [
                    {
                        cols: this._xterm.getOption('cols'),
                        rows: this._xterm.getOption('rows'),
                        data: serialized
                    }
                ],
                commands: this._shellIntegrationAddon.serialize()
            };
        }
        async setUnicodeVersion(version) {
            var _a;
            if (this._xterm.unicode.activeVersion === version) {
                return;
            }
            if (version === '11') {
                this._unicodeAddon = new (await this._getUnicode11Constructor());
                this._xterm.loadAddon(this._unicodeAddon);
            }
            else {
                (_a = this._unicodeAddon) === null || _a === void 0 ? void 0 : _a.dispose();
                this._unicodeAddon = undefined;
            }
            this._xterm.unicode.activeVersion = version;
        }
        async _getUnicode11Constructor() {
            if (!Unicode11Addon) {
                Unicode11Addon = (await new Promise((resolve_1, reject_1) => { require(['xterm-addon-unicode11'], resolve_1, reject_1); })).Unicode11Addon;
            }
            return Unicode11Addon;
        }
        async _getSerializeConstructor() {
            if (!SerializeAddon) {
                SerializeAddon = (await new Promise((resolve_2, reject_2) => { require(['xterm-addon-serialize'], resolve_2, reject_2); })).SerializeAddon;
            }
            return SerializeAddon;
        }
    }
    function printTime(ms) {
        let h = 0;
        let m = 0;
        let s = 0;
        if (ms >= 1000) {
            s = Math.floor(ms / 1000);
            ms -= s * 1000;
        }
        if (s >= 60) {
            m = Math.floor(s / 60);
            s -= m * 60;
        }
        if (m >= 60) {
            h = Math.floor(m / 60);
            m -= h * 60;
        }
        const _h = h ? `${h}h` : ``;
        const _m = m ? `${m}m` : ``;
        const _s = s ? `${s}s` : ``;
        const _ms = ms ? `${ms}ms` : ``;
        return `${_h}${_m}${_s}${_ms}`;
    }
});
//# sourceMappingURL=ptyService.js.map