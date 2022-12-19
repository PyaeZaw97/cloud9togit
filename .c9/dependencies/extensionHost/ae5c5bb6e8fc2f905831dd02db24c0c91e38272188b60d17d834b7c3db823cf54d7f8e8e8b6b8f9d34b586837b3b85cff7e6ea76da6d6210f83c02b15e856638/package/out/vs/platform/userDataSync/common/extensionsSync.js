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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/jsonFormatter", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/extensionsMerge", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, async_1, cancellation_1, errors_1, event_1, jsonFormatter_1, strings_1, uri_1, configuration_1, environment_1, extensionManagement_1, extensionManagementUtil_1, extensionStorage_1, files_1, log_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, extensionsMerge_1, ignoredExtensions_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionsInitializer = exports.ExtensionsSynchroniser = void 0;
    async function parseAndMigrateExtensions(syncData, extensionManagementService) {
        const extensions = JSON.parse(syncData.content);
        if (syncData.version === 1
            || syncData.version === 2) {
            const builtinExtensions = (await extensionManagementService.getInstalled(0 /* ExtensionType.System */)).filter(e => e.isBuiltin);
            for (const extension of extensions) {
                // #region Migration from v1 (enabled -> disabled)
                if (syncData.version === 1) {
                    if (extension.enabled === false) {
                        extension.disabled = true;
                    }
                    delete extension.enabled;
                }
                // #endregion
                // #region Migration from v2 (set installed property on extension)
                if (syncData.version === 2) {
                    if (builtinExtensions.every(installed => !(0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, extension.identifier))) {
                        extension.installed = true;
                    }
                }
                // #endregion
            }
        }
        return extensions;
    }
    let ExtensionsSynchroniser = class ExtensionsSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(environmentService, fileService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, extensionManagementService, extensionEnablementService, ignoredExtensionsManagementService, logService, extensionGalleryService, configurationService, userDataSyncEnablementService, telemetryService, extensionStorageService, uriIdentityService) {
            super("extensions" /* SyncResource.Extensions */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.ignoredExtensionsManagementService = ignoredExtensionsManagementService;
            this.extensionGalleryService = extensionGalleryService;
            this.extensionStorageService = extensionStorageService;
            /*
                Version 3 - Introduce installed property to skip installing built in extensions
                protected readonly version: number = 3;
            */
            /* Version 4: Change settings from `sync.${setting}` to `settingsSync.{setting}` */
            /* Version 5: Introduce extension state */
            this.version = 5;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'extensions.json');
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
            this._register(event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtensions, (e => e.some(({ local }) => !!local))), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error)), this.extensionEnablementService.onDidChangeEnablement, this.extensionStorageService.onDidChangeExtensionStorageToSync)(() => this.triggerLocalChange()));
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData) {
            const remoteExtensions = remoteUserData.syncData ? await parseAndMigrateExtensions(remoteUserData.syncData, this.extensionManagementService) : null;
            const skippedExtensions = (lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.skippedExtensions) || [];
            const lastSyncExtensions = (lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.syncData) ? await parseAndMigrateExtensions(lastSyncUserData.syncData, this.extensionManagementService) : null;
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, true);
            const localExtensions = this.getLocalExtensions(installedExtensions);
            const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
            if (remoteExtensions) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote extensions with local extensions...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote extensions does not exist. Synchronizing extensions for the first time.`);
            }
            const { local, remote } = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, lastSyncExtensions, skippedExtensions, ignoredExtensions);
            const previewResult = {
                local, remote,
                content: this.getPreviewContent(localExtensions, local.added, local.updated, local.removed),
                localChange: local.added.length > 0 || local.removed.length > 0 || local.updated.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
            };
            return [{
                    skippedExtensions,
                    localResource: this.localResource,
                    localContent: this.stringify(localExtensions, false),
                    localExtensions,
                    remoteResource: this.remoteResource,
                    remoteContent: remoteExtensions ? this.stringify(remoteExtensions, false) : null,
                    previewResource: this.previewResource,
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.acceptedResource,
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncExtensions = lastSyncUserData.syncData ? await parseAndMigrateExtensions(lastSyncUserData.syncData, this.extensionManagementService) : null;
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, true);
            const localExtensions = this.getLocalExtensions(installedExtensions);
            const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
            const { remote } = (0, extensionsMerge_1.merge)(localExtensions, lastSyncExtensions, lastSyncExtensions, lastSyncUserData.skippedExtensions || [], ignoredExtensions);
            return remote !== null;
        }
        getPreviewContent(localExtensions, added, updated, removed) {
            const preview = [...added, ...updated];
            const idsOrUUIDs = new Set();
            const addIdentifier = (identifier) => {
                idsOrUUIDs.add(identifier.id.toLowerCase());
                if (identifier.uuid) {
                    idsOrUUIDs.add(identifier.uuid);
                }
            };
            preview.forEach(({ identifier }) => addIdentifier(identifier));
            removed.forEach(addIdentifier);
            for (const localExtension of localExtensions) {
                if (idsOrUUIDs.has(localExtension.identifier.id.toLowerCase()) || (localExtension.identifier.uuid && idsOrUUIDs.has(localExtension.identifier.uuid))) {
                    // skip
                    continue;
                }
                preview.push(localExtension);
            }
            return this.stringify(preview, false);
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
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
            const mergeResult = (0, extensionsMerge_1.merge)(resourcePreview.localExtensions, null, null, resourcePreview.skippedExtensions, ignoredExtensions);
            const { local, remote } = mergeResult;
            return {
                content: resourcePreview.localContent,
                local,
                remote,
                localChange: local.added.length > 0 || local.removed.length > 0 || local.updated.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
            };
        }
        async acceptRemote(resourcePreview) {
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
            const remoteExtensions = resourcePreview.remoteContent ? JSON.parse(resourcePreview.remoteContent) : null;
            if (remoteExtensions !== null) {
                const mergeResult = (0, extensionsMerge_1.merge)(resourcePreview.localExtensions, remoteExtensions, resourcePreview.localExtensions, [], ignoredExtensions);
                const { local, remote } = mergeResult;
                return {
                    content: resourcePreview.remoteContent,
                    local,
                    remote,
                    localChange: local.added.length > 0 || local.removed.length > 0 || local.updated.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                    remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
                };
            }
            else {
                return {
                    content: resourcePreview.remoteContent,
                    local: { added: [], removed: [], updated: [] },
                    remote: null,
                    localChange: 0 /* Change.None */,
                    remoteChange: 0 /* Change.None */,
                };
            }
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            let { skippedExtensions, localExtensions } = resourcePreviews[0][0];
            let { local, remote, localChange, remoteChange } = resourcePreviews[0][1];
            if (localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing extensions.`);
            }
            if (localChange !== 0 /* Change.None */) {
                await this.backupLocal(JSON.stringify(localExtensions));
                skippedExtensions = await this.updateLocalExtensions(local.added, local.removed, local.updated, skippedExtensions);
            }
            if (remote) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote extensions...`);
                const content = JSON.stringify(remote.all);
                remoteUserData = await this.updateRemoteUserData(content, force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote extensions.${remote.added.length ? ` Added: ${JSON.stringify(remote.added.map(e => e.identifier.id))}.` : ''}${remote.updated.length ? ` Updated: ${JSON.stringify(remote.updated.map(e => e.identifier.id))}.` : ''}${remote.removed.length ? ` Removed: ${JSON.stringify(remote.removed.map(e => e.identifier.id))}.` : ''}`);
            }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized extensions...`);
                await this.updateLastSyncUserData(remoteUserData, { skippedExtensions });
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized extensions.${skippedExtensions.length ? ` Skipped: ${JSON.stringify(skippedExtensions.map(e => e.identifier.id))}.` : ''}`);
            }
        }
        async getAssociatedResources({ uri }) {
            return [{ resource: this.extUri.joinPath(uri, 'extensions.json'), comparableResource: ExtensionsSynchroniser.EXTENSIONS_DATA_URI }];
        }
        async resolveContent(uri) {
            if (this.extUri.isEqual(uri, ExtensionsSynchroniser.EXTENSIONS_DATA_URI)) {
                const installedExtensions = await this.extensionManagementService.getInstalled();
                const ignoredExtensions = this.ignoredExtensionsManagementService.getIgnoredExtensions(installedExtensions);
                const localExtensions = this.getLocalExtensions(installedExtensions).filter(e => !ignoredExtensions.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, e.identifier)));
                return this.stringify(localExtensions, true);
            }
            if (this.extUri.isEqual(this.remoteResource, uri) || this.extUri.isEqual(this.localResource, uri) || this.extUri.isEqual(this.acceptedResource, uri)) {
                const content = await this.resolvePreviewContent(uri);
                return content ? this.stringify(JSON.parse(content), true) : content;
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
                        case 'extensions.json':
                            return this.stringify(this.parseExtensions(syncData), true);
                    }
                }
            }
            return null;
        }
        stringify(extensions, format) {
            extensions.sort((e1, e2) => {
                if (!e1.identifier.uuid && e2.identifier.uuid) {
                    return -1;
                }
                if (e1.identifier.uuid && !e2.identifier.uuid) {
                    return 1;
                }
                return (0, strings_1.compare)(e1.identifier.id, e2.identifier.id);
            });
            return format ? (0, jsonFormatter_1.toFormattedString)(extensions, {}) : JSON.stringify(extensions);
        }
        async hasLocalData() {
            try {
                const installedExtensions = await this.extensionManagementService.getInstalled();
                const localExtensions = this.getLocalExtensions(installedExtensions);
                if (localExtensions.some(e => e.installed || e.disabled)) {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
        async updateLocalExtensions(added, removed, updated, skippedExtensions) {
            const removeFromSkipped = [];
            const addToSkipped = [];
            const installedExtensions = await this.extensionManagementService.getInstalled();
            if (removed.length) {
                const extensionsToRemove = installedExtensions.filter(({ identifier, isBuiltin }) => !isBuiltin && removed.some(r => (0, extensionManagementUtil_1.areSameExtensions)(identifier, r)));
                await async_1.Promises.settled(extensionsToRemove.map(async (extensionToRemove) => {
                    this.logService.trace(`${this.syncResourceLogLabel}: Uninstalling local extension...`, extensionToRemove.identifier.id);
                    await this.extensionManagementService.uninstall(extensionToRemove, { donotIncludePack: true, donotCheckDependents: true });
                    this.logService.info(`${this.syncResourceLogLabel}: Uninstalled local extension.`, extensionToRemove.identifier.id);
                    removeFromSkipped.push(extensionToRemove.identifier);
                }));
            }
            if (added.length || updated.length) {
                await async_1.Promises.settled([...added, ...updated].map(async (e) => {
                    const installedExtension = installedExtensions.find(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier));
                    // Builtin Extension Sync: Enablement & State
                    if (installedExtension && installedExtension.isBuiltin) {
                        if (e.state && installedExtension.manifest.version === e.version) {
                            this.updateExtensionState(e.state, installedExtension, installedExtension.manifest.version);
                        }
                        const isDisabled = this.extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                        if (isDisabled !== !!e.disabled) {
                            if (e.disabled) {
                                this.logService.trace(`${this.syncResourceLogLabel}: Disabling extension...`, e.identifier.id);
                                await this.extensionEnablementService.disableExtension(e.identifier);
                                this.logService.info(`${this.syncResourceLogLabel}: Disabled extension`, e.identifier.id);
                            }
                            else {
                                this.logService.trace(`${this.syncResourceLogLabel}: Enabling extension...`, e.identifier.id);
                                await this.extensionEnablementService.enableExtension(e.identifier);
                                this.logService.info(`${this.syncResourceLogLabel}: Enabled extension`, e.identifier.id);
                            }
                        }
                        removeFromSkipped.push(e.identifier);
                        return;
                    }
                    // User Extension Sync: Install/Update, Enablement & State
                    const extension = (await this.extensionGalleryService.getExtensions([Object.assign(Object.assign({}, e.identifier), { preRelease: e.preRelease })], cancellation_1.CancellationToken.None))[0];
                    /* Update extension state only if
                     *	extension is installed and version is same as synced version or
                     *	extension is not installed and installable
                     */
                    if (e.state &&
                        (installedExtension ? installedExtension.manifest.version === e.version /* Installed and has same version */
                            : !!extension /* Installable */)) {
                        this.updateExtensionState(e.state, installedExtension || extension, installedExtension === null || installedExtension === void 0 ? void 0 : installedExtension.manifest.version);
                    }
                    if (extension) {
                        try {
                            const isDisabled = this.extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                            if (isDisabled !== !!e.disabled) {
                                if (e.disabled) {
                                    this.logService.trace(`${this.syncResourceLogLabel}: Disabling extension...`, e.identifier.id, extension.version);
                                    await this.extensionEnablementService.disableExtension(extension.identifier);
                                    this.logService.info(`${this.syncResourceLogLabel}: Disabled extension`, e.identifier.id, extension.version);
                                }
                                else {
                                    this.logService.trace(`${this.syncResourceLogLabel}: Enabling extension...`, e.identifier.id, extension.version);
                                    await this.extensionEnablementService.enableExtension(extension.identifier);
                                    this.logService.info(`${this.syncResourceLogLabel}: Enabled extension`, e.identifier.id, extension.version);
                                }
                            }
                            if (!installedExtension // Install if the extension does not exist
                                || installedExtension.preRelease !== e.preRelease // Install if the extension pre-release preference has changed
                            ) {
                                if (await this.extensionManagementService.canInstall(extension)) {
                                    this.logService.trace(`${this.syncResourceLogLabel}: Installing extension...`, e.identifier.id, extension.version);
                                    await this.extensionManagementService.installFromGallery(extension, { isMachineScoped: false, donotIncludePackAndDependencies: true, installPreReleaseVersion: e.preRelease } /* set isMachineScoped value to prevent install and sync dialog in web */);
                                    this.logService.info(`${this.syncResourceLogLabel}: Installed extension.`, e.identifier.id, extension.version);
                                    removeFromSkipped.push(extension.identifier);
                                }
                                else {
                                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing extension because it cannot be installed.`, extension.displayName || extension.identifier.id);
                                    addToSkipped.push(e);
                                }
                            }
                        }
                        catch (error) {
                            addToSkipped.push(e);
                            if (error instanceof extensionManagement_1.ExtensionManagementError && [extensionManagement_1.ExtensionManagementErrorCode.Incompatible, extensionManagement_1.ExtensionManagementErrorCode.IncompatiblePreRelease, extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform].includes(error.code)) {
                                this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing extension because the compatible extension is not found.`, extension.displayName || extension.identifier.id);
                            }
                            else {
                                this.logService.error(error);
                                this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing extension`, extension.displayName || extension.identifier.id);
                            }
                        }
                    }
                    else {
                        addToSkipped.push(e);
                        this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing extension because the extension is not found.`, e.identifier.id);
                    }
                }));
            }
            const newSkippedExtensions = [];
            for (const skippedExtension of skippedExtensions) {
                if (!removeFromSkipped.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, skippedExtension.identifier))) {
                    newSkippedExtensions.push(skippedExtension);
                }
            }
            for (const skippedExtension of addToSkipped) {
                if (!newSkippedExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, skippedExtension.identifier))) {
                    newSkippedExtensions.push(skippedExtension);
                }
            }
            return newSkippedExtensions;
        }
        updateExtensionState(state, extension, version) {
            const extensionState = this.extensionStorageService.getExtensionState(extension, true) || {};
            const keys = version ? this.extensionStorageService.getKeysForSync({ id: extension.identifier.id, version }) : undefined;
            if (keys) {
                keys.forEach(key => { extensionState[key] = state[key]; });
            }
            else {
                Object.keys(state).forEach(key => extensionState[key] = state[key]);
            }
            this.extensionStorageService.setExtensionState(extension, extensionState, true);
        }
        parseExtensions(syncData) {
            return JSON.parse(syncData.content);
        }
        getLocalExtensions(installedExtensions) {
            const disabledExtensions = this.extensionEnablementService.getDisabledExtensions();
            return installedExtensions
                .map(extension => {
                const { identifier, isBuiltin, manifest, preRelease } = extension;
                const syncExntesion = { identifier, preRelease, version: manifest.version };
                if (disabledExtensions.some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier))) {
                    syncExntesion.disabled = true;
                }
                if (!isBuiltin) {
                    syncExntesion.installed = true;
                }
                try {
                    const keys = this.extensionStorageService.getKeysForSync({ id: identifier.id, version: manifest.version });
                    if (keys) {
                        const extensionStorageState = this.extensionStorageService.getExtensionState(extension, true) || {};
                        syncExntesion.state = Object.keys(extensionStorageState).reduce((state, key) => {
                            if (keys.includes(key)) {
                                state[key] = extensionStorageState[key];
                            }
                            return state;
                        }, {});
                    }
                }
                catch (error) {
                    this.logService.info(`${this.syncResourceLogLabel}: Error while parsing extension state`, (0, errors_1.getErrorMessage)(error));
                }
                return syncExntesion;
            });
        }
    };
    ExtensionsSynchroniser.EXTENSIONS_DATA_URI = uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'extensions', path: `/extensions.json` });
    ExtensionsSynchroniser = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(7, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(8, userDataSync_1.IUserDataSyncLogService),
        __param(9, extensionManagement_1.IExtensionGalleryService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, userDataSync_1.IUserDataSyncEnablementService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, extensionStorage_1.IExtensionStorageService),
        __param(14, uriIdentity_1.IUriIdentityService)
    ], ExtensionsSynchroniser);
    exports.ExtensionsSynchroniser = ExtensionsSynchroniser;
    let AbstractExtensionsInitializer = class AbstractExtensionsInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(extensionManagementService, ignoredExtensionsManagementService, fileService, environmentService, logService, uriIdentityService) {
            super("extensions" /* SyncResource.Extensions */, environmentService, logService, fileService, uriIdentityService);
            this.extensionManagementService = extensionManagementService;
            this.ignoredExtensionsManagementService = ignoredExtensionsManagementService;
        }
        async parseExtensions(remoteUserData) {
            return remoteUserData.syncData ? await parseAndMigrateExtensions(remoteUserData.syncData, this.extensionManagementService) : null;
        }
        generatePreview(remoteExtensions, localExtensions) {
            const installedExtensions = [];
            const newExtensions = [];
            const disabledExtensions = [];
            for (const extension of remoteExtensions) {
                if (this.ignoredExtensionsManagementService.hasToNeverSyncExtension(extension.identifier.id)) {
                    // Skip extension ignored to sync
                    continue;
                }
                const installedExtension = localExtensions.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, extension.identifier));
                if (installedExtension) {
                    installedExtensions.push(installedExtension);
                    if (extension.disabled) {
                        disabledExtensions.push(extension.identifier);
                    }
                }
                else if (extension.installed) {
                    newExtensions.push(Object.assign(Object.assign({}, extension.identifier), { preRelease: !!extension.preRelease }));
                    if (extension.disabled) {
                        disabledExtensions.push(extension.identifier);
                    }
                }
            }
            return { installedExtensions, newExtensions, disabledExtensions, remoteExtensions };
        }
    };
    AbstractExtensionsInitializer = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, log_1.ILogService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], AbstractExtensionsInitializer);
    exports.AbstractExtensionsInitializer = AbstractExtensionsInitializer;
});
//# sourceMappingURL=extensionsSync.js.map