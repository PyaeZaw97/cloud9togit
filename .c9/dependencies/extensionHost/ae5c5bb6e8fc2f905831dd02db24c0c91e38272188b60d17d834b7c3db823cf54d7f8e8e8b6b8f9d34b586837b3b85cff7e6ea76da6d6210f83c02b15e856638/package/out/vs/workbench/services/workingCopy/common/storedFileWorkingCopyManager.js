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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/workingCopy/common/storedFileWorkingCopy", "vs/base/common/map", "vs/base/common/async", "vs/platform/files/common/files", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/uri", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/base/common/resources", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/abstractFileWorkingCopyManager", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/platform", "vs/base/common/errors"], function (require, exports, nls_1, lifecycle_1, event_1, storedFileWorkingCopy_1, map_1, async_1, files_1, lifecycle_2, uri_1, label_1, log_1, resources_1, workingCopyFileService_1, uriIdentity_1, cancellation_1, workingCopyBackup_1, abstractFileWorkingCopyManager_1, notification_1, editorService_1, elevatedFileService_1, filesConfigurationService_1, workingCopyEditorService_1, workingCopyService_1, platform_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredFileWorkingCopyManager = void 0;
    let StoredFileWorkingCopyManager = class StoredFileWorkingCopyManager extends abstractFileWorkingCopyManager_1.BaseFileWorkingCopyManager {
        constructor(workingCopyTypeId, modelFactory, fileService, lifecycleService, labelService, logService, workingCopyFileService, workingCopyBackupService, uriIdentityService, filesConfigurationService, workingCopyService, notificationService, workingCopyEditorService, editorService, elevatedFileService) {
            super(fileService, logService, workingCopyBackupService);
            this.workingCopyTypeId = workingCopyTypeId;
            this.modelFactory = modelFactory;
            this.lifecycleService = lifecycleService;
            this.labelService = labelService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyService = workingCopyService;
            this.notificationService = notificationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.editorService = editorService;
            this.elevatedFileService = elevatedFileService;
            //#region Events
            this._onDidResolve = this._register(new event_1.Emitter());
            this.onDidResolve = this._onDidResolve.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this._onDidSaveError = this._register(new event_1.Emitter());
            this.onDidSaveError = this._onDidSaveError.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onDidRemove = this._register(new event_1.Emitter());
            this.onDidRemove = this._onDidRemove.event;
            //#endregion
            this.mapResourceToWorkingCopyListeners = new map_1.ResourceMap();
            this.mapResourceToPendingWorkingCopyResolve = new map_1.ResourceMap();
            this.workingCopyResolveQueue = this._register(new async_1.ResourceQueue());
            //#endregion
            //#region Working Copy File Events
            this.mapCorrelationIdToWorkingCopiesToRestore = new Map();
            this.registerListeners();
        }
        registerListeners() {
            // Update working copies from file change events
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // File system provider changes
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onDidChangeFileSystemProviderCapabilities(e)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onDidChangeFileSystemProviderRegistrations(e)));
            // Working copy operations
            this._register(this.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => this.onWillRunWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidFailWorkingCopyFileOperation(e => this.onDidFailWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => this.onDidRunWorkingCopyFileOperation(e)));
            // Lifecycle
            this.lifecycleService.onBeforeShutdown(event => event.veto(this.onBeforeShutdown(), 'veto.fileWorkingCopyManager'));
            this.lifecycleService.onWillShutdown(event => event.join(this.onWillShutdown(), { id: 'join.fileWorkingCopyManager', label: (0, nls_1.localize)('join.fileWorkingCopyManager', "Saving working copies") }));
        }
        onBeforeShutdown() {
            if (platform_1.isWeb) {
                if (this.workingCopies.some(workingCopy => workingCopy.hasState(2 /* StoredFileWorkingCopyState.PENDING_SAVE */))) {
                    // stored file working copies are pending to be saved:
                    // veto because web does not support long running shutdown
                    return true;
                }
            }
            return false;
        }
        async onWillShutdown() {
            let pendingSavedWorkingCopies;
            // As long as stored file working copies are pending to be saved, we prolong the shutdown
            // until that has happened to ensure we are not shutting down in the middle of
            // writing to the working copy (https://github.com/microsoft/vscode/issues/116600).
            while ((pendingSavedWorkingCopies = this.workingCopies.filter(workingCopy => workingCopy.hasState(2 /* StoredFileWorkingCopyState.PENDING_SAVE */))).length > 0) {
                await async_1.Promises.settled(pendingSavedWorkingCopies.map(workingCopy => workingCopy.joinState(2 /* StoredFileWorkingCopyState.PENDING_SAVE */)));
            }
        }
        //#region Resolve from file or file provider changes
        onDidChangeFileSystemProviderCapabilities(e) {
            // Resolve working copies again for file systems that changed
            // capabilities to fetch latest metadata (e.g. readonly)
            // into all working copies.
            this.queueWorkingCopyReloads(e.scheme);
        }
        onDidChangeFileSystemProviderRegistrations(e) {
            if (!e.added) {
                return; // only if added
            }
            // Resolve working copies again for file systems that registered
            // to account for capability changes: extensions may unregister
            // and register the same provider with different capabilities,
            // so we want to ensure to fetch latest metadata (e.g. readonly)
            // into all working copies.
            this.queueWorkingCopyReloads(e.scheme);
        }
        onDidFilesChange(e) {
            // Trigger a resolve for any update or add event that impacts
            // the working copy. We also consider the added event
            // because it could be that a file was added and updated
            // right after.
            this.queueWorkingCopyReloads(e);
        }
        queueWorkingCopyReloads(schemeOrEvent) {
            for (const workingCopy of this.workingCopies) {
                if (workingCopy.isDirty()) {
                    continue; // never reload dirty working copies
                }
                let resolveWorkingCopy = false;
                if (typeof schemeOrEvent === 'string') {
                    resolveWorkingCopy = schemeOrEvent === workingCopy.resource.scheme;
                }
                else {
                    resolveWorkingCopy = schemeOrEvent.contains(workingCopy.resource, 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */);
                }
                if (resolveWorkingCopy) {
                    this.queueWorkingCopyReload(workingCopy);
                }
            }
        }
        queueWorkingCopyReload(workingCopy) {
            // Resolves a working copy to update (use a queue to prevent accumulation of
            // resolve when the resolving actually takes long. At most we only want the
            // queue to have a size of 2 (1 running resolve and 1 queued resolve).
            const queue = this.workingCopyResolveQueue.queueFor(workingCopy.resource);
            if (queue.size <= 1) {
                queue.queue(async () => {
                    try {
                        await this.reload(workingCopy);
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                });
            }
        }
        onWillRunWorkingCopyFileOperation(e) {
            // Move / Copy: remember working copies to restore after the operation
            if (e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */) {
                e.waitUntil((async () => {
                    var _a;
                    const workingCopiesToRestore = [];
                    for (const { source, target } of e.files) {
                        if (source) {
                            if (this.uriIdentityService.extUri.isEqual(source, target)) {
                                continue; // ignore if resources are considered equal
                            }
                            // Find all working copies that related to source (can be many if resource is a folder)
                            const sourceWorkingCopies = [];
                            for (const workingCopy of this.workingCopies) {
                                if (this.uriIdentityService.extUri.isEqualOrParent(workingCopy.resource, source)) {
                                    sourceWorkingCopies.push(workingCopy);
                                }
                            }
                            // Remember each source working copy to load again after move is done
                            // with optional content to restore if it was dirty
                            for (const sourceWorkingCopy of sourceWorkingCopies) {
                                const sourceResource = sourceWorkingCopy.resource;
                                // If the source is the actual working copy, just use target as new resource
                                let targetResource;
                                if (this.uriIdentityService.extUri.isEqual(sourceResource, source)) {
                                    targetResource = target;
                                }
                                // Otherwise a parent folder of the source is being moved, so we need
                                // to compute the target resource based on that
                                else {
                                    targetResource = (0, resources_1.joinPath)(target, sourceResource.path.substr(source.path.length + 1));
                                }
                                workingCopiesToRestore.push({
                                    source: sourceResource,
                                    target: targetResource,
                                    snapshot: sourceWorkingCopy.isDirty() ? await ((_a = sourceWorkingCopy.model) === null || _a === void 0 ? void 0 : _a.snapshot(cancellation_1.CancellationToken.None)) : undefined
                                });
                            }
                        }
                    }
                    this.mapCorrelationIdToWorkingCopiesToRestore.set(e.correlationId, workingCopiesToRestore);
                })());
            }
        }
        onDidFailWorkingCopyFileOperation(e) {
            // Move / Copy: restore dirty flag on working copies to restore that were dirty
            if ((e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */)) {
                const workingCopiesToRestore = this.mapCorrelationIdToWorkingCopiesToRestore.get(e.correlationId);
                if (workingCopiesToRestore) {
                    this.mapCorrelationIdToWorkingCopiesToRestore.delete(e.correlationId);
                    workingCopiesToRestore.forEach(workingCopy => {
                        var _a;
                        // Snapshot presence means this working copy used to be dirty and so we restore that
                        // flag. we do NOT have to restore the content because the working copy was only soft
                        // reverted and did not loose its original dirty contents.
                        if (workingCopy.snapshot) {
                            (_a = this.get(workingCopy.source)) === null || _a === void 0 ? void 0 : _a.markDirty();
                        }
                    });
                }
            }
        }
        onDidRunWorkingCopyFileOperation(e) {
            switch (e.operation) {
                // Create: Revert existing working copies
                case 0 /* FileOperation.CREATE */:
                    e.waitUntil((async () => {
                        for (const { target } of e.files) {
                            const workingCopy = this.get(target);
                            if (workingCopy && !workingCopy.isDisposed()) {
                                await workingCopy.revert();
                            }
                        }
                    })());
                    break;
                // Move/Copy: restore working copies that were loaded before the operation took place
                case 2 /* FileOperation.MOVE */:
                case 3 /* FileOperation.COPY */:
                    e.waitUntil((async () => {
                        const workingCopiesToRestore = this.mapCorrelationIdToWorkingCopiesToRestore.get(e.correlationId);
                        if (workingCopiesToRestore) {
                            this.mapCorrelationIdToWorkingCopiesToRestore.delete(e.correlationId);
                            await async_1.Promises.settled(workingCopiesToRestore.map(async (workingCopyToRestore) => {
                                // Restore the working copy at the target. if we have previous dirty content, we pass it
                                // over to be used, otherwise we force a reload from disk. this is important
                                // because we know the file has changed on disk after the move and the working copy might
                                // have still existed with the previous state. this ensures that the working copy is not
                                // tracking a stale state.
                                await this.resolve(workingCopyToRestore.target, {
                                    reload: { async: false },
                                    contents: workingCopyToRestore.snapshot
                                });
                            }));
                        }
                    })());
                    break;
            }
        }
        //#endregion
        //#region Reload & Resolve
        async reload(workingCopy) {
            // Await a pending working copy resolve first before proceeding
            // to ensure that we never resolve a working copy more than once
            // in parallel.
            await this.joinPendingResolves(workingCopy.resource);
            if (workingCopy.isDirty() || workingCopy.isDisposed() || !this.has(workingCopy.resource)) {
                return; // the working copy possibly got dirty or disposed, so return early then
            }
            // Trigger reload
            await this.doResolve(workingCopy, { reload: { async: false } });
        }
        async resolve(resource, options) {
            // Await a pending working copy resolve first before proceeding
            // to ensure that we never resolve a working copy more than once
            // in parallel.
            const pendingResolve = this.joinPendingResolves(resource);
            if (pendingResolve) {
                await pendingResolve;
            }
            // Trigger resolve
            return this.doResolve(resource, options);
        }
        async doResolve(resourceOrWorkingCopy, options) {
            var _a;
            let workingCopy;
            let resource;
            if (uri_1.URI.isUri(resourceOrWorkingCopy)) {
                resource = resourceOrWorkingCopy;
                workingCopy = this.get(resource);
            }
            else {
                resource = resourceOrWorkingCopy.resource;
                workingCopy = resourceOrWorkingCopy;
            }
            let workingCopyResolve;
            let didCreateWorkingCopy = false;
            const resolveOptions = {
                contents: options === null || options === void 0 ? void 0 : options.contents,
                forceReadFromFile: (_a = options === null || options === void 0 ? void 0 : options.reload) === null || _a === void 0 ? void 0 : _a.force
            };
            // Working copy exists
            if (workingCopy) {
                // Always reload if contents are provided
                if (options === null || options === void 0 ? void 0 : options.contents) {
                    workingCopyResolve = workingCopy.resolve(resolveOptions);
                }
                // Reload async or sync based on options
                else if (options === null || options === void 0 ? void 0 : options.reload) {
                    // Async reload: trigger a reload but return immediately
                    if (options.reload.async) {
                        workingCopyResolve = Promise.resolve();
                        (async () => {
                            try {
                                await workingCopy.resolve(resolveOptions);
                            }
                            catch (error) {
                                (0, errors_1.onUnexpectedError)(error);
                            }
                        })();
                    }
                    // Sync reload: do not return until working copy reloaded
                    else {
                        workingCopyResolve = workingCopy.resolve(resolveOptions);
                    }
                }
                // Do not reload
                else {
                    workingCopyResolve = Promise.resolve();
                }
            }
            // Stored file working copy does not exist
            else {
                didCreateWorkingCopy = true;
                workingCopy = new storedFileWorkingCopy_1.StoredFileWorkingCopy(this.workingCopyTypeId, resource, this.labelService.getUriBasenameLabel(resource), this.modelFactory, async (options) => { await this.resolve(resource, Object.assign(Object.assign({}, options), { reload: { async: false } })); }, this.fileService, this.logService, this.workingCopyFileService, this.filesConfigurationService, this.workingCopyBackupService, this.workingCopyService, this.notificationService, this.workingCopyEditorService, this.editorService, this.elevatedFileService);
                workingCopyResolve = workingCopy.resolve(resolveOptions);
                this.registerWorkingCopy(workingCopy);
            }
            // Store pending resolve to avoid race conditions
            this.mapResourceToPendingWorkingCopyResolve.set(resource, workingCopyResolve);
            // Make known to manager (if not already known)
            this.add(resource, workingCopy);
            // Emit some events if we created the working copy
            if (didCreateWorkingCopy) {
                // If the working copy is dirty right from the beginning,
                // make sure to emit this as an event
                if (workingCopy.isDirty()) {
                    this._onDidChangeDirty.fire(workingCopy);
                }
            }
            try {
                await workingCopyResolve;
            }
            catch (error) {
                // Automatically dispose the working copy if we created
                // it because we cannot dispose a working copy we do not
                // own (https://github.com/microsoft/vscode/issues/138850)
                if (didCreateWorkingCopy) {
                    workingCopy.dispose();
                }
                throw error;
            }
            finally {
                // Remove from pending resolves
                this.mapResourceToPendingWorkingCopyResolve.delete(resource);
            }
            // Stored file working copy can be dirty if a backup was restored, so we make sure to
            // have this event delivered if we created the working copy here
            if (didCreateWorkingCopy && workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            return workingCopy;
        }
        joinPendingResolves(resource) {
            const pendingWorkingCopyResolve = this.mapResourceToPendingWorkingCopyResolve.get(resource);
            if (!pendingWorkingCopyResolve) {
                return;
            }
            return this.doJoinPendingResolves(resource);
        }
        async doJoinPendingResolves(resource) {
            // While we have pending working copy resolves, ensure
            // to await the last one finishing before returning.
            // This prevents a race when multiple clients await
            // the pending resolve and then all trigger the resolve
            // at the same time.
            let currentWorkingCopyResolve;
            while (this.mapResourceToPendingWorkingCopyResolve.has(resource)) {
                const nextPendingWorkingCopyResolve = this.mapResourceToPendingWorkingCopyResolve.get(resource);
                if (nextPendingWorkingCopyResolve === currentWorkingCopyResolve) {
                    return; // already awaited on - return
                }
                currentWorkingCopyResolve = nextPendingWorkingCopyResolve;
                try {
                    await nextPendingWorkingCopyResolve;
                }
                catch (error) {
                    // ignore any error here, it will bubble to the original requestor
                }
            }
        }
        registerWorkingCopy(workingCopy) {
            // Install working copy listeners
            const workingCopyListeners = new lifecycle_1.DisposableStore();
            workingCopyListeners.add(workingCopy.onDidResolve(() => this._onDidResolve.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidChangeReadonly(() => this._onDidChangeReadonly.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidChangeOrphaned(() => this._onDidChangeOrphaned.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidSaveError(() => this._onDidSaveError.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidSave(e => this._onDidSave.fire(Object.assign({ workingCopy }, e))));
            workingCopyListeners.add(workingCopy.onDidRevert(() => this._onDidRevert.fire(workingCopy)));
            // Keep for disposal
            this.mapResourceToWorkingCopyListeners.set(workingCopy.resource, workingCopyListeners);
        }
        remove(resource) {
            const removed = super.remove(resource);
            // Dispose any exsting working copy listeners
            const workingCopyListener = this.mapResourceToWorkingCopyListeners.get(resource);
            if (workingCopyListener) {
                (0, lifecycle_1.dispose)(workingCopyListener);
                this.mapResourceToWorkingCopyListeners.delete(resource);
            }
            if (removed) {
                this._onDidRemove.fire(resource);
            }
            return removed;
        }
        //#endregion
        //#region Lifecycle
        canDispose(workingCopy) {
            // Quick return if working copy already disposed or not dirty and not resolving
            if (workingCopy.isDisposed() ||
                (!this.mapResourceToPendingWorkingCopyResolve.has(workingCopy.resource) && !workingCopy.isDirty())) {
                return true;
            }
            // Promise based return in all other cases
            return this.doCanDispose(workingCopy);
        }
        async doCanDispose(workingCopy) {
            // Await any pending resolves first before proceeding
            const pendingResolve = this.joinPendingResolves(workingCopy.resource);
            if (pendingResolve) {
                await pendingResolve;
                return this.canDispose(workingCopy);
            }
            // Dirty working copy: we do not allow to dispose dirty working copys
            // to prevent data loss cases. dirty working copys can only be disposed when
            // they are either saved or reverted
            if (workingCopy.isDirty()) {
                await event_1.Event.toPromise(workingCopy.onDidChangeDirty);
                return this.canDispose(workingCopy);
            }
            return true;
        }
        dispose() {
            super.dispose();
            // Clear pending working copy resolves
            this.mapResourceToPendingWorkingCopyResolve.clear();
            // Dispose the working copy change listeners
            (0, lifecycle_1.dispose)(this.mapResourceToWorkingCopyListeners.values());
            this.mapResourceToWorkingCopyListeners.clear();
        }
    };
    StoredFileWorkingCopyManager = __decorate([
        __param(2, files_1.IFileService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, workingCopyFileService_1.IWorkingCopyFileService),
        __param(7, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, notification_1.INotificationService),
        __param(12, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(13, editorService_1.IEditorService),
        __param(14, elevatedFileService_1.IElevatedFileService)
    ], StoredFileWorkingCopyManager);
    exports.StoredFileWorkingCopyManager = StoredFileWorkingCopyManager;
});
//# sourceMappingURL=storedFileWorkingCopyManager.js.map