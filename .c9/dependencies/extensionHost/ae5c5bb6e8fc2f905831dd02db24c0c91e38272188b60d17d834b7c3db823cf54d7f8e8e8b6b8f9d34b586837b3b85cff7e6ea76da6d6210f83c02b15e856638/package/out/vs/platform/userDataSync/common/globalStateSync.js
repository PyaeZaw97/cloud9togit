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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/json", "vs/base/common/jsonFormatter", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/content", "vs/platform/userDataSync/common/globalStateMerge", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, buffer_1, errors_1, event_1, json_1, jsonFormatter_1, platform_1, uri_1, uuid_1, configuration_1, environment_1, files_1, log_1, serviceMachineId_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, content_1, globalStateMerge_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncStoreTypeSynchronizer = exports.GlobalStateInitializer = exports.GlobalStateSynchroniser = void 0;
    const argvStoragePrefx = 'globalState.argv.';
    const argvProperties = ['locale'];
    function stringify(globalState, format) {
        const storageKeys = globalState.storage ? Object.keys(globalState.storage).sort() : [];
        const storage = {};
        storageKeys.forEach(key => storage[key] = globalState.storage[key]);
        globalState.storage = storage;
        return format ? (0, jsonFormatter_1.toFormattedString)(globalState, {}) : JSON.stringify(globalState);
    }
    const GLOBAL_STATE_DATA_VERSION = 1;
    /**
     * Synchronises global state that includes
     * 	- Global storage with user scope
     * 	- Locale from argv properties
     *
     * Global storage is synced without checking version just like other resources (settings, keybindings).
     * If there is a change in format of the value of a storage key which requires migration then
     * 		Owner of that key should remove that key from user scope and replace that with new user scoped key.
     */
    let GlobalStateSynchroniser = class GlobalStateSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(fileService, userDataSyncStoreService, userDataSyncBackupStoreService, logService, environmentService, userDataSyncEnablementService, telemetryService, configurationService, storageService, uriIdentityService) {
            super("globalState" /* SyncResource.GlobalState */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.storageService = storageService;
            this.version = GLOBAL_STATE_DATA_VERSION;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'globalState.json');
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
            this._register(fileService.watch(this.extUri.dirname(this.environmentService.argvResource)));
            this._register(event_1.Event.any(
            /* Locale change */
            event_1.Event.filter(fileService.onDidFilesChange, e => e.contains(this.environmentService.argvResource)), 
            /* Global storage with user target has changed */
            event_1.Event.filter(storageService.onDidChangeValue, e => e.scope === 0 /* StorageScope.GLOBAL */ && e.target !== undefined ? e.target === 0 /* StorageTarget.USER */ : storageService.keys(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */).includes(e.key)), 
            /* Storage key target has changed */
            this.storageService.onDidChangeTarget)((() => this.triggerLocalChange())));
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine) {
            const remoteGlobalState = remoteUserData.syncData ? JSON.parse(remoteUserData.syncData.content) : null;
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSyncGlobalState = lastSyncUserData && lastSyncUserData.syncData ? JSON.parse(lastSyncUserData.syncData.content) : null;
            const localGlobalState = await this.getLocalGlobalState();
            if (remoteGlobalState) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote ui state with local ui state...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote ui state does not exist. Synchronizing ui state for the first time.`);
            }
            const storageKeys = this.getStorageKeys(lastSyncGlobalState);
            const { local, remote } = (0, globalStateMerge_1.merge)(localGlobalState.storage, remoteGlobalState ? remoteGlobalState.storage : null, lastSyncGlobalState ? lastSyncGlobalState.storage : null, storageKeys, this.logService);
            const previewResult = {
                content: null,
                local,
                remote,
                localChange: Object.keys(local.added).length > 0 || Object.keys(local.updated).length > 0 || local.removed.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
            };
            return [{
                    localResource: this.localResource,
                    localContent: stringify(localGlobalState, false),
                    localUserData: localGlobalState,
                    remoteResource: this.remoteResource,
                    remoteContent: remoteGlobalState ? stringify(remoteGlobalState, false) : null,
                    previewResource: this.previewResource,
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.acceptedResource,
                    storageKeys
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncGlobalState = lastSyncUserData.syncData ? JSON.parse(lastSyncUserData.syncData.content) : null;
            if (lastSyncGlobalState === null) {
                return true;
            }
            const localGlobalState = await this.getLocalGlobalState();
            const storageKeys = this.getStorageKeys(lastSyncGlobalState);
            const { remote } = (0, globalStateMerge_1.merge)(localGlobalState.storage, lastSyncGlobalState.storage, lastSyncGlobalState.storage, storageKeys, this.logService);
            return remote !== null;
        }
        async getMergeResult(resourcePreview, token) {
            return Object.assign(Object.assign({}, resourcePreview.previewResult), { hasConflicts: false });
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            /* Accept local resource */
            if (this.extUri.isEqual(resource, this.localResource)) {
                return this.acceptLocal(resourcePreview);
            }
            /* Accept remote resource */
            if (this.extUri.isEqual(resource, this.remoteResource)) {
                return this.acceptRemote(resourcePreview);
            }
            /* Accept preview resource */
            if (this.extUri.isEqual(resource, this.previewResource)) {
                return resourcePreview.previewResult;
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async acceptLocal(resourcePreview) {
            return {
                content: resourcePreview.localContent,
                local: { added: {}, removed: [], updated: {} },
                remote: resourcePreview.localUserData.storage,
                localChange: 0 /* Change.None */,
                remoteChange: 2 /* Change.Modified */,
            };
        }
        async acceptRemote(resourcePreview) {
            if (resourcePreview.remoteContent !== null) {
                const remoteGlobalState = JSON.parse(resourcePreview.remoteContent);
                const { local, remote } = (0, globalStateMerge_1.merge)(resourcePreview.localUserData.storage, remoteGlobalState.storage, null, resourcePreview.storageKeys, this.logService);
                return {
                    content: resourcePreview.remoteContent,
                    local,
                    remote,
                    localChange: Object.keys(local.added).length > 0 || Object.keys(local.updated).length > 0 || local.removed.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                    remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
                };
            }
            else {
                return {
                    content: resourcePreview.remoteContent,
                    local: { added: {}, removed: [], updated: {} },
                    remote: null,
                    localChange: 0 /* Change.None */,
                    remoteChange: 0 /* Change.None */,
                };
            }
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            let { localUserData } = resourcePreviews[0][0];
            let { local, remote, localChange, remoteChange } = resourcePreviews[0][1];
            if (localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing ui state.`);
            }
            if (localChange !== 0 /* Change.None */) {
                // update local
                this.logService.trace(`${this.syncResourceLogLabel}: Updating local ui state...`);
                await this.backupLocal(JSON.stringify(localUserData));
                await this.writeLocalGlobalState(local);
                this.logService.info(`${this.syncResourceLogLabel}: Updated local ui state`);
            }
            if (remoteChange !== 0 /* Change.None */) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote ui state...`);
                const content = JSON.stringify({ storage: remote });
                remoteUserData = await this.updateRemoteUserData(content, force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote ui state`);
            }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized ui state...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized ui state`);
            }
        }
        async getAssociatedResources({ uri }) {
            return [{ resource: this.extUri.joinPath(uri, 'globalState.json'), comparableResource: GlobalStateSynchroniser.GLOBAL_STATE_DATA_URI }];
        }
        async resolveContent(uri) {
            if (this.extUri.isEqual(uri, GlobalStateSynchroniser.GLOBAL_STATE_DATA_URI)) {
                const localGlobalState = await this.getLocalGlobalState();
                return stringify(localGlobalState, true);
            }
            if (this.extUri.isEqual(this.remoteResource, uri) || this.extUri.isEqual(this.localResource, uri) || this.extUri.isEqual(this.acceptedResource, uri)) {
                const content = await this.resolvePreviewContent(uri);
                return content ? stringify(JSON.parse(content), true) : content;
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
                        case 'globalState.json':
                            return stringify(JSON.parse(syncData.content), true);
                    }
                }
            }
            return null;
        }
        async hasLocalData() {
            var _a;
            try {
                const { storage } = await this.getLocalGlobalState();
                if (Object.keys(storage).length > 1 || ((_a = storage[`${argvStoragePrefx}.locale`]) === null || _a === void 0 ? void 0 : _a.value) !== 'en') {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
        async getLocalGlobalState() {
            const storage = {};
            const argvContent = await this.getLocalArgvContent();
            const argvValue = (0, json_1.parse)(argvContent);
            for (const argvProperty of argvProperties) {
                if (argvValue[argvProperty] !== undefined) {
                    storage[`${argvStoragePrefx}${argvProperty}`] = { version: 1, value: argvValue[argvProperty] };
                }
            }
            for (const key of this.storageService.keys(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */)) {
                const value = this.storageService.get(key, 0 /* StorageScope.GLOBAL */);
                if (value) {
                    storage[key] = { version: 1, value };
                }
            }
            return { storage };
        }
        async getLocalArgvContent() {
            try {
                this.logService.debug('GlobalStateSync#getLocalArgvContent', this.environmentService.argvResource);
                const content = await this.fileService.readFile(this.environmentService.argvResource);
                this.logService.debug('GlobalStateSync#getLocalArgvContent - Resolved', this.environmentService.argvResource);
                return content.value.toString();
            }
            catch (error) {
                this.logService.debug((0, errors_1.getErrorMessage)(error));
            }
            return '{}';
        }
        async writeLocalGlobalState({ added, removed, updated }) {
            const argv = {};
            const updatedStorage = {};
            const handleUpdatedStorage = (keys, storage) => {
                for (const key of keys) {
                    if (key.startsWith(argvStoragePrefx)) {
                        argv[key.substring(argvStoragePrefx.length)] = storage ? storage[key].value : undefined;
                        continue;
                    }
                    if (storage) {
                        const storageValue = storage[key];
                        if (storageValue.value !== String(this.storageService.get(key, 0 /* StorageScope.GLOBAL */))) {
                            updatedStorage[key] = storageValue.value;
                        }
                    }
                    else {
                        if (this.storageService.get(key, 0 /* StorageScope.GLOBAL */) !== undefined) {
                            updatedStorage[key] = undefined;
                        }
                    }
                }
            };
            handleUpdatedStorage(Object.keys(added), added);
            handleUpdatedStorage(Object.keys(updated), updated);
            handleUpdatedStorage(removed);
            if (Object.keys(argv).length) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating locale...`);
                await this.updateArgv(argv);
                this.logService.info(`${this.syncResourceLogLabel}: Updated locale`);
            }
            const updatedStorageKeys = Object.keys(updatedStorage);
            if (updatedStorageKeys.length) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating global state...`);
                for (const key of Object.keys(updatedStorage)) {
                    this.storageService.store(key, updatedStorage[key], 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                }
                this.logService.info(`${this.syncResourceLogLabel}: Updated global state`, Object.keys(updatedStorage));
            }
        }
        async updateArgv(argv) {
            const argvContent = await this.getLocalArgvContent();
            let content = argvContent;
            for (const argvProperty of Object.keys(argv)) {
                content = (0, content_1.edit)(content, [argvProperty], argv[argvProperty], {});
            }
            if (argvContent !== content) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating locale...`);
                await this.fileService.writeFile(this.environmentService.argvResource, buffer_1.VSBuffer.fromString(content));
                this.logService.info(`${this.syncResourceLogLabel}: Updated locale.`);
            }
        }
        getStorageKeys(lastSyncGlobalState) {
            const user = this.storageService.keys(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            const machine = this.storageService.keys(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            const registered = [...user, ...machine];
            const unregistered = (lastSyncGlobalState === null || lastSyncGlobalState === void 0 ? void 0 : lastSyncGlobalState.storage) ? Object.keys(lastSyncGlobalState.storage).filter(key => !key.startsWith(argvStoragePrefx) && !registered.includes(key) && this.storageService.get(key, 0 /* StorageScope.GLOBAL */) !== undefined) : [];
            if (!platform_1.isWeb) {
                // Following keys are synced only in web. Do not sync these keys in other platforms
                const keysSyncedOnlyInWeb = [...userDataSync_1.ALL_SYNC_RESOURCES.map(resource => (0, userDataSync_1.getEnablementKey)(resource)), userDataSync_1.SYNC_SERVICE_URL_TYPE];
                unregistered.push(...keysSyncedOnlyInWeb);
                machine.push(...keysSyncedOnlyInWeb);
            }
            return { user, machine, unregistered };
        }
    };
    GlobalStateSynchroniser.GLOBAL_STATE_DATA_URI = uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'globalState', path: `/globalState.json` });
    GlobalStateSynchroniser = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataSync_1.IUserDataSyncStoreService),
        __param(2, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, userDataSync_1.IUserDataSyncEnablementService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, storage_1.IStorageService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], GlobalStateSynchroniser);
    exports.GlobalStateSynchroniser = GlobalStateSynchroniser;
    let GlobalStateInitializer = class GlobalStateInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(storageService, fileService, environmentService, logService, uriIdentityService) {
            super("globalState" /* SyncResource.GlobalState */, environmentService, logService, fileService, uriIdentityService);
            this.storageService = storageService;
        }
        async doInitialize(remoteUserData) {
            const remoteGlobalState = remoteUserData.syncData ? JSON.parse(remoteUserData.syncData.content) : null;
            if (!remoteGlobalState) {
                this.logService.info('Skipping initializing global state because remote global state does not exist.');
                return;
            }
            const argv = {};
            const storage = {};
            for (const key of Object.keys(remoteGlobalState.storage)) {
                if (key.startsWith(argvStoragePrefx)) {
                    argv[key.substring(argvStoragePrefx.length)] = remoteGlobalState.storage[key].value;
                }
                else {
                    if (this.storageService.get(key, 0 /* StorageScope.GLOBAL */) === undefined) {
                        storage[key] = remoteGlobalState.storage[key].value;
                    }
                }
            }
            if (Object.keys(argv).length) {
                let content = '{}';
                try {
                    const fileContent = await this.fileService.readFile(this.environmentService.argvResource);
                    content = fileContent.value.toString();
                }
                catch (error) { }
                for (const argvProperty of Object.keys(argv)) {
                    content = (0, content_1.edit)(content, [argvProperty], argv[argvProperty], {});
                }
                await this.fileService.writeFile(this.environmentService.argvResource, buffer_1.VSBuffer.fromString(content));
            }
            if (Object.keys(storage).length) {
                for (const key of Object.keys(storage)) {
                    this.storageService.store(key, storage[key], 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                }
            }
        }
    };
    GlobalStateInitializer = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, files_1.IFileService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], GlobalStateInitializer);
    exports.GlobalStateInitializer = GlobalStateInitializer;
    let UserDataSyncStoreTypeSynchronizer = class UserDataSyncStoreTypeSynchronizer {
        constructor(userDataSyncStoreClient, storageService, environmentService, fileService, logService) {
            this.userDataSyncStoreClient = userDataSyncStoreClient;
            this.storageService = storageService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.logService = logService;
        }
        getSyncStoreType(userData) {
            var _a;
            const remoteGlobalState = this.parseGlobalState(userData);
            return (_a = remoteGlobalState === null || remoteGlobalState === void 0 ? void 0 : remoteGlobalState.storage[userDataSync_1.SYNC_SERVICE_URL_TYPE]) === null || _a === void 0 ? void 0 : _a.value;
        }
        async sync(userDataSyncStoreType) {
            const syncHeaders = (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)());
            try {
                return await this.doSync(userDataSyncStoreType, syncHeaders);
            }
            catch (e) {
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */:
                            this.logService.info(`Failed to synchronize UserDataSyncStoreType as there is a new remote version available. Synchronizing again...`);
                            return this.doSync(userDataSyncStoreType, syncHeaders);
                    }
                }
                throw e;
            }
        }
        async doSync(userDataSyncStoreType, syncHeaders) {
            // Read the global state from remote
            const globalStateUserData = await this.userDataSyncStoreClient.read("globalState" /* SyncResource.GlobalState */, null, syncHeaders);
            const remoteGlobalState = this.parseGlobalState(globalStateUserData) || { storage: {} };
            // Update the sync store type
            remoteGlobalState.storage[userDataSync_1.SYNC_SERVICE_URL_TYPE] = { value: userDataSyncStoreType, version: GLOBAL_STATE_DATA_VERSION };
            // Write the global state to remote
            const machineId = await (0, serviceMachineId_1.getServiceMachineId)(this.environmentService, this.fileService, this.storageService);
            const syncDataToUpdate = { version: GLOBAL_STATE_DATA_VERSION, machineId, content: stringify(remoteGlobalState, false) };
            await this.userDataSyncStoreClient.write("globalState" /* SyncResource.GlobalState */, JSON.stringify(syncDataToUpdate), globalStateUserData.ref, syncHeaders);
        }
        parseGlobalState({ content }) {
            if (!content) {
                return null;
            }
            const syncData = JSON.parse(content);
            if ((0, abstractSynchronizer_1.isSyncData)(syncData)) {
                return syncData ? JSON.parse(syncData.content) : null;
            }
            throw new Error('Invalid remote data');
        }
    };
    UserDataSyncStoreTypeSynchronizer = __decorate([
        __param(1, storage_1.IStorageService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, log_1.ILogService)
    ], UserDataSyncStoreTypeSynchronizer);
    exports.UserDataSyncStoreTypeSynchronizer = UserDataSyncStoreTypeSynchronizer;
});
//# sourceMappingURL=globalStateSync.js.map