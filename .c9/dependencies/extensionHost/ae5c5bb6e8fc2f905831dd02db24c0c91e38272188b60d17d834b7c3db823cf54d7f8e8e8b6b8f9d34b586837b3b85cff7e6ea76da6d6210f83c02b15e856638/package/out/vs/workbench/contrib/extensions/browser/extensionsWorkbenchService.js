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
define(["require", "exports", "vs/nls", "vs/base/common/semver/semver", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/paging", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/workbench/services/host/browser/host", "vs/base/common/uri", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/platform/url/common/url", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/editor/common/languages/language", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionEditor", "vs/base/common/platform"], function (require, exports, nls, semver, event_1, arrays_1, async_1, errors_1, lifecycle_1, paging_1, telemetry_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, instantiation_1, configuration_1, host_1, uri_1, extensions_1, editorService_1, url_1, extensionsInput_1, log_1, progress_1, notification_1, resources, cancellation_1, storage_1, files_1, language_1, productService_1, network_1, ignoredExtensions_1, userDataSync_1, contextkey_1, types_1, extensionManifestPropertiesService_1, extensions_2, extensionEditor_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsWorkbenchService = exports.Extension = void 0;
    let Extension = class Extension {
        constructor(stateProvider, server, local, gallery, galleryService, telemetryService, logService, fileService, productService) {
            this.stateProvider = stateProvider;
            this.server = server;
            this.local = local;
            this.gallery = gallery;
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.fileService = fileService;
            this.productService = productService;
            this.enablementState = 8 /* EnablementState.EnabledGlobally */;
            this.isMalicious = false;
            this.isUnsupported = false;
        }
        get type() {
            return this.local ? this.local.type : 1 /* ExtensionType.User */;
        }
        get isBuiltin() {
            return this.local ? this.local.isBuiltin : false;
        }
        get name() {
            return this.gallery ? this.gallery.name : this.local.manifest.name;
        }
        get displayName() {
            if (this.gallery) {
                return this.gallery.displayName || this.gallery.name;
            }
            return this.local.manifest.displayName || this.local.manifest.name;
        }
        get identifier() {
            if (this.gallery) {
                return this.gallery.identifier;
            }
            return this.local.identifier;
        }
        get uuid() {
            return this.gallery ? this.gallery.identifier.uuid : this.local.identifier.uuid;
        }
        get publisher() {
            return this.gallery ? this.gallery.publisher : this.local.manifest.publisher;
        }
        get publisherDisplayName() {
            var _a;
            if (this.gallery) {
                return this.gallery.publisherDisplayName || this.gallery.publisher;
            }
            if ((_a = this.local) === null || _a === void 0 ? void 0 : _a.publisherDisplayName) {
                return this.local.publisherDisplayName;
            }
            return this.local.manifest.publisher;
        }
        get publisherDomain() {
            var _a;
            return (_a = this.gallery) === null || _a === void 0 ? void 0 : _a.publisherDomain;
        }
        get version() {
            return this.local ? this.local.manifest.version : this.latestVersion;
        }
        get latestVersion() {
            return this.gallery ? this.gallery.version : this.local.manifest.version;
        }
        get description() {
            return this.gallery ? this.gallery.description : this.local.manifest.description || '';
        }
        get url() {
            if (!this.productService.extensionsGallery || !this.gallery) {
                return undefined;
            }
            return `${this.productService.extensionsGallery.itemUrl}?itemName=${this.publisher}.${this.name}`;
        }
        get iconUrl() {
            return this.galleryIconUrl || this.localIconUrl || this.defaultIconUrl;
        }
        get iconUrlFallback() {
            return this.galleryIconUrlFallback || this.localIconUrl || this.defaultIconUrl;
        }
        get localIconUrl() {
            if (this.local && this.local.manifest.icon) {
                return network_1.FileAccess.asBrowserUri(resources.joinPath(this.local.location, this.local.manifest.icon)).toString(true);
            }
            return null;
        }
        get galleryIconUrl() {
            var _a;
            return ((_a = this.gallery) === null || _a === void 0 ? void 0 : _a.assets.icon) ? this.gallery.assets.icon.uri : null;
        }
        get galleryIconUrlFallback() {
            var _a;
            return ((_a = this.gallery) === null || _a === void 0 ? void 0 : _a.assets.icon) ? this.gallery.assets.icon.fallbackUri : null;
        }
        get defaultIconUrl() {
            if (this.type === 0 /* ExtensionType.System */ && this.local) {
                if (this.local.manifest && this.local.manifest.contributes) {
                    if (Array.isArray(this.local.manifest.contributes.themes) && this.local.manifest.contributes.themes.length) {
                        return network_1.FileAccess.asBrowserUri('./media/theme-icon.png', require).toString(true);
                    }
                    if (Array.isArray(this.local.manifest.contributes.grammars) && this.local.manifest.contributes.grammars.length) {
                        return network_1.FileAccess.asBrowserUri('./media/language-icon.svg', require).toString(true);
                    }
                }
            }
            return extensionManagement_2.DefaultIconPath;
        }
        get repository() {
            return this.gallery && this.gallery.assets.repository ? this.gallery.assets.repository.uri : undefined;
        }
        get licenseUrl() {
            return this.gallery && this.gallery.assets.license ? this.gallery.assets.license.uri : undefined;
        }
        get state() {
            return this.stateProvider(this);
        }
        get installCount() {
            return this.gallery ? this.gallery.installCount : undefined;
        }
        get rating() {
            return this.gallery ? this.gallery.rating : undefined;
        }
        get ratingCount() {
            return this.gallery ? this.gallery.ratingCount : undefined;
        }
        get outdated() {
            try {
                if (!this.gallery || !this.local) {
                    return false;
                }
                // Do not allow updating system extensions in stable
                if (this.type === 0 /* ExtensionType.System */ && this.productService.quality === 'stable') {
                    return false;
                }
                if (!this.local.preRelease && this.gallery.properties.isPreReleaseVersion) {
                    return false;
                }
                if (semver.gt(this.latestVersion, this.version)) {
                    return true;
                }
                if (this.outdatedTargetPlatform) {
                    return true;
                }
            }
            catch (error) {
                /* Ignore */
            }
            return false;
        }
        get outdatedTargetPlatform() {
            return !!this.local && !!this.gallery
                && !["undefined" /* TargetPlatform.UNDEFINED */, "web" /* TargetPlatform.WEB */].includes(this.local.targetPlatform)
                && this.gallery.properties.targetPlatform !== "web" /* TargetPlatform.WEB */
                && this.local.targetPlatform !== this.gallery.properties.targetPlatform
                && semver.eq(this.latestVersion, this.version);
        }
        get telemetryData() {
            const { local, gallery } = this;
            if (gallery) {
                return (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(gallery);
            }
            else {
                return (0, extensionManagementUtil_1.getLocalExtensionTelemetryData)(local);
            }
        }
        get preview() {
            return this.gallery ? this.gallery.preview : false;
        }
        get hasPreReleaseVersion() {
            var _a;
            return !!((_a = this.gallery) === null || _a === void 0 ? void 0 : _a.hasPreReleaseVersion);
        }
        get hasReleaseVersion() {
            var _a;
            return !!((_a = this.gallery) === null || _a === void 0 ? void 0 : _a.hasReleaseVersion);
        }
        getLocal() {
            return this.local && !this.outdated ? this.local : undefined;
        }
        async getManifest(token) {
            const local = this.getLocal();
            if (local) {
                return local.manifest;
            }
            if (this.gallery) {
                if (this.gallery.assets.manifest) {
                    return this.galleryService.getManifest(this.gallery, token);
                }
                this.logService.error(nls.localize('Manifest is not found', "Manifest is not found"), this.identifier.id);
                return null;
            }
            return null;
        }
        hasReadme() {
            if (this.local && this.local.readmeUrl) {
                return true;
            }
            if (this.gallery && this.gallery.assets.readme) {
                return true;
            }
            return this.type === 0 /* ExtensionType.System */;
        }
        async getReadme(token) {
            const local = this.getLocal();
            if (local === null || local === void 0 ? void 0 : local.readmeUrl) {
                const content = await this.fileService.readFile(local.readmeUrl);
                return content.value.toString();
            }
            if (this.gallery) {
                if (this.gallery.assets.readme) {
                    return this.galleryService.getReadme(this.gallery, token);
                }
                this.telemetryService.publicLog('extensions:NotFoundReadMe', this.telemetryData);
            }
            if (this.type === 0 /* ExtensionType.System */) {
                return Promise.resolve(`# ${this.displayName || this.name}
**Notice:** This extension is bundled with Visual Studio Code. It can be disabled but not uninstalled.
## Features
${this.description}
`);
            }
            return Promise.reject(new Error('not available'));
        }
        hasChangelog() {
            if (this.local && this.local.changelogUrl) {
                return true;
            }
            if (this.gallery && this.gallery.assets.changelog) {
                return true;
            }
            return this.type === 0 /* ExtensionType.System */;
        }
        async getChangelog(token) {
            var _a;
            const local = this.getLocal();
            if (local === null || local === void 0 ? void 0 : local.changelogUrl) {
                const content = await this.fileService.readFile(local.changelogUrl);
                return content.value.toString();
            }
            if ((_a = this.gallery) === null || _a === void 0 ? void 0 : _a.assets.changelog) {
                return this.galleryService.getChangelog(this.gallery, token);
            }
            if (this.type === 0 /* ExtensionType.System */) {
                return Promise.resolve('Please check the [VS Code Release Notes](command:update.showCurrentReleaseNotes) for changes to the built-in extensions.');
            }
            return Promise.reject(new Error('not available'));
        }
        get categories() {
            const { local, gallery } = this;
            if (local && local.manifest.categories && !this.outdated) {
                return local.manifest.categories;
            }
            if (gallery) {
                return gallery.categories;
            }
            return [];
        }
        get tags() {
            const { gallery } = this;
            if (gallery) {
                return gallery.tags.filter(tag => !tag.startsWith('_'));
            }
            return [];
        }
        get dependencies() {
            const { local, gallery } = this;
            if (local && local.manifest.extensionDependencies && !this.outdated) {
                return local.manifest.extensionDependencies;
            }
            if (gallery) {
                return gallery.properties.dependencies || [];
            }
            return [];
        }
        get extensionPack() {
            const { local, gallery } = this;
            if (local && local.manifest.extensionPack && !this.outdated) {
                return local.manifest.extensionPack;
            }
            if (gallery) {
                return gallery.properties.extensionPack || [];
            }
            return [];
        }
    };
    Extension = __decorate([
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, log_1.ILogService),
        __param(7, files_1.IFileService),
        __param(8, productService_1.IProductService)
    ], Extension);
    exports.Extension = Extension;
    let Extensions = class Extensions extends lifecycle_1.Disposable {
        constructor(server, stateProvider, galleryService, extensionEnablementService, instantiationService) {
            super();
            this.server = server;
            this.stateProvider = stateProvider;
            this.galleryService = galleryService;
            this.extensionEnablementService = extensionEnablementService;
            this.instantiationService = instantiationService;
            this._onChange = this._register(new event_1.Emitter());
            this.installing = [];
            this.uninstalling = [];
            this.installed = [];
            this._register(server.extensionManagementService.onInstallExtension(e => this.onInstallExtension(e)));
            this._register(server.extensionManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
            this._register(server.extensionManagementService.onUninstallExtension(e => this.onUninstallExtension(e)));
            this._register(server.extensionManagementService.onDidUninstallExtension(e => this.onDidUninstallExtension(e)));
            this._register(extensionEnablementService.onEnablementChanged(e => this.onEnablementChanged(e)));
        }
        static updateExtensionFromControlManifest(extension, extensionsControlManifest) {
            const isMalicious = extensionsControlManifest.malicious.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, identifier));
            if (extension.isMalicious !== isMalicious) {
                extension.isMalicious = isMalicious;
            }
            const unsupportedPreRelease = extensionsControlManifest.unsupportedPreReleaseExtensions ? extensionsControlManifest.unsupportedPreReleaseExtensions[extension.identifier.id.toLowerCase()] : undefined;
            if (unsupportedPreRelease) {
                if ((0, types_1.isBoolean)(extension.isUnsupported) || !(0, extensionManagementUtil_1.areSameExtensions)({ id: extension.isUnsupported.preReleaseExtension.id }, { id: unsupportedPreRelease.id })) {
                    extension.isUnsupported = { preReleaseExtension: unsupportedPreRelease };
                }
            }
            else if (extension.isUnsupported) {
                extension.isUnsupported = false;
            }
        }
        get onChange() { return this._onChange.event; }
        get local() {
            const installing = this.installing
                .filter(e => !this.installed.some(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier)))
                .map(e => e);
            return [...this.installed, ...installing];
        }
        async queryInstalled() {
            const extensionsControlManifest = await this.server.extensionManagementService.getExtensionsControlManifest();
            const all = await this.server.extensionManagementService.getInstalled();
            // dedup user and system extensions by giving priority to user extensions.
            const installed = (0, extensionManagementUtil_1.groupByExtension)(all, r => r.identifier).reduce((result, extensions) => {
                const extension = extensions.length === 1 ? extensions[0]
                    : extensions.find(e => e.type === 1 /* ExtensionType.User */) || extensions.find(e => e.type === 0 /* ExtensionType.System */);
                result.push(extension);
                return result;
            }, []);
            const byId = (0, arrays_1.index)(this.installed, e => e.local ? e.local.identifier.id : e.identifier.id);
            this.installed = installed.map(local => {
                const extension = byId[local.identifier.id] || this.instantiationService.createInstance(Extension, this.stateProvider, this.server, local, undefined);
                extension.local = local;
                extension.enablementState = this.extensionEnablementService.getEnablementState(local);
                Extensions.updateExtensionFromControlManifest(extension, extensionsControlManifest);
                return extension;
            });
            this._onChange.fire(undefined);
            return this.local;
        }
        async syncInstalledExtensionsWithGallery(galleryExtensions) {
            let hasChanged = false;
            const extensions = await this.mapInstalledExtensionWithCompatibleGalleryExtension(galleryExtensions);
            for (const [extension, gallery] of extensions) {
                // update metadata of the extension if it does not exist
                if (extension.local && !extension.local.identifier.uuid) {
                    extension.local = await this.updateMetadata(extension.local, gallery);
                }
                if (!extension.gallery || extension.gallery.version !== gallery.version || extension.gallery.properties.targetPlatform !== gallery.properties.targetPlatform) {
                    extension.gallery = gallery;
                    this._onChange.fire({ extension });
                    hasChanged = true;
                }
            }
            return hasChanged;
        }
        async mapInstalledExtensionWithCompatibleGalleryExtension(galleryExtensions) {
            const mappedExtensions = this.mapInstalledExtensionWithGalleryExtension(galleryExtensions);
            const targetPlatform = await this.server.extensionManagementService.getTargetPlatform();
            const compatibleGalleryExtensions = [];
            const compatibleGalleryExtensionsToFetch = [];
            await Promise.allSettled(mappedExtensions.map(async ([extension, gallery]) => {
                if (extension.local) {
                    if (await this.galleryService.isExtensionCompatible(gallery, extension.local.preRelease, targetPlatform)) {
                        compatibleGalleryExtensions.push(gallery);
                    }
                    else {
                        compatibleGalleryExtensionsToFetch.push(Object.assign(Object.assign({}, extension.local.identifier), { preRelease: extension.local.preRelease }));
                    }
                }
            }));
            if (compatibleGalleryExtensionsToFetch.length) {
                const result = await this.galleryService.getExtensions(compatibleGalleryExtensionsToFetch, { targetPlatform, compatible: true, queryAllVersions: true }, cancellation_1.CancellationToken.None);
                compatibleGalleryExtensions.push(...result);
            }
            return this.mapInstalledExtensionWithGalleryExtension(compatibleGalleryExtensions);
        }
        mapInstalledExtensionWithGalleryExtension(galleryExtensions) {
            const mappedExtensions = [];
            const byUUID = new Map(), byID = new Map();
            for (const gallery of galleryExtensions) {
                byUUID.set(gallery.identifier.uuid, gallery);
                byID.set(gallery.identifier.id.toLowerCase(), gallery);
            }
            for (const installed of this.installed) {
                if (installed.uuid) {
                    const gallery = byUUID.get(installed.uuid);
                    if (gallery) {
                        mappedExtensions.push([installed, gallery]);
                        continue;
                    }
                }
                const gallery = byID.get(installed.identifier.id.toLowerCase());
                if (gallery) {
                    mappedExtensions.push([installed, gallery]);
                }
            }
            return mappedExtensions;
        }
        async updateMetadata(localExtension, gallery) {
            var _a;
            let isPreReleaseVersion = false;
            if (localExtension.manifest.version !== gallery.version) {
                const galleryWithLocalVersion = (await this.galleryService.getExtensions([Object.assign(Object.assign({}, localExtension.identifier), { version: localExtension.manifest.version })], cancellation_1.CancellationToken.None))[0];
                isPreReleaseVersion = !!((_a = galleryWithLocalVersion === null || galleryWithLocalVersion === void 0 ? void 0 : galleryWithLocalVersion.properties) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion);
            }
            return this.server.extensionManagementService.updateMetadata(localExtension, { id: gallery.identifier.uuid, publisherDisplayName: gallery.publisherDisplayName, publisherId: gallery.publisherId, isPreReleaseVersion });
        }
        canInstall(galleryExtension) {
            return this.server.extensionManagementService.canInstall(galleryExtension);
        }
        onInstallExtension(event) {
            const { source } = event;
            if (source && !uri_1.URI.isUri(source)) {
                const extension = this.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, source.identifier))[0]
                    || this.instantiationService.createInstance(Extension, this.stateProvider, this.server, undefined, source);
                this.installing.push(extension);
                this._onChange.fire({ extension });
            }
        }
        onDidInstallExtensions(results) {
            for (const event of results) {
                const { local, source } = event;
                const gallery = source && !uri_1.URI.isUri(source) ? source : undefined;
                const location = source && uri_1.URI.isUri(source) ? source : undefined;
                const installingExtension = gallery ? this.installing.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, gallery.identifier))[0] : null;
                this.installing = installingExtension ? this.installing.filter(e => e !== installingExtension) : this.installing;
                let extension = installingExtension ? installingExtension
                    : (location || local) ? this.instantiationService.createInstance(Extension, this.stateProvider, this.server, local, undefined)
                        : undefined;
                if (extension) {
                    if (local) {
                        const installed = this.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0];
                        if (installed) {
                            extension = installed;
                        }
                        else {
                            this.installed.push(extension);
                        }
                        extension.local = local;
                        if (!extension.gallery) {
                            extension.gallery = gallery;
                        }
                        extension.enablementState = this.extensionEnablementService.getEnablementState(local);
                    }
                }
                this._onChange.fire(!local || !extension ? undefined : { extension, operation: event.operation });
                if (extension && extension.local && !extension.gallery) {
                    this.syncInstalledExtensionWithGallery(extension);
                }
            }
        }
        async syncInstalledExtensionWithGallery(extension) {
            var _a;
            if (!this.galleryService.isEnabled()) {
                return;
            }
            const [compatible] = await this.galleryService.getExtensions([Object.assign(Object.assign({}, extension.identifier), { preRelease: (_a = extension.local) === null || _a === void 0 ? void 0 : _a.preRelease })], { compatible: true, targetPlatform: await this.server.extensionManagementService.getTargetPlatform() }, cancellation_1.CancellationToken.None);
            if (compatible) {
                extension.gallery = compatible;
                this._onChange.fire({ extension });
            }
        }
        onUninstallExtension(identifier) {
            const extension = this.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier))[0];
            if (extension) {
                const uninstalling = this.uninstalling.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier))[0] || extension;
                this.uninstalling = [uninstalling, ...this.uninstalling.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier))];
                this._onChange.fire(uninstalling ? { extension: uninstalling } : undefined);
            }
        }
        onDidUninstallExtension({ identifier, error }) {
            const uninstalled = this.uninstalling.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier)) || this.installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier));
            this.uninstalling = this.uninstalling.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier));
            if (!error) {
                this.installed = this.installed.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier));
            }
            if (uninstalled) {
                this._onChange.fire({ extension: uninstalled });
            }
        }
        onEnablementChanged(platformExtensions) {
            const extensions = this.local.filter(e => platformExtensions.some(p => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, p.identifier)));
            for (const extension of extensions) {
                if (extension.local) {
                    const enablementState = this.extensionEnablementService.getEnablementState(extension.local);
                    if (enablementState !== extension.enablementState) {
                        extension.enablementState = enablementState;
                        this._onChange.fire({ extension: extension });
                    }
                }
            }
        }
        getExtensionState(extension) {
            if (extension.gallery && this.installing.some(e => !!e.gallery && (0, extensionManagementUtil_1.areSameExtensions)(e.gallery.identifier, extension.gallery.identifier))) {
                return 0 /* ExtensionState.Installing */;
            }
            if (this.uninstalling.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))) {
                return 2 /* ExtensionState.Uninstalling */;
            }
            const local = this.installed.filter(e => e === extension || (e.gallery && extension.gallery && (0, extensionManagementUtil_1.areSameExtensions)(e.gallery.identifier, extension.gallery.identifier)))[0];
            return local ? 1 /* ExtensionState.Installed */ : 3 /* ExtensionState.Uninstalled */;
        }
    };
    Extensions = __decorate([
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(4, instantiation_1.IInstantiationService)
    ], Extensions);
    let ExtensionsWorkbenchService = class ExtensionsWorkbenchService extends lifecycle_1.Disposable {
        constructor(instantiationService, editorService, extensionManagementService, galleryService, configurationService, telemetryService, notificationService, urlService, extensionEnablementService, hostService, progressService, extensionManagementServerService, storageService, languageService, extensionsSyncManagementService, userDataAutoSyncService, productService, contextKeyService, extensionManifestPropertiesService, logService, extensionService) {
            super();
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.extensionManagementService = extensionManagementService;
            this.galleryService = galleryService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.extensionEnablementService = extensionEnablementService;
            this.hostService = hostService;
            this.progressService = progressService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.storageService = storageService;
            this.languageService = languageService;
            this.extensionsSyncManagementService = extensionsSyncManagementService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.productService = productService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.localExtensions = null;
            this.remoteExtensions = null;
            this.webExtensions = null;
            this._onChange = new event_1.Emitter();
            this.preferPreReleases = this.productService.quality !== 'stable';
            this.installing = [];
            this._activityCallBack = null;
            const preferPreReleasesValue = configurationService.getValue('_extensions.preferPreReleases');
            if (!(0, types_1.isUndefined)(preferPreReleasesValue)) {
                this.preferPreReleases = !!preferPreReleasesValue;
            }
            this.hasOutdatedExtensionsContextKey = extensions_1.HasOutdatedExtensionsContext.bindTo(contextKeyService);
            if (extensionManagementServerService.localExtensionManagementServer) {
                this.localExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.localExtensionManagementServer, ext => this.getExtensionState(ext)));
                this._register(this.localExtensions.onChange(e => this._onChange.fire(e ? e.extension : undefined)));
            }
            if (extensionManagementServerService.remoteExtensionManagementServer) {
                this.remoteExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.remoteExtensionManagementServer, ext => this.getExtensionState(ext)));
                this._register(this.remoteExtensions.onChange(e => this._onChange.fire(e ? e.extension : undefined)));
            }
            if (extensionManagementServerService.webExtensionManagementServer) {
                this.webExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.webExtensionManagementServer, ext => this.getExtensionState(ext)));
                this._register(this.webExtensions.onChange(e => this._onChange.fire(e ? e.extension : undefined)));
            }
            this.updatesCheckDelayer = new async_1.ThrottledDelayer(ExtensionsWorkbenchService.UpdatesCheckInterval);
            this.autoUpdateDelayer = new async_1.ThrottledDelayer(1000);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.updatesCheckDelayer.cancel();
                this.autoUpdateDelayer.cancel();
            }));
            urlService.registerHandler(this);
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(extensions_1.AutoUpdateConfigurationKey)) {
                    if (this.isAutoUpdateEnabled()) {
                        this.checkForUpdates();
                    }
                }
                if (e.affectsConfiguration(extensions_1.AutoCheckUpdatesConfigurationKey)) {
                    if (this.isAutoCheckUpdatesEnabled()) {
                        this.checkForUpdates();
                    }
                }
            }, this));
            this._register(extensionEnablementService.onEnablementChanged(platformExtensions => {
                if (this.getAutoUpdateValue() === 'onlyEnabledExtensions' && platformExtensions.some(e => this.extensionEnablementService.isEnabled(e))) {
                    this.checkForUpdates();
                }
            }, this));
            this.queryLocal().then(() => {
                this.resetIgnoreAutoUpdateExtensions();
                this.eventuallyCheckForUpdates(true);
                // Always auto update builtin extensions in web
                if (platform_1.isWeb && !this.isAutoUpdateEnabled()) {
                    this.autoUpdateBuiltinExtensions();
                }
            });
            this._register(this.onChange(() => {
                this.updateContexts();
                this.updateActivity();
            }));
        }
        get onChange() { return this._onChange.event; }
        get local() {
            const byId = (0, extensionManagementUtil_1.groupByExtension)(this.installed, r => r.identifier);
            return byId.reduce((result, extensions) => { result.push(this.getPrimaryExtension(extensions)); return result; }, []);
        }
        get installed() {
            const result = [];
            if (this.localExtensions) {
                result.push(...this.localExtensions.local);
            }
            if (this.remoteExtensions) {
                result.push(...this.remoteExtensions.local);
            }
            if (this.webExtensions) {
                result.push(...this.webExtensions.local);
            }
            return result;
        }
        get outdated() {
            const allLocal = [];
            if (this.localExtensions) {
                allLocal.push(...this.localExtensions.local);
            }
            if (this.remoteExtensions) {
                allLocal.push(...this.remoteExtensions.local);
            }
            if (this.webExtensions) {
                allLocal.push(...this.webExtensions.local);
            }
            return allLocal.filter(e => e.outdated && e.local && e.state === 1 /* ExtensionState.Installed */);
        }
        async queryLocal(server) {
            if (server) {
                if (this.localExtensions && this.extensionManagementServerService.localExtensionManagementServer === server) {
                    return this.localExtensions.queryInstalled();
                }
                if (this.remoteExtensions && this.extensionManagementServerService.remoteExtensionManagementServer === server) {
                    return this.remoteExtensions.queryInstalled();
                }
                if (this.webExtensions && this.extensionManagementServerService.webExtensionManagementServer === server) {
                    return this.webExtensions.queryInstalled();
                }
            }
            if (this.localExtensions) {
                try {
                    await this.localExtensions.queryInstalled();
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            if (this.remoteExtensions) {
                try {
                    await this.remoteExtensions.queryInstalled();
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            if (this.webExtensions) {
                try {
                    await this.webExtensions.queryInstalled();
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            return this.local;
        }
        async queryGallery(arg1, arg2) {
            const options = cancellation_1.CancellationToken.isCancellationToken(arg1) ? {} : arg1;
            const token = cancellation_1.CancellationToken.isCancellationToken(arg1) ? arg1 : arg2;
            options.text = options.text ? this.resolveQueryText(options.text) : options.text;
            options.includePreRelease = (0, types_1.isUndefined)(options.includePreRelease) ? this.preferPreReleases : options.includePreRelease;
            const extensionsControlManifest = await this.extensionManagementService.getExtensionsControlManifest();
            try {
                const pager = await this.galleryService.query(options, token);
                this.syncInstalledExtensionsWithGallery(pager.firstPage);
                return {
                    firstPage: pager.firstPage.map(gallery => this.fromGallery(gallery, extensionsControlManifest)),
                    total: pager.total,
                    pageSize: pager.pageSize,
                    getPage: async (pageIndex, token) => {
                        const page = await pager.getPage(pageIndex, token);
                        this.syncInstalledExtensionsWithGallery(page);
                        return page.map(gallery => this.fromGallery(gallery, extensionsControlManifest));
                    }
                };
            }
            catch (error) {
                if (/No extension gallery service configured/.test(error.message)) {
                    return Promise.resolve((0, paging_1.singlePagePager)([]));
                }
                throw error;
            }
        }
        async getExtensions(extensionInfos, arg1, arg2) {
            extensionInfos.forEach(e => { var _a; return e.preRelease = (_a = e.preRelease) !== null && _a !== void 0 ? _a : this.preferPreReleases; });
            const extensionsControlManifest = await this.extensionManagementService.getExtensionsControlManifest();
            const galleryExtensions = await this.galleryService.getExtensions(extensionInfos, arg1, arg2);
            this.syncInstalledExtensionsWithGallery(galleryExtensions);
            return galleryExtensions.map(gallery => this.fromGallery(gallery, extensionsControlManifest));
        }
        resolveQueryText(text) {
            text = text.replace(/@web/g, `tag:"${extensionManagement_1.WEB_EXTENSION_TAG}"`);
            const extensionRegex = /\bext:([^\s]+)\b/g;
            if (extensionRegex.test(text)) {
                text = text.replace(extensionRegex, (m, ext) => {
                    // Get curated keywords
                    const lookup = this.productService.extensionKeywords || {};
                    const keywords = lookup[ext] || [];
                    // Get mode name
                    const languageId = this.languageService.guessLanguageIdByFilepathOrFirstLine(uri_1.URI.file(`.${ext}`));
                    const languageName = languageId && this.languageService.getLanguageName(languageId);
                    const languageTag = languageName ? ` tag:"${languageName}"` : '';
                    // Construct a rich query
                    return `tag:"__ext_${ext}" tag:"__ext_.${ext}" ${keywords.map(tag => `tag:"${tag}"`).join(' ')}${languageTag} tag:"${ext}"`;
                });
            }
            return text.substr(0, 350);
        }
        fromGallery(gallery, extensionsControlManifest) {
            let extension = this.getInstalledExtensionMatchingGallery(gallery);
            if (!extension) {
                extension = this.instantiationService.createInstance(Extension, ext => this.getExtensionState(ext), undefined, undefined, gallery);
                Extensions.updateExtensionFromControlManifest(extension, extensionsControlManifest);
            }
            return extension;
        }
        getInstalledExtensionMatchingGallery(gallery) {
            for (const installed of this.local) {
                if (installed.identifier.uuid) { // Installed from Gallery
                    if (installed.identifier.uuid === gallery.identifier.uuid) {
                        return installed;
                    }
                }
                else {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, gallery.identifier)) { // Installed from other sources
                        return installed;
                    }
                }
            }
            return null;
        }
        async open(extension, options) {
            const editor = await this.editorService.openEditor(this.instantiationService.createInstance(extensionsInput_1.ExtensionsInput, extension), options, (options === null || options === void 0 ? void 0 : options.sideByside) ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            if ((options === null || options === void 0 ? void 0 : options.tab) && editor instanceof extensionEditor_1.ExtensionEditor) {
                await editor.openTab(options.tab);
            }
        }
        getExtensionStatus(extension) {
            const extensionsStatus = this.extensionService.getExtensionsStatus();
            for (const id of Object.keys(extensionsStatus)) {
                if ((0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier)) {
                    return extensionsStatus[id];
                }
            }
            return undefined;
        }
        getPrimaryExtension(extensions) {
            var _a, _b;
            if (extensions.length === 1) {
                return extensions[0];
            }
            const enabledExtensions = extensions.filter(e => e.local && this.extensionEnablementService.isEnabled(e.local));
            if (enabledExtensions.length === 1) {
                return enabledExtensions[0];
            }
            const extensionsToChoose = enabledExtensions.length ? enabledExtensions : extensions;
            const manifest = (_b = (_a = extensionsToChoose.find(e => e.local && e.local.manifest)) === null || _a === void 0 ? void 0 : _a.local) === null || _b === void 0 ? void 0 : _b.manifest;
            // Manifest is not found which should not happen.
            // In which case return the first extension.
            if (!manifest) {
                return extensionsToChoose[0];
            }
            const extensionKinds = this.extensionManifestPropertiesService.getExtensionKind(manifest);
            let extension = extensionsToChoose.find(extension => {
                for (const extensionKind of extensionKinds) {
                    switch (extensionKind) {
                        case 'ui':
                            /* UI extension is chosen only if it is installed locally */
                            if (extension.server === this.extensionManagementServerService.localExtensionManagementServer) {
                                return true;
                            }
                            return false;
                        case 'workspace':
                            /* Choose remote workspace extension if exists */
                            if (extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                                return true;
                            }
                            return false;
                        case 'web':
                            /* Choose web extension if exists */
                            if (extension.server === this.extensionManagementServerService.webExtensionManagementServer) {
                                return true;
                            }
                            return false;
                    }
                }
                return false;
            });
            if (!extension && this.extensionManagementServerService.localExtensionManagementServer) {
                extension = extensionsToChoose.find(extension => {
                    for (const extensionKind of extensionKinds) {
                        switch (extensionKind) {
                            case 'workspace':
                                /* Choose local workspace extension if exists */
                                if (extension.server === this.extensionManagementServerService.localExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                            case 'web':
                                /* Choose local web extension if exists */
                                if (extension.server === this.extensionManagementServerService.localExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                        }
                    }
                    return false;
                });
            }
            if (!extension && this.extensionManagementServerService.webExtensionManagementServer) {
                extension = extensionsToChoose.find(extension => {
                    for (const extensionKind of extensionKinds) {
                        switch (extensionKind) {
                            case 'web':
                                /* Choose web extension if exists */
                                if (extension.server === this.extensionManagementServerService.webExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                        }
                    }
                    return false;
                });
            }
            if (!extension && this.extensionManagementServerService.remoteExtensionManagementServer) {
                extension = extensionsToChoose.find(extension => {
                    for (const extensionKind of extensionKinds) {
                        switch (extensionKind) {
                            case 'web':
                                /* Choose remote web extension if exists */
                                if (extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                                    return true;
                                }
                                return false;
                        }
                    }
                    return false;
                });
            }
            return extension || extensions[0];
        }
        getExtensionState(extension) {
            const isInstalling = this.installing.some(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, extension.identifier));
            if (extension.server) {
                const state = (extension.server === this.extensionManagementServerService.localExtensionManagementServer
                    ? this.localExtensions : extension.server === this.extensionManagementServerService.remoteExtensionManagementServer ? this.remoteExtensions : this.webExtensions).getExtensionState(extension);
                return state === 3 /* ExtensionState.Uninstalled */ && isInstalling ? 0 /* ExtensionState.Installing */ : state;
            }
            else if (isInstalling) {
                return 0 /* ExtensionState.Installing */;
            }
            if (this.remoteExtensions) {
                const state = this.remoteExtensions.getExtensionState(extension);
                if (state !== 3 /* ExtensionState.Uninstalled */) {
                    return state;
                }
            }
            if (this.webExtensions) {
                const state = this.webExtensions.getExtensionState(extension);
                if (state !== 3 /* ExtensionState.Uninstalled */) {
                    return state;
                }
            }
            if (this.localExtensions) {
                return this.localExtensions.getExtensionState(extension);
            }
            return 3 /* ExtensionState.Uninstalled */;
        }
        async checkForUpdates(onlyBuiltin) {
            var _a, _b;
            const extensions = [];
            if (this.localExtensions) {
                extensions.push(this.localExtensions);
            }
            if (this.remoteExtensions) {
                extensions.push(this.remoteExtensions);
            }
            if (this.webExtensions) {
                extensions.push(this.webExtensions);
            }
            if (!extensions.length) {
                return;
            }
            const infos = [];
            for (const installed of this.local) {
                if (onlyBuiltin && !installed.isBuiltin) {
                    // Skip if check updates only for builtin extensions and current extension is not builtin.
                    continue;
                }
                if (installed.isBuiltin && (!((_a = installed.local) === null || _a === void 0 ? void 0 : _a.identifier.uuid) || this.productService.quality !== 'stable')) {
                    // Skip if the builtin extension does not have Marketplace identifier or the current quality is not stable.
                    continue;
                }
                infos.push(Object.assign(Object.assign({}, installed.identifier), { preRelease: !!((_b = installed.local) === null || _b === void 0 ? void 0 : _b.preRelease) }));
            }
            if (infos.length) {
                const targetPlatform = await extensions[0].server.extensionManagementService.getTargetPlatform();
                const galleryExtensions = await this.galleryService.getExtensions(infos, { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
                if (galleryExtensions.length) {
                    await this.syncInstalledExtensionsWithGallery(galleryExtensions);
                }
            }
        }
        async syncInstalledExtensionsWithGallery(gallery) {
            const extensions = [];
            if (this.localExtensions) {
                extensions.push(this.localExtensions);
            }
            if (this.remoteExtensions) {
                extensions.push(this.remoteExtensions);
            }
            if (this.webExtensions) {
                extensions.push(this.webExtensions);
            }
            if (!extensions.length) {
                return;
            }
            const result = await Promise.allSettled(extensions.map(extensions => extensions.syncInstalledExtensionsWithGallery(gallery)));
            if (this.isAutoUpdateEnabled() && result.some(r => r.status === 'fulfilled' && r.value)) {
                this.eventuallyAutoUpdateExtensions();
            }
        }
        getAutoUpdateValue() {
            const autoUpdate = this.configurationService.getValue(extensions_1.AutoUpdateConfigurationKey);
            return (0, types_1.isBoolean)(autoUpdate) || autoUpdate === 'onlyEnabledExtensions' ? autoUpdate : true;
        }
        isAutoUpdateEnabled() {
            return this.getAutoUpdateValue() !== false;
        }
        isAutoCheckUpdatesEnabled() {
            return this.configurationService.getValue(extensions_1.AutoCheckUpdatesConfigurationKey);
        }
        eventuallyCheckForUpdates(immediate = false) {
            this.updatesCheckDelayer.trigger(async () => {
                if (this.isAutoUpdateEnabled() || this.isAutoCheckUpdatesEnabled()) {
                    await this.checkForUpdates();
                }
                this.eventuallyCheckForUpdates();
            }, immediate ? 0 : ExtensionsWorkbenchService.UpdatesCheckInterval).then(undefined, err => null);
        }
        eventuallyAutoUpdateExtensions() {
            this.autoUpdateDelayer.trigger(() => this.autoUpdateExtensions())
                .then(undefined, err => null);
        }
        async autoUpdateBuiltinExtensions() {
            await this.checkForUpdates(true);
            const toUpdate = this.outdated.filter(e => e.isBuiltin);
            await async_1.Promises.settled(toUpdate.map(e => { var _a; return this.install(e, ((_a = e.local) === null || _a === void 0 ? void 0 : _a.preRelease) ? { installPreReleaseVersion: true } : undefined); }));
        }
        autoUpdateExtensions() {
            if (!this.isAutoUpdateEnabled()) {
                return Promise.resolve();
            }
            const toUpdate = this.outdated.filter(e => !this.isAutoUpdateIgnored(new extensionManagementUtil_1.ExtensionKey(e.identifier, e.version)) &&
                (this.getAutoUpdateValue() === true || (e.local && this.extensionEnablementService.isEnabled(e.local))));
            return async_1.Promises.settled(toUpdate.map(e => { var _a; return this.install(e, ((_a = e.local) === null || _a === void 0 ? void 0 : _a.preRelease) ? { installPreReleaseVersion: true } : undefined); }));
        }
        async canInstall(extension) {
            if (!(extension instanceof Extension)) {
                return false;
            }
            if (extension.isMalicious) {
                return false;
            }
            if (extension.isUnsupported) {
                return false;
            }
            if (!extension.gallery) {
                return false;
            }
            if (this.localExtensions && await this.localExtensions.canInstall(extension.gallery)) {
                return true;
            }
            if (this.remoteExtensions && await this.remoteExtensions.canInstall(extension.gallery)) {
                return true;
            }
            if (this.webExtensions && await this.webExtensions.canInstall(extension.gallery)) {
                return true;
            }
            return false;
        }
        install(extension, installOptions) {
            if (extension instanceof uri_1.URI) {
                return this.installWithProgress(() => this.installFromVSIX(extension, installOptions));
            }
            if (extension.isMalicious) {
                return Promise.reject(new Error(nls.localize('malicious', "This extension is reported to be problematic.")));
            }
            const gallery = extension.gallery;
            if (!gallery) {
                return Promise.reject(new Error('Missing gallery'));
            }
            return this.installWithProgress(() => this.installFromGallery(extension, gallery, installOptions), gallery.displayName);
        }
        setEnablement(extensions, enablementState) {
            extensions = Array.isArray(extensions) ? extensions : [extensions];
            return this.promptAndSetEnablement(extensions, enablementState);
        }
        uninstall(extension) {
            const ext = extension.local ? extension : this.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0];
            const toUninstall = ext && ext.local ? ext.local : null;
            if (!toUninstall) {
                return Promise.reject(new Error('Missing local'));
            }
            return this.progressService.withProgress({
                location: 5 /* ProgressLocation.Extensions */,
                title: nls.localize('uninstallingExtension', 'Uninstalling extension....'),
                source: `${toUninstall.identifier.id}`
            }, () => this.extensionManagementService.uninstall(toUninstall).then(() => undefined));
        }
        async installVersion(extension, version, installOptions = {}) {
            if (!(extension instanceof Extension)) {
                return extension;
            }
            if (!extension.gallery) {
                throw new Error('Missing gallery');
            }
            const [gallery] = await this.galleryService.getExtensions([{ id: extension.gallery.identifier.id, version }], cancellation_1.CancellationToken.None);
            if (!gallery) {
                throw new Error(nls.localize('not found', "Unable to install extension '{0}' because the requested version '{1}' is not found.", extension.gallery.identifier.id, version));
            }
            return this.installWithProgress(async () => {
                installOptions.installGivenVersion = true;
                const installed = await this.installFromGallery(extension, gallery, installOptions);
                if (extension.latestVersion !== version) {
                    this.ignoreAutoUpdate(new extensionManagementUtil_1.ExtensionKey(gallery.identifier, version));
                }
                return installed;
            }, gallery.displayName);
        }
        reinstall(extension) {
            const ext = extension.local ? extension : this.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0];
            const toReinstall = ext && ext.local ? ext.local : null;
            if (!toReinstall) {
                return Promise.reject(new Error('Missing local'));
            }
            return this.progressService.withProgress({
                location: 5 /* ProgressLocation.Extensions */,
                source: `${toReinstall.identifier.id}`
            }, () => this.extensionManagementService.reinstallFromGallery(toReinstall).then(() => this.local.filter(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, extension.identifier))[0]));
        }
        isExtensionIgnoredToSync(extension) {
            return extension.local ? !this.isInstalledExtensionSynced(extension.local)
                : this.extensionsSyncManagementService.hasToNeverSyncExtension(extension.identifier.id);
        }
        async toggleExtensionIgnoredToSync(extension) {
            const isIgnored = this.isExtensionIgnoredToSync(extension);
            if (extension.local && isIgnored) {
                extension.local = await this.updateSynchronizingInstalledExtension(extension.local, true);
                this._onChange.fire(extension);
            }
            else {
                this.extensionsSyncManagementService.updateIgnoredExtensions(extension.identifier.id, !isIgnored);
            }
            await this.userDataAutoSyncService.triggerSync(['IgnoredExtensionsUpdated'], false, false);
        }
        isInstalledExtensionSynced(extension) {
            if (extension.isMachineScoped) {
                return false;
            }
            if (this.extensionsSyncManagementService.hasToAlwaysSyncExtension(extension.identifier.id)) {
                return true;
            }
            return !this.extensionsSyncManagementService.hasToNeverSyncExtension(extension.identifier.id);
        }
        async updateSynchronizingInstalledExtension(extension, sync) {
            const isMachineScoped = !sync;
            if (extension.isMachineScoped !== isMachineScoped) {
                extension = await this.extensionManagementService.updateExtensionScope(extension, isMachineScoped);
            }
            if (sync) {
                this.extensionsSyncManagementService.updateIgnoredExtensions(extension.identifier.id, false);
            }
            return extension;
        }
        installWithProgress(installTask, extensionName) {
            const title = extensionName ? nls.localize('installing named extension', "Installing '{0}' extension....", extensionName) : nls.localize('installing extension', 'Installing extension....');
            return this.progressService.withProgress({
                location: 5 /* ProgressLocation.Extensions */,
                title
            }, () => installTask());
        }
        async installFromVSIX(vsix, installOptions) {
            const manifest = await this.extensionManagementService.getManifest(vsix);
            const existingExtension = this.local.find(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) }));
            const { identifier } = await this.extensionManagementService.install(vsix, installOptions);
            if (existingExtension && existingExtension.latestVersion !== manifest.version) {
                this.ignoreAutoUpdate(new extensionManagementUtil_1.ExtensionKey(identifier, manifest.version));
            }
            return this.local.filter(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, identifier))[0];
        }
        async installFromGallery(extension, gallery, installOptions) {
            this.installing.push(extension);
            this._onChange.fire(extension);
            try {
                if (extension.state === 1 /* ExtensionState.Installed */ && extension.local) {
                    await this.extensionManagementService.updateFromGallery(gallery, extension.local, installOptions);
                }
                else {
                    await this.extensionManagementService.installFromGallery(gallery, installOptions);
                }
                return this.local.filter(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, gallery.identifier))[0];
            }
            finally {
                this.installing = this.installing.filter(e => e !== extension);
                this._onChange.fire(this.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0]);
            }
        }
        promptAndSetEnablement(extensions, enablementState) {
            const enable = enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */;
            if (enable) {
                const allDependenciesAndPackedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: true, pack: true });
                return this.checkAndSetEnablement(extensions, allDependenciesAndPackedExtensions, enablementState);
            }
            else {
                const packedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: false, pack: true });
                if (packedExtensions.length) {
                    return this.checkAndSetEnablement(extensions, packedExtensions, enablementState);
                }
                return this.checkAndSetEnablement(extensions, [], enablementState);
            }
        }
        checkAndSetEnablement(extensions, otherExtensions, enablementState) {
            const allExtensions = [...extensions, ...otherExtensions];
            const enable = enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */;
            if (!enable) {
                for (const extension of extensions) {
                    let dependents = this.getDependentsAfterDisablement(extension, allExtensions, this.local);
                    if (dependents.length) {
                        return new Promise((resolve, reject) => {
                            this.notificationService.prompt(notification_1.Severity.Error, this.getDependentsErrorMessage(extension, allExtensions, dependents), [
                                {
                                    label: nls.localize('disable all', 'Disable All'),
                                    run: async () => {
                                        try {
                                            await this.checkAndSetEnablement(dependents, [extension], enablementState);
                                            resolve();
                                        }
                                        catch (error) {
                                            reject(error);
                                        }
                                    }
                                }
                            ], {
                                onCancel: () => reject(new errors_1.CancellationError())
                            });
                        });
                    }
                }
            }
            return this.doSetEnablement(allExtensions, enablementState);
        }
        getExtensionsRecursively(extensions, installed, enablementState, options, checked = []) {
            const toCheck = extensions.filter(e => checked.indexOf(e) === -1);
            if (toCheck.length) {
                for (const extension of toCheck) {
                    checked.push(extension);
                }
                const extensionsToDisable = installed.filter(i => {
                    if (checked.indexOf(i) !== -1) {
                        return false;
                    }
                    if (i.enablementState === enablementState) {
                        return false;
                    }
                    const enable = enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */;
                    return (enable || !i.isBuiltin) // Include all Extensions for enablement and only non builtin extensions for disablement
                        && (options.dependencies || options.pack)
                        && extensions.some(extension => (options.dependencies && extension.dependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier)))
                            || (options.pack && extension.extensionPack.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier))));
                });
                if (extensionsToDisable.length) {
                    extensionsToDisable.push(...this.getExtensionsRecursively(extensionsToDisable, installed, enablementState, options, checked));
                }
                return extensionsToDisable;
            }
            return [];
        }
        getDependentsAfterDisablement(extension, extensionsToDisable, installed) {
            return installed.filter(i => {
                if (i.dependencies.length === 0) {
                    return false;
                }
                if (i === extension) {
                    return false;
                }
                if (!this.extensionEnablementService.isEnabledEnablementState(i.enablementState)) {
                    return false;
                }
                if (extensionsToDisable.indexOf(i) !== -1) {
                    return false;
                }
                return i.dependencies.some(dep => [extension, ...extensionsToDisable].some(d => (0, extensionManagementUtil_1.areSameExtensions)(d.identifier, { id: dep })));
            });
        }
        getDependentsErrorMessage(extension, allDisabledExtensions, dependents) {
            for (const e of [extension, ...allDisabledExtensions]) {
                let dependentsOfTheExtension = dependents.filter(d => d.dependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, e.identifier)));
                if (dependentsOfTheExtension.length) {
                    return this.getErrorMessageForDisablingAnExtensionWithDependents(e, dependentsOfTheExtension);
                }
            }
            return '';
        }
        getErrorMessageForDisablingAnExtensionWithDependents(extension, dependents) {
            if (dependents.length === 1) {
                return nls.localize('singleDependentError', "Cannot disable '{0}' extension alone. '{1}' extension depends on this. Do you want to disable all these extensions?", extension.displayName, dependents[0].displayName);
            }
            if (dependents.length === 2) {
                return nls.localize('twoDependentsError', "Cannot disable '{0}' extension alone. '{1}' and '{2}' extensions depend on this. Do you want to disable all these extensions?", extension.displayName, dependents[0].displayName, dependents[1].displayName);
            }
            return nls.localize('multipleDependentsError', "Cannot disable '{0}' extension alone. '{1}', '{2}' and other extensions depend on this. Do you want to disable all these extensions?", extension.displayName, dependents[0].displayName, dependents[1].displayName);
        }
        async doSetEnablement(extensions, enablementState) {
            const changed = await this.extensionEnablementService.setEnablement(extensions.map(e => e.local), enablementState);
            for (let i = 0; i < changed.length; i++) {
                if (changed[i]) {
                    /* __GDPR__
                    "extension:enable" : {
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                    */
                    /* __GDPR__
                    "extension:disable" : {
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                    */
                    this.telemetryService.publicLog(enablementState === 8 /* EnablementState.EnabledGlobally */ || enablementState === 9 /* EnablementState.EnabledWorkspace */ ? 'extension:enable' : 'extension:disable', extensions[i].telemetryData);
                }
            }
            return changed;
        }
        updateContexts(extension) {
            if (extension && extension.outdated) {
                this.hasOutdatedExtensionsContextKey.set(true);
            }
            else {
                this.hasOutdatedExtensionsContextKey.set(this.outdated.length > 0);
            }
        }
        updateActivity() {
            if ((this.localExtensions && this.localExtensions.local.some(e => e.state === 0 /* ExtensionState.Installing */ || e.state === 2 /* ExtensionState.Uninstalling */))
                || (this.remoteExtensions && this.remoteExtensions.local.some(e => e.state === 0 /* ExtensionState.Installing */ || e.state === 2 /* ExtensionState.Uninstalling */))
                || (this.webExtensions && this.webExtensions.local.some(e => e.state === 0 /* ExtensionState.Installing */ || e.state === 2 /* ExtensionState.Uninstalling */))) {
                if (!this._activityCallBack) {
                    this.progressService.withProgress({ location: 5 /* ProgressLocation.Extensions */ }, () => new Promise(resolve => this._activityCallBack = resolve));
                }
            }
            else {
                if (this._activityCallBack) {
                    this._activityCallBack();
                }
                this._activityCallBack = null;
            }
        }
        onError(err) {
            if ((0, errors_1.isCancellationError)(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/getaddrinfo ENOTFOUND|getaddrinfo ENOENT|connect EACCES|connect ECONNREFUSED/.test(message)) {
                return;
            }
            this.notificationService.error(err);
        }
        handleURL(uri, options) {
            if (!/^extension/.test(uri.path)) {
                return Promise.resolve(false);
            }
            this.onOpenExtensionUrl(uri);
            return Promise.resolve(true);
        }
        onOpenExtensionUrl(uri) {
            const match = /^extension\/([^/]+)$/.exec(uri.path);
            if (!match) {
                return;
            }
            const extensionId = match[1];
            this.queryLocal().then(async (local) => {
                let extension = local.find(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id: extensionId }));
                if (!extension) {
                    [extension] = await this.getExtensions([{ id: extensionId }], { source: 'uri' }, cancellation_1.CancellationToken.None);
                }
                if (extension) {
                    await this.hostService.focus();
                    await this.open(extension);
                }
            }).then(undefined, error => this.onError(error));
        }
        get ignoredAutoUpdateExtensions() {
            if (!this._ignoredAutoUpdateExtensions) {
                this._ignoredAutoUpdateExtensions = JSON.parse(this.storageService.get('extensions.ignoredAutoUpdateExtension', 0 /* StorageScope.GLOBAL */, '[]') || '[]');
            }
            return this._ignoredAutoUpdateExtensions;
        }
        set ignoredAutoUpdateExtensions(extensionIds) {
            this._ignoredAutoUpdateExtensions = (0, arrays_1.distinct)(extensionIds.map(id => id.toLowerCase()));
            this.storageService.store('extensions.ignoredAutoUpdateExtension', JSON.stringify(this._ignoredAutoUpdateExtensions), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        ignoreAutoUpdate(extensionKey) {
            if (!this.isAutoUpdateIgnored(extensionKey)) {
                this.ignoredAutoUpdateExtensions = [...this.ignoredAutoUpdateExtensions, extensionKey.toString()];
            }
        }
        isAutoUpdateIgnored(extensionKey) {
            return this.ignoredAutoUpdateExtensions.indexOf(extensionKey.toString()) !== -1;
        }
        resetIgnoreAutoUpdateExtensions() {
            this.ignoredAutoUpdateExtensions = this.ignoredAutoUpdateExtensions.filter(extensionId => this.local.some(local => !!local.local && new extensionManagementUtil_1.ExtensionKey(local.identifier, local.version).toString() === extensionId));
        }
    };
    ExtensionsWorkbenchService.UpdatesCheckInterval = 1000 * 60 * 60 * 12; // 12 hours
    ExtensionsWorkbenchService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorService_1.IEditorService),
        __param(2, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, notification_1.INotificationService),
        __param(7, url_1.IURLService),
        __param(8, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(9, host_1.IHostService),
        __param(10, progress_1.IProgressService),
        __param(11, extensionManagement_2.IExtensionManagementServerService),
        __param(12, storage_1.IStorageService),
        __param(13, language_1.ILanguageService),
        __param(14, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(15, userDataSync_1.IUserDataAutoSyncService),
        __param(16, productService_1.IProductService),
        __param(17, contextkey_1.IContextKeyService),
        __param(18, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(19, log_1.ILogService),
        __param(20, extensions_2.IExtensionService)
    ], ExtensionsWorkbenchService);
    exports.ExtensionsWorkbenchService = ExtensionsWorkbenchService;
});
//# sourceMappingURL=extensionsWorkbenchService.js.map