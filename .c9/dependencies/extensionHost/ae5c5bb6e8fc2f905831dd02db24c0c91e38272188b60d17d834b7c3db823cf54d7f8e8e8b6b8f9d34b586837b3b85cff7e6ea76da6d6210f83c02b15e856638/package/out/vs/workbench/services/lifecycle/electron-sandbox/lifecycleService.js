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
define(["require", "exports", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycleService", "vs/platform/instantiation/common/extensions", "vs/platform/native/electron-sandbox/native", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/cancellation"], function (require, exports, lifecycle_1, lifecycle_2, storage_1, globals_1, log_1, lifecycleService_1, extensions_1, native_1, async_1, errorMessage_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLifecycleService = void 0;
    let NativeLifecycleService = class NativeLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(nativeHostService, storageService, logService) {
            super(logService, storageService);
            this.nativeHostService = nativeHostService;
            this.registerListeners();
        }
        registerListeners() {
            const windowId = this.nativeHostService.windowId;
            // Main side indicates that window is about to unload, check for vetos
            globals_1.ipcRenderer.on('vscode:onBeforeUnload', async (event, reply) => {
                this.logService.trace(`[lifecycle] onBeforeUnload (reason: ${reply.reason})`);
                // trigger onBeforeShutdown events and veto collecting
                const veto = await this.handleBeforeShutdown(reply.reason);
                // veto: cancel unload
                if (veto) {
                    this.logService.trace('[lifecycle] onBeforeUnload prevented via veto');
                    // Indicate as event
                    this._onShutdownVeto.fire();
                    globals_1.ipcRenderer.send(reply.cancelChannel, windowId);
                }
                // no veto: allow unload
                else {
                    this.logService.trace('[lifecycle] onBeforeUnload continues without veto');
                    this.shutdownReason = reply.reason;
                    globals_1.ipcRenderer.send(reply.okChannel, windowId);
                }
            });
            // Main side indicates that we will indeed shutdown
            globals_1.ipcRenderer.on('vscode:onWillUnload', async (event, reply) => {
                this.logService.trace(`[lifecycle] onWillUnload (reason: ${reply.reason})`);
                // trigger onWillShutdown events and joining
                await this.handleWillShutdown(reply.reason);
                // trigger onDidShutdown event now that we know we will quit
                this._onDidShutdown.fire();
                // acknowledge to main side
                globals_1.ipcRenderer.send(reply.replyChannel, windowId);
            });
        }
        async handleBeforeShutdown(reason) {
            const logService = this.logService;
            const vetos = [];
            const pendingVetos = new Set();
            let finalVeto = undefined;
            let finalVetoId = undefined;
            // before-shutdown event with veto support
            this._onBeforeShutdown.fire({
                reason,
                veto(value, id) {
                    vetos.push(value);
                    // Log any veto instantly
                    if (value === true) {
                        logService.info(`[lifecycle]: Shutdown was prevented (id: ${id})`);
                    }
                    // Track promise completion
                    else if (value instanceof Promise) {
                        pendingVetos.add(id);
                        value.then(veto => {
                            if (veto === true) {
                                logService.info(`[lifecycle]: Shutdown was prevented (id: ${id})`);
                            }
                        }).finally(() => pendingVetos.delete(id));
                    }
                },
                finalVeto(value, id) {
                    if (!finalVeto) {
                        finalVeto = value;
                        finalVetoId = id;
                    }
                    else {
                        throw new Error(`[lifecycle]: Final veto is already defined (id: ${id})`);
                    }
                }
            });
            const longRunningBeforeShutdownWarning = (0, async_1.disposableTimeout)(() => {
                logService.warn(`[lifecycle] onBeforeShutdown is taking a long time, pending operations: ${Array.from(pendingVetos).join(', ')}`);
            }, NativeLifecycleService.BEFORE_SHUTDOWN_WARNING_DELAY);
            try {
                // First: run list of vetos in parallel
                let veto = await (0, lifecycle_1.handleVetos)(vetos, error => this.handleBeforeShutdownError(error, reason));
                if (veto) {
                    return veto;
                }
                // Second: run the final veto if defined
                if (finalVeto) {
                    try {
                        pendingVetos.add(finalVetoId);
                        veto = await finalVeto();
                        if (veto) {
                            logService.info(`[lifecycle]: Shutdown was prevented by final veto (id: ${finalVetoId})`);
                        }
                    }
                    catch (error) {
                        veto = true; // treat error as veto
                        this.handleBeforeShutdownError(error, reason);
                    }
                }
                return veto;
            }
            finally {
                longRunningBeforeShutdownWarning.dispose();
            }
        }
        handleBeforeShutdownError(error, reason) {
            this.logService.error(`[lifecycle]: Error during before-shutdown phase (error: ${(0, errorMessage_1.toErrorMessage)(error)})`);
            this._onBeforeShutdownError.fire({ reason, error });
        }
        async handleWillShutdown(reason) {
            const joiners = [];
            const pendingJoiners = new Set();
            const cts = new cancellation_1.CancellationTokenSource();
            this._onWillShutdown.fire({
                reason,
                token: cts.token,
                joiners: () => Array.from(pendingJoiners.values()),
                join(promise, joiner) {
                    joiners.push(promise);
                    // Track promise completion
                    pendingJoiners.add(joiner);
                    promise.finally(() => pendingJoiners.delete(joiner));
                },
                force: () => {
                    cts.dispose(true);
                }
            });
            const longRunningWillShutdownWarning = (0, async_1.disposableTimeout)(() => {
                this.logService.warn(`[lifecycle] onWillShutdown is taking a long time, pending operations: ${Array.from(pendingJoiners).map(joiner => joiner.id).join(', ')}`);
            }, NativeLifecycleService.WILL_SHUTDOWN_WARNING_DELAY);
            try {
                await (0, async_1.raceCancellation)(async_1.Promises.settled(joiners), cts.token);
            }
            catch (error) {
                this.logService.error(`[lifecycle]: Error during will-shutdown phase (error: ${(0, errorMessage_1.toErrorMessage)(error)})`); // this error will not prevent the shutdown
            }
            finally {
                longRunningWillShutdownWarning.dispose();
            }
        }
        shutdown() {
            return this.nativeHostService.closeWindow();
        }
    };
    NativeLifecycleService.BEFORE_SHUTDOWN_WARNING_DELAY = 5000;
    NativeLifecycleService.WILL_SHUTDOWN_WARNING_DELAY = 800;
    NativeLifecycleService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, storage_1.IStorageService),
        __param(2, log_1.ILogService)
    ], NativeLifecycleService);
    exports.NativeLifecycleService = NativeLifecycleService;
    (0, extensions_1.registerSingleton)(lifecycle_2.ILifecycleService, NativeLifecycleService);
});
//# sourceMappingURL=lifecycleService.js.map