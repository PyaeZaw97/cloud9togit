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
define(["require", "exports", "vs/base/parts/ipc/common/ipc.mp", "vs/base/parts/ipc/common/ipc", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/base/common/performance", "vs/base/common/async", "vs/base/parts/ipc/electron-sandbox/ipc.mp"], function (require, exports, ipc_mp_1, ipc_1, log_1, lifecycle_1, performance_1, async_1, ipc_mp_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessService = void 0;
    let SharedProcessService = class SharedProcessService extends lifecycle_1.Disposable {
        constructor(windowId, logService) {
            super();
            this.windowId = windowId;
            this.logService = logService;
            this.restoredBarrier = new async_1.Barrier();
            this.withSharedProcessConnection = this.connect();
        }
        async connect() {
            this.logService.trace('Renderer->SharedProcess#connect');
            // Our performance tests show that a connection to the shared
            // process can have significant overhead to the startup time
            // of the window because the shared process could be created
            // as a result. As such, make sure we await the `Restored`
            // phase before making a connection attempt, but also add a
            // timeout to be safe against possible deadlocks.
            await Promise.race([this.restoredBarrier.wait(), (0, async_1.timeout)(2000)]);
            // Acquire a message port connected to the shared process
            (0, performance_1.mark)('code/willConnectSharedProcess');
            this.logService.trace('Renderer->SharedProcess#connect: before acquirePort');
            const port = await (0, ipc_mp_2.acquirePort)('vscode:createSharedProcessMessageChannel', 'vscode:createSharedProcessMessageChannelResult');
            (0, performance_1.mark)('code/didConnectSharedProcess');
            this.logService.trace('Renderer->SharedProcess#connect: connection established');
            return this._register(new ipc_mp_1.Client(port, `window:${this.windowId}`));
        }
        notifyRestored() {
            if (!this.restoredBarrier.isOpen()) {
                this.restoredBarrier.open();
            }
        }
        getChannel(channelName) {
            return (0, ipc_1.getDelayedChannel)(this.withSharedProcessConnection.then(connection => connection.getChannel(channelName)));
        }
        registerChannel(channelName, channel) {
            this.withSharedProcessConnection.then(connection => connection.registerChannel(channelName, channel));
        }
    };
    SharedProcessService = __decorate([
        __param(1, log_1.ILogService)
    ], SharedProcessService);
    exports.SharedProcessService = SharedProcessService;
});
//# sourceMappingURL=sharedProcessService.js.map