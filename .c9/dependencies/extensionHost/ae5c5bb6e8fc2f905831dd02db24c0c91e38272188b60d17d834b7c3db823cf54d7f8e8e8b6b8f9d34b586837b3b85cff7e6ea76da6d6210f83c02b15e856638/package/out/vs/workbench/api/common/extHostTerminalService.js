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
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/api/common/extHostRpcService", "vs/base/common/lifecycle", "./extHostTypes", "vs/nls", "vs/base/common/errors", "vs/workbench/contrib/terminal/common/environmentVariableShared", "vs/base/common/cancellation", "vs/base/common/uuid", "vs/platform/terminal/common/terminalDataBuffering", "vs/platform/theme/common/themeService", "vs/base/common/types", "vs/base/common/async"], function (require, exports, event_1, extHost_protocol_1, instantiation_1, uri_1, extHostRpcService_1, lifecycle_1, extHostTypes_1, nls_1, errors_1, environmentVariableShared_1, cancellation_1, uuid_1, terminalDataBuffering_1, themeService_1, types_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkerExtHostTerminalService = exports.EnvironmentVariableCollection = exports.BaseExtHostTerminalService = exports.ExtHostPseudoterminal = exports.ExtHostTerminal = exports.IExtHostTerminalService = void 0;
    exports.IExtHostTerminalService = (0, instantiation_1.createDecorator)('IExtHostTerminalService');
    class ExtHostTerminal {
        constructor(_proxy, _id, _creationOptions, _name) {
            this._proxy = _proxy;
            this._id = _id;
            this._creationOptions = _creationOptions;
            this._name = _name;
            this._disposed = false;
            this._state = { isInteractedWith: false };
            this.isOpen = false;
            this._creationOptions = Object.freeze(this._creationOptions);
            this._pidPromise = new Promise(c => this._pidPromiseComplete = c);
            const that = this;
            this.value = {
                get name() {
                    return that._name || '';
                },
                get processId() {
                    return that._pidPromise;
                },
                get creationOptions() {
                    return that._creationOptions;
                },
                get exitStatus() {
                    return that._exitStatus;
                },
                get state() {
                    return that._state;
                },
                sendText(text, addNewLine = true) {
                    that._checkDisposed();
                    that._proxy.$sendText(that._id, text, addNewLine);
                },
                show(preserveFocus) {
                    that._checkDisposed();
                    that._proxy.$show(that._id, preserveFocus);
                },
                hide() {
                    that._checkDisposed();
                    that._proxy.$hide(that._id);
                },
                dispose() {
                    if (!that._disposed) {
                        that._disposed = true;
                        that._proxy.$dispose(that._id);
                    }
                },
                get dimensions() {
                    if (that._cols === undefined || that._rows === undefined) {
                        return undefined;
                    }
                    return {
                        columns: that._cols,
                        rows: that._rows
                    };
                }
            };
        }
        async create(options, internalOptions) {
            if (typeof this._id !== 'string') {
                throw new Error('Terminal has already been created');
            }
            await this._proxy.$createTerminal(this._id, {
                name: options.name,
                shellPath: (0, types_1.withNullAsUndefined)(options.shellPath),
                shellArgs: (0, types_1.withNullAsUndefined)(options.shellArgs),
                cwd: (0, types_1.withNullAsUndefined)(options.cwd),
                env: (0, types_1.withNullAsUndefined)(options.env),
                icon: (0, types_1.withNullAsUndefined)(asTerminalIcon(options.iconPath)),
                color: themeService_1.ThemeColor.isThemeColor(options.color) ? options.color.id : undefined,
                initialText: (0, types_1.withNullAsUndefined)(options.message),
                strictEnv: (0, types_1.withNullAsUndefined)(options.strictEnv),
                hideFromUser: (0, types_1.withNullAsUndefined)(options.hideFromUser),
                isFeatureTerminal: (0, types_1.withNullAsUndefined)(internalOptions === null || internalOptions === void 0 ? void 0 : internalOptions.isFeatureTerminal),
                isExtensionOwnedTerminal: true,
                useShellEnvironment: (0, types_1.withNullAsUndefined)(internalOptions === null || internalOptions === void 0 ? void 0 : internalOptions.useShellEnvironment),
                location: (internalOptions === null || internalOptions === void 0 ? void 0 : internalOptions.location) || this._serializeParentTerminal(options.location, internalOptions === null || internalOptions === void 0 ? void 0 : internalOptions.resolvedExtHostIdentifier),
                isTransient: (0, types_1.withNullAsUndefined)(options.isTransient)
            });
        }
        async createExtensionTerminal(location, parentTerminal, iconPath, color) {
            if (typeof this._id !== 'string') {
                throw new Error('Terminal has already been created');
            }
            await this._proxy.$createTerminal(this._id, {
                name: this._name,
                isExtensionCustomPtyTerminal: true,
                icon: iconPath,
                color: themeService_1.ThemeColor.isThemeColor(color) ? color.id : undefined,
                location: this._serializeParentTerminal(location, parentTerminal),
                isTransient: true
            });
            // At this point, the id has been set via `$acceptTerminalOpened`
            if (typeof this._id === 'string') {
                throw new Error('Terminal creation failed');
            }
            return this._id;
        }
        _serializeParentTerminal(location, parentTerminal) {
            if (typeof location === 'object') {
                if ('parentTerminal' in location && location.parentTerminal && parentTerminal) {
                    return { parentTerminal };
                }
                if ('viewColumn' in location) {
                    return { viewColumn: location.viewColumn, preserveFocus: location.preserveFocus };
                }
                return undefined;
            }
            return location;
        }
        _checkDisposed() {
            if (this._disposed) {
                throw new Error('Terminal has already been disposed');
            }
        }
        set name(name) {
            this._name = name;
        }
        setExitCode(code) {
            this._exitStatus = Object.freeze({ code });
        }
        setDimensions(cols, rows) {
            if (cols === this._cols && rows === this._rows) {
                // Nothing changed
                return false;
            }
            if (cols === 0 || rows === 0) {
                return false;
            }
            this._cols = cols;
            this._rows = rows;
            return true;
        }
        setInteractedWith() {
            if (!this._state.isInteractedWith) {
                this._state = { isInteractedWith: true };
                return true;
            }
            return false;
        }
        _setProcessId(processId) {
            // The event may fire 2 times when the panel is restored
            if (this._pidPromiseComplete) {
                this._pidPromiseComplete(processId);
                this._pidPromiseComplete = undefined;
            }
            else {
                // Recreate the promise if this is the nth processId set (e.g. reused task terminals)
                this._pidPromise.then(pid => {
                    if (pid !== processId) {
                        this._pidPromise = Promise.resolve(processId);
                    }
                });
            }
        }
    }
    exports.ExtHostTerminal = ExtHostTerminal;
    class ExtHostPseudoterminal {
        constructor(_pty) {
            this._pty = _pty;
            this.id = 0;
            this.shouldPersist = false;
            this._onProcessData = new event_1.Emitter();
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = new event_1.Emitter();
            this._onDidChangeProperty = new event_1.Emitter();
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = new event_1.Emitter();
            this.onProcessExit = this._onProcessExit.event;
        }
        get onProcessReady() { return this._onProcessReady.event; }
        refreshProperty(property) {
            throw new Error(`refreshProperty is not suppported in extension owned terminals. property: ${property}`);
        }
        updateProperty(property, value) {
            throw new Error(`updateProperty is not suppported in extension owned terminals. property: ${property}, value: ${value}`);
        }
        async start() {
            return undefined;
        }
        shutdown() {
            this._pty.close();
        }
        input(data) {
            var _a, _b;
            (_b = (_a = this._pty).handleInput) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        }
        resize(cols, rows) {
            var _a, _b;
            (_b = (_a = this._pty).setDimensions) === null || _b === void 0 ? void 0 : _b.call(_a, { columns: cols, rows });
        }
        async processBinary(data) {
            // No-op, processBinary is not supported in extension owned terminals.
        }
        acknowledgeDataEvent(charCount) {
            // No-op, flow control is not supported in extension owned terminals. If this is ever
            // implemented it will need new pause and resume VS Code APIs.
        }
        async setUnicodeVersion(version) {
            // No-op, xterm-headless isn't used for extension owned terminals.
        }
        getInitialCwd() {
            return Promise.resolve('');
        }
        getCwd() {
            return Promise.resolve('');
        }
        getLatency() {
            return Promise.resolve(0);
        }
        startSendingEvents(initialDimensions) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            // Attach the listeners
            this._pty.onDidWrite(e => this._onProcessData.fire(e));
            (_b = (_a = this._pty).onDidClose) === null || _b === void 0 ? void 0 : _b.call(_a, (e = undefined) => {
                this._onProcessExit.fire(e === void 0 ? undefined : e);
            });
            (_d = (_c = this._pty).onDidOverrideDimensions) === null || _d === void 0 ? void 0 : _d.call(_c, e => {
                if (e) {
                    this._onDidChangeProperty.fire({ type: "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */, value: { cols: e.columns, rows: e.rows } });
                }
            });
            (_f = (_e = this._pty).onDidChangeName) === null || _f === void 0 ? void 0 : _f.call(_e, title => {
                this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: title });
            });
            this._pty.open(initialDimensions ? initialDimensions : undefined);
            if (initialDimensions) {
                (_h = (_g = this._pty).setDimensions) === null || _h === void 0 ? void 0 : _h.call(_g, initialDimensions);
            }
            this._onProcessReady.fire({ pid: -1, cwd: '' });
        }
    }
    exports.ExtHostPseudoterminal = ExtHostPseudoterminal;
    let nextLinkId = 1;
    let BaseExtHostTerminalService = class BaseExtHostTerminalService extends lifecycle_1.Disposable {
        constructor(supportsProcesses, extHostRpc) {
            super();
            this._terminals = [];
            this._terminalProcesses = new Map();
            this._terminalProcessDisposables = {};
            this._extensionTerminalAwaitingStart = {};
            this._getTerminalPromises = {};
            this._environmentVariableCollections = new Map();
            this._linkProviders = new Set();
            this._profileProviders = new Map();
            this._terminalLinkCache = new Map();
            this._terminalLinkCancellationSource = new Map();
            this._onDidCloseTerminal = new event_1.Emitter();
            this.onDidCloseTerminal = this._onDidCloseTerminal.event;
            this._onDidOpenTerminal = new event_1.Emitter();
            this.onDidOpenTerminal = this._onDidOpenTerminal.event;
            this._onDidChangeActiveTerminal = new event_1.Emitter();
            this.onDidChangeActiveTerminal = this._onDidChangeActiveTerminal.event;
            this._onDidChangeTerminalDimensions = new event_1.Emitter();
            this.onDidChangeTerminalDimensions = this._onDidChangeTerminalDimensions.event;
            this._onDidChangeTerminalState = new event_1.Emitter();
            this.onDidChangeTerminalState = this._onDidChangeTerminalState.event;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTerminalService);
            this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer(this._proxy.$sendProcessData);
            this._onDidWriteTerminalData = new event_1.Emitter({
                onFirstListenerAdd: () => this._proxy.$startSendingDataEvents(),
                onLastListenerRemove: () => this._proxy.$stopSendingDataEvents()
            });
            this._proxy.$registerProcessSupport(supportsProcesses);
            this._register({
                dispose: () => {
                    for (const [_, terminalProcess] of this._terminalProcesses) {
                        terminalProcess.shutdown(true);
                    }
                }
            });
        }
        get activeTerminal() { var _a; return (_a = this._activeTerminal) === null || _a === void 0 ? void 0 : _a.value; }
        get terminals() { return this._terminals.map(term => term.value); }
        get onDidWriteTerminalData() { return this._onDidWriteTerminalData.event; }
        getDefaultShell(useAutomationShell) {
            const profile = useAutomationShell ? this._defaultAutomationProfile : this._defaultProfile;
            return (profile === null || profile === void 0 ? void 0 : profile.path) || '';
        }
        getDefaultShellArgs(useAutomationShell) {
            const profile = useAutomationShell ? this._defaultAutomationProfile : this._defaultProfile;
            return (profile === null || profile === void 0 ? void 0 : profile.args) || [];
        }
        createExtensionTerminal(options, internalOptions) {
            const terminal = new ExtHostTerminal(this._proxy, (0, uuid_1.generateUuid)(), options, options.name);
            const p = new ExtHostPseudoterminal(options.pty);
            terminal.createExtensionTerminal(options.location, this._serializeParentTerminal(options, internalOptions).resolvedExtHostIdentifier, asTerminalIcon(options.iconPath), asTerminalColor(options.color)).then(id => {
                const disposable = this._setupExtHostProcessListeners(id, p);
                this._terminalProcessDisposables[id] = disposable;
            });
            this._terminals.push(terminal);
            return terminal.value;
        }
        _serializeParentTerminal(options, internalOptions) {
            internalOptions = internalOptions ? internalOptions : {};
            if (options.location && typeof options.location === 'object' && 'parentTerminal' in options.location) {
                const parentTerminal = options.location.parentTerminal;
                if (parentTerminal) {
                    const parentExtHostTerminal = this._terminals.find(t => t.value === parentTerminal);
                    if (parentExtHostTerminal) {
                        internalOptions.resolvedExtHostIdentifier = parentExtHostTerminal._id;
                    }
                }
            }
            else if (options.location && typeof options.location !== 'object') {
                internalOptions.location = options.location;
            }
            else if (internalOptions.location && typeof internalOptions.location === 'object' && 'splitActiveTerminal' in internalOptions.location) {
                internalOptions.location = { splitActiveTerminal: true };
            }
            return internalOptions;
        }
        attachPtyToTerminal(id, pty) {
            const terminal = this._getTerminalById(id);
            if (!terminal) {
                throw new Error(`Cannot resolve terminal with id ${id} for virtual process`);
            }
            const p = new ExtHostPseudoterminal(pty);
            const disposable = this._setupExtHostProcessListeners(id, p);
            this._terminalProcessDisposables[id] = disposable;
        }
        async $acceptActiveTerminalChanged(id) {
            const original = this._activeTerminal;
            if (id === null) {
                this._activeTerminal = undefined;
                if (original !== this._activeTerminal) {
                    this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                }
                return;
            }
            const terminal = this._getTerminalById(id);
            if (terminal) {
                this._activeTerminal = terminal;
                if (original !== this._activeTerminal) {
                    this._onDidChangeActiveTerminal.fire(this._activeTerminal.value);
                }
            }
        }
        async $acceptTerminalProcessData(id, data) {
            const terminal = this._getTerminalById(id);
            if (terminal) {
                this._onDidWriteTerminalData.fire({ terminal: terminal.value, data });
            }
        }
        async $acceptTerminalDimensions(id, cols, rows) {
            const terminal = this._getTerminalById(id);
            if (terminal) {
                if (terminal.setDimensions(cols, rows)) {
                    this._onDidChangeTerminalDimensions.fire({
                        terminal: terminal.value,
                        dimensions: terminal.value.dimensions
                    });
                }
            }
        }
        async $acceptTerminalMaximumDimensions(id, cols, rows) {
            var _a;
            // Extension pty terminal only - when virtual process resize fires it means that the
            // terminal's maximum dimensions changed
            (_a = this._terminalProcesses.get(id)) === null || _a === void 0 ? void 0 : _a.resize(cols, rows);
        }
        async $acceptTerminalTitleChange(id, name) {
            const terminal = this._getTerminalById(id);
            if (terminal) {
                terminal.name = name;
            }
        }
        async $acceptTerminalClosed(id, exitCode) {
            const index = this._getTerminalObjectIndexById(this._terminals, id);
            if (index !== null) {
                const terminal = this._terminals.splice(index, 1)[0];
                terminal.setExitCode(exitCode);
                this._onDidCloseTerminal.fire(terminal.value);
            }
        }
        $acceptTerminalOpened(id, extHostTerminalId, name, shellLaunchConfigDto) {
            if (extHostTerminalId) {
                // Resolve with the renderer generated id
                const index = this._getTerminalObjectIndexById(this._terminals, extHostTerminalId);
                if (index !== null) {
                    // The terminal has already been created (via createTerminal*), only fire the event
                    this._terminals[index]._id = id;
                    this._onDidOpenTerminal.fire(this.terminals[index]);
                    this._terminals[index].isOpen = true;
                    return;
                }
            }
            const creationOptions = {
                name: shellLaunchConfigDto.name,
                shellPath: shellLaunchConfigDto.executable,
                shellArgs: shellLaunchConfigDto.args,
                cwd: typeof shellLaunchConfigDto.cwd === 'string' ? shellLaunchConfigDto.cwd : uri_1.URI.revive(shellLaunchConfigDto.cwd),
                env: shellLaunchConfigDto.env,
                hideFromUser: shellLaunchConfigDto.hideFromUser
            };
            const terminal = new ExtHostTerminal(this._proxy, id, creationOptions, name);
            this._terminals.push(terminal);
            this._onDidOpenTerminal.fire(terminal.value);
            terminal.isOpen = true;
        }
        async $acceptTerminalProcessId(id, processId) {
            const terminal = this._getTerminalById(id);
            if (terminal) {
                terminal._setProcessId(processId);
            }
        }
        async $startExtensionTerminal(id, initialDimensions) {
            // Make sure the ExtHostTerminal exists so onDidOpenTerminal has fired before we call
            // Pseudoterminal.start
            const terminal = this._getTerminalById(id);
            if (!terminal) {
                return { message: (0, nls_1.localize)('launchFail.idMissingOnExtHost', "Could not find the terminal with id {0} on the extension host", id) };
            }
            // Wait for onDidOpenTerminal to fire
            if (!terminal.isOpen) {
                await new Promise(r => {
                    // Ensure open is called after onDidOpenTerminal
                    const listener = this.onDidOpenTerminal(async (e) => {
                        if (e === terminal.value) {
                            listener.dispose();
                            r();
                        }
                    });
                });
            }
            const terminalProcess = this._terminalProcesses.get(id);
            if (terminalProcess) {
                terminalProcess.startSendingEvents(initialDimensions);
            }
            else {
                // Defer startSendingEvents call to when _setupExtHostProcessListeners is called
                this._extensionTerminalAwaitingStart[id] = { initialDimensions };
            }
            return undefined;
        }
        _setupExtHostProcessListeners(id, p) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(p.onProcessReady(e => this._proxy.$sendProcessReady(id, e.pid, e.cwd)));
            disposables.add(p.onDidChangeProperty(property => this._proxy.$sendProcessProperty(id, property)));
            // Buffer data events to reduce the amount of messages going to the renderer
            this._bufferer.startBuffering(id, p.onProcessData);
            disposables.add(p.onProcessExit(exitCode => this._onProcessExit(id, exitCode)));
            this._terminalProcesses.set(id, p);
            const awaitingStart = this._extensionTerminalAwaitingStart[id];
            if (awaitingStart && p instanceof ExtHostPseudoterminal) {
                p.startSendingEvents(awaitingStart.initialDimensions);
                delete this._extensionTerminalAwaitingStart[id];
            }
            return disposables;
        }
        $acceptProcessAckDataEvent(id, charCount) {
            var _a;
            (_a = this._terminalProcesses.get(id)) === null || _a === void 0 ? void 0 : _a.acknowledgeDataEvent(charCount);
        }
        $acceptProcessInput(id, data) {
            var _a;
            (_a = this._terminalProcesses.get(id)) === null || _a === void 0 ? void 0 : _a.input(data);
        }
        $acceptTerminalInteraction(id) {
            const terminal = this._getTerminalById(id);
            if (terminal === null || terminal === void 0 ? void 0 : terminal.setInteractedWith()) {
                this._onDidChangeTerminalState.fire(terminal.value);
            }
        }
        $acceptProcessResize(id, cols, rows) {
            var _a;
            try {
                (_a = this._terminalProcesses.get(id)) === null || _a === void 0 ? void 0 : _a.resize(cols, rows);
            }
            catch (error) {
                // We tried to write to a closed pipe / channel.
                if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                    throw (error);
                }
            }
        }
        $acceptProcessShutdown(id, immediate) {
            var _a;
            (_a = this._terminalProcesses.get(id)) === null || _a === void 0 ? void 0 : _a.shutdown(immediate);
        }
        $acceptProcessRequestInitialCwd(id) {
            var _a;
            (_a = this._terminalProcesses.get(id)) === null || _a === void 0 ? void 0 : _a.getInitialCwd().then(initialCwd => this._proxy.$sendProcessProperty(id, { type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: initialCwd }));
        }
        $acceptProcessRequestCwd(id) {
            var _a;
            (_a = this._terminalProcesses.get(id)) === null || _a === void 0 ? void 0 : _a.getCwd().then(cwd => this._proxy.$sendProcessProperty(id, { type: "cwd" /* ProcessPropertyType.Cwd */, value: cwd }));
        }
        $acceptProcessRequestLatency(id) {
            return Promise.resolve(id);
        }
        registerLinkProvider(provider) {
            this._linkProviders.add(provider);
            if (this._linkProviders.size === 1) {
                this._proxy.$startLinkProvider();
            }
            return new extHostTypes_1.Disposable(() => {
                this._linkProviders.delete(provider);
                if (this._linkProviders.size === 0) {
                    this._proxy.$stopLinkProvider();
                }
            });
        }
        registerProfileProvider(extension, id, provider) {
            if (this._profileProviders.has(id)) {
                throw new Error(`Terminal profile provider "${id}" already registered`);
            }
            this._profileProviders.set(id, provider);
            this._proxy.$registerProfileProvider(id, extension.identifier.value);
            return new extHostTypes_1.Disposable(() => {
                this._profileProviders.delete(id);
                this._proxy.$unregisterProfileProvider(id);
            });
        }
        async $createContributedProfileTerminal(id, options) {
            var _a;
            const token = new cancellation_1.CancellationTokenSource().token;
            let profile = await ((_a = this._profileProviders.get(id)) === null || _a === void 0 ? void 0 : _a.provideTerminalProfile(token));
            if (token.isCancellationRequested) {
                return;
            }
            if (profile && !('options' in profile)) {
                profile = { options: profile };
            }
            if (!profile || !('options' in profile)) {
                throw new Error(`No terminal profile options provided for id "${id}"`);
            }
            if ('pty' in profile.options) {
                this.createExtensionTerminal(profile.options, options);
                return;
            }
            this.createTerminalFromOptions(profile.options, options);
        }
        async $provideLinks(terminalId, line) {
            const terminal = this._getTerminalById(terminalId);
            if (!terminal) {
                return [];
            }
            // Discard any cached links the terminal has been holding, currently all links are released
            // when new links are provided.
            this._terminalLinkCache.delete(terminalId);
            const oldToken = this._terminalLinkCancellationSource.get(terminalId);
            if (oldToken) {
                oldToken.dispose(true);
            }
            const cancellationSource = new cancellation_1.CancellationTokenSource();
            this._terminalLinkCancellationSource.set(terminalId, cancellationSource);
            const result = [];
            const context = { terminal: terminal.value, line };
            const promises = [];
            for (const provider of this._linkProviders) {
                promises.push(async_1.Promises.withAsyncBody(async (r) => {
                    cancellationSource.token.onCancellationRequested(() => r({ provider, links: [] }));
                    const links = (await provider.provideTerminalLinks(context, cancellationSource.token)) || [];
                    if (!cancellationSource.token.isCancellationRequested) {
                        r({ provider, links });
                    }
                }));
            }
            const provideResults = await Promise.all(promises);
            if (cancellationSource.token.isCancellationRequested) {
                return [];
            }
            const cacheLinkMap = new Map();
            for (const provideResult of provideResults) {
                if (provideResult && provideResult.links.length > 0) {
                    result.push(...provideResult.links.map(providerLink => {
                        const link = {
                            id: nextLinkId++,
                            startIndex: providerLink.startIndex,
                            length: providerLink.length,
                            label: providerLink.tooltip
                        };
                        cacheLinkMap.set(link.id, {
                            provider: provideResult.provider,
                            link: providerLink
                        });
                        return link;
                    }));
                }
            }
            this._terminalLinkCache.set(terminalId, cacheLinkMap);
            return result;
        }
        $activateLink(terminalId, linkId) {
            var _a;
            const cachedLink = (_a = this._terminalLinkCache.get(terminalId)) === null || _a === void 0 ? void 0 : _a.get(linkId);
            if (!cachedLink) {
                return;
            }
            cachedLink.provider.handleTerminalLink(cachedLink.link);
        }
        _onProcessExit(id, exitCode) {
            this._bufferer.stopBuffering(id);
            // Remove process reference
            this._terminalProcesses.delete(id);
            delete this._extensionTerminalAwaitingStart[id];
            // Clean up process disposables
            const processDiposable = this._terminalProcessDisposables[id];
            if (processDiposable) {
                processDiposable.dispose();
                delete this._terminalProcessDisposables[id];
            }
            // Send exit event to main side
            this._proxy.$sendProcessExit(id, exitCode);
        }
        _getTerminalById(id) {
            return this._getTerminalObjectById(this._terminals, id);
        }
        _getTerminalObjectById(array, id) {
            const index = this._getTerminalObjectIndexById(array, id);
            return index !== null ? array[index] : null;
        }
        _getTerminalObjectIndexById(array, id) {
            let index = null;
            array.some((item, i) => {
                const thisId = item._id;
                if (thisId === id) {
                    index = i;
                    return true;
                }
                return false;
            });
            return index;
        }
        getEnvironmentVariableCollection(extension) {
            let collection = this._environmentVariableCollections.get(extension.identifier.value);
            if (!collection) {
                collection = new EnvironmentVariableCollection();
                this._setEnvironmentVariableCollection(extension.identifier.value, collection);
            }
            return collection;
        }
        _syncEnvironmentVariableCollection(extensionIdentifier, collection) {
            const serialized = (0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(collection.map);
            this._proxy.$setEnvironmentVariableCollection(extensionIdentifier, collection.persistent, serialized.length === 0 ? undefined : serialized);
        }
        $initEnvironmentVariableCollections(collections) {
            collections.forEach(entry => {
                const extensionIdentifier = entry[0];
                const collection = new EnvironmentVariableCollection(entry[1]);
                this._setEnvironmentVariableCollection(extensionIdentifier, collection);
            });
        }
        $acceptDefaultProfile(profile, automationProfile) {
            this._defaultProfile = profile;
            this._defaultAutomationProfile = automationProfile;
        }
        _setEnvironmentVariableCollection(extensionIdentifier, collection) {
            this._environmentVariableCollections.set(extensionIdentifier, collection);
            collection.onDidChangeCollection(() => {
                // When any collection value changes send this immediately, this is done to ensure
                // following calls to createTerminal will be created with the new environment. It will
                // result in more noise by sending multiple updates when called but collections are
                // expected to be small.
                this._syncEnvironmentVariableCollection(extensionIdentifier, collection);
            });
        }
    };
    BaseExtHostTerminalService = __decorate([
        __param(1, extHostRpcService_1.IExtHostRpcService)
    ], BaseExtHostTerminalService);
    exports.BaseExtHostTerminalService = BaseExtHostTerminalService;
    class EnvironmentVariableCollection {
        constructor(serialized) {
            this.map = new Map();
            this._persistent = true;
            this._onDidChangeCollection = new event_1.Emitter();
            this.map = new Map(serialized);
        }
        get persistent() { return this._persistent; }
        set persistent(value) {
            this._persistent = value;
            this._onDidChangeCollection.fire();
        }
        get onDidChangeCollection() { return this._onDidChangeCollection && this._onDidChangeCollection.event; }
        get size() {
            return this.map.size;
        }
        replace(variable, value) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Replace });
        }
        append(variable, value) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Append });
        }
        prepend(variable, value) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Prepend });
        }
        _setIfDiffers(variable, mutator) {
            const current = this.map.get(variable);
            if (!current || current.value !== mutator.value || current.type !== mutator.type) {
                this.map.set(variable, mutator);
                this._onDidChangeCollection.fire();
            }
        }
        get(variable) {
            return this.map.get(variable);
        }
        forEach(callback, thisArg) {
            this.map.forEach((value, key) => callback.call(thisArg, key, value, this));
        }
        delete(variable) {
            this.map.delete(variable);
            this._onDidChangeCollection.fire();
        }
        clear() {
            this.map.clear();
            this._onDidChangeCollection.fire();
        }
    }
    exports.EnvironmentVariableCollection = EnvironmentVariableCollection;
    let WorkerExtHostTerminalService = class WorkerExtHostTerminalService extends BaseExtHostTerminalService {
        constructor(extHostRpc) {
            super(false, extHostRpc);
        }
        createTerminal(name, shellPath, shellArgs) {
            throw new errors_1.NotSupportedError();
        }
        createTerminalFromOptions(options, internalOptions) {
            throw new errors_1.NotSupportedError();
        }
    };
    WorkerExtHostTerminalService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], WorkerExtHostTerminalService);
    exports.WorkerExtHostTerminalService = WorkerExtHostTerminalService;
    function asTerminalIcon(iconPath) {
        if (!iconPath || typeof iconPath === 'string') {
            return undefined;
        }
        if (!('id' in iconPath)) {
            return iconPath;
        }
        return {
            id: iconPath.id,
            color: iconPath.color
        };
    }
    function asTerminalColor(color) {
        return themeService_1.ThemeColor.isThemeColor(color) ? color : undefined;
    }
});
//# sourceMappingURL=extHostTerminalService.js.map