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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry"], function (require, exports, arrays_1, async_1, cancellation_1, errors_1, event_1, lifecycle_1, platform_1, uri_1, nls, extensionManagement_1, extensionManagementUtil_1, log_1, productService_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionTask = exports.reportTelemetry = exports.joinErrors = exports.AbstractExtensionManagementService = void 0;
    let AbstractExtensionManagementService = class AbstractExtensionManagementService extends lifecycle_1.Disposable {
        constructor(galleryService, telemetryService, logService, productService) {
            super();
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.productService = productService;
            this.lastReportTimestamp = 0;
            this.installingExtensions = new Map();
            this.uninstallingExtensions = new Map();
            this._onInstallExtension = this._register(new event_1.Emitter());
            this.onInstallExtension = this._onInstallExtension.event;
            this._onDidInstallExtensions = this._register(new event_1.Emitter());
            this.onDidInstallExtensions = this._onDidInstallExtensions.event;
            this._onUninstallExtension = this._register(new event_1.Emitter());
            this.onUninstallExtension = this._onUninstallExtension.event;
            this._onDidUninstallExtension = this._register(new event_1.Emitter());
            this.onDidUninstallExtension = this._onDidUninstallExtension.event;
            this.participants = [];
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.installingExtensions.forEach(task => task.cancel());
                this.uninstallingExtensions.forEach(promise => promise.cancel());
                this.installingExtensions.clear();
                this.uninstallingExtensions.clear();
            }));
        }
        async canInstall(extension) {
            const currentTargetPlatform = await this.getTargetPlatform();
            return extension.allTargetPlatforms.some(targetPlatform => (0, extensionManagement_1.isTargetPlatformCompatible)(targetPlatform, extension.allTargetPlatforms, currentTargetPlatform));
        }
        async installFromGallery(extension, options = {}) {
            try {
                if (!this.galleryService.isEnabled()) {
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('MarketPlaceDisabled', "Marketplace is not enabled"), extensionManagement_1.ExtensionManagementErrorCode.Internal);
                }
                const compatible = await this.checkAndGetCompatibleVersion(extension, !options.installGivenVersion, !!options.installPreReleaseVersion);
                return await this.installExtension(compatible.manifest, compatible.extension, options);
            }
            catch (error) {
                reportTelemetry(this.telemetryService, 'extensionGallery:install', { extensionData: (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(extension), error });
                this.logService.error(`Failed to install extension.`, extension.identifier.id);
                this.logService.error(error);
                throw toExtensionManagementError(error);
            }
        }
        async uninstall(extension, options = {}) {
            this.logService.trace('ExtensionManagementService#uninstall', extension.identifier.id);
            return this.unininstallExtension(extension, options);
        }
        async reinstallFromGallery(extension) {
            this.logService.trace('ExtensionManagementService#reinstallFromGallery', extension.identifier.id);
            if (!this.galleryService.isEnabled()) {
                throw new Error(nls.localize('MarketPlaceDisabled', "Marketplace is not enabled"));
            }
            const targetPlatform = await this.getTargetPlatform();
            const [galleryExtension] = await this.galleryService.getExtensions([Object.assign(Object.assign({}, extension.identifier), { preRelease: extension.preRelease })], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
            if (!galleryExtension) {
                throw new Error(nls.localize('Not a Marketplace extension', "Only Marketplace Extensions can be reinstalled"));
            }
            await this.createUninstallExtensionTask(extension, { remove: true, versionOnly: true }).run();
            await this.installFromGallery(galleryExtension);
        }
        getExtensionsControlManifest() {
            const now = new Date().getTime();
            if (!this.extensionsControlManifest || now - this.lastReportTimestamp > 1000 * 60 * 5) { // 5 minute cache freshness
                this.extensionsControlManifest = this.updateControlCache();
                this.lastReportTimestamp = now;
            }
            return this.extensionsControlManifest;
        }
        registerParticipant(participant) {
            this.participants.push(participant);
        }
        async installExtension(manifest, extension, options) {
            var _a;
            // only cache gallery extensions tasks
            if (!uri_1.URI.isUri(extension)) {
                let installExtensionTask = this.installingExtensions.get(extensionManagementUtil_1.ExtensionKey.create(extension).toString());
                if (installExtensionTask) {
                    this.logService.info('Extensions is already requested to install', extension.identifier.id);
                    return installExtensionTask.waitUntilTaskIsFinished();
                }
                options = Object.assign(Object.assign({}, options), { installOnlyNewlyAddedFromExtensionPack: true /* always true for gallery extensions */ });
            }
            const allInstallExtensionTasks = [];
            const installResults = [];
            const installExtensionTask = this.createInstallExtensionTask(manifest, extension, options);
            if (!uri_1.URI.isUri(extension)) {
                this.installingExtensions.set(extensionManagementUtil_1.ExtensionKey.create(extension).toString(), installExtensionTask);
            }
            this._onInstallExtension.fire({ identifier: installExtensionTask.identifier, source: extension });
            this.logService.info('Installing extension:', installExtensionTask.identifier.id);
            allInstallExtensionTasks.push({ task: installExtensionTask, manifest });
            let installExtensionHasDependents = false;
            try {
                if (options.donotIncludePackAndDependencies) {
                    this.logService.info('Installing the extension without checking dependencies and pack', installExtensionTask.identifier.id);
                }
                else {
                    try {
                        const allDepsAndPackExtensionsToInstall = await this.getAllDepsAndPackExtensionsToInstall(installExtensionTask.identifier, manifest, !!options.installOnlyNewlyAddedFromExtensionPack, !!options.installPreReleaseVersion);
                        for (const { gallery, manifest } of allDepsAndPackExtensionsToInstall) {
                            installExtensionHasDependents = installExtensionHasDependents || !!((_a = manifest.extensionDependencies) === null || _a === void 0 ? void 0 : _a.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, installExtensionTask.identifier)));
                            const key = extensionManagementUtil_1.ExtensionKey.create(gallery).toString();
                            if (this.installingExtensions.has(key)) {
                                this.logService.info('Extension is already requested to install', gallery.identifier.id);
                            }
                            else {
                                const task = this.createInstallExtensionTask(manifest, gallery, Object.assign(Object.assign({}, options), { donotIncludePackAndDependencies: true }));
                                this.installingExtensions.set(key, task);
                                this._onInstallExtension.fire({ identifier: task.identifier, source: gallery });
                                this.logService.info('Installing extension:', task.identifier.id);
                                allInstallExtensionTasks.push({ task, manifest });
                            }
                        }
                    }
                    catch (error) {
                        // Installing through VSIX
                        if (uri_1.URI.isUri(installExtensionTask.source)) {
                            // Ignore installing dependencies and packs
                            if ((0, arrays_1.isNonEmptyArray)(manifest.extensionDependencies)) {
                                this.logService.warn(`Cannot install dependencies of extension:`, installExtensionTask.identifier.id, error.message);
                            }
                            if ((0, arrays_1.isNonEmptyArray)(manifest.extensionPack)) {
                                this.logService.warn(`Cannot install packed extensions of extension:`, installExtensionTask.identifier.id, error.message);
                            }
                        }
                        else {
                            this.logService.error('Error while preparing to install dependencies and extension packs of the extension:', installExtensionTask.identifier.id);
                            throw error;
                        }
                    }
                }
                const extensionsToInstallMap = allInstallExtensionTasks.reduce((result, { task, manifest }) => {
                    result.set(task.identifier.id.toLowerCase(), { task, manifest });
                    return result;
                }, new Map());
                while (extensionsToInstallMap.size) {
                    let extensionsToInstall;
                    const extensionsWithoutDepsToInstall = [...extensionsToInstallMap.values()].filter(({ manifest }) => { var _a; return !((_a = manifest.extensionDependencies) === null || _a === void 0 ? void 0 : _a.some(id => extensionsToInstallMap.has(id.toLowerCase()))); });
                    if (extensionsWithoutDepsToInstall.length) {
                        extensionsToInstall = extensionsToInstallMap.size === 1 ? extensionsWithoutDepsToInstall
                            /* If the main extension has no dependents remove it and install it at the end */
                            : extensionsWithoutDepsToInstall.filter(({ task }) => !(task === installExtensionTask && !installExtensionHasDependents));
                    }
                    else {
                        this.logService.info('Found extensions with circular dependencies', extensionsWithoutDepsToInstall.map(({ task }) => task.identifier.id));
                        extensionsToInstall = [...extensionsToInstallMap.values()];
                    }
                    // Install extensions in parallel and wait until all extensions are installed / failed
                    await this.joinAllSettled(extensionsToInstall.map(async ({ task }) => {
                        const startTime = new Date().getTime();
                        try {
                            const local = await task.run();
                            await this.joinAllSettled(this.participants.map(participant => participant.postInstall(local, task.source, options, cancellation_1.CancellationToken.None)));
                            if (!uri_1.URI.isUri(task.source)) {
                                const isUpdate = task.operation === 3 /* InstallOperation.Update */;
                                reportTelemetry(this.telemetryService, isUpdate ? 'extensionGallery:update' : 'extensionGallery:install', {
                                    extensionData: (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(task.source),
                                    duration: new Date().getTime() - startTime,
                                    durationSinceUpdate: isUpdate ? undefined : new Date().getTime() - task.source.lastUpdated
                                });
                                // In web, report extension install statistics explicitly. In Desktop, statistics are automatically updated while downloading the VSIX.
                                if (platform_1.isWeb && task.operation !== 3 /* InstallOperation.Update */) {
                                    try {
                                        await this.galleryService.reportStatistic(local.manifest.publisher, local.manifest.name, local.manifest.version, "install" /* StatisticType.Install */);
                                    }
                                    catch (error) { /* ignore */ }
                                }
                            }
                            installResults.push({ local, identifier: task.identifier, operation: task.operation, source: task.source });
                        }
                        catch (error) {
                            if (!uri_1.URI.isUri(task.source)) {
                                reportTelemetry(this.telemetryService, task.operation === 3 /* InstallOperation.Update */ ? 'extensionGallery:update' : 'extensionGallery:install', { extensionData: (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(task.source), duration: new Date().getTime() - startTime, error });
                            }
                            this.logService.error('Error while installing the extension:', task.identifier.id);
                            throw error;
                        }
                        finally {
                            extensionsToInstallMap.delete(task.identifier.id.toLowerCase());
                        }
                    }));
                }
                installResults.forEach(({ identifier }) => this.logService.info(`Extension installed successfully:`, identifier.id));
                this._onDidInstallExtensions.fire(installResults);
                return installResults.filter(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, installExtensionTask.identifier))[0].local;
            }
            catch (error) {
                // cancel all tasks
                allInstallExtensionTasks.forEach(({ task }) => task.cancel());
                // rollback installed extensions
                if (installResults.length) {
                    try {
                        const result = await Promise.allSettled(installResults.map(({ local }) => this.createUninstallExtensionTask(local, { versionOnly: true }).run()));
                        for (let index = 0; index < result.length; index++) {
                            const r = result[index];
                            const { identifier } = installResults[index];
                            if (r.status === 'fulfilled') {
                                this.logService.info('Rollback: Uninstalled extension', identifier.id);
                            }
                            else {
                                this.logService.warn('Rollback: Error while uninstalling extension', identifier.id, (0, errors_1.getErrorMessage)(r.reason));
                            }
                        }
                    }
                    catch (error) {
                        // ignore error
                        this.logService.warn('Error while rolling back extensions', (0, errors_1.getErrorMessage)(error), installResults.map(({ identifier }) => identifier.id));
                    }
                }
                this._onDidInstallExtensions.fire(allInstallExtensionTasks.map(({ task }) => ({ identifier: task.identifier, operation: 2 /* InstallOperation.Install */, source: task.source })));
                throw error;
            }
            finally {
                /* Remove the gallery tasks from the cache */
                for (const { task } of allInstallExtensionTasks) {
                    if (!uri_1.URI.isUri(task.source)) {
                        const key = extensionManagementUtil_1.ExtensionKey.create(task.source).toString();
                        if (!this.installingExtensions.delete(key)) {
                            this.logService.warn('Installation task is not found in the cache', key);
                        }
                    }
                }
            }
        }
        async joinAllSettled(promises) {
            const results = [];
            const errors = [];
            const promiseResults = await Promise.allSettled(promises);
            for (const r of promiseResults) {
                if (r.status === 'fulfilled') {
                    results.push(r.value);
                }
                else {
                    errors.push(r.reason);
                }
            }
            // If there are errors, throw the error.
            if (errors.length) {
                throw joinErrors(errors);
            }
            return results;
        }
        async getAllDepsAndPackExtensionsToInstall(extensionIdentifier, manifest, getOnlyNewlyAddedFromExtensionPack, installPreRelease) {
            if (!this.galleryService.isEnabled()) {
                return [];
            }
            let installed = await this.getInstalled();
            const knownIdentifiers = [extensionIdentifier, ...(installed).map(i => i.identifier)];
            const allDependenciesAndPacks = [];
            const collectDependenciesAndPackExtensionsToInstall = async (extensionIdentifier, manifest) => {
                const dependecies = manifest.extensionDependencies || [];
                const dependenciesAndPackExtensions = [...dependecies];
                if (manifest.extensionPack) {
                    const existing = getOnlyNewlyAddedFromExtensionPack ? installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extensionIdentifier)) : undefined;
                    for (const extension of manifest.extensionPack) {
                        // add only those extensions which are new in currently installed extension
                        if (!(existing && existing.manifest.extensionPack && existing.manifest.extensionPack.some(old => (0, extensionManagementUtil_1.areSameExtensions)({ id: old }, { id: extension })))) {
                            if (dependenciesAndPackExtensions.every(e => !(0, extensionManagementUtil_1.areSameExtensions)({ id: e }, { id: extension }))) {
                                dependenciesAndPackExtensions.push(extension);
                            }
                        }
                    }
                }
                if (dependenciesAndPackExtensions.length) {
                    // filter out installed and known extensions
                    const identifiers = [...knownIdentifiers, ...allDependenciesAndPacks.map(r => r.gallery.identifier)];
                    const ids = dependenciesAndPackExtensions.filter(id => identifiers.every(galleryIdentifier => !(0, extensionManagementUtil_1.areSameExtensions)(galleryIdentifier, { id })));
                    if (ids.length) {
                        const galleryExtensions = await this.galleryService.getExtensions(ids.map(id => ({ id, preRelease: installPreRelease })), cancellation_1.CancellationToken.None);
                        for (const galleryExtension of galleryExtensions) {
                            if (identifiers.find(identifier => (0, extensionManagementUtil_1.areSameExtensions)(identifier, galleryExtension.identifier))) {
                                continue;
                            }
                            const isDependency = dependecies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, galleryExtension.identifier));
                            let compatible;
                            try {
                                compatible = await this.checkAndGetCompatibleVersion(galleryExtension, true, installPreRelease);
                            }
                            catch (error) {
                                if (error instanceof extensionManagement_1.ExtensionManagementError && error.code === extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform && !isDependency) {
                                    this.logService.info('Skipping the packed extension as it cannot be installed', galleryExtension.identifier.id);
                                    continue;
                                }
                                else {
                                    throw error;
                                }
                            }
                            allDependenciesAndPacks.push({ gallery: compatible.extension, manifest: compatible.manifest });
                            await collectDependenciesAndPackExtensionsToInstall(compatible.extension.identifier, compatible.manifest);
                        }
                    }
                }
            };
            await collectDependenciesAndPackExtensionsToInstall(extensionIdentifier, manifest);
            installed = await this.getInstalled();
            return allDependenciesAndPacks.filter(e => !installed.some(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, e.gallery.identifier)));
        }
        async checkAndGetCompatibleVersion(extension, fetchCompatibleVersion, installPreRelease) {
            const report = await this.getExtensionsControlManifest();
            if ((0, extensionManagementUtil_1.getMaliciousExtensionsSet)(report).has(extension.identifier.id)) {
                throw new extensionManagement_1.ExtensionManagementError(nls.localize('malicious extension', "Can't install '{0}' extension since it was reported to be problematic.", extension.identifier.id), extensionManagement_1.ExtensionManagementErrorCode.Malicious);
            }
            if (!!report.unsupportedPreReleaseExtensions && !!report.unsupportedPreReleaseExtensions[extension.identifier.id]) {
                throw new extensionManagement_1.ExtensionManagementError(nls.localize('unsupported prerelease extension', "Can't install '{0}' extension because it is no longer supported. It is now part of the '{1}' extension as a pre-release version.", extension.identifier.id, report.unsupportedPreReleaseExtensions[extension.identifier.id].displayName), extensionManagement_1.ExtensionManagementErrorCode.UnsupportedPreRelease);
            }
            if (!await this.canInstall(extension)) {
                const targetPlatform = await this.getTargetPlatform();
                throw new extensionManagement_1.ExtensionManagementError(nls.localize('incompatible platform', "The '{0}' extension is not available in {1} for {2}.", extension.identifier.id, this.productService.nameLong, (0, extensionManagement_1.TargetPlatformToString)(targetPlatform)), extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform);
            }
            const compatibleExtension = await this.getCompatibleVersion(extension, fetchCompatibleVersion, installPreRelease);
            if (compatibleExtension) {
                if (installPreRelease && fetchCompatibleVersion && extension.hasPreReleaseVersion && !compatibleExtension.properties.isPreReleaseVersion) {
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('notFoundCompatiblePrereleaseDependency', "Can't install pre-release version of '{0}' extension because it is not compatible with the current version of {1} (version {2}).", extension.identifier.id, this.productService.nameLong, this.productService.version), extensionManagement_1.ExtensionManagementErrorCode.IncompatiblePreRelease);
                }
            }
            else {
                /** If no compatible release version is found, check if the extension has a release version or not and throw relevant error */
                if (!installPreRelease && extension.properties.isPreReleaseVersion && (await this.galleryService.getExtensions([extension.identifier], cancellation_1.CancellationToken.None))[0]) {
                    throw new extensionManagement_1.ExtensionManagementError(nls.localize('notFoundReleaseExtension', "Can't install release version of '{0}' extension because it has no release version.", extension.identifier.id), extensionManagement_1.ExtensionManagementErrorCode.ReleaseVersionNotFound);
                }
                throw new extensionManagement_1.ExtensionManagementError(nls.localize('notFoundCompatibleDependency', "Can't install '{0}' extension because it is not compatible with the current version of {1} (version {2}).", extension.identifier.id, this.productService.nameLong, this.productService.version), extensionManagement_1.ExtensionManagementErrorCode.Incompatible);
            }
            this.logService.info('Getting Manifest...', compatibleExtension.identifier.id);
            const manifest = await this.galleryService.getManifest(compatibleExtension, cancellation_1.CancellationToken.None);
            if (manifest === null) {
                throw new extensionManagement_1.ExtensionManagementError(`Missing manifest for extension ${extension.identifier.id}`, extensionManagement_1.ExtensionManagementErrorCode.Invalid);
            }
            if (manifest.version !== compatibleExtension.version) {
                throw new extensionManagement_1.ExtensionManagementError(`Cannot install '${extension.identifier.id}' extension because of version mismatch in Marketplace`, extensionManagement_1.ExtensionManagementErrorCode.Invalid);
            }
            return { extension: compatibleExtension, manifest };
        }
        async getCompatibleVersion(extension, fetchCompatibleVersion, includePreRelease) {
            const targetPlatform = await this.getTargetPlatform();
            let compatibleExtension = null;
            if (fetchCompatibleVersion && extension.hasPreReleaseVersion && extension.properties.isPreReleaseVersion !== includePreRelease) {
                compatibleExtension = (await this.galleryService.getExtensions([Object.assign(Object.assign({}, extension.identifier), { preRelease: includePreRelease })], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0] || null;
            }
            if (!compatibleExtension && await this.galleryService.isExtensionCompatible(extension, includePreRelease, targetPlatform)) {
                compatibleExtension = extension;
            }
            if (!compatibleExtension && fetchCompatibleVersion) {
                compatibleExtension = await this.galleryService.getCompatibleExtension(extension, includePreRelease, targetPlatform);
            }
            return compatibleExtension;
        }
        async unininstallExtension(extension, options) {
            const uninstallExtensionTask = this.uninstallingExtensions.get(extension.identifier.id.toLowerCase());
            if (uninstallExtensionTask) {
                this.logService.info('Extensions is already requested to uninstall', extension.identifier.id);
                return uninstallExtensionTask.waitUntilTaskIsFinished();
            }
            const createUninstallExtensionTask = (extension, options) => {
                const uninstallExtensionTask = this.createUninstallExtensionTask(extension, options);
                this.uninstallingExtensions.set(uninstallExtensionTask.extension.identifier.id.toLowerCase(), uninstallExtensionTask);
                this.logService.info('Uninstalling extension:', extension.identifier.id);
                this._onUninstallExtension.fire(extension.identifier);
                return uninstallExtensionTask;
            };
            const postUninstallExtension = (extension, error) => {
                if (error) {
                    this.logService.error('Failed to uninstall extension:', extension.identifier.id, error.message);
                }
                else {
                    this.logService.info('Successfully uninstalled extension:', extension.identifier.id);
                }
                reportTelemetry(this.telemetryService, 'extensionGallery:uninstall', { extensionData: (0, extensionManagementUtil_1.getLocalExtensionTelemetryData)(extension), error });
                this._onDidUninstallExtension.fire({ identifier: extension.identifier, error: error === null || error === void 0 ? void 0 : error.code });
            };
            const allTasks = [];
            const processedTasks = [];
            try {
                allTasks.push(createUninstallExtensionTask(extension, {}));
                const installed = await this.getInstalled(1 /* ExtensionType.User */);
                if (options.donotIncludePack) {
                    this.logService.info('Uninstalling the extension without including packed extension', extension.identifier.id);
                }
                else {
                    const packedExtensions = this.getAllPackExtensionsToUninstall(extension, installed);
                    for (const packedExtension of packedExtensions) {
                        if (this.uninstallingExtensions.has(packedExtension.identifier.id.toLowerCase())) {
                            this.logService.info('Extensions is already requested to uninstall', packedExtension.identifier.id);
                        }
                        else {
                            allTasks.push(createUninstallExtensionTask(packedExtension, {}));
                        }
                    }
                }
                if (options.donotCheckDependents) {
                    this.logService.info('Uninstalling the extension without checking dependents', extension.identifier.id);
                }
                else {
                    this.checkForDependents(allTasks.map(task => task.extension), installed, extension);
                }
                // Uninstall extensions in parallel and wait until all extensions are uninstalled / failed
                await this.joinAllSettled(allTasks.map(async (task) => {
                    try {
                        await task.run();
                        await this.joinAllSettled(this.participants.map(participant => participant.postUninstall(task.extension, options, cancellation_1.CancellationToken.None)));
                        // only report if extension has a mapped gallery extension. UUID identifies the gallery extension.
                        if (task.extension.identifier.uuid) {
                            try {
                                await this.galleryService.reportStatistic(task.extension.manifest.publisher, task.extension.manifest.name, task.extension.manifest.version, "uninstall" /* StatisticType.Uninstall */);
                            }
                            catch (error) { /* ignore */ }
                        }
                        postUninstallExtension(task.extension);
                    }
                    catch (e) {
                        const error = e instanceof extensionManagement_1.ExtensionManagementError ? e : new extensionManagement_1.ExtensionManagementError((0, errors_1.getErrorMessage)(e), extensionManagement_1.ExtensionManagementErrorCode.Internal);
                        postUninstallExtension(task.extension, error);
                        throw error;
                    }
                    finally {
                        processedTasks.push(task);
                    }
                }));
            }
            catch (e) {
                const error = e instanceof extensionManagement_1.ExtensionManagementError ? e : new extensionManagement_1.ExtensionManagementError((0, errors_1.getErrorMessage)(e), extensionManagement_1.ExtensionManagementErrorCode.Internal);
                for (const task of allTasks) {
                    // cancel the tasks
                    try {
                        task.cancel();
                    }
                    catch (error) { /* ignore */ }
                    if (!processedTasks.includes(task)) {
                        postUninstallExtension(task.extension, error);
                    }
                }
                throw error;
            }
            finally {
                // Remove tasks from cache
                for (const task of allTasks) {
                    if (!this.uninstallingExtensions.delete(task.extension.identifier.id.toLowerCase())) {
                        this.logService.warn('Uninstallation task is not found in the cache', task.extension.identifier.id);
                    }
                }
            }
        }
        checkForDependents(extensionsToUninstall, installed, extensionToUninstall) {
            for (const extension of extensionsToUninstall) {
                const dependents = this.getDependents(extension, installed);
                if (dependents.length) {
                    const remainingDependents = dependents.filter(dependent => !extensionsToUninstall.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, dependent.identifier)));
                    if (remainingDependents.length) {
                        throw new Error(this.getDependentsErrorMessage(extension, remainingDependents, extensionToUninstall));
                    }
                }
            }
        }
        getDependentsErrorMessage(dependingExtension, dependents, extensionToUninstall) {
            if (extensionToUninstall === dependingExtension) {
                if (dependents.length === 1) {
                    return nls.localize('singleDependentError', "Cannot uninstall '{0}' extension. '{1}' extension depends on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
                }
                if (dependents.length === 2) {
                    return nls.localize('twoDependentsError', "Cannot uninstall '{0}' extension. '{1}' and '{2}' extensions depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
                }
                return nls.localize('multipleDependentsError', "Cannot uninstall '{0}' extension. '{1}', '{2}' and other extension depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            if (dependents.length === 1) {
                return nls.localize('singleIndirectDependentError', "Cannot uninstall '{0}' extension . It includes uninstalling '{1}' extension and '{2}' extension depends on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependingExtension.manifest.displayName
                    || dependingExtension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
            }
            if (dependents.length === 2) {
                return nls.localize('twoIndirectDependentsError', "Cannot uninstall '{0}' extension. It includes uninstalling '{1}' extension and '{2}' and '{3}' extensions depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependingExtension.manifest.displayName
                    || dependingExtension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            return nls.localize('multipleIndirectDependentsError', "Cannot uninstall '{0}' extension. It includes uninstalling '{1}' extension and '{2}', '{3}' and other extensions depend on this.", extensionToUninstall.manifest.displayName || extensionToUninstall.manifest.name, dependingExtension.manifest.displayName
                || dependingExtension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
        }
        getAllPackExtensionsToUninstall(extension, installed, checked = []) {
            if (checked.indexOf(extension) !== -1) {
                return [];
            }
            checked.push(extension);
            const extensionsPack = extension.manifest.extensionPack ? extension.manifest.extensionPack : [];
            if (extensionsPack.length) {
                const packedExtensions = installed.filter(i => !i.isBuiltin && extensionsPack.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier)));
                const packOfPackedExtensions = [];
                for (const packedExtension of packedExtensions) {
                    packOfPackedExtensions.push(...this.getAllPackExtensionsToUninstall(packedExtension, installed, checked));
                }
                return [...packedExtensions, ...packOfPackedExtensions];
            }
            return [];
        }
        getDependents(extension, installed) {
            return installed.filter(e => e.manifest.extensionDependencies && e.manifest.extensionDependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier)));
        }
        async updateControlCache() {
            try {
                this.logService.trace('ExtensionManagementService.refreshReportedCache');
                const manifest = await this.galleryService.getExtensionsControlManifest();
                this.logService.trace(`ExtensionManagementService.refreshControlCache`, manifest);
                return manifest;
            }
            catch (err) {
                this.logService.trace('ExtensionManagementService.refreshControlCache - failed to get extension control manifest');
                return { malicious: [] };
            }
        }
    };
    AbstractExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILogService),
        __param(3, productService_1.IProductService)
    ], AbstractExtensionManagementService);
    exports.AbstractExtensionManagementService = AbstractExtensionManagementService;
    function joinErrors(errorOrErrors) {
        const errors = Array.isArray(errorOrErrors) ? errorOrErrors : [errorOrErrors];
        if (errors.length === 1) {
            return errors[0] instanceof Error ? errors[0] : new Error(errors[0]);
        }
        return errors.reduce((previousValue, currentValue) => {
            return new Error(`${previousValue.message}${previousValue.message ? ',' : ''}${currentValue instanceof Error ? currentValue.message : currentValue}`);
        }, new Error(''));
    }
    exports.joinErrors = joinErrors;
    function toExtensionManagementError(error) {
        if (error instanceof extensionManagement_1.ExtensionManagementError) {
            return error;
        }
        const e = new extensionManagement_1.ExtensionManagementError(error.message, extensionManagement_1.ExtensionManagementErrorCode.Internal);
        e.stack = error.stack;
        return e;
    }
    function reportTelemetry(telemetryService, eventName, { extensionData, duration, error, durationSinceUpdate }) {
        const errorcode = error ? error instanceof extensionManagement_1.ExtensionManagementError ? error.code : extensionManagement_1.ExtensionManagementErrorCode.Internal : undefined;
        /* __GDPR__
            "extensionGallery:install" : {
                "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "durationSinceUpdate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "recommendationReason": { "retiredFromVersion": "1.23.0", "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
        */
        /* __GDPR__
            "extensionGallery:uninstall" : {
                "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
        */
        /* __GDPR__
            "extensionGallery:update" : {
                "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
        */
        telemetryService.publicLog(eventName, Object.assign(Object.assign({}, extensionData), { success: !error, duration, errorcode, durationSinceUpdate }));
    }
    exports.reportTelemetry = reportTelemetry;
    class AbstractExtensionTask {
        constructor() {
            this.barrier = new async_1.Barrier();
        }
        async waitUntilTaskIsFinished() {
            await this.barrier.wait();
            return this.cancellablePromise;
        }
        async run() {
            if (!this.cancellablePromise) {
                this.cancellablePromise = (0, async_1.createCancelablePromise)(token => this.doRun(token));
            }
            this.barrier.open();
            return this.cancellablePromise;
        }
        cancel() {
            if (!this.cancellablePromise) {
                this.cancellablePromise = (0, async_1.createCancelablePromise)(token => {
                    return new Promise((c, e) => {
                        const disposable = token.onCancellationRequested(() => {
                            disposable.dispose();
                            e(new errors_1.CancellationError());
                        });
                    });
                });
                this.barrier.open();
            }
            this.cancellablePromise.cancel();
        }
    }
    exports.AbstractExtensionTask = AbstractExtensionTask;
});
//# sourceMappingURL=abstractExtensionManagementService.js.map