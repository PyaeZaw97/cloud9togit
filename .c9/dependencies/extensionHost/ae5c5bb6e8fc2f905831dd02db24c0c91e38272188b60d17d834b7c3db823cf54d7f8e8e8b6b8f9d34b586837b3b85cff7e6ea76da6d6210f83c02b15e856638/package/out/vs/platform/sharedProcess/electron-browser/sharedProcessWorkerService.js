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
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uuid", "vs/platform/log/common/log", "vs/platform/sharedProcess/common/sharedProcessWorkerService", "vs/platform/sharedProcess/electron-browser/sharedProcessWorker"], function (require, exports, electron_1, async_1, cancellation_1, event_1, lifecycle_1, network_1, uuid_1, log_1, sharedProcessWorkerService_1, sharedProcessWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessWorkerService = void 0;
    let SharedProcessWorkerService = class SharedProcessWorkerService {
        constructor(logService) {
            this.logService = logService;
            this.workers = new Map();
            this.processeDisposables = new Map();
            this.processResolvers = new Map();
        }
        async createWorker(configuration) {
            const workerLogId = `window: ${configuration.reply.windowId}, moduleId: ${configuration.process.moduleId}`;
            this.logService.trace(`SharedProcess: createWorker (${workerLogId})`);
            // Ensure to dispose any existing process for config
            const configurationHash = (0, sharedProcessWorkerService_1.hash)(configuration);
            if (this.processeDisposables.has(configurationHash)) {
                this.logService.warn(`SharedProcess: createWorker found an existing worker that will be terminated (${workerLogId})`);
                this.doDisposeWorker(configuration);
            }
            const cts = new cancellation_1.CancellationTokenSource();
            let worker = undefined;
            let windowPort = undefined;
            let workerPort = undefined;
            // Store as process for termination support
            this.processeDisposables.set(configurationHash, (reason) => {
                // Signal to token
                cts.dispose(true);
                // Terminate process
                worker === null || worker === void 0 ? void 0 : worker.terminate(configuration, cancellation_1.CancellationToken.None /* we want to deliver this message */);
                // Close ports
                windowPort === null || windowPort === void 0 ? void 0 : windowPort.close();
                workerPort === null || workerPort === void 0 ? void 0 : workerPort.close();
                // Remove from processes
                this.processeDisposables.delete(configurationHash);
                // Release process resolvers if any
                const processResolver = this.processResolvers.get(configurationHash);
                if (processResolver) {
                    this.processResolvers.delete(configurationHash);
                    processResolver({ reason });
                }
            });
            // Acquire a worker for the configuration
            worker = await this.getOrCreateWebWorker(configuration);
            // Keep a promise that will resolve in the future when the
            // underlying process terminates.
            const onDidTerminate = new Promise(resolve => {
                this.processResolvers.set(configurationHash, resolve);
            });
            if (cts.token.isCancellationRequested) {
                return onDidTerminate;
            }
            // Create a `MessageChannel` with 2 ports:
            // `windowPort`: send back to the requesting window
            // `workerPort`: send into a new worker to use
            const { port1, port2 } = new MessageChannel();
            windowPort = port1;
            workerPort = port2;
            // Spawn in worker and pass over port
            await worker.spawn(configuration, workerPort, cts.token);
            if (cts.token.isCancellationRequested) {
                return onDidTerminate;
            }
            // We cannot just send the `MessagePort` through our protocol back
            // because the port can only be sent via `postMessage`. So we need
            // to send it through the main process back to the window.
            this.logService.trace(`SharedProcess: createWorker sending message port back to window (${workerLogId})`);
            electron_1.ipcRenderer.postMessage('vscode:relaySharedProcessWorkerMessageChannel', configuration, [windowPort]);
            return onDidTerminate;
        }
        getOrCreateWebWorker(configuration) {
            // keep 1 web-worker per process module id to reduce
            // the overall number of web workers while still
            // keeping workers for separate processes around.
            let webWorkerPromise = this.workers.get(configuration.process.moduleId);
            // create a new web worker if this is the first time
            // for the given process
            if (!webWorkerPromise) {
                this.logService.trace(`SharedProcess: creating new web worker (${configuration.process.moduleId})`);
                const sharedProcessWorker = new SharedProcessWebWorker(configuration.process.type, this.logService);
                webWorkerPromise = sharedProcessWorker.init();
                // Make sure to run through our normal `disposeWorker` call
                // when the process terminates by itself.
                sharedProcessWorker.onDidProcessSelfTerminate(({ configuration, reason }) => {
                    this.doDisposeWorker(configuration, reason);
                });
                this.workers.set(configuration.process.moduleId, webWorkerPromise);
            }
            return webWorkerPromise;
        }
        async disposeWorker(configuration) {
            return this.doDisposeWorker(configuration);
        }
        doDisposeWorker(configuration, reason) {
            const processDisposable = this.processeDisposables.get((0, sharedProcessWorkerService_1.hash)(configuration));
            if (processDisposable) {
                this.logService.trace(`SharedProcess: disposeWorker (window: ${configuration.reply.windowId}, moduleId: ${configuration.process.moduleId})`);
                processDisposable(reason);
            }
        }
    };
    SharedProcessWorkerService = __decorate([
        __param(0, log_1.ILogService)
    ], SharedProcessWorkerService);
    exports.SharedProcessWorkerService = SharedProcessWorkerService;
    class SharedProcessWebWorker extends lifecycle_1.Disposable {
        constructor(type, logService) {
            super();
            this.type = type;
            this.logService = logService;
            this._onDidProcessSelfTerminate = this._register(new event_1.Emitter());
            this.onDidProcessSelfTerminate = this._onDidProcessSelfTerminate.event;
            this.workerReady = this.doInit();
            this.mapMessageNonceToPendingMessageResolve = new Map();
        }
        async init() {
            await this.workerReady;
            return this;
        }
        doInit() {
            const readyPromise = new async_1.DeferredPromise();
            const worker = new Worker('../../../base/worker/workerMain.js', {
                name: `Shared Process Worker (${this.type})`
            });
            worker.onerror = event => {
                this.logService.error(`SharedProcess: worker error (${this.type})`, event.message);
            };
            worker.onmessageerror = event => {
                this.logService.error(`SharedProcess: worker message error (${this.type})`, event);
            };
            worker.onmessage = event => {
                const { id, message, configuration, nonce } = event.data;
                switch (id) {
                    // Lifecycle: Ready
                    case sharedProcessWorker_1.SharedProcessWorkerMessages.Ready:
                        readyPromise.complete(worker);
                        break;
                    // Lifecycle: Ack
                    case sharedProcessWorker_1.SharedProcessWorkerMessages.Ack:
                        if (nonce) {
                            const messageAwaiter = this.mapMessageNonceToPendingMessageResolve.get(nonce);
                            if (messageAwaiter) {
                                this.mapMessageNonceToPendingMessageResolve.delete(nonce);
                                messageAwaiter();
                            }
                        }
                        break;
                    // Lifecycle: self termination
                    case sharedProcessWorker_1.SharedProcessWorkerMessages.SelfTerminated:
                        if (configuration && message) {
                            this._onDidProcessSelfTerminate.fire({ configuration, reason: JSON.parse(message) });
                        }
                        break;
                    // Diagostics: trace
                    case sharedProcessWorker_1.SharedProcessWorkerMessages.Trace:
                        this.logService.trace(`SharedProcess (worker, ${this.type}):`, message);
                        break;
                    // Diagostics: info
                    case sharedProcessWorker_1.SharedProcessWorkerMessages.Info:
                        if (message) {
                            this.logService.info(message); // take as is
                        }
                        break;
                    // Diagostics: warn
                    case sharedProcessWorker_1.SharedProcessWorkerMessages.Warn:
                        this.logService.warn(`SharedProcess (worker, ${this.type}):`, message);
                        break;
                    // Diagnostics: error
                    case sharedProcessWorker_1.SharedProcessWorkerMessages.Error:
                        this.logService.error(`SharedProcess (worker, ${this.type}):`, message);
                        break;
                    // Any other message
                    default:
                        this.logService.warn(`SharedProcess: unexpected worker message (${this.type})`, event);
                }
            };
            // First message triggers the load of the worker
            worker.postMessage('vs/platform/sharedProcess/electron-browser/sharedProcessWorkerMain');
            return readyPromise.p;
        }
        async send(message, token, port) {
            const worker = await this.workerReady;
            if (token.isCancellationRequested) {
                return;
            }
            return new Promise(resolve => {
                // Store the awaiter for resolving when message
                // is received with the given nonce
                const nonce = (0, uuid_1.generateUuid)();
                this.mapMessageNonceToPendingMessageResolve.set(nonce, resolve);
                // Post message into worker
                const workerMessage = Object.assign(Object.assign({}, message), { nonce });
                if (port) {
                    worker.postMessage(workerMessage, [port]);
                }
                else {
                    worker.postMessage(workerMessage);
                }
                // Release on cancellation if still pending
                token.onCancellationRequested(() => {
                    if (this.mapMessageNonceToPendingMessageResolve.delete(nonce)) {
                        resolve();
                    }
                });
            });
        }
        spawn(configuration, port, token) {
            const workerMessage = {
                id: sharedProcessWorker_1.SharedProcessWorkerMessages.Spawn,
                configuration,
                environment: {
                    bootstrapPath: network_1.FileAccess.asFileUri('bootstrap-fork', require).fsPath
                }
            };
            return this.send(workerMessage, token, port);
        }
        terminate(configuration, token) {
            const workerMessage = {
                id: sharedProcessWorker_1.SharedProcessWorkerMessages.Terminate,
                configuration
            };
            return this.send(workerMessage, token);
        }
    }
});
//# sourceMappingURL=sharedProcessWorkerService.js.map