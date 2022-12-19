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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/snippetsMerge", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, buffer_1, event_1, objects_1, configuration_1, environment_1, files_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, snippetsMerge_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetsInitializer = exports.SnippetsSynchroniser = void 0;
    let SnippetsSynchroniser = class SnippetsSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(environmentService, fileService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, logService, configurationService, userDataSyncEnablementService, telemetryService, uriIdentityService) {
            super("snippets" /* SyncResource.Snippets */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.version = 1;
            this.snippetsFolder = environmentService.snippetsHome;
            this._register(this.fileService.watch(environmentService.userRoamingDataHome));
            this._register(this.fileService.watch(this.snippetsFolder));
            this._register(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.affects(this.snippetsFolder))(() => this.triggerLocalChange()));
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine) {
            const local = await this.getSnippetsFileContents();
            const localSnippets = this.toSnippetsContents(local);
            const remoteSnippets = remoteUserData.syncData ? this.parseSnippets(remoteUserData.syncData) : null;
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSyncSnippets = lastSyncUserData && lastSyncUserData.syncData ? this.parseSnippets(lastSyncUserData.syncData) : null;
            if (remoteSnippets) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote snippets with local snippets...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote snippets does not exist. Synchronizing snippets for the first time.`);
            }
            const mergeResult = (0, snippetsMerge_1.merge)(localSnippets, remoteSnippets, lastSyncSnippets);
            return this.getResourcePreviews(mergeResult, local, remoteSnippets || {});
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncSnippets = lastSyncUserData.syncData ? this.parseSnippets(lastSyncUserData.syncData) : null;
            if (lastSyncSnippets === null) {
                return true;
            }
            const local = await this.getSnippetsFileContents();
            const localSnippets = this.toSnippetsContents(local);
            const mergeResult = (0, snippetsMerge_1.merge)(localSnippets, lastSyncSnippets, lastSyncSnippets);
            return Object.keys(mergeResult.remote.added).length > 0 || Object.keys(mergeResult.remote.updated).length > 0 || mergeResult.remote.removed.length > 0 || mergeResult.conflicts.length > 0;
        }
        async getMergeResult(resourcePreview, token) {
            return resourcePreview.previewResult;
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            /* Accept local resource */
            if (this.extUri.isEqualOrParent(resource, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }))) {
                return {
                    content: resourcePreview.fileContent ? resourcePreview.fileContent.value.toString() : null,
                    localChange: 0 /* Change.None */,
                    remoteChange: resourcePreview.fileContent
                        ? resourcePreview.remoteContent !== null ? 2 /* Change.Modified */ : 1 /* Change.Added */
                        : 3 /* Change.Deleted */
                };
            }
            /* Accept remote resource */
            if (this.extUri.isEqualOrParent(resource, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }))) {
                return {
                    content: resourcePreview.remoteContent,
                    localChange: resourcePreview.remoteContent !== null
                        ? resourcePreview.fileContent ? 2 /* Change.Modified */ : 1 /* Change.Added */
                        : 3 /* Change.Deleted */,
                    remoteChange: 0 /* Change.None */,
                };
            }
            /* Accept preview resource */
            if (this.extUri.isEqualOrParent(resource, this.syncPreviewFolder)) {
                if (content === undefined) {
                    return {
                        content: resourcePreview.previewResult.content,
                        localChange: resourcePreview.previewResult.localChange,
                        remoteChange: resourcePreview.previewResult.remoteChange,
                    };
                }
                else {
                    return {
                        content,
                        localChange: content === null
                            ? resourcePreview.fileContent !== null ? 3 /* Change.Deleted */ : 0 /* Change.None */
                            : 2 /* Change.Modified */,
                        remoteChange: content === null
                            ? resourcePreview.remoteContent !== null ? 3 /* Change.Deleted */ : 0 /* Change.None */
                            : 2 /* Change.Modified */
                    };
                }
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            const accptedResourcePreviews = resourcePreviews.map(([resourcePreview, acceptResult]) => (Object.assign(Object.assign({}, resourcePreview), { acceptResult })));
            if (accptedResourcePreviews.every(({ localChange, remoteChange }) => localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */)) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing snippets.`);
            }
            if (accptedResourcePreviews.some(({ localChange }) => localChange !== 0 /* Change.None */)) {
                // back up all snippets
                await this.updateLocalBackup(accptedResourcePreviews);
                await this.updateLocalSnippets(accptedResourcePreviews, force);
            }
            if (accptedResourcePreviews.some(({ remoteChange }) => remoteChange !== 0 /* Change.None */)) {
                remoteUserData = await this.updateRemoteSnippets(accptedResourcePreviews, remoteUserData, force);
            }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized snippets...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized snippets`);
            }
            for (const { previewResource } of accptedResourcePreviews) {
                // Delete the preview
                try {
                    await this.fileService.del(previewResource);
                }
                catch (e) { /* ignore */ }
            }
        }
        getResourcePreviews(snippetsMergeResult, localFileContent, remoteSnippets) {
            const resourcePreviews = new Map();
            /* Snippets added remotely -> add locally */
            for (const key of Object.keys(snippetsMergeResult.local.added)) {
                const previewResult = {
                    content: snippetsMergeResult.local.added[key],
                    hasConflicts: false,
                    localChange: 1 /* Change.Added */,
                    remoteChange: 0 /* Change.None */,
                };
                resourcePreviews.set(key, {
                    fileContent: null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    localContent: null,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets updated remotely -> update locally */
            for (const key of Object.keys(snippetsMergeResult.local.updated)) {
                const previewResult = {
                    content: snippetsMergeResult.local.updated[key],
                    hasConflicts: false,
                    localChange: 2 /* Change.Modified */,
                    remoteChange: 0 /* Change.None */,
                };
                resourcePreviews.set(key, {
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent: localFileContent[key].value.toString(),
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets removed remotely -> remove locally */
            for (const key of snippetsMergeResult.local.removed) {
                const previewResult = {
                    content: null,
                    hasConflicts: false,
                    localChange: 3 /* Change.Deleted */,
                    remoteChange: 0 /* Change.None */,
                };
                resourcePreviews.set(key, {
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent: localFileContent[key].value.toString(),
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: null,
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets added locally -> add remotely */
            for (const key of Object.keys(snippetsMergeResult.remote.added)) {
                const previewResult = {
                    content: snippetsMergeResult.remote.added[key],
                    hasConflicts: false,
                    localChange: 0 /* Change.None */,
                    remoteChange: 1 /* Change.Added */,
                };
                resourcePreviews.set(key, {
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent: localFileContent[key].value.toString(),
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: null,
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets updated locally -> update remotely */
            for (const key of Object.keys(snippetsMergeResult.remote.updated)) {
                const previewResult = {
                    content: snippetsMergeResult.remote.updated[key],
                    hasConflicts: false,
                    localChange: 0 /* Change.None */,
                    remoteChange: 2 /* Change.Modified */,
                };
                resourcePreviews.set(key, {
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent: localFileContent[key].value.toString(),
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets removed locally -> remove remotely */
            for (const key of snippetsMergeResult.remote.removed) {
                const previewResult = {
                    content: null,
                    hasConflicts: false,
                    localChange: 0 /* Change.None */,
                    remoteChange: 3 /* Change.Deleted */,
                };
                resourcePreviews.set(key, {
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: null,
                    localContent: null,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets with conflicts */
            for (const key of snippetsMergeResult.conflicts) {
                const previewResult = {
                    content: localFileContent[key] ? localFileContent[key].value.toString() : null,
                    hasConflicts: true,
                    localChange: localFileContent[key] ? 2 /* Change.Modified */ : 1 /* Change.Added */,
                    remoteChange: remoteSnippets[key] ? 2 /* Change.Modified */ : 1 /* Change.Added */
                };
                resourcePreviews.set(key, {
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key] || null,
                    localContent: localFileContent[key] ? localFileContent[key].value.toString() : null,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key] || null,
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Unmodified Snippets */
            for (const key of Object.keys(localFileContent)) {
                if (!resourcePreviews.has(key)) {
                    const previewResult = {
                        content: localFileContent[key] ? localFileContent[key].value.toString() : null,
                        hasConflicts: false,
                        localChange: 0 /* Change.None */,
                        remoteChange: 0 /* Change.None */
                    };
                    resourcePreviews.set(key, {
                        localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                        fileContent: localFileContent[key] || null,
                        localContent: localFileContent[key] ? localFileContent[key].value.toString() : null,
                        remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                        remoteContent: remoteSnippets[key] || null,
                        previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                        previewResult,
                        localChange: previewResult.localChange,
                        remoteChange: previewResult.remoteChange,
                        acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                    });
                }
            }
            return [...resourcePreviews.values()];
        }
        async getAssociatedResources({ uri }) {
            let content = await super.resolveContent(uri);
            if (content) {
                const syncData = this.parseSyncData(content);
                if (syncData) {
                    const snippets = this.parseSnippets(syncData);
                    const result = [];
                    for (const snippet of Object.keys(snippets)) {
                        const resource = this.extUri.joinPath(uri, snippet);
                        const comparableResource = this.extUri.joinPath(this.snippetsFolder, snippet);
                        const exists = await this.fileService.exists(comparableResource);
                        result.push({ resource, comparableResource: exists ? comparableResource : this.extUri.joinPath(this.syncPreviewFolder, snippet).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }) });
                    }
                    return result;
                }
            }
            return [];
        }
        async resolveContent(uri) {
            if (this.extUri.isEqualOrParent(uri, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }))
                || this.extUri.isEqualOrParent(uri, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }))
                || this.extUri.isEqualOrParent(uri, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' }))) {
                return this.resolvePreviewContent(uri);
            }
            let content = await super.resolveContent(uri);
            if (content) {
                return content;
            }
            content = await super.resolveContent(this.extUri.dirname(uri));
            if (content) {
                const syncData = this.parseSyncData(content);
                if (syncData) {
                    const snippets = this.parseSnippets(syncData);
                    return snippets[this.extUri.basename(uri)] || null;
                }
            }
            return null;
        }
        async hasLocalData() {
            try {
                const localSnippets = await this.getSnippetsFileContents();
                if (Object.keys(localSnippets).length) {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
        async updateLocalBackup(resourcePreviews) {
            const local = {};
            for (const resourcePreview of resourcePreviews) {
                if (resourcePreview.fileContent) {
                    local[this.extUri.basename(resourcePreview.localResource)] = resourcePreview.fileContent;
                }
            }
            await this.backupLocal(JSON.stringify(this.toSnippetsContents(local)));
        }
        async updateLocalSnippets(resourcePreviews, force) {
            for (const { fileContent, acceptResult, localResource, remoteResource, localChange } of resourcePreviews) {
                if (localChange !== 0 /* Change.None */) {
                    const key = remoteResource ? this.extUri.basename(remoteResource) : this.extUri.basename(localResource);
                    const resource = this.extUri.joinPath(this.snippetsFolder, key);
                    // Removed
                    if (localChange === 3 /* Change.Deleted */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Deleting snippet...`, this.extUri.basename(resource));
                        await this.fileService.del(resource);
                        this.logService.info(`${this.syncResourceLogLabel}: Deleted snippet`, this.extUri.basename(resource));
                    }
                    // Added
                    else if (localChange === 1 /* Change.Added */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Creating snippet...`, this.extUri.basename(resource));
                        await this.fileService.createFile(resource, buffer_1.VSBuffer.fromString(acceptResult.content), { overwrite: force });
                        this.logService.info(`${this.syncResourceLogLabel}: Created snippet`, this.extUri.basename(resource));
                    }
                    // Updated
                    else {
                        this.logService.trace(`${this.syncResourceLogLabel}: Updating snippet...`, this.extUri.basename(resource));
                        await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(acceptResult.content), force ? undefined : fileContent);
                        this.logService.info(`${this.syncResourceLogLabel}: Updated snippet`, this.extUri.basename(resource));
                    }
                }
            }
        }
        async updateRemoteSnippets(resourcePreviews, remoteUserData, forcePush) {
            const currentSnippets = remoteUserData.syncData ? this.parseSnippets(remoteUserData.syncData) : {};
            const newSnippets = (0, objects_1.deepClone)(currentSnippets);
            for (const { acceptResult, localResource, remoteResource, remoteChange } of resourcePreviews) {
                if (remoteChange !== 0 /* Change.None */) {
                    const key = localResource ? this.extUri.basename(localResource) : this.extUri.basename(remoteResource);
                    if (remoteChange === 3 /* Change.Deleted */) {
                        delete newSnippets[key];
                    }
                    else {
                        newSnippets[key] = acceptResult.content;
                    }
                }
            }
            if (!(0, snippetsMerge_1.areSame)(currentSnippets, newSnippets)) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote snippets...`);
                remoteUserData = await this.updateRemoteUserData(JSON.stringify(newSnippets), forcePush ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote snippets`);
            }
            return remoteUserData;
        }
        parseSnippets(syncData) {
            return JSON.parse(syncData.content);
        }
        toSnippetsContents(snippetsFileContents) {
            const snippets = {};
            for (const key of Object.keys(snippetsFileContents)) {
                snippets[key] = snippetsFileContents[key].value.toString();
            }
            return snippets;
        }
        async getSnippetsFileContents() {
            const snippets = {};
            let stat;
            try {
                stat = await this.fileService.resolve(this.snippetsFolder);
            }
            catch (e) {
                // No snippets
                if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return snippets;
                }
                else {
                    throw e;
                }
            }
            for (const entry of stat.children || []) {
                const resource = entry.resource;
                const extension = this.extUri.extname(resource);
                if (extension === '.json' || extension === '.code-snippets') {
                    const key = this.extUri.relativePath(this.snippetsFolder, resource);
                    const content = await this.fileService.readFile(resource);
                    snippets[key] = content;
                }
            }
            return snippets;
        }
    };
    SnippetsSynchroniser = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(5, userDataSync_1.IUserDataSyncLogService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], SnippetsSynchroniser);
    exports.SnippetsSynchroniser = SnippetsSynchroniser;
    let SnippetsInitializer = class SnippetsInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(fileService, environmentService, logService, uriIdentityService) {
            super("snippets" /* SyncResource.Snippets */, environmentService, logService, fileService, uriIdentityService);
        }
        async doInitialize(remoteUserData) {
            const remoteSnippets = remoteUserData.syncData ? JSON.parse(remoteUserData.syncData.content) : null;
            if (!remoteSnippets) {
                this.logService.info('Skipping initializing snippets because remote snippets does not exist.');
                return;
            }
            const isEmpty = await this.isEmpty();
            if (!isEmpty) {
                this.logService.info('Skipping initializing snippets because local snippets exist.');
                return;
            }
            for (const key of Object.keys(remoteSnippets)) {
                const content = remoteSnippets[key];
                if (content) {
                    const resource = this.extUri.joinPath(this.environmentService.snippetsHome, key);
                    await this.fileService.createFile(resource, buffer_1.VSBuffer.fromString(content));
                    this.logService.info('Created snippet', this.extUri.basename(resource));
                }
            }
            await this.updateLastSyncUserData(remoteUserData);
        }
        async isEmpty() {
            var _a;
            try {
                const stat = await this.fileService.resolve(this.environmentService.snippetsHome);
                return !((_a = stat.children) === null || _a === void 0 ? void 0 : _a.length);
            }
            catch (error) {
                return error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */;
            }
        }
    };
    SnippetsInitializer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], SnippetsInitializer);
    exports.SnippetsInitializer = SnippetsInitializer;
});
//# sourceMappingURL=snippetsSync.js.map