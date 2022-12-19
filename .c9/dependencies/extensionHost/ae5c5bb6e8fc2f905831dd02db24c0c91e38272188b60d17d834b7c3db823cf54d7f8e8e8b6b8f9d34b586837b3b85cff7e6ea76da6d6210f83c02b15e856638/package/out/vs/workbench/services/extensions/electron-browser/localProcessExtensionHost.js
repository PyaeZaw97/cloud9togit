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
define(["require", "exports", "net", "vs/base/parts/ipc/node/ipc.net", "vs/nls", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/console", "vs/workbench/services/extensions/common/remoteConsoleUtil", "vs/base/parts/ipc/common/ipc.net", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/label/common/label", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/native/electron-sandbox/native", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/base/common/types", "../common/extensionDevOptions", "vs/base/common/buffer", "vs/platform/debug/common/extensionHostDebug", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/host/browser/host", "vs/base/common/resources", "vs/platform/registry/common/platform", "vs/workbench/services/output/common/output", "vs/workbench/services/environment/electron-sandbox/shellEnvironmentService", "vs/platform/extensions/common/extensionHostStarter", "vs/base/common/processes", "vs/base/common/stopwatch", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, net_1, ipc_net_1, nls, async_1, errorMessage_1, event_1, lifecycle_1, objects, platform, uri_1, console_1, remoteConsoleUtil_1, ipc_net_2, environmentService_1, label_1, lifecycle_2, log_1, productService_1, notification_1, telemetry_1, native_1, workspace_1, extensionHostProtocol_1, types_1, extensionDevOptions_1, buffer_1, extensionHostDebug_1, extensions_1, host_1, resources_1, platform_1, output_1, shellEnvironmentService_1, extensionHostStarter_1, processes_1, stopwatch_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalProcessExtensionHost = void 0;
    var NativeLogMarkers;
    (function (NativeLogMarkers) {
        NativeLogMarkers["Start"] = "START_NATIVE_LOG";
        NativeLogMarkers["End"] = "END_NATIVE_LOG";
    })(NativeLogMarkers || (NativeLogMarkers = {}));
    class ExtensionHostProcess {
        constructor(id, _extensionHostStarter) {
            this._extensionHostStarter = _extensionHostStarter;
            this._id = id;
        }
        get onStdout() {
            return this._extensionHostStarter.onDynamicStdout(this._id);
        }
        get onStderr() {
            return this._extensionHostStarter.onDynamicStderr(this._id);
        }
        get onMessage() {
            return this._extensionHostStarter.onDynamicMessage(this._id);
        }
        get onError() {
            return this._extensionHostStarter.onDynamicError(this._id);
        }
        get onExit() {
            return this._extensionHostStarter.onDynamicExit(this._id);
        }
        start(opts) {
            return this._extensionHostStarter.start(this._id, opts);
        }
        enableInspectPort() {
            return this._extensionHostStarter.enableInspectPort(this._id);
        }
        kill() {
            return this._extensionHostStarter.kill(this._id);
        }
    }
    let LocalProcessExtensionHost = class LocalProcessExtensionHost {
        constructor(runningLocation, _initDataProvider, _contextService, _notificationService, _nativeHostService, _lifecycleService, _environmentService, _telemetryService, _logService, _labelService, _extensionHostDebugService, _hostService, _productService, _shellEnvironmentService, _extensionHostStarter) {
            this.runningLocation = runningLocation;
            this._initDataProvider = _initDataProvider;
            this._contextService = _contextService;
            this._notificationService = _notificationService;
            this._nativeHostService = _nativeHostService;
            this._lifecycleService = _lifecycleService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._labelService = _labelService;
            this._extensionHostDebugService = _extensionHostDebugService;
            this._hostService = _hostService;
            this._productService = _productService;
            this._shellEnvironmentService = _shellEnvironmentService;
            this._extensionHostStarter = _extensionHostStarter;
            this.remoteAuthority = null;
            this.lazyStart = false;
            this.extensions = new extensions_1.ExtensionHostExtensions();
            this._onExit = new event_1.Emitter();
            this.onExit = this._onExit.event;
            this._onDidSetInspectPort = new event_1.Emitter();
            this._toDispose = new lifecycle_1.DisposableStore();
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevDebug = devOpts.isExtensionDevDebug;
            this._isExtensionDevDebugBrk = devOpts.isExtensionDevDebugBrk;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
            this._lastExtensionHostError = null;
            this._terminating = false;
            this._namedPipeServer = null;
            this._inspectPort = null;
            this._extensionHostProcess = null;
            this._extensionHostConnection = null;
            this._messageProtocol = null;
            this._extensionHostLogFile = (0, resources_1.joinPath)(this._environmentService.extHostLogsPath, `${extensions_1.ExtensionHostLogFileName}.log`);
            this._toDispose.add(this._onExit);
            this._toDispose.add(this._lifecycleService.onWillShutdown(e => this._onWillShutdown(e)));
            this._toDispose.add(this._lifecycleService.onDidShutdown(() => this.terminate()));
            this._toDispose.add(this._extensionHostDebugService.onClose(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._nativeHostService.closeWindow();
                }
            }));
            this._toDispose.add(this._extensionHostDebugService.onReload(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._hostService.reload();
                }
            }));
        }
        dispose() {
            this.terminate();
        }
        start() {
            if (this._terminating) {
                // .terminate() was called
                return null;
            }
            if (!this._messageProtocol) {
                this._messageProtocol = Promise.all([
                    this._extensionHostStarter.createExtensionHost(),
                    this._tryListenOnPipe(),
                    this._tryFindDebugPort(),
                    this._shellEnvironmentService.getShellEnv(),
                ]).then(([extensionHostCreationResult, pipeName, portNumber, processEnv]) => {
                    this._extensionHostProcess = new ExtensionHostProcess(extensionHostCreationResult.id, this._extensionHostStarter);
                    const env = objects.mixin(processEnv, {
                        VSCODE_AMD_ENTRYPOINT: 'vs/workbench/api/node/extensionHostProcess',
                        VSCODE_PIPE_LOGGING: 'true',
                        VSCODE_VERBOSE_LOGGING: true,
                        VSCODE_LOG_NATIVE: this._isExtensionDevHost,
                        VSCODE_IPC_HOOK_EXTHOST: pipeName,
                        VSCODE_HANDLES_UNCAUGHT_ERRORS: true,
                        VSCODE_LOG_STACK: !this._isExtensionDevTestFromCli && (this._isExtensionDevHost || !this._environmentService.isBuilt || this._productService.quality !== 'stable' || this._environmentService.verbose)
                    });
                    if (this._environmentService.debugExtensionHost.env) {
                        objects.mixin(env, this._environmentService.debugExtensionHost.env);
                    }
                    (0, processes_1.removeDangerousEnvVariables)(env);
                    if (this._isExtensionDevHost) {
                        // Unset `VSCODE_CODE_CACHE_PATH` when developing extensions because it might
                        // be that dependencies, that otherwise would be cached, get modified.
                        delete env['VSCODE_CODE_CACHE_PATH'];
                    }
                    const opts = {
                        env,
                        // We only detach the extension host on windows. Linux and Mac orphan by default
                        // and detach under Linux and Mac create another process group.
                        // We detach because we have noticed that when the renderer exits, its child processes
                        // (i.e. extension host) are taken down in a brutal fashion by the OS
                        detached: !!platform.isWindows,
                        execArgv: undefined,
                        silent: true
                    };
                    if (portNumber !== 0) {
                        opts.execArgv = [
                            '--nolazy',
                            (this._isExtensionDevDebugBrk ? '--inspect-brk=' : '--inspect=') + portNumber
                        ];
                    }
                    else {
                        opts.execArgv = ['--inspect-port=0'];
                    }
                    if (this._environmentService.extensionTestsLocationURI) {
                        opts.execArgv.unshift('--expose-gc');
                    }
                    if (this._environmentService.args['prof-v8-extensions']) {
                        opts.execArgv.unshift('--prof');
                    }
                    if (this._environmentService.args['max-memory']) {
                        opts.execArgv.unshift(`--max-old-space-size=${this._environmentService.args['max-memory']}`);
                    }
                    const onStdout = this._handleProcessOutputStream(this._extensionHostProcess.onStdout);
                    const onStderr = this._handleProcessOutputStream(this._extensionHostProcess.onStderr);
                    const onOutput = event_1.Event.any(event_1.Event.map(onStdout.event, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr.event, o => ({ data: `%c${o}`, format: ['color: red'] })));
                    // Debounce all output, so we can render it in the Chrome console as a group
                    const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                        return r
                            ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                            : { data: o.data, format: o.format };
                    }, 100);
                    // Print out extension host output
                    onDebouncedOutput(output => {
                        const inspectorUrlMatch = output.data && output.data.match(/ws:\/\/([^\s]+:(\d+)\/[^\s]+)/);
                        if (inspectorUrlMatch) {
                            if (!this._environmentService.isBuilt && !this._isExtensionDevTestFromCli) {
                                console.log(`%c[Extension Host] %cdebugger inspector at chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${inspectorUrlMatch[1]}`, 'color: blue', 'color:');
                            }
                            if (!this._inspectPort) {
                                this._inspectPort = Number(inspectorUrlMatch[2]);
                                this._onDidSetInspectPort.fire();
                            }
                        }
                        else {
                            if (!this._isExtensionDevTestFromCli) {
                                console.group('Extension Host');
                                console.log(output.data, ...output.format);
                                console.groupEnd();
                            }
                        }
                    });
                    // Support logging from extension host
                    this._extensionHostProcess.onMessage(msg => {
                        if (msg && msg.type === '__$console') {
                            this._logExtensionHostMessage(msg);
                        }
                    });
                    // Lifecycle
                    this._extensionHostProcess.onError((e) => this._onExtHostProcessError(e.error));
                    this._extensionHostProcess.onExit(({ code, signal }) => this._onExtHostProcessExit(code, signal));
                    // Notify debugger that we are ready to attach to the process if we run a development extension
                    if (portNumber) {
                        if (this._isExtensionDevHost && portNumber && this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                            this._extensionHostDebugService.attachSession(this._environmentService.debugExtensionHost.debugId, portNumber);
                        }
                        this._inspectPort = portNumber;
                        this._onDidSetInspectPort.fire();
                    }
                    // Help in case we fail to start it
                    let startupTimeoutHandle;
                    if (!this._environmentService.isBuilt && !this._environmentService.remoteAuthority || this._isExtensionDevHost) {
                        startupTimeoutHandle = setTimeout(() => {
                            this._logService.error(`[LocalProcessExtensionHost]: Extension host did not start in 10 seconds (debugBrk: ${this._isExtensionDevDebugBrk})`);
                            const msg = this._isExtensionDevDebugBrk
                                ? nls.localize('extensionHost.startupFailDebug', "Extension host did not start in 10 seconds, it might be stopped on the first line and needs a debugger to continue.")
                                : nls.localize('extensionHost.startupFail', "Extension host did not start in 10 seconds, that might be a problem.");
                            this._notificationService.prompt(notification_1.Severity.Warning, msg, [{
                                    label: nls.localize('reloadWindow', "Reload Window"),
                                    run: () => this._hostService.reload()
                                }], { sticky: true });
                        }, 10000);
                    }
                    // Initialize extension host process with hand shakes
                    return this._tryExtHostHandshake(opts).then((protocol) => {
                        clearTimeout(startupTimeoutHandle);
                        return protocol;
                    });
                });
            }
            return this._messageProtocol;
        }
        /**
         * Start a server (`this._namedPipeServer`) that listens on a named pipe and return the named pipe name.
         */
        _tryListenOnPipe() {
            return new Promise((resolve, reject) => {
                const pipeName = (0, ipc_net_1.createRandomIPCHandle)();
                this._namedPipeServer = (0, net_1.createServer)();
                this._namedPipeServer.on('error', reject);
                this._namedPipeServer.listen(pipeName, () => {
                    if (this._namedPipeServer) {
                        this._namedPipeServer.removeListener('error', reject);
                    }
                    resolve(pipeName);
                });
            });
        }
        /**
         * Find a free port if extension host debugging is enabled.
         */
        async _tryFindDebugPort() {
            if (typeof this._environmentService.debugExtensionHost.port !== 'number') {
                return 0;
            }
            const expected = this._environmentService.debugExtensionHost.port;
            const port = await this._nativeHostService.findFreePort(expected, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */, 2048 /* skip 2048 ports between attempts */);
            if (!this._isExtensionDevTestFromCli) {
                if (!port) {
                    console.warn('%c[Extension Host] %cCould not find a free port for debugging', 'color: blue', 'color:');
                }
                else {
                    if (port !== expected) {
                        console.warn(`%c[Extension Host] %cProvided debugging port ${expected} is not free, using ${port} instead.`, 'color: blue', 'color:');
                    }
                    if (this._isExtensionDevDebugBrk) {
                        console.warn(`%c[Extension Host] %cSTOPPED on first line for debugging on port ${port}`, 'color: blue', 'color:');
                    }
                    else {
                        console.info(`%c[Extension Host] %cdebugger listening on port ${port}`, 'color: blue', 'color:');
                    }
                }
            }
            return port || 0;
        }
        _tryExtHostHandshake(opts) {
            return new Promise((resolve, reject) => {
                // Wait for the extension host to connect to our named pipe
                // and wrap the socket in the message passing protocol
                let handle = setTimeout(() => {
                    if (this._namedPipeServer) {
                        this._namedPipeServer.close();
                        this._namedPipeServer = null;
                    }
                    reject('The local extension host took longer than 60s to connect.');
                }, 60 * 1000);
                this._namedPipeServer.on('connection', socket => {
                    clearTimeout(handle);
                    if (this._namedPipeServer) {
                        this._namedPipeServer.close();
                        this._namedPipeServer = null;
                    }
                    this._extensionHostConnection = socket;
                    // using a buffered message protocol here because between now
                    // and the first time a `then` executes some messages might be lost
                    // unless we immediately register a listener for `onMessage`.
                    resolve(new ipc_net_2.PersistentProtocol(new ipc_net_1.NodeSocket(this._extensionHostConnection, 'renderer-exthost')));
                });
                // Now that the named pipe listener is installed, start the ext host process
                const sw = stopwatch_1.StopWatch.create(false);
                this._extensionHostProcess.start(opts).then(() => {
                    const duration = sw.elapsed();
                    if (platform.isCI) {
                        this._logService.info(`IExtensionHostStarter.start() took ${duration} ms.`);
                    }
                }, (err) => {
                    // Starting the ext host process resulted in an error
                    reject(err);
                });
            }).then((protocol) => {
                // 1) wait for the incoming `ready` event and send the initialization data.
                // 2) wait for the incoming `initialized` event.
                return new Promise((resolve, reject) => {
                    let timeoutHandle;
                    const installTimeoutCheck = () => {
                        timeoutHandle = setTimeout(() => {
                            reject('The local extenion host took longer than 60s to send its ready message.');
                        }, 60 * 1000);
                    };
                    const uninstallTimeoutCheck = () => {
                        clearTimeout(timeoutHandle);
                    };
                    // Wait 60s for the ready message
                    installTimeoutCheck();
                    const disposable = protocol.onMessage(msg => {
                        if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 1 /* MessageType.Ready */)) {
                            // 1) Extension Host is ready to receive messages, initialize it
                            uninstallTimeoutCheck();
                            this._createExtHostInitData().then(data => {
                                // Wait 60s for the initialized message
                                installTimeoutCheck();
                                protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(data)));
                            });
                            return;
                        }
                        if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 0 /* MessageType.Initialized */)) {
                            // 2) Extension Host is initialized
                            uninstallTimeoutCheck();
                            // stop listening for messages here
                            disposable.dispose();
                            // Register log channel for exthost log
                            platform_1.Registry.as(output_1.Extensions.OutputChannels).registerChannel({ id: 'extHostLog', label: nls.localize('extension host Log', "Extension Host"), file: this._extensionHostLogFile, log: true });
                            // release this promise
                            resolve(protocol);
                            return;
                        }
                        console.error(`received unexpected message during handshake phase from the extension host: `, msg);
                    });
                });
            });
        }
        async _createExtHostInitData() {
            const [telemetryInfo, initData] = await Promise.all([this._telemetryService.getTelemetryInfo(), this._initDataProvider.getInitData()]);
            const workspace = this._contextService.getWorkspace();
            const deltaExtensions = this.extensions.set(initData.allExtensions, initData.myExtensions);
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                parentPid: globals_1.process.pid,
                environment: {
                    isExtensionDevelopmentDebug: this._isExtensionDevDebug,
                    appRoot: this._environmentService.appRoot ? uri_1.URI.file(this._environmentService.appRoot) : undefined,
                    appName: this._productService.nameLong,
                    appHost: this._productService.embedderIdentifier || 'desktop',
                    appUriScheme: this._productService.urlProtocol,
                    appLanguage: platform.language,
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: this._environmentService.globalStorageHome,
                    workspaceStorageHome: this._environmentService.workspaceStorageHome,
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? undefined : {
                    configuration: (0, types_1.withNullAsUndefined)(workspace.configuration),
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace),
                    isUntitled: workspace.configuration ? (0, workspace_1.isUntitledWorkspace)(workspace.configuration, this._environmentService) : false,
                    transient: workspace.transient
                },
                remote: {
                    authority: this._environmentService.remoteAuthority,
                    connectionData: null,
                    isRemote: false
                },
                allExtensions: deltaExtensions.toAdd,
                myExtensions: deltaExtensions.myToAdd,
                telemetryInfo,
                logLevel: this._logService.getLevel(),
                logsLocation: this._environmentService.extHostLogsPath,
                logFile: this._extensionHostLogFile,
                autoStart: initData.autoStart,
                uiKind: extensionHostProtocol_1.UIKind.Desktop
            };
        }
        _logExtensionHostMessage(entry) {
            if (this._isExtensionDevTestFromCli) {
                // If running tests from cli, log to the log service everything
                (0, remoteConsoleUtil_1.logRemoteEntry)(this._logService, entry);
            }
            else {
                // Log to the log service only errors and log everything to local console
                (0, remoteConsoleUtil_1.logRemoteEntryIfError)(this._logService, entry, 'Extension Host');
                (0, console_1.log)(entry, 'Extension Host');
            }
        }
        _onExtHostProcessError(_err) {
            let err = _err;
            if (_err && _err.$isError) {
                err = new Error();
                err.name = _err.name;
                err.message = _err.message;
                err.stack = _err.stack;
            }
            let errorMessage = (0, errorMessage_1.toErrorMessage)(err);
            if (errorMessage === this._lastExtensionHostError) {
                return; // prevent error spam
            }
            this._lastExtensionHostError = errorMessage;
            this._notificationService.error(nls.localize('extensionHost.error', "Error from the extension host: {0}", errorMessage));
        }
        _onExtHostProcessExit(code, signal) {
            if (this._terminating) {
                // Expected termination path (we asked the process to terminate)
                return;
            }
            this._onExit.fire([code, signal]);
        }
        _handleProcessOutputStream(stream) {
            let last = '';
            let isOmitting = false;
            const event = new event_1.Emitter();
            stream((chunk) => {
                // not a fancy approach, but this is the same approach used by the split2
                // module which is well-optimized (https://github.com/mcollina/split2)
                last += chunk;
                let lines = last.split(/\r?\n/g);
                last = lines.pop();
                // protected against an extension spamming and leaking memory if no new line is written.
                if (last.length > 10000) {
                    lines.push(last);
                    last = '';
                }
                for (const line of lines) {
                    if (isOmitting) {
                        if (line === "END_NATIVE_LOG" /* NativeLogMarkers.End */) {
                            isOmitting = false;
                        }
                    }
                    else if (line === "START_NATIVE_LOG" /* NativeLogMarkers.Start */) {
                        isOmitting = true;
                    }
                    else if (line.length) {
                        event.fire(line + '\n');
                    }
                }
            });
            return event;
        }
        async enableInspectPort() {
            if (typeof this._inspectPort === 'number') {
                return true;
            }
            if (!this._extensionHostProcess) {
                return false;
            }
            const result = await this._extensionHostProcess.enableInspectPort();
            if (!result) {
                return false;
            }
            await Promise.race([event_1.Event.toPromise(this._onDidSetInspectPort.event), (0, async_1.timeout)(1000)]);
            return typeof this._inspectPort === 'number';
        }
        getInspectPort() {
            return (0, types_1.withNullAsUndefined)(this._inspectPort);
        }
        terminate() {
            if (this._terminating) {
                return;
            }
            this._terminating = true;
            this._toDispose.dispose();
            if (!this._messageProtocol) {
                // .start() was not called
                return;
            }
            this._messageProtocol.then((protocol) => {
                // Send the extension host a request to terminate itself
                // (graceful termination)
                protocol.send((0, extensionHostProtocol_1.createMessageOfType)(2 /* MessageType.Terminate */));
                protocol.getSocket().dispose();
                protocol.dispose();
                // Give the extension host 10s, after which we will
                // try to kill the process and release any resources
                setTimeout(() => this._cleanResources(), 10 * 1000);
            }, (err) => {
                // Establishing a protocol with the extension host failed, so
                // try to kill the process and release any resources.
                this._cleanResources();
            });
        }
        _cleanResources() {
            if (this._namedPipeServer) {
                this._namedPipeServer.close();
                this._namedPipeServer = null;
            }
            if (this._extensionHostConnection) {
                this._extensionHostConnection.end();
                this._extensionHostConnection = null;
            }
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = null;
            }
        }
        _onWillShutdown(event) {
            // If the extension development host was started without debugger attached we need
            // to communicate this back to the main side to terminate the debug session
            if (this._isExtensionDevHost && !this._isExtensionDevTestFromCli && !this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                this._extensionHostDebugService.terminateSession(this._environmentService.debugExtensionHost.debugId);
                event.join((0, async_1.timeout)(100 /* wait a bit for IPC to get delivered */), { id: 'join.extensionDevelopment', label: nls.localize('join.extensionDevelopment', "Terminating extension debug session") });
            }
        }
    };
    LocalProcessExtensionHost = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, notification_1.INotificationService),
        __param(4, native_1.INativeHostService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, log_1.ILogService),
        __param(9, label_1.ILabelService),
        __param(10, extensionHostDebug_1.IExtensionHostDebugService),
        __param(11, host_1.IHostService),
        __param(12, productService_1.IProductService),
        __param(13, shellEnvironmentService_1.IShellEnvironmentService),
        __param(14, extensionHostStarter_1.IExtensionHostStarter)
    ], LocalProcessExtensionHost);
    exports.LocalProcessExtensionHost = LocalProcessExtensionHost;
});
//# sourceMappingURL=localProcessExtensionHost.js.map