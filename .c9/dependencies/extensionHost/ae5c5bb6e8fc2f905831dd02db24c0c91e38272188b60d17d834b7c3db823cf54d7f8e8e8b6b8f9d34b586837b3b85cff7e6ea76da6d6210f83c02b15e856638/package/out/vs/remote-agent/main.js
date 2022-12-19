// Modifications Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
define(["require", "exports", "path", "fs", "vs/base/common/errors", "net", "child_process", "vs/base/parts/ipc/node/ipc.net", "vs/base/common/event", "vs/base/common/buffer", "vs/platform/extensions/common/extensions", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/objects", "vs/remote-agent/constants", "vs/base/common/network"], function (require, exports, path, fs, errors, net_1, child_process_1, ipc_net_1, event_1, buffer_1, extensions_1, uri_1, lifecycle_1, types, objects, constants_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Buffer = exports.RemoteHost = void 0;
    const CONNECT_TIMEOUT = 1000 * 30;
    const RECONNECT_POLL_DELAY = 50;
    function retrySeveralTimes(action, delay, retriesLeft) {
        if (retriesLeft < 2) {
            return action();
        }
        return action().catch(async (err) => {
            console.log('Extension host connection attempt failed with:', err);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retrySeveralTimes(action, delay, retriesLeft - 1);
        });
    }
    function isRunning(pid) {
        try {
            process.kill(pid, 0);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    class RemoteHost {
        constructor(extensionPaths, logsFolder, socketFolders, envParams) {
            this.extensionPaths = extensionPaths;
            this.logsFolder = logsFolder;
            this.envParams = envParams;
            this._terminating = false;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onUnexpectedExit = new event_1.Emitter();
            this.onUnexpectedExit = this._onUnexpectedExit.event;
            this._onUnexpectedError = new event_1.Emitter();
            this.onUnexpectedError = this._onUnexpectedError.event;
            this.setSocketFolder(socketFolders);
            this._disposables.add(this._onUnexpectedError);
            this._disposables.add(this._onUnexpectedExit);
            // This handler will be invoked if some VS module calls onUnexpectedError "global" function.
            // (for example NodeSocket) Keep in mind that we are still in vfs-worker process here.
            errors.setUnexpectedErrorHandler((error) => {
                this._onUnexpectedError.fire(error);
            });
        }
        setSocketFolder(socketFolders) {
            if (!socketFolders || !socketFolders.length) {
                throw new Error("No socket folder provided, extension host cannot run connection without it.");
            }
            for (const socketFolder of socketFolders) {
                if (this.isValidSocketFolder(socketFolder)) {
                    this.socketStorageFolder = socketFolder.socketStorageFolder;
                    this.socketSymlinkFolder = socketFolder.socketSymlinkFolder;
                    break;
                }
            }
            if (!this.socketStorageFolder) {
                throw new Error("No valid socket folder has been found, extension host cannot run without it.");
            }
        }
        isValidSocketFolder(socketFolder) {
            if (!socketFolder.socketStorageFolder) {
                return false;
            }
            if (!socketFolder.socketSymlinkFolder) {
                return this.isValidSocketPath(socketFolder.socketStorageFolder);
            }
            return this.isValidSocketPath(socketFolder.socketSymlinkFolder) && this.hasWritePermission(socketFolder.socketStorageFolder);
        }
        isValidSocketPath(socketPath) {
            return this.canStoreSockets(socketPath) && this.hasWritePermission(socketPath);
        }
        canStoreSockets(socketPath) {
            // See https://nodejs.org/api/net.html#identifying-paths-for-ipc-connections, on Linux max characters allowed for a socket path is 107
            // We add 42 characters inside of generateSocketName
            return socketPath.length + 42 <= 107;
        }
        hasWritePermission(socketPath) {
            let currentPath = socketPath;
            let previousPath = undefined;
            try {
                while (currentPath && previousPath !== currentPath) {
                    if (fs.existsSync(currentPath)) {
                        fs.accessSync(currentPath, fs.constants.W_OK);
                        return true;
                    }
                    previousPath = currentPath;
                    currentPath = path.dirname(currentPath);
                }
                return false;
            }
            catch (error) {
                return false;
            }
        }
        createSocketFolders() {
            if (!fs.existsSync(this.socketStorageFolder)) {
                console.log(`Creating extension host socket storage folder in "${this.socketStorageFolder}".`);
                fs.mkdirSync(this.socketStorageFolder, { recursive: true });
            }
            else {
                console.log(`Using existing extension host socket storage folder from "${this.socketStorageFolder}".`);
            }
            if (this.socketSymlinkFolder) {
                if (!fs.existsSync(this.socketSymlinkFolder)) {
                    console.log(`Creating extension host socket symlink folder in "${this.socketSymlinkFolder}" and linking it to "${this.socketStorageFolder}".`);
                    const parentPath = path.dirname(this.socketSymlinkFolder);
                    if (!fs.existsSync(parentPath)) {
                        fs.mkdirSync(parentPath, { recursive: true });
                    }
                    fs.symlinkSync(this.socketStorageFolder, this.socketSymlinkFolder);
                }
                else {
                    console.log(`Using existing extension host socket symlink folder from "${this.socketSymlinkFolder}".`);
                }
            }
        }
        // The code here is similar to (and partially copy-pasted from) ExtensionHostProcessWorker
        // located in vs/workbench/services/extensions/electron-browser/extensionHost.ts
        async connect(sessionId, projectId, preserveSymlinks, remoteHostPID) {
            this.createSocketFolders();
            const socketName = this.generateSocketName(sessionId);
            console.log(`Extension host full socket path: "${socketName}"`);
            if (socketName.length > 107) {
                throw new Error("Socket name is too long, see https://nodejs.org/api/net.html#identifying-paths-for-ipc-connections. Stopping connection as we cannot reliably connect to an extension host process using this socket path.");
            }
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                var _a;
                (_a = this._extensionHostProtocol) === null || _a === void 0 ? void 0 : _a.dispose();
                this.deleteSocket(socketName);
            }));
            if (remoteHostPID) {
                // We are trying to reconnect to the existing extension host process
                if (!fs.existsSync(socketName)) {
                    throw Error(constants_1.socketMissingError);
                }
                if (!isRunning(remoteHostPID)) {
                    throw Error(constants_1.remoteHostNotFoundError);
                }
                console.log('await existing connection');
                this._extensionHostProtocol = await this.connectToSocket(socketName);
            }
            else {
                console.log('start new connection');
                this._extensionHostProtocol = await this.startHost(socketName, projectId, preserveSymlinks);
            }
            return this._extensionHostProtocol;
        }
        async startHost(socketName, projectId, preserveSymlinks) {
            const opts = {
                env: objects.mixin(objects.deepClone(this.envParams), {
                    VSCODE_AMD_ENTRYPOINT: 'vs/workbench/services/extensions/c9/extensionHostProcess',
                    VSCODE_PIPE_LOGGING: 'true',
                    VSCODE_VERBOSE_LOGGING: true,
                    VSCODE_EXTHOST_KILL_TIMEOUT: 1000 * 60 * 60 * 24 * 3,
                    VSCODE_IPC_HOOK_EXTHOST: socketName,
                    VSCODE_HANDLES_UNCAUGHT_ERRORS: true,
                    VSCODE_LOG_STACK: false,
                    VSCODE_LOG_LEVEL: 'log',
                    // c9-package-overrides is populated on postinstall with packages we can't install under brazil
                    // The folder is also included in the packed npm tarball
                    VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH: path.join(__dirname, "../../../c9-package-overrides"),
                    // VFS worker (and this file) is started by an ssh connection from a non-interactive shell.
                    // Because of that environment variables intended for interactive shells aren't exported.
                    // Ensure that LANG exists, as it's required for sam cli.
                    LANG: this.envParams.LANG || 'en_US.utf-8',
                }),
                detached: true,
                // note: we must not use 'inherit' file descriptors as this causes issues when vfs worker process exits:
                // extension host sharing its file descriptors prevents it from being cleaned and makes it a zombie, weird
                // things happen then and reconnection logic doesn't work. See https://sim.amazon.com/issues/VFS-1306
                //
                // instead we:
                //  (1) use IPC which together with process.env.PIPE_LOGGING makes extension host deliver console.logs
                //    with a call to `process.send` (which is received below in `process.on("message", ...)` handler)
                //  (2) to avoid losing precious startup logs in case something goes wrong before extension host sets up
                //    log piping we also pipe stderr and stdout streams to our own console.log (which logs to stderr
                //	  of worker which eventually ends up in vfs application log)
                stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
                execArgv: [],
            };
            if (preserveSymlinks) {
                opts.execArgv = opts.execArgv.concat(['--preserve-symlinks', '--preserve-symlinks-main']);
            }
            if (process.env.INSPECT_EXTENSION_HOST) {
                console.log('Extension host inspect requested on ', process.env.INSPECT_EXTENSION_HOST);
                opts.execArgv.push(`--inspect=${process.env.INSPECT_EXTENSION_HOST}`);
            }
            const bootFile = network_1.FileAccess.asFileUri('bootstrap-fork', require).fsPath;
            const processArgs = ['--type=extensionHost', '--skipWorkspaceStorageLock', "--useHostProxy='false'"];
            if (projectId !== undefined) {
                processArgs.push(`--c9id=${projectId}`);
            }
            const logStream = (streamName, stream) => {
                stream.on('data', (msg) => {
                    console.log(`Extension Host ${streamName}: ${msg}`);
                });
                stream.on('end', () => {
                    console.log(`Extension Host ${streamName} 'end'`);
                });
                stream.on('close', () => {
                    console.log(`Extension Host ${streamName} 'close'`);
                });
            };
            // @ts-ignore
            this._extensionHostProcess = (0, child_process_1.fork)(bootFile, processArgs, opts);
            if (this._extensionHostProcess && this._extensionHostProcess.stdout) {
                logStream('STDOUT', this._extensionHostProcess.stdout);
            }
            if (this._extensionHostProcess && this._extensionHostProcess.stderr) {
                logStream('STDERR', this._extensionHostProcess.stderr);
            }
            // When the extension host is started we're connected to it through an ipc channel, even though the host is a detached process.
            // After the host initializes, it will use the UNIX socket to communicate over instead of the ipc channel.
            // When we reconnect to the extension host, the UNIX socket is still used to communicate over, so it's OK that we don't have the ipc channel any longer.
            this._extensionHostProcess.on('message', (msg) => {
                if (msg.type === '__$console') {
                    let args;
                    try {
                        args = JSON.parse(msg.arguments);
                    }
                    catch (e) {
                        args = [msg.arguments];
                    }
                    console.log(`Extension Host [${msg.severity}]:`, ...args);
                    return;
                }
                console.group('Extension Host Message');
                console.log(msg);
                console.groupEnd();
            });
            this._extensionHostProcess.unref();
            this._extensionHostProcess.on('exit', this._onExtHostProcessExit.bind(this));
            this._extensionHostProcess.on('error', this._onExtHostProcessError.bind(this));
            console.log('Connecting to extension host socket:', socketName);
            return retrySeveralTimes(() => this.connectToSocket(socketName), RECONNECT_POLL_DELAY, CONNECT_TIMEOUT / RECONNECT_POLL_DELAY);
        }
        generateSocketName(id) {
            var _a;
            return path.join((_a = this.socketSymlinkFolder) !== null && _a !== void 0 ? _a : this.socketStorageFolder, `${id}.sock`);
        }
        deleteSocket(socketName) {
            if (fs.existsSync(socketName)) {
                fs.unlinkSync(socketName);
            }
        }
        softKill(pid) {
            if (isRunning(pid)) {
                process.kill(pid, 'SIGUSR2');
            }
        }
        connectToSocket(socketName) {
            return new Promise((resolve, reject) => {
                const socket = (0, net_1.createConnection)(socketName, () => {
                    socket.removeListener('error', reject);
                    // We only log socket events after socket is already "connected" if it happens before "connection" then this promise is rejected.
                    socket.addListener('error', (err) => console.log(`Extension host socket error happened: ${err}`));
                    socket.addListener('close', (hadError) => console.log(`Extension host socket closed, there were ${hadError ? "" : "no"} errors.`));
                    resolve(new ipc_net_1.NodeSocket(socket));
                });
                socket.on('error', reject);
            });
        }
        async _getHostProcessPid() {
            if (this._extensionHostProcess && this._extensionHostProcess.pid !== undefined) {
                return this._extensionHostProcess.pid;
            }
            return null;
        }
        async cleanup(sessions) {
            var _a;
            console.log('Extension host clean-up is called', sessions, (_a = this._extensionHostProcess) === null || _a === void 0 ? void 0 : _a.pid);
            return sessions.map((session) => {
                try {
                    if (session.pid) {
                        this.softKill(session.pid);
                    }
                    if (session.sid) {
                        this.deleteSocket(this.generateSocketName(session.sid));
                    }
                    return { sid: session.sid };
                }
                catch (error) {
                    console.log('An error occurred during extension host clean-up', error, session);
                    return { sid: session.sid, error };
                }
            });
        }
        async getEnvironment() {
            return {
                pid: process.pid,
                extensions: await this.getExtensionPackages(),
                env: this.envParams,
                os: 3 /* OperatingSystem.Linux */,
                // TODO: figure out what exactly do we need here
                // @ts-ignore
                appRoot: undefined,
                // @ts-ignore
                appSettingsHome: undefined,
                // @ts-ignore
                settingsPath: undefined,
                // @ts-ignore
                // TODO change this to real path to global storage
                logsPath: uri_1.URI.file(this.logsFolder),
                // @ts-ignore
                // TODO change this to real path to global storage
                extensionHostLogsPath: uri_1.URI.file(this.logsFolder),
                // @ts-ignore
                userHome: undefined,
                workspaceStorageHome: uri_1.URI.file(this.logsFolder)
            };
        }
        async getExtensionPackages() {
            try {
                const packages = [];
                for (const path of this.extensionPaths) {
                    const extensionPackage = this.getPackage(path);
                    const localizedMessages = this.getNlsMessageBundle(path);
                    if (extensionPackage) {
                        if (localizedMessages) {
                            this.replaceNLSPlaceholders(extensionPackage, localizedMessages);
                        }
                        packages.push(this.createExtensionDescription(path, extensionPackage));
                    }
                }
                return packages;
            }
            catch (e) {
                if (e.code === 'ENOENT') {
                    console.error('Could not find extensions directory.');
                    return [];
                }
                throw e;
            }
        }
        replaceNLSPlaceholders(literal, messages) {
            processObject(literal);
            function processObject(literal) {
                for (let key in literal) {
                    if (literal.hasOwnProperty(key)) {
                        processEntry(literal, key);
                    }
                }
            }
            function processEntry(obj, key) {
                let value = obj[key];
                if (types.isString(value)) {
                    let length = value.length;
                    if (length > 1 && value[0] === '%' && value[length - 1] === '%') {
                        let messageKey = value.substr(1, length - 2);
                        let message = messages[messageKey];
                        if (message) {
                            obj[key] = message;
                        }
                        else {
                            console.warn("Couldn't find message for key {0}.", messageKey);
                        }
                    }
                }
                else if (types.isObject(value)) {
                    processObject(value);
                }
                else if (types.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        processEntry(value, i);
                    }
                }
            }
        }
        getPackage(extensionFolder) {
            try {
                return JSON.parse(fs.readFileSync(path.join(extensionFolder, 'package.json'), { encoding: 'utf8' }));
            }
            catch (e) {
                return null;
            }
        }
        getNlsMessageBundle(extensionPath) {
            try {
                const packagePath = this.getPackageMetadataPath(extensionPath);
                return JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' }));
            }
            catch (e) {
                return null;
            }
        }
        getPackageMetadataPath(extensionPath) {
            return path.join(extensionPath, 'package.nls.json');
        }
        createExtensionDescription(extensionPath, packageData) {
            return Object.assign(Object.assign({}, packageData), { identifier: new extensions_1.ExtensionIdentifier(`${packageData.publisher}.${packageData.name}`), isBuiltin: false, isUnderDevelopment: false, extensionLocation: uri_1.URI.file(extensionPath) });
        }
        _onExtHostProcessExit(code, signal) {
            if (!this._terminating) {
                this._onUnexpectedExit.fire([code, signal]);
            }
            this._extensionHostProcess = undefined;
            this._clearResources();
        }
        _onExtHostProcessError(error) {
            this._onUnexpectedError.fire(error);
        }
        terminate(pid) {
            var _a;
            console.log(`Extension host terminate is called: terminating_pid=${pid}; host_pid=${(_a = this._extensionHostProcess) === null || _a === void 0 ? void 0 : _a.pid}; terminating=${this._terminating}`);
            if (this._terminating) {
                return;
            }
            this._terminating = true;
            this._clearResourcesTimeoutId = setTimeout(() => this._clearResources(), 10 * 1000);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(this._clearResourcesTimeoutId)));
            if (pid) {
                this.softKill(pid);
            }
        }
        _clearResources() {
            this._disposables.dispose();
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = undefined;
            }
        }
    }
    exports.RemoteHost = RemoteHost;
    // Export VSBuffer for use in vfs extension that consumes this module
    // (c9.extensions.remotehost/remote-host)
    exports.Buffer = buffer_1.VSBuffer;
});
//# sourceMappingURL=main.js.map