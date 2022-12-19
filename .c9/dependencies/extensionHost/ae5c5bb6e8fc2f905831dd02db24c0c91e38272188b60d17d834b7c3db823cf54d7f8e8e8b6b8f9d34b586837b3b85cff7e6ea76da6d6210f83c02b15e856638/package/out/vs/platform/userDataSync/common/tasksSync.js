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
define(["require", "exports", "vs/base/common/buffer", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, buffer_1, configuration_1, environment_1, files_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TasksInitializer = exports.TasksSynchroniser = exports.getTasksContentFromSyncContent = void 0;
    function getTasksContentFromSyncContent(syncContent, logService) {
        try {
            const parsed = JSON.parse(syncContent);
            return parsed.tasks;
        }
        catch (e) {
            logService.error(e);
            return null;
        }
    }
    exports.getTasksContentFromSyncContent = getTasksContentFromSyncContent;
    let TasksSynchroniser = class TasksSynchroniser extends abstractSynchronizer_1.AbstractFileSynchroniser {
        constructor(userDataSyncStoreService, userDataSyncBackupStoreService, logService, configurationService, userDataSyncEnablementService, fileService, environmentService, storageService, telemetryService, uriIdentityService) {
            super(uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(environmentService.settingsResource), 'tasks.json'), "tasks" /* SyncResource.Tasks */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.version = 1;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'tasks.json');
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration) {
            const remoteContent = remoteUserData.syncData ? getTasksContentFromSyncContent(remoteUserData.syncData.content, this.logService) : null;
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSyncContent = (lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.syncData) ? getTasksContentFromSyncContent(lastSyncUserData.syncData.content, this.logService) : null;
            // Get file content last to get the latest
            const fileContent = await this.getLocalFileContent();
            let content = null;
            let hasLocalChanged = false;
            let hasRemoteChanged = false;
            let hasConflicts = false;
            if (remoteContent) {
                const localContent = fileContent ? fileContent.value.toString() : null;
                if (!lastSyncContent // First time sync
                    || lastSyncContent !== localContent // Local has forwarded
                    || lastSyncContent !== remoteContent // Remote has forwarded
                ) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Merging remote tasks with local tasks...`);
                    const result = merge(localContent, remoteContent, lastSyncContent);
                    content = result.content;
                    hasConflicts = result.hasConflicts;
                    hasLocalChanged = result.hasLocalChanged;
                    hasRemoteChanged = result.hasRemoteChanged;
                }
            }
            // First time syncing to remote
            else if (fileContent) {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote tasks does not exist. Synchronizing tasks for the first time.`);
                content = fileContent.value.toString();
                hasRemoteChanged = true;
            }
            const previewResult = {
                content,
                localChange: hasLocalChanged ? fileContent ? 2 /* Change.Modified */ : 1 /* Change.Added */ : 0 /* Change.None */,
                remoteChange: hasRemoteChanged ? 2 /* Change.Modified */ : 0 /* Change.None */,
                hasConflicts
            };
            return [{
                    fileContent,
                    localResource: this.localResource,
                    localContent: fileContent ? fileContent.value.toString() : null,
                    localChange: previewResult.localChange,
                    remoteResource: this.remoteResource,
                    remoteContent,
                    remoteChange: previewResult.remoteChange,
                    previewResource: this.previewResource,
                    previewResult,
                    acceptedResource: this.acceptedResource,
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncContent = (lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.syncData) ? getTasksContentFromSyncContent(lastSyncUserData.syncData.content, this.logService) : null;
            if (lastSyncContent === null) {
                return true;
            }
            const fileContent = await this.getLocalFileContent();
            const localContent = fileContent ? fileContent.value.toString() : null;
            const result = merge(localContent, lastSyncContent, lastSyncContent);
            return result.hasLocalChanged || result.hasRemoteChanged;
        }
        async getMergeResult(resourcePreview, token) {
            return resourcePreview.previewResult;
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            /* Accept local resource */
            if (this.extUri.isEqual(resource, this.localResource)) {
                return {
                    content: resourcePreview.fileContent ? resourcePreview.fileContent.value.toString() : null,
                    localChange: 0 /* Change.None */,
                    remoteChange: 2 /* Change.Modified */,
                };
            }
            /* Accept remote resource */
            if (this.extUri.isEqual(resource, this.remoteResource)) {
                return {
                    content: resourcePreview.remoteContent,
                    localChange: 2 /* Change.Modified */,
                    remoteChange: 0 /* Change.None */,
                };
            }
            /* Accept preview resource */
            if (this.extUri.isEqual(resource, this.previewResource)) {
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
                        localChange: 2 /* Change.Modified */,
                        remoteChange: 2 /* Change.Modified */,
                    };
                }
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            const { fileContent } = resourcePreviews[0][0];
            let { content, localChange, remoteChange } = resourcePreviews[0][1];
            if (localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing tasks.`);
            }
            if (localChange !== 0 /* Change.None */) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating local tasks...`);
                if (fileContent) {
                    await this.backupLocal(JSON.stringify(this.toTasksSyncContent(fileContent.value.toString())));
                }
                await this.updateLocalFileContent(content || '{}', fileContent, force);
                this.logService.info(`${this.syncResourceLogLabel}: Updated local tasks`);
            }
            if (remoteChange !== 0 /* Change.None */) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote tasks...`);
                const remoteContents = JSON.stringify(this.toTasksSyncContent(content || '{}'));
                remoteUserData = await this.updateRemoteUserData(remoteContents, force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote tasks`);
            }
            // Delete the preview
            try {
                await this.fileService.del(this.previewResource);
            }
            catch (e) { /* ignore */ }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized tasks...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized tasks`);
            }
        }
        async hasLocalData() {
            return this.fileService.exists(this.file);
        }
        async getAssociatedResources({ uri }) {
            const comparableResource = (await this.fileService.exists(this.file)) ? this.file : this.localResource;
            return [{ resource: this.extUri.joinPath(uri, 'tasks.json'), comparableResource }];
        }
        async resolveContent(uri) {
            if (this.extUri.isEqual(this.remoteResource, uri) || this.extUri.isEqual(this.localResource, uri) || this.extUri.isEqual(this.acceptedResource, uri)) {
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
                    switch (this.extUri.basename(uri)) {
                        case 'tasks.json':
                            return getTasksContentFromSyncContent(syncData.content, this.logService);
                    }
                }
            }
            return null;
        }
        toTasksSyncContent(tasks) {
            return { tasks };
        }
    };
    TasksSynchroniser = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, userDataSync_1.IUserDataSyncEnablementService),
        __param(5, files_1.IFileService),
        __param(6, environment_1.IEnvironmentService),
        __param(7, storage_1.IStorageService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], TasksSynchroniser);
    exports.TasksSynchroniser = TasksSynchroniser;
    let TasksInitializer = class TasksInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(fileService, environmentService, logService, uriIdentityService) {
            super("tasks" /* SyncResource.Tasks */, environmentService, logService, fileService, uriIdentityService);
            this.uriIdentityService = uriIdentityService;
            this.tasksResource = this.uriIdentityService.extUri.joinPath(this.uriIdentityService.extUri.dirname(this.environmentService.settingsResource), 'tasks.json');
        }
        async doInitialize(remoteUserData) {
            const tasksContent = remoteUserData.syncData ? getTasksContentFromSyncContent(remoteUserData.syncData.content, this.logService) : null;
            if (!tasksContent) {
                this.logService.info('Skipping initializing tasks because remote tasks does not exist.');
                return;
            }
            const isEmpty = await this.isEmpty();
            if (!isEmpty) {
                this.logService.info('Skipping initializing tasks because local tasks exist.');
                return;
            }
            await this.fileService.writeFile(this.tasksResource, buffer_1.VSBuffer.fromString(tasksContent));
            await this.updateLastSyncUserData(remoteUserData);
        }
        async isEmpty() {
            return this.fileService.exists(this.tasksResource);
        }
    };
    TasksInitializer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], TasksInitializer);
    exports.TasksInitializer = TasksInitializer;
    function merge(originalLocalContent, originalRemoteContent, baseContent) {
        /* no changes */
        if (originalLocalContent === null && originalRemoteContent === null && baseContent === null) {
            return { content: null, hasLocalChanged: false, hasRemoteChanged: false, hasConflicts: false };
        }
        /* no changes */
        if (originalLocalContent === originalRemoteContent) {
            return { content: null, hasLocalChanged: false, hasRemoteChanged: false, hasConflicts: false };
        }
        const localForwarded = baseContent !== originalLocalContent;
        const remoteForwarded = baseContent !== originalRemoteContent;
        /* no changes */
        if (!localForwarded && !remoteForwarded) {
            return { content: null, hasLocalChanged: false, hasRemoteChanged: false, hasConflicts: false };
        }
        /* local has changed and remote has not */
        if (localForwarded && !remoteForwarded) {
            return { content: originalLocalContent, hasRemoteChanged: true, hasLocalChanged: false, hasConflicts: false };
        }
        /* remote has changed and local has not */
        if (remoteForwarded && !localForwarded) {
            return { content: originalRemoteContent, hasLocalChanged: true, hasRemoteChanged: false, hasConflicts: false };
        }
        return { content: originalLocalContent, hasLocalChanged: true, hasRemoteChanged: true, hasConflicts: true };
    }
});
//# sourceMappingURL=tasksSync.js.map