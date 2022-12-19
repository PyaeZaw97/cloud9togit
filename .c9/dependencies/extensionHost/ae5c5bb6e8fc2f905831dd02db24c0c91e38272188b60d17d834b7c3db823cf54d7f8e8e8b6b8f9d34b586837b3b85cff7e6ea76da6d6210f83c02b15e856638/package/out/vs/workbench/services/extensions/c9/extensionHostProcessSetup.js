/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "fs", "minimist", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/api/common/extensionHostMain", "vs/base/node/pfs", "vs/base/node/extpath", "vs/editor/common/config/editorOptions", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/c9/extHostLogService", "vs/workbench/api/common/extHost.common.services", "vs/workbench/api/node/extHost.node.services"], function (require, exports, net_1, fs_1, minimist, ipc_net_1, ipc_net_2, extensionHostProtocol_1, extensionHostMain_1, pfs_1, extpath_1, editorOptions_1, lifecycle_1, extensions_1, log_1, extHostLogService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.startExtensionHostProcess = void 0;
    (0, extensions_1.registerSingleton)(log_1.ILogService, extHostLogService_1.ExtHostLogService);
    const disposables = new lifecycle_1.DisposableStore();
    const nativeExit = process.exit.bind(process);
    // workaround for https://github.com/microsoft/vscode/issues/85490
    // remove --inspect-port=0 after start so that it doesn't trigger LSP debugging
    (function removeInspectPort() {
        for (let i = 0; i < process.execArgv.length; i++) {
            if (process.execArgv[i] === '--inspect-port=0') {
                process.execArgv.splice(i, 1);
                i--;
            }
        }
    })();
    const args = minimist(process.argv.slice(2), {
        boolean: [
            'transformURIs',
            'skipWorkspaceStorageLock'
        ],
        string: [
            'useHostProxy' // 'true' | 'false' | undefined
        ]
    });
    // With Electron 2.x and node.js 8.x the "natives" module
    // can cause a native crash (see https://github.com/nodejs/node/issues/19891 and
    // https://github.com/electron/electron/issues/10905). To prevent this from
    // happening we essentially blocklist this module from getting loaded in any
    // extension by patching the node require() function.
    (function () {
        const Module = require.__$__nodeRequire('module');
        const originalLoad = Module._load;
        Module._load = function (request) {
            if (request === 'natives') {
                throw new Error('Either the extension or an NPM dependency is using the [unsupported "natives" node module](https://go.microsoft.com/fwlink/?linkid=871887).');
            }
            return originalLoad.apply(this, arguments);
        };
    })();
    const exit = (code) => {
        disposables.dispose();
        nativeExit(code);
    };
    // This calls exit directly in case the initialization is not finished and we need to exit
    // Otherwise, if initialization completed we go to extensionHostMain.terminate()
    let onTerminate = (reason = 'unknown', code) => {
        console.log(`Terminating extension host early, reason: ${reason}; pid=${process.pid}`);
        exit(code);
    };
    // Prevent process.exit calls
    function patchProcess(allowExit) {
        process.exit = function (code) {
            if (allowExit) {
                exit(code);
            }
            else {
                const err = new Error('An extension called process.exit() and this was prevented.');
                console.warn(err.stack);
            }
        };
    }
    // Console logs are sent to main process (vfs worker)
    function handleExceptions() {
        // Print a console message when rejection isn't handled within N seconds. For details:
        // see https://nodejs.org/api/process.html#process_event_unhandledrejection
        // and https://nodejs.org/api/process.html#process_event_rejectionhandled
        const unhandledPromises = new Map();
        process.on('unhandledRejection', (reason, promise) => {
            unhandledPromises.set(promise, reason);
            setTimeout(() => {
                const reason = unhandledPromises.get(promise);
                if (!reason) {
                    return;
                }
                promise.catch(e => {
                    unhandledPromises.delete(promise);
                    console.error(`Rejected promise not handled within 1 second: ${e}, reason: ${reason}, stack: ${e &&
                        e.stack}`);
                });
            }, 1000);
        });
        process.on('rejectionHandled', (promise) => {
            unhandledPromises.delete(promise);
        });
        // Print a console message when an exception isn't handled.
        process.on('uncaughtException', (err) => {
            console.error('Uncaught exception:', err);
        });
    }
    function createSocketServer(socketName) {
        return new Promise((resolve, reject) => {
            const server = (0, net_1.createServer)();
            disposables.add({
                dispose: () => {
                    if (!(0, fs_1.existsSync)(socketName)) {
                        return;
                    }
                    (0, fs_1.unlinkSync)(socketName);
                }
            });
            server.on('error', reject);
            server.listen(socketName, () => {
                server.removeListener('error', reject);
                resolve(server);
            });
        });
    }
    function awaitSocketConnection(socketServer) {
        let result = undefined;
        return new Promise((resolve, reject) => {
            // Wait for the client to connect to our named pipe
            // and wrap the socket in the message passing protocol
            let handle = setTimeout(() => {
                socketServer.close();
                reject(new Error('Unable to get socket connection: timeout'));
            }, 60 * 1000);
            socketServer.on('connection', (socket) => {
                clearTimeout(handle);
                if (result === undefined) {
                    result = new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(socket));
                    resolve(result);
                }
                else {
                    result.beginAcceptReconnection(new ipc_net_2.NodeSocket(socket), null);
                    // vscode-source/merged/src/vs/platform/remote/common/remoteAgentConnection.ts waits for the first message after beginning to accept reconnection before ending to accept reconnection. I'm not sure why that is.
                    result.endAcceptReconnection();
                }
            });
        });
    }
    function handleSpecialMessages(persistentProtocol) {
        return new (class {
            constructor() {
                this.terminating = false;
                this._onMessage = new ipc_net_1.BufferedEmitter();
                this.onMessage = this._onMessage.event;
                persistentProtocol.onMessage(msg => {
                    if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 2 /* MessageType.Terminate */)) {
                        this.terminate('rpc-message');
                    }
                    else {
                        this._onMessage.fire(msg);
                    }
                });
            }
            send(msg) {
                if (!this.terminating) {
                    persistentProtocol.send(msg);
                }
            }
            terminate(reason) {
                if (this.terminating) {
                    return;
                }
                this.terminating = true;
                onTerminate(reason);
            }
            drain() {
                return persistentProtocol.drain();
            }
        })();
    }
    function connectToRenderer(protocol) {
        return new Promise((resolve, reject) => {
            // Listen init data message
            const first = protocol.onMessage(rawMessage => {
                try {
                    console.log('Extension host process received initialization message.');
                    first.dispose();
                    const initData = JSON.parse(rawMessage.toString());
                    // Tell the outside that we are initialized
                    protocol.send((0, extensionHostProtocol_1.createMessageOfType)(0 /* MessageType.Initialized */));
                    resolve(initData);
                }
                catch (error) {
                    reject(error);
                }
            });
            console.log(`Extension host process is ready to receive messages, sending ready message through the protocol at ${new Date().toISOString()}.`);
            protocol.send((0, extensionHostProtocol_1.createMessageOfType)(1 /* MessageType.Ready */));
        });
    }
    const DEFAULT_KILL_TIMEOUT = 1000 * 60 * 5;
    function prepareToDie(protocol, killTimeoutMs) {
        console.log('Extension host kill timeout:', killTimeoutMs);
        let timeoutId;
        // Happens after 20s of inactivity (keep-alive messages are sent every 5s)
        protocol.onSocketTimeout(() => {
            clearTimeout(timeoutId);
            // Wait 3 days before killing itself
            timeoutId = setTimeout(() => onTerminate('timeout'), killTimeoutMs);
        });
        protocol.onMessage(() => clearTimeout(timeoutId));
    }
    async function tryStartExtensionHostProcess() {
        handleExceptions();
        let protocol;
        process.once('SIGUSR2', () => {
            console.log(`The extension host process got SIGUSR2 signal and is terminating: pid=${process.pid}`);
            if (protocol) {
                protocol.terminate('kill-signal');
            }
            else {
                onTerminate('kill-signal', 0);
            }
        });
        const socketName = process.env.VSCODE_IPC_HOOK_EXTHOST;
        const socketServer = await createSocketServer(socketName);
        const persistentProtocol = await awaitSocketConnection(socketServer);
        disposables.add(persistentProtocol);
        disposables.add(persistentProtocol.getSocket());
        console.log('Extension host started listening on a socket.');
        const killTimeout = parseInt(process.env.VSCODE_EXTHOST_KILL_TIMEOUT || '', 10) ||
            DEFAULT_KILL_TIMEOUT;
        prepareToDie(persistentProtocol, killTimeout);
        protocol = handleSpecialMessages(persistentProtocol);
        const initData = await connectToRenderer(protocol);
        // setup things
        patchProcess(!!initData.environment.extensionTestsLocationURI); // to support other test frameworks like Jasmin that use process.exit (https://github.com/microsoft/vscode/issues/37708)
        initData.environment.useHostProxy = args.useHostProxy !== undefined ? args.useHostProxy !== 'false' : undefined;
        initData.environment.skipWorkspaceStorageLock = (0, editorOptions_1.boolean)(args.skipWorkspaceStorageLock, false);
        const hostUtils = new (class NodeHost {
            constructor() {
                this.pid = process.pid;
            }
            // Called by extensionHostMain.terminate
            exit(code) {
                exit(code);
            }
            exists(path) {
                return pfs_1.Promises.exists(path);
            }
            realpath(path) {
                return (0, extpath_1.realpath)(path);
            }
        })();
        const extensionHostMain = new extensionHostMain_1.ExtensionHostMain(protocol, initData, hostUtils, null);
        // Rewrite onTerminate-function to be a proper shutdown
        onTerminate = (reason = 'unknown', code) => {
            console.log(`Terminating extension host, reason: ${reason}`);
            extensionHostMain.terminate(reason, code);
        };
        // Listen to SIGPIPE after handshake is completed, to avoid sending unexpected error messages
        // It's not necessary to handle such messages in node, but it might help with debugging some errors
        process.on('SIGPIPE', () => console.error(new Error('Unexpected SIGPIPE')));
    }
    async function startExtensionHostProcess() {
        try {
            await tryStartExtensionHostProcess();
        }
        catch (error) {
            console.error('Exception during extension host initialization:', error);
            onTerminate('exception', 55 /* ExtensionHostExitCode.VersionMismatch */);
        }
    }
    exports.startExtensionHostProcess = startExtensionHostProcess;
});
//# sourceMappingURL=extensionHostProcessSetup.js.map