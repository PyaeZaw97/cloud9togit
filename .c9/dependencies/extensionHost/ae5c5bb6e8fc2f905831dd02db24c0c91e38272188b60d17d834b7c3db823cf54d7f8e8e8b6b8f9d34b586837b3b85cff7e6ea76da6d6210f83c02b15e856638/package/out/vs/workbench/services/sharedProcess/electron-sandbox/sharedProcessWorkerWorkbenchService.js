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
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/ipc/electron-sandbox/services", "vs/base/parts/ipc/common/ipc.mp", "vs/platform/instantiation/common/instantiation", "vs/platform/sharedProcess/common/sharedProcessWorkerService", "vs/base/parts/ipc/common/ipc", "vs/base/common/uuid", "vs/base/parts/ipc/electron-sandbox/ipc.mp"], function (require, exports, log_1, lifecycle_1, services_1, ipc_mp_1, instantiation_1, sharedProcessWorkerService_1, ipc_1, uuid_1, ipc_mp_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessWorkerWorkbenchService = exports.ISharedProcessWorkerWorkbenchService = void 0;
    exports.ISharedProcessWorkerWorkbenchService = (0, instantiation_1.createDecorator)('sharedProcessWorkerWorkbenchService');
    let SharedProcessWorkerWorkbenchService = class SharedProcessWorkerWorkbenchService extends lifecycle_1.Disposable {
        constructor(windowId, logService, sharedProcessService) {
            super();
            this.windowId = windowId;
            this.logService = logService;
            this.sharedProcessService = sharedProcessService;
            this._sharedProcessWorkerService = undefined;
        }
        get sharedProcessWorkerService() {
            if (!this._sharedProcessWorkerService) {
                this._sharedProcessWorkerService = ipc_1.ProxyChannel.toService(this.sharedProcessService.getChannel(sharedProcessWorkerService_1.ipcSharedProcessWorkerChannelName));
            }
            return this._sharedProcessWorkerService;
        }
        async createWorker(process) {
            this.logService.trace('Renderer->SharedProcess#createWorker');
            // Get ready to acquire the message port from the shared process worker
            const nonce = (0, uuid_1.generateUuid)();
            const responseChannel = 'vscode:createSharedProcessWorkerMessageChannelResult';
            const portPromise = (0, ipc_mp_2.acquirePort)(undefined /* we trigger the request via service call! */, responseChannel, nonce);
            // Actually talk with the shared process service
            // to create a new process from a worker
            const onDidTerminate = this.sharedProcessWorkerService.createWorker({
                process,
                reply: { windowId: this.windowId, channel: responseChannel, nonce }
            });
            // Dispose worker upon disposal via shared process service
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this.logService.trace('Renderer->SharedProcess#disposeWorker', process);
                this.sharedProcessWorkerService.disposeWorker({
                    process,
                    reply: { windowId: this.windowId }
                });
            }));
            const port = await portPromise;
            const client = disposables.add(new ipc_mp_1.Client(port, `window:${this.windowId},module:${process.moduleId}`));
            this.logService.trace('Renderer->SharedProcess#createWorkerChannel: connection established');
            return { client, onDidTerminate, dispose: () => disposables.dispose() };
        }
    };
    SharedProcessWorkerWorkbenchService = __decorate([
        __param(1, log_1.ILogService),
        __param(2, services_1.ISharedProcessService)
    ], SharedProcessWorkerWorkbenchService);
    exports.SharedProcessWorkerWorkbenchService = SharedProcessWorkerWorkbenchService;
});
//# sourceMappingURL=sharedProcessWorkerWorkbenchService.js.map