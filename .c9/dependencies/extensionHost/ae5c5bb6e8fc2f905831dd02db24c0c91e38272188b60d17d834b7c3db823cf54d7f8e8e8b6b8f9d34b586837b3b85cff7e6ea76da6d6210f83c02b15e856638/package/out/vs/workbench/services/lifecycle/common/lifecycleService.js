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
define(["require", "exports", "vs/base/common/event", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/performance", "vs/platform/storage/common/storage"], function (require, exports, event_1, async_1, lifecycle_1, lifecycle_2, log_1, performance_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractLifecycleService = void 0;
    let AbstractLifecycleService = class AbstractLifecycleService extends lifecycle_1.Disposable {
        constructor(logService, storageService) {
            super();
            this.logService = logService;
            this.storageService = storageService;
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this.onBeforeShutdown = this._onBeforeShutdown.event;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onDidShutdown = this._register(new event_1.Emitter());
            this.onDidShutdown = this._onDidShutdown.event;
            this._onBeforeShutdownError = this._register(new event_1.Emitter());
            this.onBeforeShutdownError = this._onBeforeShutdownError.event;
            this._onShutdownVeto = this._register(new event_1.Emitter());
            this.onShutdownVeto = this._onShutdownVeto.event;
            this._phase = 1 /* LifecyclePhase.Starting */;
            this.phaseWhen = new Map();
            // Resolve startup kind
            this._startupKind = this.resolveStartupKind();
            // Save shutdown reason to retrieve on next startup
            this.storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this.storageService.store(AbstractLifecycleService.LAST_SHUTDOWN_REASON_KEY, this.shutdownReason, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                }
            });
        }
        get startupKind() { return this._startupKind; }
        get phase() { return this._phase; }
        resolveStartupKind() {
            // Retrieve and reset last shutdown reason
            const lastShutdownReason = this.storageService.getNumber(AbstractLifecycleService.LAST_SHUTDOWN_REASON_KEY, 1 /* StorageScope.WORKSPACE */);
            this.storageService.remove(AbstractLifecycleService.LAST_SHUTDOWN_REASON_KEY, 1 /* StorageScope.WORKSPACE */);
            // Convert into startup kind
            let startupKind;
            switch (lastShutdownReason) {
                case 3 /* ShutdownReason.RELOAD */:
                    startupKind = 3 /* StartupKind.ReloadedWindow */;
                    break;
                case 4 /* ShutdownReason.LOAD */:
                    startupKind = 4 /* StartupKind.ReopenedWindow */;
                    break;
                default:
                    startupKind = 1 /* StartupKind.NewWindow */;
            }
            this.logService.trace(`[lifecycle] starting up (startup kind: ${startupKind})`);
            return startupKind;
        }
        set phase(value) {
            if (value < this.phase) {
                throw new Error('Lifecycle cannot go backwards');
            }
            if (this._phase === value) {
                return;
            }
            this.logService.trace(`lifecycle: phase changed (value: ${value})`);
            this._phase = value;
            (0, performance_1.mark)(`code/LifecyclePhase/${(0, lifecycle_2.LifecyclePhaseToString)(value)}`);
            const barrier = this.phaseWhen.get(this._phase);
            if (barrier) {
                barrier.open();
                this.phaseWhen.delete(this._phase);
            }
        }
        async when(phase) {
            if (phase <= this._phase) {
                return;
            }
            let barrier = this.phaseWhen.get(phase);
            if (!barrier) {
                barrier = new async_1.Barrier();
                this.phaseWhen.set(phase, barrier);
            }
            await barrier.wait();
        }
    };
    AbstractLifecycleService.LAST_SHUTDOWN_REASON_KEY = 'lifecyle.lastShutdownReason';
    AbstractLifecycleService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, storage_1.IStorageService)
    ], AbstractLifecycleService);
    exports.AbstractLifecycleService = AbstractLifecycleService;
});
//# sourceMappingURL=lifecycleService.js.map