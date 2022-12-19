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
define(["require", "exports", "vs/base/common/event", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/nls", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/download/common/download", "vs/base/common/arrays", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/async", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/base/common/errors"], function (require, exports, event_1, extensionManagement_1, extensionManagement_2, extensions_1, lifecycle_1, configuration_1, cancellation_1, extensionManagementUtil_1, nls_1, productService_1, network_1, download_1, arrays_1, dialogs_1, severity_1, userDataSync_1, async_1, workspaceTrust_1, extensionManifestPropertiesService_1, instantiation_1, commands_1, types_1, files_1, log_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementService = void 0;
    let ExtensionManagementService = class ExtensionManagementService extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, extensionGalleryService, configurationService, productService, downloadService, userDataSyncEnablementService, dialogService, workspaceTrustRequestService, extensionManifestPropertiesService, fileService, logService, instantiationService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.downloadService = downloadService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.dialogService = dialogService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.fileService = fileService;
            this.logService = logService;
            this.instantiationService = instantiationService;
            this.servers = [];
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.localExtensionManagementServer);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.webExtensionManagementServer);
            }
            this.onInstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(event_1.Event.map(server.extensionManagementService.onInstallExtension, e => (Object.assign(Object.assign({}, e), { server })))); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onDidInstallExtensions = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onDidInstallExtensions); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onUninstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(event_1.Event.map(server.extensionManagementService.onUninstallExtension, e => (Object.assign(Object.assign({}, e), { server })))); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onDidUninstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(event_1.Event.map(server.extensionManagementService.onDidUninstallExtension, e => (Object.assign(Object.assign({}, e), { server })))); return emitter; }, new event_1.EventMultiplexer())).event;
        }
        async getInstalled(type, donotIgnoreInvalidExtensions) {
            const result = await Promise.all(this.servers.map(({ extensionManagementService }) => extensionManagementService.getInstalled(type, donotIgnoreInvalidExtensions)));
            return (0, arrays_1.flatten)(result);
        }
        async uninstall(extension, options) {
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            if (this.servers.length > 1) {
                if ((0, extensions_1.isLanguagePackExtension)(extension.manifest)) {
                    return this.uninstallEverywhere(extension);
                }
                return this.uninstallInServer(extension, server, options);
            }
            return server.extensionManagementService.uninstall(extension);
        }
        async uninstallEverywhere(extension) {
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            const promise = server.extensionManagementService.uninstall(extension);
            const otherServers = this.servers.filter(s => s !== server);
            if (otherServers.length) {
                for (const otherServer of otherServers) {
                    const installed = await otherServer.extensionManagementService.getInstalled();
                    extension = installed.filter(i => !i.isBuiltin && (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, extension.identifier))[0];
                    if (extension) {
                        await otherServer.extensionManagementService.uninstall(extension);
                    }
                }
            }
            return promise;
        }
        async uninstallInServer(extension, server, options) {
            if (server === this.extensionManagementServerService.localExtensionManagementServer) {
                const installedExtensions = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
                const dependentNonUIExtensions = installedExtensions.filter(i => !this.extensionManifestPropertiesService.prefersExecuteOnUI(i.manifest)
                    && i.manifest.extensionDependencies && i.manifest.extensionDependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier)));
                if (dependentNonUIExtensions.length) {
                    return Promise.reject(new Error(this.getDependentsErrorMessage(extension, dependentNonUIExtensions)));
                }
            }
            return server.extensionManagementService.uninstall(extension, options);
        }
        getDependentsErrorMessage(extension, dependents) {
            if (dependents.length === 1) {
                return (0, nls_1.localize)('singleDependentError', "Cannot uninstall extension '{0}'. Extension '{1}' depends on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
            }
            if (dependents.length === 2) {
                return (0, nls_1.localize)('twoDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}' and '{2}' depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            return (0, nls_1.localize)('multipleDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}', '{2}' and others depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
        }
        async reinstallFromGallery(extension) {
            const server = this.getServer(extension);
            if (server) {
                await this.checkForWorkspaceTrust(extension.manifest);
                return server.extensionManagementService.reinstallFromGallery(extension);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        updateMetadata(extension, metadata) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.updateMetadata(extension, metadata);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        updateExtensionScope(extension, isMachineScoped) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.updateExtensionScope(extension, isMachineScoped);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        zip(extension) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.zip(extension);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        unzip(zipLocation) {
            return async_1.Promises.settled(this.servers
                // Filter out web server
                .filter(server => server !== this.extensionManagementServerService.webExtensionManagementServer)
                .map(({ extensionManagementService }) => extensionManagementService.unzip(zipLocation))).then(([extensionIdentifier]) => extensionIdentifier);
        }
        async install(vsix, options) {
            if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                const manifest = await this.getManifest(vsix);
                if ((0, extensions_1.isLanguagePackExtension)(manifest)) {
                    // Install on both servers
                    const [local] = await async_1.Promises.settled([this.extensionManagementServerService.localExtensionManagementServer, this.extensionManagementServerService.remoteExtensionManagementServer].map(server => this.installVSIX(vsix, server, options)));
                    return local;
                }
                if (this.extensionManifestPropertiesService.prefersExecuteOnUI(manifest)) {
                    // Install only on local server
                    return this.installVSIX(vsix, this.extensionManagementServerService.localExtensionManagementServer, options);
                }
                // Install only on remote server
                return this.installVSIX(vsix, this.extensionManagementServerService.remoteExtensionManagementServer, options);
            }
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.installVSIX(vsix, this.extensionManagementServerService.localExtensionManagementServer, options);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.installVSIX(vsix, this.extensionManagementServerService.remoteExtensionManagementServer, options);
            }
            return Promise.reject('No Servers to Install');
        }
        async installWebExtension(location) {
            if (!this.extensionManagementServerService.webExtensionManagementServer) {
                throw new Error('Web extension management server is not found');
            }
            return this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.install(location);
        }
        async installVSIX(vsix, server, options) {
            const manifest = await this.getManifest(vsix);
            if (manifest) {
                await this.checkForWorkspaceTrust(manifest);
                return server.extensionManagementService.install(vsix, options);
            }
            return Promise.reject('Unable to get the extension manifest.');
        }
        getManifest(vsix) {
            if (vsix.scheme === network_1.Schemas.file && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getManifest(vsix);
            }
            if (vsix.scheme === network_1.Schemas.vscodeRemote && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getManifest(vsix);
            }
            return Promise.reject('No Servers');
        }
        async canInstall(gallery) {
            if (this.extensionManagementServerService.localExtensionManagementServer
                && await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.canInstall(gallery)) {
                return true;
            }
            const manifest = await this.extensionGalleryService.getManifest(gallery, cancellation_1.CancellationToken.None);
            if (!manifest) {
                return false;
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer
                && await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.canInstall(gallery)
                && this.extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)) {
                return true;
            }
            if (this.extensionManagementServerService.webExtensionManagementServer
                && await this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.canInstall(gallery)
                && this.extensionManifestPropertiesService.canExecuteOnWeb(manifest)) {
                return true;
            }
            return false;
        }
        async updateFromGallery(gallery, extension, installOptions) {
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            const servers = [];
            // Update Language pack on local and remote servers
            if ((0, extensions_1.isLanguagePackExtension)(extension.manifest)) {
                servers.push(...this.servers.filter(server => server !== this.extensionManagementServerService.webExtensionManagementServer));
            }
            else {
                servers.push(server);
            }
            return async_1.Promises.settled(servers.map(server => server.extensionManagementService.installFromGallery(gallery, installOptions))).then(([local]) => local);
        }
        async installExtensions(extensions, installOptions) {
            if (!installOptions) {
                const isMachineScoped = await this.hasToFlagExtensionsMachineScoped(extensions);
                installOptions = { isMachineScoped, isBuiltin: false };
            }
            return async_1.Promises.settled(extensions.map(extension => this.installFromGallery(extension, installOptions)));
        }
        async installFromGallery(gallery, installOptions) {
            const manifest = await this.extensionGalleryService.getManifest(gallery, cancellation_1.CancellationToken.None);
            if (!manifest) {
                return Promise.reject((0, nls_1.localize)('Manifest is not found', "Installing Extension {0} failed: Manifest is not found.", gallery.displayName || gallery.name));
            }
            const servers = [];
            // Install Language pack on local and remote servers
            if ((0, extensions_1.isLanguagePackExtension)(manifest)) {
                servers.push(...this.servers.filter(server => server !== this.extensionManagementServerService.webExtensionManagementServer));
            }
            else {
                const server = this.getExtensionManagementServerToInstall(manifest);
                if (server) {
                    servers.push(server);
                }
            }
            if (servers.length) {
                if (!installOptions || (0, types_1.isUndefined)(installOptions.isMachineScoped)) {
                    const isMachineScoped = await this.hasToFlagExtensionsMachineScoped([gallery]);
                    installOptions = Object.assign(Object.assign({}, (installOptions || {})), { isMachineScoped });
                }
                if (!installOptions.isMachineScoped && this.isExtensionsSyncEnabled()) {
                    if (this.extensionManagementServerService.localExtensionManagementServer && !servers.includes(this.extensionManagementServerService.localExtensionManagementServer) && (await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.canInstall(gallery))) {
                        servers.push(this.extensionManagementServerService.localExtensionManagementServer);
                    }
                }
                await this.checkForWorkspaceTrust(manifest);
                if (!installOptions.donotIncludePackAndDependencies) {
                    await this.checkInstallingExtensionOnWeb(gallery, manifest);
                }
                return async_1.Promises.settled(servers.map(server => server.extensionManagementService.installFromGallery(gallery, installOptions))).then(([local]) => local);
            }
            const error = new Error((0, nls_1.localize)('cannot be installed', "Cannot install the '{0}' extension because it is not available in this setup.", gallery.displayName || gallery.name));
            error.name = extensionManagement_1.ExtensionManagementErrorCode.Unsupported;
            return Promise.reject(error);
        }
        getExtensionManagementServerToInstall(manifest) {
            // Only local server
            if (this.servers.length === 1 && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer;
            }
            const extensionKind = this.extensionManifestPropertiesService.getExtensionKind(manifest);
            for (const kind of extensionKind) {
                if (kind === 'ui' && this.extensionManagementServerService.localExtensionManagementServer) {
                    return this.extensionManagementServerService.localExtensionManagementServer;
                }
                if (kind === 'workspace' && this.extensionManagementServerService.remoteExtensionManagementServer) {
                    return this.extensionManagementServerService.remoteExtensionManagementServer;
                }
                if (kind === 'web' && this.extensionManagementServerService.webExtensionManagementServer) {
                    return this.extensionManagementServerService.webExtensionManagementServer;
                }
            }
            // Local server can accept any extension. So return local server if not compatible server found.
            return this.extensionManagementServerService.localExtensionManagementServer;
        }
        isExtensionsSyncEnabled() {
            return this.userDataSyncEnablementService.isEnabled() && this.userDataSyncEnablementService.isResourceEnabled("extensions" /* SyncResource.Extensions */);
        }
        async hasToFlagExtensionsMachineScoped(extensions) {
            if (this.isExtensionsSyncEnabled()) {
                const result = await this.dialogService.show(severity_1.default.Info, extensions.length === 1 ? (0, nls_1.localize)('install extension', "Install Extension") : (0, nls_1.localize)('install extensions', "Install Extensions"), [
                    (0, nls_1.localize)('install', "Install"),
                    (0, nls_1.localize)('install and do no sync', "Install (Do not sync)"),
                    (0, nls_1.localize)('cancel', "Cancel"),
                ], {
                    cancelId: 2,
                    detail: extensions.length === 1
                        ? (0, nls_1.localize)('install single extension', "Would you like to install and synchronize '{0}' extension across your devices?", extensions[0].displayName)
                        : (0, nls_1.localize)('install multiple extensions', "Would you like to install and synchronize extensions across your devices?")
                });
                switch (result.choice) {
                    case 0:
                        return false;
                    case 1:
                        return true;
                }
                throw new errors_1.CancellationError();
            }
            return false;
        }
        getExtensionsControlManifest() {
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getExtensionsControlManifest();
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getExtensionsControlManifest();
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                return this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.getExtensionsControlManifest();
            }
            return Promise.resolve({ malicious: [] });
        }
        getServer(extension) {
            return this.extensionManagementServerService.getExtensionManagementServer(extension);
        }
        async checkForWorkspaceTrust(manifest) {
            if (this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(manifest) === false) {
                const trustState = await this.workspaceTrustRequestService.requestWorkspaceTrust({
                    message: (0, nls_1.localize)('extensionInstallWorkspaceTrustMessage', "Enabling this extension requires a trusted workspace."),
                    buttons: [
                        { label: (0, nls_1.localize)('extensionInstallWorkspaceTrustButton', "Trust Workspace & Install"), type: 'ContinueWithTrust' },
                        { label: (0, nls_1.localize)('extensionInstallWorkspaceTrustContinueButton', "Install"), type: 'ContinueWithoutTrust' },
                        { label: (0, nls_1.localize)('extensionInstallWorkspaceTrustManageButton', "Learn More"), type: 'Manage' }
                    ]
                });
                if (trustState === undefined) {
                    throw new errors_1.CancellationError();
                }
            }
        }
        async checkInstallingExtensionOnWeb(extension, manifest) {
            var _a, _b;
            if (this.servers.length !== 1 || this.servers[0] !== this.extensionManagementServerService.webExtensionManagementServer) {
                return;
            }
            const nonWebExtensions = [];
            if ((_a = manifest.extensionPack) === null || _a === void 0 ? void 0 : _a.length) {
                const extensions = await this.extensionGalleryService.getExtensions(manifest.extensionPack.map(id => ({ id })), cancellation_1.CancellationToken.None);
                for (const extension of extensions) {
                    if (!(await this.servers[0].extensionManagementService.canInstall(extension))) {
                        nonWebExtensions.push(extension);
                    }
                }
                if (nonWebExtensions.length && nonWebExtensions.length === extensions.length) {
                    throw new extensionManagement_1.ExtensionManagementError('Not supported in Web', extensionManagement_1.ExtensionManagementErrorCode.Unsupported);
                }
            }
            const productName = (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong);
            const virtualWorkspaceSupport = this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(manifest);
            const virtualWorkspaceSupportReason = (0, extensions_1.getWorkspaceSupportTypeMessage)((_b = manifest.capabilities) === null || _b === void 0 ? void 0 : _b.virtualWorkspaces);
            const hasLimitedSupport = virtualWorkspaceSupport === 'limited' || !!virtualWorkspaceSupportReason;
            if (!nonWebExtensions.length && !hasLimitedSupport) {
                return;
            }
            const limitedSupportMessage = (0, nls_1.localize)('limited support', "'{0}' has limited functionality in {1}.", extension.displayName || extension.identifier.id, productName);
            let message, buttons, detail;
            if (nonWebExtensions.length && hasLimitedSupport) {
                message = limitedSupportMessage;
                detail = `${virtualWorkspaceSupportReason ? `${virtualWorkspaceSupportReason}\n` : ''}${(0, nls_1.localize)('non web extensions detail', "Contains extensions which are not supported.")}`;
                buttons = [(0, nls_1.localize)('install anyways', "Install Anyway"), (0, nls_1.localize)('showExtensions', "Show Extensions"), (0, nls_1.localize)('cancel', "Cancel")];
            }
            else if (hasLimitedSupport) {
                message = limitedSupportMessage;
                detail = virtualWorkspaceSupportReason || undefined;
                buttons = [(0, nls_1.localize)('install anyways', "Install Anyway"), (0, nls_1.localize)('cancel', "Cancel")];
            }
            else {
                message = (0, nls_1.localize)('non web extensions', "'{0}' contains extensions which are not supported in {1}.", extension.displayName || extension.identifier.id, productName);
                buttons = [(0, nls_1.localize)('install anyways', "Install Anyway"), (0, nls_1.localize)('showExtensions', "Show Extensions"), (0, nls_1.localize)('cancel', "Cancel")];
            }
            const { choice } = await this.dialogService.show(severity_1.default.Info, message, buttons, { cancelId: buttons.length - 1, detail });
            if (choice === 0) {
                return;
            }
            if (choice === buttons.length - 2) {
                // Unfortunately ICommandService cannot be used directly due to cyclic dependencies
                this.instantiationService.invokeFunction(accessor => accessor.get(commands_1.ICommandService).executeCommand('extension.open', extension.identifier.id, 'extensionPack'));
            }
            throw new errors_1.CancellationError();
        }
        getTargetPlatform() {
            if (!this._targetPlatformPromise) {
                this._targetPlatformPromise = (0, extensionManagementUtil_1.computeTargetPlatform)(this.fileService, this.logService);
            }
            return this._targetPlatformPromise;
        }
        registerParticipant() { throw new Error('Not Supported'); }
    };
    ExtensionManagementService = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, productService_1.IProductService),
        __param(4, download_1.IDownloadService),
        __param(5, userDataSync_1.IUserDataSyncEnablementService),
        __param(6, dialogs_1.IDialogService),
        __param(7, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(8, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(9, files_1.IFileService),
        __param(10, log_1.ILogService),
        __param(11, instantiation_1.IInstantiationService)
    ], ExtensionManagementService);
    exports.ExtensionManagementService = ExtensionManagementService;
});
//# sourceMappingURL=extensionManagementService.js.map