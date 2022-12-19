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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/network", "vs/platform/log/common/log", "worker_threads", "vs/base/common/worker/simpleWorker", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/base/common/stopwatch"], function (require, exports, errors_1, event_1, network_1, log_1, worker_threads_1, simpleWorker_1, lifecycleMainService_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkerMainProcessExtensionHostStarter = void 0;
    class NodeWorker {
        constructor(callback, onErrorCallback) {
            this._worker = new worker_threads_1.Worker(network_1.FileAccess.asFileUri('vs/platform/extensions/node/extensionHostStarterWorkerMain.js', require).fsPath);
            this._worker.on('message', callback);
            this._worker.on('error', onErrorCallback);
            this.onError = event_1.Event.fromNodeEventEmitter(this._worker, 'error');
            this.onExit = event_1.Event.fromNodeEventEmitter(this._worker, 'exit');
            this.onMessageError = event_1.Event.fromNodeEventEmitter(this._worker, 'messageerror');
        }
        getId() {
            return 1;
        }
        postMessage(message, transfer) {
            this._worker.postMessage(message, transfer);
        }
        dispose() {
            this._worker.terminate();
        }
    }
    let ExtensionHostStarterWorkerHost = class ExtensionHostStarterWorkerHost {
        constructor(_logService) {
            this._logService = _logService;
        }
        async logInfo(message) {
            this._logService.info(message);
        }
    };
    ExtensionHostStarterWorkerHost = __decorate([
        __param(0, log_1.ILogService)
    ], ExtensionHostStarterWorkerHost);
    let WorkerMainProcessExtensionHostStarter = class WorkerMainProcessExtensionHostStarter {
        constructor(_logService, lifecycleMainService) {
            this._logService = _logService;
            this._shutdown = false;
            this._proxy = null;
            const workerFactory = {
                create: (moduleId, callback, onErrorCallback) => {
                    const worker = new NodeWorker(callback, onErrorCallback);
                    worker.onError((err) => {
                        this._logService.error(`ExtensionHostStarterWorker has encountered an error:`);
                        this._logService.error(err);
                    });
                    worker.onMessageError((err) => {
                        this._logService.error(`ExtensionHostStarterWorker has encountered a message error:`);
                        this._logService.error(err);
                    });
                    worker.onExit((exitCode) => this._logService.info(`ExtensionHostStarterWorker exited with code ${exitCode}.`));
                    worker.postMessage(moduleId, []);
                    return worker;
                }
            };
            this._worker = new simpleWorker_1.SimpleWorkerClient(workerFactory, 'vs/platform/extensions/node/extensionHostStarterWorker', new ExtensionHostStarterWorkerHost(this._logService));
            this._initialize();
            // On shutdown: gracefully await extension host shutdowns
            lifecycleMainService.onWillShutdown((e) => {
                this._shutdown = true;
                if (this._proxy) {
                    e.join(this._proxy.waitForAllExit(6000));
                }
            });
        }
        dispose() {
            // Intentionally not killing the extension host processes
        }
        async _initialize() {
            this._proxy = await this._worker.getProxyObject();
            this._logService.info(`ExtensionHostStarterWorker created`);
        }
        onDynamicStdout(id) {
            return this._proxy.onDynamicStdout(id);
        }
        onDynamicStderr(id) {
            return this._proxy.onDynamicStderr(id);
        }
        onDynamicMessage(id) {
            return this._proxy.onDynamicMessage(id);
        }
        onDynamicError(id) {
            return this._proxy.onDynamicError(id);
        }
        onDynamicExit(id) {
            return this._proxy.onDynamicExit(id);
        }
        async createExtensionHost() {
            const proxy = await this._worker.getProxyObject();
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            return proxy.createExtensionHost();
        }
        async start(id, opts) {
            const sw = stopwatch_1.StopWatch.create(false);
            const proxy = await this._worker.getProxyObject();
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const timeout = setTimeout(() => {
                this._logService.info(`ExtensionHostStarterWorker.start() did not return within 30s. This might be a problem.`);
            }, 30000);
            const result = await proxy.start(id, opts);
            const duration = sw.elapsed();
            this._logService.info(`ExtensionHostStarterWorker.start() took ${duration} ms.`);
            clearTimeout(timeout);
            return result;
        }
        async enableInspectPort(id) {
            const proxy = await this._worker.getProxyObject();
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            return proxy.enableInspectPort(id);
        }
        async kill(id) {
            const proxy = await this._worker.getProxyObject();
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            return proxy.kill(id);
        }
    };
    WorkerMainProcessExtensionHostStarter = __decorate([
        __param(0, log_1.ILogService),
        __param(1, lifecycleMainService_1.ILifecycleMainService)
    ], WorkerMainProcessExtensionHostStarter);
    exports.WorkerMainProcessExtensionHostStarter = WorkerMainProcessExtensionHostStarter;
});
//# sourceMappingURL=workerMainProcessExtensionHostStarter.js.map