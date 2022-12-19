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
define(["require", "exports", "crypto", "fs", "net", "perf_hooks", "url", "vs/base/common/amd", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/ports", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/server/node/extensionHostConnection", "vs/server/node/remoteExtensionManagement", "vs/server/node/serverConnectionToken", "vs/server/node/serverEnvironmentService", "vs/server/node/serverServices", "vs/server/node/webClientServer"], function (require, exports, crypto, fs, net, perf_hooks_1, url, amd_1, buffer_1, errors_1, extpath_1, lifecycle_1, network_1, path_1, perf, platform, strings_1, uri_1, uuid_1, ports_1, ipc_net_1, ipc_net_2, instantiation_1, log_1, productService_1, telemetry_1, extensionHostConnection_1, remoteExtensionManagement_1, serverConnectionToken_1, serverEnvironmentService_1, serverServices_1, webClientServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createServer = exports.RemoteExtensionHostAgentServer = void 0;
    const SHUTDOWN_TIMEOUT = 5 * 60 * 1000;
    let RemoteExtensionHostAgentServer = class RemoteExtensionHostAgentServer extends lifecycle_1.Disposable {
        constructor(_socketServer, _connectionToken, _vsdaMod, hasWebClient, _environmentService, _productService, _logService, _instantiationService) {
            super();
            this._socketServer = _socketServer;
            this._connectionToken = _connectionToken;
            this._vsdaMod = _vsdaMod;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._logService = _logService;
            this._instantiationService = _instantiationService;
            this._webEndpointOriginChecker = WebEndpointOriginChecker.create(this._productService);
            this._extHostConnections = Object.create(null);
            this._managementConnections = Object.create(null);
            this._allReconnectionTokens = new Set();
            this._webClientServer = (hasWebClient
                ? this._instantiationService.createInstance(webClientServer_1.WebClientServer, this._connectionToken)
                : null);
            this._logService.info(`Extension host agent started.`);
        }
        async handleRequest(req, res) {
            // Only serve GET requests
            if (req.method !== 'GET') {
                return (0, webClientServer_1.serveError)(req, res, 405, `Unsupported method ${req.method}`);
            }
            if (!req.url) {
                return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
            }
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            if (!pathname) {
                return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
            }
            // Version
            if (pathname === '/version') {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return res.end(this._productService.commit || '');
            }
            // Delay shutdown
            if (pathname === '/delay-shutdown') {
                this._delayShutdown();
                res.writeHead(200);
                return res.end('OK');
            }
            if (!(0, serverConnectionToken_1.requestHasValidConnectionToken)(this._connectionToken, req, parsedUrl)) {
                // invalid connection token
                return (0, webClientServer_1.serveError)(req, res, 403, `Forbidden.`);
            }
            if (pathname === '/vscode-remote-resource') {
                // Handle HTTP requests for resources rendered in the rich client (images, fonts, etc.)
                // These resources could be files shipped with extensions or even workspace files.
                const desiredPath = parsedUrl.query['path'];
                if (typeof desiredPath !== 'string') {
                    return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
                }
                let filePath;
                try {
                    filePath = uri_1.URI.from({ scheme: network_1.Schemas.file, path: desiredPath }).fsPath;
                }
                catch (err) {
                    return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
                }
                const responseHeaders = Object.create(null);
                if (this._environmentService.isBuilt) {
                    if ((0, extpath_1.isEqualOrParent)(filePath, this._environmentService.builtinExtensionsPath, !platform.isLinux)
                        || (0, extpath_1.isEqualOrParent)(filePath, this._environmentService.extensionsPath, !platform.isLinux)) {
                        responseHeaders['Cache-Control'] = 'public, max-age=31536000';
                    }
                }
                // Allow cross origin requests from the web worker extension host
                responseHeaders['Vary'] = 'Origin';
                const requestOrigin = req.headers['origin'];
                if (requestOrigin && this._webEndpointOriginChecker.matches(requestOrigin)) {
                    responseHeaders['Access-Control-Allow-Origin'] = requestOrigin;
                }
                return (0, webClientServer_1.serveFile)(this._logService, req, res, filePath, responseHeaders);
            }
            // workbench web UI
            if (this._webClientServer) {
                this._webClientServer.handle(req, res, parsedUrl);
                return;
            }
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not found');
        }
        handleUpgrade(req, socket) {
            let reconnectionToken = (0, uuid_1.generateUuid)();
            let isReconnection = false;
            let skipWebSocketFrames = false;
            if (req.url) {
                const query = url.parse(req.url, true).query;
                if (typeof query.reconnectionToken === 'string') {
                    reconnectionToken = query.reconnectionToken;
                }
                if (query.reconnection === 'true') {
                    isReconnection = true;
                }
                if (query.skipWebSocketFrames === 'true') {
                    skipWebSocketFrames = true;
                }
            }
            if (req.headers['upgrade'] !== 'websocket') {
                socket.end('HTTP/1.1 400 Bad Request');
                return;
            }
            // https://tools.ietf.org/html/rfc6455#section-4
            const requestNonce = req.headers['sec-websocket-key'];
            const hash = crypto.createHash('sha1');
            hash.update(requestNonce + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
            const responseNonce = hash.digest('base64');
            const responseHeaders = [
                `HTTP/1.1 101 Switching Protocols`,
                `Upgrade: websocket`,
                `Connection: Upgrade`,
                `Sec-WebSocket-Accept: ${responseNonce}`
            ];
            // See https://tools.ietf.org/html/rfc7692#page-12
            let permessageDeflate = false;
            if (!skipWebSocketFrames && !this._environmentService.args['disable-websocket-compression'] && req.headers['sec-websocket-extensions']) {
                const websocketExtensionOptions = Array.isArray(req.headers['sec-websocket-extensions']) ? req.headers['sec-websocket-extensions'] : [req.headers['sec-websocket-extensions']];
                for (const websocketExtensionOption of websocketExtensionOptions) {
                    if (/\b((server_max_window_bits)|(server_no_context_takeover)|(client_no_context_takeover))\b/.test(websocketExtensionOption)) {
                        // sorry, the server does not support zlib parameter tweaks
                        continue;
                    }
                    if (/\b(permessage-deflate)\b/.test(websocketExtensionOption)) {
                        permessageDeflate = true;
                        responseHeaders.push(`Sec-WebSocket-Extensions: permessage-deflate`);
                        break;
                    }
                    if (/\b(x-webkit-deflate-frame)\b/.test(websocketExtensionOption)) {
                        permessageDeflate = true;
                        responseHeaders.push(`Sec-WebSocket-Extensions: x-webkit-deflate-frame`);
                        break;
                    }
                }
            }
            socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
            // Never timeout this socket due to inactivity!
            socket.setTimeout(0);
            // Disable Nagle's algorithm
            socket.setNoDelay(true);
            // Finally!
            if (skipWebSocketFrames) {
                this._handleWebSocketConnection(new ipc_net_2.NodeSocket(socket, `server-connection-${reconnectionToken}`), isReconnection, reconnectionToken);
            }
            else {
                this._handleWebSocketConnection(new ipc_net_2.WebSocketNodeSocket(new ipc_net_2.NodeSocket(socket, `server-connection-${reconnectionToken}`), permessageDeflate, null, true), isReconnection, reconnectionToken);
            }
        }
        handleServerError(err) {
            this._logService.error(`Error occurred in server`);
            this._logService.error(err);
        }
        // Eventually cleanup
        _getRemoteAddress(socket) {
            let _socket;
            if (socket instanceof ipc_net_2.NodeSocket) {
                _socket = socket.socket;
            }
            else {
                _socket = socket.socket.socket;
            }
            return _socket.remoteAddress || `<unknown>`;
        }
        async _rejectWebSocketConnection(logPrefix, protocol, reason) {
            const socket = protocol.getSocket();
            this._logService.error(`${logPrefix} ${reason}.`);
            const errMessage = {
                type: 'error',
                reason: reason
            };
            protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(errMessage)));
            protocol.dispose();
            await socket.drain();
            socket.dispose();
        }
        /**
         * NOTE: Avoid using await in this method!
         * The problem is that await introduces a process.nextTick due to the implicit Promise.then
         * This can lead to some bytes being interpreted and a control message being emitted before the next listener has a chance to be registered.
         */
        _handleWebSocketConnection(socket, isReconnection, reconnectionToken) {
            const remoteAddress = this._getRemoteAddress(socket);
            const logPrefix = `[${remoteAddress}][${reconnectionToken.substr(0, 8)}]`;
            const protocol = new ipc_net_1.PersistentProtocol(socket);
            const validator = this._vsdaMod ? new this._vsdaMod.validator() : null;
            const signer = this._vsdaMod ? new this._vsdaMod.signer() : null;
            let State;
            (function (State) {
                State[State["WaitingForAuth"] = 0] = "WaitingForAuth";
                State[State["WaitingForConnectionType"] = 1] = "WaitingForConnectionType";
                State[State["Done"] = 2] = "Done";
                State[State["Error"] = 3] = "Error";
            })(State || (State = {}));
            let state = 0 /* State.WaitingForAuth */;
            const rejectWebSocketConnection = (msg) => {
                state = 3 /* State.Error */;
                listener.dispose();
                this._rejectWebSocketConnection(logPrefix, protocol, msg);
            };
            const listener = protocol.onControlMessage((raw) => {
                if (state === 0 /* State.WaitingForAuth */) {
                    let msg1;
                    try {
                        msg1 = JSON.parse(raw.toString());
                    }
                    catch (err) {
                        return rejectWebSocketConnection(`Malformed first message`);
                    }
                    if (msg1.type !== 'auth') {
                        return rejectWebSocketConnection(`Invalid first message`);
                    }
                    if (this._connectionToken.type === 2 /* ServerConnectionTokenType.Mandatory */ && !this._connectionToken.validate(msg1.auth)) {
                        return rejectWebSocketConnection(`Unauthorized client refused: auth mismatch`);
                    }
                    // Send `sign` request
                    let signedData = (0, uuid_1.generateUuid)();
                    if (signer) {
                        try {
                            signedData = signer.sign(msg1.data);
                        }
                        catch (e) {
                        }
                    }
                    let someText = (0, uuid_1.generateUuid)();
                    if (validator) {
                        try {
                            someText = validator.createNewMessage(someText);
                        }
                        catch (e) {
                        }
                    }
                    const signRequest = {
                        type: 'sign',
                        data: someText,
                        signedData: signedData
                    };
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(signRequest)));
                    state = 1 /* State.WaitingForConnectionType */;
                }
                else if (state === 1 /* State.WaitingForConnectionType */) {
                    let msg2;
                    try {
                        msg2 = JSON.parse(raw.toString());
                    }
                    catch (err) {
                        return rejectWebSocketConnection(`Malformed second message`);
                    }
                    if (msg2.type !== 'connectionType') {
                        return rejectWebSocketConnection(`Invalid second message`);
                    }
                    if (typeof msg2.signedData !== 'string') {
                        return rejectWebSocketConnection(`Invalid second message field type`);
                    }
                    const rendererCommit = msg2.commit;
                    const myCommit = this._productService.commit;
                    if (rendererCommit && myCommit) {
                        // Running in the built version where commits are defined
                        if (rendererCommit !== myCommit) {
                            return rejectWebSocketConnection(`Client refused: version mismatch`);
                        }
                    }
                    let valid = false;
                    if (!validator) {
                        valid = true;
                    }
                    else if (this._connectionToken.validate(msg2.signedData)) {
                        // web client
                        valid = true;
                    }
                    else {
                        try {
                            valid = validator.validate(msg2.signedData) === 'ok';
                        }
                        catch (e) {
                        }
                    }
                    if (!valid) {
                        if (this._environmentService.isBuilt) {
                            return rejectWebSocketConnection(`Unauthorized client refused`);
                        }
                        else {
                            this._logService.error(`${logPrefix} Unauthorized client handshake failed but we proceed because of dev mode.`);
                        }
                    }
                    // We have received a new connection.
                    // This indicates that the server owner has connectivity.
                    // Therefore we will shorten the reconnection grace period for disconnected connections!
                    for (let key in this._managementConnections) {
                        const managementConnection = this._managementConnections[key];
                        managementConnection.shortenReconnectionGraceTimeIfNecessary();
                    }
                    for (let key in this._extHostConnections) {
                        const extHostConnection = this._extHostConnections[key];
                        extHostConnection.shortenReconnectionGraceTimeIfNecessary();
                    }
                    state = 2 /* State.Done */;
                    listener.dispose();
                    this._handleConnectionType(remoteAddress, logPrefix, protocol, socket, isReconnection, reconnectionToken, msg2);
                }
            });
        }
        async _handleConnectionType(remoteAddress, _logPrefix, protocol, socket, isReconnection, reconnectionToken, msg) {
            const logPrefix = (msg.desiredConnectionType === 1 /* ConnectionType.Management */
                ? `${_logPrefix}[ManagementConnection]`
                : msg.desiredConnectionType === 2 /* ConnectionType.ExtensionHost */
                    ? `${_logPrefix}[ExtensionHostConnection]`
                    : _logPrefix);
            if (msg.desiredConnectionType === 1 /* ConnectionType.Management */) {
                // This should become a management connection
                if (isReconnection) {
                    // This is a reconnection
                    if (!this._managementConnections[reconnectionToken]) {
                        if (!this._allReconnectionTokens.has(reconnectionToken)) {
                            // This is an unknown reconnection token
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (never seen)`);
                        }
                        else {
                            // This is a connection that was seen in the past, but is no longer valid
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (seen before)`);
                        }
                    }
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify({ type: 'ok' })));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    this._managementConnections[reconnectionToken].acceptReconnection(remoteAddress, socket, dataChunk);
                }
                else {
                    // This is a fresh connection
                    if (this._managementConnections[reconnectionToken]) {
                        // Cannot have two concurrent connections using the same reconnection token
                        return this._rejectWebSocketConnection(logPrefix, protocol, `Duplicate reconnection token`);
                    }
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify({ type: 'ok' })));
                    const con = new remoteExtensionManagement_1.ManagementConnection(this._logService, reconnectionToken, remoteAddress, protocol);
                    this._socketServer.acceptConnection(con.protocol, con.onClose);
                    this._managementConnections[reconnectionToken] = con;
                    this._allReconnectionTokens.add(reconnectionToken);
                    con.onClose(() => {
                        delete this._managementConnections[reconnectionToken];
                    });
                }
            }
            else if (msg.desiredConnectionType === 2 /* ConnectionType.ExtensionHost */) {
                // This should become an extension host connection
                const startParams0 = msg.args || { language: 'en' };
                const startParams = await this._updateWithFreeDebugPort(startParams0);
                if (startParams.port) {
                    this._logService.trace(`${logPrefix} - startParams debug port ${startParams.port}`);
                }
                this._logService.trace(`${logPrefix} - startParams language: ${startParams.language}`);
                this._logService.trace(`${logPrefix} - startParams env: ${JSON.stringify(startParams.env)}`);
                if (isReconnection) {
                    // This is a reconnection
                    if (!this._extHostConnections[reconnectionToken]) {
                        if (!this._allReconnectionTokens.has(reconnectionToken)) {
                            // This is an unknown reconnection token
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (never seen)`);
                        }
                        else {
                            // This is a connection that was seen in the past, but is no longer valid
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (seen before)`);
                        }
                    }
                    protocol.sendPause();
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(startParams.port ? { debugPort: startParams.port } : {})));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    this._extHostConnections[reconnectionToken].acceptReconnection(remoteAddress, socket, dataChunk);
                }
                else {
                    // This is a fresh connection
                    if (this._extHostConnections[reconnectionToken]) {
                        // Cannot have two concurrent connections using the same reconnection token
                        return this._rejectWebSocketConnection(logPrefix, protocol, `Duplicate reconnection token`);
                    }
                    protocol.sendPause();
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(startParams.port ? { debugPort: startParams.port } : {})));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    const con = this._instantiationService.createInstance(extensionHostConnection_1.ExtensionHostConnection, reconnectionToken, remoteAddress, socket, dataChunk);
                    this._extHostConnections[reconnectionToken] = con;
                    this._allReconnectionTokens.add(reconnectionToken);
                    con.onClose(() => {
                        delete this._extHostConnections[reconnectionToken];
                        this._onDidCloseExtHostConnection();
                    });
                    con.start(startParams);
                }
            }
            else if (msg.desiredConnectionType === 3 /* ConnectionType.Tunnel */) {
                const tunnelStartParams = msg.args;
                this._createTunnel(protocol, tunnelStartParams);
            }
            else {
                return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown initial data received`);
            }
        }
        async _createTunnel(protocol, tunnelStartParams) {
            const remoteSocket = protocol.getSocket().socket;
            const dataChunk = protocol.readEntireBuffer();
            protocol.dispose();
            remoteSocket.pause();
            const localSocket = await this._connectTunnelSocket(tunnelStartParams.host, tunnelStartParams.port);
            if (dataChunk.byteLength > 0) {
                localSocket.write(dataChunk.buffer);
            }
            localSocket.on('end', () => remoteSocket.end());
            localSocket.on('close', () => remoteSocket.end());
            localSocket.on('error', () => remoteSocket.destroy());
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            remoteSocket.on('error', () => localSocket.destroy());
            localSocket.pipe(remoteSocket);
            remoteSocket.pipe(localSocket);
        }
        _connectTunnelSocket(host, port) {
            return new Promise((c, e) => {
                const socket = net.createConnection({
                    host: host,
                    port: port
                }, () => {
                    socket.removeListener('error', e);
                    socket.pause();
                    c(socket);
                });
                socket.once('error', e);
            });
        }
        _updateWithFreeDebugPort(startParams) {
            if (typeof startParams.port === 'number') {
                return (0, ports_1.findFreePort)(startParams.port, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */).then(freePort => {
                    startParams.port = freePort;
                    return startParams;
                });
            }
            // No port clear debug configuration.
            startParams.debugId = undefined;
            startParams.port = undefined;
            startParams.break = undefined;
            return Promise.resolve(startParams);
        }
        async _onDidCloseExtHostConnection() {
            if (!this._environmentService.args['enable-remote-auto-shutdown']) {
                return;
            }
            this._cancelShutdown();
            const hasActiveExtHosts = !!Object.keys(this._extHostConnections).length;
            if (!hasActiveExtHosts) {
                console.log('Last EH closed, waiting before shutting down');
                this._logService.info('Last EH closed, waiting before shutting down');
                this._waitThenShutdown();
            }
        }
        _waitThenShutdown() {
            if (!this._environmentService.args['enable-remote-auto-shutdown']) {
                return;
            }
            if (this._environmentService.args['remote-auto-shutdown-without-delay']) {
                this._shutdown();
            }
            else {
                this.shutdownTimer = setTimeout(() => {
                    this.shutdownTimer = undefined;
                    this._shutdown();
                }, SHUTDOWN_TIMEOUT);
            }
        }
        _shutdown() {
            const hasActiveExtHosts = !!Object.keys(this._extHostConnections).length;
            if (hasActiveExtHosts) {
                console.log('New EH opened, aborting shutdown');
                this._logService.info('New EH opened, aborting shutdown');
                return;
            }
            else {
                console.log('Last EH closed, shutting down');
                this._logService.info('Last EH closed, shutting down');
                this.dispose();
                process.exit(0);
            }
        }
        /**
         * If the server is in a shutdown timeout, cancel it and start over
         */
        _delayShutdown() {
            if (this.shutdownTimer) {
                console.log('Got delay-shutdown request while in shutdown timeout, delaying');
                this._logService.info('Got delay-shutdown request while in shutdown timeout, delaying');
                this._cancelShutdown();
                this._waitThenShutdown();
            }
        }
        _cancelShutdown() {
            if (this.shutdownTimer) {
                console.log('Cancelling previous shutdown timeout');
                this._logService.info('Cancelling previous shutdown timeout');
                clearTimeout(this.shutdownTimer);
                this.shutdownTimer = undefined;
            }
        }
    };
    RemoteExtensionHostAgentServer = __decorate([
        __param(4, serverEnvironmentService_1.IServerEnvironmentService),
        __param(5, productService_1.IProductService),
        __param(6, log_1.ILogService),
        __param(7, instantiation_1.IInstantiationService)
    ], RemoteExtensionHostAgentServer);
    exports.RemoteExtensionHostAgentServer = RemoteExtensionHostAgentServer;
    async function createServer(address, args, REMOTE_DATA_FOLDER) {
        const connectionToken = await (0, serverConnectionToken_1.determineServerConnectionToken)(args);
        if (connectionToken instanceof serverConnectionToken_1.ServerConnectionTokenParseError) {
            console.warn(connectionToken.message);
            process.exit(1);
        }
        const disposables = new lifecycle_1.DisposableStore();
        const { socketServer, instantiationService } = await (0, serverServices_1.setupServerServices)(connectionToken, args, REMOTE_DATA_FOLDER, disposables);
        // Set the unexpected error handler after the services have been initialized, to avoid having
        // the telemetry service overwrite our handler
        instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            (0, errors_1.setUnexpectedErrorHandler)(err => {
                // See https://github.com/microsoft/vscode-remote-release/issues/6481
                // In some circumstances, console.error will throw an asynchronous error. This asynchronous error
                // will end up here, and then it will be logged again, thus creating an endless asynchronous loop.
                // Here we try to break the loop by ignoring EPIPE errors that include our own unexpected error handler in the stack.
                if (err && err.code === 'EPIPE' && err.syscall === 'write' && err.stack && /unexpectedErrorHandler/.test(err.stack)) {
                    return;
                }
                logService.error(err);
            });
            process.on('SIGPIPE', () => {
                // See https://github.com/microsoft/vscode-remote-release/issues/6543
                // We would normally install a SIGPIPE listener in bootstrap.js
                // But in certain situations, the console itself can be in a broken pipe state
                // so logging SIGPIPE to the console will cause an infinite async loop
                (0, errors_1.onUnexpectedError)(new Error(`Unexpected SIGPIPE`));
            });
        });
        //
        // On Windows, exit early with warning message to users about potential security issue
        // if there is node_modules folder under home drive or Users folder.
        //
        instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            if (process.platform === 'win32' && process.env.HOMEDRIVE && process.env.HOMEPATH) {
                const homeDirModulesPath = (0, path_1.join)(process.env.HOMEDRIVE, 'node_modules');
                const userDir = (0, path_1.dirname)((0, path_1.join)(process.env.HOMEDRIVE, process.env.HOMEPATH));
                const userDirModulesPath = (0, path_1.join)(userDir, 'node_modules');
                if (fs.existsSync(homeDirModulesPath) || fs.existsSync(userDirModulesPath)) {
                    const message = `

*
* !!!! Server terminated due to presence of CVE-2020-1416 !!!!
*
* Please remove the following directories and re-try
* ${homeDirModulesPath}
* ${userDirModulesPath}
*
* For more information on the vulnerability https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-1416
*

`;
                    logService.warn(message);
                    console.warn(message);
                    process.exit(0);
                }
            }
        });
        const vsdaMod = instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            const hasVSDA = fs.existsSync((0, path_1.join)(network_1.FileAccess.asFileUri('', require).fsPath, '../node_modules/vsda'));
            if (hasVSDA) {
                try {
                    return require.__$__nodeRequire('vsda');
                }
                catch (err) {
                    logService.error(err);
                }
            }
            return null;
        });
        const hasWebClient = fs.existsSync(network_1.FileAccess.asFileUri('vs/code/browser/workbench/workbench.html', require).fsPath);
        if (hasWebClient && address && typeof address !== 'string') {
            // ships the web ui!
            const queryPart = (connectionToken.type !== 0 /* ServerConnectionTokenType.None */ ? `?${network_1.connectionTokenQueryName}=${connectionToken.value}` : '');
            console.log(`Web UI available at http://localhost${address.port === 80 ? '' : `:${address.port}`}/${queryPart}`);
        }
        const remoteExtensionHostAgentServer = instantiationService.createInstance(RemoteExtensionHostAgentServer, socketServer, connectionToken, vsdaMod, hasWebClient);
        perf.mark('code/server/ready');
        const currentTime = perf_hooks_1.performance.now();
        const vscodeServerStartTime = global.vscodeServerStartTime;
        const vscodeServerListenTime = global.vscodeServerListenTime;
        const vscodeServerCodeLoadedTime = global.vscodeServerCodeLoadedTime;
        instantiationService.invokeFunction((accessor) => {
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            telemetryService.publicLog2('serverStart', {
                startTime: vscodeServerStartTime,
                startedTime: vscodeServerListenTime,
                codeLoadedTime: vscodeServerCodeLoadedTime,
                readyTime: currentTime
            });
        });
        if (args['print-startup-performance']) {
            const stats = amd_1.LoaderStats.get();
            let output = '';
            output += '\n\n### Load AMD-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.amdLoad);
            output += '\n\n### Load commonjs-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.nodeRequire);
            output += '\n\n### Invoke AMD-module factory\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.amdInvoke);
            output += '\n\n### Invoke commonjs-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.nodeEval);
            output += `Start-up time: ${vscodeServerListenTime - vscodeServerStartTime}\n`;
            output += `Code loading time: ${vscodeServerCodeLoadedTime - vscodeServerStartTime}\n`;
            output += `Initialized time: ${currentTime - vscodeServerStartTime}\n`;
            output += `\n`;
            console.log(output);
        }
        return remoteExtensionHostAgentServer;
    }
    exports.createServer = createServer;
    class WebEndpointOriginChecker {
        constructor(_originRegExp) {
            this._originRegExp = _originRegExp;
        }
        static create(productService) {
            const webEndpointUrlTemplate = productService.webEndpointUrlTemplate;
            const commit = productService.commit;
            const quality = productService.quality;
            if (!webEndpointUrlTemplate || !commit || !quality) {
                return new WebEndpointOriginChecker(null);
            }
            const uuid = (0, uuid_1.generateUuid)();
            const exampleUrl = new URL(webEndpointUrlTemplate
                .replace('{{uuid}}', uuid)
                .replace('{{commit}}', commit)
                .replace('{{quality}}', quality));
            const exampleOrigin = exampleUrl.origin;
            const originRegExpSource = ((0, strings_1.escapeRegExpCharacters)(exampleOrigin)
                .replace(uuid, '[a-zA-Z0-9\\-]+'));
            try {
                const originRegExp = (0, strings_1.createRegExp)(`^${originRegExpSource}$`, true, { matchCase: false });
                return new WebEndpointOriginChecker(originRegExp);
            }
            catch (err) {
                return new WebEndpointOriginChecker(null);
            }
        }
        matches(origin) {
            if (!this._originRegExp) {
                return false;
            }
            return this._originRegExp.test(origin);
        }
    }
});
//# sourceMappingURL=remoteExtensionHostAgentServer.js.map