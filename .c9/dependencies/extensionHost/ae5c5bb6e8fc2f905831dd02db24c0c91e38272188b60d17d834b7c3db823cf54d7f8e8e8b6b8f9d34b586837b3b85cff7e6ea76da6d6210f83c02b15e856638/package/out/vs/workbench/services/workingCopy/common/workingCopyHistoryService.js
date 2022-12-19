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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/workingCopy/common/workingCopyHistoryTracker", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/platform/files/common/files", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/uri", "vs/base/common/async", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/base/common/hash", "vs/base/common/extpath", "vs/base/common/cancellation", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/label/common/label", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/workbench/common/editor", "vs/platform/configuration/common/configuration", "vs/base/common/arrays"], function (require, exports, nls_1, event_1, types_1, platform_1, contributions_1, workingCopyHistoryTracker_1, lifecycle_1, workingCopyHistory_1, files_1, remoteAgentService_1, uri_1, async_1, resources_1, environmentService_1, hash_1, extpath_1, cancellation_1, map_1, uriIdentity_1, label_1, buffer_1, log_1, editor_1, configuration_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyHistoryService = exports.WorkingCopyHistoryModel = void 0;
    class WorkingCopyHistoryModel {
        constructor(workingCopyResource, historyHome, entryAddedEmitter, entryChangedEmitter, entryReplacedEmitter, entryRemovedEmitter, options, fileService, labelService, logService, configurationService) {
            this.historyHome = historyHome;
            this.entryAddedEmitter = entryAddedEmitter;
            this.entryChangedEmitter = entryChangedEmitter;
            this.entryReplacedEmitter = entryReplacedEmitter;
            this.entryRemovedEmitter = entryRemovedEmitter;
            this.options = options;
            this.fileService = fileService;
            this.labelService = labelService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.entries = [];
            this.whenResolved = undefined;
            this.workingCopyResource = undefined;
            this.workingCopyName = undefined;
            this.historyEntriesFolder = undefined;
            this.historyEntriesListingFile = undefined;
            this.historyEntriesNameMatcher = undefined;
            this.versionId = 0;
            this.storedVersionId = this.versionId;
            this.storeLimiter = new async_1.Limiter(1);
            this.setWorkingCopy(workingCopyResource);
        }
        setWorkingCopy(workingCopyResource) {
            // Update working copy
            this.workingCopyResource = workingCopyResource;
            this.workingCopyName = this.labelService.getUriBasenameLabel(workingCopyResource);
            this.historyEntriesNameMatcher = new RegExp(`[A-Za-z0-9]{4}${(0, resources_1.extname)(workingCopyResource)}`);
            // Update locations
            this.historyEntriesFolder = this.toHistoryEntriesFolder(this.historyHome, workingCopyResource);
            this.historyEntriesListingFile = (0, resources_1.joinPath)(this.historyEntriesFolder, WorkingCopyHistoryModel.ENTRIES_FILE);
            // Reset entries and resolved cache
            this.entries = [];
            this.whenResolved = undefined;
        }
        toHistoryEntriesFolder(historyHome, workingCopyResource) {
            return (0, resources_1.joinPath)(historyHome, (0, hash_1.hash)(workingCopyResource.toString()).toString(16));
        }
        async addEntry(source = WorkingCopyHistoryModel.FILE_SAVED_SOURCE, timestamp = Date.now(), token) {
            let entryToReplace = undefined;
            // Figure out if the last entry should be replaced based
            // on settings that can define a interval for when an
            // entry is not added as new entry but should replace.
            // However, when save source is different, never replace.
            const lastEntry = (0, arrays_1.lastOrDefault)(this.entries);
            if (lastEntry && lastEntry.source === source) {
                const configuredReplaceInterval = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MERGE_PERIOD, { resource: this.workingCopyResource });
                if (timestamp - lastEntry.timestamp <= (configuredReplaceInterval * 1000 /* convert to millies */)) {
                    entryToReplace = lastEntry;
                }
            }
            let entry;
            // Replace lastest entry in history
            if (entryToReplace) {
                entry = await this.doReplaceEntry(entryToReplace, timestamp, token);
            }
            // Add entry to history
            else {
                entry = await this.doAddEntry(source, timestamp, token);
            }
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
            return entry;
        }
        async doAddEntry(source, timestamp, token) {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const workingCopyName = (0, types_1.assertIsDefined)(this.workingCopyName);
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            // Perform a fast clone operation with minimal overhead to a new random location
            const id = `${(0, extpath_1.randomPath)(undefined, undefined, 4)}${(0, resources_1.extname)(workingCopyResource)}`;
            const location = (0, resources_1.joinPath)(historyEntriesFolder, id);
            await this.fileService.cloneFile(workingCopyResource, location);
            // Add to list of entries
            const entry = {
                id,
                workingCopy: { resource: workingCopyResource, name: workingCopyName },
                location,
                timestamp,
                source
            };
            this.entries.push(entry);
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryAddedEmitter.fire({ entry });
            return entry;
        }
        async doReplaceEntry(entry, timestamp, token) {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            // Perform a fast clone operation with minimal overhead to the existing location
            await this.fileService.cloneFile(workingCopyResource, entry.location);
            // Update entry
            entry.timestamp = timestamp;
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryReplacedEmitter.fire({ entry });
            return entry;
        }
        async removeEntry(entry, token) {
            // Make sure to await resolving when removing entries
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return false;
            }
            const index = this.entries.indexOf(entry);
            if (index === -1) {
                return false;
            }
            // Delete from disk
            await this.deleteEntry(entry);
            // Remove from model
            this.entries.splice(index, 1);
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryRemovedEmitter.fire({ entry });
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
            return true;
        }
        async updateEntry(entry, properties, token) {
            // Make sure to await resolving when updating entries
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return;
            }
            const index = this.entries.indexOf(entry);
            if (index === -1) {
                return;
            }
            // Update entry
            entry.source = properties.source;
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryChangedEmitter.fire({ entry });
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
        }
        async getEntries() {
            // Make sure to await resolving when all entries are asked for
            await this.resolveEntriesOnce();
            // Return as many entries as configured by user settings
            const configuredMaxEntries = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MAX_ENTRIES, { resource: this.workingCopyResource });
            if (this.entries.length > configuredMaxEntries) {
                return this.entries.slice(this.entries.length - configuredMaxEntries);
            }
            return this.entries;
        }
        async hasEntries(skipResolve) {
            // Make sure to await resolving unless explicitly skipped
            if (!skipResolve) {
                await this.resolveEntriesOnce();
            }
            return this.entries.length > 0;
        }
        resolveEntriesOnce() {
            if (!this.whenResolved) {
                this.whenResolved = this.doResolveEntries();
            }
            return this.whenResolved;
        }
        async doResolveEntries() {
            // Resolve from disk
            const entries = await this.resolveEntriesFromDisk();
            // We now need to merge our in-memory entries with the
            // entries we have found on disk because it is possible
            // that new entries have been added before the entries
            // listing file was updated
            for (const entry of this.entries) {
                entries.set(entry.id, entry);
            }
            // Set as entries, sorted by timestamp
            this.entries = Array.from(entries.values()).sort((entryA, entryB) => entryA.timestamp - entryB.timestamp);
        }
        async resolveEntriesFromDisk() {
            var _a;
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const workingCopyName = (0, types_1.assertIsDefined)(this.workingCopyName);
            const [entryListing, entryStats] = await Promise.all([
                // Resolve entries listing file
                this.readEntriesFile(),
                // Resolve children of history folder
                this.readEntriesFolder()
            ]);
            // Add from raw folder children
            const entries = new Map();
            if (entryStats) {
                for (const entryStat of entryStats) {
                    entries.set(entryStat.name, {
                        id: entryStat.name,
                        workingCopy: { resource: workingCopyResource, name: workingCopyName },
                        location: entryStat.resource,
                        timestamp: entryStat.mtime,
                        source: WorkingCopyHistoryModel.FILE_SAVED_SOURCE
                    });
                }
            }
            // Update from listing (to have more specific metadata)
            if (entryListing) {
                for (const entry of entryListing.entries) {
                    const existingEntry = entries.get(entry.id);
                    if (existingEntry) {
                        entries.set(entry.id, Object.assign(Object.assign({}, existingEntry), { timestamp: entry.timestamp, source: (_a = entry.source) !== null && _a !== void 0 ? _a : existingEntry.source }));
                    }
                }
            }
            return entries;
        }
        async moveEntries(targetWorkingCopyResource, source, token) {
            // Ensure model stored so that any pending data is flushed
            await this.store(token);
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Rename existing entries folder
            const sourceHistoryEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            const targetHistoryFolder = this.toHistoryEntriesFolder(this.historyHome, targetWorkingCopyResource);
            try {
                await this.fileService.move(sourceHistoryEntriesFolder, targetHistoryFolder, true);
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            // Update our associated working copy
            this.setWorkingCopy(targetWorkingCopyResource);
            // Add entry for the move
            await this.addEntry(source, undefined, token);
            // Store model again to updated location
            await this.store(token);
        }
        async store(token) {
            if (!this.shouldStore()) {
                return;
            }
            // Use a `Limiter` to prevent multiple `store` operations
            // potentially running at the same time
            await this.storeLimiter.queue(async () => {
                if (token.isCancellationRequested || !this.shouldStore()) {
                    return;
                }
                return this.doStore(token);
            });
        }
        shouldStore() {
            return this.storedVersionId !== this.versionId;
        }
        async doStore(token) {
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            // Make sure to await resolving when persisting
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Cleanup based on max-entries setting
            await this.cleanUpEntries();
            // Without entries, remove the history folder
            const storedVersion = this.versionId;
            if (this.entries.length === 0) {
                try {
                    await this.fileService.del(historyEntriesFolder, { recursive: true });
                }
                catch (error) {
                    this.traceError(error);
                }
            }
            // If we still have entries, update the entries meta file
            else {
                await this.writeEntriesFile();
            }
            // Mark as stored version
            this.storedVersionId = storedVersion;
        }
        async cleanUpEntries() {
            const configuredMaxEntries = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MAX_ENTRIES, { resource: this.workingCopyResource });
            if (this.entries.length <= configuredMaxEntries) {
                return; // nothing to cleanup
            }
            const entriesToDelete = this.entries.slice(0, this.entries.length - configuredMaxEntries);
            const entriesToKeep = this.entries.slice(this.entries.length - configuredMaxEntries);
            // Delete entries from disk as instructed
            for (const entryToDelete of entriesToDelete) {
                await this.deleteEntry(entryToDelete);
            }
            // Make sure to update our in-memory model as well
            // because it will be persisted right after
            this.entries = entriesToKeep;
            // Events
            for (const entry of entriesToDelete) {
                this.entryRemovedEmitter.fire({ entry });
            }
        }
        async deleteEntry(entry) {
            try {
                await this.fileService.del(entry.location);
            }
            catch (error) {
                this.traceError(error);
            }
        }
        async writeEntriesFile() {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const historyEntriesListingFile = (0, types_1.assertIsDefined)(this.historyEntriesListingFile);
            const serializedModel = {
                version: 1,
                resource: workingCopyResource.toString(),
                entries: this.entries.map(entry => {
                    return {
                        id: entry.id,
                        source: entry.source !== WorkingCopyHistoryModel.FILE_SAVED_SOURCE ? entry.source : undefined,
                        timestamp: entry.timestamp
                    };
                })
            };
            await this.fileService.writeFile(historyEntriesListingFile, buffer_1.VSBuffer.fromString(JSON.stringify(serializedModel)));
        }
        async readEntriesFile() {
            const historyEntriesListingFile = (0, types_1.assertIsDefined)(this.historyEntriesListingFile);
            let serializedModel = undefined;
            try {
                serializedModel = JSON.parse((await this.fileService.readFile(historyEntriesListingFile)).value.toString());
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            return serializedModel;
        }
        async readEntriesFolder() {
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            const historyEntriesNameMatcher = (0, types_1.assertIsDefined)(this.historyEntriesNameMatcher);
            let rawEntries = undefined;
            // Resolve children of folder on disk
            try {
                rawEntries = (await this.fileService.resolve(historyEntriesFolder, { resolveMetadata: true })).children;
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            if (!rawEntries) {
                return undefined;
            }
            // Skip entries that do not seem to have valid file name
            return rawEntries.filter(entry => !(0, resources_1.isEqual)(entry.resource, this.historyEntriesListingFile) && // not the listings file
                historyEntriesNameMatcher.test(entry.name) // matching our expected file pattern for entries
            );
        }
        traceError(error) {
            this.logService.trace('[Working Copy History Service]', error);
        }
    }
    exports.WorkingCopyHistoryModel = WorkingCopyHistoryModel;
    WorkingCopyHistoryModel.ENTRIES_FILE = 'entries.json';
    WorkingCopyHistoryModel.FILE_SAVED_SOURCE = editor_1.SaveSourceRegistry.registerSource('default.source', (0, nls_1.localize)('default.source', "File Saved"));
    WorkingCopyHistoryModel.SETTINGS = {
        MAX_ENTRIES: 'workbench.localHistory.maxFileEntries',
        MERGE_PERIOD: 'workbench.localHistory.mergeWindow'
    };
    let WorkingCopyHistoryService = class WorkingCopyHistoryService extends lifecycle_1.Disposable {
        constructor(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService) {
            super();
            this.fileService = fileService;
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
            this.labelService = labelService;
            this.logService = logService;
            this.configurationService = configurationService;
            this._onDidAddEntry = this._register(new event_1.Emitter());
            this.onDidAddEntry = this._onDidAddEntry.event;
            this._onDidChangeEntry = this._register(new event_1.Emitter());
            this.onDidChangeEntry = this._onDidChangeEntry.event;
            this._onDidReplaceEntry = this._register(new event_1.Emitter());
            this.onDidReplaceEntry = this._onDidReplaceEntry.event;
            this._onDidMoveEntries = this._register(new event_1.Emitter());
            this.onDidMoveEntries = this._onDidMoveEntries.event;
            this._onDidRemoveEntry = this._register(new event_1.Emitter());
            this.onDidRemoveEntry = this._onDidRemoveEntry.event;
            this._onDidRemoveEntries = this._register(new event_1.Emitter());
            this.onDidRemoveEntries = this._onDidRemoveEntries.event;
            this.localHistoryHome = new async_1.DeferredPromise();
            this.models = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.resolveLocalHistoryHome();
        }
        async resolveLocalHistoryHome() {
            let historyHome = undefined;
            // Prefer history to be stored in the remote if we are connected to a remote
            try {
                const remoteEnv = await this.remoteAgentService.getEnvironment();
                if (remoteEnv) {
                    historyHome = remoteEnv.localHistoryHome;
                }
            }
            catch (error) {
                this.logService.trace(error); // ignore and fallback to local
            }
            // But fallback to local if there is no remote
            if (!historyHome) {
                historyHome = this.environmentService.localHistoryHome;
            }
            this.localHistoryHome.complete(historyHome);
        }
        async moveEntries(source, target) {
            const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
            const promises = [];
            for (const [resource, model] of this.models) {
                if (!this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                    continue; // model does not match moved resource
                }
                // Determine new resulting target resource
                let targetResource;
                if (this.uriIdentityService.extUri.isEqual(source, resource)) {
                    targetResource = target; // file got moved
                }
                else {
                    const index = (0, extpath_1.indexOfPath)(resource.path, source.path);
                    targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                }
                // Figure out save source
                let saveSource;
                if (this.uriIdentityService.extUri.isEqual((0, resources_1.dirname)(resource), (0, resources_1.dirname)(targetResource))) {
                    saveSource = WorkingCopyHistoryService.FILE_RENAMED_SOURCE;
                }
                else {
                    saveSource = WorkingCopyHistoryService.FILE_MOVED_SOURCE;
                }
                // Move entries to target queued
                promises.push(limiter.queue(() => this.doMoveEntries(model, saveSource, resource, targetResource)));
            }
            if (!promises.length) {
                return [];
            }
            // Await move operations
            const resources = await Promise.all(promises);
            // Events
            this._onDidMoveEntries.fire();
            return resources;
        }
        async doMoveEntries(model, source, sourceWorkingCopyResource, targetWorkingCopyResource) {
            // Move to target via model
            await model.moveEntries(targetWorkingCopyResource, source, cancellation_1.CancellationToken.None);
            // Update model in our map
            this.models.delete(sourceWorkingCopyResource);
            this.models.set(targetWorkingCopyResource, model);
            return targetWorkingCopyResource;
        }
        async addEntry({ resource, source, timestamp }, token) {
            if (!this.fileService.hasProvider(resource)) {
                return undefined; // we require the working copy resource to be file service accessible
            }
            // Resolve history model for working copy
            const model = await this.getModel(resource);
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Add to model
            return model.addEntry(source, timestamp, token);
        }
        async updateEntry(entry, properties, token) {
            // Resolve history model for working copy
            const model = await this.getModel(entry.workingCopy.resource);
            if (token.isCancellationRequested) {
                return;
            }
            // Rename in model
            return model.updateEntry(entry, properties, token);
        }
        async removeEntry(entry, token) {
            // Resolve history model for working copy
            const model = await this.getModel(entry.workingCopy.resource);
            if (token.isCancellationRequested) {
                return false;
            }
            // Remove from model
            return model.removeEntry(entry, token);
        }
        async removeAll(token) {
            const historyHome = await this.localHistoryHome.p;
            if (token.isCancellationRequested) {
                return;
            }
            // Clear models
            this.models.clear();
            // Remove from disk
            await this.fileService.del(historyHome, { recursive: true });
            // Events
            this._onDidRemoveEntries.fire();
        }
        async getEntries(resource, token) {
            const model = await this.getModel(resource);
            if (token.isCancellationRequested) {
                return [];
            }
            const entries = await model.getEntries();
            return entries !== null && entries !== void 0 ? entries : [];
        }
        async getAll(token) {
            const historyHome = await this.localHistoryHome.p;
            if (token.isCancellationRequested) {
                return [];
            }
            const all = new map_1.ResourceMap();
            // Fill in all known model resources (they might not have yet persisted to disk)
            for (const [resource, model] of this.models) {
                const hasInMemoryEntries = await model.hasEntries(true /* skip resolving because we resolve below from disk */);
                if (hasInMemoryEntries) {
                    all.set(resource, true);
                }
            }
            // Resolve all other resources by iterating the history home folder
            try {
                const resolvedHistoryHome = await this.fileService.resolve(historyHome);
                if (resolvedHistoryHome.children) {
                    const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
                    const promises = [];
                    for (const child of resolvedHistoryHome.children) {
                        promises.push(limiter.queue(async () => {
                            if (token.isCancellationRequested) {
                                return;
                            }
                            try {
                                const serializedModel = JSON.parse((await this.fileService.readFile((0, resources_1.joinPath)(child.resource, WorkingCopyHistoryModel.ENTRIES_FILE))).value.toString());
                                if (serializedModel.entries.length > 0) {
                                    all.set(uri_1.URI.parse(serializedModel.resource), true);
                                }
                            }
                            catch (error) {
                                // ignore - model might be missing or corrupt, but we need it
                            }
                        }));
                    }
                    await Promise.all(promises);
                }
            }
            catch (error) {
                // ignore - history might be entirely empty
            }
            return Array.from(all.keys());
        }
        async getModel(resource) {
            const historyHome = await this.localHistoryHome.p;
            let model = this.models.get(resource);
            if (!model) {
                model = new WorkingCopyHistoryModel(resource, historyHome, this._onDidAddEntry, this._onDidChangeEntry, this._onDidReplaceEntry, this._onDidRemoveEntry, this.getModelOptions(), this.fileService, this.labelService, this.logService, this.configurationService);
                this.models.set(resource, model);
            }
            return model;
        }
    };
    WorkingCopyHistoryService.FILE_MOVED_SOURCE = editor_1.SaveSourceRegistry.registerSource('moved.source', (0, nls_1.localize)('moved.source', "File Moved"));
    WorkingCopyHistoryService.FILE_RENAMED_SOURCE = editor_1.SaveSourceRegistry.registerSource('renamed.source', (0, nls_1.localize)('renamed.source', "File Renamed"));
    WorkingCopyHistoryService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, configuration_1.IConfigurationService)
    ], WorkingCopyHistoryService);
    exports.WorkingCopyHistoryService = WorkingCopyHistoryService;
    // Register History Tracker
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(workingCopyHistoryTracker_1.WorkingCopyHistoryTracker, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=workingCopyHistoryService.js.map