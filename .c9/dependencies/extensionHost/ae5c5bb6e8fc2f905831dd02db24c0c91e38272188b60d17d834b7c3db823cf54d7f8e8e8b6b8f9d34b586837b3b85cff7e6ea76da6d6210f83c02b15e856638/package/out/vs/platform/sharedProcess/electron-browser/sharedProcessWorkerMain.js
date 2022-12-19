/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "console", "vs/base/common/buffer", "vs/base/common/console", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/processes", "vs/platform/sharedProcess/common/sharedProcessWorkerService", "vs/platform/sharedProcess/electron-browser/sharedProcessWorker"], function (require, exports, child_process_1, console_1, buffer_1, console_2, errorMessage_1, event_1, lifecycle_1, objects_1, types_1, processes_1, sharedProcessWorkerService_1, sharedProcessWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = void 0;
    /**
     * The `create` function needs to be there by convention because
     * we are loaded via the `vs/base/worker/workerMain` utility.
     */
    function create() {
        const sharedProcessWorkerMain = new SharedProcessWorkerMain();
        // Signal we are ready
        send({ id: sharedProcessWorker_1.SharedProcessWorkerMessages.Ready });
        return {
            onmessage: (message, transfer) => sharedProcessWorkerMain.onMessage(message, transfer)
        };
    }
    exports.create = create;
    class SharedProcessWorkerMain {
        constructor() {
            this.processes = new Map();
        }
        onMessage(message, transfer) {
            // Handle message from shared process
            switch (message.id) {
                // Spawn new process
                case sharedProcessWorker_1.SharedProcessWorkerMessages.Spawn:
                    if (transfer && transfer[0] instanceof MessagePort && message.environment) {
                        this.spawn(transfer[0], message.configuration, message.environment);
                    }
                    break;
                // Terminate existing process
                case sharedProcessWorker_1.SharedProcessWorkerMessages.Terminate:
                    this.terminate(message.configuration);
                    break;
                default:
                    Logger.warn(`Unexpected shared process message '${message}'`);
            }
            // Acknowledge message processed if we have a nonce
            if (message.nonce) {
                send({
                    id: sharedProcessWorker_1.SharedProcessWorkerMessages.Ack,
                    nonce: message.nonce
                });
            }
        }
        spawn(port, configuration, environment) {
            try {
                // Ensure to terminate any existing process for config
                this.terminate(configuration);
                // Spawn a new worker process with given configuration
                const process = new SharedProcessWorkerProcess(port, configuration, environment);
                process.spawn();
                // Handle self termination of the child process
                const listener = event_1.Event.once(process.onDidProcessSelfTerminate)(reason => {
                    send({
                        id: sharedProcessWorker_1.SharedProcessWorkerMessages.SelfTerminated,
                        configuration,
                        message: JSON.stringify(reason)
                    });
                });
                // Remember in map for lifecycle
                const configurationHash = (0, sharedProcessWorkerService_1.hash)(configuration);
                this.processes.set(configurationHash, (0, lifecycle_1.toDisposable)(() => {
                    listener.dispose();
                    // Terminate process
                    process.dispose();
                    // Remove from processes
                    this.processes.delete(configurationHash);
                }));
            }
            catch (error) {
                Logger.error(`Unexpected error forking worker process: ${(0, errorMessage_1.toErrorMessage)(error)}`);
            }
        }
        terminate(configuration) {
            const processDisposable = this.processes.get((0, sharedProcessWorkerService_1.hash)(configuration));
            if (processDisposable) {
                processDisposable.dispose();
            }
        }
    }
    class SharedProcessWorkerProcess extends lifecycle_1.Disposable {
        constructor(port, configuration, environment) {
            super();
            this.port = port;
            this.configuration = configuration;
            this.environment = environment;
            this._onDidProcessSelfTerminate = this._register(new event_1.Emitter());
            this.onDidProcessSelfTerminate = this._onDidProcessSelfTerminate.event;
            this.child = undefined;
        }
        spawn() {
            Logger.trace('Forking worker process');
            // Fork module via bootstrap-fork for AMD support
            this.child = (0, child_process_1.fork)(this.environment.bootstrapPath, [`--type=${this.configuration.process.type}`], { env: this.getEnv() });
            Logger.info(`Starting worker process with pid ${this.child.pid} (type: ${this.configuration.process.type}, window: ${this.configuration.reply.windowId}).`);
            // Re-emit errors to outside
            const onError = event_1.Event.fromNodeEventEmitter(this.child, 'error');
            this._register(onError(error => Logger.warn(`Error from child process: ${(0, errorMessage_1.toErrorMessage)(error)}`)));
            // Handle termination that happens from the process
            // itself. This can either be a crash or the process
            // not being long running.
            const onExit = event_1.Event.fromNodeEventEmitter(this.child, 'exit', (code, signal) => ({ code, signal }));
            this._register(onExit(({ code, signal }) => {
                var _a;
                const logMsg = `Worker process with pid ${(_a = this.child) === null || _a === void 0 ? void 0 : _a.pid} terminated by itself with code ${code}, signal: ${signal} (type: ${this.configuration.process.type}, window: ${this.configuration.reply.windowId})`;
                if (code !== 0 && signal !== 'SIGTERM') {
                    Logger.error(logMsg);
                }
                else {
                    Logger.info(logMsg);
                }
                this.child = undefined;
                this._onDidProcessSelfTerminate.fire({
                    code: (0, types_1.withNullAsUndefined)(code),
                    signal: (0, types_1.withNullAsUndefined)(signal)
                });
            }));
            const onMessageEmitter = this._register(new event_1.Emitter());
            const onRawMessage = event_1.Event.fromNodeEventEmitter(this.child, 'message', msg => msg);
            this._register(onRawMessage(msg => {
                // Handle remote console logs specially
                if ((0, console_2.isRemoteConsoleLog)(msg)) {
                    (0, console_1.log)(msg, `SharedProcess worker`);
                }
                // Anything else goes to the outside
                else {
                    onMessageEmitter.fire(buffer_1.VSBuffer.wrap(Buffer.from(msg, 'base64')));
                }
            }));
            const send = (buffer) => {
                var _a;
                if ((_a = this.child) === null || _a === void 0 ? void 0 : _a.connected) {
                    this.child.send(buffer.buffer.toString('base64'));
                }
                else {
                    Logger.warn('Unable to deliver message to disconnected child');
                }
            };
            // Re-emit messages from the process via the port
            const onMessage = onMessageEmitter.event;
            this._register(onMessage(message => this.port.postMessage(message.buffer)));
            // Relay message from the port into the process
            this.port.onmessage = (e => send(buffer_1.VSBuffer.wrap(e.data)));
            this._register((0, lifecycle_1.toDisposable)(() => this.port.onmessage = null));
        }
        getEnv() {
            const env = Object.assign(Object.assign({}, (0, objects_1.deepClone)(process.env)), { VSCODE_AMD_ENTRYPOINT: this.configuration.process.moduleId, VSCODE_PIPE_LOGGING: 'true', VSCODE_VERBOSE_LOGGING: 'true', VSCODE_PARENT_PID: String(process.pid) });
            // Sanitize environment
            (0, processes_1.removeDangerousEnvVariables)(env);
            return env;
        }
        dispose() {
            var _a;
            super.dispose();
            if (!this.child) {
                return;
            }
            this.child.kill();
            Logger.info(`Worker process with pid ${(_a = this.child) === null || _a === void 0 ? void 0 : _a.pid} terminated normally (type: ${this.configuration.process.type}, window: ${this.configuration.reply.windowId}).`);
        }
    }
    /**
     * Helper for logging messages from the worker.
     */
    var Logger;
    (function (Logger) {
        function error(message) {
            send({ id: sharedProcessWorker_1.SharedProcessWorkerMessages.Error, message });
        }
        Logger.error = error;
        function warn(message) {
            send({ id: sharedProcessWorker_1.SharedProcessWorkerMessages.Warn, message });
        }
        Logger.warn = warn;
        function info(message) {
            send({ id: sharedProcessWorker_1.SharedProcessWorkerMessages.Info, message });
        }
        Logger.info = info;
        function trace(message) {
            send({ id: sharedProcessWorker_1.SharedProcessWorkerMessages.Trace, message });
        }
        Logger.trace = trace;
    })(Logger || (Logger = {}));
    /**
     * Helper for typed `postMessage` usage.
     */
    function send(message) {
        postMessage(message);
    }
});
//# sourceMappingURL=sharedProcessWorkerMain.js.map