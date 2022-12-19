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
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, cancellation_1, environment_1, extensionManagement_1, extensionManagementUtil_1, files_1, instantiation_1, serviceCollection_1, log_1, remoteAuthorityResolver_1, storage_1, uriIdentity_1, extensionsSync_1, ignoredExtensions_1, userDataSync_1, userDataSyncStoreService_1, authentication_1, extensionManagement_2, extensionManifestPropertiesService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionsInitializerContribution = void 0;
    let RemoteExtensionsInitializerContribution = class RemoteExtensionsInitializerContribution {
        constructor(extensionManagementServerService, storageService, remoteAgentService, userDataSyncStoreManagementService, instantiationService, logService, authenticationService, remoteAuthorityResolverService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.storageService = storageService;
            this.remoteAgentService = remoteAgentService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.authenticationService = authenticationService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.initializeRemoteExtensions();
        }
        async initializeRemoteExtensions() {
            var _a, _b;
            const connection = this.remoteAgentService.getConnection();
            const localExtensionManagementServer = this.extensionManagementServerService.localExtensionManagementServer;
            const remoteExtensionManagementServer = this.extensionManagementServerService.remoteExtensionManagementServer;
            // Skip: Not a remote window
            if (!connection || !remoteExtensionManagementServer) {
                return;
            }
            // Skip: Not a native window
            if (!localExtensionManagementServer) {
                return;
            }
            // Skip: No UserdataSyncStore is configured
            if (!this.userDataSyncStoreManagementService.userDataSyncStore) {
                return;
            }
            const newRemoteConnectionKey = `${storage_1.IS_NEW_KEY}.${connection.remoteAuthority}`;
            // Skip: Not a new remote connection
            if (!this.storageService.getBoolean(newRemoteConnectionKey, 0 /* StorageScope.GLOBAL */, true)) {
                this.logService.trace(`Skipping initializing remote extensions because the window with this remote authority was opened before.`);
                return;
            }
            this.storageService.store(newRemoteConnectionKey, false, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            // Skip: Not a new workspace
            if (!this.storageService.isNew(1 /* StorageScope.WORKSPACE */)) {
                this.logService.trace(`Skipping initializing remote extensions because this workspace was opened before.`);
                return;
            }
            // Skip: No account is provided to initialize
            const resolvedAuthority = await this.remoteAuthorityResolverService.resolveAuthority(connection.remoteAuthority);
            if (!((_a = resolvedAuthority.options) === null || _a === void 0 ? void 0 : _a.authenticationSession)) {
                return;
            }
            const sessions = await this.authenticationService.getSessions((_b = resolvedAuthority.options) === null || _b === void 0 ? void 0 : _b.authenticationSession.providerId);
            const session = sessions.find(s => { var _a, _b; return s.id === ((_b = (_a = resolvedAuthority.options) === null || _a === void 0 ? void 0 : _a.authenticationSession) === null || _b === void 0 ? void 0 : _b.id); });
            // Skip: Session is not found
            if (!session) {
                this.logService.info('Skipping initializing remote extensions because the account with given session id is not found', resolvedAuthority.options.authenticationSession.id);
                return;
            }
            const userDataSyncStoreClient = this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreClient, this.userDataSyncStoreManagementService.userDataSyncStore.url);
            userDataSyncStoreClient.setAuthToken(session.accessToken, resolvedAuthority.options.authenticationSession.providerId);
            const userData = await userDataSyncStoreClient.read("extensions" /* SyncResource.Extensions */, null);
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            serviceCollection.set(extensionManagement_1.IExtensionManagementService, remoteExtensionManagementServer.extensionManagementService);
            const instantiationService = this.instantiationService.createChild(serviceCollection);
            const extensionsToInstallInitializer = instantiationService.createInstance(RemoteExtensionsInitializer);
            await extensionsToInstallInitializer.initialize(userData);
        }
    };
    RemoteExtensionsInitializerContribution = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, storage_1.IStorageService),
        __param(2, remoteAgentService_1.IRemoteAgentService),
        __param(3, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, log_1.ILogService),
        __param(6, authentication_1.IAuthenticationService),
        __param(7, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], RemoteExtensionsInitializerContribution);
    exports.RemoteExtensionsInitializerContribution = RemoteExtensionsInitializerContribution;
    let RemoteExtensionsInitializer = class RemoteExtensionsInitializer extends extensionsSync_1.AbstractExtensionsInitializer {
        constructor(extensionManagementService, ignoredExtensionsManagementService, fileService, environmentService, logService, uriIdentityService, extensionGalleryService, extensionManifestPropertiesService) {
            super(extensionManagementService, ignoredExtensionsManagementService, fileService, environmentService, logService, uriIdentityService);
            this.extensionGalleryService = extensionGalleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async doInitialize(remoteUserData) {
            const remoteExtensions = await this.parseExtensions(remoteUserData);
            if (!remoteExtensions) {
                this.logService.info('No synced extensions exist while initializing remote extensions.');
                return;
            }
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const { newExtensions } = this.generatePreview(remoteExtensions, installedExtensions);
            if (!newExtensions.length) {
                this.logService.trace('No new remote extensions to install.');
                return;
            }
            const targetPlatform = await this.extensionManagementService.getTargetPlatform();
            const extensionsToInstall = await this.extensionGalleryService.getExtensions(newExtensions, { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
            if (extensionsToInstall.length) {
                await Promise.allSettled(extensionsToInstall.map(async (e) => {
                    const manifest = await this.extensionGalleryService.getManifest(e, cancellation_1.CancellationToken.None);
                    if (manifest && this.extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)) {
                        const syncedExtension = remoteExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, e.identifier));
                        await this.extensionManagementService.installFromGallery(e, { installPreReleaseVersion: syncedExtension === null || syncedExtension === void 0 ? void 0 : syncedExtension.preRelease, donotIncludePackAndDependencies: true });
                    }
                }));
            }
        }
    };
    RemoteExtensionsInitializer = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, log_1.ILogService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, extensionManagement_1.IExtensionGalleryService),
        __param(7, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteExtensionsInitializer);
});
//# sourceMappingURL=remoteExtensionsInit.js.map