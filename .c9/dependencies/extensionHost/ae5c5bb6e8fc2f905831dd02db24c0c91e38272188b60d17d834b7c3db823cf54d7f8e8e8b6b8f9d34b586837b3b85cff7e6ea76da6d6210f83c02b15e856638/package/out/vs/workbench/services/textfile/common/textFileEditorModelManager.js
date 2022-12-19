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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/map", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/errors", "vs/workbench/services/textfile/common/textFileSaveParticipant", "vs/platform/notification/common/notification", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/base/common/resources", "vs/editor/common/model/textModel", "vs/editor/common/languages/modesRegistry", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, nls_1, errorMessage_1, event_1, uri_1, textFileEditorModel_1, lifecycle_1, instantiation_1, map_1, files_1, async_1, errors_1, textFileSaveParticipant_1, notification_1, workingCopyFileService_1, resources_1, textModel_1, modesRegistry_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorModelManager = void 0;
    let TextFileEditorModelManager = class TextFileEditorModelManager extends lifecycle_1.Disposable {
        constructor(instantiationService, fileService, notificationService, workingCopyFileService, uriIdentityService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.notificationService = notificationService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidCreate = this._register(new event_1.Emitter());
            this.onDidCreate = this._onDidCreate.event;
            this._onDidResolve = this._register(new event_1.Emitter());
            this.onDidResolve = this._onDidResolve.event;
            this._onDidRemove = this._register(new event_1.Emitter());
            this.onDidRemove = this._onDidRemove.event;
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
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this.mapResourceToModel = new map_1.ResourceMap();
            this.mapResourceToModelListeners = new map_1.ResourceMap();
            this.mapResourceToDisposeListener = new map_1.ResourceMap();
            this.mapResourceToPendingModelResolvers = new map_1.ResourceMap();
            this.modelResolveQueue = this._register(new async_1.ResourceQueue());
            this.saveErrorHandler = (() => {
                const notificationService = this.notificationService;
                return {
                    onSaveError(error, model) {
                        notificationService.error((0, nls_1.localize)({ key: 'genericSaveError', comment: ['{0} is the resource that failed to save and {1} the error message'] }, "Failed to save '{0}': {1}", model.name, (0, errorMessage_1.toErrorMessage)(error, false)));
                    }
                };
            })();
            this.mapCorrelationIdToModelsToRestore = new Map();
            //#region Save participants
            this.saveParticipants = this._register(this.instantiationService.createInstance(textFileSaveParticipant_1.TextFileSaveParticipant));
            this.registerListeners();
        }
        get models() {
            return [...this.mapResourceToModel.values()];
        }
        registerListeners() {
            // Update models from file change events
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // File system provider changes
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onDidChangeFileSystemProviderCapabilities(e)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onDidChangeFileSystemProviderRegistrations(e)));
            // Working copy operations
            this._register(this.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => this.onWillRunWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidFailWorkingCopyFileOperation(e => this.onDidFailWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => this.onDidRunWorkingCopyFileOperation(e)));
        }
        onDidFilesChange(e) {
            for (const model of this.models) {
                if (model.isDirty()) {
                    continue; // never reload dirty models
                }
                // Trigger a model resolve for any update or add event that impacts
                // the model. We also consider the added event because it could
                // be that a file was added and updated right after.
                if (e.contains(model.resource, 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */)) {
                    this.queueModelReload(model);
                }
            }
        }
        onDidChangeFileSystemProviderCapabilities(e) {
            // Resolve models again for file systems that changed
            // capabilities to fetch latest metadata (e.g. readonly)
            // into all models.
            this.queueModelReloads(e.scheme);
        }
        onDidChangeFileSystemProviderRegistrations(e) {
            if (!e.added) {
                return; // only if added
            }
            // Resolve models again for file systems that registered
            // to account for capability changes: extensions may
            // unregister and register the same provider with different
            // capabilities, so we want to ensure to fetch latest
            // metadata (e.g. readonly) into all models.
            this.queueModelReloads(e.scheme);
        }
        queueModelReloads(scheme) {
            for (const model of this.models) {
                if (model.isDirty()) {
                    continue; // never reload dirty models
                }
                if (scheme === model.resource.scheme) {
                    this.queueModelReload(model);
                }
            }
        }
        queueModelReload(model) {
            // Resolve model to update (use a queue to prevent accumulation of resolves
            // when the resolve actually takes long. At most we only want the queue
            // to have a size of 2 (1 running resolve and 1 queued resolve).
            const queue = this.modelResolveQueue.queueFor(model.resource);
            if (queue.size <= 1) {
                queue.queue(async () => {
                    try {
                        await this.reload(model);
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                    }
                });
            }
        }
        onWillRunWorkingCopyFileOperation(e) {
            // Move / Copy: remember models to restore after the operation
            if (e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */) {
                const modelsToRestore = [];
                for (const { source, target } of e.files) {
                    if (source) {
                        if (this.uriIdentityService.extUri.isEqual(source, target)) {
                            continue; // ignore if resources are considered equal
                        }
                        // find all models that related to source (can be many if resource is a folder)
                        const sourceModels = [];
                        for (const model of this.models) {
                            if (this.uriIdentityService.extUri.isEqualOrParent(model.resource, source)) {
                                sourceModels.push(model);
                            }
                        }
                        // remember each source model to resolve again after move is done
                        // with optional content to restore if it was dirty
                        for (const sourceModel of sourceModels) {
                            const sourceModelResource = sourceModel.resource;
                            // If the source is the actual model, just use target as new resource
                            let targetModelResource;
                            if (this.uriIdentityService.extUri.isEqual(sourceModelResource, source)) {
                                targetModelResource = target;
                            }
                            // Otherwise a parent folder of the source is being moved, so we need
                            // to compute the target resource based on that
                            else {
                                targetModelResource = (0, resources_1.joinPath)(target, sourceModelResource.path.substr(source.path.length + 1));
                            }
                            modelsToRestore.push({
                                source: sourceModelResource,
                                target: targetModelResource,
                                languageId: sourceModel.getLanguageId(),
                                encoding: sourceModel.getEncoding(),
                                snapshot: sourceModel.isDirty() ? sourceModel.createSnapshot() : undefined
                            });
                        }
                    }
                }
                this.mapCorrelationIdToModelsToRestore.set(e.correlationId, modelsToRestore);
            }
        }
        onDidFailWorkingCopyFileOperation(e) {
            // Move / Copy: restore dirty flag on models to restore that were dirty
            if ((e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */)) {
                const modelsToRestore = this.mapCorrelationIdToModelsToRestore.get(e.correlationId);
                if (modelsToRestore) {
                    this.mapCorrelationIdToModelsToRestore.delete(e.correlationId);
                    modelsToRestore.forEach(model => {
                        var _a;
                        // snapshot presence means this model used to be dirty and so we restore that
                        // flag. we do NOT have to restore the content because the model was only soft
                        // reverted and did not loose its original dirty contents.
                        if (model.snapshot) {
                            (_a = this.get(model.source)) === null || _a === void 0 ? void 0 : _a.setDirty(true);
                        }
                    });
                }
            }
        }
        onDidRunWorkingCopyFileOperation(e) {
            switch (e.operation) {
                // Create: Revert existing models
                case 0 /* FileOperation.CREATE */:
                    e.waitUntil((async () => {
                        for (const { target } of e.files) {
                            const model = this.get(target);
                            if (model && !model.isDisposed()) {
                                await model.revert();
                            }
                        }
                    })());
                    break;
                // Move/Copy: restore models that were resolved before the operation took place
                case 2 /* FileOperation.MOVE */:
                case 3 /* FileOperation.COPY */:
                    e.waitUntil((async () => {
                        const modelsToRestore = this.mapCorrelationIdToModelsToRestore.get(e.correlationId);
                        if (modelsToRestore) {
                            this.mapCorrelationIdToModelsToRestore.delete(e.correlationId);
                            await async_1.Promises.settled(modelsToRestore.map(async (modelToRestore) => {
                                // restore the model at the target. if we have previous dirty content, we pass it
                                // over to be used, otherwise we force a reload from disk. this is important
                                // because we know the file has changed on disk after the move and the model might
                                // have still existed with the previous state. this ensures that the model is not
                                // tracking a stale state.
                                const restoredModel = await this.resolve(modelToRestore.target, {
                                    reload: { async: false },
                                    contents: modelToRestore.snapshot ? (0, textModel_1.createTextBufferFactoryFromSnapshot)(modelToRestore.snapshot) : undefined,
                                    encoding: modelToRestore.encoding
                                });
                                // restore previous language only if the language is now unspecified and it was specified
                                // but not when the file was explicitly stored with the plain text extension
                                // (https://github.com/microsoft/vscode/issues/125795)
                                if (modelToRestore.languageId &&
                                    modelToRestore.languageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID &&
                                    restoredModel.getLanguageId() === modesRegistry_1.PLAINTEXT_LANGUAGE_ID &&
                                    (0, resources_1.extname)(modelToRestore.target) !== modesRegistry_1.PLAINTEXT_EXTENSION) {
                                    restoredModel.updateTextEditorModel(undefined, modelToRestore.languageId);
                                }
                            }));
                        }
                    })());
                    break;
            }
        }
        get(resource) {
            return this.mapResourceToModel.get(resource);
        }
        has(resource) {
            return this.mapResourceToModel.has(resource);
        }
        async reload(model) {
            // Await a pending model resolve first before proceeding
            // to ensure that we never resolve a model more than once
            // in parallel.
            await this.joinPendingResolves(model.resource);
            if (model.isDirty() || model.isDisposed() || !this.has(model.resource)) {
                return; // the model possibly got dirty or disposed, so return early then
            }
            // Trigger reload
            await this.doResolve(model, { reload: { async: false } });
        }
        async resolve(resource, options) {
            // Await a pending model resolve first before proceeding
            // to ensure that we never resolve a model more than once
            // in parallel.
            const pendingResolve = this.joinPendingResolves(resource);
            if (pendingResolve) {
                await pendingResolve;
            }
            // Trigger resolve
            return this.doResolve(resource, options);
        }
        async doResolve(resourceOrModel, options) {
            let model;
            let resource;
            if (uri_1.URI.isUri(resourceOrModel)) {
                resource = resourceOrModel;
                model = this.get(resource);
            }
            else {
                resource = resourceOrModel.resource;
                model = resourceOrModel;
            }
            let modelResolve;
            let didCreateModel = false;
            // Model exists
            if (model) {
                // Always reload if contents are provided
                if (options === null || options === void 0 ? void 0 : options.contents) {
                    modelResolve = model.resolve(options);
                }
                // Reload async or sync based on options
                else if (options === null || options === void 0 ? void 0 : options.reload) {
                    // async reload: trigger a reload but return immediately
                    if (options.reload.async) {
                        modelResolve = Promise.resolve();
                        (async () => {
                            try {
                                await model.resolve(options);
                            }
                            catch (error) {
                                (0, errors_1.onUnexpectedError)(error);
                            }
                        })();
                    }
                    // sync reload: do not return until model reloaded
                    else {
                        modelResolve = model.resolve(options);
                    }
                }
                // Do not reload
                else {
                    modelResolve = Promise.resolve();
                }
            }
            // Model does not exist
            else {
                didCreateModel = true;
                const newModel = model = this.instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, resource, options ? options.encoding : undefined, options ? options.languageId : undefined);
                modelResolve = model.resolve(options);
                this.registerModel(newModel);
            }
            // Store pending resolves to avoid race conditions
            this.mapResourceToPendingModelResolvers.set(resource, modelResolve);
            // Make known to manager (if not already known)
            this.add(resource, model);
            // Emit some events if we created the model
            if (didCreateModel) {
                this._onDidCreate.fire(model);
                // If the model is dirty right from the beginning,
                // make sure to emit this as an event
                if (model.isDirty()) {
                    this._onDidChangeDirty.fire(model);
                }
            }
            try {
                await modelResolve;
            }
            catch (error) {
                // Automatically dispose the model if we created it
                // because we cannot dispose a model we do not own
                // https://github.com/microsoft/vscode/issues/138850
                if (didCreateModel) {
                    model.dispose();
                }
                throw error;
            }
            finally {
                // Remove from pending resolves
                this.mapResourceToPendingModelResolvers.delete(resource);
            }
            // Apply language if provided
            if (options === null || options === void 0 ? void 0 : options.languageId) {
                model.setLanguageId(options.languageId);
            }
            // Model can be dirty if a backup was restored, so we make sure to
            // have this event delivered if we created the model here
            if (didCreateModel && model.isDirty()) {
                this._onDidChangeDirty.fire(model);
            }
            return model;
        }
        joinPendingResolves(resource) {
            const pendingModelResolve = this.mapResourceToPendingModelResolvers.get(resource);
            if (!pendingModelResolve) {
                return;
            }
            return this.doJoinPendingResolves(resource);
        }
        async doJoinPendingResolves(resource) {
            // While we have pending model resolves, ensure
            // to await the last one finishing before returning.
            // This prevents a race when multiple clients await
            // the pending resolve and then all trigger the resolve
            // at the same time.
            let currentModelCopyResolve;
            while (this.mapResourceToPendingModelResolvers.has(resource)) {
                const nextPendingModelResolve = this.mapResourceToPendingModelResolvers.get(resource);
                if (nextPendingModelResolve === currentModelCopyResolve) {
                    return; // already awaited on - return
                }
                currentModelCopyResolve = nextPendingModelResolve;
                try {
                    await nextPendingModelResolve;
                }
                catch (error) {
                    // ignore any error here, it will bubble to the original requestor
                }
            }
        }
        registerModel(model) {
            // Install model listeners
            const modelListeners = new lifecycle_1.DisposableStore();
            modelListeners.add(model.onDidResolve(reason => this._onDidResolve.fire({ model, reason })));
            modelListeners.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire(model)));
            modelListeners.add(model.onDidChangeReadonly(() => this._onDidChangeReadonly.fire(model)));
            modelListeners.add(model.onDidChangeOrphaned(() => this._onDidChangeOrphaned.fire(model)));
            modelListeners.add(model.onDidSaveError(() => this._onDidSaveError.fire(model)));
            modelListeners.add(model.onDidSave(e => this._onDidSave.fire(Object.assign({ model }, e))));
            modelListeners.add(model.onDidRevert(() => this._onDidRevert.fire(model)));
            modelListeners.add(model.onDidChangeEncoding(() => this._onDidChangeEncoding.fire(model)));
            // Keep for disposal
            this.mapResourceToModelListeners.set(model.resource, modelListeners);
        }
        add(resource, model) {
            const knownModel = this.mapResourceToModel.get(resource);
            if (knownModel === model) {
                return; // already cached
            }
            // dispose any previously stored dispose listener for this resource
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                disposeListener.dispose();
            }
            // store in cache but remove when model gets disposed
            this.mapResourceToModel.set(resource, model);
            this.mapResourceToDisposeListener.set(resource, model.onWillDispose(() => this.remove(resource)));
        }
        remove(resource) {
            const removed = this.mapResourceToModel.delete(resource);
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                (0, lifecycle_1.dispose)(disposeListener);
                this.mapResourceToDisposeListener.delete(resource);
            }
            const modelListener = this.mapResourceToModelListeners.get(resource);
            if (modelListener) {
                (0, lifecycle_1.dispose)(modelListener);
                this.mapResourceToModelListeners.delete(resource);
            }
            if (removed) {
                this._onDidRemove.fire(resource);
            }
        }
        addSaveParticipant(participant) {
            return this.saveParticipants.addSaveParticipant(participant);
        }
        runSaveParticipants(model, context, token) {
            return this.saveParticipants.participate(model, context, token);
        }
        //#endregion
        canDispose(model) {
            // quick return if model already disposed or not dirty and not resolving
            if (model.isDisposed() ||
                (!this.mapResourceToPendingModelResolvers.has(model.resource) && !model.isDirty())) {
                return true;
            }
            // promise based return in all other cases
            return this.doCanDispose(model);
        }
        async doCanDispose(model) {
            // Await any pending resolves first before proceeding
            const pendingResolve = this.joinPendingResolves(model.resource);
            if (pendingResolve) {
                await pendingResolve;
                return this.canDispose(model);
            }
            // dirty model: we do not allow to dispose dirty models to prevent
            // data loss cases. dirty models can only be disposed when they are
            // either saved or reverted
            if (model.isDirty()) {
                await event_1.Event.toPromise(model.onDidChangeDirty);
                return this.canDispose(model);
            }
            return true;
        }
        dispose() {
            super.dispose();
            // model caches
            this.mapResourceToModel.clear();
            this.mapResourceToPendingModelResolvers.clear();
            // dispose the dispose listeners
            (0, lifecycle_1.dispose)(this.mapResourceToDisposeListener.values());
            this.mapResourceToDisposeListener.clear();
            // dispose the model change listeners
            (0, lifecycle_1.dispose)(this.mapResourceToModelListeners.values());
            this.mapResourceToModelListeners.clear();
        }
    };
    TextFileEditorModelManager = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, files_1.IFileService),
        __param(2, notification_1.INotificationService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TextFileEditorModelManager);
    exports.TextFileEditorModelManager = TextFileEditorModelManager;
});
//# sourceMappingURL=textFileEditorModelManager.js.map