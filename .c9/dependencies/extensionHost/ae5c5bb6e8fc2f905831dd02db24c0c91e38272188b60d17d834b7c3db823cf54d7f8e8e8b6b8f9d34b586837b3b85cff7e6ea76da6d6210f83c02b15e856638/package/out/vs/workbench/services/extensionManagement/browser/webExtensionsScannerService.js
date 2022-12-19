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
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionNls", "vs/nls", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/errors", "vs/base/common/map", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/editor/common/editorService", "vs/base/common/path", "vs/platform/extensionManagement/common/extensionStorage", "vs/base/common/arrays", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/extensions/common/extensionValidator", "vs/base/common/severity"], function (require, exports, extensions_1, environmentService_1, extensionManagement_1, platform_1, extensions_2, resources_1, uri_1, files_1, async_1, buffer_1, log_1, cancellation_1, extensionManagement_2, extensionManagementUtil_1, lifecycle_1, extensionNls_1, nls_1, semver, types_1, errors_1, map_1, extensionManifestPropertiesService_1, extensionResourceLoader_1, actions_1, actions_2, contextkeys_1, editorService_1, path_1, extensionStorage_1, arrays_1, lifecycle_2, storage_1, productService_1, extensionValidator_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebExtensionsScannerService = void 0;
    function isGalleryExtensionInfo(obj) {
        const galleryExtensionInfo = obj;
        return typeof (galleryExtensionInfo === null || galleryExtensionInfo === void 0 ? void 0 : galleryExtensionInfo.id) === 'string'
            && (galleryExtensionInfo.preRelease === undefined || typeof galleryExtensionInfo.preRelease === 'boolean')
            && (galleryExtensionInfo.migrateStorageFrom === undefined || typeof galleryExtensionInfo.migrateStorageFrom === 'string');
    }
    let WebExtensionsScannerService = class WebExtensionsScannerService extends lifecycle_1.Disposable {
        constructor(environmentService, builtinExtensionsScannerService, fileService, logService, galleryService, extensionManifestPropertiesService, extensionResourceLoaderService, extensionStorageService, storageService, productService, lifecycleService) {
            super();
            this.environmentService = environmentService;
            this.builtinExtensionsScannerService = builtinExtensionsScannerService;
            this.fileService = fileService;
            this.logService = logService;
            this.galleryService = galleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.extensionStorageService = extensionStorageService;
            this.storageService = storageService;
            this.productService = productService;
            this.systemExtensionsCacheResource = undefined;
            this.customBuiltinExtensionsCacheResource = undefined;
            this.installedExtensionsResource = undefined;
            this.resourcesAccessQueueMap = new map_1.ResourceMap();
            if (platform_1.isWeb) {
                this.installedExtensionsResource = (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'extensions.json');
                this.systemExtensionsCacheResource = (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'systemExtensionsCache.json');
                this.customBuiltinExtensionsCacheResource = (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'customBuiltinExtensionsCache.json');
                this.registerActions();
                // Eventually update caches
                lifecycleService.when(4 /* LifecyclePhase.Eventually */).then(() => this.updateCaches());
            }
        }
        readCustomBuiltinExtensionsInfoFromEnv() {
            if (!this._customBuiltinExtensionsInfoPromise) {
                this._customBuiltinExtensionsInfoPromise = (async () => {
                    let extensions = [], extensionLocations = [];
                    const extensionsToMigrate = [];
                    const customBuiltinExtensionsInfo = this.environmentService.options && Array.isArray(this.environmentService.options.additionalBuiltinExtensions)
                        ? this.environmentService.options.additionalBuiltinExtensions.map(additionalBuiltinExtension => (0, types_1.isString)(additionalBuiltinExtension) ? { id: additionalBuiltinExtension } : additionalBuiltinExtension)
                        : [];
                    for (const e of customBuiltinExtensionsInfo) {
                        if (isGalleryExtensionInfo(e)) {
                            extensions.push({ id: e.id, preRelease: !!e.preRelease });
                            if (e.migrateStorageFrom) {
                                extensionsToMigrate.push([e.migrateStorageFrom, e.id]);
                            }
                        }
                        else {
                            extensionLocations.push(uri_1.URI.revive(e));
                        }
                    }
                    if (extensions.length) {
                        extensions = await this.checkAdditionalBuiltinExtensions(extensions);
                    }
                    return { extensions, extensionsToMigrate, extensionLocations };
                })();
            }
            return this._customBuiltinExtensionsInfoPromise;
        }
        async checkAdditionalBuiltinExtensions(extensions) {
            const extensionsControlManifest = await this.galleryService.getExtensionsControlManifest();
            const result = [];
            for (const extension of extensions) {
                if (extensionsControlManifest.malicious.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, { id: extension.id }))) {
                    this.logService.info(`Checking additional builtin extensions: Ignoring '${extension.id}' because it is reported to be malicious.`);
                    continue;
                }
                if (extensionsControlManifest.unsupportedPreReleaseExtensions && extensionsControlManifest.unsupportedPreReleaseExtensions[extension.id.toLowerCase()]) {
                    const preReleaseExtensionId = extensionsControlManifest.unsupportedPreReleaseExtensions[extension.id.toLowerCase()].id;
                    this.logService.info(`Checking additional builtin extensions: '${extension.id}' is no longer supported, instead using '${preReleaseExtensionId}'`);
                    result.push({ id: preReleaseExtensionId, preRelease: true });
                }
                else {
                    result.push(extension);
                }
            }
            return result;
        }
        /**
         * All system extensions bundled with the product
         */
        async readSystemExtensions() {
            const systemExtensions = await this.builtinExtensionsScannerService.scanBuiltinExtensions();
            const cachedSystemExtensions = await Promise.all((await this.readSystemExtensionsCache()).map(e => this.toScannedExtension(e, true, 0 /* ExtensionType.System */)));
            const result = new Map();
            for (const extension of [...systemExtensions, ...cachedSystemExtensions]) {
                const existing = result.get(extension.identifier.id.toLowerCase());
                if (existing) {
                    // Incase there are duplicates always take the latest version
                    if (semver.gt(existing.manifest.version, extension.manifest.version)) {
                        continue;
                    }
                }
                result.set(extension.identifier.id.toLowerCase(), extension);
            }
            return [...result.values()];
        }
        /**
         * All extensions defined via `additionalBuiltinExtensions` API
         */
        async readCustomBuiltinExtensions(scanOptions) {
            const [customBuiltinExtensionsFromLocations, customBuiltinExtensionsFromGallery] = await Promise.all([
                this.getCustomBuiltinExtensionsFromLocations(scanOptions),
                this.getCustomBuiltinExtensionsFromGallery(scanOptions),
            ]);
            const customBuiltinExtensions = [...customBuiltinExtensionsFromLocations, ...customBuiltinExtensionsFromGallery];
            await this.migrateExtensionsStorage(customBuiltinExtensions);
            return customBuiltinExtensions;
        }
        async getCustomBuiltinExtensionsFromLocations(scanOptions) {
            const { extensionLocations } = await this.readCustomBuiltinExtensionsInfoFromEnv();
            if (!extensionLocations.length) {
                return [];
            }
            const result = [];
            await Promise.allSettled(extensionLocations.map(async (location) => {
                try {
                    const webExtension = await this.toWebExtension(location);
                    const extension = await this.toScannedExtension(webExtension, true);
                    if (extension.isValid || !(scanOptions === null || scanOptions === void 0 ? void 0 : scanOptions.skipInvalidExtensions)) {
                        result.push(extension);
                    }
                }
                catch (error) {
                    this.logService.info(`Error while fetching the additional builtin extension ${location.toString()}.`, (0, errors_1.getErrorMessage)(error));
                }
            }));
            return result;
        }
        async getCustomBuiltinExtensionsFromGallery(scanOptions) {
            const { extensions } = await this.readCustomBuiltinExtensionsInfoFromEnv();
            if (!extensions.length) {
                return [];
            }
            if (!this.galleryService.isEnabled()) {
                this.logService.info('Ignoring fetching additional builtin extensions from gallery as it is disabled.');
                return [];
            }
            const result = [];
            try {
                const useCache = this.storageService.get('additionalBuiltinExtensions', 0 /* StorageScope.GLOBAL */, '[]') === JSON.stringify(extensions);
                const webExtensions = await (useCache ? this.getCustomBuiltinExtensionsFromCache() : this.updateCustomBuiltinExtensionsCache());
                if (webExtensions.length) {
                    await Promise.all(webExtensions.map(async (webExtension) => {
                        try {
                            const extension = await this.toScannedExtension(webExtension, true);
                            if (extension.isValid || !(scanOptions === null || scanOptions === void 0 ? void 0 : scanOptions.skipInvalidExtensions)) {
                                result.push(extension);
                            }
                        }
                        catch (error) {
                            this.logService.info(`Ignoring additional builtin extension ${webExtension.identifier.id} because there is an error while converting it into scanned extension`, (0, errors_1.getErrorMessage)(error));
                        }
                    }));
                }
                this.storageService.store('additionalBuiltinExtensions', JSON.stringify(extensions), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            catch (error) {
                this.logService.info('Ignoring following additional builtin extensions as there is an error while fetching them from gallery', extensions.map(({ id }) => id), (0, errors_1.getErrorMessage)(error));
            }
            return result;
        }
        async getCustomBuiltinExtensionsFromCache() {
            var _a, _b;
            const cachedCustomBuiltinExtensions = await this.readCustomBuiltinExtensionsCache();
            const webExtensionsMap = new Map();
            for (const webExtension of cachedCustomBuiltinExtensions) {
                const existing = webExtensionsMap.get(webExtension.identifier.id.toLowerCase());
                if (existing) {
                    // Incase there are duplicates always take the latest version
                    if (semver.gt(existing.version, webExtension.version)) {
                        continue;
                    }
                }
                /* Update preRelease flag in the cache - https://github.com/microsoft/vscode/issues/142831 */
                if (((_a = webExtension.metadata) === null || _a === void 0 ? void 0 : _a.isPreReleaseVersion) && !((_b = webExtension.metadata) === null || _b === void 0 ? void 0 : _b.preRelease)) {
                    webExtension.metadata.preRelease = true;
                }
                webExtensionsMap.set(webExtension.identifier.id.toLowerCase(), webExtension);
            }
            return [...webExtensionsMap.values()];
        }
        async migrateExtensionsStorage(customBuiltinExtensions) {
            if (!this._migrateExtensionsStoragePromise) {
                this._migrateExtensionsStoragePromise = (async () => {
                    const { extensionsToMigrate } = await this.readCustomBuiltinExtensionsInfoFromEnv();
                    if (!extensionsToMigrate.length) {
                        return;
                    }
                    const fromExtensions = await this.galleryService.getExtensions(extensionsToMigrate.map(([id]) => ({ id })), cancellation_1.CancellationToken.None);
                    try {
                        await Promise.allSettled(extensionsToMigrate.map(async ([from, to]) => {
                            const toExtension = customBuiltinExtensions.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, { id: to }));
                            if (toExtension) {
                                const fromExtension = fromExtensions.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, { id: from }));
                                const fromExtensionManifest = fromExtension ? await this.galleryService.getManifest(fromExtension, cancellation_1.CancellationToken.None) : null;
                                const fromExtensionId = fromExtensionManifest ? (0, extensionManagementUtil_1.getExtensionId)(fromExtensionManifest.publisher, fromExtensionManifest.name) : from;
                                const toExtensionId = (0, extensionManagementUtil_1.getExtensionId)(toExtension.manifest.publisher, toExtension.manifest.name);
                                this.extensionStorageService.addToMigrationList(fromExtensionId, toExtensionId);
                            }
                            else {
                                this.logService.info(`Skipped migrating extension storage from '${from}' to '${to}', because the '${to}' extension is not found.`);
                            }
                        }));
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                })();
            }
            return this._migrateExtensionsStoragePromise;
        }
        async updateCaches() {
            await this.updateSystemExtensionsCache();
            await this.updateCustomBuiltinExtensionsCache();
        }
        async updateSystemExtensionsCache() {
            const systemExtensions = await this.builtinExtensionsScannerService.scanBuiltinExtensions();
            const cachedSystemExtensions = (await this.readSystemExtensionsCache())
                .filter(cached => {
                const systemExtension = systemExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, cached.identifier));
                return systemExtension && semver.gt(cached.version, systemExtension.manifest.version);
            });
            await this.writeSystemExtensionsCache(() => cachedSystemExtensions);
        }
        async updateCustomBuiltinExtensionsCache() {
            if (!this._updateCustomBuiltinExtensionsCachePromise) {
                this._updateCustomBuiltinExtensionsCachePromise = (async () => {
                    // Clear Cache
                    await this.writeCustomBuiltinExtensionsCache(() => []);
                    const { extensions } = await this.readCustomBuiltinExtensionsInfoFromEnv();
                    if (!extensions.length) {
                        return [];
                    }
                    const galleryExtensionsMap = await this.getExtensionsWithDependenciesAndPackedExtensions(extensions);
                    const missingExtensions = extensions.filter(({ id }) => !galleryExtensionsMap.has(id.toLowerCase()));
                    if (missingExtensions.length) {
                        this.logService.info('Skipping the additional builtin extensions because their compatible versions are not foud.', missingExtensions);
                    }
                    const webExtensions = [];
                    await Promise.all([...galleryExtensionsMap.values()].map(async (gallery) => {
                        try {
                            webExtensions.push(await this.toWebExtensionFromGallery(gallery, { isPreReleaseVersion: gallery.properties.isPreReleaseVersion, preRelease: gallery.properties.isPreReleaseVersion, isBuiltin: true }));
                        }
                        catch (error) {
                            this.logService.info(`Ignoring additional builtin extension ${gallery.identifier.id} because there is an error while converting it into web extension`, (0, errors_1.getErrorMessage)(error));
                        }
                    }));
                    await this.writeCustomBuiltinExtensionsCache(() => webExtensions);
                    return webExtensions;
                })();
            }
            return this._updateCustomBuiltinExtensionsCachePromise;
        }
        async getExtensionsWithDependenciesAndPackedExtensions(toGet, result = new Map()) {
            if (toGet.length === 0) {
                return result;
            }
            const extensions = await this.galleryService.getExtensions(toGet, { compatible: true, targetPlatform: "web" /* TargetPlatform.WEB */ }, cancellation_1.CancellationToken.None);
            const packsAndDependencies = new Map();
            for (const extension of extensions) {
                result.set(extension.identifier.id.toLowerCase(), extension);
                for (const id of [...((0, arrays_1.isNonEmptyArray)(extension.properties.dependencies) ? extension.properties.dependencies : []), ...((0, arrays_1.isNonEmptyArray)(extension.properties.extensionPack) ? extension.properties.extensionPack : [])]) {
                    if (!result.has(id.toLowerCase()) && !packsAndDependencies.has(id.toLowerCase())) {
                        const extensionInfo = toGet.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e, extension.identifier));
                        packsAndDependencies.set(id.toLowerCase(), { id, preRelease: extensionInfo === null || extensionInfo === void 0 ? void 0 : extensionInfo.preRelease });
                    }
                }
            }
            return this.getExtensionsWithDependenciesAndPackedExtensions([...packsAndDependencies.values()].filter(({ id }) => !result.has(id.toLowerCase())), result);
        }
        async scanSystemExtensions() {
            return this.readSystemExtensions();
        }
        async scanUserExtensions(scanOptions) {
            const extensions = new Map();
            // Custom builtin extensions defined through `additionalBuiltinExtensions` API
            const customBuiltinExtensions = await this.readCustomBuiltinExtensions(scanOptions);
            for (const extension of customBuiltinExtensions) {
                extensions.set(extension.identifier.id.toLowerCase(), extension);
            }
            // User Installed extensions
            const installedExtensions = await this.scanInstalledExtensions(scanOptions);
            for (const extension of installedExtensions) {
                extensions.set(extension.identifier.id.toLowerCase(), extension);
            }
            return [...extensions.values()];
        }
        async scanExtensionsUnderDevelopment() {
            var _a, _b;
            const devExtensions = (_b = (_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.developmentOptions) === null || _b === void 0 ? void 0 : _b.extensions;
            const result = [];
            if (Array.isArray(devExtensions)) {
                await Promise.allSettled(devExtensions.map(async (devExtension) => {
                    try {
                        const location = uri_1.URI.revive(devExtension);
                        if (uri_1.URI.isUri(location)) {
                            const webExtension = await this.toWebExtension(location);
                            result.push(await this.toScannedExtension(webExtension, false));
                        }
                        else {
                            this.logService.info(`Skipping the extension under development ${devExtension} as it is not URI type.`);
                        }
                    }
                    catch (error) {
                        this.logService.info(`Error while fetching the extension under development ${devExtension.toString()}.`, (0, errors_1.getErrorMessage)(error));
                    }
                }));
            }
            return result;
        }
        async scanExistingExtension(extensionLocation, extensionType) {
            if (extensionType === 0 /* ExtensionType.System */) {
                const systemExtensions = await this.scanSystemExtensions();
                return systemExtensions.find(e => e.location.toString() === extensionLocation.toString()) || null;
            }
            const userExtensions = await this.scanUserExtensions();
            return userExtensions.find(e => e.location.toString() === extensionLocation.toString()) || null;
        }
        async scanExtensionManifest(extensionLocation) {
            const packageJSONUri = (0, resources_1.joinPath)(extensionLocation, 'package.json');
            try {
                const content = await this.extensionResourceLoaderService.readExtensionResource(packageJSONUri);
                if (content) {
                    return JSON.parse(content);
                }
            }
            catch (error) {
                this.logService.warn(`Error while fetching package.json from ${packageJSONUri.toString()}`, (0, errors_1.getErrorMessage)(error));
            }
            return null;
        }
        async addExtensionFromGallery(galleryExtension, metadata) {
            const webExtension = await this.toWebExtensionFromGallery(galleryExtension, metadata);
            return this.addWebExtension(webExtension);
        }
        async addExtension(location, metadata) {
            const webExtension = await this.toWebExtension(location, undefined, undefined, undefined, undefined, metadata);
            return this.addWebExtension(webExtension);
        }
        async removeExtension(identifier, version) {
            await this.writeInstalledExtensions(installedExtensions => installedExtensions.filter(extension => !((0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, identifier) && (version ? extension.version === version : true))));
        }
        async addWebExtension(webExtension) {
            var _a;
            const isSystem = !!(await this.scanSystemExtensions()).find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, webExtension.identifier));
            const isBuiltin = !!((_a = webExtension.metadata) === null || _a === void 0 ? void 0 : _a.isBuiltin);
            const extension = await this.toScannedExtension(webExtension, isBuiltin);
            if (isSystem) {
                await this.writeSystemExtensionsCache(systemExtensions => {
                    // Remove the existing extension to avoid duplicates
                    systemExtensions = systemExtensions.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, webExtension.identifier));
                    systemExtensions.push(webExtension);
                    return systemExtensions;
                });
                return extension;
            }
            // Update custom builtin extensions to custom builtin extensions cache
            if (isBuiltin) {
                await this.writeCustomBuiltinExtensionsCache(customBuiltinExtensions => {
                    // Remove the existing extension to avoid duplicates
                    customBuiltinExtensions = customBuiltinExtensions.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, webExtension.identifier));
                    customBuiltinExtensions.push(webExtension);
                    return customBuiltinExtensions;
                });
                const installedExtensions = await this.readInstalledExtensions();
                // Also add to installed extensions if it is installed to update its version
                if (installedExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, webExtension.identifier))) {
                    await this.addToInstalledExtensions(webExtension);
                }
                return extension;
            }
            // Add to installed extensions
            await this.addToInstalledExtensions(webExtension);
            return extension;
        }
        async addToInstalledExtensions(webExtension) {
            await this.writeInstalledExtensions(installedExtensions => {
                // Remove the existing extension to avoid duplicates
                installedExtensions = installedExtensions.filter(e => !(0, extensionManagementUtil_1.areSameExtensions)(e.identifier, webExtension.identifier));
                installedExtensions.push(webExtension);
                return installedExtensions;
            });
        }
        async scanInstalledExtensions(scanOptions) {
            let installedExtensions = await this.readInstalledExtensions();
            installedExtensions.sort((a, b) => a.identifier.id < b.identifier.id ? -1 : a.identifier.id > b.identifier.id ? 1 : semver.rcompare(a.version, b.version));
            const result = new Map();
            for (const webExtension of installedExtensions) {
                const existing = result.get(webExtension.identifier.id.toLowerCase());
                if (existing && semver.gt(existing.manifest.version, webExtension.version)) {
                    continue;
                }
                try {
                    const extension = await this.toScannedExtension(webExtension, false);
                    if (extension.isValid || !(scanOptions === null || scanOptions === void 0 ? void 0 : scanOptions.skipInvalidExtensions)) {
                        result.set(extension.identifier.id.toLowerCase(), extension);
                    }
                }
                catch (error) {
                    if (scanOptions === null || scanOptions === void 0 ? void 0 : scanOptions.bailOut) {
                        throw error;
                    }
                    else {
                        this.logService.error(error, 'Error while scanning user extension', webExtension.identifier.id);
                    }
                }
            }
            return [...result.values()];
        }
        async toWebExtensionFromGallery(galleryExtension, metadata) {
            let extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL(galleryExtension, 'extension');
            if (!extensionLocation) {
                throw new Error('No extension gallery service configured.');
            }
            extensionLocation = galleryExtension.properties.targetPlatform === "web" /* TargetPlatform.WEB */ ? extensionLocation.with({ query: `${extensionLocation.query ? `${extensionLocation.query}&` : ''}target=${galleryExtension.properties.targetPlatform}` }) : extensionLocation;
            const extensionResources = await this.listExtensionResources(extensionLocation);
            const packageNLSResource = extensionResources.find(e => (0, path_1.basename)(e) === 'package.nls.json');
            return this.toWebExtension(extensionLocation, galleryExtension.identifier, packageNLSResource ? uri_1.URI.parse(packageNLSResource) : null, galleryExtension.assets.readme ? uri_1.URI.parse(galleryExtension.assets.readme.uri) : undefined, galleryExtension.assets.changelog ? uri_1.URI.parse(galleryExtension.assets.changelog.uri) : undefined, metadata);
        }
        async toWebExtension(extensionLocation, identifier, packageNLSUri, readmeUri, changelogUri, metadata) {
            let packageJSONContent;
            try {
                packageJSONContent = await this.extensionResourceLoaderService.readExtensionResource((0, resources_1.joinPath)(extensionLocation, 'package.json'));
            }
            catch (error) {
                throw new Error(`Cannot find the package.json from the location '${extensionLocation.toString()}'. ${(0, errors_1.getErrorMessage)(error)}`);
            }
            if (!packageJSONContent) {
                throw new Error(`Error while fetching package.json for extension '${extensionLocation.toString()}'. Server returned no content`);
            }
            const manifest = JSON.parse(packageJSONContent);
            if (!this.extensionManifestPropertiesService.canExecuteOnWeb(manifest)) {
                throw new Error((0, nls_1.localize)('not a web extension', "Cannot add '{0}' because this extension is not a web extension.", manifest.displayName || manifest.name));
            }
            if (packageNLSUri === undefined) {
                try {
                    packageNLSUri = (0, resources_1.joinPath)(extensionLocation, 'package.nls.json');
                    await this.extensionResourceLoaderService.readExtensionResource(packageNLSUri);
                }
                catch (error) {
                    packageNLSUri = undefined;
                }
            }
            return {
                identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name), uuid: identifier === null || identifier === void 0 ? void 0 : identifier.uuid },
                version: manifest.version,
                location: extensionLocation,
                readmeUri,
                changelogUri,
                packageNLSUri: packageNLSUri ? packageNLSUri : undefined,
                metadata,
            };
        }
        async toScannedExtension(webExtension, isBuiltin, type = 1 /* ExtensionType.User */) {
            var _a;
            const url = (0, resources_1.joinPath)(webExtension.location, 'package.json');
            let content;
            try {
                content = await this.extensionResourceLoaderService.readExtensionResource(url);
            }
            catch (error) {
                throw new Error(`Error while fetching package.json for extension '${webExtension.identifier.id}' from the location '${url}'. ${(0, errors_1.getErrorMessage)(error)}`);
            }
            if (!content) {
                throw new Error(`Error while fetching package.json for extension '${webExtension.identifier.id}'. Server returned no content for the request '${url}'`);
            }
            let manifest = JSON.parse(content);
            if (webExtension.packageNLSUri) {
                manifest = await this.translateManifest(manifest, webExtension.packageNLSUri);
            }
            const uuid = (_a = webExtension.metadata) === null || _a === void 0 ? void 0 : _a.id;
            const validations = (0, extensionValidator_1.validateExtensionManifest)(this.productService.version, this.productService.date, webExtension.location, manifest, false);
            let isValid = true;
            for (const [severity, message] of validations) {
                if (severity === severity_1.default.Error) {
                    isValid = false;
                    this.logService.error(message);
                }
            }
            return {
                identifier: { id: webExtension.identifier.id, uuid: webExtension.identifier.uuid || uuid },
                location: webExtension.location,
                manifest,
                type,
                isBuiltin,
                readmeUrl: webExtension.readmeUri,
                changelogUrl: webExtension.changelogUri,
                metadata: webExtension.metadata,
                targetPlatform: "web" /* TargetPlatform.WEB */,
                validations,
                isValid
            };
        }
        async listExtensionResources(extensionLocation) {
            try {
                const result = await this.extensionResourceLoaderService.readExtensionResource(extensionLocation);
                return JSON.parse(result);
            }
            catch (error) {
                this.logService.warn('Error while fetching extension resources list', (0, errors_1.getErrorMessage)(error));
            }
            return [];
        }
        async translateManifest(manifest, nlsURL) {
            try {
                const content = await this.extensionResourceLoaderService.readExtensionResource(nlsURL);
                if (content) {
                    manifest = (0, extensionNls_1.localizeManifest)(manifest, JSON.parse(content));
                }
            }
            catch (error) { /* ignore */ }
            return manifest;
        }
        readInstalledExtensions() {
            return this.withWebExtensions(this.installedExtensionsResource);
        }
        writeInstalledExtensions(updateFn) {
            return this.withWebExtensions(this.installedExtensionsResource, updateFn);
        }
        readCustomBuiltinExtensionsCache() {
            return this.withWebExtensions(this.customBuiltinExtensionsCacheResource);
        }
        writeCustomBuiltinExtensionsCache(updateFn) {
            return this.withWebExtensions(this.customBuiltinExtensionsCacheResource, updateFn);
        }
        readSystemExtensionsCache() {
            return this.withWebExtensions(this.systemExtensionsCacheResource);
        }
        writeSystemExtensionsCache(updateFn) {
            return this.withWebExtensions(this.systemExtensionsCacheResource, updateFn);
        }
        async withWebExtensions(file, updateFn) {
            if (!file) {
                return [];
            }
            return this.getResourceAccessQueue(file).queue(async () => {
                let webExtensions = [];
                // Read
                try {
                    const content = await this.fileService.readFile(file);
                    const storedWebExtensions = JSON.parse(content.value.toString());
                    for (const e of storedWebExtensions) {
                        if (!e.location || !e.identifier || !e.version) {
                            this.logService.info('Ignoring invalid extension while scanning', storedWebExtensions);
                            continue;
                        }
                        webExtensions.push({
                            identifier: e.identifier,
                            version: e.version,
                            location: uri_1.URI.revive(e.location),
                            readmeUri: uri_1.URI.revive(e.readmeUri),
                            changelogUri: uri_1.URI.revive(e.changelogUri),
                            packageNLSUri: uri_1.URI.revive(e.packageNLSUri),
                            metadata: e.metadata,
                        });
                    }
                }
                catch (error) {
                    /* Ignore */
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        this.logService.error(error);
                    }
                }
                // Update
                if (updateFn) {
                    webExtensions = updateFn(webExtensions);
                    const storedWebExtensions = webExtensions.map(e => {
                        var _a, _b, _c;
                        return ({
                            identifier: e.identifier,
                            version: e.version,
                            location: e.location.toJSON(),
                            readmeUri: (_a = e.readmeUri) === null || _a === void 0 ? void 0 : _a.toJSON(),
                            changelogUri: (_b = e.changelogUri) === null || _b === void 0 ? void 0 : _b.toJSON(),
                            packageNLSUri: (_c = e.packageNLSUri) === null || _c === void 0 ? void 0 : _c.toJSON(),
                            metadata: e.metadata
                        });
                    });
                    await this.fileService.writeFile(file, buffer_1.VSBuffer.fromString(JSON.stringify(storedWebExtensions)));
                }
                return webExtensions;
            });
        }
        getResourceAccessQueue(file) {
            let resourceQueue = this.resourcesAccessQueueMap.get(file);
            if (!resourceQueue) {
                resourceQueue = new async_1.Queue();
                this.resourcesAccessQueueMap.set(file, resourceQueue);
            }
            return resourceQueue;
        }
        registerActions() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.extensions.action.openInstalledWebExtensionsResource',
                        title: { value: (0, nls_1.localize)('openInstalledWebExtensionsResource', "Open Installed Web Extensions Resource"), original: 'Open Installed Web Extensions Resource' },
                        category: actions_2.CATEGORIES.Developer,
                        f1: true,
                        precondition: contextkeys_1.IsWebContext
                    });
                }
                run(serviceAccessor) {
                    serviceAccessor.get(editorService_1.IEditorService).openEditor({ resource: that.installedExtensionsResource });
                }
            }));
        }
    };
    WebExtensionsScannerService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, extensions_1.IBuiltinExtensionsScannerService),
        __param(2, files_1.IFileService),
        __param(3, log_1.ILogService),
        __param(4, extensionManagement_2.IExtensionGalleryService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, extensionStorage_1.IExtensionStorageService),
        __param(8, storage_1.IStorageService),
        __param(9, productService_1.IProductService),
        __param(10, lifecycle_2.ILifecycleService)
    ], WebExtensionsScannerService);
    exports.WebExtensionsScannerService = WebExtensionsScannerService;
    (0, extensions_2.registerSingleton)(extensionManagement_1.IWebExtensionsScannerService, WebExtensionsScannerService);
});
//# sourceMappingURL=webExtensionsScannerService.js.map