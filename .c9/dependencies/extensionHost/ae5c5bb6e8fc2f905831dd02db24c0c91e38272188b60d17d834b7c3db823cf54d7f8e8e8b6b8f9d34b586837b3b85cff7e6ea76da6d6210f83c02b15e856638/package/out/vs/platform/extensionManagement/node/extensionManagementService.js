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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/node/zip", "vs/nls", "vs/platform/download/common/download", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/abstractExtensionManagementService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionDownloader", "vs/platform/extensionManagement/node/extensionLifecycle", "vs/platform/extensionManagement/node/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionsManifestCache", "vs/platform/extensionManagement/node/extensionsWatcher", "vs/platform/extensions/common/extensionValidator", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, async_1, errorMessage_1, errors_1, lifecycle_1, network_1, path, platform_1, resources_1, semver, types_1, uri_1, uuid_1, pfs, zip_1, nls, download_1, environment_1, abstractExtensionManagementService_1, extensionManagement_1, extensionManagementUtil_1, extensionsScannerService_1, extensionDownloader_1, extensionLifecycle_1, extensionManagementUtil_2, extensionsManifestCache_1, extensionsWatcher_1, extensionValidator_1, files_1, instantiation_1, log_1, productService_1, telemetry_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementService = void 0;
    let ExtensionManagementService = class ExtensionManagementService extends abstractExtensionManagementService_1.AbstractExtensionManagementService {
        constructor(galleryService, telemetryService, logService, environmentService, downloadService, instantiationService, fileService, productService, uriIdentityService) {
            super(galleryService, telemetryService, logService, productService);
            this.environmentService = environmentService;
            this.downloadService = downloadService;
            this.fileService = fileService;
            const extensionLifecycle = this._register(instantiationService.createInstance(extensionLifecycle_1.ExtensionsLifecycle));
            this.extensionsScanner = this._register(instantiationService.createInstance(ExtensionsScanner, extension => extensionLifecycle.postUninstall(extension)));
            this.manifestCache = this._register(new extensionsManifestCache_1.ExtensionsManifestCache(environmentService, this));
            this.extensionsDownloader = this._register(instantiationService.createInstance(extensionDownloader_1.ExtensionsDownloader));
            const extensionsWatcher = this._register(new extensionsWatcher_1.ExtensionsWatcher(this, fileService, environmentService, logService, uriIdentityService));
            this._register(extensionsWatcher.onDidChangeExtensionsByAnotherSource(({ added, removed }) => {
                if (added.length) {
                    this._onDidInstallExtensions.fire(added.map(local => ({ identifier: local.identifier, operation: 1 /* InstallOperation.None */, local })));
                }
                removed.forEach(extension => this._onDidUninstallExtension.fire({ identifier: extension }));
            }));
        }
        getTargetPlatform() {
            if (!this._targetPlatformPromise) {
                this._targetPlatformPromise = (0, extensionManagementUtil_1.computeTargetPlatform)(this.fileService, this.logService);
            }
            return this._targetPlatformPromise;
        }
        async zip(extension) {
            this.logService.trace('ExtensionManagementService#zip', extension.identifier.id);
            const files = await this.collectFiles(extension);
            const location = await (0, zip_1.zip)((0, resources_1.joinPath)(this.environmentService.tmpDir, (0, uuid_1.generateUuid)()).fsPath, files);
            return uri_1.URI.file(location);
        }
        async unzip(zipLocation) {
            this.logService.trace('ExtensionManagementService#unzip', zipLocation.toString());
            const local = await this.install(zipLocation);
            return local.identifier;
        }
        async getManifest(vsix) {
            const downloadLocation = await this.downloadVsix(vsix);
            const zipPath = path.resolve(downloadLocation.fsPath);
            return (0, extensionManagementUtil_2.getManifest)(zipPath);
        }
        getInstalled(type = null) {
            return this.extensionsScanner.scanExtensions(type);
        }
        async install(vsix, options = {}) {
            this.logService.trace('ExtensionManagementService#install', vsix.toString());
            const downloadLocation = await this.downloadVsix(vsix);
            const manifest = await (0, extensionManagementUtil_2.getManifest)(path.resolve(downloadLocation.fsPath));
            if (manifest.engines && manifest.engines.vscode && !(0, extensionValidator_1.isEngineValid)(manifest.engines.vscode, this.productService.version, this.productService.date)) {
                throw new Error(nls.localize('incompatible', "Unable to install extension '{0}' as it is not compatible with VS Code '{1}'.", (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name), this.productService.version));
            }
            return this.installExtension(manifest, downloadLocation, options);
        }
        async updateMetadata(local, metadata) {
            this.logService.trace('ExtensionManagementService#updateMetadata', local.identifier.id);
            const localMetadata = Object.assign({}, metadata);
            if (metadata.isPreReleaseVersion) {
                localMetadata.preRelease = true;
            }
            local = await this.extensionsScanner.updateMetadata(local, localMetadata);
            this.manifestCache.invalidate();
            return local;
        }
        async updateExtensionScope(local, isMachineScoped) {
            this.logService.trace('ExtensionManagementService#updateExtensionScope', local.identifier.id);
            local = await this.extensionsScanner.updateMetadata(local, { isMachineScoped });
            this.manifestCache.invalidate();
            return local;
        }
        removeDeprecatedExtensions() {
            return this.extensionsScanner.cleanUp();
        }
        async downloadVsix(vsix) {
            if (vsix.scheme === network_1.Schemas.file) {
                return vsix;
            }
            const downloadedLocation = (0, resources_1.joinPath)(this.environmentService.tmpDir, (0, uuid_1.generateUuid)());
            await this.downloadService.download(vsix, downloadedLocation);
            return downloadedLocation;
        }
        createInstallExtensionTask(manifest, extension, options) {
            return uri_1.URI.isUri(extension) ? new InstallVSIXTask(manifest, extension, options, this.galleryService, this.extensionsScanner, this.logService) : new InstallGalleryExtensionTask(extension, options, this.extensionsDownloader, this.extensionsScanner, this.logService);
        }
        createUninstallExtensionTask(extension, options) {
            return new UninstallExtensionTask(extension, options, this.extensionsScanner);
        }
        async collectFiles(extension) {
            const collectFilesFromDirectory = async (dir) => {
                let entries = await pfs.Promises.readdir(dir);
                entries = entries.map(e => path.join(dir, e));
                const stats = await Promise.all(entries.map(e => pfs.Promises.stat(e)));
                let promise = Promise.resolve([]);
                stats.forEach((stat, index) => {
                    const entry = entries[index];
                    if (stat.isFile()) {
                        promise = promise.then(result => ([...result, entry]));
                    }
                    if (stat.isDirectory()) {
                        promise = promise
                            .then(result => collectFilesFromDirectory(entry)
                            .then(files => ([...result, ...files])));
                    }
                });
                return promise;
            };
            const files = await collectFilesFromDirectory(extension.location.fsPath);
            return files.map(f => ({ path: `extension/${path.relative(extension.location.fsPath, f)}`, localPath: f }));
        }
    };
    ExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILogService),
        __param(3, environment_1.INativeEnvironmentService),
        __param(4, download_1.IDownloadService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, files_1.IFileService),
        __param(7, productService_1.IProductService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], ExtensionManagementService);
    exports.ExtensionManagementService = ExtensionManagementService;
    let ExtensionsScanner = class ExtensionsScanner extends lifecycle_1.Disposable {
        constructor(beforeRemovingExtension, fileService, extensionsScannerService, logService) {
            super();
            this.beforeRemovingExtension = beforeRemovingExtension;
            this.fileService = fileService;
            this.extensionsScannerService = extensionsScannerService;
            this.logService = logService;
            this.uninstalledPath = (0, resources_1.joinPath)(this.extensionsScannerService.userExtensionsLocation, '.obsolete').fsPath;
            this.uninstalledFileLimiter = new async_1.Queue();
        }
        async cleanUp() {
            await this.removeUninstalledExtensions();
            await this.removeOutdatedExtensions();
        }
        async scanExtensions(type) {
            const scannedOptions = { includeInvalid: true };
            let scannedExtensions = [];
            if (type === null || type === 0 /* ExtensionType.System */) {
                scannedExtensions.push(...await this.extensionsScannerService.scanAllExtensions(scannedOptions));
            }
            else if (type === 1 /* ExtensionType.User */) {
                scannedExtensions.push(...await this.extensionsScannerService.scanUserExtensions(scannedOptions));
            }
            scannedExtensions = type !== null ? scannedExtensions.filter(r => r.type === type) : scannedExtensions;
            return Promise.all(scannedExtensions.map(extension => this.toLocalExtension(extension)));
        }
        async scanUserExtensions(excludeOutdated) {
            const scannedExtensions = await this.extensionsScannerService.scanUserExtensions({ includeAllVersions: !excludeOutdated, includeInvalid: true });
            return Promise.all(scannedExtensions.map(extension => this.toLocalExtension(extension)));
        }
        async extractUserExtension(extensionKey, zipPath, metadata, token) {
            const folderName = extensionKey.toString();
            const tempPath = path.join(this.extensionsScannerService.userExtensionsLocation.fsPath, `.${(0, uuid_1.generateUuid)()}`);
            const extensionPath = path.join(this.extensionsScannerService.userExtensionsLocation.fsPath, folderName);
            try {
                await pfs.Promises.rm(extensionPath);
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError(nls.localize('errorDeleting', "Unable to delete the existing folder '{0}' while installing the extension '{1}'. Please delete the folder manually and try again", extensionPath, extensionKey.id), extensionManagement_1.ExtensionManagementErrorCode.Delete);
            }
            await this.extractAtLocation(extensionKey, zipPath, tempPath, token);
            await this.extensionsScannerService.updateMetadata(uri_1.URI.file(tempPath), Object.assign(Object.assign({}, metadata), { installedTimestamp: Date.now() }));
            try {
                await this.rename(extensionKey, tempPath, extensionPath, Date.now() + (2 * 60 * 1000) /* Retry for 2 minutes */);
                this.logService.info('Renamed to', extensionPath);
            }
            catch (error) {
                try {
                    await pfs.Promises.rm(tempPath);
                }
                catch (e) { /* ignore */ }
                if (error.code === 'ENOTEMPTY') {
                    this.logService.info(`Rename failed because extension was installed by another source. So ignoring renaming.`, extensionKey.id);
                }
                else {
                    this.logService.info(`Rename failed because of ${(0, errors_1.getErrorMessage)(error)}. Deleted from extracted location`, tempPath);
                    throw error;
                }
            }
            return this.scanLocalExtension(uri_1.URI.file(extensionPath), 1 /* ExtensionType.User */);
        }
        async updateMetadata(local, metadata) {
            await this.extensionsScannerService.updateMetadata(local.location, metadata);
            return this.scanLocalExtension(local.location, local.type);
        }
        getUninstalledExtensions() {
            return this.withUninstalledExtensions();
        }
        async setUninstalled(...extensions) {
            const extensionKeys = extensions.map(e => extensionManagementUtil_1.ExtensionKey.create(e));
            await this.withUninstalledExtensions(uninstalled => {
                extensionKeys.forEach(extensionKey => uninstalled[extensionKey.toString()] = true);
            });
        }
        async setInstalled(extensionKey) {
            await this.withUninstalledExtensions(uninstalled => delete uninstalled[extensionKey.toString()]);
            const userExtensions = await this.scanUserExtensions(true);
            const localExtension = userExtensions.find(i => extensionManagementUtil_1.ExtensionKey.create(i).equals(extensionKey)) || null;
            if (!localExtension) {
                return null;
            }
            return this.updateMetadata(localExtension, { installedTimestamp: Date.now() });
        }
        async removeExtension(extension, type) {
            this.logService.trace(`Deleting ${type} extension from disk`, extension.identifier.id, extension.location.fsPath);
            await pfs.Promises.rm(extension.location.fsPath);
            this.logService.info('Deleted from disk', extension.identifier.id, extension.location.fsPath);
        }
        async removeUninstalledExtension(extension) {
            await this.removeExtension(extension, 'uninstalled');
            await this.withUninstalledExtensions(uninstalled => delete uninstalled[extensionManagementUtil_1.ExtensionKey.create(extension).toString()]);
        }
        async withUninstalledExtensions(updateFn) {
            return this.uninstalledFileLimiter.queue(async () => {
                let raw;
                try {
                    raw = await pfs.Promises.readFile(this.uninstalledPath, 'utf8');
                }
                catch (err) {
                    if (err.code !== 'ENOENT') {
                        throw err;
                    }
                }
                let uninstalled = {};
                if (raw) {
                    try {
                        uninstalled = JSON.parse(raw);
                    }
                    catch (e) { /* ignore */ }
                }
                if (updateFn) {
                    updateFn(uninstalled);
                    if (Object.keys(uninstalled).length) {
                        await pfs.Promises.writeFile(this.uninstalledPath, JSON.stringify(uninstalled));
                    }
                    else {
                        await pfs.Promises.rm(this.uninstalledPath);
                    }
                }
                return uninstalled;
            });
        }
        async extractAtLocation(identifier, zipPath, location, token) {
            this.logService.trace(`Started extracting the extension from ${zipPath} to ${location}`);
            // Clean the location
            try {
                await pfs.Promises.rm(location);
            }
            catch (e) {
                throw new extensionManagement_1.ExtensionManagementError(this.joinErrors(e).message, extensionManagement_1.ExtensionManagementErrorCode.Delete);
            }
            try {
                await (0, zip_1.extract)(zipPath, location, { sourcePath: 'extension', overwrite: true }, token);
                this.logService.info(`Extracted extension to ${location}:`, identifier.id);
            }
            catch (e) {
                try {
                    await pfs.Promises.rm(location);
                }
                catch (e) { /* Ignore */ }
                let errorCode = extensionManagement_1.ExtensionManagementErrorCode.Extract;
                if (e instanceof zip_1.ExtractError) {
                    if (e.type === 'CorruptZip') {
                        errorCode = extensionManagement_1.ExtensionManagementErrorCode.CorruptZip;
                    }
                    else if (e.type === 'Incomplete') {
                        errorCode = extensionManagement_1.ExtensionManagementErrorCode.IncompleteZip;
                    }
                }
                throw new extensionManagement_1.ExtensionManagementError(e.message, errorCode);
            }
        }
        async rename(identifier, extractPath, renamePath, retryUntil) {
            try {
                await pfs.Promises.rename(extractPath, renamePath);
            }
            catch (error) {
                if (platform_1.isWindows && error && error.code === 'EPERM' && Date.now() < retryUntil) {
                    this.logService.info(`Failed renaming ${extractPath} to ${renamePath} with 'EPERM' error. Trying again...`, identifier.id);
                    return this.rename(identifier, extractPath, renamePath, retryUntil);
                }
                throw new extensionManagement_1.ExtensionManagementError(error.message || nls.localize('renameError', "Unknown error while renaming {0} to {1}", extractPath, renamePath), error.code || extensionManagement_1.ExtensionManagementErrorCode.Rename);
            }
        }
        async scanLocalExtension(location, type) {
            const scannedExtension = await this.extensionsScannerService.scanExistingExtension(location, type, { includeInvalid: true });
            if (scannedExtension) {
                return this.toLocalExtension(scannedExtension);
            }
            throw new Error(nls.localize('cannot read', "Cannot read the extension from {0}", location.path));
        }
        async toLocalExtension(extension) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const stat = await this.fileService.resolve(extension.location);
            let readmeUrl;
            let changelogUrl;
            if (stat.children) {
                readmeUrl = (_a = stat.children.find(({ name }) => /^readme(\.txt|\.md|)$/i.test(name))) === null || _a === void 0 ? void 0 : _a.resource;
                changelogUrl = (_b = stat.children.find(({ name }) => /^changelog(\.txt|\.md|)$/i.test(name))) === null || _b === void 0 ? void 0 : _b.resource;
            }
            return {
                identifier: extension.identifier,
                type: extension.type,
                isBuiltin: extension.isBuiltin || !!((_c = extension.metadata) === null || _c === void 0 ? void 0 : _c.isBuiltin),
                location: extension.location,
                manifest: extension.manifest,
                targetPlatform: extension.targetPlatform,
                validations: extension.validations,
                isValid: extension.isValid,
                readmeUrl,
                changelogUrl,
                publisherDisplayName: ((_d = extension.metadata) === null || _d === void 0 ? void 0 : _d.publisherDisplayName) || null,
                publisherId: ((_e = extension.metadata) === null || _e === void 0 ? void 0 : _e.publisherId) || null,
                isMachineScoped: !!((_f = extension.metadata) === null || _f === void 0 ? void 0 : _f.isMachineScoped),
                isPreReleaseVersion: !!((_g = extension.metadata) === null || _g === void 0 ? void 0 : _g.isPreReleaseVersion),
                preRelease: !!((_h = extension.metadata) === null || _h === void 0 ? void 0 : _h.preRelease),
                installedTimestamp: (_j = extension.metadata) === null || _j === void 0 ? void 0 : _j.installedTimestamp,
                updated: !!((_k = extension.metadata) === null || _k === void 0 ? void 0 : _k.updated),
            };
        }
        async removeUninstalledExtensions() {
            const uninstalled = await this.getUninstalledExtensions();
            const extensions = await this.extensionsScannerService.scanUserExtensions({ includeAllVersions: true, includeUninstalled: true, includeInvalid: true }); // All user extensions
            const installed = new Set();
            for (const e of extensions) {
                if (!uninstalled[extensionManagementUtil_1.ExtensionKey.create(e).toString()]) {
                    installed.add(e.identifier.id.toLowerCase());
                }
            }
            const byExtension = (0, extensionManagementUtil_1.groupByExtension)(extensions, e => e.identifier);
            await async_1.Promises.settled(byExtension.map(async (e) => {
                const latest = e.sort((a, b) => semver.rcompare(a.manifest.version, b.manifest.version))[0];
                if (!installed.has(latest.identifier.id.toLowerCase())) {
                    await this.beforeRemovingExtension(await this.toLocalExtension(latest));
                }
            }));
            const toRemove = extensions.filter(e => uninstalled[extensionManagementUtil_1.ExtensionKey.create(e).toString()]);
            await async_1.Promises.settled(toRemove.map(e => this.removeUninstalledExtension(e)));
        }
        async removeOutdatedExtensions() {
            const extensions = await this.extensionsScannerService.scanUserExtensions({ includeAllVersions: true, includeUninstalled: true, includeInvalid: true }); // All user extensions
            const toRemove = [];
            // Outdated extensions
            const targetPlatform = await this.extensionsScannerService.getTargetPlatform();
            const byExtension = (0, extensionManagementUtil_1.groupByExtension)(extensions, e => e.identifier);
            toRemove.push(...byExtension.map(p => p.sort((a, b) => {
                const vcompare = semver.rcompare(a.manifest.version, b.manifest.version);
                if (vcompare !== 0) {
                    return vcompare;
                }
                if (a.targetPlatform === targetPlatform) {
                    return -1;
                }
                return 1;
            }).slice(1)).flat());
            await async_1.Promises.settled(toRemove.map(extension => this.removeExtension(extension, 'outdated')));
        }
        joinErrors(errorOrErrors) {
            const errors = Array.isArray(errorOrErrors) ? errorOrErrors : [errorOrErrors];
            if (errors.length === 1) {
                return errors[0] instanceof Error ? errors[0] : new Error(errors[0]);
            }
            return errors.reduce((previousValue, currentValue) => {
                return new Error(`${previousValue.message}${previousValue.message ? ',' : ''}${currentValue instanceof Error ? currentValue.message : currentValue}`);
            }, new Error(''));
        }
    };
    ExtensionsScanner = __decorate([
        __param(1, files_1.IFileService),
        __param(2, extensionsScannerService_1.IExtensionsScannerService),
        __param(3, log_1.ILogService)
    ], ExtensionsScanner);
    class AbstractInstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        constructor(identifier, source, options, extensionsScanner, logService) {
            super();
            this.identifier = identifier;
            this.source = source;
            this.options = options;
            this.extensionsScanner = extensionsScanner;
            this.logService = logService;
            this._operation = 2 /* InstallOperation.Install */;
        }
        get operation() { return (0, types_1.isUndefined)(this.options.operation) ? this._operation : this.options.operation; }
        async installExtension(installableExtension, token) {
            try {
                const local = await this.unsetUninstalledAndGetLocal(installableExtension.key);
                if (local) {
                    return installableExtension.metadata ? this.extensionsScanner.updateMetadata(local, installableExtension.metadata) : local;
                }
            }
            catch (e) {
                if (platform_1.isMacintosh) {
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('quitCode', "Unable to install the extension. Please Quit and Start VS Code before reinstalling."), extensionManagement_1.ExtensionManagementErrorCode.Internal);
                }
                else {
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('exitCode', "Unable to install the extension. Please Exit and Start VS Code before reinstalling."), extensionManagement_1.ExtensionManagementErrorCode.Internal);
                }
            }
            return this.extract(installableExtension, token);
        }
        async unsetUninstalledAndGetLocal(extensionKey) {
            const isUninstalled = await this.isUninstalled(extensionKey);
            if (!isUninstalled) {
                return null;
            }
            this.logService.trace('Removing the extension from uninstalled list:', extensionKey.id);
            // If the same version of extension is marked as uninstalled, remove it from there and return the local.
            const local = await this.extensionsScanner.setInstalled(extensionKey);
            this.logService.info('Removed the extension from uninstalled list:', extensionKey.id);
            return local;
        }
        async isUninstalled(extensionId) {
            const uninstalled = await this.extensionsScanner.getUninstalledExtensions();
            return !!uninstalled[extensionId.toString()];
        }
        async extract({ zipPath, key, metadata }, token) {
            let local = await this.extensionsScanner.extractUserExtension(key, zipPath, metadata, token);
            this.logService.info('Extracting completed.', key.id);
            return local;
        }
    }
    class InstallGalleryExtensionTask extends AbstractInstallExtensionTask {
        constructor(gallery, options, extensionsDownloader, extensionsScanner, logService) {
            super(gallery.identifier, gallery, options, extensionsScanner, logService);
            this.gallery = gallery;
            this.extensionsDownloader = extensionsDownloader;
        }
        async doRun(token) {
            const installed = await this.extensionsScanner.scanExtensions(null);
            const existingExtension = installed.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, this.gallery.identifier));
            if (existingExtension) {
                this._operation = 3 /* InstallOperation.Update */;
            }
            const installableExtension = await this.downloadInstallableExtension(this.gallery, this._operation);
            installableExtension.metadata.isMachineScoped = this.options.isMachineScoped || (existingExtension === null || existingExtension === void 0 ? void 0 : existingExtension.isMachineScoped);
            installableExtension.metadata.isBuiltin = this.options.isBuiltin || (existingExtension === null || existingExtension === void 0 ? void 0 : existingExtension.isBuiltin);
            installableExtension.metadata.isSystem = (existingExtension === null || existingExtension === void 0 ? void 0 : existingExtension.type) === 0 /* ExtensionType.System */ ? true : undefined;
            installableExtension.metadata.updated = !!existingExtension;
            installableExtension.metadata.isPreReleaseVersion = this.gallery.properties.isPreReleaseVersion;
            installableExtension.metadata.preRelease = this.gallery.properties.isPreReleaseVersion ||
                ((0, types_1.isBoolean)(this.options.installPreReleaseVersion)
                    ? this.options.installPreReleaseVersion /* Respect the passed flag */
                    : existingExtension === null || existingExtension === void 0 ? void 0 : existingExtension.preRelease /* Respect the existing pre-release flag if it was set */);
            try {
                const local = await this.installExtension(installableExtension, token);
                if (existingExtension && (existingExtension.targetPlatform !== local.targetPlatform || semver.neq(existingExtension.manifest.version, local.manifest.version))) {
                    await this.extensionsScanner.setUninstalled(existingExtension);
                }
                return local;
            }
            catch (error) {
                await this.deleteDownloadedVSIX(installableExtension.zipPath);
                throw error;
            }
        }
        async deleteDownloadedVSIX(vsix) {
            try {
                await this.extensionsDownloader.delete(uri_1.URI.file(vsix));
            }
            catch (error) {
                /* Ignore */
                this.logService.warn('Error while deleting the downloaded vsix', vsix.toString(), (0, errors_1.getErrorMessage)(error));
            }
        }
        async downloadInstallableExtension(extension, operation) {
            const metadata = {
                id: extension.identifier.uuid,
                publisherId: extension.publisherId,
                publisherDisplayName: extension.publisherDisplayName,
                targetPlatform: extension.properties.targetPlatform
            };
            let zipPath;
            try {
                this.logService.trace('Started downloading extension:', extension.identifier.id);
                zipPath = (await this.extensionsDownloader.downloadExtension(extension, operation)).fsPath;
                this.logService.info('Downloaded extension:', extension.identifier.id, zipPath);
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError((0, abstractExtensionManagementService_1.joinErrors)(error).message, extensionManagement_1.ExtensionManagementErrorCode.Download);
            }
            try {
                await (0, extensionManagementUtil_2.getManifest)(zipPath);
                return { zipPath, key: extensionManagementUtil_1.ExtensionKey.create(extension), metadata };
            }
            catch (error) {
                await this.deleteDownloadedVSIX(zipPath);
                throw new extensionManagement_1.ExtensionManagementError((0, abstractExtensionManagementService_1.joinErrors)(error).message, extensionManagement_1.ExtensionManagementErrorCode.Invalid);
            }
        }
    }
    class InstallVSIXTask extends AbstractInstallExtensionTask {
        constructor(manifest, location, options, galleryService, extensionsScanner, logService) {
            super({ id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) }, location, options, extensionsScanner, logService);
            this.manifest = manifest;
            this.location = location;
            this.galleryService = galleryService;
        }
        async doRun(token) {
            const extensionKey = new extensionManagementUtil_1.ExtensionKey(this.identifier, this.manifest.version);
            const installedExtensions = await this.extensionsScanner.scanExtensions(1 /* ExtensionType.User */);
            const existing = installedExtensions.find(i => (0, extensionManagementUtil_1.areSameExtensions)(this.identifier, i.identifier));
            const metadata = await this.getMetadata(this.identifier.id, this.manifest.version, token);
            metadata.isMachineScoped = this.options.isMachineScoped || (existing === null || existing === void 0 ? void 0 : existing.isMachineScoped);
            metadata.isBuiltin = this.options.isBuiltin || (existing === null || existing === void 0 ? void 0 : existing.isBuiltin);
            if (existing) {
                this._operation = 3 /* InstallOperation.Update */;
                if (extensionKey.equals(new extensionManagementUtil_1.ExtensionKey(existing.identifier, existing.manifest.version))) {
                    try {
                        await this.extensionsScanner.removeExtension(existing, 'existing');
                    }
                    catch (e) {
                        throw new Error(nls.localize('restartCode', "Please restart VS Code before reinstalling {0}.", this.manifest.displayName || this.manifest.name));
                    }
                }
                else if (semver.gt(existing.manifest.version, this.manifest.version)) {
                    await this.extensionsScanner.setUninstalled(existing);
                }
            }
            else {
                // Remove the extension with same version if it is already uninstalled.
                // Installing a VSIX extension shall replace the existing extension always.
                const existing = await this.unsetUninstalledAndGetLocal(extensionKey);
                if (existing) {
                    try {
                        await this.extensionsScanner.removeExtension(existing, 'existing');
                    }
                    catch (e) {
                        throw new Error(nls.localize('restartCode', "Please restart VS Code before reinstalling {0}.", this.manifest.displayName || this.manifest.name));
                    }
                }
            }
            return this.installExtension({ zipPath: path.resolve(this.location.fsPath), key: extensionKey, metadata }, token);
        }
        async getMetadata(id, version, token) {
            try {
                let [galleryExtension] = await this.galleryService.getExtensions([{ id, version }], token);
                if (!galleryExtension) {
                    [galleryExtension] = await this.galleryService.getExtensions([{ id }], token);
                }
                if (galleryExtension) {
                    return {
                        id: galleryExtension.identifier.uuid,
                        publisherDisplayName: galleryExtension.publisherDisplayName,
                        publisherId: galleryExtension.publisherId,
                        isPreReleaseVersion: galleryExtension.properties.isPreReleaseVersion,
                        preRelease: galleryExtension.properties.isPreReleaseVersion || this.options.installPreReleaseVersion
                    };
                }
            }
            catch (error) {
                /* Ignore Error */
            }
            return {};
        }
    }
    class UninstallExtensionTask extends abstractExtensionManagementService_1.AbstractExtensionTask {
        constructor(extension, options, extensionsScanner) {
            super();
            this.extension = extension;
            this.options = options;
            this.extensionsScanner = extensionsScanner;
        }
        async doRun(token) {
            const toUninstall = [];
            const userExtensions = await this.extensionsScanner.scanUserExtensions(false);
            if (this.options.versionOnly) {
                const extensionKey = extensionManagementUtil_1.ExtensionKey.create(this.extension);
                toUninstall.push(...userExtensions.filter(u => extensionKey.equals(extensionManagementUtil_1.ExtensionKey.create(u))));
            }
            else {
                toUninstall.push(...userExtensions.filter(u => (0, extensionManagementUtil_1.areSameExtensions)(u.identifier, this.extension.identifier)));
            }
            if (!toUninstall.length) {
                throw new Error(nls.localize('notInstalled', "Extension '{0}' is not installed.", this.extension.manifest.displayName || this.extension.manifest.name));
            }
            await this.extensionsScanner.setUninstalled(...toUninstall);
            if (this.options.remove) {
                for (const extension of toUninstall) {
                    try {
                        if (!token.isCancellationRequested) {
                            await this.extensionsScanner.removeUninstalledExtension(extension);
                        }
                    }
                    catch (e) {
                        throw new Error(nls.localize('removeError', "Error while removing the extension: {0}. Please Quit and Start VS Code before trying again.", (0, errorMessage_1.toErrorMessage)(e)));
                    }
                }
            }
        }
    }
});
//# sourceMappingURL=extensionManagementService.js.map