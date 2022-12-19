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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/snippetsSync", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, arrays_1, async_1, errorMessage_1, event_1, lifecycle_1, resources_1, types_1, uuid_1, configuration_1, extensionManagement_1, instantiation_1, storage_1, telemetry_1, extensionsSync_1, globalStateSync_1, keybindingsSync_1, settingsSync_1, snippetsSync_1, tasksSync_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncService = void 0;
    const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';
    let UserDataSyncService = class UserDataSyncService extends lifecycle_1.Disposable {
        constructor(userDataSyncStoreService, userDataSyncStoreManagementService, instantiationService, configurationService, logService, telemetryService, storageService, userDataSyncEnablementService) {
            super();
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this._status = "uninitialized" /* SyncStatus.Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._syncErrors = [];
            this._onSyncErrors = this._register(new event_1.Emitter());
            this.onSyncErrors = this._onSyncErrors.event;
            this._lastSyncTime = undefined;
            this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
            this._onDidResetLocal = this._register(new event_1.Emitter());
            this.onDidResetLocal = this._onDidResetLocal.event;
            this._onDidResetRemote = this._register(new event_1.Emitter());
            this.onDidResetRemote = this._onDidResetRemote.event;
            this.synchronizers = this._register(new lifecycle_1.MutableDisposable());
            this.updateStatus([]);
            this._lastSyncTime = this.storageService.getNumber(LAST_SYNC_TIME_KEY, 0 /* StorageScope.GLOBAL */, undefined);
        }
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        get lastSyncTime() { return this._lastSyncTime; }
        async createSyncTask(manifest, disableCache) {
            this.checkEnablement();
            const executionId = (0, uuid_1.generateUuid)();
            try {
                const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
                if (disableCache) {
                    syncHeaders['Cache-Control'] = 'no-cache';
                }
                manifest = await this.userDataSyncStoreService.manifest(manifest, syncHeaders);
            }
            catch (error) {
                const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                this.reportUserDataSyncError(userDataSyncError, executionId);
                throw userDataSyncError;
            }
            let executed = false;
            const that = this;
            const synchronizers = this.getEnabledSynchronizers();
            let cancellablePromise;
            return {
                manifest,
                async run() {
                    if (executed) {
                        throw new Error('Can run a task only once');
                    }
                    cancellablePromise = (0, async_1.createCancelablePromise)(token => that.sync(synchronizers, manifest, executionId, token));
                    return cancellablePromise.finally(() => cancellablePromise = undefined);
                },
                async stop() {
                    if (cancellablePromise) {
                        cancellablePromise.cancel();
                    }
                    if (that.status !== "idle" /* SyncStatus.Idle */) {
                        return that.stop(synchronizers);
                    }
                }
            };
        }
        async createManualSyncTask() {
            this.checkEnablement();
            if (this.userDataSyncEnablementService.isEnabled()) {
                throw new userDataSync_1.UserDataSyncError('Cannot start manual sync when sync is enabled', "LocalError" /* UserDataSyncErrorCode.LocalError */);
            }
            const executionId = (0, uuid_1.generateUuid)();
            const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
            let manifest;
            try {
                manifest = await this.userDataSyncStoreService.manifest(null, syncHeaders);
            }
            catch (error) {
                const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                this.reportUserDataSyncError(userDataSyncError, executionId);
                throw userDataSyncError;
            }
            /* Manual sync shall start on clean local state */
            await this.resetLocal();
            const enabledSynchronizers = this.getEnabledSynchronizers();
            const onstop = async () => {
                await this.stop(enabledSynchronizers);
                await this.resetLocal();
            };
            return new ManualSyncTask(executionId, manifest, syncHeaders, enabledSynchronizers, onstop, this.configurationService, this.logService);
        }
        async sync(synchronizers, manifest, executionId, token) {
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return;
            }
            if (!synchronizers.length) {
                return;
            }
            const startTime = new Date().getTime();
            this._syncErrors = [];
            try {
                this.logService.trace('Sync started.');
                if (this.status !== "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.setStatus("syncing" /* SyncStatus.Syncing */);
                }
                const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
                for (const synchroniser of synchronizers) {
                    // Return if cancellation is requested
                    if (token.isCancellationRequested) {
                        return;
                    }
                    // Return if resource is not enabled
                    if (!this.userDataSyncEnablementService.isResourceEnabled(synchroniser.resource)) {
                        return;
                    }
                    try {
                        await synchroniser.sync(manifest, syncHeaders);
                    }
                    catch (e) {
                        let bailout = false;
                        if (e instanceof userDataSync_1.UserDataSyncError) {
                            switch (e.code) {
                                case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                                    e = new userDataSync_1.UserDataSyncError(e.message, e.code, synchroniser.resource);
                                    bailout = true;
                                    break;
                                case "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */:
                                case "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */:
                                case "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */:
                                case "Gone" /* UserDataSyncErrorCode.Gone */:
                                case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */:
                                case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                                case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                                    bailout = true;
                                    break;
                            }
                        }
                        const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(e);
                        this.reportUserDataSyncError(userDataSyncError, executionId);
                        if (bailout) {
                            throw userDataSyncError;
                        }
                        // Log and and continue
                        this.logService.error(e);
                        this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                        this._syncErrors.push([synchroniser.resource, userDataSyncError]);
                    }
                }
                this.logService.info(`Sync done. Took ${new Date().getTime() - startTime}ms`);
                this.updateLastSyncTime();
            }
            catch (error) {
                const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                this.reportUserDataSyncError(userDataSyncError, executionId);
                throw userDataSyncError;
            }
            finally {
                this.updateStatus(synchronizers);
                this._onSyncErrors.fire(this._syncErrors);
            }
        }
        async stop(synchronizers) {
            if (this.status === "idle" /* SyncStatus.Idle */) {
                return;
            }
            for (const synchroniser of synchronizers) {
                try {
                    if (synchroniser.status !== "idle" /* SyncStatus.Idle */) {
                        await synchroniser.stop();
                    }
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
        }
        async replace(uri) {
            this.checkEnablement();
            await this.performSynchronizerAction(async (synchronizer) => {
                if (await synchronizer.replace(uri)) {
                    return true;
                }
                return undefined;
            });
        }
        async accept(syncResource, resource, content, apply) {
            this.checkEnablement();
            await this.performSynchronizerAction(async (synchronizer) => {
                if (synchronizer.resource === syncResource) {
                    await synchronizer.accept(resource, content);
                    if (apply) {
                        await synchronizer.apply(false, (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)()));
                    }
                    return true;
                }
                return undefined;
            });
        }
        async resolveContent(resource) {
            return this.performSynchronizerAction(async (synchronizer) => {
                const content = await synchronizer.resolveContent(resource);
                if (content) {
                    return content;
                }
                return undefined;
            });
        }
        async getRemoteSyncResourceHandles(resource) {
            const result = await this.performSynchronizerAction(async (synchronizer) => {
                if (synchronizer.resource === resource) {
                    return synchronizer.getRemoteSyncResourceHandles();
                }
                return undefined;
            });
            return result || [];
        }
        async getLocalSyncResourceHandles(resource) {
            const result = await this.performSynchronizerAction(async (synchronizer) => {
                if (synchronizer.resource === resource) {
                    return synchronizer.getLocalSyncResourceHandles();
                }
                return undefined;
            });
            return result || [];
        }
        async getAssociatedResources(resource, syncResourceHandle) {
            const result = await this.performSynchronizerAction(async (synchronizer) => {
                if (synchronizer.resource === resource) {
                    return synchronizer.getAssociatedResources(syncResourceHandle);
                }
                return undefined;
            });
            return result || [];
        }
        async getMachineId(resource, syncResourceHandle) {
            const result = await this.performSynchronizerAction(async (synchronizer) => {
                if (synchronizer.resource === resource) {
                    const result = await synchronizer.getMachineId(syncResourceHandle);
                    return result || null;
                }
                return undefined;
            });
            return result || undefined;
        }
        async hasLocalData() {
            const result = await this.performSynchronizerAction(async (synchronizer) => {
                // skip global state synchronizer
                if (synchronizer.resource !== "globalState" /* SyncResource.GlobalState */ && await synchronizer.hasLocalData()) {
                    return true;
                }
                return undefined;
            });
            return !!result;
        }
        async hasPreviouslySynced() {
            const result = await this.performSynchronizerAction(async (synchronizer) => {
                if (await synchronizer.hasPreviouslySynced()) {
                    return true;
                }
                return undefined;
            });
            return !!result;
        }
        async reset() {
            this.checkEnablement();
            await this.resetRemote();
            await this.resetLocal();
        }
        async resetRemote() {
            this.checkEnablement();
            try {
                await this.userDataSyncStoreService.clear();
                this.logService.info('Cleared data on server');
            }
            catch (e) {
                this.logService.error(e);
            }
            this._onDidResetRemote.fire();
        }
        async resetLocal() {
            this.checkEnablement();
            this.storageService.remove(LAST_SYNC_TIME_KEY, 0 /* StorageScope.GLOBAL */);
            if (this.synchronizers.value) {
                for (const synchroniser of this.synchronizers.value.enabled) {
                    try {
                        await synchroniser.resetLocal();
                    }
                    catch (e) {
                        this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                        this.logService.error(e);
                    }
                }
                this.synchronizers.value = undefined;
            }
            this._onDidResetLocal.fire();
            this.logService.info('Did reset the local sync state.');
        }
        async performSynchronizerAction(action) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const synchronizers = this.synchronizers.value || disposables.add(this.instantiationService.createInstance(Synchronizers, () => { }, () => { }, () => { }));
                const allSynchronizers = [...synchronizers.enabled, ...synchronizers.disabled.map(syncResource => disposables.add(synchronizers.createSynchronizer(syncResource)))];
                for (const synchronizer of allSynchronizers) {
                    const result = await action(synchronizer);
                    if (!(0, types_1.isUndefined)(result)) {
                        return result;
                    }
                }
                return null;
            }
            finally {
                disposables.dispose();
            }
        }
        setStatus(status) {
            const oldStatus = this._status;
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
                if (oldStatus === "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.updateLastSyncTime();
                }
            }
        }
        updateStatus(synchronizers) {
            this.updateConflicts(synchronizers);
            const status = this.computeStatus(synchronizers);
            this.setStatus(status);
        }
        updateConflicts(synchronizers) {
            const conflicts = this.computeConflicts(synchronizers);
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, ([syncResourceA, conflictsA], [syncResourceB, conflictsB]) => syncResourceA === syncResourceA && (0, arrays_1.equals)(conflictsA, conflictsB, (a, b) => (0, resources_1.isEqual)(a.previewResource, b.previewResource)))) {
                this._conflicts = this.computeConflicts(synchronizers);
                this._onDidChangeConflicts.fire(conflicts);
            }
        }
        computeConflicts(synchronizers) {
            return synchronizers.filter(s => s.status === "hasConflicts" /* SyncStatus.HasConflicts */)
                .map(s => ([s.resource, s.conflicts.map(toStrictResourcePreview)]));
        }
        computeStatus(synchronizers) {
            if (!this.userDataSyncStoreManagementService.userDataSyncStore) {
                return "uninitialized" /* SyncStatus.Uninitialized */;
            }
            if (synchronizers.some(s => s.status === "hasConflicts" /* SyncStatus.HasConflicts */)) {
                return "hasConflicts" /* SyncStatus.HasConflicts */;
            }
            if (synchronizers.some(s => s.status === "syncing" /* SyncStatus.Syncing */)) {
                return "syncing" /* SyncStatus.Syncing */;
            }
            return "idle" /* SyncStatus.Idle */;
        }
        updateLastSyncTime() {
            if (this.status === "idle" /* SyncStatus.Idle */) {
                this._lastSyncTime = new Date().getTime();
                this.storageService.store(LAST_SYNC_TIME_KEY, this._lastSyncTime, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                this._onDidChangeLastSyncTime.fire(this._lastSyncTime);
            }
        }
        reportUserDataSyncError(userDataSyncError, executionId) {
            this.telemetryService.publicLog2('sync/error', {
                code: userDataSyncError.code,
                serverCode: userDataSyncError instanceof userDataSync_1.UserDataSyncStoreError ? String(userDataSyncError.serverCode) : undefined,
                url: userDataSyncError instanceof userDataSync_1.UserDataSyncStoreError ? userDataSyncError.url : undefined,
                resource: userDataSyncError.resource,
                executionId,
                service: this.userDataSyncStoreManagementService.userDataSyncStore.url.toString()
            });
        }
        getEnabledSynchronizers() {
            if (!this.synchronizers.value) {
                this.synchronizers.value = this.instantiationService.createInstance(Synchronizers, synchronizers => this.updateStatus(synchronizers), synchronizers => this.updateConflicts(synchronizers), syncResource => this._onDidChangeLocal.fire(syncResource));
            }
            return this.synchronizers.value.enabled;
        }
        checkEnablement() {
            if (!this.userDataSyncStoreManagementService.userDataSyncStore) {
                throw new Error('Not enabled');
            }
        }
    };
    UserDataSyncService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService)
    ], UserDataSyncService);
    exports.UserDataSyncService = UserDataSyncService;
    class ManualSyncTask extends lifecycle_1.Disposable {
        constructor(id, manifest, syncHeaders, synchronisers, onStop, configurationService, logService) {
            super();
            this.id = id;
            this.manifest = manifest;
            this.syncHeaders = syncHeaders;
            this.synchronisers = synchronisers;
            this.onStop = onStop;
            this.configurationService = configurationService;
            this.logService = logService;
            this.synchronizingResources = [];
            this._onSynchronizeResources = this._register(new event_1.Emitter());
            this.onSynchronizeResources = this._onSynchronizeResources.event;
            this.isDisposed = false;
        }
        get status() {
            if (this.synchronisers.some(s => s.status === "hasConflicts" /* SyncStatus.HasConflicts */)) {
                return "hasConflicts" /* SyncStatus.HasConflicts */;
            }
            if (this.synchronisers.some(s => s.status === "syncing" /* SyncStatus.Syncing */)) {
                return "syncing" /* SyncStatus.Syncing */;
            }
            return "idle" /* SyncStatus.Idle */;
        }
        async preview() {
            try {
                if (this.isDisposed) {
                    throw new Error('Disposed');
                }
                if (!this.previewsPromise) {
                    this.previewsPromise = (0, async_1.createCancelablePromise)(token => this.getPreviews(token));
                }
                if (!this.previews) {
                    this.previews = await this.previewsPromise;
                }
                return this.previews;
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async accept(resource, content) {
            try {
                return await this.performAction(resource, sychronizer => sychronizer.accept(resource, content));
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async merge(resource) {
            try {
                if (resource) {
                    return await this.performAction(resource, sychronizer => sychronizer.merge(resource));
                }
                else {
                    return await this.mergeAll();
                }
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async discard(resource) {
            try {
                return await this.performAction(resource, sychronizer => sychronizer.discard(resource));
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async discardConflicts() {
            try {
                if (!this.previews) {
                    throw new Error('Missing preview. Create preview and try again.');
                }
                if (this.synchronizingResources.length) {
                    throw new Error('Cannot discard while synchronizing resources');
                }
                const conflictResources = [];
                for (const [, syncResourcePreview] of this.previews) {
                    for (const resourcePreview of syncResourcePreview.resourcePreviews) {
                        if (resourcePreview.mergeState === "conflict" /* MergeState.Conflict */) {
                            conflictResources.push(resourcePreview.previewResource);
                        }
                    }
                }
                for (const resource of conflictResources) {
                    await this.discard(resource);
                }
                return this.previews;
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async apply() {
            try {
                if (!this.previews) {
                    throw new Error('You need to create preview before applying');
                }
                if (this.synchronizingResources.length) {
                    throw new Error('Cannot pull while synchronizing resources');
                }
                const previews = [];
                for (const [syncResource, preview] of this.previews) {
                    this.synchronizingResources.push([syncResource, preview.resourcePreviews.map(r => r.localResource)]);
                    this._onSynchronizeResources.fire(this.synchronizingResources);
                    const synchroniser = this.synchronisers.find(s => s.resource === syncResource);
                    /* merge those which are not yet merged */
                    for (const resourcePreview of preview.resourcePreviews) {
                        if ((resourcePreview.localChange !== 0 /* Change.None */ || resourcePreview.remoteChange !== 0 /* Change.None */) && resourcePreview.mergeState === "preview" /* MergeState.Preview */) {
                            await synchroniser.merge(resourcePreview.previewResource);
                        }
                    }
                    /* apply */
                    const newPreview = await synchroniser.apply(false, this.syncHeaders);
                    if (newPreview) {
                        previews.push(this.toSyncResourcePreview(synchroniser.resource, newPreview));
                    }
                    this.synchronizingResources.splice(this.synchronizingResources.findIndex(s => s[0] === syncResource), 1);
                    this._onSynchronizeResources.fire(this.synchronizingResources);
                }
                this.previews = previews;
                return this.previews;
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async pull() {
            try {
                if (!this.previews) {
                    throw new Error('You need to create preview before applying');
                }
                if (this.synchronizingResources.length) {
                    throw new Error('Cannot pull while synchronizing resources');
                }
                for (const [syncResource, preview] of this.previews) {
                    this.synchronizingResources.push([syncResource, preview.resourcePreviews.map(r => r.localResource)]);
                    this._onSynchronizeResources.fire(this.synchronizingResources);
                    const synchroniser = this.synchronisers.find(s => s.resource === syncResource);
                    for (const resourcePreview of preview.resourcePreviews) {
                        await synchroniser.accept(resourcePreview.remoteResource);
                    }
                    await synchroniser.apply(true, this.syncHeaders);
                    this.synchronizingResources.splice(this.synchronizingResources.findIndex(s => s[0] === syncResource), 1);
                    this._onSynchronizeResources.fire(this.synchronizingResources);
                }
                this.previews = [];
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async push() {
            try {
                if (!this.previews) {
                    throw new Error('You need to create preview before applying');
                }
                if (this.synchronizingResources.length) {
                    throw new Error('Cannot pull while synchronizing resources');
                }
                for (const [syncResource, preview] of this.previews) {
                    this.synchronizingResources.push([syncResource, preview.resourcePreviews.map(r => r.localResource)]);
                    this._onSynchronizeResources.fire(this.synchronizingResources);
                    const synchroniser = this.synchronisers.find(s => s.resource === syncResource);
                    for (const resourcePreview of preview.resourcePreviews) {
                        await synchroniser.accept(resourcePreview.localResource);
                    }
                    await synchroniser.apply(true, this.syncHeaders);
                    this.synchronizingResources.splice(this.synchronizingResources.findIndex(s => s[0] === syncResource), 1);
                    this._onSynchronizeResources.fire(this.synchronizingResources);
                }
                this.previews = [];
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async stop() {
            await this.onStop();
            this.reset();
        }
        async performAction(resource, action) {
            if (!this.previews) {
                throw new Error('Missing preview. Create preview and try again.');
            }
            const index = this.previews.findIndex(([, preview]) => preview.resourcePreviews.some(({ localResource, previewResource, remoteResource }) => (0, resources_1.isEqual)(resource, localResource) || (0, resources_1.isEqual)(resource, previewResource) || (0, resources_1.isEqual)(resource, remoteResource)));
            if (index === -1) {
                return this.previews;
            }
            const [syncResource, previews] = this.previews[index];
            const resourcePreview = previews.resourcePreviews.find(({ localResource, remoteResource, previewResource }) => (0, resources_1.isEqual)(localResource, resource) || (0, resources_1.isEqual)(remoteResource, resource) || (0, resources_1.isEqual)(previewResource, resource));
            if (!resourcePreview) {
                return this.previews;
            }
            let synchronizingResources = this.synchronizingResources.find(s => s[0] === syncResource);
            if (!synchronizingResources) {
                synchronizingResources = [syncResource, []];
                this.synchronizingResources.push(synchronizingResources);
            }
            if (!synchronizingResources[1].some(s => (0, resources_1.isEqual)(s, resourcePreview.localResource))) {
                synchronizingResources[1].push(resourcePreview.localResource);
                this._onSynchronizeResources.fire(this.synchronizingResources);
            }
            const synchroniser = this.synchronisers.find(s => s.resource === this.previews[index][0]);
            const preview = await action(synchroniser);
            preview ? this.previews.splice(index, 1, this.toSyncResourcePreview(synchroniser.resource, preview)) : this.previews.splice(index, 1);
            const i = this.synchronizingResources.findIndex(s => s[0] === syncResource);
            this.synchronizingResources[i][1].splice(synchronizingResources[1].findIndex(r => (0, resources_1.isEqual)(r, resourcePreview.localResource)), 1);
            if (!synchronizingResources[1].length) {
                this.synchronizingResources.splice(i, 1);
                this._onSynchronizeResources.fire(this.synchronizingResources);
            }
            return this.previews;
        }
        async mergeAll() {
            if (!this.previews) {
                throw new Error('You need to create preview before merging or applying');
            }
            if (this.synchronizingResources.length) {
                throw new Error('Cannot merge or apply while synchronizing resources');
            }
            const previews = [];
            for (const [syncResource, preview] of this.previews) {
                this.synchronizingResources.push([syncResource, preview.resourcePreviews.map(r => r.localResource)]);
                this._onSynchronizeResources.fire(this.synchronizingResources);
                const synchroniser = this.synchronisers.find(s => s.resource === syncResource);
                /* merge those which are not yet merged */
                let newPreview = preview;
                for (const resourcePreview of preview.resourcePreviews) {
                    if ((resourcePreview.localChange !== 0 /* Change.None */ || resourcePreview.remoteChange !== 0 /* Change.None */) && resourcePreview.mergeState === "preview" /* MergeState.Preview */) {
                        newPreview = await synchroniser.merge(resourcePreview.previewResource);
                    }
                }
                if (newPreview) {
                    previews.push(this.toSyncResourcePreview(synchroniser.resource, newPreview));
                }
                this.synchronizingResources.splice(this.synchronizingResources.findIndex(s => s[0] === syncResource), 1);
                this._onSynchronizeResources.fire(this.synchronizingResources);
            }
            this.previews = previews;
            return this.previews;
        }
        async getPreviews(token) {
            const result = [];
            const remoteUserDataSyncConfiguration = await this.getUserDataSyncConfiguration();
            for (const synchroniser of this.synchronisers) {
                if (token.isCancellationRequested) {
                    return [];
                }
                const preview = await synchroniser.preview(this.manifest, remoteUserDataSyncConfiguration, this.syncHeaders);
                if (preview) {
                    result.push(this.toSyncResourcePreview(synchroniser.resource, preview));
                }
            }
            return result;
        }
        async getUserDataSyncConfiguration() {
            const local = this.configurationService.getValue(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE);
            const settingsSynchronizer = this.synchronisers.find(synchronizer => synchronizer instanceof settingsSync_1.SettingsSynchroniser);
            if (settingsSynchronizer) {
                const remote = await settingsSynchronizer.getRemoteUserDataSyncConfiguration(this.manifest);
                return Object.assign(Object.assign({}, local), remote);
            }
            return local;
        }
        toSyncResourcePreview(syncResource, preview) {
            return [
                syncResource,
                {
                    isLastSyncFromCurrentMachine: preview.isLastSyncFromCurrentMachine,
                    resourcePreviews: preview.resourcePreviews.map(toStrictResourcePreview)
                }
            ];
        }
        reset() {
            if (this.previewsPromise) {
                this.previewsPromise.cancel();
                this.previewsPromise = undefined;
            }
            this.previews = undefined;
            this.synchronizingResources = [];
        }
        dispose() {
            this.reset();
            this.isDisposed = true;
        }
    }
    let Synchronizers = class Synchronizers extends lifecycle_1.Disposable {
        constructor(onDidChangeStatus, onDidChangeConflicts, onDidChangeLocal, userDataSyncEnablementService, instantiationService, extensionGalleryService, logService) {
            super();
            this.onDidChangeStatus = onDidChangeStatus;
            this.onDidChangeConflicts = onDidChangeConflicts;
            this.onDidChangeLocal = onDidChangeLocal;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.instantiationService = instantiationService;
            this.extensionGalleryService = extensionGalleryService;
            this.logService = logService;
            this._enabled = [];
            this._register(userDataSyncEnablementService.onDidChangeResourceEnablement(([syncResource, enablement]) => this.onDidChangeResourceEnablement(syncResource, enablement)));
            this._register((0, lifecycle_1.toDisposable)(() => this._enabled.splice(0, this._enabled.length).forEach(([, , disposable]) => disposable.dispose())));
            for (const syncResource of userDataSync_1.ALL_SYNC_RESOURCES) {
                if (userDataSyncEnablementService.isResourceEnabled(syncResource)) {
                    this.registerSynchronizer(syncResource);
                }
            }
        }
        get enabled() { return this._enabled.sort((a, b) => a[1] - b[1]).map(([synchronizer]) => synchronizer); }
        get disabled() { return userDataSync_1.ALL_SYNC_RESOURCES.filter(syncResource => !this.userDataSyncEnablementService.isResourceEnabled(syncResource)); }
        onDidChangeResourceEnablement(syncResource, enabled) {
            if (enabled) {
                this.registerSynchronizer(syncResource);
            }
            else {
                this.deRegisterSynchronizer(syncResource);
            }
        }
        registerSynchronizer(syncResource) {
            if (this._enabled.some(([synchronizer]) => synchronizer.resource === syncResource)) {
                return;
            }
            if (syncResource === "extensions" /* SyncResource.Extensions */ && !this.extensionGalleryService.isEnabled()) {
                this.logService.info('Skipping extensions sync because gallery is not configured');
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const synchronizer = disposables.add(this.createSynchronizer(syncResource));
            disposables.add(synchronizer.onDidChangeStatus(() => this.onDidChangeStatus(this.enabled)));
            disposables.add(synchronizer.onDidChangeConflicts(() => this.onDidChangeConflicts(this.enabled)));
            disposables.add(synchronizer.onDidChangeLocal(() => this.onDidChangeLocal(syncResource)));
            const order = this.getOrder(syncResource);
            this._enabled.push([synchronizer, order, disposables]);
        }
        deRegisterSynchronizer(syncResource) {
            const index = this._enabled.findIndex(([synchronizer]) => synchronizer.resource === syncResource);
            if (index !== -1) {
                const removed = this._enabled.splice(index, 1);
                for (const [synchronizer, , disposable] of removed) {
                    if (synchronizer.status !== "idle" /* SyncStatus.Idle */) {
                        const hasConflicts = synchronizer.conflicts.length > 0;
                        synchronizer.stop();
                        if (hasConflicts) {
                            this.onDidChangeConflicts(this.enabled);
                        }
                        this.onDidChangeStatus(this.enabled);
                    }
                    disposable.dispose();
                }
            }
        }
        createSynchronizer(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return this.instantiationService.createInstance(settingsSync_1.SettingsSynchroniser);
                case "keybindings" /* SyncResource.Keybindings */: return this.instantiationService.createInstance(keybindingsSync_1.KeybindingsSynchroniser);
                case "snippets" /* SyncResource.Snippets */: return this.instantiationService.createInstance(snippetsSync_1.SnippetsSynchroniser);
                case "tasks" /* SyncResource.Tasks */: return this.instantiationService.createInstance(tasksSync_1.TasksSynchroniser);
                case "globalState" /* SyncResource.GlobalState */: return this.instantiationService.createInstance(globalStateSync_1.GlobalStateSynchroniser);
                case "extensions" /* SyncResource.Extensions */: return this.instantiationService.createInstance(extensionsSync_1.ExtensionsSynchroniser);
            }
        }
        getOrder(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return 0;
                case "keybindings" /* SyncResource.Keybindings */: return 1;
                case "snippets" /* SyncResource.Snippets */: return 2;
                case "tasks" /* SyncResource.Tasks */: return 3;
                case "globalState" /* SyncResource.GlobalState */: return 4;
                case "extensions" /* SyncResource.Extensions */: return 5;
            }
        }
    };
    Synchronizers = __decorate([
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, userDataSync_1.IUserDataSyncLogService)
    ], Synchronizers);
    function toStrictResourcePreview(resourcePreview) {
        return {
            localResource: resourcePreview.localResource,
            previewResource: resourcePreview.previewResource,
            remoteResource: resourcePreview.remoteResource,
            acceptedResource: resourcePreview.acceptedResource,
            localChange: resourcePreview.localChange,
            remoteChange: resourcePreview.remoteChange,
            mergeState: resourcePreview.mergeState,
        };
    }
});
//# sourceMappingURL=userDataSyncService.js.map