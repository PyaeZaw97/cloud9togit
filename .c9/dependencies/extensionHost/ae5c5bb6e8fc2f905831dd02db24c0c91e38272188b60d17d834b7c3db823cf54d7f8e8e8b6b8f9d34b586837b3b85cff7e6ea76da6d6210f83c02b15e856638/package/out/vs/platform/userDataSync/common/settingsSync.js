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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/content", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, buffer_1, event_1, nls_1, configuration_1, configurationModels_1, environment_1, extensionManagement_1, files_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, content_1, settingsMerge_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsInitializer = exports.SettingsSynchroniser = exports.parseSettingsSyncContent = void 0;
    function isSettingsSyncContent(thing) {
        return thing
            && (thing.settings && typeof thing.settings === 'string')
            && Object.keys(thing).length === 1;
    }
    function parseSettingsSyncContent(syncContent) {
        const parsed = JSON.parse(syncContent);
        return isSettingsSyncContent(parsed) ? parsed : /* migrate */ { settings: syncContent };
    }
    exports.parseSettingsSyncContent = parseSettingsSyncContent;
    let SettingsSynchroniser = class SettingsSynchroniser extends abstractSynchronizer_1.AbstractJsonFileSynchroniser {
        constructor(fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, logService, userDataSyncUtilService, configurationService, userDataSyncEnablementService, telemetryService, extensionManagementService, uriIdentityService) {
            super(environmentService.settingsResource, "settings" /* SyncResource.Settings */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService, uriIdentityService);
            this.extensionManagementService = extensionManagementService;
            /* Version 2: Change settings from `sync.${setting}` to `settingsSync.{setting}` */
            this.version = 2;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'settings.json');
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
            this._defaultIgnoredSettings = undefined;
        }
        async getRemoteUserDataSyncConfiguration(manifest) {
            const lastSyncUserData = await this.getLastSyncUserData();
            const remoteUserData = await this.getLatestRemoteUserData(manifest, lastSyncUserData);
            const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
            const parser = new configurationModels_1.ConfigurationModelParser(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE);
            if (remoteSettingsSyncContent === null || remoteSettingsSyncContent === void 0 ? void 0 : remoteSettingsSyncContent.settings) {
                parser.parse(remoteSettingsSyncContent.settings);
            }
            return parser.configurationModel.getValue(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE) || {};
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine) {
            const fileContent = await this.getLocalFileContent();
            const formattingOptions = await this.getFormattingOptions();
            const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSettingsSyncContent = lastSyncUserData ? this.getSettingsSyncContent(lastSyncUserData) : null;
            const ignoredSettings = await this.getIgnoredSettings();
            let mergedContent = null;
            let hasLocalChanged = false;
            let hasRemoteChanged = false;
            let hasConflicts = false;
            if (remoteSettingsSyncContent) {
                let localContent = fileContent ? fileContent.value.toString().trim() : '{}';
                localContent = localContent || '{}';
                this.validateContent(localContent);
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote settings with local settings...`);
                const result = (0, settingsMerge_1.merge)(localContent, remoteSettingsSyncContent.settings, lastSettingsSyncContent ? lastSettingsSyncContent.settings : null, ignoredSettings, [], formattingOptions);
                mergedContent = result.localContent || result.remoteContent;
                hasLocalChanged = result.localContent !== null;
                hasRemoteChanged = result.remoteContent !== null;
                hasConflicts = result.hasConflicts;
            }
            // First time syncing to remote
            else if (fileContent) {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote settings does not exist. Synchronizing settings for the first time.`);
                mergedContent = fileContent.value.toString();
                hasRemoteChanged = true;
            }
            const previewResult = {
                content: mergedContent,
                localChange: hasLocalChanged ? 2 /* Change.Modified */ : 0 /* Change.None */,
                remoteChange: hasRemoteChanged ? 2 /* Change.Modified */ : 0 /* Change.None */,
                hasConflicts
            };
            return [{
                    fileContent,
                    localResource: this.localResource,
                    localContent: fileContent ? fileContent.value.toString() : null,
                    localChange: previewResult.localChange,
                    remoteResource: this.remoteResource,
                    remoteContent: remoteSettingsSyncContent ? remoteSettingsSyncContent.settings : null,
                    remoteChange: previewResult.remoteChange,
                    previewResource: this.previewResource,
                    previewResult,
                    acceptedResource: this.acceptedResource,
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSettingsSyncContent = this.getSettingsSyncContent(lastSyncUserData);
            if (lastSettingsSyncContent === null) {
                return true;
            }
            const fileContent = await this.getLocalFileContent();
            const localContent = fileContent ? fileContent.value.toString().trim() : '';
            const ignoredSettings = await this.getIgnoredSettings();
            const formattingOptions = await this.getFormattingOptions();
            const result = (0, settingsMerge_1.merge)(localContent || '{}', lastSettingsSyncContent.settings, lastSettingsSyncContent.settings, ignoredSettings, [], formattingOptions);
            return result.remoteContent !== null;
        }
        async getMergeResult(resourcePreview, token) {
            const formatUtils = await this.getFormattingOptions();
            const ignoredSettings = await this.getIgnoredSettings();
            return Object.assign(Object.assign({}, resourcePreview.previewResult), { 
                // remove ignored settings from the preview content
                content: resourcePreview.previewResult.content ? (0, settingsMerge_1.updateIgnoredSettings)(resourcePreview.previewResult.content, '{}', ignoredSettings, formatUtils) : null });
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            const formattingOptions = await this.getFormattingOptions();
            const ignoredSettings = await this.getIgnoredSettings();
            /* Accept local resource */
            if (this.extUri.isEqual(resource, this.localResource)) {
                return {
                    /* Remove ignored settings */
                    content: resourcePreview.fileContent ? (0, settingsMerge_1.updateIgnoredSettings)(resourcePreview.fileContent.value.toString(), '{}', ignoredSettings, formattingOptions) : null,
                    localChange: 0 /* Change.None */,
                    remoteChange: 2 /* Change.Modified */,
                };
            }
            /* Accept remote resource */
            if (this.extUri.isEqual(resource, this.remoteResource)) {
                return {
                    /* Update ignored settings from local file content */
                    content: resourcePreview.remoteContent !== null ? (0, settingsMerge_1.updateIgnoredSettings)(resourcePreview.remoteContent, resourcePreview.fileContent ? resourcePreview.fileContent.value.toString() : '{}', ignoredSettings, formattingOptions) : null,
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
                        /* Add ignored settings from local file content */
                        content: content !== null ? (0, settingsMerge_1.updateIgnoredSettings)(content, resourcePreview.fileContent ? resourcePreview.fileContent.value.toString() : '{}', ignoredSettings, formattingOptions) : null,
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
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing settings.`);
            }
            content = content ? content.trim() : '{}';
            content = content || '{}';
            this.validateContent(content);
            if (localChange !== 0 /* Change.None */) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating local settings...`);
                if (fileContent) {
                    await this.backupLocal(JSON.stringify(this.toSettingsSyncContent(fileContent.value.toString())));
                }
                await this.updateLocalFileContent(content, fileContent, force);
                await this.configurationService.reloadConfiguration(2 /* ConfigurationTarget.USER_LOCAL */);
                this.logService.info(`${this.syncResourceLogLabel}: Updated local settings`);
            }
            if (remoteChange !== 0 /* Change.None */) {
                const formatUtils = await this.getFormattingOptions();
                // Update ignored settings from remote
                const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
                const ignoredSettings = await this.getIgnoredSettings(content);
                content = (0, settingsMerge_1.updateIgnoredSettings)(content, remoteSettingsSyncContent ? remoteSettingsSyncContent.settings : '{}', ignoredSettings, formatUtils);
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote settings...`);
                remoteUserData = await this.updateRemoteUserData(JSON.stringify(this.toSettingsSyncContent(content)), force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote settings`);
            }
            // Delete the preview
            try {
                await this.fileService.del(this.previewResource);
            }
            catch (e) { /* ignore */ }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized settings...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized settings`);
            }
        }
        async hasLocalData() {
            try {
                const localFileContent = await this.getLocalFileContent();
                if (localFileContent) {
                    const formatUtils = await this.getFormattingOptions();
                    const content = (0, content_1.edit)(localFileContent.value.toString(), [userDataSync_1.CONFIGURATION_SYNC_STORE_KEY], undefined, formatUtils);
                    return !(0, settingsMerge_1.isEmpty)(content);
                }
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return true;
                }
            }
            return false;
        }
        async getAssociatedResources({ uri }) {
            const comparableResource = (await this.fileService.exists(this.file)) ? this.file : this.localResource;
            return [{ resource: this.extUri.joinPath(uri, 'settings.json'), comparableResource }];
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
                    const settingsSyncContent = this.parseSettingsSyncContent(syncData.content);
                    if (settingsSyncContent) {
                        switch (this.extUri.basename(uri)) {
                            case 'settings.json':
                                return settingsSyncContent.settings;
                        }
                    }
                }
            }
            return null;
        }
        async resolvePreviewContent(resource) {
            let content = await super.resolvePreviewContent(resource);
            if (content) {
                const formatUtils = await this.getFormattingOptions();
                // remove ignored settings from the preview content
                const ignoredSettings = await this.getIgnoredSettings();
                content = (0, settingsMerge_1.updateIgnoredSettings)(content, '{}', ignoredSettings, formatUtils);
            }
            return content;
        }
        getSettingsSyncContent(remoteUserData) {
            return remoteUserData.syncData ? this.parseSettingsSyncContent(remoteUserData.syncData.content) : null;
        }
        parseSettingsSyncContent(syncContent) {
            try {
                return parseSettingsSyncContent(syncContent);
            }
            catch (e) {
                this.logService.error(e);
            }
            return null;
        }
        toSettingsSyncContent(settings) {
            return { settings };
        }
        async getIgnoredSettings(content) {
            if (!this._defaultIgnoredSettings) {
                this._defaultIgnoredSettings = this.userDataSyncUtilService.resolveDefaultIgnoredSettings();
                const disposable = event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtensions, (e => e.some(({ local }) => !!local))), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error)))(() => {
                    disposable.dispose();
                    this._defaultIgnoredSettings = undefined;
                });
            }
            const defaultIgnoredSettings = await this._defaultIgnoredSettings;
            return (0, settingsMerge_1.getIgnoredSettings)(defaultIgnoredSettings, this.configurationService, content);
        }
        validateContent(content) {
            if (this.hasErrors(content)) {
                throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('errorInvalidSettings', "Unable to sync settings as there are errors/warning in settings file."), "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */, this.resource);
            }
        }
    };
    SettingsSynchroniser = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(5, userDataSync_1.IUserDataSyncLogService),
        __param(6, userDataSync_1.IUserDataSyncUtilService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, extensionManagement_1.IExtensionManagementService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], SettingsSynchroniser);
    exports.SettingsSynchroniser = SettingsSynchroniser;
    let SettingsInitializer = class SettingsInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(fileService, environmentService, logService, uriIdentityService) {
            super("settings" /* SyncResource.Settings */, environmentService, logService, fileService, uriIdentityService);
        }
        async doInitialize(remoteUserData) {
            const settingsSyncContent = remoteUserData.syncData ? this.parseSettingsSyncContent(remoteUserData.syncData.content) : null;
            if (!settingsSyncContent) {
                this.logService.info('Skipping initializing settings because remote settings does not exist.');
                return;
            }
            const isEmpty = await this.isEmpty();
            if (!isEmpty) {
                this.logService.info('Skipping initializing settings because local settings exist.');
                return;
            }
            await this.fileService.writeFile(this.environmentService.settingsResource, buffer_1.VSBuffer.fromString(settingsSyncContent.settings));
            await this.updateLastSyncUserData(remoteUserData);
        }
        async isEmpty() {
            try {
                const fileContent = await this.fileService.readFile(this.environmentService.settingsResource);
                return (0, settingsMerge_1.isEmpty)(fileContent.value.toString().trim());
            }
            catch (error) {
                return error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */;
            }
        }
        parseSettingsSyncContent(syncContent) {
            try {
                return parseSettingsSyncContent(syncContent);
            }
            catch (e) {
                this.logService.error(e);
            }
            return null;
        }
    };
    SettingsInitializer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], SettingsInitializer);
    exports.SettingsInitializer = SettingsInitializer;
});
//# sourceMappingURL=settingsSync.js.map