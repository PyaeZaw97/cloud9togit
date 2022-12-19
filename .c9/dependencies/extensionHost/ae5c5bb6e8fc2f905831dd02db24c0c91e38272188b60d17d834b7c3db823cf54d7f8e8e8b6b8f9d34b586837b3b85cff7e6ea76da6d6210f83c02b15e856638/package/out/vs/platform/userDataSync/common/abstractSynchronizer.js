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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, arrays_1, async_1, buffer_1, cancellation_1, event_1, json_1, lifecycle_1, strings_1, types_1, uri_1, nls_1, configuration_1, environment_1, files_1, log_1, serviceMachineId_1, storage_1, telemetry_1, uriIdentity_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractInitializer = exports.AbstractJsonFileSynchroniser = exports.AbstractFileSynchroniser = exports.AbstractSynchroniser = exports.isSyncData = void 0;
    function isSyncData(thing) {
        if (thing
            && (thing.version !== undefined && typeof thing.version === 'number')
            && (thing.content !== undefined && typeof thing.content === 'string')) {
            // backward compatibility
            if (Object.keys(thing).length === 2) {
                return true;
            }
            if (Object.keys(thing).length === 3
                && (thing.machineId !== undefined && typeof thing.machineId === 'string')) {
                return true;
            }
        }
        return false;
    }
    exports.isSyncData = isSyncData;
    let AbstractSynchroniser = class AbstractSynchroniser extends lifecycle_1.Disposable {
        constructor(resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService) {
            super();
            this.resource = resource;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncBackupStoreService = userDataSyncBackupStoreService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.syncPreviewPromise = null;
            this._status = "idle" /* SyncStatus.Idle */;
            this._onDidChangStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangStatus.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this.localChangeTriggerThrottler = new async_1.ThrottledDelayer(50);
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this.hasSyncResourceStateVersionChanged = false;
            this.syncHeaders = {};
            this.syncResourceLogLabel = (0, strings_1.uppercaseFirstLetter)(this.resource);
            this.extUri = uriIdentityService.extUri;
            this.syncFolder = this.extUri.joinPath(environmentService.userDataSyncHome, resource);
            this.syncPreviewFolder = this.extUri.joinPath(this.syncFolder, userDataSync_1.PREVIEW_DIR_NAME);
            this.lastSyncResource = (0, userDataSync_1.getLastSyncResourceUri)(resource, environmentService, this.extUri);
            this.currentMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
        }
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        triggerLocalChange() {
            this.localChangeTriggerThrottler.trigger(() => this.doTriggerLocalChange());
        }
        async doTriggerLocalChange() {
            // Sync again if current status is in conflicts
            if (this.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                this.logService.info(`${this.syncResourceLogLabel}: In conflicts state and local change detected. Syncing again...`);
                const preview = await this.syncPreviewPromise;
                this.syncPreviewPromise = null;
                const status = await this.performSync(preview.remoteUserData, preview.lastSyncUserData, true, this.getUserDataSyncConfiguration());
                this.setStatus(status);
            }
            // Check if local change causes remote change
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Checking for local changes...`);
                const lastSyncUserData = await this.getLastSyncUserData();
                const hasRemoteChanged = lastSyncUserData ? await this.hasRemoteChanged(lastSyncUserData) : true;
                if (hasRemoteChanged) {
                    this._onDidChangeLocal.fire();
                }
            }
        }
        setStatus(status) {
            if (this._status !== status) {
                const oldStatus = this._status;
                if (status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                    // Log to telemetry when there is a sync conflict
                    this.telemetryService.publicLog2('sync/conflictsDetected', { source: this.resource });
                }
                if (oldStatus === "hasConflicts" /* SyncStatus.HasConflicts */ && status === "idle" /* SyncStatus.Idle */) {
                    // Log to telemetry when conflicts are resolved
                    this.telemetryService.publicLog2('sync/conflictsResolved', { source: this.resource });
                }
                this._status = status;
                this._onDidChangStatus.fire(status);
            }
        }
        async sync(manifest, headers = {}) {
            await this._sync(manifest, true, this.getUserDataSyncConfiguration(), headers);
        }
        async preview(manifest, userDataSyncConfiguration, headers = {}) {
            return this._sync(manifest, false, userDataSyncConfiguration, headers);
        }
        async apply(force, headers = {}) {
            try {
                this.syncHeaders = Object.assign({}, headers);
                const status = await this.doApply(force);
                this.setStatus(status);
                return this.syncPreviewPromise;
            }
            finally {
                this.syncHeaders = {};
            }
        }
        async _sync(manifest, apply, userDataSyncConfiguration, headers) {
            try {
                this.syncHeaders = Object.assign({}, headers);
                if (this.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as there are conflicts.`);
                    return this.syncPreviewPromise;
                }
                if (this.status === "syncing" /* SyncStatus.Syncing */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as it is running already.`);
                    return this.syncPreviewPromise;
                }
                this.logService.trace(`${this.syncResourceLogLabel}: Started synchronizing ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* SyncStatus.Syncing */);
                let status = "idle" /* SyncStatus.Idle */;
                try {
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getLatestRemoteUserData(manifest, lastSyncUserData);
                    status = await this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                    if (status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Detected conflicts while synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    else if (status === "idle" /* SyncStatus.Idle */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Finished synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    return this.syncPreviewPromise || null;
                }
                finally {
                    this.setStatus(status);
                }
            }
            finally {
                this.syncHeaders = {};
            }
        }
        async replace(uri) {
            const content = await this.resolveContent(uri);
            if (!content) {
                return false;
            }
            const syncData = this.parseSyncData(content);
            if (!syncData) {
                return false;
            }
            await this.stop();
            try {
                this.logService.trace(`${this.syncResourceLogLabel}: Started resetting ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* SyncStatus.Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getLatestRemoteUserData(null, lastSyncUserData);
                const isRemoteDataFromCurrentMachine = await this.isRemoteDataFromCurrentMachine(remoteUserData);
                /* use replace sync data */
                const resourcePreviewResults = await this.generateSyncPreview({ ref: remoteUserData.ref, syncData }, lastSyncUserData, isRemoteDataFromCurrentMachine, this.getUserDataSyncConfiguration(), cancellation_1.CancellationToken.None);
                const resourcePreviews = [];
                for (const resourcePreviewResult of resourcePreviewResults) {
                    /* Accept remote resource */
                    const acceptResult = await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.remoteResource, undefined, cancellation_1.CancellationToken.None);
                    /* compute remote change */
                    const { remoteChange } = await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.previewResource, resourcePreviewResult.remoteContent, cancellation_1.CancellationToken.None);
                    resourcePreviews.push([resourcePreviewResult, Object.assign(Object.assign({}, acceptResult), { remoteChange: remoteChange !== 0 /* Change.None */ ? remoteChange : 2 /* Change.Modified */ })]);
                }
                await this.applyResult(remoteUserData, lastSyncUserData, resourcePreviews, false);
                this.logService.info(`${this.syncResourceLogLabel}: Finished resetting ${this.resource.toLowerCase()}.`);
            }
            finally {
                this.setStatus("idle" /* SyncStatus.Idle */);
            }
            return true;
        }
        async isRemoteDataFromCurrentMachine(remoteUserData) {
            var _a;
            const machineId = await this.currentMachineIdPromise;
            return !!((_a = remoteUserData.syncData) === null || _a === void 0 ? void 0 : _a.machineId) && remoteUserData.syncData.machineId === machineId;
        }
        async getLatestRemoteUserData(manifest, lastSyncUserData) {
            if (lastSyncUserData) {
                const latestRef = manifest && manifest.latest ? manifest.latest[this.resource] : undefined;
                // Last time synced resource and latest resource on server are same
                if (lastSyncUserData.ref === latestRef) {
                    return lastSyncUserData;
                }
                // There is no resource on server and last time it was synced with no resource
                if (latestRef === undefined && lastSyncUserData.syncData === null) {
                    return lastSyncUserData;
                }
            }
            return this.getRemoteUserData(lastSyncUserData);
        }
        async performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration) {
            if (remoteUserData.syncData && remoteUserData.syncData.version > this.version) {
                // current version is not compatible with cloud version
                this.telemetryService.publicLog2('sync/incompatible', { source: this.resource });
                throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)({ key: 'incompatible', comment: ['This is an error while syncing a resource that its local version is not compatible with its remote version.'] }, "Cannot sync {0} as its local version {1} is not compatible with its remote version {2}", this.resource, this.version, remoteUserData.syncData.version), "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */, this.resource);
            }
            try {
                return await this.doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
            }
            catch (e) {
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "LocalPreconditionFailed" /* UserDataSyncErrorCode.LocalPreconditionFailed */:
                            // Rejected as there is a new local version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize ${this.syncResourceLogLabel} as there is a new local version available. Synchronizing again...`);
                            return this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                        case "Conflict" /* UserDataSyncErrorCode.Conflict */:
                        case "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */:
                            // Rejected as there is a new remote version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize as there is a new remote version available. Synchronizing again...`);
                            // Avoid cache and get latest remote user data - https://github.com/microsoft/vscode/issues/90624
                            remoteUserData = await this.getRemoteUserData(null);
                            // Get the latest last sync user data. Because multiples parallel syncs (in Web) could share same last sync data
                            // and one of them successfully updated remote and last sync state.
                            lastSyncUserData = await this.getLastSyncUserData();
                            return this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                    }
                }
                throw e;
            }
        }
        async doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration) {
            try {
                // generate or use existing preview
                if (!this.syncPreviewPromise) {
                    this.syncPreviewPromise = (0, async_1.createCancelablePromise)(token => this.doGenerateSyncResourcePreview(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration, token));
                }
                const preview = await this.syncPreviewPromise;
                this.updateConflicts(preview.resourcePreviews);
                if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                    return "hasConflicts" /* SyncStatus.HasConflicts */;
                }
                if (apply) {
                    return await this.doApply(false);
                }
                return "syncing" /* SyncStatus.Syncing */;
            }
            catch (error) {
                // reset preview on error
                this.syncPreviewPromise = null;
                throw error;
            }
        }
        async merge(resource) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const mergeResult = await this.getMergeResult(resourcePreview, cancellation_1.CancellationToken.None);
                await this.fileService.writeFile(resourcePreview.previewResource, buffer_1.VSBuffer.fromString((mergeResult === null || mergeResult === void 0 ? void 0 : mergeResult.content) || ''));
                const acceptResult = mergeResult && !mergeResult.hasConflicts
                    ? await this.getAcceptResult(resourcePreview, resourcePreview.previewResource, undefined, cancellation_1.CancellationToken.None)
                    : undefined;
                resourcePreview.acceptResult = acceptResult;
                resourcePreview.mergeState = mergeResult.hasConflicts ? "conflict" /* MergeState.Conflict */ : acceptResult ? "accepted" /* MergeState.Accepted */ : "preview" /* MergeState.Preview */;
                resourcePreview.localChange = acceptResult ? acceptResult.localChange : mergeResult.localChange;
                resourcePreview.remoteChange = acceptResult ? acceptResult.remoteChange : mergeResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async accept(resource, content) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const acceptResult = await this.getAcceptResult(resourcePreview, resource, content, cancellation_1.CancellationToken.None);
                resourcePreview.acceptResult = acceptResult;
                resourcePreview.mergeState = "accepted" /* MergeState.Accepted */;
                resourcePreview.localChange = acceptResult.localChange;
                resourcePreview.remoteChange = acceptResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async discard(resource) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const mergeResult = await this.getMergeResult(resourcePreview, cancellation_1.CancellationToken.None);
                await this.fileService.writeFile(resourcePreview.previewResource, buffer_1.VSBuffer.fromString(mergeResult.content || ''));
                resourcePreview.acceptResult = undefined;
                resourcePreview.mergeState = "preview" /* MergeState.Preview */;
                resourcePreview.localChange = mergeResult.localChange;
                resourcePreview.remoteChange = mergeResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async updateSyncResourcePreview(resource, updateResourcePreview) {
            if (!this.syncPreviewPromise) {
                return;
            }
            let preview = await this.syncPreviewPromise;
            const index = preview.resourcePreviews.findIndex(({ localResource, remoteResource, previewResource }) => this.extUri.isEqual(localResource, resource) || this.extUri.isEqual(remoteResource, resource) || this.extUri.isEqual(previewResource, resource));
            if (index === -1) {
                return;
            }
            this.syncPreviewPromise = (0, async_1.createCancelablePromise)(async (token) => {
                const resourcePreviews = [...preview.resourcePreviews];
                resourcePreviews[index] = await updateResourcePreview(resourcePreviews[index]);
                return Object.assign(Object.assign({}, preview), { resourcePreviews });
            });
            preview = await this.syncPreviewPromise;
            this.updateConflicts(preview.resourcePreviews);
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                this.setStatus("hasConflicts" /* SyncStatus.HasConflicts */);
            }
            else {
                this.setStatus("syncing" /* SyncStatus.Syncing */);
            }
        }
        async doApply(force) {
            if (!this.syncPreviewPromise) {
                return "idle" /* SyncStatus.Idle */;
            }
            const preview = await this.syncPreviewPromise;
            // check for conflicts
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                return "hasConflicts" /* SyncStatus.HasConflicts */;
            }
            // check if all are accepted
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState !== "accepted" /* MergeState.Accepted */)) {
                return "syncing" /* SyncStatus.Syncing */;
            }
            // apply preview
            await this.applyResult(preview.remoteUserData, preview.lastSyncUserData, preview.resourcePreviews.map(resourcePreview => ([resourcePreview, resourcePreview.acceptResult])), force);
            // reset preview
            this.syncPreviewPromise = null;
            // reset preview folder
            await this.clearPreviewFolder();
            return "idle" /* SyncStatus.Idle */;
        }
        async clearPreviewFolder() {
            try {
                await this.fileService.del(this.syncPreviewFolder, { recursive: true });
            }
            catch (error) { /* Ignore */ }
        }
        updateConflicts(resourcePreviews) {
            const conflicts = resourcePreviews.filter(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */);
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, (a, b) => this.extUri.isEqual(a.previewResource, b.previewResource))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(conflicts);
            }
        }
        async hasPreviouslySynced() {
            const lastSyncData = await this.getLastSyncUserData();
            return !!lastSyncData && lastSyncData.syncData !== null /* `null` sync data implies resource is not synced */;
        }
        async getRemoteSyncResourceHandles() {
            const handles = await this.userDataSyncStoreService.getAllRefs(this.resource);
            return handles.map(({ created, ref }) => ({ created, uri: this.toRemoteBackupResource(ref) }));
        }
        async getLocalSyncResourceHandles() {
            const handles = await this.userDataSyncBackupStoreService.getAllRefs(this.resource);
            return handles.map(({ created, ref }) => ({ created, uri: this.toLocalBackupResource(ref) }));
        }
        toRemoteBackupResource(ref) {
            return uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote-backup', path: `/${this.resource}/${ref}` });
        }
        toLocalBackupResource(ref) {
            return uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local-backup', path: `/${this.resource}/${ref}` });
        }
        async getMachineId({ uri }) {
            const ref = this.extUri.basename(uri);
            if (this.extUri.isEqual(uri, this.toRemoteBackupResource(ref))) {
                const { content } = await this.getUserData(ref);
                if (content) {
                    const syncData = this.parseSyncData(content);
                    return syncData === null || syncData === void 0 ? void 0 : syncData.machineId;
                }
            }
            return undefined;
        }
        async resolveContent(uri) {
            const ref = this.extUri.basename(uri);
            if (this.extUri.isEqual(uri, this.toRemoteBackupResource(ref))) {
                const { content } = await this.getUserData(ref);
                return content;
            }
            if (this.extUri.isEqual(uri, this.toLocalBackupResource(ref))) {
                return this.userDataSyncBackupStoreService.resolveContent(this.resource, ref);
            }
            return null;
        }
        async resolvePreviewContent(uri) {
            const syncPreview = this.syncPreviewPromise ? await this.syncPreviewPromise : null;
            if (syncPreview) {
                for (const resourcePreview of syncPreview.resourcePreviews) {
                    if (this.extUri.isEqual(resourcePreview.acceptedResource, uri)) {
                        return resourcePreview.acceptResult ? resourcePreview.acceptResult.content : null;
                    }
                    if (this.extUri.isEqual(resourcePreview.remoteResource, uri)) {
                        return resourcePreview.remoteContent;
                    }
                    if (this.extUri.isEqual(resourcePreview.localResource, uri)) {
                        return resourcePreview.localContent;
                    }
                }
            }
            return null;
        }
        async resetLocal() {
            try {
                await this.fileService.del(this.lastSyncResource);
            }
            catch (e) { /* ignore */ }
        }
        async doGenerateSyncResourcePreview(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration, token) {
            const isRemoteDataFromCurrentMachine = await this.isRemoteDataFromCurrentMachine(remoteUserData);
            const resourcePreviewResults = await this.generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration, token);
            const resourcePreviews = [];
            for (const resourcePreviewResult of resourcePreviewResults) {
                const acceptedResource = resourcePreviewResult.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
                /* No change -> Accept */
                if (resourcePreviewResult.localChange === 0 /* Change.None */ && resourcePreviewResult.remoteChange === 0 /* Change.None */) {
                    resourcePreviews.push(Object.assign(Object.assign({}, resourcePreviewResult), { acceptedResource, acceptResult: { content: null, localChange: 0 /* Change.None */, remoteChange: 0 /* Change.None */ }, mergeState: "accepted" /* MergeState.Accepted */ }));
                }
                /* Changed -> Apply ? (Merge ? Conflict | Accept) : Preview */
                else {
                    /* Merge */
                    const mergeResult = apply ? await this.getMergeResult(resourcePreviewResult, token) : undefined;
                    if (token.isCancellationRequested) {
                        break;
                    }
                    await this.fileService.writeFile(resourcePreviewResult.previewResource, buffer_1.VSBuffer.fromString((mergeResult === null || mergeResult === void 0 ? void 0 : mergeResult.content) || ''));
                    /* Conflict | Accept */
                    const acceptResult = mergeResult && !mergeResult.hasConflicts
                        /* Accept if merged and there are no conflicts */
                        ? await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.previewResource, undefined, token)
                        : undefined;
                    resourcePreviews.push(Object.assign(Object.assign({}, resourcePreviewResult), { acceptResult, mergeState: (mergeResult === null || mergeResult === void 0 ? void 0 : mergeResult.hasConflicts) ? "conflict" /* MergeState.Conflict */ : acceptResult ? "accepted" /* MergeState.Accepted */ : "preview" /* MergeState.Preview */, localChange: acceptResult ? acceptResult.localChange : mergeResult ? mergeResult.localChange : resourcePreviewResult.localChange, remoteChange: acceptResult ? acceptResult.remoteChange : mergeResult ? mergeResult.remoteChange : resourcePreviewResult.remoteChange }));
                }
            }
            return { remoteUserData, lastSyncUserData, resourcePreviews, isLastSyncFromCurrentMachine: isRemoteDataFromCurrentMachine };
        }
        async getLastSyncUserData() {
            try {
                const content = await this.fileService.readFile(this.lastSyncResource);
                const parsed = JSON.parse(content.value.toString());
                const resourceSyncStateVersion = this.userDataSyncEnablementService.getResourceSyncStateVersion(this.resource);
                this.hasSyncResourceStateVersionChanged = parsed.version && resourceSyncStateVersion && parsed.version !== resourceSyncStateVersion;
                if (this.hasSyncResourceStateVersionChanged) {
                    this.logService.info(`${this.syncResourceLogLabel}: Reset last sync state because last sync state version ${parsed.version} is not compatible with current sync state version ${resourceSyncStateVersion}.`);
                    await this.resetLocal();
                    return null;
                }
                const userData = parsed;
                if (userData.content === null) {
                    return { ref: parsed.ref, syncData: null };
                }
                const syncData = JSON.parse(userData.content);
                /* Check if syncData is of expected type. Return only if matches */
                if (isSyncData(syncData)) {
                    return Object.assign(Object.assign({}, parsed), { syncData, content: undefined });
                }
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    // log error always except when file does not exist
                    this.logService.error(error);
                }
            }
            return null;
        }
        async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
            if (additionalProps['ref'] || additionalProps['content'] || additionalProps['version']) {
                throw new Error('Cannot have core properties as additional');
            }
            const version = this.userDataSyncEnablementService.getResourceSyncStateVersion(this.resource);
            const lastSyncUserData = Object.assign({ ref: lastSyncRemoteUserData.ref, content: lastSyncRemoteUserData.syncData ? JSON.stringify(lastSyncRemoteUserData.syncData) : null, version }, additionalProps);
            await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncUserData)));
        }
        async getRemoteUserData(lastSyncData) {
            const { ref, content } = await this.getUserData(lastSyncData);
            let syncData = null;
            if (content !== null) {
                syncData = this.parseSyncData(content);
            }
            return { ref, syncData };
        }
        parseSyncData(content) {
            try {
                const syncData = JSON.parse(content);
                if (isSyncData(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('incompatible sync data', "Cannot parse sync data as it is not compatible with the current version."), "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */, this.resource);
        }
        async getUserData(refOrLastSyncData) {
            if ((0, types_1.isString)(refOrLastSyncData)) {
                const content = await this.userDataSyncStoreService.resolveContent(this.resource, refOrLastSyncData);
                return { ref: refOrLastSyncData, content };
            }
            else {
                const lastSyncUserData = refOrLastSyncData ? { ref: refOrLastSyncData.ref, content: refOrLastSyncData.syncData ? JSON.stringify(refOrLastSyncData.syncData) : null } : null;
                return this.userDataSyncStoreService.read(this.resource, lastSyncUserData, this.syncHeaders);
            }
        }
        async updateRemoteUserData(content, ref) {
            const machineId = await this.currentMachineIdPromise;
            const syncData = { version: this.version, machineId, content };
            ref = await this.userDataSyncStoreService.write(this.resource, JSON.stringify(syncData), ref, this.syncHeaders);
            return { ref, syncData };
        }
        async backupLocal(content) {
            const syncData = { version: this.version, content };
            return this.userDataSyncBackupStoreService.backup(this.resource, JSON.stringify(syncData));
        }
        async stop() {
            if (this.status === "idle" /* SyncStatus.Idle */) {
                return;
            }
            this.logService.trace(`${this.syncResourceLogLabel}: Stopping synchronizing ${this.resource.toLowerCase()}.`);
            if (this.syncPreviewPromise) {
                this.syncPreviewPromise.cancel();
                this.syncPreviewPromise = null;
            }
            this.updateConflicts([]);
            await this.clearPreviewFolder();
            this.setStatus("idle" /* SyncStatus.Idle */);
            this.logService.info(`${this.syncResourceLogLabel}: Stopped synchronizing ${this.resource.toLowerCase()}.`);
        }
        getUserDataSyncConfiguration() {
            return this.configurationService.getValue(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE);
        }
    };
    AbstractSynchroniser = __decorate([
        __param(1, files_1.IFileService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, storage_1.IStorageService),
        __param(4, userDataSync_1.IUserDataSyncStoreService),
        __param(5, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(6, userDataSync_1.IUserDataSyncEnablementService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, userDataSync_1.IUserDataSyncLogService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, uriIdentity_1.IUriIdentityService)
    ], AbstractSynchroniser);
    exports.AbstractSynchroniser = AbstractSynchroniser;
    let AbstractFileSynchroniser = class AbstractFileSynchroniser extends AbstractSynchroniser {
        constructor(file, resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService) {
            super(resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.file = file;
            this._register(this.fileService.watch(this.extUri.dirname(file)));
            this._register(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
        }
        async getLocalFileContent() {
            try {
                return await this.fileService.readFile(this.file);
            }
            catch (error) {
                return null;
            }
        }
        async updateLocalFileContent(newContent, oldContent, force) {
            try {
                if (oldContent) {
                    // file exists already
                    await this.fileService.writeFile(this.file, buffer_1.VSBuffer.fromString(newContent), force ? undefined : oldContent);
                }
                else {
                    // file does not exist
                    await this.fileService.createFile(this.file, buffer_1.VSBuffer.fromString(newContent), { overwrite: force });
                }
            }
            catch (e) {
                if ((e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) ||
                    (e instanceof files_1.FileOperationError && e.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */)) {
                    throw new userDataSync_1.UserDataSyncError(e.message, "LocalPreconditionFailed" /* UserDataSyncErrorCode.LocalPreconditionFailed */);
                }
                else {
                    throw e;
                }
            }
        }
        onFileChanges(e) {
            if (!e.contains(this.file)) {
                return;
            }
            this.triggerLocalChange();
        }
    };
    AbstractFileSynchroniser = __decorate([
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSync_1.IUserDataSyncLogService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], AbstractFileSynchroniser);
    exports.AbstractFileSynchroniser = AbstractFileSynchroniser;
    let AbstractJsonFileSynchroniser = class AbstractJsonFileSynchroniser extends AbstractFileSynchroniser {
        constructor(file, resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService, uriIdentityService) {
            super(file, resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.userDataSyncUtilService = userDataSyncUtilService;
            this._formattingOptions = undefined;
        }
        hasErrors(content) {
            const parseErrors = [];
            (0, json_1.parse)(content, parseErrors, { allowEmptyContent: true, allowTrailingComma: true });
            return parseErrors.length > 0;
        }
        getFormattingOptions() {
            if (!this._formattingOptions) {
                this._formattingOptions = this.userDataSyncUtilService.resolveFormattingOptions(this.file);
            }
            return this._formattingOptions;
        }
    };
    AbstractJsonFileSynchroniser = __decorate([
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSync_1.IUserDataSyncLogService),
        __param(10, userDataSync_1.IUserDataSyncUtilService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, uriIdentity_1.IUriIdentityService)
    ], AbstractJsonFileSynchroniser);
    exports.AbstractJsonFileSynchroniser = AbstractJsonFileSynchroniser;
    let AbstractInitializer = class AbstractInitializer {
        constructor(resource, environmentService, logService, fileService, uriIdentityService) {
            this.resource = resource;
            this.environmentService = environmentService;
            this.logService = logService;
            this.fileService = fileService;
            this.extUri = uriIdentityService.extUri;
            this.lastSyncResource = (0, userDataSync_1.getLastSyncResourceUri)(this.resource, environmentService, this.extUri);
        }
        async initialize({ ref, content }) {
            if (!content) {
                this.logService.info('Remote content does not exist.', this.resource);
                return;
            }
            const syncData = this.parseSyncData(content);
            if (!syncData) {
                return;
            }
            try {
                await this.doInitialize({ ref, syncData });
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        parseSyncData(content) {
            try {
                const syncData = JSON.parse(content);
                if (isSyncData(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            this.logService.info('Cannot parse sync data as it is not compatible with the current version.', this.resource);
            return undefined;
        }
        async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
            const lastSyncUserData = Object.assign({ ref: lastSyncRemoteUserData.ref, content: lastSyncRemoteUserData.syncData ? JSON.stringify(lastSyncRemoteUserData.syncData) : null }, additionalProps);
            await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncUserData)));
        }
    };
    AbstractInitializer = __decorate([
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, files_1.IFileService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], AbstractInitializer);
    exports.AbstractInitializer = AbstractInitializer;
});
//# sourceMappingURL=abstractSynchronizer.js.map