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
define(["require", "exports", "child_process", "vs/server/node/remoteLanguagePacks", "vs/base/common/network", "vs/base/common/path", "vs/base/common/buffer", "vs/base/common/event", "vs/base/parts/ipc/node/ipc.net", "vs/platform/shell/node/shellEnv", "vs/platform/log/common/log", "vs/server/node/serverEnvironmentService", "vs/base/common/platform", "vs/workbench/services/extensions/common/remoteConsoleUtil", "vs/base/common/processes", "vs/server/node/extensionHostStatusService"], function (require, exports, cp, remoteLanguagePacks_1, network_1, path_1, buffer_1, event_1, ipc_net_1, shellEnv_1, log_1, serverEnvironmentService_1, platform_1, remoteConsoleUtil_1, processes_1, extensionHostStatusService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostConnection = exports.buildUserEnvironment = void 0;
    async function buildUserEnvironment(startParamsEnv = {}, withUserShellEnvironment, language, isDebug, environmentService, logService) {
        const nlsConfig = await (0, remoteLanguagePacks_1.getNLSConfiguration)(language, environmentService.userDataPath);
        let userShellEnv = {};
        if (withUserShellEnvironment) {
            try {
                userShellEnv = await (0, shellEnv_1.getResolvedShellEnv)(logService, environmentService.args, process.env);
            }
            catch (error) {
                logService.error('ExtensionHostConnection#buildUserEnvironment resolving shell environment failed', error);
            }
        }
        const processEnv = process.env;
        const env = Object.assign(Object.assign(Object.assign(Object.assign({}, processEnv), userShellEnv), {
            VSCODE_LOG_NATIVE: String(isDebug),
            VSCODE_AMD_ENTRYPOINT: 'vs/workbench/api/node/extensionHostProcess',
            VSCODE_PIPE_LOGGING: 'true',
            VSCODE_VERBOSE_LOGGING: 'true',
            VSCODE_EXTHOST_WILL_SEND_SOCKET: 'true',
            VSCODE_HANDLES_UNCAUGHT_ERRORS: 'true',
            VSCODE_LOG_STACK: 'false',
            VSCODE_NLS_CONFIG: JSON.stringify(nlsConfig, undefined, 0)
        }), startParamsEnv);
        const binFolder = environmentService.isBuilt ? (0, path_1.join)(environmentService.appRoot, 'bin') : (0, path_1.join)(environmentService.appRoot, 'resources', 'server', 'bin-dev');
        const remoteCliBinFolder = (0, path_1.join)(binFolder, 'remote-cli'); // contains the `code` command that can talk to the remote server
        let PATH = readCaseInsensitive(env, 'PATH');
        if (PATH) {
            PATH = remoteCliBinFolder + path_1.delimiter + PATH;
        }
        else {
            PATH = remoteCliBinFolder;
        }
        setCaseInsensitive(env, 'PATH', PATH);
        if (!environmentService.args['without-browser-env-var']) {
            env.BROWSER = (0, path_1.join)(binFolder, 'helpers', platform_1.isWindows ? 'browser.cmd' : 'browser.sh'); // a command that opens a browser on the local machine
        }
        removeNulls(env);
        return env;
    }
    exports.buildUserEnvironment = buildUserEnvironment;
    class ConnectionData {
        constructor(socket, socketDrain, initialDataChunk, skipWebSocketFrames, permessageDeflate, inflateBytes) {
            this.socket = socket;
            this.socketDrain = socketDrain;
            this.initialDataChunk = initialDataChunk;
            this.skipWebSocketFrames = skipWebSocketFrames;
            this.permessageDeflate = permessageDeflate;
            this.inflateBytes = inflateBytes;
        }
        toIExtHostSocketMessage() {
            return {
                type: 'VSCODE_EXTHOST_IPC_SOCKET',
                initialDataChunk: this.initialDataChunk.buffer.toString('base64'),
                skipWebSocketFrames: this.skipWebSocketFrames,
                permessageDeflate: this.permessageDeflate,
                inflateBytes: this.inflateBytes.buffer.toString('base64'),
            };
        }
    }
    let ExtensionHostConnection = class ExtensionHostConnection {
        constructor(_reconnectionToken, remoteAddress, socket, initialDataChunk, _environmentService, _logService, _extensionHostStatusService) {
            this._reconnectionToken = _reconnectionToken;
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._extensionHostStatusService = _extensionHostStatusService;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._disposed = false;
            this._remoteAddress = remoteAddress;
            this._extensionHostProcess = null;
            this._connectionData = ExtensionHostConnection._toConnectionData(socket, initialDataChunk);
            this._log(`New connection established.`);
        }
        get _logPrefix() {
            return `[${this._remoteAddress}][${this._reconnectionToken.substr(0, 8)}][ExtensionHostConnection] `;
        }
        _log(_str) {
            this._logService.info(`${this._logPrefix}${_str}`);
        }
        _logError(_str) {
            this._logService.error(`${this._logPrefix}${_str}`);
        }
        static _toConnectionData(socket, initialDataChunk) {
            if (socket instanceof ipc_net_1.NodeSocket) {
                return new ConnectionData(socket.socket, socket.drain(), initialDataChunk, true, false, buffer_1.VSBuffer.alloc(0));
            }
            else {
                return new ConnectionData(socket.socket.socket, socket.drain(), initialDataChunk, false, socket.permessageDeflate, socket.recordedInflateBytes);
            }
        }
        async _sendSocketToExtensionHost(extensionHostProcess, connectionData) {
            // Make sure all outstanding writes have been drained before sending the socket
            await connectionData.socketDrain;
            const msg = connectionData.toIExtHostSocketMessage();
            extensionHostProcess.send(msg, connectionData.socket);
        }
        shortenReconnectionGraceTimeIfNecessary() {
            if (!this._extensionHostProcess) {
                return;
            }
            const msg = {
                type: 'VSCODE_EXTHOST_IPC_REDUCE_GRACE_TIME'
            };
            this._extensionHostProcess.send(msg);
        }
        acceptReconnection(remoteAddress, _socket, initialDataChunk) {
            this._remoteAddress = remoteAddress;
            this._log(`The client has reconnected.`);
            const connectionData = ExtensionHostConnection._toConnectionData(_socket, initialDataChunk);
            if (!this._extensionHostProcess) {
                // The extension host didn't even start up yet
                this._connectionData = connectionData;
                return;
            }
            this._sendSocketToExtensionHost(this._extensionHostProcess, connectionData);
        }
        _cleanResources() {
            if (this._disposed) {
                // already called
                return;
            }
            this._disposed = true;
            if (this._connectionData) {
                this._connectionData.socket.end();
                this._connectionData = null;
            }
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = null;
            }
            this._onClose.fire(undefined);
        }
        async start(startParams) {
            try {
                let execArgv = [];
                if (startParams.port && !process.pkg) {
                    execArgv = [`--inspect${startParams.break ? '-brk' : ''}=${startParams.port}`];
                }
                const env = await buildUserEnvironment(startParams.env, true, startParams.language, !!startParams.debugId, this._environmentService, this._logService);
                (0, processes_1.removeDangerousEnvVariables)(env);
                const opts = {
                    env,
                    execArgv,
                    silent: true
                };
                // Run Extension Host as fork of current process
                const args = ['--type=extensionHost', `--transformURIs`];
                const useHostProxy = this._environmentService.args['use-host-proxy'];
                args.push(`--useHostProxy=${useHostProxy ? 'true' : 'false'}`);
                this._extensionHostProcess = cp.fork(network_1.FileAccess.asFileUri('bootstrap-fork', require).fsPath, args, opts);
                const pid = this._extensionHostProcess.pid;
                this._log(`<${pid}> Launched Extension Host Process.`);
                // Catch all output coming from the extension host process
                this._extensionHostProcess.stdout.setEncoding('utf8');
                this._extensionHostProcess.stderr.setEncoding('utf8');
                const onStdout = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stdout, 'data');
                const onStderr = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stderr, 'data');
                onStdout((e) => this._log(`<${pid}> ${e}`));
                onStderr((e) => this._log(`<${pid}><stderr> ${e}`));
                // Support logging from extension host
                this._extensionHostProcess.on('message', msg => {
                    if (msg && msg.type === '__$console') {
                        (0, remoteConsoleUtil_1.logRemoteEntry)(this._logService, msg, `${this._logPrefix}<${pid}>`);
                    }
                });
                // Lifecycle
                this._extensionHostProcess.on('error', (err) => {
                    this._logError(`<${pid}> Extension Host Process had an error`);
                    this._logService.error(err);
                    this._cleanResources();
                });
                this._extensionHostProcess.on('exit', (code, signal) => {
                    this._extensionHostStatusService.setExitInfo(this._reconnectionToken, { code, signal });
                    this._log(`<${pid}> Extension Host Process exited with code: ${code}, signal: ${signal}.`);
                    this._cleanResources();
                });
                const messageListener = (msg) => {
                    if (msg.type === 'VSCODE_EXTHOST_IPC_READY') {
                        this._extensionHostProcess.removeListener('message', messageListener);
                        this._sendSocketToExtensionHost(this._extensionHostProcess, this._connectionData);
                        this._connectionData = null;
                    }
                };
                this._extensionHostProcess.on('message', messageListener);
            }
            catch (error) {
                console.error('ExtensionHostConnection errored');
                if (error) {
                    console.error(error);
                }
            }
        }
    };
    ExtensionHostConnection = __decorate([
        __param(4, serverEnvironmentService_1.IServerEnvironmentService),
        __param(5, log_1.ILogService),
        __param(6, extensionHostStatusService_1.IExtensionHostStatusService)
    ], ExtensionHostConnection);
    exports.ExtensionHostConnection = ExtensionHostConnection;
    function readCaseInsensitive(env, key) {
        const pathKeys = Object.keys(env).filter(k => k.toLowerCase() === key.toLowerCase());
        const pathKey = pathKeys.length > 0 ? pathKeys[0] : key;
        return env[pathKey];
    }
    function setCaseInsensitive(env, key, value) {
        const pathKeys = Object.keys(env).filter(k => k.toLowerCase() === key.toLowerCase());
        const pathKey = pathKeys.length > 0 ? pathKeys[0] : key;
        env[pathKey] = value;
    }
    function removeNulls(env) {
        // Don't delete while iterating the object itself
        for (let key of Object.keys(env)) {
            if (env[key] === null) {
                delete env[key];
            }
        }
    }
});
//# sourceMappingURL=extensionHostConnection.js.map