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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/async", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyHistoryService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/base/common/cancellation"], function (require, exports, nls_1, event_1, async_1, lifecycle_1, files_1, remoteAgentService_1, environmentService_1, uriIdentity_1, label_1, log_1, configuration_1, workingCopyHistoryService_1, extensions_1, workingCopyHistory_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkingCopyHistoryService = void 0;
    let NativeWorkingCopyHistoryService = class NativeWorkingCopyHistoryService extends workingCopyHistoryService_1.WorkingCopyHistoryService {
        constructor(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, lifecycleService, logService, configurationService) {
            super(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService);
            this.lifecycleService = lifecycleService;
            this.isRemotelyStored = typeof this.environmentService.remoteAuthority === 'string';
            this.storeAllCts = this._register(new cancellation_1.CancellationTokenSource());
            this.storeAllScheduler = this._register(new async_1.RunOnceScheduler(() => this.storeAll(this.storeAllCts.token), NativeWorkingCopyHistoryService.STORE_ALL_INTERVAL));
            this.registerListeners();
        }
        registerListeners() {
            if (!this.isRemotelyStored) {
                // Local: persist all on shutdown
                this.lifecycleService.onWillShutdown(e => this.onWillShutdown(e));
                // Local: schedule persist on change
                this._register(event_1.Event.any(this.onDidAddEntry, this.onDidChangeEntry, this.onDidReplaceEntry, this.onDidRemoveEntry)(() => this.onDidChangeModels()));
            }
        }
        getModelOptions() {
            return { flushOnChange: this.isRemotelyStored /* because the connection might drop anytime */ };
        }
        onWillShutdown(e) {
            // Dispose the scheduler...
            this.storeAllScheduler.dispose();
            this.storeAllCts.dispose(true);
            // ...because we now explicitly store all models
            e.join(this.storeAll(e.token), { id: 'join.workingCopyHistory', label: (0, nls_1.localize)('join.workingCopyHistory', "Saving local history") });
        }
        onDidChangeModels() {
            if (!this.storeAllScheduler.isScheduled()) {
                this.storeAllScheduler.schedule();
            }
        }
        async storeAll(token) {
            const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
            const promises = [];
            const models = Array.from(this.models.values());
            for (const model of models) {
                promises.push(limiter.queue(async () => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    try {
                        await model.store(token);
                    }
                    catch (error) {
                        this.logService.trace(error);
                    }
                }));
            }
            await Promise.all(promises);
        }
    };
    NativeWorkingCopyHistoryService.STORE_ALL_INTERVAL = 5 * 60 * 1000; // 5min
    NativeWorkingCopyHistoryService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, label_1.ILabelService),
        __param(5, lifecycle_1.ILifecycleService),
        __param(6, log_1.ILogService),
        __param(7, configuration_1.IConfigurationService)
    ], NativeWorkingCopyHistoryService);
    exports.NativeWorkingCopyHistoryService = NativeWorkingCopyHistoryService;
    // Register Service
    (0, extensions_1.registerSingleton)(workingCopyHistory_1.IWorkingCopyHistoryService, NativeWorkingCopyHistoryService, true);
});
//# sourceMappingURL=workingCopyHistoryService.js.map